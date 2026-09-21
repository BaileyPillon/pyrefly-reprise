/**
 * Site A's four remaining systems — immunities, affinities, turn patterns
 * (AI) and rewards. Each is "every distinct X across the chapter's
 * combatants, and how many combatants share it," so they share one
 * `collectOwned` walk: first-seen order, first owner (for placement and
 * `cite`), and a share count (for `size`).
 */

import type { EnemyDef, GameId, ItemDef, ItemId } from '../../src/battle/common/types.ts';
import type { Chapter } from '../../src/data/encounters.ts';
import type { ChapterGuide } from '../../src/data/guides/types.ts';
import type { Piece } from '../shared/model.ts';
import { definePiece } from '../shared/model.ts';
import { citeForCombatant } from './cites.ts';
import { countNoun, humanizeId, titleCase } from './format.ts';
import { howToAnswerForItemName, overviewTab } from './guide-notes.ts';
import { tieredSize } from './size.ts';
import type { Placement } from './arrange.ts';
import { sitAtParent } from './arrange.ts';
import { FFX_ITEMS } from '../../src/data/ffx/index.ts';
import { FFX2_ITEMS } from '../../src/data/ffx2/index.ts';

function itemsTableFor(game: GameId): Record<ItemId, ItemDef> {
  return game === 'ffx' ? FFX_ITEMS : FFX2_ITEMS;
}

/**
 * A reward's display name: the catalogued `ItemDef.name` when one exists,
 * else the id humanised. A handful of reward ids in this project's data
 * (key spheres, and a few FFX-2 accessories/armour: `lv-3-key-sphere`,
 * `lv-4-key-sphere`, `gris-gris-bag`, `x2-mute-shock`, `x2-mythril-bangle`,
 * `x2-l-bomb`) have no `ItemDef` in `src/data/{ffx,ffx2}/items/**` at all —
 * see this project's final report for that contract note. `'x2-'` is this
 * project's own id namespace, never part of an in-game name (compare
 * `'x2-megalixir'` -> `'Megalixir'` for an id that *does* resolve), so it is
 * stripped before humanising.
 */
function displayNameForItem(game: GameId, items: Record<ItemId, ItemDef>, id: ItemId): string {
  const cataloged = items[id];
  if (cataloged !== undefined) return cataloged.name;
  const withoutNamespace = game === 'ffx2' ? id.replace(/^x2-/, '') : id;
  return humanizeId(withoutNamespace);
}

interface OwnedFact {
  readonly key: string;
  readonly ownerId: string;
  readonly count: number;
}

/** Every distinct key `keysOf` names across `combatants`, first-seen order, with its first owner and how many combatants share it. */
function collectOwned(combatants: readonly EnemyDef[], keysOf: (combatant: EnemyDef) => readonly string[]): OwnedFact[] {
  const order: string[] = [];
  const ownerId = new Map<string, string>();
  const count = new Map<string, number>();
  for (const combatant of combatants) {
    for (const key of new Set(keysOf(combatant))) {
      count.set(key, (count.get(key) ?? 0) + 1);
      if (!ownerId.has(key)) {
        ownerId.set(key, combatant.id);
        order.push(key);
      }
    }
  }
  return order.map((key) => ({ key, ownerId: ownerId.get(key) ?? key, count: count.get(key) ?? 0 }));
}

function requirePlacement(map: ReadonlyMap<string, Placement>, ownerId: string, systemLabel: string, key: string): Placement {
  const placement = map.get(ownerId);
  if (placement === undefined) {
    throw new Error(`learn/atlas: ${systemLabel} "${key}" owner "${ownerId}" has no placement`);
  }
  return placement;
}

function buildImmunities(chapter: Chapter, combatants: readonly EnemyDef[], placementByCombatantId: ReadonlyMap<string, Placement>): Piece[] {
  return collectOwned(combatants, (c) => Object.keys(c.immunities)).map((fact) => {
    const placement = sitAtParent(requirePlacement(placementByCombatantId, fact.ownerId, 'immunity', fact.key));
    const body = `Blocked by ${countNoun(fact.count, 'combatant')} of ${combatants.length}.`;
    return definePiece({
      id: `immune::${fact.key}`,
      systemId: 'immunities',
      name: humanizeId(fact.key),
      kind: 'tile',
      size: tieredSize('tile', fact.count),
      home: placement.home,
      burst: placement.burst,
      card: {
        eyebrow: 'Immunity',
        body,
        claimKind: 'immunity',
        facts: [{ label: 'Blocked by', value: `${fact.count} of ${combatants.length}` }],
        cite: citeForCombatant(chapter.id, fact.ownerId),
        tabs: [overviewTab(body)],
      },
    });
  });
}

function buildAffinities(chapter: Chapter, combatants: readonly EnemyDef[], placementByCombatantId: ReadonlyMap<string, Placement>): Piece[] {
  const facts = collectOwned(combatants, (c) => Object.entries(c.affinities).map(([element, value]) => `${element}:${value}`));
  return facts.map((fact) => {
    const [element, value] = fact.key.split(':');
    const placement = sitAtParent(requirePlacement(placementByCombatantId, fact.ownerId, 'affinity', fact.key));
    const body = `Shared by ${countNoun(fact.count, 'combatant')}.`;
    return definePiece({
      id: `affinity::${fact.key}`,
      systemId: 'affinities',
      name: `${titleCase(element ?? fact.key)} — ${titleCase(value ?? '')}`,
      kind: 'tile',
      size: tieredSize('tile', fact.count),
      home: placement.home,
      burst: placement.burst,
      card: {
        eyebrow: 'Elemental affinity',
        body,
        claimKind: 'elemental-affinity',
        facts: [{ label: 'Combatants', value: String(fact.count) }],
        cite: citeForCombatant(chapter.id, fact.ownerId),
        tabs: [overviewTab(body)],
      },
    });
  });
}

function buildTurnPatterns(chapter: Chapter, combatants: readonly EnemyDef[], placementByCombatantId: ReadonlyMap<string, Placement>): Piece[] {
  return collectOwned(combatants, (c) => [c.aiScriptId]).map((fact) => {
    const placement = sitAtParent(requirePlacement(placementByCombatantId, fact.ownerId, 'AI script', fact.key));
    const body = `Used by ${countNoun(fact.count, 'combatant')}.`;
    return definePiece({
      id: `ai::${fact.key}`,
      systemId: 'turn-patterns',
      name: humanizeId(fact.key),
      kind: 'tile',
      size: tieredSize('tile', fact.count),
      home: placement.home,
      burst: placement.burst,
      card: {
        eyebrow: 'Turn pattern',
        body,
        claimKind: 'ai-script',
        facts: [{ label: 'Used by', value: `${fact.count}` }],
        cite: citeForCombatant(chapter.id, fact.ownerId),
        tabs: [overviewTab(body)],
      },
    });
  });
}

function rewardItemIds(combatant: EnemyDef): string[] {
  const ids = combatant.rewards.drops.map((drop) => drop.itemId);
  if (combatant.rewards.steal) {
    ids.push(combatant.rewards.steal.common.itemId, combatant.rewards.steal.rare.itemId);
  }
  return ids;
}

function buildRewards(
  chapter: Chapter,
  guide: ChapterGuide | undefined,
  combatants: readonly EnemyDef[],
  placementByCombatantId: ReadonlyMap<string, Placement>,
): Piece[] {
  const items = itemsTableFor(chapter.game);
  return collectOwned(combatants, rewardItemIds).map((fact) => {
    const name = displayNameForItem(chapter.game, items, fact.key);
    const placement = sitAtParent(requirePlacement(placementByCombatantId, fact.ownerId, 'reward', fact.key));
    const body = `Dropped or stolen from ${countNoun(fact.count, 'combatant')}.`;
    const tabs = [overviewTab(body)];
    const howTo = howToAnswerForItemName(guide, name);
    if (howTo !== undefined) tabs.push(howTo);
    return definePiece({
      id: `reward::${fact.key}`,
      systemId: 'rewards',
      name,
      kind: 'tile',
      size: tieredSize('tile', fact.count),
      home: placement.home,
      burst: placement.burst,
      card: {
        eyebrow: 'Reward',
        body,
        claimKind: 'reward',
        facts: [{ label: 'Sources', value: `${fact.count}` }],
        cite: citeForCombatant(chapter.id, fact.ownerId),
        tabs,
      },
    });
  });
}

export interface CatalogSystemsResult {
  readonly immunityPieces: Piece[];
  readonly affinityPieces: Piece[];
  readonly turnPatternPieces: Piece[];
  readonly rewardPieces: Piece[];
}

export function buildCatalogSystems(
  chapter: Chapter,
  guide: ChapterGuide | undefined,
  combatants: readonly EnemyDef[],
  placementByCombatantId: ReadonlyMap<string, Placement>,
): CatalogSystemsResult {
  return {
    immunityPieces: buildImmunities(chapter, combatants, placementByCombatantId),
    affinityPieces: buildAffinities(chapter, combatants, placementByCombatantId),
    turnPatternPieces: buildTurnPatterns(chapter, combatants, placementByCombatantId),
    rewardPieces: buildRewards(chapter, guide, combatants, placementByCombatantId),
  };
}
