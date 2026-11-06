import { describe, it } from 'vitest';
import { play } from '../helpers/spherimorphBot.ts';

describe('probe', () => {
  it('bot speed and outcome', () => {
    const t0 = Date.now();
    for (const line of ['advisor', 'blind', 'careless']) {
      const outs: string[] = [];
      for (let seed = 1; seed <= 6; seed++) {
        const r = play(seed, line);
        outs.push(`${r.outcome[0]}${r.decisions}/${r.hp}/lo${r.lowestHp}/sh${r.shifts}/ko${r.koCount}/ab${r.absorbed}`);
      }
      console.log(line, outs.join(' '), `${Date.now() - t0}ms`);
    }
  }, 600_000);
});
