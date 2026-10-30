// @vitest-environment jsdom
/**
 * **Release 68 widens the swap scope: the stance and cause picks play in fifteen of the nineteen chapters by default (sixteen since release 69, when Evrae's exception was lifted; FFX only)** (MF-22, `motion/SwapSwitch.ts` `SCOPE_DEFAULT = 'wide'`; the driver's call under Bailey's
 * delegation of 2026-10-28, his to overturn; BOTH games, per chapter: FFX Chapters I to III and the FFX bosses but Yunalesca and Sin's face (and Evrae until release 69); FFX-2 Chapters IV to VII but Ixion XVI).
 *
 * Read through the live switches the presenter asks (the stance, the menu's idle painting, the wind-up painting, each swap class, the hold of a dress whose ready painting is another figure, the hit word), on
 * a page with no address, in every one of the nineteen listed chapters and in the hidden ones; `?swapscope=pack` is release 67's reach, `?swapscope=all` the measuring word, `?pack=off` release 62's.
 * `release67-picks.test.ts` pins the two pack chapters and the words; `pc-scope-swap-scope.test.ts` pins the list and the maths.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { CHAPTERS } from '../../src/data/encounters.ts';
import { setCurvesMode } from '../../src/engine/motion/CurvesSwitch.ts';
import { setDemoChapter } from '../../src/engine/motion/DemoGate.ts';
import { MOVE_WORDS, moveWord, setMoveWord, type MoveKey } from '../../src/engine/motion/MoveSwitch.ts';
import { readyHeldOnIdle, setReadyIdOff } from '../../src/engine/motion/ReadyIdentity.ts';
import {
  COVERED,
  SCOPE_EXCEPTIONS,
  SWAP_CLASSES,
  menuKeepsIdle,
  setCauseMode,
  setInterludeMode,
  setStanceMode,
  setSwapScope,
  stanceNow,
  swapHow,
  swapScope,
  windUpOnIdle,
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
  for (const k of Object.keys(MOVE_WORDS) as MoveKey[]) setMoveWord(k, null);
}
afterEach(() => {
  visit('');
  setDemoChapter(undefined);
});

const IDS = CHAPTERS.map((c) => c.id);
const PACK = ['seymour-flux', 'ffx2-bahamut'];
const EXCEPTED = Object.keys(SCOPE_EXCEPTIONS);

/** The whole of the three looks the presenter asks the modules in the running chapter, as data. */
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
const RELEASE_66 = { stance: 'today', menuKeepsIdle: false, windUpOnIdle: false, readyHold: false, cause: Object.fromEntries(SWAP_CLASSES.map((c) => [c, 'today'])), hit: 'knock' }; // the hit was never pack-gated

describe('a page with no address, in each of the nineteen chapters', () => {
  it('sixteen play the picks (Evrae since release 69) and the three exceptions (Yunalesca, Sin\'s face, Ixion XVI) keep release 66\'s look; the hit is a knock in all nineteen', () => {
    expect(IDS).toHaveLength(19);
    expect(EXCEPTED.slice().sort()).toEqual(['ffx2-ixion-djose', 'sin-face', 'yunalesca']);
    visit('');
    expect(swapScope()).toBe('wide');
    let playing = 0;
    for (const id of IDS) {
      setDemoChapter(id);
      const excepted = EXCEPTED.includes(id);
      expect(lookNow(), id).toEqual(excepted ? RELEASE_66 : PICKS);
      if (!excepted) playing++;
    }
    expect(playing).toBe(16);
  });

  it('each game joins by its own chapters (AGENTS.md rule 14): 9 FFX and 5 FFX-2 chapters join the two pack chapters, 2 FFX and 1 FFX-2 chapter stay out', () => {
    const joins = IDS.filter((id) => !EXCEPTED.includes(id) && !PACK.includes(id));
    expect(joins.filter((id) => id.startsWith('ffx2-')).sort()).toEqual(['ffx2-den-of-woe', 'ffx2-fallen-aeons', 'ffx2-leblanc', 'ffx2-trema', 'ffx2-vegnagun-shuyin']);
    expect(joins.filter((id) => !id.startsWith('ffx2-'))).toHaveLength(9); // Yojimbo, Natus, Isaaru, Anima, Omnis, Mirror aeons, Braska, Sin's core, Evrae (since release 69)
    expect(EXCEPTED.filter((id) => id.startsWith('ffx2-'))).toEqual(['ffx2-ixion-djose']);
    expect(EXCEPTED.filter((id) => !id.startsWith('ffx2-')).sort()).toEqual(['sin-face', 'yunalesca']);
  });

  it('?swapscope=pack brings release 67\'s reach back (the two pack chapters only), ?swapscope=all the picks in every chapter, ?pack=off release 62\'s look everywhere', () => {
    visit('?swapscope=pack');
    for (const id of IDS) {
      setDemoChapter(id);
      expect(lookNow(), id).toEqual(PACK.includes(id) ? PICKS : RELEASE_66);
    }
    visit('?swapscope=all');
    for (const id of IDS) {
      setDemoChapter(id);
      expect(lookNow(), id).toEqual(PICKS);
    }
    visit('?pack=off');
    for (const id of IDS) {
      setDemoChapter(id);
      expect(lookNow().stance, id).toBe('today');
      expect(lookNow().cause['contact'], id).toBe('today');
    }
  });

  it('a hidden or experimental chapter keeps release 66\'s swap look under the wide default', () => {
    visit('');
    for (const id of ['fayth', 'windwaker', 'exp-leblanc']) {
      setDemoChapter(id);
      expect(lookNow(), id).toEqual(RELEASE_66);
    }
  });
});
