/**
 * Shared fixtures for the hidden Dark Aeons chapter's engine tests and bench (FFX only; Tidus, Yuna and Auron against the six other Dark Aeons): an engine on any of the seven links, the drive and read helpers, and the
 * one-fight player that the bench and the tests both use. Test-only.
 */

import type { BattleEngine, BattleEvent, BattleSetup, Command, Decision, FFXCombatant, FFXPartyBuild } from '../../../src/battle/common/types.ts';
import { FFXContentRegistry, createFFXEngine } from '../../../src/battle/ffx/index.ts';
import { ALL_ABILITIES, ENEMY_GROUPS_BY_ID, ITEMS } from '../../../src/data/ffx/index.ts';
import { darkAeonsBuild } from '../../../src/data/ffx/builds/dark-aeons.ts';
import { DARK_SIX_LINKS, type DarkSixKey, darkSixLink } from '../../../src/data/ffx/dark-aeons-six-ids.ts';

export const content = new FFXContentRegistry();
content.addAbilities([...ALL_ABILITIES]);
content.addItems(Object.values(ITEMS));

export type Input = Extract<Decision, { kind: 'player-input' }>;

/** The group id of a link key (`'valefor'`, `'ixion-2'`). */
export const groupIdOf = (key: DarkSixKey): string => darkSixLink(key).groupId;
export const LINK_KEYS: readonly DarkSixKey[] = DARK_SIX_LINKS.map((l) => l.key);

export function setup(seed: number, key: DarkSixKey = 'valefor', party: FFXPartyBuild = darkAeonsBuild): BattleSetup {
  const group = ENEMY_GROUPS_BY_ID[groupIdOf(key)];
  if (!group) throw new Error(`the formation '${key}' is missing from the data layer`);
  return { game: 'ffx', party, enemies: group, triggers: [], seed, condition: 'normal', canEscape: false };
}

export function newEngine(seed = 1, key: DarkSixKey = 'valefor', party: FFXPartyBuild = darkAeonsBuild): ReturnType<typeof createFFXEngine> {
  const engine = createFFXEngine({ content, autoResolveMinigames: true });
  engine.init(setup(seed, key, party));
  return engine;
}

/** An engine on any formation of the data layer by its group id (the absence tests' other chapters), with the chapter's party. */
export function engineOnGroup(groupId: string, seed = 1, party: FFXPartyBuild = darkAeonsBuild): ReturnType<typeof createFFXEngine> {
  const group = ENEMY_GROUPS_BY_ID[groupId];
  if (!group) throw new Error(`the formation '${groupId}' is missing from the data layer`);
  const engine = createFFXEngine({ content, autoResolveMinigames: true });
  engine.init({ game: 'ffx', party, enemies: group, triggers: [], seed, condition: 'normal', canEscape: false });
  return engine;
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
  /** Battle turns at the end (CTB turn counter). */
  turns: number;
  nextGroupId?: string;
  events: readonly BattleEvent[];
}

/** Play one fight to an outcome with `choose` (null = defend); gives up at `maxInputs` as 'unfinished'. */
export function playOne(seed: number, key: DarkSixKey, choose: (input: Input, engine: BattleEngine) => Command | null, maxInputs = 800, party: FFXPartyBuild = darkAeonsBuild): Run {
  const engine = newEngine(seed, key, party);
  let inputs = 0;
  for (let i = 0; i < maxInputs * 4; i++) {
    const d = engine.nextDecision();
    if (d.kind === 'battle-over') return { outcome: d.result.outcome, inputs, turns: engine.state().turn, ...(d.result.nextGroupId !== undefined ? { nextGroupId: d.result.nextGroupId } : {}), events: log(engine) };
    if (d.kind !== 'player-input') continue;
    if (++inputs > maxInputs) break;
    engine.submit(choose(d, engine) ?? defend());
  }
  return { outcome: 'unfinished', inputs, turns: engine.state().turn, events: log(engine) };
}

/** Advance to the next player input (the Dark Aeons' turns resolve on the way). */
export function nextInput(engine: BattleEngine): Input {
  for (let i = 0; i < 400; i++) {
    const d = engine.nextDecision();
    if (d.kind === 'player-input') return d;
    if (d.kind === 'battle-over') throw new Error('the battle ended');
  }
  throw new Error('no player input');
}

/** The plain Attack on the first living Dark Aeon, no aeon, no potion: the careless line. */
export function careless(d: Input, engine: BattleEngine): Command | null {
  const foes = engine.state().enemyIds.filter((id) => (engine.state().combatants[id] as FFXCombatant).alive);
  for (const id of foes) {
    const c = row(d, 'attack', undefined, id);
    if (c) return c;
  }
  return null;
}
