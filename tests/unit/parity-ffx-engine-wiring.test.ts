/**
 * **Engine-level parity, FFX hit / critical / damage wiring** (re-parity W1; **FFX only**).
 *
 * The kernel tests (`parity-ffx-*.test.ts`) prove each function against the game's own machine code. This file proves
 * the WIRING: it drives the engine's own damage path, `resolveAbility`, on a few hundred generated situations and
 * asserts that what the engine does equals what `hitCheck`, `critCheck` and `calcHitDamage` return for the same inputs
 * and the same draws:
 *
 * 1. the engine takes its draws in the game's order and count (hit roll, HP variance, critical roll, MP variance, CTB
 *    variance) and takes none the game does not;
 * 2. the outcome (hit, miss, no effect, nullified), the amounts, the critical flag and the affinity label of every hit
 *    equal the kernel's, as do the target's HP, MP, CTB counter and Nul charges afterwards;
 * 3. an action visits its targets one after another and runs each target's hits in a row;
 * 4. an ability with no game record is run on a derived one and gets the same answer as the same words written out.
 *
 * The situations are written in the game's terms (stat bytes, stacks, status bits, element byte masks) and the kernel
 * inputs are built from them again by an independent route (`helpers/ffxEngineWiring.ts`, which imports nothing from
 * `src/battle/ffx/adapt/`), so a wrong translation of an engine fact into a kernel input shows as a difference.
 */

import { describe, expect, it } from 'vitest';
import type { AbilityDef, ElementId, FFXCombatant, FFXPlainAttack } from '../../src/battle/common/types.ts';
import { ALL_ABILITIES } from '../../src/data/ffx/index.ts';
import { CORE_ABILITIES, computeDamage, critChance, hitChance, resolveAbility } from '../../src/battle/ffx/index.ts';
import { critCheck, critChanceOf } from '../../src/battle/ffx/kernel/crit.ts';
import { hitCheck, hitPlan } from '../../src/battle/ffx/kernel/hit.ts';
import { calcHitDamage, type HitOutput } from '../../src/battle/ffx/kernel/hitdamage.ts';
import { accuracyFormulaOf, resolveCommand } from '../../src/battle/ffx/adapt/command.ts';
import {
  ScriptedRng,
  combatantOf,
  contextOf,
  makeRng,
  oracleInputs,
  randomSituation,
  wiringPool,
  type Situation,
} from './helpers/ffxEngineWiring.ts';

const POOL: AbilityDef[] = [...wiringPool(ALL_ABILITIES), ...wiringPool(CORE_ABILITIES.map((a) => ({ ...a })))];
const ELEMENT_BITS: ReadonlyArray<readonly [ElementId, number]> = [['fire', 1], ['ice', 2], ['lightning', 4], ['water', 8], ['holy', 0x10]];

/** The same ladder the exe's element function walks, written out again as a label. */
function ladder(element: number, m: { absorb: number; nullMask: number; resist: number; weak: number }): string {
  if (element === 0) return 'normal';
  if ((element & m.weak) !== 0) return 'weak';
  let neutral = false, resisted = false, nulled = false, absorbed = false;
  for (const [, bit] of ELEMENT_BITS) {
    if ((element & bit) === 0) continue;
    const a = (m.absorb & bit) !== 0, n = (m.nullMask & bit) !== 0, r = (m.resist & bit) !== 0;
    if (!a && !n && !r) neutral = true;
    if (r && !n && !a) resisted = true;
    if (n && !a) nulled = true;
    if (a) absorbed = true;
  }
  return neutral ? 'normal' : resisted ? 'resist' : nulled ? 'immune' : absorbed ? 'absorb' : 'normal';
}

interface Run {
  died?: boolean;
  kinds: string;
  tokens: string[];
  hp: number;
  mp: number;
  ctb: number;
  nul: number[];
}

/** What the engine does. */
function viaEngine(sit: Situation, hits?: number): Run {
  const rng = new ScriptedRng(sit.raws);
  const targetSide = sit.def.targeting === 'single-ally' ? sit.userSide : sit.userSide === 'party' ? 'enemy' : 'party';
  const user = combatantOf(sit.user, 'u', sit.userSide);
  if (sit.plainAttack) user.enemy = { plainAttack: sit.plainAttack } as unknown as FFXCombatant['enemy'];
  const target = combatantOf(sit.target, 't', targetSide);
  const { ctx, events } = contextOf(user, target, rng, sit.target.ctb);
  resolveAbility(ctx, user, sit.def, [target.id], {
    ...(sit.power !== undefined ? { power: sit.power } : {}),
    ...(sit.gilSpent !== undefined ? { gilSpent: sit.gilSpent } : {}),
    ...(sit.timing ? { timing: sit.timing } : {}),
    ...(hits !== undefined ? { hits } : {}),
  });
  const tokens: string[] = [];
  for (const e of events) {
    if (e['type'] === 'miss') tokens.push(`miss:${e['reason']}`);
    if (e['type'] === 'damage' && e['amount'] !== 0) tokens.push(`dmg:${e['amount']}:${e['crit']}:${e['affinity'] ?? ''}`);
  }
  const nul = (['nulblaze', 'nulfrost', 'nulshock', 'nultide'] as const).map((s) => {
    const inst = target.statuses[s];
    return inst ? (inst.permanent ? 255 : (inst.charges ?? 0)) : 0;
  });
  return { kinds: rng.kinds(), tokens, hp: target.hp, mp: target.mp, ctb: ctx.rt.actors.get('t')!.ctb, nul, died: !target.alive };
}

/** What the kernels return for the same inputs, hit after hit, with the engine's own bookkeeping between hits (live HP and MP, clamped; CTB added). */
function viaKernels(sit: Situation, hits: number): Run {
  const raws = sit.raws;
  let cursor = 0;
  let kinds = '';
  const next = (kind: string) => (): number => {
    kinds += kind;
    return raws[cursor++ % raws.length] as number;
  };
  let hp = sit.target.hp, mp = sit.target.mp, ctb = sit.target.ctb, sleep = sit.target.sleep;
  let nul = [...sit.target.nul];
  const tokens: string[] = [];
  for (let h = 0; h < hits; h++) {
    const inp = oracleInputs(sit, { hp, mp, ctb, sleep });
    inp.input.record.nul = { blaze: nul[0] as number, frost: nul[1] as number, shock: nul[2] as number, tide: nul[3] as number };
    const out: HitOutput = calcHitDamage(inp.input, {
      draw: next('V'),
      hit: () => hitCheck(inp.hit, next('P')),
      crit: () => critCheck(inp.crit, 0, next('P')).crit,
    });
    nul = [out.nul.blaze, out.nul.frost, out.nul.shock, out.nul.tide];
    if (out.outcome === 'nullified') { tokens.push('miss:nullified'); continue; }
    if (out.outcome === 'noEffect') { tokens.push('miss:wrong-state'); continue; }
    if (out.outcome === 'miss') { tokens.push('miss:evaded'); continue; }
    const [a0, a1, a2] = out.amounts;
    const classes = sit.def.record!.damageClass;
    const maxHp = sit.target.maxHp, maxMp = sit.target.maxMp;
    if ((classes & 4) !== 0) ctb = Math.max(0, ctb + a2);
    if ((classes & 2) !== 0 && a1 !== 0) mp = Math.max(0, Math.min(maxMp, mp - a1));
    if ((classes & 1) !== 0 && a0 !== 0) {
      const usesWeapon = ((sit.def.record!.flagsMisc & 0x40000) !== 0);
      const element = (usesWeapon ? inp.input.user.weapon.element : 0) | inp.input.cmd.element;
      const label = out.immunityCount > 0 && sit.def.formula !== 'none' ? 'immune' : ladder(element, sit.target);
      tokens.push(`dmg:${a0}:${(out.resultMask & 0x100) !== 0}:${label}`);
      hp = Math.max(0, Math.min(maxHp, hp - a0));
      // A physical hit that damages wakes a sleeper, so the next hit of the action no longer finds the target asleep.
      if (sit.def.damageType === 'physical' && a0 > 0) sleep = false;
    }
  }
  return { kinds, tokens, hp, mp, ctb, nul };
}

describe('the engine draws and decides what the kernels do, on generated situations', () => {
  it('there is a pool to draw from', () => {
    expect(POOL.length).toBeGreaterThan(120);
    expect(POOL.some((a) => a.id === 'attack')).toBe(true);
  });

  it('400 situations: the same draws in the same order, the same outcomes, amounts, flags and totals', () => {
    const rng = makeRng(20261008);
    let skipped = 0;
    const seen = { hit: 0, miss: 0, nullified: 0, noEffect: 0, crit: 0, mp: 0, ctb: 0, kinds: new Set<string>() };
    for (let i = 0; i < 400; i++) {
      const sit = randomSituation(rng, POOL);
      const hits = sit.def.hits;
      const engine = viaEngine(sit, hits);
      const kernels = viaKernels(sit, hits);
      if (engine.died) { skipped++; continue; } // a target that dies mid-action takes the KO path, which the kernels do not model
      const { died: _died, ...plain } = engine;
      expect(plain, `situation ${i}: ${sit.def.id}`).toEqual(kernels);
      for (const t of kernels.tokens) {
        if (t.startsWith('dmg')) seen.hit++;
        if (t.includes(':true:')) seen.crit++;
        if (t === 'miss:evaded') seen.miss++;
        if (t === 'miss:nullified') seen.nullified++;
        if (t === 'miss:wrong-state') seen.noEffect++;
      }
      if ((sit.def.record!.damageClass & 2) !== 0) seen.mp++;
      if ((sit.def.record!.damageClass & 4) !== 0) seen.ctb++;
      seen.kinds.add(kernels.kinds);
    }
    expect(skipped).toBeLessThan(25);
    // The sample is wide enough to have exercised each branch.
    expect(seen.hit).toBeGreaterThan(150);
    expect(seen.miss).toBeGreaterThan(5);
    expect(seen.nullified).toBeGreaterThan(0);
    expect(seen.crit).toBeGreaterThan(5);
    expect(seen.mp).toBeGreaterThan(10);
    expect(seen.ctb).toBeGreaterThan(5);
    expect(seen.kinds.size).toBeGreaterThan(6);
  });

  it('the draws of the common commands, in the game\'s order', () => {
    const rng = makeRng(77);
    const by = (id: string): AbilityDef => POOL.find((a) => a.id === id) as AbilityDef;
    const kindsOf = (id: string, over: (s: Situation) => void = () => {}): string => {
      // A target that cannot be nullified, evaded or ignored, so the branch under test is the one that runs.
      const sit = randomSituation(rng, [by(id)]);
      Object.assign(sit.target, { nul: [0, 0, 0, 0], sleep: false, petrify: false, immuneAll: false, immunePhys: false, immuneMag: false, absorb: 0, nullMask: 0, eva: 0 });
      Object.assign(sit.user, { luck: 100, acc: 255, aim: 5 });
      sit.userSide = 'party';
      over(sit);
      return viaEngine(sit, 1).kinds;
    };
    expect(kindsOf('attack')).toBe('PVP'); // hit roll, HP variance, critical roll
    expect(kindsOf('fire')).toBe('V'); // a spell always hits and cannot crit: only the variance
    expect(kindsOf('slow')).toBe('V'); // the CTB class spends a variance draw of its own
    expect(kindsOf('elixir')).toBe('VV'); // HP class, then MP class
    expect(kindsOf('lancet')).toBe('VV');
  });
});

describe('an action visits its targets one after another and runs each target\'s hits in a row', () => {
  it('Tornado (two hits, all enemies) against two foes draws target by target', () => {
    const raw = ALL_ABILITIES.find((a) => a.id === 'tornado') as AbilityDef;
    const tornado: AbilityDef = { ...raw, statusEffects: [], removesStatuses: [] };
    expect(tornado.hits).toBe(2);
    expect(tornado.targeting).toBe('all-enemies');
    const rng = makeRng(5);
    const sit = randomSituation(rng, [tornado]);
    Object.assign(sit.target, { nul: [0, 0, 0, 0], sleep: false, petrify: false, immuneAll: false, immunePhys: false, immuneMag: false, hp: 99999 });
    const scripted = new ScriptedRng(sit.raws);
    const user = combatantOf(sit.user, 'u', 'party');
    const a = combatantOf(sit.target, 'a', 'enemy');
    const b = combatantOf(sit.target, 'b', 'enemy');
    const { ctx, events } = contextOf(user, a, scripted, 0, [b]);
    resolveAbility(ctx, user, tornado, ['a']);
    const order = events.filter((e) => e['type'] === 'damage' || e['type'] === 'miss').map((e) => String(e['targetId']));
    // Every event of target a comes before every event of target b.
    const firstB = order.indexOf('b');
    expect(firstB).toBeGreaterThan(0);
    expect(order.slice(0, firstB).every((id) => id === 'a')).toBe(true);
    expect(order.slice(firstB).every((id) => id === 'b')).toBe(true);
    const idx = events.filter((e) => e['type'] === 'damage').map((e) => e['hitIndex']);
    expect(idx).toEqual([...idx].sort((x, y) => (x as number) - (y as number)));
  });
});

describe('an ability with no game record runs on a derived one', () => {
  const derived: AbilityDef = {
    id: 'ours-slash', name: 'Ours', game: 'ffx', category: 'skill', mpCost: 0, rank: 3, power: 20, formula: 'strength',
    damageType: 'physical', element: ['fire'], targeting: 'single-enemy', hits: 1, statusEffects: [], removesStatuses: [],
    flags: ['crit-eligible', 'adds-equipment-crit', 'affected-by-darkness'],
  };

  it('derives the words the engine always read from the flags', () => {
    const r = resolveCommand(derived, { side: 'party' }).record;
    expect(r.flagsDamage).toBe(0x0d); // physical, can crit, crit bonus from equipment
    expect(r.flagsMisc).toBe((3 << 3) | 0x40); // the old rule gave a player physical skill the table formula, and Darkness applies
    expect(r.damageClass).toBe(1);
    expect(r.type).toBe(0);
    expect(resolveCommand({ ...derived, accuracy: 80 }, { side: 'enemy' }).record.flagsMisc >> 3 & 7).toBe(2); // an accuracy byte: formula 2
    expect(resolveCommand({ ...derived, canMiss: false }, { side: 'party' }).record.flagsMisc >> 3 & 7).toBe(0); // canMiss false: always hits
    expect(resolveCommand(derived, { side: 'enemy' }).record.flagsMisc >> 3 & 7).toBe(0); // an enemy action with no byte: always hits
    expect(resolveCommand({ ...derived, damageType: 'magical', flags: ['heals'] }, { side: 'party' }).record.flagsDamage).toBe(0x12);
    expect(resolveCommand({ ...derived, flags: ['drains'] }, { side: 'party' }).record.flagsMisc & 0x100).toBe(0x100);
    expect(resolveCommand({ ...derived, flags: ['ignores-armored'] }, { side: 'party' }).record.flagsMisc & 0x10000).toBe(0x10000);
  });

  it('is exactly the ability with those words written out as its record, on the same draws', () => {
    const rng = makeRng(31);
    for (let i = 0; i < 60; i++) {
      const sit = randomSituation(rng, [derived]);
      const written = viaEngine({ ...sit, def: { ...derived, record: resolveCommand(derived, { side: 'party' }).record } }, 1);
      const unwritten = viaEngine({ ...sit, def: derived }, 1);
      expect(unwritten).toEqual(written);
    }
  });
});

describe('an enemy\'s plain Attack is not the party\'s record', () => {
  const attack = CORE_ABILITIES.find((a) => a.id === 'attack') as AbilityDef;
  // The possessed aeons' Attack, record 0x6000 (research/re-ffx-ai-yunalesca-bfa.md section 5.5): accuracy formula 2 on a
  // byte of 90, physical, no critical hit.
  const possessed: FFXPlainAttack = { record: { id: 0x6000, type: 0, flagsMisc: 0x52, flagsDamage: 0x01, damageClass: 1 }, accuracy: 90, critBonus: 0 };

  it('the party and an aeon keep the party\'s Attack record, 0x3000, accuracy formula 3', () => {
    for (const side of ['party', 'aeon'] as const) {
      const r = resolveCommand(attack, { side });
      expect(r.record.id).toBe(0x3000);
      expect(accuracyFormulaOf(r)).toBe(3);
      expect(r.currentCommand).toBe(0x3000);
      expect(r.derived).toBe(false);
    }
  });

  it('an enemy with the game\'s record attacks on it: its formula, its byte, its flags', () => {
    const r = resolveCommand(attack, { side: 'enemy', enemy: { plainAttack: possessed } });
    expect(r.record).toEqual(possessed.record);
    expect(accuracyFormulaOf(r)).toBe(2);
    expect(r.accuracy).toBe(90);
    expect(r.critBonus).toBe(0);
    expect(r.record.flagsDamage & 4).toBe(0); // cannot crit
    expect(r.currentCommand).toBe(0x6000);
  });

  it('an enemy with none keeps the engine\'s own reading, derived from the flags: always hits, can crit', () => {
    const r = resolveCommand(attack, { side: 'enemy' });
    expect(r.derived).toBe(true);
    expect(accuracyFormulaOf(r)).toBe(0);
    expect(r.record.flagsDamage & 4).toBe(4);
    expect(r.currentCommand).toBe(0x3000); // Berserk still multiplies it
  });

  it('the engine runs the possessed Attack exactly as the kernels run that record: hit roll, variance, no critical draw', () => {
    const written: AbilityDef = { ...attack, id: 'written-plain-attack', record: possessed.record, accuracy: possessed.accuracy, bonusCrit: possessed.critBonus };
    const rng = makeRng(2026);
    const draws = new Set<string>();
    for (let i = 0; i < 80; i++) {
      const sit = randomSituation(rng, [written]);
      sit.userSide = 'enemy';
      sit.user.luck = 1;
      const viaRecord = viaEngine({ ...sit, def: written }, 1); // the ability carrying the record itself
      const viaEnemy = viaEngine({ ...sit, def: attack, plainAttack: possessed }, 1); // the generic Attack of an enemy that carries it
      expect(viaEnemy).toEqual(viaRecord);
      const kernels = viaKernels({ ...sit, def: written, currentCommand: 0x6000 }, 1);
      const { died: _died, ...plain } = viaEnemy;
      expect(plain).toEqual(kernels);
      draws.add(viaEnemy.kinds);
    }
    // a miss stops after the hit roll; a hit adds the variance; a sleeping or petrified target is struck with no roll at all; never a critical roll
    expect([...draws].sort()).toEqual(['P', 'PV', 'V']);
  });

  it('the previews print what the engine rolls for it', () => {
    const neutral = (side: 'party' | 'enemy', over: Partial<ReturnType<typeof randomSituation>['user']>): FFXCombatant => {
      const spec = randomSituation(makeRng(9), [attack]).user;
      Object.assign(spec, { darkness: false, aim: 0, reflex: 0, luckStack: 0, jinx: 0, sleep: false, petrify: false, ...over });
      return combatantOf(spec, side === 'enemy' ? 'u' : 't', side);
    };
    const user = neutral('enemy', { luck: 1 });
    user.enemy = { plainAttack: possessed } as unknown as FFXCombatant['enemy'];
    const target = neutral('party', { eva: 22, luck: 18 });
    // accuracy formula 2: the command's byte less the target's Evasion, plus the user's Luck, less the target's
    expect(hitChance(user, target, attack)).toBe(90 - 22 + 1 - 18);
    expect(critChance(user, target, attack)).toBe(0); // the record cannot crit
    const plainUser = neutral('enemy', { luck: 1 });
    expect(hitChance(plainUser, target, attack)).toBeNull(); // no record of its own: always hits, as before
  });
});

describe('the read-only views the advisor uses are the same kernels', () => {
  it('hitChance, critChance and computeDamage equal the kernels on 200 generated situations', () => {
    const rng = makeRng(404);
    let rolled = 0;
    for (let i = 0; i < 200; i++) {
      const sit = randomSituation(rng, POOL);
      const user: FFXCombatant = combatantOf(sit.user, 'u', sit.userSide);
      const targetSide = sit.def.targeting === 'single-ally' ? sit.userSide : sit.userSide === 'party' ? 'enemy' : 'party';
      const target: FFXCombatant = combatantOf(sit.target, 't', targetSide);
      const inp = oracleInputs(sit, { hp: sit.target.hp, mp: sit.target.mp, ctb: sit.target.ctb, sleep: sit.target.sleep });
      const plan = hitPlan(inp.hit);
      expect(hitChance(user, target, sit.def), sit.def.id).toBe(plan.rolls ? plan.percent : null);
      if (plan.rolls) rolled++;
      expect(critChance(user, target, sit.def), sit.def.id).toBe(critChanceOf(inp.crit) ?? 0);
      // One hit with the rolls given: the kernel's amount of the command's first class.
      const out = calcHitDamage(inp.input, { draw: () => 16, hit: 0, crit: false });
      const classes = sit.def.record!.damageClass;
      const first = (classes & 1) !== 0 ? out.amounts[0] : (classes & 2) !== 0 ? out.amounts[1] : out.amounts[2];
      const els = (sit.def.element as ElementId[]).filter((e) => e !== 'none');
      const weapon = ((sit.def.record!.flagsMisc & 0x40000) !== 0 && sit.user.weaponElement !== 0
        ? ELEMENT_BITS.filter(([, bit]) => bit === sit.user.weaponElement).map(([e]) => e)
        : []) as ElementId[];
      const via = computeDamage({
        user, target, def: sit.def, crit: false, varianceRoll: 16, elements: [...els, ...weapon],
        ...(sit.power !== undefined ? { power: sit.power } : {}),
        ...(sit.gilSpent !== undefined ? { gilSpent: sit.gilSpent } : {}),
        ...(sit.timing ? { timing: sit.timing } : {}),
        targetCtb: sit.target.ctb,
      });
      expect(via.amount, sit.def.id).toBe(first);
    }
    expect(rolled).toBeGreaterThan(20);
  });
});
