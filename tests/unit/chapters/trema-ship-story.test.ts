/**
 * Chapter XIII (Trema) ship layer: the chapter's shape, the story in both shapes, and the
 * registered record. The triggers are proved by **running the engine** (AGENTS.md rule 3), not
 * by reading the data: Paragon's KO fires the link seam, his Big Bang fires Paine's callout,
 * Trema's entrance and his HP lines fire theirs.
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14].
 */

import { describe, expect, it } from 'vitest';
import type { BattleEvent, BattleSetup, EnemyDef, EnemyGroupDef, MidBattleTrigger } from '../../../src/battle/common/types.ts';
import { CHAPTERS, CHAPTER_IDS, getChapter } from '../../../src/data/encounters.ts';
import { FFX2_TREMA } from '../../../src/data/chapter-ffx2-trema.ts';
import { FFX2_TREMA_SHIPPED, shapeOfChapter, withTremaShip } from '../../../src/data/chapter-trema-ship.ts';
import { cloisterParagonGroup, cloisterTremaGroup } from '../../../src/data/ffx2/enemies/trema.ts';
import { TREMA_SHAPE_ALONE, TREMA_SHAPE_OVERSOUL_LINK, TREMA_SHAPE_PARAGON_LINK, tremaShapeOf } from '../../../src/data/trema-shape.ts';
import { cloisterParagonOversoulGroup } from '../../../src/data/ffx2/enemies/trema-options.ts';
import { lintScript, type ChapterScripts, type StoryScript } from '../../../src/story/dsl.ts';
import {
  TREMA_AI_TRIGGERS,
  TREMA_LINK_RIG,
  TREMA_LINK_SEAM,
  ffx2TremaScripts,
  tremaScriptsFor,
} from '../../../src/story/scripts/ffx2-trema.ts';
import { MID_LINE_HOLD_MS, MID_SCRIPT_BUDGET_MS, SEAM_BUDGET_MS, scriptDurationMs } from '../../../src/story/registry.ts';
import { CLOISTER_LINK_RIG } from '../../../src/scenes/cloister-100-rigs.ts';
import { viaInfinitoBuild } from '../../../src/data/ffx2/builds/via-infinito.ts';
import { LINES, group, newEngine, type LineOptions } from '../helpers/tremaDrive.ts';
import { fallback, knightTurn, rikkuTurn } from '../helpers/tremaLines.ts';

const ALONE_CHAPTER = { ...FFX2_TREMA, enemyGroupRef: cloisterTremaGroup };

describe('the chapter shape, read off the formations', () => {
  it('Paragon then Trema (TR1 a) with the normal Paragon: a Paragon link with the Big Bang counter', () => {
    expect(tremaShapeOf(cloisterParagonGroup, (id) => group(id))).toEqual(TREMA_SHAPE_PARAGON_LINK);
  });

  it('shipped (option 1): Oversoul Paragon then Trema, a link with no Big Bang counter, a Paragon that waits to be hit', () => {
    // Oversoul Paragon lists Big Bang among its moves (idle, or below a tenth: research §12.2) but runs
    // `paragon-oversoul`, which has no counter; the shape reads the script, not the ability list.
    expect(cloisterParagonOversoulGroup.enemies[0]?.abilityIds).toContain('paragon-big-bang');
    expect(tremaShapeOf(cloisterParagonOversoulGroup, (id) => group(id))).toEqual(TREMA_SHAPE_OVERSOUL_LINK);
    expect(shapeOfChapter(FFX2_TREMA)).toEqual(TREMA_SHAPE_OVERSOUL_LINK);
  });

  it('Trema alone (option 2): no link, no Paragon', () => {
    expect(tremaShapeOf(cloisterTremaGroup)).toEqual(TREMA_SHAPE_ALONE);
    expect(shapeOfChapter(ALONE_CHAPTER)).toEqual(TREMA_SHAPE_ALONE);
  });

  it('a Paragon with no Big Bang (an Oversoul-like form) keeps the link and drops the counter', () => {
    const [paragon] = cloisterParagonGroup.enemies as EnemyDef[];
    const soft: EnemyDef = { ...paragon!, id: 'paragon-oversoul', abilityIds: paragon!.abilityIds.filter((a) => a !== 'paragon-big-bang') };
    const shape = tremaShapeOf({ ...cloisterParagonGroup, enemies: [soft] }, (id) => group(id));
    expect(shape).toMatchObject({ paragonLink: true, paragonBigBang: false, paragonId: 'paragon-oversoul', tremaId: 'trema' });
  });
});

function allScripts(s: ChapterScripts): StoryScript[] {
  return [s.pre, s.post, ...Object.values(s.midScripts)];
}

describe('the story in both shapes', () => {
  const link = tremaScriptsFor(TREMA_SHAPE_PARAGON_LINK);
  const alone = tremaScriptsFor(TREMA_SHAPE_ALONE);

  it.each([['link', link], ['alone', alone]] as const)('%s: every line passes the house lint', (_n, s) => {
    for (const script of allScripts(s)) expect(lintScript(script)).toEqual([]);
  });

  it.each([['link', link], ['alone', alone]] as const)('%s: pre ends in battleStart, post holds results', (_n, s) => {
    expect(s.pre.at(-1)?.type).toBe('battleStart');
    expect(s.post.some((st) => st.type === 'results')).toBe(true);
  });

  it.each([['link', link], ['alone', alone]] as const)('%s: every trigger id is its script key, and the AI names resolve', (_n, s) => {
    for (const t of s.mid) {
      expect(t.id).toBe(t.script);
      expect(s.midScripts[t.script], t.id).toBeDefined();
    }
    for (const name of TREMA_AI_TRIGGERS) expect(s.midScripts[name], name).toBeDefined();
  });

  it.each([['link', link], ['alone', alone]] as const)('%s: every mid script fits its budget, and every line in one auto-advances', (_n, s) => {
    for (const [name, script] of Object.entries(s.midScripts)) {
      const cap = name === TREMA_LINK_SEAM ? SEAM_BUDGET_MS : MID_SCRIPT_BUDGET_MS;
      expect(scriptDurationMs(script, MID_LINE_HOLD_MS), name).toBeLessThanOrEqual(cap);
      for (const st of script) if (st.type === 'say') expect(st.auto, `${name}: ${st.text}`).toBeGreaterThan(0);
    }
  });

  it('with a Paragon link: the seam fires on its KO, cuts to the scene link rig, and the reveal waits for it', () => {
    expect(link.mid.find((t) => t.id === TREMA_LINK_SEAM)?.when).toEqual({ type: 'ko', who: 'paragon' });
    expect(link.midScripts[TREMA_LINK_SEAM]![0]).toMatchObject({ type: 'camera', rig: TREMA_LINK_RIG });
    expect(link.pre.some((st) => st.type === 'say' && st.who === 'trema')).toBe(false);
    expect(link.mid.some((t) => t.id === 'paragon-big-bang')).toBe(true);
  });

  it('Trema alone: no seam, no Paragon line, and his reveal plays in pre, before the battle', () => {
    expect(alone.mid.some((t) => t.when.type === 'ko' || ('who' in t.when && t.when.who === 'paragon'))).toBe(false);
    expect(Object.keys(alone.midScripts)).not.toContain(TREMA_LINK_SEAM);
    const say = alone.pre.filter((st) => st.type === 'say' && st.who === 'trema');
    expect(say.length).toBe(5);
    expect(alone.pre.findIndex((st) => st.type === 'showActor')).toBeLessThan(alone.pre.length - 1);
  });

  it('the story rig name is the scene rig name', () => {
    expect(TREMA_LINK_RIG).toBe(CLOISTER_LINK_RIG);
  });

  it('quotes no game line (rule 8): the canonical last word stays out', () => {
    const text = allScripts(ffx2TremaScripts).flat().map((st) => ('text' in st ? String(st.text) : '')).join(' ').toLowerCase();
    expect(text).not.toContain('pastlessness');
    expect(text).not.toContain('ieyui');
  });
});

describe('the registered record: LISTED (2026-09-25), with the ship layer on', () => {
  it('getChapter finds it on the Cloister 100 scene with the story; chapter select lists it', () => {
    const ch = getChapter('ffx2-trema');
    expect(ch).toBe(FFX2_TREMA_SHIPPED);
    expect(ch?.sceneKey).toBe('via-infinito');
    expect(ch?.scriptsRef.mid.map((t) => t.id)).toEqual(tremaScriptsFor(TREMA_SHAPE_OVERSOUL_LINK).mid.map((t) => t.id));
    // Oversoul Paragon has no Big Bang counter, so Paine's "it hits back" callout is not registered.
    expect(ch?.scriptsRef.mid.some((t) => t.id === 'paragon-big-bang')).toBe(false);
    expect(ch?.scriptsRef.midScripts['paragon-big-bang']).toBeUndefined();
    expect(ch?.scriptsRef.mid.some((t) => t.id === TREMA_LINK_SEAM)).toBe(true);
    expect(ch?.music).toEqual(FFX2_TREMA.music);
    expect(CHAPTER_IDS).toContain('ffx2-trema');
    expect(CHAPTERS.at(-1)).toBe(FFX2_TREMA_SHIPPED);
  });

  it('with Trema alone the stand-in cue scores the only link, and the story takes the alone shape', () => {
    const ch = withTremaShip(ALONE_CHAPTER);
    expect(ch.music.battle).toBe('boss-ffx2-aeon');
    expect(ch.scriptsRef.mid.some((t) => t.id === TREMA_LINK_SEAM)).toBe(false);
  });
});

// ---------------------------------------------------------------- the engine, run (rule 3)

type Input = Extract<ReturnType<ReturnType<typeof newEngine>['nextDecision']>, { kind: 'player-input' }>;

function run(g: EnemyGroupDef, triggers: MidBattleTrigger[], seed: number, prep: (e: ReturnType<typeof newEngine>) => void, line: LineOptions = LINES.intended, cap = 4000): string[] {
  const engine = newEngine();
  const setup: BattleSetup = { game: 'ffx2', party: viaInfinitoBuild, enemies: g, triggers, seed, condition: 'normal', canEscape: false };
  engine.setSeed(seed);
  engine.init(setup);
  prep(engine);
  for (let i = 0; i < cap; i++) {
    const d = engine.nextDecision();
    if (d.kind === 'battle-over') break;
    if (d.kind === 'waiting') {
      engine.tick(Math.max(1, d.nextEventMs));
      continue;
    }
    if (d.kind !== 'player-input') continue;
    const inp = d as Input;
    engine.submit((inp.actorId === 'rikku' ? rikkuTurn(inp, engine, line) : knightTurn(inp, engine, line)) ?? fallback(inp));
  }
  return (engine.state().log as readonly BattleEvent[])
    .filter((e) => e.type === 'script-trigger')
    .map((e) => (e as { name: string }).name);
}

function unit(engine: ReturnType<typeof newEngine>, id: string): { hp: number; stats: { maxHp: number } } {
  return engine.state().combatants[id] as unknown as { hp: number; stats: { maxHp: number } };
}

describe('the triggers fire on the real engine', () => {
  const mid = ffx2TremaScripts.mid;

  it('Paragon: Yuna mourns it, and Darkness on it draws Big Bang, which Paine calls', () => {
    const names = run(group('ffx2-cloister-paragon'), mid, 3, () => {}, LINES.darknessOnParagon, 600);
    expect(names).toContain('paragon-mourned');
    expect(names).toContain('paragon-big-bang');
  });

  it('shipped Oversoul Paragon: left alone it uses Big Bang, and no Big Bang callout fires', () => {
    const mid = FFX2_TREMA_SHIPPED.scriptsRef.mid;
    let seen = 0;
    for (let seed = 1; seed <= 8 && seen === 0; seed++) {
      const engine = newEngine();
      engine.setSeed(seed);
      engine.init({ game: 'ffx2', party: FFX2_TREMA_SHIPPED.buildRef, enemies: FFX2_TREMA_SHIPPED.enemyGroupRef, triggers: mid, seed, condition: 'normal', canEscape: false });
      for (let i = 0; i < 3000; i++) {
        const d = engine.nextDecision();
        if (d.kind === 'battle-over') break;
        if (d.kind === 'waiting') engine.tick(Math.max(1, d.nextEventMs));
        else if (d.kind === 'player-input') engine.submit({ kind: 'defend', targets: [] });
      }
      const log = engine.state().log as readonly BattleEvent[];
      seen += log.filter((e) => e.type === 'action-start' && (e as { abilityId?: string }).abilityId === 'paragon-big-bang').length;
      expect(log.some((e) => e.type === 'script-trigger' && (e as { name: string }).name === 'paragon-big-bang')).toBe(false);
    }
    expect(seen).toBeGreaterThan(0); // the move itself happened, so the silence is the story's, not luck
  });

  it('Paragon: its KO fires the link seam', () => {
    const names = run(group('ffx2-cloister-paragon'), mid, 4, (e) => {
      unit(e, 'paragon').hp = 400; // a harness shortcut to reach the KO; the data is untouched
    });
    expect(names).toContain(TREMA_LINK_SEAM);
  });

  it('Trema: his entrance fires, and each HP line his AI crosses names a callout the story has', () => {
    const names = run(group('ffx2-cloister-trema'), mid, 5, (e) => {
      const t = unit(e, 'trema');
      t.hp = Math.floor(t.stats.maxHp / 6) + 5; // just above a sixth: the next hits cross every line at once
    }, LINES.intended, 600);
    expect(names).toContain('trema-entrance');
    const ai = names.filter((n) => n.startsWith('trema-meteor') || n === 'trema-ultima');
    expect(ai.length).toBeGreaterThan(0);
    for (const n of ai) expect(ffx2TremaScripts.midScripts[n], n).toBeDefined();
  });
});
