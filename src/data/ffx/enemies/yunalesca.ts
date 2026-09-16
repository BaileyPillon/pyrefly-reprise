/**
 * Chapter 2 enemy group — Lady Yunalesca, three forms (Zanarkand Dome).
 *
 * Source: `research/ffx-yunalesca.md`. Bestiary #167. Boss-only
 * `AbilityDef`s live in `./yunalesca-abilities.ts`; her Cura/Curaga/Regen
 * are the shared player-facing spell ids (see that file's header).
 *
 * Structural fact [§2.2, decompiled]: the record stores **one** HP field
 * (132,000, overkill 10,000). The 24,000 / 48,000 / 60,000 split is imposed
 * by the **battle script** (`MonsterAi::init`), not by three enemy entries —
 * so this is one combatant with three {@link EnemyForm}s, and AP / gil /
 * drops are granted **once**, at the end of form III. Each transition
 * *re-assigns* `maxHp`/`hp` wholesale; overflow past a form's remaining HP
 * is structurally discarded, hence `overflowCarries: false` on every form
 * per CONTRACT-CHANGES §3.
 *
 * Shared stats across all three forms [§2.1, verified: 3 sources]: MP 500,
 * STR 20, DEF 50, MAG 30, MDEF 50, AGI 40, LUCK 20, EVA 0, ACC 0 (decompile;
 * wiki says 1 — §14.1 resolves in favour of 0, since every one of her
 * offensive actions uses hit formula "Always" or a fixed accuracy, so the
 * stat is inert either way).
 */

import type { EnemyGroupDef } from '../../../battle/common/types.ts';

export const yunalescaGroup: EnemyGroupDef = {
  id: 'yunalesca',
  game: 'ffx',
  canEscape: false,
  enemies: [
    {
      id: 'yunalesca',
      name: 'Yunalesca',
      spriteKey: 'yunalesca-1',
      slot: 0,
      // §2.1 [verified: 3 sources] — shared across all three forms. HP is per-form, below.
      stats: {
        hp: 24000,
        mp: 500,
        str: 20,
        def: 50,
        mag: 30,
        mdef: 50,
        agi: 40,
        luck: 20,
        eva: 0,
        acc: 0,
        maxHp: 24000,
        maxMp: 500,
      },
      hp: 24000,
      mp: 500,
      affinities: {}, // §2.3 [verified: 2 sources]: all five elements Neutral — an empty map is correct.
      // §2.5 [decompiled, corroborated by the wiki stat block, verified: 2 sources].
      immunities: {
        ko: 255, // "Death"
        zombie: 255,
        petrify: 255,
        poison: 255,
        'power-break': 255,
        'magic-break': 255,
        'armor-break': 255,
        'mental-break': 255,
        confuse: 255,
        berserk: 255,
        provoke: 255,
        sleep: 255,
        silence: 255,
        darkness: 255, // "Dark"
        slow: 255,
        eject: 255,
        'auto-life': 255,
        doom: 255,
      },
      immunityFlags: [
        'boss',
        'immune-to-percentage-damage', // §2.4 [decompiled] Demi/Gravity/Bio-percentage effects deal 0
        'immune-to-life', // §2.4 [decompiled] Life/Full-Life/Phoenix Down cannot be used on her
        'immune-to-delay', // §2.4 [decompiled] weak/strong Delay do nothing
        'immune-to-bribe', // §2.4 [decompiled] Bribe always fails
      ],
      forms: [
        {
          name: 'Yunalesca',
          spriteKey: 'yunalesca-1',
          hp: 24000, // §2.2 [verified: 5 sources]
          aiScriptId: 'yunalesca-form-1',
          overflowCarries: false, // §2.2, §14.3 [decompiled] — resolved, ship as the only behaviour
        },
        {
          name: 'Yunalesca',
          spriteKey: 'yunalesca-2',
          hp: 48000, // §2.2 [verified: 5 sources]
          aiScriptId: 'yunalesca-form-2',
          overflowCarries: false,
        },
        {
          name: 'Yunalesca',
          spriteKey: 'yunalesca-3',
          hp: 60000, // §2.2 [verified: 4 sources]
          aiScriptId: 'yunalesca-form-3',
          overflowCarries: false,
        },
      ],
      aiScriptId: 'yunalesca-form-1',
      rewards: {
        // §2.2 [verified: 4 sources] — attached only to form III, granted once at the end.
        ap: 14000,
        apOverkill: 21000,
        gil: 9000,
        overkillThreshold: 10000,
        // §2.6 [verified: 3 sources]. Decompiled drop chance is byte 255
        // (effectively guaranteed; Game8's "7/8" is an unresolved minor
        // conflict, §14.5 — decompile preferred). "x2 on overkill" and the
        // separate guaranteed equipment drop (2-4 slots, Piercing +
        // Zombiestrike/Zombieproof, §2.6) have no field on the current
        // `EnemyRewards`/`ItemDrop` shape — see the final report's contract
        // question.
        drops: [{ itemId: 'lv-3-key-sphere', count: 1 }],
        steal: {
          baseChance: 100, // §2.6 [verified: 4 sources] decompiled byte 255, clamped to the 0-100 contract range
          common: { itemId: 'stamina-tablet', count: 1 },
          rare: { itemId: 'farplane-wind', count: 1 },
        },
        bribe: { item: { itemId: 'farplane-wind', count: 1 }, immune: true }, // §2.6 [decompiled] immune_to_bribe
      },
      abilityIds: [
        'dispelling-slap', // §3, §5.1
        'absorb', // §3, §5.1
        'osmose', // §3, §5.2, §5.3 — aeon cycles only
        'hellbiter', // §3, §5.2, §5.3
        'mind-blast', // §3, §5.3
        'mind-blast-aeon', // §3, §5.2, §5.3
        'mega-death', // §3, §5.3
        'blind-counter', // §5.1 — Form I only
        'silence-counter', // §5.1 — Form I only
        'sleep-counter', // §5.1 — Form I only
        'metamorphosis-1', // §5.1
        'metamorphosis-2', // §5.2
        // Shared player-facing spells (owned by the abilities data agent) —
        // §3.1 [verified: 2 sources]: these ARE the player's own Cura/
        // Curaga/Regen records, same MP cost, same power, same
        // affected_by_reflect.
        'cura',
        'curaga',
        'regen',
      ],
      flags: { isBoss: true },
      sensorText: 'Weak to Holy, they say. They have been saying it for a thousand years.',
      scanText:
        'The first summoner. Changes form twice, each crueller than the last. Zombies the living, then kills everything still alive. Her mercy and her attacks are the same thing.',
      misleadingSensor: true,
      threatenChance: 25, // §2.5, §4.4 [decompiled] the 25% tier — a long shot, not a lockdown.
      zanmatoLevel: 4, // §14.2 [verified: 2 sources] — a second, independent decompile agrees with the wiki; flipped from the earlier "3".
    },
  ],
  musicCues: [
    // Final music key per docs/CONTRACT-CHANGES.md's decided vocabulary.
    { at: 'start', track: 'boss-yunalesca', fadeMs: 800 },
  ],
};

export default yunalescaGroup;
