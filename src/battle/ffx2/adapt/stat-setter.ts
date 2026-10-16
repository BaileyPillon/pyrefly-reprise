/**
 * The script stat setter on the engine's units (re-parity RC9, lane X2-E; **FFX-2 only**).
 *
 * `kernel/stat-setter.ts` is the game's `btlSetStat` over the game's character records. This is the one place the engine's {@link Ffx2Unit}s become that world and the
 * setter's stores become engine state. The engine has no byte records, so only the fields it models are mapped; everything else is named, not silently dropped.
 *
 * **What a unit answers** (reads): its game slot (`assignSlotIds`: the party 0 to 14, the enemies 15 to 30 by slot then position, so a script's `chr_mon2` is the second
 * enemy of the scene); in the battle (`Chr+0x1784`): not removed, and not a dead monster whose pattern takes it out of the battle; gone (`+0x1792`): the `hidden` flag; the
 * applied status word's low byte (`+0x450`): bit 0 is the Death status. The species word (`+0xe`), the invincible-motion byte (`+0x2ec`) and the model object have no engine
 * counterpart and read 0.
 *
 * **What a store reaches** (writes): the hit points (`+0x3b4`, raw, no clamp, no KO routine), the death pattern (`+0x2d8`; the copy a revive restores, `+0x2da`, is the same
 * byte and the engine keeps one) and Agility (`+0x39a`). A store to any other offset throws, so a script that starts to use an id the engine does not model is a failing test,
 * not a lost write. A hit-point write that clears the Death bit (the in-place revival of the Act III death entries, row XE3) throws too: it is not built, it waits for the
 * window of No Love Lost (`docs/handoff/re-parity-rc9-x2-stat-setter.md`). The routines the setter asks for after a store are not run: the low-HP check and the HP-state
 * refresh that follow a hit-point write mean nothing to a monster (the SOS flag and the weak pose are a girl's and the presenter's), and a monster's status recompute only
 * follows the ids that are not mapped.
 */

import type { Ffx2Unit } from '../internal.ts';
import { assignSlotIds } from './inputs.ts';
import { leavesOnDeath } from './death-patterns.ts';
import {
  APPLIED_STATUS_OFFSET,
  DEATH_PATTERN_OFFSET,
  DEATH_PATTERN_REVIVE_OFFSET,
  HP_OFFSET,
  setStat,
  type StatResult,
  type StatWorld,
  type StatWrite,
} from '../kernel/stat-setter.ts';

/** `Chr+0x39a`, the Agility byte the recovery formula divides by. */
const AGILITY_OFFSET = 0x39a;

function worldOf(bySlot: ReadonlyMap<number, Ffx2Unit>): StatWorld {
  const nothing = (kind: string, offset: number): never => {
    throw new Error(`stat setter: the engine has no field for ${kind} Chr+0x${offset.toString(16)}`);
  };
  return {
    u8(slot, offset) {
      const unit = bySlot.get(slot);
      switch (offset) {
        case 0x1784: // in the battle: a monster that fell with a death pattern left it
          return unit !== undefined && !unit.removed && !(!unit.alive && leavesOnDeath(unit)) ? 1 : 0;
        case 0x1792: // gone
          return unit?.flags.hidden === true ? 1 : 0;
        case APPLIED_STATUS_OFFSET: // the Death status is bit 0 of the applied word
          return unit?.statuses['ko'] !== undefined ? 1 : 0;
        case 0x2ec:
          return 0;
        default:
          return nothing('u8', offset);
      }
    },
    u16: (_slot, offset) => (offset === 0xe ? 0 : nothing('u16', offset)),
    u32: (_slot, offset) => (offset === 0 ? 0 : nothing('u32', offset)),
  };
}

function applyWrite(unit: Ffx2Unit, w: StatWrite, id: number): void {
  if (unit.side !== 'enemy') throw new Error(`stat setter: stat ${id} reached ${unit.id}; the shipped scripts write monsters only`);
  switch (w.offset) {
    case HP_OFFSET:
      unit.hp = w.value | 0;
      return;
    case DEATH_PATTERN_OFFSET:
      unit.deathPattern = w.value;
      return;
    case DEATH_PATTERN_REVIVE_OFFSET:
      return; // the pattern a revive puts back: the engine keeps the one byte
    case AGILITY_OFFSET:
      unit.stats = { ...unit.stats, agi: w.value };
      return;
    case APPLIED_STATUS_OFFSET:
      throw new Error('stat setter: a hit-point write that revives a dead monster in place is lane X2-E row XE3, which is not built (it waits for the window of No Love Lost)');
    default:
      throw new Error(`stat setter: the engine has no field for Chr+0x${w.offset.toString(16)} (stat ${id}), which no wired script writes`);
  }
}

/**
 * `btlSetStat(spec, id, value)` for the script of `owner` (`btlSetStat2` is the same call with `GROUP_OWN`). Runs the kernel over the units and applies the stores to the
 * ones the spec names; returns the kernel's answer (the number of slots visited, the stores and the routines asked for).
 */
export function applyStat(units: readonly Ffx2Unit[], owner: Ffx2Unit, id: number, spec: number, value: number): StatResult {
  const slots = assignSlotIds(units);
  const bySlot = new Map<number, Ffx2Unit>();
  for (const [unit, slot] of slots) bySlot.set(slot, unit);
  const ownerSlot = slots.get(owner);
  if (ownerSlot === undefined) throw new Error(`stat setter: ${owner.id} is not one of the battle's units`);
  const result = setStat(worldOf(bySlot), ownerSlot, id, spec, value);
  for (const w of result.writes) {
    const unit = bySlot.get(w.slot);
    if (unit !== undefined) applyWrite(unit, w, id);
  }
  return result;
}
