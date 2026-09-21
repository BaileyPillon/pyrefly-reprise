// @vitest-environment jsdom
/**
 * The strategy guide's **panel half** (`src/ui/common/StrategyGuide.ts`) and
 * the two battle HUDs that mount it.
 *
 * The reasoning — that NEXT is the shipped `intendedStrategy` and nothing else —
 * is proved in `tests/unit/strategy-guide.test.ts` against real engines. What
 * is left for a DOM test is the half the player actually touches:
 *
 *  * **Optional means optional.** G, the pad's spare face button and the chip
 *    itself all hide the slab, the answer survives into `Settings.guideVisible`,
 *    and what remains on screen when it is off is a chip two words wide and
 *    nothing else. A guide that could not be turned off, or that came back on
 *    next battle, would be a worse game than no guide.
 *  * **It never sits on the command menu.** The rail is measured against
 *    anchors the HUD owner names, every frame, because the FFX command stack's
 *    top edge moves as a submenu fills. The layout tests below drive that
 *    measurement directly rather than eyeballing a screenshot.
 *  * **Both games.** FFX and FFX-2 mount it, and the FFX-2 copy picks up the
 *    pink accent from its `.ig--ffx2` root rather than carrying its own colour.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { AtbSnapshot, BattleState, FFX2Combatant } from '../../src/battle/common/types.ts';
import { SaveStore, defaultSettings } from '../../src/app/SaveData.ts';
import { StrategyGuide } from '../../src/ui/common/StrategyGuide.ts';
import { GUIDE_HINT_ITEM } from '../../src/ui/common/ControlsHint.ts';
import { FFXBattleHud } from '../../src/ui/ffx/FFXBattleHud.ts';
import { FFX2BattleHud } from '../../src/ui/ffx2/FFX2BattleHud.ts';
import { makeFakeBattleState, makeFakeCommands, makeFakeTurnPreview } from '../../src/ui/ffx/testFixtures.ts';

// ------------------------------------------------------------------ helpers

/** A `StorageLike` that lives and dies with one test. */
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
 * Not housekeeping: the guide's G key is a **window** listener, so a guide left
 * mounted by an earlier test in this file still answers `pressG()` in a later
 * one and writes its own answer to the shared save. The first draft of this
 * file had exactly that bug, and it showed up as three unrelated assertions
 * failing in the tests that happened to run last.
 */
const live: Array<{ unmount(): void }> = [];

function mountGuide(
  overrides: Partial<ConstructorParameters<typeof StrategyGuide>[0]> = {},
): { guide: StrategyGuide; stage: HTMLElement } {
  const stage = document.createElement('div');
  stage.style.position = 'absolute';
  document.body.appendChild(stage);
  const guide = new StrategyGuide({ game: 'ffx', anchors: { top: 44, bottom: 34 }, ...overrides });
  guide.mount(stage);
  live.push(guide);
  return { guide, stage };
}

function mountHud<T extends { mount(root: HTMLElement): void; unmount(): void }>(hud: T): { hud: T; root: HTMLElement } {
  const root = document.createElement('div');
  document.body.appendChild(root);
  hud.mount(root);
  live.push(hud);
  return { hud, root };
}

function pressG(): void {
  window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyG' }));
}

function panelOf(root: HTMLElement): HTMLElement {
  return root.querySelector<HTMLElement>('[data-role="strategy-guide-panel"]')!;
}

/**
 * The measured column: the ink slab, then the MORE row.
 *
 * Round 04 PR-0009 moved the rail's geometry off `.sgd__panel` and onto
 * `.sgd__stack`. The panel is the slab now and nothing else, so its box can
 * end exactly where the type ends instead of eleven px further down with a
 * MORE chip painted over the difference. The anchor arithmetic these tests
 * pin is unchanged — it is read one element out.
 */
function stackOf(root: HTMLElement): HTMLElement {
  return root.querySelector<HTMLElement>('[data-role="strategy-guide-stack"]')!;
}

function toggleOf(root: HTMLElement): HTMLButtonElement {
  return root.querySelector<HTMLButtonElement>('[data-role="strategy-guide-toggle"]')!;
}

/**
 * A stub element that reports a laid-out box.
 *
 * jsdom has no layout engine, so `offsetTop`/`offsetHeight` are always 0 — and
 * 0 is exactly the value `layout()` has to treat as "not laid out", which makes
 * an un-stubbed jsdom element indistinguishable from a hidden one. Defining the
 * two properties is what lets the anchor arithmetic be tested at all.
 */
function boxed(top: number, height: number): HTMLElement {
  const el = document.createElement('div');
  Object.defineProperty(el, 'offsetTop', { value: top, configurable: true });
  Object.defineProperty(el, 'offsetHeight', { value: height, configurable: true });
  return el;
}

/**
 * The one fake pad this file uses.
 *
 * Installed for every test, not only the pad one: jsdom has no `getGamepads`,
 * and both this rail and `src/ui/ffx/rawInput.ts` (started by the FFX command
 * menu) poll it on a frame callback. A stub defined inside a single test leaks
 * into every later one — and a stub without `axes` crashes `rawInput`'s own
 * poll as an unhandled rejection that fails the whole file.
 */
let padButtons: Array<{ pressed: boolean }> = [];
/** Default: keyboard only, which is what the chip's wording has to assume. */
let padPluggedIn = false;

function plugInPad(): void {
  padPluggedIn = true;
}

let store: SaveStore;
beforeEach(() => {
  padButtons = [{ pressed: false }, { pressed: false }, { pressed: false }];
  padPluggedIn = false;
  Object.defineProperty(navigator, 'getGamepads', {
    configurable: true,
    writable: true,
    value: () => (padPluggedIn ? [{ connected: true, buttons: padButtons, axes: [0, 0] }] : []),
  });
  // Becomes the process-wide `activeSave()` for this test — see SaveData.ts.
  store = new SaveStore('pyrefly-test-guide', memoryStorage());
});
afterEach(() => {
  while (live.length) live.pop()!.unmount();
  document.body.innerHTML = '';
});

// ------------------------------------------------------------- the default

describe('the guide is on the first time a chapter is played', () => {
  it('ships defaulting to visible', () => {
    expect(defaultSettings().guideVisible).toBe(true);
  });

  it('opens with the panel up when the player has never said otherwise', () => {
    const { guide, stage } = mountGuide();
    expect(guide.isVisible).toBe(true);
    expect(panelOf(stage).hidden).toBe(false);
  });

  it('opens hidden for a player who turned it off in an earlier battle', () => {
    store.setSettings({ guideVisible: false });
    const { guide, stage } = mountGuide();
    expect(guide.isVisible).toBe(false);
    expect(panelOf(stage).hidden).toBe(true);
  });
});

// ------------------------------------------------------------------ toggle

describe('turning it off', () => {
  it('hides the whole slab and leaves only the chip', () => {
    const { guide, stage } = mountGuide();
    guide.sync(makeFakeBattleState());
    expect(panelOf(stage).textContent).not.toBe('');

    pressG();
    expect(guide.isVisible).toBe(false);
    expect(panelOf(stage).hidden).toBe(true);
    // The chip is the only thing left, and it still says how to get the rest
    // back. Nothing else in the rail survives.
    const chip = toggleOf(stage);
    expect(chip.hidden).toBe(false);
    expect(chip.textContent).toContain(GUIDE_HINT_ITEM.keyboard);
    expect(chip.getAttribute('aria-pressed')).toBe('false');
  });

  it('remembers the answer in SaveData, for every later battle', () => {
    const { guide } = mountGuide();
    pressG();
    expect(store.settings.guideVisible).toBe(false);
    expect(guide.isVisible).toBe(false);

    pressG();
    expect(store.settings.guideVisible).toBe(true);
  });

  it('answers a click on the chip as well as the key', () => {
    const { guide, stage } = mountGuide();
    toggleOf(stage).click();
    expect(guide.isVisible).toBe(false);
    toggleOf(stage).click();
    expect(guide.isVisible).toBe(true);
  });

  it('answers the pad’s spare face button, on the edge only', () => {
    plugInPad();
    const { guide } = mountGuide();
    padButtons[2]!.pressed = true;
    guide.update(0.016);
    expect(guide.isVisible).toBe(false);
    // Held down across frames: one press, one toggle.
    guide.update(0.016);
    guide.update(0.016);
    expect(guide.isVisible).toBe(false);
    padButtons[2]!.pressed = false;
    guide.update(0.016);
    expect(guide.isVisible).toBe(false);
    padButtons[2]!.pressed = true;
    guide.update(0.016);
    expect(guide.isVisible).toBe(true);
  });

  it('leaves the pad buttons the game already binds alone', () => {
    plugInPad();
    const { guide } = mountGuide();
    padButtons[0]!.pressed = true; // confirm
    padButtons[1]!.pressed = true; // cancel
    guide.update(0.016);
    expect(guide.isVisible).toBe(true);
  });

  it('names the control the player actually has: the key, or the pad button once one is plugged in', () => {
    const keyboard = mountGuide();
    expect(toggleOf(keyboard.stage).textContent).toContain(GUIDE_HINT_ITEM.keyboard);

    plugInPad();
    const pad = mountGuide();
    expect(toggleOf(pad.stage).textContent).toContain(GUIDE_HINT_ITEM.gamepad);
  });

  it('ignores G as a modifier chord and as an auto-repeat, so typing elsewhere cannot flip it', () => {
    const { guide } = mountGuide();
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyG', ctrlKey: true }));
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyG', metaKey: true }));
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyG', repeat: true }));
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyH' }));
    expect(guide.isVisible).toBe(true);
  });

  it('stops listening once unmounted, so a finished battle’s guide does not eat the key', () => {
    const { guide } = mountGuide();
    guide.unmount();
    pressG();
    expect(guide.isVisible).toBe(true);
    expect(store.settings.guideVisible).toBe(true);
  });
});

// ------------------------------------------------------------------ content

describe('what the slab says', () => {
  it('prints NEXT, WATCH and RULES for the chapter on the field', () => {
    const { guide, stage } = mountGuide();
    const state = makeFakeBattleState();
    state.log = [
      ...state.log,
      { seq: 1, type: 'charge', enemyId: 'seymour-flux', name: 'Auto-Attack Mode', turnsLeft: 2, stage: 1 },
    ] as BattleState['log'];
    guide.sync(state);
    guide.showDecision('tidus', makeFakeCommands());

    const text = panelOf(stage).textContent ?? '';
    expect(text).toContain('Seymour Flux');
    expect(text).toContain('Total Annihilation');
    expect(text).toContain('in 2 turns');
    // A RULES bullet and its citation.
    expect(text).toMatch(/Mortiorchis/);
    expect(panelOf(stage).querySelectorAll('.sgd__rules li').length).toBeGreaterThanOrEqual(3);
    expect(panelOf(stage).querySelectorAll('.sgd__cite').length).toBeGreaterThan(3);
  });

  it('says it is waiting rather than going blank between turns', () => {
    const { guide, stage } = mountGuide();
    guide.sync(makeFakeBattleState());
    guide.showDecision('tidus', makeFakeCommands());
    expect(panelOf(stage).querySelector('.sgd__idle')).toBeNull();
    guide.clearDecision();
    expect(panelOf(stage).querySelector('.sgd__idle')).not.toBeNull();
  });

  it('shows nothing at all — not even the chip — on a board with no written guide', () => {
    const { guide, stage } = mountGuide();
    const state = makeFakeBattleState();
    state.combatants = {};
    guide.sync(state);
    expect(stage.querySelector<HTMLElement>('[data-role="strategy-guide"]')!.hidden).toBe(true);
  });

  it('escapes the written content rather than injecting it', () => {
    const { guide, stage } = mountGuide();
    const state = makeFakeBattleState();
    state.combatants['seymour-flux']!.name = '<img src=x onerror=alert(1)>';
    guide.sync(state);
    guide.showDecision('tidus', makeFakeCommands());
    expect(panelOf(stage).querySelector('img')).toBeNull();
  });

  it('marks an imminent telegraph differently from a charging one', () => {
    const { guide, stage } = mountGuide();
    const state = makeFakeBattleState();
    state.log = [
      { seq: 1, type: 'charge', enemyId: 'seymour-flux', name: 'Ready To Annihilate', turnsLeft: 1, stage: 2 },
    ] as BattleState['log'];
    guide.sync(state);
    expect(panelOf(stage).querySelector('.sgd__charge--s2')).not.toBeNull();
    expect(panelOf(stage).querySelector('.sgd__charge--s1')).toBeNull();
  });
});

// ------------------------------------------------------------------- layout

describe('the rail is measured, never fixed', () => {
  it('starts below its top anchor and stops above its bottom one', () => {
    const above = boxed(240, 80);
    const below = boxed(20, 24);
    const { guide, stage } = mountGuide({ anchors: { below: () => below, above: () => above, top: 44, bottom: 34 } });
    guide.sync(makeFakeBattleState());
    guide.update(0.016);

    const stack = stackOf(stage);
    // 20 + 24 + the 5px clearance gap + the 11px the `G GUIDE` chip rides above
    // the rail's own top edge. The chip is what has to clear the anchor, not the
    // panel: without the reserve the rail cleared FFX's action banner and the
    // chip landed on it (docs/handoff/fix3-ffx-hud.md, defect 4).
    expect(Number.parseFloat(stack.style.top)).toBeCloseTo(60, 1);
    // 240 - 5 - 60.
    expect(Number.parseFloat(stack.style.maxHeight)).toBeCloseTo(175, 1);
    // ...and the chip now sits *below* the anchor's bottom edge, not on it.
    expect(Number.parseFloat(toggleOf(stage).style.top)).toBeGreaterThanOrEqual(20 + 24);
  });

  it('gives the rail back as the command stack shrinks', () => {
    let cmdTop = 200;
    const cmd = document.createElement('div');
    Object.defineProperty(cmd, 'offsetTop', { get: () => cmdTop });
    Object.defineProperty(cmd, 'offsetHeight', { get: () => 360 - 26 - cmdTop });
    const { guide, stage } = mountGuide({ anchors: { above: () => cmd, top: 44, bottom: 34 } });
    guide.sync(makeFakeBattleState());
    guide.update(0.016);
    const withSubmenu = Number.parseFloat(stackOf(stage).style.maxHeight);

    cmdTop = 290; // submenu closed: the stack is three rows again
    guide.update(0.016);
    expect(Number.parseFloat(stackOf(stage).style.maxHeight)).toBeGreaterThan(withSubmenu);
  });

  /**
   * The bug this pins: `.ffx2hud__command` is `hidden` whenever no menu is
   * open, and a hidden element reports `offsetTop: 0`. Treated as a real edge
   * that put the rail's floor five pixels above the top of the stage and
   * collapsed it to the minimum for the entire battle.
   */
  it('ignores an anchor that is not laid out, instead of collapsing to the minimum', () => {
    const hidden = boxed(0, 0);
    const { guide, stage } = mountGuide({ anchors: { above: () => hidden, top: 44, bottom: 34 } });
    guide.sync(makeFakeBattleState());
    guide.update(0.016);
    // Falls back to `bottom`: 360 - 34 - 44.
    expect(Number.parseFloat(stackOf(stage).style.maxHeight)).toBeCloseTo(282, 1);
  });

  it('never squeezes below a readable height', () => {
    const { guide, stage } = mountGuide({ anchors: { above: () => boxed(50, 300), top: 44, bottom: 34 } });
    guide.sync(makeFakeBattleState());
    guide.update(0.016);
    expect(Number.parseFloat(stackOf(stage).style.maxHeight)).toBe(56);
  });

  /**
   * Round 04 PR-0009, measured live: "MORE chip box 252.50-280.00 intersects 2
   * glyph line boxes". It could, because it was an absolutely positioned chip
   * whose `top` the layout wrote at the slab's own bottom edge. As the second
   * row of a flex column it has nowhere to overlap from.
   */
  it('lays the slab and the MORE row out as one column, so the chip can never sit on the text', () => {
    const { guide, stage } = mountGuide({ anchors: { below: () => boxed(20, 24), top: 44, bottom: 34 } });
    guide.sync(makeFakeBattleState());
    guide.update(0.016);

    const roles = [...stackOf(stage).children].map((c) => (c as HTMLElement).dataset['role']);
    expect(roles).toEqual(['strategy-guide-panel', 'strategy-guide-more']);
    // Nothing writes a `top` onto the affordance any more: its place in the
    // column is its position.
    expect(stage.querySelector<HTMLElement>('[data-role="strategy-guide-more"]')!.style.top).toBe('');
  });

  /**
   * Round 05 PR-0050 (both games; observed in FFX-2). This used to assert the
   * opposite — that switching the guide off cleared the inline `top` so the
   * chip fell back to `.sgd__toggle`'s static `top: 44px`. That fallback is
   * only correct for FFX, whose action banner ends at grid y 48; in FFX-2 the
   * chrome above the rail is the boss gauge strip, and the chip was drawn
   * across the boss nameplate, HP bar and SCAN label. The anchor is chrome the
   * owner named, not the panel, so it survives the panel being hidden.
   */
  it('keeps the chip’s measured anchor when the guide is switched off', () => {
    const { guide, stage } = mountGuide({ anchors: { below: () => boxed(20, 24), top: 44, bottom: 34 } });
    guide.sync(makeFakeBattleState());
    guide.update(0.016);
    // 20 + 24 + CLEARANCE_GAP(5) + CHIP_RISE(11) = 60 for the rail, 49 for the chip.
    expect(Number.parseFloat(toggleOf(stage).style.top)).toBeCloseTo(49, 2);
    pressG();
    expect(Number.parseFloat(toggleOf(stage).style.top)).toBeCloseTo(49, 2);
    // And it is still the anchor, not a frozen value: the strip moves, the chip
    // follows, with the panel still down.
    guide.update(0.016);
    expect(Number.parseFloat(toggleOf(stage).style.top)).toBeCloseTo(49, 2);
  });
});

// -------------------------------------------------------------- both HUDs

describe('FFXBattleHud', () => {
  it('mounts the rail inside the letterbox stage, so it scales with the chrome', () => {
    const { root } = mountHud(new FFXBattleHud());

    const rail = root.querySelector<HTMLElement>('[data-role="strategy-guide"]')!;
    expect(rail).not.toBeNull();
    expect(rail.closest('.ffxhud__stage')).not.toBeNull();
    // Gold, not pink: no FFX-2 modifier on an FFX rail.
    expect(rail.classList.contains('sgd--ffx2')).toBe(false);
  });

  it('feeds the rail from sync and from the open decision', () => {
    const { hud, root } = mountHud(new FFXBattleHud());
    hud.sync(makeFakeBattleState(), makeFakeTurnPreview());
    expect(panelOf(root).textContent).toContain('Seymour Flux');

    void hud.chooseCommand('tidus', makeFakeCommands(), () => makeFakeTurnPreview());
    expect(hud.strategyGuide.view()?.next).not.toBeNull();
  });

  it('takes the rail down with the HUD, key listener and all', () => {
    const { hud } = mountHud(new FFXBattleHud());
    hud.unmount();
    expect(document.querySelector('[data-role="strategy-guide"]')).toBeNull();
    pressG();
    expect(store.settings.guideVisible).toBe(true);
  });
});

describe('FFX2BattleHud', () => {
  function ffx2State(): BattleState {
    const boss = {
      id: 'bahamut',
      name: 'Bahamut',
      side: 'enemy',
      spriteKey: 'bahamut',
      alive: true,
      removed: false,
      hp: 8_400,
      mp: 0,
      statuses: {},
      affinities: {},
      immunities: {},
      immunityFlags: [],
      controller: 'ai',
      slot: 0,
      flags: {},
      stats: { hp: 8_400, mp: 0, str: 40, def: 30, mag: 40, mdef: 30, agi: 20, luck: 10, eva: 5, acc: 100, maxHp: 8_400, maxMp: 0 },
      atb: { ticks: 0, required: 16_000, gauge: 0, charging: null, recovery: 0 },
      accessories: [],
      chainCount: 0,
      chainWindowTicks: 0,
    } as unknown as FFX2Combatant;
    return {
      game: 'ffx2',
      combatants: { bahamut: boss },
      activeIds: [],
      reserveIds: [],
      enemyIds: ['bahamut'],
      aeonId: null,
      turn: 1,
      ticks: 0,
      log: [],
      nextSeq: 1,
      triggers: [],
      firedTriggerIds: [],
      result: null,
      seed: 1,
      flags: {},
    } as unknown as BattleState;
  }
  const snapshot: AtbSnapshot = { elapsedMs: 0, bars: [] };

  it('mounts the rail and takes the pink accent from its own root', () => {
    const { root } = mountHud(new FFX2BattleHud());

    const rail = root.querySelector<HTMLElement>('[data-role="strategy-guide"]')!;
    expect(rail).not.toBeNull();
    expect(rail.closest('.ffx2hud__stage')).not.toBeNull();
    // `.ig--ffx2` on the HUD root repoints `--ig-accent`; the rail only has to
    // be inside it and carry its own modifier for the few rules that need one.
    expect(rail.classList.contains('sgd--ffx2')).toBe(true);
    expect(rail.closest('.ig--ffx2')).not.toBeNull();
  });

  it('shows the FFX-2 chapter’s guide for the boss on the field', () => {
    const { hud, root } = mountHud(new FFX2BattleHud());
    hud.sync(ffx2State(), snapshot);
    expect(panelOf(root).textContent).toContain('Bahamut');
    expect(hud.strategyGuide.view()?.chapterId).toBe('ffx2-bahamut');
  });

  it('takes the rail down with the HUD', () => {
    const { hud } = mountHud(new FFX2BattleHud());
    hud.unmount();
    expect(document.querySelector('[data-role="strategy-guide"]')).toBeNull();
  });
});
