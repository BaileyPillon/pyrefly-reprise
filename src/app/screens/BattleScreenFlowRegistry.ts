/**
 * The screen registry: `ui/common` replaces a placeholder step with the real screen by calling `registerFlowScreens` once at module load.
 *
 * `BattleScreenFlow.ts` was one 650-line file. Its types, its screen registry, its pure rules and the half of `GameFlow` that no test reads by text now live
 * in `BattleScreenFlowTypes.ts`, `BattleScreenFlowRegistry.ts`, `BattleScreenFlowRules.ts` and `BattleScreenFlowBase.ts`; `BattleScreenFlow.ts` re-exports all of it.
 * A pure move (ChatGPT's point 8b, 2026-10-28; both games): nothing here changed, only `private` became `protected` where the other half of the class reads it.
 */

import type { ChapterId } from '../../data/encounters.ts';
import { StubChapterSelect } from './BattleScreenFlowStubs.ts';
import type { FlowScreen, FlowScreenFactories } from './BattleScreenFlowTypes.ts';

export const factories: Partial<FlowScreenFactories> = {};

/** Replace one or more flow steps with the real screens. */
export function registerFlowScreens(next: Partial<FlowScreenFactories>): void {
  Object.assign(factories, next);
}

/** The chapter-select screen — the registered one, or the placeholder. */
export function makeChapterSelect(): FlowScreen<ChapterId | null> {
  return factories.chapterSelect?.() ?? new StubChapterSelect();
}

/** Which steps are real and which are still placeholders. */
export function flowReport(): Record<string, boolean> {
  return {
    chapterSelect: factories.chapterSelect !== undefined,
    partyPrep: factories.partyPrep !== undefined,
    cutscene: factories.cutscene !== undefined,
    results: factories.results !== undefined,
  };
}

/** Drop every registered factory. Tests only; nothing in the game calls it. */
export function resetFlowScreens(): void {
  for (const key of Object.keys(factories)) delete (factories as Record<string, unknown>)[key];
}
