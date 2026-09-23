// @vitest-environment jsdom
/**
 * PR-0089 (critic round 09, deep review of e119552): music fades are
 * milliseconds authored in the DSL (`MusicStep.fade`, `MusicPhaseCue.fadeMs`)
 * read as **seconds** by `AudioManager.playMusic`/`stopMusic`. A `music(track,
 * 1200)` step scheduled a 1200-*second* ramp instead of a 1.2-second one, so
 * every scene, boss and phase theme sat near silence for the length of a
 * fight while the chapter-select waltz kept playing underneath it (measured
 * live in chapters 3, 5 and 6 — see `critic/rounds/round-09.json` PR-0089).
 *
 * The unit mismatch lived at three port boundaries that forward an
 * authored-in-ms fade straight into `PlayMusicOptions.fade` (seconds):
 * `CutsceneScreen.ts`, `BattleScreenCutscenes.ts` and
 * `BattleEncounterChain.ts`. All three now convert through the single
 * `fadeMsToSec` helper (`src/audio/AudioManager.ts`) at the boundary. This
 * file pins the conversion at each of the three, plus the two other bugs the
 * critic found riding along: `CutsceneScreen`'s port silently dropped
 * `music(null, fade)` (never called `stopMusic`) instead of stopping the
 * track, and `AudioManager.playMusic` itself must actually complete its ramp
 * within the requested seconds, not minutes.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';

import { audio, fadeMsToSec } from '../../src/audio/AudioManager.ts';
import { CutsceneScreen } from '../../src/app/screens/CutsceneScreen.ts';
import { createMidBattleCutscenes } from '../../src/app/screens/BattleScreenCutscenes.ts';
import { cueForGroup, runEncounterChain } from '../../src/app/screens/BattleEncounterChain.ts';
import { battleStart, music } from '../../src/story/dsl.ts';
import type { App } from '../../src/app/App.ts';
import type { StoryScript } from '../../src/story/dsl.ts';
import { CHAPTERS } from '../../src/data/encounters.ts';
import { findEnemyGroup, setupForChapter } from '../../src/app/screens/BattleScreenSetup.ts';
import { registerBattleContent, ffx2EngineOptions } from '../../src/app/screens/BattleScreenContent.ts';
import { BattlePresenter } from '../../src/engine/BattlePresenter.ts';
import { FFX2Engine } from '../../src/battle/ffx2/index.ts';
import { FakeAudio, FakeStage } from './helpers/FakeStage.ts';

describe('fadeMsToSec', () => {
  it('divides an authored-in-ms fade by 1000', () => {
    expect(fadeMsToSec(1200, 999)).toBeCloseTo(1.2, 6);
    expect(fadeMsToSec(800, 999)).toBeCloseTo(0.8, 6);
  });

  it('applies the fallback (also ms) when the fade is unset, not a bare 1', () => {
    expect(fadeMsToSec(undefined, 1200)).toBeCloseTo(1.2, 6);
    expect(fadeMsToSec(undefined, 800)).toBeCloseTo(0.8, 6);
  });
});

/**
 * A trimmed version of the recording AudioContext from
 * critic/rounds/round-09/audio/fade-units-proof.mjs: every gain ramp the
 * manager schedules lands in `ramps`, with its absolute end time.
 */
function recordingContext(clock: { now: number }, ramps: Array<{ v: number; at: number }>) {
  class FakeParam {
    value = 1;
    setValueAtTime(v: number): void {
      this.value = v;
    }
    exponentialRampToValueAtTime(v: number, at: number): void {
      ramps.push({ v, at });
    }
    linearRampToValueAtTime(): void {}
    cancelScheduledValues(): void {}
  }
  class FakeNode {
    connect(): void {}
    disconnect(): void {}
  }
  return {
    state: 'running',
    sampleRate: 48000,
    destination: new FakeNode(),
    get currentTime(): number {
      return clock.now;
    },
    resume: (): Promise<void> => Promise.resolve(),
    createGain: () => Object.assign(new FakeNode(), { gain: new FakeParam() }),
    createBufferSource: () => Object.assign(new FakeNode(), { start: () => {}, stop: () => {} }),
  };
}

/**
 * The ramp a **real scene** schedules on the **real manager**: a
 * `CutsceneScreen` plays `music('title', 1200)` and then `music(null, 800)`
 * through its own port into the shared `audio` singleton, and the test reads
 * the gain ramps that singleton put on its (recording) context. No value is
 * converted by the test: before the fix the port forwarded 1200 and the
 * fade-in ramp ended 1200 s after its start; the fade-out was never scheduled
 * at all because `music(null)` never reached `stopMusic`.
 */
describe('CutsceneScreen → AudioManager: the ramps a scene schedules land within their fades', () => {
  it('a 1200 ms fade-in ends ~1.2 s after it starts, and an 800 ms stop ends ~0.8 s after it', async () => {
    const ramps: Array<{ v: number; at: number }> = [];
    const clock = { now: 20 };
    const am = audio as unknown as Record<string, unknown> & { loader: Record<string, unknown> };
    const saved = { ctx: am['ctx'], musicBus: am['musicBus'], loadManifest: am['loadManifest'], load: am.loader['load'] };
    try {
      const ctx = recordingContext(clock, ramps);
      am['ctx'] = ctx;
      am['musicBus'] = ctx.createGain();
      am['loadManifest'] = async () => {};
      am.loader['load'] = async () => ({ buffer: {}, loopStart: 0, loopEnd: 1 });

      const play = async (script: StoryScript) => {
        const screen = new CutsceneScreen({ script });
        screen.app = { fade: () => Promise.resolve() } as unknown as App;
        screen.root = document.createElement('div');
        document.body.appendChild(screen.root);
        screen.enter();
        await screen.done;
        // playMusic awaits the manifest and the loader before it schedules.
        for (let i = 0; i < 10; i++) await Promise.resolve();
      };

      await play([music('title', 1200), battleStart()]);
      const fadeIn = ramps.find((r) => r.v > 0.5);
      expect(fadeIn, 'the scene never reached playMusic').toBeDefined();
      expect(fadeIn!.at - clock.now).toBeCloseTo(1.2, 6);

      clock.now = 30;
      ramps.length = 0;
      await play([music(null, 800), battleStart()]);
      const fadeOut = ramps.find((r) => r.v < 0.001);
      expect(fadeOut, 'music(null) never reached stopMusic').toBeDefined();
      expect(fadeOut!.at - clock.now).toBeCloseTo(0.8, 6);
    } finally {
      am['current'] = null;
      am['fading'] = [];
      am['ctx'] = saved.ctx;
      am['musicBus'] = saved.musicBus;
      am['loadManifest'] = saved.loadManifest;
      am.loader['load'] = saved.load;
    }
  });
});

describe('CutsceneScreen music port: ms → s at the boundary, and music(null) stops', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('forwards a fade in seconds to playMusic, and calls stopMusic (in seconds) for music(null)', async () => {
    const playMusicSpy = vi.spyOn(audio, 'playMusic').mockResolvedValue(undefined);
    const stopMusicSpy = vi.spyOn(audio, 'stopMusic').mockImplementation(() => {});

    const script: StoryScript = [music('scene-gagazet', 1200), music(null, 800), battleStart()];
    const screen = new CutsceneScreen({ script });
    screen.app = { fade: () => Promise.resolve() } as unknown as App;
    screen.root = document.createElement('div');
    document.body.appendChild(screen.root);

    screen.enter();
    await screen.done;

    expect(playMusicSpy).toHaveBeenCalledWith('scene-gagazet', { fade: 1.2 });
    // Before the fix, `music(null, ...)` was silently dropped (never reached
    // AudioManager at all) and the chapter-select bed kept playing under the
    // scene.
    expect(stopMusicSpy).toHaveBeenCalledWith(0.8);
  });
});

describe('BattleScreenCutscenes music port: ms → s at the boundary', () => {
  it('converts a mid-battle music/stop fade from ms to seconds', async () => {
    const audioPort = new FakeAudio();
    const root = document.createElement('div');
    document.body.appendChild(root);
    const cutscenes = createMidBattleCutscenes({
      root,
      stage: { camera: { moveTo: async () => {}, snapTo: () => {} } } as unknown as Parameters<
        typeof createMidBattleCutscenes
      >[0]['stage'],
      audio: audioPort,
      sleep: () => Promise.resolve(),
    });
    // Both steps are instantaneous (`music`), so they run without needing
    // `cutscenes.update(dt)` frames the way a `say`/`wait` step would.
    const done = cutscenes.play([music('boss-seymour', 1200), music(null, 800)]);
    for (let i = 0; i < 8; i++) await Promise.resolve();
    await done;

    expect(audioPort.music[0]).toBe('boss-seymour');
    expect(audioPort.fades[0]).toBeCloseTo(1.2, 6);
    expect(audioPort.music[1]).toBe('stop');
    expect(audioPort.fades[1]).toBeCloseTo(0.8, 6);
  });
});

describe('BattleEncounterChain: cueForGroup fadeMs (authored ms) reaches playMusic in seconds', () => {
  it('the opening cue’s fade is divided by 1000 before it reaches the audio port', async () => {
    await registerBattleContent();
    const chapter = CHAPTERS.find((c) => c.id === 'ffx2-bahamut')!;
    const group = chapter.enemyGroupRef;
    const cue = cueForGroup(chapter, group, 'first');
    expect(cue.fadeMs).toBeGreaterThan(100); // authored in ms (1200 by default/fallback)

    const setup = setupForChapter(chapter, 1);
    const engine = new FFX2Engine({ ...ffx2EngineOptions(), minigames: false });
    engine.setSeed(setup.seed);
    engine.init(setup);
    const stage = new FakeStage(
      setup.party.members.map((m) => m.id),
      chapter.enemyGroupRef.enemies.map((e) => e.id),
    );
    const audioPort = new FakeAudio();
    const presenter = new BattlePresenter({ stage, audio: audioPort, sleep: () => Promise.resolve() });
    presenter.setSpeed('skip');
    // `ChainStagePort` (re-stage the field for the next formation) is a
    // separate, smaller port than the `BattleStage` the presenter drives.
    const chainStage = { stage: (_s: unknown) => Promise.resolve() };

    await runEncounterChain({
      chapter,
      presenter,
      engine,
      stage: chainStage,
      group,
      setup,
      seed: 1,
      audio: audioPort,
      findGroup: findEnemyGroup,
    });

    expect(audioPort.music[0]).toBe(cue.track);
    // Before the fix this was `cue.fadeMs` verbatim (e.g. 1200), read by
    // AudioManager as 1200 seconds.
    expect(audioPort.fades[0]).toBeCloseTo(cue.fadeMs / 1000, 6);
    expect(audioPort.fades[0]).toBeLessThan(5);
  });

  it('chapter 5: when Vegnagun chains to Shuyin, runEncounterChain plays boss-shuyin with its authored 600 ms as 0.6 s', async () => {
    // The real chapter-5 chain from its first formation, through the real
    // `runEncounterChain` link loop and the real engine re-init per link. Only
    // the fight itself is stubbed (every link is won at once), because what is
    // under test is the 'next' cue the loop hands the audio port, not combat.
    await registerBattleContent();
    const chapter = CHAPTERS.find((c) => c.id === 'ffx2-vegnagun-shuyin')!;
    const shuyinGroup = (await findEnemyGroup('shuyin'))!;
    expect(shuyinGroup.musicCues?.find((c) => c.at === 'start')?.fadeMs).toBe(600); // authored ms, shuyin.ts
    const group = chapter.enemyGroupRef;
    const setup = setupForChapter(chapter, 1);
    const engine = new FFX2Engine({ ...ffx2EngineOptions(), minigames: false });
    engine.setSeed(setup.seed);
    engine.init(setup);
    const presenter = {
      syncHud: () => {},
      run: async () => ({ kind: 'victory', result: {} }),
    } as unknown as BattlePresenter;
    const audioPort = new FakeAudio();
    const staged: string[] = [];

    const result = await runEncounterChain({
      chapter,
      presenter,
      engine,
      stage: { stage: async () => { staged.push('link'); } },
      group,
      setup,
      seed: 1,
      audio: audioPort,
      findGroup: findEnemyGroup,
      onLink: ({ group: g }) => staged.push(g.id),
    });

    expect(staged, 'the chain must reach Shuyin').toContain('shuyin');
    const at = audioPort.music.indexOf('boss-shuyin');
    expect(at, `cues played: ${audioPort.music.join(', ')}`).toBeGreaterThanOrEqual(0);
    expect(audioPort.fades[at]).toBeCloseTo(0.6, 6); // not 600 (seconds)
    expect(result.outcome.kind).toBe('victory');
  });
});
