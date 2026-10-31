/**
 * THE CHAINED CHAPTERS OF BATCH 2 UNDER THE PRO STAGING (release 70, branch `booth-ffx2-b2`; FFX-2 only; Bailey 2026-10-30: the booth treatment for every listed chapter). The paper preflight of `booth-leblanc` (`docs/plans/booth-leblanc-review.md`,
 * section 4) asks of every chapter that joins: does it chain, which victory kind, which dresses have rows, do its foes yield. Chapter V (Vegnagun and Shuyin) chains FIVE links, Chapter XV (the Den of Woe) and Chapter XI (the Fallen Aeons)
 * chain THREE, each on one presenter and one staging layer, so every `victory()` beat runs at a seam (the critical the review of Leblanc found, C1: a title and a sunk HUD left standing for the next link).
 *
 * Pinned, for each of the three: the REAL chain (real engines, presenter and chain loop) with a recording staging port that keeps the ending marks the way `EndingView` does: no ending cue before the last link, one clear per later link, the one
 * title last, the HUD in at the start of every link; and the beat itself, which differs by chapter: Chapter V is the `'hold'` kind (no pose after Shuyin: the quiet title and the pull-back, as Chapter IV), Chapters XV and XI the `'pose'` kind
 * (the FFX-2 cheer, held for the longest decoded clip in the party: Yuna White Mage 3,000 ms and Rikku Dark Knight 3,400 ms have rows, Paine Dark Knight none).
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { getChapter } from '../../src/data/encounters.ts';
import { getChapterMeta } from '../../src/data/chapter-meta.ts';
import { BattlePresenter } from '../../src/engine/BattlePresenter.ts';
import { intendedStrategy } from '../../src/engine/BattlePresenterStrategies.ts';
import { stageLinkBegins, stageVictory } from '../../src/engine/BattlePresenterStaging.ts';
import type { EventCtx } from '../../src/engine/BattlePresenterEvents.ts';
import type { BattleEngine } from '../../src/battle/common/types.ts';
import { FFX2Engine } from '../../src/battle/ffx2/index.ts';
import { ffx2EngineOptions, registerBattleContent } from '../../src/app/screens/BattleScreenContent.ts';
import { findEnemyGroup, setupForChapter } from '../../src/app/screens/BattleScreenSetup.ts';
import { runEncounterChain } from '../../src/app/screens/BattleEncounterChain.ts';
import { setDemoChapter, setTreatedScope } from '../../src/engine/motion/DemoGate.ts';
import { setStagingMode } from '../../src/engine/pro/staging/StagingSwitch.ts';
import { emptyEnd, endFrame, type EndMarks } from '../../src/engine/pro/staging/EndingPlan.ts';
import type { BreathCue, EndingCue, OpeningCue, StagingPort } from '../../src/engine/pro/staging/StagingPort.ts';
import { FakeAudio, FakeStage } from './helpers/FakeStage.ts';
import { setCappedAutoPlay } from './helpers/presenterCap.ts';
import { itIf, stillListed } from './booth-r70-withdrawn.ts';

/**
 * The three chapters: the id, how many links chain, the victory kind the meta declares (rule 14: the sources withhold the pose after Shuyin only). Chapters V and XI left the treated list in the r70 verdicts: their cases that need the
 * treatment are skipped while they are off the list (`itIf`, `stillListed`) and run again with the line; the data case (what each chapter declares) stays.
 */
const CHAPTERS = [
  { id: 'ffx2-vegnagun-shuyin', links: 5, kind: 'hold' },
  { id: 'ffx2-den-of-woe', links: 3, kind: 'pose' },
  { id: 'ffx2-fallen-aeons', links: 3, kind: 'pose' },
] as const;

/** The party of all three (`farplaneBuild`): Yuna White Mage, Rikku Dark Knight, Paine Dark Knight, by art id. */
const ART: Record<string, string> = { yuna: 'yuna-white-mage', rikku: 'rikku-dark-knight', paine: 'paine-dark-knight' };

/** A staging port that keeps what `EndingView` keeps (the marks), so the test reads what the player would see: `hud` is the HUD's opacity a minute after the last cue. */
class RecordingPort implements StagingPort {
  readonly log: string[] = [];
  marks: EndMarks = emptyEnd();
  clears = 0;
  breath(_cue: BreathCue): void {
    this.log.push('breath');
  }
  opening(_cue: OpeningCue): void {
    this.log.push('opening');
  }
  ending(cue: EndingCue): void {
    this.log.push(`ending:${cue.kind}`);
    if (cue.kind === 'freeze') this.marks.freezeAt = 0;
    else if (cue.kind === 'title') this.marks.titleAt = 0;
    else if (cue.kind === 'pullback') this.marks.pullAt = 0;
    else if (cue.kind === 'fall') this.marks.fallAt = 0;
  }
  clear(): void {
    this.clears++;
    this.log.push('clear');
    this.marks = emptyEnd();
  }
  hud(): number {
    return endFrame(60_000, this.marks).hud;
  }
}

beforeEach(() => {
  setTreatedScope('all');
  setStagingMode('pro');
});
afterEach(() => {
  setTreatedScope(null);
  setStagingMode(null);
  setDemoChapter(undefined);
});

/** A bare presenter context for the pure beats: the party and one foe on the field. */
function ctxOf(port: StagingPort, foe: string, o: { moreLinks?: boolean } = {}): EventCtx {
  return {
    deps: { staging: port },
    speed: () => 'normal',
    moments: { reducedMotion: false, reducedFlashes: false },
    stage: { staged: () => ['yuna', 'rikku', 'paine', foe], sideOf: (id: string) => (id === foe ? 'enemy' : 'party'), artOf: (id: string) => ART[id], camera: {} },
    menuOpen: () => false,
    ...(o.moreLinks === undefined ? {} : { moreLinks: o.moreLinks }),
    sleep: () => Promise.resolve(),
  } as unknown as EventCtx;
}

describe('what each chapter declares (rule 14, from the sources)', () => {
  it.each(CHAPTERS)('$id: FFX-2, $links links, the "$kind" victory kind', async ({ id, links, kind }) => {
    const chapter = getChapter(id)!;
    expect(chapter.game).toBe('ffx2');
    expect(getChapterMeta(id)?.victoryPose ?? 'pose').toBe(kind); // `research/ffx-vs-ffx2-presentation.md` 2.2: no victory pose after Bahamut or after Shuyin, and nowhere else
    let n = 1;
    let g = chapter.enemyGroupRef;
    while (g.nextGroupId !== undefined) {
      g = (await findEnemyGroup(g.nextGroupId))!;
      n++;
    }
    expect(n).toBe(links);
  });
});

describe('the victory beat at a seam of a chain, and at the end', () => {
  for (const { id, kind } of CHAPTERS) itIf(id)(`${id}: a link that chains on cues nothing; the last link cues the one title`, () => {
    setDemoChapter(id);
    const port = new RecordingPort();
    const foe = id === 'ffx2-vegnagun-shuyin' ? 'vegnagun-tail' : id === 'ffx2-den-of-woe' ? 'shade-baralai' : 'x2-shiva';
    const seam = ctxOf(port, foe, { moreLinks: true });
    expect(stageVictory(seam, kind, 900)).toBe(0);
    expect(port.log).toEqual([]);
    expect(port.hud()).toBe(1);
    const last = ctxOf(port, foe, { moreLinks: false });
    expect(stageVictory(last, kind, 900)).toBeGreaterThanOrEqual(900);
    expect(port.log[0]).toBe('ending:title');
    expect(port.hud()).toBe(0);
  });

  it('the cheer of Chapters XV and XI reads the FFX-2 table by dress: the longest decoded clip is Rikku Dark Knight\'s 3,400 ms (Yuna White Mage 3,000; Paine Dark Knight has no row and gives the floor)', () => {
    for (const id of stillListed(['ffx2-den-of-woe', 'ffx2-fallen-aeons'])) {
      setDemoChapter(id);
      const port = new RecordingPort();
      expect(stageVictory(ctxOf(port, 'x2-shiva'), 'pose', 900), id).toBe(3400);
    }
  });

  itIf('ffx2-vegnagun-shuyin')("Chapter V's beat is the quiet title and the pull-back, as Chapter IV's: no pose, no cheer's hold", () => {
    setDemoChapter('ffx2-vegnagun-shuyin');
    const port = new RecordingPort();
    const ms = stageVictory(ctxOf(port, 'shuyin'), 'hold', 900);
    expect(ms).toBeGreaterThanOrEqual(900);
    expect(ms).toBeLessThan(3400); // not the cheer's: nobody celebrates after Shuyin
    expect(port.log).toEqual(['ending:title']); // the pull-back is cued on the beat's own timer (`ctx.sleep`)
  });

  it('the first link leaves the layer alone; every later link clears it (the same rule for all five links of Chapter V)', () => {
    const port = new RecordingPort();
    const ctx = ctxOf(port, 'vegnagun-tail', { moreLinks: false });
    stageLinkBegins(ctx);
    expect(port.clears).toBe(0);
    for (let link = 2; link <= 5; link++) {
      port.ending({ game: 'ffx2', scale: 1, calm: false, tame: false, kind: 'title', boss: 'x' });
      stageLinkBegins(ctx);
      expect(port.clears, `link ${link}`).toBe(link - 1);
      expect(port.hud(), `link ${link}`).toBe(1);
    }
  });
});

describe('the real chain, one layer', () => {
  for (const { id, links } of CHAPTERS) itIf(id)(`${id}: no ending cue before the last link, one clear per later link, the one title last, the HUD in at every link\'s start`, async () => {
    setDemoChapter(id);
    const chapter = getChapter(id)!;
    const setup = setupForChapter(chapter, 1);
    await registerBattleContent();
    const engine: BattleEngine = new FFX2Engine({ ...ffx2EngineOptions(), minigames: false });
    engine.setSeed(setup.seed);
    engine.init(setup);
    const port = new RecordingPort();
    const stage = new FakeStage(setup.party.members.map((m) => m.id), chapter.enemyGroupRef.enemies.map((e) => e.id));
    const presenter = new BattlePresenter({ stage, audio: new FakeAudio(), sleep: () => Promise.resolve(), staging: port });
    presenter.setSpeed('normal');
    setCappedAutoPlay(presenter, intendedStrategy);
    const hudAtLinkStart: number[] = [];
    const result = await runEncounterChain({
      chapter, presenter, engine, stage: { stage: () => Promise.resolve() }, group: chapter.enemyGroupRef, setup, seed: 1, findGroup: findEnemyGroup, audio: new FakeAudio(),
      onLink: ({ links: n }) => {
        port.log.push(`link:${n}`);
        hudAtLinkStart.push(port.hud());
      },
    });
    expect(result.links).toBe(links);
    expect(result.outcome.kind).toBe('victory');
    const at = (s: string) => port.log.indexOf(s);
    expect(port.log.filter((e) => e === 'ending:title')).toHaveLength(1);
    for (const [i, e] of port.log.entries()) if (e.startsWith('ending:')) expect(i, `${e} before the last link`).toBeGreaterThan(at(`link:${links}`));
    expect(port.clears).toBe(links - 1);
    expect(port.log.lastIndexOf('clear')).toBeGreaterThan(at(`link:${links}`));
    expect(port.log.lastIndexOf('clear')).toBeLessThan(at('ending:title'));
    expect(hudAtLinkStart).toEqual(new Array(links).fill(1));
  }, 180_000);
});
