/**
 * **The temple's textures as one swappable set** (the hidden Wind Waker chapter; FFX-2 only): the stage asks for its pictures through {@link StageTextures}, and the default draws them on a canvas
 * (`./stageTextures.ts`, `./stageTextures2.ts`). A test hands blank textures instead, so the stage's structure (what it builds, what a swapped piece replaces) can be checked in Node with no DOM.
 */

import type { Texture } from 'three';
import { cloudTexture, flameTexture, leafTexture, shaftTexture, skyTexture, waterfallTexture } from './stageTextures.ts';
import { blockWallTexture, doorTexture, panelTexture, sandTexture, type PanelKind } from './stageTextures2.ts';

export interface StageTextures {
  cloud(seed: number): Texture;
  flame(): Texture;
  sky(): Texture;
  leaf(): Texture;
  shaft(): Texture;
  waterfall(): Texture;
  blockWall(seed: number, repeat: readonly [number, number], base?: readonly [number, number, number], rows?: number): Texture;
  panel(kind: PanelKind): Texture;
  door(): Texture;
  sand(seed: number, repeat: readonly [number, number]): Texture;
}

/** The pictures drawn on a 2D canvas (needs a DOM). */
export const canvasTextures: StageTextures = {
  cloud: cloudTexture,
  flame: flameTexture,
  sky: skyTexture,
  leaf: leafTexture,
  shaft: shaftTexture,
  waterfall: waterfallTexture,
  blockWall: blockWallTexture,
  panel: panelTexture,
  door: doorTexture,
  sand: sandTexture,
};
