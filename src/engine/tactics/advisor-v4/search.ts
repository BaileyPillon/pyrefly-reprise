/**
 * **Advisor v4: look-ahead by Monte Carlo rollouts, on top of v3.**
 *
 * One decision:
 *
 *  1. v3's card is computed exactly as the live HUD computes it; its top row is the **default**.
 *  2. If v3's top row carries the proved `saves-from-lethal` fact (Bailey's 2026-09-21 rule), or
 *     raises a fallen ally (v3's revive priority), it stands; no search.
 *  3. The candidates (`./candidates.ts`: v3's rows, the chapter's line, the best few ranked rows,
 *     all through the rails) are each pressed on `samples` forks of the live battle, the same fork
 *     seeds for every candidate (common random numbers), and played on with the chapter's line for
 *     `horizon` decisions or to the end of the **chapter**: a won link carries into the next one
 *     exactly as the screen carries it (`./rollout.ts`, `./value.ts`). Valuing a won link as a won
 *     chapter is what lost the chains (II, III, V) in the first measurement; `linkOnly` keeps it
 *     as an ablation.
 *  4. **Rollout policy improvement, made conservative**: the best candidate replaces v3's top row
 *     only when its mean value beats the default's by `margin` **and** it does clearly better than
 *     the default in more of the paired futures than it does clearly worse; then it must hold on
 *     `confirm` fresh futures (pooled, by `confirmGap`). Otherwise v3's card stands. Without the
 *     confirmation, one lost future in eight moved the card (Chapter II, measured).
 *
 * Optionally in two stages (`stage1`): every candidate on a few short futures first, then only the
 * best `keep` and the default on the full sample; the budget goes where the question is open.
 *
 * Bounded by counts (samples, horizon, candidates), never by a clock, so the same board always
 * gets the same answer. Never the real battle [AGENTS.md rule 1].
 *
 * **A generator** (`searchSteps`): it yields after every simulated future, so the Web Worker that
 * runs it in the game (`src/app/advisorV4/`) can take a cancel or stop at its time cap between two
 * futures; the answer does not depend on where it paused. `searchDecision` runs it to the end in
 * one go (the scorecard, tests).
 *
 * Moved from the prototype (`critic/bench/advisor-v4/search.ts`, which re-exports it).
 *
 * Game case: **both** (FFX's forks advance turn by turn in CTB order; FFX-2's run the ATB clock at
 * the house human pace). In the game it is switched on for FFX only (`./switch.ts`).
 */

import type { BattleState, Command } from '../../../battle/common/types.ts';
import type { AdvisorOptions, AdvisorView } from '../advisor.ts';
import { forecastFromState } from '../advisor-forecast.ts';
import { raceHolds } from '../advisor-race.ts';
import { candidatesFor, type Candidate, type Origin } from './candidates.ts';
import { linePolicy, rollout, type Chain, type Forkable, type Input } from './rollout.ts';
import { DEFAULT_WEIGHTS, type ValueWeights } from './value.ts';

export interface SearchConfig {
  /** Futures per candidate (fixed seeds). */
  samples: number;
  /** Line decisions after the candidate before the leaf is valued. */
  horizon: number;
  /** Ranked rows added to v3's card and the line. */
  extra: number;
  /** How much better (mean value, 0..1) a challenger must be to replace v3's top row. */
  margin: number;
  /** Optional first pass: `samples`/`horizon` for every candidate, then the best `keep` go on. */
  stage1?: { samples: number; horizon: number; keep: number };
  weights?: ValueWeights;
  /** Ablation only: the same fixed fork seeds at every decision (v3's lethal test's choice). */
  fixedSeeds?: boolean;
  /** Ablation only: value a won link as a won chapter (the chain after it is not played). */
  linkOnly?: boolean;
  /**
   * Confirmation: when a challenger wins the first pass, it and the default are pressed on this
   * many fresh futures, and the rule is applied again to the pooled futures with `confirmGap`.
   */
  confirm?: number;
  /** Pooled futures the challenger must clearly win more of than it clearly loses (default 2). */
  confirmGap?: number;
  /** A future is "clearly" better or worse only past this difference in value (default 0.05). */
  tolerance?: number;
  /** Ablation only: the argmax of the means, no paired test (the v3 method check's naive search C). */
  primary?: boolean;
  /** Rails that can be measured off (both default on). */
  rails?: { keepRaise?: boolean };
}

export const CEILING: SearchConfig = { samples: 8, horizon: 400, extra: 4, margin: 0.04, confirm: 16, confirmGap: 2 };

export interface SearchResult {
  command: Command | null;
  /** True when the search replaced v3's top row. */
  switched: boolean;
  searched: boolean;
  origin: Origin | 'v3';
  /** Simulated player decisions spent (the cost the ms follow). */
  simDecisions: number;
  candidates: number;
  /** Every candidate searched, with its futures' values (the audit trail; not shown). */
  table?: Array<{ command: Command; origin: Origin; values: number[] }>;
  /** Why the default stood, when it did without a search. */
  skipped?: 'no-card' | 'lethal-save' | 'one-candidate' | 'raise' | 'race';
}

/**
 * The futures' seeds: derived from the board, so the same board always gets the same answer, but a
 * new board gets new futures. Fixed seeds for every decision (v3's lethal test does that, over one
 * move) would replay the same few lucky or unlucky streams across a whole fight.
 */
function seedsFor(state: Readonly<BattleState>, n: number, fixed: boolean): number[] {
  let h = fixed ? 0x4a11_0000 : 2166136261;
  if (!fixed) {
    const mix = (x: number): void => {
      h = Math.imul(h ^ (x >>> 0), 16777619) >>> 0;
    };
    mix(state.turn);
    mix(state.ticks);
    for (const id of Object.keys(state.combatants).sort()) {
      const c = state.combatants[id]!;
      mix(c.hp);
      mix(c.mp);
      mix(c.alive === false ? 1 : 2);
    }
  }
  return Array.from({ length: n }, (_, j) => (h + 7919 * (j + 1)) >>> 0);
}

interface Scored { cand: Candidate; values: number[] }

function mean(xs: readonly number[]): number {
  return xs.length > 0 ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
}

function* evaluateCandidates(
  engine: Forkable,
  state: Readonly<BattleState>,
  actorId: string,
  cands: readonly Candidate[],
  samples: number,
  horizon: number,
  weights: ValueWeights,
  cost: { n: number },
  chain: Chain | null,
  seeds: readonly number[],
  offset = 0,
): Generator<void, Scored[], void> {
  const out: Scored[] = [];
  for (const cand of cands) {
    const values: number[] = [];
    let refused = false;
    for (let j = 0; j < samples; j++) {
      const sampleSeed = seeds[(offset + j) % seeds.length]!;
      const fork = engine.fork(sampleSeed);
      const f = rollout(fork, state, actorId, cand.command, { horizon, weights, chain, sampleSeed });
      cost.n += f.decisions + 1;
      yield;
      if (!f.pressed) {
        refused = true;
        break;
      }
      values.push(f.value);
    }
    if (!refused) out.push({ cand, values });
  }
  return out;
}

/** v4's pick for one decision, given the v3 card the HUD would show, run to the end in one go. */
export function searchDecision(
  engine: Forkable,
  state: Readonly<BattleState>,
  d: Input,
  view: AdvisorView | null,
  opt: AdvisorOptions,
  cfg: SearchConfig,
  chainIn: Chain | null = null,
): SearchResult {
  const it = searchSteps(engine, state, d, view, opt, cfg, chainIn);
  for (;;) {
    const r = it.next();
    if (r.done) return r.value;
  }
}

/** The same search, one simulated future per step (the worker pauses between steps). */
export function* searchSteps(
  engine: Forkable,
  state: Readonly<BattleState>,
  d: Input,
  view: AdvisorView | null,
  opt: AdvisorOptions,
  cfg: SearchConfig,
  chainIn: Chain | null = null,
): Generator<void, SearchResult, void> {
  const chain = cfg.linkOnly ? null : chainIn;
  const top = view?.suggestions[0];
  const base: SearchResult = { command: top?.command ?? null, switched: false, searched: false, origin: 'v3', simDecisions: 0, candidates: 0 };
  if (!top) return { ...base, skipped: 'no-card' };
  if ((top.facts ?? []).some((f) => f.kind === 'saves-from-lethal')) return { ...base, skipped: 'lethal-save' };
  const intent = forecastFromState(state, opt);
  const line = linePolicy(engine, d);
  const { list } = candidatesFor(state, d, view, line, opt, intent, cfg.extra);
  if (list.length < 2) return { ...base, candidates: list.length, skipped: 'one-candidate' };
  // v3's revive priority stands: a raise on top is Bailey's ask (the Sisters' White Mage), not a
  // question for the search (rail; `rails.keepRaise: false` measures it off).
  if (cfg.rails?.keepRaise !== false && list[0]!.origin === 'v3-top' && (list[0]!.outcome?.revives.length ?? 0) > 0) {
    return { ...base, candidates: list.length, skipped: 'raise' };
  }
  // PR-0269: on Overdrive Sin's clock a stable party's damage, Break, Overdrive or switch stands (`../advisor-race.ts`).
  if (raceHolds(state, list[0]!.command, list[0]!.outcome, intent)) return { ...base, candidates: list.length, skipped: 'race' };
  const weights = cfg.weights ?? DEFAULT_WEIGHTS;
  const cost = { n: 0 };
  const seeds = seedsFor(state, Math.max(cfg.samples + (cfg.confirm ?? 0), cfg.stage1?.samples ?? 0), cfg.fixedSeeds === true);
  let pool: readonly Candidate[] = list;
  if (cfg.stage1) {
    const first = yield* evaluateCandidates(engine, state, d.actorId, pool, cfg.stage1.samples, cfg.stage1.horizon, weights, cost, chain, seeds);
    const def = first.find((s) => s.cand === list[0]);
    const rest = first.filter((s) => s.cand !== list[0]).sort((a, b) => mean(b.values) - mean(a.values)).slice(0, cfg.stage1.keep);
    pool = [...(def ? [def.cand] : []), ...rest.map((s) => s.cand)];
    if (pool.length < 2) return { ...base, searched: true, simDecisions: cost.n, candidates: list.length };
  }
  const scored = yield* evaluateCandidates(engine, state, d.actorId, pool, cfg.samples, cfg.horizon, weights, cost, chain, seeds);
  const def = scored.find((s) => s.cand === list[0]);
  const table = scored.map((x) => ({ command: x.cand.command, origin: x.cand.origin, values: x.values }));
  const done = { ...base, searched: true, simDecisions: cost.n, candidates: list.length, table };
  if (!def) return done;
  let best: Scored | null = null;
  for (const s of scored) {
    if (s === def) continue;
    if (!best || mean(s.values) > mean(best.values)) best = s;
  }
  if (!best) return done;
  if (!prefers(best.values, def.values, cfg, cfg.primary === true)) return done;
  if (cfg.confirm && cfg.confirm > 0) {
    // A challenger that looks better on the first futures has to hold on as many again, fresh.
    const more = yield* evaluateCandidates(engine, state, d.actorId, [def.cand, best.cand], cfg.confirm, cfg.horizon, weights, cost, chain, seeds, cfg.samples);
    const defMore = more.find((x) => x.cand === def.cand);
    const bestMore = more.find((x) => x.cand === best!.cand);
    if (!defMore || !bestMore) return { ...done, simDecisions: cost.n };
    const pooledBest = [...best.values, ...bestMore.values];
    const pooledDef = [...def.values, ...defMore.values];
    if (!prefers(pooledBest, pooledDef, cfg, false, cfg.confirmGap ?? 2)) return { ...done, simDecisions: cost.n };
  }
  return { ...done, simDecisions: cost.n, command: best.cand.command, switched: true, origin: best.cand.origin };
}

/**
 * The switching rule: the challenger's mean beats the default's by `margin`, and it does
 * clearly better (by more than `tolerance`, so a slightly healthier win is not "better") in at
 * least `gap` more of the paired futures than it does clearly worse.
 */
function prefers(best: readonly number[], def: readonly number[], cfg: SearchConfig, primary: boolean, gap = 1): boolean {
  const gain = mean(best) - mean(def);
  if (primary) return gain > 0 && gain >= cfg.margin;
  const tol = cfg.tolerance ?? 0.05;
  let better = 0;
  let worse = 0;
  for (let j = 0; j < Math.min(best.length, def.length); j++) {
    if (best[j]! > def[j]! + tol) better += 1;
    else if (best[j]! < def[j]! - tol) worse += 1;
  }
  return gain >= cfg.margin && better - worse >= gap;
}
