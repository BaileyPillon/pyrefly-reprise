// @vitest-environment jsdom
/**
 * U3 (PR-0286, PR-0285; both games, shared message line): one multi-target cast is one line even when the
 * presenter plays its events 0.4 s apart, a newer different status event takes the screen within half a
 * second (no serial two-second backlog), and a line still waiting is dropped when a newer one arrives.
 */

import { describe, expect, it } from 'vitest';
import type { BattleEvent, BattleState } from '../../src/battle/common/types.ts';
import { MERGE_MS, MIN_SHOW_MS, StatusMessageLine } from '../../src/ui/common/statusMessageLine.ts';

const state = {
  combatants: {
    tidus: { name: 'Tidus', removed: false, flags: {} },
    yuna: { name: 'Yuna', removed: false, flags: {} },
    kimahri: { name: 'Kimahri', removed: false, flags: {} },
  },
} as unknown as BattleState;

let seq = 0;
const add = (targetId: string, status: string): BattleEvent => ({ type: 'status-add', seq: ++seq, targetId, status, instance: {} }) as unknown as BattleEvent;

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

  it('drops a line still waiting when a newer one arrives', () => {
    const line = new StatusMessageLine('ffx');
    line.onEvent(add('tidus', 'haste'), state);
    line.update(0.1);
    line.onEvent(add('yuna', 'zombie'), state);
    line.update(0.1);
    line.onEvent(add('kimahri', 'sleep'), state);
    line.update(MIN_SHOW_MS / 1000);
    line.update(0.02);
    expect(line.text).toBe('Kimahri fell asleep.'); // the Zombie line was stale
    line.update(2.5);
    expect(line.text).toBe('');
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
