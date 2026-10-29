/**
 * rigs-v3 (2026-10-29; both games, shared plumbing; Tidus FFX and Rikku's Dark Knight FFX-2 are the rigs it reaches, behind `?partyrigs=`): the KO and the revive of a rig drawn by pose play the painting set's
 * continuous fall and rise instead of a rigid turn and a cut to a lying drawing in mid-air (the clips of 2026-10-29: "the rig lands in about 3 frames by a cut from standing to lying").
 *
 * The REAL `RigActor` (a rig of Tidus's own idle painting) under the REAL `LivingFigure`, stepped the way the game steps it (`rigs-v3-fixture.ts`). What is read: the idle plane's roll (the rig's parts copy it every
 * frame: `RigFigure.sync`), the rig's key, and the head of the rig where the viewer sees it, before and after the cut.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { reset } from '../engine/head-lock-fixture.ts';
import { poseDrawnRig, rigged, stage } from './rigs-v3-fixture.ts';

const { TOPPLE_RAD } = await import('../../../src/engine/KoTip.ts');
const { setMoveWord } = await import('../../../src/engine/motion/MoveSwitch.ts');
const { setPace, setPaceGame } = await import('../../../src/engine/pace.ts');

afterEach(() => {
  reset();
  setMoveWord('kotopple', null);
  setPaceGame('other');
  setPace('steady');
});

describe('the fall of a rig drawn by pose is the painting set\'s: it tips, it slides, and the lying drawing comes in where the head already is', () => {
  it('the pieces tip with the idle plane toward the side the lying head is on, up to the painting set\'s 80 degrees, and the key stays the standing one until the cut', async () => {
    const s = stage(await rigged(poseDrawnRig(true)));
    s.a.setPose('ko');
    expect(s.key(), 'the request is the life layer only: no key move yet').toBe('idle');
    const rolls: number[] = [];
    let cutAt = -1;
    for (let i = 0; i < 40; i++) {
      s.frame();
      rolls.push(s.roll());
      if (cutAt < 0 && s.key() === 'ko') cutAt = i;
    }
    expect(cutAt, 'the cut happens after the hold (220 ms: 13 frames), in the 75 ms cross where the lying drawing overtakes the standing one (frame 16), not at the end of the run').toBeGreaterThanOrEqual(14);
    expect(cutAt).toBeLessThanOrEqual(16);
    const live = rolls.slice(0, cutAt);
    for (let i = 1; i < live.length; i++) expect(live[i]! * -1, `frame ${i}`).toBeGreaterThanOrEqual(live[i - 1]! * -1 - 1e-12); // clockwise (toward the right) is negative: it only turns further
    expect(Math.abs(live.at(-1)!)).toBeGreaterThan(0.85 * TOPPLE_RAD);
    expect(Math.abs(live.at(-1)!)).toBeLessThanOrEqual(TOPPLE_RAD + 1e-9);
    expect(live.at(-1)!, 'toward the right: the lying head is right of the feet').toBeLessThan(0);
    expect(rolls[cutAt], 'the plane is upright again from the cut').toBe(0);
    expect(rolls.at(-1)).toBe(0);
    expect(s.key()).toBe('ko');
  });

  it('the rig parts turn with the idle plane: the group they hang under has the plane roll on every frame of the fall, and none after the cut', async () => {
    const s = stage(await rigged(poseDrawnRig(true)));
    s.a.setPose('ko');
    let seen = 0;
    for (let i = 0; i < 30; i++) {
      s.frame();
      const group = s.a.figure.plane.rotation.z;
      expect(group, `frame ${i}`).toBeCloseTo(s.roll(), 9);
      if (Math.abs(group) > 0.5) seen++;
    }
    expect(seen, 'it was well over for a good part of the fall').toBeGreaterThanOrEqual(5);
    expect(s.a.figure.plane.rotation.z).toBeCloseTo(0, 12);
  });

  it('a head that lies on the left tips the other way', async () => {
    const s = stage(await rigged(poseDrawnRig(false)));
    s.a.setPose('ko');
    s.frame(12);
    expect(s.roll()).toBeGreaterThan(0.3);
  });

  it('there is no cut from standing to lying: the head of the figure is where the lying head is on the frame the key changes (a few percent of its height, not the 40 px the rigid turn left hanging)', async () => {
    const s = stage(await rigged(poseDrawnRig(true)));
    s.a.setPose('ko');
    let before = Number.NaN, after = Number.NaN;
    for (let i = 0; i < 40 && Number.isNaN(after); i++) {
      const was = s.key();
      const headBefore = s.head();
      s.frame();
      if (was !== 'ko' && s.key() === 'ko') { before = headBefore; after = s.head(); }
    }
    expect(Number.isNaN(after)).toBe(false);
    expect(Math.abs(after - before), 'world units; the figure is 1.82 tall').toBeLessThan(0.12);
  });

  it('the head never steps more than a fifteenth of the figure height in a frame, across the whole fall (the rigid turn and its cut hung the lying figure in the air for several frames)', async () => {
    const s = stage(await rigged(poseDrawnRig(true)));
    s.a.setPose('ko');
    let prev = s.head();
    let worst = 0;
    for (let i = 0; i < 60; i++) { s.frame(); worst = Math.max(worst, Math.abs(s.head() - prev)); prev = s.head(); }
    expect(worst).toBeLessThan(1.82 / 15);
  });

  it('the generic fall is off while the run plays (the run is the whole fall) and on again after a revive', async () => {
    const s = stage(await rigged(poseDrawnRig(true)));
    s.a.setPose('ko');
    s.frame(3);
    expect((s.a as unknown as { fallGain: number }).fallGain).toBe(0);
    s.frame(40);
    s.a.setPose('idle');
    s.frame(40);
    expect((s.a as unknown as { fallGain: number }).fallGain).toBe(1);
  });

  it('REDUCE MOTION keeps the rig\'s own ko key move (the painting set cuts under it: the run is not played), and `?kofall` follows the painting set too', async () => {
    const s = stage(await rigged(poseDrawnRig(true)), { rm: true });
    s.a.setPose('ko');
    expect(s.key(), 'the key move is asked for at once, as before').toBe('ko');
    s.frame(5);
    expect(s.roll()).toBe(0);
  });

  it('a rig whose ko key is bones only (Lulu\'s kind: the idle\'s pieces bent) plays its own key move as before, and a boss side is not toppled', async () => {
    const lulu = stage(await rigged(poseDrawnRig(true, false)));
    expect(lulu.a.rigKo).toBeNull();
    lulu.a.setPose('ko');
    expect(lulu.key()).toBe('ko');
    const boss = stage(await rigged(poseDrawnRig(true), 'enemy'));
    expect(boss.a.poseDrawnParty).toBe(false);
    boss.a.setPose('ko');
    expect(boss.key()).toBe('ko');
  });
});

describe('the revive of a rig drawn by pose is the fall backwards: the lying drawing crosses to the standing one already toppled where the body lay, which stands up', () => {
  it('the key stays ko for the first half of the 75 ms cross, then the standing key is drawn toppled and rises to upright, the roll only shrinking', async () => {
    const s = stage(await rigged(poseDrawnRig(true)));
    s.a.setPose('ko');
    s.frame(40);
    expect(s.key()).toBe('ko');
    s.a.setPose('idle');
    expect(s.key(), 'the life layer rose; the lying drawing stays up until the cut').toBe('ko');
    const rolls: number[] = [];
    let cutAt = -1;
    for (let i = 0; i < 40; i++) {
      s.frame();
      rolls.push(s.roll());
      if (cutAt < 0 && s.key() === 'idle') cutAt = i;
    }
    expect(cutAt).toBeGreaterThanOrEqual(0);
    expect(cutAt).toBeLessThanOrEqual(4);
    expect(Math.abs(rolls[cutAt]!), 'toppled where it lay at the cut').toBeGreaterThan(0.6 * TOPPLE_RAD);
    const rise = rolls.slice(cutAt).map(Math.abs);
    for (let i = 1; i < rise.length; i++) expect(rise[i]!, `frame ${i}`).toBeLessThanOrEqual(rise[i - 1]! + 1e-12);
    expect(rolls.at(-1)).toBe(0);
    expect(s.key()).toBe('idle');
    expect(s.a.lifeState).toBe('idle');
  });

  it('the head does not jump at the cut of a revive either', async () => {
    const s = stage(await rigged(poseDrawnRig(true)));
    s.a.setPose('ko');
    s.frame(40);
    s.a.setPose('idle');
    let before = Number.NaN, after = Number.NaN;
    for (let i = 0; i < 12 && Number.isNaN(after); i++) {
      const was = s.key();
      const headBefore = s.head();
      s.frame();
      if (was === 'ko' && s.key() === 'idle') { before = headBefore; after = s.head(); }
    }
    expect(Number.isNaN(after)).toBe(false);
    expect(Math.abs(after - before)).toBeLessThan(0.12);
  });

  it('a revive that comes before the fall has ended ends it where it stands (the key is ko, the plane upright) and then plays', async () => {
    const s = stage(await rigged(poseDrawnRig(true)));
    s.a.setPose('ko');
    s.frame(6);
    expect(s.key()).toBe('idle');
    s.a.setPose('idle');
    expect(s.key(), 'the fall that was cut short ends in its key, then the revive starts from the lying drawing').toBe('ko');
    s.frame(40);
    expect(s.key()).toBe('idle');
    expect(s.roll()).toBe(0);
    expect(s.a.lifeState).toBe('idle');
  });
});
