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
 * every URL that is not a derived WebP, and has no `@` in its art path, exactly as it was (the `.2x.webp` masters of the pause
 * and title plates among them).
 *
 * **The `@` of a master's name goes on the wire as `%40`** (release 39, the live check's finding LV-2). The hi-res masters are
 * named `<state>@2x.png`, and Cloudflare answers a request for the raw `@` with a 307 to the percent-encoded path and only that
 * path with a 200, so every master cost one extra round trip. {@link shippedArtUrl} therefore writes `idle%402x.png` (in dev and in
 * the tests too, whatever the list says), GitHub Pages and the dev server answer either form, and {@link logicalArtUrl} turns it
 * back into `idle@2x.png`, the name the art manifest and `ArtTier.ts` key on. Only a URL with an `art/` folder in its path is
 * touched, and only its path, never its `?query` or `#hash`.
 *
 * **Where the list comes from.** The build inserts it as the constant `__PYREFLY_ART_WEBP__`, the master paths
 * (`art/characters/tidus/idle.png`) it shipped as WebP. Unset (dev, tests, `PYREFLY_ART_WEBP=off`) every URL maps to itself.
 *
 * The lookup is synchronous on purpose: `artUrl` is called while markup is built and before the art manifest has loaded, so a
 * mapping that waited for a fetch would hand the browser a PNG that is no longer there.
 *
 * **Strip thumbnails (r44-thumbs, both games).** The chapter board's rail strips paint a master at about 260 x 35 px, and the full file is
 * 1 to 6 MB. For each master the build derives a small copy of (`tools/art-thumbs.mjs`, named by `src/data/art/strip-art.json`),
 * {@link thumbArtUrl} maps a master's URL to it: `art/backdrops/gagazet.png` to `art/backdrops/gagazet.thumb.webp`, a figure's
 * `idle.png` to `idle.thumb.png`. The build inserts the map as the constant `__PYREFLY_ART_THUMBS__`. A master the map does not name (dev, the
 * unit suite, `PYREFLY_ART_THUMBS=off`, a master the tool refused) maps to {@link shippedArtUrl}: **the full picture, never a missing file.**
 * A thumbnail name is not a master's, derived or otherwise, so {@link logicalArtUrl} leaves it alone.
 */

/** Inserted by `tools/art-derive-plugin.mjs` (a Vite `define`): the master PNG paths this build ships as WebP. */
declare const __PYREFLY_ART_WEBP__: readonly string[] | undefined;
/** Inserted by the same plugin: the master PNG path to the strip thumbnail this build ships for it (`art/backdrops/x.png` to `art/backdrops/x.thumb.webp`). */
declare const __PYREFLY_ART_THUMBS__: Readonly<Record<string, string>> | undefined;

/** `art/<...>.png` as the path of a URL ends, with or without the base path before it. */
const ART_PNG = /(?:^|\/)(art\/.+)\.png$/;
/** The same for the derived name. */
const ART_WEBP = /(?:^|\/)(art\/.+)\.webp$/;
/** A path inside an `art/` folder, with or without the base path before it: the only paths whose `@` is rewritten. */
const IN_ART = /(?:^|\/)art\//;

/** The wire form of an art path: every `@` as `%40` (a path with no raw `@`, or outside `art/`, comes back as it was). */
const encodeAt = (path: string): string => (IN_ART.test(path) ? path.replace(/@/g, '%40') : path);
/** The master's own name for an art path: every `%40` as `@`, so either form reads the same. */
const decodeAt = (path: string): string => (IN_ART.test(path) ? path.replace(/%40/gi, '@') : path);

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
 * and the `@` of a master's name (`idle@2x`) is written `%40` (the file is the same; the first request is the one answered 200).
 * Anything else (a URL outside `art/`, a master that stayed PNG, a `.webp` already, an art path with no `@`) comes back unchanged,
 * and so does a URL that is already in this form.
 */
export function shippedArtUrl(url: string): string {
  const [path, rest] = splitUrl(url);
  const logical = decodeAt(path);
  const set = shipped();
  const m = set === null ? null : ART_PNG.exec(logical);
  const served = set !== null && m && set.has(`${m[1]}.png`) ? `${logical.slice(0, -3)}webp` : logical;
  return `${encodeAt(served)}${rest}`;
}

/**
 * The master's name for `url`: the inverse of {@link shippedArtUrl}. A derived `art/<...>.webp` comes back as `.png` and
 * `idle%402x` as `idle@2x`; every other URL (the PNGs themselves, `.2x.webp` masters, anything outside `art/`) comes back unchanged.
 */
export function logicalArtUrl(url: string): string {
  const [path, rest] = splitUrl(url);
  const logical = decodeAt(path);
  const set = shipped();
  const m = set === null ? null : ART_WEBP.exec(logical);
  return `${set !== null && m && set.has(`${m[1]}.png`) ? `${logical.slice(0, -4)}png` : logical}${rest}`;
}

/** Where `<image>.json` sits for an image URL in either form (the sidecar is named after the master), as the site is asked for it: `idle%402x.json`. */
export function sidecarUrlOf(url: string): string {
  return shippedArtUrl(logicalArtUrl(url).replace(/\.(?:png|webp)(?=$|[?#])/i, '.json'));
}

/** Pin the set of masters shipped as WebP (tests, and the debug console); `null` pins "none", `undefined` goes back to the build's list. */
export function setShippedArt(paths: Iterable<string> | null | undefined): void {
  forced = paths === undefined ? undefined : paths === null ? null : new Set(paths);
}

/** Is this master shipped as WebP in the running build? */
export function isShippedAsWebp(masterPath: string): boolean {
  return shipped()?.has(masterPath) === true;
}

type ThumbMap = Readonly<Record<string, string>>;
let thumbsForced: ThumbMap | null | undefined;
let thumbsBuilt: ThumbMap | null | undefined;

/** The thumbnail map in force: a test's own, else the build's, else `null` (every URL maps to its full picture). */
function thumbs(): ThumbMap | null {
  if (thumbsForced !== undefined) return thumbsForced;
  if (thumbsBuilt === undefined) {
    const map = typeof __PYREFLY_ART_THUMBS__ !== 'undefined' ? __PYREFLY_ART_THUMBS__ : undefined;
    thumbsBuilt = map && Object.keys(map).length > 0 ? map : null;
  }
  return thumbsBuilt;
}

/**
 * The URL of the small copy of the master `url` names, when this build derived one; otherwise {@link shippedArtUrl}, the full picture the
 * site serves for it. Either form of the master's name is read (`x.png`, or the derived `x.webp` when the build ships it so), the path before
 * `art/` (the base) and any `?query` or `#hash` are kept, and the answer is a file that exists in the build that made the map.
 * The caller must be showing the picture small: the board's rail strips (`chapterPlates.ts`). A plate drawn large asks for `artUrl`.
 */
export function thumbArtUrl(url: string): string {
  const [path, rest] = splitUrl(url);
  const logical = logicalArtUrl(path);
  const map = thumbs();
  const m = map === null ? null : ART_PNG.exec(decodeAt(logical));
  const thumb = m ? map![`${m[1]}.png`] : undefined;
  if (!m || thumb === undefined) return shippedArtUrl(url);
  const plain = decodeAt(logical);
  return `${plain.slice(0, plain.length - m[1]!.length - '.png'.length)}${thumb}${rest}`;
}

/** Is there a strip thumbnail for this master (`art/<...>.png`) in the running build? */
export function hasThumbArt(masterPath: string): boolean {
  return thumbs()?.[masterPath] !== undefined;
}

/** Pin the strip-thumbnail map (tests, and the debug console); `null` pins "none", `undefined` goes back to the build's map. */
export function setThumbArt(map: ThumbMap | null | undefined): void {
  thumbsForced = map;
}
