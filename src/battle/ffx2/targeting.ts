/**
 * Target resolution and the player command menu.
 *
 * `Decision.commands` hands the UI `AvailableCommand`s with `validTargets`
 * already resolved, `enabled` already computed and `disabledReason` already
 * written — the UI never re-derives legality (`docs/CONTRACTS.md`, UI agents).
 */

import type {
  AbilityDef,
  AvailableCommand,
  CombatantId,
  Command,
  Rng,
  Side,
} from '../common/types.ts';
import type {
  AbilityRegistry,
  DressphereRegistry,
  Ffx2Unit,
  GarmentGridDef,
  ItemRegistry,
} from './internal.ts';
import { adjacentNodes } from './garment-grids.ts';
import { aimer } from './aim.ts';

/** `aeon` never appears in X-2; party and enemy are the only two sides in play. */
function isFriendly(a: Side, b: Side): boolean {
  return (a === 'enemy') === (b === 'enemy');
}

/** On the field and selectable. `allowDead` opens KO'd allies to revival effects. */
export function isTargetable(unit: Ffx2Unit, allowDead = false): boolean {
  if (unit.removed || unit.flags.hidden || unit.flags.untargetable) return false;
  return allowDead || unit.alive;
}

/** Everyone on the opposite side of `actor` who can be hit. */
export function opponentsOf(units: readonly Ffx2Unit[], actor: Ffx2Unit, allowDead = false): Ffx2Unit[] {
  return units.filter((u) => !isFriendly(u.side, actor.side) && isTargetable(u, allowDead));
}

/** Everyone on `actor`'s own side who can be hit, `actor` included. */
export function alliesOf(units: readonly Ffx2Unit[], actor: Ffx2Unit, allowDead = false): Ffx2Unit[] {
  return units.filter((u) => isFriendly(u.side, actor.side) && isTargetable(u, allowDead));
}

/**
 * Resolve an ability's targets.
 *
 * `requested` is honoured when it names legal targets; otherwise the targeting
 * mode picks for us, which is what lets an AI script submit a command with an
 * empty target list. `random-enemy` / `random-ally` return the *pool* — the
 * resolver re-rolls per hit, because X-2 picks a fresh target each strike.
 */
export function resolveTargets(
  units: readonly Ffx2Unit[],
  actor: Ffx2Unit,
  ability: Pick<AbilityDef, 'targeting' | 'flags'>,
  requested: readonly CombatantId[],
  rng: Rng,
): Ffx2Unit[] {
  const allowDead = ability.flags.includes('can-target-dead');
  const byId = (id: CombatantId): Ffx2Unit | undefined =>
    units.find((u) => u.id === id && isTargetable(u, allowDead));

  const named = requested.map(byId).filter((u): u is Ffx2Unit => u !== undefined);

  switch (ability.targeting) {
    case 'self':
      return [actor];
    case 'all-enemies':
    case 'random-enemy':
      return opponentsOf(units, actor, allowDead);
    case 'all-allies':
    case 'random-ally':
      return alliesOf(units, actor, allowDead);
    case 'all':
      return units.filter((u) => isTargetable(u, allowDead));
    case 'single-enemy': {
      if (named.length > 0) return [named[0] as Ffx2Unit];
      const pool = opponentsOf(units, actor, allowDead);
      return pool.length > 0 ? [rng.pick(pool)] : [];
    }
    case 'single-ally': {
      if (named.length > 0) return [named[0] as Ffx2Unit];
      const pool = alliesOf(units, actor, allowDead);
      return pool.length > 0 ? [rng.pick(pool)] : [];
    }
    case 'single-any':
    default: {
      if (named.length > 0) return [named[0] as Ffx2Unit];
      const pool = units.filter((u) => isTargetable(u, allowDead));
      return pool.length > 0 ? [rng.pick(pool)] : [];
    }
  }
}

/**
 * Ids the UI may offer for one ability.
 *
 * **This is the legal *pool*, not a pick.** `src/ui/ffx2/CommandMenu.ts:238`
 * and `src/ui/ffx/CommandMenuLogic.ts:153` both read `validTargets` as the
 * cursor's candidate list — one entry means "auto-target", several mean "let
 * the player choose" — and `src/battle/ffx/commands.ts` fills it that way
 * (Cure is offered as all three actives, not as one).
 *
 * It used to be computed by running {@link resolveTargets} with a stub RNG,
 * which is right for `self` / `all-*` but **collapses every `single-*` mode to
 * a single id**, because that is what `resolveTargets` is for: it *chooses*.
 * The consequence in play was that a White Mage's Cure, Cura and Life could
 * only ever be aimed at whichever ally sorted first — she could not heal the
 * other two at all — and a single-enemy row on a multi-part boss could only
 * name the first part. Both the UI cursor and every tactic read this list, so
 * both were blocked. Fixed by returning the pool for the `single-*` modes and
 * leaving the rest to `resolveTargets` [docs/CONTRACT-CHANGES.md, 2026-09-17 `ffx2-bahamut`].
 */
export function validTargetIds(
  units: readonly Ffx2Unit[],
  actor: Ffx2Unit,
  ability: Pick<AbilityDef, 'targeting' | 'flags'>,
): CombatantId[] {
  const allowDead = ability.flags.includes('can-target-dead');
  switch (ability.targeting) {
    case 'single-enemy':
      return opponentsOf(units, actor, allowDead).map((u) => u.id);
    case 'single-ally':
      return alliesOf(units, actor, allowDead).map((u) => u.id);
    case 'single-any':
      return units.filter((u) => isTargetable(u, allowDead)).map((u) => u.id);
    default:
      break;
  }
  return resolveTargets(units, actor, ability, [], {
    // A deterministic stand-in: `validTargets` must not consume the battle RNG,
    // because the menu is rebuilt every time the player moves the cursor.
    next: () => 0,
    int: (min: number) => min,
    pick: <T,>(items: readonly T[]) => items[0] as T,
    seed: () => undefined,
    currentSeed: 0,
  } as Rng).map((u) => u.id);
}

/**
 * What an ability costs its **user in HP**, in whole HP, for this user, now.
 *
 * The Dark Knight's whole design is that her skillset is paid for in HP rather
 * than MP: Darkness costs **12.5% (1/8) of the user's max HP**, waived while
 * she has Spellspring [ffx2-vegnagun-shuyin §6.4 `[verified: 2 sources]`;
 * §7.1 "Its cost is HP, not MP"]. The data layer writes that as
 * `extra.hpCostPercent` (a *percentage*, so Darkness is `12.5`) plus an
 * optional `extra.freeUnderSpellspring`; before this existed the field was
 * written by the data layer and read by nobody, so Darkness was free and the
 * single strongest ability in the chapter had no downside at all.
 *
 * Returns 0 for everything else, so this is inert for the rest of the game.
 */
export function hpCostFor(actor: Ffx2Unit, ability: AbilityDef): number {
  const extra = ability.extra;
  if (!extra) return 0;
  const percent = extra['hpCostPercent'];
  if (typeof percent !== 'number' || percent <= 0) return 0;
  if (actor.statuses.spellspring && extra['freeUnderSpellspring'] === true) return 0;
  return Math.max(1, Math.floor((actor.stats.maxHp * percent) / 100));
}

/** Why a command row is greyed out, or `null` when it is offered. */
function disabledReason(actor: Ffx2Unit, ability: AbilityDef, mpCost: number): string | null {
  if (actor.statuses.itchy) return 'Itchy — spherechange first';
  if (actor.mp < mpCost && !actor.statuses.spellspring) return 'Not enough MP';
  // "…fails if the user cannot pay it" — an HP-cost ability is greyed out, not
  // suicidal, exactly as the MP row above it is. §6.4
  if (actor.hp <= hpCostFor(actor, ability)) return 'Not enough HP';
  const silenced = Boolean(actor.statuses.silence);
  if (silenced && (ability.category === 'blackmagic' || ability.category === 'whitemagic')) {
    return 'Silenced';
  }
  return null;
}

/** Spellspring zeroes every MP cost. [ffx2-combat-core §2.8] */
export function effectiveMpCost(actor: Ffx2Unit, ability: AbilityDef): number {
  return actor.statuses.spellspring ? 0 : ability.mpCost;
}

export interface MenuContext {
  units: Ffx2Unit[];
  abilities: AbilityRegistry;
  dresspheres: DressphereRegistry;
  grid?: GarmentGridDef;
  /** Dressphere id occupying each Garment Grid node, `null` for an empty node. */
  gridNodes?: Array<string | null>;
  canEscape: boolean;
  /** Item table, so the Item submenu can be built. */
  items?: ItemRegistry;
  /** Live counts keyed by item id (`setup.ts` `inventoryCounts`). */
  inventory?: Readonly<Record<string, number>>;
}

/**
 * Build the command menu for one girl.
 *
 * Berserk leaves only Attack; Itchy leaves only the L1 spherechange and Escape
 * (§2.8); Curse disables the L1 menu entirely (§4.2).
 *
 * **Gate major, fixed here:** every standard dressphere's data file now also
 * ships its own `x2-<name>-attack` ability id in `abilityIds`
 * (`research/ffx2-combat-core.md` §3.1-3.13). This function already builds
 * the one true Attack row above (`ctx.abilities.get('attack')`, resolved by
 * `command.kind === 'attack'` everywhere the engine executes or previews an
 * attack — `execute.ts`, `simulate.ts`, and every tactics/strategy reader
 * that pattern-matches that `kind`); it then *also* looped the dressphere's
 * own ability list unfiltered, which pushed that same `x2-<name>-attack`
 * entry again as a second, separately-clickable "Attack" — two
 * `category: 'attack'` commands, so `CommandMenu.groupRows()` grouped them
 * into an "Attack" submenu with two rows both labelled ATTACK, and the two
 * rows were not even equivalent (different targeting/flags/message).
 * The fix drops an attack-category entry from the *offered abilities* loop
 * only — never the top-level generic row, so `command.kind` for "Attack" is
 * unchanged everywhere else that reads it (a wider retarget of "Attack" onto
 * the dressphere-specific ability id would change what every `kind ===
 * 'attack'` reader sees, which is `src/engine/tactics/**`'s territory, not
 * this menu-building function's — `tests/unit/strategy-ffx2-vegnagun-shuyin
 * .test.ts`'s node-targeting harness catches exactly that if it is tried).
 * Mascot (§3.14) has no ability table yet [data gap] and never had a duplicate.
 */
export function buildCommands(actor: Ffx2Unit, ctx: MenuContext): AvailableCommand[] {
  const out: AvailableCommand[] = [];
  const sphereId = actor.dresspheres?.current ?? '';
  const sphere = ctx.dresspheres.get(sphereId);
  const berserked = Boolean(actor.statuses.berserk);
  const itchy = Boolean(actor.statuses.itchy);
  const aim = aimer(ctx.units, actor);

  const attack = ctx.abilities.get('attack');
  if (attack && (sphere?.hasAttack ?? true) && !itchy) {
    out.push(aim(attack, {
      command: { kind: 'attack', targets: [] },
      label: 'Attack',
      category: 'attack',
      mpCost: 0,
      enabled: true,
      validTargets: validTargetIds(ctx.units, actor, attack),
      targeting: attack.targeting,
    }));
  }

  if (!berserked && !itchy) {
    const learned = actor.dresspheres?.abilitiesLearned?.[sphereId]?.learned ?? [];
    const offered = learned.length > 0 ? learned : (sphere?.abilityIds ?? []);
    for (const id of offered) {
      const ability = ctx.abilities.get(id);
      if (!ability) continue;
      // The generic row above is already this dressphere's one Attack, so skip
      // **that exact record** and nothing else.
      //
      // Round 03's fix filtered by `category === 'attack'`, which is wider than
      // the duplicate it was aimed at: every attack-category *ability* a
      // dressphere owns went with it. Audited over the shipped tables (round 04
      // PR-0024): Lady Luck lost Tantalize and Trainer lost its whole pet kit —
      // Kogoro Blaze, Doom Kogoro, Pound!, Sneaky Ghiki, Ghiki Gouge, Bully
      // Ghiki, Maulwings! — although Trainer ships no `x2-trainer-attack` and so
      // never had a duplicate to fix at all. Identity, not category:
      // `x2-<sphere>-attack` is the id convention every dressphere's own generic
      // attack follows, and `hasAttack` is what put the row above on screen.
      //
      // FFX-2 only: this is the ATB engine's command builder. FFX's CTB menu is
      // built in `src/battle/ffx/commands.ts` and never had this row.
      if (id === `x2-${sphereId}-attack`) continue;
      const mpCost = effectiveMpCost(actor, ability);
      const reason = disabledReason(actor, ability, mpCost);
      out.push(aim(ability, {
        command: { kind: 'ability', id, targets: [] },
        label: ability.name,
        category: ability.category,
        mpCost,
        enabled: reason === null,
        ...(reason ? { disabledReason: reason } : {}),
        validTargets: validTargetIds(ctx.units, actor, ability),
        // Who it hits, so the menu rings a party-wide cure on all three rather
        // than asking which one. See `AvailableCommand.targeting`.
        targeting: ability.targeting,
        ...(ability.minigame ? { opensMinigame: ability.minigame } : {}),
      }));
    }
  }

  // L1 spherechange. One link only; gates on that link are passed through. §4.2
  if (!berserked && ctx.grid && actor.dresspheres) {
    const cursed = Boolean(actor.statuses.curse);
    const node = actor.dresspheres.garmentGrid.nodePosition;
    for (const step of adjacentNodes(ctx.grid, node)) {
      const to = ctx.gridNodes?.[step.node] ?? null;
      if (!to) continue;
      out.push({
        command: {
          kind: 'spherechange',
          targets: [],
          extra: { toDressphere: to, toNode: step.node, gatesCrossed: step.gates },
        },
        label: to,
        category: 'dressphere',
        mpCost: 0,
        enabled: !cursed,
        ...(cursed ? { disabledReason: 'Cursed' } : {}),
        validTargets: [],
        help: step.gates.length > 0 ? `Passes ${step.gates.join(' + ')}` : undefined,
      });
    }
  }

  // --- Item --------------------------------------------------------------
  //
  // X-2 has **no Item command inside a Special Dressphere** and none while
  // Berserk or Itchy; otherwise every girl shares one party inventory
  // [ffx2-combat-core §3.15, §2.8].
  //
  // This submenu did not exist. `execute.ts` has always *resolved* a
  // `kind: 'item'` command and `Ffx2EngineOptions.items` has always carried the
  // table, but nothing ever offered a row, so a party's whole inventory — 25
  // Phoenix Downs, 20 X-Potions and the Light/Lunar Curtains that
  // `ffx2-vegnagun-shuyin.md` §7.2 opens the Shuyin fight with — was
  // unreachable in play and `FFX2PartyBuild.inventory` was decorative.
  if (!berserked && !itchy && ctx.items) {
    for (const [itemId, count] of Object.entries(ctx.inventory ?? {})) {
      if (count <= 0) continue;
      const item = ctx.items.get(itemId);
      if (!item || !item.usableInBattle) continue;
      const effect = typeof item.effect === 'string' ? ctx.abilities.get(item.effect) : item.effect;
      if (!effect) continue;
      // The **item's** targeting wins over its effect ability's: a Phoenix Down
      // is `single-ally` even though its effect revives, and `can-target-dead`
      // rides along from the effect so a KO'd girl stays selectable.
      const targets = validTargetIds(ctx.units, actor, { targeting: item.targeting, flags: effect.flags });
      out.push(aim(effect, {
        command: { kind: 'item', id: itemId, targets: [] },
        label: item.name,
        category: 'item',
        mpCost: 0,
        enabled: targets.length > 0,
        ...(targets.length > 0 ? {} : { disabledReason: 'No legal target' }),
        validTargets: targets,
        targeting: item.targeting,
        ...(item.description !== undefined ? { help: item.description } : {}),
      }));
    }
  }

  if (ctx.canEscape) {
    out.push({
      command: { kind: 'escape', targets: [] },
      label: 'Escape',
      category: 'special',
      mpCost: 0,
      enabled: true,
      validTargets: [],
    });
  }

  // Never an empty menu [PR-0045, critical, FFX-2 only]: Berserk closes
  // abilities, spherechange and items (§2.8) and White Mage / Black Mage /
  // Songstress have no Attack row (§3.4-3.6), so the list came out `[]` and the
  // HUD opened a menu nothing could answer. `engine.nextDecision` is the repair
  // (a Berserked turn never reaches the player); this is the invariant behind it.
  // Not an invented damage row (hard rule 6 — see `berserkCommand`): `'defend'`
  // is what `execute.ts`'s no-ability branch spends a turn on (X-2 has no Defend
  // *command*, §2.3), so the row is labelled for what it does.
  if (out.length === 0 && actor.alive && !actor.removed) {
    out.push({
      command: { kind: 'defend', targets: [] },
      label: 'Wait',
      category: 'special',
      mpCost: 0,
      enabled: true,
      validTargets: [],
      help: 'No command is available; the turn passes.',
    });
  }

  return out;
}

/**
 * The command a Berserked girl takes, with no player involved. **FFX-2 only.**
 *
 * §2.8: she "can only use the basic Attack command; **player loses control**", so
 * the engine resolves the turn itself and attacks a legal target drawn from the
 * seeded RNG (the sources do not publish Berserk's target choice).
 * **Open question for Bailey — the sources conflict:** §2.8 says only Attack,
 * §3.4-3.6 say those three dresspheres have no Attack command, and `research/`
 * does not settle it. Rather than invent a damage row (hard rule 6) the turn
 * passes; only this function changes if the answer is "she swings anyway".
 */
export function berserkCommand(actor: Ffx2Unit, ctx: MenuContext, rng: Rng): Command {
  const attack = buildCommands(actor, ctx).find((row) => row.command.kind === 'attack');
  if (!attack || attack.validTargets.length === 0) return { kind: 'defend', targets: [] };
  return { kind: 'attack', targets: [rng.pick(attack.validTargets)] };
}
