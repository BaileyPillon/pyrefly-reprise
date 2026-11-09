/** Types for `tools/vite-lake-models.mjs`, so `vite.config.ts` and the unit tests (type-checked by `tsc --noEmit`) can import it. */
import type { Plugin } from 'vite';

/** The environment variable that turns the plugin off (`skip` or `capsules`). */
export declare const SKIP_ENV: 'PYREFLY_LAKE_MODELS';
/** The arguments of the one call made before the build: exactly `predev` and `prebuild`'s step (`node tools/lake-models.mjs ensure --warn`). */
export declare const LAKE_ENSURE_ARGS: readonly ['ensure', '--warn'];
/** Run `node tools/lake-models.mjs <args>` in this tree, its output on the build's own console; the exit status. */
export declare function runLakeModels(args: readonly string[]): number;
/**
 * Build only: restores the Wendigo chapter's models before the build (`ensure --warn`) and checks the output's `models-exp/lake` after it; a release build that does not carry them intact fails, any other warns.
 * `run`, `verify` (problems found in a build root, empty = intact) and `env` are injectable for tests.
 */
export declare function pyreflyLakeModels(options?: {
  run?: (args: string[]) => number;
  verify?: (root: string) => string[];
  env?: Record<string, string | undefined>;
}): Plugin;
