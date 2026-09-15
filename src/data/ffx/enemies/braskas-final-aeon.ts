/**
 * Chapter 3 enemy groups — Braska's Final Aeon -> possessed aeons -> Yu Yevon.
 *
 * Source: `research/ffx-bfa-yu-yevon.md`. BFA is bestiary #233; the Yu Pagodas
 * are `m173`/`m174`; Yu Yevon's shell holds 99 999 HP.
 *
 * This chapter is a **chain**: one continuous run of battles with no menu
 * between, linked by {@link EnemyGroupDef.nextGroupId}. Two Yu Pagodas are
 * present in every battle from the BFA fight onward.
 *
 * Verified headline numbers:
 *   BFA form 1   HP 60 000, form 2 HP 120 000, overkill 20 000, MP 100,
 *                STR 45 -> 50, DEF 100, MAG 50, MDEF 100, AGI 44, LUCK 15,
 *                EVA 0, ACC 10, AP 0, gil 0, poison tick 1% of max HP.
 *                Steal: common Turbo Ether, rare Elixir. No drops.
 *                **Regen-immune.** Zanmato level 6.
 *   Yu Pagoda    overkill 5 000; uses the #210 Power Wave variant, which strips
 *                Poison / Zombie / **Reflect**.
 *   Yu Yevon     HP 99 999, MP 1, STR 1, MAG 200, AGI 44, poison tick 10% of
 *                max HP = 9 999/tick, Doom counter 3 turns.
 *
 * TODO(data-agent): transcribe the full records.
 *   - §1.2 elemental/status tables, §1.3 action rows, §1.6 the Overdrive gauge
 *     model (+20% per Yu Pagoda Power Wave, +0–10% per turn) and the **Talk**
 *     trigger command: two charges, effect lands on BFA's next turn which he
 *     then loses, offered a useless third time [visual-bible §3.12.2].
 *   - §1.6: the gauge **carries over** across the form transition; do not reset.
 *   - §2.2 possessed aeons **mirror the player's own aeon stats live**, Luck
 *     forced to 1. The stat blocks below are placeholders the engine overwrites
 *     at setup; only aeons Yuna actually owns appear.
 *   - §2.3: from the possessed-aeon fights onward the party carries a
 *     permanent, non-consumable Auto-Life. Model it as an encounter flag.
 *   - §3 Yu Yevon's script.
 */

import type { EnemyDef, EnemyGroupDef } from '../../../battle/common/types.ts';

/** TODO(data-agent): §1.4 — the two Yu Pagodas, identical except for slot. */
function todoYuPagoda(id: string, slot: number): EnemyDef {
  return {
    id,
    name: 'Yu Pagoda',
    spriteKey: 'yu-pagoda',
    slot,
    stats: {
      hp: 65535,
      mp: 0,
      str: 1,
      def: 1,
      mag: 1,
      mdef: 1,
      agi: 1,
      luck: 1,
      eva: 0,
      acc: 0,
      maxHp: 65535,
      maxMp: 0,
    }, // TODO(data-agent): §1.4
    hp: 65535,
    mp: 0,
    affinities: {}, // TODO(data-agent): §1.4
    immunities: {}, // TODO(data-agent): §1.4
    immunityFlags: ['immune-to-regen'],
    forms: [{ name: 'Yu Pagoda', spriteKey: 'yu-pagoda', hp: 65535 }],
    aiScriptId: 'yu-pagoda', // TODO(data-agent): Power Wave #210 variant
    rewards: { ap: 0, apOverkill: 0, gil: 0, overkillThreshold: 5000, drops: [] },
    abilityIds: [], // TODO(data-agent)
    flags: { isPart: true },
    sensorText: 'Every kindness it performs is aimed at you.',
    scanText:
      'Support construct. Restores HP, removes ailments and accelerates its master’s Overdrive. Destroying both halts all three.',
  };
}

/** Battle 1 of the chapter: BFA (two forms) plus the two Yu Pagodas. */
export const braskasFinalAeonGroup: EnemyGroupDef = {
  id: 'braskas-final-aeon',
  game: 'ffx',
  canEscape: false,
  nextGroupId: 'possessed-aeons',
  enemies: [
    {
      id: 'braskas-final-aeon',
      name: "Braska's Final Aeon",
      spriteKey: 'bfa-form-1',
      slot: 0,
      // §1.1 verified values for form 1; form 2 overrides STR 45 -> 50.
      stats: {
        hp: 60000,
        mp: 100,
        str: 45,
        def: 100,
        mag: 50,
        mdef: 100,
        agi: 44,
        luck: 15,
        eva: 0,
        acc: 10,
        maxHp: 60000,
        maxMp: 100,
      },
      hp: 60000,
      mp: 100,
      affinities: {}, // TODO(data-agent): §1.2
      immunities: {}, // TODO(data-agent): §1.2
      immunityFlags: ['boss', 'immune-to-regen'],
      forms: [
        { name: "Braska's Final Aeon", spriteKey: 'bfa-form-1', hp: 60000, aiScriptId: 'bfa-form-1' },
        {
          name: "Braska's Final Aeon",
          spriteKey: 'bfa-form-2',
          hp: 120000,
          statOverrides: { str: 50 },
          aiScriptId: 'bfa-form-2',
        },
      ],
      aiScriptId: 'bfa-form-1', // TODO(data-agent): §1.6
      rewards: {
        ap: 0,
        apOverkill: 0,
        gil: 0,
        overkillThreshold: 20000,
        drops: [],
        steal: {
          baseChance: 100, // TODO(data-agent): confirm against §1.1
          common: { itemId: 'turbo-ether', count: 1 },
          rare: { itemId: 'elixir', count: 1 },
        },
      },
      abilityIds: [], // TODO(data-agent): §1.3
      flags: { isBoss: true },
      sensorText: 'The pillars keep it standing. Take the pillars.',
      scanText:
        'A man made into a weapon. Petrifies with light. Its supports heal it, cleanse it, and feed its fury. When it takes up the sword, no one is safe from a single swing.',
      poisonTickPercent: 1,
      zanmatoLevel: 6,
    },
    todoYuPagoda('yu-pagoda-left', 1),
    todoYuPagoda('yu-pagoda-right', 2),
  ],
  musicCues: [
    // TODO(data-agent): original composition for Dream's End.
    { at: 'start', track: 'boss-dread', fadeMs: 800 },
  ],
};

/**
 * Battle 2..n: the possessed-aeon gauntlet, fought one aeon at a time in
 * acquisition order, always with the two Yu Pagodas. The engine builds the
 * actual roster at setup from the aeons Yuna owns and copies their live stats
 * in [§2.2], so this group carries only the Pagodas plus one placeholder slot.
 *
 * TODO(data-agent): §2.1/§2.2 movesets per aeon and the scripted opening beat
 * "Possessed by Yu Yevon!".
 */
export const possessedAeonsGroup: EnemyGroupDef = {
  id: 'possessed-aeons',
  game: 'ffx',
  canEscape: false,
  nextGroupId: 'yu-yevon',
  enemies: [todoYuPagoda('yu-pagoda-left', 1), todoYuPagoda('yu-pagoda-right', 2)],
  musicCues: [{ at: 'start', track: 'boss-dread', fadeMs: 800 }],
};

/** The last battle. Cannot be lost: the party carries the fayth's Auto-Life. */
export const yuYevonGroup: EnemyGroupDef = {
  id: 'yu-yevon',
  game: 'ffx',
  canEscape: false,
  enemies: [
    {
      id: 'yu-yevon',
      name: 'Yu Yevon',
      spriteKey: 'yu-yevon',
      slot: 0,
      // §3.1 verified values.
      stats: {
        hp: 99999,
        mp: 1,
        str: 1,
        def: 0,
        mag: 200,
        mdef: 0,
        agi: 44,
        luck: 1,
        eva: 0,
        acc: 1,
        maxHp: 99999,
        maxMp: 1,
      },
      hp: 99999,
      mp: 1,
      affinities: {}, // TODO(data-agent): §3
      immunities: {}, // TODO(data-agent): §3
      immunityFlags: ['boss'],
      forms: [{ name: 'Yu Yevon', spriteKey: 'yu-yevon', hp: 99999 }],
      aiScriptId: 'yu-yevon', // TODO(data-agent): §3
      rewards: { ap: 0, apOverkill: 0, gil: 0, overkillThreshold: 99999, drops: [] },
      abilityIds: [], // TODO(data-agent): §3
      flags: { isBoss: true },
      sensorText: 'It cannot be reasoned with. It stopped being anyone a long time ago.',
      scanText:
        'A summoner’s remnant, still casting. Hides inside whatever will hold it. Drains life from all, then heals itself endlessly. You cannot be killed here. You can only be delayed.',
      poisonTickPercent: 10,
      doomTurns: 3,
    },
    todoYuPagoda('yu-pagoda-left', 1),
    todoYuPagoda('yu-pagoda-right', 2),
  ],
  musicCues: [{ at: 'start', track: 'boss-dread', fadeMs: 800 }],
};

export default braskasFinalAeonGroup;
