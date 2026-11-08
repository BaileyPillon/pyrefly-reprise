/**
 * The three formations of the hidden Omega Ruins chapter (FFX only, number 43), chained: **Ultima Weapon** (`omeg00_10`), **Omega Weapon** (`omeg01_10`) and **Nemesis** (`zzzz02_76`).
 * **Source: the game's own formations** (`research/re-ffx-omega-ultima-nemesis.md` section 2, "RE 2", `[bytes]`); the bodies are `./weapons.ts`, the rows `./weapons-abilities.ts`.
 *
 * ## What each group carries, and from where
 *
 * - **Escape and Flee off for everyone, characters and aeons, in the two Ruins fights** (RE 2: the formation scripts disable both). **Nemesis's formation writes no disable of its own** (RE 2: the launching Monster Arena event's flags were not
 *   read); the chapter turns them off for the third act too, a pick (the handoff's WP12, "driver's call, his to overturn", the alternative being to leave them on): a flight from the last act would end the whole chain on a result page that
 *   says nothing the retry card does not. Switch and Summon are not disabled, so any three of seven and any of the twelve aeon slots are legal, as in the game. All three start Normal (RE 2: the Ruins formations write it; Nemesis's writes none).
 * - **The chain**: no menu between the acts. Acts II and III are retry checkpoints (`checkpointOnEntry`: a defeat in Act III retries Act III, not the Ruins) and the last link pays all three fights' spoils in one results screen
 *   (`poolsChainSpoils`). **The heal between the acts** is the Mirror Aeons chain's pick (preflight WP2): on entry the party and the aeons are restored, a fallen member or aeon up, with no Save Sphere card.
 * - **The stage**: all three share one scene (`../../../scenes/omega-ruins.ts`) and one plate, the Cavern of the Stolen Fayth, a stand-in (preflight WP5). The game stages Ultima Weapon and Nemesis in the same place with the party on the left and
 *   Omega in a second place with the party on the right (RE 2); the chapter keeps one camera (the relit plates and the mirrored Omega framing wait for Bailey's pick, rule 9).
 * - **Music**: no source names these fights' cues. Existing cues by reference, flagged stand-ins (preflight section 7; rule 13: Bailey's ear decides): `boss-challenge` (the game's one generic boss track, our original take) for the two Weapons
 *   and `boss-yu-yevon` for Nemesis, with `boss-sin-assault` the alternative.
 */

import type { EnemyGroupDef } from '../../../battle/common/types.ts';
import { NEMESIS_GROUP_ID, NEMESIS_ID, OMEGA_GROUP_ID, OMEGA_WEAPON_ID, ULTIMA_GROUP_ID, ULTIMA_WEAPON_ID } from '../omega-ruins-ids.ts';
import { WEAPON_ABILITIES } from './weapons-abilities.ts';
import { nemesis, omegaWeapon, ultimaWeapon } from './weapons.ts';

export { WEAPON_ABILITIES };

/** Escape (0x3003) and Flee (0x3018), switched off for characters and aeons alike (RE 2). */
const NO_FLIGHT = [
  { who: 'everyone', command: 0x3003 },
  { who: 'everyone', command: 0x3018 },
] as const;

/** The restore a link after the first gives (the Mirror Aeons chain's pick, preflight WP2): the party and the aeons whole on entry, no Save Sphere card, a retry checkpoint. */
const WHOLE_ON_ENTRY = { checkpointOnEntry: true, restoresPartyOnEntry: true, noSaveSphereCard: true, restoresAeonsOnEntry: true } as const;

/** Act I, `omeg00_10`: Ultima Weapon alone. */
export const ultimaWeaponGroup: EnemyGroupDef = {
  id: ULTIMA_GROUP_ID,
  game: 'ffx',
  canEscape: false,
  enemies: [ultimaWeapon()],
  bossId: ULTIMA_WEAPON_ID,
  headline: 'Ultima Weapon',
  commandDisables: NO_FLIGHT,
  nextGroupId: OMEGA_GROUP_ID,
  musicCues: [{ at: 'start', track: 'boss-challenge', fadeMs: 1200 }],
};

/** Act II, `omeg01_10`: Omega Weapon alone. */
export const omegaWeaponGroup: EnemyGroupDef = {
  id: OMEGA_GROUP_ID,
  game: 'ffx',
  canEscape: false,
  enemies: [omegaWeapon()],
  bossId: OMEGA_WEAPON_ID,
  headline: 'Omega Weapon',
  commandDisables: NO_FLIGHT,
  ...WHOLE_ON_ENTRY,
  nextGroupId: NEMESIS_GROUP_ID,
  musicCues: [{ at: 'start', track: 'boss-challenge', fadeMs: 1200 }],
};

/** Act III, `zzzz02_76`: Nemesis alone, the last link; it pays all three fights' spoils in one results screen. */
export const nemesisGroup: EnemyGroupDef = {
  id: NEMESIS_GROUP_ID,
  game: 'ffx',
  canEscape: false,
  enemies: [nemesis()],
  bossId: NEMESIS_ID,
  headline: 'Nemesis',
  commandDisables: NO_FLIGHT,
  ...WHOLE_ON_ENTRY,
  poolsChainSpoils: true,
  musicCues: [{ at: 'start', track: 'boss-yu-yevon', fadeMs: 1200 }],
};

/** The three groups in chain order, for the data index (`./hidden-ffx.ts`). */
export const WEAPON_GROUPS: readonly EnemyGroupDef[] = [ultimaWeaponGroup, omegaWeaponGroup, nemesisGroup];
