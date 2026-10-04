/**
 * The art tiers: which file's pixels a painting is drawn from (D-315, release 35; widened by release 39, "r39-hires-engine";
 * both games, shared plumbing).
 *
 * A painting's approved 1x file (`characters/<id>/<state>.png`, `backdrops/<key>.png`) is never overwritten. Beside it a master
 * may ship, `<name>@2x.png`, `@3x.png`, `@4x.png`: the same painting at that many times the size, same geometry and the same
 * silhouette (`tools/hires-install.mjs`). The manifest lists them (`tiers`, `backdropTiers`), so a painting without one is never
 * asked for it. Only the *pixels* change: `PaintedArt` keeps reading the 1x sidecar and keeps every URL, cache key and pose
 * comparison on the 1x name, so the plane, its baseline, scale, facing and every pose test are exactly what they were.
 *
 * Which master a painting loads at is a question of **magnification** (`ArtBudget.ts`): the standard camera at 1440p never draws
 * a figure above 0.95 pixels per texel, so under 1440p the 1x file is all anyone can see; from 1440p up the 2x master loads
 * first so a held shot starts sharp, and `ArtGovernor.ts` asks for 3x and 4x the moment a figure is on screen magnified past
 * one texel per pixel, within the device's budget (`ArtDevice.ts`). A master that fails to load falls back to the next one down.
 *
 * Decided from the device and the camera, with no setting and no save key (the brief: "automatic by device").
 */
import { logicalArtUrl, shippedArtUrl } from './ArtShipped.ts';
import { artManifest, loadArtManifest } from './ArtManifest.ts';
import { scalesOf } from './ArtManifestTiers.ts';
import { artBudget, bufferWidth, forcedArtScale, type TierEnv } from './ArtDevice.ts';
import { backdropScaleFor, baseScale, pickScale } from './ArtBudget.ts';

export { readTierEnv, type TierEnv } from './ArtDevice.ts';

/** The narrowest viewport, CSS px, that took the 2x masters at a pixel ratio of 1 (release 35's rule, kept for the tests). */
export const HI_TIER_MIN_WIDTH = 1280;

/** Should this device load the 2x masters on release 35's rule? Pure. The engine now asks `ArtBudget`; this stays for `setHiTier`'s tests. */
export function wantsHiTier(env: TierEnv): boolean {
  if (env.phone) return false;
  return env.width >= HI_TIER_MIN_WIDTH || env.dpr > 1;
}

let decided: boolean | null = null;

/** Release 35's session switch: `false` pins every painting to its 1x file, `true` to at least the 2x master; `null` is the budget's call. */
export function hiTier(): boolean | null {
  return decided;
}

/** Pin the tier (tests, and the debug API); `null` goes back to the budget. */
export function setHiTier(value: boolean | null): void {
  decided = value;
}

const CHARACTER_PNG = /(\/art\/characters\/[^/?#]+\/)([A-Za-z0-9][A-Za-z0-9_-]*)\.png((?:[?#].*)?)$/;
const BACKDROP_PNG = /(\/art\/backdrops\/)([A-Za-z0-9][A-Za-z0-9_-]*)\.png((?:[?#].*)?)$/;

/** What kind of tiered painting a URL names: a figure state, a backdrop, or neither. */
export function tieredKind(url: string): 'figure' | 'backdrop' | null {
  const logical = logicalArtUrl(url);
  if (CHARACTER_PNG.test(logical)) return 'figure';
  return BACKDROP_PNG.test(logical) ? 'backdrop' : null;
}

/**
 * `.../characters/<id>/<state>.png` -> `.../<state>@<scale>x.png`, and `.../backdrops/<key>.png` -> `.../<key>@<scale>x.png`; null
 * for anything else or a scale outside 2 to 4. Either form of the 1x URL is read (a derived `.webp` is its PNG's name,
 * `ArtShipped.ts`), and the answer is the URL the site serves for the master, because the next thing done with it is to load it.
 */
export function tierUrl(url: string, scale: number): string | null {
  if (!Number.isInteger(scale) || scale < 2 || scale > 4) return null;
  const logical = logicalArtUrl(url);
  const m = CHARACTER_PNG.exec(logical) ?? BACKDROP_PNG.exec(logical);
  return m ? shippedArtUrl(`${logical.slice(0, m.index)}${m[1]}${m[2]}@${scale}x.png${m[3]}`) : null;
}

/** The masters on disk beyond 1x for a figure state or a backdrop (`[2, 4]`), `[]` for none, `null` with no manifest (draw the 1x painting). */
export async function artScalesFor(url: string): Promise<readonly number[] | null> {
  const manifest = await loadArtManifest();
  return manifest ? scalesOf(manifest, url) : null;
}

/** Sync twin of {@link artScalesFor}: `null` until the manifest has loaded. */
export function artScalesForNow(url: string): readonly number[] | null {
  const manifest = artManifest();
  return manifest ? scalesOf(manifest, url) : null;
}

/** Which master a URL names: `idle@3x.png` or `idle@3x.webp` is 3, anything else (the approved painting) is 1. */
export function scaleOfUrl(url: string): number {
  const m = /@([2-4])x\.(?:png|webp)(?:$|[?#])/.exec(url);
  return m ? Number(m[1]) : 1;
}

/** The 2x master's URL (release 35's name for `tierUrl(url, 2)`). */
export function hiResUrl(url: string): string | null {
  return tierUrl(url, 2);
}

/** The scale a painting loads at before anything has measured it: a figure by the buffer's width, a backdrop by its own rule. */
export function baseScaleFor(url: string): number {
  const kind = tieredKind(url);
  if (!kind) return 1;
  if (decided === false) return 1;
  const pin = forcedArtScale();
  if (pin !== null) return pin;
  const b = artBudget();
  const want = kind === 'backdrop' ? backdropScaleFor(b, bufferWidth()) : baseScale(b, bufferWidth());
  return decided === true ? Math.max(2, want) : want;
}

/**
 * The file whose pixels a painting at `url` is drawn from on this device: the master of `wanted` times (default: the base scale),
 * or the nearest one below it that ships, or the 1x file itself.
 */
export async function pixelUrlFor(url: string, wanted?: number): Promise<string> {
  const kind = tieredKind(url);
  if (!kind || decided === false) return url;
  const available = await artScalesFor(url);
  if (!available || available.length === 0) return url;
  const b = artBudget();
  const pin = forcedArtScale();
  const cap = pin !== null ? 4 : kind === 'backdrop' ? Math.max(b.backdropScale, decided === true ? 2 : 1) : Math.max(b.maxScale, decided === true ? 2 : 1);
  const scale = pickScale(wanted ?? baseScaleFor(url), available, cap);
  return (scale > 1 ? tierUrl(url, scale) : null) ?? url;
}
