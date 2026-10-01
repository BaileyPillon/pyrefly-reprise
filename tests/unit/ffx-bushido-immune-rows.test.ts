/**
 * r34fix-od5 (FFX only): the engine picks a clean Bushido's (Immune) row itself, **per target**,
 * from each target's own immunities, and Tornado's timer is 3 s.
 *
 * Sources: `research/ffx-combat-core.md` §5.5 (rows `[verified: 2 sources]`) and
 * `research/ffx-overdrive-input-rules-2026-09-30.md`: Q2 item 1, the Immune row only on a successful
 * input against a rider-immune target `[verified: 4 sources]`; riders Dragon Fang weak Delay,
 * Shooting Star Eject, Banishing Blade all four Breaks `[verified: 3 sources]`. Bailey's picks,
 * 2026-10-01, all our estimates: Banishing Blade's Immune row only when immune to **all four** Breaks
 * (D-310), immunity decided **per target** (D-311), Tornado's timer 3 s (D-312, D1).
 *
 * Every damage assertion drives the real engine with the Overdrive command and its minigame result
 * attached, the path a player's input takes.
 */

import { describe, expect, it } from 'vitest';
import type { AbilityDef, BattleEvent, Command, Decision, EnemyDef, MinigameResult, StatusId } from '../../src/battle/common/types.ts';
import { FFXContentRegistry, createFFXEngine } from '../../src/battle/ffx/index.ts';
import { immuneToRider, rowFromExtra } from '../../src/battle/ffx/overdriveShape.ts';
import { ABILITIES as AURON } from '../../src/data/ffx/abilities/overdrive-auron.ts';
import { seymourAnimaMacalaniaGroup } from '../../src/data/ffx/enemies/seymour-anima-macalania.ts';
import { attackAbility, enemy, fighter, member, party, setup } from './ffx-fixtures.test.ts';

type Foe = Partial<EnemyDef>;
type Run = { log: BattleEvent[]; dmg: Record<string, number[]>; statuses: Record<string, StatusId[]>; ctb: Record<string, number> };

const BREAKS: StatusId[] = ['power-break', 'magic-break', 'armor-break', 'mental-break'];
const ALL_BREAKS: Foe = { immunities: Object.fromEntries(BREAKS.map((b) => [b, 255])) };
const DELAY: Foe = { immunityFlags: ['immune-to-delay'] };
const EJECT: Foe = { immunities: { eject: 255 } };

const clean: MinigameResult = { kind: 'auron-sequence', sequence: { success: true, correctInputs: 7, timeRemainingMs: 0 } };
const failed: MinigameResult = { kind: 'auron-sequence', sequence: { success: false, correctInputs: 3, timeRemainingMs: 0 } };

/** Auron fires `def` at `dummy` (all-enemies rows reach both) on a seeded board of two 99 999 HP dummies. */
function fire(def: AbilityDef, result: MinigameResult, foe1: Foe = {}, foe2: Foe = {}, seed = 1): Run {
  const reg = new FFXContentRegistry();
  reg.addAbilities([attackAbility(), def]);
  const engine = createFFXEngine({ content: reg });
  engine.setSeed(seed);
  const od = { gauge: 100, mode: 'stoic' as const, unlockedModes: ['stoic' as const], unlockedOverdriveIds: [def.id] };
  engine.init(
    setup({
      party: party({ members: [member({ id: 'tidus' }), member({ id: 'auron', overdrive: od }), member({ id: 'yuna' })], activeSlots: ['tidus', 'auron', 'yuna'] }),
      enemies: { id: 'g', game: 'ffx', enemies: [enemy({ id: 'dummy', hp: 99_999, ...foe1 }), enemy({ id: 'dummy2', slot: 1, hp: 99_999, ...foe2 })] },
    }),
  );
  for (let i = 0; i < 200; i++) {
    const d: Decision = engine.nextDecision();
    if (d.kind === 'resolved') continue;
    if (d.kind !== 'player-input') throw new Error(`unexpected ${d.kind}`);
    if (d.actorId === 'auron') break;
    engine.submit({ kind: 'attack', targets: ['dummy'] });
  }
  const before = engine.state().log.length;
  const ctb0 = Object.fromEntries(['dummy', 'dummy2'].map((id) => [id, engine.predictTurnOrder(30).find((p) => p.actorId === id)?.tickValue ?? -1]));
  const cmd: Command = { kind: 'overdrive', id: def.id, targets: ['dummy'], extra: result };
  for (let i = 0; i < 5 && !engine.state().log.slice(before).some((e) => e.type === 'action-end'); i++) engine.submit(cmd);
  const all = engine.state().log.slice(before);
  const log = all.slice(0, all.findIndex((e) => e.type === 'action-end') + 1);
  const run: Run = { log, dmg: {}, statuses: {}, ctb: {} };
  for (const e of log) {
    if (e.type === 'damage' && e.sourceId === 'auron') (run.dmg[e.targetId] ??= []).push(e.amount);
    if (e.type === 'status-add') (run.statuses[e.targetId] ??= []).push(e.status);
  }
  for (const id of ['dummy', 'dummy2']) run.ctb[id] = (engine.predictTurnOrder(30).find((p) => p.actorId === id)?.tickValue ?? -1) - (ctb0[id] ?? 0);
  return run;
}

const sum = (xs: number[] = []): number => xs.reduce((a, b) => a + b, 0);
/** DmgCon scales damage linearly; floors in the chain leave a couple of points of slack. */
const near = (actual: number, expected: number): void => expect(Math.abs(actual - expected)).toBeLessThanOrEqual(3);

describe('Dragon Fang: the Immune row is chosen per target [D-311]', () => {
  const df = AURON['dragon-fang']!;
  it('a mixed group: the Delay-immune foe takes 19 DmgCon, the other 17 DmgCon and the Delay', () => {
    const plain = fire(df, clean);
    const mixed = fire(df, clean, DELAY, {});
    near(sum(mixed.dmg['dummy']), (sum(plain.dmg['dummy']) * 19) / 17);
    expect(mixed.dmg['dummy2']).toEqual(plain.dmg['dummy2']); // the success row, to the point
    expect(mixed.ctb['dummy2']).toBe(plain.ctb['dummy2']); // the weak Delay still lands on it
    expect(mixed.ctb['dummy2']).toBeGreaterThan(mixed.ctb['dummy']!);
  });

  it('the other way round, and both immune', () => {
    const plain = fire(df, clean);
    const swapped = fire(df, clean, {}, DELAY);
    expect(swapped.dmg['dummy']).toEqual(plain.dmg['dummy']);
    near(sum(swapped.dmg['dummy2']), (sum(plain.dmg['dummy2']) * 19) / 17);
    const both = fire(df, clean, DELAY, DELAY);
    near(sum(both.dmg['dummy']) + sum(both.dmg['dummy2']), ((sum(plain.dmg['dummy']) + sum(plain.dmg['dummy2'])) * 19) / 17);
  });

  it('draws no extra RNG: the mixed log is the plain log with one number changed', () => {
    const plain = fire(df, clean);
    const mixed = fire(df, clean, DELAY, {});
    expect(mixed.log.length).toBe(plain.log.length);
    const strip = (r: Run): unknown[] => r.log.map((e) => (e.type === 'damage' && e.targetId === 'dummy' ? { ...e, amount: 0, crit: false } : e));
    expect(strip(mixed)).toEqual(strip(plain));
  });
});

describe('Shooting Star: Eject immunity selects the Immune row', () => {
  const ss = AURON['shooting-star']!;
  it('immune to Eject: 27 DmgCon and no status; not immune: 24 DmgCon and Eject lands', () => {
    const plain = fire(ss, clean);
    const immune = fire(ss, clean, EJECT);
    near(sum(immune.dmg['dummy']), (sum(plain.dmg['dummy']) * 27) / 24);
    expect(immune.statuses['dummy'] ?? []).not.toContain('eject');
    expect(plain.statuses['dummy']).toContain('eject');
  });
});

describe('Banishing Blade: all four Breaks, or the success row [D-310]', () => {
  const bb = AURON['banishing-blade']!;
  it('immune to all four Breaks: 30 DmgCon, no Break', () => {
    const plain = fire(bb, clean);
    const immune = fire(bb, clean, ALL_BREAKS);
    near(sum(immune.dmg['dummy']), (sum(plain.dmg['dummy']) * 30) / 28);
    expect(immune.statuses['dummy'] ?? []).toEqual([]);
    expect(plain.statuses['dummy']).toEqual(BREAKS);
  });

  for (const [n, immuneTo] of [[1, ['power-break']], [2, ['magic-break', 'armor-break']], [3, ['power-break', 'magic-break', 'mental-break']]] as const) {
    it(`immune to ${n} of the four: the success row, and the other ${4 - n} Breaks still land`, () => {
      const plain = fire(bb, clean);
      const partial = fire(bb, clean, { immunities: Object.fromEntries(immuneTo.map((b) => [b, 255])) });
      expect(partial.dmg['dummy']).toEqual(plain.dmg['dummy']);
      expect(partial.statuses['dummy']).toEqual(BREAKS.filter((b) => !(immuneTo as readonly StatusId[]).includes(b)));
    });
  }

  it("Seymour (Macalania), shipped data: Power Break immune, so Magic, Armor and Mental Break land on the success row", () => {
    const seymour = seymourAnimaMacalaniaGroup.enemies.find((e) => e.id === 'seymour-macalania')!;
    const foe: Foe = { immunities: { ...seymour.immunities }, immunityFlags: [...seymour.immunityFlags] };
    const plain = fire(bb, clean);
    const run = fire(bb, clean, foe);
    expect(run.dmg['dummy']).toEqual(plain.dmg['dummy']);
    expect(run.statuses['dummy']).toEqual(['magic-break', 'armor-break', 'mental-break']);
  });
});

describe('a failed input never uses the Immune row', () => {
  for (const [id, foe] of [['dragon-fang', DELAY], ['shooting-star', EJECT], ['banishing-blade', ALL_BREAKS]] as const) {
    it(`${id}: a fail on an immune foe deals exactly the Fail row it deals on any foe`, () => {
      const def = AURON[id]!;
      expect(fire(def, failed, foe, foe).dmg).toEqual(fire(def, failed).dmg);
    });
  }
});

describe('immuneToRider and the Immune row itself', () => {
  it('reads the target: Delay flag, resistance 255, all of the rider', () => {
    const t = (o: Foe) => fighter({ id: 'x', side: 'enemy', immunities: o.immunities ?? {}, immunityFlags: o.immunityFlags ?? [] });
    expect(immuneToRider(AURON['dragon-fang']!, t(DELAY))).toBe(true);
    expect(immuneToRider(AURON['dragon-fang']!, t(EJECT))).toBe(false);
    expect(immuneToRider(AURON['shooting-star']!, t({ immunities: { eject: 254 } }))).toBe(false);
    expect(immuneToRider(AURON['banishing-blade']!, t(ALL_BREAKS))).toBe(true);
    expect(immuneToRider(AURON['banishing-blade']!, t({ immunities: { 'power-break': 255 } }))).toBe(false);
    expect(immuneToRider(AURON['tornado']!, t({ ...ALL_BREAKS, ...DELAY }))).toBe(false); // no rider, no Immune row
  });

  it('the Immune row carries no status and no Delay, and keeps canMiss false (hard rule 5)', () => {
    expect(rowFromExtra(AURON['dragon-fang']!, 'immune')).toMatchObject({ power: 19, statusEffects: [], canMiss: false });
    expect(rowFromExtra(AURON['dragon-fang']!, 'immune')!.flags).not.toContain('weak-delay');
    expect(rowFromExtra(AURON['banishing-blade']!, 'immune')).toMatchObject({ power: 30, statusEffects: [], canMiss: false });
  });
});

describe('determinism', () => {
  it('the same seed twice gives the same log (mixed Dragon Fang, partial Banishing Blade)', () => {
    expect(fire(AURON['dragon-fang']!, clean, DELAY, {}, 7).log).toEqual(fire(AURON['dragon-fang']!, clean, DELAY, {}, 7).log);
    const p: Foe = { immunities: { 'power-break': 255 } };
    expect(fire(AURON['banishing-blade']!, clean, p, {}, 7).log).toEqual(fire(AURON['banishing-blade']!, clean, p, {}, 7).log);
  });
});
