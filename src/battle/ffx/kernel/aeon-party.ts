/**
 * FFX aeon kernel, part 2: who is in the battle while an aeon is out. Summoning an aeon, the arrival step, dismissing it,
 * the aeon wipe and the recovery counter that keeps a fallen aeon away, and the Switch swap they all share.
 *
 * **Game case: FFX only** (FFX-2 has no aeons in this sense). Source: FFX.exe, Steam build 25501027, SHA-256
 * 0537B2A1...686D. Spec: `research/re-ffx-overdrive-steal-aeons.md` section 4. Pure, deterministic, not wired into the
 * engine. The functions change a {@link PartyWorld} in place, the way the game changes its globals and character
 * structures, and the machine-code vectors in `tests/fixtures/parity/ffx/aeon_party.json` check every byte listed here.
 *
 * | Function here | VA | What the game calls it |
 * |---|---|---|
 * | {@link swapMember} | 0x007adae0 | the Switch command (0x3002), the summon, and the return of the party |
 * | {@link summon} | 0x007adf90 | the Summon commands 0x3117 and 0x3118 and the Magus Sisters command 0x30ff |
 * | {@link swapLists} | 0x007ade10 | the arrival action's first step (and, once, the end of `summon`) |
 * | {@link dismiss} | 0x007aef20 | the Dismiss commands 0x3056 and 0x3057 (with the revive of a fallen member), and the aeon leaving after the wipe (without it) |
 * | {@link restoreLists} | 0x007aeec0 | `dismiss`, and the end-of-battle save |
 * | {@link returnParty} | 0x007adf10 | `dismiss` |
 * | {@link aeonWipe} | 0x0078e0a0 | the battle-end state when every aeon out is down |
 * | {@link aeonUnavailable} | 0x0079a080 | the summon menu |
 *
 * What it adds up to. A character takes turns, ticks its counters and counts as being in the fight only while its
 * `inBattle` byte (`Chr+0xdc8`) is set. A summon is two steps. {@link summon} parks the party's lists and bytes and ends by
 * queueing the arrival action, which leaves the party's own bytes in force; the arrival action's start ({@link startArrival})
 * is what clears that byte for the summoner and everybody else in the active party list and sets it for the aeon (for all
 * three Magus Sisters, whichever one was asked for). The party is not removed from the fight, it is parked: its counters,
 * statuses and HP stay exactly as they were, frozen, until the aeon leaves and the lists come back. The aeon's own counter
 * becomes 0 inside {@link swapMember} (it acts next); the summoner keeps the recovery she was charged for the Summon.
 *
 * Presentation-only effects (models, animation records, event starts, the queue of the arrival action) are left out; the
 * summon code is run in the vectors with those calls replaced by recorders and the action queue empty.
 */

/** Who may be an aeon: slots 8 to 0x11. The Magus Sisters are 0xf, 0x10 and 0x11. */
export const MAGUS_SISTERS = [0xf, 0x10, 0x11] as const;

/** The bytes of one character structure the transitions read or write (offsets into the 0xf90-byte `Chr`). */
export interface PartyChr {
  /** `Chr+0x10`: the character exists in this battle. */
  present: number;
  /** `Chr+0xdc8`: in the battle (takes turns, ticks, is a target). */
  dc8: number;
  /** `Chr+0xdc9`: the saved copy of `dc8` that the summon parks the party's flags in. */
  dc9: number;
  /** `Chr+0xdf8`: has left the field during the action in progress (no poison tick for it at the end of the action). */
  df8: number;
  /** `Chr+0xdcb`: a summoner who is away (its status-expiry messages are not shown). */
  dcb: number;
  /** `Chr+0x1a`: presentation byte kept with `dcb`. */
  f1a: number;
  /** `Chr+0x6d1`: who summoned this aeon. */
  summoner: number;
  /** `Chr+0x3d`: set on a member that comes back (arrival animation). */
  arrival: number;
  /** `Chr+0xdcd`: removed from the battle for good (fled); a swap cannot bring it back. */
  blocked: number;
  /** `Chr+0xdcc`: dead. */
  dead: number;
  /** `Chr+0xdce`: Petrified. */
  stoned: number;
  /** `Chr+0x5d0` (signed): current HP. */
  hp: number;
  /** `Chr+0x65c`: the CTB counter. */
  ctb: number;
  /** `Chr+0x65d`: the base counter a revive resets to. */
  baseCtb: number;
  /** `Chr+0x606` (u16): permanent statuses (bit 0 Death, bit 10 Provoke, bit 11 Threaten). */
  perm: number;
  /** `Chr+0x5c4`: who provoked this character. */
  provoker: number;
  /** `Chr+0x5c5`, `Chr+0x5c6`: the two ends of a Threaten link. */
  thrA: number;
  thrB: number;
  /** Overdrive gauge `Chr+0x5bc`, its maximum `+0x5bd`, the gauge saved by a Grand Summon `+0x5be` and its flag `+0x5bf`. */
  gauge: number;
  gaugeMax: number;
  gaugeSaved: number;
  gaugeHeld: number;
  /** `Chr+0x6d8`: battles an aeon stays away after a wipe; `Chr+0x6d9`: the value it is reloaded from (`ply_rom` +0x2b). */
  recover: number;
  recoverMax: number;
  /** `Chr+0xdd4`: the character can be summoned at all. */
  avail: number;
}

export interface PartyWorld {
  /** VA 0x0112c895, 7 ids, 0xff = empty: the characters in the fight. */
  active: number[];
  /** VA 0x0112c89c, 7 ids: the party list parked by a summon. */
  saved: number[];
  /** VA 0x0112c8a3, 17 ids: the party order table. */
  roster: number[];
  /** VA 0x0112c8b4, 17 ids: its parked copy. */
  rosterSaved: number[];
  /** VA 0x0112c9e7 / 9e8 / 9e9: an aeon is out; which; who summoned it (0xff none). */
  summonActive: number;
  aeonId: number;
  summonerId: number;
  /** VA 0x0112ca03: the action in progress is Grand Summon. */
  grandSummon: number;
  /** VA 0x0112c9e4: the character whose poison tick is due (0xff none). */
  actor: number;
  /** VA 0x0112c90c: bit per character, cleared when it is revived. */
  deadMask: number;
  /** VA 0x02310ea0, one byte per party and aeon slot: counted as in the battle for the rewards. */
  reward: number[];
  /** Character structures by id (party and aeons 0 to 0x11, monsters 0x14 to 0x1b). */
  chr: Record<number, PartyChr>;
}

const chrOf = (w: PartyWorld, id: number): PartyChr => w.chr[id] as PartyChr;

/** `FUN_0078d4e0(id)`: everybody provoked by `id` stops being provoked. */
function releaseProvoked(w: PartyWorld, id: number): void {
  for (const c of Object.values(w.chr)) if ((c.perm & 0x400) !== 0 && c.provoker === id) c.perm &= 0xfbff;
}

/**
 * `FUN_0078e410(id)` with `FUN_0078e460`: a leaver that holds a Threaten link breaks it. The Threaten bit goes from the
 * character at the other end (its `Chr+0x5c6`; itself when that is 0xff), both link bytes are cleared, and so is the
 * far end's bit and link.
 */
function releaseThreaten(w: PartyWorld, id: number): void {
  const leaver = chrOf(w, id);
  if ((leaver.perm & 0x800) === 0) return;
  let target = leaver;
  if (leaver.thrB !== 0xff) target = chrOf(w, leaver.thrB);
  target.perm &= 0xf7ff;
  let far = target.thrA;
  if (far === 0xff) far = target.thrB;
  target.thrA = 0xff;
  target.thrB = 0xff;
  if (far !== 0xff) {
    const f = chrOf(w, far);
    f.perm &= 0xf7ff;
    f.thrA = 0xff;
    f.thrB = 0xff;
  }
}

/** `FUN_007b06e0(chr)`: an aeon that arrives by Grand Summon starts with its gauge full; the old value is kept for later. */
function holdGauge(w: PartyWorld, c: PartyChr): void {
  if (w.grandSummon === 0) return;
  c.gaugeSaved = c.gauge;
  c.gauge = c.gaugeMax;
  c.gaugeHeld = 1;
}

/** `FUN_007b06b0(chr)`: put a held gauge back. */
function restoreGauge(c: PartyChr): void {
  if (c.gaugeHeld === 0) return;
  c.gaugeHeld = 0;
  c.gauge = c.gaugeSaved;
}

/**
 * `FUN_007adae0(out, in, mode)`: `out` leaves the fight and `in` takes its place. `mode` 0 is the Switch command, 1 a
 * summon (the aeon arrives, the summoner is marked as away), -1 the return of a summoner. Either id may be 0xff (nobody).
 *
 * Leaving (when `out` exists): unless it was removed for good it is no longer in the battle and is flagged as having
 * left, whoever it provoked is released, a Threaten link of its own is broken, and on a summon the aeon and summoner ids
 * are recorded. The first entry of the active list that names `out` now names `in`, and the first entry of the party
 * order table that names `in` now names `out`.
 *
 * Arriving (when `in` exists and is not removed): it is in the battle; the Switch and the return count it for the
 * rewards (a returning non-summoner is also flagged as arrived, the summoner is no longer away), a summon holds its
 * gauge for Grand Summon. If `out` exists and the mode is not -1, the arrival is queued and `in` gets counter 0, so it
 * acts next; a Switch also zeroes it when `out` exists (the same value).
 */
export function swapMember(w: PartyWorld, out: number, inn: number, mode: number): void {
  const outChr = out !== 0xff && chrOf(w, out).present !== 0 ? chrOf(w, out) : null;
  if (outChr !== null) {
    if (outChr.blocked === 0) {
      outChr.dc8 = 0;
      outChr.df8 = 1;
      releaseProvoked(w, out);
      releaseThreaten(w, out);
      if (mode >= 1) {
        outChr.dcb = 1;
        outChr.f1a = 1;
        w.aeonId = inn & 0xff;
        w.summonerId = out & 0xff;
      }
    }
    const k = w.active.indexOf(out);
    if (k >= 0) w.active[k] = inn & 0xff;
    const j = w.roster.indexOf(inn);
    if (j >= 0) w.roster[j] = out & 0xff;
  }
  if (inn === 0xff || chrOf(w, inn).present === 0) return;
  const inChr = chrOf(w, inn);
  if (inChr.blocked === 0) {
    if (mode < 1 && outChr !== null) inChr.ctb = 0;
    inChr.dc8 = 1;
    inChr.df8 = 0;
    if (mode < 1) {
      if (inn < w.reward.length) w.reward[inn] = 1;
      if (mode < 0) {
        inChr.dcb = 0;
        inChr.f1a = 0;
      } else {
        inChr.arrival = 1;
      }
    } else {
      holdGauge(w, inChr);
    }
  }
  if (out !== 0xff && mode >= 0) inChr.ctb = 0;
}

/**
 * `FUN_007ade10()`: park the active state and bring the parked one back: the party list, the party order table and the
 * in-battle bytes of slots 0 to 0x11 trade places with their saved copies.
 */
export function swapLists(w: PartyWorld): void {
  [w.active, w.saved] = [w.saved, w.active];
  [w.roster, w.rosterSaved] = [w.rosterSaved, w.roster];
  for (let i = 0; i < 0x12; i++) {
    const c = chrOf(w, i);
    [c.dc8, c.dc9] = [c.dc9, c.dc8];
  }
}

/**
 * `FUN_007adf90(summoner, aeon)`: the summon. Parks the party's in-battle bytes, list and order table; every member of
 * the active list except the summoner leaves; the summoner leaves and the aeon arrives (all three Magus Sisters, in list
 * positions 0 to 2, when the aeon is one of them); the aeon records who summoned it. It ends by queueing the arrival
 * action, which first swaps the active and parked states ({@link swapLists}); the arrival action's own start swaps them
 * back (that second swap is {@link startArrival}), and only then are the aeon's bytes the active ones.
 */
export function summon(w: PartyWorld, summoner: number, aeon: number): void {
  w.summonActive = 1;
  for (let i = 0; i < 0x12; i++) chrOf(w, i).dc9 = chrOf(w, i).dc8;
  w.rosterSaved = w.roster.slice();
  for (let k = 0; k < 7; k++) {
    const id = w.active[k] as number;
    w.saved[k] = id;
    if (id !== summoner && id !== 0xff) swapMember(w, id, 0xff, 0);
  }
  chrOf(w, aeon).summoner = summoner & 0xff;
  if (aeon === 0xf || aeon === 0x10 || aeon === 0x11) {
    swapMember(w, summoner, aeon, 1);
    for (const id of MAGUS_SISTERS) {
      w.active[id - 0xf] = id;
      if (id !== aeon) {
        chrOf(w, id).summoner = summoner & 0xff;
        swapMember(w, 0xff, id, 1);
      }
    }
  } else {
    swapMember(w, summoner, aeon, 1);
  }
  swapLists(w);
}

/** The arrival action's start (`Chr+0xdea` = 1 in the command state machine at 0x00788480): the same swap again. */
export const startArrival = swapLists;

/** `FUN_007aeec0()`: when an aeon is out, the parked party list and order table are put back. */
export function restoreLists(w: PartyWorld): void {
  if (w.summonActive === 0) return;
  w.summonActive = 0;
  w.active = w.saved.slice();
  w.roster = w.rosterSaved.slice();
}

/**
 * `FUN_007adf10()`: every member of the (restored) active list comes back into the battle: the summoner as a return
 * (mode -1), everybody else as a swap-in with no one leaving (mode 0).
 */
export function returnParty(w: PartyWorld): void {
  for (let k = 0; k < 7; k++) {
    const id = w.active[k] as number;
    if (id !== 0xff) swapMember(w, 0xff, id, (id !== w.summonerId ? 1 : 0) - 1);
  }
}

/**
 * `pp_BtlReviveChr(id, chr, 0)` as far as the transitions see it: HP at least 1, Death cleared, the dead, removed and
 * Petrified bytes cleared, the character is back in the battle, its counter is its base value, its bit leaves the
 * dead mask.
 */
function revive(w: PartyWorld, id: number, c: PartyChr): void {
  if (c.hp < 1) c.hp = 1;
  c.perm &= 0xfffe;
  c.dead = 0;
  c.blocked = 0;
  c.stoned = 0;
  w.deadMask = (w.deadMask & ~(1 << (id & 31))) >>> 0;
  c.dc8 = 1;
  c.ctb = c.baseCtb;
}

/**
 * `FUN_007aef20(revive)`: the aeon leaves. Each member of the active list gets its held gauge back, is revived when `reviveFallen`
 * is set and its HP is below 1 (a Magus Sister who fell while another did not), and leaves the battle; then the parked lists come
 * back and the party returns. Nothing happens when no aeon is out (`aeonId` 0). Afterwards no aeon and no summoner are recorded.
 */
export function dismiss(w: PartyWorld, reviveFallen: number): void {
  if (w.aeonId === 0) return;
  for (let k = 0; k < 7; k++) {
    const id = w.active[k] as number;
    if (id === 0xff) continue;
    const c = chrOf(w, id);
    restoreGauge(c);
    if (reviveFallen !== 0 && c.hp < 1) revive(w, id, c);
    c.dc8 = 0;
    if (w.actor === id) w.actor = 0xff;
  }
  restoreLists(w);
  returnParty(w);
  w.aeonId = 0;
  w.summonerId = 0xff;
}

/**
 * `FUN_0078e0a0()`, run by the battle-end state when every aeon out is down: each member of the active
 * list is at 0 HP and starts its recovery counter, one more than the value its `ply_rom` record gives.
 */
export function aeonWipe(w: PartyWorld): void {
  for (let k = 0; k < 7; k++) {
    const id = w.active[k] as number;
    if (id === 0xff) continue;
    const c = chrOf(w, id);
    c.hp = 0;
    c.recover = (c.recoverMax + 1) & 0xff;
  }
}

/**
 * `FUN_0079a080(id)`: 0 when the character can be summoned (alive, available, not removed, no recovery counter left),
 * else 1.
 */
export function aeonUnavailable(c: PartyChr): number {
  return c.hp > 0 && c.avail !== 0 && c.blocked === 0 && c.recover === 0 ? 0 : 1;
}
