/**
 * Types for `tools/critic-pending.mjs`, so the unit tests (TypeScript, and
 * type-checked by `tsc --noEmit`) can import the marker helpers directly
 * instead of shelling out to node.
 *
 * Same arrangement as `tools/deploy-classify.mjs` / `deploy-classify.d.mts`.
 * This file declares the module's whole public surface — if you add an
 * export over there, add it here too.
 */

import type { CriticReport, ReviewPlan } from './critic-policy.mjs';

export type ObligationKind = 'live' | 'focused' | 'deep' | 'milestone';

/** One review a live build owes. Only a validated report for the same build settles it. */
export interface Obligation {
  kind: ObligationKind;
  status: 'pending' | 'done' | 'carried' | 'superseded-unverified';
  requires?: string;
  result?: 'PASS' | 'FAIL';
  settledBy?: string;
  settledAt?: string;
  carriedFrom?: string[];
  carriedTo?: string;
  origin?: string;
  note?: string;
}

export interface PendingMarkerInput {
  /** Short `git rev-parse --short HEAD` of the deployed commit. */
  mainSha: string;
  /** The `assets/index-<hash>.js` hash the live bundle was verified against. */
  bundle: string;
  /** ISO 8601 timestamp — the deploy script's own `isoNow`. */
  deployedAt: string;
  liveUrl: string;
  artFiles: number;
  /** Policy v2: the hash over every shipped file (tools/artifact-manifest.mjs). */
  artifactHash?: string | null;
  /** Policy v2: the review plan; with it the marker lists its obligations. */
  plan?: Pick<ReviewPlan, 'review' | 'obligations' | 'reasons' | 'systems' | 'chapters' | 'checks'>;
  carriedDeep?: string[];
  liveArtifact?: { result: string; checked: number; at: string } | null;
}

/** The marker's on-disk JSON shape: the five old fields, plus the v2 fields when a plan was given. */
export interface PendingMarker {
  mainSha: string;
  bundle: string;
  deployedAt: string;
  liveUrl: string;
  artFiles: number;
  policyVersion?: number;
  artifactHash?: string | null;
  review?: string;
  reasons?: string[];
  obligations?: Obligation[];
  supersededBy?: string;
  [key: string]: unknown;
}

export interface PendingMarkerEntry {
  /** Filename inside `critic/pending/`, e.g. `"a1b2c3d.json"`. */
  file: string;
  mainSha: string;
  bundle?: string;
  deployedAt?: string;
  liveUrl?: string;
  artFiles?: number;
  artifactHash?: string | null;
  review?: string;
  obligations?: Obligation[];
  /** Hours between `deployedAt` and the moment it was read; `0` if unknown. */
  ageHours: number;
  /** Set instead of the other fields when the file did not parse as JSON. */
  parseError?: string;
}

export declare function pendingMarkerFileName(mainSha: string): string;

export declare function pendingMarkerPath(pendingDir: string, mainSha: string): string;

export declare function obligationsForPlan(plan: { obligations?: string[] } | null | undefined, carriedDeep?: string[]): Obligation[];

export declare function buildPendingMarker(input: PendingMarkerInput): PendingMarker;

export declare function formatPendingMarker(marker: PendingMarker): string;

export declare function computeAgeHours(deployedAt: string, now?: Date): number;

/** The obligations a marker carries; a marker written under the old policy owes live, focused and deep. */
export declare function markerObligations(marker: { obligations?: Obligation[]; [key: string]: unknown }): Obligation[];

/** Writes the marker (and a `.gitkeep`) into `pendingDir`; returns the path written. */
export declare function writePendingMarker(pendingDir: string, marker: PendingMarker): string;

/** Reads every marker in `pendingDir`, oldest first; `[]` if the folder does not exist. */
export declare function readPendingMarkers(
  pendingDir: string,
  now?: Date,
): PendingMarkerEntry[];

export declare function applyReport(
  marker: PendingMarker,
  report: CriticReport,
  reportFile?: string | null,
): { marker: PendingMarker; settled: { kind: ObligationKind; result: string }[]; refused: { kind: ObligationKind; why: string }[] };

export declare function allSettled(marker: { obligations?: Obligation[]; [key: string]: unknown }): boolean;

/**
 * Every build that still owes a deep or milestone review, counting both each
 * marker's own build and the builds whose debt it carries (RULE B's cap of
 * `release.maxDeploysWithDeepOwed` deploys with a deep review owed).
 */
export declare function deepOwedBuilds(markers: (PendingMarker | PendingMarkerEntry)[]): string[];

export declare function supersedeMarkers(
  markers: PendingMarker[],
  newSha: string,
  when: string,
): { carriedDeep: string[]; closed: PendingMarker[] };

export declare function archiveMarker(pendingDir: string, clearedDir: string, marker: PendingMarker): string;

export declare function formatPendingWarningBlock(entries: PendingMarkerEntry[]): string[];
