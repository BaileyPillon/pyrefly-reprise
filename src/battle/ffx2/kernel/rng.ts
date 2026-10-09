/**
 * FFX-2 battle RNG kernel: the game's own generator, its 68 streams, the stream selector and the
 * battle-start seeding.
 *
 * **Game case: FFX-2 only** (FFX has its own generator, its own tables and its own stream map; see
 * `src/battle/ffx/kernel/rng.ts`). Source: FFX-2.exe, Steam build 25501027 (SHA-256 6EA7F142...CD69),
 * image base 0x400000. Spec: `research/re-ffx2-hit-status.md` section 1. Pure, deterministic, no DOM,
 * no engine types (AGENTS.md rule 1). The generator itself is not wired into the engine: the engine keeps
 * its one seeded stream (`common/rng.ts`, mulberry32) until Bailey decides to adopt the game's own (plan P3),
 * and `adapt/draws.ts` takes one engine draw per kernel draw. Every kernel in this folder takes a
 * `draw(stream)` callback that returns the raw 31-bit value the game's generator would return for that
 * stream, so the engine feeds them either generator; the fixed streams (5, 10, 11) tell the callback which
 * roll it is answering.
 *
 * Exe addresses (live build):
 * - 0x0061e270  next value of one of 68 streams
 * - 0x0061adb0  character id + purpose -> stream index
 * - 0x0061e1b0  battle-start seeding of all 68 states from the clock
 * - 0x00d48360  per-stream multiplier, s32[68]      (read from the image on 2026-10-08)
 * - 0x00d48470  per-stream addend, u16[68]          (read from the image on 2026-10-08)
 * - 0x00e103f0  the 68 states, u32[68]
 *
 * All arithmetic is 32-bit wraparound, exactly as the machine code does it: `Math.imul` for the
 * multiplications, `| 0` / `>>> 0` to wrap, `>>` for the arithmetic (sign-extending) shift.
 */

import { at } from './intops.ts';

/** The generator has 68 independent streams, each with its own multiplier, addend and state. */
export const FFX2_RNG_STREAM_COUNT = 68;

/**
 * Per-stream multiplier, s32[68] at VA 0x00d48360. Constants of the exe image (they are signed in the
 * image; `Math.imul` treats the sign correctly). Equal to the same table in the older exe copy.
 */
export const FFX2_RNG_MULT: readonly number[] = [
  2100005341, 1700015771, 247163863, 891644837, 1352476257, 1563244181,
  1528068163, 511705469, 1739927913, 398147329, 1278224951, 20980265,
  1178761637, 802909981, 1130639187, 1599606659, 952700149, -898770777,
  -1097979073, -2013480859, -338768121, -625456463, -2049746479, -550389733,
  -5384771, -128808769, -1756029551, 1379661854, 904938179, -1209494557,
  -1676357703, -1287910319, 1653802905, 393811311, -824919739, 1837641861,
  946029195, 1248183957, -1684075875, -2108396259, -681826313, 1003979813,
  1607786269, -585334321, 1285195345, 1997056081, -106688231, 1881479865,
  476193933, 307456099, 1290745819, 162507239, -213809065, -1135977229,
  -1272305475, 1484222417, -1559875059, 1407627503, 1206176749, -1537348095,
  638891383, 581678511, 1164589165, -1436620513, 1412081669, -1538191349,
  -284976961, 706005401,
];

/** Per-stream addend, u16[68] at VA 0x00d48470 (same provenance as {@link FFX2_RNG_MULT}). */
export const FFX2_RNG_ADD: readonly number[] = [
  10259, 24563, 11177, 56951, 46197, 49825, 27077, 1257, 44163, 56565,
  31009, 46619, 64397, 46089, 58119, 13089, 19497, 47699, 21163, 16247,
  575, 18657, 60495, 42057, 40531, 13649, 8049, 25369, 9373, 48949,
  23157, 32735, 29605, 44013, 16623, 15091, 43767, 51345, 28485, 39191,
  40085, 32893, 41401, 1267, 15437, 33645, 37189, 58137, 16263, 59665,
  53663, 11529, 37585, 18427, 59827, 49457, 22921, 24213, 62787, 56241,
  55319, 9625, 57621, 7581, 56469, 49207, 41671, 36457,
];

/**
 * The purpose argument of {@link rngStreamForChr} (`pp_MsGetRndChr`'s second argument). Each purpose
 * moves the stream by a fixed amount: 0, +0x10, +0x20.
 */
export const Ffx2RngKind = {
  /** Damage variance, critical roll, ATB start / reset / thinking time, Confusion and AI picks. */
  Variance: 0,
  /** The hit-or-evade roll (and the first-strike roll, which uses a fixed stream instead). */
  Hit: 1,
  /** Status infliction, shatter and magic-cancel rolls. */
  Status: 2,
} as const;
export type Ffx2RngKindValue = (typeof Ffx2RngKind)[keyof typeof Ffx2RngKind];

/**
 * Streams the game addresses by a fixed number instead of through a character (anchors section 5 of the
 * private anchor map; only the ones these kernels use are named).
 */
export const Ffx2FixedStream = {
  /** Battle start: preemptive / ambush roll (`MsCalcFirstAttack`). */
  FirstStrike: 1,
  /** Random-target hits (`cmd.flags_misc & 0x4000`) and team picks. */
  RandomTarget: 5,
  /** Reflect redirect target. */
  ReflectTarget: 6,
  /** Steal success, Pilfer Gil success and amount, the Bribe quantity draws, KO rewards. */
  Steal: 10,
  /** Steal rare-slot roll, the Bribe slot pick. */
  StealSlot: 11,
} as const;

/**
 * A `draw(stream)` callback: returns the raw 31-bit value the game's generator would return for that
 * stream. A callback that ignores its argument (a fixed list of scripted values) is fine; the argument
 * is there so a test can assert which stream the game asked for.
 */
export type Ffx2Draw = (stream: number) => number;

/**
 * What `pp_rng_next` hands its caller for `stream`: a 31-bit value. A callback may return a wider
 * integer (a fake that scripts 32-bit numbers); the game's generator never does, so the top bit is
 * cleared here exactly where the game clears it.
 */
export function drawValue(draw: Ffx2Draw, stream: number): number {
  return draw(stream) & 0x7fffffff;
}

/** `MsGetRamChrMonster` (exe 0x00625bc0): is this battle slot a monster slot? Slots 15 to 30. */
export function isMonsterSlot(chrId: number): boolean {
  const b = chrId & 0xff;
  return b > 14 && b < 31;
}

/**
 * `MsGetRndChr` (exe 0x0061adb0): the stream a character rolls on for a purpose.
 *
 *     base   = chr + 0x14   for a party slot (0 to 14);  chr + 0x0d  for a monster slot (15 to 30)
 *     stream = base + 0x10 * (purpose == 1)  +  0x20 * (purpose == 2)
 *
 * Any purpose other than 1 or 2 is purpose 0, as in the game. The result is NOT range-checked here,
 * because the game does not check it either: a monster in slot 23 or higher rolling a status
 * (purpose 2) gets stream 68 or more, which is past the 68-entry tables (the game then reads and
 * writes memory beyond them). {@link rngNextState} refuses such a stream rather than invent what lies
 * there; no five-boss fight reaches it (the bosses sit in the low slots).
 */
export function rngStreamForChr(chrId: number, kind: number): number {
  const offset = kind === 1 ? 0x10 : kind === 2 ? 0x20 : 0;
  return (isMonsterSlot(chrId) ? chrId + 0x0d : chrId + 0x14) + offset;
}

/**
 * The new 32-bit state of stream `stream` after one draw from `state` (exe 0x0061e270):
 *
 *     n   = mult[stream] * state * 5 + add[stream] + 1                  (mod 2^32, read as signed)
 *     new = (n >> 16) + (n << 16)    // arithmetic shift right, PLUS logical shift left, mod 2^32
 *
 * The state keeps all 32 bits; only the returned value is masked to 31 ({@link rngOutput}). The
 * "arithmetic shift, then add" is not a plain 16-bit rotation: when bit 31 of `n` is set the shift
 * fills the top half with ones, so the sum differs from a rotation.
 */
export function rngNextState(stream: number, state: number): number {
  if (!Number.isInteger(stream) || stream < 0 || stream >= FFX2_RNG_STREAM_COUNT) {
    throw new RangeError(
      `FFX-2 battle RNG stream ${stream} is outside 0..${FFX2_RNG_STREAM_COUNT - 1} (the game reads past its tables here)`,
    );
  }
  const n = (Math.imul(Math.imul(at(FFX2_RNG_MULT, stream), state | 0), 5) + at(FFX2_RNG_ADD, stream) + 1) | 0;
  return ((n >> 16) + (n << 16)) >>> 0;
}

/** The value a draw returns: the new state with the top bit cleared (31 bits). */
export function rngOutput(state: number): number {
  return (state & 0x7fffffff) >>> 0;
}

/** One draw from `states[stream]`: advances that stream in place and returns the 31-bit value. */
export function rngDraw(states: Uint32Array, stream: number): number {
  const next = rngNextState(stream, at(states, stream));
  states[stream] = next;
  return rngOutput(next);
}

// ---------------------------------------------------------------------------------------------------
// Battle-start seeding (exe 0x0061e1b0)
// ---------------------------------------------------------------------------------------------------

/**
 * One step of the seeding generator: `v = x * 0x5d588b65 + 0x3c35` (mod 2^32), then
 * `(v >> 16) + (v << 16)` as in the stream generator. Returns the new x as a signed 32-bit value.
 */
export function seedLcgNext(x: number): number {
  const v = (Math.imul(x, 0x5d588b65) + 0x3c35) | 0;
  return ((v >> 16) + (v << 16)) | 0;
}

/**
 * The product the seeding starts from: `(fold + 1) * (arg + 1)`, 32-bit. `fold` is the XOR of the
 * eight bytes of the clock record the game builds (seconds, minutes, hours, day, month and the low
 * byte of the year in six of the bytes; the other two are never written, so they are whatever the
 * stack held) reduced to one byte; `arg` is the value the caller passes (the save's seed plus a
 * configuration word).
 */
export function seedProduct(fold: number, arg: number): number {
  return Math.imul(((fold & 0xff) + 1) | 0, (arg + 1) | 0);
}

/** Result of {@link seedStates}. */
export interface RngSeeding {
  /** The 68 states, each already masked to 31 bits (the seeding stores `x & 0x7fffffff`). */
  states: Uint32Array;
  /** The word the seeding also stores at VA 0x00d4835c: `product * 0x599e67e6 + 0x301d`. Unused by the streams. */
  sideWord: number;
  /** The seeding generator's value after the last state was written (stored at VA 0x00d48358). */
  finalX: number;
}

/**
 * `pp_rng_seed` (exe 0x0061e1b0) after the clock has been read: fills all 68 states.
 *
 *     p  = (fold + 1) * (arg + 1)
 *     x  = 0x8e81d427 - p * 0x4913002d;   x = (x >> 16) + (x << 16)
 *     for k in 0..67:  x = seedLcgNext(x);  state[k] = x & 0x7fffffff
 *
 * Only 256 clock folds exist for a given `arg`, so a real battle is seeded from at most 256 distinct
 * state sets per `arg`. To seed from something else (a run seed, for P3), call {@link seedStatesFromX}
 * with any starting x.
 */
export function seedStates(fold: number, arg: number): RngSeeding {
  const p = seedProduct(fold, arg);
  const sideWord = (Math.imul(p, 0x599e67e6) + 0x301d) | 0;
  const v = (0x8e81d427 - Math.imul(p, 0x4913002d)) | 0;
  const x0 = ((v >> 16) + (v << 16)) | 0;
  const out = seedStatesFromX(x0);
  return { states: out.states, sideWord, finalX: out.finalX };
}

/** The loop half of the seeding: 68 steps of {@link seedLcgNext} starting from `x0`. */
export function seedStatesFromX(x0: number): { states: Uint32Array; finalX: number } {
  const states = new Uint32Array(FFX2_RNG_STREAM_COUNT);
  let x = x0 | 0;
  for (let k = 0; k < FFX2_RNG_STREAM_COUNT; k++) {
    x = seedLcgNext(x);
    states[k] = (x & 0x7fffffff) >>> 0;
  }
  return { states, finalX: x };
}

/** The XOR fold of the eight clock-record bytes that `pp_rng_seed` reduces to one byte. */
export function clockFold(bytes: readonly number[]): number {
  let fold = 0;
  for (let i = 0; i < 8; i++) fold ^= at(bytes, i) & 0xff;
  return fold & 0xff;
}

/**
 * A ready-to-use set of the 68 streams. `draw(stream)` is a {@link Ffx2Draw}, so a kernel can be fed
 * `rng.draw` directly.
 */
export class Ffx2BattleRng {
  readonly states: Uint32Array;

  constructor(states?: Uint32Array) {
    this.states = states ? Uint32Array.from(states) : new Uint32Array(FFX2_RNG_STREAM_COUNT);
    if (this.states.length !== FFX2_RNG_STREAM_COUNT) {
      throw new RangeError(`the FFX-2 generator has ${FFX2_RNG_STREAM_COUNT} streams`);
    }
  }

  /** Seeds the way a battle start does (see {@link seedStates}). */
  static fromClock(fold: number, arg: number): Ffx2BattleRng {
    return new Ffx2BattleRng(seedStates(fold, arg).states);
  }

  /** One draw from `stream`; usable as a {@link Ffx2Draw} (it is an arrow property, so `this` is bound). */
  readonly draw: Ffx2Draw = (stream: number): number => rngDraw(this.states, stream);
}
