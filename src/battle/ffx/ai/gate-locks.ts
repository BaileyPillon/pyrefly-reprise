/**
 * **The Gate Locks and the key to them** (FFX only; the hidden Flooded Ways chapter): the two props of the Via Purifico's first two areas (monster files `m162`, `m171`) and the party's **Open lock** command
 * (`research/re-ffx-geosgaeno-evrae-altana.md` 4.4, "RE 4.4"; read from the files and run in the earlier lanes' interpreter).
 *
 * A Gate Lock has **500 HP, takes no turns, is no part of the victory, and is a legal target** (RE 4.4: "Targetable stays at its default"). Its script has one rule: **when Open lock (the command 0x312F, a Trigger Command
 * on Tidus, Wakka and Rikku, a fixed 50) is aimed at it, its HP becomes 0**; any other command does nothing here, though a damaging hit still takes HP away in the engine (an ordinary blade should kill it: 500 HP, no
 * defence, immune to magic and to every element and status, `[inferred]` from the flags, RE 0). **When both locks of an area are gone the area ends** (`./flooded-ways-end.ts`).
 *
 * The lock sits on the field as `ordersOnly` and `nonCombatant` (`./flooded-ways-setup.ts`): it owns no turn, and the fight can be won without opening it.
 */

import type { AvailableCommand, FFXCombatant, TriggerCommand } from '../../common/types.ts';
import { type Ctx, isAlive, tryActor } from '../state.ts';
import { koActor } from '../hp.ts';
import { registerAiScript } from './types.ts';
import { FLOODED_ROWS, FLOODED_SCRIPTS, GATE_LOCK_IDS, areaOf, gateLocks, heldId } from './flooded-ways-rules.ts';

registerAiScript(FLOODED_SCRIPTS.lock, () => null); // a lock never takes a turn (`ordersOnly`); a script is registered so nothing falls back to a plain Attack

/** The locks still standing: the aim of Open lock. */
export function livingLockIds(ctx: Ctx): string[] {
  return gateLocks(ctx).filter((c) => isAlive(c)).map((c) => c.id);
}

/** Is the command in this fight at all: a Via Purifico area with locks (areas 1 and 2), for a party member who is not inside Geosgaeno. */
export function openLockOffered(ctx: Ctx, user: FFXCombatant): boolean {
  const area = areaOf(ctx);
  return (area === 1 || area === 2) && user.side === 'party' && heldId(ctx) !== user.id;
}

/** On offer now: a lock is still standing. */
export function openLockAvailable(ctx: Ctx, user: FFXCombatant): boolean {
  return openLockOffered(ctx, user) && livingLockIds(ctx).length > 0;
}

/** The Open lock row of one party member (a menu row beside Defend, like the Keeper's Move): none outside the Via Purifico's first two areas. */
export function openLockRows(ctx: Ctx, user: FFXCombatant): AvailableCommand[] {
  if (!openLockOffered(ctx, user)) return [];
  const targets = livingLockIds(ctx);
  const row: AvailableCommand = {
    command: { kind: 'trigger', id: FLOODED_ROWS.openLock, targets: [] },
    label: 'Open lock',
    category: 'special',
    mpCost: 0,
    rank: 3,
    enabled: targets.length > 0,
    validTargets: targets,
    targeting: 'single-enemy',
    help: 'Open one of the gate locks. It costs the turn. When both are open the party is carried on, and Evrae Altana keeps the HP it had.',
  };
  if (!row.enabled) row.disabledReason = 'No lock left';
  return [row];
}

/**
 * The lock's `onTargeted` when Open lock names it (RE 4.4): its HP becomes 0 and it falls (its `onDeath` opens the gate). Returns false when the aim is not a standing lock, so the executor says so and the turn is spent, as
 * for any refused trigger.
 */
export function applyOpenLock(ctx: Ctx, user: FFXCombatant, command?: TriggerCommand): boolean {
  const aim = command?.targets[0];
  const lock = aim === undefined ? undefined : tryActor(ctx, aim);
  if (lock === undefined || !(GATE_LOCK_IDS as readonly string[]).includes(lock.id) || !isAlive(lock)) return false;
  ctx.emit({ type: 'message', text: `${user.name} opens the lock`, kind: 'story' });
  koActor(ctx, lock, user.id);
  ctx.emit({ type: 'message', text: 'The gate opens', kind: 'story' });
  return true;
}
