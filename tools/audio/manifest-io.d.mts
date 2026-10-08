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

/** The shipping budget for public/audio in bytes: 90 MB since D-306 (sfx sprite-v2 at LAME V0); 85 MB under D-292. */
export declare const AUDIO_BUDGET_BYTES: number;

/** The recorded voice-over's own budget line beside the audio cap (20 MB, the design's proposal; awaiting Bailey). */
export declare const VOICE_BUDGET_BYTES: number;

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

/**
 * Replace one music entry's block in the manifest's text, leaving every other byte as it was (line endings, the
 * `-16.0` float style, the other entries). Throws when the entry is missing. Callers hold the manifest lock.
 */
export declare function setMusicEntryText(
  text: string,
  name: string,
  entry: { file: string; [key: string]: string | number | undefined },
): string;

/**
 * The `source` an entry names when its MP3 was made outside the score (the ElevenLabs takes of 2026-10-07), else
 * `null`. Such an entry is exempt from the freshness checks against the score in `qa.mjs` and
 * `audio-shipped-files.test.ts`; the game ignores the field.
 */
export declare function externalSource(entry: { source?: unknown } | null | undefined): string | null;
