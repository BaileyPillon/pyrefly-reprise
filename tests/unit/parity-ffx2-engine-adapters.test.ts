/**
 * Re-parity W4, the engine against the game: the small facts the generated battles of `parity-ffx2-engine-atb.test.ts` cannot see.
 *
 * The mutation check of `docs/handoff/re-parity-w4.md` (a deliberate fault put into the engine, one at a time) found eight faults that the
 * seven engine-level files let through; six are killed here, and two are shown equivalent (section "Equivalent faults" below):
 * - who is handed to the Berserk pick (a Berserked girl, never a Berserked monster: the monster keeps running its script);
 * - Regen healing by exactly `(8 x max HP) >> 8` (the generated battles never hurt a unit before they regen it);
 * - the HUD bar filling against the standard wait, not against the last recovery;
 * - the ranges the opening asks the random stream for (a draw of 0..254 where the game reduces to 0..255 changes the number rarely, never the count);
 * - the opening trim counting only the characters that are alive and in the battle.
 *
 * **Game case: FFX-2 only.**
 */

import { describe, expect, it } from 'vitest';
import { FFX2Engine, STEP_MS, baseRequired, fillOf } from '../../src/battle/ffx2/index.ts';
import { enemy, group, setup } from '../../src/battle/ffx2/fixtures.ts';
import type { AbilityDef, Command } from '../../src/battle/common/types.ts';
import type { AbilityRegistry, AiScript, Ffx2Unit } from '../../src/battle/ffx2/internal.ts';
import { registerAiScript } from '../../src/battle/ffx2/ai/index.ts';
import { applyStatus } from '../../src/battle/ffx2/statuses.ts';
import { completeCommand, kernelUnit } from '../../src/battle/ffx2/atb-engine.ts';
import { openBattleGauges } from '../../src/battle/ffx2/atb-open.ts';
import { SeededRng } from '../../src/battle/common/rng.ts';

const noop = (costAtb: number, costCast: number): AbilityDef => ({
  id: `zz-adapt-${costAtb}-${costCast}`, name: 'adapter', game: 'ffx2', category: 'skill', mpCost: 0, power: 0, formula: 'none', damageType: 'other',
  element: ['none'], targeting: 'single-enemy', hits: 1, statusEffects: [], removesStatuses: [], flags: [],
  ffx2Record: {
    id: 0x7000, costAtb, costCast, category: 0, flagsTarget: 0x33, flagsMisc: 0, flagsDamage: 0, damageClass: 0, formula: 0,
    critByte: 0, accuracy: 0, power: 0, hits: 1, shatter: 0, element: 0, killer: 0,
  },
});
const registry: AbilityRegistry = {
  get(id) {
    const m = /^zz-adapt-(\d+)-(\d+)$/.exec(id);
    return m === null ? undefined : noop(Number(m[1]), Number(m[2]));
  },
};
const quiet: AiScript = { id: 'zz-adapt-quiet', decide: () => null };
registerAiScript(quiet);

interface Battle {
  engine: FFX2Engine;
  units: Ffx2Unit[];
  u(id: string): Ffx2Unit;
}

function battle(over: { agis?: number[]; condition?: 'normal' | 'scripted' | 'preemptive' | 'ambush'; seed?: number; level?: number } = {}): Battle {
  const agis = over.agis ?? [60];
  const enemies = agis.map((agi, i) => enemy(`m${i}`, `M${i}`, 'zz-adapt-quiet', { agi, hp: 9_999_999, maxHp: 9_999_999 }, { slot: i, immunityFlags: [], flags: {} }));
  const engine = new FFX2Engine({ abilities: registry, minigames: false });
  engine.init({ ...setup(group('zz-adapt', enemies), { seed: over.seed ?? 1, level: over.level ?? 24 }), condition: over.condition ?? 'scripted' });
  const combatants = engine.state().combatants as Record<string, Ffx2Unit>;
  return { engine, units: Object.values(combatants), u: (id) => combatants[id] as Ffx2Unit };
}

describe('who is handed to the Berserk pick (MsChrATBprocess: a Berserk bit turns the mode into state 8)', () => {
  it('a Berserked girl is, a Berserked monster is not (it keeps running its script); a girl opens a menu, a monster asks its script', () => {
    const b = battle();
    const girl = b.u('yuna');
    const monster = b.u('m0');
    expect(kernelUnit(girl).berserk).toBe(false);
    expect(kernelUnit(girl).mode).toBe(1);
    expect(kernelUnit(monster).mode).toBe(2);
    applyStatus(girl, { status: 'berserk', chance: 255, duration: 0 });
    applyStatus(monster, { status: 'berserk', chance: 255, duration: 0 });
    expect(kernelUnit(girl).berserk).toBe(true);
    expect(kernelUnit(monster).berserk).toBe(false);
  });
});

describe('Regen heals (8 x max HP) >> 8 = max HP / 32 every 16,000 units, from phase 0 after 169 steps at 95', () => {
  it('a girl at half HP gains exactly that, once, at step 169', () => {
    const b = battle();
    const girl = b.u('yuna');
    girl.hp = Math.floor(girl.stats.maxHp / 2);
    applyStatus(girl, { status: 'regen', chance: 255, duration: 125 });
    girl.gauge.regenAcc = 0;
    const per = (girl.stats.maxHp * 8) >>> 8;
    const hp0 = girl.hp;
    let n = 0;
    while (girl.hp === hp0 && n < 1000) {
      b.engine.tick(STEP_MS);
      n += 1;
    }
    expect(n).toBe(169);
    expect(girl.hp - hp0).toBe(per);
  });
});

describe('the HUD bar fills against the standard wait (the Attack row at the unit\'s Agility), not against the last recovery', () => {
  it('after an item (cost 40) the bar starts at 1 - 40/70 of the way up, not at 0', () => {
    const b = battle();
    const girl = b.u('rikku');
    const required = baseRequired(girl.stats.agi);
    completeCommand(girl, 40, b.units);
    expect(girl.atb.recovery).toBe(Math.floor((40 * 10000) / (girl.stats.agi + 1)));
    expect(girl.atb.required).toBe(required);
    expect(fillOf(girl)).toBeCloseTo(1 - girl.atb.recovery / required, 6);
    expect(fillOf(girl)).toBeGreaterThan(0.3);
    expect(fillOf(girl)).toBeLessThan(0.5);
  });
});

describe('the opening asks the random stream for the ranges the game reduces to', () => {
  /** A stream that records every request and answers the top of the range. */
  function recording(): { calls: string[]; rng: SeededRng } {
    const calls: string[] = [];
    class Top extends SeededRng {
      override int(a: number, z: number): number {
        calls.push(`${a}..${z}`);
        return z;
      }
    }
    return { calls, rng: new Top(0) };
  }
  const repeat = (s: string, n: number): string[] => Array.from({ length: n }, () => s);

  it('one 0..63 for every unit; a rolled result adds two 0..255, and a preemptive strike (the roll comes up at 255) then 31 resets of 0..15', () => {
    const b = battle({ condition: 'normal' });
    const { calls, rng } = recording();
    openBattleGauges(b.units, 'normal', { continuation: false, rollFirstAttack: true }, rng);
    expect(calls).toEqual([...repeat('0..63', b.units.length), '0..255', '0..255', ...repeat('0..15', 31)]);
  });

  it('a preset result (preemptive) makes no roll: the unit draws, then the 31 resets', () => {
    const b = battle({ condition: 'preemptive' });
    const { calls, rng } = recording();
    openBattleGauges(b.units, 'preemptive', { continuation: false, rollFirstAttack: false }, rng);
    expect(calls).toEqual([...repeat('0..63', b.units.length), ...repeat('0..15', 31)]);
  });

  it('a normal battle that is not rolled, and a continuation link, draw the unit draws and nothing else', () => {
    const b = battle({ condition: 'normal' });
    const plain = recording();
    openBattleGauges(b.units, 'normal', { continuation: false, rollFirstAttack: false }, plain.rng);
    expect(plain.calls).toEqual(repeat('0..63', b.units.length));
    const chain = recording();
    openBattleGauges(b.units, 'scripted', { continuation: true, rollFirstAttack: true }, chain.rng);
    expect(chain.calls).toEqual(repeat('0..63', b.units.length));
  });
});

describe('the opening trim counts only the characters that are alive and in the battle', () => {
  it('a fallen, very fast girl and an ejected one do not set the smallest wait: two thirds of the smallest LIVING wait come off everyone', () => {
    // Two monsters of Agility 20 and the party at level 24; every opening draw answers 0 (25 percent of the wait); Paine is the fast one, fallen or ejected.
    for (const how of ['fallen', 'removed'] as const) {
      const b = battle({ condition: 'normal', agis: [20, 20] });
      const paine = b.u('paine');
      paine.stats = { ...paine.stats, agi: 255 };
      if (how === 'fallen') paine.alive = false;
      else paine.removed = true;
      openBattleGauges(b.units, 'normal', { continuation: false, rollFirstAttack: false }, new (class extends SeededRng { override int(): number { return 0; } })(0));
      const living = b.units.filter((u) => u !== paine && u.alive);
      const starts = living.map((u) => Math.floor((32 * Math.floor((70 * 10000) / (u.stats.agi + 1))) / 128));
      const cut = Math.floor((2 * Math.min(...starts)) / 3);
      living.forEach((u, i) => expect(u.atb.recovery, `${how}: ${u.id}`).toBe((starts[i] as number) - cut));
    }
  });
});

describe('Equivalent faults the mutation check kept alive (shown, not killed)', () => {
  it('a unit never counts down an action time while a cast is on the bar: `executing` is 0 whenever `charging` is set, so the guard in `logic-step.ts` can never matter', () => {
    const cast: Command = { kind: 'ability', id: 'zz-adapt-0-70', targets: ['m0'] };
    const engine = new FFX2Engine({ abilities: registry, minigames: false, actionTimeSeconds: 1.5 });
    engine.init({ ...setup(group('zz-adapt-act', [enemy('m0', 'M0', 'zz-adapt-quiet', { agi: 60, hp: 9_999_999, maxHp: 9_999_999 }, { slot: 0, immunityFlags: [], flags: {} })]), { seed: 5, level: 30 }), condition: 'scripted' });
    const units = Object.values(engine.state().combatants as Record<string, Ffx2Unit>);
    let casts = 0;
    for (let i = 0; i < 4000; i++) {
      engine.tick(STEP_MS);
      for (let g = 0; g < 32; g++) {
        const d = engine.nextDecision();
        if (d.kind === 'player-input') {
          engine.submit(cast);
          casts += 1;
          continue;
        }
        if (d.kind === 'resolved') continue;
        break;
      }
      for (const u of units) expect(u.gauge.executing > 0 && u.atb.charging !== null, `${u.id} at step ${i}`).toBe(false);
    }
    expect(casts).toBeGreaterThan(10); // not vacuous: the girls cast all through the run
  });
});
