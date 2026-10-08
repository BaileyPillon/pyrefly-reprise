/**
 * FFX kernels for two small rolls that sit beside the hit and crit checks: single-character Escape
 * and how a battle starts (normal, preemptive, ambush).
 *
 * **Game case: FFX only.** Source: FFX.exe, Steam build 25501027, SHA-256 0537B2A1...686D.
 * Spec: `research/re-ffx-rng-hit.md`. Pure; the draw comes from a `draw()` callback that returns the
 * raw 31-bit value the game's RNG would (see `./rng.ts`). Not wired into the engine.
 *
 * - 0x0078a780  Escape roll for one character (command 0x3003), stream: that character's mode 0
 * - 0x0078d090  battle start type, stream 1 (shared, not tied to a character)
 */

/** Result of {@link rollStartType}. */
export const StartType = { Normal: 0, Preemptive: 1, Ambush: 2 } as const;
export type StartTypeValue = (typeof StartType)[keyof typeof StartType];

/**
 * Does one character's Escape succeed (exe 0x0078a780)? The roll is always drawn first, from the
 * escaper's mode 0 stream, even when the answer is already fixed:
 *
 *     b = draw() & 0xff
 *     success = escapeFlag != 1  and  not debugNeverHit  and  (b < 0xbf  or  escapeFlag == 2)
 *
 * `escapeFlag` is the battle's escape flag (VA 0x0112c9ff, a signed byte): 1 = this battle cannot be
 * escaped, 2 = escape always works, anything else = the 191-in-256 roll. `debugNeverHit` is the debug
 * switch at VA 0x0112a91f (it also forces every attack to miss); false in normal play.
 */
export function escapeRoll(escapeFlag: number, draw: () => number, debugNeverHit = false): boolean {
  const b = draw() & 0xff;
  const flag = (escapeFlag << 24) >> 24;
  return flag !== 1 && !debugNeverHit && (b < 0xbf || flag === 2);
}

/**
 * How a battle starts (exe 0x0078d090). The caller passes `x = 0x20` (the only call site, 0x00783020):
 *
 *     r = draw() & 0xff
 *     if a party member in the battle has the Initiative auto-ability:  r = r - (x + 1)   (signed)
 *     Ambush if r >= 255 - x;  otherwise Preemptive if r < x;  otherwise Normal
 *
 * With x = 32 and no Initiative that is 32/256 preemptive and 33/256 ambush; with Initiative it is
 * 65/256 preemptive and never an ambush. The script override stored at VA 0x0112a923 is applied by the
 * caller, not here. One draw, always.
 */
export function rollStartType(x: number, hasInitiative: boolean, draw: () => number): StartTypeValue {
  let r = draw() & 0xff;
  if (hasInitiative) r = (r - (x + 1)) | 0;
  if (r >= 255 - x) return StartType.Ambush;
  return r < x ? StartType.Preemptive : StartType.Normal;
}
