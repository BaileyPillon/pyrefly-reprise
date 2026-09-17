/**
 * Shared machinery for the per-encounter tactics.
 *
 * A tactic sees the live state and the rows the engine offered — it never
 * invents a command, only chooses among legal ones — and returns `null` to fall
 * through to the generic rules in `BattlePresenterStrategies.ts`.
 *
 * This file holds only what is **encounter-independent**: reading the offered
 * rows, aiming one, and the three rules that mean the same thing in every
 * fight (revive a downed member, run the Cheer ladder once, swing instead of
 * spending an Overdrive). Anything tuned to one boss — an Overdrive order, an
 * aeon order, an HP threshold — belongs in that boss's own module, so the
 * chapter agents can own their files without touching each other's.
 *
 * Nothing here changed when the tactics were split out of
 * `BattlePresenterTactics.ts`: these are the same functions, moved.
 */

import type {
  AnyCombatant,
  AvailableCommand,
  BattleEngine,
  Command,
  CombatantId,
} from '../../battle/common/types.ts';

/** One encounter's tactic. `null` = no opinion this turn. */
export type Tactic = (actorId: CombatantId, commands: AvailableCommand[], engine: BattleEngine) => Command | null;

/** The first enabled row whose label is in `labels`, in the order given. */
export function row(
  commands: AvailableCommand[],
  labels: readonly string[],
  target?: CombatantId,
): AvailableCommand | undefined {
  for (const label of labels) {
    const found = commands.find(
      (c) => c.enabled && c.label === label && (target === undefined || c.validTargets.includes(target)),
    );
    if (found) return found;
  }
  return undefined;
}

/** A row aimed at `target`, or at its first legal target when none is given. */
export function aim(r: AvailableCommand, target?: CombatantId): Command {
  const t = target && r.validTargets.includes(target) ? target : r.validTargets[0];
  return { ...r.command, targets: t ? [t] : [] } as Command;
}

export function has(c: AnyCombatant, status: string): boolean {
  return (c.statuses as Record<string, unknown>)[status] !== undefined;
}

/** Stack count of one of the six stacking buffs (Cheer, Focus, Aim, …). */
export function stacksOf(c: AnyCombatant, status: string): number {
  return (c.statuses as Record<string, { stacks?: number } | undefined>)[status]?.stacks ?? 0;
}

export function hpFraction(c: AnyCombatant): number {
  return c.hp / Math.max(1, c.stats.maxHp);
}

export function activeParty(engine: BattleEngine): AnyCombatant[] {
  const s = engine.state();
  return s.activeIds.map((id) => s.combatants[id]).filter((c): c is AnyCombatant => c !== undefined);
}

/**
 * Revive a downed active member. Every tactic starts here.
 *
 * Single-target revives only while anyone living is a Zombie: a revival effect
 * **kills** a living Zombie [types.ts `FFXStatusId`], and Mega Phoenix hits the
 * whole party — the measured Form II run lost 6,850 HP of its own Zombies to
 * one.
 */
export function revive(commands: AvailableCommand[], party: AnyCombatant[]): Command | null {
  const downed = party.find((c) => !c.alive);
  if (!downed) return null;
  const zombiesStanding = party.some((c) => c.alive && has(c, 'zombie'));
  const labels = zombiesStanding
    ? ['Phoenix Down', 'Life', 'Full-Life']
    : ['Phoenix Down', 'Life', 'Mega Phoenix', 'Full-Life'];
  const r = row(commands, labels, downed.id);
  return r ? aim(r, downed.id) : null;
}

/** True while any aeon can still be put on the field this turn. */
export function hasAeonLeft(commands: AvailableCommand[]): boolean {
  return commands.some((c) => c.enabled && c.command.kind === 'summon');
}

/**
 * Cheer the party to five stacks [ffx-combat-core §2.9, ffx-yunalesca §11.2].
 *
 * Each stack is +1 Strength — cubed in the physical power term, so five stacks
 * is roughly +38% for Auron and +50% for Tidus — and physical damage received
 * x(15-stacks)/15, a third off every Dispelling Slap counter and Hellbiter.
 * It targets allies, so it never provokes a counter, and her Slap does not
 * dispel stacks.
 *
 * Gated twice, because KO clears the stacks and the naive gate looped. The
 * actor stops once it is at five, and the whole rule stops unless **every**
 * living active is short of five — otherwise a single member dying and being
 * revived re-ran the entire five-cast ladder. That is not a theoretical worry:
 * with the old "two are short" gate the measured Form III spent four to six
 * consecutive Tidus turns on Cheer while members died and came back, and Tidus
 * landed a single Attack in the whole of the last form. The ladder is worth
 * casting once, off the top of the battle, when all three are at zero and every
 * swing of the fight is still ahead of it; re-running it to re-buff one revived
 * member is not (each stack is about +7% on Auron, against a whole Tidus swing).
 * Measured: +11 wins in 400 seeds.
 */
export function cheerUp(
  commands: AvailableCommand[],
  actor: AnyCombatant,
  living: AnyCombatant[],
): Command | null {
  if (stacksOf(actor, 'cheer') >= 5) return null;
  if (living.filter((c) => stacksOf(c, 'cheer') < 5).length < 3) return null;
  const cheer = row(commands, ['Cheer']);
  return cheer ? aim(cheer) : null;
}

/**
 * Swing instead of spending an Overdrive. Used by a supporter who is holding a
 * Grand Summon for the form where an aeon Overdrive is worth most
 * (ffx-yunalesca §10.6: Grand Summon lets an aeon Overdrive on arrival, twice
 * if its own gauge was already full).
 */
export function holdOverdrive(commands: AvailableCommand[], bossId: CombatantId): Command | null {
  const attack = commands.find((c) => c.enabled && c.command.kind === 'attack' && c.validTargets.includes(bossId));
  return attack ? aim(attack, bossId) : null;
}
