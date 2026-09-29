/**
 * **Lethal-save misses, fork-tested** (advisor v4, FFX only; the v3 method check §6b reading,
 * ported to CTB). The worker-path scorecard (`worker-path.test.ts`) counts a lethal-save miss by
 * arithmetic: the forecast says the enemy's next action kills a girl, some row carries
 * `saves-from-lethal`, the card's top row does not. The arithmetic prices every row as if it
 * landed first, so it over-counts. This bench drives the same runs the same way (the same drive,
 * the same card, the same presses) and, at every decision the arithmetic flags, forks the live
 * engine and plays it out:
 *
 * - **the pick** (the card's top row, the row the run presses) and **every saving row** (up to
 *   {@link MAX_SAVERS}) are pressed on forks: the 4 fixed search seeds of v3's `provedSave`, plus
 *   the **real stream** (the fork restored at the live RNG position, so the pick's real-stream
 *   future is the run's own future up to the enemy's turn);
 * - any party turn before the enemy's is pressed with v3's card (the fork has no worker);
 * - each future stops at the end of the first enemy action (or a threatened girl's KO, or the
 *   battle's end), and a **death** is a girl the forecast named lying KO there.
 *
 * Readings per flagged decision: deaths with the pick on the real stream and on the 4 seeds; the
 * same for the best saving row (fewest deaths over the 4 seeds); a **fork-tested miss** is v3's
 * rule (a saving row keeps her alive in at least half the futures more than the pick); a **real
 * death that a save row avoids** is the pick killing her on the real stream while the best saving
 * row keeps her alive on that same stream.
 *
 * Forks only: the live engine is read (`fork`, `transferable().rngState`), never driven by this.
 *
 * ```
 * V4F_BUDGET=lean V4F_TAG=fork-lean-iii node node_modules/vitest/vitest.mjs run --config critic/bench/advisor-v4/vitest.config.ts critic/bench/advisor-v4/lethal-fork.test.ts
 * ```
 * Env: `V4F_CHAPTER` (`braskas-final-aeon`), `V4F_SEEDS` (40), `V4F_FIRST_SEED` (1), `V4F_DRIVERS`
 * (`v3,v4`), `V4F_BUDGET` (`lean` | `mini`), `V4F_TAG` (writes `results/<tag>.json`).
 *
 * Game case: FFX only.
 */

import { afterAll, describe, expect, it } from 'vitest';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { BattleEvent, BattleSetup, BattleState, CombatantId, Command, EnemyGroupDef } from '../../../src/battle/common/types.ts';
import { FFXEngine } from '../../../src/battle/ffx/index.ts';
import { registerBattleContent } from '../../../src/app/screens/BattleScreenContent.ts';
import { findEnemyGroup, setupForChapter, setupForNextLink } from '../../../src/app/screens/BattleScreenSetup.ts';
import { buildAdvisorView, type AdvisorView } from '../../../src/engine/tactics/advisor.ts';
import { pressable } from '../../../src/engine/tactics/advisor-menu.ts';
import { evaluate } from '../../../src/engine/tactics/advisor-eval.ts';
import { forecastFromState } from '../../../src/engine/tactics/advisor-forecast.ts';
import type { BudgetName } from '../../../src/engine/tactics/advisor-v4/presets.ts';
import type { MoveAdvisorLookAhead } from '../../../src/ui/common/MoveAdvisor.ts';
import { attachAdvisorV4 } from '../../../src/app/advisorV4/wiring.ts';
import type { AdvisorV4Host } from '../../../src/app/advisorV4/host.ts';
import { chapterById, fallbackCommand, type DecisionContext, type Input } from '../advisor-v3/drive.ts';
import { observe, simulateFor } from '../advisor-v3/metrics.ts';
import { InProcWorker } from './inproc-worker.ts';

const CHAPTER = process.env['V4F_CHAPTER'] ?? 'braskas-final-aeon';
const SEEDS = Number(process.env['V4F_SEEDS'] ?? 40);
const FIRST = Number(process.env['V4F_FIRST_SEED'] ?? 1);
const DRIVERS = (process.env['V4F_DRIVERS'] ?? 'v3,v4').split(',').filter(Boolean);
const BUDGET = (process.env['V4F_BUDGET'] ?? 'lean') as BudgetName;
const TAG = process.env['V4F_TAG'] ?? `fork-${BUDGET}`;
const HERE = dirname(fileURLToPath(import.meta.url));
const REFUSAL_STREAK = 3;
/** v3's `provedSave` search seeds and margin (src/engine/tactics/advisor-lethal.ts). */
const FORK_SEEDS = [0x5afe_0001, 0x5afe_0002, 0x5afe_0003, 0x5afe_0004] as const;
const MARGIN = 0.5;
const MAX_SAVERS = 6;
const MAX_STEPS = 400;

interface Flag {
  seed: number; link: number; index: number; actor: string; threatened: string[]; pick: string; bestSave: string;
  pickRealDead: boolean; saveRealDead: boolean; pickSeedDeaths: number; saveSeedDeaths: number;
  forkMiss: boolean; realAvoidable: boolean; pickClaimsSave: boolean;
}
interface Row {
  chapterId: string; driver: string; budget: string; seeds: number; wins: number; winSeeds: number[]; decisions: number;
  flagged: number; forkMiss: number; realDeathsPick: number; realDeathsAvoidable: number; seedDeathsPick: number; seedDeathsSave: number; flags: Flag[];
}
const rows: Row[] = [];

const label = (c: Command): string => {
  const id = 'id' in c ? String((c as { id?: unknown }).id ?? '') : '';
  return `${c.kind}${id ? `:${id}` : ''}->${(c.targets ?? []).join('+') || '-'}`;
};

/** Every enabled, paintable row aimed at each target it offers (the metrics' candidate list). */
function candidates(state: Readonly<BattleState>, d: Input): Command[] {
  const out: Command[] = [];
  for (const row of d.commands) {
    if (!row.enabled || row.wrapsCategory) continue;
    const k = row.command.kind;
    if (k === 'escape' || k === 'switch' || k === 'spherechange') continue;
    if (!pressable(state, row.command)) continue;
    const aims: Array<CombatantId | null> = row.validTargets.length === 0 ? [null] : row.validTargets.slice(0, 8);
    for (const t of aims) out.push({ ...row.command, targets: t ? [t] : [] } as Command);
    if (out.length >= 160) break;
  }
  return out;
}

/** Deaths among `threatened` after pressing `cmd` on a fork and playing to the end of the first enemy action. */
function deathsAfter(e: FFXEngine, seed: number, rngState: number | undefined, cmd: Command, threatened: ReadonlySet<CombatantId>): number | null {
  const f = e.fork(seed, rngState);
  const d0 = f.nextDecision();
  if (d0.kind !== 'player-input') return null;
  const first = f.submit(cmd);
  if (first.length === 0) return null;
  let done = false;
  const scan = (events: readonly BattleEvent[]): void => {
    const s = f.state();
    for (const ev of events) {
      if (ev.type === 'ko' && threatened.has(ev.targetId)) done = true;
      if (ev.type === 'action-end' && s.combatants[ev.actorId]?.side === 'enemy') done = true;
    }
    if (s.result) done = true;
  };
  scan(first);
  for (let step = 0; step < MAX_STEPS && !done; step++) {
    const d = f.nextDecision();
    if (d.kind === 'battle-over') break;
    if (d.kind === 'resolved') { scan(d.events); continue; }
    if (d.kind !== 'player-input') continue;
    const v = buildAdvisorView(f.state(), { actorId: d.actorId, commands: d.commands }, {});
    const pick = v?.suggestions[0]?.command ?? fallbackCommand(d);
    const ev = f.submit(pick);
    if (ev.length === 0) f.submit(fallbackCommand(d));
    else scan(ev);
  }
  const s = f.state();
  return [...threatened].filter((id) => s.combatants[id]?.alive === false).length;
}

function forkTest(e: FFXEngine, state: Readonly<BattleState>, d: Input, card: AdvisorView | null): Omit<Flag, 'seed' | 'link' | 'index'> | null {
  const pick = card?.suggestions[0]?.command ?? fallbackCommand(d);
  const intent = forecastFromState(state, {});
  const threatened = new Set<CombatantId>(
    (intent?.estimate?.perTarget ?? [])
      .filter((p) => { const u = state.combatants[p.targetId]; return u && u.side !== 'enemy' && u.alive !== false && (p.lethal || p.amount >= u.hp); })
      .map((p) => p.targetId),
  );
  if (threatened.size === 0) return null;
  const saves = (c: Command): boolean =>
    evaluate(state, d.actorId, c, simulateFor(state, d.actorId, c, {}), [], intent).facts.some((f) => f.kind === 'saves-from-lethal');
  const savers = candidates(state, d).filter(saves).slice(0, MAX_SAVERS);
  if (savers.length === 0) return null;
  const rng = e.transferable().rngState;
  const seedDeaths = (c: Command): number => FORK_SEEDS.reduce((n, s) => n + (deathsAfter(e, s, undefined, c, threatened) ?? threatened.size), 0);
  const pickSeed = seedDeaths(pick);
  const pickReal = (deathsAfter(e, 1, rng, pick, threatened) ?? 0) > 0;
  let best = savers[0]!;
  let bestSeed = Infinity;
  for (const c of savers) {
    const n = seedDeaths(c);
    if (n < bestSeed) { best = c; bestSeed = n; }
  }
  const saveReal = (deathsAfter(e, 1, rng, best, threatened) ?? threatened.size) > 0;
  const lives = (deaths: number): number => 1 - deaths / (FORK_SEEDS.length * threatened.size);
  return {
    actor: d.actorId, threatened: [...threatened], pick: label(pick), bestSave: label(best),
    pickRealDead: pickReal, saveRealDead: saveReal, pickSeedDeaths: pickSeed, saveSeedDeaths: bestSeed,
    forkMiss: lives(bestSeed) - lives(pickSeed) >= MARGIN - 1e-9, realAvoidable: pickReal && !saveReal, pickClaimsSave: saves(pick),
  };
}

async function runOne(seed: number, driver: string, r: Row): Promise<string> {
  await registerBattleContent();
  const chapter = chapterById(CHAPTER);
  let setup: BattleSetup = setupForChapter(chapter, seed);
  let group: EnemyGroupDef = chapter.enemyGroupRef;
  const e = new FFXEngine({ autoResolveMinigames: true });
  e.setSeed(setup.seed);
  e.init(setup);
  let source: MoveAdvisorLookAhead | null = null;
  const worker = new InProcWorker();
  let host: AdvisorV4Host | null = null;
  if (driver === 'v4') {
    (globalThis as { __pyreflyAdvisorV4Force?: boolean }).__pyreflyAdvisorV4Force = true;
    const owner = { moveAdvisor: { setLookAhead: (s: MoveAdvisorLookAhead | null) => { source = s; } } };
    host = attachAdvisorV4(owner, e, 'ffx', { spawn: () => worker, budget: BUDGET, capMs: 3_600_000 });
  }
  const groups: EnemyGroupDef[] = [];
  for (let g: EnemyGroupDef | null = group; g?.nextGroupId && groups.length < 12; ) {
    g = (await findEnemyGroup(g.nextGroupId)) ?? null;
    if (g) groups.push(g);
  }
  let link = 1;
  let outcome = 'unresolved';
  let streakActor = '';
  let streak = 0;
  let index = 0;
  for (let step = 0; step < 120_000; step++) {
    const d = e.nextDecision();
    if (d.kind === 'resolved' || d.kind === 'waiting') continue;
    if (d.kind === 'battle-over') {
      outcome = d.result.outcome;
      if (outcome !== 'victory' || !group.nextGroupId || link >= 12) break;
      const next = await findEnemyGroup(group.nextGroupId);
      if (!next) break;
      setup = setupForNextLink(setup, next, e.state() as BattleState, seed + link);
      group = next;
      link += 1;
      e.setSeed(setup.seed);
      e.init(setup);
      continue;
    }
    index += 1;
    r.decisions += 1;
    const state = e.state();
    let view: AdvisorView | null = null;
    if (host) {
      await worker.idle();
      view = (source as MoveAdvisorLookAhead | null)?.cardFor(state, d) ?? null;
    }
    const card = view ?? buildAdvisorView(state, { actorId: d.actorId, commands: d.commands }, {});
    const ctx: DecisionContext = {
      chapterId: CHAPTER, game: 'ffx', seed, link, index, engine: e, state, decision: d, advisorOptions: {},
      chain: { setup, next: groups.slice(link - 1) },
    };
    if (observe(ctx, card).lethalMiss) {
      r.flagged += 1;
      const t = forkTest(e, state, d, card);
      if (t) {
        const f: Flag = { seed, link, index, ...t };
        r.flags.push(f);
        if (f.forkMiss) r.forkMiss += 1;
        if (f.pickRealDead) r.realDeathsPick += 1;
        if (f.realAvoidable) r.realDeathsAvoidable += 1;
        r.seedDeathsPick += f.pickSeedDeaths;
        r.seedDeathsSave += f.saveSeedDeaths;
      }
    }
    (source as MoveAdvisorLookAhead | null)?.closed();
    let pick: Command | null = streak >= REFUSAL_STREAK && d.actorId === streakActor ? null : card?.suggestions[0]?.command ?? null;
    pick ??= fallbackCommand(d);
    const events = e.submit(pick);
    if (events.length === 0) {
      streak = d.actorId === streakActor ? streak + 1 : 1;
      streakActor = d.actorId;
    } else {
      streak = 0;
      streakActor = '';
    }
  }
  host?.dispose();
  return outcome;
}

describe(`advisor v4 lethal saves, fork-tested (${CHAPTER}, ${BUDGET})`, () => {
  for (const driver of DRIVERS) {
    it(`${driver}, seeds ${FIRST}..${FIRST + SEEDS - 1}`, async () => {
      const r: Row = {
        chapterId: CHAPTER, driver, budget: driver === 'v4' ? BUDGET : '-', seeds: 0, wins: 0, winSeeds: [], decisions: 0,
        flagged: 0, forkMiss: 0, realDeathsPick: 0, realDeathsAvoidable: 0, seedDeathsPick: 0, seedDeathsSave: 0, flags: [],
      };
      for (let seed = FIRST; seed < FIRST + SEEDS; seed++) {
        const out = await runOne(seed, driver, r);
        r.seeds += 1;
        if (out === 'victory') { r.wins += 1; r.winSeeds.push(seed); }
        process.stderr.write(`[v4f] ${CHAPTER} ${driver} seed ${seed}: ${out}, flagged so far ${r.flagged}\n`);
      }
      rows.push(r);
      expect(r.seeds).toBe(SEEDS);
    });
  }
  afterAll(() => {
    if (rows.length === 0) return;
    for (const o of rows) {
      console.log(`| ${o.chapterId} | ${o.driver} ${o.budget} | wins ${o.wins}/${o.seeds} | flagged ${o.flagged} | fork miss ${o.forkMiss} | real deaths (pick) ${o.realDeathsPick}, avoidable ${o.realDeathsAvoidable} | seed deaths pick ${o.seedDeathsPick} / save ${o.seedDeathsSave} |`);
    }
    mkdirSync(join(HERE, 'results'), { recursive: true });
    writeFileSync(join(HERE, 'results', `${TAG}.json`), JSON.stringify({ tag: TAG, chapter: CHAPTER, budget: BUDGET, seeds: SEEDS, first: FIRST, when: new Date().toISOString(), rows }, null, 2));
  });
});
