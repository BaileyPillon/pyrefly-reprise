// @vitest-environment jsdom
/**
 * **Release 69 lifts Evrae's swap-scope exception** (`motion/SwapSwitch.ts` `SCOPE_EXCEPTIONS`; the driver's call under Bailey's delegation of 2026-10-29, his to overturn; FFX ONLY: Evrae is Chapter VIII, `evrae-airship`,
 * an FFX chapter; no FFX-2 chapter changes). The held-chapters lane's job `evrae-airship-all-held` read what the entry asked for (`?swapscope=all`, two runs): 0 swap jerks of 40 px or more, 0 and 1 of 24 px or more against
 * round 30's 2, ghost time a minute 1,330 and 1,246 ms against round 30's 3,224 (0.41 and 0.39 of it, the limit 0.7), head over tolerance 19 as in round 30, feet over tolerance 0.
 *
 * Read through the live switches the presenter asks, on a page with no address, as `release68-wide-scope.test.ts` does. These tests fail on release 68's list (Evrae a fourth exception, where he keeps release 66's look).
 * Yunalesca, Sin's face (FFX) and Ixion XVI (FFX-2) stay held with their reasons; Evrae keeps the vertical head guard (`BLEND_HEAD_CHAPTERS`), which his hurt-to-idle needs.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { CHAPTERS, getChapter } from '../../src/data/encounters.ts';
import { setCurvesMode } from '../../src/engine/motion/CurvesSwitch.ts';
import { setDemoChapter } from '../../src/engine/motion/DemoGate.ts';
import { MOVE_WORDS, moveWord, setMoveWord, type MoveKey } from '../../src/engine/motion/MoveSwitch.ts';
import { readyHeldOnIdle, setReadyIdOff } from '../../src/engine/motion/ReadyIdentity.ts';
import {
  BLEND3_HEAD_MAX,
  BLEND_HEAD_CHAPTERS,
  COVERED,
  SCOPE_EXCEPTIONS,
  SWAP_CLASSES,
  WIDE_CHAPTERS,
  chapterInScope,
  menuKeepsIdle,
  scopeExcepted,
  setBlendGuard,
  setCauseMode,
  setInterludeMode,
  setStanceMode,
  setSwapScope,
  stanceNow,
  swapHow,
  swapScope,
  windUpOnIdle,
  blendHeadMax,
} from '../../src/engine/motion/SwapSwitch.ts';

/** Point the page at an address and make every switch read it again (they read once, like the other URL switches). */
function visit(search: string): void {
  window.history.pushState({}, '', `/${search}`);
  setStanceMode(null);
  setReadyIdOff(null);
  setCauseMode(null, null);
  setSwapScope(null);
  setInterludeMode(null);
  setCurvesMode(null);
  setBlendGuard(null);
  for (const k of Object.keys(MOVE_WORDS) as MoveKey[]) setMoveWord(k, null);
}
afterEach(() => {
  visit('');
  setDemoChapter(undefined);
});

const EVRAE = 'evrae-airship';
const IDS = CHAPTERS.map((c) => c.id);

function lookNow(): { stance: string; menuKeepsIdle: boolean; windUpOnIdle: boolean; readyHold: boolean; cause: Record<string, string>; hit: string } {
  return {
    stance: stanceNow(),
    menuKeepsIdle: menuKeepsIdle(),
    windUpOnIdle: windUpOnIdle(),
    readyHold: readyHeldOnIdle('paine-warrior'),
    cause: Object.fromEntries(SWAP_CLASSES.map((c) => [c, swapHow(c)])),
    hit: moveWord('hit'),
  };
}
const PICKS = {
  stance: 'v1a',
  menuKeepsIdle: true,
  windUpOnIdle: false,
  readyHold: true,
  cause: Object.fromEntries(SWAP_CLASSES.map((c) => [c, COVERED.has(c) ? 'cut' : 'blend3'])),
  hit: 'knock',
};
const RELEASE_66 = { stance: 'today', menuKeepsIdle: false, windUpOnIdle: false, readyHold: false, cause: Object.fromEntries(SWAP_CLASSES.map((c) => [c, 'today'])), hit: 'knock' };

describe('Evrae joins the wide scope (FFX only)', () => {
  it('is an FFX chapter, a listed one, not a pack chapter, and no longer an exception', () => {
    expect(getChapter(EVRAE)?.game).toBe('ffx');
    expect(WIDE_CHAPTERS).toContain(EVRAE);
    expect(scopeExcepted(EVRAE)).toBe(false);
    expect(Object.keys(SCOPE_EXCEPTIONS)).not.toContain(EVRAE);
    expect(chapterInScope(EVRAE, 'wide')).toBe(true);
    expect(chapterInScope(EVRAE, 'pack')).toBe(false);
    expect(chapterInScope(EVRAE, 'all')).toBe(true);
  });

  it('on a page with no address Evrae plays the picks (the stance, the swap classes, the ready hold); release 68 gave him release 66\'s look', () => {
    visit('');
    expect(swapScope()).toBe('wide');
    setDemoChapter(EVRAE);
    expect(lookNow()).toEqual(PICKS);
  });

  it('?swapscope=pack still brings release 67\'s reach back for him, ?swapscope=all is the same picks, ?pack=off is release 62\'s', () => {
    visit('?swapscope=pack');
    setDemoChapter(EVRAE);
    expect(lookNow()).toEqual(RELEASE_66);
    visit('?swapscope=all');
    setDemoChapter(EVRAE);
    expect(lookNow()).toEqual(PICKS);
    visit('?pack=off');
    setDemoChapter(EVRAE);
    expect(lookNow().stance).toBe('today');
    expect(lookNow().cause['contact']).toBe('today');
  });

  it('keeps his vertical head guard: the lift does not drop BLEND_HEAD_CHAPTERS, and ?blendguard=off is still the measuring word', () => {
    visit('');
    expect(Object.keys(BLEND_HEAD_CHAPTERS)).toContain(EVRAE);
    expect(blendHeadMax(EVRAE)).toBe(BLEND3_HEAD_MAX);
    visit('?blendguard=off');
    expect(blendHeadMax(EVRAE)).toBeNull();
  });
});

describe('nothing else moves (AGENTS.md rule 14: Evrae is FFX; the FFX-2 chapters and the other held ones are as in release 68)', () => {
  it('the three exceptions are Yunalesca and Sin\'s face (FFX) and Ixion XVI (FFX-2), each still with its reason and what lifts it', () => {
    expect(Object.keys(SCOPE_EXCEPTIONS).sort()).toEqual(['ffx2-ixion-djose', 'sin-face', 'yunalesca']);
    for (const id of Object.keys(SCOPE_EXCEPTIONS)) expect(SCOPE_EXCEPTIONS[id], id).toMatch(/Lifts when/);
    visit('');
    for (const id of ['yunalesca', 'sin-face', 'ffx2-ixion-djose']) {
      setDemoChapter(id);
      expect(lookNow(), id).toEqual(RELEASE_66);
    }
  });

  it('every other listed chapter reads exactly what it read in release 68: sixteen play the picks, the three exceptions do not', () => {
    visit('');
    const playing = IDS.filter((id) => {
      setDemoChapter(id);
      const look = lookNow();
      expect(look, id).toEqual(Object.prototype.hasOwnProperty.call(SCOPE_EXCEPTIONS, id) ? RELEASE_66 : PICKS);
      return look.stance !== 'today';
    });
    expect(playing).toHaveLength(16);
    expect(playing).toContain(EVRAE);
    expect(playing.filter((id) => id.startsWith('ffx2-')).sort()).toEqual(['ffx2-bahamut', 'ffx2-den-of-woe', 'ffx2-fallen-aeons', 'ffx2-leblanc', 'ffx2-trema', 'ffx2-vegnagun-shuyin']);
  });
});
