/**
 * **Doublecast: where each payment sits, and the picker agrees with the engine** (re-parity RC10 lane FFX-N, rows N2 and N3; **FFX only**).
 *
 * Companion to `parity-ffx-doublecast.test.ts` (same oracle, `helpers/ffxCommandRig.ts`, which restates the MP rule in its own terms and imports nothing from the kernels).
 * The measured fact (`live/2026-10-17-live-session-4.md`, case 1): with Half MP, Fire then Firaga, the MP went 452 -> 450 -> 442, each cast paid at its own cost check.
 *
 * 1. The whole timeline of one turn as one sequence: payment, that cast's hits, the next payment, the next cast's hits. With two different elements the hits say which
 *    cast they belong to, so a payment taken early, late, or for the wrong spell cannot hide.
 * 2. The picker (`doublecastPicks`) and the engine, side by side over 400 generated scenes: whenever the first pick is legal, the picker offers the second spell exactly when the
 *    engine then starts it, and `mpAfter` is the MP the engine really leaves. Two separately written rules (a sum for the picker; a running balance for the engine) that must agree.
 */

import { describe, expect, it } from 'vitest';
import type { AutoAbilityId, Command } from '../../src/battle/common/types.ts';
import { ABILITIES } from '../../src/data/ffx/index.ts';
import { executeCommand } from '../../src/battle/ffx/execute.ts';
import { doublecastPicks } from '../../src/battle/ffx/doublecast.ts';
import { type Who, lcg, oracleCategory, oracleMpCost, rigOf } from './helpers/ffxCommandRig.ts';

type Ev = Record<string, unknown>;
const POOL = ['fire', 'blizzard', 'thunder', 'water', 'fira', 'blizzara', 'thundara', 'watera', 'firaga', 'blizzaga', 'thundaga', 'waterga'] as const;
const LEARNED = ['doublecast', ...POOL];

const lulu = (mp: number, half = false, one = false, booster = false): Who => {
  const autos: AutoAbilityId[] = [];
  if (half) autos.push('half-mp-cost');
  if (one) autos.push('one-mp-cost');
  if (booster) autos.push('magic-booster');
  return { id: 'lulu', side: 'party', mp, autos, learned: LEARNED };
};
const foe: Who = { id: 'boss', side: 'enemy', hp: 9999 };
const two = (a: string, b: string): Command => ({ kind: 'ability', id: 'doublecast', targets: [], casts: [{ id: a, targets: ['boss'] }, { id: b, targets: ['boss'] }] });

function play(who: Who[], command: Command, seed = 7) {
  const rig = rigOf(who, seed);
  const user = rig.byId.get('lulu')!;
  rig.ctx.rt.currentActorId = 'lulu';
  executeCommand(rig.ctx, user, command, true);
  return { rig, user, events: rig.events as Ev[] };
}

/** One turn as a sequence of words: `pay N` for Lulu's MP payment and the element of each of her hits, with a run of the same element shown once. */
function timeline(events: readonly Ev[]): string[] {
  const out: string[] = [];
  for (const e of events) {
    let word: string | undefined;
    if (e['type'] === 'mp-damage' && e['targetId'] === 'lulu') word = `pay ${String(e['amount'])}`;
    else if (e['type'] === 'damage' && e['sourceId'] === 'lulu') word = String(e['element']);
    if (word !== undefined && out[out.length - 1] !== word) out.push(word);
  }
  return out;
}
const element = (id: string): string => ABILITIES[id]!.element[0] as string;

describe('the turn as one sequence: each payment, then that cast\'s hits, then the next payment, then the next cast\'s hits', () => {
  it('Blizzard then Thundaga: pay 4, ice, pay 16, lightning (and the other order: pay 16, lightning, pay 4, ice)', () => {
    expect(timeline(play([lulu(452), foe], two('blizzard', 'thundaga')).events)).toEqual(['pay 4', element('blizzard'), 'pay 16', element('thundaga')]);
    expect(timeline(play([lulu(452), foe], two('thundaga', 'blizzard')).events)).toEqual(['pay 16', element('thundaga'), 'pay 4', element('blizzard')]);
  });

  it('with Half MP the same pair is pay 2, ice, pay 8, lightning (452 -> 450 -> 442 is the measured trail of Fire then Firaga)', () => {
    const { user, events } = play([lulu(452, true), foe], two('blizzard', 'thundaga'));
    expect(timeline(events)).toEqual(['pay 2', element('blizzard'), 'pay 8', element('thundaga')]);
    expect(user.mp).toBe(442);
    const live = play([lulu(452, true), foe], two('fire', 'firaga'));
    expect(timeline(live.events)).toEqual(['pay 2', element('fire'), 'pay 8', element('firaga')]);
    expect(live.user.mp).toBe(442);
  });

  it('a second spell the leftover MP cannot pay: the timeline stops after the first cast', () => {
    expect(timeline(play([lulu(19), foe], two('blizzard', 'thundaga')).events)).toEqual(['pay 4', element('blizzard')]);
    expect(timeline(play([lulu(19), foe], two('thundaga', 'blizzard')).events)).toEqual(['pay 16', element('thundaga')]);
  });
});

describe('the picker and the engine agree (400 generated scenes)', () => {
  it('whenever the first pick is legal: the second spell is offered exactly when the engine starts it, and mpAfter is the MP the engine leaves', () => {
    const r = lcg(20261018);
    const seen = { offered: 0, refused: 0 };
    for (let i = 0; i < 400; i++) {
      const a = r.pick(POOL);
      const b = r.pick(POOL);
      const half = r.chance(0.4);
      const one = r.chance(0.15);
      const booster = r.chance(0.3);
      const cost = (id: string): number => oracleMpCost(ABILITIES[id]!.mpCost, oracleCategory(ABILITIES[id]!), { half, one, booster, free: false });
      const mp = r.pick([cost(a), cost(a) + cost(b) - 1, cost(a) + cost(b), cost(a) + cost(b) + 1, cost(a) + cost(b) + 40, 452]);
      const label = JSON.stringify({ a, b, half, one, booster, mp });
      const picker = rigOf([lulu(mp, half, one, booster), foe]);
      const row = doublecastPicks(picker.ctx, picker.byId.get('lulu')!, a).find((x) => x.id === b)!;
      const { user, events } = play([lulu(mp, half, one, booster), foe], two(a, b), 300 + i);
      const paid = events.filter((e) => e['type'] === 'mp-damage' && e['targetId'] === 'lulu').map((e) => e['amount']);
      if (row.second!.enabled) {
        seen.offered += 1;
        expect(paid, `both paid ${label}`).toEqual([cost(a), cost(b)]);
        expect(user.mp, `MP left ${label}`).toBe(row.second!.mpAfter);
      } else {
        seen.refused += 1;
        expect(paid, `only the first paid ${label}`).toEqual([cost(a)]);
        expect(user.mp, `MP after the first only ${label}`).toBe(mp - cost(a));
        expect(row.second!.mpAfter, `the picker's mpAfter would be negative ${label}`).toBeLessThan(0);
      }
    }
    expect(seen.offered).toBeGreaterThan(100);
    expect(seen.refused).toBeGreaterThan(100);
  });
});
