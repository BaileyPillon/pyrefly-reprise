// @vitest-environment jsdom
/**
 * RELEASE 62, PR-0504 (major, both games): a demo win reached the results screen with no music.
 *
 * Round 28 (the deep review of release 61): `?demo=1` runs a fight with `skipCutscenes` (`demoRunDefaults`), so no story scene replaces the battle screen before the results panel is asked for.
 * `BattleScreenFlow.showResults` used to start a win's cue at once, "its battle screen is gone already: the post scene replaced it"; here it was not, the swap to the panel ran `BattleScreen.exit`, and
 * that stops the music (`audio.stopMusic(0.6)`): the mixer read `playing=null` on both demo wins. Now a win whose battle screen is still up starts its cue after the swap, as a loss always did.
 *
 * Game case: both. Chapter I (FFX, `seymour-flux`) plays `victory-ffx`; Chapter IV (FFX-2, `ffx2-bahamut`) plays the quiet `pause` cue (release 61). A fight with a story scene after it
 * (everything outside demo mode) and a loss are unchanged: the win's cue is asked for under the story scene, before the swap; the loss's after it.
 *
 * The stand-in battle does what the real `BattleScreen.exit` does to the mixer (`stopMusic(0.6)`); the mixer is a model of `AudioManager`'s request id: a request made before a stop is dropped.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { App } from '../../src/app/App.ts';
import { SaveStore } from '../../src/app/SaveData.ts';
import { Screen } from '../../src/app/Screen.ts';
import { setDemoMode } from '../../src/app/demoMode.ts';
import { GameFlow, registerFlowScreens, resetFlowScreens, type CutsceneScreenOptions, type FlowScreen, type ResultsScreenOptions } from '../../src/app/screens/BattleScreenFlow.ts';
import type { BattleScreenOptions, BattleScreenResult } from '../../src/app/screens/BattleScreen.ts';
import { audio } from '../../src/audio/index.ts';
import type { BattleResult } from '../../src/battle/common/types.ts';

// ---------------------------------------------------------------------------
// The mixer (a model of AudioManager's request id) and the log of what was asked, and when
// ---------------------------------------------------------------------------

interface Ask {
  what: string;
  /** The screen on top when the call was made. */
  during: string;
}
const asks: Ask[] = [];
let playing: string | null = null;
let requested: string | null = null;
let request = 0;
/** What the mixer held when the results panel was waiting on the player (500 ticks after it came up). */
let heldAtResults: string | null | undefined;

function fakeMixer(app: () => FakeApp): void {
  vi.spyOn(audio, 'playMusic').mockImplementation((name: string) => {
    asks.push({ what: `play ${name}`, during: app().current?.name ?? 'none' });
    requested = name;
    const id = ++request;
    return Promise.resolve().then(() => {
      if (id === request) playing = name; // a request overtaken by a stop while it "decoded" is dropped
    });
  });
  vi.spyOn(audio, 'stopMusic').mockImplementation(() => {
    asks.push({ what: 'stop', during: app().current?.name ?? 'none' });
    request++;
    requested = null;
    playing = null;
  });
  vi.spyOn(audio, 'requestedMusic', 'get').mockImplementation(() => requested);
}

// ---------------------------------------------------------------------------
// Stand-in screens
// ---------------------------------------------------------------------------

function result(outcome: 'victory' | 'defeat'): BattleResult {
  return { outcome, turns: 12, elapsedTicks: 900, elapsedMs: 0, ap: 10, exp: 0, gil: 0, drops: [], overkilled: [], sphereLevelsGained: {} };
}

let fightOutcome: 'victory' | 'defeat' = 'victory';

/** Resolves `finished` as the real BattleScreen does, and stops the music on its way out, as the real `exit` does. */
class FakeBattle extends Screen {
  readonly name = 'battle';
  readonly finished: Promise<BattleScreenResult>;
  constructor(opts: BattleScreenOptions) {
    super();
    this.finished = Promise.resolve({ chapterId: opts.chapter.id, outcome: fightOutcome, result: result(fightOutcome), elapsedMs: 120_000, links: 1, preview: false });
  }
  override exit(): void {
    audio.stopMusic(0.6); // BattleScreen.exit
  }
}

/** A story scene: `done` (not `finished`); it plays to its end at once. Its exit does not touch the music (a story scene's own music steps do). */
class FakeCutscene extends Screen implements FlowScreen<void> {
  readonly name = 'cutscene';
  readonly done = Promise.resolve();
  constructor(readonly opts: CutsceneScreenOptions) {
    super();
  }
}

/** The panel waits a few ticks for the player, then records what the mixer held. */
class FakeResults extends Screen implements FlowScreen<void> {
  readonly name = 'results';
  readonly done: Promise<void>;
  private release!: () => void;
  constructor(readonly opts: ResultsScreenOptions) {
    super();
    this.done = new Promise<void>((resolve) => (this.release = resolve));
  }
  /** The panel is up (the wipe's swap has run): the player takes a moment. */
  override enter(): void {
    setTimeout(() => {
      heldAtResults = playing;
      this.release();
    }, 20);
  }
}

class FakeApp {
  readonly uiRoot: HTMLElement;
  readonly save = new SaveStore();
  readonly flow: GameFlow;
  current: Screen | null = null;
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
    this.uiRoot.appendChild(screen.root);
    this.current = screen;
    await screen.enter();
  }
  async goto(): Promise<boolean> {
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

beforeEach(() => {
  window.history.replaceState(null, '', '/?pack=off'); // r64 (item 200b): the conference pack (the audio pass's results cues, the pro defeat card) is the default now; this file pins release 62's flow, which `?pack=off` keeps
  asks.length = 0;
  playing = requested = null;
  request = 0;
  heldAtResults = undefined;
  fightOutcome = 'victory';
  document.body.innerHTML = '';
  resetFlowScreens();
  registerFlowScreens({
    battle: (opts) => new FakeBattle(opts) as never,
    cutscene: (opts) => new FakeCutscene(opts),
    results: (opts) => new FakeResults(opts),
  });
  app = new FakeApp();
  fakeMixer(() => app);
});

afterEach(() => {
  vi.restoreAllMocks();
  resetFlowScreens();
  setDemoMode(null);
  window.history.replaceState(null, '', '/');
});

const plays = (): Ask[] => asks.filter((a) => a.what.startsWith('play '));

describe('a demo win (no story scene after it)', () => {
  it('Chapter I (FFX): the panel comes up with victory-ffx sounding, asked for after the battle screen went', async () => {
    setDemoMode(true);
    await app.flow.runChapter('seymour-flux', { seed: 7 });
    expect(heldAtResults).toBe('victory-ffx');
    expect(plays().map((a) => a.what)).toEqual(['play victory-ffx']);
    expect(plays()[0]!.during).toBe('results'); // after the swap: the battle screen's exit (the `stop`) came first
    expect(asks.map((a) => a.what)).toEqual(['stop', 'play victory-ffx']);
  });

  it('Chapter IV (FFX-2): the panel comes up with the quiet `pause` cue sounding', async () => {
    setDemoMode(true);
    await app.flow.runChapter('ffx2-bahamut', { seed: 56 });
    expect(heldAtResults).toBe('pause');
    expect(asks.map((a) => a.what)).toEqual(['stop', 'play pause']);
    expect(plays()[0]!.during).toBe('results');
  });

  it('skipCutscenes outside demo mode is the same case (the flow decides by the screen on top, not by the mode)', async () => {
    await app.flow.runChapter('seymour-flux', { seed: 7, skipPrep: true, skipCutscenes: true });
    expect(heldAtResults).toBe('victory-ffx');
  });
});

describe('everything else is unchanged', () => {
  it('a win with a story scene after it asks for the cue under the scene, before the swap (the scene replaced the battle screen)', async () => {
    await app.flow.runChapter('seymour-flux', { seed: 7, skipPrep: true });
    expect(plays().map((a) => a.what)).toEqual(['play victory-ffx']);
    expect(plays()[0]!.during).toBe('cutscene');
    expect(heldAtResults).toBe('victory-ffx');
  }, 60_000); // a whole Chapter I fight through the flow: about 1.5 s alone, 27 s in a full run under load (2026-10-30), which timed it out at 15 s and left its fight running into the next test

  it('Chapter IV with its story scene: the quiet cue, under the scene', async () => {
    await app.flow.runChapter('ffx2-bahamut', { seed: 56, skipPrep: true });
    expect(plays()[0]).toEqual({ what: 'play pause', during: 'cutscene' });
    expect(heldAtResults).toBe('pause');
  }, 60_000);

  it('a loss asks for its cue after the swap, in demo mode or not (as before)', async () => {
    for (const demo of [true, false]) {
      asks.length = 0;
      playing = requested = null;
      heldAtResults = undefined;
      fightOutcome = 'defeat';
      setDemoMode(demo);
      await app.flow.runChapter('seymour-flux', { seed: 7, skipPrep: true, skipCutscenes: true });
      expect(plays().map((a) => a.what), `demo ${demo}`).toEqual(['play defeat-ffx']);
      expect(plays()[0]!.during, `demo ${demo}`).toBe('results');
    }
  });

  it('a FFX-2 loss plays the FFX-2 defeat cue', async () => {
    fightOutcome = 'defeat';
    setDemoMode(true);
    await app.flow.runChapter('ffx2-bahamut', { seed: 56 });
    expect(plays().map((a) => a.what)).toEqual(['play defeat-ffx2']);
  });
});
