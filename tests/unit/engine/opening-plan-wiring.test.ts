/**
 * The wiring of the opening's wait for CHAPTER FRAMING's first plan (hard rule 4: built but wired to nothing; both games, shared opening plumbing):
 * `Framing.state` -> `arrivalOf` / `OpeningGate` (`opening-plan-gate.test.ts`) -> `framingPlanSettled()` (`fx/mix/MaxMix.ts`) -> the options `BattleScreen` gives `PaintedStage` -> `BattleStage.planSettled`
 * -> `settleOpening` (`presenter-opening-plan.test.ts`), and the same promise held under the battle-start card (`opening-card-until.test.ts`). This file holds the joints those do not: the REAL
 * `PaintedStage` forwards both options, the screen passes them in and gives the card its `until`, the presenter's `openOn` calls `settleOpening`, and with no mix bound nothing waits.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { makeStage } from '../helpers/EntranceCensus.ts'; // first: it installs the module mocks the census plays under
import { fxDebugHooks } from '../../../src/engine/fx/fxDebugHooks.ts';
import { framingArrivalOwed, framingPlanSettled } from '../../../src/engine/fx/mix/MaxMix.ts';

describe('PaintedStage forwards the opening\'s two questions', () => {
  it('planSettled and planArrivalOwed answer from the options the screen gives', async () => {
    let land!: () => void;
    const stage = makeStage(true, undefined, { planSettled: () => new Promise<void>((r) => (land = r)), arrivalOwed: () => true });
    let done = false;
    void stage.planSettled().then(() => void (done = true));
    await Promise.resolve();
    expect(done).toBe(false);
    land();
    await Promise.resolve();
    expect(done).toBe(true);
    expect(stage.planArrivalOwed()).toBe(true);
  });

  it('with no options (a stage with no framing) nothing waits and nothing is owed', async () => {
    const stage = makeStage(true);
    await expect(stage.planSettled()).resolves.toBeUndefined();
    expect(stage.planArrivalOwed()).toBe(false);
  });
});

describe('the screen and the presenter call them', () => {
  const screen = readFileSync('src/app/screens/BattleScreen.ts', 'utf8').replace(/\r\n/g, '\n');
  const presenter = readFileSync('src/engine/BattlePresenter.ts', 'utf8').replace(/\r\n/g, '\n');

  it('BattleScreen imports the three answers from the MAX mix, passes two of them to its PaintedStage and gives the battle-start card its `until`', () => {
    expect(screen).toMatch(/import \{[^}]*\bframingPlanSettled\b[^}]*\} from '\.\.\/\.\.\/engine\/fx\/mix\/MaxMix\.ts'/);
    const stageBlock = /this\.stage = new PaintedStage\(\{([\s\S]*?)\n    \}\);/.exec(screen);
    expect(stageBlock![1]).toMatch(/\bplanSettled: framingPlanSettled\b/);
    expect(stageBlock![1]).toMatch(/\barrivalOwed: framingArrivalOwed\b/);
    const banner = /new BattleStartBanner\(\{([\s\S]*?)\n    \}\);/.exec(screen);
    expect(banner, 'the screen builds its card in one literal').not.toBeNull();
    expect(banner![1]).toMatch(/\buntil: \(\) => this\.stage\?\.planSettled\(\)/);
  });

  it('BattlePresenter.openOn waits for the plan after the opening and before the loop asks for a decision', () => {
    const open = /private async openOn\([\s\S]*?\n  \}\n/.exec(presenter);
    expect(open, 'openOn is found').not.toBeNull();
    expect(open![0]).toMatch(/await playOpening\([\s\S]*?await settleOpening\(this\.ctx\)/);
    expect(presenter).toMatch(/await this\.openOn\(engine, link\.headline, link\.bossId\);\s*\n\s*\/\*\* Consecutive decisions/);
  });
});

describe('with no mix bound', () => {
  it('the opening waits for nothing and the camera owes nothing: a preview, FF7 and a stub scene', async () => {
    await expect(framingPlanSettled()).resolves.toBeUndefined();
    expect(framingArrivalOwed()).toBe(false);
  });

  it('the checks-only switch turns the wait off and on (the before and after proof of the Chapter IV race)', async () => {
    const api = fxDebugHooks['mix']!.api as { openingWait: (on: boolean) => void; trace: () => unknown };
    expect(typeof api.openingWait).toBe('function');
    api.openingWait(false);
    await expect(framingPlanSettled()).resolves.toBeUndefined();
    api.openingWait(true);
    expect(api.trace()).toBeNull(); // nothing bound
  });
});
