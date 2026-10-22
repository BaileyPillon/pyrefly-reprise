/**
 * MEGA FLARE'S SHAKE (release 62; Bailey, 2026-10-22 ~00:00 EDT, decision 173b: "Mega Flare: screen-filling light + longer shake"; **FFX-2 only**).
 *
 * The blast's light (the room flood and the white-out) is the look's (`look/flare/`); the shake is the presenter's landing beat (`BattlePresenterBeats.damage`): a blow of FFX-2's Mega Flare
 * shakes the camera harder and longer than any ordinary hit. The blow's ability is the Mega Flare special exactly when `spellfx/SpellFxSpecials.ts` draws it for FFX-2, and FFX shares the id `mega-flare`
 * (the aeon Bahamut's Overdrive) without drawing that special, so the game is asked as well as the id: an FFX fight never shakes here.
 *
 * Numbers (world units and milliseconds, the camera's own units, `BattleCamera.shake`; none are sourced, all `[ours]`): an ordinary hit shakes 0.1 for 340 ms and a critical 0.16; a form change (the
 * loudest beat the presenter has) 0.2 for 520 ms. Mega Flare lands on all three girls at once and takes the stronger of the shakes, so one beat of 0.32 for 1,100 ms covers them: more than the form change in
 * strength and twice its length, damping out linearly. REDUCE MOTION takes the shake away (`ComfortCamera.shake` does nothing), as it does every shake. Pure (no DOM, no `three`).
 */
import type { GameId } from '../battle/common/types.ts';
import { specialFx } from './spellfx/SpellFxSpecials.ts';

export const MEGA_FLARE_SHAKE = { amplitude: 0.32, ms: 1100 } as const;

/** Is this blow Mega Flare in FFX-2? `abilityId` is the action's ability (the striker's latest, `actionOfBlow`). */
export function megaFlareBlow(abilityId: string | undefined, game: GameId | undefined): boolean {
  return game === 'ffx2' && specialFx(abilityId, 'ffx2') === 'megaflare';
}
