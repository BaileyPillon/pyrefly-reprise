/**
 * **The inputs of the production build, in one place** (both games; release tooling, no gameplay; release 61, the finding of the release 60 live check).
 *
 * The deploy (`tools/deploy-pages.mjs`) and a review's candidate (`tools/candidate-build.mjs`) must make the SAME bundle for the same commit, art and release name: the review
 * settles a build only if the bundle it reviewed is the bundle that went live (`tools/critic-pending.mjs`, "report bundle X is not the deployed bundle Y"). Release 60 broke
 * that quietly. The deploy builds with the host's base (`BASE_PATH=/` for Cloudflare, `hostBuildEnv`), the candidate set only the release name, so `vite.config.ts` fell back to its
 * own default `/pyrefly-reprise/` (the old GitHub Pages folder): 16 shipped files differed (index.html, the stylesheet, `index-*.js` and the five chunks that import it, whose
 * names hash their content), every one of them only by that URL prefix, and the reviewed `index-CXbIrsG6.js` was not the deployed `index-DwCdr0nf.js`. Releases 56 to 59 passed
 * because their reports named no bundle, so the comparison was skipped, not because they matched.
 *
 * So the environment of `vite build` is decided HERE, once, and both callers use it:
 *
 *   BASE_PATH            the host's base (Cloudflare `/`, the default host), never the shell's and never vite's own default
 *   PYREFLY_RELEASE      the newest player note's name (`tools/build-stamp.mjs`), never the shell's
 *   PYREFLY_SOURCEMAP_DIR  set by the deploy (the maps are kept, none ship), removed for a candidate; neither changes a byte that ships (proved on the release 60 tree)
 *
 * Three more variables decide bytes and are NOT pinned, because the deploy honours them on purpose (`PYREFLY_ART_WEBP=off` is its documented way to ship PNGs):
 * `PYREFLY_BUILD_SHA`, `PYREFLY_ART_WEBP`, `PYREFLY_ART_THUMBS`. {@link bundleInputs} reads all of them as `vite.config.ts` and the art plugin do, so a candidate can print what it
 * built with and say when the shell sets one of the three.
 *
 * Pure: no file, no process, no network. `tests/unit/release-build.test.ts` and `tests/unit/candidate-build.test.ts` hold the contract.
 */

import { RELEASE_ENV } from './build-stamp.mjs';
import { DEFAULT_HOST, HOSTS, hostBuildEnv } from './deploy-host.mjs';
import { SOURCEMAP_DIR_ENV } from './dist-filter.mjs';

/** The environment variable that overrides the commit the build stamps (`vite.config.ts` `buildSha`). */
export const BUILD_SHA_ENV = 'PYREFLY_BUILD_SHA';
/** `tools/art-derive-lib.mjs` `SCOPE_ENV`: which masters ship as WebP (default `exact`). */
export const ART_WEBP_ENV = 'PYREFLY_ART_WEBP';
/** `tools/art-thumbs.mjs` `THUMBS_ENV`: whether the board's strip thumbnails ship (default `on`). */
export const ART_THUMBS_ENV = 'PYREFLY_ART_THUMBS';
/** The base variable `vite.config.ts` reads (`PROD_BASE`). */
export const BASE_ENV = 'BASE_PATH';

/** The variables a build reads that the deploy leaves to the shell and a candidate therefore cannot pin. */
export const INHERITED_BUILD_ENV = Object.freeze([BUILD_SHA_ENV, ART_WEBP_ENV, ART_THUMBS_ENV]);

/**
 * The environment a production `vite build` runs in. The host's base and the release name are set explicitly, so nothing left in the shell decides them; the source-map folder
 * is set when given and removed otherwise (an inherited one would make hidden maps and write them to a folder nobody chose). Everything else is the caller's environment.
 * @param {{ release: string, host?: { base: string }, sourceMapDir?: string | null, env?: Record<string, string | undefined> }} input
 * @returns {Record<string, string | undefined>}
 */
export function releaseBuildEnv({ release, host = HOSTS[DEFAULT_HOST], sourceMapDir = null, env = process.env }) {
  const out = { ...env, ...hostBuildEnv(host), [RELEASE_ENV]: release };
  if (sourceMapDir) out[SOURCEMAP_DIR_ENV] = sourceMapDir;
  else delete out[SOURCEMAP_DIR_ENV];
  return out;
}

/** The vite arguments of a production build into `outDir`, emptying it first. The deploy writes the same words in its own `runNpx` call; `tests/unit/release-build.test.ts` holds them equal. */
export function releaseViteArgs(outDir) {
  return ['build', '--outDir', outDir, '--emptyOutDir'];
}

/**
 * What `vite.config.ts` and the art plugin will read from this environment, by name: the values that decide the bytes of the bundle (and of the shipped art list).
 * `buildSha` is the override only; without it the build stamps `git rev-parse` of the tree it runs in, which is the same for two builds of one commit.
 * @param {Record<string, string | undefined>} [env]
 */
export function bundleInputs(env = process.env) {
  const trimmed = (name) => (env[name] ?? '').trim();
  return {
    base: env[BASE_ENV] ?? HOSTS.github.base, // vite.config.ts: process.env.BASE_PATH ?? '/pyrefly-reprise/'
    release: trimmed(RELEASE_ENV),
    buildSha: trimmed(BUILD_SHA_ENV) || '(git HEAD of the tree)',
    artWebp: trimmed(ART_WEBP_ENV).toLowerCase() || 'exact',
    artThumbs: trimmed(ART_THUMBS_ENV).toLowerCase() || 'on',
  };
}

/**
 * The inputs on which two builds differ, as `{ key, a, b }`. Empty = the two builds read the same.
 * @param {ReturnType<typeof bundleInputs>} a
 * @param {ReturnType<typeof bundleInputs>} b
 */
export function diffBundleInputs(a, b) {
  return Object.keys({ ...a, ...b }).filter((key) => a[key] !== b[key]).map((key) => ({ key, a: a[key], b: b[key] }));
}

/** One line per input, for a build's header and a dry run. */
export function formatBundleInputs(inputs) {
  return [
    `base ${inputs.base}`,
    `release ${inputs.release === '' ? '(none)' : inputs.release}`,
    `build sha ${inputs.buildSha}`,
    `art WebP scope ${inputs.artWebp}`,
    `strip thumbnails ${inputs.artThumbs}`,
  ];
}

/**
 * The unpinned variables this shell sets to something other than the default, as `NAME=value`: the deploy reads the same variables from its own shell, so a build made here
 * matches a deploy cut elsewhere only if that shell sets the same. Empty = nothing to say.
 * @param {Record<string, string | undefined>} [env]
 */
export function inheritedBuildEnv(env = process.env) {
  return INHERITED_BUILD_ENV.filter((name) => (env[name] ?? '').trim() !== '').map((name) => `${name}=${(env[name] ?? '').trim()}`);
}
