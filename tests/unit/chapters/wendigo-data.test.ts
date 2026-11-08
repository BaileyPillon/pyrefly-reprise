/**
 * The hidden Wendigo chapter's data (FFX only): pinned to the reverse-engineering note (`research/re-ffx-wendigo-lake-macalania.md`, "RE n") and to the kernel fixtures, field by field; the chapter is registered hidden
 * (number 49, the word `wendigo`, desktop only), unlisted, with its metadata, scene and door; the battle layer's copies of the ids equal the data layer's. Not the Temple's Guardians (`m141`, Chapter VII): a different record.
 */

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import * as battleRules from '../../../src/battle/ffx/ai/wendigo-rules.ts';
import { CHAPTERS, CHAPTER_IDS, EXPERIMENT_CHAPTERS, getChapter } from '../../../src/data/encounters.ts';
import { ALL_ABILITIES, ENEMY_GROUPS_BY_ID } from '../../../src/data/ffx/index.ts';
import { COMMAND_RECORDS_WENDIGO, WENDIGO_ABILITIES } from '../../../src/data/ffx/enemies/wendigo-abilities.ts';
import { RECORDS, WENDIGO_DOOM_TURNS, WENDIGO_OVERKILL_THRESHOLD, WENDIGO_POISON_PERCENT, lakeGuardian, wendigo, wendigoGroup } from '../../../src/data/ffx/enemies/wendigo.ts';
import * as ids from '../../../src/data/ffx/wendigo-ids.ts';
import { UNLISTED_CHAPTER_META, getChapterMeta } from '../../../src/data/chapter-meta.ts';
import { getScene } from '../../../src/scenes/index.ts';
import { CHAPTER_DOORS } from '../../../src/app/screens/frontend/chapterDoors.ts';
import { WENDIGO_DOOR_CHAPTER, WENDIGO_DOOR_WORD } from '../../../src/app/screens/frontend/wendigoDoor.ts';
import { WENDIGO_BENCH, WENDIGO_FRONT_LINE, wendigoBuild } from '../../../src/data/ffx/builds/wendigo.ts';
import { macalaniaBuild } from '../../../src/data/ffx/builds/macalania.ts';
import { FORCED_ACTION_WORD } from '../../../src/battle/ffx/kernel/forced-action-table.ts';
import { defaultAttackIdOf } from '../../../src/battle/ffx/adapt/command.ts';

const fixture = (name: string): { columns: string[]; rows: unknown[][] } => JSON.parse(readFileSync(new URL(`../../fixtures/parity/ffx/${name}.json`, import.meta.url), 'utf8'));
const recordsFixture = fixture('command_records');
const statusFixture = fixture('command_status');
const byId = (f: { rows: unknown[][] }, id: number): unknown[] => f.rows.find((r) => r[0] === id) as unknown[];

describe('the battle layer keeps copies of the ids, and they equal the data layer\'s', () => {
  it('the combatants, the scripts, the rows and the flag keys', () => {
    expect(battleRules.WD_ID).toBe(ids.WENDIGO_ID);
    expect(battleRules.WD_GUARDIAN_A_ID).toBe(ids.LAKE_GUARDIAN_A_ID);
    expect(battleRules.WD_GUARDIAN_B_ID).toBe(ids.LAKE_GUARDIAN_B_ID);
    expect([...battleRules.WD_GUARDIAN_IDS]).toEqual([...ids.LAKE_GUARDIAN_IDS]);
    expect(battleRules.WD_SCRIPT).toBe(ids.WENDIGO_SCRIPT);
    expect(battleRules.WD_GUARDIAN_SCRIPT).toBe(ids.LAKE_GUARDIAN_SCRIPT);
    expect(battleRules.WD_ROWS).toEqual(ids.WENDIGO_ROWS);
    expect(battleRules.WD_ARMS_FLAG).toBe(ids.WENDIGO_FLAGS.arms);
    expect(battleRules.WD_ARM_TURNS_FLAG).toBe(ids.WENDIGO_FLAGS.armTurns);
    expect(battleRules.WD_CYCLE_FLAG).toBe(ids.WENDIGO_FLAGS.cycle);
  });
});

describe('Wendigo equals the note (RE 1.1 and 1.2)', () => {
  it('18,000 HP, MP 32, STR 40, DEF 0, MAG 0, MDEF 0, AGI 18, LUCK 15, EVA 0, ACC 0, overkill 1,432, Doom 5', () => {
    const w = wendigo();
    expect(w.stats).toMatchObject({ hp: 18_000, mp: 32, str: 40, def: 0, mag: 0, mdef: 0, agi: 18, luck: 15, eva: 0, acc: 0, maxHp: 18_000, maxMp: 32 });
    expect(RECORDS.wendigo).toEqual([18_000, 32, 40, 0, 0, 0, 18, 15, 0, 0]);
    expect(WENDIGO_OVERKILL_THRESHOLD).toBe(1_432);
    expect(w.affinities).toEqual({}); // no element: no weakness at all (the one guide that says "weak to fire" contradicts its own table, RE 7)
    expect(w.doomTurns).toBe(WENDIGO_DOOM_TURNS);
    expect(WENDIGO_DOOM_TURNS).toBe(5);
  });

  it('the status bytes: 255 on Death, Zombie, Petrify, Poison, Confuse, Reflect, Slow, Eject and Auto-Life; Sleep, Silence and Darkness 20; Threaten 100 (a success percentage); the four Breaks, Berserk, Provoke and Doom land', () => {
    const w = wendigo();
    for (const s of ['ko', 'zombie', 'petrify', 'poison', 'confuse', 'reflect', 'slow', 'eject', 'auto-life'] as const) expect(w.immunities[s], s).toBe(255);
    expect([w.immunities['sleep'], w.immunities['silence'], w.immunities['darkness']]).toEqual([20, 20, 20]);
    for (const s of ['power-break', 'magic-break', 'armor-break', 'mental-break', 'berserk', 'provoke', 'doom', 'haste', 'regen', 'shell', 'protect'] as const) expect(w.immunities[s] ?? 0, s).toBe(0);
    expect(w.threatenChance).toBe(100);
  });

  it('the flag bytes: not Armored, not Life- or Sensor-immune, Bribe-immune only', () => {
    const w = wendigo();
    expect(w.immunityFlags).toEqual(expect.arrayContaining(['boss', 'immune-to-bribe']));
    for (const f of ['armored', 'immune-to-life', 'immune-to-sensor', 'immune-to-delay', 'immune-to-percentage-damage', 'immune-to-scan'] as const) expect(w.immunityFlags, f).not.toContain(f);
  });

  it('rewards: 3,000 gil, 2,000 AP (3,000 on an overkill), a Power Sphere, steals Hi-Potion (common) or X-Potion (rare)', () => {
    const r = wendigo().rewards;
    expect([r.gil, r.ap, r.apOverkill, r.overkillThreshold]).toEqual([3_000, 2_000, 3_000, 1_432]);
    expect(r.drops).toEqual([{ itemId: 'power-sphere', count: 1 }]);
    expect(r.steal?.common).toEqual({ itemId: 'hi-potion', count: 1 });
    expect(r.steal?.rare).toEqual({ itemId: 'x-potion', count: 1 });
  });

  it('the plain Attack is the game\'s row 0x4000 (accuracy formula 2 on a byte of 90, power 16, can crit, shatter 10), the forced action of a Berserk or Provoked Wendigo', () => {
    const plain = wendigo().plainAttack;
    expect(plain?.record.id).toBe(0x4000);
    expect(plain?.accuracy).toBe(90);
    const row = byId(recordsFixture, 0x4000);
    expect([row[2], row[3], row[4], row[5], row[10]]).toEqual([plain?.record.flagsMisc, plain?.record.flagsDamage, plain?.record.damageClass, plain?.critBonus, plain?.record.shatter]);
    expect([row[6], row[7], row[8]]).toEqual([1, 90, 16]);
    expect(FORCED_ACTION_WORD.get('wendigo')).toBe(0x4000);
  });
});

describe('the Guado Guardian equals the note (RE 1.3), twice', () => {
  it('1,200 HP, MP 330, STR 1, DEF 0, MAG 14, MDEF 0, AGI 20, LUCK 15; Doom 5; rewards 480 gil, 290 AP (580), an Ability Sphere, steals Hi-Potion or X-Potion', () => {
    for (const [id, slot, suffix] of [[ids.LAKE_GUARDIAN_A_ID, 0, 'A'], [ids.LAKE_GUARDIAN_B_ID, 2, 'B']] as const) {
      const g = lakeGuardian(id, slot, suffix);
      expect(g.stats).toMatchObject({ hp: 1_200, mp: 330, str: 1, def: 0, mag: 14, mdef: 0, agi: 20, luck: 15, eva: 0, acc: 0 });
      expect(g.slot).toBe(slot);
      expect(g.doomTurns).toBe(5);
      expect(g.poisonTickPercent).toBe(WENDIGO_POISON_PERCENT);
      expect([g.rewards.gil, g.rewards.ap, g.rewards.apOverkill]).toEqual([480, 290, 580]);
      expect(g.rewards.drops).toEqual([{ itemId: 'ability-sphere', count: 1 }]);
      expect(g.rewards.steal?.common).toEqual({ itemId: 'hi-potion', count: 1 });
    }
    expect(RECORDS.guardian).toEqual([1_200, 330, 1, 0, 14, 0, 20, 15, 0, 0]);
  });

  it('the status bytes: 255 on Magic Break, Confuse, Berserk, Sleep, Silence, Slow; Threaten 0 (immune); Death, Petrify and Poison 25; the other Breaks, Provoke and Darkness land', () => {
    const g = lakeGuardian(ids.LAKE_GUARDIAN_A_ID, 0, 'A');
    for (const s of ['magic-break', 'confuse', 'berserk', 'sleep', 'silence', 'slow', 'auto-life'] as const) expect(g.immunities[s], s).toBe(255);
    for (const s of ['ko', 'petrify', 'poison'] as const) expect(g.immunities[s], s).toBe(25);
    for (const s of ['power-break', 'armor-break', 'mental-break', 'provoke', 'darkness', 'zombie'] as const) expect(g.immunities[s] ?? 0, s).toBe(0);
    expect(g.threatenChance).toBe(0); // the Temple's Guardians (m141) are Threaten 100; these are not
  });

  it('it is not the Temple\'s Guardian: its own script, its own ids, its own abilities', () => {
    const g = lakeGuardian(ids.LAKE_GUARDIAN_A_ID, 0, 'A');
    expect(g.aiScriptId).toBe('lake-guardian');
    expect(g.id).not.toBe('guado-guardian-a');
    expect(g.abilityIds).toEqual([ids.WENDIGO_ROWS.thundara, ids.WENDIGO_ROWS.blizzara, ids.WENDIGO_ROWS.berserk, ids.WENDIGO_ROWS.autoPotion, ids.WENDIGO_ROWS.eyeDrops, ids.WENDIGO_ROWS.protect, ids.WENDIGO_ROWS.shell]);
    expect(FORCED_ACTION_WORD.get(ids.LAKE_GUARDIAN_A_ID)).toBe(0x3047);
    expect(FORCED_ACTION_WORD.get(ids.LAKE_GUARDIAN_B_ID)).toBe(0x3047);
  });
});

describe('the formation equals the note (RE 2)', () => {
  it('maca02_01: Guardian, Wendigo, Guardian in the game\'s actor order 20, 21, 22; Escape and Flee off for everyone; Switch and Summon stay', () => {
    expect(wendigoGroup.enemies.map((e) => [e.id, e.slot])).toEqual([[ids.LAKE_GUARDIAN_A_ID, 0], [ids.WENDIGO_ID, 1], [ids.LAKE_GUARDIAN_B_ID, 2]]);
    expect(wendigoGroup.bossId).toBe(ids.WENDIGO_ID);
    expect(wendigoGroup.canEscape).toBe(false);
    expect(wendigoGroup.commandDisables).toEqual([{ who: 'everyone', command: 0x3003 }, { who: 'everyone', command: 0x3018 }]);
    expect(ENEMY_GROUPS_BY_ID[ids.WENDIGO_GROUP_ID]).toBe(wendigoGroup);
  });
});

describe('the eight rows: the game\'s command records, word for word from the kernel fixtures', () => {
  const GAME_IDS: Record<string, number> = {
    [ids.WENDIGO_ROWS.punch]: 0x407f,
    [ids.WENDIGO_ROWS.haymaker]: 0x4080,
    [ids.WENDIGO_ROWS.counterPunch]: 0x4062,
    [ids.WENDIGO_ROWS.raiseArms]: 0x403b,
    [ids.WENDIGO_ROWS.lowerArms]: 0x4063,
    [ids.WENDIGO_ROWS.berserk]: 0x400f,
    [ids.WENDIGO_ROWS.autoPotion]: 0x4010,
    [ids.WENDIGO_ROWS.eyeDrops]: 0x200c,
  };

  it('every row has a record and an ability, in the catalog the game loads', () => {
    expect(Object.keys(COMMAND_RECORDS_WENDIGO).sort()).toEqual(Object.keys(GAME_IDS).sort());
    expect(Object.keys(WENDIGO_ABILITIES).sort()).toEqual(Object.keys(GAME_IDS).sort());
    for (const id of Object.keys(GAME_IDS)) expect(ALL_ABILITIES.find((a) => a.id === id), id).toBeDefined();
  });

  it('each record equals the fixture row: type, flag words, damage class, rank, shatter, status chances and durations, extra word', () => {
    for (const [abilityId, gameId] of Object.entries(GAME_IDS)) {
      const rec = COMMAND_RECORDS_WENDIGO[abilityId]!;
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

  it('each ability\'s formula, accuracy and power are the row\'s: Punch f1 p16 acc 120; Double Punch f1 p24 (formula 0 accuracy: never misses); Counter Punch p20 (never misses); Auto-Potion f6 p20', () => {
    const f = (abilityId: string): { formula: number; acc: number; power: number } => {
      const r = byId(recordsFixture, GAME_IDS[abilityId]!);
      return { formula: r[6] as number, acc: r[7] as number, power: r[8] as number };
    };
    expect(f(ids.WENDIGO_ROWS.punch)).toEqual({ formula: 1, acc: 120, power: 16 });
    expect(WENDIGO_ABILITIES[ids.WENDIGO_ROWS.punch]).toMatchObject({ power: 16, accuracy: 120, formula: 'strength', damageType: 'physical' });
    expect(f(ids.WENDIGO_ROWS.haymaker)).toEqual({ formula: 1, acc: 0, power: 24 });
    expect(WENDIGO_ABILITIES[ids.WENDIGO_ROWS.haymaker]).toMatchObject({ power: 24, canMiss: false, formula: 'strength' }); // rule 5: accuracy formula 0 never rolls
    expect(f(ids.WENDIGO_ROWS.counterPunch)).toEqual({ formula: 1, acc: 0, power: 20 });
    expect(WENDIGO_ABILITIES[ids.WENDIGO_ROWS.counterPunch]).toMatchObject({ power: 20, canMiss: false });
    expect(f(ids.WENDIGO_ROWS.autoPotion)).toEqual({ formula: 6, acc: 0, power: 20 });
    expect(WENDIGO_ABILITIES[ids.WENDIGO_ROWS.autoPotion]).toMatchObject({ power: 20, formula: 'fixed-no-variance', canMiss: false });
    expect(WENDIGO_ABILITIES[ids.WENDIGO_ROWS.berserk]!.statusEffects).toEqual([{ status: 'berserk', chance: 120, duration: 254 }]);
  });

  it('the stance is the engine\'s flag (the game\'s property 61): the two arm rows are no-damage rows on itself', () => {
    for (const id of [ids.WENDIGO_ROWS.raiseArms, ids.WENDIGO_ROWS.lowerArms]) {
      expect(WENDIGO_ABILITIES[id]).toMatchObject({ formula: 'none', targeting: 'self', power: 0 });
    }
  });
});

describe('the chapter is registered hidden, FFX only, number 49', () => {
  it('getChapter finds it; it is an experiment, in EXPERIMENT_CHAPTERS and in neither CHAPTERS nor CHAPTER_IDS', () => {
    const c = getChapter(ids.WENDIGO_CHAPTER_ID);
    expect(c).toMatchObject({ id: 'wendigo', game: 'ffx', number: 49, experimental: true, sceneKey: 'wendigo-lake' });
    expect(EXPERIMENT_CHAPTERS.map((x) => x.id)).toContain('wendigo');
    expect(CHAPTERS.map((x) => x.id as string)).not.toContain('wendigo');
    expect((CHAPTER_IDS as readonly string[]).includes('wendigo')).toBe(false);
    expect(c?.enemyGroupRef).toBe(wendigoGroup);
    expect(c?.buildRef).toBe(wendigoBuild);
    expect(Object.keys(c!.sensorTexts).sort()).toEqual(wendigoGroup.enemies.map((e) => e.id).sort());
  });

  it('every chapter number is distinct (49 is nobody else\'s)', () => {
    const numbers = [...CHAPTERS, ...EXPERIMENT_CHAPTERS].map((c) => c.number).filter((n) => n !== 0);
    expect(new Set(numbers).size).toBe(numbers.length);
  });

  it('its pause metadata is registered with the unlisted ones; the objectives name the two Guardians and the win', () => {
    const meta = UNLISTED_CHAPTER_META.find((m) => m.id === 'wendigo');
    expect(meta).toBeDefined();
    expect(getChapterMeta('wendigo')).toBe(meta);
    expect(meta).toMatchObject({ gameLabel: 'FFX', numeral: 'EXP', title: 'Wendigo' });
    expect(meta!.objectives.map((o) => o.rule.kind)).toEqual(['boss-hp-below', 'parts-downed', 'victory']);
  });

  it('its scene is a real registered scene keyed by the chapter\'s scene key', () => {
    const entry = getScene(ids.WENDIGO_SCENE);
    expect(entry?.placeholder).toBe(false);
    expect(entry?.slots.enemy).toHaveLength(3);
  });

  it('its door is the word wendigo, the last row of the table, gated desktop-only like the other 3D chapters', () => {
    expect(WENDIGO_DOOR_WORD).toBe('wendigo');
    expect(WENDIGO_DOOR_CHAPTER).toBe('wendigo');
    const row = CHAPTER_DOORS.find((d) => d.word === WENDIGO_DOOR_WORD);
    expect(row).toMatchObject({ word: 'wendigo', chapter: 'wendigo' });
    expect(typeof row?.gate).toBe('function');
  });

  it('the party is the Macalania preset\'s own front line (Tidus, Yuna, Rikku) with Wakka, Auron, Lulu and Kimahri on the bench, a deep copy of Chapter VII\'s build', () => {
    expect([...WENDIGO_FRONT_LINE]).toEqual(['tidus', 'yuna', 'rikku']);
    expect([...WENDIGO_BENCH]).toEqual(['wakka', 'auron', 'lulu', 'kimahri']);
    expect(wendigoBuild.activeSlots).toEqual([...WENDIGO_FRONT_LINE]);
    expect(wendigoBuild.reserve).toEqual([...WENDIGO_BENCH]);
    expect(wendigoBuild.activeSlots).toEqual(macalaniaBuild.activeSlots);
    expect(wendigoBuild.members).not.toBe(macalaniaBuild.members); // a copy: the chapter never writes into Chapter VII's preset
    expect(wendigoBuild.members).toEqual(macalaniaBuild.members);
    expect(wendigoBuild.aeons.map((a) => a.id)).toEqual(['valefor', 'ifrit', 'ixion', 'shiva']);
    expect(wendigoBuild.inventory.find((i) => i.itemId === 'petrify-grenade')?.count).toBe(4);
  });

  it('the music is the Temple\'s bed, the neutral boss cue (a stand-in) and the FFX fanfare', () => {
    expect(getChapter('wendigo')?.music).toEqual({ scene: 'scene-macalania-temple', battle: 'boss-challenge', victory: 'victory-ffx' });
    expect(wendigoGroup.musicCues).toEqual([{ at: 'start', track: 'boss-challenge', fadeMs: 800 }]);
  });
});

describe('the default-attack rule the Berserk x3/2 reads (shared plumbing, FFX only)', () => {
  it('a monster whose recorded plain Attack is its forced-action word is boosted on that record; every other user keeps the party\'s 0x3000', () => {
    expect(defaultAttackIdOf({ id: 'wendigo', side: 'enemy', enemy: { plainAttack: wendigo().plainAttack } })).toBe(0x4000);
    expect(defaultAttackIdOf({ id: 'tidus', side: 'party' })).toBe(0x3000);
    expect(defaultAttackIdOf({ id: 'lake-guardian-a', side: 'enemy', enemy: {} })).toBe(0x3000); // no recorded plain Attack: the generic one
    expect(defaultAttackIdOf({ id: 'sanctuary-keeper', side: 'enemy', enemy: { plainAttack: wendigo().plainAttack } })).toBe(0x3000); // its forced action is Tail Sweep, not the plain Attack: unchanged
    expect(defaultAttackIdOf({ id: 'biran-ronso', side: 'enemy', enemy: {} })).toBe(0x3000); // Bulldoze is its forced action and it has no recorded plain Attack: unchanged
  });
});
