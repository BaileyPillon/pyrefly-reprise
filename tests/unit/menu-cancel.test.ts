// @vitest-environment jsdom
/**
 * Who owns **Esc** while a command menu is open.
 *
 * The player's report was "it doesn't seem like there's a way to pause? I tried
 * esc and P during battle". `P` is answered by `BattleScreen.canPause` no longer
 * refusing while the HUD waits for a command (`pause-panels.test.ts`). Esc is
 * the other half, and it cannot simply be taken: in a submenu or while
 * targeting it is the menu's back button, and one press cannot mean both.
 *
 * The claim this file tests is that the conflict is **not always on**. Neither
 * menu binds Esc at its top row, so at the top row — where a player actually is
 * when they reach for the pause — Esc is free. Each menu publishes that through
 * `ui/common/menuCancel.ts`, and `BattleScreen.canPauseOnCancel` reads it.
 *
 * Driven through the real menus, with real key events, because the bug being
 * guarded against is a *missed transition*: a menu that forgets to publish on
 * one path leaves Esc either dead for the rest of the battle or live while the
 * player is mid-targeting. Every view change is walked here for that reason.
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { menuOwnsCancel, setMenuOwnsCancel } from '../../src/ui/common/menuCancel.ts';
import { CommandMenu } from '../../src/ui/ffx/CommandMenu.ts';
import { openCommandMenu } from '../../src/ui/ffx2/CommandMenu.ts';
import { makeFakeCombatants, makeFakeCommands } from '../../src/ui/ffx/testFixtures.ts';
import type { AtbSnapshot, AvailableCommand } from '../../src/battle/common/types.ts';

const EMPTY_SNAPSHOT: AtbSnapshot = { elapsedMs: 0, bars: [] };

function key(code: string): void {
  window.dispatchEvent(new KeyboardEvent('keydown', { code, bubbles: true }));
}

beforeEach(() => {
  setMenuOwnsCancel(false);
  document.body.innerHTML = '';
});

describe('the flag itself', () => {
  it('starts false — with no menu open, Esc belongs to the pause', () => {
    expect(menuOwnsCancel()).toBe(false);
  });

  it('round-trips', () => {
    setMenuOwnsCancel(true);
    expect(menuOwnsCancel()).toBe(true);
    setMenuOwnsCancel(false);
    expect(menuOwnsCancel()).toBe(false);
  });
});

describe('FFX command menu', () => {
  function open(): CommandMenu {
    const menu = new CommandMenu();
    document.body.append(menu.stackEl, menu.breadcrumbEl);
    void menu.open({
      actorId: 'tidus',
      commands: makeFakeCommands(),
      previewRank: () => [],
      combatants: makeFakeCombatants(),
      setHelp: () => {},
    });
    return menu;
  }

  it('leaves Esc free at the top row', () => {
    open();
    expect(menuOwnsCancel()).toBe(false);
  });

  it('takes Esc in a submenu and gives it back on the way out', () => {
    open();
    // Down to a category row with more than one entry ("Skill"), then in.
    key('ArrowDown');
    key('Enter');
    expect(menuOwnsCancel()).toBe(true);

    key('Escape'); // back to the top row
    expect(menuOwnsCancel()).toBe(false);
  });

  it('takes Esc while targeting, even though targeting never re-renders the stack', () => {
    open();
    // "Attack" is the top row and has two valid targets, so confirming it goes
    // straight to the reticle — the path that sets `state` without touching
    // `renderStack()`, which is why the publish lives on the state accessor.
    key('Enter');
    expect(menuOwnsCancel()).toBe(true);

    key('Escape'); // out of targeting, back to the top
    expect(menuOwnsCancel()).toBe(false);
  });

  it('gives Esc back when a command is taken from inside a submenu', async () => {
    const menu = open();
    const picked = new Promise((resolve) => {
      void menu.open({
        actorId: 'tidus',
        commands: makeFakeCommands(),
        previewRank: () => [],
        combatants: makeFakeCombatants(),
        setHelp: () => {},
      }).then(resolve);
    });
    key('ArrowDown');
    key('Enter');
    expect(menuOwnsCancel()).toBe(true);
    // Resolve something out of the submenu. Whatever it lands on, the menu is
    // closing, and a closed menu must not keep Esc.
    key('Enter');
    key('Enter');
    await Promise.race([picked, Promise.resolve()]);
    expect(menuOwnsCancel()).toBe(false);
  });
});

describe('FFX-2 command menu', () => {
  const commands: AvailableCommand[] = [
    {
      command: { kind: 'attack', targets: [] },
      label: 'Attack',
      category: 'attack',
      mpCost: 0,
      enabled: true,
      validTargets: ['bahamut', 'shuyin'],
    },
    {
      command: { kind: 'ability', id: 'firaga', targets: [] },
      label: 'Firaga',
      category: 'blackmagic',
      mpCost: 12,
      enabled: true,
      validTargets: ['bahamut'],
    },
    {
      command: { kind: 'ability', id: 'blizzaga', targets: [] },
      label: 'Blizzaga',
      category: 'blackmagic',
      mpCost: 14,
      enabled: true,
      validTargets: ['bahamut'],
    },
  ];

  function open(): Promise<unknown> {
    const container = document.createElement('div');
    const targetLayer = document.createElement('div');
    document.body.append(container, targetLayer);
    return openCommandMenu({
      container,
      targetLayer,
      commands,
      previewRank: () => EMPTY_SNAPSHOT,
      project: () => null,
      onPreview: () => {},
      actorName: 'Yuna',
    });
  }

  it('leaves Esc free at the top row', () => {
    void open();
    expect(menuOwnsCancel()).toBe(false);
  });

  it('takes Esc in a submenu and gives it back on the way out', () => {
    void open();
    key('ArrowDown'); // onto the "Black Magic" group
    key('Enter');
    expect(menuOwnsCancel()).toBe(true);

    key('Escape');
    expect(menuOwnsCancel()).toBe(false);
  });

  it('keeps Esc through targeting — even a one-target move opens the reticle', () => {
    void open();
    key('ArrowDown');
    key('Enter'); // into Black Magic
    key('Enter'); // pick Firaga. Unlike FFX, X-2 shows the reticle even for a
    //               single candidate, so the menu is still up and still owns Esc.
    expect(menuOwnsCancel()).toBe(true);
  });

  it('gives Esc back once the menu is torn down', async () => {
    const picked = open();
    key('ArrowDown');
    key('Enter'); // into Black Magic
    key('Enter'); // pick Firaga -> reticle
    key('Enter'); // confirm the target -> finish -> cleanup
    await Promise.race([picked, Promise.resolve()]);
    expect(menuOwnsCancel()).toBe(false);
  });
});
