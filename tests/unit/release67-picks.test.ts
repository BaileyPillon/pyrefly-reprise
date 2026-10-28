// @vitest-environment jsdom
/**
 * Release 67: Bailey's three look picks are the defaults (the driver's call under his delegation, 2026-10-28; his to overturn).
 *
 * | word | pick (the default) | release 66's look | where it plays (unchanged by the flip) |
 * |---|---|---|---|
 * | `?stance=` (MF-05, both games) | `v1a` | `today` | the two pack chapters (Chapter I FFX, Chapter IV FFX-2), a desktop-class screen, the pack on |
 * | `?swapcause=` (MF-06, both games) | `pick` | `today` | the same |
 * | `?hit=` (MF-03, both games) | `knock` | `today` | every chapter of both games (the word was never pack-gated) |
 *
 * Pinned here: the three defaults; that `?stance=today&swapcause=today&hit=today` reads release 66's defaults and, through the real readers, release 66's LOOK (the stance, the cause and the hit
 * decisions the presenter asks the modules); that each flip reaches exactly the scope it had (pack chapters only for the two swap words, `?pack=off`, a phone and no page leave release 66's look; `?swapscope`
 * still widens); and that the other swap words did not move (`?swapclass`, `?swapscope`, `?interlude`). Each lane's own tests pin the looks in depth. The one place to change a pick is named in
 * `docs/handoff/r67-picks.md`.
 *
 * Game case: both (shared plumbing; the stance and cause looks play in Chapter I FFX and Chapter IV FFX-2, the hit in every chapter of both games).
 */
import { afterEach, describe, expect, it } from 'vitest';
import { setDemoChapter, setPackScreen } from '../../src/engine/motion/DemoGate.ts';
import { MOVE_DEFAULTS, MOVE_WORDS, moveDefault, moveWord, moveWordFromSearch, setMoveWord, type MoveKey } from '../../src/engine/motion/MoveSwitch.ts';
import {
  CAUSE_DEFAULT,
  COVERED,
  STANCE_DEFAULT,
  SWAP_CLASSES,
  causeFromSearch,
  causeMode,
  classesFromSearch,
  interludeMode,
  menuKeepsIdle,
  scopeFromSearch,
  setCauseMode,
  setStanceMode,
  setSwapScope,
  stanceFromSearch,
  stanceMode,
  stanceNow,
  swapHow,
  swapScope,
  windUpOnIdle,
  setInterludeMode,
} from '../../src/engine/motion/SwapSwitch.ts';

/** Point the page at an address and make every switch read it again (they read once, like the other URL switches). */
function visit(search: string): void {
  window.history.pushState({}, '', `/${search}`);
  setStanceMode(null);
  setCauseMode(null, null);
  setSwapScope(null);
  setInterludeMode(null);
  for (const k of Object.keys(MOVE_WORDS) as MoveKey[]) setMoveWord(k, null);
}

afterEach(() => {
  visit('');
  setDemoChapter(undefined);
  setPackScreen(null);
});

const CH1 = 'seymour-flux';
const CH4 = 'ffx2-bahamut';
const ELSEWHERE = 'yunalesca';
const UNCOVERED = SWAP_CLASSES.filter((c) => !COVERED.has(c));

/** What the presenter asks the modules in the running chapter: the whole of the three looks, as data. */
function lookNow(): { stance: string; menuKeepsIdle: boolean; windUpOnIdle: boolean; cause: Record<string, string>; hit: string } {
  return {
    stance: stanceNow(),
    menuKeepsIdle: menuKeepsIdle(),
    windUpOnIdle: windUpOnIdle(),
    cause: Object.fromEntries(SWAP_CLASSES.map((c) => [c, swapHow(c)])),
    hit: moveWord('hit'),
  };
}

const RELEASE_66 = {
  stance: 'today',
  menuKeepsIdle: false,
  windUpOnIdle: false,
  cause: Object.fromEntries(SWAP_CLASSES.map((c) => [c, 'today'])),
  hit: 'today',
};

const PICKS = {
  stance: 'v1a',
  menuKeepsIdle: true,
  windUpOnIdle: false,
  cause: Object.fromEntries(SWAP_CLASSES.map((c) => [c, COVERED.has(c) ? 'cut' : 'blend3'])),
  hit: 'knock',
};

describe('the three picks are the defaults', () => {
  it('the constants name Bailey\'s letters', () => {
    expect(STANCE_DEFAULT).toBe('v1a');
    expect(CAUSE_DEFAULT).toBe('pick');
    expect(MOVE_DEFAULTS).toEqual({ hit: 'knock' });
    expect(moveDefault('hit')).toBe('knock');
    for (const k of Object.keys(MOVE_WORDS) as MoveKey[]) if (k !== 'hit') expect(moveDefault(k)).toBe('today');
  });

  it('a pick is one of its word\'s listed values, and today is always another', () => {
    expect(MOVE_WORDS.hit).toContain(MOVE_DEFAULTS.hit);
    expect(MOVE_WORDS.hit[0]).toBe('today');
    expect((['today', 'v1a', 'v1b', 'v3'] as const)).toContain(STANCE_DEFAULT);
    expect((['today', 'cut', 'blend3', 'pick'] as const)).toContain(CAUSE_DEFAULT);
  });

  it('an address that says nothing, or a word the switch does not know, reads the picks', () => {
    for (const s of ['', '?', '?nonsense=1', '?stance=wobble&swapcause=wobble&hit=wobble']) {
      expect(stanceFromSearch(s)).toBe('v1a');
      expect(causeFromSearch(s)).toBe('pick');
      expect(moveWordFromSearch(s, 'hit')).toBe('knock');
    }
  });

  it('the other values are still reachable by their words (the clips are made by changing the word)', () => {
    for (const w of ['today', 'v1a', 'v1b', 'v3'] as const) expect(stanceFromSearch(`?stance=${w}`)).toBe(w);
    for (const w of ['today', 'cut', 'blend3', 'pick'] as const) expect(causeFromSearch(`?swapcause=${w}`)).toBe(w);
    for (const w of ['today', 'ramp', 'knock'] as const) expect(moveWordFromSearch(`?hit=${w}`, 'hit')).toBe(w);
  });
});

describe('?stance=today&swapcause=today&hit=today is release 66', () => {
  it('reads release 66\'s defaults word by word', () => {
    const s = '?stance=today&swapcause=today&hit=today';
    expect({ stance: stanceFromSearch(s), cause: causeFromSearch(s), hit: moveWordFromSearch(s, 'hit') }).toEqual({ stance: 'today', cause: 'today', hit: 'today' });
  });

  it('and, read through the live switches in both pack chapters, makes release 66\'s look: the ready painting, no designed swap, the shake and recoil', () => {
    for (const chapter of [CH1, CH4]) {
      visit('?stance=today&swapcause=today&hit=today');
      setDemoChapter(chapter);
      expect(stanceMode()).toBe('today');
      expect(causeMode()).toBe('today');
      expect(lookNow()).toEqual(RELEASE_66);
    }
  });

  it('is the same release 66 look whatever else the address carries (a chapter outside the pack, ?swapclass, ?swapscope=all)', () => {
    visit('?stance=today&swapcause=today&hit=today&swapscope=all&swapclass=hit,contact');
    setDemoChapter(ELSEWHERE);
    expect(lookNow()).toEqual(RELEASE_66);
  });

  it('a page with the pack off, a phone, or no page at all gives release 66\'s stance and cause with no word at all', () => {
    visit('?pack=off');
    setDemoChapter(CH1);
    expect(lookNow()).toEqual({ ...RELEASE_66, hit: 'knock' }); // the hit was never pack-gated
    visit('');
    setPackScreen('phone');
    setDemoChapter(CH4);
    expect(lookNow()).toEqual({ ...RELEASE_66, hit: 'knock' });
    expect(stanceFromSearch(undefined)).toBe('today');
    expect(causeFromSearch(undefined)).toBe('today');
  });
});

describe('the picks play exactly where the words played', () => {
  it('in Chapter I (FFX) and Chapter IV (FFX-2) with the pack on: the menu keeps the idle painting; a cut on a cause with a cover, a 50 ms blend where there is none', () => {
    for (const chapter of [CH1, CH4]) {
      visit('');
      setDemoChapter(chapter);
      expect(lookNow()).toEqual(PICKS);
    }
    expect(UNCOVERED.length).toBeGreaterThan(0);
    expect(PICKS.cause['contact']).toBe('cut');
    expect(PICKS.cause['home']).toBe('blend3'); // the big-pair guard (SmearDirector, isBigChange) turns this back to today's blend for two drawings that share nothing
  });

  it('in any other chapter the swap looks are release 66\'s, and ?swapscope=all widens them as before', () => {
    visit('');
    setDemoChapter(ELSEWHERE);
    expect(lookNow()).toEqual({ ...RELEASE_66, hit: 'knock' });
    visit('?swapscope=all');
    expect(swapScope()).toBe('all');
    expect(lookNow()).toEqual(PICKS);
  });

  it('?pack=off, ?pack=today and a phone or a tablet keep release 66\'s swap looks; ?pack=demo forces the picks on a phone', () => {
    for (const s of ['?pack=off', '?pack=today', '?pack=0']) {
      visit(s);
      setDemoChapter(CH1);
      expect(lookNow().stance).toBe('today');
      expect(lookNow().cause).toEqual(RELEASE_66.cause);
    }
    visit('');
    setPackScreen('phone');
    setDemoChapter(CH4);
    expect(lookNow().stance).toBe('today');
    expect(lookNow().cause).toEqual(RELEASE_66.cause);
    visit('?pack=demo');
    setDemoChapter(CH4);
    expect(lookNow()).toEqual(PICKS);
  });

  it('the hit pick plays in every chapter of both games, with the pack on or off, and on a phone (it was never pack-gated)', () => {
    for (const chapter of [CH1, CH4, ELSEWHERE, undefined]) {
      for (const s of ['', '?pack=off']) {
        visit(s);
        setDemoChapter(chapter);
        expect(moveWord('hit')).toBe('knock');
      }
    }
    setPackScreen('phone');
    expect(moveWordFromSearch('', 'hit')).toBe('knock');
  });

  it('a forced word (the debug API\'s) still beats the default, and null reads the address again', () => {
    visit('');
    setDemoChapter(CH1);
    setStanceMode('v1b');
    setCauseMode('cut');
    setMoveWord('hit', 'ramp');
    expect([stanceMode(), causeMode(), moveWord('hit')]).toEqual(['v1b', 'cut', 'ramp']);
    setStanceMode(null);
    setCauseMode(null, null);
    setMoveWord('hit', null);
    expect([stanceMode(), causeMode(), moveWord('hit')]).toEqual(['v1a', 'pick', 'knock']);
  });
});

describe('nothing else moved', () => {
  it('?swapclass names every class when absent, ?swapscope is the pack chapters, ?interlude is on (all)', () => {
    expect([...classesFromSearch('')].sort()).toEqual([...SWAP_CLASSES].sort());
    expect(scopeFromSearch('')).toBe('pack');
    visit('');
    expect(interludeMode()).toBe('all');
  });

  it('the other eight lane L2 words and the interlude read today / on as in release 66', () => {
    for (const k of Object.keys(MOVE_WORDS) as MoveKey[]) {
      if (k !== 'hit') expect(moveWordFromSearch('', k)).toBe('today');
    }
  });
});
