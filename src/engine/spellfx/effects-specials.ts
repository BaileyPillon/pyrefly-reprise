/**
 * The two special moments of D-233 (option A, "Option B's specials, as
 * mocked"), ported from the spell-fx mock's `B.spiral` and `B.megaflare`
 * (`docs/concepts/spell-fx-2026-09-26/fx-b.js`; the picked frames are
 * `docs/concepts/specials-2026-09-27/`). The looks are ours: nothing in
 * research/ describes the retail animations.
 *
 * - Spiral Cut, FFX only: a blue-white helix climbs round the target, then one
 *   big gold slash and a white ring burst, landing at 1.43 s.
 * - Mega Flare, FFX-2 only: violet motes pour into Bahamut's chest (visual-bible
 *   §2's Bevelle particles), a beam drops on the party and a shockwave of pink
 *   four-point sparkles rolls out, landing at 1.45 s. The core's #B8E4FF is
 *   visual-bible §1.21's aeon table, marked [estimate] there.
 *
 * The mock's screen shake is left to the presenter's own camera shake, as for
 * every other effect (`docs/handoff/iter2-spellfx-b.md`).
 */

import type { FxDrawList } from './FxDrawList.ts';
import { slash, type FxTarget } from './effects-shared.ts';
import { env, inCubic, lerp, outCubic, parts, pulse } from './fxMath.ts';

/** When each special lands, seconds into the effect. */
export const SPIRAL_MARK = 1.43;
export const MEGAFLARE_MARK = 1.45;
/** Both last as long as the mock's clip of them. */
export const SPECIAL_END = 3.1;

export function spiral(o: FxDrawList, t: number, T: FxTarget): void {
  const sc = T.sc;
  o.add = true;
  const va = env(t, 0.1, 1.55, 0.2, 0.15);
  if (va) {
    const rise = outCubic((t - 0.1) / 0.5);
    for (let j = 0; j < 6; j++) {
      const pts: Array<[number, number]> = [];
      for (let k = 0; k <= 40; k++) {
        const u = k / 40;
        const y = T.fy - u * 620 * sc * rise;
        const th = u * 9 + t * 11 + (j * Math.PI * 2) / 6;
        const r = (50 + 110 * u) * sc;
        pts.push([T.fx + Math.cos(th) * r, y + Math.sin(th) * r * 0.25]);
      }
      o.path(pts, (j % 2 ? 7 : 3) * sc, j % 2 ? '#7FC6E8' : '#FFFFFF', 0.55 * va);
    }
  }
  parts(o.n(90), 81, 0.2, 1.4, t, (p, age) => {
    if (age > 0.6) return;
    const th = p.a * 7 + age * 10;
    const r = (60 + 140 * p.b) * sc * (1 + age);
    const y = T.fy - p.c * 560 * sc - age * 200 * sc;
    o.sprite(o.bit, '#BFE8FF', T.fx + Math.cos(th) * r, y, 16 * sc, 1 - age / 0.6);
  });
  o.decal(T.fx, T.fy, 240 * sc, '#7FC6E8', 0.6 * va);
  o.add = false;
  const big: FxTarget = { ...T, cy: T.cy - 20 * sc };
  slash(o, big, t, 1.3, 0.14, -1.75, 1.45, 210 * sc, '#E3B94A');
  o.add = true;
  o.bloom('#FFFFFF', T.cx, T.cy, 520 * sc, 0.9, env(t, SPIRAL_MARK - 0.01, 2.2, 0.01, 0.7));
  o.ring(T.fx, T.fy, (80 + 420 * outCubic((t - 1.42) / 0.8)) * sc, 4 * T.k, '#FFFFFF', 0.8 * env(t, 1.42, 2.3, 0.01, 0.8));
  parts(o.n(80), 82, 1.42, 1.46, t, (p, age) => {
    if (age > 1) return;
    const an = -Math.PI * p.a;
    const sp = (300 + 700 * p.b) * sc;
    o.sprite('glow', p.c > 0.5 ? '#7FC6E8' : '#FFFFFF', T.cx + Math.cos(an) * sp * age, T.cy + Math.sin(an) * sp * age + 900 * sc * age * age, 20 * sc, 1 - age);
  });
  o.add = false;
  o.wash(0, '#FFFFFF', 0.5 * pulse(t, SPIRAL_MARK, 0.25));
}

/**
 * `T` is the caster (Bahamut); `T.party` is the party's centre, where the beam
 * lands. Without one the blast lands 40 % of a screen below the chest.
 */
export function megaflare(o: FxDrawList, t: number, T: FxTarget): void {
  const sc = T.sc;
  const k = T.k;
  const P = T.party ?? { x: T.cx, y: T.cy + 360 * k };
  const chest = { x: T.cx - 20 * sc, y: T.cy - T.h * 0.12 };
  o.add = true;
  parts(o.n(140), 91, 0, 1.25, t, (p, age) => {
    const life = 0.55;
    if (age > life) return;
    const u = inCubic(age / life);
    const an = p.a * Math.PI * 2;
    const r0 = (260 + 260 * p.b) * sc;
    const x = lerp(chest.x + Math.cos(an) * r0, chest.x, u);
    const y = lerp(chest.y + Math.sin(an) * r0 * 0.7, chest.y, u);
    o.sprite(o.bit, p.c > 0.4 ? '#B048F0' : '#D8B8FF', x, y, (o.game === 'ffx2' ? 30 : 14) * sc, 0.4 + u * 0.6);
  });
  const core = env(t, 0.1, 1.55, 0.3, 0.1);
  const cr = (14 + 70 * outCubic(t / 1.3)) * sc;
  o.sprite('glow', '#B8E4FF', chest.x, chest.y, cr * 5, core);
  o.sprite('glow', '#FFFFFF', chest.x, chest.y, cr * 2.2, core);
  const beam = env(t, 1.3, 1.75, 0.03, 0.2);
  if (beam) {
    const u = outCubic((t - 1.3) / 0.12);
    const ex = lerp(chest.x, P.x, u);
    const ey = lerp(chest.y, P.y, u);
    for (const [w, col, a] of [[90, '#B048F0', 0.3], [48, '#B8E4FF', 0.6], [16, '#FFFFFF', 1]] as const) {
      o.bar(chest.x, chest.y, ex, ey, w * sc, col, a * beam);
    }
  }
  // The mock's radial blast (white, then #B8E4FF, then violet at the rim),
  // as three nested glows: the glow tile is the same falloff.
  const boom = env(t, 1.42, SPECIAL_END, 0.02, 1.2);
  const R = 420 * sc * outCubic((t - 1.42) / 0.5);
  if (boom && R > 1) {
    const by = P.y - R * 0.3;
    o.sprite('glow', '#B048F0', P.x, by, R * 2, 0.35 * boom);
    o.sprite('glow', '#B8E4FF', P.x, by, R * 1.3, 0.6 * boom);
    o.bloom('#FFFFFF', P.x, by, R * 0.8, 0.95, boom);
  }
  o.ring(P.x, P.y + 40 * k, (100 + 900 * outCubic((t - MEGAFLARE_MARK) / 0.9)) * sc, 5 * k, '#D8B8FF', 0.9 * env(t, MEGAFLARE_MARK, 2.6, 0.01, 1));
  parts(o.n(90), 92, 1.45, 1.55, t, (p, age) => {
    if (age > 1.3) return;
    const an = -Math.PI * p.a;
    const sp = (300 + 800 * p.b) * sc;
    const x = P.x + Math.cos(an) * sp * age;
    const y = P.y + Math.sin(an) * sp * age * 0.8 + 700 * sc * age * age;
    o.sprite(o.bit, p.c > 0.5 ? '#B8E4FF' : '#F7B6D9', x, y, (o.game === 'ffx2' ? 30 : 14) * sc, 1 - age / 1.3);
  });
  o.add = false;
  o.wash(0, '#FFFFFF', 0.8 * pulse(t, 1.43, 0.35));
}
