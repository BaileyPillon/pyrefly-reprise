/**
 * Seymour Flux's guide must not tell the player that Defend answers Total Annihilation.
 *
 * Game case: FFX only (Chapter I, Mt. Gagazet). The independent check of release 39 (R39C-01) found
 * the WATCH rail and the reading view offering "Shell or Defend" against Total Annihilation, which is
 * a Magic attack. `research/ffx-combat-core.md` says Defend halves physical damage only; an engine run
 * gave 3,855 plain, 3,855 with Defend and 1,925 with Shell. Shell is the answer, and the guide says so.
 */
import { describe, expect, it } from 'vitest';
import { totalAnnihilation } from '../../src/data/ffx/enemies/seymour-flux-abilities.ts';
import { SEYMOUR_FLUX_DOC } from '../../src/data/guides/docs/seymour-flux.ts';
import { SEYMOUR_FLUX_GUIDE } from '../../src/data/guides/seymour-flux.ts';

describe('Seymour Flux guide: Defend against Total Annihilation (FFX only)', () => {
  it('Total Annihilation is a Magic attack in the data, so Defend (physical only) cannot halve it', () => {
    expect(totalAnnihilation.formula).toBe('magic');
    expect(totalAnnihilation.damageType).toBe('magical');
  });

  it('the WATCH rail answers it with Shell and never offers Defend as the cut', () => {
    const rail = (SEYMOUR_FLUX_GUIDE.watch ?? []).filter((w) => w.payload.startsWith('Total Annihilation'));
    expect(rail).toHaveLength(2);
    for (const w of rail) {
      expect(w.advice).toMatch(/Shell/);
      expect(w.advice).not.toMatch(/or Defend|Defend or|Defend now/);
      expect(w.cite).toMatch(/ffx-seymour-flux/);
    }
    expect(rail[1]!.advice).toMatch(/Defend only halves physical hits/);
  });

  it('the reading view says Defend will not help and no longer tells the player to Defend as the blast hits', () => {
    const text = SEYMOUR_FLUX_DOC.blocks.map((b) => (b.t === 'p' ? b.text : '')).join('\n');
    expect(text).toMatch(/Defend will not help against this one: it only halves physical hits/);
    expect(text).toMatch(/Shell is what halves it/);
    expect(text).not.toMatch(/Defend as the attack hits/);
  });
});
