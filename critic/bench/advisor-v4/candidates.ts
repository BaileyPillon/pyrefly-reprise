/**
 * **Advisor v4 prototype: what the search may press, and the rails around it.**
 *
 * The search never invents a row. Its candidates are, in this order:
 *
 *  1. v3's card (the top row, then the runner-up): the default the search must beat;
 *  2. the chapter's own line for this actor;
 *  3. the best few other rows on this menu by v2's one-step score (`scoreOutcome`), one
 *     simulation each on the engine's throwaway copy (`simulate*Command`).
 *
 * The rails (docs/plans/advisor-v3-method-check.md §5 C, kept exactly):
 *
 *  - **Only rows this girl can press**: an enabled row of the menu in front of her, one the game's
 *    window paints (`pressable`), aimed at a target the row offers (FOC22-02).
 *  - **A refused revive stays refused**: a row that raises an ally Bailey's 2026-09-21 refusal rule
 *    speaks for (`reviveRisk`: the board kills them again at once) is not a candidate.
 *  - **Nothing already on its way** (FFX-2 only): the same support move as a command in flight, or
 *    the last item in flight, is not a candidate (`alreadyOnItsWay`, v3's rule for Bailey's
 *    Mega-Potion, read on the real board); nor, stricter than v3, a support row of the same kind
 *    and id as any command in flight, or one whose every effect a command in flight delivers (the
 *    scorecard's own "dup same" and "dup strict" readings).
 *  - **Saves-from-lethal first**: when v3's top row carries the proved `saves-from-lethal` fact, it
 *    is kept without a search (`./search.ts`).
 *
 * Game case: **both**; the in-flight rail is FFX-2 only.
 */

import type { AvailableCommand, BattleState, Command, CombatantId } from '../../../src/battle/common/types.ts';
import type { SimOutcome } from '../../../src/battle/ffx/simulate.ts';
import { scoreOutcome, sameCommand, type AdvisorOptions, type AdvisorView } from '../../../src/engine/tactics/advisor.ts';
import { pressable } from '../../../src/engine/tactics/advisor-menu.ts';
import { reviveRisk, type AdvisorIntent } from '../../../src/engine/tactics/advisor-revive.ts';
import { alreadyOnItsWay, heldFor } from '../../../src/engine/tactics/advisor-v3.ts';
import { inFlight as inFlightOf } from '../../../src/engine/tactics/advisor-inflight.ts';
import { duplicate, simulateFor, supportOnly } from '../advisor-v3/metrics.ts';
import type { Input } from '../advisor-v3/drive.ts';

export type Origin = 'v3-top' | 'v3-runner-up' | 'line' | 'ranked';

export interface Candidate {
  command: Command;
  origin: Origin;
  outcome: SimOutcome | null;
}

/** Most one-step simulations the ranked tail may spend (v3 itself caps at sixty). */
const MAX_SIMS = 48;

const idOf = (c: Command): string => ('id' in c ? String((c as { id?: unknown }).id ?? '') : '');

/** The enabled, painted row this command is pressed from, aimed at a target it offers; or null. */
export function rowFor(state: Readonly<BattleState>, d: Input, cmd: Command): AvailableCommand | null {
  if (!pressable(state, cmd)) return null;
  const targets = (cmd.targets ?? []) as readonly CombatantId[];
  for (const r of d.commands) {
    if (!r.enabled || r.wrapsCategory || r.command.kind !== cmd.kind || idOf(r.command) !== idOf(cmd)) continue;
    if (cmd.kind === 'switch' || cmd.kind === 'spherechange') {
      if (JSON.stringify((r.command as { extra?: unknown }).extra ?? null) !== JSON.stringify((cmd as { extra?: unknown }).extra ?? null)) continue;
    }
    if (targets.every((t) => r.validTargets.includes(t)) || (targets.length === 0 && r.validTargets.length === 0)) return r;
  }
  return null;
}

/** Every enabled, painted row aimed at every target it offers (bounded), for the ranked tail. */
function menuCommands(state: Readonly<BattleState>, d: Input): Command[] {
  const out: Command[] = [];
  for (const row of d.commands) {
    if (!row.enabled || row.wrapsCategory) continue;
    const k = row.command.kind;
    if (k === 'escape' || k === 'switch' || k === 'spherechange') continue;
    if (!pressable(state, row.command)) continue;
    const aims: Array<CombatantId | null> = row.validTargets.length === 0 ? [null] : row.validTargets.slice(0, 8);
    for (const t of aims) out.push({ ...row.command, targets: t ? [t] : [] } as Command);
  }
  return out;
}

/** What is already on its way for other girls (FFX-2 only): v3's reading plus the metric's. */
interface InFlightRails {
  now: Parameters<typeof alreadyOnItsWay>[3];
  /** The pending commands' simulated outcomes, for the strict duplicate reading. */
  pendingOut: SimOutcome[];
  pendingIds: Array<{ kind: string; id: string }>;
}

/** The rails a candidate must pass (menu, refused revive, in flight). */
function passesRails(
  state: Readonly<BattleState>,
  d: Input,
  c: Candidate,
  intent: AdvisorIntent | null,
  inFlight: InFlightRails | null,
): boolean {
  if (!rowFor(state, d, c.command)) return false;
  for (const id of c.outcome?.revives ?? []) {
    const delta = c.outcome!.hpDelta[id] ?? 0;
    if (reviveRisk(state, id, intent, delta < 0 ? -delta : undefined)) return false;
  }
  if (!inFlight || inFlight.pendingIds.length === 0) return true;
  // v3's rule, read on the real board (FB1): the same support move, or the last item, in flight.
  if (alreadyOnItsWay(state, c.command, c.outcome, inFlight.now)) return false;
  // Bailey's words, as the scorecard reads them: a support row with the same kind and id as a
  // command in flight, whoever it is aimed at; and a support row whose every effect is delivered.
  if (c.outcome && supportOnly(state, c.outcome)) {
    if (inFlight.pendingIds.some((p) => p.kind === c.command.kind && p.id === idOf(c.command))) return false;
    if (duplicate(state, c.outcome, inFlight.pendingOut)) return false;
  }
  return true;
}

/** The commands in flight for other girls: charging on their bars, or held by the engine. */
function inFlightRails(state: Readonly<BattleState>, d: Input, opt: AdvisorOptions): InFlightRails | null {
  if (state.game !== 'ffx2') return null;
  const pending: Array<{ actorId: CombatantId; command: Command }> = [];
  for (const id of state.activeIds) {
    if (id === d.actorId) continue;
    const u = state.combatants[id] as { alive?: boolean; atb?: { charging?: { commandRef?: Command } | null } } | undefined;
    const cmd = u?.alive !== false ? u?.atb?.charging?.commandRef : undefined;
    if (cmd) pending.push({ actorId: id, command: cmd });
  }
  const held = (opt.engine?.() as { heldCommand?: () => { actorId: CombatantId; command: Command } | null } | null)?.heldCommand?.() ?? null;
  if (held && held.actorId !== d.actorId) pending.push(held);
  const pendingOut = pending.map((p) => simulateFor(state, p.actorId, p.command, opt)).filter((o): o is SimOutcome => o !== null);
  return { now: inFlightOf(state, d.actorId, heldFor(opt)), pendingOut, pendingIds: pending.map((p) => ({ kind: p.command.kind, id: idOf(p.command) })) };
}

export interface CandidateSet {
  list: Candidate[];
  /** One-step simulations spent building the ranked tail. */
  sims: number;
}

/**
 * The candidates for one decision, v3's top row first (the default the search must beat).
 * `extra` is how many ranked rows join v3's card and the line.
 */
export function candidatesFor(
  state: Readonly<BattleState>,
  d: Input,
  view: AdvisorView | null,
  line: Command | null,
  opt: AdvisorOptions,
  intent: AdvisorIntent | null,
  extra: number,
): CandidateSet {
  const list: Candidate[] = [];
  let sims = 0;
  const inFlight = inFlightRails(state, d, opt);
  const push = (command: Command, origin: Origin, outcome?: SimOutcome | null): void => {
    if (list.some((c) => sameCommand(c.command, command))) return;
    const out = outcome !== undefined ? outcome : simulateFor(state, d.actorId, command, opt);
    if (outcome === undefined) sims += 1;
    const c: Candidate = { command, origin, outcome: out };
    // v3's own top row is the default: it is kept as v3 ranked it (its rails already ran).
    if (origin !== 'v3-top' && !passesRails(state, d, c, intent, inFlight)) return;
    list.push(c);
  };
  const top = view?.suggestions[0]?.command;
  if (top) push(top, 'v3-top');
  const second = view?.suggestions[1]?.command;
  if (second) push(second, 'v3-runner-up');
  if (line) push(line, 'line');
  if (extra <= 0) return { list, sims };
  const ranked: Array<{ command: Command; outcome: SimOutcome; score: number }> = [];
  for (const command of menuCommands(state, d)) {
    if (sims >= MAX_SIMS) break;
    if (list.some((c) => sameCommand(c.command, command))) continue;
    const outcome = simulateFor(state, d.actorId, command, opt);
    sims += 1;
    if (!outcome || outcome.rejected) continue;
    const score = scoreOutcome(state, outcome, { command, def: outcome.ability, intent }).score;
    ranked.push({ command, outcome, score });
  }
  ranked.sort((a, b) => b.score - a.score);
  for (const r of ranked) {
    if (list.length >= 3 + extra) break;
    push(r.command, 'ranked', r.outcome);
  }
  return { list, sims };
}
