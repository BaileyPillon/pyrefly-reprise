/**
 * A light puppet-warp of one painting (opt-motion prototype, `?motion=M2`; M1 borrows its smear). NEVER merged.
 *
 * What it is: the painted plane is re-cut into a 28 x 28 grid and its vertex shader bends the picture's own pixels
 * around a few pins. A pin is a limb on the painting: a hinge (the shoulder), a tip, a width, and a swing in
 * degrees. Points near the tip swing the most, points at the hinge not at all, and anything farther than the
 * limb's width from its axis stays put, so the body does not shear. Nothing is repainted, nothing is mirrored,
 * and no new texture is made: a figure with no rig, or with REDUCE MOTION on, draws exactly as today.
 *
 * Two uses share the one shader:
 * - pins (M2): the idle (a slow wing, neck and tail sway, a few degrees) and the hit (a damped kick of every pin
 *   when `recoil` fires). The enemy keeps its painted keys; only the pixels move.
 * - smear (M1): while a figure travels, its trailing half is stretched back along the run and thinned across it
 *   for a few frames, the classic smear. {@link PuppetWarp.smearPulse}.
 *
 * Game case: both. The rig tables are per painting. The picture is the only source: a pin is placed by looking at
 * the PNG, never from game data.
 */
import { PlaneGeometry, ShaderMaterial, Vector3, Vector4, type Mesh } from 'three';
import type { PaintedActor } from '../PaintedActor.ts';
import { motionOn } from './MotionMode.ts';

export const MAX_PINS = 5;
const GRID = 28;

/** One limb, in the painting's own UV (u right, v up, both 0..1). */
export interface WarpPin {
  hinge: readonly [number, number];
  tip: readonly [number, number];
  /** How far from the hinge-to-tip axis the limb reaches, in plane heights. */
  width: number;
  /** Idle swing, degrees either side, and its rate in cycles per second. */
  ampDeg: number;
  hz: number;
  /** Radians. */
  phase: number;
  /** Peak swing of the hit kick, degrees (signed: which way the limb is thrown). */
  kickDeg: number;
}

export type WarpRig = readonly WarpPin[];

/** Image pixels to UV for a canvas `w` x `h`. */
const px = (w: number, h: number, x: number, y: number): [number, number] => [x / w, 1 - y / h];

function pin(w: number, h: number, hx: number, hy: number, tx: number, ty: number, width: number, ampDeg: number, hz: number, phase: number, kickDeg: number): WarpPin {
  return { hinge: px(w, h, hx, hy), tip: px(w, h, tx, ty), width: width / h, ampDeg, hz, phase, kickDeg };
}

/**
 * Pins by painting, placed against `public/art/characters/<id>/idle.png` (positions in that PNG's pixels).
 * Bahamut (1024 x 1024): both wings, the neck and head, the tail coil. Seymour Flux's body (750 x 1211): the hair
 * plume, the two floating ornaments, the robe's hem and the head. Anything not listed has no rig.
 */
export const WARP_RIGS: Readonly<Record<string, WarpRig>> = {
  'ffx2-bahamut': [
    pin(1024, 1024, 285, 330, 70, 640, 250, 3.4, 0.34, 0.0, 6),
    pin(1024, 1024, 565, 372, 930, 600, 320, 3.0, 0.34, 1.6, -6),
    pin(1024, 1024, 400, 340, 470, 140, 140, 2.2, 0.27, 0.8, -4),
    pin(1024, 1024, 470, 850, 120, 910, 190, 3.2, 0.41, 2.4, 5),
  ],
  bahamut: [
    pin(1024, 1024, 285, 330, 70, 640, 250, 3.4, 0.34, 0.0, 6),
    pin(1024, 1024, 565, 372, 930, 600, 320, 3.0, 0.34, 1.6, -6),
    pin(1024, 1024, 400, 340, 470, 140, 140, 2.2, 0.27, 0.8, -4),
    pin(1024, 1024, 470, 850, 120, 910, 190, 3.2, 0.41, 2.4, 5),
  ],
  'seymour-flux-body': [
    pin(750, 1211, 470, 170, 725, 165, 140, 3.6, 0.3, 0.0, 6),
    pin(750, 1211, 250, 320, 40, 190, 95, 5.0, 0.42, 1.2, -9),
    pin(750, 1211, 240, 430, 25, 440, 85, 5.0, 0.36, 2.6, 9),
    pin(750, 1211, 400, 800, 290, 1190, 210, 2.6, 0.27, 0.7, 4),
    pin(750, 1211, 400, 390, 400, 120, 150, 1.2, 0.22, 1.9, -2),
  ],
};

const WARP_VERT = /* glsl */ `
  uniform vec4 pinA[${MAX_PINS}];
  uniform vec4 pinB[${MAX_PINS}];
  uniform vec3 smear;
  uniform float warpAspect;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    vec2 asp = vec2(warpAspect, 1.0);
    vec2 disp = vec2(0.0);
    for (int i = 0; i < ${MAX_PINS}; i++) {
      float ang = pinB[i].y;
      if (abs(ang) > 1e-5) {
        vec2 h = pinA[i].xy;
        vec2 axis = (pinA[i].zw - h) * asp;
        vec2 rel = (uv - h) * asp;
        float t = clamp(dot(rel, axis) / max(dot(axis, axis), 1e-6), 0.0, 1.0);
        float lat = length(rel - axis * t);
        float w = smoothstep(0.0, 1.0, t) * (1.0 - smoothstep(pinB[i].x * 0.75, pinB[i].x * 1.4, lat));
        float a = ang * w;
        float c = cos(a);
        float s = sin(a);
        vec2 r = vec2(c * rel.x - s * rel.y, s * rel.x + c * rel.y);
        disp += (r - rel) / asp;
      }
    }
    if (smear.z > 1e-4) {
      vec2 dir = smear.xy;
      vec2 rel = (uv - 0.5) * asp;
      float behind = smoothstep(0.1, 0.6, -dot(rel, dir));
      vec2 perp = vec2(-dir.y, dir.x);
      disp += -dir / asp * smear.z * 0.55 * behind;
      disp += -perp * dot(rel, perp) * smear.z * 0.5 * behind / asp;
    }
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position + vec3(disp, 0.0), 1.0);
  }
`;

const warps = new WeakMap<PaintedActor, PuppetWarp>();

/** The warp on this actor, made on first use. */
export function ensureWarp(actor: PaintedActor, rig: WarpRig = []): PuppetWarp {
  let w = warps.get(actor);
  if (!w) warps.set(actor, (w = new PuppetWarp(actor, rig)));
  else if (rig.length && !w.hasRig) w.setRig(rig);
  return w;
}

export function warpOf(actor: PaintedActor | undefined): PuppetWarp | undefined {
  return actor ? warps.get(actor) : undefined;
}

export class PuppetWarp {
  private rig: WarpRig;
  private readonly meshes: Mesh[] = [];
  private readonly pinA = Array.from({ length: MAX_PINS }, () => new Vector4());
  private readonly pinB = Array.from({ length: MAX_PINS }, () => new Vector4());
  private readonly smearU = { value: new Vector3(1, 0, 0) };
  private readonly aspectU = { value: 1 };
  private clock = Math.random() * 20;
  private level = 0;
  private kickAge = 99;
  private smearAge = 99;
  private smearMs = 1;
  private smearPeak = 0;
  private readonly smearDir = new Vector3(1, 0, 0);

  constructor(private readonly actor: PaintedActor, rig: WarpRig) {
    this.rig = rig;
    this.setRig(rig);
    const pinAU = { value: this.pinA };
    const pinBU = { value: this.pinB };
    actor.traverse((o) => {
      const m = o as Mesh;
      const mat = m.material as ShaderMaterial | undefined;
      if (!m.isMesh || !mat?.isShaderMaterial || !mat.uniforms['map']) return;
      m.geometry.dispose();
      m.geometry = new PlaneGeometry(1, 1, GRID, GRID);
      mat.vertexShader = WARP_VERT;
      mat.uniforms['pinA'] = pinAU;
      mat.uniforms['pinB'] = pinBU;
      mat.uniforms['smear'] = this.smearU;
      mat.uniforms['warpAspect'] = this.aspectU;
      mat.needsUpdate = true;
      this.meshes.push(m);
    });
    const update = actor.update.bind(actor);
    actor.update = (dt: number): void => {
      update(dt);
      this.tick(dt);
    };
    const recoil = actor.recoil.bind(actor);
    actor.recoil = (ms?: number, distance?: number): Promise<void> => {
      if (motionOn('M2')) this.kickAge = 0;
      return recoil(ms, distance);
    };
  }

  get hasRig(): boolean {
    return this.rig.length > 0;
  }

  setRig(rig: WarpRig): void {
    this.rig = rig.slice(0, MAX_PINS);
    this.rig.forEach((p, i) => this.pinA[i]!.set(p.hinge[0], p.hinge[1], p.tip[0], p.tip[1]));
    for (let i = this.rig.length; i < MAX_PINS; i++) this.pinA[i]!.set(0, 0, 0, 0);
  }

  /** A short smear along `dirX`/`dirY` (on screen: x right, y up), peaking at `peak` (0..1), over `ms`. */
  smearPulse(dirX: number, dirY: number, ms: number, peak = 0.6): void {
    const len = Math.hypot(dirX, dirY) || 1;
    const shown = this.meshes.find((x) => x.visible) ?? this.meshes[0];
    const flip = shown && shown.scale.x < 0 ? -1 : 1; // a mirrored plane's own x runs the other way
    this.smearDir.set((dirX / len) * flip, dirY / len, 0);
    this.smearAge = 0;
    this.smearMs = Math.max(1, ms);
    this.smearPeak = peak;
  }

  /** Every frame, after the actor's own update. */
  private tick(dt: number): void {
    this.clock += dt;
    const still = this.actor.still?.() === true;
    const want = !still && this.rig.length > 0 && motionOn('M2') ? 1 : 0;
    this.level += (want - this.level) * Math.min(1, dt * 3);
    this.kickAge += dt;
    const kick = this.kickAge < 1.1 ? Math.exp(-this.kickAge * 4.2) * Math.cos(this.kickAge * 5.2 * Math.PI * 2 * 0.5) : 0;
    const k = this.level;
    this.rig.forEach((p, i) => {
      const deg = (p.ampDeg * Math.sin(this.clock * p.hz * Math.PI * 2 + p.phase) + p.kickDeg * kick) * k;
      this.pinB[i]!.set(p.width, (deg * Math.PI) / 180, 0, 0);
    });
    for (let i = this.rig.length; i < MAX_PINS; i++) this.pinB[i]!.set(0, 0, 0, 0);

    let sm = 0;
    if (this.smearAge < this.smearMs / 1000 && !still) {
      this.smearAge += dt;
      const t = Math.min(1, this.smearAge / (this.smearMs / 1000));
      sm = this.smearPeak * Math.sin(Math.PI * t) ** 1.2;
    }
    this.smearU.value.set(this.smearDir.x, this.smearDir.y, sm);
    const m = this.meshes.find((x) => x.visible) ?? this.meshes[0];
    if (m) this.aspectU.value = Math.abs(m.scale.x / Math.max(1e-4, m.scale.y));
  }
}
