/**
 * The feel lane's switches (motion program, 2026-10-22): every new piece is ON only in Chapter I (`seymour-flux`, FFX) and Chapter IV (`ffx2-bahamut`,
 * FFX-2), by its own key, by the shared `?pack=demo`, and since r64 (Bailey 2026-10-24, item 200b) by DEFAULT with no word at all; `?pack=off` is today's. Nothing in any other chapter, and nothing before a chapter is named, ever leaves today's behaviour, EXCEPT the real-time shake and impact frame (`?timing=`), which are on in every chapter since the post-conference plan (2026-10-26; `?timing=frames` is the off word).
 */
import { afterEach, describe, expect, it } from 'vitest';
import {
  FEEL_CHAPTERS,
  feelConfigured,
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
    expect(parseFeelKeys('?punch=big&hitstop=long&rumble=maybe&shadow=down&motionsfx=loud&timing=fast&pack=all')).toEqual({ pack: true, punch: null, hitstop: null, rumble: null, shadow: null, motionsfx: null, timing: null }); // an unknown pack word names nothing: the r64 default decides
    expect(parseFeelKeys('?punch=today&hitstop=today&rumble=off&shadow=today&motionsfx=off&timing=today&pack=off')).toEqual({ pack: false, punch: 'today', hitstop: 'today', rumble: false, shadow: false, motionsfx: false, timing: false });
    for (const word of ['off', 'False', '0', 'frames', 'today']) expect(parseFeelKeys(`?timing=${word}`).timing, word).toBe(false); // every off word a tester might type (review F-4)
    for (const word of ['on', 'true', '1', 'fast', '']) expect(parseFeelKeys(`?timing=${word}`).timing, word).toBeNull(); // only `time` names it on; any other word names nothing, and nothing is on
    expect(parseFeelKeys('?timing=FRAMES')).toEqual({ pack: true, punch: null, hitstop: null, rumble: null, shadow: null, motionsfx: null, timing: false }); // the off word (post-conference plan); `today` stays an off word too
    expect(parseFeelKeys('')).toEqual({ pack: true, punch: null, hitstop: null, rumble: null, shadow: null, motionsfx: null, timing: null }); // r64: no word is the conference default
    expect(parseFeelKeys(undefined)).toEqual({ pack: false, punch: null, hitstop: null, rumble: null, shadow: null, motionsfx: null, timing: null }); // no page: today
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

describe('the default: today\'s looks with no page, ?pack=off or no chapter; the conference pack in a demo chapter with no word (r64); the real-time shake everywhere', () => {
  it('with ?pack=off, no page and no chapter every look is today\'s (the real-time shake is on everywhere)', () => {
    resetFeelForTests('?pack=off');
    expect([punchMode(), stopMode(), rumbleOn(), shadowFollows(), timingByTime()]).toEqual(['today', 'today', false, false, true]);
    setFeelChapter('seymour-flux');
    expect([punchMode(), stopMode(), rumbleOn(), shadowFollows(), timingByTime()]).toEqual(['today', 'today', false, false, true]); // in a demo chapter under ?pack=off: today
    expect(feelFlags()).toEqual({ punch: 'today', stop: 'today' });
    resetFeelForTests(undefined);
    setFeelChapter('seymour-flux');
    expect([punchMode(), stopMode(), rumbleOn(), shadowFollows(), timingByTime()]).toEqual(['today', 'today', false, false, true]); // no page at all (a unit test)
  });

  it('with no word in the address, a demo chapter takes the whole pack and every other chapter keeps today\'s looks (the real-time shake is on everywhere)', () => {
    resetFeelForTests('');
    expect([punchMode(), stopMode(), rumbleOn(), shadowFollows(), timingByTime()]).toEqual(['today', 'today', false, false, true]); // before a chapter is named
    for (const id of ['seymour-flux', 'ffx2-bahamut']) {
      setFeelChapter(id);
      expect([punchMode(), stopMode(), rumbleOn(), shadowFollows(), timingByTime()]).toEqual(['new', 'short', true, true, true]);
    }
    setFeelChapter('yunalesca');
    expect([punchMode(), stopMode(), rumbleOn(), shadowFollows(), timingByTime()]).toEqual(['today', 'today', false, false, true]);
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
      expect([punchMode(), stopMode(), rumbleOn(), shadowFollows(), motionSfxOn(), timingByTime()], String(id)).toEqual(['today', 'today', false, false, false, true]); // the real-time shake is the one piece that is on in every chapter (post-conference plan)
    }
  });

  it('a key named beside the pack wins for its piece (the A/B: the pack with today\'s camera)', () => {
    resetFeelForTests('?pack=demo&punch=today&hitstop=off&shadow=today&rumble=off&motionsfx=off');
    setFeelChapter('ffx2-bahamut');
    expect([punchMode(), stopMode(), rumbleOn(), shadowFollows(), motionSfxOn()]).toEqual(['today', 'off', false, false, false]);
  });

  it('the timing key: on by default in EVERY chapter, pack or not; ?timing=frames (or today, off, false, 0) is the off word and wins beside the pack; the setter forces it', () => {
    resetFeelForTests('?pack=off');
    for (const id of ['ffx2-bahamut', 'seymour-flux', 'ffx2-vegnagun-shuyin', 'yunalesca', 'ffx2-leblanc', null]) {
      setFeelChapter(id);
      expect(timingByTime(), `${id}, ?pack=off`).toBe(true);
    }
    resetFeelForTests('?pack=demo&timing=today');
    setFeelChapter('seymour-flux');
    expect([timingByTime(), punchMode()]).toEqual([false, 'new']);
    for (const word of ['frames', 'FRAMES', 'today', 'off', 'false', '0']) {
      resetFeelForTests(`?timing=${word}`);
      for (const id of ['seymour-flux', 'ffx2-bahamut', 'yunalesca', 'ffx2-vegnagun-shuyin']) {
        setFeelChapter(id);
        expect(timingByTime(), `${id}, ?timing=${word}`).toBe(false);
      }
      expect(feelConfigured().timing).toBe(false);
    }
    resetFeelForTests('?timing=time');
    setFeelChapter('yunalesca');
    expect([timingByTime(), feelConfigured().timing]).toEqual([true, true]);
    resetFeelForTests('?timing=frames');
    setFeelChapter('yunalesca');
    setTimingByTime(true);
    expect(timingByTime()).toBe(true);
    setTimingByTime(undefined);
    expect(timingByTime()).toBe(false);
    resetFeelForTests('');
    expect([timingByTime(), feelConfigured().timing]).toEqual([true, true]);
    resetFeelForTests(undefined); // no page at all (a unit test): the default is the real-time one too
    expect([timingByTime(), feelConfigured().timing]).toEqual([true, true]);
  });

  it('a key alone (no pack) turns on just its piece, in a demo chapter only', () => {
    resetFeelForTests('?pack=off&punch=new');
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
