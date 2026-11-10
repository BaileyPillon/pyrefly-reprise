/**
 * The hidden Oblitzerator chapter's data (FFX only): pinned to the reverse-engineering note (`research/re-ffx-oblitzerator-crane.md`, "RE n") and to the kernel fixtures, field by field; the chapter is registered hidden
 * (number 50, the word `blitz`), unlisted, with its metadata, scene and door; the battle layer's copies of the ids equal the data layer's; the Luca build is the start records moved 3/10 of the way to the Macalania preset.
 */

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import * as battleRules from '../../../src/battle/ffx/ai/oblitzerator-rules.ts';
import { CHAPTERS, CHAPTER_IDS, EXPERIMENT_CHAPTERS, getChapter } from '../../../src/data/encounters.ts';
import { ALL_ABILITIES, ENEMY_GROUPS_BY_ID } from '../../../src/data/ffx/index.ts';
import { COMMAND_RECORDS_OBLITZERATOR, OBLITZERATOR_ABILITIES } from '../../../src/data/ffx/enemies/oblitzerator-abilities.ts';
import { LUCA_CRANE_OVERKILL_THRESHOLD, OBLITZERATOR_DOOM_TURNS, OBLITZERATOR_OVERKILL_THRESHOLD, RECORDS, lucaCrane, oblitzerator, oblitzeratorGroup } from '../../../src/data/ffx/enemies/oblitzerator.ts';
import * as ids from '../../../src/data/ffx/oblitzerator-ids.ts';
import { UNLISTED_CHAPTER_META, getChapterMeta } from '../../../src/data/chapter-meta.ts';
import { getScene } from '../../../src/scenes/index.ts';
import { CHAPTER_DOORS } from '../../../src/app/screens/frontend/chapterDoors.ts';
import { BLITZ_DOOR_CHAPTER, BLITZ_DOOR_WORD } from '../../../src/app/screens/frontend/blitzDoor.ts';
import { LUCA_FRONT_LINE, along, lucaBuild, lucaBuildAt } from '../../../src/data/ffx/builds/luca.ts';
import { START_RECORDS } from '../../../src/data/ffx/builds/mushroom-rock.ts';
import { macalaniaBuild } from '../../../src/data/ffx/builds/macalania.ts';
import { FORCED_ACTION_WORD } from '../../../src/battle/ffx/kernel/forced-action-table.ts';

const fixture = (name: string): { columns: string[]; rows: unknown[][] } => JSON.parse(readFileSync(new URL(`../../fixtures/parity/ffx/${name}.json`, import.meta.url), 'utf8'));
const recordsFixture = fixture('command_records');
const statusFixture = fixture('command_status');
const byId = (f: { rows: unknown[][] }, id: number): unknown[] => f.rows.find((r) => r[0] === id) as unknown[];

describe('the battle layer keeps copies of the ids, and they equal the data layer\'s', () => {
  it('the combatants, the scripts, the rows, the flag keys and the callouts', () => {
    expect(battleRules.OB_ID).toBe(ids.OBLITZERATOR_ID);
    expect(battleRules.OB_CRANE_ID).toBe(ids.LUCA_CRANE_ID);
    expect(battleRules.OB_GROUP_ID).toBe(ids.OBLITZERATOR_GROUP_ID);
    expect(battleRules.OB_SCRIPT).toBe(ids.OBLITZERATOR_SCRIPT);
    expect(battleRules.OB_CRANE_SCRIPT).toBe(ids.LUCA_CRANE_SCRIPT);
    expect(battleRules.OB_ROWS).toEqual(ids.OBLITZERATOR_ROWS);
    expect(battleRules.OB_PHASE_FLAG).toBe(ids.OBLITZERATOR_FLAGS.phase);
    expect(battleRules.OB_ENDED_FLAG).toBe(ids.OBLITZERATOR_FLAGS.ended);
    expect(battleRules.OB_CRANE_FLAG).toBe(ids.OBLITZERATOR_FLAGS.crane);
    expect(battleRules.OB_THUNDERS_FLAG).toBe(ids.OBLITZERATOR_FLAGS.thunders);
    expect(battleRules.OB_POINTED_FLAG).toBe(ids.OBLITZERATOR_FLAGS.pointed);
    expect(battleRules.OB_CALLOUTS).toEqual(ids.OBLITZERATOR_CALLOUTS);
    expect(battleRules.OB_USER_ID).toBe('tidus');
  });
});

describe('the Oblitzerator equals the note (RE 1.1)', () => {
  it('6,000 HP, MP 10, STR 16, DEF 0, MAG 0, MDEF 0, AGI 1, LUCK 0, EVA 0, ACC 10, overkill 600, Doom 3', () => {
    const o = oblitzerator();
    expect(o.stats).toMatchObject({ hp: 6_000, mp: 10, str: 16, def: 0, mag: 0, mdef: 0, agi: 1, luck: 0, eva: 0, acc: 10, maxHp: 6_000, maxMp: 10 });
    expect(RECORDS.oblitzerator).toEqual([6_000, 10, 16, 0, 0, 0, 1, 0, 0, 10]);
    expect(OBLITZERATOR_OVERKILL_THRESHOLD).toBe(600);
    expect(o.doomTurns).toBe(OBLITZERATOR_DOOM_TURNS);
    expect(OBLITZERATOR_DOOM_TURNS).toBe(3);
    expect(o.slot).toBe(0);
  });

  it('weak to Thunder; resists Fire, Ice, Water and Holy; absorbs and is immune to nothing', () => {
    const o = oblitzerator();
    expect(o.affinities).toEqual({ lightning: 'weak', fire: 'resist', ice: 'resist', water: 'resist', holy: 'resist' });
  });

  it('the status bytes: 255 on Death, Zombie, Petrify, Poison, Confuse, Berserk, Provoke, Sleep, Silence, Darkness, Regen, Eject, Auto-Life and Doom; the four Breaks, Shell, Protect, Reflect, the four Nul spells, Haste and Slow land', () => {
    const o = oblitzerator();
    for (const s of ['ko', 'zombie', 'petrify', 'poison', 'confuse', 'berserk', 'provoke', 'sleep', 'silence', 'darkness', 'regen', 'eject', 'auto-life', 'doom'] as const) expect(o.immunities[s], s).toBe(255);
    for (const s of ['power-break', 'magic-break', 'armor-break', 'mental-break', 'shell', 'protect', 'reflect', 'nulblaze', 'nulfrost', 'nulshock', 'nultide', 'haste', 'slow'] as const) expect(o.immunities[s] ?? 0, s).toBe(0);
  });

  it('Threaten\'s byte is 0, a success percentage of 0 in this repository\'s reading (Wendigo\'s is 100): Threaten fails (the note\'s "lands" is corrected there)', () => {
    expect(oblitzerator().threatenChance).toBe(0);
    expect(lucaCrane().threatenChance).toBe(0);
  });

  it('the flag bytes: not Armored; immune to Life and Bribe; not immune to Delay Attack or Delay Buster, Sensor or Scan', () => {
    const o = oblitzerator();
    expect(o.immunityFlags).toEqual(expect.arrayContaining(['boss', 'immune-to-life', 'immune-to-bribe']));
    for (const f of ['armored', 'immune-to-delay', 'immune-to-sensor', 'immune-to-scan', 'immune-to-percentage-damage'] as const) expect(o.immunityFlags, f).not.toContain(f);
  });

  it('rewards: 580 gil, 36 AP (54 on an overkill), an Elixir, steals Potion on both rolls; the gear drop is a named gap', () => {
    const r = oblitzerator().rewards;
    expect([r.gil, r.ap, r.apOverkill, r.overkillThreshold]).toEqual([580, 36, 54, 600]);
    expect(r.drops).toEqual([{ itemId: 'elixir', count: 1 }]);
    expect(r.steal?.common).toEqual({ itemId: 'potion', count: 1 });
    expect(r.steal?.rare).toEqual({ itemId: 'potion', count: 1 });
  });

  it('its commands are its four balls and the Rush (the crane\'s row is the crane\'s)', () => {
    expect(oblitzerator().abilityIds).toEqual([ids.OBLITZERATOR_ROWS.rush, ids.OBLITZERATOR_ROWS.doze, ids.OBLITZERATOR_ROWS.blind, ids.OBLITZERATOR_ROWS.mute]);
  });
});

describe('the crane equals the note (RE 1.2)', () => {
  it('65,535 HP and overkill, every stat 0 but EVA 100 and ACC 20, no loot', () => {
    const c = lucaCrane();
    expect(c.stats).toMatchObject({ hp: 65_535, mp: 0, str: 0, def: 0, mag: 0, mdef: 0, agi: 0, luck: 0, eva: 100, acc: 20, maxHp: 65_535 });
    expect(RECORDS.crane).toEqual([65_535, 0, 0, 0, 0, 0, 0, 0, 100, 20]);
    expect(LUCA_CRANE_OVERKILL_THRESHOLD).toBe(65_535);
    expect(c.rewards).toMatchObject({ ap: 0, apOverkill: 0, gil: 0, drops: [] });
    expect(c.slot).toBe(1);
  });

  it('absorbs Thunder, immune to Fire, Ice, Water and Holy; Armored, immune to fractional damage, Life, Scan, Delay and Bribe; 255 on every status (Threaten 0)', () => {
    const c = lucaCrane();
    expect(c.affinities).toEqual({ lightning: 'absorb', fire: 'immune', ice: 'immune', water: 'immune', holy: 'immune' });
    expect(c.immunityFlags).toEqual(expect.arrayContaining(['armored', 'immune-to-percentage-damage', 'immune-to-life', 'immune-to-scan', 'immune-to-delay', 'immune-to-bribe']));
    for (const s of ['ko', 'zombie', 'petrify', 'poison', 'power-break', 'armor-break', 'confuse', 'berserk', 'provoke', 'sleep', 'silence', 'darkness', 'shell', 'protect', 'reflect', 'regen', 'haste', 'slow', 'scan', 'shield', 'boost', 'eject', 'auto-life', 'doom'] as const) expect(c.immunities[s], s).toBe(255);
  });

  it('it has no commands, a script that never acts, and it is a prop (no HP bar)', () => {
    const c = lucaCrane();
    expect(c.abilityIds).toEqual([]);
    expect(c.aiScriptId).toBe(ids.LUCA_CRANE_SCRIPT);
    expect(c.flags).toEqual({ hideHpBar: true });
  });
});

describe('the formation equals the note (RE 2)', () => {
  it('cdsp02_00: the Oblitzerator, then the crane, in the game\'s actor order 20, 21; Escape and Flee off for everyone; Switch and Summon stay', () => {
    expect(oblitzeratorGroup.enemies.map((e) => [e.id, e.slot])).toEqual([[ids.OBLITZERATOR_ID, 0], [ids.LUCA_CRANE_ID, 1]]);
    expect(oblitzeratorGroup.bossId).toBe(ids.OBLITZERATOR_ID);
    expect(oblitzeratorGroup.canEscape).toBe(false);
    expect(oblitzeratorGroup.commandDisables).toEqual([{ who: 'everyone', command: 0x3003 }, { who: 'everyone', command: 0x3018 }]);
    expect(ENEMY_GROUPS_BY_ID[ids.OBLITZERATOR_GROUP_ID]).toBe(oblitzeratorGroup);
  });

  it('both forced-action words are 0, [unsourced] and unreachable (both records are immune to Berserk, Confuse and Provoke)', () => {
    expect(FORCED_ACTION_WORD.get(ids.OBLITZERATOR_ID)).toBe(0);
    expect(FORCED_ACTION_WORD.get(ids.LUCA_CRANE_ID)).toBe(0);
    for (const e of oblitzeratorGroup.enemies) for (const s of ['berserk', 'confuse', 'provoke'] as const) expect(e.immunities[s], `${e.id} ${s}`).toBe(255);
  });
});

describe('the six rows: the game\'s command records, word for word from the kernel fixtures', () => {
  const GAME_IDS: Record<string, number> = {
    [ids.OBLITZERATOR_ROWS.rush]: 0x600c,
    [ids.OBLITZERATOR_ROWS.doze]: 0x600d,
    [ids.OBLITZERATOR_ROWS.blind]: 0x600e,
    [ids.OBLITZERATOR_ROWS.mute]: 0x600f,
    [ids.OBLITZERATOR_ROWS.lift]: 0x6012,
    [ids.OBLITZERATOR_ROWS.useCrane]: 0x3102,
  };

  it('every row has a record and an ability, in the catalog the game loads', () => {
    expect(Object.keys(COMMAND_RECORDS_OBLITZERATOR).sort()).toEqual(Object.keys(GAME_IDS).sort());
    expect(Object.keys(OBLITZERATOR_ABILITIES).sort()).toEqual(Object.keys(GAME_IDS).sort());
    for (const id of Object.keys(GAME_IDS)) expect(ALL_ABILITIES.find((a) => a.id === id), id).toBeDefined();
  });

  it('each record equals the fixture row: type, flag words, damage class, rank, shatter, status chances and durations, extra word', () => {
    for (const [abilityId, gameId] of Object.entries(GAME_IDS)) {
      const rec = COMMAND_RECORDS_OBLITZERATOR[abilityId]!;
      const r = byId(recordsFixture, gameId);
      const s = byId(statusFixture, gameId);
      expect(rec.id, abilityId).toBe(gameId);
      expect([rec.type, rec.flagsMisc, rec.flagsDamage, rec.damageClass, rec.shatter ?? 0], abilityId).toEqual([r[1], r[2], r[3], r[4], r[10]]);
      expect(rec.rank ?? 0, abilityId).toBe(s[1]);
      expect(rec.extra ?? 0, abilityId).toBe(s[2]);
      expect(rec.chances ?? [], abilityId).toEqual(s[6]);
      expect(rec.durations ?? [], abilityId).toEqual(s[7]);
    }
  });

  it('each ability\'s formula, power and hits are the row\'s: Rush f1 p4 x10 (a random spread: flag bit 15, accuracy formula 0); Doze p7, Blind p10, Mute p7; the Crane f5 p15 (physical)', () => {
    const f = (abilityId: string): { formula: number; power: number; hits: number } => {
      const r = byId(recordsFixture, GAME_IDS[abilityId]!);
      return { formula: r[6] as number, power: r[8] as number, hits: r[9] as number };
    };
    expect(f(ids.OBLITZERATOR_ROWS.rush)).toEqual({ formula: 1, power: 4, hits: 10 });
    expect(OBLITZERATOR_ABILITIES[ids.OBLITZERATOR_ROWS.rush]).toMatchObject({ power: 4, hits: 10, formula: 'strength', targeting: 'random-enemy', canMiss: false });
    expect((COMMAND_RECORDS_OBLITZERATOR[ids.OBLITZERATOR_ROWS.rush]!.flagsMisc & 0x8000) !== 0).toBe(true); // misc bit 15: the random spread
    expect((COMMAND_RECORDS_OBLITZERATOR[ids.OBLITZERATOR_ROWS.rush]!.flagsMisc >> 3) & 7).toBe(0); // accuracy formula 0: it never misses (rule 5)
    expect(f(ids.OBLITZERATOR_ROWS.doze)).toEqual({ formula: 1, power: 7, hits: 1 });
    expect(f(ids.OBLITZERATOR_ROWS.blind)).toEqual({ formula: 1, power: 10, hits: 1 });
    expect(f(ids.OBLITZERATOR_ROWS.mute)).toEqual({ formula: 1, power: 7, hits: 1 });
    expect(f(ids.OBLITZERATOR_ROWS.lift)).toEqual({ formula: 5, power: 15, hits: 1 });
    expect(OBLITZERATOR_ABILITIES[ids.OBLITZERATOR_ROWS.lift]).toMatchObject({ power: 15, formula: 'percent-current', damageType: 'physical', canMiss: false });
    for (const id of Object.keys(OBLITZERATOR_ABILITIES)) if (id !== ids.OBLITZERATOR_ROWS.useCrane) expect(OBLITZERATOR_ABILITIES[id]!.canMiss, id).toBe(false);
  });

  it('the three balls inflict Sleep, Darkness and Silence at chance 254 for duration code 1; the Rush and the Crane inflict nothing', () => {
    expect(OBLITZERATOR_ABILITIES[ids.OBLITZERATOR_ROWS.doze]!.statusEffects).toEqual([{ status: 'sleep', chance: 254, duration: 1 }]);
    expect(OBLITZERATOR_ABILITIES[ids.OBLITZERATOR_ROWS.blind]!.statusEffects).toEqual([{ status: 'darkness', chance: 254, duration: 1 }]);
    expect(OBLITZERATOR_ABILITIES[ids.OBLITZERATOR_ROWS.mute]!.statusEffects).toEqual([{ status: 'silence', chance: 254, duration: 1 }]);
    expect(OBLITZERATOR_ABILITIES[ids.OBLITZERATOR_ROWS.rush]!.statusEffects).toEqual([]);
    expect(OBLITZERATOR_ABILITIES[ids.OBLITZERATOR_ROWS.lift]!.statusEffects).toEqual([]);
  });

  it('Use crane is a trigger on the catalog (label and rank only), 0x3102', () => {
    expect(OBLITZERATOR_ABILITIES[ids.OBLITZERATOR_ROWS.useCrane]).toMatchObject({ name: 'Use crane', category: 'special', extra: { resolvesAsCommandKind: 'trigger', triggerId: 'use-crane' } });
  });
});

describe('the chapter is registered hidden, FFX only, number 50', () => {
  it('getChapter finds it; it is an experiment, in EXPERIMENT_CHAPTERS and in neither CHAPTERS nor CHAPTER_IDS', () => {
    const c = getChapter(ids.OBLITZERATOR_CHAPTER_ID);
    expect(c).toMatchObject({ id: 'oblitzerator', game: 'ffx', number: 50, experimental: true, sceneKey: 'luca-dock' });
    expect(EXPERIMENT_CHAPTERS.map((x) => x.id)).toContain('oblitzerator');
    expect(CHAPTERS.map((x) => x.id as string)).not.toContain('oblitzerator');
    expect((CHAPTER_IDS as readonly string[]).includes('oblitzerator')).toBe(false);
    expect(c?.enemyGroupRef).toBe(oblitzeratorGroup);
    expect(c?.buildRef).toBe(lucaBuild);
    expect(Object.keys(c!.sensorTexts).sort()).toEqual(oblitzeratorGroup.enemies.map((e) => e.id).sort());
  });

  it('every chapter number is distinct (50 is nobody else\'s)', () => {
    const numbers = [...CHAPTERS, ...EXPERIMENT_CHAPTERS].map((c) => c.number).filter((n) => n !== 0);
    expect(new Set(numbers).size).toBe(numbers.length);
  });

  it('its pause metadata is registered with the unlisted ones; the objectives are the Rush survived, the machine under a third and the win', () => {
    const meta = UNLISTED_CHAPTER_META.find((m) => m.id === 'oblitzerator');
    expect(meta).toBeDefined();
    expect(getChapterMeta('oblitzerator')).toBe(meta);
    expect(meta).toMatchObject({ gameLabel: 'FFX', numeral: 'EXP', title: 'The Oblitzerator' });
    expect(meta!.objectives.map((o) => o.rule.kind)).toEqual(['survived-ability', 'boss-hp-below', 'victory']);
  });

  it('its scene is a real registered scene keyed by the chapter\'s scene key, with the machine on slot 0 and the crane on slot 1', () => {
    const entry = getScene(ids.OBLITZERATOR_SCENE);
    expect(entry?.placeholder).toBe(false);
    expect(entry?.slots.enemy).toHaveLength(2);
  });

  it('its door is the word blitz, the row directly after wendigo, not gated', () => {
    expect(BLITZ_DOOR_WORD).toBe('blitz');
    expect(BLITZ_DOOR_CHAPTER).toBe('oblitzerator');
    const row = CHAPTER_DOORS.find((d) => d.word === BLITZ_DOOR_WORD);
    expect(row).toMatchObject({ word: 'blitz', chapter: 'oblitzerator' });
    expect(row?.gate).toBeUndefined();
    // Not `.at(-1)`: the Gullwings and Luca branches appended `dragon` and `debut` behind it (the r80 integration), so the pin is the neighbour it was written beside.
    const at = CHAPTER_DOORS.findIndex((d) => d.word === BLITZ_DOOR_WORD);
    expect(CHAPTER_DOORS[at - 1]?.word).toBe('wendigo');
  });

  it('the music is the coast bed, the ordinary FFX battle cue (a stand-in) and the FFX fanfare', () => {
    expect(getChapter('oblitzerator')?.music).toEqual({ scene: 'scene-gagazet', battle: 'battle-ffx', victory: 'victory-ffx' });
    expect(oblitzeratorGroup.musicCues).toEqual([{ at: 'start', track: 'battle-ffx', fadeMs: 800 }]);
  });
});

describe('the Luca build: the game\'s start records moved 3/10 of the way to the Macalania preset, rounded down (an [estimate]; the raw start records are the lower bound)', () => {
  it('the trio in front, nobody on the bench, no aeon', () => {
    expect([...LUCA_FRONT_LINE]).toEqual(['tidus', 'lulu', 'kimahri']);
    expect(lucaBuild.activeSlots).toEqual(['tidus', 'lulu', 'kimahri']);
    expect(lucaBuild.reserve).toEqual([]);
    expect(lucaBuild.aeons).toEqual([]);
    expect(lucaBuild.members.map((m) => m.id)).toEqual(['tidus', 'lulu', 'kimahri']);
  });

  it('the numbers the note prints: Tidus 709/24/16/10/6/6/13/18/12/12, Lulu 521/125/5/8/24/31/6/17/40/3, Kimahri 810/84/17/15/17/6/7/18/6/6', () => {
    const grid = (id: string): number[] => {
      const s = lucaBuild.members.find((m) => m.id === id)!.stats;
      return [s.hp, s.mp, s.str, s.def, s.mag, s.mdef, s.agi, s.luck, s.eva, s.acc];
    };
    expect(grid('tidus')).toEqual([709, 24, 16, 10, 6, 6, 13, 18, 12, 12]);
    expect(grid('lulu')).toEqual([521, 125, 5, 8, 24, 31, 6, 17, 40, 3]);
    expect(grid('kimahri')).toEqual([810, 84, 17, 15, 17, 6, 7, 18, 6, 6]);
  });

  it('every stat is `along` the start record and the Macalania preset, and stop 0 is the raw start record (the lower bound the bench runs too)', () => {
    for (const m of macalaniaBuild.members.filter((x) => ['tidus', 'lulu', 'kimahri'].includes(x.id))) {
      const start = START_RECORDS[m.id]!;
      const at3 = lucaBuild.members.find((x) => x.id === m.id)!.stats;
      expect(at3.hp).toBe(along(start.hp, m.stats.hp));
      expect(at3.agi).toBe(along(start.agi, m.stats.agi));
      const at0 = lucaBuildAt(0).members.find((x) => x.id === m.id)!.stats;
      expect([at0.hp, at0.mp, at0.str, at0.def, at0.mag, at0.mdef, at0.agi]).toEqual([start.hp, start.mp, start.str, start.def, start.mag, start.mdef, start.agi]);
    }
  });

  it('the kits carry only what the research names (Cheer and Haste; Fire, Blizzard, Thunder, Water; Kimahri nothing) and the bag is Potions, Phoenix Downs, Eye Drops, Echo Screens and Antidotes', () => {
    const learned = (id: string): string[] => lucaBuild.members.find((m) => m.id === id)!.learnedAbilityIds;
    expect(learned('tidus')).toEqual(['cheer', 'haste']);
    expect(learned('lulu')).toEqual(['fire', 'blizzard', 'thunder', 'water']);
    expect(learned('kimahri')).toEqual([]);
    expect(lucaBuild.inventory).toEqual([
      { itemId: 'potion', count: 10 },
      { itemId: 'phoenix-down', count: 2 },
      { itemId: 'eye-drops', count: 3 },
      { itemId: 'echo-screen', count: 3 },
      { itemId: 'antidote', count: 2 },
    ]);
  });

  it('the build is a copy: building it writes nothing into the Macalania preset', () => {
    expect(lucaBuildAt(3).members).not.toBe(macalaniaBuild.members);
    expect(macalaniaBuild.members.find((m) => m.id === 'tidus')!.stats.hp).toBe(1150);
  });
});
