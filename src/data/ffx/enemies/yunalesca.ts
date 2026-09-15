/**
 * Chapter 2 enemy group — Lady Yunalesca, three forms (Zanarkand Dome).
 *
 * Source: `research/ffx-yunalesca.md`. Bestiary #167.
 *
 * Structural fact [§2.2]: the decompiled record stores **one** HP field
 * (132 000, overkill 10 000). The 24 000 / 48 000 / 60 000 split is imposed by
 * the **battle script**, not by three enemy entries — so this is one combatant
 * with three {@link EnemyForm}s, and AP / gil / drops are granted **once**, at
 * the end of form III.
 *
 * Shared stats across all three forms [§2.1]: MP 500, STR 20, DEF 50, MAG 30,
 * MDEF 50, AGI 40, LUCK 20, EVA 0, ACC 0 (decompile) / 1 (wiki) — conflict
 * recorded in §14.1, ship the decompile's 0.
 *
 * TODO(data-agent): transcribe the full records.
 *   - §2.3 all five elements are **Neutral**. The Sensor line's Holy weakness
 *     is in-world misinformation — `misleadingSensor: true`, do NOT implement
 *     a Holy multiplier.
 *   - §2.4 damage-class flags: `immune_to_percentage_damage`,
 *     `immune_to_life`, `immune_to_delay`, `immune_to_bribe` are all true.
 *   - §2.5 status resistance bytes (almost everything 255).
 *   - §3 action constants, §5 AI script per form.
 *   - §4.4: she sits in the **25% Threaten tier** — a long shot, not a lockdown.
 *   - The build recommendation for overflow at a form transition is
 *     `damage = min(damage, form.currentHP)`, behind
 *     `yunalesca.overflowCarries = false` [§2.2]. That is the
 *     `EnemyForm.overflowCarries` field.
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
      // §2.1 — shared across all three forms. HP is per-form, below.
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
      affinities: {}, // §2.3: all five elements Neutral — an empty map is correct.
      immunities: {}, // TODO(data-agent): §2.5
      immunityFlags: [
        'boss',
        'immune-to-percentage-damage',
        'immune-to-life',
        'immune-to-delay',
        'immune-to-bribe',
      ],
      forms: [
        // TODO(data-agent): §5 per-form AI script ids.
        { name: 'Yunalesca', spriteKey: 'yunalesca-1', hp: 24000, overflowCarries: false },
        { name: 'Yunalesca', spriteKey: 'yunalesca-2', hp: 48000, overflowCarries: false },
        { name: 'Yunalesca', spriteKey: 'yunalesca-3', hp: 60000, overflowCarries: false },
      ],
      aiScriptId: 'yunalesca-form-1', // TODO(data-agent): §5
      rewards: {
        // §2.2 — attached only to form III, granted once at the end.
        ap: 14000,
        apOverkill: 21000,
        gil: 9000,
        overkillThreshold: 10000,
        drops: [], // TODO(data-agent)
      },
      abilityIds: [], // TODO(data-agent): §3
      flags: { isBoss: true },
      sensorText: 'Weak to Holy, they say. They have been saying it for a thousand years.',
      scanText:
        'The first summoner. Changes form twice, each crueller than the last. Zombies the living, then kills everything still alive. Her mercy and her attacks are the same thing.',
      misleadingSensor: true,
      threatenChance: 25, // §4.4 — the 25% tier.
    },
  ],
  musicCues: [
    // TODO(data-agent): shares "Challenge" with Seymour Flux; stand-in is `boss-dread`.
    { at: 'start', track: 'boss-dread', fadeMs: 800 },
  ],
};

export default yunalescaGroup;
