/**
 * Music O1 (D-292, 2026-09-30): the whole score ships at LAME V0.
 *
 * Bailey, 2026-09-29: "yes, all your recommendations". `docs/audio/music-o1-2026-09-30.json` is the
 * measurement record (tools/audio/music-o1-measure.py); this pins that the shipped manifest and files still
 * agree with it, that a cue has not slipped back to the q5 encode (about 125 kbps, a brick-wall lowpass at
 * 16.6 kHz), and that the budget was raised to fit rather than the cues shrunk to fit the old one.
 * Music v2 (2026-09-30) replaced 23 of the 26 files with new renders at the same V0 setting; their bytes are pinned
 * by `audio-music-v2.test.ts` and `docs/audio/music-v2-2026-09-30.json`, so this record now pins the other three.
 * The ElevenLabs install (2026-10-07, `docs/audio/music-elevenlabs-2026-10-07.json`) replaced some of those files
 * again; a cue that record lists is pinned by it (`audio-music-elevenlabs.test.ts`), and the music total here is
 * music v2's plus the bytes that record measured as moved.
 * Nothing here is a listening verdict (AGENTS.md rule 13). Game case: both.
 */

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { AUDIO_BUDGET_BYTES, externalSource } from '../../tools/audio/manifest-io.mjs';

const read = (p: string) => JSON.parse(readFileSync(new URL(`../../${p}`, import.meta.url), 'utf8'));
const manifest = read('public/audio/manifest.json') as {
  music: Record<string, { bytes: number; duration: number; source?: string }>;
};
const report = read('docs/audio/music-o1-2026-09-30.json') as {
  totals: { musicBytesAfter: number };
  gates: { qaStrictFindings: number };
  cues: {
    cue: string;
    q5ReproducesShipped: boolean;
    before: { bytes: number; lowpassCliff: { db: number } };
    after: { bytes: number; lowpassCliff: { db: number }; qa: { failures: string[]; truePeakDb: number } };
  }[];
};

const v2 = read('docs/audio/music-v2-2026-09-30.json') as { totals: { musicBytesAfter: number }; cues: { cue: string }[] };
const replacedByV2 = new Set(v2.cues.map((c) => c.cue));
const later = read('docs/audio/music-elevenlabs-2026-10-07.json') as {
  cues: { cue: string; before: { bytes: number }; after: { bytes: number } }[];
  /** Release 39.5: cues ADDED beside the 26 (the two selectable chapter-select alternates, at LAME V4: they replace no file). */
  alternates?: { cue: string; after: { bytes: number } }[];
};
const replacedLater = new Set(later.cues.map((c) => c.cue));
const addedLater = new Set((later.alternates ?? []).map((c) => c.cue));
const movedLater =
  later.cues.reduce((sum, c) => sum + c.after.bytes - c.before.bytes, 0) + (later.alternates ?? []).reduce((sum, c) => sum + c.after.bytes, 0);

describe('music O1: every cue at LAME V0', () => {
  it('records every shipped cue, each reproduced byte for byte before the re-encode', () => {
    // (the 39.5 alternates are cues this record never saw: they were never at q5, and have their own record and test)
    expect(report.cues.map((c) => c.cue).sort()).toEqual(Object.keys(manifest.music).filter((k) => !addedLater.has(k)).sort());
    for (const c of report.cues) expect(c.q5ReproducesShipped, `${c.cue} twin`).toBe(true);
  });

  it('ships the files the record measured, except the ones music v2 and the ElevenLabs install replaced (each pinned by its own record)', () => {
    for (const c of report.cues) {
      if (!replacedByV2.has(c.cue) && !replacedLater.has(c.cue)) expect(manifest.music[c.cue]?.bytes, `${c.cue} bytes`).toBe(c.after.bytes);
    }
    const total = Object.values(manifest.music).reduce((a, m) => a + m.bytes, 0);
    expect(total).toBe(v2.totals.musicBytesAfter + movedLater);
  });

  it('has not slipped back to q5: at least 200 kbps average, no encoder wall', () => {
    for (const [cue, m] of Object.entries(manifest.music)) {
      // The two 39.5 alternates are the one exception: LAME V4 so that both fit the unchanged 90 MB cap (their record's
      // `master.why`; `audio-chapter-select-alternates.test.ts` holds them to a 128 kbps floor, the rate their takes came in at).
      if (addedLater.has(cue)) continue;
      expect((m.bytes * 8) / m.duration, `${cue} average bitrate`).toBeGreaterThan(200_000);
    }
    for (const c of report.cues) {
      expect(c.before.lowpassCliff.db, `${c.cue} had the q5 wall`).toBeGreaterThan(20);
      // The one exemption, and it is keyed by the manifest, not by cue name: an entry that carries `source` is a take
      // made elsewhere (the ElevenLabs takes of 2026-10-07), band-limited near 16.6 to 17.1 kHz by its 128 kbps
      // source, a wall of 27 to 44 dB that our V0 encode keeps. That bandwidth is part of what Bailey picked by ear
      // (docs/audio/THEMES.md says so), and its measured value is recorded as measured in
      // docs/audio/music-elevenlabs-2026-10-07.json (`after.measure.cliff`). The 15 dB cap here was for the file
      // this record measured; every other check on such a cue (the bitrate floor above, the qa gates) still runs.
      if (externalSource(manifest.music[c.cue]) !== null) continue;
      expect(c.after.lowpassCliff.db, `${c.cue} still has a wall`).toBeLessThan(15);
    }
  });

  it('passed every qa.mjs gate after the re-encode', () => {
    expect(report.gates.qaStrictFindings).toBe(0);
    for (const c of report.cues) {
      expect(c.after.qa.failures, c.cue).toEqual([]);
      expect(c.after.qa.truePeakDb, `${c.cue} true peak`).toBeLessThanOrEqual(-1);
    }
  });

  it('fits the raised shipping budget: 85 MB under D-292, 90 MB since D-306, not the old 60', () => {
    expect(AUDIO_BUDGET_BYTES).toBe(90e6);
  });
});
