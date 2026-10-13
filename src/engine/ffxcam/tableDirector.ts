/**
 * **The table director** (`TableDirector`; FFX only): the website's camera for the hidden Fayth chapter. It plays our own keyframe table (`../../data/ffx/camera/evrae-shots.ts`) on the presenter's beats, where the
 * dev server's `FfxCameraDirector` (`./director.ts`) replays FFX's camera programs. It is production-safe: it reads no local file, holds no program and no VM, and its beat mapping is the director's, one for one
 * (`./cameraCore.ts` gives both the same launch fallback, range scenes, defeat and tracking net).
 *
 * | Beat | What plays |
 * |---|---|
 * | `battleStart`, `turnStart` | the default view of the current range (Enter, Select): a hard cut |
 * | `actionOpen`, `overdriveStart` | the ability's **opening** shot: the plain Attack's side view, a cast's start, found by ability, acting slot, target and range (command accepted plays nothing of its own) |
 * | `impact` | the ability's **launch** shot, on the action's first hit only |
 * | `actionClose` | the default view again (Normal) |
 * | `victory`, `defeat` | the victory and defeat cameras |
 * | a range change | the airship scene (Pull back or Move in), then the default view of the range it ends in |
 * | `telegraph`, `formChange`, `overdriveEnd` | nothing: FFX has no camera for them |
 *
 * **Branches.** A shot the programs chose at random has its branches in the table, with how often each was drawn; this director draws among them from the camera's own presentation dice
 * (`./host.ts`'s `PresentationRandom`, seeded, never the battle's), so the same seed gives the same shots and watching the fight never changes it.
 *
 * **Answers** are the director's: `true` once the camera is live (some beat has started a shot), for every beat; `false` before, so the scene plays Chapter VIII's camera until then.
 *
 * **Time** is the director's too: 29.97 logic steps a second from a frame clock, scaled by the playback rate (`ctx.ms`), every shot run to its end at once when a beat is skipping; a new shot replaces the
 * playing one at a hard cut, as the camera thread does. After each step the pose is published to the sink (the safety net, then the painted B's filter, `../ffxcam/plateFit.ts`).
 *
 * Pure but for the sink: no DOM, no `three`. Game case: FFX only (the table is the Evrae fight's).
 */

import type { Branch, EvraeShotTable, ShotDef } from '../../data/ffx/camera/shotTypes.ts';
import type { ActionShot, ActorShot, BattleStartShot, FormChangeShot, ImpactShot, ShotAnswer, ShotCtx, TelegraphShot } from '../ShotDirector.ts';
import type { CameraBackend } from './cameraCore.ts';
import { PresentationRandom } from './host.ts';
import { lastPose, poseAt } from './shotTrack.ts';
import { cellOf, own, rowOf, slotCode, targetCode } from './tableRoutes.ts';
import type { CameraSink } from './sink.ts';
import type { CameraPose } from './solver.ts';

/** One run of the scene loop, 1/29.97 s (the same number as `./director.ts`'s `LOGIC_HZ`; a test pins that they agree). */
export const TABLE_LOGIC_HZ = 29.97;

/** Steps one `advance` may run: a tab that was in the background does not replay minutes of camera. */
const MAX_CATCHUP = 30;

/** The dice stream the shot branches draw from (FFX's camera dice are streams 14 and 15: this is the presentation's own source of them, `./host.ts`). */
const BRANCH_STREAM = 14;

/** Real time in milliseconds, monotonic. */
export interface TableClock {
  now(): number;
}

export interface TableDirectorOptions {
  readonly table: EvraeShotTable;
  /** Where each step's pose goes. */
  readonly sink: CameraSink;
  /** The camera's own dice: the same seed plays the same shots. */
  readonly seed?: number;
  readonly clock?: TableClock;
  /** The airship's current range, read at each beat. */
  readonly range: () => 'near' | 'far';
  /** Called when a shot starts (tests, logs, the audit): its id, the logic step and the beat that asked for it. */
  readonly onStart?: (shot: string, step: number, why: string) => void;
}

const defaultClock: TableClock = { now: () => (typeof performance !== 'undefined' ? performance.now() : Date.now()) };

/** The shot that is on the camera: its definition, the step it began at, and its last pose (shared, so a held shot is one object). */
interface Track {
  readonly id: string;
  readonly def: ShotDef;
  readonly began: number;
  readonly last: CameraPose;
  readonly lastStep: number;
}

/** The action that is open: its row, who and what it is about (read once, at the opening), and whether its launch has been asked for. */
interface Open {
  readonly row: string;
  readonly slot: string;
  readonly target: string;
  launched: boolean;
}

export class TableDirector implements CameraBackend {
  private readonly table: EvraeShotTable;
  private readonly sink: CameraSink;
  private readonly clock: TableClock;
  private readonly rangeNow: () => 'near' | 'far';
  private readonly onStart: TableDirectorOptions['onStart'];
  private readonly dice: PresentationRandom;
  private ctx: ShotCtx | null = null;
  private track: Track | null = null;
  private liveFlag = false;
  private owed = 0;
  private lastNow: number | null = null;
  private stepNo = 0;
  private open: Open | null = null;
  private sceneOpen = false;
  private lineup: readonly string[] = [];

  constructor(opts: TableDirectorOptions) {
    this.table = opts.table;
    this.sink = opts.sink;
    this.clock = opts.clock ?? defaultClock;
    this.rangeNow = opts.range;
    this.onStart = opts.onStart;
    this.dice = new PresentationRandom(opts.seed ?? 0);
  }

  /** The ids of the shots that are views of the whole fight (everything but an action's own shot): the tracking net holds the party for these. */
  static wholeFightShots(table: EvraeShotTable): ReadonlySet<string> {
    return new Set(Object.entries(table.shots).filter(([, d]) => d.kind !== 'action').map(([id]) => id));
  }

  /** The party on the deck, in slot order (the core tells it at each beat): the acting slot and a single ally's slot come from here. */
  setLineup(ids: readonly string[]): void {
    this.lineup = ids;
  }

  /** The dice the branches are drawn from (a test's proof of what drew). */
  get random(): PresentationRandom {
    return this.dice;
  }

  /** True once the camera is live: some beat has started a shot and the director owns the picture. */
  get live(): boolean {
    return this.liveFlag;
  }

  get steps(): number {
    return this.stepNo;
  }

  /** The id of the shot on the camera, or undefined before the first. */
  get programId(): string | undefined {
    return this.track?.id;
  }

  /** A shot is playing: the camera is mid-shot. */
  get busy(): boolean {
    const t = this.track;
    return t !== null && this.stepNo - t.began - 1 < t.def.len;
  }

  /** A range scene (Pull back, Move in) is playing. */
  get sceneRunning(): boolean {
    return this.sceneOpen;
  }

  // ------------------------------------------------------------------ beats

  battleStart(ctx: BattleStartShot): ShotAnswer {
    this.ctx = ctx;
    this.playView('enter');
    return this.liveFlag;
  }

  turnStart(ctx: ActorShot): ShotAnswer {
    this.ctx = ctx;
    this.playView('select');
    return this.liveFlag;
  }

  actionOpen(ctx: ActionShot): ShotAnswer {
    return this.openAction(ctx);
  }

  overdriveStart(ctx: ActionShot): ShotAnswer {
    return this.openAction(ctx);
  }

  impact(ctx: ImpactShot): boolean {
    this.ctx = ctx;
    this.launch();
    return this.liveFlag;
  }

  actionClose(ctx: ActorShot): ShotAnswer {
    this.ctx = ctx;
    this.open = null;
    this.playView('normal');
    return this.liveFlag;
  }

  overdriveEnd(ctx: ActorShot): ShotAnswer {
    this.ctx = ctx;
    return this.liveFlag;
  }

  telegraph(ctx: TelegraphShot): ShotAnswer {
    this.ctx = ctx;
    return this.liveFlag;
  }

  formChange(ctx: FormChangeShot): ShotAnswer {
    this.ctx = ctx;
    return this.liveFlag;
  }

  victory(ctx: ShotCtx): ShotAnswer {
    this.ctx = ctx;
    this.open = null;
    this.playBranches(this.table.victory[this.rangeCode()], 'victory');
    return this.liveFlag;
  }

  // ------------------------------------------------- what the seam has no beat for

  /** The open action's launch shot, owed to an action that raised no impact (see `./cameraCore.ts`): true when a shot started. */
  launchOwed(ctx?: ShotCtx): boolean {
    if (ctx) this.ctx = ctx;
    return this.launch();
  }

  /** The party fell: the defeat camera, on one of the three members (the table has all three: which fell last is not known here). */
  defeat(ctx?: ShotCtx): boolean {
    if (ctx) this.ctx = ctx;
    this.open = null;
    const slot = this.dice.next(BRANCH_STREAM) % 3;
    return this.playBranches(this.table.defeat[`${this.rangeCode()}${slot}`], 'defeat');
  }

  /** The airship pulls back or closes in: its scene plays, and Normal follows when it is over. */
  rangeChange(kind: 'pullBack' | 'moveIn', ctx?: ShotCtx): boolean {
    if (ctx) this.ctx = ctx;
    const started = this.playBranches(this.table.scenes[kind], kind);
    this.sceneOpen = started;
    this.endSceneIfOver(); // a skipped beat has run the scene to its end already
    return started;
  }

  /** The scene's range change is over (Evrae has landed): Normal now, ending the scene early if it is still running. */
  rangeSettled(): void {
    if (!this.sceneOpen) return;
    this.sceneOpen = false;
    this.playView('normal');
  }

  // ------------------------------------------------------------------- time

  /** Per rendered frame: read the clock, run the steps it owes, publish the pose. */
  update(): void {
    const now = this.clock.now();
    const dt = this.lastNow === null ? 0 : Math.max(0, now - this.lastNow);
    this.lastNow = now;
    this.advance(dt);
  }

  /** Advance by `dtMs` of real time at the live playback rate. Never throws: a frame loop calls it, and a broken sink costs the shot, not the page. */
  advance(dtMs: number): void {
    if (!this.liveFlag || !this.track) return;
    try {
      const rate = this.rate();
      let ran = 0;
      if (rate === Number.POSITIVE_INFINITY) {
        this.owed = 0;
        ran = this.runToEnd();
      } else {
        this.owed = Math.min(this.owed + (dtMs / 1000) * rate, MAX_CATCHUP);
        for (; this.owed >= 1; this.owed -= 1) {
          this.stepNo += 1;
          ran += 1;
        }
      }
      if (!this.endSceneIfOver() && ran > 0) this.publish();
    } catch {
      this.owed = 0;
    }
  }

  // -------------------------------------------------------------- internals

  /** Steps per real second at the live playback: 29.97, three times that when fast, infinite when skipping or hurried. */
  private rate(): number {
    const ctx = this.ctx;
    if (!ctx) return TABLE_LOGIC_HZ;
    if (ctx.skipping || ctx.speed === 'skip') return Number.POSITIVE_INFINITY;
    const scale = ctx.ms(1000) / 1000;
    return scale > 0 ? TABLE_LOGIC_HZ / scale : Number.POSITIVE_INFINITY;
  }

  /** Run the playing shot to its end state at once; the steps taken. */
  private runToEnd(): number {
    const t = this.track;
    if (!t) return 0;
    const left = t.def.len - (this.stepNo - t.began - 1);
    if (left <= 0) return 0;
    this.stepNo += left;
    return left;
  }

  /** The scene's shot has finished: Normal follows, as the engine's scene driver requests it. */
  private endSceneIfOver(): boolean {
    if (!this.sceneOpen || this.busy) return false;
    this.sceneOpen = false;
    this.playView('normal');
    return true;
  }

  private rangeCode(): 'n' | 'f' {
    return this.rangeNow() === 'far' ? 'f' : 'n';
  }

  /** Start `id` now: it replaces what was playing, takes the beat's own step (so a hard cut is on screen at once) and is published. */
  private start(id: string, why: string): boolean {
    const def = own(this.table.shots, id);
    if (!def) return false;
    const last = lastPose(def);
    this.track = { id, def, began: this.stepNo, last, lastStep: def.keys[def.keys.length - 1]![0] };
    this.stepNo += 1; // the beat's own step
    this.liveFlag = true;
    this.owed = Math.max(this.owed - 1, -1); // paid for
    this.onStart?.(id, this.stepNo, why);
    if (this.rate() === Number.POSITIVE_INFINITY) this.runToEnd();
    this.publish();
    return true;
  }

  private playView(why: string): boolean {
    return this.start(this.table.views[this.rangeNow()], why);
  }

  /** A branch drawn by weight from the camera's own dice. */
  private pick(branches: readonly Branch[]): string | undefined {
    const total = branches.reduce((n, b) => n + b[1], 0);
    if (branches.length === 0 || total <= 0) return undefined;
    if (branches.length === 1) return branches[0]![0];
    let r = this.dice.next(BRANCH_STREAM) % total;
    for (const [id, w] of branches) {
      if (r < w) return id;
      r -= w;
    }
    return branches[branches.length - 1]![0];
  }

  /** Start one of `branches` (`''` is "leave the camera"): true when a shot started. */
  private playBranches(branches: readonly Branch[] | undefined, why: string): boolean {
    const id = branches ? this.pick(branches) : undefined;
    return id === undefined || id === '' ? false : this.start(id, why);
  }

  private publish(): void {
    const t = this.track;
    if (!t) return;
    const elapsed = this.stepNo - t.began - 1;
    try {
      this.sink.apply(elapsed >= t.lastStep ? t.last : poseAt(t.def, elapsed));
    } catch {
      /* a sink that throws costs the shot, not the battle */
    }
  }

  // ---------------------------------------------------------------- actions

  private openAction(ctx: ActionShot): boolean {
    this.ctx = ctx;
    const row = rowOf(ctx.actor, ctx.action);
    this.open = row === undefined ? null : { row, slot: slotCode(ctx.actor, this.lineup), target: targetCode(ctx.actor, ctx.targets, this.lineup), launched: false };
    if (this.open) this.playRoute('open', this.open, 'open');
    return this.liveFlag;
  }

  /** Raise the open action's launch once (a multi-hit action launches its shot once). True when a shot started. */
  private launch(): boolean {
    const open = this.open;
    if (!open || open.launched) return false;
    open.launched = true;
    return this.playRoute('launch', open, 'launch');
  }

  private playRoute(phase: 'open' | 'launch', open: Open, why: string): boolean {
    const routeId = own(this.table.rows, open.row)?.[phase];
    const cells = routeId === undefined ? undefined : own(this.table.routes, routeId);
    return this.playBranches(cells ? cellOf(cells, this.rangeCode(), open.slot, open.target) : undefined, `${why}:${open.row}`);
  }
}
