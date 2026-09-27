/**
 * HTML builders for the FF7 battle windows (FF7 only): text placed by its
 * baseline and sized by its cap height, the blue window with its grey bevel,
 * the raised gauge boxes and the HP / MP lines. Strings, so each window
 * re-renders in one assignment; every coordinate is a HUD pixel and `o` is the
 * origin of the window being filled.
 *
 * The recipes are `docs/plans/ff7-hud-faithful-a-spec.md` §5.3 (window), §3.4
 * and §5.7 (gauges), §5.5 (type), as the A+ target drew them
 * (`docs/concepts/ff7-hud-2026-09-27/a-plus/src/hud.js`).
 */

import {
  BASELINE_FROM_TOP,
  BODY_FONT,
  CYL,
  cylinder,
  FRAME_SIDE,
  FRAME_TOP,
  hex,
  LINE,
  TEXT,
  type CylinderKey,
  type WindowColour,
} from './ff7Tokens.ts';
import type { Rect } from './ff7Geometry.ts';

export interface Origin {
  x: number;
  y: number;
}

export const px = (n: number): string => `${Math.round(n * 100) / 100}px`;

const ESC: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (s: string): string => s.replace(/[&<>"']/g, (c) => ESC[c] ?? c);

export interface TextOptions {
  /** One colour, or one per letter (the "Limit" colours). */
  color?: string | readonly string[];
  align?: 'l' | 'r' | 'c';
  /** Drop shadow down-right, px [spec §5.5: 1 u]. */
  shadow?: number;
  /** Even outline, px (header caps). */
  outline?: number;
  /** Extra class names. */
  cls?: string;
  /** Letter spacing, em. */
  track?: number;
  /** data-* attributes, already escaped keys. */
  data?: Record<string, string>;
}

/** Text whose baseline is at `base` and whose capitals are `cap` px tall. */
export function text(o: Origin, x: number, base: number, cap: number, str: string, opt: TextOptions = {}): string {
  const fs = cap / BODY_FONT.cap;
  const top = base - BASELINE_FROM_TOP * fs;
  const a = opt.align ?? 'l';
  const lx = a === 'l' ? x : a === 'r' ? x - 2000 : x - 1000;
  const width = a === 'l' ? 'auto' : '2000px';
  const align = a === 'l' ? 'left' : a === 'r' ? 'right' : 'center';
  let sh = '';
  if (opt.outline) {
    const d = opt.outline;
    const rings: string[] = [];
    for (const [dx, dy] of [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]] as const) {
      rings.push(`${px(dx * d)} ${px(dy * d)} 0 ${TEXT.headerEdge}`);
    }
    sh = rings.join(',');
  } else if (opt.shadow) {
    sh = `${px(opt.shadow)} ${px(opt.shadow)} 0 ${TEXT.shadow}`;
  }
  const colours = Array.isArray(opt.color) ? (opt.color as readonly string[]) : null;
  const body = colours ? [...str].map((ch, i) => `<span style="color:${colours[i] ?? TEXT.command}">${esc(ch)}</span>`).join('') : esc(str);
  const colour = colours ? TEXT.command : ((opt.color as string | undefined) ?? TEXT.body);
  const data = opt.data ? Object.entries(opt.data).map(([k, v]) => ` data-${k}="${esc(v)}"`).join('') : '';
  return `<div class="ff7-t${opt.cls ? ` ${opt.cls}` : ''}"${data} style="left:${px(lx - o.x)};top:${px(top - o.y)};width:${width};` +
    `text-align:${align};font-size:${px(fs)};line-height:${px(fs)};color:${colour};` +
    `${opt.track ? `letter-spacing:${opt.track}em;` : ''}${sh ? `text-shadow:${sh};` : ''}">${body}</div>`;
}

/** An absolutely placed empty box. */
export function box(o: Origin, x: number, y: number, w: number, h: number, cls: string, style = ''): string {
  return `<div class="${cls}" style="left:${px(x - o.x)};top:${px(y - o.y)};width:${px(w)};height:${px(h)};${style}"></div>`;
}

/** The bevel as inset rings, outside to inside (spec §5.3): top and bottom edges drawn over the sides. */
export function frameShadow(t: number): string {
  const tb: string[] = [];
  FRAME_TOP.forEach((c, i) => {
    const d = px(((i + 1) * t) / FRAME_TOP.length);
    tb.push(`inset 0 ${d} 0 0 ${c}`, `inset 0 -${d} 0 0 ${c}`);
  });
  const sd = FRAME_SIDE.map((c, i) => `inset 0 0 0 ${px(((i + 1) * t) / FRAME_SIDE.length)} ${c}`);
  return [...tb, ...sd].join(',');
}

export interface WindowOptions {
  colour: WindowColour;
  /** Frame thickness and outer radius, px. */
  frame: number;
  radius: number;
  /** The top message window is translucent: our estimate of the PS1 half blend [spec §3.1]. */
  translucent?: boolean;
  /** `data-win` name, for tests and taps. */
  name: string;
  cls?: string;
  /** Extra inline style for the window box (e.g. a safe-area top). */
  style?: string;
}

/** One FF7 window: the four-corner bilinear gradient and the grey bevel; `inner` fills it. */
export function windowHtml(r: Rect, opt: WindowOptions, inner: (o: Origin) => string): string {
  const c = opt.colour;
  const vars = `--tl:${hex(c.topLeft)};--tr:${hex(c.topRight)};--bl:${hex(c.bottomLeft)};--br:${hex(c.bottomRight)}`;
  return `<div class="ff7-win${opt.cls ? ` ${opt.cls}` : ''}" data-win="${opt.name}" style="left:${px(r.x)};top:${px(r.y)};width:${px(r.w)};height:${px(r.h)};${opt.style ?? ''}">` +
    `<div class="ff7-bg${opt.translucent ? ' ff7-bg--half' : ''}" style="border-radius:${px(opt.radius)};${vars}"></div>` +
    `<div class="ff7-fr" style="border-radius:${px(opt.radius)};box-shadow:${frameShadow(opt.frame)}"></div>` +
    `${inner({ x: r.x, y: r.y })}</div>`;
}

/** A raised gauge box with a cylinder-shaded fill [spec §3.4, §5.7]. `s` is px per u (the box frame is 1 u). */
export function gauge(o: Origin, x: number, yc: number, w: number, h: number, s: number, frac: number, fill: CylinderKey, cls = ''): string {
  const y = yc - h / 2;
  const iw = w - 2 * s;
  const ih = h - 2 * s;
  const f = Math.max(0, Math.min(1, frac));
  return box(o, x, y, w, h, `ff7-gb${cls ? ` ${cls}` : ''}`, `border-width:${px(s)}`) +
    box(o, x + s, y + s, iw, ih, 'ff7-track', `background:${cylinder(CYL.track)}`) +
    (f > 0 ? box(o, x + s, y + s, iw * f, ih, 'ff7-fill', `background:${cylinder(CYL[fill])}`) : '');
}

/** Two stacked bars in one box: Barrier on top, MBarrier below [spec §3.2, §5.7]. */
export function barrierBox(o: Origin, right: number, yc: number, s: number, barrier: number, mbarrier: number): string {
  const w = 35 * s;
  const x = right - w;
  const y = yc - 5 * s;
  const h = 10 * s;
  const ih = (h - 2 * s) / 2;
  const bar = (yy: number, frac: number, key: CylinderKey): string =>
    box(o, x + s, yy, w - 2 * s, ih, 'ff7-track', `background:${cylinder(CYL.track)}`) +
    (frac > 0 ? box(o, x + s, yy, (w - 2 * s) * Math.min(1, frac), ih, 'ff7-fill', `background:${cylinder(CYL[key])}`) : '');
  return box(o, x, y, w, h, 'ff7-gb ff7-barrier', `border-width:${px(s)}`) + bar(y + s, barrier, 'barrier') + bar(y + s + ih, mbarrier, 'mbarrier');
}

/** An HP or MP line, 1 u tall: the filled part shows the whole-field gradient, the lost part dark red [spec §3.4]. */
export function statLine(o: Origin, x: number, w: number, y: number, h: number, frac: number, kind: 'hp' | 'mp'): string {
  const f = Math.max(0, Math.min(1, frac));
  return box(o, x, y, w, h, 'ff7-line', `background:${LINE.lost}`) +
    box(o, x, y, w * f, h, 'ff7-line', `background:linear-gradient(90deg,${LINE[kind]});background-size:${px(w)} 100%`);
}
