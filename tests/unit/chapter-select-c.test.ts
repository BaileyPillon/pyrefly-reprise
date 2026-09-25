// @vitest-environment jsdom
/**
 * Chapter select v2, option C (D-183): the fixed list, the victory ribbon,
 * the progress strip and the boss painted on its scene.
 *
 * Bailey, 2026-09-25: "If I click Evrae then click its again it's Yojimbo.
 * That's weird and confusing." Then "I'll go with C a victory ribbon" and
 * "All recommendations". Target: docs/concepts/chapter-select-v2/option-C/.
 *
 * Driven through the real `Input` with real click and key events and a real
 * `SaveStore`, like `frontend-chapter-select-screen.test.ts`. Game case: both.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { ChapterSelectScreen } from '../../src/app/screens/ChapterSelectScreen.ts';
import { Input } from '../../src/app/Input.ts';
import { SaveStore } from '../../src/app/SaveData.ts';
import { CHAPTERS, UNLISTED_CHAPTERS } from '../../src/data/encounters.ts';
import { buildChapterTiles, silhouetteKeysFor } from '../../src/app/screens/frontend/chapterGrid.ts';
import { boardProgress } from '../../src/app/screens/frontend/chapterProgress.ts';
import { compositionFor, PLATE_COMPOSITIONS } from '../../src/app/screens/frontend/chapterPlates.ts';

interface Rig {
  screen: ChapterSelectScreen;
  root: HTMLElement;
  input: Input;
  save: SaveStore;
  picked: string[];
  key(code: string): void;
  click(el: Element): void;
}

let rigs: Rig[] = [];
let now = 0;

function mount(clears: Array<[string, number]> = []): Rig {
  const save = new SaveStore();
  for (const [id, ms] of clears) save.recordClear(id, ms, 10);
  const root = document.createElement('div');
  document.body.appendChild(root);
  const input = new Input({ pointerRoot: root });
  input.attach();
  const picked: string[] = [];
  const screen = new ChapterSelectScreen({ onSelect: (id) => picked.push(id) });
  screen.root = root;
  screen.app = { save, fade: () => Promise.resolve() } as unknown as ChapterSelectScreen['app'];
  screen.enter();
  const frame = (): void => {
    now += 250;
    screen.handleInput(input.update(now));
    input.endFrame();
  };
  const rig: Rig = {
    screen,
    root,
    input,
    save,
    picked,
    key(code) {
      window.dispatchEvent(new KeyboardEvent('keydown', { code, bubbles: true }));
      frame();
      window.dispatchEvent(new KeyboardEvent('keyup', { code, bubbles: true }));
    },
    click(el) {
      el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      frame();
    },
  };
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

const cards = (rig: Rig): HTMLElement[] => [...rig.root.querySelectorAll<HTMLElement>('.fe-card')];
const cardIds = (rig: Rig): string[] => cards(rig).map((c) => c.getAttribute('data-card') ?? '');
const card = (rig: Rig, id: string): HTMLElement => rig.root.querySelector<HTMLElement>(`.fe-card[data-card="${id}"]`)!;
const selectedId = (rig: Rig): unknown => rig.screen.snapshot()['selectedId'];

describe('the fixed list', () => {
  it('a second click on the same card begins that chapter, never its neighbour, for every card', () => {
    const playable = buildChapterTiles(new SaveStore()).filter((t) => t.playable);
    for (const tile of playable) {
      const rig = mount();
      // Choose some other card first (never the opening one, which a click
      // would begin), so the first click on `tile` is a choose.
      const other = tile.id === 'yunalesca' ? 'braskas-final-aeon' : 'yunalesca';
      rig.click(card(rig, other));
      rig.click(card(rig, tile.id));
      expect(selectedId(rig)).toBe(tile.id);
      expect(rig.picked).toEqual([]);
      rig.click(card(rig, tile.id));
      expect(rig.picked, `second click on ${tile.id}`).toEqual([tile.id]);
      rig.screen.exit();
    }
  });

  it('Bailey\'s case: Evrae, then Evrae again, begins Evrae (not Yojimbo)', () => {
    const rig = mount();
    rig.click(card(rig, 'evrae-airship'));
    rig.click(card(rig, 'evrae-airship'));
    expect(rig.picked).toEqual(['evrae-airship']);
  });

  it('the selected card never leaves the list: same cards, same order, same elements, whatever is selected', () => {
    const rig = mount();
    const before = cards(rig);
    const ids = cardIds(rig);
    expect(ids).toHaveLength(10);
    const moves = ['ArrowRight', 'ArrowRight', 'ArrowDown', 'ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowLeft'];
    for (const code of moves) {
      rig.key(code);
      expect(cardIds(rig)).toEqual(ids);
      expect(cards(rig)).toEqual(before);
      const sel = rig.root.querySelectorAll('.fe-card--sel');
      expect(sel).toHaveLength(1);
      expect(sel[0]!.getAttribute('data-card')).toBe(selectedId(rig));
    }
    for (const id of ['yunalesca', 'ffx2-trema', 'evrae-airship']) {
      rig.click(card(rig, id));
      expect(cards(rig)).toEqual(before);
      expect(card(rig, id).getAttribute('aria-current')).toBe('true');
    }
  });

  it('puts the COMING Chapter VII in number order, between III and VIII, and it stays unplayable', () => {
    const rig = mount();
    const numerals = cards(rig).map((c) => c.querySelector('.fe-card__num')?.textContent);
    expect(numerals).toEqual(['I', 'II', 'III', 'VII', 'VIII', 'IX', 'IV', 'V', 'VI', 'XIII']);
    const vii = card(rig, 'seymour-anima-macalania');
    expect(vii.classList.contains('fe-card--coming')).toBe(true);
    expect(vii.getAttribute('data-action')).toBeNull();
    rig.click(vii);
    expect(selectedId(rig)).toBe('seymour-flux');
    expect(rig.picked).toEqual([]);
  });

  it('gives every card its numeral and its name as two separate elements', () => {
    const rig = mount();
    for (const c of cards(rig)) {
      const num = c.querySelector('.fe-card__num');
      const name = c.querySelector('.fe-card__name');
      expect(num?.textContent).toMatch(/^[IVXL]+$/);
      expect(name?.textContent?.trim()).toBeTruthy();
      expect(num!.contains(name!) || name!.contains(num!)).toBe(false);
    }
  });
});

describe('numerals never overlap names (the sheet)', () => {
  const HERE = dirname(fileURLToPath(import.meta.url));
  const SHEET = readFileSync(join(HERE, '..', '..', 'src', 'app', 'screens', 'frontend', 'frontend.css'), 'utf8');
  const block = (selector: string): string => {
    const at = SHEET.indexOf(`${selector} {`);
    expect(at, selector).toBeGreaterThanOrEqual(0);
    return SHEET.slice(at, SHEET.indexOf('}', at));
  };

  it('sets the numeral in its own column and starts the name to the right of that column', () => {
    expect(block('.fe-card__num')).toMatch(/width:\s*var\(--fe-num-w\);/);
    expect(block('.fe-card__name')).toMatch(/left:\s*calc\(var\(--fe-num-w\) \+ \d+ \* var\(--fe-k\)\);/);
    // The column is never narrower than XIII at the type floor.
    expect(block('.fe-card')).toMatch(/--fe-num-w:\s*max\(calc\(\d+ \* var\(--fe-k\)\), 3\.6em\);/);
    // The name is centred in the card, not stacked under the numeral.
    expect(block('.fe-card__name')).toMatch(/top:\s*50%/);
    expect(block('.fe-card__name')).toMatch(/text-overflow:\s*ellipsis/);
  });
});

describe('the progress strip', () => {
  it('reads 0 of 9 on a new save: listed, playable chapters only, the coming card hatched', () => {
    const rig = mount();
    expect(rig.screen.snapshot()['beaten']).toBe(0);
    expect(rig.screen.snapshot()['total']).toBe(9);
    expect(rig.root.querySelector('.cs-strip__count b')?.textContent).toBe('0');
    expect(rig.root.querySelector('.cs-strip__of')?.textContent).toBe('of 9 beaten');
    expect(rig.root.querySelectorAll('.cs-pip')).toHaveLength(10);
    expect(rig.root.querySelectorAll('.cs-pip.is-lit')).toHaveLength(0);
    expect([...rig.root.querySelectorAll('.cs-pip.is-coming')].map((p) => p.textContent)).toEqual(['VII']);
  });

  it('counts only listed chapters: clears of an unlisted or a locked chapter never move it', () => {
    const unlisted = UNLISTED_CHAPTERS[0]!.id;
    const rig = mount([
      ['evrae-airship', 252_300],
      ['ffx2-leblanc', 543_000],
      [unlisted, 100_000],
      ['seymour-anima-macalania', 100_000],
    ]);
    expect(rig.screen.snapshot()['beaten']).toBe(2);
    expect(rig.screen.snapshot()['total']).toBe(9);
    expect(rig.root.querySelector('.cs-strip')?.getAttribute('aria-label')).toBe('2 of 9 chapters beaten');
    const lit = [...rig.root.querySelectorAll('.cs-pip.is-lit')].map((p) => [p.textContent, p.classList.contains('is-x2')]);
    expect(lit).toEqual([
      ['VIII', false],
      ['VI', true],
    ]);
    expect(rig.root.querySelector(`[data-pip="${unlisted}"]`)).toBeNull();
  });

  it('is pure arithmetic on the board tiles (the same rule, without a screen)', () => {
    const save = new SaveStore();
    save.recordClear('yunalesca', 1000, 1);
    const tiles = buildChapterTiles(save);
    const p = boardProgress(tiles, 0);
    expect(p.total).toBe(CHAPTERS.length - 1); // the one locked chapter is COMING
    expect(p.beaten).toBe(1);
    expect(p.pips.filter((x) => x.selected)).toHaveLength(1);
  });

  it('underlines the selected chapter and moves with the cursor', () => {
    const rig = mount();
    expect(rig.root.querySelector('.cs-pip.is-sel')?.textContent).toBe('I');
    rig.key('ArrowDown');
    expect(rig.root.querySelector('.cs-pip.is-sel')?.textContent).toBe('IV');
  });
});

describe('the victory ribbon', () => {
  it('shows only on beaten chapters, with the best time', () => {
    const rig = mount([
      ['evrae-airship', 252_300],
      ['ffx2-leblanc', 543_000],
    ]);
    const ribboned = cards(rig).filter((c) => c.querySelector('.fe-card__ribbon'));
    expect(ribboned.map((c) => c.getAttribute('data-card'))).toEqual(['evrae-airship', 'ffx2-leblanc']);
    expect(card(rig, 'evrae-airship').querySelector('.fe-card__ribbon')?.textContent).toBe('4:12');
    expect(card(rig, 'ffx2-leblanc').querySelector('.fe-card__ribbon')?.textContent).toBe('9:03');
    // No sash on an unbeaten plate...
    expect(rig.root.querySelector('.cs-sash')).toBeNull();
    // ...and the sash, VICTORY and the time, once a beaten chapter is on the plate.
    rig.click(card(rig, 'evrae-airship'));
    expect(rig.root.querySelector('.cs-sash__band')?.textContent).toBe('Victory4:12');
    rig.click(card(rig, 'ffx2-bahamut'));
    expect(rig.root.querySelector('.cs-sash')).toBeNull();
  });

  it('never marks a new save', () => {
    const rig = mount();
    expect(rig.root.querySelectorAll('.fe-card__ribbon, .cs-sash')).toHaveLength(0);
  });
});

/** Every `spriteKey` anywhere in a chapter's own data: its formations, acts and links. */
function spriteKeysIn(root: unknown): Set<string> {
  const out = new Set<string>();
  const seen = new Set<unknown>();
  const walk = (v: unknown): void => {
    if (!v || typeof v !== 'object' || seen.has(v)) return;
    seen.add(v);
    for (const [k, x] of Object.entries(v as Record<string, unknown>)) {
      if (k === 'spriteKey' && typeof x === 'string') out.add(x);
      else walk(x);
    }
  };
  walk(root);
  return out;
}

describe('the boss painted on its own scene', () => {
  it('every listed chapter paints its own boss (a sprite of its own data) on its own scene', () => {
    const tiles = buildChapterTiles(new SaveStore());
    for (const tile of tiles.filter((t) => t.chapter)) {
      // The title boss may enter in a later act (Leblanc after Ormi and the
      // goons; Trema after Paragon), so the chapter's title names it too.
      const titleKey = tile.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const own = new Set([...silhouetteKeysFor(tile.chapter!), ...spriteKeysIn(tile.chapter), titleKey]);
      const keys = compositionFor(tile).layers.map((l) => l.key);
      expect(keys.length).toBeGreaterThan(0);
      for (const k of keys) expect(own.has(k), `${tile.id} paints ${k}`).toBe(true);
      expect(tile.sceneKey).toBe(tile.chapter!.sceneKey);
    }
  });

  it('never uses a pause hero plate (those stay on the pause screen)', () => {
    const rig = mount();
    const srcs = [...rig.root.querySelectorAll('img')].map((i) => i.getAttribute('src') ?? '');
    expect(srcs.filter((s) => s.includes('/pause/'))).toEqual([]);
  });

  it('crops every card on the boss: a face-anchored placement for each chapter', () => {
    for (const [id, comp] of Object.entries(PLATE_COMPOSITIONS)) {
      const onCard = comp.layers.filter((l) => l.card);
      expect(onCard.length, id).toBe(1);
      const [fx, fy] = onCard[0]!.card!.focus ?? onCard[0]!.focus;
      expect(fx, id).toBeGreaterThan(0);
      expect(fx, id).toBeLessThan(1);
      expect(fy, id).toBeGreaterThan(0);
      expect(fy, id).toBeLessThan(1);
    }
  });

  it("keeps Braska's Final Aeon's face off its long card title (repair F1)", () => {
    // The title runs past 58 percent of the card's art at every desktop size;
    // measured in a browser, the face clears it (and the corner ribbon) at 78.
    const card = PLATE_COMPOSITIONS['braskas-final-aeon']!.layers[0]!.card!;
    expect(card.x).toBeGreaterThanOrEqual(75);
    expect(card.y).toBeGreaterThan(50);
    expect(card.focus).toEqual([0.33, 0.3]);
  });
});
