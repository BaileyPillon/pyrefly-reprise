/**
 * A-8, contact shadows that still read on a dark floor (both games; shared
 * `PaintedActor` plumbing). Until now every figure's blob was the same navy at
 * 0.48, which vanishes on the dark floors half the chapters stand on, and its
 * soft falloff put almost nothing right under the feet.
 *
 * - The blob's opacity follows the floor: the darker the ground, the stronger
 *   and blacker the blob, so the luma under the feet stays at least 12 % below
 *   the floor round it (the acceptance measure, taken in the browser).
 * - A tight foot-occlusion ellipse under each baseline, riding the blob (its
 *   child), so it hops, squashes, fades and follows a prone body with it.
 * - Hovering subjects keep no occlusion: their blob already shrinks with the
 *   lift (`PaintedActor`, "reads as levitation rather than as a mistake").
 *
 * The floor's colour comes from the scene's own `ground` mesh when it has one
 * (`Backdrop.ts` tints it from the painting's ground band); a scene without
 * one keeps today's blob. When the plan's `BackdropPalette.ground` export
 * reaches the stage it can be passed in its place (`groundLuma`).
 */

import { Mesh, type Material, type MeshBasicMaterial, type Object3D } from 'three';

export interface ContactShadowStyle {
  /** The blob's peak opacity. */
  opacity: number;
  /** The blob's colour. */
  color: number;
  /** The foot-occlusion ellipse's opacity, relative to the blob's. */
  occlusion: number;
}

/** Today's blob, for a floor of unknown colour. */
export const DEFAULT_SHADOW: Readonly<ContactShadowStyle> = Object.freeze({ opacity: 0.48, color: 0x050a14, occlusion: 0.9 });

/** Rec. 709 luma of a 0xRRGGBB colour, 0..1. */
export function lumaOf(hex: number): number {
  const r = ((hex >> 16) & 255) / 255;
  const g = ((hex >> 8) & 255) / 255;
  const b = (hex & 255) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * The blob for a floor of this luma: 0.48 navy on a bright floor (today),
 * rising to 0.78 near-black on a dark one. Ours; tuned in the browser.
 */
export function contactShadowStyle(groundLuma: number | null | undefined): ContactShadowStyle {
  if (groundLuma === null || groundLuma === undefined || !Number.isFinite(groundLuma)) return { ...DEFAULT_SHADOW };
  const dark = Math.max(0, Math.min(1, (0.45 - groundLuma) / 0.35));
  return {
    opacity: 0.48 + 0.3 * dark,
    color: dark > 0.5 ? 0x000000 : DEFAULT_SHADOW.color,
    occlusion: 0.9 + 0.1 * dark,
  };
}

/** The luma of the scene's `ground` mesh colour, or null when it has none. */
export function groundLumaOf(root: Object3D): number | null {
  const ground = root.getObjectByName('ground') as (Object3D & { material?: Material & { color?: { getHex(): number } } }) | undefined;
  const hex = ground?.material?.color?.getHex();
  return hex === undefined ? null : lumaOf(hex);
}

/** The ellipse's size against the blob: tight under the baseline. */
export const OCCLUSION_SCALE = { x: 0.42, y: 0.5 } as const;

/**
 * Add the foot-occlusion ellipse under `shadow` (the actor's blob). It is the
 * blob's child, so it follows its scale, position and squash; its opacity
 * follows the blob's every frame. Returns null for a figure with no blob.
 */
export function attachFootOcclusion(shadow: Mesh | null, style: ContactShadowStyle): Mesh | null {
  if (!shadow) return null;
  const parentMat = shadow.material as MeshBasicMaterial;
  const mat = parentMat.clone();
  const foot = new Mesh(shadow.geometry, mat);
  foot.name = 'foot-occlusion';
  foot.scale.set(OCCLUSION_SCALE.x, OCCLUSION_SCALE.y, 1);
  foot.position.z = 0.001;
  foot.renderOrder = shadow.renderOrder + 1;
  foot.onBeforeRender = () => {
    mat.opacity = Math.min(1, parentMat.opacity * style.occlusion);
  };
  mat.opacity = Math.min(1, parentMat.opacity * style.occlusion);
  shadow.add(foot);
  return foot;
}

/** Remove and free the ellipse (the blob's geometry is the actor's own, and stays). */
export function disposeFootOcclusion(shadow: Mesh | null): void {
  const foot = shadow?.getObjectByName('foot-occlusion') as Mesh | undefined;
  if (!foot) return;
  foot.removeFromParent();
  (foot.material as Material).dispose();
}
