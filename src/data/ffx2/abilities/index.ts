/**
 * FFX-2 ability registry — every `AbilityDef` this project ships, keyed by id.
 *
 * Consumed by `src/data/ffx2/index.ts` for `BattleSetup` lookups and by
 * `items/effects.ts` for `ItemDef.effect` resolution. Duplicate ids across
 * the source files below are a data-authoring bug; `tests/unit/data-ffx2-*`
 * asserts the id count matches the combined array length.
 */

import type { AbilityDef, AbilityId } from '../../../battle/common/types.ts';

import { gunnerAbilities } from './gunner.ts';
import { thiefAbilities } from './thief.ts';
import { warriorAbilities } from './warrior.ts';
import { whiteMageAbilities } from './white-mage.ts';
import { blackMageAbilities } from './black-mage.ts';
import { darkKnightAbilities } from './dark-knight.ts';
import { gunMageAbilities } from './gun-mage.ts';
import { alchemistAbilities } from './alchemist.ts';
import { samuraiAbilities } from './samurai.ts';
import { berserkerAbilities } from './berserker.ts';
import { songstressAbilities } from './songstress.ts';
import { ladyLuckAbilities } from './lady-luck.ts';
import { trainerAbilities } from './trainer.ts';
import { mascotAbilities } from './mascot.ts';
import { floralFallalAbilities } from './special-floral-fallal.ts';
import { machinaMawAbilities } from './special-machina-maw.ts';
import { fullThrottleAbilities } from './special-full-throttle.ts';
import { sharedAbilities } from './shared.ts';

/** Every FFX-2 ability this project defines, standard dresspheres first. */
export const ALL_FFX2_ABILITIES: readonly AbilityDef[] = [
  ...gunnerAbilities,
  ...thiefAbilities,
  ...warriorAbilities,
  ...whiteMageAbilities,
  ...blackMageAbilities,
  ...darkKnightAbilities,
  ...gunMageAbilities,
  ...alchemistAbilities,
  ...samuraiAbilities,
  ...berserkerAbilities,
  ...songstressAbilities,
  ...ladyLuckAbilities,
  ...trainerAbilities,
  ...mascotAbilities,
  ...floralFallalAbilities,
  ...machinaMawAbilities,
  ...fullThrottleAbilities,
  ...sharedAbilities,
];

/** Lookup by id, for `BattleSetup` consumers and for `ItemDef.effect` resolution. */
export const FFX2_ABILITIES: Record<AbilityId, AbilityDef> = Object.fromEntries(
  ALL_FFX2_ABILITIES.map((a) => [a.id, a]),
);

export {
  gunnerAbilities,
  thiefAbilities,
  warriorAbilities,
  whiteMageAbilities,
  blackMageAbilities,
  darkKnightAbilities,
  gunMageAbilities,
  alchemistAbilities,
  samuraiAbilities,
  berserkerAbilities,
  songstressAbilities,
  ladyLuckAbilities,
  trainerAbilities,
  mascotAbilities,
  floralFallalAbilities,
  machinaMawAbilities,
  fullThrottleAbilities,
  sharedAbilities,
};

export default FFX2_ABILITIES;
