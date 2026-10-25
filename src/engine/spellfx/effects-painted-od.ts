/**
 * The openings of the big moments, drawn for the demo chapters with the new effects on (motion pass, lane "fx", step 3; Bailey 2026-10-22: Overdrives "Each game's own intro"; `FxSwitch.ts`):
 *
 * - `odaura`, **FFX only** (Chapter I): the ready aura that stands round a character as an Overdrive opens. Sourced for Tidus and Auron, from Square Enix's own footage (V1, "Battles - FINAL
 *   FANTASY X/X-2 HD Remaster", contact sheets every 0.5 s; `docs/handoff/motion-fx-reference.md` section 2.7): Tidus (26.5 to 28.0 s) orange-gold flame wisps rise round his legs and waist and brighten
 *   over 1.5 s, white-cyan wisps curl along the blade, and one thin white jagged line crosses the frame at the end; Auron (5.0 s) a blue ring on the ground at his feet with thin yellow-green
 *   vertical wisps rising. Anyone else (Kimahri, Yuna, the reserves) is [gap]: a neutral cool version, [ours].
 * - `jump`, **FFX only**: Kimahri's Jump landing. Sourced shape, partly (V3, the TGS trailer, 54.5 s): it lands as a hard white-yellow burst with a white ground ring and gold vertical streaks; a small
 *   dark figure high in a blue sky, falling, a beat before. The descent streak, the debris and the dust are [ours].
 * - `dress`, **FFX-2 only** (Chapter IV): the painted burst under the HUD's dress change (`ui/ffx2/SpherechangeFlourish.ts` keeps its column, motes, ring and plate). Sourced grammar (V4, the FFX-2
 *   battle short, 10 to 21 s; section 3.2 of the notes): each girl's change has its own colours: Yuna white wisps then a wide magenta-pink ribbon of light circling her waist with glitter; Paine a violet
 *   storm with arcs, a white column, golden shafts and a white starburst with violet and pale-gold wedges; Rikku a green-teal ring, a lime-yellow burst, torn light shards, purple five-point stars and
 *   orange-white sparks. The retail change lasts about 3 s; this one keeps the HUD flourish's 0.8 s budget, [ours].
 *
 * Pure: no `three`, no DOM.
 */

import type { FxDrawList } from './FxDrawList.ts';
import { SC_MAX, pop, shockRing, spark, stroke, trailAlong, type Pt } from './effects-painted-kit.ts';
import { bolt } from './effects-painted-bahamut.ts';
import type { FxTarget } from './effects-shared.ts';
import { clamp, env, inQuad, lerp, outCubic, outExpo, outQuad, outQuart, parts } from './fxMath.ts';

const WHITE = '#FFFFFF';

// ---------------------------------------------------------------- the ready aura

export const ODAURA_MARK = 0.15;
export const ODAURA_END = 1.7;
/** How long the aura builds before it lets go (the presenter's calm beat starts when it is at full). */
export const ODAURA_BUILD = 1.2;

interface AuraSkin {
  ground: string;
  wisp: readonly [string, string];
  blade: string | null;
  ring: string | null;
}

const AURA: Readonly<Record<string, AuraSkin>> = Object.freeze({
  tidus: { ground: '#FF9A3A', wisp: ['#FFB04A', '#FFE08A'], blade: '#BFF4FF', ring: null },
  auron: { ground: '#3A78E8', wisp: ['#C8E85A', '#F2FF9A'], blade: null, ring: '#4A8CFF' },
  '': { ground: '#7FB2FF', wisp: ['#BFD8FF', '#FFFFFF'], blade: null, ring: '#9FD0FF' }, // [gap] in the footage: neutral
});

/** The ready aura of an Overdrive opening, on the character who is about to use it (variant `tidus`, `auron`, else neutral). */
export function odaura(o: FxDrawList, t: number, T: FxTarget): void {
  const sc = Math.min(T.sc, SC_MAX);
  const k = T.k;
  const skin = AURA[o.variant] ?? AURA['']!;
  const build = clamp(t / ODAURA_BUILD);
  const life = env(t, 0.02, ODAURA_END, 0.25, 0.4);
  o.add = true;
  o.decal(T.fx, T.fy, 150 * sc, skin.ground, 0.28 * life * (0.35 + 0.65 * build));
  if (skin.ring) {
    o.ring(T.fx, T.fy, 118 * sc * (0.9 + 0.1 * outCubic(t / 0.4)), 4 * k, skin.ring, 0.9 * life, 0.28);
    o.ring(T.fx, T.fy, 90 * sc, 2 * k, WHITE, 0.55 * life, 0.28);
  }
  // Tongues of light climb the legs and waist, more and brighter as the aura builds: tall streaks for Tidus's flame, thin ones for Auron's wisps and the neutral aura.
  const thin = o.variant !== 'tidus';
  parts(o.n(28), 501, 0.0, 1.15, t, (p, age) => {
    const u = age / 0.9;
    if (u > 1) return;
    const x = T.fx + (p.a - 0.5) * T.w * 0.85 + Math.sin(age * 7 + p.i) * 8 * sc;
    const h = (60 + 150 * p.b) * sc * (0.45 + 0.55 * build);
    const lift = outQuad(u) * (0.15 + 0.4 * p.c) * T.h;
    const a = Math.sin(u * Math.PI) * (0.4 + 0.6 * build);
    const baseY = T.fy - 8 * sc - lift;
    o.quad('streak', skin.wisp[p.i % 2]!, x, baseY - h / 2, h, (thin ? 4 + 3 * p.d : 10 + 10 * p.d) * k, 0.95 * a, -Math.PI / 2);
    o.sprite('dab', skin.wisp[(p.i + 1) % 2]!, x, baseY - h, (thin ? 12 : 22) * sc * (1 - 0.4 * u), a);
  });
  // Tidus: white-cyan wisps curl along the blade, and one thin jagged line crosses the frame at the end.
  if (skin.blade) {
    const bx = T.cx + o.dir * T.w * 0.36;
    for (let i = 0; i < 6; i++) {
      const u = ((t * 0.9 + i / 6) % 1);
      const pts: Pt[] = [];
      for (let j = 0; j < 5; j++) {
        const a = clamp(u - j * 0.07);
        pts.push([bx + Math.sin(a * 9 + i) * 9 * sc + o.dir * a * 12 * sc, T.cy + T.h * 0.12 - a * T.h * 0.6]);
      }
      pts.reverse();
      trailAlong(o, pts, skin.blade, 5 * k, 0.7 * Math.sin(u * Math.PI) * build);
    }
    const strike = pop(t, ODAURA_BUILD + 0.1, 0.04, 0.06);
    if (strike > 0 && !o.flash.oneWashPerAction) bolt(o, T.cx - 760 * k, T.cy - 70 * k, T.cx + 760 * k, T.cy + 30 * k, 511, k, strike, 90 * sc);
  }
  o.sprite('glow', skin.wisp[0], T.cx, T.cy + T.h * 0.1, T.h * 1.2, o.actorCap(0.18) * build * life);
  o.add = false;
}

// ---------------------------------------------------------------- Kimahri's Jump

export const JUMP_MARK = 0.26;
export const JUMP_END = 1.3;

const GOLD = '#E8C860';
const HOT = '#FFF2A0';

/** Jump: a small dark spear falls from the top of the frame on a gold streak and lands in a hard white-yellow burst with a white ground ring and gold vertical streaks. */
export function jump(o: FxDrawList, t: number, T: FxTarget): void {
  const sc = Math.min(T.sc, SC_MAX);
  const k = T.k;
  o.add = true;
  const fall = clamp(t / 0.23);
  if (t < 0.3) {
    const head: Pt = [T.cx, lerp(T.y - 520 * k, T.cy - T.h * 0.1, inQuad(fall))];
    const tail: Pt = [T.cx - 8 * sc, head[1] - 300 * k * (1 - 0.5 * fall)];
    const a = clamp((0.3 - t) / 0.07);
    stroke(o, GOLD, tail, head, 26 * k, 0.75 * a);
    stroke(o, WHITE, [T.cx, head[1] - 120 * k], head, 8 * k, a);
    o.sprite('glow', HOT, head[0], head[1], 80 * sc, a);
  }
  const hard = pop(t, JUMP_MARK - 0.02, 0.08, 0.26);
  if (hard > 0) {
    o.sprite('disc', HOT, T.cx, T.cy + T.h * 0.1, 170 * sc * hard, 0.85 * Math.min(1, hard));
    o.sprite('glow', WHITE, T.cx, T.cy + T.h * 0.1, 230 * sc * hard, o.actorCap(0.55) * Math.min(1, hard));
  }
  shockRing(o, T.fx, T.fy, t, JUMP_MARK, 0.55, 30 * sc, 360 * sc, 10 * k, WHITE, 0.95);
  shockRing(o, T.fx, T.fy, t, JUMP_MARK + 0.05, 0.75, 20 * sc, 250 * sc, 5 * k, GOLD, 0.8);
  // Gold vertical streaks go up from the point of impact, fast and eased.
  for (let i = 0; i < 9; i++) {
    const u = (t - JUMP_MARK - (i % 3) * 0.015) / 0.5;
    if (u <= 0 || u >= 1) continue;
    const x = T.fx + (i - 4) * 26 * sc;
    const h = (110 + 190 * ((i * 5) % 7) / 7) * sc * outExpo(u);
    o.quad('streak', i % 2 ? GOLD : HOT, x, T.fy - h / 2, h, (7 + (i % 3) * 3) * k, 0.9 * (1 - u * u), -Math.PI / 2);
  }
  parts(o.n(20), 521, JUMP_MARK, JUMP_MARK + 0.03, t, (p, age) => {
    spark(o, { ox: T.fx + (p.a - 0.5) * 80 * sc, oy: T.fy, ang: -Math.PI * (0.1 + 0.8 * p.b), dist: (120 + 260 * p.c) * sc, life: 0.55, age, grav: 480 * k, thick: 4.4 * k, col: p.i % 2 ? WHITE : GOLD });
  });
  o.add = false;
  // The dust the landing throws up: low, grey-gold, rising and spreading.
  parts(o.n(8), 522, JUMP_MARK, JUMP_MARK + 0.05, t, (p, age) => {
    const u = age / 0.8;
    if (u > 1) return;
    o.sprite('glow', '#B9A878', T.fx + (p.a - 0.5) * 220 * sc * outQuart(u), T.fy - 20 * sc - outQuad(u) * 90 * sc, (70 + 60 * p.b) * sc * (0.6 + u), 0.4 * (1 - u));
  });
}

// ---------------------------------------------------------------- the dress change

export const DRESS_MARK = 0.15;
export const DRESS_END = 0.95;

interface DressSkin {
  main: string;
  second: string;
  accent: string;
  spark: string;
}

const DRESS: Readonly<Record<string, DressSkin>> = Object.freeze({
  yuna: { main: '#E8409C', second: '#FFD6EC', accent: WHITE, spark: '#FFE9F4' },
  paine: { main: '#8A4CE8', second: '#E8C860', accent: '#F6F0D0', spark: '#CBB0FF' },
  rikku: { main: '#38D6A8', second: '#D4F23A', accent: '#9A4CD8', spark: '#FFC890' },
  '': { main: '#F7B6D9', second: '#FFFFFF', accent: '#FFD9EC', spark: '#FFFFFF' },
});

/** The dress change's painted burst: a column of light with the girl's own colours round it, a flash at the moment the costume turns (0.38 s), and shards and sparks that fly from it. */
export function dress(o: FxDrawList, t: number, T: FxTarget): void {
  const sc = Math.min(T.sc, SC_MAX);
  const k = T.k;
  const s = DRESS[o.variant] ?? DRESS['']!;
  o.add = true;
  o.decal(T.fx, T.fy, 170 * sc, s.main, 0.5 * env(t, 0.02, 0.9, 0.12, 0.35));
  const col = env(t, 0.04, 0.62, 0.1, 0.22);
  if (col > 0) {
    o.quad('glow', s.main, T.cx, T.cy - T.h * 0.1, T.w * 0.8, T.h * 1.7, 0.5 * col);
    o.quad('glow', WHITE, T.cx, T.cy - T.h * 0.1, T.w * 0.26, T.h * 1.7, 0.7 * col);
  }
  // Her colours round her: a ribbon circling the waist (Yuna), arcs and golden shafts (Paine), a ring and torn shards (Rikku).
  const spin = outCubic(t / 0.7) * 6.2;
  if (o.variant === 'paine') {
    for (let i = 0; i < 4; i++) {
      const x = T.cx + (i - 1.5) * T.w * 0.24;
      stroke(o, s.second, [x, T.fy], [x, T.fy - (0.7 + 0.5 * ((i * 3) % 4) / 3) * T.h * 1.4 * outExpo((t - 0.08) / 0.3)], 11 * k, 0.65 * col);
    }
    bolt(o, T.cx - T.w * 0.6, T.cy - T.h * 0.4, T.cx + T.w * 0.5, T.cy + T.h * 0.1, 531, k, pop(t, 0.2, 0.04, 0.12), 24 * sc);
  } else if (o.variant === 'rikku') {
    o.ring(T.cx, T.fy - T.h * 0.06, T.w * (0.4 + 0.6 * outCubic(t / 0.5)), 6 * k, s.main, 0.85 * col, 0.3);
    o.ring(T.cx, T.fy - T.h * 0.06, T.w * 0.3 * (0.5 + outCubic(t / 0.5)), 3 * k, s.second, 0.8 * col, 0.3);
  } else {
    o.arc(T.cx, T.cy + T.h * 0.12, T.w * 0.62, spin, spin + 3.6, 15 * k, s.main, 0.95 * col, 0.3);
    o.arc(T.cx, T.cy + T.h * 0.12, T.w * 0.62, spin + 0.1, spin + 3.3, 6 * k, s.accent, 0.9 * col, 0.3);
  }
  // The turn of the costume: a flash that pops and settles, five-point stars on it.
  const flash = pop(t, 0.34, 0.1, 0.3);
  if (flash > 0) {
    o.sprite('glow', WHITE, T.cx, T.cy, 340 * sc * flash, o.actorCap(0.65) * Math.min(1, flash));
    for (let i = 0; i < 5; i++) {
      const ang = (i / 5) * Math.PI * 2 - Math.PI / 2;
      o.sprite('spark4', i % 2 ? s.second : s.accent, T.cx + Math.cos(ang) * 120 * sc * outExpo((t - 0.34) / 0.3), T.cy + Math.sin(ang) * 110 * sc * outExpo((t - 0.34) / 0.3), 54 * sc * flash, 0.9 * Math.min(1, flash), ang);
    }
  }
  parts(o.n(24), 532, 0.3, 0.36, t, (p, age) => {
    spark(o, { ox: T.cx, oy: T.cy, ang: p.a * Math.PI * 2, dist: (100 + 220 * p.b) * sc, life: 0.5, age, grav: 200 * k, thick: 4.4 * k, col: p.i % 3 ? s.spark : s.main });
    if (p.i % 3 === 0 && age < 0.5) o.sprite('tri', p.i % 2 ? s.second : s.main, T.cx + Math.cos(p.a * 6.28) * (60 + 150 * p.b) * sc * outExpo(age / 0.5), T.cy + Math.sin(p.a * 6.28) * (60 + 130 * p.b) * sc * outExpo(age / 0.5), 22 * sc, 1 - age / 0.5, p.a * 9 + age * 7);
  });
  o.add = false;
}
