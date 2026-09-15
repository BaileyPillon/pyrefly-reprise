/**
 * Chapter 1 enemy group — Seymour Flux + Mortiorchis (Mt. Gagazet).
 *
 * Source: `research/ffx-seymour-flux.md`. Seymour Flux is `m142` / bestiary
 * #150; Mortiorchis is `m143` / #151.
 *
 * Verified headline numbers (§1.1, §2):
 *   Seymour Flux  HP 70 000, MP 512, overkill 3 500, STR 30 / DEF 40 /
 *                 MAG 15 / MDEF 40 / AGI 38 / LUCK 15 / EVA 0 / ACC 100,
 *                 AP 10 000 (15 000 overkill), gil 6 000, not armored,
 *                 poison tick 2% of max HP = 1 400/turn.
 *   Mortiorchis   HP 4 000 initial (see Mortibsorption, §2.2), MP 512,
 *                 STR 40 / DEF 100 / MAG 40 / MDEF 0 (clamps to 1) /
 *                 AGI 38 / LUCK 15 / EVA 0 / ACC 100, AP 0,
 *                 overkill 36 000 (effectively unreachable).
 *
 * TODO(data-agent): transcribe the full records.
 *   - §1.2 elemental affinities, §1.3 status resistances (raw 0–255 bytes).
 *   - §3 exact action data (decompiled action-table rows) -> `abilityIds`.
 *   - §4 AI script / turn rotation -> `aiScriptId`, and the two-stage charge
 *     telegraph: Auto-Attack Mode -> Ready To Annihilate -> Total Annihilation.
 *     After the first Total Annihilation, Mortiorchis **stays** in Auto-Attack
 *     Mode and needs only one charge turn per subsequent use [§4.5/§4.6].
 *   - Mortibsorption transfers HP from Mortiorchis to Seymour — model it with
 *     `AbilityDef.extra`, not a new formula.
 *   - Seymour Banishes any summoned aeon after exactly one aeon turn, and
 *     Banish **overrides the aeon's Eject immunity**, leaving it KO'd
 *     [ffx-combat-core §6.1].
 *   - Sensor / Scan copy is in `writing-bible.md` §5.3 (already original).
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
      spriteKey: 'seymour-flux',
      slot: 0,
      // TODO(data-agent): §1.1 — these are the verified values, HP/MP aside the
      // rest still needs the affinity and resistance tables filled in.
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
      affinities: {}, // TODO(data-agent): §1.2
      immunities: {}, // TODO(data-agent): §1.3, raw 0–255 bytes
      immunityFlags: ['boss'],
      forms: [
        {
          name: 'Seymour Flux',
          spriteKey: 'seymour-flux',
          hp: 70000,
        },
      ],
      aiScriptId: 'seymour-flux', // TODO(data-agent): §4
      rewards: {
        ap: 10000,
        apOverkill: 15000,
        gil: 6000,
        overkillThreshold: 3500,
        drops: [], // TODO(data-agent)
      },
      abilityIds: [], // TODO(data-agent): §3
      flags: { isBoss: true },
      sensorText: 'Turns healing into a weapon. Kill the floating thing before it finishes counting.',
      scanText:
        'Unsent. Inflicts Zombie with Lance of Atrophy so that its servant’s revival magic becomes lethal. Banishes aeons. When the servant stops attacking, it has begun to charge.',
      poisonTickPercent: 2,
      doomTurns: 3,
    },
    {
      id: 'mortiorchis',
      name: 'Mortiorchis',
      spriteKey: 'mortiorchis',
      slot: 1,
      // TODO(data-agent): §2 — MDef 0 clamps to 1 in the formula.
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
      affinities: {}, // TODO(data-agent): §2
      immunities: {}, // TODO(data-agent): §2
      immunityFlags: [],
      forms: [{ name: 'Mortiorchis', spriteKey: 'mortiorchis', hp: 4000 }],
      aiScriptId: 'mortiorchis', // TODO(data-agent): §4
      rewards: { ap: 0, apOverkill: 0, gil: 0, overkillThreshold: 36000, drops: [] },
      abilityIds: [], // TODO(data-agent): §3
      flags: { isPart: true, partOf: 'seymour-flux' },
      sensorText: 'It is not attacking you. It is waiting for a number to fill.',
      scanText:
        'Bound servant. Heals its master, revives the fallen — including the Zombied, fatally — and accumulates charge for a single overwhelming release.',
    },
  ],
  musicCues: [
    // TODO(data-agent): the fight shares "Challenge" with Yunalesca; our
    // original stand-in is `boss-dread`.
    { at: 'start', track: 'boss-dread', fadeMs: 800 },
  ],
};

export default seymourFluxGroup;
