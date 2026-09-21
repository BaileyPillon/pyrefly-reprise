import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import type { ArtManifest } from '../../learn/exploded/assets.ts';
import { buildAssetPieces } from '../../learn/exploded/assets.ts';
import { layerBurst, layerHome, STAGE_BOX, tileBurst, tileHome } from '../../learn/exploded/arrange.ts';
import { LAYERS, LAYER_SYSTEMS } from '../../learn/exploded/layers.ts';
import { buildFrameSpecimen } from '../../learn/exploded/specimen.ts';
import type { Piece, Specimen } from '../../learn/shared/model.ts';

/**
 * Real ids where the point is to exercise `roleForSubject`
 * (`learn/exploded/roles.ts`) against the game's own committed data — using a
 * placeholder name there would defeat the test, not violate AGENTS.md hard
 * rule 6 (that rule is about inventing game facts, not about referencing a
 * real id already defined elsewhere in this codebase). `tidus` is party-only,
 * `yunalesca-1` is enemy-only, `valefor` is named by both sides (an FFX aeon
 * Yu Yevon later possesses), and `not-a-real-subject` is a placeholder no
 * record names at all.
 */
const FIXTURE: ArtManifest = {
  version: 1,
  generatedAt: '2020-01-01T00:00:00.000Z',
  subjects: {
    tidus: { states: ['idle', 'attack'], portrait: true, facing: 'right' },
    'yunalesca-1': { states: ['idle', 'attack', 'hurt'], portrait: false, facing: 'left' },
    valefor: { states: ['idle'], portrait: true, facing: 'left' },
    'not-a-real-subject': { states: ['idle'], portrait: false },
  },
  portraits: ['tidus'],
  backdrops: ['fixture-place'],
  pause: ['fixture-plate', 'fixture-plate-2x'],
  pause2x: ['fixture-plate-2x'],
};

const ASSET_PREFIXES = [
  'asset-subject-',
  'asset-backdrop-',
  'asset-portrait-',
  'asset-pause-',
  'asset-hud-',
  'asset-audio-',
] as const;

function idsWithPrefix(pieces: readonly Piece[], prefix: string): Piece[] {
  return pieces.filter((piece) => piece.id.startsWith(prefix));
}

function collectStrings(value: unknown, out: string[]): void {
  if (typeof value === 'string') {
    out.push(value);
  } else if (Array.isArray(value)) {
    for (const item of value) collectStrings(item, out);
  } else if (value && typeof value === 'object') {
    for (const item of Object.values(value)) collectStrings(item, out);
  }
}

describe('buildAssetPieces', () => {
  const pieces = buildAssetPieces(FIXTURE);

  it('makes one tile per subject, backdrop, portrait and pause plate', () => {
    expect(idsWithPrefix(pieces, 'asset-subject-')).toHaveLength(Object.keys(FIXTURE.subjects).length);
    expect(idsWithPrefix(pieces, 'asset-backdrop-')).toHaveLength(FIXTURE.backdrops.length);
    expect(idsWithPrefix(pieces, 'asset-portrait-')).toHaveLength(FIXTURE.portraits.length);
    expect(idsWithPrefix(pieces, 'asset-pause-')).toHaveLength(FIXTURE.pause.length);
  });

  it('adds typographic tiles for the HUD parts and the audio cue families', () => {
    expect(idsWithPrefix(pieces, 'asset-hud-').length).toBeGreaterThan(0);
    expect(idsWithPrefix(pieces, 'asset-audio-').length).toBeGreaterThan(0);
  });

  it('every produced piece belongs to one of the nine declared systems', () => {
    const declared = new Set(LAYER_SYSTEMS.map((system) => system.id));
    for (const piece of pieces) {
      expect(declared.has(piece.systemId)).toBe(true);
    }
  });

  it('every piece has a non-empty cite', () => {
    for (const piece of pieces) {
      expect(piece.card.cite.trim().length).toBeGreaterThan(0);
    }
  });

  it('buckets a subject by which side names it (learn/exploded/roles.ts), never by facing', () => {
    const byId = new Map(pieces.map((piece) => [piece.id, piece]));
    expect(byId.get('asset-subject-tidus')?.systemId).toBe('party-billboards'); // party-only
    expect(byId.get('asset-subject-yunalesca-1')?.systemId).toBe('boss-billboard'); // enemy-only
    expect(byId.get('asset-subject-valefor')?.systemId).toBe('party-billboards'); // both -> party
    expect(byId.get('asset-subject-not-a-real-subject')?.systemId).toBe('boss-billboard'); // unnamed -> the neutral fallback bucket
  });

  it('gives a both-sides subject its "Also appears as" fact, sourced from the chapter that fields it as an enemy', () => {
    const valefor = pieces.find((piece) => piece.id === 'asset-subject-valefor');
    const fact = valefor?.card.facts.find((f) => f.label === 'Also appears as');
    expect(fact?.value).toBe("an enemy in Braska's Final Aeon");
  });

  it('counts are computed from the manifest, never typed', () => {
    const yunalesca = pieces.find((piece) => piece.id === 'asset-subject-yunalesca-1');
    expect(yunalesca?.card.facts.find((fact) => fact.label === 'Painted poses')?.value).toBe('3');
  });
});

describe('buildFrameSpecimen', () => {
  const specimen: Specimen = buildFrameSpecimen(FIXTURE);

  it('is FFX only (AGENTS.md hard rule 14: this specimen is chapter 2, FFX)', () => {
    expect(specimen.game).toBe('ffx');
  });

  it('declares exactly the nine components, in order, and every system count is computed', () => {
    expect(specimen.systems).toHaveLength(9);
    expect(specimen.systems.map((system) => system.id)).toEqual(LAYERS.map((layer) => layer.id));
    const total = specimen.systems.reduce((sum, system) => sum + system.count, 0);
    expect(total).toBe(specimen.pieces.length);
  });

  it('has one hero piece per layer plus the whole asset inventory', () => {
    const heroPieces = specimen.pieces.filter((piece) => piece.id.startsWith('layer-'));
    expect(heroPieces).toHaveLength(LAYERS.length);

    const assetCount = ASSET_PREFIXES.reduce(
      (sum, prefix) => sum + idsWithPrefix(specimen.pieces, prefix).length,
      0,
    );
    expect(heroPieces.length + assetCount).toBe(specimen.pieces.length);
  });

  it('every piece has a non-empty cite', () => {
    for (const piece of specimen.pieces) {
      expect(piece.card.cite.trim().length).toBeGreaterThan(0);
    }
  });

  it('never names the owner, anywhere in learn/exploded’s data', () => {
    const strings: string[] = [];
    collectStrings(specimen, strings);
    collectStrings(LAYERS, strings);
    for (const value of strings) {
      expect(value).not.toMatch(/Bailey/i);
    }
  });
});

describe('arrange', () => {
  const onScreenIds = LAYERS.filter((layer) => layer.onScreen).map((layer) => layer.id);
  const nonVisualIds = LAYERS.filter((layer) => !layer.onScreen).map((layer) => layer.id);

  it('puts every on-screen layer at z 0 when assembled (explode 0)', () => {
    for (const id of onScreenIds) {
      expect(layerHome(id)).toEqual({ x: 0, y: 0, z: 0 });
    }
  });

  it('spreads the on-screen layers from -240 to 240 in depth order when exploded', () => {
    const zs = onScreenIds.map((id) => layerBurst(id).z);
    expect(zs[0]).toBe(-240);
    expect(zs[zs.length - 1]).toBe(240);
    for (let i = 1; i < zs.length; i += 1) {
      expect(zs[i]).toBeGreaterThan(zs[i - 1] as number);
    }
  });

  it('never moves a non-visual rail between home and burst, and keeps it beneath the stage box', () => {
    for (const id of nonVisualIds) {
      expect(layerHome(id)).toEqual(layerBurst(id));
      expect(layerHome(id).y).toBeGreaterThan(STAGE_BOX.height / 2);
    }
  });

  it('sits an asset tile at its layer’s home, fanned out only at burst', () => {
    expect(tileHome('backdrop-painting')).toEqual(layerHome('backdrop-painting'));
    const a = tileBurst('backdrop-painting', 'asset-backdrop-a');
    const b = tileBurst('backdrop-painting', 'asset-backdrop-b');
    expect(a).not.toEqual(b);
    // Both still belong to the same layer's depth.
    expect(a.z).toBe(layerBurst('backdrop-painting').z);
    expect(b.z).toBe(layerBurst('backdrop-painting').z);
  });

  it('is deterministic: the same tile id always lands at the same burst position', () => {
    expect(tileBurst('boss-billboard', 'asset-subject-x')).toEqual(tileBurst('boss-billboard', 'asset-subject-x'));
  });
});

describe('against the real art manifest, when this checkout has one', () => {
  const manifestPath = path.resolve(__dirname, '../../public/art/manifest.json');
  const hasRealManifest = existsSync(manifestPath);

  it.skipIf(!hasRealManifest)('tile counts match the real manifest’s own key counts', async () => {
    const raw = JSON.parse(await readFile(manifestPath, 'utf8')) as ArtManifest;
    const pieces = buildAssetPieces(raw);

    expect(idsWithPrefix(pieces, 'asset-subject-')).toHaveLength(Object.keys(raw.subjects).length);
    expect(idsWithPrefix(pieces, 'asset-backdrop-')).toHaveLength(raw.backdrops.length);
    expect(idsWithPrefix(pieces, 'asset-portrait-')).toHaveLength(raw.portraits.length);
    expect(idsWithPrefix(pieces, 'asset-pause-')).toHaveLength(raw.pause.length);
  });

  it.skipIf(!hasRealManifest)('buckets real party and enemy subjects correctly, never by facing', async () => {
    const raw = JSON.parse(await readFile(manifestPath, 'utf8')) as ArtManifest;
    const pieces = buildAssetPieces(raw);
    const systemIdOf = (id: string): string | undefined =>
      pieces.find((piece) => piece.id === `asset-subject-${id}`)?.systemId;

    expect(systemIdOf('tidus')).toBe('party-billboards');
    expect(systemIdOf('yuna-gunner')).toBe('party-billboards');
    expect(systemIdOf('valefor')).toBe('party-billboards');

    expect(systemIdOf('seymour-flux')).toBe('boss-billboard');
    expect(systemIdOf('vegnagun-head')).toBe('boss-billboard');
    expect(systemIdOf('yunalesca-1')).toBe('boss-billboard');
  });
});
