// @vitest-environment jsdom
/**
 * U3 (PR-0286, PR-0285; both games, shared message line): one multi-target cast is one line even when the
 * presenter plays its events 0.4 s apart, a newer different status event takes the screen within half a
 * second (no serial two-second backlog), and distinct lines waiting behind it all show, in order (U3 repair:
 * the one replaceable slot dropped a line; fed the presenter's own spacing, 88 ms per status-remove and 220 ms
 * per status-add, Esuna on Poison + Silence + Darkness never showed the Silence line).
 */

import { describe, expect, it } from 'vitest';
import type { BattleEvent, BattleState } from '../../src/battle/common/types.ts';
import { MAX_WAITING, MERGE_MS, MIN_SHOW_MS, StatusMessageLine } from '../../src/ui/common/statusMessageLine.ts';

const state = {
  combatants: {
    tidus: { name: 'Tidus', removed: false, flags: {} },
    yuna: { name: 'Yuna', removed: false, flags: {} },
    kimahri: { name: 'Kimahri', removed: false, flags: {} },
  },
} as unknown as BattleState;

let seq = 0;
const add = (targetId: string, status: string): BattleEvent => ({ type: 'status-add', seq: ++seq, targetId, status, instance: {} }) as unknown as BattleEvent;
const remove = (targetId: string, status: string): BattleEvent => ({ type: 'status-remove', seq: ++seq, targetId, status, reason: 'cured' }) as unknown as BattleEvent;

/** Feed events `gapMs` apart (the presenter's sleep after each), then run 6 s in 20 ms frames; every distinct line seen, in order. */
function shown(events: BattleEvent[], gapMs: number): string[] {
  const line = new StatusMessageLine('ffx');
  const seen: string[] = [];
  const look = (): void => {
    if (line.text && seen[seen.length - 1] !== line.text) seen.push(line.text);
  };
  for (const ev of events) {
    line.onEvent(ev, state);
    look();
    for (let t = 0; t < gapMs; t += 20) {
      line.update(Math.min(20, gapMs - t) / 1000);
      look();
    }
  }
  for (let t = 0; t < 6000; t += 20) {
    line.update(0.02);
    look();
  }
  return seen;
}

describe('status message line timing (U3)', () => {
  it('folds a cast whose events are 0.4 s apart into one line', () => {
    const line = new StatusMessageLine('ffx');
    line.onEvent(add('tidus', 'haste'), state);
    line.update(0.4);
    line.onEvent(add('yuna', 'haste'), state);
    line.update(0.4);
    line.onEvent(add('kimahri', 'haste'), state);
    expect(line.text).toBe('Tidus, Yuna and Kimahri were hasted.');
    expect(MERGE_MS).toBeGreaterThan(400);
  });

  it('shows a newer different status within half a second of its event', () => {
    const line = new StatusMessageLine('ffx');
    line.onEvent(add('tidus', 'haste'), state);
    line.update(0.1);
    line.onEvent(add('yuna', 'zombie'), state);
    expect(line.text).toBe('Tidus was hasted.'); // readable first
    line.update(MIN_SHOW_MS / 1000);
    line.update(0.02);
    expect(line.text).toBe('Yuna became a Zombie.');
  });

  it('shows every distinct waiting line in order, each for at least MIN_SHOW_MS', () => {
    const line = new StatusMessageLine('ffx');
    line.onEvent(add('tidus', 'haste'), state);
    line.update(0.1);
    line.onEvent(add('yuna', 'zombie'), state);
    line.update(0.1);
    line.onEvent(add('kimahri', 'sleep'), state);
    line.update(MIN_SHOW_MS / 1000);
    line.update(0.02);
    expect(line.text).toBe('Yuna became a Zombie.'); // no longer dropped
    line.update((MIN_SHOW_MS - 40) / 1000);
    expect(line.text).toBe('Yuna became a Zombie.'); // readable for MIN_SHOW_MS
    line.update(0.06);
    expect(line.text).toBe('Kimahri fell asleep.');
    line.update(2.5);
    expect(line.text).toBe('');
  });

  it('Esuna on Poison + Silence + Darkness (status-remove, 88 ms apart) shows all three lines', () => {
    expect(shown([remove('yuna', 'poison'), remove('yuna', 'silence'), remove('yuna', 'darkness')], 88)).toEqual([
      'Yuna is no longer poisoned.',
      'Yuna can speak again.',
      'Yuna can see again.',
    ]);
  });

  it('three status-adds 220 ms apart show all three lines', () => {
    expect(shown([add('tidus', 'poison'), add('tidus', 'silence'), add('tidus', 'darkness')], 220)).toEqual([
      'Tidus was poisoned.',
      'Tidus was silenced.',
      'Tidus was blinded by Darkness.',
    ]);
  });

  it("Braska's Final Aeon's Curse (five statuses on one member) shows all five", () => {
    const five = ['curse', 'poison', 'sleep', 'silence', 'darkness'].map((s) => add('kimahri', s));
    expect(MAX_WAITING).toBeGreaterThanOrEqual(4);
    expect(shown(five, 220)).toEqual([
      'Kimahri was cursed.',
      'Kimahri was poisoned.',
      'Kimahri fell asleep.',
      'Kimahri was silenced.',
      'Kimahri was blinded by Darkness.',
    ]);
  });

  it('a waiting line still folds a later target of the same cast into it', () => {
    expect(shown([add('tidus', 'zombie'), add('tidus', 'haste'), add('yuna', 'haste')], 220)).toEqual([
      'Tidus became a Zombie.',
      'Tidus and Yuna were hasted.',
    ]);
  });

  it('a line with nothing behind it keeps its full two seconds', () => {
    const line = new StatusMessageLine('ffx2');
    line.onEvent(add('tidus', 'haste'), state);
    line.update(1.5);
    expect(line.text).toBe('Tidus was hasted.');
    line.update(0.6);
    expect(line.text).toBe('');
  });
});

describe('the line keeps off the dialogue banner plate (U3, PR-0286)', () => {
  const plate = { left: 26, top: 98, right: 586, bottom: 216 };
  it('moves above the plate when it would touch it, and stays put when it misses', async () => {
    const { clearOfBanner } = await import('../../src/ui/common/statusLineBanner.ts');
    expect(clearOfBanner(179, 533, 214, 28, plate, 0)).toBe(98 - 28 - 6); // 64: above
    expect(clearOfBanner(179, 700, 214, 28, plate, 0)).toBe(179); // clear to the right
    expect(clearOfBanner(179, 533, 214, 28, null, 0)).toBe(179); // no banner
  });
  it('goes below the plate when there is no room above', async () => {
    const { clearOfBanner } = await import('../../src/ui/common/statusLineBanner.ts');
    expect(clearOfBanner(120, 100, 200, 28, plate, 90)).toBe(216 + 6);
  });
});
