/**
 * The release name a build is stamped with, the one place that knows how it travels.
 *
 * Bailey, 2026-10-08: the title screen shows a build number, `Release <name> · <8-character commit>`, and "the release
 * name is stamped by the deploy tool". The road is short and every stop is named here or next to it:
 *
 *   npm run deploy -- --release=39.4.2     (`tools/deploy-pages.mjs`; refuses unless the newest player note is 39.4.2)
 *     -> PYREFLY_RELEASE=39.4.2 in the environment of `vite build`   (RELEASE_ENV below)
 *     -> `__PYREFLY_RELEASE__` defined in vite.config.ts             (`releaseFromEnv`)
 *     -> src/app/changelog/buildInfo.ts draws "Release 39.4.2 · <commit>" on the title
 *     -> docs/deploys.log gets `release=39.4.2`                      (`formatDeployLogLine`)
 *
 * A dev server or a hand-run build sets nothing and shows the commit alone. A preview deploy sets `Preview`.
 *
 * `releaseFromEnv` THROWS on a value that is neither a release name nor `Preview`: a typo in the name must stop the
 * build, never ship a tag that reads wrong on the live title. Game case: both (delivery tooling, no gameplay).
 */

/** The environment variable the deploy tool sets and `vite.config.ts` reads. */
export const RELEASE_ENV = 'PYREFLY_RELEASE';

/** What a preview deploy is stamped with: the title shows `Preview · <commit>` (`src/app/changelog/buildInfo.ts`'s PREVIEW_RELEASE is the same word). */
export const PREVIEW_RELEASE = 'Preview';

/** A release name: `39.5`, `39.4.2`, `31a` (`src/app/changelog/releaseNotes.ts`'s RELEASE_NAME is the same shape). */
export const RELEASE_NAME_PATTERN = /^[0-9]+(?:\.[0-9]+)*[a-z]?$/;

/** True for a name `--release` may carry: a release name, never the word `Preview` (that one is the tool's own). */
export function isReleaseName(name) {
  return typeof name === 'string' && RELEASE_NAME_PATTERN.test(name);
}

/**
 * The release name this build is stamped with: '' when the environment names none (a dev server, a local build).
 * @param {Record<string, string | undefined>} [env]
 */
export function releaseFromEnv(env = process.env) {
  const raw = (env[RELEASE_ENV] ?? '').trim();
  if (raw === '') return '';
  if (raw === PREVIEW_RELEASE || isReleaseName(raw)) return raw;
  throw new Error(`${RELEASE_ENV}=${JSON.stringify(raw)} is not a release name (digits and dots, like 39.4.2) and not "${PREVIEW_RELEASE}"`);
}
