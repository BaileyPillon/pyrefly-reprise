/**
 * The stereo gate on the nine ElevenLabs cues of 2026-10-10 (driver item 53e, 2026-10-11; PR-0425 of deep review round 24).
 *
 * The THEMES.md gate has three measures over the decoded file: L/R correlation 0.60 to 0.85, side-to-mid -10 to -6 dB, mono-sum loss no worse than -1 dB. The review
 * measured `boss-bahamut` and `boss-leblanc` against it and both failed; measuring all nine showed eight failing and `boss-ff7-guard` passing as rendered.
 * Bailey, 2026-10-10 23:05 EDT: "i'll go with all your recommendations even as to music and sound effects. you recommend an dchoose it please. this is extremely
 * important." The driver chose to fix it by measurement: each failing file has its side channel scaled in mid/side (`tools/audio/stereo-narrow.mjs`), which moves
 * nothing in time, so the length and the loop points are the input's to the sample.
 *
 * `docs/audio/music-stereo-53e-2026-10-11.json` is the record. This pins that the shipped files are the ones recorded and that their recorded figures are inside the
 * gate, that the loop points and length did not move, that loudness, true peak and the seam stayed inside their gates, that THEMES.md shows the shipped figures, and
 * (where ffmpeg is on the machine, since no MP3 decoder is a dependency) that the shipped bytes themselves measure what the record says. Nothing here is a listening
 * verdict (AGENTS.md rule 13).
 *
 * Game case: FFX-2 for boss-bahamut, boss-leblanc, boss-ffx2-fallen-aeons and boss-trema; FFX for boss-seymour-natus, boss-isaaru, boss-sin-assault and
 * boss-sin-countdown; FF7 for boss-ff7-guard.
 */

import { createHash } from 'node:crypto';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { AUDIO_BUDGET_BYTES } from '../../tools/audio/manifest-io.mjs';
import { batch2MusicMoved } from './helpers/musicBatch2.ts';
import { FFMPEG, STEREO_GATE, judgeStereo, measureFile, measureStereo } from '../../tools/audio/stereo-gate.mjs';

const REPO = fileURLToPath(new URL('../../', import.meta.url));
const text = (p: string) => readFileSync(join(REPO, p), 'utf8');
const read = (p: string) => JSON.parse(text(p));
const RATE = 44100;

interface Entry {
  file: string;
  loopStart: number;
  loopEnd: number;
  duration: number;
  bytes: number;
  lufs: number;
  truePeakDb: number;
  source?: string;
}
interface Stereo {
  corr: number;
  sideMid: number;
  monoLoss: number;
}
interface Block {
  bytes: number;
  sha256: string;
  decodedSamples: number;
  manifestEntry: Entry;
  stereo: Stereo;
  stereoGate: { corr: boolean; sideMid: boolean; monoLoss: boolean };
  ebur128: { lufs: number; truePeakDb: number };
  qa: { lufs: number; truePeakDb: number; seamStepOverAllowed: number; seamFluxRatio: number; clickRatio: number; failures: string[] };
}
interface Row {
  cue: string;
  game: string;
  record: string;
  changed: boolean;
  before: Block;
  after: Block;
  method?: { sideGainLinear: number; masterGainDb: number; targetSideMidDb: number; limiter: { ceilingDbfs: number; over: number; reductionDb: number } | null };
}
const record = read('docs/audio/music-stereo-53e-2026-10-11.json') as {
  gameCase: string;
  gate: { thresholds: { corr: [number, number]; sideMid: [number, number]; monoLossMin: number } };
  cues: Row[];
  totals: { musicBytesAfter: number; shippedAudioBytesAfter: number; shippedAudioBytesBefore: number; budgetBytes: number; qaFindings: number; changedCues: number };
};
const manifest = read('public/audio/manifest.json') as { music: Record<string, Entry>; sfx: { bytes: number } | null; sfxV2: { bytes: number } | null };

const NINE: Record<string, string> = {
  'boss-bahamut': 'FFX-2',
  'boss-leblanc': 'FFX-2',
  'boss-ffx2-fallen-aeons': 'FFX-2',
  'boss-trema': 'FFX-2',
  'boss-seymour-natus': 'FFX',
  'boss-isaaru': 'FFX',
  'boss-sin-assault': 'FFX',
  'boss-sin-countdown': 'FFX',
  'boss-ff7-guard': 'FF7',
};
/** The one cue that passed as rendered and is not touched. */
const UNCHANGED = 'boss-ff7-guard';

const sha256 = (cue: string) => createHash('sha256').update(readFileSync(join(REPO, 'public', 'audio', 'music', `${cue}.mp3`))).digest('hex');
const inRange = (x: number, [low, high]: [number, number]) => x >= low && x <= high;
const passes = (s: Stereo) => inRange(s.corr, STEREO_GATE.corr as [number, number]) && inRange(s.sideMid, STEREO_GATE.sideMid as [number, number]) && s.monoLoss >= STEREO_GATE.monoLossMin;

describe('the stereo gate (driver item 53e): the measure and the record', () => {
  it('uses the thresholds the remaster tool and the record use', () => {
    const source = text('tools/audio/remaster-score.mjs');
    const found = /corr: \[([\d.]+), ([\d.]+)\],\s*sideMid: \[(-?\d+), (-?\d+)\],\s*monoLossMin: (-?[\d.]+)/.exec(source);
    expect(found, 'GATES in remaster-score.mjs changed shape').not.toBeNull();
    const [, c0, c1, s0, s1, mono] = found!;
    const gate = { corr: [Number(c0), Number(c1)], sideMid: [Number(s0), Number(s1)], monoLossMin: Number(mono) };
    expect(STEREO_GATE).toEqual(gate);
    expect(record.gate.thresholds).toEqual(gate);
  });

  it('measures what the closed form says: the side/mid power ratio r alone sets correlation (1-r)/(1+r) and mono-sum loss -10 log10(1+r)', () => {
    // A mid tone and a side tone at the powers of the target, -7.5 dB: correlation 0.70, loss -0.70 dB.
    const n = 44100 * 2;
    const left = new Float32Array(n);
    const right = new Float32Array(n);
    const r = 10 ** (-7.5 / 10);
    for (let i = 0; i < n; i++) {
      const m = Math.sin((2 * Math.PI * 220 * i) / RATE);
      const s = Math.sqrt(r) * Math.sin((2 * Math.PI * 1234.5 * i) / RATE);
      left[i] = m + s;
      right[i] = m - s;
    }
    const got = measureStereo(left, right);
    expect(got.sideMid).toBeCloseTo(-7.5, 2);
    expect(got.corr).toBeCloseTo((1 - r) / (1 + r), 3);
    expect(got.monoLoss).toBeCloseTo(-10 * Math.log10(1 + r), 2);
    expect(judgeStereo(got).pass).toBe(true);
    // Mono passes none of the side windows; uncorrelated channels fail all three.
    const mono = measureStereo(left.map((_, i) => Math.sin((2 * Math.PI * 220 * i) / RATE)), left.map((_, i) => Math.sin((2 * Math.PI * 220 * i) / RATE)));
    expect(mono.corr).toBeCloseTo(1, 6);
    expect(judgeStereo(mono).ok.corr).toBe(false);
  });

  it('lists the nine cues once each, in order, with the game each plays in, and says only boss-ff7-guard was left alone', () => {
    expect(record.cues.map((c) => c.cue)).toEqual(Object.keys(NINE));
    for (const c of record.cues) expect(c.game, c.cue).toBe(NINE[c.cue]);
    expect(record.cues.filter((c) => !c.changed).map((c) => c.cue)).toEqual([UNCHANGED]);
    expect(record.totals.changedCues).toBe(8);
    for (const game of ['FFX-2', 'FFX', 'FF7']) expect(record.gameCase).toContain(`${game}:`);
  });

  it('shows the finding: the review\'s two cues measured 0.408 / -3.72 / -1.54 and 0.257 / -2.28 / -2.02, and every changed cue failed the gate before', () => {
    const by = (cue: string) => record.cues.find((c) => c.cue === cue)!;
    expect(by('boss-bahamut').before.stereo).toEqual({ corr: 0.408, sideMid: -3.72, monoLoss: -1.54 });
    expect(by('boss-leblanc').before.stereo).toEqual({ corr: 0.257, sideMid: -2.28, monoLoss: -2.02 });
    for (const c of record.cues.filter((x) => x.changed)) expect(passes(c.before.stereo), `${c.cue} failed before`).toBe(false);
    expect(passes(by(UNCHANGED).before.stereo)).toBe(true);
    expect(by(UNCHANGED).before.sha256).toBe(by(UNCHANGED).after.sha256);
  });

  it('records every shipped file inside all three windows, with margin, and each flag true', () => {
    for (const c of record.cues) {
      const s = c.after.stereo;
      expect(passes(s), `${c.cue}: ${JSON.stringify(s)}`).toBe(true);
      expect(c.after.stereoGate, c.cue).toEqual({ corr: true, sideMid: true, monoLoss: true });
      if (c.changed) {
        // Aimed at side-to-mid -7.5 dB (correlation 0.70, loss -0.70): the middle of the windows, not their edge.
        expect(Math.abs(s.sideMid + 7.5), `${c.cue} side-to-mid`).toBeLessThanOrEqual(0.15);
        expect(Math.abs(s.corr - 0.7), `${c.cue} correlation`).toBeLessThanOrEqual(0.01);
        expect(s.monoLoss, `${c.cue} mono-sum loss`).toBeGreaterThanOrEqual(-0.75);
        expect(c.method!.targetSideMidDb).toBe(-7.5);
        expect(c.method!.sideGainLinear, `${c.cue} narrows, never widens`).toBeLessThan(1);
      }
    }
  });
});

describe('the stereo gate (driver item 53e): the shipped files', () => {
  it('ships the recorded files byte for byte, with the recorded manifest entries', () => {
    for (const c of record.cues) {
      const entry = manifest.music[c.cue]!;
      expect(entry, `${c.cue} is in the manifest`).toBeDefined();
      expect(entry.file).toBe(`music/${c.cue}.mp3`);
      expect(statSync(join(REPO, 'public', 'audio', entry.file)).size, c.cue).toBe(c.after.bytes);
      expect(sha256(c.cue), c.cue).toBe(c.after.sha256);
      expect(entry, c.cue).toEqual(c.after.manifestEntry);
      expect(entry.bytes).toBe(c.after.bytes);
    }
  });

  it('leaves the loop points, the length and the 3 s run-on exactly where they were', () => {
    for (const c of record.cues) {
      const { loopStart, loopEnd, duration, source, file } = c.after.manifestEntry;
      expect({ loopStart, loopEnd, duration, source, file }, `${c.cue}: the manifest entry moved`).toEqual({
        loopStart: c.before.manifestEntry.loopStart,
        loopEnd: c.before.manifestEntry.loopEnd,
        duration: c.before.manifestEntry.duration,
        source: c.before.manifestEntry.source,
        file: c.before.manifestEntry.file,
      });
      expect(c.after.decodedSamples, `${c.cue}: decoded length`).toBe(c.before.decodedSamples);
      for (const seconds of [loopStart, loopEnd]) expect(Math.abs(seconds * RATE - Math.round(seconds * RATE)), c.cue).toBeLessThan(0.5);
      expect(Math.abs(duration - (loopEnd + 3)), `${c.cue}: run-on`).toBeLessThan(0.001);
      expect(Math.abs(c.after.decodedSamples / RATE - duration), `${c.cue}: duration against the decode`).toBeLessThan(0.0001);
    }
  });

  it('keeps loudness at -16 LUFS, true peak under -1 dBTP and the loop seam inside its gates', () => {
    for (const c of record.cues) {
      const a = c.after;
      expect(Math.abs(a.ebur128.lufs + 16), `${c.cue} LUFS (ffmpeg ebur128, the manifest's reading)`).toBeLessThanOrEqual(0.05);
      expect(Math.abs(a.qa.lufs + 16), `${c.cue} LUFS (qa.mjs)`).toBeLessThan(0.5);
      expect(Math.abs(a.manifestEntry.lufs - a.ebur128.lufs), c.cue).toBeLessThan(0.05);
      expect(a.ebur128.truePeakDb, `${c.cue} true peak (ffmpeg)`).toBeLessThanOrEqual(-1);
      expect(a.qa.truePeakDb, `${c.cue} true peak (qa.mjs)`).toBeLessThanOrEqual(-1);
      expect(a.qa.clickRatio, `${c.cue} click ratio`).toBeLessThan(1);
      expect(a.qa.seamStepOverAllowed, `${c.cue} wrap step over what qa.mjs allows`).toBeLessThan(1);
      expect(a.qa.seamFluxRatio, `${c.cue} spectral flux across the seam`).toBeLessThan(1.05);
      expect(a.qa.failures, c.cue).toEqual([]);
    }
  });

  it('limits only where the master gain pushed a peak over the ceiling: boss-sin-countdown, 13 samples, under a dB', () => {
    const limited = record.cues.filter((c) => c.method?.limiter);
    expect(limited.map((c) => c.cue)).toEqual(['boss-sin-countdown']);
    const l = limited[0]!.method!.limiter!;
    expect(l.over).toBeLessThan(100);
    expect(l.reductionDb).toBeLessThan(1);
  });

  it('is described by THEMES.md with the figures of the shipped files', () => {
    const themes = text('docs/audio/THEMES.md').split(/\r?\n/);
    for (const c of record.cues) {
      const row = themes.find((l) => l.startsWith(`| \`${c.cue}\` | `));
      expect(row, `THEMES.md has no row for ${c.cue}`).toBeDefined();
      const cells = row!.split('|').map((s) => s.trim());
      // ['', cue, game, shipsAs, corr, side, mono, '']
      expect(cells[2], c.cue).toBe(c.game);
      expect([Number(cells[4]), Number(cells[5]), Number(cells[6])], `${c.cue}: THEMES.md columns`).toEqual([
        Number(c.after.stereo.corr.toFixed(3)),
        Number(c.after.stereo.sideMid.toFixed(2)),
        Number(c.after.stereo.monoLoss.toFixed(2)),
      ]);
      expect(cells[3], `${c.cue}: the row says what the gate found`).toMatch(/stereo gate/);
      if (c.changed) expect(cells[3], c.cue).toMatch(/narrowed in mid\/side/);
    }
  });

  it('is inside the 105 MB shipping budget, with the totals as the record has them', () => {
    const music = Object.values(manifest.music).reduce((sum, e) => sum + e.bytes, 0);
    const shipped = music + (manifest.sfx?.bytes ?? 0) + (manifest.sfxV2?.bytes ?? 0);
    expect(AUDIO_BUDGET_BYTES).toBe(105e6);
    expect(record.totals.budgetBytes).toBe(AUDIO_BUDGET_BYTES);
    // The record's totals are the ones of 2026-10-11; music batch 2 (2026-10-12) moved the music total by `batch2MusicMoved` since (pinned by audio-music-batch2-2026-10-12.test.ts).
    expect(record.totals.musicBytesAfter + batch2MusicMoved).toBe(music);
    expect(record.totals.shippedAudioBytesAfter + batch2MusicMoved).toBe(shipped);
    expect(shipped).toBeLessThan(AUDIO_BUDGET_BYTES);
    expect(record.totals.shippedAudioBytesAfter).toBeLessThan(record.totals.shippedAudioBytesBefore);
    expect(record.totals.qaFindings).toBe(0);
  });
});

// No MP3 decoder is a dependency, so the live check needs ffmpeg (the same decoder qa.mjs uses); without it the record's sha256 above is what binds the figures to the files.
describe.skipIf(!existsSync(FFMPEG))('the stereo gate (driver item 53e): the shipped bytes, decoded', () => {
  it('measures every shipped cue inside the gate, at the figures the record holds', { timeout: 180_000 }, () => {
    for (const c of record.cues) {
      const m = measureFile(join(REPO, 'public', 'audio', 'music', `${c.cue}.mp3`));
      expect(m.pass, `${c.cue}: ${m.corr.toFixed(3)}, ${m.sideMid.toFixed(2)} dB, ${m.monoLoss.toFixed(2)} dB`).toBe(true);
      expect(Math.abs(m.corr - c.after.stereo.corr), `${c.cue} correlation`).toBeLessThanOrEqual(0.0006);
      expect(Math.abs(m.sideMid - c.after.stereo.sideMid), `${c.cue} side-to-mid`).toBeLessThanOrEqual(0.006);
      expect(Math.abs(m.monoLoss - c.after.stereo.monoLoss), `${c.cue} mono-sum loss`).toBeLessThanOrEqual(0.006);
      expect(m.samples, `${c.cue} decoded length`).toBe(c.after.decodedSamples);
    }
  });
});
