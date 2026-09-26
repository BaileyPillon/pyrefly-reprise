/**
 * "What is this action about to do to me?" — per target, for the FFX side.
 *
 * ## This is an adapter, not a second estimator
 *
 * `src/battle/ffx/simulate.ts` (the move advisor's) already answers the hard
 * question the honest way: it clones the state and runs the **real**
 * `executeCommand` on the copy, with a {@link RollPolicy} RNG in place of the
 * seeded one. Every formula, every affinity table, every one-off `extra` rule
 * is the shipped code.
 *
 * The enemy-intent slab needs the same number for the opposite direction — what
 * the *boss* is about to do to each character — and two independently derived
 * figures on one screen is the single worst outcome available: the player reads
 * "1 204" under their own cursor and "about 1 400" over the boss's head and
 * trusts neither. So this file computes nothing. It runs
 * {@link simulateFFXCommand} three times (the `min`/`mid`/`max` policies, which
 * is exactly the variance band) and reshapes the three {@link SimOutcome}s into
 * one per-target list.
 *
 * The only thing it adds is {@link statusOdds}, and only because the simulation
 * cannot supply it: a preview resolves each status roll at its *median*, so it
 * reports a status as landed or not landed. A player being told Mega Death is
 * coming needs the percentage, and the percentage is a pure function of the
 * chance byte and the target's resistance [ffx-combat-core §4.1].
 *
 * If `simulate.ts` moves or renames, this file is the one place that has to
 * change — which is the whole reason it exists as a seam rather than as calls
 * scattered through `intent.ts`.
 *
 * ## Signs
 *
 * `SimOutcome.hpDelta` is **positive when the combatant lost HP**, matching the
 * engine's own convention that healing is negative damage
 * [docs/CONTRACTS.md]. {@link TargetEstimate.amount} keeps that sign, so a
 * boss healing itself reads as a negative number and the panel can say
 * "restores" without a second flag.
 */

import type {
  AbilityDef,
  Affinity,
  BattleState,
  CombatantId,
  Command,
  ElementId,
  FFXCombatant,
  StatusApplication,
  StatusId,
  Targeting,
} from '../common/types.ts';
import { has } from './state.ts';
import { resolveAffinity, resolveElements } from './formulas.ts';
import { weaponElements } from './equipment.ts';
import type { FFXContentRegistry } from './registry.ts';
import {
  type RollPolicy,
  type SimOutcome,
  previewHitChance,
  simulateFFXCommand,
} from './simulate.ts';

/** What one action is estimated to do to one combatant. */
export interface TargetEstimate {
  targetId: CombatantId;
  targetName: string;
  /** Signed HP delta. **Positive means this combatant loses that much HP.** */
  amount: number;
  /** The same figure at the bottom and top of the variance band. */
  min: number;
  max: number;
  /** Elemental reading for this target: `weak`, `absorb`, `immune`… */
  affinity: Affinity;
  /** Percentage, or `null` when the action cannot miss (§2.11's ALWAYS branch). */
  hitChancePercent: number | null;
  /** `amount / hp` before the hit. 1 means "exactly lethal". 0 for healing. */
  hpFraction: number;
  /** The simulation took this combatant to 0 HP. */
  lethal: boolean;
  /** Statuses the action would try on this target, with their real odds. */
  statuses: StatusOdds[];
}

/** One status application, resolved against one target's resistance. */
export interface StatusOdds {
  status: StatusId;
  /** 0–100. 100 is the no-RNG "always" branch, not a rounded 99.6%. */
  percent: number;
  /** The target's resistance blocks it outright. */
  blocked: boolean;
}

/** The whole action, estimated. */
export interface ActionEstimate {
  abilityId: string;
  name: string;
  targeting: Targeting;
  hits: number;
  elements: ElementId[];
  damageType: AbilityDef['damageType'];
  /** The sign is flipped: this restores rather than damages. */
  heals: boolean;
  /** Everyone whose HP the simulation moved, plus everyone it aimed a status at. */
  perTarget: TargetEstimate[];
  /** Total HP the party (and its aeon) loses. Never negative. */
  totalHarmToParty: number;
  /** Any target taken to 0. */
  anyLethal: boolean;
  /** Combatants the action stands back up — Full-Life on a KO'd member. */
  revives: CombatantId[];
  /** The engine refused the command on this board. */
  rejected: boolean;
}

/**
 * The odds one status application lands on one target, as a percentage.
 *
 * Mirrors `statuses.ts`'s `rollStatus` branch for branch, minus the draw
 * [ffx-combat-core §4.1]:
 *
 * ```
 * chance >= 255           -> 100, immunity ignored
 * resistance >= 255       -> 0
 * chance === 254          -> 100
 * otherwise               -> chance - resistance, over a `rng % 101` draw
 * ```
 *
 * `chance - resistance` and not a ratio: the draw is uniform over 0–100 and the
 * test is `>`, so a net 40 lands 40 times in 101. Rounding that to 40% is the
 * honest reading and the one the research quotes.
 *
 * The Zombie branch matters more than any other line in this file. A living
 * Zombie's resistance to ordinary instant death is raised to 255, so Mega Death
 * — chance 100 — simply fails against them. That is the whole of Chapter 2's
 * strategy, and it is why the panel prints "Death 0% (blocked)" rather than a
 * generic "may inflict Death" [ffx-combat-core §4.2, ffx-yunalesca §7.1].
 */
export function statusOdds(target: FFXCombatant, app: StatusApplication): StatusOdds {
  const chance = app.chance;
  if (chance >= 255) return { status: app.status, percent: 100, blocked: false };
  let resistance = target.immunities[app.status] ?? 0;
  if (app.status === 'ko' && has(target, 'zombie') && target.alive) resistance = 255;
  if (resistance >= 255) return { status: app.status, percent: 0, blocked: true };
  if (chance === 254) return { status: app.status, percent: 100, blocked: false };
  const net = Math.max(0, Math.min(100, chance - resistance));
  return { status: app.status, percent: net, blocked: net <= 0 };
}

/** Which combatants a simulation actually touched, in state order. */
function touched(state: Readonly<BattleState>, mid: SimOutcome): CombatantId[] {
  const ids = new Set<CombatantId>();
  for (const [id, delta] of Object.entries(mid.hpDelta)) if (delta !== 0) ids.add(id);
  for (const change of mid.statusChanges) ids.add(change.targetId);
  for (const id of mid.kills) ids.add(id);
  for (const id of mid.revives) ids.add(id);
  const order = [
    ...state.activeIds,
    ...(state.aeonId ? [state.aeonId] : []),
    ...state.reserveIds,
    ...state.enemyIds,
  ];
  const out = order.filter((id) => ids.has(id));
  for (const id of ids) if (!out.includes(id)) out.push(id);
  return out;
}

function run(
  state: Readonly<BattleState>,
  actorId: CombatantId,
  command: Command,
  roll: RollPolicy,
  content?: FFXContentRegistry,
  aim?: CombatantId,
): SimOutcome | null {
  return simulateFFXCommand(state, actorId, command, { roll, ...(content ? { content } : {}), ...(aim ? { aim } : {}) });
}

/**
 * Estimate one enemy command against the live board.
 *
 * `state` is never mutated — `simulateFFXCommand` clones before it resolves.
 * Returns `null` when the actor is off the board or the simulation threw
 * (a one-off scripted rule that did not expect this position); the panel then
 * prints the move's name and description with no number, which is strictly
 * better than printing a number it could not compute.
 *
 * `content` is the live engine's own registry. Passing it matters: without it
 * the simulation falls back to the **process-wide** one, which is empty in a
 * unit test and stale in any host that built its engine with an injected
 * registry — and an unregistered ability estimates as "does nothing".
 */
export function estimateCommand(
  state: Readonly<BattleState>,
  actorId: CombatantId,
  command: Command,
  def: AbilityDef,
  content?: FFXContentRegistry,
  /** Land any random pick on this combatant (PR-0153's per-candidate rows). */
  aim?: CombatantId,
): ActionEstimate | null {
  const mid = run(state, actorId, command, 'mid', content, aim);
  if (!mid) return null;
  const lo = run(state, actorId, command, 'min', content, aim) ?? mid;
  const hi = run(state, actorId, command, 'max', content, aim) ?? mid;
  const resolved = mid.ability ?? def;

  const user = state.combatants[actorId] as FFXCombatant | undefined;
  const elements = user ? resolveElements(user, resolved, weaponElements(user)) : [...resolved.element];

  const perTarget: TargetEstimate[] = [];
  for (const id of touched(state, mid)) {
    const target = state.combatants[id] as FFXCombatant | undefined;
    if (!target) continue;
    const amount = mid.hpDelta[id] ?? 0;
    const statuses = resolved.statusEffects.map((app) => statusOdds(target, app));
    perTarget.push({
      targetId: id,
      targetName: target.name,
      amount,
      min: lo.hpDelta[id] ?? amount,
      max: hi.hpDelta[id] ?? amount,
      affinity: resolveAffinity(target, elements).affinity,
      hitChancePercent: previewHitChance(state, actorId, id, resolved),
      hpFraction: target.hp > 0 ? Math.max(0, amount) / target.hp : 0,
      lethal: mid.kills.includes(id),
      statuses,
    });
  }

  return {
    abilityId: resolved.id,
    name: resolved.name,
    targeting: resolved.targeting,
    hits: resolved.hits,
    elements: [...elements],
    damageType: resolved.damageType,
    heals: resolved.flags.includes('heals'),
    perTarget,
    totalHarmToParty: mid.harmToAllies,
    anyLethal: mid.kills.length > 0,
    revives: [...mid.revives],
    rejected: mid.rejected,
  };
}
