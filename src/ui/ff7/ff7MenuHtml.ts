/**
 * The FF7 command window and its lists as HTML, from the menu state (FF7 only).
 *
 * - **Command window** [spec §3.2, §5.8]: one column, four fixed slots at 12 u,
 *   the finger cursor; it overlaps the names window and pokes 4 u below the
 *   band. "Limit" cycles its letter colours [spec §3.5].
 * - **Magic** [spec §5.8, layout our estimate]: three columns over the command
 *   window; a spell you cannot cast is grey; the MP window beside the list
 *   reads "MP  cost/ current" (our estimate).
 * - **Item** [our estimate]: one column, the count right-aligned.
 * - **Limit** [spec §3.1, §5.8]: the magenta-to-red window over the command
 *   window, headed "LIMIT LEVEL n".
 *
 * - **Change / Defend** [spec §3.5, S1: off the window's left and right edges]:
 *   a small window beside the edge with the finger on the word, only while the
 *   finger is there (its look is our estimate; FF7 draws no label until then).
 *
 * Every row carries a transparent hit box (`data-slot` / `data-row`) so a tap
 * chooses it (spec §6: "Tapping a command row chooses it"); an unmarked strip
 * beside each edge (`data-edge`) is the touch way to Change and Defend.
 */

import type { AvailableCommand, ItemId } from '../../battle/common/types.ts';
import { box, text, windowHtml, type Origin } from './ff7Draw.ts';
import { gloveSvg } from './ff7Art.ts';
import type { Ff7Geometry, ListGeometry } from './ff7Geometry.ts';
import { MAGIC_COLS, subRows, type EdgeKind, type Ff7MenuState } from './ff7MenuModel.ts';
import { FF7_LIMIT_WINDOW_COLOUR, FF7_WINDOW_COLOUR, limitLetterColours, TEXT } from './ff7Tokens.ts';

export interface MenuContext {
  /** The acting fighter's current MP (the MP window). */
  actorMp: number;
  /** The acting fighter's Limit Level (the Limit window's header). */
  limitLevel: number;
  /** Items in the bag, when known. */
  itemCount?: (id: ItemId) => number | undefined;
  /** Step of the "Limit" letter colours. */
  limitPhase: number;
}

/** Rows a list shows at once [our estimate: the command window's four slots]. */
const VISIBLE_ROWS = 4;

function cursor(g: Ff7Geometry, o: Origin, textX: number, yc: number): string {
  const c = g.cursor;
  return `<div class="ff7-cur" style="left:${textX - c.tip - c.w - o.x}px;top:${yc - c.h / 2 - o.y}px">${gloveSvg(c.w, c.h)}</div>`;
}

function hit(g: Ff7Geometry, o: Origin, r: { x: number; w: number }, yc: number, attr: string): string {
  const pitch = g.mode === 'phone' ? 44 : 12 * g.s;
  return `<div class="ff7-hit" ${attr} style="left:${r.x - o.x}px;top:${yc - pitch / 2 - o.y}px;width:${r.w}px;height:${pitch}px"></div>`;
}

function commandWindow(g: Ff7Geometry, st: Ff7MenuState, ctx: MenuContext, withCursor: boolean): string {
  const c = g.cmd;
  return windowHtml(c.r, { colour: FF7_WINDOW_COLOUR, frame: g.frame, radius: g.radius, name: 'command' }, (o) =>
    st.slots.map((slot, i) => {
      const yc = c.rows[i];
      if (!slot || yc === undefined) return ''; // a missing command leaves its slot blank
      const x = c.cols[0] as number;
      const color = !slot.enabled ? TEXT.off : slot.label === 'Limit' ? limitLetterColours(ctx.limitPhase) : TEXT.command;
      return text(o, x, yc + g.cap / 2, g.cap, slot.label, { shadow: g.shadow, color, cls: 'ff7-slot', data: { slot: String(i) } }) +
        (withCursor && st.view === 'top' && st.topIdx === i ? cursor(g, o, x, yc) : '') +
        hit(g, o, c.r, yc, `data-slot="${i}"`);
    }).join(''));
}

/**
 * Change or Defend beside the command window, the finger on it [S1; look our estimate]. It covers
 * whole fields, never half a word under it (the review's item 12): on a desktop Change reaches to
 * the names window's left edge (the whole name), Defend to the end of the HP field; on a phone
 * the label keeps a pad inside the frame on both sides.
 */
function edgeWindow(g: Ff7Geometry, st: Ff7MenuState, kind: EdgeKind): string {
  const c = g.cmd;
  const label = kind === 'change' ? 'Change' : 'Defend';
  const pad = 5 * g.s;
  const inner = Math.round(label.length * g.cap * 0.72 + g.cursor.w + g.cursor.tip + 2 * pad + g.frame);
  const h = Math.round(g.mode === 'phone' ? 44 : 14 * g.s);
  const yc = c.rows[st.topIdx] ?? c.rows[0] ?? c.r.y + c.r.h / 2;
  const desk = g.mode === 'desk';
  const left = desk ? g.bandL.x : 4;
  const changeX = Math.max(left, c.r.x - inner - g.s);
  const defendX = Math.min(c.r.x + c.r.w + g.s, g.W - 4 - inner);
  const x = kind === 'change' ? (desk ? left : changeX) : defendX;
  const w = kind === 'change' ? (desk ? c.r.x - g.s - left : inner) : desk ? Math.max(inner, g.right.maxEnd + 3 * g.s - x) : inner;
  const r = { x, y: yc - h / 2, w, h };
  const tx = x + pad + g.cursor.w + g.cursor.tip;
  return windowHtml(r, { colour: FF7_WINDOW_COLOUR, frame: g.frame, radius: g.radius, name: `edge-${kind}` }, (o) =>
    text(o, tx, yc + g.cap / 2, g.cap, label, { shadow: g.shadow, color: TEXT.command, cls: 'ff7-edge-label' }) +
    cursor(g, o, tx, yc) + hit(g, o, r, yc, `data-edge="${kind}"`));
}

/** The unmarked touch strips beside the command window's edges (Change left, Defend right). */
function edgeHits(g: Ff7Geometry, st: Ff7MenuState): string {
  const c = g.cmd.r;
  const w = g.mode === 'phone' ? 44 : 14 * g.s;
  const strip = (kind: EdgeKind, x: number): string => (st.edges[kind] && st.edge !== kind
    ? `<div class="ff7-hit" data-edge="${kind}" style="left:${x}px;top:${c.y}px;width:${w}px;height:${c.h}px"></div>` : '');
  return strip('change', c.x - w) + strip('defend', Math.min(c.x + c.w, g.W - w));
}

function firstRow(index: number, cols: number): number {
  return Math.max(0, Math.floor(index / cols) - (VISIBLE_ROWS - 1));
}

function listWindow(g: Ff7Geometry, st: Ff7MenuState, ctx: MenuContext, rows: AvailableCommand[], withCursor: boolean): string {
  const L: ListGeometry = g.list;
  const cols = st.sub === 'magic' ? MAGIC_COLS : 1;
  const top = firstRow(st.subIdx, cols);
  const countX = L.r.x + L.r.w - 10 * g.s;
  return windowHtml(L.r, { colour: FF7_WINDOW_COLOUR, frame: g.frame, radius: g.radius, name: st.sub ?? 'list' }, (o) =>
    rows.map((row, i) => {
      const line = Math.floor(i / cols) - top;
      const yc = L.rows[line];
      if (line < 0 || yc === undefined) return '';
      const x = L.cols[i % cols] as number;
      const color = row.enabled ? TEXT.command : TEXT.off;
      const count = st.sub === 'item' && row.command.kind === 'item' ? ctx.itemCount?.(row.command.id) : undefined;
      const colW = cols === 1 ? L.r.w : L.r.w / cols;
      const label = count !== undefined ? row.label.replace(/ x\d+$/, '') : row.label; // the engine's "Potion x3": the count has its own column
      return text(o, x, yc + g.cap / 2, g.cap, label, { shadow: g.shadow, color, cls: 'ff7-row-label', data: { row: String(i) } }) +
        (count !== undefined ? text(o, countX, yc + g.cap / 2, g.cap, String(count), { shadow: g.shadow, color, align: 'r' }) : '') +
        (withCursor && st.subIdx === i ? cursor(g, o, x, yc) : '') +
        hit(g, o, { x: x - g.cursor.w - g.cursor.tip, w: colW }, yc, `data-row="${i}"`);
    }).join(''));
}

function mpWindow(g: Ff7Geometry, st: Ff7MenuState, ctx: MenuContext, rows: AvailableCommand[]): string {
  const row = st.view === 'target' ? st.pending : rows[st.subIdx];
  if (!row) return '';
  const r = g.mpWin;
  const base = r.y + r.h / 2 + g.cap / 2;
  const pad = g.mode === 'phone' ? 12 : 6 * g.s;
  return windowHtml(r, { colour: FF7_WINDOW_COLOUR, frame: g.frame, radius: g.radius, name: 'mp-needed' }, (o) =>
    text(o, r.x + pad, base - 2 * g.s, g.hdrCap, 'MP', { color: TEXT.header, outline: g.hdrEdge, cls: 'ff7-hdr', track: 0.04 }) +
    text(o, r.x + r.w - pad - 3 * g.cap, base, g.cap, `${row.mpCost}/`, { shadow: g.shadow, color: TEXT.command, align: 'r' }) +
    text(o, r.x + r.w - pad, base, g.cap, String(ctx.actorMp), { shadow: g.shadow, color: TEXT.command, align: 'r' }));
}

function limitWindow(g: Ff7Geometry, st: Ff7MenuState, ctx: MenuContext, rows: AvailableCommand[], withCursor: boolean): string {
  const l = g.lim;
  return windowHtml(l.r, { colour: FF7_LIMIT_WINDOW_COLOUR, frame: g.frame, radius: g.radius, name: 'limit' }, (o) =>
    text(o, l.hdrX, l.hdrBase, g.hdrCap, `LIMIT LEVEL ${ctx.limitLevel}`, { color: TEXT.header, outline: g.hdrEdge, cls: 'ff7-hdr', track: 0.04 }) +
    rows.slice(0, 1).map((row, i) =>
      text(o, l.textX, l.textBase, g.cap, row.label, { shadow: g.shadow, color: row.enabled ? TEXT.command : TEXT.off, cls: 'ff7-row-label', data: { row: String(i) } }) +
      (withCursor && st.subIdx === i ? cursor(g, o, l.textX, l.textBase - g.cap / 2) : '') +
      hit(g, o, { x: l.r.x, w: l.r.w }, l.textBase - g.cap / 2, `data-row="${i}"`)).join(''));
}

/** Every open menu window for this state. */
export function menuHtml(g: Ff7Geometry, st: Ff7MenuState, ctx: MenuContext): string {
  const aiming = st.view === 'target';
  const rows = subRows(st);
  if (st.sub === 'magic') return listWindow(g, st, ctx, rows, !aiming) + mpWindow(g, st, ctx, rows);
  if (st.sub === 'item') return listWindow(g, st, ctx, rows, !aiming);
  if (st.sub === 'limit') return commandWindow(g, st, ctx, false) + limitWindow(g, st, ctx, rows, !aiming);
  return commandWindow(g, st, ctx, !aiming && !st.edge) + (st.edge && !aiming ? edgeWindow(g, st, st.edge) : '') + (aiming ? '' : edgeHits(g, st));
}

/** The finger on each aimed target: tip at the left of the figure, pointing right [spec §5.6]. */
export function targetCursorsHtml(g: Ff7Geometry, points: ReadonlyArray<{ id: string; x: number; y: number }>): string {
  const c = g.cursor;
  return points.map((p) =>
    `<div class="ff7-cur ff7-cur--target" data-target="${p.id}" style="left:${p.x - c.w}px;top:${p.y - c.h / 2}px">${gloveSvg(c.w, c.h)}</div>`).join('');
}

/** Tap areas over each valid target while aiming (a tap moves the finger, a second tap confirms). */
export function targetHitsHtml(rects: ReadonlyArray<{ id: string; x: number; y: number; w: number; h: number }>): string {
  return rects.map((r) => box({ x: 0, y: 0 }, r.x, r.y, r.w, r.h, 'ff7-hit ff7-hit--target', '').replace('<div ', `<div data-target="${r.id}" `)).join('');
}
