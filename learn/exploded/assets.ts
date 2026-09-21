/**
 * Site C's asset inventory: one tile per painted subject, backdrop, portrait
 * and pause plate, plus typographic tiles for the HUD parts and the audio cue
 * families (`docs/plans/learning-sites.md` "C · exploded/").
 *
 * `public/art/` is gitignored (AGENTS.md), so nothing here imports
 * `public/art/manifest.json` — `buildAssetPieces` takes the manifest as a
 * parameter, and the page fetches it at runtime. `ArtManifest` below mirrors
 * the real file's shape as read from `src/engine/ArtManifest.ts` (not
 * imported from there — `learn/` only imports `src/battle/**` and
 * `src/data/**`, per the plan).
 *
 * The HUD parts and audio cue families are typographic (no `art` path) and
 * come from committed sources with no manifest involved: the Ink & Gold spec
 * for the HUD parts, `docs/AUDIO-GUIDE.md`'s own SFX and music tables for the
 * cue families — not `public/audio/manifest.json`, which is a build artifact
 * of the render step rather than the source of what cues exist.
 *
 * Subject tiles split between the "Boss billboard" and "Party billboards"
 * systems by which side's own data names the painted subject — computed in
 * `./roles.ts` from the character/aeon catalogs, the dresspheres and the
 * enemy records, never by the manifest's own `facing` field. Facing is an
 * art-direction fact (docs/ART-PIPELINE.md § 2a: right = party/ally, left =
 * boss/enemy/aeon), not a battle-role claim — Anima and the other aeons
 * render `facing: left` in that convention despite fighting for the party,
 * which is exactly why role can't be read off it. The `Facing` fact stays on
 * the card below for that reason: informational, not the source of the
 * bucket.
 */

import type { Piece, PieceCard, PieceFact } from '../shared/model.ts';
import { tileBurst, tileHome } from './arrange.ts';
import { roleForSubject } from './roles.ts';

/** One subject's entry in `public/art/manifest.json`, mirroring `src/engine/ArtManifest.ts`. */
export interface ArtManifestSubject {
  readonly states: readonly string[];
  readonly portrait: boolean;
  readonly facing?: 'left' | 'right';
}

/** The whole of `public/art/manifest.json` (fetched at runtime — never imported here). */
export interface ArtManifest {
  readonly version: number;
  readonly generatedAt: string;
  readonly subjects: Readonly<Record<string, ArtManifestSubject>>;
  readonly portraits: readonly string[];
  readonly backdrops: readonly string[];
  readonly pause: readonly string[];
  readonly pause2x: readonly string[];
}

const GENERATED_LOCALLY = 'Generated locally · ComfyUI pipeline';

function baseCard(overrides: Partial<PieceCard> & Pick<PieceCard, 'body' | 'cite' | 'claimKind'>): PieceCard {
  return {
    eyebrow: 'Asset inventory',
    facts: [],
    tabs: [],
    ...overrides,
  };
}

/** One tile per `manifest.subjects` entry, bucketed by which side's own data names it (`./roles.ts`), never by facing. */
function subjectPieces(manifest: ArtManifest): Piece[] {
  return Object.entries(manifest.subjects).map(([id, subject]): Piece => {
    const poseCount = subject.states.length;
    const role = roleForSubject(id);
    // A subject named by the party side, or by both, reads as a party billboard. A pure
    // enemy, or a subject no record names at all, falls back to the boss/enemy bucket —
    // the same fallback the pipeline already used for a manifest entry with no declared
    // facing, kept here rather than inventing a third role.
    const systemId = role.side === 'party' || role.side === 'both' ? 'party-billboards' : 'boss-billboard';
    const representativeState = subject.states.includes('idle') ? 'idle' : subject.states[0];
    const pieceId = `asset-subject-${id}`;

    const facts: PieceFact[] = [
      { label: 'Painted poses', value: String(poseCount) },
      { label: 'Facing', value: subject.facing ?? 'undeclared' },
    ];
    if (role.side === 'both') facts.push(...role.facts);
    if (role.side === 'unnamed') facts.push({ label: 'Role', value: 'Not named by any party or enemy record' });

    return {
      id: pieceId,
      systemId,
      name: id,
      kind: 'tile',
      art: representativeState ? `characters/${id}/${representativeState}` : undefined,
      // No pixel dimensions in the manifest (unlike a generation-round thumbnail index) — pose
      // count is the only real, non-invented size proxy available at runtime.
      size: Math.max(1, poseCount),
      home: tileHome(systemId),
      burst: tileBurst(systemId, pieceId),
      card: baseCard({
        body:
          `A painted cutout with ${poseCount} pose${poseCount === 1 ? '' : 's'} ` +
          `(${subject.states.join(', ')}), stored under public/art/characters/${id}/.` +
          (subject.portrait ? ' A matching head-and-shoulders portrait also exists.' : ''),
        claimKind: 'Painted subject',
        cite: 'docs/ART-PIPELINE.md § 5. File conventions',
        facts,
        honesty: role.side === 'unnamed' ? `${GENERATED_LOCALLY} · unclassified — no game record names this subject` : GENERATED_LOCALLY,
      }),
    };
  });
}

/** One tile per backdrop — full-scene paintings, the same family as the pause plates. */
function backdropPieces(manifest: ArtManifest): Piece[] {
  return manifest.backdrops.map((id): Piece => {
    const pieceId = `asset-backdrop-${id}`;
    return {
      id: pieceId,
      systemId: 'backdrop-painting',
      name: id,
      kind: 'tile',
      art: `backdrops/${id}`,
      size: 2688,
      home: tileHome('backdrop-painting'),
      burst: tileBurst('backdrop-painting', pieceId),
      card: baseCard({
        body: `A wide matte painting for the ${id} location, at 2688 × 1536.`,
        claimKind: 'Backdrop painting',
        cite: 'docs/ART-PIPELINE.md § 3. Generating › Backdrops',
        facts: [{ label: 'Canvas', value: '2688 × 1536' }],
        honesty: GENERATED_LOCALLY,
      }),
    };
  });
}

/** One tile per portrait — the head-and-shoulders crops the HUD's CTB queue and dialogue use. */
function portraitPieces(manifest: ArtManifest): Piece[] {
  return manifest.portraits.map((id): Piece => {
    const pieceId = `asset-portrait-${id}`;
    return {
      id: pieceId,
      systemId: 'hud-ink-gold',
      name: id,
      kind: 'tile',
      art: `portraits/${id}`,
      size: 832,
      home: tileHome('hud-ink-gold'),
      burst: tileBurst('hud-ink-gold', pieceId),
      card: baseCard({
        body: `A head-and-shoulders crop for ${id}, used by dialogue, the CTB queue and menus.`,
        claimKind: 'Portrait',
        cite: 'docs/ARCHITECTURE.md § Painted art pipeline',
        facts: [{ label: 'Used for', value: 'CTB tiles, dialogue, menus' }],
        honesty: GENERATED_LOCALLY,
      }),
    };
  });
}

/** One tile per pause plate — full painted backgrounds, not cutouts, for the pause screen. */
function pausePieces(manifest: ArtManifest): Piece[] {
  const has2x = new Set(manifest.pause2x);
  return manifest.pause.map((id): Piece => {
    const pieceId = `asset-pause-${id}`;
    return {
      id: pieceId,
      systemId: 'backdrop-painting',
      name: id,
      kind: 'tile',
      art: `pause/${id}`,
      size: 1344,
      home: tileHome('backdrop-painting'),
      burst: tileBurst('backdrop-painting', pieceId),
      card: baseCard({
        body:
          'A full painted plate behind the pause screen, background included — not a cutout, and ' +
          'never run through rembg.',
        claimKind: 'Pause plate',
        cite: 'docs/handoff/hero-art.md § 1. What these are, and what they are not',
        facts: [
          {
            label: 'Canvas',
            value: has2x.has(id) ? '1344 × 768, plus a 2688 × 1536 retina plate' : '1344 × 768',
          },
        ],
        honesty: GENERATED_LOCALLY,
      }),
    };
  });
}

/** The Ink & Gold HUD's eight components (docs/handoff/presentation-ink-and-gold.md § Components). */
const HUD_PARTS: readonly { name: string; spec: string }[] = [
  { name: 'Slab', spec: 'skewX(-12deg) with counter-skewed content, drop shadow' },
  { name: 'Action banner', spec: 'ivory slab, 4px gold border-bottom, serif name' },
  { name: 'Command stack', spec: 'cascading rows, gold = selected, ink+gold = Overdrive' },
  { name: 'CTB queue', spec: 'portrait-crop tiles, gold glow on the current turn' },
  { name: 'Party status', spec: 'ink rows, gold border when acting, spira-sky MP' },
  { name: 'Target bracket', spec: 'four gold corners plus a hung name plate' },
  { name: 'Damage numeral', spec: 'serif italic numeral on a gold ink-splash' },
  { name: 'Surface', spec: '13% grain overlay plus a vignette, over everything' },
];

function hudPieces(): Piece[] {
  return HUD_PARTS.map(({ name, spec }): Piece => {
    const pieceId = `asset-hud-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
    return {
      id: pieceId,
      systemId: 'hud-ink-gold',
      name,
      kind: 'tile',
      size: 1,
      home: tileHome('hud-ink-gold'),
      burst: tileBurst('hud-ink-gold', pieceId),
      card: baseCard({
        body: `${name} — ${spec}.`,
        claimKind: 'HUD component',
        cite: 'docs/handoff/presentation-ink-and-gold.md § Components',
        facts: [{ label: 'Spec', value: spec }],
      }),
    };
  });
}

/**
 * The SFX bank's nine families and their cue counts, from `docs/AUDIO-GUIDE.md`
 * § "SFX bank" (each family's own catalog table; 134 cues total, matching that
 * section's own count) — not `public/audio/manifest.json`, a render artifact.
 */
const SFX_FAMILIES: readonly { name: string; file: string; count: number }[] = [
  { name: 'ui', file: 'ui.ts', count: 9 },
  { name: 'battle', file: 'battle.ts', count: 10 },
  { name: 'magic', file: 'magic.ts', count: 9 },
  { name: 'weapons', file: 'weapons.ts', count: 11 },
  { name: 'enemy', file: 'enemy.ts', count: 11 },
  { name: 'flow', file: 'flow.ts', count: 22 },
  { name: 'spells', file: 'spells.ts', count: 20 },
  { name: 'support', file: 'support.ts', count: 32 },
  { name: 'story', file: 'story.ts', count: 10 },
];

function audioPieces(): Piece[] {
  const sfx = SFX_FAMILIES.map(({ name, file, count }): Piece => {
    const pieceId = `asset-audio-sfx-${name}`;
    return {
      id: pieceId,
      systemId: 'music-sound',
      name: `${name} SFX`,
      kind: 'tile',
      size: count,
      home: tileHome('music-sound'),
      burst: tileBurst('music-sound', pieceId),
      card: baseCard({
        body: `${count} cues in src/audio/sfx/${file}.`,
        claimKind: 'SFX family',
        cite: 'docs/AUDIO-GUIDE.md § SFX bank',
        facts: [{ label: 'Cues', value: String(count) }],
      }),
    };
  });

  // Twenty-one cues: the twenty shipped MUSIC_KEYS plus the new `pause` cue
  // (docs/audio/THEMES.md § The cue map).
  const musicPieceId = 'asset-audio-music';
  const music: Piece = {
    id: musicPieceId,
    systemId: 'music-sound',
    name: 'Music cues',
    kind: 'tile',
    size: 21,
    home: tileHome('music-sound'),
    burst: tileBurst('music-sound', musicPieceId),
    card: baseCard({
      body: '21 composed cues — the twenty shipped MUSIC_KEYS plus the pause cue.',
      claimKind: 'Music cue list',
      cite: 'docs/audio/THEMES.md § The cue map',
      facts: [{ label: 'Cues', value: '21' }],
    }),
  };

  return [...sfx, music];
}

/** Every asset tile: subjects, backdrops, portraits, pause plates, HUD parts, audio cue families. */
export function buildAssetPieces(manifest: ArtManifest): Piece[] {
  return [
    ...subjectPieces(manifest),
    ...backdropPieces(manifest),
    ...portraitPieces(manifest),
    ...pausePieces(manifest),
    ...hudPieces(),
    ...audioPieces(),
  ];
}
