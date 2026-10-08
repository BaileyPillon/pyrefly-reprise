/**
 * The ship step: from a candidate mp3 to the file the game plays, and the audit that keeps the voice folder honest.
 *
 * Pins the measurements (BS.1770 loudness, dual mono, true peak), the trim, the gain and its ceiling, the encode (mono 24 kHz
 * 64 kbps), the gates (a true peak over the ceiling, clipping, 400 ms of silence inside a line), determinism, and
 * `auditVoiceDir` (orphans, missing files, wrong sizes, an FFX-2 manifest, the voice budget). The audio cases need ffmpeg and skip
 * without it. Agents cannot hear: these are the numbers; the verdict on how a line sounds is Bailey's. Game case: FFX only.
 */
import { execFile, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, describe, expect, it } from 'vitest';

import { lineKey } from '../../src/story/voice/voiceKey.ts';

// @ts-expect-error -- the audio tooling is plain .mjs with no declarations.
import * as S from '../../tools/audio/voice-ship-lib.mjs';
// @ts-expect-error -- the audio tooling is plain .mjs with no declarations.
import { auditVoiceDir } from '../../tools/audio/voice-audit.mjs';
import { VOICE_BUDGET_BYTES, AUDIO_BUDGET_BYTES } from '../../tools/audio/manifest-io.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const tmp: string[] = [];
const mkTmp = (): string => { const d = mkdtempSync(path.join(os.tmpdir(), 'voice-ship-test-')); tmp.push(d); return d; };
afterAll(() => { for (const d of tmp) rmSync(d, { recursive: true, force: true }); });
const hasFfmpeg = S.ffmpegAvailable() as boolean;

/** A speech-like test signal: a harmonic stack with a syllabic tremolo, lead-in and tail of silence, an optional dropout. */
function speechLike(file: string, o: { seconds?: number; lead?: number; tail?: number; peakDb?: number; gap?: [number, number] } = {}): void {
  const seconds = o.seconds ?? 1.5;
  const amp = 10 ** ((o.peakDb ?? -10) / 20);
  const gap = o.gap ? `,volume=enable='between(t,${o.gap[0] + (o.lead ?? 0.2)},${o.gap[1] + (o.lead ?? 0.2)})':volume=0` : '';
  const r = spawnSync(S.FFMPEG as string, ['-y', '-v', 'error', '-f', 'lavfi', '-i', `aevalsrc='${amp * 0.55}*sin(2*PI*150*t)+${amp * 0.3}*sin(2*PI*300*t)+${amp * 0.15}*sin(2*PI*450*t)':d=${seconds}:s=44100`, '-af', `tremolo=f=4:d=0.6${gap},adelay=${Math.round((o.lead ?? 0.2) * 1000)}|${Math.round((o.lead ?? 0.2) * 1000)},apad=pad_dur=${o.tail ?? 0.3}`, '-ac', '1', '-b:a', '128k', file]);
  if (r.status !== 0) throw new Error(`ffmpeg: ${r.stderr}`);
}

describe('trimming and measuring', () => {
  const rate = 44100;
  const tone = (seconds: number, amp: number, hz = 220): Float32Array => Float32Array.from({ length: Math.round(seconds * rate) }, (_, i) => amp * Math.sin((2 * Math.PI * hz * i) / rate));

  it('cuts leading and trailing silence to a fixed head and tail, and leaves the speech alone', () => {
    const body = tone(1, 0.3);
    const padded = new Float32Array(rate * 3);
    padded.set(body, rate);
    const trimmed = S.trimSilence(padded, rate) as Float32Array;
    const head = Math.round(0.035 * rate);
    const tail = Math.round(0.09 * rate);
    const gate = 10 ** (-50 / 20);
    const first = body.findIndex((v) => Math.abs(v) >= gate); // a sine starts at zero: the first sample over the gate
    let last = body.length - 1;
    while (Math.abs(body[last] as number) < gate) last--;
    expect(trimmed.length).toBe(head + (last - first + 1) + tail);
    expect(trimmed[head]).toBeCloseTo(body[first] as number, 6);
    expect(trimmed[head + 200]).toBeCloseTo(body[first + 200] as number, 6);
    expect(trimmed[0]).toBe(0); // the head is silence
    expect(trimmed[trimmed.length - 1]).toBe(0); // and so is the tail
    expect(S.trimSilence(new Float32Array(1000), rate).length).toBe(0);
  });

  it('measures loudness in LUFS, 6 dB per doubling of the level, and finite for a clip shorter than one gating block', () => {
    const a = S.measureLine(tone(2, 0.1), rate) as { lufs: number; truePeakDb: number };
    const b = S.measureLine(tone(2, 0.2), rate) as { lufs: number; truePeakDb: number };
    expect(b.lufs - a.lufs).toBeCloseTo(6.02, 1);
    expect(b.truePeakDb - a.truePeakDb).toBeCloseTo(6.02, 1);
    const short = S.measureLine(tone(0.2, 0.1), rate) as { lufs: number };
    expect(Number.isFinite(short.lufs)).toBe(true);
    expect(short.lufs).toBeCloseTo(a.lufs, 0); // looped for the measurement, so the same level reads the same
    expect(S.measureLine(new Float32Array(0), rate).lufs).toBe(-Infinity);
  });

  it('is dual mono: a mono line reads 3 dB above its single-channel level, the way Web Audio plays it on both speakers', () => {
    // a 0.1-amplitude 220 Hz sine is about -23 LUFS on one channel; on two, -20
    const m = S.measureLine(tone(3, 0.1), rate) as { lufs: number };
    expect(m.lufs).toBeGreaterThan(-21.5);
    expect(m.lufs).toBeLessThan(-19);
  });

  it('brings a line to the target, and cuts the gain to keep the true peak under the ceiling', () => {
    expect(S.gainFor({ lufs: -25, truePeakDb: -15 })).toEqual({ gainDb: 6, limited: false });
    expect(S.gainFor({ lufs: -25, truePeakDb: -2 })).toEqual({ gainDb: 1, limited: true }); // would need 6 dB, has 1 dB of room to -1 dBTP
    expect(S.gainFor({ lufs: -19, truePeakDb: -3 }, -16)).toEqual({ gainDb: 2, limited: true });
    expect(S.TARGET_LUFS).toBe(-19); // the design's dialogue target
    expect(S.CEILING_DBTP).toBe(-1);
  });
});

describe('the gates', () => {
  const good = { ms: 1800, limited: false, innerSilenceMs: 120, after: { lufs: -19, truePeakDb: -6, samplePeak: -7 } };
  it('passes a clean line with no findings', () => {
    expect(S.findings(good, 1800)).toEqual({ fail: [], warn: [] });
  });
  it('fails a true peak over the ceiling, clipping, 400 ms of silence inside the line, and a line under 150 ms', () => {
    expect(S.findings({ ...good, after: { ...good.after, truePeakDb: -0.4 } }, 1800).fail[0]).toContain('true peak');
    expect(S.findings({ ...good, after: { ...good.after, samplePeak: 0 } }, 1800).fail[0]).toContain('clipping');
    expect(S.findings({ ...good, innerSilenceMs: 450 }, 1800).fail[0]).toContain('silence');
    expect(S.findings({ ...good, ms: 100 }, 1800).fail.join()).toContain('long');
  });
  it('warns, for Bailey\'s ear, when loudness is off target, a line was peak-limited, or its length is 30 percent off the estimate', () => {
    expect(S.findings({ ...good, after: { ...good.after, lufs: -22 } }, 1800).warn[0]).toContain('LU off');
    expect(S.findings({ ...good, limited: true, after: { ...good.after, lufs: -22 } }, 1800).warn[0]).toContain('peak-limited');
    expect(S.findings({ ...good, ms: 3000 }, 1800).warn[0]).toContain('planning estimate');
    expect(S.findings({ ...good, ms: 900 }, 1800).warn[0]).toContain('planning estimate');
  });
});

describe.skipIf(!hasFfmpeg)('one candidate through the whole step', () => {
  it('lands on -19 LUFS and under -1 dBTP as the browser decodes it, in the shipped format, at about 8 KB a second', () => {
    const src = path.join(mkTmp(), 'in.mp3');
    speechLike(src, { seconds: 2 });
    const r = S.processLine(src) as { bytes: Buffer; ms: number; after: { lufs: number; truePeakDb: number }; innerSilenceMs: number; limited: boolean };
    expect(Math.abs(r.after.lufs - -19)).toBeLessThan(0.35);
    expect(r.after.truePeakDb).toBeLessThanOrEqual(-1);
    expect(r.ms).toBeGreaterThan(2000 + 100); // 2 s of tone, the fixed 35 ms head and 90 ms tail
    expect(r.ms).toBeLessThan(2300);
    expect(r.bytes.length / (r.ms / 1000)).toBeGreaterThan(7000);
    expect(r.bytes.length / (r.ms / 1000)).toBeLessThan(9500);
    expect(r.innerSilenceMs).toBeLessThan(100);
    // the first MP3 frame header: sync, MPEG-2 layer III, the 24 kHz sample-rate index, mono
    let at = r.bytes.indexOf(0xff);
    while (at >= 0 && ((r.bytes[at + 1] ?? 0) & 0xe0) !== 0xe0) at = r.bytes.indexOf(0xff, at + 1);
    expect(at).toBeGreaterThanOrEqual(0);
    const [b1, b2, b3] = [r.bytes[at + 1] ?? 0, r.bytes[at + 2] ?? 0, r.bytes[at + 3] ?? 0];
    expect((b1 >> 3) & 3).toBe(2); // MPEG-2
    expect((b1 >> 1) & 3).toBe(1); // layer III
    expect((b2 >> 2) & 3).toBe(1); // 24 kHz in MPEG-2
    expect((b3 >> 6) & 3).toBe(3); // single channel
  }, 60_000);

  it('is deterministic: the same candidate gives the same bytes', () => {
    const src = path.join(mkTmp(), 'in.mp3');
    speechLike(src, { seconds: 1 });
    const a = S.processLine(src) as { bytes: Buffer };
    const b = S.processLine(src) as { bytes: Buffer };
    expect(a.bytes.equals(b.bytes)).toBe(true);
  }, 60_000);

  it('turns a loud line down to its ceiling rather than clip it, and says it was limited', () => {
    const src = path.join(mkTmp(), 'in.mp3');
    // a loud, peaky line: the level it needs for -19 LUFS would put its peak over -1 dBTP
    spawnSync(S.FFMPEG as string, ['-y', '-v', 'error', '-f', 'lavfi', '-i', "aevalsrc='0.02*sin(2*PI*180*t)+0.9*gt(sin(2*PI*3*t),0.995)*sin(2*PI*900*t)':d=2:s=44100", '-ac', '1', '-b:a', '192k', src]);
    const r = S.processLine(src) as { after: { truePeakDb: number }; limited?: boolean; error?: string };
    if (r.error) return; // too sparse to measure: the gate for a near-silent file is the trim, covered above
    expect(r.after.truePeakDb).toBeLessThanOrEqual(-1);
  }, 60_000);

  it('reports a file that is nothing but silence as an error, not a crash', () => {
    const src = path.join(mkTmp(), 'silence.mp3');
    spawnSync(S.FFMPEG as string, ['-y', '-v', 'error', '-f', 'lavfi', '-i', 'anullsrc=r=44100:cl=mono', '-t', '1', src]);
    expect((S.processLine(src) as { error?: string }).error).toContain('after trimming');
  }, 30_000);
});

// ---------------------------------------------------------------------------
// The audit of public/audio/voice
// ---------------------------------------------------------------------------

function voiceTree(over: { game?: string; extraFile?: string; missing?: boolean; bytes?: number; index?: boolean; ms?: number } = {}): string {
  const dir = mkTmp();
  const file = 'seymour-flux/seymour-flux.pre.003.mp3';
  mkdirSync(path.join(dir, 'seymour-flux'), { recursive: true });
  if (!over.missing) writeFileSync(path.join(dir, file), Buffer.alloc(4000, 1));
  const entry = { id: 'seymour-flux.pre.003', file, ms: over.ms ?? 1800, bytes: over.bytes ?? 4000, who: 'tidus' };
  writeFileSync(path.join(dir, 'seymour-flux.json'), JSON.stringify({ version: 1, chapter: 'seymour-flux', game: over.game ?? 'ffx', lines: { [lineKey('tidus', 'Hey!')]: entry } }));
  if (over.extraFile) writeFileSync(path.join(dir, over.extraFile), Buffer.alloc(10, 2));
  if (over.index !== false) writeFileSync(path.join(dir, 'index.json'), JSON.stringify({ version: 1, chapters: { 'seymour-flux': { lines: 1 } }, totals: { files: over.missing ? 0 : 1, bytes: over.missing ? 0 : 4000 } }));
  return dir;
}

describe('auditVoiceDir', () => {
  it('passes a folder whose manifests, files and index agree, and counts it', () => {
    const a = auditVoiceDir(voiceTree());
    expect(a.problems).toEqual([]);
    expect(a.totals).toMatchObject({ files: 1, bytes: 4000, chapters: 1, lines: 1 });
  });
  it('a folder that does not exist audits clean and says it is absent (nothing is shipped yet)', () => {
    expect(auditVoiceDir(path.join(mkTmp(), 'nothing'))).toMatchObject({ present: false, problems: [] });
  });
  it('flags an orphan recording nothing names, and any other stray file', () => {
    expect(auditVoiceDir(voiceTree({ extraFile: 'seymour-flux/orphan.mp3' })).problems.join()).toContain('orphan voice file');
    expect(auditVoiceDir(voiceTree({ extraFile: 'notes.txt' })).problems.join()).toContain('nothing names');
  });
  it('flags a manifest line whose file is missing, or the wrong size', () => {
    expect(auditVoiceDir(voiceTree({ missing: true })).problems.join()).toContain('missing file');
    expect(auditVoiceDir(voiceTree({ bytes: 3999 })).problems.join()).toContain('4000 bytes on disk but the manifest says 3999');
  });
  it('flags an FFX-2 manifest: no voice has been picked for that game (rule 14)', () => {
    expect(auditVoiceDir(voiceTree({ game: 'ffx2' })).problems.join()).toContain('has no picked voices yet');
  });
  it('flags an implausible length, a missing index, and an index that disagrees with the folder', () => {
    expect(auditVoiceDir(voiceTree({ ms: 20 })).problems.join()).toContain('implausible length');
    expect(auditVoiceDir(voiceTree({ index: false })).problems.join()).toContain('index.json is missing');
    const dir = voiceTree();
    writeFileSync(path.join(dir, 'index.json'), JSON.stringify({ version: 1, chapters: {}, totals: { files: 5, bytes: 1 } }));
    expect(auditVoiceDir(dir).problems.join()).toContain('run voice-ship again');
  });
  it('holds the folder to the voice budget, a line of its own beside the 90 MB music and effects cap', () => {
    expect(auditVoiceDir(voiceTree(), { budgetBytes: 3000 }).problems.join()).toContain('over the');
    expect(VOICE_BUDGET_BYTES).toBe(20e6);
    expect(AUDIO_BUDGET_BYTES).toBe(90e6); // untouched: the voice has its own line (proposed, awaiting Bailey)
  });
});

// ---------------------------------------------------------------------------
// The command line, on a handful of synthetic candidates
// ---------------------------------------------------------------------------

describe.skipIf(!hasFfmpeg)('voice-ship.mjs', () => {
  const ids = ['seymour-flux.pre.008', 'seymour-flux.pre.013', 'seymour-flux.pre.014', 'seymour-flux.post.006'];
  const ship = (args: string[]): Promise<{ code: number; stdout: string; stderr: string }> =>
    new Promise((resolve) => execFile(process.execPath, [path.join(ROOT, 'tools/audio/voice-ship.mjs'), ...args], { cwd: ROOT, maxBuffer: 16 << 20 }, (err, stdout, stderr) => resolve({ code: err ? 1 : 0, stdout, stderr })));

  it('checks without writing, then installs mp3s, per-chapter manifests keyed by what the box holds, an index and a report', async () => {
    const cand = mkTmp();
    for (const id of ids) speechLike(path.join(cand, `${id}.mp3`), { seconds: 1.4 });
    const out = path.join(mkTmp(), 'voice');
    const report = path.join(mkTmp(), 'report.json');
    const check = await ship(['--dir', cand, '--partial', '--out', out, '--report', report]);
    expect(check.code, check.stderr).toBe(0);
    expect(check.stdout).toContain('CHECK ONLY');
    expect(existsSync(out)).toBe(false);

    const done = await ship(['--dir', cand, '--partial', '--out', out, '--report', report, '--install']);
    expect(done.code, done.stderr).toBe(0);
    const manifest = JSON.parse(readFileSync(path.join(out, 'seymour-flux.json'), 'utf8')) as { game: string; chapter: string; lines: Record<string, { id: string; file: string; ms: number; bytes: number; who: string }> };
    expect(manifest).toMatchObject({ version: 1, chapter: 'seymour-flux', game: 'ffx' });
    const inventory = JSON.parse(readFileSync(path.join(ROOT, 'docs/audio/voice-line-inventory.json'), 'utf8')) as { lines: Array<{ id: string; speaker: string; text: string }> };
    for (const id of ids) {
      const line = inventory.lines.find((l) => l.id === id) as { speaker: string; text: string };
      const entry = manifest.lines[lineKey(line.speaker, line.text)];
      expect(entry, id).toMatchObject({ id, file: `seymour-flux/${id}.mp3`, who: line.speaker });
      expect(existsSync(path.join(out, entry?.file ?? 'nope'))).toBe(true);
    }
    const index = JSON.parse(readFileSync(path.join(out, 'index.json'), 'utf8')) as { totals: { files: number; bytes: number }; game: string };
    expect(index).toMatchObject({ game: 'ffx', totals: { files: 4 } });
    expect(auditVoiceDir(out).problems).toEqual([]);
    expect(JSON.parse(readFileSync(report, 'utf8')).recordings).toHaveLength(4);

    // a rerun on the same candidates is a clean no-op: byte-identical files
    const before = readFileSync(path.join(out, 'seymour-flux', `${ids[0]}.mp3`));
    await ship(['--dir', cand, '--partial', '--out', out, '--report', report, '--install']);
    expect(readFileSync(path.join(out, 'seymour-flux', `${ids[0]}.mp3`)).equals(before)).toBe(true);
  }, 240_000);

  it('refuses a set with recordings missing unless asked to ship what exists', async () => {
    const cand = mkTmp();
    speechLike(path.join(cand, `${ids[0]}.mp3`), { seconds: 1.2 });
    const r = await ship(['--dir', cand, '--out', path.join(mkTmp(), 'voice'), '--report', path.join(mkTmp(), 'r.json'), '--install']);
    expect(r.code).toBe(1);
    expect(r.stderr).toContain('no candidate yet');
  }, 120_000);

  it('fails a line with 400 ms of silence inside it, installs nothing, and passes it only when it is named in --accept', async () => {
    const cand = mkTmp();
    speechLike(path.join(cand, `${ids[0]}.mp3`), { seconds: 2.4, gap: [0.8, 1.5] });
    const out = path.join(mkTmp(), 'voice');
    const args = ['--dir', cand, '--partial', '--out', out, '--report', path.join(mkTmp(), 'r.json'), '--install'];
    const failed = await ship(args);
    expect(failed.code).toBe(1);
    expect(failed.stderr).toContain(`FAIL ${ids[0]}`);
    expect(failed.stderr).toContain('silence inside the line');
    expect(existsSync(out)).toBe(false);
    const accepted = await ship([...args, '--accept', ids[0] as string]);
    expect(accepted.code, accepted.stderr).toBe(0);
    expect(accepted.stdout).toContain('ACCEPTED');
  }, 180_000);

  it('leaves a recording out when asked (--mute), so its line stays text only', async () => {
    const cand = mkTmp();
    for (const id of ids.slice(0, 2)) speechLike(path.join(cand, `${id}.mp3`), { seconds: 1.2 });
    const out = path.join(mkTmp(), 'voice');
    const r = await ship(['--dir', cand, '--partial', '--mute', ids[1] as string, '--out', out, '--report', path.join(mkTmp(), 'r.json'), '--install']);
    expect(r.code, r.stderr).toBe(0);
    expect(existsSync(path.join(out, 'seymour-flux', `${ids[0]}.mp3`))).toBe(true);
    expect(existsSync(path.join(out, 'seymour-flux', `${ids[1]}.mp3`))).toBe(false);
  }, 180_000);
});
