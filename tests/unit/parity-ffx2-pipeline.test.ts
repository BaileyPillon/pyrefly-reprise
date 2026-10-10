/**
 * Parity tests for the FFX-2 per-target damage orchestrator kernel (`src/battle/ffx2/kernel/pipeline.ts`,
 * `settle.ts`, `apply.ts`): the order of every modifier, the three damage classes, the all-target halving, the
 * limit, the draws, the chain counter and the HP application.
 *
 * **Game case: FFX-2 only.** Source: FFX-2.exe, Steam build 25501027 (SHA-256 6EA7F142...CD69), the orchestrator at
 * 0x6172c0 (the older copy has it at 0x6172e0), with the base formula 0x61b910, the element step 0x618780, the aid
 * scale 0x616e40, and for `apply.ts` 0x61b750, 0x61b830 and 0x643d80. Spec: `research/re-ffx2-damage.md` section 2.
 *
 * Where the expected numbers come from:
 * - hand arithmetic, shown in the comments (every `/` truncates toward zero);
 * - the real orchestrator: every scenario below was also run on the real machine code in an x86 emulator
 *   (Unicorn, the harness lane's library; scripts in `D:\Tools\ffx-parity\kernel-check-ffx2-damage\`) and gave
 *   exactly these numbers, flags and draw counts. The same kernel was compared with 33,440 emulated cases
 *   (3,000 + 30,000 random scenarios and 440 directed ones: death, Shatter, Haste/Slow rider, aided characters, gate
 *   corners, wild magnitudes) with no difference in the three damage numbers, the flag word, the surviving classes,
 *   the chain value, the back-attack flag, the estimate or the draws consumed;
 * - the last block loads `tests/fixtures/parity/ffx2/damage_target.json`, a reduced copy of those emulated cases.
 *
 * Most scenarios use formula 0xf (the damage is the power byte itself) so the base number is exactly the number in
 * the test name and the arithmetic of the modifiers is easy to follow; a few use formula 0 or 0xe.
 */

import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  CHAIN_COUNTER_MAX,
  applyHpDamage,
  applyMpDamage,
  chainAdjusted,
  shouldResetChain,
  statusSlot,
} from '../../src/battle/ffx2/kernel/apply.ts';
import {
  aidScale,
  atbValues,
  computeClassDamage,
  damageTarget,
  targetGate,
} from '../../src/battle/ffx2/kernel/pipeline.ts';
import {
  CLASS_ATB,
  CLASS_HP,
  CLASS_MP,
  RESULT_CRITICAL,
  RESULT_DEFENSE_CLAMP,
  RESULT_PROTECT,
  RESULT_SHELL,
  type DamageResult,
  type PipelineCommand,
  type PipelineInput,
  type PipelineTarget,
  type StatusPhaseOutcome,
} from '../../src/battle/ffx2/kernel/pipeline-types.ts';
import { damageCap, settleDamage, snapDamage9999 } from '../../src/battle/ffx2/kernel/settle.ts';

// ---- builders --------------------------------------------------------------------------------------------------
type Over = {
  cmd?: Partial<PipelineCommand>;
  attacker?: Partial<PipelineInput['attacker']>;
  target?: Partial<Omit<PipelineTarget, 'affinities' | 'atb'>> & { affinities?: Partial<PipelineTarget['affinities']>; atb?: PipelineTarget['atb'] };
  amount?: number;
  allTargets?: boolean;
  preview?: boolean;
  backAttack?: boolean;
  aidCount?: number;
  records?: Partial<PipelineInput['records']>;
};

/** The default fight: a Bahamut-like attacker (Lv 20, STR 71, MAG 86) hitting a monster with DEF 160, MDEF 10. */
function build(over: Over = {}): PipelineInput {
  return {
    cmd: {
      id: 0x3100, category: 0, flagsTarget: 0, flagsMisc: 0, flagsDamage: 1, damageClass: CLASS_HP, formula: 0, power: 16,
      element: 0, speciesKiller: 0, ...over.cmd,
    },
    attacker: {
      id: 0, hp: 1500, maxHp: 2000, mp: 60, maxMp: 200, str: 71, strStage: 0, mag: 86, magStage: 0, level: 20, status1: 0,
      autoAbilities650: 0, autoAbilities652: 0, weaponElement: 0, ...over.attacker,
    },
    target: {
      id: 15, hp: 5000, maxHp: 30000, def: 160, defStage: 0, mdef: 10, mdefStage: 0, mp: 500, maxMp: 500, status1: 0,
      shell: 0, protect: 0, immunePhysical: 0, immuneMagical: 0, invincible: 0, special: 0, species: 0, chain: 0, inBattle: 1,
      dead: 0, flag5ac: 0, atb: { current: 3000, max: 5000 }, ...over.target,
      affinities: { absorb: 0, nullify: 0, half: 0, weak: 0, ...over.target?.affinities },
    },
    amount: over.amount ?? 0,
    allTargets: over.allTargets ?? false,
    preview: over.preview ?? false,
    backAttack: over.backAttack ?? false,
    records: { attackerF40: 0, attackerF44: 0, targetF44: 0, ...over.records },
    ...(over.aidCount !== undefined ? { aidCount: over.aidCount } : {}),
  };
}

/** Formula 0xf: the damage is exactly `power`. */
const direct = (power: number, cmd: Partial<PipelineCommand> = {}): Over => ({ cmd: { formula: 0xf, power, ...cmd } });
const merge = (a: Over, b: Over): Over => ({
  ...a, ...b, cmd: { ...a.cmd, ...b.cmd }, attacker: { ...a.attacker, ...b.attacker },
  target: { ...a.target, ...b.target, affinities: { ...a.target?.affinities, ...b.target?.affinities } },
});

interface Play {
  r: DamageResult;
  /** The raw values the kernel drew, with the stream asked for. */
  draws: Array<{ stream: number; value: number }>;
  critCalls: number;
}

/** Run the whole orchestrator with scripted draws (default: one draw of 16, which is variance 256 = x1.0). */
function play(over: Over, script: number[] = [16], crit = false, outcome: StatusPhaseOutcome = {}): Play {
  const draws: Array<{ stream: number; value: number }> = [];
  const queue = script.slice();
  let critCalls = 0;
  const r = damageTarget(
    build(over),
    {
      draw: (stream) => {
        const value = queue.shift();
        if (value === undefined) throw new Error('the kernel drew more values than the script holds');
        draws.push({ stream, value });
        return value;
      },
      rollCrit: () => {
        critCalls += 1;
        return crit;
      },
    },
    outcome,
  );
  return { r, draws, critCalls };
}

const hp = (over: Over, script?: number[], crit?: boolean, outcome?: StatusPhaseOutcome): number => play(over, script, crit, outcome).r.hp;
const CAN_CRIT = { flagsDamage: 1 | 4 } as const;

// ---- the target gate -------------------------------------------------------------------------------------------
describe('the target gate: a target that fails it takes nothing and costs no draw', () => {
  it('a character not in the battle is not hit (the estimate is still produced)', () => {
    const p = play(merge(direct(87), { target: { inBattle: 0 } }));
    expect(p.r.gate).toBe(false);
    expect([p.r.hp, p.r.mp, p.r.atb, p.r.flags, p.r.surviving]).toEqual([0, 0, 0, 0, 0]);
    expect(p.r.estimate).toBe(87);
    expect(p.draws).toHaveLength(0);
  });

  it('commands 0x3181 and 0x31ea ignore the in-battle test', () => {
    expect(hp(merge(direct(87), { cmd: { id: 0x3181 }, target: { inBattle: 0 } }))).toBe(87);
    expect(hp(merge(direct(87), { cmd: { id: 0x31ea }, target: { inBattle: 0 } }))).toBe(87);
    expect(hp(merge(direct(87), { cmd: { id: 0x3182 }, target: { inBattle: 0 } }))).toBe(0);
  });

  it('a dead target is skipped unless the command can target the dead (flags_target 0x40)', () => {
    const dead = { dead: 1, status1: 1 };
    expect(hp(merge(direct(87), { target: dead }))).toBe(0);
    expect(hp(merge(direct(87, { flagsTarget: 0x40 }), { target: dead }))).toBe(87);
  });

  it('a flags_misc 0x40000 command needs a dead target', () => {
    expect(hp(direct(87, { flagsMisc: 0x40000 }))).toBe(0);
    expect(hp(merge(direct(87, { flagsMisc: 0x40000, flagsTarget: 0x40 }), { target: { dead: 1, status1: 1 } }))).toBe(87);
  });

  it('the byte at Chr+0x5ac equal to 1 blocks the target unless flags_target has 0x400 (2 does not)', () => {
    expect(hp(merge(direct(87), { target: { flag5ac: 1 } }))).toBe(0);
    expect(hp(merge(direct(87, { flagsTarget: 0x400 }), { target: { flag5ac: 1 } }))).toBe(87);
    expect(hp(merge(direct(87), { target: { flag5ac: 2 } }))).toBe(87);
  });

  it('targetGate is the same test as a function', () => {
    const cmd = build().cmd;
    const tgt = build().target;
    expect(targetGate(cmd, tgt)).toBe(true);
    expect(targetGate(cmd, { ...tgt, inBattle: 0 })).toBe(false);
  });
});

// ---- the HP class, step by step --------------------------------------------------------------------------------
describe('HP class: the base number, the critical hit, Berserk and the Booster', () => {
  it('formula 0, power 16, Lv 20 STR 71 against DEF 160 at x1.0 is 84 and is also the estimate', () => {
    // base 84 (see parity-ffx2-damage.test.ts); no modifier changes it
    const p = play({});
    expect(p.r.hp).toBe(84);
    expect(p.r.estimate).toBe(84);
    expect(p.r.flags).toBe(CLASS_HP);
    expect(p.r.surviving).toBe(CLASS_HP);
    expect(p.draws).toEqual([{ stream: 20, value: 16 }]);
  });

  it('a critical hit doubles the base number (84 -> 168) and sets the flag 0x100', () => {
    const p = play({ cmd: CAN_CRIT }, [16], true);
    expect(p.r.hp).toBe(168);
    expect(p.r.flags).toBe(CLASS_HP | RESULT_CRITICAL);
    expect(p.r.critical).toBe(true);
    expect(p.critCalls).toBe(1);
  });

  it('the critical decision is asked once, after the variance draw, only for a real hit of a command that can crit', () => {
    expect(play({}, [16], true).critCalls).toBe(0); // the command lacks flags_damage 4: no roll, no crit
    expect(play({ cmd: CAN_CRIT }, [16], false).critCalls).toBe(1);
    expect(play({ cmd: CAN_CRIT, preview: true }, [], true).critCalls).toBe(0); // a preview never rolls
  });

  it('Berserk is x5/4 truncated, AFTER the critical hit: base 87 crit -> 174 -> 217, not 108 -> 216', () => {
    // 87*5 = 435; /4 = 108 (108.75)               without a crit
    // crit first: 87*2 = 174; 174*5 = 870; /4 = 217 (217.5)
    // Berserk first would give 108*2 = 216
    const berserk = { attacker: { status1: 0x80 } };
    expect(hp(merge(direct(87), berserk))).toBe(108);
    expect(hp(merge(direct(87, CAN_CRIT), berserk), [16], true)).toBe(217);
  });

  it('the Booster auto-ability multiplies by 3/2 for sub-menu categories 1 and 2 only: 87 -> 130', () => {
    // 87*3 = 261; /2 = 130 (130.5)
    const booster = { attacker: { autoAbilities650: 0x20 } };
    expect(hp(merge(direct(87, { category: 1 }), booster))).toBe(130);
    expect(hp(merge(direct(87, { category: 2 }), booster))).toBe(130);
    expect(hp(merge(direct(87, { category: 0 }), booster))).toBe(87);
    expect(hp(merge(direct(87, { category: 3 }), booster))).toBe(87);
  });

  it('Berserk then Booster: 87 -> 108 -> 162', () => {
    // 108*3 = 324; /2 = 162
    expect(hp(merge(direct(87, { category: 1 }), { attacker: { status1: 0x80, autoAbilities650: 0x20 } }))).toBe(162);
  });
});

describe('HP class: item doublers, species killers, back attack', () => {
  it('item commands (ids 0x2000 to 0x2fff): Element Master doubles an elemental damaging item, Non-Element Master a plain one', () => {
    const item = (cmd: Partial<PipelineCommand>, auto: number): Over => ({ cmd: { id: 0x2005, formula: 0xf, power: 40, ...cmd }, attacker: { autoAbilities650: auto } });
    expect(hp(item({ element: 1 }, 0x200))).toBe(80); // Element Master (bit 9) on an elemental item
    expect(hp(item({ element: 1 }, 0x400))).toBe(40); // the other master does nothing
    expect(hp(item({ element: 0 }, 0x400))).toBe(80); // Non-Element Master (bit 10) on a plain item
    expect(hp(item({ element: 0 }, 0x200))).toBe(40);
    expect(hp(item({ id: 0x3005, element: 1 }, 0x200))).toBe(40); // not an item id
    expect(hp(item({ element: 1, flagsDamage: 0x11 }, 0x200))).toBe(-40); // a heal is not doubled by the damage masters
  });

  it('Medicine doubles only healing items of formula 5 or 7', () => {
    const med = (formula: number, power: number): Over => ({ cmd: { id: 0x2005, formula, power, flagsDamage: 0x11 }, attacker: { autoAbilities650: 0x100 } });
    expect(hp(med(5, 2))).toBe(-200); // 2*50 = 100, healing = -100, doubled
    expect(hp(med(0xf, 8))).toBe(-8); // formula 0xf is neither
    expect(hp({ cmd: { id: 0x2005, formula: 0xf, power: 40 }, attacker: { autoAbilities650: 0x100 } })).toBe(40); // damage: no
  });

  it('species killers: each bit the target and the command share multiplies by 4 (7 -> 28 -> 112)', () => {
    expect(hp(merge(direct(7, { speciesKiller: 0b0011 }), { target: { species: 0b0101 } }))).toBe(28); // bit 0 only
    expect(hp(merge(direct(7, { speciesKiller: 0b0111 }), { target: { species: 0b0101 } }))).toBe(112); // bits 0 and 2
    expect(hp(merge(direct(7, { speciesKiller: 0xffff }), { target: { species: 0 } }))).toBe(7);
  });

  it('a physical back attack doubles the hit (87 -> 174) and sets the back-attack flag; a magical one does not', () => {
    const p = play({ ...direct(87), backAttack: true });
    expect(p.r.hp).toBe(174);
    expect(p.r.backAttack).toBe(true);
    const magic = play({ ...direct(87, { flagsDamage: 2 }), backAttack: true });
    expect(magic.r.hp).toBe(87);
    expect(magic.r.backAttack).toBe(false);
  });
});

describe('HP class: the chain multiplier (counter + 28) / 20', () => {
  // base 87: counter 0 -> 87 (no multiplier); 1 -> 29*87/20 = 2,523/20 = 126 (126.15); 2 -> 30*87/20 = 130 (130.5);
  // 10 -> 38*87/20 = 3,306/20 = 165 (165.3); 99 -> 127*87/20 = 11,049/20 = 552 (552.45)
  it.each([
    [0, 87],
    [1, 126],
    [2, 130],
    [10, 165],
    [99, 552],
  ])('a target with chain counter %i takes %i from a base-87 hit', (counter, expected) => {
    const p = play(merge(direct(87), { target: { chain: counter } }));
    expect(p.r.hp).toBe(expected);
    expect(p.r.chain).toBe(counter);
    expect(chainAdjusted(counter, 87)).toBe(expected);
  });

  it('only a positive hit is chained: a heal is left alone, and the chain value is not recorded', () => {
    const p = play(merge(direct(87, { flagsDamage: 0x11 }), { target: { chain: 10 } }));
    expect(p.r.hp).toBe(-87);
    expect(p.r.chain).toBe(0);
    expect(chainAdjusted(10, -87)).toBe(-87);
  });

  it('the counter can reach 99 and the multiplier tops out at 127/20 = x6.35', () => {
    expect(CHAIN_COUNTER_MAX).toBe(99);
    expect(chainAdjusted(99, 20)).toBe(127); // 127*20/20
    expect(chainAdjusted(1, 20)).toBe(29);
  });

  it('the orchestrator reads the counter byte as it is: 255 (the game cannot write one) gives x283/20', () => {
    // 87*283 = 24,621; /20 = 1,231 (1,231.05)
    expect(hp(merge(direct(87), { target: { chain: 255 } }))).toBe(1231);
    expect(hp(merge(direct(20), { target: { chain: 255 } }))).toBe(283);
  });

  it('chain comes BEFORE the element step: base 11, counter 1, weak -> 30 (element first would give 31)', () => {
    // chain: 29*11 = 319; /20 = 15 (15.95); weak x2 = 30.      reversed: 22*29 = 638; /20 = 31 (31.9)
    const weak = { cmd: { element: 1 }, target: { chain: 1, affinities: { weak: 1 } } };
    expect(hp(merge(direct(11), weak))).toBe(30);
    expect(hp(merge(direct(11), { target: { chain: 1 } }))).toBe(15); // no element: 15
  });
});

describe('HP class: elements, percent immunity, Shell, Protect, Defense, immunity bytes', () => {
  const el = (element: number, aff: Partial<PipelineTarget['affinities']>): Over => merge(direct(11, { element }), { target: { affinities: aff } });

  it('the element ladder acts on the running number: weak 22, half 5, null 0, absorb -11, two weak bits 44', () => {
    expect(hp(el(1, { weak: 1 }))).toBe(22);
    expect(hp(el(1, { half: 1 }))).toBe(5); // 11/2 = 5 (5.5)
    expect(hp(el(1, { nullify: 1 }))).toBe(0);
    expect(hp(el(1, { absorb: 1 }))).toBe(-11);
    expect(hp(el(3, { weak: 3 }))).toBe(44);
  });

  it('the weapon element is added to the command element when flags_misc has 0x10000', () => {
    const weaponHit = { cmd: { formula: 0xf, power: 11, element: 0, flagsMisc: 0x10000 }, attacker: { weaponElement: 4 }, target: { affinities: { weak: 4 } } };
    expect(hp(weaponHit)).toBe(22);
    expect(hp(merge(weaponHit, { cmd: { flagsMisc: 0 } }))).toBe(11); // without the flag the weapon is ignored
  });

  it('the percent formulas 4 and 7 do nothing to a target with the "ratio" special flag, and clear the HP class', () => {
    const ratio = { target: { special: 1 } };
    const f4 = play(merge({ cmd: { formula: 4, power: 8 } }, ratio));
    expect(f4.r.hp).toBe(0);
    expect(f4.r.surviving).toBe(0);
    expect(f4.r.blocked).toBe(1);
    expect(f4.r.estimate).toBe(2500); // 5,000*8/16: the estimate still shows the plain number
    expect(hp(merge({ cmd: { formula: 7, power: 8 } }, ratio))).toBe(0);
    expect(hp({ cmd: { formula: 4, power: 8 } })).toBe(2500);
    expect(hp(merge({ cmd: { formula: 0, power: 16 } }, ratio))).toBe(84); // other formulas are not stopped
  });

  it('Shell halves magical hits and Protect halves physical ones (11 -> 5), and each sets its flag', () => {
    const shell = play(merge(direct(11, { flagsDamage: 2 }), { target: { shell: 5 } }));
    expect([shell.r.hp, shell.r.flags]).toEqual([5, CLASS_HP | RESULT_SHELL]);
    const protect = play(merge(direct(11), { target: { protect: 5 } }));
    expect([protect.r.hp, protect.r.flags]).toEqual([5, CLASS_HP | RESULT_PROTECT]);
    expect(hp(merge(direct(11), { target: { shell: 5 } }))).toBe(11); // wrong kind
    expect(hp(merge(direct(11, { flagsDamage: 2 }), { target: { protect: 5 } }))).toBe(11);
  });

  it('half from the element, then Shell: 11 -> 5 -> 2', () => {
    expect(hp(merge(direct(11, { flagsDamage: 2, element: 1 }), { target: { affinities: { half: 1 }, shell: 5 } }))).toBe(2);
  });

  it('Defense clamps a physical hit to exactly 1 (a heal to exactly -1) and sets flag 8; a zero stays 0; magic is not clamped', () => {
    const defense = { target: { status1: 0x200 } };
    const hit = play(merge(direct(87), defense));
    expect([hit.r.hp, hit.r.flags]).toEqual([1, CLASS_HP | RESULT_DEFENSE_CLAMP]);
    expect(hp(merge(direct(87, { flagsDamage: 0x11 }), defense))).toBe(-1);
    expect(play(merge(direct(0), defense)).r.hp).toBe(0);
    expect(hp(merge(direct(87, { flagsDamage: 2 }), defense))).toBe(87);
  });

  it('Protect then Defense: 87 -> 43 -> 1, both flags set', () => {
    const p = play(merge(direct(87), { target: { status1: 0x200, protect: 5 } }));
    expect(p.r.hp).toBe(1);
    expect(p.r.flags).toBe(CLASS_HP | RESULT_PROTECT | RESULT_DEFENSE_CLAMP);
  });

  it('the immunity bytes zero a POSITIVE hit of their kind: physical, magical, or Invincible; a heal passes', () => {
    expect(hp(merge(direct(87), { target: { immunePhysical: 1 } }))).toBe(0);
    expect(hp(merge(direct(87), { target: { immuneMagical: 1 } }))).toBe(87); // wrong kind
    const magic = play(merge(direct(87, { flagsDamage: 2 }), { target: { immuneMagical: 1 } }));
    expect([magic.r.hp, magic.r.surviving, magic.r.blocked]).toEqual([0, 0, 1]);
    expect(hp(merge(direct(87), { target: { invincible: 1 } }))).toBe(0);
    expect(hp(merge(direct(87, { flagsDamage: 0x11 }), { target: { invincible: 1 } }))).toBe(-87);
  });
});

// ---- ordering effects ------------------------------------------------------------------------------------------
describe('ordering: where another order of the same steps would truncate differently', () => {
  it('the whole chain at once: crit, Berserk, back attack, chain 3, weak element, Protect on a base of 87 -> 672', () => {
    // 87 crit -> 174; Berserk 174*5 = 870; /4 = 217 (217.5); back attack x2 = 434
    // chain (3+28)*434 = 13,454; /20 = 672 (672.7); weak x2 = 1,344; Protect /2 = 672
    // (a float chain would read 87*2*1.25*2*1.55*2/2 = 673.6 -> 673)
    const whole = merge(direct(87, { ...CAN_CRIT, element: 1 }), {
      attacker: { status1: 0x80 },
      target: { chain: 3, protect: 5, affinities: { weak: 1 } },
    });
    const p = play({ ...whole, backAttack: true }, [16], true);
    expect(p.r.hp).toBe(672);
    expect(p.r.flags).toBe(CLASS_HP | RESULT_CRITICAL | RESULT_PROTECT);
    expect(p.r.chain).toBe(3);
    // without the back attack: 217*31 = 6,727; /20 = 336 (336.35); x2 = 672; /2 = 336
    expect(play(whole, [16], true).r.hp).toBe(336);
  });

  it('the back attack and the species killers come before the chain: 11 -> 22 -> 31 and 11 -> 44 -> 63', () => {
    // back attack: 11*2 = 22; chain 1: 29*22 = 638; /20 = 31 (31.9).   Chain first would give 15 (15.95), then 30
    expect(hp(merge(direct(11), { backAttack: true, target: { chain: 1 } }))).toBe(31);
    // killer: 11*4 = 44; chain 1: 29*44 = 1,276; /20 = 63 (63.8).      Chain first would give 15, then 60
    expect(hp(merge(direct(11, { speciesKiller: 1 }), { target: { chain: 1, species: 1 } }))).toBe(63);
  });

  it('the Booster comes before the species killers: 7 -> 10 -> 40 (killers first would give 28 -> 42)', () => {
    // 7*3 = 21; /2 = 10 (10.5); *4 = 40
    const over = merge(direct(7, { category: 1, speciesKiller: 1 }), { attacker: { autoAbilities650: 0x20 }, target: { species: 1 } });
    expect(hp(over)).toBe(40);
  });

  it('a heal (a negative number) rounds toward zero at every step', () => {
    // Berserk: -3*5 = -15; /4 = -3 (toward zero; a floor would give -4)
    expect(hp(merge(direct(3, { flagsDamage: 0x11 }), { attacker: { status1: 0x80 } }))).toBe(-3);
    // Booster: -3*3 = -9; /2 = -4 (-4.5 toward zero);  -5*3 = -15; /2 = -7
    const booster = { attacker: { autoAbilities650: 0x20 } };
    expect(hp(merge(direct(3, { flagsDamage: 0x11, category: 1 }), booster))).toBe(-4);
    expect(hp(merge(direct(5, { flagsDamage: 0x11, category: 1 }), booster))).toBe(-7);
    // all-target: -5/2 = -2; element half: -7/2 = -3; element weak: -7*2 = -14
    expect(hp({ ...direct(5, { flagsDamage: 0x11, flagsTarget: 0x80 }), allTargets: true })).toBe(-2);
    expect(hp(merge(direct(7, { flagsDamage: 0x11, element: 1 }), { target: { affinities: { half: 1 } } }))).toBe(-3);
    expect(hp(merge(direct(7, { flagsDamage: 0x11, element: 1 }), { target: { affinities: { weak: 1 } } }))).toBe(-14);
  });

  it('halving happens after Shell and Protect, one truncation each: 11 with Shell and all-target -> 5 -> 2', () => {
    const p = play(merge(direct(11, { flagsDamage: 2, flagsTarget: 0x80 }), { target: { shell: 5 }, allTargets: true }));
    expect(p.r.hp).toBe(2);
    expect(p.r.flags).toBe(CLASS_HP | RESULT_SHELL);
  });

  it('the limit comes after the halving: 29,997 all-target halves to 14,998 and is then capped at 9,999, not 4,999', () => {
    const f = { cmd: { formula: 0xe, power: 3, flagsTarget: 0x80 }, allTargets: true } as const;
    expect(play(f).r.hp).toBe(9999);
    expect(play({ cmd: { formula: 0xe, power: 3 } }).r.estimate).toBe(29997);
  });
});

// ---- all-target halving ----------------------------------------------------------------------------------------
describe('all-target halving (Cmd.flags_target & 0x80 and ActionRec+0x27 != 0)', () => {
  const half = (over: Over): number => hp(over);

  it('halves the hit toward zero: 87 -> 43, and a heal -87 -> -43', () => {
    expect(half({ ...direct(87, { flagsTarget: 0x80 }), allTargets: true })).toBe(43);
    expect(half({ ...direct(87, { flagsTarget: 0x80, flagsDamage: 0x11 }), allTargets: true })).toBe(-43);
  });

  it('needs both the command flag and the action byte (scripted boss commands leave the byte at 0)', () => {
    expect(half({ ...direct(87, { flagsTarget: 0x80 }), allTargets: false })).toBe(87);
    expect(half({ ...direct(87, { flagsTarget: 0 }), allTargets: true })).toBe(87);
  });

  it('halves the MP and ATB numbers too', () => {
    const p = play({ cmd: { formula: 0xf, power: 60, damageClass: 7, flagsMisc: 0x1000, flagsTarget: 0x80 }, allTargets: true }, [16, 16, 16]);
    expect([p.r.hp, p.r.mp, p.r.atb]).toEqual([30, 30, 2000]); // 60/2, 60/2, 4,000/2
  });
});

// ---- the limit and Damage 9999 ---------------------------------------------------------------------------------
describe('the damage limit and the Damage 9999 status', () => {
  const big = (power: number, cmd: Partial<PipelineCommand> = {}, attacker: Over['attacker'] = {}): Over => ({ cmd: { formula: 0xe, power, ...cmd }, attacker });

  it('the limit is 9,999 by default and 99,999 with the Break Damage Limit ability or flags_damage 0x80; 0x40 forces 9,999', () => {
    expect(play(big(3)).r.hp).toBe(9999); // 3*9999 = 29,997 -> 9,999
    expect(play(big(3, {}, { autoAbilities652: 1 })).r.hp).toBe(29997);
    expect(play(big(3, { flagsDamage: 1 | 0x40 }, { autoAbilities652: 1 })).r.hp).toBe(9999);
    expect(play(big(3, { flagsDamage: 1 | 0x80 })).r.hp).toBe(29997);
    expect(play(big(11, {}, { autoAbilities652: 1 })).r.hp).toBe(99999); // 109,989 -> 99,999
    expect(damageCap(0, 1)).toBe(9999);
    expect(damageCap(1, 1)).toBe(99999);
    expect(damageCap(1, 0x41)).toBe(9999);
    expect(damageCap(0, 0x81)).toBe(99999);
  });

  it('the limit is symmetric: a big heal is capped at -9,999 (or -99,999)', () => {
    expect(play(big(3, { flagsDamage: 0x11 })).r.hp).toBe(-9999);
    expect(play(big(11, { flagsDamage: 0x11 }, { autoAbilities652: 1 })).r.hp).toBe(-99999);
  });

  it('the Damage 9999 attacker status snaps a small HP number to 9,999 (a heal to -9,999) and leaves 0 alone', () => {
    const d = { status1: 0x4000 };
    expect(hp(merge(direct(50), { attacker: d }))).toBe(9999);
    expect(hp(merge(direct(0), { attacker: d }))).toBe(0);
    expect(hp(merge(direct(50, { flagsDamage: 0x11 }), { attacker: d }))).toBe(-9999);
    expect(hp(merge(direct(1), { attacker: d }))).toBe(9999);
    expect(hp(merge(big(2), { attacker: d }))).toBe(9999); // 19,998 stays above the snap range, then the limit
    expect(snapDamage9999(9998)).toBe(9999);
    expect(snapDamage9999(9999)).toBe(9999);
    expect(snapDamage9999(10000)).toBe(10000);
    expect(snapDamage9999(-9998)).toBe(-9999);
    expect(snapDamage9999(0)).toBe(0);
  });

  it('the snap is for the HP number only: an MP-class hit keeps its value', () => {
    const p = play(merge(direct(50, { damageClass: CLASS_MP }), { attacker: { status1: 0x4000 } }));
    expect([p.r.hp, p.r.mp]).toEqual([0, 50]);
  });
});

// ---- the MP and ATB classes ------------------------------------------------------------------------------------
describe('MP class: base, Booster, doublers and species killers, capped by the target MP, then the immunity bytes', () => {
  const mpHit = (power: number, over: Over = {}): Over => merge(direct(power, { damageClass: CLASS_MP }), over);

  it('a plain MP hit of 200 against 500 MP does 200; against 150 MP it is cut to 150', () => {
    const p = play(mpHit(200));
    expect([p.r.hp, p.r.mp, p.r.flags, p.r.surviving]).toEqual([0, 200, CLASS_MP, CLASS_MP]);
    expect(hp(mpHit(200, { target: { mp: 150 } }))).toBe(0);
    expect(play(mpHit(200, { target: { mp: 150 } })).r.mp).toBe(150);
  });

  it('the Booster applies before the MP cap: 200 -> 300 against 500, but still 150 against 150', () => {
    const booster = { cmd: { category: 1 }, attacker: { autoAbilities650: 0x20 } };
    expect(play(mpHit(200, booster)).r.mp).toBe(300);
    expect(play(mpHit(200, merge(booster, { target: { mp: 150 } }))).r.mp).toBe(150);
  });

  it('none of Berserk, the critical hit, back attack, chain, element, Shell or Protect applies to the MP class', () => {
    expect(play(mpHit(100, { attacker: { status1: 0x80 } })).r.mp).toBe(100);
    expect(play(mpHit(100, { cmd: { flagsDamage: 2, element: 1 }, target: { affinities: { weak: 1 }, shell: 5 } })).r.mp).toBe(100);
    expect(play(mpHit(100, { target: { chain: 10 }, backAttack: true })).r.mp).toBe(100);
  });

  it('an MP heal (negative) is not cut by the target MP', () => {
    expect(play(mpHit(200, { cmd: { flagsDamage: 0x12 }, target: { mp: 10 } })).r.mp).toBe(-200);
  });

  it('the immunity bytes cancel a positive MP hit and clear the MP class', () => {
    const p = play(mpHit(100, { cmd: { flagsDamage: 2 }, target: { immuneMagical: 1 } }));
    expect([p.r.mp, p.r.surviving]).toEqual([0, 0]);
  });
});

describe('ATB class: delay damage and the other formulas on the ATB pool', () => {
  it('flags_misc 0x1000 / 0x2000 force the ATB class with formula 0x18: 4,000, 8,000, 12,000 (capped at 9,999)', () => {
    const delay = (misc: number): Over => ({ cmd: { formula: 0, power: 16, damageClass: 0, flagsMisc: misc } });
    expect(play(delay(0x1000)).r.atb).toBe(4000);
    expect(play(delay(0x2000)).r.atb).toBe(8000);
    expect(play(delay(0x3000)).r.atb).toBe(9999);
    const p = play(delay(0x1000));
    expect(p.r.flags).toBe(CLASS_ATB);
    expect(p.r.estimate).toBe(84); // the estimate is the plain HP number of the original formula
  });

  it('a delay command that also damages HP keeps its HP formula and adds the ATB number (two draws)', () => {
    const p = play({ cmd: { formula: 0, power: 16, damageClass: CLASS_HP, flagsMisc: 0x1000 } }, [16, 16]);
    expect([p.r.hp, p.r.atb]).toEqual([84, 4000]);
    expect(p.draws).toHaveLength(2);
  });

  it('the ATB pool is what formulas 4 and 7 read: the target recovery (or charge) and its maximum', () => {
    const pool = { atb: { current: 3000, max: 5000 } };
    expect(play({ cmd: { formula: 4, power: 16, damageClass: CLASS_ATB }, target: pool }).r.atb).toBe(3000); // 3,000*16/16
    expect(play({ cmd: { formula: 7, power: 8, damageClass: CLASS_ATB }, target: pool }).r.atb).toBe(2500); // 5,000*8/16
    expect(atbValues({ charging: false, chargeRemaining: 0, chargeMax: 0, recoveryRemaining: 3000, recoveryMax: 5000 })).toEqual({ current: 3000, max: 5000 });
    expect(atbValues({ charging: true, chargeRemaining: 800, chargeMax: 1000, recoveryRemaining: 3000, recoveryMax: 5000 })).toEqual({ current: 800, max: 1000 });
    expect(atbValues({ charging: true, chargeRemaining: 800, chargeMax: 0, recoveryRemaining: -7, recoveryMax: 5000 })).toEqual({ current: 0, max: 5000 });
  });

  it('a target with the "no ATB damage" special flag, or any immunity byte, takes none; Shell and Protect do not apply', () => {
    const hit: Over = { cmd: { formula: 0xf, power: 50, damageClass: CLASS_ATB } };
    expect(play(hit).r.atb).toBe(50);
    expect(play(merge(hit, { target: { special: 0x40 } })).r.atb).toBe(0);
    expect(play(merge(hit, { target: { invincible: 1 } })).r.atb).toBe(0);
    expect(play(merge(hit, { cmd: { flagsDamage: 2 }, target: { shell: 5 } })).r.atb).toBe(50);
  });

  it('the ATB class never leaves its own bit in the surviving mask', () => {
    expect(play({ cmd: { formula: 0xf, power: 50, damageClass: CLASS_ATB } }).r.surviving).toBe(0);
    expect(play({ cmd: { formula: 0xf, power: 50, damageClass: CLASS_HP | CLASS_ATB } }, [16, 16]).r.surviving).toBe(CLASS_HP);
  });
});

// ---- the draws -------------------------------------------------------------------------------------------------
describe('draws: how many, from which stream, in which order', () => {
  it('HP, critical, MP, ATB: four values from the attacker mode-0 stream, in that order', () => {
    const p = play({ cmd: { formula: 0, power: 16, damageClass: 7, flagsDamage: 1 | 4 } }, [16, 31, 0], true);
    // the HP class variance 256 -> 84, crit -> 168; the MP class variance 271 (draw 31) -> 88; the ATB class variance 240 (draw 0) -> 78
    expect([p.r.hp, p.r.mp, p.r.atb]).toEqual([168, 88, 78]);
    expect(p.draws.map((d) => d.value)).toEqual([16, 31, 0]);
    expect(p.draws.every((d) => d.stream === 20)).toBe(true);
    expect(p.critCalls).toBe(1);
    expect(p.r.flags).toBe(7 | RESULT_CRITICAL);
  });

  it('a monster attacker (id 15 to 30) draws from stream id + 0xd', () => {
    expect(play({ attacker: { id: 15 } }).draws[0]?.stream).toBe(28);
    expect(play({ attacker: { id: 2 } }).draws[0]?.stream).toBe(22);
  });

  it('no draw at all for power 0, for a damage class of 0, for a failed gate, or for a preview', () => {
    expect(play({ cmd: { power: 0, damageClass: 7 } }, []).draws).toHaveLength(0);
    expect(play({ cmd: { damageClass: 0 } }, []).draws).toHaveLength(0);
    expect(play({ target: { inBattle: 0 } }, []).draws).toHaveLength(0);
    expect(play({ preview: true }, []).draws).toHaveLength(0);
  });

  it('power 0 keeps the class bits but computes nothing: flags 7, surviving 7, all numbers 0', () => {
    const p = play({ cmd: { power: 0, damageClass: 7 } }, []);
    expect([p.r.hp, p.r.mp, p.r.atb, p.r.flags, p.r.surviving]).toEqual([0, 0, 0, 7, 7]);
  });

  it('a preview is the same number as a real call with variance 256', () => {
    expect(play({ cmd: { formula: 0, power: 20 }, preview: true }, []).r.hp).toBe(105);
    expect(play({ cmd: { formula: 0, power: 20 } }, [16]).r.hp).toBe(105);
  });
});

// ---- aided characters ------------------------------------------------------------------------------------------
describe('the aid scale (player-side monsters): (aidCount + 1) / 4 per aided side, formulas 0 to 3 and 9 only', () => {
  it('is exactly x1 at the default aid count 3, and scales otherwise: 84 -> 126 (count 5), 21 (count 0)', () => {
    expect(aidScale(0, true, false, 3, 84)).toBe(84);
    expect(aidScale(0, true, false, 5, 84)).toBe(126); // 6*84 = 504; /4
    expect(aidScale(0, true, false, 0, 84)).toBe(21); // 1*84 = 84; /4
    expect(aidScale(0, true, true, 5, 84)).toBe(189); // 126, then 6*126 = 756; /4
    expect(aidScale(4, true, true, 5, 84)).toBe(84); // not for formula 4
    expect(aidScale(9, true, false, 5, 84)).toBe(126);
    expect(aidScale(10, true, false, 5, 84)).toBe(84);
  });

  it('runs inside the orchestrator on the base number (the estimate stays plain)', () => {
    const aided = { attacker: { aided: true }, aidCount: 5 };
    expect(play({ ...aided }).r.hp).toBe(126);
    expect(play({ ...aided, cmd: { ...CAN_CRIT } }, [16], true).r.hp).toBe(252);
    expect(play({ ...aided, target: { aided: true } }).r.hp).toBe(189);
    expect(play({ ...aided }).r.estimate).toBe(84); // the estimate is the plain base number
  });
});

// ---- the status phase's say in the numbers ---------------------------------------------------------------------
describe('settleDamage: what the status phase changes (Haste/Slow, Petrify, Death)', () => {
  const stage1 = (over: Over, script?: number[]) => computeClassDamage(build(over), { draw: () => (script ?? [16])[0] ?? 16, rollCrit: () => false });
  const settle = (over: Over, outcome: StatusPhaseOutcome = {}): DamageResult => {
    const input = build(over);
    return settleDamage(stage1(over), input, outcome);
  };

  it('a failed Haste or Slow roll drops the ATB number only', () => {
    const over = { cmd: { formula: 0xf, power: 60, damageClass: 5 } } satisfies Over;
    expect(settle(over).atb).toBe(60);
    const failed = settle(over, { hasteSlowFailed: true });
    expect([failed.hp, failed.atb]).toEqual([60, 0]);
  });

  it('a Petrified target that the hit did not Shatter takes nothing; a Shatter, or no Petrify in the result, lets it through', () => {
    const over = merge(direct(87), { target: { status1: 2 } });
    expect(settle(over, { resultHasPetrify: true }).hp).toBe(0);
    expect(settle(over, { resultHasPetrify: true }).surviving).toBe(0);
    expect(settle(over, { resultHasPetrify: true, shattered: true }).hp).toBe(87);
    expect(settle(over, { resultHasPetrify: false }).hp).toBe(87);
  });

  it('a hit that inflicts Death on a living target replaces the damage and clears the class bits', () => {
    const r = settle({ cmd: { formula: 0xf, power: 87, damageClass: 3 } }, { resultHasDeath: true });
    expect([r.hp, r.mp, r.atb, r.flags, r.surviving, r.blocked]).toEqual([0, 0, 0, 0, 0, 0]);
    const dead = settle(merge(direct(87, { flagsTarget: 0x40 }), { target: { dead: 1, status1: 1 } }), { resultHasDeath: true });
    expect(dead.hp).toBe(87); // a dead target is not "killed" again
  });

  it('the halving is applied to the surviving numbers, and the limit last', () => {
    const r = settle({ cmd: { formula: 0xe, power: 3, flagsTarget: 0x80 }, allTargets: true });
    expect(r.hp).toBe(9999);
  });
});

// ---- HP and MP application, the chain counter ------------------------------------------------------------------
describe('applying HP and MP numbers (exe 0x61b750 and 0x61b830)', () => {
  const pool = { hp: 1000, maxHp: 2000, chain: 0, bestChain: 0, taken: 0 };

  it('a positive number lowers HP, bumps the chain counter and the best chain, and adds to the running total', () => {
    const r = applyHpDamage(pool, 300);
    expect(r).toEqual({ hp: 700, maxHp: 2000, chain: 1, bestChain: 1, taken: 300 });
  });

  it('HP is clamped to 0 and to max HP; a heal does not bump the chain and is floored out of the total', () => {
    expect(applyHpDamage(pool, 5000).hp).toBe(0);
    const heal = applyHpDamage({ ...pool, taken: 100 }, -400);
    expect([heal.hp, heal.chain, heal.taken]).toEqual([1400, 0, 0]); // 100 - 400 floors at 0
    expect(applyHpDamage(pool, -5000).hp).toBe(2000);
    expect(applyHpDamage(pool, 0).chain).toBe(0);
  });

  it('the counter stops at 99; the best chain follows it up and never down', () => {
    let s = { ...pool };
    for (let i = 0; i < 120; i++) s = applyHpDamage({ ...s, hp: 2000 }, 1);
    expect([s.chain, s.bestChain]).toEqual([99, 99]);
    const after = applyHpDamage({ ...s, chain: 3, bestChain: 99 }, 10);
    expect([after.chain, after.bestChain]).toEqual([4, 99]);
  });

  it('MP is clamped to 0..maxMP', () => {
    expect(applyMpDamage({ mp: 60, maxMp: 200 }, 100)).toEqual({ mp: 0, maxMp: 200 });
    expect(applyMpDamage({ mp: 60, maxMp: 200 }, -500)).toEqual({ mp: 200, maxMp: 200 });
    expect(applyMpDamage({ mp: 60, maxMp: 200 }, 25)).toEqual({ mp: 35, maxMp: 200 });
  });

  it('the first hit on a fresh target is x1, the second x1.45, the third x1.5 (counter before the hit)', () => {
    let s = { ...pool };
    const dealt: number[] = [];
    for (let i = 0; i < 3; i++) {
      const hit = chainAdjusted(s.chain, 100);
      dealt.push(hit);
      s = applyHpDamage({ ...s, hp: 2000 }, hit);
    }
    expect(dealt).toEqual([100, 145, 150]); // 100; 29*100/20; 30*100/20
  });

  it('the counter resets when the target is Stopped or Petrified, or has finished its hit reaction', () => {
    const base = { stop: 0, status1: 0, hitReactionFlag: 1, hitReactionField: 0 };
    expect(shouldResetChain(base)).toBe(false); // still reacting: keep
    expect(shouldResetChain({ ...base, hitReactionFlag: 0, hitReactionField: 5 })).toBe(false); // the second field keeps it too
    expect(shouldResetChain({ ...base, hitReactionFlag: 0, hitReactionField: 0 })).toBe(true); // reaction over
    expect(shouldResetChain({ ...base, stop: 3 })).toBe(true); // Stopped
    expect(shouldResetChain({ ...base, status1: 2 })).toBe(true); // Petrified
    expect(shouldResetChain({ ...base, status1: 1 })).toBe(false); // Death alone does not
  });

  it('character ids 3 to 8 read the status of the girl they map to', () => {
    expect([3, 4, 5, 6, 7, 8, 0, 9, 15].map(statusSlot)).toEqual([0, 0, 1, 1, 2, 2, 0, 9, 15]);
  });
});

// ---- golden vectors from the emulator --------------------------------------------------------------------------
interface Vector {
  id: number;
  class: string;
  in: Record<string, unknown>;
  rngDraws: Array<{ stream: number; value: number }>;
  out: Record<string, number>;
}
interface VectorFile {
  defaults: Record<string, unknown>;
  vectors: Vector[];
}

function loadFixture(name: string): VectorFile | null {
  const path = fileURLToPath(new URL(`../fixtures/parity/ffx2/${name}.json`, import.meta.url));
  return existsSync(path) ? (JSON.parse(readFileSync(path, 'utf8')) as VectorFile) : null;
}

const plain = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);
function expand(defaults: Record<string, unknown>, sparse: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = { ...defaults };
  for (const [k, v] of Object.entries(sparse)) {
    const base = out[k];
    out[k] = plain(base) && plain(v) ? expand(base, v) : v;
  }
  return out;
}

const damageTargetFixture = loadFixture('damage_target');

describe.skipIf(damageTargetFixture === null)('golden vectors: tests/fixtures/parity/ffx2/damage_target.json (0x6172c0)', () => {
  it('every vector: the three damage numbers, the flag word, the surviving classes, the chain, the back-attack flag, the estimate and the draws', () => {
    const file = damageTargetFixture as VectorFile;
    const failures: string[] = [];
    for (const v of file.vectors) {
      const e = expand(file.defaults, v.in) as Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
      const A = e['attacker'];
      const T = e['target'];
      const cm = e['cmd'];
      const angle = Math.fround(e['angle'] as number);
      const input: PipelineInput = {
        cmd: {
          id: e['cmdId'], category: cm.category, flagsTarget: cm.flagsTarget, flagsMisc: cm.flagsMisc, flagsDamage: cm.flagsDamage,
          damageClass: cm.damageClass, formula: cm.formula, power: cm.power, element: cm.element, speciesKiller: cm.speciesKiller,
        },
        attacker: {
          id: e['attackerId'], status1: A.status1, level: A.level, hp: A.hp, maxHp: A.maxHp, mp: A.mp, maxMp: A.maxMp, str: A.str,
          strStage: A.strStage, mag: A.mag, magStage: A.magStage, autoAbilities650: A.auto650, autoAbilities652: A.auto652,
          weaponElement: A.weaponElement, aided: (e['attackerId'] < 0xf || e['attackerId'] > 0x1e) && (((A.saveIdx & 0xff) - 0xf) >>> 0) < 8,
        },
        target: {
          id: e['targetId'], hp: T.hp, maxHp: T.maxHp, mp: T.mp, maxMp: T.maxMp, def: T.def, defStage: T.defStage, mdef: T.mdef,
          mdefStage: T.mdefStage, status1: T.status1, affinities: { absorb: T.absorb, nullify: T.nullify, half: T.half, weak: T.weak },
          shell: T.shell, protect: T.protect, immunePhysical: T.immunePhysical, immuneMagical: T.immuneMagical,
          invincible: T.invincible, special: T.special, species: T.species, chain: T.chain, inBattle: T.inBattle, dead: T.dead,
          flag5ac: T.flag5ac, aided: (e['targetId'] < 0xf || e['targetId'] > 0x1e) && (((T.saveIdx & 0xff) - 0xf) >>> 0) < 8,
          atb: atbValues({
            charging: Boolean(T.charging), chargeRemaining: e['charge']?.remaining ?? 0, chargeMax: e['charge']?.max ?? 0,
            recoveryRemaining: T.recovery, recoveryMax: T.recoveryMax,
          }),
        },
        amount: e['amount'],
        allTargets: e['allFlag'] !== 0,
        preview: e['mode'] !== 0,
        backAttack: angle > 1.9634954929351807 || angle < -1.9634954929351807,
        records: e['records'],
        aidCount: e['aidCount'],
      };
      const stream = e['attackerId'] >= 15 && e['attackerId'] <= 30 ? e['attackerId'] + 0xd : e['attackerId'] + 0x14;
      const queue = v.rngDraws.filter((d) => d.stream === stream).map((d) => d.value);
      const draw = (s: number): number => {
        if (s !== stream || queue.length === 0) throw new Error(`vector ${v.id}: unexpected draw from stream ${s}`);
        return queue.shift() as number;
      };
      const hooks = {
        draw,
        // the game's own critical test: roll % 100 against the fixed byte or the Luck formula; Always Critical forces it
        rollCrit: (): boolean => {
          const roll = draw(stream) % 100;
          const chance = (cm.flagsDamage & 8) !== 0 ? cm.critByte : (A.luckStage - (T.luckStage ?? 0)) * 5 - (T.luck ?? 0) + A.luck;
          return roll < chance || (A.status1 & 0x8000) !== 0;
        },
      };
      const mask = v.out['mask'] as number;
      const outcome: StatusPhaseOutcome = {
        resultHasDeath: (mask & 1) !== 0,
        resultHasPetrify: (mask & 2) !== 0,
        shattered: (mask & 0x400) !== 0,
        hasteSlowFailed: (v.out['hasteSlowFailed'] as number | undefined) === 1,
      };
      const got = damageTarget(input, hooks, outcome);
      const o = v.out;
      const same =
        got.hp === o['hp'] && got.mp === o['mp'] && got.atb === o['atb'] && (got.flags & 0x17f) === ((o['flags'] as number) & 0x17f) &&
        got.surviving === o['surviving'] && got.chain === o['chain'] && (got.backAttack ? 1 : 0) === o['back'] &&
        got.estimate === o['estimate'] && queue.length === 0;
      if (!same) failures.push(`vector ${v.id} (${v.class})`);
    }
    expect(failures).toEqual([]);
  });
});
