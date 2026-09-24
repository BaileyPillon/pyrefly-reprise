// @vitest-environment jsdom
/**
 * **Under `?wait=hold` the coach says what the hold does, not what the split does.**
 *
 * Bailey's three Wait lines (2026-09-24, D-121) say the top-level list runs:
 * true of Wait's split, the default since D-029 follow-up 2, and false under the
 * `?wait=hold` comparison switch, which holds the top-level list too. The
 * verifier of the default flip reproduced "Gauges running · a list holds them"
 * over a held top list in chapter 4 at 1600x900. The coach now follows the
 * clock in force (`coachState.ffx2CoachClock`): the split's lines by default and
 * with `?wait=split`, the pre-split Wait lines under `?wait=hold`, Bailey's
 * Active lines under Active whatever the URL says. FFX-2 only in content.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { waitSplitFromUrl, waitSplitInForce } from '../../src/app/waitSplitSwitch.ts';
import { waitSplitFromUrl as wiringWaitSplitFromUrl } from '../../src/app/screens/BattleScreenWiring.ts';
import { SaveStore } from '../../src/app/SaveData.ts';
import { DEFAULT_WAIT_SPLIT } from '../../src/battle/ffx2/index.ts';
import { Briefing } from '../../src/ui/coach/Briefing.ts';
import { CoachMark } from '../../src/ui/coach/CoachMark.ts';
import {
  BRIEFING_HOLD_LINE,
  BRIEFING_LINES,
  BRIEFING_WAIT_LINE,
  briefingLines,
  COACH_RUNNING_BADGE_ACTIVE,
  COACH_RUNNING_BADGE_HOLD,
  COACH_RUNNING_BADGE_WAIT,
  coachRunningBadge,
  FFX2_GAUGE_BODY_ACTIVE,
  FFX2_GAUGE_BODY_HOLD,
  FFX2_GAUGE_BODY_WAIT,
  ffx2GaugeBody,
  markById,
} from '../../src/ui/coach/coachCopy.ts';
import { ffx2CoachClock, resetCoach, setOnboardingLive } from '../../src/ui/coach/coachState.ts';

function memoryStorage(): Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> {
  const map = new Map<string, string>();
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => void map.set(k, v),
    removeItem: (k) => void map.delete(k),
  };
}

const text = (l: { lead: string; strong: string; tail: string }): string => l.lead + l.strong + l.tail;
const setUrl = (search: string): void => window.history.replaceState({}, '', `/${search}`);

describe('copy: three clocks, three sets of words', () => {
  it('hold reads the pre-split Wait words; wait reads Bailey’s D-121 picks; active his approved lines', () => {
    expect(ffx2GaugeBody('hold')).toBe(FFX2_GAUGE_BODY_HOLD);
    // Bailey's D-030 pick, verbatim, chosen for the whole-menu hold.
    expect(FFX2_GAUGE_BODY_HOLD).toBe("“Bar's full, she's up! Take your time, nobody moves while you're picking.”");
    expect(ffx2GaugeBody('wait')).toBe(FFX2_GAUGE_BODY_WAIT);
    expect(ffx2GaugeBody('active')).toBe(FFX2_GAUGE_BODY_ACTIVE);

    expect(coachRunningBadge('hold')).toBe(COACH_RUNNING_BADGE_HOLD);
    expect(COACH_RUNNING_BADGE_HOLD).toBe('Menu&rsquo;s up &middot; gauges holding');
    expect(COACH_RUNNING_BADGE_HOLD, 'the hold never claims a running gauge').not.toMatch(/running/i);
    expect(coachRunningBadge('wait')).toBe(COACH_RUNNING_BADGE_WAIT);
    expect(coachRunningBadge('active')).toBe(COACH_RUNNING_BADGE_ACTIVE);

    const hold = briefingLines('hold');
    expect(hold.slice(0, 3)).toStrictEqual(BRIEFING_LINES.slice(0, 3));
    expect(text(hold[3]!)).toBe('In hers, the clock holds while you choose.”');
    expect(text(briefingLines('wait')[3]!)).toBe('In hers, the clock does not wait. A list stops it.”');
    expect(briefingLines('active')).toStrictEqual(BRIEFING_LINES);
  });
});

describe('the clock in force: the URL switch over the engine default, Active over both', () => {
  let save: SaveStore;
  beforeEach(() => {
    save = new SaveStore('k', memoryStorage());
  });
  afterEach(() => setUrl(''));

  it('one switch, read in one place: the wiring re-exports it', () => {
    expect(wiringWaitSplitFromUrl).toBe(waitSplitFromUrl);
    expect(DEFAULT_WAIT_SPLIT).toBe(true);
    expect(waitSplitInForce('')).toBe(true);
    expect(waitSplitInForce('?wait=split')).toBe(true);
    expect(waitSplitInForce('?coach=off&wait=hold')).toBe(false);
    expect(waitSplitInForce('?wait=nonsense')).toBe(DEFAULT_WAIT_SPLIT);
  });

  it('Wait with no switch or ?wait=split is the split; ?wait=hold is the hold', () => {
    save.setSettings({ ffx2Atb: 'wait' });
    setUrl('');
    expect(ffx2CoachClock()).toBe('wait');
    setUrl('?wait=split');
    expect(ffx2CoachClock()).toBe('wait');
    setUrl('?wait=hold');
    expect(ffx2CoachClock()).toBe('hold');
  });

  it('Active is Active whatever the URL says (the switch only changes Wait)', () => {
    save.setSettings({ ffx2Atb: 'active' });
    setUrl('?wait=hold');
    expect(ffx2CoachClock()).toBe('active');
    setUrl('');
    expect(ffx2CoachClock()).toBe('active');
  });
});

describe('on screen under ?wait=hold', () => {
  let root: HTMLElement;
  beforeEach(() => {
    vi.useFakeTimers();
    document.body.innerHTML = '';
    root = document.createElement('div');
    document.body.appendChild(root);
    resetCoach();
    setOnboardingLive(true);
    new SaveStore('k', memoryStorage()).setSettings({ ffx2Atb: 'wait' });
  });
  afterEach(() => {
    setUrl('');
    vi.useRealTimers();
  });

  const shownLine4 = (): string | undefined =>
    Array.from(root.querySelectorAll<HTMLElement>('.coach-brief__line')).map((n) => n.textContent ?? '')[3];
  const badge = (): string | undefined => root.querySelector('.coach-mark__running')?.textContent ?? undefined;

  it('the briefing shows the hold line under ?wait=hold and Bailey’s Wait line by default', () => {
    setUrl('?wait=hold');
    const held = new Briefing({ root, reduceMotion: true });
    void held.show();
    expect(shownLine4()).toBe(text(BRIEFING_HOLD_LINE));
    expect(root.querySelector('.coach-brief__line:nth-child(4) b')?.textContent).toBe(BRIEFING_HOLD_LINE.strong);
    held.skip();

    root.innerHTML = '';
    setUrl('');
    const split = new Briefing({ root, reduceMotion: true });
    void split.show();
    expect(shownLine4()).toBe(text(BRIEFING_WAIT_LINE));
    split.skip();
  });

  it('the running badge says "gauges holding" under ?wait=hold and Bailey’s words by default', () => {
    const mark = markById('ffx2-gauge');
    expect(mark).not.toBeNull();
    setUrl('?wait=hold');
    const held = new CoachMark({ root, mark: mark!, game: 'ffx2', reduceMotion: true });
    void held.show();
    expect(badge()).toBe('Menu’s up · gauges holding');
    held.dismiss();

    root.innerHTML = '';
    setUrl('');
    const split = new CoachMark({ root, mark: mark!, game: 'ffx2', reduceMotion: true });
    void split.show();
    expect(badge()).toBe('Gauges running · a list holds them');
    split.dismiss();
  });
});
