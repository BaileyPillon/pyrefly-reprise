/**
 * **The Dark Aeons' AI against the reverse-engineering session's note** (`research/re-ffx-dark-aeons.md`, "RE note n"; FFX only; the hidden Mirror Aeons chapter): every rule and every number of the four scripts
 * (`src/battle/ffx/ai/dark-aeons.ts`) and the dog's bite, pinned twice. **First on a fake context**, where each branch is driven by the raw draw and the gauges alone and the odds are counted over all 65,536 values
 * of `GetRandomValue()` (the note's own exact tallies, 4.2 and 5.2); **then on the real engine** with a party that cannot die and only defends, where the cadence (which turn is Zanmato, which is Delta Attack), the
 * gauges' arithmetic, the hit events (+2 and +5) and the streams each turn draws (RE note section 7) are read off the battle's own log.
 */
import { describe, expect, it } from 'vitest';

import type { BattleEvent, Command, EnemyDef, FFXCombatant } from '../../../src/battle/common/types.ts';
import type { GameStreams } from '../../../src/battle/common/streams.ts';
import type { Ctx } from '../../../src/battle/ffx/state.ts';
import {
  DARK_BATTLE_ID_FLAG, DARK_GAUGE_PER_TURN_FLAG, DARK_ROWS, DARK_SCRIPTS, SISTER_BASIC_MOVES, TRIO_BATTLE_IDS, darkYojimboTurn, sisterTurn, tierStep, trioReady,
} from '../../../src/battle/ffx/ai/dark-aeons.ts';
import { type AiContext } from '../../../src/battle/ffx/ai/types.ts';
import { FfxStream } from '../../../src/battle/ffx/adapt/streams.ts';
import { SISTER_FORMATIONS, YOJIMBO_TIERS, sistersGroupId, yojimboGroupId } from '../../../src/data/ffx/mirror-aeons-ids.ts';
import { createFFXEngine } from '../../../src/battle/ffx/index.ts';
import { mirrorAeonsBuild } from '../../../src/data/ffx/builds/mirror-aeons.ts';
import * as H from '../helpers/mirrorAeonsDrive.ts';

// ---------------------------------------------------------------------------
// A fake context: just enough state for a script to read, and a raw draw it is handed
// ---------------------------------------------------------------------------

interface Fake {
  ctx: Ctx;
  /** Every draw the script made: [stream, upper bound]. */
  draws: Array<[number, number]>;
  gauges: Record<string, number>;
}

const dummy = (id: string, side: 'party' | 'enemy', gauge?: number): FFXCombatant =>
  ({ id, side, alive: true, hp: 100, removed: false, statuses: {}, flags: {}, stats: { maxHp: 100 }, ...(gauge !== undefined ? { overdrive: { gauge } } : {}) }) as unknown as FFXCombatant;

/**
 * A battle with `living` party members, the Dark Aeons named in `gauges` (id to gauge; a missing key is a dead or absent combatant), `battleId` published as the game's id, and every draw of stream 2 answered `raw`
 * and every draw of stream 4 answered `pick`.
 */
function fake(opts: { battleId: number; gauges: Record<string, number>; living?: number; raw?: number; pick?: number; step?: number }): Fake {
  const draws: Array<[number, number]> = [];
  const party = Array.from({ length: opts.living ?? 3 }, (_, i) => dummy(`m${i}`, 'party'));
  const combatants: Record<string, FFXCombatant> = Object.fromEntries(party.map((c) => [c.id, c]));
  for (const [id, gauge] of Object.entries(opts.gauges)) combatants[id] = dummy(id, 'enemy', gauge);
  const flags: Record<string, number> = { [DARK_BATTLE_ID_FLAG]: opts.battleId };
  if (opts.step !== undefined) flags[DARK_GAUGE_PER_TURN_FLAG] = opts.step;
  const ctx = {
    state: { flags, combatants, activeIds: party.map((c) => c.id), aeonId: null, enemyIds: Object.keys(opts.gauges) },
    rt: {},
    rng: {
      on: (stream: number) => ({
        int: (_lo: number, hi: number): number => {
          draws.push([stream, hi]);
          return stream === FfxStream.Script ? (opts.raw ?? 0) : Math.min(opts.pick ?? 0, hi);
        },
      }),
    },
    content: { ability: () => ({}) },
    emit: () => undefined,
  } as unknown as Ctx;
  return { ctx, draws, gauges: Object.fromEntries(Object.entries(opts.gauges)) };
}

const gaugeOf = (f: Fake, id: string): number => (f.ctx.state.combatants[id] as FFXCombatant).overdrive!.gauge;
const aiOf = (f: Fake, id: string): AiContext => ({ ctx: f.ctx, self: f.ctx.state.combatants[id] as FFXCombatant, memory: {} });
const rowOf = (c: Command | null): string => (c !== null && c.kind === 'ability' ? c.id : `(${c?.kind ?? 'none'})`);

const TIER = (n: number) => YOJIMBO_TIERS[n]!;
const TRIO = 0x00dc0046;
const PAIR = 0x00dd0048;

describe("Dark Yojimbo's turn on a fake context (RE note 4.2)", () => {
  it('a gauge of 100: Zanmato on the whole front line with no draw at all, and the gauge restarts at the tier\'s step, not at 0', () => {
    for (const tier of YOJIMBO_TIERS) {
      const f = fake({ battleId: tier.battleId, gauges: { 'dark-yojimbo': 100 }, step: tier.gaugePerTurn });
      const command = darkYojimboTurn(aiOf(f, 'dark-yojimbo'));
      expect(rowOf(command), tier.file).toBe(DARK_ROWS.zanmato);
      expect(command.targets, 'the whole front line: the row names no one').toEqual([]);
      expect(f.draws, `${tier.file}: Zanmato draws nothing`).toEqual([]);
      expect(gaugeOf(f, 'dark-yojimbo'), tier.file).toBe(tier.gaugePerTurn); // 6, 10, 16, 20, 26 (RE note 4.5)
    }
  });

  it('below 100: one draw modulo 3: 21,846 of the 65,536 values are the group Wakizashi, 21,845 Kozuka on one character, 21,845 the dog\'s order (exact)', () => {
    const tally: Record<string, number> = {};
    for (let raw = 0; raw < 0x10000; raw++) {
      const f = fake({ battleId: TIER(1).battleId, gauges: { 'dark-yojimbo': 40 }, step: 10, raw });
      const row = rowOf(darkYojimboTurn(aiOf(f, 'dark-yojimbo')));
      tally[row] = (tally[row] ?? 0) + 1;
    }
    expect(tally).toEqual({ [DARK_ROWS.wakizashiAll]: 21_846, [DARK_ROWS.kozuka]: 21_845, [DARK_ROWS.daigoroOrder]: 21_845 });
  });

  it('every ordinary turn adds the tier\'s step to the gauge, capped at 100, whatever the draw chose', () => {
    for (const tier of YOJIMBO_TIERS) {
      for (const raw of [0, 1, 2]) {
        const f = fake({ battleId: tier.battleId, gauges: { 'dark-yojimbo': 95 }, step: tier.gaugePerTurn, raw });
        darkYojimboTurn(aiOf(f, 'dark-yojimbo'));
        expect(gaugeOf(f, 'dark-yojimbo'), `${tier.file} draw ${raw}`).toBe(100);
        const g = fake({ battleId: tier.battleId, gauges: { 'dark-yojimbo': 20 }, step: tier.gaugePerTurn, raw });
        darkYojimboTurn(aiOf(g, 'dark-yojimbo'));
        expect(gaugeOf(g, 'dark-yojimbo'), `${tier.file} draw ${raw}`).toBe(Math.min(100, 20 + tier.gaugePerTurn));
      }
    }
  });

  it('Kozuka picks its victim with one stream-4 draw when two or more live, and none for one; the group Wakizashi and the order draw no stream 4', () => {
    const kozuka = (living: number, raw = 1): Fake => {
      const f = fake({ battleId: TIER(1).battleId, gauges: { 'dark-yojimbo': 0 }, step: 10, raw, living, pick: 1 });
      darkYojimboTurn(aiOf(f, 'dark-yojimbo'));
      return f;
    };
    expect(kozuka(3).draws).toEqual([[FfxStream.Script, 0xffff], [FfxStream.Picker, 2]]); // GetRandomValue, then the picker over three
    expect(kozuka(2).draws).toEqual([[FfxStream.Script, 0xffff], [FfxStream.Picker, 1]]);
    expect(kozuka(1).draws).toEqual([[FfxStream.Script, 0xffff]]); // one candidate: no draw (RE note 3)
    expect(kozuka(3, 0).draws).toEqual([[FfxStream.Script, 0xffff]]); // the group Wakizashi
    expect(kozuka(3, 2).draws).toEqual([[FfxStream.Script, 0xffff]]); // the order: the bite's own pick is the dog's
    const f = kozuka(3);
    expect(f.ctx.state.flags[DARK_GAUGE_PER_TURN_FLAG]).toBe(10);
    expect(tierStep(f.ctx)).toBe(10);
  });
});

describe("a Sister's turn on a fake context (RE note 5.2)", () => {
  const trio = (gauges: Partial<Record<'dark-mindy' | 'dark-sandy' | 'dark-cindy', number>>, raw = 0, battleId = TRIO): Fake => fake({ battleId, gauges: gauges as Record<string, number>, raw });
  const FULL = { 'dark-mindy': 100, 'dark-sandy': 100, 'dark-cindy': 100 };

  it('rule 1, the trio: all three alive and every gauge 100 or more: Cindy throws the Delta Attack after writing 0 to all three, with no draw; Sandy and Mindy take a basic move and keep 100', () => {
    const c = trio(FULL);
    expect(rowOf(sisterTurn(aiOf(c, 'dark-cindy'), 'cindy'))).toBe(DARK_ROWS.deltaAttack);
    expect(c.draws).toEqual([]);
    expect(['dark-mindy', 'dark-sandy', 'dark-cindy'].map((id) => gaugeOf(c, id))).toEqual([0, 0, 0]);
    for (const [who, id, moves] of [['sandy', 'dark-sandy', SISTER_BASIC_MOVES.sandy], ['mindy', 'dark-mindy', SISTER_BASIC_MOVES.mindy]] as const) {
      for (const raw of [0, 1]) {
        const f = trio(FULL, raw);
        expect(rowOf(sisterTurn(aiOf(f, id), who)), `${who} coin ${raw}`).toBe(moves[raw]);
        expect(gaugeOf(f, id), `${who} stays full`).toBe(100);
        expect(gaugeOf(f, 'dark-cindy'), 'nobody wrote the others').toBe(100);
      }
    }
  });

  it('the trio test fails when a Sister is dead, absent or short of 100, and outside the two trio formations it does not exist', () => {
    expect(trioReady(trio(FULL).ctx)).toBe(true);
    expect(trioReady(trio({ ...FULL, 'dark-sandy': 99 }).ctx)).toBe(false);
    expect(trioReady(trio({ 'dark-mindy': 100, 'dark-cindy': 100 }).ctx)).toBe(false); // Sandy gone: "all three alive" fails for good
    const dead = trio(FULL);
    (dead.ctx.state.combatants['dark-mindy'] as FFXCombatant).alive = false;
    expect(trioReady(dead.ctx)).toBe(false);
    expect(trioReady(trio(FULL, 0, PAIR).ctx), 'the pair formation has no trio test').toBe(false);
    expect(TRIO_BATTLE_IDS).toEqual(SISTER_FORMATIONS.filter((f) => f.sisters.length === 3).map((f) => f.battleId));
  });

  it('rule 2: her own gauge at 100 and the trio not ready: Mega Graviton on the whole front line, no draw, and the gauge goes to 0 (nothing added)', () => {
    for (const [who, id] of [['cindy', 'dark-cindy'], ['sandy', 'dark-sandy'], ['mindy', 'dark-mindy']] as const) {
      const f = trio({ 'dark-mindy': id === 'dark-mindy' ? 100 : 40, 'dark-sandy': id === 'dark-sandy' ? 100 : 40, 'dark-cindy': id === 'dark-cindy' ? 100 : 40 });
      expect(rowOf(sisterTurn(aiOf(f, id), who)), who).toBe(DARK_ROWS.megaGraviton);
      expect(f.draws, who).toEqual([]);
      expect(gaugeOf(f, id), who).toBe(0);
    }
    // a lone sister in a formation with no trio test: full is Mega Graviton, whatever the others are
    const lone = fake({ battleId: 0x00dd0047, gauges: { 'dark-cindy': 100 } });
    expect(rowOf(sisterTurn(aiOf(lone, 'dark-cindy'), 'cindy'))).toBe(DARK_ROWS.megaGraviton);
  });

  it('rule 3: otherwise a fair coin (GetRandomValue modulo 2, exact) between her two basic moves, and her gauge gains 20', () => {
    for (const [who, id, moves] of [['cindy', 'dark-cindy', SISTER_BASIC_MOVES.cindy], ['sandy', 'dark-sandy', SISTER_BASIC_MOVES.sandy], ['mindy', 'dark-mindy', SISTER_BASIC_MOVES.mindy]] as const) {
      const tally: Record<string, number> = {};
      for (let raw = 0; raw < 0x10000; raw++) {
        const f = fake({ battleId: PAIR, gauges: { [id]: 40 }, raw, living: 1 });
        const row = rowOf(sisterTurn(aiOf(f, id), who));
        tally[row] = (tally[row] ?? 0) + 1;
        if (raw < 2) expect(gaugeOf(f, id), who).toBe(60);
      }
      expect(tally, who).toEqual({ [moves[0]]: 32_768, [moves[1]]: 32_768 });
    }
    expect(SISTER_BASIC_MOVES).toEqual({
      cindy: ['dark-camisade', 'dark-cindy-attack'],
      sandy: ['dark-razzia', 'dark-sandy-attack'],
      mindy: ['dark-passado', 'dark-calamity'],
    });
  });

  it('the gauge never passes 100 (a basic move at 90 leaves 100), and a single-target move draws the picker only with two or more living', () => {
    const f = fake({ battleId: PAIR, gauges: { 'dark-mindy': 90 }, raw: 0 });
    sisterTurn(aiOf(f, 'dark-mindy'), 'mindy');
    expect(gaugeOf(f, 'dark-mindy')).toBe(100);
    expect(f.draws).toEqual([[FfxStream.Script, 0xffff], [FfxStream.Picker, 2]]);
    const solo = fake({ battleId: PAIR, gauges: { 'dark-mindy': 0 }, raw: 0, living: 1 });
    sisterTurn(aiOf(solo, 'dark-mindy'), 'mindy');
    expect(solo.draws).toEqual([[FfxStream.Script, 0xffff]]);
  });
});

// ---------------------------------------------------------------------------
// The real engine: a party that cannot die and only defends
// ---------------------------------------------------------------------------

/** The chapter's party with 90 million HP each: the Dark Aeons' blows (capped at 99,999) never end the battle, so the AI's own cadence can be read off the log. */
function immortal(): typeof mirrorAeonsBuild {
  const build = structuredClone(mirrorAeonsBuild);
  for (const m of build.members) { m.stats.maxHp = 90_000_000; m.hp = 90_000_000; }
  return build;
}

/**
 * An engine on `groupId` whose party cannot be beaten: the HP above, and the fayth's permanent Auto-Life (`EnemyGroupDef.grantsPermanentAutoLife`, the possessed-aeon fights' rule) for the one blow HP does not answer, Passado's
 * Death on every hit. The chapter's own groups never set it.
 */
function immortalEngine(seed: number, groupId: string): ReturnType<typeof H.newEngine> {
  const base = H.setup(seed, groupId, immortal());
  const engine = createFFXEngine({ content: H.content, autoResolveMinigames: true });
  engine.init({ ...base, enemies: { ...base.enemies, grantsPermanentAutoLife: true } });
  return engine;
}

interface Cadence {
  /** Every Dark Aeon's action, in order: `[actor, ability id]`. */
  actions: Array<[string, string]>;
  /** The gauge changes: `[who, from, to, cause]`. */
  gauges: Array<[string, number, number, string]>;
  /** Draws of the two script streams per Dark Aeon action: `[stream 2, stream 4]`. */
  draws: Array<[number, number]>;
  engine: ReturnType<typeof H.newEngine>;
}

/** Defend with everyone until the Dark Aeons have taken `count` actions. `between` may act on the engine before each submit. */
function cadence(groupId: string, count: number, seed = 5, between?: (e: ReturnType<typeof H.newEngine>, input: H.Input) => Command | null): Cadence {
  const engine = immortalEngine(seed, groupId);
  const out: Cadence = { actions: [], gauges: [], draws: [], engine };
  let taps: number[] = [];
  (engine as unknown as { rng: GameStreams }).rng.tap = (stream) => void taps.push(stream);
  const note = (events: readonly BattleEvent[]): void => {
    for (const ev of events) {
      if (ev.type === 'overdrive-gauge' && ev.who.startsWith('dark-')) out.gauges.push([ev.who, ev.from, ev.to, ev.cause ?? '']);
      if (ev.type === 'action-start' && ev.actorId.startsWith('dark-') && ev.abilityId !== undefined && !ev.abilityId.endsWith('-bite')) {
        out.actions.push([ev.actorId, ev.abilityId]);
        out.draws.push([taps.filter((s) => s === FfxStream.Script).length, taps.filter((s) => s === FfxStream.Picker).length]);
        taps = [];
      }
    }
  };
  for (let i = 0; i < 4000 && out.actions.length < count; i++) {
    const d = engine.nextDecision();
    if (d.kind === 'battle-over') break;
    if (d.kind === 'resolved') note(d.events);
    if (d.kind === 'player-input') note(engine.submit(between?.(engine, d) ?? H.defend()));
  }
  return out;
}

describe("Dark Yojimbo's cadence on the real engine, against an immortal party that only defends (RE note 4.5)", () => {
  const FIRST_ZANMATO = [18, 11, 8, 6, 5]; // his turn, by tier (the note's table; no hit reaches him)
  for (const [i, tier] of YOJIMBO_TIERS.entries()) {
    it(`${tier.file}: +${tier.gaugePerTurn} a turn, the first Zanmato is his turn ${FIRST_ZANMATO[i]}, and the gauge restarts at ${tier.gaugePerTurn} after it`, () => {
      const c = cadence(yojimboGroupId(tier.file), FIRST_ZANMATO[i]! + 1);
      const zanmatos = c.actions.map(([, id], n) => (id === DARK_ROWS.zanmato ? n + 1 : 0)).filter((n) => n > 0);
      expect(zanmatos[0]).toBe(FIRST_ZANMATO[i]);
      const own = c.gauges.filter(([who]) => who === 'dark-yojimbo');
      expect(own.map(([, , , cause]) => cause).filter((cause) => cause !== 'attacking' && cause !== 'zanmato'), 'no hit reached him').toEqual([]);
      const reset = own.findIndex(([, , to, cause]) => cause === 'zanmato' && to === 0);
      expect(reset).toBeGreaterThan(-1);
      expect(own[reset + 1]).toEqual(['dark-yojimbo', 0, tier.gaugePerTurn, 'attacking']);
    });
  }

  it('his three kinds of turn all occur and are the rows his record lists; the dog bites on every order and only on an order', () => {
    const c = cadence(H.groupIdOf('nagi05_71'), 24);
    const rows = new Set(c.actions.map(([, id]) => id));
    expect([...rows].sort()).toEqual([DARK_ROWS.daigoroOrder, DARK_ROWS.kozuka, DARK_ROWS.wakizashiAll, DARK_ROWS.zanmato].sort());
    const log = H.log(c.engine);
    const orders = H.actions(log, 'dark-yojimbo').filter((id) => id === DARK_ROWS.daigoroOrder).length;
    expect(H.actions(log, 'dark-daigoro')).toEqual(Array(orders).fill(DARK_ROWS.daigoroBite));
  });

  it('the streams each turn draws are the note\'s (RE section 7): one of stream 2 on every turn but Zanmato, one of stream 4 for Kozuka\'s victim and for the dog\'s bite, none for the others', () => {
    const c = cadence(H.groupIdOf('nagi05_71'), 24);
    c.actions.forEach(([, id], n) => {
      const [two, four] = c.draws[n]!;
      if (id === DARK_ROWS.zanmato) expect([two, four], 'Zanmato').toEqual([0, 0]);
      else if (id === DARK_ROWS.wakizashiAll) expect([two, four], 'Wakizashi').toEqual([1, 0]);
      else expect([two, four], id).toEqual([1, 1]); // Kozuka's victim; the order's bite victim
    });
  });

  it('every action of the party that reaches him adds 2 to the gauge (a miss included); his own dog order adds nothing', () => {
    const engine = immortalEngine(3, H.groupIdOf('nagi05_71'));
    const gains: Array<[string, number]> = [];
    for (let i = 0; i < 300 && gains.length < 6; i++) {
      const d = engine.nextDecision();
      if (d.kind === 'battle-over') break;
      if (d.kind !== 'player-input') continue;
      const swing = H.row(d, 'attack', undefined, 'dark-yojimbo');
      for (const ev of engine.submit(swing ?? H.defend())) if (ev.type === 'overdrive-gauge' && ev.who === 'dark-yojimbo' && ev.cause === 'targeted') gains.push([d.actorId, ev.to - ev.from]);
    }
    expect(gains.length).toBeGreaterThanOrEqual(6);
    for (const [, gain] of gains) expect(gain).toBe(2);
    const orderTurns = cadence(H.groupIdOf('nagi05_71'), 24).gauges.filter(([, , , cause]) => cause === 'targeted');
    expect(orderTurns, 'a passive party never reaches him: the dog order\'s hit on himself is no gain').toEqual([]);
  });
});

describe("the Sisters' cadence on the real engine, against an immortal party that only defends (RE note 5.4)", () => {
  const rounds = (c: Cadence): string[][] => {
    const out: string[][] = [];
    for (let i = 0; i < c.actions.length; i += 3) out.push(c.actions.slice(i, i + 3).map(([, id]) => id));
    return out;
  };
  const BASIC = new Set<string>([...SISTER_BASIC_MOVES.cindy, ...SISTER_BASIC_MOVES.sandy, ...SISTER_BASIC_MOVES.mindy]);

  it('the faithful trio (every gauge at 100): Mindy and Sandy take a basic move, then Cindy\'s first turn is the Delta Attack; the three gauges are 0 and refill together, so it comes again six rounds later', () => {
    const c = cadence(sistersGroupId('kino00_70'), 21);
    const r = rounds(c);
    expect(c.actions.slice(0, 3).map(([who]) => who)).toEqual(['dark-mindy', 'dark-sandy', 'dark-cindy']); // actor 20, 21, 22
    expect(BASIC.has(r[0]![0]!) && BASIC.has(r[0]![1]!)).toBe(true);
    expect(r[0]![2]).toBe(DARK_ROWS.deltaAttack);
    for (let n = 1; n < 6; n++) for (const id of r[n]!) expect(BASIC.has(id), `round ${n + 1}`).toBe(true);
    expect(BASIC.has(r[6]![0]!) && BASIC.has(r[6]![1]!)).toBe(true); // round 7: Mindy and Sandy at 100 take a basic move
    expect(r[6]![2]).toBe(DARK_ROWS.deltaAttack);
    expect(c.gauges.filter(([, , , cause]) => cause === 'delta-attack').slice(0, 3).map(([who, from, to]) => [who, from, to])).toEqual([['dark-mindy', 100, 0], ['dark-sandy', 100, 0], ['dark-cindy', 100, 0]]);
  });

  it('the trio with the gauges started at 0 (OUR adjustment): five rounds of basic turns, then the Delta Attack on Cindy\'s sixth turn, and again every six rounds', () => {
    const c = cadence(sistersGroupId('kino00_70-g0'), 21);
    const r = rounds(c);
    for (let n = 0; n < 5; n++) for (const id of r[n]!) expect(BASIC.has(id), `round ${n + 1}`).toBe(true);
    expect(r[5]![2]).toBe(DARK_ROWS.deltaAttack);
    expect(c.actions.filter(([, id]) => id === DARK_ROWS.deltaAttack).length).toBeGreaterThanOrEqual(1);
  });

  it('a lone Sister, and the pair, start at 0: five basic turns, then Mega Graviton on the sixth, then every six turns; the pair never throws a Delta Attack', () => {
    for (const [file, who] of [['kino01_71', ['dark-cindy']], ['kino05_70', ['dark-sandy']], ['kino05_71', ['dark-mindy']]] as const) {
      const c = cadence(sistersGroupId(file), 13);
      const mine = c.actions.map(([, id]) => id);
      expect(mine.slice(0, 5).every((id) => BASIC.has(id)), file).toBe(true);
      expect(mine[5], file).toBe(DARK_ROWS.megaGraviton);
      expect(mine.slice(6, 11).every((id) => BASIC.has(id)), file).toBe(true);
      expect(mine[11], file).toBe(DARK_ROWS.megaGraviton);
      expect(new Set(c.actions.map(([a]) => a)), file).toEqual(new Set(who));
    }
    const pair = cadence(sistersGroupId('kino01_72'), 26);
    expect(pair.actions.some(([, id]) => id === DARK_ROWS.deltaAttack)).toBe(false);
    expect(pair.actions.filter(([a, id]) => a === 'dark-mindy' && id === DARK_ROWS.megaGraviton).length).toBeGreaterThanOrEqual(2);
    expect(pair.actions.filter(([a, id]) => a === 'dark-sandy' && id === DARK_ROWS.megaGraviton).length).toBeGreaterThanOrEqual(2);
  });

  it('every action of the party that reaches a Sister adds 5 to her gauge; one Sister\'s death ends the Delta Attack for good (the survivors use Mega Graviton at their own 100)', () => {
    // Lulu's Ultima reaches all three: each Sister gains 5 for the one action.
    const e = immortalEngine(2, sistersGroupId('kino00_70-g0'));
    let gained: number[] = [];
    for (let i = 0; i < 80 && gained.length === 0; i++) {
      const d = e.nextDecision();
      if (d.kind === 'battle-over') break;
      if (d.kind !== 'player-input') continue;
      const ultima = d.commands.find((c) => c.enabled && c.label === 'Ultima');
      if (d.actorId === 'lulu' && ultima) {
        const events = e.submit({ ...ultima.command, targets: [ultima.validTargets[0]!] } as Command);
        gained = events.filter((ev) => ev.type === 'overdrive-gauge' && ev.who.startsWith('dark-') && ev.cause === 'targeted').map((ev) => (ev.type === 'overdrive-gauge' ? ev.to - ev.from : 0));
      } else e.submit(H.defend());
    }
    expect(gained).toEqual([5, 5, 5]);

    // Kill Mindy first (one HP, a spell that never misses): the Delta Attack never comes after her death.
    const f = immortalEngine(3, sistersGroupId('kino00_70-g0'));
    (f.state().combatants['dark-mindy'] as FFXCombatant).hp = 1;
    const after: string[] = [];
    let mindyDead = false;
    for (let i = 0; i < 700 && after.length < 40; i++) {
      const d = f.nextDecision();
      if (d.kind === 'battle-over') break;
      const evs = d.kind === 'resolved' ? d.events : [];
      const take = (list: readonly BattleEvent[]): void => {
        for (const ev of list) if (ev.type === 'action-start' && ev.actorId.startsWith('dark-') && mindyDead) after.push(ev.abilityId ?? '');
      };
      take(evs);
      if (d.kind === 'player-input') {
        const spell = !mindyDead && d.actorId === 'lulu' ? d.commands.find((c) => c.enabled && c.label === 'Fire' && c.validTargets.includes('dark-mindy')) : undefined;
        const out = f.submit(spell ? ({ ...spell.command, targets: ['dark-mindy'] } as Command) : H.defend());
        if (!(f.state().combatants['dark-mindy'] as FFXCombatant).alive) mindyDead = true;
        take(out);
      }
    }
    expect(mindyDead).toBe(true);
    expect(after.length).toBeGreaterThan(20);
    expect(after.includes(DARK_ROWS.deltaAttack)).toBe(false);
    expect(after.includes(DARK_ROWS.megaGraviton)).toBe(true);
  });

  it('the streams a Sister\'s turn draws: stream 2 once (the coin) on every turn but a Delta Attack and a Mega Graviton, stream 4 once for a single-target move, never for the group moves', () => {
    const c = cadence(sistersGroupId('kino00_70'), 18);
    c.actions.forEach(([, id], n) => {
      const [two, four] = c.draws[n]!;
      if (id === DARK_ROWS.deltaAttack || id === DARK_ROWS.megaGraviton) expect([two, four], id).toEqual([0, 0]);
      else expect([two, four], id).toEqual([1, 1]);
    });
  });
});

describe('the scripts are registered under the ids the data names, all of them or none', () => {
  it('the five script ids resolve to scripts, and the enemies carry them', async () => {
    const { getAiScript } = await import('../../../src/battle/ffx/ai/types.ts');
    for (const id of Object.values(DARK_SCRIPTS)) expect(getAiScript(id), id).toBeDefined();
    const group = (file: string): EnemyDef[] => H.setup(1, H.groupIdOf(file)).enemies.enemies;
    expect(group('kino00_70').map((e) => e.aiScriptId)).toEqual([DARK_SCRIPTS.mindy, DARK_SCRIPTS.sandy, DARK_SCRIPTS.cindy]);
    expect(group('nagi05_71').map((e) => e.aiScriptId)).toEqual([DARK_SCRIPTS.yojimbo, DARK_SCRIPTS.daigoro]);
  });
});

describe("Dark Yojimbo's Zanmato is the Strength row 0x410A, not a Death row (RE's Zanmato note, sections 1 and 5)", () => {
  it('the row: Strength formula, power 250, capped at 99,999, on the whole front line, no Death or any other status, and the game\'s record cleanses Auto-Life (extra word 0x200)', async () => {
    const { DARK_AEONS_ABILITIES, COMMAND_RECORDS_DARK_AEONS, DARK_ZANMATO_ID } = await import('../../../src/data/ffx/enemies/dark-aeons-abilities.ts');
    const row = DARK_AEONS_ABILITIES[DARK_ZANMATO_ID]!;
    expect([row.formula, row.power, row.targeting, row.hits]).toEqual(['strength', 250, 'all-enemies', 1]);
    expect(row.flags).toContain('always-break-damage-limit'); // the cap bit: 99,999
    expect(row.statusEffects, 'no Death on the Dark Yojimbo\'s row').toEqual([]);
    expect(COMMAND_RECORDS_DARK_AEONS[DARK_ZANMATO_ID]).toMatchObject({ id: 0x410a, damageClass: 1, extra: 0x200 });
    expect(DARK_ROWS.zanmato).toBe(DARK_ZANMATO_ID);
  });

  it('on the real engine it hits each front-line member for far more than 9,999 and takes a cast Auto-Life away before the death check: a holder at 3,000 HP dies and nothing revives him (the fayth\'s permanent Auto-Life, which this chapter\'s party never has, is outside the test)', () => {
    const e = H.newEngine(1, H.ACT_II_GROUP);
    (H.actor(e, 'dark-yojimbo').overdrive as { gauge: number }).gauge = 100;
    for (const id of e.state().activeIds) {
      const m = H.actor(e, id);
      m.hp = 3_000;
      m.statuses['auto-life'] = { id: 'auto-life', turnsRemaining: null, ticksRemaining: null, charges: null, stacks: 0, permanent: false };
    }
    let start = -1;
    for (let i = 0; i < 200 && start < 0; i++) {
      const d = e.nextDecision();
      if (d.kind === 'battle-over') break;
      if (d.kind === 'player-input') e.submit(H.defend());
      start = H.log(e).findIndex((ev) => ev.type === 'action-start' && ev.actorId === 'dark-yojimbo' && ev.abilityId === DARK_ROWS.zanmato);
    }
    expect(start, 'Dark Yojimbo opened with Zanmato (his gauge was full)').toBeGreaterThanOrEqual(0);
    const events = H.log(e).slice(start);
    const dealt = events.filter((ev): ev is Extract<BattleEvent, { type: 'damage' }> => ev.type === 'damage' && ev.targetId !== 'dark-yojimbo');
    expect(dealt.length).toBeGreaterThanOrEqual(1);
    for (const ev of dealt) expect(ev.amount, `${ev.targetId}: capped at 99,999, far past a plain hit's 9,999`).toBeGreaterThan(9_999);
    for (const ev of dealt) expect(ev.amount).toBeLessThanOrEqual(99_999);
    for (const id of dealt.map((ev) => ev.targetId)) {
      expect(H.actor(e, id).alive, `${id} died: Auto-Life was cleansed before the death check`).toBe(false);
    }
    for (const id of dealt.map((ev) => ev.targetId)) {
      expect(events.some((ev) => ev.type === 'status-remove' && ev.targetId === id && ev.status === 'auto-life'), `${id}: Auto-Life is taken off by the hit`).toBe(true);
    }
    expect(events.filter((ev) => ev.type === 'revive'), 'no revive is queued').toEqual([]);
  });
});
