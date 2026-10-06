import { AddEquation, Color, CustomBlending, Group, Matrix4, Mesh, OneFactor, PlaneGeometry, ShaderMaterial, Vector2, Vector4, ZeroFactor, type Object3D } from 'three';

/**
 * Figure lighting MOCKUPS (`lightFlags.ts`): the two layers a figure's own shader cannot draw, because they reach past the
 * painting's silhouette. Each is an additive plane that follows one painted plane (its slot's mesh) and lives in its own
 * group in the scene, not under the figure, so nothing that measures a figure (framing, the held shots) ever sees it.
 *
 * - the STAR layer (looks 1, 2 and 3): the hand-placed points of `glints.ts`, drawn in front of the figure as a four-point
 *   star (FFX-2) or an anamorphic streak (FFX), arms free to run out past the blade or staff they sit on;
 * - the HALO layer (look 3): the painting's own alpha blurred wide, drawn behind the figure in the room's key colour and
 *   shifted toward the key, so a figure standing in front of a light has the light round its edge.
 *
 * Both blend additively and leave the frame's alpha alone (`blendDstAlpha` one, source alpha zero): the figure's bloom mask
 * and true-colour flag (`BloomMask.ts`, the grade's `figm`) are exactly as without them. A halo drawn behind a figure is then
 * covered by the figure (which multiplies the alpha it finds), and a star over a figure leaves that pixel a figure's.
 */

const VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const HALO_FRAG = /* glsl */ `
  uniform sampler2D map;
  uniform float opacity;
  uniform vec3 haloCol;
  uniform float haloK;
  uniform vec2 shift;
  uniform vec2 ringR;
  uniform float lod;
  uniform float scl;
  varying vec2 vUv;
  float am(vec2 q) {
    vec2 s = step(vec2(0.0), q) * step(q, vec2(1.0));
    return s.x * s.y * textureLod(map, q, lod).a;
  }
  void main() {
    vec2 p = (vUv - 0.5) * scl + 0.5 - shift;
    float s = 0.25 * am(p)
      + 0.125 * (am(p + vec2(ringR.x, 0.0)) + am(p - vec2(ringR.x, 0.0)) + am(p + vec2(0.0, ringR.y)) + am(p - vec2(0.0, ringR.y)))
      + 0.0625 * (am(p + ringR) + am(p - ringR) + am(p + vec2(ringR.x, -ringR.y)) + am(p + vec2(-ringR.x, ringR.y)));
    float h = pow(clamp(s, 0.0, 1.0), 1.35) * haloK * opacity;
    gl_FragColor = vec4(haloCol * h, 1.0);
  }
`;

const STAR_FRAG = /* glsl */ `
  uniform vec4 pts[6];
  uniform float cnt;
  uniform vec3 col;
  uniform float k;
  uniform float time;
  uniform vec2 sizeW;
  uniform float heightW;
  uniform float style;
  uniform float opacity;
  uniform float scl;
  varying vec2 vUv;
  void main() {
    vec2 p = (vUv - 0.5) * scl + 0.5;
    float acc = 0.0;
    for (int i = 0; i < 6; i++) {
      if (float(i) >= cnt) break;
      vec4 q = pts[i];
      vec2 d = (p - q.xy) * sizeW;
      float S = max(q.z * heightW, 1e-4);
      float tw = 0.7 + 0.3 * sin(time * 2.2 + q.w * 6.2831);
      float core = exp(-dot(d, d) / (0.012 * S * S));
      float armX = exp(-abs(d.y) / (0.035 * S)) * exp(-abs(d.x) / (0.5 * S));
      float armY = exp(-abs(d.x) / (0.035 * S)) * exp(-abs(d.y) / (0.5 * S));
      float star = core + 0.85 * (armX + armY);
      float streak = core + 1.2 * exp(-abs(d.y) / (0.07 * S)) * exp(-abs(d.x) / (0.5 * S)) + 0.25 * armY;
      acc += mix(streak, star, style) * tw;
    }
    gl_FragColor = vec4(col * (acc * k * opacity), 1.0);
  }
`;

const ADDITIVE = {
  blending: CustomBlending,
  blendEquation: AddEquation,
  blendSrc: OneFactor,
  blendDst: OneFactor,
  blendSrcAlpha: ZeroFactor,
  blendDstAlpha: OneFactor,
  transparent: true,
  depthWrite: false,
  depthTest: true,
} as const;

const HALO_SCALE = 1.7;
const STAR_SCALE = 1.5;
const plane = new PlaneGeometry(1, 1);
const lift = new Matrix4();

export interface SlotOverlayParams {
  /** Is the slot's own plane on screen (visible, opaque enough, every ancestor visible)? */
  show: boolean;
  /** The slot's world matrix. */
  world: Matrix4;
  /** The painted plane's size in world units, and the figure's world height. */
  size: Vector2;
  heightW: number;
  starPts: readonly (readonly [number, number, number])[];
  starCol: Color;
  starK: number;
  starStyle: 0 | 1;
  time: number;
  haloOn: boolean;
  haloCol: Color;
  haloK: number;
  haloShift: Vector2;
  haloLod: number;
  haloRing: Vector2;
}

/** The pair of layers following one painted plane. */
export class SlotOverlay {
  readonly halo: Mesh;
  readonly star: Mesh;
  private readonly hu: ShaderMaterial['uniforms'];
  private readonly su: ShaderMaterial['uniforms'];
  private readonly pts: Vector4[] = Array.from({ length: 6 }, () => new Vector4());

  constructor(group: Group, mapCell: { value: unknown }, opacityCell: { value: unknown }, renderOrder: number) {
    this.hu = {
      map: mapCell as never,
      opacity: opacityCell as never,
      haloCol: { value: new Color() },
      haloK: { value: 0 },
      shift: { value: new Vector2() },
      ringR: { value: new Vector2(0.03, 0.03) },
      lod: { value: 4 },
      scl: { value: HALO_SCALE },
    };
    this.su = {
      pts: { value: this.pts },
      cnt: { value: 0 },
      col: { value: new Color() },
      k: { value: 1 },
      time: { value: 0 },
      sizeW: { value: new Vector2(1, 1) },
      heightW: { value: 1.9 },
      style: { value: 1 },
      opacity: opacityCell as never,
      scl: { value: STAR_SCALE },
    };
    this.halo = new Mesh(plane, new ShaderMaterial({ uniforms: this.hu, vertexShader: VERT, fragmentShader: HALO_FRAG, ...ADDITIVE, name: 'figure-halo' }));
    this.star = new Mesh(plane, new ShaderMaterial({ uniforms: this.su, vertexShader: VERT, fragmentShader: STAR_FRAG, ...ADDITIVE, name: 'figure-star' }));
    for (const m of [this.halo, this.star]) {
      m.matrixAutoUpdate = false;
      m.frustumCulled = false;
      m.visible = false;
    }
    this.halo.renderOrder = renderOrder - 0.25;
    this.star.renderOrder = renderOrder + 0.25;
    group.add(this.halo, this.star);
  }

  write(p: SlotOverlayParams): { star: boolean; halo: boolean } {
    const star = p.show && p.starPts.length > 0 && p.starK > 0;
    const halo = p.show && p.haloOn && p.haloK > 0;
    this.star.visible = star;
    this.halo.visible = halo;
    if (star) {
      for (let i = 0; i < 6; i++) {
        const q = p.starPts[i];
        if (q) this.pts[i]!.set(q[0], q[1], q[2], (q[0] * 7.3 + q[1] * 3.1) % 1);
      }
      this.su['cnt']!.value = Math.min(6, p.starPts.length);
      (this.su['col']!.value as Color).copy(p.starCol);
      this.su['k']!.value = p.starK;
      this.su['time']!.value = p.time;
      (this.su['sizeW']!.value as Vector2).copy(p.size);
      this.su['heightW']!.value = p.heightW;
      this.su['style']!.value = p.starStyle;
      this.star.matrix.copy(p.world).multiply(lift.makeScale(STAR_SCALE, STAR_SCALE, 1).setPosition(0, 0, 0.012));
    }
    if (halo) {
      (this.hu['haloCol']!.value as Color).copy(p.haloCol);
      this.hu['haloK']!.value = p.haloK;
      (this.hu['shift']!.value as Vector2).copy(p.haloShift);
      (this.hu['ringR']!.value as Vector2).copy(p.haloRing);
      this.hu['lod']!.value = p.haloLod;
      this.halo.matrix.copy(p.world).multiply(lift.makeScale(HALO_SCALE, HALO_SCALE, 1).setPosition(0, 0, -0.02));
    }
    return { star, halo };
  }

  hide(): void {
    this.star.visible = false;
    this.halo.visible = false;
  }

  dispose(group: Object3D): void {
    group.remove(this.halo, this.star);
    (this.halo.material as ShaderMaterial).dispose();
    (this.star.material as ShaderMaterial).dispose();
  }
}

/** The group the layers live in, one per scene. */
export function makeOverlayGroup(): Group {
  const g = new Group();
  g.name = 'figure-light';
  return g;
}
