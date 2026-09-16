/**
 * Vegnagun's Head, its Redoubts, and Shuyin
 * [research/ffx2-vegnagun-shuyin.md §4.2, §5.4, §5.5].
 *
 * Two mechanics carry these two battles:
 * - **The cannon fail clock.** It is a counter of **Shuyin's seven speech
 *   events**, not a timer; it does not start until Phase B, so stalling in
 *   Phase A is not punished; and it must never be drawn as a number — the lines
 *   *are* the UI. A killing blow landing on the same turn as line 7 wins.
 * - **Shuyin's eight-turn cycle**, with Terror of Zanarkand at slot 2 and the
 *   original PS2 bias toward hunting Yuna.
 *
 * The Tail, Leg, Nodes, Core and Bulwarks are in .
 */

import { describe, expect, it } from 'vitest';
import { aiScriptFor, defaultAbilities } from '../../src/battle/ffx2/index.ts';
import type { Ffx2Unit } from '../../src/battle/ffx2/index.ts';
import { aiHarness as harness, aiUnit as unit } from '../../src/battle/ffx2/fixtures.ts';
import { HEAD_FIRE_AT_TURN, HEAD_LINE_INTERVAL } from '../../src/battle/ffx2/index.ts';

describe('Vegnagun (Head) — the cannon fail clock [§4.2, §5.4]', () => {
  function makeHead() {
    const head = unit('vegnagun-head', 'enemy', 38420);
    const right = unit('redoubt-r', 'enemy', 2500, 1);
    const left = unit('redoubt-l', 'enemy', 2500, 2);
    return { head, right, left, h: harness(head, [right, left]) };
  }

  it('is untargetable in Phase A and only has Pallida Mors', () => {
    const { head, h } = makeHead();
    const chosen = h.run(4);
    expect(chosen[0]).toBeNull(); // Shuyin's first line
    expect(chosen.slice(1)).toEqual(['pallida-mors', 'pallida-mors', 'pallida-mors']);
    expect(head.flags.untargetable).toBe(true);
  });

  it('does NOT run the clock in Phase A — stalling there is not punished', () => {
    const { h, head, right, left } = makeHead();
    h.run(4);
    const script = aiScriptFor('vegnagun-head');
    for (let i = 0; i < 100; i++) {
      script.onTurnResolved?.(h.ctx, i % 3 === 0 ? head : i % 3 === 1 ? right : left);
    }
    expect(h.flags['headTurns']).toBeUndefined();
    expect(h.flags['badEnding']).toBeUndefined();
  });

  it('enters Phase B once a Redoubt has been downed, and opens with Acta Est Fabula', () => {
    const { head, right, h } = makeHead();
    h.run(2);
    right.alive = false;
    right.hp = 0;
    h.run(1); // notices and flips to Phase B
    expect(h.flags['headPhase']).toBe('B');
    const chosen = h.run(1);
    expect(chosen[0]).toBe('acta-est-fabula');
    expect(head.flags.untargetable).toBe(false);
  });

  it('carries the fail-timer constants in `AbilityDef.extra`, not on a new field', () => {
    const acta = defaultAbilities.get('acta-est-fabula');
    expect(acta?.extra?.['failTimer']).toEqual({
      fireAtTurn: HEAD_FIRE_AT_TURN,
      lineInterval: HEAD_LINE_INTERVAL,
    });
  });

  it('speaks lines 3–6 on the turn count, then ends the run on line 7', () => {
    const { head, right, left, h } = makeHead();
    h.flags['headPhase'] = 'B';
    h.flags['headClockRunning'] = true;
    h.flags['headTurns'] = 0;
    const script = aiScriptFor('vegnagun-head');
    const pods = [head, right, left];

    for (let i = 1; i <= HEAD_FIRE_AT_TURN; i++) {
      script.onTurnResolved?.(h.ctx, pods[i % 3] as Ffx2Unit);
    }

    const lines = h.emitted
      .filter((e) => e.type === 'script-trigger')
      .map((e) => (e as { name: string }).name)
      .filter((name) => name.startsWith('shuyin-line-'));
    expect(lines).toEqual([
      'shuyin-line-3', 'shuyin-line-4', 'shuyin-line-5', 'shuyin-line-6', 'shuyin-line-7',
    ]);
    expect(h.flags['badEnding']).toBe(true);
  });

  it('fires Auron’s half-way callout at the midpoint', () => {
    const { head, h } = makeHead();
    h.flags['headPhase'] = 'B';
    h.flags['headClockRunning'] = true;
    h.flags['headTurns'] = 0;
    const script = aiScriptFor('vegnagun-head');
    for (let i = 0; i < HEAD_FIRE_AT_TURN / 2; i++) script.onTurnResolved?.(h.ctx, head);
    const names = h.emitted.filter((e) => e.type === 'script-trigger').map((e) => (e as { name: string }).name);
    expect(names).toContain('auron-halfway');
  });

  it('never draws a number: the clock emits lines, not `charge` countdowns', () => {
    const { head, h } = makeHead();
    h.flags['headPhase'] = 'B';
    h.flags['headClockRunning'] = true;
    h.flags['headTurns'] = 0;
    const script = aiScriptFor('vegnagun-head');
    for (let i = 0; i < HEAD_FIRE_AT_TURN; i++) script.onTurnResolved?.(h.ctx, head);
    expect(h.emitted.some((e) => e.type === 'charge')).toBe(false);
  });

  it('stops counting once the Head is dead, so a killing blow wins the race', () => {
    const { head, h } = makeHead();
    h.flags['headPhase'] = 'B';
    h.flags['headClockRunning'] = true;
    h.flags['headTurns'] = HEAD_FIRE_AT_TURN - 1;
    head.alive = false;
    aiScriptFor('vegnagun-head').onTurnResolved?.(h.ctx, head);
    expect(h.flags['badEnding']).toBeUndefined();
  });
});

describe('the Redoubts [§3.4, §5.4]', () => {
  it('only revive their twin before Phase B', () => {
    const right = unit('redoubt-r', 'enemy', 2500, 1);
    const left = unit('redoubt-l', 'enemy', 2500, 2);
    left.alive = false;
    const h = harness(right, [left], 'vegnagun-redoubt');
    expect(h.run(1)).toEqual(['full-life']);
  });

  it('run a four-step rotation once Acta Est Fabula has touched them', () => {
    const right = unit('redoubt-r', 'enemy', 2500, 1);
    const left = unit('redoubt-l', 'enemy', 2500, 2);
    const h = harness(right, [left], 'vegnagun-redoubt');
    h.flags['headPhase'] = 'B';
    expect(h.run(5)).toEqual(['lacrimosa-r', 'blind', 'flare', 'leg-break', 'lacrimosa-r']);
  });

  it('mirror each other: Left runs the debuff rotation', () => {
    const left = unit('redoubt-l', 'enemy', 2500, 2);
    const right = unit('redoubt-r', 'enemy', 2500, 1);
    const h = harness(left, [right], 'vegnagun-redoubt');
    h.flags['headPhase'] = 'B';
    expect(h.run(4)).toEqual(['lacrimosa-l', 'leg-slow', 'dispel', 'demi']);
  });
});

describe('Shuyin — the eight-turn cycle [§5.5]', () => {
  function makeShuyin(seed = 123) {
    const shuyin = unit('shuyin', 'enemy', 23850);
    shuyin.stats.luck = 14;
    return harness(shuyin, [], 'shuyin', seed);
  }

  it('runs Attack / Terror / Attack / Run & Slash / Attack / Spin Cut / Attack / Force Rain', () => {
    const h = makeShuyin();
    const chosen = h.run(40).filter((c) => c !== null); // drop the flavour interrupts
    const expected = [
      'shuyin-attack', 'terror-of-zanarkand', 'shuyin-attack', 'run-and-slash',
      'shuyin-attack', 'spin-cut', 'shuyin-attack', 'force-rain',
    ];
    expect(chosen.slice(0, 8)).toEqual(expected);
    expect(chosen.slice(8, 16)).toEqual(expected);
  });

  it('telegraphs Terror of Zanarkand rather than landing nine hits unannounced', () => {
    const h = makeShuyin();
    h.run(2);
    const charge = h.emitted.find((e) => e.type === 'charge');
    expect(charge).toBeDefined();
    expect((charge as { name: string }).name).toBe('Terror of Zanarkand');
  });

  it('preferentially targets Yuna — the original PS2 behaviour', () => {
    const h = makeShuyin();
    const script = aiScriptFor('shuyin');
    for (let i = 0; i < 8; i++) {
      const command = script.decide(h.ctx);
      if (command && 'targets' in command && command.targets.length === 1) {
        expect(command.targets[0]).toBe('yuna');
      }
    }
  });

  it('targets anyone once the authenticity toggle is flipped', () => {
    const h = makeShuyin(7);
    h.flags['shuyinTargetsAnyone'] = true;
    const script = aiScriptFor('shuyin');
    const hit = new Set<string>();
    for (let i = 0; i < 60; i++) {
      const command = script.decide(h.ctx);
      if (command && 'targets' in command && command.targets[0]) hit.add(command.targets[0]);
    }
    expect(hit.size).toBeGreaterThan(1);
  });

  it('spends turns on one-shot flavour lines, and runs out of them', () => {
    const h = makeShuyin(4242);
    h.run(400);
    const lines = h.emitted.filter((e) => e.type === 'script-trigger');
    expect(lines.length).toBeGreaterThan(0);
    expect(lines.length).toBeLessThanOrEqual(5); // five available above half HP
  });

  it('draws from a larger, more frequent pool below half HP', () => {
    const h = makeShuyin(4242);
    h.ctx.self.hp = 1000; // well under half of 23,850
    h.run(400);
    const lines = h.emitted.filter((e) => e.type === 'script-trigger');
    expect(lines.length).toBeGreaterThan(0);
    expect(lines.length).toBeLessThanOrEqual(7);
  });
});
