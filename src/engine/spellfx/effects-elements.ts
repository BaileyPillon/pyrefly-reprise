/**
 * Option B's four black-magic elements, as mocked (fx-b.js; Bailey picked B on
 * 2026-09-26): Fire a column rising from a scorched ground mark, Ice crystals
 * growing from the floor, Thunder one vertical bolt with a hard flash, Water a
 * ring and a sphere. Game case: both; the particle sprite and the cast mark
 * follow the game (`FxDrawList.bit`, `castMark`). The looks are ours: no source
 * in research/ describes the retail spell animations.
 */

import type { FxDrawList } from './FxDrawList.ts';
import { castMark, type FxTarget } from './effects-shared.ts';
import { clamp, env, outCubic, parts, pulse, rng } from './fxMath.ts';

export function fire(o: FxDrawList, t: number, T: FxTarget): void {
  const sc = T.sc;
  castMark(o, T, t, 0, 0.7);
  o.decal(T.fx, T.fy, 170 * sc, '#F2712E', 0.6 * env(t, 0.25, 1.75, 0.15, 0.5));
  o.ring(T.fx, T.fy, (60 + 260 * outCubic((t - 0.5) / 0.6)) * sc, 3 * T.k, '#FFC070', 0.8 * env(t, 0.5, 1.1, 0.02, 0.5));
  o.add = true;
  parts(o.n(190), 11, 0.28, 1.2, t, (p, age) => {
    const life = 0.45 + 0.45 * p.a;
    const u = age / life;
    if (u > 1) return;
    const x = T.fx + (p.b - 0.5) * 90 * sc * (1 - u * 0.6) + Math.sin(age * 9 + p.c * 6) * 14 * sc;
    const y = T.fy - 10 * sc - age * (520 + 420 * p.d) * sc * (1 + age);
    const size = (46 + 56 * p.e) * sc * (u < 0.25 ? 0.4 + u * 2.4 : 1 - (u - 0.25) * 0.8);
    const col = u < 0.22 ? '#FFE7A0' : u < 0.55 ? '#F2712E' : '#C0301A';
    o.sprite('glow', col, x, y, size, (1 - u) * 0.85);
  });
  parts(o.n(60), 12, 0.5, 0.62, t, (p, age) => {
    if (age > 1) return;
    const ang = -Math.PI * (0.1 + 0.8 * p.a);
    const sp = (300 + 500 * p.b) * sc;
    const x = T.fx + Math.cos(ang) * sp * age;
    const y = T.cy + 60 * sc + Math.sin(ang) * sp * age + 700 * sc * age * age;
    o.sprite(o.bit, '#FFB050', x, y, (o.game === 'ffx2' ? 26 : 14) * sc, 1 - age, age * 4);
  });
  o.sprite('glow', '#FF9A3C', T.cx, T.cy + T.h * 0.15, 380 * sc, 0.55 * env(t, 0.4, 1.4, 0.15, 0.6));
  o.add = false;
  parts(o.n(26), 13, 0.7, 1.4, t, (p, age) => {
    const u = age / 0.9;
    if (u > 1) return;
    o.sprite('glow', '#1A0C0A', T.fx + (p.a - 0.5) * 140 * sc, T.cy - 60 * sc - age * 260 * sc, (90 + 60 * p.b) * sc * (0.6 + u), 0.35 * (1 - u));
  });
  o.wash(0, '#FFB070', 0.22 * pulse(t, 0.5, 0.18));
}

interface Shard {
  x: number;
  y: number;
  h: number;
  lean: number;
  born: number;
}

const SHATTER = 1.15;

export function ice(o: FxDrawList, t: number, T: FxTarget): void {
  const sc = T.sc;
  castMark(o, T, t, 0, 0.7);
  o.decal(T.fx, T.fy, 190 * sc, '#6EC8F0', 0.55 * env(t, 0.25, 1.85, 0.2, 0.5));
  const r = rng(21);
  const shards: Shard[] = [];
  const count = o.dens < 1 ? 9 : 12;
  for (let i = 0; i < count; i++) {
    const ang = (i / count) * Math.PI * 2 + r() * 0.4;
    const rad = i === 0 ? 0 : (60 + 70 * r()) * sc;
    shards.push({ x: T.fx + Math.cos(ang) * rad, y: T.fy + Math.sin(ang) * rad * 0.28, h: (i === 0 ? 300 : 110 + 140 * r()) * sc, lean: (r() - 0.5) * 0.5 + Math.cos(ang) * 0.25, born: 0.3 + r() * 0.2 });
  }
  shards.sort((a, b) => a.y - b.y);
  const fade = clamp(1 - (t - SHATTER) / 0.08);
  for (const s of shards) {
    const g = outCubic((t - s.born) / 0.16);
    if (g <= 0 || fade <= 0) continue;
    const h = s.h * g;
    const tx = s.x + Math.sin(s.lean) * h;
    const ty = s.y - Math.cos(s.lean) * h;
    o.add = false;
    o.quad('shard', '#FFFFFF', (s.x + tx) / 2, (s.y + ty) / 2, s.h * 0.2, h, fade, s.lean);
    o.add = true;
    o.sprite(o.bit, '#BFEFFF', tx, ty, (o.game === 'ffx2' ? 40 : 26) * sc, 0.8 * fade);
  }
  o.add = true;
  parts(o.n(90), 22, SHATTER, SHATTER + 0.05, t, (p, age) => {
    if (age > 0.75 || !shards.length) return;
    const s = shards[p.i % shards.length]!;
    const ang = -Math.PI * p.a;
    const sp = (250 + 550 * p.b) * sc;
    const x = s.x + Math.cos(ang) * sp * age;
    const y = s.y - s.h * p.c + Math.sin(ang) * sp * age + 1400 * sc * age * age;
    const z = (6 + 12 * p.e) * sc;
    o.sprite('tri', p.e > 0.5 ? '#FFFFFF' : '#9EE4FF', x, y, z * 2, 1 - age / 0.75, age * 12 * (p.d - 0.5));
  });
  parts(o.n(30), 23, 0.35, 1.6, t, (p, age) => {
    const u = age / 1.2;
    if (u > 1) return;
    o.sprite('glow', '#CFEFFF', T.fx + (p.a - 0.5) * 300 * sc + age * 40 * sc, T.fy - 30 * sc - age * 60 * sc, (120 + 80 * p.b) * sc, 0.18 * Math.sin(u * Math.PI));
  });
  o.add = false;
  o.wash(0, '#E6F8FF', 0.2 * pulse(t, SHATTER, 0.15));
}

/** One jagged bolt from (x0, y0) to (x1, y1) with a few forks, as the mock's `bolt`. */
function bolt(o: FxDrawList, T: FxTarget, x0: number, y0: number, x1: number, y1: number, seed: number, width: number, alpha: number): void {
  const r = rng(seed);
  const k = T.k;
  const pts: Array<[number, number]> = [[x0, y0]];
  const segs = 14;
  for (let i = 1; i < segs; i++) {
    const u = i / segs;
    pts.push([x0 + (x1 - x0) * u + (r() - 0.5) * 70 * k, y0 + (y1 - y0) * u + (r() - 0.5) * 20 * k]);
  }
  pts.push([x1, y1]);
  const paths = [pts];
  for (let b = 0; b < 3; b++) {
    const [bx, by] = pts[3 + Math.floor(r() * 8)]!;
    const dir = r() < 0.5 ? -1 : 1;
    const br: Array<[number, number]> = [[bx, by]];
    for (let j = 1; j < 6; j++) br.push([bx + dir * j * (20 + r() * 25) * k, by + j * (18 + r() * 22) * k]);
    paths.push(br);
  }
  for (const [w, col, a] of [[width * 8, '#F2D24A', 0.14], [width * 3, '#FFE98A', 0.4], [width, '#FFFFFF', 1]] as const) {
    paths.forEach((p, i) => o.path(p, i ? w * 0.45 : w, col, a * alpha));
  }
}

export function thunder(o: FxDrawList, t: number, T: FxTarget): void {
  const sc = T.sc;
  const k = T.k;
  castMark(o, T, t, 0, 0.6);
  const single = o.flash.singleBolt;
  const strikes = single ? [0.42] : [0.42, 0.56, 0.78];
  o.add = true;
  o.decal(T.fx, T.fy, 220 * sc, '#F2D24A', 0.7 * env(t, 0.42, 1.6, 0.02, 0.8));
  strikes.forEach((s, i) => {
    const last = i === strikes.length - 1;
    const vis = last ? (single ? 0.5 : 0.22) : 0.1;
    if (t < s || t > s + vis) return;
    const a = last ? 1 - (t - s) / vis : 1;
    bolt(o, T, T.cx + (i - 1) * 30 * k, -40, T.fx, T.fy - 20 * sc, 31 + i, 5 * sc, a);
    o.wash(i, '#FFFFFF', 0.5 * pulse(t, s, 0.07));
  });
  parts(o.n(50), 32, 0.42, 0.9, t, (p, age) => {
    if (age > 0.35) return;
    const ang = -Math.PI * p.a;
    const sp = (400 + 600 * p.b) * sc;
    const x = T.fx + Math.cos(ang) * sp * age;
    const y = T.fy - 10 * k + Math.sin(ang) * sp * age * 0.6 + 900 * k * age * age;
    o.bar(x, y, x - Math.cos(ang) * 16 * k, y - Math.sin(ang) * 10 * k, 2 * k, '#FFF4B0', 1 - age / 0.35);
  });
  // Arcs crawling over the target after the strike.
  for (let j = 0; j < o.n(6); j++) {
    const tk = 0.6 + j * 0.12;
    if (t < tk || t > tk + 0.09) continue;
    const r = rng(40 + j);
    const x = T.cx + (r() - 0.5) * T.w * 0.8;
    const y = T.cy + (r() - 0.5) * T.h * 0.7;
    const pts: Array<[number, number]> = [[x, y]];
    for (let i = 1; i < 5; i++) pts.push([x + i * 14 * k * (r() - 0.3), y + (r() - 0.5) * 30 * k]);
    o.path(pts, 2 * k, '#FFF4B0', 0.9);
  }
  o.sprite('glow', '#FFF2A0', T.cx, T.cy, 420 * sc, o.actorCap(0.6) * env(t, 0.42, 1.2, 0.02, 0.6));
  o.add = false;
}

export function water(o: FxDrawList, t: number, T: FxTarget): void {
  const sc = T.sc;
  castMark(o, T, t, 0, 0.7);
  o.decal(T.fx, T.fy, 180 * sc, '#3A8FD0', 0.6 * env(t, 0.3, 1.8, 0.2, 0.5));
  [0.35, 0.52, 0.7].forEach((s) => o.ring(T.fx, T.fy, (40 + 260 * outCubic((t - s) / 0.9)) * sc, 3 * T.k, '#8FD8FF', 0.8 * env(t, s, s + 0.9, 0.02, 0.7)));
  o.add = true;
  // The orb over the target, then its burst.
  const orb = env(t, 0.3, 0.8, 0.15, 0.05);
  const R = (40 + 110 * outCubic((t - 0.3) / 0.45)) * sc;
  if (orb > 0) o.sprite('orb', '#FFFFFF', T.cx, T.cy, R * 2, orb);
  parts(o.n(130), 41, 0.38, 0.62, t, (p, age) => {
    if (age > 1.1) return;
    const ang = p.a * Math.PI * 2;
    const rx = 110 * sc * (1 + age * 0.9);
    const x = T.fx + Math.cos(ang) * rx;
    const y = T.fy + Math.sin(ang) * rx * 0.28 - (700 + 400 * p.b) * sc * age + 1900 * sc * age * age;
    o.sprite('glow', '#5AB0F0', x, y, (26 + 20 * p.c) * sc, 0.8 * (1 - age / 1.1));
    o.sprite(o.bit, '#DDF4FF', x, y, (o.game === 'ffx2' ? 18 : 8) * sc, 1 - age / 1.1);
  });
  parts(o.n(70), 42, 0.8, 0.84, t, (p, age) => {
    if (age > 0.8) return;
    const ang = p.a * Math.PI * 2;
    const sp = (300 + 500 * p.b) * sc;
    o.sprite('glow', '#8FD8FF', T.cx + Math.cos(ang) * sp * age, T.cy + Math.sin(ang) * sp * age + 900 * sc * age * age, 22 * sc, 1 - age / 0.8);
  });
  o.add = false;
  o.wash(0, '#CFEFFF', 0.18 * pulse(t, 0.8, 0.15));
}
