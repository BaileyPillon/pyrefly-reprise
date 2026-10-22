// @vitest-environment jsdom
/**
 * R61 booth fix 1 (Bailey, 2026-10-20, the conference demo): **Esc closes a first-use card; the next Esc pauses.**
 *
 * The live r60 check: fresh profile, Chapter I at 1600x900, Auron's first-command card up (the guided first run's third step). The first Escape took the
 * card down AND opened the pause menu over a battle the visitor had not started. FR-34-01 (release 34) had made it so on purpose (`ui-coach-first-run.test.ts`
 * used to say "leaves the press to the game, so the pause opens on it"); the booth needs the rule every other overlay follows: the press that dismisses a card dies
 * with the card (`ui-coach-input-leak.test.ts`, `ui-coach-dismiss-press.test.ts`).
 *
 * The card runs for real here (jsdom, real `keydown` events, a polled pad); the "menu behind it" is a second real `RawInputWatcher` (what both command menus read),
 * and the "pause" is the real `Input` the battle screen reads once a frame (`justPressed('cancel')`), wired the way `App` wires it (`setCardPressAbsorber`).
 *
 * Game case: **both**. FFX's first-command card holds until a press; FFX-2's cards fade on their own. Either one is a card that is up (rule 14: true of both games).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Input } from '../../src/app/Input.ts';
import { CoachMark } from '../../src/ui/coach/CoachMark.ts';
import { coachCardUp, setCardPressAbsorber } from '../../src/ui/coach/cardPress.ts';
import { marksFor } from '../../src/ui/coach/coachCopy.ts';
import { hasSeen, resetCoach } from '../../src/ui/coach/coachState.ts';
import { FIRST_RUN_IDS } from '../../src/ui/coach/firstRunCopy.ts';
import { armFirstRunGuide, firstRunActive, firstRunBattleBegan, firstRunTurnGuide, stopFirstRun } from '../../src/ui/coach/firstRunGuide.ts';
import { RawInputWatcher, setRawInputSuspended } from '../../src/ui/ffx/rawInput.ts';

const key = (code: string, init: KeyboardEventInit = {}): KeyboardEvent =>
  new KeyboardEvent('keydown', { code, key: code, bubbles: true, cancelable: true, ...init });

function makePad(): { pad: Gamepad; set(index: number, down: boolean): void } {
  const buttons = Array.from({ length: 17 }, () => ({ pressed: false, touched: false, value: 0 }));
  const pad = { id: 'test pad', index: 0, connected: true, mapping: 'standard', axes: [0, 0, 0, 0], buttons, timestamp: 0 } as unknown as Gamepad;
  return { pad, set: (i, down) => { buttons[i] = { pressed: down, touched: down, value: down ? 1 : 0 }; } };
}

/** Hold a pad button for three frames, then let go for three (a press every poller sees). */
async function tapPad(set: (i: number, down: boolean) => void, index: number): Promise<void> {
  set(index, true);
  await vi.advanceTimersByTimeAsync(50);
  set(index, false);
  await vi.advanceTimersByTimeAsync(50);
}

let padSet!: (i: number, down: boolean) => void;
let heard: string[] = [];
let menu: RawInputWatcher | null = null;
let absorbed = 0;
let input: Input | null = null;

function attachMenu(): void {
  menu = new RawInputWatcher((b) => heard.push(b));
  menu.attach();
}

function mountCard(opts: { game?: 'ffx' | 'ffx2'; guide?: boolean } = {}): CoachMark {
  const { game = 'ffx', guide = true } = opts;
  const root = document.createElement('div');
  root.innerHTML = '<div class="ffxhud"><div class="ig-cmd-stack"><div class="ig-cmd">Talk</div><div class="ig-cmd ig-cmd--selected">Attack</div></div></div><div class="coach-layer"></div>';
  document.body.appendChild(root);
  if (guide) {
    armFirstRunGuide({ root: document.body, absorbInput: () => undefined });
    firstRunBattleBegan('ffx');
  }
  const card = new CoachMark({
    root: root.querySelector('.coach-layer') as HTMLElement,
    mark: marksFor(game)[0]!,
    game,
    reduceMotion: true,
    setTimer: () => 0,
    clearTimer: () => undefined,
    guide: guide && game === 'ffx' ? firstRunTurnGuide() : null,
  });
  void card.show(); // `CoachLayer.chooseCommand` raises the card, then opens the menu in the same turn
  attachMenu();
  return card;
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'requestAnimationFrame', 'cancelAnimationFrame', 'performance'] });
  resetCoach();
  stopFirstRun();
  heard = [];
  absorbed = 0;
  setCardPressAbsorber(() => void (absorbed += 1));
  const p = makePad();
  padSet = p.set;
  Object.defineProperty(navigator, 'getGamepads', { configurable: true, value: () => [p.pad] });
});

afterEach(() => {
  menu?.detach();
  menu = null;
  input?.detach();
  input = null;
  stopFirstRun();
  setCardPressAbsorber(null);
  setRawInputSuspended(false);
  vi.useRealTimers();
  delete (navigator as { getGamepads?: unknown }).getGamepads;
  document.body.innerHTML = '';
});

describe('the keyboard: one Esc takes the card down and does nothing else', () => {
  it('Chapter I (FFX), the guided first run\'s third card: the card is down, the press is taken whole, the menu hears nothing, the press is absorbed once', async () => {
    const card = mountCard({ guide: true });
    expect(coachCardUp()).toBe(true);
    const esc = key('Escape');
    window.dispatchEvent(esc);
    expect(card.finished).toBe(true);
    expect(esc.defaultPrevented).toBe(true);
    expect(heard).toEqual([]); // the menu behind the card never saw the Back
    expect(absorbed).toBe(1); // `Input` is told to drop the press the battle screen would turn into the pause
    for (const id of FIRST_RUN_IDS) expect(hasSeen(id)).toBe(true); // Esc still skips the whole guide (the card says "Esc skip the guide")
    expect(firstRunActive()).toBe(false);
    expect(coachCardUp()).toBe(false);
  });

  it('the plain first-command line (no guide) is the same', () => {
    const card = mountCard({ guide: false });
    const esc = key('Escape');
    window.dispatchEvent(esc);
    expect(card.finished).toBe(true);
    expect(esc.defaultPrevented).toBe(true);
    expect(heard).toEqual([]);
    expect(absorbed).toBe(1);
  });

  it('Chapter IV (FFX-2), Rikku\'s card that fades on its own: Esc closes it first as well', () => {
    const card = mountCard({ game: 'ffx2', guide: false });
    expect(marksFor('ffx2')[0]!.holds).toBe(false);
    const esc = key('Escape');
    window.dispatchEvent(esc);
    expect(card.finished).toBe(true);
    expect(esc.defaultPrevented).toBe(true);
    expect(heard).toEqual([]);
    expect(absorbed).toBe(1);
  });

  it('X and Backspace are the game\'s other Back keys: the same', () => {
    for (const code of ['KeyX', 'Backspace']) {
      heard = [];
      absorbed = 0;
      const card = mountCard({ guide: false });
      window.dispatchEvent(key(code));
      expect(card.finished, code).toBe(true);
      expect(heard, code).toEqual([]);
      expect(absorbed, code).toBe(1);
      menu?.detach();
    }
  });

  it('with no card up the Back is the game\'s again: the menu hears it, nothing is absorbed (the second Esc pauses)', () => {
    const card = mountCard({ guide: false });
    window.dispatchEvent(key('Escape'));
    expect(card.finished).toBe(true);
    heard = [];
    absorbed = 0;
    const second = key('Escape');
    window.dispatchEvent(second);
    expect(second.defaultPrevented).toBe(false);
    expect(heard).toEqual(['cancel']);
    expect(absorbed).toBe(0);
  });

  it('only a plain press: a held key\'s repeats are left alone, and so is every other key (P is the pause\'s own)', () => {
    const card = mountCard({ guide: false });
    window.dispatchEvent(key('Escape', { repeat: true }));
    window.dispatchEvent(key('KeyP'));
    expect(card.finished).toBe(false);
    expect(absorbed).toBe(0);
    card.dismiss(); // a card left up would hear the next test's keys
  });

  it('a card whose HUD was torn down around it takes no press: it comes down on a Back, and absorbs nothing', () => {
    const card = mountCard({ guide: false });
    card.el.remove();
    window.dispatchEvent(key('Escape'));
    expect(card.finished).toBe(true);
    expect(absorbed).toBe(0);
  });

  it('a card taken down by something else (a beat card, auto-play) absorbs nothing', () => {
    const card = mountCard({ guide: true });
    card.dismiss();
    expect(absorbed).toBe(0);
    expect(coachCardUp()).toBe(false);
  });

  it('the skip words are a click, not a press: the guide ends, nothing is absorbed', () => {
    const card = mountCard({ guide: true });
    (card.el.querySelector('[data-role="firstrun-skip"]') as HTMLElement).click();
    expect(card.finished).toBe(true);
    expect(absorbed).toBe(0);
  });
});

describe('the pad: Circle takes the card down and does nothing else', () => {
  it('the menu hears nothing, the press is absorbed once, and the next Circle is the game\'s', async () => {
    const card = mountCard({ guide: true });
    await tapPad(padSet, 1); // Circle
    expect(card.finished).toBe(true);
    expect(heard).toEqual([]);
    expect(absorbed).toBe(1);
    await tapPad(padSet, 1);
    expect(heard).toEqual(['cancel']); // the claim ended with the first press: this one reaches the menu and the pause
  });

  it('FFX-2: the same for Circle; its Cross still reaches the menu behind the fading card, as it did', async () => {
    const card = mountCard({ game: 'ffx2', guide: false });
    await tapPad(padSet, 1);
    expect(card.finished).toBe(true);
    expect(heard).toEqual([]);
    expect(absorbed).toBe(1);
  });
});

describe('the real Input: the battle screen\'s next-frame read of Back', () => {
  /** One whole app frame as `App.tick` does it. */
  let t = 0;
  function frame(): boolean {
    t += 16;
    const snap = input!.update(t);
    const cancel = snap.justPressed('cancel');
    input!.endFrame();
    return cancel;
  }

  beforeEach(() => {
    t = 0;
    const root = document.createElement('div');
    document.body.appendChild(root);
    input = new Input({ keyboardTarget: window, pointerRoot: root });
    input.attach(); // first on `window`, as in the app: it latches the press before the card hears it
    setCardPressAbsorber(() => input!.claimKeyboard(() => undefined, { exclusive: true })()); // exactly `App`'s
  });

  it('control: with no card up, an Esc is a Back the battle screen reads (that is the pause)', () => {
    window.dispatchEvent(key('Escape'));
    expect(frame()).toBe(true);
  });

  it('with the card up the same Esc is gone before the battle screen\'s frame, and the frame after', () => {
    mountCard({ guide: true });
    window.dispatchEvent(key('Escape'));
    window.dispatchEvent(new KeyboardEvent('keyup', { code: 'Escape', bubbles: true }));
    expect(frame(), 'the pause would have opened on this frame').toBe(false);
    expect(frame()).toBe(false);
  });

  it('and the next Esc, with the card gone, pauses as it always did', () => {
    mountCard({ guide: true });
    window.dispatchEvent(key('Escape'));
    window.dispatchEvent(new KeyboardEvent('keyup', { code: 'Escape', bubbles: true }));
    frame();
    frame();
    window.dispatchEvent(key('Escape'));
    expect(frame()).toBe(true);
  });

  it('the pad: Circle on the card is gone before the frame the battle screen reads it on', async () => {
    mountCard({ guide: true });
    padSet(1, true);
    await vi.advanceTimersByTimeAsync(20);
    const seen = frame();
    padSet(1, false);
    await vi.advanceTimersByTimeAsync(20);
    expect(seen || frame() || frame()).toBe(false);
  });
});

describe('coachCardUp (what the battle screen asks before it opens the pause on Back)', () => {
  it('is true while a card is on screen and false once it is down', () => {
    expect(coachCardUp()).toBe(false);
    const card = mountCard({ guide: false });
    expect(coachCardUp()).toBe(true);
    card.dismiss();
    expect(coachCardUp()).toBe(false);
  });

  it('a flag left behind with no card in the page never blocks the pause', () => {
    document.documentElement.dataset['coachMark'] = '1';
    expect(coachCardUp()).toBe(false);
    delete document.documentElement.dataset['coachMark'];
  });
});
