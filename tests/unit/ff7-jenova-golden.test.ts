/**
 * **Golden: the FF7 engine's Jenova LIFE log, seeds 1 to 20** (hidden chapter 44; FF7 only).
 *
 * sha256 (first 16 hex) of the full event log for the Forgotten Capital preset (`src/data/ff7/builds/forgotten-capital.ts`)
 * against Jenova LIFE, driven headless (`runFf7Battle`, zero decision time, Recommended mode) by the three scripted
 * players of the bench (`src/battle/ff7/policies-jenova.ts`). Pinned in `tests/fixtures/ff7-jenova-golden.json` with each
 * run's outcome, turns and ticks, so a moved hash shows what moved. It is the chapter's own pin: the Guard Scorpion's is
 * `ff7-golden.test.ts`, which this chapter's engine work left byte-identical.
 *
 * Any change to the FF7 engine or the chapter's data that moves a hash must say why in its commit and re-pin deliberately:
 * `JL_GOLDEN_WRITE=1 npx vitest run tests/unit/ff7-jenova-golden.test.ts` rewrites the fixture.
 */

import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { distractedPolicy, jenovaSensiblePolicy, runFf7Battle, sensibleQuakePolicy, type Ff7Policy } from '../../src/battle/ff7/index.ts';
import { JL_REG, jlSetup } from './helpers/jenova.ts';

const FIXTURE = join(dirname(fileURLToPath(import.meta.url)), '..', 'fixtures', 'ff7-jenova-golden.json');

interface GoldenRow {
  seed: number;
  hash: string;
  outcome: string;
  turns: number;
  ticks: number;
  events: number;
}

const NAMES = ['sensible', 'quake', 'distracted'] as const;
type Golden = Record<(typeof NAMES)[number], GoldenRow[]>;

const POLICIES: Record<(typeof NAMES)[number], (seed: number) => Ff7Policy> = {
  sensible: () => jenovaSensiblePolicy,
  quake: () => sensibleQuakePolicy,
  distracted: (seed) => distractedPolicy(seed),
};

function compute(): Golden {
  const out: Golden = { sensible: [], quake: [], distracted: [] };
  for (const name of NAMES) {
    for (let seed = 1; seed <= 20; seed++) {
      const run = runFf7Battle({ setup: jlSetup(seed), registry: JL_REG, policy: POLICIES[name](seed) });
      const hash = createHash('sha256').update(JSON.stringify(run.log)).digest('hex').slice(0, 16);
      out[name].push({ seed, hash, outcome: run.result.outcome, turns: run.result.turns, ticks: run.result.elapsedTicks, events: run.log.length });
    }
  }
  return out;
}

describe('Jenova LIFE golden log, seeds 1 to 20', () => {
  const now = compute();
  if (process.env['JL_GOLDEN_WRITE'] === '1') writeFileSync(FIXTURE, `${JSON.stringify(now, null, 2)}\n`);
  const pinned = JSON.parse(readFileSync(FIXTURE, 'utf8')) as Golden;

  for (const name of NAMES) {
    it(`${name}: every seed's log is byte-identical to the pinned one`, () => {
      expect(now[name]).toEqual(pinned[name]);
    });
  }

  it('the sensible player wins every pinned seed, and a replay of one seed is the same run (the dice are seeded)', () => {
    expect(pinned.sensible.every((r) => r.outcome === 'victory')).toBe(true);
    expect(pinned.quake.every((r) => r.outcome === 'victory')).toBe(true);
    const again = runFf7Battle({ setup: jlSetup(7), registry: JL_REG, policy: distractedPolicy(7) });
    expect(createHash('sha256').update(JSON.stringify(again.log)).digest('hex').slice(0, 16)).toBe(pinned.distracted[6]?.hash);
  });
});
