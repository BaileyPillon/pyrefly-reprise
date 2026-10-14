/**
 * The actions of the optional FFX-2 mission "Tourist Trap" (the Cavern of the Stolen Fayth; our hidden chapter, branch `ch-tourist-trap`): **Yojimbo's four** (Kozuka, Wakizashi A and B,
 * Zanmato) and **Daigoro's one** (the bite). **FFX-2 only** [AGENTS.md rule 14].
 *
 * Source: the game's own command rows `monmagic.bin` 0x40a1 to 0x40a5, laid on these abilities by `../command-records/tourist-trap.ts` (the RE review of 2026-10-14, m170 and m174,
 * rows 170 and 174; `research/re-ffx2-yojimbo-valefor.md`), and the research they confirm (`research/ffx-yojimbo.md` §8.2: the wiki's damage constants 16, 13 and 16, Kozuka's quarter of
 * current MP and its Poison, Zanmato's 1 HP and 1 MP). **None of these is FFX's row** (the FFX Chapter IX Yojimbo is a different record: `data/ffx/enemies/yojimbo-abilities.ts`, whose header
 * says nothing there may be reused here). This file carries the fields the engine's `AbilityDef` needs around the rows: ids, names, targeting, the banner, the hit rule and the pace.
 *
 * - **Kozuka** (0x40a1): one girl, takes a quarter of her **current MP** (4/16, the MP pool only) and poisons her (status byte 100). No damage to HP.
 * - **Wakizashi A** (0x40a2): one girl, physical, damage constant 16. **Wakizashi B** (0x40a3): the **whole party** (the row's target flags are the all-enemies ones, 0x17, the same as Zanmato's),
 *   physical, damage constant 13. The wiki called both single target; the row decides.
 * - **Zanmato** (0x40a4): the whole party to 1 HP and 1 MP ("remaining HP and MP - 1"), a long charge (120) and a long rest (200). The engine's existing `setHpTo`/`setMpTo` path (formula 0x0a,
 *   `kernel/damage.ts`, the Magus Sisters' Delta Attack): no Protect, Shell or Defense reduces it, it cannot kill, a KO'd girl is untouched.
 * - **Daigoro** (0x40a5): one girl, physical, damage constant 16, rest 100. **Daigoro's own action**, not Yojimbo's: the dog bites on his own turn whenever Yojimbo has called him (`../../../battle/ffx2/ai/tourist-trap.ts`).
 *
 * **Hit rule (AGENTS.md rule 5).** All five rows have accuracy formula 0: none rolls to hit (the review's finding: the first draft let the physical blows roll and 11 percent were evaded). Each
 * carries `canMiss: false`. No move can critically hit (the rows carry no crit byte).
 *
 * **Pace** is the rows' (`cost_atb` / `cost_cast` over AGI 120, at about 2,840 gauge units a second): Kozuka and both Wakizashi rest 120 (about 3.5 s), the bite 100 (2.9 s), Zanmato charges 120 (3.5 s,
 * the wind-up the wiki describes as the raised hand) then rests 200 (5.8 s); the formation adds the sibling aeon chapters' flat action-time estimate on top (`./tourist-trap.ts`). Every id is
 * `x2-yojimbo-` or `x2-daigoro-` prefixed so nothing collides with another chapter's lookup.
 */

import type { AbilityDef } from '../../../battle/common/types.ts';

/** Yojimbo's four actions' ids, one place (the data, the AI script, the tactic, the story and the tests read these). */
export const YOJIMBO_ACTIONS = {
  wakizashiA: 'x2-yojimbo-wakizashi-a',
  wakizashiB: 'x2-yojimbo-wakizashi-b',
  kozuka: 'x2-yojimbo-kozuka',
  zanmato: 'x2-yojimbo-zanmato',
} as const;

/** The two units' ids (the formation `ffx2-cavern-yojimbo`, `./tourist-trap.ts`): written here so the AI script imports no enemy module. */
export const TOURIST_TRAP_UNITS = { yojimbo: 'x2-yojimbo', daigoro: 'x2-daigoro' } as const;

/** Daigoro's one action: the bite (row 0x40a5). */
export const DAIGORO_ACTIONS = { bite: 'x2-daigoro-bite' } as const;

/** The two AI scripts' ids (`../../../battle/ffx2/ai/tourist-trap.ts`): Yojimbo's action counter, and the dog who waits for his call. */
export const YOJIMBO_SCRIPTS = { yojimbo: 'x2-yojimbo', daigoro: 'x2-daigoro' } as const;

/** Yojimbo's four ids, in the order of the rows (0x40a1 to 0x40a4). */
export const YOJIMBO_ACTION_IDS: readonly string[] = [
  YOJIMBO_ACTIONS.kozuka,
  YOJIMBO_ACTIONS.wakizashiA,
  YOJIMBO_ACTIONS.wakizashiB,
  YOJIMBO_ACTIONS.zanmato,
];

/** All five, Daigoro's last. */
export const TOURIST_TRAP_ACTION_IDS: readonly string[] = [...YOJIMBO_ACTION_IDS, DAIGORO_ACTIONS.bite];

const base = {
  game: 'ffx2' as const,
  category: 'enemy' as const,
  mpCost: 0,
  hits: 1,
  statusEffects: [],
  removesStatuses: [],
  flags: [],
  canMiss: false as const, // rule 5: accuracy formula 0 on all five rows: nothing here rolls
};

/** The Tourist Trap's actions, registered with the other enemy abilities (`./index.ts`). */
export const touristTrapAbilities: AbilityDef[] = [
  {
    ...base,
    id: YOJIMBO_ACTIONS.kozuka,
    name: 'Kozuka',
    power: 4, // 25 percent of the target's current MP = 4/16 (row 0x40a1: formula 4, power 4, class 2: the MP pool)
    formula: 'percent-current',
    damageType: 'other',
    element: ['none'],
    targeting: 'single-enemy',
    statusEffects: [{ status: 'poison', chance: 100, duration: 0 }], // the row's status byte for Poison: 100
    extra: { mpOnly: true },
    chargeTicks: 0,
    recoveryTicks: 120,
    messageTemplate: 'Yojimbo uses Kozuka',
  },
  {
    ...base,
    id: YOJIMBO_ACTIONS.wakizashiA,
    name: 'Wakizashi',
    power: 16, // damage constant 16 (row 0x40a2)
    formula: 'strength',
    damageType: 'physical',
    element: ['none'],
    targeting: 'single-enemy',
    extra: { variant: 'A' },
    chargeTicks: 0,
    recoveryTicks: 120,
    messageTemplate: 'Yojimbo uses Wakizashi',
  },
  {
    ...base,
    id: YOJIMBO_ACTIONS.wakizashiB,
    name: 'Wakizashi',
    power: 13, // damage constant 13 (row 0x40a3); its target flags are the whole party's
    formula: 'strength',
    damageType: 'physical',
    element: ['none'],
    targeting: 'all-enemies',
    extra: { variant: 'B' },
    chargeTicks: 0,
    recoveryTicks: 120,
    messageTemplate: 'Yojimbo uses Wakizashi',
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
    extra: { setHpTo: 1, setMpTo: 1 }, // "remaining HP and MP - 1": the whole party to 1 HP and 1 MP (row 0x40a4: formula 10, power 1, class 3)
    chargeTicks: 120,
    recoveryTicks: 200,
    messageTemplate: 'Yojimbo uses Zanmato',
  },
  {
    ...base,
    id: DAIGORO_ACTIONS.bite,
    name: 'Daigoro',
    power: 16, // damage constant 16 (row 0x40a5)
    formula: 'strength',
    damageType: 'physical',
    element: ['none'],
    targeting: 'single-enemy',
    chargeTicks: 0,
    recoveryTicks: 100,
    messageTemplate: 'Daigoro attacks {target}',
  },
];
