/**
 * PR-0153 (round 13, stalled third review): a move whose victim is rolled must
 * not be shown as if its victim were known.
 *
 * Both intent predictors used to estimate the move against whichever character
 * the dry run's RNG happened to pick (or, for a `random-enemy` record, the
 * middle of the list the preview RNG always returns), and the panel printed
 * that one row under a SCRIPTED badge. The party's own turns move the stream
 * before the enemy acts, so the named victim was a coin toss: Chapter I's
 * Lance of Atrophy was shown on Tidus and hit Yuna and Auron, Chapter VIII's
 * Evrae Attack was shown on Wakka and KO'd Tidus.
 *
 * The fix measures it the way the move itself is measured: the samples that
 * rolled the named move are compared on their target, and a record whose
 * targeting is declared random is random by definition. Either way every
 * candidate gets its own estimated row (with its own lethal flag) in
 * `randomTarget`, and SCRIPTED keeps describing the move only.
 *
 * **Case: both games.** FFX (Chapters I, VIII, IX) was the report; the FFX-2
 * predictor had the identical shape (Chapter XI's Shiva picks `randomGirl`, and
 * the panel named Paine), and a prediction bug in shared intent plumbing is
 * "both" by CHK-020.
 */

import { beforeAll, describe, expect, it } from 'vitest';
import type { CombatantId } from '../../src/battle/common/types.ts';
import { FFXContentRegistry, createFFXEngine } from '../../src/battle/ffx/index.ts';
import { FFX2Engine } from '../../src/battle/ffx2/index.ts';
import { ALL_ABILITIES, ITEMS } from '../../src/data/ffx/index.ts';
import { getChapter } from '../../src/data/encounters.ts';
import { setupForChapter } from '../../src/app/screens/BattleScreenSetup.ts';
import { ffx2EngineOptions, registerBattleContent } from '../../src/app/screens/BattleScreenContent.ts';

interface Row { targetId: CombatantId; lethal: boolean; min: number; max: number }
interface Probe {
  enemyId: CombatantId;
  moveName: string;
  confidence: string;
  estimate: { perTarget: Row[] } | null;
  randomTarget?: { rows: Row[]; perHit: boolean } | null;
}
interface AnyEngine {
  setSeed?(seed: number): void;
  init(setup: unknown): void;
  nextDecision(): { kind: string; nextEventMs?: number };
  tick(ms: number): void;
  intent(): Probe | null;
  state(): { activeIds: CombatantId[]; combatants: Record<CombatantId, { alive: boolean; side: string }> };
}

function ffxContent(): FFXContentRegistry {
  const reg = new FFXContentRegistry();
  reg.addAbilities(ALL_ABILITIES);
  reg.addItems(Object.values(ITEMS));
  return reg;
}

/** The chapter's own setup, seed 1, advanced to the first command menu. */
function firstMenu(chapterId: string): AnyEngine {
  const chapter = getChapter(chapterId);
  if (!chapter) throw new Error(`no chapter ${chapterId}`);
  const engine = (chapter.game === 'ffx'
    ? createFFXEngine({ content: ffxContent(), autoResolveMinigames: true })
    : new FFX2Engine(ffx2EngineOptions())) as unknown as AnyEngine;
  engine.setSeed?.(1);
  engine.init(setupForChapter(chapter, 1));
  for (let i = 0; i < 10_000; i++) {
    const d = engine.nextDecision();
    if (d.kind === 'waiting') {
      engine.tick(Math.max(1, d.nextEventMs ?? 1));
      continue;
    }
    if (d.kind === 'player-input') return engine;
    if (d.kind === 'battle-over') break;
  }
  throw new Error(`${chapterId}: never reached a command menu`);
}

function livingParty(engine: AnyEngine): CombatantId[] {
  const s = engine.state();
  return s.activeIds.filter((id) => s.combatants[id]?.alive === true && s.combatants[id]?.side === 'party').sort();
}

beforeAll(async () => {
  await registerBattleContent();
});

describe('PR-0153: a rolled victim is shown as every candidate (both games)', () => {
  it('Chapter I: Lance of Atrophy lists all three members under a random target, still SCRIPTED as a move', () => {
    const engine = firstMenu('seymour-flux');
    const intent = engine.intent();
    expect(intent?.moveName).toBe('Lance of Atrophy');
    expect(intent?.confidence).toBe('scripted');
    const rows = intent?.randomTarget?.rows ?? [];
    expect(rows.map((r) => r.targetId).sort()).toEqual(livingParty(engine));
    expect(rows).toHaveLength(3);
    for (const r of rows) {
      expect(typeof r.lethal).toBe('boolean');
      expect(r.max).toBeGreaterThan(0);
    }
    expect(intent?.randomTarget?.perHit).toBe(false);
  });

  it("Chapter VIII: Evrae's random-enemy Attack lists Tidus, Wakka and Rikku, not the preview RNG's middle pick", () => {
    const engine = firstMenu('evrae-airship');
    const intent = engine.intent();
    expect(intent?.moveName).toBe('Attack');
    const ids = (intent?.randomTarget?.rows ?? []).map((r) => r.targetId).sort();
    expect(ids).toEqual(livingParty(engine));
    expect(ids).toEqual(['rikku', 'tidus', 'wakka']);
  });

  it("Chapter IX: Daigoro's random bite lists every living member", () => {
    const engine = firstMenu('yojimbo-cavern');
    const intent = engine.intent();
    const ids = (intent?.randomTarget?.rows ?? []).map((r) => r.targetId).sort();
    expect(ids).toEqual(livingParty(engine));
    expect(ids.length).toBeGreaterThan(1);
  });

  it("Chapter XI (FFX-2): Shiva's Kick at a random girl lists all three girls", () => {
    const engine = firstMenu('ffx2-fallen-aeons');
    const intent = engine.intent();
    expect(intent?.moveName).toBe('Kick');
    const ids = (intent?.randomTarget?.rows ?? []).map((r) => r.targetId).sort();
    expect(ids).toEqual(livingParty(engine));
    expect(ids).toHaveLength(3);
  });
});
