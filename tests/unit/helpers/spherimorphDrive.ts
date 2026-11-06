/**
 * Shared fixtures for the hidden Spherimorph chapter's engine tests (FFX only; Tidus, Yuna and Lulu in front on the Macalania preset without Shiva): an engine on the one formation, and the drive and read helpers.
 * Test-only.
 */

import type { BattleEngine, BattleEvent, BattleSetup, Command, Decision, FFXCombatant, FFXPartyBuild } from '../../../src/battle/common/types.ts';
import type { Ctx } from '../../../src/battle/ffx/state.ts';
import { FFXContentRegistry, createFFXEngine } from '../../../src/battle/ffx/index.ts';
import { applyState } from '../../../src/battle/ffx/ai/spherimorph-rules.ts';
import { ALL_ABILITIES, ENEMY_GROUPS_BY_ID, ITEMS } from '../../../src/data/ffx/index.ts';
import { spherimorphBuild } from '../../../src/data/ffx/builds/spherimorph.ts';

export const content = new FFXContentRegistry();
content.addAbilities([...ALL_ABILITIES]);
content.addItems(Object.values(ITEMS));

export const SM = 'spherimorph';

export type Input = Extract<Decision, { kind: 'player-input' }>;

export function setup(seed: number, party: FFXPartyBuild = spherimorphBuild): BattleSetup {
  const group = ENEMY_GROUPS_BY_ID['spherimorph'];
  if (!group) throw new Error('the Spherimorph formation is missing from the data layer');
  return { game: 'ffx', party, enemies: group, triggers: [], seed, condition: 'normal', canEscape: false };
}

export function newEngine(seed = 1, party: FFXPartyBuild = spherimorphBuild): ReturnType<typeof createFFXEngine> {
  const engine = createFFXEngine({ content, autoResolveMinigames: true });
  engine.init(setup(seed, party));
  return engine;
}

export const actor = (engine: BattleEngine, id: string): FFXCombatant => engine.state().combatants[id] as FFXCombatant;
export const sm = (engine: BattleEngine): FFXCombatant => actor(engine, SM);
export const flags = (engine: BattleEngine): Record<string, number | string | boolean> => engine.state().flags;
export const log = (engine: BattleEngine): readonly BattleEvent[] => engine.state().log as readonly BattleEvent[];
export const ctxOf = (engine: BattleEngine): Ctx => (engine as unknown as { ctx: Ctx }).ctx;
export const has = (c: FFXCombatant, status: string): boolean => (c.statuses as Record<string, unknown>)[status] !== undefined;

/** The state (0 weak Fire, 1 weak Ice, 2 weak Thunder, 3 weak Water) the script holds now. */
export const stateOf = (engine: BattleEngine): number => flags(engine)['sm.state'] as number;

/** Set the state the way the script does (flag and affinities), so a test starts from a known weakness. Test-only. */
export function setState(engine: BattleEngine, state: number): void {
  flags(engine)['sm.state'] = state;
  applyState(sm(engine), state);
}

/** Everybody in the front line is untouchable: a mechanic unit stays on its mechanic. */
export function invincible(engine: BattleEngine): void {
  for (const id of engine.state().activeIds) {
    const c = actor(engine, id);
    c.stats.maxHp = 99_999;
    c.hp = 99_999;
  }
}

/** Advance to the next player input (Spherimorph's turns resolve on the way). */
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
export const swing = (d: Input, target: string = SM): Command | null => row(d, 'attack', undefined, target);
export const spell = (d: Input, id: string, target: string = SM): Command | null => row(d, 'ability', id, target);

/** What `who` did, in order (`ability id` or the command kind), from the battle's own log. */
export function actions(events: readonly BattleEvent[], who: string): string[] {
  return events.flatMap((e) => (e.type === 'action-start' && e.actorId === who ? [e.abilityId ?? e.command.kind] : []));
}
export const smActions = (engine: BattleEngine): string[] => actions(log(engine), SM);

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

/** Defend until `stop` holds, letting the script run. `stop` is read after every decision, not only at a player's turn. The front line is topped up each step unless `keepUp` is false. */
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

/** A harmless turn that is not a Defend (Defend halves physical damage, which would hide the figures the note gives): a Potion on oneself. */
export const idle = (d: Input): Command => row(d, 'item', 'potion', d.actorId) ?? defend();

/** Like {@link runDefending}, but every party turn is {@link idle}, so a figure read off the log is the undefended one. */
export function runIdling(engine: BattleEngine, stop: (e: BattleEngine) => boolean, max = 400, keepUp = true): void {
  for (let i = 0; i < max * 12; i++) {
    if (stop(engine)) return;
    if (keepUp) invincible(engine);
    const d = engine.nextDecision();
    if (d.kind === 'battle-over') throw new Error(`the battle ended (${d.result.outcome}) before the stop condition held`);
    if (d.kind === 'player-input') engine.submit(idle(d));
  }
  throw new Error('runIdling: the stop condition never held');
}

/** The damage events inside every action whose `action-start` satisfies `match`, in order. */
export function damageInActions(engine: BattleEngine, match: (start: Extract<BattleEvent, { type: 'action-start' }>) => boolean): Array<Extract<BattleEvent, { type: 'damage' }>> {
  const out: Array<Extract<BattleEvent, { type: 'damage' }>> = [];
  let inside = false;
  for (const e of log(engine)) {
    if (e.type === 'action-start') inside = match(e);
    else if (e.type === 'action-end') inside = false;
    else if (inside && e.type === 'damage') out.push(e);
  }
  return out;
}

/** Spherimorph's `action-start` events since the log began, with their targets. */
export function smStarts(engine: BattleEngine): Array<{ id: string; targets: readonly string[] }> {
  return log(engine).flatMap((e) => (e.type === 'action-start' && e.actorId === SM ? [{ id: e.abilityId ?? e.command.kind, targets: e.targets }] : []));
}

/** Give a status to a combatant the way a spell would (no event). */
export function give(c: FFXCombatant, status: string, turns = 254): void {
  (c.statuses as Record<string, unknown>)[status] = { id: status, turnsRemaining: turns, ticksRemaining: null, charges: null, stacks: 0, permanent: false };
}
