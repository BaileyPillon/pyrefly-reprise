/**
 * Valefor at Besaid (FFX-2 Chapter 3, the hidden chapter): the flow around the fight. **FFX-2 only** [AGENTS.md rule 14].
 *
 * 1. **The setup**: `setupForChapter` hands the engine the chapter's party and her one formation, no escape, and the two story triggers.
 * 2. **The triggers**: each fires once, on her first Energy Ray and on her first Energy Blast (and never twice), as the real engine plays the fight.
 * 3. **The stage**: the chapter's scene key is the registered Chamber of the Fayth, and Valefor has her own spot on it, the same one Ixion stands on (staging, ours; the plate is Bailey's approved Djose
 *    pick, D-273, the provisional stand-in for Besaid's own chamber).
 * 4. **The store**: an attempt and a clear go to the experiments' own store (`pyrefly-reprise:experiments:v1`), never the save (`pyrefly-reprise:save:v1`): no save change, no migration.
 */
import { describe, expect, it } from 'vitest';

import type { BattleEvent } from '../../../src/battle/common/types.ts';
import { FFX2Engine } from '../../../src/battle/ffx2/index.ts';
import { setupForChapter } from '../../../src/app/screens/BattleScreenSetup.ts';
import { EXPERIMENTS_KEY, experimentProgress, experimentRecord, setExperimentStorageForTests } from '../../../src/app/experiments/experimentRecords.ts';
import { SAVE_KEY } from '../../../src/app/SaveData.ts';
import { besaidBuild } from '../../../src/data/ffx2/builds/besaid.ts';
import { FFX2_VALEFOR_BESAID, VALEFOR_BESAID_ID } from '../../../src/data/chapter-ffx2-valefor-besaid.ts';
import { besaidValeforGroup, VALEFOR_ID } from '../../../src/data/ffx2/enemies/valefor.ts';
import { DJOSE_CHAMBER_PLATE } from '../../../src/data/ixion-plates.ts';
import { DJOSE_IXION_ID, DJOSE_SPOTS, DJOSE_VALEFOR_ID } from '../../../src/scenes/djose-chamber.ts';
import { getScene, getSceneFactory } from '../../../src/scenes/index.ts';
import { ffx2Options } from '../helpers/ffx2ChapterDrive.ts';
import { ffx2ValeforBesaid } from '../../../src/engine/tactics/ffx2-valefor-besaid.ts';

describe('the one-fight setup', () => {
  it('plays the chapter\'s preset against her one formation, cannot be fled, and carries the two triggers', () => {
    const setup = setupForChapter(FFX2_VALEFOR_BESAID, 7);
    expect(setup).toMatchObject({ game: 'ffx2', seed: 7, condition: 'normal', canEscape: false });
    expect(setup.party).toBe(besaidBuild);
    expect(setup.enemies).toBe(besaidValeforGroup);
    expect(setup.triggers.map((t) => t.id)).toEqual(['first-energy-ray', 'first-energy-blast']);
    expect(FFX2_VALEFOR_BESAID.enemyGroupRef.nextGroupId).toBeUndefined(); // one link: no chain, no second act, no checkpoint
  });
});

describe('the story triggers fire once each in the real engine', () => {
  it('"first-energy-ray" on her first Ray and "first-energy-blast" on her first Blast, each exactly once, over a whole fight', () => {
    for (const seed of [1, 2, 3, 4]) {
      const engine = new FFX2Engine(ffx2Options({ atbMode: 'wait' }));
      engine.setSeed(seed);
      engine.init(setupForChapter(FFX2_VALEFOR_BESAID, seed));
      for (let i = 0; i < 40_000; i++) {
        const d = engine.nextDecision();
        if (d.kind === 'battle-over') break;
        if (d.kind === 'waiting') {
          engine.tick(Math.max(1, d.nextEventMs));
          continue;
        }
        if (d.kind !== 'player-input') continue;
        engine.submit(ffx2ValeforBesaid(d.actorId, d.commands, engine) ?? { kind: 'defend', targets: [] });
      }
      const log = engine.state().log as readonly (BattleEvent & { name?: string; abilityId?: string; actorId?: string })[];
      const fired = log.filter((e) => e.type === 'script-trigger').map((e) => e.name);
      const rays = log.filter((e) => e.type === 'action-start' && e.actorId === VALEFOR_ID && e.abilityId === 'x2-valefor-energy-ray').length;
      const blasts = log.filter((e) => e.type === 'action-start' && e.actorId === VALEFOR_ID && e.abilityId === 'x2-valefor-energy-blast').length;
      expect(fired.filter((n) => n === 'first-energy-ray'), `seed ${seed}`).toHaveLength(rays > 0 ? 1 : 0);
      expect(fired.filter((n) => n === 'first-energy-blast'), `seed ${seed}`).toHaveLength(blasts > 0 ? 1 : 0);
      expect(rays, `seed ${seed}: the fight reached her first Energy Ray`).toBeGreaterThan(0);
      if (blasts > 0) expect(fired.indexOf('first-energy-ray')).toBeLessThan(fired.indexOf('first-energy-blast')); // the Ray comes first (the counter's 30 mark before its 100)
    }
  });
});

describe('the stage: the Chamber of the Fayth, with Valefor on Ixion\'s spot', () => {
  it('the scene key is the registered Chamber plate (Bailey\'s approved Djose pick, the provisional stand-in for Besaid), with a factory', () => {
    expect(FFX2_VALEFOR_BESAID.sceneKey).toBe(DJOSE_CHAMBER_PLATE);
    const scene = getScene(FFX2_VALEFOR_BESAID.sceneKey);
    expect(scene, 'registered').toBeDefined();
    expect(scene!.placeholder).toBe(false);
    expect(getSceneFactory(FFX2_VALEFOR_BESAID.sceneKey), 'has a factory').toBeDefined();
  });

  it('her id has a spot in the Chamber\'s map: the same spot Ixion stands on, in the registered slots too', () => {
    expect(DJOSE_VALEFOR_ID).toBe(VALEFOR_ID);
    expect(DJOSE_SPOTS[DJOSE_VALEFOR_ID]).toEqual(DJOSE_SPOTS[DJOSE_IXION_ID]);
    const slots = getScene(FFX2_VALEFOR_BESAID.sceneKey)!.slots as { enemySpots?: Record<string, [number, number, number]> };
    expect(slots.enemySpots?.[VALEFOR_ID]).toEqual(slots.enemySpots?.[DJOSE_IXION_ID]);
  });
});

describe('the experiments\' store, never the save', () => {
  it('an attempt and a clear are kept under the chapter\'s id in the experiments\' key, and the save key is never written', () => {
    const written = new Map<string, string>();
    const fake = { getItem: (k: string): string | null => written.get(k) ?? null, setItem: (k: string, v: string): void => void written.set(k, v) };
    try {
      setExperimentStorageForTests(fake);
      expect(experimentRecord(VALEFOR_BESAID_ID)).toMatchObject({ attempts: 0, clears: 0, bestTimeMs: null });
      experimentProgress.recordAttempt(VALEFOR_BESAID_ID);
      experimentProgress.recordClear(VALEFOR_BESAID_ID, 91_000, 20);
      experimentProgress.recordAttempt(VALEFOR_BESAID_ID);
      experimentProgress.recordClear(VALEFOR_BESAID_ID, 120_000, 24);
      expect(experimentRecord(VALEFOR_BESAID_ID)).toMatchObject({ attempts: 2, clears: 2, bestTimeMs: 91_000 });
      expect([...written.keys()]).toEqual([EXPERIMENTS_KEY]);
      expect(written.has(SAVE_KEY)).toBe(false);
      expect(Object.keys(JSON.parse(written.get(EXPERIMENTS_KEY)!) as Record<string, unknown>)).toEqual([VALEFOR_BESAID_ID]);
    } finally {
      setExperimentStorageForTests(undefined);
    }
  });
});
