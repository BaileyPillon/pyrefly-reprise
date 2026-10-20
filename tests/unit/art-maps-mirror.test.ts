/**
 * Release 60 (the conference demo build; both games, shared plumbing): `tools/art-maps-mirror.mjs` makes a release art mirror that carries the lighting maps: every file of the source
 * mirror hard-linked, the chosen maps hard-linked at the paths the game asks for, `manifest.json` rebuilt to list them. Everything here runs on a throwaway tree; the PNGs are headers only
 * (`pngDims` reads the first 26 bytes, the manifest reads names).
 */
import { existsSync, linkSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { writeManifest } from '../../tools/gen/manifest.mjs';
import { buildMapsMirror, planMapsMirror, pngDims, verifyMapsMirror } from '../../tools/art-maps-mirror.mjs';

let base = '';
const src = () => join(base, 'src');
const maps = () => join(base, 'maps');
const to = () => join(base, 'to');

/** A file that is a PNG as far as its header goes: signature, IHDR, width, height, bit depth. */
function png(file: string, width: number, height: number, depth = 8): void {
  mkdirSync(join(file, '..'), { recursive: true });
  const head = Buffer.alloc(33);
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(head, 0);
  head.writeUInt32BE(13, 8);
  head.write('IHDR', 12, 'latin1');
  head.writeUInt32BE(width, 16);
  head.writeUInt32BE(height, 20);
  head[24] = depth;
  writeFileSync(file, head);
}
const json = (file: string, body = '{}'): void => {
  mkdirSync(join(file, '..'), { recursive: true });
  writeFileSync(file, body);
};

beforeEach(() => {
  base = mkdtempSync(join(tmpdir(), 'pyrefly-mapsmirror-'));
  // the source mirror: Tidus idle (base and @2x), attack (base); Yuna idle; the gagazet backdrop
  for (const [name, w, h] of [['idle', 4, 6], ['idle@2x', 8, 12], ['attack', 4, 6]] as const) png(join(src(), 'characters/tidus', `${name}.png`), w, h);
  json(join(src(), 'characters/tidus/idle.json'));
  json(join(src(), 'characters/tidus/attack.json'));
  png(join(src(), 'characters/yuna/idle.png'), 4, 6);
  json(join(src(), 'characters/yuna/idle.json'));
  png(join(src(), 'backdrops/gagazet.png'), 16, 9);
  json(join(src(), 'backdrops/gagazet.json'));
  writeManifest(src());
  // the maps folder: Tidus idle (both), attack has NO map, Yuna idle (base), a candidate's map, the gagazet depth map (16-bit)
  png(join(maps(), 'characters/tidus/idle.normal.png'), 4, 6);
  png(join(maps(), 'characters/tidus/idle@2x.normal.png'), 8, 12);
  png(join(maps(), 'characters/tidus/attack.1.normal.png'), 4, 6);
  png(join(maps(), 'characters/yuna/idle.normal.png'), 4, 6);
  png(join(maps(), 'backdrops/gagazet.depth.png'), 16, 9, 16);
});
afterEach(() => {
  rmSync(base, { recursive: true, force: true });
});

describe('planMapsMirror', () => {
  it('chooses the maps of every chosen state at the tiers asked for, and says what the maps folder does not hold', () => {
    const plan = planMapsMirror({ from: src(), mapsRoot: maps(), to: to(), subjects: ['tidus', 'yuna'], backdrops: ['gagazet'], tiers: [1] });
    expect(plan.problems).toEqual([]);
    expect(plan.maps.map((m) => m.rel).sort()).toEqual(['backdrops/gagazet.depth.png', 'characters/tidus/idle.normal.png', 'characters/yuna/idle.normal.png']);
    expect(plan.uncovered).toEqual(['characters/tidus/attack.normal.png']); // a candidate's map (attack.1.normal.png) does not stand for the chosen state
    expect(plan.links).toContain('characters/tidus/idle.png');
    expect(plan.links).not.toContain('manifest.json');
    expect(pngDims(join(maps(), 'backdrops/gagazet.depth.png'))).toEqual({ width: 16, height: 9, depth: 16 });
  });

  it('adds the @2x map where the painting has an @2x master when the tier is asked for', () => {
    const plan = planMapsMirror({ from: src(), mapsRoot: maps(), to: to(), subjects: ['tidus'], tiers: [1, 2] });
    expect(plan.ok).toBe(true);
    expect(plan.maps.map((m) => m.rel).sort()).toEqual(['characters/tidus/idle.normal.png', 'characters/tidus/idle@2x.normal.png']);
  });

  it('refuses a map that is not its painting\'s size, an unknown figure or room, a target that exists, and a bad tier', () => {
    png(join(maps(), 'characters/tidus/idle.normal.png'), 5, 6);
    const plan = planMapsMirror({ from: src(), mapsRoot: maps(), to: to(), subjects: ['tidus', 'nobody'], backdrops: ['nowhere'], tiers: [1, 3] });
    expect(plan.ok).toBe(false);
    expect(plan.problems.join('\n')).toMatch(/idle\.normal\.png: is 5x6 and its painting .* is 4x6/);
    expect(plan.problems.join('\n')).toMatch(/nobody: the source mirror's manifest lists no such subject/);
    expect(plan.problems.join('\n')).toMatch(/nowhere: the source mirror's manifest lists no such backdrop/);
    expect(plan.problems.join('\n')).toMatch(/--tiers 3/);
    mkdirSync(to());
    expect(planMapsMirror({ from: src(), mapsRoot: maps(), to: to(), subjects: ['tidus'] }).problems.join('\n')).toMatch(/exists: a mirror is made new/);
  });

  it('refuses a source that is not an art folder and a request for nothing', () => {
    expect(planMapsMirror({ from: maps(), mapsRoot: maps(), to: to(), subjects: ['tidus'] }).ok).toBe(false);
    expect(planMapsMirror({ from: src(), mapsRoot: maps(), to: to() }).problems.join('\n')).toMatch(/nothing to add/);
  });
});

describe('buildMapsMirror and verifyMapsMirror', () => {
  it('hard-links every file of the source and every map, lists the maps in a manifest of its own, and proves it', () => {
    const plan = planMapsMirror({ from: src(), mapsRoot: maps(), to: to(), subjects: ['tidus', 'yuna'], backdrops: ['gagazet'], tiers: [1] });
    const made = buildMapsMirror({ from: src(), to: to(), plan });
    expect(made.maps).toBe(3);
    expect(made.lightMaps).toEqual({ normal: 2, subjects: 2, depth: 1 });
    const proved = verifyMapsMirror({ from: src(), to: to(), plan });
    expect(proved.problems).toEqual([]);
    expect(proved.ok).toBe(true);
    // a map and a painting share their data with the originals; the manifest does not
    expect(statSync(join(to(), 'characters/tidus/idle.normal.png')).ino).toBe(statSync(join(maps(), 'characters/tidus/idle.normal.png')).ino);
    expect(statSync(join(to(), 'characters/tidus/idle.png')).ino).toBe(statSync(join(src(), 'characters/tidus/idle.png')).ino);
    expect(statSync(join(to(), 'manifest.json')).nlink).toBe(1);
    const manifest = JSON.parse(readFileSync(join(to(), 'manifest.json'), 'utf8'));
    expect(manifest.lightMaps).toEqual({ normal: { tidus: { idle: [1] }, yuna: { idle: [1] } }, depth: ['gagazet'] });
    // the source mirror's manifest and files are as they were
    expect('lightMaps' in JSON.parse(readFileSync(join(src(), 'manifest.json'), 'utf8'))).toBe(false);
    expect(existsSync(join(src(), 'characters/tidus/idle.normal.png'))).toBe(false);
  });

  it('catches a mirror that was changed after it was made', () => {
    const plan = planMapsMirror({ from: src(), mapsRoot: maps(), to: to(), subjects: ['tidus'], tiers: [1] });
    buildMapsMirror({ from: src(), to: to(), plan });
    expect(verifyMapsMirror({ from: src(), to: to(), plan }).ok).toBe(true);
    rmSync(join(to(), 'characters/tidus/idle.normal.png'));
    writeFileSync(join(to(), 'characters/tidus/idle.normal.png'), readFileSync(join(maps(), 'characters/tidus/idle.normal.png'))); // a copy, not the maps folder's file
    expect(verifyMapsMirror({ from: src(), to: to(), plan }).problems.join('\n')).toMatch(/idle\.normal\.png: not a hard link of the maps folder's file/);
    linkSync(join(src(), 'characters/tidus/idle.json'), join(to(), 'extra.json'));
    expect(verifyMapsMirror({ from: src(), to: to(), plan }).problems.join('\n')).toMatch(/file\(s\) in the mirror that it should not hold/);
  });
});
