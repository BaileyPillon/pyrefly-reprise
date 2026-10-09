/**
 * The game's status slots and the engine's status ids (re-parity W3; **FFX-2 only**).
 *
 * The game keeps statuses in two groups of 24 slots (`research/re-ffx2-hit-status.md` section 4): group 1 are the
 * on/off ailments, one bit each in the status word at `Chr+0x434` (Death 0, Petrify 1, Sleep 2, Silence 3, Darkness 4,
 * Poison 5, Confusion 6, Berserk 7, Curse 8, Defense 9, Eject 10, HP x2 11, MP x2 12, Spellspring 13, Damage 9999 14,
 * Always Critical 15, EXP 0 16, Change Clothes 17, Auto-Life 18); group 2 are the bytes from `Chr+0x438` (Shell 0,
 * Protect 1, Reflect 2, Regen 3, Haste 4, Slow 5, Stop 6, the stages STR 7, MAG 8, DEF 9, MDEF 10, ACC 11, EVA 12,
 * LCK 13, the Doom counter 14, invincible to physical 15, to magical 16, to everything 17). The same index picks a
 * chance byte of the command row, a resist byte of the target and a flag word of the kernels' tables.
 *
 * The engine names a status by id and keeps a stage as two statuses (an Up and a Down, each 0 to 10 stacks); this
 * module is the one table between them. The slot of a status is never guessed: an engine status with no slot (the
 * hidden Delay effect and Action-cancel, Shattering, the FFX-only ones) is simply not a kernel status.
 */

import type { StatusId } from '../../common/types.ts';

/** Group 1, by slot. `null` = a slot the engine has no status for (and none of ours uses). */
export const GROUP1_STATUS: ReadonlyArray<StatusId | null> = [
  'ko', 'petrify', 'sleep', 'silence', 'darkness', 'poison', 'confuse', 'berserk', 'curse', 'defend', 'eject',
  'max-hp-x2', 'max-mp-x2', 'spellspring', 'damage-9999', 'guaranteed-critical', 'pointless', 'itchy', 'auto-life',
  null, null, null, null, null,
];

/** Group 2, by slot: the engine statuses that share the slot (a stage's Up and Down). */
export const GROUP2_STATUS: ReadonlyArray<readonly StatusId[]> = [
  ['shell'], ['protect'], ['reflect'], ['regen'], ['haste'], ['slow'], ['stop'],
  ['str-up', 'str-down'], ['mag-up', 'mag-down'], ['def-up', 'def-down'], ['mdef-up', 'mdef-down'],
  ['accu-up', 'accu-down'], ['eva-up', 'eva-down'], ['luck-up', 'luck-down'],
  ['doom'], ['null-physical'], ['null-magic'], ['invincible'],
  [], [], [], [], [], [],
];

/** The first and last group 2 slot that holds a stat stage (signed, -10 to +10) instead of a timed counter. */
export const STAGE_FIRST = 7;
export const STAGE_LAST = 13;

/** The game's group 1 index of an engine status, or `undefined`. */
export function group1Index(status: StatusId): number | undefined {
  const i = GROUP1_STATUS.indexOf(status);
  return i < 0 ? undefined : i;
}

/** The game's group 2 index of an engine status, or `undefined`. */
export function group2Index(status: StatusId): number | undefined {
  const i = GROUP2_STATUS.findIndex((ids) => ids.includes(status));
  return i < 0 ? undefined : i;
}

/** Where a status lives: `{ group, index }`, or `undefined` for a status the game keeps nowhere in these tables. */
export function slotOf(status: StatusId): { group: 1 | 2; index: number } | undefined {
  const g1 = group1Index(status);
  if (g1 !== undefined) return { group: 1, index: g1 };
  const g2 = group2Index(status);
  return g2 === undefined ? undefined : { group: 2, index: g2 };
}

/** True for a group 2 slot that holds a stage (a signed -10 to +10 step count). */
export function isStageSlot(index: number): boolean {
  return index >= STAGE_FIRST && index <= STAGE_LAST;
}

/** The Up status of a stage slot (the sign of a positive step). */
export function stageUp(index: number): StatusId {
  return GROUP2_STATUS[index]?.[0] as StatusId;
}

/** The Down status of a stage slot. */
export function stageDown(index: number): StatusId {
  return GROUP2_STATUS[index]?.[1] as StatusId;
}
