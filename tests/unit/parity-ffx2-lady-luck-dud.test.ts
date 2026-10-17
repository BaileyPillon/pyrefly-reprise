/**
 * **RE parity RC10, FFX-2 only: Lady Luck's Dud has no element** (lane `re-parity-rc10-x2-minigames`; row E8 of the gap scan of 2026-10-17; source FFX2-H04, a private working note: the Dud row 0x31E5 carries no element byte).
 *
 * Game case: FFX-2 only (Trigger Happy and Lady Luck are FFX-2 content; nothing here is read from FFX.exe).
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { aiUnit } from '../../src/battle/ffx2/fixtures.ts';
import { resolveAbility } from '../../src/battle/ffx2/resolve.ts';
import { SeededRng } from '../../src/battle/common/rng.ts';
import type { BattleEvent } from '../../src/battle/common/types.ts';
import * as data from '../../src/data/ffx2/index.ts';

interface FixtureRow { element: number; formula: number; power: number; flagsDamage: number }
const ROWS = JSON.parse(readFileSync(fileURLToPath(new URL('../fixtures/parity/ffx2/lady_luck_rows.json', import.meta.url)), 'utf8')) as Record<string, FixtureRow>;

describe('the Dud has no element (FFX2-H04 7 row E8, 8 row W4)', () => {
  it('the game\'s row 0x31E5 is special damage, % of current HP, power 12, and carries no element byte', () => {
    const row = ROWS['0x31e5']!;
    expect({ element: row.element, formula: row.formula, power: row.power, flagsDamage: row.flagsDamage }).toEqual({ element: 0, formula: 4, power: 12, flagsDamage: 0 });
  });

  it('the engine\'s Dud runs no element ladder: its derived row and its ability carry none', () => {
    const dud = data.ABILITIES['x2-lady-luck-dud']!;
    expect(dud.element).toEqual(['none']);
    expect(dud.power).toBe(12);
    expect(dud.formula).toBe('percent-current');
  });

  // The behaviour that matters: a girl with a gravity affinity is not touched differently by the Dud. Before this, the Dud ran the gravity ladder, so a girl who
  // is immune to gravity took nothing, one who absorbs it was healed, one who resists it took half.
  it.each([
    ['normal', {}],
    ['immune to gravity', { gravity: 'immune' }],
    ['resistant to gravity', { gravity: 'resist' }],
    ['weak to gravity', { gravity: 'weak' }],
    ['absorbing gravity', { gravity: 'absorb' }],
  ] as const)('a girl who is %s takes the same 75 percent of her current HP', (_label, affinities) => {
    const dud = data.ABILITIES['x2-lady-luck-dud']!;
    const yuna = aiUnit('yuna', 'party', 1000);
    const rikku = aiUnit('rikku', 'party', 1000, 1);
    yuna.affinities = { ...affinities };
    const events: BattleEvent[] = [];
    resolveAbility(
      {
        units: [yuna, rikku],
        abilities: { get: (id) => data.ABILITIES[id] },
        rng: new SeededRng(7),
        emit: (e) => events.push({ ...e, seq: events.length } as BattleEvent),
        breaksDamageLimit: () => false,
      },
      yuna,
      dud,
      ['yuna', 'rikku'],
    );
    expect(yuna.hp).toBe(250);
    expect(rikku.hp).toBe(250);
    expect(events.filter((e) => e.type === 'damage' && e.element !== 'none')).toEqual([]);
  });
});

