/**
 * Chapter 1 enemy group — Seymour Flux + Mortiorchis (Mt. Gagazet).
 *
 * Source: `research/ffx-seymour-flux.md`. Seymour Flux is `m142` / bestiary
 * #150; Mortiorchis is `m143` / #151. Boss-only `AbilityDef`s live in
 * `./seymour-flux-abilities.ts`.
 *
 * **Two-actor rig, one silhouette [§8.2].** Cross Cleave, Full-Life, Slowga
 * and Total Annihilation are rows in **Seymour's** own decompiled action
 * list (`m142`) and use **his** Strength 30 / Magic 15 — the damage math in
 * §5.4 independently confirms this against three guides' observed numbers.
 * They are only ever **animated** on the Mortiorchis actor. Accordingly
 * those ids live in `seymourFlux.abilityIds` below, not Mortiorchis's; the
 * presenter/engine must render them with the Mortiorchis sprite regardless
 * of which combatant "owns" the turn. Mortiorchis's own action list
 * contains only Mortibsorption and the "Auto-Attack Mode" telegraph — the
 * latter has no `AbilityDef` at all, since it carries no damage or status
 * and is presented purely through the engine's `charge` event
 * (`{ name: 'Auto-Attack Mode' | 'Ready To Annihilate', stage, turnsLeft }`,
 * per `visual-bible` §3.13) [§4.4.2].
 *
 * **The alternation rule [§4.1, verified: 2 sources].** If either actor
 * would get two turns in a row, the second is a no-op ("Seymour Waits" /
 * "Failed Counterstrike"). AI-script concern, not data — flagged here so
 * the engine agent doesn't miss it.
 *
 * **Threaten conflict [§1.3, §9 C-2 — unresolved].** The decompiled byte
 * reads 0 (landable), but the Final Fantasy Wiki and Game8 both
 * independently call Flux immune/resistant. The research explicitly
 * recommends defaulting to immune pending in-game verification, which is
 * what `threatenChance: 0` below does; flip to a nonzero value if footage
 * contradicts it.
 *
 * **Slow/Haste resistance — internal contradiction resolved [§1.3].** The
 * source document's own resistance table lists "Slow | 255 | Immune" in one
 * row and then, three rows later, "Haste / Slow / Shell / Protect / Reflect
 * / Regen / Scan / NulAll | 0 | Landable" for the same statuses. The
 * strategy section (§6 row 11) is unambiguous and load-bearing — "Haste on
 * Seymour (he has 0 Slow/Haste resistance)... a genuinely delightful
 * mechanic, worth preserving" — so this file ships Slow and Haste as
 * **landable** (resistance 0, i.e. omitted from `immunities`), treating the
 * standalone "Slow | 255" row as a copy/paste artefact from a different
 * enemy's table.
 */

import type { EnemyGroupDef } from '../../../battle/common/types.ts';

export const seymourFluxGroup: EnemyGroupDef = {
  id: 'seymour-flux',
  game: 'ffx',
  canEscape: false,
  enemies: [
    {
      id: 'seymour-flux',
      name: 'Seymour Flux',
      spriteKey: 'seymour-flux-body',
      slot: 0,
      // §1.1 [verified: 2 sources] — decompile + wiki/GamerGuides/Game8 agree.
      stats: {
        hp: 70000,
        mp: 512,
        str: 30,
        def: 40,
        mag: 15,
        mdef: 40,
        agi: 38,
        luck: 15,
        eva: 0,
        acc: 100,
        maxHp: 70000,
        maxMp: 512,
      },
      hp: 70000,
      mp: 512,
      // §1.2 [decompiled]. All five elements Neutral — Game8's "resists all
      // elements (100%)" is a misreading of a neutral (x1.0) multiplier; the
      // decompiled affinity bytes are all zero. An empty map is correct.
      affinities: {},
      // §1.3 [decompiled], with the Slow/Haste resolution above.
      immunities: {
        poison: 90, // §1.3 [decompiled + wiki] — the fight's one real vulnerability
        silence: 50, // §1.3 [decompiled + wiki]
        ko: 255, // §1.3 [decompiled] "Death"
        zombie: 255, // §1.3 [decompiled]
        petrify: 255, // §1.3 [decompiled]
        sleep: 255, // §1.3 [decompiled]
        darkness: 255, // §1.3 [decompiled] "Dark"
        confuse: 255, // §1.3 [decompiled]
        berserk: 255, // §1.3 [decompiled]
        provoke: 255, // §1.3 [decompiled]
        doom: 255, // §1.3 [decompiled]
        'power-break': 255, // §1.3 [decompiled]
        'magic-break': 255, // §1.3 [decompiled]
        'armor-break': 255, // §1.3 [decompiled]
        'mental-break': 255, // §1.3 [decompiled]
        eject: 255, // §1.3 [decompiled]
        'auto-life': 255, // §1.3 [decompiled] "Cannot be given Auto-Life"
      },
      // §1.1, §1.3 [decompiled]. Not `immune-to-life` (a flavour quirk unlike
      // every other Seymour form, per §1.3, with no practical consequence
      // since he is `ko`-immune and the player cannot revive him anyway).
      immunityFlags: ['boss', 'immune-to-percentage-damage', 'immune-to-delay', 'immune-to-bribe'],
      forms: [
        {
          name: 'Seymour Flux',
          spriteKey: 'seymour-flux-body',
          hp: 70000, // §1.1 [verified: 2 sources]
        },
      ],
      aiScriptId: 'seymour-flux', // engine-owned; see §4 for the full phase/counter script this must implement
      rewards: {
        ap: 10000, // §1.1 [verified: 2 sources]
        apOverkill: 15000, // §1.1 [decompiled + wiki]
        gil: 6000, // §1.1 [decompiled + wiki]
        overkillThreshold: 3500, // §1.1 [verified: 2 sources]
        // §1.4 [verified: 2 sources]. Decompiled drop chance is byte 255
        // (guaranteed); the "x2 on overkill" nuance has no field on
        // `ItemDrop` in the current contract — see the final report's
        // contract question.
        drops: [{ itemId: 'lv-4-key-sphere', count: 1 }],
        steal: {
          baseChance: 100, // §1.4 [decompiled byte 255 = guaranteed, clamped to the 0-100 contract range]
          common: { itemId: 'elixir', count: 1 },
          rare: { itemId: 'elixir', count: 1 },
        },
        // §1.4 [decompiled] `immune_to_bribe` is set — bribe always fails regardless of gil.
        bribe: { item: { itemId: 'elixir', count: 1 }, immune: true },
      },
      abilityIds: [
        'lance-of-atrophy', // §3.1
        'full-life', // §3.1, §3.3 — animated on Mortiorchis, computed with Seymour's stats
        'cross-cleave', // §3.1, §5.4 — animated on Mortiorchis
        'total-annihilation', // §3.1, §5.4 — animated on Mortiorchis
        'flare-self', // §3.1, §3.3, §4.4.1
        'banish', // §3.1, §4.5
        'slowga-counter', // §3.1, §4.6 — animated on Mortiorchis
        // Shared player-facing spells (owned by the abilities data agent):
        'protect', // §3.1 — HP < 75% counter, self-target
        'reflect', // §3.1 — HP < 50% counter, self-target
        'dispel', // §3.1 — Phase-1 step 5, party-wide
      ],
      flags: { isBoss: true },
      sensorText: 'Turns healing into a weapon. Kill the floating thing before it finishes counting.',
      scanText:
        'Unsent. Inflicts Zombie with Lance of Atrophy so that its servant’s revival magic becomes lethal. Banishes aeons. When the servant stops attacking, it has begun to charge.',
      poisonTickPercent: 2, // §1.1 [verified: 2 sources] 2% of 70,000 = 1,400/turn
      doomTurns: 3, // §1.1 [decompiled]
      zanmatoLevel: 4, // §1.1 [decompiled] byte 402
      // §1.3, §9 C-2 [unresolved conflict — see file header]. Recommendation
      // is to default to immune pending in-game verification.
      threatenChance: 0,
    },
    {
      id: 'mortiorchis',
      name: 'Mortiorchis',
      spriteKey: 'mortiorchis',
      slot: 1,
      // §2 [decompiled + wiki, verified: 2 sources]. MDef 0 clamps to 1 in the formula.
      stats: {
        hp: 4000,
        mp: 512,
        str: 40,
        def: 100,
        mag: 40,
        mdef: 0,
        agi: 38,
        luck: 15,
        eva: 0,
        acc: 100,
        maxHp: 4000,
        maxMp: 512,
      },
      hp: 4000,
      mp: 512,
      affinities: {}, // §2 [decompiled] — not stated to differ from Flux; treated as all Neutral
      // §2.1 [decompiled]. Effectively immune to everything meaningful,
      // unlike Seymour: Mortiorchis's Slow AND Haste are both immune here
      // (the contradiction resolved above is specific to Seymour's own
      // table; Mortiorchis's separate §2.1 list is internally consistent).
      immunities: {
        ko: 255,
        zombie: 255,
        petrify: 255,
        poison: 255, // §2 "poison tick 0% — poison does nothing to it"
        sleep: 255,
        silence: 255,
        darkness: 255,
        confuse: 255,
        berserk: 255,
        provoke: 255,
        slow: 255,
        haste: 255,
        doom: 255,
        eject: 255,
        'auto-life': 255,
        'power-break': 255,
        'magic-break': 255,
        'armor-break': 255,
        'mental-break': 255,
      },
      // §2 [decompiled + wiki, verified: 2 sources]. Armored is the whole
      // point of this fight's Piercing-vs-magic puzzle (§2.1).
      immunityFlags: ['armored', 'immune-to-percentage-damage', 'immune-to-delay', 'immune-to-bribe'],
      forms: [{ name: 'Mortiorchis', spriteKey: 'mortiorchis', hp: 4000 }],
      aiScriptId: 'mortiorchis', // engine-owned; see §4.4.2 for the charge ladder + §2.2 for the death-trigger reaction
      rewards: { ap: 0, apOverkill: 0, gil: 0, overkillThreshold: 36000, drops: [] }, // §2 [decompiled + wiki] no drops/steal/bribe — effectively unreachable overkill
      abilityIds: ['mortibsorption'], // §2.2, §3.2 — its only scheduled action besides the no-damage charge telegraph
      flags: { isPart: true, partOf: 'seymour-flux' },
      sensorText: 'It is not attacking you. It is waiting for a number to fill.',
      scanText:
        'Bound servant. Heals its master, revives the fallen — including the Zombied, fatally — and accumulates charge for a single overwhelming release.',
      poisonTickPercent: 0, // §2 [decompiled]
      zanmatoLevel: 4, // §2 [single source: wiki]
      threatenChance: 0, // §2.1 [decompiled] "Threaten" is in the effectively-immune list
    },
  ],
  musicCues: [
    // Final music key per docs/CONTRACT-CHANGES.md's decided vocabulary
    // (data agents reference the final keys; audio agents compose them).
    { at: 'start', track: 'boss-seymour', fadeMs: 800 },
  ],
};

export default seymourFluxGroup;
