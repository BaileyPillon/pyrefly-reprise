// @vitest-environment jsdom
/**
 * Release 62, decision 173f (Bailey, 2026-10-22 ~00:00 EDT; demo mode only): a short voiced intro before the Seymour fight, instead of skipping the scene entirely: the 2-3 best voiced lines of the real pre-battle
 * scene, about 10 seconds, skippable with A / Enter. FFX only (Chapter I, Seymour Flux): FFX-2's Bahamut has no recorded lines and keeps skipping its scene.
 *
 *  1. the lines are the real scene's own (word for word, in its order) and each one has a recording in the shipped manifest (Tidus, Yuna, Auron), about 10 s in all;
 *  2. when the intro is due (demo mode, a person's run, not a retry, not a restart, not a Pilgrimage fight, not an automated run, and FFX only);
 *  3. the flow: it plays once before the first battle of a picked fight, a skipped one hurries the battle's opening as a skipped story scene does, a harness with no factory sees the old flow.
 */
import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { App } from '../../src/app/App.ts';
import { setDemoMode } from '../../src/app/demoMode.ts';
import { SaveStore } from '../../src/app/SaveData.ts';
import { Screen } from '../../src/app/Screen.ts';
import { DEMO_INTROS, SEYMOUR_FLUX_INTRO, demoIntroFor } from '../../src/app/demo/demoIntro.ts';
import { forgetBoardChapter } from '../../src/app/screens/frontend/boardFocus.ts';
import { GameFlow, registerFlowScreens, resetFlowScreens, type CutsceneScreenOptions, type FlowScreen, type ResultsScreenOptions } from '../../src/app/screens/BattleScreenFlow.ts';
import type { BattleScreenOptions, BattleScreenResult } from '../../src/app/screens/BattleScreen.ts';
import { scriptKeys } from '../../src/audio/voice/VoiceDirector.ts';
import type { BattleResult } from '../../src/battle/common/types.ts';
import { parseChapterVoiceManifest } from '../../src/story/voice/voiceManifest.ts';
import { seymourFluxScripts } from '../../src/story/scripts/seymour-flux.ts';
import type { SayStep, Step } from '../../src/story/dsl.ts';

beforeEach(() => {
  forgetBoardChapter();
  setDemoMode(null);
});
afterEach(() => {
  setDemoMode(null);
  resetFlowScreens();
  document.body.innerHTML = '';
});

const says = (script: readonly Step[]): SayStep[] => script.filter((s): s is SayStep => s.type === 'say');
const manifest = parseChapterVoiceManifest(JSON.parse(readFileSync('public/audio/voice/seymour-flux.json', 'utf8')), 'seymour-flux')!;

describe('1. the lines', () => {
  it('are three lines of the real pre-battle scene, word for word, in the scene\'s own order, one each for Tidus, Yuna and Auron', () => {
    const intro = says(SEYMOUR_FLUX_INTRO);
    expect(intro.map((s) => s.who)).toEqual(['tidus', 'yuna', 'auron']);
    const pre = says(seymourFluxScripts.pre);
    let from = 0;
    for (const line of intro) {
      const at = pre.findIndex((s, i) => i >= from && s.who === line.who && s.text === line.text);
      expect(at, `${line.who}: ${line.text}`).toBeGreaterThanOrEqual(from);
      from = at + 1;
    }
  });

  it('each has its recording in the shipped manifest (pre.008, pre.018, pre.026), so all three are heard', () => {
    expect(manifest).not.toBeNull();
    const entries = scriptKeys(SEYMOUR_FLUX_INTRO).map((k) => manifest.lines[k]);
    expect(entries.every((e) => e !== undefined)).toBe(true);
    expect(entries.map((e) => e!.id)).toEqual(['seymour-flux.pre.008', 'seymour-flux.pre.018', 'seymour-flux.pre.026']);
    expect(entries.map((e) => e!.who)).toEqual(['tidus', 'yuna', 'auron']);
  });

  it('every recording is on disk, and the whole intro is about ten seconds (speech, the holds after each line, the opening beat and the boss cue)', () => {
    const entries = scriptKeys(SEYMOUR_FLUX_INTRO).map((k) => manifest.lines[k]!);
    for (const e of entries) expect(() => readFileSync(`public/audio/voice/${e.file}`)).not.toThrow();
    const speech = entries.reduce((n, e) => n + e.ms, 0);
    expect(speech).toBeGreaterThan(7000);
    expect(speech).toBeLessThan(8200);
    const timed = SEYMOUR_FLUX_INTRO.reduce((n, s) => n + (s.type === 'wait' ? s.ms : s.type === 'say' ? (s.auto ?? 0) : s.type === 'fade' ? 0 : 0), 0);
    const total = speech + timed;
    expect(total).toBeGreaterThan(8000);
    expect(total).toBeLessThan(12500);
  });

  it('it ends the way the real scene does: the boss theme, then the fight', () => {
    const last = SEYMOUR_FLUX_INTRO[SEYMOUR_FLUX_INTRO.length - 1]!;
    expect(last.type).toBe('battleStart');
    expect(SEYMOUR_FLUX_INTRO.some((s) => s.type === 'music' && s.track === 'boss-seymour')).toBe(true);
    for (const s of says(SEYMOUR_FLUX_INTRO)) expect(s.auto, 'a line advances by itself once its voice is done').toBeGreaterThan(0);
  });

  it('FFX only: the table holds Chapter I and not FFX-2\'s Bahamut', () => {
    expect(Object.keys(DEMO_INTROS)).toEqual(['seymour-flux']);
  });
});

describe('2. when it is due', () => {
  it('only in demo mode, only for Chapter I', () => {
    expect(demoIntroFor('seymour-flux', {})).toBeNull();
    setDemoMode(true);
    expect(demoIntroFor('seymour-flux', {})).toBe(SEYMOUR_FLUX_INTRO);
    expect(demoIntroFor('ffx2-bahamut', {})).toBeNull(); // no recorded lines: the scene stays skipped
    expect(demoIntroFor('yunalesca', {})).toBeNull();
  });

  it('not for an automated run, a restart or a Pilgrimage fight', () => {
    setDemoMode(true);
    expect(demoIntroFor('seymour-flux', { auto: () => null })).toBeNull();
    expect(demoIntroFor('seymour-flux', { speed: 'skip' })).toBeNull();
    expect(demoIntroFor('seymour-flux', { skipResults: true })).toBeNull();
    expect(demoIntroFor('seymour-flux', { restart: true })).toBeNull();
    expect(demoIntroFor('seymour-flux', { pilgrim: {} })).toBeNull();
    expect(demoIntroFor('seymour-flux', { speed: 'normal' as never })).toBe(SEYMOUR_FLUX_INTRO);
  });
});

describe('3. the flow', () => {
  const played: string[] = [];
  const battles: Array<{ chapter: string; hurry: boolean | undefined }> = [];
  let outcomes: Array<'victory' | 'defeat'> = [];
  let answers: Array<'retry' | 'chapter-select'> = [];
  let hurried = false;
  let introScripts: unknown[] = [];

  class FakeIntro extends Screen implements FlowScreen<void> {
    readonly name = 'cutscene';
    readonly done = Promise.resolve();
    readonly hurriedByPlayer: boolean;
    constructor(readonly opts: CutsceneScreenOptions) {
      super();
      this.hurriedByPlayer = hurried;
    }
    override enter(): void {
      played.push(`intro:${this.opts.chapter.id}:${this.opts.phase}`);
      introScripts.push(this.opts.script);
    }
  }
  class FakeStory extends Screen implements FlowScreen<void> {
    readonly name = 'cutscene';
    readonly done = Promise.resolve();
    constructor(readonly opts: CutsceneScreenOptions) {
      super();
    }
    override enter(): void {
      played.push(`story:${this.opts.phase}`);
    }
  }
  class FakeResults extends Screen implements FlowScreen<void> {
    readonly name = 'results';
    readonly done = Promise.resolve();
    constructor(readonly opts: ResultsScreenOptions) {
      super();
    }
    override enter(): void {
      played.push(`results:${this.opts.outcome}`);
      if (this.opts.outcome !== 'victory') this.opts.onChoice?.(answers.shift() ?? 'chapter-select');
    }
  }
  class FakeBattle extends Screen implements FlowScreen<BattleScreenResult> {
    readonly name = 'battle';
    readonly done: Promise<BattleScreenResult>;
    constructor(opts: BattleScreenOptions) {
      super();
      const outcome = outcomes.shift() ?? 'victory';
      battles.push({ chapter: opts.chapter.id, hurry: opts.openingHurry });
      const result = { outcome, turns: 12, elapsedTicks: 900, elapsedMs: 0, ap: 10, exp: 0, gil: 0, drops: [], overkilled: [], sphereLevelsGained: {} } as unknown as BattleResult;
      this.done = Promise.resolve({ chapterId: opts.chapter.id, outcome, result, elapsedMs: 120_000, links: 1, preview: false });
    }
    override enter(): void {
      played.push('battle');
    }
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
  const register = (withIntro: boolean): void => {
    resetFlowScreens();
    registerFlowScreens({
      results: (o: ResultsScreenOptions) => new FakeResults(o),
      battle: (o: BattleScreenOptions) => new FakeBattle(o),
      cutscene: (o: CutsceneScreenOptions) => new FakeStory(o),
      ...(withIntro ? { demoIntro: (o: CutsceneScreenOptions) => new FakeIntro(o) } : {}),
    } as never);
  };
  beforeEach(() => {
    played.length = 0;
    battles.length = 0;
    outcomes = [];
    answers = [];
    hurried = false;
    introScripts = [];
    register(true);
    document.body.innerHTML = '';
    app = new FakeApp();
  });

  it('Chapter I in demo mode: the intro, then the battle, then the results (no story scene around them)', async () => {
    setDemoMode(true);
    await app.flow.runChapter('seymour-flux', { seed: 7 });
    expect(played).toEqual(['intro:seymour-flux:pre', 'battle', 'results:victory']);
    expect(introScripts[0]).toBe(SEYMOUR_FLUX_INTRO);
    expect(battles[0]!.hurry, 'an intro watched to its end opens the battle at its authored length').toBeUndefined();
  });

  it('an intro the visitor skipped hurries the battle\'s opening, as a skipped story scene does (PR-0061)', async () => {
    setDemoMode(true);
    hurried = true;
    await app.flow.runChapter('seymour-flux', { seed: 7 });
    expect(battles[0]!.hurry).toBe(true);
  });

  it('it plays once: TRY AGAIN goes straight back into the fight', async () => {
    setDemoMode(true);
    outcomes = ['defeat', 'victory'];
    answers = ['retry'];
    await app.flow.runChapter('seymour-flux', { seed: 7 });
    expect(played).toEqual(['intro:seymour-flux:pre', 'battle', 'results:defeat', 'battle', 'results:victory']);
  });

  it('FFX-2 Chapter IV has no intro (no recorded lines): battle and results only', async () => {
    setDemoMode(true);
    await app.flow.runChapter('ffx2-bahamut', { seed: 56 });
    expect(played).toEqual(['battle', 'results:victory']);
  });

  it('outside demo mode the run plays the whole story, and no intro', async () => {
    await app.flow.runChapter('seymour-flux', { seed: 7, skipPrep: true });
    expect(played.some((p) => p.startsWith('intro'))).toBe(false);
    expect(played.filter((p) => p.startsWith('story'))).toHaveLength(2);
  });

  it('an automated run in demo mode (auto, speed skip, skipResults) gets none', async () => {
    setDemoMode(true);
    await app.flow.runChapter('seymour-flux', { seed: 7, skipResults: true });
    await app.flow.runChapter('seymour-flux', { seed: 7, speed: 'skip' });
    expect(played.some((p) => p.startsWith('intro'))).toBe(false);
  });

  it('where no factory is registered (a harness) the flow is what it was', async () => {
    register(false);
    setDemoMode(true);
    await app.flow.runChapter('seymour-flux', { seed: 7 });
    expect(played).toEqual(['battle', 'results:victory']);
  });
});
