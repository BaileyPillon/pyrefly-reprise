// @vitest-environment jsdom
/**
 * **The FFX command menu's target step, HUD side** (re-parity RC11, lane "FFX target parity"; **FFX only**; switch `TARGET_STEP_PARITY`, default OFF; the engine half is
 * `parity-ffx-target-step.test.ts`, the handoff `docs/handoff/re-parity-rc11-ffx-target-parity.md`).
 *
 * The original (`FFX.exe`; `FFX-G11e`): a pick the resolver answers 0xFE pushes a target level that never looks at the candidate count and waits for the confirm key (0x89D390); the cursor opens where
 * the record says (0x898640, 0x89A58F); the side-switch bit lets L1 / R1 show the other side; an opener opens its list even with one entry.
 *
 * Driven through the real `CommandMenu` with real `KeyboardEvent`s, on hand-built rows (the edges) and on the rows the real FFX engine offers (Auron's Guard, Tidus's Phoenix Down).
 */

import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { AnyCombatant, AvailableCommand, CombatantId, Command } from '../../src/battle/common/types.ts';
import { setTargetStepParity, type TargetStepItem } from '../../src/battle/ffx/target-step-parity.ts';
import { CommandMenu } from '../../src/ui/ffx/CommandMenu.ts';
import { buildTopRows } from '../../src/ui/ffx/CommandMenuLogic.ts';
import { groupHelp } from '../../src/ui/ffx/commandMenuRows.ts';
import { ffxTargetMode } from '../../src/ui/ffx/loneTarget.ts';
import { opensList } from '../../src/ui/ffx/targetStepUi.ts';
import type { CursorSelection } from '../../src/ui/ffx/TargetCursor.ts';
import { actor, engineFor, menuOf } from './helpers/menuParityDrive.ts';

let restore: (() => void) | undefined;
const on = (skip: readonly TargetStepItem[] = []): void => {
  restore?.();
  restore = setTargetStepParity(true, skip);
};
const opened: CommandMenu[] = [];
afterEach(() => {
  for (const m of opened.splice(0)) m.close();
  restore?.();
  restore = undefined;
});
beforeEach(() => {
  document.body.innerHTML = '';
});
beforeAll(async () => {
  await engineFor('yunalesca');
});

const COMBATANTS = {
  tidus: { id: 'tidus', name: 'Tidus', side: 'party' },
  yuna: { id: 'yuna', name: 'Yuna', side: 'party' },
  auron: { id: 'auron', name: 'Auron', side: 'party' },
  boss: { id: 'boss', name: 'Boss', side: 'enemy' },
  fiend: { id: 'fiend', name: 'Fiend', side: 'enemy' },
} as unknown as Record<CombatantId, AnyCombatant>;
const X: Record<string, number> = { tidus: 40, yuna: 160, auron: 280, boss: 400, fiend: 520 };

const key = (code: string): void => {
  window.dispatchEvent(new KeyboardEvent('keydown', { code, bubbles: true, cancelable: true }));
};
const selected = (): string => document.querySelector('.ig-cmd--selected .ffx-cmd__label')?.textContent ?? '';

interface Opened {
  menu: CommandMenu;
  seen: Array<CursorSelection | null>;
  result: () => Command | null | undefined;
  /** Await after the committing key: the menu's promise resolves a microtask later. */
  flush: () => Promise<void>;
}
function open(actorId: string, commands: AvailableCommand[], combatants: Record<CombatantId, AnyCombatant> = COMBATANTS): Opened {
  const menu = new CommandMenu();
  opened.push(menu);
  menu.setProjector((id) => ({ x: X[id] ?? 700, y: 300, w: 100, h: 260 }));
  document.body.append(menu.stackEl, menu.breadcrumbEl, menu.targetCursor.el);
  const seen: Array<CursorSelection | null> = [];
  let result: Command | null | undefined;
  const done = menu
    .open({ actorId, commands, previewRank: () => [], combatants, setHelp: () => undefined, onSelection: (s) => seen.push(s) })
    .then((c) => {
      result = c;
    });
  void done;
  return { menu, seen, result: () => result, flush: async () => { await Promise.resolve(); await Promise.resolve(); } };
}
const row = (over: Partial<AvailableCommand> & Pick<AvailableCommand, 'label' | 'command'>): AvailableCommand => ({ category: 'special', mpCost: 0, enabled: true, validTargets: [], ...over });

const GUARD = row({ label: 'Guard', command: { kind: 'ability', id: 'guard', targets: [] }, targeting: 'self', validTargets: ['auron'] });
const GUARD_STEP: AvailableCommand = { ...GUARD, targetStep: { candidates: ['auron'], start: 'auron' } };
const ATTACK = row({ label: 'Attack', category: 'attack', command: { kind: 'attack', targets: [] }, targeting: 'single-enemy', validTargets: ['boss', 'fiend'] });

describe('ffxTargetMode', () => {
  it('reads targetStep when the engine published one, and the old rule when it did not', () => {
    expect(ffxTargetMode(GUARD)).toEqual({ mode: 'auto', targets: ['auron'] });
    expect(ffxTargetMode(GUARD_STEP)).toEqual({ mode: 'choose', candidates: ['auron'] });
    expect(ffxTargetMode({ ...GUARD_STEP, targetStep: { candidates: ['tidus', 'yuna'], group: true } })).toEqual({ mode: 'all', targets: ['tidus', 'yuna'] });
    expect(ffxTargetMode({ ...GUARD_STEP, command: { kind: 'ability', id: 'guard', targets: ['auron'] } }).mode).toBe('none'); // a resolved command is never aimed
  });
});

describe('t1 selfStep by real keys: Guard (Auron)', () => {
  it('off: Enter commits Guard at once', async () => {
    const h = open('auron', [GUARD]);
    key('Enter');
    await h.flush();
    expect(h.result()).toEqual({ kind: 'ability', id: 'guard', targets: ['auron'] });
  });

  it('on: Enter opens a cursor on Auron and waits; the second Enter commits; Escape backs out', async () => {
    const h = open('auron', [GUARD_STEP]);
    key('Enter');
    expect(h.result()).toBeUndefined();
    expect(h.seen.at(-1)?.activeId).toBe('auron');
    expect(h.seen.at(-1)?.kind).toBe('self');
    key('Escape');
    expect(h.seen.at(-1)).toBeNull();
    expect(h.result()).toBeUndefined();
    key('Enter');
    expect(h.seen.at(-1)?.activeId).toBe('auron');
    key('Enter');
    await h.flush();
    expect(h.result()).toEqual({ kind: 'ability', id: 'guard', targets: ['auron'] });
  });

  it('on: a talk step opens on the foe and commits the foe as the trigger\'s target', async () => {
    const talk = row({ label: 'Talk', category: 'special', command: { kind: 'trigger', id: 'talk', targets: [] }, targeting: 'self', validTargets: ['tidus'], targetStep: { candidates: ['boss'], start: 'boss' } });
    const h = open('tidus', [talk]);
    key('Enter');
    expect(h.seen.at(-1)?.activeId).toBe('boss');
    key('Enter');
    await h.flush();
    expect(h.result()).toEqual({ kind: 'trigger', id: 'talk', targets: ['boss'] });
  });

  it('on: a group step (Combine powers) rings every ally and one Enter confirms them all', async () => {
    const combine = row({ label: 'Combine', category: 'aeon', command: { kind: 'ability', id: 'sister-order-combine', targets: [] }, targetStep: { candidates: ['tidus', 'yuna', 'auron'], start: 'yuna', group: true } });
    const h = open('yuna', [combine]);
    key('Enter');
    expect(h.result()).toBeUndefined();
    expect(h.seen.at(-1)?.mode).toBe('all');
    expect(h.seen.at(-1)?.ids).toEqual(['tidus', 'yuna', 'auron']);
    key('Enter');
    await h.flush();
    expect(h.result()).toEqual({ kind: 'ability', id: 'sister-order-combine', targets: ['tidus', 'yuna', 'auron'] });
  });

  it('the Defend hot key (Q) commits at once even if its row somehow carried a step (the game bypasses the resolver, 0x78FB80)', async () => {
    const defend = row({ label: 'Defend', category: 'special', command: { kind: 'defend', targets: [] }, targeting: 'self', validTargets: ['tidus'], targetStep: { candidates: ['tidus'], start: 'tidus' } });
    const h = open('tidus', [ATTACK, defend]);
    key('KeyQ');
    await h.flush();
    expect(h.result()).toEqual({ kind: 'defend', targets: ['tidus'] });
  });
});

describe('t2 overdriveStep by real keys: a random-foe Overdrive against one foe', () => {
  const sd = row({ label: 'Slice & Dice', category: 'overdrive', command: { kind: 'overdrive', id: 'slice-and-dice', targets: [] }, targeting: 'random-enemy', validTargets: ['boss'] });
  it('off: commits at once with the one foe', async () => {
    const h = open('tidus', [sd]);
    key('Enter');
    await h.flush();
    expect(h.result()).toEqual({ kind: 'overdrive', id: 'slice-and-dice', targets: ['boss'] });
  });
  it('on: opens a cursor on the foe and waits', async () => {
    const h = open('tidus', [{ ...sd, targetStep: { candidates: ['boss'], start: 'boss' } }]);
    key('Enter');
    expect(h.result()).toBeUndefined();
    expect(h.seen.at(-1)?.activeId).toBe('boss');
    key('Enter');
    await h.flush();
    expect(h.result()).toEqual({ kind: 'overdrive', id: 'slice-and-dice', targets: ['boss'] });
  });
});

describe('t3 cursorStart by real keys: where the cursor opens', () => {
  const potion = row({ label: 'Potion', category: 'item', command: { kind: 'item', id: 'potion', targets: [] }, targeting: 'single-ally', validTargets: ['tidus', 'yuna', 'auron'] });
  it('off: the leftmost ally on screen (Tidus) for Yuna\'s potion; on: Yuna herself', () => {
    const off = open('yuna', [potion]);
    key('Enter');
    key('Enter');
    expect(off.seen.find((s) => s !== null)?.activeId).toBe('tidus');
    for (const m of opened.splice(0)) m.close();
    document.body.innerHTML = '';
    const h = open('yuna', [{ ...potion, targetStep: { candidates: ['tidus', 'yuna', 'auron'], start: 'yuna' } }]);
    key('Enter');
    key('Enter');
    expect(h.seen.find((s) => s !== null)?.activeId).toBe('yuna');
  });

  it('on: a foe-first command opens on the start id, not the leftmost foe', () => {
    const h = open('tidus', [{ ...ATTACK, targetStep: { candidates: ['boss', 'fiend'], start: 'fiend' } }]);
    key('Enter');
    expect(h.seen.at(-1)?.activeId).toBe('fiend');
  });

  it('on: a step without a start leaves the engine\'s old hint in charge', () => {
    const h = open('tidus', [{ ...ATTACK, preferredTargets: ['fiend'], targetStep: { candidates: ['boss', 'fiend'] } }]);
    key('Enter');
    expect(h.seen.at(-1)?.activeId).toBe('fiend');
  });
});

describe('t5 sideSwitch by real keys: L1 / R1 in the target step', () => {
  const attack = { ...ATTACK, targetStep: { candidates: ['boss', 'fiend'], start: 'boss', switchTo: ['tidus', 'yuna', 'auron'] } } as AvailableCommand;
  it('F (L1) shows the party, opening on its first; Enter commits the ally; R shows the foes again', async () => {
    const h = open('tidus', [attack]);
    key('Enter');
    expect(h.seen.at(-1)?.activeId).toBe('boss');
    key('KeyF');
    expect(h.seen.at(-1)?.activeId).toBe('tidus');
    key('ArrowRight');
    expect(h.seen.at(-1)?.activeId).toBe('yuna');
    key('KeyR');
    expect(h.seen.at(-1)?.activeId).toBe('boss');
    key('KeyF');
    key('Enter');
    await h.flush();
    expect(h.result()).toEqual({ kind: 'attack', targets: ['tidus'] });
  });

  it('a row with no switchTo ignores L1 / R1; a group step ignores them too; Escape resets the side', () => {
    const plain = open('tidus', [{ ...ATTACK, targetStep: { candidates: ['boss', 'fiend'], start: 'boss' } }]);
    key('Enter');
    key('KeyF');
    expect(plain.seen.at(-1)?.activeId).toBe('boss');
    for (const m of opened.splice(0)) m.close();
    document.body.innerHTML = '';
    const h = open('tidus', [attack]);
    key('Enter');
    key('KeyF');
    key('Escape');
    key('Enter');
    expect(h.seen.at(-1)?.activeId).toBe('boss'); // the second step opens on the row\'s own side again
  });
});

describe('t6 openerOne by real keys: a one-entry opener opens its list', () => {
  const od = row({ label: 'Slice & Dice', category: 'overdrive', command: { kind: 'overdrive', id: 'slice-and-dice', targets: [] }, targeting: 'single-enemy', validTargets: ['boss'] });
  const shield = row({ label: 'Shield', category: 'aeon', command: { kind: 'ability', id: 'shield', targets: [] }, targeting: 'self', validTargets: ['tidus'] });

  it('off: Enter on Overdrive goes straight to the target step', () => {
    const h = open('tidus', [ATTACK, od]);
    key('ArrowDown');
    expect(selected()).toBe('Overdrive');
    key('Enter');
    expect(h.menu.breadcrumbEl.hidden).toBe(true);
    expect(h.seen.at(-1)?.activeId).toBe('boss');
  });

  it('on: Enter on Overdrive opens a list of one; the next Enter reaches the target step; Escape returns to the top', () => {
    on(['selfStep']);
    const h = open('tidus', [ATTACK, od]);
    key('ArrowDown');
    key('Enter');
    expect(h.menu.breadcrumbEl.hidden).toBe(false);
    expect(h.menu.breadcrumbEl.textContent).toBe('Overdrive');
    expect(selected()).toBe('Slice & Dice');
    expect(h.seen.at(-1) ?? null).toBeNull();
    key('Escape');
    expect(h.menu.breadcrumbEl.hidden).toBe(true);
    key('Enter');
    key('Enter');
    expect(h.seen.at(-1)?.activeId).toBe('boss');
  });

  it('the item skipped, the switch off, an aeon group and the Switch role all keep their behaviour', () => {
    on(['openerOne']);
    const a = open('tidus', [ATTACK, od]);
    key('ArrowDown');
    key('Enter');
    expect(a.menu.breadcrumbEl.hidden).toBe(true);
    for (const m of opened.splice(0)) m.close();
    document.body.innerHTML = '';
    on();
    const b = open('tidus', [ATTACK, shield]);
    key('ArrowDown');
    key('Enter');
    expect(b.menu.breadcrumbEl.hidden).toBe(true); // the aeon group is not an opener in the original
  });

  it('the group row\'s help line says it opens a menu (not the entry\'s own help) while the item is on', () => {
    const group = buildTopRows([ATTACK, od]).find((r) => r.kind === 'group');
    if (group?.kind !== 'group') throw new Error('no group');
    const old = groupHelp(group, 'tidus');
    on();
    expect(groupHelp(group, 'tidus')).toBe('Open the Overdrive menu.');
    expect(groupHelp(group, 'valefor')).toBe(old); // an aeon's Overdrive is a direct command: its own help line, as before
    restore?.();
    restore = undefined;
    expect(groupHelp(group, 'tidus')).toBe(old);
  });
});

describe('t6 openerOne, check B1 (2026-10-18): the Overdrive group is a list opener only for Tidus, Kimahri, Auron, Wakka and Lulu', () => {
  const group = (category: 'overdrive' | 'special' | 'aeon' | 'item', role?: 'switch') => {
    const items = [row({ label: 'Only', category, command: { kind: 'overdrive', id: 'only', targets: [] } })];
    return { kind: 'group' as const, category, label: category, items, ...(role ? { role } : {}) };
  };

  it("opensList: the five characters' Overdrive group opens a list; an aeon, Yuna (Grand Summon), Rikku (Mix) and an unknown user do not", () => {
    on();
    for (const who of ['tidus', 'kimahri', 'auron', 'wakka', 'lulu']) expect(opensList(group('overdrive'), who), who).toBe(true);
    for (const who of ['yuna', 'rikku', 'valefor', 'ixion', 'ifrit', 'shiva', 'bahamut', 'anima', 'cindy', undefined]) expect(opensList(group('overdrive'), who), String(who)).toBe(false);
  });

  it('opensList: every other opener category opens for anyone; the aeon group, the Switch role, the skipped item and the switch off never do', () => {
    on();
    for (const who of ['tidus', 'yuna', 'rikku', 'valefor', undefined]) {
      expect(opensList(group('special'), who), String(who)).toBe(true);
      expect(opensList(group('item'), who), String(who)).toBe(true);
      expect(opensList(group('aeon'), who), String(who)).toBe(false);
      expect(opensList(group('overdrive', 'switch'), 'tidus'), String(who)).toBe(false);
    }
    on(['openerOne']);
    expect(opensList(group('overdrive'), 'tidus')).toBe(false);
    expect(opensList(group('special'), 'tidus')).toBe(false);
    restore?.();
    restore = undefined;
    expect(opensList(group('overdrive'), 'tidus')).toBe(false);
    expect(opensList(group('special'), 'tidus')).toBe(false);
  });

  /** The rows the real engine offers `id` with a full gauge, for the real menu. */
  const withGauge = (engine: Awaited<ReturnType<typeof engineFor>>, id: string): AvailableCommand[] => {
    actor(engine, id).overdrive!.gauge = 100;
    return menuOf(engine, id);
  };
  const openOverdrive = (actorId: string, rows: AvailableCommand[], engine: Awaited<ReturnType<typeof engineFor>>): Opened => {
    const h = open(actorId, rows, engine.state().combatants as Record<CombatantId, AnyCombatant>);
    for (let i = 0; i < 12 && selected() !== 'Overdrive'; i += 1) key('ArrowDown');
    expect(selected()).toBe('Overdrive');
    key('Enter');
    return h;
  };

  it("real engine rows: Tidus' one-entry Overdrive group (Spiral Cut) opens a list of one", async () => {
    const engine = await engineFor('seymour-flux');
    on();
    const rows = withGauge(engine, 'tidus');
    expect(buildTopRows(rows).filter((r) => r.kind === 'group' && r.category === 'overdrive').map((r) => (r.kind === 'group' ? r.items.length : 0))).toEqual([1]);
    const h = openOverdrive('tidus', rows, engine);
    expect(h.menu.breadcrumbEl.hidden).toBe(false);
    expect(h.menu.breadcrumbEl.textContent).toBe('Overdrive');
    expect(selected()).toBe('Spiral Cut');
  });

  it("real engine rows: Yuna's Grand Summon and Rikku's Mix are the openers themselves (our existing pickers): no extra list, the command goes out", async () => {
    const engine = await engineFor('seymour-anima-macalania');
    on();
    for (const [who, label] of [['yuna', 'Grand Summon'], ['rikku', 'Mix']] as const) {
      for (const m of opened.splice(0)) m.close();
      document.body.innerHTML = '';
      const rows = withGauge(engine, who);
      const group = buildTopRows(rows).find((r) => r.kind === 'group' && r.category === 'overdrive');
      expect(group?.kind === 'group' ? group.items.map((i) => i.label) : null, who).toEqual([label]);
      const h = openOverdrive(who, rows, engine);
      expect(h.menu.breadcrumbEl.hidden, who).toBe(true);
      await h.flush();
      expect(h.result(), who).toMatchObject({ kind: 'overdrive' });
    }
  });

  it("real engine rows: an aeon's Overdrive (Valefor's Energy Ray) is a direct command: the target step opens at once, no list", async () => {
    const engine = await engineFor('yunalesca');
    let rows: AvailableCommand[] | undefined;
    for (let i = 0; i < 60 && !rows; i += 1) {
      const d = engine.nextDecision();
      if (d.kind === 'resolved' || d.kind === 'waiting') continue;
      if (d.kind === 'battle-over') break;
      if (d.actorId === 'valefor') {
        rows = withGauge(engine, 'valefor');
        break;
      }
      const summon = d.actorId === 'yuna' ? d.commands.find((c) => c.command.kind === 'summon' && c.command.id === 'valefor') : undefined;
      engine.submit(summon ? { ...summon.command, targets: [] } : { kind: 'defend', targets: [] });
    }
    if (!rows) throw new Error('no aeon turn');
    on();
    const group = buildTopRows(rows).find((r) => r.kind === 'group' && r.category === 'overdrive');
    expect(group?.kind === 'group' ? group.items.map((i) => i.label) : null).toEqual(['Energy Ray']);
    const h = openOverdrive('valefor', rows, engine);
    expect(h.menu.breadcrumbEl.hidden).toBe(true);
    expect(h.seen.at(-1)?.activeId).toBeTruthy(); // the foe cursor (the target step) is up; the same Enter did not stop on a list
  });
});

describe('real engine rows, driven through the real menu', () => {
  it('Auron\'s Guard (Yunalesca): Special list, Guard, a cursor on Auron, Enter commits', async () => {
    const engine = await engineFor('yunalesca');
    on();
    const rows = menuOf(engine, 'auron');
    const combatants = engine.state().combatants as Record<CombatantId, AnyCombatant>;
    const h = open('auron', rows, combatants);
    for (let i = 0; i < 12 && selected() !== 'Special'; i += 1) key('ArrowDown');
    expect(selected()).toBe('Special');
    key('Enter');
    for (let i = 0; i < 12 && selected() !== 'Guard'; i += 1) key('ArrowDown');
    expect(selected()).toBe('Guard');
    key('Enter');
    expect(h.result()).toBeUndefined();
    expect(h.seen.at(-1)?.activeId).toBe('auron');
    key('Enter');
    await h.flush();
    expect(h.result()).toMatchObject({ kind: 'ability', id: 'guard', targets: ['auron'] });
  });

  /** Open the real menu for `actorId`, walk to Items -> Phoenix Down, Enter; who the cursor opens on. */
  async function phoenixStart(engine: Awaited<ReturnType<typeof engineFor>>, actorId: string, parity: boolean): Promise<string | undefined> {
    for (const m of opened.splice(0)) m.close();
    document.body.innerHTML = '';
    restore?.();
    restore = undefined;
    if (parity) on();
    const combatants = engine.state().combatants as Record<CombatantId, AnyCombatant>;
    const h = open(actorId, menuOf(engine, actorId), combatants);
    for (let i = 0; i < 12 && selected() !== 'Items'; i += 1) key('ArrowDown');
    key('Enter');
    for (let i = 0; i < 20 && selected() !== 'Phoenix Down'; i += 1) key('ArrowDown');
    key('Enter');
    return h.seen.at(-1)?.activeId ?? undefined;
  }

  it('t4: a revive with nobody KO\x27d opens on the caster (Auron\x27s Phoenix Down), where the old rule opened on the leftmost ally', async () => {
    const engine = await engineFor('yunalesca');
    expect(await phoenixStart(engine, 'auron', false)).toBe('tidus');
    expect(await phoenixStart(engine, 'auron', true)).toBe('auron');
  });

  it('t3: a revive opens on the first KO\x27d ally in party order (Yuna, with Yuna and Auron down); the old rule\x27s leftmost-of-the-fallen is the same here', async () => {
    const engine = await engineFor('yunalesca');
    for (const id of ['yuna', 'auron']) {
      const c = actor(engine, id);
      c.hp = 0;
      c.alive = false;
      c.statuses.ko = { id: 'ko', turnsRemaining: 254 } as never;
    }
    expect(await phoenixStart(engine, 'tidus', true)).toBe('yuna');
    expect(await phoenixStart(engine, 'tidus', false)).toBe('yuna');
  });
});
