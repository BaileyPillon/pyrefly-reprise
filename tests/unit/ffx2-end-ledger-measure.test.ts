/**
 * **RE-parity RC8 measurement, FFX-2 only** (lane `re-parity-rc8-x2-end-ledger`: XK-petrify, XF1 the item ledger, XK2 the battle-end commit window).
 *
 * The same method as `ffx2-parity-measure.test.ts` (the shipped `intendedStrategy` plays each chapter's whole chain through the app's own path, minigames
 * auto-resolved), with three additions the lane needs:
 *
 * - **a digest of every link's full event log per seed**, so the seeds a change moved are known exactly (the outcome measures cannot see a log that moved
 *   while the fight went the same way);
 * - **item use per fight**: how many item commands the party started, by item id, and the stock left at the end of the chain;
 * - **the end window** (`FFX2Engine#endWindowStats`, absent on a build without the window, then zeros): how many ends were evaluated, how many lapsed
 *   (a revive or Auto-Life before the commit), how many logic steps the commit waited, and what was in flight when it did.
 *
 * Runs only with `PYREFLY_X2L_MEASURE=1`. `PYREFLY_X2L_SEEDS=<n>` plays seeds 1 to n (default 12) and `<a>-<b>` plays a to b; `PYREFLY_X2L_CHAPTERS=<id,id>`
 * names the chapters (default: the eight listed or hidden chapters of the plan); `PYREFLY_X2L_OUT=<file>` writes one JSON object (rows plus per-seed records).
 * **Measure, never tune.** Skipped by default, so the full suite pays nothing.
 */

import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { describe, it } from 'vitest';
import type { BattleEvent, BattleSetup, BattleState, Command, Decision, EnemyGroupDef } from '../../src/battle/common/types.ts';
import { FFX2Engine, STEPS_PER_SECOND } from '../../src/battle/ffx2/index.ts';
import { ffx2EngineOptions, registerBattleContent } from '../../src/app/screens/BattleScreenContent.ts';
import { findEnemyGroup, setupForChapter, setupForNextLink } from '../../src/app/screens/BattleScreenSetup.ts';
import { getChapter, type Chapter } from '../../src/data/encounters.ts';
import { intendedStrategy } from '../../src/engine/BattlePresenterStrategies.ts';

const MEASURE = process.env['PYREFLY_X2L_MEASURE'] === '1';
const OUT = process.env['PYREFLY_X2L_OUT'];
const SEED_SPEC = process.env['PYREFLY_X2L_SEEDS'] ?? '12';
const SEED_RANGE = /^(\d+)-(\d+)$/.exec(SEED_SPEC);
const FIRST_SEED = SEED_RANGE ? Number(SEED_RANGE[1]) : 1;
const LAST_SEED = SEED_RANGE ? Number(SEED_RANGE[2]) : Number(SEED_SPEC);
const DEFAULT_CHAPTERS = [
  'ffx2-bahamut', 'ffx2-vegnagun-shuyin', 'ffx2-leblanc', 'ffx2-fallen-aeons', 'ffx2-trema', 'ffx2-den-of-woe', 'ffx2-ixion-djose',
  'ffx2-masterpiece-theatre', 'ffx2-tourist-trap', 'ffx2-valefor-besaid',
];
const CHAPTER_IDS = process.env['PYREFLY_X2L_CHAPTERS']?.split(',') ?? DEFAULT_CHAPTERS;
const MAX_STEPS = 60_000;
const MAX_LINKS = 12;

type Input = Extract<Decision, { kind: 'player-input' }>;

/** What `FFX2Engine#endWindowStats` returns on a build that has it. */
interface WindowStats {
  opened: number;
  lapsed: number;
  committed: number;
  waitedSteps: number;
  maxWaited?: number;
  capped?: number;
  inFlight: { party: number; enemy: number };
  lastCode: number;
}

interface Seed {
  outcome: string;
  links: number;
  digest: string;
  partyTurns: number;
  engineTurns: number;
  ticks: number;
  partyKos: number;
  itemUses: Record<string, number>;
  stockEnd: Record<string, number>;
  window: WindowStats;
  /** The end window of the link that was lost (a defeat is always the last link of a chain); null on a seed that was won. */
  defeatWindow: WindowStats | null;
}

function fallback(d: Input): Command {
  const row = d.commands.find((c) => c.enabled && c.command.kind === 'attack') ?? d.commands.find((c) => c.enabled);
  if (!row) return { kind: 'defend', targets: [] } as Command;
  const t = row.validTargets[0];
  return { ...row.command, targets: t ? [t] : [] } as Command;
}

function partyKosOf(log: readonly BattleEvent[], state: Readonly<BattleState>): number {
  let kos = 0;
  for (const e of log) {
    if (e.type !== 'ko') continue;
    const side = state.combatants[e.targetId]?.side;
    if (side === 'party' || side === 'aeon') kos += 1;
  }
  return kos;
}

function emptyWindow(): WindowStats {
  return { opened: 0, lapsed: 0, committed: 0, waitedSteps: 0, maxWaited: 0, capped: 0, inFlight: { party: 0, enemy: 0 }, lastCode: 0 };
}

function addWindow(into: WindowStats, from: WindowStats): void {
  into.opened += from.opened;
  into.lapsed += from.lapsed;
  into.committed += from.committed;
  into.waitedSteps += from.waitedSteps;
  into.maxWaited = Math.max(into.maxWaited ?? 0, from.maxWaited ?? 0);
  into.capped = (into.capped ?? 0) + (from.capped ?? 0);
  into.inFlight.party += from.inFlight.party;
  into.inFlight.enemy += from.inFlight.enemy;
  into.lastCode = from.lastCode;
}

async function playChain(chapter: Chapter, seed: number): Promise<Seed> {
  let setup: BattleSetup = setupForChapter(chapter, seed);
  let group: EnemyGroupDef = chapter.enemyGroupRef;
  const engine = new FFX2Engine({ ...ffx2EngineOptions(), minigames: false });
  engine.setSeed(setup.seed);
  engine.init(setup);
  const hash = createHash('sha1');
  const out: Seed = {
    outcome: 'unresolved', links: 1, digest: '', partyTurns: 0, engineTurns: 0, ticks: 0, partyKos: 0, itemUses: {}, stockEnd: {}, window: emptyWindow(), defeatWindow: null,
  };
  const stats = (): WindowStats => {
    const f = (engine as unknown as { endWindowStats?: () => WindowStats }).endWindowStats;
    return typeof f === 'function' ? f.call(engine) : emptyWindow();
  };
  let link = 1;
  for (let step = 0; step < MAX_STEPS; step += 1) {
    const d = engine.nextDecision();
    if (d.kind === 'resolved') continue;
    if (d.kind === 'waiting') {
      engine.tick(Math.max(1, d.nextEventMs));
      continue;
    }
    if (d.kind === 'battle-over') {
      const state = engine.state() as Readonly<BattleState>;
      out.engineTurns += d.result.turns;
      out.partyKos += partyKosOf(state.log, state);
      out.ticks += state.ticks;
      for (const e of state.log) {
        if (e.type === 'action-start' && e.command.kind === 'item' && state.combatants[e.actorId]?.side === 'party') {
          out.itemUses[e.command.id] = (out.itemUses[e.command.id] ?? 0) + 1;
        }
      }
      hash.update(JSON.stringify(state.log));
      const linkWindow = stats();
      addWindow(out.window, linkWindow);
      if (String(d.result.outcome) === 'defeat') out.defeatWindow = linkWindow;
      for (const [key, value] of Object.entries(state.flags)) {
        if (key.startsWith('inventory:') && typeof value === 'number') out.stockEnd[key.slice('inventory:'.length)] = value;
      }
      out.outcome = String(d.result.outcome);
      out.links = link;
      if (out.outcome !== 'victory' || !group.nextGroupId || link >= MAX_LINKS) break;
      const next = await findEnemyGroup(group.nextGroupId);
      if (!next) break;
      setup = setupForNextLink(setup, next, engine.state() as BattleState, seed + link);
      group = next;
      link += 1;
      engine.setSeed(setup.seed);
      engine.init(setup);
      continue;
    }
    out.partyTurns += 1;
    engine.submit(intendedStrategy(d.actorId, d.commands, engine as never) ?? fallback(d));
  }
  out.digest = hash.digest('hex').slice(0, 16);
  return out;
}

describe.skipIf(!MEASURE)('RE parity RC8, FFX-2: wins, item use and the end window (PYREFLY_X2L_MEASURE=1)', () => {
  it('plays the chapters and writes the rows', async () => {
    await registerBattleContent();
    const rows: Array<Record<string, unknown>> = [];
    const perSeed: Record<string, Seed[]> = {};
    for (const id of CHAPTER_IDS) {
      const chapter = getChapter(id);
      if (!chapter || chapter.game !== 'ffx2') {
        console.log(JSON.stringify({ chapter: id, skipped: 'not an FFX-2 chapter on this build' }));
        continue;
      }
      const runs: Seed[] = [];
      for (let seed = FIRST_SEED; seed <= LAST_SEED; seed += 1) runs.push(await playChain(chapter, seed));
      perSeed[id] = runs;
      const win = emptyWindow();
      for (const r of runs) addWindow(win, r.window);
      const items: Record<string, number> = {};
      for (const r of runs) for (const [k, v] of Object.entries(r.itemUses)) items[k] = (items[k] ?? 0) + v;
      const sum = (f: (r: Seed) => number): number => runs.reduce((a, r) => a + f(r), 0);
      // The case "the last girl falls with a revive queued by another girl": the defeats' own windows, link by link (the aggregate above mixes in the won links).
      const lost = runs.map((r) => r.defeatWindow).filter((w): w is WindowStats => w !== null);
      const defeatWindows = {
        defeats: lost.length,
        opened: lost.reduce((a, w) => a + w.opened, 0),
        lapsed: lost.reduce((a, w) => a + w.lapsed, 0),
        withPartyCastInFlight: lost.filter((w) => w.inFlight.party > 0).length,
        withEnemyCastInFlight: lost.filter((w) => w.inFlight.enemy > 0).length,
        partyCastsInFlight: lost.reduce((a, w) => a + w.inFlight.party, 0),
        enemyCastsInFlight: lost.reduce((a, w) => a + w.inFlight.enemy, 0),
        waitedSteps: lost.reduce((a, w) => a + w.waitedSteps, 0),
        longestWait: lost.reduce((a, w) => Math.max(a, w.maxWaited ?? 0), 0),
      };
      rows.push({
        chapter: id,
        seeds: runs.length,
        firstSeed: FIRST_SEED,
        wins: runs.filter((r) => r.outcome === 'victory').length,
        losses: runs.filter((r) => r.outcome === 'defeat').length,
        unresolved: runs.filter((r) => r.outcome !== 'victory' && r.outcome !== 'defeat').length,
        link1Wins: runs.filter((r) => r.links > 1 || r.outcome === 'victory').length,
        perSeed: runs.map((r) => (r.outcome === 'victory' ? 'W' : r.outcome === 'defeat' ? 'L' : 'U')).join(''),
        sums: { partyTurns: sum((r) => r.partyTurns), engineTurns: sum((r) => r.engineTurns), minutes: Math.round(sum((r) => r.ticks) / STEPS_PER_SECOND / 6) / 10, partyKos: sum((r) => r.partyKos) },
        itemUses: items,
        itemUsesPerFight: Math.round((Object.values(items).reduce((a, b) => a + b, 0) / Math.max(1, runs.length)) * 100) / 100,
        window: win,
        defeatWindows,
      });
    }
    for (const row of rows) console.log(JSON.stringify(row));
    if (OUT) writeFileSync(OUT, JSON.stringify({ rows, perSeed }));
  }, 6_000_000);
});
