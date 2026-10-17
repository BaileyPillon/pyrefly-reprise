/**
 * Shared fixtures for the hidden Mirror Aeons chapter's engine tests and bench (FFX only; Yuna's party against the Dark Magus Sisters and Dark Yojimbo): an engine on any of the eleven formations, the drive and
 * read helpers, and the one-fight player that the bench and the tests both use. Test-only.
 */

import type { BattleEngine, BattleEvent, BattleSetup, Command, Decision, FFXCombatant, FFXPartyBuild } from '../../../src/battle/common/types.ts';
import { FFXContentRegistry, createFFXEngine } from '../../../src/battle/ffx/index.ts';
import { ALL_ABILITIES, ENEMY_GROUPS_BY_ID, ITEMS } from '../../../src/data/ffx/index.ts';
import { mirrorAeonsBuild } from '../../../src/data/ffx/builds/mirror-aeons.ts';
import { MIRROR_ACT_I, MIRROR_ACT_II, sistersGroupId, yojimboGroupId } from '../../../src/data/ffx/mirror-aeons-ids.ts';

export const content = new FFXContentRegistry();
content.addAbilities([...ALL_ABILITIES]);
content.addItems(Object.values(ITEMS));

export type Input = Extract<Decision, { kind: 'player-input' }>;

/** The group id of a formation file (`'kino00_70'`, `'nagi05_72'`). */
export const groupIdOf = (file: string): string => (file.startsWith('kino') ? sistersGroupId(file) : yojimboGroupId(file));
export const ACT_I_GROUP = groupIdOf(MIRROR_ACT_I);
export const ACT_II_GROUP = groupIdOf(MIRROR_ACT_II);

export function setup(seed: number, groupId: string = ACT_I_GROUP, party: FFXPartyBuild = mirrorAeonsBuild): BattleSetup {
  const group = ENEMY_GROUPS_BY_ID[groupId];
  if (!group) throw new Error(`the formation '${groupId}' is missing from the data layer`);
  return { game: 'ffx', party, enemies: group, triggers: [], seed, condition: 'normal', canEscape: false };
}

export function newEngine(seed = 1, groupId: string = ACT_I_GROUP, party: FFXPartyBuild = mirrorAeonsBuild): ReturnType<typeof createFFXEngine> {
  const engine = createFFXEngine({ content, autoResolveMinigames: true });
  engine.init(setup(seed, groupId, party));
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
export function playOne(seed: number, groupId: string, choose: (input: Input, engine: BattleEngine) => Command | null, maxInputs = 800): Run {
  const engine = newEngine(seed, groupId);
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

/** An engine on `groupId` with the chapter's mid-battle triggers armed (the seam on `all-ko`, the Yojimbo callout). */
export function createEngineWithTriggers(seed: number, groupId: string, triggers: BattleSetup['triggers']): ReturnType<typeof createFFXEngine> {
  const engine = createFFXEngine({ content, autoResolveMinigames: true });
  engine.init({ ...setup(seed, groupId), triggers });
  return engine;
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
