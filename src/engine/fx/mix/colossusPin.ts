import { Vector3 } from 'three';
import { boxesOf, clearBoxes, downsOf, type Clear, type Field, type Fit, type Gate, type Limit, type PartyRule } from './clearance.ts';
import { cameraAt, coverShare, type Box, type Fig, type Mask, type Pose } from './geometry.ts';
import { restGap, SENSOR_COVER_MAX } from './plate.ts';

/**
 * The MAX mix (D-316), CHAPTER FRAMING's PINNED COLOSSUS (Seymour Natus, option N; PR-0331; FFX only). Round 19b's fail-closed gates took the
 * D-316 colossus master away from Natus because FFX's Sensor card, pinned in the lane the fiends stand in, covered 34.5 % of him. Bailey
 * took the prototype of 2026-10-03 (`opt-restage`: the card steered to an empty spot so the master can return) on 2026-10-03 (D-353: "waits until
 * it is deterministic") and 2026-10-04 (the round 21 judgment page, card F: "Natus only, built as a per-chapter table, about 270 px").
 *
 * Why a table: the prototype searched at run time (a grid of card places inside every candidate of the camera fit, about 2 s on the main thread)
 * and the camera fit it sat in decides at the edge of its limits (a member 8 % under a panel against 6 %), so the same fight came out as today's
 * rig or as BOSS SCALE 0.25, 0.45, 0.7 or 1 from one run to the next (`docs/handoff/r38-restage.md`, "Natus (Chapter X), option N"). The answer
 * does not change from run to run (the scene pins both fiends on `enemySpots` and holds the party on its slots), so it is written down here, as
 * `stageTable.ts` writes down where Chapter II's figures stand: ONE colossus master for the chapter (BOSS SCALE's step, how far it is drawn
 * toward today's rig and how far it stands back, the lens shift, the step the fiends take apart) and ONE place for the Sensor card, per window
 * shape. A window the table has not proved plays as before (today's rig, the card where the stylesheet puts it).
 *
 * The card's place is in the HUD's own coordinates (grid px of the 640x360 stage, the card's CSS `left` and `top`), so it is the same at every
 * size of one shape; `SensorPin` (`sensorPin.ts`) writes it. Presentation only (rule 1): nothing here touches the engine. Game case: FFX only
 * (rule 14: Natus is Chapter X; the Sensor card is FFX's own, FFX-2 reads an enemy on the boss strip), desktop only (the phone keeps its own fit).
 */

/** One colossus master and one place for the card. */
export interface ColossusPin {
  /** BOSS SCALE's step (`framing.ts` `FRACS`: 1 is the class target, smaller steps take a share of the growth). */
  frac: number;
  /** How far toward today's rig the master is drawn (`clearance.ts` `BLENDS`: 0 = the master as authored, 1 = today's rig). */
  blend: number;
  /** How far it stands back along its own view line (`clearance.ts` `BACKS`: 1 = as authored). */
  back: number;
  /** The static lens shift, as fractions of the canvas width and height (`clearance.ts`: at most 8 % each way). */
  lens: readonly [number, number];
  /** The step the fiends take apart from the party, world units along x; the party takes 0.3 of it the other way (`separate.ts`). */
  apart: number;
  /** The boss's own further step the same way (a fiend that stands in front of it, Mortibody, then stays off its ring); 0 for none. */
  bossApart: number;
  /** The Sensor card's CSS `left` and `top` on the HUD stage while the master stands (grid px); the stylesheet's own place is 436, 166. */
  card: readonly [number, number];
}

/** An answer and the window shapes it was proved at (width over height, inclusive). */
export interface PinClass {
  aspect: readonly [number, number];
  pin: ColossusPin;
}

/** The Sensor card's resting place on the stage (`ffx-hud.css` `.ffx-sensor`), grid px. */
export const SENSOR_HOME: readonly [number, number] = [436, 166];

/** The card's open size on the stage: its box (the house skew's overhang included) is 119 wide and 88 tall, starting 9 to the left of its CSS `left`. */
export const SENSOR_SIZE = { w: 119, h: 88, lead: 9 } as const;

/**
 * Checks only: `?natus=off` plays no pin (today's framing and the stylesheet's card place); `?natus=<frac>,<blend>,<back>,<lens x>,<lens y>,<apart>,<boss apart>,<card left>,<card top>`
 * plays that answer in Chapter X (the fight whose row pins a colossus) at any window size (a sweep).
 */
export type PinOverride = 'off' | ColossusPin | null;

export function parsePin(search: string): PinOverride {
  let v: string | null;
  try {
    v = new URLSearchParams(search).get('natus');
  } catch {
    return null;
  }
  if (v === null) return null;
  if (v === 'off') return 'off';
  const n = v.split(',').map(Number);
  if (n.length !== 9 || !n.every(Number.isFinite)) return null;
  return { frac: n[0]!, blend: n[1]!, back: n[2]!, lens: [n[3]!, n[4]!], apart: n[5]!, bossApart: n[6]!, card: [n[7]!, n[8]!] };
}

let override: PinOverride = parsePin(typeof location === 'undefined' ? '' : location.search);

export const pinOverride = (): PinOverride => override;
export const setPinOverride = (o: PinOverride): void => {
  override = o;
};

/**
 * TEXT SIZE (`text-size.css`) grows the Sensor card about its bottom-right corner and steps it up and left: the table's card place is proved at the
 * default size only, so at 115 or 130 percent there is no pin (today's framing) and a change of size re-plans (`framing.ts`). '' = the default.
 */
export function textSizeKey(): string {
  const v = typeof document === 'undefined' ? '' : (document.documentElement.dataset['textSize'] ?? '');
  return v === '100' ? '' : v;
}

/** The answer for a window of this shape, or null (today's framing). Only a fight whose row pins a colossus is asked: the override never reaches another chapter. */
export function pinFor(classes: readonly PinClass[] | undefined, aspect: number): ColossusPin | null {
  if (!classes || override === 'off' || textSizeKey() !== '') return null;
  if (override) return override;
  return classes.find((c) => aspect >= c.aspect[0] && aspect <= c.aspect[1])?.pin ?? null;
}

/** The camera pose `fitClear` would build from the master for this blend and stand-back (`clearance.ts`): the one candidate, no search. */
export function pinnedPose(master: Pose, today: Pose, pin: Pick<ColossusPin, 'blend' | 'back'>): Pose {
  const look = new Vector3().lerpVectors(master.look, today.look, pin.blend);
  const pos0 = new Vector3().lerpVectors(master.pos, today.pos, pin.blend);
  const fov = master.fov + (today.fov - master.fov) * pin.blend;
  return { pos: look.clone().add(pos0.sub(look).multiplyScalar(pin.back)), look, fov };
}

/** The lens shift in canvas px. */
export const pinnedLens = (pin: Pick<ColossusPin, 'lens'>, W: number, H: number): [number, number] => [Math.round(pin.lens[0] * W), Math.round(pin.lens[1] * H)];

/**
 * The stage's scale and where its top-left sits in the viewport (the HUD's letterbox: `LetterboxStage`, the same maths `hudPanels.ts` `sensorSlab`
 * reads): grid px to viewport px.
 */
export function stageOf(vw: number, vh: number): { s: number; ox: number; oy: number } {
  const s = Math.min(vw / 640, vh / 360);
  return { s, ox: (vw - 640 * s) / 2, oy: (vh - 360 * s) / 2 };
}

/** The open card's box in viewport px when it stands at `card` (its CSS left and top, grid px). */
export function cardBox(card: readonly [number, number], vw: number, vh: number): Box {
  const { s, ox, oy } = stageOf(vw, vh);
  const l = ox + (card[0] - SENSOR_SIZE.lead) * s;
  const t = oy + card[1] * s;
  return { l, r: l + SENSOR_SIZE.w * s, t, b: t + SENSOR_SIZE.h * s };
}

/** The score of a pinned candidate that stands: above every candidate `fitClear` ranks (a clean pass scores at most about 1e6). */
export const PINNED_SCORE = 2e6;

/**
 * What a pinned master must keep in any window the table covers, by hand, never by the search's strict limits (which decide at the edge of a
 * share under a card, and flipped the answer from run to run): every member at least 90 % in view and at most 25 % under a panel, the party no
 * more than 5 % under today's height floor, no member inside a boss (the rest gap, `plate.ts`) and none covered by a boss more than the rule
 * plus 5 %. A pin that fails any of them is not played: the plan falls back to today's rig, as before the table.
 */
export function pinSafe(clear: Clear, rule: PartyRule, gap: number): boolean {
  return clear.figs.every((r) => r.inView >= 0.9 && (r.enemy || r.underHud <= 0.25)) && clear.partyPx >= rule.floorPx * 0.95 && gap > 0 && clear.bossCover <= rule.bossCoverMax + 0.05;
}

/**
 * The one candidate the table names, as a `Fit` (`clearance.ts`): the master blended toward today's rig and stood back as the table says, the
 * lens shift as a share of the canvas, measured under the same rules as every candidate of the search. `ok` (the table's own reading of
 * the pin) gives it a score no searched candidate reaches, so the plan keeps it and stops; otherwise it ranks last.
 */
export function fitPinned(m: Pose, today: Pose, figs: readonly Fig[], f: Field, limits: readonly (Limit | null)[], rule: PartyRule, gate: Gate, pin: ColossusPin, gap: (boxes: readonly Box[]) => number): Fit {
  const pose = pinnedPose(m, today, pin);
  const lens = pinnedLens(pin, f.W, f.H);
  const cam = cameraAt(pose, f.W / f.H);
  const boxes = boxesOf(cam, figs, f);
  const clear = clearBoxes(boxes, figs, pose.pos, f, lens, limits, rule, downsOf(cam, figs, f));
  const moved = boxes.map((b) => ({ l: b.l + lens[0], r: b.r + lens[0], t: b.t + lens[1], b: b.b + lens[1] }));
  const ex = gate(pose, lens, moved);
  const ok = ex === 0 && pinSafe(clear, rule, gap(moved));
  return { pose, lens, clear, blend: pin.blend, back: pin.back, score: ok ? PINNED_SCORE : -2e7 - ex * 1e5, gate: ex };
}

/** The window's size as a plan reads it (the key `SizeWatch` compares). */
export const windowKey = (): string => (typeof window === 'undefined' ? '' : `${window.innerWidth}x${window.innerHeight}`);

/**
 * A window resized under a table row (a window's edge dragged, fullscreen left) leaves the shapes the row was proved at, and a pinned master is never re-planned by the live
 * check, so the plan is asked for again once the window has stood at a new size for 0.4 s: a drag asks once, when it stops; a window that stays the same asks for nothing.
 */
export class SizeWatch {
  private seen = '';
  private since = 0;
  private planned = '';

  /** The plan just made is for this window; '' when no table row pins a master in this fight (nothing is watched). */
  plannedFor(size: string): void {
    this.planned = size;
  }

  /** Every frame: has the window stood at a size other than the planned one for 0.4 s? */
  moved(now: number, size: string): boolean {
    if (size !== this.seen) [this.seen, this.since] = [size, now];
    return this.planned !== '' && size !== this.planned && now - this.since >= 0.4;
  }
}

/** The most of a party member's box the card may cover (a few pixels at a corner is not a card on a member). */
export const CARD_MEMBER_MAX = 0.02;

/** The share of an enemy's painted pixels (its silhouette, 10 x 14 samples over its box) that the card's box covers; with no silhouette, the share of its box. */
export function paintedCover(e: Box, mask: Mask | undefined, c: Box): number {
  if (!mask) return coverShare(e, c);
  let solid = 0;
  let under = 0;
  for (let i = 0; i < 10; i++)
    for (let j = 0; j < 14; j++) {
      const fx = (i + 0.5) / 10;
      const fy = (j + 0.5) / 14;
      if (mask.at(fx, fy) < 0.35) continue;
      solid++;
      const x = e.l + fx * (e.r - e.l);
      const y = e.t + fy * (e.b - e.t);
      if (x >= c.l && x <= c.r && y >= c.t && y <= c.b) under++;
    }
  return solid >= 6 ? under / solid : coverShare(e, c);
}

/**
 * What a pinned master may not do (0 passes), in the units `fitClear`'s gate ranks by: leave a member inside a boss at rest (PR-0310), put the card
 * over more than 5 % of a boss part's PAINTED pixels (PR-0312; the search's gate counts the part's whole box, which a colossus's wings and ring
 * fill with air) or over a member.
 */
export function pinnedExcess(boxes: readonly Box[], figs: readonly Fig[], slab: Box, W: number): number {
  const gap = restGap(boxes, figs);
  let boss = 0;
  let member = 0;
  figs.forEach((g, i) => {
    if (g.enemy) boss = Math.max(boss, paintedCover(boxes[i]!, g.mask, slab));
    else member = Math.max(member, coverShare(boxes[i]!, slab));
  });
  return (gap > 0 ? 0 : 0.01 - gap / W) + Math.max(0, boss - SENSOR_COVER_MAX) + Math.max(0, member - CARD_MEMBER_MAX);
}
