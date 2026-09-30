/**
 * Enemy group — **Sinspawn Genais and Sin's Core**, link 3 of the assault from
 * the *Fahrenheit*, on Sin's back (`sin_core` = [sinspawn_genais, sin_2],
 * research header `[decompiled]`).
 *
 * Source: `research/ffx-sin.md`. Genais is `m139` (bestiary #170); the Core is
 * `m138`, named "Sin" in the table (#171). The rows are in
 * `./sin-genais-core-abilities.ts`; the shell, "Magic absorbed.", the Core's
 * charge and counters, and "the battle ends when the Core dies" live in
 * `src/battle/ffx/ai/sin-genais-core*.ts` (package G).
 *
 * **Game case: FFX only** [AGENTS.md rule 14; research §0.3].
 *
 * **The runtime state is the AI's, on the battle's own copies:** Genais inside
 * its shell is Armored and percentage-immune (§5.3.1 item 4); the Core is
 * magic-immune and out of melee reach while Genais lives (§5.3.1 item 7). Those
 * flags are toggled on the per-battle combatant (`setup.ts` copies the record),
 * so this data states the fight's opening, out-of-shell values only.
 *
 * ## The art: the driver's picks (D-279)
 *
 * `spriteKey: 'sinspawn-genais'` and `'sin-core'` name the painted folders the driver picked and staged
 * (D-279, delegated by Bailey; `docs/concepts/chapters/sin-2026-09-29/install/INSTALL.md`): Genais A out of and in its shell, Core A at rest and gathering.
 * Until the files are installed under `public/art/characters/`, the stage draws its grey boss silhouette for
 * a missing key, as before.
 *
 * ## Conflicts recorded rather than merged (research §10)
 *
 * - **S-18** — Genais's Agility: 25, the decompile and SinirothX (the wiki's "26
 *   outside shell" is not built).
 * - **S-23** — Genais's HP: 20,000 (5 sources; Haunter12O's 25,000 is not so).
 * - **S-6** — Threaten: default **immune** (`threatenChance: 0`).
 * - **S-7** — equipment drops: not modelled.
 */

import type { EnemyDef, EnemyGroupDef, StatusImmunities } from '../../../battle/common/types.ts';
import { SIN_FIN_IMMUNITIES, SIN_GENAIS_CORE_GROUP_ID } from './sin-fins.ts';

export const SIN_GENAIS_ID = 'sinspawn-genais';
export const SIN_CORE_ID = 'sin-core';
/** AI script ids, registered in `src/battle/ffx/ai/sin-genais-core.ts`. */
export const SIN_GENAIS_SCRIPT = 'sinspawn-genais';
export const SIN_CORE_SCRIPT = 'sin-core';

/**
 * Sinspawn Genais — `m139`. §2.1 `[decompiled]` + wiki + SinirothX (HP
 * `[verified: 5 sources]`). Not armored outside its shell; **weak to Fire,
 * absorbs Water** (§2.2 `[verified: 4 sources]`).
 */
const genais: EnemyDef = {
  id: SIN_GENAIS_ID,
  name: 'Sinspawn Genais',
  spriteKey: 'sinspawn-genais', // D-279: Genais A (see the header)
  slot: 0,
  stats: {
    hp: 20_000, // §2.1 [verified: 5 sources] (S-23)
    mp: 200, // §2.1
    str: 30, // §2.1
    def: 80, // §2.1
    mag: 35, // §2.1
    mdef: 50, // §2.1
    agi: 25, // §2.1 (S-18: not the wiki's 26)
    luck: 15, // §2.1 [decompiled]
    eva: 0, // §2.1 [decompiled]
    acc: 0, // §2.1 [decompiled]
    maxHp: 20_000,
    maxMp: 200,
  },
  hp: 20_000,
  mp: 200,
  affinities: { fire: 'weak', water: 'absorb' }, // §2.2 [verified: 4 sources]
  // §2.3 [decompiled] [verified: 3 sources]. Landable: Power and Magic Break (0), Slow and Haste (0),
  // Doom (0, count 30). Zombie 80 (Zombie Attack lands 20 %); Silence 100 (only the Buster's and the
  // Grenade's chance 254 lands it); Armor and Mental Break 255; Reflect 255.
  immunities: {
    ko: 255,
    petrify: 255,
    poison: 255,
    confuse: 255,
    berserk: 255,
    provoke: 255,
    sleep: 255,
    darkness: 255,
    eject: 255,
    'auto-life': 255,
    zombie: 80,
    silence: 100,
    'armor-break': 255,
    'mental-break': 255,
    reflect: 255,
  } satisfies StatusImmunities,
  // §2.1: immune to Delay; Bribe immune (§2.4). Armored and percentage-immune only inside the shell (the AI's).
  immunityFlags: ['boss', 'immune-to-delay', 'immune-to-bribe'],
  forms: [{ name: 'Sinspawn Genais', spriteKey: 'sinspawn-genais', hp: 20_000 }],
  aiScriptId: SIN_GENAIS_SCRIPT,
  rewards: {
    ap: 1_800, // §2.4
    apOverkill: 2_700, // §2.4
    gil: 10_000, // §2.4
    overkillThreshold: 2_000, // §2.1
    drops: [{ itemId: 'return-sphere', count: 1 }], // §2.4 [decompiled]
    steal: {
      baseChance: 100, // §2.4 [decompiled byte 255]
      common: { itemId: 'star-curtain', count: 1 }, // §2.4
      rare: { itemId: 'shining-gem', count: 1 }, // §2.4
    },
    bribe: { item: { itemId: 'star-curtain', count: 1 }, immune: true }, // §2.4 Bribe immune
  },
  abilityIds: [
    'sin-genais-venom',
    'sin-genais-thrashing',
    'sin-genais-sigh',
    'sin-genais-waterga',
    'sin-genais-cura',
    'sin-genais-shell-in',
    'sin-genais-shell-out',
    'sin-magic-absorbed',
  ],
  flags: { isBoss: true },
  // §3.6, paraphrased into our own copy [writing-bible §5.3].
  sensorText: 'It drinks the magic aimed at the core behind it.',
  scanText: 'Badly hurt, it hides in its shell and mends itself. The shell turns Gravija aside.',
  doomTurns: 30, // §2.1 [decompiled] — landable, count 30
  zanmatoLevel: 4, // §2.1 [decompiled] + wiki + SinirothX
  threatenChance: 0, // §2.3 / S-6 — 0 means IMMUNE
};

/**
 * Sin's Core — `m138`, "Sin" in the table. §2.1 `[decompiled]` + wiki +
 * SinirothX (HP `[verified: 5 sources]`). **Armored**, Defense 100, Magic
 * Defense 100, **Reflect-immune** (§2.3), percentage-immune, so its own Gravija
 * never hurts it (S-14, resolved).
 */
const core: EnemyDef = {
  id: SIN_CORE_ID,
  name: 'Sin', // §2.1: the table's name for m138; the plan calls it "Sin's Core"
  spriteKey: 'sin-core', // D-279: Core A (see the header)
  slot: 1,
  stats: {
    hp: 36_000, // §2.1 [verified: 5 sources]
    mp: 999, // §2.1
    str: 1, // §2.1
    def: 100, // §2.1
    mag: 30, // §2.1
    mdef: 100, // §2.1
    agi: 20, // §2.1
    luck: 15, // §2.1 [decompiled]
    eva: 0, // §2.1 [decompiled]
    acc: 0, // §2.1 [decompiled]
    maxHp: 36_000,
    maxMp: 999,
  },
  hp: 36_000,
  mp: 999,
  affinities: {}, // §2.2 [verified: 4 sources]
  immunities: { ...SIN_FIN_IMMUNITIES, reflect: 255 }, // §2.3: the Fins' row, plus Reflect 255
  immunityFlags: ['boss', 'armored', 'immune-to-percentage-damage', 'immune-to-delay', 'immune-to-bribe'],
  forms: [{ name: 'Sin', spriteKey: 'sin-core', hp: 36_000 }],
  aiScriptId: SIN_CORE_SCRIPT,
  rewards: {
    ap: 18_000, // §2.4
    apOverkill: 27_000, // §2.4
    gil: 10_000, // §2.4
    overkillThreshold: 3_000, // §2.1
    drops: [{ itemId: 'mp-sphere', count: 1 }], // §2.4 [decompiled]
    steal: {
      baseChance: 100, // §2.4 [decompiled byte 255]
      common: { itemId: 'stamina-spring', count: 3 }, // §2.4 "Stamina Spring ×3 / ×4"
      rare: { itemId: 'stamina-spring', count: 4 }, // §2.4
    },
    bribe: { item: { itemId: 'stamina-spring', count: 3 }, immune: true }, // §2.4 Bribe immune
  },
  abilityIds: [
    'sin-core-inactive',
    'sin-core-gathers',
    'sin-core-gravija',
    'sin-core-negation',
    'sin-core-fire',
    'sin-core-blizzard',
    'sin-core-thunder',
    'sin-core-water',
  ],
  flags: { isBoss: true },
  sensorText: 'It wakes and charges whenever Genais shelters in its shell.',
  scanText: 'While Genais shelters, it charges Gravija. It strips helpful statuses with Negation.',
  doomTurns: 30, // §2.1 [decompiled] (immune)
  zanmatoLevel: 4, // §2.1 [decompiled]
  threatenChance: 0, // §2.3 / S-6
};

/**
 * **A link-3 checkpoint, ON** (offered 2026-09-29, `docs/plans/sin-fins-core-bench.md` "Link 3, rested against
 * carried"; adopted by Bailey the same day, `docs/target/decisions.json` D-284, switched on for PR-0268). On, a
 * loss at link 3 retries **at link 3**, on the party state captured
 * on entering it (HP, MP, statuses, gauges, and the items it had then), through the checkpoint seam Chapter V's
 * Shuyin uses (D-217, `src/app/screens/BattleChainCheckpoint.ts`). **An adaptation, not a sourced rule**
 * (rule 6): research §1.2 has no break between links 1 and 3, and no save before the Core. Kept in memory
 * for the run only, never saved. FFX only. Nothing about the fight changes; only where RETRY lands.
 */
export const SIN_LINK3_CHECKPOINT = true;

/** The formation's checkpoint field for the switch position `on` (the bench measures both). */
export function sinLink3Checkpoint(on: boolean): Pick<EnemyGroupDef, 'checkpointOnEntry'> {
  return on ? { checkpointOnEntry: true } : {};
}

export const sinGenaisCoreGroup: EnemyGroupDef = {
  id: SIN_GENAIS_CORE_GROUP_ID,
  game: 'ffx',
  canEscape: false, // §1.3
  enemies: [genais, core],
  // §1.2 [verified: 3 sources]: link 3 opens on link 2's party, statuses included. The chain ends here:
  // the Core's fall is Sinfall and the game's own save (D-270), so no `nextGroupId`.
  carriesPartyState: true,
  ...sinLink3Checkpoint(SIN_LINK3_CHECKPOINT),
};
