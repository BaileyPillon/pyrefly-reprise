/**
 * Drive Chapter 1 (Seymour Flux, FFX) headlessly with the SHIPPED `intendedStrategy`.
 * **FFX only.** Moved out of `strategy-seymour-flux.test.ts` unchanged (PR-0008, 2026-09-25) so
 * the 160-seed floor and the method check's probes run the one driver the test pins.
 * Nothing here touches the boss: it plays the real engine and the real data.
 */

import type { BattleEvent, Command, Decision, FFXPartyBuild } from '../../../src/battle/common/types.ts';
import { FFXContentRegistry, createFFXEngine } from '../../../src/battle/ffx/index.ts';
import { ALL_ABILITIES, ENEMY_GROUPS_BY_ID, ITEMS } from '../../../src/data/ffx/index.ts';
import { gagazetBuild } from '../../../src/data/ffx/builds/gagazet.ts';
import { intendedStrategy } from '../../../src/engine/BattlePresenterStrategies.ts';

export const MAX_DECISIONS = 60_000;

/** The four seeds the coordinating session measures this encounter on. */
export const SEEDS = [1, 7, 42, 20260916];

/** The four standard 40-seed windows the chapter is measured over (160 seeds). */
export const WINDOWS: readonly (readonly [number, number])[] = [
  [1, 40],
  [41, 80],
  [101, 140],
  [1001, 1040],
];

export function newEngine(seed: number, party: FFXPartyBuild = gagazetBuild) {
  const content = new FFXContentRegistry();
  content.addAbilities(ALL_ABILITIES);
  content.addItems(Object.values(ITEMS));
  const group = ENEMY_GROUPS_BY_ID['seymour-flux'];
  if (!group) throw new Error('seymour-flux group missing from the data layer');
  const engine = createFFXEngine({ content, autoResolveMinigames: true });
  engine.init({ game: 'ffx', party, enemies: group, triggers: [], seed, condition: 'normal', canEscape: false });
  return engine;
}

/** Plain Attack on the first valid target — used only when the strategy declines. */
export function attack(d: Extract<Decision, { kind: 'player-input' }>): Command {
  const row = d.commands.find((c) => c.command.kind === 'attack' && c.enabled);
  const target = row?.validTargets[0];
  return { kind: 'attack', targets: target ? [target] : [] };
}

export interface Run {
  outcome: string | undefined;
  decisions: number;
  turns: number;
  bossHp: number;
  mountHp: number;
  mountMaxHp: number;
  /** Links of the chained encounter that completed. */
  links: number;
  poison: number;
  summons: number;
  mountHits: number;
}

/**
 * `links` the way `BattleScreen.runEncounter` counts them: one per formation,
 * following `EnemyGroupDef.nextGroupId` on a victory. The Seymour Flux
 * formation publishes no `nextGroupId`, so a completed chain is exactly one
 * link — this computes it the same way the screen does rather than asserting a
 * constant, so a future data change that chains the encounter is caught here.
 */
function chainLinks(outcome: string | undefined): number {
  let links = 1;
  let group = ENEMY_GROUPS_BY_ID['seymour-flux'];
  while (outcome === 'victory' && group?.nextGroupId) {
    const next = ENEMY_GROUPS_BY_ID[group.nextGroupId];
    if (!next) break;
    links++;
    group = next;
  }
  return links;
}

/** One run of the shipped line on `seed`, plus its full event log for probes. */
export function runIntendedWithLog(seed: number): { run: Run; log: readonly BattleEvent[] } {
  const engine = newEngine(seed);
  const run: Run = {
    outcome: undefined,
    decisions: 0,
    turns: 0,
    bossHp: 0,
    mountHp: 0,
    mountMaxHp: 0,
    links: 1,
    poison: 0,
    summons: 0,
    mountHits: 0,
  };

  for (let i = 0; i < MAX_DECISIONS; i++) {
    run.decisions++;
    const d = engine.nextDecision();
    if (d.kind === 'battle-over') {
      run.outcome = d.result.outcome;
      run.turns = d.result.turns;
      break;
    }
    if (d.kind === 'player-input') {
      const cmd = intendedStrategy(d.actorId, d.commands, engine);
      engine.submit(cmd ?? attack(d));
    }
  }

  const state = engine.state();
  for (const e of state.log) {
    // A poison tick is a `damage` event with no source [statuses.ts].
    if (e.type === 'damage' && e.targetId === 'seymour-flux' && e.sourceId === undefined) run.poison += e.amount;
    if (e.type === 'summon') run.summons++;
    if (e.type === 'damage' && e.targetId === 'mortiorchis' && e.sourceId !== undefined) {
      const party = ['tidus', 'yuna', 'kimahri', 'auron', 'wakka', 'lulu', 'rikku'];
      if (party.includes(e.sourceId)) run.mountHits++;
    }
  }
  run.bossHp = state.combatants['seymour-flux']?.hp ?? -1;
  run.mountHp = state.combatants['mortiorchis']?.hp ?? -1;
  run.mountMaxHp = state.combatants['mortiorchis']?.stats.maxHp ?? -1;
  run.links = chainLinks(run.outcome);
  return { run, log: state.log };
}

export function runIntended(seed: number): Run {
  return runIntendedWithLog(seed).run;
}
