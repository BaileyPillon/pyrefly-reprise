// @vitest-environment jsdom
/**
 * dbd48ed7 (both): `showResults()` (`src/app/screens/BattleScreenFlow.ts`)
 * starts the chapter's `victory` track on its own once the results tally
 * shows, the way every chapter's fanfare does. Three post scripts —
 * `seymour-flux.ts`, `yunalesca.ts` and `seymour-anima-macalania.ts` — only
 * silenced the music *before* their `results()` marker, so `victory-ffx` then
 * bled uncut through the whole rest of the aftermath (Flux's failed sending
 * and the "Sin is Jecht" reveal, Yunalesca "thinning like frost", and Anima
 * Macalania's deliberately flat, anticlimactic kill — §9.7: "the party wins
 * cleanly and loses completely"). The fix adds `music(null, 300)` right after
 * each `results()` step, mirroring `evrae-airship.ts`'s existing cut.
 *
 * This walks each chapter's real `post` script through the actual
 * `music`/`say`/`narrate` steps (the same shape `CutsceneRunner` plays) and
 * checks what is "current" once the scene resumes past the results tally —
 * the fanfare must not still be sounding under any of those lines.
 *
 * FOC45-01 (2026-10-13, the focused review of d5bf2206; FFX-2 only): music batch 2 gave Chapter IV a results cue of its own
 * (`victory-bahamut`), so its script's `music(null, 700)` before `results(true)` no longer left the scene after the tally silent:
 * the quiet resolve looped on under every line. The same gap stood in the two FFX-2 posts that open their scene on a cue of
 * its own and then show the tally mid-scene (Chapter XI's Glen, Chapter XV's way out of the Den): `victory-ffx2` replaced the
 * bed at the tally and nothing put it back. Chapter IV now cuts its cue after the tally, and XI and XV put their bed back.
 */
import { beforeEach, describe, expect, it } from 'vitest';

import { CHAPTERS } from '../../src/data/encounters.ts';
import type { Step } from '../../src/story/dsl.ts';

/** The chapters this fix touches: victory-ffx must not survive their results() marker. */
const FIXED_AFTERMATH_SILENT = ['seymour-flux', 'yunalesca', 'seymour-anima-macalania', 'ffx2-bahamut', 'ffx2-fallen-aeons', 'ffx2-den-of-woe'] as const;

/**
 * Chapters whose post script deliberately keeps (or never has) the victory
 * fanfare running past `results()`, so they are checked for the opposite:
 * `ffx2-leblanc` plays it on through the celebration (own comment: "let them
 * celebrate, loudly"), and the others re-cue their own track right after
 * `results()` rather than falling silent.
 */
const INTENTIONALLY_NOT_SILENCED = new Set(['ffx2-leblanc', 'braskas-final-aeon', 'ffx2-vegnagun-shuyin', 'evrae-airship']);

/** Replays `steps`, returning the music track "current" after each spoken line. */
function tracksUnderSpokenLines(steps: readonly Step[]): Array<string | null> {
  let current: string | null = null;
  const under: Array<string | null> = [];
  for (const step of steps) {
    if (step.type === 'music') current = step.track;
    else if (step.type === 'say' || step.type === 'narrate') under.push(current);
    else if (step.type === 'parallel') under.push(...tracksUnderSpokenLines(step.steps));
  }
  return under;
}

describe('music after the results tally — dbd48ed7', () => {
  let chapterById: Map<string, (typeof CHAPTERS)[number]>;

  beforeEach(() => {
    chapterById = new Map(CHAPTERS.map((c) => [c.id, c]));
  });

  it.each(FIXED_AFTERMATH_SILENT)('%s cuts victory-ffx before any line past results()', (id) => {
    const chapter = chapterById.get(id);
    expect(chapter, `${id} is not a registered chapter`).toBeDefined();
    const post = chapter!.scriptsRef.post;
    const marker = post.findIndex((s) => s.type === 'results');
    expect(marker, `${id}'s post script has no results() marker`).toBeGreaterThanOrEqual(0);

    // What showResults() would have playing once the tally shows: the
    // chapter's own `victory` track (this is what the bug let bleed through).
    const victoryTrack = chapter!.music.victory;
    expect(victoryTrack, `${id} has no victory track configured`).toBeTruthy();

    // Simulate showResults() starting that track right at the marker, the way
    // the real flow does, then replay the rest of the script.
    const afterMarker: Step[] = [{ type: 'music', track: victoryTrack!, fade: 0 }, ...post.slice(marker + 1)];
    const tracksUnderLines = tracksUnderSpokenLines(afterMarker);
    expect(tracksUnderLines.length, `${id} authors no lines after results()`).toBeGreaterThan(0);
    for (const track of tracksUnderLines) {
      expect(track, `${id}: a line after results() still has ${track} playing`).not.toBe(victoryTrack);
    }
  });

  it('does not touch chapters whose aftermath deliberately keeps or omits the fanfare', () => {
    for (const id of INTENTIONALLY_NOT_SILENCED) {
      expect(FIXED_AFTERMATH_SILENT as readonly string[]).not.toContain(id);
    }
  });
});

describe('FFX-2 posts after the tally (FOC45-01, FFX-2 only)', () => {
  const post = (id: string): readonly Step[] => CHAPTERS.find((c) => c.id === id)!.scriptsRef.post;
  /** The music step that follows the results() marker before any line is spoken, or null when a line comes first. */
  const firstMusicAfterTally = (steps: readonly Step[]): Extract<Step, { type: 'music' }> | null => {
    const marker = steps.findIndex((s) => s.type === 'results');
    for (const step of steps.slice(marker + 1)) {
      if (step.type === 'music') return step;
      if (step.type === 'say' || step.type === 'narrate') return null;
    }
    return null;
  };

  it('Chapter IV cuts its own results cue the moment the scene resumes, as the FFX posts do, and its tally stays silent', () => {
    const ch = CHAPTERS.find((c) => c.id === 'ffx2-bahamut')!;
    expect(ch.music.victory).toBe('victory-bahamut');
    const steps = post('ffx2-bahamut');
    const marker = steps.findIndex((s) => s.type === 'results');
    expect(steps[marker]).toMatchObject({ type: 'results', silent: true });
    const cut = firstMusicAfterTally(steps);
    expect(cut, 'a music step comes first after the tally').not.toBeNull();
    expect(cut!.track).toBeNull();
    expect(cut!.fade).toBe(300); // the FFX posts' own number
    // The cut is the step right after the marker (nothing is staged or spoken under the cue before it).
    expect(steps[marker + 1]).toBe(cut);
  });

  it.each([
    ['ffx2-fallen-aeons', 'scene-farplane'],
    ['ffx2-den-of-woe', 'scene-bevelle-underground'],
  ] as const)('%s puts its scene bed back right after the tally (the bed it opened the scene with)', (id, bed) => {
    const steps = post(id);
    const opening = steps.find((s) => s.type === 'music') as Extract<Step, { type: 'music' }>;
    expect(opening.track).toBe(bed);
    const back = firstMusicAfterTally(steps);
    expect(back?.track).toBe(bed);
    expect(steps[steps.findIndex((s) => s.type === 'results') + 1]).toBe(back);
  });

  it('leaves the FFX-2 posts it was not asked to change as they were: Chapter VI celebrates, Chapter V re-cues its ending, Chapters XVI and the Experiment already cut', () => {
    // VI: "let them celebrate, loudly" - the victory cue plays on under the first lines, then its own scene cue arrives.
    expect(firstMusicAfterTally(post('ffx2-leblanc'))).toBeNull();
    // V: the ending cue is the first music after the tally (behind a fade to black).
    expect(firstMusicAfterTally(post('ffx2-vegnagun-shuyin'))?.track).toBe('ending-ffx2');
    // XVI and the Experiment cut the cue themselves (before this change).
    expect(firstMusicAfterTally(post('ffx2-ixion-djose'))?.track).toBeNull();
    // XIII: the post is unscored and has one line after the tally; left as it was (the handoff lists it for the driver).
    expect(firstMusicAfterTally(post('ffx2-trema'))).toBeNull();
  });
});
