/**
 * Plays one FFX-2 chapter's whole chain through the app's own path (`registerBattleContent`, `setupForChapter`, `setupForNextLink`, minigames auto-resolved) with
 * the SHIPPED `intendedStrategy`, at one of three paces, and tallies what explains a move. Shared by `ffx2-action-span-off.test.ts` (the switch-off digests)
 * and `ffx2-action-span-measure.test.ts` (the switch-on measurement); the method of `ffx2-hit-reaction-measure.test.ts`, which this file's `playChain` follows.
 *
 * Paces: `bench` = zero decision time (the auto-battler, what the goldens and the parity measurement use); `human` = the default Wait with its split, 1.5 s a menu of
 * which 0.5 s is on the top list (the clock runs) and the rest inside a submenu (held); `active` = Active ATB, 1.5 s a menu with the clock running. The decision times
 * are authored measurement inputs, not game data.
 */

import { createHash } from 'node:crypto';
import type { BattleSetup, BattleState, Command, Decision, EnemyGroupDef } from '../../../src/battle/common/types.ts';
import { FFX2Engine } from '../../../src/battle/ffx2/index.ts';
import { ffx2EngineOptions } from '../../../src/app/screens/BattleScreenContent.ts';
import { findEnemyGroup, setupForChapter, setupForNextLink } from '../../../src/app/screens/BattleScreenSetup.ts';
import type { Chapter } from '../../../src/data/encounters.ts';
import { intendedStrategy } from '../../../src/engine/BattlePresenterStrategies.ts';

export type Pace = 'bench' | 'human' | 'active';

/** Every FFX-2 chapter on this build. */
export const FFX2_CHAPTERS = [
  'ffx2-bahamut', 'ffx2-vegnagun-shuyin', 'ffx2-leblanc', 'ffx2-fallen-aeons', 'ffx2-trema', 'ffx2-den-of-woe', 'ffx2-ixion-djose',
  'ffx2-masterpiece-theatre', 'ffx2-tourist-trap', 'ffx2-valefor-besaid', 'ffx2-angra-mainyu', 'exp-leblanc',
];

const MAX_DECISIONS = 60_000;
const MAX_LINKS = 12;
const MENU_MS = 1500;
const TOP_MS = 500;

type Input = Extract<Decision, { kind: 'player-input' }>;

/** What one seed's chain came to. */
export interface One {
  outcome: string;
  link1Won: boolean;
  partyTurns: number;
  engineTurns: number;
  steps: number;
  partyKos: number;
  invalidated: number;
  /** Actions that finished, by side of the actor. */
  partyActions: number;
  enemyActions: number;
  /** Hash of every link's whole event log: two runs with the same digest played the same battle event for event. */
  digest: string;
}

function fallback(d: Input): Command {
  const row = d.commands.find((c) => c.enabled && c.command.kind === 'attack') ?? d.commands.find((c) => c.enabled);
  if (!row) return { kind: 'defend', targets: [] } as Command;
  const t = row.validTargets[0];
  return { ...row.command, targets: t ? [t] : [] } as Command;
}

function tally(state: Readonly<BattleState>, one: One): void {
  for (const e of state.log) {
    if (e.type === 'ko') {
      const side = state.combatants[e.targetId]?.side;
      if (side === 'party' || side === 'aeon') one.partyKos += 1;
    } else if (e.type === 'action-end') {
      if (state.combatants[e.actorId]?.side === 'enemy') one.enemyActions += 1;
      else one.partyActions += 1;
    }
  }
}

/** Wait a decision's worth of menu time as the pace says; false when the clock closed her menu under her. */
function menuTime(engine: FFX2Engine, actorId: string, pace: Pace, one: One): boolean {
  if (pace === 'bench') return true;
  if (pace === 'human') {
    engine.setMenuLevel('top');
    engine.tick(TOP_MS, { throughInput: true });
    engine.setMenuLevel('deep');
    if (!engine.inputValid(actorId)) {
      one.invalidated += 1;
      return false;
    }
    engine.tick(MENU_MS - TOP_MS, { throughInput: true });
    return true;
  }
  engine.tick(MENU_MS, { throughInput: true });
  if (!engine.inputValid(actorId)) {
    one.invalidated += 1;
    return false;
  }
  return true;
}

/** Play the chapter's whole chain on one seed (the caller has run `registerBattleContent`). */
export async function playChain(chapter: Chapter, seed: number, pace: Pace): Promise<One> {
  let setup: BattleSetup = setupForChapter(chapter, seed);
  let group: EnemyGroupDef = chapter.enemyGroupRef;
  const engine = new FFX2Engine({ ...ffx2EngineOptions(), minigames: false, ...(pace === 'active' ? { atbMode: 'active' as const } : {}) });
  engine.setSeed(setup.seed);
  engine.init(setup);
  const hash = createHash('sha1');
  const one: One = { outcome: 'unresolved', link1Won: false, partyTurns: 0, engineTurns: 0, steps: 0, partyKos: 0, invalidated: 0, partyActions: 0, enemyActions: 0, digest: '' };
  let link = 1;
  for (let i = 0; i < MAX_DECISIONS; i += 1) {
    const d = engine.nextDecision();
    if (d.kind === 'resolved') continue;
    if (d.kind === 'waiting') {
      engine.tick(Math.max(1, d.nextEventMs));
      continue;
    }
    if (d.kind === 'battle-over') {
      const state = engine.state() as Readonly<BattleState>;
      one.engineTurns += d.result.turns;
      one.steps += state.ticks;
      tally(state, one);
      hash.update(JSON.stringify(state.log));
      one.outcome = String(d.result.outcome);
      if (link === 1) one.link1Won = one.outcome === 'victory';
      if (one.outcome !== 'victory' || !group.nextGroupId || link >= MAX_LINKS) break;
      const next = await findEnemyGroup(group.nextGroupId);
      if (!next) break;
      setup = setupForNextLink(setup, next, engine.state() as BattleState, seed + link);
      group = next;
      link += 1;
      engine.setSeed(setup.seed);
      engine.init(setup);
      continue;
    }
    if (!menuTime(engine, d.actorId, pace, one)) continue;
    one.partyTurns += 1;
    engine.submit(intendedStrategy(d.actorId, d.commands, engine as never) ?? fallback(d));
  }
  one.digest = hash.digest('hex');
  return one;
}
