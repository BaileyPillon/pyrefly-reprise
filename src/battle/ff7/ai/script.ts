/**
 * The shape of an FF7 enemy script: Setup, Main and Counter sections
 * [core §12, single source: Fergusson EM §4.2].
 *
 * - **Setup** runs once at battle start.
 * - **Main** runs when the enemy's gauge fills; enemies choose and commit the
 *   instant it fills [core §2.4]. It returns the action to queue.
 * - **Counter** sections run whenever the enemy experiences their effect. A
 *   counter does not wait for, consume or reset the counterer's gauge
 *   [core §12, **our estimate**, D:\FF7 formulas.md §9.11 unsourced].
 *
 * Temporary variables start at 0 [core §12] and live in `BattleState.flags`
 * under `<enemyId>:<name>`, so they are visible to tests and the HUD.
 *
 * Pure (AGENTS.md rule 1). Game case: **FF7 only.**
 */

import type { BattleState, CombatantId, Ff7Combatant, Rng } from '../../common/types.ts';
import type { EventDraft } from '../internal.ts';

/** What a script section asks the engine to do. */
export type Ff7AiPlan =
  | { kind: 'ability'; abilityId: string; targets: CombatantId[] }
  /** The turn passes with no action (Guard Scorpion's waits, gs §5.2). */
  | { kind: 'pass' };

/** What a script may read and write. */
export interface Ff7AiApi {
  readonly self: Ff7Combatant;
  readonly state: BattleState;
  readonly rng: Rng;
  /** Living opponents (the party), in slot order. */
  opponents(): Ff7Combatant[];
  /** A temporary variable (0 when never set) [core §12]. */
  get(name: string): number;
  set(name: string, value: number): void;
  /** A combatant-id variable (Search Scope's Target), or null when never set. */
  getId(name: string): CombatantId | null;
  setId(name: string, id: CombatantId): void;
  /** Emit a line or a message (the hint, gs §7). */
  emit(event: EventDraft): void;
}

/** One enemy script. */
export interface Ff7AiScript {
  setup?(api: Ff7AiApi): void;
  main(api: Ff7AiApi): Ff7AiPlan;
  /** After a queued plan's ability has resolved (its form change already applied by the engine). */
  afterAction?(api: Ff7AiApi, plan: Ff7AiPlan): void;
  /** "Counter - General": an opponent's action targeted it and it survived. */
  counterGeneral?(api: Ff7AiApi, attackerId: CombatantId): Ff7AiPlan | null;
  /** "Counter - Death": an opponent's action killed it. */
  counterDeath?(api: Ff7AiApi, attackerId: CombatantId): Ff7AiPlan | null;
}

/** The script's variables, keyed per enemy in `BattleState.flags`. */
export function makeAiApi(state: BattleState, self: Ff7Combatant, rng: Rng, emit: (e: EventDraft) => void, opponents: () => Ff7Combatant[]): Ff7AiApi {
  const key = (name: string): string => `${self.id}:${name}`;
  return {
    self,
    state,
    rng,
    opponents,
    get: (name) => {
      const v = state.flags[key(name)];
      return typeof v === 'number' ? v : 0;
    },
    set: (name, value) => {
      state.flags[key(name)] = value;
    },
    getId: (name) => {
      const v = state.flags[key(name)];
      return typeof v === 'string' ? v : null;
    },
    setId: (name, id) => {
      state.flags[key(name)] = id;
    },
    emit,
  };
}

/** A random living opponent: one `Rnd(0..n-1)` draw. Throws when nobody is alive (the battle is over by then). */
export function randomOpponent(api: Ff7AiApi): Ff7Combatant {
  const pool = api.opponents();
  const pick = pool[api.rng.int(0, pool.length - 1)];
  if (!pick) throw new Error(`FF7 AI '${api.self.id}': no living opponent`);
  return pick;
}
