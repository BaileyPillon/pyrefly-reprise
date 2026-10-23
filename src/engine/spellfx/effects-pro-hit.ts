/**
 * THE PHYSICAL HIT, "INK AND LIGHT" (conference demo, lane "pro-look"; Bailey 2026-10-22, hits "Ink and light": an ink brush stroke with a luminous core per weapon, a cross glint at contact, ink drops with a
 * gold rim, sparks, one shock ring; options book G24 B). Drawn for the demo chapters with the pro look's `hits` piece on (`engine/look/pro/ProSwitch.ts`), in place of the fx lane's `hitWeapon`
 * (`effects-painted-hit.ts`), through the same `FxDrawList` calls, so it obeys the same budgets, REDUCE FLASHES rules, quality tiers and the painted finish (the brush's torn edge and bristle streaks).
 *
 * Layers, in order: (1) the INK, normal blend, a deep indigo (FFX) or plum (FFX-2) brush stroke laid across the target along the weapon's own arc (it draws on from -70 to +70 ms around contact, then lingers and
 * dry-brushes away to +720 ms); (2) the LIGHT, additive, a thin luminous core that rides the stroke's spine, leads it and fades by +260 ms (gold in FFX, pink in FFX-2); (3) the cross glint at contact (a long thin
 * horizontal flare and a short vertical one); (4) ink drops flung away from the attacker, each a gold (pink) dab with a darker dab on it so a rim of colour shows, and bright eased sparks; (5) one thin shock
 * ring on the floor. The stroke follows the weapon (`SparkWeapon.ts`, the recorded set's own table): a sweep for a sword, a long thin one for a katana, a heavy chop for a greatsword, two short crossed cuts for
 * daggers, three parallel claw strokes, a straight thrust for a spear, a tracer for a gun, a round splat for the blitzball, petals for a doll; a boss's blow is the heavy sweep.
 *
 * Sourced vs [ours]. The clock is the same as `hitWeapon`'s and sourced as there (the mark stays 0.3 s, as today's: the numeral's own signal; FFX-2's first-hit frames, `src/data/ffx2/action-frames.ts`). Every
 * SHAPE and COLOUR is [ours] (no official footage shows an ordinary weapon hit: `docs/handoff/motion-fx-reference.md` section 2.3); the timings are the options book's dials (`hit-fx/NOTES.md`), not measured from retail.
 *
 * Game case (rule 14): both games, two skins: FFX indigo ink with a gold core and round sparks, FFX-2 plum ink with a pink core and four-point sparkles. Pure: no `three`, no DOM.
 */
import type { FxDrawList } from './FxDrawList.ts';
import { HIT_MARK, sparkKind, type SparkKind } from './effects-painted-hit.ts';
import { pop, shockRing, spark } from './effects-painted-kit.ts';
import type { FxTarget } from './effects-shared.ts';
import { clamp, env, outCubic, outExpo, parts, pulse } from './fxMath.ts';

/** The pro hit lives longer than the fx lane's 0.85 s: the ink lingers to 720 ms after contact. The spec's end for the hit (`SpellFxFresh.ts`). */
export const INK_HIT_END = HIT_MARK + 0.76;

/** The two skins: the ink, its lighter edge, the light of the core, and the colour of a drop's rim. */
interface Skin {
  ink: string;
  inkEdge: string;
  core: string;
  rim: string;
  spark: readonly string[];
}
const SKIN_FFX: Skin = { ink: '#0d0a2c', inkEdge: '#2b2a78', core: '#FFD66B', rim: '#E3B94A', spark: ['#FFFFFF', '#FFE9A8', '#E3B94A'] };
const SKIN_FFX2: Skin = { ink: '#240a30', inkEdge: '#5b2270', core: '#FF9FD2', rim: '#F7B6D9', spark: ['#FFFFFF', '#FFD6EC', '#F7B6D9'] };
const skinOf = (o: FxDrawList): Skin => (o.game === 'ffx2' ? SKIN_FFX2 : SKIN_FFX);

/** How an angle goes for the blow's direction: the book's arcs are for a blow going left to right, mirrored for the other way. */
const flip = (o: FxDrawList, a: number): number => (o.dir > 0 ? a : Math.PI - a);

/**
 * One brush stroke along an arc of the weapon: the ink (two normal-blend bands, the edge a little wider and lighter under the body), then the light (two additive bands: the core and a hot white spine).
 * `t0` is when the head starts to sweep and `dur` how long it takes; the ink lingers and dry-brushes away, the light leads and is gone sooner.
 */
function strokeArc(o: FxDrawList, T: FxTarget, sk: Skin, t: number, cx: number, cy: number, t0: number, dur: number, a0: number, a1: number, R: number, thick: number): void {
  const prog = clamp((t - t0) / dur);
  if (prog <= 0) return;
  const aEnd = a0 + (a1 - a0) * outCubic(prog);
  const th = thick * T.sc;
  const inkA = env(t, t0, HIT_MARK + 0.72, 0.03, 0.42);
  const coreA = env(t, t0, HIT_MARK + 0.26, 0.02, 0.18);
  const was = o.add;
  o.add = false;
  if (inkA > 0) {
    o.arc(cx, cy, R, flip(o, a0), flip(o, aEnd), th * 3.6, sk.inkEdge, 0.6 * inkA);
    o.arc(cx, cy, R, flip(o, a0), flip(o, aEnd), th * 2.6, sk.ink, 0.96 * inkA);
  }
  o.add = true;
  if (coreA > 0) {
    o.arc(cx, cy, R, flip(o, a0), flip(o, aEnd), th * 0.8, sk.core, 0.9 * coreA);
    o.arc(cx, cy, R, flip(o, a0), flip(o, aEnd), th * 0.26, '#FFFFFF', coreA);
  }
  o.add = was;
}

/** A straight stroke (a spear's thrust, a gun's tracer): the ink as a thick capsule, the light as a thin one through it. */
function strokeLine(o: FxDrawList, sk: Skin, t: number, t0: number, dur: number, a: readonly [number, number], b: readonly [number, number], thick: number): void {
  const u = clamp((t - t0) / dur);
  if (u <= 0) return;
  const head: [number, number] = [a[0] + (b[0] - a[0]) * outCubic(u), a[1] + (b[1] - a[1]) * outCubic(u)];
  const inkA = env(t, t0, HIT_MARK + 0.72, 0.03, 0.42);
  const coreA = env(t, t0, HIT_MARK + 0.26, 0.02, 0.18);
  const was = o.add;
  o.add = false;
  if (inkA > 0) {
    o.bar(a[0], a[1], head[0], head[1], thick * 1.9, sk.inkEdge, 0.6 * inkA);
    o.bar(a[0], a[1], head[0], head[1], thick * 1.3, sk.ink, 0.96 * inkA);
  }
  o.add = true;
  if (coreA > 0) {
    o.bar(a[0], a[1], head[0], head[1], thick * 0.5, sk.core, 0.9 * coreA);
    o.bar(a[0], a[1], head[0], head[1], thick * 0.17, '#FFFFFF', coreA);
  }
  o.add = was;
}

/** The cross glint at contact: a long thin horizontal flare and a short vertical one, a hot white heart. REDUCE FLASHES caps the bloom under it (`FxDrawList.bloom`). */
function glint(o: FxDrawList, T: FxTarget, sk: Skin, t: number, x: number, y: number, size: number): void {
  const f = pop(t, HIT_MARK, 0.06, 0.2);
  if (f <= 0) return;
  const was = o.add;
  o.add = true;
  const s = size * T.sc * f;
  o.quad('spark4', '#FFFFFF', x, y, s * 2.5, s * 0.4, Math.min(1, f) * 0.95);
  o.quad('spark4', sk.core, x, y, s * 0.4, s * 1.8, Math.min(1, f) * 0.85);
  o.sprite('glow', sk.core, x, y, s * 1.5, o.actorCap(0.55) * Math.min(1, f));
  o.sprite('mote', '#FFFFFF', x, y, s * 0.55, Math.min(1, f));
  o.add = was;
}

/** The ink drops flung away from the attacker: each a rim-coloured dab with a darker one on it, so a rim of gold (pink) shows; they decelerate on an eased path and fall a little. */
function drops(o: FxDrawList, T: FxTarget, sk: Skin, t: number, x: number, y: number, n: number, dist: number, size: number, grav: number): void {
  const base = o.dir > 0 ? 0 : Math.PI;
  const was = o.add;
  parts(o.n(n), 81, HIT_MARK, HIT_MARK + 0.04, t, (p, age) => {
    const life = 0.46 + 0.3 * p.c;
    const u = age / life;
    if (u >= 1) return;
    const ang = base + (p.a - 0.5) * 2 * 1.05 - 0.3;
    const e = outExpo(u);
    const d = (0.35 + 0.9 * p.b) * dist * T.sc;
    const px = x + Math.cos(ang) * d * e;
    const py = y + Math.sin(ang) * d * e + grav * T.k * age * age;
    const s = size * 0.8 * T.sc * (0.55 + 0.7 * p.d) * (1 - 0.35 * u);
    const a = 1 - u * u;
    o.add = false;
    o.sprite('dab', sk.rim, px, py, s * 1.32, 0.95 * a);
    o.sprite('dab', sk.ink, px, py, s * 0.9, 0.98 * a);
  });
  o.add = was;
}

/** Bright eased sparks away from the attacker (round motes in FFX, four-point sparkles in FFX-2). */
function sparks(o: FxDrawList, T: FxTarget, sk: Skin, t: number, x: number, y: number, n: number, dist: number, thick: number, spread: number, grav: number): void {
  const base = o.dir > 0 ? 0 : Math.PI;
  const was = o.add;
  o.add = true;
  parts(o.n(n), 83, HIT_MARK, HIT_MARK + 0.03, t, (p, age) => {
    const ang = base + (p.a - 0.5) * 2 * spread - 0.18;
    spark(o, { ox: x, oy: y, ang, dist: (0.55 + 0.9 * p.b) * dist * 0.85 * T.sc, life: 0.3 + 0.26 * p.c, age, grav: grav * T.k, thick: thick * 1.4 * T.k * (0.7 + 0.6 * p.d), col: sk.spark[p.i % sk.spark.length]!, alpha: 0.98 });
    if (o.game === 'ffx2' && p.i % 3 === 0 && age < 0.42) o.sprite('spark4', sk.spark[(p.i + 1) % sk.spark.length]!, x + Math.cos(ang) * dist * T.sc * (0.5 + 0.7 * p.b) * outExpo(age / 0.4), y + Math.sin(ang) * dist * T.sc * (0.5 + 0.7 * p.b) * outExpo(age / 0.4), 20 * T.sc, 1 - age / 0.42);
  });
  o.add = was;
}

/** The one thin shock ring on the floor under the target. */
function ring(o: FxDrawList, T: FxTarget, sk: Skin, t: number, r1: number): void {
  const was = o.add;
  o.add = true;
  shockRing(o, T.fx, T.fy, t, HIT_MARK, 0.5, 12 * T.sc, r1 * T.sc, 3.2 * T.k, sk.core, 0.62);
  o.add = was;
}

/** A round splat of ink (the blitzball's blow, a blunt strike): a rim-coloured disc with a darker one on it, then a short burst of drops. */
function splat(o: FxDrawList, T: FxTarget, sk: Skin, t: number, x: number, y: number, size: number): void {
  const f = pop(t, HIT_MARK - 0.04, 0.08, 0.5);
  if (f <= 0) return;
  const was = o.add;
  o.add = false;
  const a = env(t, HIT_MARK - 0.04, HIT_MARK + 0.72, 0.04, 0.42);
  o.sprite('dab', sk.inkEdge, x, y, size * 1.7 * T.sc * f, 0.6 * a);
  o.sprite('dab', sk.ink, x, y, size * 1.25 * T.sc * f, 0.96 * a);
  o.add = true;
  o.sprite('dab', sk.core, x, y, size * 0.5 * T.sc * f, 0.9 * env(t, HIT_MARK - 0.04, HIT_MARK + 0.26, 0.02, 0.18));
  o.add = was;
}

/** The new physical hit, "Ink and light": `o.variant` names the weapon (`sparkKind`), `o.dir` the way the blow goes (1 = left to right). */
export function hitInk(o: FxDrawList, t: number, T: FxTarget): void {
  const sk = skinOf(o);
  const kind: SparkKind = sparkKind(o.variant);
  const x = T.cx - o.dir * T.w * 0.14;
  const y = T.cy;
  const sc = T.sc;
  switch (kind) {
    case 'sword':
      strokeArc(o, T, sk, t, T.cx, T.cy, 0.23, 0.14, -2.5, 0.2, 150 * sc, 24);
      glint(o, T, sk, t, x, y, 110);
      drops(o, T, sk, t, x, y, 7, 360, 26, 520);
      sparks(o, T, sk, t, x, y, 14, 420, 3.2, 1.0, 650);
      ring(o, T, sk, t, 150);
      break;
    case 'katana':
      strokeArc(o, T, sk, t, T.cx, T.cy, 0.23, 0.12, -2.7, 0.4, 175 * sc, 15);
      glint(o, T, sk, t, x, y, 100);
      drops(o, T, sk, t, x, y, 5, 340, 20, 480);
      sparks(o, T, sk, t, x, y, 12, 480, 2.6, 0.8, 520);
      ring(o, T, sk, t, 130);
      break;
    case 'greatsword':
      strokeArc(o, T, sk, t, T.cx, T.cy, 0.21, 0.17, -2.6, 0.5, 160 * sc, 38);
      glint(o, T, sk, t, x, y, 150);
      drops(o, T, sk, t, x, y, 10, 380, 34, 640);
      sparks(o, T, sk, t, x, y, 10, 360, 4.8, 1.2, 800);
      ring(o, T, sk, t, 210);
      break;
    case 'dagger':
      strokeArc(o, T, sk, t, T.cx, T.cy - 20 * sc, 0.23, 0.1, -2.3, -0.4, 95 * sc, 16);
      strokeArc(o, T, sk, t, T.cx, T.cy + 18 * sc, 0.28, 0.1, 0.4, 2.3, 95 * sc, 16);
      glint(o, T, sk, t, x, y, 90);
      drops(o, T, sk, t, x, y, 5, 300, 18, 460);
      sparks(o, T, sk, t, x, y, 12, 320, 2.2, 1.3, 500);
      ring(o, T, sk, t, 110);
      break;
    case 'claw':
      for (let i = -1; i <= 1; i++) strokeArc(o, T, sk, t, T.cx, T.cy + i * 26 * sc, 0.23 + (i + 1) * 0.015, 0.1, -2.35, -0.25, 140 * sc, 12);
      glint(o, T, sk, t, x, y, 100);
      drops(o, T, sk, t, x, y, 6, 360, 18, 480);
      sparks(o, T, sk, t, x, y, 12, 400, 2.4, 0.9, 520);
      ring(o, T, sk, t, 120);
      break;
    case 'spear':
      strokeLine(o, sk, t, 0.24, 0.1, [x - o.dir * T.w * 1.1, y + 6 * sc], [x + o.dir * T.w * 0.45, y - 4 * sc], 13 * T.k);
      glint(o, T, sk, t, x, y, 100);
      drops(o, T, sk, t, x, y, 5, 380, 20, 360);
      sparks(o, T, sk, t, x, y, 10, 480, 2.8, 0.45, 300);
      ring(o, T, sk, t, 110);
      break;
    case 'staff':
      strokeArc(o, T, sk, t, T.cx, T.cy, 0.24, 0.12, -2.1, -0.1, 105 * sc, 28);
      splat(o, T, sk, t, x, y, 70);
      glint(o, T, sk, t, x, y, 90);
      drops(o, T, sk, t, x, y, 7, 300, 22, 380);
      sparks(o, T, sk, t, x, y, 9, 280, 3.4, 1.5, 380);
      ring(o, T, sk, t, 130);
      break;
    case 'blitzball':
      splat(o, T, sk, t, x, y, 90);
      glint(o, T, sk, t, x, y, 100);
      drops(o, T, sk, t, x, y, 8, 330, 24, 420);
      sparks(o, T, sk, t, x, y, 14, 340, 3, Math.PI, 420);
      ring(o, T, sk, t, 130);
      break;
    case 'doll':
      splat(o, T, sk, t, x, y, 60);
      parts(o.n(9), 85, HIT_MARK, HIT_MARK + 0.04, t, (p, age) => {
        const ang = p.a * Math.PI * 2;
        const u = clamp(age / 0.5);
        const was = o.add;
        o.add = false;
        o.sprite('dab', sk.rim, x + Math.cos(ang) * 110 * sc * outCubic(u), y + Math.sin(ang) * 90 * sc * outCubic(u), (22 + 14 * p.b) * sc * 1.3 * (1 - 0.4 * u), 0.9 * (1 - u * u));
        o.sprite('dab', sk.ink, x + Math.cos(ang) * 110 * sc * outCubic(u), y + Math.sin(ang) * 90 * sc * outCubic(u), (22 + 14 * p.b) * sc * 0.9 * (1 - 0.4 * u), 0.96 * (1 - u * u));
        o.add = was;
      });
      glint(o, T, sk, t, x, y, 80);
      sparks(o, T, sk, t, x, y, 8, 260, 2.6, Math.PI, 300);
      ring(o, T, sk, t, 100);
      break;
    case 'gun':
      strokeLine(o, sk, t, 0.24, 0.06, [x - o.dir * T.w * 1.4, y], [x - o.dir * T.w * 0.1, y], 7 * T.k);
      glint(o, T, sk, t, x, y, 90);
      drops(o, T, sk, t, x, y, 4, 280, 16, 380);
      sparks(o, T, sk, t, x, y, 10, 300, 2.4, 0.7, 380);
      ring(o, T, sk, t, 90);
      break;
    default:
      // Anyone else's blow (a boss's): the heavy sweep.
      strokeArc(o, T, sk, t, T.cx, T.cy, 0.22, 0.14, -2.5, 0.2, 150 * sc, 32);
      glint(o, T, sk, t, x, y, 130);
      drops(o, T, sk, t, x, y, 9, 380, 30, 560);
      sparks(o, T, sk, t, x, y, 18, 440, 3.4, 1.1, 700);
      ring(o, T, sk, t, 190);
      break;
  }
  o.add = false;
  o.wash(0, '#FFFFFF', 0.06 * pulse(t, HIT_MARK + 0.01, 0.1)); // a quiet beat of light at the instant of contact; REDUCE FLASHES filters it
}
