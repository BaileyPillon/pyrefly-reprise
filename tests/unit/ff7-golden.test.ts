/**
 * **Golden: the FF7 engine's Guard Scorpion log, seeds 1 to 20.** FF7 only.
 *
 * sha256 (first 16 hex) of the full event log for the canon party
 * (`src/data/ff7/builds/sector1-reactor.ts`) against Guard Scorpion, driven
 * headless (`runFf7Battle`, zero decision time, Recommended mode) by the two
 * bench policies, `sensible` and `naive` (`src/battle/ff7/simulate.ts`). Pinned in
 * `tests/fixtures/ff7-golden.json` with each run's outcome, turns and ticks, so a
 * moved hash shows what moved.
 *
 * Any change to the FF7 engine or data that moves a hash must say why in its
 * commit and re-pin deliberately: `FF7_GOLDEN_WRITE=1 npx vitest run
 * tests/unit/ff7-golden.test.ts` rewrites the fixture. The FFX and FFX-2 goldens
 * are separate files and never move for FF7 work (AGENTS.md rule 14).
 */

import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { FF7_POLICIES, runFf7Battle } from '../../src/battle/ff7/index.ts';
import { gsSetup, REG } from './helpers/ff7.ts';

const FIXTURE = join(dirname(fileURLToPath(import.meta.url)), '..', 'fixtures', 'ff7-golden.json');

interface GoldenRow {
  seed: number;
  hash: string;
  outcome: string;
  turns: number;
  ticks: number;
  events: number;
}

type Golden = Record<'sensible' | 'naive', GoldenRow[]>;

function compute(): Golden {
  const out: Golden = { sensible: [], naive: [] };
  for (const name of ['sensible', 'naive'] as const) {
    for (let seed = 1; seed <= 20; seed++) {
      const run = runFf7Battle({ setup: gsSetup(seed), registry: REG, policy: FF7_POLICIES[name] });
      const hash = createHash('sha256').update(JSON.stringify(run.log)).digest('hex').slice(0, 16);
      out[name].push({ seed, hash, outcome: run.result.outcome, turns: run.result.turns, ticks: run.result.elapsedTicks, events: run.log.length });
    }
  }
  return out;
}

describe('FF7 golden log, seeds 1 to 20', () => {
  const now = compute();
  if (process.env['FF7_GOLDEN_WRITE'] === '1') writeFileSync(FIXTURE, `${JSON.stringify(now, null, 2)}\n`);
  const pinned = JSON.parse(readFileSync(FIXTURE, 'utf8')) as Golden;

  for (const name of ['sensible', 'naive'] as const) {
    it(`${name}: every seed's log is byte-identical to the pinned one`, () => {
      expect(now[name]).toEqual(pinned[name]);
    });
  }

  it('the sensible player wins every pinned seed (the canon fight is easy, gs §9)', () => {
    expect(pinned.sensible.every((r) => r.outcome === 'victory')).toBe(true);
  });
});
