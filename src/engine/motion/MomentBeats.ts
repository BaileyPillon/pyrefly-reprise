/**
 * The presenter's side of the per-game MOMENTS (motion pass, lane "core", step 3): the beats `BattlePresenterBeats` calls. Every function answers "not mine" unless
 * `MomentsSwitch.momentsOn()` is true and the actor has the optional port member, so the live game is unchanged by default. Ports only: no `three`, no DOM, no engine state, no RNG.
 *
 * Game case: the VICTORY moment is each chapter's own: where the sources give the party a pose (FFX Chapter I) the actors cheer through `setPose('victory')` (their own cue); where the sources
 * withhold it (`victoryPose: 'hold'`: FFX-2 Chapter IV; `research/ffx-vs-ffx2-presentation.md` 2.2) the party keeps its stance and {@link standDownParty} gives it a quiet settle.
 */
import type { EventCtx } from '../BattlePresenterEvents.ts';
import { menuBlocks } from '../KeySlots.ts';
import { momentsOn } from './MomentsSwitch.ts';

/** The victory was withheld (the held stance): every figure on the party's side stands down. True when it did. */
export function standDownParty(ctx: EventCtx): boolean {
  if (!momentsOn() || menuBlocks(ctx)) return false; // FFX-2: nothing new plays over an open command menu (D-357)
  let any = false;
  for (const id of ctx.stage.staged()) {
    const side = ctx.stage.sideOf(id);
    if (side !== 'party' && side !== 'aeon') continue;
    const a = ctx.stage.actor(id);
    if (a?.standDown) {
      a.standDown();
      any = true;
    }
  }
  return any;
}
