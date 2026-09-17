/**
 * Auto-battle strategies: how the game plays itself.
 *
 * These drive `window.__pyrefly.autoBattle()`, the e2e "run this chapter to
 * victory" specs, and the critic's playthroughs. A strategy is a pure function
 * of the offered {@link AvailableCommand}s plus read-only engine state, so it
 * never cheats — it only picks from rows the engine already said are legal.
 *
 * `'intended'` is the one that matters: it plays the tactics each encounter was
 * designed around (revive, then heal, then spend a full Overdrive, then hit the
 * thing that most needs hitting) rather than mashing Attack, so a chapter that
 * *can* be won by playing properly gets won.
 */

import type {
  AnyCombatant,
  AvailableCommand,
  BattleEngine,
  Command,
  CombatantId,
  StatusId,
} from '../battle/common/types.ts';
import type { AutoStrategy } from './BattlePresenter.ts';
import { tacticFor } from './BattlePresenterTactics.ts';

/** Built-in strategy names. */
export type StrategyName = 'intended' | 'attack' | 'defend' | 'random';

/** Heal when the actor (or anyone) is under this fraction of max HP. */
const HEAL_THRESHOLD = 0.45;

const isEnabled = (c: AvailableCommand): boolean => c.enabled;

/** Rows whose label or ability id matches, in the order they were offered. */
function match(commands: AvailableCommand[], re: RegExp): AvailableCommand[] {
  return commands.filter(isEnabled).filter((c) => {
    const id = 'id' in c.command ? String(c.command.id) : '';
    return re.test(c.label) || re.test(id);
  });
}

/** Fill in a command's targets from its resolved legal set. */
function withTarget(row: AvailableCommand, preferred?: CombatantId): Command {
  if (row.command.targets.length) return row.command;
  const pick =
    preferred && row.validTargets.includes(preferred) ? preferred : row.validTargets[0];
  if (pick === undefined) return row.command;
  return { ...row.command, targets: [pick] } as Command;
}

function combatants(engine: BattleEngine): AnyCombatant[] {
  return Object.values(engine.state().combatants);
}

function livingEnemies(engine: BattleEngine): AnyCombatant[] {
  return combatants(engine).filter(
    (c) => c.side === 'enemy' && c.alive && !c.removed && !c.flags.untargetable && !c.flags.hidden,
  );
}

function hurtAllies(engine: BattleEngine): AnyCombatant[] {
  return combatants(engine)
    .filter((c) => (c.side === 'party' || c.side === 'aeon') && !c.removed)
    .sort((a, b) => a.hp / Math.max(1, a.stats.maxHp) - b.hp / Math.max(1, b.stats.maxHp));
}

/**
 * Play the fight the way it was meant to be played.
 *
 * Priority: revive a downed ally, heal anyone critical, spend a ready
 * Overdrive, then attack. Targeting prefers a destructible part (the Yu
 * Pagodas, the Vegnagun limbs, Mortiorchis) over the boss it props up, which is
 * the actual tactic in three of the five encounters.
 */
export const intendedStrategy: AutoStrategy = (actorId, commands, engine) => {
  const enabled = commands.filter(isEnabled);
  if (!enabled.length) return null;

  // 0. The encounter's own line, when it has one (`BattlePresenterTactics.ts`).
  //    A tactic that has no opinion this turn means "swing", not "fall back to
  //    the generic heals" — those generic heals are exactly what an encounter
  //    tactic exists to override (Potions mid-damage-race, healing a Zombie).
  const tactic = tacticFor(engine);
  if (tactic) {
    const picked = tactic(actorId, commands, engine);
    if (picked) return picked;
    return overdriveOrAttack(commands, engine);
  }

  const actor = engine.state().combatants[actorId];

  // 1. Someone is down.
  const downed = hurtAllies(engine).find((c) => !c.alive);
  if (downed) {
    const revive = match(commands, /phoenix|life|revive/i).find((c) =>
      c.validTargets.includes(downed.id),
    );
    if (revive) return withTarget(revive, downed.id);
  }

  // 2. The actor cannot do its job.
  //
  // Blind is the whole of Yunalesca's Form I: she counters every landed
  // physical hit with it, Darkness drops physical accuracy to base/10, and an
  // auto-battler that swings through it simply blinds itself out of the fight
  // — the measured run landed 18 hits against 21 misses and lost. Curing it
  // costs a turn and buys back the entire damage race. Silence is the same
  // bargain for a caster.
  const crippled = disablingCure(actor, commands);
  if (crippled) return crippled;

  // 3. Someone is about to die.
  const hurt = hurtAllies(engine).find(
    (c) => c.alive && !isZombie(c) && c.hp / Math.max(1, c.stats.maxHp) < HEAL_THRESHOLD,
  );
  if (hurt) {
    const heal = match(commands, /cure|cura|curaga|potion|heal|elixir/i).find((c) =>
      c.validTargets.includes(hurt.id),
    );
    if (heal) return withTarget(heal, hurt.id);
  }

  // 4–5. Overdrive, then hit something.
  return overdriveOrAttack(commands, engine);
};

/** A full Overdrive is a resource, not a trophy; otherwise hit something. */
function overdriveOrAttack(commands: AvailableCommand[], engine: BattleEngine): Command | null {
  const enabled = commands.filter(isEnabled);
  if (!enabled.length) return null;
  const overdrive = enabled.find((c) => c.command.kind === 'overdrive');
  if (overdrive) return withTarget(overdrive, bestEnemyTarget(engine, overdrive));
  const attack =
    enabled.find((c) => c.command.kind === 'attack') ??
    enabled.find((c) => c.category === 'skill' || c.category === 'blackmagic') ??
    enabled[0]!;
  return withTarget(attack, bestEnemyTarget(engine, attack));
}

/**
 * Statuses that stop a character contributing at all, and what lifts them.
 *
 * Deliberately a short list. Every entry is a status whose cure is strictly
 * better than acting through it; anything merely unpleasant (Poison, a Break)
 * is not worth a turn.
 */
const DISABLING: ReadonlyArray<{ status: StatusId; cure: RegExp }> = [
  // Eye Drops, Esuna or a Remedy.
  { status: 'darkness', cure: /eye ?drops?|esuna|remedy/i },
  // Echo Screen, Esuna or a Remedy.
  { status: 'silence', cure: /echo ?screen|esuna|remedy/i },
];

/**
 * Zombie is **not** on that list, and must never be.
 *
 * In Yunalesca's later forms Zombie is the party's armour, not an affliction:
 * her entry to Form III is a 100-chance Mega Death that kills every active
 * member who is *not* zombified. Curing it — the obvious play — is the losing
 * one. Healing a Zombie damages them too, which is why step 3 above skips
 * zombified allies rather than pouring a Curaga into one [ffx-yunalesca §5.3].
 */
function isZombie(c: { statuses: Partial<Record<string, unknown>> }): boolean {
  return c.statuses['zombie'] !== undefined;
}

/**
 * Cure a disabling status, preferring the actor taking this turn — it is the
 * one whose turn is otherwise wasted.
 */
function disablingCure(
  actor: AnyCombatant | undefined,
  commands: AvailableCommand[],
): Command | null {
  for (const { status, cure } of DISABLING) {
    if (!actor || actor.statuses[status] === undefined) continue;
    const row = match(commands, cure).find((c) => c.validTargets.includes(actor.id));
    if (row) return withTarget(row, actor.id);
  }
  return null;
}

/**
 * Parts first, then whatever is closest to dying. Attacking the part that is
 * healing or shielding the boss is the intended line in Chapters 1, 3 and 5.
 */
function bestEnemyTarget(engine: BattleEngine, row: AvailableCommand): CombatantId | undefined {
  const legal = new Set(row.validTargets);
  const foes = livingEnemies(engine).filter((c) => legal.has(c.id));
  if (!foes.length) return row.validTargets[0];
  const parts = foes.filter((c) => c.flags.isPart);
  const pool = parts.length ? parts : foes;
  return pool.reduce((best, c) =>
    c.hp / Math.max(1, c.stats.maxHp) < best.hp / Math.max(1, best.stats.maxHp) ? c : best,
  ).id;
}

/** Mash Attack. The baseline every other strategy has to beat. */
export const attackStrategy: AutoStrategy = (_actorId, commands, engine) => {
  const enabled = commands.filter(isEnabled);
  const row = enabled.find((c) => c.command.kind === 'attack') ?? enabled[0];
  if (!row) return null;
  return withTarget(row, bestEnemyTarget(engine, row));
};

/** Turtle. Useful for probing an enemy's damage output without dying. */
export const defendStrategy: AutoStrategy = (_actorId, commands, engine) => {
  const enabled = commands.filter(isEnabled);
  const row = enabled.find((c) => c.command.kind === 'defend');
  if (row) return row.command;
  return attackStrategy(_actorId, commands, engine);
};

/**
 * Pick any legal row. Deliberately *not* seeded from the battle RNG — this is
 * a fuzzer for the presenter, not a reproducible playthrough.
 */
export const randomStrategy: AutoStrategy = (_actorId, commands, engine) => {
  const enabled = commands.filter(isEnabled);
  if (!enabled.length) return null;
  const row = enabled[Math.floor(Math.random() * enabled.length)]!;
  return withTarget(row, bestEnemyTarget(engine, row));
};

const STRATEGIES: Record<StrategyName, AutoStrategy> = {
  intended: intendedStrategy,
  attack: attackStrategy,
  defend: defendStrategy,
  random: randomStrategy,
};

/** Look a built-in strategy up by name. Unknown names fall back to `intended`. */
export function getStrategy(name: StrategyName | AutoStrategy = 'intended'): AutoStrategy {
  if (typeof name === 'function') return name;
  return STRATEGIES[name] ?? intendedStrategy;
}

/** Every built-in name, for the debug API's help text. */
export function strategyNames(): StrategyName[] {
  return Object.keys(STRATEGIES) as StrategyName[];
}
