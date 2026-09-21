/**
 * `learn/studio/trace.ts` — the real FFX engine, run for site B's "One Turn"
 * specimen. Every assertion here re-derives its expectation from an
 * independent, from-scratch engine call rather than a hard-coded literal, per
 * the task brief: a trace's numbers are only as good as the engine that
 * produced them (AGENTS.md hard rule 3).
 */

import { describe, expect, it } from 'vitest';
import { runExampleTurn, type TurnStep, type TurnTrace } from '../../learn/studio/trace.ts';
import { FFXContentRegistry, createFFXEngine } from '../../src/battle/ffx/index.ts';
import { ALL_ABILITIES, ENEMY_GROUPS_BY_ID, ITEMS, gagazetBuild } from '../../src/data/ffx/index.ts';
import type { BattleEvent, Decision, FFXPartyBuild } from '../../src/battle/common/types.ts';

function registry(): FFXContentRegistry {
  const reg = new FFXContentRegistry();
  reg.addAbilities(ALL_ABILITIES);
  reg.addItems(Object.values(ITEMS));
  return reg;
}

/** A from-scratch engine, opened the same way `runExampleTurn` opens it, independent of `trace.ts`'s own code. */
function directEngineRun(seed: number, agility?: number) {
  const party: FFXPartyBuild = structuredClone(gagazetBuild);
  if (agility !== undefined) {
    const tidus = party.members.find((m) => m.id === 'tidus');
    if (!tidus) throw new Error('directEngineRun: chapter 1 build has no "tidus" member');
    tidus.stats.agi = agility;
  }
  const enemies = ENEMY_GROUPS_BY_ID['seymour-flux'];
  if (!enemies) throw new Error('directEngineRun: no "seymour-flux" enemy group');

  const engine = createFFXEngine({ content: registry(), autoResolveMinigames: true });
  engine.init({ game: 'ffx', party, enemies, triggers: [], seed, condition: 'normal', canEscape: false });

  let decision: Decision = engine.nextDecision();
  let guard = 0;
  while (decision.kind === 'resolved' && guard < 40) {
    guard += 1;
    decision = engine.nextDecision();
  }
  if (decision.kind !== 'player-input') throw new Error('directEngineRun: no player turn opened');
  return { engine, decision };
}

function stepOf<T extends TurnStep['component']>(trace: TurnTrace, component: T): Extract<TurnStep, { component: T }> {
  const step = trace.steps.find((s): s is Extract<TurnStep, { component: T }> => s.component === component);
  if (!step) throw new Error(`stepOf: trace has no "${component}" step`);
  return step;
}

function orderKey(rows: readonly { readonly actorId: string; readonly tick: number }[]): string {
  return rows.map((r) => `${r.actorId}@${r.tick}`).join('  ');
}

describe('runExampleTurn: determinism', () => {
  it('gives an identical trace for the same seed', () => {
    const a = runExampleTurn({ seed: 1 });
    const b = runExampleTurn({ seed: 1 });
    expect(a).toEqual(b);
  });
});

describe('runExampleTurn: matches a direct engine call', () => {
  it('opens on the same actor as a from-scratch engine at seed 1', () => {
    const trace = runExampleTurn({ seed: 1 });
    const { decision } = directEngineRun(1);
    expect(trace.actorId).toBe(decision.actorId);
  });

  it("the turn-order step's before/after lists equal the engine's own forecast", () => {
    const trace = runExampleTurn({ seed: 1 });
    const turnStep = stepOf(trace, 'turn');
    const { engine, decision } = directEngineRun(1);

    const directBefore = engine.predictTurnOrder(10).map((r) => ({ actorId: r.actorId, tick: r.tickValue }));
    expect(orderKey(turnStep.before)).toBe(orderKey(directBefore));

    const attackRow = decision.commands.find((row) => row.command.kind === 'attack');
    if (!attackRow) throw new Error('no Attack command available');
    const targetId = attackRow.validTargets[0];
    if (!targetId) throw new Error('Attack has no legal target');
    engine.submit({ kind: 'attack', targets: [targetId] });

    const directAfter = engine.predictTurnOrder(8).map((r) => ({ actorId: r.actorId, tick: r.tickValue }));
    expect(orderKey(turnStep.after)).toBe(orderKey(directAfter));
  });

  it('the damage step equals the damage a direct submit of the same Attack produces', () => {
    const trace = runExampleTurn({ seed: 1 });
    const damageStep = stepOf(trace, 'damage');
    const { engine } = directEngineRun(1);

    const events = engine.submit({ kind: 'attack', targets: [trace.targetId] });
    const damageEvent = events.find(
      (e): e is Extract<BattleEvent, { type: 'damage' }> => e.type === 'damage' && e.targetId === trace.targetId,
    );
    if (!damageEvent) throw new Error('direct submit produced no damage event');

    expect(damageStep.amount).toBe(damageEvent.amount);
    expect(damageStep.targetHpAfter).toBe(engine.state().combatants[trace.targetId]?.hp);
    expect(damageStep.targetHpBefore - damageStep.amount).toBe(damageStep.targetHpAfter);
  });
});

describe('runExampleTurn: the Agility override', () => {
  it('changes the turn list exactly as a direct engine run with the same override', () => {
    const overriddenAgility = 10;
    const trace = runExampleTurn({ seed: 1, agility: overriddenAgility });
    const turnStep = stepOf(trace, 'turn');
    const { engine, decision } = directEngineRun(1, overriddenAgility);

    expect(trace.actorId).toBe(decision.actorId);
    const directBefore = engine.predictTurnOrder(10).map((r) => ({ actorId: r.actorId, tick: r.tickValue }));
    expect(orderKey(turnStep.before)).toBe(orderKey(directBefore));

    // And it is a real change, not a coincidence: the default build's turn list differs.
    const baseline = runExampleTurn({ seed: 1 });
    expect(orderKey(turnStep.before)).not.toBe(orderKey(stepOf(baseline, 'turn').before));
  });
});

describe('runExampleTurn: every step cites its rule', () => {
  it('has a non-empty cite on every one of the eight steps', () => {
    const trace = runExampleTurn({ seed: 1 });
    expect(trace.steps).toHaveLength(8);
    for (const step of trace.steps) {
      expect(step.cite.trim().length).toBeGreaterThan(0);
    }
  });
});
