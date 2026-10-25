// @vitest-environment jsdom
/**
 * R63-P1 (focused review of r63-rc 8ee3ca11b, 2026-10-24): the conference pack is ON by default in Chapters I and IV, and on a 390 x 844 phone that put the F1 HUD (authored on a 640 x 360 grid, key hints,
 * no PAUSE button) over the phone layout: PAUSE gone, command names cut (ATTA..., SPE...), party numbers overlapping. The gate: the default holds on a desktop-class screen only; a phone, a tablet or any
 * narrow page opens with every lane off (release 62's behaviour); `?pack=demo` forces the pack on anywhere (the booth address), `?pack=off` forces it off anywhere; each lane's own word still wins for its piece.
 * Decided once at load: a rotation or a resize never switches a fight from one HUD to the other.
 *
 * Game case: BOTH games (shared plumbing, `engine/motion/DemoGate.ts`); Chapter I (FFX) and Chapter IV (FFX-2) are the only chapters any of it acts in.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { boothModeFromSearch } from '../../../src/app/demo/boothSwitch.ts';
import { prebuildFromSearch } from '../../../src/app/demo/prebuildSwitch.ts';
import { passConfiguredBy } from '../../../src/audio/pass/passSwitch.ts';
import { parseFeelKeys } from '../../../src/engine/feel/FeelSwitch.ts';
import { bossCleanFromSearch } from '../../../src/engine/look/pro/BossClean.ts';
import { proModeFromSearch } from '../../../src/engine/look/pro/ProSwitch.ts';
import { curvesModeFromSearch } from '../../../src/engine/motion/CurvesSwitch.ts';
import {
  PACK_DEFAULT_ON,
  PACK_PHONE_MAX_WIDTH,
  PACK_TOUCH_MAX_SHORT_SIDE,
  packDefaultOn,
  packDemo,
  packScreen,
  readPackScreen,
  setPackScreen,
  type PackScreenGlobals,
} from '../../../src/engine/motion/DemoGate.ts';
import { momentsModeFromSearch } from '../../../src/engine/motion/MomentsSwitch.ts';
import { smearStyleFromSearch } from '../../../src/engine/motion/SmearSwitch.ts';
import { stagingModeFromSearch } from '../../../src/engine/pro/staging/StagingSwitch.ts';
import { parseProCamKeys } from '../../../src/engine/procam/ProCamSwitch.ts';
import { fxModeFromSearch } from '../../../src/engine/spellfx/FxSwitch.ts';
import { hudF1ModeFromSearch } from '../../../src/ui/hudf1/HudF1Switch.ts';

afterEach(() => setPackScreen(null));

/** A window-like object the way a browser answers: the width and height, and which of the two media queries the gate asks match. */
function screenOf(width: number, height: number, opts: { coarse?: boolean } = {}): PackScreenGlobals {
  return {
    innerWidth: width,
    innerHeight: height,
    matchMedia: (q: string) => ({
      matches: q === `(max-width: ${PACK_PHONE_MAX_WIDTH}px)` ? width <= PACK_PHONE_MAX_WIDTH : q === '(pointer: coarse)' ? opts.coarse === true : false,
    }),
  };
}

describe('R63-P1: which screens count as desktop-class', () => {
  it('a desktop with a mouse is desk at every size the conference could use', () => {
    for (const [w, h] of [[1280, 720], [1600, 900], [1920, 1080], [2000, 1012], [2560, 1440], [3840, 2160], [1024, 768]] as const) {
      expect(readPackScreen(screenOf(w, h)), `${w}x${h}`).toBe('desk');
    }
  });

  it('an upright phone is phone, touch or not (390 x 844, 360 x 800, 599 wide; 600 wide is not under the phone width)', () => {
    expect(readPackScreen(screenOf(390, 844, { coarse: true }))).toBe('phone');
    expect(readPackScreen(screenOf(360, 800, { coarse: true }))).toBe('phone');
    expect(readPackScreen(screenOf(599, 900))).toBe('phone');
    expect(readPackScreen(screenOf(PACK_PHONE_MAX_WIDTH + 1, 900))).toBe('desk');
    expect(readPackScreen(screenOf(390, 844))).toBe('phone'); // a narrow desktop window too: the page is under the game's own phone breakpoint
  });

  it('a phone held sideways is phone (844 x 390, 932 x 430: touch, short side under 600)', () => {
    expect(readPackScreen(screenOf(844, 390, { coarse: true }))).toBe('phone');
    expect(readPackScreen(screenOf(932, 430, { coarse: true }))).toBe('phone');
  });

  it('a tablet is phone, held either way (768 x 1024, 1024 x 768, 820 x 1180, an iPad Pro 12.9 at 1366 x 1024): it has no PAUSE under the pack and no key for the P the hint names', () => {
    for (const [w, h] of [[768, 1024], [1024, 768], [820, 1180], [1366, 1024], [1024, 1366]] as const) {
      expect(readPackScreen(screenOf(w, h, { coarse: true })), `${w}x${h}`).toBe('phone');
    }
    expect(PACK_TOUCH_MAX_SHORT_SIDE).toBe(1024);
  });

  it('a big touch monitor (a booth kiosk, 1920 x 1080) and a touch laptop whose primary pointer is the trackpad stay desk', () => {
    expect(readPackScreen(screenOf(1920, 1080, { coarse: true }))).toBe('desk');
    expect(readPackScreen(screenOf(2560, 1440, { coarse: true }))).toBe('desk');
    expect(readPackScreen(screenOf(1366, 768, { coarse: false }))).toBe('desk');
  });

  it('where nothing can be read (no window, no matchMedia, a matchMedia that throws) it reads as a desktop, so every unit test and tool keeps r64 behaviour', () => {
    expect(readPackScreen({})).toBe('desk');
    expect(readPackScreen({ innerWidth: 0, innerHeight: 0 })).toBe('desk');
    expect(
      readPackScreen({
        innerWidth: 1280,
        innerHeight: 720,
        matchMedia: () => {
          throw new Error('no media');
        },
      }),
    ).toBe('desk');
  });
});

describe('R63-P1: the one reader answers by the screen class and the address words', () => {
  it('the default stays on (the conference default) and a test page reads as a desktop', () => {
    expect(PACK_DEFAULT_ON).toBe(true);
    expect(packScreen()).toBe('desk');
    expect(packDefaultOn()).toBe(true);
  });

  it('desk: no word and ?demo=1 are on, ?pack=off is off, ?pack=demo is on, no page is off (as r64)', () => {
    setPackScreen('desk');
    for (const s of ['', '?demo=1', '?pack=demo', '?pack=whatever']) expect(packDemo(s), s).toBe(true);
    for (const s of ['?pack=off', '?pack=today', '?pack=0', undefined]) expect(packDemo(s), String(s)).toBe(false);
  });

  it('phone: no word, ?demo=1 and an unknown pack word are off; ?pack=demo forces it on; ?pack=off stays off; no page is off', () => {
    setPackScreen('phone');
    expect(packDefaultOn()).toBe(false);
    for (const s of ['', '?demo=1', '?pack=whatever', '?a=1', undefined]) expect(packDemo(s), String(s)).toBe(false);
    for (const s of ['?pack=demo', '?demo=1&pack=demo', '?a=1&pack= DEMO ']) expect(packDemo(s), s).toBe(true);
    for (const s of ['?pack=off', '?pack=OFF', '?pack=today', '?pack=0']) expect(packDemo(s), s).toBe(false);
  });
});

/** Each lane's "is it on for this address", the same list the r64 defaults test walks. */
const LANES: ReadonlyArray<{ name: string; on: (s: string | undefined) => boolean; ownOn: string }> = [
  { name: 'F1 HUD', on: (s) => hudF1ModeFromSearch(s) === 'f1', ownOn: '?hud=f1' },
  { name: 'sound pass', on: (s) => passConfiguredBy(s), ownOn: '?audio=new' },
  { name: 'boss edges', on: (s) => bossCleanFromSearch(s) === 'clean', ownOn: '?boss=clean' },
  { name: 'fight prebuild', on: (s) => prebuildFromSearch(s), ownOn: '?pack=demo' },
  { name: 'booth screens', on: (s) => boothModeFromSearch(s) === 'new', ownOn: '?booth=new' },
  { name: 'pro look', on: (s) => proModeFromSearch(s) === 'pro', ownOn: '?look=pro' },
  { name: 'pro camera', on: (s) => parseProCamKeys(s).camera ?? parseProCamKeys(s).pack, ownOn: '?camera=pro' },
  { name: 'pro staging', on: (s) => stagingModeFromSearch(s) === 'pro', ownOn: '?staging=pro' },
  { name: 'curves', on: (s) => curvesModeFromSearch(s) !== 'today', ownOn: '?curves=new' },
  { name: 'moments', on: (s) => momentsModeFromSearch(s) === 'new', ownOn: '?moments=new' },
  { name: 'smear', on: (s) => smearStyleFromSearch(s) !== 'off', ownOn: '?smear=paint' },
  { name: 'spell and boss fx', on: (s) => fxModeFromSearch(s) === 'new', ownOn: '?fx=new' },
  { name: 'big-hit camera punch', on: (s) => parseFeelKeys(s).pack && parseFeelKeys(s).punch !== 'today' && parseFeelKeys(s).punch !== 'off', ownOn: '?pack=demo' },
  { name: 'hit-stop', on: (s) => parseFeelKeys(s).pack && parseFeelKeys(s).hitstop !== 'today' && parseFeelKeys(s).hitstop !== 'off', ownOn: '?pack=demo' },
];

describe('R63-P1: on a phone every lane opens as release 62 played', () => {
  for (const lane of LANES) {
    it(`${lane.name}: off with no word on a phone, on with ?pack=demo on a phone, on with no word on a desktop, off with ?pack=off on both`, () => {
      setPackScreen('phone');
      expect(lane.on(''), 'phone, no word').toBe(false);
      expect(lane.on('?demo=1'), 'phone, ?demo=1').toBe(false);
      expect(lane.on('?pack=demo'), 'phone, ?pack=demo').toBe(true);
      expect(lane.on('?pack=off'), 'phone, ?pack=off').toBe(false);
      expect(lane.on(lane.ownOn), `phone, ${lane.ownOn}`).toBe(true); // a lane's own word still asks for its piece
      setPackScreen('desk');
      expect(lane.on(''), 'desk, no word').toBe(true);
      expect(lane.on('?pack=off'), 'desk, ?pack=off').toBe(false);
    });
  }

  it('the pro master word is unchanged: ?pro=on turns the three pro lanes on without the pack, on a phone too; ?pro=off turns them off on a desktop', () => {
    setPackScreen('phone');
    expect(proModeFromSearch('?pro=on')).toBe('pro');
    expect(stagingModeFromSearch('?pro=on')).toBe('pro');
    setPackScreen('desk');
    expect(proModeFromSearch('?pro=off')).toBe('today');
  });
});

describe('R63-P1: decided at load, never mid-session', () => {
  it('turning a desktop window narrow, or a pointer turning coarse, after load changes nothing; a phone turned sideways stays phone', () => {
    const real = globalThis as unknown as { matchMedia?: unknown; innerWidth: number };
    const before = { matchMedia: real.matchMedia, innerWidth: real.innerWidth };
    try {
      setPackScreen('desk');
      real.innerWidth = 390;
      real.matchMedia = () => ({ matches: true });
      expect(packScreen(), 'desk stays desk after a resize').toBe('desk');
      expect(packDemo(''), 'the default still answers on').toBe(true);
      setPackScreen('phone');
      real.innerWidth = 1600;
      real.matchMedia = () => ({ matches: false });
      expect(packScreen(), 'phone stays phone after a rotation or a resize').toBe('phone');
      expect(packDemo('')).toBe(false);
      setPackScreen(null); // only a reload (the module read again) or the test hook reads the page afresh
      expect(packScreen()).toBe('desk');
    } finally {
      real.innerWidth = before.innerWidth;
      if (before.matchMedia === undefined) delete real.matchMedia;
      else real.matchMedia = before.matchMedia;
    }
  });
});
