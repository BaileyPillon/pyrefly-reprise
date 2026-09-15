/**
 * Chapter 3 party build — Dream's End / Inside Sin (Braska's Final Aeon ->
 * possessed aeons -> Yu Yevon).
 *
 * Build point: endgame, explicitly **no superboss grinding**. The authored
 * estimate lives in `research/ffx-bfa-yu-yevon.md` §4.
 *
 * TODO(data-agent): replace every placeholder below.
 *   - §4 gives per-character stats, abilities and equipment as an authored
 *     estimate — cite it as `[estimate]` in comments, as the research does.
 *   - The party at battle start is **forced to Tidus / Yuna / Auron**; reserve
 *     swapping works normally [ffx-bfa-yu-yevon §1].
 *   - The possessed aeons **mirror the player's own aeon stats live**, so the
 *     `aeons` array below is simultaneously the party's summon roster and the
 *     boss roster for the second half of the chapter [ffx-bfa-yu-yevon §2.2].
 *     Feeding Yuna's grid harder makes the gauntlet harder. Keep the aeon block
 *     honest.
 *   - From the possessed-aeon fights onward the whole party carries a
 *     permanent, non-consumable **Auto-Life** granted by the fayth: model it as
 *     an encounter flag, not as an equipped auto-ability.
 *   - Braska's Final Aeon is **Regen-immune**, so do not build a Regen trick.
 */

import type { FFXPartyBuild, StatBlock } from '../../../battle/common/types.ts';

/** TODO(data-agent): placeholder stat block. Every value is a stand-in. */
function todoStats(): StatBlock {
  return {
    hp: 2400,
    mp: 220,
    str: 40,
    def: 32,
    mag: 38,
    mdef: 32,
    agi: 30,
    luck: 20,
    eva: 16,
    acc: 30,
    maxHp: 2400,
    maxMp: 220,
  };
}

export const dreamsEndBuild: FFXPartyBuild = {
  game: 'ffx',
  members: [
    {
      id: 'tidus',
      name: 'Tidus',
      spriteKey: 'tidus',
      portraitKey: 'tidus-face',
      stats: todoStats(),
      hp: 2400,
      mp: 220,
      learnedAbilityIds: [], // TODO(data-agent): §4
      equipment: {
        weapon: { name: 'TODO Weapon', slots: 4, autoAbilities: [] },
        armor: { name: 'TODO Armor', slots: 4, autoAbilities: [] },
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
      hp: 2400,
      mp: 220,
      learnedAbilityIds: [], // TODO(data-agent): §4
      equipment: {
        weapon: { name: 'TODO Staff', slots: 4, autoAbilities: [] },
        armor: { name: 'TODO Ring', slots: 4, autoAbilities: [] },
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
      hp: 2400,
      mp: 220,
      learnedAbilityIds: [], // TODO(data-agent): §4
      equipment: {
        weapon: { name: 'TODO Katana', slots: 4, autoAbilities: [] },
        armor: { name: 'TODO Bracer', slots: 4, autoAbilities: [] },
      },
      overdrive: { gauge: 0, mode: 'stoic', unlockedModes: ['stoic'], unlockedOverdriveIds: [] },
      sphereGrid: { position: 'TODO', activatedNodeIds: [], sLv: 0, ap: 0, spheres: {} },
    },
  ],
  activeSlots: ['tidus', 'yuna', 'auron'],
  reserve: [], // TODO(data-agent): wakka, lulu, kimahri, rikku
  aeons: [], // TODO(data-agent): §4 — also the possessed-aeon roster
  inventory: [], // TODO(data-agent): §4
  gil: 0, // TODO(data-agent)
  sphereInventory: {}, // TODO(data-agent)
};

export default dreamsEndBuild;
