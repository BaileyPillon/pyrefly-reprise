/**
 * The hidden Sanctuary Keeper chapter's data (FFX only): pinned to the reverse-engineering note (`research/re-ffx-sanctuary-keeper.md`, "RE n") and to the kernel fixtures, field by field; the chapter is registered
 * hidden (number 39, the word `beast`), unlisted, with its metadata, scene and door; the battle layer's copies of the ids equal the data layer's. Not the Spectral Keeper (chapter 29): a different monster.
 */

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import * as battleRules from '../../../src/battle/ffx/ai/sanctuary-keeper-rules.ts';
import { CHAPTERS, CHAPTER_IDS, EXPERIMENT_CHAPTERS, getChapter } from '../../../src/data/encounters.ts';
import { ALL_ABILITIES, ENEMY_GROUPS_BY_ID } from '../../../src/data/ffx/index.ts';
import { COMMAND_RECORDS_SANCTUARY_KEEPER, SANCTUARY_KEEPER_ABILITIES } from '../../../src/data/ffx/enemies/sanctuary-keeper-abilities.ts';
import { RECORDS, SANCTUARY_OVERKILL_THRESHOLD, SANCTUARY_POISON_PERCENT, sanctuaryKeeper, sanctuaryKeeperGroup } from '../../../src/data/ffx/enemies/sanctuary-keeper.ts';
import * as ids from '../../../src/data/ffx/sanctuary-keeper-ids.ts';
import { UNLISTED_CHAPTER_META } from '../../../src/data/chapter-meta.ts';
import { getScene } from '../../../src/scenes/index.ts';
import { CHAPTER_DOORS } from '../../../src/app/screens/frontend/chapterDoors.ts';
import { BEAST_DOOR_WORD } from '../../../src/app/screens/frontend/beastDoor.ts';
import { SANCTUARY_KEEPER_BENCH, SANCTUARY_KEEPER_FRONT_LINE, sanctuaryKeeperBuild } from '../../../src/data/ffx/builds/sanctuary-keeper.ts';
import { gagazetBuild } from '../../../src/data/ffx/builds/gagazet.ts';
import { spectralKeeper } from '../../../src/data/ffx/enemies/spectral-keeper.ts';

const fixture = (name: string): { columns: string[]; rows: unknown[][] } => JSON.parse(readFileSync(new URL(`../../fixtures/parity/ffx/${name}.json`, import.meta.url), 'utf8'));
const recordsFixture = fixture('command_records');
const statusFixture = fixture('command_status');
const byId = (f: { rows: unknown[][] }, id: number): unknown[] => f.rows.find((r) => r[0] === id) as unknown[];

describe('the battle layer keeps copies of the ids, and they equal the data layer\'s', () => {
  it('the combatant, the script, the rows and the flag keys', () => {
    expect(battleRules.SK_ID).toBe(ids.SANCTUARY_KEEPER_ID);
    expect(battleRules.SK_SCRIPT).toBe(ids.SANCTUARY_KEEPER_SCRIPT);
    expect(battleRules.SK_ROWS).toEqual(ids.SANCTUARY_ROWS);
    expect(battleRules.SK_CYCLE_FLAG).toBe(ids.SANCTUARY_FLAGS.cycle);
    expect(battleRules.SK_PHASE_FLAG).toBe(ids.SANCTUARY_FLAGS.phase);
    expect(battleRules.SK_COUNT_FLAG).toBe(ids.SANCTUARY_FLAGS.count);
  });
});

describe('the Keeper equals the note (RE 1.1 to 1.3)', () => {
  it('40,000 HP, MP 256, STR 37, DEF 100, MAG 40, MDEF 100, AGI 32, LUCK 15, EVA 0, ACC 50, overkill 6,400', () => {
    const k = sanctuaryKeeper();
    expect(k.stats).toMatchObject({ hp: 40_000, mp: 256, str: 37, def: 100, mag: 40, mdef: 100, agi: 32, luck: 15, eva: 0, acc: 50, maxHp: 40_000, maxMp: 256 });
    expect(RECORDS.keeper).toEqual([40_000, 256, 37, 100, 40, 100, 32, 15, 0, 50]);
    expect(SANCTUARY_OVERKILL_THRESHOLD).toBe(6_400);
    expect(k.affinities).toEqual({}); // no element weakness or resistance
    expect(k.zanmatoLevel).toBe(4); // the loot record's byte 3, plus 1
  });

  it('the status bytes: 255 on Death, Zombie, Petrify, Confuse, Provoke, Sleep, Silence, Eject, Auto-Life, Doom; Poison 90, Power and Magic Break 50, Darkness 100; the rest land', () => {
    const imm = sanctuaryKeeper().immunities;
    for (const s of ['ko', 'zombie', 'petrify', 'confuse', 'provoke', 'sleep', 'silence', 'eject', 'auto-life', 'doom'] as const) expect(imm[s], s).toBe(255);
    expect([imm['poison'], imm['power-break'], imm['magic-break'], imm['darkness']]).toEqual([90, 50, 50, 100]);
    for (const s of ['armor-break', 'mental-break', 'berserk', 'slow', 'haste', 'regen', 'shell', 'protect', 'reflect'] as const) expect(imm[s] ?? 0, s).toBe(0);
    expect(sanctuaryKeeper().threatenChance).toBe(100); // Threaten's byte is a success percentage (RE 1.2)
  });

  it('the flag bytes: percentage damage, Life, CTB damage and Bribe immunities; Scan lands; the Poison byte 5 is 2,000 a tick', () => {
    const k = sanctuaryKeeper();
    expect(k.immunityFlags).toEqual(expect.arrayContaining(['boss', 'immune-to-percentage-damage', 'immune-to-life', 'immune-to-delay', 'immune-to-bribe']));
    expect(k.immunityFlags).not.toContain('immune-to-scan'); // the extra-immunity word 0x4300 has no Scan bit: Scan lands
    expect(k.poisonTickPercent).toBe(SANCTUARY_POISON_PERCENT);
    expect((k.stats.maxHp * SANCTUARY_POISON_PERCENT) / 100).toBe(2_000);
  });

  it('rewards: 6,500 gil, 11,000 AP (16,500 on an overkill), a Return Sphere, steals Turbo Ether (one common, two rare)', () => {
    const r = sanctuaryKeeper().rewards;
    expect([r.gil, r.ap, r.apOverkill, r.overkillThreshold]).toEqual([6_500, 11_000, 16_500, 6_400]);
    expect(r.drops).toEqual([{ itemId: 'return-sphere', count: 1 }]);
    expect(r.steal?.common).toEqual({ itemId: 'turbo-ether', count: 1 });
    expect(r.steal?.rare).toEqual({ itemId: 'turbo-ether', count: 2 });
  });

  it('the plain Attack is the game\'s row 0x6000 (accuracy formula 2 on a byte of 90, power 16)', () => {
    const plain = sanctuaryKeeper().plainAttack;
    expect(plain?.record.id).toBe(0x6000);
    expect(plain?.accuracy).toBe(90);
    const row = byId(recordsFixture, 0x6000);
    expect([row[2], row[6], row[7], row[8]]).toEqual([plain?.record.flagsMisc, 1, 90, 16]);
  });

  it('is not the Spectral Keeper: another record, another id, another script', () => {
    const a = sanctuaryKeeper();
    const b = spectralKeeper();
    expect(a.id).not.toBe(b.id);
    expect(a.aiScriptId).not.toBe(b.aiScriptId);
    expect(a.stats.maxHp).not.toBe(b.stats.maxHp);
  });
});

describe('the formation (RE 2)', () => {
  it('one Keeper on slot 0; Escape and Flee off for everyone; Switch, Summon and Defend are not touched', () => {
    const g = sanctuaryKeeperGroup;
    expect(g.enemies.map((e) => e.id)).toEqual([ids.SANCTUARY_KEEPER_ID]);
    expect(g.bossId).toBe(ids.SANCTUARY_KEEPER_ID);
    expect(g.canEscape).toBe(false);
    expect(g.commandDisables).toEqual([
      { who: 'everyone', command: 0x3003 }, // Escape
      { who: 'everyone', command: 0x3018 }, // Flee
    ]);
    expect(g.frontLineFirstStrike).toBeUndefined(); // Normal start: the formation writes it
    expect(g.platformRing).toBeUndefined();
  });

  it('is registered in the data layer under its id, with the three rows', () => {
    expect(ENEMY_GROUPS_BY_ID[ids.SANCTUARY_KEEPER_GROUP_ID]).toBe(sanctuaryKeeperGroup);
    const abilityIds = ALL_ABILITIES.map((a) => a.id);
    for (const row of [ids.SANCTUARY_ROWS.photonWings, ids.SANCTUARY_ROWS.manaBreath, ids.SANCTUARY_ROWS.tailSweep]) expect(abilityIds, row).toContain(row);
    for (const row of [ids.SANCTUARY_ROWS.curaga, ids.SANCTUARY_ROWS.esuna, ids.SANCTUARY_ROWS.protect, ids.SANCTUARY_ROWS.reflect, ids.SANCTUARY_ROWS.regen, ids.SANCTUARY_ROWS.haste]) expect(abilityIds, row).toContain(row);
  });
});

describe('the three move rows equal the kernel fixtures word for word (RE 5)', () => {
  const rows = [
    { id: ids.SANCTUARY_ROWS.photonWings, game: 0x6042 },
    { id: ids.SANCTUARY_ROWS.manaBreath, game: 0x6043 },
    { id: ids.SANCTUARY_ROWS.tailSweep, game: 0x6044 },
  ] as const;

  for (const { id, game } of rows) {
    it(`${id} is row 0x${game.toString(16)}: type, flag words, damage class, formula, accuracy, power, rank, statuses`, () => {
      const rec = COMMAND_RECORDS_SANCTUARY_KEEPER[id]!;
      const r = byId(recordsFixture, game) as number[];
      const s = byId(statusFixture, game) as [number, number, number, number, number, number, number[][], number[][]];
      expect(rec.id).toBe(r[0]);
      expect([rec.type, rec.flagsMisc, rec.flagsDamage, rec.damageClass]).toEqual([r[1], r[2], r[3], r[4]]);
      expect(rec.shatter ?? 0).toBe(r[10]);
      expect(rec.rank).toBe(s[1]);
      expect(rec.extra ?? 0).toBe(s[2]);
      expect(rec.chances ?? []).toEqual(s[6]);
      expect(rec.durations ?? []).toEqual(s[7]);
      const def = SANCTUARY_KEEPER_ABILITIES[id]!;
      expect(def.power).toBe(r[8]);
      expect(def.hits).toBe(r[9]);
    });
  }

  it('Photon Wings: formula 9 (fixed), neither physical nor magical (flag word 0), never misses; Curse always; Confuse 25, Sleep, Silence, Darkness 50 for three turns', () => {
    const def = SANCTUARY_KEEPER_ABILITIES[ids.SANCTUARY_ROWS.photonWings]!;
    expect([def.formula, def.damageType, def.targeting, def.canMiss]).toEqual(['fixed', 'other', 'all-enemies', false]);
    expect(def.statusEffects.map((e) => [e.status, e.chance])).toEqual([['curse', 254], ['confuse', 25], ['sleep', 50], ['silence', 50], ['darkness', 50]]);
    expect(def.statusEffects.filter((e) => e.duration === 3).map((e) => e.status)).toEqual(['sleep', 'silence', 'darkness']);
    expect(COMMAND_RECORDS_SANCTUARY_KEEPER[ids.SANCTUARY_ROWS.photonWings]!.extra).toBe(0x400); // Curse
  });

  it('Mana Breath: magic, power 48, never misses (rule 5), the 99,999 cap bit', () => {
    const def = SANCTUARY_KEEPER_ABILITIES[ids.SANCTUARY_ROWS.manaBreath]!;
    expect([def.formula, def.damageType, def.power, def.canMiss]).toEqual(['magic', 'magical', 48, false]);
    expect(def.flags).toContain('always-break-damage-limit');
    expect(COMMAND_RECORDS_SANCTUARY_KEEPER[ids.SANCTUARY_ROWS.manaBreath]!.flagsDamage & 0x80).toBe(0x80);
  });

  it('Tail Sweep: strength, power 12, accuracy 100 (formula 2, rolls), Delay Buster, removes Haste', () => {
    const def = SANCTUARY_KEEPER_ABILITIES[ids.SANCTUARY_ROWS.tailSweep]!;
    expect([def.formula, def.damageType, def.power, def.accuracy]).toEqual(['strength', 'physical', 12, 100]);
    expect(def.flags).toContain('strong-delay');
    expect(def.removesStatuses).toEqual(['haste']);
    const rec = COMMAND_RECORDS_SANCTUARY_KEEPER[ids.SANCTUARY_ROWS.tailSweep]!;
    expect(rec.flagsMisc & 0x4000).toBe(0x4000); // Delay Buster
    expect((rec.flagsMisc >>> 3) & 7).toBe(2); // accuracy formula 2
    expect(rec.chances).toEqual([[23, 255]]); // Haste at 255: a cleanse
  });

  it('the Keeper\'s own list names its nine moves (the three, and the six it adds at init)', () => {
    expect(sanctuaryKeeper().abilityIds).toEqual([
      ids.SANCTUARY_ROWS.photonWings, ids.SANCTUARY_ROWS.manaBreath, ids.SANCTUARY_ROWS.tailSweep,
      ids.SANCTUARY_ROWS.curaga, ids.SANCTUARY_ROWS.esuna, ids.SANCTUARY_ROWS.protect, ids.SANCTUARY_ROWS.reflect, ids.SANCTUARY_ROWS.regen, ids.SANCTUARY_ROWS.haste,
    ]);
  });
});

describe('the party: Chapter I\'s preset with the front line this fight asks for', () => {
  it('Tidus, Yuna and Auron in front, the other four on the bench, nothing else changed', () => {
    expect(sanctuaryKeeperBuild.activeSlots).toEqual([...SANCTUARY_KEEPER_FRONT_LINE]);
    expect(sanctuaryKeeperBuild.reserve).toEqual([...SANCTUARY_KEEPER_BENCH]);
    expect([...SANCTUARY_KEEPER_FRONT_LINE, ...SANCTUARY_KEEPER_BENCH].sort()).toEqual(gagazetBuild.members.map((m) => m.id).sort());
    expect(sanctuaryKeeperBuild.members).toEqual(gagazetBuild.members); // no stat, no ability, no gauge added
    expect(sanctuaryKeeperBuild.inventory).toEqual(gagazetBuild.inventory);
    expect(sanctuaryKeeperBuild.gil).toBe(gagazetBuild.gil);
  });

  it('the preset carries every piece of the sourced answer', () => {
    const learned = (id: string): string[] => sanctuaryKeeperBuild.members.find((m) => m.id === id)!.learnedAbilityIds;
    for (const a of ['esuna', 'shell', 'protect', 'reflect', 'dispel', 'curaga']) expect(learned('yuna'), a).toContain(a);
    for (const a of ['haste', 'hastega', 'slow']) expect(learned('tidus'), a).toContain(a);
    for (const a of ['armor-break', 'mental-break']) expect(learned('auron'), a).toContain(a);
    expect(learned('lulu')).toContain('bio');
    const bag = new Map(sanctuaryKeeperBuild.inventory.map((e) => [e.itemId, e.count]));
    for (const i of ['poison-fang', 'holy-water', 'remedy', 'phoenix-down', 'elixir']) expect(bag.get(i) ?? 0, i).toBeGreaterThan(0);
  });

  it('is a copy: the chapter never writes into Chapter I\'s preset', () => {
    expect(sanctuaryKeeperBuild.members).not.toBe(gagazetBuild.members);
    expect(sanctuaryKeeperBuild.members[0]).not.toBe(gagazetBuild.members[0]);
  });
});

describe('the chapter is registered hidden: number 39, unlisted, experiment-class', () => {
  const chapter = getChapter('sanctuary-keeper')!;

  it('is found by id, is an experiment, is FFX, and takes number 39', () => {
    expect(chapter).toBeDefined();
    expect(chapter.game).toBe('ffx');
    expect(chapter.experimental).toBe(true);
    expect(chapter.number).toBe(39);
    expect(chapter.enemyGroupRef).toBe(sanctuaryKeeperGroup);
    expect(chapter.buildRef).toBe(sanctuaryKeeperBuild);
  });

  it('is in the experiment list and on no board list', () => {
    expect(EXPERIMENT_CHAPTERS.some((c) => c.id === 'sanctuary-keeper')).toBe(true);
    expect(CHAPTERS.some((c) => c.id === 'sanctuary-keeper')).toBe(false);
    expect((CHAPTER_IDS as readonly string[]).includes('sanctuary-keeper')).toBe(false);
  });

  it('has its metadata, a scene that is real, and the door word beast', () => {
    expect(UNLISTED_CHAPTER_META.some((m) => m.id === 'sanctuary-keeper')).toBe(true);
    expect(getScene(chapter.sceneKey)?.placeholder).toBe(false);
    const door = CHAPTER_DOORS.find((d) => d.word === BEAST_DOOR_WORD);
    expect(door?.chapter).toBe('sanctuary-keeper');
    expect(BEAST_DOOR_WORD).toBe('beast');
    expect(door?.gate).toBeUndefined(); // not desktop-only: painted 2D
  });

  it('plays Chapter I\'s mountain bed, the stand-in boss cue and the FFX fanfare, all of which exist', () => {
    expect(chapter.music).toEqual({ scene: 'scene-gagazet', battle: 'boss-seymour', victory: 'victory-ffx' });
    expect(sanctuaryKeeperGroup.musicCues).toEqual([{ at: 'start', track: 'boss-seymour', fadeMs: 800 }]);
  });
});
