/**
 * Chapter 1 party build — Mt. Gagazet, the Prominence (Seymour Flux).
 *
 * Build point: post-Ronso, pre-summit. The authored "average non-grinding
 * player" preset lives in `research/ffx-seymour-flux.md` §7 — transcribe it
 * here, citing the sub-section on every number.
 *
 * TODO(data-agent): replace every placeholder below.
 *   - §7.1–7.7 give per-character stats, learned abilities and equipment.
 *   - §7.7 notes that Wantz (the Gagazet merchant) sells the Holy Water and the
 *     two Zombie Ward armours that answer Lance of Atrophy + Full-Life; the
 *     inventory should make that answer reachable but not pre-solved.
 *   - §4.7: the pre-battle Talk trigger grants Kimahri +10 STR and Yuna
 *     +10 MDEF for this battle. That is a `TriggerCommand`, not a build stat.
 *   - Aeons: `research/ffx-yunalesca.md` §12 has the aeon stat band for this
 *     stretch of the game. Seymour Banishes a summon after exactly one turn
 *     [ffx-combat-core §6.1], so the aeon list matters mainly for that beat.
 */

import type { FFXPartyBuild, StatBlock } from '../../../battle/common/types.ts';

/** TODO(data-agent): placeholder stat block. Every value is a stand-in. */
function todoStats(): StatBlock {
  return {
    hp: 1000,
    mp: 100,
    str: 20,
    def: 20,
    mag: 20,
    mdef: 20,
    agi: 20,
    luck: 18,
    eva: 10,
    acc: 20,
    maxHp: 1000,
    maxMp: 100,
  };
}

export const gagazetBuild: FFXPartyBuild = {
  game: 'ffx',
  members: [
    {
      id: 'tidus',
      name: 'Tidus',
      spriteKey: 'tidus',
      portraitKey: 'tidus-face',
      stats: todoStats(),
      hp: 1000,
      mp: 100,
      learnedAbilityIds: [], // TODO(data-agent): §7.1
      equipment: {
        weapon: { name: 'TODO Weapon', slots: 2, autoAbilities: [] },
        armor: { name: 'TODO Armor', slots: 2, autoAbilities: [] },
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
      hp: 1000,
      mp: 100,
      learnedAbilityIds: [], // TODO(data-agent): §7.5
      equipment: {
        weapon: { name: 'TODO Staff', slots: 2, autoAbilities: [] },
        armor: { name: 'TODO Ring', slots: 2, autoAbilities: [] },
      },
      overdrive: { gauge: 0, mode: 'stoic', unlockedModes: ['stoic'], unlockedOverdriveIds: [] },
      sphereGrid: { position: 'TODO', activatedNodeIds: [], sLv: 0, ap: 0, spheres: {} },
    },
    {
      id: 'kimahri',
      name: 'Kimahri',
      spriteKey: 'kimahri',
      portraitKey: 'kimahri-face',
      stats: todoStats(),
      hp: 1000,
      mp: 100,
      learnedAbilityIds: [], // TODO(data-agent): §7.7
      equipment: {
        weapon: { name: 'TODO Spear', slots: 2, autoAbilities: [] },
        armor: { name: 'TODO Armlet', slots: 2, autoAbilities: [] },
      },
      overdrive: { gauge: 0, mode: 'stoic', unlockedModes: ['stoic'], unlockedOverdriveIds: [] },
      sphereGrid: { position: 'TODO', activatedNodeIds: [], sLv: 0, ap: 0, spheres: {} },
    },
  ],
  activeSlots: ['tidus', 'yuna', 'kimahri'],
  reserve: [], // TODO(data-agent): auron, wakka, lulu, rikku
  aeons: [], // TODO(data-agent): valefor, ifrit, ixion, shiva, bahamut
  inventory: [], // TODO(data-agent): §7.6 + the Wantz shop stock
  gil: 0, // TODO(data-agent)
  sphereInventory: {}, // TODO(data-agent)
};

export default gagazetBuild;
