/**
 * Drive the Experiment (FFX-2 Chapter 5, Djose Temple; the hidden chapter) headlessly with the shipped line. **FFX-2 only.** A *line* is an input to a measurement,
 * never game data, and nothing here tunes the boss (rule 6): `intendedStrategy` is what the move advisor and the autopilot play, and it reads the chapter's tactic
 * (`src/engine/tactics/ffx2-experiment.ts`); `naive` is the same party with no answers, reported and never tuned to.
 *
 * - `driveAct(levels, ...)` plays ONE fight of the full weapon at any state of its levels (`experimentFormationAt`), for the per-level tests and benches.
 * - the chapter itself, both acts chained, is `driveChapterRecord(FFX2_EXPERIMENT, ...)` from `./ffx2ChapterDrive.ts`.
 * - `summarise(log)` reads the Experiment's actions and the girls' knock-outs off any log.
 */

import type { BattleEvent, BattleSetup, Command, Decision, FFX2PartyBuild } from '../../../src/battle/common/types.ts';
import { FFX2Engine } from '../../../src/battle/ffx2/index.ts';
import type { Ffx2EngineOptions } from '../../../src/battle/ffx2/internal.ts';
import { FFX2_EXPERIMENT } from '../../../src/data/chapter-ffx2-experiment.ts';
import { EXPERIMENT_ACTIONS, type ExperimentLevels } from '../../../src/data/ffx2/enemies/experiment-levels.ts';
import { EXPERIMENT_BODY_IDS, experimentFormationAt } from '../../../src/data/ffx2/enemies/experiment.ts';
import { intendedStrategy } from '../../../src/engine/BattlePresenterStrategies.ts';
import { setupForChapter, setupForNextLink } from '../../../src/app/screens/BattleScreenSetup.ts';
import { ENEMY_GROUPS_BY_ID } from '../../../src/data/ffx2/index.ts';
import { ffx2Options } from './ffx2ChapterDrive.ts';

type Input = Extract<Decision, { kind: 'player-input' }>;

/** `intended` is the shipped line; `naive` attacks every turn and heals nobody. */
export type ExperimentLine = 'intended' | 'naive';

export interface ExperimentRun {
  outcome: string | undefined;
  ticks: number;
  /** The Experiment's actions, by ability id. */
  moves: Record<string, number>;
  /** The girls' actions. */
  partyTurns: number;
  /** Times a girl was knocked out. */
  kos: number;
  log: readonly BattleEvent[];
}

export interface ExperimentDriveOptions {
  /** ms of decision time per menu (0 = bench speed). */
  decisionMs?: number;
  engine?: Partial<Ffx2EngineOptions>;
  build?: FFX2PartyBuild;
  line?: ExperimentLine;
}

const MAX_DECISIONS = 40_000;

function fallback(d: Input): Command {
  const row = d.commands.find((c) => c.enabled && c.command.kind === 'attack') ?? d.commands.find((c) => c.enabled);
  if (!row) return { kind: 'defend', targets: [] };
  const target = row.validTargets.find((t) => EXPERIMENT_BODY_IDS.includes(t)) ?? row.validTargets[0];
  return { ...row.command, targets: target ? [target] : [] } as Command;
}

/** The Experiment's actions and the girls' knock-outs, read off any log. */
export function summarise(log: readonly BattleEvent[]): Pick<ExperimentRun, 'moves' | 'partyTurns' | 'kos'> {
  const moves: Record<string, number> = {};
  let partyTurns = 0;
  let kos = 0;
  for (const e of log as readonly (BattleEvent & { actorId?: string; abilityId?: string; targetId?: string; who?: string })[]) {
    if (e.type === 'action-start') {
      if (e.actorId !== undefined && EXPERIMENT_BODY_IDS.includes(e.actorId)) moves[e.abilityId ?? '?'] = (moves[e.abilityId ?? '?'] ?? 0) + 1;
      else partyTurns += 1;
    }
    if (e.type === 'ko') {
      const who = e.targetId ?? e.who;
      if (who !== undefined && !EXPERIMENT_BODY_IDS.includes(who)) kos += 1;
    }
  }
  return { moves, partyTurns, kos };
}

/** One fight of the full weapon at `levels` from the chapter's party (or `opts.build`), one line, one seed. */
export function driveAct(levels: ExperimentLevels, seed = 1, opts: ExperimentDriveOptions = {}): ExperimentRun {
  const engine = new FFX2Engine(ffx2Options({ atbMode: 'wait', ...opts.engine }));
  const setup: BattleSetup = {
    game: 'ffx2', party: opts.build ?? (FFX2_EXPERIMENT.buildRef as FFX2PartyBuild), enemies: experimentFormationAt(levels), triggers: [], seed, condition: 'normal', canEscape: false,
  };
  engine.setSeed(seed);
  engine.init(setup);
  const decisionMs = opts.decisionMs ?? 0;
  const line = opts.line ?? 'intended';
  for (let i = 0; i < MAX_DECISIONS; i++) {
    const d = engine.nextDecision();
    if (d.kind === 'battle-over') return { outcome: d.result.outcome, ticks: engine.state().ticks, ...summarise(engine.state().log), log: engine.state().log };
    if (d.kind === 'waiting') {
      engine.tick(Math.max(1, d.nextEventMs));
      continue;
    }
    if (d.kind !== 'player-input') continue;
    if (decisionMs > 0) {
      engine.tick(decisionMs, { throughInput: true });
      if (!engine.inputValid(d.actorId)) continue;
    }
    const picked = line === 'intended' ? intendedStrategy(d.actorId, d.commands, engine) : null;
    engine.submit(picked ?? fallback(d));
  }
  return { outcome: undefined, ticks: engine.state().ticks, ...summarise(engine.state().log), log: engine.state().log };
}

/** Wins of `seeds` seeds starting at `from`, one line. */
export function winsOf(levels: ExperimentLevels, seeds: number, opts: ExperimentDriveOptions = {}, from = 1): { wins: number; runs: ExperimentRun[] } {
  const runs: ExperimentRun[] = [];
  for (let s = 0; s < seeds; s++) runs.push(driveAct(levels, from + s, opts));
  return { wins: runs.filter((r) => r.outcome === 'victory').length, runs };
}

export const LIFESLICER = EXPERIMENT_ACTIONS.lifeslicer;
export const ANNIHILATOR = EXPERIMENT_ACTIONS.annihilator;

export interface ChapterRun {
  outcome: string | undefined;
  /** Each link's own log, in order (Act I, then Act II). */
  logs: BattleEvent[][];
  /** Each link's engine at the end, for state reads. */
  engines: FFX2Engine[];
}

/**
 * The chapter as the flow plays it, both acts with the chapter's own mid-battle triggers (`setupForChapter`, then `setupForNextLink`: the Act II setup restores the party and keeps
 * the triggers), driven by the shipped line. `before(engine, link)` runs right after each link's init, for a test that wants to set a state.
 */
export function driveChapterWithTriggers(seed = 1, opts: ExperimentDriveOptions & { before?: (engine: FFX2Engine, link: number) => void } = {}): ChapterRun {
  const logs: BattleEvent[][] = [];
  const engines: FFX2Engine[] = [];
  let setup = setupForChapter(FFX2_EXPERIMENT, seed);
  let group = FFX2_EXPERIMENT.enemyGroupRef;
  let outcome: string | undefined;
  for (let link = 1; ; link++) {
    const engine = new FFX2Engine(ffx2Options({ atbMode: 'wait', ...opts.engine }));
    engine.setSeed(setup.seed);
    engine.init(setup);
    opts.before?.(engine, link);
    engines.push(engine);
    outcome = undefined;
    for (let i = 0; i < MAX_DECISIONS; i++) {
      const d = engine.nextDecision();
      if (d.kind === 'battle-over') { outcome = d.result.outcome; break; }
      if (d.kind === 'waiting') { engine.tick(Math.max(1, d.nextEventMs)); continue; }
      if (d.kind !== 'player-input') continue;
      const picked = opts.line === 'naive' ? null : intendedStrategy(d.actorId, d.commands, engine);
      engine.submit(picked ?? fallback(d));
    }
    logs.push([...engine.state().log]);
    const nextId = group.nextGroupId;
    if (outcome !== 'victory' || !nextId) break;
    const next = ENEMY_GROUPS_BY_ID[nextId];
    if (!next) throw new Error('chain points at ' + nextId);
    setup = setupForNextLink(setup, next, engine.state(), seed + link) as BattleSetup;
    group = next;
  }
  return { outcome, logs, engines };
}
