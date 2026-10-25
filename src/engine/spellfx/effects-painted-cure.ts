/**
 * Cure and Cura, drawn for the demo chapters with the new effects on (motion pass, lane "fx"; Bailey 2026-10-22: "Faithful shape, painted finish"; `FxSwitch.ts`).
 *
 * **FFX only: the column** (Chapter I). Shape, motion, colour and timing are read from Square Enix's own footage and noted in `docs/handoff/motion-fx-reference.md` section 2.1 [sourced:
 * the FINAL FANTASY channel's "Battles" video, 41.0 to 45.0 s, the trailer's original-resolution sample]: a tall narrow column of pale mint-green and white crystalline shards rises from the
 * target's feet with a white splash at its base, grows taller and narrower with fine vertical streaks like a beam, is brightest in the first 0.5 to 1 s, then thins to a faint shimmering
 * sheet with sparkle at its base; a flat ripple ring lies on the ground; a few cyan darts fly sideways from the burst; one column about one character tall at first and up to about two at
 * its peak, about 1.5 s from pop to gone; mint green, white core, cyan accents, no pink or gold; the scene dims to a dusk grade within about 0.5 s while it plays and the characters keep
 * their light. A party-wide heal is one column per character in turn (the spell layer starts one copy per target at once; the staggering is `COLUMN_STAGGER`). What is [ours]: every
 * number (the retail ones are read off a video to about a quarter of a second), the shard count, the dim as a spotlight (an overlay cannot keep the figures lit, so the dusk is a vignette
 * that leaves the target's neighbourhood clear), and the reading of the numeral mark (0.45 s, as today's: the numeral never waits longer than it did).
 *
 * **FFX-2 only: a neutral painted version of today's Cure** (Chapter IV). No official footage shows a White Mage cast ([gap]); the column is FFX's and is NOT carried over. FFX-2 keeps
 * today's mint, white and pink four-point sparkles and gains a ripple ring, eased rising sparkles with brush trails and a sparkle burst at the mark, all [ours].
 *
 * **Items (FFX only)**: the orb toss's burst already throws the sparkles ([M], `research/re-ffx-party-motion-timing.md` section 6), so a Potion or a Phoenix Down lands a smaller column with
 * sparkles falling on the target and no dusk; a Phoenix Down is warm gold and white [ours]. FFX-2's item draws its own spark and burst (`BattlePresenterItem.ts`), not this.
 *
 * Pure: no `three`, no DOM.
 */

import type { FxDrawList } from './FxDrawList.ts';
import { cure } from './effects-light.ts';
import { pop, shockRing, spark, trailAlong } from './effects-painted-kit.ts';
import type { FxTarget } from './effects-shared.ts';
import { clamp, env, lerp, outBack, outCubic, outQuad, parts, rng } from './fxMath.ts';

/** When the numeral lands, as today's Cure (seconds into the effect). */
export const CURE_MARK = 0.45;
/** How long the column lives, to the last sparkle at its base. */
export const CURE_END = 2.0;
/**
 * FFX: a party-wide heal draws one column per character IN TURN, about a second apart in the footage (V2 41 to 45 s). The layer staggers the copies by this much per target after the first;
 * 0.18 s [ours] keeps the third target's mark (0.45 + 0.36 s) inside the numeral's 0.9 s wait, so a Cura never slows the fight.
 */
export const COLUMN_STAGGER = 0.18;

const MINT = '#8FF5C4';
const WHITE = '#FFFFFF';
const CYAN = '#8FF3FF';
const GOLD = '#FFE9A8';
const AMBER = '#FFC873';

/** The Cure column (FFX), or its small item form (variant `potion` / `phoenix`). */
export function cureColumn(o: FxDrawList, t: number, T: FxTarget): void {
  const sc = T.sc;
  const k = T.k;
  const item = o.variant === 'potion' || o.variant === 'phoenix';
  const warm = o.variant === 'phoenix';
  const body = warm ? GOLD : MINT;
  const accent = warm ? AMBER : CYAN;
  const hs = item ? 0.6 : 1;
  const intensity = env(t, 0.12, 1.65, 0.16, 0.95) * (t < 0.95 ? 1 : 0.6);

  // The dusk: a vignette that leaves the target's neighbourhood clear. Slow, no flicker.
  if (!item) o.quad('dim', '#07101C', T.cx, T.cy, 2600 * k, 2600 * k, 0.3 * Math.min(1, o.dens) * env(t, 0.02, 1.75, 0.4, 0.55));

  o.add = true;
  o.decal(T.fx, T.fy, 120 * sc, body, 0.26 * env(t, 0.1, 1.7, 0.2, 0.7));
  shockRing(o, T.fx, T.fy, t, 0.1, 0.95, 36 * sc, 190 * sc * hs, 3.6 * k, body, 0.8);
  shockRing(o, T.fx, T.fy, t, 0.34, 0.8, 30 * sc, 130 * sc * hs, 2.6 * k, WHITE, 0.55);

  // The white splash at the base, popping and settling.
  const splash = pop(t, 0.1, 0.16, 0.34);
  if (splash > 0) o.sprite('glow', WHITE, T.fx, T.fy - 14 * sc, 150 * sc * splash, o.actorCap(0.7) * Math.min(1, splash));

  // The column: a tall narrow glow growing from one character tall to two, narrowing as it thins, with a white core.
  const H = T.h * hs * (1 + (item ? 0.5 : 1) * outCubic((t - 0.12) / 0.5));
  const wcol = T.w * (item ? 0.36 : 0.46) * (1 - 0.42 * clamp((t - 0.5) / 1.0));
  if (intensity > 0) {
    o.quad('glow', body, T.fx, T.fy - H / 2, wcol * 1.15, H * 1.08, 0.62 * intensity);
    o.quad('glow', WHITE, T.fx, T.fy - H * 0.5, wcol * 0.26, H, 0.4 * intensity);
    // Fine vertical streaks, like the lines in a beam.
    for (let i = 0; i < 7; i++) {
      const x = T.fx + (i / 6 - 0.5) * wcol * 0.9;
      const hh = H * (0.68 + 0.32 * ((i * 0.37) % 1));
      const flick = 0.65 + 0.35 * Math.sin(t * 17 + i * 2.1);
      o.quad('streak', i % 3 === 0 ? WHITE : body, x, T.fy - hh / 2, hh, (4 + (i % 2) * 2.5) * k, 0.55 * intensity * flick, -Math.PI / 2);
    }
  }

  // Cyan darts flung sideways from the burst, eased out.
  const r = rng(77);
  for (let i = 0; i < (item ? 3 : 6); i++) {
    const right = i % 2 === 0;
    const ang = right ? -0.25 - r() * 0.4 : Math.PI + 0.25 + r() * 0.4;
    spark(o, { ox: T.fx, oy: T.fy - 16 * sc, ang, dist: (140 + 110 * r()) * sc, life: 0.38, age: t - 0.18 - i * 0.03, thick: 4.4 * k, col: accent, alpha: 0.95 });
  }

  // Sparkle dust at the base, after the peak (and, for an item, sparkles falling on the target).
  parts(o.n(item ? 26 : 34), 83, item ? 0.0 : 0.5, item ? 0.55 : 1.4, t, (p, age) => {
    const u = age / 0.85;
    if (u > 1) return;
    const x = T.fx + (p.a - 0.5) * T.w * 0.7;
    const y = item ? lerp(T.y - 30 * sc, T.cy + 20 * sc, outQuad(u)) : T.fy - 10 * sc - 90 * sc * outQuad(u) * (0.4 + p.b);
    const a = Math.sin(u * Math.PI);
    if (item) spark(o, { ox: x, oy: T.y - 40 * sc, ang: Math.PI / 2, dist: (T.cy - T.y + 60 * sc) * (0.7 + 0.5 * p.b), life: 0.7, age: age - 0.02, thick: 3.2 * k, col: p.i % 3 === 0 ? WHITE : body, alpha: 0.9, ease: outQuad });
    else o.sprite(o.bit, p.i % 3 === 0 ? WHITE : body, x, y, 16 * sc * (1 - 0.35 * u), a * 0.95);
  });
  // The crystalline shards: tall thin facets climbing the column, lighter on one side, drawn over the glow (normal blend) so they read as solid crystal.
  o.add = false;
  parts(o.n(item ? 10 : 26), 82, 0.1, 0.75, t, (p, age) => {
    const u = age / 0.9;
    if (u > 1) return;
    const hgt = (62 + 120 * p.c) * sc * (item ? 0.6 : 1);
    const x = T.fx + (p.a - 0.5) * wcol * 0.8;
    const y = T.fy - (0.05 + 0.3 * p.b) * T.h * hs - outQuad(u) * (0.5 + 0.8 * p.d) * T.h * hs;
    o.quad('facet', p.i % 3 === 0 ? WHITE : p.i % 3 === 1 ? body : accent, x, y, hgt * 0.24, hgt, Math.pow(Math.sin(u * Math.PI), 0.7) * 0.95, (p.e - 0.5) * 0.25);
  });
  o.add = true;
  if (warm) {
    parts(o.n(14), 84, 0.2, 0.7, t, (p, age) => {
      const u = age / 1.0;
      if (u > 1) return;
      o.sprite('dab', AMBER, T.fx + (p.a - 0.5) * T.w * 0.6, T.fy - (40 + 200 * outQuad(u)) * sc, 14 * sc, Math.sin(u * Math.PI) * 0.9);
    });
  }
  o.bloom(warm ? '#FFF0C8' : '#B4FFD8', T.cx, T.cy, 320 * sc * hs, 0.2, env(t, 0.4, 1.4, 0.2, 0.5));
  o.add = false;
}

/** FFX-2: today's Cure, painted, with a ripple ring, eased rising sparkles on brush trails and a sparkle burst at the mark [ours; no official footage of a White Mage cast]. */
export function cureWhiteMage(o: FxDrawList, t: number, T: FxTarget): void {
  cure(o, t, T);
  const sc = T.sc;
  const k = T.k;
  o.add = true;
  shockRing(o, T.fx, T.fy, t, 0.12, 0.9, 40 * sc, 175 * sc, 3.4 * k, '#B8FFD8', 0.75);
  shockRing(o, T.fx, T.fy, t, 0.36, 0.75, 30 * sc, 120 * sc, 2.4 * k, '#F7B6D9', 0.55);
  // Sparkles climbing on eased spirals, each with a short brush trail behind it.
  parts(o.n(14), 91, 0.25, 1.0, t, (p, age) => {
    const u = age / 1.0;
    if (u > 1) return;
    const at = (a: number): readonly [number, number] => {
      const e = outQuad(a);
      const ang = p.a * Math.PI * 2 + e * 5;
      const rad = (60 + 40 * p.b) * sc * (1 - e * 0.35);
      return [T.fx + Math.cos(ang) * rad, T.fy - e * (260 + 160 * p.c) * sc + Math.sin(ang) * rad * 0.28];
    };
    const pts: Array<readonly [number, number]> = [];
    const n = o.trail(4);
    for (let i = n; i >= 0; i--) pts.push(at(Math.max(0, u - i * 0.035)));
    if (n > 0) trailAlong(o, pts, p.i % 2 ? '#FFFFFF' : '#B8FFD8', 5 * k, 0.8 * Math.sin(u * Math.PI));
    const head = at(u);
    o.sprite('spark4', '#FFFFFF', head[0], head[1], 30 * sc * (1 - 0.3 * u), Math.sin(u * Math.PI));
  });
  // The burst of four-point sparkles at the mark.
  const burst = pop(t, CURE_MARK, 0.14, 0.3);
  if (burst > 0) {
    for (let i = 0; i < 6; i++) {
      const ang = (i / 6) * Math.PI * 2 + 0.3;
      const d = (30 + 70 * outBack((t - CURE_MARK) / 0.3)) * sc;
      o.sprite('spark4', i % 2 ? '#FFD6EC' : '#FFFFFF', T.cx + Math.cos(ang) * d, T.cy + Math.sin(ang) * d * 0.8, 34 * sc * burst, 0.9 * Math.min(1, burst));
    }
  }
  o.add = false;
}
