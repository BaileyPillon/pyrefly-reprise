/**
 * The hidden Shinryu chapter's data (FFX only): pinned to the reverse-engineering note (`research/re-ffx-shinryu.md`, "RE n") and to the kernel fixtures, field by field; the chapter is registered hidden (number 48, the word
 * `shinryu`), unlisted, with its metadata, scene and door; the battle layer's copies of the ids equal the data layer's; the party is the Penance preset's three swimmers.
 */

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import * as battleScript from '../../../src/battle/ffx/ai/shinryu.ts';
import { CHAPTERS, CHAPTER_IDS, EXPERIMENT_CHAPTERS, getChapter } from '../../../src/data/encounters.ts';
import { ALL_ABILITIES, ENEMY_GROUPS_BY_ID } from '../../../src/data/ffx/index.ts';
import { COMMAND_RECORDS_SHINRYU, SHINRYU_ABILITIES } from '../../../src/data/ffx/enemies/shinryu-abilities.ts';
import { SHINRYU_DOOM_TURNS, SHINRYU_OVERKILL_THRESHOLD, SHINRYU_RECORD, SHINRYU_ZANMATO_BYTE, shinryu, shinryuGroup } from '../../../src/data/ffx/enemies/shinryu.ts';
import * as ids from '../../../src/data/ffx/shinryu-ids.ts';
import { UNLISTED_CHAPTER_META } from '../../../src/data/chapter-meta.ts';
import { getScene } from '../../../src/scenes/index.ts';
import { backdropFileOf } from '../../../src/data/art/artNamespace.ts';
import { CHAPTER_DOORS } from '../../../src/app/screens/frontend/chapterDoors.ts';
import { SHINRYU_DOOR_WORD } from '../../../src/app/screens/frontend/shinryuDoor.ts';
import { shinryuBuild } from '../../../src/data/ffx/builds/shinryu.ts';
import { penanceBuild } from '../../../src/data/ffx/builds/penance.ts';
import { CELESTIAL_WEAPONS } from '../../../src/data/ffx/builds/celestial-weapons.ts';

const fixture = (name: string): { columns: string[]; rows: unknown[][] } => JSON.parse(readFileSync(new URL(`../../fixtures/parity/ffx/${name}.json`, import.meta.url), 'utf8'));
const recordsFixture = fixture('command_records');
const statusFixture = fixture('command_status');
const byId = (f: { rows: unknown[][] }, id: number): unknown[] => f.rows.find((r) => r[0] === id) as unknown[];

describe('the battle layer keeps copies of the ids, and they equal the data layer\'s', () => {
  it('combatant, script and the three rows', () => {
    expect(battleScript.SHINRYU_ID).toBe(ids.SHINRYU_ID);
    expect(battleScript.SHINRYU_SCRIPT).toBe(ids.SHINRYU_SCRIPT);
    for (const key of Object.keys(ids.SHINRYU_ROWS) as Array<keyof typeof ids.SHINRYU_ROWS>) expect(battleScript.SHINRYU_ROWS[key], key).toBe(ids.SHINRYU_ROWS[key]);
  });

  it('the turn\'s draw is mod 3 (RE 2)', () => {
    expect(battleScript.SHINRYU_ROLL_MODULO).toBe(3);
  });
});

describe('Shinryu equals the note (RE 0)', () => {
  it('2,000,000 HP, MP 72, STR 92, DEF 60, MAG 86, MDEF 98, AGI 70, LUCK 15, EVA 0, ACC 200, overkill 99,999', () => {
    const s = shinryu();
    expect(s.stats).toMatchObject({ hp: 2_000_000, mp: 72, str: 92, def: 60, mag: 86, mdef: 98, agi: 70, luck: 15, eva: 0, acc: 200, maxHp: 2_000_000, maxMp: 72 });
    expect(SHINRYU_RECORD).toEqual([2_000_000, 72, 92, 60, 86, 98, 70, 15, 0, 200]);
    expect(SHINRYU_OVERKILL_THRESHOLD).toBe(99_999);
  });

  it('no element absorbed, immune, resisted or weak', () => {
    expect(shinryu().affinities).toEqual({});
  });

  it('immune (255) to the fifteen status bytes and to Scan, Eject and Auto-Life; NOT to Doom (the word reads 0x301); the buffs land', () => {
    const e = shinryu();
    const fifteen = ['ko', 'zombie', 'petrify', 'poison', 'power-break', 'magic-break', 'armor-break', 'mental-break', 'confuse', 'berserk', 'provoke', 'sleep', 'silence', 'darkness', 'slow', 'scan', 'eject', 'auto-life'] as const;
    for (const s of fifteen) expect(e.immunities[s], s).toBe(255);
    for (const s of ['shell', 'protect', 'reflect', 'regen', 'haste', 'nulblaze', 'nulfrost', 'nulshock', 'nultide', 'doom'] as const) expect(e.immunities[s] ?? 0, s).toBe(0);
    expect(e.doomTurns).toBe(SHINRYU_DOOM_TURNS);
    expect(SHINRYU_DOOM_TURNS).toBe(255);
  });

  it('Threaten: the record\'s byte is 0, a success percentage, so it never lands (the convention every boss has)', () => {
    expect(shinryu().threatenChance).toBe(0);
  });

  it('Zanmato byte 4 (level 5)', () => {
    expect(SHINRYU_ZANMATO_BYTE).toBe(4);
    expect(shinryu().zanmatoLevel).toBe(5);
  });

  it('the flag bytes: immune to percentage damage, Life, Sensor, Scan, CTB damage and Bribe; not Armored, not immune to physical or magical damage', () => {
    const e = shinryu();
    for (const f of ['immune-to-percentage-damage', 'immune-to-life', 'immune-to-sensor', 'immune-to-scan', 'immune-to-delay', 'immune-to-bribe'] as const) expect(e.immunityFlags, f).toContain(f);
    for (const f of ['armored', 'immune-to-physical', 'immune-to-magic', 'immune-to-slice'] as const) expect(e.immunityFlags as readonly string[], f).not.toContain(f);
  });

  it('rewards: 50,000 AP (the same on an Overkill), no gil, Wings to Discovery (rare Dark Matter), steals Gambler\'s Spirit (rare Three Stars)', () => {
    const r = shinryu().rewards;
    expect([r.gil, r.ap, r.apOverkill, r.overkillThreshold]).toEqual([0, 50_000, 50_000, 99_999]);
    expect(r.drops).toEqual([{ itemId: 'wings-to-discovery', count: 1, rare: { itemId: 'dark-matter', count: 1, chance: 12.5 } }]);
    expect(r.steal?.common).toEqual({ itemId: 'gamblers-spirit', count: 1 });
    expect(r.steal?.rare).toEqual({ itemId: 'three-stars', count: 1 });
  });

  it('one form (its death is a death, not a transformation) and no part', () => {
    expect(shinryu().forms).toHaveLength(1);
    expect(shinryu().flags).toEqual({ isBoss: true });
  });

  it('the command list is the note\'s three rows (RE 0): Shining, Eraser and Attack', () => {
    expect(shinryu().abilityIds).toEqual([ids.SHINRYU_ROWS.shining, ids.SHINRYU_ROWS.eraser, ids.SHINRYU_ROWS.attack]);
  });

  it('the painting is the stand-in until `characters/shinryu/` is painted: the key the art lane owes is fixed', () => {
    expect(shinryu().spriteKey).toBe(ids.SHINRYU_STAND_IN);
    expect(ids.SHINRYU_STAND_IN).toBe('evrae');
    expect(ids.SHINRYU_SPRITE).toBe('shinryu');
    expect([...ids.SHINRYU_POSES]).toEqual(['idle', 'attack', 'cast', 'hurt', 'ko']);
  });
});

describe('the formation (RE 0, RE 2): Shinryu alone, a water battle, no Escape', () => {
  it('one enemy on slot 0, in water, Escape and Flee off for everyone and Switch off for the three swimmers', () => {
    const g = shinryuGroup;
    expect(g.enemies.map((e) => e.id)).toEqual([ids.SHINRYU_ID]);
    expect(g.enemies.map((e) => e.slot)).toEqual([0]);
    expect(g.inWater).toBe(true);
    expect(g.canEscape).toBe(false);
    expect(g.bossId).toBe(ids.SHINRYU_ID);
    expect(g.nextGroupId).toBeUndefined();
    expect(g.commandDisables).toEqual([
      { who: 'everyone', command: 0x3003 },
      { who: 'everyone', command: 0x3018 },
      { who: 'tidus', command: 0x3002 },
      { who: 'wakka', command: 0x3002 },
      { who: 'rikku', command: 0x3002 },
    ]);
    expect(ENEMY_GROUPS_BY_ID[g.id]).toBe(g);
  });
});

describe('the three rows equal the kernel fixtures word for word', () => {
  const cases: Array<[string, number]> = [
    [ids.SHINRYU_ROWS.attack, 0x40f0],
    [ids.SHINRYU_ROWS.eraser, 0x40f6],
    [ids.SHINRYU_ROWS.shining, 0x40bf],
  ];
  for (const [rowId, game] of cases) {
    it(`${rowId} is 0x${game.toString(16)}`, () => {
      const rec = COMMAND_RECORDS_SHINRYU[rowId]!;
      const a = byId(recordsFixture, game); // id, type, flagsMisc, flagsDamage, damageClass, critBonus, formula, accuracy, power, hits, shatter, element
      const b = byId(statusFixture, game); // id, rank, extra, stageMask, stageAmount, buff, chances, durations
      expect(rec.id).toBe(game);
      expect([rec.type, rec.flagsMisc, rec.flagsDamage, rec.damageClass]).toEqual([a[1], a[2], a[3], a[4]]);
      expect(rec.rank ?? 0).toBe(b[1]);
      expect(rec.shatter ?? 0).toBe(a[10]);
      expect(rec.extra ?? 0).toBe(b[2]);
      expect([...(rec.chances ?? [])].map((c) => [...c])).toEqual(b[6]);
      expect([...(rec.durations ?? [])].map((c) => [...c])).toEqual(b[7]);
      const ability = SHINRYU_ABILITIES[rowId]!;
      expect(ability.power, 'power').toBe(a[8]);
      expect(ability.hits, 'hits').toBe(a[9]);
      expect(ability.bonusCrit ?? 0, 'critical bonus').toBe(a[5]);
      expect(ALL_ABILITIES.find((x) => x.id === rowId)).toBe(ability);
    });
  }

  it('every row never misses (accuracy formula 0: bits 3 to 5 of the first flag word)', () => {
    for (const [rowId, game] of cases) {
      const a = byId(recordsFixture, game);
      expect(((a[2] as number) >> 3) & 7, `${rowId} accuracy formula`).toBe(0);
      expect(SHINRYU_ABILITIES[rowId]!.canMiss, rowId).toBe(false);
    }
  });

  it('what each does: Attack (physical, formula 1, power 16, one target, crit 10, the 99,999 cap), Eraser (power 0, Petrify at 255, one target), Shining (magical, power 9, eight hits, each on a random member)', () => {
    const a = SHINRYU_ABILITIES;
    expect(a[ids.SHINRYU_ROWS.attack]).toMatchObject({ power: 16, formula: 'strength', damageType: 'physical', targeting: 'single-enemy', hits: 1, bonusCrit: 10 });
    expect(a[ids.SHINRYU_ROWS.attack]!.flags).toContain('always-break-damage-limit');
    expect(a[ids.SHINRYU_ROWS.eraser]).toMatchObject({ power: 0, targeting: 'single-enemy', hits: 1 });
    expect(a[ids.SHINRYU_ROWS.eraser]!.statusEffects).toEqual([{ status: 'petrify', chance: 255, duration: 254 }]);
    expect(a[ids.SHINRYU_ROWS.shining]).toMatchObject({ power: 9, formula: 'magic', damageType: 'magical', targeting: 'random-enemy', hits: 8 });
    expect(a[ids.SHINRYU_ROWS.shining]!.flags).not.toContain('always-break-damage-limit'); // the cap is 9,999 (RE 3)
  });

  it('Shining\'s damage words are the Photon Spray\'s (0x8006 and 0x2), the reading the header of the rows gives for its eight hits', () => {
    const spray = byId(recordsFixture, 0x604b);
    const shining = byId(recordsFixture, 0x40bf);
    expect([shining[2], shining[3], shining[4], shining[8] === 9, shining[9]]).toEqual([spray[2], spray[3], spray[4], true, 8]);
  });
});

describe('the party is the Penance preset\'s three swimmers, member for member', () => {
  it('Tidus, Wakka and Rikku in front, no bench, no aeons; the same build as Penance\'s members', () => {
    expect(shinryuBuild.activeSlots).toEqual(['tidus', 'wakka', 'rikku']);
    expect(shinryuBuild.members.map((m) => m.id)).toEqual(['tidus', 'wakka', 'rikku']);
    expect(shinryuBuild.reserve).toEqual([]);
    expect(shinryuBuild.aeons).toEqual([]);
    for (const m of shinryuBuild.members) expect(m, m.id).toEqual(penanceBuild.members.find((x) => x.id === m.id));
  });

  it('HP 9,999, MP 999, the seven other stats 255 (Luck 85), Auto-Haste, Auto-Protect, Auto-Potion and Defense +20 percent, and the Celestial weapons (Break Damage Limit built in)', () => {
    for (const m of shinryuBuild.members) {
      expect(m.stats, m.id).toMatchObject({ maxHp: 9_999, maxMp: 999, str: 255, def: 255, mag: 255, mdef: 255, agi: 255, luck: 85 });
      expect(m.equipment.armor.autoAbilities, m.id).toEqual(['auto-haste', 'auto-protect', 'auto-potion', 'defense-20']);
      const row = CELESTIAL_WEAPONS[m.id]!;
      expect(m.equipment.weapon.name, m.id).toBe(row.name);
      expect(m.equipment.weapon.weaponRow, m.id).toEqual({ formula: row.formula, power: row.power });
      expect(m.equipment.weapon.autoAbilities, m.id).toContain('break-damage-limit');
    }
    expect(shinryuBuild.members.map((m) => m.equipment.weapon.name)).toEqual(['Caladbolg', 'World Champion', 'Godhand']);
  });

  it('the bag is Penance\'s, with the Phoenix Downs and X-Potions at the item cap', () => {
    const bag = Object.fromEntries(shinryuBuild.inventory.map((e) => [e.itemId, e.count]));
    expect(bag['phoenix-down']).toBe(99);
    expect(bag['x-potion']).toBe(99);
  });
});

describe('the chapter is registered hidden, and reachable by its word', () => {
  const chapter = getChapter('shinryu')!;

  it('number 48, FFX only, experimental; not on the board and not in the listed ids', () => {
    expect(chapter).toBeDefined();
    expect(chapter).toMatchObject({ id: 'shinryu', game: 'ffx', number: 48, experimental: true, sceneKey: 'shinryu' });
    expect(CHAPTERS.map((c) => c.id as string)).not.toContain('shinryu');
    expect((CHAPTER_IDS as readonly string[]).includes('shinryu')).toBe(false);
    expect(EXPERIMENT_CHAPTERS.map((c) => c.id as string)).toContain('shinryu');
  });

  it('is built from its own data: the group, the party, the story and the stand-in music', () => {
    expect(chapter.enemyGroupRef).toBe(shinryuGroup);
    expect(chapter.buildRef).toBe(shinryuBuild);
    expect(chapter.music).toEqual({ scene: 'scene-gagazet', battle: 'boss-challenge', victory: 'victory-ffx' });
    expect(chapter.sensorTexts?.['shinryu']).toBe(shinryu().sensorText);
    expect(shinryuGroup.musicCues?.[0]?.track).toBe(chapter.music.battle);
  });

  it('has its pause metadata, with an approved Via Purifico plate as the fallback until the pause plate is painted', () => {
    const meta = UNLISTED_CHAPTER_META.find((m) => m.id === 'shinryu')!;
    expect(meta).toBeDefined();
    expect(meta).toMatchObject({ gameLabel: 'FFX', numeral: 'EXP', heroArt: 'pause/ch48-shinryu', heroArtFallback: 'backdrops/via-purifico.png' });
    expect(meta.objectives.map((o) => o.rule.kind)).toEqual(['boss-hp-below', 'boss-hp-below', 'victory']);
  });

  it('has a scene on the submerged Via Purifico plate: the scene key names a backdrop, and the slots stage the dragon', () => {
    expect(backdropFileOf('shinryu')).toBe('via-purifico-flooded-3');
    const scene = getScene('shinryu')!;
    expect(scene.key).toBe('shinryu');
    expect(Object.keys(scene.slots.enemySpots ?? {})).toEqual([ids.SHINRYU_ID]);
    expect(scene.slots.party).toHaveLength(3);
  });

  it('its door is the word `shinryu`, last in the table, open on every device', () => {
    const door = CHAPTER_DOORS.find((d) => d.chapter === 'shinryu')!;
    expect(SHINRYU_DOOR_WORD).toBe('shinryu');
    expect(door.word).toBe('shinryu');
    expect(door.gate).toBeUndefined();
    expect(door.secret).toBeUndefined();
  });
});
