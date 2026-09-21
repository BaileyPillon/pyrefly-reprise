/**
 * Generic access to a chapter's real battle data: which formations it fields
 * (one, several in a chain, or several forms of one), which combatants those
 * formations put on the field, and where an ability id resolves to.
 *
 * Nothing here is chapter-specific. `EnemyGroupDef.nextGroupId` already
 * expresses "one battle, several forms" (no `nextGroupId`, several
 * `EnemyForm`s on one enemy), "several separate battles with no menu
 * between" (Braska's Final Aeon, Vegnagun) and "just one battle" (Seymour
 * Flux, Bahamut) uniformly, and both games already publish a complete
 * `EnemyGroupDef` and `AbilityDef` registry keyed by id
 * (`src/data/ffx/index.ts`, `src/data/ffx2/index.ts`), so walking the chain
 * and resolving an ability needs no per-chapter special-casing.
 */

import type { ChapterId, Chapter } from '../../src/data/encounters.ts';
import { getChapter } from '../../src/data/encounters.ts';
import type { AbilityDef, AbilityId, EnemyDef, EnemyGroupDef, GameId } from '../../src/battle/common/types.ts';
import { ENEMY_GROUPS_BY_ID as FFX_GROUPS_BY_ID, FFX_ABILITIES } from '../../src/data/ffx/index.ts';
import { ENEMY_GROUPS_BY_ID as FFX2_GROUPS_BY_ID, FFX2_ABILITIES } from '../../src/data/ffx2/index.ts';

/** Looks a chapter up by id, throwing rather than returning `undefined` — every caller here already has a real `ChapterId`. */
export function requireChapter(chapterId: ChapterId): Chapter {
  const chapter = getChapter(chapterId);
  if (chapter === undefined) {
    throw new Error(`learn/atlas: unknown chapter id "${chapterId}"`);
  }
  return chapter;
}

function groupsTableFor(game: GameId): Record<string, EnemyGroupDef> {
  return game === 'ffx' ? FFX_GROUPS_BY_ID : FFX2_GROUPS_BY_ID;
}

/** Every `AbilityDef` this project ships for one game, keyed by id — the complete, merged registry each game's `index.ts` already builds. */
export function abilitiesTableFor(game: GameId): Record<AbilityId, AbilityDef> {
  return game === 'ffx' ? FFX_ABILITIES : FFX2_ABILITIES;
}

/**
 * Walks `EnemyGroupDef.nextGroupId` from the chapter's first formation.
 * Stops at a formation this game's registry doesn't know (shouldn't happen
 * for a shipped chapter) or a repeat (defends against an accidental cycle);
 * a single-battle or single-formation-with-forms chapter simply returns one
 * group.
 */
export function resolveChain(chapter: Chapter): EnemyGroupDef[] {
  const table = groupsTableFor(chapter.game);
  const chain: EnemyGroupDef[] = [];
  const seen = new Set<string>();
  let current: EnemyGroupDef | undefined = chapter.enemyGroupRef;
  while (current !== undefined && !seen.has(current.id)) {
    chain.push(current);
    seen.add(current.id);
    current = current.nextGroupId !== undefined ? table[current.nextGroupId] : undefined;
  }
  return chain;
}

/** Every combatant across the chain, deduped by id in first-seen order — a chained chapter's recurring part (the Yu Pagodas survive every link) counts once, not once per battle. */
export function collectCombatants(chain: readonly EnemyGroupDef[]): EnemyDef[] {
  const seen = new Set<string>();
  const combatants: EnemyDef[] = [];
  for (const group of chain) {
    for (const enemy of [...group.enemies, ...(group.parts ?? [])]) {
      if (!seen.has(enemy.id)) {
        seen.add(enemy.id);
        combatants.push(enemy);
      }
    }
  }
  return combatants;
}

/** Resolves an ability id against the chapter's game, throwing (never inventing a stand-in) when a combatant's `abilityIds` names one the registry doesn't have. */
export function requireAbility(chapter: Chapter, id: AbilityId): AbilityDef {
  const ability = abilitiesTableFor(chapter.game)[id];
  if (ability === undefined) {
    throw new Error(`learn/atlas: chapter "${chapter.id}" references unknown ability id "${id}"`);
  }
  return ability;
}

/**
 * The combatant id a "part" (`flags.isPart`) belongs to. Prefers the
 * declared `flags.partOf`; falls back to the primary enemy (`enemies[0]`) of
 * the first group the part appears in, for the one part in this project's
 * data that ships without `partOf` (`yuPagoda()` in
 * `src/data/ffx/enemies/braskas-final-aeon.ts` sets `isPart` but not
 * `partOf` — see this project's final report for the contract note).
 */
export function parentIdFor(chain: readonly EnemyGroupDef[], combatant: EnemyDef): string {
  if (combatant.flags.partOf !== undefined) {
    return combatant.flags.partOf;
  }
  for (const group of chain) {
    const ids = new Set([...group.enemies, ...(group.parts ?? [])].map((c) => c.id));
    if (ids.has(combatant.id)) {
      return group.enemies[0]?.id ?? combatant.id;
    }
  }
  return combatant.id;
}
