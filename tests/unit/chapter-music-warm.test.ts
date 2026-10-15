// @vitest-environment jsdom
/**
 * PR-0373 (round 25, both games, shared plumbing): which cues a confirmed chapter warms, and that the flow asks for them
 * the moment it has the chapter, before prep, the scene or the fight.
 *
 * "Only that chapter's cues, and only its own game's": the list is built from the chapter's own record (`Chapter.music`
 * and the rule that scores its first formation), so these tests pin it against that record for every chapter the build
 * can play, and against the lists of cues that belong to one game only (the same lists
 * `tests/unit/flow-encounter-chain.test.ts` uses for the fight's own cues).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { audio } from '../../src/audio/index.ts';
import { hasTrack } from '../../src/audio/index.ts';
import { chapterWarmCues, musicChapter } from '../../src/app/chapterMusicWarm.ts';
import type { App } from '../../src/app/App.ts';
import { SaveStore } from '../../src/app/SaveData.ts';
import { Screen } from '../../src/app/Screen.ts';
import { cueForGroup } from '../../src/app/screens/BattleEncounterChain.ts';
import { resultsCueFor } from '../../src/app/screens/resultsMusic.ts';
import { GameFlow, registerFlowScreens, resetFlowScreens, type CutsceneScreenOptions, type FlowScreen } from '../../src/app/screens/BattleScreenFlow.ts';
import type { BattleScreenOptions, BattleScreenResult } from '../../src/app/screens/BattleScreen.ts';
import type { BattleResult } from '../../src/battle/common/types.ts';
import { CHAPTERS, EXPERIMENT_CHAPTERS, UNLISTED_CHAPTERS, getChapter, type Chapter } from '../../src/data/encounters.ts';

const ALL: readonly Chapter[] = [...CHAPTERS, ...UNLISTED_CHAPTERS, ...EXPERIMENT_CHAPTERS];

// The two scores share no cue (docs/audio/THEMES.md); the same lists as flow-encounter-chain.test.ts.
const FFX2_ONLY = [
  'boss-ffx2-aeon', 'boss-ffx2-fallen-aeons', 'boss-trema', 'boss-vegnagun', 'boss-shuyin', 'victory-ffx2', 'ending-ffx2',
  'boss-den-of-woe', 'boss-experiment', 'scene-chateau-leblanc', 'victory-bahamut', 'defeat-ffx2', // music batch 2, 2026-10-12
];
const FFX_ONLY = [
  'boss-seymour', 'boss-yunalesca', 'boss-jecht', 'boss-yu-yevon', 'victory-ffx', 'ending-ffx', 'battle-ffx',
  'boss-seymour-natus', 'boss-isaaru', 'boss-sin-assault', 'boss-sin-countdown',
  'boss-challenge', 'boss-gui', 'boss-seymour-omnis', 'defeat-ffx', // music batch 2, 2026-10-12
];

describe('chapterWarmCues: the scene, the first fight, the victory and the defeat, in that order', () => {
  it('names the four cues of the first chapter, and the four of the fourth (its victory cue is the quiet resolve since 2026-10-12)', () => {
    expect(chapterWarmCues(getChapter('seymour-flux')!)).toEqual(['scene-gagazet', 'boss-seymour', 'victory-ffx', 'defeat-ffx']);
    expect(chapterWarmCues(getChapter('ffx2-bahamut')!)).toEqual(['scene-bevelle-underground', 'boss-bahamut', 'victory-bahamut', 'defeat-ffx2']);
  });

  it("is the scene cue first, then what scores the first formation, then the victory cue, then the defeat cue of the chapter's game", () => {
    for (const chapter of ALL) {
      const fight = cueForGroup(chapter, chapter.enemyGroupRef, 'first').track;
      const expected = [chapter.music.scene, fight, chapter.music.victory, resultsCueFor(chapter, 'defeat')?.cue].filter((c): c is string => typeof c === 'string');
      expect(chapterWarmCues(chapter), chapter.id).toEqual([...new Set(expected)]);
      if (chapter.music.scene) expect(chapterWarmCues(chapter)[0], `${chapter.id} starts with its scene bed`).toBe(chapter.music.scene);
    }
  });

  it('holds no duplicate, no silence and only composed tracks', () => {
    for (const chapter of ALL) {
      const cues = chapterWarmCues(chapter);
      expect(new Set(cues).size, `${chapter.id} repeats a cue`).toBe(cues.length);
      for (const cue of cues) expect(cue.length, chapter.id).toBeGreaterThan(0);
    }
    // Every cue of the eighteen listed chapters is a composed track (the stand-ins of the hidden ones are checked below).
    for (const chapter of CHAPTERS) for (const cue of chapterWarmCues(chapter)) expect(hasTrack(cue), `${chapter.id}: ${cue}`).toBe(true);
  });

  it('warms only cues of the chapter\'s own game: FFX warms no FFX-2 cue and FFX-2 no FFX cue', () => {
    for (const chapter of ALL) {
      if (chapter.game === 'ff7') continue;
      const forbidden = chapter.game === 'ffx' ? FFX2_ONLY : FFX_ONLY;
      for (const cue of chapterWarmCues(chapter)) expect(forbidden, `${chapter.id} would warm ${cue}`).not.toContain(cue);
    }
  });

  it('warms nothing the chapter\'s own record does not name', () => {
    for (const chapter of ALL) {
      const own = new Set<string>([chapter.music.scene, chapter.music.battle, chapter.music.phase2, chapter.music.victory, chapter.music.post, resultsCueFor(chapter, 'defeat')?.cue, ...(chapter.enemyGroupRef.musicCues ?? []).map((c) => c.track)].filter((c): c is string => typeof c === 'string'));
      for (const cue of chapterWarmCues(chapter)) expect(own.has(cue), `${chapter.id}: ${cue}`).toBe(true);
    }
  });

  it('takes the first formation\'s own cue over the chapter\'s default, as the fight does', () => {
    for (const chapter of CHAPTERS) {
      const own = chapter.enemyGroupRef.musicCues?.find((c) => c.at === 'start') ?? chapter.enemyGroupRef.musicCues?.[0];
      if (own && typeof own.track === 'string') expect(chapterWarmCues(chapter), chapter.id).toContain(own.track);
    }
  });

  it('warms the first theme only: a later part of the fight (Yu Yevon, Shuyin) is left for its part', () => {
    const jecht = chapterWarmCues(getChapter('braskas-final-aeon')!);
    expect(jecht).toContain('boss-jecht');
    expect(jecht).not.toContain('boss-yu-yevon');
    const vegnagun = chapterWarmCues(getChapter('ffx2-vegnagun-shuyin')!);
    expect(vegnagun).toContain('boss-vegnagun');
    expect(vegnagun).not.toContain('boss-shuyin');
  });
});

describe('musicChapter: the run that asks is the run that gives back', () => {
  afterEach(() => vi.restoreAllMocks());

  it('asks the mixer for the chapter\'s cues once, and the end of the run ends the hold and runs the other release', () => {
    const ended = vi.fn();
    const warm = vi.spyOn(audio, 'warmMusic').mockReturnValue(ended);
    const other = vi.fn();
    const done = musicChapter('seymour-flux', other);
    expect(warm).toHaveBeenCalledTimes(1);
    expect(warm).toHaveBeenCalledWith(['scene-gagazet', 'boss-seymour', 'victory-ffx', 'defeat-ffx']);
    expect(ended).not.toHaveBeenCalled();
    done();
    expect(ended).toHaveBeenCalledTimes(1);
    expect(other).toHaveBeenCalledTimes(1);
  });

  it('an FFX-2 chapter asks for its own cues', () => {
    const warm = vi.spyOn(audio, 'warmMusic').mockReturnValue(() => undefined);
    musicChapter('ffx2-leblanc', () => undefined)();
    expect(warm).toHaveBeenCalledWith(['scene-chateau-leblanc', 'boss-leblanc', 'victory-ffx2', 'defeat-ffx2']);
  });
});

// ------------------------------------------------------------------- the flow

const events: string[] = [];
const battles: BattleScreenOptions[] = [];

class FakeCutscene extends Screen implements FlowScreen<void> {
  readonly name = 'cutscene';
  readonly done = Promise.resolve();
  constructor(readonly opts: CutsceneScreenOptions) {
    super();
    events.push(`cutscene:${opts.phase}`);
  }
}

class FakeBattle extends Screen implements FlowScreen<BattleScreenResult> {
  readonly name = 'battle';
  readonly done: Promise<BattleScreenResult>;
  constructor(opts: BattleScreenOptions) {
    super();
    events.push('battle');
    battles.push(opts);
    const result = { outcome: 'victory', turns: 3, elapsedTicks: 1, elapsedMs: 0, ap: 0, exp: 0, gil: 0, drops: [], overkilled: [], sphereLevelsGained: {} } as unknown as BattleResult;
    this.done = Promise.resolve({ chapterId: opts.chapter.id, outcome: 'victory', result, elapsedMs: 1000, links: 1, preview: false });
  }
}

class FakePrep extends Screen implements FlowScreen<boolean> {
  readonly name = 'party-prep';
  readonly done = Promise.resolve(true);
  constructor() {
    super();
    events.push('prep');
  }
}

class Quiet extends Screen implements FlowScreen<boolean> {
  readonly name = 'results';
  readonly done = Promise.resolve(true);
}

class FakeApp {
  readonly uiRoot = document.createElement('div');
  readonly save = new SaveStore();
  readonly flow: GameFlow;
  current: Screen | null = null;
  constructor() {
    document.body.appendChild(this.uiRoot);
    this.flow = new GameFlow(this as unknown as App);
  }
  get overlayActive(): boolean {
    return false;
  }
  async replace(screen: Screen): Promise<void> {
    const previous = this.current;
    this.current = null;
    if (previous) await previous.exit();
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

describe('GameFlow.runChapter asks for the cues before prep, the scene and the fight, and gives them back at the end', () => {
  let app: FakeApp;
  beforeEach(() => {
    document.body.innerHTML = '';
    events.length = 0;
    battles.length = 0;
    resetFlowScreens();
    registerFlowScreens({ partyPrep: () => new FakePrep() as never, cutscene: (o) => new FakeCutscene(o), results: () => new Quiet() as never, battle: (o) => new FakeBattle(o) });
    app = new FakeApp();
  });
  afterEach(() => {
    resetFlowScreens();
    vi.restoreAllMocks();
  });

  it('seymour-flux (FFX): the warm is the first thing the run does, and it is released once the run is over', async () => {
    vi.spyOn(audio, 'warmMusic').mockImplementation((names) => {
      events.push(`warm:${names.join(',')}`);
      return () => events.push('release');
    });
    await app.flow.runChapter('seymour-flux', { seed: 1, skipResults: true });
    expect(events[0]).toBe('warm:scene-gagazet,boss-seymour,victory-ffx,defeat-ffx');
    expect(events.indexOf('prep')).toBeGreaterThan(0);
    expect(events.indexOf('cutscene:pre')).toBeGreaterThan(events.indexOf('prep'));
    expect(events.indexOf('battle')).toBeGreaterThan(events.indexOf('cutscene:pre'));
    expect(events.filter((e) => e.startsWith('warm:'))).toHaveLength(1);
    expect(events.at(-1), 'released when the run ends').toBe('release');
    expect(battles).toHaveLength(1);
  });

  it('ffx2-bahamut (FFX-2): its own four cues', async () => {
    const warm = vi.spyOn(audio, 'warmMusic').mockReturnValue(() => undefined);
    await app.flow.runChapter('ffx2-bahamut', { seed: 1, skipPrep: true, skipResults: true });
    expect(warm).toHaveBeenCalledTimes(1);
    expect(warm).toHaveBeenCalledWith(['scene-bevelle-underground', 'boss-bahamut', 'victory-bahamut', 'defeat-ffx2']);
  });
});
