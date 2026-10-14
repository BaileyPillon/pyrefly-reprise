/**
 * Tourist Trap (the optional FFX-2 mission, Yojimbo and Daigoro in the Cavern of the Stolen Fayth; the hidden chapter): the game's own rows, its scripts and the fight in the real engine. **FFX-2 only.**
 *
 * What this pins, against the RE parity session's reading of the live Steam build (rows 170 and 174: `research/re-ffx2-yojimbo-valefor.md`) and its review of the scripts `m170` and `m174`
 * (**RE review 2026-10-14**; the numbers are in `tests/fixtures/parity/ffx2/tourist_trap_rows.json`, numbers only):
 *
 * 1. **The rows**: Yojimbo is `monster.bin` row 170 and Daigoro row 174, field by field, as the enemy data carries them and as the attached records lay them; where the row disagrees with the research the
 *    build started on (Reflect, Bribe, the dog) the row wins; nothing the note marks unmapped is wired.
 * 2. **The five command rows** (0x40a1 to 0x40a5): attached to the abilities word for word, none rolls to hit (rule 5), Wakizashi B hits the whole party, Zanmato charges 120 and rests 200.
 * 3. **The poll**: the counter is tested at 100 before the raise and Zanmato is the 14th poll; otherwise it is raised by 8 first and the band is read on the raised value; the roll picks the move in the
 *    review's order; a dog pick is a poll without a turn that raises a flag and wakes Daigoro; the real actions before a Zanmato number 7.25 on average and 4 to 10 in about 96 percent of cycles.
 * 4. **The fight**: in the real engine Zanmato leaves every girl at 1 HP and 1 MP through Protect and Shell, Kozuka takes a quarter of current MP and poisons, Daigoro is an actor of his own who bites on his
 *    own turn after a call and is never a target of a menu or an area move, the intent board reports a real move and the battle ends on Yojimbo's fall with the dog still standing.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import type { BattleEvent, FFX2PartyBuild, StatusId } from '../../../src/battle/common/types.ts';
import { makeRng } from '../../../src/battle/common/rng.ts';
import { asBattleRng } from '../helpers/oneStream.ts';
import { GROUP1_STATUS, GROUP2_STATUS } from '../../../src/battle/ffx2/adapt/slots.ts';
import { Ffx2ScriptStream } from '../../../src/battle/ffx2/adapt/streams.ts';
import { specialWord } from '../../../src/battle/ffx2/adapt/words.ts';
import { FFX2Engine } from '../../../src/battle/ffx2/index.ts';
import { isTargetable } from '../../../src/battle/ffx2/targeting.ts';
import type { AiContext, Ffx2Unit } from '../../../src/battle/ffx2/internal.ts';
import { aiScriptFor } from '../../../src/battle/ffx2/ai/index.ts';
import { AI_IDLE_STEPS, AI_IDLE_WAKE, AI_REPOLL, IDLE_UNTIL_WOKEN, WAKE_ON_FLAG } from '../../../src/battle/ffx2/ai/idle.ts';
import { DAIGORO_CALL_FLAG, YOJIMBO_BANDS, YOJIMBO_COUNTER_STEP, bandFor } from '../../../src/battle/ffx2/ai/tourist-trap.ts';
import { AC, AC_OVERDRIVE } from '../../../src/battle/ffx2/ai/fallen-aeons.ts';
import { FFX2_TOURIST_TRAP } from '../../../src/data/chapter-ffx2-tourist-trap.ts';
import { ABILITIES } from '../../../src/data/ffx2/index.ts';
import { MONSTER_RECORDS } from '../../../src/data/ffx2/monster-records/index.ts';
import {
  CAVERN_YOJIMBO_GROUP,
  TOURIST_TRAP_ACTION_TIME_ON,
  X2_DAIGORO_ID,
  X2_YOJIMBO_ID,
  cavernYojimboGroup,
  x2Daigoro,
  x2Yojimbo,
} from '../../../src/data/ffx2/enemies/tourist-trap.ts';
import { DAIGORO_ACTIONS, TOURIST_TRAP_ACTION_IDS, YOJIMBO_ACTIONS, YOJIMBO_ACTION_IDS, YOJIMBO_SCRIPTS } from '../../../src/data/ffx2/enemies/tourist-trap-abilities.ts';
import { ffx2Options } from '../helpers/ffx2ChapterDrive.ts';
import { driveFight } from '../helpers/touristTrapDrive.ts';

interface Row {
  row: number; formation: number; slot: number; level: number; hp: number; mp: number; str: number; def: number; mag: number; mdef: number; agi: number; acc: number; eva: number; luck: number;
  specialWord: number; absorb: number; nullMask: number; half: number; weak: number; resistGroup1: number[]; resistGroup2: number[]; exp: number; gil: number; ap: number;
  pilferGilFigure: number; dropChanceByte: number; stealChanceByte: number; zantetsuByte: number; abilityList: number[];
  dropItem?: { id: number; common: number; rare: number }; stealItem?: { id: number; common: number; rare: number };
}
interface CommandRow { id: number; flagsTarget: number; flagsMisc: number; flagsDamage: number; damageClass: number; formula: number; power: number; costAtb: number; costCast: number; status1?: Record<string, number> }
interface Fixture {
  yojimbo: Row;
  daigoro: Row;
  researchBeforeTheRows: { level: number; hp: number; mp: number; stats: Record<string, number>; rewards: Record<string, number>; stealRate: number; zantetsu: number };
  commandRows: Record<'kozuka' | 'wakizashiA' | 'wakizashiB' | 'zanmato' | 'daigoroBite', CommandRow>;
  poll: { counterStep: number; zanmatoAt: number; bands: Array<{ raisedFrom: number; rollMod: number; picks: string[] }>; zanmatoPoll: number; realActionsPerCycle: { mean: number; spanOfAbout96Percent: [number, number] } };
}
const FIX = JSON.parse(readFileSync(join(__dirname, '..', '..', 'fixtures', 'parity', 'ffx2', 'tourist_trap_rows.json'), 'utf8')) as Fixture;

const YOJ_KEY = `${CAVERN_YOJIMBO_GROUP}/${X2_YOJIMBO_ID}`;
const DOG_KEY = `${CAVERN_YOJIMBO_GROUP}/${X2_DAIGORO_ID}`;
const { wakizashiA: WA, wakizashiB: WB, kozuka: KZ, zanmato: ZN } = YOJIMBO_ACTIONS;
const BITE = DAIGORO_ACTIONS.bite;

// ----------------------------------------------------------------------------------------------------------------------------------------- 1. the rows

describe("the game's own rows: Yojimbo is row 170 and Daigoro row 174", () => {
  it('the stats, level, HP, MP and rewards are the row, and equal what the wiki gave (the research this build started on)', () => {
    const r = FIX.yojimbo;
    expect([r.row, r.formation, r.slot]).toEqual([170, 1847, 1]);
    expect([x2Yojimbo.level, x2Yojimbo.stats.maxHp, x2Yojimbo.stats.maxMp]).toEqual([r.level, r.hp, r.mp]);
    expect([x2Yojimbo.stats.str, x2Yojimbo.stats.def, x2Yojimbo.stats.mag, x2Yojimbo.stats.mdef, x2Yojimbo.stats.agi, x2Yojimbo.stats.acc, x2Yojimbo.stats.eva, x2Yojimbo.stats.luck]).toEqual([
      r.str, r.def, r.mag, r.mdef, r.agi, r.acc, r.eva, r.luck,
    ]);
    expect([x2Yojimbo.rewards.exp, x2Yojimbo.rewards.ap, x2Yojimbo.rewards.gil, x2Yojimbo.rewards.stolenGil]).toEqual([r.exp, r.ap, r.gil, r.pilferGilFigure]);
    // The wiki's numbers equal the row (RE note section 6.2): the research the build started on.
    const w = FIX.researchBeforeTheRows;
    expect([w.level, w.hp, w.mp]).toEqual([r.level, r.hp, r.mp]);
    expect([w.stats.str, w.stats.mag, w.stats.def, w.stats.mdef, w.stats.agi, w.stats.luck]).toEqual([r.str, r.mag, r.def, r.mdef, r.agi, r.luck]);
    expect([w.rewards.exp, w.rewards.ap, w.rewards.gil, w.rewards.pilferGil, w.stealRate, w.zantetsu]).toEqual([r.exp, r.ap, r.gil, r.pilferGilFigure, r.stealChanceByte, r.zantetsuByte]);
    expect(x2Yojimbo.rewards.steal).toMatchObject({ stealRate: r.stealChanceByte, common: { itemId: 'power-wrist', count: 1 }, rare: { itemId: 'power-wrist', count: 1 } });
    expect(x2Yojimbo.rewards.drops).toEqual([{ itemId: 'recovery-bracer', count: 1 }]);
    expect(r.stealItem).toEqual({ id: 0x9008, common: 1, rare: 1 }); // accessory 9, Power Wrist
    expect(r.dropItem).toEqual({ id: 0x9060, common: 1, rare: 1 }); // accessory 9, Recovery Bracer
  });

  it("the attached record lays the row's resist bytes, accuracy, steal byte, Pilfer Gil and Zantetsu on Yojimbo", () => {
    const rec = MONSTER_RECORDS[YOJ_KEY]!;
    expect(rec).toBeDefined();
    expect([rec.row, rec.table, rec.acc, rec.zantetsu, rec.stealByte, rec.stealGil]).toEqual([170, 1, FIX.yojimbo.acc, FIX.yojimbo.zantetsuByte, FIX.yojimbo.stealChanceByte, FIX.yojimbo.pilferGilFigure]);
    expect(rec.steal).toEqual([0x9008, 1, 0x9008, 1]);
    expect(rec.bribe).toEqual([0, 0, 0, 0]);
    expect(x2Yojimbo.ffx2Record).toBe(rec);
    expect(x2Yojimbo.stats.acc).toBe(95);
    // Every status slot of both groups: 255 in the row means immune on the enemy, anything else means not listed.
    GROUP1_STATUS.forEach((status, i) => {
      if (status === null) return;
      // Indexes 17 and 18 read 255 in the row but the RE note lists them as unmapped (section 5): not wired, so not immune here (`itchy` is the engine's name for slot 17).
      if (i === 17 || i === 18) expect(x2Yojimbo.immunities[status as StatusId], `group 1 slot ${i} ${status} is unmapped, not wired`).toBeUndefined();
      else if (FIX.yojimbo.resistGroup1[i] === 255) expect(x2Yojimbo.immunities[status as StatusId], `group 1 slot ${i} ${status}`).toBe(255);
      else expect(x2Yojimbo.immunities[status as StatusId], `group 1 slot ${i} ${status}`).toBeUndefined();
    });
    GROUP2_STATUS.forEach((statuses, i) => {
      for (const status of statuses) {
        if (FIX.yojimbo.resistGroup2[i] === 255) expect(x2Yojimbo.immunities[status], `group 2 slot ${i} ${status}`).toBe(255);
        else expect(x2Yojimbo.immunities[status], `group 2 slot ${i} ${status}`).toBeUndefined();
      }
    });
    expect(x2Yojimbo.affinities).toEqual({ gravity: 'immune' }); // the null byte is Gravity only (bit 4); every other element is neutral
    expect(FIX.yojimbo.nullMask).toBe(0x10);
  });

  it("where the row disagrees with the research: Reflect is NOT immune (the wiki said so), and Bribe immunity is not assumed either way", () => {
    expect(FIX.yojimbo.resistGroup2[2]).toBe(0); // group 2 index 2 is Reflect: the row reads 0
    expect(x2Yojimbo.immunities.reflect).toBeUndefined();
    expect(x2Yojimbo.immunityFlags).not.toContain('immune-to-bribe');
    expect(x2Yojimbo.immunityFlags).toEqual(['boss', 'immune-to-percentage-damage', 'immune-to-delay']);
    for (const free of ['shell', 'protect', 'reflect', 'regen', 'haste'] as StatusId[]) expect(x2Yojimbo.immunities[free], free).toBeUndefined();
  });

  it("the special word is the game's own: Yojimbo's 0x3c3 and Daigoro's 0, laid on by the record", () => {
    expect(FIX.yojimbo.specialWord).toBe(0x3c3);
    expect(FIX.daigoro.specialWord).toBe(0);
    expect(MONSTER_RECORDS[YOJ_KEY]!.special).toBe(0x3c3);
    expect(MONSTER_RECORDS[DOG_KEY]!.special).toBe(0);
    expect(MONSTER_RECORDS[YOJ_KEY]!.species).toBe(0); // the monster-type word is unmapped (raw 0)
    for (const idx of [17, 18]) expect(MONSTER_RECORDS[YOJ_KEY]!.resist1[idx], `group 1 index ${idx} is unmapped`).toBeUndefined();
  });

  it('Daigoro is an actor of his own: row 174, Lv 30, HP 1, MP 1, 42 / 50 / 61 / 106 / 120 / 95 / 0 / 7, Curse only, no rewards, one command (the bite)', () => {
    const d = FIX.daigoro;
    expect([d.row, d.formation, d.slot]).toEqual([174, 1847, 2]);
    expect([x2Daigoro.level, x2Daigoro.stats.maxHp, x2Daigoro.stats.maxMp]).toEqual([30, 1, 1]);
    expect([x2Daigoro.stats.str, x2Daigoro.stats.def, x2Daigoro.stats.mag, x2Daigoro.stats.mdef, x2Daigoro.stats.agi, x2Daigoro.stats.acc, x2Daigoro.stats.eva, x2Daigoro.stats.luck]).toEqual([
      d.str, d.def, d.mag, d.mdef, d.agi, d.acc, d.eva, d.luck,
    ]);
    expect(x2Daigoro.stats.agi, 'a real gauge: he is in the ATB snapshots with his own Agility, not 0').toBe(120);
    expect(x2Daigoro.ffx2Record).toBe(MONSTER_RECORDS[DOG_KEY]);
    expect(MONSTER_RECORDS[DOG_KEY]).toMatchObject({ row: 174, acc: 95, special: 0, stealByte: 0 });
    expect(x2Daigoro.immunities).toEqual({ curse: 255 }); // group 1 index 8; indexes 17 and 18 are unmapped and not wired
    expect(d.resistGroup2.every((b) => b === 0)).toBe(true);
    expect(x2Daigoro.immunityFlags).toEqual([]);
    expect(x2Daigoro.affinities).toEqual({});
    expect(x2Daigoro.rewards).toEqual({ ap: 0, apOverkill: 0, gil: 0, overkillThreshold: 0, drops: [] });
    expect(d.abilityList, "row 174's own list is empty: the bite is a command of his script").toEqual([]);
    expect(x2Daigoro.abilityIds).toEqual([BITE]);
    // Yojimbo's own list (Kozuka, Wakizashi twice, Zanmato, Die) has no Daigoro move: the bite is not his.
    expect(FIX.yojimbo.abilityList).toEqual([0x40a1, 0x40a2, 0x40a3, 0x40a4, 0x40b2]);
    expect(x2Yojimbo.abilityIds).toEqual([KZ, WA, WB, ZN]);
    expect(x2Yojimbo.abilityIds).not.toContain(BITE);
  });

  it("Daigoro is a part of the group that cannot be targeted (the FFX-2 wiki, single source) and is not counted for victory; the group is Yojimbo, then his dog", () => {
    expect(cavernYojimboGroup.enemies.map((e) => e.id)).toEqual([X2_YOJIMBO_ID]);
    expect(cavernYojimboGroup.parts?.map((e) => e.id)).toEqual([X2_DAIGORO_ID]);
    expect(x2Daigoro.flags).toMatchObject({ untargetable: true, hideHpBar: true, partOf: X2_YOJIMBO_ID });
    expect(cavernYojimboGroup).toMatchObject({ id: CAVERN_YOJIMBO_GROUP, game: 'ffx2', bossId: X2_YOJIMBO_ID, canEscape: false });
    expect(cavernYojimboGroup.nextGroupId).toBeUndefined(); // one fight
    expect(FFX2_TOURIST_TRAP.enemyGroupRef).toBe(cavernYojimboGroup);
    expect(cavernYojimboGroup.actionTimeSeconds).toBe(TOURIST_TRAP_ACTION_TIME_ON ? 3 : undefined);
  });
});

// ----------------------------------------------------------------------------------------------------------------------------------------- 2. the five command rows

describe('the five command rows (0x40a1 to 0x40a5): attached word for word, none rolls to hit', () => {
  const ab = (id: string) => ABILITIES[id]!;
  const ROWS: Array<[string, keyof Fixture['commandRows']]> = [[KZ, 'kozuka'], [WA, 'wakizashiA'], [WB, 'wakizashiB'], [ZN, 'zanmato'], [BITE, 'daigoroBite']];

  it('every id is registered once, FFX-2 only, enemy category, prefixed so nothing collides', () => {
    expect(new Set(TOURIST_TRAP_ACTION_IDS).size).toBe(5);
    for (const id of TOURIST_TRAP_ACTION_IDS) {
      expect(ab(id), id).toBeDefined();
      expect(ab(id).game).toBe('ffx2');
      expect(ab(id).category).toBe('enemy');
      expect(id.startsWith('x2-yojimbo-') || id.startsWith('x2-daigoro-'), id).toBe(true);
    }
    expect([...YOJIMBO_ACTION_IDS, BITE]).toEqual([...TOURIST_TRAP_ACTION_IDS]);
  });

  it("each ability carries the game's row: the id, targets, misc and damage words, class, formula, power and the two costs", () => {
    for (const [id, key] of ROWS) {
      const want = FIX.commandRows[key];
      const rec = ab(id).ffx2Record!;
      expect(rec, id).toBeDefined();
      expect(
        { id: rec.id, flagsTarget: rec.flagsTarget, flagsMisc: rec.flagsMisc, flagsDamage: rec.flagsDamage, damageClass: rec.damageClass, formula: rec.formula, power: rec.power, costAtb: rec.costAtb, costCast: rec.costCast },
        id,
      ).toEqual({ id: want.id, flagsTarget: want.flagsTarget, flagsMisc: want.flagsMisc, flagsDamage: want.flagsDamage, damageClass: want.damageClass, formula: want.formula, power: want.power, costAtb: want.costAtb, costCast: want.costCast });
      expect([rec.hits, rec.accuracy, rec.element, rec.critByte, rec.killer], `${id}: one hit, accuracy byte 0, no element, no crit`).toEqual([1, 0, 0, 0, 0]);
      expect(rec.flagsDamage & 0x4, `${id}: no crit bit`).toBe(0);
      expect((rec.flagsMisc >> 3) & 7, `${id}: accuracy formula 0 never rolls`).toBe(0);
      expect(rec.status1 ?? {}, id).toEqual(Object.fromEntries(Object.entries(want.status1 ?? {}).map(([k, v]) => [Number(k), v])));
      // The ability's own pace agrees with the row's (the row decides; this keeps the two from drifting).
      expect([ab(id).recoveryTicks, ab(id).chargeTicks], `${id}: rest and charge`).toEqual([want.costAtb, want.costCast]);
    }
  });

  it('rule 5: all five carry canMiss false, because all five rows have accuracy formula 0 (the first draft let the physical blows roll and 11 percent were evaded)', () => {
    for (const id of TOURIST_TRAP_ACTION_IDS) expect(ab(id).canMiss, id).toBe(false);
  });

  it('Wakizashi A is one girl and Wakizashi B the whole party (target flags 0x13 and 0x17); the bite is one girl; both Wakizashi and the bite are physical, Kozuka and Zanmato are not', () => {
    expect([ab(WA).targeting, ab(WB).targeting, ab(BITE).targeting, ab(KZ).targeting, ab(ZN).targeting]).toEqual(['single-enemy', 'all-enemies', 'single-enemy', 'single-enemy', 'all-enemies']);
    expect([ab(WA).power, ab(WB).power, ab(BITE).power]).toEqual([16, 13, 16]);
    for (const id of [WA, WB, BITE]) expect(ab(id)).toMatchObject({ formula: 'strength', damageType: 'physical', element: ['none'] });
    expect(ab(BITE).name).toBe('Daigoro');
  });

  it("Kozuka takes a quarter of the target's current MP (4/16, the MP pool only) and poisons at status byte 100; Zanmato sets 1 HP and 1 MP, charges 120 and rests 200", () => {
    const k = ab(KZ);
    expect(k).toMatchObject({ formula: 'percent-current', power: 4, damageType: 'other' });
    expect(k.extra).toMatchObject({ mpOnly: true });
    expect(k.statusEffects).toEqual([{ status: 'poison', chance: 100, duration: 0 }]);
    expect(k.ffx2Record!.status1).toEqual({ 5: 100 }); // group 1 slot 5 is Poison
    expect(GROUP1_STATUS[5]).toBe('poison');
    const z = ab(ZN);
    expect(z).toMatchObject({ formula: 'none', damageType: 'other' });
    expect(z.extra).toEqual({ setHpTo: 1, setMpTo: 1 });
    expect([z.ffx2Record!.costCast, z.ffx2Record!.costAtb]).toEqual([120, 200]);
  });
});

// ----------------------------------------------------------------------------------------------------------------------------------------- 3. the poll

type Girl = { id: string; hp: number; slot: number };
const GIRLS: Girl[] = [{ id: 'yuna', hp: 1000, slot: 0 }, { id: 'rikku', hp: 1000, slot: 1 }, { id: 'paine', hp: 1000, slot: 2 }];

interface Stub {
  ctx: AiContext;
  self: Ffx2Unit;
  /** The `random() mod n` draws taken (stream 2), and the target searches (stream 4). */
  draws: number[];
  searches: { count: number };
}
/** A script context whose `random()` draws come from `rolls` (in order) and whose target search always draws 0 and is counted. With no `rolls`, the real seeded generator. */
function stub(opts: { ac?: number; party?: Girl[]; rolls?: number[]; seed?: number; flags?: Record<string, boolean>; unitId?: string } = {}): Stub {
  const self = { id: opts.unitId ?? X2_YOJIMBO_ID, hp: 22000, stats: { maxHp: 22000 }, aiMemory: opts.ac === undefined ? {} : { [AC]: opts.ac } } as unknown as Ffx2Unit;
  const party = (opts.party ?? GIRLS) as unknown as Ffx2Unit[];
  const draws: number[] = [];
  const searches = { count: 0 };
  const queue = [...(opts.rolls ?? [])];
  const rng =
    opts.rolls === undefined
      ? asBattleRng(makeRng(opts.seed ?? 7) as never)
      : ({
          on: (stream: number) => ({
            int: (): number => {
              if (stream === Ffx2ScriptStream.Random) {
                const v = queue.shift() ?? 0;
                draws.push(v);
                return v;
              }
              searches.count += 1;
              return 0;
            },
          }),
        } as unknown);
  const ctx = { self, units: [], rng: rng as unknown as AiContext['rng'], flags: opts.flags ?? {}, ticks: 0, ability: () => undefined, party: () => party, allies: () => [], emit: () => undefined } as unknown as AiContext;
  return { ctx, self, draws, searches };
}
const yojimbo = aiScriptFor(YOJIMBO_SCRIPTS.yojimbo);
const dog = aiScriptFor(YOJIMBO_SCRIPTS.daigoro);
const acOf = (self: Ffx2Unit): number => (self.aiMemory?.[AC] as number | undefined) ?? 0;
/** One Yojimbo poll: the command it queued ('dog' for a poll that queued none and called the dog). */
function poll(s: Stub): { id: string; targets: string[] } | 'dog' {
  const c = yojimbo.decide(s.ctx);
  if (c === null) {
    expect(s.self.aiMemory?.[AI_REPOLL], 'a poll that queues nothing asks to be polled again').toBe(1);
    return 'dog';
  }
  if (c.kind !== 'ability') throw new Error('no ability');
  return { id: c.id, targets: [...c.targets] };
}
const NAME: Record<string, string> = { wakizashiB: WB, wakizashiA: WA, kozuka: KZ, zanmato: ZN };

describe('the poll: the counter is tested at 100 before the raise, then raised by 8 first, and the band is read on the raised value', () => {
  it('Zanmato is the 14th poll of every cycle and the counter then resets to 0: 13 raises of 8 reach 104', () => {
    expect([FIX.poll.counterStep, FIX.poll.zanmatoAt, FIX.poll.zanmatoPoll]).toEqual([YOJIMBO_COUNTER_STEP, AC_OVERDRIVE, 14]);
    for (const seed of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]) {
      const s = stub({ seed });
      let polls = 0;
      let cycles = 0;
      for (let i = 0; i < 70; i++) {
        polls += 1;
        const r = poll(s);
        if (r !== 'dog' && r.id === ZN) {
          expect(polls, `seed ${seed}: a Zanmato`).toBe(14);
          expect(r.targets, 'on the whole party').toEqual([]);
          expect(acOf(s.self), 'and the counter back to 0').toBe(0);
          polls = 0;
          cycles += 1;
        }
      }
      expect(cycles, `seed ${seed}: 70 polls hold 5 cycles of 14`).toBe(5);
    }
  });

  it('the band is read on the RAISED counter: 22 raises to 30 (the middle band), 62 raises to 70 (the top band), and the Zanmato test is the only one before the raise', () => {
    const mid = stub({ ac: 22, rolls: [1] }); // raised 30: roll 1 of 4 is Wakizashi A (read before the raise it would be the low band's roll 1 of 3: a dog pick)
    expect(poll(mid)).toMatchObject({ id: WA });
    expect(acOf(mid.self)).toBe(30);
    const top = stub({ ac: 62, rolls: [0] }); // raised 70: roll 0 of 4 is Wakizashi B (read before the raise it would be the middle band's Kozuka)
    expect(poll(top)).toMatchObject({ id: WB });
    expect(acOf(top.self)).toBe(70);
    const full = stub({ ac: 96, rolls: [0] }); // 96 is below 100: raised to 104, a band pick, NOT Zanmato yet
    expect(poll(full)).not.toBe('dog');
    expect(acOf(full.self)).toBe(104);
    const zan = stub({ ac: 104, rolls: [0] }); // now the test at 100 fires, with no raise and no roll
    expect(poll(zan)).toMatchObject({ id: ZN });
    expect(zan.draws).toHaveLength(0);
    expect(bandFor(29)).toBe(YOJIMBO_BANDS[2]);
    expect(bandFor(30)).toBe(YOJIMBO_BANDS[1]);
    expect(bandFor(69)).toBe(YOJIMBO_BANDS[1]);
    expect(bandFor(70)).toBe(YOJIMBO_BANDS[0]);
    expect(bandFor(104)).toBe(YOJIMBO_BANDS[0]);
  });

  it("each band's roll picks in the review's order: 70+ roll mod 4 is Wakizashi B, A, Kozuka, dog; 30 to 69 mod 4 is Kozuka, A, dog, dog; below 30 mod 3 is Kozuka, dog, dog", () => {
    expect(YOJIMBO_BANDS.map((b) => ({ from: b.from, picks: b.picks }))).toEqual(FIX.poll.bands.map((b) => ({ from: b.raisedFrom, picks: b.picks })));
    for (const band of FIX.poll.bands) {
      const counter = band.raisedFrom === 70 ? 72 - 8 : band.raisedFrom === 30 ? 32 - 8 : 8 - 8; // raises to 72, 32 and 8: inside each band
      for (let roll = 0; roll < band.rollMod; roll++) {
        const r = poll(stub({ ac: counter, rolls: [roll] }));
        const want = band.picks[roll]!;
        if (want === 'dog') expect(r, `band ${band.raisedFrom}, roll ${roll}`).toBe('dog');
        else expect(r, `band ${band.raisedFrom}, roll ${roll}`).toMatchObject({ id: NAME[want] });
      }
    }
    // The draw is `random() mod N` with N the band's size: a roll of N + 1 is the same as 1.
    expect(poll(stub({ ac: 0, rolls: [4] }))).toBe('dog'); // below 30: 4 mod 3 = 1: a dog pick
    expect(poll(stub({ ac: 64, rolls: [7] }))).toBe('dog'); // raised 72: 7 mod 4 = 3 is the dog
    expect(poll(stub({ ac: 64, rolls: [5] }))).toMatchObject({ id: WA }); // 5 mod 4 = 1 is Wakizashi A
  });

  it('a dog pick is a poll without a turn: it raises the counter and the flag, queues nothing, takes no target search and asks to be polled again on the very next step', () => {
    const s = stub({ ac: 0, rolls: [1] }); // below 30, roll 1 of 3: the dog
    expect(poll(s)).toBe('dog');
    expect(acOf(s.self), 'the counter was raised').toBe(8);
    expect(s.ctx.flags[DAIGORO_CALL_FLAG]).toBe(true);
    expect(s.searches.count, 'no target is searched for a call').toBe(0);
    expect(s.self.aiMemory?.[AI_IDLE_STEPS], 'polled again on the very next step').toBe(1);
    expect(s.self.aiMemory?.[AI_REPOLL]).toBe(1);
    // The next poll starts from the raised counter, and clears the marker.
    const next = decide2(s, 0);
    expect(next).toMatchObject({ id: KZ });
    expect(s.self.aiMemory?.[AI_REPOLL]).toBe(0);
  });

  it('a real action takes a target search (one living girl) except Wakizashi B and Zanmato, which take none; an empty party does nothing and costs no count', () => {
    const one = stub({ ac: 0, rolls: [0] });
    const r = poll(one);
    expect(r).toMatchObject({ id: KZ });
    expect((r as { targets: string[] }).targets).toHaveLength(1);
    expect(GIRLS.map((g) => g.id)).toContain((r as { targets: string[] }).targets[0]);
    const all = stub({ ac: 64, rolls: [0] });
    expect(poll(all)).toMatchObject({ id: WB, targets: [] });
    expect(all.searches.count, 'no search for the whole party').toBe(0);
    const empty = stub({ ac: 40, party: [] });
    expect(yojimbo.decide(empty.ctx)).toBeNull();
    expect(acOf(empty.self)).toBe(40);
    expect(empty.self.aiMemory?.[AI_REPOLL], 'and it is not a call to the dog').toBe(0);
  });

  it('the real actions before a Zanmato: 7.25 on average, and 4 to 10 in about 96 percent of cycles (exact, from the bands)', () => {
    // 13 polls precede the 14th: poll k reads the raised counter 8k. The probability that poll k is a real action is its band's share of non-dog picks.
    const real = (k: number): number => {
      const band = bandFor(8 * k);
      return band.picks.filter((p) => p !== 'dog').length / band.picks.length;
    };
    let dist = [1];
    for (let k = 1; k <= 13; k++) {
      const p = real(k);
      const next = new Array(dist.length + 1).fill(0) as number[];
      dist.forEach((q, n) => {
        next[n] = (next[n] ?? 0) + q * (1 - p);
        next[n + 1] = (next[n + 1] ?? 0) + q * p;
      });
      dist = next;
    }
    const mean = dist.reduce((m, q, n) => m + n * q, 0);
    expect(mean).toBeCloseTo(FIX.poll.realActionsPerCycle.mean, 6);
    const [lo, hi] = FIX.poll.realActionsPerCycle.spanOfAbout96Percent;
    const inside = dist.slice(lo, hi + 1).reduce((m, q) => m + q, 0);
    expect(inside).toBeGreaterThan(0.95);
    expect(inside).toBeLessThan(0.975);
  });

  it('is deterministic under the seeded RNG: the same seed gives the same polls and targets, a different seed need not', () => {
    const run = (seed: number): string => {
      const s = stub({ seed });
      return JSON.stringify(Array.from({ length: 28 }, () => poll(s)));
    };
    expect(run(11)).toBe(run(11));
    expect(run(11)).not.toBe(run(12));
  });
});

/** The next poll of the same stub with a fresh roll. */
function decide2(s: Stub, roll: number): { id: string; targets: string[] } | 'dog' {
  const next = stub({ ac: acOf(s.self), rolls: [roll], flags: s.ctx.flags as Record<string, boolean> });
  next.self.aiMemory = s.self.aiMemory;
  return poll(next);
}

describe("Daigoro's script: bite one girl when called, else wait to be woken", () => {
  it('with the call up he clears it and bites exactly one living girl with his own command', () => {
    const s = stub({ unitId: X2_DAIGORO_ID, rolls: [], flags: { [DAIGORO_CALL_FLAG]: true } });
    const c = dog.decide(s.ctx);
    expect(c).toMatchObject({ kind: 'ability', id: BITE });
    expect((c as { targets: string[] }).targets).toHaveLength(1);
    expect(s.ctx.flags[DAIGORO_CALL_FLAG]).toBe(false);
    expect(s.searches.count, 'one target search').toBe(1);
  });

  it('with no call he does nothing and asks to sleep until woken by the flag; a call with no girl standing is not answered', () => {
    const s = stub({ unitId: X2_DAIGORO_ID, rolls: [] });
    expect(dog.decide(s.ctx)).toBeNull();
    expect(s.self.aiMemory?.[AI_IDLE_STEPS]).toBe(IDLE_UNTIL_WOKEN);
    expect(s.self.aiMemory?.[AI_IDLE_WAKE]).toBe(WAKE_ON_FLAG);
    const none = stub({ unitId: X2_DAIGORO_ID, rolls: [], party: [], flags: { [DAIGORO_CALL_FLAG]: true } });
    expect(dog.decide(none.ctx)).toBeNull();
    expect(none.ctx.flags[DAIGORO_CALL_FLAG], 'the call stands').toBe(true);
  });
});

// ----------------------------------------------------------------------------------------------------------------------------------------- 4. the fight

const PROTECT = { id: 'protect', turnsRemaining: null, ticksRemaining: 99_999_999, charges: null, stacks: 0, permanent: false } as never;
const SHELL = { id: 'shell', turnsRemaining: null, ticksRemaining: 99_999_999, charges: null, stacks: 0, permanent: false } as never;

function start(seed: number, ac: number): FFX2Engine {
  const engine = new FFX2Engine(ffx2Options({ atbMode: 'wait' }));
  engine.setSeed(seed);
  engine.init({ game: 'ffx2', party: FFX2_TOURIST_TRAP.buildRef as FFX2PartyBuild, enemies: cavernYojimboGroup, triggers: [], seed, condition: 'normal', canEscape: false });
  (engine.state().combatants[X2_YOJIMBO_ID] as unknown as Ffx2Unit).aiMemory = { [AC]: ac };
  return engine;
}
/** The party always defends, and the clock runs, until `until` says stop or the fight ends: the enemies' own moves, undisturbed by a party that fights back. */
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
type Ev = { type: string; actorId?: string; abilityId?: string; targetId?: string; amount?: number; status?: string; elapsedTicks?: number };
const yojimboActions = (log: readonly BattleEvent[]): number => log.filter((e) => e.type === 'action-start' && (e as Ev).actorId === X2_YOJIMBO_ID).length;

describe('the fight in the real engine', () => {
  it('Zanmato leaves every girl who stands at 1 HP and 1 MP, with Protect and Shell both up, and kills no one', () => {
    for (const seed of [1, 2, 3]) {
      const engine = start(seed, 100); // the first poll is Zanmato
      for (const id of ['yuna', 'rikku', 'paine']) {
        const c = engine.state().combatants[id]!;
        (c.statuses as Record<string, unknown>)['protect'] = PROTECT;
        (c.statuses as Record<string, unknown>)['shell'] = SHELL;
      }
      const before = Object.fromEntries(['yuna', 'rikku', 'paine'].map((id) => [id, engine.state().combatants[id]!.hp]));
      // The 120-unit charge runs first: play on until Yojimbo's action has ended.
      const log = playDefending(engine, (l) => l.some((e) => e.type === 'action-start' && (e as Ev).actorId === X2_YOJIMBO_ID) && l.some((e) => e.type === 'action-end' && (e as Ev).actorId === X2_YOJIMBO_ID && l.findIndex((x) => x.type === 'damage') >= 0));
      const first = log.find((e) => e.type === 'action-start' && (e as Ev).actorId === X2_YOJIMBO_ID) as unknown as Ev;
      expect(first.abilityId, `seed ${seed}`).toBe(ZN);
      for (const id of ['yuna', 'rikku', 'paine']) {
        const c = engine.state().combatants[id]!;
        expect([c.alive, c.hp, c.mp], `${id} after Zanmato, seed ${seed}`).toEqual([true, 1, 1]);
        const hit = log.find((e) => e.type === 'damage' && (e as Ev).targetId === id) as unknown as Ev;
        expect(hit.amount, `${id}: damage is HP - 1`).toBe(before[id]! - 1);
      }
      expect(log.filter((e) => e.type === 'ko')).toEqual([]);
      expect(log.filter((e) => e.type === 'miss')).toEqual([]); // it never rolls
    }
  });

  it("every Kozuka takes a quarter of the target's current MP (4/16, rounded down), leaves its HP alone and poisons it", () => {
    let seen = 0;
    for (const seed of [1, 2, 3, 4, 5, 6]) {
      const engine = start(seed, 0);
      const mp: Record<string, number> = Object.fromEntries(['yuna', 'rikku', 'paine'].map((id) => [id, engine.state().combatants[id]!.mp]));
      const log = playDefending(engine, (l) => yojimboActions(l) >= 8) as unknown as Ev[];
      let kozuka = false;
      let target: string | undefined;
      for (const e of log) {
        if (e.type === 'action-start' && e.actorId === X2_YOJIMBO_ID) kozuka = e.abilityId === KZ;
        if (e.type === 'action-end' && e.actorId === X2_YOJIMBO_ID) kozuka = false; // the window is the action itself: the Poison it leaves ticks afterwards
        if (e.type === 'mp-damage' && e.targetId !== undefined) {
          if (kozuka) {
            expect(e.amount, `seed ${seed}: a quarter of ${e.targetId}'s ${mp[e.targetId]} MP`).toBe(Math.floor(((mp[e.targetId] ?? 0) * 4) / 16));
            target = e.targetId;
            seen += 1;
          }
          mp[e.targetId] = (mp[e.targetId] ?? 0) - (e.amount ?? 0);
        }
        if (kozuka && e.type === 'damage') expect(e.targetId, 'no HP damage from Kozuka').not.toBe(target);
        if (kozuka && e.type === 'status-add' && e.status === 'poison') expect(e.targetId).toBe(target);
      }
    }
    expect(seen, 'Kozuka was thrown at least once across the seeds').toBeGreaterThan(0);
  });

  it("a dog pick raises the call and wakes Daigoro: he is polled within a few steps and his bite is HIS action, never Yojimbo's", () => {
    const run = driveFight(1, { line: 'intended' });
    const ev = run.log as unknown as Ev[];
    const bites = ev.filter((e) => e.type === 'action-start' && e.actorId === X2_DAIGORO_ID);
    expect(bites.length, 'he bit').toBeGreaterThan(0);
    for (const b of bites) expect(b.abilityId).toBe(BITE);
    expect(ev.some((e) => e.type === 'action-start' && e.actorId === X2_YOJIMBO_ID && e.abilityId === BITE), 'Yojimbo never uses the bite').toBe(false);
    // Yojimbo's dog picks: a poll (turn-start) with no action of his before his next poll.
    const picks: number[] = [];
    let lastPollAt = -1;
    let acted = true;
    ev.forEach((e, i) => {
      if (e.type === 'turn-start' && e.actorId === X2_YOJIMBO_ID) {
        if (lastPollAt >= 0 && !acted) picks.push(lastPollAt);
        lastPollAt = i;
        acted = false;
      }
      if (e.type === 'action-start' && e.actorId === X2_YOJIMBO_ID) acted = true;
    });
    expect(picks.length, 'there were dog picks').toBeGreaterThan(0);
    expect(bites.length, 'a bite answers a call: never more bites than calls').toBeLessThanOrEqual(picks.length);
    // A call that finds him asleep (his last poll was silent) wakes him: he is polled on the very next steps. One that finds him biting or recovering waits for his own next poll.
    let woken = 0;
    for (const seed of [1, 2, 3, 4, 5, 6]) {
      const log = driveFight(seed, { line: 'intended' }).log as unknown as Ev[];
      const turnStarts = log.map((e, i) => (e.type === 'turn-start' && e.actorId === X2_YOJIMBO_ID ? i : -1)).filter((i) => i >= 0);
      for (const [n, i] of turnStarts.entries()) {
        const next = turnStarts[n + 1] ?? log.length;
        const acted = log.slice(i, next).some((e) => e.type === 'action-start' && e.actorId === X2_YOJIMBO_ID);
        if (acted) continue; // a real action: not a call
        const asleep = (() => {
          for (let j = i - 1; j >= 0; j--) {
            const e = log[j]!;
            if (e.type === 'action-start' && e.actorId === X2_DAIGORO_ID) return false;
            if (e.type === 'turn-start' && e.actorId === X2_DAIGORO_ID) return true;
          }
          return false;
        })();
        if (!asleep) continue;
        const dogTurn = log.findIndex((e, j) => j > i && e.type === 'turn-start' && e.actorId === X2_DAIGORO_ID);
        expect(dogTurn, `seed ${seed}: a call that finds him asleep is answered`).toBeGreaterThan(i);
        expect((log[dogTurn]!.elapsedTicks ?? 0) - (log[i]!.elapsedTicks ?? 0), `seed ${seed}: woken, polled within two steps of the call`).toBeLessThanOrEqual(2);
        woken += 1;
      }
    }
    expect(woken, 'at least one call found him asleep').toBeGreaterThan(0);
  });

  it('Daigoro is never a target: not of a menu, not of an area move (the Dark Knights\' Darkness hits every enemy it can reach), and the fight ends on Yojimbo\'s fall with the dog standing', () => {
    const engine = new FFX2Engine(ffx2Options({ atbMode: 'wait' }));
    engine.setSeed(1);
    engine.init({ game: 'ffx2', party: FFX2_TOURIST_TRAP.buildRef as FFX2PartyBuild, enemies: cavernYojimboGroup, triggers: [], seed: 1, condition: 'normal', canEscape: false });
    const dogUnit = engine.state().combatants[X2_DAIGORO_ID] as unknown as Ffx2Unit;
    expect(dogUnit.alive).toBe(true);
    expect(dogUnit.flags.isPart).toBe(true);
    expect(isTargetable(dogUnit)).toBe(false);
    let darkness = 0;
    for (let i = 0; i < 4000 && darkness < 2; i++) {
      const d = engine.nextDecision();
      if (d.kind === 'battle-over') break;
      if (d.kind === 'waiting') {
        engine.tick(Math.max(1, d.nextEventMs));
        continue;
      }
      if (d.kind !== 'player-input') continue;
      for (const c of d.commands) expect(c.validTargets, `${c.command.kind}`).not.toContain(X2_DAIGORO_ID);
      const row = d.commands.find((c) => c.enabled && c.command.kind === 'ability' && (c.command as { id: string }).id === 'x2-dark-knight-darkness');
      if (row) {
        darkness += 1;
        engine.submit({ ...row.command, targets: [] } as never);
      } else engine.submit({ kind: 'defend', targets: [] });
    }
    expect(darkness, 'an area move was cast').toBeGreaterThan(0);
    const hit = (engine.state().log as unknown as Ev[]).filter((e) => e.targetId === X2_DAIGORO_ID && (e.type === 'damage' || e.type === 'ko' || e.type === 'status-add' || e.type === 'miss'));
    expect(hit, 'the dog was never touched').toEqual([]);
    expect(dogUnit.hp).toBe(1);
    const run = driveFight(1, { line: 'intended' });
    expect(run.outcome).toBeDefined();
    expect((run.log as unknown as Ev[]).some((e) => e.targetId === X2_DAIGORO_ID && (e.type === 'damage' || e.type === 'ko')), 'and not in a whole fight').toBe(false);
    if (run.outcome === 'victory') expect((run.log as unknown as Ev[]).some((e) => e.type === 'ko' && e.targetId === X2_YOJIMBO_ID)).toBe(true);
  });

  it("the intent board reports a real move for Yojimbo (never 'No action' for a poll that is not a turn), and Zanmato as certain once the count is full", () => {
    const engine = start(2, 0);
    const intent = engine.intent();
    expect(intent, 'an intent for whoever acts soonest').not.toBeNull();
    expect(intent!.enemyId, 'Daigoro sleeps, so it is Yojimbo').toBe(X2_YOJIMBO_ID);
    expect(intent!.kind).not.toBe('pass');
    const labels = [intent!.moveName, ...intent!.branches.map((b) => b.label)];
    for (const label of labels) expect(label, 'a real move').not.toMatch(/no action/i);
    expect(intent!.abilityId === null ? 'null' : YOJIMBO_ACTION_IDS).not.toBe('null');
    const full = start(2, 100);
    const sure = full.intent();
    expect(sure!.moveName).toBe('Zanmato');
    expect(sure!.confidence).toBe('scripted');
  });

  it("every Zanmato of a whole fight is the 14th, 28th, 42nd ... poll, and the special word reaches the kernel as the game's 0x3c3", () => {
    for (const seed of [1, 2, 3, 4]) {
      for (const line of ['naive', 'intended'] as const) {
        const run = driveFight(seed, { line });
        run.zanmatoPolls.forEach((p, i) => expect(p, `seed ${seed} ${line}: Zanmato number ${i + 1}`).toBe(14 * (i + 1)));
      }
    }
    const engine = start(1, 0);
    expect(specialWord(engine.state().combatants[X2_YOJIMBO_ID] as never)).toBe(0x3c3);
    expect(specialWord(engine.state().combatants[X2_DAIGORO_ID] as never)).toBe(0);
  });
});
