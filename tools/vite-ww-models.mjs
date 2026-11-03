/**
 * A production build checks the hidden Wind Waker chapter's models itself (the review of 2026-11-02; FFX-2 only in use, delivery plumbing; `tools/ww-models.mjs`).
 *
 * `public/models-exp/windwaker` (eleven `.glb`, 33.9 MB) is gitignored like `public/art` and `public/fx`, and `tools/dist-filter.mjs` ships it. A worktree, a `git archive` copy or a clean release tree has none, and the
 * chapter then stands a capsule in every slot with no error: the chapter's handoff asked the release driver to run `ww-models.mjs ensure` before the build and `verify` after it, steps `tools/deploy-pages.mjs` (over the
 * house limit, and the gate) does not have. This plugin does both inside `vite build`, so the deploy, a review's candidate (`tools/candidate-build.mjs`) and `npm run build` all get them with no change to any of those:
 *
 * - **before the build** (`configResolved`, before Vite copies `public/`): `ww-models.mjs ensure --warn`, which verifies the folder and restores what is missing or different from the backup (copies only, never deletes);
 * - **after the build** (`closeBundle`, after the dist-filter has pruned): the output's `models-exp/windwaker` is checked against the list, size and sha256. A **release build** (`PYREFLY_RELEASE` set: the deploy and a
 *   review's candidate always set it) that does not carry them intact FAILS, so the chapter cannot go live drawing capsules; any other build prints a warning and goes on.
 *
 * `PYREFLY_WW_MODELS=skip` turns both off (a release that knowingly ships the chapter on capsules). Build only: the dev server's `predev` runs `ensure --warn` (package.json). Nothing here deletes a file.
 */
import { spawnSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { RELEASE_ENV } from './build-stamp.mjs';
import { check } from './ww-models.mjs';

const TOOL = join(dirname(fileURLToPath(import.meta.url)), 'ww-models.mjs');

/** The environment variable that turns the plugin off. */
export const SKIP_ENV = 'PYREFLY_WW_MODELS';
/** The arguments of the one call made before the build: exactly `predev` and `prebuild`'s step. */
export const WW_ENSURE_ARGS = Object.freeze(['ensure', '--warn']);

/** Run `node tools/ww-models.mjs <args>` in this tree, its output on the build's own console. */
export function runWwModels(args) {
  const run = spawnSync(process.execPath, [TOOL, ...args], { stdio: 'inherit' });
  return run.status ?? 1;
}

/** Is this the build of a release or a candidate (the deploy and `tools/candidate-build.mjs` set `PYREFLY_RELEASE` for every build they make)? */
export function isReleaseBuild(env = process.env) {
  return (env[RELEASE_ENV] ?? '').trim() !== '';
}

/** The Vite plugin: `apply: 'build'`. `run`, `verify` and `env` are injectable for tests. */
export function pyreflyWwModels({ run = runWwModels, verify = (dir) => check(dir), env = process.env } = {}) {
  let outDir = 'dist';
  const off = () => env[SKIP_ENV] === 'skip';
  return {
    name: 'pyrefly-ww-models',
    apply: 'build',
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir);
      if (off()) return;
      try {
        run([...WW_ENSURE_ARGS]);
      } catch (error) {
        console.log(`ww-models: the check could not run (${error?.message ?? error}); the build goes on without it`);
      }
    },
    closeBundle() {
      if (off()) return;
      let bad;
      try {
        bad = verify(join(outDir, 'models-exp', 'windwaker'));
      } catch (error) {
        bad = [`the check could not run: ${error?.message ?? error}`];
      }
      if (bad.length === 0) {
        this.info?.("ww-models: the Wind Waker chapter's eleven models shipped intact");
        return;
      }
      const why = `${bad.slice(0, 3).join('; ')}${bad.length > 3 ? `; and ${bad.length - 3} more` : ''}`;
      const message = `ww-models: this build does not carry the Wind Waker chapter's models intact (${why}), so the chapter would draw capsules. Run \`node tools/ww-models.mjs ensure\`, or set ${SKIP_ENV}=skip to ship it on capsules on purpose`;
      if (isReleaseBuild(env)) throw new Error(message);
      this.warn?.(message);
    },
  };
}
