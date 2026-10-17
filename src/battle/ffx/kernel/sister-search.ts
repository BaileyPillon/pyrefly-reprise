/**
 * The Magus Sisters' target search (re-parity lane FFX-K, the Sisters' orders of 2026-10-15; **FFX only**).
 *
 * **Game case: FFX only** (FFX-2 has no Magus Sisters). Source: `research/re-ffx-zanmato-and-orders.md` Part 2 sections 9 and 10 (branch `re-ffx-zanmato-and-orders`,
 * final decode `f59c4592`), read from FFX.exe (Steam build 25501027, SHA-256 0537B2A1...686D): the native `btlGetCommandTargetSearch` (0x7A37E0) and the three
 * functions it calls in this order, 0x7A8B40 (the candidate set and the "can she use it" test), 0x7A8AD0 (the chance roll) and 0x7A8F60 (the property-filtered
 * pick), with 0x794330 / 0x799820 / 0x7ACD40 / 0x7B2DC0 / 0x799A10 / 0x796430 behind them. **Proved**: 24,000 vectors of the real code against an independent
 * model, 0 mismatches (`tests/unit/parity-ffx-sister-orders.test.ts` replays a stratified subset from `tests/fixtures/parity/ffx/sister_search.json`).
 *
 * **What a search is.** The acting sister asks for a command with a targeting code T, a property P, a flag F (128 negates the property test) and a chance C.
 *
 * 1. The candidate set of T, cut by the legal-set rules for that command (Targetable, reach, the dead flag), and "can she use it" (an Overdrive-cost command
 *    needs her gauge at its maximum and no Curse; a silenceable command fails while she is Silenced; her MP must cover the command's MP cost). An empty set, or
 *    a command she cannot use, ends the search with {@link NO_TARGET} and **no draw**.
 * 2. The chance roll ({@link magusRoll}: a negative C always passes with no draw; with a standing order a non-zero command passes only if it IS the standing
 *    one, no draw; otherwise one draw on stream 18, `(draw & 0xFF) < C`, and a C of 256 or more passes but the draw is still spent).
 * 3. The pick: of the candidates, the ones the property holds for (or fails for, with F = 128), ascending; none gives {@link NO_TARGET}, one is taken with no
 *    draw, several take ONE draw on stream 4 and the one of rank `value mod n`.
 * 4. The stored target mask follows the command's own type (single: the candidates that passed; group: those plus every candidate in the group of the lowest
 *    one; all: the whole set; self: the sister).
 *
 * Pure and deterministic (AGENTS.md rule 1): draws are callbacks; nothing here imports the DOM, `three` or the engine. The world is described by plain
 * {@link SearchChar} records so the engine's combatants and the game's runs fill the same fields.
 */

import { magusRoll } from './sisters.ts';

/** What a search returns when nobody can be aimed at (or the roll failed). */
export const NO_TARGET = 0xff;
/** The monster slots of the game's character array. */
export const FIRST_MONSTER = 0x14;
export const LAST_MONSTER = 0x1b;
/** The slots of the game's 31 characters. */
export const SEARCH_SLOTS = 31;

/** The fields of one command's record the search reads (`Cmd+0x1a/0x1b` as `u1a`, the silence bit of the flag word, the MP cost byte, the Overdrive cost byte). */
export interface CommandRow {
  u1a: number;
  silence: boolean;
  mp: number;
  od: number;
}

const row = (u1a: number, silence: 0 | 1, mp: number, od = 0): CommandRow => ({ u1a, silence: silence === 1, mp, od });

/**
 * The 33 commands the Sisters' orders use, read from the install's own command table through the game's lookup (0x78CE50) by the harness
 * (`D:\Tools\ffx-parity\rc9\aeons\zanmato-fix\export_cmd_rows.py`): target type `(u1a >> 2) & 3` (0 single, 1 group, 3 self), reach `(u1a >> 7) & 3`, the
 * dead-target bit `u1a & 0x40`. Names: our ids are in {@link SISTER_ABILITY}.
 */
export const COMMAND_ROWS: Readonly<Record<number, CommandRow>> = {
  0x3000: row(1587, 0, 0), // Attack (the sister's own)
  0x3019: row(1413, 0, 0), // Pray (group)
  0x3020: row(1427, 0, 0), // Lancet
  0x302b: row(1457, 1, 4), // Cure
  0x302c: row(1457, 1, 10), // Cura
  0x302d: row(1457, 1, 20), // Curaga
  0x3034: row(1521, 1, 18), // Life (may target the dead)
  0x3035: row(1521, 1, 60), // Full-Life (may target the dead)
  0x3036: row(1457, 1, 8), // Haste
  0x303a: row(1457, 1, 10), // Shell
  0x303b: row(1457, 1, 12), // Protect
  0x303c: row(1457, 1, 14), // Reflect
  0x3040: row(1425, 1, 97), // Auto-Life
  0x3045: row(1459, 1, 8), // Fira
  0x3046: row(1459, 1, 8), // Blizzara
  0x3047: row(1459, 1, 8), // Thundara
  0x3048: row(1459, 1, 8), // Watera
  0x3049: row(1459, 1, 16), // Firaga
  0x304a: row(1459, 1, 16), // Blizzaga
  0x304b: row(1459, 1, 16), // Thundaga
  0x304c: row(1459, 1, 16), // Waterga
  0x304d: row(1459, 1, 10), // Bio
  0x304f: row(1459, 1, 20), // Death
  0x3050: row(1459, 1, 12), // Drain
  0x3051: row(1459, 1, 0), // Osmose
  0x3052: row(1459, 1, 54), // Flare
  0x3053: row(1463, 1, 90), // Ultima (group)
  0x30e5: row(1075, 0, 0), // Camisade
  0x30e7: row(1075, 0, 0), // Razzia
  0x30e9: row(1075, 0, 0), // Passado
  0x30ea: row(1175, 0, 0, 20), // Delta Attack (group, reach 1, Overdrive cost 20)
  0x312c: row(1421, 0, 0), // the rest command (self)
  0x312d: row(1413, 0, 4), // NulAll (group)
};

/** The row of a command, or a loud error: the orders only ever name the 33 above. */
export function rowOf(cmd: number): CommandRow {
  const r = COMMAND_ROWS[cmd];
  if (r === undefined) throw new Error(`FFX engine: the Sisters' search has no command row for 0x${cmd.toString(16)}`);
  return r;
}

/** The command's target type: 0 single, 1 group, 2 all, 3 self. */
export const typeOf = (r: CommandRow): number => (r.u1a >> 2) & 3;
/** The command's reach, 0 to 3. */
export const reachOf = (r: CommandRow): number => (r.u1a >> 7) & 3;
/** Does the command have the dead-target bit (Life, Full-Life)? */
export const canTargetDead = (r: CommandRow): boolean => (r.u1a & 0x40) !== 0;

/**
 * What the search reads of one character (a slot of the game's 31). A sister's own fields are `mp`, `silence`, `curse`, `gauge` and `gaugeMax`; the nine property
 * tests read `dead`, `autoLife`, `reflect`, `hp` against `maxHp`, the four Nul counters, `shell`, `protect` and `haste`. A counter is true when it is non-zero.
 */
export interface SearchChar {
  inBattle: boolean;
  removed: boolean;
  targetable: boolean;
  dead: boolean;
  /** BattleDistance, a signed byte. */
  far: number;
  /** `Chr+0x504`, low three bits. */
  group: number;
  hp: number;
  maxHp: number;
  mp: number;
  silence: boolean;
  curse: boolean;
  gauge: number;
  gaugeMax: number;
  autoLife: boolean;
  shell: boolean;
  protect: boolean;
  reflect: boolean;
  haste: boolean;
  nulTide: boolean;
  nulBlaze: boolean;
  nulShock: boolean;
  nulFrost: boolean;
}

/** The 31 characters; an entry left out is nobody. */
export type SearchWorld = ReadonlyArray<SearchChar | undefined>;

/** A signed byte. */
const s8 = (v: number): number => ((v & 0xff) ^ 0x80) - 0x80;
const isMonster = (slot: number): boolean => slot >= FIRST_MONSTER && slot <= LAST_MONSTER;
const bit = (slot: number): number => 1 << slot;

/**
 * The candidate set of a targeting code T for `actor` and `cmd` (0x7A8B40, the first step): T = 0 the other side (a party-side actor: the monsters), any other
 * T without bit 0x200 the actor's own side (T = 0x101: without the actor herself), 0x200 + k the slot k alone. A slot is a candidate when it is in the battle and not
 * removed (not tested for the "slot alone" codes), Targetable, within the command's reach (the actor herself is exempt) and, unless the command may target the
 * dead, not dead. Returned as a bit mask of slots.
 */
export function candidateSet(world: SearchWorld, actor: number, cmd: number, T: number): number {
  const r = rowOf(cmd);
  const reach = reachOf(r);
  const dead = canTargetDead(r);
  const base: number[] = [];
  if ((T & 0x200) !== 0) base.push(T & 0xff);
  else {
    const wantMonsters = (T === 0) !== isMonster(actor);
    for (let s = 0; s < SEARCH_SLOTS; s++) {
      const c = world[s];
      if (c === undefined || !c.inBattle || c.removed) continue;
      if (isMonster(s) === wantMonsters) base.push(s);
    }
  }
  let mask = 0;
  for (const s of base) {
    const c = world[s];
    if (c === undefined || !c.targetable) continue;
    if (s8(c.far) > reach && s !== actor) continue;
    if (c.dead && !dead) continue;
    mask |= bit(s);
  }
  if ((T & 0x100) !== 0 && (T & 0x200) === 0) mask &= ~bit(actor);
  return mask >>> 0;
}

/**
 * Can `actor` use `cmd` (0x7A8B40, the second step)? An Overdrive-cost command needs her gauge at its maximum and no Curse; a silenceable command fails while
 * she is Silenced; her MP must cover the command's MP cost (a monster pays none).
 */
export function canUse(world: SearchWorld, actor: number, cmd: number): boolean {
  const r = rowOf(cmd);
  const me = world[actor];
  if (me === undefined) return false;
  if (r.od !== 0 && (me.gauge < me.gaugeMax || me.curse)) return false;
  if (r.silence && me.silence) return false;
  return me.mp >= (isMonster(actor) ? 0 : r.mp);
}

/** The nine property tests (section 10): whether the property holds for one candidate (the caller negates with F = 128). */
export function propertyHolds(P: number, c: SearchChar): boolean {
  switch (P) {
    case 92:
      return true; // always (it counts the slot)
    case 242:
      return c.dead;
    case 152:
      return c.autoLife;
    case 50:
      return c.reflect;
    case 283:
      return c.hp >= c.maxHp;
    case 285:
      return c.nulTide && c.nulBlaze && c.nulShock && c.nulFrost;
    case 286:
      return c.shell || c.reflect;
    case 287:
      return c.protect || c.reflect;
    case 288:
      return c.haste || c.reflect;
    default:
      throw new Error(`FFX engine: the Sisters' search has no property test ${P}`);
  }
}

/** The world the search draws in. */
export interface SearchHost {
  /** The standing order (a command id, 0 for none). */
  standing: number;
  /** One draw of stream 18, the 31-bit value. */
  draw18(): number;
  /** The picker: one draw of stream 4 over the candidate slots (ascending, two or more), the chosen slot. */
  pick4(slots: readonly number[]): number;
}

/** What a search came to. */
export interface SearchResult {
  /** The usable candidate mask (0 when the set was empty or she could not use the command). */
  usable: number;
  /** Whether the chance roll passed: `null` when no roll was made. */
  rolled: boolean | null;
  /** The picked slot, {@link NO_TARGET} for none. */
  picked: number;
  /** The stored target mask (her saved target cell): the candidate set until the roll and the pick are through, then by the command's type. */
  stored: number;
}

/** The slots of a mask, ascending. */
function slotsOf(mask: number): number[] {
  const out: number[] = [];
  for (let s = 0; s < SEARCH_SLOTS; s++) if (((mask >>> s) & 1) !== 0) out.push(s);
  return out;
}

/**
 * `btlGetCommandTargetSearch(cmd, T, P, F, C)` for `actor` (0x7A37E0): the candidate set, the usable test, the chance roll, the filtered pick and the stored
 * target mask, in the order of the module's header. `F` is 0 or 128 in every call the Sisters make.
 */
export function targetSearch(world: SearchWorld, actor: number, cmd: number, T: number, P: number, F: number, C: number, host: SearchHost): SearchResult {
  const mask = candidateSet(world, actor, cmd, T);
  const usable = canUse(world, actor, cmd) ? mask : 0;
  if (usable === 0) return { usable: 0, rolled: null, picked: NO_TARGET, stored: mask };

  const roll = magusRoll(cmd, C, host.standing, host.draw18);
  if (roll.value === 0) return { usable, rolled: false, picked: NO_TARGET, stored: mask };

  const negate = (F & 0x80) !== 0;
  const accepted = slotsOf(mask).filter((s) => propertyHolds(P, world[s] as SearchChar) !== negate);
  let picked: number = NO_TARGET;
  if (accepted.length === 1) picked = accepted[0] as number;
  else if (accepted.length > 1) picked = host.pick4(accepted);

  const type = typeOf(rowOf(cmd));
  let accMask = 0;
  for (const s of accepted) accMask |= bit(s);
  let stored = accMask;
  if (type === 1 && accepted.length > 0) {
    const group = (world[accepted[0] as number] as SearchChar).group & 7;
    for (const s of slotsOf(mask)) if (((world[s] as SearchChar).group & 7) === group) stored |= bit(s);
  } else if (type === 2) stored = mask;
  else if (type === 3) stored = bit(actor);
  return { usable, rolled: true, picked, stored: stored >>> 0 };
}
