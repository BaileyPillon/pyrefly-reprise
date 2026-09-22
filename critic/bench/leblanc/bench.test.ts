/**
 * **How much does Active ATB cost Chapter 6 (The Leblanc Syndicate)?**
 *
 * Same method as `tests/unit/ffx2-active-measure.test.ts` (Chapters 4 and 5),
 * built fresh here rather than editing that file, per
 * `docs/handoff/chapter-leblanc-measure.md` §0. Chapter 4 is re-run as the
 * control so all three chapters' numbers in this bench come from one session,
 * one harness, one build.
 *
 * The modelled human decision time `D` is an **input to a measurement, not
 * game data**: at every `'player-input'` decision the driver hands the engine
 * `D` ms of `throughInput` clock, then submits the shipped `intendedStrategy`'s
 * (i.e. `ffx2Leblanc`'s) pick. `D = 0` is today's behaviour and the regression
 * control.
 *
 * FFX-2 only [AGENTS.md rule 14]. Nothing here tunes a boss number
 * (hard rule 6, memory "boss-side fix needs measured options") — this is
 * measurement, and any option this bench prints is itself measured, not
 * guessed.
 *
 * Run:
 * ```
 * npx vitest run --config critic/bench/leblanc/vitest.config.ts
 * ```
 */

import { describe, expect, it } from 'vitest';
import type {
  BattleEvent,
  BattleSetup,
  Command,
  Decision,
  EnemyGroupDef,
  FFX2PartyBuild,
} from '../../../src/battle/common/types.ts';
import {
  FFX2Engine,
  abilityRegistryFrom,
  dressphereRegistryFrom,
  garmentGridRegistryFrom,
  itemRegistryFrom,
} from '../../../src/battle/ffx2/index.ts';
import * as data from '../../../src/data/ffx2/index.ts';
import { bevelleBuild } from '../../../src/data/ffx2/builds/bevelle.ts';
import { chateauBuild } from '../../../src/data/ffx2/builds/chateau.ts';
import { LEBLANC_CHAIN_ORDER } from '../../../src/data/ffx2/enemies/leblanc-syndicate.ts';
import { setupForNextLink } from '../../../src/app/screens/BattleScreenSetup.ts';
import { intendedStrategy } from '../../../src/engine/BattlePresenterStrategies.ts';

const MEASURE = process.env['PYREFLY_MEASURE'] === '1';
const MAX_DECISIONS = 30_000;
/** AUTHORED measurement inputs, not game data — the same three arms `ffx2-active-measure.test.ts` uses. */
const ARMS = [0, 1500, 4000];
/** Extra arms probed only because A1 failed at 1500/4000 — see §3 of the handoff: how fast a human has to answer for the shipped line to still win. */
const OPTION_ARMS = [500, 750, 1000, 1250];
const SEEDS = Array.from({ length: 40 }, (_, i) => i + 1);

function engineOptions() {
  return {
    abilities: abilityRegistryFrom(Object.values(data.ABILITIES)),
    items: itemRegistryFrom(Object.values(data.ITEMS)),
    dresspheres: dressphereRegistryFrom(Object.values(data.STANDARD_DRESSPHERES)),
    garmentGrids: garmentGridRegistryFrom(Object.values(data.GARMENT_GRIDS)),
    minigames: false as const,
  };
}

function fallback(d: Extract<Decision, { kind: 'player-input' }>): Command {
  const row =
    d.commands.find((c) => c.enabled && c.command.kind === 'attack') ?? d.commands.find((c) => c.enabled);
  const target = row?.validTargets[0];
  if (!row) return { kind: 'defend', targets: [] };
  return { ...row.command, targets: target ? [target] : [] } as Command;
}

interface Tally {
  outcome: string | undefined;
  seconds: number;
  playerTurns: number;
  enemyActions: number;
  kos: number;
  aliveAtEnd: number;
  invalidated: number;
  refused: number;
}

function emptyTally(): Tally {
  return {
    outcome: undefined,
    seconds: 0,
    playerTurns: 0,
    enemyActions: 0,
    kos: 0,
    aliveAtEnd: 0,
    invalidated: 0,
    refused: 0,
  };
}

function scoreEvents(tally: Tally, log: readonly BattleEvent[], enemyIds: readonly string[]): void {
  for (const e of log) {
    if (e.type === 'ko') tally.kos += 1;
    if (e.type === 'action-start' && enemyIds.includes(e.actorId)) tally.enemyActions += 1;
  }
}

/** One link (one formation), driven with `decisionMs` of Active clock burned at every menu. */
function runLink(engine: FFX2Engine, decisionMs: number, tally: Tally): string | undefined {
  const enemyIds = [...engine.state().enemyIds];
  const from = engine.state().log.length;
  let outcome: string | undefined;

  for (let i = 0; i < MAX_DECISIONS; i++) {
    const d = engine.nextDecision();
    if (d.kind === 'battle-over') {
      outcome = d.result.outcome;
      break;
    }
    if (d.kind === 'waiting') {
      engine.tick(Math.max(1, d.nextEventMs));
      continue;
    }
    if (d.kind !== 'player-input') continue;

    if (decisionMs > 0) {
      engine.tick(decisionMs, { throughInput: true });
      if (!engine.inputValid(d.actorId)) {
        tally.invalidated += 1;
        continue;
      }
    }

    const picked = intendedStrategy(d.actorId, d.commands, engine);
    const events = engine.submit(picked ?? fallback(d));
    if (events.length === 0) {
      tally.refused += 1;
      continue;
    }
    tally.playerTurns += 1;
  }

  scoreEvents(tally, engine.state().log.slice(from), enemyIds);
  tally.seconds += engine.state().ticks / 3000;
  return outcome;
}

function runChapter4(seed: number, decisionMs: number): Tally {
  const tally = emptyTally();
  const engine = new FFX2Engine(engineOptions());
  const group = data.ENEMY_GROUPS_BY_ID['ffx2-bahamut'];
  if (!group) throw new Error('ffx2-bahamut missing');
  engine.setSeed(seed);
  engine.init({
    game: 'ffx2',
    party: bevelleBuild,
    enemies: group,
    triggers: [],
    seed,
    condition: 'normal',
    canEscape: false,
  });
  tally.outcome = runLink(engine, decisionMs, tally);
  const state = engine.state();
  tally.aliveAtEnd = state.activeIds.filter((id) => state.combatants[id]?.alive).length;
  return tally;
}

/** The whole three-act Leblanc mission, chained the same way the real chapter screen does it. */
function runChapter6(seed: number, decisionMs: number, party: FFX2PartyBuild = chateauBuild): Tally {
  const tally = emptyTally();
  const engine = new FFX2Engine(engineOptions());
  const first = data.ENEMY_GROUPS_BY_ID[LEBLANC_CHAIN_ORDER[0]];
  if (!first) throw new Error('the Leblanc chain is missing');

  let setup: BattleSetup = {
    game: 'ffx2',
    party,
    enemies: first,
    triggers: [],
    seed,
    condition: 'normal',
    canEscape: false,
  };
  engine.setSeed(seed);
  engine.init(setup);

  let group: EnemyGroupDef = first;
  let links = 0;
  for (;;) {
    const outcome = runLink(engine, decisionMs, tally);
    links += 1;
    tally.outcome = outcome;
    if (outcome !== 'victory') break;
    const nextId = group.nextGroupId;
    if (!nextId) break;
    const next = data.ENEMY_GROUPS_BY_ID[nextId];
    if (!next) throw new Error(`chain points at "${nextId}" with no formation`);
    setup = setupForNextLink(setup, next, engine.state(), seed + links) as BattleSetup;
    group = next;
    engine.setSeed(setup.seed);
    engine.init(setup);
  }

  const state = engine.state();
  tally.aliveAtEnd = state.activeIds.filter((id) => state.combatants[id]?.alive).length;
  return tally;
}

function median(xs: number[]): number {
  const s = [...xs].sort((a, b) => a - b);
  return s.length === 0 ? 0 : (s[Math.floor((s.length - 1) / 2)]! + s[Math.ceil((s.length - 1) / 2)]!) / 2;
}

function report(label: string, arms: number[], run: (seed: number, d: number) => Tally): string[] {
  const rows: string[] = [];
  for (const d of arms) {
    const runs = SEEDS.map((seed) => run(seed, d));
    const wins = runs.filter((r) => r.outcome === 'victory').length;
    const secs = runs.map((r) => r.seconds);
    rows.push(
      [
        label,
        `${d} ms`,
        `${wins}/${SEEDS.length}`,
        median(secs).toFixed(1),
        Math.max(...secs).toFixed(1),
        median(runs.map((r) => r.playerTurns)).toFixed(0),
        median(runs.map((r) => r.enemyActions)).toFixed(0),
        median(runs.map((r) => r.kos)).toFixed(0),
        runs.reduce((a, r) => a + r.invalidated, 0),
        runs.reduce((a, r) => a + r.refused, 0),
      ].join(' | '),
    );
  }
  return rows;
}

describe.skipIf(!MEASURE)('Leblanc under Active ATB — what it costs the player (PYREFLY_MEASURE=1)', () => {
  it('Chapter 4 Bahamut (control), forty seeds per arm', () => {
    const rows = report('ch4 Bahamut', ARMS, runChapter4);
    console.log('\nchapter | D | wins | median s | worst s | player turns | enemy actions | KOs | menus invalidated | commands refused');
    for (const row of rows) console.log(row);
    expect(true).toBe(true);
  }, 900_000);

  it('Chapter 6 Leblanc, whole three-act mission, forty seeds per arm', () => {
    const rows = report('ch6 Leblanc', ARMS, runChapter6);
    console.log('\nchapter | D | wins | median s | worst s | player turns | enemy actions | KOs | menus invalidated | commands refused');
    for (const row of rows) console.log(row);
    expect(true).toBe(true);
  }, 900_000);

  it('Chapter 6 Leblanc — measured decision-time options, since A1 failed at 1500/4000 ms', () => {
    const rows = report('ch6 Leblanc option', OPTION_ARMS, runChapter6);
    console.log('\nchapter | D | wins | median s | worst s | player turns | enemy actions | KOs | menus invalidated | commands refused');
    for (const row of rows) console.log(row);
    expect(true).toBe(true);
  }, 900_000);
});

describe('the D = 0 control still reproduces the shipped numbers', () => {
  it('Chapter 6 Leblanc wins the whole mission with zero decision time, on the first four seeds', () => {
    for (const seed of [1, 2, 3, 4]) {
      const tally = runChapter6(seed, 0);
      expect(tally.outcome, `seed ${seed}`).toBe('victory');
      expect(tally.invalidated).toBe(0);
      expect(tally.refused).toBe(0);
    }
  }, 180_000);
});
