/**
 * FFX battle RNG kernel: the game's own generator, stream map and New Game seeding.
 *
 * **Game case: FFX only** (FFX-2 has its own exe and its own streams; it gets its own kernel).
 * Source: FFX.exe, Steam build 25501027, SHA-256 0537B2A1...686D, image base 0x400000. Spec:
 * `research/re-ffx-rng-hit.md`. Pure, deterministic, no DOM, no engine types (AGENTS.md rule 1).
 *
 * Not wired into the engine yet: the engine still draws from `common/rng.ts` (mulberry32). Kernels
 * take a `draw()` callback, so wiring can feed them either generator.
 *
 * Exe addresses (all FFX.exe):
 * - 0x007988f0  battle RNG, next value of one of 68 streams
 * - 0x0078d210  chr id + purpose -> stream index
 * - 0x00798890  New Game: fill the 68 states from the seed LCG
 * - 0x007989a0  the seed LCG step
 * - 0x00798950  the clock-byte XOR that is the only non-deterministic seed input
 *
 * All arithmetic below is 32-bit wraparound, exactly as the machine code does it: `Math.imul` for the
 * multiplications, `| 0` / `>>> 0` to wrap, `>>` for the arithmetic (sign-extending) shift.
 */

/** The generator has 68 independent streams, each with its own multiplier, xor word and state. */
export const RNG_STREAM_COUNT = 68;

/**
 * Per-stream multiplier, u32[68] at VA 0x00c42208. Constants read from the exe's data section;
 * checked byte for byte against the live image on 2026-10-08.
 */
export const RNG_MULT: readonly number[] = [
  2100005341, 1700015771, 247163863, 891644838, 1352476256, 1563244181,
  1528068162, 511705468, 1739927914, 398147329, 1278224951, 20980264,
  1178761637, 802909981, 1130639188, 1599606659, 952700148, 3396196519,
  3196988222, 2281486437, 3956199176, 3669510832, 2245220818, 3744577563,
  4289582524, 4166158527, 2538937745, 1379661854, 904938180, 3085472738,
  2618609593, 3007056977, 1653802906, 393811311, 3470047556, 1837641861,
  946029195, 1248183957, 2610891421, 2186571037, 3613140984, 1003979812,
  1607786269, 3709632975, 1285195346, 1997056081, 4188279064, 1881479866,
  476193932, 307456100, 1290745818, 162507240, 4081158231, 3158990066,
  3022661821, 1484222417, 2735092238, 1407627502, 1206176750, 2757619202,
  638891383, 581678511, 1164589165, 2858346782, 1412081670, 2756775946,
  4009990320, 706005400,
];

/** Per-stream xor word, u16[68] at VA 0x00c42318 (same provenance as {@link RNG_MULT}). */
export const RNG_XOR16: readonly number[] = [
  10259, 24563, 11177, 56952, 46197, 49826, 27077, 1257, 44164, 56565,
  31009, 46618, 64397, 46089, 58119, 13090, 19496, 47700, 21163, 16247,
  574, 18658, 60495, 42058, 40532, 13649, 8049, 25369, 9373, 48949,
  23157, 32735, 29605, 44013, 16623, 15090, 43767, 51346, 28485, 39192,
  40085, 32893, 41400, 1267, 15436, 33645, 37189, 58137, 16264, 59665,
  53663, 11528, 37584, 18427, 59827, 49457, 22922, 24212, 62787, 56241,
  55318, 9625, 57622, 7580, 56469, 49208, 41671, 36458,
];

/** The purpose argument of {@link rngStreamIndex}; each purpose has its own block of 16 or 8 streams. */
export const RngMode = {
  /** Damage variance, critical roll, initial CTB, escape roll: streams 20..35. */
  Damage: 0,
  /** The hit-or-evade roll: streams 36..51 (mode 0 + 0x10). */
  Hit: 1,
  /** Status infliction, shatter and Bribe rolls: streams 52..67 (mode 0 + 0x20). */
  Status: 2,
} as const;

/**
 * The new 32-bit state of stream `stream` after one draw from `state` (exe 0x007988f0):
 *
 *     v = (mult[stream] * state) mod 2^32;  v ^= xor16[stream];
 *     new = (int32(v) >> 16) + (v << 16)    // arithmetic shift right, plus logical shift left, mod 2^32
 *
 * The state keeps all 32 bits; only the returned value is masked to 31 ({@link rngOutput}).
 */
export function rngNextState(stream: number, state: number): number {
  const mult = RNG_MULT[stream];
  const xor16 = RNG_XOR16[stream];
  if (mult === undefined || xor16 === undefined) {
    throw new RangeError(`FFX battle RNG stream ${stream} is outside 0..${RNG_STREAM_COUNT - 1}`);
  }
  const v = (Math.imul(mult, state | 0) ^ xor16) | 0;
  return ((v >> 16) + (v << 16)) >>> 0;
}

/** The 31-bit value a draw returns for a freshly written state: `state & 0x7fffffff`. */
export function rngOutput(state: number): number {
  return state & 0x7fffffff;
}

/**
 * The 68 live states. `next(stream)` is `pp_BtlRng(stream)`: it advances only that stream and returns
 * a 31-bit value. Streams never influence each other.
 */
export class FfxBattleRng {
  /** The live states, u32[68] (VA 0x01135ee0 in the exe). */
  readonly state: Uint32Array;

  /** Start from explicit states (68 values, each taken modulo 2^32), or all zero. */
  constructor(states?: ArrayLike<number>) {
    this.state = new Uint32Array(RNG_STREAM_COUNT);
    if (states !== undefined) {
      if (states.length !== RNG_STREAM_COUNT) {
        throw new RangeError(`FFX battle RNG needs ${RNG_STREAM_COUNT} states, got ${states.length}`);
      }
      for (let i = 0; i < RNG_STREAM_COUNT; i++) this.state[i] = states[i] as number;
    }
  }

  /** The states a New Game would leave, from the seed product (see {@link seedStates}). */
  static fromSeedProduct(seedProduct: number): FfxBattleRng {
    return new FfxBattleRng(seedStates(seedProduct));
  }

  /** Draw once from stream `stream`: the 31-bit value, with the stream advanced. */
  next(stream: number): number {
    const updated = rngNextState(stream, this.state[stream] ?? 0);
    this.state[stream] = updated;
    return rngOutput(updated);
  }

  /** Draw once from the stream the game would pick for this character and purpose. */
  nextFor(chrId: number, mode: number, isAeon: boolean): number {
    return this.next(rngStreamIndex(chrId, mode, isAeon));
  }

  /** An independent copy (for look-ahead and previews). */
  clone(): FfxBattleRng {
    return new FfxBattleRng(this.state);
  }
}

/**
 * Is this chr id one of the eight monster slots, 0x14..0x1b? (exe 0x0079aef0: `(id & 0xff) - 0x14`
 * compared unsigned against 8.)
 */
export function isMonsterChrId(chrId: number): boolean {
  return (((chrId & 0xff) - 0x14) >>> 0) < 8;
}

/**
 * Which stream a character's roll of a given purpose uses (exe 0x0078d210):
 *
 * - mode 0 adds 0, mode 1 adds 0x10, mode 2 adds 0x20 (any other mode adds 0);
 * - a monster (chr 0x14..0x1b) uses `chr + 8`, i.e. 28..35 for mode 0;
 * - otherwise an aeon (the character's gender-bit 2 at Chr+0x590) uses 0x1b = 27, shared by every aeon
 *   and by party slot 7 (so 27, 43, 59);
 * - otherwise a party member uses `chr + 0x14`, i.e. 20..27 for chr 0..7.
 *
 * `isAeon` is the Chr+0x590 bit-2 flag of this character, which the game reads from the character
 * record; the kernel takes it as an input. The result is not range-checked here: a chr id outside the
 * party, aeon and monster slots lands outside 20..67 or on another block, as in the game.
 */
export function rngStreamIndex(chrId: number, mode: number, isAeon: boolean): number {
  const offset = mode === 1 ? 0x10 : mode === 2 ? 0x20 : 0;
  if (isMonsterChrId(chrId)) return chrId + 8 + offset;
  if (isAeon) return 0x1b + offset;
  return chrId + 0x14 + offset;
}

// ---------------------------------------------------------------------------------------------
// New Game seeding (exe 0x00798890, called only from the New Game function 0x00786b00)
// ---------------------------------------------------------------------------------------------

/**
 * The clock XOR (exe 0x00798950): the XOR of the eight bytes of a clock reading, plus one, so 1..256.
 * The game reads the clock itself; pass the eight bytes if you want to replay it.
 */
export function timeByteXorPlusOne(clockBytes: ArrayLike<number>): number {
  let x = 0;
  for (let i = 0; i < 8; i++) x ^= (clockBytes[i] ?? 0) & 0xff;
  return x + 1;
}

/**
 * The seed product `k` that {@link seedStates} starts from: `clockXor * (arg + 1)` mod 2^32, where
 * `clockXor` is {@link timeByteXorPlusOne} (1..256) and `arg` is the 32-bit sum the New Game function
 * passes in (two of its own globals, VA 0x01330210 and 0x011307dc). For a given `arg` the clock can
 * therefore pick only one of 256 products. Any 32-bit value is a legal `k` for {@link seedStates}.
 */
export function seedProduct(clockXor: number, arg: number): number {
  return Math.imul(clockXor | 0, ((arg | 0) + 1) | 0) >>> 0;
}

/**
 * One step of the seed LCG (exe 0x007989a0), on its 32-bit word `x`; returns the new word:
 *
 *     t = x * 0x5d588b65 + 0x3c35 (mod 2^32);  new = (int32(t) >> 16) + (t << 16)
 *
 * The step returns `new & 0x7fffffff` to its caller, while the word keeps all 32 bits.
 */
export function seedLcgNext(x: number): number {
  const t = (Math.imul(x | 0, 0x5d588b65) + 0x3c35) | 0;
  return ((t >> 16) + (t << 16)) >>> 0;
}

/**
 * What New Game leaves in the 68 states, from the seed product `k`:
 *
 * 1. the LCG word is `k * 0x420c56d7 + 0x2e0a` (mod 2^32). (A second word, `k * 0x599e67e6 + 0x301d`,
 *    is stored beside it in the exe and nothing ever reads it, so it is not modelled.)
 * 2. one LCG step is taken and its result thrown away (warm-up);
 * 3. each of the 68 states, stream 0 first, is the next LCG step masked to 31 bits.
 *
 * So every freshly seeded state is below 2^31.
 */
export function seedStates(k: number): Uint32Array {
  let x = (Math.imul(k | 0, 0x420c56d7) + 0x2e0a) >>> 0;
  x = seedLcgNext(x);
  const out = new Uint32Array(RNG_STREAM_COUNT);
  for (let i = 0; i < RNG_STREAM_COUNT; i++) {
    x = seedLcgNext(x);
    out[i] = x & 0x7fffffff;
  }
  return out;
}
