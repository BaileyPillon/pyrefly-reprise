/**
 * Which painting a pause tab shows, and which side of it the chrome may stand on.
 *
 * Bailey's approved answer to README question 2 of
 * `docs/concepts/pause-until-dawn/` (21 Sep 2026, *"B, yes, yes, yes"*) is that
 * **the text block sits on whichever side of THIS painting is empty**. The
 * reference screen can pin its chrome left because its faces are always right
 * of centre; ours are not — FFX Yuna's face sits at 30% of her plate's width
 * and Paine's at 25%, so fixed left-hand chrome would be printed over both of
 * them, and no amount of zoom fixes that without cropping their heads off the
 * top of the frame.
 *
 * Each shipped plate's side is worked out by {@link deriveChromeSide} from its
 * own sidecar focal and measured head fraction — laying it out with the
 * chrome pinned left, the way the screen really renders it, and mirroring
 * when the face still lands left of centre. A plate with no row in
 * {@link PLATE_FRAMING} (a new painting nobody has measured) falls back to
 * {@link chromeSideFor}'s plainer read of the raw focal x, at
 * {@link CHROME_MIRROR_BELOW}. Nothing here reads a painting, edits one, or
 * decides anything an art agent has not already written down.
 *
 * Pure: no DOM, no fetch. The screen fetches the live sidecar through
 * `chapterPanel.pauseFocal` and hands the answer back in, and {@link FOCAL_X}
 * is the shipped copy so the first frame is laid out correctly before any
 * request has landed.
 */

import type { GameId } from '../../../battle/common/types.ts';

/** Which side of the painting the tab strip, meters, objective and prompts use. */
export type ChromeSide = 'left' | 'right';

/**
 * A plate's approved framing.
 *
 * `x` and `y` are the sidecar's focal point, copied rather than fetched
 * because the layout has to be right on the first painted frame — a sidecar
 * that lands two ticks later would make the chrome jump sides in front of the
 * player. A unit test reads every sidecar off disk and asserts this agrees.
 *
 * `head` is how much of the **source's** height the subject's head takes,
 * measured off the paintings themselves for `options.json` → `art.perPlate`.
 * It is what decides the zoom: the reference screen frames a head at about
 * three quarters of the frame, and a plate whose head is small in its master
 * needs more crop to get there.
 *
 * `side` answers Bailey's README question 2 — "does the chrome mirror for
 * this plate" — but per plate, not by hand: see {@link deriveChromeSide}.
 * `options.json` → `art.perPlate` names exactly two plates by eye *"subject
 * left of centre — needs the mirrored chrome"*; the derivation reproduces
 * both (FFX-2 Yuna's focal is further left than Tidus's and still keeps the
 * chrome on the left, because her plate's 1.9x crop has room to push her face
 * right — approved frame (c)) and additionally corrects Kimahri, whom the eye
 * read missed (round 09, PR-0079).
 */
export interface PlateFraming {
  x: number;
  y: number;
  head: number;
  side: ChromeSide;
}

/**
 * Faces left of this fraction push the chrome across, for a plate with no row
 * in {@link PLATE_FRAMING} — a new painting that no one has judged yet.
 */
export const CHROME_MIRROR_BELOW = 0.35;

/** Head fraction assumed for a plate nobody has measured. */
export const DEFAULT_HEAD = 0.62;

// ------------------------------------------------------------------ framing

/** Every `public/art/pause/*.2x.webp` is 2688x1536. */
export const PLATE_ASPECT = 2688 / 1536;
/** The master's own width, for the magnification guard below. */
const MASTER_WIDTH = 2688;
/** `build.mjs` refuses a framing that magnifies a master past this. */
const MAX_MAGNIFY = 1.25;
/** How much of the frame's height the head should take. The reference's own. */
const TARGET_HEAD = 0.78;
/**
 * Where the focal point lands across the frame: on the side the chrome is
 * not — pinned at 1600x900 (the mockup's own width) and pushed further out
 * at 1280, the narrowest desktop width this screen holds at.
 *
 * `--pu-key` and `--pu-bar` are CSS floors (`pause-screen.css`), so the two
 * columns' pixel width barely moves between 1280 and 1600 wide while the
 * window they sit in does — the same 58%/42% pan that clears them at 1600
 * lands inside them at 1280, where that near-fixed pixel width is a bigger
 * slice of a narrower frame. Verified live in Chromium at both widths across
 * all ten shipped plates (round 09 repair, PR-0079;
 * `docs/screenshots/fix10c/`): FFX-2 Yuna's focal point sat inside IN THIS
 * FIGHT at 1280 (58% of 1280 = 742px, against a measured column reaching to
 * 759px) and Rikku's sat 2px from the column edge, both at the unchanged 58%
 * pan; 68.75% clears every plate's own column reach with room at 1280
 * (`zz-testplates3` in the round's proof kit) and every 1600x900 plate keeps
 * its exact current pixel framing — `at1600` is untouched, so frames (a),
 * (b) and (c) are unaffected.
 */
function focalAtXFor(side: ChromeSide, frameW: number): number {
  const at1280 = side === 'left' ? 0.6875 : 0.3125;
  const at1600 = side === 'left' ? 0.58 : 0.42;
  if (frameW <= 1280) return at1280;
  if (frameW >= 1600) return at1600;
  const t = (frameW - 1280) / (1600 - 1280);
  return at1280 + (at1600 - at1280) * t;
}
export const FOCAL_AT_Y = 0.45;

export interface PlateBox {
  left: number;
  top: number;
  width: number;
  height: number;
  /** For the tests and the log: how much the master is scaled. */
  magnify: number;
}

/**
 * Lay one close-up into a frame — the arithmetic of
 * `docs/concepts/pause-until-dawn/build.mjs` `plate()`, which is what produced
 * the approved pictures.
 *
 * The plate covers the frame, is zoomed until the head reaches
 * {@link TARGET_HEAD} of the frame's height, and is then panned so the focal
 * point lands on the side the chrome is **not** on. The pan is clamped so no
 * edge of the frame is ever empty page, and the zoom is clamped so a master is
 * never magnified past 1.25x — the two guards `build.mjs` shouts about.
 *
 * Pure, so every plate's framing at every window size can be checked without a
 * browser.
 */
export function framePlate(f: PlateFraming, frameW: number, frameH: number): PlateBox {
  const coverW = Math.max(frameW, frameH * PLATE_ASPECT);
  const coverH = coverW / PLATE_ASPECT;
  /*
   * A portrait screen takes no extra zoom at all.
   *
   * The paintings are 1.75 landscape and a phone is 0.46 portrait, so cover
   * already throws away three quarters of the width and the head is large in
   * the frame before anything is asked of it. Zooming on top of that left one
   * eye filling the screen. Approved frame (f) was built at zoom 1.0 with the
   * focal high, and this is that: face centred, eyes forward.
   */
  const portrait = frameW < frameH;
  const wanted = (TARGET_HEAD * frameH) / (Math.max(0.05, f.head) * coverH);
  const zoom = portrait ? 1 : Math.min(Math.max(1, wanted), (MASTER_WIDTH * MAX_MAGNIFY) / coverW);
  const atX = portrait ? 0.5 : focalAtXFor(f.side, frameW);
  const atY = portrait ? 0.26 : FOCAL_AT_Y;

  const width = coverW * zoom;
  const height = width / PLATE_ASPECT;
  const left = Math.min(0, Math.max(frameW - width, frameW * atX - width * f.x));
  const top = Math.min(0, Math.max(frameH - height, frameH * atY - height * f.y));
  return { left, top, width, height, magnify: width / MASTER_WIDTH };
}

/**
 * A plate's framing before the side is worked out — the sidecar's focal and
 * the measured head fraction, nothing else.
 */
type PlateShape = Pick<PlateFraming, 'x' | 'y' | 'head'>;

/**
 * The side that keeps a plate's face off the chrome, read from the plate's
 * own framing rather than fixed by hand.
 *
 * `options.json` → `art.perPlate` names Yuna and Paine as the two plates that
 * need the mirror, judged by eye off the raw focal x. That eye missed
 * Kimahri: his head is measured at {@link PlateFraming.head} `0.75` of the
 * source, so {@link framePlate}'s zoom barely leaves the frame (it wants
 * under 1.03x), which leaves almost no room to pan his face across to the
 * reference's target 58%. Run through the same {@link framePlate} the screen
 * renders with, chrome pinned left, his face lands at 43% — inside the
 * left-hand chrome's own territory, not away from it (round 09, PR-0079).
 *
 * So the rule is geometric, not a per-plate guess: lay the plate out with the
 * chrome on the left and see where the face actually ends up. Left of centre
 * and the left chrome would sit on it, so mirror; otherwise the reference's
 * own left stands. This reproduces every side `options.json` names by hand
 * and additionally corrects Kimahri.
 */
export function deriveChromeSide(shape: PlateShape): ChromeSide {
  const box = framePlate({ ...shape, side: 'left' }, 1600, 900);
  const faceAt = (box.left + box.width * shape.x) / 1600;
  return faceAt < 0.5 ? 'right' : 'left';
}

/** Every plate that ships, with its measured framing; the side is derived. */
const PLATE_SHAPES: Readonly<Record<string, PlateShape>> = {
  auron: { x: 0.64, y: 0.43, head: 0.62 },
  kimahri: { x: 0.42, y: 0.44, head: 0.75 },
  lulu: { x: 0.6, y: 0.34, head: 0.7 },
  paine: { x: 0.25, y: 0.41, head: 0.48 },
  rikku: { x: 0.5, y: 0.48, head: 0.8 },
  'rikku-ffx2': { x: 0.53, y: 0.44, head: 0.8 },
  tidus: { x: 0.46, y: 0.39, head: 0.62 },
  wakka: { x: 0.52, y: 0.5, head: 0.75 },
  yuna: { x: 0.3, y: 0.33, head: 0.6 },
  'yuna-ffx2': { x: 0.44, y: 0.33, head: 0.35 },
};

/** Every plate that ships, with its approved framing. */
export const PLATE_FRAMING: Readonly<Record<string, PlateFraming>> = Object.fromEntries(
  Object.entries(PLATE_SHAPES).map(([id, shape]) => [id, { ...shape, side: deriveChromeSide(shape) }]),
);

/** Focal x of every plate that ships. Kept for the sidecar cross-check. */
export const FOCAL_X: Readonly<Record<string, number>> = Object.fromEntries(
  Object.entries(PLATE_FRAMING).map(([id, f]) => [id, f.x]),
);

/**
 * The FFX-2 girls share their combatant ids with their FFX selves.
 *
 * `bevelle.ts` names them `yuna`, `rikku`, `paine` exactly as `gagazet.ts`
 * does, but Yuna in a Gunner's coat and Rikku two years older are different
 * paintings. Paine has no FFX self, so her id needs no suffix.
 *
 * FFX-2 only: an FFX chapter never takes this branch, which is the absence
 * test for AGENTS.md rule 14 in this direction.
 */
const FFX2_PLATE: Readonly<Record<string, string>> = {
  yuna: 'yuna-ffx2',
  rikku: 'rikku-ffx2',
};

/** The plate id for a combatant in a given game. */
export function plateIdFor(combatantId: string, game: GameId): string {
  if (game !== 'ffx2') return combatantId;
  return FFX2_PLATE[combatantId] ?? combatantId;
}

/**
 * Which side the chrome stands on, given where the face is.
 *
 * `null` (a sidecar that never arrived) answers `'left'` — the reference's own
 * side, and the side eight of our ten plates want.
 */
export function chromeSideFor(focalX: number | null | undefined): ChromeSide {
  if (typeof focalX !== 'number' || !Number.isFinite(focalX)) return 'left';
  return focalX < CHROME_MIRROR_BELOW ? 'right' : 'left';
}

/** The approved framing for a plate, or the default for one nobody has judged. */
export function framingFor(plateId: string): PlateFraming {
  const known = PLATE_FRAMING[plateId];
  if (known) return known;
  return { x: 0.5, y: 0.35, head: DEFAULT_HEAD, side: 'left' };
}

/** The shipped focal x for a plate, or `null` when nothing is on record. */
export function plateFocalX(plateId: string): number | null {
  return PLATE_FRAMING[plateId]?.x ?? null;
}

/** Convenience: the chrome side for a combatant, from the approved table. */
export function chromeSideForCombatant(combatantId: string, game: GameId): ChromeSide {
  return PLATE_FRAMING[plateIdFor(combatantId, game)]?.side ?? 'left';
}

