// @vitest-environment jsdom
/**
 * **The guide starts folded in Chapters I and III, and G opens it (FFX only; branch r3943-int, Bailey's "A2" of 2026-10-09).**
 *
 * At the start of Seymour Flux's fight and of Braska's Final Aeon's the strategy guide is folded to its chip and the full NEXT BEST MOVE card stands in the guide's place; G opens the guide
 * as ever, and while it is open the card falls back to the one-row tip. This file pins the guide's half of that, `StrategyGuide.startFolded` (the scene's flag is `SceneStaging.guideFolded`,
 * `ffx-form-stature`'s sister `ui-ffx-guide-folded-scenes.test.ts` pins which scenes set it):
 *
 *  - it is a **starting state, not a setting**: nothing is written to `Settings.guideVisible`, so the player's saved preference is never overwritten by the chapter, and a player who has the
 *    guide off sees no difference;
 *  - G opens the sheet (and writes the player's answer, as it always did), G again folds it and the saved answer follows;
 *  - it is applied on the first frame, once the layout has said whether this is the upright phone, which keeps its own guide sheet: **the phone is unchanged**.
 *
 * **Game case: FFX only** [AGENTS.md rule 14]: only the FFX scenes of Chapters I and III set the flag; FFX-2's HUD never calls it.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { SaveStore } from '../../src/app/SaveData.ts';
import { StrategyGuide } from '../../src/ui/common/StrategyGuide.ts';
import { makeFakeBattleState } from '../../src/ui/ffx/testFixtures.ts';

function memoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear: () => map.clear(),
    getItem: (k: string) => map.get(k) ?? null,
    key: (i: number) => [...map.keys()][i] ?? null,
    removeItem: (k: string) => void map.delete(k),
    setItem: (k: string, v: string) => void map.set(k, v),
  } as Storage;
}

const live: Array<{ unmount(): void }> = [];

function mountGuide(): { guide: StrategyGuide; stage: HTMLElement } {
  const stage = document.createElement('div');
  stage.style.position = 'absolute';
  document.body.appendChild(stage);
  const guide = new StrategyGuide({ game: 'ffx', anchors: { top: 44, bottom: 34 } });
  guide.mount(stage);
  live.push(guide);
  return { guide, stage };
}

const pressG = (): void => void window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyG' }));
const panelOf = (root: HTMLElement): HTMLElement => root.querySelector<HTMLElement>('[data-role="strategy-guide-panel"]')!;
const chipOf = (root: HTMLElement): HTMLButtonElement => root.querySelector<HTMLButtonElement>('[data-role="strategy-guide-toggle"]')!;
/** The first frame: the HUD ticks its guide, and the fold lands. */
const firstFrame = (guide: StrategyGuide): void => guide.update(1 / 60);

let store: SaveStore;
beforeEach(() => {
  Object.defineProperty(navigator, 'getGamepads', { configurable: true, writable: true, value: () => [] });
  store = new SaveStore('pyrefly-test-guide-folded', memoryStorage());
  delete document.documentElement.dataset['phoneBattle'];
});
afterEach(() => {
  while (live.length) live.pop()!.unmount();
  document.body.innerHTML = '';
  delete document.documentElement.dataset['phoneBattle'];
});

describe('a fight that starts folded', () => {
  it('opens with the sheet folded to its chip on the first frame, and says how to get it back', () => {
    const { guide, stage } = mountGuide();
    guide.sync(makeFakeBattleState());
    guide.startFolded();
    firstFrame(guide);
    expect(guide.isVisible).toBe(false);
    expect(panelOf(stage).hidden).toBe(true);
    expect(chipOf(stage).hidden).toBe(false);
    expect(chipOf(stage).getAttribute('aria-pressed')).toBe('false');
    expect(chipOf(stage).textContent?.toLowerCase()).toContain('guide');
  });

  it('writes nothing to the player\'s saved preference: it stays on', () => {
    const { guide } = mountGuide();
    guide.startFolded();
    firstFrame(guide);
    firstFrame(guide);
    expect(store.settings.guideVisible).toBe(true);
  });

  it('leaves a guide the player has turned off exactly as it was (and nothing is written)', () => {
    store.setSettings({ guideVisible: false });
    const { guide, stage } = mountGuide();
    guide.startFolded();
    firstFrame(guide);
    expect(guide.isVisible).toBe(false);
    expect(panelOf(stage).hidden).toBe(true);
    expect(store.settings.guideVisible).toBe(false);
  });

  it('is a start and nothing more: without the call the guide opens on the saved preference, as in every other chapter', () => {
    const { guide, stage } = mountGuide();
    firstFrame(guide);
    expect(guide.isVisible).toBe(true);
    expect(panelOf(stage).hidden).toBe(false);
  });
});

describe('G opens it', () => {
  it('G opens the sheet on the first press and the answer is the player\'s: it is written, and G again folds it', () => {
    const { guide, stage } = mountGuide();
    guide.sync(makeFakeBattleState());
    guide.startFolded();
    firstFrame(guide);
    pressG();
    expect(guide.isVisible).toBe(true);
    expect(panelOf(stage).hidden).toBe(false);
    expect(store.settings.guideVisible).toBe(true);
    pressG();
    expect(guide.isVisible).toBe(false);
    expect(panelOf(stage).hidden).toBe(true);
    expect(store.settings.guideVisible).toBe(false); // the standing behaviour of G in every chapter: the answer is remembered
  });

  it('the chip does what G does', () => {
    const { guide, stage } = mountGuide();
    guide.sync(makeFakeBattleState());
    guide.startFolded();
    firstFrame(guide);
    chipOf(stage).click();
    expect(guide.isVisible).toBe(true);
    expect(panelOf(stage).hidden).toBe(false);
  });

  it('a press before the first frame is the player\'s answer and the start does not undo it', () => {
    const { guide } = mountGuide();
    guide.startFolded();
    pressG(); // off (the saved preference was on): the player's own answer, written
    expect(guide.isVisible).toBe(false);
    pressG(); // on again
    expect(guide.isVisible).toBe(true);
    firstFrame(guide);
    expect(guide.isVisible).toBe(true);
    expect(store.settings.guideVisible).toBe(true);
  });
});

describe('the phone is unchanged', () => {
  it('keeps the guide on the saved preference on the upright phone layout (html[data-phone-battle], set before the first frame)', () => {
    const { guide, stage } = mountGuide();
    document.documentElement.dataset['phoneBattle'] = '';
    guide.startFolded();
    firstFrame(guide);
    expect(guide.isVisible).toBe(true);
    expect(panelOf(stage).hidden).toBe(false);
    expect(store.settings.guideVisible).toBe(true);
  });
});
