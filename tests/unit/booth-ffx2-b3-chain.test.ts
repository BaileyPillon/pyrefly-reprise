/**
 * CHAPTER XIII'S CHAIN UNDER THE PRO STAGING (release 71, branch `booth-ffx2-b3`; FFX-2 only; Bailey 2026-10-30: the booth treatment for every listed chapter). The paper preflight of `booth-leblanc` (`docs/plans/booth-leblanc-review.md`, section 4) asks of every chapter that
 * joins: does it chain, which victory kind, which dresses have rows, do its foes yield. Chapter XIII chains TWO links on one presenter and one staging layer, Oversoul Paragon and then Trema, so the first link's `victory()` beat runs at a seam (the critical the review of Leblanc found,
 * C1: a title and a sunk HUD left standing for the next link); the foes neither fall nor dissolve, they are `'held'` (beaten and left standing: Paragon is broken by the old man of the link beat, Trema answers Yuna and fades in the post scene); the victory kind is `'hold'`
 * (no pose after a Via Infinito special boss: `research/ffx-vs-ffx2-presentation.md` 2.2); and the FFX-2 engine has no `form-change` (defect class 5: a form change cueing a freeze).
 *
 * Pinned: what the chapter declares; the beat at a seam and at the end; the REAL chain (real engines, presenter and chain loop; every foe at 1 HP so it ends in a few turns, `helpers/weakChain.ts`) with a recording staging port that keeps the ending marks the way `EndingView` does:
 * no ending cue before the last link, one clear for the second link, the freeze once on the last blow, the one title last, the HUD in at the start of both links, and no `form-change` event in the whole chain.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { getChapter } from '../../src/data/encounters.ts';
import { getChapterMeta } from '../../src/data/chapter-meta.ts';
import { BattlePresenter } from '../../src/engine/BattlePresenter.ts';
import { intendedStrategy } from '../../src/engine/BattlePresenterStrategies.ts';
import { departureKindOf } from '../../src/engine/BattlePresenterDepartures.ts';
import { stageLinkBegins, stageVictory } from '../../src/engine/BattlePresenterStaging.ts';
import type { EventCtx } from '../../src/engine/BattlePresenterEvents.ts';
import type { BattleEngine, BattleEvent, BattleState } from '../../src/battle/common/types.ts';
import { FFX2Engine } from '../../src/battle/ffx2/index.ts';
import { ffx2EngineOptions, registerBattleContent } from '../../src/app/screens/BattleScreenContent.ts';
import { findEnemyGroup, setupForChapter } from '../../src/app/screens/BattleScreenSetup.ts';
import { runEncounterChain } from '../../src/app/screens/BattleEncounterChain.ts';
import { setDemoChapter, setTreatedScope } from '../../src/engine/motion/DemoGate.ts';
import { setStagingMode } from '../../src/engine/pro/staging/StagingSwitch.ts';
import { emptyEnd, endFrame, type EndMarks } from '../../src/engine/pro/staging/EndingPlan.ts';
import type { BreathCue, EndingCue, OpeningCue, StagingPort } from '../../src/engine/pro/staging/StagingPort.ts';
import { TREMA_PARAGON_FORM } from '../../src/data/chapter-ffx2-trema.ts';
import { FakeAudio, FakeStage } from './helpers/FakeStage.ts';
import { setCappedAutoPlay } from './helpers/presenterCap.ts';
import { findWeakGroup, weakChapter } from './helpers/weakChain.ts';

const ID = 'ffx2-trema';
/** The party of Chapter XIII (`via-infinito` build): Yuna Dark Knight, Rikku Alchemist, Paine Dark Knight, by art id. */
const ART: Record<string, string> = { yuna: 'yuna-dark-knight', rikku: 'rikku-alchemist', paine: 'paine-dark-knight' };

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

describe('what the chapter declares (rule 14, from the sources)', () => {
  it('FFX-2, two links (Oversoul Paragon, then Trema), the "hold" victory kind, and both foes are `held` (beaten and left standing), never dissolved', async () => {
    const chapter = getChapter(ID)!;
    expect(chapter.game).toBe('ffx2');
    expect(getChapterMeta(ID)?.victoryPose).toBe('hold'); // `research/ffx-vs-ffx2-presentation.md` 2.2 and `ffx2-trema.md` section 13: no pose after a Via Infinito special boss on a first defeat
    expect(TREMA_PARAGON_FORM).toBe('oversoul');
    const ids: string[][] = [chapter.enemyGroupRef.enemies.map((e) => e.id)];
    let n = 1;
    let g = chapter.enemyGroupRef;
    while (g.nextGroupId !== undefined) {
      g = (await findEnemyGroup(g.nextGroupId))!;
      ids.push(g.enemies.map((e) => e.id));
      n++;
    }
    expect(n).toBe(2);
    expect(ids).toEqual([['paragon'], ['trema']]);
    expect(departureKindOf('paragon')).toBe('held');
    expect(departureKindOf('trema')).toBe('held');
  });
});

describe('the victory beat at a seam of the chain, and at the end', () => {
  it('Paragon\'s link (another formation follows) cues nothing and leaves the HUD in; Trema\'s, the last, cues the one quiet title', () => {
    setDemoChapter(ID);
    const port = new RecordingPort();
    const seam = ctxOf(port, 'paragon', { moreLinks: true });
    expect(stageVictory(seam, 'hold', 900)).toBe(0);
    expect(port.log).toEqual([]);
    expect(port.hud()).toBe(1);
    const last = ctxOf(port, 'trema', { moreLinks: false });
    const ms = stageVictory(last, 'hold', 900);
    expect(ms).toBeGreaterThanOrEqual(900);
    expect(ms).toBeLessThan(3400); // the held kind: no cheer's hold, the quiet title and the pull-back
    expect(port.log).toEqual(['ending:title']); // the pull-back is cued on the beat's own timer (`ctx.sleep`)
    expect(port.hud()).toBe(0);
  });

  it('the first link leaves the layer alone; the second clears it, so no mark of Paragon\'s link outlives its beat into Trema\'s', () => {
    const port = new RecordingPort();
    const ctx = ctxOf(port, 'paragon', { moreLinks: false });
    stageLinkBegins(ctx);
    expect(port.clears).toBe(0);
    port.ending({ game: 'ffx2', scale: 1, calm: false, tame: false, kind: 'title', boss: 'paragon' });
    stageLinkBegins(ctx);
    expect(port.clears).toBe(1);
    expect(port.hud()).toBe(1);
  });
});

describe('the real chain, one layer', () => {
  it('no ending cue before the last link, one clear for the second link, the freeze once on the last blow, the one title last, the HUD in at both links\' start, and no form-change anywhere', async () => {
    setDemoChapter(ID);
    const real = getChapter(ID)!;
    const chapter = weakChapter(real);
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
    const seen: BattleEvent[] = [];
    const play = presenter.play.bind(presenter);
    presenter.play = (events: readonly BattleEvent[], ...rest: unknown[]) => {
      seen.push(...events);
      return (play as (e: readonly BattleEvent[], ...r: unknown[]) => ReturnType<typeof play>)(events, ...rest);
    };
    // each link's foes stand on the field the way the real stage stands them
    const restage = async (state: BattleState): Promise<void> => {
      for (const known of [...stage.actors.keys()]) stage.removeCombatant(known);
      for (const [slot, pid] of state.activeIds.entries()) await stage.addCombatant(pid, { artId: pid, side: 'party', slot });
      for (const [slot, eid] of state.enemyIds.entries()) await stage.addCombatant(eid, { artId: eid, side: 'enemy', slot });
    };
    const hudAtLinkStart: number[] = [];
    const result = await runEncounterChain({
      chapter, presenter, engine, stage: { stage: restage }, group: chapter.enemyGroupRef, setup, seed: 1, findGroup: findWeakGroup, audio: new FakeAudio(),
      onLink: ({ links: n }) => {
        port.log.push(`link:${n}`);
        hudAtLinkStart.push(port.hud());
      },
    });
    expect(result.links).toBe(2);
    expect(result.outcome.kind).toBe('victory');
    const kos = seen.filter((e) => e.type === 'ko').map((e) => (e as Extract<BattleEvent, { type: 'ko' }>).targetId);
    expect(kos, 'both foes were knocked out in turn').toEqual(expect.arrayContaining(['paragon', 'trema']));
    expect(seen.filter((e) => e.type === 'form-change'), 'the FFX-2 engine has no form change here: the freeze guard cannot fire').toEqual([]);
    const at = (s: string): number => port.log.indexOf(s);
    for (const [i, e] of port.log.entries()) if (e.startsWith('ending:')) expect(i, `${e} before the last link`).toBeGreaterThan(at('link:2'));
    expect(port.log.filter((e) => e === 'ending:freeze'), `the freeze, in ${port.log.join(',')}`).toHaveLength(1);
    expect(port.log.filter((e) => e === 'ending:title')).toHaveLength(1);
    expect(at('ending:freeze')).toBeLessThan(at('ending:title'));
    expect(port.clears).toBe(1);
    expect(port.log.lastIndexOf('clear')).toBeGreaterThan(at('link:2'));
    expect(port.log.lastIndexOf('clear')).toBeLessThan(at('ending:freeze'));
    expect(hudAtLinkStart).toEqual([1, 1]);
  }, 180_000);
});
