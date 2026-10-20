/**
 * The clip library of pass 2 of the animation prototype (`?anim=proto&style=P2`; presentation only; erasable TS, no `three`): "B's look on A's clock" (`AnimStyles.ts#STYLE_P2`).
 *
 * The CLOCK is the game's: Lulu's frame counts at 30 fps from the motion data (`AnimRE.ts`, `research/re-ffx-party-motion-timing.md`). The LOOK is the showpiece's: a deep anticipation, a stretched fast arc, a big
 * overshoot, cloth and arms that follow through. Three things differ from pass 1 (`AnimLibrary.ts`, kept as it was for A, B and C):
 *
 *  - a cast and an item are START -> looping HOLD -> RELEASE, the game's `_00` / `_01` / `_02` (`AnimClip.ts#Sustain`, `AnimHold.ts`): the hold's shortest stay is the style's, the clip may be kept in it
 *    until the engine's effect is ready, the release leaves on the game's hit frame and the follow-through runs to the game's end frame;
 *  - an item has NO prop: the hand that lifts an orb of light (`AnimFx.ts` draws it; the clip only carries the glow level, `Segment.charge`) tosses it overhand to an ally, or sweeps it over the user;
 *  - a hurt and a KO bend the knees (the pelvis sinks, the skirt bunches, the spine folds) and the KO folds down into the KO key with its lowest point on the floor (`LuluAnim2.ts` bakes the ground).
 *
 * Authored (Lulu only, `LuluAnim2.ts`) versus procedural: a subject with no authored `P2Poses` gets every pose derived from its keys, as pass 1 did.
 */
import type { ClipDef, PoseSpec, Segment } from './AnimClip.ts';
import { scaleDeltas, type Accents, type Library } from './AnimLibrary.ts';
import { buildLibrary } from './AnimLibrary.ts';
import { frameMs, LULU_ATTACK, LULU_CAST, LULU_ITEM, LULU_REACT, type CastRE } from './AnimRE.ts';
import type { AnimStyle } from './AnimStyles.ts';
import { koClip3, type P3Poses } from './AnimLibrary3.ts';

/** The run-up of the strike to its contact, ms: the lunge's apex (`LUNGE_MS` 440 x `ATTACK_IMPACT` 0.58 = 255 ms; a test pins it to the presenter's). The wind-up is the rest of the game's 20 frames. */
export const STRIKE_RUN_MS = 255;

/** The five poses of a KO before the KO key: struck, the knees go, kneeling, then two stages of the fall into the key. */
export interface KoPoses {
  struck: PoseSpec;
  knees: PoseSpec;
  kneel: PoseSpec;
  tipA: PoseSpec;
  tipB: PoseSpec;
}

/** A subject's authored poses for pass 2. Any may be absent. */
export interface P2Poses {
  castGather?: PoseSpec;
  castHold?: PoseSpec;
  castHoldB?: PoseSpec;
  castPull?: PoseSpec;
  castThrust?: PoseSpec;
  itemReach?: PoseSpec;
  itemRaise?: PoseSpec;
  itemHoldB?: PoseSpec;
  itemCock?: PoseSpec;
  itemToss?: PoseSpec;
  itemTossFollow?: PoseSpec;
  selfIn?: PoseSpec;
  selfDown?: PoseSpec;
  hurtStruck?: PoseSpec;
  hurtBent?: PoseSpec;
  ko?: KoPoses;
  victoryB?: PoseSpec;
}

/** The game's timing table for a subject (Lulu's by default). */
export interface RETable {
  attack: { hit: number; end: number; total: number };
  cast: readonly [CastRE, CastRE, CastRE];
  item: { start: number; loop: number; ally: { hit: number; end: number }; self: { hit: number; end: number } };
  react: { hurt: number; ko: number; koFloor: number; victory: number; victoryLoop: number };
}

export const LULU_RE: RETable = { attack: LULU_ATTACK, cast: LULU_CAST, item: LULU_ITEM, react: LULU_REACT };

/** The library of a style for a subject: pass 2's for a style that carries `p2`, pass 1's otherwise; pass 3's (`p3`) keeps all of pass 2's and replaces its KO with the one that folds. */
export function libraryFor(style: AnimStyle, acc: Accents, poses?: P2Poses, re: RETable = LULU_RE, p3?: P3Poses): Library {
  if (!style.p2) return buildLibrary(style, acc);
  const lib = buildLibrary2(style, acc, poses ?? {}, re);
  return style.p3 && p3?.ko ? { ...lib, ko: koClip3(style, p3.ko, re.react) } : lib;
}

export function buildLibrary2(style: AnimStyle, acc: Accents = {}, poses: P2Poses = {}, re: RETable = LULU_RE): Library {
  const S = style;
  const P = S.p2;
  if (!P) throw new Error('anim: buildLibrary2 needs a style with p2');
  const ov = S.overshoot;
  const base = buildLibrary(S, acc); // ready, windup... of pass 1: the pieces pass 2 keeps (the victory's and the ready stance's shapes)
  const smear = (a: number): { rot: number; sx: number; sy: number } => ({ rot: 0.05 * a * S.stretch, sx: 0.07 * a * S.stretch, sy: -0.035 * a * S.stretch });
  const cap = { rot: 0.12 + ov * 0.9, px: 40 + ov * 260, scale: 0.12 };
  const sm = S.stretch > 0;
  const seg = (pose: PoseSpec, ms: number, ease: Segment['ease'], extra: Partial<Segment> = {}): Segment => ({ pose: { cap, ...pose }, ms, ease, ...extra });
  const f = frameMs;

  // ------------------------------------------------------------------------------------------------ attack (ATTACK2: hit signal 20, end signal 54, clip 60 frames)
  const hitMs = f(re.attack.hit);
  const endMs = f(re.attack.end);
  const coil: PoseSpec = { base: 'ready', to: 'attack', mix: -0.12 * S.anticipation, ...(acc.windup ? { add: scaleDeltas(acc.windup, S.anticipation) } : {}) };
  const swing: PoseSpec = { base: 'ready', to: 'attack', mix: 0.62, root: smear(1), ...(acc.windup ? { add: scaleDeltas(acc.windup, -0.25) } : {}) };
  const contact: PoseSpec = { base: 'attack', to: 'ready', mix: -ov, ...(acc.strike ? { add: scaleDeltas(acc.strike, 1.5) } : {}) }; // the lean into the blow, a half more than pass 1's
  const followA: PoseSpec = { base: 'follow', to: 'attack', mix: -ov * 0.35, ...(acc.follow ? { add: scaleDeltas(acc.follow, 1) } : {}) }; // the arm swings through, a little less wildly than pass 1's B
  const relax: PoseSpec = { base: 'follow', to: 'idle', mix: 0.55 };
  const settleMs = f(7);
  const followMs = f(10);
  const windup: ClipDef = { name: 'windup', key: 'ready', segments: [seg(coil, Math.max(60, hitMs - STRIKE_RUN_MS), S.easeAnt, { mark: 'coiled', alive: 0.6 })] };
  const strike: ClipDef = {
    name: 'strike',
    key: 'attack',
    segments: [
      seg(swing, STRIKE_RUN_MS * 0.55, 'quadIn', { alive: 0.3, ...(sm ? { mark: 'smear' } : {}) }),
      seg(contact, STRIKE_RUN_MS * 0.45, S.easeAct, { mark: 'contact', alive: 0.3 }),
      seg({ base: 'attack' }, settleMs, { backOut: S.settle }, { alive: 0.5 }),
      seg(followA, followMs, S.easeFol, { alive: 0.5 }),
      seg(relax, Math.max(60, endMs - hitMs - settleMs - followMs), 'sineInOut', { mark: 'end', alive: 1 }),
    ],
  };

  // ------------------------------------------------------------------------------------------------ cast (MAGIC1/2/3: start, hold loop, release; the spell leaves on the release clip's hit frame)
  const castClip = (c: CastRE, name: string): ClipDef => {
    const startMs = f(c.start);
    const gatherMs = startMs * 0.4;
    const thrustF = Math.min(8, Math.max(3, Math.round(c.hit * 0.3)));
    const gather: PoseSpec = poses.castGather ?? { base: 'ready', to: 'cast', mix: 0.3 };
    const hold: PoseSpec = poses.castHold ?? { base: 'cast' };
    const holdB: PoseSpec = poses.castHoldB ?? { base: 'cast', to: 'idle', mix: -0.1 };
    const pull: PoseSpec = poses.castPull ?? { base: 'cast', to: 'idle', mix: -0.14 };
    const thrust: PoseSpec = poses.castThrust ?? { base: 'cast', to: 'idle', mix: -(0.22 + ov * 2), root: smear(0.8) };
    return {
      name,
      key: 'cast',
      segments: [
        seg(gather, gatherMs, S.easeAnt, { mark: 'gather', alive: 0.7, charge: 0.25 }),
        seg(hold, startMs - gatherMs, 'cubicInOut', { mark: 'rise', alive: 0.5, charge: 0.5 }),
        seg(hold, 0, 'linear', { hold: P.castDwell, mark: 'hold', alive: 0.4, charge: 0.5, sustain: { pose: holdB, period: f(c.loop), grow: 0.65, growMs: 700 } }),
        seg(pull, f(c.hit) - f(thrustF), { backIn: 0.5 }, { mark: 'pulled', alive: 0.3, charge: 1.3 }),
        seg(thrust, f(thrustF), S.easeAct, { mark: 'release', alive: 0.3, charge: 1.3, ...(sm ? { marks: { smear: 0.1 } } : {}) }), // the glow stays to the release frame (the thrust's last) and goes out with it
        seg({ base: 'cast' }, f(c.end - c.hit), { backOut: S.settle }, { mark: 'end', alive: 1, charge: 0 }),
      ],
    };
  };
  const castType = (P.castType - 1) as 0 | 1 | 2;
  const cast = castClip(re.cast[castType], 'cast');

  // ------------------------------------------------------------------------------------------------ item (ITEM_00 start, ITEM_01 hold loop, ITEM_02_1 for an ally / ITEM_02_2 for the user)
  const it = re.item;
  const raise: PoseSpec = poses.itemRaise ?? { base: 'item' };
  const itemStart = (): Segment[] => [
    seg(poses.itemReach ?? { base: 'idle', to: 'item', mix: 0.3 }, f(it.start) * 0.55, S.easeAnt, { mark: 'reach', alive: 0.7, charge: 0.1 }),
    seg(raise, f(it.start) * 0.45, 'cubicInOut', { mark: 'raised', alive: 0.6, charge: 0.4 }),
    seg(raise, 0, 'linear', { hold: P.itemDwell, mark: 'hold', alive: 0.5, charge: 0.5, sustain: { pose: poses.itemHoldB ?? { base: 'item', to: 'idle', mix: -0.06 }, period: f(it.loop), grow: 0.45, growMs: 600 } }),
  ];
  const tossF = 7;
  const itemAlly: ClipDef = {
    name: 'item',
    key: 'item',
    segments: [
      ...itemStart(),
      seg(poses.itemCock ?? { base: 'item', to: 'attack', mix: -0.25 }, f(it.ally.hit) - f(tossF), { backIn: 0.5 }, { mark: 'cocked', alive: 0.3, charge: 1 }),
      seg(poses.itemToss ?? { base: 'item', to: 'attack', mix: 0.78, root: smear(0.7) }, f(tossF), S.easeAct, { mark: 'release', alive: 0.3, charge: 1, ...(sm ? { marks: { smear: 0.12 } } : {}) }), // the orb is in the hand to the release frame
      seg(poses.itemTossFollow ?? { base: 'item', to: 'attack', mix: 0.95 }, f(it.ally.end - it.ally.hit) * 0.3, 'quadOut', { alive: 0.4, charge: 0 }),
      seg({ base: 'item', to: 'attack', mix: 0.8 }, f(it.ally.end - it.ally.hit) * 0.7, { backOut: S.settle }, { mark: 'end', alive: 1 }),
    ],
  };
  const itemSelf: ClipDef = {
    name: 'itemSelf',
    key: 'item',
    segments: [
      ...itemStart(),
      seg(poses.selfIn ?? { base: 'item', to: 'idle', mix: 0.1 }, f(it.self.hit) - f(10), { backIn: 0.4 }, { mark: 'cocked', alive: 0.4, charge: 1 }),
      seg(poses.selfDown ?? { base: 'idle', to: 'item', mix: 0.22 }, f(10), S.easeAct, { mark: 'release', alive: 0.4, charge: 1 }),
      seg({ base: 'idle', to: 'item', mix: 0.12 }, f(it.self.end - it.self.hit), { backOut: S.settle }, { mark: 'end', alive: 1, charge: 0 }),
    ],
  };

  // ------------------------------------------------------------------------------------------------ hurt (DMG1: 50 frames) and KO (DEAD_00: 65 frames, the floor at frame 37)
  const hurt: ClipDef = {
    name: 'hurt',
    key: 'hurt',
    segments: [
      seg(poses.hurtStruck ?? { base: 'hurt', to: 'idle', mix: -(0.3 + ov * 1.6) }, f(3), S.easeAct, { mark: 'impact', alive: 0.2 }),
      seg(poses.hurtBent ?? { base: 'hurt' }, f(6), 'sineInOut', { alive: 0.4 }),
    ],
  };
  const k = poses.ko;
  const koSegs: Segment[] = k
    ? [
        seg(k.struck, f(3), S.easeAct, { mark: 'struck', alive: 0, sec: 1 }),
        seg(k.knees, f(7), 'quadInOut', { alive: 0, sec: 1 }),
        seg(k.kneel, f(7), 'quadInOut', { alive: 0, sec: 1 }),
        // the fall is ONE gravity curve in three pieces (a position that grows as t squared: each piece leaves at the speed the one before arrived at, so the body never stops half way down): frames 3 + 7 + 7, then 10 + 5 + 15-to-the-floor (the game's 37)
        seg(k.tipA, f(10), 'quadIn', { alive: 0, sec: 1 }),
        seg(k.tipB, f(5), 'linear', { alive: 0, sec: 1 }),
        seg({ base: 'ko' }, f(Math.max(1, re.react.koFloor - 32)), 'linear', { mark: 'ground', alive: 0, sec: 1 }),
        seg({ base: 'ko', to: 'idle', mix: 0.07 }, f(4), 'quadOut', { alive: 0, sec: 1 }),
        seg({ base: 'ko' }, f(re.react.ko - re.react.koFloor - 4), 'quadInOut', { mark: 'end', alive: 0, sec: 0.6 }),
      ]
    : [
        seg({ base: 'hurt', to: 'idle', mix: -0.15 }, f(3), S.easeAct, { mark: 'struck', alive: 0, sec: 1 }),
        seg({ base: 'ko', to: 'idle', mix: 0.72 }, f(14), 'quadIn', { alive: 0, sec: 1 }),
        seg({ base: 'ko', to: 'idle', mix: -0.04 }, f(re.react.koFloor - 17), 'cubicIn', { mark: 'ground', alive: 0, sec: 1 }),
        seg({ base: 'ko', to: 'idle', mix: 0.07 }, f(4), 'quadOut', { alive: 0, sec: 1 }),
        seg({ base: 'ko' }, f(re.react.ko - re.react.koFloor - 4), 'quadInOut', { mark: 'end', alive: 0, sec: 0.6 }),
      ];
  const ko: ClipDef = { name: 'ko', key: 'ko', segments: koSegs };

  // ------------------------------------------------------------------------------------------------ victory (WIN_00 118 frames, then WIN_01 loops 30 frames) and the recoveries
  const victory: ClipDef = {
    ...base.victory,
    open: true,
    segments: [
      ...base.victory.segments.slice(0, 2),
      { ...base.victory.segments[2]!, sustain: { pose: poses.victoryB ?? { base: 'victory', to: 'idle', mix: -0.06 }, period: f(re.react.victoryLoop) }, hold: Math.max(0, f(re.react.victory) - (base.victory.segments[0]!.ms + base.victory.segments[1]!.ms + (base.victory.segments[1]!.hold ?? 0) + (base.victory.segments[2]!.ms))) },
    ],
  };
  const recoverMs = (from: string): number =>
    from === 'ko' ? 900 : from === 'victory' ? 400 : from === 'hurt' ? Math.max(400, f(re.react.hurt) - 360) : from === 'ready' ? S.ready.into : f(re.attack.total - re.attack.end);
  const recover = (from: string): ClipDef => ({
    name: `recover:${from}`,
    key: 'idle',
    segments: [seg({ base: 'idle' }, recoverMs(from), from === 'ko' ? 'sineInOut' : { backOut: S.settle * (from === 'hurt' ? 0.5 : 1) }, { alive: 1 })],
  });

  const extra: Record<string, ClipDef> = {};
  re.cast.forEach((c, i) => (extra[`castType${i + 1}`] = castClip(c, `castType${i + 1}`)));

  return {
    style: S,
    ready: base.ready,
    windup,
    strike,
    follow: base.follow,
    cast,
    item: itemAlly,
    itemSelf,
    hurt,
    ko,
    victory,
    recover,
    extra,
    leads: {
      attack: { mark: 'coiled', offsetMs: 0 },
      cast: { mark: 'release', offsetMs: 0 },
      item: { mark: 'release', offsetMs: P.orbFlight },
      itemSelf: { mark: 'release', offsetMs: P.selfWait },
      end: { mark: 'end', offsetMs: 0 },
    },
  };
}
