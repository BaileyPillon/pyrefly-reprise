/**
 * `tools/critic-pending.mjs` — the marker that makes "the critic has not
 * looked at this live build yet" visible.
 *
 * The owner's rule (critic/RUBRIC.md, "The loop", restated 2026-09-18): every
 * build pushed live gets a full critic round, no exceptions. `deploy-pages.mjs`
 * writes one marker per verified deploy under `critic/pending/<sha>.json`, and
 * only the chief critic's report for that exact build clears it. What matters
 * here is that the marker's shape is exactly what the deploy promised
 * (`mainSha`, `bundle`, `deployedAt`, `liveUrl`, `artFiles`), that the folder
 * reader never throws on a missing folder or a corrupt file, and that the
 * warning block always prints something — an empty pending folder must still
 * show the check ran, not go silent.
 *
 * Runs against a throwaway temp directory, never the repo's real
 * `critic/pending/`.
 */

import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  buildPendingMarker,
  computeAgeHours,
  formatPendingMarker,
  formatPendingWarningBlock,
  pendingMarkerFileName,
  pendingMarkerPath,
  readPendingMarkers,
  writePendingMarker,
} from '../../tools/critic-pending.mjs';

const SAMPLE: Parameters<typeof buildPendingMarker>[0] = {
  mainSha: 'a1b2c3d',
  bundle: 'ff00ee11',
  deployedAt: '2026-09-18T12:00:00.000Z',
  liveUrl: 'https://baileypillon.github.io/pyrefly-reprise/',
  artFiles: 42,
};

let root = '';

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'pyrefly-critic-pending-'));
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

describe('pendingMarkerFileName / pendingMarkerPath', () => {
  it('names the marker after the short sha', () => {
    expect(pendingMarkerFileName('a1b2c3d')).toBe('a1b2c3d.json');
  });

  it('joins the pending dir and the sha into the full path', () => {
    expect(pendingMarkerPath('critic/pending', 'a1b2c3d')).toBe(
      join('critic/pending', 'a1b2c3d.json'),
    );
  });
});

describe('buildPendingMarker', () => {
  it('carries exactly the five fields the deploy promised, unchanged', () => {
    expect(buildPendingMarker(SAMPLE)).toEqual({
      mainSha: 'a1b2c3d',
      bundle: 'ff00ee11',
      deployedAt: '2026-09-18T12:00:00.000Z',
      liveUrl: 'https://baileypillon.github.io/pyrefly-reprise/',
      artFiles: 42,
    });
  });
});

describe('formatPendingMarker', () => {
  it('produces pretty-printed, newline-terminated, round-trippable JSON', () => {
    const text = formatPendingMarker(buildPendingMarker(SAMPLE));
    expect(text.endsWith('\n')).toBe(true);
    expect(text).toContain('\n  "mainSha"');
    expect(JSON.parse(text)).toEqual(buildPendingMarker(SAMPLE));
  });
});

describe('computeAgeHours', () => {
  it('is zero when deployedAt is now', () => {
    const now = new Date('2026-09-18T12:00:00.000Z');
    expect(computeAgeHours('2026-09-18T12:00:00.000Z', now)).toBe(0);
  });

  it('reads whole and fractional hours', () => {
    const now = new Date('2026-09-18T15:30:00.000Z');
    expect(computeAgeHours('2026-09-18T12:00:00.000Z', now)).toBe(3.5);
  });

  it('reads 0 for an unparsable timestamp rather than NaN or throwing', () => {
    const now = new Date('2026-09-18T12:00:00.000Z');
    expect(computeAgeHours('not-a-date', now)).toBe(0);
    expect(computeAgeHours(undefined as unknown as string, now)).toBe(0);
  });
});

describe('writePendingMarker', () => {
  it('creates the pending dir, a .gitkeep, and the marker file', () => {
    const pendingDir = join(root, 'critic', 'pending');
    const marker = buildPendingMarker(SAMPLE);
    const path = writePendingMarker(pendingDir, marker);

    expect(path).toBe(join(pendingDir, 'a1b2c3d.json'));
    expect(existsSync(join(pendingDir, '.gitkeep'))).toBe(true);
    expect(JSON.parse(readFileSync(path, 'utf8'))).toEqual(marker);
  });

  it('does not clobber an existing .gitkeep or fail if it is already there', () => {
    const pendingDir = join(root, 'critic', 'pending');
    mkdirSync(pendingDir, { recursive: true });
    writeFileSync(join(pendingDir, '.gitkeep'), 'not-actually-empty');

    writePendingMarker(pendingDir, buildPendingMarker(SAMPLE));

    expect(readFileSync(join(pendingDir, '.gitkeep'), 'utf8')).toBe('not-actually-empty');
  });

  it('overwrites a marker for the same sha on a second write', () => {
    const pendingDir = join(root, 'critic', 'pending');
    writePendingMarker(pendingDir, buildPendingMarker(SAMPLE));
    writePendingMarker(pendingDir, buildPendingMarker({ ...SAMPLE, bundle: 'newbundle' }));

    const path = pendingMarkerPath(pendingDir, SAMPLE.mainSha);
    expect(JSON.parse(readFileSync(path, 'utf8')).bundle).toBe('newbundle');
  });
});

describe('readPendingMarkers', () => {
  it('reads [] for a pending dir that does not exist yet', () => {
    expect(readPendingMarkers(join(root, 'nope'))).toEqual([]);
  });

  it('reads [] for an existing but empty pending dir', () => {
    const pendingDir = join(root, 'critic', 'pending');
    mkdirSync(pendingDir, { recursive: true });
    writeFileSync(join(pendingDir, '.gitkeep'), '');
    expect(readPendingMarkers(pendingDir)).toEqual([]);
  });

  it('reads back a marker written by writePendingMarker, with age computed', () => {
    const pendingDir = join(root, 'critic', 'pending');
    writePendingMarker(pendingDir, buildPendingMarker(SAMPLE));

    const now = new Date('2026-09-18T14:00:00.000Z');
    const entries = readPendingMarkers(pendingDir, now);

    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({
      file: 'a1b2c3d.json',
      mainSha: 'a1b2c3d',
      bundle: 'ff00ee11',
      liveUrl: SAMPLE.liveUrl,
      artFiles: 42,
      ageHours: 2,
    });
  });

  it('orders multiple markers oldest first', () => {
    const pendingDir = join(root, 'critic', 'pending');
    writePendingMarker(pendingDir, buildPendingMarker({ ...SAMPLE, mainSha: 'newer', deployedAt: '2026-09-18T11:00:00.000Z' }));
    writePendingMarker(pendingDir, buildPendingMarker({ ...SAMPLE, mainSha: 'older', deployedAt: '2026-09-18T08:00:00.000Z' }));

    const now = new Date('2026-09-18T12:00:00.000Z');
    const entries = readPendingMarkers(pendingDir, now);

    expect(entries.map((e) => e.mainSha)).toEqual(['older', 'newer']);
    expect(entries.map((e) => e.ageHours)).toEqual([4, 1]);
  });

  it('keeps a corrupt marker in the list with parseError instead of throwing', () => {
    const pendingDir = join(root, 'critic', 'pending');
    mkdirSync(pendingDir, { recursive: true });
    writeFileSync(join(pendingDir, 'bad.json'), '{ not valid json');
    writePendingMarker(pendingDir, buildPendingMarker({ ...SAMPLE, mainSha: 'good' }));

    const entries = readPendingMarkers(pendingDir);
    const bad = entries.find((e) => e.file === 'bad.json');
    const good = entries.find((e) => e.file === 'good.json');

    expect(bad?.parseError).toBeDefined();
    expect(good?.parseError).toBeUndefined();
    expect(good?.mainSha).toBe('good');
  });

  it('ignores non-.json files such as .gitkeep', () => {
    const pendingDir = join(root, 'critic', 'pending');
    writePendingMarker(pendingDir, buildPendingMarker(SAMPLE));
    expect(readPendingMarkers(pendingDir).map((e) => e.file)).toEqual(['a1b2c3d.json']);
  });
});

describe('formatPendingWarningBlock', () => {
  it('still prints a block when nothing is pending', () => {
    expect(formatPendingWarningBlock([])).toEqual(['UNEVALUATED LIVE BUILDS: none']);
  });

  it('lists sha, bundle, age and live URL for each pending marker', () => {
    const lines = formatPendingWarningBlock([
      {
        file: 'a1b2c3d.json',
        mainSha: 'a1b2c3d',
        bundle: 'ff00ee11',
        deployedAt: '2026-09-18T12:00:00.000Z',
        liveUrl: 'https://baileypillon.github.io/pyrefly-reprise/',
        artFiles: 42,
        ageHours: 2,
      },
    ]);

    expect(lines[0]).toContain('UNEVALUATED LIVE BUILDS: 1 live build');
    expect(lines.some((l) => l.includes('main=a1b2c3d'))).toBe(true);
    expect(lines.some((l) => l.includes('bundle=ff00ee11'))).toBe(true);
    expect(lines.some((l) => l.includes('age=2h'))).toBe(true);
    expect(lines.some((l) => l.includes('live=https://baileypillon.github.io/pyrefly-reprise/'))).toBe(true);
    expect(lines.some((l) => l.includes('critic:status'))).toBe(true);
  });

  it('surfaces a corrupt marker as UNREADABLE rather than crashing the caller', () => {
    const lines = formatPendingWarningBlock([
      { file: 'bad.json', mainSha: 'bad', ageHours: 0, parseError: 'Unexpected end of JSON input' },
    ]);
    expect(lines.some((l) => l.includes('bad.json') && l.includes('UNREADABLE'))).toBe(true);
  });
});
