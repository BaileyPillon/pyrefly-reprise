/**
 * **The hidden Gauntlet chapter's ids and the rules every creature's script shares** (FFX only; chapter 54; `research/re-ffx-monster-arena-creations.md`, "RE n"). The battle layer imports no `src/data`, so the combatant,
 * script and move-row ids the scripts name are **copies** of `data/ffx/gauntlet-ids.ts`; `tests/unit/chapters/gauntlet-data.test.ts` pins that the copies agree. Each creature's own numbers (a draw's modulo, a threshold,
 * a cycle) live at the top of its own file with their source, one file a creature (`./gauntlet-cactuar-king.ts`, `./gauntlet-don-tonberry.ts`, `./gauntlet-jormungand.ts`; the later tiers add theirs).
 *
 * **How the scripts read the game's own words** (the earlier AI lanes' conventions, `./game-rolls.ts` and `./hit-gates.ts`):
 *
 * - `GetRandomValue() mod n` is one draw of the battle's script stream (`gameMod`); `findMatchingChr(front line, alive)` is `randomLiving` (the picker stream, a draw only with two or more candidates).
 * - "An aeon is in the front line" (`countChrOverlap(FrontlineChars, AllAeons)`) is `aeonHoldsField`: Yuna's seven aeons (actors 8 to 14), the test every earlier script of the project uses.
 * - A command a script *performs* from `onHit` is a free reaction (`react`): it needs the owner able to act and the hit not itself part of a reaction (`isCounterattackAllowed()` is `counterAllowed`), and the engine
 *   drops a second reaction of the same owner in one action. A monster whose HP the hit took to 0 queues nothing.
 */

import type { FFXCombatant } from '../../common/types.ts';

/** Armored on or off (a script's write of the property; the record's flag byte starts it on: Earth Eater's and Catastrophe's). */
export function setArmored(self: FFXCombatant, on: boolean): void {
  const rest = self.immunityFlags.filter((f) => f !== 'armored');
  self.immunityFlags = on ? [...rest, 'armored'] : rest;
}

/** The combatant ids (copies of `GauntletCreatureId` and the parts in `data/ffx/gauntlet-ids.ts`). */
export const GAUNTLET_IDS = {
  cactuarKing: 'cactuar-king',
  donTonberry: 'don-tonberry',
  jormungand: 'jormungand',
  earthEater: 'earth-eater',
  greaterSphere: 'greater-sphere',
  catastrophe: 'catastrophe',
} as const;

/** The AI script ids (copies of `GAUNTLET_SCRIPT`). */
export const GAUNTLET_SCRIPTS = {
  cactuarKing: 'gauntlet-cactuar-king',
  donTonberry: 'gauntlet-don-tonberry',
  jormungand: 'gauntlet-jormungand',
  earthEater: 'gauntlet-earth-eater',
  greaterSphere: 'gauntlet-greater-sphere',
  catastrophe: 'gauntlet-catastrophe',
} as const;

/** The formation ids of the tier-2 acts the set-up hook keys on (copies of `gauntletGroupId`). */
export const GAUNTLET_GROUP_IDS = {
  earthEater: 'gauntlet-earth-eater',
  greaterSphere: 'gauntlet-greater-sphere',
} as const;

/** The move rows the scripts name (copies of `GAUNTLET_ROWS` and `GAUNTLET_PLAYER_ROWS`; the comment gives the game's command id). */
export const GAUNTLET_ROWS = {
  attack: 'gauntlet-attack', // 0x40F0
  ultima: 'gauntlet-ultima', // 0x40F3 (the Greater Sphere's monster-side reply: v8 = 16627 in all four of its states)
  megatonPunch: 'gauntlet-megaton-punch', // 0x40F5
  getsUp: 'gauntlet-gets-up', // 0x6018
  hydraulicPress: 'gauntlet-hydraulic-press', // 0x40FD
  elementalShift: 'gauntlet-elemental-shift', // 0x6036
  toxicCloud: 'gauntlet-toxic-cloud', // 0x40F7
  toxicSpray: 'gauntlet-toxic-spray', // 0x40F8
  hundredThorns: 'gauntlet-hundred-thorns', // 0x40F9
  transform: 'gauntlet-transform', // 0x6007
  flare: 'flare', // 0x3052, the party's own row
  demi: 'demi', // 0x304E, the party's own row
  firaga: 'firaga', // 0x3049, the party's own rows 0x3049 to 0x304C
  blizzaga: 'blizzaga', // 0x304A
  thundaga: 'thundaga', // 0x304B
  waterga: 'waterga', // 0x304C
  needles10000: 'gauntlet-10000-needles', // 0x40BC
  needles99999: 'gauntlet-99999-needles', // 0x40F2
  runAway: 'gauntlet-run-away', // 0x4033
  tonberryAttack: 'gauntlet-tonberry-attack', // 0x4062
  voodoo: 'gauntlet-voodoo', // 0x40EA
  karma: 'gauntlet-karma', // 0x40FF
  waddle: 'gauntlet-waddle', // 0x4081
  jormungandAttack: 'gauntlet-jormungand-attack', // 0x40BA
  coldStare: 'gauntlet-cold-stare', // 0x40BB
  vorpal: 'gauntlet-space-time-vorpal', // 0x40E2
} as const;

/**
 * `state.flags` key: the Cactuar King ran away (`./gauntlet-cactuar-king.ts` sets it as it performs its Run Away; `./gauntlet-end.ts` ends the battle on it). Nothing else in the project writes or reads it.
 */
export const GOT_AWAY_FLAG = 'gauntlet.gotAway';
/** `state.flags` key: the waypoint Don Tonberry's last Waddle moved him to, 0 (not yet moved) to 4 (arrived): the formation's own `PositionToMoveTo` write, for the scene. */
export const TONBERRY_WAYPOINT_FLAG = 'gauntlet.tonberry.waypoint';
/** `state.flags` key: Earth Eater is down (`v5 == 1`), true from the hit that took its running total past the line to the turn it gets up. Published for the scene and the advisor; the script reads its own memory. */
export const EATER_DOWN_FLAG = 'gauntlet.earthEater.down';
/** `state.flags` key: the HP damage Earth Eater has taken since it last stood up (`v8`), published for the advisor, which needs to know how far the next knock-down is. */
export const EATER_TOTAL_FLAG = 'gauntlet.earthEater.total';
/** `state.flags` key: the Greater Sphere's state, 0 to 3 (weak Fire, Ice, Thunder, Water; the game's `v5`). */
export const SPHERE_STATE_FLAG = 'gauntlet.sphere.state';
/** `state.flags` key: the Doublecast gate (`v12`): the first spell of a pair is ignored. */
export const SPHERE_DOUBLECAST_FLAG = 'gauntlet.sphere.doublecast';
/** `state.flags` key: how many times a hit has shifted the Greater Sphere's element (the battle's start is not one). */
export const SPHERE_SHIFTS_FLAG = 'gauntlet.sphere.shifts';
/** `state.flags` key: Catastrophe's form, 0 (the first) or 1 (transformed: the game's `v2`). */
export const CATASTROPHE_FORM_FLAG = 'gauntlet.catastrophe.form';
/** The painting of Catastrophe's second form (a copy of `GAUNTLET_CATASTROPHE_FORM2_SPRITE` in `data/ffx/gauntlet-ids.ts`; a stand-in until the art lane's lands: the same painting as the first form). */
export const CATASTROPHE_FORM2_SPRITE = 'spectral-keeper';
