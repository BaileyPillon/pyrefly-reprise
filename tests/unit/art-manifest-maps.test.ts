/**
 * Release 60 (the conference demo build; both games, shared plumbing): the art manifest lists the lighting maps a build ships (`lightMaps`), and the HD-2D look asks for those and no others.
 * The builder (`tools/gen/manifest.mjs`) reads them off a fixture tree, never `public/art`; the runtime half (`src/engine/ArtManifestMaps.ts`) is pure.
 */
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { buildManifest } from '../../tools/gen/manifest.mjs';
import { parseArtManifest } from '../../src/engine/ArtManifest.ts';
import { depthMapListed, normalMapScaleFor, parseLightMaps } from '../../src/engine/ArtManifestMaps.ts';

let root = '';
const put = (rel: string): void => {
  const file = join(root, rel);
  mkdirSync(join(file, '..'), { recursive: true });
  writeFileSync(file, rel.endsWith('.json') ? '{}' : 'not-really-a-png');
};
const painting = (id: string, name: string): void => {
  put(`characters/${id}/${name}.png`);
  put(`characters/${id}/${name.replace(/@\dx$/, '')}.json`);
};

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'pyrefly-maps-'));
});
afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

/** A tree the way the demo mirror is: Tidus with a base map and an @2x map for idle, a base map only for attack, a candidate's map, a map of a state that is not chosen; a backdrop with a depth map. */
function demoTree(): void {
  painting('tidus', 'idle');
  painting('tidus', 'idle@2x');
  painting('tidus', 'attack');
  painting('yuna', 'idle');
  put('characters/tidus/idle.normal.png');
  put('characters/tidus/idle@2x.normal.png');
  put('characters/tidus/attack.normal.png');
  put('characters/tidus/attack.1.normal.png'); // a numbered candidate's map: never listed
  put('characters/tidus/ko.normal.png'); // a state nobody painted: never listed
  put('characters/tidus/idle.depth.png'); // a figure's depth map: the game does not read it, the manifest does not list it
  put('backdrops/gagazet.png');
  put('backdrops/gagazet.json');
  put('backdrops/gagazet.depth.png');
  put('backdrops/gagazet@2x.depth.png');
  put('backdrops/gagazet.normal.png');
  put('backdrops/nowhere.depth.png'); // a depth map with no painting beside it
}

describe('the manifest builder lists the lighting maps', () => {
  it('lists a chosen state\'s base and @2x normal maps and a backdrop\'s depth map, and nothing else', () => {
    demoTree();
    const { manifest, variantsOnly } = buildManifest(root, { now: 'T' });
    expect(manifest.lightMaps).toEqual({ normal: { tidus: { attack: [1], idle: [1, 2] } }, depth: ['gagazet'] });
    expect(variantsOnly).toEqual([]);
    // the maps change nothing else the manifest says
    expect(manifest.subjects.tidus!.states).toEqual(['attack', 'idle']);
    expect(manifest.subjects.tidus!.tiers).toEqual({ idle: [2] });
    expect(manifest.backdrops).toEqual(['gagazet']);
    expect(manifest.backdropTiers).toBeUndefined();
  });

  it('writes no lightMaps key for a tree that holds no map, so it writes the manifest it always wrote', () => {
    painting('tidus', 'idle');
    put('backdrops/gagazet.png');
    put('backdrops/gagazet.json');
    const { manifest } = buildManifest(root, { now: 'T' });
    expect('lightMaps' in manifest).toBe(false);
  });
});

describe('the runtime reads lightMaps', () => {
  const manifest = (lightMaps?: unknown) => parseArtManifest({ version: 1, subjects: {}, ...(lightMaps === undefined ? {} : { lightMaps }) });

  it('parses the lists and drops what is not one', () => {
    expect(parseLightMaps({ normal: { tidus: { idle: [2, 1, 1, 9, 'x'], bad: [], worse: 'x' }, empty: {}, junk: 3 }, depth: ['gagazet', 7] })).toEqual({ normal: { tidus: { idle: [1, 2] } }, depth: ['gagazet'] });
    expect(parseLightMaps(undefined)).toBeNull();
    expect(parseLightMaps([])).toBeNull();
    expect(parseLightMaps({})).toEqual({ normal: {}, depth: [] });
  });

  it('is carried by the parsed manifest, and a manifest without it reads as it did', () => {
    expect(manifest({ normal: { tidus: { idle: [1] } }, depth: ['gagazet'] })!.lightMaps).toEqual({ normal: { tidus: { idle: [1] } }, depth: ['gagazet'] });
    expect('lightMaps' in manifest()!).toBe(false);
    expect('lightMaps' in manifest('garbage')!).toBe(false);
  });

  it('has no opinion without lightMaps: ask for the scale the painting wants, as before', () => {
    expect(normalMapScaleFor(null, '/art/characters/tidus/idle.png', 2)).toBeUndefined();
    expect(normalMapScaleFor(manifest(), '/art/characters/tidus/idle.png', 1)).toBeUndefined();
    expect(depthMapListed(null, 'gagazet')).toBeNull();
    expect(depthMapListed(manifest(), 'gagazet')).toBeNull();
  });

  it('asks for nothing a build does not ship', () => {
    const m = manifest({ normal: { tidus: { idle: [1] } }, depth: ['gagazet'] });
    expect(normalMapScaleFor(m, '/art/characters/tidus/idle.png', 1)).toBe(1);
    expect(normalMapScaleFor(m, '/art/characters/tidus/attack.png', 1)).toBeNull(); // a state with no map
    expect(normalMapScaleFor(m, '/art/characters/yuna-gunner/idle.png', 1)).toBeNull(); // a figure with none (the gunner dresssphere)
    expect(normalMapScaleFor(m, '/art/backdrops/gagazet.png', 1)).toBeNull(); // not a figure
    expect(depthMapListed(m, 'gagazet')).toBe(true);
    expect(depthMapListed(m, 'farplane')).toBe(false);
  });

  it('serves a 2x or larger master from the largest map listed that it wants, else the smallest listed', () => {
    const base = manifest({ normal: { tidus: { idle: [1] } }, depth: [] });
    expect(normalMapScaleFor(base, '/art/characters/tidus/idle.png', 2)).toBe(1); // the demo build: the base map for a 2x master
    expect(normalMapScaleFor(base, '/art/characters/tidus/idle@2x.png', 4)).toBe(1);
    const both = manifest({ normal: { tidus: { idle: [1, 2] } }, depth: [] });
    expect(normalMapScaleFor(both, '/art/characters/tidus/idle.png', 1)).toBe(1);
    expect(normalMapScaleFor(both, '/art/characters/tidus/idle.png', 2)).toBe(2);
    expect(normalMapScaleFor(both, '/art/characters/tidus/idle@2x.png', 3)).toBe(2);
    const big = manifest({ normal: { tidus: { idle: [2] } }, depth: [] });
    expect(normalMapScaleFor(big, '/art/characters/tidus/idle.png', 1)).toBe(2); // a bigger map beats none
  });

  it('reads the painting in any form the game holds it in: a base path, a shipped webp, the percent-encoded @', () => {
    const m = manifest({ normal: { tidus: { 'idle-far': [1] } }, depth: [] });
    expect(normalMapScaleFor(m, '/pyrefly-reprise/art/characters/tidus/idle-far.png', 1)).toBe(1);
    expect(normalMapScaleFor(m, '/pyrefly-reprise/art/characters/tidus/idle-far%402x.png?v=1', 2)).toBe(1);
  });
});
