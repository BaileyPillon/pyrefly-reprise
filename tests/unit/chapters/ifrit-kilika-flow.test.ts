/**
 * Ifrit at Kilika Temple (FFX-2 Chapter 3, the hidden chapter): the flow around the fight. **FFX-2 only** [AGENTS.md rule 14].
 *
 * 1. **The setup**: `setupForChapter` hands the engine the chapter's party and his one formation, no escape, and the two story triggers.
 * 2. **The triggers**: each fires once, on his first Meteor Strike and on his first Hellfire (and never twice), as the real engine plays the fight with the shipped advisor line.
 * 3. **The stage**: the chapter's scene key is the registered Chamber of the Fayth, and Ifrit has his own spot on it, the same one Ixion and Valefor stand on (staging, ours; the plate is Bailey's approved Djose pick,
 *    D-273, the provisional stand-in for Kilika's own chamber).
 * 4. **The store**: an attempt and a clear go to the experiments' own store (`pyrefly-reprise:experiments:v1`), never the save (`pyrefly-reprise:save:v1`): no save change, no migration.
 */
import { describe, expect, it } from 'vitest';

import type { BattleEvent } from '../../../src/battle/common/types.ts';
import { FFX2Engine } from '../../../src/battle/ffx2/index.ts';
import { setupForChapter } from '../../../src/app/screens/BattleScreenSetup.ts';
import { EXPERIMENTS_KEY, experimentProgress, experimentRecord, setExperimentStorageForTests } from '../../../src/app/experiments/experimentRecords.ts';
import { SAVE_KEY } from '../../../src/app/SaveData.ts';
import { kilikaBuild } from '../../../src/data/ffx2/builds/kilika.ts';
import { FFX2_IFRIT_KILIKA, IFRIT_KILIKA_ID } from '../../../src/data/chapter-ffx2-ifrit-kilika.ts';
import { IFRIT_ID, kilikaIfritGroup } from '../../../src/data/ffx2/enemies/ifrit.ts';
import { IFRIT_HELLFIRE_ID, IFRIT_METEOR_STRIKE_ID } from '../../../src/data/ffx2/enemies/ifrit-abilities.ts';
import { DJOSE_CHAMBER_PLATE } from '../../../src/data/ixion-plates.ts';
import { DJOSE_IFRIT_ID, DJOSE_IXION_ID, DJOSE_SPOTS, DJOSE_VALEFOR_ID } from '../../../src/scenes/djose-chamber.ts';
import { getScene, getSceneFactory } from '../../../src/scenes/index.ts';
import { ffx2Options } from '../helpers/ffx2ChapterDrive.ts';
import { ffx2IfritKilika } from '../../../src/engine/tactics/ffx2-ifrit-kilika.ts';

describe('the one-fight setup', () => {
  it('plays the chapter\'s preset against his one formation, cannot be fled, and carries the two triggers', () => {
    const setup = setupForChapter(FFX2_IFRIT_KILIKA, 7);
    expect(setup).toMatchObject({ game: 'ffx2', seed: 7, condition: 'normal', canEscape: false });
    expect(setup.party).toBe(kilikaBuild);
    expect(setup.enemies).toBe(kilikaIfritGroup);
    expect(setup.triggers.map((t) => t.id)).toEqual(['first-meteor-strike', 'first-hellfire']);
    expect(FFX2_IFRIT_KILIKA.enemyGroupRef.nextGroupId).toBeUndefined(); // one link: no chain, no second act, no checkpoint
  });
});

describe('the story triggers fire once each in the real engine', () => {
  it('"first-meteor-strike" on his first Meteor Strike and "first-hellfire" on his first Hellfire, each exactly once, over a whole fight', () => {
    for (const seed of [1, 2, 3, 4]) {
      const engine = new FFX2Engine(ffx2Options({ atbMode: 'wait' }));
      engine.setSeed(seed);
      engine.init(setupForChapter(FFX2_IFRIT_KILIKA, seed));
      for (let i = 0; i < 40_000; i++) {
        const d = engine.nextDecision();
        if (d.kind === 'battle-over') break;
        if (d.kind === 'waiting') {
          engine.tick(Math.max(1, d.nextEventMs));
          continue;
        }
        if (d.kind !== 'player-input') continue;
        engine.submit(ffx2IfritKilika(d.actorId, d.commands, engine) ?? { kind: 'defend', targets: [] });
      }
      const log = engine.state().log as readonly (BattleEvent & { name?: string; abilityId?: string; actorId?: string })[];
      const fired = log.filter((e) => e.type === 'script-trigger').map((e) => e.name);
      const meteors = log.filter((e) => e.type === 'action-start' && e.actorId === IFRIT_ID && e.abilityId === IFRIT_METEOR_STRIKE_ID).length;
      const hellfires = log.filter((e) => e.type === 'action-start' && e.actorId === IFRIT_ID && e.abilityId === IFRIT_HELLFIRE_ID).length;
      expect(fired.filter((n) => n === 'first-meteor-strike'), `seed ${seed}`).toHaveLength(meteors > 0 ? 1 : 0);
      expect(fired.filter((n) => n === 'first-hellfire'), `seed ${seed}`).toHaveLength(hellfires > 0 ? 1 : 0);
      expect(meteors, `seed ${seed}: the fight reached his first Meteor Strike`).toBeGreaterThan(0);
      if (hellfires > 0) expect(fired.indexOf('first-meteor-strike')).toBeLessThan(fired.indexOf('first-hellfire')); // the first Meteor comes first (the gauge's 30 mark before its 100)
    }
  });
});

describe('the stage: the Chamber of the Fayth, with Ifrit on Ixion\'s spot', () => {
  it('the scene key is the registered Chamber plate (Bailey\'s approved Djose pick, the provisional stand-in for Kilika), with a factory', () => {
    expect(FFX2_IFRIT_KILIKA.sceneKey).toBe(DJOSE_CHAMBER_PLATE);
    const scene = getScene(FFX2_IFRIT_KILIKA.sceneKey);
    expect(scene, 'registered').toBeDefined();
    expect(scene!.placeholder).toBe(false);
    expect(getSceneFactory(FFX2_IFRIT_KILIKA.sceneKey), 'has a factory').toBeDefined();
  });

  it('his id has a spot in the Chamber\'s map: the same spot Ixion and Valefor stand on, in the registered slots too', () => {
    expect(DJOSE_IFRIT_ID).toBe(IFRIT_ID);
    expect(DJOSE_SPOTS[DJOSE_IFRIT_ID]).toEqual(DJOSE_SPOTS[DJOSE_IXION_ID]);
    expect(DJOSE_SPOTS[DJOSE_IFRIT_ID]).toEqual(DJOSE_SPOTS[DJOSE_VALEFOR_ID]);
    const slots = getScene(FFX2_IFRIT_KILIKA.sceneKey)!.slots as { enemySpots?: Record<string, [number, number, number]> };
    expect(slots.enemySpots?.[IFRIT_ID]).toEqual(slots.enemySpots?.[DJOSE_IXION_ID]);
  });
});

describe('the experiments\' store, never the save', () => {
  it('an attempt and a clear are kept under the chapter\'s id in the experiments\' key, and the save key is never written', () => {
    const written = new Map<string, string>();
    const fake = { getItem: (k: string): string | null => written.get(k) ?? null, setItem: (k: string, v: string): void => void written.set(k, v) };
    try {
      setExperimentStorageForTests(fake);
      expect(experimentRecord(IFRIT_KILIKA_ID)).toMatchObject({ attempts: 0, clears: 0, bestTimeMs: null });
      experimentProgress.recordAttempt(IFRIT_KILIKA_ID);
      experimentProgress.recordClear(IFRIT_KILIKA_ID, 91_000, 20);
      experimentProgress.recordAttempt(IFRIT_KILIKA_ID);
      experimentProgress.recordClear(IFRIT_KILIKA_ID, 120_000, 24);
      expect(experimentRecord(IFRIT_KILIKA_ID)).toMatchObject({ attempts: 2, clears: 2, bestTimeMs: 91_000 });
      expect([...written.keys()]).toEqual([EXPERIMENTS_KEY]);
      expect(written.has(SAVE_KEY)).toBe(false);
      expect(Object.keys(JSON.parse(written.get(EXPERIMENTS_KEY)!) as Record<string, unknown>)).toEqual([IFRIT_KILIKA_ID]);
    } finally {
      setExperimentStorageForTests(undefined);
    }
  });
});
