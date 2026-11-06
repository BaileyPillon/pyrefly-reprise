/**
 * The hidden Spherimorph chapter's data (FFX only): pinned to the reverse-engineering note (`research/re-ffx-spherimorph.md`, "RE n") and to the kernel fixtures, field by field; the chapter is registered hidden (number
 * 41, the word `spherimorph`), unlisted, with its metadata, scene and door; the battle layer's copies of the ids equal the data layer's.
 */

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import * as battleRules from '../../../src/battle/ffx/ai/spherimorph-rules.ts';
import { CHAPTERS, CHAPTER_IDS, EXPERIMENT_CHAPTERS, getChapter } from '../../../src/data/encounters.ts';
import { ALL_ABILITIES, ENEMY_GROUPS_BY_ID } from '../../../src/data/ffx/index.ts';
import { COMMAND_RECORDS_SPHERIMORPH, SPHERIMORPH_ABILITIES } from '../../../src/data/ffx/enemies/spherimorph-abilities.ts';
import { RECORDS, SPHERIMORPH_OVERKILL_THRESHOLD, SPHERIMORPH_POISON_PERCENT, spherimorph, spherimorphGroup } from '../../../src/data/ffx/enemies/spherimorph.ts';
import * as ids from '../../../src/data/ffx/spherimorph-ids.ts';
import { UNLISTED_CHAPTER_META } from '../../../src/data/chapter-meta.ts';
import { getScene } from '../../../src/scenes/index.ts';
import { CHAPTER_DOORS } from '../../../src/app/screens/frontend/chapterDoors.ts';
import { SPHERIMORPH_DOOR_WORD } from '../../../src/app/screens/frontend/spherimorphDoor.ts';
import { SPHERIMORPH_AEONS, SPHERIMORPH_BENCH, SPHERIMORPH_FRONT_LINE, spherimorphBuild } from '../../../src/data/ffx/builds/spherimorph.ts';
import { macalaniaBuild } from '../../../src/data/ffx/builds/macalania.ts';
import { SPHERIMORPH_STORY_CALLOUTS } from '../../../src/story/scripts/spherimorph.ts';
import { FORCED_ACTION_WORD } from '../../../src/battle/ffx/kernel/forced-action-table.ts';

const fixture = (name: string): { columns: string[]; rows: unknown[][] } => JSON.parse(readFileSync(new URL(`../../fixtures/parity/ffx/${name}.json`, import.meta.url), 'utf8'));
const recordsFixture = fixture('command_records');
const statusFixture = fixture('command_status');
const byId = (f: { rows: unknown[][] }, id: number): unknown[] => f.rows.find((r) => r[0] === id) as unknown[];

describe('the battle layer keeps copies of the ids, and they equal the data layer\'s', () => {
  it('the combatant, the script, the rows, the flag keys and the banners\' names (also the story layer\'s copy)', () => {
    expect(battleRules.SM_ID).toBe(ids.SPHERIMORPH_ID);
    expect(battleRules.SM_SCRIPT).toBe(ids.SPHERIMORPH_SCRIPT);
    expect(battleRules.SM_ROWS).toEqual(ids.SPHERIMORPH_ROWS);
    expect(battleRules.SM_STATE_FLAG).toBe(ids.SPHERIMORPH_FLAGS.state);
    expect(battleRules.SM_DOUBLECAST_FLAG).toBe(ids.SPHERIMORPH_FLAGS.doublecast);
    expect(battleRules.SM_SHIFTS_FLAG).toBe(ids.SPHERIMORPH_FLAGS.shifts);
    expect(battleRules.SM_HINTS_FLAG).toBe(ids.SPHERIMORPH_FLAGS.hints);
    expect(battleRules.SM_CALLOUT_FIRST).toBe(ids.SPHERIMORPH_CALLOUTS.first);
    expect(battleRules.SM_CALLOUT_SECOND).toBe(ids.SPHERIMORPH_CALLOUTS.second);
    expect(SPHERIMORPH_STORY_CALLOUTS).toEqual(ids.SPHERIMORPH_CALLOUTS);
  });
});

describe('Spherimorph equals the note (RE 1.1 to 1.3)', () => {
  it('12,000 HP, MP 100, STR 20, DEF 100, MAG 20, MDEF 0, AGI 15, LUCK 15, EVA 0, ACC 30, overkill 2,000', () => {
    const s = spherimorph();
    expect(s.stats).toMatchObject({ hp: 12_000, mp: 100, str: 20, def: 100, mag: 20, mdef: 0, agi: 15, luck: 15, eva: 0, acc: 30, maxHp: 12_000, maxMp: 100 });
    expect(RECORDS.spherimorph).toEqual([12_000, 100, 20, 100, 20, 0, 15, 15, 0, 30]);
    expect(SPHERIMORPH_OVERKILL_THRESHOLD).toBe(2_000);
    expect(s.affinities).toEqual({}); // the record writes none: the script writes them at run time (RE 4.1)
    expect(s.zanmatoLevel).toBe(4); // the loot record's byte 3, plus 1
  });

  it('the status bytes: 255 on Death, Petrify, Confuse, Berserk, Provoke, Sleep, Silence, Darkness, Slow, Scan, Eject, Auto-Life; Poison 90; the Breaks and Zombie land; Threaten 25 percent', () => {
    const imm = spherimorph().immunities;
    for (const s of ['ko', 'petrify', 'confuse', 'berserk', 'provoke', 'sleep', 'silence', 'darkness', 'slow', 'scan', 'eject', 'auto-life'] as const) expect(imm[s], s).toBe(255);
    expect(imm['poison']).toBe(90);
    for (const s of ['zombie', 'power-break', 'magic-break', 'armor-break', 'mental-break', 'shell', 'protect', 'reflect', 'regen', 'haste'] as const) expect(imm[s] ?? 0, s).toBe(0);
    expect(spherimorph().threatenChance).toBe(25); // the byte is a success percentage (RE 1.2)
  });

  it('the flag bytes: Armored, immune to Life, Sensor, Scan, CTB damage and Bribe; NOT immune to percentage damage; the Poison byte 5 is 600 a tick', () => {
    const s = spherimorph();
    expect(s.immunityFlags).toEqual(expect.arrayContaining(['boss', 'armored', 'immune-to-life', 'immune-to-delay', 'immune-to-bribe', 'immune-to-sensor', 'immune-to-scan']));
    expect(s.immunityFlags).not.toContain('immune-to-percentage-damage');
    expect(s.poisonTickPercent).toBe(SPHERIMORPH_POISON_PERCENT);
    expect((s.stats.maxHp * SPHERIMORPH_POISON_PERCENT) / 100).toBe(600);
  });

  it('rewards: 4,000 gil, 3,240 AP (4,860 on an overkill), a Lv. 2 Key Sphere, steals Ether (common) or Turbo Ether (rare), one each', () => {
    const r = spherimorph().rewards;
    expect([r.gil, r.ap, r.apOverkill, r.overkillThreshold]).toEqual([4_000, 3_240, 4_860, 2_000]);
    expect(r.drops).toEqual([{ itemId: 'lv-2-key-sphere', count: 1 }]);
    expect(r.steal?.common).toEqual({ itemId: 'ether', count: 1 });
    expect(r.steal?.rare).toEqual({ itemId: 'turbo-ether', count: 1 });
  });

  it('the plain Attack is the game\'s row 0x6000 (accuracy formula 2 on a byte of 90, power 16); the forced action is Attack', () => {
    const plain = spherimorph().plainAttack;
    expect(plain?.record.id).toBe(0x6000);
    expect(plain?.accuracy).toBe(90);
    const row = byId(recordsFixture, 0x6000);
    expect([row[2], row[6], row[7], row[8]]).toEqual([plain?.record.flagsMisc, 1, 90, 16]);
    expect(FORCED_ACTION_WORD.get('spherimorph')).toBe(0x6000);
  });
});

describe('the formation (RE 2)', () => {
  it('one Spherimorph on slot 0; Escape and Flee off for everyone; Switch, Summon and Defend are not touched', () => {
    const g = spherimorphGroup;
    expect(g.enemies.map((e) => e.id)).toEqual([ids.SPHERIMORPH_ID]);
    expect(g.bossId).toBe(ids.SPHERIMORPH_ID);
    expect(g.canEscape).toBe(false);
    expect(g.commandDisables).toEqual([
      { who: 'everyone', command: 0x3003 }, // Escape
      { who: 'everyone', command: 0x3018 }, // Flee
    ]);
    expect(g.frontLineFirstStrike).toBeUndefined(); // Normal start: the formation writes it
  });

  it('is registered in the data layer under its id, with the six rows and the four player-side spells it uses', () => {
    expect(ENEMY_GROUPS_BY_ID[ids.SPHERIMORPH_GROUP_ID]).toBe(spherimorphGroup);
    const abilityIds = ALL_ABILITIES.map((a) => a.id);
    for (const row of [ids.SPHERIMORPH_ROWS.fire, ids.SPHERIMORPH_ROWS.blizzard, ids.SPHERIMORPH_ROWS.thunder, ids.SPHERIMORPH_ROWS.water, ids.SPHERIMORPH_ROWS.shift, ids.SPHERIMORPH_ROWS.press]) expect(abilityIds, row).toContain(row);
    for (const row of [ids.SPHERIMORPH_ROWS.playerFire, ids.SPHERIMORPH_ROWS.playerBlizzard, ids.SPHERIMORPH_ROWS.playerThunder, ids.SPHERIMORPH_ROWS.playerWater]) expect(abilityIds, row).toContain(row);
  });
});

describe('the six move rows equal the kernel fixtures word for word (RE 5)', () => {
  const rows = [
    { id: ids.SPHERIMORPH_ROWS.fire, game: 0x6039 },
    { id: ids.SPHERIMORPH_ROWS.blizzard, game: 0x603a },
    { id: ids.SPHERIMORPH_ROWS.thunder, game: 0x603b },
    { id: ids.SPHERIMORPH_ROWS.water, game: 0x603c },
    { id: ids.SPHERIMORPH_ROWS.press, game: 0x603f },
    { id: ids.SPHERIMORPH_ROWS.shift, game: 0x6036 },
  ] as const;

  for (const { id, game } of rows) {
    it(`${id} is row 0x${game.toString(16)}: type, flag words, damage class, formula, accuracy, power, rank, statuses, element`, () => {
      const rec = COMMAND_RECORDS_SPHERIMORPH[id]!;
      const r = byId(recordsFixture, game) as number[];
      const s = byId(statusFixture, game) as [number, number, number, number, number, number, number[][], number[][]];
      expect(rec.id).toBe(r[0]);
      expect([rec.type, rec.flagsMisc, rec.flagsDamage, rec.damageClass]).toEqual([r[1], r[2], r[3], r[4]]);
      expect(rec.shatter ?? 0).toBe(r[10]);
      expect(rec.rank).toBe(s[1]);
      expect(rec.extra ?? 0).toBe(s[2]);
      expect(rec.chances ?? []).toEqual(s[6]);
      expect(rec.durations ?? []).toEqual(s[7]);
      const def = SPHERIMORPH_ABILITIES[id]!;
      expect(def.power).toBe(r[8]);
      expect(def.hits).toBe(r[9]);
      // the element byte of the record is the ability's element (1 Fire, 2 Ice, 4 Thunder, 8 Water)
      const bits = def.element.reduce((m, e) => m | ({ fire: 1, ice: 2, lightning: 4, water: 8, none: 0 } as Record<string, number>)[e]!, 0);
      expect(bits).toBe(r[11]);
    });
  }

  it('the four spells: formula 3 (magic), power 16, magical, never miss (rule 5), reflectable, one element each, aimed by the script at the front line', () => {
    for (const id of [ids.SPHERIMORPH_ROWS.fire, ids.SPHERIMORPH_ROWS.blizzard, ids.SPHERIMORPH_ROWS.thunder, ids.SPHERIMORPH_ROWS.water]) {
      const def = SPHERIMORPH_ABILITIES[id]!;
      expect([def.formula, def.damageType, def.power, def.canMiss, def.targeting]).toEqual(['magic', 'magical', 16, false, 'all-enemies']);
      expect(def.extra).toEqual({ groupTarget: true });
      expect(COMMAND_RECORDS_SPHERIMORPH[id]!.flagsMisc & 0x80, `${id} is reflectable`).toBe(0x80);
    }
  });

  it('Press: formula 5 (a share of CURRENT HP), power 8 (half), physical, never misses; Elemental Shift: no formula, no power, no hits, aimed at itself', () => {
    const press = SPHERIMORPH_ABILITIES[ids.SPHERIMORPH_ROWS.press]!;
    expect([press.formula, press.damageType, press.power, press.canMiss]).toEqual(['percent-current', 'physical', 8, false]);
    const shift = SPHERIMORPH_ABILITIES[ids.SPHERIMORPH_ROWS.shift]!;
    expect([shift.formula, shift.power, shift.hits, shift.targeting]).toEqual(['none', 0, 0, 'self']);
  });

  it('the four player-side spells it casts are the player\'s own rows (0x3041 to 0x3044), formula 3 power 12, reflectable', () => {
    for (const [id, game, element] of [['blizzard', 0x3041, 'ice'], ['fire', 0x3042, 'fire'], ['thunder', 0x3043, 'lightning'], ['water', 0x3044, 'water']] as const) {
      const def = ALL_ABILITIES.find((a) => a.id === id)!;
      expect(def.record?.id).toBe(game);
      expect([def.formula, def.power, def.element]).toEqual(['magic', 12, [element]]);
      expect(def.flags).toContain('reflectable');
    }
  });

  it('the enemy\'s list names its ten moves (the six, and the four player-side spells)', () => {
    expect(spherimorph().abilityIds).toEqual([
      ids.SPHERIMORPH_ROWS.fire, ids.SPHERIMORPH_ROWS.blizzard, ids.SPHERIMORPH_ROWS.thunder, ids.SPHERIMORPH_ROWS.water, ids.SPHERIMORPH_ROWS.shift, ids.SPHERIMORPH_ROWS.press,
      ids.SPHERIMORPH_ROWS.playerFire, ids.SPHERIMORPH_ROWS.playerBlizzard, ids.SPHERIMORPH_ROWS.playerThunder, ids.SPHERIMORPH_ROWS.playerWater,
    ]);
  });

  it('the state table equals the note\'s: the answers are the opposite element (RE 4.1: 12353, 12354, 12356, 12355 and 24634, 24633, 24636, 24635)', () => {
    const player = [0x3041, 0x3042, 0x3044, 0x3043];
    const monster = [0x603a, 0x6039, 0x603c, 0x603b];
    battleRules.SM_STATES.forEach((s, i) => {
      expect(ALL_ABILITIES.find((a) => a.id === s.physical)!.record!.id, `state ${i} physical`).toBe(player[i]);
      expect(COMMAND_RECORDS_SPHERIMORPH[s.magic]!.id, `state ${i} magic`).toBe(monster[i]);
    });
  });
});

describe('the party: the Macalania preset without Shiva, with the front line this fight asks for', () => {
  it('Tidus, Yuna and Lulu in front, Auron, Wakka, Kimahri and Rikku on the bench', () => {
    expect(spherimorphBuild.activeSlots).toEqual([...SPHERIMORPH_FRONT_LINE]);
    expect(spherimorphBuild.reserve).toEqual([...SPHERIMORPH_BENCH]);
    expect([...SPHERIMORPH_FRONT_LINE, ...SPHERIMORPH_BENCH].sort()).toEqual(macalaniaBuild.members.map((m) => m.id).sort());
  });

  it('three aeons (Valefor, Ifrit, Ixion), no Shiva: the formation holds exactly three aeon entries', () => {
    expect(spherimorphBuild.aeons.map((a) => a.id)).toEqual([...SPHERIMORPH_AEONS]);
    expect(macalaniaBuild.aeons.map((a) => a.id)).toContain('shiva'); // the Temple's preset is untouched
    expect(spherimorphBuild.aeons).toEqual(macalaniaBuild.aeons.filter((a) => a.id !== 'shiva'));
  });

  it('Auron\'s Shooting Star is taken out (defeating Spherimorph unlocks it); everything else is the preset\'s: no stat, no ability, no item, no gauge added', () => {
    const auron = spherimorphBuild.members.find((m) => m.id === 'auron')!;
    const temple = macalaniaBuild.members.find((m) => m.id === 'auron')!;
    expect(auron.overdrive.unlockedOverdriveIds).toEqual(temple.overdrive.unlockedOverdriveIds.filter((o) => o !== 'shooting-star'));
    expect(temple.overdrive.unlockedOverdriveIds).toContain('shooting-star');
    for (const m of spherimorphBuild.members) {
      const t = macalaniaBuild.members.find((x) => x.id === m.id)!;
      expect(m.stats).toEqual(t.stats);
      expect(m.learnedAbilityIds).toEqual(t.learnedAbilityIds);
      expect(m.equipment).toEqual(t.equipment);
    }
    expect(spherimorphBuild.inventory).toEqual(macalaniaBuild.inventory);
    expect(spherimorphBuild.gil).toBe(macalaniaBuild.gil);
  });

  it('the preset carries every piece of the sourced answer', () => {
    const learned = (id: string): string[] => spherimorphBuild.members.find((m) => m.id === id)!.learnedAbilityIds;
    for (const a of ['nulblaze', 'nulfrost', 'nulshock', 'nultide', 'shell', 'protect', 'cura', 'scan']) expect(learned('yuna'), a).toContain(a);
    for (const a of ['fire', 'fira', 'blizzard', 'blizzara', 'thunder', 'thundara', 'water', 'watera', 'focus']) expect(learned('lulu'), a).toContain(a);
    for (const a of ['armor-break', 'magic-break', 'threaten']) expect(learned('auron'), a).toContain(a);
    expect(learned('tidus')).toContain('haste');
  });

  it('is a copy: the chapter never writes into the Temple\'s preset', () => {
    expect(spherimorphBuild.members).not.toBe(macalaniaBuild.members);
    expect(spherimorphBuild.members[0]).not.toBe(macalaniaBuild.members[0]);
  });
});

describe('the chapter is registered hidden: number 41, unlisted, experiment-class', () => {
  const chapter = getChapter('spherimorph')!;

  it('is found by id, is an experiment, is FFX, and takes number 41', () => {
    expect(chapter).toBeDefined();
    expect(chapter.game).toBe('ffx');
    expect(chapter.experimental).toBe(true);
    expect(chapter.number).toBe(41);
    expect(chapter.enemyGroupRef).toBe(spherimorphGroup);
    expect(chapter.buildRef).toBe(spherimorphBuild);
  });

  it('is in the experiment list and on no board list', () => {
    expect(EXPERIMENT_CHAPTERS.some((c) => c.id === 'spherimorph')).toBe(true);
    expect(CHAPTERS.some((c) => c.id === 'spherimorph')).toBe(false);
    expect((CHAPTER_IDS as readonly string[]).includes('spherimorph')).toBe(false);
  });

  it('has its metadata (three objectives), a scene that is real, and the door word spherimorph', () => {
    const meta = UNLISTED_CHAPTER_META.find((m) => m.id === 'spherimorph');
    expect(meta?.objectives).toHaveLength(3);
    expect(getScene(chapter.sceneKey)?.placeholder).toBe(false);
    const door = CHAPTER_DOORS.find((d) => d.word === SPHERIMORPH_DOOR_WORD);
    expect(door?.chapter).toBe('spherimorph');
    expect(SPHERIMORPH_DOOR_WORD).toBe('spherimorph');
    expect(door?.gate).toBeUndefined(); // not desktop-only: painted 2D
  });

  it('plays the Macalania bed, the stand-in boss cue and the FFX fanfare, all of which exist', () => {
    expect(chapter.music).toEqual({ scene: 'scene-macalania-temple', battle: 'boss-challenge', victory: 'victory-ffx' });
    expect(spherimorphGroup.musicCues).toEqual([{ at: 'start', track: 'boss-challenge', fadeMs: 800 }]);
  });
});
