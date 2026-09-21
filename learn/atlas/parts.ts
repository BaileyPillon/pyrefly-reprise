/**
 * Site A's "parts-and-forms" system: one piece per combatant, or per form of
 * a combatant that changes form (`docs/plans/learning-sites.md`: "forms
 * count as parts for bosses that change form").
 *
 * A unit is a **painting** when its `spriteKey` is unique among the
 * chapter's units (every main boss, every one of Yunalesca's three forms,
 * and Mortiorchis, which is flagged `isPart` but still has its own
 * distinct art) and a **card** when the `spriteKey` is shared by siblings
 * with no distinguishing art of their own (Vegnagun's Nodes all share
 * `'vegnagun-node'`, its Bulwarks `'vegnagun-bulwark'`, its Redoubts
 * `'vegnagun-redoubt'`, and the two Yu Pagodas `'yu-pagoda'`) — a purely
 * data-driven split, not a per-chapter list.
 */

import type { EnemyDef, EnemyGroupDef } from '../../src/battle/common/types.ts';
import type { Chapter } from '../../src/data/encounters.ts';
import type { ChapterGuide } from '../../src/data/guides/types.ts';
import type { Piece, PieceFact, PieceKind } from '../shared/model.ts';
import { definePiece } from '../shared/model.ts';
import { collectCombatants, parentIdFor, resolveChain } from './chain.ts';
import { citeForCombatant } from './cites.ts';
import { fmtNumber, humanizeId } from './format.ts';
import { howToAnswerForCombatant, overviewTab } from './guide-notes.ts';
import { tieredSize } from './size.ts';
import type { Placement } from './arrange.ts';
import { CH5_PAINTED_BURST, CH5_PAINTED_HOME, arrangeMainUnits, fanCard } from './arrange.ts';

/** One placeable part — a whole single-form combatant, or one form of a multi-form combatant. */
export interface PartUnit {
  readonly id: string;
  readonly combatant: EnemyDef;
  readonly formIndex: number | undefined;
  readonly name: string;
  readonly spriteKey: string;
  readonly hp: number;
  readonly aiScriptId: string;
}

export function buildPartUnits(combatants: readonly EnemyDef[]): PartUnit[] {
  const units: PartUnit[] = [];
  for (const combatant of combatants) {
    if (combatant.forms.length > 1) {
      combatant.forms.forEach((form, i) => {
        units.push({
          id: `${combatant.id}::form-${i}`,
          combatant,
          formIndex: i,
          name: form.name,
          spriteKey: form.spriteKey,
          hp: form.hp,
          aiScriptId: form.aiScriptId ?? combatant.aiScriptId,
        });
      });
    } else {
      const form = combatant.forms[0];
      units.push({
        id: combatant.id,
        combatant,
        formIndex: undefined,
        name: form?.name ?? combatant.name,
        spriteKey: form?.spriteKey ?? combatant.spriteKey,
        hp: form?.hp ?? combatant.hp,
        aiScriptId: combatant.aiScriptId,
      });
    }
  }
  return units;
}

/** 'painting' when unique art; 'card' when this `spriteKey` is shared by two or more units (see the module doc comment). */
export function kindForUnit(unit: PartUnit, allUnits: readonly PartUnit[]): 'painting' | 'card' {
  const sharedCount = allUnits.filter((u) => u.spriteKey === unit.spriteKey).length;
  return sharedCount > 1 ? 'card' : 'painting';
}

function unitIdForCombatant(units: readonly PartUnit[], combatantId: string): string | undefined {
  return units.find((u) => u.combatant.id === combatantId && (u.formIndex === undefined || u.formIndex === 0))?.id;
}

function eyebrowFor(unit: PartUnit, chain: readonly EnemyGroupDef[], combatants: readonly EnemyDef[]): string {
  if (unit.formIndex !== undefined) {
    return `Form ${unit.formIndex + 1} of ${unit.combatant.forms.length}`;
  }
  if (unit.combatant.flags.isPart === true) {
    const parentId = parentIdFor(chain, unit.combatant);
    const parentName = combatants.find((c) => c.id === parentId)?.name ?? parentId;
    return `Part of ${parentName}`;
  }
  return unit.combatant.flags.isBoss === true ? 'Boss' : 'Combatant';
}

function bodyFor(unit: PartUnit): string {
  if (unit.combatant.scanText !== undefined && unit.combatant.scanText.length > 0) {
    return unit.combatant.scanText;
  }
  const levelPart = unit.combatant.level !== undefined ? `Level ${unit.combatant.level}, ` : '';
  return `${levelPart}${fmtNumber(unit.hp)} HP.`;
}

function factsFor(unit: PartUnit): PieceFact[] {
  const facts: PieceFact[] = [{ label: 'HP', value: fmtNumber(unit.hp) }];
  if (unit.combatant.level !== undefined) {
    facts.push({ label: 'Level', value: String(unit.combatant.level) });
  }
  facts.push({ label: 'Abilities', value: String(unit.combatant.abilityIds.length) });
  facts.push({ label: 'AI script', value: humanizeId(unit.aiScriptId) });
  return facts;
}

export interface PartsSystemResult {
  readonly pieces: Piece[];
  readonly chain: readonly EnemyGroupDef[];
  readonly combatants: readonly EnemyDef[];
  /** One representative placement per combatant id (its first/only form), for the other six systems to attach their pieces to. */
  readonly placementByCombatantId: ReadonlyMap<string, Placement>;
}

export function buildPartsSystem(chapter: Chapter, guide: ChapterGuide | undefined): PartsSystemResult {
  const chain = resolveChain(chapter);
  const combatants = collectCombatants(chain);
  const units = buildPartUnits(combatants);

  const mainUnits = units.filter((u) => kindForUnit(u, units) === 'painting');
  const cardUnits = units.filter((u) => kindForUnit(u, units) === 'card');

  const isCh5Ported = (unit: PartUnit): boolean =>
    chapter.id === 'ffx2-vegnagun-shuyin' && unit.combatant.id in CH5_PAINTED_HOME;

  const proceduralPlacements = arrangeMainUnits(mainUnits.filter((u) => !isCh5Ported(u)).length);
  const placementByUnitId = new Map<string, Placement>();
  let proceduralIndex = 0;
  for (const unit of mainUnits) {
    if (isCh5Ported(unit)) {
      const home = CH5_PAINTED_HOME[unit.combatant.id];
      const burst = CH5_PAINTED_BURST[unit.combatant.id];
      if (home === undefined || burst === undefined) {
        throw new Error(`learn/atlas: missing ported position for "${unit.combatant.id}"`);
      }
      placementByUnitId.set(unit.id, { home, burst });
    } else {
      const placement = proceduralPlacements[proceduralIndex];
      proceduralIndex += 1;
      if (placement === undefined) {
        throw new Error(`learn/atlas: ran out of procedural placements for "${unit.id}"`);
      }
      placementByUnitId.set(unit.id, placement);
    }
  }

  // Card units (support parts with no painting of their own) fan out from their parent, grouped so siblings share one ring.
  const cardUnitsByParent = new Map<string, PartUnit[]>();
  for (const unit of cardUnits) {
    const parentId = parentIdFor(chain, unit.combatant);
    const group = cardUnitsByParent.get(parentId);
    if (group) {
      group.push(unit);
    } else {
      cardUnitsByParent.set(parentId, [unit]);
    }
  }
  for (const [parentId, group] of cardUnitsByParent) {
    const parentUnitId = unitIdForCombatant(units, parentId);
    const parentPlacement = parentUnitId !== undefined ? placementByUnitId.get(parentUnitId) : undefined;
    if (parentPlacement === undefined) {
      throw new Error(`learn/atlas: part "${group[0]?.combatant.id ?? '?'}" names a parent "${parentId}" with no placement`);
    }
    group.forEach((unit, i) => {
      placementByUnitId.set(unit.id, fanCard(parentPlacement, i, group.length));
    });
  }

  const placementByCombatantId = new Map<string, Placement>();
  for (const unit of units) {
    if (unit.formIndex === undefined || unit.formIndex === 0) {
      const placement = placementByUnitId.get(unit.id);
      if (placement !== undefined) placementByCombatantId.set(unit.combatant.id, placement);
    }
  }

  const pieces = units.map((unit) => {
    const kind: PieceKind = kindForUnit(unit, units);
    const placement = placementByUnitId.get(unit.id);
    if (placement === undefined) {
      throw new Error(`learn/atlas: no placement computed for part "${unit.id}"`);
    }
    const tabs = [overviewTab(bodyFor(unit))];
    const howTo = howToAnswerForCombatant(guide, unit.combatant, unit.formIndex);
    if (howTo !== undefined) tabs.push(howTo);

    return definePiece({
      id: unit.id,
      systemId: 'parts-and-forms',
      name: unit.name,
      kind,
      art: kind === 'painting' ? `characters/${unit.spriteKey}/idle.png` : undefined,
      size: tieredSize(kind, unit.hp),
      home: placement.home,
      burst: placement.burst,
      card: {
        eyebrow: eyebrowFor(unit, chain, combatants),
        body: bodyFor(unit),
        claimKind: unit.combatant.flags.isPart === true ? 'combatant-part' : 'combatant',
        facts: factsFor(unit),
        cite: citeForCombatant(chapter.id, unit.combatant.id),
        tabs,
      },
    });
  });

  return { pieces, chain, combatants, placementByCombatantId };
}
