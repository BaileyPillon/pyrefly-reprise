/**
 * Draws an {@link FxDrawList} on the GPU: three instanced-quad meshes (normal
 * under, additive, normal over), each quad a sprite from the atlas or an
 * analytic ring, bar or slash band, positioned in CSS pixels straight into
 * clip space. It is rendered after the post chain (`Renderer.addOverlay`), so
 * the effects sit over the graded frame the way the mock drew them over the
 * real-engine plate, and neither the tilt-shift nor the bloom touches them.
 *
 * The PAINTED FINISH (motion pass, lane "fx"; `FxPaint.ts`): a quad whose `paint` is above 0 has its soft edge torn by bristle streaks that run along its stroke and its body
 * streaked with lighter and darker pigment. The streaks are a value-noise field in the quad's own stroke space (pixels along and across it), seeded per quad, so they ride the
 * quad (no boiling) and look the same at any resolution. `paint` 0 (the live game, always) takes the same path as before: the extra branch is skipped.
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
  attribute vec4 iQ; // painted finish: x = level (0 = off), y = seed
  uniform vec2 uView;
  varying vec2 vUv;
  varying vec4 vB;
  varying vec4 vC;
  varying vec4 vP;
  varying vec4 vQ;
  varying vec2 vSize;
  void main() {
    vec2 off = vec2(position.x * iA.z, -position.y * iA.w);
    float s = sin(iB.x);
    float c = cos(iB.x);
    vec2 px = iA.xy + vec2(off.x * c - off.y * s, off.x * s + off.y * c);
    gl_Position = vec4(px.x / uView.x * 2.0 - 1.0, 1.0 - px.y / uView.y * 2.0, 0.0, 1.0);
    vUv = uv;
    // A cover quad (FxCover.ts: a tile quad with iP.x = 1) is drawn over the whole view and looks the tile up where the quad's own rectangle would; the fragment clamps the lookup.
    if (iB.z < 0.5 && iP.x > 0.5) {
      vec2 q = vec2(position.x + 0.5, 0.5 - position.y) * uView;
      gl_Position = vec4(position.x * 2.0, position.y * 2.0, 0.0, 1.0);
      vUv = vec2((q.x - (iA.x - iA.z * 0.5)) / iA.z, 1.0 - (q.y - (iA.y - iA.w * 0.5)) / iA.w);
    }
    vB = iB;
    vC = iC;
    vP = iP;
    vQ = iQ;
    vSize = iA.zw;
  }
`;

const fragment = /* glsl */ `
  uniform sampler2D uAtlas;
  varying vec2 vUv;
  varying vec4 vB;
  varying vec4 vC;
  varying vec4 vP;
  varying vec4 vQ;
  varying vec2 vSize;
  const float TAU = 6.2831853;

  float band(float d, float hw, float aa) {
    return 1.0 - smoothstep(hw - aa, hw + aa, d);
  }

  float h21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  float vn(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), f.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), f.x), f.y);
  }

  // The painted finish: noise fields in the quad's stroke space (st: CSS px, x along the stroke, y across it). Each shape wobbles its OWN edge with them (a tile's lookup, a ring's, bar's or
  // band's distance), so a hard-edged shape gets a hand-drawn edge too; then the soft part of the shape is torn by bristle streaks and the body carries streaks of pigment.
  vec2 sdv = vec2(0.0);
  float plv = 0.0;

  void paintBegin(float span) {
    plv = vQ.x * smoothstep(9.0, 38.0, span);
    sdv = vec2(vQ.y * 0.73, vQ.y * 0.41);
  }

  // 0..1, long streaks along the stroke: the wobble of an edge.
  float edgeN(vec2 st) {
    return 0.6 * vn(vec2(st.x * 0.022, st.y * 0.30) + sdv) + 0.4 * vn(vec2(st.x * 0.075, st.y * 0.85) + sdv.yx);
  }

  void paintBody(inout float a, inout vec3 col, vec2 st) {
    float coarse = vn(vec2(st.x * 0.016, st.y * 0.17) + sdv);
    float fine = vn(vec2(st.x * 0.055, st.y * 0.5) + sdv.yx);
    float tooth = vn(st * 0.45 + sdv * 2.0);
    float cut = 0.58 * coarse + 0.30 * fine + 0.12 * tooth;
    // the soft part of the shape is torn by the bristles; the solid body stays
    float keep = smoothstep(cut * 0.85 - 0.12, cut * 0.85 + 0.12, a);
    a = mix(a, a * keep, plv);
    // bristle lines through the body, and streaks of lighter and darker pigment along the stroke
    a *= 1.0 - 0.32 * plv * smoothstep(0.6, 0.92, fine);
    col *= 1.0 + (coarse - 0.5) * 0.55 * plv;
    // paint has an edge: a little harder than the airbrushed falloff it started as
    a = mix(a, smoothstep(0.04, 0.5, a) * min(1.0, a * 1.35), 0.35 * plv);
  }

  void main() {
    float shape = vB.z;
    vec3 col = vC.rgb;
    float a = 0.0;
    vec2 st = vec2(0.0);
    bool paint = vQ.x > 0.0;
    if (shape < 0.5) {
      vec2 uv = clamp(vUv, 0.0, 1.0); // a cover quad's lookup runs past the tile; the rim texel is held
      if (paint) {
        st = (vUv - 0.5) * vSize;
        if (vSize.y > vSize.x * 1.3) st = st.yx; // a tall quad's bristles run up it
        paintBegin(min(vSize.x, vSize.y));
        // wobble the lookup: the shape's edge wanders by a few percent of the quad
        uv = clamp(vUv + (vec2(vn(st * 0.045 + sdv), vn(st * 0.045 + sdv + 17.3)) - 0.5) * 0.12 * plv, 0.0, 1.0);
      }
      vec2 cell = vec2(mod(vB.w, 4.0), floor(vB.w / 4.0));
      vec4 tx = texture2D(uAtlas, (cell + 1.0 / 128.0 + uv * (126.0 / 128.0)) / 4.0);
      col = vC.a > 0.5 ? tx.rgb * col : mix(col, vec3(1.0), tx.r);
      a = tx.a;
    } else if (shape < 1.5) {
      // Ring: circle space, radius 1 = the quad's half width.
      vec2 p = vUv * 2.0 - 1.0;
      float r = length(p);
      float aa = fwidth(r);
      float rel = mod(atan(-p.y, p.x) + TAU * 0.25, TAU);
      float d = abs(r - vP.x);
      if (paint) {
        st = vec2(rel * vP.x * vSize.x * 0.5, (r - vP.x) * vSize.x * 0.5);
        paintBegin(vSize.x * 0.45);
        d += (edgeN(st) - 0.5) * vP.y * 1.1 * plv;
      }
      a = max(band(d, vP.y * 0.5, aa), 0.35 * band(d, vP.y * 1.5, aa));
      if (vP.z < 0.999 && rel > TAU * vP.z) a = 0.0;
    } else if (shape < 2.5) {
      // Bar: a capsule, in pixels along and across the segment.
      vec2 p = (vUv - 0.5) * vSize;
      float d = length(vec2(max(abs(p.x) - vP.x * 0.5, 0.0), p.y));
      if (paint) {
        st = p;
        paintBegin(vSize.y);
        d += (edgeN(st) - 0.5) * vP.y * 0.7 * plv;
      }
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
        float d = abs(r - vP.z);
        if (paint) {
          st = vec2(u * abs(span) * vP.z * vSize.x * 0.5, (r - vP.z) * vSize.x * 0.5);
          paintBegin(th * vSize.x * 0.5);
          d += (edgeN(st) - 0.5) * th * 1.0 * plv;
        }
        a = band(d, th * 0.5, fwidth(r));
      }
    }
    if (paint && plv > 0.001) paintBody(a, col, st);
    a *= vB.y;
    if (a < 0.002) discard;
    gl_FragColor = vec4(col, a);
  }
`;

class Layer {
  readonly mesh: Mesh<InstancedBufferGeometry, ShaderMaterial>;
  private cap = 0;
  private attrs: InstancedBufferAttribute[] = [];
  private static readonly NAMES = ['iA', 'iB', 'iC', 'iP', 'iQ'];

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
    this.attrs = Layer.NAMES.map((name) => {
      const at = new InstancedBufferAttribute(new Float32Array(n * 4), 4);
      at.setUsage(DynamicDrawUsage);
      this.mesh.geometry.setAttribute(name, at);
      return at;
    });
  }

  fill(items: readonly FxItem[]): void {
    if (items.length > this.cap) this.grow(Math.ceil(items.length / 256) * 256);
    const [A, B, C, P, Q] = this.attrs.map((a) => a.array as Float32Array) as [Float32Array, Float32Array, Float32Array, Float32Array, Float32Array];
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
      Q[o] = it.paint ?? 0;
      Q[o + 1] = it.seed ?? 0;
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
        buckets[2].push({ layer: 2, shape: 0, tile: 'solid', x: width / 2, y: height / 2, w: width, h: height, rot: 0, col: rgb(w.col), a: w.a, p: [0, 0, 0, 0], paint: 0, seed: 0 });
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
