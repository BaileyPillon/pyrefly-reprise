/**
 * Headless FF7 auto-battle for tests, the golden log and the bench: a policy
 * answers every menu at zero decision time, and the clock runs through the
 * `'waiting'` path only (no menu is ever open while it runs).
 *
 * The policies are **ours**, not game data (they model players, and no number in
 * them is FF7's): each is described where it is defined, and the thresholds are
 * labelled as our choices. Pure (AGENTS.md rule 1). Game case: **FF7 only.**
 */

import type { AvailableCommand, BattleEvent, BattleResult, BattleSetup, BattleState, Command, Ff7AtbMode, Ff7Combatant } from '../common/types.ts';
import type { Ff7Registry } from './defs.ts';
import { Ff7Engine } from './engine.ts';

/** What a policy sees for one menu. */
export interface Ff7PolicyView {
  state: Readonly<BattleState>;
  actorId: string;
  commands: readonly AvailableCommand[];
}

export type Ff7Policy = (view: Ff7PolicyView) => Command;

function party(state: Readonly<BattleState>): Ff7Combatant[] {
  return state.activeIds.map((id) => state.combatants[id] as Ff7Combatant);
}

function boss(state: Readonly<BattleState>): Ff7Combatant | undefined {
  return state.enemyIds.map((id) => state.combatants[id] as Ff7Combatant).find((c) => c.alive);
}

/** The raised tail is form 1 [gs §2.1, §5.1]. */
function tailUp(state: Readonly<BattleState>): boolean {
  return boss(state)?.ff7.formIndex === 1;
}

function rowOf(view: Ff7PolicyView, pick: (r: AvailableCommand) => boolean): AvailableCommand | undefined {
  return view.commands.find((r) => r.enabled && pick(r));
}

function aim(row: AvailableCommand, target?: string): Command {
  const t = target ?? row.validTargets[0];
  return { ...row.command, targets: t ? [t] : [] } as Command;
}

const isKind = (kind: Command['kind'], id?: string) => (r: AvailableCommand): boolean =>
  r.command.kind === kind && (id === undefined || ('id' in r.command && r.command.id === id));

/** Attack, or the Limit in its place when full, on the boss. */
function strike(view: Ff7PolicyView): Command {
  const row = rowOf(view, isKind('limit')) ?? rowOf(view, isKind('attack'));
  if (!row) return { kind: 'defend', targets: [] };
  return aim(row, boss(view.state)?.id);
}

/** Heal the most hurt ally below `share` of Max HP: Cure first, a Potion if nobody can cast. */
function heal(view: Ff7PolicyView, share: number): Command | null {
  const hurt = party(view.state)
    .filter((c) => c.alive && c.hp < c.stats.maxHp * share)
    .sort((a, b) => a.hp / a.stats.maxHp - b.hp / b.stats.maxHp)[0];
  if (!hurt) return null;
  const cure = rowOf(view, isKind('ability', 'cure'));
  if (cure) return aim(cure, hurt.id);
  const potion = rowOf(view, isKind('item', 'potion'));
  return potion ? aim(potion, hurt.id) : null;
}

/** Phoenix Down on a KO'd ally when one is carried. */
function raise(view: Ff7PolicyView): Command | null {
  const row = rowOf(view, isKind('item', 'phoenix-down'));
  const down = party(view.state).find((c) => !c.alive);
  return row && down ? aim(row, down.id) : null;
}

/**
 * **Sensible** (the research's lesson, gs §1): revive a KO'd ally; heal anyone
 * under 50% (our threshold); while the tail is up never target the boss (heal
 * anyone under 75%, our threshold, else Defend); while it is down use the Limit
 * when full, Cloud casts Bolt (the weakness) while MP lasts, Barret attacks.
 */
export const sensiblePolicy: Ff7Policy = (view) => {
  const up = tailUp(view.state);
  const fix = raise(view) ?? heal(view, up ? 0.75 : 0.5);
  if (fix) return fix;
  if (up) return { kind: 'defend', targets: [] };
  if (rowOf(view, isKind('limit'))) return strike(view);
  const bolt = rowOf(view, isKind('ability', 'bolt'));
  if (bolt) return aim(bolt, boss(view.state)?.id);
  return strike(view);
};

/** **Naive**: Attack (or the Limit when full) on every turn, tail or no tail; never heals. */
export const naivePolicy: Ff7Policy = (view) => strike(view);

/**
 * **Literal hint**: reads Cloud's line "Attack while it's tail's up!" (gs §7) as
 * advice. Attacks only while the tail is up, Defends while it is down, heals and
 * revives like the sensible player.
 */
export const literalHintPolicy: Ff7Policy = (view) => {
  const fix = raise(view) ?? heal(view, 0.5);
  if (fix) return fix;
  return tailUp(view.state) ? strike(view) : { kind: 'defend', targets: [] };
};

export const FF7_POLICIES: Readonly<Record<'sensible' | 'naive' | 'literal-hint', Ff7Policy>> = {
  sensible: sensiblePolicy,
  naive: naivePolicy,
  'literal-hint': literalHintPolicy,
};

/** One headless battle. */
export interface Ff7RunOptions {
  setup: BattleSetup;
  registry: Ff7Registry;
  policy: Ff7Policy;
  atbMode?: Ff7AtbMode;
  /** Safety stop; a real battle needs a few hundred decisions. */
  maxSteps?: number;
}

export interface Ff7Run {
  result: BattleResult;
  log: readonly BattleEvent[];
  state: Readonly<BattleState>;
}

export function runFf7Battle(opts: Ff7RunOptions): Ff7Run {
  const engine = new Ff7Engine({ registry: opts.registry, ...(opts.atbMode ? { atbMode: opts.atbMode } : {}) });
  engine.setSeed(opts.setup.seed);
  engine.init(opts.setup);
  const max = opts.maxSteps ?? 20000;
  for (let step = 0; step < max; step++) {
    const d = engine.nextDecision();
    if (d.kind === 'battle-over') return { result: d.result, log: engine.state().log, state: engine.state() };
    if (d.kind === 'waiting') engine.tick(d.nextEventMs);
    else if (d.kind === 'player-input') engine.submit(opts.policy({ state: engine.state(), actorId: d.actorId, commands: d.commands }));
  }
  throw new Error(`FF7 simulate: no result after ${max} decisions (seed ${opts.setup.seed})`);
}

/** What the bench counts in one battle's log. */
export interface Ff7RunSummary {
  outcome: BattleResult['outcome'];
  turns: number;
  partyTurns: number;
  bossTurns: number;
  ticks: number;
  /** Tail Laser counters fired, i.e. hostile actions taken into the raised tail [gs §5.5]. */
  tailLasers: number;
  /** HP the party lost to Tail Laser. */
  tailLaserDamage: number;
  limitsUsed: number;
  kos: number;
}

export function summarizeFf7Run(run: Ff7Run): Ff7RunSummary {
  const s: Ff7RunSummary = {
    outcome: run.result.outcome, turns: run.result.turns, partyTurns: 0, bossTurns: 0, ticks: run.result.elapsedTicks,
    tailLasers: 0, tailLaserDamage: 0, limitsUsed: 0, kos: 0,
  };
  let inLaser = false;
  for (const e of run.log) {
    if (e.type === 'turn-start') {
      if (run.state.enemyIds.includes(e.actorId)) s.bossTurns++;
      else s.partyTurns++;
    } else if (e.type === 'counter' && e.abilityId === 'tail-laser') {
      s.tailLasers++;
    } else if (e.type === 'action-start') {
      inLaser = e.abilityId === 'tail-laser';
      if (e.command.kind === 'limit') s.limitsUsed++;
    } else if (e.type === 'action-end') {
      inLaser = false;
    } else if (e.type === 'damage' && inLaser && e.amount > 0) {
      s.tailLaserDamage += e.amount;
    } else if (e.type === 'ko' && run.state.activeIds.includes(e.targetId)) {
      s.kos++;
    }
  }
  return s;
}
