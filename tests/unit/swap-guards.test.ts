/**
 * The guards of the swap lane (motion-fluidity pass, lane L1; both games): a cut on its cause is not made across two heads 0.4 of the figure's height apart (Yunalesca's attack to cast read 133 px in one frame),
 * and the two logs the continuity harness reads at the end of a fight hold a whole ten-minute fight (Yunalesca plans about 400 cuts: a log of 400 dropped the first ones, which the harness then read as snaps).
 */
import { afterEach, describe, expect, it } from 'vitest';
import { CAUSE_MAX_ANCHOR, causeCutPlan, causeCutTooFar } from '../../src/engine/motion/SmearPlan.ts';
import { noteSmear, resetSmearLog, smearLog } from '../../src/engine/motion/SmearLog.ts';
import { noteDesigned, noteReason, resetSwapLog, swapLog } from '../../src/engine/motion/SwapLog.ts';
import { SWAP_CLASSES, classesFromSearch } from '../../src/engine/motion/SwapSwitch.ts';
import { installPoseSwapDebug } from '../../src/debug/poseSwapApi.ts';
import { installSmearDebug } from '../../src/debug/smearApi.ts';

afterEach(() => {
  resetSmearLog();
  resetSwapLog();
});

describe('causeCutTooFar', () => {
  it('is false for a pair the pack chapters cut (the largest seen is 0.37) and for an unknown distance', () => {
    expect(CAUSE_MAX_ANCHOR).toBe(0.4);
    expect(causeCutTooFar(0.37)).toBe(false);
    expect(causeCutTooFar(0.1)).toBe(false);
    expect(causeCutTooFar(null)).toBe(false);
    expect(causeCutTooFar(Number.NaN)).toBe(false);
  });

  it('is true from 0.4 of the height up (Yunalesca attack to cast, 0.44)', () => {
    expect(causeCutTooFar(0.4)).toBe(true);
    expect(causeCutTooFar(0.44)).toBe(true);
  });

  it('does not change the plan of a pair that is not too far: the cut plan itself is the same function as before', () => {
    const plan = causeCutPlan({ from: 'idle', to: 'hurt', overlap: 0.2, anchorDistance: 0.3, speed: 0, frameMs: 16.7, style: 'paint' });
    expect(plan).not.toBeNull();
  });
});

describe('the logs hold a whole long fight', () => {
  it('the planned-smear log keeps 1,500 cuts, oldest first', () => {
    for (let i = 0; i < 1500; i++) noteSmear({ at: i, actor: 'tidus', from: 'idle', to: 'hurt', style: 'paint', cutMs: 30, overlap: 0.2, anchorDistance: 0.2, speed: 0, strength: 0.5, flash: false, kind: 'plane' });
    const log = smearLog();
    expect(log).toHaveLength(1500);
    expect(log[0]!.at).toBe(0);
  });

  it('the swap log keeps 1,500 reasons and 1,500 designed blends', () => {
    for (let i = 0; i < 1500; i++) {
      noteReason('yuna', 'ready', 'menu', 'idle');
      noteDesigned({ actor: 'yuna', from: 'hurt', to: 'idle', cls: 'recover', ms: 50 });
    }
    const l = swapLog();
    expect(l.reasons).toHaveLength(1500);
    expect(l.designed).toHaveLength(1500);
  });
});

describe('review F-6: the classes word', () => {
  it('names the classes it lists, every class when the word is not given, and NONE when it names none that exist (a typo is not "everything")', () => {
    expect([...classesFromSearch('?swapclass=hit,glow')].sort()).toEqual(['glow', 'hit']);
    expect([...classesFromSearch('')].sort()).toEqual([...SWAP_CLASSES].sort());
    expect([...classesFromSearch('?swapclass=')].sort()).toEqual([...SWAP_CLASSES].sort());
    expect([...classesFromSearch('?swapclass=hitt')]).toEqual([]);
    expect([...classesFromSearch('?swapclass=hitt,nonsense')]).toEqual([]);
    expect([...classesFromSearch('?swapclass=hit,nonsense')]).toEqual(['hit']);
  });
});

describe('review F-2: the new debug reader does not replace the older swapLog()', () => {
  it('swapLog() stays the ?swap=aligned record (an array); the fluidity record is swapReasons()', () => {
    const api: Record<string, unknown> = {};
    installPoseSwapDebug(api); // main.ts installs the two in this order
    installSmearDebug(api);
    const f = api as Record<string, (...a: unknown[]) => unknown>;
    expect(f['swapLog']!()).toEqual([]);
    expect(f['swapReasons']!()).toEqual({ reasons: [], designed: [] });
    noteReason('yuna', 'ready', 'menu', 'idle');
    expect((f['swapReasons']!() as { reasons: unknown[] }).reasons).toHaveLength(1);
    expect(f['swapReasons']!(true)).toMatchObject({ reasons: [expect.objectContaining({ actor: 'yuna' })] });
    expect(f['swapReasons']!()).toEqual({ reasons: [], designed: [] });
    expect(f['swapLog']!()).toEqual([]);
  });
});
