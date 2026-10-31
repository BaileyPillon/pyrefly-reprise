/**
 * YUNALESCA'S THREE FORMS UNDER THE PRO STAGING (release 69, branch `booth-ffx-yunalesca`; Chapter II, `yunalesca`, FFX only). The chapter is the first FFX widening beyond Chapter I, and the only FFX chapter in the list whose one foe changes its painting
 * inside one fight (`yunalesca-1/2/3`, `PaintedStage.setArt` at each `form-change`) and whose victory is the `hold` kind (Zanarkand: nobody poses, `research/ffx-vs-ffx2-presentation.md` section 2.1). This is the form-change test the chain test
 * (`booth-leblanc-chain`) is for Chapter VI's three acts: the real engine and presenter, the scene's own party and the shipped tactic, and a recording staging port that keeps the ending marks the way `EndingView` does.
 *
 * Pinned: the two form changes cue no freeze, no title and no HUD-out (a lone foe that "dies" into its next form must not read as the last foe); the last blow freezes once, the quiet title comes once, the silent pull-back follows it (the `hold` kind),
 * the FFX Overdrive opening plays for her party and no FFX-2 Change plate ever does; nothing of hers is a held breath; and a defeat names the foe's last move on the card.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { BattleEvent } from '../../src/battle/common/types.ts';
import { getChapter } from '../../src/data/encounters.ts';
import { BattlePresenter } from '../../src/engine/BattlePresenter.ts';
import { intendedStrategy } from '../../src/engine/BattlePresenterStrategies.ts';
import { stageFreeze } from '../../src/engine/BattlePresenterStaging.ts';
import type { EventCtx } from '../../src/engine/BattlePresenterEvents.ts';
import { FFXEngine } from '../../src/battle/ffx/engine.ts';
import { registerBattleContent } from '../../src/app/screens/BattleScreenContent.ts';
import { setupForChapter } from '../../src/app/screens/BattleScreenSetup.ts';
import { setDemoChapter, setTreatedScope } from '../../src/engine/motion/DemoGate.ts';
import { setStagingMode } from '../../src/engine/pro/staging/StagingSwitch.ts';
import { setPace, setPaceGame } from '../../src/engine/pace.ts';
import { takeDefeatNote } from '../../src/engine/pro/staging/DefeatNote.ts';
import { emptyEnd, endFrame, type EndMarks } from '../../src/engine/pro/staging/EndingPlan.ts';
import type { BreathCue, EndingCue, OpeningCue, StagingPort } from '../../src/engine/pro/staging/StagingPort.ts';
import { FakeAudio, FakeDamageNumbers, FakeMessageBar, FakeStage } from './helpers/FakeStage.ts';
import { setCappedAutoPlay } from './helpers/presenterCap.ts';

/** A staging port that keeps what `EndingView` keeps (the marks), so the test reads what the player would see: `hud` is the HUD's opacity a minute after the last cue. */
class RecordingPort implements StagingPort {
  readonly log: string[] = [];
  marks: EndMarks = emptyEnd();
  breath(cue: BreathCue): void {
    this.log.push(`breath:${cue.kind}`);
  }
  opening(cue: OpeningCue): void {
    this.log.push(`opening:${cue.kind}`);
  }
  ending(cue: EndingCue): void {
    this.log.push(`ending:${cue.kind}`);
    if (cue.kind === 'freeze') this.marks.freezeAt = 0;
    else if (cue.kind === 'title') this.marks.titleAt = 0;
    else if (cue.kind === 'pullback') this.marks.pullAt = 0;
    else if (cue.kind === 'fall') this.marks.fallAt = 0;
  }
  clear(): void {
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
  setDemoChapter('yunalesca');
  setPaceGame('ffx');
  setPace('steady');
  takeDefeatNote();
});
afterEach(() => {
  setTreatedScope(null);
  setStagingMode(null);
  setDemoChapter(undefined);
  setPaceGame('other');
  takeDefeatNote();
});

describe('the real fight: three forms, one foe', () => {
  it('a Chapter II fight with the shipped tactic wins; the two form changes cue no ending beat and leave the HUD in; the last blow freezes once, the quiet title comes once, the silent pull-back follows; no Change plate, no held breath', async () => {
    const chapter = getChapter('yunalesca')!;
    const setup = setupForChapter(chapter, 1);
    await registerBattleContent();
    const engine = new FFXEngine({ autoResolveMinigames: true });
    engine.setSeed(setup.seed);
    engine.init(setup);
    const port = new RecordingPort();
    const stage = new FakeStage(setup.party.members.map((m) => m.id), chapter.enemyGroupRef.enemies.map((e) => e.id));
    // what the player sees at the instant a form's painting is swapped: the ending cues so far, and the HUD
    const atSwap: Array<{ art: string; ending: string[]; hud: number }> = [];
    const realSetArt = stage.setArt.bind(stage);
    stage.setArt = async (id: string, art: string): Promise<void> => {
      atSwap.push({ art, ending: port.log.filter((e) => e.startsWith('ending:')), hud: port.hud() });
      return realSetArt(id, art);
    };
    const presenter = new BattlePresenter({ stage, audio: new FakeAudio(), sleep: () => Promise.resolve(), staging: port, victoryPose: 'hold' });
    presenter.setSpeed('normal');
    const cap = setCappedAutoPlay(presenter, intendedStrategy);
    const out = await presenter.run(engine, {});
    expect(out.kind, `decisions ${cap.decisions()}, capped ${cap.capped()}`).toBe('victory');

    // two form changes, the second and third paintings, each with no ending cue yet and the HUD fully in
    expect(atSwap.map((s) => s.art)).toEqual(['yunalesca-2', 'yunalesca-3']);
    for (const s of atSwap) {
      expect(s.ending, s.art).toEqual([]);
      expect(s.hud, s.art).toBe(1);
    }
    // the whole fight's ending beats: one freeze, one title, one pull-back, in that order, and nothing after
    const ending = port.log.filter((e) => e.startsWith('ending:'));
    expect(ending).toEqual(['ending:freeze', 'ending:title', 'ending:pullback']);
    expect(port.log.at(-1)).toBe('ending:pullback');
    expect(port.hud()).toBe(0); // the title took the HUD out for the results (the pull-back is the transition into them)
    // the FFX Overdrive opening plays for her party (an FFX-only branch, T14); the FFX-2 Change plate never does; no move of hers is a held breath
    expect(port.log.filter((e) => e === 'opening:overdrive').length).toBeGreaterThan(0);
    expect(port.log.filter((e) => e === 'opening:change')).toEqual([]);
    expect(port.log.filter((e) => e.startsWith('breath:'))).toEqual([]);
  }, 120_000);
});

describe('a defeat in Chapter II', () => {
  it("names the foe's last move on the card (the FFX defeat card of Chapter I, in her chapter too) and drops the dim and the caption in", async () => {
    const port = new RecordingPort();
    const stage = new FakeStage(['tidus', 'yuna', 'auron'], ['yunalesca']);
    const presenter = new BattlePresenter({ stage, damageNumbers: new FakeDamageNumbers(), messageBar: new FakeMessageBar(), sleep: () => Promise.resolve(), staging: port, victoryPose: 'hold' });
    presenter.setSpeed('normal');
    const seq = (e: Record<string, unknown>, i: number): BattleEvent => ({ ...e, seq: i }) as unknown as BattleEvent;
    await presenter.play([
      seq({ type: 'action-start', actorId: 'yunalesca', command: { kind: 'ability' }, abilityId: 'mega-death', abilityName: 'Mega Death', targets: ['tidus'] }, 0),
      seq({ type: 'action-end', actorId: 'yunalesca' }, 1),
      seq({ type: 'defeat', result: {} }, 2),
    ]);
    expect(takeDefeatNote()).toEqual({ cause: 'Mega Death' });
    expect(port.log.at(-1)).toBe('ending:fall');
  });
});

describe('a foe that falls into its next form is never the last blow (review m7: the presenter no longer leans on the engine for it)', () => {
  /** A bare presenter context for the pure beat `stageFreeze`: the party and the named foes on the field, and the burst the test chooses with the event in hand at `at`. */
  function ctxOf(port: StagingPort, foes: string[], events: BattleEvent[], at: number): EventCtx {
    return {
      deps: { staging: port },
      speed: () => 'normal',
      moments: { reducedMotion: false, reducedFlashes: false },
      stage: { staged: () => ['tidus', 'yuna', 'auron', ...foes], sideOf: (id: string) => (foes.includes(id) ? 'enemy' : 'party') },
      menuOpen: () => false,
      burst: { events, at },
      sleep: () => Promise.resolve(),
    } as unknown as EventCtx;
  }
  const ko = (targetId: string, seq: number): BattleEvent => ({ type: 'ko', targetId, seq }) as unknown as BattleEvent;
  const formChange = (enemyId: string, seq: number): BattleEvent => ({ type: 'form-change', enemyId, formIndex: 1, name: 'Yunalesca', spriteKey: 'yunalesca-2', seq }) as unknown as BattleEvent;
  const victory = (seq: number): BattleEvent => ({ type: 'victory', result: {}, seq }) as unknown as BattleEvent;

  it("a `ko` followed in the same burst by the SAME foe's `form-change` cues nothing and holds nothing, although the field has no other foe", () => {
    const port = new RecordingPort();
    const events = [ko('yunalesca', 0), formChange('yunalesca', 1)];
    expect(stageFreeze(ctxOf(port, ['yunalesca'], events, 0), 'yunalesca')).toBeUndefined();
    expect(port.log).toEqual([]);
    expect(port.hud()).toBe(1); // the HUD stays in
  });

  it('controls: the same `ko` before the `victory` is the last blow (one freeze, and the presenter waits); a `form-change` of ANOTHER foe does not stop the freeze; so the guard reads the id, not the event kind', async () => {
    const last = new RecordingPort();
    const wait = stageFreeze(ctxOf(last, ['yunalesca'], [ko('yunalesca', 0), victory(1)], 0), 'yunalesca');
    expect(wait).toBeInstanceOf(Promise);
    await wait;
    expect(last.log).toEqual(['ending:freeze']);

    const other = new RecordingPort();
    const wait2 = stageFreeze(ctxOf(other, ['yunalesca', 'guado-guardian'], [ko('guado-guardian', 0), formChange('yunalesca', 1), victory(2)], 0), 'guado-guardian');
    expect(wait2).toBeInstanceOf(Promise);
    await wait2;
    expect(other.log).toEqual(['ending:freeze']);
  });

  it("the guard reads only what comes AFTER the `ko` in hand (review of booth-b2, m3): an EARLIER `form-change` of the same foe in the burst does not block the last blow, with a `victory` after it or with the foe alone on the field", async () => {
    const withVictory = new RecordingPort();
    const wait = stageFreeze(ctxOf(withVictory, ['yunalesca'], [formChange('yunalesca', 0), ko('yunalesca', 1), victory(2)], 1), 'yunalesca');
    expect(wait).toBeInstanceOf(Promise);
    await wait;
    expect(withVictory.log).toEqual(['ending:freeze']);

    const alone = new RecordingPort();
    const wait2 = stageFreeze(ctxOf(alone, ['yunalesca'], [formChange('yunalesca', 0), ko('yunalesca', 1)], 1), 'yunalesca');
    expect(wait2).toBeInstanceOf(Promise);
    await wait2;
    expect(alone.log).toEqual(['ending:freeze']);

    // and the same burst with the `form-change` AFTER the `ko` still holds nothing (the m7 guard, unchanged)
    const after = new RecordingPort();
    expect(stageFreeze(ctxOf(after, ['yunalesca'], [ko('yunalesca', 0), formChange('yunalesca', 1), victory(2)], 0), 'yunalesca')).toBeUndefined();
    expect(after.log).toEqual([]);
  });
});
