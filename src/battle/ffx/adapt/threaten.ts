/**
 * The Threaten link, released the way the game releases it (re-parity W2; **FFX only**).
 *
 * A Threaten that lands makes a PAIR in the game: the target's permanent word gets the Threaten bit and `Chr+0x5c5` names
 * the user; the write-back of the hit record then gives the USER the bit as well and sets the user's `Chr+0x5c6` to the
 * target, so both ends carry the bit and name each other (`research/re-ffx-ctb-status.md` section 14.3). The engine keeps
 * the target's `threaten` status with the user's id in `StatusInstance.sourceId` and nothing on the user; this module
 * builds the pair the kernels read from that, runs `kernel/turn-ticks.ts#releaseThreaten` (VA 0x0078e410) and removes the
 * target's status when the kernel dissolves the pair.
 *
 * Who calls it: the start-of-turn tick (`./ticks.ts`) releases the pair at the start of whichever end's turn comes first;
 * the death handler (`hp.ts#koActor`) and the function that takes a character off the field (`hp.ts#ejectActor`,
 * `aeons.ts#dismissAeon`) release it for the character that dies or leaves. Nothing else ever ends a Threaten: it has no
 * counter. A party that is summoned away does not release it (the exe's call for that was not traced); the target then
 * simply meets the release at its own turn start, which comes right after the user's.
 */

import type { FFXCombatant } from '../../common/types.ts';
import { PermBit } from '../kernel/status-types.ts';
import { NO_PARTNER, type TickChr, releaseThreaten } from '../kernel/turn-ticks.ts';
import { removeStatus } from '../statuses.ts';
import { type Ctx, allCombatants, statusOf, tryActor } from '../state.ts';
import { SLOT_COUNT, combatantAtSlot, slotOf } from './slots.ts';

/** The pair(s) of the field written onto the 31 character slots: the target and the user both carry the bit and name each other. */
export function overlayThreaten(ctx: Ctx, chrs: TickChr[]): TickChr[] {
  for (const target of allCombatants(ctx)) {
    const inst = statusOf(target, 'threaten');
    if (!inst) continue;
    const targetSlot = slotOf(ctx, target);
    const user = inst.sourceId === undefined ? undefined : tryActor(ctx, inst.sourceId);
    const row = chrs[targetSlot] as TickChr;
    row.perm |= PermBit.Threaten;
    if (!user) continue;
    const userSlot = slotOf(ctx, user);
    row.threatenedBy = userSlot;
    const userRow = chrs[userSlot] as TickChr;
    userRow.perm |= PermBit.Threaten;
    userRow.threatening = targetSlot;
  }
  return chrs;
}

/** Remove the `threaten` status of every combatant whose Threaten bit the kernel cleared. */
export function applyThreatenRelease(ctx: Ctx, before: readonly TickChr[], after: readonly TickChr[]): void {
  for (let slot = 0; slot < SLOT_COUNT; slot++) {
    const had = ((before[slot] as TickChr).perm & PermBit.Threaten) !== 0;
    const has = ((after[slot] as TickChr).perm & PermBit.Threaten) !== 0;
    if (!had || has) continue;
    const c = combatantAtSlot(ctx, slot);
    if (c && statusOf(c, 'threaten')) removeStatus(ctx, c, 'threaten', 'expired');
  }
}

/** A character slot nobody stands in: not in the battle, nothing on it, no Threaten partner. */
export function emptyTickChr(): TickChr {
  return {
    inBattle: false,
    dead: false,
    petrified: false,
    silent: false,
    reentered: false,
    hp: 0,
    maxHp: 0,
    perm: 0,
    counters: new Array<number>(13).fill(0),
    extra: 0,
    autoExtra: 0,
    tickCounter: 0,
    threatenedBy: NO_PARTNER,
    threatening: NO_PARTNER,
    doomCounter: 0,
    poisonPercent: 0,
  };
}

/** A field of 31 empty character slots for the link functions (they read the permanent word and the two link bytes only). */
function emptyField(): TickChr[] {
  return Array.from({ length: SLOT_COUNT }, emptyTickChr);
}

/**
 * `FUN_0078e410` for a character that dies or leaves the field: dissolve the pair it is an end of, so the other end is no
 * longer Threatened (or, when the dying character was the Threatened one, so its user carries nothing). A no-op for a
 * character with no Threaten on it and none it gave.
 */
export function releaseThreatenLink(ctx: Ctx, c: FFXCombatant): void {
  const gave = allCombatants(ctx).some((t) => statusOf(t, 'threaten')?.sourceId === c.id);
  if (!gave && !statusOf(c, 'threaten')) return;
  const before = overlayThreaten(ctx, emptyField());
  const after = releaseThreaten(before, slotOf(ctx, c));
  applyThreatenRelease(ctx, before, after);
}
