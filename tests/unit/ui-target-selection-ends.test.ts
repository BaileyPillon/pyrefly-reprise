// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CommandMenu } from '../../src/ui/ffx/CommandMenu.ts';
import type { CursorSelection } from '../../src/ui/ffx/TargetCursor.ts';
import type { AnyCombatant, AvailableCommand, CombatantId } from '../../src/battle/common/types.ts';

/**
 * **Every way a selection can end has to say so.**
 *
 * The adversarial verifier's pass 2 blocker: `confirmTarget()` hid the cursor
 * and finished the command but never reported the selection as ended, so after
 * the single most-used interaction in the game — pressing Enter to issue a
 * command — the quiet dim stayed on the whole party and the other enemies for
 * the rest of the fight, and `window.__pyrefly.targeting().selection` went on
 * naming a stale ally group while the player was aiming an enemy Attack.
 *
 * The whole unit suite missed it because every existing test drives
 * `TargetCursor` directly. These drive the **real menu** with **real
 * KeyboardEvents**, which is the only path `confirmTarget()` is on.
 *
 * GAME-AWARE (AGENTS.md rule 14): the defect was **FFX only** — FFX-2's menu
 * wires `TargetCursor.setOnSelection`, so its `cleanup()` already reported the
 * end. The fix is in the shared chokepoint, so the last case here asserts the
 * FFX-2 menu stays clean too (both, CHK-020).
 */

const COMBATANTS: Record<CombatantId, AnyCombatant> = {
  tidus: { id: 'tidus', name: 'Tidus', side: 'party' },
  yuna: { id: 'yuna', name: 'Yuna', side: 'party' },
  auron: { id: 'auron', name: 'Auron', side: 'party' },
  mortiorchis: { id: 'mortiorchis', name: 'Mortiorchis', side: 'enemy' },
  'seymour-flux': { id: 'seymour-flux', name: 'Seymour Flux', side: 'enemy' },
} as unknown as Record<CombatantId, AnyCombatant>;

/** Chapter 1's real shape: an Attack that picks one of two fiends, and a
 * White Magic list holding Cure (pick one ally) and Hastega (hits all three). */
const COMMANDS: AvailableCommand[] = [
  {
    command: { kind: 'attack', targets: [] },
    label: 'Attack',
    category: 'attack',
    mpCost: 0,
    enabled: true,
    validTargets: ['mortiorchis', 'seymour-flux'],
    targeting: 'single-enemy',
  },
  {
    command: { kind: 'ability', id: 'cure', targets: [] },
    label: 'Cure',
    category: 'whitemagic',
    mpCost: 4,
    enabled: true,
    validTargets: ['tidus', 'yuna', 'auron'],
    targeting: 'single-ally',
  },
  {
    command: { kind: 'ability', id: 'hastega', targets: [] },
    label: 'Hastega',
    category: 'whitemagic',
    mpCost: 38,
    enabled: true,
    validTargets: ['tidus', 'yuna', 'auron'],
    targeting: 'all-allies',
  },
];

/** The menu listens on `window`, the same place a real key press lands. */
function key(code: string): void {
  window.dispatchEvent(new KeyboardEvent('keydown', { code, bubbles: true, cancelable: true }));
}

interface Harness {
  menu: CommandMenu;
  seen: Array<CursorSelection | null>;
  last: () => CursorSelection | null | undefined;
  done: Promise<unknown>;
}

function open(): Harness {
  const menu = new CommandMenu();
  menu.setProjector((id) => ({ x: id.length * 40, y: 300, w: 120, h: 260 }));
  document.body.append(menu.stackEl, menu.targetCursor.el);
  const seen: Array<CursorSelection | null> = [];
  const done = menu.open({
    actorId: 'tidus',
    commands: COMMANDS,
    previewRank: () => [],
    combatants: COMBATANTS,
    setHelp: () => {},
    onSelection: (sel) => seen.push(sel),
  });
  return { menu, seen, last: () => seen.at(-1), done };
}

beforeEach(() => {
  document.body.innerHTML = '';
});

describe('a confirmed command ends the selection', () => {
  it('single target: Attack, Enter, Enter reports null last', async () => {
    const h = open();
    key('Enter'); // Attack -> opens the enemy cursor
    expect(h.last()).not.toBeNull();
    expect(h.last()?.mode).toBe('single');
    key('Enter'); // CONFIRM
    await h.done;
    // The blocker: the dim and the accent pool are driven from this call, and
    // before the fix the last thing the field ever heard was the live
    // selection — so every non-target stayed 26% grey for the rest of the
    // fight.
    expect(h.last()).toBeNull();
  });

  it('multi-target: White Magic, Hastega, Enter reports null last', async () => {
    const h = open();
    key('ArrowDown'); // White Magic
    key('Enter'); // open the list
    key('ArrowDown'); // Cure -> Hastega
    key('Enter'); // pick Hastega -> rings all three allies
    expect(h.last()?.mode).toBe('all');
    expect(h.last()?.ids).toEqual(['tidus', 'yuna', 'auron']);
    key('Enter'); // CONFIRM the party-wide cast
    await h.done;
    expect(h.last()).toBeNull();
  });

  it('cancel still reports null (the half that already worked)', () => {
    const h = open();
    key('Enter');
    expect(h.last()).not.toBeNull();
    key('Escape');
    expect(h.last()).toBeNull();
  });

  it('a command that needs no target never leaves a selection behind', async () => {
    const menu = new CommandMenu();
    document.body.append(menu.stackEl, menu.targetCursor.el);
    const seen: Array<CursorSelection | null> = [];
    const done = menu.open({
      actorId: 'tidus',
      commands: [
        {
          command: { kind: 'attack', targets: [] },
          label: 'Attack',
          category: 'attack',
          mpCost: 0,
          enabled: true,
          validTargets: ['mortiorchis'],
          targeting: 'single-enemy',
        },
      ],
      previewRank: () => [],
      combatants: COMBATANTS,
      setHelp: () => {},
      onSelection: (sel) => seen.push(sel),
    });
    key('Enter'); // one legal target: FFX confirms without a cursor (`auto`)
    await done;
    expect(seen.at(-1) ?? null).toBeNull();
  });

  it('a stale group never survives into the next decision', async () => {
    // The verifier's exact sequence: confirm a party-wide Hastega, then open
    // the next menu and aim an enemy Attack. Before the fix the debug surface
    // answered `{ids:['tidus','yuna','auron'], mode:'all'}` for an Attack.
    const first = open();
    key('ArrowDown');
    key('Enter');
    key('ArrowDown');
    key('Enter');
    key('Enter');
    await first.done;

    const second = open();
    key('Enter'); // Attack -> enemy cursor
    const sel = second.last();
    expect(sel?.mode).toBe('single');
    expect(sel?.kind).toBe('enemy');
    expect(sel?.ids.some((id) => ['tidus', 'yuna', 'auron'].includes(id))).toBe(false);
    key('Escape');
    key('Escape');
    second.menu.close();
  });

  it('closing the menu for any other reason (pause, battle end) clears it too', () => {
    const h = open();
    key('Enter');
    expect(h.last()).not.toBeNull();
    h.menu.close();
    expect(h.last()).toBeNull();
  });

  it('a menu abandoned because a strategy answered does not leave the field dimmed', () => {
    const h = open();
    key('Enter');
    expect(h.last()).not.toBeNull();
    // `BattlePresenter.chooseCommand` races the HUD promise; the loser is
    // simply abandoned and the next actor's menu opens over it.
    const seenBefore = h.seen.length;
    h.menu.open({
      actorId: 'yuna',
      commands: COMMANDS,
      previewRank: () => [],
      combatants: COMBATANTS,
      setHelp: () => {},
      onSelection: () => {},
    });
    expect(h.seen.slice(seenBefore).at(-1) ?? h.last()).toBeNull();
    h.menu.close();
  });
});

describe('the FFX-2 menu stays clean (the same chokepoint, the other game)', () => {
  it('reports null when its cursor closes', async () => {
    const { openCommandMenu } = await import('../../src/ui/ffx2/CommandMenu.ts');
    const container = document.createElement('div');
    const targetLayer = document.createElement('div');
    document.body.append(container, targetLayer);
    const seen: Array<CursorSelection | null> = [];
    const done = openCommandMenu({
      container,
      targetLayer,
      actorName: 'Yuna',
      commands: [
        {
          command: { kind: 'attack', targets: [] },
          label: 'Attack',
          category: 'attack',
          mpCost: 0,
          enabled: true,
          validTargets: ['bahamut', 'vegnagun-tail'],
          targeting: 'single-enemy',
        },
      ],
      previewRank: () => ({ elapsedMs: 0, bars: [] }),
      onPreview: () => {},
      project: (id) => ({ x: id.length * 30, y: 100 }),
      onSelection: (sel) => seen.push(sel),
    });
    key('Enter');
    expect(seen.at(-1)).not.toBeNull();
    key('Enter');
    await done;
    expect(seen.at(-1) ?? null).toBeNull();
  });
});

/** Belt and braces: the spy shape the HUD actually installs. */
it('the HUD hook is called with null, not merely left uncalled', async () => {
  const menu = new CommandMenu();
  menu.setProjector(() => ({ x: 10, y: 10, w: 100, h: 100 }));
  document.body.append(menu.stackEl, menu.targetCursor.el);
  const onSelection = vi.fn();
  const done = menu.open({
    actorId: 'tidus',
    commands: COMMANDS,
    previewRank: () => [],
    combatants: COMBATANTS,
    setHelp: () => {},
    onSelection,
  });
  key('Enter');
  key('Enter');
  await done;
  expect(onSelection).toHaveBeenLastCalledWith(null);
});
