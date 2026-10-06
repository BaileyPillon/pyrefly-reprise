import { AddEquation, CustomBlending, Mesh, OneFactor, PlaneGeometry, ShaderMaterial, SrcColorFactor, Vector4, ZeroFactor } from 'three';
import type { Backdrop } from '../engine/Backdrop.ts';

// ---------------------------------------------------------------------------
// Plate dim: one place on a painted plate held down, without touching the painting
// ---------------------------------------------------------------------------
//
// Game case: FFX-2 only in use (Chapter IV's Bahamut on the Bevelle plate, release 39.1, B6; the helper is plumbing).
//
// A soft ellipse on the painting's own plane multiplies what is already drawn there by `keep`, blending back to nothing across its outer 45 percent.
// It is a mesh of its own on the painting's plane (a hair nearer, so it never fights the plate for depth), drawn after the plate and the lamp layer
// and before the nearer depth plates, so it works with LIVING PAINTINGS on (the plates stand in for the painting) and off (the painting is drawn).
// The painting file is never edited (hard rule 8; an approved plate keeps its hash): only the render changes. The frame's alpha, which an FFX-2 stage
// uses as its bloom mask, is left as it is.

/** One dimmed place: `at` is a painting point (u right, v down, as fractions), `radius` the ellipse's half-extents (fractions of the painting's width
 * and height), `keep` what is left of the picture at the centre (0..1). */
export interface PlateDimSpec {
  readonly at: readonly [number, number];
  readonly radius: readonly [number, number];
  readonly keep: number;
}

const VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FRAG = /* glsl */ `
  uniform vec4 uDim;      // centre u, centre v (up), half-extent u, half-extent v
  uniform float uKeep;
  varying vec2 vUv;
  void main() {
    vec2 q = (vUv - uDim.xy) / uDim.zw;
    float f = mix(1.0, uKeep, 1.0 - smoothstep(0.55, 1.0, length(q)));
    gl_FragColor = vec4(f, f, f, 1.0);
  }
`;

/** The factor the dim multiplies the picture by at a painting point: `keep` at the centre, 1 outside the ellipse. Pure; the shader's own rule. */
export function plateDimFactor(spec: PlateDimSpec, u: number, v: number): number {
  const q = Math.hypot((u - spec.at[0]) / spec.radius[0], (v - spec.at[1]) / spec.radius[1]);
  const t = Math.min(1, Math.max(0, (q - 0.55) / 0.45));
  const s = t * t * (3 - 2 * t);
  return spec.keep + (1 - spec.keep) * s;
}

/**
 * Add the dim over a freshly made `backdrop` and register it with it (it disposes it). Returns the mesh, or null when the backdrop has no
 * `backdrop-painting` plane to follow.
 */
export function addPlateDim(backdrop: Backdrop, spec: PlateDimSpec): Mesh | null {
  const main = backdrop.group.getObjectByName('backdrop-painting') as Mesh | undefined;
  if (!main) return null;
  const geo = main.geometry as PlaneGeometry;
  const mat = new ShaderMaterial({
    uniforms: {
      uDim: { value: new Vector4(spec.at[0], 1 - spec.at[1], spec.radius[0], spec.radius[1]) },
      uKeep: { value: spec.keep },
    },
    vertexShader: VERT,
    fragmentShader: FRAG,
    transparent: true,
    depthWrite: false,
    depthTest: true,
    fog: false,
    blending: CustomBlending,
    blendEquation: AddEquation,
    blendSrc: ZeroFactor, // colour: what is there times the factor
    blendDst: SrcColorFactor,
    blendSrcAlpha: ZeroFactor, // alpha: what is there (the bloom mask), unchanged
    blendDstAlpha: OneFactor,
  });
  const mesh = new Mesh(new PlaneGeometry(geo.parameters.width, geo.parameters.height), mat);
  mesh.position.set(main.position.x, main.position.y, main.position.z + 0.01);
  mesh.renderOrder = main.renderOrder + 1.5; // after the plate (-90) and its lamp layer (-89), before the nearer plates (-87)
  mesh.frustumCulled = false;
  mesh.name = 'backdrop-plate-dim';
  backdrop.adopt(mesh);
  return mesh;
}
