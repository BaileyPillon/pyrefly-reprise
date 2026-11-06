/**
 * Shared fixtures for the hidden Flooded Ways chapter's engine tests and bench (FFX only; Tidus, Wakka and Rikku against Evrae Altana's three areas and Geosgaeno): an engine on any of the four links, the drive and read
 * helpers, the chain driver (the carry between links as `runEncounterChain` does it) and the one-fight player that the bench and the tests both use. Test-only.
 */

import type { BattleEngine, BattleEvent, BattleSetup, Command, Decision, FFXCombatant, FFXPartyBuild } from '../../../src/battle/common/types.ts';
import { FFXContentRegistry, createFFXEngine } from '../../../src/battle/ffx/index.ts';
import { ALL_ABILITIES, ENEMY_GROUPS_BY_ID, ITEMS } from '../../../src/data/ffx/index.ts';
import { swimmersBuild } from '../../../src/data/ffx/builds/swimmers.ts';
import { FLOODED_LINKS, type FloodedLink } from '../../../src/data/ffx/flooded-ways-ids.ts';
import type { Ctx } from '../../../src/battle/ffx/state.ts';
import { setupForNextLink } from '../../../src/app/screens/BattleScreenSetup.ts';
import { skipSpentLinks } from '../../../src/app/screens/BattleScreenFloodedCarry.ts';

export const content = new FFXContentRegistry();
content.addAbilities([...ALL_ABILITIES]);
content.addItems(Object.values(ITEMS));

export type Input = Extract<Decision, { kind: 'player-input' }>;
export type LinkKey = FloodedLink['key'];

export const LINK_KEYS: readonly LinkKey[] = FLOODED_LINKS.map((l) => l.key);
export const groupIdOf = (key: LinkKey): string => FLOODED_LINKS.find((l) => l.key === key)!.groupId;
export const groupOf = (key: LinkKey): NonNullable<(typeof ENEMY_GROUPS_BY_ID)[string]> => {
  const group = ENEMY_GROUPS_BY_ID[groupIdOf(key)];
  if (!group) throw new Error(`the formation '${key}' is missing from the data layer`);
  return group;
};

/** The shipped party with the Stone Wards taken off (the shatter rule is real in the engine and is not met by the shipped party: `swimmers.ts`). */
export function unwarded(party: FFXPartyBuild = swimmersBuild): FFXPartyBuild {
  const out = structuredClone(party);
  for (const m of out.members) m.equipment.armor.autoAbilities = m.equipment.armor.autoAbilities.filter((a) => a !== 'stone-ward');
  return out;
}

export function setup(seed: number, key: LinkKey = 'area-1', party: FFXPartyBuild = swimmersBuild): BattleSetup {
  return { game: 'ffx', party, enemies: groupOf(key), triggers: [], seed, condition: 'normal', canEscape: false };
}

export function newEngine(seed = 1, key: LinkKey = 'area-1', party: FFXPartyBuild = swimmersBuild): ReturnType<typeof createFFXEngine> {
  const engine = createFFXEngine({ content, autoResolveMinigames: true });
  engine.init(setup(seed, key, party));
  return engine;
}

/** An engine on any formation of the data layer by its group id (the absence tests' other chapters), with the chapter's party. */
export function engineOnGroup(groupId: string, seed = 1, party: FFXPartyBuild = swimmersBuild): ReturnType<typeof createFFXEngine> {
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

/** Advance to the next player input (the monsters' turns resolve on the way). */
export function nextInput(engine: BattleEngine): Input {
  for (let i = 0; i < 400; i++) {
    const d = engine.nextDecision();
    if (d.kind === 'player-input') return d;
    if (d.kind === 'battle-over') throw new Error('the battle ended');
  }
  throw new Error('no player input');
}

/** Advance until `who` has the menu (everybody else defends); throws when the battle ends first. */
export function nextInputOf(engine: BattleEngine, who: string, others: (d: Input) => Command | null = () => defend()): Input {
  for (let i = 0; i < 400; i++) {
    const d = nextInput(engine);
    if (d.actorId === who) return d;
    engine.submit(others(d) ?? defend());
  }
  throw new Error(`${who} never got the menu`);
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
export function playOne(seed: number, key: LinkKey, choose: (input: Input, engine: BattleEngine) => Command | null, maxInputs = 800, party: FFXPartyBuild = swimmersBuild): Run {
  const engine = newEngine(seed, key, party);
  return playEngine(engine, choose, maxInputs);
}

export function playEngine(engine: BattleEngine, choose: (input: Input, engine: BattleEngine) => Command | null, maxInputs = 800): Run {
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

/** The plain Attack on the first living foe that is not a lock: the careless line. */
export function careless(d: Input, engine: BattleEngine): Command | null {
  const foes = engine.state().enemyIds.filter((id) => !id.startsWith('gate-lock') && (engine.state().combatants[id] as FFXCombatant).alive);
  for (const id of foes) {
    const c = row(d, 'attack', undefined, id);
    if (c) return c;
  }
  return null;
}

/**
 * The links chained as `runEncounterChain` chains them: the next link is found, spent links are skipped (`skipSpentLinks`), the setup is carried (`setupForNextLink`: HP and MP, the bag, the boss's HP, the shattered returned) and
 * the engine re-inits. `play` plays one engine to its end; the chain stops at the first lost link.
 */
export interface ChainStep {
  key: LinkKey;
  run: Run;
}

export async function playChain(seed: number, play: (engine: BattleEngine, key: LinkKey) => Run, party: FFXPartyBuild = swimmersBuild, stopBefore?: LinkKey): Promise<{ steps: ChainStep[]; outcome: string }> {
  const steps: ChainStep[] = [];
  let key: LinkKey = LINK_KEYS[0]!;
  let current = setup(seed, key, party);
  let engine = createFFXEngine({ content, autoResolveMinigames: true });
  engine.init(current);
  for (let guard = 0; guard < 8; guard++) {
    const run = play(engine, key);
    steps.push({ key, run });
    if (run.outcome !== 'victory') return { steps, outcome: run.outcome };
    const nextId = groupOf(key).nextGroupId;
    if (nextId === undefined) return { steps, outcome: 'victory' };
    const find = async (id: string) => ENEMY_GROUPS_BY_ID[id] ?? null;
    const found = await find(nextId);
    if (found === null) return { steps, outcome: 'victory' };
    const next = await skipSpentLinks(found, engine.state(), find);
    if (stopBefore !== undefined && next.id === groupIdOf(stopBefore)) return { steps, outcome: 'victory' };
    current = setupForNextLink(current, next, engine.state(), seed + guard + 1) as BattleSetup;
    key = FLOODED_LINKS.find((l) => l.groupId === next.id)!.key;
    engine = createFFXEngine({ content, autoResolveMinigames: true });
    engine.init(current);
  }
  return { steps, outcome: 'unfinished' };
}

/** The engine's context (the AI scripts and the hold take it): the tests call a script's turn directly with it. */
export const ctxOf = (engine: BattleEngine): Ctx => (engine as unknown as { ctx: Ctx }).ctx;

/** Everybody in the front line is untouchable (a mechanic stays on its mechanic): maximum and current HP are set to 99,999. */
export function invincible(engine: BattleEngine): void {
  for (const id of ['tidus', 'wakka', 'rikku']) {
    const c = actor(engine, id);
    if (c.alive && !c.removed) {
      c.stats.maxHp = 99_999;
      c.hp = 99_999;
    }
  }
}
