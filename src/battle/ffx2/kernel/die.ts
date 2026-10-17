/**
 * Lady Luck's dice: the die result and the face generator (re-parity RC10; **FFX-2 only**; FFX2-H04 sections 3.9 and 4.3, proven against the live
 * FFX-2.exe: 10,000 die-result vectors and 200,000 face-generator calls, 0 mismatches against an independent model).
 *
 * **The die result** (exe 0x00647620): the faces add up to the hit count handed to the hit determination as its override, and the command is swapped for a
 * bigger row when the dice agree: all ones swap to the "ones" row (power x20, Two Dice 0x317E, Four Dice 0x3180), all equal 2 to 6 to the "pair" row (power
 * x2, 0x317D, 0x317F), anything else stays the base row (0x30EB, 0x30EC). A face of 0 counts as "not yet seen", so a leading 0 lets the next face start the run
 * (a quirk of the game's function, kept: the engine's own faces are 1 to 6).
 *
 * **The faces** (exe 0x00685B80, the effect module's own generator, not one of the battle's 68 streams): a float walk. Each call takes the previous state's low
 * bits as a number in [1, 2), the value is `(number - 1) * 6` truncated (0 to 5, the script stores value + 1), and the new state is `number - 1.8872414`
 * (float32 throughout). From the cold state (state 1.0, first call not made) it runs a 1,412-call transient and then repeats a **185-value cycle forever**,
 * and it is not a fair die: in the cycle the values 0 to 5 come up 33, 36, 38, 27, 19 and 32 times, so faces 1 to 6 come up 17.8, 19.5, 20.5, 14.6, 10.3 and
 * 17.3 percent of the time. It is also drawn by other effect code, so where in the cycle a battle's first die falls is not knowable; the engine models it as
 * a uniform position, one draw of its own stream at the first roll of a battle (`engine dice.ts`).
 *
 * Pure: no DOM, no battle stream.
 */

/** The float constant the walk subtracts (exe 0x00DC4348): 1.8872414 as float32, bits 0x3FF19120. */
const WALK_STEP_BITS = 0x3ff19120;

/** The state of a fresh game: the float 1.0, and the first call not yet made. */
const COLD_STATE_BITS = 0x3f800000;

/** Calls from the cold state before the walk is inside its cycle (FFX2-H04 3.9, checked on 6,000 emulated calls). */
export const DIE_TRANSIENT_CALLS = 1412;

/** The length of the cycle the walk repeats from then on. */
export const DIE_CYCLE_LENGTH = 185;

const view = new DataView(new ArrayBuffer(4));
const floatOf = (bits: number): number => {
  view.setUint32(0, bits >>> 0);
  return view.getFloat32(0);
};
const bitsOf = (f: number): number => {
  view.setFloat32(0, f);
  return view.getUint32(0);
};

const WALK_STEP = floatOf(WALK_STEP_BITS);

/** The generator's two words: the float state (its bits) and whether the first call has been made. Plain numbers, so a battle's state can hold them. */
export interface DieGenerator {
  state: number;
  primed: boolean;
}

/** The generator of a fresh game. */
export function coldDieGenerator(): DieGenerator {
  return { state: COLD_STATE_BITS, primed: false };
}

/** One call of the face generator: a value 0 to 5 (the script's face is this plus 1). Advances `gen`. */
export function dieValue(gen: DieGenerator): number {
  let f = 1;
  if (gen.primed) {
    const x = gen.state >>> 0;
    const low = (((x >>> 18) ^ x) >>> 4) & 1;
    const mantissa = (((x & 0x3fffff) | 0x1fc00000) << 1) >>> 0;
    f = floatOf((low | mantissa) >>> 0);
  }
  const value = Math.trunc(Math.fround(Math.fround(f - 1) * 6));
  gen.state = bitsOf(Math.fround(f - WALK_STEP));
  gen.primed = true;
  return value;
}

/** The face (1 to 6) one die shows. */
export function dieFace(gen: DieGenerator): number {
  return dieValue(gen) + 1;
}

/**
 * A generator `position` calls into its cycle (0 to 184): the cold walk run through its transient and then `position` more calls. Every position is a place the
 * game's own walk can be in once it has run for 1,412 calls, which every game that has fought a few battles has.
 */
export function dieGeneratorInCycle(position: number): DieGenerator {
  const gen = coldDieGenerator();
  const calls = DIE_TRANSIENT_CALLS + (((Math.trunc(position) % DIE_CYCLE_LENGTH) + DIE_CYCLE_LENGTH) % DIE_CYCLE_LENGTH);
  for (let i = 0; i < calls; i++) dieValue(gen);
  return gen;
}

/** The game's command rows the dice resolve to. */
export const DIE_ROWS = {
  twoDice: 0x30eb,
  twoDicePair: 0x317d,
  twoDiceOnes: 0x317e,
  fourDice: 0x30ec,
  fourDicePair: 0x317f,
  fourDiceOnes: 0x3180,
} as const;

/** What the die result decides: the row the command becomes and the hit count (the sum of the faces) the hit determination is handed. */
export interface DieResult {
  commandId: number;
  hits: number;
}

/**
 * The die result of `faces` (exe 0x00647620): `faces.length` dice, more than two being Four Dice's rows. The sum is the raw sum of the bytes, as the game hands it
 * on; a face is a byte.
 */
export function dieResult(faces: readonly number[]): DieResult {
  let sum = 0;
  let same = 0; // 0: no face seen yet, -1: the faces differ, else the one face every die shows so far
  for (const raw of faces) {
    const face = raw & 0xff;
    sum += face;
    if (same === 0) same = face;
    else if (same !== face) same = -1;
  }
  const four = faces.length > 2;
  if (same === 1) return { commandId: four ? DIE_ROWS.fourDiceOnes : DIE_ROWS.twoDiceOnes, hits: sum };
  if (same >= 2 && same <= 6) return { commandId: four ? DIE_ROWS.fourDicePair : DIE_ROWS.twoDicePair, hits: sum };
  return { commandId: four ? DIE_ROWS.fourDice : DIE_ROWS.twoDice, hits: sum };
}
