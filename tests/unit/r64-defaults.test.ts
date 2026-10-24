// @vitest-environment jsdom
/**
 * r64 DEFAULTS, part 1 of 2 (conference demo, Bailey 2026-10-24 ~13:40 EDT, item 200: "you can make all the decisions for me, ill go with all your recommendations"; the driver's calls under it, his to overturn).
 * Both games (shared plumbing); Chapter I (`seymour-flux`, FFX) and Chapter IV (`ffx2-bahamut`, FFX-2) are the only chapters any of it acts in.
 * Split in two on 2026-10-24 (the r64 review's m6: the house rule is 400 lines per file); the tests are the same ones.
 *
 *  1. 200b  the conference pack is ON by default (no `?pack=demo`); every lane answers it; `?pack=off` and each lane's own off word keep the old behaviour; no page is still today's;
 *  2. 200e  the party's edge light is OFF by default (`?partyrim=on` brings it back);
 *  5. 200h  the sentence "All code, art, music, and writing here are original" is gone from the game's FAN_NOTICE, the README and the press page; the property and not-affiliated lines stay.
 * Parts 3 and 4 (the end card and the picker's idle return) are in r64-defaults-card.test.ts.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { FAN_NOTICE } from '../../src/app/credits/creditsData.ts';
import { boothModeFromSearch } from '../../src/app/demo/boothSwitch.ts';
import { prebuildFromSearch } from '../../src/app/demo/prebuildSwitch.ts';
import { passConfiguredBy } from '../../src/audio/pass/passSwitch.ts';
import { parseFeelKeys } from '../../src/engine/feel/FeelSwitch.ts';
import { partyRimFromSearch } from '../../src/engine/look/pro/PartyRimSwitch.ts';
import { proModeFromSearch } from '../../src/engine/look/pro/ProSwitch.ts';
import { bossCleanFromSearch } from '../../src/engine/look/pro/BossClean.ts';
import { PACK_DEFAULT_ON, packDemo } from '../../src/engine/motion/DemoGate.ts';
import { curvesModeFromSearch } from '../../src/engine/motion/CurvesSwitch.ts';
import { momentsModeFromSearch } from '../../src/engine/motion/MomentsSwitch.ts';
import { smearStyleFromSearch } from '../../src/engine/motion/SmearSwitch.ts';
import { stagingModeFromSearch } from '../../src/engine/pro/staging/StagingSwitch.ts';
import { parseProCamKeys } from '../../src/engine/procam/ProCamSwitch.ts';
import { fxModeFromSearch } from '../../src/engine/spellfx/FxSwitch.ts';
import { hudF1ModeFromSearch } from '../../src/ui/hudf1/HudF1Switch.ts';

// ------------------------------------------------------------------------------------------------ 1. the pack is the default

/** Every lane's "is it on for this address" as a boolean, with the word that turns that lane (and only that lane) back to today's. */
const LANES: ReadonlyArray<{ name: string; on: (s: string | undefined) => boolean; ownOff: string }> = [
  { name: 'F1 HUD', on: (s) => hudF1ModeFromSearch(s) === 'f1', ownOff: '?hud=today' },
  { name: 'sound pass', on: (s) => passConfiguredBy(s), ownOff: '?audio=today' },
  { name: 'boss edges', on: (s) => bossCleanFromSearch(s) === 'clean', ownOff: '?boss=today' },
  { name: 'fight prebuild', on: (s) => prebuildFromSearch(s), ownOff: '?prebuild=off' },
  { name: 'booth screens', on: (s) => boothModeFromSearch(s) === 'new', ownOff: '?booth=today' },
  { name: 'pro look', on: (s) => proModeFromSearch(s) === 'pro', ownOff: '?look=today' },
  { name: 'pro look (master)', on: (s) => proModeFromSearch(s) === 'pro', ownOff: '?pro=off' },
  { name: 'pro camera', on: (s) => (parseProCamKeys(s).camera ?? parseProCamKeys(s).pack), ownOff: '?camera=off' },
  { name: 'pro camera (master)', on: (s) => (parseProCamKeys(s).camera ?? parseProCamKeys(s).pack), ownOff: '?pro=off' },
  { name: 'pro staging', on: (s) => stagingModeFromSearch(s) === 'pro', ownOff: '?staging=today' },
  { name: 'pro staging (master)', on: (s) => stagingModeFromSearch(s) === 'pro', ownOff: '?pro=off' },
  { name: 'curves', on: (s) => curvesModeFromSearch(s) !== 'today', ownOff: '?curves=today' },
  { name: 'moments', on: (s) => momentsModeFromSearch(s) === 'new', ownOff: '?moments=today' },
  { name: 'smear', on: (s) => smearStyleFromSearch(s) !== 'off', ownOff: '?smear=off' },
  { name: 'spell and boss fx', on: (s) => fxModeFromSearch(s) === 'new', ownOff: '?fx=today' },
  { name: 'big-hit camera punch', on: (s) => parseFeelKeys(s).pack && parseFeelKeys(s).punch !== 'today' && parseFeelKeys(s).punch !== 'off', ownOff: '?punch=today' },
  { name: 'hit-stop', on: (s) => parseFeelKeys(s).pack && parseFeelKeys(s).hitstop !== 'today' && parseFeelKeys(s).hitstop !== 'off', ownOff: '?hitstop=today' },
  { name: 'rumble', on: (s) => parseFeelKeys(s).pack && parseFeelKeys(s).rumble !== false, ownOff: '?rumble=off' },
  { name: 'contact shadow', on: (s) => parseFeelKeys(s).pack && parseFeelKeys(s).shadow !== false, ownOff: '?shadow=today' },
  { name: 'motion sounds', on: (s) => parseFeelKeys(s).pack && parseFeelKeys(s).motionsfx !== false, ownOff: '?motionsfx=off' },
];

describe('1. 200b: the conference pack is the default in Chapter I and Chapter IV', () => {
  it('the one reader: on with no word, with ?demo=1 alone and with ?pack=demo; off with ?pack=off (today, 0) and with no page', () => {
    expect(PACK_DEFAULT_ON).toBe(true);
    for (const s of ['', '?demo=1', '?pack=demo', '?demo=1&pack=demo', '?a=1&pack= DEMO ', '?pack=whatever']) expect(packDemo(s), s).toBe(true);
    for (const s of ['?pack=off', '?pack=OFF', '?pack=today', '?pack=0', '?demo=1&pack=off', undefined]) expect(packDemo(s), String(s)).toBe(false);
  });

  for (const lane of LANES) {
    it(`${lane.name}: on with no word and with ?demo=1; off with ?pack=off and with no page; its own off word turns it off alone`, () => {
      expect(lane.on(''), 'no word').toBe(true);
      expect(lane.on('?demo=1'), '?demo=1').toBe(true);
      expect(lane.on('?pack=demo'), '?pack=demo').toBe(true);
      expect(lane.on('?pack=off'), '?pack=off').toBe(false);
      expect(lane.on(undefined), 'no page').toBe(false);
      expect(lane.on(lane.ownOff), lane.ownOff).toBe(false);
      expect(lane.on(`?pack=demo&${lane.ownOff.slice(1)}`), `?pack=demo with ${lane.ownOff}`).toBe(false); // the lane's word beats the pack
    });
  }

  it('each lane\'s own off word leaves the others on (the lanes stay independent)', () => {
    expect(hudF1ModeFromSearch('?hud=today')).toBe('today');
    expect(passConfiguredBy('?hud=today')).toBe(true);
    expect(bossCleanFromSearch('?hud=today')).toBe('clean');
    expect(proModeFromSearch('?audio=today')).toBe('pro');
    expect(prebuildFromSearch('?demo=1&boss=today')).toBe(true);
  });

  it('?pro=off takes only the three pro lanes back; the motion pack and the HUD stay on', () => {
    const s = '?pro=off';
    expect([proModeFromSearch(s), stagingModeFromSearch(s), parseProCamKeys(s).camera]).toEqual(['today', 'today', false]);
    expect([curvesModeFromSearch(s), momentsModeFromSearch(s), hudF1ModeFromSearch(s)]).toEqual(['new', 'new', 'f1']);
  });
});

// ------------------------------------------------------------------------------------------------ 2. the party rim

describe('2. 200e: the party\'s edge light is OFF by default (both games)', () => {
  it('off with no word and with the pack; ?partyrim=on brings it back; ?pack=off is the old rim; no page is the old rim', () => {
    expect(partyRimFromSearch('')).toBe('off');
    expect(partyRimFromSearch('?demo=1')).toBe('off');
    expect(partyRimFromSearch('?pack=demo')).toBe('off');
    expect(partyRimFromSearch('?partyrim=on')).toBe('on');
    expect(partyRimFromSearch('?pack=demo&partyrim=on')).toBe('on');
    expect(partyRimFromSearch('?partyrim=off')).toBe('off');
    expect(partyRimFromSearch('?pack=off')).toBe('on');
    expect(partyRimFromSearch(undefined)).toBe('on');
  });
});

// ------------------------------------------------------------------------------------------------ 5. the notice

describe('5. 200h: the "all original" sentence is gone; the property and not-affiliated lines stay', () => {
  const GONE = /All code, art, music,? and writing/i;
  it('FAN_NOTICE keeps the property line and the not-affiliated line, and has no word about originality', () => {
    expect(FAN_NOTICE).toContain('their characters, worlds, and names are the property of Square Enix');
    expect(FAN_NOTICE).toContain('non-commercial fan work, unaffiliated with Square Enix');
    expect(FAN_NOTICE).not.toMatch(GONE);
    expect(FAN_NOTICE).not.toMatch(/original/i);
  });

  it('the README and the press page carry the same notice, and neither has the sentence', () => {
    const readme = readFileSync('README.md', 'utf8');
    const press = readFileSync('public/press/index.html', 'utf8');
    expect(readme).toContain(FAN_NOTICE);
    expect(press).toContain(FAN_NOTICE);
    expect(readme).not.toMatch(GONE);
    expect(press).not.toMatch(GONE);
  });

  it('the press page still says "unofficial fan tribute"', () => {
    const press = readFileSync('public/press/index.html', 'utf8');
    expect(press).toContain('An unofficial fan tribute');
    expect(press).toMatch(/unaffiliated with Square Enix/);
  });
});
