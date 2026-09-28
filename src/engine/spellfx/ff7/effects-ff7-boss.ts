/**
 * Guard Scorpion's moves (FF7 only; D-260 Spectacle on A3 plus). Each is drawn
 * from the boss (a group effect: `T` is Guard Scorpion, `T.members` its targets):
 *
 * - **Tail Laser** (the counter while the tail is up, on all opponents, gs §4):
 *   the lens charges, then one beam sweeps up off the floor across both party
 *   members, the key frame on the nearer one, with a molten scorch where it
 *   dragged across the floor, embers, sparks and a flare at the lens.
 * - **Search Scope** ("chooses a target for its next attack", prints "Locked On
 *   Target", gs §4): a red sight from the eye, brackets and turning arcs on the
 *   target. Calm by design: no flash, no shake.
 * - **Rifle** (Shoot, one target): the twin rifles' muzzle flashes and tracers.
 * - **Scorpion Tail** (Shoot, one target): our reading of its element is a shot
 *   from the tail's lens; its look is unsourced (the options README says so).
 *
 * The anchor points (eye, lens, rifles) are measured on the Film paintings as
 * fractions of the painted box; the tail-down and tail-raised boxes differ in
 * shape, which is how the draw tells them apart. Pure.
 */

import type { FxDrawList } from '../FxDrawList.ts';
import type { FxTarget } from '../effects-shared.ts';
import { clamp, env, outCubic, parts } from '../fxMath.ts';
import { along, at, beam, chargeRings, dim, haze, lerpPt, pool, shards, sparks, star, streak, withDensity, type Pt } from './ff7FxKit.ts';

export const FF7_LASER_MARK = 0.62;
export const FF7_RIFLE_MARK = 0.3;
export const FF7_TAIL_MARK = 0.45;
export const FF7_SCOPE_MARK = 0.4;

/** Measured on `ff7-film-guard-scorpion[-tail-up]/idle` (fractions of the painted box). */
const TAIL_DOWN = { eye: [0.133, 0.514], lens: [0.974, 0.153], rifle: [0.0, 0.644] } as const;
const TAIL_UP = { eye: [0.145, 0.644], lens: [0.547, 0.167], rifle: [0.0, 0.739] } as const;

function anchorsOf(T: FxTarget): { eye: Pt; lens: Pt; rifle: Pt } {
  const a = T.w / Math.max(1, T.h) > 1.7 ? TAIL_DOWN : TAIL_UP;
  return { eye: at(T, a.eye[0], a.eye[1]), lens: at(T, a.lens[0], a.lens[1]), rifle: at(T, a.rifle[0], a.rifle[1]) };
}

type Box = { x: number; y: number; w: number; h: number };
const chest = (m: Box): Pt => [m.x + m.w * 0.5, m.y + m.h * 0.42];
const feet = (m: Box): Pt => [m.x + m.w * 0.5, m.y + m.h * 0.97];

function membersOf(T: FxTarget): Box[] {
  if (T.members?.length) return [...T.members];
  const p = T.party ?? { x: T.cx, y: T.cy };
  return [{ x: p.x - 40, y: p.y - 230, w: 80, h: 300 }];
}

export function ff7TailLaser(o: FxDrawList, t: number, T: FxTarget): void {
  const k = T.k;
  const { lens } = anchorsOf(T);
  const ms = membersOf(T).sort((a, b) => a.x - b.x);
  const far = ms[0]!;
  const near = ms[ms.length - 1]!;
  const s0: Pt = [feet(far)[0] - far.w * 0.6, feet(far)[1] - 4 * k];
  const s1: Pt = [feet(near)[0] + near.w * 0.3, feet(near)[1] + 6 * k];
  // The sweep: off the floor, through the far member, onto the near one (the key frame), held.
  const end: Pt = t < 0.35 ? s0 : t < 0.5 ? lerpPt(s0, chest(far), outCubic((t - 0.35) / 0.15)) : lerpPt(chest(far), chest(near), outCubic(clamp((t - 0.5) / 0.12)));
  withDensity(o, (spectacle) => {
    dim(o, T, (spectacle ? 0.36 : 0.22) * env(t, 0.05, 1.4, 0.15, 0.4));
    o.add = true;
    o.sprite('glow', '#6EC8FF', lens[0], lens[1], (80 + 160 * clamp(t / 0.35)) * k, 0.8 * env(t, 0, 1.2, 0.3, 0.3));
    chargeRings(o, lens[0], lens[1], 110 * k, t, 0, 0.36, '#8FDCFF', k);
    const fire = env(t, 0.35, 1.12, 0.02, 0.25);
    if (fire) {
      // The fan of light the beam throws, then the beam itself.
      o.bar(lens[0], lens[1], end[0], end[1], 90 * k, '#5AA0FF', 0.08 * fire);
      beam(o, lens, end, 20 * k, '#78E6FF', fire);
      star(o, lens[0], lens[1], 90 * k, '#9CEBFF', fire, 4, 0.2);
    }
    // The scorch dragged across the floor.
    const drag = clamp((t - 0.35) / 0.27);
    if (drag > 0) {
      const tip = lerpPt(s0, s1, drag);
      const glow = env(t, 0.35, 1.9, 0.02, 0.8);
      o.bar(s0[0], s0[1], tip[0], tip[1], 16 * k, '#FF6E28', 0.55 * glow);
      o.bar(s0[0], s0[1], tip[0], tip[1], 5 * k, '#FFDC96', 0.95 * glow);
    }
    for (const [m, tm, s] of [[far, 0.5, 0.6], [near, FF7_LASER_MARK, 1]] as const) {
      const c = chest(m);
      const hitA = env(t, tm - 0.02, tm + 0.4, 0.01, 0.3);
      star(o, c[0], c[1], 70 * s * k, '#A8E6FF', hitA, 8, 0.4);
      shards(o, c[0], c[1], 8, 40 * s * k, 130 * s * k, '#D2F5FF', hitA, 1000 + tm * 100, 0.5 + outCubic((t - tm) / 0.3));
      pool(o, feet(m)[0], feet(m)[1], 200 * s * k, '#6EC8FF', 0.5 * hitA);
    }
    if (spectacle) {
      along(o, s0, s1, t, 70, 1011, 0.4, 1.6, 12 * k, '#FF9646', 7 * k);
      along(o, lens, end, t, 120, 1012, 0.4, 1.0, 22 * k, '#C8F0FF', 6 * k);
      for (const [m, tm, n] of [[near, FF7_LASER_MARK, 40], [far, 0.5, 26]] as const) {
        sparks(o, chest(m), t, { n, seed: 1020 + n, t0: tm, t1: tm + 0.3, dir: -2.4, spread: 2.6, speed: 520, grav: 900, col: '#C8F0FF' }, k);
      }
      for (let i = 0; i < 4; i++) o.ring(lens[0], lens[1], (30 + i * 22) * k, 2 * k, '#6EC8FF', (0.7 - i * 0.14) * fire, 0.4);
      streak(o, chest(near)[0], chest(near)[1], 900 * k, '#8CD2FF', env(t, FF7_LASER_MARK, 1.1, 0.02, 0.35));
      streak(o, lens[0], lens[1], 420 * k, '#8CD2FF', fire * 0.7);
      haze(o, s0[0] - 40 * k, Math.min(chest(far)[1], chest(near)[1]) - 80 * k, s1[0] + 60 * k, s1[1] + 20 * k, t, fire);
      o.wash(0, '#DDF2FF', 0.16 * env(t, FF7_LASER_MARK, FF7_LASER_MARK + 0.2, 0.01, 0.18));
    }
  });
}

/** Four L brackets on a box and a crosshair through its middle. */
function sight(o: FxDrawList, b: Box, col: string, a: number, k: number): void {
  const L = Math.min(b.w, b.h) * 0.28;
  const w = 3.2 * k;
  for (const [x, y, dx, dy] of [[b.x, b.y, 1, 1], [b.x + b.w, b.y, -1, 1], [b.x, b.y + b.h, 1, -1], [b.x + b.w, b.y + b.h, -1, -1]] as const) {
    o.bar(x, y, x + dx * L, y, w, col, a);
    o.bar(x, y, x, y + dy * L, w, col, a);
  }
}

export function ff7Scope(o: FxDrawList, t: number, T: FxTarget): void {
  const k = T.k;
  const { eye } = anchorsOf(T);
  const m = membersOf(T)[0]!;
  const c = chest(m);
  const box: Box = { x: m.x - 12 * k, y: m.y - 10 * k, w: m.w + 24 * k, h: m.h + 16 * k };
  withDensity(o, (spectacle) => {
    o.add = true;
    const on = env(t, 0.1, 1.6, 0.12, 0.35);
    // The dashed sight line, eye to target.
    const n = 18;
    for (let i = 0; i < n; i += 2) {
      const p = lerpPt(eye, c, i / n);
      const q = lerpPt(eye, c, (i + 1) / n);
      o.bar(p[0], p[1], q[0], q[1], 3 * k, '#FF5050', 0.9 * on);
    }
    star(o, eye[0], eye[1], 34 * k, '#FF5A5A', on, 4, 0.78);
    const lock = outCubic((t - 0.1) / 0.3);
    const grow = 1 + (1 - lock) * 0.6;
    const bx: Box = { x: c[0] - (box.w * grow) / 2, y: c[1] - (box.h * grow) / 2 + (box.y + box.h / 2 - c[1]), w: box.w * grow, h: box.h * grow };
    sight(o, bx, '#FF4646', on, k);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) o.bar(c[0] + dx * 16 * k, c[1] + dy * 16 * k, c[0] + dx * 64 * k, c[1] + dy * 64 * k, 3 * k, '#FF5A5A', on);
    pool(o, feet(m)[0], feet(m)[1], 150 * k, '#FF3C3C', 0.45 * on);
    if (spectacle) {
      for (const [r, off, w] of [[70, 0.2, 5], [104, 1.4, 3], [138, 2.6, 2]] as const) {
        for (let i = 0; i < 4; i++) o.arc(c[0], c[1], r * k, off + t * 1.8 + i * 1.57, off + t * 1.8 + i * 1.57 + 0.95, w * k * 2, '#FF5050', 0.8 * on, 1);
      }
      for (let y = box.y + 6 * k; y < box.y + box.h; y += 9 * k) {
        o.bar(box.x + 8 * k, y, box.x + box.w - 8 * k, y, 2 * k, '#FF5A5A', on * (0.1 + 0.12 * Math.abs(Math.sin(y * 0.05 + t * 8))));
      }
      along(o, eye, c, t, 60, 1101, 0.1, 1.2, 8 * k, '#FF6E6E', 5 * k);
      streak(o, eye[0], eye[1], 420 * k, '#FF7878', on * 0.8);
    }
  });
}

export function ff7Rifle(o: FxDrawList, t: number, T: FxTarget): void {
  const k = T.k;
  const { rifle } = anchorsOf(T);
  const target = chest(membersOf(T)[0]!);
  withDensity(o, (spectacle) => {
    o.add = true;
    for (let i = 0; i < 5; i++) {
      const tf = 0.03 + i * 0.055;
      const barrel: Pt = [rifle[0] - 6 * k, rifle[1] + (i % 2 ? 14 : -6) * k];
      const a = env(t, tf, tf + 0.05, 0.005, 0.04);
      if (a) {
        star(o, barrel[0] - 8 * k, barrel[1], 38 * k, '#FFC860', a, 4, i);
        o.sprite('glow', '#FFB040', barrel[0] - 18 * k, barrel[1], 90 * k, 0.8 * a);
      }
      const u = clamp((t - tf) / 0.1);
      if (u > 0 && u < 1) {
        const head = lerpPt(barrel, [target[0], target[1] + (i - 2) * 8 * k], outCubic(u));
        beam(o, lerpPt(barrel, head, 0.6), head, 4 * k, '#FFD27A', 1 - u * 0.3);
      }
    }
    const land = env(t, FF7_RIFLE_MARK - 0.05, FF7_RIFLE_MARK + 0.3, 0.02, 0.25);
    star(o, target[0], target[1], 60 * k, '#FFE0A0', land, 4, 0.5);
    pool(o, rifle[0], T.fy, 140 * k, '#FFB860', 0.35 * env(t, 0, 0.4, 0.02, 0.2));
    if (spectacle) {
      sparks(o, target, t, { n: 30, seed: 1201, t0: 0.1, t1: FF7_RIFLE_MARK + 0.05, dir: 0, spread: 2.4, speed: 520, grav: 900, col: '#FFD890' }, k);
      streak(o, rifle[0], rifle[1], 300 * k, '#FFC870', env(t, 0.03, 0.3, 0.01, 0.1) * 0.8);
    }
  });
}

export function ff7ScorpionTail(o: FxDrawList, t: number, T: FxTarget): void {
  const k = T.k;
  const { lens } = anchorsOf(T);
  const target = chest(membersOf(T)[0]!);
  withDensity(o, (spectacle) => {
    o.add = true;
    o.sprite('glow', '#6EC8FF', lens[0], lens[1], (60 + 120 * clamp(t / 0.22)) * k, 0.8 * env(t, 0, 0.5, 0.15, 0.2));
    chargeRings(o, lens[0], lens[1], 80 * k, t, 0, 0.22, '#8FDCFF', k);
    const fly = clamp((t - 0.22) / 0.23);
    if (fly > 0 && fly < 1) {
      const p = lerpPt(lens, target, outCubic(fly));
      o.sprite('glow', '#78E6FF', p[0], p[1], 110 * k, 0.9);
      o.sprite('orb', '#BFF4FF', p[0], p[1], 40 * k, 1);
      beam(o, lerpPt(lens, p, 0.72), p, 12 * k, '#78E6FF', 0.7);
      o.bar(lens[0], lens[1], p[0], p[1], 2.5 * k, '#9CE6FF', 0.3); // the thread back to the tail's lens
    }
    star(o, lens[0], lens[1], 60 * k, '#9CEBFF', env(t, 0.18, 0.5, 0.02, 0.25), 4, 0.3);
    const land = env(t, FF7_TAIL_MARK - 0.02, FF7_TAIL_MARK + 0.35, 0.01, 0.3);
    star(o, target[0], target[1], 80 * k, '#A8E6FF', land, 6, 0.3);
    shards(o, target[0], target[1], 8, 40 * k, 120 * k, '#D2F5FF', land, 1301, 0.5 + outCubic((t - FF7_TAIL_MARK) / 0.3));
    if (spectacle) {
      parts(o.n(40), 1302, 0.22, 0.45, t, (p, age) => {
        if (age > 0.35) return;
        const q = lerpPt(lens, target, clamp(outCubic((p.born - 0.22) / 0.23)));
        o.sprite('mote', '#C8F0FF', q[0] + (p.a - 0.5) * 20 * k, q[1] + (p.b - 0.5) * 20 * k - age * 40 * k, 8 * k, 1 - age / 0.35);
      });
      sparks(o, target, t, { n: 36, seed: 1303, t0: FF7_TAIL_MARK, dir: -2.6, spread: 2.8, speed: 560, grav: 900, col: '#C8F0FF' }, k);
      streak(o, target[0], target[1], 520 * k, '#8CD2FF', land);
    }
  });
}
