/**
 * Laying the game's monster rows on the FFX-2 enemy data (re-parity W3; **FFX-2 only**).
 *
 * `MONSTER_RECORDS` (`./records.ts`) holds one row per enemy of the seven chapters, keyed `group id / enemy id`.
 * `attachMonsterRecords` is called where each enemy group is defined (`src/data/ffx2/enemies/*.ts`), so the enemy
 * objects every importer sees carry the row. It attaches the row (`EnemyDef.ffx2Record`) and corrects, in place, the
 * authored fields the FFX-2 kernels read, where the row differs:
 *
 * - **Accuracy.** The enemy data carried 0 ("absent from the record"); every monster row says 95, and accuracy
 *   formula 2 (the plain Attack of every monster) reads it.
 * - **The resist bytes.** For every status the engine has a slot for (`../../../battle/ffx2/adapt/slots.ts`) the
 *   row's byte replaces the authored one (a byte of 0 removes the key); statuses with no slot (the hidden Delay and
 *   Action-cancel) keep what was authored.
 * - **Steal.** The item-steal chance byte, and the figure Pilfer Gil takes (the gil chance byte is 255 for every
 *   monster, `research/re-ffx2-ai-leblanc-den-ixion.md` section 1.9).
 *
 * Nothing else is touched: levels, HP and the stat bytes stay as authored, and `research/re-ffx2-commands.md` section 7
 * lists where they differ from the rows. Idempotent: calling it again changes nothing.
 */

import type { EnemyDef, EnemyGroupDef, FFX2MonsterRecord, StatusId } from '../../../battle/common/types.ts';
import { GROUP1_STATUS, GROUP2_STATUS } from '../../../battle/ffx2/adapt/slots.ts';
import { MONSTER_RECORDS } from './records.ts';

export { MONSTER_RECORDS } from './records.ts';

/** Lay one monster row on one enemy and correct the fields it supersedes. */
export function applyMonsterRecord(enemy: EnemyDef, record: FFX2MonsterRecord): void {
  enemy.ffx2Record = record;
  enemy.stats.acc = record.acc;

  const resist: Partial<Record<StatusId, number>> = { ...enemy.immunities };
  const set = (status: StatusId, byte: number): void => {
    if (byte > 0) resist[status] = byte;
    else delete resist[status];
  };
  GROUP1_STATUS.forEach((status, i) => {
    if (status !== null) set(status, record.resist1[i] ?? 0);
  });
  GROUP2_STATUS.forEach((statuses, i) => {
    for (const status of statuses) set(status, record.resist2[i] ?? 0);
  });
  enemy.immunities = resist;

  if (enemy.rewards.steal !== undefined) enemy.rewards.steal.stealRate = record.stealByte;
  if (record.stealGil > 0) enemy.rewards.stolenGil = record.stealGil;
}

/** Lay the rows on every enemy and part of a group (the same group is returned). */
export function attachMonsterRecords<G extends EnemyGroupDef>(group: G): G {
  for (const enemy of [...group.enemies, ...(group.parts ?? [])]) {
    const record = MONSTER_RECORDS[`${group.id}/${enemy.id}`];
    if (record !== undefined) applyMonsterRecord(enemy, record);
  }
  return group;
}
