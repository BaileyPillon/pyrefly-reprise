/**
 * REDUCE FLASHES (ACCESSIBILITY tab, PR-0032; Bailey, 2026-10-12, "OPT-B with NO-KEYS", answered with
 * "I'll go with all of your recommendations"): how soft "softens" is, as pure functions.
 *
 * No DOM and no `three`, so vitest runs it in Node and `engine/BattlePresenter*.ts` keeps its layering
 * (AGENTS.md hard rule 1). The setting is read where the flash is drawn (`PaintedStage.screenFlash`,
 * `PaintedActor.flash`, the bloom, the cutscene stage, the HUD stylesheets), never by the engine: no
 * event, no timing and no number of `src/battle/**` changes, and the golden logs do not move.
 *
 * The rule, from the round's page (D-220 Q7, `docs/plans/accessibility-review.md` section 9, and the
 * five rules already in the code: `spellfx/SpellFxParams.ts`, `fx/c/SpectacleRules.ts`,
 * `fx/a/LensFlare.ts`, `fx/c/SpellMoments.ts`, `PhaseLighting.ts`): a flash gets a lower peak and
 * never a full white frame; its duration is left as it is.
 *
 * - a screen wash peaks at {@link FLASH_PEAK_CAP} (35 %) and pure white becomes warm ivory;
 * - a flash on a fighter, and the bloom at a blow, peak at 0.35 too, and only an action's first blow flashes;
 * - a **dark** flash (a dimming: the defeat wash, the knock-out fall flash) is not bright, so it stays;
 * - a **cover** (a white wash of {@link COVER_MS} or longer that hides a swap under it: the Save Sphere,
 *   a scene change in a cutscene) stays opaque so the swap stays hidden, but in a dim ivory at the same
 *   35 % brightness instead of white, and fades out as before.
 *
 * Game case: both (shared plumbing). Which sources belong to which game is in `docs/handoff/r44-access.md`
 * and in `tests/unit/flash-sources.test.ts`, one case per source.
 */

/** The brightest any flash may be under REDUCE FLASHES, as a share of full strength (D-220 Q7: "35 %"). */
export const FLASH_PEAK_CAP = 0.35;

/** What pure white becomes: the warm ivory `REDUCED_FLASH_PARAMS.whiteWashTo` already uses. */
export const IVORY = '#FFF1D6';
export const IVORY_INT = 0xfff1d6;

/** Ivory at 35 % brightness over black: the colour of a cover under REDUCE FLASHES (opaque, so it still hides the swap). */
export const DIM_IVORY = '#59544B';

/** A white wash this long or longer is a cover that hides a swap (the Save Sphere's 520 ms in is the shortest the code has; the cutscene covers run 900 and 1200 ms). */
export const COVER_MS = 600;

/** Under this relative luminance (0..1, linear) a flash is a dimming, not a bright flash, and is left alone. 0x4a5a78, the knock-out fall flash, is 0.10. */
export const DARK_LUMINANCE = 0.15;

/** A channel at or above this is "white" (the same line `SpellFxParams.filterWash` draws: all three at 0xe0 or more). */
const WHITE_CHANNEL = 0xe0;

export interface Rgba {
  r: number;
  g: number;
  b: number;
  /** 0..1 */
  a: number;
}

/** `#rgb`, `#rrggbb`, `rgb(r,g,b)` or `rgba(r,g,b,a)`; null for anything else (`transparent`, a name). */
export function parseCssColour(c: string): Rgba | null {
  const s = c.trim().toLowerCase();
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/.exec(s);
  if (hex) {
    const h = hex[1]!.length === 3 ? hex[1]!.replace(/./g, '$&$&') : hex[1]!;
    return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16), a: 1 };
  }
  const fn = /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)$/.exec(s);
  if (fn) return { r: Number(fn[1]), g: Number(fn[2]), b: Number(fn[3]), a: fn[4] === undefined ? 1 : Number(fn[4]) };
  return null;
}

const lin = (c: number): number => {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
};

/** Relative luminance, 0..1 (WCAG's: linear light, Rec. 709 weights). */
export function luminanceOf(r: number, g: number, b: number): number {
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/** True for a dark colour: a dimming, which REDUCE FLASHES leaves alone. */
export function isDarkColour(c: Pick<Rgba, 'r' | 'g' | 'b'>): boolean {
  return luminanceOf(c.r, c.g, c.b) < DARK_LUMINANCE;
}

/** True when all three channels are at or above 0xe0: white or near it. */
export function isWhiteish(c: Pick<Rgba, 'r' | 'g' | 'b'>): boolean {
  return c.r >= WHITE_CHANNEL && c.g >= WHITE_CHANNEL && c.b >= WHITE_CHANNEL;
}

/** `colour` with white turned ivory, alpha kept; any other colour exactly as given. */
function ivoryIfWhite(colour: string, c: Rgba): string {
  if (!isWhiteish(c)) return colour;
  return c.a >= 1 ? IVORY : `rgba(255, 241, 214, ${c.a})`;
}

// ------------------------------------------------------------------ screen washes

/** A wash after the rule: the colour to paint and the opacity it starts from (it fades to 0 over the wash's own ms). */
export interface SoftWash {
  colour: string;
  opacity: number;
}

/**
 * `PaintedStage.screenFlash(colour, ms)` under REDUCE FLASHES. Without the setting the stage never calls this
 * and paints exactly what it always painted (the colour as given, opacity 1).
 *
 * - dark (the defeat dim, a fade to black), or a colour this cannot read: unchanged;
 * - white (all channels at or above 0xe0) of {@link COVER_MS} or longer and at least 90 % alpha: a cover, so
 *   {@link DIM_IVORY} at opacity 1;
 * - anything else: the colour (white turns {@link IVORY}) at an opacity that puts its effective peak
 *   (alpha times opacity) at {@link FLASH_PEAK_CAP}, or leaves it where it is when it is already under.
 */
export function softWash(colour: string, ms: number): SoftWash {
  const c = parseCssColour(colour);
  if (!c || isDarkColour(c)) return { colour, opacity: 1 };
  if (isWhiteish(c) && ms >= COVER_MS && c.a >= 0.9) return { colour: DIM_IVORY, opacity: 1 };
  return { colour: ivoryIfWhite(colour, c), opacity: Math.min(1, FLASH_PEAK_CAP / Math.max(c.a, FLASH_PEAK_CAP)) };
}

// ------------------------------------------------------------------ flashes on a fighter

/** `PaintedActor.flash`'s three numbers after the rule. `ms` is never changed. */
export interface SoftActorFlash {
  colour: number | string;
  ms: number;
  peak: number;
}

const intOf = (colour: number | string): Rgba | null =>
  typeof colour === 'number' ? { r: (colour >> 16) & 255, g: (colour >> 8) & 255, b: colour & 255, a: 1 } : parseCssColour(colour);

/**
 * A flash on a fighter under REDUCE FLASHES: the peak is capped at {@link FLASH_PEAK_CAP}, white turns ivory,
 * the duration stays. A dark flash (the knock-out fall) or a colour this cannot read passes through.
 */
export function softActorFlash(colour: number | string, ms: number, peak: number): SoftActorFlash {
  const c = intOf(colour);
  if (!c || isDarkColour(c)) return { colour, ms, peak };
  return { colour: isWhiteish(c) ? IVORY_INT : colour, ms, peak: Math.min(peak, FLASH_PEAK_CAP) };
}

/** The bloom at a blow (`ImpactFlash`): its peak opacity under REDUCE FLASHES (the stage passes it as the cap). */
export const SOFT_BLOOM_CAP = FLASH_PEAK_CAP;

/**
 * Does this blow flash under REDUCE FLASHES? Only an action's first blow does: a twelve-hit Attack Reels would
 * otherwise fire twelve flashes and twelve blooms. Both the fighter's flash and the bloom ask.
 */
export function blowFlashes(hitIndex: number, reduce: boolean): boolean {
  return !reduce || !(hitIndex > 0);
}

// ------------------------------------------------------------------ cutscene flashes

/** What a cutscene's `flash(ms, colour)` step draws: the background and the opacity it starts from. */
export interface CutsceneFlash {
  background: string;
  peak: number;
}

/** The cutscene flash as it has always been: the step's colour (white by default), 70 % to start with. */
export const CUTSCENE_FLASH_PEAK = 0.7;

/**
 * `CutsceneStage.flash(colour, ms)`. Off: unchanged. REDUCE FLASHES: a dark colour passes through; white of
 * {@link COVER_MS} or longer (the Shuyin cannon's 900 ms, Sinspawn Gui's 1200 ms over a scene swap) is a cover,
 * {@link DIM_IVORY} at opacity 1; anything else peaks at 35 % with white turned ivory.
 */
export function cutsceneFlash(colour: string | undefined, ms: number, reduce: boolean): CutsceneFlash {
  const background = colour ?? '#ffffff';
  if (!reduce) return { background, peak: CUTSCENE_FLASH_PEAK };
  const c = parseCssColour(background);
  if (!c || isDarkColour(c)) return { background, peak: CUTSCENE_FLASH_PEAK };
  if (isWhiteish(c) && ms >= COVER_MS) return { background: DIM_IVORY, peak: 1 };
  return { background: ivoryIfWhite(background, c), peak: Math.min(CUTSCENE_FLASH_PEAK, FLASH_PEAK_CAP) };
}
