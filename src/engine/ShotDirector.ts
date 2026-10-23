/**
 * The **shot director**: an optional camera plan a scene can publish (`SceneStaging.shotDirector`, `src/scenes/types.ts`), which `BattleMoments` asks before it moves the camera for a beat.
 *
 * `BattleMoments` is "the only thing that decides which shot" (`BattleMoments.ts`): ten named beats, each with its own camera move. A scene that wants its own camera for a beat (the hidden Fayth chapter,
 * FFX's own battle camera, D-632; `docs/plans/fayth-3d.md`) publishes a director with a handler for that beat. At the beat, `BattleMoments` calls the handler with what it knows; the handler answers
 * **whether it took the beat's camera**:
 *
 * - `true` (or a promise of `true`): the director moved the camera, so `BattleMoments` makes **none** of its own camera moves for that beat. Everything else the beat does stays `BattleMoments`'s: its
 *   bookkeeping, the HUD, the sounds, the letterbox, the name slab and the vignette, and the party's walk on at the opening.
 * - `false`, no handler for the beat, or no director at all: `BattleMoments` plays its own shot exactly as it always has. Every scene that publishes no director is therefore byte-identical.
 *
 * A promise answer is waited for before the beat goes on (the beat's own camera moves, when it takes them, come after it): return `true` synchronously after starting a tween to let the beat go on at once. A
 * handler that throws, or whose promise rejects, counts as `false`: a broken director costs the shot, never the battle. `impact` is the one synchronous beat (the presenter does not wait for it), so its
 * answer is a plain boolean, and only `true` counts.
 *
 * What a director must know about the playback: it is handed `speed` and `skipping` and `ms()` (the beat's durations at the live speed, as `BattleMoments.ms`), and at `'skip'` it should snap and not tween,
 * as `BattleMoments` does, so a whole chapter still resolves in milliseconds for the e2e and the critic.
 *
 * Not beats, so never asked: an explicit `camera` event from a boss's data file or a cutscene (`BattleMoments.moveToRig`, "bypasses the shot grammar"), the return to `idle` before a command menu
 * (`settleForMenu`), and the held shots' ends (a telegraph's and a form change's release follow their opening: taken when it was taken). Where a director took an opening, `BattleMoments` makes
 * no release for it either.
 *
 * Pure types: no `three`, no DOM (the same rule as the presenter ports), so a director is testable in Node against the presenter's fakes. Game case: shared plumbing (both), inert until a scene
 * publishes a director; today only the hidden Fayth chapter (FFX only) does: a stub that declines every beat (`src/engine/ffxcam/stubDirector.ts`), and on a dev server with Bailey's local camera folder FFX's own camera (`src/engine/ffxcam/faythCamera.ts`).
 */

import type { AbilityId, CombatantId, CommandKind } from '../battle/common/types.ts';
import type { CameraPort, PlaybackSpeed } from './BattlePresenterPorts.ts';

/** The ten beats `BattleMoments` plays a shot for, in the order a fight meets them. */
export type ShotBeat =
  | 'battleStart'
  | 'turnStart'
  | 'actionOpen'
  | 'impact'
  | 'actionClose'
  | 'overdriveStart'
  | 'overdriveEnd'
  | 'telegraph'
  | 'formChange'
  | 'victory';

/** Did the director take the beat's camera? A promise resolves to the same answer. */
export type ShotAnswer = boolean | Promise<boolean>;

/** A combatant as the stage reports it. `side` is undefined for an id the stage does not know. */
export interface ShotSubject {
  readonly id: CombatantId;
  readonly side: 'party' | 'enemy' | 'aeon' | undefined;
}

/** What the presenter says about the action in hand, beyond who does it to whom (optional: the opening beats of an action pass it; a caller that does not leaves it out). */
export interface ShotActionInfo {
  /** The ability the command resolved to (`action-start`'s `abilityId`); absent for a plain attack, a defend, an escape. */
  readonly abilityId?: AbilityId | undefined;
  /** The engine's command kind: `'attack'`, `'ability'`, `'item'`, `'overdrive'`, `'summon'`... */
  readonly commandKind?: CommandKind | undefined;
  /** The action's own events already hold the KO of a foe (the burst is resolved before it is played): the killing blow's push begins with the action (`?camera=pro`). Absent: not known or not lethal. */
  readonly lethal?: boolean | undefined;
}

/** The action a beat belongs to. */
export interface ShotAction extends ShotActionInfo {
  /**
   * What kind of action it is, as the shot grammar sees it: the painted pose the presenter picked for it (`'attack'` kicks the horizon over and cuts away fast, `'cast'` holds on the caster,
   * `'item'`...), or `'overdrive'` for an Overdrive.
   */
  readonly kind: string;
  /** The ability's display name, where the beat knows it (an Overdrive's name slab). */
  readonly name?: string | undefined;
}

/** What every beat's context carries. */
export interface ShotCtx {
  /** The presenter's camera port: the one `BattleMoments` moves (rigs, snaps, pushes, rolls, shakes). */
  readonly camera: CameraPort;
  /** The live playback speed. */
  readonly speed: PlaybackSpeed;
  /** True at `'skip'`: snap to the end state, show no animation. */
  readonly skipping: boolean;
  /** `base` ms at the live playback speed (`BattleMoments.ms`: the speed, the pacing option, a hurried opening). */
  ms(base: number): number;
  /** REDUCE MOTION is on (`MomentsPort.reduceMotion`): a director plays held frames and cuts, no moves. Additive: absent in a test's own context. */
  readonly reducedMotion?: boolean | undefined;
}

/** The opening of a battle. */
export interface BattleStartShot extends ShotCtx {
  /** The party members who walk on. */
  readonly partyIds: readonly CombatantId[];
  /** The headline enemy the reveal is about, and its name plate's words; null for a fight with no single boss. */
  readonly boss: ShotSubject | null;
  readonly bossName: string | null;
}

/** A beat about a turn or a close, with the combatant it belongs to when `BattleMoments` knows one. */
export interface ActorShot extends ShotCtx {
  /** Whose turn it is (turnStart, when the presenter says), or who was acting (the beats after an action opened). */
  readonly actor?: ShotSubject | undefined;
  /** The action that was open, for the beats after one opened. With overlapping actions (FFX-2's ATB) it is the latest opened. */
  readonly action?: ShotAction | undefined;
}

/** An action opens: the push in on the attacker (`actionOpen`) or the Overdrive's own rig (`overdriveStart`). */
export interface ActionShot extends ShotCtx {
  readonly actor: ShotSubject;
  readonly targets: readonly ShotSubject[];
  readonly action: ShotAction;
  /**
   * Wait the cast's wind-up hold at the live speed: the pause `BattleMoments` awaits itself after its push in on a cast (`MOMENT_TIMING.castHold`). A director that takes `actionOpen` takes that hold
   * with it, so a director that wants the spell to land when it always did awaits this before it answers (the pro camera does). Only `actionOpen` carries it. Additive.
   */
  castHold?(): Promise<void>;
}

/** A blow lands. Every hit asks, the later hits of a multi-hit action too (`BattleMoments` itself cuts only on the first). */
export interface ImpactShot extends ActorShot {
  readonly target: ShotSubject;
  /** 0-based index within a multi-hit action. */
  readonly hitIndex: number;
  /** A critical, an overkill or a capped hit: the punch `BattleMoments` adds. */
  readonly heavy: boolean;
  /** The blow's element (`damage.element`), for a director that picks a landing shot by it. Additive. */
  readonly element?: string | undefined;
  /** This blow is the one that KOs a foe (the burst already holds the KO). Additive. */
  readonly lethal?: boolean | undefined;
}

/** A boss winds up something that ends the fight (stage 2: it lands next turn). */
export interface TelegraphShot extends ShotCtx {
  readonly enemy: ShotSubject;
  readonly stage: 1 | 2;
  readonly name?: string | undefined;
}

/** A boss changes form. */
export interface FormChangeShot extends ShotCtx {
  readonly enemy: ShotSubject;
}

/**
 * A scene's shot director: one optional handler per beat. A handler answers whether it took the beat's camera (see the file header); a beat it has no handler for is `BattleMoments`'s own.
 */
export interface ShotDirector {
  /** The opening: the establishing shot, the party's walk on, the boss reveal's camera. Taken: `BattleMoments` makes no opening, reveal or hold move (the party still walks on, the plate still shows). */
  battleStart?(ctx: BattleStartShot): ShotAnswer;
  /** A turn begins: the return to the neutral framing. */
  turnStart?(ctx: ActorShot): ShotAnswer;
  /** An action opens (not an Overdrive): the push in on the attacker and the cast's hold. Taken: no push, no rig move, no hold. */
  actionOpen?(ctx: ActionShot): ShotAnswer;
  /** A blow lands: the cut to the target, the punch, the roll. Synchronous: only `true` takes it. */
  impact?(ctx: ImpactShot): boolean;
  /** The action is over: the return to the neutral framing, and any Overdrive's or telegraph's release still up. */
  actionClose?(ctx: ActorShot): ShotAnswer;
  /** An Overdrive opens: its own rig and held push. Taken: no rig, no push (the letterbox, the slab and the stinger still play). */
  overdriveStart?(ctx: ActionShot): ShotAnswer;
  /** The Overdrive's payoff has landed: the release of its push. Taken: no release (the letterbox still comes down). */
  overdriveEnd?(ctx: ActorShot): ShotAnswer;
  /** A boss charges: the slow zoom. Taken: no zoom or rig move (the vignette and the slab still play), and no release when it ends. */
  telegraph?(ctx: TelegraphShot): ShotAnswer;
  /** A boss changes form: the hold on it. Taken: no push or rig move, and no release when the form settles. */
  formChange?(ctx: FormChangeShot): ShotAnswer;
  /** The victory pose's rig. Taken: no release, no rig move (a telegraph's or an Overdrive's still-open chrome comes down). */
  victory?(ctx: ShotCtx): ShotAnswer;
}
