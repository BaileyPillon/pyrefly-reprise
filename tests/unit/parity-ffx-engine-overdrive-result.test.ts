/**
 * **Engine-level parity, FFX Overdrive results** (re-parity RC4 lane B; **FFX only**). The kernel test (`parity-ffx-overdrive-result.test.ts`)
 * proves the rules against the game's machine code. This file proves the WIRING through the engine's own path (`shapeOverdrive`, then
 * `resolveAbility` on the real records), against an oracle typed again from the note (`FFX-G01` sections 4.1, 4.3 and 8) in the game's bytes:
 *
 * 1. **B1, the rider test per target.** A clean Bushido takes its (Immune) row for a target when the first pass newly inflicts none of its
 *    riders: Eject is spent when the target is immune or already carries it, the weak Delay when its delay byte is odd, the four Breaks when
 *    each is either immune or already carried. Generated targets, written as the game's words and bytes.
 * 2. **B5, the hit removal.** Slice and Dice's Fail and Lulu's Fury with fewer casts plan ALL the menu record's hits over the enemies first
 *    (one pick of stream 5 each, none under two candidates), take the missing ones away one at a time from the enemies holding the most
 *    (one draw of stream 16 each), and the rest land enemy by enemy. The oracle reads the same two streams from its own generator.
 *
 * Mutants (a deliberately wrong oracle) must disagree with the engine, so the comparison is shown to be able to fail.
 */

import { describe, expect, it } from 'vitest';
import { makeRng, type SeededRng } from '../../src/battle/common/rng.ts';
import type { AbilityDef, BattleState, FFXCombatant, MinigameResult, StatusId } from '../../src/battle/common/types.ts';
import { resolveAbility } from '../../src/battle/ffx/abilities.ts';
import { makeFfxRng } from '../../src/battle/ffx/adapt/streams.ts';
import { FFXContentRegistry } from '../../src/battle/ffx/index.ts';
import { immuneToRider, shapeOverdrive } from '../../src/battle/ffx/overdriveShape.ts';
import { makeActorRuntime, type Ctx, type FFXRuntime } from '../../src/battle/ffx/state.ts';
import { ABILITIES as AURON } from '../../src/data/ffx/abilities/overdrive-auron.ts';
import { ABILITIES as LULU } from '../../src/data/ffx/abilities/overdrive-lulu-1.ts';
import { ABILITIES as LULU2 } from '../../src/data/ffx/abilities/overdrive-lulu-2.ts';
import { ABILITIES as TIDUS } from '../../src/data/ffx/abilities/overdrive-tidus.ts';
import { fighter, stats } from './ffx-fixtures.test.ts';

// ------------------------------------------------------------------------------------------------------ B1: the rider test

/** The four Breaks, typed again: bits 0x10 .. 0x80 of the permanent word, resistance bytes 4 .. 7. */
const BREAK_IDS: readonly StatusId[] = ['power-break', 'magic-break', 'armor-break', 'mental-break'];

interface Words {
  perm: number;
  extra: number;
  extraImmune: number;
  delayImmune: number;
  breaks: number[];
}

function randomWords(rng: SeededRng): Words {
  const chance = (p: number): boolean => rng.next() < p;
  let perm = 0;
  for (let k = 0; k < 4; k++) if (chance(0.25)) perm |= 0x10 << k;
  return {
    perm,
    extra: chance(0.2) ? 0x100 : 0,
    extraImmune: chance(0.25) ? 0x100 : 0,
    delayImmune: rng.pick([0, 0, 1, 2, 3, 254, 255]),
    breaks: [0, 1, 2, 3].map(() => rng.pick([0, 0, 50, 254, 255, 255])),
  };
}

function targetOf(w: Words): FFXCombatant {
  const t = fighter({ id: 'foe', side: 'enemy' });
  for (let k = 0; k < 4; k++) {
    if ((w.perm & (0x10 << k)) !== 0) t.statuses[BREAK_IDS[k] as StatusId] = { id: BREAK_IDS[k] as StatusId, turnsRemaining: 254, ticksRemaining: null, charges: null, stacks: 0, permanent: false };
    t.immunities[BREAK_IDS[k] as StatusId] = w.breaks[k] as number;
  }
  if ((w.extra & 0x100) !== 0) t.statuses['eject'] = { id: 'eject', turnsRemaining: null, ticksRemaining: null, charges: null, stacks: 0, permanent: true };
  if ((w.extraImmune & 0x100) !== 0) t.immunities['eject'] = 255;
  if ((w.delayImmune & 1) !== 0) t.immunityFlags = ['immune-to-delay'];
  return t;
}

/** Riders newly inflicted, from the game's words (typed again from FFX-G01 section 4.3). */
function riders(move: string, w: Words, mutant?: string): number {
  switch (move) {
    case 'shooting-star':
      return (w.extraImmune & 0x100) !== 0 || (mutant !== 'carried-eject-lands' && (w.extra & 0x100) !== 0) ? 0 : 1;
    case 'dragon-fang':
      return (w.delayImmune & 1) !== 0 ? 0 : 1;
    case 'banishing-blade': {
      if (mutant === 'one-immune-break') return w.breaks.some((b) => b === 255) ? 0 : 4;
      let n = 0;
      for (let k = 0; k < 4; k++) if (w.breaks[k] !== 255 && (mutant === 'carried-break-lands' || (w.perm & (0x10 << k)) === 0)) n++;
      return n;
    }
    default:
      return 0;
  }
}

describe('B1: a clean Bushido picks its (Immune) row per target as the first pass decides', () => {
  const moves = ['shooting-star', 'dragon-fang', 'banishing-blade'] as const;
  const rng = makeRng(20261011);
  const cases = Array.from({ length: 900 }, () => ({ move: rng.pick(moves), w: randomWords(rng) }));

  it('900 generated targets: immuneToRider equals "no rider newly inflicted"', () => {
    const seen = { immune: 0, lands: 0, carried: 0, mixed: 0 };
    for (const { move, w } of cases) {
      const def = AURON[move] as AbilityDef;
      const want = riders(move, w) === 0;
      expect(immuneToRider(def, targetOf(w)), `${move} ${JSON.stringify(w)}`).toBe(want);
      if (want) seen.immune++;
      else seen.lands++;
      if (move === 'banishing-blade' && (w.perm & 0xf0) !== 0 && want) seen.carried++;
      if (move === 'banishing-blade' && (w.perm & 0xf0) !== 0 && w.breaks.some((b) => b === 255) && want) seen.mixed++;
    }
    expect(seen.immune).toBeGreaterThan(100);
    expect(seen.lands).toBeGreaterThan(300);
    expect(seen.carried).toBeGreaterThan(5); // every Break immune or carried, with at least one carried
  });
  it('Tornado has no rider and no Immune row', () => {
    expect(immuneToRider(AURON['tornado'] as AbilityDef, targetOf(randomWords(rng)))).toBe(false);
  });
  for (const mutant of ['one-immune-break', 'carried-break-lands', 'carried-eject-lands']) {
    it(`mutant "${mutant}" is caught`, () => {
      const wrong = cases.filter(({ move, w }) => (riders(move, w, mutant) === 0) !== immuneToRider(AURON[move] as AbilityDef, targetOf(w))).length;
      expect(wrong).toBeGreaterThan(5);
    });
  }
});

// ------------------------------------------------------------------------------------------------------ B5: the hit removal

interface Board {
  ctx: Ctx;
  user: FFXCombatant;
  foes: FFXCombatant[];
  draws: Array<{ stream: number; value: number }>;
}

/** A user, `foes` enemies with HP to spare, and the game's own 68 streams for a seed. */
function board(userId: 'tidus' | 'lulu', foes: number, seed: number): Board {
  const rng = makeFfxRng(seed);
  const draws: Array<{ stream: number; value: number }> = [];
  rng.tap = (stream, value) => draws.push({ stream, value });
  const user = fighter({ id: userId, side: 'party', stats: stats({ str: 40, mag: 60, hp: 3000, maxHp: 3000 }) });
  const enemies = Array.from({ length: foes }, (_, i) => fighter({ id: `foe${i}`, side: 'enemy', stats: stats({ hp: 900_000, maxHp: 900_000, def: 1, mdef: 1 }) }));
  const combatants: Record<string, FFXCombatant> = { [userId]: user };
  for (const e of enemies) combatants[e.id] = e;
  const state: BattleState = {
    game: 'ffx', combatants, activeIds: [userId], reserveIds: [], enemyIds: enemies.map((e) => e.id), aeonId: null, turn: 1, ticks: 0, log: [], nextSeq: 0,
    triggers: [], firedTriggerIds: [], result: null, seed, flags: {},
  };
  const rt: FFXRuntime = {
    actors: new Map(), currentActorId: null, elapsedTicks: 0, lastEnemyActorId: null, pendingMinigame: null, elapsedMs: 0, finished: false,
    aeonStoredGauge: new Map(), frozenPartyCtb: new Map(), aeonRoster: new Map(), inventory: new Map(), gil: 0, chained: false, overkilled: [],
    canEscape: false, sensedIds: new Set(), pendingPartRevivals: [], progress: { bestEnemyHp: 0, atTurn: 0 },
  };
  for (const c of [user, ...enemies]) rt.actors.set(c.id, makeActorRuntime(c));
  const ctx: Ctx = { state, rt, rng, content: new FFXContentRegistry(), emit: (e) => state.log.push({ ...e, seq: state.nextSeq++ } as never) };
  return { ctx, user, foes: enemies, draws };
}

/** Run an Overdrive through the engine's path with a minigame result; the hits that landed on each enemy, and every draw by stream. */
function engineHits(def: AbilityDef, result: MinigameResult, userId: 'tidus' | 'lulu', foes: number, seed: number): { hits: number[]; byStream: Map<number, number[]> } {
  const b = board(userId, foes, seed);
  const shaped = shapeOverdrive(b.ctx, b.user, def, result);
  resolveAbility(b.ctx, b.user, shaped.def, [], shaped.options);
  const hits = b.foes.map((f) => b.ctx.state.log.filter((e) => e.type === 'damage' && e.targetId === f.id && e.sourceId === userId).length);
  const byStream = new Map<number, number[]>();
  for (const d of b.draws) byStream.set(d.stream, [...(byStream.get(d.stream) ?? []), d.value]);
  return { hits, byStream };
}

type Mutant = 'old-model' | 'uniform-removal' | 'one-short' | 'ties-first';

/** The game's plan and removal (FFX-G01 sections 4.2 and 8), reading streams 5 and 16 from a generator of its own. */
function oracleHits(menuHits: number, left: number, foes: number, seed: number, mutant?: Mutant): { hits: number[]; used16: number[] } {
  const rng = makeFfxRng(seed);
  const used16: number[] = [];
  const hits = new Array<number>(foes).fill(0);
  if (mutant === 'old-model') {
    // the old engine: `left` fresh picks, nothing removed
    for (let k = 0; k < left; k++) hits[foes < 2 ? 0 : rng.draw(5) % foes]!++;
    return { hits, used16 };
  }
  for (let k = 0; k < menuHits; k++) hits[foes < 2 ? 0 : rng.draw(5) % foes]!++;
  const remove = menuHits - left - (mutant === 'one-short' ? 1 : 0);
  for (let k = 0; k < remove; k++) {
    const most = Math.max(...hits);
    if (most === 0) continue;
    const tied = hits.flatMap((h, i) => (h === most ? [i] : []));
    const value = rng.draw(16);
    used16.push(value);
    const idx = mutant === 'uniform-removal' ? value % foes : (tied[mutant === 'ties-first' ? 0 : value % tied.length] as number);
    if ((hits[idx] as number) > 0) hits[idx]!--;
  }
  return { hits, used16 };
}

const FURY = LULU['fire-fury'] as AbilityDef;
const fury = (casts: number): MinigameResult => ({ kind: 'lulu-fury', fury: { sweptDegrees: 0, casts } });
const sliceFail: MinigameResult = { kind: 'tidus-timing', timing: { success: false, timeRemainingMs: 0, timerMs: 3000 } };
const sliceWin: MinigameResult = { kind: 'tidus-timing', timing: { success: true, timeRemainingMs: 1000, timerMs: 3000 } };

describe('B5: a result takes hits away from a plan made over all the targets', () => {
  it('Lulu\'s Fury: 1 to 16 casts over 1 to 4 enemies, 400 seeds: the hits on each enemy and the draws of stream 16', () => {
    let drew = 0;
    let multi = 0;
    for (let i = 0; i < 400; i++) {
      const foes = 1 + (i % 4);
      const casts = 1 + ((i * 7) % 16);
      const seed = 1000 + i;
      const got = engineHits(FURY, fury(casts), 'lulu', foes, seed);
      const want = oracleHits(16, casts, foes, seed);
      expect(got.hits, `fury ${casts} casts, ${foes} enemies, seed ${seed}`).toEqual(want.hits);
      expect(got.byStream.get(16) ?? [], `stream 16, fury ${casts}, ${foes} enemies, seed ${seed}`).toEqual(want.used16);
      if (want.used16.length > 0) drew++;
      if (foes > 1 && casts < 16) multi++;
    }
    expect(drew).toBeGreaterThan(300);
    expect(multi).toBeGreaterThan(200);
  });
  it('Slice and Dice: a failed minigame plans 6 hits and takes 3 away; a clean one lands all 6, target by target', () => {
    const def = TIDUS['slice-and-dice'] as AbilityDef;
    for (let i = 0; i < 200; i++) {
      const foes = 1 + (i % 4);
      const seed = 5000 + i;
      const fail = engineHits(def, sliceFail, 'tidus', foes, seed);
      const wantFail = oracleHits(6, 3, foes, seed);
      expect(fail.hits, `fail, ${foes} enemies, seed ${seed}`).toEqual(wantFail.hits);
      expect(fail.byStream.get(16) ?? [], `fail stream 16, ${foes} enemies, seed ${seed}`).toEqual(wantFail.used16);
      const win = engineHits(def, sliceWin, 'tidus', foes, seed);
      const wantWin = oracleHits(6, 6, foes, seed);
      expect(win.hits, `win, ${foes} enemies, seed ${seed}`).toEqual(wantWin.hits);
      expect(win.byStream.get(16)).toBeUndefined(); // nothing removed: no draw on stream 16
    }
  });
  it('with one enemy the result is the same hits as before and only stream 16 is touched on top', () => {
    const one = engineHits(FURY, fury(9), 'lulu', 1, 77);
    expect(one.hits).toEqual([9]);
    expect(one.byStream.get(5)).toBeUndefined(); // no pick is drawn under two candidates
    expect(one.byStream.get(16)?.length).toBe(7); // 16 - 9
  });
  it('a Fury with no casts plans nothing: no hit, no pick, no removal draw', () => {
    const got = engineHits(FURY, fury(0), 'lulu', 3, 55);
    expect(got.hits).toEqual([0, 0, 0]);
    expect(got.byStream.get(16)).toBeUndefined();
    expect(got.byStream.get(5)?.length ?? 0).toBeLessThanOrEqual(1); // at most the one pick the action names its first target with
  });
  it('Demi and Ultima Fury (every enemy, not random) give every enemy the casts, with no pick and no removal draw', () => {
    for (const id of ['demi-fury', 'ultima-fury']) {
      const got = engineHits(LULU2[id] as AbilityDef, fury(5), 'lulu', 3, 91);
      expect(got.hits, id).toEqual([5, 5, 5]);
      expect(got.byStream.get(5), id).toBeUndefined();
      expect(got.byStream.get(16), id).toBeUndefined();
    }
  });
  for (const [mutant, atLeast] of [['old-model', 100], ['uniform-removal', 50], ['one-short', 100], ['ties-first', 15]] as Array<[Mutant, number]>) {
    it(`mutant "${mutant}" is caught`, () => {
      let differing = 0;
      for (let i = 0; i < 300; i++) {
        const foes = 2 + (i % 3);
        const casts = 1 + ((i * 5) % 15);
        const seed = 3000 + i;
        const got = engineHits(FURY, fury(casts), 'lulu', foes, seed);
        const wrong = oracleHits(16, casts, foes, seed, mutant);
        if (JSON.stringify(got.hits) !== JSON.stringify(wrong.hits) || JSON.stringify(got.byStream.get(16) ?? []) !== JSON.stringify(wrong.used16)) differing++;
      }
      expect(differing).toBeGreaterThanOrEqual(atLeast);
    });
  }
});

describe('B1 end to end: Banishing Blade through the engine\'s own path', () => {
  const blade = AURON['banishing-blade'] as AbilityDef;
  const clean: MinigameResult = { kind: 'auron-sequence', sequence: { success: true, correctInputs: 7, timeRemainingMs: 0 } };
  /** One clean Banishing Blade at a lone enemy that carries the Breaks in `carried` and is immune (255) to those in `immune`: the row it takes and the Breaks that land. */
  function strike(carried: number[], immune: number[]): { power: number | undefined; breaks: string[]; damaged: boolean } {
    const b = board('tidus', 1, 4242);
    const foe = b.foes[0] as FFXCombatant;
    for (const k of carried) foe.statuses[BREAK_IDS[k] as StatusId] = { id: BREAK_IDS[k] as StatusId, turnsRemaining: 254, ticksRemaining: null, charges: null, stacks: 0, permanent: false };
    for (const k of immune) foe.immunities[BREAK_IDS[k] as StatusId] = 255;
    const shaped = shapeOverdrive(b.ctx, b.user, blade, clean);
    const row = shaped.options.rowFor?.(foe);
    resolveAbility(b.ctx, b.user, shaped.def, [foe.id], shaped.options);
    const log = b.ctx.state.log;
    return {
      power: row?.power,
      breaks: log.flatMap((e) => (e.type === 'status-add' ? [e.status] : [])),
      damaged: log.some((e) => e.type === 'damage' && e.amount > 0),
    };
  }
  it('every Break carried, or each one carried or immune: the (Immune) row (30 DmgCon for 28), and no Break is inflicted', () => {
    expect(strike([], []).power).toBeUndefined(); // a plain target takes the success row and all four Breaks
    expect(strike([], []).breaks.length).toBe(4);
    for (const [carried, immune] of [[[0, 1, 2, 3], []], [[0, 1], [2, 3]], [[0], [1, 2, 3]], [[], [0, 1, 2, 3]]] as Array<[number[], number[]]>) {
      const got = strike(carried, immune);
      expect(got.power, `carried ${carried} immune ${immune}`).toBe(30);
      expect(got.damaged).toBe(true);
      expect(got.breaks).toEqual([]);
    }
  });
  it('one Break still landing is enough for the success row (28 DmgCon): the others are carried or immune and only the rest land', () => {
    for (const [carried, immune, lands] of [[[], [0], 3], [[2], [], 3], [[0], [1], 2], [[0, 1], [2], 1], [[0, 1, 2], [], 1]] as Array<[number[], number[], number]>) {
      const got = strike(carried, immune);
      expect(got.power, `carried ${carried} immune ${immune}`).toBeUndefined();
      expect(got.breaks.length, `carried ${carried} immune ${immune}`).toBe(lands);
    }
  });
});
