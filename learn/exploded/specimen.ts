/**
 * Site C's specimen: one finished battle frame — Chapter 2, Lady Yunalesca,
 * Zanarkand Dome, FFX (AGENTS.md hard rule 14: this specimen is FFX only) —
 * assembled from the layer architecture (`layers.ts`), the asset inventory
 * (`assets.ts`) and the stage placement (`arrange.ts`)
 * (`docs/plans/learning-sites.md` "C · exploded/").
 */

import type { ArtManifest } from './assets.ts';
import { buildAssetPieces } from './assets.ts';
import { layerBurst, layerHome } from './arrange.ts';
import { LAYERS, LAYER_SYSTEMS } from './layers.ts';
import type { LayerDef } from './layers.ts';
import type { Piece, PieceFact, Specimen } from '../shared/model.ts';
import { defineSpecimen, definePiece, withCounts } from '../shared/model.ts';

/**
 * The specific painted subjects a hero layer's "how it is made" tab names —
 * used only to look up their real pose count in the manifest, never to
 * assert it. A manifest without these ids (a test fixture's placeholder
 * names, or an older generator) simply gets fewer facts, never a guess.
 */
const HERO_SUBJECTS: Readonly<Record<string, readonly string[]>> = {
  'boss-billboard': ['yunalesca-1'],
  'party-billboards': ['tidus', 'yuna', 'auron'],
};

/** Painted-pose counts for a layer's named hero subjects, read from the manifest, never typed. */
function dynamicFactsFor(layer: LayerDef, manifest: ArtManifest): PieceFact[] {
  const subjectIds = HERO_SUBJECTS[layer.id];
  if (!subjectIds) return [];

  const facts: PieceFact[] = [];
  for (const id of subjectIds) {
    const subject = manifest.subjects[id];
    if (!subject) continue;
    facts.push({ label: `Painted poses · ${id}`, value: String(subject.states.length) });
  }
  return facts;
}

/** One layer's own "hero" piece — the specific instance of that component in this frame. */
function buildHeroPiece(layer: LayerDef, manifest: ArtManifest): Piece {
  return definePiece({
    id: `layer-${layer.id}`,
    systemId: layer.id,
    name: layer.name,
    kind: layer.kind,
    art: layer.art,
    size: layer.size,
    home: layerHome(layer.id),
    burst: layerBurst(layer.id),
    card: {
      eyebrow: layer.eyebrow,
      body: layer.body,
      claimKind: layer.claimKind,
      cite: layer.cite,
      tabs: layer.tabs,
      honesty: layer.honesty,
      facts: [...layer.staticFacts, ...dynamicFactsFor(layer, manifest)],
    },
  });
}

/**
 * Builds site C's one specimen: the nine layer pieces (this specific frame)
 * plus the full asset inventory (every painted subject, backdrop, portrait,
 * pause plate, HUD part and audio cue family), positioned on one stage.
 */
export function buildFrameSpecimen(manifest: ArtManifest): Specimen {
  const heroPieces = LAYERS.map((layer) => buildHeroPiece(layer, manifest));
  const assetPieces = buildAssetPieces(manifest).map((piece) => definePiece(piece));
  const pieces = [...heroPieces, ...assetPieces];
  const systems = withCounts(LAYER_SYSTEMS, pieces);

  return defineSpecimen({
    id: 'exploded-ch2-yunalesca',
    title: 'Lady Yunalesca, one frame taken apart',
    eyebrow: 'One finished battle frame',
    factsLine: `${LAYERS.length} components · ${pieces.length} pieces in the whole game`,
    game: 'ffx',
    systems,
    pieces,
  });
}
