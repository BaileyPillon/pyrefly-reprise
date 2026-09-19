/**
 * Types for `tools/critic-pending.mjs`, so the unit tests (TypeScript, and
 * type-checked by `tsc --noEmit`) can import the marker helpers directly
 * instead of shelling out to node.
 *
 * Same arrangement as `tools/deploy-classify.mjs` / `deploy-classify.d.mts`.
 * This file declares the module's whole public surface — if you add an
 * export over there, add it here too.
 */

export interface PendingMarkerInput {
  /** Short `git rev-parse --short HEAD` of the deployed commit. */
  mainSha: string;
  /** The `assets/index-<hash>.js` hash the live bundle was verified against. */
  bundle: string;
  /** ISO 8601 timestamp — the deploy script's own `isoNow`. */
  deployedAt: string;
  liveUrl: string;
  artFiles: number;
}

/** The marker's on-disk JSON shape — currently identical to its input. */
export type PendingMarker = PendingMarkerInput;

export interface PendingMarkerEntry {
  /** Filename inside `critic/pending/`, e.g. `"a1b2c3d.json"`. */
  file: string;
  mainSha: string;
  bundle?: string;
  deployedAt?: string;
  liveUrl?: string;
  artFiles?: number;
  /** Hours between `deployedAt` and the moment it was read; `0` if unknown. */
  ageHours: number;
  /** Set instead of the other fields when the file did not parse as JSON. */
  parseError?: string;
}

export declare function pendingMarkerFileName(mainSha: string): string;

export declare function pendingMarkerPath(pendingDir: string, mainSha: string): string;

export declare function buildPendingMarker(input: PendingMarkerInput): PendingMarker;

export declare function formatPendingMarker(marker: PendingMarker): string;

export declare function computeAgeHours(deployedAt: string, now?: Date): number;

/** Writes the marker (and a `.gitkeep`) into `pendingDir`; returns the path written. */
export declare function writePendingMarker(pendingDir: string, marker: PendingMarker): string;

/** Reads every marker in `pendingDir`, oldest first; `[]` if the folder does not exist. */
export declare function readPendingMarkers(
  pendingDir: string,
  now?: Date,
): PendingMarkerEntry[];

export declare function formatPendingWarningBlock(entries: PendingMarkerEntry[]): string[];
