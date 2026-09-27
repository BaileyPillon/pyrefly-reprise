/**
 * Where every FF7 battle window, column and row sits, in CSS pixels (FF7 only).
 *
 * Pure: no DOM. Positions come from FF7's own 320 x 224 battle picture ("u")
 * as measured in `docs/plans/ff7-hud-faithful-a-spec.md` §3.2, placed by the A+
 * target's rules (`docs/concepts/ff7-hud-2026-09-27/a-plus/README.md` point 14)
 * with the three repairs its fidelity review asked for:
 *
 * 1. **The status window's columns keep FF7's spacing.** On a phone, MP, LIMIT
 *    and TIME hang from the window's right edge at FF7's own scale (TIME ends
 *    6 u inside the frame, LIMIT ends 2 u before TIME, the MP digits end 3 u
 *    before LIMIT). On a desktop every column is a fraction of the width, as
 *    spec §5.1 / §5.2 lay them (HP max ends at 204 u, MP at 236 u, LIMIT 239 to
 *    275 u, TIME 277 to 313 u; gauge widths use the horizontal scale), so the
 *    16:9 slack is shared out between the columns instead of all falling between
 *    HP and MP (the FF7 purist review, 2026-09-27, item 11).
 * 2. **Header caps are small**: 3 u at the body's 8 u (the stills read about
 *    3.5 u including the outline; A+ drew 4.5 u).
 * 3. **On a phone the command window only overlaps the names window**, as in
 *    FF7: its bottom sits on the names window's bottom, so it never reaches the
 *    status window's header line (A+ phone A clipped MP, LIMIT and TIME).
 *
 * Desktop: every x anchor and window edge is a fraction of the width (`hx` px
 * per u), every y a fraction of the height (`vs`), every other size (type,
 * frames, gauge heights, the cursor) the smaller of the two (`s`), so type is
 * never stretched (Bailey's pick D-238: stretch on 16:9, no pillarbox). The
 * command window is FF7's measured box, 72 to 131 u (360 to 655 px at 1600,
 * text at 390; spec §5.2; the review's item 14). Phone (an upright window under
 * 600 px): one uniform scale `p` for both band windows, stacked (spec §6).
 * Two phone adaptations exist (A+ sheet 7): **A**, the status window filling
 * the width (2.05 px/u), and **B**, 1.64 px/u with each name repeated at the
 * left of its status row so a row reads across as in FF7.
 */

/** The two upright-phone adaptations of the A+ target (sheet 7). */
export type Ff7PhoneLayout = 'a' | 'b';
/**
 * The layout the real-input check chose (2026-09-27, `docs/handoff/ff7-guard-scorpion.md`): **B**.
 * In A the names sit in their own window at other heights than the HP rows, so on a turn nothing
 * says whose row is whose; B's rows read across ("Cloud 176/ 316 37") as FF7's do, and its lower
 * command window leaves the fighters' feet clear. A stays reachable with `?ff7phone=a`.
 */
export const FF7_PHONE_LAYOUT: Ff7PhoneLayout = 'b';

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** A menu list: its window, the text x of each column, the centre y of each row. */
export interface ListGeometry {
  r: Rect;
  cols: number[];
  rows: number[];
}

export interface Ff7Geometry {
  mode: 'desk' | 'phone';
  W: number;
  H: number;
  /** Px per u for every size. */
  s: number;
  /** Body cap height (8 u) [spec §3.3]. */
  cap: number;
  /** Header cap height (3 u, see point 2 above). */
  hdrCap: number;
  /** Header outline, px. */
  hdrEdge: number;
  /** The 1 u text shadow, px. */
  shadow: number;
  /** Frame thickness (3 u) and outer corner radius (2 u) [spec §3.1]. */
  frame: number;
  radius: number;
  msg: Rect;
  /** Top of FF7's black strip under the band [spec §3.2]. */
  strip: number;
  bandL: Rect;
  bandR: Rect;
  left: { hdrBase: number; rows: number[]; nameX: number; barrierRight: number };
  right: {
    hdrBase: number;
    rows: number[];
    hp0: number;
    curEnd: number;
    maxEnd: number;
    mpLine0: number;
    mpEnd: number;
    limitX: number;
    timeX: number;
    /** Gauge box, 36 x 9 u (4:1, FF7's own shape). */
    gaugeW: number;
    gaugeH: number;
    hdr: { hp: number; mp: number; limit: number; time: number };
    /** Phone B only: each row's name at the left of the status window. */
    nameX?: number;
  };
  /** Command window: one column, four fixed slots [spec §3.2]. */
  cmd: ListGeometry;
  /** Magic / Item list: three columns over the command window [spec §5.8, layout our estimate]. */
  list: ListGeometry;
  /** The MP-needed window beside the Magic list [our estimate]. */
  mpWin: Rect;
  /** The Limit-technique window [spec §3.2, single source]. */
  lim: { r: Rect; hdrX: number; hdrBase: number; textX: number; textBase: number };
  /** Finger cursor box and the gap from its fingertip to the text [spec §5.6]. */
  cursor: { w: number; h: number; tip: number };
  /** Damage numeral height, 10 u [spec §3.6]. */
  dmgCap: number;
  /** Ready triangle, about 10 x 7 u [spec §5.8]. */
  tri: { w: number; h: number };
}

/** Row centres of the three party slots, u [spec §3.2]. */
export const ROWS_U = [171, 187, 203] as const;
/** Command slot centres, u (12 u pitch) [spec §3.2]. */
export const SLOTS_U = [172, 184, 196, 208] as const;

/** Upright phone, the same test as the shared phone layout (`ui/common/phoneBattle.ts`). */
export function isPhoneShape(W: number, H: number): boolean {
  return W < 600 && H > W;
}

export function ff7Geometry(W: number, H: number, phoneLayout: Ff7PhoneLayout = FF7_PHONE_LAYOUT): Ff7Geometry {
  return isPhoneShape(W, H) ? phone(W, H, phoneLayout) : desk(W, H);
}

/** The status window's right-hand cluster, laid from its right edge at scale `s` (point 1). */
function rightCluster(windowRight: number, hp0: number, s: number) {
  const timeX = windowRight - 6 * s - 36 * s;
  const limitX = timeX - 2 * s - 36 * s;
  const mpEnd = limitX - 3 * s;
  const mpLine0 = mpEnd - 29 * s;
  const curEnd = hp0 + 28 * s;
  const maxEnd = hp0 + 60 * s;
  return { hp0, curEnd, maxEnd, mpLine0, mpEnd, limitX, timeX, gaugeW: 36 * s, gaugeH: 9 * s,
    hdr: { hp: hp0, mp: mpLine0 + 4 * s, limit: limitX + 1 * s, time: timeX + 3 * s } };
}

/** The desktop status window's columns, each at its own u as a fraction of the width [spec §3.2, §5.2]. */
function deskRightCluster(X: (u: number) => number, s: number, hx: number) {
  return { hp0: X(144), curEnd: X(172), maxEnd: X(204), mpLine0: X(207), mpEnd: X(236), limitX: X(239), timeX: X(277), gaugeW: 36 * hx, gaugeH: 9 * s,
    hdr: { hp: X(144), mp: X(211), limit: X(240), time: X(280) } };
}

function desk(W: number, H: number): Ff7Geometry {
  const vs = H / 224;
  const hx = W / 320;
  const s = Math.min(vs, hx);
  const X = (u: number): number => u * hx;
  const Y = (u: number): number => u * vs;
  const R4 = (x0: number, y0: number, x1: number, y1: number): Rect => ({ x: X(x0), y: Y(y0), w: X(x1) - X(x0), h: Y(y1) - Y(y0) });
  const bandR = R4(138, 159, 319, 213); // FF7's 3 u gap after the left window
  const rows = ROWS_U.map(Y);
  const slots = SLOTS_U.map(Y);
  const cmdX = X(72); // FF7's measured box, 72 to 131 u: its right edge on the Barrier column
  const list = { x: cmdX, y: Y(163), w: 156 * hx, h: 54 * vs };
  return {
    mode: 'desk', W, H, s,
    cap: 8 * s, hdrCap: 3 * s, hdrEdge: Math.max(1, s / 4), shadow: s, frame: 3 * s, radius: 2 * s,
    msg: R4(17, 9, 303, 30),
    strip: Y(213),
    bandL: R4(1, 159, 135, 213),
    bandR,
    left: { hdrBase: Y(165), rows, nameX: X(13), barrierRight: X(131) },
    right: { hdrBase: Y(165), rows, ...deskRightCluster(X, s, hx) },
    cmd: { r: { x: cmdX, y: Y(163), w: 59 * hx, h: 54 * vs }, cols: [X(78)], rows: slots },
    list: { r: list, cols: [78, 130, 174].map(X), rows: slots },
    mpWin: { x: Math.min(list.x + list.w + s, W - 4 - 66 * s), y: Y(197), w: 66 * s, h: 18 * s },
    lim: { r: { x: X(81), y: Y(166), w: 133 * hx, h: 24 * vs }, hdrX: X(88), hdrBase: Y(173.5), textX: X(110), textBase: Y(186) },
    cursor: { w: 20 * s, h: 10 * s, tip: 2 * s },
    dmgCap: 10 * s,
    tri: { w: 10 * s, h: 7 * s },
  };
}

/** Command slot pitch on a phone: 44 px for a thumb (spec §6). */
const PHONE_SLOT = 44;

/** Phone B's scale, px per u (A+ sheet 7). */
const PHONE_B_SCALE = 1.64;

function phone(W: number, H: number, layout: Ff7PhoneLayout): Ff7Geometry {
  // A: the status window's 181 u fill the width inside two 8 px gutters; B: one smaller scale.
  const p = layout === 'b' ? PHONE_B_SCALE : (W - 16) / 181;
  const h = 54 * p;
  const strip = H - 23;
  const statusY = strip - h;
  const namesY = statusY - 2 - h;
  const Lx = (u: number): number => 8 + (u - 1) * p;
  const Ly = (u: number): number => namesY + (u - 159) * p;
  const Rx = (u: number): number => 8 + (u - 138) * p;
  const Ry = (u: number): number => statusY + (u - 159) * p;
  const bandR = { x: 8, y: statusY, w: W - 16, h };
  const cmdH = 4 * PHONE_SLOT + 20;
  const cmdY = namesY + h - cmdH; // point 3: the bottom sits on the names window's bottom
  const rows = [0, 1, 2, 3].map((i) => cmdY + 32 + i * PHONE_SLOT);
  const cmdX = Math.round(W * 0.4);
  const lim = { x: Math.round(W * 0.28), y: cmdY + 20, w: W - Math.round(W * 0.28) - 8, h: 100 };
  return {
    mode: 'phone', W, H, s: p,
    cap: 8 * p, hdrCap: 7, hdrEdge: 1, shadow: Math.max(1, p), frame: 3 * p, radius: 2 * p,
    msg: { x: 8, y: 8, w: W - 16, h: 45 },
    strip,
    bandL: { x: 8, y: namesY, w: 134 * p, h },
    bandR,
    left: { hdrBase: Ly(165), rows: ROWS_U.map(Ly), nameX: Lx(13), barrierRight: Lx(131) },
    right: layout === 'b'
      ? { hdrBase: Ry(165), rows: ROWS_U.map(Ry), ...rightCluster(bandR.x + bandR.w, 8 + 50 * p, p), nameX: 8 + 6 * p }
      : { hdrBase: Ry(165), rows: ROWS_U.map(Ry), ...rightCluster(bandR.x + bandR.w, Rx(144), p) },
    cmd: { r: { x: cmdX, y: cmdY, w: W - cmdX - 44, h: cmdH }, cols: [cmdX + 48], rows },
    list: { r: { x: 8, y: cmdY, w: W - 16, h: cmdH }, cols: [0.1436, 0.4513, 0.759].map((f) => Math.round(W * f)), rows },
    mpWin: { x: W - 158, y: cmdY - 58, w: 150, h: 54 },
    lim: { r: lim, hdrX: lim.x + 20, hdrBase: lim.y + 29, textX: lim.x + 70, textBase: lim.y + 80 },
    cursor: { w: 40, h: 20, tip: 4 },
    dmgCap: 22,
    tri: { w: 20, h: 14 },
  };
}
