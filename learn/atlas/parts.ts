/**
 * Site A's "parts-and-forms" system: one piece per combatant, or per form of
 * a combatant that changes form (`docs/plans/learning-sites.md`: "forms
 * count as parts for bosses that change form").
 *
 * A unit is a **painting** when its `spriteKey` is unique among the
 * chapter's units (every main boss, every one of Yunalesca's three forms,
 * and Mortiorchis, which is flagged `isPart` but still has its own
 * distinct art) and a **card** when the `spriteKey` is shared by siblings
 * *and* `flags.isPart` is set (Vegnagun's Nodes all share `'vegnagun-node'`,
 * its Bulwarks `'vegnagun-bulwark'`, its Redoubts `'vegnagun-redoubt'`, and
 * the two Yu Pagodas `'yu-pagoda'`) — a purely data-driven split, not a
 * per-chapter list. The `isPart` half of that test matters once a `spriteKey`
 * can collide for a reason other than "several simultaneous copies of one
 * support part": Chapter 6's `ormi-entrance` / `ormi-logos-room` / `logos-
 * room` reprise `ormi` / `logos` across the mission's three acts under
 * separate bestiary records, sharing the pair's real sprite because they are
 * literally the same two people, not a boss's subordinate parts — and
 * neither carries `isPart` (rightly: it has its own gameplay meaning in the
 * real battle engine, hard rule 6 forbids adding it with no source). Without
 * the `isPart` half, they would be classed as cards with no boss to fan from.
 */

import type { EnemyDef, EnemyGroupDef } from '../../src/battle/common/types.ts';
import type { Chapter } from '../../src/data/encounters.ts';
import type { ChapterGuide } from '../../src/data/guides/types.ts';
import type { Piece, PieceFact, PieceKind } from '../shared/model.ts';
import { definePiece } from '../shared/model.ts';
import { collectCombatants, parentIdFor, resolveChain } from './chain.ts';
import { citeForCombatant } from './cites.ts';
import { distinguishName, fmtNumber, humanizeId } from './format.ts';
import { howToAnswerForCombatant, overviewTab } from './guide-notes.ts';
import { tieredSize } from './size.ts';
import type { Placement } from './arrange.ts';
import { CH5_PAINTED, arrangeMainUnits, fanCard } from './arrange.ts';

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

/**
 * Replaces a unit's `name` with a distinguishing one wherever the chapter
 * fields two or more units under the same name (`distinguishName`). Every
 * other unit keeps exactly the name the data gives it.
 */
export function distinguishUnitNames(units: readonly PartUnit[]): PartUnit[] {
  const timesUsed = new Map<string, number>();
  for (const unit of units) timesUsed.set(unit.name, (timesUsed.get(unit.name) ?? 0) + 1);
  return units.map((unit) =>
    (timesUsed.get(unit.name) ?? 0) > 1 ? { ...unit, name: distinguishName(unit.name, unit.combatant.id) } : unit,
  );
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
  return sharedCount > 1 && unit.combatant.flags.isPart === true ? 'card' : 'painting';
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
  /** Combatant id -> the id of the piece that stands for it, so another system's piece can name it as its `parentId`. */
  readonly pieceIdByCombatantId: ReadonlyMap<string, string>;
}

/**
 * Combatant id -> its battle's 1-based place in the chain, for the numbered
 * pins the assembled frame draws on each part ("1 · Tail" … "5 · Shuyin").
 * Only a formation's *primary* enemy is pinned: the pins count battles, and
 * a battle's supports share their parent's pin.
 */
function badgeByCombatantId(chain: readonly EnemyGroupDef[]): Map<string, string> {
  const badges = new Map<string, string>();
  if (chain.length < 2) return badges; // one battle: there is no order to number
  chain.forEach((group, i) => {
    const primary = group.enemies[0];
    if (primary !== undefined && !badges.has(primary.id)) badges.set(primary.id, String(i + 1));
  });
  return badges;
}

export function buildPartsSystem(chapter: Chapter, guide: ChapterGuide | undefined): PartsSystemResult {
  const chain = resolveChain(chapter);
  const combatants = collectCombatants(chain);
  const units = distinguishUnitNames(buildPartUnits(combatants));

  const mainUnits = units.filter((u) => kindForUnit(u, units) === 'painting');
  const cardUnits = units.filter((u) => kindForUnit(u, units) === 'card');

  const isCh5Ported = (unit: PartUnit): boolean =>
    chapter.id === 'ffx2-vegnagun-shuyin' && unit.combatant.id in CH5_PAINTED;

  const proceduralPlacements = arrangeMainUnits(mainUnits.filter((u) => !isCh5Ported(u)).length);
  const placementByUnitId = new Map<string, Placement>();
  let proceduralIndex = 0;
  for (const unit of mainUnits) {
    if (isCh5Ported(unit)) {
      const ported = CH5_PAINTED[unit.combatant.id];
      if (ported === undefined) {
        throw new Error(`learn/atlas: missing ported position for "${unit.combatant.id}"`);
      }
      placementByUnitId.set(unit.id, ported);
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

  // A unit stands for its combatant (its first form, for a combatant that changes form), so
  // another system's piece can name it as a parent without knowing about forms at all.
  const pieceIdByCombatantId = new Map<string, string>();
  for (const unit of units) {
    if (unit.formIndex === undefined || unit.formIndex === 0) {
      pieceIdByCombatantId.set(unit.combatant.id, unit.id);
    }
  }

  const badges = badgeByCombatantId(chain);

  const pieces = units.map((unit) => {
    const kind: PieceKind = kindForUnit(unit, units);
    const placement = placementByUnitId.get(unit.id);
    if (placement === undefined) {
      throw new Error(`learn/atlas: no placement computed for part "${unit.id}"`);
    }
    const tabs = [overviewTab(bodyFor(unit))];
    const howTo = howToAnswerForCombatant(guide, unit.combatant, unit.formIndex);
    if (howTo !== undefined) tabs.push(howTo);

    // A support part with no painting of its own hangs off the part it belongs to; a later
    // form hangs off the first. A main unit hangs off nothing — it is the thing on stage.
    const parentCombatantId = unit.combatant.flags.isPart === true ? parentIdFor(chain, unit.combatant) : undefined;
    const parentId =
      unit.formIndex !== undefined && unit.formIndex > 0
        ? pieceIdByCombatantId.get(unit.combatant.id)
        : parentCombatantId !== undefined && parentCombatantId !== unit.combatant.id
          ? pieceIdByCombatantId.get(parentCombatantId)
          : undefined;
    const badge = unit.formIndex === undefined || unit.formIndex === 0 ? badges.get(unit.combatant.id) : undefined;

    return definePiece({
      id: unit.id,
      systemId: 'parts-and-forms',
      name: unit.name,
      kind,
      art: kind === 'painting' ? `characters/${unit.spriteKey}/idle.png` : undefined,
      size: tieredSize(kind, unit.hp),
      home: placement.home,
      burst: placement.burst,
      ...(placement.stage !== undefined ? { stage: placement.stage } : {}),
      ...(parentId !== undefined ? { parentId } : {}),
      ...(badge !== undefined ? { badge } : {}),
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

  return { pieces, chain, combatants, placementByCombatantId, pieceIdByCombatantId };
}
