/** Types for `tools/vite-art-at.mjs`, so `vite.config.ts` and the unit tests (type-checked by `tsc --noEmit`) can import it. */
import type { Plugin } from 'vite';

/** `url` with every `%40` in the path of an `art/` URL written back as `@`; the query, the hash and every other URL come back as they are. */
export declare function atSignInArtPath(url: string): string;
/** Dev server and `vite preview` only: serves `idle%402x.png` from the file `idle@2x.png` instead of falling through to the page. */
export declare function pyreflyArtAtSign(): Plugin;
