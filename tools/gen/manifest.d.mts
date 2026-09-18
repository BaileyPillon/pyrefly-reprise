/**
 * Types for `tools/gen/manifest.mjs`, so the unit tests (which are TypeScript
 * and type-checked by `tsc --noEmit`) can import the builder directly instead
 * of shelling out to node.
 *
 * The shapes here are the *same* contract `src/engine/ArtManifest.ts` reads at
 * runtime — see `ArtManifest` there, which is the browser-side mirror.
 */

export interface ManifestSubject {
  /** Chosen poses on disk, sorted; always includes `idle` for a healthy subject. */
  states: string[];
  /** True when `portraits/<id>.png` exists. */
  portrait: boolean;
  /**
   * The sidecar's `facing`, lower-cased and otherwise untouched — the runtime's
   * `parseArtFacing` owns which spellings mean what.
   */
  facing?: string;
}

export interface ArtManifestFile {
  version: number;
  generatedAt: string;
  subjects: Record<string, ManifestSubject>;
  portraits: string[];
  backdrops: string[];
  pause: string[];
}

export interface BuildManifestOptions {
  /** Fixed timestamp, so a test can assert on the whole object. */
  now?: string;
}

export interface BuildManifestResult {
  manifest: ArtManifestFile;
  /** Human-readable problems (missing sidecar, no idle, empty folder). */
  warnings: string[];
  /** `"<id>/<state>"` for states that exist only as un-promoted variants. */
  variantsOnly: string[];
}

export interface WriteManifestResult extends BuildManifestResult {
  path: string;
  changed: boolean;
}

export declare const DEFAULT_ART_ROOT: string;

export declare function buildManifest(
  artRoot?: string,
  opts?: BuildManifestOptions,
): BuildManifestResult;

export declare function writeManifest(
  artRoot?: string,
  opts?: BuildManifestOptions & { check?: boolean },
): WriteManifestResult;
