/**
 * Pilots on (2026-11-06): the two party pilots are on by default, so they sit in every phone's memory in Chapters I and IV. The rig engine budgets rig textures from the sizes the gate stamped in the file
 * (`RigTier.tierPartsOf`), against `RIG_SHARE` of the device class's figure-texture budget; a pilot that does not fit is the painting set, never a broken figure. This pins what the real pilot files (the
 * fixtures hold their gate stamps, `tests/fixtures/rig/real/*.rig.json`) plan on every class, and that the pair of rigs a battle holds (the boss's body rig and the pilot) fits the PHONE class's share at the
 * 1x tier a phone asks for AND at the 2x tier, so neither pilot falls to the painting set on any class. Tidus FFX only (Chapter I), Rikku's Dark Knight FFX-2 only (Chapter IV); the budget plumbing is both games.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { budgetFor } from '../../../src/engine/ArtBudget.ts';
import { RIG_SHARE, planRigTextures, rigTextureMB, type TierPart } from '../../../src/engine/rig/RigTier.ts';

/** The gate's stamp of every texture the pilot's file lists (a part and each of its variants): the sizes of the PNG and of the rim mask, exactly what `RigTier.tierPartsOf` budgets from. */
const read = (folder: string): TierPart[] => {
  const file = JSON.parse(readFileSync(new URL(`../../fixtures/rig/real/${folder}.rig.json`, import.meta.url), 'utf8')) as { gate: { textures: Record<string, { map: [number, number]; rim?: [number, number] }> } };
  return Object.values(file.gate.textures).map((t) => (t.rim ? { map: t.map, rim: t.rim } : { map: t.map, rim: null }));
};
const TIDUS = read('tidus-v2');
const RIKKU = read('rikku-dark-knight-v2');

/**
 * The boss rigs the same battles hold, measured on the live art mirror's files (release 76, 2026-11-06; the rig files are not in the repository, only their sizes matter here): Seymour Flux's body
 * (Chapter I) and Bahamut (Chapter IV), in megabytes of texture at the 1x tier and at the 2x map with 1x rim masks. A boss rig that grows past these makes this test say so.
 */
const BOSS = { 'seymour-flux-body': { one: 27.6, two: 69.0 }, 'ffx2-bahamut': { one: 25.4, two: 63.5 } } as const;

const TIERS = [1, 2] as const;
const ceil1 = (n: number): number => Math.ceil(n * 10) / 10;

describe('the pilots\' textures at each tier (the sizes the gate stamped in the file)', () => {
  it('Tidus: about 19.6 MB at 1x and 49 MB at the 2x map with 1x rim masks; Rikku\'s Dark Knight: about 17.1 and 42.7', () => {
    expect(rigTextureMB(TIDUS, { map: 1, rim: 1 })).toBeCloseTo(19.6, 0);
    expect(rigTextureMB(TIDUS, { map: 2, rim: 1 })).toBeCloseTo(49.0, 0);
    expect(rigTextureMB(RIKKU, { map: 1, rim: 1 })).toBeCloseTo(17.1, 0);
    expect(rigTextureMB(RIKKU, { map: 2, rim: 1 })).toBeCloseTo(42.7, 0);
  });
});

describe('every device class: both pilots plan ON, alone and beside their chapter\'s boss rig, at the scale the device asks for', () => {
  for (const cls of ['phone', 'low', 'mid', 'high'] as const) {
    const budgetMB = budgetFor(cls).textureMB;
    for (const want of [1, 2]) {
      it(`${cls} (${budgetMB} MB figure textures, rigs may hold ${budgetMB * RIG_SHARE} MB), the idle painting at ${want}x: Chapter I and Chapter IV both fit, the pilot after the boss`, () => {
        for (const [boss, pilot] of [['seymour-flux-body', TIDUS], ['ffx2-bahamut', RIKKU]] as const) {
          const first = want >= 2 ? BOSS[boss].two : BOSS[boss].one;
          const plan = planRigTextures({ parts: pilot, tiers: TIERS, want, budgetMB, usedMB: first });
          expect(plan.ok, `${boss} ${cls} ${want}x: ${plan.ok ? '' : plan.reason}`).toBe(true);
          if (plan.ok) expect(first + plan.mb).toBeLessThanOrEqual(budgetMB * RIG_SHARE);
        }
      });
    }
  }

  it('on the phone class the pair holds under half of the rigs\' share at the 1x tier a phone asks for (Chapter I about 47 MB, Chapter IV about 43 MB of 110)', () => {
    const share = budgetFor('phone').textureMB * RIG_SHARE;
    const one1 = BOSS['seymour-flux-body'].one + ceil1(rigTextureMB(TIDUS, { map: 1, rim: 1 }));
    const four1 = BOSS['ffx2-bahamut'].one + ceil1(rigTextureMB(RIKKU, { map: 1, rim: 1 }));
    expect(one1).toBeLessThan(share / 2);
    expect(four1).toBeLessThan(share / 2);
  });

  it('a pilot that would not fit is the painting set with the reason, not a throw: a tiny budget refuses it', () => {
    const plan = planRigTextures({ parts: TIDUS, tiers: TIERS, want: 1, budgetMB: 30, usedMB: 0 });
    expect(plan.ok).toBe(false);
    if (!plan.ok) expect(plan.reason).toMatch(/^over the rig texture budget/);
  });
});
