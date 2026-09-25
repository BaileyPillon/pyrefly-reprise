/**
 * **Chapter XII — Seymour Omnis: the callout hooks.** The names the Omnis
 * rules emit as `script-trigger` events, so the chapter's mid-battle lines
 * (`src/story/scripts/seymour-omnis.ts`, B15) play at the fight's own moments.
 *
 * **Game case: FFX only** [AGENTS.md rule 14]. Every hook is called from the
 * Omnis rules and AI only (`./seymour-omnis-rules.ts`, `./seymour-omnis.ts`),
 * so no other battle ever emits one of these names.
 *
 * Why the AI emits them rather than a `MidBattleTrigger`: the chapter's lines
 * belong to moments the trigger vocabulary cannot name (a disc turned, the red
 * glow, the reset), and two of them must play **before** his action, which a
 * trigger (evaluated after an action resolves) cannot do. This is the FFX-2
 * precedent (`src/battle/ffx2/ai/trema.ts`, `vegnagun-head.ts`): an AI emits
 * a name and the presenter looks the script up by it.
 *
 * Presentation hooks only: no RNG is drawn and no number moves, so the fight
 * the bench measured (`tests/unit/chapters/omnis-bench.test.ts`) is the fight
 * that plays. The "said" marks live on `BattleState.flags` under `omnis.said.`,
 * so an intent dry-run (a cloned context) never spends a live one.
 */

import type { CombatantId } from '../../common/types.ts';
import type { Ctx } from '../state.ts';

/** Every name this chapter emits. Mirrored in the story script (a test pins the two). */
export const OMNIS_CALLOUTS = {
  /** Before his first four spells, while all four discs show Fire; Auron says it. */
  lesson: 'omnis-disc-lesson',
  /** The same moment with Lulu on the field: she says it. */
  lessonLulu: 'omnis-disc-lesson-lulu',
  /** The first disc a member turns (Tidus's line). */
  turned: 'omnis-disc-turned',
  /** The first disc turned, when Wakka turned it (his line). */
  turnedWakka: 'omnis-disc-turned-wakka',
  /** The first red glow. */
  glow: 'omnis-first-glow',
  /** Before his first Dispel (research §4.4: he speaks before it). */
  dispel: 'omnis-before-dispel',
  /** Before **each** Ultima (research §4.4: he speaks before each). */
  ultima: 'omnis-before-ultima',
  /** The first reset after Ultima. */
  reset: 'omnis-first-reset',
  /** His HP first below 20,000, where his counter drops to 3 (research §4.4). */
  low: 'omnis-below-20000',
} as const;

export type OmnisCallout = (typeof OMNIS_CALLOUTS)[keyof typeof OMNIS_CALLOUTS];

/** Every name, for the registry and the tests. */
export const OMNIS_CALLOUT_NAMES: readonly OmnisCallout[] = Object.values(OMNIS_CALLOUTS);

const SAID = 'omnis.said.';

/** True once `key` has been spent this battle. */
export function omnisSaid(ctx: Pick<Ctx, 'state'>, key: string): boolean {
  return ctx.state.flags[SAID + key] === true;
}

/**
 * Emit `name` once per battle, under the mark `key` (several names can share
 * one mark: the lesson is Auron's or Lulu's, never both). Returns true when it
 * emitted.
 */
export function omnisCalloutOnce(ctx: Ctx, key: string, name: OmnisCallout, who?: CombatantId): boolean {
  if (omnisSaid(ctx, key)) return false;
  ctx.state.flags[SAID + key] = true;
  ctx.emit({ type: 'script-trigger', name, payload: who === undefined ? {} : { who } });
  return true;
}

/** Emit `name` every time (the line before each Ultima). */
export function omnisCallout(ctx: Ctx, name: OmnisCallout): void {
  ctx.emit({ type: 'script-trigger', name, payload: {} });
}

/** Mark `key` spent without saying anything (the lesson, when the discs no longer all show Fire). */
export function omnisSpend(ctx: Ctx, key: string): void {
  ctx.state.flags[SAID + key] = true;
}
