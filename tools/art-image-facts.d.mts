/** Types for `tools/art-image-facts.mjs` (release 38, "r38-bytes"): what a picture's pixels and a PNG's bytes say about every decoder drawing it the same. */

export type ArtAlpha = 'opaque' | 'binary' | 'translucent';

export const ALPHA_CLASSES: readonly ArtAlpha[];
/** Chunks that can change how a decoder reads or orients the pixels. */
export const COLOUR_CHUNKS: readonly string[];

/** Class (every alpha 255 / only 0 and 255 / anything else), fully transparent texels, and how many of those still carry colour. */
export function alphaInfoOf(rgba: Uint8Array): { alpha: ArtAlpha; transparent: number; hidden: number };
export function alphaClassOf(rgba: Uint8Array): ArtAlpha;
/** Opaque, or only alpha 0 and 255 with nothing hidden under alpha 0 (`hidden` exactly 0): premultiplying is the identity on every pixel. */
export function decoderIndependent(alpha: ArtAlpha | null | undefined, hidden: number | null | undefined): boolean;

/** Chunk types before the first IDAT. */
export function pngChunkTypes(buf: Uint8Array): string[];
export function pngChunks(buf: Buffer): Array<{ type: string; start: number; end: number }>;
/** The PNG with only the signature, critical chunks and `tRNS`, each byte for byte. */
export function stripAncillaryChunks(buf: Buffer): Buffer;
