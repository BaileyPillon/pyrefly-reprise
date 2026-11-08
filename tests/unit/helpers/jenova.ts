/**
 * Shared fixtures for the Jenova LIFE suites (hidden chapter 44; FF7 only): the Forgotten Capital setup, an engine on
 * it, and a bare `Ff7Env` so a test can resolve one ability on chosen fighters and read the events.
 */

import { SeededRng } from '../../../src/battle/common/rng.ts';
import type { BattleEvent, BattleSetup, Ff7Combatant, Ff7PartyBuild } from '../../../src/battle/common/types.ts';
import { DEFAULT_BATTLE_SPEED } from '../../../src/battle/ff7/atb.ts';
import { Ff7Engine, type Ff7EngineOptions } from '../../../src/battle/ff7/index.ts';
import type { EventDraft, Ff7Env } from '../../../src/battle/ff7/internal.ts';
import { buildFf7Battle } from '../../../src/battle/ff7/setup.ts';
import { ff7Registry, forgottenCapitalBuild, jenovaLifeGroup } from '../../../src/data/ff7/index.ts';

export const JL_REG = ff7Registry();
export const JENOVA = 'jenova-life';

export function jlSetup(seed = 1, party: Ff7PartyBuild = forgottenCapitalBuild): BattleSetup {
  return { game: 'ff7', party, enemies: jenovaLifeGroup, triggers: [], seed, condition: 'normal', canEscape: false };
}

export function jlEngine(seed = 1, opts: Partial<Ff7EngineOptions> = {}, party?: Ff7PartyBuild): Ff7Engine {
  const e = new Ff7Engine({ registry: JL_REG, ...opts });
  e.setSeed(seed);
  e.init(jlSetup(seed, party));
  return e;
}

/** A copy of the chapter's build with edits. */
export function jlBuildWith(edit: (b: Ff7PartyBuild) => void): Ff7PartyBuild {
  const b = JSON.parse(JSON.stringify(forgottenCapitalBuild)) as Ff7PartyBuild;
  edit(b);
  return b;
}

/** A bare environment on the chapter's battle: no engine loop, so a test resolves exactly the action it wants. */
export function jlEnv(seed = 1, party?: Ff7PartyBuild): {
  env: Ff7Env;
  events: BattleEvent[];
  u: (id: string) => Ff7Combatant;
} {
  const rng = new SeededRng(seed);
  const built = buildFf7Battle(jlSetup(seed, party), JL_REG, rng, DEFAULT_BATTLE_SPEED);
  const events: BattleEvent[] = [];
  let n = 0;
  const env: Ff7Env = {
    state: built.state,
    reg: JL_REG,
    rng,
    rt: built.rt,
    emit: (e: EventDraft) => {
      events.push({ ...e, seq: n++ } as BattleEvent);
    },
  };
  return { env, events, u: (id) => built.state.combatants[id] as Ff7Combatant };
}

export function ofType<T extends BattleEvent['type']>(log: readonly BattleEvent[], type: T): Array<Extract<BattleEvent, { type: T }>> {
  return log.filter((ev): ev is Extract<BattleEvent, { type: T }> => ev.type === type);
}
