/**
 * FFX critical-hit kernel: what `pp_BtlCritCheck` computes, no more and no less.
 *
 * **Game case: FFX only** (FFX-2's critical check is a different function in a different exe).
 * Source: FFX.exe, Steam build 25501027, SHA-256 0537B2A1...686D, function 0x00789690 (called from the
 * per-hit damage pipeline 0x0078e630, in the physical/HP branch, after the Shield/Boost and Shell/Protect
 * steps and before Berserk; the pipeline skips the call when the debug "never crit" switch at VA
 * 0x0112a909 is on). Spec: `research/re-ffx-rng-hit.md` section 5. Pure and deterministic; not wired
 * into the engine yet.
 *
 * Inputs are the numbers the function reads, named after the game's fields, with their offsets
 * (`Cmd+0xNN` command record, `Chr+0xNNN` battle character structure). Bytes are read as bytes (masked to
 * 8 bits, like MOVZX). `draw()` returns the raw 31-bit value the game's RNG returns for the USER's mode 0
 * stream, which is the same stream the damage variance draw uses (see `./rng.ts`).
 *
 * When it draws: exactly once, whenever the command can crit (`Cmd+0x20` bit 2), and that draw is not
 * skipped by the "always critical" buff or by a chance that is already 100 or more.
 */

/** `Cmd+0x20` (flags_damage) bit 2: this command can score a critical hit. */
export const CMD_CAN_CRIT = 0x04;
/** `Cmd+0x20` bit 3: the crit bonus comes from the user's equipment (`Chr+0x5d8`) instead of `Cmd+0x27`. */
export const CMD_CRIT_BONUS_FROM_EQUIPMENT = 0x08;
/** `Chr+0x640` bit 4: the user's "always critical" buff flag. */
export const CHR_ALWAYS_CRIT = 0x10;
/** The flag the check ORs into the hit record's class mask (`Rec+0x18`) on a critical hit. */
export const REC_CRIT_FLAG = 0x100;

/** The command record (`Cmd`). */
export interface CritCmd {
  /** `Cmd+0x20`, flags_damage; only the low byte is read here. */
  flagsDamage: number;
  /** `Cmd+0x27`, u8 crit bonus (percent points). */
  critBonus: number;
}

/** The attacker (`Chr` of the user). */
export interface CritUser {
  /** `Chr+0x5ad` LCK. */
  luck: number;
  /** `Chr+0x662` Luck stack (0..5), added one point per stack. */
  luckStack: number;
  /** `Chr+0x5d8` weapon-plus-armour crit bonus, used when the command asks for the equipment bonus. */
  equipmentCrit: number;
  /** `Chr+0x640` buff flags; bit 4 (0x10) is "always critical". */
  buffFlags: number;
}

/** The defender (`Chr` of the target). */
export interface CritTarget {
  /** `Chr+0x5ad` LCK. */
  luck: number;
  /** `Chr+0x663` Jinx stack (0..5), added one point per stack. */
  jinx: number;
}

/** Everything `pp_BtlCritCheck(user, target, cmd, recordFlags, damage)` reads, apart from the damage itself. */
export interface CritCheckInput {
  cmd: CritCmd;
  user: CritUser;
  target: CritTarget;
  /** Debug switch VA 0x0112a90d: every check that is made is a critical hit. Off in normal play. */
  debugAlwaysCrit?: boolean;
}

/** The outcome of {@link critCheck}. */
export interface CritResult {
  /** The damage after the check: doubled (32-bit wrap) on a crit, unchanged otherwise. */
  damage: number;
  /** Whether the hit is critical. */
  crit: boolean;
  /** The bits to OR into the hit record's class mask: {@link REC_CRIT_FLAG} on a crit, else 0. */
  recordFlags: number;
}

/**
 * The critical chance in percent points, as the exe sums it (in 32-bit signed arithmetic, so it can be
 * negative), or `null` when the command cannot crit and the check returns without drawing.
 *
 *     chance = user luck stack - target LCK + target jinx stack + user LCK + bonus
 *     bonus  = Chr+0x5d8 when Cmd+0x20 bit 3 is set, else Cmd+0x27
 *
 * Luck and Jinx stacks count one point each (the stack byte is 0..5). The sum is not clamped.
 */
export function critChanceOf(input: CritCheckInput): number | null {
  const { cmd, user, target } = input;
  if ((cmd.flagsDamage & CMD_CAN_CRIT) === 0) return null;
  const bonus = (cmd.flagsDamage & CMD_CRIT_BONUS_FROM_EQUIPMENT) === 0 ? cmd.critBonus : user.equipmentCrit;
  return (
    ((user.luckStack & 0xff) - (target.luck & 0xff) + (target.jinx & 0xff) + (user.luck & 0xff) + (bonus & 0xff)) | 0
  );
}

/**
 * `pp_BtlCritCheck`. Returns the damage unchanged without drawing when the command cannot crit.
 * Otherwise draws once, `roll = draw() % 101`, and the hit is critical when `roll < chance`, or when the
 * user carries the "always critical" buff (`Chr+0x640` bit 4), or under the debug switch; a critical hit
 * doubles the damage and sets {@link REC_CRIT_FLAG}.
 */
export function critCheck(input: CritCheckInput, damage: number, draw: () => number): CritResult {
  const chance = critChanceOf(input);
  if (chance === null) return { damage, crit: false, recordFlags: 0 };
  const roll = (draw() & 0x7fffffff) % 101;
  const crit =
    roll < chance || (input.user.buffFlags & CHR_ALWAYS_CRIT) !== 0 || input.debugAlwaysCrit === true;
  if (!crit) return { damage, crit: false, recordFlags: 0 };
  return { damage: (damage + damage) | 0, crit: true, recordFlags: REC_CRIT_FLAG };
}
