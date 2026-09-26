/**
 * **Degenerate boards: the telegraphed re-kill in Chapter I** (critic round 13
 * PR-0131; CHK-005, advice stays useful on damaged boards).
 *
 * Round 9 followed the card through Chapter I and watched it chain Phoenix
 * Downs into immediate re-KOs: Yuna revived 7 times and KO'd again before she
 * acted after 6 of them. The refusal that answers it (`advisor-revive.ts#
 * reviveRisk`, fed by the board's own forecast, `advisor-forecast.ts`) is pinned
 * on its single board in `advisor-forecast.test.ts` ("holds the revive back from
 * a sweep nobody can stand outside of"). This file is the matrix half: forty
 * seeds of a card-follower, every revive it made, and how many of them were
 * wasted on a member who fell again before acting.
 *
 * Measured on this branch: 22 wins of 40; 196 revives, 42 re-KO'd before
 * acting (21 %). The bars below are the round's acceptance (at least 20 wins)
 * and a ceiling well under round 9's 6 in 7.
 *
 * **Game case: FFX only** (Chapter I; CTB, where "before she acts" is a turn
 * order the engine fixes).
 */

import { describe, expect, it } from 'vitest';
import type { Command } from '../../src/battle/common/types.ts';
import { harnessFor } from '../../critic/bench/advisor-v2/harness.ts';
import { buildAdvisorView, clearAdvisorCache } from '../../src/engine/tactics/advisor.ts';

interface Run {
  win: boolean;
  revives: number;
  rekills: number;
}

function follow(seed: number): Run {
  clearAdvisorCache();
  const { engine, options } = harnessFor('seymour-flux', seed);
  let outcome = '';
  for (let i = 0; i < 60_000; i++) {
    const d = engine.nextDecision();
    if (d.kind === 'battle-over') {
      outcome = String((d as { result?: { outcome?: string } }).result?.outcome);
      break;
    }
    if (d.kind !== 'player-input') continue;
    const top = buildAdvisorView(engine.state(), { actorId: d.actorId, commands: d.commands }, { ...options, planner: true })
      ?.suggestions[0]?.command;
    engine.submit(top ?? ({ kind: 'defend', targets: [] } as Command));
  }
  let revives = 0;
  let rekills = 0;
  const waiting = new Set<string>();
  for (const e of engine.state().log as Array<{ type: string; targetId?: string; actorId?: string }>) {
    if (e.type === 'revive' && e.targetId) {
      revives += 1;
      waiting.add(e.targetId);
    } else if (e.type === 'action-start' && e.actorId) waiting.delete(e.actorId);
    else if (e.type === 'ko' && e.targetId && waiting.has(e.targetId)) {
      rekills += 1;
      waiting.delete(e.targetId);
    }
  }
  return { win: outcome === 'victory', revives, rekills };
}

describe('Chapter I, forty seeds of the card (PR-0131)', () => {
  it('wins at least 20 and wastes few raises on a telegraphed re-kill', () => {
    const runs = Array.from({ length: 40 }, (_, i) => follow(i + 1));
    const wins = runs.filter((r) => r.win).length;
    const revives = runs.reduce((n, r) => n + r.revives, 0);
    const rekills = runs.reduce((n, r) => n + r.rekills, 0);
    console.log(`[PR-0131] card-follower wins ${wins}/40; ${rekills} of ${revives} raises re-KO'd before acting`);
    expect(wins).toBeGreaterThanOrEqual(20);
    expect(revives).toBeGreaterThan(0);
    expect(rekills / revives).toBeLessThan(0.3);
  }, 180_000);
});
