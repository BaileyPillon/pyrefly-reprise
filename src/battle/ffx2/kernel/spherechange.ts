/**
 * FFX-2 Spherechange (a dress change in battle) and garment-grid gates: the game's own rules.
 *
 * **Game case: FFX-2 only** (FFX has no dress changes or grids).  Source: FFX-2.exe, Steam build 25501027 (SHA-256
 * 6EA7F142...CD69).  Spec: `research/re-ffx2-dressphere.md` sections 2 and 3.  Pure, deterministic, no DOM, no engine
 * types.  Not wired into the engine, which still gives a change the whole gauge (`ffx2/spherechange.ts`).
 *
 * Exe addresses (live build):
 * - 0x00625130  command row lookup: for an id in 0x5000..0x5fff it fills a shared scratch row with two flag words and nothing else
 * - 0x00634110  recovery time from the row's `cost_atb`;  0x0061a840  usability (Curse blocks dress commands)
 * - 0x006402c0  the change begins (clears Itch (bit 17 of the applied mask, then the status recompute), records the old and new dressphere, runs as a charged command)
 * - 0x00647ab0  the change lands: grid gates, save job, stat refresh;  0x00625de0  the stat refresh with the pool rule
 * - 0x005f51a0  `kyJobChangeAfter`: marks the nodes and gates crossed, then 0x005f4170 turns the cleared gates into abilities
 * - 0x00624cc0  statuses a new immunity removes;  0x0061b060  the "weak" pose state
 *
 * - 0x005f4800  opening the grid menu: decides whether the Special form is offered (`specialDressUpAvailable`)
 *
 * What the exe does NOT contain: the length of the dress-up animation (a motion script), and the grid's layout (nodes, links, gate
 * colours; those are in a compressed entry of the menu file `menu_plate.bin`, not decoded here).
 */

import { clampInt } from './intops.ts';
import { plateRow } from './dressphere-grids.ts';
import { poolMaxima, scalePool } from './dressphere-stats.ts';
import { recalcSaveRecord, setRamChrParam, type Ffx2Battle8, type Ffx2RecalcEnv, type Ffx2SaveRecord } from './dressphere-recalc.ts';
import { STATUS1_INFO } from './statusTypes.ts';

// ---------------------------------------------------------------------------------------------------
// The dress command's row
// ---------------------------------------------------------------------------------------------------

/** Is this command id a dress change (category 5, the ids `0x5000 + dressphere`)? */
export function isDressCommand(cmd: number): boolean {
  return (cmd & 0xf000) === 0x5000;
}

/**
 * The row the game hands out for ANY dress command (exe 0x00625130, category 5): it clears nothing, it ORs two flag words into
 * a shared scratch row (`flags_target |= 0x4d`, `flags_misc |= 0x3e00000`) and every other field is whatever that row held, which
 * is zeros: no ATB cost, no cast cost, no MP, no damage class.  Run in the emulator the lookup returns exactly this for every id.
 */
export const DRESS_COMMAND_ROW = {
  flagsTarget: 0x4d,
  flagsMisc: 0x3e00000,
  flagsDamage: 0,
  costAtb: 0,
  costCast: 0,
  costMp: 0,
  damageClass: 0,
  formula: 0,
} as const;

/** Status word 1 bit 8 (0x100): Curse.  It makes every dress command unusable (exe 0x0061a840). */
export const STATUS_CURSE = 0x100;

/** Can the girl start a dress change?  Only Curse in the status word matters to the engine (Silence is for silenceable commands only). */
export function dressCommandUsable(status1: number): boolean {
  return (status1 & STATUS_CURSE) === 0;
}

/**
 * The recovery counter after a dress change (exe 0x00634110): `cost_atb * 10000 / (AGI + 1) + carry`, clamped to 0..99999.  The
 * row's cost is 0, so the gauge does NOT start a recovery: only the carry-over of the previous command remains.
 */
export function dressRecovery(carry: number): number {
  return clampInt(DRESS_COMMAND_ROW.costAtb + carry, 0, 99999);
}

// ---------------------------------------------------------------------------------------------------
// The pools when the stats are rebuilt in battle
// ---------------------------------------------------------------------------------------------------

export interface Ffx2Pools {
  readonly hp: number;
  readonly mp: number;
  readonly maxHp: number;
  readonly maxMp: number;
}

/**
 * The pool rule of the battle refresh (exe 0x00625de0 with mode 1, a dress change): HP and MP before the rebuild are scaled to
 * the new maxima by `(oldMax/2 + value*newMax) / oldMax` (nearest, never the old-max-1 floor of the engine), a result below 1
 * for a pool that was above 0 gives back the OLD value, and both are then clamped to 0..new maximum.  `newMax` values are
 * the battle character's maxima AFTER the status recompute (Double HP and the limits applied).
 */
export function poolsAfterChange(before: Ffx2Pools, newMaxHp: number, newMaxMp: number): Ffx2Pools {
  const hp = scalePool(before.hp, newMaxHp, before.maxHp);
  const mp = scalePool(before.mp, newMaxMp, before.maxMp);
  return { hp: clampInt(hp, 0, newMaxHp), mp: clampInt(mp, 0, newMaxMp), maxHp: newMaxHp, maxMp: newMaxMp };
}

/**
 * The sweep after a rebuild (exe 0x00624cc0): when the girl is alive and not Ejected (status bit 10), every group-1 status
 * whose resistance byte is now 0xff (immune) is cleared from the applied mask -- except those whose flag word has 0x200
 * (Death and Eject, indices 0 and 10) -- and every group-2 status with an immune byte has its counter zeroed.  Returns the new
 * applied mask and counters and how many statuses it dropped.  The group-1 flag words are `STATUS1_INFO` (VA 0x00d484fc, a word
 * every 6 bytes).
 */
export function sweepImmuneStatuses(state: {
  dead: boolean;
  status1: number;
  applied: number;
  res1: readonly number[];
  res2: readonly number[];
  counters: readonly number[];
}): { applied: number; counters: number[]; removed: number } {
  const counters = [...state.counters];
  if (state.dead || (state.status1 & 0x400) !== 0) return { applied: state.applied, counters, removed: 0 };
  let applied = state.applied >>> 0;
  let removed = 0;
  for (let i = 0; i < 24; i++) {
    if (((STATUS1_INFO[i] ?? 0) & 0x200) === 0 && state.res1[i] === 0xff) {
      removed += 1;
      applied = (applied & ~(1 << i)) >>> 0;
    }
  }
  for (let i = 0; i < 24; i++) {
    if (state.res2[i] === 0xff) {
      removed += 1;
      counters[i] = 0;
    }
  }
  return { applied: applied | 0, counters, removed };
}

// ---------------------------------------------------------------------------------------------------
// Garment-grid gates
// ---------------------------------------------------------------------------------------------------

/** What the grid code knows about a girl's walk across her grid (kept per girl through the battle, KO and revival included; wiped when she enters a Special form). */
export interface Ffx2GateState {
  /** Gate 1..4 has been crossed (gate numbers are the 1..4 stored in the grid layout; their colours are in the menu file). */
  readonly gates: readonly [boolean, boolean, boolean, boolean];
  /** Every gate of the grid has been crossed. */
  readonly allGates: boolean;
  /** Every dressphere on the grid has been worn this battle. */
  readonly allJobs: boolean;
}

/** Is the gate condition `cond` of a grid entry satisfied (exe 0x005f4170)?  1..4 one gate, 5 gates 1+2, 6 gates 3+4, 7 gates 1+2+3, 100 all gates, 101 all dresspheres, 102 both. */
export function gateConditionMet(cond: number, s: Ffx2GateState): boolean {
  switch (cond) {
    case 1:
    case 2:
    case 3:
    case 4:
      return s.gates[cond - 1] === true;
    case 5:
      return s.gates[0] && s.gates[1];
    case 6:
      return s.gates[2] && s.gates[3];
    case 7:
      return s.gates[0] && s.gates[1] && s.gates[2];
    case 100:
      return s.allGates;
    case 101:
      return s.allJobs;
    case 102:
      return s.allJobs && s.allGates;
    default:
      return false; // 0 and 0xff are blank; anything else prints "unknown type" and adds nothing
  }
}

/**
 * The girl's eight gate-ability slots after the grid code re-evaluates her grid (exe 0x005f4170 + 0x005ec940).  The slot count
 * is reset to 0, then every grid entry whose condition holds appends its ability id at the next slot (at most 8); slots past the
 * count keep their old contents, so a slot can hold a stale id; the whole array of 8 is what the ability list reads.  An empty slot
 * is 0xff.
 */
export function gateSlotsAfter(previous: readonly number[], plateId: number, s: Ffx2GateState): { slots: number[]; count: number } {
  const slots = [...previous];
  while (slots.length < 8) slots.push(0xff);
  let count = 0;
  for (const [cond, ability] of plateRow(plateId).abilities) {
    if (cond >= 0x100 || cond === 0xff || cond === 0) continue;
    if (!gateConditionMet(cond, s)) continue;
    if (count < 8) {
      slots[count] = ability;
      count += 1;
    }
  }
  return { slots: slots.slice(0, 8), count };
}

// ---------------------------------------------------------------------------------------------------
// Special Dress Up (R1) and what a change does to the walk across the grid
// ---------------------------------------------------------------------------------------------------

/** The Special dressphere of each girl (table at VA 0x00d47ce8): Yuna's Floral Fallal, Rikku's Machina Maw, Paine's Full Throttle. */
export const FFX2_SPECIAL_JOB_OF_GIRL: readonly [number, number, number] = [0x500f, 0x5012, 0x5015];

/**
 * Whether the grid menu offers the Special form (exe 0x005f4800 sets the flag at VA 0x00df5ea8 when the menu opens): every dressphere
 * node of the girl's grid has been worn this battle, and the party owns at least one of HER Special dresspheres (the signed count in the
 * party's dressphere-item table at VA 0x00dffd1c, indexed by the Special's job number).  The menu additionally needs the girl's
 * general dress permission (`Chr+0x69` set, `Chr+0x6a` clear, no battle-wide lock; exe 0x0061d690).
 */
export function specialDressUpAvailable(allDresspheresWorn: boolean, specialItemsOwned: number): boolean {
  return allDresspheresWorn && specialItemsOwned >= 1;
}

/** How a landed dress change leaves the grid state (exe 0x005f51a0): the three modes the menu commits with. */
export type Ffx2GridChange = 'move' | 'enterSpecial' | 'leaveSpecial';

/**
 * What the grid code does at the end of a change.  A normal move marks the nodes and gates it crossed and re-evaluates the gate
 * abilities (`gateSlotsAfter`).  Entering a Special form wipes the whole walk (crossed gates, worn dresspheres, applied-ability marks)
 * and empties the eight gate slots, so the grid's progress starts over when the girl comes back.  Leaving the Special form
 * changes nothing here.  Returns what the girl keeps.
 */
export function gridProgressAfter(change: Ffx2GridChange): { clearsProgress: boolean; clearsGateSlots: boolean; marksCrossing: boolean } {
  if (change === 'enterSpecial') return { clearsProgress: true, clearsGateSlots: true, marksCrossing: false };
  if (change === 'leaveSpecial') return { clearsProgress: false, clearsGateSlots: false, marksCrossing: false };
  return { clearsProgress: false, clearsGateSlots: false, marksCrossing: true };
}

// ---------------------------------------------------------------------------------------------------
// The whole refresh
// ---------------------------------------------------------------------------------------------------

/** The battle character fields the refresh reads and writes. */
export interface Ffx2RefreshChr {
  hp: number;
  mp: number;
  maxHp: number;
  maxMp: number;
  /** `Chr+0x434`. */
  status1: number;
  /** The eight script-adjust bytes `Chr+0x39e` .. `+0x3a5` (signed). */
  adjust: readonly number[];
}

export interface Ffx2RefreshResult {
  readonly chr: { hp: number; mp: number; maxHp: number; maxMp: number; baseMaxHp: number; baseMaxMp: number; bytes: Ffx2Battle8; words: readonly [number, number, number] };
  readonly rec: Ffx2SaveRecord;
}

/**
 * The battle refresh that follows a dress change (exe 0x00625de0): `mode` 1 is the dress change, 0 keeps the pools as they were
 * (the AP-gain path uses it).  Order: remember the character's HP, MP and maxima; rebuild the save record
 * (`recalcSaveRecord`, the record's own pools follow the ratio rule if the dressphere differs from the last one built); copy
 * the record into the character (pools and maxima from the record, stat bytes plus the script adjust bytes, the three ability
 * words); rebuild the resist / element tables and sweep the statuses the new immunities remove; recompute the maxima from the
 * base ones with Double HP / MP and the limit abilities; then, in mode 1, set HP and MP from the REMEMBERED values with
 * `poolsAfterChange`; in mode 0 give the remembered values back; clamp both to 0..maximum.
 */
export function refreshAfterChange(
  chr: number,
  rec: Ffx2SaveRecord,
  battle: Ffx2RefreshChr,
  mode: 0 | 1,
  env: Ffx2RecalcEnv,
  parentExp?: number,
): Ffx2RefreshResult {
  const before: Ffx2Pools = { hp: battle.hp, mp: battle.mp, maxHp: battle.maxHp, maxMp: battle.maxMp };
  const rebuilt = recalcSaveRecord(chr, rec, env, parentExp).rec;
  const copy = setRamChrParam(chr, rebuilt, battle.adjust);
  const m = poolMaxima({
    baseMaxHp: copy.baseMaxHp,
    baseMaxMp: copy.baseMaxMp,
    status1: battle.status1,
    word0: copy.words[0],
    unlimited: false,
    hp: copy.hp,
    mp: copy.mp,
  });
  const pools = mode === 1 ? poolsAfterChange(before, m.maxHp, m.maxMp) : { hp: clampInt(before.hp, 0, m.maxHp), mp: clampInt(before.mp, 0, m.maxMp), maxHp: m.maxHp, maxMp: m.maxMp };
  return {
    chr: { hp: pools.hp, mp: pools.mp, maxHp: m.maxHp, maxMp: m.maxMp, baseMaxHp: copy.baseMaxHp, baseMaxMp: copy.baseMaxMp, bytes: copy.bytes, words: copy.words },
    rec: rebuilt,
  };
}
