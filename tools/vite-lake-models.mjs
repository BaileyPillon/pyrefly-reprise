/**
 * A production build checks the hidden Wendigo chapter's models itself (ch-wendigo, 2026-11-07; Chapter 49, FFX only, delivery plumbing; `tools/lake-models.mjs`, `tools/lake-models-verify.mjs`).
 *
 * `public/models-exp/lake` (28 `.glb`, about 170 MiB) is gitignored like `public/art`, `public/fx` and the Wind Waker folder, and `tools/dist-filter.mjs` ships exactly those files. A worktree, a `git archive` copy or a clean
 * release tree has none, and the chapter then stands a capsule in every slot with no error. The same two steps the Wind Waker chapter's plugin (`tools/vite-ww-models.mjs`) makes, so the deploy, a review's candidate
 * (`tools/candidate-build.mjs`) and `npm run build` all get them with no change to any of those:
 *
 * - **before the build** (`configResolved`, before Vite copies `public/`): `lake-models.mjs ensure --warn`, which verifies the folder and restores what is missing or different from the models store (copies only, never deletes);
 * - **after the build** (`closeBundle`, after the dist-filter has pruned): the output's `models-exp/lake` must hold exactly the 28 files, whole, with the recorded size and sha256 (`verifyLakeModels`). A **release build** (`PYREFLY_RELEASE` set: the deploy
 *   and a review's candidate always set it) that does not carry them fails, so the chapter cannot go live drawing capsules; any other build prints a warning and goes on.
 *
 * `PYREFLY_LAKE_MODELS=skip` (or `capsules`, the word the deploy's gate takes) turns both off (a release that knowingly ships the chapter on capsules). Build only: the dev server's `predev` runs `ensure --warn` (package.json). Nothing here deletes a file.
 */
import { spawnSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { isReleaseBuild } from './vite-ww-models.mjs';
import { verifyLakeModels } from './lake-models-verify.mjs';
import { LAKE_SHIPPED_FILES } from '../src/data/ffx/lake-models.ts';

const TOOL = join(dirname(fileURLToPath(import.meta.url)), 'lake-models.mjs');

/** The environment variable that turns the plugin off (`skip` or `capsules`). */
export const SKIP_ENV = 'PYREFLY_LAKE_MODELS';
/** The arguments of the one call made before the build: exactly `predev` and `prebuild`'s step. */
export const LAKE_ENSURE_ARGS = Object.freeze(['ensure', '--warn']);

/** Run `node tools/lake-models.mjs <args>` in this tree, its output on the build's own console. */
export function runLakeModels(args) {
  const run = spawnSync(process.execPath, [TOOL, ...args], { stdio: 'inherit' });
  return run.status ?? 1;
}

/** The Vite plugin: `apply: 'build'`. `run`, `verify` (the problems found in a build root, empty = intact) and `env` are injectable for tests. */
export function pyreflyLakeModels({ run = runLakeModels, verify = (root) => verifyLakeModels(root).problems, env = process.env } = {}) {
  let outDir = 'dist';
  const off = () => env[SKIP_ENV] === 'skip' || env[SKIP_ENV] === 'capsules';
  return {
    name: 'pyrefly-lake-models',
    apply: 'build',
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir);
      if (off()) return;
      try {
        run([...LAKE_ENSURE_ARGS]);
      } catch (error) {
        console.log(`lake-models: the check could not run (${error?.message ?? error}); the build goes on without it`);
      }
    },
    closeBundle() {
      if (off()) return;
      let bad;
      try {
        bad = verify(outDir);
      } catch (error) {
        bad = [`the check could not run: ${error?.message ?? error}`];
      }
      if (bad.length === 0) {
        this.info?.(`lake-models: the Wendigo chapter's ${LAKE_SHIPPED_FILES.length} models shipped intact`);
        return;
      }
      const why = `${bad.slice(0, 3).join('; ')}${bad.length > 3 ? `; and ${bad.length - 3} more` : ''}`;
      const message = `lake-models: this build does not carry the Wendigo chapter's models intact (${why}), so the chapter would draw capsules. Run \`node tools/lake-models.mjs ensure\`, or set ${SKIP_ENV}=skip to ship it on capsules on purpose`;
      if (isReleaseBuild(env)) throw new Error(message);
      this.warn?.(message);
    },
  };
}
