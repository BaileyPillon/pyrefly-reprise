/**
 * REDUCE FLASHES' rules (PR-0032; `src/engine/flashRules.ts`): how soft "softens" is, as pure functions.
 *
 * The rule from the round's page (D-220 Q7 and the five rules already in the code): a screen wash peaks at 35 % and white turns
 * warm ivory; a flash on a fighter and the bloom peak at 0.35 and only an action's first blow flashes; a dark flash is a dimming and
 * stays; a white wash of 600 ms or longer is a cover over a swap, so it stays opaque but dim; durations never change.
 *
 * Game case: both (shared plumbing). The source-by-source cases, with the game of each, are `flash-sources.test.ts`.
 */
import { describe, expect, it } from 'vitest';

import {
  COVER_MS,
  CUTSCENE_FLASH_PEAK,
  DARK_LUMINANCE,
  DIM_IVORY,
  FLASH_PEAK_CAP,
  IVORY,
  IVORY_INT,
  SOFT_BLOOM_CAP,
  blowFlashes,
  cutsceneFlash,
  isDarkColour,
  isWhiteish,
  luminanceOf,
  parseCssColour,
  softActorFlash,
  softWash,
} from '../../src/engine/flashRules.ts';
import { REDUCED_FLASH_PARAMS } from '../../src/engine/spellfx/SpellFxParams.ts';

describe('the numbers', () => {
  it('are the round\'s: 35 %, warm ivory, a 600 ms cover line', () => {
    expect(FLASH_PEAK_CAP).toBe(0.35);
    expect(SOFT_BLOOM_CAP).toBe(0.35);
    expect(IVORY.toLowerCase()).toBe('#fff1d6');
    expect(IVORY_INT).toBe(0xfff1d6);
    // the same ivory and the same 35 % the spell effects already use (`SpellFxParams.REDUCED_FLASH_PARAMS`)
    expect(IVORY).toBe(REDUCED_FLASH_PARAMS.whiteWashTo);
    expect(FLASH_PEAK_CAP).toBe(REDUCED_FLASH_PARAMS.washCap);
    expect(FLASH_PEAK_CAP).toBe(REDUCED_FLASH_PARAMS.actorCap);
    expect(COVER_MS).toBe(600);
  });

  it('DIM_IVORY is ivory at 35 % brightness over black', () => {
    const ivory = parseCssColour(IVORY)!;
    const dim = parseCssColour(DIM_IVORY)!;
    expect(dim.r).toBe(Math.round(ivory.r * FLASH_PEAK_CAP));
    expect(dim.g).toBe(Math.round(ivory.g * FLASH_PEAK_CAP));
    expect(dim.b).toBe(Math.round(ivory.b * FLASH_PEAK_CAP));
    expect(isDarkColour(dim), 'a cover is dim, but it is a cover, never a white frame').toBe(true);
  });
});

describe('parseCssColour', () => {
  it.each([
    ['#ffffff', { r: 255, g: 255, b: 255, a: 1 }],
    ['#FFF1D6', { r: 255, g: 241, b: 214, a: 1 }],
    ['#fff', { r: 255, g: 255, b: 255, a: 1 }],
    ['rgba(255,70,50,0.28)', { r: 255, g: 70, b: 50, a: 0.28 }],
    ['rgba(0, 0, 0, 0.55)', { r: 0, g: 0, b: 0, a: 0.55 }],
    ['rgb(10, 20, 30)', { r: 10, g: 20, b: 30, a: 1 }],
  ])('%s', (css, want) => {
    expect(parseCssColour(css)).toEqual(want);
  });

  it.each([['transparent'], ['white'], [''], ['#12']])('%p is not readable, so nothing is changed about it', (css) => {
    expect(parseCssColour(css)).toBeNull();
    expect(softWash(css, 220)).toEqual({ colour: css, opacity: 1 });
  });
});

describe('what is dark and what is white', () => {
  it('the knock-out fall flash (0x4a5a78) and the defeat dim are dark; every bright flash is not', () => {
    expect(luminanceOf(0x4a, 0x5a, 0x78)).toBeLessThan(DARK_LUMINANCE);
    expect(isDarkColour({ r: 0x4a, g: 0x5a, b: 0x78 })).toBe(true);
    expect(isDarkColour({ r: 0, g: 0, b: 0 })).toBe(true);
    for (const bright of [0xffffff, 0xffd0c0, 0x9dffc4, 0xfff3c0, 0xb9b4aa, 0xc9a6ff, 0xff6b5a, 0xffc46b, 0x9fd8ff, 0x8a8f9c, 0xdfe8ff, 0xb08aff]) {
      expect(isDarkColour({ r: (bright >> 16) & 255, g: (bright >> 8) & 255, b: bright & 255 }), bright.toString(16)).toBe(false);
    }
  });

  it('white is all three channels at 0xe0 or more (the line SpellFxParams.filterWash draws)', () => {
    expect(isWhiteish({ r: 255, g: 255, b: 255 })).toBe(true);
    expect(isWhiteish({ r: 0xe0, g: 0xe0, b: 0xe0 })).toBe(true);
    expect(isWhiteish({ r: 0xe8, g: 0xe0, b: 0xff })).toBe(true); // the lilac-white of Ixion's cutscene flash
    expect(isWhiteish({ r: 0xff, g: 0xf1, b: 0xb8 })).toBe(false); // cream (the experiment's flash) keeps its own colour
    expect(isWhiteish({ r: 0xdf, g: 0xf0, b: 0xff })).toBe(false); // the 'impact' key's pale blue
  });
});

describe('softWash: the screen washes', () => {
  it('a white wash peaks at 35 % in ivory, whatever its length under 600 ms (duration is not this function\'s to change)', () => {
    for (const ms of [140, 180, 220, 260, 420, 599]) {
      expect(softWash('#ffffff', ms), `${ms} ms`).toEqual({ colour: IVORY, opacity: FLASH_PEAK_CAP });
    }
  });

  it('a coloured wash keeps its colour and peaks at 35 %', () => {
    expect(softWash('#ff8a4a', 220)).toEqual({ colour: '#ff8a4a', opacity: FLASH_PEAK_CAP }); // fire
    expect(softWash('#9fe4ff', 220)).toEqual({ colour: '#9fe4ff', opacity: FLASH_PEAK_CAP }); // ice
    expect(softWash('#dff0ff', 220)).toEqual({ colour: '#dff0ff', opacity: FLASH_PEAK_CAP }); // the generic impact: pale blue, not white
  });

  it('a wash already under the cap is left where it is (the imminent-attack red, 28 %)', () => {
    expect(softWash('rgba(255,70,50,0.28)', 420)).toEqual({ colour: 'rgba(255,70,50,0.28)', opacity: 1 });
  });

  it('a wash over the cap comes down to it: alpha times opacity is 0.35', () => {
    const w = softWash('rgba(255,100,100,0.7)', 300);
    expect(0.7 * w.opacity).toBeCloseTo(0.35, 10);
  });

  it('an almost-white translucent wash keeps its alpha and turns ivory', () => {
    const w = softWash('rgba(255,255,255,0.5)', 300);
    expect(w.colour).toBe('rgba(255, 241, 214, 0.5)');
    expect(0.5 * w.opacity).toBeCloseTo(0.35, 10);
  });

  it('a dark wash is a dimming, not a flash, so it is not touched: the defeat dim, a fade to black', () => {
    expect(softWash('rgba(0,0,0,0.55)', 900)).toEqual({ colour: 'rgba(0,0,0,0.55)', opacity: 1 });
    expect(softWash('#000000', 3600)).toEqual({ colour: '#000000', opacity: 1 });
  });

  it('a white wash of 600 ms or longer is a cover that hides a swap: it stays opaque, in dim ivory, never white', () => {
    for (const ms of [COVER_MS, 900, 1200, 3600]) {
      const w = softWash('#ffffff', ms);
      expect(w, `${ms} ms`).toEqual({ colour: DIM_IVORY, opacity: 1 });
    }
  });

  it('under no input does a wash come out as a full-strength white frame', () => {
    for (const colour of ['#ffffff', '#fff', '#fefefe', 'rgba(255,255,255,1)', 'rgba(255,255,255,0.9)', '#e8e0ff']) {
      for (const ms of [100, 180, 260, 420, 599, 600, 900, 3600]) {
        const w = softWash(colour, ms);
        const c = parseCssColour(w.colour)!;
        const effective = c.a * w.opacity;
        const brightness = (c.r + c.g + c.b) / 765;
        expect(effective * brightness, `${colour} ${ms} ms`).toBeLessThanOrEqual(FLASH_PEAK_CAP + 1e-9);
      }
    }
  });
});

describe('softActorFlash: the flashes on a fighter', () => {
  it('caps the peak at 0.35, turns white ivory, and never changes the duration', () => {
    expect(softActorFlash(0xffffff, 260, 1)).toEqual({ colour: IVORY_INT, ms: 260, peak: 0.35 }); // a crit
    expect(softActorFlash(0xffd0c0, 200, 0.8)).toEqual({ colour: 0xffd0c0, ms: 200, peak: 0.35 }); // an ordinary hit: pale peach
    expect(softActorFlash(0x9dffc4, 320, 0.6)).toEqual({ colour: 0x9dffc4, ms: 320, peak: 0.35 }); // a heal: mint
    expect(softActorFlash(0xfff3c0, 520, 0.9)).toEqual({ colour: 0xfff3c0, ms: 520, peak: 0.35 }); // a revive: pale gold
    expect(softActorFlash(0xb9b4aa, 320, 0.85)).toEqual({ colour: 0xb9b4aa, ms: 320, peak: 0.35 }); // petrify: stone grey
    expect(softActorFlash(0xc9a6ff, 260, 0.5)).toEqual({ colour: 0xc9a6ff, ms: 260, peak: 0.35 }); // a status: lilac
  });

  it('a peak already under the cap is left alone', () => {
    expect(softActorFlash(0x9fd8ff, 560, 0.2).peak).toBe(0.2);
    expect(softActorFlash(0x9fd8ff, 560, 0.35).peak).toBe(0.35);
  });

  it('a dark flash (the knock-out fall) passes through exactly', () => {
    expect(softActorFlash(0x4a5a78, 320, 0.7)).toEqual({ colour: 0x4a5a78, ms: 320, peak: 0.7 });
  });

  it('a css colour string works the same as a number', () => {
    expect(softActorFlash('#ffffff', 180, 1)).toEqual({ colour: IVORY_INT, ms: 180, peak: 0.35 });
    expect(softActorFlash('#4a5a78', 180, 0.7)).toEqual({ colour: '#4a5a78', ms: 180, peak: 0.7 });
    expect(softActorFlash('transparent', 180, 1)).toEqual({ colour: 'transparent', ms: 180, peak: 1 });
  });
});

describe('blowFlashes: one flash per action', () => {
  it('off: every blow flashes, as today', () => {
    for (const i of [0, 1, 2, 11]) expect(blowFlashes(i, false)).toBe(true);
  });

  it('on: only the first blow of an action does', () => {
    expect(blowFlashes(0, true)).toBe(true);
    for (const i of [1, 2, 3, 11]) expect(blowFlashes(i, true), `hit ${i}`).toBe(false);
  });
});

describe('cutsceneFlash', () => {
  it('off is exactly today: the step\'s colour (white by default) at 70 %', () => {
    expect(cutsceneFlash(undefined, 160, false)).toEqual({ background: '#ffffff', peak: CUTSCENE_FLASH_PEAK });
    expect(cutsceneFlash('#fff1b8', 200, false)).toEqual({ background: '#fff1b8', peak: 0.7 });
    expect(cutsceneFlash('#ffffff', 1200, false)).toEqual({ background: '#ffffff', peak: 0.7 });
    expect(CUTSCENE_FLASH_PEAK).toBe(0.7);
  });

  it('on: a short white flash peaks at 35 % in ivory (the nine scripts\' 140 to 260 ms flashes)', () => {
    for (const ms of [140, 160, 180, 220, 260]) {
      expect(cutsceneFlash(undefined, ms, true), `${ms} ms`).toEqual({ background: IVORY, peak: 0.35 });
      expect(cutsceneFlash('#ffffff', ms, true), `${ms} ms`).toEqual({ background: IVORY, peak: 0.35 });
    }
    expect(cutsceneFlash('#e8e0ff', 260, true)).toEqual({ background: IVORY, peak: 0.35 }); // Ixion's lilac-white
  });

  it('on: cream keeps its colour at 35 %', () => {
    expect(cutsceneFlash('#fff1b8', 200, true)).toEqual({ background: '#fff1b8', peak: 0.35 });
    expect(cutsceneFlash('#fff1b8', 460, true)).toEqual({ background: '#fff1b8', peak: 0.35 }); // 220 + n * 120 at its longest
  });

  it('on: the two long ones, the Shuyin cannon\'s 900 ms and Sinspawn Gui\'s 1200 ms, are covers: opaque, dim ivory, same length', () => {
    expect(cutsceneFlash('#ffffff', 900, true)).toEqual({ background: DIM_IVORY, peak: 1 });
    expect(cutsceneFlash('#ffffff', 1200, true)).toEqual({ background: DIM_IVORY, peak: 1 });
  });

  it('on: a dark colour passes through', () => {
    expect(cutsceneFlash('#000000', 900, true)).toEqual({ background: '#000000', peak: 0.7 });
  });
});
