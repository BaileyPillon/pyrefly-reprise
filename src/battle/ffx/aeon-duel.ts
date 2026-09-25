/**
 * **An aeon duel**: a formation that "can only be fought by aeons", with the
 * **mirror lock** on the aeon the enemy summoner holds (Chapter XIV, Isaaru's
 * contest of aeons in the Via Purifico).
 *
 * Source: `research/ffx-isaaru-bevelle.md` §1.2 (the rules of the duel) and
 * `docs/plans/chapter-isaaru-review.md` §4.3 I-G2, I-G3, I-G4 and B6, B11,
 * B13 — every recommendation Bailey took on 2026-09-25 ("I'll go with
 * all your recommendations").
 *
 * | Rule | Where it bites | Confidence |
 * |---|---|---|
 * | Yuna cannot summon the aeon she is facing | {@link availableAeons} skips it; the Summon row shows greyed "Mirror of Grothia" (O-5 pick) | §1.2 [verified: 2 sources] |
 * | Only aeons can hurt his aeons | Yuna's foe-aimed rows greyed "Only an aeon can fight an aeon" and refused if submitted | the rule [verified: 2 sources]; the greyed menu is B6 = a, **our estimate** |
 * | An aeon has no Items row | not a duel rule: no FFX aeon has one, in any battle (`commands.ts`, `execute.ts`, PR-0155) | ffx-combat-core §6.2 [from ffx_command.csv]; B7 is settled by it |
 * | Lost when no aeon is left | `engine.ts#checkEnd`, before the stalemate watch can call it an escape | §1.2 [single source: GameFAQs]; B11 = a |
 * | 5,000 AP for winning the duel | `results.ts`, on top of the enemies' 0 | §11 I-1 [single source: GameFAQs]; B13 = a |
 *
 * **Game case: FFX only** [AGENTS.md rule 14]: aeons, Summon and Grand Summon
 * exist only in FFX. The plumbing is shared FFX code but **inert** unless a
 * formation sets `EnemyGroupDef.aeonsOnly`, `lockedAeons` or
 * `victoryBonusAp`, and only Chapter XIV's three formations do.
 *
 * The flags are copied into `state.flags` at setup, not onto the runtime, so a
 * rebuilt runtime (`simulate.ts#runtimeFor`, the advisor's dry runs) and an
 * intent clone see the same rules as the live battle.
 *
 * Layering: pure, deterministic, no DOM [AGENTS.md hard rule 1].
 */

import type { AbilityDef, AvailableCommand, CombatantId, Command, EnemyGroupDef, FFXCombatant } from '../common/types.ts';
import { aimSideOf } from '../common/aim.ts';
import { type Ctx, tryActor } from './state.ts';

/** `state.flags` key: the formation can only be fought by aeons. */
export const AEONS_ONLY_FLAG = 'aeonDuel.only';
/** `state.flags` key prefix: `aeonDuel.lock:<aeonId>` holds the id of the enemy it mirrors. */
export const AEON_LOCK_PREFIX = 'aeonDuel.lock:';
/** `state.flags` key: AP paid on victory on top of the enemies' own. */
export const VICTORY_BONUS_AP_FLAG = 'victory.bonusAp';

/** B6 = a's reason on a greyed row (our wording, labelled an estimate in the plan). */
export const ONLY_AN_AEON = 'Only an aeon can fight an aeon';

/** Copy the formation's duel rules into the battle. A no-op for every other formation. */
export function applyAeonDuelSetup(ctx: Ctx, group: EnemyGroupDef): void {
  if (group.aeonsOnly === true) ctx.state.flags[AEONS_ONLY_FLAG] = true;
  for (const lock of group.lockedAeons ?? []) ctx.state.flags[AEON_LOCK_PREFIX + lock.aeonId] = lock.mirrorOf;
  if (typeof group.victoryBonusAp === 'number' && group.victoryBonusAp > 0) {
    ctx.state.flags[VICTORY_BONUS_AP_FLAG] = group.victoryBonusAp;
  }
}

/** True while this battle can only be fought by aeons. */
export function aeonsOnly(ctx: Ctx): boolean {
  return ctx.state.flags[AEONS_ONLY_FLAG] === true;
}

/** The enemy id an aeon is locked against, or `undefined` when it is free to summon. */
export function lockedMirrorOf(ctx: Ctx, aeonId: string): CombatantId | undefined {
  const v = ctx.state.flags[AEON_LOCK_PREFIX + aeonId];
  return typeof v === 'string' ? v : undefined;
}

/** "Mirror of Grothia": the greyed Summon row's reason (Bailey's O-5 pick, sheet B). */
export function lockReason(ctx: Ctx, aeonId: string): string | undefined {
  const mirror = lockedMirrorOf(ctx, aeonId);
  if (mirror === undefined) return undefined;
  return `Mirror of ${tryActor(ctx, mirror)?.name ?? mirror}`;
}

/** Extra AP a victory pays (B13 = a), 0 when the formation sets none. */
export function victoryBonusAp(ctx: Ctx): number {
  const v = ctx.state.flags[VICTORY_BONUS_AP_FLAG];
  return typeof v === 'number' && v > 0 ? v : 0;
}

/**
 * True for a row that acts **on the enemy side**: damage, a drain, a debuff,
 * Dispel, Scan (the shared cursor rule, `common/aim.ts#aimSideOf`), aimed at
 * anything but the user's own side. Summon and Grand Summon are never one.
 */
function actsOnFoes(def: AbilityDef): boolean {
  if (def.category === 'summon' || def.minigame === 'yuna-grand-summon') return false;
  if (def.targeting === 'self' || def.targeting === 'single-ally' || def.targeting === 'all-allies' || def.targeting === 'random-ally') {
    return false;
  }
  return aimSideOf(def) === 'foe';
}

/**
 * Why this command may not be used in an aeon duel, or `undefined` when it
 * may. One answer for the menu (`commands.ts` greys the row) and for the
 * executor (`execute.ts` refuses a command that should never have arrived).
 *
 * `def` is the resolved ability or item effect, when the command has one.
 */
export function duelRefusal(ctx: Ctx, user: FFXCombatant, command: Command, def: AbilityDef | undefined): string | undefined {
  if (command.kind === 'summon') return lockReason(ctx, command.id);
  if (command.kind === 'overdrive' && command.extra?.kind === 'yuna-grand-summon') {
    const aeonId = command.extra.grandSummon.aeonId;
    if (aeonId !== '') {
      const locked = lockReason(ctx, aeonId);
      if (locked) return locked;
      if (aeonsOnly(ctx) && !grandSummonChoices(ctx).includes(aeonId)) return 'Unable to fight';
    }
  }
  if (!aeonsOnly(ctx)) return undefined;
  if (user.side !== 'party') return undefined; // an aeon's missing Item row is every battle's rule (PR-0155)
  if (command.kind === 'attack' || command.kind === 'trigger') return ONLY_AN_AEON;
  if ((command.kind === 'ability' || command.kind === 'item' || command.kind === 'overdrive') && def && actsOnFoes(def)) {
    return ONLY_AN_AEON;
  }
  return undefined;
}

/**
 * B11 = a, the sourced loss [research §1.2, single source: GameFAQs]: **no
 * aeon holds the field and none is left to summon**. `summonable` is the
 * caller's {@link availableAeons} count (after the lock and the KOs), passed in
 * so this module does not import `aeons.ts`.
 */
export function duelLost(ctx: Ctx, summonable: number): boolean {
  return aeonsOnly(ctx) && ctx.state.aeonId === null && summonable === 0;
}

/** The record a menu row resolves to, as the menu aims it (an item keeps its own targeting). */
function rowDef(ctx: Ctx, command: Command): AbilityDef | undefined {
  switch (command.kind) {
    case 'attack':
      return ctx.content.ability('attack');
    case 'ability':
    case 'overdrive':
      return ctx.content.ability(command.id);
    case 'item': {
      const effect = ctx.content.itemEffect(command.id);
      const item = ctx.content.item(command.id);
      return effect && item ? { ...effect, targeting: item.targeting } : effect;
    }
    default:
      return undefined;
  }
}

/**
 * The menu half of the duel (B6 = a): a party member's foe-aimed rows are
 * greyed with {@link ONLY_AN_AEON}. (An aeon never has Items rows, in any FFX
 * battle: `commands.ts`, PR-0155.)
 * Returns `rows` itself, untouched, unless the battle is an aeon duel.
 */
export function applyDuelRows(ctx: Ctx, user: FFXCombatant, rows: AvailableCommand[]): AvailableCommand[] {
  if (!aeonsOnly(ctx) || user.side !== 'party') return rows;
  for (const row of rows) {
    if (row.command.kind === 'summon') continue; // the lock already spoke
    const reason = duelRefusal(ctx, user, row.command, rowDef(ctx, row.command));
    if (reason === undefined) continue;
    row.enabled = false;
    row.disabledReason = reason;
  }
  return rows;
}

/** The executor half: why a submitted command is refused, with the record it resolves to. */
export function duelRefusalFor(ctx: Ctx, user: FFXCombatant, command: Command): string | undefined {
  return duelRefusal(ctx, user, command, rowDef(ctx, command));
}

/**
 * The aeons Grand Summon may call (`overdrive.ts#minigameParams`): the whole
 * roster, as before, **unless** this is an aeon duel, where the locked aeon and
 * a KO'd one (an aeon KO'd in an earlier link stays down, research §1.2
 * `[derived]`) are left out, exactly as the Summon list leaves them out.
 */
export function grandSummonChoices(ctx: Ctx): string[] {
  const keys = [...ctx.rt.aeonRoster.keys()];
  if (!aeonsOnly(ctx)) return keys.filter((k) => lockedMirrorOf(ctx, k) === undefined);
  return keys.filter((k) => {
    const aeon = ctx.rt.aeonRoster.get(k);
    return aeon !== undefined && aeon.hp > 0 && (aeon.aeon?.reviveCountdown ?? 0) <= 0 && lockedMirrorOf(ctx, k) === undefined;
  });
}

/**
 * The aeon a Grand Summon calls when nobody chose one (an AI or headless roll,
 * or a bare re-submit that breaks the minigame loop, `execute.ts`): the first
 * of {@link grandSummonChoices} that can take the field, `''` when none can.
 * Before, the roll always gave `''`, which spent Yuna's gauge and summoned
 * nothing (seen by the Chapter XIV engine review). Our choice, not a source:
 * FFX lets the player pick; roster order is the menu's order. FFX only.
 */
export function defaultGrandSummonAeon(ctx: Ctx): string {
  return grandSummonChoices(ctx).find((k) => {
    const aeon = ctx.rt.aeonRoster.get(k);
    return aeon !== undefined && aeon.hp > 0 && (aeon.aeon?.reviveCountdown ?? 0) <= 0;
  }) ?? '';
}
