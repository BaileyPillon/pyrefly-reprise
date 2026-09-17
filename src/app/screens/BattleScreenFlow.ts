/**
 * The chapter flow.
 *
 * ```
 * Title -> ChapterSelect -> PartyPrep -> Cutscene(pre) -> Battle
 *                                     -> Cutscene(post) -> Results -> ChapterSelect
 * ```
 *
 * `ui/common` takes any step over by calling {@link registerFlowScreens} once
 * at module load. A flow screen is an ordinary {@link Screen} that also exposes
 * `done: Promise<T>` — the flow awaits it and moves on. Nothing here has to be
 * edited when the real screens arrive; until they do, the placeholders in
 * `BattleScreenFlowStubs.ts` keep every step running.
 */

import type { Screen } from '../Screen.ts';
import type { App } from '../App.ts';
import type { BattleResult, GameId } from '../../battle/common/types.ts';
import type { Chapter, ChapterId } from '../../data/encounters.ts';
import { getChapter } from '../../data/encounters.ts';
import type { StoryScript } from '../../story/dsl.ts';
import { audio } from '../../audio/index.ts';
import { BattleScreen, type BattleScreenResult } from './BattleScreen.ts';
import { PartyPrepScreen } from './PartyPrepScreen.ts';
// Type-only: erased at build time, so this adds no runtime edge to the screen.
import type { ResultsChoice } from './ResultsScreen.ts';
import type { AutoStrategy } from '../../engine/BattlePresenter.ts';
import type { PlaybackSpeed } from '../../engine/BattlePresenterPorts.ts';
import { StubChapterSelect, StubCutscene, StubResults } from './BattleScreenFlowStubs.ts';
import { clearTimeMs } from '../../ui/common/resultsMath.ts';

/** A screen the flow can await. */
export interface FlowScreen<T> extends Screen {
  readonly done: Promise<T>;
}

export interface CutsceneScreenOptions {
  chapter: Chapter;
  script: StoryScript;
  phase: 'pre' | 'post';
  skip?: boolean;
}

export interface ResultsScreenOptions {
  chapter: Chapter;
  result: BattleResult | null;
  outcome: string;
  /** Chapter 4 suppresses the flourish entirely [writing-bible §5.4]. */
  silent?: boolean;
  /**
   * Wall-clock length of the whole encounter, chained links included. The FFX
   * engine leaves `BattleResult.elapsedMs` at 0 (it only advances inside `wait`
   * effects, which that engine never emits), so this is the only real clock the
   * results panel has [ResultsScreen / `clearTimeMs`].
   */
  elapsedMs?: number;
  /**
   * The chapter's best time as it stood **before** this clear was recorded —
   * `runChapter` writes the clear before the panel is shown, so the panel can
   * no longer read the old record itself.
   */
  previousBestMs?: number | null;
  /** Called with the player's pick. Only the defeat panel offers one. */
  onChoice?: (choice: ResultsChoice) => void;
}

/** Factories `ui/common` can supply. Any it omits uses the placeholder. */
export interface FlowScreenFactories {
  chapterSelect: () => FlowScreen<ChapterId | null>;
  partyPrep: (opts: { chapter: Chapter }) => FlowScreen<boolean>;
  cutscene: (opts: CutsceneScreenOptions) => FlowScreen<void>;
  results: (opts: ResultsScreenOptions) => FlowScreen<void>;
}

const factories: Partial<FlowScreenFactories> = {};

/** Replace one or more flow steps with the real screens. */
export function registerFlowScreens(next: Partial<FlowScreenFactories>): void {
  Object.assign(factories, next);
}

/** The chapter-select screen — the registered one, or the placeholder. */
export function makeChapterSelect(): FlowScreen<ChapterId | null> {
  return factories.chapterSelect?.() ?? new StubChapterSelect();
}

/** Which steps are real and which are still placeholders. */
export function flowReport(): Record<string, boolean> {
  return {
    chapterSelect: factories.chapterSelect !== undefined,
    partyPrep: factories.partyPrep !== undefined,
    cutscene: factories.cutscene !== undefined,
    results: factories.results !== undefined,
  };
}

export interface RunChapterOptions {
  seed?: number;
  skipCutscenes?: boolean;
  auto?: AutoStrategy | null;
  /** Skip the prep menu (the debug API's `gotoChapter` does). */
  skipPrep?: boolean;
  /** Playback speed. `'skip'` resolves a whole battle in milliseconds. */
  speed?: PlaybackSpeed;
  /**
   * Do not stop on the results screen.
   *
   * The results screen waits for a keypress, so an automated run that shows
   * it never finishes. Any caller driving the game without a human — the
   * debug API's `autoBattle`, an e2e spec, the critic — passes this.
   */
  skipResults?: boolean;
}

/**
 * The best-time value a victory should record, or `null` when this run must
 * never touch the record at all.
 *
 * Two independent guards, both required by the `best-time-flow` fix:
 * - **Never an automated run.** `auto` is set by the debug API's
 *   `autoBattle`, an e2e spec, or the critic — none of them is a play
 *   session, however long the run took wall-clock, so it must never
 *   overwrite (or create) a chapter's best time.
 * - **Never the raw wall clock.** Even a human-triggered run can carry
 *   `speed: 'skip'`, where every animation wait collapses to zero and a
 *   whole chapter resolves in a few milliseconds. `clearTimeMs` is the same
 *   plausibility-floored conversion the Results panel prints
 *   (`ui/common/resultsMath.ts`); reusing it here means Chapter Select can
 *   never show a "best time" the panel itself would never have displayed.
 */
export function clearTimeToRecord(
  result: BattleResult,
  wallClockMs: number,
  game: GameId,
  auto: AutoStrategy | null | undefined,
): number | null {
  if (auto) return null;
  return clearTimeMs(result, wallClockMs, game);
}

/** Drives the screen sequence. One instance lives on {@link App}. */
export class GameFlow {
  private readonly app: App;
  /** Set while a chapter is running, so the debug API can see where we are. */
  step: string = 'idle';
  private running = false;

  constructor(app: App) {
    this.app = app;
  }

  /** Title -> chapter select -> a chapter -> back to chapter select, forever. */
  async start(): Promise<void> {
    if (this.running) return;
    this.running = true;
    for (;;) {
      const chapterId = await this.chapterSelect();
      if (!chapterId) {
        this.step = 'title';
        await this.app.goto('title');
        this.running = false;
        return;
      }
      await this.runChapter(chapterId, {});
    }
  }

  /** Show chapter select and resolve with the player's pick. */
  async chapterSelect(): Promise<ChapterId | null> {
    this.step = 'chapter-select';
    void audio.playMusic('chapter-select', { fade: 1.2 }).catch(() => {
      /* the track may not be composed yet */
    });
    const screen = makeChapterSelect();
    await this.app.replace(screen);
    return screen.done;
  }

  /**
   * One chapter end to end. Returns how the last attempt ended, or `null` if
   * the player backed out of prep without fighting.
   *
   * A defeat loops back to the prep menu rather than throwing the player out
   * to chapter select — that is the retry, and backing out of prep is the
   * quit. An automated run (`skipPrep`, which the debug API defaults to) has
   * no menu to return to, so it reports the defeat and stops.
   */
  async runChapter(id: ChapterId, opts: RunChapterOptions): Promise<BattleScreenResult | null> {
    const chapter = getChapter(id);
    if (!chapter) return null;
    const save = this.app.save;
    let attempt = 0;

    for (;;) {
      if (!opts.skipPrep) {
        this.step = 'party-prep';
        const prep = factories.partyPrep?.({ chapter }) ?? new PartyPrepScreen({ chapter });
        await this.app.replace(prep);
        if (!(await prep.done)) return null;
      }

      save.recordAttempt(id);

      // The pre-battle scene plays once; a retry goes straight back in.
      if (!opts.skipCutscenes && attempt === 0) await this.playCutscene(chapter, 'pre');

      this.step = 'battle';
      const battle = new BattleScreen({
        chapter,
        // A retry reseeds, so the same losing fight does not replay verbatim.
        seed: (opts.seed ?? 1) + attempt * 1000,
        auto: opts.auto ?? null,
        ...(opts.speed ? { speed: opts.speed } : {}),
      });
      await this.app.replace(battle);
      const outcome = await battle.finished;
      attempt++;

      if (outcome.outcome === 'victory') {
        // Read the record before overwriting it, so the panel can tell whether
        // this run actually beat it.
        const previousBestMs = save.chapter(id).bestTimeMs;
        if (outcome.result) {
          const toRecord = clearTimeToRecord(outcome.result, outcome.elapsedMs, chapter.game, opts.auto);
          if (toRecord !== null) save.recordClear(id, toRecord, outcome.result.turns);
        }
        if (!opts.skipCutscenes) await this.playCutscene(chapter, 'post');
        if (!opts.skipResults) await this.showResults(chapter, outcome, previousBestMs);
        this.step = 'idle';
        return outcome;
      }

      if (outcome.outcome === 'defeat') {
        // The defeat panel owns the retry decision: `RETRY` re-enters the loop
        // (through the prep menu when there is one), `CHAPTER SELECT` gives up
        // and hands the outcome back to the caller. An automated run never
        // sees the panel (`skipResults`), so it keeps the old behaviour.
        const choice = opts.skipResults ? 'continue' : await this.showResults(chapter, outcome);
        if (choice === 'retry' || (choice === 'continue' && !opts.skipPrep)) continue;
      }

      this.step = 'idle';
      return outcome;
    }
  }

  private async playCutscene(chapter: Chapter, phase: 'pre' | 'post'): Promise<void> {
    const script = phase === 'pre' ? chapter.scriptsRef?.pre : chapter.scriptsRef?.post;
    if (!script?.length) return;
    this.step = `cutscene:${phase}`;
    const track = phase === 'pre' ? chapter.music.scene : chapter.music.post;
    void audio.playMusic(track, { fade: 1.4 }).catch(() => {
      /* stand-in tracks only */
    });
    const screen =
      factories.cutscene?.({ chapter, script, phase }) ??
      new StubCutscene({ chapter, script, phase });
    await this.app.replace(screen);
    await screen.done;
  }

  private async showResults(
    chapter: Chapter,
    outcome: BattleScreenResult,
    previousBestMs?: number | null,
  ): Promise<ResultsChoice> {
    this.step = 'results';
    // Chapter 4's results screen comes up silent: no pose, no fanfare.
    const silent = chapter.music.victory === undefined;
    if (!silent && outcome.outcome === 'victory' && chapter.music.victory) {
      void audio.playMusic(chapter.music.victory, { fade: 0.4 }).catch(() => {});
    }
    let choice: ResultsChoice = 'continue';
    const opts: ResultsScreenOptions = {
      chapter,
      result: outcome.result,
      outcome: outcome.outcome,
      silent,
      elapsedMs: outcome.elapsedMs,
      ...(previousBestMs !== undefined ? { previousBestMs } : {}),
      onChoice: (picked) => {
        choice = picked;
      },
    };
    const screen = factories.results?.(opts) ?? new StubResults(opts);
    await this.app.replace(screen);
    await screen.done;
    return choice;
  }
}
