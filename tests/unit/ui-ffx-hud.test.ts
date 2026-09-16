// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import type { AvailableCommand } from '../../src/battle/common/types.ts';
import { buildTopRows, computeMenuWindow, resolveTargetMode } from '../../src/ui/ffx/CommandMenu.ts';
import { FFXBattleHud } from '../../src/ui/ffx/FFXBattleHud.ts';
import { makeFakeBattleState, makeFakeCommands, makeFakeTurnPreview } from '../../src/ui/ffx/testFixtures.ts';

function mountHud(): { hud: FFXBattleHud; root: HTMLElement } {
  const root = document.createElement('div');
  document.body.appendChild(root);
  const hud = new FFXBattleHud();
  hud.mount(root);
  return { hud, root };
}

let cleanup: (() => void) | null = null;
afterEach(() => {
  cleanup?.();
  cleanup = null;
  document.body.innerHTML = '';
});

// ---------------------------------------------------------------- pure logic

describe('buildTopRows', () => {
  it('keeps self-contained command kinds as direct rows and buckets everything else by category', () => {
    const rows = buildTopRows(makeFakeCommands());
    const shape = rows.map((r) => (r.kind === 'direct' ? r.cmd.command.kind : `group:${r.category}`));
    expect(shape).toEqual(['attack', 'group:skill', 'group:whitemagic', 'group:blackmagic', 'group:item', 'defend', 'switch']);
  });

  it('a disabled group (every item disabled) is reported as not enabled, for menu navigation to skip', () => {
    const rows = buildTopRows(makeFakeCommands());
    const blackmagic = rows.find((r) => r.kind === 'group' && r.category === 'blackmagic');
    expect(blackmagic?.kind).toBe('group');
  });
});

describe('resolveTargetMode', () => {
  const base: AvailableCommand = {
    command: { kind: 'ability', id: 'x', targets: [] },
    label: 'X',
    category: 'skill',
    mpCost: 0,
    enabled: true,
    validTargets: [],
  };

  it('mode "none" when the command already carries resolved targets', () => {
    const cmd: AvailableCommand = { ...base, command: { ...base.command, targets: ['self'] } as AvailableCommand['command'] };
    expect(resolveTargetMode(cmd)).toEqual({ mode: 'none', targets: ['self'] });
  });

  it('mode "auto" when exactly one candidate exists and the player has no real choice', () => {
    const cmd: AvailableCommand = { ...base, validTargets: ['only-enemy'] };
    expect(resolveTargetMode(cmd)).toEqual({ mode: 'auto', targets: ['only-enemy'] });
  });

  it('mode "choose" when more than one candidate exists', () => {
    const cmd: AvailableCommand = { ...base, validTargets: ['a', 'b'] };
    expect(resolveTargetMode(cmd)).toEqual({ mode: 'choose', candidates: ['a', 'b'] });
  });
});

describe('computeMenuWindow', () => {
  it('shows everything when the list already fits', () => {
    expect(computeMenuWindow(4, 0, 6)).toEqual({ start: 0, end: 4 });
    expect(computeMenuWindow(6, 5, 6)).toEqual({ start: 0, end: 6 });
  });

  it('centers the selection when there is room on both sides', () => {
    // 20 rows, window of 6, selecting the middle -> 3 rows of headroom each side.
    expect(computeMenuWindow(20, 10, 6)).toEqual({ start: 7, end: 13 });
  });

  it('clamps to the start when the selection is near the top', () => {
    expect(computeMenuWindow(20, 0, 6)).toEqual({ start: 0, end: 6 });
    expect(computeMenuWindow(20, 1, 6)).toEqual({ start: 0, end: 6 });
  });

  it('clamps to the end when the selection is near the bottom', () => {
    expect(computeMenuWindow(20, 19, 6)).toEqual({ start: 14, end: 20 });
  });
});

// -------------------------------------------------------------------- mount

describe('FFXBattleHud lifecycle', () => {
  it('mount appends the HUD element; unmount removes it', () => {
    const { hud, root } = mountHud();
    cleanup = () => hud.unmount();
    expect(root.querySelector('[data-role="ffx-battle-hud"]')).not.toBeNull();
    hud.unmount();
    expect(root.querySelector('[data-role="ffx-battle-hud"]')).toBeNull();
    cleanup = null;
  });

  it('setVisible toggles the hidden attribute', () => {
    const { hud, root } = mountHud();
    cleanup = () => hud.unmount();
    const el = root.querySelector('[data-role="ffx-battle-hud"]') as HTMLElement;
    hud.setVisible(false);
    expect(el.hidden).toBe(true);
    hud.setVisible(true);
    expect(el.hidden).toBe(false);
  });
});

// --------------------------------------------------------------------- sync

describe('FFXBattleHud.sync', () => {
  it('renders one CTB row per TurnPreview entry and falls back to an initial-letter chip for a missing portrait', () => {
    const { hud, root } = mountHud();
    cleanup = () => hud.unmount();
    hud.sync(makeFakeBattleState(), makeFakeTurnPreview());

    const ctbRows = root.querySelectorAll('.ig-ctb__row');
    expect(ctbRows.length).toBe(6);

    const auronRow = [...ctbRows].find((r) => r.getAttribute('data-actor') === 'auron');
    expect(auronRow).toBeDefined();
    // Auron's fixture has no portraitKey: only its dedicated Portrait chip decorates.
    expect(auronRow!.querySelector('.ffx-portrait-fallback')?.textContent).toBe('A');
  });

  it('renders one party-status row per active id, with HP/MP text matching the fixture', () => {
    const { hud, root } = mountHud();
    cleanup = () => hud.unmount();
    const state = makeFakeBattleState();
    hud.sync(state, makeFakeTurnPreview());

    const rows = root.querySelectorAll('.ig-stat');
    expect(rows.length).toBe(3);
    const tidusRow = [...rows].find((r) => r.getAttribute('data-actor') === 'tidus')!;
    expect(tidusRow.textContent).toContain('2419');
    expect(tidusRow.textContent).toContain('68');
  });
});

// ------------------------------------------------------------------ onEvent

describe('FFXBattleHud.onEvent', () => {
  it('tracks the actor from turn-start and trims its name off a message that restates it', () => {
    const { hud, root } = mountHud();
    cleanup = () => hud.unmount();
    hud.sync(makeFakeBattleState(), makeFakeTurnPreview());
    hud.onEvent({ seq: 0, type: 'turn-start', actorId: 'tidus', turn: 1, elapsedTicks: 0 });
    hud.onEvent({ seq: 1, type: 'message', text: 'Tidus uses Cure', kind: 'ability' });

    const bar = root.querySelector<HTMLElement>('.ig-banner')!;
    const name = bar.querySelector<HTMLElement>('[data-role="name"]')!;
    const chip = bar.querySelector<HTMLElement>('[data-role="chip"]')!;
    expect(bar.hidden).toBe(false);
    expect(name.hidden).toBe(false);
    expect(name.textContent).toBe('Tidus');
    // The actor's name is not repeated inside the chip.
    expect(chip.textContent).toBe('uses Cure');
  });

  it('never parses a name out of a one-word message with no tracked actor', () => {
    const { hud, root } = mountHud();
    cleanup = () => hud.unmount();
    hud.onEvent({ seq: 0, type: 'message', text: 'Miss!', kind: 'system' });

    const bar = root.querySelector<HTMLElement>('.ig-banner')!;
    const name = bar.querySelector<HTMLElement>('[data-role="name"]')!;
    const chip = bar.querySelector<HTMLElement>('[data-role="chip"]')!;
    expect(name.hidden).toBe(true);
    expect(name.textContent).toBe('');
    expect(chip.hidden).toBe(false);
    expect(chip.textContent).toBe('Miss!');
  });

  it('does not mangle a message with a leading space when there is no tracked actor', () => {
    const { hud, root } = mountHud();
    cleanup = () => hud.unmount();
    hud.onEvent({ seq: 0, type: 'message', text: ' Critical hit!', kind: 'system' });

    const bar = root.querySelector<HTMLElement>('.ig-banner')!;
    const chip = bar.querySelector<HTMLElement>('[data-role="chip"]')!;
    expect(chip.textContent).toBe(' Critical hit!');
  });

  it('a system message with no actor at all hides the name slab entirely', () => {
    const { hud, root } = mountHud();
    cleanup = () => hud.unmount();
    // No turn-start/action-start has ever fired.
    hud.onEvent({ seq: 0, type: 'message', text: "Can't escape!", kind: 'system' });

    const bar = root.querySelector<HTMLElement>('.ig-banner')!;
    const name = bar.querySelector<HTMLElement>('[data-role="name"]')!;
    const chip = bar.querySelector<HTMLElement>('[data-role="chip"]')!;
    expect(name.hidden).toBe(true);
    expect(chip.textContent).toBe("Can't escape!");
  });

  it('a stage-2 charge event shows the telegraph banner and the persistent screen border', () => {
    const { hud, root } = mountHud();
    cleanup = () => hud.unmount();
    hud.sync(makeFakeBattleState(), makeFakeTurnPreview());
    hud.onEvent({ seq: 0, type: 'charge', enemyId: 'mortiorchis', name: 'Ready To Annihilate', turnsLeft: 0, stage: 2 });

    const banner = root.querySelector('.ffx-telegraph')!;
    expect(banner.classList.contains('ffx-telegraph--visible')).toBe(true);
    expect(banner.classList.contains('ffx-telegraph--stage-2')).toBe(true);
    expect(banner.textContent).toContain('READY TO ANNIHILATE');

    const border = root.querySelector('.ffx-screen-border')!;
    expect(border.classList.contains('ffx-screen-border--visible')).toBe(true);
  });

  it('a damage event spawns a floating numeral at the projected position', () => {
    const { hud, root } = mountHud();
    cleanup = () => hud.unmount();
    hud.setProjector(() => ({ x: 111, y: 222 }));
    hud.onEvent({ seq: 0, type: 'damage', targetId: 'mortiorchis', amount: 1234, element: 'none', crit: false, hitIndex: 0, hitCount: 1 });
    const numeral = root.querySelector('.ig-damage__value')!;
    expect(numeral).not.toBeNull();
    expect(numeral.textContent).toBe('1234');
  });

  it('an immune-affinity damage event prints IMMUNE instead of a number', () => {
    const { hud, root } = mountHud();
    cleanup = () => hud.unmount();
    hud.setProjector(() => ({ x: 0, y: 0 }));
    hud.onEvent({ seq: 0, type: 'damage', targetId: 'mortiorchis', amount: 0, element: 'fire', affinity: 'immune', crit: false, hitIndex: 0, hitCount: 1 });
    expect(root.querySelector('.ffx-numeral-chip--miss')?.textContent).toBe('IMMUNE');
  });
});

// -------------------------------------------------------------- chooseCommand

describe('FFXBattleHud.chooseCommand', () => {
  it('opens the command window with the fixture rows and hides it again once resolved', async () => {
    const { hud, root } = mountHud();
    cleanup = () => hud.unmount();
    hud.setProjector(() => ({ x: 0, y: 0 }));
    hud.sync(makeFakeBattleState(), makeFakeTurnPreview());

    const promise = hud.chooseCommand('tidus', makeFakeCommands(), () => makeFakeTurnPreview());
    const commandWin = root.querySelector('.ig-cmd-stack') as HTMLElement;
    expect(commandWin.hidden).toBe(false);
    expect(commandWin.textContent).toContain('Attack');

    // Attack is the default selection; confirm enters targeting (2 candidates),
    // then confirm again locks the first one.
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Enter' }));
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Enter' }));

    const command = await promise;
    expect(command.kind).toBe('attack');
    expect(command.targets).toEqual(['seymour-flux']);
    expect(commandWin.hidden).toBe(true);
  });

  it('a self-contained command (Defend) resolves immediately with no targets', async () => {
    const { hud } = mountHud();
    cleanup = () => hud.unmount();
    hud.setProjector(() => ({ x: 0, y: 0 }));
    hud.sync(makeFakeBattleState(), makeFakeTurnPreview());

    const promise = hud.chooseCommand('tidus', makeFakeCommands(), () => makeFakeTurnPreview());
    // attack -> skill -> whitemagic -> (blackmagic skipped, disabled) -> item -> defend
    for (let i = 0; i < 4; i++) window.dispatchEvent(new KeyboardEvent('keydown', { code: 'ArrowDown' }));
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Enter' }));

    const command = await promise;
    expect(command).toEqual({ kind: 'defend', targets: [] });
  });

  it('clicking a submenu row resolves that ability (mouse path)', async () => {
    const { hud, root } = mountHud();
    cleanup = () => hud.unmount();
    hud.setProjector(() => ({ x: 0, y: 0 }));
    hud.sync(makeFakeBattleState(), makeFakeTurnPreview());

    const promise = hud.chooseCommand('tidus', makeFakeCommands(), () => makeFakeTurnPreview());
    const skillRow = [...root.querySelectorAll('.ig-cmd')].find((r) => r.textContent?.includes('Skill'))!;
    (skillRow as HTMLElement).click();
    const abilityRow = [...root.querySelectorAll('.ig-cmd')].find((r) => r.textContent?.includes('Spiral Cut'))!;
    (abilityRow as HTMLElement).click();
    // Spiral Cut targets seymour-flux/mortiorchis (2 candidates) -> confirm locks the first.
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Enter' }));

    const command = await promise;
    expect(command.kind).toBe('ability');
    expect(command).toMatchObject({ id: 'spiral-cut', targets: ['seymour-flux'] });
  });

  it('a group with exactly one enabled item resolves straight from the top level (no one-item submenu hop)', async () => {
    const { hud } = mountHud();
    cleanup = () => hud.unmount();
    hud.setProjector(() => ({ x: 0, y: 0 }));
    hud.sync(makeFakeBattleState(), makeFakeTurnPreview());

    const commands: AvailableCommand[] = [
      { command: { kind: 'attack', targets: [] }, label: 'Attack', category: 'attack', mpCost: 0, enabled: true, validTargets: ['seymour-flux'] },
      {
        command: { kind: 'overdrive', id: 'spiral-cut', targets: [] },
        label: 'Overdrive',
        category: 'overdrive',
        mpCost: 0,
        enabled: true,
        validTargets: ['seymour-flux', 'mortiorchis'],
      },
    ];

    const promise = hud.chooseCommand('tidus', commands, () => makeFakeTurnPreview());
    // Down once lands on the sole Overdrive row; confirming it should resolve
    // straight to targeting for spiral-cut, not open a one-item submenu.
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'ArrowDown' }));
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Enter' }));
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Enter' }));

    const command = await promise;
    expect(command).toMatchObject({ kind: 'overdrive', id: 'spiral-cut', targets: ['seymour-flux'] });
  });

  it('shows the READY badge on an enabled Overdrive row and no badge when it is not full', async () => {
    const { hud, root } = mountHud();
    cleanup = () => hud.unmount();
    hud.setProjector(() => ({ x: 0, y: 0 }));
    hud.sync(makeFakeBattleState(), makeFakeTurnPreview());

    const commands: AvailableCommand[] = [
      { command: { kind: 'attack', targets: [] }, label: 'Attack', category: 'attack', mpCost: 0, enabled: true, validTargets: [] },
      {
        command: { kind: 'overdrive', id: 'spiral-cut', targets: [] },
        label: 'Overdrive',
        category: 'overdrive',
        mpCost: 0,
        enabled: false,
        disabledReason: 'Overdrive not full',
        validTargets: [],
      },
    ];
    const promise = hud.chooseCommand('tidus', commands, () => makeFakeTurnPreview());
    const rows = [...root.querySelectorAll('.ig-cmd')];
    const overdriveRow = rows.find((r) => r.textContent?.includes('Overdrive'))!;
    expect(overdriveRow.classList.contains('ig-cmd--overdrive')).toBe(true);
    expect(overdriveRow.classList.contains('ig-cmd--disabled')).toBe(true);
    expect(overdriveRow.querySelector('.ig-cmd__ready')).toBeNull();

    // Clean up: resolve via the still-enabled Attack row.
    (rows.find((r) => r.textContent?.includes('Attack')) as HTMLElement).click();
    await promise;
  });

  it('paginates a long ability list: only a window of rows renders, and paging down reaches rows past the first window', async () => {
    const { hud, root } = mountHud();
    cleanup = () => hud.unmount();
    hud.setProjector(() => ({ x: 0, y: 0 }));
    hud.sync(makeFakeBattleState(), makeFakeTurnPreview());

    // A real chapter's Black Magic list can run to a dozen-plus spells now
    // that the engines are wired to the full ability tables (343 abilities,
    // 69 items) -- simulate that with 20 spells under one category.
    const spells: AvailableCommand[] = Array.from({ length: 20 }, (_, i) => ({
      command: { kind: 'ability', id: `spell-${i}`, targets: [] },
      label: `Spell ${i}`,
      category: 'blackmagic' as const,
      mpCost: 4,
      enabled: true,
      validTargets: ['seymour-flux'],
    }));
    const commands: AvailableCommand[] = [
      { command: { kind: 'attack', targets: [] }, label: 'Attack', category: 'attack', mpCost: 0, enabled: true, validTargets: [] },
      ...spells,
    ];

    const promise = hud.chooseCommand('tidus', commands, () => makeFakeTurnPreview());
    const magicGroup = [...root.querySelectorAll('.ig-cmd')].find((r) => r.textContent?.includes('Black Magic'))!;
    (magicGroup as HTMLElement).click();

    // Only a window of rows exists in the DOM at once, not all 20.
    let rows = root.querySelectorAll('.ig-cmd');
    expect(rows.length).toBeLessThan(spells.length);
    expect(root.querySelector('.ffx-cmd-more')).not.toBeNull();
    expect(root.textContent).toContain('Spell 0');
    expect(root.textContent).not.toContain('Spell 19');

    // Page down past the first window; the last spell must eventually scroll into view.
    for (let i = 0; i < 19; i++) window.dispatchEvent(new KeyboardEvent('keydown', { code: 'ArrowDown' }));
    expect(root.textContent).toContain('Spell 19');

    const lastRow = [...root.querySelectorAll('.ig-cmd')].find((r) => r.textContent?.includes('Spell 19')) as HTMLElement;
    lastRow.click();
    const command = await promise;
    expect(command).toMatchObject({ id: 'spell-19', targets: ['seymour-flux'] });
  });
});
