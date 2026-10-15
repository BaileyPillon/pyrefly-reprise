/**
 * The independent oracle of `parity-ffx-engine-k-aeons.test.ts` (re-parity lane FFX-K; **FFX only**): the player's Yojimbo's and the Magus Sisters' rules written
 * out again from the note's prose (`FFX-G08` sections 3, 4 and 6), in plain arithmetic, with NO import of `kernel/yojimbo.ts`, `kernel/sisters.ts` or the adapters. A
 * mistake in how the engine hands the kernels their inputs, or in the order it takes the draws, shows as a difference from this file.
 *
 * Every function takes the raw 31-bit draws the engine took (the test taps the generator) and answers what the game would have decided.
 */

/** The five commands by the sum the roll is given (note section 2: below 32, 32 to 47, 48 to 62, 63 to 79, 80 and up). */
export function commandBySum(sum: number): 'daigoro' | 'kozuka' | 'wakizashi-single' | 'wakizashi-multi' | 'zanmato' {
  if (sum < 32) return 'daigoro';
  if (sum < 48) return 'kozuka';
  if (sum < 63) return 'wakizashi-single';
  if (sum < 80) return 'wakizashi-multi';
  return 'zanmato';
}

/** The compatibility change each command gives when it was queued (note 3.2 step 9). */
export const DELTA: Readonly<Record<string, number>> = { daigoro: -1, kozuka: 0, 'wakizashi-single': 1, 'wakizashi-multi': 3, zanmato: 4 };

/** The gil part of the motivation: 4 x (floor(log2 payment) - 2) from 8 gil, else 0 (note 3.2 step 4 and table 4.2). */
export function gilPart(payment: number): number {
  return payment >= 8 ? 4 * (Math.floor(Math.log2(payment)) - 2) : 0;
}

export interface PayCase {
  payment: number;
  gil: number;
  compat: number;
  hire: number;
  /** The highest Zanmato byte among the monsters. */
  zan: number;
  gaugeFull: boolean;
  cursed?: boolean;
}

const f = Math.fround;

/** One pass's motivation number with the monster byte `zan`. */
function motivation(c: PayCase, zan: number): number {
  let v = f(gilPart(c.payment) + Math.floor(c.compat / 10));
  if (c.hire === 0) v = f(f(75 + f(f(f(c.payment) * 50) / f(c.gil))) * v) / 100;
  if (c.hire === 0) v = f(v);
  if (c.hire === 2) v = f(f(v * f(0.8)) / f(Math.floor((zan + 3) / 3)));
  else v = f(v / f(zan + 1));
  if (c.gaugeFull && !c.cursed) v = f(v + 20);
  return v;
}

/** What a Pay decides from its draws (the first and, when the script rolls again, the second): the command, and whether the second pass happened. */
export function payDecision(c: PayCase, drawA: number, drawB: number): { command: string; secondPass: boolean; draws: number } {
  const first = commandBySum(Math.trunc(motivation(c, c.zan)) + (drawA & 63));
  if (c.zan > 0 && first !== 'zanmato') {
    const second = commandBySum(Math.trunc(motivation(c, 0)) + (drawB & 63));
    return { command: second === 'zanmato' ? 'wakizashi-multi' : second, secondPass: true, draws: 2 };
  }
  return { command: first, secondPass: false, draws: 1 };
}

/** The free attack's turn-start test and its command (note 3.1 step 1, 3.3). */
export function freeAttack(compat: number, drawTurnStart: number, drawScript: number): { wins: boolean; command: string } {
  const a = Math.floor(compat / 4);
  return { wins: (drawTurnStart & 0xff) < a, command: commandBySum(a + (drawScript & 63)) };
}

/** The Sisters' menu from the draws it takes in order (note 6.4), as the list of order commands offered, Dismiss last. */
export function sisterMenu(
  who: 'cindy' | 'sandy' | 'mindy',
  s: { turns: number; motivation: number; hp: number; mp: number; maxHp: number; maxMp: number; nearDeath: number; ready: number },
  draws: number[],
): { offered: number[]; used: number } {
  let i = 0;
  const roll = (threshold: number): boolean => (draws[i++]! & 0xff) < threshold;
  const out: number[] = [0x3124];
  if (s.turns > 0) out.push(0x3125);
  const M = s.motivation;
  if (who === 'cindy') {
    if (roll(M + 50)) out.push(0x3126);
    if (roll(128)) out.push(0x3127);
    if (roll(200)) out.push(0x3128);
  } else if (who === 'sandy') {
    if (roll(M + 150)) out.push(0x3126);
    const low = s.nearDeath > 0;
    const lucky = roll(128); // taken either way
    if (low || lucky) out.push(0x312a);
  } else {
    if (roll(M + 150)) out.push(0x3126);
    if (Math.floor((s.hp * 4) / s.maxHp) === 0 || Math.floor((s.mp * 4) / s.maxMp) === 0) {
      if (roll(200)) out.push(0x312b);
    } else if (Math.floor((s.hp * 2) / s.maxHp) === 0 || Math.floor((s.mp * 2) / s.maxMp) === 0) {
      if (roll(128)) out.push(0x312b);
    }
  }
  if (s.ready === 3) out.push(0x3129);
  out.push(0x3056);
  return { offered: out, used: i };
}

/** Ticks per rank of an Agility, for the two values the note works (Agility 40 is 7, Agility 100 is 4, note 6.6). */
export const TICKS: Readonly<Record<number, number>> = { 40: 7, 100: 4 };
