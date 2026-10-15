/**
 * **The chapter's camera, whatever plays the shots** (`CameraCore`; FFX only): the part of the hidden Fayth chapter's camera that does not depend on how a shot is made. The FFX camera programs replayed in a VM
 * (`./faythCamera.ts`, a dev server with Bailey's local folder) and the website's keyframe table (`./tableCamera.ts`) are both a {@link CameraBackend}: something that starts a shot on a beat, runs it a logic
 * step at a time and publishes the pose. This file is what both owe the presenter and the tracking net beyond that, so the two behave the same where it counts. It holds no program, no table and no `three`:
 * it is pure and runs in Node against the presenter's fakes.
 *
 * - **Time.** `update(dt)` advances the backend by the frame's own `dt` (a paused or hit-stopped field is not counted, a hidden tab is capped by the backend), at the playback rate of the last beat (`ctx.ms`: fast
 *   play about three times quicker, a skipped or hurried beat runs every shot to its end at once).
 * - **The roster.** Each player character is the party or the reserve by whether it is on the field, the party in the order of its slots (nearest the NEAR camera first); a change is told to the backend.
 * - **The launch fallback.** FFX launches an action's own shot with its effect. The presenter raises `impact` only where damage lands, so a status-only action (Haste, Cheer, a miss, a zero) never reaches the
 *   backend's launch and would play without its shot. At the action's close, **before** Normal, an action that owes a launch starts it and **the close waits for it**: the returned promise settles when the camera is
 *   idle again, so the battle waits for a shot no longer than the shot runs (and not at all when skipping, where it ran to its end at once). A cap of {@link HOLD_CAP_STEPS} logic steps stands behind it, and
 *   `dispose` releases every wait.
 * - **The airship's range scenes.** The scene watches the range director's current range (`state.flags['airship.range']` as `sync` sets it): near to far is **Pull back**, far to near **Move in**, and
 *   `rangeChange` plays the scene. The engine flips the flag as it resolves Cid's order, **before** the presenter plays that action, so the scene can already be running when the action's own beats arrive. In FFX the
 *   scene is the order's own action (its driver waits for Evrae's flight before Normal), so nothing else may start until it is over: an action's **opening waits for the scene to end** (the presenter awaits it, so the
 *   next actor's action begins when the swoop has landed; its accept would otherwise cut the scene), a turn start (not awaited by the presenter) is not raised while the scene plays, and the action's **close waits
 *   for the scene to end** too, then raises Normal. The range director's own shift (1.5 s of fade and move, against a 6 s swoop) never cuts the scene short: `rangeSettled` is only the clean-up.
 * - **Defeat.** The seam has no defeat beat, so the scene reports the party's fall (every active member down) once, and the backend plays the defeat camera.
 * - **Tracking** (`./safetyNet.ts`). The pose the backend publishes goes through the safety net on its way to the sink: when a shot has lost every subject of its beat for more than six logic steps, the net takes the
 *   picture over with the default view re-aimed at them, and gives it back when the shot holds them again. The subjects are read here from the beats (`./shotSubjects.ts`): the actor and its targets while an
 *   action's own shot runs, the party (watched with Evrae) for the default views, the scenes and between actions. The shot is the backend's; the net only changes what reaches the sink, and logs what it does.
 *
 * Game case: FFX only.
 */

import type { ActionShot, ActorShot, BattleStartShot, FormChangeShot, ImpactShot, ShotAnswer, ShotCtx, ShotDirector, TelegraphShot } from '../ShotDirector.ts';
import type { CameraActor } from './frames.ts';
import { boxOf } from './frames.ts';
import type { Box } from './framing.ts';
import { FAYTH_BOSS, FAYTH_PLAYERS } from './roster.ts';
import { SafetyNet, describeNetEvent, type HomeView, type NetEvent, type NetFrame } from './safetyNet.ts';
import type { CameraSink } from './sink.ts';
import type { CameraPose } from './solver.ts';
import { subjectsOf, type OpenAction } from './shotSubjects.ts';

/** Logic steps a held action close may wait for the camera to go idle before it is let go (20 s at 29.97 Hz; the longest shot is the defeat's 501 steps). */
export const HOLD_CAP_STEPS = 600;

/** The window's shape when the scene does not say: 16:9. */
const DEFAULT_ASPECT = 16 / 9;

/** What the camera needs to know of the scene it plays in. */
export interface FaythCameraWorld {
  /** The live actor of a combatant id, or undefined when it is not on the field. */
  actor(id: string): CameraActor | undefined;
  /** The airship range as the range director sees it, or null when the scene has no range game. */
  range(): { readonly current: 'near' | 'far'; readonly shifting: boolean } | null;
  /** Every active party member on the field is down (the party has fallen); false with none on the field. */
  partyFallen(): boolean;
  /**
   * The shape of what the player sees of the render, width over height (`../../scenes/exp-fayth-world.ts`, `windowAspect`: the live camera's own aspect, or an upright phone's 3:4 slice of its 16:9 render); absent means
   * 16:9. The tracking net judges "in frame" for this window and the camera sink draws the lens for it (`./geometry.ts`, `screenFovDeg`), so the net sees the camera the player does.
   */
  aspect?(): number;
}

/**
 * Whatever makes the shots: it starts one on a beat, runs it a logic step at a time and publishes each pose to the sink it was given. The beat handlers answer as a `ShotDirector` does (true once the camera is
 * live); the rest is what {@link CameraCore} needs beyond the seam.
 */
export interface CameraBackend extends Required<ShotDirector> {
  /** The open action's launch shot, owed to an action that raised no impact: starts it and returns true when a shot started. */
  launchOwed(ctx?: ShotCtx): boolean;
  /** A shot is playing or a move is armed: the camera is mid-shot. */
  readonly busy: boolean;
  /** A range scene (Pull back, Move in) is playing. */
  readonly sceneRunning: boolean;
  /** The party fell: the defeat camera. */
  defeat(ctx?: ShotCtx): boolean;
  /** The airship pulls back or closes in: the scene plays, and Normal follows when it is over. False with no scene. */
  rangeChange(kind: 'pullBack' | 'moveIn', ctx?: ShotCtx): boolean;
  /** The scene's range change is over: Normal now, ending the scene early if it is still running. */
  rangeSettled(): void;
  /** Advance by `dtMs` of real time at the live playback rate. Never throws. */
  advance(dtMs: number): void;
  /** The logic steps run so far. */
  readonly steps: number;
  /** The id of the shot on the camera (a program id, a table shot id), or undefined. */
  readonly programId: string | undefined;
}

export interface CameraCoreOptions<B extends CameraBackend> {
  /** Makes the backend, given the sink it must publish to (the tracking net in front of the real one). */
  readonly makeBackend: (sink: CameraSink) => B;
  /** Where the pose goes (a `PoseLatch`: the camera is written at render time). */
  readonly sink: CameraSink;
  readonly world: FaythCameraWorld;
  /** FFX's two default views: with them the tracking safety net is on (it needs a view to re-aim); without, the pose goes to the sink as the backend says it. */
  readonly homes?: { readonly near: HomeView; readonly far: HomeView };
  /** False turns the net off even with `homes` (the comparison mode). */
  readonly net?: boolean;
  readonly warn?: (message: string) => void;
  /** Where the net's events go (default: a dev `console.info`). */
  readonly netLog?: (event: NetEvent) => void;
  /** The ids of the shots that are views of the whole fight (the default views, the scenes, the victory, the defeat): the net holds the party for them. */
  readonly wholeFight: ReadonlySet<string>;
  /** The party on the field changed: the player characters on the deck, in slot order. */
  readonly onLineup?: (ids: readonly string[]) => void;
}

interface Hold {
  readonly resolve: () => void;
  /** The backend's step count when the hold began. */
  readonly from: number;
}

/** The sink the backend publishes to: the safety net between the shot's pose and the real sink. A net that throws costs the net, not the picture. */
class NetSink implements CameraSink {
  private failed = false;

  constructor(
    private readonly inner: CameraSink,
    private readonly net: SafetyNet,
    private readonly frameFor: (raw: CameraPose) => NetFrame | null,
    private readonly warn: (message: string) => void,
  ) {}

  apply(pose: CameraPose): void {
    let out = pose;
    if (!this.failed) {
      try {
        const frame = this.frameFor(pose);
        if (frame) out = this.net.process(frame);
      } catch (e) {
        this.failed = true;
        this.warn(`[ffxcam] the tracking net failed and is off: ${String(e)}`);
      }
    }
    this.inner.apply(out);
  }
}

export class CameraCore<B extends CameraBackend> {
  readonly backend: B;
  /** What the scene publishes as `SceneStaging.shotDirector`. */
  readonly shotDirector: ShotDirector;
  /** The tracking safety net (it only acts with `homes`, and not with `net: false`). */
  readonly net: SafetyNet;

  private holds: Hold[] = [];
  private range: 'near' | 'far' | null = null;
  private wasShifting = false;
  private fallen = false;
  /** The beat the presenter last raised, the action it opened (null between actions), and the roster's current line-up. */
  private beatKind = 'none';
  private open: OpenAction | null = null;
  private onField = '';

  constructor(protected readonly core: CameraCoreOptions<B>) {
    const warn = core.warn ?? ((m: string) => (import.meta.env.DEV ? console.warn(m) : undefined));
    this.net = new SafetyNet({ log: core.netLog ?? ((e) => (import.meta.env.DEV ? console.info(describeNetEvent(e)) : undefined)) });
    const sink = core.homes && core.net !== false ? new NetSink(core.sink, this.net, (raw) => this.netFrame(raw), warn) : core.sink;
    this.backend = core.makeBackend(sink);
    this.shotDirector = this.wrap();
  }

  /** Once a frame, after the scene's own update: the range scenes, the backend's steps, the party's fall, the waits. */
  update(dt: number): void {
    this.watchRange();
    this.backend.advance(dt * 1000);
    this.watchFall();
    this.settleHolds();
  }

  /** Let go of every wait (the scene is leaving, or the battle is over): nothing is left waiting on a camera that will not be updated again. */
  dispose(): void {
    this.release();
  }

  // ------------------------------------------------------------------ the beats

  private wrap(): ShotDirector {
    const d = this.backend;
    return {
      battleStart: (ctx: BattleStartShot): ShotAnswer => {
        this.beat('battleStart', null);
        return d.battleStart(ctx);
      },
      turnStart: (ctx: ActorShot): ShotAnswer => {
        this.beat('turnStart', null);
        return d.sceneRunning ? true : d.turnStart(ctx); // a range scene owns the camera, and the presenter does not wait for a turn start
      },
      actionOpen: (ctx: ActionShot): ShotAnswer => {
        this.beat('actionOpen', { actor: ctx.actor.id, targets: ctx.targets.map((t) => t.id) });
        return this.opening(() => d.actionOpen(ctx));
      },
      impact: (ctx: ImpactShot): boolean => {
        this.noteImpact(ctx);
        return d.impact(ctx);
      },
      actionClose: (ctx: ActorShot): ShotAnswer => this.close(ctx),
      overdriveStart: (ctx: ActionShot): ShotAnswer => {
        this.beat('overdriveStart', { actor: ctx.actor.id, targets: ctx.targets.map((t) => t.id) });
        return this.opening(() => d.overdriveStart(ctx));
      },
      overdriveEnd: (ctx: ActorShot): ShotAnswer => d.overdriveEnd(ctx),
      telegraph: (ctx: TelegraphShot): ShotAnswer => d.telegraph(ctx),
      formChange: (ctx: FormChangeShot): ShotAnswer => d.formChange(ctx),
      victory: (ctx: ShotCtx): ShotAnswer => {
        this.release(); // the fight is won: nothing waits on the camera
        this.beat('victory', null);
        return d.victory(ctx);
      },
    };
  }

  /** An action's opening: at once, unless a range scene is playing, in which case it waits for the scene to end (the scene is the order's own action) and then opens as ever. */
  private opening(open: () => ShotAnswer): ShotAnswer {
    return this.backend.sceneRunning ? this.hold().then(open) : open();
  }

  /**
   * The action's close. An action that owes its launch shot (it raised no impact) starts it now, and a range scene may be playing: either way the close **waits for the camera to be idle**, then raises Normal.
   * Otherwise it is the backend's own close, at once.
   */
  private close(ctx: ActorShot): ShotAnswer {
    const d = this.backend;
    const done = (): ShotAnswer => {
      this.beat('actionClose', null); // Normal is being raised: the default views' subjects from here
      return d.actionClose(ctx);
    };
    const owed = d.launchOwed(ctx);
    if (owed || d.sceneRunning) return this.hold().then(done);
    return done();
  }

  // ----------------------------------------------------------------- the waits

  /** A promise that settles when the camera goes idle (at once if it already is). */
  private hold(): Promise<void> {
    if (!this.backend.busy) return Promise.resolve();
    return new Promise<void>((resolve) => this.holds.push({ resolve, from: this.backend.steps }));
  }

  private settleHolds(): void {
    if (this.holds.length === 0) return;
    const steps = this.backend.steps;
    const idle = !this.backend.busy;
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
    const r = this.core.world.range();
    if (!r) return;
    if (this.range !== null && r.current !== this.range) this.backend.rangeChange(r.current === 'far' ? 'pullBack' : 'moveIn');
    this.range = r.current;
    if (this.wasShifting && !r.shifting && !this.backend.busy) this.backend.rangeSettled();
    this.wasShifting = r.shifting;
  }

  /** The party's fall, once. */
  private watchFall(): void {
    if (this.fallen || !this.core.world.partyFallen()) return;
    this.fallen = true;
    this.backend.defeat();
    this.release();
  }

  // -------------------------------------------------------------------- tracking

  /** A beat the presenter raised: its kind and the action it opened (null for a beat between actions). */
  private beat(kind: string, open: OpenAction | null): void {
    this.beatKind = kind;
    this.open = open;
    this.syncRoster();
  }

  /** A blow landed: its target joins the open action's (the audit and the net read the targets of the opening plus every impact's). */
  private noteImpact(ctx: ImpactShot): void {
    this.beatKind = 'impact';
    const open = this.open;
    if (open && !open.targets.includes(ctx.target.id)) this.open = { actor: open.actor, targets: [...open.targets, ctx.target.id] };
  }

  /** Each player character is the party or the reserve by whether it is on the field (a switch changes the party), the party in the order of its slots (nearest the NEAR camera first): the backend is told when it changes. */
  private syncRoster(): void {
    const on = FAYTH_PLAYERS.flatMap((id) => {
      const a = this.core.world.actor(id);
      return a !== undefined && a.shown !== false ? [{ id, z: a.position.z }] : []; // a reserve member may exist off the field, hidden
    }).sort((a, b) => a.z - b.z); // the world's z is FFX's minus: the slot at z 120 comes first
    const ids = on.map((o) => o.id);
    const signature = ids.join(',');
    if (signature === this.onField) return;
    this.onField = signature;
    this.core.onLineup?.(ids);
  }

  /** What the net is told for the pose the backend just published, or null when there is nothing to track. */
  private netFrame(raw: CameraPose): NetFrame | null {
    const homes = this.core.homes;
    if (!homes) return null;
    this.syncRoster();
    const world = this.core.world;
    const shown = (id: string): boolean => {
      const a = world.actor(id);
      return a !== undefined && a.shown !== false;
    };
    const subjects = subjectsOf(this.open, this.backend.programId, this.core.wholeFight, FAYTH_PLAYERS.filter(shown), FAYTH_BOSS, shown);
    const measured = new Map<string, Box>(); // each figure's box once per publish (the live box walks a skeleton)
    const boxes = (ids: readonly string[]) =>
      ids.flatMap((id) => {
        let box = measured.get(id);
        if (!box) {
          const a = world.actor(id);
          if (!a) return [];
          box = boxOf(a);
          measured.set(id, box);
        }
        return [box];
      });
    return {
      steps: this.backend.steps,
      raw,
      aspect: world.aspect?.() ?? DEFAULT_ASPECT,
      watch: boxes(subjects.watch),
      hold: boxes(subjects.hold),
      home: homes[world.range()?.current ?? 'near'],
      key: `${this.beatKind}:${this.backend.programId ?? ''}:${subjects.who}`,
      noActor: !subjects.actorDrawn,
    };
  }
}
