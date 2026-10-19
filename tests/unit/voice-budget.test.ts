/**
 * A mid-battle beat costed with recorded voice. A spoken line can outlast its typed text, so the registry's duration model takes an
 * optional `spokenMs`; with none (or 0 for every line, voice off) nothing changes. The policy for a beat that passes its budget
 * once voiced is `src/story/voice/voiceBudget.ts`. Game case: both (shared plumbing); the shipped FFX beats are checked in
 * `audio-voice-shipped.test.ts` against the real recordings.
 */
import { describe, expect, it } from 'vitest';

import {
  BLOCKING_LINE_MS,
  CHAPTER_KEYS,
  MID_LINE_HOLD_MS,
  MID_SCRIPT_BUDGET_MS,
  OVERRUN_GRACE_MS,
  PRESENTER_BUDGET_MS,
  SEAM_BUDGET_MS,
  STORY_CHAPTERS,
  midBattleDeadlineMs,
  scriptDurationMs,
} from '../../src/story/registry.ts';
import { ifFlag, parallel, say, wait } from '../../src/story/dsl.ts';
import { VOICED_EXTEND_MS, VOICED_EXTEND_SEAM_MS, beatVerdict } from '../../src/story/voice/voiceBudget.ts';
import { typingDurationMs } from '../../src/ui/common/typewriter.ts';

const typed = (text: string, auto = MID_LINE_HOLD_MS) => typingDurationMs(text) + auto;

describe('the duration model with voice', () => {
  it('is exactly what it was when no voice is asked for, or none is spoken, in every chapter\'s every mid-battle script', () => {
    let checked = 0;
    for (const chapter of CHAPTER_KEYS) {
      for (const script of Object.values(STORY_CHAPTERS[chapter].midScripts)) {
        const plain = scriptDurationMs(script, MID_LINE_HOLD_MS);
        expect(scriptDurationMs(script, MID_LINE_HOLD_MS, () => 0)).toBe(plain);
        expect(scriptDurationMs(script)).toBe(scriptDurationMs(script, BLOCKING_LINE_MS, undefined));
        expect(midBattleDeadlineMs(script, () => 0)).toBe(midBattleDeadlineMs(script));
        checked++;
      }
    }
    expect(checked).toBeGreaterThan(100);
  });

  it('charges a spoken line the longer of its typed length and its voice', () => {
    const line = say('tidus', 'Hey! Over here!', { auto: 1200 });
    expect(scriptDurationMs([line], MID_LINE_HOLD_MS, () => 5000)).toBe(5000);
    expect(scriptDurationMs([line], MID_LINE_HOLD_MS, () => 100)).toBeCloseTo(typed(line.text, 1200), 5);
  });

  it('adds spoken lines up, takes the longest leg of a parallel and the longer branch of an ifFlag', () => {
    const a = say('tidus', 'A.', { auto: 100 });
    const b = say('yuna', 'B.', { auto: 100 });
    const spoken = (s: { text: string }) => (s.text === 'A.' ? 2000 : 3000);
    expect(scriptDurationMs([a, b], MID_LINE_HOLD_MS, spoken)).toBe(5000);
    expect(scriptDurationMs([parallel(a, b)], MID_LINE_HOLD_MS, spoken)).toBe(3000);
    expect(scriptDurationMs([ifFlag('f', [a], [b, wait(500)])], MID_LINE_HOLD_MS, spoken)).toBe(3500);
  });
});

describe('the deadline a voiced beat is given', () => {
  const line = say('tidus', 'Hey!', { auto: 1200 });

  it('keeps the flat 8 s while the voiced beat fits it', () => {
    expect(midBattleDeadlineMs([line], () => 3000)).toBe(MID_SCRIPT_BUDGET_MS);
  });

  it('gives a beat whose voice outlasts 8 s its voiced length plus the grace, rather than cutting a sentence off', () => {
    expect(midBattleDeadlineMs([line], () => 9500)).toBe(9500 + OVERRUN_GRACE_MS);
  });

  it('keeps the cap a hard cap: an interrupt is never stretched more than the allowance, however long the recording', () => {
    expect(midBattleDeadlineMs([line], () => 90_000)).toBe(MID_SCRIPT_BUDGET_MS + VOICED_EXTEND_MS + OVERRUN_GRACE_MS);
  });

  it('gives a chain seam its authored length, or its voiced length up to a seam allowance, plus the grace, under what the presenter will wait', () => {
    const seam = [wait(20_000), line]; // authored 21.3 s: a seam by length
    expect(midBattleDeadlineMs(seam)).toBe(typed('Hey!') + 20_000 + OVERRUN_GRACE_MS);
    expect(midBattleDeadlineMs(seam, () => 30_000)).toBe(SEAM_BUDGET_MS + VOICED_EXTEND_SEAM_MS + OVERRUN_GRACE_MS);
    // the seam allowance is for a spoken line that lengthens the beat; a voice that adds nothing leaves a long seam exactly as it was
    const longSeam = [wait(27_000)];
    expect(midBattleDeadlineMs(longSeam, () => 0)).toBe(midBattleDeadlineMs(longSeam));
    expect(SEAM_BUDGET_MS + VOICED_EXTEND_SEAM_MS + OVERRUN_GRACE_MS).toBeLessThan(PRESENTER_BUDGET_MS);
    expect(MID_SCRIPT_BUDGET_MS + VOICED_EXTEND_MS + OVERRUN_GRACE_MS).toBeLessThan(PRESENTER_BUDGET_MS);
  });
});

describe('what the ship step does with a voiced beat', () => {
  it('fits inside the budget; is extended up to 3 s past an 8 s beat (1.5 s past a seam); is refused beyond that', () => {
    expect(beatVerdict(7900, 8000, false)).toBe('fits');
    expect(beatVerdict(8000, 8000, false)).toBe('fits');
    expect(beatVerdict(8001, 8000, false)).toBe('extended');
    expect(beatVerdict(8000 + VOICED_EXTEND_MS, 8000, false)).toBe('extended');
    expect(beatVerdict(8001 + VOICED_EXTEND_MS, 8000, false)).toBe('over');
    expect(beatVerdict(26_000 + VOICED_EXTEND_SEAM_MS, 26_000, true)).toBe('extended');
    expect(beatVerdict(26_001 + VOICED_EXTEND_SEAM_MS, 26_000, true)).toBe('over');
  });
});
