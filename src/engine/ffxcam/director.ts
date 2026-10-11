/**
 * **The FFX camera director** (`FfxCameraDirector implements ShotDirector`): FFX's own battle-camera programs, replayed (`./vm.ts`) and driven from our battle beats (`../ShotDirector.ts`).
 * It is what the hidden Fayth chapter's scene publishes in place of the stub (`./stubDirector.ts`), through `./faythCamera.ts` (the launch fallback, the range scenes, the roster and frames, defeat) and the scene glue `../../scenes/exp-fayth-camera.ts`; this file is the logic.
 *
 * **From a beat to FFX's requests** (`SPEC.md` 9.1, `INDEX.json` `beats`). The engine raises numbered tags; our presenter raises beats, so each beat is the nearest tags:
 *
 * | Beat | FFX request(s) |
 * |---|---|
 * | `battleStart` | Enter 24: the default view for the current range, a hard cut |
 * | `turnStart` | Select 25: the same default view (our engine has no target-cursor beat; FFX raises Select as the cursor moves, never at turn start) |
 * | `actionOpen`, `overdriveStart` | command accepted 61, then the ability's **start** requests (a plain attack's immediate launch; a cast's MagicStart orbit) |
 * | `impact` | the ability's **launch** requests (the command's own shot: a spell's, Poison Breath's), on the action's first hit only |
 * | `actionClose` | Normal 28 |
 * | `victory` | 66 (and `defeat()`, 67: the seam has no defeat beat) |
 * | `telegraph`, `formChange`, `overdriveEnd` | nothing: FFX has no camera for them |
 * | a range change (`rangeChange`) | the airship scene (tag 0, the selector variable set to Pull back or Move in), then Normal when it is over (`rangeSettled` ends it early) |
 *
 * Which requests an ability raises is data (`FfxCameraPrograms.actions`, from his local folder), found by the beat's ability id, the plain Attack of its side, or an item id. The program a request
 * starts is the book's (`./book.ts`). Each beat's requests start in order (a later one kills the earlier, as the camera thread does) and the beat gets its own logic step, so a hard cut is on screen
 * at once.
 *
 * **Answers.** `true` once the FFX camera is live (some beat has started a program), for every beat: a beat with a program runs it; a beat FFX has no camera for (a telegraph, an Overdrive's end, a
 * hit with no launch shot) leaves the camera where it is, which is what FFX does, and `true` keeps `BattleMoments` from moving the shared camera port under it. `false` while it has no programs or has
 * not started one (the website; a book without Enter), so the chapter plays Chapter VIII's camera.
 *
 * **Time.** The director ticks at 29.97 Hz from a frame clock it is given: `update()` reads the clock and `advance(ms)` takes the elapsed time, scaled by the playback rate (`ctx.ms`: fast play is
 * about three times quicker, a hurried or skipped beat does not wait at all). When a beat is skipping, every program runs to its end state at once. After each step it publishes the pose to its
 * {@link CameraSink}. Nothing here draws from the battle RNG: the shot dice are the host's presentation source (`./host.ts`).
 *
 * Pure but for the sink: no DOM, no `three`. Game case: FFX only (the chapter that publishes it is Chapter VIII's Evrae).
 */

import type { ActionShot, ActorShot, BattleStartShot, FormChangeShot, ImpactShot, ShotAction, ShotAnswer, ShotCtx, ShotDirector, ShotSubject, TelegraphShot } from '../ShotDirector.ts';
import type { ActionRow, CameraRequest, FfxCameraPrograms } from './book.ts';
import { FormationHost } from './formation.ts';
import { PresentationRandom } from './host.ts';
import type { Program } from './ir.ts';
import type { CameraSink } from './sink.ts';
import { CameraSolver } from './solver.ts';
import { CameraVm, type CallRewriter } from './vm.ts';

/** The tags the beats raise (SPEC 8.2). */
export const TAG = { enter: 24, select: 25, normal: 28, accepted: 61, victory: 66, defeat: 67 } as const;

/** The logic step's rate: one run of the scene loop, 1/29.97 s. */
export const LOGIC_HZ = 29.97;

/** Steps one `update` may run: a tab that was in the background does not replay minutes of camera. */
const MAX_CATCHUP = 30;
/** Steps a skipped program may take to reach its end state before it is cut short. */
const MAX_SKIP_STEPS = 6000;

/** Real time in milliseconds, monotonic. */
export interface FrameClock {
  now(): number;
}

export interface DirectorOptions {
  /** The loaded camera data; null when there is none (the website): the director declines every beat. */
  readonly programs: FfxCameraPrograms | null;
  readonly sink: CameraSink;
  /** The seed of the camera's own dice (the battle's seed is fine: the sources are separate). */
  readonly seed?: number;
  readonly clock?: FrameClock;
  /** Called when a program starts, for tests and logs. */
  readonly onStart?: (program: Program, step: number) => void;
  /** Where one-off warnings go (the VM's and the sink's). Default: a dev `console.warn`. */
  readonly warn?: (message: string) => void;
  readonly onWrite?: (chrs: readonly number[], property: number, value: number) => void;
  /** A fit of the data: asked of every call the programs make before it runs (`./farFit.ts`). */
  readonly rewriteCall?: CallRewriter;
}

const own = <T>(table: Readonly<Record<string, T>>, key: string): T | undefined => (Object.hasOwn(table, key) ? table[key] : undefined);

const defaultClock: FrameClock = { now: () => (typeof performance !== 'undefined' ? performance.now() : Date.now()) };

export class FfxCameraDirector implements ShotDirector {
  /** The world the programs ask about: the scene registers its roster and the characters' frames here. */
  readonly host: FormationHost;
  /** The VM (null without programs): its `vars` are the battle variables, its `stats` what it did. */
  readonly vm: CameraVm | null;

  private readonly programs: FfxCameraPrograms | null;
  private readonly sink: CameraSink;
  private readonly clock: FrameClock;
  private readonly warn: (message: string) => void;
  private readonly warned = new Set<string>();
  private ctx: ShotCtx | null = null;
  private liveFlag = false;
  private owed = 0;
  private lastNow: number | null = null;
  private open: { row: ActionRow | undefined; launched: boolean } | null = null;
  private sceneOpen = false;

  constructor(opts: DirectorOptions) {
    this.programs = opts.programs;
    this.sink = opts.sink;
    this.clock = opts.clock ?? defaultClock;
    this.warn = opts.warn ?? ((m) => (import.meta.env.DEV ? console.warn(m) : undefined));
    this.host = new FormationHost({ random: new PresentationRandom(opts.seed ?? 0), constants: opts.programs?.constants, onWrite: opts.onWrite });
    this.vm = opts.programs
      ? new CameraVm({ solver: new CameraSolver(this.host), book: opts.programs.book, host: this.host, onStart: opts.onStart, warn: this.warn, ...(opts.rewriteCall ? { rewriteCall: opts.rewriteCall } : {}) })
      : null;
  }

  /** True once the FFX camera is live: some beat has started a program and the director owns the shot. */
  get live(): boolean {
    return this.liveFlag;
  }

  // ------------------------------------------------------------------ beats

  battleStart(ctx: BattleStartShot): ShotAnswer {
    this.ctx = ctx;
    this.raise([{ tags: [TAG.enter] }]);
    return this.liveFlag;
  }

  turnStart(ctx: ActorShot): ShotAnswer {
    this.ctx = ctx;
    this.raise([{ tags: [TAG.select] }]);
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
    this.raise([{ tags: [TAG.normal] }]);
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
    this.raise([{ tags: [TAG.victory] }]);
    return this.liveFlag;
  }

  // ------------------------------------------------- what the seam has no beat for

  /**
   * The open action's launch shot, owed to an action that raised **no impact** (a status-only spell, a miss, a zero): the presenter raises `impact` only where damage lands, so such an action would never
   * get the shot FFX launches with its effect. The scene asks at the action's close, before `actionClose`'s Normal. Starts the launch requests of the open action when none has been raised yet and returns
   * true when a program started (the caller then lets it play, see `FaythCamera`). False with no action open, a launch already raised (an impact came), no launch step, or no handler for it.
   */
  launchOwed(ctx?: ShotCtx): boolean {
    if (ctx) this.ctx = ctx;
    return this.launch();
  }

  /** A camera program is running or a move is armed: the camera is mid-shot. False with no programs (the website). */
  get busy(): boolean {
    return this.vm ? !this.vm.idle : false;
  }

  /** A range scene (Pull back, Move in) is playing. While it is, a beat's request would cut it short, so the scene holds its beats back until it is over (`FaythCamera`). */
  get sceneRunning(): boolean {
    return this.sceneOpen;
  }

  /** The party fell (tag 67): the seam has no defeat beat, so whoever sees the battle end calls this. */
  defeat(ctx?: ShotCtx): boolean {
    if (ctx) this.ctx = ctx;
    this.open = null;
    return this.raise([{ tags: [TAG.defeat] }]);
  }

  /**
   * The airship pulls back or closes in: the scene program runs (the selector variable and the distance property are set first, as the engine's scene driver does), and Normal follows when it is
   * over. False with no range data or no scene program.
   */
  rangeChange(kind: 'pullBack' | 'moveIn', ctx?: ShotCtx): boolean {
    const range = this.programs?.range;
    if (!this.vm || !range) return false;
    if (ctx) this.ctx = ctx;
    const move = kind === 'pullBack' ? range.pullBack : range.moveIn;
    this.vm.vars.set(range.variable, move.value);
    this.host.setProperty(range.chr, range.distanceProp, move.distance);
    const started = this.raise([{ tags: [range.tag] }]);
    this.sceneOpen = started;
    this.endSceneIfOver(); // a skipped beat has run the scene to its end already
    return started;
  }

  /** The scene's range change is over (Evrae has landed): Normal now, ending the scene program early if it is still running. */
  rangeSettled(): void {
    if (!this.sceneOpen) return;
    this.sceneOpen = false;
    this.raise([{ tags: [TAG.normal] }]);
  }

  // ------------------------------------------------------------------- time

  /** Per rendered frame: read the clock, run the logic steps it owes, publish the pose. */
  update(): void {
    const now = this.clock.now();
    const dt = this.lastNow === null ? 0 : Math.max(0, now - this.lastNow);
    this.lastNow = now;
    this.advance(dt);
  }

  /** Advance by `dtMs` of real time at the live playback rate. Never throws: a frame loop calls it, and a broken host costs the shot, not the page. */
  advance(dtMs: number): void {
    const vm = this.vm;
    if (!vm || !this.liveFlag) return;
    try {
      const rate = this.rate();
      let ran = 0;
      if (rate === Number.POSITIVE_INFINITY) {
        this.owed = 0;
        ran = vm.runToEnd(MAX_SKIP_STEPS);
      } else {
        this.owed = Math.min(this.owed + (dtMs / 1000) * rate, MAX_CATCHUP);
        for (; this.owed >= 1; this.owed -= 1) {
          vm.tick();
          ran += 1;
        }
      }
      if (!this.endSceneIfOver() && ran > 0) this.publish();
    } catch (e) {
      this.owed = 0;
      this.warnOnce('advance', `[ffxcam] the camera could not advance: ${String(e)}`);
    }
  }

  // -------------------------------------------------------------- internals

  /** The scene program has finished and its moves are over: Normal follows, as the engine's scene driver requests it. */
  private endSceneIfOver(): boolean {
    if (!this.sceneOpen || !this.vm?.idle) return false;
    this.sceneOpen = false;
    this.raise([{ tags: [TAG.normal] }]);
    return true;
  }

  /** Logic steps per real second at the live playback: 29.97, three times that when fast, infinite when skipping or hurried. */
  private rate(): number {
    const ctx = this.ctx;
    if (!ctx) return LOGIC_HZ;
    if (ctx.skipping || ctx.speed === 'skip') return Number.POSITIVE_INFINITY;
    const scale = ctx.ms(1000) / 1000; // BattleMoments.ms: the speed, the pacing option, a hurried opening
    return scale > 0 ? LOGIC_HZ / scale : Number.POSITIVE_INFINITY;
  }

  /**
   * Start each request in order on the camera thread, give the beat its own logic step (the solver runs once after the scripts) and publish. When the beat is skipping the programs run to their end
   * states at once. True when at least one request had a program.
   */
  private raise(requests: readonly CameraRequest[]): boolean {
    const vm = this.vm;
    if (!vm) return false;
    let any = false;
    for (const r of requests) if (vm.request(r)) any = true;
    if (!any) return false;
    this.liveFlag = true;
    vm.tick();
    this.owed = Math.max(this.owed - 1, -1); // the beat's step is paid for
    if (this.rate() === Number.POSITIVE_INFINITY) vm.runToEnd(MAX_SKIP_STEPS);
    this.publish();
    return true;
  }

  private openAction(ctx: ActionShot): boolean {
    this.ctx = ctx;
    const row = this.rowFor(ctx.actor, ctx.action);
    this.open = { row, launched: false };
    const host = this.host;
    host.setActing(host.chrOf(ctx.actor.id));
    host.setTargets(ctx.targets.map((t) => host.chrOf(t.id)).filter((c): c is number => c !== undefined));
    host.command = row?.command ?? 0;
    const starts = (row?.steps ?? []).filter((s) => s.at === 'start');
    this.raise([{ tags: [TAG.accepted] }, ...starts.map((s) => this.requestOf(row, s.tags, s.worker))]);
    return this.liveFlag;
  }

  /** Raise the open action's launch requests once (a multi-hit action launches its shot once). True when a program started. */
  private launch(): boolean {
    const open = this.open;
    if (!open || open.launched || !this.programs) return false;
    open.launched = true;
    const launches = (open.row?.steps ?? []).filter((s) => s.at === 'launch');
    return this.raise(launches.map((s) => this.requestOf(open.row, s.tags, s.worker)));
  }

  private requestOf(row: ActionRow | undefined, tags: readonly number[], worker: boolean): CameraRequest {
    return worker && row ? { tags, command: row.command } : { tags };
  }

  /** The action's row: by ability id (the actor's side first, then the items), else the plain Attack of its side. */
  private rowFor(actor: ShotSubject | undefined, action: ShotAction): ActionRow | undefined {
    const table = this.programs?.actions;
    if (!table) return undefined;
    const monster = actor?.side === 'enemy';
    if (action.commandKind === 'attack') return monster ? table.attack.monster : table.attack.party;
    const id = action.abilityId;
    if (id === undefined) return undefined;
    return own(monster ? table.monster : table.party, id) ?? own(table.items, id) ?? own(monster ? table.party : table.monster, id);
  }

  private publish(): void {
    const vm = this.vm;
    if (!vm) return;
    try {
      this.sink.apply(vm.pose());
    } catch (e) {
      this.warnOnce('sink', `[ffxcam] the camera sink threw: ${String(e)}`);
    }
  }

  private warnOnce(key: string, message: string): void {
    if (this.warned.has(key)) return;
    this.warned.add(key);
    this.warn(message);
  }
}

