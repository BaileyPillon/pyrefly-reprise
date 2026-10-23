/**
 * THE PRO ARENA'S TERMS ON THE RIG (conference demo, lane "pro-look"): the two things `LookRig.frame` writes for the pro arena, moved out of the rig so the rig stays under the house size (review m1,
 * 2026-10-23: `LookRig.ts` had grown from 399 to 452 lines): the grade pass's haze / vignette / grain terms of the room's table (`ProGrade.ts`) and the cone of light (`LookBoldShader.ts` term "4c").
 * Both only run while the pro arena is the chapter's look (`lookState.pro`); with it off the rig never calls them but to switch the cone to strength 0.
 *
 * Game case: both games' plumbing; the table says which arena (Chapter I Gagazet FFX, Chapter IV Bevelle FFX-2).
 */
import type { Camera, Vector2, Vector3, Vector4 } from 'three';
import type { ProRoom } from './ProGrade.ts';

/** The grade pass's uniform cells, as the rig holds them. */
type Cells = Record<string, { value: unknown }>;

/** The room's haze veil, vignette and grain over the stock grade (the book's regrade terms; the grade pass carries them all already). A live tweak (`grade.vignetteAbs`, `grade.vignetteRadius`, `grade.grain`) wins. */
export function applyProGrade(g: Cells, pr: ProRoom, tweaks: Readonly<Record<string, number | undefined>>): void {
  (g['hazeColor']!.value as Vector3).set(...pr.haze.colour);
  (g['hazeAmount']!.value as Vector3).set(...pr.haze.amounts);
  g['hazeSide']!.value = pr.haze.side;
  g['vignette']!.value = tweaks['grade.vignetteAbs'] ?? pr.vignette.amount;
  g['vignetteRadius']!.value = tweaks['grade.vignetteRadius'] ?? pr.vignette.radius;
  (g['vignetteTint']!.value as Vector3).set(...pr.vignette.tint);
  g['grain']!.value = tweaks['grade.grain'] ?? pr.grain;
}

/** What the cone needs beyond the room's table: the frame's light, its aspect, the clock, the live strength tweak and a way to find a painted point on screen. */
export interface ConeInput {
  lightUv: Vector2;
  aspect: number;
  time: number;
  k: number;
  camera: Camera;
  scratch: Vector2;
  project: (camera: Camera, out: Vector2, at: { u: number; v: number }) => void;
}

/** The arena's cone of light into the bold pass: the room's light (or a fixed frame point, or a painted point that moves with the camera), the colour times the strength, the drift's clock. No cone = strength 0. */
export function applyProCone(g: Cells, pr: ProRoom | undefined, i: ConeInput): void {
  const c = pr?.cone;
  if (!c) {
    (g['uConeCol']!.value as Vector4).w = 0;
    return;
  }
  let cu = c.follow ? i.lightUv.x : c.u;
  let cv = c.follow ? i.lightUv.y : c.v;
  if (c.paint) {
    i.project(i.camera, i.scratch, c.paint); // anchored to the painting: it moves with the camera
    cu = i.scratch.x;
    cv = i.scratch.y;
  }
  (g['uCone']!.value as Vector4).set(cu, cv, c.spread, c.reach);
  (g['uConeCol']!.value as Vector4).set(c.colour[0], c.colour[1], c.colour[2], c.strength * i.k);
  (g['uConeP']!.value as Vector3).set(c.rays, i.time, i.aspect);
}
