/**
 * The hidden Mirror Aeons chapter's data (FFX only), **pinned to the game's own files** as the reverse-engineering session's note gives them (`research/re-ffx-yojimbo-sisters-feasibility.md`, "RE section n"): the four
 * records, their loot, the eleven formations, the fourteen move rows with the game's command records word for word (against the two kernel fixtures), and the copies the battle layer keeps of the ids.
 * The numbers below are typed from the note, not read from the source files under test.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import type { EnemyDef } from '../../../src/battle/common/types.ts';
import { DARK_FORMATIONS, DARK_IDS, DARK_SCRIPTS } from '../../../src/battle/ffx/ai/dark-aeons-seams.ts';
import { FORMULA_NUMBER } from '../../../src/battle/ffx/adapt/command.ts';
import { elementMask } from '../../../src/battle/ffx/adapt/words.ts';
import { ALL_ABILITIES, ENEMY_GROUPS_BY_ID, ITEMS } from '../../../src/data/ffx/index.ts';
import { COMMAND_RECORDS } from '../../../src/data/ffx/command-records/index.ts';
import { COMMAND_RECORDS_DARK_AEONS, DARK_AEONS_ABILITIES } from '../../../src/data/ffx/enemies/dark-aeons-abilities.ts';
import { DARK_AEONS_GROUPS, darkAeonsGroupOf } from '../../../src/data/ffx/enemies/dark-aeons-groups.ts';
import { darkDaigoro, darkSister, darkYojimbo } from '../../../src/data/ffx/enemies/dark-aeons.ts';
import * as ids from '../../../src/data/ffx/mirror-aeons-ids.ts';

interface Fixture { columns: string[]; rows: Array<Array<number | Array<[number, number]>>> }
const read = (name: string): Fixture => JSON.parse(readFileSync(fileURLToPath(new URL(`../../fixtures/parity/ffx/${name}`, import.meta.url)), 'utf8')) as Fixture;
const commands = read('command_records.json');
const status = read('command_status.json');
const byId = (f: Fixture): Map<number, Array<number | Array<[number, number]>>> => new Map(f.rows.map((r) => [r[0] as number, r]));
const COMMAND = byId(commands);
const STATUS = byId(status);
const col = (f: Fixture, name: string): number => f.columns.indexOf(name);

/** RE section 2, typed from the note: hp, mp, str, def, mag, mdef, agi, luck, eva, acc. */
const NOTE: Record<string, readonly number[]> = {
  yojimbo: [1_600_000, 999, 244, 210, 131, 144, 243, 114, 0, 255],
  cindy: [3_000_000, 999, 175, 223, 171, 105, 185, 40, 0, 255],
  sandy: [2_500_000, 999, 186, 201, 207, 168, 201, 80, 100, 255],
  mindy: [2_000_000, 999, 148, 187, 248, 132, 233, 130, 240, 255],
};
const statsOf = (e: EnemyDef): number[] => [e.stats.hp, e.stats.mp, e.stats.str, e.stats.def, e.stats.mag, e.stats.mdef, e.stats.agi, e.stats.luck, e.stats.eva, e.stats.acc];

const BODIES: ReadonlyArray<readonly [string, EnemyDef]> = [
  ['yojimbo', darkYojimbo()],
  ['cindy', darkSister('cindy', 0)],
  ['sandy', darkSister('sandy', 0)],
  ['mindy', darkSister('mindy', 0)],
];

describe('the four records (RE section 2)', () => {
  for (const [name, body] of BODIES) {
    it(`${body.name}: the record's ten numbers, no affinity, HP bar and form, Threaten 0, Zanmato byte 4`, () => {
      expect(statsOf(body)).toEqual(NOTE[name]);
      expect([body.stats.maxHp, body.stats.maxMp, body.hp, body.mp]).toEqual([NOTE[name]![0], 999, NOTE[name]![0], 999]);
      expect(body.forms).toEqual([{ name: body.name, spriteKey: `dark-${name}`, hp: NOTE[name]![0] }]);
      expect(body.affinities).toEqual({});
      expect(body.threatenChance).toBe(0);
      expect(body.zanmatoLevel).toBe(5); // the byte 4, printed "Zanmato Lv. 5" by the guides
      expect(body.flags).toEqual({ isBoss: true });
    });

    it(`${body.name}: immune (255) to the fifteen the note lists and to Scan, Eject, Auto-Life and Doom; Shell, Protect, Reflect, the Nuls, Regen and Haste land`, () => {
      const immune = ['ko', 'zombie', 'petrify', 'poison', 'power-break', 'magic-break', 'armor-break', 'mental-break', 'confuse', 'berserk', 'provoke', 'sleep', 'silence', 'darkness', 'slow', 'scan', 'eject', 'auto-life', 'doom'];
      expect(Object.keys(body.immunities).sort()).toEqual([...immune].sort());
      for (const s of immune) expect((body.immunities as Record<string, number>)[s], s).toBe(255);
      for (const s of ['shell', 'protect', 'reflect', 'nultide', 'nulblaze', 'nulshock', 'nulfrost', 'regen', 'haste']) expect((body.immunities as Record<string, number>)[s], s).toBeUndefined();
      expect(body.immunityFlags).toEqual(['boss', 'immune-to-percentage-damage', 'immune-to-life', 'immune-to-sensor', 'immune-to-scan', 'immune-to-delay', 'immune-to-bribe']);
    });
  }

  it('Dark Yojimbo paints his Dark painting and each sister hers, never the player\'s aeon (r50.1; the art itself is pinned in mirror-aeons-art.test.ts)', () => {
    expect(darkYojimbo().spriteKey).toBe('dark-yojimbo');
    expect(['cindy', 'sandy', 'mindy'].map((n) => darkSister(n as 'cindy', 0).spriteKey)).toEqual(['dark-cindy', 'dark-sandy', 'dark-mindy']);
  });
});

describe('the loot (RE section 2)', () => {
  const LOOT = { yojimbo: [8_000, 10_000, 'stamina-tonic', 2], cindy: [10_000, 12_000, 'return-sphere', 1], sandy: [10_000, 12_000, 'friend-sphere', 1], mindy: [10_000, 12_000, 'teleport-sphere', 1] } as const;
  for (const [name, body] of BODIES) {
    it(`${body.name}: no gil, AP ${LOOT[name as keyof typeof LOOT][0]} (${LOOT[name as keyof typeof LOOT][1]} on an Overkill, threshold 99,999), one Dark Matter slot with the Master Sphere one time in eight, the Steal pair`, () => {
      const [ap, apOverkill, common, count] = LOOT[name as keyof typeof LOOT];
      const r = body.rewards;
      expect([r.gil, r.ap, r.apOverkill, r.overkillThreshold]).toEqual([0, ap, apOverkill, 99_999]);
      expect(r.drops).toEqual([{ itemId: 'dark-matter', count: 1, rare: { itemId: 'master-sphere', count: 1, chance: 12.5 } }]);
      expect(r.steal).toEqual({ baseChance: 100, common: { itemId: common, count }, rare: { itemId: 'elixir', count: 1 } });
      expect(r.bribe).toBeUndefined(); // Bribe is blocked and the record names no item
    });
  }

  it('every item a Dark Aeon drops or can be stolen from resolves', () => {
    for (const id of ['dark-matter', 'master-sphere', 'elixir', 'stamina-tonic', 'return-sphere', 'friend-sphere', 'teleport-sphere']) expect(ITEMS[id], id).toBeDefined();
  });
});

describe('the eleven formations (RE section 3) and the one adjusted trio (OUR adjustment)', () => {
  it('six Sisters formations and five Yojimbo tiers, in the game\'s file order, then the one adjusted trio, each registered in the data layer under its group id', () => {
    expect(DARK_AEONS_GROUPS.map((g) => g.id)).toEqual([
      ...['kino00_70', 'kino01_70', 'kino01_71', 'kino01_72', 'kino05_70', 'kino05_71'].map((f) => `mirror-sisters-${f}`),
      'mirror-sisters-kino00_70-g0', // OUR adjustment: the faithful trio's battle id with the gauges started at 0
      ...['nagi05_70', 'nagi05_71', 'nagi05_72', 'nagi05_73', 'nagi05_74'].map((f) => `mirror-yojimbo-${f}`),
    ]);
    for (const g of DARK_AEONS_GROUPS) expect(ENEMY_GROUPS_BY_ID[g.id], g.id).toBe(g);
  });

  it('the trio is Mindy, Sandy, Cindy from slot 0; the pair Mindy and Sandy; each solo is her own', () => {
    const who = (file: string): string[] => darkAeonsGroupOf(file).enemies.map((e) => `${e.slot}:${e.id}`);
    expect(who('kino00_70')).toEqual(['0:dark-mindy', '1:dark-sandy', '2:dark-cindy']);
    expect(who('kino01_70')).toEqual(who('kino00_70'));
    expect(who('kino01_71')).toEqual(['0:dark-cindy']);
    expect(who('kino01_72')).toEqual(['0:dark-mindy', '1:dark-sandy']);
    expect(who('kino05_70')).toEqual(['0:dark-sandy']);
    expect(who('kino05_71')).toEqual(['0:dark-mindy']);
    expect(who('kino00_70-g0')).toEqual(who('kino00_70'));
    for (const t of ['nagi05_70', 'nagi05_71', 'nagi05_72', 'nagi05_73', 'nagi05_74']) expect(who(t), t).toEqual(['0:dark-yojimbo', '1:dark-daigoro']);
  });

  it('the battle ids, stage ids, flag words and start gauges are the note\'s', () => {
    const sisters = ids.SISTER_FORMATIONS.map((f) => [f.file, f.battleId, f.stage, f.flagWord, f.startGauge]);
    expect(sisters).toEqual([
      ['kino00_70', 14_417_990, 1035, 0x1800, 100],
      ['kino01_70', 14_483_526, 1036, 0x1800, 100],
      ['kino01_71', 14_483_527, 1036, 0x1800, 0],
      ['kino01_72', 14_483_528, 1036, 0x1000, 0],
      ['kino05_70', 14_745_670, 1036, 0x1000, 0],
      ['kino05_71', 14_745_671, 1036, 0x1000, 0],
    ]);
    // OUR adjustment, not a game formation: the trio's battle id (so the scripts' trio test still runs) with the gauges started at 0.
    expect(ids.SISTER_ADJUSTED_FORMATIONS.map((f) => [f.file, f.battleId, f.stage, f.flagWord, f.startGauge])).toEqual([['kino00_70-g0', 14_417_990, 1035, 0x1800, 0]]);
    const tiers = ids.YOJIMBO_TIERS.map((t) => [t.file, t.battleId, t.stage, t.gaugePerTurn, t.ambushed]);
    expect(tiers).toEqual([
      ['nagi05_70', 28_180_550, 1080, 6, true],
      ['nagi05_71', 28_180_551, 1066, 10, false],
      ['nagi05_72', 28_180_552, 1080, 16, false],
      ['nagi05_73', 28_180_553, 1066, 20, false],
      ['nagi05_74', 28_180_554, 1066, 26, false],
    ]);
  });

  it('Escape and Flee are off in all twelve; every Sisters group chains to Act II; only the Yojimbo groups name the cavern plate, are a retry checkpoint, pool the spoils and heal the party AND the aeons on entry, with no Save Sphere card', () => {
    for (const g of DARK_AEONS_GROUPS) expect(g.canEscape, g.id).toBe(false);
    for (const g of DARK_AEONS_GROUPS.filter((x) => x.id.startsWith('mirror-sisters-'))) {
      expect(g.nextGroupId, g.id).toBe(ids.MIRROR_ACT_II_GROUP);
      expect([g.plate, g.checkpointOnEntry, g.poolsChainSpoils, g.restoresPartyOnEntry, g.restoresAeonsOnEntry, g.noSaveSphereCard], g.id).toEqual([undefined, undefined, undefined, undefined, undefined, undefined]);
    }
    for (const g of DARK_AEONS_GROUPS.filter((x) => x.id.startsWith('mirror-yojimbo-'))) {
      expect([g.nextGroupId, g.plate, g.checkpointOnEntry, g.poolsChainSpoils], g.id).toEqual([undefined, ids.MIRROR_ACT_II_PLATE, true, true]);
      expect([g.restoresPartyOnEntry, g.restoresAeonsOnEntry, g.noSaveSphereCard], g.id).toEqual([true, true, true]); // the heal between the acts (the release driver's delegated pick)
    }
  });

  it("the chapter's two picks name real groups: Act I the faithful pair, Act II tier 2 (the bench's picks, RE's own recommendations)", () => {
    expect([ids.MIRROR_ACT_I, ids.MIRROR_ACT_II]).toEqual(['kino01_72', 'nagi05_71']);
    expect(ENEMY_GROUPS_BY_ID[ids.MIRROR_ACT_I_GROUP]).toBeDefined();
    expect(ENEMY_GROUPS_BY_ID[ids.MIRROR_ACT_II_GROUP]).toBeDefined();
    expect(ids.SISTER_LADDER.every((f) => darkAeonsGroupOf(f) !== undefined)).toBe(true);
  });

  it('the dog (the Sinscale stand-in): Strength 244, untargetable, no HP bar, takes no turns by its script', () => {
    const dog = darkDaigoro();
    expect([dog.stats.str, dog.flags, dog.slot, dog.abilityIds]).toEqual([244, { untargetable: true, hideHpBar: true }, 1, ['dark-daigoro-bite']]);
  });
});

describe('no Dark Aeon stands out of reach (BattleDistance)', () => {
  // RE's lane FFX-K (the release driver, 2026-10-16): a foe at BattleDistance 1 is OUT OF REACH of every reach-0 command, and the Sisters' Attack, Camisade, Razzia and Passado have reach 0 (the Delta Attack reaches 1,
  // spells 3). The game's formation data for the Dark Aeons gives START POSITIONS only (`research/re-ffx-dark-aeons.md` section 2.3) and the formation scripts write no BattleDistance (section 2.2: the three things they do are
  // the start type, random positions off and camera work), so every Dark Aeon is at distance 0 and nothing here sets one. The four bodies, the dog and every group's enemy list carry no `battleDistance`.
  it('none of the four bodies, the dog or any enemy of the twelve groups carries a battleDistance', () => {
    for (const e of [darkYojimbo(), darkSister('cindy', 0), darkSister('sandy', 0), darkSister('mindy', 0), darkDaigoro()]) expect(e.flags?.battleDistance, e.id).toBeUndefined();
    for (const g of DARK_AEONS_GROUPS) for (const e of g.enemies) expect(e.flags?.battleDistance, `${g.id}: ${e.id}`).toBeUndefined();
  });
});

describe('the fourteen move rows against the kernel fixtures (RE section 2)', () => {
  const ROWS = Object.entries(DARK_AEONS_ABILITIES);
  const dense = (pairs: unknown): Array<[number, number]> => ((pairs ?? []) as Array<[number, number]>).map(([a, b]) => [a, b]);

  it('there are fourteen, each registered in the data layer with its record attached', () => {
    expect(ROWS).toHaveLength(14);
    for (const [id, ability] of ROWS) {
      expect(ALL_ABILITIES.find((a) => a.id === id), id).toBe(ability);
      expect(ability.record, id).toBe(COMMAND_RECORDS_DARK_AEONS[id]);
      expect(COMMAND_RECORDS[id], id).toBe(COMMAND_RECORDS_DARK_AEONS[id]);
    }
  });

  it('each command record equals the game\'s row word for word: type, both flag words, damage class, rank, shatter, chances, durations, the extra word', () => {
    for (const [id, record] of Object.entries(COMMAND_RECORDS_DARK_AEONS)) {
      const c = COMMAND.get(record.id);
      const s = STATUS.get(record.id);
      expect(c, `${id} in command_records.json`).toBeDefined();
      expect(s, `${id} in command_status.json`).toBeDefined();
      expect(record.type, id).toBe(c![col(commands, 'type')]);
      expect(record.flagsMisc, id).toBe(c![col(commands, 'flagsMisc')]);
      expect(record.flagsDamage, id).toBe(c![col(commands, 'flagsDamage')]);
      expect(record.damageClass, id).toBe(c![col(commands, 'damageClass')]);
      expect(record.shatter ?? 0, id).toBe(c![col(commands, 'shatter')]);
      expect(record.rank, id).toBe(s![col(status, 'rank')]);
      expect(record.extra ?? 0, id).toBe(s![col(status, 'extra')]);
      expect(dense(record.chances), id).toEqual(dense(s![col(status, 'chances')]));
      expect(dense(record.durations), id).toEqual(dense(s![col(status, 'durations')]));
    }
  });

  it('the numbers a row carries equal the game\'s: formula, power, hits, element, crit bonus; accuracy formula 0 so none misses', () => {
    for (const [id, a] of ROWS) {
      const c = COMMAND.get(a.record!.id)!;
      expect(FORMULA_NUMBER[a.formula], `${id} formula`).toBe(c[col(commands, 'formula')]);
      expect(a.power, `${id} power`).toBe(c[col(commands, 'power')]);
      expect(a.hits, `${id} hits`).toBe(c[col(commands, 'hits')]);
      expect(elementMask(a.element), `${id} element`).toBe(c[col(commands, 'element')]);
      expect(a.bonusCrit ?? 0, `${id} critBonus`).toBe(c[col(commands, 'critBonus')]);
      expect(c[col(commands, 'accuracy')], `${id} accuracy byte`).toBe(0);
      expect((a.record!.flagsMisc >>> 3) & 7, `${id} accuracy formula`).toBe(0);
      expect(a.canMiss, id).toBe(false);
      expect(a.rank, id).toBe(3);
    }
  });

  it('the cap bit: every damaging row passes 9,999 (record bit 7) and says so (always-break-damage-limit)', () => {
    for (const [id, a] of ROWS.filter(([, x]) => x.formula !== 'none')) {
      expect(a.record!.flagsDamage & 0x80, id).toBe(0x80);
      expect(a.flags, id).toContain('always-break-damage-limit');
    }
  });

  it('the dog\'s order (0x4086) deals nothing and orders the bite (0x410B)', () => {
    const order = DARK_AEONS_ABILITIES['dark-daigoro-order']!;
    // `orderedAim` makes the bite's victim the game's own stream-4 pick over the living front line (RE note 4.4; `battle/ffx/orders.ts`).
    expect([order.formula, order.power, order.extra]).toEqual(['none', 0, { ordersActor: 'dark-daigoro', orderedAbility: 'dark-daigoro-bite', orderedAim: 'game-picker' }]);
    expect(order.record!.id).toBe(0x4086);
    expect(DARK_AEONS_ABILITIES['dark-daigoro-bite']!.record!.id).toBe(0x410b);
  });

  it('each body carries the moves the note\'s command lists name', () => {
    const list = (e: EnemyDef): string[] => [...e.abilityIds].sort();
    expect(list(darkSister('cindy', 0))).toEqual(['dark-camisade', 'dark-cindy-attack', 'dark-delta-attack', 'dark-mega-graviton']);
    expect(list(darkSister('sandy', 0))).toEqual(['dark-delta-attack', 'dark-mega-graviton', 'dark-razzia', 'dark-sandy-attack']);
    expect(list(darkSister('mindy', 0))).toEqual(['dark-calamity', 'dark-delta-attack', 'dark-mega-graviton', 'dark-passado']);
    expect(list(darkYojimbo())).toEqual(['dark-daigoro-order', 'dark-kozuka', 'dark-wakizashi', 'dark-wakizashi-all', 'dark-zanmato']);
  });
});

describe('the battle layer\'s copies agree with the data layer', () => {
  it('the script ids, the combatant ids and the formation table (battle ids, start gauges, tier fills)', () => {
    expect(DARK_SCRIPTS).toEqual({ cindy: ids.DARK_CINDY_SCRIPT, sandy: ids.DARK_SANDY_SCRIPT, mindy: ids.DARK_MINDY_SCRIPT, yojimbo: ids.DARK_YOJIMBO_SCRIPT, daigoro: ids.DARK_DAIGORO_SCRIPT });
    expect(DARK_IDS).toEqual({ cindy: ids.DARK_CINDY_ID, sandy: ids.DARK_SANDY_ID, mindy: ids.DARK_MINDY_ID, yojimbo: ids.DARK_YOJIMBO_ID, daigoro: ids.DARK_DAIGORO_ID });
    const expected = Object.fromEntries([
      ...[...ids.SISTER_FORMATIONS, ...ids.SISTER_ADJUSTED_FORMATIONS].map((f) => [ids.sistersGroupId(f.file), { battleId: f.battleId, startGauge: f.startGauge }]),
      ...ids.YOJIMBO_TIERS.map((t) => [ids.yojimboGroupId(t.file), { battleId: t.battleId, startGauge: 0, gaugePerTurn: t.gaugePerTurn }]),
    ]);
    expect(DARK_FORMATIONS).toEqual(expected);
  });

  it('the enemies\' script ids are the ones the battle layer names, and the story layer\'s mirrored ids match', async () => {
    expect(darkSister('cindy', 0).aiScriptId).toBe(DARK_SCRIPTS.cindy);
    expect(darkSister('sandy', 0).aiScriptId).toBe(DARK_SCRIPTS.sandy);
    expect(darkSister('mindy', 0).aiScriptId).toBe(DARK_SCRIPTS.mindy);
    expect(darkYojimbo().aiScriptId).toBe(DARK_SCRIPTS.yojimbo);
    expect(darkDaigoro().aiScriptId).toBe(DARK_SCRIPTS.daigoro);
    const story = await import('../../../src/story/scripts/mirror-aeons.ts');
    expect(story.SISTERS_FALL).toBe(ids.MIRROR_SEAM);
  });
});
