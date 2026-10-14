/**
 * Yojimbo's actions in the optional FFX-2 mission "Tourist Trap" (the Cavern of the Stolen Fayth; our hidden chapter, branch `ch-tourist-trap`). **FFX-2 only** [AGENTS.md rule 14].
 *
 * Source: `research/ffx-yojimbo.md` §8.2 (the wiki's Cavern page, FFExodus Chapter 3, SinirothX's *Enemy Encyclopedia*) and `research/ffx2-fallen-aeons.md` §7.2. **None of these is FFX's row**
 * (the FFX Chapter IX Yojimbo is a different record with different rows: `data/ffx/enemies/yojimbo-abilities.ts`, whose header says nothing there may be reused here). The game's own command rows
 * for these five are pending from the RE session (`research/re-ffx2-yojimbo-valefor.md`); they replace the numbers below field by field when they land, through `command-records/`.
 *
 * Tags: `[verified: N sources]` as the research gives them; `[estimate]` where the research is silent and a reading was chosen (listed in `docs/plans/ch-tourist-trap-review.md` §1).
 *
 * - **Wakizashi A and B**: single target, non-elemental, damage constants 16 and 13 `[verified: 2 sources: wiki, SinirothX]`. Physical, so they roll to hit (rule 5, `canMiss` unset); no critical
 *   (the research says none, so none is claimed).
 * - **Daigoro**: his command to the dog, a non-elemental follow-up of damage constant 16 that lands "even if Yojimbo is hit" `[verified: 2 sources]`. Physical `[estimate]`: a bite. Daigoro himself
 *   is a separate body that cannot be targeted and takes no turn (`./tourist-trap.ts`); the move is Yojimbo's, so it is on his list and his action counter picks it.
 * - **Kozuka**: takes 25 percent of the target's **current MP** and inflicts **Poison** at 100 percent `[verified: 2 sources: wiki, FFExodus]`. 4/16 of current through the shared fractional path,
 *   the MP pool only (`extra.mpOnly`), the Poison rider at the engine's "always lands unless resisted" chance (254). No damage to HP. Never rolls (`canMiss: false`): an MP-and-status move, not a
 *   physical hit `[estimate]`.
 * - **Zanmato** (FFX-2's, NOT FFX's 9,999 damage): the whole party to 1 HP and 1 MP ("remaining HP and MP - 1": the effect `[verified: 2 sources]`, the MP half the wiki's alone). The engine's
 *   existing `setHpTo`/`setMpTo` path (formula 0x0a in `kernel/damage.ts`, the Magus Sisters' Delta Attack): no Protect, Shell or Defense reduces it, it cannot kill, a KO'd girl is untouched.
 *   Never rolls (rule 5: an Overdrive-class move).
 *
 * **Pace** (charge and rest of each move): no source. The engine default stands (rest 70, no charge) and the formation carries the same action-time estimate Bailey picked for the other possessed-aeon
 * fights (`./tourist-trap.ts`). Every id is `x2-yojimbo-`-prefixed so nothing collides with another chapter's lookup.
 */

import type { AbilityDef } from '../../../battle/common/types.ts';

/** The five actions' ids, one place (the data, the AI script, the tactic and the tests read these). */
export const YOJIMBO_ACTIONS = {
  wakizashiA: 'x2-yojimbo-wakizashi-a',
  wakizashiB: 'x2-yojimbo-wakizashi-b',
  daigoro: 'x2-yojimbo-daigoro',
  kozuka: 'x2-yojimbo-kozuka',
  zanmato: 'x2-yojimbo-zanmato',
} as const;

/** The two AI scripts' ids (`../../../battle/ffx2/ai/tourist-trap.ts`): Yojimbo's action counter, and the dog's endless wait. */
export const YOJIMBO_SCRIPTS = { yojimbo: 'x2-yojimbo', daigoro: 'x2-daigoro-bystander' } as const;

/** Every id above, in the order the research lists them. */
export const YOJIMBO_ACTION_IDS: readonly string[] = [
  YOJIMBO_ACTIONS.wakizashiA,
  YOJIMBO_ACTIONS.wakizashiB,
  YOJIMBO_ACTIONS.daigoro,
  YOJIMBO_ACTIONS.kozuka,
  YOJIMBO_ACTIONS.zanmato,
];

const base = {
  game: 'ffx2' as const,
  category: 'enemy' as const,
  mpCost: 0,
  hits: 1,
  statusEffects: [],
  removesStatuses: [],
  flags: [],
};

/** The Tourist Trap's actions, registered with the other enemy abilities (`./index.ts`). */
export const touristTrapAbilities: AbilityDef[] = [
  {
    ...base,
    id: YOJIMBO_ACTIONS.wakizashiA,
    name: 'Wakizashi',
    power: 16, // damage constant 16 [verified: 2 sources]
    formula: 'strength',
    damageType: 'physical',
    element: ['none'],
    targeting: 'single-enemy',
    extra: { variant: 'A' },
    messageTemplate: 'Yojimbo uses Wakizashi',
  },
  {
    ...base,
    id: YOJIMBO_ACTIONS.wakizashiB,
    name: 'Wakizashi',
    power: 13, // the rare version, damage constant 13 [verified: 2 sources]
    formula: 'strength',
    damageType: 'physical',
    element: ['none'],
    targeting: 'single-enemy',
    extra: { variant: 'B' },
    messageTemplate: 'Yojimbo uses Wakizashi',
  },
  {
    ...base,
    id: YOJIMBO_ACTIONS.daigoro,
    name: 'Daigoro',
    power: 16, // non-elemental, damage constant 16 [verified: 2 sources]
    formula: 'strength',
    damageType: 'physical', // [estimate]: the dog's bite; the sources say only non-elemental
    element: ['none'],
    targeting: 'single-enemy',
    messageTemplate: 'Yojimbo calls Daigoro',
  },
  {
    ...base,
    id: YOJIMBO_ACTIONS.kozuka,
    name: 'Kozuka',
    power: 4, // 25 percent of the target's current MP = 4/16 [verified: 2 sources]
    formula: 'percent-current',
    damageType: 'other',
    element: ['none'],
    targeting: 'single-enemy',
    statusEffects: [{ status: 'poison', chance: 254, duration: 0 }], // Poison at 100 percent: lands unless the girl resists it
    canMiss: false,
    extra: { mpOnly: true },
    messageTemplate: 'Yojimbo uses Kozuka',
  },
  {
    ...base,
    id: YOJIMBO_ACTIONS.zanmato,
    name: 'Zanmato',
    power: 0,
    formula: 'none',
    damageType: 'other',
    element: ['none'],
    targeting: 'all-enemies',
    canMiss: false, // rule 5: never rolls
    extra: { setHpTo: 1, setMpTo: 1 }, // "remaining HP and MP - 1": the whole party to 1 HP and 1 MP
    messageTemplate: 'Yojimbo uses Zanmato',
  },
];
