/**
 * **Spherimorph's rules, as numbers and ids** (FFX only; the hidden Spherimorph chapter, number 41; `research/re-ffx-spherimorph.md`, "RE n"). The script is `./spherimorph.ts`; this file holds what it reads, so each
 * number has one home and one source. **Every number is the note's** (rule 6), read from the game's own file (`m121`) and run in the earlier lanes' Atel interpreter ("[bytes] [run]" there): nothing here is an estimate
 * of ours. The battle layer imports no `src/data` (hard rule 1), so the ids are copied here and `tests/unit/chapters/spherimorph-data.test.ts` pins the copies equal `data/ffx/spherimorph-ids.ts`.
 *
 * | Rule | Number | RE note |
 * |---|---|---|
 * | The state | one of four, drawn at the start (`GetRandomValue() mod 4`: 16,384 of 65,536 each): weak Fire, Ice, Thunder or Water; it **absorbs the other three elements and Holy** | 4.1 |
 * | The counter rows | the **opposite** of the weakness (Fire and Ice are a pair, Thunder and Water the other): a player-side row on a plain hit, a monster-side row on magic | 4.1 |
 * | The turn | below 6,000 HP (strictly), a draw modulo 100 below 50 makes it Press on the front line; otherwise an Attack on a random living member | 4.2 |
 * | The shift | a hit with the weakness, or an elemental special: a new state, a uniform draw over all four (the old one included), then Elemental Shift on itself | 4.3 |
 */

import type { AbilityDef, CombatantId, ElementalAffinities, ElementId, FFXCombatant } from '../../common/types.ts';
import { resolveCommand } from '../adapt/command.ts';
import { resolveElements } from '../elements.ts';
import { weaponElements } from '../equipment.ts';
import { type Ctx, tryActor } from '../state.ts';
import { commandDamageType } from './command-class.ts';
import { gameMod, livingFrontLine } from './game-rolls.ts';
import { scriptIdOf } from './hooks.ts';

/** The combatant and script ids (`data/ffx/spherimorph-ids.ts`). */
export const SM_ID = 'spherimorph';
export const SM_SCRIPT = 'spherimorph';

/** The move rows (the monster's own six in `data/ffx/enemies/spherimorph-abilities.ts`; the four player-side rows are the player's own, used by their ids). */
export const SM_ROWS = {
  fire: 'spherimorph-fire', // 0x6039
  blizzard: 'spherimorph-blizzard', // 0x603A
  thunder: 'spherimorph-thunder', // 0x603B
  water: 'spherimorph-water', // 0x603C
  shift: 'spherimorph-elemental-shift', // 0x6036
  press: 'spherimorph-press', // 0x603F
  playerFire: 'fire', // 0x3042
  playerBlizzard: 'blizzard', // 0x3041
  playerThunder: 'thunder', // 0x3043
  playerWater: 'water', // 0x3044
} as const;

/** The `state.flags` keys the state lives in (`data/ffx/spherimorph-ids.ts` `SPHERIMORPH_FLAGS`). */
export const SM_STATE_FLAG = 'sm.state';
export const SM_DOUBLECAST_FLAG = 'sm.doublecast';
export const SM_SHIFTS_FLAG = 'sm.shifts';
export const SM_HINTS_FLAG = 'sm.hints';

/** The `script-trigger` names of the two banners (`data/ffx/spherimorph-ids.ts` `SPHERIMORPH_CALLOUTS`). */
export const SM_CALLOUT_FIRST = 'spherimorph-hint-first';
export const SM_CALLOUT_SECOND = 'spherimorph-hint-second';

/** The four elements of the machine, in the order of the record's flags (Fire, Ice, Thunder, Water). */
export type SmElement = 'fire' | 'ice' | 'lightning' | 'water';
export const SM_ELEMENTS: readonly SmElement[] = ['fire', 'ice', 'lightning', 'water'];

/** One of the four states (RE 4.1): the weakness and the two rows the answers use. */
export interface SmState {
  readonly weak: SmElement;
  /** The player-side row (`v9`): the answer to a plain physical hit, aimed at the attacker. */
  readonly physical: string;
  /** The monster-side row (`v10`): the answer to magic, aimed at the front line. */
  readonly magic: string;
}

/** RE 4.1's table, state 0 to 3. */
export const SM_STATES: readonly SmState[] = [
  { weak: 'fire', physical: SM_ROWS.playerBlizzard, magic: SM_ROWS.blizzard },
  { weak: 'ice', physical: SM_ROWS.playerFire, magic: SM_ROWS.fire },
  { weak: 'lightning', physical: SM_ROWS.playerWater, magic: SM_ROWS.water },
  { weak: 'water', physical: SM_ROWS.playerThunder, magic: SM_ROWS.thunder },
];

/** The Press line: the script saves half of the maximum HP at init (integer division) and tests strictly below. */
export function pressLine(maxHp: number): number {
  return Math.floor(maxHp / 2);
}

/** The draw modulo 100 below which it presses (RE 4.2): residues 0 to 49. */
export const PRESS_CHANCE_BELOW = 50;

/** The command records the script recomputes the elements of without the attacker's weapon (RE 4.3): Wakka's four Shots (0x30EF to 0x30F6, each in two rows), his four Reels (0x3074 to 0x3077) and Power Shot (0x30FE). */
export const WAKKA_RECORD_IDS: ReadonlySet<number> = new Set([0x30ef, 0x30f0, 0x30f1, 0x30f2, 0x30f3, 0x30f4, 0x30f5, 0x30f6, 0x3074, 0x3075, 0x3076, 0x3077, 0x30fe]);

/** The Scan command's record id (RE 4.3 item 3). */
export const SCAN_RECORD_ID = 0x3032;

/** A `state.flags` number, or `fallback`. */
export function flagNumber(ctx: Pick<Ctx, 'state'>, key: string, fallback = 0): number {
  const v = ctx.state.flags[key];
  return typeof v === 'number' ? v : fallback;
}

/** The state now, 0 to 3, or `undefined` before it was drawn. */
export function smStateIndex(ctx: Pick<Ctx, 'state'>): number | undefined {
  const v = ctx.state.flags[SM_STATE_FLAG];
  return typeof v === 'number' && v >= 0 && v < SM_STATES.length ? v : undefined;
}

/** The current state's row (state 0 if it was never drawn: the callers draw first). */
export function smStateOf(ctx: Pick<Ctx, 'state'>): SmState {
  return SM_STATES[smStateIndex(ctx) ?? 0] as SmState;
}

/** Write the four elements' affinities and Holy's for `state` (RE 4.1: the weakness x3/2, the other three and Holy absorbed). The record writes none of its own. */
export function applyState(self: FFXCombatant, state: number): void {
  const weak = (SM_STATES[state] as SmState).weak;
  const next: ElementalAffinities = { ...self.affinities };
  for (const e of SM_ELEMENTS) next[e] = e === weak ? 'weak' : 'absorb';
  next.holy = 'absorb';
  self.affinities = next;
}

/** One draw of the machine: `GetRandomValue() mod 4`, exactly uniform over 65,536 (16,384 each). */
export function drawState(ctx: Ctx): number {
  return gameMod(ctx, SM_STATES.length);
}

/** Draw a state, write it and its flags. `shifts` counts only the changes made by a hit (the battle's start is not one). */
export function setNewState(ctx: Ctx, self: FFXCombatant): number {
  const state = drawState(ctx);
  ctx.state.flags[SM_STATE_FLAG] = state;
  applyState(self, state);
  return state;
}

/**
 * The battle's start (RE 4.1, init `f0`): one draw picks the state and the script writes the affinities and the counter rows at once. A no-op in every battle but this one. The hooks call {@link ensureState} too, so a
 * runtime rebuilt without the setup (the advisor's dry runs) still has a state before its first hit.
 */
export function applySpherimorphSetup(ctx: Ctx): void {
  const self = tryActor(ctx, SM_ID);
  if (self === undefined || scriptIdOf(self) !== SM_SCRIPT) return;
  ensureState(ctx, self);
}

/** The state, drawn and written on first need. */
export function ensureState(ctx: Ctx, self: FFXCombatant): number {
  const have = smStateIndex(ctx);
  if (have !== undefined) return have;
  ctx.state.flags[SM_DOUBLECAST_FLAG] = false;
  ctx.state.flags[SM_SHIFTS_FLAG] = 0;
  ctx.state.flags[SM_HINTS_FLAG] = 0;
  return setNewState(ctx, self);
}

// ---------------------------------------------------------------------------
// Reading a command (RE 4.3, onTargeted)
// ---------------------------------------------------------------------------

/** What the script reads of a command that reached it: its damage type, its HP class and the five element bits. */
export interface HitFacts {
  /** `readCommandProperty(cmd, damageType)`: 1 physical, 2 magical, 0 special (3, both, matches no branch). */
  readonly damageType: number;
  /** `readCommandProperty(cmd, affectHP)`: the damage class includes HP. */
  readonly affectsHp: boolean;
  readonly fire: boolean;
  readonly ice: boolean;
  readonly thunder: boolean;
  readonly water: boolean;
  readonly holy: boolean;
  /** `v19`: how many of the five bits are set. */
  readonly bits: number;
}

const has = (els: readonly ElementId[], e: ElementId): boolean => els.includes(e);

/**
 * **What the script reads of a command** (RE 4.3 onTargeted). A magical command reads its own five element bits; **any other reads them for the actor** (`readCommandPropertyForActor`), which adds the attacker's
 * weapon element when the command carries the weapon's properties (the engine's own rule for the damage, `elements.ts#resolveElements`; the note marks the unconditional reading `[inferred]`, RE 8).
 */
export function readHit(def: AbilityDef, user: FFXCombatant): HitFacts {
  const damageType = commandDamageType(def, user);
  const affectsHp = (resolveCommand(def, user).record.damageClass & 1) !== 0;
  const els: readonly ElementId[] = damageType === 2 ? def.element.filter((e) => e !== 'none') : resolveElements(user, def, weaponElements(user));
  const fire = has(els, 'fire');
  const ice = has(els, 'ice');
  const thunder = has(els, 'lightning');
  const water = has(els, 'water');
  const holy = has(els, 'holy');
  return { damageType, affectsHp, fire, ice, thunder, water, holy, bits: [fire, ice, thunder, water, holy].filter(Boolean).length };
}

/** `v19` as onHit recomputes it for Wakka's commands: the command's own four element bits, no weapon, no Holy. Other commands keep the onTargeted reading. */
export function hitBitsAtHit(def: AbilityDef, user: FFXCombatant, facts: HitFacts): number {
  if (!WAKKA_RECORD_IDS.has(resolveCommand(def, user).record.id)) return facts.bits;
  return def.element.filter((e) => e === 'fire' || e === 'ice' || e === 'lightning' || e === 'water').length;
}

/** True when the weakness' own bit is set on the command. */
export function hasWeakBit(state: SmState, facts: HitFacts): boolean {
  switch (state.weak) {
    case 'fire': return facts.fire;
    case 'ice': return facts.ice;
    case 'lightning': return facts.thunder;
    default: return facts.water;
  }
}

/**
 * **"Absorbed"** (`v11 = 128`, RE 4.3 onTargeted): the command affects HP and carries at least one of the five elements, and **either lacks the weakness' bit or carries Holy**. A command with several elements that
 * includes the weakness is not absorbed unless it also carries Holy.
 */
export function isAbsorbed(state: SmState, facts: HitFacts): boolean {
  if (!facts.affectsHp || facts.bits === 0) return false;
  return !hasWeakBit(state, facts) || facts.holy;
}

/** The living, targetable front line as ids (the group `FrontlineChars` names; the aeon alone while one holds the field). */
export function frontIds(ctx: Ctx): CombatantId[] {
  return livingFrontLine(ctx).map((c) => c.id);
}
