// @vitest-environment jsdom
/**
 * The showpiece chapter board, mounted — `src/app/screens/ChapterSelectScreen.ts`.
 *
 * Driven through the **real** `Input` with **real** `KeyboardEvent`s and a
 * **real** `SaveStore`, because the two things the brief makes conditions are
 * exactly the two a mock would paper over: that the keyboard reaches the board
 * at all, and that a card's face comes from the save rather than from a flag
 * the test set.
 *
 * Approved end state: docs/concepts/polish/showpiece-frontend/chapter-select.png.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { ChapterSelectScreen } from '../../src/app/screens/ChapterSelectScreen.ts';
import { Input } from '../../src/app/Input.ts';
import { SaveStore } from '../../src/app/SaveData.ts';

interface Rig {
  screen: ChapterSelectScreen;
  root: HTMLElement;
  input: Input;
  save: SaveStore;
  /** Dispatch a real key and give the screen one frame with it. */
  key(code: string): void;
  frame(): void;
}

let rigs: Rig[] = [];
let now = 0;

function mount(opts: ConstructorParameters<typeof ChapterSelectScreen>[0] = {}): Rig {
  const root = document.createElement('div');
  document.body.appendChild(root);
  const save = new SaveStore();
  const input = new Input({ pointerRoot: root });
  input.attach();

  const screen = new ChapterSelectScreen(opts);
  screen.root = root;
  screen.app = { save, fade: () => Promise.resolve() } as unknown as ChapterSelectScreen['app'];
  screen.enter();

  const frame = (): void => {
    now += 250; // past the auto-repeat delay, so every frame is its own edge
    screen.handleInput(input.update(now));
    input.endFrame();
  };
  const key = (code: string): void => {
    window.dispatchEvent(new KeyboardEvent('keydown', { code, bubbles: true }));
    frame();
    window.dispatchEvent(new KeyboardEvent('keyup', { code, bubbles: true }));
  };

  const rig: Rig = { screen, root, input, save, key, frame };
  rigs.push(rig);
  return rig;
}

beforeEach(() => {
  window.localStorage.clear();
  now = 0;
});

afterEach(() => {
  for (const rig of rigs) {
    rig.screen.exit();
    rig.input.detach();
    rig.root.remove();
  }
  rigs = [];
});

const selectedId = (rig: Rig): unknown => rig.screen.snapshot()['selectedId'];

describe('the board on screen', () => {
  it('draws eight cards in two game groups — the hero plus seven on the rail', () => {
    const { root } = mount();
    expect(root.querySelectorAll('.fe-hero')).toHaveLength(1);
    expect(root.querySelectorAll('.fe-card')).toHaveLength(7);
    const groups = [...root.querySelectorAll('.fe-rail__group')].map((g) => g.textContent?.trim());
    expect(groups).toEqual(['Final Fantasy X', 'Final Fantasy X-2']);
  });

  it('labels the three approved-but-unbuilt chapters COMING and makes them inert', () => {
    const { root } = mount();
    const coming = [...root.querySelectorAll('.fe-card--coming')];
    expect(coming).toHaveLength(3);
    for (const card of coming) {
      expect(card.querySelector('.fe-card__coming')?.textContent).toBe('Coming');
      expect(card.getAttribute('data-action')).toBeNull();
      expect(card.getAttribute('aria-disabled')).toBe('true');
    }
  });

  it('shows an uncleared boss as a silhouette with its name and no spoiler text', () => {
    const { root } = mount();
    const card = root.querySelector('.fe-card:not(.fe-card--coming)') as HTMLElement;
    expect(card.querySelector('.fe-card__sil img')?.className).toBe('fe-sil');
    expect(card.querySelector('.fe-card__name')?.textContent?.trim()).toBeTruthy();
    // Only the numeral, the name and the shape. Nothing that tells the story.
    const text = card.textContent ?? '';
    expect(text).not.toMatch(/summoner|unsent|aeon|Sin|Farplane/i);
  });

  it('swaps the silhouette for the painting once the chapter is cleared', () => {
    const first = mount();
    const before = first.root.querySelectorAll('.fe-card--cleared');
    expect(before).toHaveLength(0);

    first.save.recordClear('yunalesca', 200_000, 20);
    const after = mount();
    const cleared = [...after.root.querySelectorAll('.fe-card--cleared')];
    expect(cleared).toHaveLength(1);
    expect(cleared[0]!.querySelector('.fe-card__name')?.textContent?.trim()).toBe('Lady Yunalesca');
    expect(cleared[0]!.querySelector('.fe-card__sil')).toBeNull();
    expect(cleared[0]!.querySelector('.fe-card__art img')).not.toBeNull();
  });
});

describe('the keyboard', () => {
  it('walks right through the built chapters and skips the COMING cards', () => {
    const rig = mount();
    expect(selectedId(rig)).toBe('seymour-flux');
    rig.key('ArrowRight');
    expect(selectedId(rig)).toBe('yunalesca');
    rig.key('ArrowRight');
    expect(selectedId(rig)).toBe('braskas-final-aeon');
    // Macalania and Evrae sit between here and FFX-2, and are stepped over.
    rig.key('ArrowRight');
    expect(selectedId(rig)).toBe('ffx2-bahamut');
  });

  it('wraps left from the first card to the last playable one', () => {
    const rig = mount();
    rig.key('ArrowLeft');
    expect(selectedId(rig)).toBe('ffx2-vegnagun-shuyin');
  });

  it('crosses between the two games with up and down', () => {
    const rig = mount();
    rig.key('ArrowDown');
    expect(selectedId(rig)).toBe('ffx2-bahamut');
    rig.key('ArrowUp');
    expect(selectedId(rig)).toBe('seymour-flux');
  });

  it('confirms the selected chapter with Enter', async () => {
    const picked: string[] = [];
    const rig = mount({ onSelect: (id) => picked.push(id) });
    rig.key('ArrowRight');
    rig.key('Enter');
    expect(picked).toEqual(['yunalesca']);
    await expect(rig.screen.done).resolves.toBe('yunalesca');
  });

  it('moves the painting behind the board with the cursor', () => {
    const rig = mount();
    const wash = rig.root.querySelector('.fe-cselect__wash') as HTMLElement;
    const first = wash.style.backgroundImage;
    rig.key('ArrowRight');
    expect(wash.style.backgroundImage).not.toBe(first);
  });
});

describe('what a card can and cannot start', () => {
  it('never resolves a COMING chapter, even if its action is forged', () => {
    const picked: string[] = [];
    const rig = mount({ onSelect: (id) => picked.push(id) });
    expect(rig.screen.trigger('select:evrae-airship')).toBe(false);
    expect(rig.screen.trigger('select:ffx2-leblanc-syndicate')).toBe(false);
    expect(picked).toEqual([]);
  });

  it('still jumps straight into a built chapter by id, for the debug API', () => {
    const picked: string[] = [];
    const rig = mount({ onSelect: (id) => picked.push(id) });
    expect(rig.screen.trigger('select:ffx2-vegnagun-shuyin')).toBe(true);
    expect(picked).toEqual(['ffx2-vegnagun-shuyin']);
  });
});
