/**
 * Building the command menu.
 *
 * `AvailableCommand` arrives at the UI with `validTargets` resolved, `enabled`
 * computed and `disabledReason` written — the UI never re-derives legality
 * [docs/CONTRACTS.md].
 */

import type { AbilityDef, AvailableCommand, FFXCombatant } from '../common/types.ts';
import { type Ctx, abilityOf, has, isAlive, rankOf, tryActor } from './state.ts';
import { blockedBySilence, mpCostFor } from './abilities.ts';
import { validTargets } from './targeting.ts';
import { overdriveReady } from './overdrive.ts';
import { availableAeons } from './aeons.ts';
import { ATTACK_ABILITY_ID, DEFEND_ABILITY_ID } from './registry.ts';

function rowFor(ctx: Ctx, user: FFXCombatant, def: AbilityDef, command: AvailableCommand['command']): AvailableCommand {
  const cost = mpCostFor(user, def);
  const targets = validTargets(ctx, user, def);
  let enabled = true;
  let reason: string | undefined;

  if (blockedBySilence(user, def)) {
    enabled = false;
    reason = 'Silenced';
  } else if (cost > user.mp) {
    enabled = false;
    reason = 'Not enough MP';
  } else if (targets.length === 0 && def.targeting !== 'self') {
    enabled = false;
    reason = 'No target';
  }

  const row: AvailableCommand = {
    command,
    label: def.name,
    category: def.category,
    mpCost: cost,
    rank: rankOf(def),
    enabled,
    validTargets: targets,
  };
  if (reason !== undefined) row.disabledReason = reason;
  if (def.minigame) row.opensMinigame = def.minigame;
  return row;
}

/**
 * Every row this actor may be offered.
 *
 * Berserk collapses the menu to a single auto-attack; Confuse never reaches
 * here because a confused actor is resolved by the engine, not the player
 * [ffx-combat-core §4.2].
 */
export function availableCommands(ctx: Ctx, user: FFXCombatant): AvailableCommand[] {
  const rows: AvailableCommand[] = [];
  const attackDef = abilityOf(ctx, ATTACK_ABILITY_ID);
  if (attackDef) rows.push(rowFor(ctx, user, attackDef, { kind: 'attack', targets: [] }));
  if (has(user, 'berserk')) return rows;

  for (const id of user.learnedAbilityIds) {
    const def = abilityOf(ctx, id);
    if (!def || def.category === 'overdrive') continue;
    if (def.category === 'summon') continue;
    rows.push(rowFor(ctx, user, def, { kind: 'ability', id, targets: [] }));
  }

  // Overdrives. Silence never blocks one [ffx-combat-core §5.1].
  if (overdriveReady(user)) {
    for (const id of user.overdrive?.unlockedOverdriveIds ?? []) {
      const def = abilityOf(ctx, id);
      if (!def) continue;
      const row = rowFor(ctx, user, def, { kind: 'overdrive', id, targets: [] });
      row.enabled = row.validTargets.length > 0 || def.targeting === 'self';
      if (!row.enabled) row.disabledReason = 'No target';
      rows.push(row);
    }
  }

  // Summon, Yuna only, rank 3. Blocked by Silence, and never while an aeon is
  // already out.
  if (ctx.state.aeonId === null && ctx.rt.aeonRoster.size > 0 && user.id === 'yuna') {
    for (const aeon of availableAeons(ctx)) {
      const row: AvailableCommand = {
        command: { kind: 'summon', id: aeon.id, targets: [] },
        label: aeon.name,
        category: 'summon',
        mpCost: 0,
        rank: 3,
        enabled: !has(user, 'silence'),
        validTargets: [],
      };
      if (!row.enabled) row.disabledReason = 'Silenced';
      rows.push(row);
    }
  }

  // Items.
  for (const [itemId, count] of ctx.rt.inventory) {
    if (count <= 0) continue;
    const item = ctx.content.item(itemId);
    const effect = ctx.content.itemEffect(itemId);
    if (!item || !effect || !item.usableInBattle) continue;
    const targets = validTargets(ctx, user, { ...effect, targeting: item.targeting });
    const row: AvailableCommand = {
      command: { kind: 'item', id: itemId, targets: [] },
      label: item.name,
      category: 'item',
      mpCost: 0,
      rank: 2,
      enabled: targets.length > 0 || item.targeting === 'self',
      validTargets: targets,
    };
    if (!row.enabled) row.disabledReason = 'No target';
    if (item.description !== undefined) row.help = item.description;
    rows.push(row);
  }

  const defendDef = abilityOf(ctx, DEFEND_ABILITY_ID);
  if (defendDef) rows.push(rowFor(ctx, user, defendDef, { kind: 'defend', targets: [] }));

  // Switch: the incoming member takes the turn happening right now, so the turn
  // is not consumed by the swap [ffx-combat-core §1.7].
  if (user.side === 'party') {
    for (const id of ctx.state.reserveIds) {
      const bench = tryActor(ctx, id);
      if (!bench || bench.removed === false || has(bench, 'eject')) continue;
      rows.push({
        command: { kind: 'switch', targets: [], extra: { outId: user.id, inId: id } },
        label: bench.name,
        category: 'special',
        mpCost: 0,
        rank: 3,
        enabled: isAlive(bench),
        validTargets: [],
      });
    }
  }

  // Aeon sub-commands.
  if (user.side === 'aeon') {
    rows.push({
      command: { kind: 'dismiss', targets: [] },
      label: 'Dismiss',
      category: 'aeon',
      mpCost: 0,
      rank: 3,
      enabled: user.aeon?.dismissable !== false,
      validTargets: [],
    });
  }

  if (ctx.rt.canEscape) {
    rows.push({
      command: { kind: 'escape', targets: [], extra: { mode: 'single' } },
      label: 'Escape',
      category: 'special',
      mpCost: 0,
      rank: 1,
      enabled: true,
      validTargets: [],
    });
  }

  return rows;
}
