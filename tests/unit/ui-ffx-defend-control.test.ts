// @vitest-environment jsdom
/**
 * Release 39 (FFX only): Defend is reachable. It is the original game's Triangle, named on a tab under the command window.
 *
 * Bailey, 2026-10-04: "How do I use defend? That's not clear to me". The FFX command window leaves the engine's `defend`
 * row off the list on purpose (`CommandMenuLogic.buildTopRows`: "reached by an affordance"), and no affordance existed, so a
 * player could not Defend at all. The original's input is the Triangle button
 * (`research/ffx-defend-input-2026-10-04.md`, `[verified: 4 GameFAQs sources]`: "Defend (Triangle or Sentinel)", two board threads
 * that answer "how do you defend?" with "press triangle", and a third titled "press Triangle to defend"). The build had bound
 * Triangle to the party swap, which the sources give to L1.
 *
 * Bailey picked "the original-style control beside the command window, with a small visible Defend tag naming its key and a
 * touch target" (option 2). This file runs the real `CommandMenu` the way the page drives it: real `keydown` events, a polled
 * pad, a real click, and asserts the engine's own `defend` command comes out, the tab says the right thing per device, and
 * everything the move advisor and the list do today is unchanged.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AnyCombatant, AvailableCommand, CombatantId, Command } from '../../src/battle/common/types.ts';
import { onTheMenu } from '../../src/engine/tactics/advisor-menu.ts';
import { CommandMenu, buildTopRows } from '../../src/ui/ffx/CommandMenu.ts';
import { DEFEND_KEY_CODE, defendCommandOf, defendFace, pressDefends } from '../../src/ui/ffx/defendControl.ts';
import { RawInputWatcher, forgetPlayerDevice } from '../../src/ui/ffx/rawInput.ts';
import { makeFakeCombatants, makeFakeCommands } from '../../src/ui/ffx/testFixtures.ts';

const COMBATANTS = makeFakeCombatants() as unknown as Record<CombatantId, AnyCombatant>;

function keydown(code: string): void {
  window.dispatchEvent(new KeyboardEvent('keydown', { code, key: code, bubbles: true, cancelable: true }));
}

function makePad(): { pad: Gamepad; set(index: number, down: boolean): void } {
  const buttons = Array.from({ length: 17 }, () => ({ pressed: false, touched: false, value: 0 }));
  const pad = { id: 'test pad', index: 0, connected: true, mapping: 'standard', axes: [0, 0, 0, 0], buttons, timestamp: 0 } as unknown as Gamepad;
  return { pad, set: (i, down) => { buttons[i] = { pressed: down, touched: down, value: down ? 1 : 0 }; } };
}

async function tapPad(set: (i: number, down: boolean) => void, index: number): Promise<void> {
  set(index, true);
  await vi.advanceTimersByTimeAsync(50);
  set(index, false);
  await vi.advanceTimersByTimeAsync(50);
}

function stubCoarsePointer(coarse: boolean): void {
  window.matchMedia = ((query: string) => ({ matches: coarse && query.includes('coarse'), media: query, addEventListener() {}, removeEventListener() {} })) as unknown as typeof window.matchMedia;
}

function open(commands: AvailableCommand[] = makeFakeCommands()) {
  const menu = new CommandMenu();
  menu.setProjector((id) => ({ x: id.length * 40, y: 300, w: 120, h: 260 }));
  document.body.append(menu.stackEl, menu.breadcrumbEl, menu.defendEl, menu.targetCursor.el);
  let result: Command | undefined;
  void menu
    .open({ actorId: 'tidus', commands, previewRank: () => [], combatants: COMBATANTS, setHelp: () => undefined })
    .then((c) => { result = c; });
  const tag = (): HTMLElement => menu.defendEl;
  const words = (): string => tag().textContent ?? '';
  /** The decision, once the promise's microtask has run. */
  const decided = async (): Promise<Command | undefined> => {
    await vi.advanceTimersByTimeAsync(0);
    return result;
  };
  return { menu, tag, words, decided };
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'requestAnimationFrame', 'cancelAnimationFrame', 'performance'] });
  document.body.innerHTML = '';
  forgetPlayerDevice();
});

afterEach(() => {
  vi.useRealTimers();
  delete (navigator as { getGamepads?: unknown }).getGamepads;
  delete (window as { matchMedia?: unknown }).matchMedia;
  document.body.innerHTML = '';
});

describe('what the engine offers and what the tab says', () => {
  const DEFEND: AvailableCommand = { command: { kind: 'defend', targets: [] }, label: 'Defend', category: 'special', mpCost: 0, enabled: true, validTargets: [] };

  it('the usable Defend command is found; none, or a greyed one, is not', async () => {
    expect(defendCommandOf(makeFakeCommands())?.command.kind).toBe('defend');
    expect(defendCommandOf(makeFakeCommands().filter((c) => c.command.kind !== 'defend'))).toBeNull();
    expect(defendCommandOf([{ ...DEFEND, enabled: false }])).toBeNull();
  });

  it('the tab names the control of each device: the key, the pad symbol, a tap', async () => {
    expect(defendFace({ device: 'keyboard', pointerKind: 'mouse' })).toEqual({ key: 'Q', sym: '△', label: 'Defend', aria: 'Defend, key Q' });
    expect(defendFace({ device: 'pointer', pointerKind: 'mouse' })).toEqual({ key: 'Q', sym: '△', label: 'Defend', aria: 'Defend, key Q' });
    expect(defendFace({ device: 'gamepad', pointerKind: 'mouse' })).toEqual({ key: '△', sym: '', label: 'Defend', aria: 'Defend, Triangle' });
    expect(defendFace({ device: 'pointer', pointerKind: 'touch' })).toEqual({ key: '', sym: '', label: 'Defend', aria: 'Defend' });
  });

  it('the advisor still never offers Defend in FFX (its gate is unchanged); FFX-2 keeps it', async () => {
    expect(onTheMenu('ffx', DEFEND.command)).toBe(false);
    expect(onTheMenu('ffx2', DEFEND.command)).toBe(true);
  });

  it('the list is as it was: no Defend row, and Switch is still the last row', async () => {
    const rows = buildTopRows(makeFakeCommands());
    expect(rows.some((r) => (r.kind === 'direct' ? r.cmd.command.kind : r.label) === 'defend' || (r.kind === 'direct' && r.cmd.label === 'Defend'))).toBe(false);
    expect(rows.at(-1)).toMatchObject({ kind: 'group', label: 'Switch' });
    const o = open();
    expect(o.menu.stackEl.textContent).not.toMatch(/defend/i);
  });
});

describe('the tab is on screen while Defend is on offer at the top level', () => {
  it('shown with the keyboard words, naming Q', async () => {
    const o = open();
    expect(o.tag().hidden).toBe(false);
    expect(o.words()).toBe('Q△Defend');
    expect(o.tag().dataset['input']).toBe('keyboard');
    expect(o.tag().getAttribute('role')).toBe('button');
    expect(o.tag().getAttribute('aria-label')).toBe('Defend, key Q');
    expect(o.tag().title).not.toBe(''); // the engine's own help line for Defend, on hover
  });

  it('hidden when the engine offers no Defend, or a greyed one', async () => {
    const none = open(makeFakeCommands().filter((c) => c.command.kind !== 'defend'));
    expect(none.tag().hidden).toBe(true);
    document.body.innerHTML = '';
    const grey = open(makeFakeCommands().map((c) => (c.command.kind === 'defend' ? { ...c, enabled: false } : c)));
    expect(grey.tag().hidden).toBe(true);
  });

  it('hidden inside a submenu and during the target step, and back at the top level', async () => {
    const o = open();
    keydown('ArrowDown'); // from Attack to Skill (two moves: a submenu)
    keydown('Enter'); // open Skill
    expect(o.menu.breadcrumbEl.hidden).toBe(false);
    expect(o.menu.breadcrumbEl.textContent).toBe('Skill');
    expect(o.tag().hidden).toBe(true);
    keydown('Escape'); // back to the top
    expect(o.tag().hidden).toBe(false);
    keydown('ArrowUp'); // Attack
    expect(o.tag().hidden).toBe(false);
    keydown('Enter'); // Attack opens the target step
    expect(o.menu.targetCursor.selection).not.toBeNull();
    expect(o.tag().hidden).toBe(true);
    keydown('Escape');
    expect(o.tag().hidden).toBe(false);
  });

  it('goes with the menu: suspended while an action resolves (back with the next button), gone once decided', async () => {
    const o = open();
    o.menu.suspend();
    expect(o.tag().hidden).toBe(true);
    keydown('ArrowDown'); // resumes the menu
    expect(o.tag().hidden).toBe(false);
    o.menu.close();
    expect(o.tag().hidden).toBe(true);
  });
});

describe('every input can Defend: the engine\'s own defend command comes out', () => {
  it('Q is Defend', async () => {
    const o = open();
    keydown('KeyQ');
    expect(await o.decided()).toEqual({ kind: 'defend', targets: [] });
    expect(o.tag().hidden).toBe(true);
  });

  it('Shift is not Defend: the tab names Q, and a stray Shift tap, left or right, spends no turn (release 39 check)', async () => {
    const o = open();
    const selected = (): string => o.menu.stackEl.querySelector('.ig-cmd--selected')?.textContent ?? '';
    const before = selected();
    keydown('ShiftLeft');
    keydown('ShiftRight');
    expect(await o.decided()).toBeUndefined();
    expect(o.tag().hidden).toBe(false); // the menu is still open at its top level, the tab still up
    expect(selected()).toBe(before); // and nothing moved
    keydown('KeyQ'); // Q still is Defend
    expect(await o.decided()).toEqual({ kind: 'defend', targets: [] });
  });

  it('the pad\'s Triangle (standard button 3) is Defend, and the words name the symbol', async () => {
    const { pad, set } = makePad();
    Object.defineProperty(navigator, 'getGamepads', { configurable: true, value: () => [pad] });
    const o = open();
    expect(o.tag().dataset['input']).toBe('gamepad'); // a connected pad is the best guess before any press
    expect(o.words()).toBe('△Defend');
    expect(o.tag().getAttribute('aria-label')).toBe('Defend, Triangle');
    await tapPad(set, 3);
    expect(await o.decided()).toEqual({ kind: 'defend', targets: [] });
  });

  it('a click or a tap on the tab is Defend', async () => {
    const o = open();
    o.tag().dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    expect(await o.decided()).toEqual({ kind: 'defend', targets: [] });
  });

  it('on a touch screen the tab says only Defend, before any press', async () => {
    stubCoarsePointer(true);
    const o = open();
    expect(o.words()).toBe('Defend');
    expect(o.tag().dataset['input']).toBe('pointer');
    o.tag().dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    expect(await o.decided()).toEqual({ kind: 'defend', targets: [] });
  });

  it('the words follow the input in use: a pad press reads as the pad, a touch on the list as a finger, a key as the keyboard', async () => {
    const { pad, set } = makePad();
    const o = open();
    expect(o.words()).toBe('Q△Defend');
    Object.defineProperty(navigator, 'getGamepads', { configurable: true, value: () => [pad] });
    await tapPad(set, 13); // d-pad down: moves the cursor, and the player is on the pad now
    expect(o.words()).toBe('△Defend');
    o.menu.stackEl.dispatchEvent(new PointerEvent('pointerdown', { pointerType: 'touch', bubbles: true }));
    expect(o.words()).toBe('Defend');
    o.menu.stackEl.dispatchEvent(new PointerEvent('pointerdown', { pointerType: 'mouse', bubbles: true }));
    expect(o.words()).toBe('Q△Defend'); // a mouse has a keyboard beside it: the key is named
    keydown('ArrowDown'); // back to the keyboard
    expect(o.words()).toBe('Q△Defend');
  });

  it('a device switch changes the words but keeps the nodes, so a click already under way still lands (the first real mouse run lost it)', async () => {
    const o = open();
    const label = o.tag().querySelector('.ffx-cmd-defend__label');
    const key = o.tag().querySelector('.ffx-cmd-defend__key');
    o.tag().dispatchEvent(new PointerEvent('pointerdown', { pointerType: 'touch', bubbles: true })); // the finger goes down on the tab
    expect(o.words()).toBe('Defend'); // the words switched from the keyboard's to a finger's ...
    expect(o.tag().querySelector('.ffx-cmd-defend__label')).toBe(label); // ... on the same nodes
    expect(o.tag().querySelector('.ffx-cmd-defend__key')).toBe(key);
    expect((key as HTMLElement).hidden).toBe(true);
    o.tag().dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })); // ... and comes up
    expect(await o.decided()).toEqual({ kind: 'defend', targets: [] });
  });

  it('Defend does nothing in a submenu or while aiming: Q there is not a spent turn', async () => {
    const o = open();
    keydown('ArrowDown');
    keydown('Enter'); // Skill: a submenu
    expect(o.menu.breadcrumbEl.textContent).toBe('Skill');
    keydown('KeyQ');
    expect(await o.decided()).toBeUndefined();
    keydown('Escape');
    keydown('ArrowUp');
    keydown('Enter'); // Attack: aiming
    keydown('KeyQ');
    expect(await o.decided()).toBeUndefined();
    o.tag().dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    expect(await o.decided()).toBeUndefined();
  });

  it('with no Defend on offer, Q does nothing at all', async () => {
    const o = open(makeFakeCommands().filter((c) => c.command.kind !== 'defend'));
    keydown('KeyQ');
    expect(await o.decided()).toBeUndefined();
  });

  it('a closed menu takes no Defend press', async () => {
    const o = open();
    o.menu.close();
    keydown('KeyQ');
    o.tag().dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    expect(await o.decided()).toBeUndefined();
  });
});

describe('Shift keeps everything else it did (release 39 check: only the Defend press at this menu ignores it)', () => {
  it('the watcher still reads Shift (either side) and Q as Triangle, and now also says which key it was', () => {
    const seen: string[] = [];
    const watcher = new RawInputWatcher((b, source, code) => seen.push(`${b}/${source}/${code}`));
    watcher.attach();
    keydown('ShiftLeft');
    keydown('ShiftRight');
    keydown('KeyQ');
    watcher.detach();
    expect(seen).toEqual(['triangle/keyboard/ShiftLeft', 'triangle/keyboard/ShiftRight', 'triangle/keyboard/KeyQ']);
  });

  it('a pad press carries no key, which is how the pad\'s Triangle stays the original\'s Defend', async () => {
    const { pad, set } = makePad();
    Object.defineProperty(navigator, 'getGamepads', { configurable: true, value: () => [pad] });
    const seen: string[] = [];
    const watcher = new RawInputWatcher((b, source, code) => seen.push(`${b}/${source}/${code}`));
    watcher.attach();
    await tapPad(set, 3);
    watcher.detach();
    expect(seen).toEqual(['triangle/gamepad/undefined']);
  });

  it('pressDefends: the pad (no key) and Q defend; Shift, Tab and any other key that reads as Triangle do not', () => {
    expect(DEFEND_KEY_CODE).toBe('KeyQ'); // the key the tab prints
    expect(pressDefends(undefined)).toBe(true);
    expect(pressDefends('KeyQ')).toBe(true);
    for (const code of ['ShiftLeft', 'ShiftRight', 'Tab', 'Enter', 'KeyE']) expect(pressDefends(code)).toBe(false);
  });

  it('a Shift tap at the menu is still a keyboard press: on a touch screen the tab names the keys again', async () => {
    stubCoarsePointer(true);
    const o = open();
    expect(o.words()).toBe('Defend');
    keydown('ShiftLeft');
    expect(o.words()).toBe('Q△Defend');
    expect(await o.decided()).toBeUndefined();
  });

  it('a Shift tap still wakes a suspended menu, as any button does, and spends nothing', async () => {
    const o = open();
    o.menu.suspend();
    expect(o.tag().hidden).toBe(true);
    keydown('ShiftLeft');
    expect(o.tag().hidden).toBe(false);
    expect(await o.decided()).toBeUndefined();
  });
});

describe('the party swap moved to its own button: L1 (and R1) open it, Triangle no longer does', () => {
  it('F (L1) and R open the Switch list', async () => {
    for (const code of ['KeyF', 'KeyR', 'PageUp']) {
      document.body.innerHTML = '';
      const o = open();
      keydown(code);
      expect(o.menu.breadcrumbEl.textContent).toBe('Switch');
      expect(await o.decided()).toBeUndefined();
      o.menu.close();
    }
  });

  it('Q (Triangle) defends instead of opening the Switch list', async () => {
    const o = open();
    keydown('KeyQ');
    expect(o.menu.breadcrumbEl.textContent).not.toBe('Switch');
    expect(await o.decided()).toEqual({ kind: 'defend', targets: [] });
  });
});

describe('the stylesheet', () => {
  it('keeps the tab out of flow (it moves no row), gives it pointer events, and has an upright-phone rule', async () => {
    const { readFileSync } = await import('node:fs');
    const css = readFileSync('src/ui/ffx/defend-control.css', 'utf8');
    expect(css).toMatch(/\.ffx-cmd-defend\s*\{[^}]*position:\s*absolute/);
    expect(css).toMatch(/\.ffx-cmd-defend\s*\{[^}]*pointer-events:\s*auto/);
    expect(css).toMatch(/html\[data-phone-battle='ffx'\] \.ffxhud \.ffx-cmd-defend\s*\{[^}]*height:\s*40px/);
  });
});
