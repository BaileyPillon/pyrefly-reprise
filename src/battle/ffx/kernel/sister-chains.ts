/**
 * The Magus Sisters' candidate chains, as data (re-parity lane FFX-K, the Sisters' orders of 2026-10-15; **FFX only**).
 *
 * **Game case: FFX only.** Source: `research/re-ffx-zanmato-and-orders.md` Part 2 section 11 (branch `re-ffx-zanmato-and-orders`, final decode `f59c4592`), read from the
 * three sister workers of the battle-system script (worker 60 Cindy, 61 Sandy, 62 Mindy; events 13 to 20) and **proved**: each of the sixteen handlers ran 1,500
 * times on the game's own script VM against an independent model, 0 mismatches (`tests/unit/parity-ffx-sister-orders.test.ts` replays a stratified subset from
 * `tests/fixtures/parity/ffx/sister_orders.json`). Numbers only: no script text. Command ids are the game's (`./sister-search.ts#COMMAND_ROWS` has their rows, the
 * engine's ids for them are `adapt/sister-orders.ts#SISTER_ABILITY`).
 *
 * **What an order is.** One handler: it clears the standing order (every handler but "One more time"), stores a **class** number, and walks a fixed list of
 * **candidates**. A candidate ({@link Try}) is one search (`./sister-search.ts`): the command, the targeting code T, the property P (negated for "not"), a chance
 * expression of her motivation M, and the (gauge, motivation) pair it writes when it is taken. The first candidate that passes is performed; when none does she
 * loses motivation ({@link Chain.loss}) and performs the rest command on herself. Two kinds of gate wrap candidates: {@link WhenStep} (her HP or MP is below its
 * maximum, **or an order stands**; no draw) and {@link GateStep} (a **plain** roll against a chance, drawn first and always on stream 18, **or an order stands**).
 *
 * Section 11's table rows are cited on each chain below. Mindy's free choice is not a chain (it has two modes, section 14: `./sister-orders.ts#mindyFree`); its
 * spell lists are here.
 */

/** The three sisters. */
export type SisterName = 'cindy' | 'sandy' | 'mindy';

/** The targeting codes of a search (section 9): the monsters, her own side, her own side without her, and one slot alone (Cindy). */
export const T_MONSTERS = 0;
export const T_SIDE = 1;
export const T_OTHERS = 0x101;
export const T_CINDY = 0x20f;

/** The properties (section 10). */
export const P_ANY = 92;
export const P_DEAD = 242;
export const P_AUTO_LIFE = 152;
export const P_REFLECT = 50;
export const P_FULL_HP = 283;
export const P_ALL_NUL = 285;
export const P_SHELL = 286;
export const P_PROTECT = 287;
export const P_HASTE = 288;

/** The commands (section 11's list; the game's ids). */
export const C = {
  attack: 0x3000, pray: 0x3019, lancet: 0x3020, cure: 0x302b, cura: 0x302c, curaga: 0x302d, life: 0x3034, fullLife: 0x3035, haste: 0x3036, shell: 0x303a,
  protect: 0x303b, reflect: 0x303c, autoLife: 0x3040, fira: 0x3045, blizzara: 0x3046, thundara: 0x3047, watera: 0x3048, firaga: 0x3049, blizzaga: 0x304a,
  thundaga: 0x304b, waterga: 0x304c, bio: 0x304d, death: 0x304f, drain: 0x3050, osmose: 0x3051, flare: 0x3052, ultima: 0x3053, camisade: 0x30e5, razzia: 0x30e7,
  passado: 0x30e9, delta: 0x30ea, rest: 0x312c, nulAll: 0x312d,
} as const;

/**
 * A chance expression of her motivation M and her own HP and MP (section 11): `m` is `trunc((mul x M + add) / div)` (defaults 1, 0, 1), `n` a constant (-1 is
 * "always, no draw"), `hp` is `trunc((maxHp - hp) x 256 / (maxHp x div))` and `mp` the same over MP.
 */
export type Chance =
  | { readonly k: 'm'; readonly mul?: number; readonly add?: number; readonly div?: number }
  | { readonly k: 'n'; readonly v: number }
  | { readonly k: 'hp'; readonly div: number }
  | { readonly k: 'mp'; readonly div: number };

/** One candidate: a search and, when it passes, its gain pair and its aim. */
export interface Try {
  readonly cmd: number;
  readonly t: number;
  readonly p: number;
  /** "not" the property (F = 128). */
  readonly neg: boolean;
  readonly chance: Chance;
  /** The (gauge, motivation) pair the candidate writes with the two-argument gain call. */
  readonly gain: readonly [number, number];
  /** Aimed at the stored group (the command is queued with "the matching group"), not at the picked slot. */
  readonly group: boolean;
}

/** Candidates tried only if her HP (or MP) is below its maximum, or an order stands; no draw. */
export interface WhenStep {
  readonly when: 'hp' | 'mp';
  readonly then: readonly Try[];
}

/** Candidates tried only if a plain roll against the chance passes (it is drawn first, always, on stream 18), or an order stands. */
export interface GateStep {
  readonly gate: Chance;
  readonly then: readonly Try[];
}

export type Step = Try | WhenStep | GateStep;

/** A chain: its steps in order, and the motivation she loses (with the rest command) when none of them performs. */
export interface Chain {
  readonly steps: readonly Step[];
  readonly loss: number;
}

const M: Chance = { k: 'm' };
const mPlus = (add: number): Chance => ({ k: 'm', add });
const mDiv = (div: number): Chance => ({ k: 'm', div });
const mHalfPlus = (add: number): Chance => ({ k: 'm', add, div: 2 });
const N = (v: number): Chance => ({ k: 'n', v });

/** One candidate. */
function tr(cmd: number, t: number, p: number, chance: Chance, gain: readonly [number, number], o: { neg?: true; group?: true } = {}): Try {
  return { cmd, t, p, neg: o.neg === true, chance, gain, group: o.group === true };
}
/** A plain attack-style candidate on the monsters. */
const foe = (cmd: number, chance: Chance, gain: readonly [number, number]): Try => tr(cmd, T_MONSTERS, P_ANY, chance, gain);

// ---------------------------------------------------------------------------------------------------------------------------------------------------
// Cindy (worker 60). Classes: 0 free choice, 1 the failed repeat, 2 Fight!, 3 Go, go!, 4 Help each other!
// ---------------------------------------------------------------------------------------------------------------------------------------------------

/** Camisade at the end of her support chains (section 11.1: Go, go! step 5 and Help each other!'s last row). */
const CINDY_CAMISADE_TAIL = foe(C.camisade, M, [3, 5]);

const CINDY_CHAINS: Readonly<Record<number, Chain>> = {
  // "Do as you will" (0x3124, event 13): Auto-Life, Full-Life, Life, Attack, Flare, then (a plain roll of 128 or a standing order) the four -aga spells.
  0: {
    steps: [
      tr(C.autoLife, T_SIDE, P_AUTO_LIFE, mPlus(50), [3, 10], { neg: true }),
      tr(C.fullLife, T_SIDE, P_DEAD, mHalfPlus(50), [2, 6]),
      tr(C.life, T_SIDE, P_DEAD, mHalfPlus(200), [1, 5]),
      foe(C.attack, M, [1, 2]),
      foe(C.flare, mDiv(8), [2, 6]),
      { gate: N(128), then: [C.firaga, C.thundaga, C.blizzaga, C.waterga].map((c) => foe(c, mDiv(2), [1, 2])) },
    ],
    loss: 5,
  },
  // The class of a failed "One more time" (section 11.1, "(class 1, the failed repeat)").
  1: { steps: [foe(C.camisade, M, [1, 2]), foe(C.attack, N(-1), [1, 2])], loss: 5 },
  // "Fight!" (0x3126, event 15).
  2: { steps: [foe(C.camisade, mPlus(20), [2, 4]), foe(C.attack, mPlus(150), [1, 3])], loss: 5 },
  // "Go, go!" (0x3127, event 16): Pray if hurt, Osmose if short of MP (or an order stands), Attack, then (a plain roll of M div 2 or an order stands) the big spells, then Camisade.
  3: {
    steps: [
      { when: 'hp', then: [tr(C.pray, T_SIDE, P_ANY, { k: 'hp', div: 1 }, [1, 1], { group: true })] },
      { when: 'mp', then: [foe(C.osmose, { k: 'mp', div: 1 }, [1, 1])] },
      foe(C.attack, { k: 'm', mul: 2 }, [1, 2]),
      {
        gate: mDiv(2),
        then: [
          tr(C.ultima, T_MONSTERS, P_ANY, mPlus(-80), [5, 10], { group: true }),
          foe(C.flare, mDiv(8), [2, 6]),
          foe(C.drain, mDiv(2), [2, 6]),
          ...[C.blizzaga, C.waterga, C.thundaga, C.firaga].map((c) => foe(c, M, [1, 2])),
          foe(C.attack, N(-1), [1, 2]),
        ],
      },
      CINDY_CAMISADE_TAIL,
    ],
    loss: 5,
  },
  // "Help each other!" (0x3128, event 17): Full-Life, Life, Auto-Life, the Cure family on the others (not full HP), then Camisade.
  4: {
    steps: [
      tr(C.fullLife, T_SIDE, P_DEAD, M, [1, 2]),
      tr(C.life, T_SIDE, P_DEAD, mPlus(150), [1, 1]),
      tr(C.autoLife, T_SIDE, P_AUTO_LIFE, mPlus(50), [3, 10], { neg: true }),
      ...[C.cure, C.cura, C.curaga].map((c) => tr(c, T_OTHERS, P_FULL_HP, mDiv(2), [1, 2], { neg: true })),
      CINDY_CAMISADE_TAIL,
    ],
    loss: 5,
  },
};

// ---------------------------------------------------------------------------------------------------------------------------------------------------
// Sandy (worker 61). Classes: 0 free choice, 1 the failed repeat, 2 Fight!, 5 Defense!
// ---------------------------------------------------------------------------------------------------------------------------------------------------

/** Razzia, then Attack with no roll (section 11.2: the free choice's steps 2 and 3, also the class of a failed repeat). */
const SANDY_TAIL: readonly Try[] = [foe(C.razzia, N(128), [1, 2]), foe(C.attack, N(-1), [1, 2])];

const SANDY_CHAINS: Readonly<Record<number, Chain>> = {
  // "Do as you will" (event 13): Reflect on Cindy if she has none, then the tail.
  0: { steps: [tr(C.reflect, T_CINDY, P_REFLECT, mPlus(200), [2, 2], { neg: true }), ...SANDY_TAIL], loss: 5 },
  1: { steps: SANDY_TAIL, loss: 5 },
  // "Fight!" (event 15).
  2: { steps: [foe(C.razzia, mPlus(50), [2, 4]), foe(C.attack, mPlus(180), [1, 3])], loss: 5 },
  // "Defense!" (0x312A, event 19): Shell, Protect, Haste on the side (those that lack it and have no Reflect), NulAll, the Cure family on the others, Razzia, Attack.
  5: {
    steps: [
      tr(C.shell, T_SIDE, P_SHELL, mPlus(50), [1, 2], { neg: true }),
      tr(C.protect, T_SIDE, P_PROTECT, mPlus(50), [1, 2], { neg: true }),
      tr(C.haste, T_SIDE, P_HASTE, M, [1, 2], { neg: true }),
      tr(C.nulAll, T_SIDE, P_ALL_NUL, mPlus(50), [1, 2], { neg: true, group: true }),
      tr(C.cure, T_OTHERS, P_FULL_HP, mDiv(4), [1, 2], { neg: true }),
      tr(C.cura, T_OTHERS, P_FULL_HP, mDiv(6), [1, 2], { neg: true }),
      tr(C.curaga, T_OTHERS, P_FULL_HP, mDiv(8), [1, 2], { neg: true }),
      foe(C.razzia, M, [2, 2]),
      foe(C.attack, M, [1, 2]),
    ],
    loss: 5,
  },
};

// ---------------------------------------------------------------------------------------------------------------------------------------------------
// Mindy (worker 62). Classes: 0 free choice (section 14), 1 the failed repeat, 2 Fight!, 6 Are you all right?
// ---------------------------------------------------------------------------------------------------------------------------------------------------

/** Passado then Attack, each at M + 100 (section 11.3: the free choice's last mode, after the Reflect combo). */
const MINDY_TAIL: readonly Try[] = [foe(C.passado, mPlus(100), [1, 3]), foe(C.attack, mPlus(100), [1, 3])];

const MINDY_CHAINS: Readonly<Record<number, Chain>> = {
  // The free choice's third mode (section 14 step 3) is the tail alone; the first two modes are `mindyFree`.
  0: { steps: MINDY_TAIL, loss: 5 },
  1: { steps: [foe(C.passado, N(128), [1, 2]), foe(C.attack, mPlus(100), [1, 3])], loss: 5 },
  // "Fight!" (event 15).
  2: { steps: [foe(C.passado, mPlus(30), [2, 4]), foe(C.attack, mPlus(180), [1, 3])], loss: 5 },
  // "Are you all right?" (0x312B, event 20): Lancet, Drain by her missing HP, Osmose by her missing MP; the loss is 1.
  6: {
    steps: [foe(C.lancet, mDiv(2), [2, 3]), foe(C.drain, { k: 'hp', div: 2 }, [2, 3]), foe(C.osmose, { k: 'mp', div: 2 }, [2, 3])],
    loss: 1,
  },
};

/** The chains of each sister by class. */
export const CHAINS: Readonly<Record<SisterName, Readonly<Record<number, Chain>>>> = { cindy: CINDY_CHAINS, sandy: SANDY_CHAINS, mindy: MINDY_CHAINS };

/** The class each order event stores (section 12): 13 free (0), 15 Fight! (2), 16 Go, go! (3), 17 Help (4), 19 Defense! (5), 20 Are you all right? (6). */
export const EVENT_CLASS: Readonly<Record<number, number>> = { 13: 0, 15: 2, 16: 3, 17: 4, 19: 5, 20: 6 };

/** The chance the "One more time" roll uses, `M + this` (Cindy 150, Sandy and Mindy 120), and the four-argument pair it writes (section 13). */
export const REPEAT: Readonly<Record<SisterName, { readonly add: number; readonly pair: readonly [number, number, number, number] }>> = {
  cindy: { add: 150, pair: [2, 4, 0, -6] },
  sandy: { add: 120, pair: [2, 4, 0, -6] },
  mindy: { add: 120, pair: [2, 4, 0, -15] },
};

/**
 * Mindy's Reflect combo (section 14 step 2): every spell is searched on Cindy alone (T_CINDY, property 92). Per round the first of these that passes is queued:
 * Flare (M div 2, (2, 3)); else Bio then Death (each M div 2, (2, 2)); else the eight elemental spells in this order (each M, (1, 2)); else Drain (M, (0, 1)).
 */
export const MINDY_COMBO = {
  flare: { cmd: C.flare, chance: mDiv(2), gain: [2, 3] as const },
  curses: { cmds: [C.bio, C.death] as const, chance: mDiv(2), gain: [2, 2] as const },
  elements: { cmds: [C.firaga, C.thundaga, C.waterga, C.blizzaga, C.fira, C.thundara, C.watera, C.blizzara] as const, chance: M, gain: [1, 2] as const },
  drain: { cmd: C.drain, chance: M, gain: [0, 1] as const },
} as const;
