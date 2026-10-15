/**
 * The hidden Angra Mainyu chapter's data against the research note (`research/ffx2-angra-mainyu.md`, "§n"; **FFX-2 only** [AGENTS.md rule 14]): the three records, the moves and the stand-in rows
 * they run on, the ids every layer keeps its own copy of, the staging on the stand-in plate, and the chapter's registration as a hidden experiment.
 *
 * **No row of these three monsters was read** (§0.2): a number here is a written source's (read through a search tool's summaries), a row of the game's own table that another monster uses (pinned
 * against the Steam build's fixture elsewhere, `tests/unit/data-ffx2-command-records.test.ts`), or it is named as an estimate. This file pins that the data says what the research says, so a verified
 * row is a one-line change that this file then catches.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import type { AbilityDef } from '../../../src/battle/common/types.ts';
import * as AI from '../../../src/battle/ffx2/ai/angra-mainyu.ts';
import { aiScriptFor } from '../../../src/battle/ffx2/ai/index.ts';
import * as IDS from '../../../src/data/angra-mainyu-ids.ts';
import { CHAPTERS, CHAPTER_IDS, EXPERIMENT_CHAPTERS, getChapter } from '../../../src/data/encounters.ts';
import { ABILITIES, ENEMY_GROUPS_BY_ID, ITEMS } from '../../../src/data/ffx2/index.ts';
import { farplaneBuild } from '../../../src/data/ffx2/builds/farplane.ts';
import {
  ANGRA_ACTION_TIME_ON, ANGRA_ACTION_TIME_SECONDS, ANGRA_HP, ARM_HP, angraMainyuGroup, x2AngraMainyu, x2Tawrich, x2Zarich,
} from '../../../src/data/ffx2/enemies/angra-mainyu.ts';
import { ANGRA_FULL_LIFE_MP, ANGRA_MP_COST, PERDITIONS_FLAME, angraMainyuAbilities } from '../../../src/data/ffx2/enemies/angra-mainyu-abilities.ts';
import { ANGRA_STAND_IN_FROM, COMMAND_RECORDS_ANGRA_MAINYU } from '../../../src/data/ffx2/command-records/angra-mainyu.ts';
import { COMMAND_RECORDS_ENEMIES } from '../../../src/data/ffx2/command-records/enemies.ts';
import { COMMAND_RECORDS_PARTY } from '../../../src/data/ffx2/command-records/party.ts';
import { FFX2_COMMAND_RECORDS } from '../../../src/data/ffx2/command-records/index.ts';
import { heldItems } from '../../../src/data/ffx2/items/held.ts';
import { ANGRA_MAINYU_TEXT, FFX2_ANGRA_MAINYU } from '../../../src/data/chapter-ffx2-angra-mainyu.ts';
import { ANGRA_MAINYU_META } from '../../../src/data/chapter-meta-ffx2-angra-mainyu.ts';
import { UNLISTED_CHAPTER_META } from '../../../src/data/chapter-meta.ts';
import { EXPERIMENT_GROUNDS_PLATE } from '../../../src/data/experiment-plates.ts';
import { ANGRA_MAINYU_GUIDE_IDS, FFX2_ANGRA_MAINYU_GUIDE } from '../../../src/data/guides/ffx2-angra-mainyu.ts';
import { FFX2_ANGRA_MAINYU_DOC } from '../../../src/data/guides/docs/ffx2-angra-mainyu.ts';
import { guideForChapter } from '../../../src/data/guides/index.ts';
import { docForChapter } from '../../../src/data/guides/docs/index.ts';
import { ffx2AngraMainyuScripts } from '../../../src/story/scripts/ffx2-angra-mainyu.ts';
import { ANGRA_ARM_IDS, ANGRA_MAINYU_BOSS_IDS } from '../../../src/engine/tactics/ffx2-angra-mainyu.ts';
import { ANGRA_FIGURE_HEIGHT, ANGRA_PART_ANCHORS, EXPERIMENT_FIGURE_HEIGHT, EXPERIMENT_GROUNDS_SLOTS, EXPERIMENT_SPOT } from '../../../src/scenes/experiment-grounds.ts';
import { TRACKS } from '../../../src/audio/tracks/index.ts';

const REPO = join(__dirname, '..', '..', '..');
const chapter = getChapter(IDS.ANGRA_MAINYU_ID)!;
const ability = (id: string): AbilityDef => {
  const a = angraMainyuAbilities.find((x) => x.id === id);
  if (!a) throw new Error(`no ability ${id}`);
  return a;
};
const ALL_MOVES = [...Object.values(IDS.ANGRA_ABILITY), ...Object.values(IDS.TAWRICH_ABILITY), ...IDS.ZARICH_ABILITY.ara, ...IDS.ZARICH_ABILITY.aga, IDS.ZARICH_ABILITY.glimmer];

describe('the ids every layer keeps its own copy of agree (the battle layer does not import src/data)', () => {
  it('combatants, scripts and moves: the AI\'s mirrors are the data\'s; the story, the guide, the doc and the tactic name the same', () => {
    expect([AI.ANGRA_ID, AI.TAWRICH_ID, AI.ZARICH_ID, AI.ANGRA_SCRIPT, AI.TAWRICH_SCRIPT, AI.ZARICH_SCRIPT]).toEqual([IDS.ANGRA_ID, IDS.TAWRICH_ID, IDS.ZARICH_ID, IDS.ANGRA_SCRIPT, IDS.TAWRICH_SCRIPT, IDS.ZARICH_SCRIPT]);
    expect(AI.ANGRA_ABILITY).toEqual(IDS.ANGRA_ABILITY);
    expect(AI.TAWRICH_ABILITY).toEqual(IDS.TAWRICH_ABILITY);
    expect(AI.ZARICH_ABILITY).toEqual(IDS.ZARICH_ABILITY);
    expect([...AI.ARMS]).toEqual([IDS.TAWRICH_ID, IDS.ZARICH_ID]);
    expect([...ANGRA_ARM_IDS]).toEqual([IDS.TAWRICH_ID, IDS.ZARICH_ID]);
    expect([...ANGRA_MAINYU_BOSS_IDS]).toEqual([IDS.ANGRA_ID]);
    expect([...ANGRA_MAINYU_GUIDE_IDS]).toEqual([IDS.ANGRA_ID]);
    expect([...FFX2_ANGRA_MAINYU_DOC.bossIds]).toEqual([IDS.ANGRA_ID]);
    expect(ffx2AngraMainyuScripts.mid.map((t) => t.when)).toEqual([
      { type: 'ability-used', who: IDS.ANGRA_ID, ability: IDS.ANGRA_ABILITY.perditionsFlame },
      { type: 'ability-used', who: IDS.ANGRA_ID, ability: IDS.ANGRA_ABILITY.fullLife },
    ]);
  });

  it('each record runs its own registered script', () => {
    for (const [e, script] of [[x2AngraMainyu, IDS.ANGRA_SCRIPT], [x2Tawrich, IDS.TAWRICH_SCRIPT], [x2Zarich, IDS.ZARICH_SCRIPT]] as const) {
      expect(e.aiScriptId, e.id).toBe(script);
      expect(aiScriptFor(script).id, e.id).toBe(script);
    }
  });

  it('the AI\'s MP costs are the moves\' (Full-Life 60, Demi 10, Flare 54, Curaga 20; all [estimate])', () => {
    expect(AI.ANGRA_MP).toEqual({ fullLife: ANGRA_FULL_LIFE_MP, ...ANGRA_MP_COST });
    expect(ability(IDS.ANGRA_ABILITY.fullLife).mpCost).toBe(AI.ANGRA_MP.fullLife);
    expect(ability(IDS.ANGRA_ABILITY.demi).mpCost).toBe(AI.ANGRA_MP.demi);
    expect(ability(IDS.ANGRA_ABILITY.flare).mpCost).toBe(AI.ANGRA_MP.flare);
    expect(ability(IDS.ANGRA_ABILITY.curaga).mpCost).toBe(AI.ANGRA_MP.curaga);
    expect(ability(IDS.ANGRA_ABILITY.perditionsFlame).mpCost).toBe(0);
  });

  it('the scene is the hidden Experiment\'s grounds plate (the stand-in, §6): the body on its spot at its giant\'s height, the arms anchored either side of his chest, Tawrich on the viewer\'s left', () => {
    expect(IDS.ANGRA_MAINYU_SCENE).toBe(EXPERIMENT_GROUNDS_PLATE);
    expect(chapter.sceneKey).toBe(EXPERIMENT_GROUNDS_PLATE);
    expect(EXPERIMENT_GROUNDS_SLOTS.enemySpots?.[IDS.ANGRA_ID]).toEqual(EXPERIMENT_SPOT);
    expect(ANGRA_FIGURE_HEIGHT).toBe(EXPERIMENT_FIGURE_HEIGHT);
    expect(EXPERIMENT_GROUNDS_SLOTS.figureHeights?.[IDS.ANGRA_ID]).toBe(ANGRA_FIGURE_HEIGHT);
    expect(EXPERIMENT_GROUNDS_SLOTS.partAnchors).toBe(ANGRA_PART_ANCHORS);
    expect(Object.keys(ANGRA_PART_ANCHORS)).toEqual([IDS.TAWRICH_ID, IDS.ZARICH_ID]);
    const [t, z] = [ANGRA_PART_ANCHORS[IDS.TAWRICH_ID]!, ANGRA_PART_ANCHORS[IDS.ZARICH_ID]!];
    if (t.mode !== 'overhead' || z.mode !== 'overhead') throw new Error('the arms hang overhead: no painting of theirs to anchor on');
    expect(t.offset[0]).toBeLessThan(0);
    expect(z.offset[0]).toBeGreaterThan(0);
    expect(t.offset[1]).toBe(z.offset[1]);
  });
});

describe('the three records (§2.1 to §2.4)', () => {
  it('Angra Mainyu: level 47, 333,444 HP, 9,999 MP, Str 73 / Def 97 / Mag 124 / MDef 114 / Agi 68 / Eva 0 / Acc 2 / Luck 0; immune to Gravity; the boss', () => {
    const e = x2AngraMainyu;
    expect([e.level, e.hp, e.mp, ANGRA_HP]).toEqual([47, 333_444, 9_999, 333_444]);
    expect(e.stats).toEqual({ hp: 333_444, mp: 9_999, maxHp: 333_444, maxMp: 9_999, str: 73, def: 97, mag: 124, mdef: 114, agi: 68, eva: 0, acc: 2, luck: 0 });
    expect(e.affinities).toEqual({ gravity: 'immune' });
    expect(e.immunities?.darkness).toBe(255); // his one sourced status immunity (§2.1)
    expect(e.autoStatuses).toBeUndefined();
    expect(e.flags).toEqual({ isBoss: true });
  });

  it('his rewards: 5,000 EXP, 30 AP, 5,000 gil, Pilfer Gil 2,000; steal a Megalixir (no rare item: the same in both slots); drop the Ribbon, a held row the item list carries', () => {
    const r = x2AngraMainyu.rewards;
    expect([r.exp, r.ap, r.gil, r.stolenGil]).toEqual([5_000, 30, 5_000, 2_000]);
    expect(r.drops).toEqual([{ itemId: 'ribbon', count: 1 }]);
    expect(r.steal).toMatchObject({ common: { itemId: 'x2-megalixir', count: 1 }, rare: { itemId: 'x2-megalixir', count: 1 } });
    expect(heldItems.find((i) => i.id === 'ribbon')?.name).toBe('Ribbon');
    expect(ITEMS['ribbon']?.name).toBe('Ribbon');
  });

  it('the arms: 5,440 HP each (conflict A-3 resolved to the FF Wiki\'s), 9,999 MP; Tawrich level 38 and Zarich 36; the §2.4 estimates; parts of the body that pay nothing', () => {
    expect(ARM_HP).toBe(5_440);
    expect([x2Tawrich.level, x2Zarich.level]).toEqual([38, 36]);
    expect(x2Tawrich.stats).toEqual({ hp: 5_440, mp: 9_999, maxHp: 5_440, maxMp: 9_999, str: 85, def: 99, mag: 42, mdef: 1, agi: 113, eva: 0, acc: 99, luck: 0 });
    expect(x2Zarich.stats).toEqual({ hp: 5_440, mp: 9_999, maxHp: 5_440, maxMp: 9_999, str: 42, def: 70, mag: 85, mdef: 99, agi: 82, eva: 0, acc: 99, luck: 0 });
    for (const arm of [x2Tawrich, x2Zarich]) {
      expect(arm.flags, arm.id).toEqual({ isPart: true, partOf: IDS.ANGRA_ID });
      expect([arm.rewards.exp, arm.rewards.ap, arm.rewards.gil, arm.rewards.drops], arm.id).toEqual([0, 0, 0, []]);
      expect(arm.rewards.steal, arm.id).toBeUndefined();
    }
  });

  it('the guards are permanent automatic statuses: Null Magic on Tawrich, Null Physical on Zarich (§2.2, §2.3)', () => {
    expect(x2Tawrich.autoStatuses).toEqual(['null-magic']);
    expect(x2Zarich.autoStatuses).toEqual(['null-physical']);
  });

  it('their lists: his six moves; Tawrich Punch and Bloody Breath; Zarich the four -ara, the four -aga (Fire, Ice, Thunder, Water) and Glimmer of Despair', () => {
    expect(x2AngraMainyu.abilityIds).toEqual(Object.values(IDS.ANGRA_ABILITY));
    expect(x2Tawrich.abilityIds).toEqual(Object.values(IDS.TAWRICH_ABILITY));
    expect(x2Zarich.abilityIds).toEqual([...IDS.ZARICH_ABILITY.ara, ...IDS.ZARICH_ABILITY.aga, IDS.ZARICH_ABILITY.glimmer]);
    expect(IDS.ZARICH_ABILITY.ara.map((id) => ability(id).element)).toEqual([['fire'], ['ice'], ['lightning'], ['water']]);
    expect(IDS.ZARICH_ABILITY.aga.map((id) => ability(id).element)).toEqual([['fire'], ['ice'], ['lightning'], ['water']]);
  });

  it('the formation: the body, the two arms as parts, no escape, the aeon cue, and 3 s of action time by precedent (D-846), registered', () => {
    expect(angraMainyuGroup.enemies).toEqual([x2AngraMainyu]);
    expect(angraMainyuGroup.parts).toEqual([x2Tawrich, x2Zarich]);
    expect([angraMainyuGroup.id, angraMainyuGroup.bossId, angraMainyuGroup.canEscape, angraMainyuGroup.game]).toEqual([IDS.ANGRA_MAINYU_GROUP_ID, IDS.ANGRA_ID, false, 'ffx2']);
    expect(angraMainyuGroup.musicCues).toEqual([{ at: 'start', track: 'boss-ffx2-fallen-aeons', fadeMs: 800 }]);
    expect([ANGRA_ACTION_TIME_ON, ANGRA_ACTION_TIME_SECONDS, angraMainyuGroup.actionTimeSeconds]).toEqual([true, 3, 3]);
    expect(ENEMY_GROUPS_BY_ID[IDS.ANGRA_MAINYU_GROUP_ID]).toBe(angraMainyuGroup);
  });

  it('the chapter duplicates the records\' Sensor lines; the guide page prints their HP, steal and drop', () => {
    for (const e of [x2AngraMainyu, x2Tawrich, x2Zarich]) expect(chapter.sensorTexts?.[e.id], e.id).toBe(e.sensorText);
    const loot = FFX2_ANGRA_MAINYU_DOC.blocks.flatMap((b) => (b.t === 'loot' ? b.rows : []));
    expect(loot).toEqual([
      { enemy: 'Angra Mainyu', hp: '333,444', steal: 'Megalixir', drop: 'Ribbon' },
      { enemy: 'Tawrich', hp: '5,440', steal: 'None', drop: 'None' },
      { enemy: 'Zarich', hp: '5,440', steal: 'None', drop: 'None' },
    ]);
    expect(ITEMS['x2-megalixir']?.name).toBe('Megalixir');
  });
});

describe('the moves (§3) and the rows they run on', () => {
  it('Perdition\'s Flame: ten hits on random girls, 3/16 of her maximum HP each (formula 7), physical so Protect halves each hit, never misses; Trema\'s Meteor\'s charge and recovery', () => {
    const f = ability(IDS.ANGRA_ABILITY.perditionsFlame);
    expect([f.formula, f.power, f.hits, f.targeting, f.damageType, f.canMiss]).toEqual(['percent-total', 3, 10, 'random-enemy', 'physical', false]);
    expect([f.chargeTicks, f.recoveryTicks]).toEqual([PERDITIONS_FLAME.chargeTicks, PERDITIONS_FLAME.recoveryTicks]);
  });

  it('the hit rule (hard rule 5): every move but Punch carries canMiss false; Punch, the one physical blow, rolls', () => {
    for (const id of ALL_MOVES) {
      if (id === IDS.TAWRICH_ABILITY.punch) expect(ability(id).canMiss, id).not.toBe(false);
      else expect(ability(id).canMiss, id).toBe(false);
    }
  });

  it('Bloody Breath brings Confusion, Silence, Darkness and Poison to every girl (each at 50, [estimate]); Glimmer of Despair drains 3/16 of each girl\'s MP and lowers four stats a stage', () => {
    const breath = ability(IDS.TAWRICH_ABILITY.bloodyBreath);
    expect([breath.targeting, breath.power]).toEqual(['all-enemies', 0]);
    expect(breath.statusEffects.map((s) => [s.status, s.chance])).toEqual([['confuse', 50], ['silence', 50], ['darkness', 50], ['poison', 50]]);
    const glimmer = ability(IDS.ZARICH_ABILITY.glimmer);
    expect([glimmer.targeting, glimmer.formula, glimmer.power, glimmer.extra]).toEqual(['all-enemies', 'percent-current', 3, { mpOnly: true }]);
    expect(glimmer.statusEffects.map((s) => s.status)).toEqual(['str-down', 'mag-down', 'def-down', 'mdef-down']);
  });

  it('Full-Life raises one of his fallen arms (a dead target only); Osmose takes MP and gives it to him; Curaga is on himself', () => {
    const life = ability(IDS.ANGRA_ABILITY.fullLife);
    expect([life.targeting, life.flags]).toEqual(['single-ally', ['heals', 'can-target-dead', 'misses-if-target-alive']]);
    const osmose = ability(IDS.ANGRA_ABILITY.osmose);
    expect([osmose.flags, osmose.extra]).toEqual([['drains-mp'], { mpOnly: true }]);
    expect(ability(IDS.ANGRA_ABILITY.curaga).targeting).toBe('self');
  });

  it('every stand-in row is a copy of the row its users carry (the table is the source), registered in the command table; the four moves with no row are derived', () => {
    for (const [id, from] of Object.entries(ANGRA_STAND_IN_FROM)) {
      const source = COMMAND_RECORDS_ENEMIES[from] ?? COMMAND_RECORDS_PARTY[from];
      expect(source, from).toBeDefined();
      expect(COMMAND_RECORDS_ANGRA_MAINYU[id], id).toEqual(source);
      expect(COMMAND_RECORDS_ANGRA_MAINYU[id], id).not.toBe(source); // a copy, never the shared object
      expect(FFX2_COMMAND_RECORDS[id], id).toEqual(source);
    }
    expect(Object.keys(ANGRA_STAND_IN_FROM).sort()).toEqual(Object.keys(COMMAND_RECORDS_ANGRA_MAINYU).sort());
    for (const id of [IDS.ANGRA_ABILITY.perditionsFlame, IDS.TAWRICH_ABILITY.punch, IDS.TAWRICH_ABILITY.bloodyBreath, IDS.ZARICH_ABILITY.glimmer]) expect(FFX2_COMMAND_RECORDS[id], id).toBeUndefined();
  });

  it('every move is in the content the engine loads, once', () => {
    for (const id of ALL_MOVES) expect(ABILITIES[id], id).toBe(ability(id));
    expect(new Set(ALL_MOVES).size).toBe(angraMainyuAbilities.length);
  });
});

describe('the chapter is a hidden experiment: no card, no count, no save', () => {
  it('registered with the experiments and not with the eighteen; number 26; FFX-2; experimental; the Chapter 5 preset; the formation; the story', () => {
    expect(chapter).toBe(FFX2_ANGRA_MAINYU);
    expect(EXPERIMENT_CHAPTERS.map((c) => c.id)).toContain(IDS.ANGRA_MAINYU_ID);
    expect(CHAPTERS.map((c) => c.id)).not.toContain(IDS.ANGRA_MAINYU_ID);
    expect((CHAPTER_IDS as readonly string[]).includes(IDS.ANGRA_MAINYU_ID)).toBe(false);
    expect([chapter.number, chapter.game, chapter.experimental]).toEqual([26, 'ffx2', true]);
    expect(chapter.buildRef).toBe(farplaneBuild);
    expect(chapter.enemyGroupRef).toBe(angraMainyuGroup);
    expect(chapter.scriptsRef).toBe(ffx2AngraMainyuScripts);
    expect([chapter.title, chapter.subtitle, chapter.location, chapter.blurb]).toEqual([ANGRA_MAINYU_TEXT.title, ANGRA_MAINYU_TEXT.subtitle, ANGRA_MAINYU_TEXT.location, ANGRA_MAINYU_TEXT.blurb]);
  });

  it('its pause metadata is the hidden one: EXP, FFX-2, three objectives the objective reader answers, the stand-in painting, and no placeholder anywhere', () => {
    expect(UNLISTED_CHAPTER_META.find((m) => m.id === IDS.ANGRA_MAINYU_ID)).toBe(ANGRA_MAINYU_META);
    expect([ANGRA_MAINYU_META.numeral, ANGRA_MAINYU_META.gameLabel]).toEqual(['EXP', 'FFX-2']);
    expect(ANGRA_MAINYU_META.objectives.map((o) => o.rule)).toEqual([
      { kind: 'survived-ability', ability: IDS.ANGRA_ABILITY.perditionsFlame },
      { kind: 'parts-downed', targetIds: [IDS.TAWRICH_ID, IDS.ZARICH_ID] },
      { kind: 'victory' },
    ]);
    expect(ANGRA_MAINYU_META.heroArtFallback).toBe(`characters/${IDS.ANGRA_STAND_IN_ART}/idle.png`);
    for (const file of ['chapter-ffx2-angra-mainyu.ts', 'chapter-meta-ffx2-angra-mainyu.ts', 'angra-mainyu-ids.ts', join('ffx2', 'enemies', 'angra-mainyu.ts'), join('ffx2', 'enemies', 'angra-mainyu-abilities.ts')])
      expect(readFileSync(join(REPO, 'src', 'data', file), 'utf8'), file).not.toMatch(/PLACEHOLDER/);
  });

  it('the music: the FFX-2 field bed for the scenes, our aeon cue for the fight (the role the game gives "Aeons", §8), the FFX-2 fanfare; every key is a track', () => {
    expect([chapter.music.scene, chapter.music.battle, chapter.music.victory]).toEqual(['scene-bevelle-underground', 'boss-ffx2-fallen-aeons', 'victory-ffx2']);
    for (const key of [chapter.music.scene, chapter.music.battle, chapter.music.victory, ...ANGRA_MAINYU_META.musicKeys]) expect(TRACKS[key as string], String(key)).toBeDefined();
  });

  it('the guide card and the guide page are the chapter\'s; every card line cites a research note, and the short rules fit one line', () => {
    expect(guideForChapter(IDS.ANGRA_MAINYU_ID)).toBe(FFX2_ANGRA_MAINYU_GUIDE);
    expect(docForChapter(IDS.ANGRA_MAINYU_ID)).toBe(FFX2_ANGRA_MAINYU_DOC);
    const cites = [...FFX2_ANGRA_MAINYU_GUIDE.rules, ...FFX2_ANGRA_MAINYU_GUIDE.hints, ...FFX2_ANGRA_MAINYU_GUIDE.phases, ...FFX2_ANGRA_MAINYU_GUIDE.watch].map((x) => x.cite);
    for (const c of cites) expect(c).toMatch(/^ffx2-angra-mainyu §/);
    for (const r of FFX2_ANGRA_MAINYU_GUIDE.rules) expect(r.short.length, r.short).toBeLessThanOrEqual(52);
  });
});
