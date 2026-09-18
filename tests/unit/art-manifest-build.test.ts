/**
 * `tools/gen/manifest.mjs` — the build-time scan of `public/art/`.
 *
 * The manifest is what stops the live site probing for art that does not
 * exist, so the thing worth pinning down is what it counts as art: a bare
 * `idle.png` yes, `idle.2.png` (a candidate the fleet has not promoted) and
 * `ko.raw.png` (a pre-cutout source) no. Getting that wrong in either
 * direction is a bug you only see in production — too strict and a painting
 * silently vanishes from the game, too loose and the 404s come back.
 *
 * Everything here runs against a throwaway fixture tree, never `public/art/`:
 * the art fleet owns those files and is writing them while this runs.
 */

import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { buildManifest, writeManifest } from '../../tools/gen/manifest.mjs';

let root = '';

/** Write a PNG + optional sidecar under `characters/<id>/`. */
function pose(id: string, file: string, sidecar?: Record<string, unknown> | null): void {
  const dir = join(root, 'characters', id);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, `${file}.png`), 'not-really-a-png');
  if (sidecar !== null) {
    writeFileSync(
      join(dir, `${file}.json`),
      JSON.stringify(sidecar ?? { width: 832, height: 1216, baselineY: 1200 }),
    );
  }
}

function flat(folder: string, name: string): void {
  const dir = join(root, folder);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, `${name}.png`), 'not-really-a-png');
  writeFileSync(join(dir, `${name}.json`), '{}');
}

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'pyrefly-art-'));
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

describe('buildManifest', () => {
  it('lists chosen poses and ignores candidates and raw intermediates', () => {
    pose('tidus', 'idle');
    pose('tidus', 'attack');
    pose('tidus', 'ko');
    pose('tidus', 'ko.raw', null);
    pose('tidus', 'victory.2');
    pose('tidus', 'victory.3');

    const { manifest } = buildManifest(root, { now: 'T' });

    expect(manifest.subjects.tidus!.states).toEqual(['attack', 'idle', 'ko']);
    expect(manifest.subjects.tidus!.states).not.toContain('victory');
    expect(manifest.generatedAt).toBe('T');
  });

  it('reports a state that exists only as an un-promoted variant', () => {
    pose('vegnagun-head', 'idle.1');
    pose('vegnagun-head', 'idle.2');

    const { manifest, variantsOnly, warnings } = buildManifest(root);

    expect(manifest.subjects['vegnagun-head']).toBeUndefined();
    expect(variantsOnly).toContain('vegnagun-head/idle');
    expect(warnings.join(' ')).toContain('no chosen PNG');
  });

  it('flags a promoted pose whose sidecar is missing', () => {
    pose('lulu', 'idle');
    pose('lulu', 'cast', null);

    const { manifest, warnings } = buildManifest(root);

    // The painting is real, so it still ships; the sidecar is the defect.
    expect(manifest.subjects.lulu!.states).toEqual(['cast', 'idle']);
    expect(warnings.some((w) => w.includes('lulu/cast.png'))).toBe(true);
  });

  it('warns when a subject has poses but no idle to fall back to', () => {
    pose('shuyin', 'attack');

    const { warnings } = buildManifest(root);

    expect(warnings.some((w) => w.includes('no idle.png'))).toBe(true);
  });

  it('takes facing from idle, then from whichever state declares one', () => {
    pose('auron', 'idle', { width: 1, height: 1, facing: 'Right' });
    pose('auron', 'attack', { width: 1, height: 1, facing: 'left' });
    pose('mortiorchis', 'idle', { width: 1, height: 1 });
    pose('mortiorchis', 'cast', { width: 1, height: 1, facing: 'left' });
    pose('lenne', 'idle', { width: 1, height: 1 });

    const { manifest } = buildManifest(root);

    expect(manifest.subjects.auron!.facing).toBe('right');
    expect(manifest.subjects.mortiorchis!.facing).toBe('left');
    expect(manifest.subjects.lenne!.facing).toBeUndefined();
  });

  it('marks which subjects have a portrait, and indexes the flat folders', () => {
    pose('yuna', 'idle');
    pose('yu-yevon', 'idle');
    flat('portraits', 'yuna');
    flat('portraits', 'shiva');
    flat('backdrops', 'gagazet');
    flat('pause', 'ch1-seymour-flux');

    const { manifest } = buildManifest(root);

    expect(manifest.subjects.yuna!.portrait).toBe(true);
    expect(manifest.subjects['yu-yevon']!.portrait).toBe(false);
    expect(manifest.portraits).toEqual(['shiva', 'yuna']);
    expect(manifest.backdrops).toEqual(['gagazet']);
    expect(manifest.pause).toEqual(['ch1-seymour-flux']);
  });

  it('survives an art root that is not there yet', () => {
    const { manifest } = buildManifest(join(root, 'nope'));
    expect(manifest.subjects).toEqual({});
    expect(manifest.portraits).toEqual([]);
  });
});

describe('writeManifest', () => {
  it('writes once and then reports no change for the same tree', () => {
    pose('tidus', 'idle');

    const first = writeManifest(root, { now: 'A' });
    expect(first.changed).toBe(true);

    // Only the timestamp differs, which must not count as a change — otherwise
    // every build rewrites the file and every tree looks dirty.
    const second = writeManifest(root, { now: 'B' });
    expect(second.changed).toBe(false);

    pose('tidus', 'attack');
    expect(writeManifest(root, { now: 'C' }).changed).toBe(true);
  });

  it('--check never writes', () => {
    pose('tidus', 'idle');
    const res = writeManifest(root, { check: true });
    expect(res.changed).toBe(true);
    expect(writeManifest(root, { check: true }).changed).toBe(true);
  });
});
