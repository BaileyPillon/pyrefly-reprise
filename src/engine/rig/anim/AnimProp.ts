/**
 * The potion vial of the item clip (`?anim=proto`; both games, presentation only): a small painted prop that is a real visible object. It is drawn once to a canvas (cobalt glass, bright liquid, a
 * cork, a gold band: the game's Ink & Gold, with the dark outline the paintings have), shown in the figure's hand when the clip reaches the pouch (`reach`), carried with the hand through the draw,
 * and on the throw (`release`) flown to the target on an arc with a spin, where it breaks into a burst of droplets. The existing spell effect for the item's heal or damage plays on the presenter's own
 * cue (its `damage` event), which the item clip's lead waits to the landing.
 *
 * Not a part of the rig (the rig's files are read-only and a part is cut from the one approved painting): a mesh in the scene, drawn after the figure, always facing the camera. Dispose with the actor.
 */
import {
  AdditiveBlending,
  CanvasTexture,
  Group,
  LinearFilter,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  SRGBColorSpace,
  Vector3,
  type Camera,
  type Object3D,
  type Texture,
} from 'three';

/** World units: the vial is this tall in the hand (the figure is about 1.8 tall): a sixth of her height, a little over the painted vial's, so it reads at the game's camera distance. */
const VIAL_H = 0.3;
const DROPS = 9;

/** Paint the vial: 128 x 256, upright, transparent around it. Null where there is no 2D canvas (a unit test). */
export function paintVial(): HTMLCanvasElement | null {
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 256;
  const g = c.getContext('2d');
  if (!g) return null;
  const ink = '#0c1030';
  // glass body: a round flask and a neck
  const body = new Path2D();
  body.moveTo(52, 70);
  body.lineTo(52, 108);
  body.bezierCurveTo(22, 124, 14, 160, 22, 196);
  body.bezierCurveTo(30, 236, 98, 236, 106, 196);
  body.bezierCurveTo(114, 160, 106, 124, 76, 108);
  body.lineTo(76, 70);
  body.closePath();
  g.save();
  g.fillStyle = 'rgba(150,215,255,0.35)';
  g.fill(body);
  g.clip(body);
  // the liquid, from the shoulder down, with a lit core
  const liq = g.createLinearGradient(0, 120, 0, 236);
  liq.addColorStop(0, '#86f4ff');
  liq.addColorStop(0.5, '#3da8ff');
  liq.addColorStop(1, '#2a49d8');
  g.fillStyle = liq;
  g.fillRect(0, 128, 128, 120);
  const core = g.createRadialGradient(60, 188, 4, 60, 188, 46);
  core.addColorStop(0, 'rgba(255,255,255,0.75)');
  core.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = core;
  g.fillRect(0, 128, 128, 120);
  g.strokeStyle = 'rgba(255,255,255,0.9)'; // the meniscus
  g.lineWidth = 3;
  g.beginPath();
  g.moveTo(26, 132);
  g.quadraticCurveTo(64, 142, 102, 130);
  g.stroke();
  g.restore();
  // outline, a highlight and a glint
  g.lineJoin = 'round';
  g.strokeStyle = ink;
  g.lineWidth = 6;
  g.stroke(body);
  g.strokeStyle = 'rgba(255,255,255,0.85)';
  g.lineWidth = 5;
  g.lineCap = 'round';
  g.beginPath();
  g.moveTo(34, 150);
  g.quadraticCurveTo(28, 176, 36, 204);
  g.stroke();
  g.fillStyle = '#ffffff';
  g.beginPath();
  g.arc(88, 150, 4.5, 0, Math.PI * 2);
  g.fill();
  // a gold band at the neck and the cork
  const gold = g.createLinearGradient(0, 62, 0, 78);
  gold.addColorStop(0, '#fff0a8');
  gold.addColorStop(1, '#c28a1c');
  g.fillStyle = gold;
  g.fillRect(48, 62, 34, 14);
  g.strokeStyle = ink;
  g.lineWidth = 4;
  g.strokeRect(48, 62, 34, 14);
  const cork = g.createLinearGradient(0, 20, 0, 62);
  cork.addColorStop(0, '#e9c98f');
  cork.addColorStop(1, '#a8743c');
  g.fillStyle = cork;
  g.beginPath();
  g.moveTo(53, 62);
  g.lineTo(50, 24);
  g.quadraticCurveTo(64, 14, 78, 24);
  g.lineTo(75, 62);
  g.closePath();
  g.fill();
  g.stroke();
  return c;
}

function glowTexture(): Texture | null {
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  if (!g) return null;
  const r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  r.addColorStop(0, 'rgba(255,255,255,1)');
  r.addColorStop(0.35, 'rgba(160,230,255,0.7)');
  r.addColorStop(1, 'rgba(120,200,255,0)');
  g.fillStyle = r;
  g.fillRect(0, 0, 64, 64);
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  return t;
}

type State = 'hidden' | 'held' | 'flying' | 'burst';

interface Drop {
  mesh: Mesh;
  v: Vector3;
}

/** The vial and its landing. `update` runs every frame the figure does. */
export class VialProp {
  readonly group = new Group();
  private readonly vial: Mesh;
  private readonly glow: Mesh;
  /** A soft additive halo behind the vial while it is held and in flight, so the small prop reads. */
  private readonly aura: Mesh;
  private readonly drops: Drop[] = [];
  private readonly mats: MeshBasicMaterial[] = [];
  private state: State = 'hidden';
  private t = 0;
  private flightMs = 300;
  private readonly from = new Vector3();
  private readonly to = new Vector3();
  private readonly at = new Vector3();
  private spin = 0;
  private scale = 1;

  constructor() {
    const canvas = paintVial();
    const map = canvas ? new CanvasTexture(canvas) : null;
    if (map) {
      map.colorSpace = SRGBColorSpace;
      map.minFilter = LinearFilter;
    }
    const mat = new MeshBasicMaterial({ map, transparent: true, depthTest: false, depthWrite: false, toneMapped: false, opacity: 1 });
    const geo = new PlaneGeometry(VIAL_H * 0.5, VIAL_H);
    this.vial = new Mesh(geo, mat);
    const glowMat = new MeshBasicMaterial({ map: glowTexture(), transparent: true, depthTest: false, depthWrite: false, toneMapped: false, blending: AdditiveBlending, opacity: 0 });
    this.glow = new Mesh(new PlaneGeometry(1, 1), glowMat);
    this.mats.push(mat, glowMat);
    const auraMat = new MeshBasicMaterial({ map: glowTexture(), transparent: true, depthTest: false, depthWrite: false, toneMapped: false, blending: AdditiveBlending, opacity: 0.6, color: 0x7fd8ff });
    this.aura = new Mesh(new PlaneGeometry(VIAL_H * 1.9, VIAL_H * 1.9), auraMat);
    this.mats.push(auraMat);
    for (let i = 0; i < DROPS; i++) {
      const dm = new MeshBasicMaterial({ map: glowTexture(), transparent: true, depthTest: false, depthWrite: false, toneMapped: false, blending: AdditiveBlending, opacity: 0, color: 0x9fe8ff });
      const m = new Mesh(new PlaneGeometry(0.05, 0.05), dm);
      m.visible = false;
      this.mats.push(dm);
      this.drops.push({ mesh: m, v: new Vector3() });
      this.group.add(m);
    }
    this.group.add(this.aura, this.vial, this.glow);
    this.group.visible = false;
    this.group.renderOrder = 999;
    for (const m of [this.vial, this.glow, ...this.drops.map((d) => d.mesh)]) m.renderOrder = 999;
    this.aura.renderOrder = 998;
    for (const m of [this.aura, this.glow, ...this.drops.map((d) => d.mesh)]) m.onBeforeRender = (_r, _s, camera: Camera): void => void m.quaternion.copy(camera.quaternion);
  }

  get active(): boolean {
    return this.state !== 'hidden';
  }

  get held(): boolean {
    return this.state === 'held';
  }

  /** Show the vial in the hand (it scales in). */
  hold(): void {
    this.state = 'held';
    this.t = 0;
    this.scale = 0.2;
    this.group.visible = true;
    this.vial.visible = true;
    this.aura.visible = true;
    this.glow.visible = false;
    for (const d of this.drops) d.mesh.visible = false;
  }

  /** Take the vial away (the action was cut short). */
  drop(): void {
    if (this.state === 'held') this.hide();
  }

  hide(): void {
    this.state = 'hidden';
    this.group.visible = false;
  }

  /** Throw from where the vial is now to `to` (world), over `ms` real milliseconds. */
  throwTo(to: { x: number; y: number; z: number }, ms: number): void {
    this.from.copy(this.vial.position);
    this.to.set(to.x, to.y, to.z);
    this.flightMs = Math.max(60, ms);
    this.state = 'flying';
    this.t = 0;
  }

  /** The held vial: at `hand` (world), its axis along `dir` (the way the fist points, a unit vector in x, y). Call before `update` each frame while held. */
  place(hand: { x: number; y: number; z: number }, dir: { x: number; y: number }): void {
    if (this.state !== 'held') return;
    this.vial.position.set(hand.x + dir.x * VIAL_H * 0.32, hand.y + dir.y * VIAL_H * 0.32, hand.z);
    this.vial.rotation.z = Math.atan2(dir.y, dir.x) - Math.PI / 2;
  }

  /** Advance by `dt` real seconds and keep the group under `parent` (the actor's parent, the scene). */
  update(dt: number, parent: Object3D | null): void {
    if (parent && this.group.parent !== parent) parent.add(this.group);
    if (this.state === 'hidden') return;
    this.t += dt * 1000;
    if (this.state === 'held') {
      this.scale += (1 - this.scale) * Math.min(1, dt * 14);
      this.vial.scale.setScalar(this.scale);
      this.aura.position.copy(this.vial.position);
      this.aura.scale.setScalar(this.scale * (1 + 0.08 * Math.sin(this.t / 90)));
      return;
    }
    if (this.state === 'flying') {
      const u = Math.min(1, this.t / this.flightMs);
      const e = u * (2 - u) * 0.35 + u * 0.65; // eases out a little: the throw leaves fast
      this.at.lerpVectors(this.from, this.to, e);
      this.at.y += 4 * (0.1 + 0.22 * this.from.distanceTo(this.to) * 0.5) * u * (1 - u);
      this.vial.position.copy(this.at);
      this.spin += dt * 17;
      this.vial.rotation.z = this.spin;
      this.vial.scale.setScalar(1 - 0.15 * u);
      this.aura.position.copy(this.at);
      this.aura.scale.setScalar(1 - 0.15 * u);
      if (u >= 1) this.burst();
      return;
    }
    // burst
    const u = Math.min(1, this.t / 380);
    this.glow.scale.setScalar(0.12 + 0.5 * u);
    (this.glow.material as MeshBasicMaterial).opacity = (1 - u) * 0.9;
    for (const d of this.drops) {
      d.v.y -= dt * 2.4;
      d.mesh.position.addScaledVector(d.v, dt);
      (d.mesh.material as MeshBasicMaterial).opacity = Math.max(0, 1 - u * 1.1);
    }
    if (u >= 1) this.hide();
  }

  private burst(): void {
    this.state = 'burst';
    this.t = 0;
    this.vial.visible = false;
    this.aura.visible = false;
    this.glow.visible = true;
    this.glow.position.copy(this.to);
    for (let i = 0; i < this.drops.length; i++) {
      const a = (i / this.drops.length) * Math.PI * 2;
      const d = this.drops[i]!;
      d.mesh.visible = true;
      d.mesh.position.copy(this.to);
      d.v.set(Math.cos(a) * (0.35 + 0.15 * (i % 3)), 0.5 + 0.25 * (i % 2), 0);
    }
  }

  dispose(): void {
    this.group.removeFromParent();
    for (const m of [this.vial, this.aura, this.glow, ...this.drops.map((d) => d.mesh)]) m.geometry.dispose();
    for (const m of this.mats) {
      m.map?.dispose();
      m.dispose();
    }
  }
}
