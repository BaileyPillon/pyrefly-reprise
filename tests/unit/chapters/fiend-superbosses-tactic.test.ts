/**
 * The Fiend Arena Superbosses (the hidden FFX-2 chapter 53): the encounter tactic (`src/engine/tactics/ffx2-fiend-superbosses.ts`), which the shipped auto-battler plays and the move advisor ("NEXT BEST MOVE") reads.
 * **FFX-2 only** [AGENTS.md rule 14].
 *
 * The tactic is the Farplane Cup's "curtains" line on the same party: Yuna and Paine (Dark Knights) cast Darkness; Rikku raises a fallen girl, cures stone, lays Protect and then Shell (the Light and Lunar Curtains),
 * mends the party with a Megalixir under half, and otherwise swings. It has no answer to a Command, and says so. Pinned here:
 *
 * 1. **Registration**: the chapter's five fighting bodies find it, an FFX board never does, and a board without them gets `null`.
 * 2. **The choices**, on the real engine's menus (the first menu each girl gets, with the foes' scripts held back): Darkness for both Dark Knights; Rikku's order of raise, Remedy, Protect, Shell, Megalixir, swing.
 * 3. **The line over whole fights**: on both acts it plays to a verdict with every action one the guide explains, never Changes dress, never asks for a Dispel, a Mix or an item the bag lacks; the same seed gives the same fight.
 */
import { describe, expect, it } from 'vitest';

import { setupForChapter } from '../../../src/app/screens/BattleScreenSetup.ts';
import type { AvailableCommand, BattleEngine, Command, Decision } from '../../../src/battle/common/types.ts';
import { FFX2Engine } from '../../../src/battle/ffx2/index.ts';
import { FFX2_FIEND_SUPERBOSSES } from '../../../src/data/chapter-ffx2-fiend-superbosses.ts';
import { FFX2_FIEND_SUPERBOSSES_GUIDE } from '../../../src/data/guides/ffx2-fiend-superbosses.ts';
import { NUMERUS_HEAD_IDS, X2_ALMIGHTY_SHINRA_ID } from '../../../src/data/fiend-superbosses-ids.ts';
import { FIEND_SUPERBOSSES_BOSS_IDS, ffx2FiendSuperbosses } from '../../../src/engine/tactics/ffx2-fiend-superbosses.ts';
import { TACTICS, tacticFor } from '../../../src/engine/tactics/index.ts';
import { CHAPTER_GAME } from '../../../src/engine/tactics/lookup.ts';
import { ffx2Options } from '../helpers/ffx2ChapterDrive.ts';
import { attackOf, forcedAct, headlineOf, openAct, playToEnd, type Act, type Turn } from '../helpers/fiendSuperbossDrive.ts';

type Input = Extract<Decision, { kind: 'player-input' }>;
type Unit = { id: string; hp: number; alive: boolean; stats: { maxHp: number }; statuses: Record<string, unknown> };

/** The engine at the start of act `act` with the chapter's own setup and the foes' scripts held back, and the first menu each girl gets (taken while the others defend). */
function menus(act: Act = 1, seed = 3): { engine: FFX2Engine; menu: Record<string, AvailableCommand[]> } {
  const engine = new FFX2Engine(ffx2Options({ atbMode: 'wait' }));
  engine.setSeed(seed);
  engine.init({ ...setupForChapter(FFX2_FIEND_SUPERBOSSES, seed), enemies: forcedAct(act).group });
  const menu: Record<string, AvailableCommand[]> = {};
  for (let i = 0; i < 4000 && Object.keys(menu).length < 3; i++) {
    const d = engine.nextDecision();
    if (d.kind === 'waiting') engine.tick(Math.max(1, d.nextEventMs));
    else if (d.kind === 'player-input') {
      menu[d.actorId] ??= (d as Input).commands;
      engine.submit({ kind: 'defend', targets: [] } as Command);
    } else if (d.kind === 'battle-over') break;
  }
  return { engine, menu };
}

const asEngine = (e: FFX2Engine): BattleEngine => e as unknown as BattleEngine;
const u = (engine: FFX2Engine, id: string): Unit => engine.state().combatants[id] as unknown as Unit;
const idOf = (c: Command | null): string | null => (c !== null && 'id' in c ? (c as { id: string }).id : c === null ? null : c.kind);
const status = (id: string): unknown => ({ id, ticksRemaining: null });

/** Put every girl at full HP, alive, with the statuses given (or none). */
function reset(engine: FFX2Engine, statuses: string[] = []): void {
  for (const id of ['yuna', 'rikku', 'paine']) {
    const g = u(engine, id);
    g.hp = g.stats.maxHp;
    g.alive = true;
    for (const s of ['protect', 'shell', 'petrify']) delete g.statuses[s];
    for (const s of statuses) g.statuses[s] = status(s);
  }
}

describe('registration', () => {
  it('the chapter is registered under its five fighting bodies and the FFX-2 game; an FFX board never reaches it', () => {
    expect(CHAPTER_GAME['ffx2-fiend-superbosses']).toBe('ffx2');
    expect(TACTICS.filter((t) => t.chapterId === 'ffx2-fiend-superbosses').map((t) => t.bossId)).toEqual([...FIEND_SUPERBOSSES_BOSS_IDS]);
    expect([...FIEND_SUPERBOSSES_BOSS_IDS]).toEqual([X2_ALMIGHTY_SHINRA_ID, ...NUMERUS_HEAD_IDS]);
    for (const act of [1, 2] as Act[]) expect(tacticFor(asEngine(menus(act).engine)), `act ${act}`).toBe(ffx2FiendSuperbosses);
    const ffx = { state: () => ({ game: 'ffx', combatants: { 'x2-almighty-shinra': { id: 'x2-almighty-shinra', side: 'enemy' } } }) } as unknown as BattleEngine;
    expect(tacticFor(ffx)).toBeNull();
  });

  it('with none of them on the field the tactic returns null (the generic ladder)', () => {
    const { engine, menu } = menus();
    for (const id of FIEND_SUPERBOSSES_BOSS_IDS) {
      const c = engine.state().combatants[id];
      if (c) (c as unknown as Unit).alive = false;
    }
    expect(ffx2FiendSuperbosses('yuna', menu['yuna']!, asEngine(engine))).toBeNull();
  });
});

describe('the Dark Knights (Yuna and Paine), on the real engine\'s menu', () => {
  it('both cast Darkness, which hits every enemy at once, in both acts', () => {
    for (const act of [1, 2] as Act[]) {
      const { engine, menu } = menus(act);
      for (const girl of ['yuna', 'paine']) {
        const c = ffx2FiendSuperbosses(girl, menu[girl]!, asEngine(engine)) as Command & { targets: string[] };
        expect([act, girl, idOf(c), c.targets]).toEqual([act, girl, 'x2-dark-knight-darkness', []]);
      }
    }
  });
});

describe('Rikku (the Alchemist), in her order', () => {
  it('Protect first (the Light Curtain), then Shell (the Lunar Curtain), then a Megalixir under half, then a swing', () => {
    const { engine, menu } = menus();
    reset(engine);
    expect(idOf(ffx2FiendSuperbosses('rikku', menu['rikku']!, asEngine(engine)))).toBe('x2-light-curtain');
    reset(engine, ['protect']);
    expect(idOf(ffx2FiendSuperbosses('rikku', menu['rikku']!, asEngine(engine)))).toBe('x2-lunar-curtain');
    reset(engine, ['protect', 'shell']);
    expect(ffx2FiendSuperbosses('rikku', menu['rikku']!, asEngine(engine)), 'a whole, warded party: she swings').toBeNull();
    const yuna = u(engine, 'yuna');
    yuna.hp = Math.floor(yuna.stats.maxHp * 0.4);
    expect(idOf(ffx2FiendSuperbosses('rikku', menu['rikku']!, asEngine(engine)))).toBe('x2-megalixir');
    yuna.hp = Math.floor(yuna.stats.maxHp * 0.6);
    expect(ffx2FiendSuperbosses('rikku', menu['rikku']!, asEngine(engine)), 'over half: she swings').toBeNull();
  });

  it('a girl turned to stone gets the Remedy before the curtains (Duo\'s Break)', () => {
    const { engine, menu } = menus();
    reset(engine);
    u(engine, 'paine').statuses['petrify'] = status('petrify');
    const c = ffx2FiendSuperbosses('rikku', menu['rikku']!, asEngine(engine)) as Command & { targets: string[] };
    expect([idOf(c), c.targets]).toEqual(['x2-remedy', ['paine']]);
  });

  it('a fallen girl is raised first when the menu offers a way (the bag holds no Phoenix Down, so Stash is the only way, and when the menu offers none she goes on to the curtains)', () => {
    const { engine, menu } = menus();
    reset(engine);
    u(engine, 'paine').alive = false;
    u(engine, 'paine').hp = 0;
    const offered = menu['rikku']!.some((c) => c.enabled && 'id' in c.command && (c.command as { id: string }).id === 'x2-alchemist-stash-phoenix-down');
    const c = ffx2FiendSuperbosses('rikku', menu['rikku']!, asEngine(engine)) as Command & { targets: string[] };
    if (offered) expect([idOf(c), c.targets]).toEqual(['x2-alchemist-stash-phoenix-down', ['paine']]);
    else expect(idOf(c)).toBe('x2-light-curtain');
  });

  it('a girl an Eject took out of the fight is not raised (no item brings her back)', () => {
    const { engine, menu } = menus();
    reset(engine, ['protect', 'shell']);
    const paine = u(engine, 'paine');
    paine.alive = false;
    paine.hp = 0;
    paine.statuses['eject'] = status('eject');
    expect(ffx2FiendSuperbosses('rikku', menu['rikku']!, asEngine(engine))).toBeNull();
  });
});

describe('the line over whole acts', () => {
  /** The tactic as a bench turn: its pick, else a swing at the headline foe. */
  const line = (act: Act, picked: string[]): Turn => (d, engine) => {
    const c = ffx2FiendSuperbosses(d.actorId, d.commands, asEngine(engine));
    picked.push(idOf(c) ?? 'attack');
    return c ?? attackOf(d, headlineOf(engine, act));
  };
  /** The labels the guide explains, as ids. */
  const EXPLAINED = new Set(['x2-dark-knight-darkness', 'x2-light-curtain', 'x2-lunar-curtain', 'x2-megalixir', 'x2-remedy', 'x2-alchemist-stash-phoenix-down', 'x2-phoenix-down', 'attack']);

  it('plays each act to a verdict (the base party loses, as the lane measured), every action one the guide explains; the same seed twice is the same fight', () => {
    for (const act of [1, 2] as Act[]) {
      for (const seed of [1, 2, 3]) {
        const picksA: string[] = [];
        const picksB: string[] = [];
        const a = openAct(act, seed);
        const b = openAct(act, seed);
        const ra = playToEnd(a, line(act, picksA));
        const rb = playToEnd(b, line(act, picksB));
        expect(['victory', 'defeat'], `act ${act} seed ${seed}`).toContain(ra.outcome);
        expect([rb.outcome, rb.ticks, rb.hash], `act ${act} seed ${seed}: determinism`).toEqual([ra.outcome, ra.ticks, ra.hash]);
        for (const p of picksA) expect(EXPLAINED.has(p), `act ${act} seed ${seed}: ${p}`).toBe(true);
        expect(picksA).not.toContain('x2-alchemist-mix');
        expect(picksA.some((p) => /dispel|change/i.test(p))).toBe(false);
      }
    }
  });

  it('with the girls kept alive for 3,000 logic steps (about 100 seconds of battle time) the line opens with Rikku\'s two curtains and then plays only rows the guide explains', () => {
    for (const act of [1, 2] as Act[]) {
      const picks: string[] = [];
      const rikku: string[] = [];
      const turn = line(act, picks);
      const watch: Turn = (d, engine) => {
        const c = turn(d, engine);
        if (d.actorId === 'rikku') rikku.push(picks.at(-1)!);
        return c;
      };
      const result = playToEnd(openAct(act, 1, { immortal: true }), watch, { immortal: true, capTicks: 3_000 });
      expect(['victory', 'defeat', 'cap'], `act ${act}`).toContain(result.outcome);
      expect(picks.length, `act ${act}`).toBeGreaterThan(6);
      expect(rikku.slice(0, 2), `act ${act}: Protect, then Shell`).toEqual(['x2-light-curtain', 'x2-lunar-curtain']);
      for (const p of picks) expect(EXPLAINED.has(p), `act ${act}: ${p}`).toBe(true);
      expect(picks.filter((p) => p === 'x2-dark-knight-darkness').length, `act ${act}: Yuna and Paine cast Darkness`).toBeGreaterThan(2);
    }
  });

  it('the hints of the card name every row the line uses (Darkness, both curtains, the Megalixir, the Remedy, the raise)', () => {
    const labels = new Set(FFX2_FIEND_SUPERBOSSES_GUIDE.hints.flatMap((h) => (h.when.labels ?? []).map((l) => l.toLowerCase())));
    for (const label of ['darkness', 'light curtain', 'lunar curtain', 'megalixir', 'remedy', 'phoenix down']) expect(labels.has(label), label).toBe(true);
  });

});
