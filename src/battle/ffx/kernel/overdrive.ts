/**
 * FFX Overdrive gauge kernel, part 1: the character state the gauge code touches, the gauge add (`pp_BtlOdAdd`,
 * VA 0x007b1590 with every modifier and the Overdrive-to-AP conversion), the learning counter of the 17 modes
 * (VA 0x007b10c0), the reference damage (VA 0x0078d790) and the script-driven after-action change (VA 0x007afb60).
 * The hooks that decide how much each mode gains are in `./overdrive-hooks.ts`.
 *
 * **Game case: FFX only** (FFX-2 has no Overdrive gauge; its Trance and Dressphere code is another exe). Source:
 * FFX.exe, Steam build 25501027, SHA-256 0537B2A1...686D. Spec: `research/re-ffx-overdrive-steal-aeons.md` sections 1
 * and 2. Pure, deterministic, DOM-free, not wired into the engine. The functions change an {@link OdWorld} in place,
 * the way the game changes its character structures, and return what the game returns.
 *
 * Integer rules (as `./int32.ts`): products wrap at 32 bits, divisions truncate toward zero, and a zero divisor is a
 * `RangeError` where the game faults. `udiv` is used where the machine code uses DIV.
 */

import { type ApCurveRow, apCurve, awardAp, AUTO_B, bumpStat, clamp, STAT_COUNTERS } from './ap-award.ts';
import { baseDamage } from './damage.ts';
import { cvttsd2si, mul, mul3div2, sdiv } from './int32.ts';

/** The 17 modes a party member can have, then the aeons' own mode. Names are the in-game ones. */
export const OdMode = {
  Warrior: 0,
  Comrade: 1,
  Stoic: 2,
  Healer: 3,
  Tactician: 4,
  Victim: 5,
  Dancer: 6,
  Avenger: 7,
  Slayer: 8,
  Hero: 9,
  Rook: 10,
  Victor: 11,
  Coward: 12,
  Ally: 13,
  Sufferer: 14,
  Daredevil: 15,
  Loner: 16,
  /** Every aeon: gains when hit by a monster and when it hits one. */
  Aeon: 0x13,
} as const;

/** Number of learnable modes (the counters array of a save record). */
export const OD_MODE_COUNT = 17;

/** Extra-status bits (`Chr+0x616`) the gauge code reads. */
export const ExtraBit = { Shield: 0x40, Boost: 0x80, Curse: 0x400, Doom: 0x4000 } as const;

/** Buff-flag bits (`Chr+0x640`, from the command's buff byte) the gauge code reads. */
export const BuffBit = { OdOneAndHalf: 0x20, OdDouble: 0x40 } as const;

/** One character slot, as far as the gauge code reads or writes it. Offsets are into the 0xf90-byte `Chr`. */
export interface OdSlot {
  /** `Chr+0x5bb`: the Overdrive mode. */
  mode: number;
  /** `Chr+0x5bc`: the gauge (byte). */
  gauge: number;
  /** `Chr+0x5bd`: the gauge maximum (byte): 100 for the party and monsters, 20 for the aeons. */
  gaugeMax: number;
  /** `Chr+0x594`: maximum HP. */
  maxHp: number;
  /** `Chr+0x5d0`: current HP. */
  hp: number;
  /** `Chr+0x606` (u16): permanent statuses (bit 1 Zombie, bit 3 Poison, bit 8 Confuse). */
  perm: number;
  /** `Chr+0x608`: Sleep counter. */
  sleep: number;
  /** `Chr+0x609`: Silence counter. */
  silence: number;
  /** `Chr+0x60a`: Darkness counter. */
  darkness: number;
  /** `Chr+0x614`: Slow counter. */
  slow: number;
  /** `Chr+0x616` (u16): extra statuses. */
  extra: number;
  /** `Chr+0x640`: buff flags. */
  buffs: number;
  /** `Chr+0x6be` (u16): auto-ability word B. */
  autoB: number;
  /** `Chr+0x6f0` (u32): modes whose learning counter already ran this battle (bit = mode). */
  eventFlags: number;
  /** `Chr+0x6f4`: the reference damage that scales Warrior gains. */
  refDamage: number;
  /** `Chr+0x70c` (float): the factor the Overdrive-to-AP conversion multiplies by, 1.0 at battle start, x0.9 per use. */
  apFactor: number;
  /** `Chr+0xdc8 != 0`. */
  inBattle: boolean;
  /** `Chr+0xdcc != 0`. */
  dead: boolean;
  /** `Chr+0xdcd != 0`: not eligible for AP. */
  apBlocked: boolean;
  /** `Chr+0xdce != 0`. */
  stoned: boolean;
  /** `Chr+0xdd6 != 0`: the character takes turns. */
  getsTurns: boolean;
  /** `Chr+0x714 != 0`: a script armed the after-action change. */
  afterOn: boolean;
  /** `Chr+0x715` (byte): the low bit picks which of the two scripted deltas applies. */
  afterFlag: number;
  /** `Chr+0x728`, `Chr+0x729` (signed bytes): gauge change after an action. */
  odDelta: [number, number];
  /** `Chr+0x726`, `Chr+0x727` (signed bytes): change of the energy byte. */
  energyDelta: [number, number];
  /** `Chr+0x6e1`: the energy byte, 0..100. */
  energy: number;
  /** `Chr+0x5d4`: current MP. */
  mp: number;
  /** `Chr+0x6cc` (byte): the MP the action in progress will cost. */
  mpUsed: number;
  /** `Chr+0x6cd` (byte): the Overdrive gauge the action in progress will cost. */
  odUsed: number;
  /** `Chr+0x5be` (byte): the gauge saved while Grand Summon holds the gauge at its maximum. */
  savedGauge: number;
  /** `Chr+0x5bf != 0`: the saved gauge is to be put back after the cost is paid. */
  savedFlag: boolean;
}

/** The party save record fields the gauge code touches (record = 0x94 bytes at VA 0x0113205c + id * 0x94). */
export interface OdSave {
  /** +0x60: one u16 per mode; 0xffff means "never counts", otherwise the number of battles still needed. */
  counters: number[];
  /** +0x88 (u32): bit = mode already learned. */
  learned: number;
  /** +0x3b and +0x3c: the two level bytes whose sum feeds the AP curve. */
  levelA: number;
  levelB: number;
  /** +0x50, +0x54, +0x58, +0x5c (u32): statistic counters; the fourth is bumped when the gauge fills. */
  statCounters: number[];
}

/** Everything the gauge code reads or writes. Slot index = chr id (party 0..7, aeons 8..0x11, monsters 0x14..0x1b). */
export interface OdWorld {
  slots: OdSlot[];
  /** Index = party/aeon id, 0..0x13. */
  save: OdSave[];
  /** The `ply_rom` rows of the AP curve, same index. */
  rom: ApCurveRow[];
  /** `0x02310f20`: AP earned this battle per slot. */
  apTotals: number[];
  /** Byte at VA 0x0112a916: when set, `odAdd` returns its input and changes nothing. */
  disabled: boolean;
  /** Byte at VA 0x0112c9e5: 2 is a mode (demo) in which nothing is learned or counted; any non-zero stops the learning counter. */
  demoMode: number;
  /** Byte at VA 0x0112c02b: set when a mode (or one of Tidus's Overdrives) has just been learned. */
  learnedFlag: boolean;
  /** Byte at VA 0x0112ca03: the action in progress contains Grand Summon (command 0x3118). */
  grandSummon: boolean;
  /** Tidus's Overdrive learning: use counter (VA 0x0113083c), learned bits 0..3 (word at 0x011307fc), the id just learned (0x0112c94a). */
  tidus: { uses: number; learnedWord: number; learnId: number };
}

/** Number of character slots a world holds: ids 0 to 0x1b. */
export const OD_SLOTS = 0x1c;
/** Number of party/aeon save records. */
export const OD_SAVES = 0x14;

export function newOdSlot(over: Partial<OdSlot> = {}): OdSlot {
  return {
    mode: 0,
    gauge: 0,
    gaugeMax: 0,
    maxHp: 0,
    hp: 0,
    perm: 0,
    sleep: 0,
    silence: 0,
    darkness: 0,
    slow: 0,
    extra: 0,
    buffs: 0,
    autoB: 0,
    eventFlags: 0,
    refDamage: 0,
    apFactor: 0,
    inBattle: false,
    dead: false,
    apBlocked: false,
    stoned: false,
    getsTurns: false,
    afterOn: false,
    afterFlag: 0,
    odDelta: [0, 0],
    energyDelta: [0, 0],
    energy: 0,
    mp: 0,
    mpUsed: 0,
    odUsed: 0,
    savedGauge: 0,
    savedFlag: false,
    ...over,
  };
}

export function newOdWorld(): OdWorld {
  return {
    slots: Array.from({ length: OD_SLOTS }, () => newOdSlot()),
    save: Array.from({ length: OD_SAVES }, () => ({
      counters: new Array<number>(OD_MODE_COUNT).fill(0),
      learned: 0,
      levelA: 0,
      levelB: 0,
      statCounters: new Array<number>(STAT_COUNTERS).fill(0),
    })),
    rom: Array.from({ length: OD_SAVES }, () => ({ a: 0, b: 0, c: 0, cap: 0 })),
    apTotals: new Array<number>(OD_SAVES).fill(0),
    disabled: false,
    demoMode: 0,
    learnedFlag: false,
    grandSummon: false,
    tidus: { uses: 0, learnedWord: 0, learnId: 0 },
  };
}

/** `pp_BtlIsMonster` (0x0079aef0): ids 0x14 to 0x1b. */
export function isMonster(id: number): boolean {
  return ((id & 0xff) - 0x14) >>> 0 < 8;
}

/**
 * `pp_BtlWeakLevel` (0x0078bf00): 3 when HP is 0 or below, 2 below a quarter of the maximum, 1 below half, else 0. The
 * quotient `HP * 4 / max` is signed and truncated; a maximum of 0 gives the quotient 0.
 */
export function weakLevel(hp: number, maxHp: number): number {
  const q = maxHp === 0 ? 0 : sdiv(mul(hp, 4), maxHp);
  if (hp <= 0) return 3;
  if (q < 1) return 2;
  if (q < 2) return 1;
  return 0;
}

/**
 * The reference damage `Chr+0x6f4` (`pp_BtlOdRefDamage`, 0x0078d790): the larger of the base damages of formula 0xe
 * (Strength, cubic, no defence) and 0x14 (Magic, cubic) at power 16 against the character itself. It is set at battle
 * start and whenever a script changes Strength or Magic.
 */
export function odRefDamage(str: number, mag: number): number {
  const mk = (formula: number): number =>
    baseDamage(
      {
        user: { str, mag, cheer: 0, focus: 0, maxHp: 0, maxMp: 0, hp: 0, mp: 0 },
        target: { id: 0, def: 0, mdf: 0, cheer: 0, focus: 0, maxHp: 0, maxMp: 0, baseCtb: 0, runningHp: 0, runningMp: 0, runningCtb: 0, saveCounter: 0 },
        cmd: null,
        formula,
        power: 16,
        snapshot: 0,
        mode: 1,
        variance: false,
      },
      () => 0,
    ).value;
  const a = mk(0xe);
  const b = mk(0x14);
  return a > b ? a : b;
}

/**
 * `pp_BtlOdAdd(id, chr, amount)` (0x007b1590): adds `amount` to the gauge of slot `id` and returns the amount that was
 * applied (0 when it was converted to AP, the input when nothing could be added).
 *
 * In order: nothing happens (the input is returned) when the global switch is set, or the character has Curse, is
 * dead or is Petrified. Then the amount is
 *   1. times 3 with auto-ability bit 1, else times 2 with bit 0, else times 2 with bit 2 while the weak level is at
 *      least 1 (HP below half);
 *   2. times 3 / 2 (truncating) with buff 0x20; 3. times 2 with buff 0x40;
 *   4. set to 0 with Shield (extra bit 0x40); 5. times 2 with Boost (extra bit 0x80);
 *   6. with auto-ability bit 3 (Overdrive to AP): converted to AP, see below, and the applied amount becomes 0.
 * The gauge is then `clamp(gauge + amount, 0, max)`; when that raised it to exactly the maximum, statistic counter 3
 * of the save record is bumped (slots below 0x12 only).
 *
 * The conversion: `unit = apCurve(...)`, `q = unit * amount / max` (signed, truncating; a maximum of 0 faults in the
 * game), `ap = trunc(float(float(q) * apFactor))`, `awardAp(id, ap)`, and `apFactor = float(apFactor * 0.9)`.
 */
export function odAdd(w: OdWorld, id: number, amount: number): number {
  const c = w.slots[id] as OdSlot;
  if (w.disabled) return amount | 0;
  if ((c.extra & ExtraBit.Curse) !== 0 || c.dead || c.stoned) return amount | 0;

  let a = amount | 0;
  if ((c.autoB & AUTO_B.OdTriple) !== 0) a = mul(a, 3);
  else if ((c.autoB & AUTO_B.OdDouble) !== 0) a = mul(a, 2);
  else if ((c.autoB & AUTO_B.OdLowHp) !== 0 && weakLevel(c.hp, c.maxHp) >= 1) a = mul(a, 2);
  if ((c.buffs & BuffBit.OdOneAndHalf) !== 0) a = mul3div2(a);
  if ((c.buffs & BuffBit.OdDouble) !== 0) a = (a + a) | 0;
  if ((c.extra & ExtraBit.Shield) !== 0) a = 0;
  if ((c.extra & ExtraBit.Boost) !== 0) a = (a + a) | 0;

  if ((c.autoB & AUTO_B.OdToAp) !== 0) {
    const sv = w.save[id] as OdSave;
    const unit = apCurve(w.rom[id] as ApCurveRow, sv.levelA, sv.levelB);
    const q = sdiv(mul(unit, a), c.gaugeMax & 0xff);
    const ap = cvttsd2si(Math.fround(Math.fround(q) * c.apFactor));
    awardAp(c, w.apTotals, id, ap, 0);
    a = 0;
    c.apFactor = Math.fround(c.apFactor * 0.9);
  }

  const old = c.gauge;
  const next = clamp(old + a, 0, c.gaugeMax);
  c.gauge = next;
  if (old < next && next === c.gaugeMax) {
    const sv = w.save[id];
    if (sv !== undefined) bumpStat(sv.statCounters, id, 3, w.demoMode);
  }
  return a;
}

/**
 * `pp_BtlOdModeCounter(id, mode, alsoDead)` (0x007b10c0): the learning counter. A mode is learned by seeing its event
 * in enough battles: the first time the event happens in a battle (the slot's `eventFlags` bit for the mode is clear),
 * the bit is set and the save record's counter for the mode goes down by one (never below 0). When it reaches 0 and the
 * mode is not yet learned, the "learned" flag is raised and 1 is returned. Nothing happens when the demo byte is
 * non-zero, the id is above 6, the mode above 16, the character is dead or Petrified (unless `alsoDead`), the event
 * bit is already set, or the counter is 0xffff.
 */
export function odModeCounter(w: OdWorld, id: number, mode: number, alsoDead: number): number {
  if (w.demoMode !== 0) return 0;
  if (id >>> 0 > 6 || mode >>> 0 > 0x10) return 0;
  const c = w.slots[id] as OdSlot;
  if ((c.dead || c.stoned) && alsoDead === 0) return 0;
  const bit = (1 << mode) >>> 0;
  if (((c.eventFlags >>> 0) & bit) !== 0) return 0;
  const sv = w.save[id] as OdSave;
  if (sv.counters[mode] === 0xffff) return 0;
  c.eventFlags = ((c.eventFlags >>> 0) | bit) >>> 0;
  const n = sv.counters[mode] as number;
  if (n !== 0) sv.counters[mode] = n - 1;
  if (sv.counters[mode] !== 0) return 0;
  if (((sv.learned >> mode) & 1) !== 0) return 0;
  w.learnedFlag = true;
  return 1;
}

/**
 * `pp_BtlOdAfterAction(id, chr)` (0x007afb60): after an action, when a script armed it (`afterOn`), the gauge moves by
 * the signed byte `odDelta[afterFlag & 1]` and the energy byte by `energyDelta[afterFlag & 1]`, each clamped (gauge to
 * 0..max, energy to 0..100). The flag byte is set by the hit code when the action did something (0x0078bf50). These
 * values are written by battle scripts; the party never has them armed in the shipped fights read so far.
 */
export function odAfterAction(c: OdSlot): void {
  if (!c.afterOn) return;
  const k = c.afterFlag & 1;
  c.gauge = clamp(((c.odDelta[k] as number) << 24 >> 24) + c.gauge, 0, c.gaugeMax);
  c.energy = clamp(((c.energyDelta[k] as number) << 24 >> 24) + c.energy, 0, 100);
}
