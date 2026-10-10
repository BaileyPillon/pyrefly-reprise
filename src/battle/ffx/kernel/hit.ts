/**
 * FFX hit-or-evade kernel: what `pp_BtlHitCheck` computes, no more and no less.
 *
 * **Game case: FFX only** (FFX-2's hit check is a different function in a different exe).
 * Source: FFX.exe, Steam build 25501027, SHA-256 0537B2A1...686D, function 0x0078a890
 * (called from the per-hit damage pipeline 0x0078e630). Spec: `research/re-ffx-rng-hit.md` section 4.
 * Pure and deterministic; not wired into the engine yet.
 *
 * Inputs are the numbers the function reads, named after the game's fields, with their offsets:
 * `Cmd+0xNN` is the command record, `Chr+0xNNN` the battle character structure, `Rec+0xNN` the 0x2c-byte
 * hit record. Bytes are read as bytes (masked to 8 bits, like the machine code's MOVZX).
 * The randomness comes from `draw()`, which returns the raw 31-bit value the game's RNG returns for the
 * USER's mode 1 stream (see `./rng.ts`); the kernel takes it modulo 101 like the exe.
 *
 * When it draws: exactly once, and only for accuracy formulas 1 to 7 against a target that is neither
 * asleep nor petrified (and with the debug "never hit" switch off). Formula 0, the "no effect" answer,
 * and the sleep/petrify auto-hits draw nothing. The draw is not skipped when the answer is already
 * decided by a counter kind of 2 or by a percentage outside 0..100.
 */

/** Results of {@link hitCheck}, as the exe returns them. */
export const HIT = 0;
export const MISS = 1;
export const NO_EFFECT = 2;
export type HitResult = typeof HIT | typeof MISS | typeof NO_EFFECT;

/**
 * Base hit percent by index, `DAT_00c421f0` (9 signed bytes). Indexed by
 * `clamp(base * 2 / 5 - target EVA + 10, 0, 8)`.
 */
export const ACCURACY_TABLE: readonly number[] = [25, 30, 30, 40, 40, 50, 60, 80, 100];

/** `Cmd+0x1c` (flags_misc): bits 3 to 5 pick the accuracy formula. */
export const CMD_ACCURACY_FORMULA_SHIFT = 3;
/** `Cmd+0x1c` bit 6: Darkness on the user divides the chance by 10. */
export const CMD_AFFECTED_BY_DARKNESS = 0x40;
/** `Cmd+0x1c` bit 23: "no effect" on a target that is neither dead nor a Zombie (Phoenix Down on the living). */
export const CMD_NO_EFFECT_ON_LIVING = 0x800000;

/** The command record (`Cmd`). */
export interface HitCmd {
  /** `Cmd+0x1c`, u32 flags_misc. */
  flagsMisc: number;
  /** `Cmd+0x29`, u8 accuracy: the base of formulas 1 and 2. */
  accuracy: number;
}

/** The attacker (`Chr` of the user). */
export interface HitUser {
  /** `Chr+0x5af` ACC: the base of formulas 3 to 7. */
  acc: number;
  /** `Chr+0x5ad` LCK. */
  luck: number;
  /** `Chr+0x60a` Darkness turn counter; any non-zero value is blind. */
  darkness: number;
  /** `Chr+0x65f` Aim stack (0..5). */
  aim: number;
  /** `Chr+0x662` Luck stack (0..5). */
  luckStack: number;
}

/** The defender (`Chr` of the target). */
export interface HitTarget {
  /** `Chr+0x606` u16 permanent status flags; only bits 0 (Death) and 1 (Zombie) are read here. */
  status: number;
  /** `Chr+0x5ae` EVA. */
  eva: number;
  /** `Chr+0x5ad` LCK. */
  luck: number;
  /** `Chr+0x661` Reflex stack (0..5). */
  reflex: number;
  /** `Chr+0x663` Jinx stack (0..5). */
  jinx: number;
}

/** The hit record, a snapshot of the target taken when the action started. */
export interface HitRecord {
  /** `Rec+0x07` = `Chr+0x608` Sleep counter at the snapshot; non-zero is asleep and always hit. */
  sleep: number;
  /** `Rec+0x14` = `Chr+0x606` at the snapshot; bit 2 (value 4) is Petrify and always hit. */
  status: number;
}

/** Everything `pp_BtlHitCheck(user, target, cmd, rec, counterKind)` reads. */
export interface HitCheckInput {
  cmd: HitCmd;
  user: HitUser;
  target: HitTarget;
  rec: HitRecord;
  /**
   * The fifth argument: the counter kind from `pp_BtlCounterKind` (0x0078c1d0). 2 = the target has
   * Evade & Counter and this is a physical single-target command: the roll is still drawn, and the
   * result is a miss whatever it was. 0 and 1 change nothing here.
   */
  counterKind: number;
  /** Debug switch VA 0x0112a90a: every rolled check hits. Off in normal play. */
  debugAlwaysHit?: boolean;
  /** Debug switch VA 0x0112a91f: every rolled check misses, and no draw happens. Off in normal play. */
  debugNeverHit?: boolean;
}

/** What the check will do, worked out without drawing. */
export type HitPlan =
  | {
      /** The function returns without drawing. */
      rolls: false;
      result: HitResult;
      /** The accuracy formula, `(flags_misc >> 3) & 7`. */
      formula: number;
    }
  | {
      /** The function draws once and compares the roll with `percent`. */
      rolls: true;
      formula: number;
      /** The formula's base: the command's accuracy byte, or the user's ACC (scaled for formulas 5 to 7). */
      accuracyBase: number;
      /**
       * The accuracy term before Luck, Aim/Reflex and the stacks: the table value (formulas 1, 3, 5, 6, 7)
       * or `accuracyBase - EVA` (formulas 2, 4), after the Darkness division.
       */
      term: number;
      /** The hit percent compared with `draw() % 101`; a hit needs `roll < percent` (not clamped). */
      percent: number;
    };

/** C integer division on int32 operands (truncates toward zero; `| 0` also turns -0 into 0). */
function cDiv(a: number, b: number): number {
  return Math.trunc(a / b) | 0;
}

/** The base of the accuracy formula (exe jump table at 0x0078aa90). Formulas 1 and 2 use the command's own byte. */
function formulaBase(formula: number, cmd: HitCmd, user: HitUser): number {
  const acc = user.acc & 0xff;
  switch (formula) {
    case 1:
    case 2:
      return cmd.accuracy & 0xff;
    case 3:
    case 4:
      return acc;
    case 5:
      return (acc * 5) >> 1;
    case 6:
      return (acc * 3) >> 1;
    default:
      return acc >> 1; // formula 7
  }
}

/**
 * Work out the check without drawing: either a fixed answer, or "draws once and compares with
 * `percent`". Useful for previews and for tests; {@link hitCheck} is this plus the draw.
 */
export function hitPlan(input: HitCheckInput): HitPlan {
  const { cmd, user, target, rec } = input;
  const flags = cmd.flagsMisc >>> 0;
  const formula = (flags >>> CMD_ACCURACY_FORMULA_SHIFT) & 7;

  // 0x0078a89a: a command flagged "no effect on the living" does nothing to a target that is not dead/Zombie.
  if ((flags & CMD_NO_EFFECT_ON_LIVING) !== 0 && (target.status & 3) === 0) {
    return { rolls: false, result: NO_EFFECT, formula };
  }
  // Formula 0 never rolls: every spell, item and Overdrive.
  if (formula === 0) return { rolls: false, result: HIT, formula };
  // Asleep (hit record counter) or Petrified (hit record flag bit 2): struck without a roll.
  if ((rec.sleep & 0xff) !== 0 || (rec.status & 4) !== 0) return { rolls: false, result: HIT, formula };
  if (input.debugNeverHit === true) return { rolls: false, result: MISS, formula };

  const accuracyBase = formulaBase(formula, cmd, user);
  const eva = target.eva & 0xff;
  let term: number;
  if (formula === 2 || formula === 4) {
    term = accuracyBase - eva;
  } else {
    const index = Math.min(8, Math.max(0, cDiv(accuracyBase * 2, 5) - eva + 10));
    term = ACCURACY_TABLE[index] as number;
  }
  if ((flags & CMD_AFFECTED_BY_DARKNESS) !== 0 && (user.darkness & 0xff) !== 0) term = cDiv(term, 10);

  const aimMinusReflex = (user.aim & 0xff) - (target.reflex & 0xff);
  const percent =
    (user.luck & 0xff) +
    ((target.jinx & 0xff) + term) +
    (aimMinusReflex * 10 - (target.luck & 0xff) + (user.luckStack & 0xff));
  return { rolls: true, formula, accuracyBase, term, percent };
}

/**
 * `pp_BtlHitCheck`: 0 hit, 1 miss, 2 no effect.
 *
 * On a rolled check: `roll = draw() % 101`; the result is a hit when `roll < percent` and the counter
 * kind is not 2, otherwise a miss (`debugAlwaysHit` turns every rolled miss into a hit).
 */
export function hitCheck(input: HitCheckInput, draw: () => number): HitResult {
  const plan = hitPlan(input);
  if (!plan.rolls) return plan.result;
  const roll = (draw() & 0x7fffffff) % 101;
  if (roll < plan.percent && input.counterKind !== 2) return HIT;
  return input.debugAlwaysHit === true ? HIT : MISS;
}
