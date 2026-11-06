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
 * - **The air** ({@link addAtmosphere}): the waterfalls' thin ribbons are widened into curtains, a soft mist lies at the foot of each, and a few dust motes drift in the light shaft (the concept frames' haze and sparkle).
 * - **Nothing else of the stage changes**: the walls, the door, the torches and the light are the Wind Waker chapter's. Game case: FFX-2 only.
 *
 * Needs three.js (and a DOM for the stone's canvas; a test hands none and builds no stone). The maths ({@link reflectionAlpha}) are pure and pinned by `tests/unit/ww3d/stage-anime.test.ts`.
 */

import { AdditiveBlending, BufferGeometry, CircleGeometry, Color, Float32BufferAttribute, Mesh, PlaneGeometry, Points, PointsMaterial, RepeatWrapping, Sprite, SpriteMaterial, Vector3, Vector4, type MeshBasicMaterial, type MeshToonMaterial, type ShaderMaterial, type Texture, type WebGLRenderer } from 'three';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { canvas, rgb, rng, tex } from './stageTextures.ts';
import { STAGE, type BuiltStage } from './stage.ts';
import { polarPos } from './stageParts.ts';

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


// ---------------------------------------------------------------------------------------------------------------------------------------------------------
// The air: wide waterfalls, mist at their feet, dust in the shaft
// ---------------------------------------------------------------------------------------------------------------------------------------------------------

/** The waterfalls' azimuths (degrees, `./stage.ts`'s own list) and the width the Wind Waker stage draws them at; the anime chapter draws them {@link AIR}.waterfallWidth times as wide. */
export const WATERFALL_AZ: readonly number[] = [-38, -7, 46];
export const WATERFALL_WIDTH = 0.62;
export const AIR = { waterfallWidth: 2.6, waterfallTone: 0.82, mist: { count: 3, size: [3.2, 1.7] as const, opacity: 0.32, y: 0.55 }, motes: { count: 140, radius: 1.5, size: 0.07, opacity: 0.55 } } as const;

/** A soft white dot (a radial falloff), for the mist and the motes. Needs a DOM. */
export function softDotTexture(): Texture {
  const S = 128;
  const { c, g } = canvas(S, S);
  const grad = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.35, 'rgba(255,255,255,0.45)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, S, S);
  return tex(c);
}

/**
 * The dust motes' places (x y z per mote) inside the light shaft's cone: `count` points scattered along the axis from `bottom` to `top` within `radius` of it (the cone narrows toward the floor), from a seeded
 * generator. Pure.
 */
export function moteField(top: readonly [number, number, number], bottom: readonly [number, number, number], count: number, radius: number, seed = 31): Float32Array {
  const r = rng(seed);
  const out = new Float32Array(count * 3);
  const axis = new Vector3(top[0] - bottom[0], top[1] - bottom[1], top[2] - bottom[2]);
  const len = axis.length();
  const dir = axis.clone().normalize();
  const u = new Vector3(1, 0, 0).cross(dir).normalize();
  const v = dir.clone().cross(u).normalize();
  for (let i = 0; i < count; i++) {
    const t = r();
    const rad = radius * (0.35 + 0.65 * t) * Math.sqrt(r());
    const ang = r() * Math.PI * 2;
    const p = new Vector3(bottom[0], bottom[1], bottom[2]).addScaledVector(dir, t * len).addScaledVector(u, Math.cos(ang) * rad).addScaledVector(v, Math.sin(ang) * rad);
    out[i * 3] = p.x;
    out[i * 3 + 1] = p.y;
    out[i * 3 + 2] = p.z;
  }
  return out;
}

export interface Atmosphere {
  /** The mist sprites and the motes, for a test and the debug handle. */
  readonly mist: readonly Sprite[];
  readonly motes: Points | null;
  /** The waterfalls that were widened. */
  readonly widened: number;
  update(t: number): void;
  dispose(): void;
}

export interface AtmosphereOptions {
  /** The soft dot (default: drawn on a canvas); a test hands a blank texture. */
  dot?: Texture;
  /** `false` leaves the mist and the motes out (a low-quality build): the waterfalls are still widened. */
  extras?: boolean;
}

/**
 * Widen the stage's waterfalls (the planes {@link WATERFALL_WIDTH} wide), lay a mist at the foot of each and scatter dust motes in the light shaft. The motes sit inside the shaft's cone (the same ends as
 * `./stage.ts`'s cards), drift slowly and twinkle; additive, no fog, below the bloom's threshold.
 */
export function addAtmosphere(stage: BuiltStage, opts: AtmosphereOptions = {}): Atmosphere {
  let widened = 0;
  for (const o of stage.group.children) {
    const m = o as Mesh;
    const geo = m.geometry as PlaneGeometry | undefined;
    if (geo && geo.type === 'PlaneGeometry' && Math.abs((geo.parameters?.width ?? 0) - WATERFALL_WIDTH) < 1e-6) {
      m.scale.x = AIR.waterfallWidth;
      // the streaks keep their own size (the picture repeats across the wider ribbon instead of stretching) and the curtain is a little dimmer: a wide white sheet would be the brightest thing in the room
      const mat = m.material as MeshBasicMaterial;
      if (mat.map) {
        mat.map.wrapS = RepeatWrapping;
        mat.map.repeat.x = AIR.waterfallWidth;
        mat.map.needsUpdate = true;
      }
      mat.color.setScalar(AIR.waterfallTone);
      widened++;
    }
  }
  const owned: Array<{ dispose(): void }> = [];
  const mist: Sprite[] = [];
  let motes: Points | null = null;
  let base: Float32Array | null = null;
  if (opts.extras !== false) {
    const dot = opts.dot ?? softDotTexture();
    owned.push(dot);
    for (const az of WATERFALL_AZ) {
      const mat = new SpriteMaterial({ map: dot, color: 0xd8ecff, transparent: true, opacity: AIR.mist.opacity, depthWrite: false, fog: false });
      owned.push(mat);
      for (let k = 0; k < AIR.mist.count; k++) {
        const s = new Sprite(mat);
        s.position.copy(polarPos(az + (k - 1) * 2.2, STAGE.R - 1.2, AIR.mist.y + 0.12 * k));
        s.scale.set(AIR.mist.size[0], AIR.mist.size[1], 1);
        s.userData['phase'] = az * 0.13 + k * 1.7;
        stage.group.add(s);
        mist.push(s);
      }
    }
    // the shaft's ends, the same as `./stage.ts`: the roof opening's side and the floor
    const hole = STAGE.hole;
    base = moteField([hole.x - 1.5, STAGE.H - 1.6, hole.z + 1.5], [-1.2, 0, -2.4], AIR.motes.count, AIR.motes.radius);
    const g = new BufferGeometry();
    g.setAttribute('position', new Float32BufferAttribute(base.slice(), 3));
    const pm = new PointsMaterial({ map: dot, color: 0xfff4d6, size: AIR.motes.size, sizeAttenuation: true, transparent: true, opacity: AIR.motes.opacity, depthWrite: false, blending: AdditiveBlending, fog: false, toneMapped: false });
    owned.push(g, pm);
    motes = new Points(g, pm);
    motes.name = 'ww-motes';
    motes.frustumCulled = false;
    stage.group.add(motes);
  }
  return {
    mist,
    motes,
    widened,
    update(t: number): void {
      for (const s of mist) {
        const ph = s.userData['phase'] as number;
        s.scale.set(AIR.mist.size[0] * (1 + 0.08 * Math.sin(t * 0.7 + ph)), AIR.mist.size[1] * (1 + 0.1 * Math.sin(t * 0.9 + ph * 1.3)), 1);
        s.material.opacity = AIR.mist.opacity * (0.85 + 0.15 * Math.sin(t * 0.5 + ph));
      }
      if (motes && base) {
        const a = motes.geometry.getAttribute('position') as Float32BufferAttribute;
        for (let i = 0; i < a.count; i++) {
          const ph = i * 1.37;
          a.setXYZ(i, base[i * 3]! + 0.12 * Math.sin(t * 0.3 + ph), base[i * 3 + 1]! + 0.18 * Math.sin(t * 0.22 + ph * 0.7), base[i * 3 + 2]! + 0.12 * Math.cos(t * 0.27 + ph));
        }
        a.needsUpdate = true;
        (motes.material as PointsMaterial).opacity = AIR.motes.opacity * (0.8 + 0.2 * Math.sin(t * 1.3));
      }
    },
    dispose(): void {
      for (const s of mist) s.removeFromParent();
      motes?.removeFromParent();
      for (const o of owned) o.dispose();
    },
  };
}
