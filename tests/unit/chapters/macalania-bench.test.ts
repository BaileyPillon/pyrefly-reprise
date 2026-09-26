/**
 * **Chapter VII — Seymour and Anima, Macalania Temple: the seeded bench.**
 * Win rates over 200 seeds for the chapter's lines on the real engine, the
 * real data and the shipped Macalania build (`src/data/ffx/builds/macalania.ts`),
 * headless (no DOM, no `three`; hard rule 1).
 *
 * **Measure, never tune** (the `boss-side-fix-needs-measured-options` rule,
 * AGENTS.md rule 6). This file pins only that every battle ends and that the
 * lines are reproducible; it pins no target rate. The numbers it prints are
 * written up in `docs/plans/macalania-bench.md`. Nothing on the boss side was
 * changed to move them.
 *
 * With `PYREFLY_MEASURE=1` it runs 200 seeds a line and prints one JSON line
 * per row; by default it is a 10-seed smoke, so the full suite stays fast.
 *
 * The lines:
 * - **intended** — the shipped tactic (`tacticFor` resolves
 *   `seymourAnimaMacalania` for this group), exactly what
 *   `__pyrefly.autoBattle('intended')` plays: Steal from both Guardians,
 *   Haste and Cheer in act one, the summon for act two, the Nul spell for the
 *   element Seymour casts next in act three (research §7 rows 1, 5, 10, 11).
 * - **advisor** — the move-advisor card's top row, pressed every turn and
 *   nothing else (a decline falls back to the first legal command), the same
 *   driver as `critic/bench/advisor-v2`. This is the nearest headless stand-in
 *   for a first-time player who follows the card.
 * - **mistake** — A-2's credible mistake (`strategy-macalania.test.ts`): no
 *   Steal, no summon, no Nul; plain Attack on the first legal target.
 *
 * **Game case: FFX only** [AGENTS.md rule 14]: CTB, an FFX party and an FFX
 * boss; no FFX-2 file is read.
 */

import { describe, expect, it } from 'vitest';
import type { Command, Decision } from '../../../src/battle/common/types.ts';
import { FFXContentRegistry, createFFXEngine } from '../../../src/battle/ffx/index.ts';
import { ALL_ABILITIES, ENEMY_GROUPS_BY_ID, ITEMS } from '../../../src/data/ffx/index.ts';
import { SEYMOUR_ANIMA_MACALANIA } from '../../../src/data/chapter-seymour-anima-macalania.ts';
import { intendedStrategy } from '../../../src/engine/BattlePresenterStrategies.ts';
import { buildAdvisorView } from '../../../src/engine/tactics/advisor.ts';
import { activeParty, has } from '../../../src/engine/tactics/common.ts';

const MEASURE = process.env['PYREFLY_MEASURE'] === '1';
const SEEDS = Array.from({ length: MEASURE ? 200 : 10 }, (_, i) => i + 1);
const MAX_DECISIONS = 60_000;

type Line = 'intended' | 'advisor' | 'mistake';
type PlayerInput = Extract<Decision, { kind: 'player-input' }>;

const content = new FFXContentRegistry();
content.addAbilities(ALL_ABILITIES);
content.addItems(Object.values(ITEMS));

function newEngine(seed: number) {
  const group = ENEMY_GROUPS_BY_ID[SEYMOUR_ANIMA_MACALANIA.enemyGroupRef.id];
  if (!group) throw new Error('the Macalania group is missing from the FFX data layer');
  const engine = createFFXEngine({ content, autoResolveMinigames: true });
  engine.init({
    game: 'ffx',
    party: SEYMOUR_ANIMA_MACALANIA.buildRef,
    enemies: group,
    triggers: [],
    seed,
    condition: 'normal',
    canEscape: false,
  });
  return engine;
}

/** Plain Attack on the first legal target (the mistake line's only move). */
function attack(d: PlayerInput): Command {
  const r = d.commands.find((c) => c.command.kind === 'attack' && c.enabled);
  const t = r?.validTargets[0];
  return { kind: 'attack', targets: t ? [t] : [] };
}

/** The first legal command, so no driver can stall the engine. */
function fallback(d: PlayerInput): Command {
  const r = d.commands.find((c) => c.enabled && c.validTargets.length > 0);
  if (!r) return attack(d);
  const t = r.validTargets[0];
  return { ...r.command, targets: t ? [t] : [] } as Command;
}

export interface MacalaniaRun {
  seed: number;
  outcome: string;
  /** `macalania.act` when the battle ended (1 Guardians, 2 Anima, 3 Seymour alone). */
  act: number;
  decisions: number;
  declines: number;
}

function run(seed: number, line: Line): MacalaniaRun {
  const engine = newEngine(seed);
  let outcome = 'unresolved';
  let decisions = 0;
  let declines = 0;
  for (let i = 0; i < MAX_DECISIONS; i += 1) {
    const d = engine.nextDecision();
    if (d.kind === 'battle-over') {
      outcome = d.result.outcome;
      break;
    }
    if (d.kind !== 'player-input') continue;
    decisions += 1;
    let chosen: Command | null = null;
    if (line === 'intended') {
      chosen = intendedStrategy(d.actorId, d.commands, engine);
    } else if (line === 'advisor') {
      const view = buildAdvisorView(engine.state(), { actorId: d.actorId, commands: d.commands }, {
        ffxContent: content,
        planner: true,
      });
      chosen = view?.suggestions[0]?.command ?? null;
      if (!chosen) declines += 1;
    } else {
      chosen = attack(d);
    }
    engine.submit(chosen ?? fallback(d));
  }
  const flags = engine.state().flags;
  const act = typeof flags['macalania.act'] === 'number' ? (flags['macalania.act'] as number) : 1;
  return { seed, outcome, act, decisions, declines };
}

interface Row {
  line: Line;
  seeds: number;
  wins: number;
  winRate: number;
  lossesByAct: Record<string, number>;
  unresolved: number;
  medianDecisions: number;
  declines: number;
  lostSeeds: number[];
}

function median(xs: readonly number[]): number {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length === 0 ? 0 : s.length % 2 ? s[m]! : (s[m - 1]! + s[m]!) / 2;
}

function measure(line: Line): Row {
  const runs = SEEDS.map((seed) => run(seed, line));
  const lost = runs.filter((r) => r.outcome !== 'victory');
  const lossesByAct: Record<string, number> = {};
  for (const r of lost) lossesByAct[`act${r.act}`] = (lossesByAct[`act${r.act}`] ?? 0) + 1;
  const wins = runs.length - lost.length;
  return {
    line,
    seeds: runs.length,
    wins,
    winRate: Math.round((wins / runs.length) * 1000) / 10,
    lossesByAct,
    unresolved: runs.filter((r) => r.outcome === 'unresolved').length,
    medianDecisions: median(runs.map((r) => r.decisions)),
    declines: runs.reduce((a, r) => a + r.declines, 0),
    lostSeeds: lost.map((r) => r.seed),
  };
}

describe(`Chapter VII Macalania bench (${SEEDS.length} seeds a line; measured, not tuned)`, () => {
  for (const line of ['intended', 'advisor', 'mistake'] as const) {
    it(
      `${line}: every run ends`,
      () => {
        const row = measure(line);
        // eslint-disable-next-line no-console
        console.log(`MACALANIA_BENCH ${JSON.stringify(row)}`);
        expect(row.unresolved).toBe(0);
        expect(row.seeds).toBe(SEEDS.length);
      },
      30 * 60_000,
    );
  }

  it('the intended line is reproducible: the same seed plays the same battle', () => {
    const a = run(7, 'intended');
    const b = run(7, 'intended');
    expect(b).toEqual(a);
  });

  it('the intended line answers Shremedy: a confused ally gets a Remedy (§2.3, §8.7)', () => {
    let checked = 0;
    for (let seed = 1; seed <= 40 && checked === 0; seed += 1) {
      const engine = newEngine(seed);
      for (let i = 0; i < MAX_DECISIONS; i += 1) {
        const d = engine.nextDecision();
        if (d.kind === 'battle-over') break;
        if (d.kind !== 'player-input') continue;
        const party = activeParty(engine);
        const confused = party.find((c) => c.alive && c.id !== d.actorId && has(c, 'confuse'));
        const hasRemedy = d.commands.some((c) => c.enabled && c.command.kind === 'item' && c.command.id === 'remedy');
        const chosen = intendedStrategy(d.actorId, d.commands, engine);
        // Only the rules above 1b can outrank it: the act-two summon and a revive.
        if (confused && hasRemedy && engine.state().aeonId === null && party.every((c) => c.alive)) {
          expect(chosen).toMatchObject({ kind: 'item', id: 'remedy', targets: [confused.id] });
          checked += 1;
          break;
        }
        engine.submit(chosen ?? fallback(d));
      }
    }
    expect(checked).toBe(1);
  });
});
