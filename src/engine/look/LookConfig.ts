/**
 * Demo looks (dev flag only; nothing ships): three alternative looks for the conference demo, `?look=hd2d|cinematic|anime`, built as a post layer over
 * the existing renderer (`LookRig.ts`). Default (no flag) is today's look, byte for byte: nothing here runs.
 *
 * Game case: BOTH games (shared plumbing). The grade of each room follows its painting's own palette, so an FFX room and an FFX-2 room each get their own
 * colour; no game data is touched. This file is pure (no DOM, no `three`): the address parsing, the three presets as data, the quality tiers.
 *
 * - `?look=hd2d`       Octopath-like diorama: tilt-shift depth of field that keeps the fighters crisp, soft bloom, light shafts from the backdrop's own light,
 *                      floating motes, a warm/cool grade, a gentle vignette.
 * - `?look=cinematic`  painterly, Expedition-33-like: a strong colour grade per chapter, drifting fog between backdrop and fighters, a key-coloured rim on the
 *                      silhouettes, film grain, a trace of chromatic aberration, a deeper vignette.
 * - `?look=anime`      crisp: higher saturation and contrast, clean sharpening, a thin ink outline round every figure, bloom on effects only, no grain, no blur.
 * - `?lookq=high|medium|low` the quality switch (also `F7` while a look flag is in the address, and `__pyrefly.look.quality()`); `F6` cycles the looks live.
 */

import { isTreatedChapter } from '../motion/DemoGate.ts';

export type LookName = 'hd2d' | 'cinematic' | 'anime';
export const LOOK_NAMES: readonly LookName[] = ['hd2d', 'cinematic', 'anime'];
export type LookQuality = 'high' | 'medium' | 'low';
export const LOOK_QUALITIES: readonly LookQuality[] = ['high', 'medium', 'low'];

/** Debug views for captures: the figure mask (the frame's alpha) as a picture. */
export type LookDebug = 'mask' | null;

/** `?lookstrength=bold`: the conference strength of hd2d and cinematic (`LookBoldConfig.ts`); the default is the first pass's values, untouched. */
export type LookStrength = 'subtle' | 'bold';

/**
 * RELEASE 60 (the conference demo build; Bailey, 2026-10-20 ~11:00 EDT, "HD-2D bold (Recommended)"): with NO `look` key in the address, hd2d at bold strength is ON in the two chapters authored for it, Chapter I
 * (`seymour-flux`, FFX, Gagazet) and Chapter IV (`ffx2-bahamut`, FFX-2, the Bevelle underground), and every other chapter keeps today's frame. The rooms are keyed by CHAPTER, not by scene: three other
 * chapters borrow those two paintings as placeholders and are not authored for the look. `?look=off` turns it off everywhere; `?look=hd2d&lookstrength=bold` (or any `?look=`) forces the address's choice everywhere.
 */
export const CHAPTER_LOOKS: Readonly<Record<string, { name: LookName; strength: LookStrength }>> = {
  'seymour-flux': { name: 'hd2d', strength: 'bold' },
  // Release 69 (`booth-ffx-yunalesca`; the same word of Bailey's; FFX only): Chapter II, Lady Yunalesca in the Zanarkand Dome. Played only while the treatment reaches the chapter, like the rows above.
  yunalesca: { name: 'hd2d', strength: 'bold' },
  // Batch 3a (`booth-ffx-b3a`, release 71; the same word of Bailey's; FFX only): Chapter VII (Seymour and Anima, the Macalania antechamber), Chapter IX (Yojimbo, the Cavern of the Stolen Fayth) and Chapter X (Seymour Natus, the Highbridge of Bevelle). Played only while the treatment reaches the chapter.
  'seymour-anima-macalania': { name: 'hd2d', strength: 'bold' },
  'yojimbo-cavern': { name: 'hd2d', strength: 'bold' },
  'seymour-natus': { name: 'hd2d', strength: 'bold' },
  'ffx2-bahamut': { name: 'hd2d', strength: 'bold' },
  // Release 69 (`booth-leblanc`; Bailey 2026-10-30: the booth treatment for every listed chapter, Leblanc first; FFX-2 only): Chapter VI, the Chateau's last room. The row plays only while the treatment reaches the chapter (`?treated=pack` puts release 68's frame back).
  'ffx2-leblanc': { name: 'hd2d', strength: 'bold' },
  // Batch 2 (`booth-ffx2-b2`, FFX-2 only; Bailey 2026-10-30): Chapter V (the Heart of the Farplane), Chapter XV (the Den of Woe) and Chapter XI (the Road to the Farplane). Same rule: played only while the treatment reaches the chapter.
  'ffx2-vegnagun-shuyin': { name: 'hd2d', strength: 'bold' },
  'ffx2-den-of-woe': { name: 'hd2d', strength: 'bold' },
  'ffx2-fallen-aeons': { name: 'hd2d', strength: 'bold' },
};

/** The look a chapter plays with no `look` key in the address, or null (today's frame): a row of {@link CHAPTER_LOOKS} for a chapter the treatment reaches (`DemoGate.isTreatedChapter`, piece `hd2d`). */
export function chapterLook(chapterId: string | undefined): { name: LookName; strength: LookStrength } | null {
  return chapterId !== undefined && Object.prototype.hasOwnProperty.call(CHAPTER_LOOKS, chapterId) && isTreatedChapter(chapterId, 'hd2d') ? CHAPTER_LOOKS[chapterId]! : null;
}

export interface LookRequest {
  /** True when the address carries a `look` key at all (even `off`): the live hotkeys and the API are armed. */
  armed: boolean;
  /** True when the address has no `look` key: each chapter plays its own default ({@link CHAPTER_LOOKS}); a `look` key (even `off`) is the address's word everywhere. */
  auto: boolean;
  name: LookName | null;
  quality: LookQuality;
  debug: LookDebug;
  strength: LookStrength;
  /** `?lookdrift=1`: the backdrop's very slow idle drift (the battle camera's grammar is its own approved test, so it is its own flag). */
  drift: boolean;
}

/** `?look=` and friends from a search string. Anything unknown is ignored; no flag is today's look. */
export function parseLook(search: string): LookRequest {
  let p: URLSearchParams;
  try {
    p = new URLSearchParams(search);
  } catch {
    return { armed: false, auto: true, name: null, quality: 'high', debug: null, strength: 'subtle', drift: false };
  }
  const rawKey = p.get('look');
  const v = (rawKey ?? '').trim().toLowerCase();
  // pro-look lane: `?look=pro` and `?look=today` are the pro switch's words (`look/pro/ProSwitch.ts`), not a look named by hand: with them the chapter's own default look plays.
  const raw = v === 'pro' || v === 'today' ? null : rawKey;
  const name = (LOOK_NAMES as readonly string[]).includes(v) ? (v as LookName) : null;
  const q = (p.get('lookq') ?? '').trim().toLowerCase();
  const quality = (LOOK_QUALITIES as readonly string[]).includes(q) ? (q as LookQuality) : 'high';
  const strength: LookStrength = (p.get('lookstrength') ?? '').trim().toLowerCase() === 'bold' ? 'bold' : 'subtle';
  return { armed: raw !== null, auto: raw === null, name, quality, debug: p.get('lookdebug') === 'mask' ? 'mask' : null, strength, drift: p.get('lookdrift') === '1' };
}

/** The next look in the F6 cycle: off, hd2d, cinematic, anime, off. */
export function nextLook(cur: LookName | null): LookName | null {
  if (cur === null) return LOOK_NAMES[0]!;
  const i = LOOK_NAMES.indexOf(cur);
  return i + 1 < LOOK_NAMES.length ? LOOK_NAMES[i + 1]! : null;
}

/** The next quality in the F7 cycle: high, medium, low, high. */
export function nextQuality(cur: LookQuality): LookQuality {
  return LOOK_QUALITIES[(LOOK_QUALITIES.indexOf(cur) + 1) % LOOK_QUALITIES.length]!;
}

export type Rgb = [number, number, number];

/** What one quality tier costs: taps and layers (the shader is built with these as constants). */
export interface QualityCost {
  /** Taps per axis in the mask-aware blur (0 = the blur passes are off and the stock tilt-shift stays). */
  blurTaps: number;
  shaftSamples: number;
  moteLayers: number;
  fogOctaves: number;
  /** Ring taps in the outline / rim edge detector. */
  edgeTaps: number;
  /** Chromatic aberration kept (it costs two extra texture reads). */
  ca: boolean;
}

export const QUALITY_COST: Readonly<Record<LookQuality, QualityCost>> = {
  high: { blurTaps: 13, shaftSamples: 40, moteLayers: 3, fogOctaves: 4, edgeTaps: 16, ca: true },
  medium: { blurTaps: 9, shaftSamples: 24, moteLayers: 2, fogOctaves: 3, edgeTaps: 10, ca: true },
  low: { blurTaps: 0, shaftSamples: 12, moteLayers: 1, fogOctaves: 2, edgeTaps: 6, ca: false },
};

/** One look, as data. Every number is in "frame at 900 px high" units where it is a length in pixels; the rig scales it to the real frame. */
export interface LookParams {
  /** The mask-aware tilt-shift (`LookBlur`): blur radius in px at 900p above (`far`) and below (`near`) the sharp band; the band is centred on `focus` (0 bottom .. 1 top). */
  blur: { far: number; near: number; focus: number; band: number; falloff: number; bokeh: number };
  /** The shafts: strength, reach (frame heights), the luma a pixel must pass to throw light, the per-sample decay, how beam-like they are (0 smooth .. 1 beams). */
  shaft: { gain: number; reach: number; threshold: number; decay: number; rays: number; freq?: number };
  /** The motes: strength, size in px at 900p, drift speed; bold adds a soft glow round each (0 = none) and how many cells carry one (0.4 = today's). */
  motes: { gain: number; size: number; speed: number; glow?: number; density?: number };
  /** The fog: how much of the backdrop it veils (0..1), drift speed, how far it climbs the frame (0..1 from the bottom), how much of it reaches a figure's feet. */
  fog: { density: number; speed: number; height: number; onFigures: number };
  /** The rim on silhouettes: strength, width in px at 900p, how strongly it follows the side the light comes from (0 even all round .. 1 only the lit side). */
  rim: { gain: number; width: number; lit: number };
  /** The ink outline: width in px at 900p, strength, ink colour (linear). */
  outline: { width: number; strength: number; ink: Rgb };
  /** Clean sharpening (unsharp mask) strength, 0 = none. */
  sharpen: number;
  /** Chromatic aberration at the frame corner, px at 900p. */
  ca: number;
  /** The figures' own light, in the same linear space they are drawn in: gain (tint) and a lift. A painted figure stays itself; this only seats it in the room. */
  figure: { gain: Rgb; lift: Rgb; contrast: number };
  /** The grade (`GradeShader`): the look LUT's mix, the vignette added to the palette's, its radius, the grain (0 = none), saturation multiplier and how far figures keep their own colour. */
  grade: { lookAmount: number; vignetteAdd: number; vignetteRadius: number; vignetteTint: Rgb; grain: number; grainFps: number; grainSize: number; saturation: number; figureTrue: number };
  /** The bloom (`UnrealBloomPass` with the selective bright-pass): threshold, strength, radius, and the tint of the light. */
  bloom: { threshold: number; strength: number; radius: number; tint: Rgb; selective: boolean };
  /** The stock tilt-shift's strength (px) while this look is on: 0 hands the depth of field to `LookBlur`. */
  tiltMaxBlur: number;
  /** Eye-candy sub-effects this look switches off (`EyeCandy.setSub`), and dial multipliers it sets (`EyeCandy.setDial`), while it is on. */
  policy: { subOff: readonly string[]; dials: Readonly<Record<string, number>> };
}

const NO_FOG = { density: 0, speed: 0, height: 0, onFigures: 0 };
const NO_RIM = { gain: 0, width: 1, lit: 0.5 };
const NO_OUTLINE = { width: 0, strength: 0, ink: [0, 0, 0] as Rgb };
const NO_SHAFT = { gain: 0, reach: 0.8, threshold: 0.5, decay: 0.96, rays: 0.5 };
const NO_MOTES = { gain: 0, size: 3, speed: 1 };
const NO_BLUR = { far: 0, near: 0, focus: 0.36, band: 0.2, falloff: 1.5, bokeh: 0 };

export const LOOKS: Readonly<Record<LookName, LookParams>> = {
  hd2d: {
    blur: { far: 10, near: 7, focus: 0.38, band: 0.2, falloff: 1.45, bokeh: 1.8 },
    shaft: { gain: 0.5, reach: 0.95, threshold: 0.5, decay: 0.965, rays: 0.55 },
    motes: { gain: 0.75, size: 3.0, speed: 1 },
    fog: NO_FOG,
    rim: NO_RIM,
    outline: NO_OUTLINE,
    sharpen: 0,
    ca: 0,
    figure: { gain: [1.03, 1.0, 0.96], lift: [0, 0, 0], contrast: 0.06 },
    grade: { lookAmount: 1, vignetteAdd: 0.1, vignetteRadius: 0.72, vignetteTint: [0.05, 0.05, 0.1], grain: 0, grainFps: 0, grainSize: 1, saturation: 1.12, figureTrue: 0.85 },
    bloom: { threshold: 0.6, strength: 0.9, radius: 0.8, tint: [1.08, 1.0, 0.9], selective: true },
    tiltMaxBlur: 0,
    policy: { subOff: ['dof', 'shafts', 'streaks', 'look'], dials: { haze: 0.5, focus: 0.4 } },
  },
  cinematic: {
    blur: { far: 3.4, near: 2.4, focus: 0.4, band: 0.26, falloff: 1.6, bokeh: 0 },
    shaft: NO_SHAFT,
    motes: NO_MOTES,
    fog: { density: 0.85, speed: 1, height: 0.7, onFigures: 0.3 },
    rim: { gain: 1.05, width: 1.7, lit: 0.8 },
    outline: NO_OUTLINE,
    sharpen: 0.12,
    ca: 0.9,
    figure: { gain: [1.05, 1.04, 1.06], lift: [0, 0.002, 0.006], contrast: 0.1 },
    grade: { lookAmount: 1, vignetteAdd: 0.42, vignetteRadius: 0.56, vignetteTint: [0.01, 0.025, 0.05], grain: 0.055, grainFps: 24, grainSize: 1.35, saturation: 0.9, figureTrue: 0.6 },
    bloom: { threshold: 0.72, strength: 0.6, radius: 0.6, tint: [1.0, 0.96, 0.9], selective: true },
    tiltMaxBlur: 0,
    policy: { subOff: ['dof', 'shafts', 'streaks', 'look', 'rim'], dials: { haze: 0.35 } },
  },
  anime: {
    blur: NO_BLUR,
    shaft: NO_SHAFT,
    motes: NO_MOTES,
    fog: NO_FOG,
    rim: NO_RIM,
    outline: { width: 1.9, strength: 0.95, ink: [0.012, 0.01, 0.02] },
    sharpen: 0.8,
    ca: 0,
    figure: { gain: [1.04, 1.04, 1.04], lift: [0, 0, 0], contrast: 0.12 },
    grade: { lookAmount: 1, vignetteAdd: 0, vignetteRadius: 0.9, vignetteTint: [0, 0, 0], grain: 0, grainFps: 0, grainSize: 1, saturation: 1.12, figureTrue: 0.9 },
    bloom: { threshold: 1.0, strength: 0.4, radius: 0.35, tint: [1, 1, 1], selective: false },
    tiltMaxBlur: 0,
    policy: { subOff: ['dof', 'shafts', 'streaks', 'look', 'rim', 'focus'], dials: { haze: 0, focus: 0 } },
  },
};
