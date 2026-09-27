/**
 * Engine-private shapes and helpers for the FF7 engine: the event draft, the
 * runtime the resolver shares, and small readers over `Ff7Combatant`.
 *
 * Pure (AGENTS.md rule 1). Game case: **FF7 only.** Section references are to
 * `research/ff7-battle-core.md` ("core") and `research/ff7-guard-scorpion.md` ("gs").
 */

import type {
  BattleEvent,
  BattleState,
  CombatantId,
  Command,
  Ff7Combatant,
  Ff7EquipmentDef,
  Ff7EnemyStats,
  Rng,
} from '../common/types.ts';
import type { Ff7AiPlan } from './ai/script.ts';
import type { Ff7AbilityDef, Ff7Element, Ff7Registry } from './defs.ts';

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

/** An event before the log numbers it. */
export type EventDraft = DistributiveOmit<BattleEvent, 'seq'>;

/**
 * One committed action waiting its turn in the queue [core §2.6, **estimate**:
 * no source describes the queue as an object; one action resolves at a time,
 * first in first out, a Limit Break jumps to the front (core §7.2)].
 */
export interface Ff7QueuedAction {
  actorId: CombatantId;
  /** The command as submitted (a party member) or as the script chose it; null for a pass. */
  command: Command | null;
  /** The ability that resolves (the Attack command, a spell, a Limit, an item effect, an enemy action), or null for Defend / a pass. */
  abilityId: string | null;
  /** An enemy turn that does nothing (Guard Scorpion's two waits, gs §5.2). */
  pass?: boolean;
  /** The script's plan, for its `afterAction` section (enemies only). */
  plan?: Ff7AiPlan;
}

/** State the resolver shares that is not in `BattleState` (so no contract field is needed for it). */
export interface Ff7Runtime {
  /** Party member id -> the weapon it holds (element, Long Range) [core §5.1, gs §8.3]. */
  weapons: Record<CombatantId, Ff7EquipmentDef>;
  /** Item id -> count carried [gs §8.5]. */
  inventory: Record<string, number>;
  /** NormalSpeed, fixed at battle start from the party's base Dex [core §2.3]. */
  normalSpeed: number;
  /** Turn Timer increase per tick, per combatant [core §2.3]. */
  increase: Record<CombatantId, number>;
  /** Party members whose gauge is full and who wait for a command, first filled first [core §2.6, estimate]. */
  inputQueue: CombatantId[];
  /** Committed actions [core §2.6, estimate]. */
  actions: Ff7QueuedAction[];
  /** Enemy id -> its forms' display name and sprite key, from the enemy record (`form-change`). */
  forms: Record<CombatantId, Array<{ name: string; spriteKey: string }>>;
  /** `state.ticks` at the last turn boundary, for `turn-start.elapsedTicks`. */
  lastTurnTick: number;
}

/** What the resolver needs, handed in by the engine facade. */
export interface Ff7Env {
  state: BattleState;
  reg: Ff7Registry;
  rng: Rng;
  rt: Ff7Runtime;
  emit(event: EventDraft): void;
}

/** The FF7 block of a combatant, or throw (every combatant in an FF7 battle is an `Ff7Combatant`). */
export function unit(state: BattleState, id: CombatantId): Ff7Combatant {
  const c = state.combatants[id] as Ff7Combatant | undefined;
  if (!c || !('ff7' in c)) throw new Error(`FF7 engine: unknown combatant '${id}'`);
  return c;
}

/** Every combatant in slot order, party first, then enemies (our estimate for same-tick ties, core §2.6). */
export function allUnits(state: BattleState): Ff7Combatant[] {
  return [...state.activeIds, ...state.enemyIds].map((id) => unit(state, id));
}

export function isParty(c: Ff7Combatant): boolean {
  return c.side === 'party';
}

/** Living members of one side, in slot order. */
export function living(state: BattleState, side: 'party' | 'enemy'): Ff7Combatant[] {
  const ids = side === 'party' ? state.activeIds : state.enemyIds;
  return ids.map((id) => unit(state, id)).filter((c) => c.alive && !c.removed);
}

/** The side opposing `c`. */
export function opponentSide(c: Ff7Combatant): 'party' | 'enemy' {
  return isParty(c) ? 'enemy' : 'party';
}

/** An enemy's stats in its current form: the listed block with the form's overrides [gs §2.1]. */
export function enemyStats(c: Ff7Combatant): Ff7EnemyStats {
  const e = c.ff7.enemy;
  if (!e) throw new Error(`FF7 engine: '${c.id}' has no enemy block`);
  return { ...e.stats, ...(e.formStats?.[c.ff7.formIndex ?? 0] ?? {}) };
}

/** Level: party members from their base stats, enemies from their block. */
export function levelOf(c: Ff7Combatant): number {
  return c.ff7.base?.level ?? c.ff7.enemy?.level ?? 1;
}

/** Defense and Magic defense as the formulas read them (an enemy's current form) [core §1.1, §1.3]. */
export function defensesOf(c: Ff7Combatant): { def: number; mdf: number; dfPct: number; mdPct: number; lck: number; dex: number } {
  if (isParty(c)) {
    const d = c.ff7.derived;
    return { def: d.def, mdf: d.mdf, dfPct: d.dfPct, mdPct: d.mdPct, lck: d.lck, dex: d.dex };
  }
  const s = enemyStats(c);
  // Enemies have no MD% [core §1.3].
  return { def: s.def, mdf: s.mdf, dfPct: s.dfPct, mdPct: 0, lck: s.lck, dex: s.dex };
}

/** The elements an action carries for this user: the weapon's for the Attack command [core §9]. */
export function elementsFor(env: Ff7Env, user: Ff7Combatant, ability: Ff7AbilityDef): Ff7Element[] {
  if (ability.element !== 'weapon') return [...ability.element];
  const w = env.rt.weapons[user.id];
  return w?.element ? [w.element as Ff7Element] : [];
}

/** Long Range for this user: the weapon decides for the Attack command [core §5.1]. */
export function longRangeFor(env: Ff7Env, user: Ff7Combatant, ability: Ff7AbilityDef): boolean {
  if (ability.longRange === 'weapon') return env.rt.weapons[user.id]?.longRange === true;
  return ability.longRange === true;
}

/** The ability record, or throw (a missing id is a data bug, never silent). */
export function abilityDef(env: Pick<Ff7Env, 'reg'>, id: string): Ff7AbilityDef {
  const a = env.reg.abilities[id];
  if (!a) throw new Error(`FF7 engine: unknown ability '${id}'`);
  return a;
}
