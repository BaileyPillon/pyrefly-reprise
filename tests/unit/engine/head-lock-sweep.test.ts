/**
 * **Every registered figure can be held** (D-510, lane r394-headlock; both games). The real `PaintedActor` and the real generated table, one figure
 * at a time: the idle, then each pose that has a head box put up beside it, under the stage cameras of the evidence (perspective 0.98 to 1.10; see
 * `head-lock-fixture.ts` for how they are read). The lock asks a few percent of a pose, never the band's edge: a head box that needs 0.9 or 1.1 is a
 * bad reading (or a pose whose scale was meant to differ from its head: the stature gate keeps its own, `tools/posescale/measure.py`), and the
 * clamp that reports it is a failure here, in the data, before it is a clamp hit on a player's screen.
 * (The Macalania victory camera, perspective 1.17 to 1.23, asks up to 1.102 of three poses that never stand under it: Rikku Gunner's and Yuna Gunner's
 * KO and Rikku Lady Luck's attack. The band holds them at 1.1 and says so; Phase 2 reads the counters on the real camera.)
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PaintedActor, POSE_REGISTRATION, cameraWithPerspective, frame, painting, reset, slotsOf } from './head-lock-fixture.ts';

afterEach(reset);

describe('the lock over every registered pose', () => {
  it('holds every pose of every figure with a head box inside the band, at every camera of the evidence', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const cams = [0.98, 1.0, 1.04, 1.1].map((p) => cameraWithPerspective(p));
    const asked: number[] = [];
    const hit: string[] = [];
    let subjects = 0;
    for (const [subject, poses] of Object.entries(POSE_REGISTRATION)) {
      if (!poses['idle']?.head) continue;
      subjects++;
      for (const pose of Object.keys(poses)) {
        if (pose === 'idle' || !poses[pose]!.head || pose.startsWith('twirl-')) continue;
        for (const cam of cams) {
          const a = new PaintedActor({ name: subject, worldHeight: 1.82, shadow: false, life: false, interimYaw: false, breathe: false, sway: false });
          a.adoptPoses({ idle: painting(subject, 'idle'), [pose]: painting(subject, pose) }, 'idle');
          a.position.set(-2, 0, 0);
          a.holdHead(cam.projectionMatrix.clone().multiply(cam.matrixWorldInverse));
          a.setPose(pose, { immediate: true, force: true });
          frame(a, cam);
          const slot = slotsOf(a).find((s) => s.pose === pose)!;
          asked.push(Math.abs(slot.lock - 1));
          if (a.headLock.clamped > 0 || a.headLock.planes === 0) hit.push(`${subject}/${pose}: x${slot.lock.toFixed(3)}, wanted x${a.headLock.snapshot().worstRaw.toFixed(3)}`);
        }
      }
    }
    expect(subjects).toBeGreaterThanOrEqual(36);
    expect(asked.length).toBeGreaterThan(1000);
    expect(hit, 'poses whose head box the band cannot hold (or that no head was found for)').toEqual([]);
    asked.sort((x, y) => x - y);
    expect(asked[Math.floor(asked.length / 2)]!, 'the median pose is asked for a percent or two').toBeLessThan(0.02);
    expect(asked.at(-1)!, 'the most it asks is under the band\'s edge').toBeLessThan(0.1);
  });
});
