import { AdditiveBlending, BufferAttribute, BufferGeometry, Color, Mesh, ShaderMaterial, Vector3 } from 'three';

/**
 * Option B "Living Paintings": short electric arcs crackling around a point (Djose, FFX-2: the
 * painting names "faint blue electric sparks" at the machina work lamps; where exactly they jump
 * is ours). Each arc is a midpoint-displaced polyline, re-drawn every 55 ms while it lives, drawn
 * as a camera-facing ribbon with a white core and a coloured glow. Arcs come in short bursts at
 * seeded, irregular intervals, never more than three per second in any one place.
 *
 * Reduce motion: off (a flash risk as well as motion). Game case: FFX-2 only (Djose).
 */

export interface ArcSpec {
  /** World anchor points. */
  at: Array<[number, number, number]>;
  /** Reach of an arc from its anchor (world units). */
  reach: number;
  /** Ribbon half-width (world units). */
  width: number;
  color: number;
  /** Mean seconds between bursts per anchor. */
  every: number;
}

const SEGS = 16;
const PER_ARC = 2;

const VERT = /* glsl */ `
  attribute float side;
  varying float vSide;
  void main() {
    vSide = side;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FRAG = /* glsl */ `
  uniform vec3 uColor;
  uniform float uGain;
  varying float vSide;
  void main() {
    float v = abs(vSide);
    float core = exp(-v * v * 60.0);
    float glow = exp(-v * v * 5.0) * 0.55;
    vec3 c = mix(uColor, vec3(1.0), core * 0.85) * (core * 1.6 + glow);
    gl_FragColor = vec4(c * uGain, clamp((core + glow) * uGain, 0.0, 1.0));
    #include <colorspace_fragment>
  }
`;

interface ArcState {
  anchor: Vector3;
  live: number;
  wait: number;
  regen: number;
  pts: Vector3[][];
}

export class Arcs {
  readonly mesh: Mesh;
  private readonly spec: ArcSpec;
  private readonly arcs: ArcState[];
  private readonly pos: Float32Array;
  private readonly material: ShaderMaterial;
  private seed = 7;

  constructor(spec: ArcSpec) {
    this.spec = spec;
    const quads = spec.at.length * PER_ARC * SEGS;
    this.pos = new Float32Array(quads * 4 * 3);
    const side = new Float32Array(quads * 4);
    const index: number[] = [];
    for (let q = 0; q < quads; q++) {
      side.set([-1, 1, -1, 1], q * 4);
      const b = q * 4;
      index.push(b, b + 1, b + 2, b + 1, b + 3, b + 2);
    }
    const geo = new BufferGeometry();
    geo.setAttribute('position', new BufferAttribute(this.pos, 3));
    geo.setAttribute('side', new BufferAttribute(side, 1));
    geo.setIndex(index);
    this.material = new ShaderMaterial({
      uniforms: { uColor: { value: new Color(spec.color) }, uGain: { value: 1 } },
      vertexShader: VERT,
      fragmentShader: FRAG,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: AdditiveBlending,
    });
    this.mesh = new Mesh(geo, this.material);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 60;
    this.mesh.name = 'fx-b-arcs';
    this.arcs = spec.at.map((a, i) => ({ anchor: new Vector3(...a), live: 0, wait: 0.4 + i * 0.7, regen: 0, pts: [] }));
  }

  private rnd(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }

  /** A jagged line from `from` to `to`: midpoint displacement across the segment, in the view plane. */
  private bolt(from: Vector3, to: Vector3): Vector3[] {
    const off = new Float32Array(SEGS + 1);
    const len = from.distanceTo(to);
    const split = (a: number, b: number, rough: number): void => {
      if (b - a < 2) return;
      const m = (a + b) >> 1;
      off[m] = (off[a]! + off[b]!) / 2 + (this.rnd() - 0.5) * rough;
      split(a, m, rough * 0.55);
      split(m, b, rough * 0.55);
    };
    split(0, SEGS, len * 0.5);
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const n = Math.hypot(dx, dy) || 1;
    const px = -dy / n;
    const py = dx / n;
    const pts: Vector3[] = [];
    for (let i = 0; i <= SEGS; i++) {
      const t = i / SEGS;
      pts.push(new Vector3(from.x + dx * t + px * off[i]!, from.y + dy * t + py * off[i]!, from.z + (to.z - from.z) * t));
    }
    return pts;
  }

  /** @param dt seconds (0 while frozen: the arcs hold their shape). */
  update(dt: number, gain: number, camera: { position: Vector3 }): void {
    this.material.uniforms['uGain']!.value = gain;
    this.mesh.visible = gain > 0;
    for (const s of this.arcs) {
      if (dt > 0) {
        if (s.live > 0) {
          s.live -= dt;
          s.regen -= dt;
          if (s.regen <= 0) {
            s.regen = 0.055;
            s.pts = [];
            for (let k = 0; k < PER_ARC; k++) {
              const r = this.spec.reach * (0.5 + this.rnd() * 0.6);
              const ang = this.rnd() * Math.PI * 2;
              const end = s.anchor.clone().add(new Vector3(Math.cos(ang) * r, Math.sin(ang) * r * 0.8, 0));
              s.pts.push(this.bolt(s.anchor, end));
            }
          }
          if (s.live <= 0) {
            s.pts = [];
            s.wait = this.spec.every * (0.4 + this.rnd() * 1.4);
          }
        } else {
          s.wait -= dt;
          if (s.wait <= 0) {
            s.live = 0.12 + this.rnd() * 0.3;
            s.regen = 0;
          }
        }
      }
    }
    // Write the ribbons: perpendicular to each segment in the camera's view plane (roughly xy).
    let q = 0;
    const w = this.spec.width;
    const toCam = new Vector3();
    const dir = new Vector3();
    const perp = new Vector3();
    for (const s of this.arcs) {
      for (let k = 0; k < PER_ARC; k++) {
        const pts = s.pts[k];
        for (let i = 0; i < SEGS; i++, q++) {
          const o = q * 12;
          if (!pts) {
            this.pos.fill(0, o, o + 12);
            continue;
          }
          const a = pts[i]!;
          const b = pts[i + 1]!;
          dir.subVectors(b, a);
          toCam.subVectors(camera.position, a);
          perp.crossVectors(dir, toCam).normalize().multiplyScalar(w * (1 - (i / SEGS) * 0.6));
          this.pos.set([a.x - perp.x, a.y - perp.y, a.z - perp.z, a.x + perp.x, a.y + perp.y, a.z + perp.z,
            b.x - perp.x, b.y - perp.y, b.z - perp.z, b.x + perp.x, b.y + perp.y, b.z + perp.z], o);
        }
      }
    }
    (this.mesh.geometry.getAttribute('position') as BufferAttribute).needsUpdate = true;
  }

  dispose(): void {
    this.mesh.geometry.dispose();
    this.material.dispose();
    this.mesh.removeFromParent();
  }
}
