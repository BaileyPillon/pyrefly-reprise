/**
 * Which painted PNGs ship as lossless WebP, and the one place that maps a master's name to the file the site serves
 * (release 38, "r38-bytes"; Bailey 2026-10-03, "I'll go with all your recommendations", ask 1 of the visual options: the
 * 800 MB line (D-332, D-344) is the strict 800,000,000 bytes of shipped files, and lossless WebP carries the same pixels in
 * about a third fewer bytes. Both games: shared build plumbing, no game content.)
 *
 * **The masters stay PNG.** `public/art/**.png` is what is approved, hashed (`docs/target/approved-hashes.json`) and backed
 * up. A production build derives a lossless WebP beside each of them in the build output and drops the PNG there
 * (`tools/art-derive.mjs`, run by the `pyrefly-art-derive` plugin in `vite.config.ts`), and proves for every file that the
 * decoded RGBA equals the master's (`node tools/art-derive.mjs verify`). The dev server and the unit tests serve the PNGs
 * themselves, so nothing here changes for them.
 *
 * **Where the mapping is applied.** The names the code keys on stay the masters' names: the art manifest, the 2x tier, the
 * pause and title stems and the pose scales all read `art/<...>.png`. Every URL the game hands to the browser comes from
 * {@link artUrl} (`PaintedArt.ts`), which asks {@link shippedArtUrl}; the few functions that read an art URL back apart
 * (`ArtManifest.ts`, `ArtTier.ts`, `KoFallback.ts`, `KoPoseScale.ts`, the face-crop and sidecar readers) first ask
 * {@link logicalArtUrl}, so they see the master's name whichever form they are given. Both functions are idempotent and leave
 * every URL that is not a derived WebP exactly as it was (the `.2x.webp` masters of the pause and title plates among them).
 *
 * **Where the list comes from.** The build inserts it as the constant `__PYREFLY_ART_WEBP__`, the master paths
 * (`art/characters/tidus/idle.png`) it shipped as WebP. Unset (dev, tests, `PYREFLY_ART_WEBP=off`) every URL maps to itself.
 *
 * The lookup is synchronous on purpose: `artUrl` is called while markup is built and before the art manifest has loaded, so a
 * mapping that waited for a fetch would hand the browser a PNG that is no longer there.
 */

/** Inserted by `tools/art-derive-plugin.mjs` (a Vite `define`): the master PNG paths this build ships as WebP. */
declare const __PYREFLY_ART_WEBP__: readonly string[] | undefined;

/** `art/<...>.png` as the path of a URL ends, with or without the base path before it. */
const ART_PNG = /(?:^|\/)(art\/.+)\.png$/;
/** The same for the derived name. */
const ART_WEBP = /(?:^|\/)(art\/.+)\.webp$/;

let forced: ReadonlySet<string> | null | undefined;
let built: ReadonlySet<string> | null | undefined;

/** The set in force: a test's own, else the build's, else `null` (every URL maps to itself). */
function shipped(): ReadonlySet<string> | null {
  if (forced !== undefined) return forced;
  if (built === undefined) {
    const list = typeof __PYREFLY_ART_WEBP__ !== 'undefined' ? __PYREFLY_ART_WEBP__ : undefined;
    built = list && list.length > 0 ? new Set(list) : null;
  }
  return built;
}

/** The path of a URL and what follows it (`?query`, `#hash`), so only the path is ever read as a file name. */
function splitUrl(url: string): [path: string, rest: string] {
  const at = url.search(/[?#]/);
  return at < 0 ? [url, ''] : [url.slice(0, at), url.slice(at)];
}

/**
 * The URL the site serves for `url`: `art/<...>.png` becomes `art/<...>.webp` when this build derived a WebP for that master,
 * and anything else (a URL outside `art/`, a master that stayed PNG, a `.webp` already) comes back unchanged.
 */
export function shippedArtUrl(url: string): string {
  const set = shipped();
  if (set === null) return url;
  const [path, rest] = splitUrl(url);
  const m = ART_PNG.exec(path);
  return m && set.has(`${m[1]}.png`) ? `${path.slice(0, -3)}webp${rest}` : url;
}

/**
 * The master's name for `url`: the inverse of {@link shippedArtUrl}. A derived `art/<...>.webp` comes back as `.png`; every
 * other URL (the PNGs themselves, `.2x.webp` masters, anything outside `art/`) comes back unchanged.
 */
export function logicalArtUrl(url: string): string {
  const set = shipped();
  if (set === null) return url;
  const [path, rest] = splitUrl(url);
  const m = ART_WEBP.exec(path);
  return m && set.has(`${m[1]}.png`) ? `${path.slice(0, -4)}png${rest}` : url;
}

/** Where `<image>.json` sits for an image URL in either form (the sidecar is named after the master). */
export function sidecarUrlOf(url: string): string {
  return logicalArtUrl(url).replace(/\.(?:png|webp)(?=$|[?#])/i, '.json');
}

/** Pin the set of masters shipped as WebP (tests, and the debug console); `null` pins "none", `undefined` goes back to the build's list. */
export function setShippedArt(paths: Iterable<string> | null | undefined): void {
  forced = paths === undefined ? undefined : paths === null ? null : new Set(paths);
}

/** Is this master shipped as WebP in the running build? */
export function isShippedAsWebp(masterPath: string): boolean {
  return shipped()?.has(masterPath) === true;
}
