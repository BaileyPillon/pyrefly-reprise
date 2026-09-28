/**
 * FF7's results windows and Game Over as HTML (FF7 only; Bailey, 2026-09-27,
 * "I'll go with all of your recommendations", accepting D-244's C1 two-window
 * results and G1 Game Over; the mockups are
 * `docs/concepts/ff7-options-2026-09-27/sheet-6-C-results-two-windows.jpg` and
 * `sheet-7-C-results-compact-and-game-over.jpg`).
 *
 * - **Step 1** (EXP and AP): an EXP window and an AP window across the top, then
 *   a window per member with the portrait (a crop of our own painting), name, LV,
 *   the EXP award counting in with its gauge filling (the AP is the AP window's;
 *   FF7's member rows carry no AP line, so the phase-3 repair dropped ours).
 * - **Step 2** (Gil and Items): the gil window, the Items window with the
 *   finger on the Assault Gun and its line, and the message "Received ...".
 * - **Game Over**: black, GAME OVER, then RETRY / CHAPTER SELECT in a window.
 *
 * Sources: FF Wiki "Battle Results" (revid 4050832) and "Final Fantasy VII
 * battle system" (revid 4039023): the gained EXP beside each member's menu
 * portrait with a gauge that fills, the AP to Materia, gil, the dropped items;
 * "Game Over (term)" (revid 4032692): the camera pans up, then Game Over. The
 * numbers are the engine's (`battle/ff7/results.ts`: 100 EXP, 10 AP, 100 gil,
 * the Assault Gun, gs §12). **Our estimate**: the window arrangement; the gauge
 * shows the award counting in, not the progress to the next level (the EXP
 * table is not in research/, so levels gained are not computed). A member KO'd
 * at the end gets 0 EXP and an empty gauge (core §11; `app/screens/ff7Standing.ts`).
 * Music and the retail reel stay out (silence).
 */

import { box, text, windowHtml, esc, type Origin } from './ff7Draw.ts';
import { gloveSvg } from './ff7Art.ts';
import { FF7_WINDOW_COLOUR, TEXT } from './ff7Tokens.ts';
import type { Rect } from './ff7Geometry.ts';

/** One member's row. */
export interface Ff7ResultMember {
  id: string;
  name: string;
  level: number;
  exp: number;
  ap: number;
  materia: string[];
  /** The member's idle painting, and the head's box in it as fractions (x, y, size of width). */
  portrait: { url: string; x: number; y: number; w: number };
}

export interface Ff7ResultsView {
  exp: number;
  ap: number;
  gil: number;
  items: Array<{ name: string; count: number; line: string }>;
  members: Ff7ResultMember[];
}

/** The frame the windows are laid out in: the viewport, and px per unit (1 at 1600x900). */
export interface Ff7ResFrame {
  W: number;
  H: number;
  s: number;
  phone: boolean;
}

export function resFrame(W: number, H: number): Ff7ResFrame {
  const phone = W / H < 1;
  return { W, H, s: phone ? W / 560 : Math.min(W / 1600, H / 900), phone };
}

const O: Origin = { x: 0, y: 0 };

function win(r: Rect, name: string, f: Ff7ResFrame, inner: (o: Origin) => string): string {
  return windowHtml(r, { colour: FF7_WINDOW_COLOUR, frame: 7 * f.s, radius: 8 * f.s, name }, inner);
}

function glove(f: Ff7ResFrame, x: number, yc: number, o: Origin = O): string {
  const w = 58 * f.s;
  const h = 30 * f.s;
  return `<div class="ff7-cur" style="left:${x - w - o.x}px;top:${yc - h / 2 - o.y}px">${gloveSvg(w, h)}</div>`;
}

const hdr = (o: Origin, x: number, base: number, f: Ff7ResFrame, label: string): string =>
  text(o, x, base, 14 * f.s, label, { color: TEXT.header, outline: 1.2 * f.s, cls: 'ff7-hdr', track: 0.04 });

/** Two top windows: a label and a big right-aligned number. */
function tally(r: Rect, name: string, label: string, value: number, f: Ff7ResFrame): string {
  return win(r, name, f, (o) =>
    hdr(o, r.x + 22 * f.s, r.y + 28 * f.s, f, label) +
    text(o, r.x + r.w - 26 * f.s, r.y + r.h - 18 * f.s, 34 * f.s, String(value), { shadow: 2 * f.s, color: TEXT.command, align: 'r', cls: 'ff7-res-num' }));
}

function portrait(m: Ff7ResultMember, x: number, y: number, size: number, f: Ff7ResFrame): string {
  const bg = size / m.portrait.w;
  const style = `background-image:url(${esc(m.portrait.url)});background-size:${bg}px auto;background-position:${-m.portrait.x * bg}px ${-m.portrait.y * bg}px;` +
    `background-repeat:no-repeat;background-color:#0a0a2a;border:${2 * f.s}px solid #b8b8b8;border-radius:${3 * f.s}px`;
  return box(O, x, y, size, size, 'ff7-portrait', style);
}

/** The EXP gauge filling with the award as it counts in (not the next-level progress: the EXP table is unsourced). */
function expGauge(o: Origin, x: number, y: number, w: number, f: Ff7ResFrame, u: number): string {
  const s = f.s;
  return box(o, x, y, w, 14 * s, 'ff7-res-gauge', `background:#3a0c0c;border:${1.5 * s}px solid #9a9a9a`) +
    box(o, x + 1.5 * s, y + 1.5 * s, Math.max(0, (w - 3 * s) * Math.min(1, u)), 11 * s, 'ff7-res-gauge-fill', 'background:linear-gradient(#b8ccff,#6f8ff0 45%,#4b6be0)');
}

/** A member's window on a desk: portrait, name and LV on the left; EXP and the gauge on the right. */
function memberDesk(mem: Ff7ResultMember, r: Rect, f: Ff7ResFrame, u: number): string {
  const s = f.s;
  const p = r.h - 56 * s;
  const px = r.x + 28 * s;
  const tx = px + p + 32 * s;
  const colX = r.x + r.w * 0.42;
  const award = Math.round(mem.exp * Math.min(1, u));
  return win(r, `res-member-${mem.id}`, f, (o) =>
    text(o, tx, r.y + 72 * s, 36 * s, mem.name, { shadow: 2 * s, color: TEXT.command, cls: 'ff7-res-name' }) +
    hdr(o, tx, r.y + 120 * s, f, 'LV') +
    text(o, tx + 40 * s, r.y + 124 * s, 34 * s, String(mem.level), { shadow: 2 * s, color: TEXT.command }) +
    hdr(o, colX, r.y + 62 * s, f, 'EXP') +
    text(o, r.x + r.w - 40 * s, r.y + 66 * s, 34 * s, `+${award}`, { shadow: 2 * s, color: TEXT.command, align: 'r', cls: 'ff7-res-award' }) +
    expGauge(o, colX, r.y + 88 * s, r.x + r.w - 40 * s - colX, f, mem.exp > 0 ? u : 0)) +
    portrait(mem, px, r.y + 28 * s, p, f);
}

/** A member's window on an upright phone: a small portrait, name, LV and EXP across the top; the gauge full width below. */
function memberPhone(mem: Ff7ResultMember, r: Rect, f: Ff7ResFrame, u: number): string {
  const s = f.s;
  const p = 104 * s;
  const px = r.x + 22 * s;
  const tx = px + p + 24 * s;
  const award = Math.round(mem.exp * Math.min(1, u));
  return win(r, `res-member-${mem.id}`, f, (o) =>
    text(o, tx, r.y + 62 * s, 34 * s, mem.name, { shadow: 2 * s, color: TEXT.command, cls: 'ff7-res-name' }) +
    hdr(o, tx, r.y + 108 * s, f, 'LV') +
    text(o, tx + 38 * s, r.y + 112 * s, 30 * s, String(mem.level), { shadow: 2 * s, color: TEXT.command }) +
    hdr(o, r.x + r.w - 150 * s, r.y + 54 * s, f, 'EXP') +
    text(o, r.x + r.w - 28 * s, r.y + 112 * s, 32 * s, `+${award}`, { shadow: 2 * s, color: TEXT.command, align: 'r', cls: 'ff7-res-award' }) +
    expGauge(o, px, r.y + 150 * s, r.w - 50 * s, f, mem.exp > 0 ? u : 0)) +
    portrait(mem, px, r.y + 22 * s, p, f);
}

/** Step 1: EXP, AP and a row per member; `u` is the count-in, 0..1. */
export function stepOneHtml(v: Ff7ResultsView, f: Ff7ResFrame, u: number): string {
  const { W, H, s, phone } = f;
  const m = (phone ? 16 : 70) * s;
  const top = (phone ? 70 : 36) * s;
  const wHalf = (W - 2 * m - 30 * s) / 2;
  const th = 78 * s;
  let out = tally({ x: m, y: top, w: wHalf, h: th }, 'res-exp', 'EXP', v.exp, f) +
    tally({ x: m + wHalf + 30 * s, y: top, w: wHalf, h: th }, 'res-ap', 'AP', v.ap, f);
  const rowH = (phone ? 250 : 210) * s;
  v.members.forEach((mem, i) => {
    const r: Rect = { x: m, y: top + th + (26 + i * (rowH / s + 26)) * s, w: W - 2 * m, h: rowH };
    out += phone ? memberPhone(mem, r, f, u) : memberDesk(mem, r, f, u);
  });
  out += glove(f, W - m + 8 * s, H - 70 * s) + box(O, 0, 0, W, H, 'ff7-hit ff7-res-next', '').replace('<div ', '<div data-action="results:continue" ');
  return out;
}

/** Step 2: gil, the items with the finger, the message. */
export function stepTwoHtml(v: Ff7ResultsView, f: Ff7ResFrame): string {
  const { W, H, s, phone } = f;
  const m = (phone ? 16 : 70) * s;
  const top = (phone ? 70 : 36) * s;
  const th = 78 * s;
  const wHalf = (W - 2 * m - 30 * s) / 2;
  let out = tally({ x: m, y: top, w: phone ? W - 2 * m : wHalf, h: th }, 'res-gil', 'GIL', v.gil, f);
  const ir: Rect = { x: m, y: top + th + 26 * s, w: W - 2 * m, h: (phone ? 260 : 250) * s };
  out += win(ir, 'res-items', f, (o) =>
    hdr(o, ir.x + 22 * s, ir.y + 30 * s, f, 'ITEMS') +
    v.items.map((it, i) => {
      const yc = ir.y + (92 + i * 110) * s;
      const ix = ir.x + (phone ? 84 : 100) * s;
      return glove(f, ix - 12 * s, yc - 12 * s, o) +
        text(o, ix, yc, 36 * s, it.name, { shadow: 2 * s, color: TEXT.command, cls: 'ff7-res-item' }) +
        text(o, ir.x + ir.w - (phone ? 24 : 50) * s, yc, 36 * s, String(it.count), { shadow: 2 * s, color: TEXT.command, align: 'r' }) +
        text(o, phone ? ir.x + 30 * s : ix, yc + 56 * s, (phone ? 22 : 24) * s, it.line, { shadow: 2 * s, color: TEXT.body });
    }).join(''));
  const got = v.items.length ? ` and the ${v.items.map((i) => i.name).join(', the ')}` : '';
  const mr: Rect = { x: m, y: ir.y + ir.h + 30 * s, w: W - 2 * m, h: (phone ? 110 : 76) * s };
  out += win(mr, 'res-message', f, (o) =>
    text(o, mr.x + mr.w / 2, mr.y + mr.h / 2 + (phone ? 8 : 12) * s, (phone ? 21 : 30) * s, `Received ${v.gil} gil${got}.`, { shadow: 2 * s, color: TEXT.command, align: 'c', cls: 'ff7-res-msg' }));
  out += glove(f, W - m + 8 * s, H - 70 * s) + box(O, 0, 0, W, H, 'ff7-hit ff7-res-next', '').replace('<div ', '<div data-action="results:continue" ');
  return out;
}

export const GAME_OVER_ACTIONS = [
  { choice: 'retry', label: 'RETRY' },
  { choice: 'chapter-select', label: 'CHAPTER SELECT' },
] as const;

/** Game Over: the words, then (once `menu` is up) the two choices with the finger on `idx`. */
export function gameOverHtml(f: Ff7ResFrame, menu: boolean, idx: number, alpha: number): string {
  const { W, H, s } = f;
  let out = `<div class="ff7-gameover-words" style="left:0;top:${H * 0.36 - 40 * s}px;width:${W}px;height:${80 * s}px;opacity:${alpha.toFixed(3)};` +
    `text-align:center;font-size:${54 * s}px;line-height:${80 * s}px;letter-spacing:0.08em;color:#e8e8e8;text-shadow:0 0 ${10 * s}px rgba(160,190,255,.45),${2 * s}px ${2 * s}px 0 #111">GAME OVER</div>`;
  if (!menu) return out;
  const r: Rect = { x: W / 2 - 220 * s, y: H * 0.36 + 70 * s, w: 440 * s, h: 128 * s };
  out += win(r, 'gameover-menu', f, (o) =>
    GAME_OVER_ACTIONS.map((a, i) => {
      const yc = r.y + (40 + i * 48) * s;
      return text(o, r.x + 92 * s, yc + 11 * s, 28 * s, a.label, { shadow: 2 * s, color: TEXT.command, cls: 'ff7-go-row', data: { row: a.choice } }) +
        (i === idx ? glove(f, r.x + 84 * s, yc, o) : '') +
        box(o, r.x, yc - 24 * s, r.w, 48 * s, 'ff7-hit', '').replace('<div ', `<div data-action="results:${a.choice}" `);
    }).join(''));
  return out;
}
