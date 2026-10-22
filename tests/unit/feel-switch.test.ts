/**
 * The feel lane's switches (motion program, 2026-10-22): every new piece is OFF at compile time and ON only in Chapter I (`seymour-flux`, FFX) and Chapter IV (`ffx2-bahamut`,
 * FFX-2), by its own key or by the shared `?pack=demo`. Nothing in any other chapter, and nothing before a chapter is named, ever leaves today's behaviour.
 */
import { afterEach, describe, expect, it } from 'vitest';
import {
  FEEL_CHAPTERS,
  feelFlags,
  inFeelChapter,
  parseFeelKeys,
  punchMode,
  resetFeelForTests,
  motionSfxOn,
  rumbleOn,
  setFeelChapter,
  setFeelPack,
  setPunchMode,
  setShadowFollows,
  setStopMode,
  shadowFollows,
  stopMode,
  timingByTime,
  setTimingByTime,
} from '../../src/engine/feel/FeelSwitch.ts';
import { CHAPTERS } from '../../src/data/encounters.ts';

afterEach(() => resetFeelForTests());

describe('the keys', () => {
  it('reads each key, lowercases it, and ignores a value it does not know', () => {
    expect(parseFeelKeys('?punch=NEW&hitstop=short&rumble=on&shadow=follow&motionsfx=on&timing=TIME&pack=demo')).toEqual({ pack: true, punch: 'new', hitstop: 'short', rumble: true, shadow: true, motionsfx: true, timing: true });
    expect(parseFeelKeys('?punch=big&hitstop=long&rumble=maybe&shadow=down&motionsfx=loud&timing=fast&pack=all')).toEqual({ pack: false, punch: null, hitstop: null, rumble: null, shadow: null, motionsfx: null, timing: null });
    expect(parseFeelKeys('?punch=today&hitstop=today&rumble=off&shadow=today&motionsfx=off&timing=today')).toEqual({ pack: false, punch: 'today', hitstop: 'today', rumble: false, shadow: false, motionsfx: false, timing: false });
    expect(parseFeelKeys(undefined)).toEqual({ pack: false, punch: null, hitstop: null, rumble: null, shadow: null, motionsfx: null, timing: null });
  });
});

describe('the demo chapters are the real ones', () => {
  it('Chapter I is seymour-flux (FFX) and Chapter IV is ffx2-bahamut (FFX-2), both in the chapter table', () => {
    const byId = new Map(CHAPTERS.map((c) => [c.id, c]));
    expect([...FEEL_CHAPTERS].sort()).toEqual(['ffx2-bahamut', 'seymour-flux']);
    expect(byId.get('seymour-flux')?.game).toBe('ffx');
    expect(byId.get('ffx2-bahamut')?.game).toBe('ffx2');
  });
});

describe('compile-time default: everything is today', () => {
  it('with no key, no pack and no chapter every answer is today\'s', () => {
    resetFeelForTests('');
    expect([punchMode(), stopMode(), rumbleOn(), shadowFollows(), timingByTime()]).toEqual(['today', 'today', false, false, false]);
    setFeelChapter('seymour-flux');
    expect([punchMode(), stopMode(), rumbleOn(), shadowFollows(), timingByTime()]).toEqual(['today', 'today', false, false, false]); // in a demo chapter, still nothing named: today
    expect(feelFlags()).toEqual({ punch: 'today', stop: 'today' });
  });
});

describe('the pack', () => {
  it('turns every piece on in Chapter I and Chapter IV, and in no other chapter', () => {
    resetFeelForTests('?pack=demo');
    for (const id of ['seymour-flux', 'ffx2-bahamut']) {
      setFeelChapter(id);
      expect(inFeelChapter()).toBe(true);
      expect([punchMode(), stopMode(), rumbleOn(), shadowFollows(), motionSfxOn(), timingByTime()]).toEqual(['new', 'short', true, true, true, true]);
    }
    for (const id of ['yunalesca', 'braskas-final-aeon', 'ffx2-vegnagun-shuyin', 'ffx2-leblanc', 'ff7-anything', null]) {
      setFeelChapter(id);
      expect(inFeelChapter()).toBe(false);
      expect([punchMode(), stopMode(), rumbleOn(), shadowFollows(), motionSfxOn(), timingByTime()], String(id)).toEqual(['today', 'today', false, false, false, false]);
    }
  });

  it('a key named beside the pack wins for its piece (the A/B: the pack with today\'s camera)', () => {
    resetFeelForTests('?pack=demo&punch=today&hitstop=off&shadow=today&rumble=off&motionsfx=off');
    setFeelChapter('ffx2-bahamut');
    expect([punchMode(), stopMode(), rumbleOn(), shadowFollows(), motionSfxOn()]).toEqual(['today', 'off', false, false, false]);
  });

  it('the timing key: ?timing=time alone turns on just the real-time shake and impact frame in a demo chapter; ?timing=today beside the pack turns it off', () => {
    resetFeelForTests('?timing=time');
    setFeelChapter('ffx2-bahamut');
    expect([timingByTime(), punchMode(), stopMode()]).toEqual([true, 'today', 'today']);
    setFeelChapter('ffx2-vegnagun-shuyin');
    expect(timingByTime()).toBe(false);
    resetFeelForTests('?pack=demo&timing=today');
    setFeelChapter('seymour-flux');
    expect([timingByTime(), punchMode()]).toEqual([false, 'new']);
    setTimingByTime(true);
    expect(timingByTime()).toBe(true);
    setTimingByTime(undefined);
    expect(timingByTime()).toBe(false);
  });

  it('a key alone (no pack) turns on just its piece, in a demo chapter only', () => {
    resetFeelForTests('?punch=new');
    setFeelChapter('seymour-flux');
    expect([punchMode(), stopMode(), rumbleOn(), shadowFollows()]).toEqual(['new', 'today', false, false]);
    setFeelChapter('yunalesca');
    expect(punchMode()).toBe('today');
  });

  it('the debug setters force a piece and undefined gives the address back', () => {
    resetFeelForTests('');
    setFeelChapter('seymour-flux');
    setPunchMode('off');
    setStopMode('short');
    setShadowFollows(true);
    setFeelPack(true);
    expect([punchMode(), stopMode(), shadowFollows(), rumbleOn()]).toEqual(['off', 'short', true, true]);
    setPunchMode(undefined);
    setStopMode(undefined);
    expect([punchMode(), stopMode()]).toEqual(['new', 'short']); // the pack now says
  });
});
