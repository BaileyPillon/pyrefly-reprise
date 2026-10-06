import { fxDebugHooks } from '../fxDebugHooks.ts';

/**
 * Figure lighting MOCKUPS (branch `lighting-mockups`, never merged, never deployed): the three looks Bailey picks from, behind
 * a URL flag and off by default.
 *
 *   ?light=1   "Rim, wrap and glint": the backdrop's colour bleeds into each figure's edge, glints on the bright edge and a
 *              few hand-placed stars on blades and staves. No maps.
 *   ?light=2   "Lit by the room": look 1 plus a soft two-tone terminator from a normal map of each pose (Depth Anything V2
 *              Small, made by `tools/lighting/normals.py`, served in dev only), the shadow side in the room's own colour.
 *   ?light=3   "Satsuei" (the compositing stage of anime production): look 1 plus a top-to-feet gradient of the room's colour,
 *              a soft diffusion of the figure's own highlights and a glow behind each figure. No normals.
 *   ?lightk=n  the strength of all of it, 0 to 1 and over (default 1). 0 draws the very pixels the flag-off frame draws.
 *
 * Every look lights a painting at draw time; no painted pixel is stored or replaced. Presentation only (rule 1). Game case:
 * both (shared plumbing); each room carries its own light as data (`rooms.ts`), FFX's anamorphic streak and FFX-2's four-point
 * star follow `fx/a/sceneLooks.ts`'s split and are our choice (the research does not cover light on characters).
 */

export type LightMode = 0 | 1 | 2 | 3;

export interface LightState {
  mode: LightMode;
  strength: number;
  /** Capture-time overrides of the look's numbers (`__pyrefly.fx.light.tune({ wrap: 0.8 })`). */
  tune: Record<string, number>;
}

function fromUrl(): LightState {
  let mode: LightMode = 0;
  let strength = 1;
  try {
    const p = new URLSearchParams(globalThis.location?.search ?? '');
    const m = Number(p.get('light'));
    if (m === 1 || m === 2 || m === 3) mode = m;
    const k = p.get('lightk');
    if (k !== null && Number.isFinite(Number(k))) strength = Math.max(0, Number(k));
  } catch {
    // no location (a test): the look stays off
  }
  return { mode, strength, tune: {} };
}

/** The live state: read once from the URL, switched at run time by the debug API for captures. */
export const lightState: LightState = fromUrl();

/** Counters the driver writes, for `__pyrefly.fx.light.snapshot()`. */
export const lightStats = { figures: 0, slots: 0, normals: 0, domes: 0, stars: 0, halos: 0, updateMs: 0, frames: 0, room: '', rows: [] as string[] };

fxDebugHooks['light'] = {
  snapshot: () => ({ mode: lightState.mode, strength: lightState.strength, tune: { ...lightState.tune }, ...lightStats }),
  api: {
    /** `set({ mode: 2, strength: 1 })`: switch a look on a running battle (0 = off, the unpatched shader draws as before). */
    set: (s: { mode?: number; strength?: number }): void => {
      if (s.mode !== undefined) lightState.mode = (s.mode === 1 || s.mode === 2 || s.mode === 3 ? s.mode : 0) as LightMode;
      if (s.strength !== undefined) lightState.strength = Math.max(0, s.strength);
    },
    get: () => ({ mode: lightState.mode, strength: lightState.strength }),
    tune: (t: Record<string, number>): void => {
      for (const [k, v] of Object.entries(t)) {
        if (v === null || Number.isNaN(v)) delete lightState.tune[k];
        else lightState.tune[k] = v;
      }
    },
    clearTune: (): void => {
      lightState.tune = {};
    },
    snapshot: () => ({ ...lightStats }),
  },
};

/** One tuning number of the look, with a capture override. */
export function tuned(name: string, base: number): number {
  const v = lightState.tune[name];
  return v === undefined ? base : v;
}
