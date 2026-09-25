/**
 * **Chapter IX — Yojimbo: the content layer.** The story scenes, the chapter's
 * meta, its music wiring, its prep, and the guide and tactic the advisor and
 * the autopilot play it with.
 *
 * **Game case: FFX only** [AGENTS.md rule 14].
 *
 * The tactic is measured the way the bench measures its lines (`yojimbo-bench
 * .test.ts`), but through the shipped `intendedStrategy`, the function the
 * autopilot, the e2e specs and the strategy guide all run. **Measure, never
 * tune**: the rate is printed; only its order against the credibly wrong line
 * (0 / 200 on the bench) and the Doom route are pinned.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';

import type { BattleEngine, Command, FFXCombatant } from '../../../src/battle/common/types.ts';
import { FFXContentRegistry, createFFXEngine } from '../../../src/battle/ffx/index.ts';
import { ALL_ABILITIES, ENEMY_GROUPS_BY_ID, ITEMS } from '../../../src/data/ffx/index.ts';
import { yojimboCavernBuild } from '../../../src/data/ffx/builds/yojimbo-cavern.ts';
import { CHAPTERS, getChapter } from '../../../src/data/encounters.ts';
import { CHAPTER_META, getChapterMeta } from '../../../src/data/chapter-meta.ts';
import { YOJIMBO_META } from '../../../src/data/chapter-meta-yojimbo.ts';
import { guideForChapter } from '../../../src/data/guides/index.ts';
import { RULE_SHORT_MAX } from '../../../src/data/guides/types.ts';
import { lintScript, type SayStep, type Step } from '../../../src/story/dsl.ts';
import { yojimboCavernScripts } from '../../../src/story/scripts/yojimbo-cavern.ts';
import { intendedStrategy } from '../../../src/engine/BattlePresenterStrategies.ts';
import { buildGuideView, guideForState, stateOnlyEngine } from '../../../src/engine/tactics/guide.ts';
import { tacticFor, yojimboCavern } from '../../../src/engine/tactics/index.ts';
import { evaluateObjective } from '../../../src/ui/common/chapterObjectives.ts';

const REPO_ROOT = fileURLToPath(new URL('../../..', import.meta.url));
const ART = join(REPO_ROOT, 'public', 'art');
const CHAPTER = getChapter('yojimbo-cavern')!;
const { pre, post } = yojimboCavernScripts;

const says = (script: readonly Step[]): SayStep[] => script.filter((s): s is SayStep => s.type === 'say');

// ---------------------------------------------------------------------------
// Story
// ---------------------------------------------------------------------------

describe('the story scenes (docs/plans/yojimbo-story-draft.md, lines 1-32)', () => {
  it('is the chapter record’s story layer', () => {
    expect(CHAPTER.scriptsRef).toBe(yojimboCavernScripts);
  });

  it('passes the house lint and the 60-character cap on every line', () => {
    expect(lintScript(pre)).toEqual([]);
    expect(lintScript(post)).toEqual([]);
    for (const s of [...says(pre), ...says(post)]) expect(s.text.length, s.text).toBeLessThanOrEqual(60);
  });

  it('plays the draft’s 19 pre lines and 13 post lines, in order', () => {
    expect(says(pre)).toHaveLength(19);
    expect(says(post)).toHaveLength(13);
    expect(says(pre)[0]).toMatchObject({ who: 'lulu', text: 'There is a fayth inside. And fiends.' });
    expect(says(pre)[18]).toMatchObject({ who: 'lulu', text: 'Stand back, Yuna. This one is mine.' });
    expect(says(post)[0]).toMatchObject({ who: 'yuna', text: "She's gone. Truly, this time." });
    expect(says(post).at(-1)).toMatchObject({ who: 'lulu', text: '...Go on, Yuna. The fayth is waiting for you.' });
  });

  it('pre ends by opening the battle; post shows results', () => {
    expect(pre.at(-1)).toEqual({ type: 'battleStart' });
    expect(post.filter((s) => s.type === 'results')).toHaveLength(1);
  });

  it('Lulu has exactly one raised line, in the post scene (writing-bible §1.6, draft L-1)', () => {
    const raised = [...says(pre), ...says(post)].filter((s) => s.who === 'lulu' && s.text.endsWith('!'));
    expect(raised.map((s) => s.text)).toEqual(['I was supposed to finish it THEN!']);
  });

  it('Lady Ginnem never speaks (draft G-1: no source gives her words, no portrait)', () => {
    expect([...says(pre), ...says(post)].some((s) => (s.who as string) === 'ginnem')).toBe(false);
  });

  it('every speaker has a portrait on disk', () => {
    const speakers = new Set([...says(pre), ...says(post)].map((s) => s.who));
    for (const who of speakers) expect(existsSync(join(ART, 'portraits', `${who}.png`)), who).toBe(true);
  });

  it('carries the four mid-battle callouts (D-068; engine runs in yojimbo-callouts.test.ts), and writes no quips (grim tier)', () => {
    expect(yojimboCavernScripts.mid).toHaveLength(4);
    expect(Object.keys(yojimboCavernScripts.midScripts)).toHaveLength(4);
    expect(yojimboCavernScripts.victoryQuips).toEqual({});
  });
});

// ---------------------------------------------------------------------------
// Music
// ---------------------------------------------------------------------------

describe('music: the O-6 pick, boss-yojimbo, in the "Lulu’s Theme" slot (research §6.4)', () => {
  it('scores the battle from the chapter and from the formation', () => {
    expect(CHAPTER.music.battle).toBe('boss-yojimbo');
    expect(CHAPTER.enemyGroupRef.musicCues?.find((c) => c.at === 'start')?.track).toBe('boss-yojimbo');
    expect(CHAPTER.music.scene).toBe('scene-gagazet');
    expect(CHAPTER.music.victory).toBe('victory-ffx');
  });

  it('the pre scene opens on the stand-in and moves to boss-yojimbo when Ginnem appears, before the battle', () => {
    const cues = pre.flatMap((s, i) => (s.type === 'music' ? [{ i, track: s.track }] : []));
    expect(cues.map((c) => c.track)).toEqual(['scene-gagazet', 'boss-yojimbo']);
    const unsent = pre.findIndex((s) => s.type === 'say' && s.text === 'Unsent.');
    expect(cues[1]!.i).toBeLessThan(unsent);
  });

  it('the post scene fades the battle cue out first', () => {
    expect(post[0]).toMatchObject({ type: 'music', track: null });
  });

  it('the meta lists every cue the chapter plays', () => {
    expect([...YOJIMBO_META.musicKeys].sort()).toEqual(['boss-yojimbo', 'scene-gagazet', 'victory-ffx']);
  });
});

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

describe('chapter meta', () => {
  const manifest = JSON.parse(readFileSync(join(ART, 'manifest.json'), 'utf8')) as { pause: string[] };
  const words = (t: string) => t.trim().split(/\s+/).filter(Boolean).length;

  it('is found by id, and sits last in the listed CHAPTER_META, as the chapter sits last in CHAPTERS', () => {
    expect(getChapterMeta('yojimbo-cavern')).toBe(YOJIMBO_META);
    expect(CHAPTER_META.at(-1)).toBe(YOJIMBO_META);
    expect(CHAPTERS.at(-1)?.id).toBe('yojimbo-cavern');
  });

  it('agrees with the chapter record: FFX, Chapter IX, "Yojimbo" (D-053, D-058)', () => {
    expect(YOJIMBO_META).toMatchObject({ gameLabel: 'FFX', numeral: 'IX', title: 'Yojimbo', location: 'Cavern of the Stolen Fayth' });
    expect(CHAPTER.number).toBe(9);
  });

  it('follows the pause screen’s copy rules', () => {
    expect(words(YOJIMBO_META.subtitle)).toBeGreaterThanOrEqual(2);
    expect(words(YOJIMBO_META.subtitle)).toBeLessThanOrEqual(4);
    expect(words(YOJIMBO_META.handwritten)).toBeGreaterThanOrEqual(4);
    expect(words(YOJIMBO_META.handwritten)).toBeLessThanOrEqual(6);
    expect(words(YOJIMBO_META.quote.text)).toBeLessThan(18);
    expect((YOJIMBO_META.blurb.match(/[.!?](?:\s|$)/g) ?? []).length).toBe(2);
  });

  it('the quote is a line the pre scene actually plays', () => {
    expect(says(pre).some((s) => s.who === 'lulu' && s.text === YOJIMBO_META.quote.text)).toBe(true);
  });

  it('uses the locked art: hero plate B, the Cavern, the long-blade cast, Ginnem', () => {
    expect(YOJIMBO_META.heroArt).toBe('pause/ch9-yojimbo');
    expect(manifest.pause).toContain('ch9-yojimbo');
    expect(existsSync(join(ART, 'pause', 'ch9-yojimbo.png'))).toBe(true);
    expect(existsSync(join(ART, YOJIMBO_META.heroArtFallback))).toBe(true);
    for (const snap of YOJIMBO_META.snapshots) expect(existsSync(join(ART, snap.image)), snap.image).toBe(true);
  });

  it('objectives: Doom and the win tick on the intended line; Survive Zanmato ticks when an aeon takes it', () => {
    const engine = newEngine(1);
    playOut(engine, (id, cmds) => intendedStrategy(id, cmds, engine));
    const ctx = { log: engine.state().log, state: engine.state(), links: 1 };
    const [doom, zanmato, win] = YOJIMBO_META.objectives;
    expect(evaluateObjective(doom.rule, ctx)).toBe(true);
    expect(evaluateObjective(win.rule, ctx)).toBe(true);
    // The intended line wins before the gauge fills, so this one is the optional row.
    expect(zanmato.rule).toEqual({ kind: 'survived-ability', ability: 'yojimbo-zanmato' });
  });
});

// ---------------------------------------------------------------------------
// Prep (D-066, D-067, D-056)
// ---------------------------------------------------------------------------

describe('prep', () => {
  it('opens with Lulu, Kimahri, Yuna; no Candle of Life; Kimahri holds Doom with a full gauge', () => {
    expect(CHAPTER.buildRef).toBe(yojimboCavernBuild);
    expect(yojimboCavernBuild.activeSlots).toEqual(['lulu', 'kimahri', 'yuna']);
    expect(yojimboCavernBuild.inventory.some((e) => e.itemId === 'candle-of-life')).toBe(false);
    const kimahri = yojimboCavernBuild.members.find((m) => m.id === 'kimahri');
    expect(kimahri?.overdrive?.unlockedOverdriveIds).toContain('doom');
    expect(kimahri?.overdrive?.gauge).toBe(100);
  });
});

// ---------------------------------------------------------------------------
// Guide and tactic
// ---------------------------------------------------------------------------

const content = new FFXContentRegistry();
content.addAbilities(ALL_ABILITIES);
content.addItems(Object.values(ITEMS));

function newEngine(seed: number): BattleEngine {
  const engine = createFFXEngine({ content, autoResolveMinigames: true });
  engine.init({
    game: 'ffx', party: yojimboCavernBuild, enemies: ENEMY_GROUPS_BY_ID['yojimbo-cavern']!,
    triggers: [], seed, condition: 'normal', canEscape: false,
  });
  return engine;
}

type Chooser = (actorId: string, commands: Parameters<typeof intendedStrategy>[1]) => Command | null;

function playOut(engine: BattleEngine, choose: Chooser): void {
  for (let i = 0; i < 6000; i++) {
    const d = engine.nextDecision();
    if (d.kind === 'battle-over') return;
    if (d.kind !== 'player-input') continue;
    const c = choose(d.actorId, d.commands) ?? { kind: 'defend', targets: [] };
    engine.submit(c);
  }
}

describe('guide', () => {
  const guide = guideForChapter('yojimbo-cavern')!;

  it('exists, is found on a Yojimbo board, and keeps its short rules to one line', () => {
    expect(guide).toBeDefined();
    expect(guide.bossIds).toEqual(['yojimbo']);
    for (const r of guide.rules) expect(r.short.length, r.short).toBeLessThanOrEqual(RULE_SHORT_MAX);
    const engine = newEngine(1);
    expect(guideForState(engine.state())?.id).toBe('yojimbo-cavern');
  });

  it('explains the tactic’s picks on a real battle, with a citation', () => {
    const engine = newEngine(3);
    let recommended = 0;
    let explained = 0;
    for (let i = 0; i < 6000; i++) {
      const d = engine.nextDecision();
      if (d.kind === 'battle-over') break;
      if (d.kind !== 'player-input') continue;
      const view = buildGuideView(engine.state(), { actorId: d.actorId, commands: d.commands });
      if (view?.next) {
        recommended++;
        if (view.next.reason) explained++;
      }
      engine.submit(intendedStrategy(d.actorId, d.commands, engine) ?? { kind: 'defend', targets: [] });
    }
    expect(recommended).toBeGreaterThan(0);
    expect(explained).toBe(recommended);
  });
});

describe('tactic', () => {
  it('is the tactic on a Yojimbo board, and on no FFX-2 board', () => {
    const engine = newEngine(1);
    expect(tacticFor(engine)).toBe(yojimboCavern);
    const x2 = { game: 'ffx2', combatants: { yojimbo: { id: 'yojimbo', side: 'enemy' } } } as never;
    expect(tacticFor(stateOnlyEngine(x2))).toBeNull();
  });

  it('opens with Kimahri’s Doom and Lulu’s Fira, and never names him from anyone else', () => {
    const engine = newEngine(1);
    const seen: string[] = [];
    for (let i = 0; i < 6000; i++) {
      const d = engine.nextDecision();
      if (d.kind === 'battle-over') break;
      if (d.kind !== 'player-input') continue;
      const c = intendedStrategy(d.actorId, d.commands, engine)!;
      const id = 'id' in c ? String(c.id) : '';
      if ((c.targets as readonly string[]).includes('yojimbo')) seen.push(`${d.actorId}:${c.kind}:${id}`);
      engine.submit(c);
    }
    expect(seen).toContain('kimahri:overdrive:doom');
    expect(seen.filter((s) => s.startsWith('lulu:')).every((s) => s === 'lulu:ability:fira')).toBe(true);
    expect(seen.filter((s) => !s.startsWith('lulu:')).every((s) => s === 'kimahri:overdrive:doom')).toBe(true);
  });
});

describe('the autopilot’s line across 200 seeds (measured, not tuned)', () => {
  const SEEDS = 200;
  let wins = 0;
  let doomKills = 0;
  let unfinished = 0;
  let turns = 0;
  beforeAll(() => {
    for (let seed = 1; seed <= SEEDS; seed++) {
      const engine = newEngine(seed);
      playOut(engine, (id, cmds) => intendedStrategy(id, cmds, engine));
      const st = engine.state();
      if (st.result?.outcome === 'victory') wins++;
      if (!st.result) unfinished++;
      turns += st.turn;
      const y = st.combatants['yojimbo'] as FFXCombatant;
      if (st.log.some((e) => e.type === 'status-remove' && e.targetId === 'yojimbo' && e.status === 'doom') || (y && !y.alive && y.statuses['doom'] !== undefined)) doomKills++;
    }
    console.log(`[yojimbo tactic] intendedStrategy wins ${wins}/${SEEDS}, Doom kills ${doomKills}, mean turns ${(turns / SEEDS).toFixed(1)}`);
  }, 180_000);

  it('every battle ends', () => expect(unfinished).toBe(0));
  it('beats the credibly wrong line (0 / 200 on the bench), by the Doom route', () => {
    expect(wins).toBeGreaterThan(0);
    expect(doomKills).toBeGreaterThan(0);
  });
});
