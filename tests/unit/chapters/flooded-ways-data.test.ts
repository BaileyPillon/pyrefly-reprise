/**
 * The hidden Flooded Ways chapter's data (FFX only): pinned to the reverse-engineering note (`research/re-ffx-geosgaeno-evrae-altana.md`, "RE n") and to the kernel fixtures, field by field; the chapter is registered hidden
 * (number 36, the word `geosgaeno`), unlisted, with its metadata, scene and door; the party is the three swimmers; the chain is four links with the right flags.
 */

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { CHAPTERS, CHAPTER_IDS, EXPERIMENT_CHAPTERS, getChapter } from '../../../src/data/encounters.ts';
import { ALL_ABILITIES, ENEMY_GROUPS_BY_ID } from '../../../src/data/ffx/index.ts';
import { COMMAND_RECORDS_FLOODED_WAYS, FLOODED_WAYS_ABILITIES } from '../../../src/data/ffx/enemies/flooded-ways-abilities.ts';
import { ALTANA_OVERKILL, GEOSGAENO_OVERKILL, evraeAltana, gateLock, geosgaeno } from '../../../src/data/ffx/enemies/flooded-ways.ts';
import { FLOODED_GROUPS } from '../../../src/data/ffx/enemies/flooded-ways-groups.ts';
import * as ids from '../../../src/data/ffx/flooded-ways-ids.ts';
import { swimmersBuild } from '../../../src/data/ffx/builds/swimmers.ts';
import { UNLISTED_CHAPTER_META } from '../../../src/data/chapter-meta.ts';
import { getScene } from '../../../src/scenes/index.ts';
import { CHAPTER_DOORS } from '../../../src/app/screens/frontend/chapterDoors.ts';
import { GEOSGAENO_DOOR_WORD } from '../../../src/app/screens/frontend/geosgaenoDoor.ts';

const fixture = (name: string): { columns: string[]; rows: unknown[][] } => JSON.parse(readFileSync(new URL(`../../fixtures/parity/ffx/${name}.json`, import.meta.url), 'utf8'));
const recordsFixture = fixture('command_records');
const statusFixture = fixture('command_status');
const byId = (f: { rows: unknown[][] }, id: number): unknown[] => f.rows.find((r) => r[0] === id) as unknown[];

describe('the monsters equal the note (RE 1.2 and 1.3)', () => {
  it('Geosgaeno (m109): 32,767 HP, MP 128, STR 36, DEF 50, MAG 40, MDEF 50, AGI 48, LUCK 15, EVA 0, ACC 50, overkill 32,767', () => {
    const g = geosgaeno();
    expect(g.stats).toMatchObject({ hp: 32_767, mp: 128, str: 36, def: 50, mag: 40, mdef: 50, agi: 48, luck: 15, eva: 0, acc: 50, maxHp: 32_767, maxMp: 128 });
    expect(GEOSGAENO_OVERKILL).toBe(32_767);
    expect(ids.FLOODED_RECORDS.geosgaeno).toEqual([32_767, 128, 36, 50, 40, 50, 48, 15, 0, 50]);
  });

  it('Geosgaeno is Armored, weak to all five elements, takes Poison (byte 95) at ten percent a tick; Slow and the other statuses are immune; Threaten never lands', () => {
    const g = geosgaeno();
    expect(g.immunityFlags).toEqual(expect.arrayContaining(['armored', 'immune-to-percentage-damage', 'immune-to-life', 'immune-to-delay', 'immune-to-bribe']));
    expect(g.affinities).toEqual({ fire: 'weak', ice: 'weak', lightning: 'weak', water: 'weak', holy: 'weak' });
    expect(g.immunities.poison).toBe(95);
    expect(g.poisonTickPercent).toBe(10);
    for (const s of ['ko', 'zombie', 'petrify', 'power-break', 'magic-break', 'armor-break', 'mental-break', 'confuse', 'berserk', 'provoke', 'sleep', 'silence', 'darkness', 'slow', 'scan', 'eject', 'auto-life', 'doom'] as const) expect(g.immunities[s], s).toBe(255);
    for (const s of ['shell', 'protect', 'reflect', 'regen', 'haste'] as const) expect(g.immunities[s] ?? 0, s).toBe(0);
    expect(g.threatenChance).toBe(0);
  });

  it('Evrae Altana (m120): 16,384 HP, MP 200, STR 32, DEF 0, MAG 27, MDEF 0, AGI 25, LUCK 15, EVA 0, ACC 100, overkill 2,000, weak to Holy only', () => {
    const e = evraeAltana();
    expect(e.stats).toMatchObject({ hp: 16_384, mp: 200, str: 32, def: 0, mag: 27, mdef: 0, agi: 25, luck: 15, eva: 0, acc: 100, maxHp: 16_384, maxMp: 200 });
    expect(ALTANA_OVERKILL).toBe(2_000);
    expect(e.affinities).toEqual({ holy: 'weak' });
    expect(e.immunityFlags).toEqual(expect.arrayContaining(['immune-to-life', 'immune-to-bribe']));
    expect(e.immunityFlags).not.toContain('immune-to-delay'); // CTB damage lands (RE 1.2)
    expect(e.immunityFlags).not.toContain('immune-to-percentage-damage');
  });

  it('Evrae Altana: Death, Petrify, Poison, Confuse, Berserk, Provoke, Sleep, Silence immune; Darkness and Slow at 50; the Breaks, Shell and Haste land; Scan lands; Eject, Auto-Life and Doom are immune', () => {
    const imm = evraeAltana().immunities;
    for (const s of ['ko', 'petrify', 'poison', 'confuse', 'berserk', 'provoke', 'sleep', 'silence', 'eject', 'auto-life', 'doom'] as const) expect(imm[s], s).toBe(255);
    expect(imm.darkness).toBe(50);
    expect(imm.slow).toBe(50);
    for (const s of ['power-break', 'magic-break', 'armor-break', 'mental-break', 'zombie', 'shell', 'protect', 'reflect', 'haste', 'scan'] as const) expect(imm[s] ?? 0, s).toBe(0);
    expect(evraeAltana().threatenChance).toBe(0);
  });

  it('rewards: Geosgaeno 1,000 gil, 4,200 AP (6,300), a Power Sphere, steals a Water Gem (rare two); Evrae Altana 3,000 gil, 5,800 AP (8,700), a Blk Magic Sphere, steals two Water Gems (rare Healing Spring)', () => {
    const g = geosgaeno().rewards;
    expect([g.gil, g.ap, g.apOverkill, g.overkillThreshold]).toEqual([1_000, 4_200, 6_300, 32_767]);
    expect(g.drops).toEqual([{ itemId: 'power-sphere', count: 2 }]);
    expect(g.steal?.common).toEqual({ itemId: 'water-gem', count: 1 });
    expect(g.steal?.rare).toEqual({ itemId: 'water-gem', count: 2 });
    const e = evraeAltana().rewards;
    expect([e.gil, e.ap, e.apOverkill, e.overkillThreshold]).toEqual([3_000, 5_800, 8_700, 2_000]);
    expect(e.drops).toEqual([{ itemId: 'blk-magic-sphere', count: 1 }]);
    expect(e.steal?.common).toEqual({ itemId: 'water-gem', count: 2 });
    expect(e.steal?.rare).toEqual({ itemId: 'healing-spring', count: 1 });
  });

  it('a Gate Lock: 500 HP, MP 1, STR 1, the rest 0; immune to every element, to magic and to every status; no reward; m162 carries the Life immunity and m171 does not', () => {
    const [a, b] = [gateLock(0), gateLock(1)];
    expect(ids.FLOODED_RECORDS.gateLock).toEqual([500, 1, 1, 0, 0, 0, 0, 0, 0, 0]);
    for (const l of [a, b]) {
      expect(l.stats).toMatchObject({ hp: 500, mp: 1, str: 1, def: 0, mag: 0, mdef: 0, agi: 0, maxHp: 500 });
      expect(l.affinities).toEqual({ fire: 'immune', ice: 'immune', lightning: 'immune', water: 'immune', holy: 'immune' });
      expect(l.immunityFlags).toContain('immune-to-magical-damage');
      expect(l.immunityFlags).not.toContain('immune-to-physical-damage'); // an ordinary blade should kill it (RE 4.4, inferred from the flags)
      expect(l.rewards).toEqual({ ap: 0, apOverkill: 0, gil: 0, overkillThreshold: 500, drops: [] });
      expect(l.immunities).toMatchObject({ ko: 255, petrify: 255, poison: 255, sleep: 255, slow: 255, haste: 255, shell: 255, protect: 255 });
      expect(l.flags.untargetable).toBeUndefined(); // "Targetable stays at its default" (RE 4.4)
      expect(l.threatenChance).toBe(0);
    }
    expect(a.immunityFlags).toContain('immune-to-life');
    expect(b.immunityFlags).not.toContain('immune-to-life');
    expect([a.id, b.id]).toEqual([...ids.GATE_LOCK_IDS]);
  });
});

describe('the rows equal the kernel fixtures word for word (RE 5)', () => {
  const rows: Array<[string, number]> = [
    [ids.FLOODED_ROWS.stonePunch, 0x6032],
    [ids.FLOODED_ROWS.koPunch, 0x6033],
    [ids.FLOODED_ROWS.swallow, 0x602e],
    [ids.FLOODED_ROWS.regurgitate, 0x602f],
    [ids.FLOODED_ROWS.altanaAttack, 0x6000],
    [ids.FLOODED_ROWS.stoneGaze, 0x604c],
    [ids.FLOODED_ROWS.photonSpray, 0x604b],
    [ids.FLOODED_ROWS.struggle, 0x3109],
    [ids.FLOODED_ROWS.openLock, 0x312f],
  ];

  it('every row has a record and an ability; the record is the fixture\'s: id, type, flag words, damage class, rank, shatter, the chance bytes and the extra word', () => {
    for (const [name, id] of rows) {
      const rec = COMMAND_RECORDS_FLOODED_WAYS[name]!;
      const r = byId(recordsFixture, id)!; // id type flagsMisc flagsDamage damageClass critBonus formula accuracy power hits shatter element
      const s = byId(statusFixture, id)!; // id rank extra stageMask stageAmount buff chances durations
      expect(rec.id, name).toBe(id);
      expect([rec.type, rec.flagsMisc, rec.flagsDamage, rec.damageClass], name).toEqual([r[1], r[2], r[3], r[4]]);
      expect(rec.rank, name).toBe(s[1]);
      expect(rec.extra ?? 0, name).toBe(s[2]);
      expect(rec.shatter ?? 0, name).toBe(r[10]);
      expect(rec.chances ?? [], name).toEqual(s[6]);
      expect(rec.durations ?? [], name).toEqual(s[7]);
      expect(FLOODED_WAYS_ABILITIES[name], name).toBeDefined();
    }
  });

  it('the ability rows carry the fixture\'s formula, power and hits', () => {
    for (const [name, id] of rows) {
      const a = FLOODED_WAYS_ABILITIES[name]!;
      const r = byId(recordsFixture, id)!;
      const formula: Record<number, string> = { 0: 'none', 1: 'strength', 3: 'magic', 6: 'none', 16: 'user-max-hp' };
      if (id === 0x312f) continue; // a trigger: the catalog row is read for its label and rank only
      expect(a.formula, name).toBe(formula[r[6] as number]);
      expect(a.power, name).toBe(r[8]);
      if (id !== 0x602e) expect(a.hits, name).toBe(r[9]);
    }
  });

  it('Stone Punch and KO Punch roll (accuracy formula 2 on a byte of 100); Evrae Altana\'s Attack rolls on 90; Stone Gaze, Photon Spray and Regurgitate never miss (rule 5); KO Punch carries Curse in its extra word', () => {
    expect(FLOODED_WAYS_ABILITIES[ids.FLOODED_ROWS.stonePunch]!).toMatchObject({ accuracy: 100 });
    expect(FLOODED_WAYS_ABILITIES[ids.FLOODED_ROWS.koPunch]!).toMatchObject({ accuracy: 100 });
    expect(FLOODED_WAYS_ABILITIES[ids.FLOODED_ROWS.altanaAttack]!).toMatchObject({ accuracy: 90 });
    for (const n of [ids.FLOODED_ROWS.stoneGaze, ids.FLOODED_ROWS.photonSpray, ids.FLOODED_ROWS.regurgitate, ids.FLOODED_ROWS.struggle]) expect(FLOODED_WAYS_ABILITIES[n]!.canMiss, n).toBe(false);
    for (const n of [ids.FLOODED_ROWS.stonePunch, ids.FLOODED_ROWS.koPunch, ids.FLOODED_ROWS.altanaAttack]) expect(FLOODED_WAYS_ABILITIES[n]!.canMiss, n).not.toBe(false);
    expect(COMMAND_RECORDS_FLOODED_WAYS[ids.FLOODED_ROWS.koPunch]!.extra).toBe(0x400);
  });

  it('Regurgitate has the 99,999 cap bit (flag word 128); Photon Spray is eight hits on a random member; Stone Gaze Petrify 50 and Sleep 50', () => {
    expect(COMMAND_RECORDS_FLOODED_WAYS[ids.FLOODED_ROWS.regurgitate]!.flagsDamage & 0x80).toBe(0x80);
    expect(FLOODED_WAYS_ABILITIES[ids.FLOODED_ROWS.photonSpray]).toMatchObject({ hits: 8, targeting: 'random-enemy' });
    expect(COMMAND_RECORDS_FLOODED_WAYS[ids.FLOODED_ROWS.stoneGaze]!.chances).toEqual([[2, 50], [12, 50]]);
    expect(COMMAND_RECORDS_FLOODED_WAYS[ids.FLOODED_ROWS.stonePunch]!.chances).toEqual([[2, 50]]);
  });

  it('the twin Photon Spray row (0x606B) is identical to the carried one in every mapped field', () => {
    const [a, b] = [byId(recordsFixture, 0x604b)!, byId(recordsFixture, ids.PHOTON_SPRAY_TWIN)!];
    expect(b.slice(1)).toEqual(a.slice(1));
    expect(byId(statusFixture, ids.PHOTON_SPRAY_TWIN)!.slice(1)).toEqual(byId(statusFixture, 0x604b)!.slice(1));
  });

  it('every row is in the engine\'s catalog and the barrel the data index reads', () => {
    for (const [name] of rows) expect(ALL_ABILITIES.some((a) => a.id === name), name).toBe(true);
  });
});

describe('the formations (RE 2.1 and 2.3) and the chain', () => {
  it('four links in the story\'s order: the three Via Purifico areas, then the Baaj Temple; each group is in the data index', () => {
    expect(ids.FLOODED_LINKS.map((l) => l.key)).toEqual(['area-1', 'area-2', 'area-3', 'geosgaeno']);
    expect(ids.FLOODED_LINKS.map((l) => l.formation)).toEqual(['stbv00_10', 'stbv00_11', 'stbv00_12', 'bjyt02_02']);
    for (const l of ids.FLOODED_LINKS) expect(ENEMY_GROUPS_BY_ID[l.groupId], l.key).toBe(FLOODED_GROUPS[ids.FLOODED_LINKS.indexOf(l)]);
  });

  it('areas 1 and 2 hold Evrae Altana and the two locks (slots 0, 1, 2); area 3 Evrae Altana alone; the Baaj fight Geosgaeno alone', () => {
    const [a1, a2, a3, geo] = FLOODED_GROUPS;
    expect(a1!.enemies.map((e) => e.id)).toEqual([ids.EVRAE_ALTANA_ID, ...ids.GATE_LOCK_IDS]);
    expect(a2!.enemies.map((e) => e.id)).toEqual([ids.EVRAE_ALTANA_ID, ...ids.GATE_LOCK_IDS]);
    expect(a3!.enemies.map((e) => e.id)).toEqual([ids.EVRAE_ALTANA_ID]);
    expect(geo!.enemies.map((e) => e.id)).toEqual([ids.GEOSGAENO_ID]);
    expect(a1!.enemies.map((e) => e.slot)).toEqual([0, 1, 2]);
  });

  it('every formation is a water battle with Escape and Flee off for everyone and Switch off for the three swimmers (and Kimahri at the Baaj Temple)', () => {
    for (const g of FLOODED_GROUPS) {
      expect(g.inWater, g.id).toBe(true);
      expect(g.canEscape, g.id).toBe(false);
      expect(g.commandDisables, g.id).toEqual(expect.arrayContaining([
        { who: 'everyone', command: 0x3003 },
        { who: 'everyone', command: 0x3018 },
        { who: 'tidus', command: 0x3002 },
        { who: 'wakka', command: 0x3002 },
        { who: 'rikku', command: 0x3002 },
      ]));
    }
    expect(FLOODED_GROUPS[3]!.commandDisables).toContainEqual({ who: 'kimahri', command: 0x3002 });
    expect(FLOODED_GROUPS[0]!.commandDisables).not.toContainEqual({ who: 'kimahri', command: 0x3002 });
  });

  it('the chain: area 1 to 2 to 3 to Geosgaeno; areas 2 and 3 carry the boss\'s HP and the shattered and are retry checkpoints; Geosgaeno is a fresh fight, a checkpoint, no card, and pays every link\'s spoils', () => {
    const [a1, a2, a3, geo] = FLOODED_GROUPS;
    expect([a1!.nextGroupId, a2!.nextGroupId, a3!.nextGroupId, geo!.nextGroupId]).toEqual(['flooded-area-2', 'flooded-area-3', 'flooded-geosgaeno', undefined]);
    expect(a1!.carriesBossHp).toBeUndefined();
    for (const g of [a2!, a3!]) expect(g).toMatchObject({ carriesBossHp: true, returnsShattered: true, checkpointOnEntry: true });
    expect(a2!.restoresPartyOnEntry).toBeUndefined(); // the party's HP carries across the areas
    expect(geo).toMatchObject({ restoresPartyOnEntry: true, noSaveSphereCard: true, checkpointOnEntry: true, poolsChainSpoils: true });
    expect(geo!.carriesBossHp).toBeUndefined();
  });

  it('the music is the neutral battle theme for every link, a flagged stand-in', () => {
    for (const g of FLOODED_GROUPS) expect(g.musicCues).toEqual([{ at: 'start', track: 'battle-ffx', fadeMs: 1200 }]);
  });
});

describe('the party: Tidus, Wakka and Rikku, the only three who can swim', () => {
  it('exactly the three, in the slots, no bench, no aeons', () => {
    expect(swimmersBuild.members.map((m) => m.id)).toEqual(['tidus', 'wakka', 'rikku']);
    expect(swimmersBuild.activeSlots).toEqual(['tidus', 'wakka', 'rikku']);
    expect(swimmersBuild.reserve).toEqual([]);
    expect(swimmersBuild.aeons).toEqual([]);
  });

  it('the cells are the Gagazet cells the Highbridge preset copies (Tidus 2,420 HP DEF 20 MDEF 18 AGI 30; Wakka 2,530 / 20 / 16 / 17; Rikku 1,400 / 15 / 15 / 32: the note counts 1,540 with an hp-10 armour that Rikku wears no longer), unchanged', () => {
    const [t, w, r] = swimmersBuild.members;
    expect([t!.stats.maxHp, t!.stats.def, t!.stats.mdef, t!.stats.agi]).toEqual([2_420, 20, 18, 30]);
    expect([w!.stats.maxHp, w!.stats.def, w!.stats.mdef, w!.stats.agi]).toEqual([2_530, 20, 16, 17]);
    expect([r!.stats.maxHp, r!.stats.def, r!.stats.mdef, r!.stats.agi]).toEqual([1_400, 15, 15, 32]);
    expect(r!.stats.maxMp).toBe(130); // Chapter VIII's pinned MP, as Chapter X has it
  });

  it('Rikku wears her Stone Ward from Chapter VIII; Tidus and Wakka have one added next to their hp-10; Talk is gone', () => {
    for (const m of swimmersBuild.members) expect(m.equipment.armor.autoAbilities, m.id).toContain('stone-ward');
    expect(swimmersBuild.members[0]!.equipment.armor.autoAbilities).toContain('hp-10');
    for (const m of swimmersBuild.members) expect(m.learnedAbilityIds, m.id).not.toContain('talk');
  });

  it('the bag: the preflight\'s kit (four gems x10, Poison Fang x5, X-Potion x4) and 30 Phoenix Downs on top of the Highbridge bag', () => {
    const count = (id: string): number => swimmersBuild.inventory.find((e) => e.itemId === id)?.count ?? 0;
    for (const g of ['fire-gem', 'ice-gem', 'lightning-gem', 'water-gem']) expect(count(g), g).toBe(10);
    expect(count('poison-fang')).toBe(5);
    expect(count('x-potion')).toBe(4);
    expect(count('phoenix-down')).toBe(30);
    expect(count('hi-potion')).toBeGreaterThan(0);
  });
});

describe('the chapter is registered, hidden, number 36, behind the word geosgaeno', () => {
  it('an experiment-class chapter: number 36, FFX, hidden, not listed, found by getChapter', () => {
    const c = getChapter('flooded-ways')!;
    expect(c).toMatchObject({ id: 'flooded-ways', game: 'ffx', number: 36, experimental: true });
    expect(EXPERIMENT_CHAPTERS).toContain(c);
    expect(CHAPTERS.map((x) => x.id)).not.toContain('flooded-ways');
    expect([...CHAPTER_IDS]).not.toContain('flooded-ways');
    expect(c.enemyGroupRef).toBe(FLOODED_GROUPS[0]);
    expect(c.buildRef).toBe(swimmersBuild);
    expect(Object.keys(c.sensorTexts ?? {}).sort()).toEqual([ids.EVRAE_ALTANA_ID, ids.GEOSGAENO_ID].sort());
  });

  it('its pause metadata is registered (unlisted), with the chapter\'s own words', () => {
    const meta = UNLISTED_CHAPTER_META.find((m) => m.id === 'flooded-ways')!;
    expect(meta).toMatchObject({ gameLabel: 'FFX', numeral: 'EXP', title: 'The Flooded Ways' });
    expect(meta.musicKeys).toEqual(['scene-gagazet', 'battle-ffx', 'victory-ffx']);
  });

  it('its scene is registered with the Via Purifico\'s party slots and its own enemy staging', () => {
    const slots = getScene(ids.FLOODED_WAYS_SCENE)!.slots;
    expect(slots).toBeDefined();
    expect(slots.party).toHaveLength(3);
    expect(Object.keys(slots.enemySpots ?? {}).sort()).toEqual([ids.EVRAE_ALTANA_ID, ...ids.GATE_LOCK_IDS, ids.GEOSGAENO_ID].sort());
  });

  it('the door: the word geosgaeno opens this chapter', () => {
    expect(GEOSGAENO_DOOR_WORD).toBe('geosgaeno');
    expect(CHAPTER_DOORS.find((d) => d.word === 'geosgaeno')).toMatchObject({ chapter: 'flooded-ways' });
  });
});
