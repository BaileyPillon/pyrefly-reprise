/**
 * Enemy group — **Overdrive Sin**, the head, over Bevelle: link 4 of the
 * assault from the *Fahrenheit* (`overdrive_sin` = [sin_3], research header
 * `[decompiled]`).
 *
 * Source: `research/ffx-sin.md`. Overdrive Sin is `m140` "Sin", bestiary #172.
 * The rows are in `./overdrive-sin-abilities.ts`; the clock, the pulls, Gaze and
 * the scripted Game Over live in `src/battle/ffx/ai/overdrive-sin{,-rules}.ts`.
 *
 * **Game case: FFX only** [AGENTS.md rule 14; research §0.3].
 *
 * **Built at Bailey's pick, 2026-09-27** ("all your recommendations": Sin A
 * reached through B). This is link 4 alone, first, as the recommendation asks;
 * links 1 to 3 (Left Fin, Right Fin, Genais with the Core) come in front later.
 *
 * ## The art: the driver's picks (D-279)
 *
 * `spriteKey: 'overdrive-sin'` name the painted folders the driver picked and staged
 * (D-279, delegated by Bailey; `docs/concepts/chapters/sin-2026-09-29/install/INSTALL.md`): head C repaired, round 3's jaw rig in five mouth stages.
 * Until the files are installed under `public/art/characters/`, the stage draws its grey boss silhouette for
 * a missing key, as before.
 *
 * ## Conflicts recorded rather than merged (research §10)
 *
 * - **S-1** (settled, re-parity AI lane C, D-31) — Giga-Graviton on Sin's 12th turn: the AI's
 *   switch (`sin.gigaGravitonTurn`), default 12.
 * - **S-6** — Threaten: the byte reads 0 (landable); wiki, Gestahl and SinirothX
 *   say Immune. Default **immune** (`threatenChance: 0` means immune in this
 *   contract), the Evrae C-4 shape.
 * - **S-7** — equipment-ability rolls (decompile 1-2, guides 1-3): not modelled;
 *   this project has no equipment-drop roller.
 * - **S-16** (unsourced) — which Gaze fires: uniform, our estimate (the AI).
 */

import type { EnemyDef, EnemyGroupDef, StatusImmunities } from '../../../battle/common/types.ts';

export const OVERDRIVE_SIN_ID = 'overdrive-sin';
export const OVERDRIVE_SIN_GROUP_ID = 'overdrive-sin';
/** AI script id, registered in `src/battle/ffx/ai/overdrive-sin.ts`. */
export const OVERDRIVE_SIN_SCRIPT = 'overdrive-sin';

/**
 * Overdrive Sin — `m140`. §2.1 `[decompiled]` + wiki + bover_87 + SinirothX +
 * Gestahl for HP `[verified: 5 sources]`; the other cells `[decompiled]` + wiki
 * + SinirothX. **Armored**, Defense 40: a plain physical hit lands at a third,
 * Armor Break (Auron) is the key (§2.1 "The design facts").
 */
const overdriveSin: EnemyDef = {
  id: OVERDRIVE_SIN_ID,
  name: 'Sin',
  spriteKey: 'overdrive-sin', // D-279: head C (see the header)
  slot: 0,
  stats: {
    hp: 140_000, // §2.1 [verified: 5 sources]
    mp: 999, // §2.1 [decompiled] + wiki + SinirothX
    str: 30, // §2.1
    def: 40, // §2.1 — the head is 40 where the other parts are 100
    mag: 30, // §2.1
    mdef: 40, // §2.1
    agi: 30, // §2.1 — the fastest Sin part
    luck: 15, // §2.1 [decompiled]
    eva: 0, // §2.1 [decompiled]
    acc: 0, // §2.1 [decompiled] (the wiki prints 1); enemy rows use their own accuracy byte
    maxHp: 140_000,
    maxMp: 999,
  },
  hp: 140_000,
  mp: 999,
  affinities: {}, // §2.2 [verified: 4 sources] — no weakness, resistance or absorb
  // §2.3 [decompiled], cross-checked against the wiki and SinirothX [verified: 3 sources].
  // Raw 0-255 bytes; a missing key is 0 = landable. Landable and meaningful:
  // Armor Break and Mental Break (0, "the key status of the chapter"), Reflect (0),
  // Shell / Protect / Nul / Regen / Scan (0, pointless).
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
    zombie: 255,
    silence: 255,
    'power-break': 255,
    'magic-break': 255,
    slow: 255,
    haste: 255,
    doom: 255, // §2.1 Doom count 30 (immune) [decompiled]
  } satisfies StatusImmunities,
  // §2.1 [decompiled] + wiki + bover_87: Armored, immune to percentage damage
  // (Demi, Gravity), immune to Delay; Bribe immune (§2.4). Not Sensor- or
  // Scan-immune (§2.1 [decompiled]). `boss`: the party cannot escape (§1.3).
  immunityFlags: ['boss', 'armored', 'immune-to-percentage-damage', 'immune-to-delay', 'immune-to-bribe'],
  forms: [{ name: 'Sin', spriteKey: 'overdrive-sin', hp: 140_000 }],
  aiScriptId: OVERDRIVE_SIN_SCRIPT,
  rewards: {
    ap: 20_000, // §2.4 [verified: 3 sources]
    apOverkill: 30_000, // §2.4
    gil: 12_000, // §2.4
    overkillThreshold: 16_000, // §2.1 [decompiled] + wiki + bover_87 + SinirothX
    drops: [{ itemId: 'lv-3-key-sphere', count: 1 }], // §2.4 [decompiled] drop chance 255; x2 on Overkill not modelled here
    steal: {
      baseChance: 100, // §2.4 [decompiled byte 255 = guaranteed, clamped to the contract's 0-100]
      common: { itemId: 'ether', count: 1 }, // §2.4 [verified: 3 sources]
      rare: { itemId: 'supreme-gem', count: 1 }, // §2.4 [verified: 3 sources]
    },
    // §2.4: "Bribe: immune on all five" [decompiled] + wiki. The record's item is
    // not in the research, so the steal's common item stands in; it can never be bribed.
    bribe: { item: { itemId: 'ether', count: 1 }, immune: true },
  },
  abilityIds: [
    'overdrive-sin-drawn',
    'overdrive-sin-gaze-petrify',
    'overdrive-sin-gaze-confuse',
    'overdrive-sin-gaze-zombie',
    'overdrive-sin-gaze-aeon',
    'overdrive-sin-giga-graviton',
  ],
  flags: { isBoss: true },
  // §3.6 Sensor, paraphrased into our own copy [writing-bible §5.3]: the mouth is the clock.
  sensorText: 'Its mouth is the clock. End it before the mouth is fully open.',
  // §3.6 Scan, paraphrased: it pulls the ship in while it gathers itself for Giga-Graviton.
  scanText: 'It draws the ship in while it gathers itself for Giga-Graviton. Stop it first.',
  doomTurns: 30, // §2.1 [decompiled] (immune anyway)
  zanmatoLevel: 4, // §2.1 [decompiled] (0-based byte 3 -> level 4) + wiki + SinirothX [verified: 3 sources]
  threatenChance: 0, // §2.3 / S-6 — 0 means IMMUNE in this contract
};

export const overdriveSinGroup: EnemyGroupDef = {
  id: OVERDRIVE_SIN_GROUP_ID,
  game: 'ffx',
  canEscape: false, // §1.3 "The party cannot escape." [single source: wiki]
  enemies: [overdriveSin],
};

export default overdriveSinGroup;
