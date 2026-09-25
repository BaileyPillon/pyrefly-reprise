/**
 * Building the command menu.
 *
 * `AvailableCommand` arrives at the UI with `validTargets` resolved, `enabled`
 * computed and `disabledReason` written — the UI never re-derives legality
 * [docs/CONTRACTS.md].
 */

import type { AbilityDef, AvailableCommand, Command, FFXCombatant } from '../common/types.ts';
import { type Ctx, abilityOf, canSwitchIn, has, isSubmenuMarker, rankOf, tryActor } from './state.ts';
import { blockedBySilence, mpCostFor } from './abilities.ts';
import { reachesAtRange, validTargets } from './targeting.ts';
import { type AimDef, preferredTargetIds } from '../common/aim.ts';
import { furySpellsFor, isMenuMarker, overdriveReady } from './overdrive.ts';
import { availableAeons } from './aeons.ts';
import { triggerHandler } from './ai/index.ts';
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

/**
 * Where the row's target cursor opens: an enemy for an attack, a party member
 * for a cure, a KO'd one first for a revive (`battle/common/aim.ts`). Both games
 * share the rule; this is FFX's half of it.
 */
function withAim(ctx: Ctx, user: FFXCombatant, def: AimDef, row: AvailableCommand): AvailableCommand {
  if (row.validTargets.length < 2) return row; // nothing to narrow
  const candidates = row.validTargets.flatMap((id) => {
    const c = ctx.state.combatants[id];
    return c ? [c] : [];
  });
  const preferred = preferredTargetIds(def, row.targeting, user.side, candidates);
  if (preferred) row.preferredTargets = preferred;
  return row;
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
    // **Reach.** `validTargets` is the single place legality is computed, so an
    // action that cannot cross the airship's range gap comes back with an empty
    // list exactly as a dead formation would. The two cases read completely
    // differently to a player, so they are told apart here — the one place
    // `disabledReason` is written [research/ffx-evrae-airship.md §4.3].
    reason = reachesAtRange(ctx, user, def) ? 'No target' : 'Out of reach';
  }

  const row: AvailableCommand = {
    command,
    label: def.name,
    category: def.category,
    mpCost: cost,
    rank: rankOf(def),
    enabled,
    validTargets: targets,
    // Who the ability hits, so the menu can tell "choose one of these" from
    // "this hits all of these". See `AvailableCommand.targeting`.
    targeting: def.targeting,
  };
  if (reason !== undefined) row.disabledReason = reason;
  if (def.minigame) row.opensMinigame = def.minigame;
  // Doublecast opens the Black Magic list and then that spell's own target
  // step [ffx-combat-core §7.4 row 41, "Two Blk Magic casts"]; the row's own
  // self aim is only a placeholder (PR-0125, `./doublecast.ts`). FFX only.
  if (def.extra?.['castsTwoBlackMagicSpells'] === true) row.wrapsCategory = 'blackmagic';
  return withAim(ctx, user, def, row);
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
    // A submenu label is not an action. The Item rows this menu already
    // carries *are* the submenu it would open, so offering the label as well
    // is a row that can only waste a turn [state.ts `isSubmenuMarker`].
    if (isSubmenuMarker(def)) continue;
    const marker = markerCommand(def);
    const row = rowFor(ctx, user, def, marker ?? { kind: 'ability', id, targets: [] });
    if (marker?.kind === 'escape' && !ctx.rt.canEscape) {
      row.enabled = false;
      row.disabledReason = "Can't escape";
    }
    if (marker?.kind === 'trigger') {
      // An exhausted or ineligible trigger row stays visible and says why —
      // §1.6 offers a third Talk on purpose, and the Evrae orders belong to
      // Tidus and Rikku alone. The reason comes from the trigger's own handler
      // rather than from a hard-coded `id === 'talk'` [ai/index.ts].
      const handler = triggerHandler(marker.id);
      if (handler && !handler.available(ctx, user)) {
        row.enabled = false;
        row.disabledReason = handler.disabledReason;
      }
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

  // Items. Party members only: an aeon's menu is Attack, its Special / Magic,
  // Overdrive, Shield, Boost and Dismiss, with no Item row [ffx-combat-core
  // §6.2, §6.3, from ffx_command.csv], and the party's items cannot even be
  // aimed at one (§6.1). FFX only (PR-0155).
  for (const [itemId, count] of user.side === 'aeon' ? [] : ctx.rt.inventory) {
    if (count <= 0) continue;
    const item = ctx.content.item(itemId);
    const effect = ctx.content.itemEffect(itemId);
    if (!item || !effect || !item.usableInBattle) continue;
    const itemDef = { ...effect, targeting: item.targeting };
    const targets = validTargets(ctx, user, itemDef);
    const row: AvailableCommand = {
      command: { kind: 'item', id: itemId, targets: [] },
      label: item.name,
      category: 'item',
      mpCost: 0,
      rank: 2,
      enabled: targets.length > 0 || item.targeting === 'self',
      validTargets: targets,
      // A party-wide item (a Mega-Potion, an X-Potion mix) must ring all three
      // rather than asking which one — see `AvailableCommand.targeting`.
      targeting: item.targeting,
    };
    // Same two-case reason as an ability row: an offensive item that cannot
    // cross the airship's range gap is "Out of reach", not "No target"
    // [research/ffx-evrae-airship §4.3 — "Use as offence" does not reach, while
    // every restorative does, because it targets your own party].
    if (!row.enabled) row.disabledReason = reachesAtRange(ctx, user, itemDef) ? 'No target' : 'Out of reach';
    if (item.description !== undefined) row.help = item.description;
    rows.push(withAim(ctx, user, itemDef, row));
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
