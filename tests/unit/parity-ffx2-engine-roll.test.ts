/**
 * Re-parity W4: the rolled preemptive / ambush result (`MsCalcFirstAttack`, exe 0x00618b60) against the game's formula, over many seeds.
 *
 * `Ffx2EngineOptions.rollFirstAttack` rolls the result at the start of a `'normal'` battle from the two sides' average Agility with two
 * draws of 0..255. The generated battles of `parity-ffx2-engine-atb.test.ts` roll in only a few dozen scenarios and a wrong range can
 * slip through them (a different modulus changes the draw but rarely the result), so this test replays the engine's own seeded stream by
 * hand, takes the two draws as the game does (`draw & 255`), asks the kernel for the result, and requires the engine's opening to agree on
 * every seed: a preemptive strike leaves the girls at exactly 0 (they are ready at once), no other result does. **Game case: FFX-2 only.**
 */

import { describe, expect, it } from 'vitest';
import { SeededRng } from '../../src/battle/common/rng.ts';
import { FFX2Engine } from '../../src/battle/ffx2/index.ts';
import { enemy, group, setup } from '../../src/battle/ffx2/fixtures.ts';
import type { Ffx2Unit } from '../../src/battle/ffx2/internal.ts';
import { averageAgi, firstAttackRoll } from '../../src/battle/ffx2/kernel/atb-start.ts';

const SEEDS = 700;

describe('the rolled preemptive / ambush result', () => {
  it(`${SEEDS} seeds: the engine's opening says preemptive exactly when the game's formula does, on the engine's own two draws`, () => {
    let preemptive = 0;
    let ambush = 0;
    for (let seed = 1; seed <= SEEDS; seed++) {
      const monsterAgi = 20 + (seed % 90); // 20 to 109: the party's Agility at level 40 sits in the middle of it, so both sides win some
      const enemies = [enemy('m0', 'M0', 'noop', { agi: monsterAgi, hp: 9_999_999, maxHp: 9_999_999 }, { slot: 0, immunityFlags: [], flags: {} })];
      const engine = new FFX2Engine({ minigames: false, rollFirstAttack: true });
      engine.init({ ...setup(group('zz-roll', enemies), { seed, level: 40 }), condition: 'normal' });
      const state = engine.state();
      const units = Object.values(state.combatants) as Ffx2Unit[];
      const girls = units.filter((u) => u.side === 'party');
      const agi = (u: Ffx2Unit): number => Math.max(0, Math.min(255, Math.round(u.stats.agi)));

      // The engine's stream: one 0..63 draw for every unit at the start (the party first), then the two 0..255 draws of the roll.
      const rng = new SeededRng(seed);
      for (let i = 0; i < units.length; i++) rng.int(0, 63);
      const first = firstAttackRoll(
        { preset: 0, firstStrikeCount: 0, partyAgi: averageAgi(girls.map(agi)), monsterAgi: averageAgi(units.filter((u) => u.side === 'enemy').map(agi)) },
        () => rng.int(0, 255),
      );
      // A preemptive strike resets every girl to exactly 0 (kind 0, `r = 0` for a girl) and the trim then takes nothing off; nothing else does that.
      const girlsReady = girls.every((g) => g.atb.recovery === 0);
      expect(girlsReady, `seed ${seed}: result ${first.result}`).toBe(first.result === 1);
      if (first.result === 1) preemptive += 1;
      if (first.result === 2) ambush += 1;
    }
    expect(preemptive).toBeGreaterThan(SEEDS / 50); // the check is not vacuous: about 8 percent of the seeds strike first
    expect(ambush).toBeGreaterThan(0);
  }, 120_000);
});
