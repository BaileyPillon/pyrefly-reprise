/**
 * PR-0258 (critic round 19, carried since round 17; FFX only): an overkill doubles the item drops
 * of the enemy it killed. `research/ffx-vs-ffx2-presentation.md` §9: Overkill "doubles AP and item
 * drops ... does not affect gil or equipment drops" [verified: 2 sources]; every chapter file's drop
 * row agrees (Guardians "Ability Sphere x1 (x2 on overkill)", Natus x2 then x4).
 *
 * Runs the real engine through `buildBattleResult`: two 50 HP enemies die to one 50 damage hit each;
 * only one has an overkill threshold the hit reaches, so only its drop doubles, gil does not, and a
 * stack caps at 99.
 */

import { describe, expect, it } from 'vitest';
import type { BattleResult, Decision } from '../../src/battle/common/types.ts';
import { FFXContentRegistry, createFFXEngine } from '../../src/battle/ffx/index.ts';
import { OVERKILL_DROP_MULTIPLIER } from '../../src/battle/ffx/results.ts';
import { ability, enemy, member, party, setup, stats } from './ffx-fixtures.test.ts';

type PlayerInput = Extract<Decision, { kind: 'player-input' }>;

function content(): FFXContentRegistry {
  const reg = new FFXContentRegistry();
  reg.addAbilities([
    ability({ id: 'attack', name: 'Attack', category: 'attack', power: 1, formula: 'fixed-no-variance', damageType: 'other', targeting: 'single-enemy', canMiss: false }),
  ]);
  return reg;
}

function nextInput(engine: ReturnType<typeof createFFXEngine>): PlayerInput | null {
  for (let i = 0; i < 200; i++) {
    const d = engine.nextDecision();
    if (d.kind === 'battle-over') return null;
    if (d.kind === 'player-input') return d;
  }
  throw new Error('no player-input decision arrived in 200 steps');
}

/** Kill `first` then `second` with one hit each; returns the battle's result. */
function run(enemies: Parameters<typeof enemy>[0][], order: string[]): BattleResult {
  const engine = createFFXEngine({ content: content() });
  engine.init(
    setup({
      party: party({ members: [member({ id: 'tidus' }), member({ id: 'yuna' }), member({ id: 'auron' })], activeSlots: ['tidus', 'yuna', 'auron'], reserve: [] }),
      enemies: { id: 'g', game: 'ffx', enemies: enemies.map((e) => enemy(e)) },
    }),
  );
  for (const target of order) {
    if (!nextInput(engine)) break;
    engine.submit({ kind: 'attack', targets: [target] });
  }
  while (nextInput(engine)) engine.submit({ kind: 'defend', targets: [] });
  const result = engine.state().result;
  if (!result) throw new Error('no result');
  return result;
}

const rewards = (overkillThreshold: number, count: number, extra: object = {}) => ({
  ap: 10, apOverkill: 15, gil: 100, overkillThreshold, drops: [{ itemId: 'ability-sphere', count, ...extra }],
});

describe('overkill doubles the killed enemy’s item drops (PR-0258, FFX only)', () => {
  it('doubles only the overkilled enemy’s drop; gil and the other enemy are untouched', () => {
    expect(OVERKILL_DROP_MULTIPLIER).toBe(2);
    const result = run(
      [
        { id: 'over', stats: stats({ hp: 50, maxHp: 50 }), rewards: rewards(40, 1) },
        { id: 'plain', stats: stats({ hp: 50, maxHp: 50 }), rewards: rewards(1000, 1) },
      ],
      ['over', 'plain'],
    );
    expect(result.overkilled).toEqual(['over']);
    expect(result.drops.map((d) => d.count)).toEqual([2, 1]);
    expect(result.gil, 'gil is not doubled').toBe(200);
    expect(result.ap, 'AP keeps its own overkill column').toBe(15 + 10);
  });

  it('three Guardians, one overkilled: Ability Sphere x4, the quantity round 17 sourced', () => {
    const guardian = (id: string, threshold: number) => ({ id, stats: stats({ hp: 50, maxHp: 50 }), rewards: rewards(threshold, 1) });
    const result = run([guardian('g1', 1000), guardian('g2', 40), guardian('g3', 1000)], ['g1', 'g2', 'g3']);
    expect(result.drops.reduce((n, d) => n + d.count, 0)).toBe(4);
  });

  it('a stack caps at 99, and a drop that rolls no chance adds nothing', () => {
    const big = run([{ id: 'over', stats: stats({ hp: 50, maxHp: 50 }), rewards: rewards(40, 80) }], ['over']);
    expect(big.drops.map((d) => d.count)).toEqual([99]);
    const none = run([{ id: 'over', stats: stats({ hp: 50, maxHp: 50 }), rewards: rewards(40, 1, { chance: 0 }) }], ['over']);
    expect(none.drops).toEqual([]);
  });
});
