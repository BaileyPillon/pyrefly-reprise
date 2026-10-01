/**
 * r34fix-od6 (FFX only): a **failed** Bushido carries no rider. The Fail rows drop the status and the
 * Delay, as the Immune rows do; a clean input still lands the rider.
 *
 * Source: `research/ffx-overdrive-input-rules-2026-09-30.md` Q3a, `[verified: 5 sources]` (GF-PF
 * "Effects only are applied when sequence is entered correctly"; TRK fail rows 266 to 269 and 235 to
 * 238 carry no status and no Delay/Eject flag, the success rows 100 to 102 do), and
 * `research/ffx-combat-core.md` §5.3 / §5.5 (the "(Fail)" rows, no rider). Q3b: the fail rows keep
 * the can-crit bit (data + 1 source, our estimate), so `crit-eligible` stays.
 *
 * Every damage and status assertion drives the real engine with the Overdrive command and its
 * minigame result attached, the path a player's input takes.
 */

import { describe, expect, it } from 'vitest';
import type { AbilityDef, BattleEvent, Command, Decision, EnemyDef, MinigameResult, StatusId } from '../../src/battle/common/types.ts';
import { FFXContentRegistry, createFFXEngine } from '../../src/battle/ffx/index.ts';
import { rowFromExtra } from '../../src/battle/ffx/overdriveShape.ts';
import { ABILITIES as AURON } from '../../src/data/ffx/abilities/overdrive-auron.ts';
import { seymourAnimaMacalaniaGroup } from '../../src/data/ffx/enemies/seymour-anima-macalania.ts';
import { attackAbility, enemy, member, party, setup } from './ffx-fixtures.test.ts';

type Foe = Partial<EnemyDef>;
type Run = { log: BattleEvent[]; dmg: Record<string, number[]>; statuses: Record<string, StatusId[]>; ctb: Record<string, number> };

const BREAKS: StatusId[] = ['power-break', 'magic-break', 'armor-break', 'mental-break'];
const clean: MinigameResult = { kind: 'auron-sequence', sequence: { success: true, correctInputs: 7, timeRemainingMs: 0 } };
const failed: MinigameResult = { kind: 'auron-sequence', sequence: { success: false, correctInputs: 3, timeRemainingMs: 0 } };

/** Auron fires `def` at `dummy` (all-enemies rows reach both) on a seeded board of two 99 999 HP dummies. */
function fire(def: AbilityDef, result: MinigameResult, foe: Foe = {}, seed = 1): Run {
  const reg = new FFXContentRegistry();
  reg.addAbilities([attackAbility(), def]);
  const engine = createFFXEngine({ content: reg });
  engine.setSeed(seed);
  const od = { gauge: 100, mode: 'stoic' as const, unlockedModes: ['stoic' as const], unlockedOverdriveIds: [def.id] };
  engine.init(
    setup({
      party: party({ members: [member({ id: 'tidus' }), member({ id: 'auron', overdrive: od }), member({ id: 'yuna' })], activeSlots: ['tidus', 'auron', 'yuna'] }),
      enemies: { id: 'g', game: 'ffx', enemies: [enemy({ id: 'dummy', hp: 99_999, ...foe }), enemy({ id: 'dummy2', slot: 1, hp: 99_999, ...foe })] },
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
  const tick = (id: string): number => engine.predictTurnOrder(30).find((p) => p.actorId === id)?.tickValue ?? -1;
  const ctb0 = { dummy: tick('dummy'), dummy2: tick('dummy2') };
  const cmd: Command = { kind: 'overdrive', id: def.id, targets: ['dummy'], extra: result };
  for (let i = 0; i < 5 && !engine.state().log.slice(before).some((e) => e.type === 'action-end'); i++) engine.submit(cmd);
  const all = engine.state().log.slice(before);
  const log = all.slice(0, all.findIndex((e) => e.type === 'action-end') + 1);
  const run: Run = { log, dmg: {}, statuses: {}, ctb: { dummy: tick('dummy') - ctb0.dummy, dummy2: tick('dummy2') - ctb0.dummy2 } };
  for (const e of log) {
    if (e.type === 'damage' && e.sourceId === 'auron') (run.dmg[e.targetId] ??= []).push(e.amount);
    if (e.type === 'status-add') (run.statuses[e.targetId] ??= []).push(e.status);
  }
  return run;
}

/** The same record with its rider taken off by hand: what a Fail row must behave like. */
const riderless = (def: AbilityDef): AbilityDef => ({ ...def, statusEffects: [], flags: def.flags.filter((f) => f !== 'weak-delay' && f !== 'strong-delay') });
const riderStatuses = (r: Run, id: string): StatusId[] => (r.statuses[id] ?? []).filter((s) => s === 'eject' || BREAKS.includes(s));

describe('Dragon Fang: a fail deals no weak Delay; a success still does', () => {
  const df = AURON['dragon-fang']!;
  it('fail: no foe is pushed back; success: both foes are', () => {
    const fail = fire(df, failed);
    const ok = fire(df, clean);
    const none = fire(riderless(df), clean);
    expect(ok.ctb['dummy']).toBeGreaterThan(none.ctb['dummy']!);
    expect(ok.ctb['dummy2']).toBeGreaterThan(none.ctb['dummy2']!);
    expect(fail.ctb).toEqual(none.ctb);
  });
});

describe('Shooting Star: a fail does not Eject; a success still does', () => {
  const ss = AURON['shooting-star']!;
  it('fail: no Eject, the target stays; success: Eject lands', () => {
    expect(riderStatuses(fire(ss, failed), 'dummy')).toEqual([]);
    expect(fire(ss, clean).statuses['dummy']).toContain('eject');
  });

  it('Guado Guardian A, shipped data (Chapter VII): a failed Shooting Star no longer Ejects it', () => {
    const g = seymourAnimaMacalaniaGroup.enemies.find((e) => e.id === 'guado-guardian-a')!;
    const foe: Foe = { immunities: { ...g.immunities }, immunityFlags: [...g.immunityFlags] };
    expect(riderStatuses(fire(ss, failed, foe), 'dummy')).toEqual([]);
    expect(fire(ss, clean, foe).statuses['dummy']).toContain('eject');
  });
});

describe('Banishing Blade: a fail lands no Break; a success still lands all four', () => {
  const bb = AURON['banishing-blade']!;
  it('fail: no Break; success: power, magic, armor and mental Break', () => {
    expect(riderStatuses(fire(bb, failed), 'dummy')).toEqual([]);
    expect(fire(bb, clean).statuses['dummy']).toEqual(BREAKS);
  });

  it("Seymour (Macalania), shipped data: a fail lands none of the three Breaks he is open to", () => {
    const s = seymourAnimaMacalaniaGroup.enemies.find((e) => e.id === 'seymour-macalania')!;
    const foe: Foe = { immunities: { ...s.immunities }, immunityFlags: [...s.immunityFlags] };
    expect(riderStatuses(fire(bb, failed, foe), 'dummy')).toEqual([]);
    expect(fire(bb, clean, foe).statuses['dummy']).toEqual(['magic-break', 'armor-break', 'mental-break']);
  });
});

describe('a fail is the Fail row with no rider, and draws nothing new', () => {
  for (const id of ['dragon-fang', 'shooting-star', 'banishing-blade', 'tornado'] as const) {
    it(`${id}: the failed log equals the failed log of the same record with its rider removed by hand`, () => {
      const def = AURON[id]!;
      for (const seed of [1, 7]) expect(fire(def, failed, {}, seed).log).toEqual(fire(riderless(def), failed, {}, seed).log);
    });
  }

  it('the success row still carries its rider (the record is untouched)', () => {
    expect(AURON['dragon-fang']!.flags).toContain('weak-delay');
    expect(AURON['shooting-star']!.statusEffects.map((s) => s.status)).toEqual(['eject']);
    expect(AURON['banishing-blade']!.statusEffects.map((s) => s.status)).toEqual(BREAKS);
  });
});

describe('rowFromExtra(def, "fail") for each Bushido', () => {
  const want: Record<string, { power: number; hits: number; rank: number }> = {
    'dragon-fang': { power: 16, hits: 1, rank: 5 },
    'shooting-star': { power: 24, hits: 1, rank: 5 },
    'banishing-blade': { power: 28, hits: 1, rank: 6 },
    tornado: { power: 15, hits: 1, rank: 6 },
  };
  for (const [id, w] of Object.entries(want)) {
    it(`${id}: the §5.5 Fail row, no status, no Delay, crit-eligible kept (Q3b), canMiss false (hard rule 5)`, () => {
      const row = rowFromExtra(AURON[id]!, 'fail')!;
      expect(row).toMatchObject({ ...w, statusEffects: [], canMiss: false });
      expect(row.flags).not.toContain('weak-delay');
      expect(row.flags).not.toContain('strong-delay');
      expect(row.flags).toContain('crit-eligible');
    });
  }
});
