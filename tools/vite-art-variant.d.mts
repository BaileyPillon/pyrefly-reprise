/** Types for `tools/vite-art-variant.mjs`, so `vite.demo.config.ts` and the unit tests (type-checked by `tsc --noEmit`) can import it. */
import type { Plugin } from 'vite';

/** The URL prefix of Tidus's paintings. */
export declare const TIDUS_PREFIX: '/art/characters/tidus/';
/** The cookie that remembers `?tidus=t1|t2`. */
export declare const TIDUS_COOKIE: 'pyrefly_tidus';
/** The folder holding the T2 Tidus, or null. */
export declare function t2Folder(env?: Record<string, string | undefined>): string | null;
/** `t1` or `t2` for a request: the page's `?tidus=` first, then the cookie, else `t1`. */
export declare function variantOf(url: string | undefined, cookieHeader: string | undefined): 't1' | 't2';
/** The plain file name of a Tidus art request, or null (anything else is not ours). */
export declare function tidusFile(pathname: string): string | null;
/** Dev server and `vite preview` of `vite.demo.config.ts` only: Tidus T1 or T2 by the address or the cookie. */
export declare function pyreflyArtVariant(): Plugin;
