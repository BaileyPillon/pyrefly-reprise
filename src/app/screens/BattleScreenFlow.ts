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
import { CHAPTERS, getChapter } from '../../data/encounters.ts';
import type { StoryScript } from '../../story/dsl.ts';
import { audio } from '../../audio/index.ts';
import { BattleScreen, type BattleScreenOptions, type BattleScreenResult } from './BattleScreen.ts';
import { PartyPrepScreen } from './PartyPrepScreen.ts';
// Type-only: erased at build time, so this adds no runtime edge to the screen.
import type { ResultsChoice } from './ResultsScreen.ts';
import type { AutoStrategy } from '../../engine/BattlePresenter.ts';
import type { PlaybackSpeed } from '../../engine/BattlePresenterPorts.ts';
import { StubChapterSelect, StubCutscene, StubResults } from './BattleScreenFlowStubs.ts';
import { clearTimeMs } from '../../ui/common/resultsMath.ts';
import { playBattleSwirl, playResultsWipe } from '../../ui/common/transitions/index.ts';

/** A screen the flow can await. */
export interface FlowScreen<T> extends Screen {
  readonly done: Promise<T>;
}

export interface CutsceneScreenOptions {
  chapter: Chapter;
  script: StoryScript;
  phase: 'pre' | 'post';
  skip?: boolean;
  /**
   * Index of the first step to play — a `resumeAt` handed back from a previous
   * run of the same script.
   *
   * Every `post` script puts its `results()` marker a few steps in and then
   * keeps going: 28 further lines after Seymour's, 20 after Yunalesca's, 18
   * after Braska's Final Aeon's, 11 after Vegnagun's. The runner stopped at the
   * marker and the screen was thrown away, so **none of those lines had ever
   * played** (critic round 02 #04). The flow now runs post → results →
   * post-from-`resumeAt`.
   */
  resumeFrom?: number;
  /**
   * Called when the script stops at its `results()` marker. `resumeAt` is the
   * step index to hand back as {@link resumeFrom}.
   */
  onResultsMarker?: (info: { silent: boolean; resumeAt: number }) => void;
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
  /**
   * The battle itself.
   *
   * Nothing in the shipped game registers this — `runChapter` builds a real
   * {@link BattleScreen} — but it is what lets `tests/unit/flow-*.test.ts`
   * drive the whole Title → … → Results sequence without a renderer, which is
   * how the post-battle scenes and the end of an arc are now proven (critic
   * round 02 #01, #04, #32).
   */
  battle: (opts: BattleScreenOptions) => FlowScreen<BattleScreenResult>;
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

/** Drop every registered factory. Tests only; nothing in the game calls it. */
export function resetFlowScreens(): void {
  for (const key of Object.keys(factories)) delete (factories as Record<string, unknown>)[key];
}

/**
 * The last chapter of each game's arc.
 *
 * Chapter 3 ends the FFX story (Yu Yevon, then Auron's sending and Tidus
 * going) and Chapter 5 ends the FFX-2 one. `BattleScreenFlow` needs to know
 * because the flow used to be a bare `for(;;)` with no notion of having
 * finished anything (critic round 02 #32).
 */
export const ARC_FINALE: Readonly<Record<GameId, ChapterId>> = {
  ffx: 'braskas-final-aeon',
  ffx2: 'ffx2-vegnagun-shuyin',
};

/** True once every chapter of `game` is recorded as cleared. */
export function arcCleared(game: GameId, cleared: (id: ChapterId) => boolean): boolean {
  return CHAPTERS.filter((c) => c.game === game).every((c) => cleared(c.id));
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

  /**
   * The screen this flow last put up.
   *
   * The flow is a long `await` chain and it is not the only thing that
   * navigates: the pause menu's CHAPTER SELECT and QUIT TO TITLE both call
   * `App.goto` from *under* a flow step, and `App.replace` pops the stack
   * synchronously before it awaits. Two overlapping `replace` calls therefore
   * leave two screen roots in `#ui` at once — which is what the critic
   * photographed as "two hint strings overlapping and illegible" (round 02
   * #36): a chapter-select strip and a cutscene strip, both `position:absolute;
   * bottom:22px`, on top of each other.
   *
   * So every flow navigation goes through {@link show}, which refuses to stack
   * a screen on top of one the flow did not put there.
   */
  private owned: Screen | null = null;

  /** True when the flow stood down because something else navigated. */
  private handedOver = false;

  /** Title -> chapter select -> a chapter -> back to chapter select. */
  async start(): Promise<void> {
    if (this.running) return;
    this.running = true;
    this.handedOver = false;
    try {
      for (;;) {
        const chapterId = await this.chapterSelect();
        if (this.handedOver) return;
        if (!chapterId) {
          this.step = 'title';
          await this.app.goto('title');
          return;
        }
        await this.runChapter(chapterId, {});
        if (this.handedOver) return;
        // Back to chapter select, including after the last chapter of an arc.
        // A designed ending/credits screen is a separate, owner-approved piece
        // of work (critic round 02 #32); until it exists the honest behaviour
        // is to hand the player back the board with the chapter marked cleared,
        // not to loop into another fight.
      }
    } finally {
      this.running = false;
      this.owned = null;
      this.step = 'idle';
    }
  }

  /**
   * Put a flow screen up, unless something else owns the stack.
   *
   * Returns false when the flow has been navigated out from under — the caller
   * then unwinds instead of pushing a second screen over whatever arrived.
   */
  private async show(screen: Screen): Promise<boolean> {
    if (this.owned !== null && this.app.current !== this.owned) {
      this.handedOver = true;
      this.owned = null;
      return false;
    }
    await this.app.replace(screen);
    this.owned = screen;
    return true;
  }

  /** Show chapter select and resolve with the player's pick. */
  async chapterSelect(): Promise<ChapterId | null> {
    this.step = 'chapter-select';
    void audio.playMusic('chapter-select', { fade: 1.2 }).catch(() => {
      /* the track may not be composed yet */
    });
    const screen = makeChapterSelect();
    if (!(await this.show(screen))) return null;
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
        if (!(await this.show(prep))) return null;
        if (!(await prep.done)) return null;
      }

      save.recordAttempt(id);

      // The pre-battle scene plays once; a retry goes straight back in.
      if (!opts.skipCutscenes && attempt === 0) await this.playCutscene(chapter, 'pre');
      if (this.handedOver) return null;

      this.step = 'battle';
      const battleOpts: BattleScreenOptions = {
        chapter,
        // A retry reseeds, so the same losing fight does not replay verbatim.
        seed: (opts.seed ?? 1) + attempt * 1000,
        auto: opts.auto ?? null,
        ...(opts.speed ? { speed: opts.speed } : {}),
      };
      const battle = factories.battle?.(battleOpts) ?? new BattleScreen(battleOpts);
      // FFX spins into a battle rather than cutting. The swirl holds the frame
      // covered while `replace` loads the diorama and stages the art, so the
      // unwind always reveals a finished first frame
      // (`src/ui/common/transitions/swirl.ts`).
      let swapped: Promise<boolean> = Promise.resolve(true);
      await playBattleSwirl(this.app.uiRoot, {
        instant: opts.speed === 'skip',
        onCover: () => {
          swapped = this.show(battle);
          return swapped.then(() => undefined);
        },
      });
      if (!(await swapped)) return null;
      // The real screen resolves `finished`; a registered stand-in (tests
      // only) resolves the `FlowScreen` contract's `done`. Same value.
      const outcome = await ('finished' in battle ? battle.finished : battle.done);
      attempt++;

      if (outcome.outcome === 'victory') {
        // Read the record before overwriting it, so the panel can tell whether
        // this run actually beat it.
        const previousBestMs = save.chapter(id).bestTimeMs;
        if (outcome.result) {
          const toRecord = clearTimeToRecord(outcome.result, outcome.elapsedMs, chapter.game, opts.auto);
          if (toRecord !== null) save.recordClear(id, toRecord, outcome.result.turns);
        }

        // post (up to the `results()` marker) -> results -> the rest of post.
        //
        // The marker is a few steps into every `post` script and the authored
        // scenes are *after* it, so a flow that stopped at the marker played
        // none of them (critic round 02 #04). `resumeAt` comes back from the
        // cutscene screen and goes straight back in.
        let resumeAt: number | null = null;
        if (!opts.skipCutscenes) resumeAt = await this.playCutscene(chapter, 'post');
        if (!opts.skipResults) await this.showResults(chapter, outcome, previousBestMs);
        if (!opts.skipCutscenes && resumeAt !== null) await this.playCutscene(chapter, 'post', resumeAt);
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

  /**
   * Play one authored scene. Returns the `resumeAt` index if the script
   * stopped at its `results()` marker, or `null` if it ran to the end.
   *
   * `resumeFrom` plays the remainder of a script that stopped earlier.
   */
  private async playCutscene(
    chapter: Chapter,
    phase: 'pre' | 'post',
    resumeFrom?: number,
  ): Promise<number | null> {
    const script = phase === 'pre' ? chapter.scriptsRef?.pre : chapter.scriptsRef?.post;
    if (!script?.length) return null;
    if (resumeFrom !== undefined && resumeFrom >= script.length) return null;
    this.step = `cutscene:${phase}`;
    // The bed is the script's own: every one of the ten shipped scenes opens
    // with a `music()` step of its own, so a cue forced in here was crossfaded
    // straight back out (critic round 02 #02). `chapter.music.scene` is only
    // the fallback for a script that says nothing, and the resumed half of a
    // post scene never re-cues at all — it is the same scene continuing.
    if (resumeFrom === undefined) {
      const track = phase === 'pre' ? chapter.music.scene : chapter.music.post;
      if (track && !scriptOpensWithMusic(script)) {
        void audio.playMusic(track, { fade: 1.4 }).catch(() => {
          /* stand-in tracks only */
        });
      }
    }

    let marker: number | null = null;
    const opts: CutsceneScreenOptions = {
      chapter,
      script,
      phase,
      ...(resumeFrom !== undefined ? { resumeFrom } : {}),
      onResultsMarker: ({ resumeAt }) => {
        marker = resumeAt;
      },
    };
    const screen = factories.cutscene?.(opts) ?? new StubCutscene(opts);
    if (!(await this.show(screen))) return null;
    await screen.done;
    return marker;
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
    // Spec "Motion & camera": battle -> results is the diagonal ivory wipe,
    // mirrored for FFX-2 chapters. The swap happens under the cover half.
    let swapped: Promise<boolean> = Promise.resolve(true);
    await playResultsWipe(this.app.uiRoot, chapter.game, () => {
      swapped = this.show(screen);
    });
    if (!(await swapped)) return choice;
    await screen.done;
    return choice;
  }
}

/**
 * True when a script sets its own bed before it says anything.
 *
 * "Before it says anything" is the whole test: every shipped scene opens with
 * `music(...)` in its first few steps (`music(null)` counts — a post scene
 * asking for silence is still the script deciding), so the flow's own cue only
 * applies to a script that never mentions music at all.
 */
function scriptOpensWithMusic(script: StoryScript): boolean {
  for (const step of script.slice(0, MUSIC_LOOKAHEAD)) {
    if (step.type === 'music') return true;
    if (step.type === 'say' || step.type === 'narrate' || step.type === 'choice') return false;
  }
  return false;
}

/** How far into a script to look for its own opening cue. */
const MUSIC_LOOKAHEAD = 8;
