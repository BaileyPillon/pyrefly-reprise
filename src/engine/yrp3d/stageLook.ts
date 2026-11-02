/**
 * **The real-models stage's look** (the hidden 3D Bahamut chapter, the real-models branch `exp-yrp-real`; FFX-2 only): what the scene does to Chapter IV's chamber so the figures read clearly in it and the frame is not under
 * Chapter IV's grade. It came over from the look lab's stage (branch `exp-yrp-3d`) without its toon material, its ink and its stepped motion: the real models keep their own shading and play their own motion at full rate. Applied
 * only when the models are on (`?yrp=painted` keeps Chapter IV's room as it was).
 *
 * - **The floor.** Chapter IV's machina deck and its reflection sheet are hidden; the wet tile floor (`./wetFloor.ts`) takes their place: dark tiles, the backdrop's lantern streaks, the figures reflected (lit: the rig's lights are on
 *   the figure layer, `./rig.ts`).
 * - **The backdrop layer.** Everything under the Backdrop's group is put on `LAYER.backdrop` as well as the default layer, so the floor can draw the painting alone for its streaks.
 * - **The contact shadows.** A soft disc under each figure (`./contact.ts`), following it as the presenter moves it.
 * - **The grade** ({@link YRP_PALETTE}). The game's chain ends in a grade that never encodes sRGB, so every painting is shown with its gamma applied twice and Chapter IV's grade was tuned around that (an exposure of 1.26, lifted
 *   shadows, a strong bloom and a tilt-shift): Bailey called the first in-game stage "very dark with heavy post-processing". This chapter's palette is neutral and **encodes**: a gamma of 2.2 turns the linear backdrop, floor and
 *   figures into what the studio's "Standard" view shows (the figures' light numbers are the studio's, `./look.ts`), no lift, no split tone, no tilt-shift, a faint vignette and a faint bloom.
 *
 * Needs three.js; no DOM. Game case: FFX-2 only.
 */

import type { Group, Object3D, Texture } from 'three';
import type { ScenePalette } from '../Renderer.ts';
import { ContactShadows } from './contact.ts';
import { makeGrainTexture } from './grain.ts';
import { LAYER } from './look.ts';
import { WetFloor } from './wetFloor.ts';
import type { YrpId } from './layout.ts';
import type { YrpModel } from './model.ts';

/** The names of Chapter IV's floor objects this chapter replaces. */
export const HIDDEN_DECK = ['machina-deck', 'deck-reflections'] as const;

/** This chapter's grade: neutral, and it encodes (gamma 2.2 is the sRGB curve to within a few percent). Exposure is not used (the chain has no tone mapping). */
export const YRP_PALETTE: ScenePalette = {
  name: 'exp-yrp-3d',
  lift: [0, 0, 0],
  gamma: [2.2, 2.2, 2.2],
  gain: [1, 1, 1],
  saturation: 1,
  vignette: 0.12,
  vignetteRadius: 0.8,
  shadowTintAmount: 0,
  grain: 0,
  exposure: 1,
  bloomThreshold: 0.94,
  bloomStrength: 0.16,
  bloomRadius: 0.5,
  tiltMaxBlur: 0,
  figureBloomMask: 1,
};

/** What the stage look made, and how to move it with the figures and free it. */
export interface YrpStage {
  readonly palette: ScenePalette;
  readonly floor: WetFloor;
  readonly contact: ContactShadows;
  /** Once a frame: put each figure's contact disc under it. */
  follow(models: ReadonlyMap<YrpId, YrpModel>): void;
  dispose(): void;
}

/** Put every object under `root` on `layer` as well as the layers it is on. */
export function putOnLayer(root: Object3D, layer: number): void {
  root.traverse((o) => o.layers.enable(layer));
}

/** Apply the stage look to the chamber `group` (Chapter IV's scene group) whose painting is `backdrop`'s group, for the figures `ids`. */
export function applyStage(group: Group, backdrop: Object3D, ids: readonly YrpId[]): YrpStage {
  const hidden: Array<[Object3D, boolean]> = [];
  for (const name of HIDDEN_DECK) {
    const o = group.getObjectByName(name);
    if (o) {
      hidden.push([o, o.visible]);
      o.visible = false;
    }
  }
  putOnLayer(backdrop, LAYER.backdrop);
  const grain: Texture = makeGrainTexture();
  const floor = new WetFloor(grain);
  const contact = new ContactShadows(group, ids);
  group.add(floor.mesh);
  return {
    palette: { ...YRP_PALETTE },
    floor,
    contact,
    follow(models): void {
      for (const id of ids) {
        const m = models.get(id);
        if (m) contact.follow(id, m.root, m.height, m.opacity);
      }
    },
    dispose(): void {
      floor.dispose();
      grain.dispose();
      contact.dispose();
      for (const [o, was] of hidden) o.visible = was;
    },
  };
}
