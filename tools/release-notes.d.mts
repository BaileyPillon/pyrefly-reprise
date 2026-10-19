/** Types for `tools/release-notes.mjs`: the deploy tool's gate on the player note of a release. */

/** Where the notes live, relative to the repository root. */
export declare const NOTES_FILE: string;

/** The notes module (`src/app/changelog/releaseNotes.ts`) loaded from a source tree. */
export declare function loadReleaseNotes(root: string): Promise<{
  RELEASE_NOTES: readonly unknown[];
  newestRelease(notes?: readonly unknown[]): string | null;
  validateReleaseNotes(notes: readonly unknown[]): string[];
}>;

export type ReleaseDecision = { ok: true; release: string; line: string } | { ok: false; error: string };

/** What release a deploy carries and whether it may go (pure). */
export declare function decideRelease(input: {
  requested: unknown;
  preview: boolean;
  newest: string | null;
  problems: readonly string[];
}): ReleaseDecision;

/** `decideRelease` fed from a source tree: reads the notes, runs the validator, decides. */
export declare function checkReleaseForDeploy(input: { root: string; requested: unknown; preview: boolean }): Promise<ReleaseDecision>;
