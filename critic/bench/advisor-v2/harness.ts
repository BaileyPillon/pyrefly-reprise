/**
 * **The Move Advisor v2 bench** — one chapter, one seed, one driver, one result.
 *
 * Not a unit test and deliberately not in `tests/unit/`: a forty-seed sweep of
 * five chapters through three drivers is two minutes of engine time, which does
 * not belong in a 110-file `npm test`. `docs/plans/advisor-v2-review.md` §5 asks
 * for exactly this file; `bench.test.ts` beside it is the runner.
 *
 * ## Which game
 *
 * **Both** [AGENTS.md rule 14]. The three drivers are the same three questions
 * in either engine — "what does the chapter's own line do", "what does the old
 * card do", "what does the new card do" — and the FFX/FFX-2 split lives in the
 * harness builders, not in the measurement.
 *
 * Pure engine work: no DOM, no `three`, seeded throughout, so the same seed
 * gives the same row every run.
 */

import type {
  AvailableCommand,
  BattleState,
  Command,
  Decision,
} from '../../../src/battle/common/types.ts';
import { FFXContentRegistry, createFFXEngine } from '../../../src/battle/ffx/index.ts';
import { ALL_ABILITIES, ENEMY_GROUPS_BY_ID, ITEMS } from '../../../src/data/ffx/index.ts';
import * as ffx2data from '../../../src/data/ffx2/index.ts';
import {
  FFX2Engine,
  abilityRegistryFrom,
  dressphereRegistryFrom,
  garmentGridRegistryFrom,
  itemRegistryFrom,
} from '../../../src/battle/ffx2/index.ts';
import { CHAPTERS } from '../../../src/data/encounters.ts';
import { intendedStrategy } from '../../../src/engine/BattlePresenterStrategies.ts';
import { buildAdvisorView, type AdvisorOptions } from '../../../src/engine/tactics/advisor.ts';

/** Chapter 3's stalemate watchdog ends at 400 turns; this is well past it. */
export const MAX_STEPS = 40_000;

/** The five shipped chapters, in Bailey's own order. */
export const CHAPTER_IDS = [
  'seymour-flux',
  'yunalesca',
  'braskas-final-aeon',
  'ffx2-bahamut',
  'ffx2-vegnagun-shuyin',
] as const;

export type ChapterId = (typeof CHAPTER_IDS)[number];

export interface Harness {
  engine: {
    nextDecision: () => Decision;
    submit: (c: Command) => void;
    state: () => Readonly<BattleState>;
    tick?: (ms: number) => void;
  };
  options: AdvisorOptions;
}

function ffxHarness(groupId: string, seed: number, party: unknown): Harness {
  const content = new FFXContentRegistry();
  content.addAbilities(ALL_ABILITIES);
  content.addItems(Object.values(ITEMS));
  const group = ENEMY_GROUPS_BY_ID[groupId];
  if (!group) throw new Error(`${groupId} group missing from the data layer`);
  const engine = createFFXEngine({ content, autoResolveMinigames: true });
  engine.setSeed(seed);
  engine.init({
    game: 'ffx',
    party,
    enemies: group,
    triggers: [],
    seed,
    condition: 'normal',
    canEscape: false,
  } as never);
  return { engine: engine as unknown as Harness['engine'], options: { ffxContent: content } };
}

function ffx2Harness(groupId: string, seed: number, party: unknown): Harness {
  const abilities = abilityRegistryFrom(Object.values(ffx2data.ABILITIES));
  const items = itemRegistryFrom(Object.values(ffx2data.ITEMS));
  const engine = new FFX2Engine({
    abilities,
    items,
    dresspheres: dressphereRegistryFrom(Object.values(ffx2data.STANDARD_DRESSPHERES)),
    garmentGrids: garmentGridRegistryFrom(Object.values(ffx2data.GARMENT_GRIDS)),
    minigames: false,
  });
  const group = ffx2data.ENEMY_GROUPS_BY_ID[groupId];
  if (!group) throw new Error(`${groupId} group missing from the FFX-2 data layer`);
  engine.setSeed(seed);
  engine.init({
    game: 'ffx2',
    party,
    enemies: group,
    triggers: [],
    seed,
    condition: 'normal',
    canEscape: false,
  } as never);
  return { engine: engine as unknown as Harness['engine'], options: { ffx2: { abilities, items } } };
}

export function harnessFor(chapterId: string, seed: number): Harness {
  const chapter = CHAPTERS.find((c) => c.id === chapterId);
  if (!chapter) throw new Error(`no chapter "${chapterId}"`);
  return chapter.game === 'ffx2'
    ? ffx2Harness(chapter.enemyGroupRef.id, seed, chapter.buildRef)
    : ffxHarness(chapter.enemyGroupRef.id, seed, chapter.buildRef);
}

export function gameOf(chapterId: string): 'ffx' | 'ffx2' {
  return CHAPTERS.find((c) => c.id === chapterId)?.game === 'ffx2' ? 'ffx2' : 'ffx';
}

/** The last legal thing on the menu, so a driver can never stall the engine. */
export function fallback(commands: readonly AvailableCommand[]): Command | null {
  const r = commands.find((c) => c.enabled && c.validTargets.length > 0);
  return r ? ({ ...r.command, targets: [r.validTargets[0]!] } as Command) : null;
}

/** Which of the three routes a run took. */
export type DriverName = 'intended' | 'advisor-v1' | 'advisor-v2';

export interface RunResult {
  chapterId: string;
  seed: number;
  driver: DriverName;
  /** `'victory' | 'defeat' | 'escape' | 'unresolved'`. */
  outcome: string;
  /** Player decisions taken. */
  decisions: number;
  /** Engine turns at the end — the "median turns" column. */
  turns: number;
  /** Per-decision `buildAdvisorView` wall time, ms. Empty for `intended`. */
  latencies: number[];
}

export interface RunOptions {
  /**
   * A prefix of commands to force before the driver takes over — how a seeded
   * bad state is injected (an ally KO'd, a status on, MP spent).
   */
  prefix?: (state: Readonly<BattleState>, d: Extract<Decision, { kind: 'player-input' }>, n: number) => Command | null;
  /** How many decisions the prefix owns. */
  prefixDecisions?: number;
  /** Ask v2's planner rather than the shipped ordering. */
  planner?: boolean;
}

/**
 * Replay one chapter under one driver, to an outcome.
 *
 * `intended` submits `intendedStrategy` — the auto battler, i.e. the chapter's
 * own line, and the baseline every advisor number is measured against.
 * `advisor-v1` / `advisor-v2` submit the card's own top row every turn, which
 * is the route Bailey's complaint describes.
 */
export function run(
  chapterId: string,
  seed: number,
  driver: DriverName,
  opts: RunOptions = {},
): RunResult {
  const { engine, options } = harnessFor(chapterId, seed);
  const advisorOptions: AdvisorOptions =
    driver === 'advisor-v2' ? { ...options, planner: true } : { ...options, planner: false };
  const latencies: number[] = [];
  let decisions = 0;
  let outcome = 'unresolved';
  let turns = 0;

  for (let i = 0; i < MAX_STEPS; i += 1) {
    const d = engine.nextDecision();
    if (d.kind === 'battle-over') {
      outcome = String((d as { result?: { outcome?: string } }).result?.outcome ?? 'over');
      break;
    }
    if (d.kind === 'waiting') {
      engine.tick?.(Math.max(1, (d as { nextEventMs: number }).nextEventMs));
      continue;
    }
    if (d.kind !== 'player-input') continue;

    decisions += 1;
    const state = engine.state();
    turns = state.turn ?? turns;
    let chosen: Command | null = null;

    if (opts.prefix && decisions <= (opts.prefixDecisions ?? 0)) {
      chosen = opts.prefix(state, d, decisions);
    } else if (driver === 'intended') {
      chosen = intendedStrategy(d.actorId, d.commands, engine as never);
    } else {
      const t0 = performance.now();
      const view = buildAdvisorView(
        state,
        { actorId: d.actorId, commands: d.commands },
        advisorOptions,
      );
      latencies.push(performance.now() - t0);
      chosen = view?.suggestions[0]?.command ?? null;
      if (!chosen) chosen = intendedStrategy(d.actorId, d.commands, engine as never);
    }
    if (!chosen) chosen = fallback(d.commands);
    if (!chosen) break;
    engine.submit(chosen);
  }

  return { chapterId, seed, driver, outcome, decisions, turns, latencies };
}

export function median(xs: readonly number[]): number {
  if (xs.length === 0) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 === 1 ? s[m]! : (s[m - 1]! + s[m]!) / 2;
}

export function percentile(xs: readonly number[], p: number): number {
  if (xs.length === 0) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const i = Math.min(s.length - 1, Math.max(0, Math.round((p / 100) * (s.length - 1))));
  return s[i]!;
}

export interface ChapterSummary {
  chapterId: string;
  driver: DriverName;
  seeds: number;
  wins: number;
  winRate: number;
  medianTurns: number;
  medianDecisions: number;
  latencyP50: number;
  latencyP95: number;
  outcomes: Record<string, number>;
}

export function summarise(runs: readonly RunResult[]): ChapterSummary {
  const wins = runs.filter((r) => r.outcome === 'victory').length;
  const outcomes: Record<string, number> = {};
  const latencies: number[] = [];
  for (const r of runs) {
    outcomes[r.outcome] = (outcomes[r.outcome] ?? 0) + 1;
    latencies.push(...r.latencies);
  }
  return {
    chapterId: runs[0]?.chapterId ?? '',
    driver: runs[0]?.driver ?? 'intended',
    seeds: runs.length,
    wins,
    winRate: runs.length === 0 ? 0 : Math.round((wins / runs.length) * 1000) / 10,
    medianTurns: median(runs.map((r) => r.turns)),
    medianDecisions: median(runs.map((r) => r.decisions)),
    latencyP50: Math.round(percentile(latencies, 50) * 100) / 100,
    latencyP95: Math.round(percentile(latencies, 95) * 100) / 100,
    outcomes,
  };
}
