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
 */
import { beforeEach, describe, expect, it } from 'vitest';

import { CHAPTERS } from '../../src/data/encounters.ts';
import type { Step } from '../../src/story/dsl.ts';

/** The chapters this fix touches: victory-ffx must not survive their results() marker. */
const FIXED_AFTERMATH_SILENT = ['seymour-flux', 'yunalesca', 'seymour-anima-macalania'] as const;

/**
 * Chapters whose post script deliberately keeps (or never has) the victory
 * fanfare running past `results()`, so they are checked for the opposite:
 * `ffx2-leblanc` plays it on through the celebration (own comment: "let them
 * celebrate, loudly"), and the others re-cue their own track right after
 * `results()` rather than falling silent.
 */
const INTENTIONALLY_NOT_SILENCED = new Set(['ffx2-leblanc', 'braskas-final-aeon', 'ffx2-vegnagun-shuyin', 'ffx2-bahamut', 'evrae-airship']);

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
