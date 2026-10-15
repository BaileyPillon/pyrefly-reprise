/**
 * **The bench of the hidden Last Summoning's chain** (FFX only): the whole chain played on the real engine, link by link, with the chapter's own line (the advisor's tactic, `intendedStrategy`) and with a naive
 * one, over several orders and many seeds. It measures; **nothing is tuned** (AGENTS.md: never tune boss numbers): every number in the fight is the game's or Chapter III's, and the figures below are what
 * the handoff quotes.
 *
 * What it reports (the table is printed, the invariants asserted):
 * - **the chain's length**: how many links were fought (nine is a full run: eight possessions and Yu Yevon), and how long each took (player turns and engine ticks);
 * - **how each link ends**: the share of links won, the party members down at the end, and how often one of the player's aeons stood on the field when the link ended (the intended line summons none in a link it
 *   wins by itself; the naive line summons nothing at all, so that column is the line's own measure and not a property of the fight);
 * - **where a chain that is lost is lost**: the first link that was not a victory.
 *
 * The chain cannot be lost by one blow (the fayth's permanent Auto-Life stands a fallen member up in every link), so a lost link means the whole party was petrified or knocked out between two revives.
 * `PYREFLY_BENCH_SEEDS=<n>` raises the seeds per order (the default keeps the suite short).
 */
import { describe, expect, it } from 'vitest';
import type { OfferingKey } from '../../../src/data/ffx/last-summoning-ids.ts';
import { ALL_KEYS, type ChainRun, type Line, playOrder } from '../helpers/lastSummoningDrive.ts';

const SEEDS = Number(process.env['PYREFLY_BENCH_SEEDS'] ?? 4);

/** Deterministic orders: the offering's own, its reverse, Yojimbo and the Sisters first, and a few shuffles. */
function shuffled(seed: number): OfferingKey[] {
  const keys = [...ALL_KEYS];
  let s = seed * 2654435761 + 12345;
  for (let i = keys.length - 1; i > 0; i--) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    const j = s % (i + 1);
    [keys[i], keys[j]] = [keys[j]!, keys[i]!];
  }
  return keys;
}

const ORDERS: ReadonlyArray<{ name: string; order: OfferingKey[] }> = [
  { name: 'offering order', order: [...ALL_KEYS] },
  { name: 'reversed', order: [...ALL_KEYS].reverse() },
  { name: 'yojimbo, sisters, anima first', order: ['yojimbo', 'sisters', 'anima', 'valefor', 'ifrit', 'ixion', 'shiva', 'bahamut'] },
  { name: 'shuffle 1', order: shuffled(1) },
  { name: 'shuffle 2', order: shuffled(2) },
];

interface Tally {
  chains: number;
  won: number;
  linksFought: number;
  /** [link position 1..9] -> fought, won, turns, ticks, down, aeonStanding */
  byPos: Array<{ fought: number; won: number; turns: number; ticks: number; down: number; aeon: number }>;
  firstLoss: Map<string, number>;
}

function tally(runs: readonly ChainRun[]): Tally {
  const t: Tally = { chains: runs.length, won: 0, linksFought: 0, byPos: Array.from({ length: 9 }, () => ({ fought: 0, won: 0, turns: 0, ticks: 0, down: 0, aeon: 0 })), firstLoss: new Map() };
  for (const r of runs) {
    if (r.outcome === 'victory') t.won += 1;
    t.linksFought += r.links.length;
    r.links.forEach((l, i) => {
      const p = t.byPos[i]!;
      p.fought += 1;
      if (l.outcome === 'victory') p.won += 1;
      p.turns += l.turns;
      p.ticks += l.ticks;
      p.down += l.partyDown;
      if (l.aeonStanding) p.aeon += 1;
    });
    const lost = r.links.find((l) => l.outcome !== 'victory');
    if (lost) t.firstLoss.set(lost.fought, (t.firstLoss.get(lost.fought) ?? 0) + 1);
  }
  return t;
}

const pct = (n: number, d: number): string => (d === 0 ? '-' : `${Math.round((100 * n) / d)}%`);
const avg = (n: number, d: number): string => (d === 0 ? '-' : (n / d).toFixed(1));

function report(title: string, t: Tally): string {
  const rows = t.byPos.map((p, i) => `| ${i + 1} | ${p.fought} | ${pct(p.won, p.fought)} | ${avg(p.turns, p.fought)} | ${avg(p.ticks, p.fought)} | ${avg(p.down, p.fought)} | ${pct(p.aeon, p.fought)} |`);
  const loss = [...t.firstLoss.entries()].map(([k, n]) => `${k} x${n}`).join(', ') || 'none';
  return [
    `### ${title}`,
    `chains ${t.chains}, won ${pct(t.won, t.chains)}, links fought ${avg(t.linksFought, t.chains)} of 9 on average; first loss at: ${loss}`,
    '| link | fought | won | turns | ticks | party down | aeon standing |',
    '|---:|---:|---:|---:|---:|---:|---:|',
    ...rows,
  ].join('\n');
}

async function bench(line: Line): Promise<{ all: ChainRun[]; per: Array<{ name: string; runs: ChainRun[] }> }> {
  const per: Array<{ name: string; runs: ChainRun[] }> = [];
  for (const { name, order } of ORDERS) {
    const runs: ChainRun[] = [];
    for (let seed = 1; seed <= SEEDS; seed++) runs.push(await playOrder(order, seed, { line, maxTurns: 6000 }));
    per.push({ name, runs });
  }
  return { all: per.flatMap((p) => p.runs), per };
}

describe('the chain, played whole', () => {
  it('the chapter’s own line: length, how each link ends, and where a lost chain is lost', async () => {
    const { all, per } = await bench('intended');
    const lines = [`Last Summoning bench, the chapter's own line, ${ORDERS.length} orders x ${SEEDS} seeds`, report('all orders', tally(all)), ...per.map((p) => report(p.name, tally(p.runs)))];
    console.log(lines.join('\n\n'));
    // Invariants (not balance claims): a chain is never longer than the roster, the Sisters are one link, no link stalls at the turn cap, and every fought link is one the order named.
    for (const r of all) {
      expect(r.links.length, `${r.order.join()} seed ${r.seed}`).toBeLessThanOrEqual(9);
      expect(r.outcome === 'cap', `${r.order.join()} seed ${r.seed} hit the turn cap`).toBe(false);
      r.links.forEach((l, i) => expect(l.fought, `${r.order.join()} seed ${r.seed} link ${i + 1}`).toBe(i < 8 ? r.order[i] : 'yu-yevon'));
    }
  }, 900_000);

  it('the naive line (a swing on the first target, nothing else): the same table, for comparison', async () => {
    const { all, per } = await bench('naive');
    console.log([`Last Summoning bench, the naive line, ${ORDERS.length} orders x ${SEEDS} seeds`, report('all orders', tally(all)), ...per.map((p) => report(p.name, tally(p.runs)))].join('\n\n'));
    for (const r of all) expect(r.links.length).toBeLessThanOrEqual(9);
  }, 900_000);
});
