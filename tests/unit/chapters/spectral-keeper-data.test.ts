/**
 * The hidden Spectral Keeper chapter's data (FFX only): pinned to the reverse-engineering note (`research/re-ffx-spectral-keeper.md`, "RE n") and to the kernel fixtures, field by field; the chapter is registered
 * hidden (number 29, the word `keeper`), unlisted, with its metadata, scene and door; the battle layer's copies of the ids equal the data layer's.
 */

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import * as battleRules from '../../../src/battle/ffx/ai/spectral-keeper-rules.ts';
import { CHAPTERS, CHAPTER_IDS, EXPERIMENT_CHAPTERS, getChapter } from '../../../src/data/encounters.ts';
import { ALL_ABILITIES, ENEMY_GROUPS_BY_ID } from '../../../src/data/ffx/index.ts';
import { SPECTRAL_KEEPER_ABILITIES, COMMAND_RECORDS_SPECTRAL_KEEPER } from '../../../src/data/ffx/enemies/spectral-keeper-abilities.ts';
import { KEEPER_OVERKILL_THRESHOLD, RECORDS, spectralCircle, spectralKeeper, spectralKeeperGroup } from '../../../src/data/ffx/enemies/spectral-keeper.ts';
import * as ids from '../../../src/data/ffx/spectral-keeper-ids.ts';
import { UNLISTED_CHAPTER_META } from '../../../src/data/chapter-meta.ts';
import { getScene } from '../../../src/scenes/index.ts';
import { CHAPTER_DOORS } from '../../../src/app/screens/frontend/chapterDoors.ts';
import { KEEPER_DOOR_WORD } from '../../../src/app/screens/frontend/keeperDoor.ts';
import { zanarkandBuild } from '../../../src/data/ffx/builds/zanarkand.ts';

const fixture = (name: string): { columns: string[]; rows: unknown[][] } => JSON.parse(readFileSync(new URL(`../../fixtures/parity/ffx/${name}.json`, import.meta.url), 'utf8'));
const recordsFixture = fixture('command_records');
const statusFixture = fixture('command_status');
const byId = (f: { rows: unknown[][] }, id: number): unknown[] => f.rows.find((r) => r[0] === id) as unknown[];

describe('the battle layer keeps copies of the ids, and they equal the data layer\'s', () => {
  it('combatants, circles, scripts and rows', () => {
    expect(battleRules.KEEPER_ID).toBe(ids.SPECTRAL_KEEPER_ID);
    expect([...battleRules.CIRCLE_IDS]).toEqual([...ids.SPECTRAL_CIRCLE_IDS]);
    expect(battleRules.KEEPER_SCRIPT).toBe(ids.SPECTRAL_KEEPER_SCRIPT);
    expect(battleRules.CIRCLE_SCRIPT).toBe(ids.SPECTRAL_CIRCLE_SCRIPT);
    expect(battleRules.KEEPER_ROWS).toEqual(ids.SPECTRAL_ROWS);
  });
});

describe('the Keeper and the Circles equal the note (RE 1.2 and 1.3)', () => {
  it('the Keeper: 52,000 HP, MP 500, STR 36, DEF 100, MAG 0, MDEF 100, AGI 36, LUCK 15, EVA 0, ACC 8, overkill 8,000', () => {
    const k = spectralKeeper();
    expect(k.stats).toMatchObject({ hp: 52_000, mp: 500, str: 36, def: 100, mag: 0, mdef: 100, agi: 36, luck: 15, eva: 0, acc: 8, maxHp: 52_000, maxMp: 500 });
    expect(KEEPER_OVERKILL_THRESHOLD).toBe(8_000);
    expect(RECORDS.keeper).toEqual([52_000, 500, 36, 100, 0, 100, 36, 15, 0, 8]);
    expect(k.affinities).toEqual({}); // no element of any kind
  });

  it('immune (255) to Death, Zombie, Petrify, Poison, the three Breaks, Confuse, Berserk, Sleep, Darkness, Slow, Eject, Auto-Life, Doom; Provoke, Mental Break, Silence and Haste land', () => {
    const imm = spectralKeeper().immunities;
    for (const s of ['ko', 'zombie', 'petrify', 'poison', 'power-break', 'magic-break', 'armor-break', 'confuse', 'berserk', 'sleep', 'darkness', 'slow', 'eject', 'auto-life', 'doom'] as const) expect(imm[s], s).toBe(255);
    for (const s of ['provoke', 'mental-break', 'silence', 'haste', 'regen', 'shell', 'protect', 'reflect'] as const) expect(imm[s] ?? 0, s).toBe(0);
    expect(spectralKeeper().threatenChance).toBe(0); // Threaten's byte is a success percentage and it is 0 (RE 1.2)
  });

  it('rewards: 7,000 gil, 12,000 AP (18,000 on an overkill), a Lv. 4 Key Sphere, steals Ether (rare Turbo Ether)', () => {
    const r = spectralKeeper().rewards;
    expect([r.gil, r.ap, r.apOverkill, r.overkillThreshold]).toEqual([7_000, 12_000, 18_000, 8_000]);
    expect(r.drops).toEqual([{ itemId: 'lv-4-key-sphere', count: 1 }]);
    expect(r.steal?.common).toEqual({ itemId: 'ether', count: 1 });
    expect(r.steal?.rare).toEqual({ itemId: 'turbo-ether', count: 1 });
  });

  it('a Circle: 10,000 HP, MP 1, STR 1, the rest 0; never targetable by an ordinary command, no bar, never a random pick; seven of them', () => {
    expect(RECORDS.circle).toEqual([10_000, 1, 1, 0, 0, 0, 0, 0, 0, 0]);
    for (let p = 1; p <= 7; p++) {
      const c = spectralCircle(p);
      expect(c.id).toBe(ids.SPECTRAL_CIRCLE_IDS[p - 1]);
      expect(c.flags).toMatchObject({ untargetable: true, hideHpBar: true, neverRandomTarget: true, partOf: ids.SPECTRAL_KEEPER_ID });
      expect(c.stats.agi).toBe(0); // the script writes 8 after the opening counters (platforms.ts#applyPlatformSetup)
      expect(c.slot).toBe(p);
    }
    expect(() => spectralCircle(8)).toThrow();
  });

  it('the formation: the Keeper on slot 0, then the seven Circles in platform order; Escape, Flee, Guard and Sentinel off for everyone; First Strike; the platform ring', () => {
    const g = spectralKeeperGroup;
    expect(g.enemies.map((e) => e.id)).toEqual([ids.SPECTRAL_KEEPER_ID, ...ids.SPECTRAL_CIRCLE_IDS]);
    expect(g.enemies.length).toBeLessThanOrEqual(8); // the game has eight monster slots
    expect(g.commandDisables).toEqual([
      { who: 'everyone', command: 0x3003 },
      { who: 'everyone', command: 0x3018 },
      { who: 'everyone', command: 0x3022 },
      { who: 'everyone', command: 0x3023 },
    ]);
    expect(g.canEscape).toBe(false);
    expect(g.frontLineFirstStrike).toBe(true);
    expect(g.platformRing).toBe(true);
    expect(ENEMY_GROUPS_BY_ID[g.id]).toBe(g);
  });

  it('the party is Chapter II\'s build, Tidus, Yuna and Auron in front', () => {
    const chapter = getChapter('spectral-keeper')!;
    expect(chapter.buildRef).toBe(zanarkandBuild);
    expect((zanarkandBuild as { activeSlots: string[] }).activeSlots).toEqual(['tidus', 'yuna', 'auron']);
  });
});

describe('the rows equal the kernel fixtures word for word', () => {
  const cases: Array<[string, number]> = [
    ['keeper-berserk-tail', 0x6045],
    ['keeper-attack-all', 0x6047],
    ['keeper-glyph-mine', 0x604d],
    ['keeper-mine-blast', 0x6048],
    ['keeper-mine-fizzle', 0x6049],
    ['keeper-aeon-attack', 0x604e],
    ['move', 0x3103],
  ];
  for (const [rowId, game] of cases) {
    it(`${rowId} is 0x${game.toString(16)}`, () => {
      const rec = COMMAND_RECORDS_SPECTRAL_KEEPER[rowId]!;
      const a = byId(recordsFixture, game); // id, type, flagsMisc, flagsDamage, damageClass, critBonus, formula, accuracy, power, hits, shatter, element
      const b = byId(statusFixture, game); // id, rank, extra, stageMask, stageAmount, buff, chances, durations
      expect(rec.id).toBe(game);
      expect([rec.type, rec.flagsMisc, rec.flagsDamage, rec.damageClass]).toEqual([a[1], a[2], a[3], a[4]]);
      expect(rec.rank ?? 0).toBe(b[1]);
      expect(rec.shatter ?? 0).toBe(a[10]);
      expect(rec.extra ?? 0).toBe(b[2]);
      expect([...(rec.chances ?? [])].map((c) => [...c])).toEqual(b[6]);
      const ability = SPECTRAL_KEEPER_ABILITIES[rowId]!;
      expect(ability.power, 'power').toBe(a[8]);
      expect(ability.hits, 'hits').toBe(a[9]);
      expect(ALL_ABILITIES.find((x) => x.id === rowId)).toBe(ability);
    });
  }

  it('the accuracy: Berserk Tail, the blast and the fizzle never miss (formula 0); Attack All and the aeon Attack roll on bytes of 126 and 100', () => {
    const a = SPECTRAL_KEEPER_ABILITIES;
    expect(a['keeper-berserk-tail']!.canMiss).toBe(false);
    expect(a['keeper-mine-blast']!.canMiss).toBe(false);
    expect(a['keeper-attack-all']!.accuracy).toBe(126);
    expect(a['keeper-aeon-attack']!.accuracy).toBe(100);
    expect(a['keeper-aeon-attack']!.bonusCrit).toBe(10);
    expect(a['keeper-berserk-tail']!.statusEffects).toEqual([{ status: 'berserk', chance: 50, duration: 254 }]);
    expect(a['keeper-mine-blast']!.statusEffects?.[0]).toMatchObject({ status: 'ko', chance: 255 });
  });
});

describe('the chapter is registered hidden, and reachable by its word', () => {
  const chapter = getChapter('spectral-keeper')!;

  it('number 29, FFX only, experimental, derived from nothing else; not on the board', () => {
    expect(chapter).toBeDefined();
    expect(chapter.number).toBe(29);
    expect(chapter.game).toBe('ffx');
    expect(chapter.experimental).toBe(true);
    expect(CHAPTERS.map((c) => c.id)).not.toContain('spectral-keeper');
    expect((CHAPTER_IDS as readonly string[]).includes('spectral-keeper')).toBe(false);
    expect(EXPERIMENT_CHAPTERS.map((c) => c.id)).toContain('spectral-keeper');
    expect(chapter.enemyGroupRef).toBe(spectralKeeperGroup);
    expect(chapter.music.battle).toBe('boss-challenge'); // a flagged stand-in (preflight SK10)
  });

  it('its metadata, scene and door exist', () => {
    expect(UNLISTED_CHAPTER_META.map((m) => m.id)).toContain('spectral-keeper');
    expect(getScene(ids.SPECTRAL_KEEPER_SCENE)?.placeholder).toBe(false);
    expect(chapter.sceneKey).toBe(ids.SPECTRAL_KEEPER_SCENE);
    expect(CHAPTER_DOORS.find((d) => d.word === KEEPER_DOOR_WORD)?.chapter).toBe('spectral-keeper');
  });

  it('the sensor text is the enemy record\'s own', () => {
    expect(chapter.sensorTexts[ids.SPECTRAL_KEEPER_ID]).toBe(spectralKeeper().sensorText);
  });
});
