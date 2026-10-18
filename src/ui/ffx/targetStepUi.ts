/**
 * The HUD's half of **target-step parity** (re-parity RC11, lane "FFX target parity"; **FFX only**; the engine's half and the switch are `battle/ffx/target-step-parity.ts`, the handoff is
 * `docs/handoff/re-parity-rc11-ffx-target-parity.md`). Small helpers so `CommandMenu.ts` (already past 400 lines) grows by calls, not logic: all of the new logic lives here.
 *
 * Everything here reads `AvailableCommand.targetStep` (set only while the switch is on) or the switch itself, so with the switch off each helper answers what the menu always did.
 */

import type { AbilityCategory, AvailableCommand, CombatantId } from '../../battle/common/types.ts';
import { targetStepParity } from '../../battle/ffx/target-step-parity.ts';
import type { TopGroupRow } from './CommandMenuLogic.ts';
import type { TargetCursor, TargetEntry } from './TargetCursor.ts';

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

/**
 * Opens the single-target cursor on a row's candidates. `showSingle` counts from the LEFT OF THE SCREEN, not into `entries` (the engine's slot-then-id order once opened on the aeon
 * mid-field, away from the player's eye). A row that may also point at the party opens on the side the engine prefers (`preferredTargets`); with the switch on, on the target step's own
 * start (parity item `cursorStart`).
 */
export function openStepCursor(cursor: TargetCursor, entries: TargetEntry[], cmd: AvailableCommand): void {
  cursor.showSingle(entries, 0, startPreference(cmd));
}

/**
 * Target-step parity (item `sideSwitch`): L1 / R1 in the target step show the other side of the row's step, opening on its first candidate. Which side is showing is read off the cursor
 * (its active id is one of the step's `switchTo` ids or one of its own candidates; the two sets are disjoint). Returns whether the cursor moved: `false`, and nothing touched, for a group
 * step, a row with no `switchTo` (every row while the switch is off) or no pending row.
 */
export function switchStepSide(
  cursor: TargetCursor,
  cmd: AvailableCommand | null,
  group: readonly CombatantId[] | null,
  entryFor: (id: CombatantId, cmd: AvailableCommand) => TargetEntry,
): boolean {
  if (!cmd || group) return false;
  const active = cursor.activeTargetId;
  const ids = stepSideIds(cmd, !(active !== null && cmd.targetStep?.switchTo?.includes(active)));
  if (!ids) return false;
  cursor.showSingle(ids.map((id) => entryFor(id, cmd)), 0, [ids[0]!]);
  return true;
}

/** The groups the original draws as openers whose list always opens, even with one entry (FFX-G11e section 6 row 11; the resolver gives an opener its list number whenever the list is not empty). */
const LIST_OPENERS: ReadonlySet<AbilityCategory> = new Set<AbilityCategory>(['skill', 'special', 'blackmagic', 'whitemagic', 'summon', 'item']);

/**
 * The five characters whose Overdrive row is a real list opener in the original: the install's records 0x3119 to 0x311D (Swordplay, Ronso Rage, Bushido, Reels, Fury), owned by Tidus,
 * Kimahri, Auron, Wakka and Lulu, with the per-character list builder (0x79BB50) putting them in the root list. No other Overdrive row is an opener record: an aeon's Overdrives are direct
 * commands that sit in the root list beside its Attack (type 1 records), Yuna's row (0x3118 Grand Summon) is itself the opener of the aeon list and Rikku's (0x311E Mix) of the Mix list, and
 * those two lists are our existing pickers (`overdrive` rows that open an overlay on choosing). Check B1 of 2026-10-18.
 */
const OVERDRIVE_OPENER_OWNERS: ReadonlySet<string> = new Set(['tidus', 'kimahri', 'auron', 'wakka', 'lulu']);

/**
 * Does choosing this group open its list even though it holds one enabled entry? Item `openerOne`. The Switch group always opens already; the `aeon` group (an aeon's Shield, Boost, Dismiss) is
 * not an opener in the original (those are separate commands) and keeps the old shortcut; the Overdrive group is an opener only for the five characters above (`actorId` is the one whose menu it
 * is), never for an aeon, Yuna's Grand Summon or Rikku's Mix.
 */
export function opensList(row: TopGroupRow, actorId?: CombatantId): boolean {
  if (row.role === 'switch' || !targetStepParity('openerOne')) return false;
  if (row.category === 'overdrive') return actorId !== undefined && OVERDRIVE_OPENER_OWNERS.has(actorId);
  return LIST_OPENERS.has(row.category);
}
