/**
 * **Between the hits of one action: two bookkeeping rules of the FFX engine, pinned by hand** (r78-fix2, 2026-11-08; **FFX only**: the infliction step and the hit record are the FFX kernels'; FFX-2 has its own engine).
 *
 * The seeded status sweep (`parity-ffx-engine-status.test.ts`) draws the whole catalog against the kernels and found, once the hidden Flooded Ways' and Wendigo's rows moved its draws, three differences in the
 * status words after a multi-hit action. They were hidden by a filter for two releases (`docs/handoff/r78-fix2.md`). Two were the engine's, and are pinned here with the smallest action that shows each; the third was the sweep's
 * own oracle (it priced a fraction-of-the-maximum hit from the starting maxima after an earlier hit had turned Double HP or Double MP on) and is covered by the sweep.
 *
 * 1. **A Threaten that lands decays the monster's live percent every time it lands.** The kernel returns the resistance block with the Threaten byte at 70 percent of what it was (never below 1) for every landing, and the game keeps
 *    it. The engine wrote the new byte only when the record's Threaten bit went from clear to set, so a second hit of one action (the step reads the target as the action began, so it lands again) left the byte where the first hit
 *    put it, and the next roll was made against a larger percent than the game's.
 * 2. **A hit nullified by a Nul ticks the hit record, not only the target.** The Nul check reads and edits the record's four Nul counters. The engine ticked the target's status and left the record alone, so a Nul that a later
 *    hit of the same action lands was compared with the unticked counter: a spent Nul (a one-charge counter, ticked to nothing) that the same action lands again was never given back.
 *
 * Both are inert for every shipped record: no multi-hit record carries Threaten, and no multi-hit record that carries a Nul status has an element a Nul can turn aside (`docs/handoff/r78-fix2.md` has the scan).
 */

import { describe, expect, it } from 'vitest';
import type { FFXCombatant } from '../../src/battle/common/types.ts';
import { resolveAbility } from '../../src/battle/ffx/index.ts';
import { ability } from './ffx-fixtures.test.ts';
import { ScriptedRng, combatantOf, contextOf, makeRng, randomSide } from './helpers/ffxEngineWiring.ts';

/** A party caster and a monster with nothing on it and no resistance, in a battle whose draws are all `raw`. */
function rig(raw: number) {
  const rng = makeRng(31);
  const user = combatantOf(randomSide(rng, true), 'yuna', 'party');
  const foe = combatantOf(randomSide(rng, false), 'enemy-t', 'enemy');
  foe.statuses = {};
  foe.immunities = {};
  foe.immunityFlags = [];
  foe.enemy = { rewards: { ap: 0, apOverkill: 0, gil: 0, overkillThreshold: 0x7fffffff, drops: [] }, forms: [], doomTurns: 5 } as unknown as FFXCombatant['enemy'];
  const { ctx, events } = contextOf(user, foe, new ScriptedRng([raw]), 0);
  return { ctx, events, user, foe };
}

describe('a landed Threaten decays the monster\'s live percent each time it lands, in every hit of the action', () => {
  const threaten = (hits: number) =>
    ability({ id: 'threaten-chain', formula: 'none', canMiss: false, targeting: 'single-enemy', hits, statusEffects: [{ status: 'threaten', chance: 255, duration: 254 }] });

  it('one hit: 100 percent becomes 70 (what it always did)', () => {
    const { ctx, user, foe } = rig(0);
    ctx.rt.actors.get(foe.id)!.threatenChance = 100;
    resolveAbility(ctx, user, threaten(1), [foe.id], { hits: 1 });
    expect(foe.statuses['threaten']).toBeDefined();
    expect(ctx.rt.actors.get(foe.id)!.threatenChance).toBe(70);
  });

  it('two hits: the second landing decays it again, 100 to 70 to 49 (it stopped at 70 while the record already held the bit)', () => {
    const { ctx, user, foe } = rig(0);
    ctx.rt.actors.get(foe.id)!.threatenChance = 100;
    resolveAbility(ctx, user, threaten(2), [foe.id], { hits: 2 });
    expect(foe.statuses['threaten']).toBeDefined();
    expect(ctx.rt.actors.get(foe.id)!.threatenChance).toBe(49);
  });

  it('three hits: 100, 70, 49, 34 (the percent never goes under 1, and each roll is made against the percent the last landing left)', () => {
    const { ctx, user, foe } = rig(0);
    ctx.rt.actors.get(foe.id)!.threatenChance = 100;
    resolveAbility(ctx, user, threaten(3), [foe.id], { hits: 3 });
    expect(ctx.rt.actors.get(foe.id)!.threatenChance).toBe(34);
  });

  it('a Threaten that does not land (the roll is at or over the percent) leaves the percent alone', () => {
    const { ctx, user, foe } = rig(99);
    ctx.rt.actors.get(foe.id)!.threatenChance = 50;
    resolveAbility(ctx, user, threaten(2), [foe.id], { hits: 2 });
    expect(foe.statuses['threaten']).toBeUndefined();
    expect(ctx.rt.actors.get(foe.id)!.threatenChance).toBe(50);
  });
});

describe('a hit nullified by a Nul ticks the hit record, so a later hit of the same action that lands a Nul meets the ticked counter', () => {
  /** Three water hits that each try to put one charge of Nul-Tide on the target. */
  const tideThrice = ability({
    id: 'tide-chain', formula: 'none', canMiss: false, targeting: 'single-enemy', hits: 3, element: ['water'], statusEffects: [{ status: 'nultide', chance: 254, duration: 1 }],
  });

  it('hit 1 lands the charge, hit 2 is turned aside and spends it, hit 3 lands it again: the target ends with one charge', () => {
    const { ctx, events, user, foe } = rig(7);
    resolveAbility(ctx, user, tideThrice, [foe.id], { hits: 3 });
    expect(events.filter((e) => e['type'] === 'miss' && e['reason'] === 'nullified')).toHaveLength(1);
    const adds = events.filter((e) => e['type'] === 'status-add' && e['status'] === 'nultide');
    expect(adds).toHaveLength(2); // the first charge, then the one the third hit gave back
    expect(foe.statuses['nultide']).toBeDefined();
    expect(foe.statuses['nultide']!.charges).toBe(1);
  });

  it('with two hits only (landed, then turned aside) the charge is spent and the target ends with none', () => {
    const { ctx, user, foe } = rig(7);
    resolveAbility(ctx, user, { ...tideThrice, hits: 2 }, [foe.id], { hits: 2 });
    expect(foe.statuses['nultide']).toBeUndefined();
  });
});
