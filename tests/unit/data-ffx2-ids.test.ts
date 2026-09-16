/**
 * Every id a build, dressphere, or enemy references must resolve in the
 * corresponding lookup table. Catches typos across the ~700 ability/item/
 * dressphere/grid ids this module ships.
 */

import { describe, expect, it } from 'vitest';

import { ABILITIES, ITEMS, STANDARD_DRESSPHERES, SPECIAL_DRESSPHERES, GARMENT_GRIDS, ENEMY_GROUPS } from '../../src/data/ffx2/index.ts';
import { bevelleBuild } from '../../src/data/ffx2/builds/bevelle.ts';
import { farplaneBuild } from '../../src/data/ffx2/builds/farplane.ts';
import { STANDARD_DRESSPHERE_IDS, SPECIAL_DRESSPHERE_IDS } from '../../src/data/ffx2/ids.ts';
import type { GarmentGridId } from '../../src/data/ffx2/ids.ts';
import type { FFX2PartyBuild } from '../../src/battle/common/types.ts';

const BUILDS: Record<string, FFX2PartyBuild> = { bevelle: bevelleBuild, farplane: farplaneBuild };

describe('FFX-2 dressphere ability lists resolve', () => {
  for (const [id, def] of Object.entries(STANDARD_DRESSPHERES)) {
    if (!def) continue;
    it(`${id}: every ability id resolves`, () => {
      for (const entry of def.abilities) {
        expect(ABILITIES[entry.abilityId], `${id} -> ${entry.abilityId}`).toBeDefined();
        if (entry.prereq) {
          expect(ABILITIES[entry.prereq], `${id} prereq -> ${entry.prereq}`).toBeDefined();
        }
      }
    });
  }

  for (const [id, def] of Object.entries(SPECIAL_DRESSPHERES)) {
    it(`${id}: every part's ability ids resolve`, () => {
      for (const part of Object.values(def.abilities)) {
        for (const entry of part) {
          expect(ABILITIES[entry.abilityId], `${id} -> ${entry.abilityId}`).toBeDefined();
        }
      }
    });
  }
});

describe('FFX-2 enemy ability ids resolve', () => {
  for (const group of ENEMY_GROUPS) {
    for (const enemy of [...group.enemies, ...(group.parts ?? [])]) {
      it(`${group.id}/${enemy.id}: every abilityId resolves`, () => {
        for (const abilityId of enemy.abilityIds) {
          expect(ABILITIES[abilityId], `${enemy.id} -> ${abilityId}`).toBeDefined();
        }
      });
    }
  }
});

describe('FFX-2 party builds reference real ids', () => {
  for (const [buildName, build] of Object.entries(BUILDS)) {
    for (const member of build.members) {
      it(`${buildName}/${member.id}: currentDressphere is owned`, () => {
        expect(member.owned).toContain(member.currentDressphere);
      });

      it(`${buildName}/${member.id}: currentDressphere resolves to a known dressphere`, () => {
        const isStandard = Object.prototype.hasOwnProperty.call(STANDARD_DRESSPHERES, member.currentDressphere);
        const isSpecial = Object.prototype.hasOwnProperty.call(SPECIAL_DRESSPHERES, member.currentDressphere);
        expect(isStandard || isSpecial, member.currentDressphere).toBe(true);
      });

      it(`${buildName}/${member.id}: every owned dressphere resolves`, () => {
        for (const dressphereId of member.owned) {
          const isStandard = (STANDARD_DRESSPHERE_IDS as readonly string[]).includes(dressphereId);
          const isSpecial = (SPECIAL_DRESSPHERE_IDS as readonly string[]).includes(dressphereId);
          expect(isStandard || isSpecial, dressphereId).toBe(true);
        }
      });

      it(`${buildName}/${member.id}: garment grid id resolves`, () => {
        expect(GARMENT_GRIDS[member.garmentGrid.id as GarmentGridId], member.garmentGrid.id).toBeDefined();
      });

      it(`${buildName}/${member.id}: every learned ability id resolves within an owned dressphere`, () => {
        for (const [dressphereId, progress] of Object.entries(member.abilitiesLearned)) {
          expect(member.owned, `${dressphereId} learned but not owned`).toContain(dressphereId);
          for (const abilityId of progress.learned) {
            expect(ABILITIES[abilityId], `${dressphereId} -> ${abilityId}`).toBeDefined();
          }
        }
      });
    }

    it(`${buildName}: every inventory item id resolves`, () => {
      for (const entry of build.inventory) {
        expect(ITEMS[entry.itemId], entry.itemId).toBeDefined();
      }
    });
  }
});

describe('FFX-2 items resolve their effect ability', () => {
  for (const [id, item] of Object.entries(ITEMS)) {
    it(`${id}: effect ability resolves`, () => {
      const effect = typeof item.effect === 'string' ? item.effect : item.effect.id;
      expect(ABILITIES[effect], effect).toBeDefined();
    });
  }
});
