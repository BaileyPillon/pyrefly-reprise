/**
 * Parity tests for the FFX status kernels (`src/battle/ffx/kernel/status-inflict.ts`, `status-extra.ts`,
 * `status-types.ts`).
 *
 * **Game case: FFX only.** Source: FFX.exe, Steam build 25501027, SHA-256 0537B2A1...686D: status infliction and
 * cleansing 0x78ae00, extra statuses and the shatter roll 0x78b4e0, stage buffs 0x78d730, with the tables at
 * 0x00c423e8, 0x00c42420 and 0x00c42464. Spec: `research/re-ffx-ctb-status.md` sections 6 and 7.
 *
 * Roll arithmetic: a status roll is `draw % 101` (Threaten: `draw % 100`) and lands when `roll < chance - resistance`,
 * so the tests pass the roll itself as the draw (a value below 101 is its own remainder) unless a test is about the
 * modulus. Every expected number has its arithmetic in the comment. The last blocks load golden vectors from
 * `tests/fixtures/parity/ffx/status_inflict.json` and `status_extra.json`: each one is a run of the game's own
 * machine code in an x86-32 emulator with only the RNG function replaced by a script.
 */

import { describe, expect, it } from 'vitest';
import {
  applyStageBuffs,
  ExtraBit,
  inflictExtraStatus,
  inflictStatus,
  inflictStatuses,
  mergeExtraStatusWord,
  PermBit,
  ResultCounter,
  Status,
  TemporalSlot,
  toStatusOutcome,
  type InflictCommand,
  type InflictInput,
  type InflictTarget,
  type InflictUser,
  type StatusRecord,
} from '../../src/battle/ffx/kernel/status-inflict.ts';
import { calcHitDamage, type HitInput } from '../../src/battle/ffx/kernel/hitdamage.ts';
import { RngMode, rngStreamIndex } from '../../src/battle/ffx/kernel/rng.ts';
import { expandVectorInput, loadFfxParityFixture } from './helpers/ffxParityFixture.ts';
import { dense, inflictInputOf, recordOf, streamedDraw } from './helpers/ffxStatusAdapters.ts';

// ---------------------------------------------------------------------------------------------
// Builders
// ---------------------------------------------------------------------------------------------

type Sparse = Record<number, number>;
function bytes(length: number, sparse: Sparse = {}): number[] {
  const out = new Array<number>(length).fill(0);
  for (const [k, v] of Object.entries(sparse)) out[Number(k)] = v;
  return out;
}

function command(chances: Sparse, durations: Sparse = {}, over: Partial<InflictCommand> = {}): InflictCommand {
  return {
    type: 0,
    flagsMisc: 0,
    flagsDamage: 0,
    shatter: 0,
    chances: bytes(25, chances),
    durations: bytes(13, durations),
    ...over,
  };
}

function userOf(over: Partial<InflictUser> = {}): InflictUser {
  return {
    id: 0,
    agi: 10,
    ctb: 0,
    rank: 3,
    haste: 0,
    slow: 0,
    currentCommand: 0x3000,
    autoA: 0,
    weaponChances: bytes(25),
    weaponDurations: bytes(13),
    ...over,
  };
}

function targetOf(over: Partial<Omit<InflictTarget, 'resist' | 'counters'>> & { resist?: Sparse; counters?: Sparse } = {}): InflictTarget {
  const { resist, counters, ...rest } = over;
  return {
    id: 1,
    chrId: 1,
    resist: bytes(25, resist),
    perm: 0,
    counters: bytes(13, counters),
    extra: 0,
    autoPerm: 0,
    autoExtra: 0,
    extraImmune: 0,
    special: 0,
    ctb: 0,
    doomInitial: 3,
    ...rest,
  };
}

function recordOfParts(perm = 0, counters: Sparse = {}, extra = 0): StatusRecord {
  return { perm, counters: bytes(13, counters), extra };
}

function input(parts: {
  cmd: InflictCommand;
  user?: InflictUser;
  target?: InflictTarget;
  record?: StatusRecord;
  mask?: number;
  ctbDamage?: number;
  flags?: InflictInput['flags'];
}): InflictInput {
  return {
    cmd: parts.cmd,
    user: parts.user ?? userOf(),
    target: parts.target ?? targetOf(),
    record: parts.record ?? recordOfParts(),
    mask: parts.mask ?? 0,
    ctbDamage: parts.ctbDamage ?? 0,
    ...(parts.flags === undefined ? {} : { flags: parts.flags }),
  };
}

/** Run with the given raw draws; throws if the kernel asks for more. Reports how many it used. */
function run(inp: InflictInput, draws: number[] = []) {
  let used = 0;
  const result = inflictStatus(inp, () => {
    const v = draws[used];
    if (v === undefined) throw new Error(`drew ${used + 1} times, scripted ${draws.length}`);
    used += 1;
    return v;
  });
  return { ...result, used };
}

const counters = (r: { applied: number[] }) => r.applied;
const A = ResultCounter;

// ---------------------------------------------------------------------------------------------
// Chance against resistance
// ---------------------------------------------------------------------------------------------

describe('does a status land? (0x78ae00)', () => {
  const poison = (chance: number, resist: number) =>
    input({ cmd: command({ [Status.Poison]: chance }), target: targetOf({ resist: { [Status.Poison]: resist } }) });

  it('lands when roll < chance - resistance: chance 100 vs resistance 30 lands on 69 and not on 70', () => {
    expect(run(poison(100, 30), [69]).record.perm).toBe(PermBit.Poison); // 69 < 70
    expect(run(poison(100, 30), [70]).record.perm).toBe(0); // 70 < 70 is false
  });

  it('a chance of 100 with no resistance still fails on a roll of 100 (rolls run 0..100)', () => {
    expect(run(poison(100, 0), [99]).record.perm).toBe(PermBit.Poison);
    expect(run(poison(100, 0), [100]).record.perm).toBe(0);
    expect(run(poison(101, 0), [100]).record.perm).toBe(PermBit.Poison); // 100 < 101
  });

  it('a chance at or below the resistance never lands', () => {
    for (const roll of [0, 1, 50, 100]) expect(run(poison(50, 50), [roll]).record.perm, `roll ${roll}`).toBe(0);
    expect(run(poison(40, 90), [0]).record.perm).toBe(0); // 0 < -50 is false
  });

  it('the roll is the draw modulo 101 of its low 31 bits: 101 * 7 + 69 acts as 69', () => {
    expect(run(poison(100, 30), [101 * 7 + 69]).record.perm).toBe(PermBit.Poison);
    expect(run(poison(100, 30), [101 * 7 + 70]).record.perm).toBe(0);
    expect(run(poison(100, 30), [0x80000000 + 69]).record.perm).toBe(PermBit.Poison); // bit 31 is dropped
  });

  it('chance 255 always lands, even against resistance 255 or 254; chance 254 lands unless the resistance is 255', () => {
    expect(run(poison(255, 255), [100]).record.perm).toBe(PermBit.Poison);
    expect(run(poison(255, 254), [100]).record.perm).toBe(PermBit.Poison);
    expect(run(poison(254, 254), [100]).record.perm).toBe(PermBit.Poison);
    expect(run(poison(254, 255), [0]).record.perm).toBe(0);
  });

  it('resistance 255 is immune: counted as immune, nothing else', () => {
    const r = run(poison(200, 255), [0]);
    expect(r.record.perm).toBe(0);
    expect(counters(r)).toEqual([0, 0, 0, 0, 0, 1, 0, 0]); // only the "immune" counter (index 5)
  });

  it('a draw is spent for every status with a chance, even a sure one, and none for a status without', () => {
    const r = run(input({ cmd: command({ [Status.Poison]: 255, [Status.Sleep]: 254, [Status.Slow]: 1 }) }), [0, 0, 100]);
    expect(r.used).toBe(3);
    expect(r.draws).toBe(3);
    expect(run(input({ cmd: command({}) }), []).used).toBe(0);
  });

  it('draws come in status order 0..24 from one stream', () => {
    // Sleep (12) lands on its draw 10 (10 < 90), Poison (3) is drawn FIRST: roll 100 against 100 - 0 fails.
    const r = run(input({ cmd: command({ [Status.Poison]: 100, [Status.Sleep]: 90 }, { 0: 3 }) }), [100, 10]);
    expect(r.record.perm).toBe(0);
    expect(r.record.counters[TemporalSlot.Sleep]).toBe(3);
  });

  it('Death against a record that already has Zombie uses resistance 254: only chance 254 and 255 can land', () => {
    const death = (chance: number) =>
      input({
        cmd: command({ [Status.Death]: chance }),
        target: targetOf({ resist: { [Status.Death]: 0 } }),
        record: recordOfParts(PermBit.Zombie),
      });
    expect(run(death(255), [100]).record.perm & PermBit.Death).toBe(PermBit.Death);
    expect(run(death(254), [100]).record.perm & PermBit.Death).toBe(PermBit.Death); // 254 lands unless the byte is 255
    expect(run(death(253), [0]).record.perm & PermBit.Death).toBe(0); // 0 < 253 - 254 is false
    // ... while a Zombie-free record uses the target's own byte: chance 100 vs 0 lands on 99.
    expect(run(input({ cmd: command({ [Status.Death]: 100 }) }), [99]).record.perm).toBe(PermBit.Death);
  });

  it('the debug always-hit switch turns a missed roll into a hit, but never overrides resistance 255', () => {
    const flags = { debugAlwaysHit: true };
    expect(run({ ...poison(10, 0), flags }, [99]).record.perm).toBe(PermBit.Poison);
    expect(run({ ...poison(10, 255), flags }, [0]).record.perm).toBe(0);
  });

  it('the debug never-hit switch fails every status that would have landed', () => {
    const r = run({ ...poison(255, 0), flags: { debugNeverHit: true } }, [0]);
    expect(r.record.perm).toBe(0);
    expect(r.applied[A.Failed]).toBe(1);
  });
});

// ---------------------------------------------------------------------------------------------
// Threaten
// ---------------------------------------------------------------------------------------------

describe('Threaten (status 11)', () => {
  const threaten = (resist: number, parts: Partial<Parameters<typeof input>[0]> = {}) =>
    input({
      cmd: command({ [Status.Threaten]: 100 }),
      user: userOf({ id: 4, agi: 10, ctb: 0, rank: 3 }),
      target: targetOf({ resist: { [Status.Threaten]: resist }, ctb: 20 }),
      ...parts,
    });

  it('uses draw % 100 against the target byte as a success percentage: byte 70 lands on 69, not on 70', () => {
    expect(run(threaten(70), [69]).record.perm & PermBit.Threaten).toBe(PermBit.Threaten);
    expect(run(threaten(70), [70]).record.perm & PermBit.Threaten).toBe(0);
    expect(run(threaten(70), [100]).record.perm & PermBit.Threaten).toBe(PermBit.Threaten); // 100 % 100 = 0 < 70
  });

  it('a success delays the target to just after the user: damage = delay + user CTB - target CTB', () => {
    // user AGI 10 = tick 14, rank 3: delay 42; user CTB 0, target CTB 20: 42 + 0 - 20 = 22 (the target ends at 42)
    const r = run(threaten(100), [50]);
    expect(r).toMatchObject({ ctbDamage: 22, ctbDamageTouched: true, ctbFlag: 1, threatenedBy: 4 });
    expect(r.mask & 4).toBe(4); // the CTB class joins the result flags
  });

  it('the delay uses the USER Haste/Slow and rank: hasted AGI 10 at rank 3 is 21, so 21 + 5 - 20 = 6', () => {
    const r = run(threaten(100, { user: userOf({ id: 4, agi: 10, ctb: 5, rank: 3, haste: 1 }) }), [50]);
    expect(r.ctbDamage).toBe(6);
  });

  it('the byte decays to 70 percent on a success, never below 1 (100 -> 70, 1 -> 1, 255 -> 178)', () => {
    expect(run(threaten(100), [50]).resist[Status.Threaten]).toBe(70);
    expect(run(threaten(1), [0]).resist[Status.Threaten]).toBe(1); // 7 / 10 = 0 -> 1
    expect(run(threaten(255), [99]).resist[Status.Threaten]).toBe(178); // 255 * 7 / 10 = 178.5 -> 178
    expect(run(threaten(70), [70]).resist[Status.Threaten]).toBe(70); // a failure leaves it alone
  });

  it('on a success the record loses Confuse, Berserk and Provoke and both clock counters', () => {
    const r = run(
      threaten(100, { record: recordOfParts(PermBit.Confuse | PermBit.Berserk | PermBit.Provoke | PermBit.Poison, { 11: 7, 12: 9 }) }),
      [50],
    );
    expect(r.record.perm).toBe(PermBit.Threaten | PermBit.Poison); // 0x708 | 0x800 -> 0xf08 & 0xf8ff = 0x808
    expect(r.record.counters[TemporalSlot.Haste]).toBe(0);
    expect(r.record.counters[TemporalSlot.Slow]).toBe(0);
  });

  it('a byte of 0 can never land, and the miss counts as IMMUNE (the byte becomes 255 for the pop-up test)', () => {
    const r = run(threaten(0), [0]);
    expect(r.record.perm).toBe(0);
    expect(r.applied[A.Immune]).toBe(1);
    expect(r.applied[A.Failed]).toBe(0);
    // ... while a non-zero byte that misses is an ordinary failure.
    expect(run(threaten(30), [60]).applied[A.Failed]).toBe(1);
  });

  it('is refused when an equipment status of the group is present, or a clock counter is permanent (255)', () => {
    expect(run(threaten(100, { target: targetOf({ resist: { 11: 100 }, autoPerm: PermBit.Berserk }) }), [0]).record.perm).toBe(0);
    expect(run(threaten(100, { record: recordOfParts(0, { 11: 255 }) }), [0]).record.perm).toBe(0);
    expect(run(threaten(100, { record: recordOfParts(0, { 12: 255 }) }), [0]).applied[A.Failed]).toBe(1);
    expect(run(threaten(100, { record: recordOfParts(0, { 12: 254 }) }), [0]).record.perm).toBe(PermBit.Threaten);
  });

  it('it is the only status with its own CTB write: it carries the bypass flag past delay immunity', () => {
    const outcome = toStatusOutcome(run(threaten(100), [10]), 0);
    expect(outcome).toMatchObject({ ctbDamage: 22, ctbFlag: 1, maskBits: 4 });
  });
});

// ---------------------------------------------------------------------------------------------
// Permanent statuses
// ---------------------------------------------------------------------------------------------

describe('permanent statuses 0..11', () => {
  it('Confuse removes Berserk, Provoke and Threaten; Berserk removes Confuse, Provoke and Threaten', () => {
    const rec = recordOfParts(PermBit.Berserk | PermBit.Provoke | PermBit.Threaten | PermBit.Poison);
    // (0x200 | 0x400 | 0x800 | 0x8) | 0x100 = 0xf08, & 0xf1ff = 0x108
    expect(run(input({ cmd: command({ [Status.Confuse]: 255 }), record: rec }), [0]).record.perm).toBe(PermBit.Confuse | PermBit.Poison);
    const rec2 = recordOfParts(PermBit.Confuse | PermBit.Provoke | PermBit.Threaten);
    // 0xd00 | 0x200 = 0xf00, & 0xf2ff = 0x200
    expect(run(input({ cmd: command({ [Status.Berserk]: 255 }), record: rec2 }), [0]).record.perm).toBe(PermBit.Berserk);
  });

  it('Provoke removes Confuse, Berserk and Threaten, and records who provoked', () => {
    const rec = recordOfParts(PermBit.Confuse | PermBit.Berserk | PermBit.Threaten | PermBit.Poison);
    const r = run(input({ cmd: command({ [Status.Provoke]: 255 }), user: userOf({ id: 6 }), record: rec }), [0]);
    expect(r.record.perm).toBe(PermBit.Provoke | PermBit.Poison); // 0xb08 | 0x400 = 0xf08, & 0xf4ff = 0x408
    expect(r.provokedBy).toBe(6);
  });

  it('equipment-given Confuse/Berserk/Provoke/Threaten (Chr+0x62a bits 8..11) blocks those four but not Poison', () => {
    const t = targetOf({ autoPerm: PermBit.Provoke });
    for (const s of [Status.Confuse, Status.Berserk, Status.Provoke]) {
      const r = run(input({ cmd: command({ [s]: 255 }), target: t }), [0]);
      expect(r.record.perm, `status ${s}`).toBe(0);
      expect(r.applied[A.Failed]).toBe(1);
    }
    expect(run(input({ cmd: command({ [Status.Poison]: 255 }), target: t }), [0]).record.perm).toBe(PermBit.Poison);
  });

  it('a status the character already has (live word) or a Petrified record refuses the new one', () => {
    expect(run(input({ cmd: command({ [Status.Poison]: 255 }), target: targetOf({ perm: PermBit.Poison }) }), [0]).applied[A.Failed]).toBe(1);
    expect(run(input({ cmd: command({ [Status.Poison]: 255 }), record: recordOfParts(PermBit.Petrify) }), [0]).record.perm).toBe(PermBit.Petrify);
  });

  it('Petrify keeps only itself; a monster (Chr+0xc in 0x14..0x1b) also shatters at once, a party member only with the battle flag', () => {
    const cmd = command({ [Status.Petrify]: 255 });
    // extra 0x0e7f = bits 0..6 and 9..11; the record keeps only 0x813f of it: bits 0..5 (Scan, Distills), bit 8 and bit 15
    const rec = recordOfParts(PermBit.Poison | PermBit.Zombie, { 0: 3, 11: 9 }, 0x0e7f);
    const party = run(input({ cmd, target: targetOf({ chrId: 3 }), record: rec }), [0]);
    expect(party.record.perm).toBe(PermBit.Petrify);
    expect(party.record.counters).toEqual(new Array<number>(13).fill(0));
    expect(party.record.extra).toBe(0x003f); // Shield, Auto-Life, Curse and Defend go; Scan and the Distills stay
    const monster = run(input({ cmd, target: targetOf({ chrId: 0x15 }), record: rec }), [0]);
    expect(monster.record.perm).toBe(PermBit.Petrify | PermBit.Death);
    expect(monster.record.extra).toBe(0x003f | ExtraBit.Eject);
    const flagged = run(input({ cmd, target: targetOf({ chrId: 3 }), record: rec, flags: { petrifyShattersParty: true } }), [0]);
    expect(flagged.record.perm).toBe(PermBit.Petrify | PermBit.Death);
  });

  it('the Petrify mask on the extra word is 0x813f: Scan, the Distill bits, Eject (bit 8) and bit 15 survive, the rest goes', () => {
    const cmd = command({ [Status.Petrify]: 255 });
    const onParty = (extra: number) => run(input({ cmd, target: targetOf({ chrId: 3 }), record: recordOfParts(0, {}, extra) }), [0]).record.extra;
    expect(onParty(0xffff)).toBe(0x813f); // 0xffff & 0x813f
    expect(onParty(0x0100)).toBe(0x0100); // Eject stays
    expect(onParty(0x8000)).toBe(0x8000); // so does bit 15
    expect(onParty(0x7ec0)).toBe(0); // Shield, Boost, Auto-Life, Curse, Defend, Guard, Sentinel, Doom: all cleared
  });

  it('Death marks two commands specially (0x30e2 -> 3, 0x3120 -> 4)', () => {
    const cmd = command({ [Status.Death]: 255 });
    expect(run(input({ cmd, user: userOf({ currentCommand: 0x30e2 }) }), [0]).deathMarker).toBe(3);
    expect(run(input({ cmd, user: userOf({ currentCommand: 0x3120 }) }), [0]).deathMarker).toBe(4);
    expect(run(input({ cmd, user: userOf({ currentCommand: 0x3000 }) }), [0]).deathMarker).toBeNull();
  });

  it('counters: a landed Poison is "changed", class 0x40 and bad; Petrify is changed and bad only', () => {
    expect(run(input({ cmd: command({ [Status.Poison]: 255 }) }), [0]).applied).toEqual([0, 1, 0, 0, 1, 0, 0, 1]);
    expect(run(input({ cmd: command({ [Status.Petrify]: 255 }) }), [0]).applied).toEqual([1, 0, 0, 0, 1, 0, 0, 1]);
  });

  it('immunity adds a pop-up flag to the result word: Petrify 0x4000, Zombie 0x2000, Sleep 0x200, Silence 0x400, Darkness 0x800', () => {
    const immune = (s: number) =>
      run(input({ cmd: command({ [s]: 100 }), target: targetOf({ resist: { [s]: 255 } }), mask: 0x0001 }), [0]).mask;
    expect(immune(Status.Petrify)).toBe(0x4001);
    expect(immune(Status.Zombie)).toBe(0x2001);
    expect(immune(Status.Sleep)).toBe(0x0201);
    expect(immune(Status.Silence)).toBe(0x0401);
    expect(immune(Status.Darkness)).toBe(0x0801);
    expect(immune(Status.Poison)).toBe(0x0001);
  });
});

// ---------------------------------------------------------------------------------------------
// Temporal statuses, durations, Haste and Slow
// ---------------------------------------------------------------------------------------------

describe('temporal statuses 12..24', () => {
  const cast = (status: number, duration: number, parts: Partial<Parameters<typeof input>[0]> = {}) =>
    input({ cmd: command({ [status]: 255 }, { [status - 12]: duration }), ...parts });

  it('the duration byte of the command becomes the counter in the record', () => {
    expect(run(cast(Status.Sleep, 3), [0]).record.counters[TemporalSlot.Sleep]).toBe(3);
    expect(run(cast(Status.Shell, 254), [0]).record.counters[TemporalSlot.Shell]).toBe(254);
    expect(run(cast(Status.Regen, 10), [0]).record.counters[TemporalSlot.Regen]).toBe(10);
  });

  it('a status that counts down at the end of the holder\'s own turn gets +1 when the user casts it on itself', () => {
    const self = { user: userOf({ id: 2 }), target: targetOf({ id: 2 }) };
    expect(run(cast(Status.Silence, 3, self), [0]).record.counters[TemporalSlot.Silence]).toBe(4); // flag 0xcc has bit 4
    expect(run(cast(Status.Silence, 3), [0]).record.counters[TemporalSlot.Silence]).toBe(3); // on someone else: no bonus
    expect(run(cast(Status.Regen, 10, self), [0]).record.counters[TemporalSlot.Regen]).toBe(10); // Regen ticks at the START
    expect(run(cast(Status.Shell, 252, self), [0]).record.counters[TemporalSlot.Shell]).toBe(253); // 252 < 253: +1
    expect(run(cast(Status.Shell, 253, self), [0]).record.counters[TemporalSlot.Shell]).toBe(253); // 253 is not < 253
    expect(run(cast(Status.Shell, 254, self), [0]).record.counters[TemporalSlot.Shell]).toBe(254);
  });

  it('is not refreshed: a live counter above 0 refuses the new one; the record is untouched', () => {
    const r = run(cast(Status.Shell, 254, { target: targetOf({ counters: { 3: 5 } }) }), [0]);
    expect(r.record.counters[TemporalSlot.Shell]).toBe(0);
    expect(r.applied[A.Failed]).toBe(1);
  });

  it('a Petrified record takes no temporal status', () => {
    expect(run(cast(Status.Sleep, 3, { record: recordOfParts(PermBit.Petrify) }), [0]).record.counters[TemporalSlot.Sleep]).toBe(0);
  });

  it('Sleep also clears the Defend stance (extra bit 0x800)', () => {
    const r = run(cast(Status.Sleep, 3, { record: recordOfParts(0, {}, 0x0800 | 0x0040) }), [0]);
    expect(r.record.extra).toBe(0x0040);
  });

  it('class counters: Sleep is changed, class 0x20 and bad; Silence class 0x40; Shell none', () => {
    expect(run(cast(Status.Sleep, 3), [0]).applied).toEqual([1, 0, 1, 0, 1, 0, 0, 1]);
    expect(run(cast(Status.Silence, 3), [0]).applied).toEqual([0, 1, 0, 0, 1, 0, 0, 1]);
    expect(run(cast(Status.Shell, 254), [0]).applied).toEqual([1, 0, 0, 0, 1, 0, 0, 0]);
  });

  it('a weapon command uses the larger chance AND the larger duration of command and weapon', () => {
    const weaponUser = userOf({ weaponChances: bytes(25, { [Status.Sleep]: 100 }), weaponDurations: bytes(13, { 0: 5 }) });
    const withWeapon = input({ cmd: command({ [Status.Sleep]: 10 }, { 0: 3 }, { flagsMisc: 0x40000 }), user: weaponUser });
    const r = run(withWeapon, [99]); // chance max(10, 100) = 100, roll 99 < 100
    expect(r.record.counters[TemporalSlot.Sleep]).toBe(5);
    // Without the flag the weapon is ignored: chance 10, and 99 does not land.
    const without = input({ cmd: command({ [Status.Sleep]: 10 }, { 0: 3 }), user: weaponUser });
    expect(run(without, [99]).record.counters[TemporalSlot.Sleep]).toBe(0);
    // A status only the weapon carries still gets a draw.
    const onlyWeapon = input({ cmd: command({}, {}, { flagsMisc: 0x40000 }), user: weaponUser });
    expect(run(onlyWeapon, [50]).used).toBe(1);
  });
});

describe('Haste and Slow (status 23 and 24)', () => {
  const clockCmd = (status: number, chance = 254, duration = 254) => command({ [status]: chance }, { [status - 12]: duration });

  it('Haste lands: its counter is written and the Slow counter cleared; the CTB amount is left alone', () => {
    const r = run(input({ cmd: clockCmd(Status.Haste), record: recordOfParts(0, { 12: 9 }), ctbDamage: -15 }), [0]);
    expect(r.record.counters[TemporalSlot.Haste]).toBe(254);
    expect(r.record.counters[TemporalSlot.Slow]).toBe(0);
    expect(r).toMatchObject({ ctbDamage: -15, ctbDamageTouched: false });
  });

  it('Slow lands the other way round', () => {
    const r = run(input({ cmd: clockCmd(Status.Slow, 100), record: recordOfParts(0, { 11: 4 }), ctbDamage: 30 }), [0]);
    expect(r.record.counters[TemporalSlot.Slow]).toBe(254);
    expect(r.record.counters[TemporalSlot.Haste]).toBe(0);
    expect(r.ctbDamage).toBe(30);
  });

  it('when Haste or Slow does NOT take effect the hit\'s CTB amount is set to 0 (the counter must not move)', () => {
    // resistance: Slow chance 100 vs resistance 100 never lands
    const resisted = run(input({ cmd: clockCmd(Status.Slow, 100), target: targetOf({ resist: { 24: 100 } }), ctbDamage: 30 }), [0]);
    expect(resisted).toMatchObject({ ctbDamage: 0, ctbDamageTouched: true });
    expect(resisted.record.counters[TemporalSlot.Slow]).toBe(0);
    // immune
    expect(run(input({ cmd: clockCmd(Status.Slow, 100), target: targetOf({ resist: { 24: 255 } }), ctbDamage: 30 }), [0]).ctbDamage).toBe(0);
    // already hasted: the live counter is above 0
    const again = run(input({ cmd: clockCmd(Status.Haste), target: targetOf({ counters: { 11: 3 } }), ctbDamage: -15 }), [0]);
    expect(again.ctbDamage).toBe(0);
    // permanent Slow in the record blocks Haste, and so does a Threaten bit
    expect(run(input({ cmd: clockCmd(Status.Haste), record: recordOfParts(0, { 12: 255 }), ctbDamage: -15 }), [0]).ctbDamage).toBe(0);
    expect(run(input({ cmd: clockCmd(Status.Haste), record: recordOfParts(PermBit.Threaten), ctbDamage: -15 }), [0]).ctbDamage).toBe(0);
    // a Petrified record
    expect(run(input({ cmd: clockCmd(Status.Slow, 255), record: recordOfParts(PermBit.Petrify), ctbDamage: 30 }), [0]).ctbDamage).toBe(0);
  });

  it('a different status failing leaves the CTB amount alone', () => {
    const r = run(input({ cmd: command({ [Status.Poison]: 10 }), target: targetOf({ resist: { 3: 100 } }), ctbDamage: 30 }), [0]);
    expect(r).toMatchObject({ ctbDamage: 30, ctbDamageTouched: false });
  });

  it('the Haste counter is in the status table as a status that ticks at the end of the holder\'s turn', () => {
    // The self-cast +1 applies to Haste too (flag 0x0c has bit 4): 252 -> 253, but 254 stays.
    const self = { user: userOf({ id: 2 }), target: targetOf({ id: 2 }) };
    expect(run(input({ cmd: clockCmd(Status.Haste, 254, 252), ...self }), [0]).record.counters[TemporalSlot.Haste]).toBe(253);
    expect(run(input({ cmd: clockCmd(Status.Haste, 254, 254), ...self }), [0]).record.counters[TemporalSlot.Haste]).toBe(254);
  });
});

// ---------------------------------------------------------------------------------------------
// Cleansing
// ---------------------------------------------------------------------------------------------

describe('cleansing commands (Cmd+0x20 bit 5)', () => {
  const cleanse = (chances: Sparse, durations: Sparse = {}) => command(chances, durations, { flagsDamage: 0x20 });

  it('draw nothing, and remove a permanent status that is in the record', () => {
    const r = run(input({ cmd: cleanse({ [Status.Poison]: 254 }), record: recordOfParts(PermBit.Poison | PermBit.Berserk) }), []);
    expect(r.record.perm).toBe(PermBit.Berserk);
    expect(r.used).toBe(0);
    expect(r.removed).toEqual([0, 1, 0, 0, 0, 0, 0, 1]); // class 0x40 and bad
    expect(r.applied[A.Changed]).toBe(1);
  });

  it('cannot remove an equipment-given status (Chr+0x62a) or one that is not there', () => {
    const r = run(input({ cmd: cleanse({ [Status.Poison]: 254 }), record: recordOfParts(PermBit.Poison), target: targetOf({ autoPerm: PermBit.Poison }) }), []);
    expect(r.record.perm).toBe(PermBit.Poison);
    expect(r.applied[A.Failed]).toBe(1);
    expect(run(input({ cmd: cleanse({ [Status.Poison]: 254 }), record: recordOfParts(0) }), []).applied[A.Failed]).toBe(1);
  });

  it('a Petrified record can only be cleansed of Petrify itself', () => {
    const rec = recordOfParts(PermBit.Petrify | PermBit.Poison);
    expect(run(input({ cmd: cleanse({ [Status.Poison]: 254 }), record: rec }), []).record.perm).toBe(rec.perm);
    expect(run(input({ cmd: cleanse({ [Status.Petrify]: 254 }), record: rec }), []).record.perm).toBe(PermBit.Poison);
  });

  it('temporal: the duration byte is SUBTRACTED from the counter (clamped at 0); 0 and 255 counters are untouched', () => {
    const sleepCure = cleanse({ [Status.Sleep]: 254 }, { 0: 254 });
    expect(run(input({ cmd: sleepCure, record: recordOfParts(0, { 0: 3 }) }), []).record.counters[0]).toBe(0); // 3 - 254 -> 0
    expect(run(input({ cmd: cleanse({ [Status.Sleep]: 254 }, { 0: 1 }), record: recordOfParts(0, { 0: 3 }) }), []).record.counters[0]).toBe(2);
    expect(run(input({ cmd: sleepCure, record: recordOfParts(0, { 0: 255 }) }), []).record.counters[0]).toBe(255);
    expect(run(input({ cmd: sleepCure, record: recordOfParts(0, { 0: 0 }) }), []).applied[A.Failed]).toBe(1);
    // Sleep is class 0x20 and bad: removed counters Plain (no 0x40 bit), Class20, Bad all go up by one
    expect(run(input({ cmd: sleepCure, record: recordOfParts(0, { 0: 3 }) }), []).removed).toEqual([1, 0, 1, 0, 0, 0, 0, 1]);
  });

  it('removing Death revives: the revive counter of the cleanse array goes up', () => {
    const r = run(input({ cmd: cleanse({ [Status.Death]: 254 }), record: recordOfParts(PermBit.Death) }), []);
    expect(r.record.perm).toBe(0);
    expect(r.removed[A.Revived]).toBe(1);
  });

  it('a Life effect on a Zombie KILLS it (sets Death) unless the target is immune to Life (Chr+0x5b8 bit 2)', () => {
    const cmd = cleanse({ [Status.Death]: 254 });
    const rec = recordOfParts(PermBit.Zombie);
    expect(run(input({ cmd, record: rec }), []).record.perm).toBe(PermBit.Zombie | PermBit.Death);
    const immune = run(input({ cmd, record: rec, target: targetOf({ special: 4 }) }), []);
    expect(immune.record.perm).toBe(PermBit.Zombie);
    expect(immune.applied[A.Immune]).toBe(1);
  });
});

// ---------------------------------------------------------------------------------------------
// Extra statuses and the shatter roll
// ---------------------------------------------------------------------------------------------

describe('extra statuses (0x78b4e0)', () => {
  const extraCmd = (over: Partial<InflictCommand> = {}) => command({}, {}, over);
  const runExtra = (parts: {
    cmd?: InflictCommand;
    autoA?: number;
    target?: Partial<Pick<InflictTarget, 'extra' | 'autoExtra' | 'extraImmune' | 'doomInitial'>>;
    record?: StatusRecord;
    mask: number;
    draws?: number[];
    applied?: number[];
  }) => {
    let used = 0;
    const draws = parts.draws ?? [];
    const r = inflictExtraStatus(
      {
        cmd: parts.cmd ?? extraCmd(),
        user: { autoA: parts.autoA ?? 0 },
        target: { extra: 0, autoExtra: 0, extraImmune: 0, doomInitial: 3, ...parts.target },
        record: parts.record ?? recordOfParts(),
        extraMask: parts.mask,
        ...(parts.applied === undefined ? {} : { applied: parts.applied }),
      },
      () => {
        const v = draws[used];
        if (v === undefined) throw new Error('drew more than scripted');
        used += 1;
        return v;
      },
    );
    return { ...r, used };
  };

  it('there is no roll: a wanted bit just lands, and draws nothing when the target is not Petrified', () => {
    const r = runExtra({ mask: ExtraBit.Shield });
    expect(r.record.extra).toBe(ExtraBit.Shield);
    expect(r.used).toBe(0);
    expect(r.applied[A.Changed]).toBe(1);
  });

  it('a Petrified record spends ONE draw (draw % 101 < shatter) whether or not there is a shatter chance', () => {
    const rec = recordOfParts(PermBit.Petrify);
    const miss = runExtra({ mask: 0, record: rec, cmd: extraCmd({ shatter: 30 }), draws: [30] });
    expect(miss.used).toBe(1);
    expect(miss.record.perm).toBe(PermBit.Petrify); // 30 < 30 is false
    const hit = runExtra({ mask: 0, record: rec, cmd: extraCmd({ shatter: 30 }), draws: [29] });
    expect(hit.record.perm).toBe(PermBit.Petrify | PermBit.Death);
    expect(hit.record.extra).toBe(ExtraBit.Eject);
    expect(runExtra({ mask: 0, record: rec, cmd: extraCmd({ shatter: 0 }), draws: [0] }).used).toBe(1);
    expect(runExtra({ mask: 0, record: rec, cmd: extraCmd({ shatter: 100 }), draws: [100] }).record.extra).toBe(0); // 100 < 100 is false
    expect(runExtra({ mask: 0, record: rec, cmd: extraCmd({ shatter: 100 }), draws: [101 * 4 + 99] }).record.extra).toBe(ExtraBit.Eject);
  });

  it('a shattering target with Eject immunity still gets the Death bit, but not the Eject bit', () => {
    const r = runExtra({
      mask: 0,
      record: recordOfParts(PermBit.Petrify),
      cmd: extraCmd({ shatter: 100 }),
      draws: [0],
      target: { extraImmune: ExtraBit.Eject },
    });
    expect(r.record.perm).toBe(PermBit.Petrify | PermBit.Death);
    expect(r.record.extra).toBe(0);
    expect(r.applied[A.Immune]).toBe(1);
  });

  it('Eject also clears the Threaten bit; Doom restarts the countdown from Chr+0x5c9', () => {
    const eject = runExtra({ mask: ExtraBit.Eject, record: recordOfParts(PermBit.Threaten | PermBit.Poison) });
    expect(eject.record.perm).toBe(PermBit.Poison);
    const doom = runExtra({ mask: ExtraBit.Doom, target: { doomInitial: 5 } });
    expect(doom.doomCounter).toBe(5);
    expect(doom.record.extra).toBe(ExtraBit.Doom);
  });

  it('the Distill bits exclude each other in the record, and an equipment Distill blocks a new one', () => {
    const r = runExtra({ mask: ExtraBit.DistillMana, record: recordOfParts(0, {}, ExtraBit.DistillPower | ExtraBit.Shield) });
    expect(r.record.extra).toBe(ExtraBit.DistillMana | ExtraBit.Shield);
    const blocked = runExtra({ mask: ExtraBit.DistillSpeed, target: { autoExtra: ExtraBit.DistillAbility } });
    expect(blocked.record.extra).toBe(0);
    expect(blocked.applied[A.Failed]).toBe(1);
    expect(runExtra({ mask: ExtraBit.Shield, target: { autoExtra: ExtraBit.DistillAbility } }).record.extra).toBe(ExtraBit.Shield);
  });

  it('immune bits count as immune; bits the character already has fail, except Scan which can be applied again', () => {
    const immune = runExtra({ mask: ExtraBit.Curse, target: { extraImmune: ExtraBit.Curse } });
    expect(immune.record.extra).toBe(0);
    expect(immune.applied[A.Immune]).toBe(1);
    expect(runExtra({ mask: ExtraBit.Curse, target: { extra: ExtraBit.Curse } }).applied[A.Failed]).toBe(1);
    expect(runExtra({ mask: ExtraBit.Scan, target: { extra: ExtraBit.Scan } }).record.extra).toBe(ExtraBit.Scan);
  });

  it('Auto-Life from a Magic Booster user (Chr+0x6bc bit 6) casting a type 1 or 2 command sets the boost flag', () => {
    const boosted = runExtra({ mask: ExtraBit.AutoLife, autoA: 0x40, cmd: extraCmd({ type: 1 }) });
    expect(boosted.bonusFlag).toBe(1);
    expect(runExtra({ mask: ExtraBit.AutoLife, autoA: 0x40, cmd: extraCmd({ type: 3 }) }).bonusFlag).toBeNull();
    expect(runExtra({ mask: ExtraBit.AutoLife, autoA: 0, cmd: extraCmd({ type: 2 }) }).bonusFlag).toBeNull();
  });

  it('a Petrified record only takes extra bits 0..5 (and Eject from a shatter)', () => {
    const rec = recordOfParts(PermBit.Petrify);
    expect(runExtra({ mask: ExtraBit.Scan, record: rec, draws: [100] }).record.extra).toBe(ExtraBit.Scan);
    const blocked = runExtra({ mask: ExtraBit.Shield, record: rec, draws: [100] });
    expect(blocked.record.extra).toBe(0);
    expect(blocked.applied[A.Failed]).toBe(1);
  });

  it('cleansing removes a bit that is in the record and not equipment-given; an Auto-Life also clears the boost flag', () => {
    const cleanse = extraCmd({ flagsDamage: 0x20 });
    const r = runExtra({ mask: ExtraBit.AutoLife, cmd: cleanse, record: recordOfParts(0, {}, ExtraBit.AutoLife | ExtraBit.Shield) });
    expect(r.record.extra).toBe(ExtraBit.Shield);
    expect(r.bonusFlag).toBe(0);
    expect(r.removed[A.Changed]).toBe(0);
    expect(r.applied[A.Changed]).toBe(1);
    expect(runExtra({ mask: ExtraBit.Shield, cmd: cleanse, record: recordOfParts(0, {}, ExtraBit.Shield), target: { autoExtra: ExtraBit.Shield } }).record.extra).toBe(ExtraBit.Shield);
    expect(runExtra({ mask: ExtraBit.Shield, cmd: cleanse, record: recordOfParts() }).applied[A.Failed]).toBe(1);
  });

  it('the wanted word of a weapon command: the weapon\'s word, minus Distill bits if the command has its own, OR the command\'s', () => {
    expect(mergeExtraStatusWord(0x0040, 0x0080, false)).toBe(0x0040); // no weapon: the command alone
    expect(mergeExtraStatusWord(0x0040, 0x0080, true)).toBe(0x00c0);
    expect(mergeExtraStatusWord(0x0004, 0x0002 | 0x0080, true)).toBe(0x0084); // the weapon's Distill Power is dropped
    expect(mergeExtraStatusWord(0x0000, 0x0002, true)).toBe(0x0002);
  });
});

describe('stage buffs (0x78d730)', () => {
  it('each set bit of the low six adds max(amount, 1) to its stack, capped at 5; no draw, nothing lowers a stack', () => {
    expect(applyStageBuffs([0, 0, 0, 0, 0, 0], 0b000011, 1)).toEqual([1, 1, 0, 0, 0, 0]);
    expect(applyStageBuffs([4, 5, 0, 0, 0, 0], 0b000011, 1)).toEqual([5, 5, 0, 0, 0, 0]); // 4 + 1 = 5, 5 + 1 capped
    expect(applyStageBuffs([0, 0, 0, 0, 0, 0], 0b100000, 3)).toEqual([0, 0, 0, 0, 0, 3]);
    expect(applyStageBuffs([2, 0, 0, 0, 0, 0], 0b000001, 255)).toEqual([5, 0, 0, 0, 0, 0]);
  });

  it('an amount of 0 counts as 1; bits above the sixth do nothing', () => {
    expect(applyStageBuffs([0, 0, 0, 0, 0, 0], 0b000100, 0)).toEqual([0, 0, 1, 0, 0, 0]);
    expect(applyStageBuffs([1, 1, 1, 1, 1, 1], 0xffc0, 1)).toEqual([1, 1, 1, 1, 1, 1]);
  });
});

// ---------------------------------------------------------------------------------------------
// Both steps together, and into the hit pipeline
// ---------------------------------------------------------------------------------------------

describe('the two steps in the order of the hit pipeline', () => {
  it('a hit on a Petrified monster with a shatter chance spends exactly one draw and produces Death plus Eject', () => {
    const r = inflictStatuses(
      {
        ...input({
          cmd: command({}, {}, { shatter: 100 }),
          target: targetOf({ chrId: 0x14 }),
          record: recordOfParts(PermBit.Petrify),
        }),
        extraMask: 0,
      },
      () => 0,
    );
    expect(r.draws).toBe(1);
    expect(r.record.perm).toBe(PermBit.Petrify | PermBit.Death);
    expect(r.record.extra).toBe(ExtraBit.Eject);
    expect(r.outcome).toEqual({ permAfter: 5, extraAfter: 0x100, maskBits: 0, ctbDamage: null, ctbFlag: 0 });
  });

  it('draws: regular statuses first (status order), then the shatter draw; counters carry from one step to the next', () => {
    const order: string[] = [];
    let n = 0;
    const r = inflictStatuses(
      {
        ...input({
          cmd: command({ [Status.Poison]: 255, [Status.Sleep]: 255 }, { 0: 2 }, { shatter: 50 }),
          record: recordOfParts(PermBit.Petrify),
        }),
        extraMask: ExtraBit.Scan,
      },
      () => (order.push(`draw${(n += 1)}`), 99), // 99 never shatters (99 < 50 is false)
    );
    // Poison and Sleep both fail on the Petrified record (2 draws), then the shatter roll (1 draw)
    expect(order).toHaveLength(3);
    expect(r.applied[A.Failed]).toBe(2);
    expect(r.applied[A.Changed]).toBe(1); // Scan lands: a Petrified record still takes extra bits 0..5
  });

  it('feeds the hit pipeline: Haste on a character with CTB 30 halves it to 15, and a Slow that fails changes nothing', () => {
    const hasteHit = (status: ReturnType<typeof inflictStatuses>['outcome']): HitInput => ({
      user: {
        id: 1, str: 20, mag: 20, cheer: 0, focus: 0, maxHp: 1000, maxMp: 100, hp: 1000, mp: 100,
        perm: 0, autoA: 0, autoB: 0, buffFlags: 0, defaultAttack: 0x3000, currentCommand: 0x3036, bonusFlag: 0,
        weapon: { formula: 0, power: 0, element: 0 }, partyDealt: { phys: 0, mag: 0 }, scale: null,
      },
      target: {
        id: 0, def: 20, mdf: 20, cheer: 0, focus: 0, maxHp: 1000, maxMp: 100, baseCtb: 42,
        runningHp: 1000, runningMp: 100, runningCtb: 30, saveCounter: 0,
        extra: 0, special: 0, delayImmune: false, tickSpeed: 14, overkillThreshold: 100000,
        affinity: { absorb: 0, null: 0, resist: 0, weak: 0 }, partyTaken: { phys: 0, mag: 0 },
      },
      // Haste: damage class 4 (CTB), formula 0xd, power 8, a healing command (flag 0x10), status 23 with chance 254.
      cmd: { id: 0x3036, type: 2, flagsMisc: 0, flagsDamage: 0x12, damageClass: 4, formula: 0xd, power: 8, element: 0 },
      record: { perm: 0, extra: 0, shell: 0, protect: 0, nul: { tide: 0, blaze: 0, shock: 0, frost: 0 } },
      noVariance: true,
      status,
    });
    const hasteCmd = command({ [Status.Haste]: 254 }, { 11: 254 });
    const landed = inflictStatuses({ ...input({ cmd: hasteCmd }), extraMask: 0 }, () => 0);
    const out = calcHitDamage(hasteHit(landed.outcome), { draw: () => 0, hit: 0, crit: false });
    expect(out.amounts[2]).toBe(-15); // 30 * 8 / 16 = 15, negated for a heal: the counter 30 falls to 15
    // The same Haste on a target that already has it: the status is refused and the amount is zeroed.
    const refused = inflictStatuses({ ...input({ cmd: hasteCmd, target: targetOf({ counters: { 11: 9 } }), ctbDamage: -15 }), extraMask: 0 }, () => 0);
    expect(refused.outcome.ctbDamage).toBe(0);
    expect(calcHitDamage(hasteHit(refused.outcome), { draw: () => 0, hit: 0, crit: false }).amounts[2]).toBe(0);
  });
});

// ---------------------------------------------------------------------------------------------
// Golden vectors from the game's own machine code
// ---------------------------------------------------------------------------------------------

const infl = loadFfxParityFixture('status_inflict');
describe.skipIf(infl === null)('golden vectors: status infliction (tests/fixtures/parity/ffx/status_inflict.json)', () => {
  it('every vector matches: record, counters, result flags, CTB amount, side effects and the draws', () => {
    for (const v of infl?.vectors ?? []) {
      const full = expandVectorInput(infl?.defaults ?? {}, v.in) as Record<string, unknown>;
      const inp = inflictInputOf(full);
      const stream = rngStreamIndex(inp.user.id, RngMode.Status, full['userIsAeon'] === true);
      const script = streamedDraw(v.rngDraws);
      const got = inflictStatus(inp, script.draw);
      const o = v.out as Record<string, unknown>;
      const why = `vector ${v.id} (${v.class})`;
      expect(got.record, `${why} record`).toEqual(recordOf(o['record']));
      expect(got.applied, `${why} applied counters`).toEqual(dense(o['applied'], 8));
      expect(got.removed, `${why} removed counters`).toEqual(dense(o['removed'], 8));
      expect(got.resist, `${why} resistance bytes`).toEqual(dense(o['resist'], 25));
      expect(got.mask >>> 0, `${why} result flags`).toBe((o['mask'] as number) >>> 0);
      expect(got.ctbDamage, `${why} CTB amount`).toBe(o['ctbDamage']);
      expect(got.ctbDamageTouched, `${why} CTB amount written`).toBe(o['ctbDamageTouched']);
      expect(got.ctbFlag, `${why} Threaten flag`).toBe(o['ctbFlag']);
      expect(got.provokedBy, `${why} provoked by`).toBe(o['provokedBy']);
      expect(got.threatenedBy, `${why} threatened by`).toBe(o['threatenedBy']);
      expect(got.deathMarker, `${why} death marker`).toBe(o['deathMarker']);
      expect(script.calls(), `${why} draw count`).toBe(v.rngDraws?.length ?? 0);
      for (const d of v.rngDraws ?? []) expect(d.stream, `${why} stream`).toBe(stream);
    }
    expect(infl?.vectors.length ?? 0).toBeGreaterThan(200);
  });
});

const extraFx = loadFfxParityFixture('status_extra');
describe.skipIf(extraFx === null)('golden vectors: extra statuses and stage buffs (tests/fixtures/parity/ffx/status_extra.json)', () => {
  it('every vector matches: record, counters, Doom, boost flag and the shatter draw', () => {
    let stage = 0;
    for (const v of extraFx?.vectors ?? []) {
      const why = `vector ${v.id} (${v.class})`;
      if (v.class === 'stage') {
        const i = v.in as { stacks: number[]; mask: number; amount: number };
        expect(applyStageBuffs(i.stacks, i.mask, i.amount), why).toEqual(v.out);
        stage += 1;
        continue;
      }
      const full = expandVectorInput(extraFx?.defaults ?? {}, v.in) as Record<string, unknown>;
      const cmd = full['cmd'] as Record<string, number>;
      const user = full['user'] as Record<string, number>;
      const target = full['target'] as Record<string, number>;
      const script = streamedDraw(v.rngDraws);
      const got = inflictExtraStatus(
        {
          cmd: { type: cmd['type'] as number, flagsDamage: cmd['flagsDamage'] as number, shatter: cmd['shatter'] as number },
          user: { autoA: user['autoA'] as number },
          target: {
            extra: target['extra'] as number,
            autoExtra: target['autoExtra'] as number,
            extraImmune: target['extraImmune'] as number,
            doomInitial: target['doomInitial'] as number,
          },
          record: recordOf(full['record']),
          extraMask: full['extraMask'] as number,
          applied: dense(full['applied'], 8),
          removed: dense(full['removed'], 8),
          flags: (full['flags'] ?? {}) as { debugNeverHit?: boolean },
        },
        script.draw,
      );
      const o = v.out as Record<string, unknown>;
      expect(got.record, `${why} record`).toEqual(recordOf(o['record']));
      expect(got.applied, `${why} applied`).toEqual(dense(o['applied'], 8));
      expect(got.removed, `${why} removed`).toEqual(dense(o['removed'], 8));
      expect(got.doomCounter, `${why} doom`).toBe(o['doomCounter']);
      expect(got.bonusFlag, `${why} boost flag`).toBe(o['bonusFlag']);
      expect(script.calls(), `${why} draw count`).toBe(v.rngDraws?.length ?? 0);
    }
    expect(stage).toBeGreaterThan(100);
  });
});
