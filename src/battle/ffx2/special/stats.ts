/**
 * The stats of a Special dressphere's parts, and what a part carries innately (FFX-2 only; `research/re-ffx2-special-dresspheres.md` sections 3 and 5).
 *
 * The numbers are the game's own, not the wiki's anchors: each part has its own growth row (`kernel/dressphere-growth.ts`, `job.bin` ids 0x500f to 0x5017), the ten numbers come from
 * `kernel/dressphere-stats.ts#calculateStatsFor`, and the final stage multiplies HP, MP, Strength, Defense, Magic and Magic Defense by `(nodes + 25) / 25` for a Special part
 * (`finalStats`, exe 0x0060e2d0: 2 nodes x1.08, 6 nodes x1.24). **The main body is the girl's own record**, so it reads her Garment Grid's node count; **a pod is a child record** whose
 * plate the shipped initial rows leave at grid 0, which has 6 nodes (`re-ffx2-dressphere.md` section 2.6), so a pod is always x1.24. Whether play rewrites a pod's plate is open
 * (the game was not observed); the community's own tables, which print the unscaled rows, are the alternative [the research note, section 5].
 *
 * Every part carries Ribbon (auto-ability row 0x8068): its wards, read from the game's row, include Eject (a ward of 255 on slot 10), so a Special part cannot be Ejected by data, not by a rule
 * of ours, and Doom. Double HP and Triple HP (rows 0x8072 and 0x8073, +100 percent of HP each) are abilities a part learns (20 and 30 AP); a part whose build names no list has only the commands the game lists
 * from the start (`enter.ts`; `forms.ts#masteredLearned` is a part with everything learned). Break HP Limit and Break Damage Limit need the key items, which the engine does not model, so they are never on.
 */

import type { StatBlock, StatusId } from '../../common/types.ts';
import { GROUP1_STATUS, GROUP2_STATUS } from '../adapt/slots.ts';
import { abilityEffects } from '../kernel/ability-effects-data.ts';
import { BLOCK_SCALE, BLOCK_SIZE, calculateStatsFor, finalStats } from '../kernel/dressphere-stats.ts';
import { abilityRow } from '../kernel/dressphere-rows.ts';

/** The row of the Ribbon every Special part carries (a_ability.bin row 104). */
export const SPECIAL_RIBBON_ROW = 0x8068;
/** Double HP and Triple HP (rows 0x8072 and 0x8073). */
export const DOUBLE_HP_ROW = 0x8072;
export const TRIPLE_HP_ROW = 0x8073;

/** The nodes a pod's scale reads (grid 0 of the shipped initial rows: 6 nodes). */
export const POD_SCALE_NODES = 6;

/** The passives a part's learned list names, by the ids we give them (`x2-<part>-double-hp`, `-triple-hp`). */
export function passiveId(dressphere: string, passive: 'double-hp' | 'triple-hp'): string {
  return `x2-${dressphere}-${passive}`;
}

/** Does the part's learned list hold this passive? Only a list that names it: a part whose build names none knows its free commands and no passive (`enter.ts`). */
export function hasPassive(learned: readonly string[] | undefined, dressphere: string, passive: 'double-hp' | 'triple-hp'): boolean {
  return learned !== undefined && learned.includes(passiveId(dressphere, passive));
}

/** The stats of one part at a level, with the grid's node count for the scale and the passives it holds. */
export function specialPartStats(job: number, level: number, nodes: number, rows: readonly number[]): StatBlock {
  const base = calculateStatsFor(Math.max(1, Math.min(99, Math.round(level))), job).stats;
  const block = new Array<number>(BLOCK_SIZE).fill(0);
  for (let k = 0; k < 6; k++) block[BLOCK_SCALE + k] = nodes;
  for (const id of rows) {
    const up = abilityRow(id).up;
    for (let k = 0; k < 10; k++) block[k] = (block[k] as number) + (up[k] as number);
  }
  const s = finalStats({ base, block, special: true, hpLimitBroken: false, mpLimitBroken: false });
  return { hp: s.maxHp, mp: s.maxMp, str: s.str, def: s.def, mag: s.mag, mdef: s.mdef, agi: s.agi, luck: s.lck, eva: s.eva, acc: s.acc, maxHp: s.maxHp, maxMp: s.maxMp };
}

/** The stat-changing auto-ability rows a part holds, from its learned list. */
export function passiveRows(learned: readonly string[] | undefined, dressphere: string): number[] {
  const rows: number[] = [];
  if (hasPassive(learned, dressphere, 'double-hp')) rows.push(DOUBLE_HP_ROW);
  if (hasPassive(learned, dressphere, 'triple-hp')) rows.push(TRIPLE_HP_ROW);
  return rows;
}

/** The statuses the Special's Ribbon wards, at the resist byte 255 (read from row 0x8068 through the game's slot tables). */
export function ribbonWards(): Partial<Record<StatusId, number>> {
  const effects = abilityEffects(SPECIAL_RIBBON_ROW);
  const out: Partial<Record<StatusId, number>> = {};
  if (effects === undefined) return out;
  for (const [slot, byte] of effects.ward1) {
    const status = GROUP1_STATUS[slot];
    if (status !== null && status !== undefined && byte === 255) out[status] = 255;
  }
  for (const [slot, byte] of effects.ward2) {
    if (byte !== 255) continue;
    for (const status of GROUP2_STATUS[slot] ?? []) out[status] = 255;
  }
  return out;
}
