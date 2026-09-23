/**
 * Enemy group — **Evrae**, and **Cid** flying the *Fahrenheit*, on the approach
 * to Bevelle.
 *
 * Source: `research/ffx-evrae-airship.md`. Evrae is `m119` / bestiary #097; Cid
 * is `m149`. Boss-only `AbilityDef`s live in `./evrae-abilities.ts`; the range
 * state, the queued order, the missile economy and the two phases live in
 * `src/battle/ffx/ai/evrae-rules.ts`.
 *
 * **Game case: FFX only** [AGENTS.md rule 14]. §0.4 of the research fences the
 * encounter explicitly — "the airship distance mechanic… has no X-2
 * counterpart" — and so do Trigger Commands, the three-active / three-reserve
 * bench and the `Use` economy the fight is balanced around.
 * `tests/unit/chapters/evrae-engine.test.ts` carries the absence test.
 *
 * ---
 *
 * ## Cid is the reason this formation is unusual
 *
 * He is **internally an invisible enemy with his own CTB icon** (§2), not a
 * party member and not directly controllable; the player reaches him only
 * through a Trigger Command. So he rides on `side: 'enemy'` with:
 *
 * - `flags.untargetable` — he can never be selected, and no AoE finds him,
 *   because `predicates.ts#targetable` and `state.ts#livingEnemies` both honour
 *   it. His 410 HP is an artefact of the monster table, nothing more.
 * - `immune-to-sensor` / `immune-to-scan`, both **TRUE** in the decompile:
 *   **he is not meant to be read as an enemy** (§2.1).
 * - `ActorRuntime.nonCombatant`, set by the encounter's setup hook, so
 *   `engine.ts#checkEnd` does not wait for an unkillable pilot to die before
 *   awarding victory.
 * - the id **`cid`**, because `turnQueue.ts#tieBreakRank` already ranks that id
 *   last — a line `ffx-combat-core.md` §1.6 wrote for this fight.
 *
 * ## The Defense-0 line, written carefully
 *
 * §1.1's fact-check F-4 deleted a false superlative. Defense byte 0 is the
 * monster table's **default** (217 of 343 PS2 records), not a property of
 * Evrae, and Seymour and Anima — the sibling Macalania chapter — are Defense 0
 * too. What survives is `_get_mitigation(1) = 725` against a theoretical
 * maximum of 730: every point of player offence lands at essentially full
 * value. The honest line is "no armour and a lot of blood". **Do not let the
 * HUD imply mitigation and do not re-introduce the superlative.**
 *
 * ## Conflicts recorded rather than merged
 *
 * - **C-3** — Zanmato level decompiled **3** vs wiki 4; Doom turns decompiled
 *   **30** vs wiki 20, and the wiki lists Doom as Immune while the byte reads
 *   landable. We ship the decompile. All three are moot: Yojimbo is
 *   unavailable (no Yuna) and a 30-turn Doom never resolves in this fight.
 * - **C-4** — **Threaten**: the byte reads 0 (landable), the wiki says Immune.
 *   Identical in shape to Seymour Flux's C-2. `threatenChance: 0` **means
 *   immune** in this contract, which is the owner-approved default until it is
 *   tested in game.
 * - **C-5** — the **Scan text** says repeated melee attacks provoke *Poison
 *   Breath*; the documented AI says the aggro counter provokes *Stone Gaze*.
 *   Owner decision, 2026-09-21: **ship both.** The behaviour is Stone Gaze (the
 *   specific numeric claim); the Scan text below reproduces the lie as canon
 *   writes it, and the truth goes in the help text. §1.5: "reproduce the lie
 *   *and* let the player find out it is a lie — that is a better beat than
 *   quietly correcting it." The Scan text also lies about Magic Defence, which
 *   is 0/1; same treatment.
 * - **C-6** — Cid's Agility: decompiled **16**, wiki 11. We ship 16 (recovery
 *   36 rather than 42). It materially changes how often the ship can turn, so
 *   it is on the playtest list.
 * - **C-18** — equipment-drop ability rolls: decompiled **1 always**, wiki 2.
 *   Not modelled; this project has no equipment-drop roller.
 *
 * ## The drop is a joke the encounter is telling
 *
 * Evrae drops **Stonetouch** weapons and **Stone Ward** armour — the exact
 * counter to its own Stone Gaze — *after* the fight (§1.4). Worth a line of
 * victory copy; worth nothing mechanically, and there is no equipment-drop
 * roller to model it with.
 */

import type { EnemyDef, EnemyGroupDef, StatusImmunities } from '../../../battle/common/types.ts';

/** Ids the engine, the tactic and the tests all key on. */
export const EVRAE_ID = 'evrae';
export const CID_ID = 'cid';
export const EVRAE_GROUP_ID = 'evrae-airship';

/** AI script ids, registered in `src/battle/ffx/ai/evrae.ts`. */
export const EVRAE_SCRIPT = 'evrae';
export const CID_SCRIPT = 'cid-fahrenheit';

/** §5.4 [verified: 2 sources] — 1/3 of 32,000; the wiki states the figure itself. */
export const EVRAE_HASTE_THRESHOLD = 10_667;

/**
 * Evrae — `m119`, bestiary #097.
 *
 * §1.2 `[verified: 2 sources]`: fire, ice, **lightning** (never "thunder" —
 * `docs/CONTRACTS.md`) and water are all **halved**; holy is neutral. There is
 * therefore **no elemental puzzle**, elemental weapon strikes are actively bad,
 * and **Lulu is halved on every offensive spell she owns at this point**. Her
 * role in this chapter is *reach*, not damage (§7.4).
 */
const evrae: EnemyDef = {
  id: EVRAE_ID,
  name: 'Evrae',
  spriteKey: 'evrae',
  slot: 0, // M1 — Cid's Guided Missiles row targets monster slot 1 [§3.2 decompiled]
  // §1.1 [decompiled] + wiki; HP, Agility, AP and the overkill threshold are
  // [verified: 2 sources].
  stats: {
    hp: 32_000,
    mp: 500,
    str: 36,
    def: 0, // §1.1 [decompiled] — the formula clamps the divisor to 1; the wiki prints 1
    mag: 30,
    mdef: 0, // §1.1 [decompiled] — same clamp. The Scan text's "high Magic Defense" is a lie
    agi: 20, // §1.1 [verified: 2 sources] — base 10 ticks, rank-3 recovery 30, 15 when Hasted
    luck: 15,
    eva: 0,
    acc: 100,
    maxHp: 32_000,
    maxMp: 500,
  },
  hp: 32_000,
  mp: 500,
  // §1.2 [verified: 2 sources] — all four elements halved (`'resist'` is the
  // x0.5 tier in `AFFINITY_MULTIPLIER_FFX`), holy neutral and therefore
  // omitted. Note the vocabulary: the element is **`'lightning'`**, never
  // `'thunder'` [docs/CONTRACTS.md].
  affinities: { fire: 'resist', ice: 'resist', lightning: 'resist', water: 'resist' },
  // §1.3 [decompiled]. Raw 0-255 bytes; a missing key is 0 = fully landable.
  immunities: {
    slow: 50, // §1.3 [verified: 2 sources] — the strongest legal lever in the fight
    darkness: 50, // §1.3 [verified: 2 sources] — blanks Attack, NOT Swooping Scythe
    // power-break, mental-break, reflect, protect, shell, regen, haste and scan
    // are byte 0 and deliberately OMITTED: all fully landable. Power Break
    // halves the physical output; Mental Break is legal and worthless (the stat
    // is already 0/1); **Reflect is the one that matters** — see C-14.
    poison: 255, // §1.3 [verified: 2 sources] — Bio and Poison Fang are dead commands here
    ko: 255,
    zombie: 255,
    petrify: 255,
    sleep: 255,
    silence: 255, // you cannot silence away its self-Haste
    confuse: 255,
    berserk: 255,
    provoke: 255,
    'magic-break': 255,
    'armor-break': 255,
    eject: 255,
    'auto-life': 255,
    doom: 255, // C-3: the byte reads landable at 30 turns; a 30-turn Doom never resolves
  } satisfies StatusImmunities,
  // §1.3 [decompiled]. **`immune-to-delay` is deliberately absent** —
  // `immune_to_delay = FALSE` makes Evrae the only boss in the anthology that
  // can be delayed (Delay Attack +15, Delay Buster +30, a whole free turn).
  // `immune-to-sensor` and `immune-to-scan` are both false: both commands work
  // and both have real text.
  immunityFlags: ['boss', 'immune-to-percentage-damage', 'immune-to-bribe'],
  forms: [{ name: 'Evrae', spriteKey: 'evrae', hp: 32_000 }],
  aiScriptId: EVRAE_SCRIPT,
  rewards: {
    ap: 5400, // §1.4 [verified: 2 sources]
    apOverkill: 8100, // §1.4 [verified: 2 sources]
    gil: 2600, // §1.4
    overkillThreshold: 2000, // §1.4 [verified: 2 sources]
    // §1.4 [verified: 2 sources] — guaranteed, x2 on overkill. `blk-magic-sphere`
    // has no `ItemDef` row yet, exactly as Chapter 1 ships `lv-4-key-sphere`;
    // the row belongs to the FFX player-data agent.
    drops: [{ itemId: 'blk-magic-sphere', count: 1 }],
    steal: {
      baseChance: 100, // §1.4 [decompiled byte 255 = guaranteed, clamped to the 0-100 contract range]
      common: { itemId: 'water-gem', count: 1 }, // §1.4 [verified: 2 sources]
      rare: { itemId: 'water-gem', count: 2 }, // §1.4 [verified: 2 sources]
    },
    bribe: { item: { itemId: 'water-gem', count: 1 }, immune: true }, // §1.4 — impossible
  },
  abilityIds: [
    'evrae-attack',
    'evrae-swooping-scythe',
    'evrae-poison-breath',
    'evrae-stone-gaze',
    'evrae-photon-spray',
    'evrae-inhale',
    'evrae-out-of-breath-range',
    'evrae-haste',
  ],
  flags: { isBoss: true },
  // §1.5 — the Sensor line, our own copy of the short form.
  sensorText: 'It draws breath before it breathes. That is the turn you get.',
  // §1.5 / C-5 — **the Scan text lies twice, and that is the point.** It claims
  // high Magic Defence (it is 0/1) and it blames the poison breath on repeated
  // melee when the AI actually answers with Stone Gaze. Owner decision
  // 2026-09-21: ship the lie, put the truth in the help text, and let the
  // player find out. Original copy [AGENTS.md hard rule 8].
  scanText:
    'Guard of the city. Heavily warded against magic, and no element troubles it. Keep striking it and it will answer with the breath. Ask the pilot to fall back and the ship will do your work.',
  poisonTickPercent: 0, // §1.1 [decompiled] — Poison-immune anyway; the byte is 0 as well
  doomTurns: 30, // §1.1 [decompiled] (C-3: the wiki says 20; moot either way)
  zanmatoLevel: 3, // §1.1 [decompiled] byte 402 (C-3: the wiki says 4; Yojimbo is unavailable)
  threatenChance: 0, // §1.3 / C-4 — 0 means IMMUNE in this contract, not "never resisted"
};

/**
 * Cid — `m149`. See the file header for why he is an untargetable enemy rather
 * than a fourth `Side`.
 *
 * Strength 1 / Magic 0 / Defense 0 / Magic Defense 0 all clamp to 1 in the
 * formulas and none of them is ever read: his one action is `Fixed`, which
 * ignores every stat on both sides. **Agility 16 is the only number of his that
 * matters** (C-6) — base 12 ticks, rank-3 recovery 36 — because it is how often
 * the ship can change its mind.
 */
const cid: EnemyDef = {
  id: CID_ID,
  name: 'Cid',
  spriteKey: 'cid',
  slot: 1,
  // §2.1 [decompiled].
  stats: {
    hp: 410, // an artefact; he is never a target
    mp: 1,
    str: 1,
    def: 0,
    mag: 1, // §2.1 — the decompiled 0 clamps to 1 in the formula
    mdef: 0,
    agi: 16, // §2.1 C-6 [decompiled]; the wiki says 11. Recovery 36 vs 42
    luck: 1,
    eva: 0,
    acc: 1,
    maxHp: 410,
    maxMp: 1,
  },
  hp: 410,
  mp: 1,
  affinities: {},
  // §2.1 [decompiled] — Provoke, Eject and Auto-Life immune. Everything else is
  // moot: nothing can reach him.
  immunities: {
    provoke: 255,
    eject: 255,
    'auto-life': 255,
  } satisfies StatusImmunities,
  // §2.1 [decompiled] — **both Sensor and Scan are TRUE**: he is not meant to be
  // read as an enemy. `immune-to-bribe` for the same reason.
  immunityFlags: ['immune-to-sensor', 'immune-to-scan', 'immune-to-bribe'],
  forms: [{ name: 'Cid', spriteKey: 'cid', hp: 410 }],
  aiScriptId: CID_SCRIPT,
  // §2.1 [decompiled] — 0 AP, 0 gil, and he never dies anyway.
  rewards: { ap: 0, apOverkill: 0, gil: 0, overkillThreshold: 1, drops: [] },
  abilityIds: ['cid-guided-missiles'],
  // `untargetable` is what makes him unreachable: `predicates.ts#targetable`
  // and `state.ts#livingEnemies` both honour it, so no command and no AoE finds
  // him. `hideHpBar` because his HP is an artefact and drawing it would invite
  // the player to try.
  flags: { untargetable: true, hideHpBar: true },
  doomTurns: 3, // §2.1 [decompiled]
  poisonTickPercent: 25, // §2.1 [decompiled] — recorded; unreachable in practice
  zanmatoLevel: 4, // §2.1 [decompiled]
  threatenChance: 0, // §2.1 — Provoke/Threaten immune
};

export const evraeGroup: EnemyGroupDef = {
  id: EVRAE_GROUP_ID,
  game: 'ffx',
  canEscape: false, // §1.3 `boss` — Escape and Flee are disabled
  enemies: [evrae, cid],
  musicCues: [
    // The chapter's own battle cue, composed to §12.6's brief (C-16: no source
    // names the retail track, so this fills the slot, not a canon claim). A
    // CANDIDATE until Bailey's ear rules on it (rule 13). FFX only.
    { at: 'start', track: 'boss-evrae', fadeMs: 800 },
  ],
};

export default evraeGroup;
