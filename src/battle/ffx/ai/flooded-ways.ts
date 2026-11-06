/**
 * **The hidden Flooded Ways chapter's scripts, as one import** (FFX only; number 36): Evrae Altana, the Gate Locks and Geosgaeno register their turns and hooks when this module loads (`./index.ts` imports it). The state they
 * share is `./flooded-ways-rules.ts`; the opening state is `./flooded-ways-setup.ts`; the ends are `./flooded-ways-end.ts`.
 */

import './evrae-altana.ts';
import './gate-locks.ts';
import './geosgaeno.ts';

export * from './flooded-ways-rules.ts';
export { evraeAltanaHit, evraeAltanaTurn } from './evrae-altana.ts';
export { applyOpenLock, livingLockIds, openLockAvailable, openLockOffered, openLockRows } from './gate-locks.ts';
export { geosgaenoHit, geosgaenoTurn } from './geosgaeno.ts';
export { heldMenuRows, heldRefuses, settleMaxHp } from './geosgaeno-hold.ts';
export { floodedWaysOutcome } from './flooded-ways-end.ts';
export { applyFloodedWaysSetup } from './flooded-ways-setup.ts';
