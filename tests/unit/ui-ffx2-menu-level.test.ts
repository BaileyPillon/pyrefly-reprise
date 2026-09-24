// @vitest-environment jsdom
/**
 * **FFX-2 command menu levels, for the Wait split.** FFX-2 only (AGENTS.md
 * rule 14).
 *
 * `research/ffx2-combat-core.md` §1.5: under Wait, time runs while the
 * top-level command window is open and freezes the moment a submenu is
 * entered. The target cursor sits below a command (the sources are silent;
 * read as held, `docs/plans/ffx2-wait-split-review.md` §1). So the menu reports
 * `'top'` on the list and `'deep'` in a submenu or the target cursor, on every
 * transition, real key events, and the HUD and the coach wrapper pass it on.
 */

import { beforeEach, describe, expect, it } from 'vitest';
import type { AtbSnapshot, AvailableCommand, Command } from '../../src/battle/common/types.ts';
import type { MenuLevel } from '../../src/battle/ffx2/index.ts';
import type { HudPort } from '../../src/engine/HudPort.ts';
import { withCoach } from '../../src/ui/coach/CoachLayer.ts';
import { openCommandMenu } from '../../src/ui/ffx2/CommandMenu.ts';
import { FFX2BattleHud } from '../../src/ui/ffx2/FFX2BattleHud.ts';

const EMPTY: AtbSnapshot = { elapsedMs: 0, bars: [] };

const COMMANDS: AvailableCommand[] = [
  { command: { kind: 'attack', targets: [] }, label: 'Attack', category: 'attack', mpCost: 0, enabled: true, validTargets: ['bahamut', 'shuyin'] },
  { command: { kind: 'ability', id: 'firaga', targets: [] }, label: 'Firaga', category: 'blackmagic', mpCost: 12, enabled: true, validTargets: ['bahamut'] },
  { command: { kind: 'ability', id: 'blizzaga', targets: [] }, label: 'Blizzaga', category: 'blackmagic', mpCost: 14, enabled: true, validTargets: ['bahamut'] },
];

function key(code: string): void {
  window.dispatchEvent(new KeyboardEvent('keydown', { code, bubbles: true }));
}

beforeEach(() => {
  document.body.innerHTML = '';
});

describe('CommandMenu reports its level on every transition', () => {
  it('top → deep (submenu) → top (Esc) → deep (Attack → target) → top (Esc)', () => {
    const levels: MenuLevel[] = [];
    const container = document.createElement('div');
    const targetLayer = document.createElement('div');
    document.body.append(container, targetLayer);
    void openCommandMenu({
      container,
      targetLayer,
      commands: COMMANDS,
      previewRank: () => EMPTY,
      project: () => null,
      onPreview: () => {},
      actorName: 'Yuna',
      onLevel: (level) => levels.push(level),
    });
    const last = (): MenuLevel | undefined => levels.at(-1);
    expect(last()).toBe('top');

    key('ArrowDown'); // Black Magic group, still the top list
    expect(last()).toBe('top');
    key('Enter'); // into the submenu
    expect(last()).toBe('deep');
    key('Escape'); // back to the list
    expect(last()).toBe('top');
    key('ArrowUp'); // Attack
    key('Enter'); // target cursor
    expect(last()).toBe('deep');
    key('Escape'); // pendingFrom = top
    expect(last()).toBe('top');

    // Submenu → target → Esc goes back to the submenu: still deep.
    key('ArrowDown');
    key('Enter');
    key('Enter');
    expect(last()).toBe('deep');
    key('Escape');
    expect(last()).toBe('deep');
    key('Escape');
    expect(last()).toBe('top');
  });
});

describe('FFX2BattleHud passes the level to its one listener', () => {
  it('a listener hears top at open and deep in a submenu; a late listener gets the current level at once', async () => {
    const root = document.createElement('div');
    document.body.append(root);
    const hud = new FFX2BattleHud();
    hud.mount(root);
    const heard: MenuLevel[] = [];
    const off = hud.onMenuLevel((l) => heard.push(l));
    void hud.chooseCommand('yuna', COMMANDS, () => EMPTY);
    expect(heard.at(-1)).toBe('top');
    key('ArrowDown');
    key('Enter');
    expect(heard.at(-1)).toBe('deep');

    // Subscribed after the menu opened (the presenter's order): replayed.
    off();
    const late: MenuLevel[] = [];
    hud.onMenuLevel((l) => late.push(l));
    expect(late).toEqual(['deep']);
    key('Escape');
    expect(late.at(-1)).toBe('top');
    expect(heard.at(-1)).toBe('deep');
    hud.closeCommandMenu();
    hud.unmount();
  });
});

describe('the coach wrapper forwards onMenuLevel (the wrapper hole, a third time)', () => {
  it('withCoach hands the listener to the inner HUD and returns its unsubscribe', () => {
    let got: ((l: MenuLevel) => void) | null = null;
    let unsubscribed = false;
    const inner = {
      mount() {},
      unmount() {},
      sync() {},
      setVisible() {},
      setProjector() {},
      openMinigame: () => new Promise<never>(() => undefined),
      chooseCommand: () => new Promise<Command>(() => undefined),
      onEvent() {},
      onMenuLevel(l: (level: MenuLevel) => void) {
        got = l;
        return () => {
          unsubscribed = true;
        };
      },
    } as unknown as HudPort;
    const hud = withCoach('ffx2', inner);
    const heard: MenuLevel[] = [];
    const off = hud.onMenuLevel?.((l) => heard.push(l));
    expect(got).not.toBeNull();
    got!('top');
    expect(heard).toEqual(['top']);
    off?.();
    expect(unsubscribed).toBe(true);
  });
});
