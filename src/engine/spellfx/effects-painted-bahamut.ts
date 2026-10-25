/**
 * Bahamut's moves, a boss's charge and Rikku's Darkness, drawn for Chapter IV with the new effects on (motion pass, lane "fx", step 3; `FxSwitch.ts`). Game case: **FFX-2 only** (Chapter IV). The
 * charge (`gather`) is both games' (`effects-painted-od.ts` re-skins it for Chapter I).
 *
 * **What is sourced and what is [ours].**
 * - Darkness is the one Chapter IV ability with a read shape (`docs/handoff/motion-fx-reference.md` section 3.1, Square Enix JP's FFX-2 battle short, V4 33.0 to 35.5 s, frames every 0.25 s): the
 *   sword raised with a pink-violet glow at its tip and a thin violet bolt from the top of the frame; a flat elliptical ring of pale pink-white light at the caster's feet as she swings; about ten
 *   black spheres, fist-sized to head-sized, bursting out of the floor; a violet-pink fog band at the floor; the arena darkening under a violet-black wash for about half a second with a
 *   red-orange glow line along the ground; a second thin violet bolt; pink sparkles at the target's chest; the spheres hanging at its sides; a dark ellipse of shadow under the caster. The footage
 *   shows about 2 s from the raise to the fall; the research measures 83 steps (2.76 s) from release (`src/data/ffx2/action-frames.ts`). The draw keeps the order and the colours and compresses the
 *   timeline: the mark is 0.82 s, so a Darkness that lands every turn costs 0.82 s of the presenter's time, not 2.76 (FFX-2's ATB does not wait for it in any case).
 * - The black spheres and thin dark-blue lightning are "the dark family's motif" (a second dark spell in the same footage uses them, V4 33.0 s): Curse and Impulse borrow the motif, nothing more.
 * - Curse "darkens the cursed character's model" (`research/ffx2-bahamut.md` line 292, interpretive); the aura before an enemy's magic is "an aura around the enemy while it charges"
 *   (`research/ffx2-combat-core.md` line 3243, a single source); the countdown's "escalating charge at the chest" is the repo's own art note (`research/ffx2-bahamut.md` line 964, interpretive).
 * - Every SHAPE of Curse, Impulse and the charge is [ours]: no research file or official video shows them.
 * Colours are the corruption read of `research/ffx2-bahamut.md` (violet and indigo, cold violet-white pyreflies) and Mega Flare's own palette (`effects-specials.ts`).
 *
 * Pure: no `three`, no DOM.
 */

import type { FxDrawList } from './FxDrawList.ts';
import { SC_MAX, pop, shockRing, spark, stroke, type Pt } from './effects-painted-kit.ts';
import type { FxTarget } from './effects-shared.ts';
import { clamp, env, inCubic, inQuad, lerp, outCubic, outExpo, outQuad, outQuart, parts, rng } from './fxMath.ts';

const VIOLET = '#B048F0';
const DEEP = '#7A2ED8';
const PALE = '#D8B8FF';
const COLD = '#B8E4FF';
const BLACK = '#0A0614';
const PINK = '#F7B6D9';
const WHITE = '#FFFFFF';
const EMBER = '#FF6A3A';

/** Bahamut's chest, where Mega Flare gathers (`effects-specials.ts`). */
export const chestOf = (T: FxTarget): Pt => [T.cx - 20 * T.sc, T.cy - T.h * 0.12];

/** A thin jagged bolt from (x0, y0) to (x1, y1): nine segments, deterministic per seed, a violet body and a white core. */
export function bolt(o: FxDrawList, x0: number, y0: number, x1: number, y1: number, seed: number, k: number, a: number, jitter: number): void {
  if (a <= 0.01) return;
  const r = rng(seed);
  const pts: Pt[] = [[x0, y0]];
  for (let i = 1; i < 9; i++) pts.push([lerp(x0, x1, i / 9) + (r() - 0.5) * jitter, lerp(y0, y1, i / 9) + (r() - 0.5) * jitter * 0.3]);
  pts.push([x1, y1]);
  const was = o.add;
  o.add = true;
  for (let i = 1; i < pts.length; i++) {
    stroke(o, DEEP, pts[i - 1]!, pts[i]!, 15 * k, a * 0.8);
    stroke(o, WHITE, pts[i - 1]!, pts[i]!, 5 * k, a);
  }
  o.add = was;
}

/** A black sphere with a violet rim: normal blend (it is dark), so it sits over the floor and under the light. */
export function sphere(o: FxDrawList, x: number, y: number, size: number, a: number, k: number): void {
  if (a <= 0.01 || size <= 1) return;
  const was = o.add;
  o.add = false;
  o.sprite('orb', BLACK, x, y, size, 0.95 * a);
  o.ring(x, y, size * 0.5, Math.max(1.2, 2.2 * k), DEEP, 0.75 * a, 1);
  o.add = was;
}

// ---------------------------------------------------------------- Curse

export const CURSE_MARK = 0.55;
export const CURSE_END = 2.0;

/** Curse: black spheres rise out of the floor round the girl, thin violet bolts strike, a violet fog lies at her feet and the light round her goes dark. One random girl, status only. */
export function curse(o: FxDrawList, t: number, T: FxTarget): void {
  const sc = Math.min(T.sc, SC_MAX);
  const k = T.k;
  o.dim('#0A0414', T.cx, T.cy, 1700 * k, 1700 * k, 0.7 * Math.min(1, o.dens) * env(t, 0.12, 1.7, 0.35, 0.5));
  o.add = true;
  const fog = env(t, 0.06, 1.8, 0.25, 0.6);
  o.decal(T.fx, T.fy, 200 * sc, DEEP, 0.5 * fog, 0.3);
  o.decal(T.fx, T.fy + 6 * sc, 140 * sc, PINK, 0.22 * fog, 0.3);
  shockRing(o, T.fx, T.fy, t, 0.1, 0.7, 30 * sc, 240 * sc, 4 * k, PALE, 0.75);
  o.add = false;
  // The spheres: born in turn out of the floor on an eased rise, they hang and drift, then sink and go.
  parts(o.n(9), 401, 0.12, 0.5, t, (p, age) => {
    const rise = outCubic(age / 0.45);
    const ang = p.a * Math.PI * 2;
    const rad = (65 + 95 * p.b) * sc;
    const x = T.fx + Math.cos(ang) * rad;
    const baseY = T.fy + Math.sin(ang) * rad * 0.22;
    const y = baseY - rise * (30 + 110 * p.c) * sc - Math.sin(age * 2.2 + p.i) * 6 * sc + inQuad(clamp((age - 1.1) / 0.5)) * 40 * sc;
    const life = clamp(age / 0.08) * clamp((1.75 - (age + 0.12 + p.a * 0.38)) / 0.35);
    sphere(o, x, y, (24 + 38 * p.d) * sc * (0.55 + 0.45 * rise), life, k);
  });
  bolt(o, T.cx + 40 * sc, T.y - 420 * k, T.cx, T.cy - T.h * 0.2, 411, k, pop(t, 0.2, 0.05, 0.12), 60 * sc);
  bolt(o, T.cx - 50 * sc, T.y - 420 * k, T.cx + 8 * sc, T.cy, 412, k, pop(t, 0.5, 0.05, 0.12), 60 * sc);
  o.add = true;
  const mark = pop(t, CURSE_MARK, 0.14, 0.4);
  if (mark > 0) o.sprite('glow', VIOLET, T.cx, T.cy, 340 * sc * mark, o.actorCap(0.7) * Math.min(1, mark));
  // Violet wisps wind up the body: the cold pyreflies of the corruption.
  parts(o.n(16), 402, 0.3, 1.0, t, (p, age) => {
    const u = age / 0.9;
    if (u > 1) return;
    const e = outQuad(u);
    const ang = p.a * Math.PI * 2 + e * 4;
    o.sprite('dab', p.i % 2 ? PALE : VIOLET, T.cx + Math.cos(ang) * T.w * 0.4, T.fy - (0.08 + 0.7 * e) * T.h, 11 * sc, 0.9 * Math.sin(u * Math.PI));
  });
  o.add = false;
}

// ---------------------------------------------------------------- Impulse

export const IMPULSE_MARK = 0.8;
export const IMPULSE_END = 2.0;

/**
 * Impulse (a GROUP effect: drawn on Bahamut, landing on the girls' centre): a violet aura stands round him while he charges (`research/ffx2-combat-core.md` line 3243), then a wavefront of pale
 * violet light runs from his chest across the party; each girl takes a ring, a flash and a fan of sparks as it passes. All three girls, magical.
 */
export function impulse(o: FxDrawList, t: number, T: FxTarget): void {
  const sc = Math.min(T.sc, SC_MAX);
  const k = T.k;
  const c = chestOf(T);
  const P = T.party ?? { x: T.cx - 500 * k, y: T.cy + 360 * k };
  const reach = Math.hypot(P.x - c[0], P.y - c[1]);
  const face = Math.atan2(P.y - c[1], P.x - c[0]);
  o.add = true;
  // The aura: an outline glow round the whole figure, pulsing, with motes rising off it.
  const aura = env(t, 0, 0.62, 0.2, 0.2);
  if (aura > 0) {
    const pulse = 0.85 + 0.15 * Math.sin(t * 22);
    o.sprite('glow', DEEP, T.cx, T.cy, T.h * 1.35 * pulse, 0.55 * aura);
    o.sprite('glow', VIOLET, c[0], c[1], T.h * 0.5 * pulse, 0.7 * aura);
    parts(o.n(14), 421, 0, 0.5, t, (p, age) => {
      const u = age / 0.5;
      o.sprite('dab', p.i % 2 ? PALE : VIOLET, T.cx + (p.a - 0.5) * T.w * 0.9, T.fy - (0.1 + 0.6 * p.b) * T.h - outQuad(u) * 90 * sc, 12 * sc, 0.9 * Math.sin(clamp(u) * Math.PI));
    });
  }
  // The wavefront: an arc of light facing the party, widening and thinning as it goes, with a pale ring behind it.
  const run = (t - 0.4) / 0.42;
  if (run > 0 && run < 1.35) {
    const R = reach * 1.18 * outQuad(run);
    const fade = clamp(1.35 - run) * clamp(run / 0.1);
    for (const [w, col, a] of [[70, DEEP, 0.4], [34, PALE, 0.75], [10, WHITE, 1]] as const) {
      o.arc(c[0], c[1], R, face - 0.62, face + 0.62, w * sc * (1 - 0.35 * clamp(run)), col, a * fade, 1);
    }
    o.sprite('glow', VIOLET, c[0] + Math.cos(face) * R, c[1] + Math.sin(face) * R, 200 * sc, 0.45 * fade);
  }
  // Each girl takes the wave as it reaches her: a ring, a flash, a fan of sparks.
  for (const [i, m] of (T.members ?? []).entries()) {
    const mx = m.x + m.w / 2;
    const my = m.y + m.h * 0.45;
    const msc = Math.min(m.h / 360, SC_MAX);
    const t0 = 0.4 + 0.42 * (Math.hypot(mx - c[0], my - c[1]) / (reach * 1.18)) - 0.02;
    const arrive = Math.min(IMPULSE_MARK, t0 + 0.02);
    const flash = pop(t, arrive, 0.12, 0.4);
    if (flash > 0) o.sprite('glow', PALE, mx, my, 330 * msc * flash, o.actorCap(0.7) * Math.min(1, flash));
    shockRing(o, mx, my, t, arrive, 0.55, 20 * msc, m.h * 0.7, 6 * k, WHITE, 0.9, 1);
    shockRing(o, m.x + m.w / 2, m.y + m.h * 0.97, t, arrive + 0.03, 0.7, 30 * msc, 220 * msc, 4 * k, VIOLET, 0.8);
    parts(o.n(9), 431 + i, arrive, arrive + 0.03, t, (p, age) => {
      spark(o, { ox: mx, oy: my, ang: p.a * Math.PI * 2, dist: (70 + 150 * p.b) * msc, life: 0.42, age, thick: 3.8 * k, col: p.i % 2 ? WHITE : PALE });
      if (o.game === 'ffx2' && p.i % 3 === 0 && age < 0.45) o.sprite('spark4', PINK, mx + Math.cos(p.a * 6.28) * 60 * msc * outExpo(age / 0.4), my + Math.sin(p.a * 6.28) * 50 * msc * outExpo(age / 0.4), 24 * msc, 1 - age / 0.45);
    });
  }
  o.add = false;
  o.wash(0, '#E8D8FF', 0.2 * clamp(1 - Math.abs(t - IMPULSE_MARK) / 0.12));
}

// ---------------------------------------------------------------- the charge

export const GATHER_MARK = 0.2;
export const GATHER_END = 1.0;

/**
 * A boss charging: motes pulled into its chest, a core that swells and pulses faster the higher the level (1 to 5), a ring closing on it, and at levels 3 and up a pulse on the floor. The level
 * is passed as the copy's variant: FFX-2's Bahamut counts 5, 4, 3, 2 and a last 1 before Mega Flare, so the level is `6 - number` (the escalating charge at the chest is the repo's own art note,
 * `research/ffx2-bahamut.md` line 964); FFX's Mortiorchis climbs the Total Annihilation ladder (stage 1 is level 2, stage 2 level 4). Skins: FFX-2 violet with Mega Flare's cold core; FFX
 * violet edged in gold.
 */
export function gather(o: FxDrawList, t: number, T: FxTarget): void {
  const sc = Math.min(T.sc, SC_MAX);
  const k = T.k;
  const L = clamp(Number(o.variant) || 1, 1, 5);
  const c = chestOf(T);
  const rim = o.game === 'ffx2' ? DEEP : '#C9A24A';
  const core = o.game === 'ffx2' ? COLD : '#FFF0C0';
  if (L >= 3) o.dim('#07030F', c[0], c[1], 1700 * k, 1700 * k, 0.14 * L * Math.min(1, o.dens) * env(t, 0.02, 0.9, 0.2, 0.3));
  o.add = true;
  const live = env(t, 0, 0.95, 0.12, 0.25);
  const beat = 1 + 0.13 * Math.sin(t * (13 + 4 * L));
  o.sprite('glow', rim, c[0], c[1], (110 + 60 * L) * sc * beat, (0.4 + 0.08 * L) * live);
  o.sprite('glow', VIOLET, c[0], c[1], (60 + 36 * L) * sc * beat, (0.55 + 0.06 * L) * live);
  o.sprite('glow', core, c[0], c[1], (26 + 16 * L) * sc * beat, 0.95 * live);
  shockRing(o, c[0], c[1], t, 0.05, 0.7, (240 + 30 * L) * sc, 40 * sc, 3.6 * k, PALE, 0.7, 1);
  if (L >= 3) shockRing(o, T.fx, T.fy, t, 0.15, 0.8, 40 * sc, (150 + 40 * L) * sc, 3.6 * k, rim, 0.7);
  parts(o.n(5 + 4 * L), 441, 0, 0.5, t, (p, age) => {
    const life = 0.45;
    const u = inCubic(age / life);
    if (age > life) return;
    const ang = p.a * Math.PI * 2;
    const r0 = (150 + 180 * p.b) * sc;
    o.sprite(o.bit, p.c > 0.4 ? VIOLET : PALE, lerp(c[0] + Math.cos(ang) * r0, c[0], u), lerp(c[1] + Math.sin(ang) * r0 * 0.7, c[1], u), (o.game === 'ffx2' ? 26 : 13) * sc, 0.4 + 0.6 * u);
  });
  if (L >= 4) {
    for (let i = 0; i < 5; i++) {
      const x = T.fx + (i - 2) * T.w * 0.2;
      stroke(o, PALE, [x, T.fy], [x + (i - 2) * 5 * k, T.fy - (110 + 70 * ((i * 3) % 4)) * sc * outQuart((t - 0.1) / 0.4)], 5 * k, 0.7 * live);
    }
  }
  const fin = pop(t, 0.62, 0.1, 0.3);
  if (fin > 0) o.sprite('glow', core, c[0], c[1], (140 + 40 * L) * sc * fin, o.actorCap(0.6 + 0.05 * L) * Math.min(1, fin));
  o.add = false;
}

// ---------------------------------------------------------------- Darkness

export const DARKNESS_MARK = 0.82;
export const DARKNESS_END = 1.75;

/**
 * Darkness (Rikku, Dark Knight; a GROUP effect: drawn from the caster and landing on every foe): see the file header for what is read from the footage. The order is the footage's: sword glow,
 * the first bolt, the swing and the flat ring at her feet, the spheres bursting from the floor under the foe, the red-orange line along the ground and the dark, the second bolt, the pink
 * sparkles at the mark, the light coming back with the spheres still hanging. The footage's 1.5 s from the raise to the numeral is run in 0.82 s here [ours; a pace choice, see the header].
 */
export function darkness(o: FxDrawList, t: number, T: FxTarget): void {
  const sc = Math.min(T.sc, SC_MAX);
  const k = T.k;
  const dir = T.party && T.party.x < T.cx ? -1 : 1; // she faces her foes
  const tip: Pt = [T.cx + dir * T.w * 0.42, T.cy - T.h * 0.42];
  const foes = T.members && T.members.length ? T.members : [{ x: (T.party?.x ?? T.cx) - 80, y: (T.party?.y ?? T.cy) - 200, w: 160, h: 270 }];
  // The caster: a pink-violet glow gathering at the sword's tip, a bolt from the top of the frame to it.
  o.add = true;
  const raise = env(t, 0, 0.4, 0.15, 0.1);
  o.sprite('glow', PINK, tip[0], tip[1], 120 * sc * (0.7 + 0.3 * Math.sin(t * 18)), 0.8 * raise);
  o.sprite('glow', DEEP, tip[0], tip[1], 200 * sc, 0.5 * raise);
  bolt(o, tip[0] + 10 * sc, T.y - 440 * k, tip[0], tip[1], 451, k, pop(t, 0.15, 0.04, 0.09), 50 * sc);
  // The swing: the flat ring of pale pink-white at her feet.
  shockRing(o, T.fx, T.fy, t, 0.3, 0.55, 30 * sc, 300 * sc, 6 * k, '#FFE8F4', 0.9);
  shockRing(o, T.fx, T.fy, t, 0.34, 0.5, 24 * sc, 220 * sc, 3 * k, PINK, 0.7);
  o.add = false;
  // Her shadow on the floor once the dark is in.
  o.decal(T.fx, T.fy, 160 * sc, BLACK, 0.45 * env(t, 0.6, 1.5, 0.2, 0.3), 0.3);
  for (const [fi, f] of foes.entries()) {
    const fsc = Math.min(f.h / 360, SC_MAX);
    const fx = f.x + f.w / 2;
    const fy = f.y + f.h * 0.97;
    const cy = f.y + f.h * 0.45;
    // The dark: a heavy vignette round the foe for about half a second, the fog band and the red-orange line along the ground.
    o.dim('#10061C', fx, cy, 1700 * k, 1700 * k, 0.8 * Math.min(1, o.dens) * env(t, 0.42, 0.98, 0.08, 0.3));
    o.add = true;
    o.decal(fx, fy, 220 * fsc, DEEP, 0.5 * env(t, 0.36, 1.7, 0.2, 0.35), 0.3);
    o.decal(fx, fy + 5 * fsc, 160 * fsc, PINK, 0.25 * env(t, 0.4, 1.6, 0.2, 0.35), 0.3);
    const line = env(t, 0.45, 0.95, 0.05, 0.25);
    if (line > 0) {
      const w = 460 * fsc * outExpo((t - 0.45) / 0.2);
      stroke(o, EMBER, [fx - w / 2, fy], [fx + w / 2, fy], 13 * k, 0.9 * line);
      stroke(o, '#FFC8A0', [fx - w * 0.3, fy], [fx + w * 0.3, fy], 5 * k, line);
    }
    bolt(o, fx + 30 * fsc, f.y - 400 * k, fx, cy - f.h * 0.15, 461 + fi, k, pop(t, 0.62, 0.04, 0.09), 60 * fsc);
    // The mark: pink sparkles burst at the chest, a flash, the numeral lands.
    const flash = pop(t, DARKNESS_MARK, 0.12, 0.4);
    if (flash > 0) o.sprite('glow', PINK, fx, cy - f.h * 0.1, 300 * fsc * flash, o.actorCap(0.8) * Math.min(1, flash));
    parts(o.n(12), 471 + fi, DARKNESS_MARK, DARKNESS_MARK + 0.05, t, (p, age) => {
      o.sprite('spark4', p.i % 2 ? WHITE : PINK, fx + Math.cos(p.a * 6.28) * (30 + 110 * p.b) * fsc * outExpo(age / 0.4), cy - f.h * 0.1 + Math.sin(p.a * 6.28) * (30 + 90 * p.b) * fsc * outExpo(age / 0.4) - age * 60 * fsc, (22 + 20 * p.c) * fsc, clamp(1 - age / 0.6));
    });
    o.add = false;
    // The spheres burst out of the floor round the foe, hang at its sides and go as the light returns.
    parts(o.n(10), 481 + fi, 0.38, 0.55, t, (p, age) => {
      const burst = outCubic(age / 0.25);
      const ang = p.a * Math.PI * 2;
      const rad = (50 + 120 * p.b) * fsc;
      const x = fx + Math.cos(ang) * rad;
      const y = fy + Math.sin(ang) * rad * 0.22 - burst * (50 + 150 * p.c) * fsc - Math.sin(age * 2.4 + p.i) * 5 * fsc;
      const life = clamp(age / 0.05) * clamp((1.5 - age - 0.38) / 0.3);
      sphere(o, x, y, (26 + 44 * p.d) * fsc * (0.5 + 0.5 * burst), life, k);
    });
  }
}
