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
import {
  MAX_DENSITY,
  MoveAdvisor,
  cardHtml,
  type Density,
} from '../../src/ui/common/MoveAdvisor.ts';
import type { AdvisorView, MoveSuggestion } from '../../src/engine/tactics/advisor.ts';
import type { AvailableCommand, BattleState, Command } from '../../src/battle/common/types.ts';
import {
  createFFXEngine,
  registerFFXAbilities,
  registerFFXItems,
  resetFFXRegistry,
} from '../../src/battle/ffx/index.ts';
import { ALL_ABILITIES, ITEMS } from '../../src/data/ffx/index.ts';
import { gagazetBuild } from '../../src/data/ffx/builds/gagazet.ts';
import { seymourFluxGroup } from '../../src/data/ffx/enemies/seymour-flux.ts';
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

/**
 * The chip says one of two things, and the player chose which.
 *
 * It briefly said a third: for one build the FFX HUD could *decline* the card
 * when `hudSafeZones.ts` found no box it fits in, and the chip then reported the
 * HUD's decision rather than the player's. On Chapter 1 that was five of seven
 * decisions with no card at all. The fallback is the live build's placement now
 * (`FFXBattleHud.placeAdvisor`), the card is only ever away because `N` put it
 * away, and there is no third label — see `ui-ffx-hud-safe-zones.test.ts` for
 * the HUD half.
 */
describe('the chip', () => {
  it('reads hide moves with the card up and best move with it away', () => {
    const { stage } = mountAdvisor();
    const chip = toggleOf(stage);
    expect(chip.textContent?.toLowerCase()).toContain('hide moves');
    pressN();
    expect(chip.textContent?.toLowerCase()).toContain('best move');
    pressN();
    expect(chip.textContent?.toLowerCase()).toContain('hide moves');
  });

  it('has no vocabulary for a card the HUD withheld', async () => {
    // Belt and braces for a label that was, in an earlier round, a stylesheet
    // `content:` string no `textContent` could see: the advisor's own two files
    // are read off disk and must not contain the words anywhere — not in the
    // element, not in the CSS, not in a comment that a later agent copies.
    const { readFile } = await import('node:fs/promises');
    const { resolve } = await import('node:path');
    // `process.cwd()` rather than `import.meta.url`: under the jsdom
    // environment the module URL is resolved against the fake document, not the
    // file on disk, and lands two directories above the repo.
    for (const rel of ['MoveAdvisor.ts', 'move-advisor.css']) {
      const path = resolve(process.cwd(), 'src/ui/common', rel);
      const src = await readFile(path, 'utf8');
      expect(src.toLowerCase(), `${rel} offers the player no room`).not.toMatch(/no[-\s]?room/);
      // Declared or called, not merely named: the header keeps the account of
      // why `setDeclined` was removed, and the next agent should read it.
      expect(src, `${rel} still has a declined state`).not.toMatch(/(setDeclined|isDeclined)\s*[(:]/);
    }
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

// ------------------------------------------------------------- fitting in

/**
 * The card fits the room it is given, by printing less.
 *
 * This is the regression the critic reproduced on the built preview: with a
 * second suggestion the card wanted 162px, `move-advisor.css` gives it 104, and
 * what fell off the bottom — behind a mask fade, with no scrollbar and no key
 * bound to scroll it — was the line that answered the report ("stand Yuna up")
 * [fix-3 round 1, F1]. Neither the stylesheet nor the FFX HUD's safe zone
 * belongs to this track, so the card does the fitting itself.
 *
 * jsdom performs no layout, so the numbers the fit is measured from are
 * supplied: the cap is an inline `max-height` — set exactly the way
 * `FFXBattleHud.placeAdvisor` sets it — and `scrollHeight` is made to depend on
 * what was actually rendered, so the loop being tested is the real one.
 */
function measured(card: HTMLElement, cap: number, perLine = 14): void {
  card.style.maxHeight = `${cap}px`;
  Object.defineProperty(card, 'clientWidth', { configurable: true, get: () => 210 });
  Object.defineProperty(card, 'clientHeight', {
    configurable: true,
    get: () => Math.min(cap, card.querySelectorAll('p, article').length * perLine),
  });
  Object.defineProperty(card, 'scrollHeight', {
    configurable: true,
    get: () => card.querySelectorAll('p, article').length * perLine,
  });
}

/**
 * Put {@link crowdedView} on the card through the same entry point the HUDs
 * use — `showDecision` computes a view from a board, and this one is written
 * by hand, so the cached view is swapped and the card re-rendered.
 */
function showCrowded(advisor: MoveAdvisor): void {
  const inner = advisor as unknown as {
    cached: AdvisorView | null;
    lastSignature: string;
    render(): void;
  };
  inner.cached = crowdedView();
  inner.lastSignature = '';
  inner.render();
}

/** A two-suggestion view with a revive underneath, the shape that overflowed. */
function crowdedView(): AdvisorView {
  const base = {
    command: { kind: 'attack', targets: ['seymour-flux'] } as unknown as MoveSuggestion['command'],
    targetId: 'seymour-flux',
    targetName: 'Seymour Flux',
    estimate: { kind: 'damage' as const, min: 900, mid: 1_100, max: 1_300, hits: 1, killsTarget: false },
    mpCost: 0,
    hitChance: 96,
    critChance: 12,
    statuses: [],
    cures: [],
    warning: '',
    isSwitch: false,
    cite: '',
    score: 1,
    source: 'simulated' as const,
  };
  return {
    actorId: 'tidus',
    actorName: 'Tidus',
    suggestions: [
      {
        ...base,
        label: 'Hastega',
        menu: 'White Magic',
        effect: 'Puts Haste on the whole party for several turns',
        reason: 'Haste on the party is the chapter’s opener',
        source: 'tactic',
      },
      {
        ...base,
        label: 'Mega Phoenix',
        menu: 'Items',
        targetName: 'the party',
        effect: 'Revives all fallen allies at full HP',
        reason: 'Only Yuna can call an aeon, revive or heal — stand Yuna up',
        warning: 'Seymour Flux uses Lance of Atrophy before Yuna can act',
      },
    ],
    note: 'Cross Cleave hits the whole party next — take it first, then raise Yuna',
    considered: 12,
  };
}

describe('the card prints less rather than hiding the bottom of itself', () => {
  it('drops decoration, in order, and never the answer', () => {
    const view = crowdedView();
    const text = (d: Density): string => {
      const el = document.createElement('div');
      el.innerHTML = cardHtml(view, d);
      return el.textContent ?? '';
    };
    // Every step is shorter than the one before it, or no longer: rung 4 cuts each reason to its first whole clause
    // (PR-0330, release 39.1: no sentence is clamped), and a reason of one clause is the same words there.
    for (let d = 1 as Density; d <= MAX_DENSITY; d = (d + 1) as Density) {
      const here = text(d).length;
      const before = text((d - 1) as Density).length;
      if (d === 4) expect(here, `density ${d}`).toBeLessThanOrEqual(before);
      else expect(here, `density ${d}`).toBeLessThan(before);
    }
    // The runner-up's effect line is the first thing to go. The lead's effect line is the **last** description to
    // go but one (PR-0330: it is the cheap line, 10 to 18 grid px, and the reason the dear one): it is on the card
    // through rung 5 and goes at rung 6 (the bare rung may keep it as one tight line when the box has the height).
    expect(text(0)).toContain('Revives all fallen allies');
    expect(text(1)).not.toContain('Revives all fallen allies');
    for (let d = 0 as Density; d <= 5; d = (d + 1) as Density) {
      expect(text(d), `density ${d}`).toContain('Puts Haste on the whole party');
    }
    expect(text(6)).not.toContain('Puts Haste on the whole party');
    // The lead's cost chip is on **every** rung, the last included (a free move says "no MP"; round 21 read a card
    // with no cost on it as a card that had lost it). It sits in the menu chip's row, so it costs no height.
    for (let d = 0 as Density; d <= MAX_DENSITY; d = (d + 1) as Density) {
      const el = document.createElement('div');
      el.innerHTML = cardHtml(view, d);
      const lead = el.querySelector('.mad__move')!;
      expect(lead.textContent, `density ${d}`).toMatch(/no MP|\d+ MP/);
    }
    // The lead's reason is cut to its first whole clause at rung 4 and is gone from rung 5; a runner-up's reason is a clause from
    // rung 4 and stays until the last rung takes it. Nothing is clamped to an ellipsis (PR-0330, release 39.1).
    for (let d = 0 as Density; d <= MAX_DENSITY; d = (d + 1) as Density) {
      const el = document.createElement('div');
      el.innerHTML = cardHtml(view, d);
      const reason = el.querySelector('.mad__move:not(.mad__move--alt) .mad__why');
      expect(!!reason, `density ${d} lead reason`).toBe(d <= 4);
      expect(el.querySelector('.mad__why--clamp, .mad__effect--clamp'), `density ${d} clamped`).toBeNull();
      expect(!!el.querySelector('.mad__move--alt .mad__why'), `density ${d} runner-up reason`).toBe(d <= 6);
    }

    // Down to the second-to-last rung the card still answers the question in
    // full: both moves, where they live, why the revive is being offered, and
    // the warning that goes with it.
    for (let d = 0 as Density; d < MAX_DENSITY; d = (d + 1) as Density) {
      const t = text(d);
      expect(t, `density ${d}`).toContain('in Items');
      expect(t, `density ${d}`).toContain('stand Yuna up');
      expect(t, `density ${d}`).toContain('Lance of Atrophy');
    }
    // Critic round 09 PR-0126: the *lead*'s own "in <submenu>" chip used to
    // vanish a rung early (the rung before the last folded the lead fully bare,
    // dropping 27 of 283 chapter 5 decisions' path chip). Round 13 (PR-0126, narrowed)
    // found the phone-compact last rung still dropped it — 'TIP Wakka' for a
    // Switch, 'TIP Darkness → all enemies' with no menu named — and on
    // desktop, any card fitted into a narrow `hudSafeZones.ts` "compact" box
    // walks its density ladder to this same rung, so the same loss showed up
    // there too (CHK-004, "say where"). The chip now survives **every** rung,
    // including the last: the reason line sheds first (see `showReason`
    // above), never the path to the row.
    for (let d = 0 as Density; d <= MAX_DENSITY; d = (d + 1) as Density) {
      expect(text(d), `density ${d}`).toContain('in White Magic');
    }
    // D-359: the lead was chosen by the chapter tactic (`source: 'tactic'`), and no rung prints a
    // "Guide's pick" tag for it any more; the menu chip is still there at the rung before the wipe.
    for (let d = 0 as Density; d <= MAX_DENSITY; d = (d + 1) as Density) {
      expect(text(d), `density ${d}`).not.toContain('Guide’s pick');
    }
    expect(text(MAX_DENSITY - 1 as Density)).toContain('in White Magic');
    // And at *every* rung, including the last-resort one, it still names both
    // moves and prints the note about the board.
    for (let d = 0 as Density; d <= MAX_DENSITY; d = (d + 1) as Density) {
      const t = text(d);
      expect(t, `density ${d}`).toContain('Mega Phoenix');
      expect(t, `density ${d}`).toContain('Hastega');
      expect(t, `density ${d}`).toContain('Cross Cleave hits the whole party');
    }
    // FOC-06 on a phone (release-09 verifier): at the 12.2px floor the title
    // badge wrapped to three lines and pushed the move under the cap. The last
    // rung drops the title, never the actor or a move.
    expect(text(MAX_DENSITY - 1 as Density)).toContain('Next best move');
    expect(text(MAX_DENSITY)).not.toContain('Next best move');
    expect(text(MAX_DENSITY)).toContain(view.actorName);
    // The note is above the moves, because a cap cuts the card's bottom.
    expect(text(0).indexOf('Cross Cleave hits')).toBeLessThan(text(0).indexOf('Hastega'));
  });

  it('compacts until it fits the cap it was given, on a real update tick', () => {
    const { advisor, stage } = mountAdvisor();
    const card = cardOf(stage);
    // 104 is `move-advisor.css`'s real cap; ten units a line is what makes the
    // full card overflow it here by about the ratio it overflowed by on the
    // preview (162 wanted against 104 given).
    measured(card, 104, 10);
    advisor.showDecision('tidus', makeFakeCommands(), makeFakeBattleState());
    showCrowded(advisor);
    advisor.update(16);

    expect(card.scrollHeight).toBeLessThanOrEqual(card.clientHeight + 1);
    expect(advisor.printedDensity).toBeGreaterThan(0);
    expect(card.textContent).toContain('stand Yuna up');
    expect(card.textContent).toContain('Cross Cleave hits the whole party');
  });

  it('relaxes again when the room comes back', () => {
    const { advisor, stage } = mountAdvisor();
    const card = cardOf(stage);
    let cap = 60;
    card.style.maxHeight = '60px';
    Object.defineProperty(card, 'clientWidth', { configurable: true, get: () => 210 });
    Object.defineProperty(card, 'clientHeight', {
      configurable: true,
      get: () => Math.min(cap, card.querySelectorAll('p, article').length * 14),
    });
    Object.defineProperty(card, 'scrollHeight', {
      configurable: true,
      get: () => card.querySelectorAll('p, article').length * 14,
    });
    advisor.showDecision('tidus', makeFakeCommands(), makeFakeBattleState());
    showCrowded(advisor);
    advisor.update(16);
    const tight = advisor.printedDensity;
    expect(tight).toBeGreaterThan(0);

    cap = 400;
    card.style.maxHeight = '400px';
    // Not mid-decision, however many frames pass: within one open decision the
    // card only ever gives things up. The FFX safe zone is solvable on some
    // frames and not on others, so a card that took the room back the instant
    // it appeared spent the whole turn flickering between two densities.
    for (let i = 0; i < 90; i++) advisor.update(16);
    expect(advisor.printedDensity, 'room is not taken back mid-decision').toBe(tight);

    // The next decision starts from nothing-given-up, which is where room that
    // has genuinely come back is picked up.
    advisor.showDecision('auron', makeFakeCommands(), makeFakeBattleState());
    showCrowded(advisor);
    advisor.update(16);
    expect(advisor.printedDensity).toBeLessThan(tight);
    expect(card.textContent).toContain('Revives all fallen allies');
  });

  it('keeps the lead’s effect as one tight line on the bare rung only when the box has the height for it (the Sin strip, Chapter XVIII)', () => {
    const lead = {
      command: { kind: 'ability', targets: [] } as unknown as MoveSuggestion['command'], targetId: null, targetName: 'the party', label: 'Hastega', menu: 'White Magic',
      effect: 'Speeds the party’s turns up', reason: 'It puts Haste on the party', estimate: null, mpCost: 30, hitChance: null, critChance: 0, statuses: [], cures: [],
      cite: '', warning: '', score: 1, isSwitch: false, source: 'simulated',
    } as unknown as MoveSuggestion;
    const view = { actorId: 'tidus', actorName: 'Tidus', suggestions: [lead], note: '', considered: 3 } as unknown as AdvisorView;
    const heights = (card: HTMLElement): number => card.querySelectorAll('p, article').length * 10 + (card.querySelector('.mad__head') ? 12 : 0);
    const run = (cap: number): { text: string; density: number } => {
      const { advisor, stage } = mountAdvisor();
      const card = cardOf(stage);
      card.style.maxHeight = `${cap}px`;
      Object.defineProperty(card, 'clientWidth', { configurable: true, get: () => 164 });
      Object.defineProperty(card, 'clientHeight', { configurable: true, get: () => Math.min(cap, heights(card)) });
      Object.defineProperty(card, 'scrollHeight', { configurable: true, get: () => heights(card) });
      advisor.showDecision('tidus', makeFakeCommands(), makeFakeBattleState());
      const inner = advisor as unknown as { cached: AdvisorView | null; lastSignature: string; render(): void };
      inner.cached = view;
      inner.lastSignature = '';
      inner.render();
      advisor.update(16);
      return { text: card.textContent ?? '', density: advisor.printedDensity };
    };
    // 36: the bare rung (3 lines, 30) fits and the effect's line (40) does not: the bare rung, as it was.
    const short = run(36);
    expect(short.density).toBe(MAX_DENSITY);
    expect(short.text).not.toContain('Speeds the party');
    expect(short.text).toContain('Hastega');
    // 40: the rung before it (head row and three lines, 42) does not fit, the bare rung and its tight line (40) do.
    const roomy = run(40);
    expect(roomy.density).toBe(MAX_DENSITY);
    expect(roomy.text).toContain('Speeds the party’s turns up');
    expect(roomy.text).toContain('30 MP');
  });

  it("takes a tight effect line off again when the box turns out narrower and shorter than the one it was kept in (the folded guide's rail, Chapter III at 1024x768)", () => {
    const lead = {
      command: { kind: 'ability', targets: [] } as unknown as MoveSuggestion['command'], targetId: null, targetName: 'the party', label: 'Hastega', menu: 'White Magic',
      effect: 'Speeds the party’s turns up', reason: 'It puts Haste on the party', estimate: null, mpCost: 30, hitChance: null, critChance: 0, statuses: [], cures: [],
      cite: '', warning: '', score: 1, isSwitch: false, source: 'simulated',
    } as unknown as MoveSuggestion;
    const view = { actorId: 'tidus', actorName: 'Tidus', suggestions: [lead], note: '', considered: 3 } as unknown as AdvisorView;
    const heights = (card: HTMLElement): number => card.querySelectorAll('p, article').length * 10 + (card.querySelector('.mad__head') ? 12 : 0);
    const { advisor, stage } = mountAdvisor();
    const card = cardOf(stage);
    let cap = 40;
    let width = 164;
    card.style.maxHeight = `${cap}px`;
    Object.defineProperty(card, 'clientWidth', { configurable: true, get: () => width });
    Object.defineProperty(card, 'clientHeight', { configurable: true, get: () => Math.min(cap, heights(card)) });
    Object.defineProperty(card, 'scrollHeight', { configurable: true, get: () => heights(card) });
    advisor.showDecision('tidus', makeFakeCommands(), makeFakeBattleState());
    const inner = advisor as unknown as { cached: AdvisorView | null; lastSignature: string; render(): void };
    inner.cached = view;
    inner.lastSignature = '';
    inner.render();
    advisor.update(16);
    // The fit `render` runs measures the card at the anchors' width: the bare rung and its tight line fit (40).
    expect(advisor.printedDensity).toBe(MAX_DENSITY);
    expect(card.querySelector('.mad__effect--tight'), 'the tight line fits the box it was fitted in').not.toBeNull();
    expect(heights(card)).toBe(40);

    // The HUD then writes its own box: shorter (36) and narrower. The card is already on the last rung, so the loop has nothing to step to; the line no longer fits and has to go.
    cap = 36;
    width = 126;
    card.style.maxHeight = `${cap}px`;
    advisor.update(16);
    expect(card.querySelector('.mad__effect--tight'), 'the line is taken off, not left cut off at the foot').toBeNull();
    expect(card.textContent).toContain('Hastega');
    expect(card.textContent).not.toContain('Speeds the party');
    expect(heights(card)).toBeLessThanOrEqual(cap + 1);
    expect(advisor.printedDensity).toBe(MAX_DENSITY);

    // And a box that still holds it keeps it: nothing else about the tight line changed.
    const keeper = mountAdvisor();
    const card2 = cardOf(keeper.stage);
    card2.style.maxHeight = '40px';
    Object.defineProperty(card2, 'clientWidth', { configurable: true, get: () => 164 });
    Object.defineProperty(card2, 'clientHeight', { configurable: true, get: () => Math.min(40, heights(card2)) });
    Object.defineProperty(card2, 'scrollHeight', { configurable: true, get: () => heights(card2) });
    keeper.advisor.showDecision('tidus', makeFakeCommands(), makeFakeBattleState());
    const inner2 = keeper.advisor as unknown as { cached: AdvisorView | null; lastSignature: string; render(): void };
    inner2.cached = view;
    inner2.lastSignature = '';
    inner2.render();
    keeper.advisor.update(16);
    keeper.advisor.update(16);
    expect(card2.querySelector('.mad__effect--tight')).not.toBeNull();
  });

  it('leaves the card alone where there is no layout to measure', () => {
    // A card that has not been laid out reports zero for both, and zero means
    // "no reading" rather than "no room".
    const { advisor, stage } = mountAdvisor();
    open(advisor);
    advisor.update(16);
    expect(advisor.printedDensity).toBe(0);
    expect(cardOf(stage).textContent).not.toBe('');
  });
});

// ------------------------------------------ the FFX HUD, exactly as it ships

/**
 * `FFXBattleHud` builds its card with `new MoveAdvisor({ game, anchors })` —
 * no `advisor` option, no registries, no forecast. That is the configuration
 * every FFX chapter runs in, and until this test nothing exercised it: the
 * advisor's safety rules were all proved through `buildAdvisorView` with
 * options a HUD never passes [critic, fix-3 round 1, F3].
 *
 * So this drives the real Chapter 1 engine, hands the board to the HUD's own
 * card, and reads the answer off the DOM the player would be looking at.
 */
describe('the FFX HUD’s own card, on a real Chapter 1 board', () => {
  function chapterOneBoard(p1Step: number): {
    state: BattleState;
    actorId: string;
    commands: AvailableCommand[];
  } {
    const engine = createFFXEngine({ autoResolveMinigames: true });
    engine.init({
      game: 'ffx',
      party: gagazetBuild,
      enemies: seymourFluxGroup,
      triggers: [],
      seed: 1,
      condition: 'normal',
      canEscape: false,
    });
    for (let i = 0; i < 80; i++) {
      const d = engine.nextDecision();
      if (d.kind === 'battle-over') break;
      if (d.kind !== 'player-input') continue;
      if (d.actorId === 'tidus') {
        const state = structuredClone(engine.state()) as BattleState;
        state.combatants['yuna']!.hp = 0;
        state.combatants['yuna']!.alive = false;
        state.flags['seymour.p1Step'] = p1Step;
        state.flags['seymour.lastEnemyActor'] = 'nobody';
        return { state, actorId: d.actorId, commands: d.commands };
      }
      const row = d.commands.find((c) => c.enabled)!;
      engine.submit({ ...row.command, targets: row.validTargets[0] ? [row.validTargets[0]] : [] } as Command);
    }
    throw new Error('Chapter 1 gave no Tidus decision inside 80 steps');
  }

  it('reads the boss’s next move with nothing wired to it', () => {
    // The process-wide registry is what `BattleScreenContent` fills at boot and
    // what the advisor falls back to when a HUD passes no content — so filling
    // it here is the shipped arrangement, not a convenience.
    registerFFXAbilities(ALL_ABILITIES);
    registerFFXItems(Object.values(ITEMS));
    try {
      const { hud, root } = mountHud(new FFXBattleHud());
      const advisor = hud.moveAdvisor;
      expect((advisor as unknown as { opts: { advisor?: unknown } }).opts.advisor).toBeUndefined();

      // Seymour's cycle at the mount's Cross Cleave step: a party-wide hit that
      // kills both living members, so raising Yuna into it is a wasted turn.
      const sweep = chapterOneBoard(5);
      advisor.showDecision(sweep.actorId, sweep.commands, sweep.state);
      const sweptText = cardOf(root).textContent ?? '';
      expect(sweptText).toContain('Cross Cleave');
      expect(sweptText).toContain('Yuna');
      expect(sweptText).not.toMatch(/§|ffx-seymour/);
      expect(advisor.view()!.note).toMatch(/Cross Cleave/);

      // And on a Lance of Atrophy step the raise is still offered, with the
      // telegraph printed beside it rather than instead of it.
      const lance = chapterOneBoard(0);
      advisor.showDecision(lance.actorId, lance.commands, lance.state);
      const view = advisor.view()!;
      expect(view.note).toBe('');
      const revive = view.suggestions.find((s) => /phoenix|life/i.test(s.label));
      expect(revive, view.suggestions.map((s) => s.label).join(', ')).toBeDefined();
      expect(revive!.warning).toMatch(/Lance of Atrophy/);
      expect(cardOf(root).textContent).toContain('Lance of Atrophy');
    } finally {
      resetFFXRegistry();
    }
  }, 60_000);
});
