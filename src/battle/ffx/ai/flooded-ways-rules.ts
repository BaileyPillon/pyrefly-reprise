/**
 * **The numbers and the state of the Flooded Ways' scripts** (FFX only; the hidden Flooded Ways chapter, number 36), each with its source in `research/re-ffx-geosgaeno-evrae-altana.md` ("RE n.n": the monsters' own
 * bytecode, read from the game's files and run in the earlier lanes' interpreter with exact tallies over all 65,536 random results). **No number here is ours.** The ids are `data/ffx/flooded-ways-ids.ts`.
 *
 * ## The state (`state.flags`, so a fork, a clone and the advisor's dry runs see the same battle)
 *
 * | Key | Holds |
 * |---|---|
 * | `battle.inWater` | the water battle: a Petrify that lands on a party member shatters them (`adapt/status.ts` passes it to the kernel) |
 * | `fw.link` | the link's key (`area-1` ... `geosgaeno`), set at the battle's start |
 * | `fw.evrae.flip` | Evrae Altana's alternation flag (the script's `v6`, 0 at the start of each area, RE 4.3) |
 * | `fw.geo.v4` | Geosgaeno's cycle slot (the script's `v4`: 0 to 2 punches already thrown, 3 swallow next, 255 someone inside, RE 4.1) |
 * | `fw.hold` | the id of the swallowed character, `''` when nobody is inside |
 * | `fw.geo.savedMax` | Geosgaeno's real maximum HP while a Regurgitate has it rewritten (0 otherwise) |
 * | `fw.geo.deathBlow` | the death blow was dealt (`./flooded-ways-end.ts`) |
 */

import type { FFXCombatant } from '../../common/types.ts';
import type { Ctx } from '../state.ts';
import { friendlies, has, onField, tryActor } from '../state.ts';
import { GATE_LOCK_IDS } from '../../../data/ffx/flooded-ways-ids.ts';

export * from '../../../data/ffx/flooded-ways-ids.ts';

export const WATER_FLAG = 'battle.inWater';
export const LINK_FLAG = 'fw.link';
export const EVRAE_FLIP = 'fw.evrae.flip';
export const GEO_V4 = 'fw.geo.v4';
export const HOLD_FLAG = 'fw.hold';

/** Geosgaeno's "below half" line: half its maximum HP, rounded down (RE 4.1: 16,383). KO Punch is thrown only strictly below it. */
export const GEOSGAENO_HALF_LINE = 16_383;
/** The draw (modulo 100) above which a punch below the line is a KO Punch (RE 4.1: exact tally 45,200 of 65,536 at 10,000 HP). */
export const KO_PUNCH_ABOVE = 30;
/** Punches between swallows: v4 counts them up to 3 (RE 4.1). After a spit-out v4 := a draw modulo 2, so the next swallow follows after 3 punches (even) or 2 (odd). */
export const PUNCHES_BEFORE_SWALLOW = 3;
export const SPIT_DRAW_MODULO = 2;
/** The slot v4 holds while somebody is inside (RE 4.1). */
export const V4_HOLDING = 255;
/** The amount the death-blow Regurgitate deals to everyone while a character is inside (RE 4.1 onDeath; 9,999 each, the held one included). */
export const DEATH_REGURGITATE = 9_999;
/** `state.flags` key: Geosgaeno's real maximum HP while the script has rewritten it for a Regurgitate (0 when nothing is rewritten; `./geosgaeno-hold.ts`). */
export const STOMACH_SAVED_MAX = 'fw.geo.savedMax';

/** The status ids the swallow copies onto Geosgaeno (RE 4.1 postTurn): the ailments are moved (the victim loses them), the buffs are copied (the victim keeps them). */
export const MOVED_AILMENTS = ['zombie', 'poison', 'power-break', 'magic-break', 'armor-break', 'mental-break', 'silence', 'darkness'] as const;
/** Shell, Protect, Reflect (10 turns each), the four Nuls (1 charge), Regen (10), Haste (10, clears Slow), Slow (10, clears Haste). */
export const COPIED_BUFFS = ['shell', 'protect', 'reflect', 'nultide', 'nulblaze', 'nulshock', 'nulfrost', 'regen', 'haste', 'slow'] as const;
/** Silence and Darkness are set to 2 turns on Geosgaeno when moved (RE 4.1). */
export const MOVED_SHORT_TURNS = 2;
export const COPIED_BUFF_TURNS = 10;

/** The link key the battle is running, or `undefined` outside this chapter. */
export function linkKey(ctx: Ctx): string | undefined {
  const v = ctx.state.flags[LINK_FLAG];
  return typeof v === 'string' ? v : undefined;
}

/** Is this one of the chapter's battles? */
export function isFloodedBattle(ctx: Ctx): boolean {
  return linkKey(ctx) !== undefined;
}

/** The Via Purifico area (1 to 3), 0 for the Baaj Temple, `undefined` outside the chapter. */
export function areaOf(ctx: Ctx): number | undefined {
  const key = linkKey(ctx);
  if (key === undefined) return undefined;
  return key === 'area-1' ? 1 : key === 'area-2' ? 2 : key === 'area-3' ? 3 : 0;
}

/** The characters in the front line: the party's three slots minus anyone the water took off the field (a knocked-out member still counts; the script's "exactly three characters", RE 4.3). */
export function frontCount(ctx: Ctx): number {
  return friendlies(ctx).filter((c) => onField(c)).length;
}

/** The Gate Locks of the battle (whether or not they stand). */
export function gateLocks(ctx: Ctx): FFXCombatant[] {
  return GATE_LOCK_IDS.map((id) => tryActor(ctx, id)).filter((c): c is FFXCombatant => c !== undefined);
}

/** The id of the swallowed character, or `undefined` when nobody is inside. */
export function heldId(ctx: Ctx): string | undefined {
  const v = ctx.state.flags[HOLD_FLAG];
  return typeof v === 'string' && v !== '' ? v : undefined;
}

/** The swallowed character, if they are still in the battle. */
export function heldMember(ctx: Ctx): FFXCombatant | undefined {
  const id = heldId(ctx);
  return id === undefined ? undefined : tryActor(ctx, id);
}

/** True when `c` carries Doom (a Doomed character is never swallowed, RE 4.1). */
export function hasDoom(c: FFXCombatant): boolean {
  return has(c, 'doom');
}
