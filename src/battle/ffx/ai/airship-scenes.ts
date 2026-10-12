/**
 * The draws the *Fahrenheit* fights' scenes and camera make on the scripts' own stream (re-parity RNG lane; **FFX only**:
 * Chapter VIII, Evrae, and Chapter XVII, the two Fins; FFX-2 has no such fight).
 *
 * The game's scripts and its battle scenes share one random stream, stream 2 (`GetRandomValue`, `& 0xFFFF`), so a scene that
 * rolls a voice line moves every AI roll that follows it. The engine has no scenes, but it keeps the count right, at the points
 * where the formation scripts draw (`research/re-ffx-ai-evrae-yojimbo-isaaru-sin.md` section 2.6, read again in the formation
 * scripts `hiku15_00`, `ssbt00_00` and `ssbt01_00`; `D:\Tools\ffx-parity\camera\CAMERA.md` section 6 for the camera):
 *
 * | Where | Draws (stream 2) |
 * |---|---|
 * | Cid's turn begins with an order standing (scene A1, the pre-turn caption) | one: `GetRandomValue() mod 2`, which of two voice lines |
 * | Tidus or Rikku gives Pull back or Move in (scene A2, the voice reply) | one `mod 100`; when that is below the speaker's threshold (255 at the start of the battle) a second `mod 100`, which becomes the speaker's new threshold |
 * | Cid's Guided Missiles (the camera shot of the formation's worker w4) | one: `GetRandomValue() mod 100 < 50`, which of two shots |
 *
 * A scene finishes before the next turn opens (the turn start returns while a scene runs), so the draws sit right after the
 * command or at the top of the turn that raised them. The last-volley and out-of-ammo captions draw nothing, nor does Cancel.
 * The victory camera (48 draws after the fight) comes after the last roll of the battle and is not modelled.
 */

import type { CombatantId } from '../../common/types.ts';
import type { Ctx } from '../state.ts';
import { scriptMod } from './script-random.ts';

/** The battle flag that holds a speaker's voice threshold (`v15` for Tidus, `v16` for Rikku in the formation script). */
const THRESHOLD_FLAG: Readonly<Record<string, string>> = {
  tidus: 'airship.voiceThreshold.tidus',
  rikku: 'airship.voiceThreshold.rikku',
};

/** A voice threshold at the start of a battle: the script sets both to 255, so the first reply always takes its second draw. */
export const VOICE_THRESHOLD_START = 255;

/** Scene A1: Cid's pre-turn caption while an order stands. One draw, `mod 2` (which of two lines); the line changes nothing else. */
export function orderCaptionScene(ctx: Ctx): void {
  scriptMod(ctx, 2);
}

/**
 * Scene A2: the reply of whoever gave the order. Only Tidus and Rikku have the Trigger Commands; the scene branches on
 * them alone, so anyone else draws nothing.
 */
export function orderVoiceScene(ctx: Ctx, speaker: CombatantId): void {
  const flag = THRESHOLD_FLAG[speaker];
  if (flag === undefined) return;
  const stored = ctx.state.flags[flag];
  const threshold = typeof stored === 'number' ? stored : VOICE_THRESHOLD_START;
  if (scriptMod(ctx, 100) < threshold) ctx.state.flags[flag] = scriptMod(ctx, 100);
}

/** The camera shot of Cid's Guided Missiles: `GetRandomValue() mod 100 < 50`, one draw whose answer only picks a shot. */
export function missileCameraShot(ctx: Ctx): void {
  scriptMod(ctx, 100);
}
