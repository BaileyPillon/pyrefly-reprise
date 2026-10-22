/**
 * Haste, Shell, Protect, Reflect and Dispel, drawn for the demo chapters with the new effects on (motion pass, lane "fx"; `FxSwitch.ts`). Before this, none of the five had an effect id and all
 * five drew the generic tinted bloom (`SpellFxRegistry.ts`).
 *
 * **Both games, one neutral design, each in its own skin (AGENTS.md rule 14).** No official video shows any of the five in either game ([gap] in `docs/handoff/motion-fx-reference.md` sections
 * 2.2 and 3.3), so no shape here is a retail shape and none claims to be: every look below is [ours], built only from what the repo does know: each status's colour chip (Haste a double chevron
 * on green, Protect a shield on blue, Shell a hex shell on purple, Reflect a mirror arc on gold; `research/visual-bible.md` status-icon table, itself our design), and the game's skin
 * (FFX: gold cast ring and round motes; FFX-2: pink cast ring and four-point sparkles). The marks sit at 0.45 s (Dispel 0.35 s), earlier than a retail cast's release (Lulu 2.1 to 2.5 s), so
 * the numerals never wait longer than they do for the bloom.
 *
 * Pure: no `three`, no DOM.
 */

import type { FxDrawList } from './FxDrawList.ts';
import { shockRing, spark, stroke } from './effects-painted-kit.ts';
import { accentOf, castMark, type FxTarget } from './effects-shared.ts';
import { clamp, env, inOutCubic, lerp, outBack, outCubic, outExpo, outQuad, outQuart, parts } from './fxMath.ts';

export const BUFF_MARK = 0.45;
export const DISPEL_MARK = 0.35;
export const BUFF_END = 1.6;

const HASTE = '#7BE87F';
const PROTECT = '#6EA8FF';
const SHELL = '#9A66FF';
const REFLECT = '#F2D24A';
const PALE = '#DDEBFF';
const SLATE = '#9DB0C8';

/** Haste: lines race through the figure, then two chevrons climb it. */
export function haste(o: FxDrawList, t: number, T: FxTarget): void {
  const sc = T.sc;
  const k = T.k;
  const dir = o.dir;
  castMark(o, T, t, 0, 0.55);
  o.add = true;
  o.decal(T.fx, T.fy, 150 * sc, HASTE, 0.5 * env(t, 0.1, 1.3, 0.15, 0.5));
  for (let i = 0; i < 6; i++) {
    const u = (t - 0.1 - i * 0.045) / 0.5;
    if (u <= 0 || u >= 1) continue;
    const y = T.cy + (i - 2.5) * 0.115 * T.h;
    const x0 = dir > 0 ? T.x - 0.4 * T.w : T.x + 1.4 * T.w;
    const x1 = dir > 0 ? T.x + 1.4 * T.w : T.x - 0.4 * T.w;
    const head = lerp(x0, x1, outQuart(u));
    const len = T.w * (1.15 - 0.55 * u);
    const a = Math.sqrt(Math.sin(u * Math.PI));
    stroke(o, HASTE, [head - dir * len, y], [head, y], (11 + (i % 3) * 2) * k, a * 0.9);
    stroke(o, '#FFFFFF', [head - dir * len * 0.6, y], [head, y], (5 + (i % 2)) * k, a);
  }
  // Two chevrons (the chip's double arrow) lift off the figure, pointing the way it is moving.
  for (let j = 0; j < 2; j++) {
    const u = (t - 0.28 - j * 0.12) / 0.7;
    if (u <= 0 || u >= 1) continue;
    const px = T.cx + dir * (T.w * 0.12 + j * 30 * sc);
    const py = T.cy - T.h * 0.1 - outQuad(u) * T.h * 0.3;
    const a = Math.sin(u * Math.PI);
    stroke(o, HASTE, [px - dir * 38 * sc, py - 34 * sc], [px, py], 13 * k, a);
    stroke(o, HASTE, [px - dir * 38 * sc, py + 34 * sc], [px, py], 13 * k, a);
    stroke(o, '#FFFFFF', [px - dir * 24 * sc, py - 21 * sc], [px, py], 5 * k, a);
    stroke(o, '#FFFFFF', [px - dir * 24 * sc, py + 21 * sc], [px, py], 5 * k, a);
  }
  o.bloom('#C8FFC8', T.cx, T.cy, 300 * sc, 0.3, env(t, 0.35, 1.1, 0.15, 0.5));
  o.add = false;
}

/** Protect: a blue dome snaps up round the figure on an overshoot, six facets on its rim, then it dissolves upward. */
export function protect(o: FxDrawList, t: number, T: FxTarget): void {
  const sc = T.sc;
  const k = T.k;
  castMark(o, T, t, 0, 0.55);
  const R = T.h * 0.62 * Math.max(0, outBack((t - 0.1) / 0.3, 1.1));
  const life = env(t, 0.1, 1.45, 0.12, 0.6);
  o.add = true;
  o.decal(T.fx, T.fy, 150 * sc, PROTECT, 0.5 * env(t, 0.1, 1.4, 0.15, 0.5));
  if (R > 2 && life > 0) {
    o.sprite('disc', PROTECT, T.cx, T.cy, R * 2, 0.16 * life);
    o.sprite('glow', '#BFD8FF', T.cx, T.cy, R * 2.3, 0.32 * life);
    o.ring(T.cx, T.cy, R, 4.5 * k, '#E6F0FF', 0.9 * life, 1);
    o.ring(T.cx, T.cy, R * 0.9, 2.4 * k, PROTECT, 0.6 * life, 1);
  }
  o.add = false;
  for (let i = 0; i < 6; i++) {
    const born = 0.16 + i * 0.03;
    const u = outCubic((t - born) / 0.18);
    if (u <= 0 || life <= 0) continue;
    const ang = (i / 6) * Math.PI * 2 - Math.PI / 2;
    const d = R * 0.98;
    o.quad('facet', i % 2 ? '#FFFFFF' : '#CFE2FF', T.cx + Math.cos(ang) * d, T.cy + Math.sin(ang) * d, 20 * sc * u, 52 * sc * u, 0.92 * life, ang + Math.PI / 2);
  }
  o.add = true;
  // The dome dissolves upward in specks.
  parts(o.n(22), 101, 0.8, 1.25, t, (p, age) => {
    const u = age / 0.55;
    if (u > 1) return;
    const ang = -Math.PI * p.a;
    spark(o, { ox: T.cx + Math.cos(ang) * R * 0.9, oy: T.cy + Math.sin(ang) * R * 0.9, ang: -Math.PI / 2, dist: 90 * sc * (0.5 + p.b), life: 0.55, age, thick: 4 * k, col: p.i % 2 ? '#FFFFFF' : PROTECT, ease: outQuad });
  });
  o.add = false;
}

/** Shell: two arcs of violet turn against each other round the figure, specks orbit it, and the arcs settle. */
export function shell(o: FxDrawList, t: number, T: FxTarget): void {
  const sc = T.sc;
  const k = T.k;
  castMark(o, T, t, 0, 0.55);
  const life = env(t, 0.1, 1.45, 0.14, 0.6);
  o.add = true;
  o.decal(T.fx, T.fy, 150 * sc, SHELL, 0.5 * env(t, 0.1, 1.4, 0.15, 0.5));
  if (life > 0) {
    const spin = inOutCubic((t - 0.1) / 1.2) * Math.PI * 1.6;
    const grow = outCubic((t - 0.1) / 0.3);
    for (let j = 0; j < 3; j++) {
      const a0 = spin * 1.3 + (j * Math.PI * 2) / 3;
      o.arc(T.cx, T.cy, T.h * 0.6 * grow, a0, a0 + 1.15, 12 * k, '#C9A8FF', 0.95 * life, 1);
      const b0 = -spin * 0.9 + (j * Math.PI * 2) / 3 + 0.5;
      o.arc(T.cx, T.cy, T.h * 0.48 * grow, b0, b0 + 0.9, 10 * k, SHELL, 0.9 * life, 1);
    }
    o.sprite('glow', SHELL, T.cx, T.cy, T.h * 1.5 * grow, 0.28 * life);
  }
  for (let i = 0; i < 10; i++) {
    const born = 0.2 + i * 0.04;
    const u = (t - born) / 0.9;
    if (u <= 0 || u >= 1) continue;
    const ang = (i / 10) * Math.PI * 2 + outQuad(u) * 4.5;
    const rx = T.w * 0.62 * (1 - 0.15 * u);
    o.sprite(i % 2 ? 'dab' : o.bit, i % 3 === 0 ? '#FFFFFF' : SHELL, T.cx + Math.cos(ang) * rx, T.cy + Math.sin(ang) * T.h * 0.42, (i % 2 ? 14 : o.game === 'ffx2' ? 30 : 16) * sc, Math.sin(u * Math.PI));
  }
  o.add = false;
}

/** Reflect: a gold mirror pane stands up round the figure, a bright diagonal sweeps across it, and glints pop at its corners. */
export function reflect(o: FxDrawList, t: number, T: FxTarget): void {
  const sc = T.sc;
  const k = T.k;
  castMark(o, T, t, 0, 0.55);
  const life = env(t, 0.1, 1.45, 0.14, 0.6);
  const rise = outBack((t - 0.1) / 0.28, 0.9);
  o.add = true;
  o.decal(T.fx, T.fy, 150 * sc, REFLECT, 0.5 * env(t, 0.1, 1.4, 0.15, 0.5));
  if (life > 0 && rise > 0) {
    const pw = T.w * 0.62 * rise;
    const ph = T.h * 0.58 * rise;
    o.sprite('disc', '#F6E08A', T.cx, T.cy, 2 * pw, 0.1 * life);
    o.quad('disc', '#F6E08A', T.cx, T.cy, 2 * pw, 2 * ph, 0.12 * life);
    o.ring(T.cx, T.cy, pw, 4 * k, '#FFF3B8', 0.9 * life, ph / pw);
    // The sweep across the pane.
    const u = (t - 0.2) / 0.38;
    if (u > 0 && u < 1) {
      const e = outCubic(u);
      stroke(o, '#FFFFFF', [T.cx - pw + e * 2 * pw - 70 * sc, T.cy + ph * 0.7 - e * ph * 1.3], [T.cx - pw + e * 2 * pw, T.cy + ph * 0.7 - e * ph * 1.3 - 30 * sc], 16 * k, Math.sin(u * Math.PI));
    }
  }
  for (let i = 0; i < 4; i++) {
    const u = (t - 0.32 - i * 0.05) / 0.3;
    if (u <= 0 || u >= 1) continue;
    const sx = i % 2 ? 1 : -1;
    const sy = i < 2 ? -1 : 1;
    o.sprite('spark4', '#FFFFFF', T.cx + sx * T.w * 0.55, T.cy + sy * T.h * 0.45, 40 * sc * Math.sin(u * Math.PI) + 8 * sc, 0.95);
  }
  o.add = false;
}

/** Dispel: a pale shockwave opens from the figure's middle and the magic on it breaks into shards that scatter. */
export function dispel(o: FxDrawList, t: number, T: FxTarget): void {
  const sc = T.sc;
  const k = T.k;
  castMark(o, T, t, 0, 0.5);
  o.add = true;
  shockRing(o, T.cx, T.cy, t, 0.2, 0.55, 20 * sc, T.h * 1.0, 11 * k, PALE, 0.95, 1);
  shockRing(o, T.cx, T.cy, t, 0.27, 0.6, 14 * sc, T.h * 0.74, 7 * k, SLATE, 0.85, 1);
  shockRing(o, T.fx, T.fy, t, 0.24, 0.6, 30 * sc, 240 * sc, 5 * k, PALE, 0.8);
  const flash = clamp(1 - Math.abs(t - 0.24) / 0.12);
  if (flash > 0) o.sprite('glow', '#FFFFFF', T.cx, T.cy, 380 * sc * outExpo(flash), o.actorCap(0.8) * flash);
  o.add = false;
  parts(o.n(20), 111, 0.24, 0.3, t, (p, age) => {
    const u = age / 0.7;
    if (u > 1) return;
    const ang = p.a * Math.PI * 2;
    const d = (60 + 200 * p.b) * sc * outQuart(u);
    o.sprite('tri', p.i % 3 ? PALE : SLATE, T.cx + Math.cos(ang) * d, T.cy + Math.sin(ang) * d * 0.9 + 140 * sc * u * u, (20 + 24 * p.c) * sc, 0.95 * (1 - u * u), ang + u * 6 * (p.d - 0.5));
  });
  o.add = true;
  parts(o.n(16), 112, 0.26, 0.5, t, (p, age) => {
    spark(o, { ox: T.cx, oy: T.cy, ang: p.a * Math.PI * 2, dist: (100 + 160 * p.b) * sc, life: 0.5, age, thick: 3.6 * k, col: p.i % 2 ? '#FFFFFF' : PALE });
  });
  o.add = false;
}

/** The accent a buff's cast ring wears: the game's (`accentOf`); kept here so a test can read the two skins. */
export const buffSkin = (o: FxDrawList): string => accentOf(o);
