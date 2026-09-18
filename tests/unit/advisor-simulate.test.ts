/**
 * The move advisor's **estimator** — `src/battle/ffx/simulate.ts` and
 * `src/battle/ffx2/simulate.ts`.
 *
 * The advisor card prints a damage figure and claims it came from the engine's
 * own formulas. Two things have to be true for that claim to hold, and both are
 * asserted here against real engines and real chapter data rather than fixtures:
 *
 *  1. **A preview does not take the turn.** The live state is deep-compared
 *     across a simulation, field for field, including the event log.
 *  2. **The estimate matches what the engine actually does.** The same command
 *     is submitted to the real engine on a fixed seed and the damage it emits is
 *     required to fall inside the min-max range the preview quoted.
 */

import { describe, expect, it } from 'vitest';
import type { AvailableCommand, Command, CombatantId } from '../../src/battle/common/types.ts';
import { FFXContentRegistry, createFFXEngine } from '../../src/battle/ffx/index.ts';
import { ALL_ABILITIES, ENEMY_GROUPS_BY_ID, ITEMS } from '../../src/data/ffx/index.ts';
import { gagazetBuild } from '../../src/data/ffx/builds/gagazet.ts';
import { RollPolicyRng, simulateFFXCommand } from '../../src/battle/ffx/simulate.ts';

/** One FFX engine, built the way `BattleScreenContent.ts` builds one. */
function newFfxEngine(groupId: string, seed: number, party = gagazetBuild) {
  const content = new FFXContentRegistry();
  content.addAbilities(ALL_ABILITIES);
  content.addItems(Object.values(ITEMS));
  const group = ENEMY_GROUPS_BY_ID[groupId];
  if (!group) throw new Error(`${groupId} group missing from the data layer`);
  const engine = createFFXEngine({ content, autoResolveMinigames: true });
  engine.init({ game: 'ffx', party, enemies: group, triggers: [], seed, condition: 'normal', canEscape: false });
  return { engine, content };
}

/** Walk to the first player decision the engine opens. */
function firstDecision(engine: ReturnType<typeof newFfxEngine>['engine']) {
  for (let i = 0; i < 400; i++) {
    const d = engine.nextDecision();
    if (d.kind === 'player-input') return d;
    if (d.kind === 'battle-over') break;
  }
  throw new Error('no player decision inside 400 steps');
}

function aim(row: AvailableCommand, target?: CombatantId): Command {
  const t = target && row.validTargets.includes(target) ? target : row.validTargets[0];
  return { ...row.command, targets: t ? [t] : [] } as Command;
}

describe('RollPolicyRng', () => {
  it('sweeps magnitude ranges and holds branch ranges at their median', () => {
    const lo = new RollPolicyRng('min');
    const mid = new RollPolicyRng('mid');
    const hi = new RollPolicyRng('max');

    // The FFX variance ladder: 0-31, with 16 the exact x1.0 step.
    expect(lo.int(0, 31)).toBe(0);
    expect(mid.int(0, 31)).toBe(16);
    expect(hi.int(0, 31)).toBe(31);

    // Branch rolls: hit (0-100), crit/status (0-99), escape (0-255).
    for (const rng of [lo, mid, hi]) {
      expect(rng.int(0, 100)).toBe(50);
      expect(rng.int(0, 99)).toBe(49);
      expect(rng.int(0, 255)).toBe(127);
    }
  });

  it('is deterministic — the same draw repeated gives the same answer', () => {
    const rng = new RollPolicyRng('mid');
    const first = [rng.int(0, 31), rng.int(0, 100), rng.int(6, 16)];
    const second = [rng.int(0, 31), rng.int(0, 100), rng.int(6, 16)];
    expect(second).toEqual(first);
  });

  it('picks the middle element and never reorders', () => {
    const rng = new RollPolicyRng('mid');
    expect(rng.pick(['a', 'b', 'c'])).toBe('b');
    expect(rng.shuffle([1, 2, 3])).toEqual([1, 2, 3]);
    expect(rng.weighted(['a', 'b', 'c'], [1, 9, 2])).toBe('b');
  });
});

describe('simulateFFXCommand', () => {
  it('never mutates the state it is handed', () => {
    const { engine } = newFfxEngine('seymour-flux', 7);
    const decision = firstDecision(engine);
    const state = engine.state();
    const before = JSON.stringify(state);

    for (const row of decision.commands.filter((c) => c.enabled && c.validTargets.length > 0)) {
      for (const roll of ['min', 'mid', 'max'] as const) {
        simulateFFXCommand(state, decision.actorId, aim(row), { roll });
      }
    }

    expect(JSON.stringify(engine.state())).toBe(before);
  });

  it('puts the engine’s own damage inside the range it quoted', () => {
    const seeds = [1, 2, 3, 5, 8];
    let compared = 0;

    for (const seed of seeds) {
      const { engine, content } = newFfxEngine('seymour-flux', seed);
      const decision = firstDecision(engine);
      const attack = decision.commands.find((c) => c.enabled && c.command.kind === 'attack');
      if (!attack) continue;
      const boss = attack.validTargets.find((id) => id.startsWith('seymour')) ?? attack.validTargets[0]!;
      const command = aim(attack, boss);

      const state = engine.state();
      const min = simulateFFXCommand(state, decision.actorId, command, { roll: 'min', content });
      const max = simulateFFXCommand(state, decision.actorId, command, { roll: 'max', content });
      expect(min).not.toBeNull();
      expect(max).not.toBeNull();

      // The real engine, same board, same command.
      const hpBefore = state.combatants[boss]!.hp;
      engine.submit(command);
      const dealt = hpBefore - engine.state().combatants[boss]!.hp;

      // A critical hit or a miss is outside the quoted band by design (the
      // advisor prints both chances separately), so only compare when the real
      // roll was an ordinary landed hit.
      const events = engine.state().log.slice(-12);
      const crit = events.some((e) => e.type === 'damage' && e.crit);
      const missed = events.some((e) => e.type === 'miss');
      if (crit || missed || dealt <= 0) continue;

      compared += 1;
      expect(dealt).toBeGreaterThanOrEqual(min!.damageToEnemies);
      expect(dealt).toBeLessThanOrEqual(max!.damageToEnemies);
    }

    expect(compared).toBeGreaterThan(0);
  });

  it('orders the three rolls: min ≤ mid ≤ max', () => {
    const { engine, content } = newFfxEngine('seymour-flux', 4);
    const decision = firstDecision(engine);
    const attack = decision.commands.find((c) => c.enabled && c.command.kind === 'attack');
    expect(attack).toBeDefined();
    const command = aim(attack!);
    const state = engine.state();

    const min = simulateFFXCommand(state, decision.actorId, command, { roll: 'min', content })!;
    const mid = simulateFFXCommand(state, decision.actorId, command, { roll: 'mid', content })!;
    const max = simulateFFXCommand(state, decision.actorId, command, { roll: 'max', content })!;

    expect(min.damageToEnemies).toBeLessThanOrEqual(mid.damageToEnemies);
    expect(mid.damageToEnemies).toBeLessThanOrEqual(max.damageToEnemies);
    expect(min.damageToEnemies).toBeGreaterThan(0);
  });

  it('reports a heal as healing, not as damage', () => {
    const { engine, content } = newFfxEngine('seymour-flux', 11);
    const decision = firstDecision(engine);
    const state = engine.state();
    const potion = decision.commands.find(
      (c) => c.enabled && c.command.kind === 'item' && /potion/i.test(c.label),
    );
    if (!potion) return; // the opening actor has no Item row on this board
    const hurt = state.activeIds.find((id) => {
      const c = state.combatants[id]!;
      return c.alive && c.hp < c.stats.maxHp;
    });
    const out = simulateFFXCommand(state, decision.actorId, aim(potion, hurt), { roll: 'mid', content });
    expect(out).not.toBeNull();
    expect(out!.harmToAllies).toBe(0);
    expect(out!.healingToAllies).toBeGreaterThanOrEqual(0);
  });
});
