/**
 * The look's writes to the bloom and to the stock tilt-shift, moved out of `LookRig.frame` (the rig stays under the house size) and with one addition (lane "perf-trim", 2026-10-23): the two stock
 * tilt-shift passes are SWITCHED OFF while they would only copy the frame. A look that draws its own mask-aware blur sets the stock passes' blur to 0 (`LookConfig`: `tiltMaxBlur: 0` in all three
 * looks), and the tilt-shift shader returns its input unchanged for a radius under 0.05 px, so each pass was a full-frame read and write (two of them at 2560x1440) that changed nothing: skipping them
 * gives the same pixels (the composer then hands the previous pass's buffer to the next). Both games (shared plumbing).
 */
import { Vector2, Vector3 } from 'three';
import type { Renderer } from '../Renderer.ts';
import type { LookParams } from './LookConfig.ts';

/** A measuring switch (`__pyrefly.govern.tilt(false)`, the cost harness): false runs the two copy-only passes as r63-int did, so the saving can be measured in the same session. True always in play. */
export const lookTrim = { tilt: true };

/** The tilt-shift shader's own cut-off: a radius under this is a plain copy (`TiltShiftShader.ts`). */
export const TILT_COPY_PX = 0.05;

export interface LookPostInput {
  p: LookParams;
  /** The look's value for a table path (a live tweak, the pro arena's number, or the table's). */
  v(path: string): number;
  W: number;
  H: number;
  /** The mask-aware blur is drawing this frame, and the band it was given. */
  useBlur: boolean;
  focus: number;
  band: number;
  /** The scene palette's own stock blur, for the quality that cannot afford the look's. */
  paletteMaxBlur: number | undefined;
}

export function applyLookPost(r: Renderer, i: LookPostInput): void {
  const { p, v } = i;
  const bloom = r.bloomPass.materialHighPassFilter.uniforms;
  bloom['selective']!.value = p.bloom.selective ? 1 : 0;
  bloom['smoothWidth']!.value = p.bloom.selective ? 0.3 : 0.15;
  bloom['whiteDamp']!.value = 0.3;
  (bloom['bloomTint']!.value as Vector3).set(...p.bloom.tint);
  (bloom['uTexel']!.value as Vector2).set(1 / Math.max(1, i.W), 1 / Math.max(1, i.H));
  bloom['figureMask']!.value = 1;
  const stock = !i.useBlur && (p.blur.far > 0 || p.blur.near > 0);
  const maxBlur = stock ? (i.paletteMaxBlur ?? 6) : p.tiltMaxBlur;
  r.applyPost({
    bloomThreshold: v('bloom.threshold'),
    bloomStrength: v('bloom.strength'),
    bloomRadius: v('bloom.radius'),
    tiltMaxBlur: maxBlur,
    ...(i.useBlur ? { tiltFocus: i.focus, tiltBandWidth: i.band } : {}),
  });
  r.tiltH.enabled = r.tiltV.enabled = maxBlur >= TILT_COPY_PX || !lookTrim.tilt; // a pass that only copies is not run
}

/** The look is off or left the room: the stock tilt-shift passes run as they always did. */
export function restoreTilt(r: Renderer): void {
  r.tiltH.enabled = r.tiltV.enabled = true;
}
