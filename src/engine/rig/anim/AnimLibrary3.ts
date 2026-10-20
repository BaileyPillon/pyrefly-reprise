/**
 * Pass 3's KO (`?anim=proto&style=P3`; presentation only; erasable TS, no `three`): a KO that FOLDS. Pass 2's fall was a plank: the standing figure bent a little at the knees and then the whole root rotated 71
 * degrees onto the KO key, her skirt rigid beneath her. Here the knees give first (the hips drop, the knee goes to the floor, the skirt below it lies back on the floor behind: `AnimBend.ts`), the torso folds
 * forward over them in stages (spine, chest, head, arms), and only then does the body tip onto the key; her hem stays where it is from the first blow to the floor.
 *
 * The clock is pass 2's, the game's own (`research/re-ffx-party-motion-timing.md` section 2: DEAD_00 65 frames, the floor-impact sound on frame 37, then the last pose held): struck 3 frames, the knees go 7, the
 * kneel 6, the slump 9, the tip 12 (to the floor, frame 37), a 4-frame bounce, 24 frames of settling to the 65.
 */
import type { ClipDef, PoseSpec, Segment } from './AnimClip.ts';
import { frameMs, LULU_REACT } from './AnimRE.ts';
import type { AnimStyle } from './AnimStyles.ts';

/** The authored poses of the fold, in the order they are reached. */
export interface KoPoses3 {
  struck: PoseSpec;
  knees: PoseSpec;
  kneel: PoseSpec;
  slump: PoseSpec;
  /** Half way over: the body tipping, the skirt still partly bent (keeps the lowest point near the floor between the slump and the key). */
  tipA: PoseSpec;
  /** The last pose before the floor (the KO key itself, with the knee's bend wound out). */
  tip: PoseSpec;
}

/** A subject's authored poses for pass 3. Any may be absent (the library then keeps pass 2's). */
export interface P3Poses {
  ko?: KoPoses3;
}

/** The KO clip: 65 frames, the floor on frame 37, as pass 2's, folded. */
export function koClip3(style: AnimStyle, k: KoPoses3, react: { ko: number; koFloor: number } = LULU_REACT): ClipDef {
  const f = frameMs;
  const cap = { rot: 0.12 + style.overshoot * 0.9, px: 40 + style.overshoot * 260, scale: 0.12 };
  const seg = (pose: PoseSpec, ms: number, ease: Segment['ease'], extra: Partial<Segment> = {}): Segment => ({ pose: { cap, ...pose }, ms, ease, alive: 0, sec: 1, ...extra });
  const tipF = Math.max(1, react.koFloor - 25);
  return {
    name: 'ko',
    key: 'ko',
    segments: [
      seg(k.struck, f(3), style.easeAct, { mark: 'struck' }),
      seg(k.knees, f(7), 'quadInOut', { mark: 'knees' }),
      seg(k.kneel, f(6), 'quadInOut', { mark: 'kneel' }),
      seg(k.slump, f(9), 'quadIn', { mark: 'slump' }), // the torso falls forward: it speeds up
      seg(k.tipA, f(Math.ceil(tipF / 2)), 'quadIn', { mark: 'tipping' }), // and the body goes over, in two halves so its lowest point stays near the floor
      seg(k.tip, f(Math.floor(tipF / 2)), 'quadIn', { mark: 'ground' }), // on the floor on the game's frame 37
      seg({ base: 'ko', to: 'idle', mix: 0.07 }, f(4), 'quadOut'),
      seg({ base: 'ko' }, f(react.ko - react.koFloor - 4), 'quadInOut', { mark: 'end', sec: 0.6 }),
    ],
  };
}
