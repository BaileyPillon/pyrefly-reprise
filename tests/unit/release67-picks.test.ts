// @vitest-environment jsdom
/**
 * Release 67: Bailey's six look picks are the defaults (the driver's call under his delegation, 2026-10-28; his to overturn): message 1's three (`?stance`, `?swapcause`, `?hit`) and message 2's three
 * (`?run`, `?curves`, `?rigko`), **and the driver's follow-on to `?curves=real-snappy`: `?strikeshape=travel`** (the real-snappy dash is the house dash, about a fifth of a second, not one frame).
 *
 * | word | pick (the default) | release 66's look | where it plays (unchanged by the flip) |
 * |---|---|---|---|
 * | `?stance=` (MF-05, both games) | `v1a` | `today` | the two pack chapters (Chapter I FFX, Chapter IV FFX-2), a desktop-class screen, the pack on |
 * | `?swapcause=` (MF-06, both games) | `pick` | `today` | the same |
 * | `?hit=` (MF-03, both games) | `knock` | `today` | every chapter of both games (the word was never pack-gated) |
 * | `?run=` (MF-04, FFX-2 only) | `flow` | `today` | every FFX-2 chapter the run-in plays in (never pack-gated); `flow` needs the new curves (the two pack chapters), so Chapter V and a page with the pack off play the smooth run and today's strike |
 * | `?curves=` (MF-14, both games) | `real-snappy` | `new` (by name; `today` has always meant the curves OFF, release 62's) | the two pack chapters, the pack on, a desktop-class screen (unchanged) |
 * | `?rigko=` (MF-11, both games, the rig bosses Seymour Flux and Bahamut) | `whole` | `today` | the word was never gated; only a rig has a ko key to take whole |
 * | `?strikeshape=` (MF-14 V3, both games) | `travel` | `today` (with `?curves=new` it reads nothing; with `?curves=real-snappy` it is the clip's own dash) | exactly where `real-snappy` plays: the two pack chapters, the pack on, a desktop-class screen (`houseTravel` answers only for the 1.1 s pick) |
 *
 * Pinned here: the six defaults; that `?stance=today&swapcause=today&hit=today&run=today&curves=new&rigko=today` reads release 66's defaults and, through the real readers, release 66's LOOK (the stance, the cause and the hit
 * decisions the presenter asks the modules, and the ready hold of three FFX-2 dresses, `ReadyIdentity.ts`, which rides on the stance look: off wherever it is `today`); that each flip reaches exactly the scope it had (pack chapters only for the two swap words, `?pack=off`, a phone and no page leave release 66's look; `?swapscope`
 * still widens); and that the other swap words did not move (`?swapclass`, `?swapscope`, `?interlude`). Each lane's own tests pin the looks in depth. The one place to change a pick is named in
 * `docs/handoff/r67-picks.md`.
 *
 * Game case: both (shared plumbing; the stance and cause looks play in Chapter I FFX and Chapter IV FFX-2, the hit in every chapter of both games).
 */
import { afterEach, describe, expect, it } from 'vitest';
import { houseTravel } from '../../src/engine/motion/RealMotion.ts';
import { CURVES_DEFAULT, curvesModeFromSearch, curvesMode, curvesOn, realKind, setCurvesMode } from '../../src/engine/motion/CurvesSwitch.ts';
import { setDemoChapter, setPackScreen } from '../../src/engine/motion/DemoGate.ts';
import { readyHeldOnIdle, setReadyIdOff } from '../../src/engine/motion/ReadyIdentity.ts';
import { runMode } from '../../src/engine/motion/RunEase.ts';
import { rigKoWhole } from '../../src/engine/rig/RigHandoff.ts';
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
  setReadyIdOff(null); // the ready hold (pc-residues, review M5) reads the address once, like the other switches
  setCauseMode(null, null);
  setSwapScope(null);
  setInterludeMode(null);
  setCurvesMode(null);
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
const CH5 = 'ffx2-vegnagun-shuyin'; // FFX-2 Chapter V: the run-in plays, the new curves do not
const UNCOVERED = SWAP_CLASSES.filter((c) => !COVERED.has(c));

/** What the presenter asks the modules in the running chapter: the whole of the three looks, as data. */
function lookNow(): { stance: string; menuKeepsIdle: boolean; windUpOnIdle: boolean; readyHold: boolean; cause: Record<string, string>; hit: string } {
  return {
    stance: stanceNow(),
    readyHold: readyHeldOnIdle('paine-warrior'), // PR-0517 (pc-residues): a dress whose ready painting is another figure keeps the idle painting wherever the stance look plays
    menuKeepsIdle: menuKeepsIdle(),
    windUpOnIdle: windUpOnIdle(),
    cause: Object.fromEntries(SWAP_CLASSES.map((c) => [c, swapHow(c)])),
    hit: moveWord('hit'),
  };
}

/** What the presenter asks the MOTION modules (message 2's three words) in the running chapter, as data. */
function motionNow(): { curves: string; curvesOn: boolean; realKind: string | null; run: string; runMode: { smooth: boolean; flow: boolean; pace: boolean }; rigKoWhole: boolean; houseDash: boolean } {
  const kind = realKind();
  return { curves: curvesMode(), curvesOn: curvesOn(), realKind: kind, run: moveWord('run'), runMode: runMode(), rigKoWhole: rigKoWhole(), houseDash: kind !== null && houseTravel(kind) }; // houseDash: the strike's dash is the house one (`?strikeshape`'s one reader)
}

/** Release 66's motion in a pack chapter: the house curves (`new`), the stand-and-lunge run, the generic rig fall. */
const MOTION_66 = { curves: 'new', curvesOn: true, realKind: null, run: 'today', runMode: { smooth: false, flow: false, pace: false }, rigKoWhole: false, houseDash: false };
/** Message 2's picks in a pack chapter: the real clips at the 1.1 s pick, the flowing run, the whole rig fall. */
const MOTION_PICKS = { curves: 'real-snappy', curvesOn: true, realKind: 'snappy', run: 'flow', runMode: { smooth: true, flow: true, pace: false }, rigKoWhole: true, houseDash: true };
/** The words of release 66's whole look, as an address. */
const ADDRESS_66 = '?stance=today&swapcause=today&hit=today&run=today&curves=new&rigko=today&strikeshape=today';

const RELEASE_66 = {
  stance: 'today',
  menuKeepsIdle: false,
  windUpOnIdle: false,
  readyHold: false,
  cause: Object.fromEntries(SWAP_CLASSES.map((c) => [c, 'today'])),
  hit: 'today',
};

const PICKS = {
  stance: 'v1a',
  menuKeepsIdle: true,
  windUpOnIdle: false,
  readyHold: true,
  cause: Object.fromEntries(SWAP_CLASSES.map((c) => [c, COVERED.has(c) ? 'cut' : 'blend3'])),
  hit: 'knock',
};

describe('the three picks are the defaults', () => {
  it('the constants name Bailey\'s letters', () => {
    expect(STANCE_DEFAULT).toBe('v1a');
    expect(CAUSE_DEFAULT).toBe('pick');
    expect(CURVES_DEFAULT).toBe('real-snappy');
    // release 67's four, then release 68's three (hurtstring, summon, ramps: `m3-flips.test.ts` pins those; kotopple is held at today)
    expect(MOVE_DEFAULTS).toEqual({ hit: 'knock', run: 'flow', rigko: 'whole', strikeshape: 'travel', hurtstring: 'hold', summon: 'leap', ramps: 'smooth' });
    expect([moveDefault('hit'), moveDefault('run'), moveDefault('rigko'), moveDefault('strikeshape')]).toEqual(['knock', 'flow', 'whole', 'travel']);
    for (const k of Object.keys(MOVE_WORDS) as MoveKey[]) if (!(k in MOVE_DEFAULTS)) expect(moveDefault(k)).toBe('today'); // shakeband
  });

  it('a pick is one of its word\'s listed values, and today is always another', () => {
    expect(MOVE_WORDS.hit).toContain(MOVE_DEFAULTS.hit);
    expect(MOVE_WORDS.run).toContain(MOVE_DEFAULTS.run);
    expect(MOVE_WORDS.rigko).toContain(MOVE_DEFAULTS.rigko);
    expect(MOVE_WORDS.strikeshape).toContain(MOVE_DEFAULTS.strikeshape);
    for (const k of ['hit', 'run', 'rigko', 'strikeshape'] as const) expect(MOVE_WORDS[k][0]).toBe('today');
    expect(['new', 'real', 'real-snappy']).toContain(CURVES_DEFAULT); // the pack on means the curves on: the default is never `today`
    expect((['today', 'v1a', 'v1b', 'v3'] as const)).toContain(STANCE_DEFAULT);
    expect((['today', 'cut', 'blend3', 'pick'] as const)).toContain(CAUSE_DEFAULT);
  });

  it('an address that says nothing, or a word the switch does not know, reads the picks', () => {
    for (const s of ['', '?', '?nonsense=1', '?stance=wobble&swapcause=wobble&hit=wobble&run=wobble&curves=wobble&rigko=wobble&strikeshape=wobble']) {
      expect(stanceFromSearch(s)).toBe('v1a');
      expect(causeFromSearch(s)).toBe('pick');
      expect(moveWordFromSearch(s, 'hit')).toBe('knock');
      expect(moveWordFromSearch(s, 'run')).toBe('flow');
      expect(moveWordFromSearch(s, 'rigko')).toBe('whole');
      expect(moveWordFromSearch(s, 'strikeshape')).toBe('travel');
      expect(curvesModeFromSearch(s)).toBe('real-snappy');
    }
  });

  it('the other values are still reachable by their words (the clips are made by changing the word)', () => {
    for (const w of ['today', 'v1a', 'v1b', 'v3'] as const) expect(stanceFromSearch(`?stance=${w}`)).toBe(w);
    for (const w of ['today', 'cut', 'blend3', 'pick'] as const) expect(causeFromSearch(`?swapcause=${w}`)).toBe(w);
    for (const w of ['today', 'ramp', 'knock'] as const) expect(moveWordFromSearch(`?hit=${w}`, 'hit')).toBe(w);
    for (const w of ['today', 'smooth', 'flow', 'pace'] as const) expect(moveWordFromSearch(`?run=${w}`, 'run')).toBe(w);
    for (const w of ['today', 'whole'] as const) expect(moveWordFromSearch(`?rigko=${w}`, 'rigko')).toBe(w);
    for (const w of ['today', 'travel'] as const) expect(moveWordFromSearch(`?strikeshape=${w}`, 'strikeshape')).toBe(w);
    for (const [w, mode] of [['today', 'today'], ['new', 'new'], ['real', 'real'], ['real-snappy', 'real-snappy'], ['snappy', 'real-snappy']] as const) expect(curvesModeFromSearch(`?curves=${w}`)).toBe(mode);
  });
});

describe('?stance=today&swapcause=today&hit=today (message 1), &run=today&curves=new&rigko=today (message 2) and &strikeshape=today is release 66', () => {
  it('reads release 66\'s defaults word by word', () => {
    const s = ADDRESS_66;
    expect({ stance: stanceFromSearch(s), cause: causeFromSearch(s), hit: moveWordFromSearch(s, 'hit'), run: moveWordFromSearch(s, 'run'), rigko: moveWordFromSearch(s, 'rigko'), strikeshape: moveWordFromSearch(s, 'strikeshape'), curves: curvesModeFromSearch(s) }).toEqual({
      stance: 'today',
      cause: 'today',
      hit: 'today',
      run: 'today',
      rigko: 'today',
      strikeshape: 'today',
      curves: 'new',
    });
  });

  it('and, read through the live switches in both pack chapters, makes release 66\'s look: the ready painting, no designed swap, the shake and recoil', () => {
    for (const chapter of [CH1, CH4]) {
      visit(ADDRESS_66);
      setDemoChapter(chapter);
      expect(stanceMode()).toBe('today');
      expect(causeMode()).toBe('today');
      expect(lookNow()).toEqual(RELEASE_66);
      expect(motionNow()).toEqual(MOTION_66);
    }
  });

  it('the old words for the old motion each read release 66\'s alone: ?run=today the stand-and-lunge, ?rigko=today the generic fall, ?curves=new the house curves, ?strikeshape=today the real-snappy clip\'s own dash', () => {
    for (const chapter of [CH1, CH4]) {
      visit('?run=today');
      setDemoChapter(chapter);
      expect(motionNow()).toEqual({ ...MOTION_PICKS, run: 'today', runMode: MOTION_66.runMode });
      visit('?rigko=today');
      setDemoChapter(chapter);
      expect(motionNow()).toEqual({ ...MOTION_PICKS, rigKoWhole: false });
      visit('?curves=new');
      setDemoChapter(chapter);
      expect(motionNow()).toEqual({ ...MOTION_PICKS, curves: 'new', realKind: null, houseDash: false });
      visit('?strikeshape=today');
      setDemoChapter(chapter);
      expect(motionNow()).toEqual({ ...MOTION_PICKS, houseDash: false }); // the old dash alone: the real-snappy clip's own (one frame for Paine)
    }
  });

  it('is the same release 66 look whatever else the address carries (a chapter outside the pack, ?swapclass, ?swapscope=all)', () => {
    visit(`${ADDRESS_66}&swapscope=all&swapclass=hit,contact`);
    setDemoChapter(ELSEWHERE);
    expect(lookNow()).toEqual(RELEASE_66);
    expect(motionNow()).toEqual({ ...MOTION_66, curvesOn: false }); // a chapter outside the pack: the curves are off whatever the word
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

describe('message 2\'s picks play exactly where the words played', () => {
  it('in Chapter I (FFX) and Chapter IV (FFX-2) with the pack on: the real clips at the 1.1 s pick, the flowing run, the whole rig fall', () => {
    for (const chapter of [CH1, CH4]) {
      visit('');
      setDemoChapter(chapter);
      expect(motionNow()).toEqual(MOTION_PICKS);
    }
  });

  it('the run is FFX-2\'s alone and not gated by the pack: Chapter V, a page with the pack off and a phone get the smooth run and today\'s strike (flow needs the new curves), a pack chapter gets the flow', () => {
    const SMOOTH = { smooth: true, flow: false, pace: false };
    visit('');
    setDemoChapter(CH5);
    expect(motionNow()).toEqual({ ...MOTION_PICKS, curvesOn: false, realKind: null, runMode: SMOOTH, houseDash: false }); // the word is flow; the new curves are off here, so the strike is today's
    visit('?pack=off');
    setDemoChapter(CH4);
    expect(motionNow()).toEqual({ ...MOTION_PICKS, curves: 'today', curvesOn: false, realKind: null, runMode: SMOOTH, houseDash: false });
    visit('');
    setPackScreen('phone');
    setDemoChapter(CH4);
    expect(motionNow()).toEqual({ ...MOTION_PICKS, curves: 'today', curvesOn: false, realKind: null, runMode: SMOOTH, houseDash: false });
    visit('?pack=demo');
    setDemoChapter(CH4);
    expect(motionNow()).toEqual(MOTION_PICKS); // the booth address forces the pack on a phone, and the picks with it
  });

  it('the curves play in the two pack chapters only, the pack on, a desktop-class screen: another chapter, ?pack=off, ?pack=today and a phone keep the curves off', () => {
    visit('');
    setDemoChapter(ELSEWHERE);
    expect([motionNow().curvesOn, motionNow().realKind]).toEqual([false, null]);
    for (const s of ['?pack=off', '?pack=today', '?pack=0']) {
      visit(s);
      setDemoChapter(CH1);
      expect(curvesModeFromSearch(s)).toBe('today');
      expect([motionNow().curves, motionNow().curvesOn, motionNow().realKind]).toEqual(['today', false, null]);
    }
    visit('');
    setPackScreen('phone');
    setDemoChapter(CH1);
    expect([motionNow().curves, motionNow().curvesOn]).toEqual(['today', false]);
    expect(curvesModeFromSearch(undefined)).toBe('today'); // no page at all (a test, a tool)
  });

  it('a word in the address still beats the pick, both ways: ?curves=today turns the curves off even with the pack on, ?curves=real|new name their modes, ?run and ?rigko take their other values', () => {
    setDemoChapter(CH4);
    visit('?curves=today');
    expect([motionNow().curves, motionNow().curvesOn, motionNow().runMode]).toEqual(['today', false, { smooth: true, flow: false, pace: false }]);
    visit('?curves=real');
    expect([motionNow().curves, motionNow().realKind]).toEqual(['real', 'real']);
    visit('?curves=snappy');
    expect([motionNow().curves, motionNow().realKind]).toEqual(['real-snappy', 'snappy']);
    visit('?run=smooth');
    expect(motionNow().runMode).toEqual({ smooth: true, flow: false, pace: false });
    visit('?run=pace');
    expect(motionNow().runMode).toEqual({ smooth: true, flow: true, pace: true });
    visit('?rigko=today');
    expect(motionNow().rigKoWhole).toBe(false);
  });

  it('the run and the rig fall are not pack-gated (as ?hit never was): they read the picks in every chapter, with the pack on or off, and on a phone', () => {
    for (const chapter of [CH1, CH4, CH5, ELSEWHERE, undefined]) {
      for (const s of ['', '?pack=off']) {
        visit(s);
        setDemoChapter(chapter);
        expect([moveWord('run'), moveWord('rigko')]).toEqual(['flow', 'whole']);
      }
    }
    setPackScreen('phone');
    expect([moveWordFromSearch('', 'run'), moveWordFromSearch('', 'rigko')]).toEqual(['flow', 'whole']);
  });

  it('a forced word (the debug API\'s) still beats the default for all three, and null reads the address again', () => {
    visit('');
    setDemoChapter(CH4);
    setCurvesMode('new');
    setMoveWord('run', 'today');
    setMoveWord('rigko', 'today');
    expect(motionNow()).toEqual(MOTION_66);
    setCurvesMode(null);
    setMoveWord('run', null);
    setMoveWord('rigko', null);
    expect(motionNow()).toEqual(MOTION_PICKS);
  });
});

describe('nothing else moved', () => {
  it('?swapclass names every class when absent, ?swapscope is the pack chapters, ?interlude is on (all)', () => {
    expect([...classesFromSearch('')].sort()).toEqual([...SWAP_CLASSES].sort());
    expect(scopeFromSearch('')).toBe('pack');
    visit('');
    expect(interludeMode()).toBe('all');
  });

  it('the other five lane L2 words read release 68\'s picks (shakeband and kotopple still today), `today` on each is release 67\'s, and the interlude reads on as in release 66', () => {
    const OTHER = (Object.keys(MOVE_WORDS) as MoveKey[]).filter((k) => k !== 'hit' && k !== 'run' && k !== 'rigko' && k !== 'strikeshape');
    expect(OTHER.slice().sort()).toEqual(['hurtstring', 'kotopple', 'ramps', 'shakeband', 'summon']);
    const R68: Record<string, string> = { hurtstring: 'hold', kotopple: 'today', ramps: 'smooth', shakeband: 'today', summon: 'leap' };
    for (const k of OTHER) {
      expect(moveWordFromSearch('', k)).toBe(R68[k]);
      expect(moveWordFromSearch(`?${k}=today`, k)).toBe('today');
    }
    visit('');
    expect(interludeMode()).toBe('all');
  });
});
