/**
 * Replays of the FFX-G08 machine-code and script-VM runs through the lane FFX-K kernels (`kernel/yojimbo.ts`, `kernel/sisters.ts`,
 * `kernel/aeon-request.ts`, `kernel/aeon-stats.ts#summonCtb`). **FFX only.**
 *
 * A vector is one run of the game's own code (FFX.exe 0x007a7b90 and friends in an x86-32 emulator, or the battle system script on the
 * game's script VM) with its inputs and the outputs the game gave; every function here feeds the inputs to the TypeScript kernel and counts
 * the runs where it answers differently. `tests/unit/parity-ffx-yojimbo.test.ts` and `parity-ffx-sisters.test.ts` call these on the
 * fixtures in `tests/fixtures/parity/ffx/` (stratified subsets of the note's runs); the whole sets (144,839 + 39,998 + 60,000 + 183,000 +
 * 9,000 + 4,000) are replayed through the same functions by the lane's scratch runner, which is how the handoff's totals were made.
 *
 * The vector layouts are written beside each function.
 */

import {
  type YojimboHost,
  type YojimboInputs,
  type YojimboRun,
  compatAdd,
  dismissEvent,
  freeAttackEvent,
  payEvent,
  rollYojimboCommand,
  truncToInt32,
  turnStartRoll,
  wipeEvent,
} from '../../../src/battle/ffx/kernel/yojimbo.ts';
import { aeonSpecialRequest } from '../../../src/battle/ffx/kernel/aeon-request.ts';
import {
  afterAction,
  increaseMotivation,
  magusRoll,
  newMagusChr,
  positiveCaseTest,
  setMotivationChange,
  sisterMenu,
  storeStandingOrder,
} from '../../../src/battle/ffx/kernel/sisters.ts';
import { type SummonSlot, summonCtb } from '../../../src/battle/ffx/kernel/aeon-stats.ts';

/** How many runs a replay compared, how many the kernel answered differently, and the first few of those. */
export interface Tally {
  n: number;
  bad: number;
  first: unknown[];
}

export const tally = (): Tally => ({ n: 0, bad: 0, first: [] });

function note(t: Tally, ok: boolean, detail: () => unknown): void {
  t.n++;
  if (!ok) {
    t.bad++;
    if (t.first.length < 5) t.first.push(detail());
  }
}

const same = (a: unknown, b: unknown): boolean => JSON.stringify(a) === JSON.stringify(b);

const f32view = new DataView(new ArrayBuffer(4));
/** A float32 from its bit pattern. */
function f32FromBits(bits: number): number {
  f32view.setUint32(0, bits >>> 0, true);
  return f32view.getFloat32(0, true);
}

// ---------------------------------------------------------------------------
// Yojimbo
// ---------------------------------------------------------------------------

/** `[class, aTag, aValue, bTag, bValue, command]`: RollYojimboCommand (0x007a7b90). A tag `i` is an integer argument, `f` a float32 bit pattern. */
export type RollVector = [string, string, number, string, number, number];
export function replayRoll(vectors: readonly RollVector[], t = tally()): Tally {
  for (const [cls, aTag, a, bTag, b, exp] of vectors) {
    const av = aTag === 'i' ? a : truncToInt32(f32FromBits(a));
    const bv = bTag === 'i' ? b : truncToInt32(f32FromBits(b));
    const got = rollYojimboCommand(av, bv);
    note(t, got === exp, () => ({ cls, aTag, a, bTag, b, got, exp }));
  }
  return t;
}

/** `[character, Chr+0xdf3, compatibility, draw, result, draws taken, stream drawn]`: the turn-start roll (0x00792120). */
export type CompatRollVector = [number, number, number, number, number, number, number];
export function replayCompatRoll(vectors: readonly CompatRollVector[], t = tally()): Tally {
  for (const [chr, df3, comp, draw, exp, expDraws, expStream] of vectors) {
    let drew = 0;
    const got = turnStartRoll(chr, df3, comp, () => (drew++, draw)) >>> 0;
    // Only Yojimbo draws, and then on stream 17 (YOJIMBO_STREAM); the replay checks the count and that the stream is his.
    note(t, got === exp && drew === expDraws && (drew === 0 ? expStream === -1 : expStream === 17), () => ({ chr, df3, comp, draw, got, exp, drew, expDraws, expStream }));
  }
  return t;
}

/** `[compatibility, delta, result]`: the compatibility add (0x007b2950). */
export type CompatAddVector = [number, number, number];
export function replayCompatAdd(vectors: readonly CompatAddVector[], t = tally()): Tally {
  for (const [c0, d, exp] of vectors) {
    const got = compatAdd(c0, d);
    note(t, got === exp, () => ({ c0, d, got, exp }));
  }
  return t;
}

const FIVE = [0x30de, 0x30df, 0x30e0, 0x30e1, 0x30e2];

/**
 * A script run: `[function, state, log, compatibility after, reaction after, draws used, ok]`. The function is 2 (Pay), 3 (free attack), 4
 * (Dismiss) or 5 (wipe); the state is `[given, gil, compat, zanAll, zanGroup, hire, odCur, odMax, curse, turns, performOk, targetOk[5],
 * draws[3]]`.
 */
export type ScriptVector = [number, [number, number, number, number, number, number, number, number, number, number, number, number[], number[]], unknown[][], number, number, number, number];
export function replayYojimboScript(vectors: readonly ScriptVector[], t = tally()): Tally {
  for (const [fn, s, log, compat, reaction, drawsUsed] of vectors) {
    const inputs: YojimboInputs = {
      given: s[0], gil: s[1], compat: s[2], zanAll: s[3], zanGroup: s[4], hire: s[5], odCur: s[6], odMax: s[7], curse: s[8], turns: s[9], reaction: 0,
    };
    let used = 0;
    const host: YojimboHost = {
      draw: () => s[12][used++] as number,
      target: (command) => (s[11][FIVE.indexOf(command)] ?? 1) !== 0,
      perform: () => s[10] !== 0,
    };
    let trace: readonly unknown[] = [];
    let outCompat = inputs.compat;
    let outReaction = 0;
    if (fn === 2 || fn === 3) {
      const run: YojimboRun = fn === 2 ? payEvent(inputs, host) : freeAttackEvent(inputs, host);
      trace = run.trace;
      outCompat = run.compat;
      outReaction = run.reaction;
    } else if (fn === 4) {
      const d = dismissEvent(inputs.compat, inputs.turns);
      trace = d.trace;
      outCompat = d.compat;
    } else {
      const d = wipeEvent(inputs.compat);
      trace = d.trace;
      outCompat = d.compat;
    }
    note(t, same(trace, log) && outCompat === compat && outReaction === reaction && used === drawsUsed, () => ({ fn, s, log, trace, compat, outCompat, reaction, outReaction, drawsUsed, used }));
  }
  return t;
}

// ---------------------------------------------------------------------------
// The special-action requester
// ---------------------------------------------------------------------------

/**
 * `[character, source type, sub-action index, command 0, command 1, Chr+0xdf4 before, return value, requests, Chr+0xdf4 after]`: the requester
 * (0x007b2980). A request is `[character, 0xff, event kind, 1, fifth argument, entry handed on (1) or not (0)]`.
 */
export type RequestVector = [number, number, number, number, number, number, number, number[][], number];
export function replayRequests(vectors: readonly RequestVector[], t = tally()): Tally {
  for (const [chr, source, , c0, c1, df4In, ret, log, df4Out] of vectors) {
    const r = aeonSpecialRequest(chr, source, [c0, c1]);
    const gotRet = r === null ? 0xffffffff : 0;
    const gotLog = r === null ? [] : [[chr, 0xff, r.kind, 1, r.fifth, r.withEntry ? 1 : 0]];
    const gotDf4 = r !== null && r.pending ? 1 : df4In;
    note(t, gotRet === ret && same(gotLog, log) && gotDf4 === df4Out, () => ({ chr, source, c0, c1, df4In, ret, log, df4Out, gotLog, gotDf4 }));
  }
  return t;
}

// ---------------------------------------------------------------------------
// The Magus Sisters' natives
// ---------------------------------------------------------------------------

/** `[standing order, a, b, draw, result, draws taken, stream drawn]`: RollMagusRandom (0x007a3300). */
export type MagusRollVector = [number, number, number, number, number, number, number];
export function replayMagusRoll(vectors: readonly MagusRollVector[], t = tally()): Tally {
  for (const [order, a, b, draw, exp, expDraws, expStream] of vectors) {
    let drew = 0;
    const r = magusRoll(a, b, order, () => (drew++, draw));
    note(t, r.value === exp && drew === expDraws && r.drew === (drew === 1) && (drew === 0 ? expStream === -1 : expStream === 18), () => ({ order, a, b, draw, got: r.value, exp, drew, expDraws, expStream }));
  }
  return t;
}

/** `[value, store return, stored, load]`: the standing-order store and load (0x007a3420, 0x007a3440). */
export type OrderStoreVector = [number, number, number, number];
export function replayOrderStore(vectors: readonly OrderStoreVector[], t = tally()): Tally {
  for (const [v, ret, stored, load] of vectors) {
    const got = storeStandingOrder(v);
    note(t, ret === 0 && stored === got && load === got, () => ({ v, got, ret, stored, load }));
  }
  return t;
}

/** The six bytes a setter test reads, in the order `[+0x714, +0x715, +0x726, +0x727, +0x728, +0x729]`. */
type Six = [number, number, number, number, number, number];
const fromSix = (s: Six): ReturnType<typeof newMagusChr> => ({ ...newMagusChr(0, 0, 0), f714: s[0], f715: s[1], b726: s[2], b727: s[3], b728: s[4], b729: s[5] });
const toSix = (c: ReturnType<typeof newMagusChr>): Six => [c.f714, c.f715, c.b726, c.b727, c.b728, c.b729];

/** `[owner, six bytes before, order standing, gauge change F, motivation change L, six bytes after, return, other characters untouched]`: 0x007a3a10. */
export type Set2Vector = [number, Six, number, number, number, Six, number, number];
export function replaySet2(vectors: readonly Set2Vector[], t = tally()): Tally {
  for (const [owner, before, order, F, L, after, ret, untouched] of vectors) {
    const c = fromSix(before);
    increaseMotivation(c, order, F, L);
    note(t, same(toSix(c), after) && ret === owner && untouched === 1, () => ({ before, order, F, L, after, got: toSix(c) }));
  }
  return t;
}

/** `[owner, four arguments (gauge +, motivation +, gauge -, motivation -), six bytes after, return, other characters untouched]`: 0x007a3b80. */
export type Set4Vector = [number, [number, number, number, number], Six, number, number];
export function replaySet4(vectors: readonly Set4Vector[], t = tally()): Tally {
  for (const [, a, after, ret, untouched] of vectors) {
    const c = fromSix([7, 7, 7, 7, 7, 7]);
    setMotivationChange(c, a[0], a[1], a[2], a[3]);
    note(t, same(toSix(c), after) && ret === 0 && untouched === 1, () => ({ a, after, got: toSix(c) }));
  }
  return t;
}

/** `[command flags (Cmd+0x20), three results, force, +0x715 before, return, +0x715 after]`: the positive-case test (0x0078bf50). */
export type PositiveVector = [number, [number, number, number], number, number, number, number];
export function replayPositive(vectors: readonly PositiveVector[], t = tally()): Tally {
  for (const [flags, vals, force, f715In, ret, f715Out] of vectors) {
    const c = { ...newMagusChr(0, 0, 0), f715: f715In };
    const got = positiveCaseTest(c, flags, vals, force);
    note(t, got === ret && c.f715 === f715Out, () => ({ flags, vals, force, f715In, ret, f715Out, got, gotF715: c.f715 }));
  }
  return t;
}

/** `[+0x714, +0x715, [+0x726..+0x729], gauge, gauge max, motivation, gauge after, motivation after, gauge max after]`: 0x007afb60. */
export type AfterVector = [number, number, [number, number, number, number], number, number, number, number, number, number];
export function replayAfterAction(vectors: readonly AfterVector[], t = tally()): Tally {
  for (const [f714, f715, d, gauge, gmax, mot, expGauge, expMot, expMax] of vectors) {
    const c = { motivation: mot, gauge, gaugeMax: gmax, f714, f715, b726: d[0], b727: d[1], b728: d[2], b729: d[3] };
    afterAction(c);
    note(t, c.gauge === expGauge && c.motivation === expMot && c.gaugeMax === expMax, () => ({ f714, f715, d, gauge, gmax, mot, got: [c.gauge, c.motivation], exp: [expGauge, expMot] }));
  }
  return t;
}

/**
 * `[worker (60 Cindy, 61 Sandy, 62 Mindy), [debug, turns, motivation, hp, mp, max hp, max mp, near death, combine ready], draws, log, draws used,
 * ok]`: the menu builders (event 12 on the game's VM). A log entry is `['clear']`, `['add', command]` or `['roll', threshold, draw & 0xff |
 * 'nodraw']`.
 */
export type MenuVector = [number, [number, number, number, number, number, number, number, number, number], number[], unknown[][], number, number];
export function replayMenu(vectors: readonly MenuVector[], t = tally()): Tally {
  for (const [worker, s, draws, log, used] of vectors) {
    const who = worker - 60 + 0xf;
    const out: unknown[][] = [];
    let u = 0;
    sisterMenu(who, { debug: s[0], turns: s[1], motivation: s[2], hp: s[3], mp: s[4], maxHp: s[5], maxMp: s[6], nearDeath: s[7], combineReady: s[8] }, {
      clear: () => void out.push(['clear']),
      add: (c) => void out.push(['add', c]),
      roll: (th) => {
        if (th < 0) {
          out.push(['roll', th, 'nodraw']);
          return true;
        }
        const d = draws[u++] as number;
        out.push(['roll', th, d & 0xff]);
        return (d & 0xff) < th;
      },
    });
    note(t, same(out, log) && u === used, () => ({ worker, s, log, out, used, u }));
  }
  return t;
}

// ---------------------------------------------------------------------------
// The joint action counters
// ---------------------------------------------------------------------------

/**
 * `[active list, actor, {character: [before, after]}, ok]`; each state is `[Agility, Haste counter, Slow counter, CTB counter, target mask,
 * +0x451, +0x5c0, +0x6cc, +0x6cd, rank]`: `pp_BtlSummonCtb` (0x007b1aa0), the characters the run touches.
 */
export type JointVector = [number[], number, Record<string, [number[], number[]]>, number];
export function replayJoint(vectors: readonly JointVector[], t = tally()): Tally {
  for (const [list, actor, chars] of vectors) {
    const slots = new Map<number, SummonSlot>();
    for (const [id, [b]] of Object.entries(chars)) {
      slots.set(Number(id), { agi: b[0]!, haste: b[1]!, slow: b[2]!, ctb: b[3]!, targetMask: b[4]!, flag451: b[5]!, flag5c0: b[6]!, mpUsed: b[7]!, odUsed: b[8]!, rank: b[9]! });
    }
    summonCtb(list, actor, slots);
    let ok = true;
    for (const [id, [, a]] of Object.entries(chars)) {
      const s = slots.get(Number(id))!;
      const got = [s.ctb, s.targetMask >>> 0, s.flag451, s.flag5c0, s.mpUsed, s.odUsed];
      const exp = [a[3]!, a[4]! >>> 0, a[5]!, a[6]!, a[7]!, a[8]!];
      if (!same(got, exp)) ok = false;
    }
    note(t, ok, () => ({ list, actor, chars }));
  }
  return t;
}
