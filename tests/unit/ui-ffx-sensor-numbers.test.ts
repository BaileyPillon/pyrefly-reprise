// @vitest-environment jsdom
/**
 * FOC54-005 (release 55; FFX only): Yu Yevon's Sensor plate read `99999 / 99999`, five digits with no separator that ran past the 100 px plate, and it drew no MP at
 * all. Every number on the plate now prints in the house style (thousands separators, `resultsMath.formatNumber`'s rule), a read-out too long for the plate is
 * set a size smaller, and a scanned enemy shows its MP beside its HP: Yu Yevon's record gives HP 99,999 and MP 1 (`docs/handoff/re-parity-rc10-ffx-boss-data.md`
 * section 5.7). Engine numbers are untouched; this is the plate's drawing only.
 */

import { describe, expect, it } from 'vitest';
import type { FFXCombatant } from '../../src/battle/common/types.ts';
import { SensorPanel } from '../../src/ui/ffx/SensorPanel.ts';
import { longClass, plateNumber } from '../../src/ui/ffx/sensorNumbers.ts';
import { formatNumber } from '../../src/ui/common/resultsMath.ts';
import { makeFakeCombatants } from '../../src/ui/ffx/testFixtures.ts';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/** The fixture's Mortiorchis stood in for Yu Yevon: HP and MP set to the record's 99,999 and 1. */
function yuYevon(): FFXCombatant {
  const base = makeFakeCombatants()['mortiorchis'] as FFXCombatant;
  return { ...base, id: 'yu-yevon', name: 'Yu Yevon', hp: 99999, mp: 1, stats: { ...base.stats, maxHp: 99999, maxMp: 1 } } as FFXCombatant;
}

const lines = (panel: SensorPanel): string[] =>
  [...panel.el.querySelectorAll('.ffx-sensor__hp, .ffx-sensor__mp')].map((e) => (e.textContent ?? '').replace(/\s+/g, ' ').trim());

describe('the Sensor plate prints its numbers in the house style', () => {
  it('plateNumber is the results screen\'s rule: whole numbers with thousands separators, never below 0', () => {
    expect(plateNumber(99999)).toBe('99,999');
    expect(plateNumber(1)).toBe('1');
    expect(plateNumber(0)).toBe('0');
    expect(plateNumber(2_000_000)).toBe('2,000,000');
    expect(plateNumber(-5)).toBe('0');
    for (const n of [0, 7, 999, 1000, 48000, 99999, 123456]) expect(plateNumber(n)).toBe(formatNumber(n));
  });

  it('Yu Yevon after a Sensor: HP 99,999 / 99,999 and MP 1 / 1, both as one number each', () => {
    const panel = new SensorPanel();
    panel.show(yuYevon());
    expect(lines(panel)).toEqual(['HP 99,999 / 99,999', 'MP 1 / 1']);
    expect(panel.el.textContent).not.toContain('99999');
  });

  it('a long read-out is set a size smaller (more than 13 characters) on both lines, a short one is not', () => {
    const panel = new SensorPanel();
    panel.show(yuYevon());
    expect(panel.el.querySelector('.ffx-sensor__hp')?.classList.contains('ffx-sensor__num--long')).toBe(true);
    expect(panel.el.querySelector('.ffx-sensor__mp')?.classList.contains('ffx-sensor__num--long')).toBe(true); // one size on both lines
    const small = { ...(makeFakeCombatants()['mortiorchis'] as FFXCombatant), id: 'small', hp: 4000, mp: 10, stats: { ...(makeFakeCombatants()['mortiorchis'] as FFXCombatant).stats, maxHp: 4000, maxMp: 10 } } as FFXCombatant;
    const panel2 = new SensorPanel();
    panel2.show(small);
    expect(panel2.el.querySelector('.ffx-sensor__hp')?.classList.contains('ffx-sensor__num--long')).toBe(false);
    expect(panel2.el.querySelector('.ffx-sensor__mp')?.classList.contains('ffx-sensor__num--long')).toBe(false);
    expect(longClass('99,999 / 99,999')).toBe(' ffx-sensor__num--long');
    expect(longClass('4,000 / 4,000')).toBe('');
  });

  it('an unscanned enemy still shows "? ? ?" and no MP (Sensor is what unlocks the numbers)', () => {
    const panel = new SensorPanel();
    panel.focus(yuYevon());
    const text = panel.el.textContent ?? '';
    expect(text).toContain('? ? ?');
    expect(panel.el.querySelector('.ffx-sensor__mp')).toBeNull();
  });

  it('the stylesheet sets the MP line like the HP line, keeps both on one line, and shrinks the long class', () => {
    const css = readFileSync(resolve(__dirname, '../../src/ui/ffx/ffx-hud.css'), 'utf8').replace(/\r\n/g, '\n');
    expect(css).toMatch(/\.ffx-sensor__hp, \.ffx-sensor__mp \{[^}]*white-space: nowrap/);
    expect(css).toMatch(/\.ffx-sensor \.ffx-sensor__num--long \{ font-size: 8px; \}/);
  });
});
