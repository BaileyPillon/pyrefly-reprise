/**
 * **Ronso trust**: the one setting of the hidden Garik Ronso chapter, and the fight it picks (FFX-2 only, 2026-11-07; the preflight's pick GA2, `docs/plans/ch-lionheart-review.md` section 2).
 *
 * In the game this is a saved score the Ronso conversations on the mountain raise and lower; the summit package reads it once, when it launches the fight (more than 7: the friendly bout, scene `mtgz10_229`; 7 or less: the hostile
 * fight, scene `mtgz10_228`; `research/re-ffx2-garik-ronso.md` section 1). The game has no neutral third value, so the honest build is **two values of one setting**: **low** (the hostile fight, two Ronso Youths and Garik, the
 * usual result and **the default**) or **high** (the friendly bout, one Youth and Garik). Which answer is which at each of the eight conversations, and whether the second visit starts from zero, are not read (research U1, U2): the
 * chapter offers the two outcomes, and the tooltip says what the setting follows.
 *
 * **Where it lives.** The party prep of this chapter carries a TRUST tab (`../ui/ffx2/party-prep/ronsoTrustPanel.ts`, shown for this chapter only) that sets it; it is read here at the moment the battle opens. It is kept in a key of its
 * own, never in the save (`pyrefly-reprise:save:v1`) and not in the experiments' records either: no save change, no migration. Every read and write is in try/catch (a private window or blocked storage reads as the default), and
 * the module works with no storage at all.
 *
 * The chapter record's `enemyGroupRef` is a getter over {@link garikFirstGroup}, so every reader of the record (the battle, the preload, the card) sees the group the setting names with no change to any of them; with the
 * setting untouched it is the hostile group, as the record would read if it were a plain field.
 */

import type { EnemyGroupDef } from '../battle/common/types.ts';
import { garikFriendlyGroup, garikHostileGroup } from './ffx2/enemies/garik-ronso.ts';

/** The two values. */
export type RonsoTrust = 'low' | 'high';
export const RONSO_TRUSTS: readonly RonsoTrust[] = ['low', 'high'];
/** The default: the game's usual first-time result (a first-time player must answer all eight conversations well to see the bout). */
export const RONSO_TRUST_DEFAULT: RonsoTrust = 'low';

/** The setting's own storage key: never the save, never the experiments' records. */
export const RONSO_TRUST_KEY = 'pyrefly-reprise:garik-ronso-trust:v1';

/** The words of the setting (our own), for the TRUST tab and the tests. */
export const RONSO_TRUST_TEXT = {
  label: 'Ronso trust',
  tooltip: 'In the game this follows how you answered the Ronso on Mt. Gagazet.',
  low: { name: 'Low', fight: 'The hostile fight', detail: 'Two Ronso Youths and Garik, 15,000 HP in all. Garik curses a Black Mage, blinds, and guards his whole side every seventh turn.' },
  high: { name: 'High', fight: 'The friendly bout', detail: 'One Ronso Youth and Garik, 10,940 HP in all. Garik only guards himself on a fixed beat, and the Youth only swings.' },
} as const;

/** The storage the setting reads and writes; `localStorage` by default. */
export type RonsoTrustStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

let storageOverride: RonsoTrustStorage | null | undefined;
let current: RonsoTrust | undefined;

/** Tests: point the setting at a fake storage (`null` = no storage at all), or back to `localStorage` with `undefined`; either way the remembered value is forgotten. */
export function setRonsoTrustStorageForTests(storage: RonsoTrustStorage | null | undefined): void {
  storageOverride = storage;
  current = undefined;
}

function storage(): RonsoTrustStorage | null {
  if (storageOverride !== undefined) return storageOverride;
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

function sane(value: unknown): RonsoTrust {
  return value === 'high' ? 'high' : RONSO_TRUST_DEFAULT;
}

/** The setting now: the remembered choice, else the stored one, else the default. */
export function getRonsoTrust(): RonsoTrust {
  if (current !== undefined) return current;
  let stored: unknown = null;
  try {
    stored = storage()?.getItem(RONSO_TRUST_KEY) ?? null;
  } catch {
    stored = null;
  }
  current = sane(stored);
  return current;
}

/** Set it. The default removes the key, so a player who never chose leaves nothing behind. */
export function setRonsoTrust(value: RonsoTrust): void {
  current = sane(value);
  try {
    if (current === RONSO_TRUST_DEFAULT) storage()?.removeItem(RONSO_TRUST_KEY);
    else storage()?.setItem(RONSO_TRUST_KEY, current);
  } catch {
    /* storage full or blocked: the choice holds for this visit and is not remembered */
  }
}

/** The other value. */
export function otherRonsoTrust(value: RonsoTrust): RonsoTrust {
  return value === 'low' ? 'high' : 'low';
}

/** The formation a value names. */
export function garikGroupFor(trust: RonsoTrust): EnemyGroupDef {
  return trust === 'high' ? garikFriendlyGroup : garikHostileGroup;
}

/** The chapter's first (and only) formation under the setting as it stands. */
export function garikFirstGroup(): EnemyGroupDef {
  return garikGroupFor(getRonsoTrust());
}
