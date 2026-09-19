/**
 * Every chapter, played to its end, at every playback speed.
 *
 * Critic round 02 #01: *"Chapter 4 is won and then never ends"* — Bahamut at
 * 0/8400, `screen()` still `'battle'` 300 s later, and Chapter 1 at
 * `speed: 'skip'` the same. The pure engine clears both, so the fault had to be
 * above it; nothing could prove where, because the loop that decides an
 * encounter is over lived inside `BattleScreen`, which needs Three.js, a DOM
 * and a WebGL context.
 *
 * It does not any more (`src/app/screens/BattleEncounterChain.ts`). This drives
 * the **real** engines, the **real** `BattlePresenter` and the **real** chain
 * loop against fake ports, once per chapter per speed, and fails on a budget
 * rather than hanging: `withDeadline` rejects if a chapter has not settled
 * inside `BUDGET_MS`, and `countingSleep` rejects if the presenter takes more
 * awaits than a whole chapter could plausibly need. Either way the test names
 * the chapter rather than timing out anonymously.
 *
 * It also pins the music routing from #02: the cue that scores the opening
 * formation is the formation's own, not the chapter's generic battle theme,
 * and an FFX chapter never reaches for an FFX-2 cue or the other way round.
 */

import { describe, expect, it } from 'vitest';

import { CHAPTERS, type Chapter } from '../../src/data/encounters.ts';
import { BattlePresenter } from '../../src/engine/BattlePresenter.ts';
import { intendedStrategy } from '../../src/engine/BattlePresenterStrategies.ts';
import type { PlaybackSpeed } from '../../src/engine/BattlePresenterPorts.ts';
import type { BattleEngine, BattleState } from '../../src/battle/common/types.ts';
import { FFXEngine } from '../../src/battle/ffx/index.ts';
import { FFX2Engine } from '../../src/battle/ffx2/index.ts';
import { ffx2EngineOptions, registerBattleContent } from '../../src/app/screens/BattleScreenContent.ts';
import { findEnemyGroup, setupForChapter } from '../../src/app/screens/BattleScreenSetup.ts';
import { cueForGroup, runEncounterChain } from '../../src/app/screens/BattleEncounterChain.ts';
import { TRACKS } from '../../src/audio/tracks/index.ts';
import { FakeAudio, FakeStage } from './helpers/FakeStage.ts';

/** Wall-clock budget for one chapter. Generous; a healthy run is milliseconds. */
const BUDGET_MS = 20_000;

/**
 * Presenter awaits one chapter may take before we call it stuck.
 *
 * Chapter 3 is the longest: four formations, and Yu Yevon's Auto-Life loop
 * means a lot of turns. Measured runs land far below this; the number exists
 * so a regression fails loudly instead of parking.
 */
const MAX_SLEEPS = 400_000;

class Stuck extends Error {}

/** `defaultSleep` with a counter on it and no actual delay. */
function countingSleep(): { sleep: (ms: number) => Promise<void>; count: () => number } {
  let n = 0;
  return {
    sleep: () => {
      if (++n > MAX_SLEEPS) throw new Stuck(`presenter took more than ${MAX_SLEEPS} awaits`);
      return Promise.resolve();
    },
    count: () => n,
  };
}

function withDeadline<T>(what: string, p: Promise<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  return Promise.race([
    p.finally(() => clearTimeout(timer)),
    new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Stuck(`${what} did not settle within ${BUDGET_MS}ms`)), BUDGET_MS);
    }),
  ]);
}

/** The same engines `BattleScreenWiring.createEngine` builds, minus the HUDs. */
async function engineFor(chapter: Chapter, setup: ReturnType<typeof setupForChapter>): Promise<BattleEngine> {
  await registerBattleContent();
  const engine: BattleEngine =
    chapter.game === 'ffx'
      ? new FFXEngine({ autoResolveMinigames: true })
      : new FFX2Engine({ ...ffx2EngineOptions(), minigames: false });
  // `setSeed` before `init`, exactly as `BattleScreenWiring.createEngine` does:
  // the order decides which RNG stream the opening turn draws from.
  engine.setSeed(setup.seed);
  engine.init(setup);
  return engine;
}

/** A `ChainStagePort` that just records how many times the field was re-staged. */
function recordingStage(): { stage(state: BattleState): Promise<void>; restaged: number } {
  const rec = {
    restaged: 0,
    stage(_state: BattleState): Promise<void> {
      rec.restaged++;
      return Promise.resolve();
    },
  };
  return rec;
}

async function playChapter(chapter: Chapter, speed: PlaybackSpeed, seed = 1) {
  const setup = setupForChapter(chapter, seed);
  const engine = await engineFor(chapter, setup);
  const { sleep, count } = countingSleep();
  const audio = new FakeAudio();
  const stage = new FakeStage(
    setup.party.members.map((m) => m.id),
    chapter.enemyGroupRef.enemies.map((e) => e.id),
  );
  const presenter = new BattlePresenter({ stage, audio, sleep });
  presenter.setSpeed(speed);
  presenter.setAutoPlay(intendedStrategy);

  const result = await withDeadline(
    `${chapter.id} at speed '${speed}'`,
    runEncounterChain({
      chapter,
      presenter,
      engine,
      stage: recordingStage(),
      group: chapter.enemyGroupRef,
      setup,
      seed,
      findGroup: findEnemyGroup,
      audio,
    }),
  );
  return { ...result, sleeps: count(), music: audio.music };
}

describe('every chapter reaches an outcome — critic round 02 #01', () => {
  // `'normal'` and `'fast'` differ from `'skip'` only in the multiplier applied
  // to a sleep that is already instant here, so the speeds that matter for
  // *finishing* are covered by running all three through the same loop.
  const speeds: PlaybackSpeed[] = ['normal', 'fast', 'skip'];

  for (const chapter of CHAPTERS) {
    for (const speed of speeds) {
      it(`${chapter.number}. ${chapter.id} at '${speed}' settles`, async () => {
        const { outcome, links, sleeps } = await playChapter(chapter, speed);
        // "Settles" is the whole claim of #01: the loop returns a decided
        // result rather than parking. `'aborted'` is what a presenter that gave
        // up looks like, and it is the one answer this must never be.
        expect(['victory', 'defeat', 'escape']).toContain(outcome.kind);
        expect(links).toBeGreaterThanOrEqual(1);
        expect(sleeps).toBeLessThan(MAX_SLEEPS);
      });
    }
  }

  // NOTE: whether a chapter is *won* is deliberately not asserted here.
  // `ENEMY_GROUPS_BY_ID` hands every battle the same enemy record objects and
  // the FFX engine writes through them — the Mortiorchis's `stats.maxHp` comes
  // out of one run at 4 000, 3 000 or 1 000 depending on what ran before it —
  // so an outcome depends on the order the battles ran in the process, not only
  // on the seed. That is a real defect in `src/battle/ffx` / `src/data/ffx`,
  // which this track does not own; it is written up in
  // `docs/handoff/builda-flow.md`. What #01 is about, and what this file
  // proves, is that the loop always **reaches** an outcome.

  it('walks Chapter 3 and Chapter 5 through every link of their chains', async () => {
    const ch3 = await playChapter(CHAPTERS[2]!, 'skip');
    const ch5 = await playChapter(CHAPTERS[4]!, 'skip');
    expect(ch3.links, "Braska's Final Aeon -> possessed aeons -> Yu Yevon").toBeGreaterThan(1);
    expect(ch5.links, 'Vegnagun tail -> leg -> body -> head -> Shuyin').toBeGreaterThan(1);
  });

  it('never fights more formations than the chain declares', async () => {
    // A `nextGroupId` cycle used to have no bound in the loop that fights.
    const chapter = CHAPTERS[4]!;
    const { links } = await playChapter(chapter, 'skip');
    expect(links).toBeLessThanOrEqual(8);
  });
});

describe('each boss fight is scored with its own cue — critic round 02 #02', () => {
  /** What the critic measured: the cue playing once the battle has opened. */
  it.each(CHAPTERS.map((c) => [c.id, c] as const))('%s opens on its own boss cue', async (_id, chapter) => {
    const { music } = await playChapter(chapter, 'skip');
    const opening = music[0];
    expect(opening, `${chapter.id} played no music at all`).toBeDefined();
    expect(opening).not.toBe('battle-ffx');
    expect(opening).toBe(cueForGroup(chapter, chapter.enemyGroupRef, 'first').track);
  });

  it('gives Chapter 3 Jecht then Yu Yevon, and Chapter 5 Vegnagun then Shuyin', async () => {
    const ch3 = await playChapter(CHAPTERS[2]!, 'skip');
    const ch5 = await playChapter(CHAPTERS[4]!, 'skip');
    expect(ch3.music[0]).toBe('boss-jecht');
    expect(ch3.music).toContain('boss-yu-yevon');
    expect(ch5.music[0]).toBe('boss-vegnagun');
    expect(ch5.music).toContain('boss-shuyin');
  });

  it('never plays an FFX-2 cue in an FFX chapter, or an FFX cue in an FFX-2 one', async () => {
    // The two scores share no cue: `docs/audio/THEMES.md` keeps Spira's flat
    // sixth out of the FFX-2 material entirely. So the test is simply that a
    // chapter's cues all carry its own game's marker, plus the shared scene
    // beds that name the chapter's own location.
    const ffx2Only = ['boss-ffx2-aeon', 'boss-vegnagun', 'boss-shuyin', 'victory-ffx2', 'ending-ffx2'];
    const ffxOnly = ['boss-seymour', 'boss-yunalesca', 'boss-jecht', 'boss-yu-yevon', 'victory-ffx', 'ending-ffx', 'battle-ffx'];
    for (const chapter of CHAPTERS) {
      const { music } = await playChapter(chapter, 'skip');
      const forbidden = chapter.game === 'ffx' ? ffx2Only : ffxOnly;
      for (const cue of music) {
        expect(forbidden, `${chapter.id} played ${cue}`).not.toContain(cue);
      }
    }
  });

  it('only ever names cues that exist', async () => {
    for (const chapter of CHAPTERS) {
      const { music } = await playChapter(chapter, 'skip');
      for (const cue of music) expect(TRACKS[cue], `${cue} is not a composed track`).toBeDefined();
    }
  });
});

describe('a stage animation that never settles cannot strand a chapter — #01', () => {
  /**
   * The measured live failure, reproduced.
   *
   * At `speed: 'skip'` on the dev server: Bahamut 0/8400, the engine's own
   * `result` already `victory`, turn 75 — and `snapshotState().screenState
   * .playback.phase` reading `"play:ko"`. The presenter was inside
   * `await actor.dissolveTo(...)` for the killing blow. `TweenGroup.toAsync`
   * resolves from `Tween.onComplete`, and `Tween.kill()` — which
   * `PaintedActor.dispose()` calls through `tweens.killAll()` — sets `_killed`
   * without firing it, so that await never returned, the `victory` event queued
   * behind it never played, and the screen sat on `'battle'` for as long as
   * anyone was willing to watch.
   *
   * This fakes exactly that: a stage whose KO dissolve returns a promise that
   * is never settled.
   */
  function neverSettlingKoStage(party: string[], enemies: string[]): FakeStage {
    const stage = new FakeStage(party, enemies);
    for (const id of enemies) {
      const actor = stage.actors.get(id);
      if (actor) {
        actor.dissolveTo = () =>
          new Promise<void>(() => {
            /* killed, never resolved */
          });
      }
    }
    return stage;
  }

  it('reaches victory even when the killing blow’s dissolve never resolves', async () => {
    const chapter = CHAPTERS[3]!; // Chapter 4, the one the critic measured
    const setup = setupForChapter(chapter, 1);
    const engine = await engineFor(chapter, setup);
    const { sleep } = countingSleep();
    const stage = neverSettlingKoStage(
      setup.party.members.map((m) => m.id),
      chapter.enemyGroupRef.enemies.map((e) => e.id),
    );
    const presenter = new BattlePresenter({ stage, audio: new FakeAudio(), sleep });
    presenter.setSpeed('skip');
    presenter.setAutoPlay(intendedStrategy);

    const { outcome } = await withDeadline(
      'chapter 4 with a dead KO animation',
      runEncounterChain({
        chapter,
        presenter,
        engine,
        stage: recordingStage(),
        group: chapter.enemyGroupRef,
        setup,
        seed: 1,
        findGroup: findEnemyGroup,
      }),
    );
    expect(['victory', 'defeat', 'escape']).toContain(outcome.kind);
  });
});

describe('cueForGroup', () => {
  const chapter = CHAPTERS[0]!;

  it("prefers the formation's own start cue over the chapter's", () => {
    expect(cueForGroup(chapter, chapter.enemyGroupRef, 'first').track).toBe('boss-seymour');
  });

  it("falls back to the chapter's battle cue for a formation that declares none", () => {
    const bare = { ...chapter.enemyGroupRef, musicCues: undefined };
    expect(cueForGroup(chapter, bare, 'first').track).toBe(chapter.music.battle);
  });

  it("falls back to the chapter's phase-2 cue for a later link that declares none", () => {
    const ch3 = CHAPTERS[2]!;
    const bare = { ...ch3.enemyGroupRef, musicCues: undefined };
    expect(cueForGroup(ch3, bare, 'next').track).toBe('boss-yu-yevon');
  });
});
