/**
 * **The race term** (PR-0269, round 17): the two Sin chapters are races the party wins only by
 * damage in time, and a card that spends a stable party's turns on upkeep loses them.
 *
 * - **Chapter XVIII, Overdrive Sin: a clock.** Giga-Graviton comes on Sin's last turn and the
 *   Game Over is the script (research/ffx-sin.md §3.4 [verified: 4 sources], §5.4; the turn is
 *   S-1, the engine's `sin.gigaGravitonTurn`, 13 by Bailey's default). Every loss of the link-4
 *   bench is that clock (docs/plans/sin-link4-bench.md: 138 + 62 = 200). The forecast no longer
 *   reads the scripted Game Over as a lethal hit to heal against (`./advisor-forecast.ts`).
 * - **Chapter XVII, the Fins, Genais and the Core: an HP race.** No clock, but one party state
 *   across three links (D-270) and the Fins' Gravija wearing it down (§3.1): turns spent topping
 *   up a party nobody can kill this turn are turns the Fin gets back.
 *
 * **The rule.** On the clock, when the card's top row only restores HP (no damage, no revive,
 * no status taken off, not the proved lethal save), or on Sin's last turn raises an ally who cannot
 * act before Giga-Graviton, and **the party is stable** (no living active
 * member is lethal to the forecast's next enemy action), the card lifts the row that deals the
 * most damage to the foes instead. A lethal save is never touched (Bailey's 2026-09-21 rule), nor
 * a revive, a cure, a buff, a Break, a switch or an order. Nothing here is a boss number: it is a
 * reading of the board, the forecast and the simulated rows the card already priced.
 *
 * **Game case: FFX only** [AGENTS.md rule 14]: CTB, Overdrive Sin's clock, the Fins' chain. An
 * FFX-2 board never matches ({@link raceOf} reads `state.game`). Pure; never writes the battle.
 */

import type { BattleState } from '../../battle/common/types.ts';
import type { SimOutcome } from '../../battle/ffx/simulate.ts';
import { SIN_TURNS_LEFT } from '../../battle/ffx/ai/overdrive-sin-rules.ts';
import { SIN_CORE_ID, SIN_GENAIS_ID, SIN_LEFT_FIN_ID, SIN_RIGHT_FIN_ID } from '../../battle/ffx/ai/sin-ids.ts';
import type { AdvisorIntent } from './advisor-revive.ts';
import type { RankedRow } from './advisor-v3.ts';

/** What kind of race the board is, or `null` when it is not one. */
export type Race = { kind: 'clock'; turnsLeft: number } | { kind: 'hp' };

const HP_RACE_FOES: readonly string[] = [SIN_LEFT_FIN_ID, SIN_RIGHT_FIN_ID, SIN_GENAIS_ID, SIN_CORE_ID];

export function raceOf(state: Readonly<BattleState>): Race | null {
  if (state.game !== 'ffx') return null;
  const left = state.flags[SIN_TURNS_LEFT];
  if (typeof left === 'number') return { kind: 'clock', turnsLeft: left };
  const foes = state.enemyIds.map((id) => state.combatants[id]).filter((c) => c && c.alive && !c.removed);
  return foes.some((c) => HP_RACE_FOES.includes(c!.id)) ? { kind: 'hp' } : null;
}

/**
 * No living active party member is lethal to the forecast's next enemy action. (Sin's Gaze, a
 * counter, is not in the forecast. Counting its reach here too was measured and lost: sin-face,
 * 200 seeds, v3 card 73 to 54 wins; see docs/handoff/r17fix-advisor.md.)
 */
export function stable(state: Readonly<BattleState>, intent: AdvisorIntent | null): boolean {
  const lethal = new Set((intent?.estimate?.perTarget ?? []).filter((t) => t.lethal).map((t) => t.targetId));
  return state.activeIds.every((id) => {
    const c = state.combatants[id];
    return !c || c.side === 'enemy' || c.alive === false || !lethal.has(id);
  });
}

/** Only restores HP: no damage to a foe, no revive, no status taken off, not a proved save. */
export function onlyHeals(row: RankedRow): boolean {
  const o: SimOutcome | null = row.outcome;
  if (!o || row.suggestion.isSwitch) return false;
  if (row.facts.some((f) => f.kind === 'saves-from-lethal')) return false;
  return o.healingToAllies > 0 && o.damageToEnemies === 0 && o.revives.length === 0 && !o.statusChanges.some((s) => !s.applied);
}

/**
 * A raise on Sin's last turn: the raised ally re-enters the queue at three times their base delay
 * (research/ffx-combat-core.md §1.6; `turnQueue.ts#onRevived`), so every enemy acts first, and the
 * next thing Sin does is Giga-Graviton. The raise buys no action (browser run, seed 1: a Phoenix Down
 * on the last turn with Sin at 2,406 HP, where Wakka's Attack does about 2,500).
 */
function futileRaise(row: RankedRow): boolean {
  const o = row.outcome;
  if (!o || row.suggestion.isSwitch || row.facts.some((f) => f.kind === 'saves-from-lethal')) return false;
  return o.revives.length > 0 && o.damageToEnemies === 0;
}

/**
 * v4's rail on a clock board (`./advisor-v4/candidates.ts`): with the party stable, a challenger
 * to v3's top row must deal damage or raise someone. Measured: without it the look-ahead lifted
 * Al Bhed Potions and Remedies over Attack and Firaga (sin-face, seeds 1 to 6, 27 switches).
 */
export function offRaceLine(state: Readonly<BattleState>, outcome: SimOutcome | null, intent: AdvisorIntent | null): boolean {
  if (raceOf(state)?.kind !== 'clock' || !stable(state, intent)) return false;
  return !outcome || (outcome.damageToEnemies <= 0 && outcome.revives.length === 0);
}

/**
 * v4 on a clock board: v3's top row stands without a search when the party is stable and that row
 * already works on the race (it hurts or breaks a foe, or it is an Overdrive or a switch). Measured
 * (sin-face, 30 seeds): the look-ahead's 2-future answers there were noise (Armor Break and Mental
 * Break to Power Break, Dragon Fang to Attack) and cost wins; it may still turn upkeep into damage.
 */
export function raceHolds(state: Readonly<BattleState>, command: { kind: string }, outcome: SimOutcome | null, intent: AdvisorIntent | null): boolean {
  if (raceOf(state)?.kind !== 'clock' || !stable(state, intent)) return false;
  if (command.kind === 'switch' || command.kind === 'overdrive') return true;
  if (!outcome) return false;
  const foe = (id: string): boolean => state.combatants[id]?.side === 'enemy';
  return outcome.damageToEnemies > 0 || outcome.statusChanges.some((c) => c.applied && foe(c.targetId));
}

/**
 * The row to lift over the card's top row on a race board, or `null` when the card stands: the
 * top row only heals, the party is stable, and some other row deals damage (the most, ties to the
 * card's own order).
 */
export function raceLift<C extends RankedRow>(state: Readonly<BattleState>, ordered: readonly C[], intent: AdvisorIntent | null): C | null {
  const top = ordered[0];
  const race = raceOf(state);
  if (!top || race?.kind !== 'clock' || !stable(state, intent)) return null;
  if (!onlyHeals(top) && !(race.turnsLeft <= 1 && futileRaise(top))) return null;
  let best: C | null = null;
  for (const c of ordered) {
    const dmg = c.outcome?.damageToEnemies ?? 0;
    if (c.suggestion.isSwitch || dmg <= 0 || (c.outcome?.harmToAllies ?? 0) > 0) continue;
    if (!best || dmg > (best.outcome?.damageToEnemies ?? 0)) best = c;
  }
  return best;
}
