// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import type { AvailableCommand } from '../../src/battle/common/types.ts';
import { buildTopRows, computeMenuWindow, resolveTargetMode } from '../../src/ui/ffx/CommandMenu.ts';
import { FFXBattleHud } from '../../src/ui/ffx/FFXBattleHud.ts';
import { makeFakeBattleState, makeFakeCommands, makeFakeTurnPreview } from '../../src/ui/ffx/testFixtures.ts';

/** The x/y of the second `translate(...)` in a numeral's transform, in px. */
function readTranslate(transform: string): [number, number] {
  const all = [...transform.matchAll(/translate\((-?[\d.]+)px,\s*(-?[\d.]+)px\)/g)];
  const last = all[all.length - 1];
  return last ? [Number(last[1]), Number(last[2])] : [NaN, NaN];
}

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
    const shape = rows.map((r) => (r.kind === 'direct' ? r.cmd.command.kind : `group:${r.role ?? r.category}`));
    expect(shape).toEqual(['attack', 'group:skill', 'group:whitemagic', 'group:blackmagic', 'group:item', 'group:switch']);
  });

  it('never lists Defend: FFX reaches it as a base action, not as a row in the command window', () => {
    const rows = buildTopRows(makeFakeCommands());
    const everyCommand = rows.flatMap((r) => (r.kind === 'direct' ? [r.cmd] : r.items));
    expect(everyCommand.some((c) => c.command.kind === 'defend')).toBe(false);
  });

  it('collapses one switch command per benched member into a single Switch group, last in the list', () => {
    const rows = buildTopRows([
      ...makeFakeCommands(),
      { command: { kind: 'switch', targets: [], extra: { outId: 'tidus', inId: 'lulu' } }, label: 'Lulu', category: 'special', mpCost: 0, enabled: true, validTargets: [] },
    ]);
    const last = rows[rows.length - 1]!;
    expect(last.kind).toBe('group');
    expect(last.kind === 'group' && last.role).toBe('switch');
    expect(last.kind === 'group' && last.items.length).toBe(2);
    expect(rows.filter((r) => r.kind === 'group' && r.role === 'switch').length).toBe(1);
  });

  it('orders the top level the way FFX does, whatever order the engine emitted', () => {
    const cmd = (kind: string, category: string, label: string): AvailableCommand =>
      ({ command: { kind, id: label, targets: [] }, label, category, mpCost: 0, enabled: true, validTargets: [] }) as unknown as AvailableCommand;
    const rows = buildTopRows([
      cmd('ability', 'item', 'Potion'),
      cmd('ability', 'summon', 'Valefor'),
      cmd('ability', 'blackmagic', 'Fire'),
      cmd('attack', 'attack', 'Attack'),
      cmd('ability', 'whitemagic', 'Cure'),
      cmd('ability', 'skill', 'Quick Hit'),
    ]);
    expect(rows.map((r) => (r.kind === 'direct' ? r.cmd.label : r.label))).toEqual([
      'Attack',
      'Skill',
      'White Magic',
      'Black Magic',
      'Items',
      'Summon',
    ]);
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

  it('a damage event spawns a floating numeral tracking the struck target', () => {
    const { hud, root } = mountHud();
    cleanup = () => hud.unmount();
    const asked: Array<string | undefined> = [];
    hud.setProjector((_id, anchor) => {
      asked.push(anchor);
      return { x: 111, y: 222 };
    });
    hud.onEvent({ seq: 0, type: 'damage', targetId: 'mortiorchis', amount: 1234, element: 'none', crit: false, hitIndex: 0, hitCount: 1 });
    const numeral = root.querySelector('.ffx-numerals-layer .dnum')!;
    expect(numeral).not.toBeNull();
    expect(numeral.textContent).toBe('1234');

    // The numeral re-projects every frame, and asks for the chest rather than
    // the head so it reads as belonging to the figure it hit.
    hud.update(0.016);
    expect(asked).toContain('chest');
    const [x, y] = readTranslate((numeral as HTMLElement).style.transform);
    // Within a jitter/bounce of the projected point, not parked at the origin.
    expect(Math.abs(x - 111)).toBeLessThan(24);
    expect(Math.abs(y - 222)).toBeLessThan(24);
  });

  it('marks a critical hit with its own variant class', () => {
    const { hud, root } = mountHud();
    cleanup = () => hud.unmount();
    hud.setProjector(() => ({ x: 10, y: 10 }));
    hud.onEvent({ seq: 0, type: 'damage', targetId: 'mortiorchis', amount: 4321, element: 'none', crit: true, hitIndex: 0, hitCount: 1 });
    expect(root.querySelector('.dnum--critical')?.textContent).toBe('4321');
  });

  it('stacks a multi-hit ladder, one numeral per hit', () => {
    const { hud, root } = mountHud();
    cleanup = () => hud.unmount();
    hud.setProjector(() => ({ x: 10, y: 10 }));
    for (let i = 0; i < 3; i++) {
      hud.onEvent({ seq: i, type: 'damage', targetId: 'mortiorchis', amount: 100 + i, element: 'none', crit: false, hitIndex: i, hitCount: 3 });
    }
    expect(root.querySelectorAll('.dnum')).toHaveLength(3);
  });

  it('steps two hits on the same target clear of each other instead of printing through', () => {
    const { hud, root } = mountHud();
    cleanup = () => hud.unmount();
    hud.setProjector(() => ({ x: 400, y: 300 }));
    // Two unrelated events landing on one actor in the same beat — a hit and
    // the MISS that chases it, which used to overlap (47-boss-attack.png).
    hud.onEvent({ seq: 0, type: 'damage', targetId: 'mortiorchis', amount: 11500, element: 'none', crit: false, hitIndex: 0, hitCount: 1 });
    hud.onEvent({ seq: 1, type: 'miss', targetId: 'mortiorchis', sourceId: 'tidus', reason: 'evaded' });
    // Round 2: the second event on a target is held back by one stagger
    // (`damageLadder.nextBurstSlot`), so it has not been placed yet on the
    // frame after it arrives. Run far enough in for both to be drawing.
    for (let i = 0; i < 6; i++) hud.update(0.016);

    const ys = [...root.querySelectorAll<HTMLElement>('.dnum')].map(
      (el) => readTranslate(el.style.transform)[1],
    );
    expect(ys).toHaveLength(2);
    expect(ys.every((y) => Number.isFinite(y))).toBe(true);
    // A whole glyph height apart, and the later one is the higher rung.
    expect(Math.abs(ys[0]! - ys[1]!)).toBeGreaterThan(14);
    expect(ys[1]!).toBeLessThan(ys[0]!);
  });

  it('an immune-affinity damage event prints IMMUNE instead of a number', () => {
    const { hud, root } = mountHud();
    cleanup = () => hud.unmount();
    hud.setProjector(() => ({ x: 0, y: 0 }));
    hud.onEvent({ seq: 0, type: 'damage', targetId: 'mortiorchis', amount: 0, element: 'fire', affinity: 'immune', crit: false, hitIndex: 0, hitCount: 1 });
    expect(root.querySelector('.dnum--immune')?.textContent).toBe('IMMUNE');
  });

  it('a miss prints MISS', () => {
    const { hud, root } = mountHud();
    cleanup = () => hud.unmount();
    hud.setProjector(() => ({ x: 0, y: 0 }));
    hud.onEvent({ seq: 0, type: 'miss', targetId: 'mortiorchis', sourceId: 'tidus', reason: 'evaded' });
    expect(root.querySelector('.dnum--miss')?.textContent).toBe('MISS');
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

  it('the Switch row opens the reserve list even with one member benched, and resolves that swap', async () => {
    const { hud, root } = mountHud();
    cleanup = () => hud.unmount();
    hud.setProjector(() => ({ x: 0, y: 0 }));
    hud.sync(makeFakeBattleState(), makeFakeTurnPreview());

    const promise = hud.chooseCommand('tidus', makeFakeCommands(), () => makeFakeTurnPreview());
    // attack -> skill -> whitemagic -> (blackmagic skipped, disabled) -> items -> switch
    for (let i = 0; i < 4; i++) window.dispatchEvent(new KeyboardEvent('keydown', { code: 'ArrowDown' }));
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Enter' }));

    // A one-entry group normally resolves straight away; the reserve list is
    // the exception, because a swap has to show who is coming in.
    expect(root.querySelector<HTMLElement>('.ffx-cmd-breadcrumb')?.hidden).toBe(false);
    expect(root.querySelector('.ffx-cmd__face')).not.toBeNull();

    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Enter' }));
    const command = await promise;
    expect(command).toMatchObject({ kind: 'switch', targets: [], extra: { outId: 'tidus', inId: 'wakka' } });
  });

  it('L1 jumps straight to the reserve list from the top level', async () => {
    const { hud, root } = mountHud();
    cleanup = () => hud.unmount();
    hud.setProjector(() => ({ x: 0, y: 0 }));
    hud.sync(makeFakeBattleState(), makeFakeTurnPreview());

    const promise = hud.chooseCommand('tidus', makeFakeCommands(), () => makeFakeTurnPreview());
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyF' }));
    expect(root.querySelector<HTMLElement>('.ffx-cmd-breadcrumb')?.textContent).toBe('Switch');

    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Enter' }));
    const command = await promise;
    expect(command).toMatchObject({ kind: 'switch' });
  });

  it('an action-start takes an abandoned menu (and its help line) off screen, and any key brings it back', async () => {
    const { hud, root } = mountHud();
    cleanup = () => hud.unmount();
    hud.setProjector(() => ({ x: 0, y: 0 }));
    hud.sync(makeFakeBattleState(), makeFakeTurnPreview());

    const promise = hud.chooseCommand('tidus', makeFakeCommands(), () => makeFakeTurnPreview());
    const stack = root.querySelector<HTMLElement>('.ig-cmd-stack')!;
    const help = root.querySelector<HTMLElement>('.ffx-cmd-info')!;
    expect(stack.hidden).toBe(false);

    // A strategy answered for the player: the presenter abandons the HUD's
    // promise and plays the action anyway.
    hud.onEvent({ seq: 1, type: 'action-start', actorId: 'seymour-flux', command: { kind: 'attack', targets: ['tidus'] }, targets: ['tidus'] });
    expect(stack.hidden).toBe(true);
    expect(help.hidden).toBe(true);

    // Never a dead end: if the decision really was still the player's, the
    // next keypress restores the menu instead of deadlocking the fight.
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'ArrowDown' }));
    expect(stack.hidden).toBe(false);

    (([...root.querySelectorAll('.ig-cmd')].find((r) => r.textContent?.includes('Attack')) as HTMLElement) ?? stack).click();
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Enter' }));
    await promise;
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
