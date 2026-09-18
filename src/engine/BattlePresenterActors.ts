/**
 * How a painted fighter *faces* and how it *lives*: the two rule sets
 * {@link import('./PaintedActor.ts').PaintedActor} reads every frame.
 *
 * **This module imports nothing.** No `three`, no DOM — same rule as
 * `BattlePresenterPorts.ts` — so the whole state machine runs in Node and is
 * unit-tested directly (`tests/unit/engine/actor-life.test.ts`). The actor is
 * then a thin renderer of what these functions decide.
 *
 * ## Facing
 *
 * Two different questions used to share one number, which is why an enemy's
 * painting was mirrored whether or not it needed to be:
 *
 * - **World facing** — which way along +x this fighter is turned. A property of
 *   the *side*: party and aeons face +x (toward the enemy line), enemies face
 *   -x. It drives motion — a lunge steps *toward* the other team — and never
 *   the texture.
 * - **Art facing** — which way the painting itself was painted. A property of
 *   the *PNG*, declared by the art fleet in the pose's sidecar JSON as
 *   `"facing": "right" | "left" | "front"`.
 *
 * The plane is mirrored only when those two disagree ({@link mirrorFor}). Under
 * the new art contract — party art faces right, enemy art faces left — they
 * never disagree, so nothing is mirrored and no painting is handed to the
 * player back-to-front. Older frontal art declares `"facing": "front"` and is
 * left alone, because there is no wrong way round for a figure facing camera.
 */

// ---------------------------------------------------------------------------
// Facing
// ---------------------------------------------------------------------------

/**
 * Which way a painting was painted.
 *
 * `'auto'` (the default when a sidecar says nothing) means "assume this art
 * already obeys the contract for the side it is on" — i.e. never mirror it.
 */
export type ArtFacing = 'right' | 'left' | 'front' | 'auto';

/** Which team a fighter is on, for facing purposes. */
export type ActorSide = 'party' | 'enemy' | 'aeon';

const ART_FACINGS: readonly string[] = ['right', 'left', 'front', 'auto'];

/**
 * Spellings the art pipeline writes that mean the same thing as one of ours.
 *
 * `docs/handoff/art3-contract.md` §1 uses **`none`** for art that is not turned
 * — portraits, and anything still on the v2 straight-on framing. That is our
 * `'front'`: a figure meeting the camera's eye, which has no wrong side and is
 * therefore never mirrored. Reading it as "unrecognised" would work by accident
 * (an unknown value falls back to `'auto'`, which also never mirrors), but only
 * by accident: the day someone changes what `'auto'` assumes, every frontal
 * painting in the roster would start flipping. Say it properly instead.
 */
const FACING_ALIASES: Readonly<Record<string, ArtFacing>> = {
  none: 'front',
  straight: 'front',
  'straight-on': 'front',
  center: 'front',
  centre: 'front',
  camera: 'front',
  r: 'right',
  l: 'left',
};

/** Read a sidecar's `facing` field. Anything unexpected reads as absent. */
export function parseArtFacing(value: unknown): ArtFacing | undefined {
  if (typeof value !== 'string') return undefined;
  const v = value.trim().toLowerCase();
  if (ART_FACINGS.includes(v)) return v as ArtFacing;
  return FACING_ALIASES[v];
}

/** Party and aeons face +x; enemies face -x. */
export function facingForSide(side: ActorSide | undefined): 1 | -1 {
  return side === 'enemy' ? -1 : 1;
}

/**
 * `-1` when the plane has to be mirrored for this painting to face `want`.
 *
 * Frontal art is never mirrored (a figure facing camera has no wrong side), and
 * neither is art that declares nothing — under the current contract an
 * undeclared painting is assumed to already face the right way for its side,
 * which is what stops the engine from flipping correct art.
 */
export function mirrorFor(art: ArtFacing | undefined, want: 1 | -1): 1 | -1 {
  if (art === 'right') return want === 1 ? 1 : -1;
  if (art === 'left') return want === -1 ? 1 : -1;
  return 1;
}

// ---------------------------------------------------------------------------
// Life states
// ---------------------------------------------------------------------------

/**
 * What a fighter is *doing*, as far as the body is concerned.
 *
 * Deliberately coarser than the pose list: `attack`, `cast` and `item` are all
 * one thing to the spine (`'act'`), and the presenter keeps driving poses by
 * name — {@link lifeStateForPose} is what turns those calls into life.
 */
export type LifeState = 'idle' | 'ready' | 'act' | 'guard' | 'hurt' | 'down' | 'victory';

/** Pose name -> life state. Unknown poses read as `idle`. */
export function lifeStateForPose(pose: string): LifeState {
  switch (pose) {
    case 'ready':
      return 'ready';
    case 'attack':
    case 'cast':
    case 'item':
    case 'pray':
      return 'act';
    case 'defend':
    case 'guard':
    case 'sentinel':
      return 'guard';
    case 'hurt':
      return 'hurt';
    case 'ko':
    case 'dead':
      return 'down';
    case 'victory':
      return 'victory';
    default:
      return 'idle';
  }
}

/**
 * What to show when a pose has not been painted for this subject, best first.
 *
 * `BattlePresenterArt.resolvePoseMap` already does this at the *URL* level for
 * battle figures, so in a real fight every name resolves. A scene that loaded
 * `states: ['idle']` by hand has no such map, and without this a `setPose`
 * ('victory') there would be dropped on the floor — pose *and* life state.
 */
export const POSE_FALLBACKS: Readonly<Record<string, readonly string[]>> = {
  idle: ['idle'],
  ready: ['ready', 'idle'],
  attack: ['attack', 'ready', 'idle'],
  cast: ['cast', 'attack', 'idle'],
  item: ['item', 'cast', 'idle'],
  hurt: ['hurt', 'idle'],
  ko: ['ko', 'hurt', 'idle'],
  defend: ['defend', 'guard', 'ready', 'idle'],
  guard: ['guard', 'defend', 'ready', 'idle'],
  victory: ['victory', 'idle'],
};

/** The best pose `has()` can actually draw for `name`, or null for none. */
export function resolvePoseName(name: string, has: (pose: string) => boolean): string | null {
  if (has(name)) return name;
  for (const alt of POSE_FALLBACKS[name] ?? []) {
    if (has(alt)) return alt;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Posture
// ---------------------------------------------------------------------------

/**
 * The body's resting shape in one life state.
 *
 * Distances are fractions of the figure's world height, so the same numbers
 * read the same on a 1.8-unit summoner and a 4.1-unit boss.
 */
export interface Posture {
  /** Shift along the fighter's own facing. Positive = toward the enemy. */
  lean: number;
  /** Settle toward the ground. Positive = lower. */
  crouch: number;
  /** Body tilt, radians. Positive = tipping forward. */
  tilt: number;
  /** Breathing amplitude multiplier. 0 = holding still. */
  breathe: number;
  /** Breathing speed multiplier. */
  tempo: number;
  /** Turn ring, 0..1. `null` leaves whatever the ring is doing alone. */
  ring: number | null;
  /** Seconds to settle into this posture (exponential approach). */
  tau: number;
}

/**
 * Every posture, keyed by life state.
 *
 * The numbers are small on purpose. This layer is *life*, not animation: it has
 * to read at a glance on a figure that is otherwise a still painting, and it
 * has to survive being stacked with a lunge, a recoil, a hop and a shake
 * without any of them fighting.
 */
export const POSTURES: Readonly<Record<LifeState, Posture>> = {
  idle: { lean: 0, crouch: 0, tilt: 0, breathe: 1, tempo: 1, ring: 0, tau: 0.5 },
  // Their turn: a half-step forward, weight up, breathing quicker.
  ready: { lean: 0.085, crouch: 0.012, tilt: -0.02, breathe: 1.3, tempo: 1.25, ring: 1, tau: 0.16 },
  act: { lean: 0.03, crouch: 0, tilt: 0, breathe: 0.65, tempo: 1.5, ring: 1, tau: 0.12 },
  // Guarding is the opposite shape: braced, low, and very still.
  guard: { lean: -0.045, crouch: 0.045, tilt: 0.015, breathe: 0.5, tempo: 0.75, ring: null, tau: 0.2 },
  hurt: { lean: -0.03, crouch: 0.02, tilt: 0.03, breathe: 1.15, tempo: 1.4, ring: null, tau: 0.09 },
  down: { lean: 0, crouch: 0.05, tilt: 0.18, breathe: 0.12, tempo: 0.45, ring: 0, tau: 0.35 },
  victory: { lean: 0.02, crouch: -0.01, tilt: -0.015, breathe: 1.25, tempo: 1.15, ring: 0, tau: 0.3 },
};

/** The live, smoothed posture. `ring` is always a number here. */
export interface LivePosture {
  lean: number;
  crouch: number;
  tilt: number;
  breathe: number;
  tempo: number;
  ring: number;
}

/**
 * The state a fighter actually enters when something asks for `wanted`.
 *
 * One rule, and it only ever fires on a body that is already on the ground: a
 * downed fighter does **not** flinch. Damage still lands on a KO'd party member
 * (a stray area attack, a counter) and the presenter still names the `hurt`
 * pose for it; without this the body would sit up to wince — `cuesFor` would
 * read the change as leaving `down` and play the *revive* rise, glow and all,
 * for a character who is still dead.
 *
 * Everything else passes through. Getting up is a real transition (`revive`
 * names `idle`), and that is exactly the case this must not block.
 */
export function nextLifeState(current: LifeState, wanted: LifeState): LifeState {
  if (current === 'down' && wanted === 'hurt') return 'down';
  return wanted;
}

/** One-shot motions a transition asks the actor to play. */
export type LifeCue = 'step' | 'flinch' | 'fall' | 'rise' | 'hop';

/** What {@link ActorLife.set} reports back when the state actually changed. */
export interface LifeChange {
  from: LifeState;
  to: LifeState;
  cues: LifeCue[];
}

/**
 * The one-shots a transition fires.
 *
 * Everything else about a state is posture, which is continuous; these are the
 * moments — the step in, the flinch, the fall, the rise, the victory hop.
 */
export function cuesFor(from: LifeState, to: LifeState): LifeCue[] {
  if (from === to) return [];
  const cues: LifeCue[] = [];
  if (to === 'down') cues.push('fall');
  else if (from === 'down') cues.push('rise');
  if (to === 'victory') cues.push('hop');
  if (to === 'ready') cues.push('step');
  if (to === 'hurt' && from !== 'down') cues.push('flinch');
  return cues;
}

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

/**
 * Exponential approach, framerate-independent.
 *
 * `tau` is the time constant in seconds: after `tau` the gap has closed by
 * ~63%. Mirrors `Tween.damp`, duplicated here so this module stays import-free.
 */
export function approach(current: number, target: number, tau: number, dt: number): number {
  if (tau <= 0) return target;
  return lerp(current, target, 1 - Math.exp(-dt / tau));
}

/**
 * The life-state machine for one fighter.
 *
 * Holds the current state, the posture being eased toward it, and nothing else
 * — no textures, no meshes, no timers. {@link set} returns the cues to play;
 * {@link update} advances the posture.
 */
export class ActorLife {
  private _state: LifeState = 'idle';
  private target: Posture = POSTURES.idle;
  private readonly live: LivePosture = {
    lean: 0,
    crouch: 0,
    tilt: 0,
    breathe: 1,
    tempo: 1,
    ring: 0,
  };

  get state(): LifeState {
    return this._state;
  }

  /** The smoothed posture. Mutated in place every frame — do not keep it. */
  get posture(): Readonly<LivePosture> {
    return this.live;
  }

  /**
   * Enter a state. Returns the transition (with its cues) or `null` when the
   * fighter was already in it.
   *
   * `immediate` snaps the posture rather than easing into it — what staging a
   * party member who is *already* KO'd wants, so nobody watches a corpse fall
   * over the moment the battle opens.
   */
  set(wanted: LifeState, opts?: { immediate?: boolean }): LifeChange | null {
    const from = this._state;
    const state = nextLifeState(from, wanted);
    if (state === from) return null;
    this._state = state;
    this.target = POSTURES[state];
    if (opts?.immediate) this.snap();
    return { from, to: state, cues: cuesFor(from, state) };
  }

  /** Jump the posture to the current state's target. */
  snap(): void {
    const t = this.target;
    this.live.lean = t.lean;
    this.live.crouch = t.crouch;
    this.live.tilt = t.tilt;
    this.live.breathe = t.breathe;
    this.live.tempo = t.tempo;
    if (t.ring !== null) this.live.ring = t.ring;
  }

  /** @param dt seconds. */
  update(dt: number): void {
    const t = this.target;
    const tau = t.tau;
    const p = this.live;
    p.lean = approach(p.lean, t.lean, tau, dt);
    p.crouch = approach(p.crouch, t.crouch, tau, dt);
    p.tilt = approach(p.tilt, t.tilt, tau, dt);
    p.breathe = approach(p.breathe, t.breathe, Math.max(tau, 0.25), dt);
    p.tempo = approach(p.tempo, t.tempo, Math.max(tau, 0.25), dt);
    // The ring fades on its own clock: quick to appear, slower to leave, so a
    // turn highlight never flickers between two events of the same turn.
    if (t.ring !== null) p.ring = approach(p.ring, t.ring, t.ring > p.ring ? 0.09 : 0.2, dt);
  }
}

// ---------------------------------------------------------------------------
// The attack step
// ---------------------------------------------------------------------------

const cubicOut = (t: number): number => 1 - (1 - t) ** 3;
const quadOut = (t: number): number => 1 - (1 - t) * (1 - t);
const smooth = (t: number): number => t * t * (3 - 2 * t);

/**
 * The four beats of a step-in attack, as fractions of its total duration.
 *
 * A single ease out and back is a *drift*; it reads as the figure sliding into
 * the enemy and sliding home. What reads as an attack is punctuation: a quick
 * step, a beat of stillness at the top (this is where the wind-up lives, and
 * where the eye catches up), the strike itself, then the walk back.
 */
export const ATTACK_BEATS = { step: 0.26, hold: 0.2, strike: 0.12, settle: 0.42 } as const;

/** Where the step tops out before the strike pushes through it. */
const STEP_REACH = 0.86;
/** The tiny drift during the hold — stillness, not a freeze. */
const HOLD_REACH = 0.9;

/**
 * Distance travelled at `t` (0..1 of the move), as a fraction of the full
 * lunge distance. Peaks at 1 on the strike and returns to 0.
 *
 * @see ATTACK_BEATS
 */
export function attackOffset(t: number): number {
  if (!(t > 0)) return 0;
  if (t >= 1) return 0;
  const { step, hold, strike } = ATTACK_BEATS;
  if (t < step) return STEP_REACH * cubicOut(t / step);
  if (t < step + hold) return lerp(STEP_REACH, HOLD_REACH, (t - step) / hold);
  if (t < step + hold + strike) {
    return lerp(HOLD_REACH, 1, quadOut((t - step - hold) / strike));
  }
  const u = (t - step - hold - strike) / ATTACK_BEATS.settle;
  return 1 - smooth(Math.min(1, u));
}

/** The moment of impact, as a fraction of the move — where the strike lands. */
export const ATTACK_IMPACT = ATTACK_BEATS.step + ATTACK_BEATS.hold + ATTACK_BEATS.strike;
