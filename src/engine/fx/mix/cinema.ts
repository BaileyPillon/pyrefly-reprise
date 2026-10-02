import { Color, DoubleSide, Group, Mesh, PlaneGeometry, ShaderMaterial, Vector3, type PerspectiveCamera, type Scene } from 'three';
import { FXAAPass } from 'three/addons/postprocessing/FXAAPass.js';
import { SMAAPass } from 'three/addons/postprocessing/SMAAPass.js';
import type { Pass } from 'three/addons/postprocessing/Pass.js';
import type { Renderer } from '../../Renderer.ts';
import { cameraAt, unionBox, type Fig, type Pose } from './geometry.ts';
import type { MasterClass } from './masters.ts';

/**
 * The MAX mix (D-316), CINEMA LIGHT's three new parts, ported from option C's prototype
 * (`fx/max/c/stageFx.ts`, `view.ts`). All original (rule 8): a value-noise fog shader and three.js's own
 * SMAA and FXAA passes.
 *
 * - FOG: two bands per room, one between the party and the boss (deeper before a colossus) and one
 *   between the enemies and the painted backdrop, tinted by the painting's own sky. It drifts slowly;
 *   REDUCE MOTION holds it still. Off under LOW EFFECTS (`gates.ts`).
 * - DEPTH OF FIELD: today's tilt-shift band re-aimed at the figures of the shot on screen (a band per
 *   master class: shallower on a colossus). The blur itself stays CINEMA LIGHT's. Off on the phone
 *   tier and under LOW EFFECTS (today's tilt-shift stays), held still under REDUCE MOTION.
 * - SMOOTH EDGES' post pass: SMAA before the grade on the full tier, FXAA on the phone, none under LOW
 *   EFFECTS (the defringe, `defringe.ts`, is the part every tier keeps).
 *
 * Game case: both (the fog takes each room's own sky).
 */

const FOG_FRAG = /* glsl */ `
  uniform vec3 uCol;
  uniform float uAmt;
  uniform float uT;
  varying vec2 vUv;
  float h(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float n(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(h(i), h(i + vec2(1, 0)), f.x), mix(h(i + vec2(0, 1)), h(i + vec2(1, 1)), f.x), f.y);
  }
  void main() {
    vec2 p = vUv * vec2(6.0, 1.6) + vec2(uT * 0.025, 0.0);
    float v = n(p) * 0.55 + n(p * 2.1 + 3.7) * 0.3 + n(p * 4.3 - 1.9) * 0.15;
    float rise = 1.0 - smoothstep(0.05, 1.0, vUv.y);
    float edge = smoothstep(0.0, 0.18, vUv.x) * smoothstep(1.0, 0.82, vUv.x);
    gl_FragColor = vec4(uCol, uAmt * rise * edge * (0.45 + 0.75 * v));
  }`;
const FOG_VERT = /* glsl */ `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;

export interface DofBand {
  focus: number;
  width: number;
}

/** The tilt-shift band aimed at the figures of a pose (0 = bottom of the screen), per master class. */
export function dofBand(p: Pose, figs: readonly Fig[], W: number, H: number, cls: MasterClass): DofBand | null {
  if (!figs.length) return null;
  const u = unionBox(figs, cameraAt(p, W / H), W, H);
  const mid = (Math.max(0, u.t) + Math.min(H, u.b)) / 2;
  const half = Math.max(0.12, Math.min(0.4, (Math.min(H, u.b) - Math.max(0, u.t)) / (2 * H) + (cls === 'colossus' ? 0.02 : 0.03)));
  return { focus: Math.min(0.95, Math.max(0.05, 1 - mid / H)), width: half };
}

export class Cinema {
  readonly root = new Group();
  private readonly fog: Mesh<PlaneGeometry, ShaderMaterial>[] = [];
  private fogT = 0;
  private aaPass: Pass | null = null;
  private aaKind: 'smaa' | 'fxaa' | null = null;
  private savedTilt: { focus: number; band: number } | null = null;
  private readonly sky: Color;
  readonly stats = { fogBands: 0, aa: 'none' as string, dof: null as DofBand | null };

  constructor(scene: Scene, private readonly renderer: () => Renderer | null) {
    this.root.name = 'fx-mix';
    scene.add(this.root);
    const pal = (scene.userData as Record<string, unknown> | undefined)?.['backdropPalette'] as { sky?: number } | undefined;
    this.sky = new Color(typeof pal?.sky === 'number' ? pal.sky : 0x8890a8).lerp(new Color(1, 1, 1), 0.25);
  }

  /** Build the two fog bands for a master (party -> boss, boss -> backdrop). */
  buildFog(cls: MasterClass, partyAt: Vector3, bossAt: Vector3, bossH: number, cam: PerspectiveCamera): void {
    this.clearFog();
    const mk = (at: Vector3, height: number, amt: number): void => {
      const dist = at.distanceTo(cam.position);
      const width = 2 * dist * Math.tan((cam.fov * Math.PI) / 360) * (cam.aspect || 1.78) * 1.25;
      const mat = new ShaderMaterial({
        vertexShader: FOG_VERT,
        fragmentShader: FOG_FRAG,
        uniforms: { uCol: { value: this.sky.clone() }, uAmt: { value: amt }, uT: { value: 0 } },
        transparent: true,
        depthWrite: false,
        side: DoubleSide,
      });
      const m = new Mesh(new PlaneGeometry(width, height), mat);
      m.name = 'fx-mix-fog';
      m.position.set(at.x, at.y + height / 2 - 0.05, at.z);
      m.lookAt(cam.position.clone().setY(m.position.y));
      this.root.add(m);
      this.fog.push(m);
    };
    const between = new Vector3().lerpVectors(partyAt, bossAt, 0.55);
    const behind = bossAt.clone().addScaledVector(new Vector3().subVectors(bossAt, partyAt).setY(0).normalize(), 2.2);
    if (cls === 'colossus') mk(between, Math.max(1.2, bossH * 0.35), 0.3);
    else mk(between, 1.1, 0.14);
    mk(behind, Math.max(1.6, bossH * 0.6), cls === 'colossus' ? 0.26 : 0.2);
    this.stats.fogBands = this.fog.length;
  }

  fogUpdate(dt: number, on: boolean, rm: boolean): void {
    if (!rm) this.fogT += dt;
    for (const m of this.fog) {
      m.visible = on;
      m.material.uniforms['uT']!.value = this.fogT;
    }
  }

  private clearFog(): void {
    for (const m of this.fog) {
      m.removeFromParent();
      m.geometry.dispose();
      m.material.dispose();
    }
    this.fog.length = 0;
  }

  /** The depth-of-field band for the shot on screen, or null to give today's tilt-shift back. */
  dof(band: DofBand | null): void {
    const r = this.renderer();
    if (!r?.tiltH) return;
    const u = r.tiltH.uniforms;
    this.stats.dof = band;
    if (band) {
      this.savedTilt ??= { focus: u['focus']!.value as number, band: u['bandWidth']!.value as number };
      r.applyPost({ tiltFocus: band.focus, tiltBandWidth: band.width });
    } else if (this.savedTilt) {
      r.applyPost({ tiltFocus: this.savedTilt.focus, tiltBandWidth: this.savedTilt.band });
      this.savedTilt = null;
    }
  }

  /** SMOOTH EDGES' post pass (SMAA, FXAA or none), inserted just before the grade. */
  aa(kind: 'smaa' | 'fxaa' | null): void {
    if (kind === this.aaKind) return;
    const r = this.renderer();
    if (!r?.composer) return;
    if (this.aaPass) {
      r.composer.removePass(this.aaPass);
      this.aaPass.dispose();
      this.aaPass = null;
    }
    this.aaKind = kind;
    this.stats.aa = kind ?? 'none';
    if (!kind) return;
    const pass = kind === 'smaa' ? new SMAAPass() : new FXAAPass();
    const at = r.composer.passes.indexOf(r.gradePass);
    r.composer.insertPass(pass, at < 0 ? r.composer.passes.length : at);
    this.aaPass = pass;
  }

  dispose(): void {
    this.aa(null);
    this.dof(null);
    this.clearFog();
    this.root.removeFromParent();
  }
}
