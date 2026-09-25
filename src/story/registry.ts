/**
 * The mid-battle script registry, and the audit surface the test suite uses.
 *
 * ## Why this file exists
 *
 * A mid-battle beat reaches the screen through **two** paths, and both look up
 * a script **by a plain string**:
 *
 * 1. A {@link MidBattleTrigger} in a chapter's `mid` array. The engine
 *    evaluates it after every resolved action and emits
 *    `{ type: 'script-trigger', name: trigger.id }` — the trigger's **`id`**,
 *    not its `script` [`battle/ffx/triggers.ts`, `battle/ffx2/triggers.ts`].
 * 2. An AI script emitting `script-trigger` with a name of its own invention
 *    and no `MidBattleTrigger` anywhere [`battle/ffx2/ai/vegnagun.ts`,
 *    `vegnagun-head.ts`, `shuyin.ts`].
 *
 * Either way the presenter does `midScripts[name]`, and when the lookup misses
 * it logs `no mid-battle script for trigger "…"` and fights on
 * [`engine/BattlePresenterUtil.ts`]. Nothing in the type system connects a
 * trigger id to a `midScripts` key, so every beat in Chapters 2, 3, 4 and 5 was
 * dead content: the ids and the keys had drifted apart, and thirteen names the
 * FFX-2 AI emits had no script at all.
 *
 * So this module holds the three invariants and `tests/unit/story-triggers.test.ts`
 * enforces them:
 *
 * - **`id === script`** for every `MidBattleTrigger`, and both resolve to a
 *   registered script. The indirection buys nothing and silently loses beats.
 * - **Every AI-emitted name** in {@link AI_EMITTED_TRIGGERS} resolves too.
 * - **Every mid-battle script fits its budget.** The presenter abandons a
 *   script that has not finished in {@link PRESENTER_BUDGET_MS}, so a beat that
 *   sits on a `say` waiting for a Confirm that never comes (auto-battle, a
 *   gallery capture, a player who looked away) is dropped mid-sentence. Every
 *   `say` in a mid-battle script therefore carries an explicit `auto`, and the
 *   worst-case duration is checked against {@link MID_SCRIPT_BUDGET_MS}.
 *
 * ## The two budgets
 *
 * A beat that interrupts a live fight is capped at {@link MID_SCRIPT_BUDGET_MS}
 * (8 s) — the player is holding a command menu open. A **chain seam** is the
 * other thing a mid-battle script can be: one link of a chained encounter has
 * just ended, the next has not started, and the scene *is* the point (Jecht's
 * goodbye, the head descending). Those are listed in {@link CHAIN_SEAMS} and
 * capped at {@link SEAM_BUDGET_MS}, which still leaves headroom under the
 * presenter's abandon budget. Nothing else may run long.
 *
 * Pre- and post-battle scripts have no budget: they own the screen, and the
 * `CutsceneScreen` waits on the player.
 */

import type { ChapterScripts, Step, StoryScript } from './dsl.ts';
import { typingDurationMs } from '../ui/common/typewriter.ts';
import { seymourFluxScripts } from './scripts/seymour-flux.ts';
import { yunalescaScripts } from './scripts/yunalesca.ts';
import { braskasFinalAeonScripts } from './scripts/braskas-final-aeon.ts';
import { ffx2BahamutScripts } from './scripts/ffx2-bahamut.ts';
import { ffx2VegnagunShuyinScripts } from './scripts/ffx2-vegnagun-shuyin.ts';
import { ffx2LeblancScripts } from './scripts/ffx2-leblanc.ts';
import { seymourAnimaMacalaniaScripts } from './scripts/seymour-anima-macalania.ts';
import { evraeAirshipScripts } from './scripts/evrae-airship.ts';
import { yojimboCavernScripts } from './scripts/yojimbo-cavern.ts';

/** Chapter ids, matching `data/encounters.ts`. */
export type ChapterKey =
  | 'seymour-flux'
  | 'yunalesca'
  | 'braskas-final-aeon'
  | 'ffx2-bahamut'
  | 'ffx2-vegnagun-shuyin'
  | 'ffx2-leblanc'
  | 'seymour-anima-macalania'
  | 'evrae-airship'
  | 'yojimbo-cavern';

/** Every chapter's story layer, in play order. */
export const STORY_CHAPTERS: Readonly<Record<ChapterKey, ChapterScripts>> = {
  'seymour-flux': seymourFluxScripts,
  yunalesca: yunalescaScripts,
  'braskas-final-aeon': braskasFinalAeonScripts,
  'ffx2-bahamut': ffx2BahamutScripts,
  'ffx2-vegnagun-shuyin': ffx2VegnagunShuyinScripts,
  'ffx2-leblanc': ffx2LeblancScripts,
  'seymour-anima-macalania': seymourAnimaMacalaniaScripts,
  'evrae-airship': evraeAirshipScripts,
  'yojimbo-cavern': yojimboCavernScripts,
};

export const CHAPTER_KEYS = Object.keys(STORY_CHAPTERS) as ChapterKey[];

// ---------------------------------------------------------------------------
// Names the AI emits directly
// ---------------------------------------------------------------------------

/**
 * `script-trigger` names emitted straight from AI scripts, which never pass
 * through a {@link MidBattleTrigger}.
 *
 * Keep this in step with the `ctx.emit({ type: 'script-trigger', … })` calls in
 * `src/battle/*​/ai/`. It is a hand-maintained list on purpose: the emitters
 * build some names by template (`shuyin-line-${line}`), so no static scan can
 * be trusted, and a name that disappears from the AI should be noticed by a
 * human rather than silently dropped.
 *
 * Source, as of this pass:
 * - `battle/ffx2/ai/vegnagun.ts` — `farplane-voice-braska` (Tail step 1),
 *   `vegnagun-tail-quarter` (Tail below 25%), `farplane-voice` (Leg flavour
 *   slot, fires repeatedly).
 * - `battle/ffx2/ai/vegnagun-head.ts` — `shuyin-line-1` (phase A start),
 *   `shuyin-line-2` (phase B entry), `jecht-no-overtime` (phase B step 3),
 *   `auron-halfway` (half of `HEAD_FIRE_AT_TURN`), `shuyin-line-3`..`6` (every
 *   `HEAD_LINE_INTERVAL` turns) and `shuyin-line-7` (the cannon fires: the bad
 *   ending).
 * - `battle/ffx2/ai/shuyin.ts` — `shuyin-taunt` above half HP,
 *   `shuyin-desperate` below it.
 *
 * No FFX AI script emits `script-trigger`; Chapters 1–3 go through `mid` only.
 */
export const AI_EMITTED_TRIGGERS: Readonly<Record<ChapterKey, readonly string[]>> = {
  'seymour-flux': [],
  yunalesca: [],
  'braskas-final-aeon': [],
  'ffx2-bahamut': [],
  // No `leblanc-syndicate.ts` AI script emits `script-trigger`; every beat
  // this chapter fires goes through `mid` (`ko`/`ability-used`) instead.
  'ffx2-leblanc': [],
  // No `seymour-anima-macalania.ts` / `macalania-rules.ts` AI script emits
  // `script-trigger`; its three beats go through `mid` (hp-below, ability-used)
  // [docs/handoff/chapter-macalania-script.md].
  'seymour-anima-macalania': [],
  // No `evrae.ts` / `evrae-rules.ts` / `evrae-counters.ts` AI script emits
  // `script-trigger`; its five beats go through `mid` (ability-used, hp-below,
  // status-applied) [docs/handoff/chapter-evrae-script.md].
  'evrae-airship': [],
  'yojimbo-cavern': [],
  'ffx2-vegnagun-shuyin': [
    'farplane-voice',
    'farplane-voice-braska',
    'vegnagun-tail-quarter',
    'auron-halfway',
    'jecht-no-overtime',
    'shuyin-line-1',
    'shuyin-line-2',
    'shuyin-line-3',
    'shuyin-line-4',
    'shuyin-line-5',
    'shuyin-line-6',
    'shuyin-line-7',
    'shuyin-taunt',
    'shuyin-desperate',
  ],
};

// ---------------------------------------------------------------------------
// Budgets
// ---------------------------------------------------------------------------

/**
 * The presenter abandons a mid-battle script that has not finished in this
 * long. Mirrors `SCRIPT_BUDGET_MS` in `engine/BattlePresenterUtil.ts`; the test
 * only uses it to prove both budgets below leave headroom.
 */
export const PRESENTER_BUDGET_MS = 30_000;

/** Worst case for a beat that interrupts a live fight. */
export const MID_SCRIPT_BUDGET_MS = 8_000;

/** Worst case for a chain seam, where no combat is in flight. */
export const SEAM_BUDGET_MS = 26_000;

/**
 * The scripts allowed the seam budget: a scene between two links of a chained
 * encounter. Adding to this list is a writing decision, not a convenience —
 * everything here plays with the player's hands off the controller.
 */
export const CHAIN_SEAMS: Readonly<Record<ChapterKey, readonly string[]>> = {
  'seymour-flux': [],
  yunalesca: [],
  // Jecht's goodbye (on his KO, mid-chain) and the chant that opens the
  // possessed-aeon gauntlet.
  'braskas-final-aeon': ['jecht-falls', 'valefor-enters'],
  'ffx2-bahamut': [],
  // One per link of the Vegnagun chain, plus Shuyin stepping out of Baralai.
  'ffx2-vegnagun-shuyin': ['tail-down', 'leg-down', 'body-down', 'shuyin-appears'],
  // The two between-act beats, per `ffx2-leblanc.ts`'s own wiring notes: a
  // group boundary where the scene is the point, not an in-fight interrupt.
  'ffx2-leblanc': ['act-one-cleared', 'act-two-cleared'],
  // One continuous battle across three acts (no chained formation), so every
  // beat is an in-fight interrupt on the 8 s budget.
  'seymour-anima-macalania': [],
  // One battle, one formation: every beat is an in-fight interrupt.
  'evrae-airship': [],
  'yojimbo-cavern': [],
};

/** The budget a given script has to fit inside. */
export function budgetFor(chapter: ChapterKey, name: string): number {
  return CHAIN_SEAMS[chapter].includes(name) ? SEAM_BUDGET_MS : MID_SCRIPT_BUDGET_MS;
}

/**
 * The hold a mid-battle line gets when the author did not time it.
 *
 * Mid-battle, `app/screens/BattleScreenCutscenes.ts` forces an `auto` onto
 * every line rather than letting one sit on a Confirm nobody is going to press,
 * so an untimed line costs this much at runtime instead of
 * {@link BLOCKING_LINE_MS}. 1.2 s is the floor the writing bible gives a beat
 * that has to read as deliberate rather than as a dropped frame
 * [`research/writing-bible.md` §2.1: "Allocate real time (1.2–2.0s)"], and a
 * mid-battle callout is capped at ten words [§3 E6 "Mid-battle callouts"], so
 * the reading time it has to cover is short by construction.
 */
export const MID_LINE_HOLD_MS = 1_200;

/**
 * Slack over a script's own authored length before the runner stops waiting.
 *
 * Only a seam ever uses it: a beat is capped flat at {@link MID_SCRIPT_BUDGET_MS}.
 */
export const OVERRUN_GRACE_MS = 1_500;

/**
 * How long the live runner will actually give one mid-battle script before it
 * cuts the beat short and resumes the fight.
 *
 * A beat gets a flat {@link MID_SCRIPT_BUDGET_MS}: the player is holding a
 * command menu open and eight seconds is already the outside of what the test
 * suite allows one to be authored at. A **chain seam** is authored longer on
 * purpose, so it gets its own authored length plus {@link OVERRUN_GRACE_MS},
 * capped at {@link SEAM_BUDGET_MS} — which is why this reads the script rather
 * than the seam list: the runner is handed a script, not a name.
 *
 * Both stay under the presenter's own abandon budget
 * ({@link PRESENTER_BUDGET_MS}), which is the backstop for a runner that has
 * died outright rather than a pacing control.
 */
export function midBattleDeadlineMs(script: StoryScript): number {
  const authored = scriptDurationMs(script, MID_LINE_HOLD_MS);
  if (authored <= MID_SCRIPT_BUDGET_MS) return MID_SCRIPT_BUDGET_MS;
  return Math.min(authored, SEAM_BUDGET_MS) + OVERRUN_GRACE_MS;
}

// ---------------------------------------------------------------------------
// Lookups
// ---------------------------------------------------------------------------

/** One `script-trigger` name a chapter can emit, and where it comes from. */
export interface TriggerRef {
  chapter: ChapterKey;
  /** The `script-trigger` event's `name`, which is what the presenter looks up. */
  name: string;
  source: 'trigger' | 'ai';
  /** For `'trigger'`: the `script` field, so a drifted alias can be reported. */
  script?: string;
}

/** Every name the presenter can be asked for, across both paths. */
export function referencedTriggers(chapter: ChapterKey): TriggerRef[] {
  const refs: TriggerRef[] = STORY_CHAPTERS[chapter].mid.map((t) => ({
    chapter,
    name: t.id,
    source: 'trigger' as const,
    script: t.script,
  }));
  for (const name of AI_EMITTED_TRIGGERS[chapter]) {
    refs.push({ chapter, name, source: 'ai' });
  }
  return refs;
}

/** Every referenced name in every chapter. */
export function allReferencedTriggers(): TriggerRef[] {
  return CHAPTER_KEYS.flatMap(referencedTriggers);
}

/** Look a mid-battle script up the way the presenter does. */
export function midScript(chapter: ChapterKey, name: string): StoryScript | undefined {
  return STORY_CHAPTERS[chapter].midScripts[name];
}

/** Referenced names with no script behind them — what the presenter logs about. */
export function missingMidScripts(): TriggerRef[] {
  return allReferencedTriggers().filter((ref) => midScript(ref.chapter, ref.name) === undefined);
}

/**
 * Registered scripts nothing can ever ask for. Not an error on its own — a beat
 * may be parked ahead of the AI work that fires it — but the test reports them
 * so a typo does not hide as dead content.
 */
export function unreachableMidScripts(): Array<{ chapter: ChapterKey; name: string }> {
  const out: Array<{ chapter: ChapterKey; name: string }> = [];
  for (const chapter of CHAPTER_KEYS) {
    const reachable = new Set(referencedTriggers(chapter).map((r) => r.name));
    for (const name of Object.keys(STORY_CHAPTERS[chapter].midScripts)) {
      if (!reachable.has(name)) out.push({ chapter, name });
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Duration model
// ---------------------------------------------------------------------------

/**
 * A `say` with no `auto` blocks on a Confirm. There is no honest number for
 * that, so the model charges it the whole presenter budget — which makes any
 * script containing one fail its budget assertion, by design.
 */
export const BLOCKING_LINE_MS = PRESENTER_BUDGET_MS;

/** `showActor`/`hideActor` default fade, from `app/screens/BattleScreenCutscenes.ts`. */
const DEFAULT_ACTOR_FADE_MS = 300;

/**
 * How long one step can take, worst case, in the real runner.
 *
 * `untimedLineMs` is what an author-less `auto` costs: {@link BLOCKING_LINE_MS}
 * for the audit (so the budget assertion can never pass on a line that waits on
 * input), or {@link MID_LINE_HOLD_MS} when modelling what the mid-battle runner
 * will really do with it.
 */
function stepDurationMs(step: Step, untimedLineMs: number): number {
  switch (step.type) {
    case 'say':
    case 'narrate':
      // The box types the line out first, then holds for `auto`.
      return typingDurationMs(step.text) + (step.auto ?? untimedLineMs);
    case 'choice':
      // A menu waits on the player, full stop. Never legal mid-battle.
      return BLOCKING_LINE_MS;
    case 'wait':
    case 'move':
    case 'camera':
    case 'flash':
    case 'shake':
    case 'fade':
      return step.ms;
    case 'showActor':
    case 'hideActor':
      return step.ms ?? DEFAULT_ACTOR_FADE_MS;
    case 'parallel':
      // The runner continues when the longest finishes.
      return step.steps.reduce((longest, inner) => Math.max(longest, stepDurationMs(inner, untimedLineMs)), 0);
    case 'ifFlag':
      return Math.max(
        step.then.reduce((sum, inner) => sum + stepDurationMs(inner, untimedLineMs), 0),
        (step.else ?? []).reduce((sum, inner) => sum + stepDurationMs(inner, untimedLineMs), 0),
      );
    // `fx` resolves as soon as the effect is handed to the stage; `music`,
    // `sfx`, `setPose`, `setFlag`, `label`, `jump`, `battleStart` and
    // `results` are instantaneous.
    default:
      return 0;
  }
}

/**
 * Worst-case wall-clock length of a script, in milliseconds.
 *
 * Counts typewriter time plus every `auto` hold and every timed step, takes the
 * longest branch of an `ifFlag` and the longest leg of a `parallel`. It does
 * **not** model `jump`, which can loop: mid-battle scripts are asserted not to
 * contain one.
 *
 * `untimedLineMs` defaults to {@link BLOCKING_LINE_MS}, which is the audit's
 * view of an untimed line; {@link midBattleDeadlineMs} passes
 * {@link MID_LINE_HOLD_MS} instead, which is the runner's.
 */
export function scriptDurationMs(script: StoryScript, untimedLineMs: number = BLOCKING_LINE_MS): number {
  return script.reduce((total, step) => total + stepDurationMs(step, untimedLineMs), 0);
}

/** Every mid-battle script in a chapter with its worst-case length. */
export function midScriptDurations(chapter: ChapterKey): Array<{ name: string; ms: number; budget: number }> {
  return Object.entries(STORY_CHAPTERS[chapter].midScripts).map(([name, script]) => ({
    name,
    ms: scriptDurationMs(script),
    budget: budgetFor(chapter, name),
  }));
}

/** Steps of a kind that can wedge a mid-battle script, found anywhere in it. */
export function blockingSteps(script: StoryScript): Step[] {
  const found: Step[] = [];
  const walk = (steps: readonly Step[]): void => {
    for (const step of steps) {
      if ((step.type === 'say' || step.type === 'narrate') && step.auto === undefined) found.push(step);
      if (step.type === 'choice' || step.type === 'jump') found.push(step);
      if (step.type === 'parallel') walk(step.steps);
      if (step.type === 'ifFlag') {
        walk(step.then);
        walk(step.else ?? []);
      }
    }
  };
  walk(script);
  return found;
}
