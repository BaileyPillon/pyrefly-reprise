/**
 * *What the other girls have already spent.*
 *
 * FFX-2's ATB lets a second girl open her menu while the first one's command
 * is still running down its purple charge bar [research/ffx2-combat-core.md
 * §1.1, §1.3; `AtbState.charging`]. That command is chosen, targeted and
 * paid for in everything but the stock count — the engine takes the item off
 * the shelf when the action resolves, not when it is picked (`execute.ts`,
 * "decremented on the resolving action"). A card that reads only the board as
 * it stands therefore sees Paine still Blind and Rikku still down, and tells
 * the next girl to spend the same Eye Drops or Phoenix Down on the same body.
 * One of the two items does nothing [critic round 09, PR-0088: Chapter 6,
 * seed 1, battle-log seq 868/871/906 and 1282/1286/1303].
 *
 * This module is the one reading of "already committed" the card uses:
 *
 *  - {@link committedByAllies} simulates every **other** active girl's charging
 *    command on this board (the engine's own resolution, `simulate.ts`) and
 *    records which statuses it takes off whom, which statuses it puts on
 *    which ally, whom it stands back up, and how many of each item it will use;
 *  - {@link spentAlready} is true for a row that only repeats that — every cure,
 *    every ally status it grants and every raise it makes is already on its
 *    way, and it does nothing else measurable — or that counts on stock a
 *    queued item has already spoken for.
 *
 * **Party buffs count** (release 09 repair). A second Light or Lunar Curtain
 * behind one already charging adds nothing: the first grants Protect (Shell)
 * to all three, and the engine's `applyStatus` returns null for a status that
 * is already there, so the second item is used up for no effect. The first
 * cut of this module read only cures and raises and offered it anyway (18
 * times over 20 Chapter 6 runs under Wait, the verifier's probe
 * `critic/scratch/release-09-repair/probe-advisor-committed.test.ts`). HP
 * healing is deliberately not "covered": a second Hi-Potion still adds HP.
 *
 * ## Which game
 *
 * **FFX-2 only** [AGENTS.md rule 14]. FFX is CTB: one actor at a time, and a
 * chosen command resolves before the next turn opens [research/ffx-combat-core.md
 * §1.1], so no FFX board ever carries a committed command when a menu is open.
 * {@link committedByAllies} returns the empty reading for any board that is not
 * FFX-2, which makes the whole rule a no-op there
 * (`tests/unit/advisor-committed.test.ts` asserts it on every FFX chapter).
 *
 * **The held command** (PR-0076, `FFX2Engine.heldCommand()`) is the other
 * kind of committed: a command a chain-locked girl confirmed, which fires when
 * the chain window closes. It lives on the engine, not on `BattleState`, so it
 * reaches this module only when the caller passes it (`CommittedOptions
 * .queued`, `AdvisorOptions.queued`). Measured under Active at 1.5 s a
 * decision, it is every double-spend left once the charge bar is read.
 *
 * Pure and DOM-free, like the rest of `tactics/`.
 */

import type { BattleState, CombatantId, Command } from '../../battle/common/types.ts';
import type { AbilityRegistry, ItemRegistry } from '../../battle/ffx2/internal.ts';
import { simulateFFX2Command } from '../../battle/ffx2/simulate.ts';
import type { SimOutcome } from '../../battle/ffx/simulate.ts';

/** What the other girls' queued commands will do. Empty outside FFX-2. */
export interface Committed {
  /** Item id -> how many queued commands will use one. */
  uses: Map<string, number>;
  /** `"<targetId>:<status>"` for every status a queued command takes off an ally. */
  cures: Set<string>;
  /** `"<targetId>:<status>"` for every status a queued command puts on an ally (Protect from a Curtain). */
  buffs: Set<string>;
  /** Everyone a queued command stands back up -> who is raising them, and with what. */
  revives: Map<CombatantId, IncomingRaise>;
}

/** A raise already on its way: whose command it is and what the move is called. */
export interface IncomingRaise {
  by: CombatantId;
  name: string;
}

/** The registries the live engine was built with; structurally `AdvisorOptions`. */
export interface CommittedOptions {
  ffx2?: { abilities?: AbilityRegistry; items?: ItemRegistry };
  /**
   * Commands confirmed but not yet on `BattleState` — today only
   * `FFX2Engine.heldCommand()`. A caller with an engine passes it; one without
   * gets the charge-bar reading alone.
   */
  queued?: () => readonly QueuedCommand[];
}

/** One confirmed command and who it belongs to (the shape of `HeldCommand`). */
export interface QueuedCommand {
  actorId: CombatantId;
  command: Command;
}

/** The held commands a caller passed, read once and never allowed to throw. */
export function queuedFrom(options: CommittedOptions): readonly QueuedCommand[] {
  try {
    return options.queued?.() ?? [];
  } catch {
    return [];
  }
}

/** The reading for a board with nothing queued. */
export function nothingCommitted(): Committed {
  return { uses: new Map(), cures: new Set(), buffs: new Set(), revives: new Map() };
}

/** True when {@link committedByAllies} found nothing, so the card can skip the check. */
export function isEmpty(c: Committed): boolean {
  return c.uses.size === 0 && c.cures.size === 0 && c.buffs.size === 0 && c.revives.size === 0;
}

function chargingCommand(state: Readonly<BattleState>, id: CombatantId): Command | null {
  const c = state.combatants[id] as { alive?: boolean; atb?: { charging?: { commandRef?: Command } | null } } | undefined;
  if (!c || c.alive === false) return null;
  return c.atb?.charging?.commandRef ?? null;
}

/**
 * Every command another active girl has on her charge bar (or held, when the
 * caller passed it), resolved on this board at the median roll. See the
 * module note.
 */
export function committedByAllies(
  state: Readonly<BattleState>,
  actorId: CombatantId,
  options: CommittedOptions = {},
): Committed {
  const out = nothingCommitted();
  if (state.game !== 'ffx2') return out;
  const pending: QueuedCommand[] = [];
  for (const id of state.activeIds) {
    const command = chargingCommand(state, id);
    if (command) pending.push({ actorId: id, command });
  }
  for (const q of queuedFrom(options)) {
    if (state.activeIds.includes(q.actorId) && state.combatants[q.actorId]?.alive !== false) pending.push(q);
  }
  for (const { actorId: id, command } of pending) {
    if (id === actorId) continue;
    if (command.kind === 'item') {
      const key = String(command.id);
      out.uses.set(key, (out.uses.get(key) ?? 0) + 1);
    }
    let sim: SimOutcome | null = null;
    try {
      sim = simulateFFX2Command(state, id, command, {
        roll: 'mid',
        ...(options.ffx2?.abilities ? { abilities: options.ffx2.abilities } : {}),
        ...(options.ffx2?.items ? { items: options.ffx2.items } : {}),
      }) as SimOutcome | null;
    } catch {
      sim = null;
    }
    if (!sim) continue;
    for (const change of sim.statusChanges) {
      if (state.combatants[change.targetId]?.side === 'enemy') continue;
      (change.applied ? out.buffs : out.cures).add(`${change.targetId}:${change.status}`);
    }
    const name = sim.ability?.name ?? ('id' in command ? String(command.id) : command.kind);
    for (const raised of sim.revives) if (!out.revives.has(raised)) out.revives.set(raised, { by: id, name });
  }
  return out;
}

/**
 * The item stock this row counts on is already spoken for: every one left on
 * the shelf is on somebody's charge bar. Rows are offered while the count is
 * above zero, and the count only drops when a queued item resolves.
 */
export function stockSpokenFor(
  state: Readonly<BattleState>,
  command: Command,
  committed: Committed,
): boolean {
  if (command.kind !== 'item') return false;
  const used = committed.uses.get(String(command.id)) ?? 0;
  if (used === 0) return false;
  const left = state.flags[`inventory:${command.id}`];
  return typeof left === 'number' && left - used <= 0;
}

/**
 * True when everything this row would do is already on its way: it cures,
 * grants an ally a status or raises; every cure, every ally status and every
 * raise it makes is a queued command's; and it does nothing else measurable
 * (no damage, no status put on an enemy, no HP back for anybody it is not
 * raising).
 */
export function repeatsCommitted(
  state: Readonly<BattleState>,
  outcome: SimOutcome | null,
  committed: Committed,
): boolean {
  if (!outcome) return false;
  const ally = (c: { targetId: CombatantId }): boolean => state.combatants[c.targetId]?.side !== 'enemy';
  const cures = outcome.statusChanges.filter((c) => !c.applied && ally(c));
  const buffs = outcome.statusChanges.filter((c) => c.applied && ally(c));
  if (cures.length === 0 && buffs.length === 0 && outcome.revives.length === 0) return false;
  if (outcome.damageToEnemies > 0) return false;
  if (outcome.statusChanges.some((c) => c.applied && !ally(c))) return false;
  const raised = new Set(outcome.revives);
  for (const [id, delta] of Object.entries(outcome.hpDelta)) {
    if (delta < 0 && !raised.has(id)) return false;
  }
  return (
    cures.every((c) => committed.cures.has(`${c.targetId}:${c.status}`)) &&
    buffs.every((c) => committed.buffs.has(`${c.targetId}:${c.status}`)) &&
    outcome.revives.every((id) => committed.revives.has(id))
  );
}

/** {@link stockSpokenFor} or {@link repeatsCommitted}: the card does not offer it. */
export function spentAlready(
  state: Readonly<BattleState>,
  command: Command,
  outcome: SimOutcome | null,
  committed: Committed,
): boolean {
  if (isEmpty(committed)) return false;
  return stockSpokenFor(state, command, committed) || repeatsCommitted(state, outcome, committed);
}
