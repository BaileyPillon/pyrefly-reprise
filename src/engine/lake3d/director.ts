/**
 * **The flying camera** (the hidden Wendigo chapter's 3D stage; FFX only): the shot director this scene publishes (`../ShotDirector.ts`) and the flights it flies. A tech demo's camera is free: where the painted chapters
 * can only tween between named rigs, this one flies a **Catmull-Rom path** through keys (`./layout.ts` `sampleFlight`), eased inside each leg, with its own field of view and a dutch roll, and takes four beats:
 *
 * - **`battleStart`: the opening.** Out of the aurora, down over the shore, skimming the ice at knee height past the party and up to the idle frame (6.6 s; the story's pre scene parks the camera on the flight's first key and
 *   fades in, `../../story/scripts/wendigo.ts`). The beat waits for the flight, so the first menu opens on the idle frame.
 * - **`actionOpen`, three moves**: the Wendigo's **Double Punch** (a quick low swing round to the target's side), its **arms going up** (a push in and a tilt up the brute) and nothing else; the rest are the presenter's own
 *   shots. The beat is released part-way through the flight (the anticipation), so the action plays while the camera is still moving; the first rig move of the presenter after it ends the flight and its own tween takes over
 *   from wherever the camera is.
 * - **`overdriveStart`**: a half circle round the caster and up.
 * - **`actionClose` of the blow that fells the last foe, and `victory`: the win and the ice break.** The story's post scene is a separate screen over a painted plate and owns no 3D scene, so the epilogue
 *   (`./epilogue.ts`) is played here, in the battle. At the close of the action after which every foe is down (`finished()`, read off the stage's actors by the scene) the party takes its victory poses, the camera flies the
 *   6 s **win flight** (a slow orbit round the party, then up and back over the lake as the ice breaks and the screen goes white) and **the beat's answer is held until the break is over**: the presenter awaits that beat, so
 *   the victory beat and the results follow under the white. **The battle HUD is hidden for the break** (`ShotCtx.setHud`, phase 4; the presenter puts it back when the screen leaves). A win with no such close (a foe petrified, say) starts it at the `victory` beat instead, which the presenter does not await, so it plays as long as the screen lasts.
 *
 * **The seat.** The flight is written into the battle camera as a rig of its own (`fly`) every frame and snapped to, with the roll set (`BattleCamera.setRoll`); the camera's own sway is off in that rig. If anything else
 * moves the camera meanwhile (the presenter, the story), the flight ends at once: the director never fights for it. At `'skip'` speed the camera snaps and no flight runs. Pure but for the `BattleCamera` it is handed.
 *
 * Game case: FFX only.
 */

import type { BattleCamera } from '../BattleCamera.ts';
import type { ActionShot, ActorShot, BattleStartShot, ShotAnswer, ShotCtx, ShotDirector } from '../ShotDirector.ts';
import { FLY_RIG, OPENING, flightLength, haymakerFlight, overdriveFlight, raiseFlight, sampleFlight, winFlight, type Flight, type V3 } from './layout.ts';
import { WENDIGO_ROWS } from './clipMap.ts';

export interface FlyOptions {
  /** Seconds into the flight at which the returned promise resolves (the rest flies on); default the end. */
  readonly awaitAt?: number;
  /** Flight seconds per real second (the playback speed). */
  readonly rate?: number;
  /** When true the flight ends on its last key and then hands the camera back (`false`: it stays where it ended, the shot is held until something else moves the camera). */
  readonly release?: boolean;
}

export class CameraDirector {
  private cam: BattleCamera | null = null;
  private flight: Flight | null = null;
  private t = 0;
  private rate = 1;
  private awaitAt = 0;
  private release = true;
  private resolve: (() => void) | null = null;
  private resolved = false;
  /** The flights flown, by name (a test's and the debug view's read). */
  readonly flown: string[] = [];

  /** `where` gives an actor's world position by combatant id, or null (the scene reads it off the stage's actors). */
  /** True once the win and the ice break have been started (they are played once). */
  private broke = false;

  /**
   * `where` gives an actor's world position by combatant id, or null; `ending` is the win's seam: `finished()` says whether every foe is down (the scene reads the stage's actors), `start()` begins the epilogue's clock and
   * the party's victory poses and answers when the break is over.
   */
  constructor(
    private readonly where: (id: string) => V3 | null = () => null,
    private readonly ending: { finished(): boolean; start(): Promise<void> } | null = null,
  ) {}

  /** Whether the win and the ice break have started. */
  get breaking(): boolean {
    return this.broke;
  }

  /** Start the win and the break (once): the HUD hidden, the win flight, if the camera may fly, and the epilogue; the promise answers when the break is over. */
  private win(ctx: ShotCtx): Promise<void> {
    this.broke = true;
    ctx.setHud?.(false); // the HUD goes for the ice break (the presenter puts it back when the screen leaves); at reduced motion too: the white fade still plays
    if (ctx.reducedMotion !== true) void this.fly(winFlight(this.eye()), { rate: CameraDirector.rateOf(ctx), release: false });
    return this.ending ? this.ending.start() : Promise.resolve();
  }

  /** The battle camera the scene was handed (`SceneBuild.bindCamera`). */
  bind(cam: BattleCamera | null): void {
    this.cam = cam;
    if (!cam) this.stop();
  }

  /** True while a flight is on. */
  get flying(): boolean {
    return this.flight !== null;
  }

  /** The name of the flight on now, or null. */
  get current(): string | null {
    return this.flight?.name ?? null;
  }

  /** Fly `flight` from its first key. Resolves at `awaitAt` seconds in (or the end). A flight in the air is replaced. */
  fly(flight: Flight, opts: FlyOptions = {}): Promise<void> {
    this.stop();
    if (!this.cam) return Promise.resolve();
    this.flight = flight;
    this.t = 0;
    this.rate = opts.rate !== undefined && opts.rate > 0 ? opts.rate : 1;
    this.awaitAt = opts.awaitAt ?? flightLength(flight);
    this.release = opts.release ?? true;
    this.resolved = false;
    this.flown.push(flight.name);
    this.seat(0);
    return new Promise<void>((resolve) => {
      this.resolve = resolve;
    });
  }

  /** End the flight now, leaving the camera where it is. */
  stop(): void {
    this.flight = null;
    this.cam?.setRoll(0);
    this.settle();
  }

  private settle(): void {
    const r = this.resolve;
    this.resolve = null;
    r?.();
  }

  /** Write the pose at flight time `t` into the camera. */
  private seat(t: number): void {
    const cam = this.cam;
    const f = this.flight;
    if (!cam || !f) return;
    const p = sampleFlight(f, f.keys[0]!.t + t);
    cam.addRig(FLY_RIG, { position: [...p.pos], lookAt: [...p.look], fov: p.fov, sway: 0 });
    cam.snapTo(FLY_RIG);
    cam.setRoll(p.roll);
  }

  /** Once a frame, before the battle camera's own update. */
  update(dt: number): void {
    const cam = this.cam;
    const f = this.flight;
    if (!cam || !f) return;
    if (cam.rigName !== FLY_RIG) {
      this.flight = null; // someone else moved the camera: the flight is over
      this.settle();
      return;
    }
    this.t += Math.max(0, dt) * this.rate;
    const length = flightLength(f);
    if (!this.resolved && this.t >= this.awaitAt) {
      this.resolved = true;
      this.settle();
    }
    if (this.t >= length) {
      this.seat(length);
      this.flight = null;
      if (this.release) cam.setRoll(0);
      this.settle();
      return;
    }
    this.seat(this.t);
  }

  /** The playback rate a beat's context says: flight seconds per real second. */
  private static rateOf(ctx: ShotCtx): number {
    const ms = ctx.ms(1000);
    return ms > 0 ? 1000 / ms : 1;
  }

  /** Where the camera is now (for a flight that starts from it). */
  private eye(): V3 {
    const p = this.cam?.camera.position;
    return p ? [p.x, p.y, p.z] : [0, 2, 10];
  }

  /** The director the scene publishes (`SceneStaging.shotDirector`). */
  readonly shotDirector: ShotDirector = {
    battleStart: (ctx: BattleStartShot): ShotAnswer => {
      if (ctx.skipping || ctx.reducedMotion === true || !this.cam) {
        ctx.camera.snapTo('idle');
        return true;
      }
      return this.fly(OPENING, { rate: CameraDirector.rateOf(ctx) }).then(() => true);
    },
    actionOpen: (ctx: ActionShot): ShotAnswer => {
      if (ctx.skipping || ctx.reducedMotion === true || !this.cam) return false;
      const id = ctx.action.abilityId;
      if (ctx.actor.id !== 'wendigo' || id === undefined) return false;
      const rate = CameraDirector.rateOf(ctx);
      if (id === WENDIGO_ROWS.haymaker) {
        const aim = this.where(ctx.targets[0]?.id ?? '') ?? [0, 0, 1];
        return this.fly(haymakerFlight(this.eye(), aim), { awaitAt: 0.7, rate }).then(() => true);
      }
      if (id === WENDIGO_ROWS.raiseArms) {
        const at = this.where('wendigo') ?? [2.5, 0, -5.8];
        return this.fly(raiseFlight(this.eye(), at), { awaitAt: 1.2, rate }).then(() => true);
      }
      return false;
    },
    overdriveStart: (ctx: ActionShot): ShotAnswer => {
      if (ctx.skipping || ctx.reducedMotion === true || !this.cam) return false;
      const at = this.where(ctx.actor.id) ?? [0, 0, 1];
      return this.fly(overdriveFlight(this.eye(), at), { awaitAt: 0.9, rate: CameraDirector.rateOf(ctx) }).then(() => true);
    },
    overdriveEnd: (_ctx: ActorShot): ShotAnswer => false,
    actionClose: (ctx: ActorShot): ShotAnswer => {
      if (this.broke || ctx.skipping || !this.cam || !this.ending || !this.ending.finished()) return false; // an ordinary close: the presenter brings the camera back
      return this.win(ctx).then(() => true); // the last foe is down: the win and the break, and the battle waits for it
    },
    victory: (ctx: ShotCtx): ShotAnswer => {
      if (ctx.skipping || !this.cam) return false;
      if (!this.broke) void this.win(ctx); // no close saw the last foe fall: it starts now and plays as long as the screen lasts
      return true;
    },
  };

  dispose(): void {
    this.flight = null;
    this.cam = null;
    this.settle();
  }
}
