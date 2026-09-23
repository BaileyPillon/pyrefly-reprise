/**
 * **Chapter 7 (Seymour and Anima, Macalania Temple) — the three questions
 * `docs/handoff/chapter-leblanc-measure.md` and `critic/bench/advisor-v2`
 * already asked of the other chapters, asked of this one.**
 *
 * (a) the chapter's own intended line (`tacticFor` now resolves
 * `seymourAnimaMacalania` for this group's four combatant ids — the same
 * routing `strategy-macalania.test.ts` predicted before the integrator wired
 * it in `62b4927`); (b) the move-advisor card's top row, pressed every turn,
 * nothing else, exactly like `critic/bench/advisor-v2/harness.ts`'s
 * `advisor-v2` driver; (c) Chapter 1 (Seymour Flux, Gagazet) as the control,
 * so a change in the shared advisor or engine plumbing cannot hide behind
 * "only the new chapter moved."
 *
 * Forty contiguous seeds per arm, headless, no DOM, no `three`
 * (`src/battle/ffx/**` and the tactic file are pure per hard rule 1).
 * **Game case: FFX only** [AGENTS.md rule 14] — Chapter 7 and the Chapter 1
 * control are both FFX (CTB); no FFX-2 file is touched.
 *
 * **Nothing here is tuned.** The chapter's own numbers
 * (`docs/handoff/chapter-macalania-engine.md` §1, `tests/unit/strategy-macalania.test.ts`)
 * are reproduced, not adjusted, to prove this bench's harness and this
 * session's build agree with the engine work before trusting the advisor
 * row (hard rule 6; memory "boss-side fix needs measured options").
 *
 * Run:
 * ```
 * PYREFLY_MEASURE=1 npx vitest run --config critic/bench/macalania/vitest.config.ts
 * ```
 */

import { writeFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { Command, Decision } from '../../../src/battle/common/types.ts';
import { FFXContentRegistry, createFFXEngine } from '../../../src/battle/ffx/index.ts';
import { ALL_ABILITIES, ENEMY_GROUPS_BY_ID, ITEMS } from '../../../src/data/ffx/index.ts';
import { CHAPTERS } from '../../../src/data/encounters.ts';
import { intendedStrategy } from '../../../src/engine/BattlePresenterStrategies.ts';
import { buildAdvisorView } from '../../../src/engine/tactics/advisor.ts';

const MAX_DECISIONS = 60_000;
const SEEDS = Array.from({ length: 40 }, (_, i) => i + 1);

const CHAPTER_IDS = ['seymour-anima-macalania', 'seymour-flux'] as const;
type ChapterId = (typeof CHAPTER_IDS)[number];
type Driver = 'intended' | 'advisor-top-row';

const content = new FFXContentRegistry();
content.addAbilities(ALL_ABILITIES);
content.addItems(Object.values(ITEMS));

function newEngine(chapterId: ChapterId, seed: number) {
  const chapter = CHAPTERS.find((c) => c.id === chapterId);
  if (!chapter) throw new Error(`no chapter "${chapterId}" in encounters.ts`);
  const group = ENEMY_GROUPS_BY_ID[chapter.enemyGroupRef.id];
  if (!group) throw new Error(`${chapter.enemyGroupRef.id} missing from the FFX data layer`);
  const engine = createFFXEngine({ content, autoResolveMinigames: true });
  engine.init({
    game: 'ffx',
    party: chapter.buildRef,
    enemies: group,
    triggers: [],
    seed,
    condition: 'normal',
    canEscape: false,
  } as never);
  return engine;
}

/** The last legal thing on the menu, so a driver can never stall the engine. */
function fallback(d: Extract<Decision, { kind: 'player-input' }>): Command {
  const r = d.commands.find((c) => c.enabled && c.validTargets.length > 0);
  const t = r?.validTargets[0];
  if (!r) return { kind: 'defend', targets: [] };
  return { ...r.command, targets: t ? [t] : [] } as Command;
}

interface RunResult {
  outcome: string;
  turns: number;
  decisions: number;
  declines: number;
}

function run(chapterId: ChapterId, seed: number, driver: Driver): RunResult {
  const engine = newEngine(chapterId, seed);
  let outcome = 'unresolved';
  let turns = 0;
  let decisions = 0;
  let declines = 0;

  for (let i = 0; i < MAX_DECISIONS; i += 1) {
    const d = engine.nextDecision();
    if (d.kind === 'battle-over') {
      outcome = String((d as { result?: { outcome?: string } }).result?.outcome ?? 'over');
      break;
    }
    if (d.kind !== 'player-input') continue;

    decisions += 1;
    turns = engine.state().turn ?? turns;
    let chosen: Command | null = null;

    if (driver === 'intended') {
      chosen = intendedStrategy(d.actorId, d.commands, engine as never);
    } else {
      // A card-follower presses ONLY the top row, nothing else — a decline
      // is a real outcome for that turn, not laundered through the
      // chapter's own line (same rule `advisor-v2/harness.ts` follows).
      const view = buildAdvisorView(engine.state(), { actorId: d.actorId, commands: d.commands }, {
        ffxContent: content,
        planner: true,
      });
      chosen = view?.suggestions[0]?.command ?? null;
      if (!chosen) declines += 1;
    }
    if (!chosen) chosen = fallback(d);
    engine.submit(chosen);
  }

  return { outcome, turns, decisions, declines };
}

function median(xs: readonly number[]): number {
  if (xs.length === 0) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 === 1 ? s[m]! : (s[m - 1]! + s[m]!) / 2;
}

describe('macalania bench', () => {
  it(
    `${CHAPTER_IDS.length} chapters x ${SEEDS.length} seeds x intended/advisor-top-row`,
    () => {
      const rows: Array<{
        chapterId: ChapterId;
        driver: Driver;
        wins: number;
        seeds: number;
        winRate: number;
        medianTurns: number;
        declines: number;
      }> = [];

      for (const chapterId of CHAPTER_IDS) {
        for (const driver of ['intended', 'advisor-top-row'] as const) {
          const runs = SEEDS.map((seed) => run(chapterId, seed, driver));
          const wins = runs.filter((r) => r.outcome === 'victory').length;
          const kos = runs.filter((r) => r.outcome === 'defeat').length;
          const row = {
            chapterId,
            driver,
            wins,
            seeds: SEEDS.length,
            winRate: Math.round((wins / SEEDS.length) * 1000) / 10,
            medianTurns: median(runs.map((r) => r.turns)),
            declines: runs.reduce((a, r) => a + r.declines, 0),
          };
          rows.push(row);
          // eslint-disable-next-line no-console
          console.log(
            `${chapterId.padEnd(24)} ${driver.padEnd(16)} ${String(row.wins).padStart(2)}/${row.seeds} ` +
              `(${row.winRate.toFixed(1)}%)  turns~${row.medianTurns}  KOs ${kos}  declines ${row.declines}`,
          );
        }
      }

      writeFileSync(
        new URL('./results.json', import.meta.url),
        `${JSON.stringify({ seeds: SEEDS.length, at: new Date().toISOString(), rows }, null, 2)}\n`,
      );

      expect(rows.length).toBe(CHAPTER_IDS.length * 2);
    },
    30 * 60_000,
  );
});
