/**
 * The lighting maps in the art manifest (release 60, the conference demo build; both games, shared plumbing): which `<pose>.normal.png`, `<pose>@2x.normal.png` and
 * `backdrops/<room>.depth.png` a build ships, so the HD-2D look asks for those and no others. No DOM, no fetch; `ArtManifest.ts` owns the loading and the cache.
 *
 * The maps are made apart from the paintings (`D:/pyrefly-art-maps`, decision 150d) and only the figures of the chapters that run the look have them. Before this the game asked for
 * every painted pose's map and a pose with none was a 404, a red line in the console (a figure the maps do not cover, such as the gunner dresssphere, 404s on every pose). The
 * manifest (`tools/gen/manifest.mjs`) now lists the maps a tree holds as `lightMaps`, the way it lists `rigs`:
 *
 *   - `normal`: `{ tidus: { idle: [1, 2], attack: [1] } }`: per subject, per chosen state, the map scales shipped (1 = `<state>.normal.png`, 2 = `<state>@2x.normal.png`);
 *   - `depth`: the backdrop keys with a `<key>.depth.png`.
 *
 * `lightMaps` absent means the tree holds no lighting map at all and the game probes as it always did (the dev server, whose maps come from outside `public/art`); present, it is the
 * whole list: a map it does not name is not requested. A figure drawn from a 2x or larger master wants the 2x map; a build that ships only the base map (the demo build's choice, to
 * keep the payload small: a normal map is smooth, and the base map is already one texel to a screen pixel at 1440p) serves it from that, never from nothing.
 */
import { logicalArtUrl } from './ArtShipped.ts';
import type { ArtManifest } from './ArtManifest.ts';

/** `{ normal: { subject: { state: [1, 2] } }, depth: ['gagazet'] }`. */
export interface LightMaps {
  readonly normal: Readonly<Record<string, Readonly<Record<string, readonly number[]>>>>;
  readonly depth: readonly string[];
}

/** `lightMaps` from untrusted JSON: scales 1 to 4 only, ascending, no empty entries; null when it is not an object (the game then probes). */
export function parseLightMaps(raw: unknown): LightMaps | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const obj = raw as Record<string, unknown>;
  const normal: Record<string, Record<string, readonly number[]>> = {};
  if (obj['normal'] && typeof obj['normal'] === 'object' && !Array.isArray(obj['normal'])) {
    for (const [subject, states] of Object.entries(obj['normal'] as Record<string, unknown>)) {
      if (!states || typeof states !== 'object' || Array.isArray(states)) continue;
      const row: Record<string, readonly number[]> = {};
      for (const [state, list] of Object.entries(states as Record<string, unknown>)) {
        const scales = Array.isArray(list) ? [...new Set(list.filter((n): n is number => typeof n === 'number' && Number.isInteger(n) && n >= 1 && n <= 4))].sort((a, b) => a - b) : [];
        if (scales.length) row[state] = scales;
      }
      if (Object.keys(row).length) normal[subject] = row;
    }
  }
  const depth = Array.isArray(obj['depth']) ? obj['depth'].filter((s): s is string => typeof s === 'string') : [];
  return { normal, depth };
}

/** `{ lightMaps }` when the manifest has the key and it parses, else nothing (so a manifest without one reads exactly as it did). */
export function lightMapsField(raw: unknown): { lightMaps?: LightMaps } {
  const maps = parseLightMaps(raw);
  return maps ? { lightMaps: maps } : {};
}

/** `art/characters/<subject>/<state>[@Nx].png` read apart (the painting's logical name): what the manifest indexes a figure's maps by. */
const FIGURE_PAINTING = /(?:^|\/)art\/characters\/([^/?#]+)\/([A-Za-z0-9][A-Za-z0-9_-]*)(?:@[2-4]x)?\.png(?:$|[?#])/;

/**
 * The scale of the normal map to ask for a painting (`paintingLogicalUrl`, drawn from a master of scale `drawnAt`): 1 or 2.
 *   - `undefined`: the manifest has no opinion (none loaded, or it lists no lighting map): ask for the scale the painting wants and probe, as before;
 *   - `null`: the manifest lists the build's maps and none is for this painting: ask for nothing;
 *   - 1 or 2: the largest scale listed that the painting wants (a 2x or larger master wants 2), else the smallest listed (a bigger map beats none).
 */
export function normalMapScaleFor(manifest: ArtManifest | null, paintingLogicalUrl: string, drawnAt: number): 1 | 2 | null | undefined {
  const wants = drawnAt >= 2 ? 2 : 1;
  const maps = manifest?.lightMaps;
  if (!maps) return undefined;
  const m = FIGURE_PAINTING.exec(logicalArtUrl(paintingLogicalUrl));
  const listed = m ? maps.normal[m[1]!]?.[m[2]!] : undefined;
  if (!listed || listed.length === 0) return null;
  const fit = listed.filter((s) => s <= wants);
  const pick = fit.length ? Math.max(...fit) : Math.min(...listed);
  return pick >= 2 ? 2 : 1;
}

/** Does the build ship `backdrops/<key>.depth.png`? `null` when the manifest has no opinion (probe, as before). */
export function depthMapListed(manifest: ArtManifest | null, key: string): boolean | null {
  const maps = manifest?.lightMaps;
  return maps ? maps.depth.includes(key) : null;
}
