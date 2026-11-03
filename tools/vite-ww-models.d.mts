/** Types for `tools/vite-ww-models.mjs`, so `vite.config.ts` and the unit tests (type-checked by `tsc --noEmit`) can import it. */
import type { Plugin } from 'vite';

/** The environment variable that turns the plugin off (`skip`). */
export declare const SKIP_ENV: 'PYREFLY_WW_MODELS';
/** The arguments of the one call made before the build: exactly `predev` and `prebuild`'s step (`node tools/ww-models.mjs ensure --warn`). */
export declare const WW_ENSURE_ARGS: readonly ['ensure', '--warn'];
/** Run `node tools/ww-models.mjs <args>` in this tree, its output on the build's own console; the exit status. */
export declare function runWwModels(args: readonly string[]): number;
/** Is this the build of a release or a candidate (`PYREFLY_RELEASE` is set)? */
export declare function isReleaseBuild(env?: Record<string, string | undefined>): boolean;
/**
 * Build only: restores the Wind Waker chapter's models before the build (`ensure --warn`) and checks the output's `models-exp/windwaker` after it; a release build that does not carry them intact fails, any other warns.
 * `run`, `verify` (problems found in a folder, empty = intact) and `env` are injectable for tests.
 */
export declare function pyreflyWwModels(options?: {
  run?: (args: string[]) => number;
  verify?: (dir: string) => string[];
  env?: Record<string, string | undefined>;
}): Plugin;
