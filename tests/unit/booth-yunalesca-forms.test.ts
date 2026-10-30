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
