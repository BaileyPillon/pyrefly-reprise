/**
 * The Vegnagun chain and Shuyin [research/ffx2-vegnagun-shuyin.md §4, §5].
 *
 * Each battle in the chain has one mechanic that is the whole fight, and these
 * are the tests that keep them honest:
 * - **Core**: three charges then Memento Mori, and **killing a Bulwark buys a
 *   turn** — the intended counterplay, and not obvious from the scan text.
 * - **Bulwarks**: they *answer in kind*, so the damage type you choose picks
 *   the retaliation you get.
 * - **Head**: the cannon fail clock is a counter of **Shuyin's seven speech
 *   events**, it does not start until Phase B, and it must never be drawn as a
 *   number — the lines are the UI.
 * - **Shuyin**: an eight-turn cycle with Terror of Zanarkand at slot 2, and the
 *   original PS2 bias toward targeting Yuna.
 */

import { describe, expect, it } from 'vitest';
import { aiScriptFor, nodeColour, syncNodeImmunity } from '../../src/battle/ffx2/index.ts';
import { aiHarness as harness, aiUnit as unit } from '../../src/battle/ffx2/fixtures.ts';

describe('Vegnagun (Tail) — the simplest boss in the chain [§5.1]', () => {
  it('opens on a flavour turn, then Noli Me Tangere, then Tail Beam forever', () => {
    const tail = unit('vegnagun-tail', 'enemy', 34200);
    expect(harness(tail).run(6)).toEqual([
      null, 'noli-me-tangere', 'tail-beam', 'tail-beam', 'tail-beam', 'tail-beam',
    ]);
  });

  it('fires its one HP trigger below a quarter HP, and only once', () => {
    const tail = unit('vegnagun-tail', 'enemy', 34200);
    const h = harness(tail);
    h.run(4);
    tail.hp = Math.floor(34200 / 5);
    expect(h.run(1)).toEqual(['noli-me-tangere']);
    expect(h.emitted.some((e) => e.type === 'script-trigger')).toBe(true);
    // Still below a quarter — but the trigger is spent.
    expect(h.run(1)).toEqual(['tail-beam']);
  });
});

describe('Vegnagun (Leg) — the 26-step table [§5.2]', () => {
  it('settles into Vita Brevis every fourth turn', () => {
    const leg = unit('vegnagun-leg', 'enemy', 18220);
    const chosen = harness(leg).run(40);
    // Steps 21-24 loop as V, Action1, Action1, Action1.
    const steady = chosen.slice(24);
    const vitaPositions = steady.map((c, i) => (c === 'vita-brevis' ? i : -1)).filter((i) => i >= 0);
    expect(vitaPositions.length).toBeGreaterThan(2);
    for (let i = 1; i < vitaPositions.length; i++) {
      expect((vitaPositions[i] as number) - (vitaPositions[i - 1] as number)).toBe(4);
    }
  });

  it('spends a third of its real turns on flavour, which is the pacing valve', () => {
    const leg = unit('vegnagun-leg', 'enemy', 18220);
    const chosen = harness(leg).run(24);
    expect(chosen.filter((c) => c === null).length).toBeGreaterThan(6);
  });

  it('falls back to Absorb when everybody already has the rolled status', () => {
    const leg = unit('vegnagun-leg', 'enemy', 18220);
    const h = harness(leg);
    for (const p of h.ctx.party()) {
      for (const id of ['berserk', 'petrify', 'slow'] as const) {
        p.statuses[id] = { id, turnsRemaining: null, ticksRemaining: null, charges: null, stacks: 0, permanent: true };
      }
    }
    const chosen = h.run(24).filter((c) => c !== null);
    expect(chosen).toContain('leg-absorb');
    expect(chosen).not.toContain('leg-berserk');
  });
});

describe('the Nodes’ colour machine [§3.2]', () => {
  it('advances RED -> GREEN -> YELLOW -> RED every four counts', () => {
    const node = unit('node-a', 'enemy', 300000);
    const h = harness(node, [unit('vegnagun-leg', 'enemy', 18220)], 'vegnagun-node');
    expect(nodeColour(node)).toBe('red');
    h.run(4);
    expect(nodeColour(node)).toBe('green');
    h.run(4);
    expect(nodeColour(node)).toBe('yellow');
    h.run(4);
    expect(nodeColour(node)).toBe('red');
  });

  it('is Null Physical while RED and Null Magic while YELLOW', () => {
    const node = unit('node-a', 'enemy', 300000);
    syncNodeImmunity(node);
    expect(node.statuses['null-physical']).toBeDefined();
    expect(node.statuses['null-magic']).toBeUndefined();

    const h = harness(node, [], 'vegnagun-node');
    h.run(8); // through GREEN into YELLOW
    expect(nodeColour(node)).toBe('yellow');
    expect(node.statuses['null-magic']).toBeDefined();
    expect(node.statuses['null-physical']).toBeUndefined();
  });

  it('casts its GREEN support on the LEG, never on itself', () => {
    const node = unit('node-a', 'enemy', 300000);
    const leg = unit('vegnagun-leg', 'enemy', 18220, 1);
    const h = harness(node, [leg], 'vegnagun-node');
    h.run(4); // move to GREEN
    const script = aiScriptFor('vegnagun-node');
    const command = script.decide(h.ctx);
    expect(command && 'targets' in command ? command.targets : []).toEqual(['vegnagun-leg']);
  });
});

describe('Vegnagun (Body / Core) [§4.1]', () => {
  const makeCore = () => {
    const core = unit('vegnagun-body', 'enemy', 33040);
    const right = unit('bulwark-r', 'enemy', 3000, 1);
    const left = unit('bulwark-l', 'enemy', 3000, 2);
    return { core, right, left, h: harness(core, [right, left]) };
  };

  it('charges three times, then fires Memento Mori, then resets', () => {
    const { h } = makeCore();
    expect(h.run(8)).toEqual([
      'charge-core', 'charge-core', 'charge-core', 'memento-mori',
      'charge-core', 'charge-core', 'charge-core', 'memento-mori',
    ]);
  });

  it('telegraphs the charge with a countdown the HUD can draw', () => {
    const { h } = makeCore();
    h.run(4);
    const charges = h.emitted.filter((e) => e.type === 'charge');
    expect(charges.map((c) => (c as { turnsLeft: number }).turnsLeft)).toEqual([2, 1, 0, 0]);
  });

  it('spends a turn reviving a downed Bulwark — killing one BUYS a turn', () => {
    const { right, h } = makeCore();
    h.run(1); // one charge banked
    right.alive = false;
    right.hp = 0;
    expect(h.run(1)).toEqual(['full-life']);
    // The charge count did not advance while it was reviving.
    expect(h.ctx.self.aiMemory?.['actionCount']).toBe(1);
  });
});

describe('the Bulwarks answer in kind [§3.3]', () => {
  function retaliation(attackClass: string): string | null {
    const core = unit('vegnagun-body', 'enemy', 33040);
    const right = unit('bulwark-r', 'enemy', 3000, 1);
    const h = harness(right, [core], 'vegnagun-bulwark');
    h.flags['coreLogWho'] = 'yuna';
    h.flags['coreLogClass'] = attackClass;
    return h.run(1)[0] ?? null;
  }

  it('answers a physical hit with the AoE "Physical attack detected"', () => {
    expect(retaliation('protect-reducible')).toBe('physical-attack-detected');
  });

  it('answers a magical hit with "Magical attack detected"', () => {
    expect(retaliation('shell-reducible')).toBe('magical-attack-detected');
  });

  it('answers everything else with the single-target buff-strip', () => {
    // Darkness, Charon, fixed and fractional player abilities land here.
    expect(retaliation('none')).toBe('hostile-activity-detected');
  });

  it('idles on buffs when the Core’s attack log is empty', () => {
    const core = unit('vegnagun-body', 'enemy', 33040);
    const right = unit('bulwark-r', 'enemy', 3000, 1);
    const chosen = harness(right, [core], 'vegnagun-bulwark').run(1)[0];
    expect(['node-regen', 'node-shell', 'node-protect']).toContain(chosen);
  });

  it('consumes the log, so one strike is answered once', () => {
    const core = unit('vegnagun-body', 'enemy', 33040);
    const right = unit('bulwark-r', 'enemy', 3000, 1);
    const h = harness(right, [core], 'vegnagun-bulwark');
    h.flags['coreLogWho'] = 'yuna';
    h.flags['coreLogClass'] = 'protect-reducible';
    expect(h.run(1)[0]).toBe('physical-attack-detected');
    expect(h.flags['coreLogWho']).toBeUndefined();
  });
});
