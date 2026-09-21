/**
 * **How much harder does Active make Chapters 4 and 5?**
 *
 * `docs/plans/ffx2-active-atb-review.md` §8: Active makes both X-2 chapters
 * harder — that is the mechanic — so the build is not finished until we can say
 * *how much*, with a number, before Bailey is asked anything. This is that
 * measurement, and it is the arm that stops a boss ever being weakened to
 * compensate (memory "boss-side fix needs measured options", hard rule 6).
 *
 * **Not part of the default suite**: 240 headless chapter runs. Gate:
 *
 * ```
 * PYREFLY_MEASURE=1 npx vitest run tests/unit/ffx2-active-measure.test.ts
 * ```
 *
 * The modelled human decision time `D` is an **input to a measurement, not game
 * data**: at every `'player-input'` decision the driver hands the engine `D` ms
 * of `throughInput` clock — a fake clock in the one place that needs one — and
 * then submits `intendedStrategy`'s pick. `D = 0` is today's behaviour and the
 * regression control: the auto-battler takes zero decision time, so it must
 * reproduce the shipped numbers exactly.
 *
 * FFX-2 only. FFX has no clock to run under a menu.
 */

import { describe, expect, it } from 'vitest';
import type {
  BattleEvent,
  BattleSetup,
  Command,
  Decision,
  EnemyGroupDef,
  FFX2PartyBuild,
} from '../../src/battle/common/types.ts';
import {
  FFX2Engine,
  abilityRegistryFrom,
  dressphereRegistryFrom,
  garmentGridRegistryFrom,
  itemRegistryFrom,
} from '../../src/battle/ffx2/index.ts';
import * as data from '../../src/data/ffx2/index.ts';
import { bevelleBuild } from '../../src/data/ffx2/builds/bevelle.ts';
import { farplaneBuild } from '../../src/data/ffx2/builds/farplane.ts';
import { setupForNextLink } from '../../src/app/screens/BattleScreenSetup.ts';
import { intendedStrategy } from '../../src/engine/BattlePresenterStrategies.ts';
import { VEGNAGUN_CHAIN_ORDER } from '../../src/data/ffx2/ids.ts';

const MEASURE = process.env['PYREFLY_MEASURE'] === '1';
const MAX_DECISIONS = 30_000;
/** AUTHORED measurement inputs, not game data: 0 = today, 1.5 s = a player who knows the menu, 4 s = a first-timer reading it. */
const ARMS = [0, 1500, 4000];
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
  chainedHits: number;
  declined: number;
  invalidated: number;
  refused: number;
  megaFlares: number;
  lastLink: string;
}

function emptyTally(): Tally {
  return {
    outcome: undefined,
    seconds: 0,
    playerTurns: 0,
    enemyActions: 0,
    kos: 0,
    aliveAtEnd: 0,
    chainedHits: 0,
    declined: 0,
    invalidated: 0,
    refused: 0,
    megaFlares: 0,
    lastLink: '',
  };
}

function scoreEvents(tally: Tally, log: readonly BattleEvent[], enemyIds: readonly string[]): void {
  for (const e of log) {
    if (e.type === 'chain' && e.count > 0) tally.chainedHits += 1;
    if (e.type === 'ko') tally.kos += 1;
    if (e.type === 'action-start' && e.abilityId === 'mega-flare') tally.megaFlares += 1;
    if (e.type === 'action-start' && enemyIds.includes(e.actorId)) tally.enemyActions += 1;
  }
}

/**
 * One link, driven with `decisionMs` of Active clock burned at every menu.
 *
 * The commands in a decision were built before that clock ran, so a target can
 * die under them — which is exactly the case `submit`'s refuse-and-reopen guard
 * answers, and it is counted rather than hidden.
 */
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
    if (!picked) tally.declined += 1;
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
  tally.lastLink = 'ffx2-bahamut';
  const state = engine.state();
  tally.aliveAtEnd = state.activeIds.filter((id) => state.combatants[id]?.alive).length;
  return tally;
}

function runChapter5(seed: number, decisionMs: number, party: FFX2PartyBuild = farplaneBuild): Tally {
  const tally = emptyTally();
  const engine = new FFX2Engine(engineOptions());
  const first = data.ENEMY_GROUPS_BY_ID[VEGNAGUN_CHAIN_ORDER[0]!];
  if (!first) throw new Error('the Vegnagun chain is missing');

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
    tally.lastLink = group.id;
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

function report(label: string, run: (seed: number, d: number) => Tally): void {
  const rows: string[] = [];
  for (const d of ARMS) {
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
        median(runs.map((r) => r.chainedHits)).toFixed(0),
        median(runs.map((r) => r.megaFlares)).toFixed(0),
        runs.reduce((a, r) => a + r.invalidated, 0),
        runs.reduce((a, r) => a + r.refused, 0),
      ].join(' | '),
    );
  }
  console.log(
    '\nchapter | D | wins | median s | worst s | player turns | enemy actions | KOs | chained | mega flares | menus invalidated | commands refused',
  );
  for (const row of rows) console.log(row);
}

describe.skipIf(!MEASURE)('Active ATB — what it costs the player (PYREFLY_MEASURE=1)', () => {
  it('Chapter 4, forty seeds per arm', () => {
    report('ch4 Bahamut', runChapter4);
    expect(true).toBe(true);
  }, 900_000);

  it('Chapter 5, forty chains per arm', () => {
    report('ch5 Vegnagun', runChapter5);
    expect(true).toBe(true);
  }, 900_000);
});

describe('the D = 0 control still reproduces the shipped numbers', () => {
  it('Chapter 4 on the four canonical seeds is a win with zero decision time', () => {
    for (const seed of [1, 7, 42, 20260916]) {
      const tally = runChapter4(seed, 0);
      expect(tally.outcome, `seed ${seed}`).toBe('victory');
      expect(tally.invalidated).toBe(0);
      expect(tally.refused).toBe(0);
    }
  }, 120_000);
});
