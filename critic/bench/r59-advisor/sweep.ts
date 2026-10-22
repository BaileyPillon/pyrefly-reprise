/**
 * **Release 59: the card against the chapter's own line, every chapter** (decision 145; Bailey, 2026-10-19:
 * "i'll go with all of your recommendations"; his 2026-09-18 criticism "advisor errors").
 *
 * One listed FFX or FFX-2 chapter at a time, N seeds, three players on the engine through the chapter's whole
 * chain (the harness of `critic/bench/advisor-v3/drive.ts`, the house human pace for FFX-2, CTB for FFX):
 *
 *  - `card`: presses the card's first row as the shipped build computes it (`buildAdvisorView` with the options the
 *    live HUD passes; no v4 look-ahead, which is a wall-clock search in the browser);
 *  - `card-before`: the same with the line-first rule switched off for the call (`AdvisorOptions.lineFirst: false`),
 *    so one binary measures the card as release 58 shipped it;
 *  - `line`: `intendedStrategy`, the chapter's tactic, the strategy guide's NEXT line (what the auto-battler plays);
 *  - `card-state-line`: the shipped card without the engine handle (`lineEngine`), so the line is read off the state alone (ablation: what the card was before the HUD handed it the engine);
 *  - `card-or-line` and `card-before-or-line`: the shipped card, or the line where the card is silent (Yojimbo's and the Magus Sisters' menus print no card by design, `advisor-aeons.ts`; the plain
 *    follower presses Attack there), to separate that silence from a wrong recommendation;
 *  - `card-v4` and `card-before-v4` (FFX only): the same two cards with advisor v4's look-ahead on top, run in-process the way the
 *    game's worker runs it (`src/app/advisorV4/core.ts`: the card, the search at the `mini` budget the game ships, and the lifted card
 *    when the search switches); the browser shows this card in FFX.
 *
 * Plain node, no vitest (the PC is short of memory): one process, one run at a time, one JSON line per run appended to
 * the output file, runs already in the file are skipped (a re-run resumes).
 *
 *   node --experimental-transform-types --disable-warning=ExperimentalWarning critic/bench/r59-advisor/sweep.ts \
 *        --chapters=seymour-flux,yunalesca --drivers=card-before,card,line --from=1 --to=40 --out=<file.jsonl>
 *
 * Not part of `npm test`. Game case: both (shared plumbing); what it measures is per chapter.
 */

import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname } from 'node:path';
import type { Command } from '../../../src/battle/common/types.ts';
import { buildAdvisorView } from '../../../src/engine/tactics/advisor.ts';
import { MINI } from '../../../src/engine/tactics/advisor-v4/presets.ts';
import { searchDecision } from '../../../src/engine/tactics/advisor-v4/search.ts';
import { chainOf, type Forkable } from '../advisor-v4/rollout.ts';
import { intendedStrategy } from '../../../src/engine/BattlePresenterStrategies.ts';
import { EXPERIMENT_CHAPTERS, getChapter } from '../../../src/data/encounters.ts';
import { listedChapters, runChapter, type DecisionContext, type Driver } from '../advisor-v3/drive.ts';

const arg = (name: string, fallback: string): string => {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
};

const CHAPTERS = arg('chapters', '').split(',').filter(Boolean); // ids of any registered chapter, listed or hidden; empty = every listed chapter; `hidden` = the hidden FFX and FFX-2 experiments
const DRIVERS = arg('drivers', 'card-before,card,line').split(',').filter(Boolean);
const FROM = Number(arg('from', '1'));
const TO = Number(arg('to', '40'));
const OUT = arg('out', 'D:/Tools/pyrefly-scratch/2026-10-19/r59-advisor/sweep.jsonl');

const cardDriver = (lineFirst: boolean | undefined): Driver => (ctx: DecisionContext): Command | null => {
  const options = lineFirst === undefined ? ctx.advisorOptions : { ...ctx.advisorOptions, lineFirst };
  const view = buildAdvisorView(ctx.state, { actorId: ctx.decision.actorId, commands: ctx.decision.commands }, options);
  return view?.suggestions[0]?.command ?? null;
};
/** The card the browser shows in FFX: v3's card, with v4's pick on top when the search switches and the card can carry it (`core.ts`). */
const v4Driver = (lineFirst: boolean | undefined): Driver => (ctx: DecisionContext): Command | null => {
  const options = lineFirst === undefined ? ctx.advisorOptions : { ...ctx.advisorOptions, lineFirst };
  const card = { actorId: ctx.decision.actorId, commands: ctx.decision.commands };
  const view = buildAdvisorView(ctx.state, card, options);
  const top = view?.suggestions[0]?.command ?? null;
  if (ctx.game !== 'ffx') return top;
  const s = searchDecision(ctx.engine as unknown as Forkable, ctx.state, ctx.decision, view, options, MINI, chainOf(ctx));
  if (!s.switched || !s.command) return top;
  const lifted = buildAdvisorView(ctx.state, card, { ...options, lift: s.command })?.suggestions[0]?.command ?? null;
  return lifted && JSON.stringify(lifted) === JSON.stringify(s.command) ? lifted : top;
};
const stateLineDriver: Driver = (ctx) => {
  const { lineEngine: _drop, ...rest } = ctx.advisorOptions as { lineEngine?: unknown } & Record<string, unknown>;
  const view = buildAdvisorView(ctx.state, { actorId: ctx.decision.actorId, commands: ctx.decision.commands }, rest);
  return view?.suggestions[0]?.command ?? null;
};
const orLineDriver = (lineFirst: boolean | undefined): Driver => (ctx) => cardDriver(lineFirst)(ctx) ?? intendedStrategy(ctx.decision.actorId, ctx.decision.commands, ctx.engine as never);
const lineDriver: Driver = (ctx) => intendedStrategy(ctx.decision.actorId, ctx.decision.commands, ctx.engine as never);

const DRIVER_OF: Record<string, Driver> = {
  card: cardDriver(undefined),
  'card-before': cardDriver(false),
  'card-state-line': stateLineDriver,
  'card-or-line': orLineDriver(undefined),
  'card-before-or-line': orLineDriver(false),
  'card-v4': v4Driver(undefined),
  'card-before-v4': v4Driver(false),
  line: lineDriver,
};

mkdirSync(dirname(OUT), { recursive: true });
const done = new Set<string>();
if (existsSync(OUT)) {
  for (const l of readFileSync(OUT, 'utf8').split('\n')) {
    if (!l.trim()) continue;
    const r = JSON.parse(l) as { chapterId: string; driver: string; seed: number };
    done.add(`${r.chapterId}|${r.driver}|${r.seed}`);
  }
}

const chapterOf = (id: string) => {
  const c = getChapter(id);
  if (!c) throw new Error(`no chapter "${id}"`);
  return c;
};
const hidden = () => EXPERIMENT_CHAPTERS.filter((c) => c.game === 'ffx' || c.game === 'ffx2');
const chapters = CHAPTERS[0] === 'hidden' ? hidden() : CHAPTERS.length > 0 ? CHAPTERS.map(chapterOf) : listedChapters();
for (const chapter of chapters) {
  for (const driverName of DRIVERS) {
    const driver = DRIVER_OF[driverName];
    if (!driver) throw new Error(`unknown driver ${driverName}`);
    for (let seed = FROM; seed <= TO; seed++) {
      if (done.has(`${chapter.id}|${driverName}|${seed}`)) continue;
      const t0 = Date.now();
      const r = await runChapter(chapter, seed, driver);
      appendFileSync(
        OUT,
        JSON.stringify({
          chapterId: chapter.id, game: chapter.game, driver: driverName, seed, outcome: r.outcome, links: r.linksCleared,
          decisions: r.decisions, closed: r.closed, refused: r.refused, fallbacks: r.fallbacks, minutes: Math.round(r.minutes * 100) / 100,
          ms: Date.now() - t0,
        }) + '\n',
      );
    }
  }
}
console.log('sweep done');
