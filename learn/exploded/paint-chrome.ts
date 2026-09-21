/**
 * Everything on site C's stage that is not the picture: the leader-line
 * labels that name each sheet, the three rails for the components that were
 * never paint, and the two lines of running text the approved frames carry.
 *
 * The labels are placed the way `c2`'s own page script placed them — measure
 * where each sheet's corner really landed after the 3D transform, then step
 * the labels up (front sheets) or down (back sheets) from there, one row
 * apart, each tied to its corner by a leader and a dot. Measuring is the
 * only way: a sheet's corner position is the product of a perspective
 * projection, not something this file could work out on paper.
 *
 * A label sits beside the sheet it belongs to and nothing else (the
 * adjacency lesson from sites A and B), and everything drawn here stays
 * inside `FREE_STAGE`.
 */

import { FREE_STAGE } from '../shared/region.ts';
import { escapeHtml } from '../shared/text.ts';
import type { FramePlacement, PlaneDef } from './frame.ts';

/** One of the three components that never appear on a sheet, as a strip under the stack. */
export interface RailRow {
  readonly num: string;
  readonly layerId: string;
  readonly name: string;
  /** Short chips, each a value from the data layer or an event the engine emitted. */
  readonly chips: readonly { readonly lead: string; readonly rest: string }[];
  /** The frame's own plain-English tail: "what happened", "how it looks", "what you hear". */
  readonly plain: string;
}

/** Where the rails, caption and note sit, in stage units relative to the world origin. */
const BAND = {
  left: FREE_STAGE.x,
  width: FREE_STAGE.w,
  captionTop: 150,
  noteTop: 124,
  noteLeft: FREE_STAGE.x + FREE_STAGE.w - 392,
  noteWidth: 390,
  railsTop: 180,
} as const;

const LABEL_HEIGHT = 22;
const LABEL_STEP = 27;

/** The caption under the assembled frame: what this picture is, and where its one number came from. */
export function captionHtml(text: string, opacity: number): string {
  return `<div class="pyc-caption" style="left:${BAND.left}px;top:${BAND.captionTop}px;width:${BAND.width}px;opacity:${opacity.toFixed(2)}">${text}</div>`;
}

/** The note beside the pulled-apart stack, explaining what the depth means. */
export function noteHtml(opacity: number): string {
  return (
    `<div class="pyc-note" style="left:${BAND.noteLeft}px;top:${BAND.noteTop}px;width:${BAND.noteWidth}px;opacity:${opacity.toFixed(2)}">` +
    `<b>Nearest to you: the HUD.</b> Furthest back: the painting. Everything in between is a flat sheet, which is why this is called 2.5D.</div>`
  );
}

/** The three non-visual components, as strips beneath the stack. Each one selects its component. */
export function railsHtml(rows: readonly RailRow[], opacity: number): string {
  if (rows.length === 0) return '';
  const body = rows
    .map(
      (row) =>
        `<div class="pyc-rl" data-piece-id="layer-${row.layerId}" data-system-id="${row.layerId}" tabindex="0">` +
        `<b>${escapeHtml(row.num)}</b><span class="pyc-rl__n">${escapeHtml(row.name)}</span>` +
        row.chips
          .map((chip) => `<span class="pyc-ev"><b>${escapeHtml(chip.lead)}</b> ${escapeHtml(chip.rest)}</span>`)
          .join('<span class="pyc-ar">&#9656;</span>') +
        `<span class="pyc-rl__p">${escapeHtml(row.plain)}</span></div>`,
    )
    .join('');
  return `<div class="pyc-rails" style="left:${BAND.left}px;top:${BAND.railsTop}px;width:${BAND.width}px;opacity:${opacity.toFixed(2)}">${body}</div>`;
}

interface Anchor {
  readonly plane: PlaneDef;
  /** The sheet's marked corner, in stage units. */
  readonly x: number;
  readonly y: number;
  readonly selected: boolean;
}

/** Reads each sheet's marked corner out of the laid-out DOM and converts it to stage units. */
function anchorsOf(gf: HTMLElement, persp: HTMLElement, placement: FramePlacement, selectedLayerId: string | null, planes: readonly PlaneDef[]): Anchor[] {
  const box = persp.getBoundingClientRect();
  if (box.width <= 0) return [];
  // The perspective host's own width is known in stage units, so its measured width
  // gives the camera's total scale without this module knowing anything about the camera.
  const scale = box.width / placement.width;
  const anchors: Anchor[] = [];
  for (const plane of planes) {
    if (plane.label === undefined) continue;
    const el = gf.querySelector<HTMLElement>(`[data-plane="${plane.key}"] .pyc-mk`);
    if (el === null) continue;
    const mark = el.getBoundingClientRect();
    anchors.push({
      plane,
      x: (mark.left - box.left) / scale + placement.left,
      y: (mark.top - box.top) / scale + placement.top,
      selected: selectedLayerId === plane.layerId,
    });
  }
  return anchors;
}

function labelHtml(anchor: Anchor, top: number, leaderTop: number, leaderHeight: number): string {
  const sel = anchor.selected ? '--sel' : '';
  return (
    `<div class="pyc-lab${anchor.selected ? ' pyc-lab--sel' : ''}" style="left:${anchor.x.toFixed(1)}px;top:${top.toFixed(1)}px">` +
    `<b>${escapeHtml(anchor.plane.num ?? '')}</b>${escapeHtml(anchor.plane.label ?? '')}</div>` +
    `<div class="pyc-lead${sel === '--sel' ? ' pyc-lead--sel' : ''}" style="left:${anchor.x.toFixed(1)}px;top:${leaderTop.toFixed(1)}px;height:${Math.max(0, leaderHeight).toFixed(1)}px"></div>` +
    `<div class="pyc-dot${sel === '--sel' ? ' pyc-dot--sel' : ''}" style="left:${anchor.x.toFixed(1)}px;top:${anchor.y.toFixed(1)}px"></div>`
  );
}

/**
 * Builds the label layer once the sheets are laid out. Front sheets (`side:
 * 'R'`) climb from the highest top-left corner; back sheets (`side: 'L'`)
 * drop from the lowest bottom-left corner, rearmost lowest — the same two
 * fans the approved frame draws.
 */
export function labelsHtml(
  gf: HTMLElement,
  persp: HTMLElement,
  placement: FramePlacement,
  planes: readonly PlaneDef[],
  selectedLayerId: string | null,
  opacity: number,
): string {
  const anchors = anchorsOf(gf, persp, placement, selectedLayerId, planes);
  if (anchors.length === 0) return '';

  const up = anchors.filter((a) => a.plane.side === 'R').sort((a, b) => b.x - a.x);
  const down = anchors.filter((a) => a.plane.side === 'L').sort((a, b) => b.x - a.x);

  let html = '';
  if (up.length > 0) {
    // The fan climbs one row per sheet, and the topmost row must still clear the
    // chrome — at a small stage it would otherwise reach the specimen switcher.
    const ceiling = FREE_STAGE.y + (up.length - 1) * LABEL_STEP + LABEL_HEIGHT;
    const yTop = Math.max(Math.min(...up.map((a) => a.y)) - 12, ceiling);
    up.forEach((anchor, row) => {
      const top = yTop - row * LABEL_STEP - LABEL_HEIGHT;
      html += labelHtml(anchor, top, top + LABEL_HEIGHT, anchor.y - top - LABEL_HEIGHT);
    });
  }
  if (down.length > 0) {
    const yBot = Math.max(...down.map((a) => a.y)) + 12;
    down.forEach((anchor, row) => {
      const top = yBot + row * LABEL_STEP;
      html += labelHtml(anchor, top, anchor.y, top - anchor.y);
    });
  }
  return `<div class="pyc-labels" style="opacity:${opacity.toFixed(2)}">${html}</div>`;
}
