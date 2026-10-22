/**
 * Fire, Blizzard (ice) and Thunder, drawn for the demo chapters with the new effects on (motion pass, lane "fx"; Bailey 2026-10-22: "Fire, Thunder, Blizzard (trails, shockwave rings, sparks with easing)";
 * `FxSwitch.ts`). Each is today's effect (`effects-elements.ts`, Bailey's option B, 2026-09-26) with the new finish and these additions on top: a shockwave ring that bursts at the mark, sparks and
 * flame licks on eased paths drawn as strokes with trails, and (Thunder) the bolt's afterglow.
 *
 * **Game case.** Both games share the three functions (`effects-elements.ts`: two skins by `o.game`); the additions keep the skin (round motes and bar sparks in FFX, four-point sparkles in FFX-2).
 * Neither demo fight's intended line casts them (only a Lulu switched into Chapter I would), and no official footage shows what the spells look like on the target ([gap],
 * `docs/handoff/motion-fx-reference.md` section 2.5), so every addition is [ours]; the clock is today's (marks 0.5, 0.5 and 0.42 s, so a numeral never waits longer than it did).
 *
 * Pure: no `three`, no DOM.
 */

import type { FxDrawList } from './FxDrawList.ts';
import { bolt, fire, ice, thunder } from './effects-elements.ts';
import { pop, shockRing, spark } from './effects-painted-kit.ts';
import type { FxTarget } from './effects-shared.ts';
import { clamp, env, outQuad, parts } from './fxMath.ts';

/** Fire: a heat ring bursts at the mark, flame licks climb on eased paths and embers fly out of the column's foot. */
export function fireNew(o: FxDrawList, t: number, T: FxTarget): void {
  fire(o, t, T);
  const sc = T.sc;
  const k = T.k;
  o.add = true;
  shockRing(o, T.fx, T.fy, t, 0.48, 0.6, 50 * sc, 380 * sc, 5.5 * k, '#FFC070', 0.85);
  shockRing(o, T.fx, T.fy, t, 0.5, 0.45, 30 * sc, 250 * sc, 3.2 * k, '#FFF0C0', 0.8);
  shockRing(o, T.cx, T.cy + T.h * 0.1, t, 0.5, 0.5, 20 * sc, T.h * 0.8, 3 * k, '#FF9A3C', 0.55, 1);
  const flash = pop(t, 0.5, 0.08, 0.22);
  if (flash > 0) o.sprite('glow', '#FFE7A0', T.cx, T.cy + T.h * 0.15, 260 * sc * flash, o.actorCap(0.75) * Math.min(1, flash));
  // Flame licks: strokes climbing the column, fast at first, settling as they rise.
  parts(o.n(30), 121, 0.3, 1.1, t, (p, age) => {
    spark(o, { ox: T.fx + (p.a - 0.5) * 110 * sc, oy: T.fy - 10 * sc, ang: -Math.PI / 2 + (p.b - 0.5) * 0.5, dist: (230 + 220 * p.c) * sc, life: 0.55 + 0.35 * p.d, age, thick: (5 + 5 * p.e) * k, col: p.i % 3 === 0 ? '#FFE7A0' : p.i % 3 === 1 ? '#F2712E' : '#FFB050', ease: outQuad, alpha: 0.9 });
  });
  // Embers thrown out at the mark.
  parts(o.n(26), 122, 0.5, 0.53, t, (p, age) => {
    spark(o, { ox: T.fx, oy: T.cy + T.h * 0.2, ang: -Math.PI * (0.05 + 0.9 * p.a), dist: (170 + 260 * p.b) * sc, life: 0.45 + 0.35 * p.c, age, grav: 650 * k, thick: (3.4 + 2.6 * p.d) * k, col: p.i % 2 ? '#FFB050' : '#FFE7A0' });
  });
  o.add = false;
}

/** Blizzard: a ring of cold at the floor as the crystals grow, a bigger one when they shatter, and the shards' glitter thrown out on eased paths. */
export function iceNew(o: FxDrawList, t: number, T: FxTarget): void {
  ice(o, t, T);
  const sc = T.sc;
  const k = T.k;
  const SHATTER = 1.15;
  o.add = true;
  shockRing(o, T.fx, T.fy, t, 0.28, 0.55, 30 * sc, 240 * sc, 3.6 * k, '#BFEFFF', 0.75);
  shockRing(o, T.fx, T.fy, t, SHATTER - 0.03, 0.62, 60 * sc, 340 * sc, 5 * k, '#E6F8FF', 0.9);
  shockRing(o, T.cx, T.cy, t, SHATTER - 0.03, 0.5, 20 * sc, T.h * 0.85, 3.2 * k, '#FFFFFF', 0.6, 1);
  // Frost climbing off the crystals while they grow.
  parts(o.n(14), 131, 0.3, 0.9, t, (p, age) => {
    spark(o, { ox: T.fx + (p.a - 0.5) * 220 * sc, oy: T.fy - 20 * sc, ang: -Math.PI / 2 + (p.b - 0.5) * 0.3, dist: (90 + 120 * p.c) * sc, life: 0.55, age, thick: 3.6 * k, col: '#CFEFFF', ease: outQuad, alpha: 0.8 });
  });
  // The shatter: glitter thrown out and down.
  parts(o.n(30), 132, SHATTER, SHATTER + 0.04, t, (p, age) => {
    spark(o, { ox: T.fx + (p.a - 0.5) * 180 * sc, oy: T.fy - T.h * 0.5 * p.b, ang: -Math.PI * (0.05 + 0.9 * p.c), dist: (170 + 280 * p.d) * sc, life: 0.45 + 0.3 * p.e, age, grav: 1300 * k, thick: (3.4 + 2.4 * p.b) * k, col: p.i % 2 ? '#FFFFFF' : '#9EE4FF' });
  });
  o.add = false;
}

/** Thunder: a ring on the ground at every strike, the bolt's afterglow fading behind it, and sparks thrown up on eased paths. */
export function thunderNew(o: FxDrawList, t: number, T: FxTarget): void {
  thunder(o, t, T);
  const sc = T.sc;
  const k = T.k;
  const single = o.flash.singleBolt;
  const strikes = single ? [0.42] : [0.42, 0.56, 0.78];
  o.add = true;
  strikes.forEach((s, i) => {
    const last = i === strikes.length - 1;
    const vis = last ? (single ? 0.5 : 0.22) : 0.1;
    shockRing(o, T.fx, T.fy, t, s, 0.42, 40 * sc, (230 - i * 30) * sc, 4 * k, i % 2 ? '#FFFFFF' : '#FFF4B0', 0.9);
    const glow = t - s - vis;
    if (glow > 0 && glow < 0.28) bolt(o, T, T.cx + (i - 1) * 30 * k, -40, T.fx, T.fy - 20 * sc, 31 + i, 5 * sc, 0.38 * (1 - glow / 0.28));
    const f = pop(t, s, 0.05, 0.16);
    if (f > 0) o.sprite('spark4', '#FFFFFF', T.fx, T.fy - 20 * sc, 150 * sc * f, o.actorCap(0.95) * Math.min(1, f));
  });
  parts(o.n(24), 141, 0.42, 0.46, t, (p, age) => {
    spark(o, { ox: T.fx, oy: T.fy - 14 * sc, ang: -Math.PI * (0.06 + 0.88 * p.a), dist: (190 + 280 * p.b) * sc, life: 0.35 + 0.28 * p.c, age, grav: 900 * k, thick: (3 + 2.2 * p.d) * k, col: p.i % 2 ? '#FFF4B0' : '#FFFFFF' });
  });
  const hum = env(t, 0.5, 1.4, 0.1, 0.6);
  if (hum > 0) o.sprite('glow', '#F2D24A', T.cx, T.cy, 300 * sc * clamp(hum + 0.2, 0, 1.1), 0.22 * hum);
  o.add = false;
}
