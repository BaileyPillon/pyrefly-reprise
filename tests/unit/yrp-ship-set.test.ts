/**
 * **What a production build ships of the hidden 3D Bahamut's models** (ch-yrp, 2026-11-02; FFX-2 only; `tools/dist-filter.mjs`, `src/data/yrp-ids.ts`). The models are local files, gitignored like the paintings (`public/models-exp/`);
 * until the chapter was folded into the release line the filter dropped the whole folder, so a build had no models. Now it ships a set that fits the host and the chapter's reach. What it pins:
 *
 * 1. **The rule**: the base figures, clips, weapons and clip map, the game's Bahamut in HD and the shipped dresspheres ship; the AI boss, the HD figures of the girls, every HD dressphere and every dressphere no grid reaches do not.
 * 2. **The list is the grids**: the shipped dress folders are exactly the dresspheres on the three Garment Grids of Chapter IV's build (the ones `gridNodeContents` lays out), so a changed grid fails here, not in the live chapter.
 * 3. **The shipped manifest**: `dress/index.json` is rewritten to list only the shipped folders with `hd` off, the starters survive, and the page's own parser accepts it.
 * 4. **A pruned tree** keeps exactly the set, leaves no empty folder and never touches the source it was copied from.
 * (The verifier and the real files are in `yrp-models-verify.test.ts`.)
 *
 * Game case: FFX-2 only (the models are the game's own Yuna, Rikku, Paine and Bahamut); the filter is shared delivery plumbing.
 */
import { existsSync, lstatSync, mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative, sep } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import { adjacentNodes, defaultGarmentGrids } from '../../src/battle/ffx2/garment-grids.ts';
import { gridNodeContents } from '../../src/battle/ffx2/setup.ts';
import { bevelleBuild } from '../../src/data/ffx2/builds/bevelle.ts';
import { YRP_SHIPPED_BASE_FILES, YRP_SHIPPED_DRESS_FOLDERS, YRP_SHIPPED_HD_FILES } from '../../src/data/yrp-ids.ts';
import { parseDressIndex } from '../../src/engine/yrp3d/dress.ts';
import { reachFor } from '../../src/engine/yrp3d/dressReach.ts';
import { findUnshipped, isShippedModelFile, isUnshippedPublicFile, pruneUnshipped, shippedDressIndex, trimDressIndex } from '../../tools/dist-filter.mjs';
import { BASE, GIRLS, HD, fullManifest, lay } from './helpers/yrpShip.ts';

let tmp: string | null = null;
afterEach(() => {
  if (tmp) rmSync(tmp, { recursive: true, force: true });
  tmp = null;
});

/** Every dress folder the three girls' Garment Grids hold in Chapter IV's build: `<girl>-<dressphere>`. */
function gridFolders(): string[] {
  const out: string[] = [];
  for (const m of bevelleBuild.members) {
    const grid = defaultGarmentGrids.get(m.garmentGrid.id)!;
    for (const dress of gridNodeContents(m, grid.nodes)) if (typeof dress === 'string') out.push(`${m.id}-${dress}`);
  }
  return out;
}

describe('the rule', () => {
  it('ships the base figures, clips, weapons, clip map, the game\'s Bahamut in HD and the shipped dresspheres', () => {
    const shipped = [
      ...YRP_SHIPPED_BASE_FILES.map((f) => `models-exp/yrp/${f}`),
      ...YRP_SHIPPED_HD_FILES.map((f) => `models-exp/yrp-hd/${f}`),
      'models-exp/yrp/dress/index.json',
      'models-exp/yrp/dress/yuna-white-mage/anims.glb',
      'models-exp/yrp/dress/yuna-white-mage/clipmap.json',
      'models-exp/yrp/dress/rikku-dark-knight/anims.glb',
      'models-exp/yrp/dress/paine-warrior/clipmap.json',
      'models-exp\\yrp\\dress\\paine-black-mage\\anims.glb', // either slash
    ];
    for (const p of shipped) expect(isUnshippedPublicFile(p), p).toBe(false);
    for (const p of shipped.filter((f) => !f.includes('\\'))) expect(isShippedModelFile(p), p).toBe(true);
  });

  it('never ships the AI boss, the HD figures of the girls, an HD dressphere, a dressphere no grid reaches or anything else under models-exp', () => {
    for (const p of [
      'models-exp/yrp/bahamut-ai.glb',
      'models-exp/yrp/bahamut-ai-rigged.glb',
      'models-exp/yrp/bahamut-ai-anims.glb',
      'models-exp/yrp-hd/yuna.glb',
      'models-exp/yrp-hd/rikku.glb',
      'models-exp/yrp-hd/paine.glb',
      'models-exp/yrp/dress/yuna-gunner/hd/anims.glb',
      'models-exp/yrp/dress/paine-warrior/hd/anims.glb',
      'models-exp/yrp/dress/yuna-samurai/anims.glb', // not on any of Chapter IV's grids
      'models-exp/yrp/dress/yuna-floral-fallal/anims.glb',
      'models-exp/yrp/dress/rikku-machina-maw/clipmap.json',
      'models-exp/yrp/dress/yuna-gunner/anims.glb.bak', // nothing but the two named files of a shipped folder
      'models-exp/yrp/dress/yuna-gunner/extra/anims.glb',
      'models-exp/yrp/scratch.glb',
      'models-exp/yrp/yrp-weapons/actors/yuna.glb',
      'models-exp/other/yuna.glb',
      'models-exp/yrp-hd/dress/yuna-gunner/anims.glb',
    ]) {
      expect(isUnshippedPublicFile(p), p).toBe(true);
      expect(isShippedModelFile(p), p).toBe(false);
    }
  });

  it('leaves the other chapters\' files alone: the rule reads models-exp and nothing else', () => {
    for (const p of ['art/characters/yuna/idle.png', 'audio/manifest.json', 'index.html', 'models/yuna.glb', 'assets/index-x.js']) expect(isUnshippedPublicFile(p), p).toBe(false);
  });
});

describe('the list is the grids', () => {
  it('names exactly the dresspheres on the three Garment Grids of Chapter IV\'s build (14 folders: Yuna 5, Rikku 5, Paine 4)', () => {
    const grids = gridFolders();
    expect([...YRP_SHIPPED_DRESS_FOLDERS].sort()).toEqual([...new Set(grids)].sort());
    expect(YRP_SHIPPED_DRESS_FOLDERS).toHaveLength(14);
    for (const girl of GIRLS) expect(YRP_SHIPPED_DRESS_FOLDERS.filter((f) => f.startsWith(`${girl}-`)).length).toBe(grids.filter((f) => f.startsWith(`${girl}-`)).length);
  });

  it('holds every dressphere a spherechange can reach: from any dressphere on a girl\'s grid, every neighbour (what the Change menu offers) is in the list', () => {
    const reach = reachFor(bevelleBuild.members);
    for (const m of bevelleBuild.members) {
      const grid = defaultGarmentGrids.get(m.garmentGrid.id)!;
      const contents = gridNodeContents(m, grid.nodes);
      for (const [at, current] of contents.entries()) {
        if (typeof current !== 'string') continue;
        expect(YRP_SHIPPED_DRESS_FOLDERS as readonly string[], `${m.id} wears ${current}`).toContain(`${m.id}-${current}`);
        expect(adjacentNodes(grid, at).length, `${m.id} on ${current}`).toBeGreaterThan(0);
        for (const next of reach(m.id as 'yuna' | 'rikku' | 'paine', current)) expect(YRP_SHIPPED_DRESS_FOLDERS as readonly string[], `${m.id}: ${current} to ${next}`).toContain(`${m.id}-${next}`);
      }
    }
  });

  it('includes each girl\'s starter (Yuna White Mage, Rikku Dark Knight, Paine Warrior: Chapter IV\'s build)', () => {
    expect(bevelleBuild.members.map((m) => `${m.id}-${m.currentDressphere}`)).toEqual(['yuna-white-mage', 'rikku-dark-knight', 'paine-warrior']);
    for (const f of ['yuna-white-mage', 'rikku-dark-knight', 'paine-warrior']) expect(YRP_SHIPPED_DRESS_FOLDERS as readonly string[]).toContain(f);
  });
});


describe('the shipped manifest', () => {
  it('lists only the shipped folders, with hd off, and keeps the rest of the file', () => {
    const full = fullManifest();
    const shipped = shippedDressIndex(full)!;
    expect(shipped.entries.map((e) => e['folder']).sort()).toEqual([...YRP_SHIPPED_DRESS_FOLDERS].sort());
    expect(shipped.entries.every((e) => e['hd'] === false)).toBe(true);
    expect(shipped).toMatchObject({ version: 1, game: 'FFX-2 only', starts: full.starts });
    expect(full.entries.some((e) => e['hd'] === true)).toBe(true); // the source is untouched
    expect(full.entries).toHaveLength(42);
  });

  it('is read by the page\'s own parser: every shipped dressphere is there, no HD file is asked for, and the starters are Chapter IV\'s', () => {
    const index = parseDressIndex(shippedDressIndex(fullManifest()))!;
    expect(index).not.toBeNull();
    expect(index.starts).toEqual({ yuna: 'white-mage', rikku: 'dark-knight', paine: 'warrior' });
    expect(index.entries).toHaveLength(14);
    for (const e of index.entries) expect(e.hd, e.folder).toBe(false);
    for (const m of bevelleBuild.members) for (const dress of gridNodeContents(m, defaultGarmentGrids.get(m.garmentGrid.id)!.nodes)) if (typeof dress === 'string') expect(index.has(m.id as 'yuna', dress), `${m.id} ${dress}`).toBe(true);
    expect(index.has('yuna', 'samurai')).toBe(false);
  });

  it('is null for anything that is not a manifest, which leaves a file as it is', () => {
    for (const bad of [null, undefined, 3, 'x', [], {}, { entries: 'no' }]) expect(shippedDressIndex(bad), String(bad)).toBeNull();
  });
});

/** Every file under `root`, relative with forward slashes, sorted. */
function listAll(root: string): string[] {
  const out: string[] = [];
  const walk = (dir: string): void => {
    for (const name of readdirSync(dir)) {
      const full = join(dir, name);
      if (lstatSync(full).isDirectory()) walk(full);
      else out.push(relative(root, full).split(sep).join('/'));
    }
  };
  walk(root);
  return out.sort();
}

/** Every folder under `root`. */
function listDirs(root: string): string[] {
  const out: string[] = [];
  const walk = (dir: string): void => {
    for (const name of readdirSync(dir)) {
      const full = join(dir, name);
      if (lstatSync(full).isDirectory()) {
        out.push(relative(root, full).split(sep).join('/'));
        walk(full);
      }
    }
  };
  walk(root);
  return out.sort();
}

describe('a pruned tree', () => {
  /** A tree as vite copies `public/`: the whole models folder (here with stand-in bytes) beside the game's other files. */
  function copiedTree(): string {
    tmp = mkdtempSync(join(tmpdir(), 'pyrefly-yrp-ship-'));
    const files: Record<string, string> = { 'index.html': '<html>', 'audio/manifest.json': '{}', 'art/portraits/lulu.png': 'x' };
    for (const f of [...YRP_SHIPPED_BASE_FILES]) files[`${BASE}/${f}`] = 'm';
    for (const f of ['bahamut-ai.glb', 'bahamut-ai-rigged.glb', 'bahamut-ai-anims.glb']) files[`${BASE}/${f}`] = 'ai';
    for (const f of ['yuna.glb', 'rikku.glb', 'paine.glb', 'bahamut.glb', 'clipmap.json']) files[`${HD}/${f}`] = 'hd';
    const manifest = fullManifest();
    for (const e of manifest.entries) {
      files[`${BASE}/dress/${e['folder'] as string}/anims.glb`] = 'd';
      files[`${BASE}/dress/${e['folder'] as string}/clipmap.json`] = '{}';
      if (e['hd'] === true) files[`${BASE}/dress/${e['folder'] as string}/hd/anims.glb`] = 'dhd';
    }
    files[`${BASE}/dress/index.json`] = JSON.stringify(manifest);
    lay(tmp, files);
    return tmp;
  }

  it('keeps exactly the set: 12 base files, the HD Bahamut and clip map, the manifest and 14 dresspheres\' two files each', () => {
    const root = copiedTree();
    const removed = pruneUnshipped(root);
    const expected = [
      'index.html', 'audio/manifest.json', 'art/portraits/lulu.png',
      ...YRP_SHIPPED_BASE_FILES.map((f) => `${BASE}/${f}`),
      ...YRP_SHIPPED_HD_FILES.map((f) => `${HD}/${f}`),
      `${BASE}/dress/index.json`,
      ...YRP_SHIPPED_DRESS_FOLDERS.flatMap((d) => [`${BASE}/dress/${d}/anims.glb`, `${BASE}/dress/${d}/clipmap.json`]),
    ].sort();
    expect(listAll(root)).toEqual(expected);
    expect(findUnshipped(root)).toEqual([]);
    expect(removed.every((r) => r.startsWith('models-exp/'))).toBe(true);
    expect(removed).toContain(`${BASE}/bahamut-ai.glb`);
    expect(removed).toContain(`${HD}/yuna.glb`);
    expect(removed).toContain(`${BASE}/dress/yuna-gunner/hd/anims.glb`);
  });

  it('leaves no empty folder behind (the HD subfolders of the dresspheres, the dresspheres no grid reaches)', () => {
    const root = copiedTree();
    pruneUnshipped(root);
    for (const dir of listDirs(root)) expect(readdirSync(join(root, dir)).length, dir).toBeGreaterThan(0);
    expect(existsSync(join(root, BASE, 'dress', 'yuna-samurai'))).toBe(false);
    expect(existsSync(join(root, BASE, 'dress', 'yuna-gunner', 'hd'))).toBe(false);
    expect(existsSync(join(root, BASE, 'dress', 'yuna-gunner', 'anims.glb'))).toBe(true);
  });

  it('rewrites the copy\'s manifest to the shipped folders with hd off, and a second prune changes nothing', () => {
    const root = copiedTree();
    pruneUnshipped(root);
    const first = readFileSync(join(root, BASE, 'dress', 'index.json'), 'utf8');
    const index = parseDressIndex(JSON.parse(first))!;
    expect(index.entries.map((e) => e.folder).sort()).toEqual([...YRP_SHIPPED_DRESS_FOLDERS].sort());
    expect(index.entries.every((e) => !e.hd)).toBe(true);
    expect(pruneUnshipped(root)).toEqual([]);
    expect(readFileSync(join(root, BASE, 'dress', 'index.json'), 'utf8')).toBe(first);
    expect(trimDressIndex(root)).toBe(true);
  });

  it('is a no-op for a tree with no models (every other chapter\'s build) and for a manifest that is not JSON', () => {
    tmp = mkdtempSync(join(tmpdir(), 'pyrefly-yrp-ship-'));
    lay(tmp, { 'index.html': '<html>' });
    expect(pruneUnshipped(tmp)).toEqual([]);
    expect(trimDressIndex(tmp)).toBe(false);
    lay(tmp, { [`${BASE}/dress/index.json`]: '<html>not json' });
    expect(trimDressIndex(tmp)).toBe(false);
    expect(readFileSync(join(tmp, BASE, 'dress', 'index.json'), 'utf8')).toBe('<html>not json');
  });
});

