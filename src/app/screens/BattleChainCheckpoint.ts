/**
 * The retry checkpoint of a chained encounter: FA3 = b (Bailey, 2026-09-24,
 * "I'll go with your recommendations for all"; `docs/target/decisions.json`
 * D-100).
 *
 * **Game case: FFX-2, and FFX's Sin link 3 only (switch on, D-284)** [AGENTS.md
 * rule 14]. The only formations that carry `EnemyGroupDef.restoresPartyOnEntry`
 * are Chapter XI's Sisters and Anima links (the Save Sphere between the
 * platforms of the Road to the Farplane, FA2 = b, a sourced `[conflict]`:
 * GamerGuides (HD) has the spheres, FFExodus (PS2) has none). `checkpointOnEntry`
 * (no Save Sphere) is set by FFX-2's Trema (TR5 = b) and Shuyin (D-217), and on
 * FFX's side by Sin's link 3 (`sinGenaisCoreGroup`) **only while
 * `SIN_LINK3_CHECKPOINT` is on** (`src/data/ffx/enemies/sin-genais-core.ts`;
 * on since PR-0268, adopted by Bailey as D-284: an adaptation, not a sourced
 * rule). No other FFX link ever produces a checkpoint. The code is shared
 * plumbing; with both flags absent everywhere else every other retry is
 * unchanged: it starts the chapter over from its first formation, as before.
 *
 * A checkpoint is the link the party entered through a Save Sphere, with the
 * exact setup it entered on (the party as carried out of the link before,
 * items spent stay spent; the engine's own `restoreAtSaveSphere` then refills
 * HP and MP and stands a KO'd girl up, `src/battle/ffx2/setup.ts`). A defeat
 * after one retries **at that link**, not at Shiva. It is kept in memory for
 * the one run and never written to the save (D-100: "kept in memory, not saved
 * to disk").
 *
 * **A checkpoint that would be hopeless (PR-0407, FFX-2's Trema only).** A retry replays the state the link was
 * entered on, and Trema's was entered on whatever Paragon left: with one girl standing the engine measured 0 wins in
 * 200 retries (107 of them lost within two decisions), and each retry opens on that same state. A formation that names
 * `hopelessRetry` says what a retry does when fewer than `standing` of the party are on their feet in that state:
 * `'restore'` opens it with the Save Sphere's rule (`resumeSetup`), `'chapter-start'` keeps no checkpoint there
 * (`checkpointAt`). The first entry is never changed. No other formation names the rule (pinned by
 * `tests/unit/chapters/trema-hopeless-retry.test.ts`), so every other retry is as it was.
 *
 * Layering: no `three`, no DOM.
 */

import type { BattleResult, BattleSetup, EnemyGroupDef } from '../../battle/common/types.ts';

/** Where a defeat in a chained encounter retries from. */
export interface ChainCheckpoint {
  /** The formation to re-enter. */
  group: EnemyGroupDef;
  /** The setup the party entered it on the first time (seed replaced on retry). */
  setup: BattleSetup;
  /** Its 1-based position in the chain: 2 for the Sisters, 3 for Anima. */
  link: number;
  /** The results of the links won before it in this run, so a retry here still sums them (PR-0138). */
  won?: readonly BattleResult[];
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
  // PR-0407: a state the girls cannot win from is not worth returning to; 'chapter-start' keeps no checkpoint there.
  if (hopelessAt(group, setup) && group.hopelessRetry?.answer === 'chapter-start') return null;
  return { group, setup, link };
}

/** How many of the party stand in the state `setup` opens on: HP above 0 and no KO. A member with no `hp` is at the build's own full value. */
export function standingIn(setup: BattleSetup): number {
  const members = setup.party.members as ReadonlyArray<{ hp?: number; statuses?: Record<string, unknown> }>;
  return members.filter((m) => (m.hp ?? 1) > 0 && m.statuses?.['ko'] === undefined).length;
}

/** True when `group` names a hopeless retry (PR-0407, `EnemyGroupDef.hopelessRetry`) and fewer than its `standing` stand in `setup`. */
export function hopelessAt(group: EnemyGroupDef, setup: BattleSetup): boolean {
  const rule = group.hopelessRetry;
  return rule !== undefined && standingIn(setup) < rule.standing;
}

/**
 * The setup a retry at `checkpoint` opens on.
 *
 * The seed follows the chain's own rule (`runEncounterChain` seeds link _n_
 * with `seed + n - 1`), and the retry's base seed is the flow's reseeded one,
 * so the same losing fight does not replay verbatim.
 */
export function resumeSetup(checkpoint: ChainCheckpoint, seed: number): BattleSetup {
  const setup = { ...checkpoint.setup, seed: seed + checkpoint.link - 1 };
  // PR-0407: from a state the girls cannot win from, a retry opens with the Save Sphere's rule (the engine's
  // `restoreAtSaveSphere` reads `restoresPartyOnEntry` off the formation it is given). The checkpoint keeps the
  // carried state, so every further retry is judged on it again; a state with enough on their feet replays as entered.
  if (checkpoint.group.hopelessRetry?.answer !== 'restore' || !hopelessAt(checkpoint.group, setup)) return setup;
  return { ...setup, enemies: { ...setup.enemies, restoresPartyOnEntry: true } };
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
