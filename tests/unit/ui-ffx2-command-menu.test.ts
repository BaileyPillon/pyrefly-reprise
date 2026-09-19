// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { openCommandMenu } from '../../src/ui/ffx2/CommandMenu.ts';
import type { AtbSnapshot, AvailableCommand } from '../../src/battle/common/types.ts';

const EMPTY_SNAPSHOT: AtbSnapshot = { elapsedMs: 0, bars: [] };

function click(el: Element | null): void {
  if (!el) throw new Error('element not found');
  el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
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
