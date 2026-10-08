/**
 * Parity tests for one whole hit (`src/battle/ffx/kernel/hitdamage.ts`): the order of the steps, the order of the
 * random draws, the MP and CTB classes, the clamp, and real data cases.
 *
 * **Game case: FFX only.** Source: FFX.exe, Steam build 25501027, SHA-256 0537B2A1...686D, per-hit pipeline 0x78e630
 * and the functions it calls. Spec: `research/re-ffx-damage.md` section 3.
 *
 * Every expected number is worked by hand from the decompile and the disassembly (arithmetic in the comments) and was
 * also run through the real machine code in an x86-32 emulator with only the RNG, the hit roll and the status
 * infliction replaced; it agreed. The last block loads emulator golden vectors from
 * `tests/fixtures/parity/ffx/calc_hit.json` when that file exists.
 *
 * The standard hit below: an Attack (command 0x3001, formula 1, power 16, physical, cannot crit) by a user with
 * STR 20 on a target with DEF 20 and 5000 HP, variance off. Its base damage is 242 (see parity-ffx-damage.test.ts).
 */

import { describe, expect, it } from 'vitest';
import { critCheck } from '../../src/battle/ffx/kernel/crit.ts';
import {
  calcHitDamage,
  type HitInput,
  type HitIo,
  type HitOutput,
  type HitRollResult,
} from '../../src/battle/ffx/kernel/hitdamage.ts';
import { expandVectorInput, loadFfxParityFixture, scriptedDraw } from './helpers/ffxParityFixture.ts';

const FIRE = 1;
const PHYS = 1;
const MAGIC = 2;

function hit(over: {
  user?: Partial<HitInput['user']>;
  target?: Partial<HitInput['target']>;
  cmd?: Partial<HitInput['cmd']>;
  record?: Partial<HitInput['record']>;
  noVariance?: boolean;
  status?: HitInput['status'];
} = {}): HitInput {
  return {
    user: {
      id: 0, str: 20, mag: 20, cheer: 0, focus: 0, maxHp: 1000, maxMp: 100, hp: 1000, mp: 100,
      perm: 0, autoA: 0, autoB: 0, buffFlags: 0, defaultAttack: 0x3000, currentCommand: 0x3001, bonusFlag: 0,
      weapon: { formula: 0, power: 0, element: 0 }, partyDealt: { phys: 0, mag: 0 }, scale: null,
      ...over.user,
    },
    target: {
      id: 0x14, def: 20, mdf: 20, cheer: 0, focus: 0, maxHp: 5000, maxMp: 100, baseCtb: 30,
      runningHp: 5000, runningMp: 100, runningCtb: 20, saveCounter: 0,
      extra: 0, special: 0, delayImmune: false, tickSpeed: 7, overkillThreshold: 100000,
      affinity: { absorb: 0, null: 0, resist: 0, weak: 0 }, partyTaken: { phys: 0, mag: 0 },
      ...over.target,
    },
    cmd: {
      id: 0x3001, type: 0, flagsMisc: 0, flagsDamage: PHYS, damageClass: 1, formula: 1, power: 16, element: 0,
      ...over.cmd,
    },
    record: {
      perm: 0, extra: 0, shell: 0, protect: 0, nul: { tide: 0, blaze: 0, shock: 0, frost: 0 },
      ...over.record,
    },
    noVariance: over.noVariance ?? true,
    ...(over.status === undefined ? {} : { status: over.status }),
  };
}

/** Run a hit and log the order in which it asked for its random numbers. */
function run(input: HitInput, o: { roll?: HitRollResult; crit?: boolean; draws?: number[] } = {}): HitOutput & { events: string[] } {
  const events: string[] = [];
  const draws = [...(o.draws ?? [])];
  const io: HitIo = {
    draw: () => {
      events.push('draw');
      const v = draws.shift();
      if (v === undefined) throw new Error('the kernel drew more than the test scripted');
      return v;
    },
    hit: () => (events.push('hit'), o.roll ?? 0),
    crit: () => (events.push('crit'), o.crit ?? false),
  };
  return { ...calcHitDamage(input, io), events };
}

describe('a plain hit', () => {
  it('Attack 242: amount, result word, running HP, un-varied base', () => {
    const r = run(hit());
    expect(r.outcome).toBe('hit');
    expect(r.amounts).toEqual([242, 0, 0]);
    expect(r.resultMask).toBe(1); // the HP class
    expect(r.running).toEqual([4758, 100, 20]); // 5000 - 242
    expect(r.unvariedHpBase).toBe(242);
    expect(r.events).toEqual(['hit']); // the hit roll only: the command cannot crit, variance is off
  });

  it('power 0 skips every damage class', () => {
    expect(run(hit({ cmd: { power: 0 } })).amounts).toEqual([0, 0, 0]);
  });
});

describe('real data cases', () => {
  const potion = { id: 0x2000, formula: 6, power: 4, flagsDamage: 0x10 };
  const phoenix = { id: 0x2006, formula: 8, power: 8, flagsDamage: 0x10 };

  it('Potion (item 0x2000, formula 6, power 4) heals 200: 4 * 50, negated', () => {
    const r = run(hit({ cmd: potion, target: { runningHp: 1000 } }));
    expect(r.amounts[0]).toBe(-200);
    expect(r.running[0]).toBe(1200); // a heal raises the running value (no ceiling at max HP)
  });

  it('Potion on a Zombie hurts for 200 instead', () => {
    expect(run(hit({ cmd: potion, record: { perm: 2 } })).amounts[0]).toBe(200);
  });

  it('Phoenix Down (item 0x2006, formula 8, power 8) heals max HP * 8 / 16: 1500 at 3000', () => {
    expect(run(hit({ cmd: phoenix, target: { maxHp: 3000 } })).amounts[0]).toBe(-1500);
    expect(run(hit({ cmd: phoenix, target: { maxHp: 3000 }, record: { perm: 2 } })).amounts[0]).toBe(1500);
  });

  it('Alchemy doubles both (formula 6 and 8 items): -400 and -3000', () => {
    expect(run(hit({ cmd: potion, user: { autoA: 0x200 } })).amounts[0]).toBe(-400);
    expect(run(hit({ cmd: phoenix, target: { maxHp: 3000 }, user: { autoA: 0x200 } })).amounts[0]).toBe(-3000);
  });
});

describe('the order of the steps matters, because every step truncates', () => {
  // The standard hit scaled down to a few points with formula 5 (a fraction of the running HP): the damage is
  // runningHp * 4 / 16 = runningHp / 4, so runningHp 28 gives 7, 12 gives 3, 20 gives 5 and 36 gives 9.
  const small = (runningHp: number, cmd: Partial<HitInput['cmd']> = {}) => hit({ cmd: { formula: 5, power: 4, flagsDamage: 0, ...cmd }, target: { runningHp } });

  it('Shield (/4) comes before the critical hit (x2):  7 -> 1 -> 2   (crit first would give 14 / 4 = 3)', () => {
    const input = small(28, { flagsDamage: 4 });
    input.target.extra = 0x40;
    expect(run(input, { crit: true }).amounts[0]).toBe(2);
  });

  it('Shield (/4) comes before Boost (x3/2):  7 -> 1 -> 1   (Boost first: 21 / 2 = 10, then 10 / 4 = 2)', () => {
    const input = small(28);
    input.target.extra = 0xc0;
    expect(run(input).amounts[0]).toBe(1);
  });

  it('Shell (/2) comes before the element (x3/2):  3 -> 1 -> 1   (element first: 4, then 2)', () => {
    const input = small(12, { flagsDamage: MAGIC, element: FIRE });
    input.record.shell = 3;
    input.target.affinity.weak = FIRE;
    expect(run(input).amounts[0]).toBe(1);
  });

  it('the element comes before Armored (/3):  5 -> 7 -> 2   (Armored first: 1, then 1)', () => {
    const input = small(20, { element: FIRE });
    input.target.affinity.weak = FIRE;
    input.target.special = 1;
    expect(run(input).amounts[0]).toBe(2);
  });

  it('the party percent bonus comes before the element:  9 -> 9 -> 13   (element first: 13, then 13 + 1 = 14)', () => {
    // 9 + 10% of 9 (0.9 -> 0) = 9;  9 * 3 / 2 = 13
    const input = small(36, { flagsDamage: PHYS, element: FIRE });
    input.user.partyDealt.phys = 10;
    input.target.affinity.weak = FIRE;
    expect(run(input).amounts[0]).toBe(13);
  });

  it('un-varied base uses the running HP AFTER this hit:  Demi-like 250 on 1000 HP, base 187 afterwards', () => {
    const r = run(hit({ cmd: { formula: 5, power: 4 }, target: { runningHp: 1000, maxHp: 1000 } }));
    expect(r.amounts[0]).toBe(250);
    expect(r.running[0]).toBe(750);
    expect(r.unvariedHpBase).toBe(187); // 750 * 4 / 16 = 187.5
  });
});

describe('the order of the random draws', () => {
  // Fixed-with-variance formula 9, power 4: 187 at draw 0 (V 240), 200 at draw 16 (V 256), 211 at draw 31 (V 271).
  const triple = (flagsDamage: number) => hit({
    cmd: { formula: 9, power: 4, flagsDamage, damageClass: 7 },
    target: { runningMp: 500, runningCtb: 500 },
    noVariance: false,
  });

  it('HP variance, then the critical roll, then the MP variance, then the CTB variance', () => {
    const r = run(triple(4), { draws: [0, 31, 16], crit: true });
    expect(r.events).toEqual(['hit', 'draw', 'crit', 'draw', 'draw']);
    expect(r.amounts).toEqual([374, 211, 200]); // 187 doubled, 211, 200
    expect(r.resultMask).toBe(0x107); // classes 1 | 2 | 4, critical 0x100
  });

  it('a command that cannot crit never asks for the critical roll', () => {
    const r = run(triple(0), { draws: [0, 31, 16] });
    expect(r.events).toEqual(['hit', 'draw', 'draw', 'draw']);
    expect(r.amounts).toEqual([187, 211, 200]);
  });

  it('variance off draws nothing at all', () => {
    const input = triple(0);
    input.noVariance = true;
    const r = run(input);
    expect(r.events).toEqual(['hit']);
    expect(r.amounts).toEqual([200, 200, 200]);
  });

  it('a nullified hit asks for nothing (not even the hit roll); a miss asks for the hit roll only', () => {
    const nullified = triple(0);
    nullified.cmd.element = FIRE;
    nullified.record.nul.blaze = 2;
    const n = run(nullified);
    expect(n.events).toEqual([]);
    expect(n.outcome).toBe('nullified');
    expect(n.outcomeByte).toBe(2);
    expect(n.resultMask).toBe(7);
    expect(n.nul.blaze).toBe(1);
    expect(n.amounts).toEqual([0, 0, 0]);
    const m = run(triple(4), { roll: 1 });
    expect(m.events).toEqual(['hit']);
    expect(m.outcome).toBe('miss');
    expect(m.outcomeByte).toBe(1);
    expect(m.resultMask).toBe(0);
    expect(m.amounts).toEqual([0, 0, 0]);
    expect(run(triple(4), { roll: 2 }).outcome).toBe('noEffect');
  });

  it('the critical decision may also be given as a plain boolean', () => {
    const input = hit({ cmd: { flagsDamage: 5 } });
    const events: string[] = [];
    const r = calcHitDamage(input, { draw: () => (events.push('draw'), 0), hit: 0, crit: true });
    expect(r.amounts[0]).toBe(484);
    expect(events).toEqual([]);
  });

  it('plugs into the critical-check kernel: the roll comes from the same stream, after the HP variance draw', () => {
    // luck 100 -> chance 100: any roll below 100 is critical.  Draws: variance 16 (V 256), crit roll 50.
    const input = hit({ cmd: { flagsDamage: 5 }, noVariance: false });
    const draws = [16, 50];
    const draw = (): number => draws.shift() ?? 0;
    const crit = (): boolean =>
      critCheck({ cmd: { flagsDamage: 5, critBonus: 0 }, user: { luck: 100, luckStack: 0, equipmentCrit: 0, buffFlags: 0 }, target: { luck: 0, jinx: 0 } }, 0, draw).crit;
    const r = calcHitDamage(input, { draw, hit: 0, crit });
    expect(r.amounts[0]).toBe(484);
    expect(draws).toEqual([]);
  });
});

describe('the MP and CTB classes', () => {
  it('MP healing (Ether-like, formula 6 power 2): -100', () => {
    const r = run(hit({ cmd: { id: 0x2004, formula: 6, power: 2, flagsDamage: 0x10, damageClass: 2 } }));
    expect(r.amounts).toEqual([0, -100, 0]);
    expect(r.running[1]).toBe(200);
  });

  it('MP damage is capped at the target\'s running MP, and no Shield or Shell applies to it', () => {
    const cmd = { formula: 6, power: 2, flagsDamage: MAGIC, damageClass: 2 };
    expect(run(hit({ cmd, target: { runningMp: 30 } })).amounts[1]).toBe(30);
    expect(run(hit({ cmd, target: { runningMp: 500, extra: 0x40 }, record: { shell: 3 } })).amounts[1]).toBe(100);
  });

  it('CTB damage (formula 0xd, power 8) is half the running CTB', () => {
    const r = run(hit({ cmd: { formula: 0xd, power: 8, flagsDamage: 0, damageClass: 4 }, target: { runningCtb: 100 } }));
    expect(r.amounts).toEqual([0, 0, 50]);
    expect(r.resultMask).toBe(4);
  });

  it('Delay Attack adds tick * 3 / 2 and Delay Buster tick * 3 to the CTB damage (tick speed 7: 10 and 21)', () => {
    expect(run(hit({ cmd: { flagsMisc: 0x2000 } })).amounts).toEqual([242, 0, 10]);
    expect(run(hit({ cmd: { flagsMisc: 0x4000 } })).amounts).toEqual([242, 0, 21]);
    expect(run(hit({ cmd: { flagsMisc: 0x2000 } })).resultMask).toBe(5);
  });

  it('...cancelled by Threaten on the target or by delay immunity', () => {
    expect(run(hit({ cmd: { flagsMisc: 0x2000 }, record: { perm: 0x800 } })).amounts[2]).toBe(0);
    expect(run(hit({ cmd: { flagsMisc: 0x2000 }, target: { delayImmune: true } })).amounts[2]).toBe(0);
  });

  it('Auto-Life (0x311f) multiplies the HP class by 3/2 and eats the flag, so the MP class is not boosted', () => {
    // formula 3, MAG 40, power 12, MDF 0: 834 per class;  HP: 834 * 3 / 2 = 1251;  MP: 834 (flag gone)
    const input = hit({
      user: { mag: 40, bonusFlag: 1 },
      target: { mdf: 0, runningMp: 5000 },
      cmd: { id: 0x311f, formula: 3, power: 12, flagsDamage: MAGIC, damageClass: 3 },
    });
    const r = run(input);
    expect(r.amounts).toEqual([1251, 834, 0]);
    expect(r.bonusFlag).toBe(0);
  });
});

describe('weapon properties, statuses and the clamp through the whole hit', () => {
  it('a command that uses weapon properties (Cmd+0x1c bit 0x40000) takes formula, power and element from the weapon', () => {
    // weapon: formula 1, power 16, fire;  target weak to fire:  242 * 3 / 2 = 363
    const input = hit({ cmd: { flagsMisc: 0x40000, formula: 6, power: 99 }, user: { weapon: { formula: 1, power: 16, element: FIRE } } });
    input.target.affinity.weak = FIRE;
    expect(run(input).amounts[0]).toBe(363);
  });

  it('a target Petrified before and after takes nothing;  a hit that newly inflicts Death does nothing either', () => {
    expect(run(hit({ record: { perm: 4 } })).amounts).toEqual([0, 0, 0]);
    const dead = run(hit({ status: { permAfter: 1, extraAfter: 0, maskBits: 0, ctbDamage: null, ctbFlag: 0 } }));
    expect(dead.amounts).toEqual([0, 0, 0]);
    expect(dead.resultMask).toBe(0);
  });

  it('Threaten\'s own CTB damage survives delay immunity only with the bypass flag', () => {
    const status = (ctbFlag: number) => ({ permAfter: 0, extraAfter: 0, maskBits: 4, ctbDamage: 30, ctbFlag });
    expect(run(hit({ target: { delayImmune: true }, status: status(1) })).amounts[2]).toBe(30);
    expect(run(hit({ target: { delayImmune: true }, status: status(0) })).amounts[2]).toBe(0);
  });

  it('cap 9999 / Break Damage Limit / Cmd+0x20 bit 0x40; the inflicts-9999 buff; heals are capped too', () => {
    const big = { user: { str: 80 }, target: { def: 50 } }; // uncapped 10,935 (the worked table)
    expect(run(hit(big)).amounts[0]).toBe(9999);
    expect(run(hit({ ...big, user: { str: 80, autoB: 0x800 } })).amounts[0]).toBe(10935);
    expect(run(hit({ ...big, user: { str: 80, autoB: 0x800 }, cmd: { flagsDamage: 0x41 } })).amounts[0]).toBe(9999);
    expect(run(hit({ ...big, cmd: { flagsDamage: 0x81 } })).amounts[0]).toBe(10935);
    expect(run(hit({ user: { buffFlags: 8 } })).amounts[0]).toBe(9999); // 242 -> 9999
    expect(run(hit({ cmd: { formula: 6, power: 255, flagsDamage: 0x10 } })).amounts[0]).toBe(-9999);
  });

  it('the overkill bit 0x80: set when the target\'s threshold minus the HP damage is 0 or less', () => {
    expect(run(hit({ target: { overkillThreshold: 242 } })).resultMask).toBe(0x81);
    expect(run(hit({ target: { overkillThreshold: 243 } })).resultMask).toBe(0x01);
  });

  it('Shield, Defend, Sentinel, Shell, Protect and critical hits leave their bits in the result word', () => {
    expect(run(hit({ target: { extra: 0x40 } })).resultMask).toBe(0x8001);
    expect(run(hit({ record: { extra: 0x800 } })).resultMask).toBe(0x0009);
    expect(run(hit({ record: { extra: 0x2000 } })).resultMask).toBe(0x0011);
    expect(run(hit({ record: { protect: 3 } })).resultMask).toBe(0x0041);
    expect(run(hit({ cmd: { flagsDamage: MAGIC }, record: { shell: 3 } })).resultMask).toBe(0x0021);
    expect(run(hit({ cmd: { flagsDamage: 5 } }), { crit: true }).resultMask).toBe(0x0101);
  });
});

describe('golden vectors from the emulator harness (skipped until tests/fixtures/parity/ffx/calc_hit.json exists)', () => {
  const fixture = loadFfxParityFixture('calc_hit');
  it.skipIf(fixture === null)('every recorded vector matches', () => {
    if (fixture === null) return;
    for (const v of fixture.vectors) {
      const i = expandVectorInput(fixture.defaults, v.in) as Record<string, any>;
      const e = v.out as Record<string, any>;
      const script = scriptedDraw(v.rngDraws);
      const input = i as unknown as HitInput;
      const crit = (): boolean =>
        critCheck(
          {
            cmd: { flagsDamage: i['cmd'].flagsDamage, critBonus: i['cmd'].critBonus },
            user: { luck: i['user'].luck, luckStack: i['user'].luckStack, equipmentCrit: i['user'].equipmentCrit, buffFlags: i['user'].buffFlags },
            target: { luck: i['target'].luck, jinx: i['target'].jinx },
          },
          0,
          script.draw,
        ).crit;
      const r = calcHitDamage(input, { draw: script.draw, hit: i['hitRoll'], crit });
      const where = `vector ${v.id} (${v.class})`;
      expect(r.amounts, where).toEqual([e['hp'], e['mp'], e['ctb']]);
      expect(r.resultMask & 0xffff, where).toBe(e['resultMask']);
      expect(r.outcomeByte, where).toBe(e['outcomeByte']);
      expect(r.unvariedHpBase, where).toBe(e['unvariedHpBase']);
      expect(r.running, where).toEqual([e['runningHp'], e['runningMp'], e['runningCtb']]);
      expect(r.nul, where).toEqual(e['nul']);
      expect(r.bonusFlag, where).toBe(e['bonusFlag']);
      expect(r.guardMark, where).toBe(e['guardMark']);
      expect(script.calls(), where).toBe(v.rngDraws?.length ?? 0);
    }
  });
});
