/**
 * **Chapter XIV — the ship bench.** The shipped tactic (`src/engine/tactics/ffx-isaaru.ts`) driving
 * the whole three-link chain on the real engine, the real data and the shipped Via Purifico build,
 * across 200 seeds, beside the variants it was chosen over and the sourced player-side options.
 *
 * **Measure, never tune** (`docs/plans/isaaru-bench.md`, the `boss-side-fix-needs-measured-options`
 * rule): nothing on his side is touched. The rows print; the pins are only that every battle ends in
 * a victory or a defeat, that the shipped line beats the bench's sourced baseline order, and that no
 * option row loses to the shipped build (an option only adds rows).
 *
 * The chain carries HP, MP, gauges and KOs link to link (`runChain`, the screen's own carry).
 *
 * **Game case: FFX only** [AGENTS.md rule 14].
 */

import { describe, expect, it } from 'vitest';
import type { BattleEngine, Command, FFXPartyBuild } from '../../../src/battle/common/types.ts';
import { viaPurificoBuild } from '../../../src/data/ffx/builds/via-purifico.ts';
import { ISAARU_INTENDED_LINE, type IsaaruLine, isaaruTactic } from '../../../src/engine/tactics/ffx-isaaru.ts';
import { defend, runChain } from '../helpers/isaaruUnits.ts';

const SEEDS = 200;

function chainWins(line: IsaaruLine, party: FFXPartyBuild = viaPurificoBuild): { wins: number; endedIn: number[] } {
  const tactic = isaaruTactic(line);
  let wins = 0;
  const endedIn = [0, 0, 0];
  for (let seed = 1; seed <= SEEDS; seed++) {
    const runs = runChain(seed, (_link, engine: BattleEngine, d): Command => tactic(d.actorId, [...d.commands], engine) ?? defend(), party);
    const last = runs.at(-1)!;
    if (runs.length === 3 && last.outcome === 'victory') wins++;
    else endedIn[runs.length - 1]!++;
    expect(['victory', 'defeat']).toContain(last.outcome);
  }
  return { wins, endedIn };
}

/** A copy of the shipped build with extra rows on some aeons (a player-side option, never his side). */
function withRows(rows: Readonly<Record<string, readonly string[]>>): FFXPartyBuild {
  const b = structuredClone(viaPurificoBuild);
  for (const a of b.aeons) for (const id of rows[a.id] ?? []) if (!a.abilityIds.includes(id)) a.abilityIds.push(id);
  return b;
}

const pct = (n: number) => `${n}/${SEEDS} (${Math.round((n * 100) / SEEDS)} %)`;

describe(`Chapter XIV ship bench (${SEEDS} seeds, the shipped tactic; measured, not tuned)`, () => {
  it('the shipped line against the variants it was chosen over, and the sourced options', () => {
    const lines: Array<[string, IsaaruLine, FFXPartyBuild?]> = [
      ['shipped (intended): CTB-read Shield, fuller of Ifrit/Ixion first on Spathi', ISAARU_INTENDED_LINE],
      ['sourced order as written (Ixion first on Spathi), CTB-read Shield', { ...ISAARU_INTENDED_LINE, spathiFullerFirst: false }],
      ['Shield only at count 0 / full gauge (the first bench)', { ...ISAARU_INTENDED_LINE, forecastShield: false, spathiFullerFirst: false }],
      ['Jegged: Grand Summon Bahamut on Grothia', { ...ISAARU_INTENDED_LINE, order: { ...ISAARU_INTENDED_LINE.order, grothia: ['bahamut', 'shiva', 'valefor', 'ixion'] } }],
      ['option: Shiva knows Blizzara + NulBlaze (wiki, GameFAQs, Jegged)', ISAARU_INTENDED_LINE, withRows({ shiva: ['blizzara', 'nulblaze'] })],
      ['option: Ixion knows Thundara (Jegged)', ISAARU_INTENDED_LINE, withRows({ ixion: ['thundara'] })],
      ['option: both', ISAARU_INTENDED_LINE, withRows({ shiva: ['blizzara', 'nulblaze'], ixion: ['thundara'] })],
    ];
    const out: string[] = ['| Line | Chain wins | Lost in link 1 / 2 / 3 |', '|---|---:|---|'];
    const wins: number[] = [];
    for (const [name, line, party] of lines) {
      const r = chainWins(line, party);
      wins.push(r.wins);
      out.push(`| ${name} | ${pct(r.wins)} | ${r.endedIn.join(' / ')} |`);
    }
    console.log(`\n${out.join('\n')}\n`);
    expect(wins[0]!).toBeGreaterThanOrEqual(wins[1]!);
    expect(wins[0]!).toBeGreaterThanOrEqual(wins[2]!);
  }, 900_000);
});
