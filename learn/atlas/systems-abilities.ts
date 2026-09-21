/**
 * Site A's "abilities" and "statuses-inflicted" systems. Both start from the
 * same walk over every combatant's `abilityIds`, so they live together:
 * abilities are every move any part can make; statuses-inflicted are the
 * subset of those moves' `statusEffects` that can actually land on the party
 * (mirrors `docs/concepts/atlas/a-boss-atlas/build-a.mjs`'s `onParty` split).
 */

import type { AbilityDef, EnemyDef, StatusId } from '../../src/battle/common/types.ts';
import type { Chapter } from '../../src/data/encounters.ts';
import type { ChapterGuide } from '../../src/data/guides/types.ts';
import type { Piece, PieceFact } from '../shared/model.ts';
import { definePiece } from '../shared/model.ts';
import { requireAbility } from './chain.ts';
import { citeForAbility, citeForCombatant } from './cites.ts';
import { humanizeId, titleCase } from './format.ts';
import { howToAnswerForAbility, overviewTab } from './guide-notes.ts';
import { tieredSize } from './size.ts';
import type { Placement } from './arrange.ts';
import { fanCard, sitAtParent } from './arrange.ts';

/** From the ability's own perspective as the *caster* (an enemy): does it reach the party? Mirrors `build-a.mjs`'s `onParty`. */
function hitsParty(ability: AbilityDef): boolean {
  return !/all(y|ies)|self/.test(ability.targeting);
}

function elementsLabel(ability: AbilityDef): string {
  const named = ability.element.filter((e) => e !== 'none');
  return named.length === 0 ? 'Non-elemental' : named.map(titleCase).join(' / ');
}

function abilityBody(ability: AbilityDef): string {
  const hitsPart = ability.hits === 1 ? 'a single hit' : `${ability.hits} hits`;
  return `${titleCase(ability.formula)} formula, ${elementsLabel(ability)}, ${hitsPart}.`;
}

function abilityFacts(ability: AbilityDef): PieceFact[] {
  const facts: PieceFact[] = [
    { label: 'Power', value: String(ability.power) },
    { label: 'MP cost', value: String(ability.mpCost) },
    { label: 'Element', value: elementsLabel(ability) },
    { label: 'Targeting', value: humanizeId(ability.targeting) },
  ];
  if (ability.canMiss === false) {
    facts.push({ label: 'Accuracy', value: 'Always hits' });
  }
  return facts;
}

interface AbilityOwner {
  readonly abilityId: string;
  readonly ownerId: string;
}

/** Every ability id used in this chapter, each paired with the first combatant (in combatant order) whose kit includes it. */
function abilityOwners(combatants: readonly EnemyDef[]): AbilityOwner[] {
  const seen = new Set<string>();
  const owners: AbilityOwner[] = [];
  for (const combatant of combatants) {
    for (const abilityId of combatant.abilityIds) {
      if (!seen.has(abilityId)) {
        seen.add(abilityId);
        owners.push({ abilityId, ownerId: combatant.id });
      }
    }
  }
  return owners;
}

export interface AbilitiesResult {
  readonly abilityPieces: Piece[];
  readonly statusPieces: Piece[];
}

export function buildAbilitiesAndStatuses(
  chapter: Chapter,
  guide: ChapterGuide | undefined,
  combatants: readonly EnemyDef[],
  placementByCombatantId: ReadonlyMap<string, Placement>,
  pieceIdByCombatantId: ReadonlyMap<string, string>,
): AbilitiesResult {
  const owners = abilityOwners(combatants);
  /** The piece an owned fact hangs off: `Piece.parentId`, which the stage threads and counts "+ N more" against. */
  const parentOf = (combatantId: string): { parentId: string } | Record<string, never> => {
    const parentId = pieceIdByCombatantId.get(combatantId);
    return parentId !== undefined ? { parentId } : {};
  };

  const byOwner = new Map<string, AbilityOwner[]>();
  for (const owner of owners) {
    const group = byOwner.get(owner.ownerId);
    if (group) {
      group.push(owner);
    } else {
      byOwner.set(owner.ownerId, [owner]);
    }
  }

  const abilityPieces: Piece[] = [];
  for (const [ownerId, group] of byOwner) {
    const parentPlacement = placementByCombatantId.get(ownerId);
    if (parentPlacement === undefined) {
      throw new Error(`learn/atlas: ability owner "${ownerId}" has no placement`);
    }
    group.forEach((owner, i) => {
      const ability = requireAbility(chapter, owner.abilityId);
      const placement = fanCard(parentPlacement, i, group.length);
      const tabs = [overviewTab(abilityBody(ability))];
      const howTo = howToAnswerForAbility(guide, ability);
      if (howTo !== undefined) tabs.push(howTo);

      abilityPieces.push(
        definePiece({
          id: `ability::${ability.id}`,
          systemId: 'abilities',
          name: ability.name,
          kind: 'card',
          size: tieredSize('card', ability.power),
          home: placement.home,
          burst: placement.burst,
          ...parentOf(owner.ownerId),
          card: {
            eyebrow: 'Ability',
            body: abilityBody(ability),
            claimKind: 'ability',
            facts: abilityFacts(ability),
            cite: citeForAbility(chapter.id, ability.id),
            tabs,
          },
        }),
      );
    });
  }

  // Statuses-inflicted: which statuses can land on the party, and which ability(s) apply them.
  const inflicted = new Map<StatusId, { abilityNames: string[]; ownerId: string }>();
  for (const owner of owners) {
    const ability = requireAbility(chapter, owner.abilityId);
    if (!hitsParty(ability)) continue;
    for (const application of ability.statusEffects) {
      const existing = inflicted.get(application.status);
      if (existing) {
        if (!existing.abilityNames.includes(ability.name)) existing.abilityNames.push(ability.name);
      } else {
        inflicted.set(application.status, { abilityNames: [ability.name], ownerId: owner.ownerId });
      }
    }
  }

  const statusPieces: Piece[] = [...inflicted.entries()].map(([status, info]) => {
    const parentPlacement = placementByCombatantId.get(info.ownerId);
    if (parentPlacement === undefined) {
      throw new Error(`learn/atlas: status owner "${info.ownerId}" has no placement`);
    }
    const placement = sitAtParent(parentPlacement);
    const abilityList = info.abilityNames.join(', ');
    const body = `Landed by ${abilityList}.`;
    return definePiece({
      id: `status::${status}`,
      systemId: 'statuses-inflicted',
      name: humanizeId(status),
      kind: 'tile',
      size: tieredSize('tile', info.abilityNames.length),
      home: placement.home,
      burst: placement.burst,
      ...parentOf(info.ownerId),
      card: {
        eyebrow: 'Status it inflicts',
        body,
        claimKind: 'status-effect',
        facts: [{ label: 'Inflicted by', value: abilityList }],
        cite: citeForCombatant(chapter.id, info.ownerId),
        tabs: [overviewTab(body)],
      },
    });
  });

  return { abilityPieces, statusPieces };
}
