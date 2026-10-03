/**
 * The living portraits' painted face parts: what is shipped, where it sits on its plate, and how it loads
 * (D-320, the recommended picks of `portrait-face-parts/`; written by `tools/portrait-parts.py`).
 *
 * A part is a straight-alpha PNG drawn source-over at its box on the plate of the same scale; outside its alpha the
 * plate shows, so at weight 0 the plate is exactly today's. The files live in `public/portrait-parts/` on a
 * developer's disk and are installed into `public/art/portrait-parts/` at release time (the art is local-only and
 * never on `main`), so the manifest is looked up in the art folder first and in `portrait-parts/` second. With
 * neither, every plate stays static: nothing here ever throws, a miss is simply no driver work.
 *
 * Game case: both (shared plumbing; the parts are per plate: FFX plates 1 to 3, FFX-2 plates 4 and 5 and the rest).
 * Pure parsing, plus the one `fetch` / `Image` loader (DOM side, no `three`, no engine state, no RNG).
 */

import { artUrl } from '../../../engine/PaintedArt.ts';

/** `[x, y, w, h]` in the pixels of one plate scale. */
export type Box = readonly [number, number, number, number];
export type Eye = 'L' | 'R';
export type Scale = '2x' | '1x';

export interface PartSpec {
  readonly box2x: Box;
  readonly box1x: Box;
}

export interface PlateParts {
  /** The union of every part's box: the one small canvas the driver draws into. */
  readonly canvas2x: Box;
  readonly canvas1x: Box;
  /** The eyes whose closed lid is drawn for a blink (Kimahri: near eye only; both Rikkus keep the wink). */
  readonly blink: readonly Eye[];
  /** The eyes whose iris moves (Auron: none, dark glasses). */
  readonly gaze: readonly Eye[];
  /** Iris travel, 1 = the full travel; below 1 where a part showed a flaw at large offsets. */
  readonly gazeScale: number;
  readonly parts: Readonly<Record<string, PartSpec>>;
}

export interface PartsManifest {
  readonly version: 1;
  /** The 2x master's size: a box over this is a fraction of the plate. */
  readonly master: readonly [number, number];
  readonly plates: Readonly<Record<string, PlateParts>>;
}

const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const isBox = (v: unknown): v is Box => Array.isArray(v) && v.length === 4 && v.every(isNum) && (v[2] as number) > 0 && (v[3] as number) > 0;
const isEyes = (v: unknown): v is Eye[] => Array.isArray(v) && v.every((e) => e === 'L' || e === 'R');

/** Coerce parsed JSON into a manifest, or null. Strict on shape, forgiving on content: a bad plate is dropped, the rest stay. */
export function parsePartsManifest(raw: unknown): PartsManifest | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const r = raw as Record<string, unknown>;
  const master = r['master'];
  if (r['version'] !== 1 || !Array.isArray(master) || master.length !== 2 || !master.every((n) => isNum(n) && n > 0)) return null;
  const plates: Record<string, PlateParts> = {};
  for (const [id, v] of Object.entries((r['plates'] ?? {}) as Record<string, unknown>)) {
    if (typeof v !== 'object' || v === null) continue;
    const p = v as Record<string, unknown>;
    if (!isBox(p['canvas2x']) || !isBox(p['canvas1x']) || !isEyes(p['blink']) || !isEyes(p['gaze']) || !isNum(p['gazeScale'])) continue;
    const parts: Record<string, PartSpec> = {};
    for (const [name, s] of Object.entries((p['parts'] ?? {}) as Record<string, unknown>)) {
      const spec = s as Record<string, unknown> | null;
      if (spec && isBox(spec['box2x']) && isBox(spec['box1x'])) parts[name] = { box2x: spec['box2x'], box1x: spec['box1x'] };
    }
    plates[id] = {
      canvas2x: p['canvas2x'], canvas1x: p['canvas1x'], blink: p['blink'], gaze: p['gaze'],
      gazeScale: Math.max(0, Math.min(1, p['gazeScale'])), parts,
    };
  }
  return { version: 1, master: [master[0] as number, master[1] as number], plates };
}

/** The part's box at a scale. */
export const boxOf = (spec: PartSpec, scale: Scale): Box => (scale === '2x' ? spec.box2x : spec.box1x);

/** Where a root holds the manifest and the files, tried in order: the installed art folder, then the dev folder. */
export function partsRoots(): string[] {
  return [artUrl('art/portrait-parts'), artUrl('portrait-parts')];
}

interface Loaded {
  readonly root: string;
  readonly manifest: PartsManifest;
}

let loading: Promise<Loaded | null> | null = null;

/** The manifest and the root it came from, fetched once per page. A miss is cached too (no 404 on every pause). */
export function loadPartsManifest(fetcher: typeof fetch | undefined = typeof fetch === 'function' ? fetch : undefined): Promise<Loaded | null> {
  if (loading) return loading;
  loading = (async () => {
    if (!fetcher) return null;
    for (const root of partsRoots()) {
      try {
        const res = await fetcher(`${root}/manifest.json`, { cache: 'no-cache' });
        if (!res.ok) continue;
        const manifest = parsePartsManifest(await res.json());
        if (manifest) return { root, manifest };
      } catch {
        /* try the next root */
      }
    }
    return null;
  })();
  return loading;
}

/** Forget the cached lookup (tests, and an install while the page is open). */
export function resetPartsManifest(): void {
  loading = null;
  images.clear();
}

/** Decoded part images, per plate and scale, kept for the two plates a member change can need. */
const images = new Map<string, Promise<Map<string, HTMLImageElement> | null>>();
const KEEP = 4;

/** Load every part image of a plate at a scale. Null when any is missing: a half-installed plate stays static. */
export function loadPlateImages(root: string, plate: string, spec: PlateParts, scale: Scale): Promise<Map<string, HTMLImageElement> | null> {
  const key = `${root}|${plate}|${scale}`;
  const hit = images.get(key);
  if (hit) return hit;
  const names = Object.keys(spec.parts);
  const job = Promise.all(
    names.map(
      (name) =>
        new Promise<[string, HTMLImageElement] | null>((resolve) => {
          const img = new Image();
          img.decoding = 'async';
          img.onload = () => resolve([name, img]);
          img.onerror = () => resolve(null);
          img.src = `${root}/${plate}/${scale}/${name}.png`;
        }),
    ),
  ).then((all) => (all.every((x) => x !== null) ? new Map(all as [string, HTMLImageElement][]) : null));
  images.set(key, job);
  while (images.size > KEEP) {
    const oldest = images.keys().next().value;
    if (oldest === undefined) break;
    images.delete(oldest);
  }
  return job;
}
