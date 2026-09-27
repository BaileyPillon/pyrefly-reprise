/**
 * FF7 enemy scripts by `aiScriptId`. Pure (AGENTS.md rule 1). Game case: **FF7 only.**
 */

import { guardScorpionScript } from './guard-scorpion.ts';
import type { Ff7AiScript } from './script.ts';

export const FF7_AI_SCRIPTS: Readonly<Record<string, Ff7AiScript>> = {
  'guard-scorpion': guardScorpionScript,
};

export { guardScorpionScript, GUARD_SCORPION_HINTS, hintCase } from './guard-scorpion.ts';
export { makeAiApi, randomOpponent, type Ff7AiApi, type Ff7AiPlan, type Ff7AiScript } from './script.ts';
