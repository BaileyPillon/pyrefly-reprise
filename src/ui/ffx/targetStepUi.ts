/**
 * The HUD's half of **target-step parity** (re-parity RC11, lane "FFX target parity"; **FFX only**; the engine's half and the switch are `battle/ffx/target-step-parity.ts`, the handoff is
 * `docs/handoff/re-parity-rc11-ffx-target-parity.md`). Small pure helpers so `CommandMenu.ts` (already past 400 lines) grows by calls, not logic.
 *
 * Everything here reads `AvailableCommand.targetStep` (set only while the switch is on) or the switch itself, so with the switch off each helper answers what the menu always did.
 */

import type { AbilityCategory, AvailableCommand, CombatantId } from '../../battle/common/types.ts';
import { targetStepParity } from '../../battle/ffx/target-step-parity.ts';
import type { TopGroupRow } from './CommandMenuLogic.ts';

/** Who the cursor should open on: the target step's start (the user for a cure, the first KO'd ally for a revive, index 0 of the foes), else the engine's old aim hint. */
export function startPreference(cmd: AvailableCommand): readonly CombatantId[] | undefined {
  const start = cmd.targetStep?.start;
  return start !== undefined ? [start] : cmd.preferredTargets;
}

/**
 * The candidates of one side of a row's target step: the row's own side, or (`other`) the side the cursor can be switched to. `null` when the row cannot be switched (no `switchTo`), which is
 * every row while the switch is off.
 */
export function stepSideIds(cmd: AvailableCommand, other: boolean): CombatantId[] | null {
  const step = cmd.targetStep;
  if (!step || !step.switchTo || step.switchTo.length === 0) return null;
  return other ? [...step.switchTo] : [...step.candidates];
}

/** The groups the original draws as openers whose list always opens, even with one entry (FFX-G11e section 6 row 11; the resolver gives an opener its list number whenever the list is not empty). */
const LIST_OPENERS: ReadonlySet<AbilityCategory> = new Set<AbilityCategory>(['skill', 'special', 'blackmagic', 'whitemagic', 'summon', 'overdrive', 'item']);

/**
 * Does choosing this group open its list even though it holds one enabled entry? Item `openerOne`. The Switch group always opens already; the `aeon` group (an aeon's Shield, Boost, Dismiss) is
 * not an opener in the original (those are separate commands) and keeps the old shortcut.
 */
export function opensList(row: TopGroupRow): boolean {
  return row.role !== 'switch' && LIST_OPENERS.has(row.category) && targetStepParity('openerOne');
}
