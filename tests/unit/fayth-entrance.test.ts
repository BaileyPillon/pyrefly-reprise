/**
 * **The boss entrance beside the shot-director seam** (r45-rc's E-PYRE, decision 61e, and the hidden Fayth chapter's director; merged 2026-10-13). Both change `BattleMoments.battleStart`:
 * the entrance lets the stage's held enemy and aeon figures in as the opening begins (`enterFigures`; nothing waits for it) and lands any that is still on its way when the opening ends
 * (`settleFigures`); the seam lets a scene's director take the opening's camera (`directed`). The figures are the stage's, not the camera's, so the two must not depend on each other.
 *
 * What it pins, on the real `BattleMoments` and a stage that holds its figures as `PaintedStage` does:
 *
 * 1. **Whatever the director does with the opening, the figures are let in once, as the party's walk on begins, and landed once when the opening ends.** No director (every other chapter), the stub that
 *    declines, a director that takes the opening (synchronously or by a promise), and a broken one (a rejected promise, a throw) all give the same entrance calls in the same places.
 * 2. **A skipped opening and a hurried one show the figures at once**, with the director or without.
 *
 * Game case: shared plumbing (both). The FFX chapter that publishes a director is pinned in `chapters/exp-fayth-scene.test.ts`; `entrance-census.test.ts` plays every chapter's figures.
 */
import { describe, expect, it } from 'vitest';

import { BattleMoments } from '../../src/engine/BattleMoments.ts';
import type { ArrivalClock, PlaybackSpeed } from '../../src/engine/BattlePresenterPorts.ts';
import type { ShotDirector } from '../../src/engine/ShotDirector.ts';
import { STUB_SHOT_DIRECTOR } from '../../src/engine/ffxcam/stubDirector.ts';
import { noSleep } from './helpers/FakeStage.ts';
import { DirectedStage } from './helpers/shotScript.ts';

/** A stage that holds its figures unseen, as `PaintedStage` does in a real fight: it logs when the opening lets them in and when the opening lands them. */
class HoldingStage extends DirectedStage {
  enter(clock: Pick<ArrivalClock, 'instant'>): Promise<void> {
    this.calls.push(`enter:${clock.instant ? 'instant' : 'normal'}`);
    return Promise.resolve();
  }
  settleEntrances(now = true): void {
    this.calls.push(`settle:${now ? 'now' : 'carry-on'}`);
  }
}

/** Play the opening of a fight (the party's walk on, the boss's reveal) and return everything the stage, the HUD and the camera were asked, in order. */
async function opening(opts: { director?: ShotDirector; speed?: PlaybackSpeed; hurry?: boolean } = {}): Promise<string[]> {
  const stage = new HoldingStage(['tidus', 'yuna'], ['evrae']);
  if (opts.director) stage.shotDirector = opts.director;
  const speed = opts.speed ?? 'normal';
  const moments = new BattleMoments({
    stage,
    hud: { setVisible: (visible: boolean) => void stage.calls.push(`hud:${visible}`) },
    sleep: noSleep,
    speed: () => speed,
  });
  if (opts.hurry) moments.hurry = true;
  await moments.battleStart({ partyIds: ['tidus', 'yuna'], bossId: 'evrae', bossName: 'Evrae' });
  return stage.calls;
}

const entranceCalls = (log: readonly string[]): string[] => log.filter((c) => c.startsWith('enter:') || c.startsWith('settle:'));

/** The opening's directors: none, one that declines, one that takes it, and three that fail in one way or another. */
const DIRECTORS: ReadonlyArray<readonly [string, ShotDirector | undefined]> = [
  ['no director (every chapter but the Fayth chapter)', undefined],
  ['the stub director, which declines the opening', STUB_SHOT_DIRECTOR],
  ['a director that takes the opening', { battleStart: () => true }],
  ['a director that takes the opening by a promise', { battleStart: () => Promise.resolve(true) }],
  ['a director whose promise is rejected', { battleStart: () => Promise.reject(new Error('a broken director')) }],
  [
    'a director that throws',
    {
      battleStart: (): never => {
        throw new Error('a broken director');
      },
    },
  ],
];

describe('the entrance does not depend on what the director does with the opening', () => {
  for (const [name, director] of DIRECTORS) {
    it(`${name}: the figures are let in once as the walk on begins, and landed once when the opening ends`, async () => {
      const log = await opening(director ? { director } : {});
      expect(entranceCalls(log)).toEqual(['enter:normal', 'settle:carry-on']);
      const walkOn = log.findIndex((c) => c.startsWith('moveTo:tidus'));
      expect(walkOn, 'the party walks on').toBeGreaterThan(-1);
      expect(log.indexOf('enter:normal')).toBeLessThan(log.indexOf('hud:false')); // the figures begin to come in as the opening does...
      expect(log.indexOf('hud:false')).toBeLessThan(walkOn); // ...before the party's first step
      expect(log.indexOf('settle:carry-on')).toBeGreaterThan(log.indexOf('hud:true')); // and the opening's end lands them after the HUD is back
      expect(log[log.length - 1]).toBe('settle:carry-on');
    });
  }
});

describe('a skipped or a hurried opening shows the figures at once', () => {
  for (const [name, director] of DIRECTORS) {
    it(`${name}: at skip speed they are let in instantly`, async () => {
      const log = await opening({ ...(director ? { director } : {}), speed: 'skip' });
      expect(log.filter((c) => c.startsWith('enter:'))).toEqual(['enter:instant']);
    });

    it(`${name}: in a hurried opening (a Confirm press) they are let in instantly and landed at once`, async () => {
      const log = await opening({ ...(director ? { director } : {}), hurry: true });
      expect(entranceCalls(log)).toEqual(['enter:instant', 'settle:now']);
    });
  }
});
