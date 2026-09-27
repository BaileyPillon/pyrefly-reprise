/**
 * The FF7 engine's public surface: the data shapes, stats, formulas, hit, ATB
 * rates and Limit fill (part 1), and the engine itself (part 2): the clock and
 * its modes, the command window, the queue, the Guard Scorpion script, results,
 * and the headless simulator.
 *
 * Pure: no DOM, no `three`, no `src/data` imports (AGENTS.md rule 1); the app
 * hands the registry in. Game case: **FF7 only.**
 */

export * from './defs.ts';
export * from './stats.ts';
export * from './formulas.ts';
export * from './hit.ts';
export * from './atb.ts';
export * from './limit.ts';
export * from './clock.ts';
export { Ff7Engine, type Ff7EngineOptions } from './engine.ts';
export { buildCommands, commandError, legalTargets } from './commands.ts';
export { FF7_AI_SCRIPTS, GUARD_SCORPION_HINTS, hintCase, type Ff7AiPlan, type Ff7AiScript } from './ai/index.ts';
export { battleOutcome, DROP_CLASS_MAX } from './results.ts';
export {
  FF7_POLICIES,
  literalHintPolicy,
  naivePolicy,
  runFf7Battle,
  sensiblePolicy,
  summarizeFf7Run,
  type Ff7Policy,
  type Ff7PolicyView,
  type Ff7Run,
  type Ff7RunOptions,
  type Ff7RunSummary,
} from './simulate.ts';
