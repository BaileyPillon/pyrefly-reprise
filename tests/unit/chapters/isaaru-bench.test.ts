/**
 * **Chapter XIV — the seeded bench.** Win rates across 200 seeds, per link and
 * for the whole three-link chain, for the sourced lines and a credibly wrong
 * one, on the real engine, the real data and the shipped Via Purifico build.
 *
 * **Measure, never tune** (`docs/plans/chapter-isaaru-review.md` §9 and the
 * `boss-side-fix-needs-measured-options` rule): this file prints the numbers
 * and pins only that every battle ends in a victory or a defeat (never a
 * stalemate escape, review E11). It pins no target rate.
 *
 * What every number rests on, said out loud:
 * - **The build is `[estimate]`** by construction (B2 to B5, B7 as Bailey took
 *   them): Chapter X's Yuna and aeons, Bahamut at 50, Yuna's Grand Summon full.
 * - **The AI's unsourced pieces are our estimate** (B9): even move splits,
 *   Pterya from 0, the count from 5.
 * - **Per-link rows start from the shipped build** (every aeon at full HP, the
 *   build's gauges, Grand Summon full): they measure each fight alone. The
 *   **chain** rows carry HP, MP, gauges and KOs link to link, as the game does.
 * - The aeons' own rows (no NulBlaze, no Blizzara) are Chapter X's: **the
 *   wiki's "NulBlaze on Shiva" is not open to this build**, so the sourced
 *   answer to Hellfire here is **Shield** (GameFAQs: "just Shield if Hellfire
 *   is coming next").
 *
 * The lines (research §6.3):
 * - **intended** — wiki + GameFAQs [verified: 2 sources]: against Grothia,
 *   Shiva first (Grand-Summoned: Yuna arrives full, B5), then Valefor, Ixion,
 *   Bahamut last; Shield whenever Hellfire is next. Against Pterya, Bahamut
 *   first to tank her and fill his gauge. Against Spathi, Ixion, Ifrit, then
 *   Shiva ("any aeon but Valefor"), **Shield when the count reads 1**. Every
 *   aeon fires its Overdrive when full and otherwise attacks.
 * - **gs-bahamut** — Jegged [single source]: Grand Summon Bahamut against
 *   Grothia, Mega Flare at once, then as intended.
 * - **wrong** (credibly wrong, plan §9): the roster order (Valefor first), never
 *   Shield; Overdrives when full, Grand Summon on the first summon, otherwise
 *   attack.
 *
 * **Game case: FFX only** [AGENTS.md rule 14].
 */

import { describe, expect, it } from 'vitest';
import type { AvailableCommand, BattleEngine, Command, FFXCombatant } from '../../../src/battle/common/types.ts';
import { SPATHI_COUNT_FLAG } from '../../../src/battle/ffx/ai/isaaru-rules.ts';
import {
  FOE, LINKS, type Input, type LinkId, actor, defend, drive, enabledRow, grandSummon, newEngine, runChain, summon,
} from '../helpers/isaaruUnits.ts';

const SEEDS = 200;
type Line = 'intended' | 'gs-bahamut' | 'wrong';
const LINES: readonly Line[] = ['intended', 'gs-bahamut', 'wrong'];

const INTENDED_ORDER: Record<LinkId, readonly string[]> = {
  'isaaru-grothia': ['shiva', 'valefor', 'ixion', 'bahamut'],
  'isaaru-pterya': ['bahamut', 'ixion', 'shiva', 'ifrit'],
  'isaaru-spathi': ['ixion', 'ifrit', 'shiva', 'valefor'],
};
/** The credibly wrong order: the roster as the menu lists it, Valefor first. */
const ROSTER: readonly string[] = ['valefor', 'ifrit', 'ixion', 'shiva', 'bahamut'];
const ORDER: Record<Line, Record<LinkId, readonly string[]>> = {
  intended: INTENDED_ORDER,
  'gs-bahamut': { ...INTENDED_ORDER, 'isaaru-grothia': ['bahamut', 'shiva', 'valefor', 'ixion'] },
  wrong: { 'isaaru-grothia': ROSTER, 'isaaru-pterya': ROSTER, 'isaaru-spathi': ROSTER },
};

/** True when the enemy aeon's next turn is its big one, so a Shield is due now. */
function threatNext(link: LinkId, engine: BattleEngine): boolean {
  if (link === 'isaaru-spathi') return engine.state().flags[SPATHI_COUNT_FLAG] === 0;
  if (link === 'isaaru-grothia') return (actor(engine, FOE[link]).overdrive?.gauge ?? 0) + 3 >= 100;
  return false; // Pterya: Bahamut tanks her, and a Shield would zero his gain
}

function yunaTurn(line: Line, link: LinkId, commands: readonly AvailableCommand[]): Command {
  for (const id of ORDER[line][link]) {
    if (!enabledRow(commands, 'summon', id)) continue;
    return enabledRow(commands, 'overdrive', 'grand-summon') ? grandSummon(id) : summon(id);
  }
  return defend(); // nothing left: the duel is already lost
}

function aeonTurn(line: Line, link: LinkId, engine: BattleEngine, d: Input): Command {
  const foe = FOE[link];
  if (line !== 'wrong' && threatNext(link, engine) && enabledRow(d.commands, 'ability', 'shield')) {
    return { kind: 'ability', id: 'shield', targets: [d.actorId] };
  }
  const od = d.commands.find((c) => c.enabled && c.command.kind === 'overdrive');
  if (od) return { ...od.command, targets: od.validTargets.includes(foe) ? [foe] : [] } as Command;
  return { kind: 'attack', targets: [foe] };
}

function choose(line: Line, link: LinkId, engine: BattleEngine, d: Input): Command {
  return engine.state().aeonId === d.actorId ? aeonTurn(line, link, engine, d) : yunaTurn(line, link, d.commands);
}

interface Tally { wins: number; outcomes: Record<string, number>; turns: number; lost: number }
const empty = (): Tally => ({ wins: 0, outcomes: {}, turns: 0, lost: 0 });
function add(t: Tally, outcome: string, turns: number, lost: number): void {
  t.outcomes[outcome] = (t.outcomes[outcome] ?? 0) + 1;
  if (outcome === 'victory') t.wins++;
  t.turns += turns;
  t.lost += lost;
}
const koCount = (engine: BattleEngine) => engine.state().log.filter((e) => e.type === 'dismiss' && e.reason === 'ko').length;

function benchLink(line: Line, link: LinkId): Tally {
  const t = empty();
  for (let seed = 1; seed <= SEEDS; seed++) {
    const engine = newEngine(link, seed);
    drive(engine, (d) => choose(line, link, engine, d));
    add(t, engine.state().result?.outcome ?? 'unfinished', engine.state().turn, koCount(engine));
  }
  return t;
}

interface ChainTally { wins: number; reached: number[]; outcomes: Record<string, number>; bahamutFull: number; bahamutFilledByPterya: number }
function benchChain(line: Line): ChainTally {
  const t: ChainTally = { wins: 0, reached: [0, 0, 0], outcomes: {}, bahamutFull: 0, bahamutFilledByPterya: 0 };
  for (let seed = 1; seed <= SEEDS; seed++) {
    const runs = runChain(seed, (link, engine, d) => choose(line, link, engine, d));
    t.reached[runs.length - 1]!++;
    for (const r of runs) t.outcomes[r.outcome] = (t.outcomes[r.outcome] ?? 0) + 1;
    const last = runs.at(-1)!;
    if (runs.length === 3 && last.outcome === 'victory') t.wins++;
    const gauge = (s: typeof last.state) => (s.combatants['bahamut'] as FFXCombatant | undefined)?.overdrive?.gauge ?? 0;
    if (gauge(last.state) >= 100) t.bahamutFull++;
    // "Bahamut gets to full Overdrive just by eating Pterya's attacks" (GameFAQs, research §5.2): did he, in link 2?
    if (runs[1]?.state.log.some((e) => e.type === 'overdrive-gauge' && e.who === 'bahamut' && e.to >= 100 && e.cause === 'aeon-damage')) t.bahamutFilledByPterya++;
  }
  return t;
}

const pct = (n: number) => `${n}/${SEEDS} (${Math.round((n * 100) / SEEDS)} %)`;

describe(`Chapter XIV bench (${SEEDS} seeds; measured, not tuned)`, () => {
  const table: string[] = ['| Fight | Line | Wins | Outcomes | Mean turns | Aeons lost (mean) |', '|---|---|---:|---|---:|---:|'];
  const perLink: Record<string, Tally> = {};

  it.each(LINKS)('%s, each line from the shipped build', (link) => {
    for (const line of LINES) {
      const t = benchLink(line, link);
      perLink[`${link}/${line}`] = t;
      table.push(`| ${link} | ${line} | ${pct(t.wins)} | ${JSON.stringify(t.outcomes)} | ${(t.turns / SEEDS).toFixed(1)} | ${(t.lost / SEEDS).toFixed(2)} |`);
      expect(Object.keys(t.outcomes).every((o) => o === 'victory' || o === 'defeat'), `${link}/${line} ${JSON.stringify(t.outcomes)}`).toBe(true);
    }
  }, 300_000);

  it('the whole chain, carried link to link', () => {
    const rows: string[] = ['| Chain | Line | Wins (all three) | Ended in link 1 / 2 / 3 | Bahamut filled by Pterya (link 2) | Bahamut full at the end (Chapter X ships 100) |', '|---|---|---:|---|---:|---:|'];
    const res: Record<Line, ChainTally> = {} as Record<Line, ChainTally>;
    for (const line of LINES) {
      const t = benchChain(line);
      res[line] = t;
      rows.push(`| chain | ${line} | ${pct(t.wins)} | ${t.reached.join(' / ')} | ${pct(t.bahamutFilledByPterya)} | ${pct(t.bahamutFull)} |`);
      expect(Object.keys(t.outcomes).every((o) => o === 'victory' || o === 'defeat'), `${line} ${JSON.stringify(t.outcomes)}`).toBe(true);
    }
    console.log(`\n${[...table, '', ...rows].join('\n')}\n`);
    // The one comparison §9 asks for: the sourced line beats the wrong one on the chain.
    expect(res.intended.wins).toBeGreaterThanOrEqual(res.wrong.wins);
  }, 600_000);
});
