/**
 * The hidden Dark Aeons chapter's data (FFX only), **pinned to the game's own files** (`research/re-ffx-dark-aeons-six.md`, "RE six n"): the six stat records and loot records (m334 to m339) and the 24 move rows the six scripts
 * use, as `tests/fixtures/parity/ffx/dark_aeons_six_rows.json` decodes them (generated from the files by a script, nothing typed by hand); the seven formations' battle ids against the note's table; the copies the battle layer
 * keeps of the ids; the identical pairs of rows; and the ten numbers of every record typed from the note's section 1.2 as a second source for the fixture.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import type { AbilityDef, EnemyDef, FFXCommandRecord, StatusId } from '../../../src/battle/common/types.ts';
import { FORMULA_NUMBER } from '../../../src/battle/ffx/adapt/command.ts';
import { elementMask } from '../../../src/battle/ffx/adapt/words.ts';
import { SIX_FORMATIONS, SIX_GAINS, SIX_ROWS, SIX_SCRIPTS } from '../../../src/battle/ffx/ai/dark-aeons-six-rules.ts';
import { COMMAND_RECORDS } from '../../../src/data/ffx/command-records/index.ts';
import { ALL_ABILITIES, ENEMY_GROUPS_BY_ID, ITEMS } from '../../../src/data/ffx/index.ts';
import { DARK_AEONS_CHAPTER_ID, DARK_SIX_LINKS, DARK_SIX_SCRIPTS, DARK_IXION_2_CURRENT_HP, DARK_IXION_2_STATS } from '../../../src/data/ffx/dark-aeons-six-ids.ts';
import { COMMAND_RECORDS_DARK_SIX, DARK_SIX_ABILITIES, DARK_SIX_ROWS, DARK_SIX_TWIN_ROWS } from '../../../src/data/ffx/enemies/dark-aeons-six-abilities.ts';
import { DARK_SIX_GROUPS, darkSixGroupOf } from '../../../src/data/ffx/enemies/dark-aeons-six-groups.ts';
import { DARK_SIX_BODIES, SIX_RECORDS, darkAnima, darkBahamut, darkIfrit, darkIxion1, darkIxion2, darkShiva, darkValefor } from '../../../src/data/ffx/enemies/dark-aeons-six.ts';

interface Move {
  id: number; name: string; row: number; type: number; targetByte: number; usageByte: number; flagsMisc: number; flagsDamage: number; damageClass: number; rank: number; critBonus: number; formula: number;
  accuracy: number; power: number; hits: number; shatter: number; element: number; chances: Array<[number, number]>; durations: Array<[number, number]>; extra: number; stageMask: number; stageAmount: number; buff: number;
}
interface MonsterFixture {
  file: string; sha256Prefix: string;
  record: Record<string, number> & { statusBytes: Record<string, number>; commands: number[] };
  loot: { gil: number; ap: number; apOverkill: number; itemChance: number[]; stealChance: number; normalDrop: number[]; normalDropQty: number[]; overkillDrop: number[]; overkillDropQty: number[]; steal: number[]; stealQty: number[]; zanmatoByte: number; weaponPool: number[]; armourPool: number[] };
}
const fixture = JSON.parse(readFileSync(fileURLToPath(new URL('../../fixtures/parity/ffx/dark_aeons_six_rows.json', import.meta.url)), 'utf8')) as { monsters: Record<string, MonsterFixture>; moves: Move[] };
const MOVE = new Map(fixture.moves.map((m) => [m.id, m]));

/** RE six 1.2, typed from the note: hp, mp, str, def, mag, mdef, agi, luck, eva, acc. */
const NOTE: Record<string, readonly number[]> = {
  'dark-valefor': [800_000, 999, 148, 120, 186, 220, 105, 48, 10, 250],
  'dark-ifrit': [1_400_000, 999, 220, 173, 177, 163, 124, 27, 8, 230],
  'dark-ixion': [1_200_000, 999, 176, 220, 133, 188, 180, 36, 0, 250],
  'dark-shiva': [1_100_000, 999, 173, 163, 244, 255, 255, 73, 0, 250],
  'dark-bahamut': [4_000_000, 999, 245, 234, 222, 233, 255, 102, 0, 250],
  'dark-anima': [8_000_000, 999, 155, 230, 255, 255, 183, 85, 0, 255],
};
const statsOf = (e: EnemyDef): number[] => [e.stats.hp, e.stats.mp, e.stats.str, e.stats.def, e.stats.mag, e.stats.mdef, e.stats.agi, e.stats.luck, e.stats.eva, e.stats.acc];
const BODIES: ReadonlyArray<readonly [string, EnemyDef]> = [
  ['dark-valefor', darkValefor()], ['dark-ifrit', darkIfrit()], ['dark-ixion', darkIxion1()], ['dark-shiva', darkShiva()], ['dark-bahamut', darkBahamut()], ['dark-anima', darkAnima()],
];
const FIXTURE_OF: Record<string, string> = { 'dark-valefor': 'dark-valefor', 'dark-ifrit': 'dark-ifrit', 'dark-ixion': 'dark-ixion', 'dark-shiva': 'dark-shiva', 'dark-bahamut': 'dark-bahamut', 'dark-anima': 'dark-anima' };

describe('the six records against the fixture and the note (RE six 1.2)', () => {
  for (const [name, body] of BODIES) {
    const fx = fixture.monsters[FIXTURE_OF[name]!]!;
    it(`${name}: the ten numbers equal the note's and the fixture's (the game's file ${fx.file}), the bar and the form`, () => {
      const r = fx.record;
      expect(statsOf(body)).toEqual(NOTE[name]);
      expect(statsOf(body)).toEqual([r.hp, r.mp, r.str, r.def, r.mag, r.mdef, r.agi, r.luck, r.eva, r.acc]);
      expect([body.stats.maxHp, body.stats.maxMp, body.hp, body.mp]).toEqual([NOTE[name]![0], 999, NOTE[name]![0], 999]);
      expect(r.overkill).toBe(99_999);
      expect(body.rewards.overkillThreshold).toBe(99_999);
      expect(body.forms).toEqual([{ name: body.name, spriteKey: name, hp: NOTE[name]![0] }]);
      expect(body.threatenChance).toBe(0);
      expect(body.zanmatoLevel).toBe(fx.loot.zanmatoByte + 1); // the byte 4, printed "Zanmato Lv. 5" by the guides
      expect(body.flags).toEqual({ isBoss: true });
      expect(r.forcedAction, 'the forced-action word is "none"').toBe(0);
    });

    it(`${name}: immune (255) to the fifteen and to Scan, Eject, Auto-Life and Doom; Threaten 0; Shell, Protect, Reflect, the Nuls, Regen and Haste land`, () => {
      const immune: StatusId[] = ['ko', 'zombie', 'petrify', 'poison', 'power-break', 'magic-break', 'armor-break', 'mental-break', 'confuse', 'berserk', 'provoke', 'sleep', 'silence', 'darkness', 'slow', 'scan', 'eject', 'auto-life', 'doom'];
      expect(Object.keys(body.immunities).sort()).toEqual([...immune].sort());
      for (const s of immune) expect(body.immunities[s], s).toBe(255);
      const sb = fx.record.statusBytes;
      for (const n of ['Death', 'Zombie', 'Petrify', 'Poison', 'PowerBreak', 'MagicBreak', 'ArmorBreak', 'MentalBreak', 'Confuse', 'Berserk', 'Provoke', 'Sleep', 'Silence', 'Darkness', 'Slow']) expect(sb[n], n).toBe(255);
      for (const n of ['Threaten', 'Shell', 'Protect', 'Reflect', 'NulTide', 'NulBlaze', 'NulShock', 'NulFrost', 'Regen', 'Haste']) expect(sb[n], n).toBe(0);
      expect(fx.record.extraImmune).toBe(0x432f);
    });

    it(`${name}: the flag bytes (0x28 ${name === 'dark-anima' ? '0x5E' : '0x1E'}, 0x29 0x07) as immunity flags; 'boss' only where the formation disables Escape`, () => {
      expect(fx.record.flags28).toBe(name === 'dark-anima' ? 0x5e : 0x1e);
      expect(fx.record.flags29).toBe(0x07);
      const base = ['immune-to-percentage-damage', 'immune-to-life', 'immune-to-sensor', 'immune-to-scan', 'immune-to-delay', 'immune-to-bribe'];
      for (const f of base) expect(body.immunityFlags, f).toContain(f);
      expect(body.immunityFlags.includes('immune-to-magical-damage')).toBe(name === 'dark-anima');
      expect(body.immunityFlags.includes('boss')).toBe(name !== 'dark-ixion');
      for (const f of ['immune-to-physical-damage', 'immune-to-damage', 'armored']) expect(body.immunityFlags, f).not.toContain(f);
    });

    it(`${name}: the loot: no gil, AP, Dark Matter or a Master Sphere, the steal pair, from the fixture`, () => {
      const l = fx.loot;
      expect(l.gil).toBe(0);
      expect([body.rewards.ap, body.rewards.apOverkill, body.rewards.gil]).toEqual([l.ap, l.apOverkill, 0]);
      expect([l.itemChance, l.stealChance, l.normalDropQty, l.overkillDropQty]).toEqual([[255, 0], 255, [1, 1], [2, 2]]);
      expect(l.normalDrop).toEqual([0x2035, 0x2050]); // Dark Matter, Master Sphere
      expect(body.rewards.drops).toEqual([{ itemId: 'dark-matter', count: 1, rare: { itemId: 'master-sphere', count: 1, chance: 12.5 } }]);
      expect(l.stealQty).toEqual([2, 1]);
      expect(l.steal[1]).toBe(0x2008); // Elixir
      expect(body.rewards.steal?.common?.count).toBe(2);
      expect(body.rewards.steal?.rare).toEqual({ itemId: 'elixir', count: 1 });
      const stealIds: Record<string, [number, string]> = { 'dark-valefor': [0x2002, 'x-potion'], 'dark-ifrit': [0x2007, 'mega-phoenix'], 'dark-ixion': [0x2040, 'stamina-tablet'], 'dark-shiva': [0x2041, 'mana-tablet'], 'dark-bahamut': [0x2042, 'twin-stars'], 'dark-anima': [0x2045, 'three-stars'] };
      expect(l.steal[0]).toBe(stealIds[name]![0]);
      expect(body.rewards.steal?.common?.itemId).toBe(stealIds[name]![1]);
      expect(ITEMS[stealIds[name]![1]], 'the steal item exists').toBeDefined();
    });
  }

  it('the elements: Valefor resists all five; Ifrit, Ixion and Shiva absorb their own, are immune to two and resist one; Bahamut none; Anima absorbs fire, ice, thunder and water (the record bits)', () => {
    const bits = (e: EnemyDef): number[] => {
      const mask = (a: string) => (Object.entries(e.affinities) as Array<[string, string]>).filter(([, v]) => v === a).reduce((m, [k]) => m | elementMask([k as never]), 0);
      return [mask('absorb'), mask('immune'), mask('resist'), mask('weak')];
    };
    const rec = (n: string): number[] => [fixture.monsters[n]!.record.elementAbsorb!, fixture.monsters[n]!.record.elementImmune!, fixture.monsters[n]!.record.elementResist!, fixture.monsters[n]!.record.elementWeak!];
    // The engine's element mask and the record's bits are the same order (fire 1, ice 2, thunder 4, water 8, holy 16).
    for (const [name, body] of BODIES) expect(bits(body), name).toEqual(rec(name));
    expect(rec('dark-valefor')).toEqual([0, 0, 31, 0]);
    expect(rec('dark-anima')).toEqual([15, 0, 0, 0]);
    expect(rec('dark-bahamut')).toEqual([0, 0, 0, 0]);
  });

  it('Dark Ixion\'s second fight: the record\'s maximum 1,200,000 and the four stat writes on the form (STR 182, DEF 222, MAG 146, MDEF 198); the current HP 1,300,000 is written at set-up (RE six 4.3)', () => {
    const two = darkIxion2();
    expect(two.id).toBe('dark-ixion-2');
    expect(two.spriteKey, 'one painting for both fights').toBe('dark-ixion');
    expect(two.hp).toBe(1_200_000);
    expect(two.forms[0]!.statOverrides).toEqual({ str: 182, def: 222, mag: 146, mdef: 198 });
    expect(DARK_IXION_2_STATS).toEqual({ str: 182, def: 222, mag: 146, mdef: 198 });
    expect(DARK_IXION_2_CURRENT_HP).toBe(1_300_000);
    expect(SIX_FORMATIONS['dark-aeons-ixion-2']).toEqual({ bodyId: 'dark-ixion-2', overdrive: SIX_ROWS.thorsHammer, currentHp: 1_300_000 });
    expect(darkIxion1().forms[0]!.statOverrides).toBeUndefined();
    expect(darkIxion1().aiScriptId).toBe('dark6-ixion-1');
    expect(two.aiScriptId).toBe('dark6-ixion-2');
  });

  it('the bodies list, in link order, matches the seven links; the six records are the SIX_RECORDS table', () => {
    expect(DARK_SIX_BODIES.map((b) => b.id)).toEqual(['dark-valefor', 'dark-ifrit', 'dark-ixion', 'dark-ixion-2', 'dark-shiva', 'dark-anima', 'dark-bahamut']);
    expect(Object.keys(SIX_RECORDS)).toEqual(['valefor', 'ifrit', 'ixion', 'shiva', 'bahamut', 'anima']);
  });

  it('the stat records are the game\'s command lists: every row a body lists is one of its stored commands, except the plain Valefor Attack and Energy Blast, which her script queues from the rows 0x4062 and 0x4128', () => {
    const listed = (name: string): number[] => fixture.monsters[name]!.record.commands;
    expect(listed('dark-ifrit').slice(0, 4)).toEqual([0x410f, 0x410c, 0x410d, 0x410e]);
    expect(listed('dark-ixion').slice(0, 6)).toEqual([0x4114, 0x4110, 0x4116, 0x4111, 0x4112, 0x4113]);
    expect(listed('dark-shiva').slice(0, 3)).toEqual([0x4119, 0x4117, 0x4118]);
    expect(listed('dark-bahamut').slice(0, 3)).toEqual([0x410f, 0x411b, 0x411a]);
    expect(listed('dark-anima').slice(0, 4)).toEqual([0x411c, 0x4105, 0x411d, 0x411e]);
    expect(listed('dark-valefor').slice(0, 4)).toEqual([0x4000, 0x40a6, 0x403d, 0x405d]); // the stored list is not the script's (RE six 1.2)
  });
});

describe('the files\' own rows: the 24 rows, 21 distinct, each carried command record equal to the fixture field by field', () => {
  const carried = Object.entries(COMMAND_RECORDS_DARK_SIX);

  it('twenty rows are carried, one record each; the three identical pairs are carried once and the twins equal in every mapped field', () => {
    expect(carried).toHaveLength(20);
    expect(fixture.moves).toHaveLength(24);
    for (const [twin, kept] of Object.entries(DARK_SIX_TWIN_ROWS)) {
      const a = MOVE.get(Number(twin))!;
      const b = MOVE.get(kept)!;
      const { id: _i, row: _r, ...restA } = a;
      const { id: _j, row: _s, ...restB } = b;
      expect(restA, `0x${twin} against 0x${kept.toString(16)}`).toEqual(restB);
    }
    // Mega Graviton (0x4105) is the row Dark Anima shares with the Dark Magus Sisters: carried by the Mirror Aeons' data, pinned equal here too.
    expect(COMMAND_RECORDS['dark-mega-graviton']!.id).toBe(0x4105);
  });

  for (const [abilityId, record] of carried) {
    it(`${abilityId} (0x${record.id.toString(16)}): the record, word for word`, () => {
      const m = MOVE.get(record.id)!;
      expect(m, 'the row is in the fixture').toBeDefined();
      expect(record.type).toBe(m.type);
      expect(record.flagsMisc).toBe(m.flagsMisc);
      expect(record.flagsDamage).toBe(m.flagsDamage);
      expect(record.damageClass).toBe(m.damageClass);
      expect(record.rank).toBe(m.rank);
      expect(record.shatter ?? 0).toBe(m.shatter);
      expect(record.extra ?? 0).toBe(m.extra);
      expect([...(record.chances ?? [])]).toEqual(m.chances);
      expect([...(record.durations ?? [])]).toEqual(m.durations);
      expect(m.stageMask, 'no stage buff on any of the 24').toBe(0);
      expect(m.buff).toBe(0);
    });

    it(`${abilityId}: the ability's own fields (power, formula, hits, target, crit bonus, cap, accuracy, damage type) read the same row`, () => {
      const m = MOVE.get(record.id)!;
      const a = DARK_SIX_ABILITIES[abilityId] as AbilityDef;
      expect(a.power, 'power').toBe(m.power);
      expect(FORMULA_NUMBER[a.formula], 'formula').toBe(m.formula);
      expect(a.hits, 'hits').toBe(m.hits);
      expect(a.targeting, 'target byte 0x33 is one foe, 0x3b all').toBe(m.targetByte === 0x3b ? 'all-enemies' : 'single-enemy');
      expect(a.bonusCrit ?? 0, 'crit bonus').toBe(m.critBonus);
      expect(a.rank, 'rank').toBe(m.rank);
      expect(a.shatterChance ?? 0).toBe(m.shatter);
      expect(a.flags.includes('always-break-damage-limit'), 'the 99,999 cap bit').toBe((m.flagsDamage & 0x80) !== 0);
      expect(a.flags.includes('crit-eligible'), 'can crit').toBe((m.flagsDamage & 4) !== 0);
      expect(a.flags.includes('adds-equipment-crit'), 'crit bonus from gear').toBe((m.flagsDamage & 8) !== 0);
      expect(a.damageType, 'damage type').toBe((['other', 'physical', 'magical'] as const)[m.flagsDamage & 3]);
      expect(m.element, 'every move is non-elemental').toBe(0);
      expect(a.element).toEqual(['none']);
      expect(a.mpCost).toBe(0);
    });
  }

  it('the rank bytes: Dark Shiva\'s Attack is rank 1 and Heavenly Strike rank 2, the other 22 rows rank 3, and attachCommandRecords copies the record\'s onto the ability', () => {
    const ranks = Object.fromEntries(fixture.moves.map((m) => [`${m.id.toString(16)}`, m.rank]));
    expect(ranks['4119']).toBe(1);
    expect(ranks['4117']).toBe(2);
    expect(fixture.moves.filter((m) => m.rank !== 3).map((m) => m.id.toString(16)).sort()).toEqual(['4117', '4119']);
    const live = Object.fromEntries(ALL_ABILITIES.map((a) => [a.id, a]));
    expect(live[DARK_SIX_ROWS.shivaAttack]!.rank).toBe(1);
    expect(live[DARK_SIX_ROWS.heavenlyStrike]!.rank).toBe(2);
    expect(live[DARK_SIX_ROWS.shivaAttack]!.record).toBe(COMMAND_RECORDS_DARK_SIX[DARK_SIX_ROWS.shivaAttack]);
  });

  it('rule 5: every row has accuracy formula 0 and canMiss false EXCEPT the two Dark Ixion Attack rows (0x4114, 0x4115): formula 2, byte 254, canMiss unset', () => {
    for (const m of fixture.moves) {
      const formula = (m.flagsMisc >>> 3) & 7;
      expect(formula, `0x${m.id.toString(16)}`).toBe(m.id === 0x4114 || m.id === 0x4115 ? 2 : 0);
    }
    for (const [id, a] of Object.entries(DARK_SIX_ABILITIES)) {
      const rolls = id === DARK_SIX_ROWS.ixionAttack1 || id === DARK_SIX_ROWS.ixionAttack2;
      expect(a.canMiss, id).toBe(rolls ? undefined : false);
      expect(a.accuracy, id).toBe(rolls ? 254 : undefined);
    }
    expect(MOVE.get(0x4114)!.accuracy).toBe(254);
    expect(MOVE.get(0x4115)!.accuracy).toBe(254);
    expect(MOVE.get(0x4114)!.flagsMisc & 0x40, 'Darkness applies').toBe(0x40);
  });

  it('every ability the six bodies list is registered in the data layer and carries its record', () => {
    const live = new Map(ALL_ABILITIES.map((a) => [a.id, a]));
    for (const body of DARK_SIX_BODIES) {
      expect(body.abilityIds.length, body.id).toBeGreaterThanOrEqual(3);
      for (const id of body.abilityIds) {
        expect(live.get(id), `${body.id}: ${id}`).toBeDefined();
        expect(live.get(id)!.record, `${body.id}: ${id} has its record`).toBeDefined();
      }
    }
  });

  it('the statuses the rows inflict agree between the ability and the record (the cleanse rows list none: their bytes mean "remove")', () => {
    const NAMES = ['ko', 'zombie', 'petrify', 'poison', 'power-break', 'magic-break', 'armor-break', 'mental-break', 'confuse', 'berserk', 'provoke', 'threaten', 'sleep', 'silence', 'darkness', 'shell', 'protect', 'reflect', 'nul-tide', 'nul-blaze', 'nul-shock', 'nul-frost', 'regen', 'haste', 'slow'];
    for (const [id, a] of Object.entries(DARK_SIX_ABILITIES)) {
      const rec = COMMAND_RECORDS_DARK_SIX[id] as FFXCommandRecord;
      const cleanse = (rec.flagsDamage & 0x20) !== 0;
      if (cleanse) {
        expect(a.statusEffects, `${id} cleanses`).toEqual([]);
        continue;
      }
      expect(a.statusEffects.map((s) => [s.status, s.chance]).sort(), id).toEqual((rec.chances ?? []).map(([n, byte]) => [NAMES[n], byte]).sort());
    }
    expect(DARK_SIX_ABILITIES[DARK_SIX_ROWS.megaFlare]!.statusEffects).toEqual([]);
    expect(COMMAND_RECORDS_DARK_SIX[DARK_SIX_ROWS.aerospark]!.extra).toBe(0x200); // Auto-Life is removed
    expect(COMMAND_RECORDS_DARK_SIX[DARK_SIX_ROWS.shivaAttack]!.extra).toBe(0x200);
    expect(COMMAND_RECORDS_DARK_SIX[DARK_SIX_ROWS.megaFlare]!.extra ?? 0, 'Mega Flare leaves Auto-Life').toBe(0);
    expect(COMMAND_RECORDS_DARK_SIX[DARK_SIX_ROWS.oblivion]!.extra ?? 0, 'Oblivion leaves Auto-Life').toBe(0);
    expect(COMMAND_RECORDS_DARK_SIX[DARK_SIX_ROWS.oblivion]!.damageClass, 'Oblivion is HP and MP').toBe(3);
    expect(DARK_SIX_ABILITIES[DARK_SIX_ROWS.oblivion]!.hits).toBe(16);
  });
});

describe('the seven formations and the chain (RE six 2)', () => {
  const NOTE_FORMATIONS: Array<[string, number, number, number]> = [
    ['bsil07_70', 0x00480046, 1028, 4096], ['bika03_70', 0x01610046, 1051, 1280], ['kami03_70', 0x012f0046, 1042, 1280], ['kami03_71', 0x012f0047, 1042, 1280],
    ['mcyt00_70', 0x01540046, 1046, 1280], ['mtgz01_70', 0x01e60046, 1068, 0], ['dome06_70', 0x02090046, 521, 1280],
  ];

  it('the links are the game\'s seven formations with their battle ids, stage ids and launch flag words, in the chapter\'s order (Valefor, Ifrit, Ixion x2, Shiva, Anima, Bahamut)', () => {
    expect(DARK_SIX_LINKS.map((l) => [l.file, l.battleId, l.stage, l.flagWord])).toEqual(NOTE_FORMATIONS);
    expect(DARK_SIX_LINKS.map((l) => l.link)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(DARK_SIX_LINKS.map((l) => l.stop)).toEqual([1, 2, 3, 3, 4, 5, 6]); // Dark Ixion's two fights are one stop
    expect(DARK_SIX_LINKS.map((l) => l.hp)).toEqual([800_000, 1_400_000, 1_200_000, 1_200_000, 1_100_000, 8_000_000, 4_000_000]);
    // Bit 9 (0x200) is clear in all seven: a defeat is a game over; the chapter's retry is its own rule.
    for (const l of DARK_SIX_LINKS) expect(l.flagWord & 0x200, l.file).toBe(0);
  });

  it('seven groups, one body each at slot 0, Escape and Flee off in all seven (a departure for Dark Ixion alone: pick DA8), the boss named, the start card\'s name and the link\'s plate', () => {
    expect(DARK_SIX_GROUPS).toHaveLength(7);
    for (const link of DARK_SIX_LINKS) {
      const group = darkSixGroupOf(link.key);
      expect(ENEMY_GROUPS_BY_ID[link.groupId], link.groupId).toBe(group);
      expect(group.game).toBe('ffx');
      expect(group.enemies.map((e) => [e.id, e.slot])).toEqual([[link.bodyId, 0]]);
      expect(group.canEscape, link.file).toBe(false);
      expect(group.bossId).toBe(link.bodyId);
      expect(group.headline).toBe(link.headline);
      expect(group.plate).toBe(link.plate);
      expect(group.enemies[0]!.aiScriptId).toBe(DARK_SIX_SCRIPTS[link.key]);
    }
  });

  it('the chain: each link names the next; every link from the second on is a fresh fight (party and aeons restored), a retry checkpoint and shows no Save Sphere card; the last pays every link\'s spoils', () => {
    DARK_SIX_LINKS.forEach((link, i) => {
      const group = darkSixGroupOf(link.key);
      const next = DARK_SIX_LINKS[i + 1];
      expect(group.nextGroupId, link.groupId).toBe(next?.groupId);
      const fresh = [group.checkpointOnEntry, group.restoresPartyOnEntry, group.restoresAeonsOnEntry, group.noSaveSphereCard];
      expect(fresh, link.groupId).toEqual(i === 0 ? [undefined, undefined, undefined, undefined] : [true, true, true, true]);
      expect(group.poolsChainSpoils, link.groupId).toBe(next === undefined ? true : undefined);
    });
  });

  it('music: the Challenge cue for the first six, the Yojimbo cue for the last (stand-ins by reference)', () => {
    expect(DARK_SIX_GROUPS.map((g) => g.musicCues?.[0]?.track)).toEqual(['boss-challenge', 'boss-challenge', 'boss-challenge', 'boss-challenge', 'boss-challenge', 'boss-challenge', 'boss-yojimbo']);
  });
});

describe('the copies the battle layer keeps (it imports no src/data)', () => {
  it('the script ids, the ability ids, the formations and the gains equal the data layer\'s', () => {
    expect(SIX_SCRIPTS).toEqual({ valefor: DARK_SIX_SCRIPTS.valefor, ifrit: DARK_SIX_SCRIPTS.ifrit, ixion1: DARK_SIX_SCRIPTS['ixion-1'], ixion2: DARK_SIX_SCRIPTS['ixion-2'], shiva: DARK_SIX_SCRIPTS.shiva, anima: DARK_SIX_SCRIPTS.anima, bahamut: DARK_SIX_SCRIPTS.bahamut });
    for (const [k, id] of Object.entries(DARK_SIX_ROWS)) expect(SIX_ROWS[k as keyof typeof SIX_ROWS], k).toBe(id);
    expect(SIX_ROWS.megaGraviton).toBe('dark-mega-graviton');
    expect(Object.keys(SIX_FORMATIONS).sort()).toEqual(DARK_SIX_LINKS.map((l) => l.groupId).sort());
    for (const link of DARK_SIX_LINKS) expect(SIX_FORMATIONS[link.groupId]!.bodyId, link.groupId).toBe(link.bodyId);
    // The Overdrive each formation's gauge shows is the row its script queues at a full bar.
    expect(DARK_SIX_LINKS.map((l) => SIX_FORMATIONS[l.groupId]!.overdrive)).toEqual([SIX_ROWS.energyBlast, SIX_ROWS.hellfire, SIX_ROWS.aerospark, SIX_ROWS.thorsHammer, SIX_ROWS.diamondDust, SIX_ROWS.oblivion, SIX_ROWS.megaFlare]);
  });

  it('the gains are the note\'s table 4.7: per own turn and per allowed hit', () => {
    expect(SIX_GAINS).toEqual({
      valefor: { perTurn: 5, perHit: 15 }, ifrit: { perTurn: 10, perHit: 5 }, ixion1: { perTurn: 5, perHit: 10 }, ixion2: { perTurn: 10, perHit: 10 },
      shiva: { perTurn: 10, perHit: 10 }, bahamut: { perTurn: 10, perHit: 10 }, anima: { perTurn: 10, perHit: 5 },
    });
  });

  it('the chapter id and the loot record\'s weapon and armour pools carry Break Damage Limit and Break HP Limit on all six (the gear drop itself is not modelled)', () => {
    expect(DARK_AEONS_CHAPTER_ID).toBe('dark-aeons');
    for (const [name, m] of Object.entries(fixture.monsters)) {
      expect(m.loot.weaponPool.filter((x) => x === 0x8019), `${name}: Break Damage Limit x2`).toHaveLength(2);
      expect(m.loot.armourPool.filter((x) => x === 0x8017), `${name}: Break HP Limit x3`).toHaveLength(3);
      expect(m.loot.armourPool).toContain(0x8080); // Ribbon
    }
  });
});
