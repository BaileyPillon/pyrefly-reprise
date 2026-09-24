/**
 * `layProneFigures` never slides a pinned figure (a scene's `enemySpots`): the
 * spot is where its painting is drawn. Vegnagun's body (Chapter 5, FFX-2 only)
 * is a wide standing painting that counts as prone by its shape; live slid it
 * +1.38 along the floor from whatever stood near it. Plumbing: both games.
 */
import { describe, expect, it } from 'vitest';
import { PerspectiveCamera, Vector3 } from 'three';
import { layProneFigures } from '../../../src/engine/ProneLay.ts';
import type { PaintedActor } from '../../../src/engine/PaintedActor.ts';

function fake(x: number, w: number, prone: boolean): PaintedActor & { shifts: number[] } {
  const shifts: number[] = [];
  let shift = 0;
  const position = new Vector3(x, 0, -6);
  const a = {
    shifts,
    position,
    visible: true,
    alpha: 1,
    isProne: prone,
    poseSize: [w, prone ? w / 2 : w * 2] as [number, number],
    setProneShift(dx: number): void {
      shift = dx;
      shifts.push(dx);
    },
    contentQuad(out: [Vector3, Vector3, Vector3, Vector3]): [Vector3, Vector3, Vector3, Vector3] {
      const cx = position.x + shift;
      const h = prone ? w / 2 : w * 2;
      out[0].set(cx - w / 2, 0, position.z);
      out[1].set(cx + w / 2, 0, position.z);
      out[2].set(cx + w / 2, h, position.z);
      out[3].set(cx - w / 2, h, position.z);
      return out;
    },
  };
  return a as unknown as PaintedActor & { shifts: number[] };
}

function camera(): PerspectiveCamera {
  const c = new PerspectiveCamera(40, 16 / 9, 0.1, 100);
  c.position.set(0, 2, 10);
  c.lookAt(0, 1, -6);
  c.updateProjectionMatrix();
  c.updateMatrixWorld(true);
  return c;
}

describe('layProneFigures and pinned figures', () => {
  it('slides a wide painting off its standing neighbour when it is not pinned', () => {
    const body = fake(2, 6, true);
    const neighbour = fake(0.5, 1, false);
    layProneFigures([body, neighbour], camera());
    expect(body.shifts.length).toBeGreaterThan(1);
    expect(body.shifts.at(-1)).not.toBe(0);
  });

  it('never slides a pinned one, and still lays the others', () => {
    const body = fake(2, 6, true);
    const neighbour = fake(0.5, 1, false);
    const downed = fake(-1, 2, true);
    layProneFigures([body, neighbour, downed], camera(), undefined, new Set([body]));
    expect(body.shifts).toEqual([]);
    expect(downed.shifts.length).toBeGreaterThan(0);
  });
});
