/**
 * The hidden Gauntlet chapter's formations as one chain (FFX only; chapter 54): **nine acts, one Monster Arena creation each** (`research/re-ffx-monster-arena-creations.md`, "RE n"; preflight GA2), in three tiers of three
 * (GA3: each tier is a releasable cut), built from the act table in `../gauntlet-ids.ts`. The arena formations (`zzzz02_55` to `zzzz03_xx`) set **no command bans, no start type and no music** (RE n 0: about 19 KB of camera
 * work each), so what a group carries here is the chapter's own choice:
 *
 * - **One body** at slot 0 (**the Ultima Buster adds its Head at slot 1 and its two Arms at slots 2 and 3**, the formation's four monster slots: RE n 0, 3.1; the parts are `isPart`, so the victory test ends the battle
 *   when the body falls), **Escape and Flee off** (`canEscape: false`, preflight GA13: the formations set neither, so it is the field's flag, unsourced; the bodies carry `boss`), a **Normal start** (the engine's default),
 *   the headline, the plate (a stand-in: `GAUNTLET_PLATE`) and the music (a stand-in cue: `boss-challenge`, the Dark Aeons chapter's choice, and `boss-yojimbo` for the last act as theirs; no source names these fights'
 *   cues and Bailey's ear decides, rule 13).
 * - **The chain** (GA3, "a heal between acts"): each act but the last names the next (`nextGroupId`); every act from the second on is a **fresh fight** (`restoresPartyOnEntry`, `restoresAeonsOnEntry`: the party and every
 *   aeon whole, a fallen member or aeon up, statuses cleared; the bag, the gil, the gauges and the members' kill counts carry), a **retry checkpoint** (`checkpointOnEntry`: a defeat retries that act, not the chapter) and shows
 *   **no Save Sphere card** (`noSaveSphereCard`); the last act pays every act's spoils in one results screen (`poolsChainSpoils`). A defeat in act 1 starts the chapter over, and so does the Cactuar King leaving (GA9:
 *   its end is an 'escape', which the flow retries from the chapter's start; `../../../battle/ffx/ai/gauntlet-end.ts`).
 * - **Only the tiers built are registered** (`GAUNTLET_TIERS_BUILT`): the chain ends at the last act of the last built tier, and the formations of the others are not in the data layer, so nothing reaches a creature whose
 *   script is not written. `gauntletGroup(index)` builds any act for the chain tests.
 */

import type { EnemyDef, EnemyGroupDef } from '../../../battle/common/types.ts';
import { GAUNTLET_ACTS, GAUNTLET_PLATE, GAUNTLET_TIERS_BUILT, type GauntletCreatureId } from '../gauntlet-ids.ts';
import { gauntletBody, ultimaBusterArmLeft, ultimaBusterArmRight, ultimaBusterHead } from './gauntlet.ts';

/** The bodies of an act: the creature, and for the Ultima Buster its Head and two Arms (slots 1 to 3). */
function enemiesOf(creature: GauntletCreatureId): EnemyDef[] {
  return creature === 'ultima-buster' ? [gauntletBody(creature), ultimaBusterHead(), ultimaBusterArmLeft(), ultimaBusterArmRight()] : [gauntletBody(creature)];
}

/** How many acts have their rules built (3 per tier). */
export const GAUNTLET_ACTS_BUILT = 3 * GAUNTLET_TIERS_BUILT;

/** One act as a formation. The chain runs to `built` acts (default: the tiers built); the last of them pays the pooled spoils. */
export function gauntletGroup(index: number, built: number = GAUNTLET_ACTS_BUILT): EnemyGroupDef {
  const act = GAUNTLET_ACTS[index];
  if (act === undefined) throw new Error(`gauntlet-groups: no act ${index}`);
  const next = index + 1 < built ? GAUNTLET_ACTS[index + 1] : undefined;
  const first = index === 0;
  const last = next === undefined;
  return {
    id: act.groupId,
    game: 'ffx',
    canEscape: false,
    enemies: enemiesOf(act.creature),
    bossId: act.creature,
    headline: act.headline,
    plate: GAUNTLET_PLATE,
    ...(next !== undefined ? { nextGroupId: next.groupId } : {}),
    ...(first ? {} : { checkpointOnEntry: true, restoresPartyOnEntry: true, restoresAeonsOnEntry: true, noSaveSphereCard: true }),
    ...(last ? { poolsChainSpoils: true } : {}),
    musicCues: [{ at: 'start', track: act.creature === 'ultima-buster' ? 'boss-yojimbo' : 'boss-challenge', fadeMs: 1200 }],
  };
}

/** The groups of the tiers built, in chain order (registered in `./hidden-ffx.ts`). */
export const GAUNTLET_GROUPS: readonly EnemyGroupDef[] = GAUNTLET_ACTS.slice(0, GAUNTLET_ACTS_BUILT).map((_, i) => gauntletGroup(i));

/** The group of one creature (any act, built or not, with the chain as the tiers built have it). */
export function gauntletGroupOf(creature: GauntletCreatureId): EnemyGroupDef {
  const index = GAUNTLET_ACTS.findIndex((a) => a.creature === creature);
  if (index < 0) throw new Error(`gauntlet-groups: no creature '${creature}'`);
  return gauntletGroup(index);
}
