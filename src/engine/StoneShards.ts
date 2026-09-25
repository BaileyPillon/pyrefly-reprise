/**
 * **A petrified figure breaks into stone.** The burst of chips and grit that
 * plays when a petrified fiend shatters (`status-add eject` after a
 * `petrify`, `BattlePresenterArrivals.ts`).
 *
 * Chapter VII e2e (commit 06338dbc) caught the Guardians' shatter barely
 * reading as stone at game size: a grey flash, then the same pyrefly dissolve
 * every fiend gets. The hit sparks (`VFX.ts#SparkBurst`) are the wrong
 * material for it — additive, round and glowing, they read as light. These are
 * the opposite: **opaque, angular, stone-coloured, lit from above, and heavy**.
 * They spawn across the whole height of the figure (a statue comes apart
 * everywhere at once, not from the chest), tumble, and land on the floor at
 * its feet, where they lie for a moment before fading.
 *
 * Presentation only: it changes nothing about whether a petrified figure
 * shatters (an open question with Bailey,
 * `docs/concepts/chapters/macalania/unlock/petrify-shatter.jpg`); it only draws
 * the break when the engine says it happened.
 *
 * One pool per scene, built on first use and re-emitted, so a battle never
 * allocates buffers mid-fight. It advances itself in `onBeforeRender`, so the
 * stage's frame loop needs no new hook. Shared plumbing, **both games** (any
 * petrified enemy that shatters, FFX or FFX-2).
 */

import {
  BufferAttribute,
  BufferGeometry,
  Color,
  NormalBlending,
  Points,
  ShaderMaterial,
  Vector2,
  type Camera,
  type Object3D,
  type WebGLRenderer,
} from 'three';

/** Chips (large, tumbling) plus grit (small, quick). */
const CHIPS = 46;
const GRIT = 70;
/** Seconds the burst lives; the last third fades out on the floor. */
export const SHARD_LIFE = 1.35;
const GRAVITY = 14;

/** Weathered stone greys, warm and cool, the same family as the petrify flash (0xb9b4aa). */
const STONE_PALETTE = [0xa9a49a, 0xc6c1b6, 0x8f8a82, 0xd8d3c8, 0x9d988f, 0xb7b2a8].map((c) => new Color(c));

const vertex = /* glsl */ `
  uniform float uTime;
  uniform float uFloor;
  uniform float uPx;
  uniform float uLife;
  attribute vec3 aVel;
  attribute vec3 aColor;
  attribute float aSize;
  attribute float aSpin;
  varying vec3 vColor;
  varying float vFade;
  varying float vRot;
  varying float vShape;
  void main() {
    vec3 p0 = position;
    vShape = step(0.0, aSpin);
    float g = ${GRAVITY.toFixed(1)};
    // When this piece reaches the floor: y0 + vy t - g t^2 / 2 = floor.
    float drop = max(p0.y - uFloor, 0.0);
    float land = (aVel.y + sqrt(aVel.y * aVel.y + 2.0 * g * drop)) / g;
    float t = min(uTime, land);
    vec3 p = p0 + aVel * t;
    p.y = max(uFloor, p0.y + aVel.y * t - 0.5 * g * t * t);
    vRot = aSpin * t;
    vColor = aColor;
    vFade = 1.0 - smoothstep(uLife * 0.62, uLife, uTime);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = aSize * uPx / max(-mv.z, 0.001);
  }
`;

const fragment = /* glsl */ `
  varying vec3 vColor;
  varying float vFade;
  varying float vRot;
  varying float vShape;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float s = sin(vRot);
    float k = cos(vRot);
    vec2 q = vec2(k * c.x - s * c.y, s * c.x + k * c.y);
    // Sharp-cornered shards, never discs: half are splinter triangles, half
    // long lozenges (a chip flaked off a statue has straight broken edges).
    float tri = max(abs(q.x) * 0.866 + q.y * 0.5, -q.y) / 0.25;
    float loz = (abs(q.x) * 1.9 + abs(q.y) * 0.8) / 0.46;
    float d = mix(tri, loz, vShape);
    if (d > 1.0) discard;
    // One lit facet and one shadowed facet, split along the long axis, plus a
    // dark broken edge: reads as a solid piece of stone at a few pixels.
    float facet = q.x + 0.35 * q.y > 0.0 ? 1.08 : 0.72;
    float lit = facet * (0.9 + 0.35 * (-c.y));
    float rim = smoothstep(0.78, 1.0, d);
    vec3 col = vColor * lit * (1.0 - 0.5 * rim);
    if (vFade < 0.01) discard;
    gl_FragColor = vec4(col, vFade);
  }
`;

class StonePool extends Points {
  private readonly vel: Float32Array;
  private readonly pos: Float32Array;
  private readonly col: Float32Array;
  private readonly size: Float32Array;
  private readonly spin: Float32Array;
  private readonly u: ShaderMaterial['uniforms'];
  private last = 0;
  private readonly buf = new Vector2();

  constructor() {
    const n = CHIPS + GRIT;
    const geo = new BufferGeometry();
    const pos = new Float32Array(n * 3);
    const vel = new Float32Array(n * 3);
    const col = new Float32Array(n * 3);
    const size = new Float32Array(n);
    const spin = new Float32Array(n);
    geo.setAttribute('position', new BufferAttribute(pos, 3));
    geo.setAttribute('aVel', new BufferAttribute(vel, 3));
    geo.setAttribute('aColor', new BufferAttribute(col, 3));
    geo.setAttribute('aSize', new BufferAttribute(size, 1));
    geo.setAttribute('aSpin', new BufferAttribute(spin, 1));
    const mat = new ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uFloor: { value: 0 }, uPx: { value: 600 }, uLife: { value: SHARD_LIFE } },
      vertexShader: vertex,
      fragmentShader: fragment,
      transparent: true,
      depthWrite: false,
      // Drawn over the figure it came out of: the chips are *in front* of the
      // plane they break from, and a depth test against that plane would cut
      // the burst in half.
      depthTest: false,
      blending: NormalBlending,
    });
    super(geo, mat);
    this.pos = pos;
    this.vel = vel;
    this.col = col;
    this.size = size;
    this.spin = spin;
    this.u = mat.uniforms;
    this.frustumCulled = false;
    this.renderOrder = 43;
    this.visible = false;
    this.name = 'stone-shards';
    this.onBeforeRender = (renderer: WebGLRenderer, _scene: unknown, camera: Camera): void => this.tick(renderer, camera);
  }

  /** Break a figure `height` units tall standing at `feet`. */
  burst(feet: { x: number; y: number; z: number }, height: number, rand: () => number = Math.random): void {
    const h = Math.max(0.5, height);
    const n = CHIPS + GRIT;
    for (let i = 0; i < n; i++) {
      const chip = i < CHIPS;
      // Across the whole body: a statue breaks everywhere at once.
      this.pos[i * 3] = feet.x + (rand() - 0.5) * h * 0.34;
      this.pos[i * 3 + 1] = feet.y + h * (0.08 + rand() * 0.86);
      this.pos[i * 3 + 2] = feet.z + (rand() - 0.5) * 0.3;
      const out = (chip ? 1.6 : 2.8) * (0.4 + rand());
      const dir = rand() < 0.5 ? -1 : 1;
      this.vel[i * 3] = dir * out * (0.3 + rand() * 0.7) * (h / 4.1 + 0.4);
      this.vel[i * 3 + 1] = (chip ? 1.2 : 2.4) * rand() * (h / 4.1 + 0.4);
      this.vel[i * 3 + 2] = (rand() - 0.5) * 1.2;
      const c = STONE_PALETTE[(rand() * STONE_PALETTE.length) | 0]!;
      const shade = chip ? 1 : 1.12;
      this.col[i * 3] = Math.min(1, c.r * shade);
      this.col[i * 3 + 1] = Math.min(1, c.g * shade);
      this.col[i * 3 + 2] = Math.min(1, c.b * shade);
      // World units across, scaled to the figure: fist-sized chips on a 4-unit Guardian.
      this.size[i] = (chip ? 0.12 + rand() * 0.18 : 0.045 + rand() * 0.05) * (h / 4.1 + 0.25);
      this.spin[i] = (rand() - 0.5) * (chip ? 9 : 16);
    }
    const geo = this.geometry;
    for (const name of ['position', 'aVel', 'aColor', 'aSize', 'aSpin']) {
      (geo.getAttribute(name) as BufferAttribute).needsUpdate = true;
    }
    this.u['uFloor']!.value = feet.y + 0.02;
    this.u['uTime']!.value = 0;
    this.last = 0;
    this.visible = true;
  }

  /** How far the burst has run, seconds; for tests and the debug snapshot. */
  get elapsed(): number {
    return this.u['uTime']!.value as number;
  }

  /** Advance by `dt` seconds (the render hook calls this with wall-clock time). */
  advance(dt: number): void {
    if (!this.visible) return;
    const t = (this.u['uTime']!.value as number) + Math.max(0, Math.min(dt, 0.1));
    this.u['uTime']!.value = t;
    if (t >= SHARD_LIFE) this.visible = false;
  }

  private tick(renderer: WebGLRenderer, camera: Camera): void {
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    this.advance(this.last ? (now - this.last) / 1000 : 0);
    this.last = now;
    // Pixels across one world unit at distance 1, so `aSize` stays in world units.
    const px = renderer.getDrawingBufferSize(this.buf).y * 0.5 * camera.projectionMatrix.elements[5]!;
    if (Number.isFinite(px) && px > 0) this.u['uPx']!.value = px;
  }

  override dispose(): void {
    this.geometry.dispose();
    (this.material as ShaderMaterial).dispose();
    this.removeFromParent();
  }
}

const pools = new WeakMap<Object3D, StonePool>();

/** Play the stone burst for a figure `height` units tall whose feet are at `feet`, in `scene`. */
export function stoneShatter(scene: Object3D, feet: { x: number; y: number; z: number }, height: number): void {
  let pool = pools.get(scene);
  if (!pool) {
    pool = new StonePool();
    pools.set(scene, pool);
    scene.add(pool);
  }
  pool.burst(feet, height);
}

/** The scene's pool, if a burst has ever played in it (tests, debug). */
export function stonePoolOf(scene: Object3D): { readonly visible: boolean; readonly elapsed: number; advance(dt: number): void } | undefined {
  return pools.get(scene);
}

/** Free the scene's pool with the rest of the stage. */
export function disposeStoneShards(scene: Object3D): void {
  pools.get(scene)?.dispose();
  pools.delete(scene);
}
