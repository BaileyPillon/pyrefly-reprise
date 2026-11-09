/**
 * Floral Fallal — Yuna's special dressphere [ffx2-combat-core §3.15].
 * Magic-oriented: main body + Left Pistil (offence/status) + Right Pistil
 * (support/debuff). The ladders only: the community growth rows (SinirothX) and their worked blocks that stood here are gone, the parts' stats are the game's own growth rows
 * (`battle/ffx2/special/stats.ts`, `research/re-ffx2-special-dresspheres.md` section 5).
 */

import type { SpecialDressphereDef } from './types.ts';

export const floralFallal: SpecialDressphereDef = {
  id: 'floral-fallal',
  name: 'Floral Fallal',
  owner: 'yuna',
  partIds: { main: 'floral-fallal-main', podA: 'floral-fallal-right-pistil', podB: 'floral-fallal-left-pistil' },
  citation: 'ffx2-combat-core.md §3.15 [single source: SinirothX §19]',
  abilities: {
    main: [
      { abilityId: 'x2-floral-fallal-attack', apCost: 20, free: true },
      { abilityId: 'x2-floral-fallal-libra', apCost: 4 },
      { abilityId: 'x2-floral-fallal-heat-whirl', apCost: 10, free: true },
      { abilityId: 'x2-floral-fallal-ice-whirl', apCost: 10, free: true },
      { abilityId: 'x2-floral-fallal-electric-whirl', apCost: 10, free: true },
      { abilityId: 'x2-floral-fallal-aqua-whirl', apCost: 10, free: true },
      { abilityId: 'x2-floral-fallal-barrier', apCost: 20 },
      { abilityId: 'x2-floral-fallal-shield', apCost: 20, prereq: 'x2-floral-fallal-barrier' },
      { abilityId: 'x2-floral-fallal-flare-whirl', apCost: 24 },
      { abilityId: 'x2-floral-fallal-great-whirl', apCost: 30, prereq: 'x2-floral-fallal-flare-whirl' },
      { abilityId: 'x2-floral-fallal-all-life', apCost: 8 },
    ],
    podA: [
      { abilityId: 'x2-floral-fallal-white-pollen', apCost: 10, free: true },
      { abilityId: 'x2-floral-fallal-white-honey', apCost: 10 },
      { abilityId: 'x2-floral-fallal-hard-leaves', apCost: 10, free: true },
      { abilityId: 'x2-floral-fallal-tough-nuts', apCost: 10, free: true },
      { abilityId: 'x2-floral-fallal-mirror-petals', apCost: 10, free: true },
      { abilityId: 'x2-floral-fallal-floral-rush', apCost: 20, prereq: 'x2-floral-fallal-white-honey' },
      { abilityId: 'x2-floral-fallal-floral-bomb', apCost: 10, free: true },
      { abilityId: 'x2-floral-fallal-fallal-bomb', apCost: 10 },
      { abilityId: 'x2-floral-fallal-floral-magisol', apCost: 10, prereq: 'x2-floral-fallal-fallal-bomb' },
      { abilityId: 'x2-floral-fallal-fallal-magisol', apCost: 10, prereq: 'x2-floral-fallal-floral-magisol' },
      { abilityId: 'x2-floral-fallal-right-stigma', apCost: 20, prereq: 'x2-floral-fallal-fallal-magisol' },
    ],
    podB: [
      { abilityId: 'x2-floral-fallal-dream-pollen', apCost: 10, free: true },
      { abilityId: 'x2-floral-fallal-mad-seeds', apCost: 10, free: true },
      { abilityId: 'x2-floral-fallal-sticky-honey', apCost: 10, free: true },
      { abilityId: 'x2-floral-fallal-halfdeath-petals', apCost: 10, free: true },
      { abilityId: 'x2-floral-fallal-poison-leaves', apCost: 10 },
      { abilityId: 'x2-floral-fallal-death-petals', apCost: 10, prereq: 'x2-floral-fallal-poison-leaves' },
      { abilityId: 'x2-floral-fallal-silent-white', apCost: 20, free: true },
      { abilityId: 'x2-floral-fallal-congealed-honey', apCost: 20 },
      { abilityId: 'x2-floral-fallal-panic-floralysis', apCost: 10, prereq: 'x2-floral-fallal-congealed-honey' },
      { abilityId: 'x2-floral-fallal-ash-floralysis', apCost: 10, prereq: 'x2-floral-fallal-panic-floralysis' },
      { abilityId: 'x2-floral-fallal-left-stigma', apCost: 20, prereq: 'x2-floral-fallal-silent-white' },
    ],
  },
};

export default floralFallal;
