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
import { forgetBoardChapter } from '../../src/app/screens/frontend/boardFocus.ts';
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

  // Each mount is a fresh session's board (PR-0109 remembers the last pick otherwise).
  forgetBoardChapter();
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
  it('draws the hero plus all eighteen cards, and nothing after them (the Leblanc preview is hidden), in two game groups, the selected one included (D-183)', () => {
    const { root } = mount();
    expect(root.querySelectorAll('.fe-hero')).toHaveLength(1);
    expect(root.querySelectorAll('.fe-card')).toHaveLength(18); // the eighteen; the FFX-2 experiment (2026-10-06) has no card, only its word
    expect(root.querySelector('[data-card="exp-leblanc"]')).toBeNull();
    expect(root.querySelectorAll('.fe-card--sel')).toHaveLength(1);
    const groups = [...root.querySelectorAll('.fe-rail__group')].map((g) => g.textContent?.trim());
    expect(groups).toEqual(['Final Fantasy X', 'Final Fantasy X-2']);
  });

  it('shows no COMING card: the last one, Macalania, was unlocked on 2026-09-29 (D-278)', () => {
    const { root } = mount();
    expect(root.querySelectorAll('.fe-card--coming')).toHaveLength(0);
    const vii = root.querySelector('.fe-card[data-card="seymour-anima-macalania"]');
    expect(vii, 'Chapter VII is a playable card').not.toBeNull();
    expect(vii!.getAttribute('aria-disabled')).not.toBe('true');
    expect(vii!.querySelector('.fe-card__coming')).toBeNull();
  });

  it('shows an unbeaten boss painted on its scene, with its name and no spoiler text (no silhouettes)', () => {
    const { root } = mount();
    expect(root.querySelector('.fe-sil')).toBeNull();
    const card = root.querySelector('.fe-card:not(.fe-card--coming)') as HTMLElement;
    expect(card.querySelector('.cs-art__scene')?.getAttribute('src')).toMatch(/art\/backdrops\/[a-z-]+\.png$/);
    expect(card.querySelector('.cs-art__boss')?.getAttribute('src')).toMatch(/art\/characters\/[a-z0-9-]+\/idle\.png$/);
    expect(card.querySelector('.fe-card__name')?.textContent?.trim()).toBeTruthy();
    // Only the numeral, the name and the shape. Nothing that tells the story.
    const text = card.textContent ?? '';
    expect(text).not.toMatch(/summoner|unsent|aeon|Sin|Farplane/i);
  });

  it('marks a beaten chapter with the gold ribbon and keeps its painting', () => {
    const first = mount();
    const before = first.root.querySelectorAll('.fe-card--cleared');
    expect(before).toHaveLength(0);

    first.save.recordClear('yunalesca', 200_000, 20);
    const after = mount();
    const cleared = [...after.root.querySelectorAll('.fe-card--cleared')];
    expect(cleared).toHaveLength(1);
    expect(cleared[0]!.querySelector('.fe-card__name')?.textContent?.trim()).toBe('Lady Yunalesca');
    expect(cleared[0]!.querySelector('.fe-card__ribbon')?.textContent).toBe('3:20');
    expect(cleared[0]!.querySelector('.fe-card__art img')).not.toBeNull();
  });
});

describe('the keyboard', () => {
  it('walks right through every chapter, Macalania (VII) included between III and VIII', () => {
    const rig = mount();
    expect(selectedId(rig)).toBe('seymour-flux');
    rig.key('ArrowRight');
    expect(selectedId(rig)).toBe('yunalesca');
    rig.key('ArrowRight');
    expect(selectedId(rig)).toBe('braskas-final-aeon');
    // Macalania (VII) was unlocked 2026-09-29 (D-278): the arrows land on it now.
    rig.key('ArrowRight');
    expect(selectedId(rig)).toBe('seymour-anima-macalania');
    // Evrae is unlocked now and playable, so it is not skipped.
    rig.key('ArrowRight');
    expect(selectedId(rig)).toBe('evrae-airship');
    // Yojimbo (Chapter IX) was listed 2026-09-24 and is playable.
    rig.key('ArrowRight');
    expect(selectedId(rig)).toBe('yojimbo-cavern');
    // Natus (Chapter X) was listed 2026-09-25 and is playable.
    rig.key('ArrowRight');
    expect(selectedId(rig)).toBe('seymour-natus');
    // Omnis (Chapter XII) was listed 2026-09-25 and is playable.
    rig.key('ArrowRight');
    expect(selectedId(rig)).toBe('seymour-omnis');
    // Isaaru (Chapter XIV) was listed 2026-09-25 and is playable.
    rig.key('ArrowRight');
    expect(selectedId(rig)).toBe('isaaru-via-purifico');
    // Sin's two chapters (XVII and XVIII) were listed 2026-09-29 and are playable.
    rig.key('ArrowRight');
    expect(selectedId(rig)).toBe('sin-fins-core');
    rig.key('ArrowRight');
    expect(selectedId(rig)).toBe('sin-face');
    rig.key('ArrowRight');
    expect(selectedId(rig)).toBe('ffx2-bahamut');
  });

  it('wraps left from the first card to the last playable one', () => {
    const rig = mount();
    rig.key('ArrowLeft');
    // Ixion at Djose (Chapter XVI, listed 2026-09-27) is the last card; the Leblanc preview has none.
    expect(selectedId(rig)).toBe('ffx2-ixion-djose');
    rig.key('ArrowLeft');
    expect(selectedId(rig)).toBe('ffx2-den-of-woe');
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
  it('never resolves an id that is not a playable card, even if its action is forged', () => {
    const picked: string[] = [];
    const rig = mount({ onSelect: (id) => picked.push(id) });
    expect(rig.screen.trigger('select:not-a-chapter')).toBe(false);
    expect(picked).toEqual([]);
  });

  it('Macalania now resolves, unlocked on 2026-09-29 (D-278)', () => {
    const picked: string[] = [];
    const rig = mount({ onSelect: (id) => picked.push(id) });
    expect(rig.screen.trigger('select:seymour-anima-macalania')).toBe(true);
    expect(picked).toEqual(['seymour-anima-macalania']);
  });

  it('Evrae now resolves too, having landed and unlocked on Bailey\'s word', () => {
    const picked: string[] = [];
    const rig = mount({ onSelect: (id) => picked.push(id) });
    expect(rig.screen.trigger('select:evrae-airship')).toBe(true);
    expect(picked).toEqual(['evrae-airship']);
  });

  it('still jumps straight into a built chapter by id, for the debug API', () => {
    const picked: string[] = [];
    const rig = mount({ onSelect: (id) => picked.push(id) });
    expect(rig.screen.trigger('select:ffx2-vegnagun-shuyin')).toBe(true);
    expect(picked).toEqual(['ffx2-vegnagun-shuyin']);
  });

  it('Leblanc now resolves too, having landed for real', () => {
    const picked: string[] = [];
    const rig = mount({ onSelect: (id) => picked.push(id) });
    expect(rig.screen.trigger('select:ffx2-leblanc')).toBe(true);
    expect(picked).toEqual(['ffx2-leblanc']);
  });
});

/**
 * The mouse. Real `click` events through the real `Input`, because the thing
 * being pinned is a two-step gesture and a synthesised action would skip the
 * step in between: the first click on a rail card only *chooses* it (the card
 * becomes the plate), and the second — on the plate — starts it. A mouse
 * player never loses a chapter to a stray double click.
 */
describe('the mouse', () => {
  const click = (rig: Rig, el: Element): void => {
    el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    rig.frame();
  };

  const cardFor = (rig: Rig, label: string): Element =>
    rig.root.querySelector(`.fe-card[aria-label="${label}"]`)!;

  it('takes one click on a rail card to choose it and a second on the plate to begin', () => {
    const picked: string[] = [];
    const rig = mount({ onSelect: (id) => picked.push(id) });
    expect(selectedId(rig)).toBe('seymour-flux');

    click(rig, cardFor(rig, 'Lady Yunalesca'));
    expect(selectedId(rig)).toBe('yunalesca');
    // The plate shows it, the card is lit where it sits, and nothing has started.
    expect(picked).toEqual([]);
    expect(rig.root.querySelector('.fe-hero')?.getAttribute('aria-label')).toBe('Lady Yunalesca');
    expect(cardFor(rig, 'Lady Yunalesca').classList.contains('fe-card--sel')).toBe(true);

    click(rig, rig.root.querySelector('.fe-hero')!);
    expect(picked).toEqual(['yunalesca']);
  });

  it('never starts a chapter on the first click, whichever card it lands on', () => {
    const picked: string[] = [];
    const rig = mount({ onSelect: (id) => picked.push(id) });
    click(rig, cardFor(rig, "Braska's Final Aeon"));
    click(rig, cardFor(rig, 'Lady Yunalesca'));
    click(rig, cardFor(rig, 'Bahamut'));
    expect(picked).toEqual([]);
    expect(selectedId(rig)).toBe('ffx2-bahamut');
  });

  it('the unlocked Chapter VII card is a click target like any other', () => {
    const rig = mount();
    expect(rig.root.querySelector('.fe-card--coming')).toBeNull();
    const vii = rig.root.querySelector('.fe-card[data-card="seymour-anima-macalania"]')!;
    click(rig, vii);
    expect(selectedId(rig)).toBe('seymour-anima-macalania');
  });

  it('says so in the hint bar the moment the player uses a mouse', () => {
    const rig = mount();
    const hint = rig.root.querySelector('[data-role="controls-hint"]')!;
    expect(hint.textContent).toContain('Left/Right');
    click(rig, cardFor(rig, 'Lady Yunalesca'));
    expect(hint.textContent).toContain('Click a card');
    expect(hint.textContent).toContain('Click the plate');
    expect(hint.textContent).toContain('begin');
  });
});

describe('the debug API', () => {
  it('jumps straight into a built chapter by id', () => {
    const picked: string[] = [];
    const rig = mount({ onSelect: (id) => picked.push(id) });
    expect(rig.screen.trigger('select:ffx2-vegnagun-shuyin')).toBe(true);
    expect(picked).toEqual(['ffx2-vegnagun-shuyin']);
  });
});
