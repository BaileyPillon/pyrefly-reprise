// @vitest-environment jsdom
/**
 * r64-fixes, the pass after the skeptic's review (`D:/Tools/pyrefly-scratch/2026-10-24/r64-fixes/review/REVIEW.md`). The case of each piece:
 *  - F1, both games (the conference demo's picker): the fight warm's pad quiet is short and has a budget, so a visitor who keeps pressing does not starve it (`demoWarm.padShouldWait`);
 *  - F2, FFX only (Chapter I; the F1 HUD): a second `PartyStatusWindow.render()` inside a party swap gives the new rows the arrival the old ones had, and `?partyswap=off` puts the original's cut back;
 *  - F3, both games (a retried demo fight): the theme is asked for as the retried screen opens, after the lost screen's exit; `?retrytheme=off` leaves it to the chain;
 *  - F4, both games (the playtest label only): the legend carries the pause screen's class too.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PAD_QUIET_BUDGET_MS, PAD_QUIET_MS, padShouldWait } from '../../src/app/demo/demoWarm.ts';
import { PartyStatusWindow } from '../../src/ui/ffx/PartyStatusWindow.ts';
import { PARTY_IN_DELAY_MS, PARTY_IN_STEP_MS, partySwapOn, resumePartySwapIn, swapInFlight, type SwapTiming } from '../../src/ui/ffx/partySwap.ts';
import { retryThemeSwitchedOff } from '../../src/app/demo/demoDefeat.ts';
import { installSwitchboard } from '../../src/app/demo/switchboard.ts';

const member = (id: string, side = 'party'): Record<string, unknown> => ({ id, name: id, side, alive: true, hp: 100, mp: 10, stats: { maxHp: 100, maxMp: 10 }, statuses: {}, portraitKey: id, spriteKey: id });
const combatants = (ids: string[]): never => Object.fromEntries(ids.map((id) => [id, member(id, id === 'ixion' ? 'aeon' : 'party')])) as never;

// ------------------------------------------------------------------------------------------------ F1

describe('padShouldWait: the picker warm\'s quiet after a press (F1)', () => {
  it('is short (150 ms) and has a budget (2 s a run), so browsing cannot hold the warm back for good', () => {
    expect(PAD_QUIET_MS).toBe(150);
    expect(PAD_QUIET_BUDGET_MS).toBe(2000);
  });

  it('waits for a button that is down, however long it has been and whatever the budget', () => {
    expect(padShouldWait(true, 10_000, 99_999)).toBe(true);
  });

  it('waits out the 150 ms after a press while the budget lasts, and not after', () => {
    expect(padShouldWait(false, 40, 0)).toBe(true);
    expect(padShouldWait(false, 149, 1960)).toBe(true);
    expect(padShouldWait(false, 150, 0)).toBe(false); // the quiet is over
    expect(padShouldWait(false, 40, PAD_QUIET_BUDGET_MS)).toBe(false); // the budget is spent: the warm goes on under a browsing hand
    expect(padShouldWait(false, Number.POSITIVE_INFINITY, 0)).toBe(false); // no press yet
  });

  it('a visitor who presses every 300 ms costs the run at most the budget (the first version held every call for 1.2 s)', () => {
    // 60 s of browsing: a press every 300 ms; each idle call waits in 40 ms steps while `padShouldWait` says so.
    let spent = 0;
    let waited = 0;
    for (let press = 0; press < 200; press++) {
      for (let since = 0; since < 300; since += 40) {
        if (!padShouldWait(false, since, spent)) break;
        spent += 40;
        waited += 40;
      }
    }
    expect(waited).toBeLessThanOrEqual(PAD_QUIET_BUDGET_MS + 40);
  });
});

// ------------------------------------------------------------------------------------------------ F2

describe('the party swap survives the game\'s second render (F2)', () => {
  let host: HTMLElement;
  let w: PartyStatusWindow;
  let clock = 0;
  const animated: Array<{ el: Element; opts: KeyframeAnimationOptions }> = [];
  const proto = HTMLElement.prototype as unknown as { animate?: unknown };
  const rowsAnimated = (): KeyframeAnimationOptions[] => animated.filter((a) => (a.el as HTMLElement).classList.contains('ig-stat')).map((a) => a.opts);

  beforeEach(() => {
    host = document.createElement('div');
    host.className = 'hud-f1';
    w = new PartyStatusWindow();
    host.append(w.el);
    document.body.append(host);
    clock = 1000;
    vi.spyOn(performance, 'now').mockImplementation(() => clock);
    animated.length = 0;
    proto.animate = function (this: Element, _frames: unknown, opts: KeyframeAnimationOptions) {
      animated.push({ el: this, opts });
      return {} as Animation;
    };
  });
  afterEach(() => {
    delete proto.animate;
    vi.restoreAllMocks();
    host.remove();
    window.history.replaceState({}, '', '/');
  });

  const party = ['tidus', 'yuna', 'kimahri'];

  it('a summon: the render 129 ms later starts the new card part-way into the arrival (a negative delay), not at full opacity', () => {
    w.render(party, combatants(party), null);
    clock = 2000;
    w.render(['ixion'], combatants(['ixion']), 'ixion'); // the swap
    expect(rowsAnimated().map((o) => o.delay)).toEqual([PARTY_IN_DELAY_MS]);
    animated.length = 0;
    clock = 2129;
    w.render(['ixion'], combatants(['ixion']), 'ixion'); // the second render, which replaces the row that was arriving
    expect(rowsAnimated().map((o) => o.delay)).toEqual([PARTY_IN_DELAY_MS - 129]);
    expect(host.querySelectorAll('.f1-party-ghost').length).toBe(1); // still one ghost, none made twice
  });

  it('a dismissal: the render 3 ms later gives all three cards their cascade, 3 ms in', () => {
    w.render(['ixion'], combatants(['ixion']), 'ixion');
    clock = 2000;
    w.render(party, combatants(party), null); // the swap back
    animated.length = 0;
    clock = 2003;
    w.render(party, combatants(party), null);
    expect(rowsAnimated().map((o) => o.delay)).toEqual([0, 1, 2].map((i) => PARTY_IN_DELAY_MS + i * PARTY_IN_STEP_MS - 3));
  });

  it('after the swap\'s window a render starts nothing (the usual render of numbers is untouched)', () => {
    w.render(party, combatants(party), null);
    clock = 2000;
    w.render(['ixion'], combatants(['ixion']), 'ixion');
    animated.length = 0;
    clock = 2000 + 900;
    w.render(['ixion'], combatants(['ixion']), 'ixion');
    expect(rowsAnimated()).toEqual([]);
    clock = 2000 + 950;
    w.render(['ixion'], combatants(['ixion']), 'ixion');
    expect(rowsAnimated()).toEqual([]);
  });

  it('?partyswap=off: no ghost, no animation; the original\'s one-frame swap', () => {
    window.history.replaceState({}, '', '/?partyswap=off');
    expect(partySwapOn()).toBe(false);
    w.render(party, combatants(party), null);
    w.render(['ixion'], combatants(['ixion']), 'ixion');
    expect(host.querySelectorAll('.f1-party-ghost')).toHaveLength(0);
    expect(animated).toHaveLength(0);
    expect(w.el.querySelectorAll('.ig-stat')).toHaveLength(1);
  });

  it('partySwapOn is on by default and for any other value', () => {
    expect(partySwapOn('')).toBe(true);
    expect(partySwapOn('?partyswap=on')).toBe(true);
    expect(partySwapOn('?partyswap=off')).toBe(false);
  });

  it('swapInFlight covers the last of four cards (90 + 3 x 40 + 220 ms) and no longer', () => {
    const t: SwapTiming = { outMs: 170, inMs: 220, slidePx: 104, reduce: false };
    expect(swapInFlight(t, 0)).toBe(true);
    expect(swapInFlight(t, 429)).toBe(true);
    expect(swapInFlight(t, 430)).toBe(false);
  });

  it('resumePartySwapIn leaves a card whose arrival is over alone, and starts nothing where there is no animate', () => {
    const t: SwapTiming = { outMs: 170, inMs: 220, slidePx: 104, reduce: false };
    const list = document.createElement('div');
    list.innerHTML = '<div class="ig-stat"></div><div class="ig-stat"></div>';
    expect(resumePartySwapIn(list, t, 340)).toBe(1); // card 0 (90 + 220 = 310) is over, card 1 (130 + 220 = 350) has 10 ms left
    expect(resumePartySwapIn(list, t, 400)).toBe(0); // both are over
    delete proto.animate;
    expect(resumePartySwapIn(list, t, 10)).toBe(0);
  });
});

// ------------------------------------------------------------------------------------------------ F3

describe('?retrytheme=off (F3)', () => {
  it('reads the word', () => {
    expect(retryThemeSwitchedOff('')).toBe(false);
    expect(retryThemeSwitchedOff('?retrytheme=off')).toBe(true);
    expect(retryThemeSwitchedOff('?pack=demo&retrytheme=on')).toBe(false);
  });
});

// ------------------------------------------------------------------------------------------------ F4

describe('the playtest label over the pause screen (F4)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    window.history.replaceState({}, '', '/?demo=1&pack=demo&switchboard=1');
  });
  afterEach(() => {
    vi.useRealTimers();
    document.querySelector('.pause__stage')?.remove();
    window.history.replaceState({}, '', '/');
  });

  it('the legend opened on the pause screen is at the bottom edge, and once the pause is gone the next tick takes the class off', () => {
    const stage = document.createElement('div');
    stage.className = 'pause__stage';
    document.body.append(stage);
    const board = installSwitchboard()!;
    const el = document.querySelector('[data-switchboard]') as HTMLElement;
    expect(el.classList.contains('sb-pause')).toBe(true); // the label
    board.press('Equal');
    expect(el.classList.contains('sb-legend')).toBe(true);
    expect(el.classList.contains('sb-pause')).toBe(true); // the legend too (it used to keep whatever the label last had)
    stage.remove(); // resume
    vi.advanceTimersByTime(800); // the board re-renders every 700 ms
    expect(el.classList.contains('sb-legend')).toBe(true);
    expect(el.classList.contains('sb-pause')).toBe(false); // it no longer sits at the bottom over the command menu
    board.dispose();
  });
});
