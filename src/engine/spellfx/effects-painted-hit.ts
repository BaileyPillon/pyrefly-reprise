/**
 * The physical hit, drawn per weapon for the demo chapters with the new effects on (motion pass, lane "fx"; Bailey 2026-10-22: "physical hit sparks per weapon" with easing; `FxSwitch.ts`).
 *
 * **The weapon comes from data already in the repo** (`audio/sfxV2/weapons.ts`, read by `SparkWeapon.ts`): FFX's `weaponType` per character (sword, staff, blade, blitzball, doll, spear, claws), FFX-2's
 * dressphere (Gunner and Gun Mage a gun, Warrior a greatsword) or the girl's own (Yuna a gun, Rikku daggers, Paine a greatsword). A blow from anyone else (a boss) is the generic hit. Rule 14: FFX's
 * sparks are FFX's (gold, round motes), FFX-2's are FFX-2's (pink, four-point sparkles).
 *
 * **Sourced vs ours.** The clock is sourced: the mark stays 0.3 s as today's (the hit signal is the numeral's, `research/re-ffx-party-motion-timing.md`; FFX-2's first-hit frames, `src/data/ffx2/action-frames.ts`).
 * The SHAPES are [ours] except one: no official footage shows an ordinary sword, spear, staff or ball hit ([gap], `docs/handoff/motion-fx-reference.md` section 2.3); the blitzball's round cyan-white flash
 * with sparkles is read from the footage of Wakka's Overdrive (V1 48.0 to 49.0 s, shape only). Every other weapon below is a neutral variant: the slash, flash, ring and eased sparks of today's hit,
 * differing in the arc's shape and count, the ring and the spark's travel.
 *
 * Every spark travels on an eased path (`outQuart`, with a little gravity for debris) and is drawn as a stroke from where it was to where it is (`spark`), so it stretches while it is fast and
 * shortens as it settles. The clock starts at 0.2 s (a blow skips the lead-in it has no time for): contact is 0.3 s.
 *
 * Pure: no `three`, no DOM.
 */

import type { FxDrawList } from './FxDrawList.ts';
import { pop, shockRing, spark, stroke } from './effects-painted-kit.ts';
import { accentOf, type FxTarget } from './effects-shared.ts';
import { clamp, env, outCubic, outExpo, parts, pulse } from './fxMath.ts';

export const HIT_MARK = 0.3;
export const HIT_END = 0.85;
export const HIT_START = 0.2;

/** The weapon kinds the sparks tell apart (`audio/sfxV2/weapons.ts` `Weapon`, kept as a string so this file needs no import of the audio set). */
export type SparkKind = 'sword' | 'katana' | 'greatsword' | 'dagger' | 'spear' | 'staff' | 'blitzball' | 'doll' | 'claw' | 'gun' | 'generic';

export const SPARK_KINDS: readonly SparkKind[] = ['sword', 'katana', 'greatsword', 'dagger', 'spear', 'staff', 'blitzball', 'doll', 'claw', 'gun', 'generic'];

export function sparkKind(variant: string): SparkKind {
  return (SPARK_KINDS as readonly string[]).includes(variant) ? (variant as SparkKind) : 'generic';
}

/** An arc of the blade, in the attacker-facing frame (angles for a blow going left to right; mirrored for the other way). */
function blade(o: FxDrawList, T: FxTarget, cx: number, cy: number, t: number, t0: number, dur: number, a0: number, a1: number, R: number, thick: number, edge: string): void {
  const prog = clamp((t - t0) / dur);
  const fade = env(t, t0, t0 + dur + 0.3, 0.001, 0.3);
  if (!prog || !fade) return;
  const flip = (a: number): number => (o.dir > 0 ? a : Math.PI - a);
  const aEnd = a0 + (a1 - a0) * outCubic(prog);
  const was = o.add;
  o.add = true;
  for (const [w, col, al] of [[3.2, edge, 0.35], [1.6, edge, 0.8], [0.7, '#FFFFFF', 1]] as const) {
    o.arc(cx, cy, R, flip(a0), flip(aEnd), thick * T.sc * w, col, al * fade);
  }
  o.add = was;
}

/** The fan of eased sparks every weapon throws, at contact. */
function sparks(o: FxDrawList, T: FxTarget, x: number, y: number, t: number, n: number, dist: number, thick: number, spread: number, grav: number, cols: readonly string[]): void {
  const base = o.dir > 0 ? 0 : Math.PI;
  parts(o.n(n), 71, HIT_MARK, HIT_MARK + 0.03, t, (p, age) => {
    const ang = base + (p.a - 0.5) * 2 * spread - 0.18;
    spark(o, { ox: x, oy: y, ang, dist: (0.55 + 0.9 * p.b) * dist * 0.85 * T.sc, life: 0.3 + 0.26 * p.c, age, grav: grav * T.k, thick: thick * 1.5 * T.k * (0.7 + 0.6 * p.d), col: cols[p.i % cols.length]!, alpha: 0.98 });
    if (o.game === 'ffx2' && p.i % 3 === 0 && age < 0.42) o.sprite('spark4', cols[(p.i + 1) % cols.length]!, x + Math.cos(ang) * dist * T.sc * (0.5 + 0.7 * p.b) * outExpo(age / 0.4), y + Math.sin(ang) * dist * T.sc * (0.5 + 0.7 * p.b) * outExpo(age / 0.4), 20 * T.sc, 1 - age / 0.42);
  });
}

/** The flash at contact: a star that pops and settles, a glow, and a face-on ring. */
function contact(o: FxDrawList, T: FxTarget, x: number, y: number, t: number, size: number, col: string, ring: number): void {
  const f = pop(t, HIT_MARK, 0.07, 0.2);
  if (f <= 0) return;
  const was = o.add;
  o.add = true;
  o.sprite('spark4', '#FFFFFF', x, y, size * 0.8 * T.sc * f, Math.min(1, f));
  o.bloom(col, x, y, size * 1.3 * T.sc * f, 0.5, 1);
  if (ring > 0) shockRing(o, x, y, t, HIT_MARK, 0.28, 8 * T.sc, ring * T.sc, 3.6 * T.k, col, 0.9, 1);
  o.add = was;
}

/** The new physical hit: `o.variant` names the weapon (`sparkKind`), `o.dir` the way the blow goes (1 = left to right). */
export function hitWeapon(o: FxDrawList, t: number, T: FxTarget): void {
  const edge = accentOf(o);
  const kind = sparkKind(o.variant);
  const k = T.k;
  const sc = T.sc;
  const x = T.cx - o.dir * T.w * 0.14;
  const y = T.cy;
  const warm = o.game === 'ffx2' ? ['#FFFFFF', '#F7B6D9', '#FFD6EC'] : ['#FFFFFF', edge, '#FFF2C0'];
  o.add = true;
  switch (kind) {
    case 'sword':
      blade(o, T, T.cx, T.cy, t, 0.22, 0.12, -2.5, 0.2, 150 * sc, 26, edge);
      sparks(o, T, x, y, t, 20, 480, 3.4, 1.0, 650, warm);
      contact(o, T, x, y, t, 150, edge, 110);
      break;
    case 'katana':
      blade(o, T, T.cx, T.cy, t, 0.22, 0.1, -2.7, 0.4, 175 * sc, 17, edge);
      sparks(o, T, x, y, t, 16, 560, 2.8, 0.8, 520, warm);
      contact(o, T, x, y, t, 130, edge, 100);
      break;
    case 'greatsword':
      blade(o, T, T.cx, T.cy, t, 0.2, 0.16, -2.6, 0.5, 160 * sc, 40, edge);
      sparks(o, T, x, y, t, 12, 380, 5.6, 1.2, 800, warm);
      contact(o, T, x, y, t, 190, edge, 150);
      shockRing(o, T.fx, T.fy, t, HIT_MARK, 0.5, 30 * sc, 210 * sc, 4.4 * k, edge, 0.7);
      parts(o.n(10), 72, HIT_MARK, HIT_MARK + 0.03, t, (p, age) => {
        spark(o, { ox: T.fx + (p.a - 0.5) * 80 * sc, oy: T.fy - 10 * sc, ang: -Math.PI * (0.25 + 0.5 * p.b), dist: (70 + 140 * p.c) * sc, life: 0.55, age, grav: 900 * k, thick: 6 * k, col: '#E8D8B0', tile: 'dab', alpha: 0.9 });
      });
      break;
    case 'dagger':
      blade(o, T, T.cx, T.cy - 20 * sc, t, 0.22, 0.08, -2.3, -0.4, 95 * sc, 18, edge);
      blade(o, T, T.cx, T.cy + 18 * sc, t, 0.27, 0.08, 0.4, 2.3, 95 * sc, 18, edge);
      sparks(o, T, x, y, t, 14, 340, 2.4, 1.3, 500, warm);
      contact(o, T, x, y, t, 100, edge, 70);
      break;
    case 'spear': {
      const u = clamp((t - 0.24) / 0.1);
      const fade = env(t, 0.24, 0.62, 0.02, 0.3);
      if (u > 0 && fade > 0) {
        const reach = outCubic(u);
        stroke(o, '#FFFFFF', [x - o.dir * (T.w * 1.1 - T.w * 0.55 * reach), y + 6 * sc], [x + o.dir * T.w * 0.45 * reach, y - 4 * sc], 11 * k, fade);
        stroke(o, edge, [x - o.dir * (T.w * 1.2 - T.w * 0.55 * reach), y + 6 * sc], [x + o.dir * T.w * 0.5 * reach, y - 4 * sc], 20 * k, 0.5 * fade);
      }
      sparks(o, T, x, y, t, 12, 520, 3.0, 0.45, 300, warm);
      contact(o, T, x, y, t, 120, edge, 80);
      break;
    }
    case 'staff':
      sparks(o, T, x, y, t, 10, 300, 3.8, 1.5, 380, ['#FFFFFF', '#CFE6FF', edge]);
      contact(o, T, x, y, t, 120, '#CFE6FF', 120);
      shockRing(o, x, y, t, HIT_MARK + 0.06, 0.34, 6 * sc, 95 * sc, 3 * k, '#FFFFFF', 0.7, 1);
      break;
    case 'blitzball': {
      // Round cyan-white flash with sparkles [sourced shape: V1 48 to 49 s, an Overdrive's ball burst]
      const f = pop(t, HIT_MARK, 0.09, 0.26);
      if (f > 0) o.sprite('glow', '#8FE8FF', x, y, 210 * sc * f, o.actorCap(0.9) * Math.min(1, f));
      sparks(o, T, x, y, t, 16, 360, 3.2, Math.PI, 420, ['#FFFFFF', '#8FE8FF', '#C8F6FF']);
      contact(o, T, x, y, t, 110, '#8FE8FF', 100);
      break;
    }
    case 'doll':
      parts(o.n(9), 73, HIT_MARK, HIT_MARK + 0.04, t, (p, age) => {
        const ang = p.a * Math.PI * 2;
        const u = clamp(age / 0.5);
        o.sprite('dab', p.i % 2 ? '#FFD6EC' : '#FFF2C0', x + Math.cos(ang) * 110 * sc * outCubic(u), y + Math.sin(ang) * 90 * sc * outCubic(u), (20 + 14 * p.b) * sc * (1 - 0.4 * u), 0.9 * (1 - u * u));
      });
      sparks(o, T, x, y, t, 8, 260, 2.8, Math.PI, 300, ['#FFFFFF', '#FFD6EC']);
      contact(o, T, x, y, t, 100, '#FFD6EC', 70);
      break;
    case 'claw':
      for (let i = -1; i <= 1; i++) blade(o, T, T.cx, T.cy + i * 26 * sc, t, 0.22 + (i + 1) * 0.015, 0.09, -2.35, -0.25, 140 * sc, 13, edge);
      sparks(o, T, x, y, t, 14, 420, 2.6, 0.9, 520, warm);
      contact(o, T, x, y, t, 120, edge, 80);
      break;
    case 'gun': {
      const u = clamp((t - 0.24) / 0.06);
      if (u > 0) stroke(o, '#FFFFFF', [x - o.dir * T.w * 1.4 * (1 - outCubic(u)), y], [x - o.dir * T.w * 0.1 * (1 - outCubic(u)), y], 6 * k, env(t, 0.24, 0.5, 0.01, 0.2));
      sparks(o, T, x, y, t, 10, 300, 2.4, 0.7, 380, warm);
      contact(o, T, x, y, t, 110, edge, 60);
      break;
    }
    default:
      // Anyone else's blow (a boss's): today's slash and flash, heavier, with eased sparks.
      blade(o, T, T.cx, T.cy, t, 0.22, 0.12, -2.5, 0.2, 150 * sc, 26, edge);
      sparks(o, T, x, y, t, 22, 460, 3.6, 1.1, 700, warm);
      contact(o, T, x, y, t, 160, edge, 120);
      break;
  }
  o.add = false;
  o.wash(0, '#FFFFFF', (kind === 'greatsword' ? 0.14 : 0.1) * pulse(t, 0.31, 0.1));
}
