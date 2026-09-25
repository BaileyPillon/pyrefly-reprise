// @vitest-environment jsdom
/**
 * **The briefing's fourth line says what the player's own X-2 clock does.**
 *
 * Bailey, 2026-09-23 00:00 EDT (`docs/target/decisions.json` D-029, follow-up 3):
 * *"1, 2, 3 I'll take your recommendations on all please"* — B + C: his approved
 * line, "In hers, the clock does not wait", is shown **only** when the save's
 * `ffx2Atb` is `'active'` at the moment the briefing is shown; under Wait a new
 * line in the same voice says what the build does (the clock holds while a
 * command menu is open). The Wait line is the agent's draft, recorded as
 * INFERRED on tile C1 in `docs/target/targets.json`.
 *
 * FFX-2 only in content (line 4 is the sentence about FFX-2's clock); lines 1-3,
 * FFX's included, never change.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Briefing } from '../../src/ui/coach/Briefing.ts';
import {
  BRIEFING_LINES,
  BRIEFING_WAIT_LINE,
  briefingLines,
  countWord,
  playableChapterCount,
} from '../../src/ui/coach/coachCopy.ts';
import { resetCoach, setOnboardingLive } from '../../src/ui/coach/coachState.ts';
import { SaveStore } from '../../src/app/SaveData.ts';

function memoryStorage(): Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> {
  const map = new Map<string, string>();
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => void map.set(k, v),
    removeItem: (k) => void map.delete(k),
  };
}

const text = (l: { lead: string; strong: string; tail: string }): string => l.lead + l.strong + l.tail;

function shownLines(root: HTMLElement): string[] {
  return Array.from(root.querySelectorAll<HTMLElement>('.coach-brief__line')).map((n) => n.textContent ?? '');
}

describe('copy: the mode-aware fourth line', () => {
  it('Bailey’s approved four lines are untouched, word for word — line 1’s count is live (D-136)', () => {
    // D-136 (2026-09-25): the hard-coded "Five" is superseded by the live
    // count of playable chapters; "That is all this is." and the rest never change.
    expect(BRIEFING_LINES.map(text)).toStrictEqual([
      `“${countWord(playableChapterCount())} fights. That is all this is.`,
      'In the FFX fights, nothing moves until you act.',
      'Take your time.',
      'In the FFX-2 fights, the clock keeps running, even while you choose.”',
    ]);
  });

  it('Active reads his line; Wait swaps only line 4 for the Wait line', () => {
    expect(briefingLines('active')).toStrictEqual(BRIEFING_LINES);
    const wait = briefingLines('wait');
    expect(wait).toHaveLength(4);
    expect(wait.slice(0, 3)).toStrictEqual(BRIEFING_LINES.slice(0, 3));
    expect(wait[3]).toStrictEqual(BRIEFING_WAIT_LINE);
    // Bailey's pick, verbatim (2026-09-24, draft 2a, D-121): his approved
    // gold half, then four plain words that make it true under the Wait split.
    // D-136 (2026-09-25) reworded the tail again: "Choosing a command stops
    // it." supersedes "A list stops it." — Bailey did not want the command
    // menu called a list.
    expect(text(BRIEFING_WAIT_LINE)).toBe('In the FFX-2 fights, the clock keeps running until you pick a command. Then it waits while you choose.”');
    expect(BRIEFING_WAIT_LINE.strong).toBe(BRIEFING_LINES[3]!.strong);
    expect(BRIEFING_WAIT_LINE).not.toStrictEqual(BRIEFING_LINES[3]);
  });

  it('the Wait line has the approved line’s shape: same lead, the same gold half, the closing quote', () => {
    const approved = BRIEFING_LINES[3]!;
    expect(BRIEFING_WAIT_LINE.lead).toBe(approved.lead);
    expect(BRIEFING_WAIT_LINE.strong).toBe(approved.strong);
    // D-181 (2026-09-25, option A): the Wait tail says when the clock stops, so it no longer shares the Active tail's first character.
    expect(BRIEFING_WAIT_LINE.tail.endsWith('”')).toBe(true);
    // Still one briefing line. The 60-character cap the original drafts were
    // written to (docs/concepts/coach/wait-split-lines.md, "Constraints
    // used") governed D-121's three candidate lines; D-136 (2026-09-25) is
    // Bailey's own verbatim replacement wording, not a re-run of that draft
    // exercise, and it runs 3 characters past that cap ("Choosing a command
    // stops it." reads longer than "A list stops it."). Applied exactly as
    // given rather than trimmed to fit a constraint that was never his own.
    // D-181 (2026-09-25): Bailey picked option A, a longer and plainer line that
    // wraps inside the briefing panel (checked at 1600x900, 1280x720 and 390x844).
    expect(text(BRIEFING_WAIT_LINE).length).toBeLessThanOrEqual(110);
  });
});

describe('the briefing reads the mode when it is shown', () => {
  let root: HTMLElement;
  let save: SaveStore;

  beforeEach(() => {
    vi.useFakeTimers();
    document.body.innerHTML = '';
    root = document.createElement('div');
    document.body.appendChild(root);
    resetCoach();
    setOnboardingLive(true);
    save = new SaveStore('k', memoryStorage());
  });

  it('a fresh save (Wait) shows the Wait line', () => {
    const b = new Briefing({ root, reduceMotion: true });
    void b.show();
    const lines = shownLines(root);
    expect(lines).toHaveLength(4);
    expect(lines[3]).toBe(text(BRIEFING_WAIT_LINE));
    expect(lines[3]).toBe('In the FFX-2 fights, the clock keeps running until you pick a command. Then it waits while you choose.”');
    b.skip();
  });

  it('with ACTIVE set, it shows Bailey’s approved line', () => {
    save.setSettings({ ffx2Atb: 'active' });
    const b = new Briefing({ root, reduceMotion: true });
    void b.show();
    expect(shownLines(root)[3]).toBe('In the FFX-2 fights, the clock keeps running, even while you choose.”');
    b.skip();
  });

  it('the mode at show time wins over the mode at construction (a flip in the same pause)', () => {
    const b = new Briefing({ root, reduceMotion: true });
    save.setSettings({ ffx2Atb: 'active' });
    void b.show();
    expect(shownLines(root)[3]).toBe('In the FFX-2 fights, the clock keeps running, even while you choose.”');
    b.skip();
    save.setSettings({ ffx2Atb: 'wait' });
    const again = new Briefing({ root, reduceMotion: true });
    void again.show();
    expect(shownLines(root)[3]).toBe(text(BRIEFING_WAIT_LINE));
    again.skip();
  });

  it('the gold half is the emphasised part in both modes', () => {
    save.setSettings({ ffx2Atb: 'wait' });
    const b = new Briefing({ root, reduceMotion: true });
    void b.show();
    const golds = Array.from(root.querySelectorAll('.coach-brief__line b')).map((n) => n.textContent);
    expect(golds).toStrictEqual(['nothing moves until you act', BRIEFING_WAIT_LINE.strong]);
    b.skip();
  });
});
