/**
 * The party's blows in the FF7 Guard Scorpion fight (FF7 only; D-244 B1 and
 * D-260 Spectacle on A3 plus):
 *
 * - **Slash** (Cloud's Attack): a white crescent with a pale edge across the
 *   target, a star at the hit, sparks and faceted chips.
 * - **Shot** (Barret's Attack, Gatling Gun): the muzzle flash drawn by code at
 *   the gun's tip (B1: "aim, fire with a code-drawn muzzle flash"), a burst of
 *   tracers into the target, sparks where they land.
 * - **Braver** (Cloud's Limit, "a jump upwards followed by a downward slash",
 *   FF Wiki revid 3921199): a descending crescent with afterimages, a star and
 *   shockwave rings at the hit, debris.
 * - **Big Shot** (Barret's Limit, "charging up a large fireball and then
 *   releasing it at the target", FF Wiki revid 3683856): the fireball grows at
 *   the muzzle, flies, and bursts.
 *
 * The shot and Big Shot are drawn from the attacker (a group effect: `T` is
 * Barret, `T.members[0]` the target). The look is ours. Pure.
 */

import type { FxDrawList } from '../FxDrawList.ts';
import type { FxTarget } from '../effects-shared.ts';
import { clamp, env, lerp, outCubic, parts, pulse, rng } from '../fxMath.ts';
import { at, beam, dim, haze, lerpPt, pool, shards, sparks, star, streak, withDensity, type Pt } from './ff7FxKit.ts';

export const FF7_SLASH_MARK = 0.3;
export const FF7_SHOT_MARK = 0.3;
export const FF7_BRAVER_MARK = 0.42;
export const FF7_BIGSHOT_MARK = 0.82;

/** Barret's gun muzzle in his fire and aim paintings, fractions of his painted box (measured, `ff7-film-barret/attack`). */
const MUZZLE = [0.99, 0.27] as const;

/** The target's chest: the group effect's first member, or the landing point. */
function chestOf(T: FxTarget): Pt {
  const m = T.members?.[0];
  if (m) return [m.x + m.w * 0.42, m.y + m.h * 0.5];
  return [T.party?.x ?? T.cx, (T.party?.y ?? T.cy) - T.h * 0.25];
}

export function ff7Slash(o: FxDrawList, t: number, T: FxTarget): void {
  const k = T.k;
  const hit: Pt = [T.x + T.w * 0.25, T.cy];
  withDensity(o, (spectacle) => {
    const prog = clamp((t - 0.2) / 0.12);
    const fade = env(t, 0.2, 0.62, 0.001, 0.3);
    if (prog && fade) {
      const R = Math.min(T.h * 0.55, 200 * k);
      const a0 = -2.4;
      const aEnd = lerp(a0, 0.5, outCubic(prog));
      o.add = true;
      for (const [w, col, al] of [[3.4, '#8FC8FF', 0.35], [1.6, '#D8ECFF', 0.8], [0.7, '#FFFFFF', 1]] as const) {
        o.arc(hit[0], hit[1], R, a0, aEnd, 24 * k * w, col, al * fade);
      }
    }
    o.add = true;
    const flash = env(t, FF7_SLASH_MARK - 0.02, FF7_SLASH_MARK + 0.25, 0.01, 0.2);
    star(o, hit[0], hit[1], 90 * k, '#DDEEFF', flash, 4, 0.3);
    shards(o, hit[0], hit[1], spectacle ? 10 : 6, 30 * k, 120 * k, '#FFFFFF', flash * 0.9, 900, 0.5 + outCubic((t - 0.3) / 0.25));
    pool(o, hit[0], T.fy, 160 * k, '#CFE4FF', 0.4 * flash);
    if (spectacle) {
      sparks(o, hit, t, { n: 34, seed: 911, t0: FF7_SLASH_MARK, dir: -0.4, spread: 3.2, speed: 640, grav: 1000, col: '#FFE9C0' }, k);
      streak(o, hit[0], hit[1], 520 * k, '#CFE4FF', flash);
    }
  });
}

export function ff7Shot(o: FxDrawList, t: number, T: FxTarget): void {
  const k = T.k;
  const muzzle = at(T, MUZZLE[0], MUZZLE[1]);
  const hit = chestOf(T);
  withDensity(o, (spectacle) => {
    o.add = true;
    // Four quick muzzle flashes: the gatling's burst.
    for (let i = 0; i < 4; i++) {
      const tf = 0.04 + i * 0.07;
      const a = env(t, tf, tf + 0.06, 0.005, 0.05);
      if (!a) continue;
      star(o, muzzle[0] + 10 * k, muzzle[1], (46 + 10 * (i % 2)) * k, '#FFC860', a, 4, i * 0.4);
      o.sprite('glow', '#FFB040', muzzle[0] + 24 * k, muzzle[1], 110 * k, 0.8 * a);
      // The tracer: a bright streak running muzzle to target.
      const u = clamp((t - tf) / 0.12);
      if (u > 0 && u < 1) {
        const head = lerpPt(muzzle, [hit[0], hit[1] + (i - 1.5) * 10 * k], outCubic(u));
        const tail = lerpPt(muzzle, head, 0.55);
        beam(o, tail, head, 5 * k, '#FFD27A', 1 - u * 0.3);
      }
    }
    const land = env(t, FF7_SHOT_MARK - 0.05, FF7_SHOT_MARK + 0.35, 0.02, 0.28);
    star(o, hit[0], hit[1], 70 * k, '#FFE0A0', land, 4, 0.8);
    pool(o, muzzle[0], T.fy, 120 * k, '#FFB860', 0.35 * env(t, 0, 0.4, 0.02, 0.2));
    if (spectacle) {
      sparks(o, hit, t, { n: 40, seed: 921, t0: 0.12, t1: FF7_SHOT_MARK + 0.05, dir: Math.PI, spread: 2.6, speed: 560, grav: 900, col: '#FFD890' }, k);
      parts(o.n(14), 922, 0.05, 0.32, t, (p, age) => {
        if (age > 0.6) return;
        // Spent casings kicked out of the gun, back and up.
        o.quad('solid', '#E0B060', muzzle[0] - 60 * k - age * 180 * k * p.a, muzzle[1] - age * 260 * k + 700 * k * age * age, 5 * k, 2.5 * k, 1 - age / 0.6, age * 12 + p.b);
      });
      streak(o, muzzle[0], muzzle[1], 360 * k, '#FFC870', env(t, 0.04, 0.32, 0.01, 0.1) * 0.8);
    }
  });
}

export function ff7Braver(o: FxDrawList, t: number, T: FxTarget): void {
  const k = T.k;
  const hit: Pt = [T.x + T.w * 0.24, T.cy + T.h * 0.05];
  const a0: Pt = [hit[0] - 120 * k, T.y - 180 * k];
  const a1: Pt = [hit[0] + 20 * k, T.fy + 10 * k];
  withDensity(o, (spectacle) => {
    dim(o, T, (spectacle ? 0.42 : 0.24) * env(t, 0.05, 1.3, 0.1, 0.4));
    o.add = true;
    const prog = clamp((t - 0.22) / 0.2);
    const fade = env(t, 0.22, 0.95, 0.01, 0.4);
    if (prog && fade) {
      const R = 300 * k;
      const cx = hit[0] - R * 0.9;
      const cy = hit[1] - 40 * k;
      const s0 = -1.2;
      const sEnd = lerp(s0, 0.55, outCubic(prog));
      // Afterimages of the crescent, stepped back up the leap (Spectacle).
      if (spectacle) for (let i = 3; i >= 1; i--) o.arc(cx - i * 26 * k, cy - i * 30 * k, R, s0, sEnd, 40 * k, '#D7E8FF', (0.28 / i) * fade, 1);
      for (const [w, col, al] of [[3.2, '#8CB4FF', 0.45], [1.6, '#D7E8FF', 0.85], [0.7, '#FFFFFF', 1]] as const) o.arc(cx, cy, R, s0, sEnd, 26 * k * w, col, al * fade, 1);
    }
    const blast = env(t, FF7_BRAVER_MARK - 0.02, FF7_BRAVER_MARK + 0.45, 0.01, 0.35);
    star(o, hit[0], hit[1], 150 * k, '#E6F0FF', blast, 6, 0.1);
    shards(o, hit[0], hit[1], spectacle ? 18 : 10, 60 * k, 240 * k, '#FFFFFF', blast, 940, 0.4 + outCubic((t - FF7_BRAVER_MARK) / 0.3));
    for (let i = 0; i < 3; i++) {
      const u = outCubic((t - FF7_BRAVER_MARK - i * 0.06) / 0.45);
      o.ring(hit[0], T.fy, (120 + 300 * u + i * 40) * k, (7 - i * 2) * k, '#D7E8FF', (0.85 - i * 0.2) * env(t, FF7_BRAVER_MARK + i * 0.06, 1.3, 0.01, 0.45), 0.16);
    }
    pool(o, hit[0], T.fy, 420 * k, '#D7E8FF', 0.7 * blast);
    if (spectacle) {
      for (const [p, q] of [[a0, lerpPt(a0, a1, 0.5)], [lerpPt(a0, a1, 0.5), a1]] as const) {
        parts(o.n(60), 950 + p[0], 0.24, 0.5, t, (m, age) => {
          if (age > 0.5) return;
          const u = m.a;
          o.sprite('mote', '#DDE8FF', p[0] + (q[0] - p[0]) * u + (m.b - 0.5) * 60 * k, p[1] + (q[1] - p[1]) * u + (m.c - 0.5) * 60 * k, 10 * k, 1 - age / 0.5);
        });
      }
      sparks(o, hit, t, { n: 110, seed: 961, t0: FF7_BRAVER_MARK, dir: -Math.PI / 2 - 0.3, spread: 3.6, speed: 760, grav: 1300, col: '#FFECBE' }, k);
      parts(o.n(16), 962, FF7_BRAVER_MARK, FF7_BRAVER_MARK + 0.03, t, (p, age) => {
        if (age > 0.9) return;
        const a = -Math.PI / 2 + (p.a - 0.5) * 2.6;
        const r = (80 + 200 * p.b) * k;
        o.add = false;
        o.quad('tri', '#2A2020', hit[0] + Math.cos(a) * r * (0.3 + age), T.fy - 40 * k + Math.sin(a) * r * 0.6 * age * 2 + 900 * k * age * age, (8 + 10 * p.c) * k, (6 + 6 * p.d) * k, 0.95 * (1 - age / 0.9), age * 8 + p.e * 6);
        o.add = true;
      });
      streak(o, hit[0], hit[1], 1100 * k, '#D7E8FF', blast);
      haze(o, hit[0] - 320 * k, hit[1] - 120 * k, hit[0] + 160 * k, T.fy, t, env(t, FF7_BRAVER_MARK, 1.3, 0.05, 0.4));
      o.wash(0, '#EAF2FF', 0.2 * pulse(t, FF7_BRAVER_MARK, 0.14));
    }
  });
}

export function ff7BigShot(o: FxDrawList, t: number, T: FxTarget): void {
  const k = T.k;
  const muzzle = at(T, MUZZLE[0], MUZZLE[1]);
  const hit = chestOf(T);
  withDensity(o, (spectacle) => {
    dim(o, T, (spectacle ? 0.34 : 0.2) * env(t, 0.05, 1.5, 0.1, 0.4));
    o.add = true;
    const charge = clamp(t / 0.55);
    const flying = clamp((t - 0.55) / 0.27);
    const ball: Pt = flying > 0 ? lerpPt(muzzle, hit, outCubic(flying)) : [muzzle[0] + 30 * k, muzzle[1]];
    const size = (40 + 70 * charge) * k;
    if (t < FF7_BIGSHOT_MARK) {
      o.sprite('glow', '#FF8A2A', ball[0], ball[1], size * 2.6, 0.7);
      o.sprite('orb', '#FFD080', ball[0], ball[1], size, 1);
      o.sprite('glow', '#FFFFFF', ball[0], ball[1], size * 0.7, 0.9);
      if (flying > 0) beam(o, lerpPt(muzzle, ball, 0.3), ball, size * 0.5, '#FF9A40', 0.6);
    }
    for (let i = 0; i < 3; i++) {
      const v = (charge * 2 + i / 3) % 1;
      if (charge < 1) o.ring(ball[0], ball[1], size * 2 * (1 - v) + 4, 2.4 * k, '#FFB050', (1 - v) * 0.8, 1);
    }
    const blast = env(t, FF7_BIGSHOT_MARK - 0.02, FF7_BIGSHOT_MARK + 0.55, 0.01, 0.4);
    star(o, hit[0], hit[1], 170 * k, '#FFD9A0', blast, 6, 0.2);
    o.sprite('glow', '#FF7A28', hit[0], hit[1], 420 * k, 0.8 * blast);
    for (let i = 0; i < 2; i++) o.ring(hit[0], hit[1] + 60 * k, (100 + 260 * outCubic((t - FF7_BIGSHOT_MARK - i * 0.08) / 0.4)) * k, (6 - i * 2) * k, '#FFC070', 0.8 * env(t, FF7_BIGSHOT_MARK + i * 0.08, 1.5, 0.01, 0.45), 0.3);
    pool(o, hit[0], hit[1] + T.h * 0.4, 360 * k, '#FF9A40', 0.6 * blast);
    if (spectacle) {
      parts(o.n(50), 971, 0.02, 0.5, t, (p, age) => {
        if (age > 0.4 || t > 0.6) return;
        const a = p.a * Math.PI * 2 + age * 6;
        const r = (140 - 300 * age) * k;
        if (r <= 0) return;
        o.sprite('mote', '#FFD090', ball[0] + Math.cos(a) * r, ball[1] + Math.sin(a) * r * 0.7, 10 * k, 1 - age / 0.4);
      });
      sparks(o, hit, t, { n: 90, seed: 981, t0: FF7_BIGSHOT_MARK, spread: Math.PI * 2, speed: 700, grav: 900, col: '#FFC870' }, k);
      streak(o, hit[0], hit[1], 1000 * k, '#FFB060', blast);
      haze(o, hit[0] - 200 * k, hit[1] - 160 * k, hit[0] + 200 * k, hit[1] + 160 * k, t, blast);
      const r = rng(985);
      o.add = false; // smoke over the blast, normal blend
      for (let i = 0; i < 6; i++) o.sprite('glow', '#3A1A10', hit[0] + (r() - 0.5) * 200 * k, hit[1] - (t - FF7_BIGSHOT_MARK) * 160 * k - r() * 60 * k, (90 + 60 * r()) * k, 0.3 * env(t, FF7_BIGSHOT_MARK + 0.1, 1.6, 0.2, 0.5));
    }
  });
}
