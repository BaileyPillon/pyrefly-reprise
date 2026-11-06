/**
 * **Evrae Altana's script** (FFX only; the hidden Flooded Ways chapter): the undead Evrae of the Via Purifico (monster file `m120`), as the game's own bytecode runs it (`research/re-ffx-geosgaeno-evrae-altana.md` 4.3,
 * "RE 4.3": read from the file and run in the earlier lanes' interpreter). **No number here is ours**; the state it keeps is `./flooded-ways-rules.ts`, the rows are `data/ffx/enemies/flooded-ways-abilities.ts`.
 *
 * ## The turn (RE 4.3)
 *
 * A flag starts at 0 in each area and flips every turn. **When it is 0 and exactly three characters stand in the front line, the move is Stone Gaze on one random living character; otherwise it is Photon Spray (eight
 * hits, each on a random member)**; the flag flips either way. With three on the field that is Gaze, Spray, Gaze, Spray ...; with two or one (the water took a member off the field) it is a Spray every turn until the area
 * ends. The flag starts at 0 in every area, so each area opens with a Gaze.
 *
 * ## When it is hit (RE 4.3)
 *
 * **Areas 1 and 2:** a hit that leaves a nonzero `LastDamageTakenHP` (a heal on a Zombie is damage, so a Phoenix Down thrown at it draws the counter too: the script tests the HP lost, not the command; RE open question 2)
 * is answered with a plain Attack on the attacker. **Area 3 has no counter at all.** The answer is the engine's free action (`./hit-gates.ts#react`): a counter never triggers another counter, and a second hit event in
 * one action (a Doublecast) draws one answer.
 *
 * It keeps no other state: the HP it carries from area to area is the chain's (`app/screens/BattleScreenFloodedCarry.ts`), the Zombie status is the setup's (`./flooded-ways-setup.ts`).
 */

import type { Command } from '../../common/types.ts';
import { randomLiving } from './game-rolls.ts';
import { react } from './hit-gates.ts';
import { type HitEvent, registerHitScript } from './hit-script.ts';
import { type AiContext, aiContextFor, registerAiScript, use } from './types.ts';
import { EVRAE_FLIP, FLOODED_ROWS, FLOODED_SCRIPTS, areaOf, frontCount } from './flooded-ways-rules.ts';

/** Evrae Altana's turn (RE 4.3). */
export function evraeAltanaTurn(ai: AiContext): Command | null {
  const { ctx } = ai;
  const flip = ctx.state.flags[EVRAE_FLIP] === 1 ? 1 : 0;
  ctx.state.flags[EVRAE_FLIP] = flip === 0 ? 1 : 0; // flips either way
  if (flip === 0 && frontCount(ctx) === 3) {
    const victim = randomLiving(ctx);
    if (victim !== undefined) return use(ai, FLOODED_ROWS.stoneGaze, [victim.id]);
  }
  return use(ai, FLOODED_ROWS.photonSpray, []);
}

/** Evrae Altana's `onHit`: the counter, in areas 1 and 2 only. */
export function evraeAltanaHit(event: HitEvent): void {
  const { ctx, target, attacker } = event;
  const area = areaOf(ctx);
  if (area !== 1 && area !== 2) return; // area 3 has no counter at all (RE 4.3)
  if (event.lastDamage === 0 || target.hp <= 0) return; // a miss, a zero-damage action, or it fell
  if (attacker.side === 'enemy') return;
  react(ctx, target, attacker.id, use(aiContextFor(ctx, target), FLOODED_ROWS.altanaAttack, [attacker.id]));
}

registerAiScript(FLOODED_SCRIPTS.evrae, evraeAltanaTurn);
registerHitScript(FLOODED_SCRIPTS.evrae, evraeAltanaHit);
