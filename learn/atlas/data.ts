/**
 * Site A ("Pyrefly Atlas") data layer's public entry point.
 *
 * `buildChapterSpecimen` turns one of the five chapters into a `Specimen`
 * (`learn/shared/model.ts`) built entirely from the shipped game data —
 * `src/data/encounters.ts`, the chapter's own `EnemyGroupDef` chain and
 * `AbilityDef` registry (`src/data/ffx/**`/`src/data/ffx2/**`), and its
 * `ChapterGuide` (`src/data/guides/*.ts`) — never a typed-in fact or count
 * (`docs/plans/learning-sites.md`, AGENTS.md hard rule 6).
 *
 * Seven systems, always in this order: parts-and-forms, abilities,
 * statuses-inflicted, immunities, affinities, turn-patterns, rewards.
 * Chapter 5 (`ffx2-vegnagun-shuyin`) is the complete reference chapter (all
 * five battles, ported stage positions for its five painted parts); the
 * other four build through the exact same code — `parts.ts` generically
 * walks whatever `EnemyGroupDef` chain the chapter has (one battle, several
 * forms of one battle, or several chained battles) and `systems-*.ts`
 * generically catalogues whatever the resulting combatants declare.
 */

import type { ChapterId } from '../../src/data/encounters.ts';
import { CHAPTER_IDS } from '../../src/data/encounters.ts';
import { guideForChapter } from '../../src/data/guides/index.ts';
import type { Specimen, SystemInput } from '../shared/model.ts';
import { defineSpecimen, withCounts } from '../shared/model.ts';
import { requireChapter } from './chain.ts';
import { countNoun } from './format.ts';
import { buildPartsSystem } from './parts.ts';
import { buildAbilitiesAndStatuses } from './systems-abilities.ts';
import { buildCatalogSystems } from './systems-catalog.ts';

const SYSTEMS_INPUT: readonly SystemInput[] = [
  { id: 'parts-and-forms', name: 'Parts and forms', colour: '#7a4b8f' },
  { id: 'abilities', name: 'Abilities', colour: '#b8437e' },
  { id: 'statuses-inflicted', name: 'Statuses it inflicts', colour: '#c96a2e' },
  { id: 'immunities', name: 'Immunities', colour: '#3f7f6c' },
  { id: 'affinities', name: 'Elemental affinities', colour: '#3d6fa8' },
  { id: 'turn-patterns', name: 'Turn pattern (AI)', colour: '#8a7a3d' },
  { id: 'rewards', name: 'Rewards', colour: '#8a8a8a' },
];

/** Builds one chapter's `Specimen`, from the real data, with every count computed rather than typed. */
export function buildChapterSpecimen(chapterId: ChapterId): Specimen {
  const chapter = requireChapter(chapterId);
  const guide = guideForChapter(chapterId);

  const parts = buildPartsSystem(chapter, guide);
  const { abilityPieces, statusPieces } = buildAbilitiesAndStatuses(
    chapter,
    guide,
    parts.combatants,
    parts.placementByCombatantId,
  );
  const { immunityPieces, affinityPieces, turnPatternPieces, rewardPieces } = buildCatalogSystems(
    chapter,
    guide,
    parts.combatants,
    parts.placementByCombatantId,
  );

  const pieces = [
    ...parts.pieces,
    ...abilityPieces,
    ...statusPieces,
    ...immunityPieces,
    ...affinityPieces,
    ...turnPatternPieces,
    ...rewardPieces,
  ];

  const gameLabel = chapter.game === 'ffx' ? 'FFX' : 'FFX-2';

  return defineSpecimen({
    id: chapter.id,
    title: chapter.title,
    eyebrow: `Chapter ${chapter.number} · ${gameLabel}`,
    factsLine: `${countNoun(pieces.length, 'piece')} · ${countNoun(parts.chain.length, 'battle')} · ${chapter.subtitle}`,
    game: chapter.game,
    systems: withCounts(SYSTEMS_INPUT, pieces),
    pieces,
  });
}

/** Every chapter's `Specimen`, keyed by id — a convenience for callers (and tests) that want all five. */
export function buildAllChapterSpecimens(): Record<ChapterId, Specimen> {
  const entries = CHAPTER_IDS.map((id) => [id, buildChapterSpecimen(id)] as const);
  return Object.fromEntries(entries) as Record<ChapterId, Specimen>;
}
