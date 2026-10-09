/**
 * The Threaten link: both ends of a Threaten carry the bit and name each other (`fh_MsThreatProcess`, VA 0x0078e460),
 * and a pair is dissolved by `FUN_0078e410` (VA 0x0078e410).
 *
 * **Game case: FFX only.** Source: FFX.exe, Steam build 25501027, SHA-256 0537B2A1...686D. Spec:
 * `research/re-ffx-ctb-status.md` section 14.3. Split out of `turn-ticks.ts` (re-parity W2) when that file passed the
 * 400-line house limit; `turn-ticks.ts` re-exports both functions, so every importer is unchanged. Pure.
 */

import { NO_PARTNER, PERM_THREATEN, type TickChr, checkSlot, cloneTickChr } from './turn-ticks-types.ts';

/**
 * `fh_MsThreatProcess` (0x0078e460, Fahrenheit's name) for the character `id`, called with the link already changed.
 *
 * - With the character's Threaten bit SET (a Threaten has just landed on it): `Chr+0x5c5` names the user. The user
 *   gets the Threaten bit as well and `Chr+0x5c6` := this character, so both ends of the pair carry the bit and name
 *   each other. A user byte of 0xff makes no link.
 * - With the bit CLEAR (it has been cleared): the partner is `Chr+0x5c5`, or `Chr+0x5c6` when that is 0xff. This
 *   character's two link bytes become 0xff; the partner, when there is one, loses its Threaten bit and its two link
 *   bytes as well.
 *
 * The id bytes are character ids 0..0x1e or 0xff; the exe would index memory outside the character array for any
 * other byte, which the game never writes, so a byte outside that range is refused. The input is not modified.
 */
export function threatProcess(chrs: readonly TickChr[], id: number): TickChr[] {
  checkSlot(id);
  const out = chrs.map(cloneTickChr);
  const me = out[id] as TickChr;
  let partnerId = me.threatenedBy & 0xff;
  if ((me.perm & PERM_THREATEN) !== 0) {
    if (partnerId !== NO_PARTNER) {
      checkSlot(partnerId);
      const partner = out[partnerId] as TickChr;
      partner.perm = (partner.perm | PERM_THREATEN) & 0xffff;
      partner.threatening = id;
    }
    return out;
  }
  if (partnerId === NO_PARTNER) partnerId = me.threatening & 0xff;
  me.threatenedBy = NO_PARTNER;
  me.threatening = NO_PARTNER;
  if (partnerId !== NO_PARTNER) {
    checkSlot(partnerId);
    const partner = out[partnerId] as TickChr;
    partner.perm = partner.perm & ~PERM_THREATEN & 0xffff;
    partner.threatenedBy = NO_PARTNER;
    partner.threatening = NO_PARTNER;
  }
  return out;
}

/**
 * `FUN_0078e410` (0x0078e410): release the Threaten link a character is part of. A character with the Threaten bit
 * and a recorded "I threatened" partner (`Chr+0x5c6`) is the USER of a pair; one with the bit and no such partner is
 * the TARGET. In both cases the bit leaves BOTH ends and both link bytes are reset; a character without the bit
 * changes nothing. It runs at the end of every start-of-turn tick, so a pair is dissolved at the start of whichever
 * end's turn comes first, and the death handler and the leave-the-field function run it for the character that dies
 * or leaves.
 */
export function releaseThreaten(chrs: readonly TickChr[], id: number): TickChr[] {
  checkSlot(id);
  const me = chrs[id] as TickChr;
  if ((me.perm & PERM_THREATEN) === 0) return chrs.map(cloneTickChr);
  const partnerId = me.threatening & 0xff;
  const at = partnerId !== NO_PARTNER ? partnerId : id;
  checkSlot(at);
  const next = chrs.map(cloneTickChr);
  const cleared = next[at] as TickChr;
  cleared.perm = cleared.perm & ~PERM_THREATEN & 0xffff;
  return threatProcess(next, at);
}
