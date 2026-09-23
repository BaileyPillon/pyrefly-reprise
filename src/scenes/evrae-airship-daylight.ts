/**
 * **The Fahrenheit's deck in B's daylight, not at dusk.**
 *
 * Game case: FFX only [AGENTS.md rule 14]; see `evrae-airship-range.ts`.
 *
 * Bailey approved backdrop B (`docs/concepts/chapters/evrae/renders/backdrop-b.png`,
 * installed byte-identical as the deck plate): a steel-blue daylight sky, white
 * cumulus lit peach-white on its tops, a blue-steel hull. The judge's note on the
 * first in-game frames: the scene graded B "to a dusk salmon and navy". Measured
 * 2026-09-23 (fix10c): even with the scene's grade set neutral the plate still
 * rendered navy and salmon, so the grade was not the cause. The composer's last
 * pass (`GradeShader`) writes its linear working values straight to the canvas
 * with no linear-to-sRGB encode, so an sRGB-decoded painting comes out as if its
 * gamma were applied twice: darker, more saturated, warm highlights pushed to
 * salmon. That is a **global** property of the renderer (every chapter's plate
 * and figure is drawn through it and was judged through it), so it is not
 * changed here; it is written up for Bailey instead.
 *
 * What this scene does, locally: the plate is sampled **without** the sRGB
 * decode (`NoColorSpace`), so the pixels that reach the canvas are B's own; and
 * the rig, the fog and the moving air are re-keyed to the colours measured on B
 * (`EVRAE_DAYLIGHT`, medians of the named regions of the 2688x1536 file).
 */

import { Color, Mesh, MeshBasicMaterial, NoColorSpace, type Object3D } from 'three';
import type { LightRig } from '../engine/Lighting.ts';

/**
 * Colours measured on `backdrop-b.png` (median of each region, fractions of the
 * frame): sky upper left (0-0.15 h, 0-0.2 w) #324f6e; sky left middle #3f5474;
 * cloud tops (0.25-0.45 h, 0.15-0.35 w) #ecd0c5; cloud in shade (lower right)
 * #637486; the cloud sea under the hull (lower left) #525f75.
 */
export const EVRAE_DAYLIGHT = {
  sky: 0x324f6e,
  skyMid: 0x3f5474,
  cloudLit: 0xecd0c5,
  cloudShade: 0x637486,
  cloudSea: 0x525f75,
  /** The background clear colour behind the plate's edges: B's sky. */
  background: 0x324f6e,
} as const;

/** Name of the plate mesh `Backdrop.create` builds (`src/engine/Backdrop.ts`). */
const PLATE = 'backdrop-painting';

/**
 * Sample the plate as authored: its texture skips the sRGB decode, so the
 * un-encoded output shows B's own pixels. Returns true when the plate was found.
 * Idempotent; call again after the dev watcher swaps the backdrop.
 */
export function showPlateAsPainted(root: Object3D): boolean {
  let found = false;
  root.traverse((o) => {
    if (o.name !== PLATE || !(o instanceof Mesh)) return;
    const mat = o.material as MeshBasicMaterial;
    const map = mat.map;
    if (!map) return;
    found = true;
    if (map.colorSpace === NoColorSpace) return;
    map.colorSpace = NoColorSpace;
    map.needsUpdate = true;
    mat.needsUpdate = true;
  });
  return found;
}

/**
 * The hemisphere fill and the rim, re-keyed to B: the sky above is B's blue,
 * the bounce from below is the lit cloud sea, the rim is the cloud tops.
 */
export function applyDaylightFill(lights: LightRig): void {
  lights.fill.color.set(new Color(EVRAE_DAYLIGHT.skyMid).lerp(new Color(0xffffff), 0.35));
  lights.fill.groundColor.set(new Color(EVRAE_DAYLIGHT.cloudSea).lerp(new Color(EVRAE_DAYLIGHT.cloudLit), 0.4));
  lights.fill.intensity = 1.15;
  lights.rim.color.set(new Color(EVRAE_DAYLIGHT.cloudLit).lerp(new Color(0xffffff), 0.4));
}
