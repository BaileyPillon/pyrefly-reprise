/**
 * The Experiment's upgrade model and the two acts it makes (FFX-2 only; the hidden chapter "The Experiment", mission Masterpiece Theatre).
 *
 * The driver's pick (2026-10-10) is concept B, the game's own two-act Rematch: Act I is the machine at 1 / 1 / 1, Act II the full weapon at 5 / 5 / 5, a retry checkpoint between them.
 * There is no chosen-levels path; the per-level model is internal, and this pins it from the pure data (no DOM, no engine run; `experiment-engine.test.ts` plays the fight):
 *
 * 1. **The tables**: Attack sets Strength and Magic, Defense sets Defense and Magic Defense, Special sets the script and the action list; HP, Agility and the level never move.
 * 2. **The two acts**: two formations chained by `nextGroupId`, each registered by id; Act II restores the party and is the retry checkpoint; the bodies have their own ids and paintings.
 * 3. **The chapter record**: hidden, FFX-2, number 20, the experiments' store, Act I first.
 * 4. **No upgrade path survived**: the record is plain data (no accessor following a player's choice).
 */
import { describe, expect, it } from 'vitest';

import {
  ACT_I_LEVELS,
  ACT_II_LEVELS,
  ATTACK_TRACK,
  DEFENSE_TRACK,
  EXPERIMENT_ACTIONS,
  UPGRADE_LEVELS,
  UPGRADE_TRACKS,
  experimentActionIds,
  experimentScriptId,
  levelsKey,
  type ExperimentLevels,
} from '../../../src/data/ffx2/enemies/experiment-levels.ts';
import {
  DJOSE_EXPERIMENT_1,
  DJOSE_EXPERIMENT_2,
  EXPERIMENT_BODY_IDS,
  EXPERIMENT_ENEMY_ID,
  EXPERIMENT_HP,
  EXPERIMENT_PROTOTYPE_ID,
  EXPERIMENT_PROTOTYPE_SPRITE,
  EXPERIMENT_SPRITE,
  experimentActOneGroup,
  experimentActTwoGroup,
  experimentEnemy,
  experimentFormationAt,
  experimentGroups,
} from '../../../src/data/ffx2/enemies/experiment.ts';
import { ABILITIES, ENEMY_GROUPS_BY_ID } from '../../../src/data/ffx2/index.ts';
import { CHAPTERS, EXPERIMENT_CHAPTERS, getChapter } from '../../../src/data/encounters.ts';
import { FFX2_EXPERIMENT } from '../../../src/data/chapter-ffx2-experiment.ts';
import { aiScriptFor } from '../../../src/battle/ffx2/ai/index.ts';

describe('the tables (internal: they make the two acts)', () => {
  it('three tracks, Level 1 to 5, each an increasing ladder', () => {
    expect(UPGRADE_TRACKS).toEqual(['attack', 'defense', 'special']);
    expect(UPGRADE_LEVELS).toEqual([1, 2, 3, 4, 5]);
    const ladder = (xs: readonly number[]): boolean => xs.every((x, i) => i === 0 || x > xs[i - 1]!);
    expect(ladder(UPGRADE_LEVELS.map((l) => ATTACK_TRACK[l].str))).toBe(true);
    expect(ladder(UPGRADE_LEVELS.map((l) => ATTACK_TRACK[l].mag))).toBe(true);
    expect(ladder(UPGRADE_LEVELS.map((l) => DEFENSE_TRACK[l].def))).toBe(true);
    expect(ladder(UPGRADE_LEVELS.map((l) => DEFENSE_TRACK[l].mdef))).toBe(true);
  });

  it('the source tables, to the number (research §3.2: SinirothX, Jegged and the wiki agree)', () => {
    expect(UPGRADE_LEVELS.map((l) => [ATTACK_TRACK[l].str, ATTACK_TRACK[l].mag])).toEqual([[112, 1], [130, 20], [155, 45], [180, 72], [215, 100]]);
    expect(UPGRADE_LEVELS.map((l) => [DEFENSE_TRACK[l].def, DEFENSE_TRACK[l].mdef])).toEqual([[1, 1], [50, 50], [100, 100], [150, 150], [205, 205]]);
  });

  it("the two acts are the game's own pair: all 1s, then all 5s", () => {
    expect(ACT_I_LEVELS).toEqual({ attack: 1, defense: 1, special: 1 });
    expect(ACT_II_LEVELS).toEqual({ attack: 5, defense: 5, special: 5 });
    expect(levelsKey(ACT_I_LEVELS)).toBe('1-1-1');
    expect(levelsKey(ACT_II_LEVELS)).toBe('5-5-5');
  });

  it('only the Attack track moves Strength and Magic, only Defense moves Defense and Magic Defense, only Special moves the script and the actions', () => {
    const at = (attack: ExperimentLevels['attack'], defense: ExperimentLevels['defense'], special: ExperimentLevels['special']): ReturnType<typeof experimentEnemy> =>
      experimentEnemy({ attack, defense, special });
    const base = at(3, 3, 3);
    const moreAttack = at(4, 3, 3);
    expect([moreAttack.stats.str, moreAttack.stats.mag]).toEqual([ATTACK_TRACK[4].str, ATTACK_TRACK[4].mag]);
    expect({ ...moreAttack.stats, str: 0, mag: 0 }).toEqual({ ...base.stats, str: 0, mag: 0 });
    expect(moreAttack.aiScriptId).toBe(base.aiScriptId);
    const moreDefense = at(3, 4, 3);
    expect([moreDefense.stats.def, moreDefense.stats.mdef]).toEqual([DEFENSE_TRACK[4].def, DEFENSE_TRACK[4].mdef]);
    expect({ ...moreDefense.stats, def: 0, mdef: 0 }).toEqual({ ...base.stats, def: 0, mdef: 0 });
    const moreSpecial = at(3, 3, 4);
    expect(moreSpecial.stats).toEqual(base.stats);
    expect(moreSpecial.aiScriptId).toBe(experimentScriptId(4));
    expect(moreSpecial.aiScriptId).not.toBe(base.aiScriptId);
  });

  it('HP, Agility and the level are the same at every level; the HP is 18,324', () => {
    for (const l of UPGRADE_LEVELS) {
      const e = experimentEnemy({ attack: l, defense: l, special: l });
      expect([e.stats.maxHp, e.stats.hp, e.hp, e.stats.agi, e.level]).toEqual([EXPERIMENT_HP, EXPERIMENT_HP, EXPERIMENT_HP, 68, 50]);
    }
    expect(EXPERIMENT_HP).toBe(18324);
  });

  it('the actions each Special level can use; every one is a registered ability, and every script is registered', () => {
    expect(UPGRADE_LEVELS.map((l) => experimentActionIds(l).length)).toEqual([1, 2, 3, 3, 4]);
    expect(experimentActionIds(1)).toEqual([EXPERIMENT_ACTIONS.attack]);
    expect(experimentActionIds(5)).toEqual([EXPERIMENT_ACTIONS.attack, EXPERIMENT_ACTIONS.rocketLauncher[3], EXPERIMENT_ACTIONS.lifeslicer, EXPERIMENT_ACTIONS.annihilator]);
    for (const l of UPGRADE_LEVELS) {
      for (const id of experimentActionIds(l)) expect(ABILITIES[id], id).toBeDefined();
      expect(aiScriptFor(experimentScriptId(l)).id, `script for Special ${l}`).toBe(experimentScriptId(l));
    }
  });

  it("every one of the 125 states builds a formation with one boss and the right script", () => {
    let n = 0;
    for (const attack of UPGRADE_LEVELS) for (const defense of UPGRADE_LEVELS) for (const special of UPGRADE_LEVELS) {
      const levels = { attack, defense, special };
      const group = experimentFormationAt(levels);
      expect(group.enemies, levelsKey(levels)).toHaveLength(1);
      const boss = group.enemies[0]!;
      expect(boss.aiScriptId).toBe(experimentScriptId(special));
      expect(group.canEscape).toBe(false);
      n++;
    }
    expect(n).toBe(125);
  });
});

describe('the two acts', () => {
  it('Act I chains to Act II; both are registered by id and are the only formations the chapter has', () => {
    expect(experimentActOneGroup.id).toBe(DJOSE_EXPERIMENT_1);
    expect(experimentActTwoGroup.id).toBe(DJOSE_EXPERIMENT_2);
    expect(experimentActOneGroup.nextGroupId).toBe(DJOSE_EXPERIMENT_2);
    expect(experimentActTwoGroup.nextGroupId).toBeUndefined();
    expect(experimentGroups).toEqual([experimentActOneGroup, experimentActTwoGroup]);
    expect(ENEMY_GROUPS_BY_ID[DJOSE_EXPERIMENT_1]).toBe(experimentActOneGroup);
    expect(ENEMY_GROUPS_BY_ID[DJOSE_EXPERIMENT_2]).toBe(experimentActTwoGroup);
    for (const g of experimentGroups) expect([g.game, g.canEscape, g.enemies.length]).toEqual(['ffx2', false, 1]);
  });

  it('Act I is the prototype at 1 / 1 / 1: a plain strike, Defense 1', () => {
    const boss = experimentActOneGroup.enemies[0]!;
    expect([boss.id, boss.spriteKey]).toEqual([EXPERIMENT_PROTOTYPE_ID, EXPERIMENT_PROTOTYPE_SPRITE]);
    expect([boss.stats.str, boss.stats.mag, boss.stats.def, boss.stats.mdef]).toEqual([112, 1, 1, 1]);
    expect(boss.aiScriptId).toBe('x2-experiment-special-1');
    expect(boss.abilityIds).toEqual([EXPERIMENT_ACTIONS.attack]);
  });

  it('Act II is the full weapon at 5 / 5 / 5: the whole loop, Defense and Magic Defense 205', () => {
    const boss = experimentActTwoGroup.enemies[0]!;
    expect([boss.id, boss.spriteKey]).toEqual([EXPERIMENT_ENEMY_ID, EXPERIMENT_SPRITE]);
    expect([boss.stats.str, boss.stats.mag, boss.stats.def, boss.stats.mdef]).toEqual([215, 100, 205, 205]);
    expect(boss.aiScriptId).toBe('x2-experiment-special-5');
    expect(boss.abilityIds).toEqual(experimentActionIds(5));
  });

  it('Act II is the retry checkpoint and restores the party; Act I is neither', () => {
    expect(experimentActTwoGroup.restoresPartyOnEntry).toBe(true);
    expect(experimentActOneGroup.restoresPartyOnEntry).toBeUndefined();
    expect(experimentActOneGroup.checkpointOnEntry).toBeUndefined();
  });

  it("the two bodies have their own combatant ids and paintings (a trigger on Act I's fall cannot fire on Act II's)", () => {
    expect(EXPERIMENT_BODY_IDS).toEqual([EXPERIMENT_PROTOTYPE_ID, EXPERIMENT_ENEMY_ID]);
    expect(new Set(EXPERIMENT_BODY_IDS).size).toBe(2);
    expect(EXPERIMENT_PROTOTYPE_SPRITE).not.toBe(EXPERIMENT_SPRITE);
    expect([EXPERIMENT_SPRITE, EXPERIMENT_PROTOTYPE_SPRITE]).toEqual(['ffx2-experiment', 'ffx2-experiment-proto']); // the art brief's subject names
  });

  it('each act has its own existing music cue; no new audio', () => {
    expect(experimentActOneGroup.musicCues).toEqual([{ at: 'start', track: 'boss-ffx2-aeon', fadeMs: 800 }]);
    expect(experimentActTwoGroup.musicCues).toEqual([{ at: 'start', track: 'boss-vegnagun', fadeMs: 1400 }]);
  });
});

describe('the chapter record', () => {
  it('is hidden: in EXPERIMENT_CHAPTERS, found by getChapter, not in CHAPTERS; experimental, FFX-2, number 20; Act I is its formation', () => {
    expect(EXPERIMENT_CHAPTERS).toContain(FFX2_EXPERIMENT);
    expect(getChapter('ffx2-masterpiece-theatre')).toBe(FFX2_EXPERIMENT);
    expect(CHAPTERS).not.toContain(FFX2_EXPERIMENT);
    expect(FFX2_EXPERIMENT).toMatchObject({ id: 'ffx2-masterpiece-theatre', game: 'ffx2', experimental: true, number: 20, sceneKey: 'ffx2-experiment-grounds' });
    expect(FFX2_EXPERIMENT.enemyGroupRef).toBe(experimentActOneGroup);
  });

  it("plays the Chapter V preset, and the music names Act II's cue as the second phase", () => {
    expect(FFX2_EXPERIMENT.buildRef.game).toBe('ffx2');
    expect(FFX2_EXPERIMENT.music).toEqual({ scene: 'scene-bevelle-underground', battle: 'boss-ffx2-aeon', phase2: 'boss-vegnagun', victory: 'victory-ffx2' });
  });

  it('has a Sensor line for each body, in twenty words or fewer', () => {
    expect(Object.keys(FFX2_EXPERIMENT.sensorTexts).sort()).toEqual([...EXPERIMENT_BODY_IDS].sort());
    for (const text of Object.values(FFX2_EXPERIMENT.sensorTexts)) expect(text.split(/\s+/).length).toBeLessThanOrEqual(20);
  });

  it("is a plain record: nothing reads a player's choice of levels (no accessor, no session store)", () => {
    const desc = Object.getOwnPropertyDescriptor(FFX2_EXPERIMENT, 'enemyGroupRef');
    expect(desc?.get).toBeUndefined();
    expect(desc?.value).toBe(experimentActOneGroup);
  });
});
