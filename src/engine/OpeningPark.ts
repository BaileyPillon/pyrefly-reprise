/**
 * THE OPENING'S FIRST FRAME, UNDER THE BOSS CARD (post-conference lane "post-fight-start"; pose continuity; BOTH GAMES: the opening is shared plumbing, Chapter I Seymour Flux is FFX and
 * Chapter IV Bahamut is FFX-2).
 *
 * Release 64 let the battle-start card fade out onto a field that showed the party standing at home with the full HUD up, and only THEN began the opening (`BattleMoments.battleStart`): the HUD
 * went down and the party went to alpha 0 (it then fades back in at its mark). So for the last 250 ms of the card's fade and the 35 ms after it the viewer saw the party and the turn order, and
 * then saw them vanish and come back: a pose pop at the start of every opening (the adversarial review's filmstrips `strip-ch1-edge3.jpg`, `strip-ch4-edge.jpg`).
 *
 * The card is the cover (`until:` already holds it for CHAPTER FRAMING's first plan), so the opening's first frame is put under it: as the card starts to leave, `BattleMoments.coverOpening` takes the
 * HUD down and parks the party at alpha 0, and the opening that follows finds them already down. NOTHING ELSE moves: positions, poses, the camera and the slide's own fade are untouched, so the opening
 * plays exactly as it did, from the same first frame; only the frames before it change (empty field instead of a party that is about to vanish). A figure parked here and then not slid (a collapsed
 * opening) is put back at alpha 1 ({@link unparkParty}).
 *
 * Pure like the rest of the presenter (hard rule 1): the stage is a port, nothing here touches the DOM or `three`.
 */

import type { CombatantId } from '../battle/common/types.ts';
import type { ActorHandle, BattleStage } from './BattlePresenterPorts.ts';

type Actors = Pick<BattleStage, 'actor'>;

/** The figures this module has put at alpha 0 and not yet handed to the slide (or put back). */
const parked = new WeakSet<ActorHandle>();

/** Put each member of `ids` the stage holds at alpha 0, as the opening's slide-on would, and remember it. */
export function parkParty(stage: Actors, ids: readonly CombatantId[]): void {
  for (const id of ids) {
    const actor = stage.actor(id);
    if (!actor || parked.has(actor)) continue;
    actor.setAlpha(0);
    parked.add(actor);
  }
}

/** Put back (alpha 1) every figure of `ids` that {@link parkParty} left at 0 and that no slide has taken: an opening that collapsed, or a screen that left. A figure not parked is not touched. */
export function unparkParty(stage: Actors, ids: readonly CombatantId[]): void {
  for (const id of ids) {
    const actor = stage.actor(id);
    if (!actor || !parked.has(actor)) continue;
    parked.delete(actor);
    actor.setAlpha(1);
  }
}

/**
 * The party walks on. Each active member starts one body-width further out of frame than the last so they arrive staggered rather than as a block (moved here from `BattleMoments.slidePartyIn`,
 * line for line; `ms` is the slide's length at the playback speed). A figure that was parked has its alpha at 0 already: the slide takes it from there.
 */
export async function slideParty(stage: Actors, ids: readonly CombatantId[], ms: number): Promise<void> {
  const runs = ids.map((id, i) => {
    const actor = stage.actor(id);
    if (!actor) return Promise.resolve();
    parked.delete(actor);
    const home = { x: actor.position.x, y: actor.position.y, z: actor.position.z };
    // Off-stage on the party's own side: left of the hall axis in every FFX/FFX-2 scene, right for FF7's
    const right = (actor as { facingDir?: number }).facingDir === -1; // party, turned to -x (`sideFacing`)
    actor.moveTo({ x: right ? home.x + 4.2 + i * 0.5 : home.x - 4.2 - i * 0.5, y: home.y, z: home.z }, 0);
    actor.setAlpha(0);
    void actor.fadeTo(1, ms * 0.5);
    return actor.moveTo(home, ms + i * 70);
  });
  await Promise.all(runs);
}
