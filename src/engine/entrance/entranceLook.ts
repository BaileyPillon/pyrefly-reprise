/**
 * **E-PYRE: a boss or an aeon arrives as pyreflies gathering** (the look; pure, no `three`, no DOM).
 *
 * Bailey, 2026-10-12, answering the driver's list ("E-PYRE: the boss entrances"): "I'll go with all of your recommendations"
 * (decision 61e: bosses and aeons that pop in over one frame arrive as pyreflies gathering; the fallback is E-FADE, a 300 ms
 * fade-in, if the look cannot be made to read). The look is the one on the "Boss Entrance Options" page: the game's own pyrefly
 * dissolve run backwards (the figure is built from the head down behind the gold burn edge, `PaintedShader`, `dissolveSweep`) over
 * **900 ms (54 frames at 60 fps)**, with the stage's own motes. The page said "Risk: an arrival and a death could read alike", and a
 * mote that rises off the eroding edge is exactly a death's, so the motes here do the other thing: they come from the air around
 * the figure and stream **into** the burn edge, and are gone as the painting is whole.
 *
 * This file is the timing and the curves, with no game object in it, so the numbers are unit-tested and the seam (`StageEntrances.ts`)
 * is only a driver: it asks {@link chooseEntrance} what to play, {@link frameAt} what the figure shows at each moment and
 * {@link moteCount} / {@link gatherMote} for the motes.
 *
 * What the options page costed and what this adds before the first menu: nothing. The entrance plays inside the opening
 * (the party's slide-in, the hold and the boss reveal's push take about 2.3 s at normal speed) and nothing waits for it; a
 * hurried or skipped opening shows the figure at once (`instant`). REDUCE MOTION gets a plain 200 ms fade.
 *
 * Game case: **both** (shared plumbing). FFX and FFX-2 both have pyreflies, and `research/ffx-vs-ffx2-presentation.md` §3 gives the
 * same rule for both games (fiends, unsent and aeons are made of them; living people and machina are not), which is
 * `entranceCanon.ts`. It sources no entrance animation for either game ("No source describes an entrance animation ... at the start
 * of an FFX-2 battle", §2), so the look is ours in both and Bailey's pick, not canon.
 */

/** E-PYRE, the options page: "900 ms, 54 frames". */
export const GATHER_MS = 900;
/** E-FADE, the fallback of decision 61e: "300 ms, 18 frames". Used for people and machina, which are not made of pyreflies. */
export const FADE_MS = 300;
/** REDUCE MOTION: a plain short fade (D-285 gives such a player no motion that is not asked for). */
export const REDUCED_FADE_MS = 200;
/**
 * What a figure that is waiting for its entrance rests at. Under every "is it showing" line the game and its instruments draw
 * (the continuity probe and the art governor both read alpha over 0.02, so a held figure is not on the field to them) and over
 * the plane's own invisibility line (alpha 0.001, `PaintedActor.syncOpacity`), so its meshes stay in the scene and its painting
 * and shader are warm when it comes up: nothing is built or uploaded on the frame the gather starts.
 */
export const HOLD_ALPHA = 0.004;
/**
 * The share of the gather the figure's own opacity takes to come up (its shadow and ring with it): the painting itself comes up through the sweep, so this is short (about 110 ms):
 * a longer one dims the first pieces of the painting that show, which the options page's clip had at full strength from the first.
 */
export const ALPHA_RISE = 0.12;
/**
 * The sweep's shape: the dissolve level is `1 - p ** GATHER_CURVE`. The options page ran the actor's default `quadInOut` (2 in and out), which spends its last 350 ms with the
 * painting nine tenths whole: in a scene whose grade crushes a figure that is not drawn true (Overdrive Sin's deck, `figureTrue.ts`: a dissolving figure is graded like the scene, a
 * whole one shows its own colour) that is 350 ms of near-black silhouette, then a step. Slower in and faster out keeps the 900 ms and the slow first moments (the pyreflies are
 * seen to gather before the first of the painting is) and cuts the figure's last tenth to about 190 ms.
 */
export const GATHER_CURVE = 1.5;

/**
 * The gather's last frame. While the dissolve is above 0 the figure is drawn like the backdrop (normal blending, so it blooms: the burn edge's flare; and so a scene's plate
 * dim, which skips only the figures that carry the bloom mask, darkens it: Overdrive Sin's deck turns the painting nearly black for the sweep's last 300 ms), and on the frame
 * the dissolve reaches 0 it is drawn as itself again (masked, undimmed). That is a step of a third or more in the figure's brightness, the game's own for any dissolve
 * (a death's too, played the other way), and the options page's clip had it. A short gold flash lands on that frame (`PaintedActor.flash`, light added to the painting, the
 * burn edge's own colour) so the step reads as a beat, the figure catching its light, and not as a glitch.
 */
export const LAND_FLASH = { colour: 0xffe2a0, ms: 260, peak: 0.8 } as const;

export type EntranceKind = 'gather' | 'fade' | 'reduced' | 'instant';
/** Whose body is it: made of pyreflies (a fiend, an unsent, an aeon) or not (a living person, a machine). `entranceCanon.ts`. */
export type EntranceBody = 'pyrefly' | 'plain';

export interface EntranceChoice {
  kind: EntranceKind;
  /** How long it plays, ms. 0 for `instant`. */
  ms: number;
  /** The share of the full mote budget: 1, the phone's 0.6 (`PyreflyStage`'s tier) or 0 (LOW EFFECTS, or a fade). */
  density: number;
}

export interface EntranceWish {
  body: EntranceBody;
  /** REDUCE MOTION (D-285). */
  reduceMotion: boolean;
  /** LOW EFFECTS (D-285): the sweep still plays, the motes do not (as the death's erosion at that tier, `PyreflyStage`). */
  lowEffects: boolean;
  /** The phone's effects tier: 0.6 of the motes (`PyreflyStage`'s `TIER_DENSITY`). */
  phone?: boolean;
  /** The opening is hurried or skipped (a Confirm press, `'skip'` speed): no animation, the figure is just there. */
  instant: boolean;
}

/** What to play for a figure, in the order the rules are: nobody waits (instant), nobody is moved (REDUCE MOTION), nobody is dressed in a spirit it is not made of (plain), then the gather. */
export function chooseEntrance(w: EntranceWish): EntranceChoice {
  if (w.instant) return { kind: 'instant', ms: 0, density: 0 };
  if (w.reduceMotion) return { kind: 'reduced', ms: REDUCED_FADE_MS, density: 0 };
  if (w.body === 'plain') return { kind: 'fade', ms: FADE_MS, density: 0 };
  return { kind: 'gather', ms: GATHER_MS, density: w.lowEffects ? 0 : w.phone ? 0.6 : 1 };
}

const clamp01 = (t: number): number => (t < 0 ? 0 : t > 1 ? 1 : t);
const smooth = (t: number): number => {
  const x = clamp01(t);
  return x * x * (3 - 2 * x);
};

export interface EntranceFrame {
  /** The figure's own opacity (`PaintedActor.setAlpha`). */
  alpha: number;
  /** The pyrefly dissolve's level (`PaintedActor.setDissolve`): 1 is nothing drawn, 0 is the whole painting. */
  dissolve: number;
  done: boolean;
}

/**
 * What the figure shows `elapsed` ms into an entrance of `ms`.
 * The gather's dissolve is the page's own sweep (`dissolveTo(0, 900)`: the pyrefly style, the gold burn edge, from the head down), on {@link GATHER_CURVE}'s timing.
 */
export function frameAt(kind: EntranceKind, ms: number, elapsed: number): EntranceFrame {
  if (kind === 'instant' || ms <= 0 || elapsed >= ms) return { alpha: 1, dissolve: 0, done: true };
  const p = clamp01(elapsed / ms);
  if (kind === 'gather') {
    return { alpha: HOLD_ALPHA + (1 - HOLD_ALPHA) * smooth(p / ALPHA_RISE), dissolve: 1 - Math.pow(p, GATHER_CURVE), done: false };
  }
  // E-FADE was linear on the page; REDUCE MOTION's is the same shorter.
  return { alpha: HOLD_ALPHA + (1 - HOLD_ALPHA) * p, dissolve: 0, done: false };
}

// ------------------------------------------------------------------ the motes

/** Motes a second at the gather's busiest, at full density (the death's peak is 900 a second, `PyreflyStage.RELEASE_PER_S`; this runs 0.9 s, not 0.62 s, and about 500 are released in all). */
export const MOTE_PEAK_PER_S = 900;
/** The share of the gather after which no mote is released: the last ones are still on their way in, and are gone as the painting is whole. */
export const RELEASE_END = 0.85;
/** A trickle from the first frame, so the pyreflies are seen to gather before the first of the painting is. */
const RELEASE_FLOOR = 0.3;

/** The release rate at progress `p` (0..1), as a share of {@link MOTE_PEAK_PER_S}. */
export function moteShape(p: number): number {
  if (p < 0 || p >= RELEASE_END) return 0;
  return RELEASE_FLOOR + (1 - RELEASE_FLOOR) * Math.pow(Math.sin((Math.PI * p) / RELEASE_END), 1.3);
}

/**
 * How many motes the gather releases between progress `p0` and `p1` (fractional: the driver carries the remainder, as `PyreflyStage.release` does).
 * Integrated in small steps, so a long frame and a short one release what the clock says.
 */
export function moteCount(p0: number, p1: number, ms: number, density: number): number {
  if (density <= 0 || !(p1 > p0) || ms <= 0) return 0;
  const lo = Math.max(0, p0);
  const hi = Math.min(RELEASE_END, p1);
  if (!(hi > lo)) return 0;
  const steps = Math.max(1, Math.ceil((hi - lo) / 0.02));
  const dp = (hi - lo) / steps;
  let area = 0; // the integral of the shape over [lo, hi], in shares of the gather
  for (let i = 0; i < steps; i++) area += moteShape(lo + (i + 0.5) * dp) * dp;
  return area * (ms / 1000) * MOTE_PEAK_PER_S * density;
}

export type Vec3 = readonly [number, number, number];
/** Three corners of the figure's painted quad, world units: bottom left, bottom right, top left (`PaintedActor.contentQuad`'s order is bl, br, tr, tl). */
export interface QuadCorners {
  bl: Vec3;
  br: Vec3;
  tl: Vec3;
}

/** What the emitter takes (`PyreflyEmitter.MoteSpec`), without importing it: this file has no `three`. */
export interface GatherMote {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  size: number;
}

/**
 * Where the pyrefly dissolve is eating (or here, giving back) the painting at level `d`, as a span of the painting's height, 0 at the feet to 1 at the head: the
 * shader keeps a pixel when `noise * 0.56 + height * 0.44` is at least `d`, so a pixel on the edge at height `v` has the noise `(d - 0.44 v) / 0.56`, which a
 * real one has for `v` between these two. The same two lines `PyreflyStage.release` uses for the death.
 */
export function bandAt(d: number): { lo: number; hi: number } {
  return { lo: Math.max(0, Math.min(1, (d - 0.56) / 0.44)), hi: Math.max(0, Math.min(1, d / 0.44)) };
}

/** Motes live this long, s: the time to fly in. Short, so they read as streaming into the edge and not as a swarm that waits. */
export const MOTE_LIFE_S: readonly [number, number] = [0.4, 0.62];

/**
 * A mote's size is in pixels at 10 world units (`PyreflyEmitter`), so one released at a far figure would be a speck: Overdrive Sin's head is painted at depth -30 and drawn
 * 3.5 times its size, and the emitter's motes at the stage's size are 2 to 8 px there. They are drawn `distance / 14` times as large (at least as before, at most 4 times),
 * which is what a mote of the size the death releases at a figure 14 units off looks like at any distance.
 */
export function moteSizeScale(distance: number): number {
  return Math.max(1, Math.min(4, distance / 14));
}

const sub = (a: Vec3, b: Vec3): [number, number, number] => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const norm = (a: Vec3): [number, number, number] => {
  const l = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};

/**
 * One mote of the gather: it is born in the air around the figure (more of them above it, a little in front of and behind the plane) and flies straight to a
 * point on the dissolve's edge, arriving as it dies. The emitter fades a mote in and out over its life, so each one lights on the way and is gone as it reaches the
 * painting: it never rises, which is what a death's mote does and what tells the two apart.
 *
 * @param rng a 0..1 generator (seeded, so a capture replays the same motes)
 * @param q the painting's quad now
 * @param d the dissolve's level now
 * @param sizeScale {@link moteSizeScale} for the figure's distance from the camera
 */
export function gatherMote(rng: () => number, q: QuadCorners, d: number, sizeScale = 1): GatherMote {
  const { lo, hi } = bandAt(d);
  const u = 0.2 + rng() * 0.6;
  const v = Math.min(1, lo + rng() * Math.max(0.02, hi - lo)); // never above the head
  const across = sub(q.br, q.bl);
  const up = sub(q.tl, q.bl);
  const w = Math.hypot(across[0], across[1], across[2]);
  const h = Math.hypot(up[0], up[1], up[2]);
  // the target: a point of the painting on the edge, a little in front of it (as the death's are)
  const tx = q.bl[0] + across[0] * u + up[0] * v;
  const ty = q.bl[1] + across[1] * u + up[1] * v;
  const tz = q.bl[2] + across[2] * u + up[2] * v + 0.05;
  const ex = norm(across);
  const ey = norm(up);
  const ez: [number, number, number] = [ex[1] * ey[2] - ex[2] * ey[1], ex[2] * ey[0] - ex[0] * ey[2], ex[0] * ey[1] - ex[1] * ey[0]];
  // the reach follows the figure: half its width or a fifth of its height, whichever is more, so a head and a tall boss both gather from a cloud their own size
  const reach = (0.4 + 0.9 * rng()) * Math.max(0.5 * w, 0.22 * h);
  const a = rng() * Math.PI * 2;
  const ox = Math.cos(a) * reach;
  const oy = Math.sin(a) * reach * 0.8 + reach * 0.35;
  const oz = (rng() - 0.5) * 0.6 * reach;
  const sx = tx + ex[0] * ox + ey[0] * oy + ez[0] * oz;
  const sy = ty + ex[1] * ox + ey[1] * oy + ez[1] * oz;
  const sz = tz + ex[2] * ox + ey[2] * oy + ez[2] * oz;
  const life = MOTE_LIFE_S[0] + (MOTE_LIFE_S[1] - MOTE_LIFE_S[0]) * rng();
  return { x: sx, y: sy, z: sz, vx: (tx - sx) / life, vy: (ty - sy) / life, vz: (tz - sz) / life, life, size: (16 + rng() * 24) * sizeScale };
}

/** A tiny seeded generator, as `PyreflyEmitter`'s: a capture replays the same motes. */
export function entranceRng(seed: number): () => number {
  let s = seed >>> 0 || 1;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}
