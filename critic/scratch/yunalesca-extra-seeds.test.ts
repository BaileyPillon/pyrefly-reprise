/**
 * VERIFY pass — robustness of the SHIPPED `intendedStrategy` at Chapter 2
 * (Yunalesca) on eight seeds the fix round did NOT gate on.
 *
 * Written independently by the verifying session on 2026-09-17. The harness is
 * a deliberate re-derivation of `runIntended` in
 * `tests/unit/strategy-chapter2.test.ts`: same content registry, same shipped
 * `zanarkandBuild`, same shipped `yunalesca` enemy group, same shipped
 * `intendedStrategy` from `src/engine/BattlePresenterStrategies.ts`, and a
 * plain Attack ONLY when the strategy declines to act. Nothing is substituted,
 * no inventory is raised, no build is patched, no seed is special-cased.
 *
 * Seeds: 2, 3, 5, 11, 13, 99, 1234, 7777. The gate set is {1, 7, 42,
 * 20260916}, so none of these eight is a seed the fix was measured against by
 * name.
 *
 * Extra instrumentation beyond the gate test:
 *   - `turns`       — player-input decisions only (the fix report's "turns");
 *                     `decisions` counts every loop iteration.
 *   - `consumables` — every `kind: 'item'` command actually submitted, tallied
 *                     per item id. There is no item-consumed log event, so
 *                     counting submitted commands is the only direct measure;
 *                     it counts intent, and the per-item breakdown is printed
 *                     so an engine refusal would be visible.
 *   - loss forensics — for any seed that does not win: the form she died in,
 *                     her remaining HP, the unanswered party KOs and what
 *                     caused each, and the tail of the ability trail.
 *
 * Run (root vitest.config.ts only includes tests/unit, so override the config;
 * vitest.config.ts is NOT edited):
 *   npx vitest run --config critic/scratch/vitest.scratch.config.ts \
 *     critic/scratch/yunalesca-extra-seeds.test.ts --reporter=verbose --silent=false
 */

import { describe, expect, it } from 'vitest';
import type { Command, Decision } from '../../src/battle/common/types.ts';
import { FFXContentRegistry, createFFXEngine } from '../../src/battle/ffx/index.ts';
import { ALL_ABILITIES, ENEMY_GROUPS_BY_ID, ITEMS } from '../../src/data/ffx/index.ts';
import { zanarkandBuild } from '../../src/data/ffx/builds/zanarkand.ts';
import { intendedStrategy } from '../../src/engine/BattlePresenterStrategies.ts';

const MAX_DECISIONS = 30_000;

const SEEDS = [2, 3, 5, 11, 13, 99, 1234, 7777];

function newEngine(seed: number) {
  const content = new FFXContentRegistry();
  content.addAbilities(ALL_ABILITIES);
  content.addItems(Object.values(ITEMS));
  const group = ENEMY_GROUPS_BY_ID['yunalesca'];
  if (!group) throw new Error('yunalesca group missing from the data layer');
  const engine = createFFXEngine({ content, autoResolveMinigames: true });
  engine.init({
    game: 'ffx',
    party: zanarkandBuild,
    enemies: group,
    triggers: [],
    seed,
    condition: 'normal',
    canEscape: false,
  });
  return engine;
}

/** Plain Attack on the first valid target — used ONLY when the strategy declines. */
function attack(d: Extract<Decision, { kind: 'player-input' }>): Command {
  const row = d.commands.find((c) => c.command.kind === 'attack' && c.enabled);
  const target = row?.validTargets[0];
  return { kind: 'attack', targets: target ? [target] : [] };
}

interface Loss {
  diedInForm: number;
  herHpLeft: number | undefined;
  herFormMaxHp: number | undefined;
  unansweredKos: { who: string; by: string }[];
  lastKos: { who: string; by: string }[];
  tail: string[];
}

interface Run {
  seed: number;
  outcome: string | undefined;
  turns: number;
  decisions: number;
  formsReached: number;
  consumables: number;
  items: Record<string, number>;
  summons: number;
  strategyDeclined: number;
  herHp: number | undefined;
  partyKos: number;
  loss?: Loss;
}

function runIntended(seed: number): Run {
  const engine = newEngine(seed);
  const run: Run = {
    seed,
    outcome: undefined,
    turns: 0,
    decisions: 0,
    formsReached: 1,
    consumables: 0,
    items: {},
    summons: 0,
    strategyDeclined: 0,
    herHp: undefined,
    partyKos: 0,
  };

  for (let i = 0; i < MAX_DECISIONS; i++) {
    run.decisions++;
    const d = engine.nextDecision();
    if (d.kind === 'battle-over') {
      run.outcome = d.result.outcome;
      break;
    }
    if (d.kind !== 'player-input') continue;
    run.turns++;
    const picked = intendedStrategy(d.actorId, d.commands, engine);
    if (!picked) run.strategyDeclined++;
    const chosen = picked ?? attack(d);
    if (chosen.kind === 'item') {
      run.consumables++;
      run.items[chosen.id] = (run.items[chosen.id] ?? 0) + 1;
    }
    engine.submit(chosen);
  }

  const state = engine.state();
  const partyIds = new Set(zanarkandBuild.members.map((m) => m.id));

  let lastAbility = 'attack';
  const trail: string[] = [];
  const allKos: { who: string; by: string }[] = [];
  const koCount = new Map<string, number>();
  const reviveCount = new Map<string, number>();

  for (const e of state.log) {
    if (e.type === 'action-start') {
      lastAbility = String((e as { abilityId?: unknown }).abilityId ?? 'attack');
      trail.push(`${String((e as { actorId?: unknown }).actorId ?? '?')}:${lastAbility}`);
    }
    if (e.type === 'form-change' && e.enemyId === 'yunalesca') {
      run.formsReached = Math.max(run.formsReached, e.formIndex + 1);
    }
    if (e.type === 'summon') run.summons++;
    if (e.type === 'ko' && partyIds.has(e.targetId)) {
      allKos.push({ who: e.targetId, by: lastAbility });
      koCount.set(e.targetId, (koCount.get(e.targetId) ?? 0) + 1);
    }
    if (e.type === 'revive' && partyIds.has(e.targetId)) {
      reviveCount.set(e.targetId, (reviveCount.get(e.targetId) ?? 0) + 1);
    }
  }

  run.partyKos = allKos.length;
  run.herHp = state.combatants['yunalesca']?.hp;

  if (run.outcome !== 'victory') {
    run.loss = {
      diedInForm: run.formsReached,
      herHpLeft: run.herHp,
      herFormMaxHp: state.combatants['yunalesca']?.stats.maxHp,
      unansweredKos: allKos
        .filter((k) => (koCount.get(k.who) ?? 0) > (reviveCount.get(k.who) ?? 0))
        .slice(-6),
      lastKos: allKos.slice(-12),
      tail: trail.slice(-30),
    };
  }
  return run;
}

const avg = (xs: number[]): number =>
  xs.length ? +(xs.reduce((a, b) => a + b, 0) / xs.length).toFixed(2) : 0;

describe('intendedStrategy robustness on eight untuned seeds', () => {
  it('wins at least 7 of 8, and walks all three forms on every one', () => {
    const runs = SEEDS.map(runIntended);
    for (const r of runs) console.log(`SEED ${r.seed}: ${JSON.stringify(r)}`);

    const wins = runs.filter((r) => r.outcome === 'victory');
    const losses = runs.filter((r) => r.outcome !== 'victory');

    const itemTotals: Record<string, number> = {};
    for (const r of runs) for (const [k, v] of Object.entries(r.items)) itemTotals[k] = (itemTotals[k] ?? 0) + v;

    console.log(
      'AGGREGATE: ' +
        JSON.stringify(
          {
            wins: wins.length,
            of: runs.length,
            avgTurnsAll: avg(runs.map((r) => r.turns)),
            avgTurnsWins: avg(wins.map((r) => r.turns)),
            avgDecisionsAll: avg(runs.map((r) => r.decisions)),
            avgConsumablesAll: avg(runs.map((r) => r.consumables)),
            avgConsumablesWins: avg(wins.map((r) => r.consumables)),
            avgSummons: avg(runs.map((r) => r.summons)),
            avgPartyKos: avg(runs.map((r) => r.partyKos)),
            itemTotals,
            perSeed: runs.map((r) => ({
              seed: r.seed,
              outcome: r.outcome,
              form: r.formsReached,
              turns: r.turns,
              consumables: r.consumables,
              summons: r.summons,
              herHp: r.herHp,
            })),
            losses: losses.map((r) => ({ seed: r.seed, ...r.loss })),
          },
          null,
          1,
        ),
    );

    for (const r of runs) {
      expect(r.decisions, `seed ${r.seed} must reach a decision, not spin`).toBeLessThan(MAX_DECISIONS);
      expect(r.outcome, `seed ${r.seed} must end`).toBeDefined();
      expect(r.formsReached, `seed ${r.seed} must walk all three of her forms`).toBe(3);
    }

    expect(
      wins.length,
      `at least 7 of 8 untuned seeds must end in victory; losses: ${JSON.stringify(
        losses.map((r) => ({ seed: r.seed, ...r.loss })),
      )}`,
    ).toBeGreaterThanOrEqual(7);
  });
});
