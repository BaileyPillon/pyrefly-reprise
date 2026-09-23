// @vitest-environment jsdom
/**
 * **PR-0125, the menu half: Special > Doublecast > spell > target, by real keys.**
 *
 * Before the fix, Enter on Doublecast closed the menu at once: the row's
 * self-only `validTargets` (`['lulu']`) read as a finished aim and the menu
 * submitted `{ id: 'doublecast', targets: ['lulu'] }` — Firaga twice on Lulu
 * [critic round 09, PR-0125]. FFX's Doublecast is *"Two Blk Magic casts"*
 * (`research/ffx-combat-core.md` §7.4 row 41), so choosing it must ask which
 * Black Magic spell, and that spell's own target step must ask where.
 *
 * Driven through the real `CommandMenu` with real `KeyboardEvent`s, on the
 * real command list the FFX engine offers Lulu in chapter 3, and the command
 * that comes out is submitted back to that engine.
 *
 * **FFX only** [AGENTS.md rule 14]: only the FFX engine publishes a wrapper
 * row (`AvailableCommand.wrapsCategory`), and only chapter 3's `dreams-end`
 * grants Doublecast.
 */

import { beforeEach, describe, expect, it } from 'vitest';
import type { AnyCombatant, AvailableCommand, CombatantId, Command, Decision } from '../../src/battle/common/types.ts';
import { FFXContentRegistry, createFFXEngine } from '../../src/battle/ffx/index.ts';
import { ALL_ABILITIES, ENEMY_GROUPS_BY_ID, ITEMS } from '../../src/data/ffx/index.ts';
import { dreamsEndBuild } from '../../src/data/ffx/builds/dreams-end.ts';
import { CommandMenu } from '../../src/ui/ffx/CommandMenu.ts';
import type { CursorSelection } from '../../src/ui/ffx/TargetCursor.ts';

type Engine = ReturnType<typeof createFFXEngine>;

/** Chapter 3, seed 1, the round 09 probe's line to Lulu's first Doublecast. */
function lulusTurn(): { engine: Engine; commands: AvailableCommand[] } {
  const content = new FFXContentRegistry();
  content.addAbilities(ALL_ABILITIES);
  content.addItems(Object.values(ITEMS));
  const e = createFFXEngine({ content, autoResolveMinigames: true });
  e.setSeed(1);
  e.init({
    game: 'ffx',
    party: dreamsEndBuild,
    enemies: ENEMY_GROUPS_BY_ID['braskas-final-aeon']!,
    triggers: [],
    seed: 1,
    condition: 'normal',
    canEscape: false,
  } as never);
  for (let i = 0; i < 400; i++) {
    const d = e.nextDecision() as Decision;
    if (d.kind === 'battle-over') break;
    if (d.kind !== 'player-input') continue;
    if (d.actorId === 'lulu' && d.commands.some((c) => c.enabled && (c.command as { id?: string }).id === 'doublecast')) {
      return { engine: e, commands: d.commands };
    }
    if (d.actorId === 'auron' && !e.state().activeIds.includes('lulu')) {
      e.submit({ kind: 'switch', targets: [], extra: { outId: 'auron', inId: 'lulu' } } as unknown as Command);
      continue;
    }
    const atk = d.commands.find((c) => c.enabled && c.command.kind === 'attack');
    const t = atk?.validTargets.find((x) => x.startsWith('yu-pagoda')) ?? atk?.validTargets[0];
    e.submit((atk ? { ...atk.command, targets: t ? [t] : [] } : { kind: 'defend', targets: [] }) as Command);
  }
  throw new Error("never reached Lulu's Doublecast");
}

function key(code: string): void {
  window.dispatchEvent(new KeyboardEvent('keydown', { code, bubbles: true, cancelable: true }));
}

interface Harness {
  menu: CommandMenu;
  engine: Engine;
  help: () => string;
  aimed: () => CombatantId | null;
  selection: () => CursorSelection | null | undefined;
  resolved: () => Command | null;
  done: Promise<Command>;
}

function open(): Harness {
  const { engine, commands } = lulusTurn();
  const menu = new CommandMenu();
  const order = [...engine.state().enemyIds];
  // Left to right in the engine's own order, so ArrowRight steps through it.
  menu.setProjector((id) => ({ x: 100 + Math.max(0, order.indexOf(id)) * 200, y: 300, w: 120, h: 260 }));
  document.body.append(menu.stackEl, menu.breadcrumbEl, menu.targetCursor.el);
  let help = '';
  let aimed: CombatantId | null = null;
  const seen: Array<CursorSelection | null> = [];
  let resolved: Command | null = null;
  const done = menu.open({
    actorId: 'lulu',
    commands,
    previewRank: () => [],
    combatants: engine.state().combatants as Record<CombatantId, AnyCombatant>,
    setHelp: (t) => {
      help = t;
    },
    onTargetChange: (id) => {
      aimed = id;
    },
    onSelection: (sel) => seen.push(sel),
  });
  void done.then((c) => {
    resolved = c;
  });
  return { menu, engine, help: () => help, aimed: () => aimed, selection: () => seen.at(-1), resolved: () => resolved, done };
}

function selectedLabel(): string {
  return document.querySelector('.ig-cmd--selected .ffx-cmd__label')?.textContent ?? '';
}

function visibleLabels(): string[] {
  return [...document.querySelectorAll('.ig-cmd .ffx-cmd__label')].map((el) => el.textContent ?? '');
}

/** ArrowDown until the highlighted row reads `label` (the stack wraps). */
function walkTo(label: string): void {
  for (let i = 0; i < 30 && selectedLabel() !== label; i++) key('ArrowDown');
  expect(selectedLabel(), `could not reach ${label}`).toBe(label);
}

/** ArrowRight until the cursor is on `id`. */
function aimAt(h: Harness, id: CombatantId): void {
  for (let i = 0; i < 8 && h.aimed() !== id; i++) key('ArrowRight');
  expect(h.aimed()).toBe(id);
}

beforeEach(() => {
  document.body.innerHTML = '';
});

describe('Doublecast opens a spell step and then a target step', () => {
  it('Special > Doublecast shows the Black Magic list, not a finished cast', async () => {
    const h = open();
    walkTo('Special');
    key('Enter');
    expect(h.menu.breadcrumbEl.textContent).toBe('Special');
    walkTo('Doublecast');
    key('Enter');
    await Promise.resolve();
    // The defect: this Enter used to close the menu with targets ['lulu'].
    expect(h.resolved()).toBeNull();
    expect(h.menu.stackEl.hidden).toBe(false);
    expect(h.menu.breadcrumbEl.hidden).toBe(false);
    expect(h.menu.breadcrumbEl.textContent).toBe('Doublecast');
    const labels = visibleLabels();
    expect(labels.length).toBeGreaterThan(0);
    for (const l of labels) expect(['Fire', 'Fira', 'Firaga', 'Blizzard', 'Blizzara', 'Blizzaga', 'Thunder', 'Thundara', 'Thundaga', 'Water', 'Watera', 'Waterga', 'Bio']).toContain(l);
    expect(h.help()).toMatch(/^Doublecast: cast twice/);
  });

  it('the spell opens its own enemy target step; Enter submits Doublecast with wrappedId', async () => {
    const h = open();
    walkTo('Special');
    key('Enter');
    walkTo('Doublecast');
    key('Enter');
    walkTo('Firaga');
    key('Enter');
    await Promise.resolve();
    expect(h.resolved()).toBeNull();
    expect(h.selection()?.mode).toBe('single');
    const enemies = new Set(h.engine.state().enemyIds);
    expect(enemies.has(h.aimed()!)).toBe(true);
    expect(h.aimed()).not.toBe('lulu');
    aimAt(h, 'braskas-final-aeon');
    key('Enter');
    const cmd = await h.done;
    expect(cmd).toEqual({ kind: 'ability', id: 'doublecast', wrappedId: 'firaga', targets: ['braskas-final-aeon'] });

    // And the engine does what the menu said: two Firagas on the boss.
    const events = h.engine.submit(cmd) as unknown as Array<Record<string, unknown>>;
    const start = events.find((e) => e['type'] === 'action-start') as { targets: string[]; abilityName: string };
    expect(start.targets).toEqual(['braskas-final-aeon']);
    expect(start.abilityName).toBe('Doublecast: Firaga');
    const hits = events.filter((e) => e['type'] === 'damage' && e['sourceId'] === 'lulu');
    expect(hits.map((e) => e['targetId'])).toEqual(['braskas-final-aeon', 'braskas-final-aeon']);
  });

  it('Esc walks back one step at a time: target > spell list > Special list', async () => {
    const h = open();
    walkTo('Special');
    key('Enter');
    walkTo('Doublecast');
    key('Enter');
    walkTo('Firaga');
    key('Enter');
    expect(h.selection()?.mode).toBe('single');
    key('Escape');
    expect(h.selection()).toBeNull();
    expect(h.menu.breadcrumbEl.textContent).toBe('Doublecast');
    expect(selectedLabel()).toBe('Firaga');
    key('Escape');
    expect(h.menu.breadcrumbEl.textContent).toBe('Special');
    expect(selectedLabel()).toBe('Doublecast');
    // And forward again still works after backing out.
    key('Enter');
    walkTo('Thundaga');
    key('Enter');
    key('Enter');
    const cmd = (await h.done) as { id: string; wrappedId?: string; targets: string[] };
    expect(cmd.id).toBe('doublecast');
    expect(cmd.wrappedId).toBe('thundaga');
    expect(cmd.targets).toHaveLength(1);
    expect(h.engine.state().enemyIds).toContain(cmd.targets[0]);
  });
});
