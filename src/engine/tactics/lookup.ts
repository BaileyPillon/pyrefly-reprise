/**
 * How the strategy guide (`./guide.ts`) and the encounter tactics
 * (`./index.ts`) find the chapter on the board: **by game first, then by an
 * enemy-side boss id** (both games; AGENTS.md rule 14, shared plumbing).
 *
 * Asking only "which registered boss id is in the record?" leaked across the
 * games. FFX's aeon Bahamut is `'bahamut'` (`src/data/ffx/aeons/index.ts`),
 * the same id as Chapter IV's FFX-2 boss, and an FFX party carries its aeons
 * in the battle record from the first turn. So every FFX fight whose own boss
 * has no guide or tactic, the unlisted IX Yojimbo and X Seymour Natus, found
 * the FFX-2 Bahamut guide and tactic instead of none (release 13 review,
 * guide-leak track). The FFX-2 Fallen Aeons (XI, `x2-shiva`, `x2-anima`, ...)
 * are the mirror case: an FFX-2 board must never reach an FFX guide.
 *
 * {@link CHAPTER_GAME} is the game of every chapter that has a guide or a
 * tactic. It restates `src/data/encounters.ts` rather than importing it, so the
 * tactics stay out of the chapter registry's import graph (story scripts,
 * builds, scenes' keys); `tests/unit/tactics-lookup.test.ts` pins the two
 * together, and fails on a guide or tactic whose chapter is missing here.
 */

import type { BattleState, CombatantId, GameId } from '../../battle/common/types.ts';

/** The game each chapter with a guide or a tactic belongs to. */
export const CHAPTER_GAME: Readonly<Record<string, GameId>> = {
  'seymour-flux': 'ffx',
  yunalesca: 'ffx',
  'braskas-final-aeon': 'ffx',
  'ffx2-bahamut': 'ffx2',
  'ffx2-vegnagun-shuyin': 'ffx2',
  'ffx2-leblanc': 'ffx2',
  'seymour-anima-macalania': 'ffx',
  'evrae-airship': 'ffx',
  'yojimbo-cavern': 'ffx',
  'ffx2-trema': 'ffx2',
  'seymour-omnis': 'ffx',
};

/**
 * Is this chapter the one on the board? Its game must be the battle's game
 * (an unknown chapter matches nothing), and one of its boss ids must be in the
 * record on the enemy side, never a party member or a summoned aeon.
 */
export function chapterOnBoard(
  state: Readonly<Pick<BattleState, 'game' | 'combatants'>>,
  chapterId: string,
  bossIds: readonly CombatantId[],
): boolean {
  if (CHAPTER_GAME[chapterId] !== state.game) return false;
  return bossIds.some((id) => state.combatants[id]?.side === 'enemy');
}

/**
 * The strategy guide's headline for the board: the standing link's own name
 * when the chapter names its links (`ChapterGuide.linkTitles`), else the
 * chapter's title. FOC16-06 (release 16 focused review): Chapter XIII's panel
 * said "Trema" while Oversoul Paragon, the first link, was the one standing.
 * Both games (shared plumbing); a guide with no `linkTitles` is unchanged.
 */
export function guideTitle(
  state: Readonly<Pick<BattleState, 'combatants'>>,
  guide: { title: string; bossIds: readonly CombatantId[]; linkTitles?: Readonly<Record<CombatantId, string>> },
): string {
  const titles = guide.linkTitles;
  if (!titles) return guide.title;
  for (const id of guide.bossIds) {
    const c = state.combatants[id];
    if (c && c.side === 'enemy' && !c.removed && c.hp > 0 && titles[id]) return titles[id];
  }
  return guide.title;
}
