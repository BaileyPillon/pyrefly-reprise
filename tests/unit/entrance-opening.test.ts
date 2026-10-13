/**
 * The opening lets the held figures in and never waits for them (`BattleMoments.battleStart`; decision 61e; both games, shared plumbing).
 *
 * The stage holds each enemy and aeon figure unseen (`StageEntrances.ts`); the opening's first beat tells it to let them in (`BattleStage.enter`) and nothing awaits the answer, so the
 * entrance plays inside the party's slide-in, the hold and the reveal's push and adds no time before the first menu. A hurried or skipped opening lands the figures at once, and an
 * ordinary one's end lets an entrance still on its way finish beside the first menu (`settleEntrances`).
 */
import { describe, expect, it } from 'vitest';
import { BattleMoments } from '../../src/engine/BattleMoments.ts';
import type { ArrivalClock, PlaybackSpeed } from '../../src/engine/BattlePresenterPorts.ts';
import { FakeStage, noSleep } from './helpers/FakeStage.ts';

class EntranceStage extends FakeStage {
  readonly enters: Array<Pick<ArrivalClock, 'instant'>> = [];
  readonly settles: boolean[] = [];
  throwOnEnter = false;
  /** A promise that never settles: the entrance that is "still playing" when the opening ends. */
  enter(clock: Pick<ArrivalClock, 'instant'>): Promise<void> {
    if (this.throwOnEnter) throw new Error('a stage that cannot let figures in');
    this.enters.push(clock);
    this.calls.push(`enter:${clock.instant ? 'instant' : 'play'}`);
    return new Promise<void>(() => undefined);
  }
  settleEntrances(now?: boolean): void {
    this.settles.push(now === true);
    this.calls.push(`settle:${now === true ? 'now' : 'carry-on'}`);
  }
}

function setup(speed: PlaybackSpeed = 'normal') {
  const stage = new EntranceStage(['tidus', 'yuna'], ['yunalesca']);
  const moments = new BattleMoments({ stage, sleep: noSleep, speed: () => speed });
  return { stage, moments };
}

const OPEN = { partyIds: ['tidus', 'yuna'], bossId: 'yunalesca', bossName: 'Lady Yunalesca' } as const;

describe('the opening and the entrances', () => {
  it('lets the held figures in before anything else of the opening is played, and carries on whatever their promise does: it never waits for them', async () => {
    const { stage, moments } = setup();
    await moments.battleStart(OPEN); // resolves although `enter`'s promise never does
    expect(stage.enters).toEqual([{ instant: false }]);
    // the entrance is the opening's first beat: after the camera's cut to the intro, before the party's slide and the reveal
    const calls = stage.calls;
    const at = calls.indexOf('enter:play');
    expect(at).toBeGreaterThanOrEqual(0);
    expect(calls.slice(0, at).every((c) => c.startsWith('camera'))).toBe(true);
    expect(calls.slice(at + 1).some((c) => c.startsWith('camera'))).toBe(true); // the opening went on after it
  });

  it('an ordinary opening ends by letting an entrance still on its way carry on (not by cutting it short)', async () => {
    const { stage, moments } = setup();
    await moments.battleStart(OPEN);
    expect(stage.settles).toEqual([false]);
  });

  it('a hurried opening (a Confirm press, `hurry`) lets the figures in at once and lands them at its end', async () => {
    const { stage, moments } = setup();
    moments.hurry = true;
    await moments.battleStart(OPEN);
    expect(stage.enters).toEqual([{ instant: true }]);
    expect(stage.settles).toEqual([true]);
  });

  it("a skipped run (`'skip'`: the e2e and the critic) shows the figures at once and plays nothing", async () => {
    const { stage, moments } = setup('skip');
    await moments.battleStart(OPEN);
    expect(stage.enters).toEqual([{ instant: true }]);
  });

  it('a stage that throws is a stage that shows its figures: the opening plays on, and the figures are landed', async () => {
    const { stage, moments } = setup();
    stage.throwOnEnter = true;
    await expect(moments.battleStart(OPEN)).resolves.toBeUndefined();
    expect(stage.settles[0]).toBe(true);
  });

  it("a stage with no entrances (a fake, a preview, FF7) is left exactly as it was: no call, no wait", async () => {
    const stage = new FakeStage(['tidus', 'yuna'], ['yunalesca']);
    const moments = new BattleMoments({ stage, sleep: noSleep, speed: () => 'normal' });
    await expect(moments.battleStart(OPEN)).resolves.toBeUndefined();
    expect(stage.calls.some((c) => c.startsWith('enter') || c.startsWith('settle'))).toBe(false);
  });
});
