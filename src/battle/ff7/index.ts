/**
 * The FF7 engine's public surface (part 1: data shapes, stats, formulas, hit,
 * ATB rates, Limit fill). The engine facade (`Ff7Engine`) lands with plan step 4.
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
