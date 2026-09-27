/**
 * The knobs of the spell effects that are not the effects themselves: how hard
 * a flash may be (REDUCE FLASHES, D-220) and how many particles a device gets.
 *
 * Game case: both. The flash rules are the accessibility-review §5.2 proposal
 * ("a full-screen wash is capped at 35 % peak with pure white tinted to warm
 * ivory, an actor flash is capped at 0.35 peak", no duration changes), plus the
 * mock's "one wash per action", which is what makes FFX-2 Holy's eight strikes
 * read as one. The setting itself is built later with the accessibility batch;
 * until then the stage runs on {@link DEFAULT_FLASH_PARAMS}, which change
 * nothing. D-220 Q7 (how soft REDUCE FLASHES is) is still open, so the reduced
 * numbers live here, in one place.
 */

export interface FlashParams {
  /** Peak opacity of a full-screen wash, 0..1. */
  washCap: number;
  /** Pure-white washes are drawn in this colour instead; null keeps white. */
  whiteWashTo: string | null;
  /** Keep only the first wash of an action (a multi-strike spell washes once). */
  oneWashPerAction: boolean;
  /** Peak opacity of the big glow laid over a figure, 0..1. */
  actorCap: number;
  /** Thunder strikes once instead of three times. */
  singleBolt: boolean;
}

/** Today: every flash as the mock draws it with REDUCE FLASHES off. */
export const DEFAULT_FLASH_PARAMS: Readonly<FlashParams> = Object.freeze({
  washCap: 1,
  whiteWashTo: null,
  oneWashPerAction: false,
  actorCap: 1,
  singleBolt: false,
});

/** REDUCE FLASHES on (accessibility-review §5.2 / §9 Q7 proposal). */
export const REDUCED_FLASH_PARAMS: Readonly<FlashParams> = Object.freeze({
  washCap: 0.35,
  whiteWashTo: '#FFF1D6',
  oneWashPerAction: true,
  actorCap: 0.35,
  singleBolt: true,
});

/** A wash after the rules: dropped (null), or its colour and peak. */
export function filterWash(p: Readonly<FlashParams>, id: number, col: string, a: number): { col: string; a: number } | null {
  if (p.oneWashPerAction && id > 0) return null;
  let c = col;
  if (p.whiteWashTo) {
    const r = parseInt(col.slice(1, 3), 16);
    const g = parseInt(col.slice(3, 5), 16);
    const b = parseInt(col.slice(5, 7), 16);
    if (r >= 0xe0 && g >= 0xe0 && b >= 0xe0) c = p.whiteWashTo;
  }
  return { col: c, a: Math.min(a, p.washCap) };
}

export function capActor(p: Readonly<FlashParams>, a: number): number {
  return Math.min(a, p.actorCap);
}

// ------------------------------------------------------------------ quality

/**
 * `full` is the mock's density; `phone` is 60 % of it (the density the mock's
 * option C ran at); `low` draws nothing and keeps today's bloom, as the
 * presentation plan asks of the low and reduced tiers.
 */
export type FxQuality = 'full' | 'phone' | 'low';

export const QUALITY_DENSITY: Readonly<Record<FxQuality, number>> = Object.freeze({ full: 1, phone: 0.6, low: 0 });

/** Most quads one frame may draw, all running effects together. */
export const PEAK_BUDGET: Readonly<Record<Exclude<FxQuality, 'low'>, number>> = Object.freeze({ full: 600, phone: 400 });

export function resolveFxQuality(o: { lowEffects: boolean; reduceMotion: boolean; width: number; height: number }): FxQuality {
  if (o.lowEffects || o.reduceMotion) return 'low';
  return Math.min(o.width, o.height) < 600 ? 'phone' : 'full';
}
