/**
 * **The hidden 3D Bahamut ends the way Chapter IV does** (ch-yrp, 2026-11-02; **FFX-2 only**, AGENTS.md rule 14). The chapter is Chapter IV's fight by reference (`data/chapter-exp-yrp-3d.ts`), and three tables that decide how
 * that fight ends are keyed by chapter id, so a derived record that was not listed would have ended it with the generic FFX-2 flourish: a victory pose, quips and the fanfare of `victory-bahamut`, in a chapter whose card
 * says "Nobody cheers when this one is over". The sources are Chapter IV's: after Bahamut the girls do not pose and no fanfare plays (`research/ffx-vs-ffx2-presentation.md` section 2.2, `research/ffx2-bahamut.md`,
 * `research/writing-bible.md` section 5.4), and Bailey's 2026-10-21 pick "Quieter results for this fight" (`ui/common/quietResults.ts`). It is the driver's pick under Bailey's blanket yes of 2026-11-02, his to overturn;
 * the alternative is the generic results. What this pins:
 *
 * 1. **The same silent screen** (`isSilentResultsChapter`, `resultsScreenSilent`) and the same grim register as Chapter IV.
 * 2. **The same quiet cue and face**: the win plays `pause` (not `victory-bahamut`), Rikku's face is her Dark Knight head; a loss is the FFX-2 defeat cue, as in Chapter IV.
 * 3. **Nothing else moved**: the other chapters' answers are what they were (the digest in `docs/handoff/ch-yrp.md` section 5), and the sound pass's silent win (`?audio=new`, Chapters I and IV only) is not extended.
 */
import { describe, expect, it } from 'vitest';

import { PASS_SILENT_WIN } from '../../../src/audio/pass/passResults.ts';
import { DEFEAT_CUES, resultsCueFor, resultsScreenSilent } from '../../../src/app/screens/resultsMusic.ts';
import { CHAPTERS, EXPERIMENT_CHAPTERS, getChapter, UNLISTED_CHAPTERS } from '../../../src/data/encounters.ts';
import { EXP_YRP_ID } from '../../../src/data/yrp-ids.ts';
import { quietResultsOf } from '../../../src/ui/common/quietResults.ts';
import { GRIM_CHAPTER_IDS, isGrimChapter, isSilentResultsChapter } from '../../../src/ui/common/resultsMath.ts';

const yrp = getChapter(EXP_YRP_ID)!;
const four = getChapter('ffx2-bahamut')!;

describe('the hidden 3D Bahamut ends as Chapter IV does', () => {
  it('has a silent results screen and the grim register, like Chapter IV', () => {
    expect(isSilentResultsChapter(EXP_YRP_ID)).toBe(true);
    expect(isGrimChapter(EXP_YRP_ID)).toBe(true);
    expect(resultsScreenSilent(yrp)).toBe(resultsScreenSilent(four));
    expect(yrp.music.victory).toBe(four.music.victory); // the same record by reference: the cue the quiet table then replaces
  });

  it('plays Chapter IV\'s quiet cue on a win (pause, not victory-bahamut) and the FFX-2 defeat cue on a loss', () => {
    expect(resultsCueFor(yrp, 'victory')).toEqual(resultsCueFor(four, 'victory'));
    expect(resultsCueFor(yrp, 'victory')?.cue).toBe('pause');
    expect(resultsCueFor(yrp, 'defeat')?.cue).toBe(DEFEAT_CUES.ffx2);
    expect(resultsCueFor(yrp, 'escape')).toBeNull();
  });

  it('shows Chapter IV\'s calmer face for Rikku', () => {
    expect(quietResultsOf(EXP_YRP_ID)).toEqual(quietResultsOf('ffx2-bahamut'));
    expect(quietResultsOf(EXP_YRP_ID)?.bodyFaces).toEqual(['rikku']);
  });

  it('is FFX-2 only: no FFX chapter is silent, grim by this table or quiet because of it', () => {
    expect(yrp.game).toBe('ffx2');
    expect(getChapter(EXP_YRP_ID)?.game).toBe('ffx2');
    for (const c of [...CHAPTERS, ...UNLISTED_CHAPTERS, ...EXPERIMENT_CHAPTERS].filter((x) => x.game === 'ffx')) {
      expect(isSilentResultsChapter(c.id), c.id).toBe(false);
      expect(quietResultsOf(c.id), c.id).toBeNull();
    }
    expect([...GRIM_CHAPTER_IDS].filter((id) => getChapter(id)?.game === 'ffx2').sort()).toEqual(['exp-yrp-3d', 'ffx2-bahamut']);
  });

  it('leaves every other FFX-2 chapter\'s results as they were', () => {
    for (const c of [...CHAPTERS, ...UNLISTED_CHAPTERS, ...EXPERIMENT_CHAPTERS].filter((x) => x.game === 'ffx2' && x.id !== 'ffx2-bahamut' && x.id !== EXP_YRP_ID)) {
      expect(isSilentResultsChapter(c.id), c.id).toBe(false);
      expect(quietResultsOf(c.id), c.id).toBeNull();
    }
  });

  it('does not extend the sound pass\'s silent win (a demo-only switch for Chapters I and IV)', () => {
    expect([...PASS_SILENT_WIN]).toEqual(['ffx2-bahamut']);
  });
});
