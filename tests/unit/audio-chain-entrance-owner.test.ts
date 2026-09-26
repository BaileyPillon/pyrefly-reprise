/**
 * PR-0129 (critic round 11, major, audio): one owner decides the music at each
 * chain entrance.
 *
 * **Game case: both** [AGENTS.md rule 14]. The plumbing (`MusicPhaseCue.track:
 * null`, read by `cueForGroup`) is shared; the two data changes are one per
 * game: Chapter 3 (FFX) and Chapter 5 (FFX-2).
 *
 * What the critic read from `audioDebug()` on live:
 *
 * - **Chapter 3.** The possessed-aeon formations carried a start cue of
 *   `boss-jecht`, so the chain restarted Jecht's theme at possessed Valefor,
 *   'valefor-enters' silenced it four seconds later and ended on
 *   `music('boss-yu-yevon')`, and the possessed-Ifrit link's chain cue put
 *   `boss-jecht` back for the rest of the gauntlet (links 3-6).
 * - **Chapter 5.** Shuyin's formation started `boss-shuyin` at the seam, and
 *   'shuyin-appears' (fired after the first action) opened on `music(null)` and
 *   closed on `music('boss-shuyin')`: the theme false-started, went silent and
 *   started again.
 *
 * The routing now follows each chapter's own music data: Chapter 3's `phase2`
 * is `boss-yu-yevon` (`src/data/encounters.ts`), the cue 'valefor-enters'
 * starts; Chapter 5's `phase2` is `boss-shuyin`, the cue 'shuyin-appears'
 * starts. The link whose entrance scene scores it (possessed Valefor, Shuyin)
 * declares `track: null`, so the chain starts nothing there and the scene is
 * the only owner.
 *
 * The timeline below is built from the real chain, the real engines, the real
 * presenter and the real story scripts, with a fake audio port that keeps
 * `AudioManager.playMusic`'s one rule that matters here: asking for the cue
 * already playing is a no-op.
 */

import { describe, expect, it } from 'vitest';

import { CHAPTERS, type Chapter } from '../../src/data/encounters.ts';
import { BattlePresenter } from '../../src/engine/BattlePresenter.ts';
import { intendedStrategy } from '../../src/engine/BattlePresenterStrategies.ts';
import type { AudioPort, CutsceneRunnerPort } from '../../src/engine/BattlePresenterPorts.ts';
import type { BattleEngine, EnemyGroupDef } from '../../src/battle/common/types.ts';
import { FFXEngine } from '../../src/battle/ffx/index.ts';
import { FFX2Engine } from '../../src/battle/ffx2/index.ts';
import { ffx2EngineOptions, registerBattleContent } from '../../src/app/screens/BattleScreenContent.ts';
import { findEnemyGroup, setupForChapter } from '../../src/app/screens/BattleScreenSetup.ts';
import { cueForGroup, runEncounterChain } from '../../src/app/screens/BattleEncounterChain.ts';
import { buildPossessedAeonChain, yuYevonGroup } from '../../src/data/ffx/enemies/braskas-final-aeon.ts';
import { shuyinGroup } from '../../src/data/ffx2/enemies/shuyin.ts';
import type { StoryScript } from '../../src/story/dsl.ts';
import { FakeStage } from './helpers/FakeStage.ts';
import { setCappedAutoPlay } from './helpers/presenterCap.ts';

type Entry =
  | { kind: 'start'; track: string; link: number }
  | { kind: 'stop'; link: number }
  | { kind: 'link'; group: string; link: number }
  | { kind: 'script'; name: string; link: number };

/** `AudioManager`'s music rule, reduced: the cue already playing is not restarted. */
class TimelineAudio implements AudioPort {
  current: string | null = null;
  link = 0;
  readonly log: Entry[] = [];
  playSfx(): void {}
  playMusic(key: string): void {
    if (this.current === key) return;
    this.current = key;
    this.log.push({ kind: 'start', track: key, link: this.link });
  }
  stopMusic(): void {
    this.current = null;
    this.log.push({ kind: 'stop', link: this.link });
  }
}

/** Plays a script's top-level `music` steps into the audio, and logs the script. */
class MusicOnlyRunner implements CutsceneRunnerPort {
  constructor(private readonly audio: TimelineAudio) {}
  play(script: StoryScript, opts?: { name?: string }): Promise<void> {
    this.audio.log.push({ kind: 'script', name: opts?.name ?? '?', link: this.audio.link });
    for (const step of script) {
      if (step.type !== 'music') continue;
      if (step.track === null) this.audio.stopMusic();
      else this.audio.playMusic(step.track);
    }
    return Promise.resolve();
  }
  setAutoAdvance(): void {}
}

async function timeline(chapter: Chapter): Promise<{ log: Entry[]; links: number; outcome: string }> {
  await registerBattleContent();
  const setup = setupForChapter(chapter, 1);
  const engine: BattleEngine =
    chapter.game === 'ffx'
      ? new FFXEngine({ autoResolveMinigames: true })
      : new FFX2Engine({ ...ffx2EngineOptions(), minigames: false });
  engine.setSeed(setup.seed);
  engine.init(setup);
  const audio = new TimelineAudio();
  const stage = new FakeStage(
    setup.party.members.map((m) => m.id),
    chapter.enemyGroupRef.enemies.map((e) => e.id),
  );
  const presenter = new BattlePresenter({
    stage,
    audio,
    cutscenes: new MusicOnlyRunner(audio),
    midScripts: chapter.scriptsRef?.midScripts ?? {},
    sleep: () => Promise.resolve(),
  });
  presenter.setSpeed('skip');
  setCappedAutoPlay(presenter, intendedStrategy);
  const result = await runEncounterChain({
    chapter,
    presenter,
    engine,
    stage: { stage: () => Promise.resolve() },
    group: chapter.enemyGroupRef,
    setup,
    seed: 1,
    findGroup: findEnemyGroup,
    audio,
    onLink: ({ links, group }) => {
      audio.link = links;
      audio.log.push({ kind: 'link', group: group.id, link: links });
    },
  });
  return { log: audio.log, links: result.links, outcome: result.outcome.kind };
}

const byId = (id: string): Chapter => {
  const c = CHAPTERS.find((ch) => ch.id === id);
  if (!c) throw new Error(`no chapter ${id}`);
  return c;
};

const starts = (log: Entry[], track: string): Entry[] =>
  log.filter((e) => e.kind === 'start' && e.track === track);
const indexOfScript = (log: Entry[], name: string): number =>
  log.findIndex((e) => e.kind === 'script' && e.name === name);
const indexOfLink = (log: Entry[], group: string): number =>
  log.findIndex((e) => e.kind === 'link' && e.group === group);

describe('PR-0129: the data says who owns each chain entrance', () => {
  const ch3 = byId('braskas-final-aeon');
  const ch5 = byId('ffx2-vegnagun-shuyin');

  it("Chapter 3 (FFX): possessed Valefor's link starts nothing; every later possessed aeon and Yu Yevon name the chapter's phase-2 cue", () => {
    expect(ch3.music.phase2).toBe('boss-yu-yevon');
    const gauntlet: EnemyGroupDef[] = buildPossessedAeonChain(['valefor', 'ifrit', 'ixion', 'shiva', 'bahamut', 'yojimbo', 'anima', 'magus-sisters']);
    expect(gauntlet[0]!.id).toBe('possessed-valefor');
    expect(cueForGroup(ch3, gauntlet[0]!, 'next').track).toBeUndefined();
    for (const group of gauntlet.slice(1)) {
      expect(cueForGroup(ch3, group, 'next').track, group.id).toBe('boss-yu-yevon');
    }
    expect(cueForGroup(ch3, yuYevonGroup, 'next').track).toBe('boss-yu-yevon');
    // Braska's Final Aeon itself keeps Jecht's theme.
    expect(cueForGroup(ch3, ch3.enemyGroupRef, 'first').track).toBe('boss-jecht');
  });

  it("Chapter 5 (FFX-2): Shuyin's link starts nothing; 'shuyin-appears' owns boss-shuyin", () => {
    expect(ch5.music.phase2).toBe('boss-shuyin');
    expect(cueForGroup(ch5, shuyinGroup, 'next').track).toBeUndefined();
    const scene = ch5.scriptsRef?.midScripts?.['shuyin-appears'] ?? [];
    const musicSteps = scene.filter((s) => s.type === 'music');
    expect(musicSteps.at(-1)).toMatchObject({ track: 'boss-shuyin' });
  });

  it('a cue with no null track is read exactly as before', () => {
    const ch1 = CHAPTERS[0]!;
    expect(cueForGroup(ch1, ch1.enemyGroupRef, 'first').track).toBe('boss-seymour');
    const empty = { ...ch3.enemyGroupRef, musicCues: [] };
    expect(cueForGroup(ch3, empty, 'next').track).toBe('boss-yu-yevon');
  });
});

describe('PR-0129: the chain and the entrance scenes, played through', () => {
  it("Chapter 3 (FFX): no boss-jecht after 'valefor-enters'; boss-yu-yevon starts once and carries to the end", async () => {
    const { log, links } = await timeline(byId('braskas-final-aeon'));
    const valefor = indexOfLink(log, 'possessed-valefor');
    const scene = indexOfScript(log, 'valefor-enters');
    const yu = indexOfLink(log, 'yu-yevon');
    expect(valefor, 'reached possessed Valefor').toBeGreaterThan(0);
    expect(scene, "'valefor-enters' fired").toBeGreaterThan(valefor);
    expect(yu, 'reached Yu Yevon').toBeGreaterThan(scene);
    expect(links).toBeGreaterThanOrEqual(4);
    // Nothing is started between the seam and the scene: the silence
    // 'jecht-falls' left carries into it.
    expect(log.slice(valefor, scene).filter((e) => e.kind === 'start')).toEqual([]);
    // After the scene: never Jecht, and Yu Yevon's theme exactly once.
    expect(starts(log.slice(scene), 'boss-jecht')).toEqual([]);
    expect(starts(log, 'boss-yu-yevon')).toHaveLength(1);
    expect(log.slice(scene).filter((e) => e.kind === 'stop')).toHaveLength(1); // the scene's own music(null)
    // Jecht's theme is still the Braska's Final Aeon fight's, from link 1.
    expect(starts(log, 'boss-jecht')).toHaveLength(1);
    expect(starts(log, 'boss-jecht')[0]!.link).toBeLessThanOrEqual(1);
  });

  it("Chapter 5 (FFX-2): boss-shuyin starts exactly once, at the end of 'shuyin-appears'", async () => {
    const { log } = await timeline(byId('ffx2-vegnagun-shuyin'));
    const seam = indexOfLink(log, 'shuyin');
    const scene = indexOfScript(log, 'shuyin-appears');
    expect(seam, 'reached Shuyin').toBeGreaterThan(0);
    expect(scene, "'shuyin-appears' fired").toBeGreaterThan(seam);
    const shuyin = starts(log, 'boss-shuyin');
    expect(shuyin).toHaveLength(1);
    expect(log.indexOf(shuyin[0]!)).toBeGreaterThan(scene);
    // Between the seam and the scene the Vegnagun theme carries; nothing starts.
    expect(log.slice(seam, scene).filter((e) => e.kind === 'start' || e.kind === 'stop')).toEqual([]);
  });
});
