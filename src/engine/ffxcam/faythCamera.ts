/**
 * **The hidden Fayth chapter's camera** (`FaythCamera`): FFX's camera director (`./director.ts`) in the shape the scene publishes it, plus the four things a scene owes it that the seam
 * (`../ShotDirector.ts`) has no beat for. The scene (`../../scenes/exp-fayth-camera.ts`) builds one, publishes {@link FaythCamera.shotDirector} as `SceneStaging.shotDirector` and calls
 * {@link FaythCamera.update} once a frame with the frame's `dt`; this file is pure (no `three`, no DOM) and so runs in Node against the presenter's fakes.
 *
 * - **Time.** `update(dt)` advances the director by the frame's own `dt` (a paused or hit-stopped field is not counted, a hidden tab is capped by the director), at the playback rate of the last beat
 *   (`ctx.ms`: fast play about three times quicker, a skipped or hurried beat runs every program to its end at once).
 * - **The roster and the frames.** The director's host is given {@link FAYTH_ROSTER} (our combatant ids against FFX's character numbers) and a live frame source over the scene's actors (`./frames.ts`), so
 *   a shot framed on "the targets" follows the figures.
 * - **The launch fallback.** FFX launches an action's own shot with its effect. The presenter raises `impact` only where damage lands, so a status-only action (Haste, Cheer, a miss, a zero) never reaches
 *   the director's launch and would play without its shot. At the action's close, **before** Normal, an action that owes a launch starts it and **the close waits for it**: the returned promise settles when
 *   the camera is idle again, which is when the program has played, so the battle waits for a program no longer than the program runs (and not at all when skipping, where it ran to its end at once). A
 *   cap of {@link HOLD_CAP_STEPS} logic steps stands behind it, and `dispose` releases every wait.
 * - **The airship's range scenes.** The scene watches the range director's current range (`state.flags['airship.range']` as `sync` sets it): near to far is **Pull back**, far to near **Move in**, and
 *   `rangeChange` plays the scene program (185 and 231 steps). The engine flips the flag as it resolves Cid's order, **before** the presenter plays that action, so the scene program can already be running
 *   when the action's own beats arrive. In FFX the scene is the order's own action (its driver waits for Evrae's flight before Normal), so nothing else may start until it is over: an action's **opening
 *   waits for the scene to end** (the presenter awaits it, so the next actor's action begins when the swoop has landed; its accept request would otherwise cut the scene) and then opens as ever, a turn start
 *   (not awaited by the presenter) is not raised while the scene plays, and the action's **close waits for the scene to end** too, then raises Normal.
 *   The scene program is **never cut short by the range director's own shift** (1.5 s of fade and move, against a 6.2 s swoop): `rangeSettled` is called when the shift is over and the camera has nothing
 *   left to play, which is where the director has already ended the scene, so it is the clean-up and not a cut.
 * - **Defeat.** The seam has no defeat beat, so the scene reports the party's fall (every active member down) once, and the director raises tag 67.
 *
 * Game case: FFX only.
 */

import type { ActionShot, ActorShot, BattleStartShot, FormChangeShot, ImpactShot, ShotAnswer, ShotCtx, ShotDirector, TelegraphShot } from '../ShotDirector.ts';
import type { FfxCameraPrograms } from './book.ts';
import { FfxCameraDirector } from './director.ts';
import type { CameraActor } from './frames.ts';
import { frameSource } from './frames.ts';
import type { CameraSink } from './sink.ts';
import { FAYTH_ROSTER } from './roster.ts';

/** Logic steps a held action close may wait for the camera to go idle before it is let go (20 s at 29.97 Hz; the longest program is the defeat's 501 steps). */
export const HOLD_CAP_STEPS = 600;

/** What the camera needs to know of the scene it plays in. */
export interface FaythCameraWorld {
  /** The live actor of a combatant id, or undefined when it is not on the field. */
  actor(id: string): CameraActor | undefined;
  /** The airship range as the range director sees it, or null when the scene has no range game. */
  range(): { readonly current: 'near' | 'far'; readonly shifting: boolean } | null;
  /** Every active party member on the field is down (the party has fallen); false with none on the field. */
  partyFallen(): boolean;
}

export interface FaythCameraOptions {
  readonly programs: FfxCameraPrograms;
  /** Where the director publishes its pose (a `PoseLatch`: the camera is written at render time). */
  readonly sink: CameraSink;
  readonly world: FaythCameraWorld;
  /** The camera's own dice (the battle's seed is fine: the sources are separate). */
  readonly seed?: number;
  readonly warn?: (message: string) => void;
}

interface Hold {
  readonly resolve: () => void;
  /** The VM's step count when the hold began. */
  readonly from: number;
}

export class FaythCamera {
  readonly director: FfxCameraDirector;
  /** What the scene publishes as `SceneStaging.shotDirector`. */
  readonly shotDirector: ShotDirector;

  private holds: Hold[] = [];
  private range: 'near' | 'far' | null = null;
  private wasShifting = false;
  private fallen = false;

  constructor(private readonly opts: FaythCameraOptions) {
    this.director = new FfxCameraDirector({ programs: opts.programs, sink: opts.sink, ...(opts.seed === undefined ? {} : { seed: opts.seed }), ...(opts.warn ? { warn: opts.warn } : {}) });
    this.director.host.setRoster(FAYTH_ROSTER);
    this.director.host.setSource(frameSource(FAYTH_ROSTER, (id) => opts.world.actor(id)));
    this.shotDirector = this.wrap();
  }

  /** Once a frame, after the scene's own update: the range scenes, the director's steps, the party's fall, the waits. */
  update(dt: number): void {
    this.watchRange();
    this.director.advance(dt * 1000);
    this.watchFall();
    this.settleHolds();
  }

  /** Let go of every wait (the scene is leaving, or the battle is over): nothing is left waiting on a camera that will not be updated again. */
  dispose(): void {
    this.release();
  }

  // ------------------------------------------------------------------ the beats

  private wrap(): ShotDirector {
    const d = this.director;
    return {
      battleStart: (ctx: BattleStartShot): ShotAnswer => d.battleStart(ctx),
      turnStart: (ctx: ActorShot): ShotAnswer => (d.sceneRunning ? true : d.turnStart(ctx)), // a range scene owns the camera, and the presenter does not wait for a turn start
      actionOpen: (ctx: ActionShot): ShotAnswer => this.opening(() => d.actionOpen(ctx)),
      impact: (ctx: ImpactShot): boolean => d.impact(ctx),
      actionClose: (ctx: ActorShot): ShotAnswer => this.close(ctx),
      overdriveStart: (ctx: ActionShot): ShotAnswer => this.opening(() => d.overdriveStart(ctx)),
      overdriveEnd: (ctx: ActorShot): ShotAnswer => d.overdriveEnd(ctx),
      telegraph: (ctx: TelegraphShot): ShotAnswer => d.telegraph(ctx),
      formChange: (ctx: FormChangeShot): ShotAnswer => d.formChange(ctx),
      victory: (ctx: ShotCtx): ShotAnswer => {
        this.release(); // the fight is won: nothing waits on the camera
        return d.victory(ctx);
      },
    };
  }

  /** An action's opening: at once, unless a range scene is playing, in which case it waits for the scene to end (the scene is the order's own action) and then opens as ever. */
  private opening(open: () => ShotAnswer): ShotAnswer {
    return this.director.sceneRunning ? this.hold().then(open) : open();
  }

  /**
   * The action's close. An action that owes its launch shot (it raised no impact) starts it now, and a range scene may be playing: either way the close **waits for the camera to be idle**, then raises Normal.
   * Otherwise it is the director's own close, at once.
   */
  private close(ctx: ActorShot): ShotAnswer {
    const d = this.director;
    const owed = d.launchOwed(ctx);
    if (owed || d.sceneRunning) return this.hold().then(() => d.actionClose(ctx));
    return d.actionClose(ctx);
  }

  // ----------------------------------------------------------------- the waits

  /** A promise that settles when the camera goes idle (at once if it already is). */
  private hold(): Promise<void> {
    if (!this.director.busy) return Promise.resolve();
    return new Promise<void>((resolve) => this.holds.push({ resolve, from: this.director.vm?.steps ?? 0 }));
  }

  private settleHolds(): void {
    if (this.holds.length === 0) return;
    const steps = this.director.vm?.steps ?? 0;
    const idle = !this.director.busy;
    this.holds = this.holds.filter((h) => {
      if (!idle && steps - h.from < HOLD_CAP_STEPS) return true;
      h.resolve();
      return false;
    });
  }

  private release(): void {
    const held = this.holds;
    this.holds = [];
    for (const h of held) h.resolve();
  }

  // ---------------------------------------------------------- what the seam lacks

  /** The range director's current range: a change is Pull back or Move in; the end of its shift, with the camera at rest, is the clean-up. */
  private watchRange(): void {
    const r = this.opts.world.range();
    if (!r) return;
    if (this.range !== null && r.current !== this.range) this.director.rangeChange(r.current === 'far' ? 'pullBack' : 'moveIn');
    this.range = r.current;
    if (this.wasShifting && !r.shifting && !this.director.busy) this.director.rangeSettled();
    this.wasShifting = r.shifting;
  }

  /** The party's fall, once. */
  private watchFall(): void {
    if (this.fallen || !this.opts.world.partyFallen()) return;
    this.fallen = true;
    this.director.defeat();
    this.release();
  }
}
