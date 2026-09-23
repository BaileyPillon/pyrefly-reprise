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
  it('Bailey’s approved four lines are untouched, word for word', () => {
    expect(BRIEFING_LINES.map(text)).toStrictEqual([
      '“Five fights. That is all this is.',
      'In mine, nothing moves until you move —',
      'read the list, take your time.',
      'In hers, the clock does not wait.”',
    ]);
  });

  it('Active reads his line; Wait swaps only line 4 for the Wait line', () => {
    expect(briefingLines('active')).toStrictEqual(BRIEFING_LINES);
    const wait = briefingLines('wait');
    expect(wait).toHaveLength(4);
    expect(wait.slice(0, 3)).toStrictEqual(BRIEFING_LINES.slice(0, 3));
    expect(wait[3]).toStrictEqual(BRIEFING_WAIT_LINE);
    expect(text(BRIEFING_WAIT_LINE)).toBe('In hers, the clock holds while you choose.”');
    expect(text(BRIEFING_WAIT_LINE)).not.toContain('does not wait');
  });

  it('the Wait line has the approved line’s shape: same lead, a gold half, the closing quote', () => {
    const approved = BRIEFING_LINES[3]!;
    expect(BRIEFING_WAIT_LINE.lead).toBe(approved.lead);
    expect(BRIEFING_WAIT_LINE.tail).toBe(approved.tail);
    expect(BRIEFING_WAIT_LINE.strong.length).toBeGreaterThan(0);
    // Same length class: within a few characters of his line.
    expect(Math.abs(text(BRIEFING_WAIT_LINE).length - text(approved).length)).toBeLessThanOrEqual(12);
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
    expect(root.textContent).not.toContain('the clock does not wait');
    b.skip();
  });

  it('with ACTIVE set, it shows Bailey’s approved line', () => {
    save.setSettings({ ffx2Atb: 'active' });
    const b = new Briefing({ root, reduceMotion: true });
    void b.show();
    expect(shownLines(root)[3]).toBe('In hers, the clock does not wait.”');
    b.skip();
  });

  it('the mode at show time wins over the mode at construction (a flip in the same pause)', () => {
    const b = new Briefing({ root, reduceMotion: true });
    save.setSettings({ ffx2Atb: 'active' });
    void b.show();
    expect(shownLines(root)[3]).toBe('In hers, the clock does not wait.”');
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
    expect(golds).toStrictEqual(['nothing moves until you move', BRIEFING_WAIT_LINE.strong]);
    b.skip();
  });
});
