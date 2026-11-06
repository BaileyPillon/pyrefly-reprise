/**
 * The actions of the possessed Rikku and the possessed Paine, the two duels of the hidden chapter "Yuna's Ballad" (the first two of the Den of Woe's five back-to-back fights; `monster.bin` rows 254 and 256).
 * **FFX-2 only** [AGENTS.md rule 14].
 *
 * Source: **the game's own rows** (`research/re-ffx2-yunas-ballad.md` sections 4.3, 6 and 7, the RE session of 2026-11-06), which `../command-records/yunas-ballad.ts` lays on these abilities by id, so the charge, the
 * recovery, the target flags, the damage type, the hit rule, the element and every other field the engine reads are the rows' own; the fields here are the ability's own reading, kept consistent with them and pinned
 * against them by `tests/unit/chapters/yunas-ballad-data.test.ts`. Every id here is `x2-possessed-`prefixed so nothing of the party's own data is touched.
 *
 * - **Possessed Rikku** (`m254`): **Spider Attack** (monmagic 0x40c7: two hits of power 16, the physical race with her accuracy) and five thrown items, each a row of `item.bin` taken from the strong versions the SCRIPT
 *   queues (not the weak versions of her record list): **Bomb Core** 0x201a (Fire), **Arctic Wind** 0x201d (Ice), **Lightning Marble** 0x2020 (Thunder) and **Dragon Scale** 0x2023 (Water), each formula 8 power 6 on one
 *   girl, a flat 281 to 317 that neither Shell nor Protect changes (the damage-flags word carries no type bit), and **Grenade** 0x2011 (formula 8 power 4 on the whole party, physical: Protect halves it, 187 to 211).
 * - **Possessed Paine** (`m256`): **Attack** (monmagic 0x41da, the row the fixture `command_rows.json` already holds: one hit of power 16, the physical race with ACC 95, crit byte 5, shatter 10).
 *
 * **Hit rule** (hard rule 5): the two Attacks roll (accuracy formula 1 on Spider Attack, base the row's byte 95, and formula 2 on Paine's Attack, base her own ACC 95; both in the row's misc word) and set `canMiss: true`; the five thrown items have accuracy formula 0 ("never rolls") and carry `canMiss: false` explicitly,
 * because an unset field silently rolls. **Multi-target halving:** the FFX-2 engine halves only the party's Black and White Magic cast on all (`src/battle/ffx2/execute.ts`), so Grenade takes none.
 * **Not built:** the weak versions in Rikku's record list (Bomb Fragment 0x2019, Antarctic Wind 0x201c, Electro Marble 0x201f, Fish Scale 0x2022, Budget Grenade 0x2010), which only a Confused Rikku would pick: the engine
 * leaves a Confused MONSTER to its script (`battle/ffx2/adapt/confusion.ts`), so they are unreachable and are not authored (pick YB9; `docs/handoff/ch-yunas-ballad.md`).
 * Confidence: [verified: the game's own table, pinned by `tests/unit/chapters/yunas-ballad-data.test.ts` against `tests/fixtures/parity/ffx2/yunas_ballad_rows.json`].
 */

import type { AbilityDef } from '../../../battle/common/types.ts';

const base = {
  game: 'ffx2' as const,
  category: 'enemy' as const,
  mpCost: 0,
  hits: 1,
  statusEffects: [],
  removesStatuses: [],
  flags: [],
  canMiss: false as const, // rule 5: the thrown items' accuracy formula is 0 ("never rolls"); the two Attacks override this with `true`
};

/** The ability ids (the AI scripts and the tests name these, never a literal). */
export const POSSESSED_RIKKU_SPIDER_ATTACK_ID = 'x2-possessed-rikku-spider-attack';
export const POSSESSED_RIKKU_BOMB_CORE_ID = 'x2-possessed-rikku-bomb-core';
export const POSSESSED_RIKKU_ARCTIC_WIND_ID = 'x2-possessed-rikku-arctic-wind';
export const POSSESSED_RIKKU_LIGHTNING_MARBLE_ID = 'x2-possessed-rikku-lightning-marble';
export const POSSESSED_RIKKU_DRAGON_SCALE_ID = 'x2-possessed-rikku-dragon-scale';
export const POSSESSED_RIKKU_GRENADE_ID = 'x2-possessed-rikku-grenade';
export const POSSESSED_PAINE_ATTACK_ID = 'x2-possessed-paine-attack';

/** One of the four elemental throws: formula 8 power 6 on one girl, no damage-type bit (neither Shell nor Protect reduces it), the element of the item. */
function throwItem(id: string, name: string, element: 'fire' | 'ice' | 'lightning' | 'water'): AbilityDef {
  return {
    ...base,
    id,
    name,
    power: 6, // formula 8 (a fixed value with variance): `v x 6 x 50 / 256`, 281 to 317 [row item.bin 0x201a, 0x201d, 0x2020, 0x2023]
    formula: 'fixed',
    damageType: 'other', // the row's damage flags are 0x40 (the 9,999 cap): no physical bit, no magical bit
    element: [element],
    targeting: 'single-enemy', // the near-weighted pick of a living girl, made first
    messageTemplate: `Rikku throws ${name} at {target}`,
  };
}

/** The abilities of the two possessed friends. */
export const x2YunasBalladAbilities: AbilityDef[] = [
  // ---- Possessed Rikku (row 254) --------------------------------------------------------------------------------------------------
  {
    ...base,
    id: POSSESSED_RIKKU_SPIDER_ATTACK_ID,
    name: 'Spider Attack',
    power: 16, // two hits of power 16, crit byte 10, accuracy byte 95 [row monmagic 0x40c7: formula 0, hits 2]
    formula: 'strength',
    damageType: 'physical',
    element: ['none'],
    targeting: 'single-enemy',
    hits: 2,
    canMiss: true, // accuracy formula 1: the race with the row's accuracy byte, 95 (`research/re-ffx2-hit-status.md` §2.1)
    messageTemplate: 'Rikku uses Spider Attack on {target}',
  },
  throwItem(POSSESSED_RIKKU_BOMB_CORE_ID, 'Bomb Core', 'fire'),
  throwItem(POSSESSED_RIKKU_ARCTIC_WIND_ID, 'Arctic Wind', 'ice'),
  throwItem(POSSESSED_RIKKU_LIGHTNING_MARBLE_ID, 'Lightning Marble', 'lightning'),
  throwItem(POSSESSED_RIKKU_DRAGON_SCALE_ID, 'Dragon Scale', 'water'),
  {
    ...base,
    id: POSSESSED_RIKKU_GRENADE_ID,
    name: 'Grenade',
    power: 4, // formula 8, power 4, the whole party, 187 to 211 [row item.bin 0x2011]
    formula: 'fixed',
    damageType: 'physical', // the row's damage flags are 0x41: a physical bit and the 9,999 cap, so Protect halves it
    element: ['none'],
    targeting: 'all-enemies',
    messageTemplate: 'Rikku throws a Grenade',
  },

  // ---- Possessed Paine (row 256) --------------------------------------------------------------------------------------------------
  {
    ...base,
    id: POSSESSED_PAINE_ATTACK_ID,
    name: 'Attack',
    power: 16, // one hit of power 16, crit byte 5, shatter 10 [row monmagic 0x41da]
    formula: 'strength',
    damageType: 'physical',
    element: ['none'],
    targeting: 'single-enemy',
    canMiss: true,
    messageTemplate: 'Paine attacks {target}',
  },
];
