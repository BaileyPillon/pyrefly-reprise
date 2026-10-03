/**
 * Round 19, PR-0318 (both games): each party member carries where she would LIE if she went down, the fit keeps that footprint
 * clear of the HUD, and a body that falls lies clear of the status rows (`ProneLay`'s avoid hook).
 */
import { afterEach, describe, expect, it } from 'vitest';
import { PerspectiveCamera, Vector3 } from 'three';
import { clearBoxes, downBoxOf, downsOf, type Field } from '../../src/engine/fx/mix/clearance.ts';
import { DOWN_IN_VIEW_MIN, DOWN_UNDER_MAX, downQuadOf, panelsNdc } from '../../src/engine/fx/mix/downed.ts';
import type { Actor, Fig } from '../../src/engine/fx/mix/geometry.ts';
import { layProne, setProneAvoid, type NdcBox } from '../../src/engine/ProneLay.ts';

const idle = { width: 803, height: 1075, baselineY: 1060 };
const ko = { width: 1216, height: 816, baselineY: 805 };
const actor = (over: Record<string, unknown> = {}): Actor =>
  ({
    worldHeight: 1.75,
    slots: [{ mesh: { scale: { x: 1 } }, scale: { prone: false } }],
    active: 0,
    poses: new Map([['ko', { meta: ko }], ['idle', { meta: idle }]]),
    reference: idle,
    extents: { maxExtent: 2.2, minExtent: 0.35, proneAspect: 1.15 },
    ...over,
  }) as unknown as Actor;
const standing = (): Vector3[] => [new Vector3(-0.4, 0, 0), new Vector3(0.4, 0, 0), new Vector3(0.4, 1.75, 0), new Vector3(-0.4, 1.75, 0)];

describe('the downed footprint (PR-0318)', () => {
  it("is a floor quad at her station, one KO painting long (padded a tenth each way) and about its painting's height", () => {
    const q = downQuadOf(actor(), standing())!;
    expect(q).toHaveLength(4);
    const upp = 1.75 / idle.baselineY;
    const len = ko.width * upp; // the plane; no measured box here, so the whole plane
    expect(q[1]!.x - q[0]!.x).toBeCloseTo(len * 1.2, 1);
    expect(q[0]!.x + q[1]!.x).toBeCloseTo(0, 5); // centred on her station
    expect(q[2]!.y).toBeCloseTo(ko.height * upp, 1);
    expect(q[0]!.y).toBe(0);
  });

  it('is none with no KO painting or a stand-in, and is her own quad once she is already lying', () => {
    expect(downQuadOf(actor({ poses: new Map([['idle', { meta: idle }]]) }), standing())).toBeUndefined();
    expect(downQuadOf(actor({ poses: new Map([['ko', { meta: ko, placeholder: true }]]) }), standing())).toBeUndefined();
    const lying = actor({ slots: [{ mesh: { scale: { x: 1 } }, scale: { prone: true } }] });
    expect(downQuadOf(lying, standing())![0]!.x).toBeCloseTo(-0.4);
  });

  it('is measured the same way mirrored (the plane drawn flipped): still centred on her station', () => {
    const q = downQuadOf(actor({ slots: [{ mesh: { scale: { x: -1 } }, scale: { prone: false } }] }), standing())!;
    expect(q[0]!.x + q[1]!.x).toBeCloseTo(0, 5);
  });
});

describe('the fit ranks poses by the footprint (a soft rule: it never fails one)', () => {
  const W = 1600;
  const H = 900;
  const cam = new PerspectiveCamera(30, W / H, 0.1, 100);
  cam.position.set(0, 1.5, 12);
  cam.lookAt(0, 1, 0);
  cam.updateMatrixWorld(true);
  const down = (x: number): Vector3[] => [new Vector3(x - 1.2, 0, 0), new Vector3(x + 1.2, 0, 0), new Vector3(x + 1.2, 1.2, 0), new Vector3(x - 1.2, 1.2, 0)];
  const fig = (x: number, withDown = true): Fig => ({ feet: new Vector3(x, 0, 0), h: 1.75, halfW: 0.4, enemy: false, id: 'yuna', quad: standing().map((v) => v.clone().add(new Vector3(x, 0, 0))), ...(withDown ? { down: down(x) } : {}) });
  const field = (panels: Field['panels']): Field => ({ W, H, view: { l: 0, r: W, t: 0, b: H }, panels });
  const run = (f: Fig, panels: Field['panels']) => {
    const figs = [f];
    const fld = field(panels);
    const stand = figs.map((g) => {
      // the standing box under the camera
      const b = { l: 1e9, r: -1e9, t: 1e9, b: -1e9 };
      for (const v of g.quad!) {
        const p = v.clone().project(cam);
        const x = (p.x * 0.5 + 0.5) * W;
        const y = (0.5 - p.y * 0.5) * H;
        b.l = Math.min(b.l, x);
        b.r = Math.max(b.r, x);
        b.t = Math.min(b.t, y);
        b.b = Math.max(b.b, y);
      }
      return b;
    });
    return clearBoxes(stand, figs, cam.position, fld, [0, 0], [null], null, downsOf(cam, figs, fld));
  };

  it('a body clear of every panel has no excess; one lying mostly behind a panel has some, though she stands clear', () => {
    const f = fig(0);
    const b = downBoxOf(f, cam, W, H)!;
    // a panel over the right 28 % of the body, at its height only: she, standing, is clear of it
    const behind = run(f, [{ l: b.l + 0.72 * (b.r - b.l), r: b.r + 40, t: b.t, b: b.b }]);
    expect(behind.down!.under).toBeGreaterThan(DOWN_UNDER_MAX);
    expect(behind.downExcess).toBeGreaterThan(0);
    expect(behind.ok).toBe(true); // a soft rank: the standing rules alone decide ok
    const clear = run(f, [{ l: b.r + 60, r: b.r + 400, t: b.t, b: b.b }]);
    expect(clear.downExcess).toBe(0);
    expect(clear.ok).toBe(true);
    expect(run(fig(0, false), [{ l: b.l + 0.72 * (b.r - b.l), r: b.r + 40, t: b.t, b: b.b }]).down).toBeNull(); // no KO painting: nothing to count
  });

  it('a body out of the frame is counted on the in-view share', () => {
    expect(DOWN_IN_VIEW_MIN).toBeGreaterThan(0.5);
    const r = run(fig(-5.2), []);
    expect(r.down!.inView).toBeLessThan(DOWN_IN_VIEW_MIN);
    expect(r.downExcess).toBeGreaterThan(0);
  });
});

describe('a body that falls lies clear of the status rows (ProneLay avoid hook, PR-0318)', () => {
  afterEach(() => setProneAvoid(null));
  const cam = new PerspectiveCamera(30, 16 / 9, 0.1, 100);
  cam.position.set(0, 1, 8);
  cam.lookAt(0, 0.5, 0);
  cam.updateMatrixWorld(true);
  let shift = 0;
  const target = {
    visible: true,
    alpha: 1,
    position: new Vector3(0, 0, 0),
    poseSize: [2, 1] as [number, number],
    setProneShift: (s: number) => void (shift = s),
    contentQuad: (out: Vector3[] = []) => {
      const q = [new Vector3(-1 + shift, 0, 0), new Vector3(1 + shift, 0, 0), new Vector3(1 + shift, 1, 0), new Vector3(-1 + shift, 1, 0)];
      q.forEach((v, i) => (out[i] ? out[i]!.copy(v) : (out[i] = v)));
      return out as [Vector3, Vector3, Vector3, Vector3];
    },
  };

  it('with no panels it stays where it fell; with a row across the right half it slides left, off the row', () => {
    const none = layProne(target as never, [], [cam]);
    expect(none.shift).toBe(0);
    const row: NdcBox = { x0: 0.02, y0: -1, x1: 1, y1: 1 }; // the right half of the frame
    setProneAvoid(() => [row]);
    const r = layProne(target as never, [], [cam]);
    expect(r.shift).toBeLessThan(0);
    expect(r.overlap).toBeLessThan(0.01); // the body's far edge may graze the row at the longest slide
  });
});

describe('panelsNdc', () => {
  it('maps viewport panels into the canvas frame, moved back by the lens shift', () => {
    const [p] = panelsNdc([{ l: 800, r: 1600, t: 450, b: 900 }], { left: 0, top: 0, width: 1600, height: 900 }, [0, 0]);
    expect(p).toEqual({ x0: 0, x1: 1, y0: -1, y1: 0 });
    const [q] = panelsNdc([{ l: 800, r: 1600, t: 450, b: 900 }], { left: 0, top: 0, width: 1600, height: 900 }, [160, 90]);
    expect(q!.x0).toBeCloseTo(-0.2, 5);
    expect(q!.y1).toBeCloseTo(0.2, 5);
  });
});
