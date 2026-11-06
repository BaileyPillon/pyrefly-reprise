/**
 * The death blow's order of events on the real engine (FFX only; the hidden Flooded Ways chapter): a kill with somebody inside is 9,999 to each member of the front line, the held one included, BEFORE the monster's
 * own KO, and then the battle ends as a defeat. (The file keeps the name of the probe that found the order; `flooded-ways-engine.test.ts` has the rule.)
 */

import { describe, expect, it } from 'vitest';
import { actor, defend, flags, invincible, log, newEngine, nextInput, nextInputOf, row } from '../helpers/floodedDrive.ts';

describe('the death blow, in order', () => {
  it('9,999 to Tidus, Wakka and Rikku, then Geosgaeno\'s own KO, then the defeat', () => {
    const e = newEngine(7, 'geosgaeno');
    let held = '';
    for (let i = 0; i < 200 && held === ''; i++) {
      invincible(e);
      nextInput(e);
      held = String(flags(e)['fw.hold'] ?? '');
      if (held === '') e.submit(defend());
    }
    expect(held).not.toBe('');
    for (const id of ['tidus', 'wakka', 'rikku']) {
      actor(e, id).stats.maxHp = 9_000;
      actor(e, id).hp = 6_000;
    }
    actor(e, 'geosgaeno').hp = 1;
    const striker = ['tidus', 'wakka', 'rikku'].find((x) => x !== held)!;
    e.submit(row(nextInputOf(e, striker), 'attack', undefined, 'geosgaeno')!);
    const types = log(e).slice(-16);
    const blows = types.filter((x) => x.type === 'damage' && x.sourceId === 'geosgaeno' && x.amount === 9_999);
    expect(blows.map((x) => (x.type === 'damage' ? x.targetId : '')).sort()).toEqual(['rikku', 'tidus', 'wakka']);
    const firstBlow = types.findIndex((x) => x.type === 'damage' && x.amount === 9_999);
    const koOfMonster = types.findIndex((x) => x.type === 'ko' && x.targetId === 'geosgaeno');
    expect(firstBlow).toBeGreaterThanOrEqual(0);
    expect(koOfMonster).toBeGreaterThan(firstBlow);
    expect(types[types.length - 1]!.type).toBe('defeat');
  });
});
