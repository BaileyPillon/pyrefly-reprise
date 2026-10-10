/**
 * **Engine-level parity, FFX per-turn ticks** (re-parity W2; **FFX only**). The turn order is in
 * `parity-ffx-engine-ctb-status.test.ts`, the status infliction in `parity-ffx-engine-status.test.ts`; all follow the pattern of
 * `parity-ffx-engine-wiring.test.ts`: the engine's own path against an oracle that runs the kernels by an independent route.
 *
 * The kernel test (`parity-ffx-turn-ticks.test.ts`) proves the tick functions against the game's own machine code. This file proves
 * the WIRING of the engine's `onTurnStart` and `onTurnEnd` on a few hundred generated fields written in the game's terms (31 character
 * slots, HP, the Zombie / Poison / Threaten bits, thirteen counters, the stances and Doom in the extra word, each holder's own Regen
 * tick counter, Threaten pairs, a bench and an aeon out):
 *
 * 1. the start of a turn: every Regen holder on the field is paid `(its tick counter * maxHP >> 8) + 100` (a Zombie takes it as damage)
 *    and has its tick counter reset, the actor's own Regen counter counts down, its Defend / Guard / Sentinel / Shield / Boost end
 *    unless equipment gives them, and the Threaten pair it belongs to is released;
 * 2. Doom counts down at the start of the actor's own turn and kills it at 0;
 * 3. the end of the turn: Sleep, Silence, Darkness, Shell, Protect, Reflect, Haste and Slow count down by one, and Poison takes
 *    `percent * maxHP / 100` only after an action whose results were applied.
 */

import { describe, expect, it } from 'vitest';
import { onTurnEnd, onTurnStart } from '../../src/battle/ffx/index.ts';
import { makeRng } from './helpers/ffxEngineCtb.ts';
import { applySpecs, contextOfField, looksOfEngine, oracleTicks, randomTickSituation } from './helpers/ffxEngineTicks.ts';

describe('the engine ticks a turn as the kernels do, on generated fields', () => {
  it('800 situations: the same HP, deaths, tick counters, counters, stances, Threaten pairs and Doom', () => {
    const rng = makeRng(20261010);
    const seen = { regen: 0, zombieHit: 0, released: 0, doom: 0, doomFired: 0, poison: 0, stanceCleared: 0, counterTicked: 0, regenCount: 0, died: 0 };
    for (let i = 0; i < 800; i++) {
      const sit = randomTickSituation(rng);
      const { ctx, byId } = contextOfField(sit.field, makeRng(1));
      applySpecs(ctx, byId, sit);
      const before = looksOfEngine(ctx, byId, sit);
      const actor = byId.get(sit.actor)!;

      onTurnStart(ctx, actor);
      const diedAtStart = !actor.alive || actor.statuses['ko'] !== undefined;
      // The engine's turn loop closes the turn of an actor who died as it opened with no results applied (afterAction without a command).
      onTurnEnd(ctx, actor, diedAtStart ? false : sit.resultsApplied);

      const got = looksOfEngine(ctx, byId, sit);
      const want = oracleTicks(sit);
      expect(got, `situation ${i} (actor ${sit.actor})`).toEqual(want);

      for (const m of sit.field.members) {
        const b = before[m.id]!, a = got[m.id]!;
        if (a.regenTicks === 0 && b.regenTicks > 0) seen.regen++;
        if (a.hp < b.hp && sit.specs.get(m.id)!.zombie && (sit.specs.get(m.id)!.counters[10] as number) > 0) seen.zombieHit++;
        if (b.threatened && !a.threatened) seen.released++;
        if (b.doom !== null && a.doom !== b.doom) seen.doom++;
        if (b.alive && !a.alive) seen.died++;
        if (b.stances !== null && a.stances !== null && (b.stances & ~a.stances) !== 0) seen.stanceCleared++;
        if (b.counters && a.counters) {
          if (a.counters[10] !== b.counters[10]) seen.regenCount++;
          if (a.counters.some((v, k) => k !== 10 && v !== b.counters![k])) seen.counterTicked++;
        }
      }
      if (sit.specs.get(sit.actor)!.poison && sit.resultsApplied) seen.poison++;
      if (!actor.alive && sit.specs.get(sit.actor)!.doom >= 0 && actor.statuses['ko'] !== undefined) seen.doomFired++;
    }
    // The sample is wide enough to have exercised each branch.
    expect(seen.regen).toBeGreaterThan(150);
    expect(seen.zombieHit).toBeGreaterThan(20);
    expect(seen.released).toBeGreaterThan(40);
    expect(seen.doom).toBeGreaterThan(30);
    expect(seen.poison).toBeGreaterThan(80);
    expect(seen.stanceCleared).toBeGreaterThan(40);
    expect(seen.counterTicked).toBeGreaterThan(150);
    expect(seen.regenCount).toBeGreaterThan(20);
    expect(seen.died).toBeGreaterThan(10);
  });
});
