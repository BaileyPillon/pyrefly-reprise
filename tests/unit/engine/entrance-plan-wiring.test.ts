/**
 * FOC44A-05's wiring (hard rule 4: built but wired to nothing): CHAPTER FRAMING's `planOwed` reaches the boss entrance in the game.
 *
 * The chain, end to end: `Framing.planOwed` (`entrance-plan-framing.test.ts`) -> `framingPlanOwed()` (`fx/mix/MaxMix.ts`) -> the option `BattleScreen` gives `PaintedStage` (`planOwed: framingPlanOwed`)
 * -> the host `PaintedStage.setEntrances` builds for `StageEntrances` (`entrance-plan-owed.test.ts`). This file holds the three joints the other two do not: the REAL `PaintedStage` (the census's harness,
 * figures stood in by recorders) forwards its option to the entrance and forces everything in when it is switched off; the screen's source passes the function in; and with no mix bound the answer
 * is "not owed", so a preview, FF7 and a stub scene hold nothing for a plan that will never come.
 * Game case: FFX-2 only for the figure (Chapter XIII's Paragon, the one measured to step); the wiring is shared plumbing.
 */
import { describe, expect, it } from 'vitest';
import { built, clock, advance, makeStage, running, stageCalls } from '../helpers/EntranceCensus.ts'; // first: it installs the module mocks the census plays under
import { CHAPTERS } from '../../../src/data/encounters.ts';
import { FFX2Engine } from '../../../src/battle/ffx2/index.ts';
import { ffx2EngineOptions, registerBattleContent } from '../../../src/app/screens/BattleScreenContent.ts';
import { setupForChapter } from '../../../src/app/screens/BattleScreenSetup.ts';
import { framingPlanOwed } from '../../../src/engine/fx/mix/MaxMix.ts';
import { battleScreenSource } from '../helpers/battleScreenSource.ts';

/** Chapter XIII's opening state: three girls and Paragon. */
async function chapterXIII(): Promise<ReturnType<FFX2Engine['state']>> {
  await registerBattleContent();
  const chapter = CHAPTERS.find((c) => c.id === 'ffx2-trema')!;
  const setup = setupForChapter(chapter, 1);
  const engine = new FFX2Engine({ ...ffx2EngineOptions(), minigames: false });
  engine.setSeed(setup.seed);
  engine.init(setup);
  return engine.state();
}

const reset = (): void => {
  built.length = 0;
  stageCalls.n = 0;
  clock.now = 0;
};
const bosses = (): typeof built => built.filter((b) => b.viaStage && (b.side === 'enemy' || b.side === 'aeon'));

describe('PaintedStage hands its option to the entrance', () => {
  it('with the plan owed the opening lets no figure begin, however long it runs; once the plan has landed they begin', async () => {
    reset();
    const owed = { on: true };
    const stage = makeStage(true, undefined, { planOwed: () => owed.on });
    running.stage = stage;
    await stage.stage(await chapterXIII());
    expect(bosses().map((b) => b.id)).toContain('paragon');
    expect(stage.entranceSnapshot().held).toContain('paragon');
    void stage.enter({ instant: false });
    advance(stage, 2600); // longer than the 900 ms gate and the opening's 1.6 s patience, shorter than the 3 s ceiling
    expect(stage.entranceSnapshot().playing).toEqual([]);
    expect(stage.entranceSnapshot().held).toContain('paragon');
    for (const b of bosses()) expect(b.actor.alphaAt(clock.now), `${b.id} is still unseen`).toBeLessThan(0.02);
    owed.on = false; // CHAPTER FRAMING's plan has landed
    advance(stage, 100);
    expect(stage.entranceSnapshot().playing.map((p) => p.id)).toContain('paragon');
  });

  it('with no option (a stage with no framing) nothing waits: the gate is the age and the stillness, as it was', async () => {
    reset();
    const stage = makeStage(true);
    running.stage = stage;
    await stage.stage(await chapterXIII());
    advance(stage, 1200); // older than the gate, nothing owed
    void stage.enter({ instant: false });
    advance(stage, 100);
    expect(stage.entranceSnapshot().playing.map((p) => p.id)).toContain('paragon');
  });

  it('switching the entrances off puts every figure on the field at once, plan or no plan (a preview, FF7: nothing may be left unseen)', async () => {
    reset();
    const stage = makeStage(true, undefined, { planOwed: () => true });
    running.stage = stage;
    await stage.stage(await chapterXIII());
    void stage.enter({ instant: true }); // a hurried opening: held, for the plan is owed
    advance(stage, 300);
    expect(stage.entranceSnapshot().held).toContain('paragon');
    stage.setEntrances(false);
    expect(stage.entranceSnapshot()).toEqual({ held: [], playing: [] });
    for (const b of bosses()) {
      expect(b.actor.alphaAt(clock.now), `${b.id} is on the field`).toBe(1);
      expect(b.actor.dissolveAt(clock.now)).toBe(0);
    }
  });
});

describe('the battle screen gives the stage the framing\'s answer', () => {
  const src = battleScreenSource();
  it('imports `framingPlanOwed` from the MAX mix and passes it as the stage\'s `planOwed`', () => {
    expect(src).toMatch(/import \{[^}]*\bframingPlanOwed\b[^}]*\} from '\.\.\/\.\.\/engine\/fx\/mix\/MaxMix\.ts'/);
    const stageBlock = /this\.stage = new PaintedStage\(\{([\s\S]*?)\n    \}\);/.exec(src);
    expect(stageBlock, 'the screen builds its PaintedStage in one literal').not.toBeNull();
    expect(stageBlock![1]).toMatch(/\bplanOwed: framingPlanOwed\b/);
  });

  it('turns the entrances on only for a real fight of FFX or FFX-2, the only fights a framing plan can come to', () => {
    expect(src).toMatch(/this\.stage\.setEntrances\(!this\.preview && chapter\.game !== 'ff7'\)/);
  });
});

describe('framingPlanOwed with nothing bound', () => {
  it('is false (no mix, so no plan is coming): a preview, FF7 and a stub scene hold nothing for it', () => {
    expect(framingPlanOwed()).toBe(false);
  });
});
