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
 * jsdom performs no layout, so the two numbers the fit is measured from are
 * supplied: `clientHeight` is the cap, and `scrollHeight` is made to depend on
 * what was actually rendered, so the loop being tested is the real one.
 */
function measured(card: HTMLElement, cap: number, perLine = 14): void {
  Object.defineProperty(card, 'clientHeight', {
    configurable: true,
    get: () => Math.min(cap, card.querySelectorAll('p, article').length * perLine),
  });
  Object.defineProperty(card, 'scrollHeight', {
    configurable: true,
    get: () => card.querySelectorAll('p, article').length * perLine,
  });
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
    // Every step is shorter than the one before it.
    for (let d = 1 as Density; d <= MAX_DENSITY; d = (d + 1) as Density) {
      expect(text(d).length, `density ${d}`).toBeLessThan(text((d - 1) as Density).length);
    }
    // The effect lines are the first thing to go, runner-up first.
    expect(text(0)).toContain('Revives all fallen allies');
    expect(text(1)).not.toContain('Revives all fallen allies');
    expect(text(1)).toContain('Puts Haste on the whole party');
    expect(text(2)).not.toContain('Puts Haste on the whole party');

    // And at *every* density the card still answers the question: both moves,
    // where they live, why the revive is being offered, and both warnings.
    for (let d = 0 as Density; d <= MAX_DENSITY; d = (d + 1) as Density) {
      const t = text(d);
      expect(t, `density ${d}`).toContain('Mega Phoenix');
      expect(t, `density ${d}`).toContain('Hastega');
      expect(t, `density ${d}`).toContain('in Items');
      expect(t, `density ${d}`).toContain('stand Yuna up');
      expect(t, `density ${d}`).toContain('Lance of Atrophy');
      expect(t, `density ${d}`).toContain('Cross Cleave hits the whole party');
    }
  });

  it('compacts until it fits the cap it was given, on a real update tick', () => {
    const { advisor, stage } = mountAdvisor();
    const card = cardOf(stage);
    // 104 is `move-advisor.css`'s real cap; ten units a line is what makes the
    // full card overflow it here by about the ratio it overflowed by on the
    // preview (162 wanted against 104 given).
    measured(card, 104, 10);
    advisor.showDecision('tidus', makeFakeCommands(), makeFakeBattleState());
    (advisor as unknown as { cached: AdvisorView | null }).cached = crowdedView();
    (advisor as unknown as { lastSignature: string }).lastSignature = '';
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
    Object.defineProperty(card, 'clientHeight', {
      configurable: true,
      get: () => Math.min(cap, card.querySelectorAll('p, article').length * 14),
    });
    Object.defineProperty(card, 'scrollHeight', {
      configurable: true,
      get: () => card.querySelectorAll('p, article').length * 14,
    });
    advisor.showDecision('tidus', makeFakeCommands(), makeFakeBattleState());
    (advisor as unknown as { cached: AdvisorView | null }).cached = crowdedView();
    (advisor as unknown as { lastSignature: string }).lastSignature = '';
    advisor.update(16);
    const tight = advisor.printedDensity;
    expect(tight).toBeGreaterThan(0);

    cap = 400;
    advisor.update(16);
    expect(advisor.printedDensity).toBeLessThan(tight);
    expect(card.textContent).toContain('Revives all fallen allies');
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
