/**
 * LEBLANC'S THREE ACTS UNDER THE PRO STAGING (release 69, branch `booth-leblanc`; Chapter VI, `ffx2-leblanc`, FFX-2 only; the shared plumbing is both games). The review of `2b314637b` found (C1) that the victory beat
 * ran at every act seam: the quiet VICTORY title stayed up and the HUD stayed sunk to nothing for Acts II and III, because the layer is attached once and only `clear()` takes its ending marks back. And (M2) that the cheer's
 * length read the FFX table for an FFX-2 party.
 *
 * Pinned: the REAL chain (the real engines, presenter and chain loop) with a recording staging port that keeps the ending marks the way `EndingView` does. Acts I and II cue no title, no freeze and no pull-back and
 * hold today's beat; every act after the first starts with a cleared layer; the last act cues the one title; the HUD is in at the start of each act. And the cheer's floor reads the chapter's own game's table.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { getChapter } from '../../src/data/encounters.ts';
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
  setDemoChapter('ffx2-leblanc');
});
afterEach(() => {
  setTreatedScope(null);
  setStagingMode(null);
  setDemoChapter(undefined);
});

/** A bare presenter context for the pure beats: the party and one foe on the field, an optional port. */
function ctxOf(port: StagingPort, o: { moreLinks?: boolean; art?: Record<string, string> } = {}): EventCtx {
  const art = o.art ?? { yuna: 'yuna-gunner', rikku: 'rikku-thief', paine: 'paine-warrior' };
  return {
    deps: { staging: port },
    speed: () => 'normal',
    moments: { reducedMotion: false, reducedFlashes: false },
    stage: { staged: () => ['yuna', 'rikku', 'paine', 'ormi-entrance'], sideOf: (id: string) => (id === 'ormi-entrance' ? 'enemy' : 'party'), artOf: (id: string) => art[id] },
    menuOpen: () => false,
    ...(o.moreLinks === undefined ? {} : { moreLinks: o.moreLinks }),
    sleep: () => Promise.resolve(),
  } as unknown as EventCtx;
}

describe('the victory beat at a seam of a chain (C1)', () => {
  it('a link that chains on cues nothing and holds nothing beyond today\'s beat; the last link cues the title', () => {
    const port = new RecordingPort();
    const seam = ctxOf(port, { moreLinks: true });
    expect(stageVictory(seam, 'pose', 900)).toBe(0);
    expect(stageVictory(seam, 'hold', 900)).toBe(0);
    expect(port.log).toEqual([]);
    expect(port.hud()).toBe(1);
    const last = ctxOf(port, { moreLinks: false });
    expect(stageVictory(last, 'pose', 900)).toBeGreaterThanOrEqual(900);
    expect(port.log).toEqual(['ending:title']);
    expect(port.hud()).toBe(0); // the one title takes the HUD out for the results
  });

  it('the first link leaves the layer alone; every later link clears it, so no mark outlives its beat', () => {
    const port = new RecordingPort();
    const ctx = ctxOf(port, { moreLinks: false });
    stageLinkBegins(ctx);
    expect(port.clears).toBe(0);
    port.ending({ game: 'ffx2', scale: 1, calm: false, tame: false, kind: 'title', boss: 'x' });
    expect(port.hud()).toBe(0);
    stageLinkBegins(ctx);
    expect(port.clears).toBe(1);
    expect(port.hud()).toBe(1);
    stageLinkBegins(ctx);
    expect(port.clears).toBe(2);
  });
});

describe("the cheer's floor reads the chapter's own game (M2, hard rule 14)", () => {
  it("Leblanc's party reads the FFX-2 table by dress: Paine Warrior's 3,066.7 ms clip, not FFX Yuna's 3,200", () => {
    const port = new RecordingPort();
    expect(stageVictory(ctxOf(port), 'pose', 900)).toBeCloseTo(3066.7, 1);
  });

  it('a party with no decoded FFX-2 dress gives the floor (Yuna Gunner and Rikku Thief have no row)', () => {
    const port = new RecordingPort();
    const ctx = ctxOf(port, { art: { yuna: 'yuna-gunner', rikku: 'rikku-thief', paine: 'paine-thief' } });
    expect(stageVictory(ctx, 'pose', 900)).toBe(900);
  });

  it('an FFX chapter still reads the FFX table (Chapter I: Yuna\'s clip)', () => {
    setDemoChapter('seymour-flux');
    const port = new RecordingPort();
    const ctx = ctxOf(port, { art: { yuna: 'yuna', rikku: 'rikku-thief', paine: 'paine-warrior' } });
    expect(stageVictory(ctx, 'pose', 900)).toBe(3200);
  });
});

describe('the real chain: Chapter VI, three acts, one layer', () => {
  it('Acts I and II end without a title, every later act starts with a cleared layer, the last act cues the one title and the HUD is in at each act\'s start', async () => {
    const chapter = getChapter('ffx2-leblanc')!;
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
      onLink: ({ links }) => {
        port.log.push(`link:${links}`);
        // what the player still sees as the previous act's beat ends and the next act is about to open (`run` clears the layer after this): nothing sank the HUD at the seam
        hudAtLinkStart.push(port.hud());
      },
    });
    expect(result.outcome.kind).toBe('victory');
    expect(result.links).toBe(3);
    // the order of the whole chain: no ending cue before the third link, two clears (one per later link), the one title at the very end
    const at = (s: string) => port.log.indexOf(s);
    expect(port.log.filter((e) => e === 'ending:title')).toHaveLength(1);
    for (const [i, e] of port.log.entries()) if (e.startsWith('ending:')) expect(i, `${e} before the last act`).toBeGreaterThan(at('link:3')); // no freeze, title or pull-back at a seam: only the last act ends
    expect(at('ending:title')).toBeGreaterThan(at('link:3'));
    expect(port.clears).toBe(2);
    expect(at('clear')).toBeGreaterThan(at('link:2'));
    expect(port.log.lastIndexOf('clear')).toBeGreaterThan(at('link:3'));
    expect(port.log.lastIndexOf('clear')).toBeLessThan(at('ending:title'));
    // the HUD the player sees at each act's start is in (nothing sank it at a seam)
    expect(hudAtLinkStart).toEqual([1, 1, 1]);
  }, 60_000);
});
