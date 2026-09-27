/**
 * FF7's materia magic in the Guard Scorpion fight, drawn A3 plus with the
 * Spectacle layers on top (FF7 only; D-260): Bolt (Lightning), Ice, Cure.
 *
 * - **Bolt**: four jagged bolts strike from above the frame; electric arcs
 *   crawl over the target, sparks rain, a gold light pool rings the floor.
 * - **Ice**: faceted crystals grow up round the target's feet and shatter into
 *   shards and frost.
 * - **Cure**: a green-white column of motes rises through the figure, sparkle
 *   stars and a soft ring at the feet.
 *
 * Research: research/ff7-guard-scorpion.md (Bolt and Ice are the party's two
 * attack spells, Cure its heal); the look is ours (no written source describes
 * it). Pure: no `three`, no DOM.
 */

import type { FxDrawList } from '../FxDrawList.ts';
import type { FxTarget } from '../effects-shared.ts';
import { env, outCubic, parts, pulse, rng } from '../fxMath.ts';
import { bolt, dim, haze, pool, shards, sparks, star, streak, withDensity, zig, type Pt } from './ff7FxKit.ts';

/** When each lands, seconds into the effect. */
export const FF7_BOLT_MARK = 0.42;
export const FF7_ICE_MARK = 0.55;
export const FF7_CURE_MARK = 0.5;

export function ff7Bolt(o: FxDrawList, t: number, T: FxTarget): void {
  const k = T.k;
  const top: Pt = [T.cx, T.y + T.h * 0.2];
  withDensity(o, (spectacle) => {
    dim(o, T, (spectacle ? 0.3 : 0.18) * env(t, 0.1, 1.2, 0.1, 0.4));
    o.add = true;
    // The charge: a gold glow gathering above the target.
    o.sprite('glow', '#FFE58A', T.cx, T.y - 40 * k, 220 * k, 0.5 * env(t, 0, 0.45, 0.25, 0.05));
    const strike = env(t, 0.36, 0.8, 0.02, 0.3);
    for (let j = 0; j < (spectacle ? 4 : 3); j++) {
      const flick = 0.55 + 0.45 * Math.abs(Math.sin(t * 60 + j * 1.9));
      const pts = zig([T.cx + (j - 1.5) * 90 * k, -40], [T.cx + (j - 1.5) * 12 * k, top[1]], 10, 26 * k, 700 + j + Math.floor(t * 18));
      bolt(o, pts, 12 * k, '#FFD62A', strike * flick);
      if (spectacle && strike > 0.2 && o.dens > 0.7) {
        for (let b = 3; b < pts.length - 2; b += 4) {
          const q = pts[b]!;
          const r = rng(730 + b + j * 7 + Math.floor(t * 20));
          bolt(o, zig(q, [q[0] + (r() - 0.5) * 220 * k, q[1] + (60 + r() * 120) * k], 6, 22 * k, 740 + b), 4 * k, '#FFF0A0', strike * 0.6);
        }
      }
    }
    star(o, top[0], top[1], 120 * k, '#FFF078', strike, 6, t * 0.6);
    shards(o, top[0], top[1], spectacle ? 16 : 10, 60 * k, 200 * k, '#FFF5A0', strike * 0.9, 760, 0.6 + 0.6 * outCubic((t - 0.4) / 0.3));
    pool(o, T.fx, T.fy, 260 * T.sc * 1.6, '#FFD84A', 0.7 * env(t, 0.38, 1.3, 0.05, 0.5));
    for (let i = 0; i < 3; i++) o.ring(T.fx, T.fy, (170 + i * 80) * T.sc * outCubic((t - 0.4) / 0.4), (4 - i) * k, '#FFE878', (0.7 - i * 0.2) * env(t, 0.4, 1.2, 0.02, 0.5), 0.2);
    if (spectacle) {
      // Arcs crawling over the body, sparks raining, a glow orb, the flare streak.
      const crawl = env(t, 0.45, 1.35, 0.05, 0.3);
      for (let i = 0; i < o.n(6); i++) {
        const r = rng(780 + i + Math.floor(t * 14) * 13);
        const a: Pt = [T.x + T.w * (0.15 + 0.7 * r()), T.y + T.h * (0.25 + 0.5 * r())];
        bolt(o, zig(a, [a[0] + (r() - 0.5) * 160 * k, a[1] + (r() - 0.5) * 60 * k], 7, 14 * k, 790 + i), 3 * k, '#FFF08C', crawl * 0.9);
      }
      sparks(o, top, t, { n: 60, seed: 801, t0: 0.42, t1: 0.5, dir: -Math.PI / 2, spread: 3.4, speed: 620, grav: 1400, col: '#FFEC96' }, k);
      o.sprite('glow', '#FFF0AA', T.cx, T.y + T.h * 0.1, 520 * k, 0.35 * strike);
      streak(o, top[0], top[1], 900 * k, '#FFE070', strike * 0.8);
      haze(o, T.x, T.y - 60 * k, T.x + T.w, T.fy, t, env(t, 0.4, 1.3, 0.1, 0.4));
      o.wash(0, '#FFE9A0', 0.18 * pulse(t, FF7_BOLT_MARK, 0.12));
    }
  });
}

export function ff7Ice(o: FxDrawList, t: number, T: FxTarget): void {
  const k = T.k;
  const sc = T.sc;
  withDensity(o, (spectacle) => {
    dim(o, T, 0.18 * env(t, 0.1, 1.5, 0.1, 0.4));
    o.add = true;
    pool(o, T.fx, T.fy, 230 * sc, '#8FE0FF', 0.6 * env(t, 0.2, 1.7, 0.2, 0.5));
    const r = rng(820);
    const shatter = 1.05;
    const fade = t < shatter ? 1 : Math.max(0, 1 - (t - shatter) / 0.1);
    for (let i = 0; i < 11; i++) {
      const ang = (i / 11) * Math.PI * 2 + r() * 0.4;
      const rad = (i === 0 ? 0 : 50 + 70 * r()) * sc;
      const x = T.fx + Math.cos(ang) * rad;
      const y = T.fy + Math.sin(ang) * rad * 0.3;
      const h = (i === 0 ? 300 : 110 + 150 * r()) * sc * outCubic((t - 0.2 - r() * 0.2) / 0.18);
      const lean = (r() - 0.5) * 0.5 + Math.cos(ang) * 0.25;
      if (h <= 1 || fade <= 0) continue;
      o.add = false;
      o.quad('shard', '#FFFFFF', x + Math.sin(lean) * h * 0.5, y - Math.cos(lean) * h * 0.5, h * 0.22, h, fade * 0.95, lean);
      o.add = true;
      o.quad('glow', '#BDF1FF', x + Math.sin(lean) * h * 0.5, y - Math.cos(lean) * h * 0.5, h * 0.5, h * 1.1, 0.25 * fade, lean);
    }
    star(o, T.cx, T.cy, 110 * k, '#C8F4FF', env(t, FF7_ICE_MARK - 0.02, FF7_ICE_MARK + 0.3, 0.02, 0.25), 4, 0.4);
    const burst = env(t, shatter, shatter + 0.7, 0.01, 0.5);
    shards(o, T.cx, T.cy + T.h * 0.1, spectacle ? 22 : 12, 40 * k, 240 * k, '#E6FBFF', burst, 830, 0.5 + outCubic((t - shatter) / 0.4));
    if (spectacle) {
      parts(o.n(80), 841, 0.2, 1.4, t, (p, age) => {
        const life = 0.8 + 0.6 * p.a;
        if (age > life) return;
        const x = T.fx + (p.b - 0.5) * T.w * 1.2 + Math.sin(age * 3 + p.c * 6) * 20 * k;
        const y = T.fy - age * (80 + 140 * p.d) * k - T.h * 0.2 * p.e;
        o.sprite('mote', '#DDF7FF', x, y, (8 + 10 * p.e) * k, Math.sin((age / life) * Math.PI) * 0.9);
      });
      sparks(o, [T.cx, T.cy], t, { n: 40, seed: 851, t0: shatter, dir: -Math.PI / 2, spread: 3.6, speed: 480, grav: 700, col: '#D8F6FF' }, k);
      streak(o, T.cx, T.cy, 700 * k, '#A8E8FF', env(t, FF7_ICE_MARK, FF7_ICE_MARK + 0.35, 0.02, 0.3));
      o.wash(0, '#DFF6FF', 0.12 * pulse(t, shatter, 0.1));
    }
  });
}

export function ff7Cure(o: FxDrawList, t: number, T: FxTarget): void {
  const k = T.k;
  const sc = T.sc;
  withDensity(o, (spectacle) => {
    o.add = true;
    pool(o, T.fx, T.fy, 200 * sc, '#7EF2B4', 0.6 * env(t, 0.15, 1.6, 0.2, 0.5));
    o.ring(T.fx, T.fy, 120 * sc * outCubic(t / 0.5), 3 * k, '#C8FFE0', 0.8 * env(t, 0.05, 1.3, 0.05, 0.4), 0.28);
    const col = env(t, 0.25, 1.4, 0.2, 0.45);
    o.quad('glow', '#B8FFD8', T.fx, T.fy - T.h * 0.5, T.w * 0.9, T.h * 1.6, 0.4 * col);
    parts(o.n(110), 861, 0.15, 1.3, t, (p, age) => {
      const u = age / 0.95;
      if (u > 1) return;
      const ang = p.a * Math.PI * 2 + age * 4;
      const rad = (50 + 60 * p.b) * sc * (1 - u * 0.4);
      const x = T.fx + Math.cos(ang) * rad;
      const y = T.fy - age * (320 + 220 * p.c) * sc + Math.sin(ang) * rad * 0.28;
      o.sprite('mote', p.i % 3 ? '#C8FFE0' : '#FFFFFF', x, y, 16 * sc * (1 - u * 0.5), Math.sin(u * Math.PI));
    });
    for (let i = 0; i < 5; i++) {
      const r = rng(870 + i);
      star(o, T.x + T.w * r(), T.y + T.h * (0.1 + 0.6 * r()), (18 + 18 * r()) * k, '#DFFFE8', env(t, 0.4 + i * 0.12, 0.8 + i * 0.12, 0.05, 0.2), 4, i);
    }
    if (spectacle) {
      o.bloom('#C8FFE0', T.cx, T.cy, 380 * sc, 0.45, env(t, FF7_CURE_MARK, 1.4, 0.2, 0.5));
      streak(o, T.cx, T.cy, 500 * k, '#B8FFD8', env(t, FF7_CURE_MARK, FF7_CURE_MARK + 0.4, 0.05, 0.3) * 0.7);
    }
  });
}
