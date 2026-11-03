/**
 * The hidden Spectral Keeper chapter on the real engine, part 2 (FFX only; Tidus, Yuna and Auron on the glyph platforms, seeded): aeon mode (RE 4.4) and the whole fight (the god-mode payout path, a defeat, determinism, a fork).
 * Split from `spectral-keeper-engine.test.ts` to keep both files under the 400-line house cap. The winnability of the fight is MEASURED, with no god mode, in `spectral-keeper-measure.test.ts`.
 */

import { describe, expect, it } from 'vitest';
import type { BattleEngine } from '../../../src/battle/common/types.ts';
import { setHitCount } from '../../../src/battle/ffx/platforms.ts';
import {
  KEEPER, actionList, actor, circleId, ctxOf, defend, events, flags, inputFor, invincible, log, newEngine, nextInput, party, platformOfId, scan, swing,
} from '../helpers/keeperDrive.ts';

describe('aeon mode (RE 4.4)', () => {
  function summoned(seed: number): BattleEngine {
    const engine = newEngine(seed);
    const d = inputFor(engine, 'yuna');
    const summon = d.commands.find((c) => c.command.kind === 'summon' && c.enabled);
    expect(summon, 'Yuna has an aeon to call').toBeDefined();
    engine.submit(summon!.command);
    return engine;
  }

  it('with an aeon out the Keeper uses its plain Attack, not the tail and not the sweep, and never changes "in front"', () => {
    const engine = summoned(61);
    const front = flags(engine)['plat.front'];
    for (let i = 0; i < 14; i++) {
      const n = engine.nextDecision();
      if (n.kind !== 'player-input') continue;
      engine.submit(swing(n) ?? defend());
    }
    // Only what the Keeper did while an aeon stood on the field (between the summon and the dismissal) is this rule's.
    const acts: string[] = [];
    let out = false;
    for (const e of events(engine)) {
      if (e.type === 'summon') out = true;
      else if (e.type === 'dismiss') out = false;
      else if (out && e.type === 'action-start' && e.actorId === KEEPER) acts.push(e.abilityId ?? '');
    }
    expect(acts).toContain('keeper-aeon-attack');
    expect(acts).not.toContain('keeper-berserk-tail');
    expect(acts).not.toContain('keeper-attack-all');
    expect(flags(engine)['plat.front']).toBe(front);
  });

  it('the mine is the rock\'s Circle, which kills a random living aeon (the counter starts at 4 here; the gains themselves are pinned in spectral-keeper-counter.test.ts)', () => {
    const engine = summoned(62);
    const ctx = ctxOf(engine);
    setHitCount(ctx, 4);
    let blasted = false;
    for (let i = 0; i < 60 && !blasted; i++) {
      const n = engine.nextDecision();
      if (n.kind === 'battle-over') break;
      if (n.kind === 'player-input') engine.submit(defend());
      blasted = actionList(events(engine)).includes(`${circleId(7)}:keeper-mine-blast`);
    }
    expect(actionList(events(engine))).toContain(`${KEEPER}:keeper-glyph-mine`);
    expect(blasted).toBe(true);
    expect(events(engine).some((e) => e.type === 'ko')).toBe(true);
  });
});

describe('the whole fight', () => {
  it('the payout path, in GOD MODE (every member reset to 99,999 HP each step, fallen ones stood up): the Keeper falls and pays 7,000 gil and 12,000 AP. This proves the wiring of the end, NOT that the party can win; see spectral-keeper-measure.test.ts', () => {
    const engine = newEngine(71);
    let over = false;
    for (let i = 0; i < 4000 && !over; i++) {
      invincible(engine); // a mechanic test: the rules above are the fight, this is the other end of it
      for (const id of party) {
        // a mine's Death ignores HP: stand a fallen member up so the line runs to the end (the blasts themselves are the mines' cases above)
        const c = actor(engine, id);
        if (c.statuses['ko']) {
          delete c.statuses['ko'];
          c.alive = true;
        }
      }
      const d = engine.nextDecision();
      if (d.kind === 'battle-over') {
        over = true;
        expect(d.result.outcome).toBe('victory');
        expect(d.result.gil).toBe(7_000);
        expect(d.result.ap).toBeGreaterThanOrEqual(12_000);
        break;
      }
      if (d.kind === 'player-input') engine.submit(swing(d) ?? defend());
    }
    expect(over).toBe(true);
    expect(actor(engine, KEEPER).hp).toBe(0);
  });

  it('a defeat: a party that only swings is swept and mined out', () => {
    const engine = newEngine(72);
    let outcome: string | undefined;
    for (let i = 0; i < 400 && outcome === undefined; i++) {
      const d = engine.nextDecision();
      if (d.kind === 'battle-over') outcome = d.result.outcome;
      else if (d.kind === 'player-input') engine.submit(swing(d) ?? defend());
    }
    expect(outcome).toBe('defeat');
  });

  it('is deterministic: the same seed plays the same log', () => {
    const play = (seed: number): string => {
      const engine = newEngine(seed);
      for (let i = 0; i < 60; i++) {
        invincible(engine);
        const d = engine.nextDecision();
        if (d.kind === 'battle-over') break;
        if (d.kind === 'player-input') engine.submit(swing(d) ?? defend());
      }
      return JSON.stringify(log(engine));
    };
    expect(play(81)).toBe(play(81));
    expect(play(81)).not.toBe(play(82));
  });

  it('a fork plays on from the same state (the advisor\'s dry runs see the platforms)', () => {
    const engine = newEngine(83);
    inputFor(engine, 'tidus');
    const fork = (engine as unknown as { fork(seed: number): BattleEngine }).fork(5);
    expect(party.map((id) => platformOfId(fork, id))).toEqual([1, 2, 3]);
    expect(scan(nextInput(fork))).toBeNull(); // Tidus has no Scan: the fork's menu is the real one
  });
});
