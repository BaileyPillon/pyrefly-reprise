export declare const HASHED_DIR: string;
/** The Cache-Control each class is served with (`revalidate` is the host's own default, so it has none of ours). */
export declare const CACHE_CLASSES: Readonly<{ immutable: string; revalidate: null }>;
/** True for a file under `assets/` named the way Vite names a content-hashed file. */
export declare function isContentHashed(path: string): boolean;
/** The cache class a build's file must have. */
export declare function classifyCache(path: string): { cache: 'immutable' | 'revalidate'; cacheControl: string | null };
/** Does a `_headers` URL pattern match this site path (`*` is a splat)? */
export declare function patternMatches(pattern: string, path: string): boolean;
/** The rules of a `_headers` text, each with the Cache-Control it carries. */
export declare function cacheRules(text: string): Array<{ pattern: string; cacheControl: string | null }>;
/** What a `_headers` text makes of a path. */
export declare function cacheFromHeaders(path: string, text: string): 'immutable' | 'revalidate';
/** The paths a `_headers` text would cache for a year that are not content-hashed (none: the rule is safe). */
export declare function unhashedUnderRule(text: string, paths: Iterable<string>): string[];
