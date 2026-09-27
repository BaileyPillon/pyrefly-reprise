/**
 * The flow for a hidden, experimental chapter (the FF7 Guard Scorpion today).
 *
 * `GameFlow.runChapter` hands any `chapter.experimental` record here before it
 * touches the save, so an experiment never writes `pyrefly-reprise:save:v1`
 * (`docs/plans/ff7-guard-scorpion-architecture.md` §2.3): no party prep (FF7 has
 * no prep screen), no `save.recordAttempt`, no arc logic, and its attempts,
 * clears and time go to `app/experiments/experimentRecords.ts` instead.
 *
 * The loop (plan §2.3; Bailey's picks D-237 to D-240, "ill go with all your
 * recommendations"): the chapters' own way in (the battle swirl, no extra sign
 * for the door), the fight, then
 * - **victory**: the results panel, then back to the board (the caller);
 * - **defeat**: the defeat panel; **RETRY** goes straight back in with a new
 *   seed (`seed + attempt * 1000`, as the chapters reseed), CHAPTER SELECT
 *   returns to the board.
 *
 * **Behind one switch.** While `FF7_EXPERIMENT_READY` is false this returns
 * `null` at once: nothing is shown, nothing is written, and the caller goes
 * back to the board exactly as if the player had backed out.
 *
 * Game case: FF7 only (the flow is written for any experiment; FF7 is the only one).
 */

import type { Chapter } from '../../data/encounters.ts';
import type { Screen } from '../Screen.ts';
import type { BattleScreenOptions, BattleScreenResult } from './BattleScreen.ts';
import type { RunChapterOptions } from './BattleScreenFlow.ts';
import type { ResultsChoice } from '../../ui/common/resultsPage.ts';
import { ff7ExperimentReady } from '../experiments/ff7Flag.ts';
import type { Ff7PartyBuild } from '../../battle/common/types-ff7.ts';
import { playBattleSwirl } from '../../ui/common/transitions/index.ts';
import { playFf7Swirl } from '../../ui/ff7/ff7Swirl.ts';
import { Ff7ResultsScreen } from './Ff7ResultsScreen.ts';
import { recordExperimentAttempt, recordExperimentClear } from '../experiments/experimentRecords.ts';

/** A battle the flow can await: the real screen resolves `finished`, a test stand-in `done`. */
export type ExperimentBattle = Screen &
  ({ readonly finished: Promise<BattleScreenResult> } | { readonly done: Promise<BattleScreenResult> });

/** What the flow lends an experiment: its guarded `show`, its step label, and the battle factory. */
export interface ExperimentPorts {
  show(screen: Screen): Promise<boolean>;
  setStep(step: string): void;
  makeBattle(opts: BattleScreenOptions): ExperimentBattle;
  /**
   * The chapters' own way into a battle (the swirl covering the swap); `swap`
   * shows the battle and says whether it is up. Absent: the battle is shown bare.
   */
  playIn?(swap: () => Promise<boolean>, opts: RunChapterOptions): Promise<boolean>;
  /** The results or defeat panel; resolves with the player's pick. Absent: `'continue'`. */
  results?(chapter: Chapter, outcome: BattleScreenResult): Promise<ResultsChoice>;
}

/** Log once per call, so a developer who opens the door with the switch off sees why nothing happened. */
function holding(chapter: Chapter): null {
  // eslint-disable-next-line no-console
  console.info(`[experiment] ${chapter.id} is registered but FF7_EXPERIMENT_READY is off (src/app/experiments/ff7Flag.ts).`);
  return null;
}

/**
 * Run an experimental chapter until the player leaves it. Returns how the last
 * attempt ended, or `null` in the holding state or when the flow was navigated
 * out from under.
 */
export async function runExperiment(
  chapter: Chapter,
  opts: RunChapterOptions,
  ports: ExperimentPorts,
): Promise<BattleScreenResult | null> {
  if (!chapter.experimental || !ff7ExperimentReady()) return holding(chapter);
  const seed = opts.seed ?? 1;
  for (let attempt = 0; ; attempt++) {
    recordExperimentAttempt(chapter.id);
    ports.setStep('battle');
    const battle = ports.makeBattle({
      chapter,
      // A retry reseeds, so the same losing fight does not replay verbatim (as the chapters do).
      seed: seed + attempt * 1000,
      auto: opts.auto ?? null,
      ...(opts.speed ? { speed: opts.speed } : {}),
    });
    const swap = (): Promise<boolean> => ports.show(battle);
    if (!(await (ports.playIn ? ports.playIn(swap, opts) : swap()))) return null;
    const fought = await ('finished' in battle ? battle.finished : battle.done);
    // An automated run never sets a best time (the chapters' `clearTimeToRecord` rule).
    if (fought.outcome === 'victory') recordExperimentClear(chapter.id, opts.auto ? null : fought.elapsedMs);
    const panel = fought.outcome === 'victory' || fought.outcome === 'defeat';
    const choice: ResultsChoice = panel && !opts.skipResults && ports.results ? await ports.results(chapter, fought) : 'continue';
    if (fought.outcome === 'defeat' && choice === 'retry') continue;
    ports.setStep('idle');
    return fought;
  }
}

/**
 * The way into an experiment's battle: FF7's own swirl of the frozen board (F1, D-244) for an FF7
 * chapter, the chapters' swirl otherwise. `swap` shows the battle and says whether it is up.
 */
export async function experimentPlayIn(root: HTMLElement, chapter: Chapter, swap: () => Promise<boolean>, opts: RunChapterOptions): Promise<boolean> {
  let up: Promise<boolean> = Promise.resolve(true);
  const onCover = (): Promise<void> => (up = swap()).then(() => undefined);
  if (chapter.game === 'ff7') await playFf7Swirl(root, { instant: opts.speed === 'skip', onCover });
  else await playBattleSwirl(root, { instant: opts.speed === 'skip', onCover });
  return up;
}

/** FF7's results windows or its Game Over (C1, G1, D-244) in place of the house panel; resolves with the pick. */
export async function ff7Results(show: (s: Screen) => Promise<boolean>, chapter: Chapter, fought: BattleScreenResult): Promise<ResultsChoice> {
  const screen = new Ff7ResultsScreen({ outcome: fought.outcome, result: fought.result, build: chapter.buildRef as unknown as Ff7PartyBuild });
  if (!(await show(screen))) return 'continue';
  return screen.done;
}
