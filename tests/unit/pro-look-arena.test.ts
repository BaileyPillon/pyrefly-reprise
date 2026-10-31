import { afterEach, describe, expect, it } from 'vitest';
import { parseLook } from '../../src/engine/look/LookConfig.ts';
import { lutBytes, lutKey } from '../../src/engine/look/LookGrades.ts';
import { applyChapterLook, lookState } from '../../src/engine/look/LookState.ts';
import { PRO_ARENA, proColour, proRoom, proTune, type ProColour } from '../../src/engine/look/pro/ProGrade.ts';
import { PRO_SEAM, SEAM_PIPE_OUT } from '../../src/engine/look/pro/ProSeam.ts';
import {
  addressChoseLook,
  proArenaFor,
  proLookOn,
  proModeFromSearch,
  proOffFromSearch,
  proPieceOn,
  setProMode,
  setProPiece,
} from '../../src/engine/look/pro/ProSwitch.ts';
import { setDemoChapter } from '../../src/engine/motion/DemoGate.ts';

afterEach(() => {
  setProMode(null);
  setProPiece(null);
  setDemoChapter(undefined);
  lookState.auto = true;
  lookState.name = null;
  lookState.armed = false;
  lookState.pro = false;
  lookState.strength = 'subtle';
});

describe('the pro-look switch: on by default since r64 (item 200b), off with ?pack=off, ?pro=off or ?look=today, in the two demo chapters', () => {
  it('reads the address', () => {
    expect(proModeFromSearch(undefined)).toBe('today');
    expect(proModeFromSearch('')).toBe('pro');
    expect(proModeFromSearch('?demo=1')).toBe('pro');
    expect(proModeFromSearch('?pack=off')).toBe('today');
    expect(proModeFromSearch('?pack=off&look=pro')).toBe('pro');
    expect(proModeFromSearch('?pro=off')).toBe('today');
    expect(proModeFromSearch('?pack=demo')).toBe('pro');
    expect(proModeFromSearch('?look=pro')).toBe('pro');
    expect(proModeFromSearch('?pack=demo&look=today')).toBe('today'); // the A/B: today wins over the pack
    expect(proModeFromSearch('?pack=off&look=hd2d')).toBe('today');
    expect(proModeFromSearch('?pack=demo&look=hd2d')).toBe('pro'); // the pieces other than the arena stay on
  });

  it('names the pieces to turn off', () => {
    expect(proOffFromSearch('?pack=demo&prooff=arena,hits')).toEqual(['arena', 'hits']);
    expect(proOffFromSearch('?prooff=bogus')).toEqual([]);
    expect(proOffFromSearch(undefined)).toEqual([]);
  });

  it('an address that names a demo look wins for the arena', () => {
    expect(addressChoseLook('?look=hd2d')).toBe(true);
    expect(addressChoseLook('?look=off')).toBe(true);
    expect(addressChoseLook('?look=pro')).toBe(false);
    expect(addressChoseLook('?look=today')).toBe(false);
    expect(addressChoseLook('?pack=demo')).toBe(false);
  });

  it('?look=pro and ?look=today are not a look named by hand: the chapter default plays', () => {
    for (const s of ['?look=pro', '?look=today']) {
      const r = parseLook(s);
      expect(r.armed).toBe(false);
      expect(r.auto).toBe(true);
      expect(r.name).toBeNull();
    }
    expect(parseLook('?look=hd2d').auto).toBe(false);
    expect(parseLook('?look=off').armed).toBe(true);
    expect(parseLook('').auto).toBe(true);
  });

  it('plays only in the two demo chapters', () => {
    setProMode('pro');
    expect(proLookOn()).toBe(false); // no chapter named yet
    setDemoChapter('seymour-flux');
    expect(proLookOn()).toBe(true);
    expect(proPieceOn('hits')).toBe(true);
    setDemoChapter('ffx2-bahamut');
    expect(proLookOn()).toBe(true);
    setDemoChapter('yunalesca');
    expect(proLookOn()).toBe(false);
    setDemoChapter('seymour-flux');
    setProMode('today');
    expect(proLookOn()).toBe(false);
    expect(proPieceOn('arena')).toBe(false);
  });

  it('one piece can be switched off without the rest', () => {
    setProMode('pro');
    setDemoChapter('ffx2-bahamut');
    setProPiece('seam', false);
    expect(proPieceOn('seam')).toBe(false);
    expect(proPieceOn('hits')).toBe(true);
    setProPiece('seam', true);
    expect(proPieceOn('seam')).toBe(true);
  });

  it('with the switch at its default (today), nothing here is on in any chapter', () => {
    setProMode(null); // reads the address of the test page: none
    for (const c of ['seymour-flux', 'ffx2-bahamut', 'yunalesca']) {
      setDemoChapter(c);
      for (const p of ['arena', 'seam', 'hits', 'numbers', 'markers'] as const) expect(proPieceOn(p)).toBe(false);
    }
    expect(proArenaFor('seymour-flux', '')).toBe(false);
  });
});

describe('the chapter look under the pro arena', () => {
  it("is today's hd2d bold with the switch off, and cinematic bold with it on, in both demo chapters only", () => {
    for (const c of ['seymour-flux', 'ffx2-bahamut']) {
      applyChapterLook(c);
      expect([lookState.name, lookState.strength, lookState.pro]).toEqual(['hd2d', 'bold', false]);
      setProMode('pro');
      applyChapterLook(c);
      expect([lookState.name, lookState.strength, lookState.pro]).toEqual(['cinematic', 'bold', true]);
      setProMode('today');
    }
    setProMode('pro');
    applyChapterLook('yunalesca');
    expect([lookState.name, lookState.armed, lookState.pro]).toEqual([null, false, false]);
  });

  it('stands aside for CLASSIC and for a look the address named', () => {
    setProMode('pro');
    applyChapterLook('seymour-flux', 'classic');
    expect([lookState.name, lookState.pro]).toEqual([null, false]);
    lookState.auto = false; // an address `look` key or a hand-set look
    applyChapterLook('seymour-flux');
    expect(lookState.pro).toBe(false);
  });

  it('flipping the switch at run time re-reads the chapter look', () => {
    setProMode('today');
    applyChapterLook('ffx2-bahamut');
    expect(lookState.name).toBe('hd2d');
    setProMode('pro'); // the switchboard key
    expect([lookState.name, lookState.pro]).toEqual(['cinematic', true]);
    setProMode('today');
    expect([lookState.name, lookState.pro]).toEqual(['hd2d', false]);
  });
});

describe('the pro arena grade: the book regrade.colour() ported to the look LUT', () => {
  // The B rows of tools/dirs.py as they were when the book's frames were made, written out whole: the shipped tables are tuned in the engine (and again after the 2026-10-23 review, against the book's
  // stage frames: saturation, the gradient map, the hue pulls), so the pin is the book's own numbers, not the table's.
  const BOOK_STOPS_I: Array<[number, [number, number, number]]> = [[0, [0.0, 0.02, 0.05]], [0.3, [0.04, 0.18, 0.3]], [0.6, [0.3, 0.55, 0.7]], [0.9, [0.85, 0.95, 1.0]], [1, [1, 1, 1]]];
  const BOOK_STOPS_IV: Array<[number, [number, number, number]]> = [[0, [0.0, 0.01, 0.04]], [0.3, [0.05, 0.1, 0.24]], [0.6, [0.28, 0.46, 0.66]], [0.9, [0.84, 0.94, 1.0]], [1, [1, 1, 1]]];
  const BOOK: Record<string, ProColour> = {
    gagazet: { exposure: 0.74, gamma: 1.0, contrast: 0.5, pivot: 0.3, sat: 0.6, pulls: [[228, 50, -8, 0.8, 0.9], [196, 36, -4, 0.9, 1.05]], gradmap: { amount: 0.52, stops: BOOK_STOPS_I }, shadow: [[0.015, 0.09, 0.2], 0.4], shadowTo: 0.45 },
    'bevelle-underground': { exposure: 0.92, gamma: 1.0, contrast: 0.32, pivot: 0.3, sat: 0.82, pulls: [[26, 30, 0, 0.8, 0.55], [228, 50, -4, 0.9, 0.95], [192, 36, 0, 1.0, 1.05]], gradmap: { amount: 0.26, stops: BOOK_STOPS_IV }, shadow: [[0.04, 0.05, 0.18], 0.35], shadowTo: 0.45 },
  };
  const SAMPLES: ReadonlyArray<readonly [number, number, number]> = [[0.5, 0.5, 0.5], [0.1, 0.2, 0.6], [0.8, 0.4, 0.1], [0.02, 0.03, 0.08], [0.9, 0.95, 1.0], [0.3, 0.6, 0.7]];
  // Reference values from `regrade.colour(sample, dirs.FIN[ch]['B']['stage'])` (numpy), 2026-10-23.
  const REF: Record<string, number[][]> = {
    gagazet: [[0.2518, 0.3423, 0.4097], [0.1346, 0.2271, 0.3492], [0.4886, 0.4708, 0.4712], [0.0067, 0.024, 0.0489], [0.8783, 0.9367, 0.9696], [0.3509, 0.574, 0.669]],
    'bevelle-underground': [[0.4422, 0.48, 0.5279], [0.1442, 0.2138, 0.4522], [0.3354, 0.2375, 0.1992], [0.0141, 0.0202, 0.0496], [0.9526, 0.9769, 0.9929], [0.3747, 0.6558, 0.7698]],
  };

  it('matches the mockup colour transform on six colours in each arena', () => {
    for (const room of Object.keys(REF)) {
      SAMPLES.forEach((s, i) => {
        const got = proColour(s, BOOK[room]!);
        for (let k = 0; k < 3; k++) expect(Math.abs(got[k]! - REF[room]![i]![k]!)).toBeLessThan(0.006);
      });
    }
  });

  it('each arena has its one light: Chapter I follows the painted moon, Chapter IV is anchored to the painted skylight (so it follows the camera)', () => {
    expect(PRO_ARENA['gagazet']!.cone!.follow).toBe(true);
    const sky = PRO_ARENA['bevelle-underground']!.cone!;
    expect(sky.paint).toBeDefined();
    expect(sky.paint!.u).toBeGreaterThan(0.4);
    expect(sky.paint!.u).toBeLessThan(0.6);
    expect(sky.paint!.v).toBeLessThan(0.15); // the top of the plate
    for (const r of Object.values(PRO_ARENA)) expect(r.cone!.strength).toBeGreaterThan(0);
  });

  it('both demo rooms have a pro table, other rooms do not', () => {
    expect(proRoom('gagazet')).toBeDefined();
    expect(proRoom('bevelle-underground')).toBeDefined();
    expect(proRoom('djose-chamber-provisional')).toBeUndefined(); // a room no chapter of the treatment stands in (the Den of Woe has had a table since batch 2, `booth-ffx2-b2`)
  });

  it('the LUT is its own: a pro room builds different bytes and a different cache key from the bold grade', () => {
    const pal = { key: 0xffe0b0, sky: 0x30405a };
    const bold = lutBytes('cinematic', 'ffx', 'gagazet', pal, 'bold', null, false);
    const pro = lutBytes('cinematic', 'ffx', 'gagazet', pal, 'bold', null, true);
    expect(pro.length).toBe(bold.length);
    let diff = 0;
    for (let i = 0; i < bold.length; i += 97) diff += Math.abs(bold[i]! - pro[i]!);
    expect(diff).toBeGreaterThan(1000);
    expect(lutKey('cinematic', 'ffx', 'gagazet', pal, 'bold', null, true)).not.toBe(lutKey('cinematic', 'ffx', 'gagazet', pal, 'bold', null, false));
    // a room with no pro table ignores the flag
    expect(lutKey('cinematic', 'ffx', 'djose-chamber-provisional', pal, 'bold', null, true)).toBe(lutKey('cinematic', 'ffx', 'djose-chamber-provisional', pal, 'bold', null, false));
  });

  it('live tuning changes the cache key (so the LUT is built again)', () => {
    const pal = { key: 0xffe0b0, sky: 0x30405a };
    const before = lutKey('cinematic', 'ffx', 'gagazet', pal, 'bold', null, true);
    const exposure = PRO_ARENA['gagazet']!.colour.exposure;
    expect(proTune('gagazet', { colour: { exposure: exposure + 0.01 } })).toBe(true);
    expect(lutKey('cinematic', 'ffx', 'gagazet', pal, 'bold', null, true)).not.toBe(before);
    proTune('gagazet', { colour: { exposure } });
    expect(proTune('nowhere', {})).toBe(false);
  });
});

describe('the Chapter IV seam: the near right conduit stands out, FFX-2 only', () => {
  it('has numbers only for the Bevelle underground, and the pipe moves outward', () => {
    expect(Object.keys(PRO_SEAM)).toEqual(['bevelle-underground']);
    expect(SEAM_PIPE_OUT).toBeGreaterThan(1.4); // it stood 1.4 units inside the 16:9 frame at the idle rig
    expect(PRO_SEAM['bevelle-underground']!.floorAmount).toBeGreaterThan(0);
  });
});
