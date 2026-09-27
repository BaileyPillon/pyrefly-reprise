/**
 * The FF7 command window for one party member [core §9, single source: wiki
 * battle system]: **Attack** (replaced by **Limit** while the gauge is full,
 * core §7.2), **Magic** (the spells the equipped Materia grants, core §8.4),
 * **Item**, **Defend**. `enabled` and `disabledReason` are decided here, never
 * in the UI. Change (row swap) is not offered yet: it needs a command kind the
 * shared contract does not have (listed as open in `docs/handoff/ff7-engine.md`).
 *
 * Also the command check `submit` runs, and the target retarget rule.
 *
 * Pure (AGENTS.md rule 1). Game case: **FF7 only.**
 */

import type { AvailableCommand, CombatantId, Command, Ff7Combatant, Targeting } from '../common/types.ts';
import type { Ff7AbilityDef, Ff7Targeting } from './defs.ts';
import { abilityDef, living, opponentSide, type Ff7Env } from './internal.ts';
import { limitReady } from './limit.ts';
import { canPayMp, spellsFromMateria } from './stats.ts';

/** The shared targeting word for an FF7 one. */
function sharedTargeting(t: Ff7Targeting): Targeting {
  switch (t) {
    case 'one-opponent':
      return 'single-enemy';
    case 'all-opponents':
      return 'all-enemies';
    case 'one-ally':
      return 'single-ally';
    case 'all-allies':
      return 'all-allies';
    case 'self':
      return 'self';
  }
}

/** Ids an ability may target from `user`: living opponents or allies; for a revive, the KO'd allies. */
export function legalTargets(env: Ff7Env, user: Ff7Combatant, ability: Ff7AbilityDef): CombatantId[] {
  const s = env.state;
  switch (ability.targeting) {
    case 'self':
      return [user.id];
    case 'one-opponent':
    case 'all-opponents':
      return living(s, opponentSide(user)).map((c) => c.id);
    case 'one-ally':
    case 'all-allies': {
      const ids = user.side === 'party' ? s.activeIds : s.enemyIds;
      const pool = ids.map((id) => s.combatants[id]).filter((c): c is Ff7Combatant => !!c && !c.removed) as Ff7Combatant[];
      return pool.filter((c) => (ability.revive ? !c.alive : c.alive)).map((c) => c.id);
    }
  }
}

function row(
  command: Command,
  label: string,
  category: AvailableCommand['category'],
  ability: Ff7AbilityDef | null,
  validTargets: CombatantId[],
  enabled: boolean,
  disabledReason?: string,
): AvailableCommand {
  const noTarget = ability !== null && ability.targeting !== 'self' && validTargets.length === 0;
  const reason = !enabled ? disabledReason : noTarget ? 'No target' : undefined;
  return {
    command,
    label,
    category,
    mpCost: ability?.mpCost ?? 0,
    enabled: enabled && !noTarget,
    ...(reason ? { disabledReason: reason } : {}),
    validTargets,
    ...(ability ? { targeting: sharedTargeting(ability.targeting) } : {}),
    ...(ability?.revive ? { preferredTargets: validTargets } : {}),
  };
}

/** The rows for `actor`'s command window, in menu order. */
export function buildCommands(env: Ff7Env, actor: Ff7Combatant): AvailableCommand[] {
  const out: AvailableCommand[] = [];
  const lim = actor.ff7.limit;

  // Attack, or Limit in its place while the gauge is full [core §7.2].
  if (lim && limitReady(lim.gauge) && lim.learnedLimitIds.length > 0) {
    for (const id of lim.learnedLimitIds) {
      const a = abilityDef(env, id);
      out.push(row({ kind: 'limit', id, targets: [] }, a.name, 'attack', a, legalTargets(env, actor, a), true));
    }
  } else {
    const a = abilityDef(env, 'attack');
    out.push(row({ kind: 'attack', targets: [] }, a.name, 'attack', a, legalTargets(env, actor, a), true));
  }

  // Magic from Materia [core §8.4]; greyed when MP cannot pay [core §8.5].
  for (const id of spellsFromMateria({ materia: actor.ff7.materia ?? { weapon: [], armour: [] } }, env.reg.materia)) {
    const a = abilityDef(env, id);
    const pay = canPayMp(actor.mp, a.mpCost);
    out.push(row({ kind: 'ability', id, targets: [] }, a.name, 'magic', a, legalTargets(env, actor, a), pay, pay ? undefined : 'Not enough MP'));
  }

  // Items carried [core §8.6].
  for (const [itemId, count] of Object.entries(env.rt.inventory)) {
    const item = env.reg.items[itemId];
    if (!item || !item.usableInBattle || count <= 0) continue;
    const a = abilityDef(env, item.effect);
    out.push({ ...row({ kind: 'item', id: itemId, targets: [] }, `${item.name} x${count}`, 'item', a, legalTargets(env, actor, a), true), help: `${count} left` });
  }

  // Defend: halves physical damage taken until the next action [core §5.2].
  out.push(row({ kind: 'defend', targets: [] }, 'Defend', 'special', null, [], true));
  return out;
}

/** The ability a command resolves: Attack, a spell, a Limit, an item's effect; null for Defend. */
export function abilityForCommand(env: Ff7Env, command: Command): Ff7AbilityDef | null {
  switch (command.kind) {
    case 'attack':
      return abilityDef(env, 'attack');
    case 'ability':
    case 'limit':
      return abilityDef(env, command.id);
    case 'item': {
      const item = env.reg.items[command.id];
      if (!item) throw new Error(`FF7 engine: unknown item '${command.id}'`);
      return abilityDef(env, item.effect);
    }
    case 'defend':
      return null;
    default:
      throw new Error(`FF7 engine: command '${command.kind}' is not an FF7 command`);
  }
}

/**
 * Is `command` one `actor` may submit now? The kind and id must be an enabled row
 * of {@link buildCommands}; the targets must be legal, one of them unless the
 * spell toggles to all (Bolt, Ice, Cure, core §8.4) or the ability hits all.
 */
export function commandError(env: Ff7Env, actor: Ff7Combatant, command: Command): string | null {
  const rows = buildCommands(env, actor);
  const match = rows.find((r) => r.command.kind === command.kind && ('id' in r.command ? 'id' in command && r.command.id === command.id : true));
  if (!match) return `'${command.kind}' is not in ${actor.id}'s command window`;
  if (!match.enabled) return match.disabledReason ?? 'disabled';
  const ability = abilityForCommand(env, command);
  if (!ability) return null;
  const targets = command.targets;
  if (ability.targeting === 'self' || ability.targeting.startsWith('all-')) return null;
  if (targets.length === 0) return 'no target';
  if (targets.length > 1 && ability.canToggleAll !== true) return 'one target only';
  // A target on the right side, alive or not: under a running clock it may have fallen
  // while the menu was open, and `executionTargets` / the miss rules decide then.
  const s = env.state;
  const side = ability.targeting === 'one-opponent' ? (actor.side === 'party' ? s.enemyIds : s.activeIds) : actor.side === 'party' ? s.activeIds : s.enemyIds;
  const bad = targets.find((t) => !side.includes(t));
  return bad ? `illegal target '${bad}'` : null;
}

/**
 * Resolve the targets at execution time. "All" abilities take every legal
 * target; a single offensive target that died meanwhile is replaced by a random
 * living opponent (one draw) [**our estimate**, gs §5.6 G7's rule applied to the
 * party too]; a toggled cast keeps its list.
 */
export function executionTargets(env: Ff7Env, user: Ff7Combatant, ability: Ff7AbilityDef, chosen: readonly CombatantId[]): Ff7Combatant[] {
  const s = env.state;
  const get = (id: CombatantId): Ff7Combatant | undefined => s.combatants[id] as Ff7Combatant | undefined;
  if (ability.targeting === 'self') return [user];
  if (ability.targeting === 'all-opponents') return living(s, opponentSide(user));
  if (ability.targeting === 'all-allies') return living(s, user.side === 'party' ? 'party' : 'enemy');
  const picked = chosen.map(get).filter((c): c is Ff7Combatant => !!c);
  if (ability.targeting === 'one-opponent' && picked.length === 1 && !picked[0]?.alive) {
    const pool = living(s, opponentSide(user));
    const re = pool[env.rng.int(0, Math.max(0, pool.length - 1))];
    return re ? [re] : [];
  }
  return picked;
}
