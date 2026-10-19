/**
 * The clip library of the animation prototype: every action of a figure as a short timeline over the rig's own keys (`?anim=proto`; both games, presentation only; erasable TS, no `three`).
 *
 * The SAME clips serve all three styles: a style (`AnimStyle`) supplies the durations, the curves, how deep a wind-up is pulled and how far a move runs past its target. What is authored and what is
 * procedural:
 *
 * - PROCEDURAL, from the rig's keys alone (a rig with none of the authoring below still gets all of it): the wind-up is the `ready` key EXTRAPOLATED away from `attack` (`mix` below zero), the contact is
 *   `attack` extrapolated past itself, a settle is a back curve onto the key, a recovery is a back curve onto `idle`, a hurt is `hurt` pushed past itself, a KO is the `ko` key reached through a
 *   buckle and a fall on a gravity curve, a spell's channel is `cast` pushed away from the idle. Timings and curves are the style's.
 * - AUTHORED, per subject (`Accents`: bone deltas over those poses, with a bone group for the moves that take only an arm): the crouch of a wind-up, the lean into a strike, where the arm goes to
 *   reach the pouch and to throw. A rig with no accents is the procedural set only.
 *
 * A clip's `key` is the rig key the actor reports while it plays. Marks name the moments the presenter and the props care about (`contact`, `release`, `reach`, `coiled`).
 */
import type { BoneDelta, ClipDef, PoseSpec, Segment } from './AnimClip.ts';
import type { IdleSpec } from './AnimIdle.ts';
import type { SecondarySpec } from './AnimSecondary.ts';
import type { AnimStyle } from './AnimStyles.ts';
import type { P2Poses } from './AnimLibrary2.ts';

export type Deltas = Readonly<Record<string, BoneDelta>>;

/** A subject's authored bone deltas. Every field is optional. */
export interface Accents {
  /** Bone groups for the moves that take only part of a key. */
  groups?: { armN?: readonly string[]; armF?: readonly string[] };
  windup?: Deltas;
  strike?: Deltas;
  follow?: Deltas;
  gather?: Deltas;
  channel?: Deltas;
  release?: Deltas;
  reach?: Deltas;
  draw?: Deltas;
  swing?: Deltas;
  snap?: Deltas;
  recoil?: Deltas;
  buckle?: Deltas;
  dip?: Deltas;
  burst?: Deltas;
}

/** A subject's whole animation data: the accents, the idle, the secondary motion (built from the style's numbers). */
export interface Subject {
  accents: Accents;
  idle: IdleSpec;
  secondary: (style: AnimStyle) => SecondarySpec;
  /** The prop hand: the landmark the held vial follows, and the one it is thrown from. */
  hand: string;
  /** A bone that is carried by a landmark (Lulu's moogle doll rides her fist): its offset from the landmark is each key's own and is blended with the clip, so the doll follows the hand through the move instead of flying its own straight line. */
  attach?: { bone: string; landmark: string };
  /** The parts that show a smear frame at the peak speed of a fast move (the style's stretch asks for it) and the direction of the smear, fractions of the part's image. */
  smear?: { parts: readonly string[]; dx: number; dy: number };
  /** Pass 2 (`P2`): the poses authored for this subject (cast, item, hurt, KO); any absent pose is derived from the keys. */
  p2?: P2Poses;
}

/** How long the presenter should wait after the action starts before its main beat, as a mark and an offset: `marks[mark] + offsetMs`. */
export interface Lead {
  mark: string;
  offsetMs: number;
}

export interface Library {
  style: AnimStyle;
  ready: ClipDef;
  windup: ClipDef;
  strike: ClipDef;
  follow: ClipDef;
  cast: ClipDef;
  item: ClipDef;
  hurt: ClipDef;
  ko: ClipDef;
  victory: ClipDef;
  recover: (from: string) => ClipDef;
  /** Pass 2: an item used on the user (a glow around the user, no orb) and clips the tools can name (`castType2`...). */
  itemSelf?: ClipDef;
  extra?: Readonly<Record<string, ClipDef>>;
  /** `end`: the clip's own end signal (pass 2: the presenter waits for it); `itemSelf`: the glow's landing. */
  leads: { attack: Lead; cast: Lead; item: Lead; itemSelf?: Lead; end?: Lead };
}

/** Deltas times `k`, `sx` and `sy` and `rot` and the offsets alike. */
export function scaleDeltas(d: Deltas | undefined, k: number): Deltas {
  const out: Record<string, BoneDelta> = {};
  for (const [bone, v] of Object.entries(d ?? {})) {
    out[bone] = { rot: (v.rot ?? 0) * k, dx: (v.dx ?? 0) * k, dy: (v.dy ?? 0) * k, sx: (v.sx ?? 0) * k, sy: (v.sy ?? 0) * k };
  }
  return out;
}

/** Add two sets of deltas (a bone in both sums). */
export function sumDeltas(...sets: ReadonlyArray<Deltas | undefined>): Deltas {
  const out: Record<string, BoneDelta> = {};
  for (const set of sets) {
    for (const [bone, v] of Object.entries(set ?? {})) {
      const o = out[bone] ?? {};
      out[bone] = { rot: (o.rot ?? 0) + (v.rot ?? 0), dx: (o.dx ?? 0) + (v.dx ?? 0), dy: (o.dy ?? 0) + (v.dy ?? 0), sx: (o.sx ?? 0) + (v.sx ?? 0), sy: (o.sy ?? 0) + (v.sy ?? 0) };
    }
  }
  return out;
}

export function buildLibrary(style: AnimStyle, acc: Accents = {}): Library {
  const S = style;
  const ov = S.overshoot;
  const armN = acc.groups?.armN;
  /** The smear: the whole figure leans into a fast move and stretches along it (the researcher's takeaway 2, as a root transform: no new art). */
  const smear = (a: number): BoneDelta => ({ rot: 0.05 * a * S.stretch, sx: 0.07 * a * S.stretch, sy: -0.035 * a * S.stretch });
  /** An extrapolation may add this much to a bone (more for a style that exaggerates). */
  const cap = { rot: 0.12 + ov * 0.9, px: 40 + ov * 260, scale: 0.12 };
  const sm = S.stretch > 0; // the style asks for smear frames: marks at the peak speed of the fastest moves
  const seg = (pose: PoseSpec, ms: number, ease: Segment['ease'], extra: Partial<Segment> = {}): Segment => ({ pose: { cap, ...pose }, ms, ease, ...extra });
  const at = (a: Deltas, k = 1): Deltas => scaleDeltas(a, k);

  const ready: ClipDef = {
    name: 'ready',
    key: 'ready',
    // a calm stance (the command menu is open): a soft start and a small overshoot at the end, not the front-loaded back curve of a recovery
    segments: [seg({ base: 'ready' }, S.ready.into, [0.3, 0, 0.25, 1 + ov * 0.7])],
  };

  const windup: ClipDef = {
    name: 'windup',
    key: 'ready',
    segments: [
      seg({ base: 'ready', to: 'attack', mix: -0.12 * S.anticipation, ...(acc.windup ? { add: scaleDeltas(acc.windup, S.anticipation) } : {}) }, S.attack.anticipation, S.easeAnt, { mark: 'coiled', alive: 0.6, sec: 1 }),
    ],
  };

  const contact: PoseSpec = { base: 'attack', to: 'ready', mix: -ov, ...(acc.strike ? { add: at(acc.strike) } : {}) };
  const strike: ClipDef = {
    name: 'strike',
    key: 'attack',
    segments: [
      seg({ base: 'ready', to: 'attack', mix: 0.62, root: smear(1), ...(acc.windup ? { add: scaleDeltas(acc.windup, -0.25) } : {}) }, S.attack.action * 0.55, 'quadIn', { alive: 0.3, ...(sm ? { mark: 'smear' } : {}) }),
      seg(contact, S.attack.action * 0.45, S.easeAct, { mark: 'contact', alive: 0.3 }),
      seg({ base: 'attack' }, S.attack.settle, { backOut: S.settle }, { alive: 1 }),
    ],
  };

  const follow: ClipDef = {
    name: 'follow',
    key: 'follow',
    segments: [
      seg({ base: 'follow', to: 'attack', mix: -ov * 0.8, ...(acc.follow ? { add: at(acc.follow) } : {}) }, S.attack.action * 1.6, S.easeAct, { alive: 0.5 }),
      seg({ base: 'follow' }, S.attack.settle, { backOut: S.settle }),
    ],
  };

  // authored: the cast key drawn in low (the doll offered at her chest); with no accents, the stance a third of the way to the cast
  const castGather: PoseSpec = acc.gather ? { base: 'cast', add: scaleDeltas(acc.gather, S.anticipation) } : { base: 'ready', to: 'cast', mix: 0.3 };
  const cast: ClipDef = {
    name: 'cast',
    key: 'cast',
    segments: [
      seg(castGather, S.cast.gather, S.easeAnt, { mark: 'gather', alive: 0.7 }),
      seg({ base: 'cast', to: 'idle', mix: -0.12 * (1 + S.anticipation * 0.5), ...(acc.channel ? { add: at(acc.channel) } : {}) }, S.cast.channel, 'cubicOut', { hold: S.cast.beat, mark: 'channel', alive: 0.5 }),
      seg({ base: 'cast', to: 'idle', mix: -(0.22 + ov * 2), root: smear(0.8), ...(acc.release ? { add: at(acc.release) } : {}) }, S.cast.release, S.easeAct, { mark: 'release', alive: 0.3, ...(sm ? { marks: { smear: 0.1 } } : {}) }),
      seg({ base: 'cast' }, S.cast.settle, { backOut: S.settle }, { alive: 1 }),
    ],
  };

  const itemReach: PoseSpec = { base: 'idle', to: 'item', mix: 0.3, ...(armN ? { only: armN } : {}), ...(acc.reach ? { add: at(acc.reach, S.anticipation) } : {}) };
  const swing: PoseSpec = { base: 'item', to: 'attack', mix: 0.78, ...(armN ? { only: armN } : {}), ...(acc.swing ? { add: at(acc.swing) } : {}), root: smear(0.7) };
  const item: ClipDef = {
    name: 'item',
    key: 'item',
    segments: [
      seg(itemReach, S.item.reach, S.easeAnt, { mark: 'reach', alive: 0.7 }),
      seg({ base: 'item', ...(acc.draw ? { add: at(acc.draw) } : {}) }, S.item.draw, 'cubicInOut', { hold: S.item.beat, mark: 'drawn', alive: 0.6 }),
      seg(swing, S.item.throw * 0.7, S.easeAct, { mark: 'release', alive: 0.3, ...(sm ? { marks: { smear: 0.12 } } : {}) }),
      seg({ base: 'item', to: 'attack', mix: 0.95, ...(armN ? { only: armN } : {}), ...(acc.snap ? { add: at(acc.snap) } : {}) }, S.item.throw * 0.3, 'quadOut', { alive: 0.4 }),
      seg({ base: 'item', to: 'attack', mix: 0.8, ...(armN ? { only: armN } : {}) }, S.item.settle, { backOut: S.settle }, { alive: 1 }),
    ],
  };

  const hurt: ClipDef = {
    name: 'hurt',
    key: 'hurt',
    segments: [
      seg({ base: 'hurt', to: 'idle', mix: -(0.3 + ov * 1.6), ...(acc.recoil ? { add: at(acc.recoil) } : {}) }, S.hurt.recoil, S.easeAct, { mark: 'impact', alive: 0.2 }),
      seg({ base: 'hurt' }, S.hurt.settle, { backOut: S.settle }, { alive: 0.8 }),
    ],
  };

  const ko: ClipDef = {
    name: 'ko',
    key: 'ko',
    segments: [
      seg({ base: 'hurt', to: 'idle', mix: -0.15 }, S.ko.stagger, S.easeAct, { mark: 'struck', alive: 0, sec: 1 }),
      seg({ base: 'ko', to: 'idle', mix: 0.72, ...(acc.buckle ? { add: at(acc.buckle) } : {}) }, S.ko.buckle, 'quadIn', { alive: 0, sec: 1 }),
      seg({ base: 'ko', to: 'idle', mix: -0.04 }, S.ko.fall, 'cubicIn', { mark: 'ground', alive: 0, sec: 1 }),
      seg({ base: 'ko', to: 'idle', mix: 0.07 }, S.ko.bounce, 'quadOut', { alive: 0, sec: 1 }),
      seg({ base: 'ko' }, S.ko.settle, 'quadInOut', { alive: 0, sec: 0.6 }),
    ],
  };

  const victory: ClipDef = {
    name: 'victory',
    key: 'victory',
    segments: [
      seg({ base: 'idle', to: 'victory', mix: 0.18, ...(acc.dip ? { add: scaleDeltas(acc.dip, S.anticipation) } : {}) }, S.victory.dip, S.easeAnt, { mark: 'dip', alive: 0.6 }),
      // the flourish: the doll held up in triumph (the `ready` stance with the arm high), a beat, then down into the painted victory with a settle
      seg({ base: 'ready', to: 'idle', mix: 0.12, ...(acc.burst ? { add: at(acc.burst) } : {}) }, S.victory.burst, S.easeAct, { mark: 'burst', hold: S.victory.settle * 0.5, alive: 0.5 }),
      seg({ base: 'victory' }, S.victory.settle * 1.3, { backOut: S.settle }, { alive: 1 }),
    ],
  };

  const recoverMs = (from: string): number =>
    from === 'ko' ? 640 : from === 'victory' ? S.victory.settle * 1.2 : from === 'cast' ? S.cast.recovery : from === 'item' ? S.item.recovery : from === 'hurt' ? S.hurt.recovery : from === 'ready' ? S.ready.into : S.attack.recovery;
  const recover = (from: string): ClipDef => ({
    name: `recover:${from}`,
    key: 'idle',
    segments: [seg({ base: 'idle' }, recoverMs(from), from === 'ko' ? 'sineInOut' : { backOut: S.settle }, { alive: 1 })],
  });

  return {
    style: S,
    ready,
    windup,
    strike,
    follow,
    cast,
    item,
    hurt,
    ko,
    victory,
    recover,
    leads: {
      attack: { mark: 'coiled', offsetMs: 0 },
      cast: { mark: 'release', offsetMs: -S.cast.release * 0.5 },
      item: { mark: 'release', offsetMs: S.item.flight },
    },
  };
}
