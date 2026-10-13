/**
 * The cue a chapter's opening scene asks for at or before its first spoken line (r46-scenecue; both games, shared plumbing).
 *
 * `GameFlow.playCutscene` plays `Chapter.music.scene` itself only when the `pre` script does not set its own bed in its
 * opening steps ({@link scriptOpensWithMusic}); otherwise the script's own `music` steps decide. Either way, what the player
 * hears when the first line is spoken is a function of the script and the chapter record, so it is derived here from them
 * and never listed by hand.
 *
 * The answer is `null` when nothing is playing at the first spoken line by design: a chapter with no `pre` script (no scene
 * is shown), FF7's hidden experiment (its own flow, which never calls `playCutscene`), and a script that opens with
 * `music(null)`. Chapter I (`seymour-flux`) is the shipped example: its first line is silent and the Gagazet bed enters at
 * script step 27, so a late bed cannot be "late for the first line" there.
 */

import type { Chapter } from '../data/encounters.ts';
import type { Step, StoryScript } from '../story/dsl.ts';

/** How far into a script to look for its own opening cue. */
export const MUSIC_LOOKAHEAD = 8;

/**
 * True when a script sets its own bed before it says anything.
 *
 * "Before it says anything" is the whole test: every shipped scene opens with `music(...)` in its first few steps
 * (`music(null)` counts: a post scene asking for silence is still the script deciding), so the flow's own cue only
 * applies to a script that never mentions music at all.
 */
export function scriptOpensWithMusic(script: StoryScript): boolean {
  for (const step of script.slice(0, MUSIC_LOOKAHEAD)) {
    if (step.type === 'music') return true;
    if (step.type === 'say' || step.type === 'narrate' || step.type === 'choice') return false;
  }
  return false;
}

/** Is this the first thing the player reads? (The dialogue box opens on a line, a narration or a choice.) */
const isSpoken = (step: Step): boolean => step.type === 'say' || step.type === 'narrate' || step.type === 'choice';

/** The music steps a step runs (a `parallel` runs its inner steps together), in order. */
function musicStepsIn(step: Step): Array<Extract<Step, { type: 'music' }>> {
  if (step.type === 'music') return [step];
  if (step.type === 'parallel') return step.steps.flatMap(musicStepsIn);
  return [];
}

/**
 * The cue playing when the opening scene's first line is spoken, or `null` when nothing is: the flow's own bed
 * (`music.scene`, unless the script sets its own within {@link MUSIC_LOOKAHEAD} steps), then every `music` step before the
 * first line in order, the last one standing. A conditional (`ifFlag`) or a `jump` before the first line is not followed:
 * the answer then stays at what the steps before it set (no shipped script has either).
 */
export function openingSceneCue(chapter: Chapter): string | null {
  if (chapter.game === 'ff7') return null; // the hidden FF7 experiment has its own flow
  const script = chapter.scriptsRef?.pre;
  if (!script?.length) return null; // no scene is shown
  let cue: string | null = scriptOpensWithMusic(script) ? null : chapter.music.scene;
  for (const step of script) {
    if (isSpoken(step)) break;
    for (const music of musicStepsIn(step)) cue = music.track;
    if (step.type === 'jump') break;
  }
  return cue && cue.length > 0 ? cue : null;
}
