/**
 * The build-time index of painted art, loaded once at runtime.
 *
 * `tools/gen/manifest.mjs` walks `public/art/` and writes
 * `public/art/manifest.json`; every build regenerates it (`npm run
 * art:manifest`, wired as `prebuild` and called by `tools/deploy-pages.mjs`).
 *
 * The point is to stop the game **asking the server what exists**. Before this,
 * opening a battle fired a HEAD probe per pose per figure and a GET per state
 * inside `PaintedArt.loadSubject`; every pose the art fleet has not painted yet
 * — `ready` and `defend` on all six party members, `cast` on every aeon — came
 * back 404, so the live site's network panel was dozens of red lines deep and
 * the console filled with `[painted] missing painting`. One 6 KB JSON answers
 * all of it, and a pose the manifest does not list is simply never requested.
 *
 * Nothing here throws and nothing here is required: when `manifest.json` is
 * absent (an old deploy, a hand-made static server, a unit test) every query
 * answers `null`, which means *"I don't know — go and probe like before"*. The
 * probing path in `BattlePresenterArt` and the load-everything path in
 * `PaintedArt` are both still there, and both still work.
 */

import { parseArtFacing, type ArtFacing } from './BattlePresenterActors.ts';

/** One subject's entry: what `public/art/characters/<id>/` actually holds. */
export interface ArtManifestSubject {
  /** Chosen poses on disk, sorted. Numbered candidates are not listed. */
  readonly states: readonly string[];
  /** True when `public/art/portraits/<id>.png` exists. */
  readonly portrait: boolean;
  /** Declared facing, from `idle.json` or the first state that declares one. */
  readonly facing?: ArtFacing;
}

/** The whole of `public/art/manifest.json`. */
export interface ArtManifest {
  readonly version: number;
  readonly generatedAt: string;
  readonly subjects: Readonly<Record<string, ArtManifestSubject>>;
  readonly portraits: readonly string[];
  readonly backdrops: readonly string[];
  readonly pause: readonly string[];
  /**
   * Pause plates that also ship `public/art/pause/<id>.2x.webp`, the
   * 2688x1536 master of the 1344x768 PNG.
   *
   * The pause screen is full-bleed at window size, so past roughly 1400 CSS px
   * the 1x plate is being upscaled and reads as a low-resolution image. It
   * offers both files through `srcset` and lets the browser choose — but only
   * for the plates named here, because an `srcset` candidate for a file the
   * art fleet has not produced yet is a 404 on the one image the screen is.
   * Always a subset of {@link ArtManifest.pause}; empty on an older manifest.
   */
  readonly pause2x: readonly string[];
  /**
   * Full-bleed title plates in `public/art/title/` — today just `keyart`, the
   * painting the title card splits into its parallax planes.
   *
   * Its own folder rather than `backdrops/`, because a backdrop is a *scene* a
   * battle is staged in and this is the key art of the whole game: it is the
   * approved end state `docs/concepts/polish/showpiece-frontend/after.png`,
   * it carries a 2x master, and nothing in the battle presenter may pick it up
   * by accident.
   */
  readonly title: readonly string[];
  /** Title plates that also ship `title/<id>.2x.webp`. Subset of `title`. */
  readonly title2x: readonly string[];
}

/** Public path of the manifest, resolved against the Vite base path. */
export function artManifestPath(): string {
  const base =
    (typeof import.meta.env !== 'undefined' && import.meta.env.BASE_URL) || '/';
  return `${base.replace(/\/+$/, '')}/art/manifest.json`;
}

let inFlight: Promise<ArtManifest | null> | null = null;
let current: ArtManifest | null = null;

/**
 * Coerce a parsed JSON blob into an {@link ArtManifest}, or `null`.
 *
 * Deliberately strict about the *shape* and forgiving about the contents: a
 * manifest from an older generator that is missing `pause` is still usable for
 * the subjects it does list, and a garbage file is treated exactly like a
 * missing one (fall back to probing) rather than breaking a battle.
 */
export function parseArtManifest(raw: unknown): ArtManifest | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  if (!obj.subjects || typeof obj.subjects !== 'object') return null;

  const subjects: Record<string, ArtManifestSubject> = {};
  for (const [id, value] of Object.entries(obj.subjects as Record<string, unknown>)) {
    if (!value || typeof value !== 'object') continue;
    const entry = value as Record<string, unknown>;
    const states = Array.isArray(entry.states)
      ? entry.states.filter((s): s is string => typeof s === 'string')
      : [];
    // `parseArtFacing` owns the vocabulary (and its aliases); the generator
    // only copies the sidecar's string through.
    const facing = parseArtFacing(entry.facing);
    subjects[id] = {
      states,
      portrait: entry.portrait === true,
      ...(facing ? { facing } : {}),
    };
  }

  const strings = (v: unknown): string[] =>
    Array.isArray(v) ? v.filter((s): s is string => typeof s === 'string') : [];

  return {
    version: typeof obj.version === 'number' ? obj.version : 0,
    generatedAt: typeof obj.generatedAt === 'string' ? obj.generatedAt : '',
    subjects,
    portraits: strings(obj.portraits),
    backdrops: strings(obj.backdrops),
    pause: strings(obj.pause),
    // A manifest written before the 2x contract existed simply has no opinion,
    // and an empty list is the safe one: the screen ships the 1x plate alone,
    // exactly as it did before.
    pause2x: strings(obj.pause2x),
    // Same reasoning as `pause2x`: a manifest written before `public/art/title`
    // existed simply has no opinion, and the title card then falls back to the
    // plate-less gradient it shipped with rather than asking for a 404.
    title: strings(obj.title),
    title2x: strings(obj.title2x),
  };
}

/**
 * Fetch and cache the manifest. Resolves to `null` when there isn't one.
 *
 * Single-flight: forty figures staging at once share one request. The `null`
 * result is cached too — a site deployed without a manifest asks for it once
 * per session and then never again.
 */
export function loadArtManifest(): Promise<ArtManifest | null> {
  if (inFlight) return inFlight;
  inFlight = (async (): Promise<ArtManifest | null> => {
    try {
      const res = await fetch(artManifestPath(), { cache: 'force-cache' });
      // A dev server answers a missing file with `index.html` and a 200, so the
      // status alone is not the signal — the same trap `BattlePresenterArt`
      // documents for pose probes. Parsing is the honest check here: HTML is
      // not JSON, `json()` rejects, and we fall through to probing.
      if (!res.ok) return null;
      return parseArtManifest(await res.json());
    } catch {
      return null;
    }
  })().then((m) => {
    current = m;
    return m;
  });
  return inFlight;
}

/** The manifest if it has already loaded, else `null`. Never fetches. */
export function artManifest(): ArtManifest | null {
  return current;
}

/**
 * Poses that exist for `id`, or `null` for *"no manifest — probe instead"*.
 *
 * An **empty array** is a real answer: the manifest loaded and this subject has
 * no art, so nothing should be requested for it at all.
 */
export async function artStatesFor(id: string): Promise<readonly string[] | null> {
  const manifest = await loadArtManifest();
  if (!manifest) return null;
  return manifest.subjects[id]?.states ?? [];
}

/** Facing declared for `id`, or undefined (no manifest, or none declared). */
export async function artFacingFor(id: string): Promise<ArtFacing | undefined> {
  const manifest = await loadArtManifest();
  return manifest?.subjects[id]?.facing;
}

/** Is `public/art/portraits/<id>.png` there? `null` when there is no manifest. */
export function hasPortraitArt(id: string): boolean | null {
  if (!current) return null;
  const subject = current.subjects[id];
  if (subject) return subject.portrait;
  return current.portraits.includes(id);
}

/** Is `public/art/backdrops/<key>.png` there? `null` when there is no manifest. */
export function hasBackdropArt(key: string): boolean | null {
  return current ? current.backdrops.includes(key) : null;
}

/** Is `public/art/pause/<key>.png` there? `null` when there is no manifest. */
export function hasPauseArt(key: string): boolean | null {
  return current ? current.pause.includes(key) : null;
}

/**
 * Is `public/art/pause/<key>.2x.webp` there? `null` when there is no manifest.
 *
 * Only ever `true` for a file the build-time scan actually saw, which is what
 * lets the pause screen put it in an `srcset` without risking a 404 on its
 * hero painting. `null` and `false` both mean "ship the 1x plate alone".
 */
export function hasPause2xArt(key: string): boolean | null {
  return current ? current.pause2x.includes(key) : null;
}

/**
 * The `pause/<key>` stem a `public/art/pause/...` URL names, or `null`.
 *
 * The pause plates are reached two different ways — `ChapterMeta.heroArt` is
 * already `pause/ch1-seymour-flux`, while the PARTY tab builds
 * `art/pause/<combatant-id>.png` — so the one thing every caller has in common
 * is the URL. Parsing it here keeps the `.2x` naming rule in this module with
 * the manifest that indexes it.
 */
export function pauseStemOf(url: string): string | null {
  const m = /(?:^|\/)art\/pause\/([A-Za-z0-9][A-Za-z0-9_-]*)\.png(?:$|[?#])/i.exec(url);
  return m?.[1] ?? null;
}

/**
 * The `2x.webp` master's URL for a pause plate URL, when the manifest says one
 * exists. `null` otherwise — including before the manifest has loaded.
 */
export function pause2xUrlFor(url: string): string | null {
  const stem = pauseStemOf(url);
  if (stem === null || hasPause2xArt(stem) !== true) return null;
  return url.replace(/\.png(?=$|[?#])/i, '.2x.webp');
}

/** Is `public/art/title/<key>.png` there? `null` when there is no manifest. */
export function hasTitleArt(key: string): boolean | null {
  return current ? current.title.includes(key) : null;
}

/** Is `public/art/title/<key>.2x.webp` there? `null` when there is no manifest. */
export function hasTitle2xArt(key: string): boolean | null {
  return current ? current.title2x.includes(key) : null;
}

/** The `title/<key>` stem a `public/art/title/...` URL names, or `null`. */
export function titleStemOf(url: string): string | null {
  const m = /(?:^|\/)art\/title\/([A-Za-z0-9][A-Za-z0-9_-]*)\.png(?:$|[?#])/i.exec(url);
  return m?.[1] ?? null;
}

/**
 * The `2x.webp` master's URL for a title plate URL, when the manifest says one
 * exists. `null` otherwise — including before the manifest has loaded.
 *
 * The title card is one painting at window size, so on Bailey's 2000px window
 * the 1344px plate is being upscaled by half again; this is the file that
 * stops that, and offering it only when the scan really saw it is what keeps a
 * missing master from 404-ing the one image the screen is.
 */
export function title2xUrlFor(url: string): string | null {
  const stem = titleStemOf(url);
  if (stem === null || hasTitle2xArt(stem) !== true) return null;
  return url.replace(/\.png(?=$|[?#])/i, '.2x.webp');
}

/**
 * Any `public/art/**.png` URL the manifest has an opinion about.
 *
 * `true` it exists, `false` it does not (so **do not request it**), `null` we
 * cannot say — no manifest loaded, or a URL outside the five indexed folders
 * (a `.raw` intermediate, a numbered candidate, anything hand-built).
 *
 * This is the one gate that covers every loader path at once, including the
 * one `resolvePoseMap` cannot help with: a figure with no art at all still
 * gets a full pose map so `PaintedActor` has names to hang its stand-ins on,
 * and without this every one of those names would be a 404.
 */
const ART_ASSET =
  /(?:^|\/)art\/(?:characters\/([^/?#]+)\/([^/?#]+)|(portraits|backdrops|pause|title)\/([^/?#]+))\.([a-z0-9]+)(?:$|[?#])/i;

function judge(manifest: ArtManifest, url: string): boolean | null {
  const m = ART_ASSET.exec(url);
  if (!m) return null;

  const [, subjectId, state, folder, key, ext] = m;
  // The fleet ships PNG. A `.webp`/`.jpg` under an indexed folder is therefore
  // an *alternative encoding nobody produced* — a real `false`, which is what
  // lets a candidate chain skip it instead of learning the hard way. A `.json`
  // sidecar is not indexed and is judged by its PNG, so it stays `null`.
  if ((ext ?? '').toLowerCase() === 'json') return null;
  const isPng = (ext ?? '').toLowerCase() === 'png';

  if (subjectId !== undefined && state !== undefined) {
    // A dotted stem is a candidate or a `.raw` intermediate: not indexed, and
    // not ours to judge.
    if (state.includes('.')) return null;
    return isPng && (manifest.subjects[subjectId]?.states ?? []).includes(state);
  }
  if (folder === undefined || key === undefined || key.includes('.')) return null;
  const list =
    folder === 'portraits'
      ? manifest.portraits
      : folder === 'backdrops'
        ? manifest.backdrops
        : folder === 'title'
          ? manifest.title
          : manifest.pause;
  return isPng && list.includes(key);
}

export async function manifestKnowsAsset(url: string): Promise<boolean | null> {
  const manifest = await loadArtManifest();
  return manifest ? judge(manifest, url) : null;
}

/**
 * Sync twin of {@link manifestKnowsAsset}, for the UI's `innerHTML` builders.
 *
 * Answers `null` until the manifest has actually loaded, which is deliberate:
 * a caller that runs before the first fetch resolves behaves exactly as it did
 * before this existed, rather than hiding art on a race.
 */
export function manifestKnowsAssetNow(url: string): boolean | null {
  return current ? judge(current, url) : null;
}

/**
 * Install a manifest directly and skip the fetch — for tests, and for any
 * caller that already has the object.
 *
 * `setArtManifest(null)` pins the *no manifest* answer without a request;
 * {@link resetArtManifest} puts the module back to its cold state so the next
 * query fetches again.
 */
export function setArtManifest(manifest: ArtManifest | null): void {
  current = manifest;
  inFlight = Promise.resolve(manifest);
}

/** Forget everything, including the in-flight request. Tests only. */
export function resetArtManifest(): void {
  current = null;
  inFlight = null;
}

/**
 * Start the fetch now, in the background, and never wait for it.
 *
 * The async queries below can await the request; the **sync** ones
 * ({@link manifestKnowsAssetNow} and the `hasXArt` helpers) cannot, and they
 * are what the UI's `innerHTML` builders use. Those answer `null` — "no
 * opinion, emit the `<img>` and let `onerror` clean up" — until the manifest
 * has actually landed, so without a head start the first screens still fire the
 * misses this whole thing exists to prevent. One 6 KB request at bundle init
 * is what closes that window.
 */
export function prefetchArtManifest(): void {
  void loadArtManifest();
}

// Kicked off at module init rather than from `main.ts`, because *every* module
// that touches painted art imports this one (directly or through
// `PaintedArt.ts`), so this is the earliest point that is guaranteed to run —
// earlier than any screen can render. Guarded on `document` so a Node unit test
// never fires a request it would only have to ignore.
if (typeof document !== 'undefined' && typeof fetch === 'function') prefetchArtManifest();
