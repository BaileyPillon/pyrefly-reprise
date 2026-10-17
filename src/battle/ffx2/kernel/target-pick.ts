/**
 * FFX-2: which characters a command may aim at, and the pick of one when the game picks for the character (re-parity RC9 lane X2-H;
 * **FFX-2 only**). The valid-target set (exe 0x0063f920 with the set builder 0x006117b0 and the filter 0x0063fa10) and the target dispatcher
 * in its "for mode" form (0x0063fc60 with the criterion picker 0x00634e40 and the team split 0x0063fba0), as the Confusion pick calls them.
 * Pure, deterministic, no DOM, no engine types (AGENTS.md rule 1).
 *
 * Source: FFX-2.exe, Steam build 25501027 (SHA-256 6EA7F142...CD69), read from the disassembly and run on the real machine code in the harness
 * (`confusion-pick.ts` says how: `tests/fixtures/parity/ffx2/confusion_pick.json`). The checked note FFX2-G02 section 2.8 describes the dispatchers.
 *
 * The set (mode 5, the only mode the pick uses): by the row's cursor flags, 0x20 (the team-split / reverse bit) takes everyone in the battle, a pass-through
 * row (type 2) takes everyone but the caster, and otherwise bit 1 (enemy side first) decides the side: a girl's row without it takes her own side, a
 * monster's the monsters' side, and with it the other one. "In the battle" is `Chr+0x1784` non-zero and `Chr+0x1792` zero. The filter then drops a
 * character that is not selectable (`Chr+0x1796` zero), or hidden (`Chr+0x5ac` equal to 1, unless the row carries the far flag 0x400), and, unless the row
 * may target the dead (0x40), one that is out of the battle, Ejected (status word bit 10), or dead.
 *
 * The pick (mode 0): the target type is the cursor flags' bits 2 and 3; type 0 with the all-targets choice is type 1. Type 0 (single): an empty set
 * stays empty, one character is taken as is, and with two or more ONE draw of stream 4 picks the (draw mod count)-th in ascending slot order. Type 1 (multiple):
 * with the team-split bit 0x20 the set is divided into the girls' half (slots 0 to 14) and the monsters' half (15 to 30) and one draw of stream 5 picks the
 * (draw mod number of non-empty halves)-th non-empty half (no draw when the set is empty); without the bit the set passes. Type 2: the set passes. Type 3: the
 * set is cut to the caster.
 */

import { Ffx2FixedStream, drawValue, isMonsterSlot, type Ffx2Draw } from './rng.ts';

/** The characters the battle holds: slots 0 to 30 (girls and pods 0 to 14, monsters 15 to 30). */
export const TARGET_SLOTS = 31;

/** Stream 4: every target search a script or an autopilot makes (`adapt/streams.ts` Ffx2ScriptStream.Search). */
export const SEARCH_STREAM = 4;

/** What the target functions read of one character. */
export interface Ffx2TargetSlot {
  /** `Chr+0x0` is non-zero (the character record is loaded). */
  readonly loaded: boolean;
  /** `Chr+0x1784`: the character is in the battle. */
  readonly inBattle: boolean;
  /** `Chr+0x1792` is non-zero: taken out of the battle's sets by a script. */
  readonly out: boolean;
  /** `Chr+0x1787` is non-zero: dead. */
  readonly dead: boolean;
  /** `Chr+0x5ac`: 1 hides the character from rows without the far flag. */
  readonly hidden: number;
  /** `Chr+0x1796` (a signed byte): zero means not selectable. */
  readonly selectable: number;
  /** `Chr+0x434`: status word 1 (bit 10, 0x400, is Eject). */
  readonly status1: number;
}

const CURSOR_TEAM_SPLIT = 0x20;
const CURSOR_DEAD = 0x40;
const CURSOR_ALL = 0x80;
const CURSOR_FAR = 0x400;
const STATUS_EJECT = 0x400;

const bitOf = (slot: number): number => 1 << slot;

/** Is the character in the battle for the set builder: `Chr+0x1784` non-zero and `Chr+0x1792` zero. */
function present(s: Ffx2TargetSlot): boolean {
  return s.inBattle && !s.out;
}

/** The set builder (0x006117b0) for the four selectors the valid-target set uses: the girls' side, the monsters' side, everyone, everyone but `caster`. */
function sideSet(slots: readonly Ffx2TargetSlot[], selector: 'girls' | 'monsters' | 'all' | 'others', caster: number): number {
  let mask = 0;
  for (let i = 0; i < TARGET_SLOTS; i++) {
    const s = slots[i];
    if (s === undefined || !present(s)) continue;
    const mon = isMonsterSlot(i);
    if (selector === 'girls' && mon) continue;
    if (selector === 'monsters' && !mon) continue;
    if (selector === 'others' && i === caster) continue;
    mask |= bitOf(i);
  }
  return mask;
}

/** The set filter (0x0063fa10): drop what the row may not touch. */
function filterSet(slots: readonly Ffx2TargetSlot[], mask: number, cursor: number): number {
  let out = mask;
  for (let i = 0; i < TARGET_SLOTS; i++) {
    if ((out & bitOf(i)) === 0) continue;
    const s = slots[i];
    if (s === undefined) {
      out &= ~bitOf(i);
      continue;
    }
    let flagged = s.selectable === 0;
    if ((cursor & CURSOR_FAR) === 0 && s.hidden === 1) flagged = true;
    if (!s.loaded && !s.inBattle) flagged = true;
    const drop = (cursor & CURSOR_DEAD) !== 0 ? flagged : !s.inBattle || (s.status1 & STATUS_EJECT) !== 0 || s.dead || flagged;
    if (drop) out &= ~bitOf(i);
  }
  return out;
}

/**
 * The valid-target set of a command for the character in slot `chr` (0x0063f920, mode 5): the bit of every slot the row's cursor flags let her aim at.
 */
export function validTargets(chr: number, cursor: number, slots: readonly Ffx2TargetSlot[]): number {
  const monster = isMonsterSlot(chr);
  let mask: number;
  if ((cursor & CURSOR_TEAM_SPLIT) !== 0) mask = sideSet(slots, 'all', chr);
  else if ((cursor & 0xc) === 8) mask = sideSet(slots, 'others', chr);
  else if ((cursor & 2) !== 0) mask = sideSet(slots, monster ? 'girls' : 'monsters', chr); // enemy side first
  else mask = sideSet(slots, monster ? 'monsters' : 'girls', chr);
  return filterSet(slots, mask, cursor);
}

/** The team split (0x0063fba0): with bit 0x20 one half of the set, picked by one draw of stream 5 among the non-empty halves. */
function teamSplit(mask: number, cursor: number, draw: Ffx2Draw): number {
  if ((cursor & CURSOR_TEAM_SPLIT) === 0) return mask;
  let girls = 0;
  let monsters = 0;
  for (let i = 0; i < TARGET_SLOTS; i++) {
    if ((mask & bitOf(i)) === 0) continue;
    if (isMonsterSlot(i)) monsters |= bitOf(i);
    else girls |= bitOf(i);
  }
  const halves = [girls, monsters].filter((h) => h !== 0);
  if (halves.length === 0) return mask;
  return halves[drawValue(draw, Ffx2FixedStream.RandomTarget) % halves.length] ?? 0;
}

/**
 * The target dispatcher in "for mode" form (0x0063fc60, tie-break mode 0): the mask the character's command is queued with. `all` is the all-targets choice
 * the pick made (the byte at `ActionRec+0x27`); `mask` is the valid-target set. Returns 0 when there is nobody to aim at.
 */
export function aimTargets(chr: number, cursor: number, mask: number, all: boolean, draw: Ffx2Draw): number {
  let type = (cursor >> 2) & 3;
  if (type === 0 && all) type = 1;
  if (type === 0) {
    if (mask === 0) return 0;
    const slots: number[] = [];
    for (let i = 0; i < TARGET_SLOTS; i++) if ((mask & bitOf(i)) !== 0) slots.push(i);
    if (slots.length === 1) return bitOf(slots[0] as number);
    return bitOf(slots[drawValue(draw, SEARCH_STREAM) % slots.length] as number);
  }
  if (type === 1) return teamSplit(mask, cursor, draw);
  if (type === 2) return mask;
  return mask & bitOf(chr & 0xff);
}

/** Does the row offer the all-targets choice (cursor bit 0x80)? The pick then spends a draw on it. */
export function canChooseAll(cursor: number): boolean {
  return (cursor & CURSOR_ALL) !== 0;
}
