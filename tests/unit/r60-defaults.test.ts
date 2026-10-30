/**
 * RELEASE 60 (the conference demo build): what is ON by default and how each default is gated.
 *
 *  - The HD-2D look at BOLD strength is on in Chapter I (`seymour-flux`, FFX) and Chapter IV (`ffx2-bahamut`, FFX-2) with no `look` key in the address, and in no other chapter; `?look=off` turns it
 *    off everywhere; any `?look=` is the address's word everywhere (`?look=hd2d&lookstrength=bold` forces it anywhere).
 *  - The demo motion (`?motion=demo`'s four upgrades) is on in a page by default; `?motion=off` and `?motion=classic` turn it off; with no page (these tests, a headless engine) it is off.
 *
 * Both games (shared plumbing); the chapters that get the look are one FFX and one FFX-2, named by id.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { CHAPTERS } from '../../src/data/encounters.ts';
import { CHAPTER_LOOKS, chapterLook, parseLook } from '../../src/engine/look/LookConfig.ts';
import { applyChapterLook, lookState, lookWanted, setLookName, setLookStrength } from '../../src/engine/look/LookState.ts';
import { demoMotionFromSearch, demoMotionOn, setDemoMotion } from '../../src/engine/motion/DemoMotion.ts';
import { setTreatedScope } from '../../src/engine/motion/DemoGate.ts';

function reset(): void {
  lookState.auto = true;
  lookState.armed = false;
  lookState.name = null;
  lookState.strength = 'subtle';
  lookState.version = 1;
}
afterEach(() => {
  reset();
  setDemoMotion(null);
  setTreatedScope(null);
});

describe('the look: which chapters get it by default', () => {
  it('Chapter I (FFX) and Chapter IV (FFX-2) get hd2d at bold strength; no other chapter of the shipped list does', () => {
    expect(chapterLook('seymour-flux')).toEqual({ name: 'hd2d', strength: 'bold' });
    expect(chapterLook('ffx2-bahamut')).toEqual({ name: 'hd2d', strength: 'bold' });
    expect(Object.keys(CHAPTER_LOOKS).sort()).toEqual(['ffx2-bahamut', 'ffx2-leblanc', 'seymour-flux']); // release 69: Chapter VI has a row (the treated list, `DemoGate.TREATED_CHAPTERS`)
    setTreatedScope('pack'); // the page's `?treated=pack` (and a unit test's default): release 68's reach, the booth pair only
    const withLook = CHAPTERS.filter((c) => chapterLook(c.id) !== null).map((c) => `${c.id}:${c.game}`);
    expect(withLook.sort()).toEqual(['ffx2-bahamut:ffx2', 'seymour-flux:ffx']);
    for (const c of CHAPTERS) if (c.id !== 'seymour-flux' && c.id !== 'ffx2-bahamut') expect(chapterLook(c.id)).toBeNull();
    setTreatedScope('all'); // release 69: Leblanc joins, and nobody else
    expect(CHAPTERS.filter((c) => chapterLook(c.id) !== null).map((c) => `${c.id}:${c.game}`).sort()).toEqual(['ffx2-bahamut:ffx2', 'ffx2-leblanc:ffx2', 'seymour-flux:ffx']);
  });

  it('the chapters that BORROW the two paintings as placeholders get nothing: the look is keyed by chapter, not by scene', () => {
    setTreatedScope('all');
    const borrowers = CHAPTERS.filter((c) => (c.sceneKey === 'gagazet' || c.sceneKey === 'bevelle-underground') && c.id !== 'seymour-flux' && c.id !== 'ffx2-bahamut');
    for (const c of borrowers) expect(chapterLook(c.id)).toBeNull();
    expect(chapterLook(undefined)).toBeNull();
    expect(chapterLook('toString')).toBeNull(); // a prototype key is not a chapter
  });

  it('the two chapters stand on the paintings the look was authored for', () => {
    expect(CHAPTERS.find((c) => c.id === 'seymour-flux')!.sceneKey).toBe('gagazet');
    expect(CHAPTERS.find((c) => c.id === 'ffx2-bahamut')!.sceneKey).toBe('bevelle-underground');
  });
});

describe('the address', () => {
  it('no look key = automatic (each chapter plays its default); a look key, even off, is the address\'s word', () => {
    expect(parseLook('')).toMatchObject({ auto: true, armed: false, name: null });
    expect(parseLook('?motion=off&lookstrength=bold')).toMatchObject({ auto: true, armed: false, name: null }); // a strength alone is not a look
    expect(parseLook('?look=off')).toMatchObject({ auto: false, armed: true, name: null });
    expect(parseLook('?look=hd2d&lookstrength=bold')).toMatchObject({ auto: false, armed: true, name: 'hd2d', strength: 'bold' });
    expect(parseLook('?look=cinematic')).toMatchObject({ auto: false, name: 'cinematic', strength: 'subtle' });
  });
});

describe('applyChapterLook', () => {
  it('turns hd2d bold on for Chapter I and Chapter IV, arms the figures\' maps and wakes the renderer', () => {
    expect(lookWanted()).toBe(false);
    const v = lookState.version;
    applyChapterLook('seymour-flux');
    expect(lookState).toMatchObject({ name: 'hd2d', strength: 'bold', armed: true });
    expect(lookState.version).toBe(v + 1);
    expect(lookWanted()).toBe(true);
    applyChapterLook('seymour-flux'); // again: nothing to change, so the rig is not reconfigured
    expect(lookState.version).toBe(v + 1);
    applyChapterLook('ffx2-bahamut');
    expect(lookState).toMatchObject({ name: 'hd2d', strength: 'bold', armed: true });
    expect(lookState.version).toBe(v + 1);
  });

  it('turns it OFF again for any other chapter, so nothing else changes (no armed flag: no relight define, no rig work)', () => {
    applyChapterLook('seymour-flux');
    applyChapterLook('yunalesca');
    expect(lookState).toMatchObject({ name: null, strength: 'subtle', armed: false });
    expect(lookWanted()).toBe(false);
    applyChapterLook('ffx2-leblanc');
    expect(lookState).toMatchObject({ name: null, armed: false });
  });

  it('does nothing once the address chose (?look=...) or the player set a look by hand', () => {
    lookState.auto = false; // the address carried a look key
    applyChapterLook('seymour-flux');
    expect(lookState.name).toBeNull();
    reset();
    setLookName('anime'); // the console or F6
    applyChapterLook('yunalesca');
    expect(lookState.name).toBe('anime');
    reset();
    setLookStrength('subtle');
    applyChapterLook('seymour-flux');
    expect(lookState.name).toBeNull();
  });
});

describe('the demo motion: on by default in a page', () => {
  it('reads the address: on unless ?motion=off or ?motion=classic; off where there is no page', () => {
    expect(demoMotionFromSearch(undefined)).toBe(false);
    expect(demoMotionFromSearch('')).toBe(true);
    expect(demoMotionFromSearch('?look=off')).toBe(true);
    expect(demoMotionFromSearch('?motion=demo')).toBe(true);
    expect(demoMotionFromSearch('?motion=smooth')).toBe(true);
    expect(demoMotionFromSearch('?motion=off')).toBe(false);
    expect(demoMotionFromSearch('?motion=OFF')).toBe(false);
    expect(demoMotionFromSearch('?motion=classic')).toBe(false);
    expect(demoMotionFromSearch('?x=1&motion=off&y=2')).toBe(false);
  });

  it('under node there is no page, so the switch is off and every test that pins today\'s numbers still does; setDemoMotion forces it', () => {
    expect(demoMotionOn()).toBe(false);
    setDemoMotion(true);
    expect(demoMotionOn()).toBe(true);
    setDemoMotion(null);
    expect(demoMotionOn()).toBe(false);
  });
});
