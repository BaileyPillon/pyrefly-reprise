// @vitest-environment jsdom
/**
 * **Yuna's Grand Summon picker answers a finger, a click and a refusal** (LV55-2 and PR-0467, round 26 and the live check of
 * release 55; **FFX only**: Grand Summon is an FFX Overdrive). Release 55's picker read keys and pad buttons only, so on a phone a
 * tap on an aeon did nothing and the frame had no way back; and a confirm on a greyed aeon was silent.
 *
 * Now a tap or click on a row moves the cursor there and confirms it (as a tap on a command-menu row does); a tap on the title is
 * Back (as a tap on a Doublecast list's title is); a confirm on a greyed aeon shakes the list as a refused command-menu row does, and
 * plays the menu set's `error` cue only while parity item f (`cursor`) is on, which it is not as shipped (Bailey: match the greyed
 * rows as they are today). Driven through the real overlay with real DOM events.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { setMenuDrawParity } from '../../src/battle/ffx/menu-draw-parity.ts';
import { openYunaGrandSummon as openPicker } from '../../src/ui/ffx/minigames/YunaGrandSummon.ts';
import { MinigameCancelled } from '../../src/ui/ffx/minigames/params.ts';

const playRefusal = vi.hoisted(() => vi.fn());
vi.mock('../../src/ui/ffx/refusalCue.ts', () => ({ playRefusal }));

const aeons = [
  { id: 'valefor', name: 'Valefor', storedGauge: 0, enabled: false },
  { id: 'ifrit', name: 'Ifrit', storedGauge: 0 },
  { id: 'ixion', name: 'Ixion', storedGauge: 100 },
];

/** Opens the picker; a back-out that no test awaits is not an unhandled rejection. */
const openYunaGrandSummon = (root: HTMLElement, params: Record<string, unknown>): ReturnType<typeof openPicker> => {
  const p = openPicker(root, params);
  p.catch(() => undefined);
  return p;
};
const rowEls = (): HTMLElement[] => [...document.querySelectorAll<HTMLElement>('.ffx-mg-list__row')];
const listEl = (): HTMLElement => document.querySelector<HTMLElement>('.ffx-mg-list')!;
const titleEl = (): HTMLElement => document.querySelector<HTMLElement>('[data-role="title"]')!;
const click = (el: Element): void => {
  el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
};
const state = async (p: Promise<unknown>): Promise<string> =>
  Promise.race([p.then(() => 'settled', () => 'settled'), new Promise<string>((r) => setTimeout(() => r('open'), 40))]);

let restore: (() => void) | undefined;
beforeEach(() => {
  playRefusal.mockClear();
  restore = setMenuDrawParity(true, ['cursor', 'help']); // as shipped by release 55
});
afterEach(async () => {
  window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Escape', bubbles: true, cancelable: true })); // a picker a test left open lets go of the keys
  await new Promise((r) => setTimeout(r, 200));
  restore?.();
  document.body.innerHTML = '';
});

describe('a tap or a click on a row of the Grand Summon picker', () => {
  it('on a live row moves the cursor there and calls that aeon', async () => {
    const picked = openYunaGrandSummon(document.body, { aeons });
    expect(rowEls().map((r) => r.dataset['pick'])).toEqual(['0', '1', '2']);
    click(rowEls()[2]!);
    await expect(picked).resolves.toEqual({ kind: 'yuna-grand-summon', grandSummon: { aeonId: 'ixion' } });
  });

  it('on a click inside the row (its gauge bar) counts as the row', async () => {
    const picked = openYunaGrandSummon(document.body, { aeons });
    click(rowEls()[1]!.querySelector('.ffx-mg-list__gauge i')!);
    await expect(picked).resolves.toEqual({ kind: 'yuna-grand-summon', grandSummon: { aeonId: 'ifrit' } });
  });

  it('on a greyed row picks nothing, rests the cursor there, shakes the list, and the picker stays open', async () => {
    const picked = openYunaGrandSummon(document.body, { aeons });
    expect(listEl().classList.contains('ffx-mg-list--shake')).toBe(false);
    click(rowEls()[0]!);
    expect(await state(picked)).toBe('open');
    expect(rowEls()[0]!.classList.contains('ffx-mg-list__row--selected')).toBe(true);
    expect(listEl().classList.contains('ffx-mg-list--shake')).toBe(true);
    // a live tap afterwards still works
    click(rowEls()[1]!);
    await expect(picked).resolves.toEqual({ kind: 'yuna-grand-summon', grandSummon: { aeonId: 'ifrit' } });
  });

  it('a second refusal restarts the shake', async () => {
    openYunaGrandSummon(document.body, { aeons });
    click(rowEls()[0]!);
    const first = listEl();
    first.classList.remove('ffx-mg-list--shake'); // the animation ended
    click(rowEls()[0]!);
    expect(listEl().classList.contains('ffx-mg-list--shake')).toBe(true);
  });
});

describe('the refusal cue of a greyed aeon', () => {
  it('is silent as shipped (parity item f off) on a tap and on Enter, and the shake alone stands', async () => {
    const picked = openYunaGrandSummon(document.body, { aeons });
    click(rowEls()[0]!);
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Enter', bubbles: true, cancelable: true }));
    expect(playRefusal).not.toHaveBeenCalled();
    expect(listEl().classList.contains('ffx-mg-list--shake')).toBe(true);
    expect(await state(picked)).toBe('open');
  });

  it('plays once per refused confirm while parity item f is on, on a tap and on Enter alike', () => {
    restore?.();
    restore = setMenuDrawParity(true, ['help']); // item f on
    openYunaGrandSummon(document.body, { aeons });
    click(rowEls()[0]!); // a tap: the cursor goes to the greyed row and the confirm is refused
    expect(playRefusal).toHaveBeenCalledTimes(1);
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Enter', bubbles: true, cancelable: true }));
    expect(playRefusal).toHaveBeenCalledTimes(2);
  });

  it('never plays for a live aeon', async () => {
    restore?.();
    restore = setMenuDrawParity(true, ['help']);
    const picked = openYunaGrandSummon(document.body, { aeons });
    click(rowEls()[1]!);
    await picked;
    expect(playRefusal).not.toHaveBeenCalled();
  });
});

describe('a tap on the title of the Grand Summon picker', () => {
  it('backs out, as Esc does (the overlay leaves and the engine is told it was cancelled)', async () => {
    const picked = openYunaGrandSummon(document.body, { aeons });
    click(titleEl());
    await expect(picked).rejects.toBeInstanceOf(MinigameCancelled);
  });

  it('backs out when nothing can be picked, too', async () => {
    const picked = openYunaGrandSummon(document.body, { aeons: [{ id: 'valefor', name: 'Valefor', storedGauge: 0, enabled: false }] });
    click(titleEl());
    await expect(picked).rejects.toBeInstanceOf(MinigameCancelled);
  });

  it('marks the picker as taking pointer input on the rows and the title only (the slab keeps the layer\'s none)', () => {
    openYunaGrandSummon(document.body, { aeons });
    expect(document.querySelector('.ig-minigame')!.classList.contains('ffx-mg--pick')).toBe(true);
    expect(document.querySelector('.ig-minigame')!.classList.contains('ffx-mg--tap')).toBe(false);
  });

  it('says so on a touch screen and not on a keyboard', () => {
    openYunaGrandSummon(document.body, { aeons });
    expect(document.querySelector('[data-role="subtitle"]')!.textContent).toBe('GRAND SUMMON · AEON ARRIVES WITH A FULL OVERDRIVE');
    document.body.innerHTML = '';
    const mm = vi.fn((q: string) => ({ matches: q === '(pointer: coarse)', media: q }) as MediaQueryList);
    vi.stubGlobal('matchMedia', mm);
    try {
      openYunaGrandSummon(document.body, { aeons });
      expect(document.querySelector('[data-role="subtitle"]')!.textContent).toBe('GRAND SUMMON · AEON ARRIVES WITH A FULL OVERDRIVE · TAP THE TITLE TO GO BACK');
    } finally {
      vi.unstubAllGlobals();
    }
  });
});

describe('after the picker settles', () => {
  it('a late tap on a row changes nothing', async () => {
    const picked = openYunaGrandSummon(document.body, { aeons });
    click(rowEls()[1]!);
    await picked;
    expect(() => click(rowEls()[2]?.isConnected ? rowEls()[2]! : document.body)).not.toThrow();
  });
});
