/**
 * Demo looks, light on the paintings: the three-side of it. A painted figure's material is bound to its painting's normal map (`bindRelight`, called by
 * `PaintedActor.applyPose` for every pose it draws); the map is fetched next to the painting (`<pose>.normal.png`, `<pose>@2x.normal.png`) and cached. A pose with no
 * map (404, a figure nobody made maps for) stays unlit: the material's `relightOn` is 0 and the shader skips the whole block. Nothing happens unless the address armed a
 * look (`?look=`): then every figure material compiles with `PAINTED_RELIGHT` (the shader's block does nothing until a look turns it on with `relightAny`).
 *
 * The lights' values live in one set of shared uniform cells (`relightCells`) that every bound material references; `LookRig` writes them each frame.
 */
import { DataTexture, LinearFilter, LinearMipmapLinearFilter, NoColorSpace, RGBAFormat, Texture, TextureLoader, Vector3, Vector4, type ShaderMaterial } from 'three';
import { logicalArtUrl, shippedArtUrl } from '../../ArtShipped.ts';
import { artManifest } from '../../ArtManifest.ts';
import { normalMapScaleFor } from '../../ArtManifestMaps.ts';
import { lookState } from '../LookState.ts';
import { MAX_POINT_LIGHTS, normalMapUrl } from './RelightConfig.ts';
import { queued } from '../../LoadHold.ts'; // lane "budgets-2": on the phone class the maps start through a ranked queue, the poses a fight draws first first
import { poseNeed } from '../../LoadDiet.ts';
import { figureState } from '../../ArtTier.ts';

type Cell<T> = { value: T };

/** The shared uniform cells. */
export const relightCells = {
  relightAny: { value: 0 } as Cell<number>,
  relightKeyDir: { value: new Vector3(-0.3, 0.6, 0.75) } as Cell<Vector3>,
  relightKeyCol: { value: new Vector3(1, 0.92, 0.75) } as Cell<Vector3>,
  /** x: the key's amount, y: how much of its colour the lift takes, z, w: the gain's floor and ceiling. */
  relightKey: { value: new Vector4(0.5, 0.5, 0.6, 1.4) } as Cell<Vector4>,
  relightRimDir: { value: new Vector3(-0.4, 0.4, -0.8) } as Cell<Vector3>,
  relightRimCol: { value: new Vector3(1, 0.95, 0.85) } as Cell<Vector3>,
  relightRimAmt: { value: 0 } as Cell<number>,
  /** Point lights: xy the frame uv, z the reach in frame heights, w the strength (0 = off). */
  relightPtA: { value: Array.from({ length: MAX_POINT_LIGHTS }, () => new Vector4(0.5, 0.5, 0.2, 0)) } as Cell<Vector4[]>,
  relightPtC: { value: Array.from({ length: MAX_POINT_LIGHTS }, () => new Vector3(1, 1, 1)) } as Cell<Vector3[]>,
  relightAspect: { value: 16 / 9 } as Cell<number>,
};

let flat: DataTexture | null = null;
/** A flat normal (straight at the viewer) for a material that has no map yet: the sampler is always bound. Shared with the rigged figures (`RigRelight.ts`). */
export function flatNormal(): DataTexture {
  if (!flat) {
    flat = new DataTexture(new Uint8Array([128, 128, 255, 255]), 1, 1, RGBAFormat);
    flat.needsUpdate = true;
  }
  return flat;
}

type Entry = Texture | 'loading' | 'missing';
const cache = new Map<string, Entry>();
const waiters = new Map<string, Set<ShaderMaterial>>();
/**
 * How many maps the cache holds before it lets go of the oldest unpinned one. 56 was the whole of Chapter I's staged figures (50 maps) with six to spare, so the first pose of a reserve member or
 * a second look evicted a pose of a figure on stage, and its next use was drawn unlit until the map came back (motion pass, step 2, MAP fact 11). With the new motion on, the staged figures'
 * maps are pinned ({@link prefetchRelight}) and the cap is 112, room for two chapters' worth besides. With nothing pinned (every new piece off: the default, and every chapter but I and IV)
 * the cap is the 56 it always was (review MAJOR-1: the live game's staging must not change with the switches off).
 */
const CAP_TODAY = 56;
const CAP_PINNED = 112;
const capNow = (): number => (pinned.size > 0 ? CAP_PINNED : CAP_TODAY);
/** Pinned maps, with how many figures hold each one: a map two live figures share is let go only when the last of them goes (review minor). */
const pinned = new Map<string, number>();
/**
 * Release 68 (lane "budgets-2", both games): the fight each map was last asked for in, as `PaintedArtCache.beginPaintingEpoch` numbers them. {@link releaseRelightBefore} lets go of the maps
 * a fight did not use once its figures are gone: the cache evicts one map per load, so two chapters' maps (68 of them for Chapters I and IV) stayed resident after every fight.
 */
const touched = new Map<string, number>();
let epochNow = 0;
/**
 * The maps asked for through the phone's queue and not yet started: url to the function that starts THAT request now (review P3: a pose being drawn must not wait behind the rank order for its own map).
 * The queue's own turn runs the same request only if it is still the one in this book, so a request starts once, whoever comes first, and a request that was released (or asked for again) never starts.
 */
const starts = new Map<string, () => void>();

/** A fight begins (the same number the painting cache opened): maps asked for from here on belong to it. */
export function beginRelightEpoch(n: number): void {
  epochNow = n;
}

/** The decoded maps the cache holds, and how many are pinned by a figure on stage (the debug probe and the tests). */
export function relightCacheStats(): { maps: number; textures: number; pinned: number; stamps: number } {
  let textures = 0;
  for (const v of cache.values()) if (v instanceof Texture) textures++;
  return { maps: cache.size, textures, pinned: pinned.size, stamps: touched.size };
}

/**
 * Dispose and forget every map that no figure pins and that was not asked for since fight `from` began. A map still loading is forgotten too; when it arrives it is disposed, not kept.
 * Returns how many textures were freed.
 */
export function releaseRelightBefore(from: number): number {
  let freed = 0;
  for (const [url, entry] of [...cache]) {
    if (pinned.has(url) || (touched.get(url) ?? 0) >= from) continue;
    if (entry instanceof Texture) {
      entry.dispose();
      freed++;
    }
    cache.delete(url);
    touched.delete(url);
    waiters.delete(url);
    starts.delete(url);
  }
  return freed;
}
let loader: TextureLoader | null = null;

/** Counters for the debug API and the captures. */
export const relightStats = { bound: 0, loaded: 0, missing: 0, requested: 0 };

function adopt(m: ShaderMaterial, url: string, tex: Texture | null): void {
  if (m.userData['relightUrl'] !== url) return; // the figure moved on to another pose while this one loaded
  m.uniforms['relightNormal']!.value = tex ?? flatNormal();
  m.uniforms['relightOn']!.value = tex ? 1 : 0;
}

/**
 * Ask for a map. `rank` null: now (a pose being drawn needs its map). A rank: through the phone's ranked queue (`LoadHold.queued`; off the phone class that is "now" too), so the maps of the poses a fight
 * draws first land first and not all forty together. A map released before its turn (a fight ended) is never asked for.
 */
function fetchMap(url: string, rank: number | null = null): void {
  cache.set(url, 'loading');
  touched.set(url, epochNow);
  relightStats.requested++;
  const go = (): Promise<void> => {
    if (cache.get(url) !== 'loading') return Promise.resolve(); // released before its turn
    loader ??= new TextureLoader();
    return new Promise<void>((settle) => {
      loader!.load(
        url,
        (t) => {
          try {
            if (cache.get(url) !== 'loading') {
              t.dispose(); // released while it was on its way (a fight ended): nobody keeps it
              return;
            }
            t.colorSpace = NoColorSpace; // data, not colour
            t.minFilter = LinearMipmapLinearFilter;
            t.magFilter = LinearFilter;
            t.generateMipmaps = true;
            t.anisotropy = 4;
            t.needsUpdate = true;
            cache.set(url, t);
            relightStats.loaded++;
            for (const m of waiters.get(url) ?? []) adopt(m, url, t);
            waiters.delete(url);
            if (cache.size > capNow()) {
              for (const [k, v] of cache) {
                if (v instanceof Texture && !pinned.has(k)) {
                  v.dispose();
                  cache.delete(k);
                  touched.delete(k);
                  break;
                }
              }
            }
          } finally {
            settle();
          }
        },
        undefined,
        () => {
          try {
            if (cache.get(url) !== 'loading') return; // released while it was on its way
            cache.set(url, 'missing');
            relightStats.missing++;
            for (const m of waiters.get(url) ?? []) adopt(m, url, null);
            waiters.delete(url);
          } finally {
            settle();
          }
        },
      );
    });
  };
  const failed = (): void => {
    // `loader.load` threw before it could answer: the map is missing, and a material waiting for it is left unlit
    if (cache.get(url) !== 'loading') return;
    cache.set(url, 'missing');
    relightStats.missing++;
    for (const m of waiters.get(url) ?? []) adopt(m, url, null);
    waiters.delete(url);
  };
  if (rank === null) go().catch(failed);
  else {
    const turn = (): Promise<void> => {
      if (starts.get(url) !== promote) return Promise.resolve(); // a pose being drawn started it ahead of its rank, or it was released, or it was asked for again by someone else
      starts.delete(url);
      return go();
    };
    const promote = (): void => void turn().catch(failed);
    starts.set(url, promote);
    queued(rank, turn).catch(failed);
  }
}

/** The URL of the normal map a painting would be lit with, or null when the build ships none for it (the manifest names which maps exist). */
function mapUrlFor(paintingUrl: string | undefined, scale: number | undefined, placeholder: boolean): string | null {
  const logical = !paintingUrl || placeholder ? null : logicalArtUrl(paintingUrl);
  const pick = logical === null ? null : normalMapScaleFor(artManifest(), logical, scale ?? 1);
  const mapUrl = logical === null || pick === null ? null : normalMapUrl(logical, pick ?? scale ?? 1);
  return mapUrl ? shippedArtUrl(mapUrl) : null;
}

/**
 * Motion pass, step 2 (MAP fact 11): fetch a staged figure's map for `paintingUrl` NOW and keep it, so the first time a pose is drawn its light is already there (a pose is drawn unlit until
 * its map arrives, which read as a flat flash in the middle of a move). Returns the URL it pinned (hand it to {@link unpinRelight} when the figure goes), or null: no look armed, or no map.
 * `held`: the figure's own set of what it has pinned; a map it already holds is not counted twice (a figure's paintings are staged more than once), and the set is what it hands back to
 * {@link unpinRelight}. Without it every call is one pin.
 */
export function prefetchRelight(paintingUrl: string | undefined, scale: number | undefined, placeholder = false, held?: Set<string>): string | null {
  if (!lookState.armed) return null;
  const url = mapUrlFor(paintingUrl, scale, placeholder);
  if (!url) return null;
  if (!held?.has(url)) {
    pinned.set(url, (pinned.get(url) ?? 0) + 1);
    held?.add(url);
  }
  if (!cache.has(url)) fetchMap(url, 2 * poseNeed(figureState(paintingUrl ?? '') ?? 'idle') + 1);
  else touched.set(url, epochNow);
  return url;
}

/** The staged figure is gone: its maps may be evicted again (a map another live figure also holds stays pinned until that one goes too). */
export function unpinRelight(urls: Iterable<string>): void {
  for (const u of urls) {
    const n = (pinned.get(u) ?? 0) - 1;
    if (n > 0) pinned.set(u, n);
    else pinned.delete(u);
  }
}

/** How many maps are pinned (the captures and the tests). */
export const pinnedRelightCount = (): number => pinned.size;

/**
 * Bind a figure's material to the normal map of the painting it now draws (`paintingUrl`: the URL the painting was asked for; `scale`: the master it was drawn from).
 * A no-op unless a look flag armed the rig. Safe to call every time the pose changes.
 */
export function bindRelight(material: ShaderMaterial, paintingUrl: string | undefined, scale: number | undefined, placeholder = false): void {
  if (!lookState.armed) return;
  const u = material.uniforms;
  if (material.defines?.['PAINTED_RELIGHT'] === undefined) {
    material.defines = { ...(material.defines ?? {}), PAINTED_RELIGHT: '' };
    for (const [k, c] of Object.entries(relightCells)) u[k] = c;
    u['relightNormal'] = { value: flatNormal() };
    u['relightOn'] = { value: 0 };
    material.needsUpdate = true;
    relightStats.bound++;
  }
  // release 60: the art manifest names the maps the build ships; ask for one of those, and for none when the figure has none (no 404). No lightMaps in it: ask for the scale the painting wants, as before.
  const url = mapUrlFor(paintingUrl, scale, placeholder);
  material.userData['relightUrl'] = url;
  if (!url) {
    u['relightNormal']!.value = flatNormal();
    u['relightOn']!.value = 0;
    return;
  }
  const hit = cache.get(url);
  if (hit) touched.set(url, epochNow);
  if (hit instanceof Texture) {
    // refresh the entry's place in the cache (most recently used last)
    cache.delete(url);
    cache.set(url, hit);
    adopt(material, url, hit);
  } else if (hit === 'missing') adopt(material, url, null);
  else {
    u['relightOn']!.value = 0; // unlit until the map arrives
    let w = waiters.get(url);
    if (!w) waiters.set(url, (w = new Set()));
    w.add(material);
    if (!hit) fetchMap(url);
    else starts.get(url)?.(); // queued for later and not started: this pose is being drawn now, so its map goes ahead of the rank order (a map already on its way has no entry here)
  }
}
