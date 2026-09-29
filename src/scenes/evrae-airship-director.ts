/**
 * **The range director: the Fahrenheit's deck switches between NEAR and FAR.**
 *
 * Game case: FFX only [AGENTS.md rule 14]; see `evrae-airship-range.ts`.
 *
 * The scene factory builds one of these and publishes it on its group
 * ({@link attachAirshipRange}), the same channel `StageArrivals.ts` uses for
 * Anima's arrival, so the battle screen's constructor does not widen. Whoever
 * holds the battle state (the preview, the scene's debug harness, and in a real
 * battle the presenter, see the integrator TODO in
 * `docs/handoff/chapter-evrae-scene.md` §6) calls {@link AirshipRangeDirector.sync}
 * after each event with the engine's state, and binds the camera and Evrae's
 * actor once they exist. The director does the rest:
 *
 * - the **camera**: the scene's generic `idle`, `action` and `enemy` rigs are
 *   replaced by the range's own, and the camera travels to its current rig, so
 *   every later `moveTo('idle')` the presenter makes lands on the right framing;
 * - **Evrae**: fades out where it was, swaps between the `idle-near` set and
 *   the `idle-far` painting, moves to the other range's spot, and fades in at
 *   the head-ratio scale (`farActorScale`);
 * - the **air**: the cloud layers' speed (the ship's speed) answers first, then
 *   the cold haze and the light blend over the camera move.
 *
 * Presentation only: it reads the state and never writes it.
 */

import { Color, type Object3D } from 'three';
import type { BattleCamera } from '../engine/BattleCamera.ts';
import { characterUrl, resolvePoseMap } from '../engine/BattlePresenterArt.ts';
import { artStatesFor } from '../engine/ArtManifest.ts';
import type { LightRig } from '../engine/Lighting.ts';
import type { PaintedActor } from '../engine/PaintedActor.ts';
import type { AirshipDeck } from './evrae-airship-sky.ts';
import { FallVeil } from './evrae-airship-fall.ts';
import {
  EVRAE_BASELINE_PX,
  EVRAE_WORLD_HEIGHT,
  RANGE_SHIFT_MS,
  RANGE_STAGING,
  airshipRangeOf,
  farActorScale,
  rangeShiftAt,
  type AirshipFlags,
  type AirshipRange,
} from './evrae-airship-range.ts';
import { evraeSubject, rangeSubjectFor, type RangeSubject } from './evrae-airship-subjects.ts';

const KEY = 'pyrefly:airship-range';

/**
 * The rim-strength uniform of a painted actor. `PaintedActor` keeps its
 * uniforms private and has no getter; this chapter-local read avoids growing
 * that 1,600-line shared file for one boss (house style, rule 7).
 */
function rimOf(actor: PaintedActor): { value: number } | null {
  return (actor as unknown as { u?: { rimStrength?: { value: number } } }).u?.rimStrength ?? null;
}

/**
 * A Fin's wide FAR painting is Sin in flight, not a body on the floor: never lay it to rest (`PaintedRest`) as a
 * prone pose. `PaintedActor` keeps its sizing extents private and has no setter; this chapter-local write, like
 * {@link rimOf}'s read, avoids growing that shared file for one boss (rule 7). It only widens the prone threshold
 * of the Sin actors it is handed (the bound Fin here; Genais, the Core and the head in
 * `app/screens/BattleScreenSinPoses.ts`), whose poses are all upright paintings; the next re-layout applies it.
 */
export function keepUpright(actor: PaintedActor): void {
  const extents = (actor as unknown as { extents?: { proneAspect: number } }).extents;
  if (extents) extents.proneAspect = Number.POSITIVE_INFINITY;
}

/** The rigs a range owns, under the scene's generic names. */
const RANGE_RIGS = ['idle', 'action', 'enemy'] as const;

/** Poses that turn into the FAR streak while FAR holds; `ko` keeps its own painting. */
const FAR_POSES = ['idle', 'attack', 'cast', 'hurt'] as const;

export class AirshipRangeDirector {
  private range: AirshipRange = 'near';
  private from: AirshipRange = 'near';
  private shiftMs = -1;
  private camera: BattleCamera | null = null;
  private evrae: PaintedActor | null = null;
  /** Who is bound, and how it is staged (`evrae-airship-subjects.ts`): Evrae, or one of Sin's Fins. */
  private subject: RangeSubject = evraeSubject();
  private nearPoses: Record<string, string> | null = null;
  /** The telegraph painting's URL per range, when the subject has one there; see {@link sync}. */
  private chargeUrls: Partial<Record<AirshipRange, string>> = {};
  private charged = false;
  /** Evrae's rim strength as the stage set it; `null` until bound. See {@link quietRimOnKo}. */
  private rimBase: number | null = null;
  /** Set once the swapped poses have loaded; the fade-in waits for it. */
  private readyAtMs = -1;
  private swapToken = 0;
  private readonly keyFrom = new Color();
  private readonly keyTo = new Color();
  /** The cloud Evrae falls through at its defeat (D-031, `evrae-airship-fall.ts`). */
  private readonly veil: FallVeil;

  constructor(
    private readonly deck: AirshipDeck,
    private readonly lights: LightRig,
  ) {
    this.veil = new FallVeil(deck.group);
    this.applyBlend('near', 'near', 1, 1);
  }

  /** The range the field is showing (or moving to). */
  get current(): AirshipRange {
    return this.range;
  }

  /** True while a shift is still playing. */
  get shifting(): boolean {
    return this.shiftMs >= 0;
  }

  /** Hand over the battle camera. Installs the current range's rigs. */
  bindCamera(camera: BattleCamera | null): void {
    this.camera = camera;
    if (camera) this.installRigs(this.range, true);
  }

  /**
   * Hand over the range foe's actor. It is placed on the current range's spot at once. `id` is Evrae's art
   * folder (Chapter VIII, the default) or a Fin's combatant id (`left-fin`, `right-fin`: Chapter XVII), which
   * picks that Fin's paintings and sizes ({@link rangeSubjectFor}).
   */
  async bindEvrae(actor: PaintedActor | null, id = 'evrae', worldHeight = EVRAE_WORLD_HEIGHT): Promise<void> {
    this.evrae = actor;
    const subject = rangeSubjectFor(id, id, worldHeight);
    this.subject = subject;
    this.rimBase = actor ? (rimOf(actor)?.value ?? null) : null;
    if (!actor) return;
    this.nearPoses = await resolvePoseMap(subject.artId, 'enemy');
    const states = await artStatesFor(subject.artId);
    const has = (state: string): boolean => (states === null ? !subject.strict : states.includes(state));
    // A Fin whose paintings are not installed keeps Evrae's sizes, so its silhouette stands where it always did.
    if (subject.strict && !has('idle-near')) this.subject = { ...evraeSubject(subject.artId), chargedOf: subject.chargedOf, charge: {} };
    if (this.subject.upright) keepUpright(actor);
    this.chargeUrls = {};
    for (const range of ['near', 'far'] as const) {
      const pose = this.subject.charge[range];
      if (pose && has(pose)) this.chargeUrls[range] = characterUrl(subject.artId, pose);
    }
    await this.placeEvrae(this.range);
  }

  /** Follow the engine: call after every event with the state it left. */
  sync(state: AirshipFlags | null | undefined): void {
    const r = airshipRangeOf(state);
    if (r && r !== this.range) this.setRange(r);
    this.quietRimOnKo();
    // **Inhale's telegraph** [research §3.3 note 4, §12.2]: while the breath is
    // charged at NEAR, Evrae rests on the breath-charge painting (the idle
    // slot, so the presenter's own attack/hurt beats still play over it). At
    // FAR the breath whiffs, and the far streak stays. A Fin's core glows at
    // either range while `sin.fin.charged` holds (research §9.3).
    const charged = this.subject.chargedOf(state);
    if (charged === this.charged) return;
    this.charged = charged;
    if (this.chargeUrls[this.range] && this.shiftMs < 0) void this.placeEvrae(this.range);
  }

  /**
   * No rim light on the KO painting. It is mostly coils and holes, and the
   * stage's rim lights every interior alpha edge: measured in the browser on
   * the same frame, rim on reads as bright blue-white outlines along every
   * coil, rim off as the painting (critic 2026-09-23; `rim-ko-compare.png`
   * under `critic/scratch/evrae/fix/shots/`). Every other pose keeps it.
   */
  private quietRimOnKo(): void {
    const rim = this.evrae ? rimOf(this.evrae) : null;
    if (!rim || this.rimBase === null) return;
    rim.value = this.evrae!.pose === 'ko' ? 0 : this.rimBase;
  }

  /** Move the field to `range`. `immediate` snaps (a battle opening, a screenshot). */
  setRange(range: AirshipRange, opts: { immediate?: boolean } = {}): void {
    if (range === this.range && this.shiftMs < 0) return;
    this.from = this.range;
    this.range = range;
    this.swapToken++;
    if (opts.immediate) {
      this.shiftMs = -1;
      this.installRigs(range, true);
      this.applyBlend(range, range, 1, 1);
      this.evrae?.setAlpha(1);
      void this.placeEvrae(range);
      return;
    }
    this.shiftMs = 0;
    this.readyAtMs = -1;
    this.installRigs(range, false);
  }

  /** @param dt seconds */
  update(dt: number): void {
    this.veil.update(dt, this.evrae, [...this.subject.spot[this.range]], this.shiftMs >= 0);
    if (this.shiftMs < 0) return;
    this.shiftMs += dt * 1000;
    const s = rangeShiftAt(this.shiftMs);
    this.applyBlend(this.from, this.range, s.blend, s.wind);
    const actor = this.evrae;
    if (actor) {
      if (!s.swapped) {
        actor.setAlpha(s.evraeAlpha);
      } else {
        if (this.readyAtMs < 0 && this.readyAtMs !== -2) {
          this.readyAtMs = -2; // loading
          const token = this.swapToken;
          void this.placeEvrae(this.range).then(() => {
            if (token === this.swapToken) this.readyAtMs = this.shiftMs;
          });
        }
        const t = this.readyAtMs >= 0 ? (this.shiftMs - this.readyAtMs) / RANGE_SHIFT_MS.fadeInMs : 0;
        const k = Math.max(0, Math.min(1, t));
        actor.setAlpha(k * k * (3 - 2 * k));
        if (this.readyAtMs >= 0 && k >= 1 && s.blend >= 1) this.finish();
        return;
      }
    }
    if (!actor && s.done) this.finish();
  }

  private finish(): void {
    this.shiftMs = -1;
    this.evrae?.setAlpha(1);
    this.applyBlend(this.range, this.range, 1, 1);
  }

  private installRigs(range: AirshipRange, snap: boolean): void {
    const cam = this.camera;
    if (!cam) return;
    const rigs = RANGE_STAGING[range].rigs;
    for (const name of RANGE_RIGS) cam.addRig(name, rigs[name]);
    const current = cam.rigName;
    if (!(RANGE_RIGS as readonly string[]).includes(current)) return;
    if (snap) cam.snapTo(current);
    else void cam.moveTo(current, RANGE_SHIFT_MS.cameraMs, 'cubicInOut');
  }

  /** Swap Evrae's paintings to `range`'s and put it on that range's spot. */
  private async placeEvrae(range: AirshipRange): Promise<void> {
    const actor = this.evrae;
    if (!actor) return;
    if (actor.lifeState === 'down') return;
    const subject = this.subject;
    const spot = subject.spot[range];
    const charge = this.charged ? this.chargeUrls[range] : undefined;
    if (range === 'far') {
      const far = characterUrl(subject.artId, 'idle-far');
      const map: Record<string, string> = {};
      for (const p of FAR_POSES) map[p] = far;
      if (charge) map['idle'] = charge; // a Fin's lit core; same crop as idle-far, so the size holds
      await actor.loadPoses(map, 'idle');
      // While FAR is the reference pose the actor sizes it to the boss height
      // (and clamps its long side), so measure what it did and correct to the
      // subject's FAR width (Evrae: NEAR's pixel scale times EVRAE_FAR_HEAD_RATIO).
      actor.scale.setScalar(1);
      const drawnWidth = actor.poseSize[0];
      actor.scale.setScalar(drawnWidth > 0 ? subject.farWidth / drawnWidth : farActorScale(EVRAE_BASELINE_PX.near, EVRAE_BASELINE_PX.far));
    } else {
      const near = this.nearPoses ?? (await resolvePoseMap(subject.artId, 'enemy'));
      this.nearPoses = near;
      const map: Record<string, string> = {};
      for (const p of FAR_POSES) if (near[p]) map[p] = near[p]!;
      if (charge) map['idle'] = charge;
      await actor.loadPoses(map, 'idle');
      actor.scale.setScalar(subject.nearScale);
    }
    actor.position.set(spot[0], spot[1], spot[2]);
  }

  private applyBlend(from: AirshipRange, to: AirshipRange, blend: number, wind: number): void {
    const a = RANGE_STAGING[from];
    const b = RANGE_STAGING[to];
    const mix = (x: number, y: number, t: number): number => x + (y - x) * t;
    this.deck.wind = mix(a.wind, b.wind, wind);
    this.deck.setHaze(mix(a.haze, b.haze, blend));
    this.keyFrom.setHex(a.key.color);
    this.keyTo.setHex(b.key.color);
    this.lights.key.color.copy(this.keyFrom).lerp(this.keyTo, blend);
    this.lights.key.intensity = mix(a.key.intensity, b.key.intensity, blend);
    this.lights.ambient.intensity = mix(a.ambient, b.ambient, blend);
  }

  dispose(): void {
    this.veil.dispose();
    this.swapToken++;
    this.camera = null;
    this.evrae = null;
  }
}

/** Publish a director on the scene's group (or any node above the actors). */
export function attachAirshipRange(node: Object3D, director: AirshipRangeDirector): void {
  node.userData[KEY] = director;
}

/**
 * The director a scene published anywhere under `root`, or `null` for every
 * scene without a range mechanic. The presenter's one-line hook uses this.
 */
export function airshipRangeDirectorOf(root: Object3D): AirshipRangeDirector | null {
  let found: AirshipRangeDirector | null = null;
  root.traverse((o) => {
    if (!found && o.userData[KEY] instanceof AirshipRangeDirector) found = o.userData[KEY] as AirshipRangeDirector;
  });
  return found;
}
