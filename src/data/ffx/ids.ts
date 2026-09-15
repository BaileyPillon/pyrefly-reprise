/**
 * FFX string-literal id unions.
 *
 * **Contract file.** Data agents import these so a typo in an id is a compile
 * error rather than a silent lookup miss. Every id is `kebab-case`.
 *
 * Sources: `research/ffx-combat-core.md`, `research/ffx-seymour-flux.md`,
 * `research/ffx-yunalesca.md`, `research/ffx-bfa-yu-yevon.md`.
 */

// ---------------------------------------------------------------------------
// Characters
// ---------------------------------------------------------------------------

/**
 * The seven playable guardians.
 *
 * CTB tie-break order when counters are equal is
 * **Tidus -> Yuna -> Auron -> Kimahri -> Wakka -> Lulu -> Rikku -> the player's
 * aeon -> Cindy -> Sandy -> Mindy -> enemies** [ffx-combat-core §1.6]. The
 * array below is *not* in that order — it is party-menu order; the engine owns
 * the tie-break table.
 */
export type CharacterId = 'tidus' | 'yuna' | 'auron' | 'wakka' | 'lulu' | 'kimahri' | 'rikku';

/** Party-menu order. */
export const CHARACTER_IDS: readonly CharacterId[] = [
  'tidus',
  'yuna',
  'auron',
  'wakka',
  'lulu',
  'kimahri',
  'rikku',
] as const;

/** CTB tie-break priority, highest first [ffx-combat-core §1.6]. */
export const CTB_TIEBREAK_ORDER: readonly CharacterId[] = [
  'tidus',
  'yuna',
  'auron',
  'kimahri',
  'wakka',
  'lulu',
  'rikku',
] as const;

// ---------------------------------------------------------------------------
// Aeons
// ---------------------------------------------------------------------------

/**
 * Aeons, in acquisition order — which is also the order Yu Yevon possesses them
 * in [ffx-bfa-yu-yevon §2.1].
 *
 * `magus-sisters` is one summon but three actors on the field
 * ({@link MagusSisterId}).
 */
export type AeonId =
  /** Besaid. Only aeon with two Overdrives (Energy Ray, Energy Blast). Attack uses ACC x2.5. */
  | 'valefor'
  /** Kilika. Absorbs Fire. Special: Meteor Strike (damage type Other). */
  | 'ifrit'
  /** Djose. Absorbs Thunder. Special: Aerospark strips Shell/Protect/Reflect/Nuls/Regen/Haste. */
  | 'ixion'
  /** Macalania. Absorbs Ice. Special: Heavenly Strike carries Threaten at chance 100. */
  | 'shiva'
  /** Zanarkand. Impulse hits all enemies; Mega Flare always breaks the damage limit. */
  | 'bahamut'
  /** Optional (Baaj Temple). Pain carries Death at chance 100; Oblivion is 4 DmgCon x 16 hits. */
  | 'anima'
  /** Optional (Cavern of the Stolen Fayth). Paid per action; Zanmato is Death at chance 255. */
  | 'yojimbo'
  /** Optional (Remiem Temple). Three actors, one summon. */
  | 'magus-sisters';

export const AEON_IDS: readonly AeonId[] = [
  'valefor',
  'ifrit',
  'ixion',
  'shiva',
  'bahamut',
  'anima',
  'yojimbo',
  'magus-sisters',
] as const;

/** The three Magus Sisters, each a separate combatant. */
export type MagusSisterId = 'cindy' | 'sandy' | 'mindy';

/** Mandatory aeons — every player has these by Dream's End. */
export const MANDATORY_AEON_IDS: readonly AeonId[] = [
  'valefor',
  'ifrit',
  'ixion',
  'shiva',
  'bahamut',
] as const;

// ---------------------------------------------------------------------------
// Overdrive modes
// ---------------------------------------------------------------------------

/**
 * All 17 Overdrive modes [ffx-combat-core §5.1]. Re-exported from the battle
 * contract so data files can import ids and modes from one place.
 */
export type { OverdriveModeId } from '../../battle/common/types.ts';

/** All 17, in the Fandom table's order. Everyone starts on `stoic`. */
export const OVERDRIVE_MODE_IDS = [
  'stoic',
  'warrior',
  'comrade',
  'healer',
  'tactician',
  'victim',
  'dancer',
  'avenger',
  'slayer',
  'hero',
  'rook',
  'victor',
  'coward',
  'ally',
  'sufferer',
  'daredevil',
  'loner',
] as const;

// ---------------------------------------------------------------------------
// Sphere types
// ---------------------------------------------------------------------------

/** Sphere Grid sphere ids [ffx-combat-core §10.2]. */
export type SphereId =
  // Red (activation)
  | 'power-sphere'
  | 'mana-sphere'
  | 'speed-sphere'
  | 'ability-sphere'
  | 'fortune-sphere'
  // Key
  | 'lv-1-key-sphere'
  | 'lv-2-key-sphere'
  | 'lv-3-key-sphere'
  | 'lv-4-key-sphere'
  // Purple (creation): turns an empty node into a stat node (+300 HP / +40 MP / +4)
  | 'hp-sphere'
  | 'mp-sphere'
  | 'strength-sphere'
  | 'defense-sphere'
  | 'magic-sphere'
  | 'magic-def-sphere'
  | 'agility-sphere'
  | 'evasion-sphere'
  | 'accuracy-sphere'
  | 'luck-sphere'
  // Yellow (remote activation)
  | 'attribute-sphere'
  | 'special-sphere'
  | 'skill-sphere'
  | 'white-magic-sphere'
  | 'black-magic-sphere'
  | 'master-sphere'
  // Light blue (movement)
  | 'return-sphere'
  | 'friend-sphere'
  | 'teleport-sphere'
  | 'warp-sphere'
  // Clear
  | 'clear-sphere';

// ---------------------------------------------------------------------------
// Enemies — every combatant in Chapters 1–3
// ---------------------------------------------------------------------------

/**
 * Chapter 1 — Mt. Gagazet, the Prominence [ffx-seymour-flux].
 * Seymour Flux is `m142` / bestiary #150; Mortiorchis is `m143` / #151.
 * (ARCHITECTURE.md calls the servant "Mortibody"; that is Seymour **Natus**'s.
 * Flux's servant is Mortiorchis.)
 */
export type SeymourFluxEnemyId = 'seymour-flux' | 'mortiorchis';

/**
 * Chapter 2 — Zanarkand Dome, The Beyond [ffx-yunalesca].
 * One monster record with a script-imposed 24 000 / 48 000 / 60 000 HP split;
 * modelled as three forms on one combatant, so only `yunalesca` is ever on the
 * field. The per-form ids exist so data files can name the forms.
 */
export type YunalescaEnemyId = 'yunalesca';
/** Form ids for `yunalesca`'s three-form script. Index 0/1/2 of `EnemyDef.forms`. */
export type YunalescaFormId = 'yunalesca-human' | 'yunalesca-serpent' | 'yunalesca-medusa';

/**
 * Chapter 3 — Dream's End / Inside Sin [ffx-bfa-yu-yevon].
 *
 * One continuous chapter: BFA form 1 -> form 2 -> the possessed-aeon gauntlet
 * -> Yu Yevon. Two **Yu Pagodas** are present in every battle from the BFA
 * fight onward.
 *
 * Possessed aeons **mirror the player's own aeon stats live** (Luck forced to
 * 1), so their `EnemyDef` stats are placeholders the engine overwrites
 * [ffx-bfa-yu-yevon §2.2]. Only aeons Yuna actually owns are fought.
 */
export type BraskasFinalAeonEnemyId =
  | 'braskas-final-aeon'
  | 'yu-pagoda-left'
  | 'yu-pagoda-right'
  | 'possessed-valefor'
  | 'possessed-ifrit'
  | 'possessed-ixion'
  | 'possessed-shiva'
  | 'possessed-bahamut'
  | 'possessed-anima'
  | 'possessed-yojimbo'
  | 'possessed-cindy'
  | 'possessed-sandy'
  | 'possessed-mindy'
  | 'yu-yevon';

/** Form ids for `braskas-final-aeon`. Form 2 begins with the scripted `Draws sword.` */
export type BraskasFinalAeonFormId = 'bfa-form-1' | 'bfa-form-2';

/** Every FFX enemy combatant across the three chapters. */
export type FFXEnemyId = SeymourFluxEnemyId | YunalescaEnemyId | BraskasFinalAeonEnemyId;

/** The possessed-aeon roster, in the fixed order Yu Yevon uses. */
export const POSSESSED_AEON_ORDER: readonly BraskasFinalAeonEnemyId[] = [
  'possessed-valefor',
  'possessed-ifrit',
  'possessed-ixion',
  'possessed-shiva',
  'possessed-bahamut',
  'possessed-anima',
  'possessed-yojimbo',
  'possessed-cindy',
  'possessed-sandy',
  'possessed-mindy',
] as const;

/** Any FFX combatant id: a character, an aeon actor, or an enemy. */
export type FFXCombatantId = CharacterId | AeonId | MagusSisterId | FFXEnemyId;
