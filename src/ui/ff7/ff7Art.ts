/**
 * The FF7 HUD's drawn marks: the finger cursor, the ready triangle and the
 * damage numerals (FF7 only). All three are our own SVG drawings (rule 8):
 * nothing was traced from, or drawn over, a retail sprite or glyph.
 *
 * - **The finger** [spec §5.6]: a white gloved hand pointing right, soft grey
 *   shading, a thin dark-grey edge. It starts from the idea of Bailey's own
 *   `CURSOR_SVG` in Lifestream Encore (`D:\FF7\concept\lib\hud.mjs`) and is the
 *   A+ target's drawing (`a-plus/src/glove.js`), ported unchanged.
 * - **The ready triangle** [spec §3.5]: yellow, two shaded faces and a lit top
 *   edge, no outline; it spins (rate our estimate, CSS).
 * - **Damage numerals** [spec §3.6, §5.10]: the A+ target's own digit skeletons
 *   ("PR7 Line", `a-plus/src/glyphs.js`) drawn heavy on equal cells (a "1"
 *   takes a full cell), white with an even 1 u near-black edge; green for
 *   recovery. Only these ten digits are ported: the body text is a web font.
 */

let glovePaint = 0;

/** The finger cursor, `w` x `h` px, fingertip at the right edge of the box. */
export function gloveSvg(w: number, h: number): string {
  const id = `ff7gv${++glovePaint}`;
  const shapes: Array<[string, Record<string, number>]> = [
    ['ellipse', { cx: 11.5, cy: 12.4, rx: 9.2, ry: 6.9 }], // back of the hand, rounded wrist
    ['rect', { x: 9.5, y: 5.2, width: 16.5, height: 14.2, rx: 4.8 }], // fist
    ['rect', { x: 21, y: 5.2, width: 19.5, height: 5.6, rx: 2.8 }], // index finger
    ['rect', { x: 20, y: 10.7, width: 8.8, height: 3.2, rx: 1.6 }], // three curled fingers
    ['rect', { x: 20, y: 13.6, width: 8.2, height: 3.1, rx: 1.55 }],
    ['rect', { x: 19.2, y: 16.4, width: 7.0, height: 2.9, rx: 1.45 }],
  ];
  const el = (tag: string, a: Record<string, number>, extra: string): string =>
    `<${tag} ${Object.entries(a).map(([k, v]) => `${k}="${v}"`).join(' ')} ${extra}/>`;
  const edge = shapes.map(([t, a]) => el(t, a, 'fill="#4A4A4A" stroke="#4A4A4A" stroke-width="2.2" stroke-linejoin="round"')).join('');
  const fills = shapes.map(([t, a]) => el(t, a, 'fill="#FFFFFF"')).join('');
  const shade =
    `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset=".45" stop-color="#FFFFFF" stop-opacity="0"/>` +
    `<stop offset="1" stop-color="#B9B9B9" stop-opacity=".85"/></linearGradient></defs>` +
    `<ellipse cx="11.5" cy="12.4" rx="9.2" ry="6.9" fill="url(#${id})"/>` +
    `<rect x="9.5" y="5.2" width="16.5" height="14.2" rx="4.8" fill="url(#${id})"/>` +
    `<path d="M20.8 13.6 H28.2 M20.2 16.4 H27.4" stroke="#B4B4B4" stroke-width=".9" stroke-linecap="round"/>` +
    `<path d="M13 10.1 Q17.5 8.7 22.2 10.4" stroke="#C8C8C8" stroke-width="1.1" fill="none" stroke-linecap="round"/>` +
    `<path d="M23 9.6 H39" stroke="#D6D6D6" stroke-width=".9" stroke-linecap="round"/>`;
  return `<svg class="ff7-glove" width="${w}" height="${h}" viewBox="0 2.5 43 20.5" xmlns="http://www.w3.org/2000/svg">${edge}${fills}${shade}</svg>`;
}

/** The ready triangle, `w` x `h` px, point down. */
export function triangleSvg(w: number, h: number, c: { face: string; side: string; top: string }): string {
  return `<svg class="ff7-tri" width="${w}" height="${h}" viewBox="966 404 38 33" xmlns="http://www.w3.org/2000/svg">` +
    `<path d="M966 408 L990 411 L985 437Z" fill="${c.face}"/><path d="M990 411 L1004 405 L985 437Z" fill="${c.side}"/>` +
    `<path d="M966 408 L990 411 L1004 405 L982 404Z" fill="${c.top}"/></svg>`;
}

// ------------------------------------------------------------ damage digits

const T = 0.65;
const B = 7.35;
const Mi = 4.0;
const f = (n: number): number => Math.round(n * 100) / 100;
type Pt = [number, number] | [number, number, number];

/** Polyline with rounded corners (the A+ glyph builder). */
function poly(pts: Pt[], r = 0): string {
  const p0 = pts[0] as Pt;
  let d = `M${f(p0[0])} ${f(p0[1])}`;
  for (let i = 1; i < pts.length; i++) {
    const v = pts[i] as Pt;
    const rr = v[2] ?? r;
    if (i === pts.length - 1 || !rr) {
      d += `L${f(v[0])} ${f(v[1])}`;
      continue;
    }
    const p = pts[i - 1] as Pt;
    const n = pts[i + 1] as Pt;
    const lp = Math.hypot(p[0] - v[0], p[1] - v[1]);
    const ln = Math.hypot(n[0] - v[0], n[1] - v[1]);
    const a = Math.min(rr, lp / 2);
    const b = Math.min(rr, ln / 2);
    d += `L${f(v[0] + ((p[0] - v[0]) * a) / lp)} ${f(v[1] + ((p[1] - v[1]) * a) / lp)}` +
      `Q${f(v[0])} ${f(v[1])} ${f(v[0] + ((n[0] - v[0]) * b) / ln)} ${f(v[1] + ((n[1] - v[1]) * b) / ln)}`;
  }
  return d;
}
const seg = (x0: number, y0: number, x1: number, y1: number): string => `M${f(x0)} ${f(y0)}L${f(x1)} ${f(y1)}`;
const rr = (x0: number, y0: number, x1: number, y1: number, r: number): string =>
  poly([[(x0 + x1) / 2, y0], [x1, y0], [x1, y1], [x0, y1], [x0, y0], [(x0 + x1) / 2, y0, 0]], r) + 'Z';

/** Digit skeletons: `(a = left stem, b = right stem, c = centre) => path`, ink width 5.6 glyph units. */
const DIGITS: Record<string, (a: number, b: number, c: number) => string> = {
  0: (a, b) => rr(a, T, b, B, 2.0),
  1: (_a, _b, c) => poly([[c - 1.5, T + 1.3], [c + 0.3, T], [c + 0.3, B]]),
  2: (a, b) => poly([[a, T], [b, T, 1.5], [b, Mi, 1.2], [a, Mi, 1.2], [a, B, 0], [b, B]]),
  3: (a, b) => poly([[a, T], [b, T, 1.5], [b, B, 1.5], [a, B]]) + seg(a + 1.3, Mi, b, Mi),
  4: (a, b) => poly([[b - 1.2, B], [b - 1.2, T], [a, B - 2.3], [b + 0.1, B - 2.3]]),
  5: (a, b) => poly([[b, T], [a, T], [a, Mi - 0.2], [b, Mi - 0.2, 1.5], [b, B, 1.5], [a, B]]),
  6: (a, b) => poly([[b - 0.2, T], [a, T, 1.8], [a, B, 1.6], [b, B, 1.5], [b, Mi, 1.3], [a, Mi]]),
  7: (a, b, c) => poly([[a, T], [b, T, 0], [b, T + 1.0, 0.6], [c - 0.5, B]]),
  8: (a, b) => rr(a + 0.3, T, b - 0.3, Mi, 1.3) + rr(a, Mi, b, B, 1.6),
  9: (a, b) => poly([[a + 0.2, B], [b, B, 1.6], [b, T, 1.8], [a, T, 1.5], [a, Mi, 1.3], [b, Mi]]),
};
const INK = 5.6;
const CELL = 7.4;
const STROKE = 2.3;

/**
 * A damage numeral as SVG, `cap` px tall, with a near-black edge `edge` px
 * wide all round. Non-digits are dropped (the engine sends numbers).
 */
export function damageSvg(value: string, cap: number, edge: number, fill: string): { svg: string; width: number; height: number } {
  const k = cap / 8;
  const digits = [...value].filter((ch) => DIGITS[ch]);
  const paths = digits.map((ch, i) => {
    const a = i * CELL + (CELL - INK) / 2 + T;
    const b = i * CELL + (CELL + INK) / 2 - T;
    return (DIGITS[ch] as (a: number, b: number, c: number) => string)(a, b, (a + b) / 2);
  });
  const pad = 1 + edge / k;
  const wU = digits.length * CELL + 2 * pad;
  const hU = 8 + 2 * pad;
  const layer = (col: string, sw: number): string => paths.map((d) => `<path d="${d}" stroke="${col}" stroke-width="${f(sw)}"/>`).join('');
  const svg = `<svg class="ff7-dmg-svg" width="${f(wU * k)}" height="${f(hU * k)}" viewBox="${f(-pad)} ${f(-pad)} ${f(wU)} ${f(hU)}" ` +
    `fill="none" stroke-linecap="square" stroke-linejoin="miter" stroke-miterlimit="2" xmlns="http://www.w3.org/2000/svg">` +
    `${layer('#181818', STROKE + (2 * edge) / k)}${layer(fill, STROKE)}</svg>`;
  return { svg, width: wU * k, height: hU * k };
}
