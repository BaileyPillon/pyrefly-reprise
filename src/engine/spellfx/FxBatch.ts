/**
 * Draws an {@link FxDrawList} on the GPU: three instanced-quad meshes (normal
 * under, additive, normal over), each quad a sprite from the atlas or an
 * analytic ring, bar or slash band, positioned in CSS pixels straight into
 * clip space. It is rendered after the post chain (`Renderer.addOverlay`), so
 * the effects sit over the graded frame the way the mock drew them over the
 * real-engine plate, and neither the tilt-shift nor the bloom touches them.
 */

import {
  AdditiveBlending,
  DynamicDrawUsage,
  InstancedBufferAttribute,
  InstancedBufferGeometry,
  Mesh,
  NormalBlending,
  OrthographicCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  Vector2,
  type Blending,
  type WebGLRenderer,
} from 'three';
import { fxAtlasTexture, TILES } from './FxAtlas.ts';
import type { FxDrawList, FxItem } from './FxDrawList.ts';
import { rgb } from './fxMath.ts';

const vertex = /* glsl */ `
  attribute vec4 iA; // x, y, w, h (CSS px, y down)
  attribute vec4 iB; // rotation, alpha, shape, tile
  attribute vec4 iC; // r, g, b, baked
  attribute vec4 iP; // shape parameters
  uniform vec2 uView;
  varying vec2 vUv;
  varying vec4 vB;
  varying vec4 vC;
  varying vec4 vP;
  varying vec2 vSize;
  void main() {
    vec2 off = vec2(position.x * iA.z, -position.y * iA.w);
    float s = sin(iB.x);
    float c = cos(iB.x);
    vec2 px = iA.xy + vec2(off.x * c - off.y * s, off.x * s + off.y * c);
    gl_Position = vec4(px.x / uView.x * 2.0 - 1.0, 1.0 - px.y / uView.y * 2.0, 0.0, 1.0);
    vUv = uv;
    vB = iB;
    vC = iC;
    vP = iP;
    vSize = iA.zw;
  }
`;

const fragment = /* glsl */ `
  uniform sampler2D uAtlas;
  varying vec2 vUv;
  varying vec4 vB;
  varying vec4 vC;
  varying vec4 vP;
  varying vec2 vSize;
  const float TAU = 6.2831853;

  float band(float d, float hw, float aa) {
    return 1.0 - smoothstep(hw - aa, hw + aa, d);
  }

  void main() {
    float shape = vB.z;
    vec3 col = vC.rgb;
    float a = 0.0;
    if (shape < 0.5) {
      vec2 cell = vec2(mod(vB.w, 4.0), floor(vB.w / 4.0));
      vec4 tx = texture2D(uAtlas, (cell + 1.0 / 128.0 + vUv * (126.0 / 128.0)) / 4.0);
      col = vC.a > 0.5 ? tx.rgb * col : mix(col, vec3(1.0), tx.r);
      a = tx.a;
    } else if (shape < 1.5) {
      // Ring: circle space, radius 1 = the quad's half width.
      vec2 p = vUv * 2.0 - 1.0;
      float r = length(p);
      float aa = fwidth(r);
      float d = abs(r - vP.x);
      a = max(band(d, vP.y * 0.5, aa), 0.35 * band(d, vP.y * 1.5, aa));
      if (vP.z < 0.999) {
        float rel = mod(atan(-p.y, p.x) + TAU * 0.25, TAU);
        if (rel > TAU * vP.z) a = 0.0;
      }
    } else if (shape < 2.5) {
      // Bar: a capsule, in pixels along and across the segment.
      vec2 p = (vUv - 0.5) * vSize;
      float d = length(vec2(max(abs(p.x) - vP.x * 0.5, 0.0), p.y));
      a = band(d, vP.y * 0.5, 0.75);
    } else {
      // Slash band: an arc from vP.x to vP.y (radians, y down), radius vP.z,
      // thickness vP.w * sin(pi u) along it.
      vec2 p = vUv * 2.0 - 1.0;
      float r = length(p);
      float span = vP.y - vP.x;
      float rel = mod(atan(-p.y, p.x) - vP.x, TAU);
      if (span < 0.0) rel = rel - TAU;
      float u = rel / span;
      if (u >= 0.0 && u <= 1.0) {
        float th = sin(u * 3.1415927) * vP.w;
        a = band(abs(r - vP.z), th * 0.5, fwidth(r));
      }
    }
    a *= vB.y;
    if (a < 0.002) discard;
    gl_FragColor = vec4(col, a);
  }
`;

class Layer {
  readonly mesh: Mesh<InstancedBufferGeometry, ShaderMaterial>;
  private cap = 0;
  private attrs: InstancedBufferAttribute[] = [];

  constructor(blending: Blending, order: number, view: Vector2) {
    const plane = new PlaneGeometry(1, 1);
    const geo = new InstancedBufferGeometry();
    geo.index = plane.index;
    geo.setAttribute('position', plane.getAttribute('position'));
    geo.setAttribute('uv', plane.getAttribute('uv'));
    const mat = new ShaderMaterial({
      uniforms: { uAtlas: { value: fxAtlasTexture() }, uView: { value: view } },
      vertexShader: vertex,
      fragmentShader: fragment,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      blending,
    });
    this.mesh = new Mesh(geo, mat);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = order;
    this.grow(256);
  }

  private grow(n: number): void {
    this.cap = n;
    this.attrs = ['iA', 'iB', 'iC', 'iP'].map((name) => {
      const at = new InstancedBufferAttribute(new Float32Array(n * 4), 4);
      at.setUsage(DynamicDrawUsage);
      this.mesh.geometry.setAttribute(name, at);
      return at;
    });
  }

  fill(items: readonly FxItem[]): void {
    if (items.length > this.cap) this.grow(Math.ceil(items.length / 256) * 256);
    const [A, B, C, P] = this.attrs.map((a) => a.array as Float32Array) as [Float32Array, Float32Array, Float32Array, Float32Array];
    items.forEach((it, i) => {
      const o = i * 4;
      const tile = TILES[it.tile];
      A[o] = it.x;
      A[o + 1] = it.y;
      A[o + 2] = it.w;
      A[o + 3] = it.h;
      B[o] = it.rot;
      B[o + 1] = it.a;
      B[o + 2] = it.shape;
      B[o + 3] = tile.index;
      C[o] = it.col[0];
      C[o + 1] = it.col[1];
      C[o + 2] = it.col[2];
      C[o + 3] = tile.baked ? 1 : 0;
      P.set(it.p, o);
    });
    for (const at of this.attrs) {
      at.clearUpdateRanges();
      at.addUpdateRange(0, items.length * 4);
      at.needsUpdate = true;
    }
    this.mesh.geometry.instanceCount = items.length;
    this.mesh.visible = items.length > 0;
  }

  dispose(): void {
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
  }
}

export class FxBatch {
  private readonly scene = new Scene();
  private readonly camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
  private readonly view = new Vector2(1600, 900);
  private readonly layers: [Layer, Layer, Layer];
  private live = false;

  constructor() {
    this.layers = [new Layer(NormalBlending, 0, this.view), new Layer(AdditiveBlending, 1, this.view), new Layer(NormalBlending, 2, this.view)];
    for (const l of this.layers) this.scene.add(l.mesh);
  }

  /** Load this frame's list; the washes go last, over everything, full screen. */
  set(list: FxDrawList | null, width: number, height: number): void {
    this.view.set(Math.max(1, width), Math.max(1, height));
    const buckets: [FxItem[], FxItem[], FxItem[]] = [[], [], []];
    if (list) {
      for (const it of list.items) buckets[it.layer].push(it);
      for (const w of list.washes) {
        buckets[2].push({ layer: 2, shape: 0, tile: 'solid', x: width / 2, y: height / 2, w: width, h: height, rot: 0, col: rgb(w.col), a: w.a, p: [0, 0, 0, 0] });
      }
    }
    this.layers.forEach((l, i) => l.fill(buckets[i]!));
    this.live = buckets.some((b) => b.length > 0);
  }

  /**
   * Compile the three programs now (battle load) rather than on the first
   * spell, which would hitch that frame.
   */
  warm(renderer: WebGLRenderer): void {
    for (const l of this.layers) l.mesh.visible = true;
    renderer.compile(this.scene, this.camera);
    for (const l of this.layers) l.mesh.visible = false;
  }

  /** Draw over whatever the renderer last put on screen. A no-op with nothing to draw. */
  render(renderer: WebGLRenderer): void {
    if (!this.live) return;
    const auto = renderer.autoClear;
    renderer.autoClear = false;
    renderer.render(this.scene, this.camera);
    renderer.autoClear = auto;
  }

  /**
   * Eye-candy option A1b: draw only the additive layer (the light of the spell) into whatever
   * target the caller has bound, for the halo it blurs and lays under the crisp quads.
   */
  renderAdditive(renderer: WebGLRenderer): void {
    if (!this.live) return;
    const vis = this.layers.map((l) => l.mesh.visible);
    this.layers[0].mesh.visible = false;
    this.layers[2].mesh.visible = false;
    const auto = renderer.autoClear;
    renderer.autoClear = false;
    renderer.render(this.scene, this.camera);
    renderer.autoClear = auto;
    this.layers.forEach((l, i) => (l.mesh.visible = vis[i]!));
  }

  dispose(): void {
    for (const l of this.layers) l.dispose();
  }
}
