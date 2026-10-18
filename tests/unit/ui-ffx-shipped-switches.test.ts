// @vitest-environment jsdom
/**
 * **The shipped FFX command menu, HUD side** (re-parity r55 RE; **FFX only**; Bailey, 2026-10-18, "I'll go with all of your recommendations", and for t6b "For t6b my answer is on").
 *
 * No switch is set by this file: the real `CommandMenu` is driven with real `KeyboardEvent`s on the rows the real FFX engine offers, with the module defaults a player gets in release 55
 * (`MENU_DRAW_PARITY` items a to e on, f `cursor` and g `help` off; `TARGET_STEP_PARITY` all but `cursorStartFoe` and `sideSwitch`). The engine half is `parity-ffx-shipped-switches.test.ts`.
 *
 * What the walk proves: an opener opens onto grey spells and the cursor SKIPS greyed rows (item f is off), so no path leaves a player stuck; a confirm on a grey spell shakes the stack and plays no
 * cue; Escape backs out; the greyed Escape, Flee and Switch rows are never reachable by the cursor; a one-entry Overdrive list of the five characters (t6b) opens instead of running its entry.
 */

import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AnyCombatant, AvailableCommand, CombatantId, Command } from '../../src/battle/common/types.ts';
import { CommandMenu } from '../../src/ui/ffx/CommandMenu.ts';
import { opensList } from '../../src/ui/ffx/targetStepUi.ts';
import { buildTopRows } from '../../src/ui/ffx/CommandMenuLogic.ts';
import { actor, engineFor, menuOf } from './helpers/menuParityDrive.ts';

const playRefusal = vi.hoisted(() => vi.fn());
vi.mock('../../src/ui/ffx/refusalCue.ts', () => ({ playRefusal }));

const opened: CommandMenu[] = [];
afterEach(() => {
  for (const m of opened.splice(0)) m.close(); // a menu left open keeps listening on the window and would answer the next test's keys
});
beforeEach(() => {
  document.body.innerHTML = '';
  playRefusal.mockClear();
});

const key = (code: string): void => {
  window.dispatchEvent(new KeyboardEvent('keydown', { code, bubbles: true, cancelable: true }));
};
const selected = (): string => document.querySelector('.ig-cmd--selected .ffx-cmd__label')?.textContent ?? '';
const rowsNow = (): Array<{ label: string; disabled: boolean }> =>
  [...document.querySelectorAll('.ig-cmd')].map((el) => ({ label: el.querySelector('.ffx-cmd__label')?.textContent ?? '', disabled: el.classList.contains('ig-cmd--disabled') }));
const shaken = (menu: CommandMenu): boolean => menu.stackEl.classList.contains('ffx-cmd-stack--shake');
/** ArrowDown until the highlighted row reads `label` (the stack wraps). */
function walkTo(label: string): void {
  for (let i = 0; i < 40 && selected() !== label; i += 1) key('ArrowDown');
  expect(selected(), `could not reach ${label}`).toBe(label);
}

interface Opened {
  menu: CommandMenu;
  resolved: () => Command | null;
}
function open(actorId: string, commands: AvailableCommand[], combatants: Record<CombatantId, AnyCombatant>): Opened {
  const menu = new CommandMenu();
  opened.push(menu);
  document.body.append(menu.stackEl, menu.breadcrumbEl, menu.targetCursor.el);
  let resolved: Command | null = null;
  void menu
    .open({ actorId, commands, previewRank: () => [], combatants, setHelp: () => undefined } as never)
    .then((c) => {
      resolved = c;
    });
  return { menu, resolved: () => resolved };
}

beforeAll(async () => {
  await engineFor('braskas-final-aeon');
});

describe('Silenced Lulu (Chapter III), shipped: Black Magic opens onto grey spells, the cursor skips them, a confirm shakes with no cue, Escape backs out', () => {
  it('walks Black Magic and out again without getting stuck', async () => {
    const engine = await engineFor('braskas-final-aeon');
    actor(engine, 'lulu').statuses.silence = { id: 'silence', turnsRemaining: 254 } as never;
    const commands = menuOf(engine, 'lulu');
    const combatants = engine.state().combatants as Record<CombatantId, AnyCombatant>;
    const h = open('lulu', commands, combatants);

    // top level: Black Magic is a normal row (item a); the greyed Escape and Flee rows (item d) are drawn but the cursor never rests on them (item f is off)
    const top = rowsNow();
    expect(top.find((r) => r.label === 'Black Magic')?.disabled).toBe(false);
    const greyed = top.filter((r) => r.disabled).map((r) => r.label);
    expect(greyed.length).toBeGreaterThan(0);
    const seen = new Set<string>();
    for (let i = 0; i < 3 * top.length; i += 1) {
      key('ArrowDown');
      seen.add(selected());
    }
    for (const g of greyed) expect(seen.has(g), `the cursor rested on the greyed row ${g}`).toBe(false);
    expect(seen.has('Black Magic')).toBe(true);

    // into the list: every spell is grey, the cursor has nowhere to move, a confirm shakes and plays no cue (item f off)
    walkTo('Black Magic');
    key('Enter');
    expect(h.menu.breadcrumbEl.hidden).toBe(false);
    expect(h.menu.breadcrumbEl.textContent).toBe('Black Magic');
    expect(rowsNow().length).toBeGreaterThan(3);
    expect(rowsNow().every((r) => r.disabled)).toBe(true);
    const first = selected();
    key('ArrowDown');
    key('ArrowUp');
    expect(selected()).toBe(first);
    key('Enter');
    expect(shaken(h.menu)).toBe(true);
    expect(playRefusal).not.toHaveBeenCalled();
    expect(h.resolved()).toBeNull();

    // Escape returns to the top row, resting on Black Magic; the menu is still alive and Attack can still be chosen
    key('Escape');
    expect(h.menu.breadcrumbEl.hidden).toBe(true);
    expect(selected()).toBe('Black Magic');
    walkTo('Attack');
    key('Enter'); // Attack is not stuck behind the list: it opens the target step (the menu does not resolve until a target is confirmed)
    expect(h.resolved()).toBeNull();
    expect(h.menu.breadcrumbEl.hidden).toBe(true);
  });

  it('a Cursed Tidus with a full gauge shows a greyed Overdrive row the cursor never rests on (items b and f)', async () => {
    const engine = await engineFor('seymour-flux');
    const tidus = actor(engine, 'tidus');
    tidus.overdrive!.gauge = 100;
    tidus.statuses.curse = { id: 'curse', turnsRemaining: 254 } as never;
    const commands = menuOf(engine, 'tidus');
    open('tidus', commands, engine.state().combatants as Record<CombatantId, AnyCombatant>);
    const od = rowsNow().find((r) => r.label.toLowerCase().includes('overdrive'));
    expect(od?.disabled).toBe(true);
    for (let i = 0; i < 20; i += 1) {
      key('ArrowDown');
      expect(selected().toLowerCase()).not.toContain('overdrive');
    }
  });
});

describe('t6b shipped: the five characters\' one-entry Overdrive list opens instead of running its entry', () => {
  it('Tidus with a full gauge in Chapter I: Enter on Overdrive opens a list of one and waits; Escape backs out', async () => {
    const engine = await engineFor('seymour-flux');
    actor(engine, 'tidus').overdrive!.gauge = 100;
    const commands = menuOf(engine, 'tidus');
    expect(commands.filter((c) => c.category === 'overdrive' && c.enabled).length).toBe(1);
    const menu = new CommandMenu();
    opened.push(menu);
    document.body.append(menu.stackEl, menu.breadcrumbEl, menu.targetCursor.el);
    let resolved: Command | null = null;
    void menu.open({ actorId: 'tidus', commands, previewRank: () => [], combatants: engine.state().combatants as Record<CombatantId, AnyCombatant>, setHelp: () => undefined } as never).then((c) => {
      resolved = c;
    });
    const label = rowsNow().find((r) => r.label.toLowerCase().includes('overdrive'))!.label;
    walkTo(label);
    key('Enter');
    expect(menu.breadcrumbEl.hidden).toBe(false);
    expect(menu.breadcrumbEl.textContent?.toLowerCase()).toContain('overdrive');
    expect(rowsNow().length).toBe(1);
    expect(resolved).toBeNull();
    key('Escape');
    expect(menu.breadcrumbEl.hidden).toBe(true);
    expect(selected()).toBe(label);
  });

  it('opensList: Tidus, Kimahri, Auron, Wakka and Lulu yes; an aeon, Yuna and Rikku no; the six lists yes; the Switch role and the aeon group no', () => {
    const entry = (category: AvailableCommand['category']): AvailableCommand => ({ command: { kind: 'ability', id: category, targets: [] }, label: category, category, mpCost: 0, rank: 3, enabled: true, validTargets: ['x'] });
    const group = (category: AvailableCommand['category']) => {
      const g = buildTopRows([entry(category)])[0]!;
      if (g.kind !== 'group') throw new Error('group');
      return g;
    };
    const od = group('overdrive');
    for (const who of ['tidus', 'kimahri', 'auron', 'wakka', 'lulu']) expect(opensList(od, who), who).toBe(true);
    for (const who of ['yuna', 'rikku', 'valefor', 'ixion', 'bahamut']) expect(opensList(od, who), who).toBe(false);
    for (const c of ['skill', 'special', 'blackmagic', 'whitemagic', 'summon', 'item'] as const) expect(opensList(group(c), 'tidus'), c).toBe(true);
    expect(opensList({ ...od, role: 'switch' }, 'tidus')).toBe(false);
  });
});
