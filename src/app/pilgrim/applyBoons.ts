/**
 * **A boon, put into one fight's real setup** (Pilgrimage prototype, FFX only; Bailey, 2026-10-18, decision 122).
 *
 * A fight of the run is the chapter exactly as it ships, with the player's boons added to its party build before the engine is made from it (`setupForChapter` reads `chapter.buildRef`). Only
 * inputs the engine already takes are used, so **no engine rule and no boss number changes**:
 *
 * - an item boon adds an {@link InventoryEntry} (the count a pick adds is `./boons.ts`'s, capped at the game's 99);
 * - an auto-ability boon puts the ability on the wearer's armour, where the engine already reads worn auto-abilities (the permanent statuses Haste and Regen are applied at stack 255 at the start of
 *   the battle, combat-core section 9). A full armour gives up its last ability for the fight, so the loan never needs a fifth slot the game does not have;
 * - "Overdrive charged" sets the wearer's starting gauge (`overdrive.gauge`, 0 to 100), the field the build already has.
 *
 * The build is **cloned first**: the chapter's own record, which every other player of the chapter reads, is never changed, and a boon is gone when the fight ends because the next fight is made from
 * a fresh clone. The wearer of an auto-ability or the gauge is the first of the boon's preferred allies on the field (`BoonEffect.prefer`), else the first ally on the field who does not already have
 * it; a boon with nobody left to take it is reported `wearer: null` and changes nothing.
 *
 * Layering: no DOM, no `three`. Pure.
 *
 * Game case: FFX only. An FFX-2 or FF7 build is returned as it is.
 */

import type { AutoAbilityId, FFXMemberBuild, FFXPartyBuild } from '../../battle/common/types.ts';
import { cloneData } from '../../battle/common/clone.ts';
import type { Chapter } from '../../data/encounters.ts';
import { boonById, type BoonId } from './boons.ts';

/** The game's own ceiling on one item stack. */
const STACK_MAX = 99;
/** The most auto-abilities one armour can hold in the game. */
const ARMOUR_SLOTS = 4;

/** What one boon did to the party it was put into. */
export interface AppliedBoon {
  readonly boon: BoonId;
  /** The member id who wears it, or null for an item (and for a boon nobody could take). */
  readonly wearer: string | null;
  /** True when the boon changed the build. */
  readonly applied: boolean;
  /** One plain line for the RUN panel: what happened to the setup. */
  readonly line: string;
}

function hasAbility(m: FFXMemberBuild, ability: AutoAbilityId): boolean {
  return m.equipment.armor.autoAbilities.includes(ability) || m.equipment.weapon.autoAbilities.includes(ability);
}

/** The ally who takes a boon: the first preferred one on the field who passes `fits`, else the first on the field who does. */
function wearerFor(party: FFXPartyBuild, prefer: readonly string[], fits: (m: FFXMemberBuild) => boolean): FFXMemberBuild | null {
  const field = party.activeSlots.map((id) => party.members.find((m) => m.id === id)).filter((m): m is FFXMemberBuild => m !== undefined && m.guest === undefined);
  for (const id of prefer) {
    const m = field.find((x) => x.id === id);
    if (m && fits(m)) return m;
  }
  return field.find(fits) ?? null;
}

/** Put an auto-ability on the wearer's armour for the fight. */
function lend(m: FFXMemberBuild, ability: AutoAbilityId): void {
  const armour = m.equipment.armor;
  if (armour.autoAbilities.length >= ARMOUR_SLOTS) armour.autoAbilities[ARMOUR_SLOTS - 1] = ability;
  else armour.autoAbilities.push(ability);
  armour.slots = Math.max(armour.slots, armour.autoAbilities.length);
}

/**
 * A fresh clone of `build` with `boons` put into it, in the order given. An FFX-2 or FF7 build, and a run with no boon, come back unchanged (the same object when there is nothing to do).
 */
export function boonedParty(build: Chapter['buildRef'], boons: readonly BoonId[]): { party: Chapter['buildRef']; applied: readonly AppliedBoon[] } {
  if (build.game !== 'ffx' || boons.length === 0) return { party: build, applied: [] };
  const party = cloneData(build);
  const applied: AppliedBoon[] = [];
  for (const id of boons) {
    const def = boonById(id);
    const effect = def.effect;
    if (effect.kind === 'item') {
      const row = party.inventory.find((e) => e.itemId === effect.itemId);
      if (row) row.count = Math.min(STACK_MAX, row.count + effect.count);
      else party.inventory.push({ itemId: effect.itemId as FFXPartyBuild['inventory'][number]['itemId'], count: Math.min(STACK_MAX, effect.count) });
      applied.push({ boon: id, wearer: null, applied: true, line: `${def.name} is in the pack.` });
    } else if (effect.kind === 'auto-ability') {
      const m = wearerFor(party, effect.prefer, (x) => !hasAbility(x, effect.ability));
      if (m) lend(m, effect.ability);
      applied.push({ boon: id, wearer: m?.id ?? null, applied: m !== null, line: m ? `${def.name} is worn by ${m.name}.` : `${def.name}: everyone on the field has it already.` });
    } else {
      const m = wearerFor(party, effect.prefer, (x) => x.overdrive.gauge < 100);
      if (m) m.overdrive.gauge = 100;
      applied.push({ boon: id, wearer: m?.id ?? null, applied: m !== null, line: m ? `${m.name} starts with a full Overdrive.` : 'Overdrive charged: every gauge on the field is full already.' });
    }
  }
  return { party, applied };
}

/**
 * The chapter of one run fight: `chapter` with its party made from `boons`. The record handed in is not changed; with no boon, or for a non-FFX chapter, it is returned itself.
 */
export function boonedChapter(chapter: Chapter, boons: readonly BoonId[]): { chapter: Chapter; applied: readonly AppliedBoon[] } {
  const { party, applied } = boonedParty(chapter.buildRef, boons);
  return party === chapter.buildRef ? { chapter, applied } : { chapter: { ...chapter, buildRef: party }, applied };
}
