/**
 * Chapter 2 party build — Zanarkand Dome, The Beyond (Lady Yunalesca).
 *
 * Build point: after the Chamber of the Fayth, immediately following the
 * Spectral Keeper. The authored story-progress preset lives in
 * `research/ffx-yunalesca.md` §11; aeon stats for this point are in §12.
 *
 * TODO(data-agent): replace every placeholder below.
 *   - §11 gives per-character HP/MP/stats, learned abilities and equipment.
 *   - **Do not equip Zombieproof** and do not stock a blanket Zombie cure as
 *     the obvious answer: the encounter's core lesson is entering Form III with
 *     at least one member still Zombie-afflicted so they survive Mega Death
 *     [ffx-yunalesca §10.1]. Holy Water must be *available*, not automatic.
 *   - §7 lists the status interaction matrix the build has to survive; §2.5
 *     shows she is immune to almost every status a player would try.
 */

import type { FFXPartyBuild, StatBlock } from '../../../battle/common/types.ts';

/** TODO(data-agent): placeholder stat block. Every value is a stand-in. */
function todoStats(): StatBlock {
  return {
    hp: 1600,
    mp: 160,
    str: 28,
    def: 26,
    mag: 28,
    mdef: 26,
    agi: 24,
    luck: 18,
    eva: 12,
    acc: 24,
    maxHp: 1600,
    maxMp: 160,
  };
}

export const zanarkandBuild: FFXPartyBuild = {
  game: 'ffx',
  members: [
    {
      id: 'tidus',
      name: 'Tidus',
      spriteKey: 'tidus',
      portraitKey: 'tidus-face',
      stats: todoStats(),
      hp: 1600,
      mp: 160,
      learnedAbilityIds: [], // TODO(data-agent): §11
      equipment: {
        weapon: { name: 'TODO Weapon', slots: 3, autoAbilities: [] },
        armor: { name: 'TODO Armor', slots: 3, autoAbilities: [] },
      },
      overdrive: { gauge: 0, mode: 'stoic', unlockedModes: ['stoic'], unlockedOverdriveIds: [] },
      sphereGrid: { position: 'TODO', activatedNodeIds: [], sLv: 0, ap: 0, spheres: {} },
    },
    {
      id: 'yuna',
      name: 'Yuna',
      spriteKey: 'yuna',
      portraitKey: 'yuna-face',
      stats: todoStats(),
      hp: 1600,
      mp: 160,
      learnedAbilityIds: [], // TODO(data-agent): §11
      equipment: {
        weapon: { name: 'TODO Staff', slots: 3, autoAbilities: [] },
        armor: { name: 'TODO Ring', slots: 3, autoAbilities: [] },
      },
      overdrive: { gauge: 0, mode: 'stoic', unlockedModes: ['stoic'], unlockedOverdriveIds: [] },
      sphereGrid: { position: 'TODO', activatedNodeIds: [], sLv: 0, ap: 0, spheres: {} },
    },
    {
      id: 'auron',
      name: 'Auron',
      spriteKey: 'auron',
      portraitKey: 'auron-face',
      stats: todoStats(),
      hp: 1600,
      mp: 160,
      learnedAbilityIds: [], // TODO(data-agent): §11
      equipment: {
        weapon: { name: 'TODO Katana', slots: 3, autoAbilities: [] },
        armor: { name: 'TODO Bracer', slots: 3, autoAbilities: [] },
      },
      overdrive: { gauge: 0, mode: 'stoic', unlockedModes: ['stoic'], unlockedOverdriveIds: [] },
      sphereGrid: { position: 'TODO', activatedNodeIds: [], sLv: 0, ap: 0, spheres: {} },
    },
  ],
  activeSlots: ['tidus', 'yuna', 'auron'],
  reserve: [], // TODO(data-agent): wakka, lulu, kimahri, rikku
  aeons: [], // TODO(data-agent): §12
  inventory: [], // TODO(data-agent): Holy Water must be present but not abundant
  gil: 0, // TODO(data-agent)
  sphereInventory: {}, // TODO(data-agent)
};

export default zanarkandBuild;
