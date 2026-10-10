/**
 * The manifest under concurrent renders.
 *
 * This is not a theoretical race. Several agents render into one
 * `public/audio/manifest.json`, and the read-modify-write it used to do
 * dropped whole cues: their MP3s shipped unlisted, and an unlisted cue falls
 * back to the oscillator render — the exact sound the sampled pipeline exists
 * to replace. So the test spawns real processes and lets them fight over the
 * file, because an in-process test of a file lock proves nothing about two
 * `node` runs started thirty seconds apart.
 */

import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import type { ManifestMusicEntry } from '../../tools/audio/manifest-io.mjs';
import {
  LOOP_DECIMALS,
  externalSource,
  mergeIntoManifest,
  musicEntry,
  readManifest,
  secondsAtSample,
  setMusicEntryText,
  updateManifest,
  withManifestLock,
} from '../../tools/audio/manifest-io.mjs';

/** The module as a file:// URL — a bare `D:\...` path is not importable. */
const MODULE = new URL('../../tools/audio/manifest-io.mjs', import.meta.url).href;

const temps: string[] = [];
async function tempRoot(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'pyrefly-manifest-'));
  temps.push(dir);
  return dir;
}

afterEach(async () => {
  while (temps.length > 0) await rm(temps.pop()!, { recursive: true, force: true });
});

function entryFor(name: string, sample = 44100): ManifestMusicEntry {
  return musicEntry({
    name,
    loopStartSample: sample,
    loopEndSample: sample * 3,
    totalSamples: sample * 4,
    sampleRate: 44100,
    bytes: 1234,
    lufs: -16.02,
    truePeakDb: -1.31,
  });
}

/** One child process that merges `count` entries with the given prefix. */
function child(outRoot: string, prefix: string, count: number): Promise<number> {
  const source = `
    import { mergeIntoManifest, musicEntry } from ${JSON.stringify(MODULE)};
    const outRoot = ${JSON.stringify(outRoot)};
    for (let i = 0; i < ${count}; i++) {
      const name = '${prefix}-' + i;
      await mergeIntoManifest(outRoot, {
        sampleRate: 44100,
        music: {
          [name]: musicEntry({
            name,
            loopStartSample: 44100,
            loopEndSample: 132300,
            totalSamples: 176400,
            sampleRate: 44100,
            bytes: 10,
            lufs: -16,
            truePeakDb: -1.2,
          }),
        },
      });
      // Widen the window the old code lost entries in.
      await new Promise((r) => setTimeout(r, 4));
    }
  `;
  return new Promise((resolve, reject) => {
    const proc = spawn(process.execPath, ['--input-type=module', '-e', source], { stdio: 'pipe' });
    let stderr = '';
    proc.stderr.on('data', (chunk) => {
      stderr += String(chunk);
    });
    proc.on('error', reject);
    proc.on('exit', (code) => (code === 0 ? resolve(0) : reject(new Error(`child failed: ${stderr}`))));
  });
}

describe('manifest-io', () => {
  it('starts from nothing, and tolerates a corrupt file', async () => {
    const root = await tempRoot();
    expect((await readManifest(root)).music).toEqual({});
    await writeFile(join(root, 'manifest.json'), '{ this is not json');
    expect((await readManifest(root)).music).toEqual({});
  });

  it('merges without touching entries it was not given', async () => {
    const root = await tempRoot();
    await mergeIntoManifest(root, { music: { alpha: entryFor('alpha') } });
    await mergeIntoManifest(root, { music: { beta: entryFor('beta') } });
    const merged = await readManifest(root);
    expect(Object.keys(merged.music).sort()).toEqual(['alpha', 'beta']);
    expect(merged.music.alpha?.file).toBe('music/alpha.mp3');
  });

  it('writes loop points to six decimals, on the sample', async () => {
    const root = await tempRoot();
    // 132300 samples at 44100 is exactly 3 s; 132301 is not, and must survive
    // the rounding as a distinct value or the loop seam moves off its sample.
    await mergeIntoManifest(root, {
      music: {
        odd: musicEntry({
          name: 'odd',
          loopStartSample: 44101,
          loopEndSample: 132301,
          totalSamples: 176400,
          sampleRate: 44100,
          bytes: 1,
          lufs: -16,
          truePeakDb: -1,
        }),
      },
    });
    const text = await readFile(join(root, 'manifest.json'), 'utf8');
    expect(text).toContain('"loopStart": 1.000023');
    expect(text).toContain('"loopEnd": 3.000023');
    const entry = (await readManifest(root)).music.odd;
    expect(Math.round((entry?.loopEnd ?? 0) * 44100)).toBe(132301);
    expect(secondsAtSample(132301, 44100)).toBe(Number((132301 / 44100).toFixed(LOOP_DECIMALS)));
    expect(LOOP_DECIMALS).toBe(6);
  });

  it('keeps the sfx sprite when a music-only render writes', async () => {
    const root = await tempRoot();
    await mergeIntoManifest(root, { sfx: { file: 'sfx/sprite.mp3', duration: 12, cues: {} } });
    await mergeIntoManifest(root, { music: { gamma: entryFor('gamma') } });
    const merged = await readManifest(root);
    expect(merged.sfx?.file).toBe('sfx/sprite.mp3');
    expect(merged.music.gamma).toBeTruthy();
  });

  it('serialises writers: no lock holder sees another inside its critical section', async () => {
    const root = await tempRoot();
    let inside = 0;
    let overlaps = 0;
    await Promise.all(
      Array.from({ length: 8 }, () =>
        withManifestLock(root, async () => {
          inside++;
          if (inside > 1) overlaps++;
          await new Promise((r) => setTimeout(r, 5));
          inside--;
        }),
      ),
    );
    expect(overlaps).toBe(0);
  });

  it('loses nothing when four separate renders write at once', async () => {
    const root = await tempRoot();
    const perChild = 12;
    await Promise.all([
      child(root, 'a', perChild),
      child(root, 'b', perChild),
      child(root, 'c', perChild),
      child(root, 'd', perChild),
    ]);
    const merged = await readManifest(root);
    expect(Object.keys(merged.music)).toHaveLength(perChild * 4);
    for (const prefix of ['a', 'b', 'c', 'd']) {
      for (let i = 0; i < perChild; i++) {
        expect(merged.music[`${prefix}-${i}`], `${prefix}-${i}`).toBeTruthy();
      }
    }
  }, 60_000);

  it('never leaves a half-written file for a reader', async () => {
    const root = await tempRoot();
    await mergeIntoManifest(root, { music: { seed: entryFor('seed') } });
    const writer = (async () => {
      for (let i = 0; i < 40; i++) {
        await mergeIntoManifest(root, { music: { [`cue-${i}`]: entryFor(`cue-${i}`) } });
      }
    })();
    // Hammer the file while it is being replaced: every read must parse.
    for (let i = 0; i < 200; i++) {
      const text = await readFile(join(root, 'manifest.json'), 'utf8');
      expect(() => JSON.parse(text)).not.toThrow();
      expect(JSON.parse(text).music.seed).toBeTruthy();
    }
    await writer;
  });

  it('steals a lock whose owner is gone, rather than blocking forever', async () => {
    const root = await tempRoot();
    await mergeIntoManifest(root, { music: { alpha: entryFor('alpha') } });
    // A pid nothing can be running under: the stale check asks the OS, gets
    // ESRCH, and takes the lock rather than waiting out the timeout.
    await writeFile(
      join(root, 'manifest.json.lock'),
      JSON.stringify({ pid: 999_999_998, since: new Date(0).toISOString() }),
    );
    await mergeIntoManifest(root, { music: { beta: entryFor('beta') } });
    expect(Object.keys((await readManifest(root)).music).sort()).toEqual(['alpha', 'beta']);
  }, 20_000);

  it('updates in place under the lock, on the freshest entry', async () => {
    const root = await tempRoot();
    await mergeIntoManifest(root, { music: { delta: entryFor('delta') } });
    await updateManifest(root, (live) => {
      live.music.delta!.loopEnd = 9.123456;
      return live;
    });
    expect((await readManifest(root)).music.delta?.loopEnd).toBe(9.123456);
  });
});

/**
 * Editing one entry as text, and the `source` exemption.
 *
 * The shipped manifest keeps the line endings its checkout gave it and writes `"lufs": -16.0`, so a parse and a
 * stringify rewrites every entry. `setMusicEntryText` changes one block and nothing else, which is what lets the
 * ElevenLabs install (docs/audio/music-elevenlabs-2026-10-07.json) be a three-block diff that merges with every
 * other branch that touches a different cue.
 */
describe('setMusicEntryText and externalSource', () => {
  const fixture = (eol: string): string =>
    [
      '{',
      '  "version": 1,',
      '  "sampleRate": 44100,',
      '  "music": {',
      '    "alpha": {',
      '      "file": "music/alpha.mp3",',
      '      "loopStart": 1.5,',
      '      "loopEnd": 80,',
      '      "duration": 83.25,',
      '      "bytes": 100,',
      '      "lufs": -16.0,',
      '      "truePeakDb": -1.5,',
      '      "score": "abc123"',
      '    },',
      '    "beta": {',
      '      "file": "music/beta.mp3",',
      '      "loopStart": 2.5,',
      '      "loopEnd": 70.5,',
      '      "duration": 73.5,',
      '      "bytes": 200,',
      '      "lufs": -16.0,',
      '      "truePeakDb": -1.4',
      '    },',
      '    "gamma": {',
      '      "file": "music/gamma.mp3",',
      '      "loopStart": 3.5,',
      '      "loopEnd": 60.5,',
      '      "duration": 63.5,',
      '      "bytes": 300,',
      '      "lufs": -16.0,',
      '      "truePeakDb": -1.3',
      '    }',
      '  },',
      '  "sfx": null',
      '}',
      '',
    ].join(eol);

  const replacement = {
    file: 'music/beta.mp3',
    loopStart: 6.698798,
    loopEnd: 73.366553,
    duration: 76.3666,
    bytes: 2106911,
    lufs: -16,
    truePeakDb: -2,
    source: 'elevenlabs-music_v2_5',
  };

  it.each([
    ['LF', '\n'],
    ['CRLF', '\r\n'],
  ])('changes only the named block, with %s line endings', (_name, eol) => {
    const before = fixture(eol);
    const after = setMusicEntryText(before, 'beta', replacement);
    const a = before.split(eol);
    const b = after.split(eol);
    // Everything above and below the block is the same lines, in the same places.
    expect(b.slice(0, 14)).toEqual(a.slice(0, 14));
    expect(b.slice(-11)).toEqual(a.slice(-11));
    expect(after.includes(eol)).toBe(true);
    expect(after.replace(/\r\n/g, '\n').includes('\r')).toBe(false);
    // It still parses, the other entries are untouched, and the new block reads as given.
    const parsed = JSON.parse(after) as { music: Record<string, Record<string, unknown>> };
    expect(parsed.music.beta).toEqual(replacement);
    expect(parsed.music.alpha).toEqual(JSON.parse(before).music.alpha);
    expect(parsed.music.gamma).toEqual(JSON.parse(before).music.gamma);
    // The level fields keep a decimal point the way the file writes them; bytes stay whole.
    expect(after).toContain('"lufs": -16.0,');
    expect(after).toContain('"truePeakDb": -2.0,');
    expect(after).toContain('"bytes": 2106911,');
  });

  it('keeps each block\'s closing line as it was: a comma in the middle, none on the last entry', () => {
    const before = fixture('\n');
    const middle = setMusicEntryText(before, 'beta', replacement).split('\n');
    expect(middle[middle.indexOf('    "gamma": {') - 1]).toBe('    },');
    const last = setMusicEntryText(before, 'gamma', { ...replacement, file: 'music/gamma.mp3' }).split('\n');
    expect(last[last.indexOf('  },') - 1]).toBe('    }');
  });

  it('drops a field the new entry does not have (a render\'s `score` goes when the file is not a render)', () => {
    const after = JSON.parse(setMusicEntryText(fixture('\n'), 'alpha', { ...replacement, file: 'music/alpha.mp3' })) as {
      music: { alpha: Record<string, unknown> };
    };
    expect('score' in after.music.alpha).toBe(false);
    expect(after.music.alpha.source).toBe('elevenlabs-music_v2_5');
  });

  it('throws for an entry the manifest does not have', () => {
    expect(() => setMusicEntryText(fixture('\n'), 'delta', replacement)).toThrow(/no music entry "delta"/);
  });

  it('writes any entry the shipped manifest already has back as the very same text', () => {
    const text = readFileSync(new URL('../../public/audio/manifest.json', import.meta.url), 'utf8');
    const music = (JSON.parse(text) as { music: Record<string, { file: string }> }).music;
    for (const [name, entry] of Object.entries(music)) {
      expect(setMusicEntryText(text, name, entry), `${name} does not round-trip`).toBe(text);
    }
    const lf = text.replace(/\r\n/g, '\n');
    for (const [name, entry] of Object.entries(music)) {
      expect(setMusicEntryText(lf, name, entry), `${name} does not round-trip (LF)`).toBe(lf);
    }
  });

  it('names a source only when the entry has a non-empty string for it', () => {
    expect(externalSource({ source: 'elevenlabs-music_v2_5' })).toBe('elevenlabs-music_v2_5');
    expect(externalSource({})).toBeNull();
    expect(externalSource({ source: '' })).toBeNull();
    expect(externalSource({ source: 7 })).toBeNull();
    expect(externalSource(null)).toBeNull();
    expect(externalSource(undefined)).toBeNull();
  });
});
