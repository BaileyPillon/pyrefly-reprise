/**
 * The Pay ladder of the player's Yojimbo (`src/engine/PayRows.ts`; **FFX only**: Mirror Aeons, Chapter XXVII, is the one chapter that fields him).
 *
 * The engine offers one Pay row whose `gilSpent` is 0, and the HUD has no amount screen, so a person who chose it paid nothing and lost him. The presenter turns that one row into one row per round
 * amount the party can pay and a last row for all of it. Pure: the rows of the engine's own menu in, rows out; and the engine's own Pay accepts every row the ladder makes and takes exactly what it says.
 */
import { describe, expect, it } from 'vitest';
import type { AbilityCommand, AvailableCommand } from '../../src/battle/common/types.ts';
import { PAY_AMOUNTS, aeonMenuRows, payRows, shortOrderLabels } from '../../src/engine/PayRows.ts';
import { ORDERS } from '../../src/battle/ffx/aeon-commands.ts';
import { PAY, Rig, SUMMON, build, yojimbo } from './helpers/ffxKRig.ts';
import { enemy, stats } from './ffx-fixtures.test.ts';

const payTemplate: AvailableCommand = {
  command: { kind: 'ability', id: 'yojimbo-pay', targets: [], gilSpent: 0 },
  label: 'Pay',
  category: 'aeon',
  mpCost: 0,
  rank: 3,
  enabled: true,
  validTargets: [],
  help: 'template',
};
const dismiss: AvailableCommand = { command: { kind: 'dismiss', targets: [] }, label: 'Dismiss', category: 'aeon', mpCost: 0, rank: 3, enabled: true, validTargets: [] };
const menu = (): AvailableCommand[] => [payTemplate, dismiss];

describe('payRows (pure)', () => {
  it('turns the one Pay row into one row per round amount the party can pay, and a last row for all of it, with Dismiss kept after them', () => {
    const rows = payRows(menu(), 1_500_000);
    expect(rows.map((r) => r.label)).toEqual(['Pay 1,000', 'Pay 10,000', 'Pay 100,000', 'Pay 1,000,000', 'Pay all (1,500,000)', 'Dismiss']);
    expect(rows.slice(0, 5).map((r) => (r.command as AbilityCommand).gilSpent)).toEqual([1_000, 10_000, 100_000, 1_000_000, 1_500_000]);
    for (const r of rows.slice(0, 5)) {
      expect(r.command).toMatchObject({ kind: 'ability', id: 'yojimbo-pay', targets: [] });
      expect([r.category, r.enabled, r.mpCost, r.rank]).toEqual(['aeon', true, 0, 3]);
      expect(r.help).toMatch(/gil/);
    }
    expect(rows.at(-1)).toBe(dismiss);
  });

  it('leaves out an amount the party cannot pay, and a gil that equals a round amount is "all" rather than a repeat', () => {
    expect(payRows(menu(), 50_000).map((r) => r.label)).toEqual(['Pay 1,000', 'Pay 10,000', 'Pay all (50,000)', 'Dismiss']);
    expect(payRows(menu(), 1_000_000).map((r) => r.label)).toEqual(['Pay 1,000', 'Pay 10,000', 'Pay 100,000', 'Pay all (1,000,000)', 'Dismiss']);
    expect(payRows(menu(), 500).map((r) => r.label)).toEqual(['Pay 500', 'Dismiss']);
    for (const gil of [500, 1_000, 5_000, 99_999, 1_500_000, 9_999_999]) {
      const amounts = payRows(menu(), gil).flatMap((r) => ((r.command as AbilityCommand).gilSpent !== undefined && r.command.kind === 'ability' ? [(r.command as AbilityCommand).gilSpent!] : []));
      expect(amounts.every((a) => a >= 1 && a <= gil), `${gil}`).toBe(true);
      expect(new Set(amounts).size, `${gil}: no amount twice`).toBe(amounts.length);
      expect(amounts.at(-1), `${gil}: the last is all of it`).toBe(gil);
    }
  });

  it('keeps the row, greyed with its reason, when the party has no gil; changes nothing in a menu with no Pay row (the same array comes back) or when the gil is unknown', () => {
    const none = payRows(menu(), 0);
    expect(none.map((r) => [r.label, r.enabled])).toEqual([['Pay', false], ['Dismiss', true]]);
    expect(none[0]!.disabledReason).toMatch(/no gil/);
    const other: AvailableCommand[] = [dismiss];
    expect(payRows(other, 1_500_000)).toBe(other);
    const m = menu();
    expect(payRows(m, undefined)).toBe(m);
  });

  it('does not touch the engine rows it was given', () => {
    const m = menu();
    payRows(m, 1_500_000);
    expect(m).toEqual([payTemplate, dismiss]);
    expect((payTemplate.command as AbilityCommand).gilSpent).toBe(0);
    expect(PAY_AMOUNTS).toEqual([1_000, 10_000, 100_000, 1_000_000]);
  });
});

describe('the Sisters\' order rows in short words', () => {
  const order = (id: string, label: string): AvailableCommand => ({ command: { kind: 'ability', id, targets: [] }, label, category: 'aeon', mpCost: 0, rank: 3, enabled: id === 'sister-order-combine', validTargets: [] });

  it('names every one of the engine\'s eight orders, and no label is longer than the column shows (fifteen letters)', () => {
    const rows = shortOrderLabels(ORDERS.map((o) => order(o.id, o.label)));
    expect(rows.map((r) => r.label)).toEqual(['Free choice', 'Repeat last', 'Attack order', 'Cindy: spells', 'Cindy: support', 'Combine powers', 'Sandy: support', 'Mindy: drain']);
    for (const r of rows) expect(r.label.length, r.label).toBeLessThanOrEqual(15);
  });

  it('changes nothing but the label of an order row (id, enabled, reason) and hands any other menu back as it was', () => {
    const combine = order('sister-order-combine', 'Combine for the Delta Attack');
    const [row] = shortOrderLabels([combine]);
    expect(row).toMatchObject({ label: 'Combine powers', enabled: true, command: { id: 'sister-order-combine' } });
    expect(combine.label).toBe('Combine for the Delta Attack');
    const plain = [dismiss];
    expect(shortOrderLabels(plain)).toBe(plain);
    expect(aeonMenuRows(plain, 1_500_000)).toBe(plain);
    expect(aeonMenuRows([payTemplate, dismiss], 1_500_000).map((r) => r.label)).toContain('Pay 100,000');
  });
});

describe('the engine takes exactly what each row says', () => {
  const solid = () => enemy({ id: 'dummy', stats: stats({ hp: 99999, maxHp: 99999, str: 1, agi: 1 }), immunities: { ko: 255 } });
  const GIL = 1_500_000;

  it("Yojimbo's own menu is Pay and Dismiss, the ladder of it carries a payment through the engine for every row, and the gil left is the gil less the row's amount", () => {
    const labels: string[] = [];
    for (let i = 0; i < 5; i++) {
      const rig = new Rig(build({ aeons: [yojimbo()], yojimbo: { compatibility: 0, hireAnswer: 1 }, gil: GIL }), [solid()], 3);
      rig.until('yuna');
      rig.submit(SUMMON('yojimbo'));
      const turn = rig.until('yojimbo');
      expect(rig.state.flags['yojimbo:gil']).toBe(GIL); // the screen's source of the gil
      const rows = payRows(turn.commands, rig.state.flags['yojimbo:gil'] as number);
      const row = rows.filter((r) => r.command.kind === 'ability' && r.command.id === 'yojimbo-pay')[i]!;
      labels.push(row.label);
      const amount = (row.command as AbilityCommand).gilSpent!;
      rig.submit(row.command);
      expect(rig.state.flags['yojimbo:gil'], row.label).toBe(GIL - amount);
    }
    expect(labels).toEqual(['Pay 1,000', 'Pay 10,000', 'Pay 100,000', 'Pay 1,000,000', 'Pay all (1,500,000)']);
  });

  it("the engine's own Pay row (the template) still pays nothing: that is why the ladder exists", () => {
    const rig = new Rig(build({ aeons: [yojimbo()], yojimbo: { compatibility: 0, hireAnswer: 1 }, gil: GIL }), [solid()], 3);
    rig.until('yuna');
    rig.submit(SUMMON('yojimbo'));
    const turn = rig.until('yojimbo');
    const template = turn.commands.find((r) => r.command.kind === 'ability' && r.command.id === 'yojimbo-pay')!;
    expect((template.command as AbilityCommand).gilSpent).toBe(0);
    expect(PAY(0)).toMatchObject({ gilSpent: 0 });
  });
});
