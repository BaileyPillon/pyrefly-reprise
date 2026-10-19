/**
 * **Doublecast as two picks: the menu's model** (FFX only; Bailey's pick of Option A "Second round", decision queue item 103, delegated).
 *
 * The game composes Lulu's Doublecast as two spell-and-target pairs, one after the other: the Black Magic list, that spell's target step,
 * the same list again with the first cast's price held against the second pick, and the second target step, which commits both
 * (`research/re-ffx-g07`, handoff `docs/handoff/re-parity-rc10-ffx-doublecast.md` sections 1 and 6). This module is that flow as plain data and pure
 * functions, with no DOM: `DoublecastFlow.ts` drives it for `CommandMenu`, `doublecastText.ts` words it.
 *
 * **The UI re-derives no rule.** Which rows round 2 offers is the engine's own verdict, `doublecastPicks(...).second.enabled`
 * (`battle/ffx/doublecast.ts`, handed to the HUD as a {@link DoublecastPicksSource}); this file only copies that answer onto the rows. It adds no
 * cost to any other, compares no MP, and never decides a spell fits. The one sum it shows ("12 MP left") is the MP on the card minus the engine's own
 * `pendingMp`; "left after" is the engine's `mpAfter`.
 *
 * Game case: **FFX only** (AGENTS.md rule 14): only the FFX engine publishes a wrapper row and a picker; FFX-2 and FF7 never reach this.
 */

import type { AnyCombatant, AvailableCommand, Command, CombatantId } from '../../battle/common/types.ts';
import type { DoublecastPick } from '../../battle/ffx/doublecast.ts';
import { wrappedGroup, type TopGroupRow } from './CommandMenuLogic.ts';

/** The engine's picker, bound to the live battle: `FFXEngine.doublecastPicks`. Optional: a HUD with none keeps round 2's rows as the engine offered them. */
export type DoublecastPicksSource = (actorId: CombatantId, firstId?: string) => readonly DoublecastPick[];

/** The first pick, once its target is chosen. */
export interface DoublecastFirst {
  cmd: AvailableCommand;
  targets: CombatantId[];
}

/** One open Doublecast: the wrapper row, the list on screen, which round it is, and where Esc finally returns to. */
export interface DoublecastWrap {
  wrapper: AvailableCommand;
  /** The list on screen: round 1 as the engine offered it; round 2 with the engine's second-pick verdicts on its rows. */
  group: TopGroupRow;
  /** Round 1's list, kept so Back from round 2 can show it again. */
  roundOne: TopGroupRow;
  round: 1 | 2;
  /** Set in round 2. */
  first: DoublecastFirst | null;
  /** The engine's second-pick answer for `first` (null in round 1, or when the HUD has no picker). */
  picks: readonly DoublecastPick[] | null;
  /** Where Esc steps back to from round 1's list: the Special list or the top row. */
  back: 'top' | 'sub';
  backIndex: number;
}

/** What the HUD draws around a Doublecast that is in its second round: the lock chip on the first target and the MP preview on the caster's card. */
export interface DoublecastView {
  round: 1 | 2;
  actorId: CombatantId;
  /** Round 2 only: where cast 1 goes (the gold lock chip hangs on it). */
  firstTargetId: CombatantId | null;
  /** Cast 1's spell, for the chip ("Fira"). */
  firstLabel: string;
  /** The caster's MP preview: what is on the card, what cast 1 holds, what is left. Round 2 only. */
  pending: { mp: number; spent: number; left: number } | null;
}

/** Open the wrapper's first round, or `null` when it wraps nothing or nothing in the list can be cast. */
export function openWrap(wrapper: AvailableCommand, commands: readonly AvailableCommand[], back: 'top' | 'sub', backIndex: number, opensOnGrey = false): DoublecastWrap | null {
  const group = wrappedGroup(wrapper, commands);
  if (!group || (!group.items.some((c) => c.enabled) && !(opensOnGrey && group.items.length > 0))) return null; // `opensOnGrey` (menu-draw parity, item openers): an opener opens onto grey spells
  return { wrapper, group, roundOne: group, round: 1, first: null, picks: null, back, backIndex };
}

/** `cmd` copied with the engine's second-pick verdict on it (`enabled`, and the reason when it is greyed). */
function withVerdict(cmd: AvailableCommand, pick: DoublecastPick | undefined): AvailableCommand {
  if (!pick?.second) return cmd;
  const { disabledReason: _was, ...rest } = cmd;
  const reason = pick.second.reason ?? 'Not enough MP';
  return pick.second.enabled ? { ...rest, enabled: true } : { ...rest, enabled: false, disabledReason: reason };
}

/** Round 1's list with the engine's second-pick verdicts applied: same rows, same order, same prices. */
export function roundTwoGroup(roundOne: TopGroupRow, picks: readonly DoublecastPick[] | null): TopGroupRow {
  if (!picks) return roundOne;
  const byId = new Map(picks.map((p) => [p.id, p]));
  return { ...roundOne, items: roundOne.items.map((c) => withVerdict(c, byId.get(c.command.kind === 'ability' ? c.command.id : ''))) };
}

/**
 * Cast 1 is chosen and aimed: round 2's list comes back. `picks` is the engine's answer for this first spell (or `null`).
 * The cursor lands on the spell just used while it is still offered, else the nearest offered row (`landingIndex`).
 */
export function lockFirst(wrap: DoublecastWrap, first: DoublecastFirst, picks: readonly DoublecastPick[] | null): { wrap: DoublecastWrap; index: number } {
  const group = roundTwoGroup(wrap.roundOne, picks);
  const used = group.items.findIndex((c) => sameRow(c, first.cmd));
  return { wrap: { ...wrap, round: 2, first, picks, group }, index: landingIndex(group.items, used) };
}

/** Back from round 2's list: round 1's list again, cast 1 forgotten (its target step opens first, with the cursor on its old target). */
export function unlockFirst(wrap: DoublecastWrap): { wrap: DoublecastWrap; cmd: AvailableCommand; prefer: CombatantId[] } | null {
  if (wrap.round !== 2 || !wrap.first) return null;
  const { cmd, targets } = wrap.first;
  return { wrap: { ...wrap, round: 1, first: null, picks: null, group: wrap.roundOne }, cmd, prefer: targets };
}

function sameRow(a: AvailableCommand, b: AvailableCommand): boolean {
  return a.command.kind === 'ability' && b.command.kind === 'ability' && a.command.id === b.command.id;
}

/**
 * Where the cursor lands in a list: the row it was on (`from`) while that row is offered, else the nearest offered row (a tie goes to the one above),
 * else `from` itself (nothing is offered: a dead end keeps its greyed rows and the cursor where cast 1 was).
 */
export function landingIndex(items: readonly AvailableCommand[], from: number): number {
  const at = Math.max(0, Math.min(items.length - 1, from));
  for (let d = 0; d < items.length; d++) {
    if (items[at - d]?.enabled) return at - d;
    if (items[at + d]?.enabled) return at + d;
  }
  return at;
}

/** Round 2 and nothing in the list is offered (the engine greyed every row): the dead end. */
export function noSecondSpell(wrap: DoublecastWrap): boolean {
  return wrap.round === 2 && !wrap.group.items.some((c) => c.enabled);
}

/**
 * The command a finished Doublecast submits: the wrapper's own id and the two casts in order, each its spell and its own target (`AbilityCommand.casts`).
 * `targets` is required by the type and unread when `casts` is present, so it is `[]` (handoff section 6, item 2).
 */
export function doublecastCommand(wrap: DoublecastWrap, second: AvailableCommand, secondTargets: CombatantId[]): Command | null {
  const first = wrap.first;
  if (wrap.wrapper.command.kind !== 'ability' || second.command.kind !== 'ability' || first?.cmd.command.kind !== 'ability') return null;
  return {
    kind: 'ability',
    id: wrap.wrapper.command.id,
    targets: [],
    casts: [
      { id: first.cmd.command.id, targets: first.targets.slice() },
      { id: second.command.id, targets: secondTargets.slice() },
    ],
  };
}

/** The caster's MP preview for round 2: the MP on the card, the first cast's price held against the second pick (the engine's `pendingMp`), and what is left. */
export function pendingMp(wrap: DoublecastWrap, actor: AnyCombatant | undefined): { mp: number; spent: number; left: number } | null {
  if (wrap.round !== 2 || !wrap.first || !actor) return null;
  const row = wrap.picks?.find((p) => p.id === pickId(wrap.first!.cmd));
  const spent = row?.second?.pendingMp ?? row?.mpCost ?? wrap.first.cmd.mpCost;
  return { mp: actor.mp, spent, left: actor.mp - spent };
}

/** The MP left once both casts are paid, when the second spell is `cmd`: the engine's own `mpAfter`; `null` without an engine verdict. */
export function mpAfterSecond(wrap: DoublecastWrap, cmd: AvailableCommand | undefined): number | null {
  if (!cmd || cmd.command.kind !== 'ability') return null;
  const at = wrap.picks?.find((p) => p.id === (cmd.command as { id: string }).id)?.second;
  return at ? at.mpAfter : null;
}

function pickId(cmd: AvailableCommand): string {
  return cmd.command.kind === 'ability' ? cmd.command.id : '';
}

/** What the target step of `where` shows ("Yu Pagoda A", "All enemies"): the names the field and the CTB list print. */
export function aimLabel(targets: readonly CombatantId[], combatants: Readonly<Record<CombatantId, AnyCombatant>>, tagOf?: (id: CombatantId) => string | undefined): string {
  if (targets.length === 0) return '';
  if (targets.length > 1) return combatants[targets[0]!]?.side === 'enemy' ? 'All enemies' : 'All allies';
  const id = targets[0]!;
  const tag = tagOf?.(id);
  const name = combatants[id]?.name ?? id;
  return tag ? `${name} ${tag}` : name;
}
