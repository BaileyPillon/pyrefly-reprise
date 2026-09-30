/**
 * Camera comfort (fb2-0929, Bailey's friend: "The camera movement between
 * attacks is a bit too fast and made me a bit dizzy ... I think it's cuz the UI
 * shifts with it"). Both games: shared presentation plumbing.
 *
 * Measured live (release 31a, 1600x900, real keys): the move advisor card
 * jumped 100-140 px in the middle of the camera's 580 ms return to the master
 * (Chapter I) and drifted 7 px a frame while the camera moved (Chapter IV),
 * with the strategy guide's rail, the coach line and the card all laid out
 * against fighters projected through the camera *in motion*. The fix lays those
 * panels out against the shot the camera is settling on: `restCamera()`.
 */
import { describe, expect, it } from 'vitest';
import { PerspectiveCamera, Vector3 } from 'three';
import { BattleCamera } from '../../src/engine/BattleCamera.ts';

const rigs = {
  idle: { position: [0, 3, 9] as [number, number, number], lookAt: [0, 1.4, 0] as [number, number, number] },
  party: { position: [-3, 2, 6] as [number, number, number], lookAt: [-2, 1.2, 0] as [number, number, number], fov: 30 },
};

function make(): { cam: PerspectiveCamera; bc: BattleCamera } {
  const cam = new PerspectiveCamera(35, 16 / 9, 0.1, 100);
  const bc = new BattleCamera(cam, { rigs, initial: 'idle' });
  return { cam, bc };
}

const project = (c: PerspectiveCamera, p: Vector3): Vector3 => p.clone().project(c);

describe('BattleCamera.restCamera: the shot the camera is settling on (both games)', () => {
  it('mid-move, answers the rig being moved to, not the in-between frame', () => {
    const { cam, bc } = make();
    void bc.moveTo('party', 600);
    bc.update(0.3);
    const rest = bc.restCamera();
    expect(rest.position.toArray()).toEqual([-3, 2, 6]);
    expect(rest.fov).toBe(30);
    // The live camera is half way; the rest camera is not.
    expect(cam.position.distanceTo(rest.position)).toBeGreaterThan(0.5);
    const pt = new Vector3(-2, 1.2, 0);
    const r = project(rest, pt);
    expect(Math.abs(r.x)).toBeLessThan(1e-6); // the rig's look point is dead centre at rest
  });

  it('ignores the roll, push, punch, shake and idle sway (they are not where the shot rests)', () => {
    const { bc } = make();
    bc.snapTo('idle');
    const a = bc.restCamera().matrixWorld.clone();
    void bc.roll(-4, 400);
    void bc.push(0.1, 200);
    bc.shake(0.2, 400);
    bc.update(0.1);
    bc.update(0.05);
    const b = bc.restCamera().matrixWorld;
    expect(b.equals(a)).toBe(true);
  });

  it('is its own camera: reading it never moves the live one', () => {
    const { cam, bc } = make();
    void bc.moveTo('party', 600);
    bc.update(0.2);
    const before = cam.matrixWorld.clone();
    bc.restCamera();
    expect(bc.restCamera()).not.toBe(cam);
    expect(cam.matrixWorld.equals(before)).toBe(true);
  });
});
