/**
 * The release gate on the player note: `tools/deploy-pages.mjs` will not publish a release whose note is not written.
 *
 * Bailey, 2026-10-08 (title changelog, "all your recommendations"): the panel's text comes from ONE typed file of
 * short player notes (`src/app/changelog/releaseNotes.ts`), "a short player note per release is written before each
 * deploy, and the deploy refuses without it". So a deploy that publishes to a public address must:
 *
 *   1. name its release: `--release=<name>` (`npm run deploy -- --release=39.5`), a release name (`build-stamp.mjs`);
 *   2. find that same name at the TOP of the notes (the newest entry), so the panel's first line is this release;
 *   3. find the notes valid (`validateReleaseNotes`: three to six lines a release, tagged, nothing hidden named).
 *
 * A PREVIEW deploy (`--preview`) publishes to the preview address, is not a release and has no note: it is stamped
 * `Preview` and none of the three is asked of it. Nothing here touches the network or the build; `decideRelease` is
 * pure, so the tests give it any state they like, and `checkReleaseForDeploy` only reads the one source file.
 *
 * The notes are TypeScript with no imports and only erasable syntax, so Node loads them straight from the source tree
 * (the same way the other tools load `src/` modules). Game case: both (delivery tooling, no gameplay).
 */

import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

import { PREVIEW_RELEASE, RELEASE_ENV, isReleaseName } from './build-stamp.mjs';

/** Where the notes live, relative to the repository root. */
export const NOTES_FILE = 'src/app/changelog/releaseNotes.ts';

/** Load the notes module from a source tree (the real one for a deploy, a fixture for a test). */
export async function loadReleaseNotes(root) {
  return import(pathToFileURL(join(root, ...NOTES_FILE.split('/'))).href);
}

/**
 * What release a deploy carries, and whether it may go. Pure.
 *
 * @param {{ requested: unknown, preview: boolean, newest: string | null, problems: readonly string[] }} input
 *   `requested` is the raw `--release` value (a string, `true` for a bare flag, or undefined); `newest` is the first
 *   entry's release in the notes (null for an empty list); `problems` is what `validateReleaseNotes` found.
 * @returns {{ ok: true, release: string, line: string } | { ok: false, error: string }}
 */
export function decideRelease({ requested, preview, newest, problems }) {
  if (preview) {
    const ignored = typeof requested === 'string' && requested !== '' ? ` (--release=${requested} is ignored: a preview is not a release)` : '';
    return { ok: true, release: PREVIEW_RELEASE, line: `release: ${PREVIEW_RELEASE}, a preview is stamped as one and needs no player note${ignored}` };
  }
  const where = `src/app/changelog/releaseNotes.ts`;
  const newestIs = newest ? `the newest note there is ${newest}` : 'the file has no note at all';
  if (typeof requested !== 'string' || requested.trim() === '') {
    return {
      ok: false,
      error:
        `refusing to deploy: name the release with --release=<name>, for example npm run deploy -- --release=${newest ?? '39.5'}. ` +
        `The name is stamped on the title screen's build number (${RELEASE_ENV}) and must be the release whose player note is the newest in ${where} (${newestIs})`,
    };
  }
  const release = requested.trim();
  if (!isReleaseName(release)) {
    return { ok: false, error: `refusing to deploy: --release=${JSON.stringify(release)} is not a release name (digits and dots, like 39.5 or 39.4.2)` };
  }
  if (problems.length > 0) {
    return { ok: false, error: `refusing to deploy: the player notes in ${where} are not valid, fix them first:\n${problems.map((p) => `  - ${p}`).join('\n')}` };
  }
  if (newest !== release) {
    return {
      ok: false,
      error:
        `refusing to deploy: this deploy is --release=${release} but ${newestIs} (${where}). ` +
        `Write the ${release} note first, at the top of the list (three to six lines, in player words, each tagged FFX, FFX-2 or Both), commit it, then deploy again`,
    };
  }
  return { ok: true, release, line: `release: ${release}, its player note is the newest in ${where}` };
}

/**
 * `decideRelease` fed from a source tree: reads the notes, runs the validator, decides.
 * @param {{ root: string, requested: unknown, preview: boolean }} input
 */
export async function checkReleaseForDeploy({ root, requested, preview }) {
  let mod;
  try {
    mod = await loadReleaseNotes(root);
  } catch (err) {
    if (preview) return decideRelease({ requested, preview, newest: null, problems: [] });
    return { ok: false, error: `refusing to deploy: could not read the player notes (${NOTES_FILE}): ${err instanceof Error ? err.message : String(err)}` };
  }
  const notes = mod.RELEASE_NOTES;
  return decideRelease({ requested, preview, newest: mod.newestRelease(notes), problems: mod.validateReleaseNotes(notes) });
}
