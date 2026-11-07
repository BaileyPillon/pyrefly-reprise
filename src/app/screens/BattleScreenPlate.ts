/**
 * **A link fought on another plate of the scene** (`EnemyGroupDef.plate`): the white pulse that covers the cut and the swap of the painting plane under it. Taken out of `BattleScreenEncounter.onLink` so the rule
 * can be run without a screen. Shared plumbing: **both games**, but only the chapters whose groups name a plate ever reach it (Sinspawn Gui, the Mirror Aeons, the Dark Aeons, the Flooded Ways: FFX only today).
 *
 * A scene that reports the plate showing now (`LoadedScene.plateKey`, only the Via Purifico stage of the Flooded Ways) is neither pulsed nor swapped for a link that names that plate: the chapter's first area opens on
 * its own plate, so the pulse and the rebuild of the painting plane changed nothing a player could see but a white flash. A retry from a later link builds a fresh scene on the opening plate, so that link still swaps.
 * Every other scene has no `plateKey`, and flashes and swaps for every plate a link names, exactly as before.
 */

import type { EnemyGroupDef } from '../../battle/common/types.ts';
import type { LoadedScene } from '../../scenes/index.ts';

/** The pulse takes this long, ms (the same as it did inline). */
export const PLATE_PULSE_MS = 900;

/** The HUD half of the swap: a fresh fight's HUD is taken off the screen under the pulse and put back once the plate is in. */
export interface PlateHud {
  setVisible(visible: boolean): void;
}

export interface LinkPlateInput {
  scene: Pick<LoadedScene, 'swapBackdrop' | 'plateKey'> | null | undefined;
  stage: { screenFlash(colour: string, ms: number): void } | null | undefined;
  hud: PlateHud | null | undefined;
  group: Pick<EnemyGroupDef, 'plate' | 'restoresAeonsOnEntry'>;
}

/** Whether a link that names `plate` owes the pulse and the swap on this scene. */
export function linkPlateOwed(scene: LinkPlateInput['scene'], plate: string | undefined): boolean {
  if (!plate || !scene?.swapBackdrop) return false;
  return scene.plateKey?.() !== plate;
}

/**
 * Pulse and swap for this link's plate when it owes one. Returns whether it did. The swap runs in the background (the caller does not wait on it), as it always has.
 */
export function swapLinkPlate({ scene, stage, hud, group }: LinkPlateInput): boolean {
  const plate = group.plate;
  if (!plate || !scene?.swapBackdrop || !linkPlateOwed(scene, plate)) return false;
  stage?.screenFlash('#ffffff', PLATE_PULSE_MS);
  // A link that is a fresh fight (the Mirror Aeons chapter's cavern: the party and the aeons are restored on entry) does not show the road's HUD under the cut: it is taken off the screen now and put
  // back, rebuilt for the new fight, once the plate has swapped under the white pulse. Only the chapters whose links set `restoresAeonsOnEntry` (the Mirror Aeons' cavern, the Dark Aeons) do.
  const fresh = group.restoresAeonsOnEntry === true ? hud : null;
  fresh?.setVisible(false);
  void scene.swapBackdrop(plate).finally(() => fresh?.setVisible(true));
  return true;
}
