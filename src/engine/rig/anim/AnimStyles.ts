/**
 * The three styles of the animation prototype (`?anim=proto&style=A|B|C`; both games, presentation only; erasable TS, no `three`).
 *
 * One set of clips (`AnimLibrary.ts`), three parameter sets. Every number is OURS: none is sourced from the game. The timings start from the researcher's "starting profiles"
 * (`D:/Tools/pyrefly-scratch/2026-10-18/anim-refs/notes.md` section 6: snappy, weighty, floaty; a proposal, not a measurement). If the RE of FFX's own timing lands, style A switches to it
 * (`attack`, `cast`, `item` of style A are the rows to replace); nothing else depends on these values. Times are base milliseconds (what the presenter's `sleep` means before the pace
 * option stretches it; the animator's clock is scaled the same way).
 */
import type { EaseSpec } from './AnimEase.ts';
import type { SecondaryTune } from './AnimSecondary.ts';

export type StyleId = 'A' | 'B' | 'C' | 'P2';

export interface IdleStyle {
  /** Breaths a second. */
  breathHz: number;
  /** Scale on the authored breath and shift amplitudes. */
  amp: number;
  /** The weight shift's cycle, hertz (a slow sway of the hips from one foot to the other). */
  shiftHz: number;
  shift: number;
}

/**
 * Pass 2 (`P2`, "B's look on A's clock"): what is NOT a duration of ours. The clock is the game's own (`AnimRE.ts`: Lulu's frame counts at 30 fps; the clips are built from them in `AnimLibrary2.ts`), so
 * what is left to choose is here: how long a looping hold lasts at least (the game's own length is the spell effect's), which cast type plays, the hit-stop of a weak and of a strong blow, whether
 * the figure stays in its clip until the game's end signal (the presenter waits for it: the game locks the actor until then), and how a thrown item leaves.
 */
export interface P2Spec {
  /** Shortest stay in a cast's looping hold, ms (the game's loop is 24, 23 or 30 frames; one loop by default: the glow needs a beat to build). */
  castDwell: number;
  /** Shortest stay in an item's looping hold, ms. */
  itemDwell: number;
  /** Lulu's cast type 1, 2 or 3 (which spell uses which was not read; `?cast=2` asks). */
  castType: 1 | 2 | 3;
  /** Hit-stop of a weak and of a strong (crit, overkill, capped) blow, ms: the research notes' weak 0 to 30 and strong 50 to 80. */
  hitStopWeak: number;
  hitStopStrong: number;
  /** The orb's flight to an ally, ms, and the glow's wait on the user for an item used on the user. */
  orbFlight: number;
  selfWait: number;
  /** The presenter waits for the clip's end signal (the game's attack, cast and item clips end with one) before it lets the actor go home. */
  lockToEnd: boolean;
}

export interface AnimStyle {
  id: StyleId;
  label: string;
  blurb: string;
  /** Scale on every authored anticipation (how far the wind-up is pulled the other way). */
  anticipation: number;
  /** How far a move runs past its target before it settles back (extrapolation, a fraction of the move). */
  overshoot: number;
  /** The `s` of every settle's back curve. */
  settle: number;
  /** The curve of an anticipation, of the fast action, and of a follow-through. */
  easeAnt: EaseSpec;
  easeAct: EaseSpec;
  easeFol: EaseSpec;
  /** Smear-like stretch on the fast frames (root scale along the body), 0 off, 1 full. */
  stretch: number;
  attack: { anticipation: number; action: number; settle: number; hitStop: number; recovery: number };
  cast: { gather: number; channel: number; beat: number; release: number; settle: number; recovery: number };
  item: { reach: number; draw: number; beat: number; throw: number; flight: number; settle: number; recovery: number };
  hurt: { recoil: number; settle: number; recovery: number };
  ko: { stagger: number; buckle: number; fall: number; bounce: number; settle: number };
  victory: { dip: number; burst: number; settle: number };
  ready: { into: number };
  /** The secondary layer's say: frequency, damping and gain multipliers over each spring's own. */
  secondary: SecondaryTune;
  /** The braid's Verlet chain: stiffness a second, drag 0..1 a step, trail 0..1 of the body's forward travel it lags by. */
  braid: { stiffness: number; drag: number; trail: number; limit: number };
  idle: IdleStyle;
  /** Camera punch-in as a fraction of the subject distance at the attack's contact and the spell's release (0 = none), and its length, ms. */
  camera: { contact: number; release: number; ms: number };
  /** The figure's own glow pulse at a spell's release, 0..1 of the actor's flash peak (the spell effect itself is the game's, on the presenter's cue). */
  glow: number;
  /** Pass 2 only: the clock is the game's (`AnimRE.ts`), the clips come from `AnimLibrary2.ts`. */
  p2?: P2Spec;
}

/** A "Faithful FFX": the researcher's SNAPPY profile. Readable, hard ease-out into contact, a short hit-stop, modest overshoot. */
export const STYLE_A: AnimStyle = {
  id: 'A',
  label: 'Faithful FFX',
  blurb: 'Snappy and readable: a short wind-up, a hard ease-out into contact, a 40 ms hold, modest overshoot. Small secondary motion.',
  anticipation: 0.7,
  overshoot: 0.09,
  settle: 0.3,
  easeAnt: 'cubicInOut',
  easeAct: 'cubicOut',
  easeFol: { backOut: 0.3 },
  stretch: 0,
  attack: { anticipation: 110, action: 75, settle: 150, hitStop: 40, recovery: 190 },
  cast: { gather: 170, channel: 190, beat: 70, release: 80, settle: 150, recovery: 200 },
  item: { reach: 150, draw: 170, beat: 60, throw: 130, flight: 260, settle: 130, recovery: 190 },
  hurt: { recoil: 60, settle: 140, recovery: 180 },
  ko: { stagger: 110, buckle: 200, fall: 330, bounce: 90, settle: 160 },
  victory: { dip: 130, burst: 240, settle: 220 },
  ready: { into: 190 },
  secondary: { f: 1.1, z: 1.15, gain: 0.55 },
  braid: { stiffness: 3.2, drag: 0.1, trail: 0.5, limit: 50 },
  idle: { breathHz: 0.32, amp: 0.8, shiftHz: 0.1, shift: 0.7 },
  camera: { contact: 0, release: 0, ms: 150 },
  glow: 0.5,
};

/** B "Showpiece": the WEIGHTY profile pushed: a long wind-up, a fast arc with stretch, exaggerated overshoot, a 80 ms hold, loose secondary motion, a camera punch. */
export const STYLE_B: AnimStyle = {
  id: 'B',
  label: 'Showpiece',
  blurb: 'Persona / Clair Obscur flair: a deep wind-up, a fast stretched arc, an 80 ms hold at contact, big overshoot, loose hair, cloth and arms, a camera punch at contact and release.',
  anticipation: 1.35,
  overshoot: 0.26,
  settle: 0.75,
  easeAnt: { backIn: 0.5 },
  easeAct: 'quartOut',
  easeFol: { backOut: 0.85 },
  stretch: 1,
  attack: { anticipation: 230, action: 105, settle: 260, hitStop: 80, recovery: 310 },
  cast: { gather: 280, channel: 340, beat: 180, release: 95, settle: 260, recovery: 320 },
  item: { reach: 230, draw: 280, beat: 170, throw: 150, flight: 380, settle: 220, recovery: 300 },
  hurt: { recoil: 75, settle: 210, recovery: 300 },
  ko: { stagger: 140, buckle: 260, fall: 420, bounce: 140, settle: 260 },
  victory: { dip: 220, burst: 340, settle: 340 },
  ready: { into: 260 },
  secondary: { f: 0.8, z: 0.6, gain: 1.15 },
  braid: { stiffness: 2.0, drag: 0.04, trail: 0.95, limit: 75 },
  idle: { breathHz: 0.38, amp: 1.25, shiftHz: 0.12, shift: 1.2 },
  camera: { contact: 0.045, release: 0.035, ms: 170 },
  glow: 0.9,
};

/** C "Painterly calm": the FLOATY profile: soft in and out, long holds, a gentle sway, a strong spring follow-through, no hit-stop. Elegant, not punchy. */
export const STYLE_C: AnimStyle = {
  id: 'C',
  label: 'Painterly calm',
  blurb: 'Soft easing, long holds, a slow breath and sway: an unhurried wind-up, a flowing swing with no hit-stop, a spring follow-through. Elegant rather than punchy.',
  anticipation: 0.55,
  overshoot: 0.12,
  settle: 0.5,
  easeAnt: 'sineInOut',
  easeAct: 'cubicInOut',
  easeFol: { backOut: 0.55 },
  stretch: 0,
  attack: { anticipation: 330, action: 200, settle: 340, hitStop: 0, recovery: 420 },
  cast: { gather: 380, channel: 480, beat: 300, release: 220, settle: 380, recovery: 440 },
  item: { reach: 330, draw: 400, beat: 260, throw: 240, flight: 480, settle: 320, recovery: 430 },
  hurt: { recoil: 110, settle: 300, recovery: 400 },
  ko: { stagger: 200, buckle: 380, fall: 560, bounce: 100, settle: 360 },
  victory: { dip: 320, burst: 520, settle: 480 },
  ready: { into: 360 },
  secondary: { f: 0.62, z: 0.9, gain: 0.8 },
  braid: { stiffness: 1.6, drag: 0.07, trail: 0.7, limit: 62 },
  idle: { breathHz: 0.24, amp: 1.5, shiftHz: 0.08, shift: 1.6 },
  camera: { contact: 0, release: 0, ms: 200 },
  glow: 0.4,
};

/**
 * P2, pass 2 of the prototype (Bailey, 2026-10-18: "I'll go with all of your recommendations"; the recommendation: "B's look on A's clock"): the showpiece's shapes (deep anticipation, a stretched fast arc, big
 * overshoot, loose hair, cloth and arms, a camera punch) on the game's own clock (Lulu's frame counts, `AnimRE.ts`), a cast and an item that start, hold in a loop and release, no vial, bent knees. The numbers
 * of `attack`, `cast`, `item`, `hurt`, `ko` below only serve the code that still reads them (the item's flight, the cast release's half width): the clips take their lengths from the frame counts.
 */
export const STYLE_P2: AnimStyle = {
  ...STYLE_B,
  id: 'P2',
  label: 'Pass 2',
  blurb: "B's look on the game's own clock: Lulu's frame counts at 30 fps, a cast and an item with a looping hold and a release, an orb and no vial, bent knees, a hit-stop of 30 and 80 ms.",
  anticipation: 1.7, // a deeper coil than B's 1.35: the game's wind-up is 12 frames and the figure is already in the ready stance
  easeFol: { backOut: 0.7 },
  attack: { ...STYLE_B.attack, hitStop: 30 },
  item: { ...STYLE_B.item, flight: 420 },
  idle: { ...STYLE_B.idle, breathHz: 0.5, amp: 1.2 }, // the game's idle loop is 60 frames: 2 s, 0.5 Hz
  camera: { contact: 0.04, release: 0.035, ms: 170 },
  glow: 0.22, // the figure's own pulse at a spell's release: B's 0.9 (and 0.55) washed her to grey in the recordings
  p2: { castDwell: 800, itemDwell: 330, castType: 1, hitStopWeak: 30, hitStopStrong: 80, orbFlight: 420, selfWait: 160, lockToEnd: true },
};

export const STYLES: Readonly<Record<StyleId, AnimStyle>> = { A: STYLE_A, B: STYLE_B, C: STYLE_C, P2: STYLE_P2 };

/** `?anim=proto&style=B` from a query string (style A by default; null when the prototype is not asked for). */
export function animFromQuery(search: string): AnimStyle | null {
  try {
    const q = new URLSearchParams(search);
    if (q.get('anim') !== 'proto') return null;
    const s = (q.get('style') ?? 'A').toUpperCase();
    const st = STYLES[s as StyleId] ?? STYLE_A;
    const type = Number(q.get('cast'));
    return st.p2 && (type === 2 || type === 3) ? { ...st, p2: { ...st.p2, castType: type } } : st;
  } catch {
    return null;
  }
}
