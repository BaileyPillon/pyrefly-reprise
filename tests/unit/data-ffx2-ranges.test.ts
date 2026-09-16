/**
 * Numeric sanity: every raw byte and stat this module ships stays inside the
 * ranges `types.ts` documents.
 */

import { describe, expect, it } from 'vitest';

import { ABILITIES, ENEMY_GROUPS } from '../../src/data/ffx2/index.ts';
import { statsAtLevel } from '../../src/data/ffx2/dresspheres/growth.ts';
import { STANDARD_DRESSPHERES } from '../../src/data/ffx2/dresspheres/index.ts';
import { GARMENT_GRIDS } from '../../src/data/ffx2/garment-grids/index.ts';

describe('AbilityDef byte ranges', () => {
  for (const [id, ability] of Object.entries(ABILITIES)) {
    it(`${id}: statusEffects chance bytes are 0-255`, () => {
      for (const app of ability.statusEffects) {
        expect(app.chance, `${id} ${app.status} chance`).toBeGreaterThanOrEqual(0);
        expect(app.chance, `${id} ${app.status} chance`).toBeLessThanOrEqual(255);
        expect(app.duration, `${id} ${app.status} duration`).toBeGreaterThanOrEqual(0);
        expect(app.duration, `${id} ${app.status} duration`).toBeLessThanOrEqual(255);
        if (app.stacks !== undefined) {
          expect(app.stacks, `${id} ${app.status} stacks`).toBeGreaterThanOrEqual(0);
          expect(app.stacks, `${id} ${app.status} stacks`).toBeLessThanOrEqual(10);
        }
      }
    });

    it(`${id}: hits is 1-16 (0 reserved for reels)`, () => {
      expect(ability.hits).toBeGreaterThanOrEqual(0);
      expect(ability.hits).toBeLessThanOrEqual(16);
    });

    it(`${id}: mpCost is non-negative`, () => {
      expect(ability.mpCost).toBeGreaterThanOrEqual(0);
    });

    if (ability.accuracy !== undefined) {
      it(`${id}: accuracy byte is 0-255`, () => {
        expect(ability.accuracy).toBeGreaterThanOrEqual(0);
        expect(ability.accuracy).toBeLessThanOrEqual(255);
      });
    }
  }
});

describe('Enemy stat blocks', () => {
  for (const group of ENEMY_GROUPS) {
    for (const enemy of [...group.enemies, ...(group.parts ?? [])]) {
      it(`${group.id}/${enemy.id}: stats are non-negative and internally consistent`, () => {
        expect(enemy.stats.hp).toBeGreaterThan(0);
        expect(enemy.stats.maxHp).toBe(enemy.stats.hp);
        expect(enemy.hp).toBeLessThanOrEqual(enemy.stats.maxHp);
        for (const key of ['str', 'def', 'mag', 'mdef', 'agi', 'luck', 'eva', 'acc'] as const) {
          expect(enemy.stats[key], `${enemy.id}.${key}`).toBeGreaterThanOrEqual(0);
        }
      });

      it(`${group.id}/${enemy.id}: immunity bytes are 0-255`, () => {
        for (const [status, byte] of Object.entries(enemy.immunities)) {
          expect(byte, `${enemy.id} immune[${status}]`).toBeGreaterThanOrEqual(0);
          expect(byte, `${enemy.id} immune[${status}]`).toBeLessThanOrEqual(255);
        }
      });

      if (enemy.rewards.steal) {
        it(`${group.id}/${enemy.id}: steal baseChance is 0-100`, () => {
          expect(enemy.rewards.steal!.baseChance).toBeGreaterThanOrEqual(0);
          expect(enemy.rewards.steal!.baseChance).toBeLessThanOrEqual(100);
        });
      }
    }
  }
});

describe('Dressphere growth curves stay sane across the two build bands', () => {
  const levels = [20, 24, 28, 43, 48, 52];
  for (const [id, def] of Object.entries(STANDARD_DRESSPHERES)) {
    if (!def?.growth) continue;
    it(`${id}: every stat is non-negative at Lv 20-52 and grows or holds with level`, () => {
      let prevHp = -1;
      for (const lv of levels) {
        const stats = statsAtLevel(def.growth!, lv, def.exactLevels);
        for (const [stat, value] of Object.entries(stats)) {
          expect(value, `${id} Lv${lv} ${stat}`).toBeGreaterThanOrEqual(0);
        }
        expect(stats.hp, `${id} Lv${lv} hp regression`).toBeGreaterThanOrEqual(prevHp);
        prevHp = stats.hp;
      }
    });
  }
});

describe('Garment Grid node counts and gate colours', () => {
  for (const [id, grid] of Object.entries(GARMENT_GRIDS)) {
    it(`${id}: nodeCount is 2-6 and gateColours has at most 4 entries`, () => {
      expect(grid.nodeCount).toBeGreaterThanOrEqual(2);
      expect(grid.nodeCount).toBeLessThanOrEqual(6);
      expect(grid.gateColours.length).toBeLessThanOrEqual(4);
      expect(new Set(grid.gateColours).size).toBe(grid.gateColours.length);
    });

    it(`${id}: every gate effect only uses colours the grid actually has`, () => {
      for (const gateEffect of grid.gateEffects) {
        for (const colour of gateEffect.gates) {
          expect(grid.gateColours, `${id} gate effect uses ${colour}`).toContain(colour);
        }
      }
    });
  }
});
