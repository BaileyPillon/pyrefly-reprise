/**
 * The preload and the wiring of the FFX-2 Special look (step C2, G16, R-12; game case: FFX-2 only: the three Special dresspheres exist only in FFX-2; the preload is shared loading plumbing, and
 * with the switch OFF it must ask for exactly what it asked for before): `battlePreload.ts` and the presenter build in `BattleScreenEncounter.ts`.
 *
 * Held here: with the switch OFF the preload of Chapters IV and V requests exactly the step-0 pins' lists (`special-c2-pins.test.ts` holds the same lists in its own run); with the switch ON
 * (`flags.specialDressUp`) the list adds the paintings of each Special a girl owns (`characters/<girl>-<special>/idle|attack|cast|hurt`) and nothing for any part id; the presenter deps carry
 * `specialSeen` whose `has` and `mark` are the coach state's and `setSpecialLook(specialsLookWord())` is called before the presenter is built (the defaults in production).
 *
 * The no-network-at-the-bloom half is an assertion of the ON browser spec (SPEC-STAGE2 section 3). Removal: drop the preload block and the ON case finds no Special painting in the list.
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const prewarmed: string[] = [];
vi.mock('../../src/engine/PaintedArt.ts', async (importOriginal) => {
  const real = await importOriginal<typeof import('../../src/engine/PaintedArt.ts')>();
  return { ...real, prewarmPainted: vi.fn(async (url: string) => { prewarmed.push(url); return true; }) };
});

import { getChapter } from '../../src/data/encounters.ts';
import { preloadBattle } from '../../src/app/screens/battlePreload.ts';
import { setupForChapter } from '../../src/app/screens/BattleScreenSetup.ts';
import { createEngine } from '../../src/app/screens/BattleScreenWiring.ts';
import { specialsDebug } from '../../src/app/specialsWord.ts';
import { resetImageWarm } from '../../src/app/imageWarm.ts';
import { releaseAllPrefetch } from '../../src/app/screens/preloadFetch.ts';
import { ownedSpecialArtIds } from '../../src/engine/SpecialArt.ts';
import { FORMS } from '../../src/battle/ffx2/special/forms.ts';
import { expectPinned } from './helpers/offPins.ts';

const images: string[] = [];
const fetched: string[] = [];

beforeEach(() => {
  prewarmed.length = 0;
  images.length = 0;
  fetched.length = 0;
  resetImageWarm();
  releaseAllPrefetch();
  class FakeImage {
    decoding = '';
    crossOrigin: string | null = null;
    onload: null | (() => void) = null;
    onerror: null | (() => void) = null;
    constructor() {
      images.push('');
      const at = images.length - 1;
      Object.defineProperty(this, 'src', { set: (v: string) => { images[at] = String(v); queueMicrotask(() => this.onload?.()); }, get: () => images[at] ?? '' });
    }
    decode(): Promise<void> { return Promise.resolve(); }
    removeAttribute(): void {}
  }
  vi.stubGlobal('Image', FakeImage);
  vi.stubGlobal('fetch', vi.fn(async (url: string) => { fetched.push(String(url)); return new Response(null, { status: 404 }); }));
});
afterEach(() => {
  specialsDebug(false);
  vi.unstubAllGlobals();
  resetImageWarm();
  releaseAllPrefetch();
});

const PART_IDS = Object.values(FORMS).flatMap((f) => f.pods.map((p) => p.id));
const asked = () => ({ paintings: [...prewarmed], images: images.filter((s) => s !== ''), probes: [...new Set(fetched)] });

describe('the preload with the switch OFF', () => {
  it.each(['ffx2-bahamut', 'ffx2-vegnagun-shuyin'])('%s asks for exactly the step-0 list', async (id) => {
    await preloadBattle(getChapter(id)!, 1);
    expectPinned(`c2-preload-${id}`, asked());
  }, 60_000);
});

describe('the preload with the switch ON', () => {
  it.each(['ffx2-bahamut', 'ffx2-vegnagun-shuyin'])('%s adds the paintings of each owned Special and nothing for a part', async (id) => {
    specialsDebug(true);
    const chapter = getChapter(id)!;
    const state = (await createEngine(chapter.game, setupForChapter(chapter, 1), { automated: true })).state();
    expect(state.flags['specialDressUp']).toBe(true);
    const owned = state.activeIds.flatMap((cid) => ownedSpecialArtIds(state.combatants[cid]!));
    expect(owned.length, 'a girl of this chapter owns a Special').toBeGreaterThan(0);
    await preloadBattle(chapter, 1);
    const list = asked();
    for (const art of owned) {
      for (const pose of ['idle', 'attack', 'cast', 'hurt']) expect(list.paintings.some((u) => u.includes(`characters/${art}/${pose}.`)), `${art}/${pose}`).toBe(true);
    }
    for (const part of PART_IDS) expect([...list.paintings, ...list.images, ...list.probes].some((u) => u.includes(part)), part).toBe(false);
  }, 60_000);
});

describe('the presenter build of the battle screen', () => {
  const text = readFileSync(resolve(__dirname, '..', '..', 'src', 'app', 'screens', 'BattleScreenEncounter.ts'), 'utf8').replace(/\r\n/g, '\n');

  it('hands the presenter the coach state\'s has and mark, and sets the look from the word before the presenter is built', () => {
    expect(text).toContain("import { hasSeen, markSeen } from '../../ui/coach/coachState.ts'");
    expect(text).toContain('specialSeen: { has: hasSeen, mark: markSeen }');
    expect(text.indexOf('setSpecialLook(specialsLookWord());')).toBeGreaterThan(-1);
    expect(text.indexOf('setSpecialLook(specialsLookWord());')).toBeLessThan(text.indexOf('this.presenter = new BattlePresenter({'));
  });

  it('lights the aimed-at parts through the targeting port\'s select', () => {
    expect(text).toContain('this.stage?.markParts(sel ? sel.ids : [])');
  });
});
