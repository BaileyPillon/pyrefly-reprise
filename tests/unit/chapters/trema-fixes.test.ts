/**
 * Chapter XIII — the engine and data corrections from the winnability method check
 * (`docs/plans/trema-winnability-method-check.md`, 2026-09-25), each run through the real
 * engine or resolver [hard rule 3]. **Game case: FFX-2 only** [AGENTS.md rule 14].
 *
 * - **E1**: an ailment row with no duration value lasts §2.8's default in a battle whose group
 *   sets `timedAilmentDefaults` (both Cloister links), and "until cured" everywhere else, so no
 *   other chapter moves.
 * - **E3**: normal Paragon's five physicals always land `[verified: 2 sources]`.
 * (E2, accessories through a spherechange, is in `tests/unit/ffx2-spherechange.test.ts`.)
 */

import { describe, expect, it } from 'vitest';
import type { StatusApplication } from '../../../src/battle/common/types.ts';
import { AILMENT_DEFAULT_DURATION, advanceStatuses, applyStatus, durationToTicks } from '../../../src/battle/ffx2/statuses.ts';
import { hitPercent } from '../../../src/battle/ffx2/index.ts';
import * as data from '../../../src/data/ffx2/index.ts';
import { CLOISTER_PARAGON, CLOISTER_TREMA } from '../../../src/data/ffx2/enemies/trema.ts';
import { CLOISTER_PARAGON_OVERSOUL, CLOISTER_TREMA_ARENA } from '../../../src/data/ffx2/enemies/trema-options.ts';
import { board } from '../helpers/tremaUnits.ts';
import { driveTremaFresh, LINES } from '../helpers/tremaDrive.ts';

const stop: StatusApplication = { status: 'stop', chance: 120, duration: 0 };

describe('E1: timed ailment defaults (§2.8), Chapter XIII only', () => {
  it('a Stop row with no duration lasts 100 units (53 s) when the battle opts in, and until cured when it does not', () => {
    const b = board('trema');
    const yuna = b.unit('yuna');
    const timed = applyStatus(yuna, stop, 'trema', 'trema-beguiling-mire', true);
    expect(timed?.ticksRemaining).toBe(durationToTicks(100));
    delete yuna.statuses.stop;
    const forever = applyStatus(yuna, stop, 'trema', 'trema-beguiling-mire');
    expect(forever?.ticksRemaining).toBeNull();
  });

  it('uses §2.8\'s published defaults and leaves every other status alone', () => {
    expect(AILMENT_DEFAULT_DURATION).toEqual({ sleep: 97, berserk: 133, confuse: 133, stop: 100, slow: 100 });
    const b = board('paragon');
    const paine = b.unit('paine');
    expect(applyStatus(paine, { status: 'confuse', chance: 120, duration: 0 }, 'paragon', undefined, true)?.ticksRemaining)
      .toBe(durationToTicks(133));
    // Poison is Infinite in §2.8; Protect is not an ailment: both unchanged by the flag.
    expect(applyStatus(paine, { status: 'poison', chance: 255, duration: 0 }, 'paragon', undefined, true)?.ticksRemaining).toBeNull();
    expect(applyStatus(paine, { status: 'protect', chance: 254, duration: 0 }, 'paine', undefined, true)?.ticksRemaining).toBeNull();
    // A row that carries its own duration keeps it.
    expect(applyStatus(paine, { status: 'slow', chance: 254, duration: 40 }, 'x', undefined, true)?.ticksRemaining)
      .toBe(durationToTicks(40));
  });

  it('only Chapter XIII opts in: its two Cloister links and its two OFF option formations; every shipped group is untouched', () => {
    const opted = Object.values(data.ENEMY_GROUPS_BY_ID).filter((g) => g.timedAilmentDefaults).map((g) => g.id).sort();
    expect(opted).toEqual([CLOISTER_PARAGON, CLOISTER_TREMA, CLOISTER_PARAGON_OVERSOUL, CLOISTER_TREMA_ARENA].sort());
    expect(board('trema').engine.state().flags['timedAilmentDefaults']).toBe(true);
  });

  it('through the engine, Beguiling Mire\'s Stop lands timed, and a timed Stop expires', () => {
    let seen = 0;
    for (let seed = 1; seed <= 60 && seen === 0; seed++) {
      const run = driveTremaFresh(LINES.noDrainNoShell, seed);
      for (const e of run.log) {
        if (e.type !== 'status-add' || e.status !== 'stop') continue;
        seen += 1;
        // The event carries the live instance, so read after the fight it has already ticked down.
        expect(e.instance.ticksRemaining).not.toBeNull();
        expect(e.instance.ticksRemaining).toBeLessThanOrEqual(durationToTicks(100)!);
      }
    }
    expect(seen).toBeGreaterThan(0);
    const yuna = board('trema').unit('yuna');
    applyStatus(yuna, stop, 'trema', 'trema-beguiling-mire', true);
    const events: Array<{ type: string; reason?: string }> = [];
    advanceStatuses(yuna, durationToTicks(100)!, (e) => { events.push(e as { type: string; reason?: string }); });
    expect(yuna.statuses.stop).toBeUndefined();
    expect(events.some((e) => e.type === 'status-remove' && e.reason === 'expired')).toBe(true);
  }, 120_000);
});

describe('E3: normal Paragon\'s physicals always land [verified: 2 sources]', () => {
  const physical = ['paragon-attack-poison', 'paragon-attack-itchy', 'paragon-attack-confuse', 'paragon-attack-pierce', 'paragon-attack-drain'];

  it('all five Normal Attacks are canMiss: false, and nothing else of Paragon\'s changed class', () => {
    for (const id of physical) {
      const row = data.ABILITIES[id];
      expect(row?.damageType).toBe('physical');
      expect(row?.canMiss).toBe(false);
    }
  });

  it('they hit a Rabite\'s Foot girl 100 % (the engine\'s enemy baseline gave 3 %)', () => {
    const b = board('paragon');
    const paragon = b.unit('paragon');
    for (const girl of ['yuna', 'rikku', 'paine']) {
      for (const id of physical) expect(hitPercent(paragon, b.unit(girl), data.ABILITIES[id]!)).toBe(100);
    }
    // The same row without the flag, for the record: what the estimate baseline gave.
    const rolled = { ...data.ABILITIES['paragon-attack-poison']!, canMiss: undefined };
    expect(hitPercent(paragon, b.unit('yuna'), rolled)).toBeLessThanOrEqual(5);
  });
});
