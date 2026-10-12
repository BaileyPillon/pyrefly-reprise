/**
 * **FFX-2's own random streams, at the engine** (re-parity RNG lane; Bailey 2026-10-09: "Adopt game streams (Recommended)").
 *
 * What is proved here, and against what:
 *
 * 1. **Which stream each draw of an action comes from.** For 400 generated actions, by user (a girl in each party slot, a monster
 *    in each of the first eight monster slots), the real `resolveAbility` runs on FFX-2's own 68 streams with every draw
 *    recorded; the kernels then run on the SAME recorded values, in the game's order (`helpers/ffx2WiringOracle.ts`, which
 *    imports nothing from the engine's adapters), each draw labelled by its role (hit roll, random-target pick, variance, critical
 *    roll, status roll, shatter roll, steal and Bribe rolls, a knock-out's gauge reset, a Poison or Regen phase); and each draw's
 *    stream is compared with a table written out again below from `research/re-ffx2-hit-status.md` section 1.1 (a girl's own
 *    purpose-0 stream is `slot + 20`, a monster's `slot + 13`, plus 16 for the hit roll and 32 for status rolls; the fixed streams
 *    5, 10 and 11) and section 5 (the theft streams). The engine's own rolls (a status the game's 24-entry tables cannot hold) are
 *    on the engine-side stream.
 * 2. **The mutation check**: the same comparison on an engine whose generator moves one purpose onto another stream fails for each.
 * 3. **The scripts' rolls**: `random()` is stream 2 (the low 16 bits), every target search stream 4 (no draw under two candidates),
 *    Russian Roulette's row `random() % 5`; the opening of a battle (each unit's start on its own purpose-0 stream, the first-strike
 *    pair on stream 1, a reset on the unit's own).
 * 4. **Determinism**: the same run seed gives the same draws.
 *
 * Game case: **FFX-2 only**. FFX has its own streams and its own test (`parity-ffx-rng-streams.test.ts`).
 */

import { describe, expect, it } from 'vitest';
import type { AbilityDef } from '../../src/battle/common/types.ts';
import { AUX_STREAM, GameStreams } from '../../src/battle/common/streams.ts';
import * as data from '../../src/data/ffx2/index.ts';
import { FALLBACK_ABILITY_IDS, defaultAbilities } from '../../src/battle/ffx2/abilities.ts';
import { resolveAbility } from '../../src/battle/ffx2/resolve.ts';
import { assignSlots } from '../../src/battle/ffx2/atb-engine.ts';
import { FFX2_STREAM_GAME, makeFfx2Rng } from '../../src/battle/ffx2/adapt/streams.ts';
import { oracleRoles } from './helpers/ffx2WiringOracle.ts';
import { engineUnit, makeRng, randomSituation, wiringPool, type Situation } from './helpers/ffx2WiringRig.ts';

// ------------------------------------------------------------------------------------------ the independent stream table

type Purpose = 0 | 1 | 2;

/** `research/re-ffx2-hit-status.md` section 1.1, written out again: a character's stream for a purpose. */
function streamFor(slot: number, purpose: Purpose): number {
  const base = slot >= 15 ? slot + 0x0d : slot + 0x14; // a monster slot 15 to 30, or a party slot 0 to 14
  return base + (purpose === 1 ? 0x10 : purpose === 2 ? 0x20 : 0);
}

const SCRIPT = 2;
const SEARCH = 4;
const RANDOM_TARGET = 5;
const STEAL = 10;
const STEAL_SLOT = 11;

const ALL: AbilityDef[] = [
  ...Object.values(data.ABILITIES),
  ...FALLBACK_ABILITY_IDS.map((id) => defaultAbilities.get(id) as AbilityDef),
];
const POOL = wiringPool(ALL);

// ----------------------------------------------------------------------------------------------------- the engine, tapped

interface Run {
  taps: Array<{ stream: number; value: number }>;
  userSlot: number;
  /** The kernel slot of each target, by index. */
  targetSlots: number[];
}

/** The engine's resolver on a game generator, with the user moved to rank `k` of its side by `k` dummies before it. */
function viaEngine(sit: Situation, k: number, rng: GameStreams): Run {
  const taps: Run['taps'] = [];
  rng.tap = (stream, value) => taps.push({ stream, value });
  const dummies = Array.from({ length: k }, (_, i) => engineUnit(sit.targets[0]!, `d${i}`, sit.userSide, i));
  const user = engineUnit(sit.user, 'u', sit.userSide, k);
  const sameSide = sit.targetSide === sit.userSide;
  const targets = sit.targets.map((t, i) => engineUnit(t, `t${i}`, sit.targetSide, sameSide ? k + 1 + i : i));
  const units = [...dummies, user, ...targets];
  assignSlots(units); // the engine does this when a battle opens
  const events: unknown[] = [];
  const state = { flags: {} as Record<string, number | string | boolean> };
  if (sit.wallet !== undefined) state.flags['gil'] = sit.wallet;
  resolveAbility(
    { units, abilities: { get: () => undefined }, rng, emit: (e) => events.push(e), breaksDamageLimit: () => sit.user.breakLimit, state: state as never },
    user,
    sit.def,
    sit.targetSide === 'enemy' && sit.def.targeting.startsWith('single') ? [targets[0]!.id] : targets.map((t) => t.id),
    { ...(sit.hitsOverride > 0 ? { hitsOverride: sit.hitsOverride } : {}), gilSpent: sit.gilSpent },
  );
  return { taps, userSlot: user.gauge.slot, targetSlots: targets.map((t) => t.gauge.slot) };
}

/** The stream the table gives a role, for this user and these targets. */
function expectedStream(role: string, userSlot: number, targetSlots: readonly number[]): number {
  const [kind, index] = role.split(':') as [string, string | undefined];
  const target = targetSlots[Number(index ?? 0)] ?? userSlot;
  switch (kind) {
    case 'row': return SCRIPT; // Russian Roulette's `random() % 5`
    case 'hit': return streamFor(userSlot, 1);
    case 'pick': return RANDOM_TARGET;
    case 'variance': case 'crit': return streamFor(userSlot, 0);
    case 'status': case 'shatter': return streamFor(userSlot, 2);
    case 'steal': return STEAL;
    case 'stealSlot': return STEAL_SLOT;
    case 'pilfer': return STEAL;
    case 'bribeSlot': return STEAL_SLOT;
    case 'bribe': return STEAL;
    case 'ko': case 'phase': return streamFor(target, 0); // the unit's own purpose-0 stream
    case 'rider': return AUX_STREAM; // a status the game's tables cannot hold: the engine's own roll
    default: throw new Error(`no stream for the role ${role}`);
  }
}

function compare(n: number, make: (seed: number) => GameStreams): { bad: string[]; compared: number; users: Set<string>; roles: Set<string> } {
  const rng = makeRng(20261011);
  const bad: string[] = [];
  const users = new Set<string>();
  const roles = new Set<string>();
  for (let i = 0; i < n; i++) {
    const sit = randomSituation(rng, POOL);
    const k = sit.userSide === 'party' ? rng.int(0, 2) : rng.int(0, 7);
    const run = viaEngine(sit, k, make(500 + i));
    // The kernel slots, from the note (the party 0 to 14, the monsters 15 to 30, each side by rank): the user stands behind k dummies of its side.
    const sameSide = sit.targetSide === sit.userSide;
    const userSlot = (sit.userSide === 'enemy' ? 15 : 0) + k;
    const targetSlots = sit.targets.map((_, t) => (sit.targetSide === 'enemy' ? 15 : 0) + (sameSide ? k + 1 : 0) + t);
    if (run.userSlot !== userSlot || run.targetSlots.join() !== targetSlots.join()) bad.push(`#${i} ${sit.def.id}: the engine numbered its units ${run.userSlot}/${run.targetSlots.join()}, the note says ${userSlot}/${targetSlots.join()}`);
    const { roles: seen, used } = oracleRoles(sit, run.taps.map((t) => t.value));
    const expected = seen.map((r) => expectedStream(r, userSlot, targetSlots));
    const got = run.taps.map((t) => t.stream);
    users.add(`${sit.userSide}:${userSlot}`);
    for (const r of seen) roles.add(r.split(':')[0]!);
    if (used !== run.taps.length || expected.join() !== got.join()) bad.push(`#${i} ${sit.def.id} by slot ${userSlot}: wanted ${expected.join()} (${seen.join(' ')}), saw ${got.join()}`);
  }
  return { bad, compared: n, users, roles };
}

/** An engine whose generator moves one purpose onto another stream. */
class Mutant extends GameStreams {
  constructor(private readonly remap: (stream: number) => number, seed: number) {
    super(FFX2_STREAM_GAME, seed);
  }

  override on(stream: number): ReturnType<GameStreams['on']> {
    return super.on(this.remap(stream));
  }
}

describe('the draws of an action come from the stream the table names (written out again from the note)', () => {
  it('there is a pool to draw from', () => {
    expect(POOL.length).toBeGreaterThan(120);
  });

  it('400 generated actions: every draw is on the stream its role names, for each girl slot and monster slot', () => {
    const r = compare(400, (seed) => makeFfx2Rng(seed));
    expect(r.bad.slice(0, 5)).toEqual([]);
    expect([...r.users].filter((u) => u.startsWith('enemy')).length).toBeGreaterThanOrEqual(8);
    expect([...r.users].filter((u) => u.startsWith('party')).length).toBe(3);
    // the sample reaches every kind of draw
    for (const role of ['hit', 'variance', 'crit', 'status', 'shatter', 'pick', 'steal', 'ko']) expect([...r.roles], role).toContain(role);
  });

  it('MUTANT: the hit roll on the variance stream is caught', () => {
    const r = compare(400, (seed) => new Mutant((s) => (s >= 36 && s <= 51 ? s - 16 : s), seed));
    expect(r.bad.length).toBeGreaterThan(20);
  });

  it('MUTANT: the status roll on the hit stream is caught', () => {
    const r = compare(400, (seed) => new Mutant((s) => (s >= 52 && s <= 67 ? s - 16 : s), seed));
    expect(r.bad.length).toBeGreaterThan(5);
  });

  it('MUTANT: the monsters at FFX\'s offset (slot + 8) are caught', () => {
    const r = compare(400, (seed) => new Mutant((s) => (s >= 28 && s <= 43 ? s + 1 : s), seed));
    expect(r.bad.length).toBeGreaterThan(50);
  });

  it('MUTANT: the random-target pick on the search stream is caught', () => {
    const r = compare(400, (seed) => new Mutant((s) => (s === 5 ? 4 : s), seed));
    expect(r.bad.length).toBeGreaterThan(0);
  });

  it('MUTANT: Steal on the slot stream is caught', () => {
    const r = compare(400, (seed) => new Mutant((s) => (s === 10 ? 11 : s), seed));
    expect(r.bad.length).toBeGreaterThan(0);
  });

  it('the same run seed gives the same draws, action after action', () => {
    const rng = makeRng(5);
    for (let i = 0; i < 30; i++) {
      const sit = randomSituation(rng, POOL);
      const a = viaEngine(sit, 1, makeFfx2Rng(9));
      const b = viaEngine(sit, 1, makeFfx2Rng(9));
      expect(b.taps).toEqual(a.taps);
    }
  });
});

describe('a stream is a stream: the engine\'s draws on one never move another', () => {
  it('the first-attack pair and the opening starts read their own streams (1 and the units\' own)', async () => {
    const { openBattleGauges } = await import('../../src/battle/ffx2/atb-open.ts');
    const { aiUnit } = await import('../../src/battle/ffx2/fixtures.ts');
    const rng = makeFfx2Rng(3);
    const taps: number[] = [];
    rng.tap = (stream) => taps.push(stream);
    const units = [aiUnit('yuna', 'party', 500, 0), aiUnit('rikku', 'party', 500, 1), aiUnit('paine', 'party', 500, 2), aiUnit('boss', 'enemy', 5000, 0)];
    openBattleGauges(units, 'normal', { continuation: false, rollFirstAttack: true }, rng);
    // each of the four units draws its start on its own purpose-0 stream, party first (slots 0 to 2: 20 to 22; the monster slot 15: 28);
    // then the first-attack roll's pair on stream 1; a normal result (no reset) draws no more
    expect(taps.slice(0, 4)).toEqual([20, 21, 22, 28]);
    expect(taps.slice(4, 6)).toEqual([1, 1]);
    for (const s of taps.slice(6)) expect([streamFor(0, 0), streamFor(1, 0), streamFor(2, 0), streamFor(15, 0)]).toContain(s);
  });

  it('a script\'s random() is stream 2 (16 bits) and its target searches stream 4 (no draw under two), Russian Roulette is random() % 5', async () => {
    const { scriptMod, scriptValue, searchUniform, pickFrom, spendSearchDraw } = await import('../../src/battle/ffx2/ai/script-rolls.ts');
    const { aiUnit } = await import('../../src/battle/ffx2/fixtures.ts');
    const rng = makeFfx2Rng(21);
    const mirror = makeFfx2Rng(21);
    const taps: number[] = [];
    rng.tap = (stream) => taps.push(stream);
    expect(scriptValue(rng)).toBe(mirror.draw(SCRIPT) & 0xffff);
    expect(scriptMod(rng, 7)).toBe((mirror.draw(SCRIPT) & 0xffff) % 7);
    const girls = [aiUnit('paine', 'party', 100, 2), aiUnit('yuna', 'party', 100, 0), aiUnit('rikku', 'party', 100, 1)];
    expect(searchUniform(rng, girls)?.id).toBe(['yuna', 'rikku', 'paine'][mirror.draw(SEARCH) % 3]); // slot order, the (value % n)-th
    expect(pickFrom(rng, ['a', 'b', 'c', 'd'])).toBe(['a', 'b', 'c', 'd'][mirror.draw(SEARCH) % 4]);
    expect(taps).toEqual([SCRIPT, SCRIPT, SEARCH, SEARCH]);
    taps.length = 0;
    expect(searchUniform(rng, girls.slice(0, 1))?.id).toBe('paine');
    expect(pickFrom(rng, ['only'])).toBe('only');
    spendSearchDraw(rng, 1);
    expect(taps).toEqual([]);
    spendSearchDraw(rng, 2);
    expect(taps).toEqual([SEARCH]);
  });

  it('the engine-side stand-ins (a placeholder aim, a player\'s minigame default, a Berserk pick) move no game stream', async () => {
    const { resolveTargets } = await import('../../src/battle/ffx2/targeting.ts');
    const rng = makeFfx2Rng(14);
    const before = Array.from(rng.states);
    const taps: number[] = [];
    rng.tap = (stream) => taps.push(stream);
    const sit = randomSituation(makeRng(3), POOL);
    const actor = engineUnit(sit.user, 'a', 'party', 0);
    const foes = [engineUnit(sit.targets[0]!, 'f1', 'enemy', 0), engineUnit(sit.targets[0]!, 'f2', 'enemy', 1)];
    for (const f of foes) f.alive = true;
    resolveTargets([actor, ...foes], actor, { targeting: 'single-enemy', flags: [] }, [], rng);
    expect(taps).toEqual([AUX_STREAM]);
    expect(Array.from(rng.states)).toEqual(before);
  });
});
