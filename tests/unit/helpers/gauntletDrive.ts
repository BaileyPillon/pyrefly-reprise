/**
 * Shared fixtures for the hidden Gauntlet chapter's engine tests and bench (FFX only; chapter 54; Tidus, Yuna and Auron against the Monster Arena creations): an engine on any act, the drive and read helpers, the one-fight
 * player the bench and the tests both use, and the digest of an event log. Test-only; the pattern of `darkAeonsDrive.ts`.
 */

import type { BattleEngine, BattleEvent, BattleSetup, Command, Decision, FFXCombatant, FFXPartyBuild } from '../../../src/battle/common/types.ts';
import { FFXContentRegistry, createFFXEngine } from '../../../src/battle/ffx/index.ts';
import type { Ctx } from '../../../src/battle/ffx/state.ts';
import { ALL_ABILITIES, ENEMY_GROUPS_BY_ID, ITEMS } from '../../../src/data/ffx/index.ts';
import { gauntletBuild } from '../../../src/data/ffx/builds/gauntlet.ts';
import { GAUNTLET_ACTS, type GauntletCreatureId } from '../../../src/data/ffx/gauntlet-ids.ts';
import { GAUNTLET_ACTS_BUILT, gauntletGroup } from '../../../src/data/ffx/enemies/gauntlet-groups.ts';

export const content = new FFXContentRegistry();
content.addAbilities([...ALL_ABILITIES]);
content.addItems(Object.values(ITEMS));

export type Input = Extract<Decision, { kind: 'player-input' }>;
export type Line = (d: Input, e: BattleEngine) => Command | null;

/** The acts whose rules are built (tier 1 after stage 2). */
export const BUILT_CREATURES: readonly GauntletCreatureId[] = GAUNTLET_ACTS.slice(0, GAUNTLET_ACTS_BUILT).map((a) => a.creature);

/** The act's formation: the shipped one for a built act, else built here with the chain as far as the tiers built (the tests of an unbuilt act's data only). */
export function groupOfCreature(creature: GauntletCreatureId) {
  const act = GAUNTLET_ACTS.find((a) => a.creature === creature);
  if (act === undefined) throw new Error(`no act '${creature}'`);
  return ENEMY_GROUPS_BY_ID[act.groupId] ?? gauntletGroup(act.act - 1);
}

export function setup(seed: number, creature: GauntletCreatureId = 'cactuar-king', party: FFXPartyBuild = gauntletBuild): BattleSetup {
  return { game: 'ffx', party, enemies: groupOfCreature(creature), triggers: [], seed, condition: 'normal', canEscape: false };
}

export function newEngine(seed = 1, creature: GauntletCreatureId = 'cactuar-king', party: FFXPartyBuild = gauntletBuild): ReturnType<typeof createFFXEngine> {
  const engine = createFFXEngine({ content, autoResolveMinigames: true });
  engine.init(setup(seed, creature, party));
  return engine;
}

export const ctxOf = (engine: BattleEngine): Ctx => (engine as unknown as { ctx: Ctx }).ctx;
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

/** What `who` did on its own turns: `actions` without the free actions a counter queued (the action-start right after a `counter` event of the same actor). */
export function turnActions(events: readonly BattleEvent[], who: string): string[] {
  return events.flatMap((e, i) => {
    if (e.type !== 'action-start' || e.actorId !== who) return [];
    const before = events[i - 1];
    if (before !== undefined && before.type === 'counter' && before.actorId === who) return [];
    return [e.abilityId ?? e.command.kind];
  });
}

/** The FNV-1a digest of an event log (every field), the convention of `ffx-engine-golden.test.ts`. */
export function digestOf(events: readonly BattleEvent[]): string {
  const s = JSON.stringify(events);
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619) >>> 0;
  return h.toString(16);
}

export interface Run {
  outcome: string;
  inputs: number;
  /** Battle turns at the end (CTB turn counter). */
  turns: number;
  events: readonly BattleEvent[];
  digest: string;
}

/** Play one fight to an outcome with `choose` (null = defend); gives up at `maxInputs` as 'unfinished'. */
export function playOne(seed: number, creature: GauntletCreatureId, choose: Line, maxInputs = 1200, party: FFXPartyBuild = gauntletBuild): Run {
  const engine = newEngine(seed, creature, party);
  let inputs = 0;
  for (let i = 0; i < maxInputs * 4; i++) {
    const d = engine.nextDecision();
    if (d.kind === 'battle-over') return { outcome: d.result.outcome, inputs, turns: engine.state().turn, events: log(engine), digest: digestOf(log(engine)) };
    if (d.kind !== 'player-input') continue;
    if (++inputs > maxInputs) break;
    engine.submit(choose(d, engine) ?? defend());
  }
  return { outcome: 'unfinished', inputs, turns: engine.state().turn, events: log(engine), digest: digestOf(log(engine)) };
}

/** Advance to the next player input (the creature's turns resolve on the way). */
export function nextInput(engine: BattleEngine): Input {
  for (let i = 0; i < 400; i++) {
    const d = engine.nextDecision();
    if (d.kind === 'player-input') return d;
    if (d.kind === 'battle-over') throw new Error('the battle ended');
  }
  throw new Error('no player input');
}

/** The plain Attack on the first living foe, no aeon, no potion: the careless line. */
export function careless(d: Input, engine: BattleEngine): Command | null {
  const foes = engine.state().enemyIds.filter((id) => (engine.state().combatants[id] as FFXCombatant).alive);
  for (const id of foes) {
    const c = row(d, 'attack', undefined, id);
    if (c) return c;
  }
  return null;
}
