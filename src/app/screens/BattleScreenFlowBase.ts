/**
 * The first half of `GameFlow`: its state, the navigation guard (`show`), the board, and the three story-scene steps (the demo intro, the thanks card, a chapter's scenes).
 *
 * `BattleScreenFlow.ts` was one 650-line file. Its types, its screen registry, its pure rules and the half of `GameFlow` that no test reads by text now live
 * in `BattleScreenFlowTypes.ts`, `BattleScreenFlowRegistry.ts`, `BattleScreenFlowRules.ts` and `BattleScreenFlowBase.ts`; `BattleScreenFlow.ts` re-exports all of it.
 * A pure move (ChatGPT's point 8b, 2026-10-28; both games): nothing here changed, only `private` became `protected` where the other half of the class reads it.
 */

import type { Screen } from '../Screen.ts';
import type { App } from '../App.ts';
import type { Chapter, ChapterId } from '../../data/encounters.ts';
import { audio } from '../../audio/index.ts';
import { readSetting } from '../SaveData.ts';
import { chapterSelectCue } from '../saveFrontend.ts';
import { StubCutscene } from './BattleScreenFlowStubs.ts';
import { boardWhenWarm } from './frontendWarm.ts';
import { demoThanksDue } from '../demo/demoThanks.ts'; // R62 (demo mode only, both games): the thanks card after a win
import { boothNewOn } from '../demo/boothSwitch.ts'; // r64 (item 200i): with the booth screens on, a card that ran out its time sends the flow back to the title
import { demoIntroFor } from '../demo/demoIntro.ts'; // R62 (demo mode only, FFX Chapter I): the short voiced intro
import type { CutsceneScreenOptions, RunChapterOptions } from './BattleScreenFlowTypes.ts';
import { factories, makeChapterSelect } from './BattleScreenFlowRegistry.ts';
import { scriptOpensWithMusic } from './BattleScreenFlowRules.ts';

export class GameFlowBase {
  protected readonly app: App;
  /** Set while a chapter is running, so the debug API can see where we are. */
  step: string = 'idle';
  protected running = false;
  /** The chapter the board's `pilgrim` door settled on, until the next `runChapter` takes it as the Pilgrimage's start (`armPilgrimage`). */
  protected pilgrimArmed: ChapterId | null = null;

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
  protected owned: Screen | null = null;

  /** True when the flow stood down because something else navigated. */
  protected handedOver = false;
  /** The last cutscene the flow played was hurried by the player (PR-0061: the battle after it opens hurried). */
  protected lastSceneHurried = false;
  /** r64 (item 200i, demo mode with the booth screens on): the thanks card ran out its 8 s untouched, so `start()` takes the visit back to the title instead of the picker. */
  protected demoToTitle = false;

  /**
   * Put a flow screen up, unless something else owns the stack.
   *
   * Returns false when the flow has been navigated out from under — the caller
   * then unwinds instead of pushing a second screen over whatever arrived.
   */
  protected async show(screen: Screen): Promise<boolean> {
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
    // 39.5 (Bailey, 2026-10-07; both games): B is the default, A and C are selectable (CHAPTER MUSIC in OPTIONS). An
    // unknown value plays B (`saveFrontend.ts`); a cue whose file cannot load plays B's score through its stand-in.
    void audio.playMusic(chapterSelectCue(readSetting('chapterSelectMusic')), { fade: 1.2 }).catch(() => {
      /* the track may not be composed yet */
    });
    const screen = await boardWhenWarm(this.app, makeChapterSelect); // PR-0065: no grey busts on arrival
    if (!(await this.show(screen))) return null;
    return screen.done;
  }

  /** The board's `pilgrim` door opened (`frontend/pilgrimDoor.ts`): the next `runChapter(id)` is the hidden Pilgrimage, started once. */
  armPilgrimage(id: ChapterId): void {
    this.pilgrimArmed = id;
  }

  /** R62 (demo mode only, FFX Chapter I): the short voiced intro. True when it played (a person started the run, the chapter has one, a factory is registered). */
  protected async playDemoIntro(chapter: Chapter, opts: RunChapterOptions): Promise<boolean> {
    const script = demoIntroFor(chapter.id, opts);
    const make = factories.demoIntro;
    if (!script || !make) return false;
    this.step = 'cutscene:pre';
    const screen = make({ chapter, script, phase: 'pre' });
    if (!(await this.show(screen))) return false;
    await screen.done;
    this.lastSceneHurried = (screen as { hurriedByPlayer?: boolean }).hurriedByPlayer === true;
    return true;
  }

  /** R62 (demo mode only, both games): the thanks card after a won demo fight. A no-op outside demo mode, for any other chapter, and where no card is registered. */
  protected async showDemoThanks(chapter: Chapter): Promise<void> {
    const make = factories.demoThanks;
    if (!make || !demoThanksDue(chapter.id)) return;
    this.step = 'demo-thanks';
    const screen = make({ chapter });
    if (!(await this.show(screen))) return;
    await screen.done;
    if (screen.endedBy === 'timer' && boothNewOn()) this.demoToTitle = true; // r64 (item 200i): the card ran out its 8 s with no press
  }

  /**
   * Play one authored scene. Returns the `resumeAt` index if the script
   * stopped at its `results()` marker, or `null` if it ran to the end.
   *
   * `resumeFrom` plays the remainder of a script that stopped earlier.
   */
  protected async playCutscene(
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
    this.lastSceneHurried = (screen as { hurriedByPlayer?: boolean }).hurriedByPlayer === true;
    return marker;
  }
}
