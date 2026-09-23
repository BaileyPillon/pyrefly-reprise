/**
 * **Wait mode (D-029, the new default) versus Active (control) — chapters 4, 5, 6.**
 *
 * Bailey's decision, verbatim: "1. C Wait mode. Also I want the default to be
 * wait mode instead of active mode please." (D-029, `docs/target/decisions.json`,
 * superseding D-009.) `docs/handoff/ffx2-wait-mode.md` and `active.ts`'s
 * `clockHeldByMenu` say Wait freezes the whole menu, not only a submenu — this
 * bench measures what that actually costs (or doesn't cost) a human decision
 * time, same method `tests/unit/ffx2-active-measure.test.ts` and
 * `critic/bench/leblanc/bench.test.ts` already used for Active, built fresh
 * here per this run's brief rather than editing those files.
 *
 * The modelled human decision time `D` is an **authored input to the
 * measurement, not game data**: at every `'player-input'` decision the driver
 * hands the engine `D` ms of `throughInput` clock, then submits the shipped
 * `intendedStrategy`'s pick. Only the intended-chapter-line driver is run here
 * — the move advisor's "top row" driver is not wired into this harness either,
 * same gap `docs/handoff/ffx2-active-menu-measure.md` §1 already disclosed for
 * the Active-only bench; this report inherits it rather than re-deriving one.
 *
 * **Expected, if the build is right**: in Wait, `D` changes wall time (more
 * clock passes while the top-level menu sits open) but never the outcome —
 * every seed that wins at D=0 wins at every D, because nothing the engine
 * tracks (ATB, charge, recovery, status timers, chain windows, enemy turns,
 * carried ticks) moves while a decision is outstanding. In Active, `D` costs
 * wins the same way `ffx2-active-menu-measure.md` already measured (reproduced
 * here as the control, confirming this harness matches that one).
 *
 * FFX-2 only [AGENTS.md rule 14] — Wait/Active is an FFX-2 Config entry
 * (`research/ffx2-combat-core.md` §1.5); FFX is CTB and has no clock under a
 * menu, so it is out of scope. Nothing here tunes a boss number (hard rule 6,
 * memory "boss-side fix needs measured options") — this is measurement only,
 * and the fixed decision-time arms below are the only "options" printed.
 *
 * Run:
 * ```
 * PYREFLY_MEASURE=1 npx vitest run --config critic/bench/ffx2-wait/vitest.config.ts
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
import { farplaneBuild } from '../../../src/data/ffx2/builds/farplane.ts';
import { chateauBuild } from '../../../src/data/ffx2/builds/chateau.ts';
import { VEGNAGUN_CHAIN_ORDER } from '../../../src/data/ffx2/ids.ts';
import { LEBLANC_CHAIN_ORDER } from '../../../src/data/ffx2/enemies/leblanc-syndicate.ts';
import { setupForNextLink } from '../../../src/app/screens/BattleScreenSetup.ts';
import { intendedStrategy } from '../../../src/engine/BattlePresenterStrategies.ts';

const MEASURE = process.env['PYREFLY_MEASURE'] === '1';
const MAX_DECISIONS = 30_000;
/** AUTHORED measurement inputs, not game data — the same three arms every prior ATB bench used. */
const ARMS = [0, 1500, 4000];
const SEEDS = Array.from({ length: 40 }, (_, i) => i + 1);
type Mode = 'wait' | 'active';
const MODES: Mode[] = ['wait', 'active'];

function engineOptions(mode: Mode) {
  return {
    abilities: abilityRegistryFrom(Object.values(data.ABILITIES)),
    items: itemRegistryFrom(Object.values(data.ITEMS)),
    dresspheres: dressphereRegistryFrom(Object.values(data.STANDARD_DRESSPHERES)),
    garmentGrids: garmentGridRegistryFrom(Object.values(data.GARMENT_GRIDS)),
    minigames: false as const,
    atbMode: mode,
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
  held: number;
  linksCleared: number;
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
    held: 0,
    linksCleared: 0,
  };
}

function scoreEvents(tally: Tally, log: readonly BattleEvent[], enemyIds: readonly string[]): void {
  for (const e of log) {
    if (e.type === 'ko') tally.kos += 1;
    if (e.type === 'action-start' && enemyIds.includes(e.actorId)) tally.enemyActions += 1;
  }
}

/** One link, driven with `decisionMs` of clock burned at every menu (Wait or Active per `mode`). */
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
      if (engine.heldCommand()) {
        tally.held += 1;
        tally.playerTurns += 1;
      } else {
        tally.refused += 1;
      }
      continue;
    }
    tally.playerTurns += 1;
  }

  scoreEvents(tally, engine.state().log.slice(from), enemyIds);
  tally.seconds += engine.state().ticks / 3000;
  return outcome;
}

function runChapter4(mode: Mode, seed: number, decisionMs: number): Tally {
  const tally = emptyTally();
  const engine = new FFX2Engine(engineOptions(mode));
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
  if (tally.outcome === 'victory') tally.linksCleared = 1;
  const state = engine.state();
  tally.aliveAtEnd = state.activeIds.filter((id) => state.combatants[id]?.alive).length;
  return tally;
}

function runChain(
  mode: Mode,
  chainOrder: readonly string[],
  party: FFX2PartyBuild,
  seed: number,
  decisionMs: number,
): Tally {
  const tally = emptyTally();
  const engine = new FFX2Engine(engineOptions(mode));
  const first = data.ENEMY_GROUPS_BY_ID[chainOrder[0]!];
  if (!first) throw new Error('chain formation missing');

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
    if (outcome === 'victory') tally.linksCleared += 1;
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

const runChapter5 = (mode: Mode, seed: number, decisionMs: number) =>
  runChain(mode, VEGNAGUN_CHAIN_ORDER, farplaneBuild, seed, decisionMs);
const runChapter6 = (mode: Mode, seed: number, decisionMs: number) =>
  runChain(mode, LEBLANC_CHAIN_ORDER, chateauBuild, seed, decisionMs);

function median(xs: number[]): number {
  const s = [...xs].sort((a, b) => a - b);
  return s.length === 0 ? 0 : (s[Math.floor((s.length - 1) / 2)]! + s[Math.ceil((s.length - 1) / 2)]!) / 2;
}

interface Row {
  chapter: string;
  mode: Mode;
  d: number;
  wins: number;
  medianS: number;
  worstS: number;
  invalidated: number;
  refused: number;
  held: number;
  kos: number;
}

function report(chapter: string, mode: Mode, run: (mode: Mode, seed: number, d: number) => Tally): Row[] {
  const rows: Row[] = [];
  for (const d of ARMS) {
    const runs = SEEDS.map((seed) => run(mode, seed, d));
    const secs = runs.map((r) => r.seconds);
    rows.push({
      chapter,
      mode,
      d,
      wins: runs.filter((r) => r.outcome === 'victory').length,
      medianS: median(secs),
      worstS: Math.max(...secs),
      invalidated: runs.reduce((a, r) => a + r.invalidated, 0),
      refused: runs.reduce((a, r) => a + r.refused, 0),
      held: runs.reduce((a, r) => a + r.held, 0),
      kos: runs.reduce((a, r) => a + r.kos, 0),
    });
  }
  return rows;
}

function printRows(rows: Row[]): void {
  console.log(
    '\nchapter | mode | D | wins | median s | worst s | menus invalidated | commands refused | commands held | total KOs',
  );
  for (const r of rows) {
    console.log(
      [r.chapter, r.mode, `${r.d} ms`, `${r.wins}/${SEEDS.length}`, r.medianS.toFixed(1), r.worstS.toFixed(1), r.invalidated, r.refused, r.held, r.kos].join(
        ' | ',
      ),
    );
  }
}

const allRows: Row[] = [];

describe.skipIf(!MEASURE)('Wait vs Active — chapters 4/5/6, forty seeds per arm (PYREFLY_MEASURE=1)', () => {
  for (const mode of MODES) {
    it(`Chapter 4 Bahamut, mode=${mode}`, () => {
      const rows = report('ch4 Bahamut', mode, runChapter4);
      printRows(rows);
      allRows.push(...rows);
      expect(true).toBe(true);
    }, 900_000);

    it(`Chapter 5 Vegnagun chain, mode=${mode}`, () => {
      const rows = report('ch5 Vegnagun', mode, runChapter5);
      printRows(rows);
      allRows.push(...rows);
      expect(true).toBe(true);
    }, 900_000);

    it(`Chapter 6 Leblanc mission, mode=${mode}`, () => {
      const rows = report('ch6 Leblanc', mode, runChapter6);
      printRows(rows);
      allRows.push(...rows);
      expect(true).toBe(true);
    }, 900_000);
  }

  it('write results-wait-vs-active.json', () => {
    const fs = require('node:fs') as typeof import('node:fs');
    const path = require('node:path') as typeof import('node:path');
    const out = path.join(__dirname, 'results-wait-vs-active.json');
    fs.writeFileSync(out, JSON.stringify(allRows, null, 2));
    expect(true).toBe(true);
  });
});

describe('the D = 0 Wait control still wins the same seeds Active wins', () => {
  it('Chapter 4, Wait, zero decision time, four canonical seeds', () => {
    for (const seed of [1, 7, 42, 20260916]) {
      const tally = runChapter4('wait', seed, 0);
      expect(tally.outcome, `seed ${seed}`).toBe('victory');
      expect(tally.invalidated).toBe(0);
      expect(tally.refused).toBe(0);
    }
  }, 120_000);
});
