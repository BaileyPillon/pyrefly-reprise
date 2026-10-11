/**
 * **Engine-level parity, FFX item reactions** (re-parity RC4 lane F; **FFX only**). The kernel test (`parity-ffx-reaction-items.test.ts`)
 * proves the three decisions against the game's machine code. This file proves the WIRING: the engine's own functions on a few hundred
 * generated fights written in the game's terms (party slots, HP, status words, who wears Auto-Potion, Auto-Med and Auto-Phoenix, the
 * item bag by the game's item numbers), against an oracle typed again from the note (`helpers/ffxEngineReactions.ts`) that imports
 * nothing of the engine's adapter or kernels:
 *
 * 1. a hit that dealt HP damage, or newly inflicted Poison, Zombie, Darkness or Silence, queues Auto-Potion (at or below half, one per
 *    character) and Auto-Med (Remedy for two, the item order), and the item is spent AT ONCE;
 * 2. a character that dies loses every record it had queued (and any queued for it later in the action), nothing refunded, and Auto-Phoenix
 *    is tried only when it had no Auto-Life: the first able holder in slot order, a Phoenix Down only;
 * 3. when the action is over the records run in the order they were queued, an Auto-Phoenix whose rescuer can no longer act is refunded.
 *
 * Mutants (a deliberately wrong oracle) must disagree with the engine on many situations, so the comparison is shown to be able to fail.
 */

import { describe, expect, it } from 'vitest';
import { makeRng } from '../../src/battle/common/rng.ts';
import { reactToHit } from '../../src/battle/ffx/adapt/reactions.ts';
import { runItemReactions } from '../../src/battle/ffx/engine-end.ts';
import { koActor } from '../../src/battle/ffx/hp.ts';
import { type OracleOptions, REACTION_ITEMS, oracle, randomSituation } from './helpers/ffxEngineReactions.ts';
import { type EngineDrive, runEngine } from './helpers/ffxEngineReactionsRun.ts';

const SITUATIONS = 700;

const drive: EngineDrive = {
  reactToHit,
  koActor: (ctx, target) => koActor(ctx, target),
  drain: (ctx, keepDeaths) => runItemReactions({ ctx, push: (e) => ctx.emit(e), buffer: [], nextGroupId: undefined }, keepDeaths),
};

const situations = (() => {
  const rng = makeRng(20261011);
  return Array.from({ length: SITUATIONS }, () => randomSituation(rng));
})();

describe('the engine decides the item reactions as the game does, on generated fights', () => {
  it(`${SITUATIONS} fights: the same reactions, in the same order, and the same bag`, () => {
    const seen = { potion: 0, med: 0, medRemedy: 0, phoenix: 0, lost: 0, drained: 0, empty: 0 };
    situations.forEach((sit, i) => {
      const want = oracle(sit);
      const got = runEngine(sit, makeRng(1), drive);
      expect(got.seen, `fight ${i} reactions`).toEqual(want.seen);
      expect(got.bag, `fight ${i} bag`).toEqual(want.bag);
      for (const r of got.seen) {
        if (r.cause === 'auto-potion') seen.potion++;
        if (r.cause === 'auto-med') seen.med++;
        if (r.cause === 'auto-med' && r.item === 0x200f) seen.medRemedy++;
        if (r.cause === 'auto-phoenix') seen.phoenix++;
      }
      // stock paid and no event: a record lost to a death (a Phoenix Down refunded is covered by the "no-refund" mutant below)
      const spent = REACTION_ITEMS.reduce((n, item) => n + ((sit.bag[item] ?? 0) - (want.bag[item] ?? 0)), 0);
      if (spent > want.seen.length) seen.lost++;
      if (want.seen.length === 0) seen.empty++;
      else seen.drained++;
    });
    // the sample is wide enough to have exercised each branch
    expect(seen.potion).toBeGreaterThan(80);
    expect(seen.med).toBeGreaterThan(80);
    expect(seen.medRemedy).toBeGreaterThan(10);
    expect(seen.phoenix).toBeGreaterThan(30);
    expect(seen.lost).toBeGreaterThan(30);
    expect(seen.drained).toBeGreaterThan(200);
    expect(seen.empty).toBeGreaterThan(30);
  });

  // A wrong oracle must disagree with the engine: these show the comparison can fail.
  const mutants: Array<[NonNullable<OracleOptions['mutant']>, number]> = [
    ['strict-half', 20], // "strictly below half": Auto-Potion at exactly half
    ['present-not-new', 20], // Auto-Med answers any status that is present, not only a newly inflicted one
    ['no-class-limit', 20], // two Auto-Med / Auto-Potion records for one character
    ['no-cancel', 8], // a dying character keeps its queued records
    ['no-refund', 3], // an Auto-Phoenix whose rescuer cannot act keeps the Phoenix Down
    ['phoenix-descends', 8], // the rescuer is searched from the last slot
    ['mega-phoenix', 8], // Mega Phoenix instead of a Phoenix Down
    ['med-engine-order', 8], // the engine's old Eye Drops, Echo Screens, Antidote, Holy Water order
    ['no-death-cancel-after', 8], // a record queued for a dead character later in the action is not lost
  ];
  for (const [mutant, atLeast] of mutants) {
    it(`mutant "${mutant}" is caught`, () => {
      let differing = 0;
      for (const sit of situations) {
        const wrong = oracle(sit, { mutant });
        const got = runEngine(sit, makeRng(1), drive);
        if (JSON.stringify(wrong.seen) !== JSON.stringify(got.seen) || JSON.stringify(wrong.bag) !== JSON.stringify(got.bag)) differing++;
      }
      expect(differing).toBeGreaterThanOrEqual(atLeast);
    });
  }
});
