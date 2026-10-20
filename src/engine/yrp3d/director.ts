/**
 * **The 3D Bahamut's shot director** (the hidden 3D Bahamut chapter, FFX-2 only; `../ShotDirector.ts`): one beat, the one end-state frame C is for. When Bahamut opens **Mega Flare** (his finishing move, `research/ffx2-bahamut.md`
 * section 2: the loop's twelfth action, after five countdown turns), the camera takes the scene's `overdrive` rig: behind and above the trio, wide, the girls low in the frame and Bahamut rearing over them (`./layout.ts` `RIGS`).
 * Every other beat is `BattleMoments`' own (the handler is absent, so the answer is "not taken"), and a fight that never reaches Mega Flare plays exactly Chapter IV's camera grammar on frame A's rigs.
 *
 * **What counts as Mega Flare** is read from the data, never invented: the action's ability id is the engine's `mega-flare` (`battle/ffx2/abilities-core.ts`, the id Bahamut's script submits) or the data row's
 * `x2-bahamut-mega-flare` (`data/ffx2/enemies/bahamut-abilities.ts`; the spell-effect table keys both for FFX-2, `engine/spellfx/SpellFxSpecials.ts`), and the actor is Bahamut. `tests/unit/yrp3d/director.test.ts` pins both
 * ids against those tables and drives the director with the presenter's fakes.
 *
 * At `'skip'` speed the camera snaps (as `BattleMoments` does); otherwise the move is awaited (the beat goes on when the camera has arrived, so Mega Flare fires into the shot, not before it) and answers "taken" either way.
 * Pure types: no `three`, no DOM. Game case: FFX-2 only (FFX's Bahamut is a different model in a different chapter).
 */

import type { ActionShot, ShotAnswer, ShotDirector } from '../ShotDirector.ts';
import { YRP_BOSS_ID } from './layout.ts';

/** The ability ids that are Bahamut's Mega Flare. */
export const MEGA_FLARE_IDS: readonly string[] = ['mega-flare', 'x2-bahamut-mega-flare'];

/** The rig name frame C's camera is published under (`./layout.ts` `RIGS`). */
export const OVERDRIVE_RIG = 'overdrive';

/** The ms the camera takes to reach the overdrive shot at normal speed. */
export const OVERDRIVE_MOVE_MS = 900;

/** Is this action Bahamut's Mega Flare? */
export function isMegaFlare(ctx: Pick<ActionShot, 'actor' | 'action'>): boolean {
  const id = ctx.action.abilityId;
  return ctx.actor.id === YRP_BOSS_ID && id !== undefined && MEGA_FLARE_IDS.includes(id);
}

/** The director the scene publishes (`SceneStaging.shotDirector`). */
export const YRP_SHOT_DIRECTOR: ShotDirector = {
  actionOpen(ctx: ActionShot): ShotAnswer {
    if (!isMegaFlare(ctx)) return false;
    if (ctx.skipping) {
      ctx.camera.snapTo(OVERDRIVE_RIG);
      return true;
    }
    return ctx.camera.moveTo(OVERDRIVE_RIG, ctx.ms(OVERDRIVE_MOVE_MS)).then(() => true);
  },
};
