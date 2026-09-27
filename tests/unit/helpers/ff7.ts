/**
 * Shared fixtures for the FF7 engine suites: the canon Guard Scorpion setup and a
 * few ways to drive the engine to a moment. FF7 only.
 */

import type { BattleEvent, BattleSetup, Command, Ff7Combatant, Ff7PartyBuild } from '../../../src/battle/common/types.ts';
import { Ff7Engine, type Ff7EngineOptions } from '../../../src/battle/ff7/index.ts';
import { ff7Registry, guardScorpionGroup, sector1ReactorBuild } from '../../../src/data/ff7/index.ts';

export const REG = ff7Registry();

export function gsSetup(seed = 1, party: Ff7PartyBuild = sector1ReactorBuild): BattleSetup {
  return { game: 'ff7', party, enemies: guardScorpionGroup, triggers: [], seed, condition: 'normal', canEscape: false };
}

export function newEngine(seed = 1, opts: Partial<Ff7EngineOptions> = {}, party?: Ff7PartyBuild): Ff7Engine {
  const e = new Ff7Engine({ registry: REG, ...opts });
  e.setSeed(seed);
  e.init(gsSetup(seed, party));
  return e;
}

export function u(e: Ff7Engine, id: string): Ff7Combatant {
  return e.state().combatants[id] as Ff7Combatant;
}

/** Run the clock (the `'waiting'` path) and resolve queued actions until someone's menu opens; returns its actor. */
export function toNextMenu(e: Ff7Engine, maxSteps = 500): string | null {
  for (let i = 0; i < maxSteps; i++) {
    const d = e.nextDecision();
    if (d.kind === 'battle-over') return null;
    if (d.kind === 'player-input') return d.actorId;
    if (d.kind === 'waiting') e.tick(d.nextEventMs);
  }
  throw new Error('no menu');
}

/** Answer every menu with `answer` until `stop` says so (checked after each decision) or the battle ends. */
export function playUntil(e: Ff7Engine, answer: (actorId: string) => Command, stop: () => boolean, maxSteps = 5000): void {
  for (let i = 0; i < maxSteps; i++) {
    if (stop()) return;
    const d = e.nextDecision();
    if (d.kind === 'battle-over') return;
    if (d.kind === 'waiting') e.tick(d.nextEventMs);
    else if (d.kind === 'player-input') e.submit(answer(d.actorId));
  }
  throw new Error('playUntil: never stopped');
}

export const DEFEND: Command = { kind: 'defend', targets: [] };
export const ATTACK_BOSS: Command = { kind: 'attack', targets: ['guard-scorpion'] };

/** Events of one type from a log. */
export function ofType<T extends BattleEvent['type']>(log: readonly BattleEvent[], type: T): Array<Extract<BattleEvent, { type: T }>> {
  return log.filter((ev): ev is Extract<BattleEvent, { type: T }> => ev.type === type);
}

/** A copy of the canon build with edits to one member. */
export function buildWith(edit: (b: Ff7PartyBuild) => void): Ff7PartyBuild {
  const b = JSON.parse(JSON.stringify(sector1ReactorBuild)) as Ff7PartyBuild;
  edit(b);
  return b;
}
