/**
 * A girl's automatic-status layer, built from the engine's loadout (re-parity X2-D; **FFX-2 only**).
 *
 * The game keeps, per character, the rows her dressphere, grid and accessories list (kind 8, `kernel/dressphere-abilities.ts`), the
 * tables those rows fill (`kernel/ability-effects.ts`: the kept set, the SOS set and its flag) and the three ability words
 * (`abilityWords`). The kernels in `kernel/sos-layer.ts` copy the kept set into the effective layer and add the SOS set while the HP
 * state is 1. This module builds the record from a unit, turns the effective layer back into the engine's status ids, and says which
 * rows she holds. It changes nothing and draws nothing; `auto-layer.ts` (one level up) applies the answer to the unit.
 */

import type { FFX2MemberBuild, GateColour, StatusId } from '../../common/types.ts';
import { GRID_AUTO_STATUS } from '../constants.ts';
import type { Ffx2Unit, GarmentGridRegistry } from '../internal.ts';
import { applyAbilityEffects, emptyChrTables } from '../kernel/ability-effects.ts';
import { abilityWords, jobAbilityGroup, type Ffx2AbilityEnv } from '../kernel/dressphere-abilities.ts';
import { abilityRow } from '../kernel/dressphere-rows.ts';
import { girlJob } from '../kernel/dressphere-stats.ts';
import type { Ffx2AutoLayerChr } from '../kernel/sos-layer.ts';
import { s8 } from '../kernel/intops.ts';
import { gateRows, plateRows } from './auto-grid.ts';
import { AUTO_ROWS_OF_ACCESSORY, AUTO_ROW_OF_ABILITY, JOB_OF_DRESSPHERE } from './auto-rows.ts';
import { GROUP1_STATUS, GROUP2_STATUS, isStageSlot } from './slots.ts';

/** The layer of one girl: the rows she holds, her three ability words, the three status layers and the HP state they were made for. */
export interface Ffx2AutoLayer {
  /** The auto-ability rows she holds (ids 0x8000 and up), in the game's order: her dressphere's, then her accessories'. */
  rows: number[];
  /** `Chr+0x650`, `+0x652`, `+0x654`. */
  words: [number, number, number];
  /** `Chr+0x534`, `+0x538`: kept. */
  kept: number;
  keptCnt: number[];
  /** `Chr+0x518`, `+0x51c`, `+0x66c`: SOS. */
  sos: number;
  sosCnt: number[];
  flag: number;
  /** `Chr+0x4fc`, `+0x500`: the effective layer as last made. */
  eff: number;
  effCnt: number[];
  /** `Chr+0x66e`. */
  hpPrev: number;
}

const GIRLS = ['yuna', 'rikku', 'paine'] as const;

/** The game's character number of an engine girl: 0 to 2 for the three girls, past the girls for anyone else. */
function chrNumber(id: string): number {
  const i = (GIRLS as readonly string[]).indexOf(id);
  return i >= 0 ? i : 15;
}

/**
 * What decides the rows a girl holds, in the shape both a unit in a battle and a member at the build share (the build asks before the unit exists, to size her pools):
 * the dressphere she wears and what she has learned in each, her accessories, and her Garment Grid with the colours of the gates she has crossed.
 */
export interface AutoLoadout {
  readonly id: string;
  readonly level: number;
  readonly dress: string | undefined;
  readonly learned: Readonly<Record<string, { readonly learned: readonly string[] }>> | undefined;
  readonly accessories: readonly string[];
  readonly gridId: string | undefined;
  readonly passed: readonly GateColour[];
}

export function loadoutOfUnit(unit: Ffx2Unit): AutoLoadout {
  const dress = unit.dresspheres;
  return {
    id: unit.id,
    level: unit.level ?? 1,
    dress: dress?.current,
    learned: dress?.abilitiesLearned,
    accessories: unit.accessories,
    gridId: dress?.garmentGrid.id,
    passed: dress?.garmentGrid.passedGates ?? [],
  };
}

export function loadoutOfMember(member: FFX2MemberBuild): AutoLoadout {
  return {
    id: member.id,
    level: member.level,
    dress: member.currentDressphere,
    learned: member.abilitiesLearned,
    accessories: member.accessories,
    gridId: member.garmentGrid.id,
    passed: member.garmentGrid.passedGates,
  };
}

/**
 * The auto-ability rows a girl holds, in the order of the game's list (`kernel/dressphere-abilities.ts#abilityList`): the worn dressphere's (the kernel's job pairs, with the
 * rows the engine has her mastered; a command a pair names as its prerequisite is taken as met, because the engine only lets her learn the ability after it), the rows the gates
 * she has crossed put in her gate slots, the grid's always-on rows (`adapt/auto-grid.ts`; only those that keep a status or set an SOS set, and only for a grid the registry has
 * a plate for), then each accessory's rows. A row already listed is not listed again unless its row is stackable (special bit 2), as the game's list.
 */
export function autoRowsOf(l: AutoLoadout, grids?: GarmentGridRegistry): number[] {
  const out: number[] = [];
  const add = (id: number): void => {
    if (!out.includes(id) || (abilityRow(id).special & 4) !== 0) out.push(id);
  };
  const job = l.dress === undefined ? undefined : JOB_OF_DRESSPHERE[l.dress];
  if (l.dress !== undefined && job !== undefined) {
    const mastered = new Set<number>();
    for (const progress of Object.values(l.learned ?? {})) {
      for (const abilityId of progress.learned) {
        const row = AUTO_ROW_OF_ABILITY[abilityId];
        if (row !== undefined) mastered.add(row);
      }
    }
    const env: Ffx2AbilityEnv = {
      level: l.level,
      learned: (id) => (id >> 12 === 8 ? mastered.has(id) : true),
      keyItem: () => false,
      gateSlots: [],
    };
    for (const id of jobAbilityGroup(girlJob(chrNumber(l.id), job), env)) if (id >> 12 === 8) add(id);
  }
  const plate = GRID_AUTO_STATUS && l.gridId !== undefined ? grids?.get(l.gridId)?.gateRows : undefined;
  if (plate !== undefined) {
    for (const id of gateRows(plate, l.passed)) add(id);
    for (const id of plateRows(plate)) add(id);
  }
  for (const accessory of l.accessories) for (const id of AUTO_ROWS_OF_ACCESSORY[accessory] ?? []) add(id);
  return out;
}

/** The rows a unit holds. */
export function autoAbilityRows(unit: Ffx2Unit, grids?: GarmentGridRegistry): number[] {
  return autoRowsOf(loadoutOfUnit(unit), grids);
}

/**
 * Does the kept layer of these rows hold Double HP (group 1 bit 11, status word `0x800`) or Double MP (bit 12, `0x1000`)? The game's maximum recompute (`0x00636560`) reads the merged
 * status word, which ORs in the effective layer, so a row that keeps the bit doubles the maximum like the Stamina Tonic's status does. No SOS row sets either bit.
 */
export function poolHolds(rows: readonly number[]): { hp: boolean; mp: boolean } {
  const kept = applyAbilityEffects(rows, emptyChrTables()).autoMask1;
  return { hp: (kept & 0x800) !== 0, mp: (kept & 0x1000) !== 0 };
}

/** The layer of a girl, or `null` when she holds no auto-ability row at all (then nothing about her is changed). */
export function buildAutoLayer(unit: Ffx2Unit, grids?: GarmentGridRegistry): Ffx2AutoLayer | null {
  if (unit.side !== 'party') return null;
  const rows = autoAbilityRows(unit, grids);
  if (rows.length === 0) return null;
  const tables = applyAbilityEffects(rows, emptyChrTables());
  return {
    rows,
    words: abilityWords(rows),
    kept: tables.autoMask1 >>> 0,
    keptCnt: [...tables.autoTimes],
    sos: tables.sosMask1 >>> 0,
    sosCnt: [...tables.sosTimes],
    flag: tables.sosFlag,
    eff: 0,
    effCnt: new Array<number>(24).fill(0),
    hpPrev: 0,
  };
}

/** The layer as the kernels read it, with the girl's HP and maximum HP. */
export function layerChr(unit: Ffx2Unit, layer: Ffx2AutoLayer): Ffx2AutoLayerChr {
  return {
    hp: unit.hp,
    maxHp: unit.stats.maxHp,
    kept: layer.kept,
    keptCnt: layer.keptCnt,
    sos: layer.sos,
    sosCnt: layer.sosCnt,
    flag: layer.flag,
    eff: layer.eff,
    effCnt: layer.effCnt,
    hpPrev: layer.hpPrev,
  };
}

/**
 * The engine statuses an effective layer holds, group 1 by bit and then group 2 by slot. A group 2 status is held when its count byte
 * is above 0 (the game's permanent count is 126); a stat stage never is (no row keeps one).
 */
export function effectiveStatuses(eff: number, effCnt: readonly number[]): StatusId[] {
  const out: StatusId[] = [];
  GROUP1_STATUS.forEach((status, i) => {
    if (status !== null && ((eff >>> i) & 1) !== 0) out.push(status);
  });
  GROUP2_STATUS.forEach((statuses, i) => {
    const first = statuses[0];
    if (first !== undefined && !isStageSlot(i) && s8(effCnt[i] ?? 0) > 0) out.push(first);
  });
  return out;
}

/** Does the girl hold an ability word bit (`Chr+0x650`..): word 0 is the counters and Evade & Counter. */
export function holdsWord0(unit: Ffx2Unit, mask: number): boolean {
  const layer = unit.autoLayer;
  return layer !== undefined && (layer.words[0] & mask) !== 0;
}
