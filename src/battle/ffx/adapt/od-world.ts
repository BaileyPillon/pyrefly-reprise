/**
 * The Overdrive gauge world: the engine's field as the gauge kernels read it (re-parity W5; **FFX only**).
 *
 * The gauge code of the game (`kernel/overdrive.ts`, `overdrive-hooks.ts`, `overdrive-cost.ts`) reads and writes the battle
 * character structures of the whole field: the mode, the gauge and its maximum, the HP and the status words of every slot,
 * and the per-battle learning bits. The engine keeps its combatants by string id. This module builds the field the kernels
 * read from the engine's state ({@link odFieldOf}) and carries the gauges they changed back onto the combatants with the
 * `overdrive-gauge` events the engine always emitted ({@link commitOd}); `../gauge.ts` is the engine's API over it.
 *
 * Inputs and where each comes from (`docs/handoff/re-parity-w5.md` section 1); an input the engine cannot supply is an error:
 *
 * - **Slot**: `adapt/slots.ts#slotOf` (party 0 to 6, aeons 8 to 0x11, monsters 0x14 up); a combatant with no slot is an error.
 * - **Mode**: the combatant's `overdrive.mode` as the game's number; every aeon is the game's aeon mode 0x13 whatever its
 *   build says (the engine gave aeons a placeholder `stoic`); a monster has no mode (0xff) because the game's hooks never
 *   give a monster a gain, and an enemy script writes its own gauge (`overdrive.ts#setGauge`).
 * - **Gauge and maximum**: the engine's gauge is a percentage of the bar, 0 to 100. A party member's bar is 100 points wide
 *   and a point is one percent. **An aeon's bar is 20 points wide** (`Chr+0x5bd`) and a point is five percent: the engine
 *   keeps the aeon's gauge in percent so the HUD, the builds and the chain carry are unchanged, and the kernel sees it in
 *   points (`gauge / 5`, written back as `points * 5`).
 * - **A Grand Summon's held gauge**: while the aeon holds one (`AeonFields.temporaryOverdrive`), the kernel sees the gauge at
 *   its maximum with the stored one saved beside it (`FUN_007b06e0`), exactly the game's state; a gain added while it is held
 *   clamps at the maximum and is lost, and the stored gauge is put back when the cost is paid (`FUN_007b06b0`).
 * - **Learning counters**: all `0xffff` (the game's "never counts"). The engine's builds name one mode per member and have no
 *   learning (research note O7); the kernel's counter code therefore changes nothing and its learned flag never rises.
 * - **Reference damage**: `kernel/overdrive.ts#odRefDamage` of the combatant's Strength and Magic (the engine's
 *   `estimatedDamage` is the same number).
 * - **Statuses and abilities**: `permWord`, `extraWord`, the four temporal counters, `buffByte` (Hot Spurs 0x20, Eccentrick
 *   0x40), `autoWordB` (Double, Triple, SOS Overdrive, Overdrive to AP, and an aeon's gear).
 * - **In battle**: the combatants the engine says are on the field (the aeon alone while one is out, the party's active
 *   members otherwise, the enemies on the field). **Dead** is the engine's KO. **Gets turns**: on the field and not an
 *   orders-only actor.
 * - **Level for the AP curve**: the member's Sphere Level (the note's open question 1: the engine's `sLv` stands for the sum of
 *   the two level bytes) and the curve row 2, 0, 5, 22,000 the game gives all seven members.
 */

import type { FFXCombatant, OverdriveModeId } from '../../common/types.ts';
import { OD_SLOTS, type OdWorld, OdMode, newOdWorld, odRefDamage } from '../kernel/overdrive.ts';
import { type Ctx, enemies, friendlies, has, onField, rtOf } from '../state.ts';
import { SLOT_COUNT, slotOf } from './slots.ts';
import { buffByte } from './status.ts';
import { autoWordB, counterOf, extraWord, permWord } from './words.ts';

/** The game's number of each learnable mode (the order of the counters in a save record). */
export const MODE_NUMBER: Readonly<Record<OverdriveModeId, number>> = {
  warrior: 0,
  comrade: 1,
  stoic: 2,
  healer: 3,
  tactician: 4,
  victim: 5,
  dancer: 6,
  avenger: 7,
  slayer: 8,
  hero: 9,
  rook: 10,
  victor: 11,
  coward: 12,
  ally: 13,
  sufferer: 14,
  daredevil: 15,
  loner: 16,
};

/** No mode: the number a monster, or a party member the build gave no mode, carries so no hook compares equal to it. */
const NO_MODE = 0xff;
/** `Chr+0x5bd`: the width of a party member's bar and of an aeon's. */
const BAR_PARTY = 100;
const BAR_AEON = 20;
/** The engine's percent per game point: 1 for a party member, 5 for an aeon. */
export function unitOf(c: FFXCombatant): number {
  return c.side === 'aeon' ? BAR_PARTY / BAR_AEON : 1;
}

/** The field the gauge kernels read, with the combatant in each slot and each gauge as it was built. */
export interface OdField {
  w: OdWorld;
  /** The combatant standing in each game slot, or undefined. */
  at: Array<FFXCombatant | undefined>;
  /** Each slot's kernel gauge when the field was built (or last committed). */
  before: number[];
}

/** The reference damage per Strength and Magic pair (a pure function of two bytes); a small cache for the per-hit rebuild. */
const REF_CACHE = new Map<number, number>();
function refDamageOf(str: number, mag: number): number {
  const key = str * 1024 + mag;
  let v = REF_CACHE.get(key);
  if (v === undefined) {
    v = odRefDamage(str, mag);
    if (REF_CACHE.size > 8192) REF_CACHE.clear();
    REF_CACHE.set(key, v);
  }
  return v;
}

/**
 * The game slot of a combatant, or undefined for one the table does not know (a unit test's made-up id). Every shipped party member,
 * aeon and enemy has a slot (`tests/unit/re-parity-w5-engine-wiring.test.ts` pins it); one without takes no part in the gauge hooks.
 */
export function slotIfAny(ctx: Ctx, c: FFXCombatant): number | undefined {
  try {
    return slotOf(ctx, c);
  } catch {
    return undefined;
  }
}

/** Whether an aeon is holding a Grand Summon's full gauge. */
export function holdsGrandSummon(c: FFXCombatant): boolean {
  const temp = c.aeon?.temporaryOverdrive;
  return temp !== null && temp !== undefined && temp >= 100;
}

/** Build the field the kernels read from the engine's combatants. */
export function odFieldOf(ctx: Ctx): OdField {
  const w = newOdWorld();
  const at = new Array<FFXCombatant | undefined>(SLOT_COUNT).fill(undefined);
  const before = new Array<number>(OD_SLOTS).fill(0);
  const present = new Set([...friendlies(ctx), ...enemies(ctx)].map((c) => c.id));

  for (const save of w.save) {
    save.counters.fill(0xffff);
  }
  for (let id = 0; id < 8; id++) w.rom[id] = { a: 2, b: 0, c: 5, cap: 22000 };

  for (const c of Object.values(ctx.state.combatants) as FFXCombatant[]) {
    const id = slotIfAny(ctx, c);
    if (id === undefined) continue;
    at[id] = c;
    if (id >= OD_SLOTS) continue;
    const od = c.overdrive;
    const unit = unitOf(c);
    const max = BAR_PARTY / unit;
    const stored = od ? Math.floor(Math.min(100, Math.max(0, od.gauge)) / unit) : 0;
    const held = holdsGrandSummon(c);
    const onTheField = present.has(c.id) && onField(c);
    const slot = w.slots[id]!;
    Object.assign(slot, {
      mode: c.side === 'aeon' ? OdMode.Aeon : od && c.side === 'party' ? MODE_NUMBER[od.mode] : NO_MODE,
      gauge: held ? max : stored,
      gaugeMax: max,
      maxHp: c.stats.maxHp,
      hp: c.hp,
      perm: permWord(c),
      sleep: counterOf(c, 'sleep'),
      silence: counterOf(c, 'silence'),
      darkness: counterOf(c, 'darkness'),
      slow: counterOf(c, 'slow'),
      extra: extraWord(c),
      buffs: buffByte(c),
      autoB: autoWordB(c),
      refDamage: c.side === 'enemy' ? 0 : refDamageOf(c.stats.str, c.stats.mag),
      apFactor: Math.fround(1),
      inBattle: onTheField,
      dead: !c.alive || has(c, 'ko'),
      apBlocked: has(c, 'eject'),
      stoned: has(c, 'petrify'),
      getsTurns: onTheField && rtOf(ctx, c.id).ordersOnly !== true,
      savedGauge: stored,
      savedFlag: held,
    });
    before[id] = slot.gauge;
    if (id < w.save.length) {
      const save = w.save[id]!;
      save.levelA = c.sphereGrid?.sLv ?? 0;
      save.levelB = 0;
    }
  }
  return { w, at, before };
}

/**
 * Carry the gauges the kernels changed back onto the combatants: for each slot whose gauge moved, the combatant's gauge becomes
 * `points * unit` and one `overdrive-gauge` event says so, its cause named by `cause`. A held Grand Summon gauge stays at its
 * maximum (the engine keeps the stored one), so a gain the kernel clamped away changes nothing.
 */
export function commitOd(ctx: Ctx, f: OdField, cause: (c: FFXCombatant) => string): void {
  for (let id = 0; id < OD_SLOTS; id++) {
    const c = f.at[id];
    const now = f.w.slots[id]!.gauge;
    if (c === undefined || c.overdrive === undefined || now === f.before[id]) continue;
    f.before[id] = now;
    if (holdsGrandSummon(c)) continue;
    const from = c.overdrive.gauge;
    const to = Math.max(0, Math.min(100, now * unitOf(c)));
    if (to === from) continue;
    c.overdrive.gauge = to;
    ctx.emit({ type: 'overdrive-gauge', who: c.id, from, to, cause: cause(c) });
  }
}

/** The word an event's cause carries for a combatant that gained: its mode, or the aeon cause its caller names. */
export function modeCause(c: FFXCombatant, aeonCause: string): string {
  return c.side === 'aeon' ? aeonCause : (c.overdrive?.mode ?? 'gauge');
}
