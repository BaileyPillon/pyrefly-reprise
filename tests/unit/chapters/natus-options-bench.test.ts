/**
 * Chapter X option bench: the shipped line and each candidate line (`NATUS_LINES`, `src/data/guides/natus-line.ts`) on the seeds of
 * `PYREFLY_CHX_SEEDS` (default 1 to 12; `1-500` for the handoff's tables) through the RE-parity harness's own path, plus any dial
 * the game does not offer (`PYREFLY_CHX_KNOBS`, a JSON object, or an array of objects, of `NatusLine` overrides on the shipped line, for
 * example `[{"healUnder":0.6},{"shellBeforeHeal":true}]`; `PYREFLY_CHX_LINES=none` skips the named lines). **Game case: FFX only** [AGENTS.md rule 14]. **Measure, never tune**: it prints and writes the numbers
 * (`PYREFLY_CHX_OUT=<file>` for JSON) and pins nothing about a win rate; `docs/handoff/re-parity-chx-options.md` holds the tables.
 *
 * Runs only with `PYREFLY_CHX_BENCH=1`. The one thing it always asserts is that the `shipped` line and the game's own path
 * (`intendedStrategy`, which finds the registered tactic) win the same seeds, so a table row for `shipped` is the live line.
 */

import { writeFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { NATUS_LINE, NATUS_LINE_IDS } from '../../../src/data/guides/natus-line.ts';
import { lineById, measure, seedsFromEnv, shippedLine, type Line } from './natus-options-lib.ts';
import type { NatusLine } from '../../../src/engine/tactics/seymour-natus-lines.ts';

const ON = process.env['PYREFLY_CHX_BENCH'] === '1';
const OUT = process.env['PYREFLY_CHX_OUT'];
const KNOBS = process.env['PYREFLY_CHX_KNOBS'];
const ONLY = (process.env['PYREFLY_CHX_LINES'] ?? '').split(',').map((s) => s.trim()).filter((s) => s !== '');

describe.skipIf(!ON)('Chapter X option lines (PYREFLY_CHX_BENCH=1)', () => {
  it('measures the shipped line and every candidate on the same seeds', async () => {
    const seeds = seedsFromEnv();
    const rows: Array<{ line: string } & Awaited<ReturnType<typeof measure>>> = [];
    const lines: Array<[string, Line]> = NATUS_LINE_IDS.filter((id) => ONLY.length === 0 || ONLY.includes(id)).map((id) => [id, lineById(id)]);
    if (KNOBS) {
      const parsed = JSON.parse(KNOBS) as Partial<NatusLine> | Array<Partial<NatusLine>>;
      for (const k of Array.isArray(parsed) ? parsed : [parsed]) lines.push([`shipped+${JSON.stringify(k)}`, lineById('shipped', k)]);
    }
    for (const [name, line] of lines) rows.push({ line: name, ...(await measure(line, seeds)) });
    const lead = `| Line (seeds ${seeds[0]}-${seeds[seeds.length - 1]}) | Wins | Party turns | Party KOs |\n|---|---:|---:|---:|`;
    console.log(['', lead, ...rows.map((r) => `| ${r.line} | ${r.wins}/${seeds.length} | ${r.meanPartyTurns} | ${r.meanPartyKos} |`)].join('\n'));
    if (OUT) writeFileSync(OUT, JSON.stringify({ seeds: seeds.length, live: NATUS_LINE, rows }, null, 2));
    for (const r of rows) expect(r.unresolved).toBe(0);
  }, 7_200_000);

  it('the shipped line wins the same seeds through the game\'s own path (intendedStrategy)', async () => {
    const seeds = seedsFromEnv().slice(0, 40);
    const viaGame = await measure(shippedLine, seeds);
    const viaLine = await measure(lineById(NATUS_LINE), seeds);
    expect(viaLine.perSeed).toBe(viaGame.perSeed);
  }, 3_600_000);
});
