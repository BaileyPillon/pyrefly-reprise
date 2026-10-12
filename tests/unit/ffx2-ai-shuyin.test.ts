/**
 * Vegnagun's Head, its Redoubts, and Shuyin
 * [research/ffx2-vegnagun-shuyin.md §4.2, §5.4, §5.5; re-read from the game's own scripts by re-parity AI lane FFX-2 a:
 * research/re-ffx2-ai-bahamut-vegnagun.md sections 6 and 7; the row-by-row tests are in parity-ffx2-ai-head.test.ts and
 * parity-ffx2-ai-shuyin.test.ts].
 *
 * Two mechanics carry these two battles:
 * - **The cannon fail clock.** One shared counter of the polls of the Head and both Redoubts, 100 of them, with Shuyin's
 *   lines at its 20, 40, 60 and 80; it does not start until Phase B, so stalling in Phase A is not punished; and it must
 *   never be drawn as a number — the lines *are* the UI. (Re-pinned for "game-script parity": it was 240 combined turns with a
 *   line every 48, counted by the engine after each resolved turn, and the phase changed when any Redoubt fell.)
 * - **Shuyin's eight-turn cycle**, with Terror of Zanarkand at slot 2. (Re-pinned for "game-script parity": the old
 *   "he hunts Yuna" reading is gone; Terror of Zanarkand goes to the girl in her Special 1 dressphere, else the search's pick.)
 *
 * The Tail, Leg, Nodes, Core and Bulwarks are in ffx2-ai-vegnagun.test.ts.
 */

import { describe, expect, it } from 'vitest';
import { aiScriptFor, defaultAbilities } from '../../src/battle/ffx2/index.ts';
import { aiUnit } from '../../src/battle/ffx2/fixtures.ts';
import { HEAD_FIRE_AT_TURN, HEAD_LINE_INTERVAL } from '../../src/battle/ffx2/index.ts';
import { scriptHarness, triggerNames } from './helpers/ffx2AiScripted.ts';

describe('Vegnagun (Head) — the cannon fail clock [§4.2, §5.4]', () => {
  function makeHead() {
    const head = aiUnit('vegnagun-head', 'enemy', 38420);
    const right = aiUnit('redoubt-r', 'enemy', 2500, 1);
    const left = aiUnit('redoubt-l', 'enemy', 2500, 2);
    return { head, right, left, h: scriptHarness(head, 'vegnagun-head', [right, left], [], 1) };
  }

  it('is untargetable in Phase A and only has Pallida Mors', () => {
    const { head, h } = makeHead();
    const chosen = h.run(4);
    expect(chosen[0]).toBeNull(); // Shuyin's first line
    expect(chosen.slice(1)).toEqual(['pallida-mors', 'pallida-mors', 'pallida-mors']);
    expect(head.flags.untargetable).toBe(true);
  });

  it('does NOT run the clock in Phase A — stalling there is not punished', () => {
    const { right, h } = makeHead();
    right.alive = false; // one Redoubt down: the Head idles, and the clock stays off
    h.run(300);
    expect(h.flags['headTurns']).toBeUndefined();
    expect(h.flags['badEnding']).toBeUndefined();
  });

  it('enters Phase B only once BOTH Redoubts have been downed, and opens with Acta Est Fabula', () => {
    const { head, right, left, h } = makeHead();
    h.run(2);
    right.alive = false;
    right.hp = 0;
    expect(h.run(1)).toEqual([null]); // one Redoubt left: it idles
    expect(h.flags['headPhase']).toBeUndefined();
    left.alive = false;
    left.hp = 0;
    expect(h.run(1)[0]).toBe('acta-est-fabula');
    expect(h.flags['headPhase']).toBe('B');
    expect(head.flags.untargetable).toBe(false);
  });

  it('carries the fail-timer constants in `AbilityDef.extra`, not on a new field', () => {
    const acta = defaultAbilities.get('acta-est-fabula');
    expect(acta?.extra?.['failTimer']).toEqual({
      fireAtTurn: HEAD_FIRE_AT_TURN,
      lineInterval: HEAD_LINE_INTERVAL,
    });
  });

  it('speaks lines 3–6 as the shared clock passes 20, 40, 60 and 80, then ends the run on line 7 at 100', () => {
    const { right, left, h } = makeHead();
    h.run(1);
    right.alive = false;
    left.alive = false;
    h.run(1); // Phase B opens
    right.alive = true;
    left.alive = true;
    const script = aiScriptFor('vegnagun-redoubt');
    // The Redoubts raise the same counter on every phase-2 poll of theirs; the Head polls between them.
    let guard = 0;
    while (h.flags['badEnding'] !== true && guard++ < 1000) {
      h.run(1);
      for (const pod of [right, left]) script.decide({ ...h.ctx, self: pod });
    }
    const lines = triggerNames(h.emitted).filter((name) => name.startsWith('shuyin-line-'));
    expect(lines).toEqual([1, 2, 3, 4, 5, 6, 7].map((n) => `shuyin-line-${n}`));
    expect(h.flags['badEnding']).toBe(true);
    expect(h.flags['headTurns']).toBeGreaterThanOrEqual(HEAD_FIRE_AT_TURN);
  });

  it('never draws a number: the clock emits lines, not `charge` countdowns', () => {
    const { right, left, h } = makeHead();
    h.run(1);
    right.alive = false;
    left.alive = false;
    h.run(1);
    h.flags['headTurns'] = 0;
    h.run(200);
    expect(h.emitted.some((e) => e.type === 'charge')).toBe(false);
  });
});

describe('the Redoubts [§3.4, §5.4]', () => {
  it('only revive their twin before Phase B', () => {
    const right = aiUnit('redoubt-r', 'enemy', 2500, 1);
    const left = aiUnit('redoubt-l', 'enemy', 2500, 2);
    left.alive = false;
    const h = scriptHarness(right, 'vegnagun-redoubt', [left]);
    expect(h.run(1)).toEqual(['full-life']);
  });

  it('run a four-step rotation once Acta Est Fabula has touched them', () => {
    const right = aiUnit('redoubt-r', 'enemy', 2500, 1);
    const left = aiUnit('redoubt-l', 'enemy', 2500, 2);
    const h = scriptHarness(right, 'vegnagun-redoubt', [left]);
    h.flags['headPhase'] = 'B';
    // A fresh counter: Break, the HP beam, Blind, Flare (a Redoubt that has died starts at the HP beam: the parity test).
    expect(h.run(5)).toEqual(['leg-break', 'lacrimosa-r', 'blind', 'flare', 'leg-break']);
  });

  it('mirror each other: Left runs the debuff rotation', () => {
    const left = aiUnit('redoubt-l', 'enemy', 2500, 2);
    const right = aiUnit('redoubt-r', 'enemy', 2500, 1);
    const h = scriptHarness(left, 'vegnagun-redoubt', [right]);
    h.flags['headPhase'] = 'B';
    expect(h.run(4)).toEqual(['lacrimosa-l', 'leg-slow', 'dispel', 'demi']);
  });
});

describe('Shuyin — the eight-turn cycle [§5.5]', () => {
  function makeShuyin() {
    const shuyin = aiUnit('shuyin', 'enemy', 23850);
    shuyin.stats.luck = 14;
    // A fallback of 1 keeps the voice gate\'s coin on tails, so the cycle runs without interrupts.
    return scriptHarness(shuyin, 'shuyin', [], [], 1);
  }

  it('runs Attack / Terror / Attack / Hit & Run / Attack / Spin Cut / Attack / Force Rain', () => {
    const h = makeShuyin();
    const expected = [
      'shuyin-attack', 'terror-of-zanarkand', 'shuyin-attack', 'run-and-slash',
      'shuyin-attack', 'spin-cut', 'shuyin-attack', 'force-rain',
    ];
    const chosen = h.run(16);
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

  it('spends turns on one-shot flavour lines, and runs out of them', () => {
    const shuyin = aiUnit('shuyin', 'enemy', 23850);
    const h = scriptHarness(shuyin, 'shuyin', [], [], 0); // every coin a heads: a line whenever the gate is open
    h.run(400);
    const lines = h.emitted.filter((e) => e.type === 'script-trigger');
    expect(lines.length).toBeGreaterThan(0);
    expect(lines.length).toBeLessThanOrEqual(5); // five available above half HP
  });

  it('draws from a larger pool below half HP', () => {
    const shuyin = aiUnit('shuyin', 'enemy', 23850);
    shuyin.hp = 1000; // well under half of 23,850
    const h = scriptHarness(shuyin, 'shuyin', [], [], 0);
    h.run(400);
    const lines = h.emitted.filter((e) => e.type === 'script-trigger');
    expect(lines.length).toBeGreaterThan(0);
    expect(lines.length).toBeLessThanOrEqual(7);
  });
});
