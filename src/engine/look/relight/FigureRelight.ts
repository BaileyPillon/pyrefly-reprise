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
/** A flat normal (straight at the viewer) for a material that has no map yet: the sampler is always bound. */
function flatNormal(): DataTexture {
  if (!flat) {
    flat = new DataTexture(new Uint8Array([128, 128, 255, 255]), 1, 1, RGBAFormat);
    flat.needsUpdate = true;
  }
  return flat;
}

type Entry = Texture | 'loading' | 'missing';
const cache = new Map<string, Entry>();
const waiters = new Map<string, Set<ShaderMaterial>>();
const CAP = 56;
let loader: TextureLoader | null = null;

/** Counters for the debug API and the captures. */
export const relightStats = { bound: 0, loaded: 0, missing: 0, requested: 0 };

function adopt(m: ShaderMaterial, url: string, tex: Texture | null): void {
  if (m.userData['relightUrl'] !== url) return; // the figure moved on to another pose while this one loaded
  m.uniforms['relightNormal']!.value = tex ?? flatNormal();
  m.uniforms['relightOn']!.value = tex ? 1 : 0;
}

function fetchMap(url: string): void {
  cache.set(url, 'loading');
  relightStats.requested++;
  loader ??= new TextureLoader();
  loader.load(
    url,
    (t) => {
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
      if (cache.size > CAP) {
        for (const [k, v] of cache) {
          if (v instanceof Texture) {
            v.dispose();
            cache.delete(k);
            break;
          }
        }
      }
    },
    undefined,
    () => {
      cache.set(url, 'missing');
      relightStats.missing++;
      for (const m of waiters.get(url) ?? []) adopt(m, url, null);
      waiters.delete(url);
    },
  );
}

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
  const logical = !paintingUrl || placeholder ? null : logicalArtUrl(paintingUrl);
  // release 60: the art manifest names the maps the build ships; ask for one of those, and for none when the figure has none (no 404). No lightMaps in it: ask for the scale the painting wants, as before.
  const pick = logical === null ? null : normalMapScaleFor(artManifest(), logical, scale ?? 1);
  const mapUrl = logical === null || pick === null ? null : normalMapUrl(logical, pick ?? scale ?? 1);
  const url = mapUrl ? shippedArtUrl(mapUrl) : null;
  material.userData['relightUrl'] = url;
  if (!url) {
    u['relightNormal']!.value = flatNormal();
    u['relightOn']!.value = 0;
    return;
  }
  const hit = cache.get(url);
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
  }
}
