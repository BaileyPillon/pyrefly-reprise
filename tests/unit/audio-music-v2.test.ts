/**
 * Music v2 (2026-09-30): the FFX cues ship route S, the FFX-2 cues route N2 (or its route S fallback).
 *
 * Bailey, 2026-09-30: "I'll go with all your recommendations". `docs/audio/music-v2-2026-09-30.json` is the
 * measurement record (the install, qa.mjs, quality-measure.py); `docs/audio/music-v2-2026-09-30-browser.json` is
 * the headless proof on a production build (tools/audio/music-v2-browser-proof.mjs). This pins that the shipped
 * files are the ones measured, that each game got its own route (rule 14), that loop points did not move, and
 * that the proof passed. Nothing here is a listening verdict (AGENTS.md rule 13). Game case: FFX cues FFX only,
 * FFX-2 cues FFX-2 only; the plumbing is both.
 *
 * A cue that `docs/audio/music-elevenlabs-2026-10-07.json` lists has a newer file than this record measured: its bytes,
 * hash, loop points and headless proof belong to that record (pinned by `audio-music-elevenlabs.test.ts`, which also
 * checks that its `before` is the file this record pinned), so those checks step over it here, and the music total is
 * this record's plus the bytes that record measured as moved.
 */

import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { AUDIO_BUDGET_BYTES } from '../../tools/audio/manifest-io.mjs';

const read = (p: string) => JSON.parse(readFileSync(new URL(`../../${p}`, import.meta.url), 'utf8'));
const manifest = read('public/audio/manifest.json') as {
  music: Record<string, { file: string; bytes: number; duration: number; loopStart: number; loopEnd: number }>;
};
interface Cue {
  cue: string;
  game: string;
  route: string;
  loop: { loopStart: number; loopEnd: number; duration: number };
  after: { bytes: number; sha256: string; qa: { lufs: number; truePeakDb: number; seamOk: boolean; failures: string[] } };
  themesStereoGate: Record<string, boolean>;
}
const record = read('docs/audio/music-v2-2026-09-30.json') as {
  unchanged: string[];
  totals: { musicBytesAfter: number; shippedAudioBytesAfter: number };
  gates: { qaStrictFindings: number };
  cues: Cue[];
};
const later = read('docs/audio/music-elevenlabs-2026-10-07.json') as {
  cues: { cue: string; before: { bytes: number }; after: { bytes: number } }[];
};
/** Cues a later record replaced, and the bytes it moved the music total by. */
const replacedLater = new Set(later.cues.map((c) => c.cue));
const movedLater = later.cues.reduce((sum, c) => sum + c.after.bytes - c.before.bytes, 0);
const proof = read('docs/audio/music-v2-2026-09-30-browser.json') as {
  cues: Record<string, { status: number; frameDiff: number; click: { wrapErrorOverP99: number }; level: { loopAddedJumpDb: number } }>;
  live: { label: string; ok: boolean }[];
  chapters: { id: string; game: string; outcome: string; ok: Record<string, boolean> }[];
  summary: { resultsNotReachedByAutoStrategy: string[] };
  console: string[];
  pageErrors: string[];
  failedRequests: string[];
};

/** The "How each cue ships" table in THEMES.md: cue -> game. */
const themesGame = new Map(
  [...readFileSync(new URL('../../docs/audio/THEMES.md', import.meta.url), 'utf8').matchAll(/^\| `([a-z0-9-]+)` \| (FFX-2|FFX|both) \| /gm)].map(
    (m) => [m[1], m[2]] as const,
  ),
);

describe('music v2: route S for FFX, N2 for FFX-2', () => {
  it('replaces every FFX and FFX-2 cue and leaves the shared cues alone', () => {
    expect(record.cues.map((c) => c.cue).sort()).toEqual(
      Object.keys(manifest.music).filter((k) => !record.unchanged.includes(k)).sort(),
    );
    expect(record.unchanged.sort()).toEqual(['chapter-select', 'pause', 'title']);
    for (const k of record.unchanged) expect(themesGame.get(k), k).toBe('both');
  });

  it('gives each game its own route (rule 14)', () => {
    for (const c of record.cues) {
      expect(themesGame.get(c.cue), `${c.cue} game in THEMES.md`).toBe(c.game);
      if (c.game === 'FFX') expect(c.route, c.cue).toBe('S');
      else expect(['N2', 'S (N2 fallback)'], c.cue).toContain(c.route);
    }
    expect(record.cues.filter((c) => c.route === 'N2').length).toBe(5);
  });

  it('ships the files the record measured, byte for byte (except the cues a later record replaced)', () => {
    for (const c of record.cues) {
      if (replacedLater.has(c.cue)) continue;
      const m = manifest.music[c.cue]!;
      const bytes = readFileSync(new URL(`../../public/audio/${m.file}`, import.meta.url));
      expect(bytes.length, `${c.cue} bytes`).toBe(c.after.bytes);
      expect(m.bytes, `${c.cue} manifest bytes`).toBe(c.after.bytes);
      expect(createHash('sha256').update(bytes).digest('hex'), `${c.cue} sha256`).toBe(c.after.sha256);
    }
    const total = Object.values(manifest.music).reduce((a, m) => a + m.bytes, 0);
    expect(total).toBe(record.totals.musicBytesAfter + movedLater);
  });

  it('kept every loop point and duration (except the cues a later record replaced)', () => {
    for (const c of record.cues) {
      if (replacedLater.has(c.cue)) continue;
      const m = manifest.music[c.cue]!;
      expect([m.loopStart, m.loopEnd, m.duration], c.cue).toEqual([c.loop.loopStart, c.loop.loopEnd, c.loop.duration]);
    }
  });

  it('passed qa.mjs --strict, the loudness and true-peak targets and the stereo gate, inside the budget', () => {
    expect(record.gates.qaStrictFindings).toBe(0);
    for (const c of record.cues) {
      expect(c.after.qa.failures, c.cue).toEqual([]);
      expect(c.after.qa.seamOk, c.cue).toBe(true);
      expect(Math.abs(c.after.qa.lufs + 16), `${c.cue} LUFS`).toBeLessThan(0.5);
      expect(c.after.qa.truePeakDb, `${c.cue} true peak`).toBeLessThanOrEqual(-1);
      expect(Object.values(c.themesStereoGate).every(Boolean), `${c.cue} stereo gate`).toBe(true);
    }
    expect(record.totals.shippedAudioBytesAfter).toBeLessThanOrEqual(AUDIO_BUDGET_BYTES);
  });

  it('passed the headless proof on a production build (for the files it played: not the cues a later record replaced)', () => {
    for (const k of Object.keys(manifest.music)) {
      if (replacedLater.has(k)) continue; // the proof played the file this record measured; the release proves the new one
      const c = proof.cues[k]!;
      expect(c.status, k).toBe(200);
      expect(Math.abs(c.frameDiff), `${k} decoded length`).toBeLessThanOrEqual(2); // the manifest's 4 decimals
      expect(c.click.wrapErrorOverP99, `${k} click at the wrap`).toBeLessThan(1);
      expect(Math.abs(c.level.loopAddedJumpDb), `${k} level jump at the wrap`).toBeLessThan(1);
    }
    expect(proof.live.every((r) => r.ok)).toBe(true);
    expect(new Set(proof.chapters.map((c) => c.game))).toEqual(new Set(['FFX', 'FFX-2']));
    // The intended strategy loses these two at every seed tried (1-16), so no victory cue can play there; the
    // proof record says so (`supplement`). Every other chapter reached its results cue.
    const lost = new Set(proof.summary.resultsNotReachedByAutoStrategy);
    expect([...lost].sort()).toEqual(['ffx2-trema', 'sin-fins-core']);
    for (const c of proof.chapters) {
      expect(c.ok, c.id).toEqual({ scene: true, battle: true, results: !lost.has(c.id) });
      if (lost.has(c.id)) expect(c.outcome, c.id).not.toBe('victory');
    }
    expect(proof.chapters.length).toBe(18);
    expect([...proof.console, ...proof.pageErrors, ...proof.failedRequests]).toEqual([]);
  });
});
