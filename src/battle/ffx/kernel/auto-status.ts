/**
 * FFX equipment auto-statuses and SOS statuses: apply, restore, the SOS toggle and the per-action sweep (VA 0x0079b290, 0x0079b1a0,
 * 0x007af260, 0x007af4b0) and the weak level of an HP pair (VA 0x0078bf00).
 *
 * **Game case: FFX only.** Source: FFX.exe, Steam build 25501027, SHA-256 0537B2A1...686D, proven in `FFX-G02` sections 3.3 and 3.4 (the real
 * functions run in an x86-32 emulator: apply and restore 4,000 vectors each, the toggle 6,000, the sweep 3,000 over all 31 characters, the weak
 * level over a 3,167-point grid; 0 mismatches). Pure and deterministic. The words the gear gives come from `./gear.ts`.
 *
 * What the game keeps per character, as this module's {@link AutoChr} (the offsets are the game's `Chr` fields):
 *
 * - the live statuses: the permanent word (`+0x606`, one bit per status 0 to 11), the thirteen temporal counters (`+0x608` to `+0x614`: Sleep,
 *   Silence, Darkness, Shell, Protect, Reflect, Nul-Tide, Nul-Blaze, Nul-Shock, Nul-Frost, Regen, Haste, Slow) and the extra-status word (`+0x616`);
 * - what the gear gives: the *equipment* trio (`+0x630`, `+0x632`, `+0x634`: permanent bits, counter bits, extra bits that are on while the gear is
 *   worn), the *SOS* trio (`+0x636`, `+0x638`, `+0x63a`: the same, but only while the weak level is 1 or 2), the SOS flag (`+0x63c`, set when any worn
 *   ability is an SOS one);
 * - the bookkeeping of the last apply: the *live* trio (`+0x62a`, `+0x62c`, `+0x62e`: the words the last apply used), the backups of what the apply
 *   overwrote (`+0x618` one bit per permanent status, `+0x61a` to `+0x626` one byte per counter, `+0x628` one bit per extra status), the weak level
 *   the apply was made for (`+0x63f`), and the Regen tick counter (`+0x6d2`, ticks since the last Regen payout).
 *
 * **Apply** copies the equipment trio into the live trio (and ORs the SOS trio in while the weak level, `+0x63e`, is 1 or 2), remembers that level, and
 * for every bit of the live words saves the old status and forces it on (a counter becomes 255, "until removed"). Two side effects: a Haste that
 * went from 0 to non-zero clears a Slow in progress (unless the Slow counter is 255), and a Regen that went from 0 to non-zero restarts the Regen
 * tick counter. **Restore** puts the saved value back for every bit of the live words; it does not clear the live words. So a restore followed by
 * an apply at the same level is not a no-op: restore puts back the 0 an equipment-only Regen or Haste had, and the apply sees them go from 0 to
 * non-zero again. **The toggle** (one character) and **the sweep** (all 31, at the end of every action) do restore-then-apply for a character with
 * the SOS flag whose weak level differs from the level it was last applied for.
 */

/** The weak level of an HP pair: 3 below 1 HP; otherwise by `trunc(4 * HP / max)`: 2 below 1, 1 below 2, else 0 (so 1 or 2 means "under half"). */
export function weakLevel(hp: number, max: number): number {
  const iv = max !== 0 ? Math.trunc(Math.imul(hp | 0, 4) / (max | 0)) : 0;
  if ((hp | 0) < 1) return 3;
  if (iv < 1) return 2;
  if (iv < 2) return 1;
  return 0;
}

export const TEMPORAL_COUNT = 13;
const PERM_BITS = 12;
const EXTRA_BITS = 16;

export type Trio = readonly [number, number, number];

/** What the game keeps of a character's auto-status machinery (see the header). */
export interface AutoChr {
  perm: number;
  counters: readonly number[];
  extra: number;
  bkPerm: number;
  bkCounters: readonly number[];
  bkExtra: number;
  live: Trio;
  equip: Trio;
  sos: Trio;
  sosFlag: number;
  weak: number;
  applied: number;
  regenTicks: number;
}

/** The part of {@link AutoChr} that is the machinery's own memory (the rest is read off the character each time). */
export type AutoState = Pick<AutoChr, 'live' | 'equip' | 'sos' | 'sosFlag' | 'bkPerm' | 'bkCounters' | 'bkExtra' | 'applied'>;

/** A character that has never been applied: nothing live, nothing saved. */
export function freshAutoState(equip: Trio, sos: Trio, sosFlag: number): AutoState {
  return { live: [0, 0, 0], equip, sos, sosFlag, bkPerm: 0, bkCounters: new Array<number>(TEMPORAL_COUNT).fill(0), bkExtra: 0, applied: 0 };
}

function copy(c: AutoChr): AutoChr {
  return { ...c, counters: [...c.counters], bkCounters: [...c.bkCounters] };
}

/** `0x79b290`: apply the equipment statuses (and the SOS ones while the weak level is 1 or 2). The input is not modified. */
export function applyAuto(chr: AutoChr): AutoChr {
  const c = copy(chr);
  const oldRegen = c.counters[10] as number;
  const oldHaste = c.counters[11] as number;
  const weak = c.weak;
  const sosOn = weak === 1 || weak === 2;
  c.live = [
    (sosOn ? c.sos[0] | c.equip[0] : c.equip[0]) & 0xffff,
    (sosOn ? c.sos[1] | c.equip[1] : c.equip[1]) & 0xffff,
    (sosOn ? c.sos[2] | c.equip[2] : c.equip[2]) & 0xffff,
  ];
  c.applied = weak;
  const counters = c.counters as number[];
  const bkCounters = c.bkCounters as number[];
  for (let i = 0; i < PERM_BITS; i++) {
    const bit = 1 << i;
    if ((c.live[0] & bit) === 0) continue;
    c.bkPerm = (~bit & c.bkPerm) | (bit & c.perm);
    c.perm |= bit;
  }
  for (let i = 0; i < TEMPORAL_COUNT; i++) {
    if (((c.live[1] >> i) & 1) === 0) continue;
    bkCounters[i] = counters[i] as number;
    counters[i] = 0xff;
  }
  if (oldHaste === 0 && counters[11] !== 0 && counters[12] !== 0xff) counters[12] = 0;
  for (let i = 0; i < EXTRA_BITS; i++) {
    const bit = 1 << i;
    if ((c.live[2] & bit) === 0) continue;
    c.bkExtra = (~bit & c.bkExtra) | (bit & c.extra);
    c.extra |= bit;
  }
  if (counters[10] !== 0 && oldRegen === 0) c.regenTicks = 0;
  return c;
}

/** `0x79b1a0`: put back what the last apply overwrote, for every bit of the live words. The input is not modified. */
export function restoreAuto(chr: AutoChr): AutoChr {
  const c = copy(chr);
  const counters = c.counters as number[];
  for (let i = 0; i < PERM_BITS; i++) {
    const bit = 1 << i;
    if ((c.live[0] & bit) !== 0) c.perm = (~bit & c.perm) | (bit & c.bkPerm);
  }
  for (let i = 0; i < TEMPORAL_COUNT; i++) if (((c.live[1] >> i) & 1) !== 0) counters[i] = c.bkCounters[i] as number;
  for (let i = 0; i < EXTRA_BITS; i++) {
    const bit = 1 << i;
    if ((c.live[2] & bit) !== 0) c.extra = (~bit & c.extra) | (bit & c.bkExtra);
  }
  return c;
}

/** Restore, then apply: how a change of level, a revive and a Petrify that ends are handled. */
export function reapplyAuto(chr: AutoChr): AutoChr {
  return applyAuto(restoreAuto(chr));
}

/** `0x7af260`: the toggle for one character. It acts when the SOS flag is set and the weak level is not the level the statuses were applied for. */
export function sosToggle(chr: AutoChr): { chr: AutoChr; toggled: boolean } {
  if (chr.sosFlag !== 0 && chr.weak !== chr.applied) return { chr: reapplyAuto(chr), toggled: true };
  return { chr, toggled: false };
}

/** `0x7af4b0`: the toggle for every character, in slot order. Returns how many toggled. */
export function sosSweep(chrs: readonly AutoChr[]): { chrs: AutoChr[]; toggled: number } {
  let toggled = 0;
  const out = chrs.map((c) => {
    const r = sosToggle(c);
    if (r.toggled) toggled += 1;
    return r.chr;
  });
  return { chrs: out, toggled };
}
