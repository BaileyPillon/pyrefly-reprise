/**
 * The subjects whose **physical** moves play the attack beat on their IDLE painting while they have no attack painting of their own (r75 fix pass, the driver's decision 219v item 1, under Bailey's delegation:
 * 2026-11-02 ~16:40 EST "i'll go with all of your recommendations please implement all the unimplemented chapters that i decided on"). **FFX only: the one entry is the hidden Spectral Keeper.**
 *
 * Why. The presenter's rule for any enemy is `EnemyActionPose.poseForAction`: a physical move draws `attack` when the enemy paints one, else `cast`, whose beat is the spell's (the cast cue, the blue flash, the
 * caster's lift). The Keeper's attack painting is held back (`docs/handoff/r75-boss-art.md`: its overlap with the idle stays under 0.5 either way, so it would show as a double image at the swap), so without
 * this entry its Berserk Tail, Attack All and aeon Attack would play a spell's beat on a creature that is swinging a tail. An entry here makes the move play the ATTACK beat (the attack cue, the lunge) on the
 * painting the pose chain already resolves `attack` to when the file is absent (`BattlePresenterArt.POSE_FALLBACKS`: attack, ready, idle), the idle.
 *
 * The entry costs nothing once the painting is installed: `poseForAction` asks `paints('attack')` first, so a subject that paints its own attack draws it exactly as every enemy does, and the entry can stay or
 * go. Default off: a subject that is not listed (every other enemy in both games) is unchanged. Keyed by the BASE art id (`baseArtId`), so a namespaced copy of a subject reads its base's row.
 *
 * Pure data: no `three`, no DOM (hard rule 1).
 */

import { baseArtId } from './artNamespace.ts';

/** Art ids whose physical moves use the attack beat on the idle painting when no attack painting is installed. FFX only (the Spectral Keeper, hidden Chapter 29); the FFX-2 hidden chapter's four are painted. */
export const PHYSICAL_ON_IDLE_ARTS: ReadonlySet<string> = new Set<string>(['spectral-keeper']);

/** Does this art id opt in? `undefined` (a stage that cannot say which art a figure wears) is no. */
export function physicalOnIdle(artId: string | undefined): boolean {
  return artId !== undefined && PHYSICAL_ON_IDLE_ARTS.has(baseArtId(artId));
}
