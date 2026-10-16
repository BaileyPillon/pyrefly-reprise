/**
 * **Kill-reward measurement, FFX** (re-parity RC9, lane FFX-M; `docs/handoff/re-parity-rc9-ffx-rewards.md`).
 *
 * For every FFX chapter (the eleven listed ones and the two hidden ones, Sinspawn Gui and Biran and Yenke) the SHIPPED `intendedStrategy` plays the whole chain through the
 * app's own path (the same wiring `ffx-parity-measure.test.ts` uses) on the seeds named, and the BATTLE RESULTS of every link are summed per run: gil, AP, every item that
 * dropped, the overkills, the kills that paid. The file reads nothing but the public `BattleResult` and the event log, so the SAME file runs on the engine before the lane and
 * on the engine after it: that is how the before and after table of item totals was made.
 *
 * Runs only with `PYREFLY_MEASURE=1`; `PYREFLY_MEASURE_OUT=<file>` writes the JSON; `PYREFLY_MEASURE_SEEDS` is a range `1-500` or a list; `PYREFLY_MEASURE_CHAPTERS` a comma list of chapter
 * ids. **Measure, never tune**: nothing here changes a boss or a party number.
 *
 * Game case: **FFX only**.
 */

import { writeFileSync } from 'node:fs';
import { describe, it } from 'vitest';
import type { BattleResult, BattleSetup, BattleState, Command, Decision, EnemyGroupDef } from '../../src/battle/common/types.ts';
import { FFXEngine } from '../../src/battle/ffx/index.ts';
import { registerBattleContent } from '../../src/app/screens/BattleScreenContent.ts';
import { findEnemyGroup, setupForChapter, setupForNextLink } from '../../src/app/screens/BattleScreenSetup.ts';
import { CHAPTERS, getChapter, type Chapter } from '../../src/data/encounters.ts';
import { intendedStrategy } from '../../src/engine/BattlePresenterStrategies.ts';

const MEASURE = process.env['PYREFLY_MEASURE'] === '1';
const OUT = process.env['PYREFLY_MEASURE_OUT'];
const MAX_STEPS = 200_000;
const MAX_LINKS = 12;

function parseSeeds(spec: string | undefined): number[] {
  if (!spec) return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  const range = /^(\d+)-(\d+)$/.exec(spec);
  if (range) {
    const [from, to] = [Number(range[1]), Number(range[2])];
    return Array.from({ length: to - from + 1 }, (_, i) => from + i);
  }
  return spec.split(',').map((s) => Number(s.trim())).filter((n) => Number.isFinite(n));
}
const SEEDS = parseSeeds(process.env['PYREFLY_MEASURE_SEEDS']);
const ONLY = (process.env['PYREFLY_MEASURE_CHAPTERS'] ?? '').split(',').map((s) => s.trim()).filter((s) => s !== '');
/** The hidden FFX chapters measured beside the eleven listed ones. */
const HIDDEN = ['sinspawn-gui', 'biran-yenke'];

type Input = Extract<Decision, { kind: 'player-input' }>;

interface Run {
  outcome: string;
  links: number;
  partyTurns: number;
  gil: number;
  ap: number;
  /** Item id to the count that dropped over the whole chain. */
  items: Record<string, number>;
  /** Enemies marked overkilled, summed over the links. */
  overkills: number;
  /** Enemy deaths in the event log (a `ko` of an enemy, or an enemy ejected): the kills that pay, a part that grows back counted each time it falls. */
  kills: number;
  /** Sphere Levels gained summed over members and links. */
  levels: number;
  /** A digest of every link's whole event log with the result's `drops` taken out: two engines that play a chain alike and differ only in what it pays have the same one. */
  digest: string;
  /** Gear pieces the game's roll would have dropped (the lane counts a hit and makes no piece; absent on an engine before the lane, so 0). */
  gearDrops: number;
}

function fnv(s: string): string {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619) >>> 0;
  return h.toString(16);
}

function fallback(d: Input): Command {
  const row = d.commands.find((c) => c.enabled && c.command.kind === 'attack') ?? d.commands.find((c) => c.enabled);
  if (!row) return { kind: 'defend', targets: [] } as Command;
  const t = row.validTargets[0];
  return { ...row.command, targets: t ? [t] : [] } as Command;
}

/** Enemy deaths of one link, from the log. */
function killsOf(state: Readonly<BattleState>): number {
  let n = 0;
  for (const e of state.log) {
    if (e.type === 'ko' && state.combatants[e.targetId]?.side === 'enemy') n += 1;
    else if (e.type === 'status-add' && e.status === 'eject' && state.combatants[e.targetId]?.side === 'enemy') n += 1;
  }
  return n;
}

function take(run: Run, result: BattleResult, state: Readonly<BattleState>, engine: FFXEngine): void {
  run.digest = fnv(run.digest + fnv(JSON.stringify(state.log, (key, value) => (key === 'drops' ? undefined : value))));
  run.gearDrops += (engine.transferable().rt as unknown as { rewards?: { gearDrops?: number } }).rewards?.gearDrops ?? 0;
  run.gil += result.gil;
  run.ap += result.ap;
  for (const d of result.drops) run.items[d.itemId] = (run.items[d.itemId] ?? 0) + d.count;
  run.overkills += result.overkilled.length;
  run.kills += killsOf(state);
  run.levels += Object.values(result.sphereLevelsGained).reduce((a, b) => a + b, 0);
}

async function playChain(chapter: Chapter, seed: number): Promise<Run> {
  let setup: BattleSetup = setupForChapter(chapter, seed);
  let group: EnemyGroupDef = chapter.enemyGroupRef;
  const engine = new FFXEngine({ autoResolveMinigames: true });
  engine.setSeed(setup.seed);
  engine.init(setup);
  const run: Run = { outcome: 'unresolved', links: 0, partyTurns: 0, gil: 0, ap: 0, items: {}, overkills: 0, kills: 0, levels: 0, digest: '', gearDrops: 0 };
  let link = 1;
  for (let step = 0; step < MAX_STEPS; step += 1) {
    const d = engine.nextDecision();
    if (d.kind === 'resolved' || d.kind === 'waiting') continue;
    if (d.kind === 'battle-over') {
      run.links += 1;
      run.outcome = String(d.result.outcome);
      take(run, d.result, engine.state() as Readonly<BattleState>, engine);
      if (run.outcome !== 'victory' || !group.nextGroupId || link >= MAX_LINKS) break;
      const next = await findEnemyGroup(group.nextGroupId);
      if (!next) break;
      setup = setupForNextLink(setup, next, engine.state() as BattleState, seed + link);
      group = next;
      link += 1;
      engine.setSeed(setup.seed);
      engine.init(setup);
      continue;
    }
    run.partyTurns += 1;
    engine.submit(intendedStrategy(d.actorId, d.commands, engine as never) ?? fallback(d));
  }
  return run;
}

const mean = (xs: readonly number[]): number => (xs.length === 0 ? 0 : xs.reduce((a, b) => a + b, 0) / xs.length);
const r2 = (x: number): number => Math.round(x * 100) / 100;

describe.skipIf(!MEASURE)('RE parity RC9, FFX: kill rewards over every chapter (PYREFLY_MEASURE=1)', () => {
  it('sums gil, AP, every dropped item, the overkills and the paying kills over each chapter\'s whole chain', async () => {
    await registerBattleContent();
    const chapters: Chapter[] = [
      ...CHAPTERS.filter((c) => c.game === 'ffx'),
      ...HIDDEN.map((id) => getChapter(id)).filter((c): c is Chapter => c !== undefined && c.game === 'ffx'),
    ].filter((c) => ONLY.length === 0 || ONLY.includes(c.id));
    const rows: Array<Record<string, unknown>> = [];
    for (const chapter of chapters) {
      const runs: Run[] = [];
      for (const seed of SEEDS) runs.push(await playChain(chapter, seed));
      const won = runs.filter((r) => r.outcome === 'victory');
      const ids = [...new Set(runs.flatMap((r) => Object.keys(r.items)))].sort();
      const row = {
        chapter: chapter.id,
        seeds: runs.length,
        wins: won.length,
        perSeed: runs.map((r) => (r.outcome === 'victory' ? 'W' : r.outcome === 'defeat' ? 'L' : 'U')).join(''),
        meanPartyTurns: r2(mean(runs.map((r) => r.partyTurns))),
        // Over the WON runs only: a lost run pays nothing (`results.ts`), and a mean over all runs would mix two things.
        meanGil: r2(mean(won.map((r) => r.gil))),
        meanAp: r2(mean(won.map((r) => r.ap))),
        meanLevels: r2(mean(won.map((r) => r.levels))),
        meanGearDrops: r2(mean(won.map((r) => r.gearDrops))),
        // One digest for the whole chapter: the digests of its seeds in order (compare two engines' files for equality; a differing seed is in `detail`).
        playDigest: fnv(runs.map((r) => r.digest).join(',')),
        meanKills: r2(mean(won.map((r) => r.kills))),
        meanOverkills: r2(mean(won.map((r) => r.overkills))),
        overkillShare: r2(won.reduce((a, r) => a + r.overkills, 0) / Math.max(1, won.reduce((a, r) => a + r.kills, 0))),
        meanItems: Object.fromEntries(ids.map((id) => [id, r2(mean(won.map((r) => r.items[id] ?? 0)))])),
        totalItems: Object.fromEntries(ids.map((id) => [id, won.reduce((a, r) => a + (r.items[id] ?? 0), 0)])),
        winsWithItem: Object.fromEntries(ids.map((id) => [id, won.filter((r) => (r.items[id] ?? 0) > 0).length])),
        seedList: SEEDS.length > 24 ? `${SEEDS[0]}-${SEEDS[SEEDS.length - 1]}` : SEEDS.join(','),
        detail: runs.map((r, i) => ({ seed: SEEDS[i] as number, ...r })),
      };
      rows.push(row);
      console.log(JSON.stringify({ ...row, detail: undefined, perSeed: SEEDS.length > 60 ? `(${row.perSeed.length} seeds)` : row.perSeed }));
    }
    if (OUT) writeFileSync(OUT, JSON.stringify(rows, null, 2));
  }, 14_400_000);
});
