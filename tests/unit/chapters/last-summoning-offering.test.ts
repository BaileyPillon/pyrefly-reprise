// @vitest-environment jsdom
/**
 * The offering screen of the hidden Last Summoning (FFX only): the model without a DOM, the words, the overlay with the real `Input` and real key events, and the chooser the chain loop asks.
 *
 * The screen is built to the approved frame (`frame-2b-offering-menu.png`); what is pinned here is what the frame promises: the headline, the row of cards in the game's order, taken cards crossed and
 * inert, the focused card gold with SELECT, the panel under the row, any held aeon choosable first, a choice that is final.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { ChainChoice } from '../../../src/app/screens/BattleEncounterChain.ts';
import { offeringChooser, ownedOfferings, takenAt } from '../../../src/app/screens/BattleScreenOffering.ts';
import { Input } from '../../../src/app/Input.ts';
import { buildLastSummoningParty } from '../../../src/data/ffx/builds/last-summoning.ts';
import { lastSummoningGroup } from '../../../src/data/ffx/enemies/last-summoning-chain.ts';
import { OFFERING_KEYS, type OfferingKey, linkGroupId, yuYevonGroupId } from '../../../src/data/ffx/last-summoning-ids.ts';
import { OfferingOverlay } from '../../../src/ui/ffx/offering/OfferingScreen.ts';
import { focusCard, heldOf, isLast, moveFocus, openOffering, panelOf, pressOf } from '../../../src/ui/ffx/offering/offeringModel.ts';
import { OFFERING_HEAD, OFFERING_NAMES, OFFERING_PANELS, OFFERING_TAGS, panelFor, panelHeadings } from '../../../src/ui/ffx/offering/offeringText.ts';

const ALL = [...OFFERING_KEYS];

describe('the model (no DOM)', () => {
  it('opens on the first held aeon with all eight cards in the game’s order, and on nothing when nothing is held', () => {
    const s = openOffering(ALL, [])!;
    expect(s.cards.map((c) => c.key)).toEqual(ALL);
    expect(s.cards.every((c) => c.state === 'held')).toBe(true);
    expect(s.focus).toBe('valefor');
    expect(openOffering(ALL, ['valefor', 'ifrit'])!.focus).toBe('ixion');
    expect(openOffering(ALL, ALL)).toBeNull();
  });

  it('draws a card only for an aeon the party holds at all', () => {
    const five = ALL.filter((k) => ['valefor', 'ifrit', 'ixion', 'shiva', 'bahamut'].includes(k));
    expect(openOffering(five, [])!.cards.map((c) => c.key)).toEqual(['valefor', 'ifrit', 'ixion', 'shiva', 'bahamut']);
  });

  it('marks what Yu Yevon already has as taken, and says so by name', () => {
    const s = openOffering(ALL, ['anima', 'sisters'])!;
    expect(s.cards.filter((c) => c.state === 'taken').map((c) => c.key)).toEqual(['anima', 'sisters']);
    expect(heldOf(s)).toEqual(['valefor', 'ifrit', 'ixion', 'shiva', 'bahamut', 'yojimbo']);
    expect(s.cards.find((c) => c.key === 'sisters')!.name).toBe('Magus Sisters');
  });

  it('moves between held cards only, wrapping at both ends, and does nothing with one card left', () => {
    let s = openOffering(ALL, ['ifrit', 'shiva'])!; // held: valefor, ixion, bahamut, anima, yojimbo, sisters
    expect(s.focus).toBe('valefor');
    s = moveFocus(s, 1);
    expect(s.focus).toBe('ixion'); // Ifrit is skipped
    s = moveFocus(s, 1);
    expect(s.focus).toBe('bahamut'); // Shiva is skipped
    s = moveFocus(moveFocus(moveFocus(moveFocus(s, 1), 1), 1), 1);
    expect(s.focus).toBe('valefor'); // wrapped past the Sisters
    expect(moveFocus(s, -1).focus).toBe('sisters'); // and back
    const last = openOffering(ALL, ALL.slice(0, 7))!;
    expect(moveFocus(last, 1)).toBe(last);
    expect(isLast(last)).toBe(true);
    expect(isLast(openOffering(ALL, [])!)).toBe(false);
  });

  it('focuses a card by tap, but never a taken one', () => {
    const s = openOffering(ALL, ['ifrit'])!;
    expect(focusCard(s, 'bahamut').focus).toBe('bahamut');
    expect(focusCard(s, 'ifrit')).toBe(s);
  });

  it('reads the buttons: left and up are the previous card, right and down the next, confirm gives the focused one', () => {
    const s = openOffering(ALL, [])!;
    expect(pressOf(s, 'right')).toMatchObject({ kind: 'move', state: { focus: 'ifrit' } });
    expect(pressOf(s, 'down')).toMatchObject({ kind: 'move', state: { focus: 'ifrit' } });
    expect(pressOf(s, 'left')).toMatchObject({ kind: 'move', state: { focus: 'sisters' } });
    expect(pressOf(s, 'up')).toMatchObject({ kind: 'move', state: { focus: 'sisters' } });
    expect(pressOf(s, 'confirm')).toEqual({ kind: 'give', key: 'valefor' });
  });

  it('lets any held aeon be chosen first: no order is forced', () => {
    for (const key of ALL) {
      let s = openOffering(ALL, [])!;
      s = focusCard(s, key);
      expect(pressOf(s, 'confirm')).toEqual({ kind: 'give', key });
    }
  });
});

describe('the words (ours)', () => {
  it('has a headline for several aeons and a quieter one for the last, both Yu Yevon reaching', () => {
    expect(OFFERING_HEAD.several.title).toBe('Yu Yevon reaches for one of your aeons.');
    expect(OFFERING_HEAD.last.title).toBe('Yu Yevon reaches for your last aeon.');
  });

  it('writes a panel for every aeon, and headings in capitals that name the focused one', () => {
    for (const key of ALL) {
      expect(OFFERING_PANELS[key].fought.length, key).toBeGreaterThan(30);
      expect(OFFERING_PANELS[key].lose.length, key).toBeGreaterThan(5);
      expect(panelHeadings(key).fought).toBe(key === 'sisters' ? 'IF YU YEVON TAKES THE MAGUS SISTERS' : `IF YU YEVON TAKES ${OFFERING_NAMES[key].toUpperCase()}`);
      expect(panelHeadings(key).lose).toBe('WHAT YOU LOSE');
    }
    expect(panelHeadings('sisters').fought).toBe('IF YU YEVON TAKES THE MAGUS SISTERS'); // the approved frame's own heading
  });

  it('adds the frame’s sentence about the aeon that stays, and a line for the last one held', () => {
    expect(panelFor('sisters', ALL).lose).toMatch(/Yojimbo stays yours until he is taken\.$/);
    expect(panelFor('yojimbo', ALL).lose).toMatch(/The Sisters stay yours until they are taken\.$/);
    expect(panelFor('sisters', ['sisters']).lose).toMatch(/It is the last you hold\.$/);
    expect(panelFor('valefor', ALL).lose).toBe(OFFERING_PANELS.valefor.lose);
    expect(panelOf(openOffering(ALL, [])!)).toEqual(panelFor('valefor', ALL));
  });

  it('names no source and no file, and says what the game does with the numbers it gives (Zanmato’s 9,999) only', () => {
    const all = [...ALL.flatMap((k) => [OFFERING_PANELS[k].fought, OFFERING_PANELS[k].lose]), OFFERING_HEAD.several.sub, OFFERING_HEAD.last.sub].join(' ');
    expect(all).not.toMatch(/§|research\/|\.ts\b|\bD-\d{3}\b|jegged|according to/i);
    expect(all.match(/\d[\d,]*/g) ?? []).toEqual(['9,999']);
  });
});

// ------------------------------------------------------------------------------------------------ the overlay (jsdom)

describe('the overlay, with the real Input', () => {
  let root: HTMLElement;
  let input: Input;
  let clock = 0;

  beforeEach(() => {
    document.body.innerHTML = '';
    root = document.createElement('div');
    document.body.appendChild(root);
    input = new Input({ pointerRoot: root });
    input.attach();
    clock = 0;
  });
  afterEach(() => {
    input.detach();
    vi.useRealTimers();
    document.body.innerHTML = '';
  });

  const key = (code: string): void => {
    window.dispatchEvent(new KeyboardEvent('keydown', { code, bubbles: true }));
    window.dispatchEvent(new KeyboardEvent('keyup', { code, bubbles: true }));
  };
  /** One frame of the screen's loop: forward the snapshot to the overlay. */
  const frame = (overlay: OfferingOverlay): void => {
    clock += 16;
    overlay.handleInput(input.update(clock));
    input.endFrame();
  };
  const cards = (): HTMLElement[] => [...root.querySelectorAll<HTMLElement>('[data-offer-key]')];
  const focused = (): string | undefined => root.querySelector<HTMLElement>('.lscard--focus')?.dataset['offerKey'];

  it('draws the frame: the eyebrow and headline, eight cards in order, the focused card gold with SELECT, the panel and the keys strip', async () => {
    const overlay = new OfferingOverlay({ root, owned: ALL, taken: [], reduceMotion: true });
    const done = overlay.show();
    await Promise.resolve();
    const el = root.querySelector('[data-testid="last-summoning-offering"]')!;
    expect(el).not.toBeNull();
    expect(el.getAttribute('role')).toBe('dialog');
    expect(el.querySelector('.lsoffer__eyebrow')!.textContent).toBe("THE LAST SUMMONING · DREAM'S END");
    expect(el.querySelector('.lsoffer__title')!.textContent).toBe(OFFERING_HEAD.several.title);
    expect(cards().map((c) => c.dataset['offerKey'])).toEqual(ALL);
    expect(focused()).toBe('valefor');
    expect(root.querySelector('.lscard--focus .lscard__tag')!.textContent).toBe(OFFERING_TAGS.select);
    expect(el.querySelector('[data-col="fought"]')!.textContent).toBe('IF YU YEVON TAKES VALEFOR');
    expect(el.querySelector('[data-col="lose"]')!.textContent).toBe('WHAT YOU LOSE');
    expect(el.querySelector('[data-offer-give]')!.textContent).toBe('ENTER');
    expect(root.querySelectorAll('.lscard--sisters .lscard__trio img')).toHaveLength(3); // no portrait of the Sisters exists: the three paintings side by side
    overlay.element!.querySelector<HTMLElement>('[data-offer-give]')!.click();
    expect(await done).toBe('valefor');
  });

  it('crosses what is taken, with TAKEN, and leaves it inert', async () => {
    const overlay = new OfferingOverlay({ root, owned: ALL, taken: ['valefor', 'sisters'], reduceMotion: true });
    const done = overlay.show();
    await Promise.resolve();
    expect(root.querySelectorAll('.lscard--taken')).toHaveLength(2);
    expect(root.querySelector('[data-offer-key="valefor"] .lscard__tag')!.textContent).toBe(OFFERING_TAGS.taken);
    expect(focused()).toBe('ifrit');
    root.querySelector<HTMLElement>('[data-offer-key="valefor"]')!.click(); // a tap on a taken card
    expect(focused()).toBe('ifrit');
    root.querySelector<HTMLElement>('[data-offer-give]')!.click();
    expect(await done).toBe('ifrit');
  });

  it('moves with the arrows and gives on Enter, real key events through the real Input', async () => {
    const overlay = new OfferingOverlay({ root, owned: ALL, taken: [], reduceMotion: true });
    const done = overlay.show();
    await Promise.resolve();
    key('ArrowRight');
    frame(overlay);
    expect(focused()).toBe('ifrit');
    key('KeyD');
    frame(overlay);
    expect(focused()).toBe('ixion');
    key('ArrowLeft');
    frame(overlay);
    key('ArrowLeft');
    frame(overlay);
    key('ArrowLeft'); // wraps to the last card
    frame(overlay);
    expect(focused()).toBe('sisters');
    expect(root.querySelector('[data-col="fought"]')!.textContent).toBe('IF YU YEVON TAKES THE MAGUS SISTERS');
    key('Enter');
    frame(overlay);
    expect(await done).toBe('sisters');
    expect(root.querySelector('[data-testid="last-summoning-offering"]')).toBeNull();
    expect(overlay.visible).toBe(false);
  });

  it('answers Space and Z as Enter does, and takes a second press to nothing (a choice is final)', async () => {
    for (const code of ['Space', 'KeyZ']) {
      document.body.innerHTML = '';
      root = document.createElement('div');
      document.body.appendChild(root);
      const overlay = new OfferingOverlay({ root, owned: ALL, taken: [], reduceMotion: true });
      const done = overlay.show();
      await Promise.resolve();
      key(code);
      frame(overlay);
      key(code);
      frame(overlay);
      expect(await done, code).toBe('valefor');
    }
  });

  it('focuses on a first tap and gives on a second tap of the same card', async () => {
    const overlay = new OfferingOverlay({ root, owned: ALL, taken: [], reduceMotion: true });
    const done = overlay.show();
    await Promise.resolve();
    const bahamut = root.querySelector<HTMLElement>('[data-offer-key="bahamut"]')!;
    bahamut.click();
    expect(focused()).toBe('bahamut');
    expect(root.querySelector('[data-testid="last-summoning-offering"]')).not.toBeNull();
    bahamut.click();
    expect(await done).toBe('bahamut');
  });

  it('says it is the last aeon when only one is held', async () => {
    const overlay = new OfferingOverlay({ root, owned: ALL, taken: ALL.filter((k) => k !== 'anima'), reduceMotion: true });
    const done = overlay.show();
    await Promise.resolve();
    expect(root.querySelector('.lsoffer__title')!.textContent).toBe(OFFERING_HEAD.last.title);
    expect(focused()).toBe('anima');
    expect(root.querySelector('[data-col="lose-text"]')!.textContent).toMatch(/It is the last you hold\.$/);
    key('Enter');
    frame(overlay);
    expect(await done).toBe('anima');
  });

  it('resolves undefined and takes itself down when the screen is left', async () => {
    vi.useFakeTimers();
    let gone = false;
    const overlay = new OfferingOverlay({ root, owned: ALL, taken: [], reduceMotion: true, cancelled: () => gone });
    const done = overlay.show();
    await Promise.resolve();
    expect(overlay.visible).toBe(true);
    gone = true;
    await vi.advanceTimersByTimeAsync(400);
    expect(await done).toBeUndefined();
    expect(root.querySelector('[data-testid="last-summoning-offering"]')).toBeNull();
  });

  it('draws nothing and gives the first held aeon in instant mode (a run nobody watches never parks here)', async () => {
    const overlay = new OfferingOverlay({ root, owned: ALL, taken: ['valefor'], instant: true });
    expect(await overlay.show()).toBe('ifrit');
    expect(root.children).toHaveLength(0);
    expect(await new OfferingOverlay({ root, owned: ALL, taken: ALL, instant: true }).show()).toBeUndefined(); // nothing held: nothing to ask
  });

  it('holds a beat on the card it gives and fades, through the screen’s clock', async () => {
    const waits: number[] = [];
    const overlay = new OfferingOverlay({
      root,
      owned: ALL,
      taken: [],
      sleep: async (ms) => void waits.push(ms),
    });
    const done = overlay.show();
    await Promise.resolve();
    await Promise.resolve();
    key('Enter');
    frame(overlay);
    expect(await done).toBe('valefor');
    expect(waits).toEqual([520, 800, 460]);
  });
});

// ------------------------------------------------------------------------------------------------ the chooser

describe('the chooser the chain loop asks', () => {
  const instant = (owned: readonly string[], seen: { attached: Array<unknown> } = { attached: [] }): ReturnType<typeof offeringChooser> =>
    offeringChooser({ root: document.body, aeonIds: () => owned, instant: () => true, attach: (o) => void seen.attached.push(o) });
  const party = buildLastSummoningParty().aeons.map((a) => a.id);
  const choice = (phase: ChainChoice['phase'], takenOrder: OfferingKey[]): ChainChoice => {
    const group = takenOrder.length === 0 ? lastSummoningGroup('last-summoning:open')! : lastSummoningGroup(linkGroupId(takenOrder))!;
    return { phase, link: takenOrder.length + 1, group, state: undefined as never };
  };

  it('holds eight offerings for the chapter’s party, the Sisters as one, and only the five story aeons for Chapter III’s', () => {
    expect(ownedOfferings(party)).toEqual(ALL);
    expect(ownedOfferings(['valefor', 'ifrit', 'ixion', 'shiva', 'bahamut'])).toEqual(['valefor', 'ifrit', 'ixion', 'shiva', 'bahamut']);
    expect(ownedOfferings(['valefor', 'cindy', 'sandy'])).toEqual(['valefor']); // two Sisters are not the Sisters
  });

  it('reads what has been given up from the formation just won, and nothing before the first fight', () => {
    expect(takenAt({ phase: 'first', group: lastSummoningGroup('last-summoning:open')! })).toEqual([]);
    expect(takenAt({ phase: 'next', group: lastSummoningGroup(linkGroupId(['ifrit', 'sisters']))! })).toEqual(['ifrit', 'sisters']);
  });

  it('answers with the link of the chosen aeon, then the next, and with Yu Yevon once all eight are gone', async () => {
    const choose = instant(party);
    expect(await choose(choice('first', []))).toBe(linkGroupId(['valefor']));
    expect(await choose(choice('next', ['valefor']))).toBe(linkGroupId(['valefor', 'ifrit']));
    expect(await choose(choice('next', ['sisters', 'yojimbo']))).toBe(linkGroupId(['sisters', 'yojimbo', 'valefor']));
    const all: OfferingKey[] = ['anima', 'sisters', 'yojimbo', 'valefor', 'ifrit', 'ixion', 'shiva', 'bahamut'];
    expect(await choose(choice('next', all))).toBe(yuYevonGroupId(all));
  });

  it('shows the overlay and hands it to the screen while it is up, then takes it back', async () => {
    document.body.innerHTML = '';
    const root = document.createElement('div');
    document.body.appendChild(root);
    const attached: Array<OfferingOverlay | null> = [];
    const choose = offeringChooser({ root, aeonIds: () => party, instant: () => false, reduceMotion: () => true, attach: (o) => void attached.push(o) });
    const answer = choose(choice('first', []));
    await Promise.resolve();
    expect(attached[0]).toBeInstanceOf(OfferingOverlay);
    expect(root.querySelector('[data-testid="last-summoning-offering"]')).not.toBeNull();
    root.querySelector<HTMLElement>('[data-offer-key="shiva"]')!.click();
    root.querySelector<HTMLElement>('[data-offer-key="shiva"]')!.click();
    expect(await answer).toBe(linkGroupId(['shiva']));
    expect(attached.at(-1)).toBeNull();
  });

  it('answers undefined when the screen is left first', async () => {
    document.body.innerHTML = '';
    const root = document.createElement('div');
    document.body.appendChild(root);
    const choose = offeringChooser({ root, aeonIds: () => party, instant: () => false, reduceMotion: () => true, cancelled: () => true, attach: () => undefined });
    expect(await choose(choice('first', []))).toBeUndefined();
  });
});
