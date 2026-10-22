// @vitest-environment jsdom
/**
 * Release 61, the conference demo (decision 169); both games, pause CONTROLS tab.
 *
 * The CONTROLS tab lists each action's keys beside its pad button, named for the pad in the player's hands (A / B / LB on an Xbox pad, the cross / circle / L1 on a PlayStation
 * one), and, for FFX and FFX-2, the fight's own keys (the strategy guide, the best-move card, the enemy-move slab, Defend). The enemy-move slab's pad button is the one
 * place the two games differ: FFX has it on R3 (Y is Defend there, Back is the booth's reset), FFX-2 on Y.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { noteInputDevice, resetInputDeviceForTests } from '../../src/app/inputDevice.ts';
import { controlsColumns } from '../../src/app/screens/pause/panels.ts';

const DUALSENSE = 'DualSense Wireless Controller (STANDARD GAMEPAD Vendor: 054c Product: 0ce6)';

beforeEach(() => resetInputDeviceForTests());

function values(game?: 'ffx' | 'ffx2' | 'ff7'): Record<string, string> {
  const out: Record<string, string> = {};
  for (const col of controlsColumns(game)) for (const row of col.rows) out[row.id] = String(row.value);
  return out;
}

describe('the CONTROLS tab names the pad in hand', () => {
  it('an Xbox pad reads A, B, LB, RB (and keeps the keys beside them)', () => {
    const v = values('ffx');
    expect(v['confirm']).toBe('Enter  /  Z  /  A');
    expect(v['back']).toBe('Esc  /  X  /  B');
    expect(v['tab-prev']).toBe('Q  /  LB  /  ←');
    expect(v['tab-next']).toBe('E  /  RB  /  →');
    expect(v['hide']).toBe('H  /  Y');
  });

  it('a PlayStation pad reads its own symbols and L1 / R1', () => {
    noteInputDevice('gamepad', DUALSENSE);
    const v = values('ffx');
    expect(v['confirm']).toBe('Enter  /  Z  /  ✕');
    expect(v['back']).toBe('Esc  /  X  /  ○');
    expect(v['tab-prev']).toBe('Q  /  L1  /  ←');
  });

  it('never prints the old PlayStation words as the only name', () => {
    for (const game of ['ffx', 'ffx2'] as const) {
      const all = Object.values(values(game)).join(' | ');
      expect(all).not.toMatch(/Cross|Circle|Triangle|\bL1\b|\bR1\b/);
    }
  });
});

describe('the fight column', () => {
  it('lists the guide, the best-move card, the enemy-move slab and its hold for more', () => {
    const v = values('ffx');
    expect(v['guide']).toBe('G  /  X');
    expect(v['best']).toBe('N  /  RT');
    expect(v['more']).toBe('J  /  LT');
  });

  it('FFX: the slab is on R3 (Y is Defend), and Defend and the party swap are listed', () => {
    const v = values('ffx');
    expect(v['enemy']).toBe('E  /  RS');
    expect(v['defend']).toBe('Q  /  Y');
    expect(v['swap']).toBe('F  /  LB');
  });

  it('FFX-2: the slab keeps Y, and there is no Defend key (Defend is a row there)', () => {
    const v = values('ffx2');
    expect(v['enemy']).toBe('E  /  Y');
    expect(v['defend']).toBeUndefined();
    expect(v['swap']).toBeUndefined();
  });

  it('FF7 and the unnamed call keep the two original columns', () => {
    expect(controlsColumns('ff7').map((c) => c.id)).toEqual(['move', 'screen']);
    expect(controlsColumns().map((c) => c.id)).toEqual(['move', 'screen']);
  });
});
