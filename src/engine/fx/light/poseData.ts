import { TextureLoader, type Texture } from 'three';
import headBoxes from './headBoxes.json';
import { GLINTS, type GlintPoint } from './glints.ts';

/**
 * Figure lighting MOCKUPS (`lightFlags.ts`): what the lights know about one painted pose, found by its URL.
 *
 * - the FACE GUARD box: the reviewed head box of `docs/target/pose-measure.json` (`headBoxes.json`, made by
 *   `tools/lighting/heads.mjs`), else, for a figure that has boxes for other poses (a person, not a creature), the top fifth of
 *   the painting's own silhouette at reduced strength, else none (Mortiorchis, Bahamut: nothing there is a face to protect);
 * - the NORMAL MAP of the pose (look 2): `tools/lighting/normals.py`'s Depth Anything V2 Small maps, which only the dev server
 *   serves, at `/__lightmaps/` (`tools/lighting/vite-lighting.config.mjs`). A build has none, the manifest does not load and
 *   the look uses the bevel's dome instead. Loaded on first use, the dome until then;
 * - the hand-placed stars (`glints.ts`).
 */

export interface PoseLight {
  key: string | null;
  /** The head box [u0, v0, u1, v1] in the painting's uv, or null. */
  head: readonly [number, number, number, number] | null;
  /** How firmly the face guard holds, 0 to 1. */
  face: number;
  glints: readonly GlintPoint[];
  normal: Texture | null;
}

const BOXES = headBoxes as unknown as Record<string, [number, number, number, number]>;
const PEOPLE = new Set(Object.keys(BOXES).map((k) => k.split('/')[0]!));

/** Seymour Flux's face by eye (his painting fills its canvas and the review has no box for a foe): the same on each pose. */
const FOE_FACES: Record<string, [number, number, number, number]> = {
  'seymour-flux-body/idle': [0.36, 0.69, 0.54, 0.87],
  'seymour-flux-body/attack': [0.36, 0.69, 0.5, 0.86],
  'seymour-flux-body/cast': [0.4, 0.68, 0.58, 0.87],
  'seymour-flux-body/hurt': [0.45, 0.65, 0.64, 0.86],
  'seymour-flux-body/ko': [0.4, 0.66, 0.58, 0.86],
  'seymour-flux-body/telegraph': [0.4, 0.66, 0.58, 0.86],
};

/** `characters/<id>/<pose>[@2x].png|webp` -> the id and the pose file. */
export function poseKeyOf(url: string | undefined): { id: string; pose: string } | null {
  if (!url) return null;
  const m = /characters\/([^/]+)\/([^/@.?]+)(?:@\d+x)?\.(?:png|webp)/.exec(url);
  return m ? { id: m[1]!, pose: m[2]! } : null;
}

const MAPS = `${import.meta.env?.BASE_URL ?? '/'}__lightmaps/`;
const loader = new TextureLoader();
const cache = new Map<string, Texture | null | 'loading'>();
let manifest: Set<string> | null = null;
let manifestLoad: Promise<void> | null = null;

function loadManifest(): void {
  if (manifestLoad || typeof fetch === 'undefined') return;
  manifestLoad = fetch(`${MAPS}manifest.json`, { cache: 'no-store' })
    .then((r) => (r.ok ? r.json() : { maps: [] }))
    .then((m: { maps?: string[] }) => {
      manifest = new Set(m.maps ?? []);
    })
    .catch(() => {
      manifest = new Set();
    });
}

function normalFor(id: string, pose: string): Texture | null {
  loadManifest();
  const stem = `${id}__${pose}`;
  const hit = cache.get(stem);
  if (hit === 'loading') return null;
  if (hit !== undefined) return hit;
  if (!manifest) return null; // the manifest has not arrived: ask again next frame
  if (!manifest.has(stem)) {
    cache.set(stem, null);
    return null;
  }
  cache.set(stem, 'loading');
  loader.load(
    `${MAPS}${stem}.png`,
    (t) => cache.set(stem, t), // data, not colour: the loader's default (no colour space) is right
    undefined,
    () => cache.set(stem, null),
  );
  return null;
}

const bboxCache = new Map<string, readonly [number, number, number, number, number] | null>();

/** The painting's silhouette [u0, v0, u1, v1] and the x of its mass in the top fifth, from a 64x96 reading of its alpha. */
function silhouetteOf(tex: Texture | null | undefined): readonly [number, number, number, number, number] | null {
  if (!tex) return null;
  const hit = bboxCache.get(tex.uuid);
  if (hit !== undefined) return hit;
  const img = tex.image as (CanvasImageSource & { width?: number }) | undefined;
  if (!img?.width || typeof document === 'undefined') return null;
  let out: readonly [number, number, number, number, number] | null = null;
  try {
    const w = 64;
    const h = 96;
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const g = c.getContext('2d', { willReadFrequently: true });
    if (g) {
      g.drawImage(img, 0, 0, w, h);
      const d = g.getImageData(0, 0, w, h).data;
      let x0 = w, y0 = h, x1 = -1, y1 = -1;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3]! > 40) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
      if (x1 >= 0) {
        const band = Math.max(2, Math.round((y1 - y0) * 0.2));
        let sx = 0, n = 0;
        for (let y = y0; y < y0 + band; y++) for (let x = x0; x <= x1; x++) if (d[(y * w + x) * 4 + 3]! > 120) {
          sx += x;
          n++;
        }
        out = [x0 / w, 1 - (y1 + 1) / h, (x1 + 1) / w, 1 - y0 / h, n ? (sx / n + 0.5) / w : (x0 + x1 + 1) / (2 * w)];
      }
    }
  } catch {
    out = null;
  }
  bboxCache.set(tex.uuid, out);
  return out;
}

export class PoseLights {
  private readonly byUrl = new Map<string, PoseLight>();
  private readonly asked = new Set<string>();

  /** Has the manifest of maps arrived (so a preload has gone through)? */
  ready(): boolean {
    return manifest !== null;
  }

  /** Start loading the normal maps of every pose in `urls` (once), so a pose swap finds its map already there. */
  preload(urls: Iterable<string | undefined>): void {
    for (const u of urls) {
      const k = poseKeyOf(u);
      if (!k || this.asked.has(`${k.id}/${k.pose}`)) continue;
      if (!manifest) {
        loadManifest();
        return; // ask again once the manifest is here
      }
      this.asked.add(`${k.id}/${k.pose}`);
      normalFor(k.id, k.pose);
    }
  }

  /** What the lights know about the pose at `url`, whose painting texture is `tex` (null until it loads). */
  get(url: string | undefined, tex: Texture | null | undefined, withNormals: boolean): PoseLight {
    const k = poseKeyOf(url);
    const key = k ? `${k.id}/${k.pose}` : null;
    const id = `${url ?? ''}|${tex?.uuid ?? ''}`;
    let p = this.byUrl.get(id);
    if (!p) {
      let head: PoseLight['head'] = key ? (BOXES[key] ?? FOE_FACES[key] ?? null) : null;
      let face = head ? 1 : 0;
      if (!head && k && PEOPLE.has(k.id)) {
        const s = silhouetteOf(tex);
        if (s) {
          const ht = (s[3] - s[1]) * 0.2;
          const aspect = (tex!.image as { height: number; width: number }).height / (tex!.image as { width: number }).width;
          const hw = ht * aspect * 0.8;
          head = [s[4] - hw / 2, s[3] - ht, s[4] + hw / 2, s[3]];
          face = 0.55;
        }
      }
      p = { key, head, face, glints: key ? (GLINTS[key] ?? []) : [], normal: null };
      if (tex) this.byUrl.set(id, p); // a stand-in with no painting yet is read again once it has one
    }
    if (withNormals && k && !p.normal) p.normal = normalFor(k.id, k.pose);
    return p;
  }
}
