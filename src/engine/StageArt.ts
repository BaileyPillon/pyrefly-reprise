import { PerspectiveCamera, Vector3 } from 'three';
import type { BattleCamera } from './BattleCamera.ts';
import { artBudget, forcedArtScale, maxTextureSize } from './ArtDevice.ts';
import { ArtGovernor, type GovernedActor } from './ArtGovernor.ts';
import { pickScale, requiredScale } from './ArtBudget.ts';
import { artScalesForNow } from './ArtTier.ts';
import { loadPixels } from './PaintedArt.ts';

/**
 * A battle stage's art governor, wired (release 39; both games, shared plumbing).
 *
 * `ArtGovernor` is the rule; this is the plumbing: the stage's actors, its camera and the canvas it draws on, the device's
 * budget and the manifest. It also plans ahead, once the figures are on the field:
 *
 * - **every rig** the battle camera has (idle, action, party, enemy, victory ...), as it rests, so the master a rig will ask for is
 *   resident before the camera gets there (a punch or a shake bounces a figure up for a third of a second: the live governor does
 *   not chase it, and neither does the plan);
 * - **the held shots by size**: the FFX Overdrive shot frames its subject at up to 72 percent of the frame's height and the FFX-2
 *   dressphere shot at up to 68 percent (`fx/mix/heldShots.ts`), so each party member's master for that size is asked for up front;
 * - **the colossus master**: `anticipateView` takes the MaxMix framing's chosen master pose the moment it is installed.
 */

/** The FFX Overdrive shot and the FFX-2 dressphere shot's largest framings, as a fraction of the frame's height (`heldShots.ts`). */
export const SHOT_FRACTION = { ffx: 0.72, ffx2: 0.68 } as const;
/** The game's largest usual dolly, the fraction of the way to the subject (`BattleCamera.punch`'s default); the rig table shows a rig pushed in by it. */
const PUSH = 0.12;
/** Frames after the stage is up before the plan runs (the figures need a moment to stand and load). */
const PLAN_AFTER = 30;

export interface StageArtDeps {
  actors: () => Iterable<GovernedActor>;
  party: () => Iterable<GovernedActor>;
  camera: PerspectiveCamera;
  canvas: { height: number };
  battleCamera: BattleCamera;
  game?: 'ffx' | 'ffx2' | string;
}

let active: StageArt | null = null;

/** A camera view that has not been cut to yet (MaxMix's chosen master); the live stage's governor measures it. A no-op with no stage. */
export function anticipateView(view: { pos: Vector3; look: Vector3; fov: number }): void {
  active?.anticipateView(view);
}

export class StageArt {
  readonly governor: ArtGovernor;
  private readonly deps: StageArtDeps;
  private readonly probe: PerspectiveCamera;
  private frames = 0;
  private ticks = 0;
  private sig = '';
  private planned = false;
  private master: { pos: Vector3; look: Vector3; fov: number } | null = null;

  constructor(deps: StageArtDeps) {
    this.deps = deps;
    this.probe = new PerspectiveCamera(deps.camera.fov, deps.camera.aspect, deps.camera.near, deps.camera.far);
    this.governor = new ArtGovernor({
      actors: deps.actors,
      camera: () => deps.camera,
      bufferHeight: () => deps.canvas.height,
      budget: artBudget,
      scalesFor: artScalesForNow,
      load: (url, scale) => loadPixels(url, scale),
      pinned: () => forcedArtScale() !== null,
      maxTexture: maxTextureSize,
    });
    active = this;
  }

  update(): void {
    this.governor.update();
    // The plan runs once the figures are on the field and have stood for a moment, and again when who is on the field changes
    // (an arrival, a part, a form change): the stage builds its actors after it is made, so a plan on a timer alone ran on nothing.
    if (++this.ticks % 10 === 0) {
      const sig = this.signature();
      if (sig !== this.sig) {
        this.sig = sig;
        this.frames = 0;
        this.planned = false;
      }
    }
    if (!this.planned && this.sig !== '' && ++this.frames >= PLAN_AFTER) {
      this.planned = true;
      this.plan();
    }
  }

  /** Who is on the field, as a string: the number of figures and of their paintings (empty with none). */
  private signature(): string {
    let figures = 0;
    let paintings = 0;
    for (const a of this.deps.actors()) {
      figures++;
      paintings += a.paintings().length;
    }
    return figures ? `${figures}:${paintings}` : '';
  }

  /** Run the plan again (the formation changed, or a capture wants it now). */
  plan(): void {
    this.anticipateRigs();
    this.anticipateShots();
    if (this.master) this.view(this.master.pos, this.master.look, this.master.fov);
  }

  /** Every rig, as it rests, measured against the figures where they stand. */
  anticipateRigs(): void {
    const bc = this.deps.battleCamera;
    for (const name of bc.rigNames) {
      const rig = bc.getRig(name);
      if (!rig) continue;
      const pos = rig.position instanceof Vector3 ? rig.position : new Vector3(...rig.position);
      const look = rig.lookAt instanceof Vector3 ? rig.lookAt : new Vector3(...rig.lookAt);
      this.view(pos, look, rig.fov ?? this.deps.camera.fov);
    }
  }

  /** For the tables: every rig, at rest and pushed in, with what each drawn figure is magnified to from there (no loads asked for). */
  rigReport(): Array<{ rig: string; push: number; fov: number; figures: Array<{ url: string; scale: number; px1x: number; mag: number }> }> {
    const bc = this.deps.battleCamera;
    const out: ReturnType<StageArt['rigReport']> = [];
    for (const name of bc.rigNames) {
      const rig = bc.getRig(name);
      if (!rig) continue;
      const pos = rig.position instanceof Vector3 ? rig.position : new Vector3(...rig.position);
      const look = rig.lookAt instanceof Vector3 ? rig.lookAt : new Vector3(...rig.lookAt);
      for (const push of [0, PUSH]) {
        const fov = rig.fov ?? this.deps.camera.fov;
        const p = this.probe;
        p.fov = fov;
        p.aspect = this.deps.camera.aspect;
        p.updateProjectionMatrix();
        p.position.lerpVectors(pos, look, push);
        p.lookAt(look);
        p.updateMatrixWorld(true);
        out.push({ rig: name, push, fov, figures: this.governor.measureFrom(p) });
      }
    }
    return out;
  }

  /**
   * For the tables: every painting the party holds with the height of its painted content in approved (1x) texels and the master it
   * holds, so a held shot's magnification (`frac x buffer height / content height`, per master) is arithmetic on the caller's side.
   */
  shotTable(): Array<{ url: string; scale: number; contentH1x: number }> {
    const out: Array<{ url: string; scale: number; contentH1x: number }> = [];
    for (const actor of this.deps.party()) {
      for (const g of actor.paintings()) {
        const c = g.painted.meta.content;
        out.push({ url: g.painted.url, scale: Math.max(1, Math.round(Number(g.painted.texture.userData['artScale'] ?? 1))), contentH1x: c ? c.y1 - c.y0 : g.painted.meta.height });
      }
    }
    return out;
  }

  /** The held shots' largest framings, as each party member's master for that size. */
  anticipateShots(): void {
    const frac = this.deps.game === 'ffx2' ? SHOT_FRACTION.ffx2 : this.deps.game === 'ffx' ? SHOT_FRACTION.ffx : 0;
    if (frac > 0) this.governor.anticipateSize(this.deps.party(), frac);
  }

  /** A view that has not been cut to yet (the MaxMix master). It is measured now and again with every plan: the figures may not be up when it arrives. */
  anticipateView(v: { pos: Vector3; look: Vector3; fov: number }): void {
    this.master = { pos: v.pos.clone(), look: v.look.clone(), fov: v.fov };
    this.view(v.pos, v.look, v.fov);
  }

  private view(pos: Vector3, look: Vector3, fov: number): void {
    const p = this.probe;
    p.fov = fov;
    p.aspect = this.deps.camera.aspect;
    p.updateProjectionMatrix();
    p.position.copy(pos);
    p.lookAt(look);
    p.updateMatrixWorld(true);
    this.governor.anticipate(p);
  }

  /** The master a painting of this content height would be asked for at `frac` of the frame (for the plan's logging and the tests). */
  static scaleFor(frac: number, bufferHeight: number, contentHeight1x: number, available: readonly number[], cap: number): number {
    return pickScale(requiredScale((frac * bufferHeight) / Math.max(1, contentHeight1x)), available, cap);
  }

  dispose(): void {
    this.governor.dispose();
    if (active === this) active = null;
  }
}
