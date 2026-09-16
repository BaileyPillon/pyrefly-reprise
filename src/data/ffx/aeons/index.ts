/**
 * FFX Aeon catalog: the 8 base aeon records, their stat-scaling
 * coefficients, and the 3 canonical per-encounter stat blocks. Ability
 * bodies live in the sibling `aeons/abilities-core*.ts` /
 * `abilities-optional*.ts` files; this file only references their ids.
 *
 * §6.1 Summon rules `[ffx-combat-core §6.1, verified: 2 sources]` — kept
 * here as documentation, not as fields on any exported record:
 * "Aeon replaces the whole active party; only one aeon at a time;
 * elemental aeons absorb their own element (Ifrit=fire, Ixion=lightning/
 * thunder, Shiva=ice — see the `absorbsElement` field on
 * `AeonCatalogDef` below); aeon HP/MP persist between battles, not
 * refilled by winning; AEON_REVIVE_BATTLES = 3 after a KO."
 */

import type { Stats } from '../../../battle/common/types.ts';

// ---------------------------------------------------------------------------
// Catalog type
// ---------------------------------------------------------------------------

/**
 * There is no `AeonDef` catalog type in `battle/common/types.ts` (only the
 * per-battle `AeonFields`/`AeonBuild` shapes), so this is a local catalog
 * interface, matching the coordinating agent's brief for this file.
 */
export interface AeonCatalogDef {
  /** 'valefor'|'ifrit'|'ixion'|'shiva'|'bahamut'|'anima'|'yojimbo'|'cindy'|'sandy'|'mindy' */
  id: string;
  name: string;
  /** Plain lowercase-kebab id, per the project's art pipeline convention. Art lives at `public/art/aeons/<id>/<pose>.png`. */
  spriteKey: string;
  /** Same plain id. Art lives at `public/art/portraits/<id>.png`. */
  portraitKey: string;
  /** A single ability id for every aeon except Yojimbo, who has 4 attack variants. */
  attackAbilityId: string | string[];
  /** null only for Yojimbo — he has no "Special", only his 4 attacks + Zanmato. */
  specialAbilityId: string | null;
  /** Valefor has 2 (Energy Ray, Energy Blast); everyone else has 1. The Magus Sisters all list the shared 'delta-attack'. */
  overdriveAbilityIds: string[];
  /** ['shield', 'boost', 'dismiss'] for every aeon. The Magus Sisters additionally list 'nul-all-aeon' here (no bespoke field exists for it). */
  sharedCommandIds: string[];
  /** Ifrit=fire, Ixion=lightning, Shiva=ice; null for every other aeon [ffx-combat-core §6.1]. */
  absorbsElement?: 'fire' | 'ice' | 'lightning' | null;
  /** true for cindy/sandy/mindy. Absent (falsy) for every other aeon. */
  isMagusSister?: boolean;
}

/** Every shared sub-command every aeon offers. */
const SHARED_COMMANDS = ['shield', 'boost', 'dismiss'] as const;

// ---------------------------------------------------------------------------
// The 8 aeon base records (10 catalog entries — Magus Sisters is 3 actors)
// ---------------------------------------------------------------------------

export const AEONS: Record<string, AeonCatalogDef> = {
  valefor: {
    id: 'valefor',
    name: 'Valefor',
    spriteKey: 'valefor',
    portraitKey: 'valefor',
    attackAbilityId: 'valefor-attack',
    specialAbilityId: 'sonic-wings',
    // Only aeon with two Overdrives [ffx-combat-core §6.3].
    overdriveAbilityIds: ['energy-ray', 'energy-blast'],
    sharedCommandIds: [...SHARED_COMMANDS],
    absorbsElement: null,
  },

  ifrit: {
    id: 'ifrit',
    name: 'Ifrit',
    spriteKey: 'ifrit',
    portraitKey: 'ifrit',
    attackAbilityId: 'ifrit-attack',
    specialAbilityId: 'meteor-strike',
    overdriveAbilityIds: ['hellfire'],
    sharedCommandIds: [...SHARED_COMMANDS],
    absorbsElement: 'fire',
  },

  ixion: {
    id: 'ixion',
    name: 'Ixion',
    spriteKey: 'ixion',
    portraitKey: 'ixion',
    attackAbilityId: 'ixion-attack',
    specialAbilityId: 'aerospark',
    overdriveAbilityIds: ['thors-hammer'],
    sharedCommandIds: [...SHARED_COMMANDS],
    // "Thunder" is spelled 'lightning' in this codebase's ElementId union.
    absorbsElement: 'lightning',
  },

  shiva: {
    id: 'shiva',
    name: 'Shiva',
    spriteKey: 'shiva',
    portraitKey: 'shiva',
    attackAbilityId: 'shiva-attack',
    specialAbilityId: 'heavenly-strike',
    overdriveAbilityIds: ['diamond-dust'],
    sharedCommandIds: [...SHARED_COMMANDS],
    absorbsElement: 'ice',
  },

  bahamut: {
    id: 'bahamut',
    name: 'Bahamut',
    spriteKey: 'bahamut',
    portraitKey: 'bahamut',
    attackAbilityId: 'bahamut-attack',
    specialAbilityId: 'impulse',
    overdriveAbilityIds: ['mega-flare'],
    sharedCommandIds: [...SHARED_COMMANDS],
    absorbsElement: null,
  },

  anima: {
    id: 'anima',
    name: 'Anima',
    spriteKey: 'anima',
    portraitKey: 'anima',
    attackAbilityId: 'anima-attack',
    specialAbilityId: 'pain',
    overdriveAbilityIds: ['oblivion'],
    sharedCommandIds: [...SHARED_COMMANDS],
    absorbsElement: null,
  },

  yojimbo: {
    id: 'yojimbo',
    name: 'Yojimbo',
    spriteKey: 'yojimbo',
    portraitKey: 'yojimbo',
    // 4 attack variants; no Special at all [ffx-combat-core §6.3].
    attackAbilityId: ['daigoro', 'kozuka', 'wakizashi-single', 'wakizashi-multi'],
    specialAbilityId: null,
    overdriveAbilityIds: ['zanmato'],
    sharedCommandIds: [...SHARED_COMMANDS],
    absorbsElement: null,
  },

  cindy: {
    id: 'cindy',
    name: 'Cindy',
    spriteKey: 'cindy',
    portraitKey: 'cindy',
    attackAbilityId: 'cindy-attack',
    specialAbilityId: 'camisade',
    // Shared across all three sisters [ffx-combat-core §6.3].
    overdriveAbilityIds: ['delta-attack'],
    // Nul-All is usable by any of the three sisters; there is no bespoke
    // catalog field for it, so it rides along with the shared commands.
    sharedCommandIds: [...SHARED_COMMANDS, 'nul-all-aeon'],
    absorbsElement: null,
    isMagusSister: true,
  },

  sandy: {
    id: 'sandy',
    name: 'Sandy',
    spriteKey: 'sandy',
    portraitKey: 'sandy',
    attackAbilityId: 'sandy-attack',
    specialAbilityId: 'razzia',
    overdriveAbilityIds: ['delta-attack'],
    sharedCommandIds: [...SHARED_COMMANDS, 'nul-all-aeon'],
    absorbsElement: null,
    isMagusSister: true,
  },

  mindy: {
    id: 'mindy',
    name: 'Mindy',
    spriteKey: 'mindy',
    portraitKey: 'mindy',
    attackAbilityId: 'mindy-attack',
    specialAbilityId: 'passado',
    overdriveAbilityIds: ['delta-attack'],
    sharedCommandIds: [...SHARED_COMMANDS, 'nul-all-aeon'],
    absorbsElement: null,
    isMagusSister: true,
  },
};

export default AEONS;

// ---------------------------------------------------------------------------
// §6.4 Aeon stat-scaling coefficients
// ---------------------------------------------------------------------------

/**
 * `(xPercent%, yCoef)` per aeon per stat `[ffx-combat-core §6.4, verified:
 * 2 sources]`. Feeds the (not-yet-implemented-here) formula the engine
 * uses to derive live aeon stats from Yuna's own stats; this file only
 * ships the coefficient data.
 *
 * Storage choice: `xPercent` is the raw percent integer from the table
 * (e.g. `20` for "20%"). `yCoef` is stored as an **evaluated fraction
 * expression** (e.g. `1 / 7`) rather than a pre-rounded decimal literal —
 * this keeps full floating-point precision and keeps the original
 * "xN/M" notation from §6.4 directly legible in the source, so a reviewer
 * can diff this file against the research table without a calculator.
 *
 * LUCK has no coefficient row in §6.4 — every aeon's Luck is
 * `yuna.luck + trainedAeonBonus.luck` (a flat carry-over, not a
 * percent/coefficient scale), so it is intentionally absent from this
 * table; see `AEON_CANONICAL_STATS` for the shipped Luck values instead.
 */
export const AEON_STAT_COEFFICIENTS: Record<
  string,
  {
    hp: [xPercent: number, yCoef: number];
    mp: [number, number];
    str: [number, number];
    def: [number, number];
    mag: [number, number];
    mdef: [number, number];
    agi: [number, number];
    eva: [number, number];
    acc: [number, number];
  }
> = {
  valefor: {
    hp: [20, 6],
    mp: [4, 1 / 5],
    str: [60, 1 / 7],
    def: [50, 1 / 5],
    mag: [100, 1 / 70],
    mdef: [100, 1 / 30],
    agi: [50, 1 / 20],
    eva: [50, 1 / 24],
    acc: [200, 1 / 20],
  },
  ifrit: {
    hp: [70, 5],
    mp: [3, 1 / 5],
    str: [80, 1 / 7],
    def: [170, 1 / 5],
    mag: [90, 1 / 33],
    mdef: [90, 1 / 34],
    agi: [40, 1 / 20],
    eva: [30, 1 / 70],
    acc: [200, 1 / 20],
  },
  ixion: {
    hp: [55, 6],
    mp: [5, 1 / 5],
    str: [100, 1 / 7],
    def: [100, 1 / 5],
    mag: [90, 1 / 38],
    mdef: [130, 1 / 30],
    agi: [30, 1 / 20],
    eva: [30, 1 / 47],
    acc: [250, 1 / 20],
  },
  shiva: {
    hp: [40, 6],
    mp: [7, 1 / 5],
    str: [120, 1 / 8],
    def: [40, 1 / 7],
    mag: [100, 1 / 28],
    mdef: [100, 1 / 25],
    agi: [100, 1 / 23],
    eva: [100, 1 / 44],
    acc: [200, 1 / 20],
  },
  bahamut: {
    hp: [100, 7],
    mp: [5, 3 / 10],
    str: [160, 1 / 7],
    def: [200, 1 / 6],
    mag: [90, 1 / 250],
    mdef: [100, 1 / 12],
    agi: [50, 1 / 20],
    eva: [50, 1 / 20],
    acc: [200, 1 / 20],
  },
  anima: {
    hp: [120, 8],
    mp: [4, 2 / 5],
    str: [330, 1 / 6],
    def: [100, 1 / 5],
    mag: [70, 1 / 12],
    mdef: [100, 1 / 30],
    agi: [40, 1 / 20],
    eva: [50, 1 / 20],
    acc: [200, 1 / 20],
  },
  yojimbo: {
    hp: [18, 9],
    mp: [0, 0],
    str: [240, 1 / 6],
    def: [250, 1 / 8],
    mag: [60, 1 / 23],
    mdef: [100, 1 / 30],
    agi: [40, 1 / 20],
    eva: [180, 1 / 20],
    acc: [300, 1 / 10],
  },
  cindy: {
    hp: [240, 10],
    mp: [18, 3 / 10],
    str: [230, 1 / 6],
    def: [300, 1 / 6],
    mag: [100, 1 / 60],
    mdef: [100, 1 / 12],
    agi: [50, 1 / 20],
    eva: [50, 1 / 20],
    acc: [200, 1 / 20],
  },
  sandy: {
    hp: [200, 8],
    mp: [5, 3 / 10],
    str: [550, 1 / 7],
    def: [180, 1 / 6],
    mag: [110, 1 / 40],
    mdef: [100, 1 / 12],
    agi: [50, 1 / 20],
    eva: [40, 1 / 20],
    acc: [270, 1 / 20],
  },
  mindy: {
    hp: [150, 5],
    mp: [20, 2 / 5],
    str: [160, 1 / 7],
    def: [140, 1 / 6],
    mag: [130, 1 / 40],
    mdef: [100, 1 / 12],
    agi: [70, 1 / 20],
    eva: [60, 1 / 20],
    acc: [240, 1 / 20],
  },
};

// ---------------------------------------------------------------------------
// §6.4.3 Canonical aeon stat blocks — ship these
// ---------------------------------------------------------------------------

/**
 * Precomputed, mechanically-derived stat blocks for the three encounters
 * `[ffx-combat-core §6.4.3, estimate, mechanically derived from verified
 * constants]`. Keyed by encounter, then by aeon catalog id.
 */
export const AEON_CANONICAL_STATS: Record<
  'seymour-flux' | 'yunalesca' | 'braskas-final-aeon',
  Record<string, Stats & { luck: number; baseCtb: number }>
> = {
  'seymour-flux': {
    valefor: { hp: 1530, mp: 51, str: 38, def: 47, mag: 39, mdef: 45, agi: 18, eva: 25, acc: 32, luck: 17, baseCtb: 11 },
    ifrit: { hp: 2075, mp: 49, str: 41, def: 63, mag: 39, mdef: 41, agi: 16, eva: 12, acc: 32, luck: 17, baseCtb: 12 },
    ixion: { hp: 2055, mp: 54, str: 44, def: 54, mag: 38, mdef: 56, agi: 14, eva: 13, acc: 37, luck: 17, baseCtb: 13 },
    shiva: { hp: 1830, mp: 59, str: 43, def: 34, mag: 44, mdef: 47, agi: 27, eva: 39, acc: 32, luck: 17, baseCtb: 9 },
    bahamut: { hp: 2935, mp: 74, str: 53, def: 60, mag: 33, mdef: 56, agi: 18, eva: 26, acc: 32, luck: 17, baseCtb: 11 },
    anima: { hp: 3440, mp: 92, str: 83, def: 54, mag: 42, mdef: 45, agi: 16, eva: 26, acc: 32, luck: 17, baseCtb: 12 },
    yojimbo: { hp: 2115, mp: 0, str: 70, def: 57, mag: 30, mdef: 45, agi: 16, eva: 72, acc: 53, luck: 17, baseCtb: 12 },
    cindy: { hp: 5650, mp: 109, str: 68, def: 73, mag: 40, mdef: 56, agi: 18, eva: 26, acc: 32, luck: 17, baseCtb: 11 },
    sandy: { hp: 4640, mp: 74, str: 111, def: 57, mag: 45, mdef: 56, agi: 18, eva: 23, acc: 39, luck: 17, baseCtb: 11 },
    mindy: { hp: 3275, mp: 136, str: 53, def: 52, mag: 53, mdef: 56, agi: 22, eva: 29, acc: 36, luck: 17, baseCtb: 10 },
  },

  yunalesca: {
    valefor: { hp: 1674, mp: 55, str: 41, def: 51, mag: 44, mdef: 50, agi: 21, eva: 28, acc: 35, luck: 17, baseCtb: 10 },
    ifrit: { hp: 2275, mp: 52, str: 44, def: 67, mag: 42, mdef: 44, agi: 18, eva: 14, acc: 35, luck: 17, baseCtb: 11 },
    ixion: { hp: 2251, mp: 58, str: 48, def: 58, mag: 41, mdef: 62, agi: 16, eva: 16, acc: 41, luck: 17, baseCtb: 12 },
    shiva: { hp: 2004, mp: 64, str: 47, def: 37, mag: 49, mdef: 51, agi: 32, eva: 44, acc: 35, luck: 17, baseCtb: 8 },
    bahamut: { hp: 3218, mp: 81, str: 57, def: 65, mag: 36, mdef: 61, agi: 21, eva: 29, acc: 35, luck: 17, baseCtb: 10 },
    anima: { hp: 3772, mp: 100, str: 89, def: 58, mag: 46, mdef: 50, agi: 18, eva: 29, acc: 35, luck: 17, baseCtb: 11 },
    yojimbo: { hp: 2313, mp: 0, str: 75, def: 63, mag: 33, mdef: 50, agi: 18, eva: 81, acc: 58, luck: 17, baseCtb: 11 },
    cindy: { hp: 6200, mp: 119, str: 73, def: 79, mag: 44, mdef: 61, agi: 21, eva: 29, acc: 35, luck: 17, baseCtb: 10 },
    sandy: { hp: 5092, mp: 81, str: 120, def: 62, mag: 50, mdef: 61, agi: 21, eva: 25, acc: 43, luck: 17, baseCtb: 10 },
    mindy: { hp: 3595, mp: 147, str: 57, def: 56, mag: 58, mdef: 61, agi: 25, eva: 33, acc: 39, luck: 17, baseCtb: 9 },
  },

  'braskas-final-aeon': {
    valefor: { hp: 1886, mp: 62, str: 45, def: 58, mag: 49, mdef: 56, agi: 24, eva: 30, acc: 38, luck: 17, baseCtb: 9 },
    ifrit: { hp: 2585, mp: 59, str: 49, def: 77, mag: 48, mdef: 50, agi: 21, eva: 16, acc: 38, luck: 17, baseCtb: 10 },
    ixion: { hp: 2551, mp: 66, str: 53, def: 66, mag: 47, mdef: 70, agi: 18, eva: 17, acc: 44, luck: 17, baseCtb: 11 },
    shiva: { hp: 2266, mp: 72, str: 52, def: 41, mag: 54, mdef: 58, agi: 37, eva: 48, acc: 38, luck: 17, baseCtb: 7 },
    bahamut: { hp: 3657, mp: 91, str: 63, def: 73, mag: 42, mdef: 68, agi: 24, eva: 32, acc: 38, luck: 17, baseCtb: 9 },
    anima: { hp: 4288, mp: 112, str: 100, def: 66, mag: 52, mdef: 56, agi: 21, eva: 32, acc: 38, luck: 17, baseCtb: 10 },
    yojimbo: { hp: 2601, mp: 0, str: 84, def: 71, mag: 37, mdef: 56, agi: 21, eva: 89, acc: 64, luck: 17, baseCtb: 10 },
    cindy: { hp: 7070, mp: 132, str: 82, def: 89, mag: 50, mdef: 68, agi: 24, eva: 32, acc: 38, luck: 17, baseCtb: 9 },
    sandy: { hp: 5808, mp: 91, str: 134, def: 69, mag: 56, mdef: 68, agi: 24, eva: 28, acc: 47, luck: 17, baseCtb: 9 },
    mindy: { hp: 4105, mp: 164, str: 63, def: 63, mag: 65, mdef: 68, agi: 29, eva: 36, acc: 43, luck: 17, baseCtb: 8 },
  },
};
