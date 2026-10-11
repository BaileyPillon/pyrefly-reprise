/**
 * FB-1 (visual-and-feel pass, 2026-10-10; PR-0379; both games): the replica of the diagnosis.
 *
 * The replica is the crossfade as `PaintedActor.setPose` was before FB-1 (a tween nobody owned, re-pointing the plane still fading out), fed the
 * chain the game fires: the lunge's apex asks for `attack`, the damage beat's follow-through asks for `follow` 83 ms later, and the FFX light hit-stop
 * (40 ms) holds the field's clock in the middle. It reproduces the measured plateau (eight ghost frames, peak 0.472, severity 0.406 at IoU 0.14,
 * blend nine frames: swap 199 of the Yunalesca run in the focused review of 931613a8), so the check can fail; the owned blend (`PoseBlend.ts`) on the
 * real clock then reads five frames or fewer, whatever the freeze.
 */
import { describe, expect, it } from 'vitest';
import { TweenGroup } from '../../../src/engine/Tween.ts';
import { PoseBlend, type BlendPlane } from '../../../src/engine/PoseBlend.ts';

type Idx = 0 | 1;
/** The crossfade as `PaintedActor.setPose` was before FB-1: an unkeyed tween that re-points the plane still fading out. Verbatim shape of the diagnosis's replica. */
class Legacy {
  readonly tweens = new TweenGroup();
  readonly slots: Array<{ fade: number; pose: string }> = [
    { fade: 1, pose: 'ready' },
    { fade: 0, pose: '' },
  ];
  active = 0;
  pose = 'ready';
  constructor(private readonly ms: number) {}
  setPose(name: string): void {
    if (this.pose === name) return;
    this.pose = name;
    const from = this.active;
    const to = from === 0 ? 1 : 0;
    this.slots[to]!.pose = name;
    this.active = to;
    const fromStart = this.slots[from]!.fade;
    const toStart = this.slots[to]!.fade;
    this.tweens.to(0, 1, {
      durationMs: this.ms,
      easing: 'quadInOut',
      onUpdate: (t) => {
        this.slots[to]!.fade = toStart + (1 - toStart) * t;
        this.slots[from]!.fade = fromStart * (1 - t);
      },
    });
  }
  update(dtSec: number): void {
    this.tweens.update(dtSec);
  }
}

/** The owned blend behind the same `setPose` / `update` surface. */
class Owned {
  readonly slots: Array<{ fade: number; pose: string }> = [
    { fade: 1, pose: 'ready' },
    { fade: 0, pose: '' },
  ];
  active: Idx = 0;
  private readonly blend = new PoseBlend(this.slots as [BlendPlane, BlendPlane]);
  constructor(private readonly ms: number) {}
  setPose(name: string): void {
    const plan = this.blend.request(name, this.ms, this.active);
    if (plan.same) return;
    if (!plan.reversed) this.slots[plan.to]!.pose = name;
    this.active = plan.to;
  }
  update(_dtSec: number, realSec: number): void {
    this.blend.advance(realSec * 1000);
  }
}

interface Surface {
  slots: Array<{ fade: number; pose: string }>;
  setPose(name: string): void;
  update(dtSec: number, realSec: number): void;
}

/** 60 fps frames; `events` are [ms, pose]; the field clock (`dt`) reads 0 for `freeze.ms` from `freeze.at` (the hit-stop), the real clock never does. */
function frames(make: () => Surface, events: Array<[number, string]>, freeze: { at: number; ms: number } | null, total = 500): Array<Record<string, number>> {
  const s = make();
  const frame = 1000 / 60;
  const rows: Array<Record<string, number>> = [];
  let ei = 0;
  let left = 0;
  let armed = false;
  for (let f = 0; f * frame < total; f++) {
    const t = f * frame;
    while (ei < events.length && events[ei]![0] <= t + 1e-6) s.setPose(events[ei++]![1]);
    if (freeze && !armed && t >= freeze.at - 1e-6) {
      armed = true;
      left = freeze.ms;
    }
    let dt = frame / 1000;
    if (left > 0) {
      if (frame <= left) {
        left -= frame;
        dt = 0;
      } else {
        dt = (frame - left) / 1000;
        left = 0;
      }
    }
    s.update(dt, frame / 1000);
    const m: Record<string, number> = {};
    for (const sl of s.slots) if (sl.pose && sl.fade > 0) m[sl.pose] = (m[sl.pose] ?? 0) + sl.fade;
    rows.push(m);
  }
  return rows;
}

/** The harness's measure (`continuity-pure.mjs` `ghost`): frames where the lesser of two paintings shows 0.15 or more; severity = peak x (1 - IoU). */
function ghost(rows: Array<Record<string, number>>, a: string, b: string, iou: number): { gf: number; peak: number; sev: number; blend: number } {
  let gf = 0;
  let peak = 0;
  let blend = 0;
  for (const r of rows) {
    const fa = r[a] ?? 0;
    const fb = r[b] ?? 0;
    if (fa > 0.02 && fb > 0.02) blend++;
    const lo = Math.min(fa, fb);
    if (lo >= 0.15) {
      gf++;
      peak = Math.max(peak, lo);
    }
  }
  return { gf, peak: +peak.toFixed(3), sev: +(peak * (1 - iou)).toFixed(3), blend };
}

describe('the replica of the diagnosis: FFX attack to follow, 83 ms after the attack key, with the 40 ms hit-stop', () => {
  const chain: Array<[number, string]> = [[0, 'attack'], [83, 'follow']];
  const IOU = 0.14; // Tidus attack > follow

  it('reproduces the measured plateau with the old crossfade (the steady pacing stretches 120 to 144 ms, the freeze holds the half-mixed frame): 8 ghost frames, peak 0.472, severity 0.406', () => {
    // pacing: the old blend ran on dt x paceRate, i.e. 144 ms of the field clock; here the freeze zeroes `dt` for 40 ms from the frame after the follow request
    const old = frames(() => new Legacy(144), chain, { at: 100, ms: 40 });
    const g = ghost(old, 'attack', 'follow', IOU);
    expect(g.gf).toBe(8);
    expect(g.peak).toBeCloseTo(0.472, 3);
    expect(g.sev).toBeCloseTo(0.406, 3);
    expect(g.blend).toBe(9);
  });

  it('the owned blend on the real clock: five ghost frames or fewer (4), no frame at the old peak, whatever the freeze', () => {
    for (const freeze of [null, { at: 100, ms: 40 }, { at: 116, ms: 40 }, { at: 100, ms: 85 }]) {
      const rows = frames(() => new Owned(120), chain, freeze);
      const g = ghost(rows, 'attack', 'follow', IOU);
      expect(g.gf, JSON.stringify(freeze)).toBeLessThanOrEqual(5);
      expect(g.peak, JSON.stringify(freeze)).toBeLessThan(0.472);
      expect(g.sev, JSON.stringify(freeze)).toBeLessThan(0.406);
      expect(g.blend, JSON.stringify(freeze)).toBeLessThanOrEqual(7);
    }
    // the freeze changes nothing at all: the blend does not read the field clock
    expect(frames(() => new Owned(120), chain, { at: 100, ms: 85 })).toEqual(frames(() => new Owned(120), chain, null));
  });

  it('the foes\' 140 ms blend is inside the same bound', () => {
    const g = ghost(frames(() => new Owned(140), chain, { at: 100, ms: 40 }), 'attack', 'follow', IOU);
    expect(g.gf).toBeLessThanOrEqual(5);
  });

  it('shows no third painting in any frame: ready is gone before follow comes in', () => {
    const rows = frames(() => new Owned(120), [[0, 'attack'], [83, 'follow']], { at: 100, ms: 40 });
    for (const r of rows) {
      const live = Object.entries(r).filter(([, f]) => f > 0.02).map(([k]) => k);
      expect(live.length).toBeLessThanOrEqual(2);
      expect(live.includes('ready') && live.includes('follow')).toBe(false);
    }
  });
});
