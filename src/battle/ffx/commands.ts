/**
 * Building the command menu.
 *
 * `AvailableCommand` arrives at the UI with `validTargets` resolved, `enabled`
 * computed and `disabledReason` written — the UI never re-derives legality
 * [docs/CONTRACTS.md].
 */

import type { AbilityDef, AvailableCommand, Command, FFXCombatant } from '../common/types.ts';
import { type Ctx, abilityOf, canSwitchIn, has, rankOf, tryActor } from './state.ts';
import { blockedBySilence, mpCostFor } from './abilities.ts';
import { validTargets } from './targeting.ts';
import { furySpellsFor, isMenuMarker, overdriveReady } from './overdrive.ts';
import { availableAeons } from './aeons.ts';
import { talkAvailable } from './ai/index.ts';
import { ATTACK_ABILITY_ID, DEFEND_ABILITY_ID } from './registry.ts';

/**
 * The command a **menu marker** row must actually submit.
 *
 * Three ids in `learnedAbilityIds` are labels for a different `Command` kind,
 * and each one says so in its own catalog record's `extra`
 * (`data/ffx/abilities/special-menu-markers.ts`): Flee is an `EscapeCommand`
 * with `mode: 'party'`, Talk is a `TriggerCommand`.
 *
 * Until this existed the menu offered them as `{ kind: 'ability' }`, which
 * `execute.ts` resolved as a `formula: 'none'`, `hits: 0` record — a silently
 * wasted turn. **Jecht's Overdrive gauge could therefore never be zeroed by a
 * player**, although the guide and the intent panel both advertise Talk's two
 * charges, and `engine/tactics/braskas-final-aeon.ts` had to re-shape the row
 * by hand so the auto-battler worked at all. The row a menu offers must be
 * submittable verbatim [AGENTS.md hard rule 4].
 */
function markerCommand(def: AbilityDef): Command | null {
  const kind = def.extra?.['resolvesAsCommandKind'];
  if (kind === 'trigger') {
    const id = def.extra?.['triggerId'];
    return { kind: 'trigger', id: typeof id === 'string' ? id : def.id, targets: [] };
  }
  if (kind === 'escape') {
    const mode = def.extra?.['escapeMode'] === 'party' ? 'party' : 'single';
    return { kind: 'escape', targets: [], extra: { mode } };
  }
  return null;
}

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
    const marker = markerCommand(def);
    const row = rowFor(ctx, user, def, marker ?? { kind: 'ability', id, targets: [] });
    if (marker?.kind === 'escape' && !ctx.rt.canEscape) {
      row.enabled = false;
      row.disabledReason = "Can't escape";
    }
    if (marker?.kind === 'trigger' && marker.id === 'talk' && !talkAvailable(ctx, user)) {
      // §1.6 offers a third Talk on purpose and §4.7 gives each character one
      // line; an exhausted row stays visible and says why.
      row.enabled = false;
      row.disabledReason = 'Nothing left to say';
    }
    rows.push(row);
  }

  // Overdrives. Silence never blocks one [ffx-combat-core §5.1].
  if (overdriveReady(user)) {
    for (const id of user.overdrive?.unlockedOverdriveIds ?? []) {
      const def = abilityOf(ctx, id);
      if (!def) continue;
      // Lulu's Overdrive is a **menu marker**: `'fury'` is the submenu label,
      // and the real command names one of the 19 `<spell>-fury` rows, because
      // `FuryResult` has no field to carry which spell was chosen
      // [CONTRACT-CHANGES decision 9, ffx-combat-core §5.7]. The build shipped
      // only the marker, `execute.ts` refuses a marker, and Fury was therefore
      // **uncastable**. Expand it here, into the spells she has actually
      // learned — §5.7's input begins "after choosing a learned Blk Magic
      // spell".
      if (isMenuMarker(def)) {
        for (const spell of furySpellsFor(ctx, user, def)) {
          const row = rowFor(ctx, user, spell, { kind: 'overdrive', id: spell.id, targets: [] });
          row.enabled = row.validTargets.length > 0 || spell.targeting === 'self';
          if (!row.enabled) row.disabledReason = 'No target';
          rows.push(row);
        }
        continue;
      }
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
  //
  // The row is gated on `canSwitchIn`, **not** `isAlive`. `isAlive` folds in
  // `onField`, and a benched member is by definition off the field
  // (`removed === true`), so the old gate disabled every switch row the engine
  // ever built and four of the seven guardians could never enter a battle.
  // §1.7's rule is that any reserve member may be swapped in; only one who
  // cannot take the handed-over turn — KO'd, petrified, ejected — may not.
  if (user.side === 'party') {
    for (const id of ctx.state.reserveIds) {
      const bench = tryActor(ctx, id);
      if (!bench || bench.removed === false || has(bench, 'eject')) continue;
      const row: AvailableCommand = {
        command: { kind: 'switch', targets: [], extra: { outId: user.id, inId: id } },
        label: bench.name,
        category: 'special',
        mpCost: 0,
        rank: 3,
        enabled: canSwitchIn(bench),
        validTargets: [],
      };
      if (!row.enabled) row.disabledReason = 'Unable to fight';
      rows.push(row);
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
