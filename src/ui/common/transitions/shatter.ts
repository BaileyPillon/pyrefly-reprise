/**
 * The pane breaks (A-2; approved tile "The pane breaks", Bailey 2026-09-19,
 * "canon by situation"), ported from the concept's `shatter.html`
 * (`docs/concepts/polish/glass-shatter-transition/`, local art).
 *
 * The frame the player was looking at is struck, cracks in place, then comes
 * apart. Two games, two leavings (`research/ffx-vs-ffx2-presentation.md` §1.1, §1.2):
 *
 * - **FFX** (on a skipped scene and on a retry; a scene played out blurs,
 *   `blur.ts`): the shards leave in a **right-to-left sweep**, the rightmost
 *   first, each spinning as it goes, after a white flash at the break, with a
 *   black field behind the glass that fades up into the battle (§1.1 steps 2 to 4).
 * - **FFX-2**: its own shatter, a burst away from the strike, the accent in
 *   the game's pyre pink, then a **hard cut** from the black field to the
 *   battle (§1.2: "the screen shattering and the view switching to battle mode").
 *
 * The fracture is a deterministic Voronoi on sites clustered at the strike
 * (the concept's), capped at {@link SHATTER_MAX_SHARDS}. No `three`: a 2D canvas.
 */

import type { EntryPlayer } from './entryOverlay.ts';

export type ShatterGame = 'ffx' | 'ffx2';

/** Shards at most: the concept's 84 cut to keep a phone at frame rate. */
export const SHATTER_MAX_SHARDS = 48;
/** The crack in place (the held beat before anything falls). */
export const SHATTER_CRACK_MS = 250;
/** The break. */
export const SHATTER_BREAK_MS: Readonly<Record<ShatterGame, number>> = { ffx: 700, ffx2: 560 };

type Pt = [number, number];

export interface Shard {
  poly: Pt[];
  cx: number;
  cy: number;
  /** 0..1: when the shard starts to move, as a share of the break. */
  delay: number;
  spin: number;
  tumble: number;
  push: number;
  drop: number;
  ux: number;
  uy: number;
}

function mulberry32(seed: number): () => number {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function clipHalf(poly: Pt[], nx: number, ny: number, d: number): Pt[] {
  const out: Pt[] = [];
  for (let k = 0; k < poly.length; k++) {
    const a = poly[k]!;
    const b = poly[(k + 1) % poly.length]!;
    const da = nx * a[0] + ny * a[1] - d;
    const db = nx * b[0] + ny * b[1] - d;
    if (da <= 0) out.push(a);
    if ((da < 0 && db > 0) || (da > 0 && db < 0)) {
      const t = da / (da - db);
      out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
    }
  }
  return out;
}

/**
 * The fracture of a `w` x `h` pane struck at (`ix`, `iy`): Voronoi cells on
 * sites thick at the strike and thinning outward, with a sparse outer ring so
 * the corners break too. FFX's shards are timed by their x, rightmost first;
 * FFX-2's by their distance from the strike.
 */
export function fracture(w: number, h: number, game: ShatterGame, seed = 20260918): Shard[] {
  const rnd = mulberry32(seed);
  const ix = w * 0.545;
  const iy = h * 0.42;
  const scale = Math.hypot(w, h) / Math.hypot(1920, 1080);
  const sites: Pt[] = [];
  const inner = SHATTER_MAX_SHARDS - 8;
  for (let i = 0; i < inner; i++) {
    const r = (46 + 1520 * Math.pow(rnd(), 1.72)) * scale;
    const a = rnd() * Math.PI * 2;
    sites.push([ix + Math.cos(a) * r, iy + Math.sin(a) * r * 0.74]);
  }
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + 0.3;
    sites.push([ix + Math.cos(a) * 1750 * scale, iy + Math.sin(a) * 1250 * scale]);
  }
  const pad = 120 * scale;
  const shards: Shard[] = [];
  for (let i = 0; i < sites.length; i++) {
    const s = sites[i]!;
    let poly: Pt[] = [[-pad, -pad], [w + pad, -pad], [w + pad, h + pad], [-pad, h + pad]];
    for (let j = 0; j < sites.length && poly.length >= 3; j++) {
      if (i === j) continue;
      const o = sites[j]!;
      const nx = o[0] - s[0];
      const ny = o[1] - s[1];
      poly = clipHalf(poly, nx, ny, nx * ((s[0] + o[0]) / 2) + ny * ((s[1] + o[1]) / 2));
    }
    if (poly.length < 3) continue;
    let cx = 0;
    let cy = 0;
    for (const p of poly) {
      cx += p[0];
      cy += p[1];
    }
    cx /= poly.length;
    cy /= poly.length;
    const dx = cx - ix;
    const dy = cy - iy;
    const d = Math.hypot(dx, dy) || 1;
    // FFX: "the glass that starts moving first is on the most right and the
    // last is the most left" (§1.1 step 3). FFX-2: outward from the strike.
    const delay = game === 'ffx' ? 0.46 * (1 - Math.min(1, Math.max(0, cx / w))) : Math.min(0.4, (d / (1650 * scale)) * 0.4);
    shards.push({
      poly,
      cx,
      cy,
      delay,
      spin: (rnd() - 0.5) * (game === 'ffx' ? 3.2 : 2.1),
      tumble: 2.2 + rnd() * 3.4,
      push: (88 + rnd() * 190) * scale,
      drop: (300 + rnd() * 680) * scale,
      ux: game === 'ffx' ? -1 : dx / d,
      uy: game === 'ffx' ? (rnd() - 0.5) * 0.6 : dy / d,
    });
  }
  return shards;
}

const clamp01 = (x: number): number => (x < 0 ? 0 : x > 1 ? 1 : x);
const ease = (x: number): number => 1 - Math.pow(1 - x, 3);

/** The accent of the lit glass edge: FFX's gold, FFX-2's pyre pink (the `.ig--ffx2` token). */
const EDGE: Readonly<Record<ShatterGame, string>> = { ffx: '240,214,150', ffx2: '246,168,208' };

function tracePoly(ctx: CanvasRenderingContext2D, poly: Pt[]): void {
  ctx.beginPath();
  ctx.moveTo(poly[0]![0], poly[0]![1]);
  for (let i = 1; i < poly.length; i++) ctx.lineTo(poly[i]![0], poly[i]![1]);
  ctx.closePath();
}

/** The shatter as an entry player (`entryOverlay.ts`). */
export function shatterPlayer(game: ShatterGame, w: number, h: number): EntryPlayer {
  const shards = fracture(w, h, game);
  const ix = w * 0.545;
  const iy = h * 0.42;
  const edge = EDGE[game];
  return {
    className: `pf-entry--shatter pf-entry--${game}`,
    introMs: SHATTER_CRACK_MS,
    outMs: SHATTER_BREAK_MS[game],
    intro(ctx, frame, t) {
      ctx.drawImage(frame, 0, 0, w, h);
      const wave = ease(t) * Math.hypot(w, h) * 1.1;
      ctx.lineCap = 'round';
      for (const s of shards) {
        const a = clamp01((wave - Math.hypot(s.cx - ix, s.cy - iy)) / 320);
        if (a <= 0) continue;
        ctx.globalAlpha = a * 0.85;
        ctx.strokeStyle = `rgba(${edge},0.85)`;
        ctx.lineWidth = 1.6;
        tracePoly(ctx, s.poly);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      const flash = Math.max(0, 1 - t * 3.1);
      if (flash > 0.01) {
        const g = ctx.createRadialGradient(ix, iy, 0, ix, iy, 520 * (0.4 + t * 2));
        g.addColorStop(0, `rgba(255,252,240,${0.95 * flash})`);
        g.addColorStop(1, 'rgba(255,252,240,0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
      }
    },
    outro(ctx, frame, t) {
      ctx.clearRect(0, 0, w, h);
      // The black field behind the glass: FFX fades it up into the battle;
      // FFX-2 holds it and cuts (the last frame of the break clears it).
      const black = game === 'ffx' ? 1 - ease(clamp01((t - 0.25) / 0.75)) : t < 1 ? 1 : 0;
      if (black > 0) {
        ctx.fillStyle = `rgba(5,4,10,${black})`;
        ctx.fillRect(0, 0, w, h);
      }
      if (t >= 1) return;
      // The white flash at the break (§1.1 step 4).
      const bloom = Math.max(0, 1 - t * 5.5);
      for (const s of shards) {
        const k = clamp01((t - s.delay) / 0.54);
        if (k >= 1) continue;
        const e = k * k * 0.58 + k * 0.42; // glass accelerates; it does not ease out
        const rot = s.spin * e * 0.9;
        const skew = Math.cos(s.tumble * e) * 0.5 + 0.5; // a spin about the vertical axis, faked
        const sx = 0.28 + 0.72 * skew;
        const ox = s.ux * s.push * e * (game === 'ffx' ? 2.4 : 1);
        const oy = s.uy * s.push * e * 0.7 + s.drop * e * e;
        ctx.save();
        ctx.globalAlpha = k < 0.7 ? 1 : 1 - (k - 0.7) / 0.3;
        ctx.translate(s.cx + ox, s.cy + oy);
        ctx.scale(sx, 1);
        ctx.rotate(rot);
        ctx.translate(-s.cx, -s.cy);
        tracePoly(ctx, s.poly);
        ctx.save();
        ctx.clip();
        ctx.drawImage(frame, 0, 0, w, h);
        ctx.restore();
        ctx.strokeStyle = `rgba(${edge},${0.75 * (1 - k * 0.6)})`;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
      }
      if (bloom > 0.01) {
        const g = ctx.createRadialGradient(ix, iy, 0, ix, iy, Math.hypot(w, h) * 0.8);
        g.addColorStop(0, `rgba(255,250,236,${0.7 * bloom})`);
        g.addColorStop(1, 'rgba(255,250,236,0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
      }
    },
  };
}
