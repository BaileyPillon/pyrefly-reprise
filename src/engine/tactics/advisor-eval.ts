/**
 * **The transparent evaluation**: every term named, every term carrying the
 * number that produced it and what proved it.
 *
 * `scoreOutcome` answers "what did this action do". This answers the question
 * the player is actually asking on a boss turn — *"and then what happens to
 * us?"* — by reading the enemy's own telegraphed next action off
 * `./advisor-forecast.ts` and asking whether the party is still standing after
 * it.
 *
 * ## The horizon is 1.5 plies, and the plan says why
 *
 * Neither engine exposes a fork, a snapshot or a restore, and
 * `simulate*Command` returns an *outcome*, not a resulting board — so there is
 * no post-action state to run a second ply on, and manufacturing one would mean
 * hand-rolling a clone of `BattleState` that drifts from the engine's the first
 * time somebody adds a field. What is honestly available is:
 *
 *   the actor's action, resolved by the engine's own damage chain,
 *   **then** the real enemy AI's next telegraphed action, read from the board
 *   as it stands and applied against the HP our action leaves behind.
 *
 * Both halves are real engine output. The join — "their HP after our move, less
 * the damage the forecast says is coming" — is arithmetic on two measured
 * numbers, and every fact says which of the two it came from so the sentence
 * can never word a pre-action read as a consequence of the action.
 *
 * One forecast is taken per decision and shared by every candidate: it costs
 * 1.5 ms in FFX and 0.6 ms in FFX-2 (measured), and the boss's plan does not
 * depend on which row the player is hovering.
 *
 * ## Which game
 *
 * **Both.** "Does the party survive what is coming" is a property of advice
 * [AGENTS.md rule 14; `critic/CHECKS.md` CHK-020], and `advisor-forecast.ts`
 * already carries both halves — FFX through a rebuilt `Ctx`, FFX-2 straight
 * from state, because X-2 keeps its AI scratch in the public state and FFX does
 * not. The two game-only terms named in the plan are **tempo** (FFX's
 * `predictTurnOrder`) and **gauge time** (FFX-2's ATB), and both are supplied
 * by the host or not at all: when the provider is absent the term is zero and
 * is never cited, which is what keeps the tests engine-only.
 *
 * Pure and DOM-free.
 */

import type {
  BattleState,
  Command,
  CombatantId,
  TurnPreview,
} from '../../battle/common/types.ts';
import type { SimOutcome } from '../../battle/ffx/simulate.ts';
import type { AdvisorIntent } from './advisor-revive.ts';
import type { StatusChance } from './advisor-roll.ts';

/** Where a claim came from. A sentence may only cite a fact that carries one. */
export type FactSource = 'sim' | 'forecast' | 'state' | 'turnOrder';

/** One thing the planner proved about this board, with the number that proves it. */
export interface BoardFact {
  /** A stable tag, so a test can find the fact it wants without matching prose. */
  kind:
    | 'saves-from-lethal'
    | 'still-lethal'
    | 'incoming'
    | 'kills'
    | 'phase'
    | 'gamble'
    | 'certain-status'
    | 'removes'
    | 'tempo';
  /** The clause the sentence may print, with no leading capital and no full stop. */
  text: string;
  /** The measured number behind the clause. */
  value: number;
  source: FactSource;
  /** Whom it is about, when it is about somebody. */
  targetId?: CombatantId;
}

/** What the evaluation adds to `scoreOutcome`, and what it proved. */
export interface Evaluation {
  /** Added to the simulated score. Positive is better for the player. */
  bonus: number;
  facts: BoardFact[];
}

/** An ally the boss's telegraphed action would take to 0. */
const LETHAL_WEIGHT = 6_000;
/** Taking an ally out of the incoming action's lethal band. */
const SAVED_WEIGHT = 5_000;
/** Per point of HP the party is short of surviving what is coming. */
const EXPOSURE_WEIGHT = 0.8;
/**
 * Per tick of CTB position this action costs the party.
 *
 * **FFX only** — `predictTurnOrder` is on `FFXBattleEngine` and X-2 has no turn
 * list to lose position in [`types.ts` §BattleEngine]. Zero, and never cited,
 * when the host supplies no provider.
 */
const TEMPO_WEIGHT = 40;

/** `'power-break'` -> `'Power Break'`. The card is read by a player, not a log. */
function statusWord(status: string): string {
  return String(status)
    .split('-')
    .map((w) => (w ? w[0]!.toUpperCase() + w.slice(1) : w))
    .join(' ');
}

function isAlly(state: Readonly<BattleState>, id: CombatantId): boolean {
  const c = state.combatants[id];
  return c !== undefined && c.side !== 'enemy';
}

/**
 * HP the action took off enemies **by dealing damage**: per enemy, the HP it
 * lost, but never more than the `damage` events that landed on it.
 *
 * `damageToEnemies` counts every HP an enemy loses, which is right for ranking
 * (a shattered Guardian is gone either way) and wrong for the card's word
 * "damage": a Petrify Grenade that shatters both Guado Guardians removes their
 * 4,000 HP without a single `damage` event, and the card said "4000 damage"
 * and printed a 4,000 chip on an item that deals none (Chapter VII e2e, commit
 * 06338dbc). A Death spell is the same case. Those are said as what they are
 * ({@link removedFact}, `kills`). Both games: the two `SimOutcome`s share the
 * fields read here.
 */
export function dealtToEnemies(
  state: Readonly<BattleState>,
  outcome: Pick<SimOutcome, 'hpDelta' | 'events'>,
): number {
  const landed = new Map<CombatantId, number>();
  for (const e of outcome.events) {
    if (e.type === 'damage' && e.amount > 0) landed.set(e.targetId, (landed.get(e.targetId) ?? 0) + e.amount);
  }
  let total = 0;
  for (const [id, delta] of Object.entries(outcome.hpDelta)) {
    if (delta > 0 && state.combatants[id]?.side === 'enemy') total += Math.min(delta, landed.get(id) ?? 0);
  }
  return total;
}

/**
 * Enemies the action takes off the field with no damage — shattered after a
 * Petrify, or Ejected — as one clause: "2 of them shatter". `null` when none.
 */
function removedFact(state: Readonly<BattleState>, outcome: SimOutcome): BoardFact | null {
  const added = outcome.statusChanges.filter((c) => c.applied);
  const gone = added.filter((c) => c.status === 'eject' && !isAlly(state, c.targetId));
  if (gone.length === 0) return null;
  const stone = new Set(added.filter((c) => c.status === 'petrify').map((c) => c.targetId));
  const shatter = gone.every((c) => stone.has(c.targetId));
  const first = gone[0]!.targetId;
  const one = gone.length === 1;
  const who = one ? (state.combatants[first]?.name ?? first) : `${gone.length} of them`;
  const verb = shatter ? (one ? 'shatters' : 'shatter') : one ? 'leaves the battle' : 'leave the battle';
  return { kind: 'removes', text: `${who} ${verb}`, value: gone.length, source: 'sim', ...(one ? { targetId: first } : {}) };
}

/**
 * HP each ally is left with by **our** action, read off the simulation.
 *
 * `hpDelta` is positive for damage and negative for healing [docs/CONTRACTS.md],
 * and a revive shows up as a negative delta on somebody who is not alive — which
 * is why the raise is read from `outcome.revives` rather than from the sign.
 */
function hpAfterOurAction(
  state: Readonly<BattleState>,
  outcome: SimOutcome | null,
): Map<CombatantId, number> {
  const out = new Map<CombatantId, number>();
  for (const id of [...state.activeIds, ...(state.aeonId ? [state.aeonId] : [])]) {
    const c = state.combatants[id];
    if (!c) continue;
    const raised = outcome?.revives.includes(id) === true;
    if (!c.alive && !raised) continue;
    const delta = outcome?.hpDelta[id] ?? 0;
    const base = c.alive ? c.hp : 0;
    out.set(id, Math.max(0, Math.min(c.stats.maxHp, base - delta)));
  }
  return out;
}

/** What the boss's telegraphed action would take off each ally. */
function incoming(intent: AdvisorIntent | null): Map<CombatantId, { amount: number; lethal: boolean }> {
  const out = new Map<CombatantId, { amount: number; lethal: boolean }>();
  for (const t of intent?.estimate?.perTarget ?? []) {
    if (t.amount <= 0) continue;
    const prev = out.get(t.targetId);
    out.set(t.targetId, {
      amount: (prev?.amount ?? 0) + t.amount,
      lethal: (prev?.lethal ?? false) || t.lethal,
    });
  }
  return out;
}

/**
 * Price one candidate against what is coming, and say what was proved.
 *
 * @param intent the **pre-action** forecast, taken once for the decision. Every
 *   fact it produces is tagged `'forecast'`, and `./advisor-say.ts` refuses to
 *   word a `'forecast'`-only fact as something the action caused.
 * @param turnOrder the host's `predictTurnOrder` provider, FFX only. Absent
 *   means the tempo term is zero and tempo is never cited.
 */
export function evaluate(
  state: Readonly<BattleState>,
  actorId: CombatantId,
  command: Command,
  outcome: SimOutcome | null,
  chances: readonly StatusChance[],
  intent: AdvisorIntent | null,
  turnOrder?: (previewCommand?: Command) => readonly TurnPreview[],
): Evaluation {
  const facts: BoardFact[] = [];
  let bonus = 0;

  // ---------------------------------------------- terms 1 and 3: who survives
  const coming = incoming(intent);
  if (coming.size > 0) {
    const after = hpAfterOurAction(state, outcome);
    for (const [id, hit] of coming) {
      if (!isAlly(state, id)) continue;
      const before = state.combatants[id]?.hp ?? 0;
      const now = after.get(id);
      if (now === undefined) continue;
      const diedBefore = hit.lethal || before <= hit.amount;
      const diesNow = now <= hit.amount;
      const name = state.combatants[id]?.name ?? id;
      const move = intent?.moveName ?? 'what is coming';
      if (diedBefore && !diesNow) {
        bonus += SAVED_WEIGHT;
        facts.push({
          kind: 'saves-from-lethal',
          text: `${name} lives through ${move}`,
          value: now - hit.amount,
          source: 'forecast',
          targetId: id,
        });
      } else if (diesNow) {
        bonus -= LETHAL_WEIGHT;
        facts.push({
          kind: 'still-lethal',
          text: `${move} still takes ${name} down`,
          value: hit.amount - now,
          source: 'forecast',
          targetId: id,
        });
      }
      const exposure = Math.max(0, hit.amount - now);
      bonus -= exposure * EXPOSURE_WEIGHT;
    }
    const total = [...coming.values()].reduce((n, h) => n + h.amount, 0);
    if (total > 0) {
      facts.push({
        kind: 'incoming',
        text: `${intent?.moveName ?? 'the next move'} is worth about ${Math.round(total)}`,
        value: Math.round(total),
        source: 'forecast',
      });
    }
  }

  // ----------------------------------------------------- what the sim proved
  if (outcome) {
    for (const id of outcome.kills) {
      if (isAlly(state, id)) continue;
      facts.push({
        kind: 'kills',
        text: `it finishes ${state.combatants[id]?.name ?? id}`,
        value: state.combatants[id]?.hp ?? 0,
        source: 'sim',
        targetId: id,
      });
    }
    const dealt = dealtToEnemies(state, outcome);
    if (dealt > 0) facts.push({ kind: 'phase', text: `${dealt} damage`, value: dealt, source: 'sim' });
    const removed = removedFact(state, outcome);
    if (removed) facts.push(removed);
  }

  // ------------------------------------------------------------ the coin flip
  //
  // Counted by **status**, not by event. A party-wide Hastega applies one status
  // to three members and would otherwise read as "it puts haste on Tidus" — a
  // true sentence about a third of what the move does, which is how the card
  // first looked in the browser on 2026-09-21.
  const byStatus = new Map<string, StatusChance[]>();
  for (const c of chances) {
    if (c.percent <= 0) continue;
    const key = `${c.status}|${c.landedAtMedian ? 'in' : 'out'}`;
    const list = byStatus.get(key);
    if (list) list.push(c);
    else byStatus.set(key, [c]);
  }
  for (const group of byStatus.values()) {
    const first = group[0]!;
    const label = statusWord(first.status);
    const who =
      group.length > 1
        ? group.every((c) => isAlly(state, c.targetId))
          ? 'the party'
          : `${group.length} of them`
        : (state.combatants[first.targetId]?.name ?? first.targetId);
    if (first.landedAtMedian) {
      facts.push({
        kind: 'certain-status',
        text: `it puts ${label} on ${who}`,
        value: first.percent,
        source: 'sim',
        targetId: first.targetId,
      });
    } else {
      facts.push({
        kind: 'gamble',
        text: `${label} on ${who} lands about ${Math.round(first.percent)} times in 100`,
        value: first.percent,
        source: 'sim',
        targetId: first.targetId,
      });
    }
  }

  // ------------------------------------------------- term 6: tempo (FFX only)
  if (turnOrder) {
    try {
      const before = turnOrder();
      const withIt = turnOrder(command);
      const ours = (list: readonly TurnPreview[]): number =>
        list.findIndex((t) => t.actorId === actorId);
      const delta = ours(withIt) - ours(before);
      if (Number.isFinite(delta) && delta !== 0) {
        bonus -= delta * TEMPO_WEIGHT;
        facts.push({
          kind: 'tempo',
          text: delta > 0 ? `it costs ${delta} place${delta === 1 ? '' : 's'} in the turn order` : 'it buys a place in the turn order',
          value: delta,
          source: 'turnOrder',
        });
      }
    } catch {
      // A host that cannot answer is a host that does not get a tempo term.
    }
  }

  return { bonus, facts };
}
