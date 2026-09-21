/**
 * `learn/exploded/assets.ts`'s role lookup: whether a painted subject in
 * `public/art/manifest.json` belongs to the party side, the enemy side,
 * both, or neither — decided from the game's own committed data, never from
 * the manifest's own `facing` field. Facing is the rendering convention
 * (`docs/ART-PIPELINE.md § 2a`: right = party/ally, left = boss/enemy/aeon),
 * not a battle-role claim: Anima and the other aeons render `facing: left`
 * despite fighting for the party, which is exactly why role can't be read
 * off it.
 *
 * **PARTY-side** is named by: the FFX character/aeon catalogs
 * (`src/data/ffx/characters`, `src/data/ffx/aeons`) and every FFX party
 * build's own members/aeons; and, for FFX-2 — which has no species-level
 * catalog at all (`src/data/ffx2/ids.ts`'s own note: a girl's stats are a
 * function of dressphere x level only) — every real `CharacterId` painted in
 * every real `DresspheresId`. That `<character>-<dressphere>` combination is
 * the same one `src/engine/BattlePresenterArt.ts`'s `artIdFor` builds for a
 * live combatant ("FFX-2 girls are `<girl>-<dressphere>`"), but that file is
 * presentation and out of bounds for `learn/` to import
 * (`docs/plans/learning-sites.md`: "`learn/` only imports `src/battle/**`
 * and `src/data/**`"), so this module re-derives the same, real convention
 * from the ids the presenter itself combines, rather than guessing at what a
 * manifest subject's name might mean.
 *
 * **ENEMY-side** is named by an `EnemyDef`/its `EnemyForm`s' own `spriteKey`,
 * or by the enemy's own `id` — Seymour Flux's painting is mid-rename
 * (`BattlePresenterArt.ts`'s own comment: "Seymour's painting lives under
 * `seymour-flux/` today and becomes `seymour-flux-body/` tomorrow"), so the
 * manifest still carries the legacy `seymour-flux` folder under the
 * combatant's own `id`, not its current `spriteKey`
 * (`seymour-flux-body`). Chapter 3's possessed aeons are built from every
 * real aeon id (`buildPossessedAeonChain(AEON_IDS)`), not only the five the
 * `dreams-end` build's own default preset fields — Anima and Yojimbo are
 * real possessed-aeon forms even though that preset never carries them.
 *
 * A subject named by **both** sides (an aeon Yu Yevon later possesses) stays
 * on the party side, with one extra fact naming the chapter it turns hostile
 * in. That fact is built only from a literal `spriteKey` match, never from
 * the `id` fallback above — FFX-2's Bahamut enemy answers to the bare id
 * `bahamut` too (the exact collision `BattlePresenterArt.ts` prefixes
 * `ffx2-bahamut` to avoid), and sourcing the fact from `id` would wrongly
 * claim the FFX aeon's own painting also appears in Chapter 4, when the
 * chapter's own painted subject is the separate `ffx2-bahamut` piece.
 */

import type { EnemyDef, EnemyGroupDef } from '../../src/battle/common/types.ts';
import type { ChapterId } from '../../src/data/encounters.ts';
import { getChapter } from '../../src/data/encounters.ts';
import type { PieceFact } from '../shared/model.ts';

import { CHARACTERS as FFX_CHARACTERS } from '../../src/data/ffx/characters/index.ts';
import { AEONS as FFX_AEONS } from '../../src/data/ffx/aeons/index.ts';
import { gagazetBuild } from '../../src/data/ffx/builds/gagazet.ts';
import { zanarkandBuild } from '../../src/data/ffx/builds/zanarkand.ts';
import { dreamsEndBuild } from '../../src/data/ffx/builds/dreams-end.ts';
import { AEON_IDS } from '../../src/data/ffx/ids.ts';
import { seymourFluxGroup } from '../../src/data/ffx/enemies/seymour-flux.ts';
import { yunalescaGroup } from '../../src/data/ffx/enemies/yunalesca.ts';
import {
  braskasFinalAeonGroup,
  buildPossessedAeonChain,
  yuYevonGroup,
} from '../../src/data/ffx/enemies/braskas-final-aeon.ts';

import { CHARACTER_IDS, STANDARD_DRESSPHERE_IDS } from '../../src/data/ffx2/ids.ts';
import { SPECIAL_DRESSPHERES } from '../../src/data/ffx2/dresspheres/special/index.ts';
import { bevelleBuild } from '../../src/data/ffx2/builds/bevelle.ts';
import { farplaneBuild } from '../../src/data/ffx2/builds/farplane.ts';
import { bahamutGroup } from '../../src/data/ffx2/enemies/bahamut.ts';
import {
  vegnagunTailGroup,
  vegnagunLegGroup,
  vegnagunBodyGroup,
  vegnagunHeadGroup,
  shuyinGroup,
} from '../../src/data/ffx2/enemies/vegnagun-shuyin.ts';

// ---------------------------------------------------------------------------
// Party-side sprite keys
// ---------------------------------------------------------------------------

const PARTY_SPRITE_KEYS: ReadonlySet<string> = new Set<string>([
  // FFX: the species-level catalog, plus every build's own members/aeons — a
  // build's spriteKey always agrees with its catalog entry today, but the
  // catalog alone would miss a future build that ever painted a variant.
  ...Object.values(FFX_CHARACTERS).map((c) => c.spriteKey),
  ...Object.values(FFX_AEONS).map((a) => a.spriteKey),
  ...[gagazetBuild, zanarkandBuild, dreamsEndBuild].flatMap((build) => [
    ...build.members.map((m) => m.spriteKey),
    ...build.aeons.map((a) => a.spriteKey),
  ]),
  // FFX-2: every real girl painted in every real dressphere (standard, plus
  // each special dressphere's own single `owner`) — the presenter's own
  // `<character>-<dressphere>` convention, re-derived from real ids.
  ...CHARACTER_IDS.flatMap((character) => STANDARD_DRESSPHERE_IDS.map((dressphere) => `${character}-${dressphere}`)),
  ...Object.values(SPECIAL_DRESSPHERES).map((special) => `${special.owner}-${special.id}`),
  ...[bevelleBuild, farplaneBuild].flatMap((build) => build.members.map((m) => m.spriteKey)),
]);

// ---------------------------------------------------------------------------
// Enemy-side sprite keys, grouped by the one chapter each formation belongs to
// ---------------------------------------------------------------------------

interface ChapterEnemySource {
  readonly chapterId: ChapterId;
  readonly groups: readonly EnemyGroupDef[];
}

/**
 * Every enemy formation this project ships, grouped by chapter. Chapter 3 is
 * one continuous chain (BFA -> every possessed aeon -> Yu Yevon) built here
 * with the *full* `AEON_IDS` roster, not the `ENEMY_GROUPS_BY_ID` export in
 * `src/data/ffx/index.ts` — that one is built for the `dreams-end` build's
 * five-mandatory-aeon default and would silently drop Anima and Yojimbo.
 */
const CHAPTER_ENEMY_SOURCES: readonly ChapterEnemySource[] = [
  { chapterId: 'seymour-flux', groups: [seymourFluxGroup] },
  { chapterId: 'yunalesca', groups: [yunalescaGroup] },
  {
    chapterId: 'braskas-final-aeon',
    groups: [braskasFinalAeonGroup, yuYevonGroup, ...buildPossessedAeonChain(AEON_IDS)],
  },
  { chapterId: 'ffx2-bahamut', groups: [bahamutGroup] },
  {
    chapterId: 'ffx2-vegnagun-shuyin',
    groups: [vegnagunTailGroup, vegnagunLegGroup, vegnagunBodyGroup, vegnagunHeadGroup, shuyinGroup],
  },
];

/** Every `EnemyDef` a formation carries — its own `enemies`, plus any separately-targetable `parts`. */
function combatantsOf(group: EnemyGroupDef): readonly EnemyDef[] {
  return [...group.enemies, ...(group.parts ?? [])];
}

/** Every `spriteKey` a formation's combatants answer to — their own, and every form's. */
function spriteKeysOf(group: EnemyGroupDef): readonly string[] {
  return combatantsOf(group).flatMap((enemy) => [enemy.spriteKey, ...(enemy.forms ?? []).map((form) => form.spriteKey)]);
}

/** Every id a formation's combatants answer to — a fallback for the one enemy whose id outlived its own spriteKey (Seymour Flux). */
function idsOf(group: EnemyGroupDef): readonly string[] {
  return combatantsOf(group).map((enemy) => enemy.id);
}

/** Every string an enemy record answers to, for role classification only — never for naming a chapter (see {@link chaptersNamingAsEnemy}). */
const ENEMY_NAMED_KEYS: ReadonlySet<string> = new Set(
  CHAPTER_ENEMY_SOURCES.flatMap(({ groups }) => groups.flatMap((group) => [...spriteKeysOf(group), ...idsOf(group)])),
);

/** Chapter titles where `spriteKey` literally paints an enemy — the only source an "Also appears as" fact is built from. */
function chaptersNamingAsEnemy(spriteKey: string): readonly string[] {
  const titles: string[] = [];
  for (const { chapterId, groups } of CHAPTER_ENEMY_SOURCES) {
    if (groups.some((group) => spriteKeysOf(group).includes(spriteKey))) {
      const chapter = getChapter(chapterId);
      if (chapter) titles.push(chapter.title);
    }
  }
  return titles;
}

// ---------------------------------------------------------------------------
// Public role lookup
// ---------------------------------------------------------------------------

export type SubjectRole =
  | { readonly side: 'party' }
  | { readonly side: 'enemy' }
  | { readonly side: 'both'; readonly facts: readonly PieceFact[] }
  | { readonly side: 'unnamed' };

/**
 * Which side (if any) really names this painted subject id. Never reads
 * `ArtManifestSubject.facing` — see the file header.
 */
export function roleForSubject(subjectId: string): SubjectRole {
  const isParty = PARTY_SPRITE_KEYS.has(subjectId);
  const isEnemy = ENEMY_NAMED_KEYS.has(subjectId);

  if (isParty && isEnemy) {
    const facts: PieceFact[] = chaptersNamingAsEnemy(subjectId).map((title) => ({
      label: 'Also appears as',
      value: `an enemy in ${title}`,
    }));
    return { side: 'both', facts };
  }
  if (isParty) return { side: 'party' };
  if (isEnemy) return { side: 'enemy' };
  return { side: 'unnamed' };
}
