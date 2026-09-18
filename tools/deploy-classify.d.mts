/**
 * Types for `tools/deploy-classify.mjs`, so the unit tests (TypeScript, and
 * type-checked by `tsc --noEmit`) can import the classifier directly instead
 * of shelling out to node.
 *
 * Same arrangement as `tools/gen/manifest.d.mts`. This file declares the
 * module's whole public surface — if you add an export over there, add it here
 * too.
 */

/** `'build'` stops the deploy; `'noise'` is printed as a warning and ignored. */
export type DirtyCategory = 'build' | 'noise';

export interface PathVerdict {
  category: DirtyCategory;
  /** The rule that decided it, e.g. `docs/**` — printed next to the path. */
  rule: string;
}

export interface ParsedPorcelainLine {
  /** The two status columns, e.g. `' M'`, `'??'`, `'A '`, `'R '`. */
  code: string;
  /** One path, or two for a rename/copy (`old`, then `new`). */
  paths: string[];
  /** The line as git printed it, minus any trailing CR. */
  raw: string;
}

export interface PorcelainEntry extends ParsedPorcelainLine, PathVerdict {}

export interface PorcelainClassification {
  entries: PorcelainEntry[];
  buildRelevant: PorcelainEntry[];
  fleetNoise: PorcelainEntry[];
  /** True when at least one build-relevant path is dirty. */
  blocked: boolean;
}

/** Undo git's `core.quotePath` escaping; a non-quoted path is returned as-is. */
export declare function unquoteGitPath(raw: string): string;

/** Repo-relative, forward slashes, no `./` prefix or trailing slash. */
export declare function normalizePath(raw: string): string;

/** Split one porcelain v1 line into code + path(s); null for a blank line. */
export declare function parsePorcelainLine(line: string): ParsedPorcelainLine | null;

/** Classify one repo-relative path. `code` only matters to the untracked rule. */
export declare function classifyPath(path: string, code?: string): PathVerdict;

/** Classify one porcelain line; build-relevant if any of its paths is. */
export declare function classifyPorcelainLine(line: string): PorcelainEntry | null;

/** Classify a whole `git status --porcelain` dump. */
export declare function classifyPorcelain(
  porcelain: string | null | undefined,
): PorcelainClassification;
