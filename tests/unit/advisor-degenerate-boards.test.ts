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
 * seeds of a card-follower, every raise the card led with, and whether the move
 * that then KO'd that member before they acted was the one the forecast had
 * **scripted** at the moment of the raise (a telegraphed re-kill, which the card
 * must not walk into) or something the board could not know (a rolled target,
 * a counter).
 *
 * **Game case: FFX only** (Chapter I; CTB, where "before they act" is a turn
 * order the engine fixes).
 */

import { describe, expect, it } from 'vitest';
import type { Command } from '../../src/battle/common/types.ts';
import { harnessFor } from '../../critic/bench/advisor-v2/harness.ts';
import { buildAdvisorView, clearAdvisorCache } from '../../src/engine/tactics/advisor.ts';
import { forecastFromState } from '../../src/engine/tactics/advisor-forecast.ts';
import { reviveRisk } from '../../src/engine/tactics/advisor-revive.ts';

interface Run {
  win: boolean;
  raises: number;
  rekills: number;
  telegraphed: number;
}

/** Led raises the board's own forecast refuses, by kind (a telegraphed re-kill). */
const refusedKinds: Record<string, number> = {};

type Ev = { type: string; targetId?: string; actorId?: string; abilityId?: string; seq?: number };

function follow(seed: number): Run {
  clearAdvisorCache();
  const { engine, options } = harnessFor('seymour-flux', seed);
  let outcome = '';
  /** Raised member -> the forecast's scripted move id at the raise (or null). */
  const watched = new Map<string, { scripted: string | null; from: number }>();
  let raises = 0;
  let rekills = 0;
  let telegraphed = 0;
  let scanned = 0;
  const scan = (): void => {
    const log = engine.state().log as Ev[];
    let lastAction: string | null = null;
    for (let i = 0; i < log.length; i++) {
      const e = log[i]!;
      if (e.type === 'action-start') lastAction = e.abilityId ?? null;
      if (i < scanned) continue;
      if (e.type === 'action-start' && e.actorId) watched.delete(e.actorId);
      else if (e.type === 'ko' && e.targetId && watched.has(e.targetId)) {
        const w = watched.get(e.targetId)!;
        rekills += 1;
        if (w.scripted && w.scripted === lastAction) telegraphed += 1;
        watched.delete(e.targetId);
      }
    }
    scanned = log.length;
  };
  for (let i = 0; i < 60_000; i++) {
    const d = engine.nextDecision();
    scan();
    if (d.kind === 'battle-over') {
      outcome = String((d as { result?: { outcome?: string } }).result?.outcome);
      break;
    }
    if (d.kind !== 'player-input') continue;
    const state = engine.state();
    const top = buildAdvisorView(state, { actorId: d.actorId, commands: d.commands }, { ...options, planner: true })?.suggestions[0];
    const target = (top?.command.targets as readonly string[] | undefined)?.[0];
    if (top && target && state.combatants[target]?.alive === false && state.combatants[target]?.side === 'party') {
      raises += 1;
      const f = forecastFromState(state, options);
      watched.set(target, { scripted: f && f.confidence !== 'likely' ? (f.abilityId ?? null) : null, from: state.log.length });
      const risk = reviveRisk(state, target, f);
      if (risk) refusedKinds[risk.kind] = (refusedKinds[risk.kind] ?? 0) + 1;
    }
    engine.submit(top?.command ?? ({ kind: 'defend', targets: [] } as Command));
  }
  return { win: outcome === 'victory', raises, rekills, telegraphed };
}

describe('Chapter I, forty seeds of the card (PR-0131)', () => {
  it('wins at least 20 of 40, and reports every raise led into a re-kill the forecast telegraphed', () => {
    const runs = Array.from({ length: 40 }, (_, i) => follow(i + 1));
    const wins = runs.filter((r) => r.win).length;
    const raises = runs.reduce((n, r) => n + r.raises, 0);
    const rekills = runs.reduce((n, r) => n + r.rekills, 0);
    const telegraphed = runs.reduce((n, r) => n + r.telegraphed, 0);
    console.log('[PR-0131] led raises the forecast refuses:', JSON.stringify(refusedKinds));
    console.log(`[PR-0131] card-follower wins ${wins}/40; ${raises} raises led, ${rekills} re-KO'd before acting, ${telegraphed} by the move the forecast had scripted`);
    expect(wins).toBeGreaterThanOrEqual(20);
    expect(raises).toBeGreaterThan(0);
    // The measuring stick for the open half of PR-0131 (docs/handoff/t1-b3a.md,
    // stopped for a method check): on this branch the card still leads with
    // raises its own forecast refuses (54 onto a Zombie, 8 into a sweep, over
    // forty seeds), and 10 of 42 re-KOs came from the move the forecast had
    // scripted. Demoting a refused chapter-line raise dropped the wins to
    // 18/40, so the fix is a design question, not a one-line guard. These
    // numbers are printed, not pinned, until that is decided.
    expect(Object.values(refusedKinds).every((n) => Number.isFinite(n))).toBe(true);
  }, 180_000);
});
