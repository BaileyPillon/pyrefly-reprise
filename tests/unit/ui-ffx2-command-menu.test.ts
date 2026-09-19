// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { openCommandMenu } from '../../src/ui/ffx2/CommandMenu.ts';
import type { AtbSnapshot, AvailableCommand } from '../../src/battle/common/types.ts';

/**
 * Resolved from the repo root, not from `import.meta.url`: under the jsdom
 * environment Vite serves the module over http, so `import.meta.url` is an
 * http URL and `readFileSync` rejects it.
 */
const HUD_CSS = join(process.cwd(), 'src', 'ui', 'ffx2', 'ffx2-hud.css');

const EMPTY_SNAPSHOT: AtbSnapshot = { elapsedMs: 0, bars: [] };

function click(el: Element | null): void {
  if (!el) throw new Error('element not found');
  el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
}

/** The menu listens on `window`, the same place a real key press lands. */
function key(code: string): void {
  window.dispatchEvent(new KeyboardEvent('keydown', { code, bubbles: true, cancelable: true }));
}

describe('FFX-2 command menu', () => {
  let container: HTMLElement;
  let targetLayer: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    targetLayer = document.createElement('div');
    document.body.append(container, targetLayer);
  });

  const commands: AvailableCommand[] = [
    { command: { kind: 'attack', targets: [] }, label: 'Attack', category: 'attack', mpCost: 0, enabled: true, validTargets: ['bahamut'] },
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
      enabled: false,
      disabledReason: 'Silenced',
      validTargets: ['bahamut'],
    },
    { command: { kind: 'spherechange', targets: [], extra: { toDressphere: 'thief', toNode: 1, gatesCrossed: [] } }, label: 'Spherechange', category: 'dressphere', mpCost: 0, enabled: true, validTargets: [] },
  ];

  it('renders single-command categories as direct top-level rows, and Change as its own', () => {
    void openCommandMenu({
      container,
      targetLayer,
      commands,
      previewRank: () => EMPTY_SNAPSHOT,
      project: () => null,
      onPreview: () => {},
      actorName: 'Yuna',
    });
    const labels = [...container.querySelectorAll('.ffx2cmd__label')].map((e) => e.textContent);
    // Attack (1 entry) shows directly; "Black Magic" (2 entries) is a group row.
    // Spherechange is "Change" — one row, whatever the engine labelled it, and a
    // submenu even at one destination (CommandMenu.ts's CHANGE_LABEL).
    expect(labels).toEqual(['Attack', 'Black Magic', 'Change']);
  });

  it('picks the outfit inside Change, by name, and resolves with the engine command', async () => {
    const promise = openCommandMenu({
      container,
      targetLayer,
      commands,
      previewRank: () => EMPTY_SNAPSHOT,
      project: () => null,
      onPreview: () => {},
      actorName: 'Yuna',
    });
    click(container.querySelector('[data-idx="2"]')); // "Change" row
    // The destination reads as its real name, never the engine's raw `thief` id
    // (critic round 02, ranked issue 26).
    const subLabels = [...container.querySelectorAll('.ffx2cmd__label')].map((e) => e.textContent);
    expect(subLabels).toEqual(['Thief']);
    click(container.querySelector('[data-idx="0"]'));
    const command = await promise;
    expect(command).toEqual({ kind: 'spherechange', targets: [], extra: { toDressphere: 'thief', toNode: 1, gatesCrossed: [] } });
  });

  it('opens a submenu, then resolves with the picked target', async () => {
    const promise = openCommandMenu({
      container,
      targetLayer,
      commands,
      previewRank: () => EMPTY_SNAPSHOT,
      project: () => null, // no projector -> reticles fall back to a clickable list
      onPreview: () => {},
      actorName: 'Yuna',
    });
    click(container.querySelector('[data-idx="1"]')); // "Black Magic" group
    const subLabels = [...container.querySelectorAll('.ffx2cmd__label')].map((e) => e.textContent);
    expect(subLabels).toEqual(['Firaga', 'Blizzaga']);

    click(container.querySelector('[data-idx="0"]')); // Firaga leaf -> opens targeting
    const reticle = targetLayer.querySelector('[data-idx="0"]');
    expect(reticle?.textContent).toContain('bahamut');
    click(reticle);

    const command = await promise;
    expect(command).toEqual({ kind: 'ability', id: 'firaga', targets: ['bahamut'] });
  });

  it('gives Change its own top-level row even when it shares a category with real dressphere abilities', () => {
    const withDresspheres: AvailableCommand[] = [
      commands[0]!, // attack
      { command: { kind: 'ability', id: 'gunplay', targets: [] }, label: 'Gunplay', category: 'dressphere', mpCost: 4, enabled: true, validTargets: ['bahamut'] },
      { command: { kind: 'ability', id: 'aim-shot', targets: [] }, label: 'Aim & Fire', category: 'dressphere', mpCost: 3, enabled: true, validTargets: ['bahamut'] },
      { command: { kind: 'spherechange', targets: [], extra: { toDressphere: 'thief', toNode: 1, gatesCrossed: [] } }, label: 'Spherechange', category: 'dressphere', mpCost: 0, enabled: true, validTargets: [] },
    ];
    openCommandMenu({
      container,
      targetLayer,
      commands: withDresspheres,
      previewRank: () => EMPTY_SNAPSHOT,
      project: () => null,
      onPreview: () => {},
      actorName: 'Yuna',
    });
    const rows = [...container.querySelectorAll('.ig-cmd')];
    const labels = rows.map((r) => r.querySelector('.ffx2cmd__label')?.textContent);
    // "Dressphere" (Gunplay + Aim & Fire, a real submenu) stays one row; the
    // spherechange is pulled out as its own "Change" row.
    expect(labels).toEqual(['Attack', 'Dressphere', 'Change']);
    const sphereRow = rows[2]!;
    expect(sphereRow.className).toContain('ig-cmd--overdrive');
  });

  it('names every reachable outfit and prints the gate it crosses', () => {
    const twoWays: AvailableCommand[] = [
      commands[0]!,
      { command: { kind: 'spherechange', targets: [], extra: { toDressphere: 'gunner', toNode: 1, gatesCrossed: [] } }, label: 'gunner', category: 'dressphere', mpCost: 0, enabled: true, validTargets: [] },
      { command: { kind: 'spherechange', targets: [], extra: { toDressphere: 'black-mage', toNode: 3, gatesCrossed: ['red', 'green'] } }, label: 'black-mage', category: 'dressphere', mpCost: 0, enabled: true, validTargets: [] },
    ];
    void openCommandMenu({
      container,
      targetLayer,
      commands: twoWays,
      previewRank: () => EMPTY_SNAPSHOT,
      project: () => null,
      onPreview: () => {},
      actorName: 'Yuna',
    });
    // Two destinations, one row.
    expect([...container.querySelectorAll('.ffx2cmd__label')].map((e) => e.textContent)).toEqual(['Attack', 'Change']);
    click(container.querySelector('[data-idx="1"]'));
    expect([...container.querySelectorAll('.ffx2cmd__label')].map((e) => e.textContent)).toEqual(['Gunner', 'Black Mage']);
    // §4.5.4's gate-preview line, on the row that crosses a gate and only there.
    const grants = [...container.querySelectorAll('.ig-cmd')].map((r) => r.querySelector('.ffx2cmd__grants')?.textContent ?? null);
    expect(grants).toEqual([null, 'GRANTS: Red + Green']);
  });

  it('will not open Change when every destination is sealed (Curse)', () => {
    const cursed: AvailableCommand[] = [
      commands[0]!,
      { command: { kind: 'spherechange', targets: [], extra: { toDressphere: 'thief', toNode: 1, gatesCrossed: [] } }, label: 'thief', category: 'dressphere', mpCost: 0, enabled: false, disabledReason: 'Cursed', validTargets: [] },
    ];
    void openCommandMenu({
      container,
      targetLayer,
      commands: cursed,
      previewRank: () => EMPTY_SNAPSHOT,
      project: () => null,
      onPreview: () => {},
      actorName: 'Yuna',
    });
    const changeRow = container.querySelector('[data-idx="1"]')!;
    expect(changeRow.className).toContain('ig-cmd--disabled');
    expect(changeRow.textContent).toContain('Cursed');
    click(changeRow);
    // Still the top level: Curse disables the Garment Grid outright
    // (`ffx2-combat-core.md` §Curse), so the submenu never opens.
    expect([...container.querySelectorAll('.ffx2cmd__label')].map((e) => e.textContent)).toEqual(['Attack', 'Change']);
  });

  // ------------------------------------------------- cancelling out of target

  /**
   * Critic pass 1, finding 2. Every cancel in the `target` view went to
   * `renderSub(subCategory)`, whether or not the pending command had come
   * through a submenu — and `subItems`/`subCategory` still held whatever
   * submenu was opened last. Driven live in chapter 4: open Change, Esc, pick
   * Attack, Esc, Enter, and the engine logged
   * `{"type":"spherechange","who":"paine","from":"warrior","to":"gunner"}` —
   * the player pressed Attack and spent Paine's whole turn on a spherechange.
   */
  describe('cancelling out of target selection', () => {
    const menu = (cmds: AvailableCommand[] = commands): Promise<unknown> =>
      openCommandMenu({
        container,
        targetLayer,
        commands: cmds,
        previewRank: () => EMPTY_SNAPSHOT,
        project: () => null,
        onPreview: () => {},
        actorName: 'Paine',
      });

    const labels = (): (string | null)[] => [...container.querySelectorAll('.ffx2cmd__label')].map((e) => e.textContent);

    it('goes back to the top rows after a top-level leaf, not to the last submenu', async () => {
      const promise = menu();
      // Open Change, back out of it — the stale `subItems`/`subCategory` the
      // bug fed on.
      click(container.querySelector('[data-idx="2"]'));
      expect(labels()).toEqual(['Thief']);
      key('Escape');
      expect(labels()).toEqual(['Attack', 'Black Magic', 'Change']);

      // Attack is a top-level leaf: cancelling its targeting belongs at the top.
      click(container.querySelector('[data-idx="0"]'));
      expect(targetLayer.querySelector('[data-idx="0"]')).not.toBeNull();
      key('Escape');

      expect(labels()).toEqual(['Attack', 'Black Magic', 'Change']);
      expect(container.querySelector('.ffx2cmd__title')).toBeNull();
      // Two mutually exclusive states at once is what made this visible: the
      // reticle stayed drawn on the boss over the redrawn command window.
      expect(targetLayer.innerHTML).toBe('');

      // And the next confirm commits what the player actually chose.
      key('Enter');
      expect(targetLayer.querySelector('[data-idx="0"]')).not.toBeNull();
      key('Enter');
      await expect(promise).resolves.toEqual({ kind: 'attack', targets: ['bahamut'] });
    });

    it('leaves a usable command window when no submenu was ever opened', () => {
      void menu();
      click(container.querySelector('[data-idx="0"]')); // Attack, straight to targeting
      key('Escape');
      // The old cancel drew an empty window — `stack=0, rows=[], title=""` —
      // in which ArrowDown/ArrowUp/Enter all fell out of `if (!list) return`
      // and only a second Esc recovered.
      expect(labels()).toEqual(['Attack', 'Black Magic', 'Change']);
      expect(container.querySelectorAll('.ig-cmd')).toHaveLength(3);
      key('ArrowDown');
      expect(container.querySelector('.ig-cmd--selected')?.getAttribute('data-idx')).toBe('1');
    });

    it('goes back to the submenu the command was picked from', async () => {
      const promise = menu();
      click(container.querySelector('[data-idx="1"]')); // Black Magic
      click(container.querySelector('[data-idx="0"]')); // Firaga -> targeting
      key('Escape');
      // Back in Black Magic, where Firaga was picked — with the reticles gone.
      expect(container.querySelector('.ffx2cmd__title')?.textContent).toBe('Black Magic');
      expect(labels()).toEqual(['Firaga', 'Blizzaga']);
      expect(targetLayer.innerHTML).toBe('');
      key('Enter');
      key('Enter');
      await expect(promise).resolves.toEqual({ kind: 'ability', id: 'firaga', targets: ['bahamut'] });
    });

    it('steps target -> top -> out in two presses, from a top-level leaf', () => {
      void menu();
      click(container.querySelector('[data-idx="0"]'));
      key('Escape'); // target -> top
      expect(labels()).toEqual(['Attack', 'Black Magic', 'Change']);
      key('Escape'); // top: nothing left to step back to, the menu stays put
      expect(labels()).toEqual(['Attack', 'Black Magic', 'Change']);
      expect(targetLayer.innerHTML).toBe('');
    });
  });

  /**
   * Critic pass 1, finding 3: `.ffx2cmd__grants` was `flex: none` inside a
   * fixed 129.78 px row, so the *label* shrank and "Black Mage" rendered as
   * "BL..." while `textContent` still read "Black Mage" — which is why the
   * round's own DOM evidence said the names were fine.
   */
  it('marks a gated row so its outfit name is not the thing that shrinks', () => {
    const twoWays: AvailableCommand[] = [
      commands[0]!,
      { command: { kind: 'spherechange', targets: [], extra: { toDressphere: 'gunner', toNode: 1, gatesCrossed: ['red'] } }, label: 'gunner', category: 'dressphere', mpCost: 0, enabled: true, validTargets: [] },
      { command: { kind: 'spherechange', targets: [], extra: { toDressphere: 'black-mage', toNode: 3, gatesCrossed: [] } }, label: 'black-mage', category: 'dressphere', mpCost: 0, enabled: true, validTargets: [] },
    ];
    void openCommandMenu({
      container,
      targetLayer,
      commands: twoWays,
      previewRank: () => EMPTY_SNAPSHOT,
      project: () => null,
      onPreview: () => {},
      actorName: 'Yuna',
    });
    click(container.querySelector('[data-idx="1"]'));
    const rows = [...container.querySelectorAll('.ig-cmd')];
    // The marker goes on the row that actually carries a gate line, and only
    // there — an ungated row has the width to itself and keeps the tight
    // single-line box.
    expect(rows[0]!.className).toContain('ffx2cmd--gate');
    expect(rows[1]!.className).not.toContain('ffx2cmd--gate');

    const css = readFileSync(HUD_CSS, 'utf8');
    // The label stops being clipped on a gate row...
    expect(css).toMatch(/\.ffx2hud \.ig-cmd\.ffx2cmd--gate \.ffx2cmd__label \{[^}]*overflow: visible/);
    // ...because the gate line takes a line of its own instead of competing
    // for the same one.
    expect(css).toMatch(/\.ffx2hud \.ig-cmd\.ffx2cmd--gate \.ffx2cmd__grants \{[^}]*flex: 1 0 100%/);
    expect(css).toMatch(/\.ffx2hud \.ig-cmd\.ffx2cmd--gate \{[^}]*flex-wrap: wrap/);
  });

  it('calls previewRank with the highlighted command on every render', () => {
    const seen: Array<AvailableCommand | null> = [];
    openCommandMenu({
      container,
      targetLayer,
      commands,
      previewRank: (cmd) => {
        seen.push(cmd);
        return EMPTY_SNAPSHOT;
      },
      project: () => null,
      onPreview: () => {},
      actorName: 'Yuna',
    });
    // Initial render highlights row 0 (Attack), a concrete leaf command.
    expect(seen[0]?.label).toBe('Attack');
  });
});
