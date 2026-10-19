/**
 * Music batch 2 (2026-10-12), as the older record tests need to see it.
 *
 * Each record test (`audio-music-v2`, `-o1`, `-elevenlabs`, `-elevenlabs-2026-10-10`, `-batch1-2026-10-10`, `audio-stereo-gate-53e`) pins the files its own record measured and steps aside
 * for a cue a later record replaced. Batch 2 replaced 18 cues in place, added 9 and retired 3 (`docs/audio/music-batch2-2026-10-12.json`, pinned by
 * `audio-music-batch2-2026-10-12.test.ts`), so those tests read the sets and the byte movement from here instead of each re-deriving them.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const REPO = join(__dirname, '..', '..', '..');

export interface Batch2Cue {
  cue: string;
  pick: string;
  game: 'FFX' | 'FFX-2';
  kind: 'loop' | 'victoryloop' | 'oneshot';
  mode: 'replace' | 'new';
  brief: string;
  plays: string;
  fallback: string;
  request: { model_id: string; prompt: string; music_length_ms: number; force_instrumental: boolean };
  raw: { sha256: string; bytes: number };
  file: { bytes: number; sha256: string };
  manifestEntry: { file: string; loopStart: number; loopEnd: number; duration: number; bytes: number; lufs: number; truePeakDb: number; source: string; oneShot?: boolean };
  before: { bytes: number; sha256: string; manifestEntry: { file: string; bytes: number; loopStart: number; loopEnd: number; duration: number } } | null;
  master: Record<string, unknown>;
  stereo: { before: { corr: number; sideMid: number; monoLoss: number }; after: { corr: number; sideMid: number; monoLoss: number }; pass: boolean; passedAsRendered: boolean; action: 'narrowed' | 'widened' | 'left alone' };
}

export interface Batch2Record {
  source: string;
  retired: { cue: string; bytes: number; sha256: string; manifestEntry: { file: string; bytes: number }; why: string }[];
  totals: { musicBytesBefore: number; musicBytesAfter: number; replacedInPlace: number; newCues: number; retiredFiles: number };
  cues: Batch2Cue[];
}

export const batch2 = JSON.parse(readFileSync(join(REPO, 'docs/audio/music-batch2-2026-10-12.json'), 'utf8')) as Batch2Record;

/** Cues whose file and manifest entry batch 2 replaced in place. */
export const batch2Replaced: ReadonlySet<string> = new Set(batch2.cues.filter((c) => c.mode === 'replace').map((c) => c.cue));
/** Cues batch 2 added. */
export const batch2Added: ReadonlySet<string> = new Set(batch2.cues.filter((c) => c.mode === 'new').map((c) => c.cue));
/** Every cue the record lists. */
export const batch2Cues: ReadonlySet<string> = new Set(batch2.cues.map((c) => c.cue));
/** Cues batch 2 took out of the shipped set (their compositions stay as synth fallbacks). */
export const batch2Retired: ReadonlySet<string> = new Set(batch2.retired.map((r) => r.cue));
/** How far batch 2 moved the music total: new files, plus each replaced file's change, minus each retired file. */
export const batch2MusicMoved: number = batch2.totals.musicBytesAfter - batch2.totals.musicBytesBefore;

/**
 * The bytes of the two chapter-select alternates of release 39.5 (`chapter-select-a`, `-c`, LAME V4; Bailey, 2026-10-07), ported onto this line after batch 2 was measured:
 * they replace no file, so the manifest's music total is batch 2's `musicBytesAfter` plus these (`docs/audio/music-elevenlabs-2026-10-07.json` `alternates`, pinned by
 * `audio-chapter-select-alternates.test.ts`).
 */
export const alternates395Bytes: number = (
  (JSON.parse(readFileSync(join(REPO, 'docs/audio/music-elevenlabs-2026-10-07.json'), 'utf8')) as { alternates?: { after: { bytes: number } }[] }).alternates ?? []
).reduce((sum, a) => sum + a.after.bytes, 0);
