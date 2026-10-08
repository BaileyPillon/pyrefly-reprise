/**
 * The variant switch for the FFX voice recordings (`tools/audio/voice-variant.mjs`): which file each recording uses under
 * "pauses shortened" (tight, the default) and "as recorded", the staging folder the ship step reads, the arguments it is given,
 * and the config that names the folders and the lines kept as text only. No ffmpeg and no network: plain files in a temp folder.
 * Game case: FFX only (the recordings).
 */
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, describe, expect, it } from 'vitest';

// @ts-expect-error -- the audio tooling is plain .mjs with no declarations.
import * as W from '../../tools/audio/voice-variant-lib.mjs';
// @ts-expect-error -- the audio tooling is plain .mjs with no declarations.
import * as V from '../../tools/audio/voice-lib.mjs';
// @ts-expect-error -- the audio tooling is plain .mjs with no declarations.
import * as L from '../../tools/audio/elevenlabs-lib.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const tmp: string[] = [];
const mkTmp = (): string => { const d = mkdtempSync(path.join(os.tmpdir(), 'voice-variant-test-')); tmp.push(d); return d; };
afterAll(() => { for (const d of tmp) rmSync(d, { recursive: true, force: true }); });
const put = (dir: string, name: string, bytes: string): void => { mkdirSync(dir, { recursive: true }); writeFileSync(path.join(dir, name), bytes); };

interface Variant { label: string; dir: string; overlay?: string; suffix?: string; staging: string; acceptPausesOf?: string }
const config = JSON.parse(readFileSync(path.join(ROOT, 'tools/audio/voice-variants.json'), 'utf8')) as { default: string; variants: Record<string, Variant>; mute: string[] };

describe('which file is a recording', () => {
  it('takes <id>.mp3 and nothing else: not a retake, not a shortened copy, not a sidecar', () => {
    expect(W.recordingIdOf('yunalesca.pre.006.mp3')).toBe('yunalesca.pre.006');
    expect(W.recordingIdOf('yunalesca.mid-yunalesca-first-zombie.001.fb1.mp3')).toBe('yunalesca.mid-yunalesca-first-zombie.001.fb1');
    expect(W.recordingIdOf('yunalesca.pre.006.tight.mp3')).toBeNull();
    expect(W.recordingIdOf('yunalesca.pre.006.take2.mp3')).toBeNull();
    expect(W.recordingIdOf('yunalesca.pre.006.json')).toBeNull();
  });
});

describe('planning a variant', () => {
  it('uses the originals as they are, and the shortened copy where the overlay has one', () => {
    const base = mkTmp();
    const overlay = mkTmp();
    for (const id of ['a.pre.001', 'a.pre.002', 'a.pre.003']) put(base, `${id}.mp3`, `orig ${id}`);
    put(base, 'a.pre.001.json', '{}');
    for (const id of ['a.pre.001', 'a.pre.002', 'a.pre.003']) put(overlay, `${id}.mp3`, `orig ${id}`); // the listening folder holds the originals too
    put(overlay, 'a.pre.002.tight.mp3', 'tight a.pre.002');
    const recorded = W.planVariant({ dir: base });
    expect(recorded.ids).toEqual(['a.pre.001', 'a.pre.002', 'a.pre.003']);
    expect(recorded.overlaid).toEqual([]);
    const tight = W.planVariant({ dir: base, overlay, suffix: '.tight.mp3' });
    expect(tight.ids).toEqual(recorded.ids);
    expect(tight.overlaid).toEqual(['a.pre.002']);
    expect(readFileSync(tight.files.get('a.pre.002'), 'utf8')).toBe('tight a.pre.002');
    expect(readFileSync(tight.files.get('a.pre.001'), 'utf8')).toBe('orig a.pre.001');
  });

  it('refuses a shortened copy with no original beside it: the two folders would not describe the same recordings', () => {
    const base = mkTmp();
    const overlay = mkTmp();
    put(base, 'a.pre.001.mp3', 'x');
    put(overlay, 'a.pre.009.tight.mp3', 'y');
    expect(() => W.planVariant({ dir: base, overlay })).toThrow(/a\.pre\.009/);
  });
});

describe('staging', () => {
  it('names every recording <id>.mp3 with the chosen bytes, keeps what is already right and drops what is not in the plan', () => {
    const base = mkTmp();
    const overlay = mkTmp();
    const staging = path.join(mkTmp(), 'staging');
    put(base, 'a.pre.001.mp3', 'one');
    put(base, 'a.pre.002.mp3', 'two');
    put(overlay, 'a.pre.002.tight.mp3', 'two shortened');
    const tight = W.planVariant({ dir: base, overlay });
    expect(W.stage(tight, staging)).toMatchObject({ kept: 0, removed: 0 });
    expect(readFileSync(path.join(staging, 'a.pre.002.mp3'), 'utf8')).toBe('two shortened');
    expect(readFileSync(path.join(staging, 'a.pre.001.mp3'), 'utf8')).toBe('one');
    put(staging, 'stale.mp3', 'left over from an older run');

    // switching to the other variant replaces only the file that differs and drops the stray one
    const recorded = W.planVariant({ dir: base });
    const second = W.stage(recorded, staging) as { kept: number; removed: number };
    expect(second.kept).toBe(1);
    expect(second.removed).toBe(1);
    expect(readdirSync(staging).sort()).toEqual(['a.pre.001.mp3', 'a.pre.002.mp3']);
    expect(readFileSync(path.join(staging, 'a.pre.002.mp3'), 'utf8')).toBe('two');
    // the sources are untouched by either
    expect(readFileSync(path.join(overlay, 'a.pre.002.tight.mp3'), 'utf8')).toBe('two shortened');
    expect(readFileSync(path.join(base, 'a.pre.002.mp3'), 'utf8')).toBe('two');
  });
});

describe('the arguments the ship step is given', () => {
  it('installs with --clean by default, and only measures with --check', () => {
    const args = W.shipArgs({ name: 'tight', stagingDir: 'S', mute: ['m.1', 'm.2'] }) as string[];
    expect(args).toEqual(['--dir', 'S', '--variant', 'tight', '--mute', 'm.1,m.2', '--install', '--clean']);
    expect(W.shipArgs({ name: 'tight', stagingDir: 'S', install: false })).toEqual(['--dir', 'S', '--variant', 'tight']);
    expect(W.shipArgs({ name: 'recorded', stagingDir: 'S', accept: ['x', 'y'] })).toContain('x,y');
  });
});

describe('voice-variants.json', () => {
  it('defaults to "pauses shortened" because only it passes the ship gate, and "as recorded" accepts its pauses from it', () => {
    expect(config.default).toBe('tight');
    expect(config.variants.tight?.overlay).toBeTruthy();
    expect(config.variants.tight?.acceptPausesOf).toBeUndefined();
    const other = config.variants.recorded as Variant;
    expect(other.acceptPausesOf).toBe('tight');
    expect(config.variants[other.acceptPausesOf as string]).toBeDefined();
  });

  it('keeps its folders and staging outside the repo (the candidates are never committed)', () => {
    for (const v of Object.values(config.variants)) {
      for (const p of [v.dir, v.overlay, v.staging]) if (p) expect(L.insideRepo(path.resolve(p)), p).toBe(false);
    }
  });

  it('mutes only recordings of the pass, each once, in a mid-battle beat (the lines that overran stay text only)', () => {
    const inventory = L.loadInventory().doc;
    const { recordings } = V.planRecordings(V.selectLines(inventory)) as { recordings: Array<{ id: string }> };
    const ids = new Set(recordings.map((r) => r.id));
    expect(new Set(config.mute).size).toBe(config.mute.length);
    for (const id of config.mute) {
      expect(ids.has(id), `${id} is not a recording of the FFX pass`).toBe(true);
      expect(id, `${id} is not a mid-battle line`).toMatch(/\.mid-/);
    }
  });

  it('is what the installed report says was installed, when recordings are installed', () => {
    const report = path.join(ROOT, 'docs/audio/voice-ffx-ship-report.json');
    if (!existsSync(report)) return;
    expect(Object.keys(config.variants)).toContain(JSON.parse(readFileSync(report, 'utf8')).variant);
  });
});
