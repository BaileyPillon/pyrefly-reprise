/**
 * Glue between the painted stage and its {@link SpellFxLayer}: rectangles
 * relative to the canvas, the canvas's CSS size, and the renderer overlay the
 * layer draws through. Kept out of `BattlePresenterStage.ts`, which is already
 * past the house line cap.
 */

import type { WebGLRenderer } from 'three';
import type { FlashParams, FxQuality } from './SpellFxParams.ts';
import type { FxGame } from './SpellFxRegistry.ts';
import { SpellFxLayer, type SpellFxLayerOptions } from './SpellFxLayer.ts';

export interface StageSpellFxOptions {
  game?: FxGame | undefined;
  canvas: HTMLCanvasElement;
  /** The stage's `projectRect`: page CSS pixels. */
  projectRect(id: string): { x: number; y: number; w: number; h: number } | null;
  /** `Renderer.addOverlay`; without it the layer resolves effects but never draws. */
  overlay?: ((draw: (renderer: WebGLRenderer) => void) => () => void) | undefined;
  quality?: (() => FxQuality) | undefined;
  flash?: (() => Readonly<FlashParams>) | undefined;
  /** The effect clock's rate (the playback speed, `SpellFxSpecials.SPEED_RATE`). */
  rate?: (() => number) | undefined;
  /** A blow's landing inside a drawn effect (FF7's hit flash, shake and flash frame). */
  onLand?: SpellFxLayerOptions['onLand'] | undefined;
  /** Where the effects may draw (FF7: under its message window). */
  clip?: SpellFxLayerOptions['clip'] | undefined;
}

/** The layer, hooked to the renderer. Call the returned `unhook` on dispose. */
export function stageSpellFx(o: StageSpellFxOptions): { layer: SpellFxLayer; unhook: () => void } {
  const layer = new SpellFxLayer({
    game: o.game ?? 'ffx',
    rectOf: (id) => {
      const r = o.projectRect(id);
      if (!r) return null;
      const c = o.canvas.getBoundingClientRect();
      return { x: r.x - c.left, y: r.y - c.top, w: r.w, h: r.h };
    },
    view: () => ({ w: o.canvas.clientWidth || 1600, h: o.canvas.clientHeight || 900 }),
    ...(o.quality ? { quality: o.quality } : {}),
    ...(o.flash ? { flash: o.flash } : {}),
    ...(o.rate ? { rate: o.rate } : {}),
    ...(o.onLand ? { onLand: o.onLand } : {}),
    ...(o.clip ? { clip: o.clip } : {}),
  });
  const unhook = o.overlay?.((renderer) => layer.render(renderer)) ?? (() => undefined);
  if (o.overlay && layer.quality !== 'low') layer.prepare();
  return { layer, unhook };
}
