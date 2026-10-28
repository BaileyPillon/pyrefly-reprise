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

import type { Chapter, ChapterId } from '../../data/encounters.ts';
import { getChapter } from '../../data/encounters.ts';
import { audio } from '../../audio/index.ts';
import { BattleScreen, type BattleScreenOptions, type BattleScreenResult } from './BattleScreen.ts';
import { PartyPrepScreen } from './PartyPrepScreen.ts';
import type { ResultsChoice } from './ResultsScreen.ts';
import { StubResults } from './BattleScreenFlowStubs.ts';
import { resultsCueFor, resultsScreenSilent, startResultsMusic, type ResultsMusicHandle } from './resultsMusic.ts'; // the win's and the loss's cue (music batch 2)
import { noteChapterLost } from '../../ui/common/objectiveReveal.ts';
import { runBriefingIfDue } from './raiseBriefing.ts';
import { sfxChapter } from '../sfxGame.ts';
import { voiceChapter } from '../voiceChapter.ts';
import { musicChapter } from '../chapterMusicWarm.ts';
import { preloadBattle } from './battlePreload.ts';
import { holdIdleLane } from '../imageWarm.ts';
import { entryCardWait } from './entryCard.ts';
import { entrySituationFor } from './entrySituation.ts';
import { playBattleEntry } from '../../ui/common/transitions/entry.ts';
import { playResultsWipe } from '../../ui/common/transitions/index.ts';
import { stagingPieceOnFor } from '../../engine/pro/staging/StagingSwitch.ts';
import { ProDefeatScreen } from './ProDefeatScreen.ts'; // lane "pro-staging": the defeat card that keeps the scene
import { carryAfterDefeat } from './BattleChainCheckpoint.ts';
import { closeRun, openRun, runWithRestarts } from './pause/restartCarry.ts';
import { demoDefeatPanel, demoQuickRetry, noteDemoDefeatChoice, publicQuickRetry, retryTheme, retryThemeSwitchedOff, takeDemoNextFight } from '../demo/demoDefeat.ts'; // R62 (demo mode only, both games): TRY AGAIN / OTHER FIGHT on a lost demo fight
import { experimentPlayIn, ff7Results, runExperiment } from './BattleScreenExperiment.ts'; // a hidden experiment (FF7) never touches the save
import { drawRunSeed } from '../runSeed.ts';
import { warmBattleStage } from '../../engine/StageWarm.ts'; // R61 (PR-0481): a first battle's once-per-page costs are paid behind the party prep
import { attemptSeed } from '../demoMode.ts'; // release 60: `?demo=1`, the conference demo's seeds
import { experimentProgress, type FlowProgress } from '../experiments/experimentRecords.ts';
import { beginExperimentRun } from '../experiments/experimentRun.ts';
import { retryWarmSwitchedOff, stopDemoWarm, warmDemoFights } from '../demo/demoWarm.ts'; // release 62 (PR-0481): the demo's stage warm stands down once a fight is picked
import { demoRunDefaults } from '../demo/demoFlow.ts'; // R61 (conference demo, `?demo=1`): a demo fight goes straight in, without party prep or story scenes
import type { ResultsScreenOptions, RunChapterOptions } from './BattleScreenFlowTypes.ts';
import { factories } from './BattleScreenFlowRegistry.ts';
import { clearTimeToRecord } from './BattleScreenFlowRules.ts';
import { GameFlowBase } from './BattleScreenFlowBase.ts';

// Split out by a pure move (2026-10-28): every name that used to be exported from this file still is.
export type { CutsceneScreenOptions, FlowScreen, FlowScreenFactories, ResultsScreenOptions, RunChapterOptions } from './BattleScreenFlowTypes.ts';
export { flowReport, makeChapterSelect, registerFlowScreens, resetFlowScreens } from './BattleScreenFlowRegistry.ts';
export { ARC_FINALE, arcCleared, clearTimeToRecord } from './BattleScreenFlowRules.ts';

/** Drives the screen sequence. One instance lives on {@link App}. */
export class GameFlow extends GameFlowBase {
  /** Title -> chapter select -> a chapter -> back to chapter select. */
  async start(): Promise<void> {
    if (this.running) return;
    this.running = true;
    this.handedOver = false;
    try {
      // Bailey's approved onboarding, option C (2026-09-20): twenty skippable
      // seconds in Auron's voice **after the title and before the board**, on a
      // first launch only. `runBriefingIfDue` is a no-op once it has been seen
      // or dismissed, and with `?coach=off` — so no capture harness, e2e spec
      // or returning player ever meets it. Game case: both.
      await runBriefingIfDue(this.app);
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
        if (this.demoToTitle) {
          // r64 (item 200i, both games): nobody pressed anything on the end card, so the visitor has gone: the title (and its attract card after a minute), not the picker.
          this.demoToTitle = false;
          this.step = 'title';
          await this.app.goto('title');
          return;
        }
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
   * One chapter end to end. Returns how the last attempt ended, or `null` if
   * the player backed out of prep without fighting.
   *
   * A defeat loops back to the prep menu rather than throwing the player out
   * to chapter select — that is the retry, and backing out of prep is the
   * quit. An automated run (`skipPrep`, which the debug API defaults to) has
   * no menu to return to, so it reports the defeat and stops.
   */
  async runChapter(id: ChapterId, opts: RunChapterOptions): Promise<BattleScreenResult | null> {
    this.demoToTitle = false;
    opts = demoRunDefaults(id, opts); // R61 (demo mode only, both games): a demo fight skips party prep and the story scenes unless the caller says otherwise
    const armed = this.pilgrimArmed;
    this.pilgrimArmed = null; // spent by whatever chapter runs next, so a door that opened and never ran cannot hijack a later one
    if (armed === id && opts.pilgrim === undefined) {
      const { runPilgrimage } = await import('../pilgrim/PilgrimFlow.ts'); // its screens and styles load only now: a player who never types the word never fetches them
      return runPilgrimage({ app: this.app, show: (s) => this.show(s), setStep: (s) => void (this.step = s), fight: (cid, o) => this.runChapter(cid, o), away: () => this.handedOver, claim: () => { if (!this.running) [this.owned, this.handedOver] = [null, false]; } });
    }
    stopDemoWarm(id); // release 62 (PR-0481, demo mode): the stage warm behind the picker takes no further step; the fight picked has the main thread (post-fight-start: and a stage step of the other fight still in flight lets go at its next boundary)
    warmBattleStage(); // the browser's staged-upload verdict (a second WebGL2 context, 0.7 s) and the spell atlas (0.13 s), once per page, while the party prep is what is on screen
    const release = musicChapter(id, sfxChapter(id, voiceChapter(id, holdIdleLane()))); // r29 PR-0221/PR-0240: the board's strips wait until the flow is back on the board; D-302: the chapter's SFX voice; PR-0373: its scene, boss and victory cues are fetched behind prep; the recorded voice-over (FFX only)
    const endRun = getChapter(id)?.experimental ? beginExperimentRun() : (): void => undefined; // an experiment's run keeps the coach's memory off the save, whatever happens in it (CHK-025, F393-05)
    // PR-0283: RESTART ENCOUNTER replays inside this run, and r34fix-quit: QUIT TO TITLE exits it (`runWithRestarts`), one owner each.
    const ran = await runWithRestarts(this, (o) => this.playChapter(id, o), opts, () => { [this.handedOver, this.step] = [true, 'title']; return this.app.goto('title'); }).finally(() => { release(); endRun(); });
    const next = takeDemoNextFight(); // R62 (demo mode only): OTHER FIGHT on the defeat panel starts the other demo fight at once
    return next === null || this.handedOver ? ran : this.runChapter(next as ChapterId, {});
  }

  private async playChapter(id: ChapterId, opts: RunChapterOptions): Promise<BattleScreenResult | null> {
    const shipped = getChapter(id);
    const chapter = shipped && opts.pilgrim ? opts.pilgrim.chapter(shipped) : shipped; // a run fight is the shipped chapter with its boons in the party
    if (!chapter) return null;
    if (chapter.experimental && chapter.game === 'ff7') { // FF7's hidden experiment has its own flow; the FFX-2 Leblanc preview plays through this one, below
      if (!this.running) [this.owned, this.handedOver] = [null, false]; // a fresh owner, as below
      return runExperiment(chapter, { ...opts, seed: opts.seed ?? drawRunSeed() }, { show: (s) => this.show(s), setStep: (s) => void (this.step = s), makeBattle: (o) => factories.battle?.(o) ?? new BattleScreen(o), results: (c, o) => (c.game === 'ff7' ? ff7Results((s) => this.show(s), c, o) : this.showResults(c, o)), // FF7: its own results windows and Game Over (C1, G1)
        playIn: (swap, o) => experimentPlayIn(this.app.uiRoot, chapter, swap, o) }); // FF7: its own swirl of the frozen board (F1)
    }
    const save: FlowProgress = opts.pilgrim?.progress ?? (chapter.experimental ? experimentProgress : this.app.save); // an experiment keeps its attempts and clears in the experiments' store, never the save
    // FA3 = b (FFX-2 Ch. XI only): RETRY and RESTART ENCOUNTER past a Save Sphere re-enter that link.
    let { attempt, carry, opts: { seed } } = ({ opts } = openRun(this, id, opts)); // a fresh first seed (PR-0008)
    void preloadBattle(chapter, seed); // the battle's art loads behind prep and the scene (PR-0061)

    // A run started from outside {@link start}'s own loop — `main.ts` when the board
    // resolves, the debug API's `gotoChapter` — **is** the new owner of the stack,
    // and has to say so before {@link show} looks at `owned`.
    //
    // `owned` still points at the *previous* run's screen (the board `main.ts`
    // `goto`s after a chapter is not a flow screen), so the first `show` saw
    // `owned !== current`, read a fresh start as "navigated out from under
    // us" and `runChapter` answered `null`: pause -> OPTIONS -> RESTART
    // ENCOUNTER left the player on chapter select for good (the debug harness
    // restarted only because `current` happened to equal `owned`). Re-entrant
    // calls (`start` is running) keep the guard; that is its case.
    if (!this.running) {
      this.owned = null;
      this.handedOver = false;
    }

    for (;;) {
      // A checkpoint retry re-enters with the party it carried in, so there is
      // no prep menu to offer: nothing picked there could reach the fight.
      if (!opts.skipPrep && !carry.resumeAt) {
        this.step = 'party-prep';
        const prep = factories.partyPrep?.({ chapter }) ?? new PartyPrepScreen({ chapter });
        if (!(await this.show(prep))) return null;
        if (!(await prep.done)) return null;
      }

      save.recordAttempt(id);

      // The pre-battle scene plays once (a retry goes straight back in).
      let openingHurry = false;
      if (!opts.skipCutscenes && attempt === 0) {
        await this.playCutscene(chapter, 'pre');
        openingHurry = this.lastSceneHurried; // PR-0061: a player who skipped the scene gets the hurried opening
      }
      if (opts.skipCutscenes && attempt === 0 && (await this.playDemoIntro(chapter, opts))) openingHurry = this.lastSceneHurried; // R62 (demo mode only, FFX Chapter I): the demo skips the story, but not these three recorded lines
      if (demoQuickRetry(id, attempt) || publicQuickRetry(id, attempt)) openingHurry = true; // r63-play: a retried demo fight opens hurried (the card 0.7 s, no sweep); the fight itself is the same one. Release 67: so does a retried Chapter I (FFX) on the public address (`?retryopening=full` is release 66)
      if (this.handedOver) return null;

      this.step = 'battle';
      const battleOpts: BattleScreenOptions = {
        chapter,
        // A retry reseeds, so the same losing fight does not replay verbatim (demo mode: the next of the chapter's verified seeds, `demoMode.ts`).
        seed: attemptSeed(id, seed, attempt),
        auto: opts.auto ?? null,
        ...(opts.speed ? { speed: opts.speed } : {}),
        ...(carry.resumeAt ? { resumeAt: carry.resumeAt } : {}),
        ...(openingHurry ? { openingHurry } : {}),
        ...(demoQuickRetry(id, attempt) && !retryThemeSwitchedOff() ? { retryTheme: true } : {}), // r64-fixes: the retried fight's theme is asked for as its screen opens (after the lost screen's exit, which stops the music), not 2 to 4 s later when the chain starts
      };
      const battle = factories.battle?.(battleOpts) ?? new BattleScreen(battleOpts);
      // A-2: the entry by situation (FFX blur or shatter, FFX-2 shatter; the
      // Vegnagun implosion stays OFF). It holds the outgoing frame while
      // `replace` loads the diorama, so the reveal is a finished first frame.
      let swapped: Promise<boolean> = Promise.resolve(true);
      await playBattleEntry(this.app.uiRoot, {
        game: chapter.game,
        situation: entrySituationFor(attempt, opts, chapter),
        instant: opts.speed === 'skip',
        whileCovered: entryCardWait(this.app.uiRoot, chapter), // A-3: the card over the ink on a slow load
        onCover: () => {
          swapped = this.show(battle);
          return swapped.then(() => undefined);
        },
      });
      if (!(await swapped)) return null;
      // The real screen resolves `finished`; a test stand-in resolves `done`. Same value.
      const fought = await ('finished' in battle ? battle.finished : battle.done);
      attempt++;
      // A clear through a checkpoint retry is timed from the chapter's start.
      const outcome = carry.carriedMs > 0 ? { ...fought, elapsedMs: fought.elapsedMs + carry.carriedMs } : fought;

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
        if (!opts.skipResults && !opts.pilgrim) await this.showDemoThanks(chapter); // R62 (demo mode only): a won demo fight ends with the thanks card, then the picker
        // R61 (the conference demo, both games): a demo fight is run with `skipCutscenes` (`demoRunDefaults`, first line of this method), so the story after the panel is not played and the win goes back to the picker (`demo/demoBoard.ts` puts the cursor on the other fight).
        if (!opts.skipCutscenes && resumeAt !== null) await this.playCutscene(chapter, 'post', resumeAt);
        this.step = 'idle';
        return outcome;
      }

      if (opts.pilgrim && (outcome.outcome === 'defeat' || outcome.outcome === 'escape')) { this.step = 'idle'; return outcome; } // a loss ends the run: no panel, no retry, no secret-objective reveal (the Pilgrimage's run-over screen follows)
      if (outcome.outcome === 'defeat' || outcome.outcome === 'escape') {
        // A secret objective row shows from now on (Chapter IX's Doom row, objectiveReveal.ts).
        if (outcome.outcome === 'defeat') noteChapterLost(id);
        // PR-0215: a withdrawal ('escape': the FFX stalemate) gets the same panel (Bailey's pick B, D-249).
        // The defeat panel owns the retry decision: `RETRY` re-enters the loop
        // (through the prep menu when there is one), `CHAPTER SELECT` gives up
        // and hands the outcome back to the caller. An automated run never
        // sees the panel (`skipResults`), so it keeps the old behaviour.
        const choice = opts.skipResults ? 'continue' : await this.showResults(chapter, outcome, undefined, attempt);
        noteDemoDefeatChoice(id, choice); // R62 (demo mode only): a lost demo fight's OTHER FIGHT is remembered for `runChapter`
        carry = carryAfterDefeat(carry, fought);
        if (choice === 'retry' || (choice === 'continue' && !opts.skipPrep)) continue;
      }

      this.step = 'idle';
      return closeRun(this, id, { carry, attempt, opts: { ...opts, seed } }, fought, outcome);
    }
  }

  /**
   * Lane "pro-staging" (demo chapters with `?staging=pro`): a lost fight's card OVER the battle screen, which stays up under it (`App.pushOverlay`: frozen, still drawn) with the party where it fell, the light
   * dim and the caption the presenter dropped in. The same choices as the old defeat panel and the same words out (`onChoice`), so the flow after it is untouched.
   */
  private async showProDefeat(chapter: Chapter, outcome: BattleScreenResult, attempt: number): Promise<ResultsChoice> {
    const cue = resultsCueFor(chapter, outcome.outcome);
    const keepForRetry = retryTheme(chapter); // r64-fixes: a lost demo fight's own theme stays decoded under the defeat theme (a TRY AGAIN asks for it at once)
    const music: ResultsMusicHandle | null = cue?.kind === 'defeat' ? startResultsMusic(audio, cue, keepForRetry ? [keepForRetry] : undefined) : null; // the battle screen is still up: nothing stops this cue before the player chooses
    let choice: ResultsChoice = 'continue';
    const screen = new ProDefeatScreen({ game: chapter.game, turns: outcome.result?.turns, elapsedMs: outcome.elapsedMs, attempt, otherFight: demoDefeatPanel(chapter.id), onChoice: (picked) => (choice = picked) }); // backlog 58: OTHER FIGHT only where it starts the other fight (the demo path); the public address reads CHAPTER SELECT
    await this.app.pushOverlay(screen);
    if (demoDefeatPanel(chapter.id) && !retryWarmSwitchedOff()) void warmDemoFights(this.app, [chapter.id], { light: true }); // r63-play (quick retry): the fight's stage is built while the card is up, so a TRY AGAIN finds it ready
    await screen.done;
    stopDemoWarm(); // the choice is made: the warm takes no further step
    await this.app.popOverlay();
    music?.end();
    return choice;
  }

  private async showResults(
    chapter: Chapter,
    outcome: BattleScreenResult,
    previousBestMs?: number | null,
    attempt = 1,
  ): Promise<ResultsChoice> {
    this.step = 'results';
    if (outcome.outcome === 'defeat' && stagingPieceOnFor('ending', chapter.id) && this.owned !== null && 'finished' in this.owned) return this.showProDefeat(chapter, outcome, attempt); // lane "pro-staging": the card over the kept scene
    // Chapter 4's results screen comes up silent: no pose, no tally flourish. It has a quiet cue of its own since 2026-10-12, so the silence is its own rule, not the absence of a cue.
    const silent = resultsScreenSilent(chapter);
    // The music of the screen (`resultsMusic.ts`, music batch 2): a win's cue starts now, as it always did (its battle screen is gone already: the post scene replaced it). A loss's cue waits
    // for the swap below, because the battle screen's exit stops the music and would cut a cue asked for before it; it ends when the player chooses, so it never plays over a RETRY.
    // Release 62 (PR-0504, both games): the same wait for a win whose battle screen is still up when the panel is asked for, that is, when no post scene replaced it (a demo fight skips the story,
    // `demoRunDefaults`; the hidden experiment has none): its `exit` stopped the cue asked for before the swap and the panel came up in silence.
    const cue = resultsCueFor(chapter, outcome.outcome);
    const battleUp = this.owned !== null && 'finished' in this.owned; // only the battle screen resolves `finished` (a story scene or the board resolves `done`)
    let music: ResultsMusicHandle | null = cue?.kind === 'victory' && !battleUp ? startResultsMusic(audio, cue) : null;
    let choice: ResultsChoice = 'continue';
    const opts: ResultsScreenOptions = {
      chapter,
      result: outcome.result,
      outcome: outcome.outcome,
      silent,
      elapsedMs: outcome.elapsedMs,
      ...(previousBestMs !== undefined ? { previousBestMs } : {}),
      ...(outcome.withdrawLine ? { withdrawLine: outcome.withdrawLine } : {}),
      onChoice: (picked) => {
        choice = picked;
      },
    };
    const screen = factories.results?.(opts) ?? new StubResults(opts);
    // Spec "Motion & camera": battle -> results is the diagonal ivory wipe,
    // mirrored for FFX-2 chapters. The swap happens under the cover half.
    let swapped: Promise<boolean> = Promise.resolve(true);
    await playResultsWipe(this.app.uiRoot, chapter.game, () => {
      swapped = this.show(screen).then((shown) => {
        // PR-0504: a win that waited for the battle screen asks for its cue the moment that screen has gone (its exit has run), under the wipe's cover, as the early start was.
        if (shown && battleUp && cue?.kind === 'victory' && music === null) music = startResultsMusic(audio, cue);
        return shown;
      });
    }, stagingPieceOnFor('ending', chapter.id) && battleUp ? { dissolve: this.app.save?.settings?.reduceMotion === true ? 'calm' : 'soft' } : undefined); // lane "pro-staging": over the held scene a soft dissolve replaces the cream wipe
    if (!(await swapped)) return choice;
    if (cue?.kind === 'defeat') music = startResultsMusic(audio, cue);
    await screen.done;
    music?.end();
    return choice;
  }
}
