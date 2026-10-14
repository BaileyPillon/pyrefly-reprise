/**
 * Tourist Trap (the optional FFX-2 mission, Yojimbo and Daigoro in the Cavern of the Stolen Fayth; the hidden chapter): the game's own rows, its script and the fight in the real engine. **FFX-2 only.**
 *
 * What this pins, against the RE parity session's reading of the live Steam build (`research/re-ffx2-yojimbo-valefor.md`; the numbers are in `tests/fixtures/parity/ffx2/tourist_trap_rows.json`,
 * numbers only) and the research the script was built on (`research/ffx-yojimbo.md` section 8.2, `research/ffx2-fallen-aeons.md` section 7.2):
 *
 * 1. **The rows**: Yojimbo is `monster.bin` row 170 and Daigoro row 174, field by field, as the enemy data carries them and as the attached records lay them; where the row disagrees with
 *    the research the build started on (Reflect, Bribe) the row wins; nothing the note marks unmapped is wired (the special word is reduced to its proven bits).
 * 2. **The abilities**: damage constants 16, 13 and 16, Kozuka's quarter of current MP and its Poison, Zanmato's 1 HP and 1 MP; the hit rule (rule 5): only the physical blows roll.
 * 3. **The script**: the counter rises by 8 on each of his turns, is tested before it is raised, falls into its three bands at 0, 30 and 70, makes Zanmato his 14th turn, resets to 0, and each
 *    band's roll picks its moves in the sourced fractions; deterministic under the seeded RNG; Daigoro waits forever.
 * 4. **The fight**: in the real engine Zanmato leaves every girl who stands at 1 HP and 1 MP through Protect and Shell, Kozuka takes a quarter of current MP and poisons, Daigoro cannot be
 *    targeted and makes one silent poll and no action, and the battle ends on Yojimbo's fall with the dog still standing.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import type { BattleEvent, StatusId } from '../../../src/battle/common/types.ts';
import { makeRng } from '../../../src/battle/common/rng.ts';
import { asBattleRng } from '../helpers/oneStream.ts';
import { GROUP1_STATUS, GROUP2_STATUS } from '../../../src/battle/ffx2/adapt/slots.ts';
import { Ffx2ScriptStream } from '../../../src/battle/ffx2/adapt/streams.ts';
import { specialWord } from '../../../src/battle/ffx2/adapt/words.ts';
import { FFX2Engine } from '../../../src/battle/ffx2/index.ts';
import { isTargetable } from '../../../src/battle/ffx2/targeting.ts';
import type { AiContext, Ffx2Unit } from '../../../src/battle/ffx2/internal.ts';
import { aiScriptFor } from '../../../src/battle/ffx2/ai/index.ts';
import { AI_IDLE_STEPS, IDLE_UNTIL_WOKEN } from '../../../src/battle/ffx2/ai/idle.ts';
import { YOJIMBO_BANDS, YOJIMBO_COUNTER_STEP, bandFor } from '../../../src/battle/ffx2/ai/tourist-trap.ts';
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
import { YOJIMBO_ACTIONS, YOJIMBO_ACTION_IDS, YOJIMBO_SCRIPTS } from '../../../src/data/ffx2/enemies/tourist-trap-abilities.ts';
import { ffx2Options } from '../helpers/ffx2ChapterDrive.ts';
import { driveFight } from '../helpers/touristTrapDrive.ts';
import type { FFX2PartyBuild } from '../../../src/battle/common/types.ts';

interface Row {
  row: number; formation: number; slot: number; level: number; hp: number; mp: number; str: number; def: number; mag: number; mdef: number; agi: number; acc: number; eva: number; luck: number;
  specialWord: number; absorb: number; nullMask: number; half: number; weak: number; resistGroup1: number[]; resistGroup2: number[]; exp: number; gil: number; ap: number;
  pilferGilFigure: number; dropChanceByte: number; stealChanceByte: number; zantetsuByte: number; abilityList: number[];
  dropItem?: { id: number; common: number; rare: number }; stealItem?: { id: number; common: number; rare: number };
}
interface Fixture { yojimbo: Row; daigoro: Row; researchBeforeTheRows: { level: number; hp: number; mp: number; stats: Record<string, number>; rewards: Record<string, number>; stealRate: number; zantetsu: number } }
const FIX = JSON.parse(readFileSync(join(__dirname, '..', '..', 'fixtures', 'parity', 'ffx2', 'tourist_trap_rows.json'), 'utf8')) as Fixture;

const YOJ_KEY = `${CAVERN_YOJIMBO_GROUP}/${X2_YOJIMBO_ID}`;
const DOG_KEY = `${CAVERN_YOJIMBO_GROUP}/${X2_DAIGORO_ID}`;

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
    // Every status slot of both groups: 255 in the row means immune on the enemy, anything else means not listed; indexes the engine has no slot for are skipped.
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

  it("the special word is wired as its proven bits only: the row's 0x3c3 becomes 0x43 (percent formulas, hit reactions, ATB damage); bits 7, 8 and 9 are left out", () => {
    expect(FIX.yojimbo.specialWord).toBe(0x3c3);
    expect(FIX.yojimbo.specialWord & 0x43).toBe(0x43);
    const rec = MONSTER_RECORDS[YOJ_KEY]!;
    expect(rec.special).toBe(0x43);
    expect(rec.special & 0x200).toBe(0); // the engine reads bit 9 as Bribe; the RE note leaves it open
    expect(rec.special & 0x180).toBe(0); // bits 7 and 8: unmapped
    expect(rec.species).toBe(0); // the monster-type word is unmapped (raw 0)
    for (const idx of [17, 18]) expect(rec.resist1[idx], `group 1 index ${idx} is unmapped`).toBeUndefined();
  });

  it('Daigoro is a record of his own: row 174, Lv 30, HP 1, MP 1, 42 / 50 / 61 / 106 / 120 / 95 / 0 / 7, Curse only, no rewards, no ability list', () => {
    const d = FIX.daigoro;
    expect([d.row, d.formation, d.slot]).toEqual([174, 1847, 2]);
    expect([x2Daigoro.level, x2Daigoro.stats.maxHp, x2Daigoro.stats.maxMp]).toEqual([30, 1, 1]);
    expect([x2Daigoro.stats.str, x2Daigoro.stats.def, x2Daigoro.stats.mag, x2Daigoro.stats.mdef, x2Daigoro.stats.agi, x2Daigoro.stats.acc, x2Daigoro.stats.eva, x2Daigoro.stats.luck]).toEqual([
      d.str, d.def, d.mag, d.mdef, d.agi, d.acc, d.eva, d.luck,
    ]);
    expect(x2Daigoro.ffx2Record).toBe(MONSTER_RECORDS[DOG_KEY]);
    expect(MONSTER_RECORDS[DOG_KEY]).toMatchObject({ row: 174, acc: 95, special: 0, stealByte: 0 });
    expect(x2Daigoro.immunities).toEqual({ curse: 255 }); // group 1 index 8; indexes 17 and 18 are unmapped and not wired
    expect(d.resistGroup2.every((b) => b === 0)).toBe(true);
    expect(x2Daigoro.immunityFlags).toEqual([]);
    expect(x2Daigoro.affinities).toEqual({});
    expect(x2Daigoro.rewards).toEqual({ ap: 0, apOverkill: 0, gil: 0, overkillThreshold: 0, drops: [] });
    expect(x2Daigoro.abilityIds).toEqual([]);
    expect(d.abilityList).toEqual([]);
    // Yojimbo's own list (Kozuka, Wakizashi twice, Zanmato, Die) has no Daigoro move: the strike comes from the sourced table (see the handoff).
    expect(FIX.yojimbo.abilityList).toEqual([0x40a1, 0x40a2, 0x40a3, 0x40a4, 0x40b2]);
  });

  it("Daigoro is a part of the group that cannot be targeted (the FFX-2 wiki, single source), and the group is Yojimbo, then his dog", () => {
    expect(cavernYojimboGroup.enemies.map((e) => e.id)).toEqual([X2_YOJIMBO_ID]);
    expect(cavernYojimboGroup.parts?.map((e) => e.id)).toEqual([X2_DAIGORO_ID]);
    expect(x2Daigoro.flags).toMatchObject({ untargetable: true, hideHpBar: true, partOf: X2_YOJIMBO_ID });
    expect(cavernYojimboGroup).toMatchObject({ id: CAVERN_YOJIMBO_GROUP, game: 'ffx2', bossId: X2_YOJIMBO_ID, canEscape: false });
    expect(cavernYojimboGroup.nextGroupId).toBeUndefined(); // one fight
    expect(FFX2_TOURIST_TRAP.enemyGroupRef).toBe(cavernYojimboGroup);
    expect(cavernYojimboGroup.actionTimeSeconds).toBe(TOURIST_TRAP_ACTION_TIME_ON ? 3 : undefined);
  });
});

// ----------------------------------------------------------------------------------------------------------------------------------------- 2. the abilities

describe('the five actions: damage constants, the hit rule, Kozuka and Zanmato', () => {
  const ab = (id: string) => ABILITIES[id]!;

  it('every id is registered once, FFX-2 only, enemy category, prefixed so nothing collides', () => {
    expect(new Set(YOJIMBO_ACTION_IDS).size).toBe(5);
    for (const id of YOJIMBO_ACTION_IDS) {
      expect(ab(id), id).toBeDefined();
      expect(ab(id).game).toBe('ffx2');
      expect(ab(id).category).toBe('enemy');
      expect(id.startsWith('x2-yojimbo-')).toBe(true);
    }
    expect(x2Yojimbo.abilityIds).toEqual([...YOJIMBO_ACTION_IDS]);
  });

  it('Wakizashi A, Wakizashi B and Daigoro are physical, single target and non-elemental, damage constants 16, 13 and 16', () => {
    expect([ab(YOJIMBO_ACTIONS.wakizashiA).power, ab(YOJIMBO_ACTIONS.wakizashiB).power, ab(YOJIMBO_ACTIONS.daigoro).power]).toEqual([16, 13, 16]);
    for (const id of [YOJIMBO_ACTIONS.wakizashiA, YOJIMBO_ACTIONS.wakizashiB, YOJIMBO_ACTIONS.daigoro]) {
      expect(ab(id)).toMatchObject({ formula: 'strength', damageType: 'physical', targeting: 'single-enemy', element: ['none'] });
      expect(ab(id).canMiss, `${id}: a physical blow rolls to hit (rule 5)`).not.toBe(false);
    }
  });

  it("Kozuka takes a quarter of the target's current MP (4/16, the MP pool only) and poisons, and never rolls; Zanmato never rolls and sets 1 HP and 1 MP", () => {
    const k = ab(YOJIMBO_ACTIONS.kozuka);
    expect(k).toMatchObject({ formula: 'percent-current', power: 4, damageType: 'other', targeting: 'single-enemy', canMiss: false });
    expect(k.extra).toMatchObject({ mpOnly: true });
    expect(k.statusEffects).toEqual([{ status: 'poison', chance: 254, duration: 0 }]);
    const z = ab(YOJIMBO_ACTIONS.zanmato);
    expect(z).toMatchObject({ formula: 'none', targeting: 'all-enemies', damageType: 'other', canMiss: false });
    expect(z.extra).toEqual({ setHpTo: 1, setMpTo: 1 });
  });
});

// ----------------------------------------------------------------------------------------------------------------------------------------- 3. the script

type Girl = { id: string; hp: number; slot: number };
const GIRLS: Girl[] = [{ id: 'yuna', hp: 1000, slot: 0 }, { id: 'rikku', hp: 1000, slot: 1 }, { id: 'paine', hp: 1000, slot: 2 }];

/** A script context whose `random() mod n` draws come from `rolls` (in order), and whose target search always draws 0. */
function stub(opts: { ac?: number; party?: Girl[]; rolls?: number[]; seed?: number } = {}): { ctx: AiContext; self: Ffx2Unit; draws: number[] } {
  const self = { id: X2_YOJIMBO_ID, hp: 22000, stats: { maxHp: 22000 }, aiMemory: opts.ac === undefined ? {} : { [AC]: opts.ac } } as unknown as Ffx2Unit;
  const party = (opts.party ?? GIRLS) as unknown as Ffx2Unit[];
  const draws: number[] = [];
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
              return 0;
            },
          }),
        } as unknown);
  const ctx = { self, units: [], rng: rng as unknown as AiContext['rng'], flags: {}, ticks: 0, ability: () => undefined, party: () => party, allies: () => [], emit: () => undefined } as unknown as AiContext;
  return { ctx, self, draws };
}
const decide = (ctx: AiContext): { id: string; targets: string[] } => {
  const c = aiScriptFor(YOJIMBO_SCRIPTS.yojimbo).decide(ctx);
  if (!c || c.kind !== 'ability') throw new Error('no ability');
  return { id: c.id, targets: [...c.targets] };
};
const { wakizashiA: WA, wakizashiB: WB, daigoro: DG, kozuka: KZ, zanmato: ZN } = YOJIMBO_ACTIONS;
const acOf = (self: Ffx2Unit): number => (self.aiMemory?.[AC] as number | undefined) ?? 0;

describe("the script: the action counter, +8 on each of his turns, Zanmato on the 14th", () => {
  it('the counter is tested before it is raised: turn n reads 8 x (n - 1), so the first Zanmato is turn 14, and the counter then resets to 0', () => {
    const { ctx, self } = stub({ rolls: Array(60).fill(0) });
    const seen: Array<{ turn: number; before: number; id: string }> = [];
    for (let turn = 1; turn <= 16; turn++) {
      const before = acOf(self);
      const d = decide(ctx);
      seen.push({ turn, before, id: d.id });
    }
    expect(seen.slice(0, 13).map((s) => s.before)).toEqual(Array.from({ length: 13 }, (_, i) => i * YOJIMBO_COUNTER_STEP)); // 0, 8, ..., 96
    expect(seen.slice(0, 13).every((s) => s.id !== ZN)).toBe(true);
    expect(seen[13]).toEqual({ turn: 14, before: 104, id: ZN });
    expect(seen[14]).toEqual({ turn: 15, before: 0, id: expect.not.stringMatching(ZN) }); // the reset: turn 15 reads 0 again
    expect(AC_OVERDRIVE).toBe(100);
    expect(YOJIMBO_COUNTER_STEP).toBe(8);
  });

  it("Zanmato is aimed at no one (the whole party), every other move at exactly one living girl, and an empty party does nothing and costs no count", () => {
    const { ctx, self } = stub({ ac: 100, rolls: [0] });
    expect(decide(ctx)).toEqual({ id: ZN, targets: [] });
    expect(acOf(self)).toBe(0);
    const again = stub({ ac: 0, rolls: [0, 0, 0] });
    const d = decide(again.ctx);
    expect(d.targets).toHaveLength(1);
    expect(GIRLS.map((g) => g.id)).toContain(d.targets[0]);
    const empty = stub({ ac: 40, party: [] });
    expect(aiScriptFor(YOJIMBO_SCRIPTS.yojimbo).decide(empty.ctx)).toBeNull();
    expect(acOf(empty.self)).toBe(40);
  });

  it('the bands by the counter at the start of the turn: 0 to 29, 30 to 69, 70 to 99, with the edges between them', () => {
    expect(YOJIMBO_BANDS.map((b) => b.upTo)).toEqual([29, 69, 99]);
    for (const [counter, band] of [[0, 0], [8, 0], [24, 0], [29, 0], [30, 1], [32, 1], [64, 1], [69, 1], [70, 2], [72, 2], [96, 2], [99, 2]] as const) {
      expect(bandFor(counter), `counter ${counter}`).toBe(YOJIMBO_BANDS[band]);
    }
  });

  it("each band's roll picks its moves in the sourced fractions: Daigoro 2/3 and Kozuka 1/3; Daigoro 1/2, Kozuka 1/4 and Wakizashi A 1/4; a quarter each with Wakizashi B", () => {
    // one count per roll value: the repeats in the band tables are the fractions
    const band = (counter: number, n: number): string[] => Array.from({ length: n }, (_, roll) => decide(stub({ ac: counter, rolls: [roll] }).ctx).id);
    expect(band(0, 3)).toEqual([DG, DG, KZ]);
    expect(band(40, 4)).toEqual([DG, DG, KZ, WA]);
    expect(band(80, 4)).toEqual([DG, KZ, WA, WB]);
    const tally = (ids: string[]): Record<string, number> => ids.reduce<Record<string, number>>((m, id) => ({ ...m, [id]: (m[id] ?? 0) + 1 }), {});
    expect(tally(band(0, 3))).toEqual({ [DG]: 2, [KZ]: 1 }); // 2/3 and 1/3
    expect(tally(band(40, 4))).toEqual({ [DG]: 2, [KZ]: 1, [WA]: 1 }); // 1/2, 1/4, 1/4
    expect(tally(band(80, 4))).toEqual({ [DG]: 1, [KZ]: 1, [WA]: 1, [WB]: 1 }); // 1/4 each
    // The roll is `random() mod N` with N the band's size: one draw a turn, and none on the Zanmato turn.
    const one = stub({ ac: 0, rolls: [5] });
    decide(one.ctx);
    expect(one.draws).toHaveLength(1);
    const zan = stub({ ac: 100, rolls: [5] });
    decide(zan.ctx);
    expect(zan.draws).toHaveLength(0);
  });

  it('the moves a turn can pick depend on the counter alone: Wakizashi A only from 30, Wakizashi B only from 70, Kozuka and Daigoro from the start', () => {
    const seen = (counter: number): Set<string> => new Set(Array.from({ length: 4 }, (_, roll) => decide(stub({ ac: counter, rolls: [roll] }).ctx).id));
    expect(seen(0)).toEqual(new Set([DG, KZ]));
    expect(seen(48)).toEqual(new Set([DG, KZ, WA]));
    expect(seen(88)).toEqual(new Set([DG, KZ, WA, WB]));
  });

  it('is deterministic under the seeded RNG: the same seed gives the same fourteen moves and targets, a different seed need not', () => {
    const run = (seed: number): string => {
      const { ctx } = stub({ seed });
      return JSON.stringify(Array.from({ length: 28 }, () => decide(ctx)));
    };
    expect(run(11)).toBe(run(11));
    expect(run(11)).not.toBe(run(12));
  });

  it("Daigoro's script asks to be polled again in about nine hours of battle time, and does nothing", () => {
    const { ctx, self } = stub();
    (self as unknown as { id: string }).id = X2_DAIGORO_ID;
    expect(aiScriptFor(YOJIMBO_SCRIPTS.daigoro).decide(ctx)).toBeNull();
    expect(self.aiMemory?.[AI_IDLE_STEPS]).toBe(IDLE_UNTIL_WOKEN);
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
/** The party always defends, and the clock runs, until `until` says stop or the fight ends: Yojimbo's own moves, undisturbed by a party that fights back. */
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
const yojimboActions = (log: readonly BattleEvent[]): number => log.filter((e) => e.type === 'action-start' && (e as { actorId?: string }).actorId === X2_YOJIMBO_ID).length;

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
      const log = playDefending(engine, (l) => yojimboActions(l) >= 1);
      const first = log.find((e) => e.type === 'action-start' && (e as { actorId?: string }).actorId === X2_YOJIMBO_ID) as unknown as { abilityId?: string };
      expect(first.abilityId, `seed ${seed}`).toBe(ZN);
      for (const id of ['yuna', 'rikku', 'paine']) {
        const c = engine.state().combatants[id]!;
        expect([c.alive, c.hp, c.mp], `${id} after Zanmato, seed ${seed}`).toEqual([true, 1, 1]);
        const hit = log.find((e) => e.type === 'damage' && (e as { targetId?: string }).targetId === id) as unknown as { amount: number };
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
      const log = playDefending(engine, (l) => yojimboActions(l) >= 8) as unknown as Array<{ type: string; actorId?: string; abilityId?: string; targetId?: string; amount?: number; status?: string }>;
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

  it('Daigoro cannot be targeted by a menu or an area move, makes one silent poll and no action, and the fight ends on Yojimbo\'s fall with the dog standing', () => {
    const engine = new FFX2Engine(ffx2Options({ atbMode: 'wait' }));
    engine.setSeed(1);
    engine.init({ game: 'ffx2', party: FFX2_TOURIST_TRAP.buildRef as FFX2PartyBuild, enemies: cavernYojimboGroup, triggers: [], seed: 1, condition: 'normal', canEscape: false });
    const dog = engine.state().combatants[X2_DAIGORO_ID] as unknown as Ffx2Unit;
    expect(dog.alive).toBe(true);
    expect(dog.flags.isPart).toBe(true);
    expect(isTargetable(dog)).toBe(false);
    let d = engine.nextDecision();
    for (let i = 0; i < 400 && d.kind === 'waiting'; i++) {
      engine.tick(Math.max(1, d.nextEventMs));
      d = engine.nextDecision();
    }
    expect(d.kind).toBe('player-input');
    if (d.kind === 'player-input') for (const c of d.commands) expect(c.validTargets, `${c.command.kind}`).not.toContain(X2_DAIGORO_ID);
    const run = driveFight(1, { line: 'intended' });
    expect(run.outcome).toBeDefined();
    // One silent poll at the start (his script asks to be polled again in nine hours), then nothing: no action, no damage, no second turn.
    expect(run.log.filter((e) => (e as { actorId?: string }).actorId === X2_DAIGORO_ID && e.type === 'turn-start')).toHaveLength(1);
    expect(run.log.some((e) => (e as { actorId?: string }).actorId === X2_DAIGORO_ID && e.type === 'action-start')).toBe(false);
    expect(run.log.some((e) => (e as { targetId?: string }).targetId === X2_DAIGORO_ID && (e.type === 'damage' || e.type === 'ko'))).toBe(false);
    if (run.outcome === 'victory') expect(run.log.some((e) => e.type === 'ko' && (e as { targetId?: string }).targetId === X2_YOJIMBO_ID)).toBe(true);
  });

  it('the Zanmato turn is his 14th in a whole fight on the real clock, every seed that lasts that long, and the special word reaches the kernel', () => {
    for (const seed of [1, 2, 3, 4]) {
      const run = driveFight(seed, { line: 'naive' });
      const z = run.sequence.indexOf(ZN);
      if (z >= 0) expect(z + 1, `seed ${seed}`).toBe(14);
      expect(run.sequence.slice(0, 13).every((id) => id !== ZN)).toBe(true);
    }
    const engine = start(1, 0);
    const boss = engine.state().combatants[X2_YOJIMBO_ID] as unknown as Ffx2Unit;
    expect(specialWord(boss as never)).toBe(0x43);
  });
});
