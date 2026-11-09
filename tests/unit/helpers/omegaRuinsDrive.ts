/**
 * Shared fixtures for the hidden Omega Ruins chapter's engine tests and bench (FFX only; the endgame party against Ultima Weapon, Omega Weapon and Nemesis): an engine on any of the three formations, the drive and read
 * helpers, the chain the way the chapter chains it (`setupForNextLink`, the heal each later act gives on entry) and a one-fight player. Test-only.
 */

import type { BattleEngine, BattleEvent, BattleSetup, Command, Decision, FFXCombatant, FFXPartyBuild } from '../../../src/battle/common/types.ts';
import type { Ctx } from '../../../src/battle/ffx/state.ts';
import { FFXContentRegistry, createFFXEngine } from '../../../src/battle/ffx/index.ts';
import { ALL_ABILITIES, ENEMY_GROUPS_BY_ID, ITEMS } from '../../../src/data/ffx/index.ts';
import { omegaRuinsBuild } from '../../../src/data/ffx/builds/omega-ruins.ts';
import { NEMESIS_GROUP_ID, OMEGA_GROUP_ID, ULTIMA_GROUP_ID } from '../../../src/data/ffx/omega-ruins-ids.ts';
import { setupForNextLink } from '../../../src/app/screens/BattleScreenSetup.ts';

export const content = new FFXContentRegistry();
content.addAbilities([...ALL_ABILITIES]);
content.addItems(Object.values(ITEMS));

export type Input = Extract<Decision, { kind: 'player-input' }>;

/** The three acts in chain order. */
export const ACTS = [ULTIMA_GROUP_ID, OMEGA_GROUP_ID, NEMESIS_GROUP_ID] as const;
export type ActIndex = 0 | 1 | 2;

export function setup(seed: number, groupId: string = ULTIMA_GROUP_ID, party: FFXPartyBuild = omegaRuinsBuild): BattleSetup {
  const group = ENEMY_GROUPS_BY_ID[groupId];
  if (!group) throw new Error(`the formation '${groupId}' is missing from the data layer`);
  return { game: 'ffx', party, enemies: group, triggers: [], seed, condition: 'normal', canEscape: false };
}

export function engineOf(s: BattleSetup): ReturnType<typeof createFFXEngine> {
  const engine = createFFXEngine({ content, autoResolveMinigames: true });
  engine.init(s);
  return engine;
}

export function newEngine(seed = 1, groupId: string = ULTIMA_GROUP_ID, party: FFXPartyBuild = omegaRuinsBuild): ReturnType<typeof createFFXEngine> {
  return engineOf(setup(seed, groupId, party));
}

/** The next act's setup the way the chapter chains it: the party as the fight left it, then the restore the link's own flags give on entry. */
export function nextAct(previous: BattleSetup, engine: BattleEngine, nextGroupId: string, seed: number): BattleSetup {
  const group = ENEMY_GROUPS_BY_ID[nextGroupId];
  if (!group) throw new Error(`the formation '${nextGroupId}' is missing from the data layer`);
  return setupForNextLink(previous, group, engine.state(), seed) as BattleSetup;
}

export const actor = (engine: BattleEngine, id: string): FFXCombatant => engine.state().combatants[id] as FFXCombatant;
export const flags = (engine: BattleEngine): Record<string, unknown> => engine.state().flags as Record<string, unknown>;
export const log = (engine: BattleEngine): readonly BattleEvent[] => engine.state().log as readonly BattleEvent[];

export const defend = (): Command => ({ kind: 'defend', targets: [] });

/** The enabled row of `kind` (and `id`, and a target it can name), aimed at that target; null when it is not offered. */
export function row(d: Input, kind: Command['kind'], id: string | undefined, target?: string): Command | null {
  const r = d.commands.find((c) => c.enabled && c.command.kind === kind && (id === undefined || ('id' in c.command && c.command.id === id)) && (target === undefined || c.validTargets.includes(target)));
  return r ? ({ ...r.command, targets: target ? [target] : [] } as Command) : null;
}

/** What `who` did, in order (`ability id` or the command kind), from the battle's own log. */
export function actions(events: readonly BattleEvent[], who: string): string[] {
  return events.flatMap((e) => (e.type === 'action-start' && e.actorId === who ? [e.abilityId ?? e.command.kind] : []));
}

export interface Run {
  outcome: string;
  inputs: number;
  /** Ticks at the end. */
  ticks: number;
  events: readonly BattleEvent[];
}

/** Play one fight to an outcome with `choose` (null = defend); gives up at `maxInputs` as 'unfinished'. */
export function playOne(engine: BattleEngine, choose: (input: Input, engine: BattleEngine) => Command | null, maxInputs = 800): Run {
  let inputs = 0;
  for (let i = 0; i < maxInputs * 4; i++) {
    const d = engine.nextDecision();
    if (d.kind === 'battle-over') return { outcome: d.result.outcome, inputs, ticks: engine.state().ticks, events: log(engine) };
    if (d.kind !== 'player-input') continue;
    if (++inputs > maxInputs) break;
    engine.submit(choose(d, engine) ?? defend());
  }
  return { outcome: 'unfinished', inputs, ticks: engine.state().ticks, events: log(engine) };
}

/** Advance to the next player input (the Weapons' turns resolve on the way). */
export function nextInput(engine: BattleEngine): Input {
  for (let i = 0; i < 400; i++) {
    const d = engine.nextDecision();
    if (d.kind === 'player-input') return d;
    if (d.kind === 'battle-over') throw new Error('the battle ended');
  }
  throw new Error('no player input');
}

// ---------------------------------------------------------------------------------------------------- the unit tests' helpers

/** The engine's own context (a test reads and writes the state the scripts read). */
export const ctxOf = (engine: BattleEngine): Ctx => (engine as unknown as { ctx: Ctx }).ctx;
export const has = (c: FFXCombatant, status: string): boolean => (c.statuses as Record<string, unknown>)[status] !== undefined;

/** The foe of the engine's one formation. */
export const foeOf = (engine: BattleEngine): FFXCombatant => actor(engine, engine.state().enemyIds[0] as string);

/** Give a status to a combatant the way a spell would (no event): the unit tests set up a state and let the script react to it. */
export function give(c: FFXCombatant, status: string, turns = 254): void {
  (c.statuses as Record<string, unknown>)[status] = { id: status, turnsRemaining: turns, ticksRemaining: null, charges: null, stacks: 0, permanent: false };
}

/** Everybody in the front line is untouchable: a mechanic unit stays on its mechanic. */
export function invincible(engine: BattleEngine): void {
  for (const id of engine.state().activeIds) {
    const c = actor(engine, id);
    c.stats.maxHp = 99_999;
    c.hp = 99_999;
  }
}

/** Advance to the next player input (the foe's turns resolve on the way), keeping the front line up unless `keepUp` is false. */
export function nextInputKept(engine: BattleEngine, keepUp = true, max = 600): Input {
  for (let i = 0; i < max; i++) {
    if (keepUp) invincible(engine);
    const d = engine.nextDecision();
    if (d.kind === 'player-input') return d;
    if (d.kind === 'battle-over') throw new Error('the battle ended');
  }
  throw new Error('no player input');
}

/** Advance (the others defend) to `who`'s input. */
export function inputFor(engine: BattleEngine, who: string, max = 60, keepUp = true): Input {
  for (let i = 0; i < max; i++) {
    const d = nextInputKept(engine, keepUp);
    if (d.actorId === who) return d;
    engine.submit(defend());
  }
  throw new Error(`no input for ${who}`);
}

/** Defend until `stop` holds, letting the foe's script run; `stop` is read after every decision. The front line is topped up each step unless `keepUp` is false. */
export function runDefending(engine: BattleEngine, stop: (e: BattleEngine) => boolean, max = 400, keepUp = true): void {
  for (let i = 0; i < max * 12; i++) {
    if (stop(engine)) return;
    if (keepUp) invincible(engine);
    const d = engine.nextDecision();
    if (d.kind === 'battle-over') throw new Error(`the battle ended (${d.result.outcome}) before the stop condition held`);
    if (d.kind === 'player-input') engine.submit(defend());
  }
  throw new Error('runDefending: the stop condition never held');
}

/** The foe's own actions, in order (`ability id` or the command kind). */
export const foeActions = (engine: BattleEngine): string[] => actions(log(engine), engine.state().enemyIds[0] as string);

/** The foe's `action-start` events since the log began, with their targets. */
export function foeStarts(engine: BattleEngine): Array<{ id: string; targets: readonly string[] }> {
  const foe = engine.state().enemyIds[0] as string;
  return log(engine).flatMap((e) => (e.type === 'action-start' && e.actorId === foe ? [{ id: e.abilityId ?? e.command.kind, targets: e.targets }] : []));
}

export const swing = (d: Input, target: string): Command | null => row(d, 'attack', undefined, target);
export const spell = (d: Input, id: string, target: string): Command | null => row(d, 'ability', id, target);

/** The plain Attack on the first living foe, no aeon, no potion: the careless line. */
export function careless(d: Input, engine: BattleEngine): Command | null {
  const foes = engine.state().enemyIds.filter((id) => (engine.state().combatants[id] as FFXCombatant).alive);
  for (const id of foes) {
    const c = row(d, 'attack', undefined, id);
    if (c) return c;
  }
  return null;
}
