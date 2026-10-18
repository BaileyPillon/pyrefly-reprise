/**
 * **The Pilgrimage, end to end** (hidden prototype, FFX only; Bailey, 2026-10-18, "it needs a really addictive aspect and tighter core gameplay loop", decision 122: "Option 2 + B: branching, boons").
 *
 * The board's `pilgrim` word settles on the first stop and arms the flow (`frontend/pilgrimDoor.ts`, `GameFlow.armPilgrimage`); the flow's next `runChapter` hands this module a {@link PilgrimHost}. It is loaded by a dynamic
 * import at that moment, so a player who never types the word never fetches a byte of it.
 *
 * ```
 *   road (Begin) -> [ prep (the RUN tab) -> fight -> boon pick + road ]  x 4  -> run over (Again | Chapter select)
 *                           a loss, leaving, or the finale's win ends the run: ---^
 * ```
 *
 * Every fight is `GameFlow.runChapter` for the stop's chapter with a {@link PilgrimFightHook}: the chapter the flow fights is the shipped one with the pack's boons in its party (`./applyBoons.ts`), its attempt and clear go
 * nowhere (the run keeps its own record, `./runStore.ts`, never the save), the cutscenes and the results page are skipped (the run's own screens take their place), a loss ends the fight with no retry panel, and RESTART
 * ENCOUNTER is not a retry here (it ends the run). **Nothing the engine does and no boss number is changed.**
 *
 * **Quick retry.** From the run-over page, Again (Enter) starts a new run and goes straight to the first stop's party prep, where Enter starts the battle: two key presses from a loss to the next fight (the road is
 * fixed at the first stop, so there is nothing to choose before it).
 *
 * A player who leaves some other way (the pause menu's CHAPTER SELECT or QUIT TO TITLE) navigates the flow out from under the run: it is abandoned without a word and without a record.
 *
 * Game case: FFX only for this prototype; the run plumbing is game-neutral.
 */

import { drawRunSeed } from '../runSeed.ts';
import { beginExperimentRun } from '../experiments/experimentRun.ts';
import type { FlowProgress } from '../experiments/experimentRecords.ts';
import type { BattleScreenResult } from '../screens/BattleScreen.ts';
import { clearActiveFight, setActiveFight } from './activeRun.ts';
import { boonedChapter } from './applyBoons.ts';
import { PilgrimBoonScreen, PilgrimOverScreen, PilgrimRouteScreen } from './PilgrimScreens.ts';
import type { PilgrimFightHook, PilgrimHost } from './pilgrimHook.ts';
import './pilgrimPrep.ts'; // registers the RUN tab (visible only while a run's fight is up)
import { currentStop, finishFight, leaveRun, newRun, reached, summarize, type FightEnd, type RunState } from './runState.ts';
import { readPilgrim, recordRunEnd, recordRunStart } from './runStore.ts';

/** A run fight never writes the chapter's own attempts, clears or best time: a boon makes the fight easier, so its clear is not the chapter's. */
const NO_PROGRESS: FlowProgress = {
  recordAttempt: () => undefined,
  chapter: () => ({ bestTimeMs: null }),
  recordClear: () => undefined,
};

/** How a finished fight reads to the run. */
function howEnded(result: BattleScreenResult | null): FightEnd {
  if (result === null) return 'left'; // backed out of party prep
  if (result.outcome === 'victory') return 'victory';
  return result.outcome === 'defeat' || result.outcome === 'escape' ? 'defeat' : 'left'; // 'aborted': RESTART ENCOUNTER or an exit
}

/** The seed of one fight: the run's, moved by the fight's number, so a run replays from its seed. */
export function fightSeed(run: RunState): number {
  return run.seed + reached(run);
}

/** Play the fight in front of the run. */
async function fight(host: PilgrimHost, run: RunState): Promise<{ result: BattleScreenResult | null; how: FightEnd }> {
  const hook: PilgrimFightHook = {
    chapter: (shipped) => {
      const { chapter, applied } = boonedChapter(shipped, run.pack);
      setActiveFight({ run, lines: applied.map((a) => ({ boon: a.boon, line: a.line })) });
      return chapter;
    },
    progress: NO_PROGRESS,
  };
  try {
    host.setStep('pilgrimage');
    const result = await host.fight(currentStop(run).chapter, { seed: fightSeed(run), skipCutscenes: true, skipResults: true, pilgrim: hook });
    return { result, how: howEnded(result) };
  } finally {
    clearActiveFight();
  }
}

/** The whole Pilgrimage. Resolves with the last fight's result (so the caller can tell QUIT TO TITLE), or null. */
export async function runPilgrimage(host: PilgrimHost): Promise<BattleScreenResult | null> {
  host.claim();
  host.setStep('pilgrimage');
  const endRun = beginExperimentRun(); // the coach's memory stays off the save for as long as the run lasts (a run is no chapter of the save)
  let last: BattleScreenResult | null = null;
  try {
    let again = false;
    for (;;) {
      let run = newRun(drawRunSeed(), Date.now());
      if (!again) {
        const road = new PilgrimRouteScreen(readPilgrim());
        if (!(await host.show(road))) return last;
        if ((await road.done) === 'leave') return last;
      }
      recordRunStart(); // a run is counted when it begins, not when its road is looked at
      again = false;
      while (run.phase !== 'over') {
        if (run.phase === 'fight') {
          const fought = await fight(host, run);
          last = fought.result ?? last;
          if (host.away() || fought.result?.quitToTitle === true) return fought.result ?? last;
          run = finishFight(run, fought.how, Date.now());
        } else {
          const picks = new PilgrimBoonScreen(run);
          if (!(await host.show(picks))) return last;
          const chosen = await picks.done;
          if (host.away()) return last;
          run = chosen.left ? leaveRun(chosen.run, Date.now()) : chosen.run;
        }
      }
      const kept = recordRunEnd(summarize(run, Date.now()));
      host.setStep('pilgrimage-over');
      const over = new PilgrimOverScreen(run, kept);
      if (!(await host.show(over))) return last;
      if ((await over.done) !== 'again') return last;
      again = true;
    }
  } finally {
    clearActiveFight();
    endRun();
    host.setStep('idle');
  }
}
