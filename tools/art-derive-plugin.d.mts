import type { Plugin } from 'vite';

/** Types for `tools/art-derive-plugin.mjs` (release 38, "r38-bytes"): derives lossless WebP for the shipped painted art. */
export function pyreflyArtDerive(options?: { scope?: string; cacheDir?: string; jobs?: number }): Plugin;
