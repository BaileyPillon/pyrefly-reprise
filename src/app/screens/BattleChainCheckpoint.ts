/**
 * The retry checkpoint of a chained encounter: FA3 = b (Bailey, 2026-09-24,
 * "I'll go with your recommendations for all"; `docs/target/decisions.json`
 * D-100).
 *
 * **Game case: FFX-2 only in effect** [AGENTS.md rule 14]. The only formations
 * that carry `EnemyGroupDef.restoresPartyOnEntry` are Chapter XI's Sisters and
 * Anima links (the Save Sphere between the platforms of the Road to the
 * Farplane, FA2 = b, a sourced `[conflict]`: GamerGuides (HD) has the spheres,
 * FFExodus (PS2) has none). The code is shared plumbing, but with the flag
 * absent everywhere else no FFX chapter, and no other FFX-2 chapter, ever
 * produces a checkpoint, so every other retry is unchanged: it starts the
 * chapter over from its first formation, as before.
 *
 * A checkpoint is the link the party entered through a Save Sphere, with the
 * exact setup it entered on (the party as carried out of the link before,
 * items spent stay spent; the engine's own `restoreAtSaveSphere` then refills
 * HP and MP and stands a KO'd girl up, `src/battle/ffx2/setup.ts`). A defeat
 * after one retries **at that link**, not at Shiva. It is kept in memory for
 * the one run and never written to the save (D-100: "kept in memory, not saved
 * to disk").
 *
 * Layering: no `three`, no DOM.
 */

import type { BattleSetup, EnemyGroupDef } from '../../battle/common/types.ts';

/** Where a defeat in a chained encounter retries from. */
export interface ChainCheckpoint {
  /** The formation to re-enter. */
  group: EnemyGroupDef;
  /** The setup the party entered it on the first time (seed replaced on retry). */
  setup: BattleSetup;
  /** Its 1-based position in the chain: 2 for the Sisters, 3 for Anima. */
  link: number;
}

/**
 * The checkpoint a link makes, or `null` when it makes none.
 *
 * Only a link entered through a Save Sphere (`restoresPartyOnEntry`) or marked
 * `checkpointOnEntry` counts, and never the opening formation: link 1 is the
 * chapter's own start, which is where a retry without a checkpoint goes anyway.
 */
export function checkpointAt(link: number, group: EnemyGroupDef, setup: BattleSetup): ChainCheckpoint | null {
  if (link < 2) return null;
  // Chapter XIII (FFX-2, TR5 = b): Trema's link is a checkpoint with no Save Sphere. The setup
  // it was entered on already carries Paragon's end state, so a retry replays that state.
  if (group.restoresPartyOnEntry !== true && group.checkpointOnEntry !== true) return null;
  return { group, setup, link };
}

/**
 * The setup a retry at `checkpoint` opens on.
 *
 * The seed follows the chain's own rule (`runEncounterChain` seeds link _n_
 * with `seed + n - 1`), and the retry's base seed is the flow's reseeded one,
 * so the same losing fight does not replay verbatim.
 */
export function resumeSetup(checkpoint: ChainCheckpoint, seed: number): BattleSetup {
  return { ...checkpoint.setup, seed: seed + checkpoint.link - 1 };
}

/** What the flow carries from one attempt of a chapter to the next. */
export interface RetryCarry {
  /** Retry here instead of from the first formation; `null` = the chapter's start. */
  resumeAt: ChainCheckpoint | null;
  /**
   * Fight time already spent in this run before the checkpoint retry, so a
   * clear that came through one is timed from the chapter's start (the lost
   * attempts included) and can never beat a best time with a partial run.
   */
  carriedMs: number;
}

export const FRESH_RUN: RetryCarry = { resumeAt: null, carriedMs: 0 };

/**
 * The carry after a defeat: retry at the checkpoint the lost attempt reached,
 * or from the start when it reached none.
 */
export function carryAfterDefeat(
  previous: RetryCarry,
  lost: { checkpoint?: ChainCheckpoint | null; elapsedMs: number },
): RetryCarry {
  if (!lost.checkpoint) return FRESH_RUN;
  return { resumeAt: lost.checkpoint, carriedMs: previous.carriedMs + Math.max(0, lost.elapsedMs) };
}
