/**
 * RETIRED — the pixel-art path.
 *
 * The game renders painted 2.5D (`src/engine/PaintedActor.ts`, backdrops and
 * character PNGs generated through `docs/ART-PIPELINE.md`). Nothing here is
 * reachable from `src/main.ts`; `node tools/orphans.mjs` lists this file as an
 * orphan by design. Kept for reference only — do not extend it, and do not
 * build new work against it.
 */
/**
 * Browser adapter: rasters -> canvases the engine can hand to `SpriteActor`.
 *
 * This is the only file in `src/sprites/` that touches the DOM. Keep sprite
 * data and `raster.ts` free of it so the node preview tool can load them.
 */

import type { SpriteActorOptions } from '../engine/SpriteActor.ts';
import { stateDurations, type SpriteDef } from './format.ts';
import { rasterize, scaleRaster, type Raster } from './raster.ts';

/** Wrap a raster in a canvas. `scale` nearest-neighbour upscales (previews only). */
export function toCanvas(raster: Raster, scale = 1): HTMLCanvasElement {
  const r = scale > 1 ? scaleRaster(raster, scale) : raster;
  const canvas = document.createElement('canvas');
  canvas.width = r.width;
  canvas.height = r.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('sprites: 2D canvas context unavailable');
  ctx.imageSmoothingEnabled = false;
  const img = ctx.createImageData(r.width, r.height);
  img.data.set(r.data);
  ctx.putImageData(img, 0, 0);
  return canvas;
}

/**
 * Rasterise every state of a sprite into canvases.
 *
 * The return value is exactly the first argument of `SpriteActor.fromCanvases`.
 */
export function buildActorFrames(def: SpriteDef): Record<string, HTMLCanvasElement[]> {
  const out: Record<string, HTMLCanvasElement[]> = {};
  for (const [state, frames] of Object.entries(def.states)) {
    if (!frames.length) continue;
    out[state] = frames.map((f) => toCanvas(rasterize(def, f)));
  }
  return out;
}

/** State name -> per-frame durations in ms, index-aligned with the frame list. */
export function buildFrameDurations(def: SpriteDef): Record<string, number[]> {
  const out: Record<string, number[]> = {};
  for (const state of Object.keys(def.states)) out[state] = stateDurations(def, state);
  return out;
}

/**
 * Everything `SpriteActor.fromCanvases(frames, options)` needs, derived from the
 * sprite definition: per-state durations, loop/next hints and the initial state.
 *
 * ```ts
 * const { frames, options } = buildSpriteActorInput(tidus);
 * const actor = SpriteActor.fromCanvases(frames, { ...options, name: 'tidus' });
 * ```
 */
export function buildSpriteActorInput(def: SpriteDef): {
  frames: Record<string, HTMLCanvasElement[]>;
  durations: Record<string, number[]>;
  options: SpriteActorOptions;
} {
  const frames = buildActorFrames(def);
  const durations = buildFrameDurations(def);
  const states: NonNullable<SpriteActorOptions['states']> = {};
  for (const state of Object.keys(frames)) {
    const hints = def.stateOptions?.[state];
    states[state] = {
      durations: durations[state] ?? [],
      loop: hints?.loop !== false,
      ...(hints?.next ? { next: hints.next } : {}),
    };
  }
  return {
    frames,
    durations,
    options: {
      name: def.name,
      anchor: 'feet',
      // Rows of empty canvas under the sprite's feet line; without this the
      // actor floats by that many logical pixels.
      anchorOffsetPx: Math.max(0, def.size[1] - def.anchor[1]),
      initialState: def.defaultState,
      states,
    },
  };
}
