/**
 * CAMERA LAB: the director, three-side. It owns the battle camera during lab shots.
 *
 * Each frame (after the field has updated, before the render): it takes the cut the rules allow
 * (`LabDirectorCore.due`), solves the shot's rig from where the figures stand
 * (`labGeometry.solveShot`), snaps the battle camera to it (a cut, never a flight), picks each
 * figure's front or rear painting, then turns every plane square to the lens and lays Clair
 * Obscur's slow drift on top of the camera, after `BattleCamera` has placed it, so the rest pose
 * the HUD lays out against never moves (fb2-0929).
 *
 * REDUCE MOTION turns the drift and the slow-down off. Nothing here exists outside a lab battle.
 */

import { Vector3, type PerspectiveCamera } from 'three';
import type { BattleCamera } from '../BattleCamera.ts';
import type { CameraPort } from '../BattlePresenterPorts.ts';
import type { PaintedActor } from '../PaintedActor.ts';
import { anticipateView } from '../StageArt.ts';
import { likelyShots } from './anticipate.ts';
import { LabCamera } from './LabCamera.ts';
import { LabDirectorCore, type LabCut } from './LabDirectorCore.ts';
import { viewFor, type LabFigure, type LabRig, type LabStageView, type V3 } from './labGeometry.ts';
import { solveShot } from './labShots.ts';
import { STYLE_TUNING, isBigAbility, type LabChapter } from './labChapters.ts';
import { PaintingViews } from './paintingViews.ts';
import type { LabBeat, LabCameraPort, LabSwitches, ShotRequest } from './LabTypes.ts';

/** The rig name lab shots are registered under. */
export const LAB_RIG = 'lab-shot';
/** Drift: speed (units/s) and the most it may travel inside one shot. Far inside D-291's 20 deg/s. */
const DRIFT_SPEED = 0.045;
const DRIFT_MAX = 0.22;
/**
 * Release 39: the lab asks the art governor for the masters its likely shots need, and asks in the frame a load slot is free. The governor starts at most
 * two loads at a time and its own update refills a free slot with a background pose within a frame, so a request made on a timer found both slots taken
 * (measured: the first HERO CLOSE of a fight landed on the 2x master). A pass that starts nothing means nothing is wanted: the asking rests this long.
 */
const ANTICIPATE_REST = 0.5;
/** Clair Obscur's slow-down on the hit: the field runs at this rate for this long. */
const SLOW_RATE = 0.35;
const SLOW_MS = 260;

/** What the director reads from the field (the painted stage, without depending on its class). */
export interface LabFieldPort {
  staged(): string[];
  actor(id: string): PaintedActor | undefined;
  sideOf(id: string): 'party' | 'enemy' | 'aeon' | undefined;
}

export interface LabDirectorOptions {
  chapter: LabChapter;
  battleCamera: BattleCamera;
  camera: PerspectiveCamera;
  field: LabFieldPort;
  switches: () => Readonly<LabSwitches>;
  /** 1 normal, 0.32 fast, 0 skip. */
  speedScale: () => number;
  reduceMotion: () => boolean;
  /** Canvas width / height. */
  aspect: () => number;
  /** The headline boss id. */
  bossId: () => string | null;
  /** Is this combatant alive (the engine's word)? */
  alive: (id: string) => boolean;
  /** A cut just landed (the menu at the hero re-anchors on the next frame). */
  onCut?: (cut: LabCut, rig: LabRig) => void;
  /** Release 39: ask the art governor for the masters the shots ahead will need (default on; `?labart=off` turns it off for a comparison). */
  anticipate?: boolean;
}

const v3 = (v: { x: number; y: number; z: number }): V3 => ({ x: v.x, y: v.y, z: v.z });

export class LabDirector {
  readonly core: LabDirectorCore;
  readonly views: PaintingViews;
  private readonly o: LabDirectorOptions;
  private readonly t0 = performance.now();
  private shotAt = 0;
  private driftDir = new Vector3();
  private slowUntil = 0;
  private readonly scratch = new Vector3();
  private antiRest = 0;
  private antiEmpty = 0;
  private antiCursor = 0;
  /** Release 39: views handed to the art governor so far, and what asking costs (milliseconds per frame, an exponential mean; debug snapshot). */
  anticipated = 0;
  private antiMs = 0;
  private antiTotalMs = 0;
  private antiPasses = 0;
  private antiSeconds = 0;
  private solveMs = 0;
  private viewMs = 0;
  private viewCount = 0;
  /** The rig of the shot on screen (debug snapshot). */
  rig: LabRig | null = null;

  constructor(o: LabDirectorOptions) {
    this.o = o;
    this.views = new PaintingViews(o.chapter);
    this.core = new LabDirectorCore({
      game: o.chapter.game,
      now: () => performance.now() - this.t0,
      switches: o.switches,
      speedScale: o.speedScale,
      bossId: o.bossId,
      allPartyRear: () => this.allPartyRear(),
      sideOf: (id) => o.field.sideOf(id) ?? null,
      bigAbility: (id, name) => isBigAbility(o.chapter, id, name),
    });
  }

  /** The presenter's port. */
  readonly port: LabCameraPort = {
    beat: (b: LabBeat): void => {
      try {
        if (b.kind === 'art') this.views.artChanged(b.id, b.artId, this.o.field.actor(b.id));
        this.core.beat(b);
      } catch (err) {
        console.warn('[camera-lab] beat failed', err);
      }
    },
  };

  /** The camera the presenter sees: its framing passes only while the lab yields. */
  wrapCamera(inner: CameraPort): LabCamera {
    return new LabCamera(inner, { yielding: () => this.core.yielding });
  }

  private allPartyRear(): boolean {
    if (!this.o.switches().views) return false;
    return this.figures()
      .filter((f) => f.side !== 'enemy' && f.standing)
      .every((f) => f.hasRear);
  }

  /** The field as the geometry reads it. */
  figures(): LabFigure[] {
    const out: LabFigure[] = [];
    const views = this.o.switches().views;
    for (const id of this.o.field.staged()) {
      const a = this.o.field.actor(id);
      const side = this.o.field.sideOf(id);
      if (!a || !side) continue;
      const standing = this.o.alive(id) && a.alpha > 0.05 && a.lifeState !== 'down';
      out.push({ id, pos: v3(a.position), height: a.height, side, standing, hasRear: views && this.views.hasRear(id) });
    }
    return out;
  }

  private stageView(): LabStageView {
    const bc = this.o.battleCamera;
    const idle = bc.getRig('idle');
    const toArr = (p: unknown): [number, number, number] =>
      Array.isArray(p) ? (p as [number, number, number]) : [(p as V3).x, (p as V3).y, (p as V3).z];
    const idleRig: LabRig = idle
      ? { position: toArr(idle.position), lookAt: toArr(idle.lookAt), fov: idle.fov ?? this.o.camera.fov }
      : { position: [0, 3.05, 9.5], lookAt: [0.15, 1.35, -1.2], fov: 32 };
    return {
      figures: this.figures(),
      bossId: this.o.bossId(),
      aspect: this.o.aspect(),
      viewer: { x: idleRig.position[0], y: idleRig.position[1], z: idleRig.position[2] },
      idleRig,
      partyShoulder: this.o.chapter.partyShoulder,
      band: this.o.chapter.band,
    };
  }

  /** Per frame, after the field and the camera have updated. */
  update(dt: number): LabCut | null {
    let landed: LabCut | null = null;
    try {
      const cut = this.core.due();
      if (cut) {
        this.apply(cut);
        landed = cut;
      }
      if (this.core.takeSlow() && !this.o.reduceMotion()) this.slowUntil = performance.now() + SLOW_MS;
      this.drift();
      this.views.faceLens(this.actors(), this.o.camera);
      this.o.camera.updateMatrixWorld(true);
    } catch (err) {
      console.warn('[camera-lab] frame failed', err);
    }
    void dt;
    return landed;
  }

  /**
   * Release 39: the 3x and 4x masters the shots ahead of this actor's menu will need, asked for now so they are resident when the cut lands
   * and not a moment after it. Each likely shot (`likelyShots`: the grammar's own answers for the beats a menu leads to) is solved from where
   * the figures stand and handed to `StageArt.anticipateView`, which measures it from a camera that is not on screen yet and starts the loads.
   * Returns how many views were handed over.
   */
  anticipate(actorId: string): number {
    const view = this.stageView();
    const standing = (enemy: boolean): string[] => view.figures.filter((f) => f.standing && (f.side === 'enemy') === enemy).map((f) => f.id);
    const enemies = standing(true).sort((a, b) => Number(b === view.bossId) - Number(a === view.bossId));
    const tune = STYLE_TUNING[this.o.switches().style];
    let n = 0;
    const list = likelyShots(this.o.chapter.game, { actorId, enemies, party: standing(false) }, this.core.grammarContext());
    for (const req of list) {
      const t0 = performance.now();
      const rig = solveShot(req, view, tune);
      const t1 = performance.now();
      anticipateView({ pos: new Vector3(...rig.position), look: new Vector3(...rig.lookAt), fov: rig.fov });
      this.solveMs += (t1 - t0 - this.solveMs) * 0.01;
      this.viewMs += (performance.now() - t1 - this.viewMs) * 0.01;
      n++;
    }
    this.viewCount = n;
    this.anticipated += n;
    return n;
  }

  /**
   * Every frame, before the stage's own update (`BattleScreen`), when `slotFree()` says the governor can start a load: while a menu is open, ask for its
   * actor's likely shots; before the first menu and between turns, for each standing party member in turn, so the first hero shot of the fight lands on
   * resident masters too. A whole round that starts nothing rests the asking for half a second (a pass costs a few milliseconds; resident and in-flight
   * masters cost nothing to ask for but the measuring).
   */
  tickAnticipation(dt: number, slotFree: () => boolean, inflight: () => number): void {
    if (this.o.anticipate === false) return;
    this.antiSeconds += dt;
    this.antiRest -= dt;
    if (this.antiRest > 0 || !slotFree()) return;
    try {
      const t0 = performance.now();
      const menu = this.core.menuOpen ? this.core.menuActor : null;
      const party = menu ? [] : this.figures().filter((f) => f.side !== 'enemy' && f.standing);
      const actor = menu ?? (party.length ? party[this.antiCursor++ % party.length]!.id : null);
      if (actor) {
        const before = inflight();
        this.anticipate(actor);
        this.antiEmpty = inflight() > before ? 0 : this.antiEmpty + 1;
        if (this.antiEmpty >= Math.max(1, party.length)) {
          this.antiRest = ANTICIPATE_REST;
          this.antiEmpty = 0;
        }
      }
      const spent = performance.now() - t0;
      this.antiMs += (spent - this.antiMs) * 0.05;
      this.antiTotalMs += spent;
      this.antiPasses++;
    } catch (err) {
      console.warn('[camera-lab] anticipation failed', err);
    }
  }

  /** The field's clock: Clair Obscur's short slow-down on a hit. */
  fieldDt(dt: number): number {
    return performance.now() < this.slowUntil ? dt * SLOW_RATE : dt;
  }

  private actors(): PaintedActor[] {
    const out: PaintedActor[] = [];
    for (const id of this.o.field.staged()) {
      const a = this.o.field.actor(id);
      if (a) out.push(a);
    }
    return out;
  }

  /** Cut to a shot: solve, register, snap; then each figure's painting for it. */
  private apply(cut: LabCut): void {
    const view = this.stageView();
    const rig = solveShot(cut.shot, view, STYLE_TUNING[this.o.switches().style]);
    const bc = this.o.battleCamera;
    bc.addRig(LAB_RIG, { position: rig.position, lookAt: rig.lookAt, fov: rig.fov, sway: 0 });
    bc.release(0); // a held push or roll from an authored moment ends with the cut
    bc.snapTo(LAB_RIG);
    this.rig = rig;
    this.shotAt = performance.now();
    this.pickDrift(rig, cut.shot);
    this.choosePaintings(view, rig, cut.shot);
    this.o.onCut?.(cut, rig);
  }

  /** Front or rear for every figure, from where this shot's lens stands. */
  private choosePaintings(view: LabStageView, rig: LabRig, shot: ShotRequest): void {
    const cam: V3 = { x: rig.position[0], y: rig.position[1], z: rig.position[2] };
    const boss = view.figures.find((f) => f.id === view.bossId) ?? view.figures.find((f) => f.side === 'enemy');
    const party = view.figures.filter((f) => f.side !== 'enemy');
    const centre = party.length ? party.reduce((s, f) => ({ x: s.x + f.pos.x / party.length, y: 0, z: s.z + f.pos.z / party.length }), { x: 0, y: 0, z: 0 }) : null;
    for (const f of view.figures) {
      const actor = this.o.field.actor(f.id);
      if (shot.kind === 'victory' || f.side === 'enemy') {
        this.views.show(f.id, actor, false);
        continue;
      }
      // A party figure faces its foe: the boss (the enemies, when the boss is gone).
      const faceTarget = boss?.pos ?? centre;
      const pose = actor?.pose ?? 'idle';
      const standingPose = !/^(attack|cast|item|victory|overdrive)/.test(pose);
      this.views.show(f.id, actor, standingPose && viewFor(f, cam, faceTarget) === 'rear');
    }
  }

  private pickDrift(rig: LabRig, shot: ShotRequest): void {
    if (!shot.drift) {
      this.driftDir.set(0, 0, 0);
      return;
    }
    // A slow push toward the subject plus a small truck to the side.
    const fwd = this.scratch.set(rig.lookAt[0] - rig.position[0], 0, rig.lookAt[2] - rig.position[2]).normalize();
    const side = new Vector3(-fwd.z, 0, fwd.x);
    this.driftDir.copy(fwd).multiplyScalar(0.8).addScaledVector(side, 0.45).normalize();
  }

  /** Clair Obscur's drift, after `BattleCamera` has placed the camera (so its rest pose never moves). */
  private drift(): void {
    if (this.driftDir.lengthSq() === 0 || this.o.reduceMotion() || this.core.yielding) return;
    const t = (performance.now() - this.shotAt) / 1000;
    const k = Math.min(DRIFT_MAX, t * DRIFT_SPEED);
    this.o.camera.position.addScaledVector(this.driftDir, k);
  }

  /** Re-ask the shot after a switch flip (rules permitting) and re-pick the paintings. */
  switchesChanged(): void {
    this.core.refresh();
    const cur = this.core.current;
    if (cur && this.rig && !this.core.yielding) this.choosePaintings(this.stageView(), this.rig, cur);
    if (!this.o.switches().views) for (const a of this.actors()) a.setViewPose(null);
  }

  /** For the debug API and the captures. */
  snapshot(): Record<string, unknown> {
    return {
      yielding: this.core.yielding,
      menuOpen: this.core.menuOpen,
      level: this.core.level,
      aim: this.core.aim,
      shot: this.core.current,
      rig: this.rig,
      beat: this.core.beatNumber,
      anticipated: this.anticipated,
      anticipateMs: Math.round(this.antiMs * 1000) / 1000,
      anticipateLoad: { passes: this.antiPasses, totalMs: Math.round(this.antiTotalMs), perSecondMs: this.antiSeconds ? Math.round((this.antiTotalMs / this.antiSeconds) * 100) / 100 : 0 },
      anticipateParts: { solveEachMs: Math.round(this.solveMs * 1000) / 1000, viewEachMs: Math.round(this.viewMs * 1000) / 1000, views: this.viewCount },
      counts: { ...this.core.counts },
      views: Object.fromEntries(this.actors().map((a) => [a.name, a.viewPoseName ?? 'front'])),
      log: this.core.log.slice(-12),
    };
  }

  dispose(): void {
    this.views.dispose();
  }
}
