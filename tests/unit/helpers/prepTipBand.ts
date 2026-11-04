/**
 * **A line model of the party prep CHAPTER tab's briefing column** (shared test helper; both games: the prep card is shared. Release 75 second code pass, the driver's decision 3; first written for the Fallen Maesters'
 * short tip, release 74 browser read MA-10, in `fallen-maesters-prep-tip.test.ts`, and moved here so every chapter's tip can be put through the same model: `prep-tip-band.test.ts`).
 *
 * jsdom has no layout, so how many lines of TIP the card shows is a model, and it is only as good as its two inputs:
 *
 * 1. **The band, from the stylesheets** (`src/ui/common/chapter-panel.css`, `src/ui/ffx/party-prep/chapter-panel-tab.css`; `prep-tip-band.test.ts` reads the numbers back out of the CSS, so a stylesheet change makes the
 *    model fail instead of going stale). The column is a fixed 120 grid px of the 640 x 360 stage, less 2 x 8.89 of padding, scaled by `k = min(W / 640, H / 360)`; the copy is a stack: the OBJECTIVES head, the
 *    objectives, then the TIP block, and the tip gets what the stack above it leaves. Type has a 14 px floor (`--cp-fs-floor`), so below `k = 2.74` the type is 14 screen px whatever the stage does, which is why the
 *    smaller viewports hold fewer lines. A compress block (`@media (min-width: 600px) and (max-width: 1439px), (min-width: 600px) and (max-height: 809px)`) tightens the spacing under 1440 x 810.
 * 2. **Characters a line, from the browser reads.** A greedy word wrap at a fixed width. The MA-10 read took the Maesters' 320-character tip to ten lines at 1600 x 900, which any width from 33 to 38 characters
 *    reproduces; Chapter I's 151-character tip is known to sit in the card unclipped there (Bailey's own screenshots are taken on it) and it is six lines at 33 but five from 34, so **34 is the narrowest width that
 *    agrees with both**, and it is the conservative one (more lines than 35 to 37). It is the width at 1600 x 900, where the tip type is 5.6 grid px (the 14 px floor); at another viewport it scales with the type
 *    (`34 * 5.6 / tipFont`): the column is a fixed width in grid px. The objectives wrap about 7 characters wider than the tip (a bullet and a gap against the TIP label, its gap and its padding).
 *
 * **What the model got wrong before, and the driver's figures.** The first model counted five lines and tested Chapter I against `5 + 1`, which only passed because its own reference was six lines at 33; the checker
 * (m2) then derived 6.4 lines at 1600 x 900 and 7.2 at 2000 x 1012 from the CSS, but that stack left out the OBJECTIVES head row (about 10.6 grid px, 1.3 lines of tip). With the head the room is **5.1 lines at
 * 1600 x 900, 5.8 at 2000 x 1012 and 4.2 at 1440 x 810**: the browser read says "about five" at 1600 x 900, which is this number, not 6.4. The head's line height (`HEAD_LINE_HEIGHT`, 1.25) is an assumption
 * (the face's `normal`); a taller head loses a few tenths of a line.
 *
 * Everything here is an estimate to be settled by a browser read (release 75 job TIP-1, `docs/handoff/r75-boss-art.md`), not a measurement.
 */
import type { ChapterMeta } from '../../../src/data/chapter-meta.ts';
import { prepTipFor } from '../../../src/data/chapter-prep-tips.ts';

/** Greedy word wrap at `cpl` characters a line: the number of lines `text` takes. */
export function wrapLines(text: string, cpl: number): number {
  let count = 0;
  let line = '';
  for (const word of text.split(' ')) {
    if (line === '') line = word;
    else if ((line + ' ' + word).length <= cpl) line += ' ' + word;
    else {
      count++;
      line = word;
    }
  }
  return line === '' ? count : count + 1;
}

/** The stage the party prep is authored on (`LetterboxStage.ts`). */
export const STAGE = { w: 640, h: 360 } as const;
/** The 14 CSS px type floor (`--cp-fs-floor`), in screen px. */
export const TYPE_FLOOR_PX = 14;
/** The type tokens in grid px before the floor (`--cp-fs-tip`, `--cp-fs-body`, `--cp-fs-head`). */
export const FONT = { tip: 5.11, body: 5.33, head: 4.89 } as const;
/** The band the briefing column lives in, and its padding top and bottom (`.prepchap`), in grid px. */
export const BAND = { height: 120, pad: 8.89 } as const;
/** The rule under the OBJECTIVES head (`.cpanel__head`), grid px. */
export const HEAD_BORDER = 0.89;
/** The head label's line height: `normal` for the face, an assumption (see the header). */
export const HEAD_LINE_HEIGHT = 1.25;

/** The spacing and line heights of the stack, in grid px: the roomy set, and the compress set under 1440 x 810. */
export interface Spacing {
  readonly padTop: number;
  readonly headPad: number;
  readonly objMargin: number;
  readonly objGap: number;
  readonly objLineHeight: number;
  readonly tipMargin: number;
  readonly tipPad: number;
  readonly tipLineHeight: number;
}
export const ROOMY: Spacing = { padTop: 3.56, headPad: 2.67, objMargin: 4.44, objGap: 3.11, objLineHeight: 1.35, tipMargin: 5.33, tipPad: 4, tipLineHeight: 1.45 };
export const COMPRESS: Spacing = { padTop: 0, headPad: 1.5, objMargin: 2.5, objGap: 1.5, objLineHeight: 1.3, tipMargin: 3, tipPad: 2.5, tipLineHeight: 1.32 };

/** Characters a line of the tip at the reference viewport (1600 x 900, where the tip type is 5.6 grid px): the narrowest width that agrees with both browser reads (see the header). */
export const CPL_REFERENCE = 34;
/** The tip type at the reference viewport, grid px. */
export const TIP_FONT_REFERENCE = 5.6;
/** How many characters wider an objective wraps than the tip, at the reference viewport: 8, the smallest that keeps Chapter I's 42-character first objective on one line there (the TIP label, its gap and its padding against a bullet and a gap come to about 7). */
export const OBJECTIVE_EXTRA_CHARS = 8;

export interface Band {
  readonly width: number;
  readonly height: number;
  /** The stage scale. */
  readonly k: number;
  readonly compress: boolean;
  readonly spacing: Spacing;
  /** Tip type, body type and head type in grid px, after the floor. */
  readonly tipFont: number;
  readonly bodyFont: number;
  readonly headFont: number;
  /** Characters a line of the tip, and of an objective. */
  readonly tipCpl: number;
  readonly objectiveCpl: number;
}

/** The band at a viewport of `width` x `height` CSS px. */
export function bandAt(width: number, height: number): Band {
  const k = Math.min(width / STAGE.w, height / STAGE.h);
  const floor = TYPE_FLOOR_PX / k;
  const compress = (width >= 600 && width <= 1439) || (width >= 600 && height <= 809);
  const tipFont = Math.max(FONT.tip, floor);
  const bodyFont = Math.max(FONT.body, floor);
  return {
    width,
    height,
    k,
    compress,
    spacing: compress ? COMPRESS : ROOMY,
    tipFont,
    bodyFont,
    headFont: Math.max(FONT.head, floor),
    tipCpl: Math.floor((CPL_REFERENCE * TIP_FONT_REFERENCE) / tipFont),
    objectiveCpl: Math.floor(((CPL_REFERENCE + OBJECTIVE_EXTRA_CHARS) * TIP_FONT_REFERENCE) / bodyFont),
  };
}

/** The lines the objectives take: each label wrapped at the objective width. */
export function objectiveLinesOf(band: Band, labels: readonly string[]): number[] {
  return labels.map((label) => wrapLines(label, band.objectiveCpl));
}

/** How many lines of tip the band has room for, given the objectives' labels (a fraction: a line that does not fit whole is cut mid-line). */
export function tipRoom(band: Band, objectiveLabels: readonly string[]): number {
  const s = band.spacing;
  const head = HEAD_LINE_HEIGHT * band.headFont + s.headPad + HEAD_BORDER;
  const lines = objectiveLinesOf(band, objectiveLabels).reduce((a, b) => a + b, 0);
  const objectives = s.objMargin + lines * s.objLineHeight * band.bodyFont + (objectiveLabels.length - 1) * s.objGap;
  const room = BAND.height - 2 * BAND.pad - s.padTop - head - objectives - s.tipMargin - 2 * s.tipPad;
  return room / (s.tipLineHeight * band.tipFont);
}

/** The lines `text` takes as the tip at this band. */
export function tipLines(band: Band, text: string): number {
  return wrapLines(text, band.tipCpl);
}

/** The text the desktop prep card shows for a chapter: its short form where it has one, else the whole tip. */
export const shownTip = (meta: Pick<ChapterMeta, 'id' | 'tip'>): string => prepTipFor(meta.id) ?? meta.tip;

/** One chapter at one viewport: the lines its tip takes, the room the band has, and whether it fits (whole lines only). */
export interface TipFit {
  readonly lines: number;
  readonly room: number;
  readonly fits: boolean;
}
export function tipFit(meta: Pick<ChapterMeta, 'tip' | 'objectives'>, width: number, height: number, text: string = meta.tip): TipFit {
  const band = bandAt(width, height);
  const room = tipRoom(band, meta.objectives.map((o) => o.label));
  const lines = tipLines(band, text);
  return { lines, room, fits: lines <= room };
}

/** The three viewports the release 75 job TIP-1 reads: the thinnest supported desktop, the binding case, and the wide one. */
export const TIP_VIEWPORTS: ReadonlyArray<{ readonly width: number; readonly height: number; readonly name: string }> = [
  { width: 1440, height: 810, name: '1440 x 810' },
  { width: 1600, height: 900, name: '1600 x 900' },
  { width: 2000, height: 1012, name: '2000 x 1012' },
];
