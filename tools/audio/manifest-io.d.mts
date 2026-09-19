/**
 * Types for `tools/audio/manifest-io.mjs`, so the unit tests (TypeScript, and
 * type-checked by `tsc --noEmit`) can drive the locking directly rather than
 * shelling out to node for everything.
 *
 * The file these functions write is parsed at runtime by
 * `src/audio/manifest.ts` — `MusicEntry` there is the browser-side mirror of
 * what `musicEntry()` builds here, and it is deliberately tolerant: a key it
 * does not recognise is ignored, so adding a field to this side never breaks
 * the game.
 */

export interface ManifestMusicEntry {
  file: string;
  loopStart: number;
  loopEnd: number;
  duration: number;
  bytes?: number;
  lufs?: number;
  truePeakDb?: number;
  [key: string]: unknown;
}

export interface ManifestSfxSprite {
  file: string;
  duration: number;
  bytes?: number;
  cues: Record<string, unknown>;
  [key: string]: unknown;
}

export interface AudioManifestFile {
  version: number;
  sampleRate: number;
  music: Record<string, ManifestMusicEntry>;
  sfx: ManifestSfxSprite | null;
  [key: string]: unknown;
}

export interface ManifestPatch {
  sampleRate?: number;
  music?: Record<string, ManifestMusicEntry>;
  /** Omit to leave the sprite alone; `null` clears it. */
  sfx?: ManifestSfxSprite | null;
}

export interface MusicEntryInput {
  name: string;
  loopStartSample: number;
  loopEndSample: number;
  totalSamples: number;
  sampleRate: number;
  bytes: number;
  lufs: number;
  truePeakDb: number;
}

/** Six. Four decimals is 4.4 samples at 44.1 kHz, which moves the loop seam. */
export declare const LOOP_DECIMALS: number;

export declare function manifestPath(outRoot: string): string;

export declare function readManifest(outRoot: string): Promise<AudioManifestFile>;

/** Run `fn` with the manifest lock held. Keep it short: everyone else waits. */
export declare function withManifestLock<T>(outRoot: string, fn: () => Promise<T> | T): Promise<T>;

/** Merge these entries into whatever is on disk now. Returns the result. */
export declare function mergeIntoManifest(
  outRoot: string,
  patch: ManifestPatch,
): Promise<AudioManifestFile>;

/** Edit the live manifest in place under the lock. */
export declare function updateManifest(
  outRoot: string,
  mutate: (live: AudioManifestFile) => AudioManifestFile | void | Promise<AudioManifestFile | void>,
): Promise<AudioManifestFile>;

export declare function secondsAtSample(sample: number, sampleRate: number): number;

export declare function musicEntry(input: MusicEntryInput): ManifestMusicEntry;
