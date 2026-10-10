/**
 * The shapes and small helpers the FFX per-turn tick kernels share (`./turn-ticks.ts`, `./turn-ticks-link.ts`).
 *
 * **Game case: FFX only.** Source: FFX.exe, Steam build 25501027, SHA-256 0537B2A1...686D. Spec:
 * `research/re-ffx-ctb-status.md` section 14. Split out of `turn-ticks.ts` (re-parity W2) when that file passed the
 * 400-line house limit; `turn-ticks.ts` re-exports everything here, so every importer is unchanged.
 *
 * Notation: `Chr+0xNNN` is an offset into the battle character structure (stride 0xF90, ids 0..0x1e). A slot is a
 * character id. The thirteen temporal counters are `Chr+0x608..0x614` in the order of `TemporalSlot`.
 */

/** Behaviour bits of the temporal table (byte 3 of each 4-byte record, VA 0x00c42464). */
export const TICK_AT_START = 0x01;
export const EVENT_AT_START = 0x02;
export const TICK_AT_END = 0x04;
export const EVENT_AT_END = 0x08;

/** Permanent-word bits the tick functions read. */
export const PERM_ZOMBIE = 0x0002;
export const PERM_POISON = 0x0008;
export const PERM_THREATEN = 0x0800;

/** Extra-word bits the stance clear and Doom read. */
export const EXTRA_SHIELD = 0x0040;
export const EXTRA_BOOST = 0x0080;
export const EXTRA_DEFEND = 0x0800;
export const EXTRA_GUARD = 0x1000;
export const EXTRA_SENTINEL = 0x2000;
export const EXTRA_DOOM = 0x4000;

/** The number of character slots the exe walks (ids 0..0x1e) and the "no partner" byte of a Threaten link. */
export const TICK_SLOTS = 31;
export const NO_PARTNER = 0xff;

/** The command the Doom countdown queues when it runs out: the Doom kill, record 0x3120 (VA 0x00ff3120). */
export const DOOM_KILL_COMMAND = 0x3120;

/** One character as the tick functions read and write it. Offsets are `Chr+...`. */
export interface TickChr {
  /** 0xdc8: on the field. */
  inBattle: boolean;
  /** 0xdcc: dead (the death handler has run). */
  dead: boolean;
  /** 0xdce: Petrified, as of the last time a hit record was copied back (`perm >> 2 & 1`). */
  petrified: boolean;
  /** 0xdcb: the silent flag that stops the status-tick event (set while a character is leaving or arriving). */
  silent: boolean;
  /** 0x716: the turn is being re-entered (a refused command or a hand-off); the start-of-turn tick is skipped. */
  reentered: boolean;
  /** 0x5d0 (s32) and 0x594 (s32). */
  hp: number;
  maxHp: number;
  /** 0x606 (u16): permanent statuses. */
  perm: number;
  /** 0x608..0x614: the thirteen temporal counters. */
  counters: number[];
  /** 0x616 (u16): extra statuses; 0x62e (u16): the extra statuses given by equipment. */
  extra: number;
  autoExtra: number;
  /** 0x6d2: ticks since the last Regen payout (saturates at 255). */
  tickCounter: number;
  /** 0x5c5: who threatened this character (0xff none); 0x5c6: whom this character threatened (0xff none). */
  threatenedBy: number;
  threatening: number;
  /** 0x5c8: the Doom countdown. */
  doomCounter: number;
  /** 0x5ba: the Poison tick percentage of maximum HP. */
  poisonPercent: number;
}

export function cloneTickChr(c: TickChr): TickChr {
  return { ...c, counters: c.counters.slice() };
}

export const byte = (v: number): number => v & 0xff;

/** `pp_Clamp(v, 0, hi)` as the exe writes it: raise to 0 first, then lower to `hi` (so `hi` wins when it is below 0). */
function clampHp(v: number, hi: number): number {
  let x = v | 0;
  if (x < 0) x = 0;
  if (hi < x) x = hi;
  return x;
}

/** `pp_BtlSubHp`'s hit-point part: `HP = clamp(HP - amount, 0, maxHP)` in 32-bit arithmetic. */
export function subHp(hp: number, amount: number, maxHp: number): number {
  return clampHp((hp - amount) | 0, maxHp | 0);
}

export function checkSlot(slot: number): void {
  if (!Number.isInteger(slot) || slot < 0 || slot >= TICK_SLOTS) throw new RangeError(`FFX tick kernel: slot ${slot} is outside 0..${TICK_SLOTS - 1}`);
}
