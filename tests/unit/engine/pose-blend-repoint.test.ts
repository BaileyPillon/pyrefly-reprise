/**
 * PoseBlend rule 2, the dropped-painting fix (pose continuity, W1, 2026-10-16; angle 2 section 4.5 of the survey; both games): **a request in mid-blend
 * re-points the weaker plane only once its fade is under `REPOINT_BELOW` (0.05)**; until then the request WAITS, and it begins on its own at the latest
 * when the blend it waited for ends (`PoseBlend.takeStart`, which `PaintedActor.update` drains).
 *
 * Before the fix the weaker plane was re-pointed at once, so a painting still showing at 0.15 to 0.35 vanished in one frame (a hole in the figure and a step
 * of the fade-weighted head): 4 of 177 requests in the FFX light run, mostly the attack key chain's ready or attack into follow, none in FFX-2. The random
 * sequences of `pose-blend.test.ts` and `pose-blend-stepped.test.ts` hold the same rule as an invariant over 30 / 60 / 120 / 144 fps; the real actor
 * through the key chain is `painted-actor-blend.test.ts`.
 */
import { describe, expect, it } from 'vitest';
import { PoseBlend, REPOINT_BELOW, type BlendPlane } from '../../../src/engine/PoseBlend.ts';

type Idx = 0 | 1;

/** The seam as `PaintedActor.setPose` and `update` drive it. */
class Rig {
  readonly planes: [BlendPlane, BlendPlane] = [
    { fade: 1, pose: 'idle' },
    { fade: 0, pose: '' },
  ];
  active: Idx = 0;
  readonly blend = new PoseBlend(this.planes);

  request(key: string, ms: number): ReturnType<PoseBlend['request']> {
    const plan = this.blend.request(key, ms, this.active);
    if (plan.same) return plan;
    if (!plan.reversed) this.planes[plan.to].pose = key;
    this.active = plan.to;
    return plan;
  }

  /** One frame, then what `PaintedActor.update` does with a request that began on its own. True when one began. */
  step(ms: number): boolean {
    this.blend.advance(ms);
    const s = this.blend.takeStart();
    if (!s) return false;
    if (!s.plan.reversed) this.planes[s.plan.to].pose = s.key;
    this.active = s.plan.to;
    return true;
  }

  fades(): [number, number] {
    return [this.planes[0].fade, this.planes[1].fade];
  }

  keysAbove(min: number): string[] {
    const by = new Map<string, number>();
    for (const p of this.planes) if (p.pose) by.set(p.pose, (by.get(p.pose) ?? 0) + p.fade);
    return [...by].filter(([, f]) => f > min).map(([k]) => k);
  }
}

/** idle -> ready running 50 ms of 120 (ready 0.347, idle 0.653). */
function midBlend(): Rig {
  const rig = new Rig();
  rig.request('ready', 120);
  rig.step(50);
  return rig;
}

describe('PoseBlend rule 2: a mid-blend request never drops a painting that still shows', () => {
  it('control: with the weaker painting already under REPOINT_BELOW the request re-points it at once, from 0, and the dropped fade is recorded', () => {
    const rig = new Rig();
    rig.request('ready', 120);
    rig.step(10); // ready 0.014
    const idle = rig.planes[0].fade;
    expect(rig.request('attack', 120)).toEqual({ same: false, to: 1, repoint: true, reversed: false });
    expect(rig.planes[0].fade).toBe(idle);
    expect(rig.planes[1]).toEqual({ fade: 0, pose: 'attack' });
    expect(rig.blend.maxDropped).toBeLessThan(REPOINT_BELOW);
    expect(rig.blend.holding).toBe(false);
  });

  it('a request that would drop a painting still showing WAITS (rule 2): nothing moves at the request, and it begins the first frame the weaker painting is under REPOINT_BELOW', () => {
    const rig = midBlend(); // idle 0.653 going out, ready 0.347 coming in
    const pre = rig.fades();
    const plan = rig.request('attack', 120);
    expect(plan).toEqual({ same: true, deferred: true });
    expect(rig.fades()).toEqual(pre); // ready (0.347) is not dropped
    expect(rig.planes[1].pose).toBe('ready');
    expect(rig.active).toBe(1);
    expect(rig.blend.holding).toBe(true);
    expect(rig.blend.blending).toBe(true);
    let t = 50;
    let began = false;
    while (!began && t < 400) {
      began = rig.step(1000 / 60);
      t += 1000 / 60;
      if (!began) {
        const weaker = Math.min(rig.planes[0].fade, rig.planes[1].fade);
        expect(weaker, `at ${t.toFixed(0)} ms the held request has not begun, so the weaker painting still shows`).toBeGreaterThanOrEqual(REPOINT_BELOW);
        expect(rig.planes[1].pose).toBe('ready');
      }
    }
    expect(began).toBe(true);
    expect(t).toBeLessThan(120 + 1000 / 60); // never later than the end of the blend it waited for
    expect(rig.blend.holding).toBe(false);
    expect(rig.blend.maxDropped).toBeLessThan(REPOINT_BELOW); // idle went out before it was re-pointed; it was 0.347 or more before the fix
    expect(rig.planes[0]).toEqual({ fade: 0, pose: 'attack' }); // the plane that held idle now brings attack in, from 0
    expect(rig.planes[1].pose).toBe('ready');
    expect(rig.planes[1].fade).toBeGreaterThan(0.9); // ready is the stronger painting and goes out from where it stands
    expect(rig.active).toBe(0);
    rig.step(121);
    expect(rig.planes[0]).toEqual({ fade: 1, pose: 'attack' });
    expect(rig.planes[1].fade).toBe(0);
  });

  it('when the painting on its way in is already the stronger, it is the one that goes out and the OTHER plane is re-pointed, once its fade is under REPOINT_BELOW (ready > attack > follow)', () => {
    const rig = new Rig();
    rig.planes[0].pose = 'ready';
    rig.request('attack', 120);
    rig.step(83); // ready 0.19, attack 0.81
    const [ready, attack] = [rig.planes[0].fade, rig.planes[1].fade];
    expect(attack).toBeGreaterThan(ready);
    expect(ready).toBeGreaterThan(REPOINT_BELOW);
    const plan = rig.request('follow', 120);
    expect(plan).toEqual({ same: true, deferred: true }); // before the fix: ready (0.19) was dropped in this very frame and follow began at 0
    expect(rig.planes[0]).toEqual({ fade: ready, pose: 'ready' });
    expect(rig.keysAbove(0.02).sort()).toEqual(['attack', 'ready']);
    let began = false;
    let frames = 0;
    while (!began && frames < 20) {
      began = rig.step(1000 / 60);
      frames++;
    }
    expect(began).toBe(true);
    expect(frames).toBeLessThanOrEqual(3); // ready fades under 0.05 within 18 ms of the request: the key chain's follow is late by about a frame, not by a blend
    expect(rig.planes[0]).toEqual({ fade: 0, pose: 'follow' }); // ready is gone (it was under 0.05), follow starts from 0, never at a third of the way
    expect(rig.planes[1].fade).toBeGreaterThan(0.94);
    expect(rig.keysAbove(0.02)).toEqual(['attack']);
    expect(rig.blend.maxDropped).toBeLessThan(REPOINT_BELOW);
    rig.step(1000 / 60);
    expect(rig.keysAbove(0.02).sort()).toEqual(['attack', 'follow']);
    expect(rig.planes[0].fade).toBeLessThan(0.05); // follow rose a frame's worth, not to 0.37
  });

  it('the latest request wins while one is held: only it begins', () => {
    const rig = midBlend();
    expect(rig.request('attack', 120)).toEqual({ same: true, deferred: true });
    expect(rig.request('hurt', 120)).toEqual({ same: true, deferred: true });
    const seen: string[] = [];
    for (let i = 0; i < 40; i++) {
      if (rig.step(1000 / 60)) seen.push(rig.planes[rig.active].pose);
    }
    expect(seen).toEqual(['hurt']);
    expect(rig.planes[rig.active]).toEqual({ fade: 1, pose: 'hurt' });
  });

  it('a held request is dropped by a later one that names the painting on its way in, by a reversal, and by a cancel', () => {
    const onWayIn = midBlend();
    onWayIn.request('attack', 120);
    expect(onWayIn.request('ready', 120)).toEqual({ same: true }); // ready is what is coming in: the running blend goes on and attack is forgotten
    expect(onWayIn.blend.holding).toBe(false);
    for (let i = 0; i < 20; i++) expect(onWayIn.step(1000 / 60)).toBe(false);
    expect(onWayIn.planes[onWayIn.active]).toEqual({ fade: 1, pose: 'ready' });

    const reversed = midBlend();
    reversed.request('attack', 120);
    expect(reversed.request('idle', 120)).toEqual({ same: false, to: 0, repoint: false, reversed: true });
    expect(reversed.blend.holding).toBe(false);
    for (let i = 0; i < 20; i++) expect(reversed.step(1000 / 60)).toBe(false);
    expect(reversed.planes[reversed.active]).toEqual({ fade: 1, pose: 'idle' });

    const cut = midBlend();
    cut.request('attack', 120);
    cut.blend.cancel();
    expect(cut.blend.holding).toBe(false);
    for (let i = 0; i < 20; i++) expect(cut.step(1000 / 60)).toBe(false);
    expect(cut.blend.takeStart()).toBeNull();
  });

  it('a request held by a shape that never lets the weaker painting under REPOINT_BELOW still begins when the blend ends, at the latest', () => {
    const planes: [BlendPlane, BlendPlane] = [
      { fade: 1, pose: 'idle' },
      { fade: 0, pose: '' },
    ];
    const blend = new PoseBlend(planes, { out: (u) => (u < 1 ? 0.5 : 0), inn: (u) => u });
    expect(blend.request('ready', 100, 0)).toEqual({ same: false, to: 1, repoint: true, reversed: false });
    planes[1].pose = 'ready';
    blend.advance(40);
    expect(planes[0].fade).toBe(0.5); // idle holds at 0.5 until the end of the blend
    expect(blend.request('attack', 100, 1)).toEqual({ same: true, deferred: true });
    blend.advance(40);
    expect(blend.holding).toBe(true);
    expect(blend.takeStart()).toBeNull();
    blend.advance(40); // 120 ms of 100: the blend ends; the request begins in the same call
    expect(blend.holding).toBe(false);
    const started = blend.takeStart();
    expect(started).toEqual({ key: 'attack', plan: { same: false, to: 0, repoint: true, reversed: false } });
    expect(planes[0].fade).toBe(0);
    expect(planes[1].fade).toBe(1);
    expect(blend.maxDropped).toBe(0); // idle had faded to 0 at the end of its blend
  });
});
