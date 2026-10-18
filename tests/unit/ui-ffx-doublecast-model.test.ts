/**
 * **Doublecast as two picks: the pure model, the words and the lock chip's place** (FFX only; Option A "Second round", decision queue item 103, delegated).
 * `src/ui/ffx/doublecastModel.ts`, `doublecastText.ts`, `doublecastLock.ts` and the advisor's label. No DOM: the menu itself is in `ui-ffx-doublecast-menu.test.ts`.
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { AnyCombatant, AvailableCommand, CombatantId, Command } from '../../src/battle/common/types.ts';
import type { DoublecastPick } from '../../src/battle/ffx/doublecast.ts';
import { wrappedGroup } from '../../src/ui/ffx/CommandMenuLogic.ts';
import { aimLabel, doublecastCommand, landingIndex, lockFirst, mpAfterSecond, noSecondSpell, openWrap, pendingMp, roundTwoGroup, unlockFirst } from '../../src/ui/ffx/doublecastModel.ts';
import { doublecastCrumb, doublecastHelp, doublecastLeadHelp } from '../../src/ui/ffx/doublecastText.ts';
import { placeLockChip } from '../../src/ui/ffx/doublecastLock.ts';
import { wrappedLabel } from '../../src/engine/tactics/advisor.ts';

const spell = (id: string, mpCost: number, enabled = true): AvailableCommand => ({
  command: { kind: 'ability', id, targets: [] },
  label: id[0]!.toUpperCase() + id.slice(1),
  category: 'blackmagic',
  mpCost,
  enabled,
  validTargets: ['pagoda-a', 'pagoda-b', 'boss'],
});
const wrapper: AvailableCommand = { command: { kind: 'ability', id: 'doublecast', targets: ['lulu'] }, label: 'Doublecast', category: 'special', mpCost: 0, enabled: true, validTargets: ['lulu'], wrapsCategory: 'blackmagic' };
const rows = [spell('fire', 4), spell('fira', 8), spell('firaga', 16), spell('blizzard', 4), spell('bio', 10)];
const commands: AvailableCommand[] = [wrapper, ...rows];

/** What the engine says for the given first spell at `mp`: second offered iff `pending + cost <= mp` (the engine's rule, restated here as the oracle; the UI has none). */
const picksAt = (mp: number, firstId: string): DoublecastPick[] => {
  const pending = rows.find((r) => (r.command as { id: string }).id === firstId)!.mpCost;
  return rows.map((r) => {
    const id = (r.command as { id: string }).id;
    const ok = pending + r.mpCost <= mp;
    return { id, name: r.label, mpCost: r.mpCost, first: { enabled: r.mpCost <= mp }, second: { enabled: ok, ...(ok ? {} : { reason: 'Not enough MP' as const }), pendingMp: pending, mpAfter: mp - pending - r.mpCost } };
  });
};

const combatants = {
  lulu: { id: 'lulu', name: 'Lulu', side: 'party', mp: 20 },
  'pagoda-a': { id: 'pagoda-a', name: 'Yu Pagoda', side: 'enemy' },
  boss: { id: 'boss', name: "Braska's Final Aeon", side: 'enemy' },
} as unknown as Record<CombatantId, AnyCombatant>;
const tagOf = (id: string): string | undefined => (id === 'pagoda-a' ? 'A' : undefined);

describe('openWrap', () => {
  it('opens round 1 on the rows of the wrapped category, as offered', () => {
    const wrap = openWrap(wrapper, commands, 'sub', 3)!;
    expect(wrap.round).toBe(1);
    expect(wrap.group.items.map((c) => c.label)).toEqual(['Fire', 'Fira', 'Firaga', 'Blizzard', 'Bio']);
    expect(wrap.group).toEqual(wrappedGroup(wrapper, commands));
    expect([wrap.back, wrap.backIndex]).toEqual(['sub', 3]);
  });
  it('is null when nothing in the list can be cast, or the row wraps nothing', () => {
    expect(openWrap(wrapper, commands.map((c) => ({ ...c, enabled: c === wrapper })), 'top', 0)).toBeNull();
    expect(openWrap({ ...wrapper, wrapsCategory: undefined as never }, commands, 'top', 0)).toBeNull();
  });
});

describe('round 2 takes the engine\'s verdict onto the rows and nothing else', () => {
  const wrap = openWrap(wrapper, commands, 'top', 0)!;

  it('copies enabled and the reason; keeps order and prices; the originals are untouched', () => {
    const group = roundTwoGroup(wrap.roundOne, picksAt(20, 'fira'));
    expect(group.items.map((c) => [c.label, c.enabled, c.mpCost, c.disabledReason ?? null])).toEqual([
      ['Fire', true, 4, null],
      ['Fira', true, 8, null],
      ['Firaga', false, 16, 'Not enough MP'],
      ['Blizzard', true, 4, null],
      ['Bio', true, 10, null],
    ]);
    expect(rows.every((r) => r.enabled)).toBe(true);
  });

  it('believes a verdict that contradicts the sums (it does not look at a price)', () => {
    const odd = picksAt(20, 'fira').map((p) => ({ ...p, second: { ...p.second!, enabled: p.id === 'firaga' } }));
    expect(roundTwoGroup(wrap.roundOne, odd).items.map((c) => c.enabled)).toEqual([false, false, true, false, false]);
  });

  it('without verdicts the rows stay as offered', () => {
    expect(roundTwoGroup(wrap.roundOne, null)).toBe(wrap.roundOne);
  });

  it('lockFirst brings round 2 back with the cursor on the spell just used; unlockFirst takes it back', () => {
    const first = { cmd: wrap.group.items[1]!, targets: ['pagoda-a'] };
    const { wrap: two, index } = lockFirst(wrap, first, picksAt(20, 'fira'));
    expect([two.round, index, two.first?.targets]).toEqual([2, 1, ['pagoda-a']]);
    const back = unlockFirst(two)!;
    expect([back.wrap.round, back.wrap.first, back.cmd, back.prefer]).toEqual([1, null, first.cmd, ['pagoda-a']]);
    expect(back.wrap.group).toBe(wrap.roundOne);
    expect(unlockFirst(wrap)).toBeNull();
  });
});

describe('landingIndex (fix a)', () => {
  const list = (on: boolean[]): AvailableCommand[] => on.map((e, i) => spell(`s${i}`, 1, e));
  it('stays on the row while it is offered', () => expect(landingIndex(list([true, true, true]), 1)).toBe(1));
  it('goes to the nearest offered row; a tie goes to the one above', () => {
    expect(landingIndex(list([true, true, false, true, true]), 2)).toBe(1);
    expect(landingIndex(list([false, false, false, true, true]), 1)).toBe(3);
    expect(landingIndex(list([true, false, false, false, false]), 4)).toBe(0);
  });
  it('keeps the row where it was when nothing is offered, and clamps a missing one', () => {
    expect(landingIndex(list([false, false, false]), 2)).toBe(2);
    expect(landingIndex(list([true, true]), -1)).toBe(0);
  });
  it('the dead end is "round 2 and nothing offered"', () => {
    const wrap = openWrap(wrapper, commands, 'top', 0)!;
    const two = lockFirst(wrap, { cmd: wrap.group.items[1]!, targets: ['boss'] }, picksAt(10, 'fira')).wrap;
    expect(noSecondSpell(two)).toBe(true);
    expect(noSecondSpell(wrap)).toBe(false);
  });
});

describe('the command both casts make, and the numbers beside it', () => {
  const wrap = openWrap(wrapper, commands, 'top', 0)!;
  const two = lockFirst(wrap, { cmd: wrap.group.items[1]!, targets: ['pagoda-a'] }, picksAt(20, 'fira')).wrap;

  it('doublecastCommand: the wrapper, targets [], and the two casts in order (AbilityCommand.casts)', () => {
    const cmd = doublecastCommand(two, two.group.items[3]!, ['boss']) as Command;
    expect(cmd).toEqual({ kind: 'ability', id: 'doublecast', targets: [], casts: [{ id: 'fira', targets: ['pagoda-a'] }, { id: 'blizzard', targets: ['boss'] }] });
    expect(doublecastCommand(wrap, wrap.group.items[0]!, ['boss'])).toBeNull(); // round 1 has no first pick
  });

  it('pendingMp is the card\'s MP less the engine\'s pending MP; mpAfterSecond is the engine\'s own', () => {
    expect(pendingMp(two, combatants['lulu'])).toEqual({ mp: 20, spent: 8, left: 12 });
    expect(pendingMp(wrap, combatants['lulu'])).toBeNull();
    expect(mpAfterSecond(two, two.group.items[3])).toBe(8);
    expect(mpAfterSecond(wrap, wrap.group.items[3])).toBeNull();
  });

  it('aimLabel: the name and the letter the field and the CTB list print; a spread names its side', () => {
    expect(aimLabel(['pagoda-a'], combatants, tagOf)).toBe('Yu Pagoda A');
    expect(aimLabel(['boss'], combatants, tagOf)).toBe("Braska's Final Aeon");
    expect(aimLabel(['boss', 'pagoda-a'], combatants, tagOf)).toBe('All enemies');
    expect(aimLabel([], combatants, tagOf)).toBe('');
  });
});

describe('the words (shapes of the approved frames; every sentence short enough for the slab\'s two lines)', () => {
  const wrap = openWrap(wrapper, commands, 'top', 0)!;
  const two = lockFirst(wrap, { cmd: wrap.group.items[1]!, targets: ['pagoda-a'] }, picksAt(20, 'fira')).wrap;
  const env = { combatants, tagOf };

  it('the header counts the round', () => {
    expect(doublecastCrumb(wrap)).toBe('Doublecast · 1 of 2');
    expect(doublecastCrumb(two)).toBe('Doublecast · 2 of 2');
  });

  it('round 1\'s list is one plain line: what Doublecast is, then the highlighted spell', () => {
    expect(doublecastLeadHelp(wrapper, 'Fire damage to one enemy')).toBe('Doublecast: two spells in one turn · Fire damage to one enemy');
    expect(doublecastLeadHelp(wrapper, '')).toBe('Doublecast: two spells in one turn');
    expect(doublecastHelp(wrap, 'list', wrap.group.items[0]!, combatants['lulu'], env)).toBeNull();
  });

  it('round 2\'s list: cast 1 over what is left', () => {
    const h = doublecastHelp(two, 'list', two.group.items[0]!, combatants['lulu'], env)!;
    expect(h).toEqual({
      chip: '1',
      head: 'Fira › Yu Pagoda A',
      mp: '8 MP',
      line2: [{ num: '12 MP' }, ' left. Choose the second cast.'],
      plain: '1 Fira › Yu Pagoda A, 8 MP. 12 MP left. Choose the second cast.',
      phone: { at: 'foot', text: '12 MP left after Fira. Choose the second cast.' },
    });
  });

  it('the target steps', () => {
    const t1 = doublecastHelp(wrap, 'target', wrap.group.items[1]!, combatants['lulu'], env)!;
    expect([t1.chip, t1.head, t1.plain]).toEqual(['1', 'Fira · 8 MP', '1 Fira · 8 MP. Pick a target for the first cast.']);
    const t2 = doublecastHelp(two, 'target', two.group.items[3]!, combatants['lulu'], env)!;
    expect([t2.chip, t2.head, t2.plain]).toEqual(['2', 'Blizzard · 4 MP', '2 Blizzard · 4 MP. Pick its target. 8 MP left after.']);
    expect(t2.phone).toEqual({ at: 'step', n: '2', text: 'Cast 2 · after 1 Fira › Yu Pagoda A' });
  });

  it('the dead end says so and names Esc (the phone: the title)', () => {
    const dead = lockFirst(wrap, { cmd: wrap.group.items[1]!, targets: ['pagoda-a'] }, picksAt(10, 'fira')).wrap;
    const h = doublecastHelp(dead, 'list', dead.group.items[1]!, { ...combatants['lulu'], mp: 10 } as AnyCombatant, env)!;
    expect(h.line2).toEqual(['No second spell fits. Esc goes back.']);
    expect(h.phone.text).toBe('No second spell fits. Tap the title to go back.');
  });

  it('every sentence is within the slab\'s two lines (about 38 characters), and no serif sentence starts on a numeral', () => {
    for (const h of [doublecastHelp(two, 'list', null, combatants['lulu'], env), doublecastHelp(two, 'target', two.group.items[3]!, combatants['lulu'], env), doublecastHelp(wrap, 'target', wrap.group.items[2]!, combatants['lulu'], env)]) {
      const text = h!.line2.map((p) => (typeof p === 'string' ? p : p.num)).join('');
      expect(text.length, text).toBeLessThanOrEqual(42);
      expect(typeof h!.line2[0] === 'string' && /^\d/.test(h!.line2[0]), 'the numerals live in the numeral face').toBe(false);
    }
  });
});

describe('the advisor card names both casts (fix e)', () => {
  const cmd = (extra: object): Command => ({ kind: 'ability', id: 'doublecast', targets: [], ...extra }) as Command;
  it('a pair of two picks: both spells', () => {
    expect(wrappedLabel(commands, wrapper, cmd({ casts: [{ id: 'fira', targets: ['boss'] }, { id: 'blizzard', targets: ['boss'] }] }))).toBe('Doublecast: Fira + Blizzard');
  });
  it('the older shape is the one spell twice, and says so', () => {
    expect(wrappedLabel(commands, wrapper, cmd({ wrappedId: 'firaga', targets: ['boss'] }))).toBe('Doublecast: Firaga + Firaga');
  });
  it('null for a spell that is not on the list, a half-known pair, and a command that is not a wrapper\'s', () => {
    expect(wrappedLabel(commands, wrapper, cmd({ wrappedId: 'holy' }))).toBeNull();
    expect(wrappedLabel(commands, wrapper, cmd({ casts: [{ id: 'fira', targets: [] }, { id: 'holy', targets: [] }] }))).toBeNull();
    expect(wrappedLabel(commands, wrapper, cmd({}))).toBeNull();
    expect(wrappedLabel(commands, rows[0]!, cmd({ wrappedId: 'fire' }))).toBeNull();
  });
});

describe('the lock chip\'s place (fix d)', () => {
  const chip = { w: 90, h: 32 };
  const bounds = { w: 1600, h: 900 };
  it('home is the top-left of the target\'s box', () => {
    expect(placeLockChip({ x: 571, y: 152, w: 238, h: 366 }, [], chip, bounds)).toEqual({ x: 573, y: 154 });
  });
  it('clear of the boss: a target whose top-left is the boss\'s torso takes the first clear place on its own box (the visible wedge)', () => {
    const boss = { x: 800, y: 100, w: 500, h: 420 }; // covers B's top-left
    const pagodaB = { x: 1226, y: 300, w: 200, h: 260 }; // B is mostly behind it: only the right wedge sticks out
    const at = placeLockChip(pagodaB, [boss], chip, bounds);
    expect(at.x).toBeGreaterThanOrEqual(boss.x + boss.w); // right of the boss's box
    expect(at.x).toBeGreaterThanOrEqual(pagodaB.x);
    expect(at.x + chip.w).toBeLessThanOrEqual(pagodaB.x + pagodaB.w);
    expect(at.y).toBeGreaterThanOrEqual(pagodaB.y);
  });
  it('beside the box when its own box has no clear place (above, then right, then left)', () => {
    const cover = { x: 1000, y: 310, w: 600, h: 400 };
    const target = { x: 1100, y: 300, w: 120, h: 200 };
    const at = placeLockChip(target, [cover], chip, bounds);
    expect(at).toEqual({ x: 1102, y: 300 - 32 - 2 }); // above its top-left, clear of the cover
  });
  it('never off the screen: with nowhere clear it stays home, clamped', () => {
    const everything = { x: 0, y: 0, w: 1600, h: 900 };
    expect(placeLockChip({ x: 1590, y: 5, w: 40, h: 50 }, [everything], chip, bounds)).toEqual({ x: 1510, y: 7 });
  });
});

describe('the HUD re-derives no cost rule (the engine\'s verdict is the only source)', () => {
  const read = (f: string): string => readFileSync(resolve(process.cwd(), 'src/ui/ffx', f), 'utf8');
  for (const file of ['doublecastModel.ts', 'DoublecastFlow.ts', 'doublecastText.ts', 'DoublecastHud.ts', 'doublecastLock.ts']) {
    it(`${file} imports nothing of the engine's rules and compares no MP`, () => {
      const src = read(file);
      const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
      for (const m of code.matchAll(/^import\s+(?!type\b)[^;]*from\s+'([^']+)'/gm)) expect(m[1], `${file} value-imports ${m[1]}`).not.toMatch(/battle\/(ffx|common\/(abilities|kernel))/);
      expect(code).not.toMatch(/\b(usableCost|mpCostFor|blockedBySilence|mpCost\()/);
      expect(code, 'no MP comparison').not.toMatch(/\bmp\w*\s*(<=|>=|<|>)\s*\w|\w\s*(<=|>=|<|>)\s*\bmp\w*/i);
    });
  }
});
