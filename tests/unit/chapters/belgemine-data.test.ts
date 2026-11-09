/**
 * The hidden Belgemine's Challenge chapter's data (FFX only): pinned to the reverse-engineering note (`research/re-ffx-belgemine-aeon-duels.md`, "RE n") and to the kernel fixtures, field by field; the eight formations as one chain;
 * the chapter hidden (number 45, the word `sidequest`), unlisted, with its metadata, scene and door; the party presets; the encounter's set-up hook; the battle layer's copies of the ids equal the data layer's.
 */

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import * as battle from '../../../src/battle/ffx/ai/belgemine-rules.ts';
import { rtOf } from '../../../src/battle/ffx/state.ts';
import { CHAPTERS, CHAPTER_IDS, EXPERIMENT_CHAPTERS, getChapter } from '../../../src/data/encounters.ts';
import { ALL_ABILITIES, ENEMY_GROUPS_BY_ID } from '../../../src/data/ffx/index.ts';
import { BELGEMINE_ABILITIES, COMMAND_RECORDS_BELGEMINE } from '../../../src/data/ffx/enemies/belgemine-abilities.ts';
import {
  BELGEMINE_COMMAND_DISABLES,
  BELGEMINE_GROUPS,
  DOG_BLOCK,
  REMIEM_BLOCKS,
  belgAnima,
  belgBahamut,
  belgCindy,
  belgDog,
  belgIfrit,
  belgIxion,
  belgMindy,
  belgSandy,
  belgShiva,
  belgValefor,
  belgYojimbo,
  belgemine,
} from '../../../src/data/ffx/enemies/belgemine.ts';
import * as ids from '../../../src/data/ffx/belgemine-ids.ts';
import { AEON_CANONICAL_STATS } from '../../../src/data/ffx/aeons/index.ts';
import { BELGEMINE_AEON_IDS, BELGEMINE_TIER, BELGEMINE_YUNA_GAUGE, belgemineBuild, belgemineBuildOf } from '../../../src/data/ffx/builds/belgemine.ts';
import { UNLISTED_CHAPTER_META } from '../../../src/data/chapter-meta.ts';
import { getScene } from '../../../src/scenes/index.ts';
import { CHAPTER_DOORS } from '../../../src/app/screens/frontend/chapterDoors.ts';
import { SIDEQUEST_DOOR_WORD } from '../../../src/app/screens/frontend/sidequestDoor.ts';
import { liveBattle } from '../helpers/aiScript.ts';

const fixture = (name: string): { columns: string[]; rows: unknown[][] } => JSON.parse(readFileSync(new URL(`../../fixtures/parity/ffx/${name}.json`, import.meta.url), 'utf8'));
const recordsFixture = fixture('command_records');
const statusFixture = fixture('command_status');
const byId = (f: { rows: unknown[][] }, id: number): unknown[] => f.rows.find((r) => r[0] === id) as unknown[];

describe("the battle layer keeps copies of the ids, and they equal the data layer's", () => {
  it('the combatants, the scripts, the rows, the spells, the flag keys and the gauge tag', () => {
    expect(battle.BELGEMINE_ID).toBe(ids.BELGEMINE_ID);
    expect(battle.BELGEMINE_BYSTANDER_SCRIPT).toBe(ids.BELGEMINE_BYSTANDER_SCRIPT);
    expect(battle.BELG_IDS).toEqual(ids.BELG_IDS);
    expect(battle.BELG_SCRIPTS).toEqual(ids.BELG_SCRIPTS);
    expect(battle.BELG_ROWS).toEqual(ids.BELG_ROWS);
    expect(battle.BELG_SPELLS).toEqual(ids.BELG_SPELLS);
    expect(battle.BELG_FLAGS).toEqual(ids.BELG_FLAGS);
    expect(battle.BELG_GAUGE_RULES).toBe(ids.BELG_GAUGE_RULES);
  });

  it('the battle ids of the set-up table are the acts\' (the game\'s own, lmyt01_00 to lmyt01_07)', () => {
    expect(ids.BELG_ACTS.map((a) => a.file)).toEqual(['lmyt01_00', 'lmyt01_01', 'lmyt01_02', 'lmyt01_03', 'lmyt01_04', 'lmyt01_05', 'lmyt01_06', 'lmyt01_07']);
    for (const act of ids.BELG_ACTS) expect(battle.BELG_ACT_SETUP[act.groupId]?.battleId, act.groupId).toBe(act.battleId);
    expect(ids.BELG_ACTS.map((a) => a.battleId)).toEqual([29229056, 29229057, 29229058, 29229059, 29229060, 29229061, 29229062, 29229063]);
  });
});

describe('every row a script queues exists, and the new ones are the game\'s records word for word', () => {
  const abilityIds = new Set(ALL_ABILITIES.map((a) => a.id));

  it('every row, spell and script id the chapter names is in the registry', () => {
    for (const id of Object.values(ids.BELG_ROWS)) expect(abilityIds.has(id), id).toBe(true);
    for (const id of Object.values(ids.BELG_SPELLS)) expect(abilityIds.has(id), id).toBe(true);
  });

  it('the fourteen rows borrowed from Chapter XIV and the Cavern are the same kernel rows the note names', () => {
    const borrowed: Record<string, number> = {
      'pterya-summon': 0x408b, 'grothia-summon': 0x408c, 'spathi-summon': 0x408f, 'yojimbo-summon': 0x4090, 'grothia-attack': 0x4000, 'grothia-attack-yuna': 0x407f, 'pterya-sonic-wings': 0x405d,
      'pterya-energy-ray': 0x403d, 'grothia-hellfire': 0x405e, 'spathi-mega-flare': 0x405f, 'yojimbo-kozuka': 0x4082, 'yojimbo-wakizashi': 0x4083, 'yojimbo-zanmato': 0x4085, 'daigoro-attack': 0x40b1,
    };
    for (const [id, record] of Object.entries(borrowed)) expect(ALL_ABILITIES.find((a) => a.id === id)?.record?.id, id).toBe(record);
    expect(Object.keys(borrowed)).toHaveLength(14);
    // Accuracy: 0x4000 is 90, 0x407F is 120 (RE 4)
    expect(ALL_ABILITIES.find((a) => a.id === 'grothia-attack')?.accuracy).toBe(90);
    expect(ALL_ABILITIES.find((a) => a.id === 'grothia-attack-yuna')?.accuracy).toBe(120);
  });

  it('twenty-one new rows, each with its record, in the registry and the record table', () => {
    expect(Object.keys(BELGEMINE_ABILITIES)).toHaveLength(21);
    expect(Object.keys(COMMAND_RECORDS_BELGEMINE).sort()).toEqual(Object.keys(BELGEMINE_ABILITIES).sort());
    for (const id of Object.keys(BELGEMINE_ABILITIES)) {
      expect(abilityIds.has(id), id).toBe(true);
      expect(ALL_ABILITIES.find((a) => a.id === id)?.record, id).toBeDefined();
    }
  });

  it('each new record equals the kernel fixtures: type, both flag words, damage class, rank, shatter, extra word, chances and durations', () => {
    for (const [id, record] of Object.entries(COMMAND_RECORDS_BELGEMINE)) {
      const r = byId(recordsFixture, record.id) as number[];
      const s = byId(statusFixture, record.id) as unknown[];
      expect(r, id).toBeDefined();
      expect([record.type, record.flagsMisc, record.flagsDamage, record.damageClass], id).toEqual([r[1], r[2], r[3], r[4]]);
      expect(record.shatter ?? 0, id).toBe(r[10]);
      expect(record.rank, id).toBe(s[1]);
      expect(record.extra ?? 0, id).toBe(s[2]);
      expect(JSON.stringify(record.chances ?? []), id).toBe(JSON.stringify(s[6]));
      expect(JSON.stringify(record.durations ?? []), id).toBe(JSON.stringify(s[7]));
    }
  });

  it('the numbers the new rows carry equal the game\'s: formula, power, hits, element, accuracy and crit bonus', () => {
    const FORMULA: Record<string, number> = { strength: 1, magic: 3, 'percent-current': 5, 'special-magic': 15, none: 0 };
    const ELEMENT: Record<string, number> = { none: 0, fire: 1, ice: 2, lightning: 4, water: 8 };
    for (const a of Object.values(BELGEMINE_ABILITIES)) {
      const r = byId(recordsFixture, COMMAND_RECORDS_BELGEMINE[a.id]!.id) as number[];
      if (a.formula === 'none') continue; // summons, the dog's order and Mighty Guard: formula byte 0 or 3 with power 0 (a status row)
      expect(FORMULA[a.formula], a.id).toBe(r[6]);
      expect(a.power, a.id).toBe(r[8]);
      expect(a.hits, a.id).toBe(r[9]);
      expect(ELEMENT[a.element[0]!], a.id).toBe(r[11]);
      if (a.accuracy !== undefined) expect(a.accuracy, a.id).toBe(r[7]);
      expect(a.bonusCrit ?? 0, a.id).toBe(r[5]);
    }
  });

  it('the multi-hit rows: Oblivion 16 hits, Passado 15, Delta Attack 6; Anima\'s Attack is the one row that rolls to hit', () => {
    expect([BELGEMINE_ABILITIES['belg-oblivion']!.hits, BELGEMINE_ABILITIES['belg-passado']!.hits, BELGEMINE_ABILITIES['belg-delta-attack']!.hits]).toEqual([16, 15, 6]);
    const rolling = Object.values(BELGEMINE_ABILITIES).filter((a) => a.canMiss !== false);
    expect(rolling.map((a) => a.id)).toEqual(['belg-anima-attack']);
  });
});

describe('the bodies equal the note (RE 0, the stat block each script writes at the start)', () => {
  const bodies = [belgValefor(), belgIfrit(), belgIxion(), belgShiva(), belgBahamut(), belgYojimbo(), belgAnima(), belgMindy(), belgSandy(), belgCindy()];

  it('HP, MP, STR, DEF, MAG, MDF, AGI, EVA, ACC of each of the ten', () => {
    const NOTE: Record<string, readonly number[]> = {
      valefor: [20_000, 500, 35, 85, 48, 0, 17, 0, 0], ifrit: [28_000, 800, 29, 40, 45, 40, 18, 10, 15], ixion: [30_000, 720, 40, 40, 50, 40, 12, 10, 15], shiva: [20_000, 950, 25, 0, 31, 0, 22, 50, 15],
      bahamut: [35_000, 1_500, 32, 0, 47, 0, 18, 0, 15], yojimbo: [32_000, 1_200, 30, 0, 45, 0, 25, 50, 15], anima: [54_000, 3_000, 38, 0, 60, 0, 15, 0, 0], mindy: [20_000, 7_000, 21, 0, 28, 0, 20, 0, 0],
      sandy: [35_000, 3_000, 35, 0, 18, 0, 24, 0, 0], cindy: [48_000, 8_000, 48, 0, 38, 0, 15, 0, 0],
    };
    expect(REMIEM_BLOCKS).toEqual(NOTE);
    bodies.forEach((b, i) => {
      const key = Object.keys(NOTE)[i]!;
      const n = NOTE[key]!;
      expect([b.stats.hp, b.stats.mp, b.stats.str, b.stats.def, b.stats.mag, b.stats.mdef, b.stats.agi, b.stats.eva, b.stats.acc], key).toEqual(n);
      expect([b.stats.maxHp, b.stats.maxMp, b.stats.luck], key).toEqual([n[0], n[1], 15]);
      expect(b.hp, key).toBe(n[0]);
    });
  });

  it('immune (255) to Death, Zombie, Petrify, Poison, the four Breaks, Confuse, Berserk, Provoke, Sleep, Silence, Darkness, Slow, Scan, Eject and Auto-Life; Threaten and the buffs land (Threaten: success percent 0)', () => {
    for (const b of bodies) {
      for (const s of ['ko', 'zombie', 'petrify', 'poison', 'power-break', 'magic-break', 'armor-break', 'mental-break', 'confuse', 'berserk', 'provoke', 'sleep', 'silence', 'darkness', 'slow', 'scan', 'eject', 'auto-life'] as const) expect(b.immunities[s], `${b.id} ${s}`).toBe(255);
      for (const s of ['shell', 'protect', 'regen', 'haste', 'doom'] as const) expect(b.immunities[s] ?? 0, `${b.id} ${s}`).toBe(0);
      expect(b.threatenChance, b.id).toBe(0);
    }
  });

  it('Ixion\'s record also carries Reflect 255; the elements: Ifrit absorbs Fire, Ixion Thunder, Shiva Ice; the rest none', () => {
    expect(belgIxion().immunities['reflect']).toBe(255);
    expect(belgIfrit().immunities['reflect'] ?? 0).toBe(0);
    expect(belgIfrit().affinities).toEqual({ fire: 'absorb' });
    expect(belgIxion().affinities).toEqual({ lightning: 'absorb' });
    expect(belgShiva().affinities).toEqual({ ice: 'absorb' });
    for (const b of [belgValefor(), belgBahamut(), belgYojimbo(), belgAnima(), belgMindy(), belgSandy(), belgCindy()]) expect(b.affinities, b.id).toEqual({});
  });

  it('the flag bytes: percentage damage (Demi, Gravity) is immune on the aeons and NOT on the Sisters; Sensor, Scan, Delay and Bribe are immune on all ten', () => {
    for (const b of bodies) {
      expect(b.immunityFlags, b.id).toEqual(expect.arrayContaining(['immune-to-delay', 'immune-to-bribe', 'immune-to-scan', 'immune-to-sensor']));
      const sister = ['belg-mindy', 'belg-sandy', 'belg-cindy'].includes(b.id);
      expect(b.immunityFlags.includes('immune-to-percentage-damage'), b.id).toBe(!sister);
    }
  });

  it('no gil, no AP, no drops (RE 0: every reward is the script\'s, not modelled); every body is a boss', () => {
    for (const b of [...bodies, belgemine(), belgDog()]) {
      expect([b.rewards.gil, b.rewards.ap, b.rewards.apOverkill, b.rewards.drops.length], b.id).toEqual([0, 0, 0, 0]);
    }
    for (const b of bodies) expect(b.flags.isBoss, b.id).toBe(true);
  });

  it('Belgemine and the dog are untargetable bystanders with no HP bar; the dog is the record\'s (HP 1, STR 25)', () => {
    for (const b of [belgemine(), belgDog()]) expect(b.flags).toMatchObject({ untargetable: true, hideHpBar: true });
    expect(DOG_BLOCK).toEqual([1, 1, 25, 0, 0, 0, 0, 0, 0]);
    expect(belgDog().stats).toMatchObject({ hp: 1, str: 25 });
    expect(belgemine().stats.hp).toBe(10);
    expect(belgemine().aiScriptId).toBe(ids.BELGEMINE_BYSTANDER_SCRIPT);
  });

  it('every ability a body lists exists (the rows and the player\'s own spells)', () => {
    const known = new Set(ALL_ABILITIES.map((a) => a.id));
    for (const b of [...bodies, belgDog()]) for (const id of b.abilityIds) expect(known.has(id), `${b.id} ${id}`).toBe(true);
  });
});

describe('the eight formations are one chain of aeon duels', () => {
  it('eight groups in the game\'s order, each in the registry, each naming the next', () => {
    expect(BELGEMINE_GROUPS.map((g) => g.id)).toEqual(ids.BELG_ACTS.map((a) => a.groupId));
    BELGEMINE_GROUPS.forEach((g, i) => {
      expect(ENEMY_GROUPS_BY_ID[g.id], g.id).toBeDefined();
      expect(g.nextGroupId, g.id).toBe(ids.BELG_ACTS[i + 1]?.groupId);
      expect(g.game).toBe('ffx');
    });
  });

  it('each act: Belgemine first, then the aeon (the dog after Yojimbo, the three Sisters last), the aeon the headline', () => {
    const shape = BELGEMINE_GROUPS.map((g) => g.enemies.map((e) => e.id));
    expect(shape).toEqual([
      ['belgemine', 'belg-valefor'], ['belgemine', 'belg-ifrit'], ['belgemine', 'belg-ixion'], ['belgemine', 'belg-shiva'], ['belgemine', 'belg-bahamut'], ['belgemine', 'belg-yojimbo', 'belg-daigoro'],
      ['belgemine', 'belg-anima'], ['belgemine', 'belg-mindy', 'belg-sandy', 'belg-cindy'],
    ]);
    expect(BELGEMINE_GROUPS.map((g) => g.headline)).toEqual(['Valefor', 'Ifrit', 'Ixion', 'Shiva', 'Bahamut', 'Yojimbo', 'Anima', 'The Magus Sisters']);
    for (const g of BELGEMINE_GROUPS) expect(g.bossId && g.enemies.some((e) => e.id === g.bossId), g.id).toBe(true);
  });

  it('aeons only, the estimated command-disable list (not from the Remiem files, which are camera only), no Defend-off, no escape, the Cavern plate, the stand-in cue', () => {
    for (const g of BELGEMINE_GROUPS) {
      expect(g.aeonsOnly, g.id).toBe(true);
      expect(g.defendOff, g.id).toBeUndefined();
      expect(g.canEscape, g.id).toBe(false);
      expect(g.commandDisables, g.id).toEqual(BELGEMINE_COMMAND_DISABLES);
      expect(g.plate, g.id).toBe(ids.BELG_PLATE);
      expect(g.musicCues, g.id).toEqual([{ at: 'start', track: 'boss-isaaru', fadeMs: 1200 }]);
    }
    // Switch for everyone, and Yuna's Attack, Item, Weapon, Armor, Skill, Special, Black Magic and White Magic (an estimate by the Isaaru contest's pattern)
    expect(BELGEMINE_COMMAND_DISABLES.map((d) => `${d.who}:${d.command.toString(16)}`)).toEqual([
      'everyone:3002', 'yuna:3000', 'yuna:3001', 'yuna:3004', 'yuna:3005', 'yuna:3113', 'yuna:3114', 'yuna:3115', 'yuna:3116',
    ]);
  });

  it('the mirror lock: Yuna cannot call the aeon the enemy holds (all three Sisters in the last act)', () => {
    const locks = BELGEMINE_GROUPS.map((g) => (g.lockedAeons ?? []).map((l) => `${l.aeonId}>${l.mirrorOf}`));
    expect(locks).toEqual([
      ['valefor>belg-valefor'], ['ifrit>belg-ifrit'], ['ixion>belg-ixion'], ['shiva>belg-shiva'], ['bahamut>belg-bahamut'], ['yojimbo>belg-yojimbo'], ['anima>belg-anima'],
      ['cindy>belg-cindy', 'sandy>belg-sandy', 'mindy>belg-mindy'],
    ]);
  });

  it('every act from the second on is a retry checkpoint and a fresh fight (Yuna and the aeons whole, no Save Sphere card); the first is neither', () => {
    BELGEMINE_GROUPS.forEach((g, i) => {
      if (i === 0) expect([g.checkpointOnEntry, g.restoresPartyOnEntry, g.restoresAeonsOnEntry, g.noSaveSphereCard]).toEqual([undefined, undefined, undefined, undefined]);
      else expect([g.checkpointOnEntry, g.restoresPartyOnEntry, g.restoresAeonsOnEntry, g.noSaveSphereCard], g.id).toEqual([true, true, true, true]);
    });
  });
});

describe('the chapter: hidden, number 45, FFX only, its word `sidequest`', () => {
  const chapter = getChapter('belgemine')!;

  it('is an experiment-class chapter with no card: in the experiments\' list, in neither CHAPTERS nor CHAPTER_IDS', () => {
    expect(chapter).toMatchObject({ id: 'belgemine', game: 'ffx', number: 45, experimental: true, title: "Belgemine's Challenge", location: 'Remiem Temple', sceneKey: 'belgemine' });
    expect(EXPERIMENT_CHAPTERS.map((c) => c.id)).toContain('belgemine');
    expect(CHAPTERS.map((c) => c.id as string)).not.toContain('belgemine');
    expect((CHAPTER_IDS as readonly string[]).includes('belgemine')).toBe(false);
    expect(chapter.enemyGroupRef.id).toBe('belgemine-1-valefor');
    expect(chapter.buildRef).toBe(belgemineBuild);
    expect(chapter.music).toEqual({ scene: 'scene-macalania-temple', battle: 'boss-isaaru', victory: 'victory-ffx' });
    expect(chapter.sensorTexts).toEqual({});
  });

  it('has its pause metadata: three objectives answered by rules the screen already knows, FFX, EXP', () => {
    const meta = UNLISTED_CHAPTER_META.find((m) => m.id === 'belgemine')!;
    expect(meta).toMatchObject({ id: 'belgemine', gameLabel: 'FFX', numeral: 'EXP', focalCharacterId: 'yuna' });
    expect(meta.objectives.map((o) => o.rule.kind)).toEqual(['parts-downed', 'link-reached', 'victory']);
    expect(meta.musicKeys).toEqual(['scene-macalania-temple', 'boss-isaaru', 'victory-ffx']);
    for (const s of [meta.title, meta.subtitle, meta.blurb, meta.tip]) expect(s, 'no stray number or markup in the pause words').not.toMatch(/\d{3,}|[<>{}]/);
  });

  it('its door is the typed word `sidequest` and opens this chapter', () => {
    expect(SIDEQUEST_DOOR_WORD).toBe('sidequest');
    expect(CHAPTER_DOORS.find((d) => d.word === 'sidequest')).toMatchObject({ chapter: 'belgemine' });
  });

  it('its scene is registered and publishes the staging for every body of every act', async () => {
    const entry = getScene('belgemine');
    expect(entry?.key).toBe('belgemine');
    const spots = entry?.slots.enemySpots ?? {};
    const heights = entry?.slots.figureHeights ?? {};
    for (const g of BELGEMINE_GROUPS) for (const e of g.enemies) {
      expect(spots[e.id], `${g.id} ${e.id} spot`).toBeDefined();
      expect(heights[e.id], `${g.id} ${e.id} height`).toBeGreaterThan(0);
    }
    expect(entry?.slots.holdParty).toBe(true);
  });
});

describe('the party: Yuna alone, ten aeons, three tiers; the sin tier ships', () => {
  it('Yuna alone on the field, no reserve; her Grand Summon gauge full; whole; the Yojimbo and Sisters starts the engine asks for', () => {
    expect(belgemineBuild.members.map((m) => m.id)).toEqual(['yuna']);
    expect(belgemineBuild.activeSlots).toEqual(['yuna']);
    expect(belgemineBuild.reserve).toEqual([]);
    const yuna = belgemineBuild.members[0]!;
    expect(yuna.hp).toBe(yuna.stats.maxHp);
    expect(yuna.overdrive.gauge).toBe(BELGEMINE_YUNA_GAUGE);
    expect(yuna.overdrive.unlockedOverdriveIds).toContain('grand-summon');
    expect(belgemineBuild.yojimbo).toEqual({ compatibility: 128, hireAnswer: 2 });
    expect(belgemineBuild.sisters?.motivation).toEqual({ cindy: 50, sandy: 50, mindy: 50 });
  });

  it('all ten aeons, in the Summon list\'s order, each whole, with a Shield and a Boost and its Overdrive; the Sisters Nul-All', () => {
    expect(belgemineBuild.aeons.map((a) => a.id)).toEqual([...BELGEMINE_AEON_IDS]);
    for (const a of belgemineBuild.aeons) {
      expect(a.hp, a.id).toBe(a.stats.maxHp);
      expect(a.abilityIds, a.id).toEqual(expect.arrayContaining(['shield', 'boost']));
      expect(a.overdriveIds.length, a.id).toBeGreaterThan(0);
    }
    for (const id of ['cindy', 'sandy', 'mindy']) expect(belgemineBuild.aeons.find((a) => a.id === id)!.abilityIds).toContain('nul-all-aeon');
    expect(belgemineBuild.aeons.find((a) => a.id === 'yojimbo')!.spriteKey).toBe('yojimbo-cavern');
  });

  it('the shipped tier is the last sourced canonical block (inside Sin, N = 360): every aeon\'s nine stats and Luck are section 6.4.3\'s', () => {
    expect(BELGEMINE_TIER).toBe('sin');
    for (const a of belgemineBuild.aeons) {
      const c = AEON_CANONICAL_STATS['braskas-final-aeon'][a.id]!;
      expect({ hp: a.stats.hp, mp: a.stats.mp, str: a.stats.str, def: a.stats.def, mag: a.stats.mag, mdef: a.stats.mdef, agi: a.stats.agi, eva: a.stats.eva, acc: a.stats.acc, luck: a.stats.luck }, a.id).toEqual({
        hp: c.hp, mp: c.mp, str: c.str, def: c.def, mag: c.mag, mdef: c.mdef, agi: c.agi, eva: c.eva, acc: c.acc, luck: c.luck,
      });
    }
  });

  it('the Zanarkand tier is the same function on the Zanarkand block (the preflight\'s recommendation, one constant away); the endgame tier is the formula at the caps', () => {
    const z = belgemineBuildOf('zanarkand');
    for (const a of z.aeons) expect(a.stats.hp, a.id).toBe(AEON_CANONICAL_STATS.yunalesca[a.id]!.hp);
    expect(z.members[0]!.stats.maxHp).toBe(2450);
    const e = belgemineBuildOf('endgame');
    expect(e.aeons.find((a) => a.id === 'valefor')!.stats.hp).toBe(13_897);
    expect(e.aeons.find((a) => a.id === 'cindy')!.stats.hp).toBe(43_827);
    expect(e.aeons.every((a) => a.stats.def === 255 && a.stats.mdef === 255)).toBe(true);
  });
});

describe('the encounter\'s set-up (the formation scripts\' start): the gauges, the bystanders, the opening counters', () => {
  it('every aeon carries a gauge at 0 tagged for the HUD, unlocking its Overdrive row; Belgemine and the dog are marked orders-only and non-combatant', () => {
    for (const g of BELGEMINE_GROUPS) {
      const live = liveBattle(g.id, { party: belgemineBuild });
      const setup = battle.BELG_ACT_SETUP[g.id]!;
      expect(live.ctx.state.flags[battle.BELG_FLAGS.battleId], g.id).toBe(setup.battleId);
      for (const [id, overdrive] of setup.gauges) {
        expect(live.at(id).overdrive, `${g.id} ${id}`).toMatchObject({ gauge: 0, mode: 'stoic', unlockedOverdriveIds: [overdrive], enemyGaugeRules: battle.BELG_GAUGE_RULES });
      }
      for (const id of setup.bystanders) expect([rtOf(live.ctx, id).ordersOnly, rtOf(live.ctx, id).nonCombatant], `${g.id} ${id}`).toEqual([true, true]);
    }
  });

  it('the aeon of an act opens at counter 0 and each party counter goes up one tick; the Sisters\' hook differs: Cindy at 0, Mindy and Sandy at the first counter plus 2', () => {
    const live = liveBattle('belgemine-3-ixion', { party: belgemineBuild });
    expect(rtOf(live.ctx, 'belg-ixion').ctb).toBe(0);
    const sisters = liveBattle('belgemine-8-sisters', { party: belgemineBuild });
    expect(rtOf(sisters.ctx, 'belg-cindy').ctb).toBe(0);
    const yuna = rtOf(sisters.ctx, 'yuna').ctb;
    expect(rtOf(sisters.ctx, 'belg-mindy').ctb).toBe(yuna + 1); // the hook writes (counter + 2) before the +1 every party slot gets
    expect(rtOf(sisters.ctx, 'belg-sandy').ctb).toBe(yuna + 1);
  });
});
