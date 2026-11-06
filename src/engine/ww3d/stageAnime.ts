/**
 * **The anime chapter's wet floor** (the hidden anime chapter, `data/chapter-exp-anime.ts`; FFX-2 only): the temple stage of the Wind Waker chapter (`./stage.ts`, a stand-in) with its warm sand floor made into
 * what the concept frames show, a polished blue-grey stone that mirrors the room: the figures, Valefor, the door, the torches and the shaft stand on their own reflection.
 *
 * - **The stone.** The stage's floor mesh (named `ww-floor`) keeps its toon material, its sun shadow and its blue-violet shadow tint; only its picture changes, from the sand slabs to pale blue-grey slabs
 *   ({@link stoneFloorTexture}).
 * - **The reflection.** A planar mirror ({@link https://threejs.org/docs/#examples/en/objects/Reflector three's Reflector}) lies 1 cm over the floor and draws the scene again from under it, as a translucent layer:
 *   its opacity follows the view's grazing angle ({@link reflectionAlpha}, a Fresnel-like curve capped at {@link ANIME_FLOOR}.strength) and a few taps of blur and a slow ripple keep it from reading as a perfect
 *   mirror. **It draws the scene once per game frame**, not once per render: the game may render the scene several times a frame (supersampling, post passes) and each would draw the whole room again, so the mirror's
 *   `onBeforeRender` is wrapped to run only when {@link AnimeFloor.update} has advanced the frame. A `low` quality build, and `?reflect=0`, leave the mirror out and keep the stone.
 * - **Nothing else of the stage changes**: the walls, the door, the torches, the waterfalls, the shaft and the light are the Wind Waker chapter's. Game case: FFX-2 only.
 *
 * Needs three.js (and a DOM for the stone's canvas; a test hands none and builds no stone). The maths ({@link reflectionAlpha}) are pure and pinned by `tests/unit/ww3d/stage-anime.test.ts`.
 */

import { CircleGeometry, Color, Mesh, Vector4, type MeshToonMaterial, type ShaderMaterial, type Texture, type WebGLRenderer } from 'three';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { canvas, rgb, rng, tex } from './stageTextures.ts';
import type { BuiltStage } from './stage.ts';

/** The mirror's numbers (staging, ours: not game data). `y` is how far over the floor it lies; `strength` the most it covers (0 to 1); `size` its picture's size in pixels; `blur` the tap spacing in picture units. */
export const ANIME_FLOOR = { y: 0.01, strength: 0.55, size: [1280, 720] as const, blur: 0.0022, ripple: 0.0016, tint: 0xdfe9ff } as const;

/** The stone's slabs (albedo, sRGB): a pale blue-grey after the concept frames' polished floor, darker joints, a lighter top edge on each slab. */
export const STONE = { base: [124, 152, 196] as const, joint: [80, 100, 142] as const, edge: [178, 202, 236] as const, slabs: 3 } as const;

/**
 * How much of the mirror shows at a view whose component along the floor's normal is `cosTheta` (the cosine of the angle from the normal: 1 looking straight down, 0 at a grazing view). A floor seen from chest
 * height is nearly all grazing, so the curve rises steeply toward 0: `strength * (0.3 + 0.7 * (1 - cosTheta)^3)`.
 */
export function reflectionAlpha(cosTheta: number, strength: number = ANIME_FLOOR.strength): number {
  const c = Math.min(1, Math.max(0, cosTheta));
  return strength * (0.3 + 0.7 * Math.pow(1 - c, 3));
}

/** Pale blue-grey polished slabs (3 x 3 per tile, seeded): tone variance, a light top edge, darker joints and a few chips. Needs a DOM. */
export function stoneFloorTexture(seed: number, repeat: readonly [number, number]): Texture {
  const S = 1024;
  const { c, g } = canvas(S, S);
  const r = rng(seed);
  const n = STONE.slabs;
  const cell = S / n;
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n; i++) {
      const k = 0.94 + r() * 0.12;
      g.fillStyle = rgb(STONE.base[0], STONE.base[1], STONE.base[2], k);
      g.fillRect(i * cell, j * cell, cell, cell);
      g.fillStyle = 'rgba(' + STONE.edge.join(',') + ',0.4)';
      g.fillRect(i * cell + 10, j * cell + 10, cell - 20, 12);
    }
  }
  g.fillStyle = 'rgba(' + STONE.joint.join(',') + ',0.28)';
  for (let k = 0; k < 36; k++) g.fillRect(r() * S, r() * S, 6 + r() * 18, 3 + r() * 5);
  g.strokeStyle = rgb(STONE.joint[0], STONE.joint[1], STONE.joint[2]);
  g.lineWidth = 8;
  for (let k = 0; k <= n; k++) {
    g.beginPath();
    g.moveTo(k * cell, 0);
    g.lineTo(k * cell, S);
    g.stroke();
    g.beginPath();
    g.moveTo(0, k * cell);
    g.lineTo(S, k * cell);
    g.stroke();
  }
  return tex(c, { repeat });
}

const VERTEX = /* glsl */ `
uniform mat4 textureMatrix;
varying vec4 vUv;
varying vec3 vWorld;
void main() {
	vUv = textureMatrix * vec4( position, 1.0 );
	vWorld = ( modelMatrix * vec4( position, 1.0 ) ).xyz;
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}
`;

const FRAGMENT = /* glsl */ `
uniform vec3 color;
uniform sampler2D tDiffuse;
uniform vec4 uMirror; // x strength, y blur, z time, w ripple
varying vec4 vUv;
varying vec3 vWorld;
void main() {
	vec2 uv = vUv.xy / vUv.w;
	vec2 d = vec2( sin( vWorld.x * 3.1 + uMirror.z * 0.6 ) + sin( vWorld.z * 2.3 - uMirror.z * 0.5 ), cos( vWorld.x * 2.7 - uMirror.z * 0.4 ) + sin( vWorld.z * 3.3 + uMirror.z * 0.7 ) ) * uMirror.w;
	float k = uMirror.y;
	vec3 c = texture2D( tDiffuse, uv + d ).rgb * 0.4;
	c += texture2D( tDiffuse, uv + d + vec2( k, 0.0 ) ).rgb * 0.15;
	c += texture2D( tDiffuse, uv + d - vec2( k, 0.0 ) ).rgb * 0.15;
	c += texture2D( tDiffuse, uv + d + vec2( 0.0, k * 2.0 ) ).rgb * 0.15;
	c += texture2D( tDiffuse, uv + d - vec2( 0.0, k * 2.0 ) ).rgb * 0.15;
	vec3 V = normalize( cameraPosition - vWorld );
	float f = pow( 1.0 - clamp( V.y, 0.0, 1.0 ), 3.0 );
	float a = uMirror.x * ( 0.3 + 0.7 * f );
	gl_FragColor = vec4( c * color, a );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}
`;

/** What {@link addAnimeFloor} hands back. */
export interface AnimeFloor {
  /** The mirror, or null when it was left out (low quality, `?reflect=0`, or a test). */
  readonly mirror: Reflector | null;
  /** Advance the frame (the mirror draws once after each call) and the ripple's clock. Call it once per game frame. */
  update(dt: number): void;
  dispose(): void;
}

export interface AnimeFloorOptions {
  /** `low` and `reflect: false` leave the mirror out. */
  quality?: 'low' | 'high';
  reflect?: boolean;
  /** The stone's picture (default: drawn on a canvas); a test hands a blank texture or null to keep the sand. */
  stone?: Texture | null;
  /** The stone's repeat over the floor disc. */
  repeat?: readonly [number, number];
}

/** `?reflect=0` leaves the mirror out (a debugging and comparison view); anything else draws it. */
export function reflectWanted(search: string): boolean {
  return new URLSearchParams(search).get('reflect') !== '0';
}

/** Make the stage's floor the wet stone and lay the mirror over it. A stage without a `ww-floor` mesh is left alone. */
export function addAnimeFloor(stage: BuiltStage, opts: AnimeFloorOptions = {}): AnimeFloor {
  const floor = stage.group.getObjectByName('ww-floor') as Mesh | undefined;
  const mat = floor?.material as MeshToonMaterial | undefined;
  const owned: Array<{ dispose(): void }> = [];
  if (floor && mat) {
    const stone = opts.stone === undefined ? stoneFloorTexture(5, opts.repeat ?? [2.8, 2.8]) : opts.stone;
    if (stone) {
      mat.map = stone;
      mat.color.set(0xeef2ff);
      owned.push(stone);
    }
  }
  let mirror: Reflector | null = null;
  let frame = 0;
  let drawn = -1;
  let clock = 0;
  if (floor && opts.reflect !== false && opts.quality !== 'low') {
    const radius = (floor.geometry as CircleGeometry).parameters?.radius ?? 12.5;
    const m = new Reflector(new CircleGeometry(radius, 64), {
      color: new Color(ANIME_FLOOR.tint).getHex(),
      textureWidth: ANIME_FLOOR.size[0],
      textureHeight: ANIME_FLOOR.size[1],
      multisample: 4,
      shader: {
        name: 'AnimeFloorMirror',
        uniforms: { color: { value: null }, tDiffuse: { value: null }, textureMatrix: { value: null }, uMirror: { value: new Vector4(ANIME_FLOOR.strength, ANIME_FLOOR.blur, 0, ANIME_FLOOR.ripple) } },
        vertexShader: VERTEX,
        fragmentShader: FRAGMENT,
      },
    });
    const mm = m.material as unknown as ShaderMaterial; // the mirror's own shader material (typed as any material)
    m.name = 'ww-floor-mirror';
    m.rotation.x = -Math.PI / 2;
    m.position.y = ANIME_FLOOR.y;
    mm.transparent = true;
    mm.depthWrite = false;
    mm.polygonOffset = true;
    mm.polygonOffsetFactor = -1;
    mm.polygonOffsetUnits = -4;
    m.renderOrder = 1;
    // once per game frame: the game renders the scene more than once a frame, and each render would draw the whole room again from under the floor
    const before = m.onBeforeRender;
    m.onBeforeRender = function (this: Mesh, renderer: WebGLRenderer, ...rest: unknown[]): void {
      if (drawn === frame) return;
      drawn = frame;
      (before as unknown as (...a: unknown[]) => void).call(this, renderer, ...rest);
    };
    stage.group.add(m);
    mirror = m;
  }
  return {
    mirror,
    update(dt: number): void {
      frame += 1;
      clock += dt;
      if (mirror) ((mirror.material as unknown as ShaderMaterial).uniforms['uMirror']!.value as Vector4).z = clock;
    },
    dispose(): void {
      if (mirror) {
        mirror.removeFromParent();
        mirror.geometry.dispose();
        mirror.dispose();
        mirror = null;
      }
      for (const o of owned) o.dispose();
    },
  };
}

