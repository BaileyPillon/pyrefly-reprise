/**
 * Chapter 3 enemy groups — Braska's Final Aeon -> possessed aeons -> Yu Yevon.
 *
 * Source: `research/ffx-bfa-yu-yevon.md`. BFA is bestiary #233; the Yu
 * Pagodas are `m173`/`m174`; Yu Yevon's shell holds 99,999 HP. Boss-only
 * `AbilityDef`s live in `./braskas-final-aeon-abilities.ts`.
 *
 * This chapter is a **chain**: one continuous run of battles with no menu
 * between, linked by {@link EnemyGroupDef.nextGroupId} exactly like
 * `data/ffx2/enemies/vegnagun-shuyin.ts`'s four-part chain. Two Yu Pagodas
 * are present in every battle from the BFA fight onward.
 *
 * **The possessed-aeon gauntlet is dynamic, not a fixed formation list**
 * [§2.1, §2.2, verified: 2 sources]: only aeons Yuna actually owns are
 * fought, one at a time, in acquisition order, and each fights with a
 * **live copy of the player's own aeon stats** (Luck forced to 1). A single
 * static `EnemyGroupDef` chain can't express "skip the aeons this player
 * doesn't have", so this file exports a builder,
 * {@link buildPossessedAeonChain}, that the battle screen calls with the
 * player's owned aeon ids to produce the correctly-chained sequence ending
 * at `'yu-yevon'`. `possessedAeonGroups` below is that chain pre-built for
 * {@link MANDATORY_AEON_IDS} (Valefor/Ifrit/Ixion/Shiva/Bahamut) — the
 * `dreams-end` build's default roster — for anything that just wants "the
 * chain a non-grinding player sees".
 *
 * **Contract gap, now half closed.** The Yu Pagoda revive timer (§1.4) has
 * a home: `EnemyDef.reviveRule`, added 2026-09-17 and set on both Pagodas
 * below. Still undeclared in data is Yu Yevon's Curaga counter-eligibility
 * rule (fires at most once per player-side damaging *action*, never on his
 * own Gravija, a Poison tick, or a Yu Pagoda's Power Wave, §3.4.1), which
 * lives in his AI script instead.
 */

import type { AeonId, BraskasFinalAeonEnemyId } from '../ids.ts';
import { MANDATORY_AEON_IDS, POSSESSED_AEON_ORDER } from '../ids.ts';
import type { EnemyDef, EnemyGroupDef } from '../../../battle/common/types.ts';

// ---------------------------------------------------------------------------
// Yu Pagodas
// ---------------------------------------------------------------------------

/**
 * §1.4 [verified: 3 sources]. The struct's raw HP field (65535) is a
 * placeholder; the real fightable HP is the struct's `overkill` field,
 * 5,000. Two are present in every battle from the BFA fight onward and
 * cannot be permanently killed — see the revive-timer note in the file
 * header. `bfa` context: Agility 40, Power Wave heals BFA +20% Overdrive
 * gauge. `aeon`/`yu-yevon` context: Agility 30, Power Wave strips only
 * Poison/Zombie/Reflect and carries no gauge bonus.
 */
function yuPagoda(id: 'yu-pagoda-left' | 'yu-pagoda-right', slot: number, context: 'bfa' | 'aeon-or-yu-yevon'): EnemyDef {
  return {
    id,
    name: 'Yu Pagoda',
    spriteKey: 'yu-pagoda',
    slot,
    stats: {
      hp: 5000, // §1.4 [verified: 3 sources] — not the struct's 65535 HP placeholder
      mp: 5000, // §1.4 [verified: 2 sources]
      str: 1,
      def: 0, // §1.4 [single source] — immaterial, never attacked for damage-reduction purposes
      mag: 20,
      mdef: 50,
      agi: context === 'bfa' ? 40 : 30, // §1.4 [single source: wiki]
      luck: 15,
      eva: 0,
      acc: 0,
      maxHp: 5000,
      maxMp: 5000,
    },
    hp: 5000,
    mp: 5000,
    affinities: {},
    // §1.4 [verified: 2 sources]: "immune to essentially everything except
    // Slow (resist 50) and Delay" — Slow is a Ward-level partial
    // resistance, not immune, and Delay is NOT immune at all (no
    // `immune-to-delay` flag below — Slowga/Silver Hourglass can lock a
    // Pagoda out of turns entirely).
    immunities: {
      ko: 255,
      zombie: 255,
      petrify: 255,
      poison: 255,
      sleep: 255,
      silence: 255,
      darkness: 255,
      confuse: 255,
      berserk: 255,
      provoke: 255,
      doom: 255,
      eject: 255,
      curse: 255,
      'auto-life': 255,
      'power-break': 255,
      'magic-break': 255,
      'armor-break': 255,
      'mental-break': 255,
      slow: 50,
    },
    immunityFlags: ['immune-to-regen'],
    forms: [{ name: 'Yu Pagoda', spriteKey: 'yu-pagoda', hp: 5000 }],
    aiScriptId: context === 'bfa' ? 'yu-pagoda-bfa' : 'yu-pagoda-aeon',
    // §1.4: not directly killable for reward purposes — it revives instead
    // of staying dead. `overkillThreshold` is set high so a normal hit
    // never reads as an overkill.
    rewards: { ap: 0, apOverkill: 0, gil: 0, overkillThreshold: 99999, drops: [] },
    // §1.4 "Revive rule (critical to implement correctly)" [verified: 2
    // sources]. A destroyed Pagoda returns with `5,000 + the killing blow's
    // excess` after **63 ticks** in the BFA fight (its own AGI 40 → base 7 →
    // rank-3 recovery 21 → 3 × 21) and **72** in the possessed-aeon and Yu
    // Yevon fights (AGI 30 → base 8 → 24 → 3 × 24). Until this shipped, two
    // early swings switched the boss's heal / cleanse / Overdrive economy off
    // for the rest of the battle: measured, both Pagodas were permanently
    // dead from turn ~21 of a ~190-turn fight, and §1.6's own tuning table
    // was stuck on its "both down" row (10-20 % gauge a turn) for 89 % of the
    // encounter instead of its "both alive" row (60 %).
    reviveRule: { delayTicks: context === 'bfa' ? 63 : 72, baseMaxHp: 5000 },
    abilityIds:
      context === 'bfa'
        ? ['power-wave-bfa', 'yu-pagoda-curse', 'osmose']
        : ['power-wave-aeon', 'yu-pagoda-curse', 'osmose'],
    flags: { isPart: true },
    zanmatoLevel: 5, // §1.4 [single source]
    sensorText: 'Every kindness it performs is aimed at you.',
    scanText:
      'Support construct. Restores HP, removes ailments and accelerates its master’s Overdrive. Destroying both halts all three.',
  };
}

// ---------------------------------------------------------------------------
// Braska's Final Aeon (Jecht) — battle 1
// ---------------------------------------------------------------------------

/** Battle 1 of the chapter: BFA (two forms) plus the two Yu Pagodas. */
export const braskasFinalAeonGroup: EnemyGroupDef = {
  id: 'braskas-final-aeon',
  game: 'ffx',
  canEscape: false,
  // §2.1 [verified: 2 sources] — the gauntlet runs in aeon-acquisition order,
  // so the default (five-mandatory-aeon) roster's first link is Valefor.
  // This used to read `'possessed-aeons'`, which no formation exports:
  // `BattleScreen`'s chain loop logged "no formation exports that id" and
  // **stopped the chapter dead after Braska's Final Aeon**, so the possessed
  // aeons and Yu Yevon were unreachable in play. A caller with a non-default
  // roster still overrides this by rebuilding the chain with
  // {@link buildPossessedAeonChain}.
  nextGroupId: 'possessed-valefor',
  enemies: [
    {
      id: 'braskas-final-aeon',
      name: "Braska's Final Aeon",
      spriteKey: 'braskas-final-aeon-1',
      slot: 0,
      // §1.1 [verified: 2-4 sources per field]. Form 2 overrides Strength 45 -> 50.
      // MP 100 (decompile) vs wiki 106, and AGI 44 (decompile) vs wiki 40, are
      // both open, non-load-bearing conflicts [§1.1, §8] — decompile kept per
      // the research's source-tier policy.
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
      affinities: {}, // §1.2 [verified: 2 sources] all five elements Neutral
      // §1.2 [verified: 2 sources for the whole table].
      immunities: {
        ko: 255, // Death
        petrify: 255,
        sleep: 255,
        darkness: 255, // Dark
        slow: 255,
        doom: 255,
        eject: 255,
        zombie: 50, // landable — the key exploitable status, §1.6
        silence: 75,
        poison: 90,
      },
      immunityFlags: [
        'boss',
        'immune-to-regen', // §1.2 [verified: 2 sources]
        'immune-to-bribe',
        'immune-to-delay',
        'immune-to-percentage-damage',
        'immune-to-life', // §1.2 — Phoenix Down/Mega Phoenix/Elixir/Megalixir/X-Potion/Healing Water/Tetra Elemental do nothing, even on a living Zombie
      ],
      threatenChance: 0, // §1.2 [verified: 2 sources] immune
      forms: [
        {
          name: "Braska's Final Aeon",
          spriteKey: 'braskas-final-aeon-1',
          hp: 60000,
          aiScriptId: 'bfa-form-1',
        },
        {
          name: "Braska's Final Aeon",
          spriteKey: 'braskas-final-aeon-2',
          hp: 120000, // §0, §1.1 [verified: 4 sources] — the struct's own 60000 HP field is form-1 only; the battle script overrides to 120,000 on transformation
          statOverrides: { str: 50 }, // §1.1 [verified: 2 sources] — cross-validated against the Ultimate Jecht Shot damage band in §1.5
          aiScriptId: 'bfa-form-2',
        },
      ],
      aiScriptId: 'bfa-form-1',
      rewards: {
        ap: 0,
        apOverkill: 0,
        gil: 0,
        overkillThreshold: 20000, // §1.7 [verified: 2 sources] cosmetic — no AP either way
        drops: [],
        steal: {
          baseChance: 100, // [estimate — no percentage published in the research; only the item table is sourced]
          common: { itemId: 'turbo-ether', count: 1 },
          rare: { itemId: 'elixir', count: 1 },
        },
      },
      abilityIds: [
        'left-arm-strike', // §1.3 — form 1
        'jecht-beam', // §1.3 — both forms
        'triumphant-grasp', // §1.3, §1.6 — form 1 Overdrive
        'jecht-bomber', // §1.3, §1.6 — form 1 anti-aeon Overdrive
        'draws-sword', // §1.3 — 1->2 transformation cue
        'left-arm-strike-2', // §1.3 — form 2
        'blade-blitz', // §1.3, §1.6 — form 2 opener, then a growing share of form-2 normal turns
        'triumphant-grasp-2', // §1.3, §1.6 — form 2 Overdrive, HP > 50%
        'ultimate-jecht-shot', // §1.3, §1.6 — form 2 Overdrive, HP <= 50%
        'jecht-bomber-2', // §1.3, §1.6 — form 2 anti-aeon Overdrive
      ],
      flags: { isBoss: true },
      sensorText: 'The pillars keep it standing. Take the pillars.',
      scanText:
        'A man made into a weapon. Petrifies with light. Its supports heal it, cleanse it, and feed its fury. When it takes up the sword, no one is safe from a single swing.',
      poisonTickPercent: 1, // §1.1 [verified: 2 sources] — same 1% in both forms (600 -> 1,200 as maxHP doubles)
      zanmatoLevel: 6, // §1.2 [verified: 2 sources] HD Remaster value; 5 in the original JP/NA release. A stray FFX-Info monster page shows 4 for this monster — unresolved, not acted on (§8 stray discrepancy).
    },
    yuPagoda('yu-pagoda-left', 1, 'bfa'),
    yuPagoda('yu-pagoda-right', 2, 'bfa'),
  ],
  musicCues: [{ at: 'start', track: 'boss-jecht', fadeMs: 800 }],
};

// ---------------------------------------------------------------------------
// Possessed aeons — battle 2..n, one aeon at a time
// ---------------------------------------------------------------------------

/**
 * Ability ids each possessed aeon may select, split into its ordinary
 * "special" command and its Overdrive. See
 * `braskas-final-aeon-abilities.ts` for the numbers and their confidence
 * tags — the five mandatory aeons' Overdrive powers are
 * `[verified: derived + 1 guide]`; everything else here is `[estimate]`.
 */
const POSSESSED_AEON_ABILITY_IDS: Record<BraskasFinalAeonEnemyId, string[]> = {
  'possessed-valefor': ['possessed-valefor-sonic-wings', 'possessed-valefor-energy-ray', 'possessed-valefor-energy-blast'],
  'possessed-ifrit': ['possessed-ifrit-meteor-strike', 'possessed-ifrit-hellfire'],
  'possessed-ixion': ['possessed-ixion-aerospark', 'possessed-ixion-thors-hammer'],
  'possessed-shiva': ['possessed-shiva-heavenly-strike', 'possessed-shiva-diamond-dust'],
  'possessed-bahamut': ['possessed-bahamut-impulse', 'possessed-bahamut-mega-flare'],
  'possessed-anima': ['possessed-anima-pain', 'possessed-anima-oblivion'],
  'possessed-yojimbo': ['possessed-yojimbo-daigoro', 'possessed-yojimbo-zanmato'],
  'possessed-cindy': ['possessed-cindy-camisade', 'possessed-cindy-delta-attack', 'curaga'],
  'possessed-sandy': ['possessed-sandy-razzia', 'haste', 'reflect'],
  'possessed-mindy': ['possessed-mindy-passado'],
  // Unused keys required by the BraskasFinalAeonEnemyId union — never built by buildPossessedAeonChain.
  'braskas-final-aeon': [],
  'yu-pagoda-left': [],
  'yu-pagoda-right': [],
  'yu-yevon': [],
};

/** Sensor lines, our own wording, inspired by the possessed aeons' short in-game lines [§2.2, verified: 2 sources]. */
const POSSESSED_AEON_SENSOR_TEXT: Partial<Record<BraskasFinalAeonEnemyId, string>> = {
  'possessed-valefor': 'Strike true. It wants this to end.',
  'possessed-ifrit': 'The fire remembers you. It still obeys.',
  'possessed-ixion': 'Lightning without a summoner to aim it.',
  'possessed-shiva': 'Cold all the way through, now.',
  'possessed-bahamut': 'Soon, it thinks. Soon it can rest.',
  'possessed-anima': 'It atones by attacking you.',
  'possessed-yojimbo': 'Paid for by someone who is no longer here.',
};

/**
 * Builds one possessed-aeon's `EnemyDef`. **Stats are placeholders** —
 * `mirrorsLiveAeonStats` in `flags`... no such field exists, so this is
 * documented in a comment instead: the engine must overwrite `stats`/`hp`/
 * `mp` at battle setup with a live copy of the corresponding
 * `AeonBuild` from the party's own roster, Luck forced to 1 [§2.2, verified:
 * 2 sources]. Everything else (immunities, ability ids, flags) is real data
 * and ships as-is.
 */
function possessedAeonEnemyDef(aeonId: BraskasFinalAeonEnemyId, slot: number): EnemyDef {
  return {
    id: aeonId,
    name: `Possessed ${aeonId.replace('possessed-', '').replace(/^\w/, (c) => c.toUpperCase())}`,
    spriteKey: aeonId.replace('possessed-', ''), // reuses the aeon's own sprite per the art session's convention
    slot,
    // Placeholder — the engine overwrites this from the live `AeonBuild`,
    // Luck forced to 1. See the function doc comment above.
    stats: { hp: 1, mp: 1, str: 1, def: 1, mag: 1, mdef: 1, agi: 1, luck: 1, eva: 0, acc: 0, maxHp: 1, maxMp: 1 },
    hp: 1,
    mp: 1,
    affinities: {}, // mirrors the live aeon's own affinities at setup
    // §2.2 [verified: 2 sources]: aeons are immune to every negative status
    // except Curse and Delay (the "Aeon Ribbon" rule) — that holds for a
    // possessed aeon too; only the controller changed.
    immunities: {
      ko: 255,
      zombie: 255,
      petrify: 255,
      poison: 255,
      sleep: 255,
      silence: 255,
      darkness: 255,
      confuse: 255,
      berserk: 255,
      provoke: 255,
      doom: 255,
      eject: 255,
      'power-break': 255,
      'magic-break': 255,
      'armor-break': 255,
      'mental-break': 255,
      'auto-life': 255,
    },
    immunityFlags: ['boss', 'immune-to-scan'],
    forms: [{ name: `Possessed ${aeonId.replace('possessed-', '')}`, spriteKey: aeonId.replace('possessed-', ''), hp: 1 }],
    aiScriptId: 'possessed-aeon',
    rewards: { ap: 0, apOverkill: 0, gil: 0, overkillThreshold: 99999, drops: [] }, // §2.3 — no AP/gil for these
    abilityIds: POSSESSED_AEON_ABILITY_IDS[aeonId],
    flags: { isBoss: true, noRevive: true }, // §2.3 [verified: 3 sources] — permanent Auto-Life on the PARTY, but a defeated possessed aeon is gone for good
    threatenChance: 0,
    sensorText: POSSESSED_AEON_SENSOR_TEXT[aeonId] ?? 'Possessed. It used to be an ally.',
    scanText: 'Yu Yevon wears it now. Destroying it is the only mercy left.',
  };
}

/**
 * One possessed-aeon battle: the given aeon plus the two Yu Pagodas
 * (`power-wave-aeon` variant, Agility 30). `id`/`nextGroupId` are set by
 * {@link buildPossessedAeonChain}.
 */
function possessedAeonBattle(aeonId: BraskasFinalAeonEnemyId, nextGroupId: string): EnemyGroupDef {
  return {
    id: `possessed-${aeonId.replace('possessed-', '')}`,
    game: 'ffx',
    canEscape: false,
    nextGroupId,
    // §2.3 [verified: 3 sources] — from the possessed-aeon fights onward the
    // whole party carries a permanent, non-consumable Auto-Life granted by the
    // fayth, and the only documented loss is deliberate party-wide Petrify.
    grantsPermanentAutoLife: true,
    enemies: [
      possessedAeonEnemyDef(aeonId, 0),
      yuPagoda('yu-pagoda-left', 1, 'aeon-or-yu-yevon'),
      yuPagoda('yu-pagoda-right', 2, 'aeon-or-yu-yevon'),
    ],
    musicCues: [{ at: 'start', track: 'boss-jecht', fadeMs: 800 }],
  };
}

/**
 * Builds the possessed-aeon gauntlet for whichever aeons the player owns,
 * in the fixed order {@link POSSESSED_AEON_ORDER} uses (acquisition order),
 * chained via `nextGroupId` and ending at `'yu-yevon'`. Pass the player's
 * owned `AeonId`s (e.g. from `FFXPartyBuild.aeons`); the Magus Sisters
 * count as owned via `'magus-sisters'` and expand to all three
 * `possessed-cindy/sandy/mindy` battles in sequence.
 */
export function buildPossessedAeonChain(ownedAeonIds: readonly AeonId[]): EnemyGroupDef[] {
  const owned = new Set(ownedAeonIds);
  const sequence: BraskasFinalAeonEnemyId[] = POSSESSED_AEON_ORDER.filter((id) => {
    if (id === 'possessed-cindy' || id === 'possessed-sandy' || id === 'possessed-mindy') {
      return owned.has('magus-sisters');
    }
    const aeon = id.replace('possessed-', '') as AeonId;
    return owned.has(aeon);
  });

  return sequence.map((aeonId, i) => {
    const next = sequence[i + 1];
    const nextGroupId = next !== undefined ? `possessed-${next.replace('possessed-', '')}` : 'yu-yevon';
    return possessedAeonBattle(aeonId, nextGroupId);
  });
}

/**
 * The default chain for the `dreams-end` build's roster (the five mandatory
 * aeons). `possessedAeonsGroup` is the first link, kept for anything that
 * just wants a single representative formation (e.g. a Sensor/gallery
 * preview) rather than the full chain.
 */
export const possessedAeonGroups: EnemyGroupDef[] = buildPossessedAeonChain(MANDATORY_AEON_IDS);
const firstPossessedAeonGroup = possessedAeonGroups[0];
if (firstPossessedAeonGroup === undefined) {
  throw new Error('buildPossessedAeonChain(MANDATORY_AEON_IDS) produced no battles — check MANDATORY_AEON_IDS/POSSESSED_AEON_ORDER.');
}
export const possessedAeonsGroup: EnemyGroupDef = firstPossessedAeonGroup;

// ---------------------------------------------------------------------------
// Yu Yevon — the last battle
// ---------------------------------------------------------------------------

/** The last battle. Cannot be lost: the party carries the fayth's permanent Auto-Life [§2.3, verified: 3 sources]. */
export const yuYevonGroup: EnemyGroupDef = {
  id: 'yu-yevon',
  game: 'ffx',
  canEscape: false,
  grantsPermanentAutoLife: true, // §2.3 [verified: 3 sources] — "cannot lose"

  enemies: [
    {
      id: 'yu-yevon',
      name: 'Yu Yevon',
      spriteKey: 'yu-yevon',
      slot: 0,
      // §3.1 [verified: 2-3 sources per field].
      stats: {
        hp: 99999,
        mp: 1,
        str: 1,
        def: 0, // §3.1 [conflict, immaterial] wiki says 1
        mag: 200,
        mdef: 0, // §3.1 [conflict, immaterial] wiki says 1
        agi: 44,
        luck: 1,
        eva: 0,
        acc: 1,
        maxHp: 99999,
        maxMp: 1,
      },
      hp: 99999,
      mp: 1,
      affinities: {}, // §3.2 [verified: 2 sources] all five Neutral
      // §3.2 [verified: 2 sources]. Deliberately, famously incomplete —
      // "the programmers made the mistake of not making him invulnerable to
      // status effects" (wiki, quoted for design intent). Zombie, Doom,
      // Poison and all four Breaks are landable (0, omitted below); Shell/
      // Protect/Reflect/Regen/Haste/Slow are also landable and are real
      // strategies (Reflect bounces his Curaga onto the party).
      immunities: {
        ko: 255, // Death
        petrify: 255,
        sleep: 255,
        silence: 255,
        darkness: 255, // Dark
        confuse: 255,
        berserk: 255,
        provoke: 255,
        eject: 255,
      },
      immunityFlags: ['boss', 'immune-to-bribe', 'immune-to-scan', 'immune-to-sensor'],
      threatenChance: 0, // §3.2 [verified: 2 sources] immune
      forms: [{ name: 'Yu Yevon', spriteKey: 'yu-yevon', hp: 99999 }],
      aiScriptId: 'yu-yevon',
      rewards: { ap: 0, apOverkill: 0, gil: 0, overkillThreshold: 99999, drops: [] },
      abilityIds: [
        'gravija', // §3.3, §3.4 — scheduled turns, alternating with a no-op
        'curaga', // §3.3 [verified: 2 sources] shared id — his damage counter, capped at 9,999 by the engine's standard cap
        'osmose', // §3.3 — the 7th-Curaga escalation step, party-wide
        'ultima', // §3.3 — the 8th-Curaga escalation step, party-wide, capped at 9,999
        'yu-yevon-command-254', // §3.3 — no-damage possession/Auto-Life bookkeeping hook
      ],
      flags: { isBoss: true },
      sensorText: 'It cannot be reasoned with. It stopped being anyone a long time ago.',
      scanText:
        'A summoner’s remnant, still casting. Hides inside whatever will hold it. Drains life from all, then heals itself endlessly. You cannot be killed here. You can only be delayed.',
      poisonTickPercent: 10, // §3.1 [verified: 2 sources] 10% of 99,999 = 9,999/tick
      doomTurns: 3, // §3.1 [verified: 2 sources] — documents "a Candle of Life kills him in exactly 3 turns", not something Yu Yevon inflicts on the party
    },
    yuPagoda('yu-pagoda-left', 1, 'aeon-or-yu-yevon'),
    yuPagoda('yu-pagoda-right', 2, 'aeon-or-yu-yevon'),
  ],
  musicCues: [{ at: 'start', track: 'boss-yu-yevon', fadeMs: 800 }],
};

export default braskasFinalAeonGroup;
