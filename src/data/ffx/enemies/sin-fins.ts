/**
 * Enemy groups — **the Left Fin and the Right Fin**, links 1 and 2 of the
 * assault from the *Fahrenheit*, each with **Cid** flying the ship
 * (`left_fin` = [left_fin, cid], `right_fin` = [right_fin, cid], research header
 * `[decompiled]`).
 *
 * Source: `research/ffx-sin.md`. The Left Fin is `m136` (bestiary #168), the
 * Right Fin `m137` (#169); Cid is `m149`. The rows are in
 * `./sin-fins-abilities.ts`; the range fight, the hit counter, the charge and
 * Negation live in `src/battle/ffx/ai/sin-fins*.ts` (package F).
 *
 * **Game case: FFX only** [AGENTS.md rule 14; research §0.3].
 *
 * **Built for D-270** (Bailey, 2026-09-27, "all your recommendations"): Chapter
 * XVII, "Sin: the Fins and the Core", links I to III on one party state. The
 * chain is Left Fin → Right Fin → Genais and the Core by `nextGroupId`; the two
 * later links set `carriesPartyState`, so the party's statuses carry as well as
 * HP, MP, gauges and items (§1.2 `[verified: 3 sources]`; `BattleScreenSetup.carryFfx`).
 *
 * ## The art: the driver's picks (D-279)
 *
 * `spriteKey: 'sin-left-fin'` and `'sin-right-fin'` name the painted folders the driver picked and staged
 * (D-279, delegated by Bailey; `docs/concepts/chapters/sin-2026-09-29/install/INSTALL.md`): Fin A, each arm painted on its own, NEAR and FAR, at rest and gathering.
 * Until the files are installed under `public/art/characters/`, the stage draws its grey boss silhouette for
 * a missing key, as before.
 *
 * ## Conflicts recorded rather than merged (research §10)
 *
 * - **S-4** — the Right Fin's AP: 17,000 (25,500), the decompile, wiki and
 *   SinirothX; bover_87's 16,000 is not so. Resolved.
 * - **S-6** — Threaten: the byte reads 0; wiki, Gestahl and SinirothX say
 *   Immune. Default **immune** (`threatenChance: 0`), the Evrae C-4 shape.
 * - **S-7** — equipment drops: not modelled (no equipment-drop roller), as at
 *   link 4. So the Right Fin's Stoneproof armour (§2.4) is not built (Q10).
 * - **S-19** — Cid fires no missiles here (Gestahl; the others silent): his
 *   record is Evrae's with its own script and no ability rows.
 */

import type { EnemyDef, EnemyGroupDef, StatusImmunities } from '../../../battle/common/types.ts';
import { evraeGroup } from './evrae.ts';

export const SIN_LEFT_FIN_ID = 'left-fin';
export const SIN_RIGHT_FIN_ID = 'right-fin';
export const SIN_LEFT_FIN_GROUP_ID = 'sin-left-fin';
export const SIN_RIGHT_FIN_GROUP_ID = 'sin-right-fin';
/** The link-3 formation, `./sin-genais-core.ts` (named here for the chain). */
export const SIN_GENAIS_CORE_GROUP_ID = 'sin-genais-core';
/** AI script ids, registered in `src/battle/ffx/ai/sin-fins.ts`. */
export const SIN_LEFT_FIN_SCRIPT = 'sin-left-fin';
export const SIN_RIGHT_FIN_SCRIPT = 'sin-right-fin';
export const SIN_CID_SCRIPT = 'cid-fahrenheit-sin';

/** §2.1 + §2.3 [decompiled], cross-checked against the wiki and SinirothX [verified: 3 sources]. Raw 0-255 bytes; a missing key is 0. */
export const SIN_FIN_IMMUNITIES: StatusImmunities = {
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
  // Armor Break and Mental Break 0 ("the key status of the chapter", [verified: 4 sources]); Reflect 0; the rest landable.
};

/**
 * One Fin. The two share every cell of §2.1 to §2.3 but the rewards (§2.4), and
 * every row (`./sin-fins-abilities.ts`). HP §2.1 `[decompiled]` + wiki + bover_87
 * + SinirothX + Gestahl `[verified: 5 sources]`; the other cells `[decompiled]` +
 * wiki + SinirothX. **Armored**, Defense 100: a plain physical hit lands at a
 * third, and Armor Break (Auron) is the key (§2.1 "The design facts").
 */
function fin(id: string, name: string, script: string, rewards: EnemyDef['rewards'], sensorText: string, scanText: string): EnemyDef {
  return {
    id,
    name,
    spriteKey: `sin-${id}`, // D-279: Fin A (see the header)
    slot: 0,
    stats: {
      hp: 65_000, // §2.1 [verified: 5 sources]
      mp: 999, // §2.1
      str: 30, // §2.1
      def: 100, // §2.1 — Armored, Defense 100
      mag: 30, // §2.1
      mdef: 50, // §2.1
      agi: 20, // §2.1
      luck: 15, // §2.1 [decompiled]
      eva: 0, // §2.1 [decompiled]
      acc: 0, // §2.1 [decompiled] (the wiki prints 1)
      maxHp: 65_000,
      maxMp: 999,
    },
    hp: 65_000,
    mp: 999,
    affinities: {}, // §2.2 [verified: 4 sources] — no weakness, resistance or absorb
    immunities: { ...SIN_FIN_IMMUNITIES },
    // §2.1 [decompiled] + wiki + bover_87: Armored, immune to percentage damage
    // (Demi, Gravity) and to Delay; Bribe immune (§2.4). Not Sensor- or
    // Scan-immune (§2.1: the Left Fin infobox's "Immune" is a wiki slip).
    // `boss`: the party cannot escape (§1.3).
    immunityFlags: ['boss', 'armored', 'immune-to-percentage-damage', 'immune-to-delay', 'immune-to-bribe'],
    forms: [{ name, spriteKey: `sin-${id}`, hp: 65_000 }],
    aiScriptId: script,
    rewards,
    abilityIds: [
      'sin-fin-ram',
      'sin-fin-smack',
      'sin-fin-gravija',
      'sin-fin-gravija-far',
      'sin-fin-negation',
      'sin-fin-negation-far',
      'sin-fin-gathers',
      'sin-motionless',
    ],
    flags: { isBoss: true },
    sensorText,
    scanText,
    doomTurns: 30, // §2.1 [decompiled] (immune anyway)
    zanmatoLevel: 4, // §2.1 [decompiled] (0-based byte 3 -> level 4) + wiki + SinirothX [verified: 3 sources]
    threatenChance: 0, // §2.3 / S-6 — 0 means IMMUNE in this contract
  };
}

// §3.6 Sensor and Scan, paraphrased into our own copy [writing-bible §5.3]: never verbatim.
const FIN_SENSOR = 'When its core glows, Gravija follows. Distance turns it aside.';
const FIN_SCAN = 'Once charged, Gravija takes most of everyone\'s HP. Back the ship away first. It strips statuses too.';

/** `m136` — the Left Fin. §2.4 rewards [decompiled] + wiki + bover_87 [verified: 3 sources]. */
const leftFin: EnemyDef = fin(SIN_LEFT_FIN_ID, 'Left Fin', SIN_LEFT_FIN_SCRIPT, {
  ap: 16_000, // §2.4
  apOverkill: 24_000, // §2.4
  gil: 10_000, // §2.4
  overkillThreshold: 10_000, // §2.1 [decompiled] + wiki + bover_87 + SinirothX
  drops: [{ itemId: 'hp-sphere', count: 1 }], // §2.4 [decompiled] drop chance 255; x2 on Overkill not modelled
  steal: {
    baseChance: 100, // §2.4 [decompiled byte 255 = guaranteed, clamped to the contract's 0-100]
    common: { itemId: 'mega-potion', count: 1 }, // §2.4
    rare: { itemId: 'supreme-gem', count: 1 }, // §2.4
  },
  // §2.4 "Bribe: immune on all five" [decompiled] + wiki; the item stands in, it can never be bribed.
  bribe: { item: { itemId: 'mega-potion', count: 1 }, immune: true },
}, FIN_SENSOR, FIN_SCAN);

/** `m137` — the Right Fin. §2.4 rewards, AP per S-4 (resolved: 17,000). */
const rightFin: EnemyDef = fin(SIN_RIGHT_FIN_ID, 'Right Fin', SIN_RIGHT_FIN_SCRIPT, {
  ap: 17_000, // §2.4, S-4 resolved (bover_87's 16,000 is not so)
  apOverkill: 25_500, // §2.4
  gil: 10_000, // §2.4
  overkillThreshold: 10_000, // §2.1
  drops: [{ itemId: 'lv-3-key-sphere', count: 1 }], // §2.4 [decompiled] (SinirothX's Lv. 2 is S-5, resolved)
  steal: {
    baseChance: 100, // §2.4 [decompiled byte 255]
    common: { itemId: 'x-potion', count: 1 }, // §2.4
    rare: { itemId: 'shining-gem', count: 1 }, // §2.4
  },
  bribe: { item: { itemId: 'x-potion', count: 1 }, immune: true }, // §2.4 Bribe immune
}, FIN_SENSOR, FIN_SCAN);

/**
 * Cid — `m149`, the Evrae record (§2.5: "the stat block of
 * `ffx-evrae-airship.md` §2.1", with its Agility conflict C-6 carried over as it
 * is), on his own script: in the Sin fights **he fires no missiles** (S-19,
 * Gestahl; `[single source]`), so he has no ability rows. His ordered turn moves
 * the ship; an unordered one does nothing (package F).
 */
const evraeCid = evraeGroup.enemies.find((e) => e.id === 'cid');
if (!evraeCid) throw new Error('sin-fins: the Evrae formation lost its Cid');
const cid: EnemyDef = { ...evraeCid, aiScriptId: SIN_CID_SCRIPT, abilityIds: [] };

export const sinLeftFinGroup: EnemyGroupDef = {
  id: SIN_LEFT_FIN_GROUP_ID,
  game: 'ffx',
  canEscape: false, // §1.3 "The party cannot escape." [single source: wiki]
  enemies: [leftFin, cid],
  // §1.2 [verified: 3 sources]: no rest between links 1, 2 and 3.
  nextGroupId: SIN_RIGHT_FIN_GROUP_ID,
};

export const sinRightFinGroup: EnemyGroupDef = {
  id: SIN_RIGHT_FIN_GROUP_ID,
  game: 'ffx',
  canEscape: false, // §1.3
  enemies: [rightFin, cid],
  nextGroupId: SIN_GENAIS_CORE_GROUP_ID,
  // §1.2 [verified: 3 sources]: "the next fight will start off with your characters in the same stats" —
  // statuses carry too (buffs [derived]). FFX reads this flag for statuses only (CONTRACT-CHANGES).
  carriesPartyState: true,
};
