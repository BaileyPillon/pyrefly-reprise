/**
 * The 2x art tier (D-315, Bailey 2026-10-01 "all your recommendations"; both games, shared plumbing).
 *
 * 52 battle figures ship a twice-resolution master of their idle (or, for Sin and Evrae, of the
 * state they stand in) as `characters/<id>/<state>@2x.png` beside the approved 1x painting, which
 * is never overwritten. A device that can use the detail gets the master; a phone keeps the 1x
 * file, so its download and texture-memory budget hold:
 *
 * - **phone tier** (never 2x): the phone battle layout (an upright window under 600 px), or a
 *   coarse pointer on a screen whose short side is under 600 px (a phone held sideways);
 * - **2x** otherwise, when the viewport is at least 1280 CSS px wide or the pixel ratio is above 1.
 *
 * Decided once per session, from the device, with no setting (the brief: "automatic by device").
 * Only the *pixels* change: `PaintedArt` keeps reading the 1x sidecar and keeps every URL, cache
 * key and pose comparison on the 1x name, so the plane, its baseline, scale, facing and every pose
 * test (`paintedPoses`, `lacksKoPainting`) are exactly what they were. A 2x file that fails to
 * load falls back to the 1x painting. The manifest lists the masters per subject (`states2x`,
 * `tools/gen/manifest.mjs`), so a figure without one is never asked for it.
 */
import { logicalArtUrl, shippedArtUrl } from './ArtShipped.ts';
import { manifestKnowsAsset } from './ArtManifest.ts';

/** What the tier is decided from. */
export interface TierEnv {
  /** True on the phone tier (see the file header). */
  phone: boolean;
  /** Viewport width, CSS px. */
  width: number;
  /** Device pixel ratio. */
  dpr: number;
}

/** The narrowest viewport, CSS px, that takes the 2x masters at a pixel ratio of 1. */
export const HI_TIER_MIN_WIDTH = 1280;

/** The phone battle layout's own query (`ui/common/phoneBattle.ts` PHONE_BATTLE_QUERY). */
const PHONE_QUERY = '(max-width: 599px) and (orientation: portrait)';

/** Should this device load the 2x masters? Pure. */
export function wantsHiTier(env: TierEnv): boolean {
  if (env.phone) return false;
  return env.width >= HI_TIER_MIN_WIDTH || env.dpr > 1;
}

interface TierGlobals {
  innerWidth?: number;
  devicePixelRatio?: number;
  screen?: { width: number; height: number };
  matchMedia?: (q: string) => { matches: boolean };
}

/** Read the tier's inputs from a window-like object; anything missing reads as a 1x desktop. */
export function readTierEnv(g: TierGlobals = globalThis as TierGlobals): TierEnv {
  const mm = (q: string): boolean => {
    try {
      return typeof g.matchMedia === 'function' && g.matchMedia(q).matches === true;
    } catch {
      return false;
    }
  };
  const short = g.screen ? Math.min(g.screen.width, g.screen.height) : Infinity;
  const phone = mm(PHONE_QUERY) || (mm('(pointer: coarse)') && short < 600);
  return { phone, width: typeof g.innerWidth === 'number' ? g.innerWidth : 0, dpr: typeof g.devicePixelRatio === 'number' ? g.devicePixelRatio : 1 };
}

let decided: boolean | null = null;

/** This session's tier (decided on first use). */
export function hiTier(): boolean {
  if (decided === null) decided = wantsHiTier(readTierEnv());
  return decided;
}

/** Pin the tier (tests, and the debug API); `null` decides again from the device on next use. */
export function setHiTier(value: boolean | null): void {
  decided = value;
}

const CHARACTER_PNG = /(\/art\/characters\/[^/?#]+\/)([A-Za-z0-9][A-Za-z0-9_-]*)\.png((?:[?#].*)?)$/;

/**
 * `.../characters/<id>/<state>.png` -> `.../<state>@2x.png`; null for anything else.
 * Either form of the 1x URL is read (a derived `.webp` is its PNG's name, `ArtShipped.ts`), and the answer is the URL the
 * site serves for the master, because the next thing done with it is to load it.
 */
export function hiResUrl(url: string): string | null {
  const logical = logicalArtUrl(url);
  const m = CHARACTER_PNG.exec(logical);
  return m ? shippedArtUrl(`${logical.slice(0, m.index)}${m[1]}${m[2]}@2x.png${m[3]}`) : null;
}

/** The file whose pixels a painting at `url` is drawn from on this device: the 2x master when there is one. */
export async function pixelUrlFor(url: string): Promise<string> {
  if (!hiTier()) return url;
  const hi = hiResUrl(url);
  return hi && (await manifestKnowsAsset(hi)) === true ? hi : url;
}
