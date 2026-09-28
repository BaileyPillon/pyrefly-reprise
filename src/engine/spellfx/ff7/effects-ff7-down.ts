/**
 * Guard Scorpion's death (FF7 only; the phase-3 judge's repair item 8: "a white pop of about 0.3 s ... under-sold
 * against 'tons of eye candy'"). Drawn on the machine's own box while it comes apart (`BattleScreenFf7Motion.ts`
 * `sendOff` dissolves the painting over about a second under it):
 *
 * - a white-hot flash over the whole machine, the stage dimmed;
 * - a chain of explosions walking along the body (fire, a faceted burst, sparks), each throwing dark debris;
 * - a shock ring and a light pool on the floor, a warm wash at the first blast, smoke rising after.
 *
 * The look is **our estimate**: no source describes FF7's boss deaths in words we may use, and this goes past the
 * original on purpose ("i need tons of eye candy"). The calm version (reduced motion) keeps the explosions at
 * 40 % density with no wash and no haze. Pure: no `three`, no DOM.
 */

import type { FxDrawList } from '../FxDrawList.ts';
import type { FxTarget } from '../effects-shared.ts';
import { env, outCubic, parts, pulse, rng } from '../fxMath.ts';
import { dim, pool, shards, sparks, star, streak, withDensity } from './ff7FxKit.ts';

/** The first blast, seconds in: the landing mark (the director's white hit flash and cast light). */
export const FF7_DOWN_MARK = 0.05;
/** How many explosions walk along the body, and the gap between them, seconds. */
const BLASTS = 8;
const GAP = 0.11;

export function ff7BossDown(o: FxDrawList, t: number, T: FxTarget): void {
  const k = T.k;
  const r = rng(1401);
  const pts = Array.from({ length: BLASTS }, (_, i) => {
    // From the head (screen-left, the machine faces the party) toward the tail, jittered.
    const u = 0.12 + (0.76 * i) / (BLASTS - 1) + (r() - 0.5) * 0.08;
    return [T.x + T.w * u, T.y + T.h * (0.3 + 0.45 * r())] as const;
  });
  withDensity(o, (spectacle) => {
    dim(o, T, (spectacle ? 0.4 : 0.24) * env(t, 0, 1.6, 0.05, 0.5));
    o.add = true;
    const flash = env(t, 0, 0.45, 0.02, 0.35);
    o.sprite('glow', '#FFF6E6', T.cx, T.cy, Math.max(T.w, T.h) * 1.3, 0.8 * flash);
    for (let i = 0; i < BLASTS; i++) {
      const t0 = FF7_DOWN_MARK + i * GAP;
      const [x, y] = pts[i]!;
      const a = env(t, t0, t0 + 0.5, 0.02, 0.35);
      if (a > 0.003) {
        o.sprite('glow', '#FF8A30', x, y, 300 * k, 0.85 * a);
        o.sprite('glow', '#FFE6B0', x, y, 130 * k, a);
        star(o, x, y, 120 * k, '#FFD090', a, 6, i * 0.7);
        shards(o, x, y, 8, 40 * k, 150 * k, '#FFC870', a, 1410 + i, 0.4 + outCubic((t - t0) / 0.3));
      }
      sparks(o, [x, y], t, { n: 18, seed: 1420 + i, t0, spread: Math.PI * 2, speed: 620, grav: 1000, col: '#FFD890' }, k);
      // Debris: dark plates thrown out and falling (normal blend over the fire).
      parts(o.n(6), 1440 + i, t0, t0 + 0.03, t, (p, age) => {
        if (age > 0.9) return;
        const ang = -Math.PI / 2 + (p.a - 0.5) * 3;
        const sp = (240 + 320 * p.b) * k;
        o.add = false;
        o.quad('tri', '#2A1C18', x + Math.cos(ang) * sp * age, y + Math.sin(ang) * sp * age + 1100 * k * age * age, (10 + 12 * p.c) * k, (7 + 8 * p.d) * k, 0.95 * (1 - age / 0.9), age * 9 + p.e * 6);
        o.add = true;
      });
    }
    for (let i = 0; i < 2; i++) {
      const u = outCubic((t - FF7_DOWN_MARK - i * 0.3) / 0.7);
      o.ring(T.cx, T.fy, T.w * (0.18 + 0.32 * u), (12 - i * 4) * k, '#FFC890', 0.85 * env(t, FF7_DOWN_MARK + i * 0.3, 1.5, 0.01, 0.5), 0.18);
    }
    pool(o, T.cx, T.fy, T.w * 0.7, '#FF9A40', 0.7 * env(t, 0, 1.5, 0.05, 0.6));
    if (spectacle) {
      streak(o, T.cx, T.cy, 1400 * k, '#FFD0A0', flash);
      o.wash(0, '#FFE6C8', 0.42 * pulse(t, FF7_DOWN_MARK, 0.16));
      const q = rng(1470);
      o.add = false; // smoke rising over the wreck
      for (let i = 0; i < 7; i++) {
        o.sprite('glow', '#2E1A14', T.x + T.w * (0.15 + 0.7 * q()), T.y + T.h * (0.5 - 0.6 * (t - 0.4)) - q() * 60 * k, (140 + 90 * q()) * k, 0.32 * env(t, 0.4, 1.8, 0.3, 0.5));
      }
    }
  });
}
