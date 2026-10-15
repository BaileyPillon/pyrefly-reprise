/**
 * **The stage's side of the boss entrance** (E-PYRE, decision 61e; the look is `entranceLook.ts`, whose figures are `entranceCanon.ts`'s).
 *
 * Today an enemy or an aeon the stage builds for a fight (`PaintedStage.stage`: the first formation, and every link of a chain, which re-stages the field)
 * is on it at full strength from the frame it is built: it appears whole, and whatever the scene does to it afterwards (Overdrive Sin's painting is
 * loaded and placed a few frames after the field is up, FFX-2's giants are re-sized by CHAPTER FRAMING's plan some 0.6 s after the figures change, Anima's
 * 2.8 times) is a one-frame jump of hundreds of px on the figure itself: round 25's PR-0380, 341.8 px for Sin, 967.7 for Anima, 355.4 for Paragon.
 *
 * So the stage **holds** each of them from the moment it is built (`hold`): the figure rests at `HOLD_ALPHA` with its dissolve fully up, which is no
 * figure on the field to the player, the continuity probe and the art governor, and a figure whose painting and shader are already warm. Whatever the
 * scene does to its size and place while it is held is unseen. The opening then lets them in (`enter`, called by `BattleMoments.battleStart`): each plays
 * its entrance once it has stood still (its transform unchanged for {@link QUIET_MS}, and {@link MIN_AGE_MS} since it was built, or {@link PATIENCE_MS}
 * after the opening began, whichever is first), so a plan that lands late is not played over. Nothing waits for an entrance: it runs inside the opening's
 * own 2.3 s (the party's slide-in, the hold and the reveal's push), a hurried or skipped opening (a Confirm press, `'skip'` speed) shows the figures at once
 * (`enter(true)`, `settle(true)`), and an ordinary opening's end lets an entrance still on its way finish beside the first menu (`settle(false)`: it cuts
 * nothing short and begins a figure the gate was still holding), so no entrance adds a moment before the first menu.
 *
 * **CHAPTER FRAMING's plan is waited for, not guessed at** (FOC44A-05 of the focused review of 7758791e). Those times are a guess at when the plan lands, and they were
 * a bad one: the plan decides only once every figure stands at its place (the party's slide-in is done) and 0.6 s after the figures last changed, so it landed 1.0 to
 * 1.7 s after the screen came up, after the 900 ms gate had opened whenever the opening came early (Enter on the card) or the machine was slow, and Paragon's size
 * step (1 to 3.047) then fell on a figure 19 to 95 percent gathered. The stage now tells the entrance when the plan is still to land (`EntranceHost.planOwed`,
 * `Framing.planOwed`), and **no figure is shown while it is, in either way of showing it**: the gate stays shut (`ready`, ahead of {@link PATIENCE_MS} and of the
 * opening's end), and a hurried opening's `enter(true)` / `settle(true)` leaves such a figure held and lets it in whole the frame the plan has landed (`late`), so the
 * size lands on a figure nobody can see. {@link PLAN_MAX_MS} is the ceiling, so a plan that never comes cannot keep a boss off the field. The first menu is not
 * delayed (nothing awaits an entrance, and the plan lands in the opening's first seconds); in a hurried opening a figure may come in a moment after the menu opens.
 *
 * A figure is never left held: `settle(true, true)` lets in everything, the screen turns the whole thing off for a preview and for FF7, a figure whose scene stages its
 * own entrance is never held (`entranceCanon.ts`, Chapter IX's night-sakura arrival), and a watchdog on the stage's own clock ({@link HOLD_MAX_MS}) lets in a
 * figure whose opening never came.
 *
 * The gather's motes are the stage's own (`PyreflyStage.emitter`); while a figure is held or gathering the death's release is hushed for it, so its rising
 * motes (a dissolve level between 0 and 1) are not read as a death.
 *
 * Presentation only (rule 1 is the engine's). Game case: **both** (shared plumbing; FFX and FFX-2 both have pyreflies, `research/ffx-vs-ffx2-presentation.md` §3).
 */

import { Vector3 } from 'three';
import type { CombatantId } from '../../battle/common/types.ts';
import { entranceBodyOf, sceneStagesEntrance } from './entranceCanon.ts';
import {
  HOLD_ALPHA,
  LAND_FLASH,
  chooseEntrance,
  entranceRng,
  frameAt,
  gatherMote,
  moteCount,
  moteSizeScale,
  type EntranceChoice,
  type GatherMote,
  type QuadCorners,
} from './entranceLook.ts';

/** A figure that has stood this still (ms, unchanged scale and place) is where it will be played. CHAPTER FRAMING decides 0.6 s after a figure changes, and puts it on at once. */
export const QUIET_MS = 300;
/** A figure is at least this old (ms) before it is played: the plan's 0.6 s gate, and the frames its painting and a scene's follower take, with a margin. It is NOT when the plan lands (`planOwed` is). */
export const MIN_AGE_MS = 900;
/** The most the opening waits for a figure to be still (ms): after it, it is played where it stands. It does not outrank a plan that is still owed ({@link PLAN_MAX_MS}). */
export const PATIENCE_MS = 1600;
/**
 * The most a figure waits for CHAPTER FRAMING's plan (ms of the stage's clock since it was built): the plan lands 1.0 to 1.7 s after the screen comes up on the machines measured
 * (a CPU six times slower included), so this is a ceiling for a plan that never comes (no canvas, no idle rig), not a time anything is expected to reach. After it the gate and the
 * hurried opening act as they did before the plan was waited for.
 */
export const PLAN_MAX_MS = 3000;
/** A figure held this long (ms of the stage's clock) with no opening is let in: nothing may be left invisible. */
export const HOLD_MAX_MS = 30_000;
/** A frame longer than this (ms) counts as this long, so a hitch does not swallow the entrance. */
const MAX_STEP_MS = 50;
/** A change of scale or place under this (world units, or a ratio) is not a change: breathing and float noise. */
const EPS = 1e-3;

/** The slice of a `PaintedActor` the entrance drives (the real one satisfies it, and so does a test's). */
export interface EntranceActor {
  readonly position: { x: number; y: number; z: number };
  readonly scale: { x: number; y: number; z: number };
  setAlpha(alpha: number): void;
  setDissolve(value: number): void;
  setDissolveStyle(style: 'plain' | 'pyrefly'): void;
  /** Light added to the painting (`PaintedActor.flash`). */
  flash(colour: number, ms: number, peak: number): void;
  contentQuad(out?: [Vector3, Vector3, Vector3, Vector3]): [Vector3, Vector3, Vector3, Vector3];
}

/** What the entrance needs from the stage around it. */
export interface EntranceHost {
  /** Release a mote into the stage's own emitter (`PyreflyStage.emitter`). */
  spawn(m: GatherMote): boolean;
  /** Mute (or not) the death's release of motes for this figure: its dissolve level is an entrance's. */
  hush(actor: EntranceActor, on: boolean): void;
  /** Does the stage track this figure for the death's pyrefly dissolve? Its sweep style is put back to that when the entrance is over. */
  tracked(id: CombatantId): boolean;
  /** REDUCE MOTION and LOW EFFECTS (D-285). */
  comfort(): { reduceMotion: boolean; lowEffects: boolean };
  /** REDUCE FLASHES (the accessibility option): the gather's closing flash is left out. */
  reduceFlashes(): boolean;
  /** The camera's place, world units: a mote is drawn larger the farther its figure is (`moteSizeScale`). */
  cameraAt(): { x: number; y: number; z: number };
  /** The effects tier (`PyreflyStage`): `'phone'` releases 0.6 of the motes. */
  tier(): 'full' | 'phone' | 'low';
  /**
   * CHAPTER FRAMING's plan is still to land (`Framing.planOwed`): it re-sizes a boss in one frame (Paragon's step, 1 to 3.047), so no figure is let in while it is, or the step falls
   * on a figure on screen (FOC44A-05). Absent (a test's host, a stage with no framing) reads as never.
   */
  planOwed?(): boolean;
}

interface Entry {
  readonly id: CombatantId;
  readonly actor: EntranceActor;
  readonly seed: number;
  /** The stage clock when it was built and when its scale or place last changed, ms. */
  since: number;
  movedAt: number;
  sig: [number, number, number, number, number];
  playing: EntranceChoice | null;
  /** A hurried opening has let it in, but CHAPTER FRAMING's plan was still owed: it comes in whole the frame the plan has landed (or at {@link PLAN_MAX_MS}). */
  late: boolean;
  /** ms into the entrance. */
  elapsed: number;
  /** The share of a mote not yet released (as `PyreflyStage.release`'s carry). */
  carry: number;
  rng: () => number;
}

const sigOf = (a: EntranceActor): Entry['sig'] => [a.scale.x, a.scale.y, a.position.x, a.position.y, a.position.z];

function seedOf(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export class StageEntrances {
  private readonly entries = new Map<CombatantId, Entry>();
  private readonly waiters: Array<() => void> = [];
  /** The stage's own clock, ms: summed from the frames it is given (it stands still under the pause, as every update does). */
  private clock = 0;
  /** True from `enter` until the last figure is whole: the opening is on (or just over) and held figures may be played. */
  private open = false;
  private openedAt = 0;
  private instant = false;
  /** The opening is over and was not hurried: a figure that has not begun begins now (the gate is waived), one that is playing carries on. */
  private finishing = false;
  private readonly quad: [Vector3, Vector3, Vector3, Vector3] = [new Vector3(), new Vector3(), new Vector3(), new Vector3()];

  constructor(private readonly host: EntranceHost) {}

  /** Figures waiting or playing. */
  get busy(): boolean {
    return this.entries.size > 0;
  }

  /** For the debug snapshot and the tests: who is held, and who is playing what. */
  snapshot(): { held: string[]; playing: Array<{ id: string; kind: string; ms: number; elapsed: number }> } {
    const held: string[] = [];
    const playing: Array<{ id: string; kind: string; ms: number; elapsed: number }> = [];
    for (const e of this.entries.values()) {
      if (e.playing) playing.push({ id: e.id, kind: e.playing.kind, ms: e.playing.ms, elapsed: Math.round(e.elapsed) });
      else held.push(e.id);
    }
    return { held, playing };
  }

  /**
   * A figure has just been built for a fight: it rests unseen until the opening lets it in. Call it before it can be drawn.
   * A figure whose scene stages its own entrance (`sceneStagesEntrance`: Chapter IX's Yojimbo and Daigoro) is left alone; this answers whether it was held.
   */
  hold(actor: EntranceActor, id: CombatantId): boolean {
    if (sceneStagesEntrance(id)) return false;
    const prior = this.entries.get(id);
    if (prior) this.land(prior);
    this.open = false; // a new field: whatever opening was on is over
    this.finishing = false;
    const e: Entry = { id, actor, seed: seedOf(id), since: this.clock, movedAt: this.clock, sig: sigOf(actor), playing: null, late: false, elapsed: 0, carry: 0, rng: entranceRng(seedOf(id)) };
    this.entries.set(id, e);
    this.host.hush(actor, true);
    this.rest(e);
    return true;
  }

  /**
   * The opening has begun: let the held figures in. Resolves when the last one is whole (nothing awaits it; the opening goes on beside it).
   * `instant`: no animation, the figures are just there (a hurried or skipped opening).
   */
  enter(instant: boolean): Promise<void> {
    this.open = true;
    this.finishing = false;
    this.openedAt = this.clock;
    this.instant = instant;
    if (instant) this.settle(true);
    if (!this.entries.size) return Promise.resolve();
    return new Promise<void>((resolve) => this.waiters.push(resolve));
  }

  /**
   * The opening is over. `now` (hurried, skipped, or the stage is being switched off): every figure still held or playing is whole at once, except a held figure CHAPTER FRAMING's
   * plan is still to re-size, which stays held and is whole the frame the plan lands (`late`; at {@link PLAN_MAX_MS} at the latest). `force`: no figure waits for the plan, for the
   * stage being switched off. Otherwise nothing is cut short and nothing waits: a figure that is playing carries on to its end, and one that has not begun begins (the opening's end
   * waives the gate, not the plan). The next link's figures wait for their own opening.
   */
  settle(now: boolean, force = false): void {
    if (!now) {
      this.finishing = true;
      return;
    }
    for (const e of [...this.entries.values()]) {
      if (!force && !e.playing && this.owed(e)) e.late = true;
      else this.land(e);
    }
    this.open = false;
    this.finishing = false;
    this.wake();
  }

  /** A figure has left the field: forget it. */
  forget(id: CombatantId): void {
    const e = this.entries.get(id);
    if (!e) return;
    this.entries.delete(id);
    this.host.hush(e.actor, false);
    this.wake();
  }

  /** @param dt the frame's seconds (the real clock: a hit-stop that holds the field does not hold an entrance). Call it after the actors have updated, before the motes do. */
  update(dt: number): void {
    const step = Math.min(MAX_STEP_MS, Math.max(0, dt * 1000));
    this.clock += step;
    if (!this.entries.size) return;
    for (const e of [...this.entries.values()]) {
      const sig = sigOf(e.actor);
      if (sig.some((v, i) => Math.abs(v - e.sig[i]!) > EPS * Math.max(1, Math.abs(e.sig[i]!)))) {
        e.sig = sig;
        e.movedAt = this.clock;
      }
      if (!e.playing) {
        if (this.clock - e.since >= HOLD_MAX_MS) {
          this.land(e);
          continue;
        }
        if (e.late) {
          // a hurried opening let it in; it is whole the frame CHAPTER FRAMING's plan has landed (this frame's framing ran before this update, so its size is already on the figure)
          if (this.owed(e)) this.rest(e);
          else this.land(e);
          continue;
        }
        if (!this.open || !this.ready(e)) {
          this.rest(e); // a scene that set the figure's alpha since (a director's bind) does not bring it in
          continue;
        }
        this.begin(e);
      }
      this.play(e, step);
    }
    if (!this.entries.size) {
      this.open = false;
      this.finishing = false;
    }
    this.wake();
  }

  dispose(): void {
    for (const e of this.entries.values()) this.host.hush(e.actor, false);
    this.entries.clear();
    this.open = false;
    this.finishing = false;
    this.wake();
  }

  // ------------------------------------------------------------------ steps

  /** CHAPTER FRAMING's plan is still to land and this figure has not waited {@link PLAN_MAX_MS} for it: whatever size it gives the figure must land while the figure is unseen. */
  private owed(e: Entry): boolean {
    return this.clock - e.since < PLAN_MAX_MS && this.host.planOwed?.() === true;
  }

  private ready(e: Entry): boolean {
    if (this.owed(e)) return false; // before the opening's end and the patience: they wait for a figure to be still, not for a plan that has not come
    if (this.finishing || this.clock - this.openedAt >= PATIENCE_MS) return true;
    return this.clock - e.since >= MIN_AGE_MS && this.clock - e.movedAt >= QUIET_MS;
  }

  /** The held state: nothing drawn (the dissolve all the way up for a body that gathers), at the alpha that is not on the field. */
  private rest(e: Entry): void {
    e.actor.setAlpha(HOLD_ALPHA);
    if (entranceBodyOf(e.id) === 'pyrefly') {
      e.actor.setDissolveStyle('pyrefly');
      e.actor.setDissolve(1);
    }
  }

  private begin(e: Entry): void {
    const c = this.host.comfort();
    e.playing = chooseEntrance({ body: entranceBodyOf(e.id), reduceMotion: c.reduceMotion, lowEffects: c.lowEffects || this.host.tier() === 'low', phone: this.host.tier() === 'phone', instant: this.instant });
    e.elapsed = 0;
    e.carry = 0;
  }

  private play(e: Entry, stepMs: number): void {
    const choice = e.playing!;
    const p0 = choice.ms > 0 ? e.elapsed / choice.ms : 1;
    e.elapsed += stepMs;
    const f = frameAt(choice.kind, choice.ms, e.elapsed);
    e.actor.setAlpha(f.alpha);
    e.actor.setDissolve(f.dissolve);
    if (choice.kind === 'gather' && choice.density > 0 && !f.done) this.releaseMotes(e, choice, p0, Math.min(1, e.elapsed / choice.ms), f.dissolve);
    if (f.done) {
      this.land(e);
      if (choice.kind === 'gather' && !this.host.reduceFlashes()) e.actor.flash(LAND_FLASH.colour, LAND_FLASH.ms, LAND_FLASH.peak);
    }
  }

  private releaseMotes(e: Entry, choice: EntranceChoice, p0: number, p1: number, d: number): void {
    e.carry += moteCount(p0, p1, choice.ms, choice.density);
    if (e.carry < 1) return;
    const q = e.actor.contentQuad(this.quad);
    const corners: QuadCorners = { bl: [q[0].x, q[0].y, q[0].z], br: [q[1].x, q[1].y, q[1].z], tl: [q[3].x, q[3].y, q[3].z] };
    const cam = this.host.cameraAt();
    const size = moteSizeScale(Math.hypot((q[0].x + q[2].x) / 2 - cam.x, (q[0].y + q[2].y) / 2 - cam.y, (q[0].z + q[2].z) / 2 - cam.z));
    while (e.carry >= 1) {
      e.carry -= 1;
      if (!this.host.spawn(gatherMote(e.rng, corners, d, size))) break; // the emitter is full: the rest are not released
    }
  }

  /** Whole: the figure as the stage built it, its death's style back where the stage had put it, its motes un-hushed. */
  private land(e: Entry): void {
    this.entries.delete(e.id);
    e.actor.setAlpha(1);
    e.actor.setDissolve(0);
    e.actor.setDissolveStyle(this.host.tracked(e.id) ? 'pyrefly' : 'plain');
    this.host.hush(e.actor, false);
  }

  private wake(): void {
    if (this.entries.size || !this.waiters.length) return;
    for (const w of this.waiters.splice(0)) w();
  }
}
