/**
 * Where a party member's hand is when an item is used (FFX only; `BattlePresenterItem.ts`, `ItemOrbStage.ts`), for a figure drawn from paintings.
 *
 * **Game case: FFX only** (`research/re-ffx-party-motion-timing.md` section 6, label [M], the Steam copy read frame by frame on 2026-10-19): an item draws no flask and no object. On an ally a green orb of light
 * rises from the user's hand, he or she tosses it overhand and sparkles fall on the target; on the user a green glow gathers around the user. FFX-2's own item gesture is not sourced yet, so FFX-2 keeps its item
 * painting (`BattleScreenGameDeps.ts` only turns this on for an FFX chapter).
 *
 * The item paintings of the party hold a glass flask in the hand (Tidus, Auron, Lulu, Kimahri, Rikku); the game draws none, so in an FFX chapter a figure drawn from paintings does not take its `item`
 * painting but a stance with no flask in it, and the orb forms at the hand where this table says it is. Yuna's item painting holds no flask (an open hand held out, the staff planted) and she keeps it;
 * every other figure stands in its `idle`. A figure drawn from a rig (`RigActor`: Lulu, Kimahri) keeps its rig's `item` key (the arm raised, no flask in any part) and the orb follows
 * the rig's own `fist` landmark instead (`ItemOrbStage.ts`).
 *
 * The anchors are READ off each painting, not computed: the painting drawn on a grid of tenths, the hand found by eye, `u` across from the painting's left edge and `t` down from its top (the coordinates
 * `PaintedActor.paintPoint` takes, through the live plane, so mirror, lunge and bob come with it). They are good to about 0.03; the orb is wider than that. Not game data.
 *
 * Pure TypeScript: no DOM, no `three`.
 */

/** A stance for an item use and where the hand is in that painting. */
export interface ItemHand {
  /** The pose a figure drawn from paintings holds while the item is used: one with no flask in it. */
  readonly pose: 'idle' | 'item';
  /** Across from the painting's left edge, 0..1. */
  readonly u: number;
  /** Down from the painting's top, 0..1. */
  readonly t: number;
}

/**
 * Every FFX party member's hand. Read off `characters/<id>/<pose>.png` of the shipped art (gridded in tenths); see the header for the method.
 * `tidus`: the gloved fist on the sword's grip at his shoulder; `auron`: the gloved hand on the katana's hilt; `yuna`: the open palm of her item painting;
 * `wakka`: the hand under the ball at his hip; `lulu`: the hand hanging at her belt; `kimahri`: the fist in front of his sash; `rikku`: the hand in the claw.
 */
export const FFX_ITEM_HANDS: Readonly<Record<string, ItemHand>> = {
  tidus: { pose: 'idle', u: 0.77, t: 0.13 },
  yuna: { pose: 'item', u: 0.87, t: 0.32 },
  auron: { pose: 'idle', u: 0.8, t: 0.13 },
  wakka: { pose: 'idle', u: 0.8, t: 0.3 },
  lulu: { pose: 'idle', u: 0.88, t: 0.47 },
  kimahri: { pose: 'idle', u: 0.46, t: 0.6 },
  rikku: { pose: 'idle', u: 0.62, t: 0.26 },
};

/** A figure that has no row (an ally of a hidden chapter): the idle, a hand at the chest on the side the figure faces. */
export const GENERIC_ITEM_HAND: ItemHand = { pose: 'idle', u: 0.72, t: 0.42 };

/** The hand of the figure drawn from `artId`'s paintings. */
export function itemHandOf(artId: string): ItemHand {
  return Object.hasOwn(FFX_ITEM_HANDS, artId) ? FFX_ITEM_HANDS[artId]! : GENERIC_ITEM_HAND;
}

/** The pose a figure drawn from a RIG takes for an item use: the rig's own `item` key (no flask in any rig part). */
export const RIG_ITEM_POSE = 'item';

/** How long the gesture's parts take, milliseconds at the presenter's normal pace (the presenter's own sleeps scale them; the stage's effect clock scales the same way). Ours, not game data. */
export const ITEM_ORB = {
  /** The orb forms over the hand. */
  formMs: 300,
  /** The overhand toss: the orb's flight to the target (pass 2 of the animation prototype played it at 420 ms, which Bailey liked). */
  flightMs: 420,
  /** On the user: the small hand glow forms this long before the glow rises around her. */
  selfFormMs: 260,
  /** On the user: the action holds this long before the heal's own effect begins (the glow keeps rising under it). */
  selfWaitMs: 520,
} as const;

/**
 * FFX-2's item gesture (FFX-2 only; the RE session's live check of the real FFX-2, label [M], recorded as driver decision 147; the report is `D:/Tools/ffx-parity/live/` session 7): the camera stays wide, the user
 * makes a short gesture toward the target; on an ally a small object is seen landing near the target (a quick short toss), on the user a quick self gesture; either way it ends in a white-blue sparkle burst on the target, and there is NO green orb.
 * So: a small white-blue spark tossed in half the orb's flight (no trail, no held glow) and a white-blue burst on the ally; on the user, only the burst. The times are ours: the whole of it is over before today's 380 ms
 * `actionStart` wait ends, so the presenter's timing is unchanged for FFX-2 (the burst plays on under the heal).
 */
export const ITEM_SPARK = {
  /** The gesture: nothing shows until the spark is let go. */
  formMs: 110,
  /** Half the orb's flight. */
  flightMs: ITEM_ORB.flightMs / 2,
  /** On the user: the burst begins after this. */
  selfFormMs: 110,
} as const;
