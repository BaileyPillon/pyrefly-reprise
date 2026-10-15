/**
 * Angra Mainyu (FFX-2 Chapter 5, the hidden chapter): the flow around the fight. **FFX-2 only** [AGENTS.md rule 14].
 *
 * 1. **The setup**: `setupForChapter` hands the engine the chapter's party and its one formation, no escape, and the three story triggers.
 * 2. **The triggers**: each fires once, on the body's first Perdition's Flame, its first Full-Life and Zarich's first Glimmer of Despair (and never twice), as the real engine plays the fight.
 * 3. **The stage**: the chapter's scene key is the registered desert, and the three bodies each have their own spot on it.
 * 4. **The store**: an attempt and a clear go to the experiments' own store (`pyrefly-reprise:experiments:v1`), never the save (`pyrefly-reprise:save:v1`): no save change, no migration.
 */
import { describe, expect, it } from 'vitest';

import { setupForChapter } from '../../../src/app/screens/BattleScreenSetup.ts';
import { EXPERIMENTS_KEY, experimentProgress, experimentRecord, setExperimentStorageForTests } from '../../../src/app/experiments/experimentRecords.ts';
import { SAVE_KEY } from '../../../src/app/SaveData.ts';
import { ANGRA_ABILITY as A } from '../../../src/battle/ffx2/ai/angra-mainyu.ts';
import { FFX2_ANGRA_MAINYU, ANGRA_MAINYU_ID } from '../../../src/data/chapter-ffx2-angra-mainyu.ts';
import { angraMainyuBuild } from '../../../src/data/ffx2/builds/angra-mainyu.ts';
import { angraMainyuGroup } from '../../../src/data/ffx2/enemies/angra-mainyu.ts';
import { ANGRA_MAINYU_SCENE, X2_ANGRA_MAINYU_ID, X2_TAWRICH_ID, X2_ZARICH_ID } from '../../../src/data/angra-mainyu-ids.ts';
import { ANGRA_MAINYU_SPOT, TAWRICH_SPOT, ZARICH_SPOT } from '../../../src/scenes/angra-mainyu-desert.ts';
import { getScene, getSceneFactory } from '../../../src/scenes/index.ts';
import { logOf, openAngra, playAngra, startsOf, type AngraInput } from '../helpers/angraMainyuDrive.ts';

describe('the one-fight setup', () => {
  it('plays the chapter\'s preset against its one formation, cannot be fled, and carries the three triggers', () => {
    const setup = setupForChapter(FFX2_ANGRA_MAINYU, 7);
    expect(setup).toMatchObject({ game: 'ffx2', seed: 7, condition: 'normal', canEscape: false });
    expect(setup.party).toBe(angraMainyuBuild);
    expect(setup.enemies).toBe(angraMainyuGroup);
    expect(setup.triggers.map((t) => t.id)).toEqual(['first-perditions-flame', 'first-full-life', 'first-glimmer-of-despair']);
    expect(FFX2_ANGRA_MAINYU.enemyGroupRef.nextGroupId).toBeUndefined(); // one link: no chain, no second act, no checkpoint
  });
});

describe('the story triggers fire once each in the real engine', () => {
  it('"first-perditions-flame", "first-full-life" and "first-glimmer-of-despair", each exactly once, over a whole stretch of fight (the Flame four times, Full-Life and Glimmer more than once)', () => {
    for (const seed of [1, 2, 3]) {
      const engine = openAngra(seed, { immortal: true, triggers: setupForChapter(FFX2_ANGRA_MAINYU, seed).triggers });
      // Tawrich at 1 HP and Paine\'s first turn on him: the body raises him, then raises him again if he falls again.
      (engine.state().combatants[X2_TAWRICH_ID] as unknown as { hp: number }).hp = 1;
      let struck = false;
      const strike = (d: AngraInput) => {
        const row = d.commands.find((c) => c.enabled && c.command.kind === 'attack');
        if (struck || d.actorId !== 'paine' || !row) return null;
        struck = true;
        return { ...row.command, targets: [X2_TAWRICH_ID] } as never;
      };
      playAngra(engine, strike, (e) => startsOf(e, X2_ANGRA_MAINYU_ID) >= 40, { immortal: true });
      const log = logOf(engine);
      const fired = log.filter((e) => e.type === 'script-trigger').map((e) => (e as unknown as { name: string }).name);
      const count = (ability: string, actor: string): number => log.filter((e) => e.type === 'action-start' && e.actorId === actor && e.abilityId === ability).length;
      expect(count(A.flame, X2_ANGRA_MAINYU_ID), `seed ${seed}: the Flame came round again`).toBeGreaterThanOrEqual(4);
      expect(count(A.glimmer, X2_ZARICH_ID), `seed ${seed}: so did Glimmer`).toBeGreaterThanOrEqual(2);
      expect(count(A.fullLife, X2_ANGRA_MAINYU_ID), `seed ${seed}: the body raised the arm`).toBeGreaterThanOrEqual(1);
      expect(fired.filter((n) => n === 'first-perditions-flame'), `seed ${seed}`).toHaveLength(1);
      expect(fired.filter((n) => n === 'first-glimmer-of-despair'), `seed ${seed}`).toHaveLength(1);
      expect(fired.filter((n) => n === 'first-full-life'), `seed ${seed}`).toHaveLength(1);
    }
  });
});

describe('the stage: the desert, with each body on its own spot', () => {
  it('the scene key is the registered provisional desert, with a factory', () => {
    expect(FFX2_ANGRA_MAINYU.sceneKey).toBe(ANGRA_MAINYU_SCENE);
    const scene = getScene(FFX2_ANGRA_MAINYU.sceneKey);
    expect(scene, 'registered').toBeDefined();
    expect(scene!.placeholder).toBe(false);
    expect(getSceneFactory(FFX2_ANGRA_MAINYU.sceneKey), 'has a factory').toBeDefined();
  });

  it('the body, Zarich and Tawrich each have a spot in the registered slots, three different ones, with the body at the back and the arms in front of it', () => {
    const slots = getScene(FFX2_ANGRA_MAINYU.sceneKey)!.slots as { enemySpots?: Record<string, [number, number, number]> };
    expect(slots.enemySpots?.[X2_ANGRA_MAINYU_ID]).toEqual(ANGRA_MAINYU_SPOT);
    expect(slots.enemySpots?.[X2_ZARICH_ID]).toEqual(ZARICH_SPOT);
    expect(slots.enemySpots?.[X2_TAWRICH_ID]).toEqual(TAWRICH_SPOT);
    const keys = [ANGRA_MAINYU_SPOT, ZARICH_SPOT, TAWRICH_SPOT].map((s) => s.join(','));
    expect(new Set(keys).size).toBe(3);
    // z grows toward the camera: the body stands further back (smaller z) than both arms, and Zarich is on the left of Tawrich.
    expect(ANGRA_MAINYU_SPOT[2]).toBeLessThan(ZARICH_SPOT[2]);
    expect(ANGRA_MAINYU_SPOT[2]).toBeLessThan(TAWRICH_SPOT[2]);
    expect(ZARICH_SPOT[0]).toBeLessThan(TAWRICH_SPOT[0]);
  });
});

describe('the experiments\' store, never the save', () => {
  it('an attempt and a clear are kept under the chapter\'s id in the experiments\' key, and the save key is never written', () => {
    const written = new Map<string, string>();
    const fake = { getItem: (k: string): string | null => written.get(k) ?? null, setItem: (k: string, v: string): void => void written.set(k, v) };
    try {
      setExperimentStorageForTests(fake);
      expect(experimentRecord(ANGRA_MAINYU_ID)).toMatchObject({ attempts: 0, clears: 0, bestTimeMs: null });
      experimentProgress.recordAttempt(ANGRA_MAINYU_ID);
      experimentProgress.recordClear(ANGRA_MAINYU_ID, 400_000, 60);
      experimentProgress.recordAttempt(ANGRA_MAINYU_ID);
      experimentProgress.recordClear(ANGRA_MAINYU_ID, 480_000, 70);
      expect(experimentRecord(ANGRA_MAINYU_ID)).toMatchObject({ attempts: 2, clears: 2, bestTimeMs: 400_000 });
      expect([...written.keys()]).toEqual([EXPERIMENTS_KEY]);
      expect(written.has(SAVE_KEY)).toBe(false);
      expect(Object.keys(JSON.parse(written.get(EXPERIMENTS_KEY)!) as Record<string, unknown>)).toEqual([ANGRA_MAINYU_ID]);
    } finally {
      setExperimentStorageForTests(undefined);
    }
  });
});
