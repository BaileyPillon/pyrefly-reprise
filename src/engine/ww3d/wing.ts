/**
 * **Valefor's wing flap, in the vertex shader** (the hidden Wind Waker chapter; FFX-2 only): ported from the look lab's `js/wing.mjs`. Her file is one static mesh (no skeleton, no clips), so the wings are bent about a
 * shoulder pivot in the vertex program (a patch on the toon material, `./toon.ts`, and on the shadow's depth material, so the cast shadow flaps too):
 *
 * - vertices farther than `start` from the body's centre line (`cx`) bend about the shoulder pivot (`cx`, `pivotY`), a rotation about the body's forward axis, weighted by a smoothstep from `start` to `full` of the distance
 *   (the wings are fused into the shoulder armour as one island) and gated by a smoothstep on height so the tail and the legs stay put;
 * - the angle is `side * weight * amplitude * sin(phase)`: both wings rise and fall together;
 * - the slow body bob is a group offset in the model (`./model.ts`), not in the shader.
 *
 * Model units are the file's (metres as exported: 3.5 tall, 6.6 span, facing +Z, base at y 0, origin between the claws; the body centre line is x 0.03). **A faster flap for every Valefor action** (Bailey's brief): the phase advances
 * `RATE_ACTIVE` times faster and the amplitude grows by `AMP_ACTIVE` as her activity rises, 0 at rest to 1 in an action.
 *
 * {@link wingBend} is the same maths in JS (a test reads it). Needs three.js only. Game case: FFX-2 only.
 */

import { MathUtils, MeshDepthMaterial, RGBADepthPacking, Vector4, type IUniform } from 'three';
import type { ShaderLike } from './toon.ts';

/**
 * The measured shape of the file, `valefor-v2.glb` (2026-10-21; the look lab's numbers were measured on the first file, whose wings were uneven): even wings about the body line x = 0.03; the body is under 0.7 m
 * from that line at every height; the wings begin at y 1.25, are widest (x -3.28 to 3.34) at y 2.25 and are gone by y 3.0, where the head and its crest (|x| under 0.35) stand to y 3.5. The shoulder pivot is at the wings' mid
 * height, 2.1.
 */
export const WING: WingShape = { cx: 0.03, start: 0.6, full: 2.2, yLo: 1.0, pivotY: 2.1, ampDeg: 25, hz: 0.6 };

/** The shape numbers of a Valefor file (its own units): the body's centre line, where the bend starts and is full (distance from it), the height under which nothing bends, the shoulder pivot's height, the flap's amplitude (degrees) and rate (Hz). */
export interface WingShape {
  readonly cx: number;
  readonly start: number;
  readonly full: number;
  readonly yLo: number;
  readonly pivotY: number;
  readonly ampDeg: number;
  readonly hz: number;
}

/** How much faster and how much wider the flap goes at full activity (an action of hers), as multiples of the rest values. */
export const RATE_ACTIVE = 2.4;
export const AMP_ACTIVE = 0.3;

export interface WingUniforms {
  /** x body centre line, y bend starts at this distance, z bend is full at this distance, w height gate. */
  uBoss: IUniform<Vector4>;
  /** x amplitude (rad), y phase (rad, set per frame), z shoulder pivot height. */
  uWing: IUniform<Vector4>;
  [name: string]: IUniform;
}

export function createWingUniforms(w: WingShape = WING): WingUniforms {
  return {
    uBoss: { value: new Vector4(w.cx, w.start, w.full, w.yLo) },
    uWing: { value: new Vector4(MathUtils.degToRad(w.ampDeg), 0, w.pivotY, 0) },
  };
}

/** The flap's phase and amplitude at activity `a` (0 at rest to 1 in an action), advanced by `dt`: returns the new phase. */
export function advanceFlap(wu: WingUniforms, dt: number, activity: number, w: WingShape = WING): number {
  const a = Math.min(1, Math.max(0, activity));
  const phase = wu.uWing.value.y + dt * Math.PI * 2 * w.hz * (1 + (RATE_ACTIVE - 1) * a);
  wu.uWing.value.y = phase % (Math.PI * 2);
  wu.uWing.value.x = MathUtils.degToRad(w.ampDeg) * (1 + AMP_ACTIVE * a);
  return wu.uWing.value.y;
}

export const WING_VERT = /* glsl */ `
uniform vec4 uBoss;   // x body centre line, y bend starts at this distance, z bend is full at this distance, w height gate
uniform vec4 uWing;   // x amplitude (rad), y phase (rad, set per frame), z shoulder pivot height

float wfAngle( vec3 p ) {

	float dx = p.x - uBoss.x;
	float w = smoothstep( uBoss.y, uBoss.z, abs( dx ) ) * smoothstep( uBoss.w, uBoss.w + 0.6, p.y );
	return sign( dx ) * w * uWing.x * sin( uWing.y );

}

vec3 wfBend( vec3 p ) {

	float a = wfAngle( p );
	float c = cos( a );
	float s = sin( a );
	vec2 q = vec2( p.x - uBoss.x, p.y - uWing.z );
	return vec3( uBoss.x + q.x * c - q.y * s, uWing.z + q.x * s + q.y * c, p.z );

}

vec3 wfBendNormal( vec3 p, vec3 n ) {

	float a = wfAngle( p );
	float c = cos( a );
	float s = sin( a );
	return vec3( n.x * c - n.y * s, n.x * s + n.y * c, n.z );

}
`;

/** Patch a program's vertex shader (pure string work). `withNormal` is true for the toon material (it has a normal to rotate); the depth material has none. */
export function patchWingVertex(shader: ShaderLike, wu: WingUniforms, withNormal: boolean): { ok: boolean; problems: string[] } {
  const problems: string[] = [];
  let v = shader.vertexShader;
  const after = (include: string, extra: string): void => {
    if (!v.includes(include)) {
      problems.push(`missing ${include}`);
      return;
    }
    v = v.replace(include, () => `${include}\n${extra}`);
  };
  after('#include <common>', WING_VERT);
  after('#include <begin_vertex>', 'transformed = wfBend( position );');
  if (withNormal) after('#include <beginnormal_vertex>', 'objectNormal = wfBendNormal( position, objectNormal );');
  if (problems.length === 0) {
    shader.vertexShader = v;
    Object.assign(shader.uniforms, wu);
  }
  return { ok: problems.length === 0, problems };
}

/** The depth material the shadow pass uses for Valefor, so her cast shadow flaps with her wings. */
export function makeWingDepthMaterial(wu: WingUniforms): MeshDepthMaterial {
  const m = new MeshDepthMaterial({ depthPacking: RGBADepthPacking });
  m.onBeforeCompile = (shader): void => {
    const r = patchWingVertex(shader as unknown as ShaderLike, wu, false);
    if (!r.ok) console.error(`[ww3d] wing depth patch failed: ${r.problems.join('; ')}`);
  };
  m.customProgramCacheKey = (): string => 'ww-wing-depth-v1';
  return m;
}

/** The same maths in JS: where the vertex `p` goes at the uniforms' state, with the angle and the weight (a test reads it; handy for reasoning about the pose). */
export function wingBend(p: { x: number; y: number; z: number }, wu: WingUniforms): { x: number; y: number; z: number; angle: number; weight: number } {
  const { x: cx, y: start, z: full, w: yLo } = wu.uBoss.value;
  const { x: amp, y: phase, z: pivotY } = wu.uWing.value;
  const ss = (a: number, b: number, x: number): number => {
    const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
    return t * t * (3 - 2 * t);
  };
  const dx = p.x - cx;
  const weight = ss(start, full, Math.abs(dx)) * ss(yLo, yLo + 0.6, p.y);
  const angle = Math.sign(dx) * weight * amp * Math.sin(phase);
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  const qx = p.x - cx;
  const qy = p.y - pivotY;
  return { x: cx + qx * c - qy * s, y: pivotY + qx * s + qy * c, z: p.z, angle, weight };
}
