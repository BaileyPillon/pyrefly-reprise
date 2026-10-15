/**
 * The hidden Biran and Yenke chapter's data against the game's own rows and the research note (`research/ffx-biran-yenke.md`, "§n"; **FFX only** [AGENTS.md rule 14]): the two records, the
 * stats the battle writes from Kimahri's, the Ronso's command rows, Kimahri's gate preset, the ids every layer keeps its own copy of, and the chapter's registration as a hidden experiment.
 * A number here is a row of the game's tables, a sourced formula's result, or it is named as an estimate.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import type { EnemyDef } from '../../../src/battle/common/types.ts';
import * as RULES from '../../../src/battle/ffx/ai/biran-yenke-rules.ts';
import { BIRAN_LOOP, YENKE_LOOP } from '../../../src/battle/ffx/ai/biran-yenke.ts';
import { registeredRageTeacherIds } from '../../../src/battle/ffx/ronso-rage.ts';
import { CHAPTERS, CHAPTER_IDS, EXPERIMENT_CHAPTERS, getChapter } from '../../../src/data/encounters.ts';
import { ALL_ABILITIES, ENEMY_GROUPS_BY_ID } from '../../../src/data/ffx/index.ts';
import * as IDS from '../../../src/data/ffx/biran-yenke-ids.ts';
import { BIRAN_PRESET_NUMBERS, YENKE_PRESET_NUMBERS, biranRonso, biranYenkeGroup, yenkeRonso } from '../../../src/data/ffx/enemies/biran-yenke.ts';
import { BIRAN_YENKE_ABILITIES, COMMAND_RECORDS_RONSO } from '../../../src/data/ffx/enemies/biran-yenke-abilities.ts';
import { COMMAND_RECORDS } from '../../../src/data/ffx/command-records/index.ts';
import { KIMAHRI_GATE_GAUGE, LEARNED_FROM_THE_RONSO, gagazetGateBuild } from '../../../src/data/ffx/builds/gagazet-gate.ts';
import { gagazetBuild } from '../../../src/data/ffx/builds/gagazet.ts';
import { BIRAN_YENKE_META } from '../../../src/data/chapter-meta-biran-yenke.ts';
import { UNLISTED_CHAPTER_META } from '../../../src/data/chapter-meta.ts';
import { BIRAN_YENKE_GUIDE, BIRAN_YENKE_GUIDE_IDS } from '../../../src/data/guides/biran-yenke.ts';
import { BIRAN_YENKE_DOC } from '../../../src/data/guides/docs/biran-yenke.ts';
import * as STORY from '../../../src/story/scripts/biran-yenke.ts';
import { BIRAN_YENKE_BOSS_IDS } from '../../../src/engine/tactics/biran-yenke.ts';
import { GAGAZET_STAGING } from '../../../src/scenes/gagazet-giants.ts';
import { TRACKS } from '../../../src/audio/tracks/index.ts';

const REPO = join(__dirname, '..', '..', '..');
const chapter = getChapter(IDS.BIRAN_YENKE_ID)!;

/** The Steam HD build's own command table (`research/re-ffx-commands.md` section 1). */
const FIXTURE = JSON.parse(readFileSync(join(REPO, 'tests', 'fixtures', 'parity', 'ffx', 'command_records.json'), 'utf8')) as { columns: string[]; rows: number[][] };
const fixtureRow = (id: number): Record<string, number> => {
  const row = FIXTURE.rows.find((r) => r[0] === id);
  if (!row) throw new Error(`no fixture row 0x${id.toString(16)}`);
  return Object.fromEntries(FIXTURE.columns.map((c, i) => [c, row[i] as number]));
};

describe('the ids every layer keeps its own copy of agree (the battle, story, guide and tactic layers do not import src/data)', () => {
  it('combatants, scripts and command ids', () => {
    expect([RULES.BIRAN_ID, RULES.YENKE_ID, RULES.BIRAN_SCRIPT, RULES.YENKE_SCRIPT]).toEqual([IDS.BIRAN_ID, IDS.YENKE_ID, IDS.BIRAN_SCRIPT, IDS.YENKE_SCRIPT]);
    for (const key of ['RONSO_BULLDOZE_ID', 'YENKE_FIRE_BREATH_ID', 'YENKE_AQUA_BREATH_ID', 'BIRAN_BERSERK_ID', 'BIRAN_MIGHTY_GUARD_ID', 'BIRAN_MIGHTY_GUARD_SELF_ID', 'YENKE_WHITE_WIND_ID', 'YENKE_WHITE_WIND_SELF_ID'] as const) {
      expect(RULES[key], key).toBe(IDS[key]);
    }
    expect([STORY.BIRAN, STORY.YENKE, STORY.BULLDOZE, STORY.MIGHTY_GUARD, STORY.MIGHTY_GUARD_SELF, STORY.WHITE_WIND, STORY.WHITE_WIND_SELF]).toEqual([
      IDS.BIRAN_ID,
      IDS.YENKE_ID,
      IDS.RONSO_BULLDOZE_ID,
      IDS.BIRAN_MIGHTY_GUARD_ID,
      IDS.BIRAN_MIGHTY_GUARD_SELF_ID,
      IDS.YENKE_WHITE_WIND_ID,
      IDS.YENKE_WHITE_WIND_SELF_ID,
    ]);
    expect([...BIRAN_YENKE_GUIDE_IDS]).toEqual([IDS.BIRAN_ID, IDS.YENKE_ID]);
    expect([...BIRAN_YENKE_BOSS_IDS]).toEqual([IDS.BIRAN_ID, IDS.YENKE_ID]);
    expect([...BIRAN_YENKE_DOC.bossIds]).toEqual([IDS.BIRAN_ID, IDS.YENKE_ID]);
    expect([biranRonso.aiScriptId, yenkeRonso.aiScriptId]).toEqual([IDS.BIRAN_SCRIPT, IDS.YENKE_SCRIPT]);
  });

  it('both Ronso teach through a registered teacher, and only the Ronso do', () => {
    expect(registeredRageTeacherIds()).toEqual([IDS.BIRAN_SCRIPT, IDS.YENKE_SCRIPT]);
  });

  it('the Gagazet plate stands both Ronso at Kimahri\'s stature; the chapter\'s scene is that plate', () => {
    expect(Object.keys(GAGAZET_STAGING.enemySpots)).toEqual(expect.arrayContaining([IDS.BIRAN_ID, IDS.YENKE_ID]));
    const heights = GAGAZET_STAGING.figureHeights as Record<string, number>;
    expect(heights[IDS.BIRAN_ID]).toBeCloseTo(1.82 * 1.304, 6);
    expect(heights[IDS.YENKE_ID]).toBe(heights[IDS.BIRAN_ID]);
    expect(chapter.sceneKey).toBe(IDS.BIRAN_YENKE_SCENE);
  });
});

describe('the two records (m134, m135; §2.1, §2.3, §2.4)', () => {
  const both: EnemyDef[] = [biranRonso, yenkeRonso];

  it('the fields the battle does not overwrite are the record\'s: MP 200, Defense 30, Magic Defense 10, Luck 15, Evasion 0, Accuracy 100; neutral to every element', () => {
    for (const e of both) {
      expect([e.mp, e.stats.def, e.stats.mdef, e.stats.luck, e.stats.eva, e.stats.acc], e.id).toEqual([200, 30, 10, 15, 0, 100]);
      expect(e.affinities, e.id).toEqual({});
    }
  });

  it('immune (255) to Death, Zombie, Petrify, Poison, Confuse, Provoke, Sleep, Silence, Darkness, Reflect, Slow, Eject and Auto-Life; Berserk on Yenke only (Biran berserks himself)', () => {
    const common = ['ko', 'zombie', 'petrify', 'poison', 'confuse', 'provoke', 'sleep', 'silence', 'darkness', 'reflect', 'slow', 'eject', 'auto-life'];
    for (const e of both) for (const s of common) expect((e.immunities as Record<string, number>)[s], `${e.id} ${s}`).toBe(255);
    expect((biranRonso.immunities as Record<string, number>)['berserk']).toBeUndefined();
    expect((yenkeRonso.immunities as Record<string, number>)['berserk']).toBe(255);
    for (const e of both) {
      expect(e.immunityFlags).toEqual(expect.arrayContaining(['boss', 'immune-to-life', 'immune-to-delay', 'immune-to-bribe']));
      expect([e.threatenChance, e.doomTurns, e.poisonTickPercent]).toEqual([0, 20, 10]);
    }
  });

  it('rewards: 4,500 AP (6,750 on an Overkill at 2,500), 1,500 gil, a Return Sphere always; steal a Lv. 3 Key Sphere (two on the rare roll); Bribe immune', () => {
    for (const e of both) {
      const r = e.rewards;
      expect([r.ap, r.apOverkill, r.gil, r.overkillThreshold]).toEqual([4_500, 6_750, 1_500, 2_500]);
      expect(r.drops).toEqual([{ itemId: 'return-sphere', count: 1 }]);
      expect(r.steal).toEqual({ baseChance: 100, common: { itemId: 'lv-3-key-sphere', count: 1 }, rare: { itemId: 'lv-3-key-sphere', count: 2 } });
      expect(r.bribe?.immune).toBe(true);
    }
  });

  it('Biran\'s default attack is Bulldoze (the record\'s forced action, 0x60a5), so a berserk Biran Bulldozes; Yenke has none', () => {
    expect(biranRonso.plainAttack?.record).toEqual(COMMAND_RECORDS_RONSO[IDS.RONSO_BULLDOZE_ID]);
    expect(yenkeRonso.plainAttack).toBeUndefined();
  });

  it('their lists: Biran Thunder, Blizzard, Bulldoze, Mighty Guard and Berserk; Yenke the two breaths, Bulldoze, White Wind and Haste (monster_actions.json, §3.1)', () => {
    expect(biranRonso.abilityIds).toEqual(['thunder', 'blizzard', IDS.RONSO_BULLDOZE_ID, IDS.BIRAN_MIGHTY_GUARD_ID, IDS.BIRAN_MIGHTY_GUARD_SELF_ID, IDS.BIRAN_BERSERK_ID]);
    expect(yenkeRonso.abilityIds).toEqual([IDS.YENKE_FIRE_BREATH_ID, IDS.YENKE_AQUA_BREATH_ID, IDS.RONSO_BULLDOZE_ID, IDS.YENKE_WHITE_WIND_ID, IDS.YENKE_WHITE_WIND_SELF_ID, 'haste']);
    expect(BIRAN_LOOP).toEqual(['thunder', IDS.RONSO_BULLDOZE_ID, 'blizzard', IDS.RONSO_BULLDOZE_ID]);
    expect(YENKE_LOOP).toEqual([IDS.YENKE_FIRE_BREATH_ID, IDS.YENKE_AQUA_BREATH_ID, IDS.RONSO_BULLDOZE_ID]);
  });

  it('the Sensor lines the chapter duplicates are the records\' own; the guide page\'s descriptions are their Scan lines', () => {
    for (const e of both) expect(chapter.sensorTexts?.[e.id], e.id).toBe(e.sensorText);
    const descriptions = BIRAN_YENKE_DOC.blocks.flatMap((b) => (b.t === 'field' && b.label === 'In Game Description' ? [b.value] : []));
    expect(descriptions).toEqual([biranRonso.scanText, yenkeRonso.scanText]);
  });
});

describe('the stats the battle writes from Kimahri\'s (§2.2, conflicts B-1 to B-3)', () => {
  it('with the gate preset (Str 26, Mag 22, HP 2,310, Agi 18; step 8): Biran 3,208 HP, Str 23, Mag 9, Agi 14; Yenke 2,406 HP, Str 11, Mag 18, Agi 10', () => {
    const k = gagazetGateBuild.members[0]!;
    expect([k.stats.str, k.stats.mag, k.hp, k.stats.agi]).toEqual([26, 22, 2_310, 18]);
    expect(RULES.ronsoStep(k.hp)).toBe(8);
    expect(RULES.ronsoHpValue({ str: 26, mag: 22, hp: 2_310, agi: 18 })).toBe(401);
    expect(BIRAN_PRESET_NUMBERS).toEqual({ hp: 3_208, str: 23, mag: 9, agi: 14 });
    expect(YENKE_PRESET_NUMBERS).toEqual({ hp: 2_406, str: 11, mag: 18, agi: 10 });
  });

  it('the records ship those numbers, so prep, the guide and the battle agree; the guide page prints the same HP', () => {
    expect([biranRonso.hp, biranRonso.stats.maxHp, biranRonso.stats.str, biranRonso.stats.mag, biranRonso.stats.agi]).toEqual([3_208, 3_208, 23, 9, 14]);
    expect([yenkeRonso.hp, yenkeRonso.stats.maxHp, yenkeRonso.stats.str, yenkeRonso.stats.mag, yenkeRonso.stats.agi]).toEqual([2_406, 2_406, 11, 18, 10]);
    const hp = BIRAN_YENKE_DOC.blocks.flatMap((b) => (b.t === 'field' && b.label === 'HP' ? [b.value] : []));
    expect(hp).toEqual(['3,208', '2,406']);
  });

  it('the step is (HP - 644) / 200 in whole steps, clamped to 0 and 11; the tables\' ends are the sources\' (Biran 11 to 27, Yenke 8 to 22)', () => {
    expect([RULES.ronsoStep(0), RULES.ronsoStep(843), RULES.ronsoStep(844), RULES.ronsoStep(2_843), RULES.ronsoStep(2_844), RULES.ronsoStep(9_999)]).toEqual([0, 0, 1, 10, 11, 11]);
    expect([RULES.BIRAN_STR_TABLE[0], RULES.BIRAN_STR_TABLE[11], RULES.YENKE_MAG_TABLE[0], RULES.YENKE_MAG_TABLE[11]]).toEqual([11, 27, 8, 22]);
    expect(RULES.BIRAN_STR_TABLE).toHaveLength(12);
    expect(RULES.YENKE_MAG_TABLE).toHaveLength(12);
  });

  it('a stronger Kimahri meets stronger Ronso: HP from his Strength and Magic, Strength and Magic from his HP, Agility from his', () => {
    const weak = { str: 20, mag: 15, hp: 1_500, agi: 12 };
    const strong = { str: 40, mag: 30, hp: 3_000, agi: 25 };
    const [bw, bs] = [RULES.biranNumbers(weak), RULES.biranNumbers(strong)];
    expect(bs.hp).toBeGreaterThan(bw.hp);
    expect(bs.str).toBeGreaterThan(bw.str);
    expect([bw.agi, bs.agi]).toEqual([8, 21]);
    expect([RULES.yenkeNumbers(weak).agi, RULES.yenkeNumbers(strong).agi]).toEqual([4, 17]);
    // Yenke's HP is six of the value and Biran's eight (B-2); Yenke's Strength half of Biran's ([inferred]), Biran's Magic half of Yenke's.
    expect(RULES.yenkeNumbers(strong).hp * 8).toBe(bs.hp * 6);
    expect(RULES.yenkeNumbers(strong).str).toBe(Math.floor(bs.str / 2));
    expect(bs.mag).toBe(Math.floor(RULES.yenkeNumbers(strong).mag / 2));
  });
});

describe('the Ronso\'s command rows (§3.2): the game\'s records, identical to the Steam build\'s table', () => {
  const def = (id: string) => ALL_ABILITIES.find((a) => a.id === id)!;

  it('each record equals the fixture row in id, type, flags and damage class', () => {
    for (const [id, rec] of Object.entries(COMMAND_RECORDS_RONSO)) {
      const row = fixtureRow(rec.id);
      expect([rec.type, rec.flagsMisc, rec.flagsDamage, rec.damageClass], id).toEqual([row['type'], row['flagsMisc'], row['flagsDamage'], row['damageClass']]);
      expect(COMMAND_RECORDS[id], id).toEqual(rec);
    }
  });

  it('formula and power agree with the fixture: Bulldoze Strength 16 physical; the breaths Magic 16 Fire and Water at the whole party; White Wind Healing 40', () => {
    const bulldoze = def(IDS.RONSO_BULLDOZE_ID);
    expect([bulldoze.formula, bulldoze.power, bulldoze.damageType, bulldoze.targeting]).toEqual(['strength', fixtureRow(0x60a5)['power'], 'physical', 'single-enemy']);
    for (const [id, element, row] of [[IDS.YENKE_FIRE_BREATH_ID, 'fire', 0x60a2], [IDS.YENKE_AQUA_BREATH_ID, 'water', 0x60a3]] as const) {
      const a = def(id);
      expect([a.formula, a.power, a.damageType, a.targeting, a.element], id).toEqual(['magic', fixtureRow(row)['power'], 'other', 'all-enemies', [element]]);
    }
    expect(def(IDS.YENKE_WHITE_WIND_ID).power).toBe(fixtureRow(0x3070)['power']);
    expect(def(IDS.BIRAN_BERSERK_ID).statusEffects).toEqual([{ status: 'berserk', chance: 120, duration: 254 }]);
  });

  it('Mighty Guard and White Wind are Kimahri\'s own rows (0x3072, 0x3070), on both Ronso while together and on the caster alone while apart', () => {
    expect([COMMAND_RECORDS_RONSO[IDS.BIRAN_MIGHTY_GUARD_ID]?.id, COMMAND_RECORDS_RONSO[IDS.BIRAN_MIGHTY_GUARD_SELF_ID]?.id]).toEqual([0x3072, 0x3072]);
    expect([COMMAND_RECORDS_RONSO[IDS.YENKE_WHITE_WIND_ID]?.id, COMMAND_RECORDS_RONSO[IDS.YENKE_WHITE_WIND_SELF_ID]?.id]).toEqual([0x3070, 0x3070]);
    expect(COMMAND_RECORDS['mighty-guard']?.id).toBe(0x3072);
    expect(COMMAND_RECORDS['white-wind']?.id).toBe(0x3070);
    expect([def(IDS.BIRAN_MIGHTY_GUARD_ID).targeting, def(IDS.BIRAN_MIGHTY_GUARD_SELF_ID).targeting]).toEqual(['all-allies', 'self']);
    expect([def(IDS.YENKE_WHITE_WIND_ID).targeting, def(IDS.YENKE_WHITE_WIND_SELF_ID).targeting]).toEqual(['all-allies', 'self']);
  });

  it('every row always hits (accuracy formula 0; hit rule 5), and every one is in the content the engine loads', () => {
    for (const id of Object.keys(BIRAN_YENKE_ABILITIES)) {
      expect(def(id)?.canMiss, id).toBe(false);
      expect(fixtureRow(COMMAND_RECORDS_RONSO[id]!.id)['accuracy'], id).toBe(0);
    }
  });
});

describe('Kimahri at the gate: Chapter I\'s preset less what this duel teaches (§5; the stats are an estimate)', () => {
  const k = gagazetGateBuild.members[0]!;
  const chapterOne = gagazetBuild.members.find((m) => m.id === 'kimahri')!;

  it('alone: the forced party, no reserve, no aeons, no Switch', () => {
    expect(gagazetGateBuild.members.map((m) => m.id)).toEqual(['kimahri']);
    expect(gagazetGateBuild.activeSlots).toEqual(['kimahri']);
    expect(gagazetGateBuild.reserve).toEqual([]);
    expect(gagazetGateBuild.aeons).toEqual([]);
    expect(biranYenkeGroup.lineUp).toEqual({ activeSlots: ['kimahri'], noSwitch: true });
    expect(biranYenkeGroup.canEscape).toBe(false);
  });

  it('the same stats as Chapter I\'s Kimahri, at full HP and MP; no Mighty Guard, no White Wind, no Talk; Jump only; the gauge at 45 %', () => {
    expect(k.stats).toEqual(chapterOne.stats);
    expect([k.hp, k.mp]).toEqual([k.stats.maxHp, k.stats.maxMp]);
    expect(LEARNED_FROM_THE_RONSO).toEqual(['mighty-guard', 'white-wind']);
    for (const id of [...LEARNED_FROM_THE_RONSO, 'talk']) {
      expect(k.learnedAbilityIds, id).not.toContain(id);
      expect(k.overdrive.unlockedOverdriveIds, id).not.toContain(id);
    }
    expect(k.overdrive.unlockedOverdriveIds).toEqual(['jump']);
    expect(k.learnedAbilityIds).toContain('lancet');
    expect(k.overdrive.gauge).toBe(KIMAHRI_GATE_GAUGE);
    expect(KIMAHRI_GATE_GAUGE).toBe(45);
  });

  it('the mountain\'s two Mega-Potions and 20,000 gil lie past the gate', () => {
    const count = (b: typeof gagazetBuild, id: string): number => b.inventory.find((e) => e.itemId === id)?.count ?? 0;
    expect(count(gagazetBuild, 'mega-potion') - count(gagazetGateBuild, 'mega-potion')).toBe(2);
    expect(gagazetGateBuild.gil).toBe((gagazetBuild.gil ?? 0) - 20_000);
    expect(count(gagazetGateBuild, 'hi-potion')).toBeGreaterThan(0);
  });

  it('the source says so in words: the preset is Chapter I\'s estimate', () => {
    const src = readFileSync(join(REPO, 'src', 'data', 'ffx', 'builds', 'gagazet-gate.ts'), 'utf8');
    expect(src).toMatch(/\[estimate\]/);
    expect(src).toMatch(/No source gives his stats at the gate/);
  });
});

describe('the chapter is a hidden experiment: no card, no count, no save', () => {
  it('registered with the experiments and not with the eighteen; number 25; FFX; experimental; the Gagazet plate', () => {
    expect(EXPERIMENT_CHAPTERS.map((c) => c.id)).toContain(IDS.BIRAN_YENKE_ID);
    expect(CHAPTERS.map((c) => c.id)).not.toContain(IDS.BIRAN_YENKE_ID);
    expect((CHAPTER_IDS as readonly string[]).includes(IDS.BIRAN_YENKE_ID)).toBe(false);
    expect([chapter.number, chapter.game, chapter.experimental, chapter.sceneKey]).toEqual([25, 'ffx', true, 'gagazet']);
    expect(chapter.buildRef).toBe(gagazetGateBuild);
    expect(chapter.enemyGroupRef).toBe(biranYenkeGroup);
    expect(ENEMY_GROUPS_BY_ID[IDS.BIRAN_YENKE_GROUP_ID]).toBe(biranYenkeGroup);
    expect(biranYenkeGroup.bossId).toBe(IDS.BIRAN_ID);
  });

  it('its pause metadata is the hidden one: EXP, three objectives the objective reader answers, and no placeholder anywhere', () => {
    expect(UNLISTED_CHAPTER_META.find((m) => m.id === IDS.BIRAN_YENKE_ID)).toBe(BIRAN_YENKE_META);
    expect(BIRAN_YENKE_META.numeral).toBe('EXP');
    expect(BIRAN_YENKE_META.objectives.map((o) => o.rule.kind)).toEqual(['survived-ability', 'boss-hp-below', 'victory']);
    const survived = BIRAN_YENKE_META.objectives[0]!.rule;
    expect(survived.kind === 'survived-ability' ? survived.ability : '').toBe(IDS.YENKE_AQUA_BREATH_ID);
    for (const file of ['chapter-biran-yenke.ts', 'chapter-meta-biran-yenke.ts', join('ffx', 'enemies', 'biran-yenke.ts'), join('ffx', 'builds', 'gagazet-gate.ts')])
      expect(readFileSync(join(REPO, 'src', 'data', file), 'utf8'), file).not.toMatch(/PLACEHOLDER/);
  });

  it('the music: the mountain\'s own bed carries the scenes and the fight (the game plays Gagazet\'s theme through the duel, §8), the FFX fanfare after; every key is a track', () => {
    expect(biranYenkeGroup.musicCues).toEqual([{ at: 'start', track: 'scene-gagazet', fadeMs: 1200 }]);
    expect([chapter.music.scene, chapter.music.battle, chapter.music.victory]).toEqual(['scene-gagazet', 'scene-gagazet', 'victory-ffx']);
    for (const key of [chapter.music.scene, chapter.music.battle, chapter.music.victory, ...BIRAN_YENKE_META.musicKeys]) expect(TRACKS[key as string], String(key)).toBeDefined();
  });

  it('its guide card is the chapter\'s, cites the chapter\'s research note in every line, and keeps its short rules to one line', () => {
    expect(BIRAN_YENKE_GUIDE.id).toBe(IDS.BIRAN_YENKE_ID);
    const cites = [...BIRAN_YENKE_GUIDE.rules, ...BIRAN_YENKE_GUIDE.hints, ...BIRAN_YENKE_GUIDE.phases].map((x) => x.cite);
    for (const c of cites) expect(c).toMatch(/^ffx-biran-yenke §/);
    for (const r of BIRAN_YENKE_GUIDE.rules) expect(r.short.length, r.short).toBeLessThanOrEqual(52);
  });
});
