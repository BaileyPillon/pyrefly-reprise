/**
 * Machina Maw — Rikku's special dressphere [ffx2-combat-core §3.15].
 * Physical/status mech: main body + Smasher-R + Crusher-L. The ladders only: the community growth rows (SinirothX) and their worked blocks that stood here are gone, the parts' stats are the
 * game's own growth rows (`battle/ffx2/special/stats.ts`, `research/re-ffx2-special-dresspheres.md` section 5).
 */

import type { SpecialDressphereDef } from './types.ts';

export const machinaMaw: SpecialDressphereDef = {
  id: 'machina-maw',
  name: 'Machina Maw',
  owner: 'rikku',
  partIds: { main: 'machina-maw-main', podA: 'machina-maw-smasher-r', podB: 'machina-maw-crusher-l' },
  citation: 'ffx2-combat-core.md §3.15 [single source: SinirothX §19]',
  abilities: {
    main: [
      { abilityId: 'x2-machina-maw-attack', apCost: 10, free: true },
      { abilityId: 'x2-machina-maw-revival', apCost: 10 },
      { abilityId: 'x2-machina-maw-death-missile', apCost: 10, free: true },
      { abilityId: 'x2-machina-maw-bio-missile', apCost: 10, free: true },
      { abilityId: 'x2-machina-maw-break-missile', apCost: 10, free: true },
      { abilityId: 'x2-machina-maw-berserk-missile', apCost: 10 },
      { abilityId: 'x2-machina-maw-stop-missile', apCost: 10, prereq: 'x2-machina-maw-berserk-missile' },
      { abilityId: 'x2-machina-maw-confuse-missile', apCost: 10, prereq: 'x2-machina-maw-stop-missile' },
      { abilityId: 'x2-machina-maw-shockwave', apCost: 20 },
      { abilityId: 'x2-machina-maw-shockstorm', apCost: 20, prereq: 'x2-machina-maw-shockwave' },
      { abilityId: 'x2-machina-maw-vajra', apCost: 30, prereq: 'x2-machina-maw-shockstorm' },
    ],
    podA: [
      { abilityId: 'x2-machina-maw-howitzer', apCost: 10, free: true },
      { abilityId: 'x2-machina-maw-sleep-shell', apCost: 10 },
      { abilityId: 'x2-machina-maw-slow-shell', apCost: 10, prereq: 'x2-machina-maw-sleep-shell' },
      { abilityId: 'x2-machina-maw-anti-power-shell', apCost: 10, prereq: 'x2-machina-maw-slow-shell' },
      { abilityId: 'x2-machina-maw-anti-armor-shell', apCost: 10, prereq: 'x2-machina-maw-anti-power-shell' },
      { abilityId: 'x2-machina-maw-scan', apCost: 10 },
      { abilityId: 'x2-machina-maw-shellter', apCost: 20 },
      { abilityId: 'x2-machina-maw-protector', apCost: 20, prereq: 'x2-machina-maw-shellter' },
      { abilityId: 'x2-machina-maw-hp-repair', apCost: 10, free: true },
      { abilityId: 'x2-machina-maw-mp-repair-smasher', apCost: 10, free: true },
      { abilityId: 'x2-machina-maw-homing-ray-smasher', apCost: 10, free: true },
    ],
    podB: [
      { abilityId: 'x2-machina-maw-howitzer-crusher', apCost: 10, free: true },
      { abilityId: 'x2-machina-maw-blind-shell', apCost: 10, prereq: 'x2-machina-maw-howitzer-crusher' },
      { abilityId: 'x2-machina-maw-silence-shell', apCost: 10, prereq: 'x2-machina-maw-blind-shell' },
      { abilityId: 'x2-machina-maw-anti-magic-shell', apCost: 10, prereq: 'x2-machina-maw-silence-shell' },
      { abilityId: 'x2-machina-maw-anti-mental-shell', apCost: 10, prereq: 'x2-machina-maw-anti-magic-shell' },
      { abilityId: 'x2-machina-maw-booster', apCost: 20 },
      { abilityId: 'x2-machina-maw-offense', apCost: 20 },
      { abilityId: 'x2-machina-maw-defense', apCost: 20, prereq: 'x2-machina-maw-offense' },
      { abilityId: 'x2-machina-maw-hp-repair-crusher', apCost: 10, free: true },
      { abilityId: 'x2-machina-maw-mp-repair', apCost: 10, free: true },
      { abilityId: 'x2-machina-maw-homing-ray-crusher', apCost: 10, free: true },
    ],
  },
};

export default machinaMaw;
