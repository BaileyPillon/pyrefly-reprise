/**
 * Seymour Flux's and Mortiorchis's moves that are about life and time rather than a blow, drawn for Chapter I with the new effects on (motion pass, lane "fx", step 3; `FxSwitch.ts`): Full-Life,
 * Banish, Slowga and Mortibsorption. Game case: **FFX only** (Chapter I).
 *
 * **Every shape is [ours]** (no research file or official video shows these moves: `docs/handoff/motion-fx-reference.md` section 2.6). What is sourced is the rule of each move and one line of the
 * presentation notes: Full-Life is a healing spell turned lethal ("the act of healing someone kills them", `research/ffx-seymour-flux.md` section 1138), a revive on a KO'd member and a kill on a Zombie
 * one; Banish removes a summoned aeon from the field (Eject); Slowga is a counter that slows the whole party; Mortibsorption "needs a repeatable kill, visible drain into Seymour, re-form at the
 * lower max HP" (`research/ffx-vs-ffx2-presentation.md` line 147). The Cure column of FFX (the only sourced healing look, `effects-painted-cure.ts`) is the reference for Full-Life's inversion: the
 * same tall column, but falling, in pale gold and white, with dark violet threads winding up it.
 *
 * Pure: no `three`, no DOM.
 */

import type { FxDrawList } from './FxDrawList.ts';
import { SC_MAX, pop, shockRing, spark, trailAlong, type Pt } from './effects-painted-kit.ts';
import type { FxTarget } from './effects-shared.ts';
import { clamp, env, inOutCubic, inQuad, lerp, outCubic, outQuad, outQuart, parts } from './fxMath.ts';

const GOLD = '#FFF2C0';
const WHITE = '#FFFFFF';
const VIOLET = '#7A52D8';
const INK = '#150A26';
const LILAC = '#C7B4FF';
const PYRE = '#BFE8FF';
const SLATE = '#9DB4D6';
const SLATE_DEEP = '#4F5F82';

// ---------------------------------------------------------------- Full-Life

export const FULLLIFE_MARK = 0.45;
export const FULLLIFE_END = 1.9;

/** Full-Life: the Cure column turned over. A pale gold column falls onto the target; at the mark it goes dark, and black motes climb out of the body where the sparkles of a heal would fall. */
export function fulllife(o: FxDrawList, t: number, T: FxTarget): void {
  const sc = Math.min(T.sc, SC_MAX);
  const k = T.k;
  o.quad('dim', '#08040F', T.cx, T.cy, 1700 * k, 1700 * k, 0.5 * Math.min(1, o.dens) * env(t, 0.02, 1.7, 0.35, 0.7));
  o.add = true;
  o.decal(T.fx, T.fy, 130 * sc, GOLD, 0.2 * env(t, 0.1, FULLLIFE_MARK + 0.1, 0.2, 0.2));
  // The column falls: its lower edge runs down the frame to the feet by the mark.
  const fall = outCubic((t - 0.05) / 0.4);
  const top = T.fy - 560 * k;
  const bottom = lerp(top, T.fy, fall);
  const wcol = T.w * 0.5;
  const live = env(t, 0.05, 0.9, 0.08, 0.4);
  if (live > 0 && bottom > top + 4) {
    const mid = (top + bottom) / 2;
    o.quad('glow', GOLD, T.cx, mid, wcol * 1.1, bottom - top, 0.55 * live);
    o.quad('glow', WHITE, T.cx, mid, wcol * 0.26, bottom - top, 0.5 * live);
    for (let i = 0; i < 6; i++) {
      const x = T.cx + (i / 5 - 0.5) * wcol * 0.8;
      o.quad('streak', i % 3 === 0 ? WHITE : GOLD, x, mid, bottom - top, (4 + (i % 2) * 2) * k, 0.5 * live * (0.65 + 0.35 * Math.sin(t * 19 + i * 2)), -Math.PI / 2);
    }
  }
  // Gold sparkles fall with it, then the light is gone.
  parts(o.n(12), 351, 0.08, 0.38, t, (p, age) => {
    const u = age / 0.4;
    if (u > 1) return;
    o.sprite('dab', p.i % 2 ? WHITE : GOLD, T.cx + (p.a - 0.5) * wcol, lerp(T.fy - 520 * k, T.cy - 40 * sc, outQuad(u)), 12 * sc, Math.sin(u * Math.PI));
  });
  const flash = pop(t, FULLLIFE_MARK, 0.1, 0.22);
  if (flash > 0) o.sprite('glow', WHITE, T.cx, T.cy, 220 * sc * flash, o.actorCap(0.55) * Math.min(1, flash));
  shockRing(o, T.fx, T.fy, t, FULLLIFE_MARK, 0.7, 30 * sc, 200 * sc, 4 * k, GOLD, 0.8);
  o.add = false;
  // After the mark: a black bloom on the body and dark threads and motes rising out of it where a heal's sparkles would fall.
  const dark = env(t, FULLLIFE_MARK, 1.5, 0.12, 0.6);
  if (dark > 0) {
    o.sprite('glow', INK, T.cx, T.cy, T.h * 1.3, 0.8 * dark);
    for (let i = 0; i < 4; i++) {
      const x = T.cx + (i - 1.5) * T.w * 0.18;
      const u = clamp((t - FULLLIFE_MARK - i * 0.04) / 0.8);
      const h = T.h * (0.5 + 0.5 * outQuart(u));
      o.quad('streak', i % 2 ? VIOLET : INK, x, T.cy + T.h * 0.2 - h / 2, h, (6 + (i % 2) * 3) * k, 0.8 * dark * (1 - u * 0.5), -Math.PI / 2);
    }
  }
  parts(o.n(22), 352, FULLLIFE_MARK, 1.0, t, (p, age) => {
    const u = age / 0.8;
    if (u > 1) return;
    const x = T.cx + (p.a - 0.5) * T.w * 0.8 + Math.sin(age * 6 + p.i) * 7 * sc;
    const y = T.fy - (0.05 + 0.5 * p.b) * T.h - outQuad(u) * 130 * sc;
    o.sprite(p.i % 2 ? 'mote' : 'dab', p.i % 3 ? INK : VIOLET, x, y, (12 + 12 * p.c) * sc * (1 - 0.4 * u), 0.9 * (1 - u * u));
  });
}

// ---------------------------------------------------------------- Banish

export const BANISH_MARK = 0.45;
export const BANISH_END = 1.9;

/** Banish: a thin gold-white column stands on the target, three rings climb its body, and pyrefly motes drift up and out of the frame. Eject: the figure leaves the field. */
export function banish(o: FxDrawList, t: number, T: FxTarget): void {
  const sc = Math.min(T.sc, SC_MAX);
  const k = T.k;
  o.add = true;
  o.decal(T.fx, T.fy, 140 * sc, GOLD, 0.22 * env(t, 0.05, 1.7, 0.2, 0.8));
  const col = env(t, 0.1, 1.5, 0.22, 0.8);
  if (col > 0) {
    const H = T.h * 1.7 * outCubic((t - 0.1) / 0.5);
    o.quad('glow', GOLD, T.fx, T.fy - H / 2, T.w * 0.5, H, 0.5 * col);
    o.quad('glow', WHITE, T.fx, T.fy - H / 2, T.w * 0.13, H, 0.7 * col);
  }
  // Three rings climb the body, one after another.
  for (let i = 0; i < 3; i++) {
    const u = (t - 0.18 - i * 0.14) / 0.6;
    if (u <= 0 || u >= 1) continue;
    const e = outQuad(u);
    o.ring(T.fx, lerp(T.fy, T.y - 20 * sc, e), T.w * 0.55 * (1 - 0.25 * e), 4 * k, i % 2 ? WHITE : GOLD, 0.9 * Math.sin(u * Math.PI), 0.3);
  }
  const flash = pop(t, BANISH_MARK, 0.12, 0.34);
  if (flash > 0) o.sprite('glow', WHITE, T.cx, T.cy, 210 * sc * flash, o.actorCap(0.5) * Math.min(1, flash));
  // Pyreflies leave the body on slow rising spirals and thin out as they go.
  parts(o.n(26), 361, 0.2, 1.1, t, (p, age) => {
    const u = age / 1.0;
    if (u > 1) return;
    const e = outQuad(u);
    const ang = p.a * Math.PI * 2 + e * 3;
    const x = T.fx + Math.cos(ang) * (30 + 50 * p.b) * sc;
    const y = T.fy - (0.05 + 0.4 * p.c) * T.h - e * (260 + 220 * p.d) * sc;
    const n = o.trail(3);
    if (n > 0) {
      const tr: Pt[] = [];
      for (let i = n; i >= 0; i--) {
        const e2 = outQuad(Math.max(0, u - i * 0.04));
        const a2 = p.a * Math.PI * 2 + e2 * 3;
        tr.push([T.fx + Math.cos(a2) * (30 + 50 * p.b) * sc, T.fy - (0.05 + 0.4 * p.c) * T.h - e2 * (260 + 220 * p.d) * sc]);
      }
      trailAlong(o, tr, PYRE, 3.4 * k, 0.55 * Math.sin(u * Math.PI));
    }
    o.sprite('dab', p.i % 2 ? WHITE : PYRE, x, y, (9 + 8 * p.e) * sc, 0.95 * Math.sin(u * Math.PI));
  });
  o.add = false;
}

// ---------------------------------------------------------------- Slowga

export const SLOWGA_MARK = 0.4;
export const SLOWGA_END = 1.8;

/** Slowga: a blue-grey ring closes round each party member, slowly, against its own turning arcs; sand-like motes drift down as if the air had thickened. */
export function slowga(o: FxDrawList, t: number, T: FxTarget): void {
  const sc = Math.min(T.sc, SC_MAX);
  const k = T.k;
  o.quad('dim', '#070A14', T.cx, T.cy, 1700 * k, 1700 * k, 0.45 * Math.min(1, o.dens) * env(t, 0.03, 1.6, 0.4, 0.7));
  const life = env(t, 0.06, 1.55, 0.2, 0.7);
  o.add = true;
  o.decal(T.fx, T.fy, 140 * sc, SLATE_DEEP, 0.3 * life);
  if (life > 0) {
    const close = inOutCubic((t - 0.06) / 1.1);
    const R = T.h * lerp(0.95, 0.5, close);
    o.ring(T.cx, T.cy, R, 5 * k, SLATE, 0.85 * life, 1);
    o.ring(T.cx, T.cy, R * 0.86, 2.4 * k, '#DCE8FF', 0.6 * life, 1);
    // Two arcs turn against the closing ring, and slower the longer they turn.
    const spin = (1 - Math.pow(1 - clamp(t / 1.5), 2)) * 1.4;
    for (let j = 0; j < 2; j++) {
      const a0 = -spin + j * Math.PI;
      o.arc(T.cx, T.cy, R * 0.72, a0, a0 + 1.05, 10 * k, '#B9CCEB', 0.9 * life, 1);
    }
    o.sprite('glow', SLATE_DEEP, T.cx, T.cy, T.h * 1.3, 0.3 * life);
  }
  const flash = pop(t, SLOWGA_MARK, 0.14, 0.3);
  if (flash > 0) o.sprite('glow', '#DCE8FF', T.cx, T.cy, 260 * sc * flash, o.actorCap(0.55) * Math.min(1, flash));
  shockRing(o, T.fx, T.fy, t, SLOWGA_MARK, 0.9, 30 * sc, 210 * sc, 3.6 * k, SLATE, 0.7);
  // The drifting motes fall on a long ease-in: heavy air.
  parts(o.n(18), 371, 0.15, 1.0, t, (p, age) => {
    const u = age / 1.1;
    if (u > 1) return;
    o.sprite(p.i % 2 ? 'dab' : 'mote', p.i % 3 ? SLATE : WHITE, T.cx + (p.a - 0.5) * T.w * 1.1, T.cy - T.h * 0.5 + p.b * T.h * 0.3 + inQuad(u) * (0.7 + 0.5 * p.c) * T.h, (10 + 9 * p.d) * sc, 0.85 * Math.sin(u * Math.PI));
  });
  o.add = false;
}

// ---------------------------------------------------------------- Mortibsorption

export const DRAIN_MARK = 0.62;
export const DRAIN_END = 2.0;

/**
 * Mortibsorption (a GROUP effect: it is drawn on the caster, Mortiorchis, and lands on the target's centre, Seymour Flux): streams of violet and white motes pour out of the mount and up into the
 * rider along curved paths, the mount dims as it empties and the rider takes a pale violet bloom with a ring where the streams arrive.
 */
export function drain(o: FxDrawList, t: number, T: FxTarget): void {
  const sc = Math.min(T.sc, SC_MAX);
  const k = T.k;
  const P = T.party ?? { x: T.cx, y: T.cy - T.h * 0.3 };
  const src: Pt = [T.cx, T.cy + T.h * 0.12];
  o.add = true;
  const pull = env(t, 0.05, 1.7, 0.25, 0.8);
  o.sprite('glow', VIOLET, src[0], src[1], T.h * 1.2, 0.5 * pull);
  // Seven streams, each a sheet of motes on its own curve from the mount to the rider.
  for (let s = 0; s < 7; s++) {
    const bend = (s % 2 ? 1 : -1) * (50 + 30 * ((s * 3) % 5)) * sc;
    const at = (u: number): Pt => {
      const e = inQuad(clamp(u)) * 0.4 + outQuad(clamp(u)) * 0.6;
      return [lerp(src[0], P.x, e) + Math.sin(e * Math.PI) * bend, lerp(src[1], P.y, e) - Math.sin(e * Math.PI) * 70 * sc];
    };
    const u0 = (t - 0.1 - s * 0.045) / 0.6;
    if (u0 <= 0 || u0 >= 1.25) continue;
    const head = at(u0);
    const n = o.trail(6);
    if (n > 0) {
      const tr: Pt[] = [];
      for (let i = n; i >= 0; i--) tr.push(at(Math.max(0, u0 - i * 0.05)));
      trailAlong(o, tr, s % 2 ? LILAC : VIOLET, 17 * k, 0.9 * clamp(1.25 - u0));
    }
    o.sprite('glow', s % 2 ? WHITE : LILAC, head[0], head[1], 58 * sc, 0.95 * clamp(1.25 - u0));
  }
  parts(o.n(22), 381, 0.15, 0.7, t, (p, age) => {
    const u = age / 0.55;
    if (u > 1) return;
    const e = outQuad(u);
    o.sprite('dab', p.i % 2 ? WHITE : LILAC, lerp(src[0] + (p.a - 0.5) * T.w * 0.5, P.x, e), lerp(src[1] + (p.b - 0.5) * T.h * 0.3, P.y, e), 9 * sc, 0.9 * Math.sin(u * Math.PI));
  });
  // Arrival: the rider blooms, a ring runs out, and the mount's light drains away.
  const arrive = pop(t, DRAIN_MARK, 0.14, 0.4);
  if (arrive > 0) o.sprite('glow', LILAC, P.x, P.y, 240 * sc * arrive, o.actorCap(0.6) * Math.min(1, arrive));
  shockRing(o, P.x, P.y, t, DRAIN_MARK, 0.6, 20 * sc, 190 * sc, 6 * k, WHITE, 0.9, 0.9);
  shockRing(o, P.x, P.y, t, DRAIN_MARK + 0.05, 0.7, 14 * sc, 130 * sc, 4 * k, LILAC, 0.8, 0.9);
  o.add = false;
  o.quad('dim', '#06030C', src[0], src[1], T.w * 3, T.h * 3, 0.3 * Math.min(1, o.dens) * env(t, 0.2, 1.7, 0.35, 0.5));
  parts(o.n(10), 382, DRAIN_MARK, DRAIN_MARK + 0.05, t, (p, age) => {
    o.add = true;
    spark(o, { ox: P.x, oy: P.y, ang: p.a * Math.PI * 2, dist: (60 + 130 * p.b) * sc, life: 0.45, age, thick: 3.6 * k, col: p.i % 2 ? WHITE : LILAC });
    o.add = false;
  });
}
