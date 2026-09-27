/**
 * The flow for a hidden, experimental chapter (the FF7 Guard Scorpion today).
 *
 * `GameFlow.runChapter` hands any `chapter.experimental` record here before it
 * touches the save, so an experiment never writes `pyrefly-reprise:save:v1`
 * (`docs/plans/ff7-guard-scorpion-architecture.md` §2.3): no party prep (FF7 has
 * no prep screen), no `save.recordAttempt`, no arc logic, and its attempts,
 * clears and time go to `app/experiments/experimentRecords.ts` instead.
 *
 * **Behind one switch.** While `FF7_EXPERIMENT_READY` is false (the default
 * until the FF7 engine and HUD exist) this returns `null` at once: the inert
 * holding state. Nothing is shown, nothing is written, and the caller goes back
 * to the board exactly as if the player had backed out.
 *
 * Game case: FF7 only (the flow is written for any experiment; FF7 is the only one).
 */

import type { Chapter } from '../../data/encounters.ts';
import type { Screen } from '../Screen.ts';
import type { BattleScreenOptions, BattleScreenResult } from './BattleScreen.ts';
import type { RunChapterOptions } from './BattleScreenFlow.ts';
import { ff7ExperimentReady } from '../experiments/ff7Flag.ts';
import { recordExperimentAttempt, recordExperimentClear } from '../experiments/experimentRecords.ts';

/** A battle the flow can await: the real screen resolves `finished`, a test stand-in `done`. */
export type ExperimentBattle = Screen &
  ({ readonly finished: Promise<BattleScreenResult> } | { readonly done: Promise<BattleScreenResult> });

/** What the flow lends an experiment: its guarded `show`, its step label, and the battle factory. */
export interface ExperimentPorts {
  show(screen: Screen): Promise<boolean>;
  setStep(step: string): void;
  makeBattle(opts: BattleScreenOptions): ExperimentBattle;
}

/** Log once per call, so a developer who opens the door with the switch off sees why nothing happened. */
function holding(chapter: Chapter): null {
  // eslint-disable-next-line no-console
  console.info(`[experiment] ${chapter.id} is registered but FF7_EXPERIMENT_READY is off (src/app/experiments/ff7Flag.ts).`);
  return null;
}

/**
 * Run an experimental chapter once. Returns how the attempt ended, or `null`
 * in the holding state or when the flow was navigated out from under.
 */
export async function runExperiment(
  chapter: Chapter,
  opts: RunChapterOptions,
  ports: ExperimentPorts,
): Promise<BattleScreenResult | null> {
  if (!chapter.experimental || !ff7ExperimentReady()) return holding(chapter);
  recordExperimentAttempt(chapter.id);
  ports.setStep('battle');
  const battle = ports.makeBattle({
    chapter,
    seed: opts.seed ?? 1,
    auto: opts.auto ?? null,
    ...(opts.speed ? { speed: opts.speed } : {}),
  });
  if (!(await ports.show(battle))) return null;
  const fought = await ('finished' in battle ? battle.finished : battle.done);
  // An automated run never sets a best time (the chapters' `clearTimeToRecord` rule).
  if (fought.outcome === 'victory') recordExperimentClear(chapter.id, opts.auto ? null : fought.elapsedMs);
  // The FF7 results and defeat panels (and RETRY, reseeded `seed + attempt * 1000` as chapters do)
  // come with the FF7 HUD after Bailey's pick; until then every outcome returns to the board,
  // which the fight leaves unchanged.
  ports.setStep('idle');
  return fought;
}
