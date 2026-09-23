/**
 * Everything {@link BattlePresenter} talks to, as interfaces.
 *
 * **This module imports nothing but battle types.** No `three`, no DOM — which
 * is what lets `tests/unit/presenter-*.test.ts` run the whole playback loop in
 * Node against fakes. The real implementations live in
 * `BattlePresenterStage.ts` (Three.js) and `BattlePresenterFallbacks.ts` (DOM).
 *
 * `PaintedActor` satisfies {@link ActorHandle} structurally, so the stage hands
 * its actors straight through without an adapter.
 */

import type {
  AvailableCommand,
  BattleEngine,
  BattleResult,
  Command,
  MinigameKind,
  BattleEvent,
  CameraRigId,
  CombatantId,
  MessageKind,
  VfxKey,
} from '../battle/common/types.ts';
import type { StoryScript } from '../story/dsl.ts';

/** A point on the field, in world units. */
export interface Point3 {
  x: number;
  y: number;
  z: number;
}

/** A point on screen, in CSS pixels relative to the canvas. */
export interface Point2 {
  x: number;
  y: number;
}

/**
 * One painted fighter, as the presenter uses it.
 *
 * Deliberately the subset of {@link import('./PaintedActor.ts').PaintedActor}
 * the playback loop needs, so a test double is ten lines.
 */
export interface ActorHandle {
  readonly position: Point3;
  setPose(name: string, opts?: { immediate?: boolean; force?: boolean }): void;
  flash(colour?: number | string, ms?: number, peak?: number): void;
  shake(amount?: number, ms?: number): void;
  lunge(distance?: number, ms?: number): Promise<void>;
  recoil(ms?: number, distance?: number): Promise<void>;
  squash(ms?: number, amount?: number): Promise<void>;
  hop(height?: number, ms?: number): Promise<void>;
  fadeTo(alpha: number, ms?: number): Promise<void>;
  setAlpha(alpha: number): void;
  dissolveTo(value: number, ms?: number, colour?: number | string): Promise<void>;
  setDissolve(value: number): void;
  moveTo(pos: Point3, ms?: number): Promise<void>;
  setFacing(dir: 1 | -1): void;
  setBrightness(mult: number): void;
  centerPoint(): Point3;
  headPoint(): Point3;
}

/**
 * Camera rigs plus the impact moves and the held moves a *moment* is built
 * from (`BattleMoments.ts`).
 *
 * `punch` bounces straight back out; `push` holds until `release`, which is
 * what a telegraph's slow zoom and an Overdrive's push-in need. `roll` is the
 * spec's "-4deg roll on every attack" (`presentation-ink-and-gold.md`).
 */
export interface CameraPort {
  moveTo(rig: CameraRigId, ms?: number): Promise<void>;
  snapTo(rig: CameraRigId): void;
  shake(amplitude?: number, ms?: number): void;
  punch(fraction?: number, ms?: number): Promise<void>;
  /** Dolly in by `fraction` of the subject distance and hold there. */
  push?(fraction?: number, ms?: number): Promise<void>;
  /** Ease a held `push` (and any roll) back to neutral. */
  release?(ms?: number): Promise<void>;
  /** Kick the horizon over by `deg` and let it fall back level. */
  roll?(deg?: number, ms?: number): Promise<void>;
  readonly rigNames: string[];
  readonly rigName: string;
}

/**
 * The full-screen chrome a *moment* puts over the field: the letterbox bars,
 * the Ink & Gold name slab (boss reveal, Overdrive) and the heartbeat vignette
 * a boss charge pulses.
 *
 * DOM-only, so it is a port like every other: the implementation lives in
 * `src/ui/common/transitions/`, and the headless presenter tests pass a fake
 * (or nothing at all — every call site treats it as optional).
 */
export interface MomentsPort {
  /** Slide the cinematic bars in or out. Resolves when they have settled. */
  letterbox(on: boolean, ms?: number): Promise<void>;
  /**
   * Show a skewed name slab and resolve once it has been dismissed.
   * `kind` picks the accent: a boss reveal, an Overdrive, a charge telegraph.
   */
  nameSlab(opts: {
    title: string;
    subtitle?: string;
    kind: 'reveal' | 'overdrive' | 'telegraph';
    holdMs?: number;
  }): Promise<void>;
  /** Start (or stop) the heartbeat vignette pulse. `bpm` sets the throb rate. */
  vignette(on: boolean, opts?: { bpm?: number; colour?: string }): void;
  /**
   * The Ink & Gold turn cut-in (`TurnCutIn.ts`): slam the portrait slab in,
   * hold `holdMs`, slide it out; resolves once it is gone. Optional and
   * additive (PR-0005); `label` is the part after `YOUR TURN · `.
   */
  turnCutIn?(opts: {
    actorId: string;
    name: string;
    game: 'ffx' | 'ffx2';
    label: string;
    side: 'left' | 'right';
    holdMs: number;
  }): Promise<void>;
  /**
   * Watch for the player's next Confirm press (Enter, Space, Z) until
   * `dispose`. Optional and additive (PR-0061): what lets a Confirm press cut
   * the battle's opening sweep short (`OpeningSkip.ts`).
   */
  confirmPress?(): { pressed: Promise<void>; dispose(): void };
  /** Tear every layer down. */
  clear(): void;
}

/** One-shot effects, keyed by `VfxKey` from the event stream. */
export interface VfxPort {
  /** Play `key` on a combatant, or `'screen'` for a full-screen effect. */
  play(key: VfxKey, at: CombatantId | 'screen'): Promise<void>;
  /** The generic impact used when an event carries no `vfxKey`. */
  impact(at: CombatantId, opts?: { element?: string; crit?: boolean }): Promise<void>;
  /** Full-screen colour wash — battle start, form change, defeat. */
  screenFlash(colour?: string, ms?: number): void;
}

/** Rising damage/heal numerals. Supplied by `ui/common`, or the DOM fallback. */
export interface DamageNumbersPort {
  show(n: {
    /** Screen position of the target, in CSS pixels. */
    x: number;
    y: number;
    kind: 'damage' | 'heal' | 'mp-damage' | 'mp-heal' | 'miss' | 'label';
    /** Absolute magnitude. Ignored for `'miss'` and `'label'`. */
    amount?: number;
    /** Printed instead of `amount` — `MISS`, `IMMUNE`, `ABSORBED`. */
    text?: string;
    crit?: boolean;
    /** Multi-hit stacking: numerals climb a rising diagonal ladder. */
    hitIndex?: number;
    hitCount?: number;
  }): void;
  clear(): void;
}

/** The battle message bar. */
export interface MessageBarPort {
  show(text: string, kind: MessageKind, ms?: number): Promise<void> | void;
  clear(): void;
}

/** The cutscene runner (`src/story/runner`), wired in when it lands. */
export interface CutsceneRunnerPort {
  /**
   * Play one script. `name` is the trigger name, for the runner's own logging;
   * `midBattle` says the battle is still on screen underneath it.
   */
  play(script: StoryScript, opts?: { midBattle?: boolean; name?: string }): Promise<void>;
  /**
   * Advance dialogue lines without waiting for input.
   *
   * A mid-battle beat normally blocks on the player pressing Confirm. Under
   * auto-battle, e2e or the critic there is nobody to press it, and the battle
   * would sit on that line forever — so the presenter switches this on
   * whenever it is driving itself.
   *
   * `instant` narrows that further to `'skip'` playback: resolve every line at
   * once and show nothing, because there is no viewer and a whole chapter has
   * to fit in an e2e budget. Auto-battle on its own still *plays* the beat —
   * showing the player nothing was the bug, not the feature.
   */
  setAutoAdvance?(on: boolean, opts?: { instant?: boolean }): void;
}

/** The subset of `AudioManager` the presenter uses. */
export interface AudioPort {
  playSfx(key: string, opts?: { volume?: number; delay?: number; pan?: number }): void;
  playMusic(key: string, opts?: { fade?: number }): Promise<void> | void;
  stopMusic(fade?: number): void;
}

/** The HUD, from `src/engine/HudPort.ts`. Re-exported for convenience. */
export type { HudPort } from './HudPort.ts';

/**
 * The field: actors, camera, VFX and the world->screen projection.
 *
 * Implemented by `PaintedStage` over Three.js; faked in unit tests.
 */
export interface BattleStage {
  readonly camera: CameraPort;
  readonly vfx: VfxPort;
  /** Live actor for a combatant, or `undefined` if it has none (hidden parts). */
  actor(id: CombatantId): ActorHandle | undefined;
  /** Which team a staged combatant fights for. Drives KO and victory poses. */
  sideOf(id: CombatantId): 'party' | 'enemy' | 'aeon' | undefined;
  /** Ids currently on the field, party/aeon first. */
  staged(): CombatantId[];
  /**
   * Screen position of a point on a combatant, in CSS pixels.
   *
   * Defaults to the head, which is what target cursors and the old numerals
   * wanted. Damage numerals ask for `'chest'` so the figure they belong to is
   * unmistakable — hung off the head they float in the air above everyone
   * (`docs/screenshots/48-overdrive.png`).
   */
  project(id: CombatantId, anchor?: 'head' | 'chest' | 'feet'): Point2 | null;
  /** Swap a combatant's painted art — `form-change`, X-2 spherechange. */
  setArt(id: CombatantId, artId: string): Promise<void>;
  /** Stage a combatant that was not on the field at battle start (a summon). */
  addCombatant(id: CombatantId, opts: { artId: string; side: 'party' | 'enemy' | 'aeon'; slot: number }): Promise<ActorHandle | undefined>;
  /** Take a combatant off the field (dismiss, eject, destroyed part). */
  removeCombatant(id: CombatantId): void;
  /**
   * Which standing slot a staged combatant occupies, if the stage tracks one.
   *
   * Optional, so a test fake need not implement it. A party Switch uses it to
   * stand the incoming member exactly where the outgoing one was, which is
   * what keeps FFX's arc its own shape across a swap.
   */
  slotOf?(id: CombatantId): number | undefined;
  /**
   * Stage a combatant that was **not** on the field at battle start and play
   * its entrance: `forms.ts#revealEnemy`'s `part-restored` for an enemy that
   * began `flags.hidden` (Anima at Macalania). The stage knows the combatant
   * from the state it was staged with, and plays the scene's arrival director
   * for it when the scene has one (`StageArrivals.ts`), else a plain fade-in.
   *
   * Optional: a stage without it keeps the old behaviour (the event fades an
   * actor that already exists, and does nothing for one that does not).
   */
  arrive?(id: CombatantId, clock: ArrivalClock): Promise<ActorHandle | undefined>;
}

/** The presenter's clock, handed to a staged arrival so it obeys speed and pause. */
export interface ArrivalClock {
  /** The presenter's own sleep: scaled by the playback speed, frozen by the pause gate. */
  sleep(ms: number): Promise<void>;
  /** True at `'skip'` speed: land the arrival's end state at once, show no animation. */
  instant: boolean;
}

/** Playback speed, driven by the skip/fast-forward controls. */
export type PlaybackSpeed = 'normal' | 'fast' | 'skip';

/** What the presenter needs from the outside world. */
export interface PresenterDeps {
  stage: BattleStage;
  hud?: import('./HudPort.ts').HudPort | null;
  damageNumbers?: DamageNumbersPort | null;
  messageBar?: MessageBarPort | null;
  cutscenes?: CutsceneRunnerPort | null;
  audio?: AudioPort | null;
  /** Letterbox / name slab / vignette. Omitted in tests and headless runs. */
  moments?: MomentsPort | null;
  /** Mid-battle scripts by `MidBattleTrigger.script`, from `ChapterScripts`. */
  midScripts?: Record<string, StoryScript>;
  /** Sleep hook. Tests pass a no-op so the loop runs instantly. */
  sleep?: (ms: number) => Promise<void>;
  /**
   * Real elapsed time, in milliseconds. Defaults to `Date.now`.
   *
   * The only reason it exists is FFX-2's **Active** ATB: the pump in
   * `BattlePresenterActive.ts` hands the engine the time that genuinely passed
   * while a command menu was open, so a test needs a fake clock to drive it
   * without real timers. `BattleScreen` passes nothing.
   */
  now?: () => number;
  /** Overall pacing multiplier applied to every wait. 1 = authored timing. */
  timeScale?: number;
}

/** One line of the presenter's own trace, for the debug API and e2e. */
export interface PlaybackTrace {
  seq: number;
  type: BattleEvent['type'];
  /** ms the presenter spent on this event. */
  ms: number;
}

/** Cue names the presenter asks the audio port for, with graceful fallbacks. */
export const SFX_FALLBACKS: Readonly<Record<string, string>> = {
  damage: 'hit-1',
  'damage-crit': 'critical',
  heal: 'cure',
  miss: 'cancel',
  attack: 'sword-slash-1',
  cast: 'magic-charge',
  ko: 'ko-fall',
  victory: 'victory-fanfare',
  charge: 'boss-roar',
  summon: 'summon',
  'form-change': 'boss-roar',
  status: 'status-applied',
  overdrive: 'overdrive-full',
  generic: 'hit-1',
} as const;

/** Elemental cue for a `damage` event, when the ability named none. */
export const ELEMENT_SFX: Readonly<Record<string, string>> = {
  fire: 'fire',
  ice: 'ice',
  lightning: 'thunder',
  water: 'water',
  holy: 'holy',
} as const;

// ------------------------------------------------------------ loop types

/** How a battle ended, from the presenter's point of view. */
export type BattleOutcome =
  | { kind: 'victory'; result: BattleResult }
  | { kind: 'defeat'; result: BattleResult }
  | { kind: 'escape'; result: BattleResult }
  /** `abort()` was called — the screen is leaving. */
  | { kind: 'aborted' };

/** What one `play()` call stopped on. */
export interface PlayResult {
  /** Set when playback halted on a `minigame-request`. */
  minigame?: { who: CombatantId; kind: MinigameKind; params: Record<string, unknown> };
  /** Set when a `victory` / `defeat` event was played. */
  ended?: 'victory' | 'defeat';
  result?: BattleResult;
  /** Events after the stop point, which the engine will re-emit. */
  dropped: number;
}

/** Picks a command for a player-controlled actor without a human. */
export type AutoStrategy = (
  actorId: CombatantId,
  commands: AvailableCommand[],
  engine: BattleEngine,
) => Command | null;
