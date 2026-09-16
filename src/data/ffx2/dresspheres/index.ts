/**
 * FFX-2 dressphere registry — every standard dressphere's growth curve and
 * ability ladder, keyed by id, plus the special-dressphere registry.
 * Consumed by `src/data/ffx2/index.ts` and by the FFX-2 engine to derive a
 * `StatBlock` from `(dressphere, level, [character])` per
 * `ffx2-combat-core.md` §5.1.
 */

import type { StandardDressphereId } from '../ids.ts';
import type { DressphereDef } from './types.ts';

import { gunner } from './gunner.ts';
import { thief } from './thief.ts';
import { warrior } from './warrior.ts';
import { songstress } from './songstress.ts';
import { whiteMage } from './white-mage.ts';
import { blackMage } from './black-mage.ts';
import { gunMage } from './gun-mage.ts';
import { darkKnight } from './dark-knight.ts';
import { samurai } from './samurai.ts';
import { berserker } from './berserker.ts';
import { alchemist } from './alchemist.ts';
import { ladyLuck } from './lady-luck.ts';
import { trainer } from './trainer.ts';
import { mascot } from './mascot.ts';

/** Every standard dressphere this project defines. `psychic` / `festivalist` are International-only and out of scope. */
export const STANDARD_DRESSPHERES: Partial<Record<StandardDressphereId, DressphereDef>> = {
  gunner,
  thief,
  warrior,
  songstress,
  'white-mage': whiteMage,
  'black-mage': blackMage,
  'gun-mage': gunMage,
  'dark-knight': darkKnight,
  samurai,
  berserker,
  alchemist,
  'lady-luck': ladyLuck,
  trainer,
  mascot,
};

export {
  gunner,
  thief,
  warrior,
  songstress,
  whiteMage,
  blackMage,
  gunMage,
  darkKnight,
  samurai,
  berserker,
  alchemist,
  ladyLuck,
  trainer,
  mascot,
};

export type { DressphereDef, DressphereAbilityEntry } from './types.ts';
export * from './growth.ts';
export * from './special/index.ts';

export default STANDARD_DRESSPHERES;
