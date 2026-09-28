/**
 * **A heal already on its way counts** (advisor v3, FFX-2 only; second adversarial check C2-M1,
 * docs/handoff/advisor-v3.md "FINAL FIX").
 *
 * When the enemy moves before another girl's charging (or held) heal lands, the projected board
 * stops a step before that enemy (`./advisor-inflight.ts`): the heal has not landed on the board
 * the card ranks on, so a girl under 30 % read "one hit from down" and a **different** heal on
 * the same girl (X-Potion behind a Hi-Potion, Megalixir behind a Mega-Potion) went on top.
 * Measured by pressing the card's heal and the best row that heals nobody on 8 forks of the live
 * battle each (40 seeds x 6 FFX-2 chapters, card followed, 112 such boards): the girl lived
 * through the enemy's next move **equally often either way in 90** (both 8 of 8 in 84), the
 * second heal kept her alive in at least half the futures more in 2, and in 8 it did worse. So
 * in the common case the second heal is waste, and the few real saves are the boards where the
 * enemy's move is forecast to kill her before the heal in flight lands.
 *
 * The rule: with commands still in flight on the ranked board, the HP they give each ally
 * ({@link coveredHeals}) is counted before judging a heal row: the part of its healing that the
 * heal in flight already fills is not scored, and the "one hit from down" bonus is not paid for a
 * girl the heal in flight takes out of that band ({@link discountCovered}). Only a girl it
 * **lands in time** is covered. With the live engine to fork (the HUD passes it), that is measured:
 * on 4 forks of the battle (the girl choosing leaves her menu open, the clock runs), a girl KO'd
 * before every heal on its way to her has landed, in any of them, is not covered; without an
 * engine, a girl the forecast says the enemy's move takes down is not covered. A command **held**
 * for a chain lock covers nobody: it fires when the chain window closes, and the girl choosing may
 * extend it (Vegnagun seed 52: Yuna at 401 HP behind Paine's held Megalixir fell in 4 of 8 futures
 * once the card, counting it, said X-Potion on Paine). An uncovered girl is priced by the
 * lethal-save rules (`./advisor-eval.ts`, `./advisor-lethal.ts`) as before; for a covered one the
 * forecast's "lives through" is not a save ({@link coveredFacts}): the heal in flight gets her there.
 *
 * **FFX-2 only** [AGENTS.md rule 14]: only ATB opens a menu while a command is in flight
 * [research/ffx2-combat-core.md §1.1]; {@link inFlight} is empty on every FFX board. Pure: the
 * pending commands are resolved with the engine's own preview (`simulate.ts`), never the battle.
 */

import type { BattleState, CombatantId } from '../../battle/common/types.ts';
import type { SimOutcome } from '../../battle/ffx/simulate.ts';
import { simulateFFX2Command } from '../../battle/ffx2/simulate.ts';
import { queuedFrom, type CommittedOptions } from './advisor-committed.ts';
import { inFlight, stillPending, type InFlight, type InFlightSource } from './advisor-inflight.ts';
import type { AdvisorIntent } from './advisor-revive.ts';
import { SAVED_WEIGHT, type BoardFact } from './advisor-eval.ts';

/** The futures the in-time check samples (fixed seeds: the same board always gets the same card). */
const IN_TIME_SEEDS = [0xc0de_0001, 0xc0de_0002, 0xc0de_0003, 0xc0de_0004] as const;
/** One clock step (100 ms) and the horizon (8 s, the projection's): a heal later than that is not counted. */
const STEP_MS = 100;
const MAX_STEPS = 80;

/** Ally id -> HP the commands still in flight on this board give her (median roll). */
export type Covered = ReadonlyMap<CombatantId, number>;

/**
 * The heals in flight on `state` (the ranked board: charging, or held when `options` carries it),
 * less, with `source` (the live engine, whose own board is `board`), a girl a fork shows KO'd
 * before they land, or, without one, a girl the forecast (`threat`) says the enemy takes down.
 * `heldNow`: the girls whose command is held on the real board (they cover nobody).
 */
export function coveredHeals(
  state: Readonly<BattleState>,
  actorId: CombatantId,
  options: CommittedOptions,
  threat: AdvisorIntent | null,
  source: InFlightSource | null = null,
  board: Readonly<BattleState> = state,
  heldNow: readonly CombatantId[] = [],
): Covered {
  const out = new Map<CombatantId, number>();
  if (state.game !== 'ffx2') return out;
  const healers = new Map<CombatantId, InFlight[]>();
  for (const p of inFlight(state, actorId, queuedFrom(options))) {
    // A command held on the real board (`heldNow`) fires when the chain window closes, and the girl
    // choosing may extend it [research/ffx2-combat-core.md §1.7; PR-0076]: when it lands is hers to
    // change, so it covers nobody, even where the projection already shows it charging.
    if (p.held || heldNow.includes(p.actorId)) continue;
    let sim: SimOutcome | null = null;
    try {
      sim = simulateFFX2Command(state, p.actorId, p.command, {
        roll: 'mid',
        ...(options.ffx2?.abilities ? { abilities: options.ffx2.abilities } : {}),
        ...(options.ffx2?.items ? { items: options.ffx2.items } : {}),
      }) as SimOutcome | null;
    } catch {
      sim = null;
    }
    if (!sim) continue;
    for (const [id, delta] of Object.entries(sim.hpDelta)) {
      const c = state.combatants[id];
      if (!c || c.side === 'enemy' || c.alive === false || delta >= 0) continue;
      out.set(id, (out.get(id) ?? 0) - delta);
      healers.set(id, [...(healers.get(id) ?? []), p]);
    }
  }
  if (out.size === 0) return out;
  if (source) {
    // Measured on forks: a girl KO'd before the heal lands is not covered.
    for (const id of lateFor(source, board, actorId, healers)) out.delete(id);
    return out;
  }
  // No engine to fork: a girl the enemy's move is forecast to take down is not covered.
  for (const t of threat?.estimate?.perTarget ?? []) {
    const c = state.combatants[t.targetId];
    if (c && t.amount > 0 && (t.lethal || t.amount >= c.hp)) out.delete(t.targetId);
  }
  return out;
}

/**
 * The girls KO'd, in any sampled future, before every heal on its way to them has landed. Forks
 * only [AGENTS.md rule 1]; a source that is not this board, or a fork that throws, covers nobody.
 */
function lateFor(
  source: InFlightSource,
  board: Readonly<BattleState>,
  actorId: CombatantId,
  healers: ReadonlyMap<CombatantId, readonly InFlight[]>,
): Set<CombatantId> {
  const late = new Set<CombatantId>();
  if (healers.size === 0) return late;
  try {
    if (source.state().nextSeq !== board.nextSeq) return new Set(healers.keys());
    for (const seed of IN_TIME_SEEDS) {
      const fork = source.fork(seed);
      fork.setAtbMode('active');
      fork.setMenuLevel('top');
      const waiting = new Set([...healers.keys()].filter((g) => !late.has(g)));
      for (let step = 0; step < MAX_STEPS && waiting.size > 0; step++) {
        fork.tick(STEP_MS, { throughInput: true });
        const s = fork.state();
        for (const g of [...waiting]) {
          if (s.combatants[g]?.alive === false) {
            late.add(g);
            waiting.delete(g);
          } else if (!healers.get(g)!.some((p) => stillPending(fork, p))) {
            waiting.delete(g);
          }
        }
        if (s.result || !fork.inputValid(actorId)) break;
      }
    }
  } catch {
    return new Set(healers.keys());
  }
  return late;
}

/** What a heal row is worth once the heal in flight is counted: points off, and the reason to print. */
export function discountCovered(
  state: Readonly<BattleState>,
  outcome: SimOutcome | null,
  reason: string,
  covered: Covered,
  criticalHp: number,
  preventsKoValue: number,
): { less: number; reason: string } {
  if (!outcome || covered.size === 0) return { less: 0, reason };
  let less = 0;
  let criticalLeft = false;
  let criticalGone = false;
  for (const [id, delta] of Object.entries(outcome.hpDelta)) {
    const c = state.combatants[id];
    if (!c || c.side === 'enemy' || c.alive === false || delta >= 0) continue;
    const coming = covered.get(id) ?? 0;
    const max = c.stats.maxHp;
    const critical = c.hp / max < criticalHp;
    if (coming <= 0) {
      if (critical) criticalLeft = true;
      continue;
    }
    const room = Math.max(0, max - c.hp - coming);
    less += Math.max(0, -delta - room);
    if (critical && (c.hp + coming) / max >= criticalHp) {
      less += preventsKoValue;
      criticalGone = true;
    } else if (critical) {
      criticalLeft = true;
    }
  }
  const oneHit = / is one hit from down$/.test(reason);
  return {
    less,
    reason: oneHit && criticalGone && !criticalLeft ? `Puts ${outcome.healingToAllies} HP back` : reason,
  };
}

/** A row's facts less every "lives through" for a covered girl, and the points that fact carried. */
export function coveredFacts(facts: readonly BoardFact[], covered: Covered): { facts: BoardFact[]; less: number } {
  const kept = facts.filter((f) => !(f.kind === 'saves-from-lethal' && f.targetId !== undefined && covered.has(f.targetId)));
  return { facts: kept, less: (facts.length - kept.length) * SAVED_WEIGHT };
}
