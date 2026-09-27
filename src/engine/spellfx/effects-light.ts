/**
 * Option B's white magic and the blow, as mocked (fx-b.js): Holy falling
 * pillars, Cure rising motes, a physical hit a slash arc with sparks.
 *
 * Game case: both, with one mechanic split by game. Holy is one hit in FFX
 * (ffx-combat-core §2: one Holy entry, power 100, no hit count): the pillars
 * fall, converge, and burst once. In FFX-2 it is 12 x 8 hits (ffx2-combat-core,
 * the corrected ladder), so it strikes eight times; under REDUCE FLASHES the
 * eight washes become one (`FlashParams.oneWashPerAction`).
 */

import type { FxDrawList } from './FxDrawList.ts';
import { accentOf, castMark, slash, type FxTarget } from './effects-shared.ts';
import { clamp, env, lerp, outCubic, parts, pulse } from './fxMath.ts';

/** When each FFX-2 Holy strike lands, seconds into the effect. */
export const X2_HOLY_STRIKES: readonly number[] = Array.from({ length: 8 }, (_, k) => 0.55 + k * 0.11);

export function holy(o: FxDrawList, t: number, T: FxTarget): void {
  const sc = T.sc;
  const k = T.k;
  castMark(o, T, t, 0, 1.2);
  o.add = true;
  o.decal(T.fx, T.fy, 200 * sc, '#FFF2C0', 0.55 * env(t, 0.2, 1.9, 0.2, 0.5));
  if (o.game === 'ffx2') {
    X2_HOLY_STRIKES.forEach((tk, j) => {
      const ang = (j / 8) * Math.PI * 2 - Math.PI / 2;
      const ox = T.cx + Math.cos(ang) * 190 * sc;
      const oy = T.cy + Math.sin(ang) * 150 * sc;
      const u = clamp((t - tk + 0.12) / 0.12);
      if (t > 0.12 + j * 0.03 && t < tk) o.sprite('spark4', '#FFE6F4', lerp(ox, T.cx, u * u), lerp(oy, T.cy, u * u), 44 * sc, 0.95);
      const a = env(t, tk, tk + 0.3, 0.01, 0.28);
      if (a) {
        o.sprite('glow', '#FFFFFF', T.cx + ((j % 3) - 1) * 20 * k, T.cy + (((j * 7) % 5) - 2) * 14 * k, 230 * sc, a * o.actorCap(0.8));
        o.wash(j, '#FFF6FF', 0.28 * pulse(t, tk, 0.07));
      }
      parts(o.n(10), 50 + j, tk, tk + 0.02, t, (p, age) => {
        if (age > 0.45) return;
        const an = p.a * Math.PI * 2;
        const sp = (200 + 300 * p.b) * sc;
        o.sprite('spark4', '#F7B6D9', T.cx + Math.cos(an) * sp * age, T.cy + Math.sin(an) * sp * age, 26 * sc, 1 - age / 0.45);
      });
    });
  } else {
    for (let j = 0; j < 6; j++) {
      const ang = (j / 6) * Math.PI * 2;
      const conv = outCubic((t - 0.55) / 0.3);
      const rx = 150 * sc * (1 - conv);
      const x = T.fx + Math.cos(ang) * rx;
      const zy = Math.sin(ang) * rx * 0.28;
      const drop = outCubic((t - 0.15 - j * 0.04) / 0.25);
      const bottom = lerp(-60, T.fy + zy, drop);
      const a = env(t, 0.15 + j * 0.04, 0.95, 0.05, 0.12);
      if (!a) continue;
      o.quad('pillar', '#FFF2C0', x, (bottom - 60) / 2, 18 * sc, bottom + 60, a);
      o.sprite('glow', '#FFF2C0', x, bottom, 60 * sc, a);
    }
    const R = 260 * sc * outCubic((t - 0.85) / 0.35);
    o.sprite('glow', '#FFFFFF', T.cx, T.cy, R * 2.2, o.actorCap(0.95) * env(t, 0.85, 1.6, 0.02, 0.6));
    parts(o.n(70), 51, 0.86, 0.95, t, (p, age) => {
      if (age > 1.1) return;
      const an = p.a * Math.PI * 2;
      const sp = (120 + 240 * p.b) * sc;
      const x = T.cx + Math.cos(an) * sp * age * 1.4;
      const y = T.cy + Math.sin(an) * sp * age - 80 * sc * age;
      o.quad('disc', '#FFF6D8', x, y, 28 * sc, 8 * sc, 0.9 * (1 - age / 1.1), an + age * 2);
    });
    o.wash(0, '#FFFFFF', 0.55 * pulse(t, 0.85, 0.25));
  }
  o.add = false;
}

export function cure(o: FxDrawList, t: number, T: FxTarget): void {
  const sc = T.sc;
  castMark(o, T, t, 0, 1.3);
  o.add = true;
  o.decal(T.fx, T.fy, 160 * sc, '#7EE8B0', 0.55 * env(t, 0.2, 1.5, 0.2, 0.5));
  const col = env(t, 0.3, 1.3, 0.2, 0.4);
  if (col) o.quad('glow', '#B8FFD8', T.fx, T.fy - T.h * 0.45, T.w * 0.9, T.h * 1.5, 0.45 * col);
  const cols = o.game === 'ffx2' ? ['#B8FFD8', '#FFFFFF', '#F7B6D9'] : ['#B8FFD8', '#FFFFFF', '#E3F7A0'];
  parts(o.n(100), 61, 0.25, 1.2, t, (p, age) => {
    const u = age / 0.9;
    if (u > 1) return;
    const ang = p.a * Math.PI * 2 + age * 4;
    const rad = (60 + 50 * p.b) * sc * (1 - u * 0.4);
    const x = T.fx + Math.cos(ang) * rad;
    const y = T.fy - age * (300 + 200 * p.c) * sc + Math.sin(ang) * rad * 0.28;
    o.sprite(o.bit, cols[p.i % 3]!, x, y, (o.game === 'ffx2' ? 30 : 18) * sc * (1 - u * 0.5), Math.sin(u * Math.PI));
  });
  o.sprite('glow', '#C8FFE0', T.cx, T.cy, 360 * sc, o.actorCap(0.4) * env(t, 0.5, 1.4, 0.2, 0.5));
  o.add = false;
}

export function hit(o: FxDrawList, t: number, T: FxTarget): void {
  const sc = T.sc;
  const k = T.k;
  const edge = accentOf(o);
  slash(o, T, t, 0.22, 0.12, -2.5, 0.2, 150 * sc, edge);
  o.add = true;
  parts(o.n(34), 71, 0.3, 0.33, t, (p, age) => {
    if (age > 0.4) return;
    const ang = p.a * Math.PI * 2;
    const sp = (500 + 700 * p.b) * sc;
    const x = T.cx + Math.cos(ang) * sp * age;
    const y = T.cy + Math.sin(ang) * sp * age + 600 * k * age * age;
    if (o.game === 'ffx2') o.sprite('spark4', edge, x, y, 22 * sc, 1 - age / 0.4);
    else o.bar(x, y, x - Math.cos(ang) * 22 * k, y - Math.sin(ang) * 22 * k, 2.5 * k, p.c > 0.5 ? '#FFFFFF' : edge, 1 - age / 0.4);
  });
  o.sprite('glow', '#FFFFFF', T.cx, T.cy, 300 * sc, o.actorCap(0.7) * env(t, 0.3, 0.55, 0.01, 0.22));
  o.add = false;
  o.wash(0, '#FFFFFF', 0.1 * pulse(t, 0.31, 0.1));
}
