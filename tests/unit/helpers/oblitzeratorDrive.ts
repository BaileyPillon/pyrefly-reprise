/**
 * Shared fixtures for the hidden Oblitzerator chapter's engine tests (FFX only; Tidus, Lulu and Kimahri in front on the Luca build): an engine on the one formation, and the drive and read helpers. Test-only.
 */

import type { BattleEngine, BattleEvent, BattleSetup, Command, Decision, FFXCombatant, FFXPartyBuild } from '../../../src/battle/common/types.ts';
import type { Ctx } from '../../../src/battle/ffx/state.ts';
import { FFXContentRegistry, createFFXEngine } from '../../../src/battle/ffx/index.ts';
import { ALL_ABILITIES, ENEMY_GROUPS_BY_ID, ITEMS } from '../../../src/data/ffx/index.ts';
import { lucaBuild } from '../../../src/data/ffx/builds/luca.ts';

export const content = new FFXContentRegistry();
content.addAbilities([...ALL_ABILITIES]);
content.addItems(Object.values(ITEMS));

export const OBLITZERATOR = 'oblitzerator';
export const CRANE = 'luca-crane';
export const USE_CRANE = 'use-crane';

export type Input = Extract<Decision, { kind: 'player-input' }>;

export function setup(seed: number, party: FFXPartyBuild = lucaBuild): BattleSetup {
  const group = ENEMY_GROUPS_BY_ID['oblitzerator'];
  if (!group) throw new Error('the Oblitzerator formation is missing from the data layer');
  return { game: 'ffx', party, enemies: group, triggers: [], seed, condition: 'normal', canEscape: false };
}

export function newEngine(seed = 1, party: FFXPartyBuild = lucaBuild): ReturnType<typeof createFFXEngine> {
  const engine = createFFXEngine({ content, autoResolveMinigames: true });
  engine.init(setup(seed, party));
  return engine;
}

export const actor = (engine: BattleEngine, id: string): FFXCombatant => engine.state().combatants[id] as FFXCombatant;
export const oblitzerator = (engine: BattleEngine): FFXCombatant => actor(engine, OBLITZERATOR);
export const crane = (engine: BattleEngine): FFXCombatant => actor(engine, CRANE);
export const flags = (engine: BattleEngine): Record<string, number | string | boolean> => engine.state().flags;
export const log = (engine: BattleEngine): readonly BattleEvent[] => engine.state().log as readonly BattleEvent[];
export const ctxOf = (engine: BattleEngine): Ctx => (engine as unknown as { ctx: Ctx }).ctx;
export const has = (c: FFXCombatant, status: string): boolean => (c.statuses as Record<string, unknown>)[status] !== undefined;

/** Everybody in the front line is untouchable: a mechanic unit stays on its mechanic. */
export function invincible(engine: BattleEngine): void {
  for (const id of engine.state().activeIds) {
    const c = actor(engine, id);
    if (!c.alive) continue;
    c.stats.maxHp = 99_999;
    c.hp = 99_999;
  }
}

/** Advance to the next player input (the monsters' turns resolve on the way). */
export function nextInput(engine: BattleEngine, keepUp = true, max = 600): Input {
  for (let i = 0; i < max; i++) {
    if (keepUp) invincible(engine);
    const d = engine.nextDecision();
    if (d.kind === 'player-input') return d;
    if (d.kind === 'battle-over') throw new Error('the battle ended');
  }
  throw new Error('no player input');
}

export const defend = (): Command => ({ kind: 'defend', targets: [] });

/** The enabled row of `kind`/`id` that can name `target`, aimed at it; null when it is not offered. */
export function row(d: Input, kind: Command['kind'], id: string | undefined, target?: string): Command | null {
  const r = d.commands.find((c) => c.enabled && c.command.kind === kind && (id === undefined || ('id' in c.command && c.command.id === id)) && (target === undefined || c.validTargets.includes(target)));
  return r ? ({ ...r.command, targets: target ? [target] : [] } as Command) : null;
}
export const swing = (d: Input, target: string = OBLITZERATOR): Command | null => row(d, 'attack', undefined, target);
export const spell = (d: Input, id: string, target: string): Command | null => row(d, 'ability', id, target);

/** What `who` did, in order (`ability id` or the command kind), from the battle's own log. */
export function actions(events: readonly BattleEvent[], who: string): string[] {
  return events.flatMap((e) => (e.type === 'action-start' && e.actorId === who ? [e.abilityId ?? e.command.kind] : []));
}
export const oblitzeratorActions = (engine: BattleEngine): string[] => actions(log(engine), OBLITZERATOR);

/** The full list of `action-start` events as `who:ability`, in order. */
export function actionList(events: readonly BattleEvent[]): string[] {
  return events.flatMap((e) => (e.type === 'action-start' ? [`${e.actorId}:${e.abilityId ?? e.command.kind}`] : []));
}

/** Advance (the others defend) to `who`'s input. */
export function inputFor(engine: BattleEngine, who: string, max = 60, keepUp = true): Input {
  for (let i = 0; i < max; i++) {
    const d = nextInput(engine, keepUp);
    if (d.actorId === who) return d;
    engine.submit(defend());
  }
  throw new Error(`no input for ${who}`);
}

/** Defend until `stop` holds, letting the monsters' scripts run. `stop` is read after every decision, not only at a player's turn. */
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

/** The `script-trigger` names raised since the log began, in order. */
export function callouts(engine: BattleEngine): string[] {
  return log(engine).flatMap((e) => (e.type === 'script-trigger' ? [e.name] : []));
}

/** Give a status to a combatant the way a spell would (no event): the unit tests set up a state and let the script react to it. */
export function give(c: FFXCombatant, status: string, turns = 254): void {
  (c.statuses as Record<string, unknown>)[status] = { id: status, turnsRemaining: turns, ticksRemaining: null, charges: null, stacks: 0, permanent: false };
}

/** Cast `Thunder` (Lulu's own row) at `target` from her next input, then take the engine on to the next input. Returns the events that cast produced. */
export function lulusThunder(engine: BattleEngine, target: string): readonly BattleEvent[] {
  const d = inputFor(engine, 'lulu');
  const cmd = spell(d, 'thunder', target);
  if (cmd === null) throw new Error('Lulu has no Thunder row aimed at ' + target);
  const from = log(engine).length;
  engine.submit(cmd);
  return log(engine).slice(from);
}
