/**
 * The actor's module-level kit: the shared noise, blob and ring textures, the scratch vectors, the constants, and the global switch behind `__pyrefly.interimYaw(on)`.
 *
 * `PaintedActor` was one 2,700-line class. It is now a chain of classes, one responsibility each, every layer calling only the layers below it:
 * `PaintedActorState` (the fields that start at rest) -> `PaintedActorBase` (the other fields, the constructor) -> `PaintedActorPlacement` -> `PaintedActorSizing` -> `PaintedActorEffects` -> `PaintedActorLife` -> `PaintedActorPoses` -> `PaintedActorReaders` -> `PaintedActor`
 * (import that one from `PaintedActor.ts`). A pure move (ChatGPT's point 8b, 2026-10-28; both games): no method changed, only `private` became `protected` where a later layer reads it.
 * The constructor calls eight methods that live in later layers; `PaintedActorBase` declares them abstract.
 */

import { Color, Matrix4, Quaternion, Vector3, type Texture } from 'three';
import { paintedCanvasTexture } from './PaintedArt.ts';
import type { PoseScale } from './PaintedScale.ts';
import { LIE_FLAT_TILT } from './LieFlat.ts';
import { noiseCanvas, radialCanvas } from './ProceduralArt.ts';

/** A pose that has not been sized yet: 1x1, upright, no footprint. */
export const UNSIZED: PoseScale = {
  unitsPerPixel: 1,
  width: 1,
  height: 1,
  offsetY: 0.5,
  topY: 1,
  anchorY: 1,
  prone: false,
  footprint: 0,
  clamped: false,
  contentBox: { x0: -0.5, x1: 0.5, y0: 0, y1: 1 },
};

let sharedNoise: Texture | null = null;
export function noiseTexture(): Texture {
  if (!sharedNoise) sharedNoise = paintedCanvasTexture(noiseCanvas(256, 5, 5));
  return sharedNoise;
}

let sharedBlob: Texture | null = null;
export function blobTexture(): Texture {
  if (!sharedBlob) {
    sharedBlob = paintedCanvasTexture(
      radialCanvas(256, [
        [0, 0.95],
        [0.3, 0.6],
        [0.62, 0.2],
        [1, 0],
      ]),
    );
  }
  return sharedBlob;
}

let sharedRing: Texture | null = null;
/** The turn highlight: a soft annulus, brightest just inside its rim. */
export function ringTexture(): Texture {
  if (!sharedRing) {
    sharedRing = paintedCanvasTexture(
      radialCanvas(256, [
        [0, 0],
        [0.52, 0.04],
        [0.74, 0.34],
        [0.87, 0.95],
        [0.95, 0.3],
        [1, 0],
      ]),
    );
  }
  return sharedRing;
}

export const TAU = Math.PI * 2;
export const DEG2RAD = Math.PI / 180;
export const RAD2DEG = 180 / Math.PI;

/** How long the interim turn takes to settle, seconds. */
export const YAW_TAU = 0.18;

/**
 * The global A/B switch behind `window.__pyrefly.interimYaw(on)`.
 *
 * Module-level rather than per-actor on purpose: the toggle exists to compare
 * two captures of the *same staged field*, and every actor has to answer to it
 * on the same frame. Each actor keeps its own angle
 * ({@link PaintedActor.setInterimYaw}); this only says whether the angle is
 * being applied at all.
 */
export let interimYawOn = true;

/** Turn the interim yaw on or off for every painted actor on the field. */
export function setInterimYawEnabled(on: boolean): void {
  interimYawOn = on;
}

/** Whether the interim yaw is currently being applied. */
export function isInterimYawEnabled(): boolean {
  return interimYawOn;
}

/** Scratch for the per-frame camera azimuth. Read and dropped inside one call. */
export const yawScratchA = new Vector3();
export const yawScratchB = new Vector3();

/** Scratch for the head lock (D-510): a plane's local matrix, and the matrix that takes a head box to clip space. Read and dropped inside one call. */
export const lockLocal = new Matrix4();
export const lockMvp = new Matrix4();
export const lockPos = new Vector3();
export const lockScale = new Vector3();
export const lockQuat = new Quaternion();

/** Where a hit tints the painting for a moment — a warm, bruised red. */
export const HURT_TINT = 0xff9f8e;

/** How long the KO takes to tip over and hit the ground. */
export const FALL_MS = 300;
/** {@link PaintedActor.lieDown}'s roll: flat on the floor (1.5 left the head tilted up, Chapter VII e2e). */
export const LIE_ANGLE = Math.PI / 2;
/** ...then tipped back about its long axis flat onto the floor, face up (`LieFlat.ts`). */
export const LIE_TILT = LIE_FLAT_TILT;
/** What a petrified figure's painting is tinted toward ({@link PaintedActor.setStone}). */
export const STONE_TINT = new Color(0xb4afa6);

/** Stable per-name jitter so a party does not breathe, or cheer, in lockstep. */
export function beatOffsetFor(name: string): number {
  let h = 2166136261;
  for (let i = 0; i < name.length; i++) h = Math.imul(h ^ name.charCodeAt(i), 16777619);
  return ((h >>> 8) % 1000) / 1000;
}

export const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);
