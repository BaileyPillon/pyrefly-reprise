/**
 * **Seymour as the guest** of the hidden Sinspawn Gui chapter's second fight (FFX only; `research/re-ffx-ai-gui.md` section 7, "RE §n").
 *
 * Every number is the game's own: his row 7 of the party table (`ply_save.bin`, the party actor after Rikku) as the party-stat builder computes it, which is the base record because a guest has
 * no Sphere Grid and no percent abilities on his gear (RE §7.2). The game runs his row through the same builder as the seven guardians and gives the player his menu (RE §7.1: "he is a normal party
 * member of the stored formation: the player picks his commands in the ordinary menu"), so he is a **player-controlled guest** (`guest.control: 'player'`): no script, no forced command, no spoken line.
 *
 * | | |
 * |---|---|
 * | HP / MP | **1,200 / 999** (the row's max fields hold 1,000 / 1,000 placeholders the builder recomputes) |
 * | Strength / Defense / Magic / Magic Defense | 20 / 25 / 35 / **100** |
 * | Agility / Luck / Evasion / Accuracy | 20 / **18** / 10 / 10 (Luck: the game's own 18; the tracker's 17 is outvoted, `research` G-7) |
 * | Weapon | a staff with **Piercing** (record 26: formula 1, power 16, crit 3) |
 * | Armour | one **Sensor** (record 27) |
 * | Commands | Attack, Item, Escape (off), Cure, Cura, Scan, NulBlaze, NulShock, NulTide, Fire, Blizzard, Thunder, Water, Fira, Blizzara, Thundara, Watera (RE §7.3); **no NulFrost, Esuna, Haste, Life, Dispel, Curaga, Demi or Summon** |
 * | Overdrive | **Requiem**, mode **Stoic**, gauge **0**, max 100 (it fills only as monsters hurt him) |
 *
 * The game's Seymour Armour carries Sensor, so he reveals every enemy he sees (the Scan panel) without a turn. Anima is not in play: he has no summon (RE §7.5).
 * He leaves with the fight; he has no results row and earns nothing (`FFXGuestSpec`).
 */

import type { FFXMemberBuild } from '../../../battle/common/types.ts';

/** The weapon's base critical bonus, as every character's record carries (`research/ffx-seymour-flux.md` §7.7.1; the weapon record's crit byte is 3). */
const WEAPON_BONUS_CRIT = 3;

export const SEYMOUR_COMMANDS: readonly string[] = [
  'fire', 'blizzard', 'thunder', 'water', // 0x3042, 0x3041, 0x3043, 0x3044: MP 4, power 12
  'fira', 'blizzara', 'thundara', 'watera', // 0x3045 to 0x3048: MP 8, power 24
  'cure', 'cura', // 0x302b, 0x302c
  'scan', // 0x3032
  'nulblaze', 'nulshock', 'nultide', // 0x302f, 0x3030, 0x3031: rank 2, party-wide
];

/** A fresh copy each call: the group's `lineUp.joins` and every test own theirs. */
export function buildSeymourGuest(): FFXMemberBuild {
  return {
    id: 'seymour',
    name: 'Seymour',
    spriteKey: 'seymour-macalania', // his human form: the approved Macalania paintings (provisional here; they face left and the stage mirrors them onto the party side)
    portraitKey: 'seymour-macalania',
    stats: { hp: 1_200, mp: 999, str: 20, def: 25, mag: 35, mdef: 100, agi: 20, luck: 18, eva: 10, acc: 10, maxHp: 1_200, maxMp: 999 },
    hp: 1_200,
    mp: 999,
    learnedAbilityIds: [...SEYMOUR_COMMANDS],
    equipment: {
      weapon: { name: "Seymour's Staff", slots: 1, autoAbilities: ['piercing'], bonusCrit: WEAPON_BONUS_CRIT },
      armor: { name: "Seymour's Armor", slots: 1, autoAbilities: ['sensor'] },
    },
    overdrive: { gauge: 0, mode: 'stoic', unlockedModes: ['stoic'], unlockedOverdriveIds: ['requiem'] },
    sphereGrid: { position: 'seymour-none', activatedNodeIds: [], sLv: 0, ap: 0, spheres: {} }, // no Sphere Grid, no menu (RE §7.2)
    guest: { control: 'player' },
  };
}
