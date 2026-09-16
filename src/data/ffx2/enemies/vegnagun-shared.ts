/**
 * Shared immunity bytes for the Vegnagun chain and Shuyin
 * [ffx2-vegnagun-shuyin.md §3.1-3.5, verified: 2 sources]. Every part in the
 * chain shares a common "standard ailment" block; what varies is which stat
 * Up/Down statuses land (the whole point of the encounter's Break-routing
 * puzzle) and whether Haste/Slow/Stop/Reflect land. `ko` covers both
 * ordinary instant-death effects and Zantetsu (Status 3 formula) — every
 * enemy in the chain carries Zantetsu resistance 255 regardless [§6.4], so
 * the two immunities are functionally identical here even though the
 * Farplane build's girls do own Samurai; see the contract note in
 * `enemies/bahamut.ts`.
 */

import type { StatusImmunities } from '../../../battle/common/types.ts';

/** Death, Petrify, Sleep, Silence, Darkness, Poison, Confuse, Berserk, Curse, Eject, Doom, Delay, Interrupt. */
export const STANDARD_AILMENT_IMMUNITY: StatusImmunities = {
  ko: 255,
  petrify: 255,
  sleep: 255,
  silence: 255,
  darkness: 255,
  poison: 255,
  confuse: 255,
  berserk: 255,
  curse: 255,
  eject: 255,
  doom: 255,
  'delay-effect': 255,
  'action-cancel': 255,
};

/** Str/Mag/Acc/Eva/Luck Up AND Down, 255 each. */
export const STAT_MOD_IMMUNITY_5: StatusImmunities = {
  'str-up': 255,
  'str-down': 255,
  'mag-up': 255,
  'mag-down': 255,
  'accu-up': 255,
  'accu-down': 255,
  'eva-up': 255,
  'eva-down': 255,
  'luck-up': 255,
  'luck-down': 255,
};

/** Def/MDef Up AND Down, 255 each — i.e. Armor Break and Mental Break do NOT land. */
export const DEF_MDEF_MOD_IMMUNITY: StatusImmunities = {
  'def-up': 255,
  'def-down': 255,
  'mdef-up': 255,
  'mdef-down': 255,
};

/** Just MDef Up/Down, 255 each (Mental Break blocked; Armor Break still lands). */
export const MDEF_MOD_IMMUNITY: StatusImmunities = { 'mdef-up': 255, 'mdef-down': 255 };

/** Just Def Up/Down, 255 each (Armor Break blocked; Mental Break still lands). */
export const DEF_MOD_IMMUNITY: StatusImmunities = { 'def-up': 255, 'def-down': 255 };
