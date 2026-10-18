// @vitest-environment jsdom
/**
 * **The FFX command menu's draw rules, HUD side** (re-parity RC11, items a and f; **FFX only**; switch `MENU_DRAW_PARITY`, default OFF; the engine half is
 * `parity-ffx-menu-draw.test.ts`, the handoff `docs/handoff/re-parity-rc11-ffx-menu-parity.md`).
 *
 * The original (`FFX.exe`; `FFX-G11` sections 4 and 5): an opener row (Black Magic, White Magic, Skill, Special, Doublecast, Summon) is never greyed by Silence or MP, it opens, and the entries inside are
 * greyed; the list-input handler (0x0089C900) moves the cursor with no look at the resolver, so it rests on a greyed row, and a confirm there is refused with the menu cue.
 *
 * Driven through the real `CommandMenu` with real `KeyboardEvent`s on the rows the real FFX engine offers a Silenced Lulu (Chapter III's party), plus a few synthetic rows for the edges.
 */

import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { pinSwitchesToPreR55 } from './helpers/pinPreR55Switches.ts';
import type { AnyCombatant, AvailableCommand, CombatantId, Command } from '../../src/battle/common/types.ts';
import { setMenuDrawParity } from '../../src/battle/ffx/menu-draw-parity.ts';
import { CommandMenu } from '../../src/ui/ffx/CommandMenu.ts';
import { buildTopRows, isOpenerGroup, rowEnabled } from '../../src/ui/ffx/CommandMenuLogic.ts';
import { groupHelp, topRowVM } from '../../src/ui/ffx/commandMenuRows.ts';
import { openYunaGrandSummon } from '../../src/ui/ffx/minigames/YunaGrandSummon.ts';
import { actor, ctxOf, engineFor, menuOf } from './helpers/menuParityDrive.ts';

pinSwitchesToPreR55(); // r55 RE: the four parity switches ship ON; this file was written for OFF and turns on what it exercises

const playRefusal = vi.hoisted(() => vi.fn());
vi.mock('../../src/ui/ffx/refusalCue.ts', () => ({ playRefusal }));

let restore: (() => void) | undefined;
const on = (skip: Parameters<typeof setMenuDrawParity>[1] = []): void => {
  restore?.();
  restore = setMenuDrawParity(true, skip);
};
const opened: CommandMenu[] = [];
afterEach(() => {
  for (const m of opened.splice(0)) m.close(); // a menu left open keeps listening on the window and would answer the next test's keys
  restore?.();
  restore = undefined;
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
    .open({ actorId, commands, previewRank: () => [], combatants, setHelp: () => undefined })
    .then((c) => {
      resolved = c;
    });
  return { menu, resolved: () => resolved };
}

/** Lulu of Chapter III, Silenced (or out of MP), with the rows the real engine offers her. */
async function lulu(how: 'silence' | 'mp'): Promise<{ commands: AvailableCommand[]; combatants: Record<CombatantId, AnyCombatant> }> {
  const engine = await engineFor('braskas-final-aeon');
  const c = actor(engine, 'lulu');
  if (how === 'silence') c.statuses.silence = { id: 'silence', turnsRemaining: 254 } as never;
  else c.mp = 0;
  return { commands: menuOf(engine, 'lulu'), combatants: engine.state().combatants as Record<CombatantId, AnyCombatant> };
}

beforeAll(async () => {
  await engineFor('braskas-final-aeon');
});

describe('item a, off: a Silenced caster\'s Black Magic row is greyed, the cursor skips it, and Enter shakes (as before)', () => {
  it('Silenced Lulu', async () => {
    const { commands, combatants } = await lulu('silence');
    const h = open('lulu', commands, combatants);
    const black = rowsNow().find((r) => r.label === 'Black Magic');
    expect(black?.disabled).toBe(true);
    for (let i = 0; i < 12; i += 1) {
      key('ArrowDown');
      expect(selected()).not.toBe('Black Magic'); // skipped
    }
    expect(h.resolved()).toBeNull();
    expect(playRefusal).not.toHaveBeenCalled();
  });
});

describe('item a, on: the opener rows open onto grey entries', () => {
  for (const how of ['silence', 'mp'] as const) {
    it(`${how}: Black Magic is a normal row, the cursor rests on it, Enter opens the list, every spell is grey, the cursor rests on each, Enter on one is refused`, async () => {
      on();
      const { commands, combatants } = await lulu(how);
      const h = open('lulu', commands, combatants);
      expect(rowsNow().find((r) => r.label === 'Black Magic')?.disabled).toBe(false);
      walkTo('Black Magic');
      key('Enter');
      expect(h.menu.breadcrumbEl.hidden).toBe(false);
      expect(h.menu.breadcrumbEl.textContent).toBe('Black Magic');
      const list = commands.filter((c) => c.category === 'blackmagic');
      expect(list.length).toBeGreaterThan(3);
      expect(list.every((c) => !c.enabled)).toBe(true);
      expect(rowsNow().every((r) => r.disabled)).toBe(true);
      // the cursor rests on every row, in order
      const order: string[] = [selected()];
      for (let i = 1; i < Math.min(list.length, 5); i += 1) {
        key('ArrowDown');
        order.push(selected());
      }
      expect(order).toEqual(list.slice(0, order.length).map((c) => c.label));
      // a confirm there is refused: the cue plays, the stack shakes, nothing is submitted, the menu stays open
      expect(playRefusal).not.toHaveBeenCalled();
      key('Enter');
      expect(playRefusal).toHaveBeenCalledTimes(1);
      expect(shaken(h.menu)).toBe(true);
      expect(h.resolved()).toBeNull();
      expect(h.menu.breadcrumbEl.textContent).toBe('Black Magic');
      // Esc goes back to the top row, still resting on Black Magic
      key('Escape');
      expect(selected()).toBe('Black Magic');
    });
  }

  it('Doublecast (in the Special list) opens its Black Magic list of grey spells; off it shakes and stays', async () => {
    const { commands, combatants } = await lulu('silence');
    const wrapper = commands.find((c) => c.wrapsCategory === 'blackmagic');
    expect(wrapper?.enabled).toBe(true); // the wrapper itself is not Silenced (the record has no Silence bit)
    // off
    let h = open('lulu', commands, combatants);
    walkTo('Special');
    key('Enter');
    walkTo('Doublecast');
    key('Enter');
    expect(h.menu.breadcrumbEl.textContent).toBe('Special'); // refused: the list stayed
    expect(shaken(h.menu)).toBe(true);
    expect(playRefusal).not.toHaveBeenCalled(); // no cue off
    key('Escape');
    h.menu.close(); // one menu listens at a time
    // on
    document.body.innerHTML = '';
    on();
    h = open('lulu', commands, combatants);
    walkTo('Special');
    key('Enter');
    walkTo('Doublecast');
    key('Enter');
    expect(h.menu.breadcrumbEl.textContent).toBe('Doublecast · 1 of 2'); // release 55: the list is the first round of the two-pick Doublecast (dcast-hud), headed so
    expect(rowsNow().every((r) => r.disabled)).toBe(true);
    key('Enter');
    expect(playRefusal).toHaveBeenCalledTimes(1);
    expect(h.resolved()).toBeNull();
  });

  it('a one-entry opener whose entry is grey opens its list instead of resolving that entry', () => {
    const entry: AvailableCommand = {
      command: { kind: 'ability', id: 'scan', targets: [] },
      label: 'Scan',
      category: 'skill',
      mpCost: 0,
      rank: 3,
      enabled: false,
      disabledReason: 'Silenced',
      validTargets: [],
    };
    const attack: AvailableCommand = { command: { kind: 'attack', targets: [] }, label: 'Attack', category: 'attack', mpCost: 0, rank: 1, enabled: true, validTargets: ['x'] };
    const combatants = { x: { id: 'x', name: 'Foe', side: 'enemy' } } as unknown as Record<CombatantId, AnyCombatant>;
    on();
    const h = open('a', [attack, entry], combatants);
    walkTo('Skill');
    key('Enter');
    expect(h.menu.breadcrumbEl.textContent).toBe('Skill');
    expect(rowsNow()).toEqual([{ label: 'Scan', disabled: true }]);
    expect(h.resolved()).toBeNull();
    key('Enter');
    expect(h.resolved()).toBeNull();
    expect(playRefusal).toHaveBeenCalledTimes(1);
  });

  it('a Summon group of grey aeons (all down) is an opener too; a Switch group of grey rows is not (it stays greyed and Enter refuses it)', () => {
    const summon = (label: string): AvailableCommand => ({ command: { kind: 'summon', id: label.toLowerCase(), targets: [] }, label, category: 'summon', mpCost: 0, rank: 3, enabled: false, validTargets: [] });
    const swap = (label: string): AvailableCommand => ({ command: { kind: 'switch', targets: [], extra: { outId: 'a', inId: label.toLowerCase() } }, label, category: 'special', mpCost: 0, rank: 3, enabled: false, validTargets: [] });
    const attack: AvailableCommand = { command: { kind: 'attack', targets: [] }, label: 'Attack', category: 'attack', mpCost: 0, rank: 1, enabled: true, validTargets: ['x'] };
    const combatants = { x: { id: 'x', name: 'Foe', side: 'enemy' } } as unknown as Record<CombatantId, AnyCombatant>;
    on();
    const h = open('a', [attack, summon('Valefor'), summon('Ifrit'), swap('Auron')], combatants);
    expect(rowsNow().map((r) => `${r.label}:${r.disabled}`)).toEqual(['Attack:false', 'Summon:false', 'Switch:true']);
    walkTo('Switch'); // the cursor rests on the greyed Switch row
    key('Enter');
    expect(playRefusal).toHaveBeenCalledTimes(1);
    expect(h.resolved()).toBeNull();
    expect(h.menu.breadcrumbEl.hidden).toBe(true);
    walkTo('Summon');
    key('Enter');
    expect(h.menu.breadcrumbEl.textContent).toBe('Summon');
    expect(rowsNow().map((r) => `${r.label}:${r.disabled}`)).toEqual(['Valefor:true', 'Ifrit:true']);
  });
});

describe('item f alone (skip "openers"): the cursor rests on greyed rows, but a greyed opener is still a greyed row', () => {
  it('the Black Magic row is greyed, the cursor reaches it, Enter is refused with the cue', async () => {
    on(['openers']);
    const { commands, combatants } = await lulu('silence');
    const h = open('lulu', commands, combatants);
    expect(rowsNow().find((r) => r.label === 'Black Magic')?.disabled).toBe(true);
    walkTo('Black Magic');
    key('Enter');
    expect(playRefusal).toHaveBeenCalledTimes(1);
    expect(h.menu.breadcrumbEl.hidden).toBe(true);
    expect(h.resolved()).toBeNull();
  });
});

describe('item a alone (skip "cursor"): the opener opens, and inside it the cursor skips greyed rows as before', () => {
  it('a list of all-grey entries has nowhere to move; the shake stays and no cue plays', async () => {
    on(['cursor']);
    const { commands, combatants } = await lulu('silence');
    const h = open('lulu', commands, combatants);
    walkTo('Black Magic');
    key('Enter');
    expect(h.menu.breadcrumbEl.textContent).toBe('Black Magic');
    const first = selected();
    key('ArrowDown');
    expect(selected()).toBe(first);
    key('Enter');
    expect(shaken(h.menu)).toBe(true);
    expect(playRefusal).not.toHaveBeenCalled();
  });
});

describe('the pure rule', () => {
  const row = (category: AvailableCommand['category'], enabled: boolean): AvailableCommand => ({ command: { kind: 'ability', id: category, targets: [] }, label: category, category, mpCost: 0, rank: 3, enabled, validTargets: [] });
  const groupOf = (category: AvailableCommand['category'], enabled: boolean) => buildTopRows([row(category, enabled)])[0]!;

  it('off: a group is enabled only if some entry is (as before)', () => {
    for (const c of ['skill', 'special', 'blackmagic', 'whitemagic', 'summon', 'overdrive', 'item'] as const) {
      expect(rowEnabled(groupOf(c, false)), c).toBe(false);
      expect(rowEnabled(groupOf(c, true)), c).toBe(true);
    }
  });

  it('on: the five opener categories are always enabled rows; Overdrive, Items and Switch are not openers', () => {
    on();
    for (const c of ['skill', 'special', 'blackmagic', 'whitemagic', 'summon'] as const) {
      const g = groupOf(c, false);
      expect(g.kind === 'group' && isOpenerGroup(g), c).toBe(true);
      expect(rowEnabled(g), c).toBe(true);
    }
    for (const c of ['overdrive', 'item'] as const) expect(rowEnabled(groupOf(c, false)), c).toBe(false);
    const sw = buildTopRows([{ command: { kind: 'switch', targets: [], extra: { outId: 'a', inId: 'b' } }, label: 'B', category: 'special', mpCost: 0, rank: 3, enabled: false, validTargets: [] }])[0]!;
    expect(sw.kind === 'group' && sw.role).toBe('switch');
    expect(rowEnabled(sw)).toBe(false);
  });

  it('the Switch row counts the bench; the one greyed placeholder row of an empty bench carries no count', () => {
    const swap = (inId: string, enabled: boolean): AvailableCommand => ({ command: { kind: 'switch', targets: [], extra: { outId: 'a', inId } }, label: inId || 'Switch', category: 'special', mpCost: 0, rank: 3, enabled, validTargets: [] });
    const four = buildTopRows([swap('auron', true), swap('wakka', true), swap('lulu', false), swap('rikku', true)])[0]!;
    expect(topRowVM(four).badge).toEqual({ kind: 'count', text: '×4' });
    const none = buildTopRows([swap('', false)])[0]!;
    expect(topRowVM(none).badge).toBeUndefined();
    expect(topRowVM(none).enabled).toBe(false);
  });

  it('the help line of an opener whose one entry is grey says it opens a list; off (and for a non-opener) it describes the entry', () => {
    const entry: AvailableCommand = { command: { kind: 'ability', id: 'scan', targets: [] }, label: 'Scan', category: 'skill', mpCost: 0, rank: 3, enabled: false, validTargets: [], help: 'Reveals an enemy' };
    const skill = buildTopRows([entry])[0]!;
    if (skill.kind !== 'group') throw new Error('a group');
    const live = { ...skill, items: [{ ...entry, enabled: true }] };
    const off = groupHelp(skill);
    const offLive = groupHelp(live);
    expect(off).not.toBe('Open the Skill menu.');
    expect(offLive).not.toBe('Open the Skill menu.');
    on();
    expect(groupHelp(skill)).toBe('Open the Skill menu.');
    expect(groupHelp(live)).toBe(offLive); // an enabled single entry is described as before
  });

  it('on with "openers" skipped: as off', () => {
    on(['openers']);
    expect(rowEnabled(groupOf('blackmagic', false))).toBe(false);
  });
});

describe('the Grand Summon picker draws an aeon the fight\'s script took as a greyed entry the cursor rests on and a confirm refuses (the game\'s list 5)', () => {
  const aeons = [
    { id: 'valefor', name: 'Valefor', storedGauge: 0, enabled: false },
    { id: 'ifrit', name: 'Ifrit', storedGauge: 0 },
    { id: 'ixion', name: 'Ixion', storedGauge: 0 },
  ];
  it('opens on the first enabled aeon, rests on the greyed one, ignores Enter there, and picks the next', async () => {
    const picked = openYunaGrandSummon(document.body, { aeons });
    const rows = (): Array<{ label: string; selected: boolean; disabled: boolean }> =>
      [...document.querySelectorAll('.ffx-mg-list__row')].map((r) => ({ label: r.firstChild?.textContent ?? '', selected: r.classList.contains('ffx-mg-list__row--selected'), disabled: r.classList.contains('ffx-mg-list__row--disabled') }));
    expect(rows()).toEqual([
      { label: 'Valefor', selected: false, disabled: true },
      { label: 'Ifrit', selected: true, disabled: false },
      { label: 'Ixion', selected: false, disabled: false },
    ]);
    key('ArrowUp');
    expect(rows()[0]).toEqual({ label: 'Valefor', selected: true, disabled: true });
    key('Enter');
    const settled = await Promise.race([picked.then(() => 'picked'), new Promise((r) => setTimeout(() => r('open'), 50))]);
    expect(settled).toBe('open'); // the confirm on the greyed aeon did nothing
    key('ArrowDown');
    key('Enter');
    await expect(picked).resolves.toEqual({ kind: 'yuna-grand-summon', grandSummon: { aeonId: 'ifrit' } });
  });
});

describe('what the HUD is handed does not decide the opener: Lulu\'s Silenced spells are the same rows on and off, only the HUD draws them differently', () => {
  it('the Black Magic rows of the engine are identical in both states', async () => {
    const engine = await engineFor('braskas-final-aeon');
    actor(engine, 'lulu').statuses.silence = { id: 'silence', turnsRemaining: 254 } as never;
    const black = (): string => JSON.stringify(menuOf(engine, 'lulu').filter((r) => r.category === 'blackmagic'));
    const off = black();
    on();
    expect(black()).toBe(off);
    expect(ctxOf(engine).rt.canEscape).toBe(false);
  });
});
