/**
 * Music O1 (D-292, 2026-09-30): the whole score ships at LAME V0.
 *
 * Bailey, 2026-09-29: "yes, all your recommendations". `docs/audio/music-o1-2026-09-30.json` is the
 * measurement record (tools/audio/music-o1-measure.py); this pins that the shipped manifest and files still
 * agree with it, that a cue has not slipped back to the q5 encode (about 125 kbps, a brick-wall lowpass at
 * 16.6 kHz), and that the budget was raised to fit rather than the cues shrunk to fit the old one.
 * Music v2 (2026-09-30) replaced 23 of the 26 files with new renders at the same V0 setting; their bytes are pinned
 * by `audio-music-v2.test.ts` and `docs/audio/music-v2-2026-09-30.json`, so this record now pins the other three.
 * Nothing here is a listening verdict (AGENTS.md rule 13). Game case: both.
 */

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { AUDIO_BUDGET_BYTES } from '../../tools/audio/manifest-io.mjs';

const read = (p: string) => JSON.parse(readFileSync(new URL(`../../${p}`, import.meta.url), 'utf8'));
const manifest = read('public/audio/manifest.json') as {
  music: Record<string, { bytes: number; duration: number }>;
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

describe('music O1: every cue at LAME V0', () => {
  it('records every shipped cue, each reproduced byte for byte before the re-encode', () => {
    expect(report.cues.map((c) => c.cue).sort()).toEqual(Object.keys(manifest.music).sort());
    for (const c of report.cues) expect(c.q5ReproducesShipped, `${c.cue} twin`).toBe(true);
  });

  it('ships the files the record measured, except the ones music v2 replaced (pinned by its own record)', () => {
    for (const c of report.cues) {
      if (!replacedByV2.has(c.cue)) expect(manifest.music[c.cue]?.bytes, `${c.cue} bytes`).toBe(c.after.bytes);
    }
    const total = Object.values(manifest.music).reduce((a, m) => a + m.bytes, 0);
    expect(total).toBe(v2.totals.musicBytesAfter);
  });

  it('has not slipped back to q5: at least 200 kbps average, no encoder wall', () => {
    for (const [cue, m] of Object.entries(manifest.music)) {
      expect((m.bytes * 8) / m.duration, `${cue} average bitrate`).toBeGreaterThan(200_000);
    }
    for (const c of report.cues) {
      expect(c.before.lowpassCliff.db, `${c.cue} had the q5 wall`).toBeGreaterThan(20);
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
