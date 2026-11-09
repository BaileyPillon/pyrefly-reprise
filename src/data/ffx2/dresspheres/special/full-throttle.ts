/**
 * Full Throttle — Paine's special dressphere [ffx2-combat-core §3.15].
 * Physical brawler: main body + Sinistral Wing + Dextral Wing. The ladders only: the community growth rows (SinirothX) and their worked blocks that stood here are gone, the parts' stats are the
 * game's own growth rows (`battle/ffx2/special/stats.ts`, `research/re-ffx2-special-dresspheres.md` section 5). Sword Dance
 * (main, 30 AP) is called "the strongest thing in the game per action" and
 * `ffx2-bahamut.md` §3.3 recommends this transformation for that fight.
 */

import type { SpecialDressphereDef } from './types.ts';

export const fullThrottle: SpecialDressphereDef = {
  id: 'full-throttle',
  name: 'Full Throttle',
  owner: 'paine',
  partIds: { main: 'full-throttle-main', podA: 'full-throttle-right', podB: 'full-throttle-left' },
  citation: 'ffx2-combat-core.md §3.15 [single source: SinirothX §19]',
  abilities: {
    main: [
      { abilityId: 'x2-full-throttle-attack', apCost: 20, free: true },
      { abilityId: 'x2-full-throttle-fright', apCost: 20, prereq: 'x2-full-throttle-assoil' },
      { abilityId: 'x2-full-throttle-aestus', apCost: 10, free: true },
      { abilityId: 'x2-full-throttle-winterkill', apCost: 10, free: true },
      { abilityId: 'x2-full-throttle-whelmen', apCost: 10, free: true },
      { abilityId: 'x2-full-throttle-levin', apCost: 10, free: true },
      { abilityId: 'x2-full-throttle-wisenen', apCost: 10 },
      { abilityId: 'x2-full-throttle-fiers', apCost: 20, prereq: 'x2-full-throttle-wisenen' },
      { abilityId: 'x2-full-throttle-deeth', apCost: 20, prereq: 'x2-full-throttle-fiers' },
      { abilityId: 'x2-full-throttle-assoil', apCost: 20 },
      { abilityId: 'x2-full-throttle-sword-dance', apCost: 30, prereq: 'x2-full-throttle-fright' },
    ],
    podA: [
      { abilityId: 'x2-full-throttle-venom-wing', apCost: 10, free: true },
      { abilityId: 'x2-full-throttle-blind-wing', apCost: 10, free: true },
      { abilityId: 'x2-full-throttle-mute-wing', apCost: 10, free: true },
      { abilityId: 'x2-full-throttle-rock-wing', apCost: 10 },
      { abilityId: 'x2-full-throttle-lazy-wing', apCost: 10, free: true },
      { abilityId: 'x2-full-throttle-violent-wing', apCost: 10 },
      { abilityId: 'x2-full-throttle-still-wing', apCost: 10 },
      { abilityId: 'x2-full-throttle-crazy-wing', apCost: 10, prereq: 'x2-full-throttle-violent-wing' },
      { abilityId: 'x2-full-throttle-stamina-dextral', apCost: 10, free: true },
      { abilityId: 'x2-full-throttle-mettle-dextral', apCost: 10, free: true },
      { abilityId: 'x2-full-throttle-reboot-dextral', apCost: 10, prereq: 'x2-full-throttle-mettle-dextral' },
    ],
    podB: [
      { abilityId: 'x2-full-throttle-steel-feather', apCost: 10, free: true },
      { abilityId: 'x2-full-throttle-diamond-feather', apCost: 10, free: true },
      { abilityId: 'x2-full-throttle-white-feather', apCost: 10, free: true },
      { abilityId: 'x2-full-throttle-buckle-feather', apCost: 10, free: true },
      { abilityId: 'x2-full-throttle-cloudy-feather', apCost: 10 },
      { abilityId: 'x2-full-throttle-pointed-feather', apCost: 10, prereq: 'x2-full-throttle-cloudy-feather' },
      { abilityId: 'x2-full-throttle-pumice-feather', apCost: 10 },
      { abilityId: 'x2-full-throttle-maats-feather', apCost: 10 },
      { abilityId: 'x2-full-throttle-stamina', apCost: 10, free: true },
      { abilityId: 'x2-full-throttle-mettle-sinistral', apCost: 10, free: true },
      { abilityId: 'x2-full-throttle-reboot', apCost: 10, prereq: 'x2-full-throttle-mettle-sinistral' },
    ],
  },
};

export default fullThrottle;
