/**
 * The shared half of the moments: the state a shot keeps, the playback timing, the rigs, the scene's shot director and the audio cue.
 *
 * `BattleMoments` was one 700-line class. It is now a short chain of classes, one responsibility each, every layer calling only the layers below it:
 * `BattleMomentsBase` -> `BattleMomentsOpening` -> `BattleMomentsActions` -> `BattleMomentsHeld` -> `BattleMoments` (import that one from `BattleMoments.ts`).
 * A pure move (ChatGPT's point 8b, 2026-10-28; both games): no method changed, only `private` became `protected` where a later layer reads it.
 */

import type { CombatantId } from '../battle/common/types.ts';
import type { CameraPort } from './BattlePresenterPorts.ts';
import { SPEED_SCALE } from './BattlePresenterUtil.ts';
import { paceFactor } from './pace.ts';
import { ShotRules } from './ShotRules.ts';
import type { ShotAction, ShotAnswer, ShotCtx, ShotDirector, ShotSubject } from './ShotDirector.ts';
import { ProDirector } from './procam/ProDirector.ts'; // `?camera=pro` (demo chapters only): the directed camera, asked when the scene publishes no director of its own
import { proCamOn } from './procam/ProCamSwitch.ts';
import { MOMENT_TIMING, CUT_THRESHOLD_MS, type MomentDeps } from './BattleMomentsConfig.ts';

export class BattleMomentsBase {
  protected readonly deps: MomentDeps;

  /** True while the camera is parked on anything other than `idle`. */
  protected onActionRig = false;
  /** Set between `overdriveOpen` and `overdriveClose`, so the close is safe to call blind. */
  protected overdriveOpen = false;
  /** Set while a charge telegraph's held zoom and vignette are up. */
  protected telegraphOpen = false;
  /** Actions opened so far, and the count when the telegraph went up. */
  protected actions = 0;
  protected telegraphAtAction = -1;
  /** Enemies whose reveal plate has already played, so a chained form does not replay it. */
  protected readonly revealed = new Set<CombatantId>();
  /** Set while a Confirm press is cutting the opening short (`OpeningSkip.ts`, PR-0061): every wait collapses. */
  hurry = false;
  /** A-13: an attack was opened and its first hit has not landed yet. */
  protected rollOwed = false;
  /** The action opened last and not yet closed: who, and what, for the beats after its opening (`ShotDirector.ts`). */
  protected open: { actor: ShotSubject; action: ShotAction } | null = null;
  /** The scene's director took a held shot's opening, so its release is the director's too: a telegraph's, a form change's. */
  protected telegraphDirected = false;
  protected formDirected = false;
  /** The framing rules a shot is checked against (A-11, A-1, A-12; `ShotRules.ts`). */
  readonly shots: ShotRules;

  constructor(deps: MomentDeps) {
    this.deps = deps;
    this.shots = new ShotRules(deps.stage, () => deps.moments);
  }

  // ------------------------------------------------------------------ timing

  private get scale(): number {
    return this.hurry ? 0 : SPEED_SCALE[this.deps.speed()] * paceFactor('action'); // the pacing option (`pace.ts`)
  }

  /** True when playback is collapsing every wait (e2e, the critic). */
  get skipping(): boolean {
    return this.deps.speed() === 'skip';
  }

  /** The player's reduce-motion setting, as the overlay reports it (A-13). */
  get reducedMotion(): boolean {
    try {
      return this.deps.moments?.reduceMotion?.() === true;
    } catch {
      return false;
    }
  }

  /** The player's REDUCE FLASHES setting, as the overlay reports it (PR-0032): only an action's first blow flashes. */
  get reducedFlashes(): boolean {
    try {
      return this.deps.moments?.reduceFlashes?.() === true;
    } catch {
      return false;
    }
  }

  /** `base` ms at the current playback speed. */
  ms(base: number): number {
    return Math.max(0, base * this.scale);
  }

  protected get cam(): CameraPort {
    return this.deps.stage.camera;
  }

  // ------------------------------------------------------------------- rigs

  /** The first of `names` this scene actually publishes, or null. */
  pick(...names: string[]): string | null {
    const have = this.cam.rigNames;
    for (const name of names) if (have.includes(name)) return name;
    return null;
  }

  /**
   * Which rig frames `id`. Every scene publishes `idle`/`action`; most also
   * publish `party` and `enemy`, which is what makes "push in on the attacker,
   * cut to the target" read as two different shots rather than one.
   */
  rigFor(id: CombatantId): string | null {
    const side = this.deps.stage.sideOf(id);
    return side === 'enemy'
      ? this.pick('enemy', 'action', 'idle')
      : this.pick('party', 'action', 'idle');
  }

  /** Move to `rig` over `base` ms, or cut to it when the speed collapses that. */
  protected async move(rig: string | null, base: number): Promise<void> {
    if (!rig) return;
    const ms = this.ms(base);
    if (ms < CUT_THRESHOLD_MS) {
      this.cam.snapTo(rig);
      return;
    }
    await this.cam.moveTo(rig, ms);
  }

  /** A hard cut. Never tweened — that is the whole point of a cut. */
  protected cut(rig: string | null): void {
    if (rig) this.cam.snapTo(rig);
  }

  // ------------------------------------------------------------- shot director

  /**
   * Ask the scene's shot director (`SceneStaging.shotDirector`, `ShotDirector.ts`) whether it takes this beat's camera. `undefined` when the scene publishes none or it has no handler for the
   * beat: the beat plays as it always has and nothing is awaited. A handler that throws, or whose promise rejects, answers `false`: a broken director costs the shot, never the battle.
   */
  protected ask(call: (director: ShotDirector) => ShotAnswer | undefined): ShotAnswer | undefined {
    const director = this.deps.stage.shotDirector ?? this.proDirector();
    if (!director) return undefined;
    try {
      const answer = call(director);
      return answer instanceof Promise ? answer.catch(() => false) : answer;
    } catch {
      return undefined;
    }
  }

  /** `?camera=pro`: the directed camera for the two demo chapters (`procam/ProDirector.ts`), made at the first beat that asks; undefined whenever the switch is off, so every other chapter plays as it always has. */
  private pro: ProDirector | null = null;
  private proDirector(): ShotDirector | undefined {
    if (!proCamOn()) return undefined;
    return (this.pro ??= new ProDirector(this.deps.stage));
  }

  /** What every beat's context carries. */
  protected shotCtx(): ShotCtx {
    return { camera: this.cam, speed: this.deps.speed(), skipping: this.skipping, ms: (base) => this.ms(base), ...(this.reducedMotion ? { reducedMotion: true } : {}) };
  }

  /** A combatant and its side, as the stage reports it. */
  protected subject(id: CombatantId): ShotSubject {
    return { id, side: this.deps.stage.sideOf(id) };
  }

  /**
   * An explicit `camera` event from a boss's data file. Bypasses the shot
   * grammar (that is what it is for) but still obeys the playback speed.
   */
  async moveToRig(rig: string, base: number): Promise<void> {
    this.onActionRig = rig !== 'idle';
    await this.move(rig, base);
  }

  protected cue(key: string, volume = 1, events?: readonly string[]): void {
    try {
      this.deps.audio?.playSfx(key, events ? { volume, events } : { volume });
    } catch {
      /* audio is optional; a moment never fails for a missing cue */
    }
  }

  /** The HUD is optional and never worth failing a moment over. */
  protected setHudVisible(visible: boolean): void {
    try {
      this.deps.hud?.setVisible(visible);
    } catch {
      /* a HUD that cannot hide is not a reason to lose the opening */
    }
  }

  /** Fall back to the neutral framing if a shot is still up: a turn begins, an action closes, a form settles. */
  protected async settle(): Promise<void> {
    if (!this.onActionRig) return;
    this.onActionRig = false;
    void this.cam.release?.(this.ms(MOMENT_TIMING.returnOut));
    void this.move(this.pick('idle'), MOMENT_TIMING.returnOut);
  }
}
