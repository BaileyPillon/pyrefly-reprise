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

describe('AudioManager.playMusic: the ramp actually lands within its fade', () => {
  // A trimmed version of the recording AudioContext from
  // critic/rounds/round-09/audio/fade-units-proof.mjs.
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
  let ramps: Array<{ v: number; at: number }>;
  let now: number;

  class FakeCtx {
    state = 'running';
    sampleRate = 48000;
    destination = new FakeNode();
    get currentTime(): number {
      return now;
    }
    resume(): Promise<void> {
      return Promise.resolve();
    }
    createGain(): FakeNode & { gain: FakeParam } {
      return Object.assign(new FakeNode(), { gain: new FakeParam() });
    }
    createBufferSource(): FakeNode & { start: (at: number) => void; buffer?: unknown; loop?: boolean } {
      return Object.assign(new FakeNode(), { start: () => {} });
    }
  }

  it('schedules the new cue’s ramp to finish within its fade (seconds), not minutes', async () => {
    ramps = [];
    now = 0;
    const { AudioManager } = await import('../../src/audio/AudioManager.ts');
    const am = new AudioManager({ useWorker: false, synthOnly: true });
    // @ts-expect-error -- test double, not a real AudioContext
    am.ctx = new FakeCtx();
    // @ts-expect-error -- private, but this is exactly what unlock() sets up
    am.musicBus = am.ctx.createGain();
    // @ts-expect-error -- skip the real manifest/network path
    am.loadManifest = async () => {};
    // @ts-expect-error -- skip decoding a real buffer
    am.loader.load = async () => ({ buffer: {}, loopStart: 0, loopEnd: 1 });

    now = 20;
    // What CutsceneScreen/BattleEncounterChain now send after fadeMsToSec(1200, ...).
    await am.playMusic('title', { fade: fadeMsToSec(1200, 1200) });
    const inRamp = ramps.find((r) => r.v > 0.5);
    expect(inRamp).toBeDefined();
    // Within (about) 1.2s of `now`, not 1200s.
    expect(inRamp!.at - now).toBeLessThan(2);
    expect(inRamp!.at - now).toBeGreaterThan(0.5);
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

  it('chapter 5’s own Vegnagun → Shuyin phase cue (the browser proof could not reach it live: see docs/screenshots/audio/pr-0089-gains.json) converts the same way', async () => {
    // The exact `cueForGroup(..., 'next')` call `runEncounterChain` makes when
    // Vegnagun's head chains to Shuyin (`vegnagun-head.ts` `nextGroupId:
    // 'shuyin'`), against the real chapter-5 data.
    const chapter = CHAPTERS.find((c) => c.id === 'ffx2-vegnagun-shuyin')!;
    const shuyinGroup = (await findEnemyGroup('shuyin'))!;
    const cue = cueForGroup(chapter, shuyinGroup, 'next');
    expect(cue.track).toBe('boss-shuyin');
    expect(cue.fadeMs).toBe(600); // authored in ms, shuyin.ts musicCues

    const audioPort = new FakeAudio();
    if (cue.track) audioPort.playMusic(cue.track, { fade: fadeMsToSec(cue.fadeMs, 1200) });
    expect(audioPort.fades[0]).toBeCloseTo(0.6, 6); // not 600 (seconds)
  });
});
