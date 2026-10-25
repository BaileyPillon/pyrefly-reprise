/**
 * Seymour Flux's and Mortiorchis's attacks that hit, drawn for Chapter I with the new effects on (motion pass, lane "fx", step 3; Bailey 2026-10-22: "the bosses' attacks"; `FxSwitch.ts`):
 * Lance of Atrophy, Cross Cleave, Total Annihilation and Flare. Game case: **FFX only** (Chapter I; FFX-2's Bahamut has its own, `effects-painted-bahamut.ts`).
 *
 * **Plain statement: every shape here is [ours].** No research file and no official video shows any of these moves (`docs/handoff/motion-fx-reference.md` section 2.6, every row [gap]). What the
 * sources DO give, and what the drawing keeps to: who is hit and how often (Lance: one random character, one hit; Cross Cleave: the whole party, one hit each; Total Annihilation: the whole
 * party, FIVE separate hits, magic, non-elemental; Flare: Self, or a random party member when Seymour holds Reflect; `src/data/ffx/enemies/seymour-flux-abilities.ts`), the dark undead tone of
 * the fight (Seymour "dissolves into pyreflies"; the Zombie status of the Lance), and the pace (the marks are 0.26 to 1.02 s, the numeral never waits past 0.9 s from the previous one).
 * The names suggest a thrust ("Lance"), a cutting cross ("Cross Cleave"), a barrage ("Total Annihilation") and a blast ("Flare"); that is an inference from the names, not a source.
 *
 * Pure: no `three`, no DOM.
 */

import type { FxDrawList } from './FxDrawList.ts';
import { SC_MAX, pop, shockRing, spark, stroke, trailAlong, type Pt } from './effects-painted-kit.ts';
import type { FxTarget } from './effects-shared.ts';
import { clamp, env, inQuad, lerp, outCubic, outExpo, outQuad, outQuart, parts } from './fxMath.ts';

const VIOLET = '#7A52D8';
const DEEP = '#2A1458';
const LILAC = '#C7B4FF';
const ZOMBIE = '#8FA676';
const ZOMBIE_PALE = '#CFE0A8';
const WHITE = '#FFFFFF';

// ---------------------------------------------------------------- Lance of Atrophy

export const ATROPHY_MARK = 0.32;
export const ATROPHY_END = 1.7;

/** Lance of Atrophy: a long violet lance flies in from the attacker's side, strikes with a sickly flash, and the target's body wilts (grey-green motes sink off it). One hit, Zombie. */
export function atrophy(o: FxDrawList, t: number, T: FxTarget): void {
  const sc = Math.min(T.sc, SC_MAX);
  const k = T.k;
  const dir = o.dir;
  const hit: Pt = [T.cx, T.cy];
  const far: Pt = [T.cx - dir * 620 * k, T.cy - 200 * k];
  // The dusk of a life being drawn out: a dim vignette that leaves the target clear.
  o.dim('#070B05', T.cx, T.cy, 1700 * k, 1700 * k, 0.55 * Math.min(1, o.dens) * env(t, 0.05, 1.5, 0.25, 0.7));
  o.add = true;
  o.decal(T.fx, T.fy, 130 * sc, ZOMBIE, 0.2 * env(t, 0.28, 1.6, 0.15, 0.9));
  // The lance: a head racing in on an in-quad (it speeds up), a long body behind it, a short brush trail.
  const flight = clamp(t / 0.3);
  if (t < 0.34) {
    const pos = (u: number): Pt => [lerp(far[0], hit[0], inQuad(u)), lerp(far[1], hit[1], inQuad(u))];
    const head = pos(flight);
    const tail = pos(Math.max(0, flight - 0.34));
    const a = clamp((0.34 - t) / 0.06);
    o.add = false;
    o.bar(tail[0], tail[1], head[0], head[1], 30 * k, DEEP, 0.92 * a); // the dark body of the lance, solid against a bright room
    o.add = true;
    o.bar(tail[0], tail[1], head[0], head[1], 15 * k, VIOLET, 0.95 * a);
    const core = pos(Math.max(0, flight - 0.14));
    o.bar(core[0], core[1], head[0], head[1], 6 * k, WHITE, a);
    const n = o.trail(5);
    if (n > 0) {
      const pts: Pt[] = [];
      for (let i = n; i >= 0; i--) pts.push(pos(Math.max(0, flight - i * 0.05)));
      trailAlong(o, pts, LILAC, 9 * k, 0.7 * a);
    }
    o.sprite('glow', LILAC, head[0], head[1], 70 * sc, 0.85 * a);
  }
  // Contact: a sickly green-white flash and ring, a few cold shards.
  const flash = pop(t, ATROPHY_MARK - 0.02, 0.14, 0.34);
  if (flash > 0) o.sprite('glow', ZOMBIE_PALE, T.cx, T.cy, 220 * sc * flash, o.actorCap(0.55) * Math.min(1, flash));
  shockRing(o, T.cx, T.cy, t, ATROPHY_MARK, 0.5, 20 * sc, T.h * 0.55, 6 * k, ZOMBIE_PALE, 0.9, 0.9);
  shockRing(o, T.fx, T.fy, t, ATROPHY_MARK + 0.04, 0.6, 30 * sc, 190 * sc, 3.6 * k, LILAC, 0.7);
  parts(o.n(14), 301, ATROPHY_MARK, ATROPHY_MARK + 0.04, t, (p, age) => {
    spark(o, { ox: T.cx, oy: T.cy, ang: (p.a - 0.5) * 2.4 + (dir > 0 ? 0 : Math.PI), dist: (80 + 200 * p.b) * sc, life: 0.4, age, grav: 340 * k, thick: 4 * k, col: p.i % 2 ? WHITE : LILAC });
  });
  o.add = false;
  // The wilting: dull motes come off the body and sink, shrinking, each on an eased path with a little sway.
  parts(o.n(22), 302, ATROPHY_MARK + 0.02, 1.1, t, (p, age) => {
    const u = age / 0.7;
    if (u > 1) return;
    const x = T.cx + (p.a - 0.5) * T.w * 0.7 + Math.sin(age * 5 + p.i) * 9 * sc;
    const y = T.cy - T.h * 0.3 + p.b * T.h * 0.5 + outQuad(u) * 120 * sc;
    o.sprite(p.i % 3 ? 'mote' : 'dab', p.i % 2 ? ZOMBIE : '#5C7048', x, y, (13 + 12 * p.c) * sc * (1 - 0.55 * u), 0.85 * (1 - u * u));
  });
}

// ---------------------------------------------------------------- Cross Cleave

export const CLEAVE_MARK = 0.34;
export const CLEAVE_END = 1.4;
/** Each later target is struck this much after the one before: a stroke across the whole party. */
export const CLEAVE_STAGGER = 0.07;

/** Cross Cleave: two long cuts, one after the other, make a cross over the target; a shock line runs along the floor and the cross glows and fades. One hit on each of the party. */
export function cleave(o: FxDrawList, t: number, T: FxTarget): void {
  const sc = Math.min(T.sc, SC_MAX);
  const k = T.k;
  const dir = o.dir;
  const reach = Math.max(T.h * 0.62, 150 * sc);
  const cutA = (u: number): { a: Pt; b: Pt } => ({ a: [T.cx - dir * reach * 0.8, T.cy - reach], b: [lerp(T.cx - dir * reach * 0.8, T.cx + dir * reach * 0.8, outExpo(u)), lerp(T.cy - reach, T.cy + reach, outExpo(u))] });
  const cutB = (u: number): { a: Pt; b: Pt } => ({ a: [T.cx + dir * reach * 0.8, T.cy - reach], b: [lerp(T.cx + dir * reach * 0.8, T.cx - dir * reach * 0.8, outExpo(u)), lerp(T.cy - reach, T.cy + reach, outExpo(u))] });
  o.add = true;
  o.decal(T.cx, T.cy, reach * 0.9, DEEP, 0.4 * env(t, 0.12, 1.3, 0.1, 0.7), 1);
  for (const [i, cut, t0] of [[0, cutA, 0.14], [1, cutB, 0.24]] as const) {
    const u = clamp((t - t0) / 0.1);
    if (u <= 0) continue;
    const { a, b } = cut(u);
    const hold = env(t, t0, 1.2, 0.01, 0.8);
    stroke(o, VIOLET, a, b, 40 * k, 0.8 * hold);
    stroke(o, LILAC, a, b, 22 * k, 0.9 * hold);
    stroke(o, WHITE, a, b, 8 * k, hold);
    o.sprite('glow', WHITE, b[0], b[1], 90 * sc * (1 - u * 0.4), 0.7 * clamp((0.5 - (t - t0)) / 0.5) * (i ? 1 : 0.8));
  }
  // The crossing flashes when the second cut lands.
  const cross = pop(t, CLEAVE_MARK - 0.02, 0.12, 0.32);
  if (cross > 0) {
    o.sprite('glow', WHITE, T.cx, T.cy, 190 * sc * cross, o.actorCap(0.55) * Math.min(1, cross));
    o.sprite('spark4', WHITE, T.cx, T.cy, 140 * sc * cross, 0.7, Math.PI / 4);
  }
  shockRing(o, T.cx, T.cy, t, CLEAVE_MARK, 0.5, 18 * sc, T.h * 0.62, 7 * k, LILAC, 0.9, 0.9);
  shockRing(o, T.fx, T.fy, t, CLEAVE_MARK + 0.02, 0.7, 30 * sc, 260 * sc, 4 * k, WHITE, 0.75);
  // A shock line runs along the floor through the feet, both ways.
  const run = outQuart((t - CLEAVE_MARK) / 0.4);
  if (run > 0) {
    const a = 0.8 * env(t, CLEAVE_MARK, 1.1, 0.01, 0.6);
    stroke(o, LILAC, [T.fx, T.fy], [T.fx + 330 * sc * run, T.fy], 7 * k, a);
    stroke(o, LILAC, [T.fx, T.fy], [T.fx - 330 * sc * run, T.fy], 7 * k, a);
  }
  parts(o.n(18), 311, CLEAVE_MARK, CLEAVE_MARK + 0.03, t, (p, age) => {
    spark(o, { ox: T.cx, oy: T.cy, ang: p.a * Math.PI * 2, dist: (120 + 240 * p.b) * sc, life: 0.45, age, grav: 240 * k, thick: 4.2 * k, col: p.i % 2 ? WHITE : LILAC });
  });
  o.add = false;
}

// ---------------------------------------------------------------- Total Annihilation

/** Five separate hits, each its own damage event: one mark apiece, 0.19 s apart (the presenter's `perHit`), so each numeral lands on its own strike. */
export const ANNIHILATE_MARKS: readonly number[] = [0.26, 0.45, 0.64, 0.83, 1.02];
export const ANNIHILATE_END = 2.1;
/** Each later target starts this much later, so the strikes walk across the party. */
export const ANNIHILATE_STAGGER = 0.03;

/** Total Annihilation: a dark sphere gathers over the target, then five violet-white strikes fall on it one after the other, each wider than the last; the fifth is a pillar of light. */
export function annihilate(o: FxDrawList, t: number, T: FxTarget): void {
  const sc = Math.min(T.sc, SC_MAX);
  const k = T.k;
  o.dim('#05030C', T.cx, T.cy, 1700 * k, 1700 * k, 0.6 * Math.min(1, o.dens) * env(t, 0.03, 1.9, 0.25, 0.8));
  o.add = true;
  // The gathering: a dark core over the head with violet light pulled into it.
  const gather = env(t, 0, 0.3, 0.12, 0.08);
  if (gather > 0) {
    const gx = T.cx;
    const gy = T.y - 30 * sc;
    o.sprite('glow', VIOLET, gx, gy, 170 * sc * gather, 0.7 * gather);
    parts(o.n(12), 321, 0, 0.2, t, (p, age) => {
      const u = clamp(age / 0.16);
      const ang = p.a * Math.PI * 2;
      const d = (170 - 150 * inQuad(u)) * sc;
      o.sprite('dab', p.i % 2 ? LILAC : WHITE, gx + Math.cos(ang) * d, gy + Math.sin(ang) * d * 0.7, 11 * sc, 0.9 * gather);
    });
  }
  o.decal(T.fx, T.fy, 150 * sc, VIOLET, 0.4 * env(t, 0.1, 1.9, 0.2, 0.9));
  for (let i = 0; i < ANNIHILATE_MARKS.length; i++) {
    const m = ANNIHILATE_MARKS[i]!;
    const last = i === ANNIHILATE_MARKS.length - 1;
    const u = (t - (m - 0.06)) / (last ? 0.9 : 0.34);
    if (u <= 0 || u >= 1) continue;
    const grow = 1 + 0.2 * i;
    const beam = (last ? 1 : 0.8) * env(t, m - 0.06, m + (last ? 0.7 : 0.14), 0.04, last ? 0.5 : 0.12);
    const w = T.w * 0.36 * grow;
    // The strike: a beam from above the frame to the feet, white core, violet body, a rain of motes down its length.
    o.quad('glow', VIOLET, T.cx, T.fy - 500 * k, w * 1.5, 1000 * k, 0.55 * beam);
    o.quad('glow', LILAC, T.cx, T.fy - 500 * k, w * 0.7, 1000 * k, 0.7 * beam);
    o.quad('glow', WHITE, T.cx, T.fy - 500 * k, w * 0.28, 1000 * k, 0.75 * beam);
    shockRing(o, T.fx, T.fy, t, m, last ? 0.8 : 0.45, 24 * sc, (190 + 60 * i) * sc, (last ? 8 : 5) * k, i % 2 ? WHITE : LILAC, 0.9);
    const pop1 = pop(t, m, 0.1, last ? 0.5 : 0.22);
    if (pop1 > 0) o.sprite('glow', WHITE, T.cx, T.cy, (170 + 50 * i) * sc * pop1, o.actorCap(0.5) * Math.min(1, pop1));
    parts(o.n(last ? 22 : 11), 330 + i, m, m + 0.03, t, (p, age) => {
      spark(o, { ox: T.fx + (p.a - 0.5) * 60 * sc, oy: T.fy, ang: -Math.PI * (0.15 + 0.7 * p.b), dist: (140 + 260 * p.c) * sc * grow, life: 0.5, age, grav: 420 * k, thick: 4 * k, col: p.i % 2 ? WHITE : LILAC });
    });
  }
  // The fifth strike is the biggest light of the fight: one wash, once (REDUCE FLASHES caps it).
  o.wash(30, '#EDE4FF', 0.15 * clamp(1 - Math.abs(t - ANNIHILATE_MARKS[4]!) / 0.2));
  o.add = false;
}

// ---------------------------------------------------------------- Flare

export const FLARE_MARK = 0.5;
export const FLARE_END = 2.1;

const HOT = '#FFE08A';
const ORANGE = '#FF8A3A';
const RED = '#C23A22';

/** Flare: a white-hot sun swells over the target and bursts into rays, a golden ring and falling embers. Lands on the target the engine names (Seymour, or a party member when he holds Reflect). */
export function flare(o: FxDrawList, t: number, T: FxTarget): void {
  const sc = Math.min(T.sc, SC_MAX);
  const k = T.k;
  o.add = true;
  const gx = T.cx;
  const gy = T.cy - T.h * 0.1;
  const form = outCubic(t / 0.42);
  const live = env(t, 0.04, 0.55, 0.2, 0.04);
  if (live > 0) {
    o.add = false;
    o.sprite('disc', '#E0561E', gx, gy, 130 * sc * form, 0.85 * live); // a body that holds against a bright room: the sun is a solid before it is light
    o.add = true;
    o.sprite('glow', RED, gx, gy, 260 * sc * form, 0.6 * live);
    o.sprite('glow', ORANGE, gx, gy, 170 * sc * form, 0.85 * live);
    o.sprite('glow', WHITE, gx, gy, 80 * sc * form, live);
  }
  o.decal(T.fx, T.fy, 160 * sc, ORANGE, 0.45 * env(t, 0.1, 1.9, 0.2, 0.9));
  const burst = pop(t, FLARE_MARK, 0.12, 0.5);
  if (burst > 0) {
    o.sprite('glow', WHITE, gx, gy, 380 * sc * burst, o.actorCap(0.8) * Math.min(1, burst));
    o.sprite('glow', HOT, gx, gy, 270 * sc * burst, o.actorCap(0.7) * Math.min(1, burst));
    // Twelve rays, long and eased, alternate long and short.
    for (let i = 0; i < 12; i++) {
      const ang = (i / 12) * Math.PI * 2 + 0.2;
      const len = (i % 2 ? 150 : 260) * sc * outExpo((t - FLARE_MARK) / 0.28);
      const a = 1 - clamp((t - FLARE_MARK - 0.08) / 0.5);
      stroke(o, i % 2 ? HOT : WHITE, [gx + Math.cos(ang) * 30 * sc, gy + Math.sin(ang) * 30 * sc], [gx + Math.cos(ang) * (30 * sc + len), gy + Math.sin(ang) * (30 * sc + len)], (i % 2 ? 9 : 15) * k, a);
    }
  }
  shockRing(o, gx, gy, t, FLARE_MARK, 0.7, 30 * sc, 380 * sc, 12 * k, HOT, 0.95, 1);
  shockRing(o, gx, gy, t, FLARE_MARK + 0.05, 0.8, 24 * sc, 280 * sc, 7 * k, ORANGE, 0.85, 1);
  shockRing(o, T.fx, T.fy, t, FLARE_MARK, 0.9, 30 * sc, 360 * sc, 6 * k, HOT, 0.8);
  parts(o.n(34), 341, FLARE_MARK, FLARE_MARK + 0.05, t, (p, age) => {
    spark(o, { ox: gx, oy: gy, ang: p.a * Math.PI * 2, dist: (120 + 340 * p.b) * sc, life: 0.55 + 0.5 * p.c, age, grav: 520 * k, thick: 5.2 * k * (0.6 + 0.8 * p.d), col: p.i % 3 ? HOT : p.i % 2 ? ORANGE : WHITE });
  });
  o.add = false;
  o.wash(31, '#FFE9B8', 0.22 * clamp(1 - Math.abs(t - FLARE_MARK) / 0.14));
}
