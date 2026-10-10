/**
 * The Experiment (FFX-2 Chapter 5, Djose Temple; the hidden chapter "The Experiment"): the game's own rows, its script and the fight in the real engine. **FFX-2 only.**
 *
 * What this pins, against the new-chapters reverse-engineering lane's reading of the live Steam build (`research/re-ffx2-experiment.md`; the numbers are in
 * `tests/fixtures/parity/ffx2/experiment_rows.json`, numbers only):
 *
 * 1. **The rows**: the monster row and the six command rows, field by field; the level tables; the abilities' hit counts, targeting, hit rule and pace.
 * 2. **The damage**: the base damage kernel (`kernel/damage.ts`) on the Experiment's rows reproduces the note's emulator runs of the live function: every Attack level against five Defense values, both
 *    Rocket Launcher powers, Lifeslicer (the target's maximum HP) and Annihilator at every Attack level (1,240 to 1,400 at Level 5).
 * 3. **The script**: each Special level's order, Special 3's three HP bands (one Lifeslicer a drop, the lowest line first), Special 4's roll of six and Special 5's seven-poll cycle, from a stub context.
 * 4. **The fight**: in the real engine Lifeslicer is a certain KO that Protect and Shell do not stop; the Rocket Launcher lands every one of its hits; Annihilator hits the whole party for its band;
 *    the seam trigger fires once, on Act I's fall, and never on Act II's; Act II opens with the party restored and is the retry checkpoint; and the shipped line wins both acts.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import type { BattleEvent, FFX2PartyBuild, StatusId } from '../../../src/battle/common/types.ts';
import { makeRng, type SeededRng } from '../../../src/battle/common/rng.ts';
import { baseDamageAt, type BaseDamageInput } from '../../../src/battle/ffx2/kernel/damage.ts';
import { GROUP1_STATUS, GROUP2_STATUS } from '../../../src/battle/ffx2/adapt/slots.ts';
import { FFX2Engine } from '../../../src/battle/ffx2/index.ts';
import type { AiContext, Ffx2Unit } from '../../../src/battle/ffx2/internal.ts';
import { aiScriptFor } from '../../../src/battle/ffx2/ai/index.ts';
import {
  EXPERIMENT_CYCLES,
  EXPERIMENT_HP_TRIGGERS,
  EXPERIMENT_SPECIAL_3_BANDS,
  EXPERIMENT_SPECIAL_4_ROLL,
  EXPERIMENT_STEP,
} from '../../../src/battle/ffx2/ai/experiment.ts';
import { checkpointAt } from '../../../src/app/screens/BattleChainCheckpoint.ts';
import { setupForChapter, setupForNextLink } from '../../../src/app/screens/BattleScreenSetup.ts';
import { FFX2_EXPERIMENT } from '../../../src/data/chapter-ffx2-experiment.ts';
import { FFX2_COMMAND_RECORDS } from '../../../src/data/ffx2/command-records/index.ts';
import { MONSTER_RECORDS } from '../../../src/data/ffx2/monster-records/index.ts';
import { ABILITIES } from '../../../src/data/ffx2/index.ts';
import {
  ACT_I_LEVELS,
  ACT_II_LEVELS,
  ATTACK_TRACK,
  DEFENSE_TRACK,
  EXPERIMENT_ACTIONS,
  UPGRADE_LEVELS,
  experimentScriptId,
  type UpgradeLevel,
} from '../../../src/data/ffx2/enemies/experiment-levels.ts';
import {
  EXPERIMENT_ENEMY_ID,
  EXPERIMENT_PROTOTYPE_ID,
  experimentActOneGroup,
  experimentActTwoGroup,
  experimentFormationAt,
} from '../../../src/data/ffx2/enemies/experiment.ts';
import { EXPERIMENT_SEAM } from '../../../src/story/scripts/ffx2-experiment.ts';
import { ffx2Options } from '../helpers/ffx2ChapterDrive.ts';
import { driveAct, driveChapterWithTriggers, summarise } from '../helpers/experimentDrive.ts';

interface Row {
  id: number; name: string; damageClass: number; formula: number; power: number; hits: number; accuracyFormula: number; accuracyByte: number; critByte: number; shatter: number; element: number;
  costAtb: number; costCast: number; targetFlags: number; miscFlags: number; damageFlags: number; randomTarget: boolean; delayWeak: boolean; sequenceClass: number; restUnits: number; chargeUnits: number;
}
interface Fixture {
  record: {
    row: number; level: number; hp: number; mp: number; agi: number; acc: number; eva: number; luck: number; specialWord: number; typeMask: number; nullMask: number;
    resistGroup1: number[]; resistGroup2: number[]; ap: number; exp: number; gil: number; pilferGilFigure: number; stealChanceByte: number; dropChanceByte: number; zantetsuByte: number;
    commands: number[]; stealItem: { id: number; common: number; rare: number };
  };
  levels: { attack: { level: number; str: number; mag: number }[]; defense: { level: number; def: number; mdef: number }[] };
  points: number[];
  specialScenes: { special: number; parts: number; moves: number[] }[];
  rows: Row[];
  attackBaseDamage: { defs: number[]; byAttackLevel: Record<string, [number, number][]> };
  rocketBaseDamage: { defs: number[]; p4: Record<string, [number, number][]>; p3: Record<string, [number, number][]> };
  annihilatorBaseDamage: Record<string, [number, number]>;
}
const FIX = JSON.parse(readFileSync(join(__dirname, '..', '..', 'fixtures', 'parity', 'ffx2', 'experiment_rows.json'), 'utf8')) as Fixture;
const ROW = (id: number): Row => FIX.rows.find((r) => r.id === id)!;

const SPARSE = (xs: number[]): Record<number, number> => Object.fromEntries(xs.map((v, i) => [i, v]).filter(([, v]) => (v as number) > 0));

// ----------------------------------------------------------------------------------------------------------------------------------------- 1. the rows

describe("the game's rows, field by field", () => {
  const ID_OF: Record<string, number> = {
    [EXPERIMENT_ACTIONS.attack]: 0x41da,
    [EXPERIMENT_ACTIONS.rocketLauncher[0]]: 0x4121,
    [EXPERIMENT_ACTIONS.rocketLauncher[1]]: 0x4122,
    [EXPERIMENT_ACTIONS.rocketLauncher[2]]: 0x4123,
    [EXPERIMENT_ACTIONS.rocketLauncher[3]]: 0x4124,
    [EXPERIMENT_ACTIONS.lifeslicer]: 0x4125,
    [EXPERIMENT_ACTIONS.annihilator]: 0x4126,
  };

  it("every ability of the chapter has the game's command row, matching the fixture in every field the kernels read", () => {
    for (const [abilityId, rowId] of Object.entries(ID_OF)) {
      const rec = FFX2_COMMAND_RECORDS[abilityId];
      const row = ROW(rowId);
      expect(rec, abilityId).toBeDefined();
      expect(rec).toMatchObject({
        id: row.id, formula: row.formula, power: row.power, hits: row.hits, accuracy: row.accuracyByte, critByte: row.critByte, shatter: row.shatter, element: row.element,
        flagsTarget: row.targetFlags, flagsMisc: row.miscFlags, flagsDamage: row.damageFlags, damageClass: row.damageClass,
      });
      expect(ABILITIES[abilityId]?.ffx2Record, `${abilityId}: attached to the ability`).toBe(rec);
    }
  });

  it('the hit rule: only the plain Attack rolls (accuracy formula 2, the attacker\'s ACC); the rest never roll, so each says canMiss false', () => {
    for (const [abilityId, rowId] of Object.entries(ID_OF)) {
      const row = ROW(rowId);
      const rolls = row.accuracyFormula !== 0;
      expect(rolls, abilityId).toBe(rowId === 0x41da);
      expect(ABILITIES[abilityId]?.canMiss === false, abilityId).toBe(!rolls);
    }
  });

  it('hits, power and targeting: the Rocket Launcher is 4/6/8/10 hits of power 4/3/3/3 on a random girl per hit; Lifeslicer and Annihilator are one hit', () => {
    expect(EXPERIMENT_ACTIONS.rocketLauncher.map((id) => [ABILITIES[id]!.hits, ABILITIES[id]!.power])).toEqual([[4, 4], [6, 3], [8, 3], [10, 3]]);
    for (const id of EXPERIMENT_ACTIONS.rocketLauncher) {
      expect(ABILITIES[id]!.targeting).toBe('random-enemy');
      expect(ROW(ID_OF[id]!).randomTarget).toBe(true);
    }
    expect([ABILITIES[EXPERIMENT_ACTIONS.lifeslicer]!.targeting, ABILITIES[EXPERIMENT_ACTIONS.lifeslicer]!.hits]).toEqual(['single-enemy', 1]);
    expect([ABILITIES[EXPERIMENT_ACTIONS.annihilator]!.targeting, ABILITIES[EXPERIMENT_ACTIONS.annihilator]!.hits]).toEqual(['all-enemies', 1]);
    expect(ABILITIES[EXPERIMENT_ACTIONS.attack]!.targeting).toBe('single-enemy');
  });

  it("Annihilator carries the weak Delay (the row's misc bit 0x1000) and the flag; nothing else does", () => {
    expect(ROW(0x4126).delayWeak).toBe(true);
    expect(ROW(0x4126).miscFlags & 0x1000).toBe(0x1000);
    expect(ABILITIES[EXPERIMENT_ACTIONS.annihilator]!.flags).toContain('weak-delay');
    for (const id of Object.keys(ID_OF)) if (id !== EXPERIMENT_ACTIONS.annihilator) expect(ABILITIES[id]!.flags, id).not.toContain('weak-delay');
  });

  it("the pace: charge and rest are the rows' own cost_cast and cost_atb (gauge units = value x 10000 / (AGI + 1))", () => {
    for (const [abilityId, rowId] of Object.entries(ID_OF)) {
      const row = ROW(rowId);
      const a = ABILITIES[abilityId]!;
      expect(a.chargeTicks ?? 0, `${abilityId} charge`).toBe(row.costCast);
      expect(a.recoveryTicks, `${abilityId} rest`).toBe(row.costAtb);
      expect(Math.floor((row.costAtb * 10000) / (FIX.record.agi + 1)), `${abilityId} rest units`).toBe(row.restUnits);
      expect(Math.floor((row.costCast * 10000) / (FIX.record.agi + 1)), `${abilityId} charge units`).toBe(row.chargeUnits);
    }
  });

  it('the monster row on both bodies: Accuracy 95, the special word, the machine type, the steal and the resist bytes', () => {
    for (const key of ['ffx2-djose-experiment-1/x2-experiment-prototype', 'ffx2-djose-experiment-2/x2-experiment']) {
      const rec = MONSTER_RECORDS[key];
      expect(rec, key).toBeDefined();
      expect(rec).toMatchObject({
        row: FIX.record.row, table: 1, acc: FIX.record.acc, special: FIX.record.specialWord, species: FIX.record.typeMask, zantetsu: FIX.record.zantetsuByte,
        stealByte: FIX.record.stealChanceByte, stealGil: FIX.record.pilferGilFigure, steal: [FIX.record.stealItem.id, FIX.record.stealItem.common, FIX.record.stealItem.id, FIX.record.stealItem.rare],
        bribe: [0, 0, 0, 0],
      });
      expect(rec!.resist1).toEqual(SPARSE(FIX.record.resistGroup1));
      expect(rec!.resist2).toEqual(SPARSE(FIX.record.resistGroup2));
    }
  });

  it("laid on the enemies: ACC 95, every slot's 255 is an immunity, Shell, Protect, Reflect, Regen and Haste are not, and the rewards are the row's", () => {
    for (const group of [experimentActOneGroup, experimentActTwoGroup]) {
      const boss = group.enemies[0]!;
      expect(boss.stats.acc).toBe(95);
      GROUP1_STATUS.forEach((status, i) => {
        if (status === null) return;
        if (FIX.record.resistGroup1[i] === 255) expect(boss.immunities[status as StatusId], `${boss.id} group 1 slot ${i} ${status}`).toBe(255);
        else expect(boss.immunities[status as StatusId], `${boss.id} group 1 slot ${i} ${status}`).toBeUndefined();
      });
      GROUP2_STATUS.forEach((statuses, i) => {
        for (const status of statuses) {
          if (FIX.record.resistGroup2[i] === 255) expect(boss.immunities[status], `${boss.id} group 2 slot ${i} ${status}`).toBe(255);
          else expect(boss.immunities[status], `${boss.id} group 2 slot ${i} ${status}`).toBeUndefined();
        }
      });
      for (const free of ['shell', 'protect', 'reflect', 'regen', 'haste'] as StatusId[]) expect(boss.immunities[free], free).toBeUndefined();
      expect([boss.rewards.ap, boss.rewards.exp, boss.rewards.gil, boss.rewards.stolenGil]).toEqual([FIX.record.ap, FIX.record.exp, FIX.record.gil, FIX.record.pilferGilFigure]);
      expect(boss.rewards.steal).toMatchObject({ stealRate: FIX.record.stealChanceByte, common: { itemId: 'x2-turbo-ether', count: 1 }, rare: { itemId: 'x2-turbo-ether', count: 2 } });
      expect(boss.rewards.drops).toEqual([{ itemId: 'x2-elixir', count: 1 }]);
      expect([boss.level, boss.stats.maxHp, boss.stats.maxMp, boss.stats.agi, boss.stats.eva, boss.stats.luck]).toEqual([FIX.record.level, FIX.record.hp, FIX.record.mp, FIX.record.agi, FIX.record.eva, FIX.record.luck]);
      expect(boss.affinities).toEqual({ gravity: 'immune' }); // the null mask is Gravity only (bit 4): every other element is neutral
      expect(FIX.record.nullMask).toBe(0x10);
    }
  });

  it('the level tables are the stored values (a script write of 0 is clamped to 1), and the scenes by Special level carry 0, 2, 4, 6 and 8 parts', () => {
    expect(UPGRADE_LEVELS.map((l) => ({ level: l, str: ATTACK_TRACK[l].str, mag: ATTACK_TRACK[l].mag }))).toEqual(FIX.levels.attack);
    expect(UPGRADE_LEVELS.map((l) => ({ level: l, def: DEFENSE_TRACK[l].def, mdef: DEFENSE_TRACK[l].mdef }))).toEqual(FIX.levels.defense);
    expect(FIX.specialScenes.map((s) => s.parts)).toEqual([0, 2, 4, 6, 8]);
    expect(FIX.specialScenes.map((s) => s.moves.length)).toEqual([1, 2, 3, 3, 4]); // 0x41da, then the launcher, then Lifeslicer from Special 3, then Annihilator at 5
  });
});

// ----------------------------------------------------------------------------------------------------------------------------------------- 2. the damage

function damageInput(over: { formula: number; power: number; str?: number; mag?: number; def?: number; mdef?: number; maxHp?: number; misc?: number; dmg?: number }): BaseDamageInput {
  return {
    attackerId: 15, targetId: 0, cmd: { misc: over.misc ?? 0, damage: over.dmg ?? 0 }, formula: over.formula, power: over.power, amount: 0, preview: false,
    user: { hp: FIX.record.hp, maxHp: FIX.record.hp, mp: 0, maxMp: 0, str: over.str ?? 1, strStage: 0, mag: over.mag ?? 1, magStage: 0, level: FIX.record.level },
    target: { hp: over.maxHp ?? 5000, maxHp: over.maxHp ?? 5000, def: over.def ?? 1, defStage: 0, mdef: over.mdef ?? 1, mdefStage: 0 },
    records: { attackerF40: 0, attackerF44: 0, targetF44: 0 },
  };
}
/** The kernel's base damage at the two ends of the variance (240 and 271 out of 256). */
const span = (input: BaseDamageInput): [number, number] => [baseDamageAt(input, 240), baseDamageAt(input, 271)];

describe("base damage: the kernel on the Experiment's rows reproduces the note's emulator runs of the live function", () => {
  const atk = ROW(0x41da);

  it('Attack (formula 0, power 16): every Attack level against Defense 1, 50, 100, 150 and 205', () => {
    for (const level of UPGRADE_LEVELS) {
      FIX.attackBaseDamage.defs.forEach((def, i) => {
        const got = span(damageInput({ formula: atk.formula, power: atk.power, str: ATTACK_TRACK[level].str, def, misc: atk.miscFlags, dmg: atk.damageFlags }));
        expect(got, `Attack Level ${level} vs DEF ${def}`).toEqual(FIX.attackBaseDamage.byAttackLevel[String(level)]![i]);
      });
    }
  });

  it('Rocket Launcher (formula 0, power 4 for Special 2, 3 for Specials 3 to 5): every Attack level against Defense 1, 100 and 205', () => {
    const p4 = ROW(0x4121);
    const p3 = ROW(0x4124);
    expect([p4.power, p3.power]).toEqual([4, 3]);
    for (const level of UPGRADE_LEVELS) {
      FIX.rocketBaseDamage.defs.forEach((def, i) => {
        const a = span(damageInput({ formula: p4.formula, power: p4.power, str: ATTACK_TRACK[level].str, def, misc: p4.miscFlags, dmg: p4.damageFlags }));
        const b = span(damageInput({ formula: p3.formula, power: p3.power, str: ATTACK_TRACK[level].str, def, misc: p3.miscFlags, dmg: p3.damageFlags }));
        expect(a, `P4 Level ${level} vs DEF ${def}`).toEqual(FIX.rocketBaseDamage.p4[String(level)]![i]);
        expect(b, `P3 Level ${level} vs DEF ${def}`).toEqual(FIX.rocketBaseDamage.p3[String(level)]![i]);
      });
    }
  });

  it('Annihilator (formula 3, power 20): the Attack level\'s Magic gives 626 to 707 at Level 1 up to 1,240 to 1,400 at Level 5, and the girl\'s Magic Defense never enters', () => {
    const row = ROW(0x4126);
    for (const level of UPGRADE_LEVELS) {
      const [lo, hi] = span(damageInput({ formula: row.formula, power: row.power, mag: ATTACK_TRACK[level].mag, mdef: 1, misc: row.miscFlags, dmg: row.damageFlags }));
      expect([lo, hi], `Attack Level ${level}`).toEqual(FIX.annihilatorBaseDamage[String(level)]);
      const high = span(damageInput({ formula: row.formula, power: row.power, mag: ATTACK_TRACK[level].mag, mdef: 255, misc: row.miscFlags, dmg: row.damageFlags }));
      expect(high, `Attack Level ${level} against Magic Defense 255`).toEqual([lo, hi]);
    }
    expect(FIX.annihilatorBaseDamage['5']).toEqual([1240, 1400]); // the fan wiki's published range
  });

  it("Lifeslicer (formula 7, power 16) is exactly the target's maximum HP, whatever the variance, the attacker's stats or the target's Defense", () => {
    const row = ROW(0x4125);
    for (const maxHp of [1, 999, 1200, 4321, 9999, 18324]) {
      for (const stats of [{ str: 1, mag: 1, def: 1 }, { str: 215, mag: 100, def: 255 }]) {
        const [lo, hi] = span(damageInput({ formula: row.formula, power: row.power, maxHp, ...stats, misc: row.miscFlags, dmg: row.damageFlags }));
        expect([lo, hi], `max HP ${maxHp}`).toEqual([maxHp, maxHp]);
      }
    }
  });
});

// ----------------------------------------------------------------------------------------------------------------------------------------- 3. the script

type Girl = { id: string; hp: number };
function stub(opts: { hp?: number; maxHp?: number; party?: Girl[]; rng?: SeededRng | { int: (a: number, b: number) => number; pick: <T>(xs: readonly T[]) => T } } = {}): { ctx: AiContext; self: Ffx2Unit } {
  const self = { id: EXPERIMENT_ENEMY_ID, hp: opts.hp ?? 18324, stats: { maxHp: opts.maxHp ?? 18324 }, aiMemory: {} } as unknown as Ffx2Unit;
  const party = (opts.party ?? [{ id: 'yuna', hp: 1000 }, { id: 'rikku', hp: 1000 }, { id: 'paine', hp: 1000 }]) as unknown as Ffx2Unit[];
  const ctx = {
    self, units: [], rng: (opts.rng ?? makeRng(7)) as unknown as AiContext['rng'], flags: {}, ticks: 0, ability: () => undefined, party: () => party, allies: () => [], emit: () => undefined,
  } as unknown as AiContext;
  return { ctx, self };
}
const decide = (special: UpgradeLevel, ctx: AiContext): { id: string; targets: string[] } => {
  const c = aiScriptFor(experimentScriptId(special)).decide(ctx);
  if (!c || c.kind !== 'ability') throw new Error('no ability');
  return { id: c.id, targets: [...c.targets] };
};
const [A, R, L, N] = [EXPERIMENT_ACTIONS.attack, EXPERIMENT_ACTIONS.rocketLauncher, EXPERIMENT_ACTIONS.lifeslicer, EXPERIMENT_ACTIONS.annihilator] as const;

describe("the script: one pattern per Special level, in the game's own order", () => {
  it('Special 1: a plain Attack every poll, on one living girl', () => {
    const { ctx } = stub();
    for (let i = 0; i < 30; i++) {
      const d = decide(1, ctx);
      expect(d.id).toBe(A);
      expect(['yuna', 'rikku', 'paine']).toContain(d.targets[0]);
      expect(d.targets).toHaveLength(1);
    }
  });

  it('Special 2: Attack, Attack, Attack, the 4-hit Rocket Launcher (no target: every hit picks its own), repeat', () => {
    const { ctx } = stub();
    const seq = Array.from({ length: 12 }, () => decide(2, ctx));
    expect(seq.map((d) => d.id)).toEqual([A, A, A, R[0], A, A, A, R[0], A, A, A, R[0]]);
    for (const d of seq) expect(d.targets).toHaveLength(d.id === A ? 1 : 0);
    expect(EXPERIMENT_CYCLES[2]).toEqual(['attack', 'attack', 'attack', 'rocket']);
  });

  it('Special 3: Attack, Attack, the 6-hit Rocket Launcher, repeat, while its HP stays above 60 percent', () => {
    const { ctx } = stub();
    expect(Array.from({ length: 9 }, () => decide(3, ctx).id)).toEqual([A, A, R[1], A, A, R[1], A, A, R[1]]);
  });

  it("Special 3's bands: the lines are HP x 5 < maxHP x k, at or below 10,994, 7,329 and 3,664 of 18,324", () => {
    expect(EXPERIMENT_SPECIAL_3_BANDS).toEqual([3, 2, 1]);
    const lines = EXPERIMENT_SPECIAL_3_BANDS.map((k) => Math.floor((18324 * k - 1) / 5));
    expect(lines).toEqual([10994, 7329, 3664]);
    const at = (hp: number): string => decide(3, stub({ hp }).ctx).id;
    expect([at(10995), at(10994)]).toEqual([A, L]);
    expect([at(7330), at(7329)]).toEqual([L, L]); // the first poll at 7,330 is under the 60 percent line already
    expect([at(18324), at(10995)]).toEqual([A, A]);
  });

  it('Special 3: each band fires once, the lowest line first, a Lifeslicer does not advance the cycle, and a drop through several lines fires ONE Lifeslicer and skips the rest', () => {
    const girls: Girl[] = [{ id: 'yuna', hp: 100 }, { id: 'rikku', hp: 900 }, { id: 'paine', hp: 500 }];
    const { ctx, self } = stub({ party: girls });
    expect(decide(3, ctx).id).toBe(A); // full HP: the cycle's first poll
    self.hp = 10000; // under the 60 percent line
    const first = decide(3, ctx);
    expect([first.id, first.targets]).toEqual([L, ['rikku']]); // the girl with the most HP left
    expect(decide(3, ctx).id).toBe(A); // the cycle carries on where the Lifeslicer interrupted it: its second poll
    expect(decide(3, ctx).id).toBe(R[1]); // and its third, the 6-hit volley: no second Lifeslicer while HP stays inside the same band
    expect(decide(3, ctx).id).toBe(A);
  });

  it("Special 3: at 7,000 HP the second band's Lifeslicer comes before the cycle's next poll", () => {
    const { ctx, self } = stub();
    self.hp = 10000;
    expect(decide(3, ctx).id).toBe(L); // band 1
    self.hp = 7000;
    expect(decide(3, ctx).id).toBe(L); // band 2
    expect(self.aiMemory![EXPERIMENT_HP_TRIGGERS]).toBe(2);
    self.hp = 3000;
    expect(decide(3, ctx).id).toBe(L); // band 3
    expect(self.aiMemory![EXPERIMENT_HP_TRIGGERS]).toBe(3);
    self.hp = 100;
    const rest = Array.from({ length: 6 }, () => decide(3, ctx).id);
    expect(rest).not.toContain(L); // at most three Lifeslicers in a fight
    expect(rest).toEqual([A, A, R[1], A, A, R[1]]);
  });

  it('Special 3: a drop from the top to 15 percent between two polls fires one Lifeslicer and skips the two lines it passed', () => {
    const { ctx, self } = stub();
    self.hp = 2700; // under the 20 percent line in one go
    expect(decide(3, ctx).id).toBe(L);
    expect(self.aiMemory![EXPERIMENT_HP_TRIGGERS]).toBe(3);
    expect(decide(3, ctx).id).not.toBe(L);
    expect(decide(3, ctx).id).not.toBe(L);
  });

  it('Special 3: the Lifeslicer goes to the girl with the most HP left; a tie is broken at random, and never to a girl who is not offered', () => {
    const { ctx, self } = stub({ party: [{ id: 'yuna', hp: 800 }, { id: 'rikku', hp: 800 }, { id: 'paine', hp: 200 }] });
    self.hp = 10000;
    expect(['yuna', 'rikku']).toContain(decide(3, ctx).targets[0]);
    const one = stub({ party: [{ id: 'paine', hp: 5 }] });
    one.self.hp = 10000;
    expect(decide(3, one.ctx).targets).toEqual(['paine']);
  });

  it('Special 4: a roll of six every poll: 0 Lifeslicer, 1 and 2 the 8-hit Rocket Launcher, 3 to 5 Attack', () => {
    expect(EXPERIMENT_SPECIAL_4_ROLL).toEqual(['lifeslicer', 'rocket', 'rocket', 'attack', 'attack', 'attack']);
    const want = [L, R[2], R[2], A, A, A];
    for (let k = 0; k < 6; k++) {
      const { ctx } = stub({ rng: { int: () => k, pick: <T,>(xs: readonly T[]): T => xs[0]! } });
      expect(decide(4, ctx).id, `roll ${k}`).toBe(want[k]);
    }
  });

  it('Special 4: over many seeded polls the three moves come in about 1/6, 1/3 and 1/2', () => {
    const { ctx } = stub({ rng: makeRng(2026) });
    const n = 6000;
    const count: Record<string, number> = {};
    for (let i = 0; i < n; i++) {
      const id = decide(4, ctx).id;
      count[id] = (count[id] ?? 0) + 1;
    }
    expect((count[L] ?? 0) / n).toBeCloseTo(1 / 6, 1);
    expect((count[R[2]] ?? 0) / n).toBeCloseTo(1 / 3, 1);
    expect((count[A] ?? 0) / n).toBeCloseTo(1 / 2, 1);
  });

  it('Special 5: Rocket Launcher (10), Attack, Rocket Launcher, Attack, Lifeslicer, Annihilator, Attack, and the cycle restarts', () => {
    const { ctx } = stub();
    const seq = Array.from({ length: 14 }, () => decide(5, ctx).id);
    const cycle = [R[3], A, R[3], A, L, N, A];
    expect(seq).toEqual([...cycle, ...cycle]);
    expect(EXPERIMENT_CYCLES[5]).toEqual(['rocket', 'attack', 'rocket', 'attack', 'lifeslicer', 'annihilator', 'attack']);
  });

  it('Special 5 reads no HP, status or hit: the order is the same at full HP and at a sliver', () => {
    const a = stub();
    const b = stub({ hp: 3 });
    expect(Array.from({ length: 7 }, () => decide(5, b.ctx).id)).toEqual(Array.from({ length: 7 }, () => decide(5, a.ctx).id));
  });

  it('with no girl standing the script does nothing (the engine ends the battle)', () => {
    const { ctx } = stub({ party: [] });
    for (const l of UPGRADE_LEVELS) expect(aiScriptFor(experimentScriptId(l)).decide(ctx)).toBeNull();
  });

  it('the engine memory keys are the script\'s own and start empty', () => {
    const { ctx, self } = stub();
    expect(self.aiMemory).toEqual({});
    decide(2, ctx);
    expect(Object.keys(self.aiMemory!)).toEqual([EXPERIMENT_STEP]);
  });
});

// ----------------------------------------------------------------------------------------------------------------------------------------- 4. the fight

const PROTECT = { id: 'protect', turnsRemaining: null, ticksRemaining: 99_999_999, charges: null, stacks: 0, permanent: false } as never;
const SHELL = { id: 'shell', turnsRemaining: null, ticksRemaining: 99_999_999, charges: null, stacks: 0, permanent: false } as never;

/** The party always defends, and the clock runs, until `until` says stop or the fight ends: the Experiment's own moves, undisturbed by a party that fights back. */
function playDefending(engine: FFX2Engine, until: (log: readonly BattleEvent[]) => boolean, guard = 6000): readonly BattleEvent[] {
  for (let i = 0; i < guard; i++) {
    const d = engine.nextDecision();
    if (d.kind === 'battle-over') break;
    if (d.kind === 'waiting') engine.tick(Math.max(1, d.nextEventMs));
    else if (d.kind === 'player-input') engine.submit({ kind: 'defend', targets: [] });
    if (until(engine.state().log)) break;
  }
  return engine.state().log;
}

function startAct(group: ReturnType<typeof experimentFormationAt>, seed: number, step: number): FFX2Engine {
  const engine = new FFX2Engine(ffx2Options({ atbMode: 'wait' }));
  engine.setSeed(seed);
  engine.init({ game: 'ffx2', party: FFX2_EXPERIMENT.buildRef as FFX2PartyBuild, enemies: group, triggers: [], seed, condition: 'normal', canEscape: false });
  const boss = engine.state().combatants[EXPERIMENT_ENEMY_ID] as unknown as Ffx2Unit;
  boss.aiMemory = { [EXPERIMENT_STEP]: step };
  return engine;
}
const protectAll = (engine: FFX2Engine, shell: boolean): void => {
  for (const id of ['yuna', 'rikku', 'paine']) {
    const c = engine.state().combatants[id]!;
    (c.statuses as Record<string, unknown>)['protect'] = PROTECT;
    if (shell) (c.statuses as Record<string, unknown>)['shell'] = SHELL;
  }
};
/** The damage the Experiment's action `ability` dealt: every damage event it sourced between that action's start and its next action (a charged action fires after its start, with the party's own turns between). */
const damageBy = (log: readonly BattleEvent[], ability: string, from = 0): Array<{ target: string; amount: number }> => {
  const out: Array<{ target: string; amount: number }> = [];
  let current: string | undefined;
  for (const e of log.slice(from) as readonly (BattleEvent & { abilityId?: string; actorId?: string; targetId?: string; amount?: number; sourceId?: string })[]) {
    if (e.type === 'action-start' && e.actorId === EXPERIMENT_ENEMY_ID) current = e.abilityId;
    if (e.type === 'damage' && e.sourceId === EXPERIMENT_ENEMY_ID && current === ability) out.push({ target: e.targetId!, amount: e.amount! });
  }
  return out;
};
const maxHpOf = (engine: FFX2Engine, id: string): number => engine.state().combatants[id]!.stats.maxHp;

describe('the fight in the real engine', () => {
  it('Lifeslicer is a certain KO: damage equal to the target\'s maximum HP, with Protect and Shell both up', () => {
    for (const seed of [1, 2, 3]) {
      const engine = startAct(experimentFormationAt(ACT_II_LEVELS), seed, 4); // the fifth poll of the cycle is the Lifeslicer
      protectAll(engine, true);
      const log = playDefending(engine, (l) => l.some((e) => e.type === 'ko'));
      const hits = damageBy(log, L);
      expect(hits, `seed ${seed}`).toHaveLength(1);
      expect(hits[0]!.amount).toBe(maxHpOf(engine, hits[0]!.target));
      expect(log.some((e) => e.type === 'ko' && (e as { targetId?: string }).targetId === hits[0]!.target)).toBe(true);
    }
  });

  it('Rocket Launcher lands every one of its ten hits, each on a girl, and no hit is missed', () => {
    const engine = startAct(experimentFormationAt(ACT_II_LEVELS), 5, 0); // the first poll is the 10-hit volley
    protectAll(engine, false);
    const log = playDefending(engine, (l) => l.filter((e) => e.type === 'action-start' && (e as { actorId?: string }).actorId === EXPERIMENT_ENEMY_ID).length >= 2);
    const hits = damageBy(log, R[3]);
    expect(hits).toHaveLength(10);
    for (const h of hits) expect(['yuna', 'rikku', 'paine']).toContain(h.target);
    expect(log.filter((e) => e.type === 'miss')).toEqual([]);
  });

  it('Annihilator hits all three girls, each for its band at Magic 100 (1,240 to 1,400) with no Shell, and about half with Shell up', () => {
    const open = startAct(experimentFormationAt(ACT_II_LEVELS), 7, 5);
    protectAll(open, false);
    const log = playDefending(open, (l) => l.some((e) => e.type === 'action-end' && (e as { actorId?: string }).actorId === EXPERIMENT_ENEMY_ID));
    const hits = damageBy(log, N);
    expect(hits.map((h) => h.target).sort()).toEqual(['paine', 'rikku', 'yuna']);
    for (const h of hits) expect(h.amount, h.target).toBeGreaterThanOrEqual(1240);
    for (const h of hits) expect(h.amount, h.target).toBeLessThanOrEqual(1400);
    const shelled = startAct(experimentFormationAt(ACT_II_LEVELS), 7, 5);
    protectAll(shelled, true);
    const log2 = playDefending(shelled, (l) => l.some((e) => e.type === 'action-end' && (e as { actorId?: string }).actorId === EXPERIMENT_ENEMY_ID));
    for (const h of damageBy(log2, N)) {
      expect(h.amount, h.target).toBeGreaterThanOrEqual(620);
      expect(h.amount, h.target).toBeLessThanOrEqual(700);
    }
  });

  it("Act II's actions in the engine follow the cycle's own order whatever the party does", () => {
    const engine = startAct(experimentFormationAt(ACT_II_LEVELS), 11, 0);
    protectAll(engine, true);
    const log = playDefending(engine, (l) => summarise(l).moves && Object.values(summarise(l).moves).reduce((a, b) => a + b, 0) >= 7, 20000);
    const order = (log as readonly (BattleEvent & { actorId?: string; abilityId?: string })[]).filter((e) => e.type === 'action-start' && e.actorId === EXPERIMENT_ENEMY_ID).map((e) => e.abilityId);
    expect(order.slice(0, 7)).toEqual([R[3], A, R[3], A, L, N, A]);
  });

  it('the Experiment at Special 1 only ever attacks, and cannot make Act I a loss for a party that heals', () => {
    const run = driveAct(ACT_I_LEVELS, 3);
    expect(run.outcome).toBe('victory');
    expect(Object.keys(run.moves)).toEqual([A]);
    expect(run.kos).toBe(0);
  });
});

describe('the chapter through both acts', () => {
  it('the shipped line wins Act I then Act II on every seed of a small bench, and nobody stays down', () => {
    for (let seed = 1; seed <= 8; seed++) {
      const r = driveChapterWithTriggers(seed);
      expect(r.outcome, `seed ${seed}`).toBe('victory');
      expect(r.logs).toHaveLength(2);
    }
  });

  it("the seam trigger fires once, on Act I's fall, and never on Act II's: the bodies' ids differ", () => {
    const r = driveChapterWithTriggers(2);
    const fired = (log: readonly BattleEvent[]): string[] => (log as readonly (BattleEvent & { name?: string })[]).filter((e) => e.type === 'script-trigger').map((e) => e.name!);
    expect(fired(r.logs[0]!)).toEqual([EXPERIMENT_SEAM]);
    expect(fired(r.logs[1]!)).not.toContain(EXPERIMENT_SEAM);
    expect(FFX2_EXPERIMENT.scriptsRef.mid.find((t) => t.id === EXPERIMENT_SEAM)?.when).toEqual({ type: 'ko', who: EXPERIMENT_PROTOTYPE_ID });
  });

  it('Act II opens with the party restored: a girl at 1 HP and 0 MP at the end of Act I stands at full HP and MP, and items spent stay spent', () => {
    const setup = setupForChapter(FFX2_EXPERIMENT, 4);
    const engine = new FFX2Engine(ffx2Options({ atbMode: 'wait' }));
    engine.setSeed(4);
    engine.init(setup);
    for (const id of ['yuna', 'rikku', 'paine']) {
      const c = engine.state().combatants[id]!;
      c.hp = 1;
      c.mp = 0;
    }
    engine.state().flags['inventory:x2-phoenix-down'] = 3;
    const next = setupForNextLink(setup, experimentActTwoGroup, engine.state(), 5);
    const second = new FFX2Engine(ffx2Options({ atbMode: 'wait' }));
    second.setSeed(5);
    second.init(next);
    for (const id of ['yuna', 'rikku', 'paine']) {
      const c = second.state().combatants[id]!;
      expect([c.hp, c.mp], id).toEqual([c.stats.maxHp, c.stats.maxMp]);
    }
    const bag = (next.party as FFX2PartyBuild).inventory.find((i) => i.itemId === 'x2-phoenix-down');
    expect(bag?.count).toBe(3);
    expect(second.state().enemyIds).toEqual([EXPERIMENT_ENEMY_ID]);
  });

  it('Act II is the retry checkpoint (a loss reopens Act II, never Act I or the seam); Act I makes none', () => {
    const setup = setupForChapter(FFX2_EXPERIMENT, 6);
    expect(checkpointAt(1, experimentActOneGroup, setup)).toBeNull();
    const second = setupForNextLink(setup, experimentActTwoGroup, new FFX2Engine(ffx2Options({ atbMode: 'wait' })).state(), 7);
    expect(checkpointAt(2, experimentActTwoGroup, second)).toMatchObject({ group: experimentActTwoGroup, link: 2 });
  });

  it('the chapter record starts at Act I, plays the Chapter V preset and the one-fight setup carries the chapter\'s triggers into Act II', () => {
    const setup = setupForChapter(FFX2_EXPERIMENT, 9);
    expect(setup.enemies).toBe(experimentActOneGroup);
    expect(setup.triggers.map((t) => t.id)).toEqual([EXPERIMENT_SEAM, 'first-lifeslicer', 'first-annihilator']);
    const next = setupForNextLink(setup, experimentActTwoGroup, new FFX2Engine(ffx2Options({ atbMode: 'wait' })).state(), 10);
    expect(next.triggers).toBe(setup.triggers);
  });
});
