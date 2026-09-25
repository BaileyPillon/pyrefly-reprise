// @vitest-environment jsdom
/**
 * The whole chapter flow, without a renderer.
 *
 * Critic round 02 #04: *"Every post-battle scene in Chapters 1, 2 and 3 plays
 * zero lines; Chapter 5 loses its coda."* The `post` scripts put their
 * `results()` marker a few steps in and then keep going — Seymour's has 28
 * further lines, Yunalesca's 20, Braska's Final Aeon's 18, Vegnagun's 11 — and
 * `CutsceneRunner.run` stopped at the marker and was thrown away. The flow now
 * plays post → results → post-from-`resumeAt`, and this counts the lines each
 * chapter actually delivers against the number its script authors.
 *
 * Also covers #32: clearing the last chapter of an arc has to come back to
 * chapter select rather than looping into another fight.
 *
 * `FlowScreenFactories.battle` is what makes this possible — the flow builds a
 * real `BattleScreen` unless something registers a stand-in, and nothing in the
 * shipped game does.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import type { App } from '../../src/app/App.ts';
import { SaveStore } from '../../src/app/SaveData.ts';
import { Screen } from '../../src/app/Screen.ts';
import {
  ARC_FINALE,
  arcCleared,
  GameFlow,
  registerFlowScreens,
  resetFlowScreens,
  type CutsceneScreenOptions,
  type FlowScreen,
  type ResultsScreenOptions,
} from '../../src/app/screens/BattleScreenFlow.ts';
import type { BattleScreenOptions, BattleScreenResult } from '../../src/app/screens/BattleScreen.ts';
import { CHAPTERS, type Chapter, type ChapterId } from '../../src/data/encounters.ts';
import type { BattleResult } from '../../src/battle/common/types.ts';
import type { StoryScript, Step } from '../../src/story/dsl.ts';

// ---------------------------------------------------------------------------
// Counting what a script authors
// ---------------------------------------------------------------------------

/** Spoken steps, following `parallel` and both `ifFlag` branches' `then`. */
function spokenLines(steps: readonly Step[]): number {
  let n = 0;
  for (const step of steps) {
    if (step.type === 'say' || step.type === 'narrate') n++;
    else if (step.type === 'parallel') n += spokenLines(step.steps);
    else if (step.type === 'ifFlag') n += spokenLines(step.then);
  }
  return n;
}

/** Index of the script's top-level `results()` marker. */
function markerIndex(script: StoryScript): number {
  return script.findIndex((s) => s.type === 'results');
}

// ---------------------------------------------------------------------------
// Stand-in screens
// ---------------------------------------------------------------------------

const played: string[] = [];
let linesDelivered = 0;

class FakeCutscene extends Screen implements FlowScreen<void> {
  readonly name = 'cutscene';
  readonly done: Promise<void>;
  private resolve!: () => void;

  constructor(private readonly opts: CutsceneScreenOptions) {
    super();
    this.done = new Promise<void>((r) => {
      this.resolve = r;
    });
  }

  override enter(): void {
    // Exactly what `CutsceneRunner` does with `from` and the marker: play from
    // `resumeFrom`, stop at `results()`, report where to pick up.
    const from = this.opts.resumeFrom ?? 0;
    const at = this.opts.script.findIndex((s, i) => i >= from && s.type === 'results');
    const until = at < 0 ? this.opts.script.length : at;
    linesDelivered += spokenLines(this.opts.script.slice(from, until));
    played.push(`${this.opts.phase}${from > 0 ? `@${from}` : ''}`);
    if (at >= 0) {
      const step = this.opts.script[at];
      this.opts.onResultsMarker?.({
        silent: step?.type === 'results' ? (step.silent ?? false) : false,
        resumeAt: at + 1,
      });
    }
    this.resolve();
  }

  override exit(): void {
    this.resolve();
  }
}

class FakeResults extends Screen implements FlowScreen<void> {
  readonly name = 'results';
  readonly done = Promise.resolve();
  constructor(readonly opts: ResultsScreenOptions) {
    super();
  }
  override enter(): void {
    played.push('results');
  }
}

function victoryResult(): BattleResult {
  return {
    outcome: 'victory',
    turns: 12,
    elapsedTicks: 900,
    elapsedMs: 0,
    ap: 10,
    exp: 0,
    gil: 0,
    drops: [],
    overkilled: [],
    sphereLevelsGained: {},
  };
}

class FakeBattle extends Screen implements FlowScreen<BattleScreenResult> {
  readonly name = 'battle';
  readonly done: Promise<BattleScreenResult>;
  constructor(opts: BattleScreenOptions) {
    super();
    this.done = Promise.resolve({
      chapterId: opts.chapter.id,
      outcome: 'victory' as const,
      result: victoryResult(),
      elapsedMs: 120_000,
      links: 1,
      preview: false,
    });
  }
  override enter(): void {
    played.push('battle');
  }
}

/** Party prep that says "go" the moment it is shown. */
class FakePrep extends Screen implements FlowScreen<boolean> {
  readonly name = 'party-prep';
  readonly done = Promise.resolve(true);
  override enter(): void {
    played.push('party-prep');
  }
}

/** Chapter select that answers with a queued list of picks, then backs out. */
function chapterSelectAnswering(picks: ChapterId[]): () => FlowScreen<ChapterId | null> {
  const queue = [...picks];
  return () => {
    const next = queue.shift() ?? null;
    return new (class extends Screen implements FlowScreen<ChapterId | null> {
      readonly name = 'chapter-select';
      readonly done = Promise.resolve(next);
      override enter(): void {
        played.push('chapter-select');
      }
    })();
  };
}

// ---------------------------------------------------------------------------

/**
 * Just enough `App` for `GameFlow`.
 *
 * The real one builds a `WebGLRenderer` in its constructor, which jsdom cannot
 * give it. `GameFlow` only ever touches the screen stack, the save store and
 * `uiRoot`, so this is the whole of its surface — and keeping it this small is
 * itself a check that the flow has not quietly grown a dependency on the
 * renderer.
 */
class FakeApp {
  readonly uiRoot: HTMLElement;
  readonly save = new SaveStore();
  readonly flow: GameFlow;
  current: Screen | null = null;
  readonly went: string[] = [];

  constructor() {
    this.uiRoot = document.createElement('div');
    document.body.appendChild(this.uiRoot);
    this.flow = new GameFlow(this as unknown as App);
  }

  get overlayActive(): boolean {
    return false;
  }

  async replace(screen: Screen): Promise<void> {
    const previous = this.current;
    this.current = null;
    if (previous) {
      await previous.exit();
      previous.root?.remove();
    }
    screen.app = this as unknown as App;
    screen.root = document.createElement('div');
    screen.root.dataset['screen'] = screen.name;
    this.uiRoot.appendChild(screen.root);
    this.current = screen;
    await screen.enter();
  }

  async goto(name: string): Promise<boolean> {
    this.went.push(name);
    return true;
  }

  fade(): Promise<void> {
    return Promise.resolve();
  }

  nextFrame(): Promise<void> {
    return Promise.resolve();
  }
}

let app: FakeApp;

function makeApp(): FakeApp {
  document.body.innerHTML = '';
  return new FakeApp();
}

beforeEach(() => {
  played.length = 0;
  linesDelivered = 0;
  resetFlowScreens();
  registerFlowScreens({
    cutscene: (opts) => new FakeCutscene(opts),
    results: (opts) => new FakeResults(opts),
    battle: (opts) => new FakeBattle(opts),
  });
  app = makeApp();
});

afterEach(() => {
  resetFlowScreens();
});

/** Chapters whose post script authors every line before results(). */
const ENDS_ON_RESULTS: ReadonlySet<string> = new Set(['yojimbo-cavern']);

describe('the post-battle scenes play — critic round 02 #04', () => {
  it.each(CHAPTERS.map((c) => [c.id, c] as const))(
    '%s delivers every line its post script authors',
    async (_id, chapter: Chapter) => {
      await app.flow.runChapter(chapter.id, { skipPrep: true, seed: 1 });

      const post = chapter.scriptsRef.post;
      const marker = markerIndex(post);
      expect(marker, `${chapter.id}'s post script has no results() marker`).toBeGreaterThanOrEqual(0);

      const authoredBefore = spokenLines(post.slice(0, marker));
      const authoredAfter = spokenLines(post.slice(marker + 1));
      // Chapter IX's post scene ends on results(): the story draft
      // (docs/plans/yojimbo-story-draft.md) closes on Lulu's last line before
      // the tally, so there is nothing after it to deliver.
      if (!ENDS_ON_RESULTS.has(chapter.id)) {
        expect(authoredAfter, `${chapter.id} authors no lines after results()`).toBeGreaterThan(0);
      }

      // Both halves, and only those: `pre` is skipped by `skipCutscenes`? No —
      // it runs too, so its lines are in the total as well.
      const pre = spokenLines(chapter.scriptsRef.pre);
      expect(linesDelivered).toBe(pre + authoredBefore + authoredAfter);
    },
  );

  it('runs post, then results, then the rest of post — in that order', async () => {
    await app.flow.runChapter('seymour-flux', { skipPrep: true, seed: 1 });
    expect(played).toEqual(['pre', 'battle', 'post', 'results', expect.stringMatching(/^post@\d+$/)]);
  });

  it("keeps Chapter 5's coda, which is 11 lines past the marker", async () => {
    const ch5 = CHAPTERS[4]!;
    await app.flow.runChapter(ch5.id, { skipPrep: true, seed: 1 });
    const marker = markerIndex(ch5.scriptsRef.post);
    expect(spokenLines(ch5.scriptsRef.post.slice(marker + 1))).toBeGreaterThan(0);
    expect(played.filter((p) => p.startsWith('post')).length).toBe(2);
  });

  it('plays no cutscene at all when the caller skips them', async () => {
    await app.flow.runChapter('yunalesca', { skipPrep: true, skipCutscenes: true, seed: 1 });
    expect(played).toEqual(['battle', 'results']);
    expect(linesDelivered).toBe(0);
  });

  it('still shows results when the caller skips cutscenes only', async () => {
    await app.flow.runChapter('ffx2-bahamut', { skipPrep: true, skipCutscenes: true, seed: 1 });
    expect(played).toContain('results');
  });
});

describe('two screens are never on screen at once — critic round 02 #36', () => {
  /**
   * The critic photographed a cutscene frame carrying
   * `LEFT/RIGHTENTERADVANCETER ESCMENU ESC BACK` — a chapter-select hint strip
   * and a cutscene hint strip, both `position:absolute; bottom:22px`, drawn on
   * top of each other. Two strips means two screen roots, and two screen roots
   * means two `App.replace` calls overlapped: `replace` pops the stack
   * synchronously and *then* awaits, so a `goto` fired from under a flow step
   * (the pause menu's CHAPTER SELECT and QUIT TO TITLE both do exactly that)
   * leaves the flow free to push a second screen over it.
   *
   * `GameFlow.show` is the guard. These check both halves: the flow stands down
   * when it no longer owns the stack, and the DOM never holds two roots.
   */
  class Intruder extends Screen {
    readonly name = 'intruder';
  }

  it('stands down instead of pushing a screen over one it did not put there', async () => {
    const run = app.flow.runChapter('seymour-flux', { skipPrep: true, seed: 1 });
    // Something else navigates while the flow is mid-step.
    await app.replace(new Intruder());
    const outcome = await run;
    expect(outcome).toBeNull();
    expect(app.current?.name).toBe('intruder');
  });

  it('leaves exactly one screen root in the ui root at every step', async () => {
    // Only screen roots: the swirl and the results wipe are transition panels
    // that live in the same parent and remove themselves.
    const count = (): number => app.uiRoot.querySelectorAll('[data-screen]').length;
    const roots: number[] = [];
    const seen = new MutationObserver(() => roots.push(count()));
    seen.observe(app.uiRoot, { childList: true });
    await app.flow.runChapter('yunalesca', { skipPrep: true, seed: 1 });
    seen.disconnect();
    expect(Math.max(...roots, count())).toBeLessThanOrEqual(1);
  });
});

describe('the end of an arc — critic round 02 #32', () => {
  it('names one finale per game, and both are real chapters', () => {
    for (const [game, id] of Object.entries(ARC_FINALE)) {
      const chapter = CHAPTERS.find((c) => c.id === id);
      expect(chapter, `${id} is not a chapter`).toBeDefined();
      expect(chapter!.game).toBe(game);
      // The finale is the last chapter of its game **by story order**, which
      // display order (`Chapter.number`) usually but not always matches.
      // Chapter 6 (Leblanc) is display-order last for FFX-2 — it landed after
      // Vegnagun was already shipped — but it is narratively FFX-2's own
      // Chapter 2 (`docs/plans/chapter-leblanc-review.md` Q1, `docs/target/
      // decisions.json` D-018), earlier in the story than Vegnagun's "free
      // Shuyin" ending. So `ARC_FINALE.ffx2` correctly stays
      // `ffx2-vegnagun-shuyin`, the second-to-last by display order but the
      // real story finale — the exception this comment documents rather than
      // lets the assertion below quietly miss.
      // Chapter 7 (Macalania) is the same case for FFX: display-order last,
      // but it comes before Seymour Flux in the story (research
      // ffx-seymour-anima-macalania.md §9.7 beat 11: he is sent back unsent),
      // so `ARC_FINALE.ffx` stays `braskas-final-aeon`.
      // Chapter 8 (Evrae) is the same again: the approach to Bevelle, before
      // the wedding its own post scene ends on (research ffx-evrae-airship.md
      // §12.5 beat 11), so it too is story-earlier than the FFX finale.
      // Chapter 9 (Yojimbo) too: the Cavern of the Stolen Fayth comes before
      // Mt. Gagazet and Zanarkand (research ffx-yojimbo.md §1.1, §1.2 item 5 and §5 [verified: 3 sources]; its party is
      // the Gagazet build). Chapter 13 (Trema): an optional Chapter 5 superboss, "not a story boss" (ffx2-trema.md §1).
      const storyEarlierThanFinale = new Set(['ffx2-leblanc', 'seymour-anima-macalania', 'evrae-airship', 'yojimbo-cavern', 'ffx2-trema']);
      const ofGame = CHAPTERS.filter((c) => c.game === game && !storyEarlierThanFinale.has(c.id));
      const lastByDisplayOrder = ofGame[ofGame.length - 1]!.id;
      expect(lastByDisplayOrder).toBe(id);
    }
  });

  it('arcCleared only answers true once every chapter of that game is cleared', () => {
    const none = () => false;
    expect(arcCleared('ffx', none)).toBe(false);
    expect(arcCleared('ffx', (id) => id !== 'braskas-final-aeon')).toBe(false);
    expect(arcCleared('ffx', () => true)).toBe(true);
    expect(arcCleared('ffx2', (id) => CHAPTERS.find((c) => c.id === id)?.game === 'ffx2')).toBe(true);
  });

  it('returns to chapter select after the last chapter of an arc, and stops when asked', async () => {
    resetFlowScreens();
    registerFlowScreens({
      cutscene: (opts) => new FakeCutscene(opts),
      results: (opts) => new FakeResults(opts),
      battle: (opts) => new FakeBattle(opts),
      partyPrep: () => new FakePrep(),
      // Clear the FFX finale, then back out of the board.
      chapterSelect: chapterSelectAnswering(['braskas-final-aeon']),
    });
    app = makeApp();
    played.length = 0;

    await app.flow.start();

    // Board -> the finale -> board again -> the player backs out to the title.
    expect(played.filter((p) => p === 'chapter-select').length).toBe(2);
    expect(played).toContain('battle');
    expect(played).toContain('results');
    expect(app.flow.step).toBe('idle');
  });
});
