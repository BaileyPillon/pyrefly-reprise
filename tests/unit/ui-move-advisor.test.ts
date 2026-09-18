// @vitest-environment jsdom
/**
 * The move advisor's **card half** (`src/ui/common/MoveAdvisor.ts`) and the two
 * battle HUDs that mount it.
 *
 * The reasoning — that the top row is the shipped tactic and the numbers come
 * out of the engine's own damage chain — is proved against real engines in
 * `tests/unit/advisor.test.ts` and `tests/unit/advisor-simulate.test.ts`. What
 * is left for a DOM test is the half the player touches:
 *
 *  * **Optional means optional.** `N`, the pad's right trigger and the card's
 *    own chip all hide it, the answer survives into `Settings.advisorVisible`,
 *    and what is left on screen is a chip two words wide.
 *  * **It follows the selection.** `showDecision` is the only thing that
 *    recomputes, so the card names whoever the menu is open for and goes away
 *    the moment the command is taken.
 *  * **It never sits on the command menu.** The card is measured between two
 *    anchors the HUD owner names, every frame, and a *hidden* anchor is not an
 *    edge — the trap `.ffx2hud__command` sets and `StrategyGuide` documents.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { SaveStore, defaultSettings } from '../../src/app/SaveData.ts';
import { MoveAdvisor } from '../../src/ui/common/MoveAdvisor.ts';
import { ADVISOR_HINT_ITEM } from '../../src/ui/common/ControlsHint.ts';
import { FFXBattleHud } from '../../src/ui/ffx/FFXBattleHud.ts';
import { FFX2BattleHud } from '../../src/ui/ffx2/FFX2BattleHud.ts';
import { makeFakeBattleState, makeFakeCommands } from '../../src/ui/ffx/testFixtures.ts';

// ------------------------------------------------------------------ helpers

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

/**
 * Everything mounted by a test, torn down after it.
 *
 * Not housekeeping: the card's `N` is a **window** listener, so one left
 * mounted by an earlier test still answers `pressN()` in a later one and writes
 * its own answer to the shared save.
 */
const live: Array<{ unmount(): void }> = [];

function mountAdvisor(
  overrides: Partial<ConstructorParameters<typeof MoveAdvisor>[0]> = {},
): { advisor: MoveAdvisor; stage: HTMLElement } {
  const stage = document.createElement('div');
  stage.style.position = 'absolute';
  document.body.appendChild(stage);
  const advisor = new MoveAdvisor({
    game: 'ffx',
    anchors: { left: 196, right: 414, bottom: 26 },
    ...overrides,
  });
  advisor.mount(stage);
  live.push(advisor);
  return { advisor, stage };
}

function mountHud<T extends { mount(root: HTMLElement): void; unmount(): void }>(hud: T): { hud: T; root: HTMLElement } {
  const root = document.createElement('div');
  document.body.appendChild(root);
  hud.mount(root);
  live.push(hud);
  return { hud, root };
}

function pressN(modifiers: KeyboardEventInit = {}): void {
  window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyN', ...modifiers }));
}

function cardOf(root: HTMLElement): HTMLElement {
  return root.querySelector<HTMLElement>('[data-role="move-advisor-card"]')!;
}

function toggleOf(root: HTMLElement): HTMLButtonElement {
  return root.querySelector<HTMLButtonElement>('[data-role="move-advisor-toggle"]')!;
}

/** jsdom has no layout engine, so an anchor has to be told what box it occupies. */
function boxed(left: number, width: number): HTMLElement {
  const el = document.createElement('div');
  Object.defineProperty(el, 'offsetLeft', { value: left, configurable: true });
  Object.defineProperty(el, 'offsetWidth', { value: width, configurable: true });
  return el;
}

/** Open a decision on the card with the shared FFX fixtures. */
function open(advisor: MoveAdvisor, actorId = 'tidus'): void {
  advisor.showDecision(actorId, makeFakeCommands(), makeFakeBattleState());
}

let padButtons: Array<{ pressed: boolean }> = [];
let padPluggedIn = false;
let store: SaveStore;

beforeEach(() => {
  padButtons = Array.from({ length: 10 }, () => ({ pressed: false }));
  padPluggedIn = false;
  Object.defineProperty(navigator, 'getGamepads', {
    configurable: true,
    writable: true,
    value: () => (padPluggedIn ? [{ connected: true, buttons: padButtons, axes: [0, 0] }] : []),
  });
  store = new SaveStore('pyrefly-test-advisor', memoryStorage());
});
afterEach(() => {
  while (live.length) live.pop()!.unmount();
  document.body.innerHTML = '';
});

// ------------------------------------------------------------- the default

describe('the card is on the first time a chapter is played', () => {
  it('ships defaulting to visible', () => {
    expect(defaultSettings().advisorVisible).toBe(true);
  });

  it('opens with the card up when the player has never said otherwise', () => {
    const { advisor, stage } = mountAdvisor();
    open(advisor);
    expect(advisor.isVisible).toBe(true);
    expect(cardOf(stage).hidden).toBe(false);
  });

  it('opens hidden for a player who turned it off in an earlier battle', () => {
    store.setSettings({ advisorVisible: false });
    const { advisor, stage } = mountAdvisor();
    open(advisor);
    expect(advisor.isVisible).toBe(false);
    expect(cardOf(stage).hidden).toBe(true);
  });

  it('is its own preference, independent of the guide', () => {
    store.setSettings({ guideVisible: false, advisorVisible: true });
    const { advisor } = mountAdvisor();
    expect(advisor.isVisible).toBe(true);
    expect(store.settings.guideVisible).toBe(false);
  });
});

// ------------------------------------------------------------------ toggle

describe('turning it off', () => {
  it('hides the card and leaves only the chip', () => {
    const { advisor, stage } = mountAdvisor();
    open(advisor);
    expect(cardOf(stage).textContent).not.toBe('');

    pressN();
    expect(advisor.isVisible).toBe(false);
    expect(cardOf(stage).hidden).toBe(true);
    const chip = toggleOf(stage);
    expect(chip.hidden).toBe(false);
    expect(chip.textContent).toContain(ADVISOR_HINT_ITEM.keyboard);
    expect(chip.getAttribute('aria-pressed')).toBe('false');
  });

  it('remembers the answer in SaveData, for every later battle', () => {
    const { advisor } = mountAdvisor();
    pressN();
    expect(store.settings.advisorVisible).toBe(false);
    expect(advisor.isVisible).toBe(false);

    pressN();
    expect(store.settings.advisorVisible).toBe(true);
  });

  it('answers a click on the chip as well as the key', () => {
    const { advisor, stage } = mountAdvisor();
    toggleOf(stage).click();
    expect(advisor.isVisible).toBe(false);
    toggleOf(stage).click();
    expect(advisor.isVisible).toBe(true);
  });

  it('answers the pad’s right trigger, on the edge only', () => {
    padPluggedIn = true;
    const { advisor } = mountAdvisor();
    padButtons[7]!.pressed = true;
    advisor.update(16);
    expect(advisor.isVisible).toBe(false);
    // Held, not tapped: no second toggle.
    advisor.update(16);
    advisor.update(16);
    expect(advisor.isVisible).toBe(false);
    padButtons[7]!.pressed = false;
    advisor.update(16);
    padButtons[7]!.pressed = true;
    advisor.update(16);
    expect(advisor.isVisible).toBe(true);
  });

  it('does not collide with the guide’s pad button', () => {
    padPluggedIn = true;
    const { advisor } = mountAdvisor();
    padButtons[2]!.pressed = true; // the strategy guide's button
    advisor.update(16);
    expect(advisor.isVisible).toBe(true);
  });

  it('ignores N with a modifier held, and key repeat', () => {
    const { advisor } = mountAdvisor();
    pressN({ ctrlKey: true });
    pressN({ metaKey: true });
    pressN({ altKey: true });
    pressN({ repeat: true });
    expect(advisor.isVisible).toBe(true);
  });

  it('stops listening once the card is unmounted', () => {
    const { advisor } = mountAdvisor();
    advisor.unmount();
    live.pop();
    pressN();
    expect(advisor.isVisible).toBe(true);
    expect(store.settings.advisorVisible).toBe(true);
  });
});

// -------------------------------------------------------------- the content

describe('what the card says', () => {
  it('names the character whose menu is open', () => {
    const { advisor, stage } = mountAdvisor();
    open(advisor, 'yuna');
    expect(cardOf(stage).textContent).toContain('Yuna');
    expect(advisor.view()?.actorId).toBe('yuna');
  });

  it('follows the selection when the turn passes to someone else', () => {
    const { advisor, stage } = mountAdvisor();
    open(advisor, 'tidus');
    expect(advisor.view()?.actorId).toBe('tidus');
    open(advisor, 'auron');
    expect(advisor.view()?.actorId).toBe('auron');
    expect(cardOf(stage).textContent).toContain('Auron');
  });

  it('prints the move, its cost and its hit chance', () => {
    const { advisor, stage } = mountAdvisor();
    open(advisor);
    const text = cardOf(stage).textContent ?? '';
    const top = advisor.view()!.suggestions[0]!;
    expect(text).toContain(top.label);
    expect(text).toMatch(/MP/);
    expect(text).toMatch(/always hits|% to hit/);
  });

  it('goes away when the decision is taken', () => {
    const { advisor, stage } = mountAdvisor();
    open(advisor);
    expect(stage.querySelector<HTMLElement>('[data-role="move-advisor"]')!.hidden).toBe(false);
    advisor.clearDecision();
    expect(advisor.view()).toBeNull();
    expect(stage.querySelector<HTMLElement>('[data-role="move-advisor"]')!.hidden).toBe(true);
  });

  it('escapes what it prints', () => {
    const state = makeFakeBattleState();
    state.combatants['tidus']!.name = '<img src=x onerror=alert(1)>';
    const { advisor, stage } = mountAdvisor();
    advisor.showDecision('tidus', makeFakeCommands(), state);
    expect(cardOf(stage).querySelector('img')).toBeNull();
    expect(cardOf(stage).textContent).toContain('<img');
  });
});

// --------------------------------------------------------------- the layout

describe('the card is measured, never a fixed box', () => {
  it('starts after its left anchor and stops before its right one', () => {
    const after = boxed(30, 152);
    const before = boxed(417, 200);
    const { advisor, stage } = mountAdvisor({
      anchors: { after: () => after, before: () => before, left: 196, right: 414, bottom: 26 },
    });
    open(advisor);
    advisor.update(16);
    const card = cardOf(stage);
    expect(parseFloat(card.style.left)).toBe(188); // 30 + 152 + 6
    expect(parseFloat(card.style.width)).toBe(223); // (417 - 6) - 188
  });

  it('treats a hidden anchor as no edge at all', () => {
    // `.ffx2hud__command` is `hidden` between decisions and reports 0 for both
    // offsets. Believed, it would pin the card to the stage's left edge.
    const hidden = boxed(0, 0);
    const { advisor, stage } = mountAdvisor({
      anchors: { after: () => hidden, before: () => hidden, left: 232, right: 470, bottom: 26 },
    });
    open(advisor);
    advisor.update(16);
    expect(parseFloat(cardOf(stage).style.left)).toBe(232);
    expect(parseFloat(cardOf(stage).style.width)).toBe(226); // clamped to MAX_CARD_WIDTH
  });

  it('never squeezes below a readable width', () => {
    const after = boxed(30, 300);
    const before = boxed(360, 200);
    const { advisor, stage } = mountAdvisor({
      anchors: { after: () => after, before: () => before, left: 196, right: 414, bottom: 26 },
    });
    open(advisor);
    advisor.update(16);
    expect(parseFloat(cardOf(stage).style.width)).toBeGreaterThanOrEqual(132);
  });

  it('stops measuring while the card is off', () => {
    const after = boxed(30, 152);
    const { advisor, stage } = mountAdvisor({
      anchors: { after: () => after, left: 196, right: 414, bottom: 26 },
    });
    open(advisor);
    advisor.update(16);
    expect(parseFloat(toggleOf(stage).style.left)).toBe(188);
    pressN();
    // The chip drops its measured anchor with the card it was measured against.
    expect(toggleOf(stage).style.left).toBe('');
  });
});

// ----------------------------------------------------------------- the HUDs

describe('both HUDs mount it', () => {
  it('FFX puts the card inside its scaled stage', () => {
    const { hud, root } = mountHud(new FFXBattleHud());
    const card = root.querySelector<HTMLElement>('[data-role="move-advisor"]');
    expect(card).not.toBeNull();
    expect(card!.closest('.ffxhud__stage')).not.toBeNull();
    expect(hud.moveAdvisor).toBeInstanceOf(MoveAdvisor);
  });

  it('FFX-2 mounts it with the pink-accent root class', () => {
    const { hud, root } = mountHud(new FFX2BattleHud());
    const card = root.querySelector<HTMLElement>('[data-role="move-advisor"]');
    expect(card).not.toBeNull();
    expect(card!.classList.contains('mad--ffx2')).toBe(true);
    expect(card!.closest('.ffx2hud__stage')).not.toBeNull();
    expect(hud.moveAdvisor.isVisible).toBe(true);
  });
});
