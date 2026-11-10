/**
 * The hidden Gauntlet chapter's data (FFX only; chapter 54), **pinned to the game's own files** (`research/re-ffx-monster-arena-creations.md`, "RE n"): the nine creations' stat records, loot records and arena prices
 * (m314, m317, m311, m279, m281, m277, m282, m105, m280), the Ultima Buster's Head (m272) and Arm (m273), and the 31 move rows their scripts use, as `tests/fixtures/parity/ffx/gauntlet_rows.json` decodes them (generated
 * from the research lane's record dump by `tools/gauntlet-rows-gen.mjs`, every dumped row compared with the kernel fixtures when it was written); and against the ten numbers of every record typed here again from the
 * note's section 1 as a second source. Nothing here runs the engine (that is `gauntlet-engine.test.ts`).
 */

import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import type { EnemyDef, StatusId } from '../../../src/battle/common/types.ts';
import { FORMULA_NUMBER } from '../../../src/battle/ffx/adapt/command.ts';
import { elementMask } from '../../../src/battle/ffx/adapt/words.ts';
import { MIX_ITEM_IDS } from '../../../src/battle/ffx/kernel/mix-table.ts';
import { COMMAND_RECORDS, RANK_CHANGES } from '../../../src/data/ffx/command-records/index.ts';
import { POSSESSED_PLAIN_ATTACK } from '../../../src/data/ffx/command-records/enemies.ts';
import { COMMAND_RECORDS_GAUNTLET, GAUNTLET_ABILITIES } from '../../../src/data/ffx/enemies/gauntlet-abilities.ts';
import {
  GAUNTLET_ARENA_PRICE, GAUNTLET_ARMORED, GAUNTLET_DOOM_TURNS, GAUNTLET_ITEM_ID, GAUNTLET_LOOT, GAUNTLET_OVERKILL, GAUNTLET_RECORDS, GAUNTLET_STEAL, GAUNTLET_ZANMATO_BYTE, gauntletImmunities,
} from '../../../src/data/ffx/enemies/gauntlet-records.ts';
import { GAUNTLET_BODIES, GAUNTLET_PARTS, gauntletBody } from '../../../src/data/ffx/enemies/gauntlet.ts';
import * as ids from '../../../src/data/ffx/gauntlet-ids.ts';
import { ALL_ABILITIES } from '../../../src/data/ffx/index.ts';

interface Row {
  id: number; name: string; table: string; row: number; type: number; targetByte: number | null; damageKind: number; damageClass: number; accuracyFormula: number; accuracyByte: number; formula: number; power: number;
  hits: number; element: number; critBonus: number; shatter: number; rank: number; mp: number | null; chances: Array<[number, number]>; durations: Array<[number, number]>; extra: number; stageMask: number;
  stageAmount: number; buff: number; flagsMisc: number; flagsDamage: number; source: string;
}
interface Creature {
  file: number;
  record: {
    hp: number; mp: number; overkill: number; str: number; def: number; mag: number; mdef: number; agi: number; luck: number; eva: number; acc: number; flags28: number; flags29: number; poisonByte: number;
    elementAbsorb: number; elementImmune: number; elementResist: number; elementWeak: number; statusBytes: Record<string, number>; autoPermanent: number; autoTemporary: number; autoExtra: number;
    extraImmune: number; commands: number[]; forcedAction: number; monsterIndex: number; modelWord: number; ctbIcon: number; doomCounter: number;
  };
  loot: {
    chunkLength: number; gil: number; ap: number; apOverkill: number; learnedMoveWord: number; itemChance: number[]; stealChance: number; gearChance: number; normalDrop: number[]; normalDropQty: number[];
    overkillDrop: number[]; overkillDropQty: number[]; steal: number[]; stealQty: number[]; bribeItem: number; bribeFactor: number; zanmatoByte: number; pilferGilFactor: number; arenaPrice: number;
  };
}
const fixture = JSON.parse(readFileSync(fileURLToPath(new URL('../../fixtures/parity/ffx/gauntlet_rows.json', import.meta.url)), 'utf8')) as {
  creatures: Record<string, Creature>; rows: Row[]; kernelAgreement: { rowsCompared: number; differences: number; extraRowsFromKernelFixture: number[] };
};
const ROW_OF = new Map(fixture.rows.map((r) => [r.id, r]));

/** The fixture key of each combatant (the three parts' records are the Head's and the Arm's). */
const KEY: Readonly<Record<ids.GauntletCombatantId, string>> = {
  'cactuar-king': 'cactuar-king', 'don-tonberry': 'don-tonberry', jormungand: 'jormungand', 'earth-eater': 'earth-eater', 'greater-sphere': 'greater-sphere', catastrophe: 'catastrophe', thuban: 'thuban',
  neslug: 'neslug', 'ultima-buster': 'ultima-buster', 'ultima-buster-head': 'ultima-buster-head', 'ultima-buster-arm-left': 'ultima-buster-arm', 'ultima-buster-arm-right': 'ultima-buster-arm',
};
const ALL_IDS = Object.keys(KEY) as ids.GauntletCombatantId[];
const BODY_OF = (id: ids.GauntletCombatantId): EnemyDef => (id === 'ultima-buster-head' ? GAUNTLET_PARTS[0]! : id === 'ultima-buster-arm-left' ? GAUNTLET_PARTS[1]! : id === 'ultima-buster-arm-right' ? GAUNTLET_PARTS[2]! : gauntletBody(id));

/** RE n 1, typed from the note's table (a second source for the fixture): hp, mp, str, def, mag, mdef, agi, luck, eva, acc. Luck and Accuracy come from the record dump; the note's table prints the rest. */
const NOTE: Record<string, readonly number[]> = {
  'cactuar-king': [100_000, 0, 255, 100, 255, 255, 80],
  'don-tonberry': [480_000, 120, 95, 100, 75, 100, 37],
  jormungand: [520_000, 63, 77, 33, 80, 186, 53],
  'earth-eater': [1_300_000, 30, 117, 200, 186, 210, 47],
  'greater-sphere': [1_500_000, 999, 87, 130, 102, 120, 55],
  catastrophe: [2_200_000, 380, 120, 80, 77, 80, 34],
  thuban: [3_000_000, 85, 102, 80, 212, 80, 53],
  neslug: [4_000_000, 999, 130, 80, 130, 80, 43],
  'ultima-buster': [5_000_000, 140, 168, 60, 178, 71, 72],
};
const statsOf = (e: EnemyDef): number[] => [e.stats.hp, e.stats.mp, e.stats.str, e.stats.def, e.stats.mag, e.stats.mdef, e.stats.agi, e.stats.luck, e.stats.eva, e.stats.acc];

const STATUS_OF_NAME: Record<string, StatusId | 'threaten'> = {
  Death: 'ko', Zombie: 'zombie', Petrify: 'petrify', Poison: 'poison', PowerBreak: 'power-break', MagicBreak: 'magic-break', ArmorBreak: 'armor-break', MentalBreak: 'mental-break', Confuse: 'confuse', Berserk: 'berserk',
  Provoke: 'provoke', Threaten: 'threaten', Sleep: 'sleep', Silence: 'silence', Darkness: 'darkness', Shell: 'shell', Protect: 'protect', Reflect: 'reflect', NulTide: 'nultide', NulBlaze: 'nulblaze', NulShock: 'nulshock',
  NulFrost: 'nulfrost', Regen: 'regen', Haste: 'haste', Slow: 'slow',
};

describe('the fixture is what the generator says it is', () => {
  it('eleven monster files, 46 rows: 41 listed by the record dump and compared with the kernel fixtures (0 differences), 5 from the kernel fixtures', () => {
    expect(Object.keys(fixture.creatures)).toHaveLength(11);
    expect(fixture.rows).toHaveLength(46);
    expect(fixture.kernelAgreement).toEqual({ rowsCompared: 41, differences: 0, extraRowsFromKernelFixture: [0x4062, 0x40ea, 0x40ff, 0x4081, 0x6001] });
    expect(fixture.rows.filter((r) => r.source === 'kernel-fixture').map((r) => r.id).sort()).toEqual([0x4062, 0x4081, 0x40ea, 0x40ff, 0x6001]);
    expect(Object.values(fixture.creatures).map((c) => c.file).sort((a, b) => a - b)).toEqual([105, 272, 273, 277, 279, 280, 281, 282, 311, 314, 317]);
  });

  it('the files of the ids module are the fixture\'s', () => {
    for (const id of ALL_IDS) expect(ids.GAUNTLET_FILE[id], id).toBe(fixture.creatures[KEY[id]]!.file);
  });
});

describe('the nine bodies and the parts: stat records', () => {
  for (const id of ALL_IDS) {
    const fx = fixture.creatures[KEY[id]]!;
    const e = BODY_OF(id);
    it(`${id}: the ten numbers equal the fixture's (the game's file m${fx.file}) and, for a body, the note's table; bar, form, bytes`, () => {
      const r = fx.record;
      expect(statsOf(e)).toEqual([r.hp, r.mp, r.str, r.def, r.mag, r.mdef, r.agi, r.luck, r.eva, r.acc]);
      expect([...GAUNTLET_RECORDS[id]]).toEqual(statsOf(e));
      if (NOTE[id] !== undefined) expect(statsOf(e).slice(0, 7)).toEqual(NOTE[id]);
      expect([e.stats.maxHp, e.stats.maxMp, e.hp, e.mp]).toEqual([r.hp, r.mp, r.hp, r.mp]);
      expect(GAUNTLET_OVERKILL[id]).toBe(r.overkill);
      expect(e.rewards.overkillThreshold).toBe(r.overkill);
      expect(e.forms).toEqual([{ name: e.name, spriteKey: ids.GAUNTLET_SPRITE[id], hp: r.hp }]);
      expect(e.threatenChance, 'the record byte 0 reads as "never lands"').toBe(0);
      expect(r.statusBytes['Threaten']).toBe(0);
      expect(e.zanmatoLevel).toBe(fx.loot.zanmatoByte + 1);
      expect(GAUNTLET_ZANMATO_BYTE[id]).toBe(fx.loot.zanmatoByte);
      expect(e.doomTurns).toBe(r.doomCounter);
      expect(GAUNTLET_DOOM_TURNS[id]).toBe(r.doomCounter);
      expect(r.forcedAction, 'no forced action').toBe(0);
      expect([r.autoPermanent, r.autoExtra]).toEqual([0, 0]);
      expect(e.aiScriptId).toBe(ids.GAUNTLET_SCRIPT[id]);
      expect(e.id).toBe(id);
    });

    it(`${id}: all 24 status bytes and the extra-immunity word as immunities (255 immune; a smaller byte as it is; 0 lands)`, () => {
      const r = fx.record;
      const imm = gauntletImmunities(id);
      expect(e.immunities).toEqual(imm);
      for (const [name, byte] of Object.entries(r.statusBytes)) {
        const s = STATUS_OF_NAME[name]!;
        if (s === 'threaten') continue; // the record's 0 is read as the Threaten chance (above)
        expect(imm[s] ?? 0, name).toBe(byte);
      }
      // The extra word: Scan 0x1, Eject 0x100, Auto-Life 0x200, Doom 0x4000 (the four Distillers, 0x2 0x4 0x8 0x20, are not statuses of ours).
      const word = r.extraImmune;
      expect([imm['scan'] ?? 0, imm['eject'] ?? 0, imm['auto-life'] ?? 0, imm['doom'] ?? 0]).toEqual([(word & 0x1) !== 0 ? 255 : 0, (word & 0x100) !== 0 ? 255 : 0, (word & 0x200) !== 0 ? 255 : 0, (word & 0x4000) !== 0 ? 255 : 0]);
      expect(word).toBe(id.startsWith('ultima-buster-') ? 0x22f : id === 'neslug' ? 0x4301 : 0x301);
    });

    it(`${id}: the flag bytes as immunity flags (Armored only where the record says); 'boss' on the bodies only`, () => {
      const r = fx.record;
      const has = (f: string): boolean => (e.immunityFlags as string[]).includes(f);
      expect(r.flags28 & 0x1e, 'the four immunities of the flag byte are on every record').toBe(0x1e);
      expect(GAUNTLET_ARMORED.includes(id)).toBe((r.flags28 & 1) !== 0);
      expect(has('armored')).toBe((r.flags28 & 1) !== 0);
      expect(has('immune-to-percentage-damage')).toBe((r.flags28 & 2) !== 0);
      expect(has('immune-to-life')).toBe((r.flags28 & 4) !== 0);
      expect(has('immune-to-sensor')).toBe((r.flags28 & 8) !== 0);
      expect(has('immune-to-scan')).toBe((r.flags28 & 16) !== 0);
      expect(has('immune-to-delay')).toBe((r.flags29 & 1) !== 0);
      expect(has('immune-to-bribe')).toBe((r.flags29 & 4) !== 0);
      expect([r.flags29 & ~5]).toEqual([0]);
      for (const f of ['immune-to-physical-damage', 'immune-to-magical-damage', 'immune-to-damage', 'immune-to-regen', 'immune-to-threaten']) expect(has(f), f).toBe(false);
      expect(has('boss')).toBe(!id.startsWith('ultima-buster-'));
      expect(e.flags).toEqual(id.startsWith('ultima-buster-') ? { isPart: true, partOf: 'ultima-buster' } : { isBoss: true });
    });
  }

  it('the elements: the Cactuar King is immune to Fire, Ice, Thunder, Water and Holy (byte 31); every other record is all zeros', () => {
    const bits = (e: EnemyDef): number[] => {
      const mask = (a: string): number => (Object.entries(e.affinities) as Array<[string, string]>).filter(([, v]) => v === a).reduce((m, [k]) => m | elementMask([k as never]), 0);
      return [mask('absorb'), mask('immune'), mask('resist'), mask('weak')];
    };
    for (const id of ALL_IDS) {
      const r = fixture.creatures[KEY[id]]!.record;
      expect(bits(BODY_OF(id)), id).toEqual([r.elementAbsorb, r.elementImmune, r.elementResist, r.elementWeak]);
    }
    expect(fixture.creatures['cactuar-king']!.record.elementImmune).toBe(31);
    expect(Object.keys(fixture.creatures).filter((k) => k !== 'cactuar-king').every((k) => fixture.creatures[k]!.record.elementImmune === 0 && fixture.creatures[k]!.record.elementWeak === 0)).toBe(true);
  });

  it('the notes\' own words: the four exceptions in the status bytes, and the Zanmato correction (Neslug is byte 3, not 4)', () => {
    const sb = (k: string, n: string): number => fixture.creatures[k]!.record.statusBytes[n]!;
    expect([sb('jormungand', 'PowerBreak'), sb('jormungand', 'MagicBreak'), sb('jormungand', 'ArmorBreak'), sb('jormungand', 'MentalBreak'), sb('jormungand', 'Slow')]).toEqual([90, 90, 90, 90, 0]);
    expect(sb('neslug', 'Silence')).toBe(0);
    expect(sb('thuban', 'Reflect')).toBe(255);
    for (const k of Object.keys(fixture.creatures).filter((k) => !['thuban'].includes(k))) expect(sb(k, 'Reflect'), k).toBe(0);
    const zan = Object.fromEntries(['cactuar-king', 'don-tonberry', 'jormungand', 'earth-eater', 'greater-sphere', 'catastrophe', 'thuban', 'neslug', 'ultima-buster'].map((k) => [k, fixture.creatures[k]!.loot.zanmatoByte]));
    expect(zan).toEqual({ 'cactuar-king': 3, 'don-tonberry': 3, jormungand: 3, 'earth-eater': 4, 'greater-sphere': 4, catastrophe: 4, thuban: 4, neslug: 3, 'ultima-buster': 4 });
  });

  it('only the Cactuar King wears elemental immunity; Earth Eater starts with Reflect (the auto-temporary word 0x20) and no one else holds a start-up status', () => {
    for (const k of Object.keys(fixture.creatures)) expect(fixture.creatures[k]!.record.autoTemporary, k).toBe(k === 'earth-eater' ? 0x20 : 0);
  });

  it('the parts: 80,000 HP, Armored, poison 25, AGI 80; no AP, no drops, no steal; the body is not Armored by the record', () => {
    for (const k of ['ultima-buster-head', 'ultima-buster-arm']) {
      const fx = fixture.creatures[k]!;
      expect([fx.record.hp, fx.record.flags28 & 1, fx.record.poisonByte, fx.record.agi]).toEqual([80_000, 1, 25, 80]);
      expect([fx.loot.ap, fx.loot.apOverkill, fx.loot.itemChance, fx.loot.stealChance, fx.loot.normalDrop, fx.loot.steal]).toEqual([0, 0, [0, 0], 0, [0, 0, 0, 0], [0, 0]]);
    }
    expect(fixture.creatures['ultima-buster']!.record.flags28 & 1).toBe(0);
    expect(GAUNTLET_ARMORED).toEqual(['earth-eater', 'catastrophe', 'ultima-buster-head', 'ultima-buster-arm-left', 'ultima-buster-arm-right']);
    expect(GAUNTLET_PARTS.map((p) => [p.id, p.slot, p.flags.partOf])).toEqual([['ultima-buster-head', 1, 'ultima-buster'], ['ultima-buster-arm-left', 2, 'ultima-buster'], ['ultima-buster-arm-right', 3, 'ultima-buster']]);
  });

  it('the bodies list is the nine acts in HP order', () => {
    expect(GAUNTLET_BODIES.map((b) => b.id)).toEqual([...ids.GAUNTLET_CREATURES]);
    const hps = GAUNTLET_BODIES.map((b) => b.hp);
    expect(hps).toEqual([...hps].sort((a, b) => a - b));
    expect(ids.GAUNTLET_TIERS.flatMap((t) => t.creatures)).toEqual([...ids.GAUNTLET_CREATURES]);
    expect(ids.GAUNTLET_TIERS.flatMap((t) => t.acts)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });
});

describe('loot: the record, the drop summary, the steal pair, the arena price', () => {
  for (const id of ALL_IDS) {
    const fx = fixture.creatures[KEY[id]]!;
    it(`${id}: the loot record equals the file's (no gil; AP; the certain item and the rare Dark Matter; the gear and Bribe fields), and \`ArenaPrice\``, () => {
      const l = fx.loot;
      const rec = GAUNTLET_LOOT[id];
      expect([rec.gil, rec.ap, rec.apOverkill]).toEqual([l.gil, l.ap, l.apOverkill]);
      expect(l.gil).toBe(0);
      expect(rec.file).toBe(fx.file);
      expect([...rec.chance]).toEqual(l.itemChance);
      expect(rec.gearChance).toBe(l.gearChance);
      expect([...rec.items]).toEqual(l.normalDrop);
      expect([...rec.qty]).toEqual(l.normalDropQty);
      expect([...rec.overkillItems]).toEqual(l.overkillDrop);
      expect([...rec.overkillQty]).toEqual(l.overkillDropQty);
      expect([rec.bribeItem, rec.bribeFactor]).toEqual([l.bribeItem, l.bribeFactor]);
      expect(rec.source).toContain(`chunk 4 (0x${l.chunkLength.toString(16)} bytes)`);
      expect(GAUNTLET_ARENA_PRICE[id]).toBe(l.arenaPrice);
      expect(l.pilferGilFactor).toBe(0);
      expect(l.learnedMoveWord).toBe(0);
    });

    it(`${id}: the enemy's rewards are the record's: AP, the drop summary, the steal pair`, () => {
      const e = BODY_OF(id);
      const l = fx.loot;
      expect([e.rewards.ap, e.rewards.apOverkill, e.rewards.gil]).toEqual([l.ap, l.apOverkill, 0]);
      expect(e.rewards.loot).toEqual(GAUNTLET_LOOT[id]);
      const steal = GAUNTLET_STEAL[id];
      if (l.stealChance === 0) {
        expect(steal).toBeNull();
        expect(e.rewards.steal).toBeUndefined();
        expect(e.rewards.drops).toEqual([]);
        return;
      }
      expect(l.stealChance).toBe(255);
      expect(steal).toEqual({ items: l.steal, qty: l.stealQty });
      expect(e.rewards.steal).toEqual({
        baseChance: 100,
        common: { itemId: GAUNTLET_ITEM_ID[l.steal[0]!], count: l.stealQty[0] },
        rare: { itemId: GAUNTLET_ITEM_ID[l.steal[1]!], count: l.stealQty[1] },
      });
      expect(l.itemChance).toEqual([255, 0]);
      expect(e.rewards.drops).toEqual([{ itemId: GAUNTLET_ITEM_ID[l.normalDrop[0]!], count: l.normalDropQty[0], rare: { itemId: 'dark-matter', count: l.normalDropQty[1], chance: 12.5 } }]);
      expect(l.normalDrop[1]).toBe(0x2035); // the rare slot is a Dark Matter on every body
      expect(l.overkillDropQty).toEqual(l.normalDropQty.map((q) => q * 2)); // x2 on an Overkill, the engine's rule
    });
  }

  it('every item number the nine records name has an id, and it is the engine\'s own (MIX_ITEM_IDS: item n is 0x2000 + n)', () => {
    const named = new Set<number>();
    for (const c of Object.values(fixture.creatures)) for (const n of [...c.loot.normalDrop, ...c.loot.overkillDrop, ...c.loot.steal]) if (n !== 0) named.add(n);
    expect([...named].sort((a, b) => a - b)).toEqual(Object.keys(GAUNTLET_ITEM_ID).map(Number).sort((a, b) => a - b));
    for (const [number, id] of Object.entries(GAUNTLET_ITEM_ID)) expect(MIX_ITEM_IDS[Number(number) - 0x2000], `0x${Number(number).toString(16)}`).toBe(id);
  });

  it('the arena prices: 6,000 (Cactuar King, Jormungand), 8,000 (Don Tonberry), 15,000 (the six Originals); the parts 0', () => {
    expect(GAUNTLET_ARENA_PRICE).toEqual({
      'cactuar-king': 6_000, 'don-tonberry': 8_000, jormungand: 6_000, 'earth-eater': 15_000, 'greater-sphere': 15_000, catastrophe: 15_000, thuban: 15_000, neslug: 15_000, 'ultima-buster': 15_000,
      'ultima-buster-head': 0, 'ultima-buster-arm-left': 0, 'ultima-buster-arm-right': 0,
    });
  });

  it('AP: 8,000 on the area three and 50,000 on the six Originals (the same on an Overkill); the rare slot is one Dark Matter, and the certain items are the note\'s (RE n 1)', () => {
    expect(GAUNTLET_BODIES.map((b) => [b.id, b.rewards.ap])).toEqual([
      ['cactuar-king', 8_000], ['don-tonberry', 8_000], ['jormungand', 8_000], ['earth-eater', 50_000], ['greater-sphere', 50_000], ['catastrophe', 50_000], ['thuban', 50_000], ['neslug', 50_000], ['ultima-buster', 50_000],
    ]);
    expect(GAUNTLET_BODIES.map((b) => b.rewards.drops[0]!.itemId)).toEqual(['blessed-gem', 'farplane-wind', 'supreme-gem', 'fortune-sphere', 'luck-sphere', 'designer-wallet', 'underdogs-secret', 'pendulum', 'winning-formula']);
    expect(GAUNTLET_BODIES.map((b) => b.rewards.drops[0]!.count)).toEqual([3, 3, 2, 1, 1, 1, 1, 1, 1]);
    expect(GAUNTLET_BODIES.map((b) => b.rewards.steal!.common!.itemId)).toEqual(['chocobo-wing', 'candle-of-life', 'petrify-grenade', 'gamblers-spirit', 'gamblers-spirit', 'gamblers-spirit', 'gamblers-spirit', 'gamblers-spirit', 'gamblers-spirit']);
    expect(GAUNTLET_BODIES.map((b) => b.rewards.steal!.rare!.itemId)).toEqual(['designer-wallet', 'designer-wallet', 'three-stars', 'lv-1-key-sphere', 'return-sphere', 'lv-2-key-sphere', 'teleport-sphere', 'friend-sphere', 'lv-3-key-sphere']);
  });
});

describe('the 31 move rows: each ability and each command record equals the game\'s row', () => {
  const FORMULA_KEY: Record<number, string> = { 0: 'none', 1: 'strength', 3: 'magic', 4: 'piercing-magic', 5: 'percent-current', 6: 'fixed-no-variance', 8: 'percent-total', 23: 'deal-9999' };
  const KIND: Record<number, string> = { 0: 'other', 1: 'physical', 2: 'magical' };
  const STATUS_NUMBER: Record<string, number> = { ko: 0, zombie: 1, petrify: 2, poison: 3, 'power-break': 4, 'magic-break': 5, 'armor-break': 6, 'mental-break': 7, confuse: 8, sleep: 12, silence: 13, darkness: 14, slow: 24 };
  const SLOT: Record<number, number> = { 12: 0, 13: 1, 14: 2, 24: 12 };
  const abilities = Object.values(GAUNTLET_ABILITIES);

  it('thirty-one rows, ids unique, the ids module names exactly these', () => {
    expect(abilities).toHaveLength(31);
    expect(new Set(abilities.map((a) => a.id)).size).toBe(31);
    expect(Object.values(ids.GAUNTLET_ROWS).sort()).toEqual(abilities.map((a) => a.id).sort());
    expect(Object.keys(COMMAND_RECORDS_GAUNTLET).sort()).toEqual(abilities.map((a) => a.id).sort());
    expect(new Set(Object.values(COMMAND_RECORDS_GAUNTLET).map((r) => r.id)).size, 'one game row each').toBe(31);
  });

  for (const a of abilities) {
    const rec = COMMAND_RECORDS_GAUNTLET[a.id]!;
    it(`${a.id} (0x${rec.id.toString(16)}): the command record is the fixture's row word for word`, () => {
      const row = ROW_OF.get(rec.id);
      expect(row, 'the fixture has the row').toBeDefined();
      const r = row!;
      expect(rec.type).toBe(r.type);
      expect(rec.flagsMisc).toBe(r.flagsMisc);
      expect(rec.flagsDamage).toBe(r.flagsDamage);
      expect(rec.damageClass).toBe(r.damageClass);
      expect(rec.rank).toBe(r.rank);
      expect(rec.shatter ?? 0).toBe(r.shatter);
      expect(rec.extra ?? 0).toBe(r.extra);
      expect(rec.chances ?? []).toEqual(r.chances);
      expect(rec.durations ?? []).toEqual(r.durations);
      expect(rec.stage).toBeUndefined();
      expect(rec.buff).toBeUndefined();
      expect([r.stageMask, r.stageAmount, r.buff]).toEqual([0, 0, 0]);
      expect(r.element).toBe(0);
      expect(r.name.length).toBeGreaterThan(0);
    });

    it(`${a.name} (${a.id}): the ability's formula, power, hits, kind, target, accuracy, crit, shatter and statuses equal the row's`, () => {
      const r = ROW_OF.get(rec.id)!;
      const state = a.formula === 'none' && a.power === 0;
      // The formula: our key's number is the game's, except a state row (a status or movement row with no damage class). Karma is formula 22 = 0x16 (the `'kill-count'` key, stage 2).
      if (a.id === ids.GAUNTLET_ROWS.karma) {
        expect([r.formula, r.power]).toEqual([22, 100]);
        expect(a.formula).toBe('kill-count');
        expect(FORMULA_NUMBER[a.formula]).toBe(22);
      } else if (r.damageClass === 0) {
        expect(a.formula).toBe('none');
      } else {
        expect(a.formula).toBe(FORMULA_KEY[r.formula]);
        expect(FORMULA_NUMBER[a.formula]).toBe(r.formula);
      }
      expect(a.power).toBe(r.power);
      expect(a.hits).toBe(r.hits);
      expect(a.damageType).toBe(KIND[r.damageKind]);
      expect(a.rank).toBe(r.rank);
      expect(a.element).toEqual(['none']);
      // The target: a state row is aimed at its user; any other row's target byte decides single or the whole side.
      if (state) expect(a.targeting).toBe('self');
      else if (r.targetByte !== null) expect(a.targeting).toBe(((r.targetByte >> 2) & 3) === 0 ? 'single-enemy' : 'all-enemies');
      else expect(a.targeting).toBe('single-enemy'); // [inferred] Don Tonberry's Attack, Voodoo and Karma: one party member
      if (r.targetByte !== null) expect(r.targetByte & 2, 'the default aim is the opposite side').toBe(2);
      // The hit rule (hard rule 5): accuracy formula 0 never misses; formula 2 carries its byte and can miss.
      if (r.accuracyFormula === 0) {
        expect(a.canMiss).toBe(false);
        expect(a.accuracy).toBeUndefined();
      } else {
        expect(r.accuracyFormula).toBe(2);
        expect(a.canMiss).toBeUndefined();
        expect(a.accuracy).toBe(r.accuracyByte);
      }
      // The flag words: the cap bit, the crit bits, the crit byte.
      const has = (f: string): boolean => a.flags.includes(f as never);
      expect(has('always-break-damage-limit')).toBe((r.flagsDamage & 0x80) !== 0);
      expect(has('crit-eligible')).toBe((r.flagsDamage & 0x4) !== 0);
      expect(has('adds-equipment-crit')).toBe((r.flagsDamage & 0x8) !== 0);
      expect(has('affected-by-darkness')).toBe((r.flagsMisc & 0x40) !== 0);
      expect(a.bonusCrit ?? 0).toBe(r.critBonus);
      expect(a.shatterChance ?? 0).toBe(r.shatter);
      expect(a.mpCost).toBe(0);
      // The statuses a damaging or status row lays on its targets equal the record's chance bytes (a cleanse row's bytes mean "remove": the record carries them).
      if ((r.flagsDamage & 0x20) !== 0) {
        expect(a.statusEffects).toEqual([]);
      } else {
        const want = r.chances.map(([n, byte]) => ({ status: Object.keys(STATUS_NUMBER).find((k) => STATUS_NUMBER[k] === n), chance: byte, duration: SLOT[n] === undefined ? 254 : (r.durations.find(([s]) => s === SLOT[n])?.[1] ?? 254) }));
        expect(a.statusEffects).toEqual(want);
      }
    });
  }

  it('the rows are in the data catalog with the game\'s record attached, and the attach step changes no rank (every row is rank 3)', () => {
    const catalog = new Map(ALL_ABILITIES.map((a) => [a.id, a]));
    for (const a of abilities) {
      expect(catalog.get(a.id), a.id).toBe(a);
      expect(a.record, a.id).toEqual(COMMAND_RECORDS_GAUNTLET[a.id]);
      expect(COMMAND_RECORDS[a.id]).toBe(COMMAND_RECORDS_GAUNTLET[a.id]);
    }
    expect(RANK_CHANGES.filter((c) => abilities.some((a) => a.id === c.abilityId))).toEqual([]);
  });

  it('every row the record dump lists for a creature is carried (own row or the player\'s) and each creature\'s ability list names rows that exist', () => {
    const own = new Map(abilities.map((a) => [COMMAND_RECORDS_GAUNTLET[a.id]!.id, a.id]));
    const player = new Map<number, string>(ALL_ABILITIES.filter((a) => COMMAND_RECORDS[a.id] !== undefined && COMMAND_RECORDS[a.id]!.id >= 0x3000 && COMMAND_RECORDS[a.id]!.id < 0x4000).map((a) => [COMMAND_RECORDS[a.id]!.id, a.id]));
    // The rows the dump omits on purpose: the three "Death" rows (a boss's death animation, which the engine's victory already is).
    const NOT_MODELLED = new Set([0x60c3, 0x601c, 0x6067]);
    for (const id of ALL_IDS) {
      const listed = fixture.creatures[KEY[id]]!.record.commands;
      const have = new Set(BODY_OF(id).abilityIds.map((x) => ALL_ABILITIES.find((a) => a.id === x)?.record?.id));
      for (const cmd of listed) {
        if (NOT_MODELLED.has(cmd)) continue;
        expect(own.has(cmd) || player.has(cmd), `${id}: 0x${cmd.toString(16)} is carried`).toBe(true);
        expect(have.has(cmd), `${id}: 0x${cmd.toString(16)} is in the ability list`).toBe(true);
      }
      for (const x of BODY_OF(id).abilityIds) expect(ALL_ABILITIES.some((a) => a.id === x), `${id}: ${x}`).toBe(true);
    }
  });

  it('the player-table rows the creatures use agree with the dump: the same command id, formula, power and flags as the party\'s own rows', () => {
    const players: Array<[string, number]> = [['curaga', 0x302d], ['haste', 0x3036], ['shell', 0x303a], ['protect', 0x303b], ['reflect', 0x303c], ['firaga', 0x3049], ['blizzaga', 0x304a], ['thundaga', 0x304b], ['waterga', 0x304c], ['demi', 0x304e], ['flare', 0x3052], ['ultima', 0x3053]];
    for (const [id, cmd] of players) {
      const r = ROW_OF.get(cmd)!;
      const rec = COMMAND_RECORDS[id]!;
      expect(rec.id, id).toBe(cmd);
      expect([rec.type, rec.flagsMisc, rec.flagsDamage, rec.damageClass, rec.rank ?? 3, rec.shatter ?? 0]).toEqual([r.type, r.flagsMisc, r.flagsDamage, r.damageClass, r.rank, r.shatter]);
      expect(rec.chances ?? [], id).toEqual(r.chances);
      expect(rec.durations ?? [], id).toEqual(r.durations);
      expect(ALL_ABILITIES.find((a) => a.id === id)?.power, id).toBe(r.power);
    }
    // Regen is the script's buff step and is not in Th'uban's command list (RE n 3.6); the party's own row exists.
    expect(ALL_ABILITIES.some((a) => a.id === 'regen' && a.record?.id === 0x303e)).toBe(true);
    expect(fixture.creatures['thuban']!.record.commands).not.toContain(0x303e);
  });

  it('rows shared with other chapters are the same game rows: 0x40F0 is Shinryu\'s Attack, 0x4062 Dark Valefor\'s, 0x6001 Sinspawn Gui\'s Special 1, 0x6036 Spherimorph\'s Elemental Shift', () => {
    const same = (mine: string, theirs: string): void => {
      const a = COMMAND_RECORDS[mine]!;
      const b = COMMAND_RECORDS[theirs]!;
      expect(a.id).toBe(b.id);
      expect({ ...a }).toEqual({ ...b });
    };
    same(ids.GAUNTLET_ROWS.attack, 'shinryu-attack');
    same(ids.GAUNTLET_ROWS.tonberryAttack, 'dark6-valefor-attack');
    same(ids.GAUNTLET_ROWS.special1, 'gui-special-1');
    same(ids.GAUNTLET_ROWS.elementalShift, 'spherimorph-elemental-shift');
    // Neslug's Attack is the possessed aeons' plain Attack (monster-magic-2 row 0: accuracy formula 2 on the byte 90).
    expect({ ...COMMAND_RECORDS[ids.GAUNTLET_ROWS.neslugAttack]! }).toEqual({ ...POSSESSED_PLAIN_ATTACK.record });
    expect(POSSESSED_PLAIN_ATTACK.accuracy).toBe(90);
    expect(GAUNTLET_ABILITIES[ids.GAUNTLET_ROWS.neslugAttack]!.accuracy).toBe(90);
  });
});

describe('the ids module', () => {
  it('chapter 54, the word gauntlet; the nine acts in three tiers of three; the parts', () => {
    expect([ids.GAUNTLET_CHAPTER_ID, ids.GAUNTLET_CHAPTER_NUMBER, ids.GAUNTLET_DOOR_WORD]).toEqual(['gauntlet', 54, 'gauntlet']);
    expect(ids.GAUNTLET_CREATURES).toHaveLength(9);
    expect(ids.ULTIMA_BUSTER_PARTS).toEqual(['ultima-buster-head', 'ultima-buster-arm-left', 'ultima-buster-arm-right']);
    expect(ids.gauntletGroupId('neslug')).toBe('gauntlet-neslug');
  });

  it('script ids are unique per creature (the two Arms share one), sprite keys are the art lane\'s (the two Arms share one painting)', () => {
    const scripts = Object.values(ids.GAUNTLET_SCRIPT);
    expect(new Set(scripts).size).toBe(scripts.length - 1);
    expect(ids.GAUNTLET_SCRIPT['ultima-buster-arm-left']).toBe(ids.GAUNTLET_SCRIPT['ultima-buster-arm-right']);
    expect(ids.GAUNTLET_SPRITE['ultima-buster-arm-left']).toBe(ids.GAUNTLET_SPRITE['ultima-buster-arm-right']);
    expect(ids.GAUNTLET_SPRITE_WANTED['ultima-buster-arm-left']).toBe(ids.GAUNTLET_SPRITE_WANTED['ultima-buster-arm-right']);
    // The keys the art lane owes are the creature ids; the data draws stand-ins until they land (`GAUNTLET_SPRITE`).
    for (const id of ids.GAUNTLET_CREATURES) expect(ids.GAUNTLET_SPRITE_WANTED[id]).toBe(id);
    for (const id of ids.GAUNTLET_CREATURES) expect(ids.GAUNTLET_SPRITE[id], 'a stand-in, not the owed key').not.toBe(id);
  });

  it('game case FFX only (rule 14): no FFX-2 source file (battle, data, UI) names the chapter', () => {
    const root = fileURLToPath(new URL('../../../src/', import.meta.url));
    const offenders: string[] = [];
    const walk = (dir: string): void => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const p = `${dir}/${entry.name}`;
        if (entry.isDirectory()) walk(p);
        // An FFX-2 item called "Gauntlets" or a "gauntlet" of battles in a comment is not the chapter: look for its modules, ids and rows.
        else if (/\.ts$/.test(entry.name) && /(?:from\s+'[^']*gauntlet[^']*'|\bGAUNTLET_[A-Z_]+|['"`]gauntlet-[a-z0-9-]+['"`])/.test(readFileSync(p, 'utf8'))) offenders.push(p.slice(root.length));
      }
    };
    for (const sub of ['battle/ffx2', 'data/ffx2', 'ui/ffx2']) walk(`${root}${sub}`);
    expect(offenders).toEqual([]);
  });

  it('the factories hand out fresh copies', () => {
    const a = gauntletBody('neslug');
    a.stats.hp = 1;
    expect(gauntletBody('neslug').stats.hp).toBe(4_000_000);
  });
});
