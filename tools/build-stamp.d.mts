/** Types for `tools/build-stamp.mjs`: how the release name travels from `--release` to the title screen's build number. */

/** The environment variable the deploy tool sets and `vite.config.ts` reads: `PYREFLY_RELEASE`. */
export declare const RELEASE_ENV: 'PYREFLY_RELEASE';

/** What a preview deploy is stamped with. */
export declare const PREVIEW_RELEASE: 'Preview';

/** A release name: `39.5`, `39.4.2`, `31a`. */
export declare const RELEASE_NAME_PATTERN: RegExp;

/** True for a name `--release` may carry (never the word `Preview`). */
export declare function isReleaseName(name: unknown): name is string;

/** The release name the environment stamps: '' when none; throws on a value that is not a release name or `Preview`. */
export declare function releaseFromEnv(env?: Record<string, string | undefined>): string;
