// @vitest-environment jsdom
/**
 * PR-0109 (round 13, stalled at its 5th review): the chapter board comes back
 * on the chapter the player last chose, after an Esc from prep and after
 * CONFIRM on results, instead of on Chapter I. Both return paths build a new
 * `ChapterSelectScreen` with no options, so the test does exactly that: pick
 * a card by real keys, then build a fresh board.
 *
 * Game case: both (the board is shared plumbing; every playable chapter of
 * both games is checked).
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { ChapterSelectScreen } from '../../src/app/screens/ChapterSelectScreen.ts';
import { forgetBoardChapter, initialBoardIndex } from '../../src/app/screens/frontend/boardFocus.ts';
import { buildChapterTiles } from '../../src/app/screens/frontend/chapterGrid.ts';
import { Input } from '../../src/app/Input.ts';
import { SaveStore } from '../../src/app/SaveData.ts';

interface Rig {
  screen: ChapterSelectScreen;
  root: HTMLElement;
  input: Input;
  key(code: string): void;
}

let rigs: Rig[] = [];
let now = 0;

function mount(save = new SaveStore()): Rig {
  const root = document.createElement('div');
  document.body.appendChild(root);
  const input = new Input({ pointerRoot: root });
  input.attach();
  const screen = new ChapterSelectScreen({ onSelect: () => {} });
  screen.root = root;
  screen.app = { save, fade: () => Promise.resolve() } as unknown as ChapterSelectScreen['app'];
  screen.enter();
  const key = (code: string): void => {
    window.dispatchEvent(new KeyboardEvent('keydown', { code, bubbles: true }));
    now += 250;
    screen.handleInput(input.update(now));
    input.endFrame();
    window.dispatchEvent(new KeyboardEvent('keyup', { code, bubbles: true }));
  };
  const rig = { screen, root, input, key };
  rigs.push(rig);
  return rig;
}

const selectedId = (rig: Rig): unknown => rig.screen.snapshot()['selectedId'];

beforeEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
  forgetBoardChapter();
  now = 0;
});

afterEach(() => {
  for (const rig of rigs) {
    rig.screen.exit();
    rig.input.detach();
    rig.root.remove();
  }
  rigs = [];
  forgetBoardChapter();
});

describe('PR-0109: the board returns to the last chosen chapter', () => {
  const playable = buildChapterTiles(new SaveStore()).filter((t) => t.playable);

  it('a fresh session still opens on Chapter I', () => {
    expect(selectedId(mount())).toBe('seymour-flux');
  });

  for (const tile of playable) {
    it(`${tile.id}: chosen by keys, the next board opens on it`, () => {
      const first = mount();
      let guard = 0;
      while (selectedId(first) !== tile.id && guard++ < 30) first.key('ArrowRight');
      expect(selectedId(first)).toBe(tile.id);
      first.key('Enter');
      first.screen.exit();
      const next = mount();
      expect(selectedId(next)).toBe(tile.id);
    });
  }

  it('moving the cursor without confirming does not move the memory', () => {
    const first = mount();
    first.key('ArrowRight');
    first.key('ArrowRight');
    first.key('Enter'); // confirms the third card
    const chosen = selectedId(first);
    first.screen.exit();
    const second = mount();
    second.key('ArrowRight');
    second.key('Escape');
    second.screen.exit();
    expect(selectedId(mount())).toBe(chosen);
  });

  it('a remembered chapter that is not playable falls back to the first playable card', () => {
    const tiles = [
      { id: 'a', playable: false },
      { id: 'b', playable: true },
      { id: 'c', playable: false },
    ];
    expect(initialBoardIndex(tiles, 2)).toBe(1);
    expect(initialBoardIndex(tiles, undefined)).toBe(1);
  });
});
