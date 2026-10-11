/**
 * Chapter XIII — the engine and data corrections from the winnability method check
 * (`docs/plans/trema-winnability-method-check.md`, 2026-09-25), each run through the real
 * engine or resolver [hard rule 3]. **Game case: FFX-2 only** [AGENTS.md rule 14].
 *
 * - **E1**: an ailment row with no duration value used to last §2.8's default in a battle whose group set `timedAilmentDefaults`
 *   (both Cloister links), and "until cured" everywhere else. **Re-parity W4 (2026-10-10; reason "game-code parity"):** the engine
 *   no longer reads the flag. Every timed status is timed by the game's own clock: Sleep, Confusion and Berserk by their timers
 *   (150,000 / 200,000 / 200,000 units), Stop and Slow and the rest by the COUNTER of the command row (1 to 125 counts of 1,500
 *   units), and a derived row (an ability with no game row) with no amount gets the byte's maximum, 125 (66 s at Normal), where it used to be unlimited. Beguiling Mire has the game's own row: its Stop is 100 counts, the figure the old default estimated.
 *   The tests below now pin that, and that Beguiling Mire's Stop is timed through the real engine.
 * - **E3**: normal Paragon's five physicals always land `[verified: 2 sources]`.
 * (E2, accessories through a spherechange, is in `tests/unit/ffx2-spherechange.test.ts`.)
 */

import { describe, expect, it } from 'vitest';
import type { StatusApplication } from '../../../src/battle/common/types.ts';
import { applyStatus } from '../../../src/battle/ffx2/statuses.ts';
import { resolveAbility } from '../../../src/battle/ffx2/resolve.ts';
import { hitPercent } from '../../../src/battle/ffx2/index.ts';
import * as data from '../../../src/data/ffx2/index.ts';
import { CLOISTER_PARAGON, CLOISTER_TREMA } from '../../../src/data/ffx2/enemies/trema.ts';
import { CLOISTER_PARAGON_OVERSOUL, CLOISTER_TREMA_ARENA } from '../../../src/data/ffx2/enemies/trema-options.ts';
import { board } from '../helpers/tremaUnits.ts';
import { driveTremaFresh, LINES } from '../helpers/tremaDrive.ts';
import { runStatusClocks } from '../helpers/fallenAeonsUnits.ts';

const stop: StatusApplication = { status: 'stop', chance: 120, duration: 0 };

describe('E1 (re-parity W4): every ailment is timed by the game\'s clock, with or without the group\'s old flag', () => {
  it('Beguiling Mire Stop (no authored duration) lands with the counter of the game row, 100 (150,000 units, 52.7 s at Normal): the same 100 the old default estimated', () => {
    const b = board('trema');
    const trema = b.unit('trema');
    const yuna = b.unit('yuna');
    let landed = false;
    for (let seed = 1; seed <= 40 && !landed; seed++) {
      delete yuna.statuses.stop;
      resolveAbility(b.resolveCtx(seed), trema, data.ABILITIES['trema-beguiling-mire']!, ['yuna']);
      landed = yuna.statuses.stop !== undefined;
    }
    expect(landed, 'Beguiling Mire never landed its Stop in 40 seeds').toBe(true);
    expect(yuna.statuses.stop?.counter).toBe(100);
    expect(yuna.statuses.stop?.ticksRemaining).toBe(100 * 1500);
  });

  it('the game\'s timers and counters, as applyStatus loads them: Confusion 200,000 units whatever the row said, Slow with 40 counts is 60,000, Poison and Up stages are infinite', () => {
    const b = board('paragon');
    const paine = b.unit('paine');
    expect(applyStatus(paine, { status: 'confuse', chance: 120, duration: 0 }, 'paragon')?.ticksRemaining).toBe(200_000);
    expect(applyStatus(paine, { status: 'poison', chance: 255, duration: 0 }, 'paragon')?.ticksRemaining).toBeNull();
    expect(applyStatus(paine, { status: 'slow', chance: 254, duration: 40 }, 'x')?.ticksRemaining).toBe(40 * 1500);
    // A group 2 status applied directly with no amount has no clock; through a command row it always has one (the test above).
    expect(applyStatus(paine, { status: 'protect', chance: 254, duration: 0 }, 'paine')?.ticksRemaining).toBeNull();
  });

  it('the group flag is dead data now: the four formations still carry it, the engine publishes and reads nothing', () => {
    const opted = Object.values(data.ENEMY_GROUPS_BY_ID).filter((g) => g.timedAilmentDefaults).map((g) => g.id).sort();
    expect(opted).toEqual([CLOISTER_PARAGON, CLOISTER_TREMA, CLOISTER_PARAGON_OVERSOUL, CLOISTER_TREMA_ARENA].sort());
    expect(board('trema').engine.state().flags['timedAilmentDefaults']).toBeUndefined();
  });

  it('through the engine, Beguiling Mire\'s Stop lands timed, and a timed Stop expires on the game\'s clock', () => {
    let seen = 0;
    for (let seed = 1; seed <= 60 && seen === 0; seed++) {
      const run = driveTremaFresh(LINES.noDrainNoShell, seed);
      for (const e of run.log) {
        if (e.type !== 'status-add' || e.status !== 'stop') continue;
        seen += 1;
        // The event carries the live instance, so read after the fight it has already ticked down.
        expect(e.instance.ticksRemaining).not.toBeNull();
        expect(e.instance.ticksRemaining).toBeLessThanOrEqual(100 * 1500);
      }
    }
    expect(seen).toBeGreaterThan(0);
    const b = board('trema');
    const yuna = b.unit('yuna');
    applyStatus(yuna, stop, 'trema', 'trema-beguiling-mire');
    yuna.statuses.stop = { ...yuna.statuses.stop!, counter: 100, accumulator: 0, ticksRemaining: 100 * 1500 };
    const events: Array<{ type: string; reason?: string }> = [];
    runStatusClocks([yuna], Math.ceil((100 * 1500) / 95) + 1, b.resolveCtx(), { emit: (e) => { events.push(e as { type: string; reason?: string }); } });
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
