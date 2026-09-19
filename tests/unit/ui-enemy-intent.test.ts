// @vitest-environment jsdom
/**
 * The enemy-intent slab's **panel half** (`src/ui/common/EnemyIntent.ts`) and
 * the two battle HUDs that mount it.
 *
 * The prediction itself — that the move named is the move the shipped rotation
 * chooses, and that asking does not advance the fight — is proved against real
 * engines in `tests/unit/enemy-intent.test.ts`. What is left for a DOM test is
 * the half the player touches:
 *
 *  * **Optional means optional.** `E`, the pad's spare face button and the chip
 *    itself all hide the slab; the answer survives into `Settings.intentVisible`
 *    and applies to every later battle; and what remains on screen when it is
 *    off is a chip two words wide, still over the boss.
 *  * **`E` does not also open the pause.** `Input.ts` maps that key to `start`,
 *    which the battle screen treats as the pause. {@link consumeIntentKeyPress}
 *    is the seam, and it has to answer exactly once per press.
 *  * **It never sits on the CTB list.** The slab is pinned to a projected actor
 *    and the queue is the one panel it must not cover — so the dodge is driven
 *    directly here rather than eyeballed on a screenshot.
 *  * **Both games** mount it, and FFX-2 picks up its own root class.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { SaveStore, defaultSettings } from '../../src/app/SaveData.ts';
import {
  EnemyIntentPanel,
  type IntentRect,
  type IntentView,
  attachEnemyIntent,
  consumeIntentKeyPress,
} from '../../src/ui/common/EnemyIntent.ts';
import { INTENT_HINT_ITEM } from '../../src/ui/common/ControlsHint.ts';
import { FFXBattleHud } from '../../src/ui/ffx/FFXBattleHud.ts';
import { FFX2BattleHud } from '../../src/ui/ffx2/FFX2BattleHud.ts';

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

/** A complete view, so a test can vary one field without rebuilding the shape. */
function view(overrides: Partial<IntentView> = {}): IntentView {
  return {
    enemyId: 'mortiorchis',
    enemyName: 'Mortiorchis',
    turnsAway: 0,
    actsNext: true,
    kind: 'action',
    moveName: 'Total Annihilation',
    abilityId: 'total-annihilation',
    description: 'Magical non-elemental damage to the whole party - 5 hits - never misses.',
    elements: ['none'],
    statusText: [],
    estimate: {
      name: 'Total Annihilation',
      hits: 5,
      totalHarmToParty: 7200,
      heals: false,
      perTarget: [
        { targetId: 'tidus', targetName: 'Tidus', amount: 2400, min: 2250, max: 2540, hpFraction: 0.99, lethal: false, hitChancePercent: null },
        { targetId: 'yuna', targetName: 'Yuna', amount: 2400, min: 2250, max: 2540, hpFraction: 1.4, lethal: true, hitChancePercent: null },
        { targetId: 'auron', targetName: 'Auron', amount: 2400, min: 2250, max: 2540, hpFraction: 0.6, lethal: false, hitChancePercent: null },
      ],
    },
    confidence: 'scripted',
    branches: [],
    charge: null,
    counters: ['A Delay attempt is punished with party-wide Slowga [ffx-seymour-flux §4.6]'],
    formNote: null,
    notes: [],
    cite: 'ffx-seymour-flux §4',
    ...overrides,
  };
}

/**
 * Everything mounted by a test, torn down after it.
 *
 * Not housekeeping. The `E` key is a **window** listener, so a panel left
 * mounted by an earlier test still answers a later one's keypress and writes its
 * own answer into the shared save.
 */
const live: Array<{ unmount(): void }> = [];

/**
 * jsdom has no layout engine, so `getBoundingClientRect` is all zeroes — and
 * `layout()` treats a zero-sized layer as "not laid out yet" and declines to
 * move anything, which is correct behaviour and untestable behaviour at the
 * same time. Stubbing the three boxes the layout reads is what makes the dodge
 * arithmetic drivable.
 */
function stubRect(el: Element, rect: Partial<DOMRect>): void {
  const full = { x: 0, y: 0, left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0, ...rect };
  el.getBoundingClientRect = () => ({ ...full, toJSON: () => full }) as DOMRect;
}

interface Harness {
  panel: EnemyIntentPanel;
  overlay: HTMLElement;
  avoid: IntentRect[];
}

function mountPanel(overrides: Partial<ConstructorParameters<typeof EnemyIntentPanel>[0]> = {}, at = { x: 800, y: 400 }): Harness {
  const overlay = document.createElement('div');
  document.body.appendChild(overlay);
  stubRect(overlay, { left: 0, top: 0, right: 1600, bottom: 900, width: 1600, height: 900 });
  const avoid: IntentRect[] = [];
  const panel = new EnemyIntentPanel({ game: 'ffx', ...overrides });
  // The layer whose box turns the projector's viewport pixels into layer-local
  // ones is the panel's own root, not the overlay it is appended to.
  stubRect(panel.el, { left: 0, top: 0, right: 1600, bottom: 900, width: 1600, height: 900 });
  panel.mount(overlay, {
    host: overlay,
    scale: () => 2.5,
    project: () => at,
    avoid: () => avoid,
  });
  live.push(panel);
  return { panel, overlay, avoid };
}

function mountHud<T extends { mount(root: HTMLElement): void; unmount(): void }>(hud: T): { hud: T; root: HTMLElement } {
  const root = document.createElement('div');
  document.body.appendChild(root);
  hud.mount(root);
  live.push(hud);
  return { hud, root };
}

function pressE(): void {
  window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyE' }));
}

function panelEl(root: HTMLElement): HTMLElement {
  return root.querySelector<HTMLElement>('[data-role="enemy-intent-panel"]')!;
}

function toggleEl(root: HTMLElement): HTMLButtonElement {
  return root.querySelector<HTMLButtonElement>('[data-role="enemy-intent-toggle"]')!;
}

let padButtons: Array<{ pressed: boolean }> = [];
let padPluggedIn = false;
let store: SaveStore;

beforeEach(() => {
  padButtons = [{ pressed: false }, { pressed: false }, { pressed: false }, { pressed: false }];
  padPluggedIn = false;
  Object.defineProperty(navigator, 'getGamepads', {
    configurable: true,
    writable: true,
    value: () => (padPluggedIn ? [{ connected: true, buttons: padButtons, axes: [0, 0] }] : []),
  });
  store = new SaveStore('pyrefly-test-intent', memoryStorage());
  consumeIntentKeyPress(); // drain anything a previous file left behind
});

afterEach(() => {
  while (live.length) live.pop()!.unmount();
  document.body.innerHTML = '';
});

// ------------------------------------------------------------- the default

describe('the slab is up the first time a boss takes a turn', () => {
  it('ships defaulting to visible', () => {
    expect(defaultSettings().intentVisible).toBe(true);
    expect(store.settings.intentVisible).toBe(true);
  });

  it('draws nothing at all until it has a source with something to say', () => {
    const { panel, overlay } = mountPanel();
    expect(overlay.querySelector('.eint')).not.toBeNull();
    expect(overlay.querySelector<HTMLElement>('.eint')!.hidden).toBe(true);

    panel.setSource(() => view());
    expect(overlay.querySelector<HTMLElement>('.eint')!.hidden).toBe(false);
  });

  it('prints the move, what it does, and a damage row per character', () => {
    const { panel, overlay } = mountPanel();
    panel.setSource(() => view());
    const text = panelEl(overlay).textContent ?? '';
    expect(text).toContain('Mortiorchis');
    expect(text).toContain('Total Annihilation');
    expect(text).toContain('5 hits');
    expect(text).toContain('Tidus');
    expect(text).toContain('Yuna');
    // The band, not a bare figure: the variance roll is a 32-step ladder and
    // the panel prints its ends rather than implying a single certain number.
    expect(text).toContain('2,250–2,540');
  });

  /**
   * Round 02 #26, which carried the Part B 8.0 cap ("a panel gives the player
   * wrong information"): the live Chapter 1 slab printed `[ffx-seymour-flux
   * §4.6]` inside a sentence, `[ffx-seymour-flux §4.3]` twice, and
   * `ffx-seymour-flux §4` as a footer.
   *
   * This file used to assert the footer was **present**, on the reasoning that
   * the panel should keep the same audit trail the strategy guide keeps. CHK-007
   * says otherwise and is right: the guide is where a player goes to ask *why*,
   * and this slab is read in the two seconds before a hit lands. The citations
   * are still in `IntentView` — nothing about the data contract moved — they
   * simply do not reach the screen.
   */
  it('prints no research citation anywhere, in the text or in the footer', () => {
    const { panel, overlay } = mountPanel();
    panel.setSource(() => view());
    const text = panelEl(overlay).textContent ?? '';
    expect(text).not.toContain('§');
    expect(text).not.toContain('ffx-seymour-flux');
    expect(text).not.toContain('[');
  });

  it('strips a citation out of the middle of a sentence and leaves the sentence', () => {
    const { panel, overlay } = mountPanel();
    panel.setSource(() => ({
      ...view(),
      description: 'Hits the whole party [ffx-seymour-flux §4.6] for heavy damage',
      counters: ['A Delay attempt is punished with Slowga [ffx-seymour-flux §4.3]'],
    }));
    const text = panelEl(overlay).textContent ?? '';
    expect(text).toContain('Hits the whole party for heavy damage');
    expect(text).toContain('A Delay attempt is punished with Slowga');
    expect(text).not.toContain('§');
  });

  it('marks a lethal row, and only the lethal one', () => {
    const { panel, overlay } = mountPanel();
    panel.setSource(() => view());
    const rows = [...panelEl(overlay).querySelectorAll('.eint__dmg')];
    expect(rows).toHaveLength(3);
    const lethal = rows.filter((r) => r.classList.contains('eint__dmg--lethal'));
    expect(lethal).toHaveLength(1);
    expect(lethal[0]!.textContent).toContain('Yuna');
    expect(lethal[0]!.textContent).toContain('KO');
  });

  it('prints healing as a restore rather than as damage', () => {
    const { panel, overlay } = mountPanel();
    panel.setSource(() =>
      view({
        moveName: 'Absorb',
        estimate: {
          name: 'Absorb',
          hits: 1,
          totalHarmToParty: 0,
          heals: true,
          perTarget: [
            { targetId: 'yunalesca', targetName: 'Yunalesca', amount: -12000, min: -12000, max: -12000, hpFraction: 0, lethal: false, hitChancePercent: null },
          ],
        },
      }),
    );
    const row = panelEl(overlay).querySelector('.eint__dmg')!;
    expect(row.classList.contains('eint__dmg--heal')).toBe(true);
    expect(row.textContent).toContain('heals');
    expect(row.textContent).toContain('+12,000');
  });
});

// ------------------------------------------------------- scripted vs likely

describe('a scripted rotation and a coin flip never look alike', () => {
  it('states a deterministic move flatly', () => {
    const { panel, overlay } = mountPanel();
    panel.setSource(() => view());
    expect(panelEl(overlay).querySelector('.eint__conf--scripted')).not.toBeNull();
    expect(panelEl(overlay).querySelector('.eint__conf--likely')).toBeNull();
    expect(panelEl(overlay).textContent).toContain('Scripted');
  });

  it('prints the measured odds for a weighted branch', () => {
    const { panel, overlay } = mountPanel();
    panel.setSource(() =>
      view({
        moveName: 'Hellbiter',
        confidence: 'likely',
        branches: [
          { label: 'Hellbiter', percent: 70 },
          { label: 'Curaga', percent: 30 },
        ],
      }),
    );
    const text = panelEl(overlay).textContent ?? '';
    expect(text).toContain('Likely 70%');
    expect(text).toContain('Curaga');
    expect(text).toContain('30%');
    expect(panelEl(overlay).querySelector('.eint__conf--scripted')).toBeNull();
  });
});

// -------------------------------------------------------------- countdowns

describe('charge countdowns', () => {
  it('names the move the countdown lands on, and how many turns are left', () => {
    const { panel, overlay } = mountPanel();
    panel.setSource(() =>
      view({
        kind: 'charge',
        moveName: 'Total Annihilation',
        estimate: null,
        charge: {
          name: 'Ready To Annihilate',
          turnsLeft: 2,
          stage: 2,
          payloadName: 'Total Annihilation',
          cite: 'ffx-seymour-flux §4.4.2',
        },
      }),
    );
    const charge = panelEl(overlay).querySelector('.eint__charge')!;
    expect(charge.textContent).toContain('Total Annihilation');
    expect(charge.textContent).toContain('in 2 turns');
    expect(charge.classList.contains('eint__charge--s2')).toBe(true);
  });

  it('says "this turn" rather than "in 0 turns"', () => {
    const { panel, overlay } = mountPanel();
    panel.setSource(() =>
      view({ charge: { name: 'Ready To Annihilate', turnsLeft: 0, stage: 2, payloadName: 'Total Annihilation', cite: 'x' } }),
    );
    expect(panelEl(overlay).querySelector('.eint__charge')!.textContent).toContain('this turn');
  });
});

// ------------------------------------------------------------------ hiding

describe('optional means optional', () => {
  it('E hides the panel and leaves the chip', () => {
    const { panel, overlay } = mountPanel();
    panel.setSource(() => view());
    expect(panel.isVisible).toBe(true);

    pressE();
    expect(panel.isVisible).toBe(false);
    expect(panelEl(overlay).hidden).toBe(true);
    expect(toggleEl(overlay).hidden).toBe(false);
    expect(overlay.querySelector('.eint')!.classList.contains('eint--off')).toBe(true);

    pressE();
    expect(panel.isVisible).toBe(true);
    expect(panelEl(overlay).hidden).toBe(false);
  });

  it('the chip itself toggles, for a mouse or a touch player', () => {
    const { panel, overlay } = mountPanel();
    panel.setSource(() => view());
    toggleEl(overlay).dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    expect(panel.isVisible).toBe(false);
  });

  it('the pad toggles it on its own spare face button, edge-only', () => {
    const { panel } = mountPanel();
    panel.setSource(() => view());
    padPluggedIn = true;

    padButtons[3]!.pressed = true;
    panel.update(0.016);
    expect(panel.isVisible).toBe(false);
    // Held, not tapped: nothing further happens.
    panel.update(0.016);
    panel.update(0.016);
    expect(panel.isVisible).toBe(false);

    padButtons[3]!.pressed = false;
    panel.update(0.016);
    padButtons[3]!.pressed = true;
    panel.update(0.016);
    expect(panel.isVisible).toBe(true);
  });

  it('ignores a chord or an auto-repeat, so typing elsewhere cannot flip it', () => {
    const { panel } = mountPanel();
    panel.setSource(() => view());
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyE', ctrlKey: true }));
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyE', metaKey: true }));
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyE', repeat: true }));
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyQ' }));
    expect(panel.isVisible).toBe(true);
  });

  it('remembers the answer for every later battle', () => {
    const first = mountPanel();
    first.panel.setSource(() => view());
    pressE();
    expect(store.settings.intentVisible).toBe(false);

    // A second battle builds a second panel against the same save.
    first.panel.unmount();
    live.pop();
    const second = mountPanel();
    expect(second.panel.isVisible).toBe(false);
  });

  it('stops listening the moment the HUD that owns it goes away', () => {
    const { panel } = mountPanel();
    panel.setSource(() => view());
    panel.unmount();
    live.pop();
    pressE();
    expect(panel.isVisible).toBe(true);
    expect(store.settings.intentVisible).toBe(true);
  });

  it('words the chip for whichever device is plugged in', () => {
    const { overlay } = mountPanel();
    expect(toggleEl(overlay).textContent).toContain(INTENT_HINT_ITEM.keyboard);

    padPluggedIn = true;
    const withPad = mountPanel();
    expect(toggleEl(withPad.overlay).textContent).toContain(INTENT_HINT_ITEM.gamepad);
  });
});

// ------------------------------------------------------------ the E / pause seam

describe('E hides the slab without also opening the pause', () => {
  it('reports the press exactly once, so one tap is consumed by one frame', () => {
    const { panel } = mountPanel();
    panel.setSource(() => view());
    pressE();
    expect(consumeIntentKeyPress()).toBe(true);
    expect(consumeIntentKeyPress()).toBe(false);
  });

  it('reports nothing when no panel is mounted, so E still reaches the pause', () => {
    expect(consumeIntentKeyPress()).toBe(false);
    pressE();
    expect(consumeIntentKeyPress()).toBe(false);
  });

  it('still reports a press made while the slab is hidden — E is how it comes back', () => {
    const { panel } = mountPanel();
    panel.setVisible(false);
    consumeIntentKeyPress();
    pressE();
    expect(panel.isVisible).toBe(true);
    expect(consumeIntentKeyPress()).toBe(true);
  });
});

// ------------------------------------------------------------------ layout

describe('the slab is pinned to the boss and never covers the queue', () => {
  it('hangs above the projected head, centred on it', () => {
    const { panel, overlay } = mountPanel({}, { x: 800, y: 400 });
    panel.setSource(() => view());
    const el = panelEl(overlay);
    stubRect(el, { left: 0, top: 0, right: 375, bottom: 250, width: 375, height: 250 });
    panel.update(0.016);

    const left = Number.parseFloat(el.style.left);
    const top = Number.parseFloat(el.style.top);
    expect(left).toBeCloseTo(800 - 375 / 2, 0);
    // 10 grid px of clearance at a 2.5x letterbox is 25 real px.
    expect(top).toBeCloseTo(400 - 25 - 250, 0);
  });

  it('slides sideways out of a rectangle it would cover', () => {
    const { panel, overlay, avoid } = mountPanel({}, { x: 1300, y: 400 });
    panel.setSource(() => view());
    const el = panelEl(overlay);
    stubRect(el, { left: 0, top: 0, right: 375, bottom: 250, width: 375, height: 250 });

    // The FFX CTB list: a tall column down the right edge.
    avoid.push({ left: 1200, top: 0, right: 1580, bottom: 600 });
    panel.update(0.016);

    const left = Number.parseFloat(el.style.left);
    expect(left + 375).toBeLessThanOrEqual(1200);
  });

  it('clears the sensor card a Chapter 1 capture caught it printed across', () => {
    // The exact geometry from `docs/screenshots/adv/intent-ch1-countdown.png`:
    // a 1600x900 stage, the Mortiorchis's scan card at 479..770 x 60..255, and
    // a 375x417 slab whose natural place is 613..988. Regression-shaped on
    // purpose — this is the one overlap a real capture actually produced.
    const { panel, overlay, avoid } = mountPanel({}, { x: 800, y: 270 });
    panel.setSource(() => view());
    const el = panelEl(overlay);
    stubRect(el, { left: 0, top: 0, right: 375, bottom: 417, width: 375, height: 417 });
    avoid.push({ left: 479, top: 60, right: 770, bottom: 255 });
    panel.update(0.016);

    const left = Number.parseFloat(el.style.left);
    expect(left).toBeGreaterThanOrEqual(770);
  });

  it('drops below a rectangle it cannot clear on either side', () => {
    const { panel, overlay, avoid } = mountPanel({}, { x: 800, y: 400 });
    panel.setSource(() => view());
    const el = panelEl(overlay);
    stubRect(el, { left: 0, top: 0, right: 375, bottom: 250, width: 375, height: 250 });

    // A band across the whole width: no sideways room at all.
    avoid.push({ left: 0, top: 0, right: 1600, bottom: 300 });
    panel.update(0.016);

    expect(Number.parseFloat(el.style.top)).toBeGreaterThanOrEqual(300);
  });

  it('keeps a boss standing at the edge of frame fully on screen', () => {
    const { panel, overlay } = mountPanel({}, { x: 20, y: 60 });
    panel.setSource(() => view());
    const el = panelEl(overlay);
    stubRect(el, { left: 0, top: 0, right: 375, bottom: 250, width: 375, height: 250 });
    panel.update(0.016);

    expect(Number.parseFloat(el.style.left)).toBeGreaterThanOrEqual(0);
    expect(Number.parseFloat(el.style.top)).toBeGreaterThanOrEqual(0);
  });

  it('positions the chip on its own when the panel is hidden', () => {
    const { panel, overlay } = mountPanel({}, { x: 800, y: 400 });
    panel.setSource(() => view());
    panel.setVisible(false);
    const chip = toggleEl(overlay);
    stubRect(chip, { left: 0, top: 0, right: 90, bottom: 20, width: 90, height: 20 });
    panel.update(0.016);
    expect(Number.parseFloat(chip.style.left)).toBeCloseTo(800 - 45, 0);
  });

  it('scales with the HUD letterbox rather than drawing at grid size', () => {
    const { panel, overlay } = mountPanel();
    panel.setSource(() => view());
    panel.update(0.016);
    expect(panelEl(overlay).style.getPropertyValue('--eint-scale')).toBe('2.5000');
  });
});

// -------------------------------------------------------------------- wiring

describe('attachEnemyIntent', () => {
  it('hands a HUD its engine and asks it for a view', () => {
    let asked = 0;
    const hud = {
      source: null as null | (() => IntentView | null),
      setIntentSource(source: (() => IntentView | null) | null) {
        this.source = source;
      },
    };
    attachEnemyIntent(hud, {
      intent: () => {
        asked += 1;
        return view();
      },
    });
    expect(hud.source).toBeTypeOf('function');
    expect(hud.source!()?.moveName).toBe('Total Annihilation');
    expect(asked).toBe(1);
  });

  it('a prediction that throws goes quiet instead of taking the frame down', () => {
    const hud = { source: null as null | (() => IntentView | null), setIntentSource(s: (() => IntentView | null) | null) { this.source = s; } };
    attachEnemyIntent(hud, {
      intent: () => {
        throw new Error('half-written rotation');
      },
    });
    expect(hud.source!()).toBeNull();
  });

  it('is a no-op against a HUD or engine that does not have the method', () => {
    expect(() => attachEnemyIntent({}, {})).not.toThrow();
    expect(() => attachEnemyIntent(null, null)).not.toThrow();
    const hud = { source: undefined as unknown, setIntentSource(s: unknown) { this.source = s; } };
    attachEnemyIntent(hud, {});
    expect(hud.source).toBeNull();
  });
});

// ---------------------------------------------------------------- both HUDs

describe('both battle HUDs mount it', () => {
  it('FFX mounts it on its overlay, beside the numerals — folded, with its chip up', () => {
    const { hud, root } = mountHud(new FFXBattleHud());
    const el = root.querySelector<HTMLElement>('[data-role="enemy-intent"]');
    expect(el).not.toBeNull();
    expect(el!.closest('.ffxhud__overlay')).not.toBeNull();
    expect(el!.classList.contains('eint--ffx2')).toBe(false);
    hud.setIntentSource(() => view());
    expect(el!.hidden).toBe(false);

    // **FFX ships the read-out folded to its chip, and `E` opens it.** The
    // round-02 gate measured the open slab at 150 x 119 grid px hanging at
    // x 165..315 in Chapter 1 — the one band on a 640x360 stage wide enough
    // for the advisor card, which is why that card had nowhere to stand and
    // ended up on the party. See `FFXBattleHud`'s `readVisible` for why the
    // shared `Settings.intentVisible` default is untouched: it is FFX-2's too,
    // and Bailey's rule of 2026-09-19 is that a change true of one game is not
    // applied to the other.
    expect(hud.enemyIntent.isVisible).toBe(false);
    expect(root.querySelector('[data-role="enemy-intent-toggle"]')!.textContent?.toLowerCase()).toContain(
      'enemy move',
    );
    expect(panelEl(root).textContent).not.toContain('Total Annihilation');

    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyE' }));
    expect(hud.enemyIntent.isVisible).toBe(true);
    expect(panelEl(root).textContent).toContain('Total Annihilation');
  });

  it('FFX-2 mounts it with its own root class, so it inherits the pink accent', () => {
    const { hud, root } = mountHud(new FFX2BattleHud());
    const el = root.querySelector<HTMLElement>('[data-role="enemy-intent"]');
    expect(el).not.toBeNull();
    expect(el!.closest('.ffx2hud__overlay')).not.toBeNull();
    expect(el!.classList.contains('eint--ffx2')).toBe(true);
    hud.setIntentSource(() => view({ enemyName: 'Bahamut', moveName: 'Mega Flare' }));
    expect(panelEl(root).textContent).toContain('Mega Flare');
  });

  it('a HUD with no engine attached simply shows nothing', () => {
    const { hud, root } = mountHud(new FFXBattleHud());
    attachEnemyIntent(hud, {});
    expect(root.querySelector<HTMLElement>('[data-role="enemy-intent"]')!.hidden).toBe(true);
  });
});
