import { describe, expect, it } from 'vitest';
import { Easing, Tween, TweenGroup, damp, lerp, resolveEasing } from '../../src/engine/Tween.ts';

describe('Easing', () => {
  const names = Object.keys(Easing) as Array<keyof typeof Easing>;

  it('every curve is anchored at 0 and 1', () => {
    for (const name of names) {
      const fn = Easing[name];
      expect(fn(0), `${name}(0)`).toBeCloseTo(0, 5);
      expect(fn(1), `${name}(1)`).toBeCloseTo(1, 5);
    }
  });

  it('clamps inputs outside 0..1', () => {
    for (const name of names) {
      const fn = Easing[name];
      expect(fn(-3), `${name}(-3)`).toBeCloseTo(0, 5);
      expect(fn(4), `${name}(4)`).toBeCloseTo(1, 5);
    }
  });

  it('linear is the identity inside the range', () => {
    expect(Easing.linear(0.25)).toBeCloseTo(0.25, 6);
    expect(Easing.linear(0.5)).toBeCloseTo(0.5, 6);
  });

  it('quadIn starts slow and quadOut starts fast', () => {
    expect(Easing.quadIn(0.5)).toBeCloseTo(0.25, 6);
    expect(Easing.quadOut(0.5)).toBeCloseTo(0.75, 6);
  });

  it('cubicInOut is symmetric about the midpoint', () => {
    for (const t of [0.1, 0.25, 0.4]) {
      expect(Easing.cubicInOut(t) + Easing.cubicInOut(1 - t)).toBeCloseTo(1, 6);
    }
  });

  it('resolveEasing accepts names, functions and falls back', () => {
    expect(resolveEasing('sineOut')).toBe(Easing.sineOut);
    const custom = (t: number): number => t;
    expect(resolveEasing(custom)).toBe(custom);
    expect(resolveEasing(undefined)).toBe(Easing.quadInOut);
  });
});

describe('lerp / damp', () => {
  it('lerp interpolates endpoints', () => {
    expect(lerp(10, 20, 0)).toBe(10);
    expect(lerp(10, 20, 1)).toBe(20);
    expect(lerp(10, 20, 0.5)).toBe(15);
  });

  it('damp converges toward the target without overshooting', () => {
    let v = 0;
    for (let i = 0; i < 120; i++) v = damp(v, 10, 6, 1 / 60);
    expect(v).toBeGreaterThan(9.5);
    expect(v).toBeLessThanOrEqual(10);
  });
});

describe('Tween', () => {
  it('reaches its target and reports completion once', () => {
    let last = -1;
    let completions = 0;
    const t = new Tween(0, 100, {
      durationMs: 100,
      easing: 'linear',
      onUpdate: (v) => {
        last = v;
      },
      onComplete: () => {
        completions++;
      },
    });

    t.update(0.05);
    expect(last).toBeCloseTo(50, 5);
    expect(t.done).toBe(false);

    t.update(0.05);
    expect(last).toBeCloseTo(100, 5);
    expect(t.done).toBe(true);
    expect(completions).toBe(1);

    t.update(0.05);
    expect(completions).toBe(1);
  });

  it('honours a delay before it starts moving', () => {
    let v = 0;
    const t = new Tween(0, 10, {
      durationMs: 100,
      delayMs: 100,
      easing: 'linear',
      onUpdate: (x) => {
        v = x;
      },
    });
    t.update(0.05);
    expect(v).toBe(0);
    t.update(0.1); // 50ms of delay left, then 50ms of tween
    expect(v).toBeCloseTo(5, 5);
  });

  it('kill() stops it without completing', () => {
    let completions = 0;
    const t = new Tween(0, 1, { durationMs: 100, onComplete: () => completions++ });
    t.kill();
    t.update(1);
    expect(t.done).toBe(true);
    expect(completions).toBe(0);
  });
});

describe('TweenGroup', () => {
  it('drops finished tweens and resolves toAsync', async () => {
    const group = new TweenGroup();
    let settled = false;
    const p = group.toAsync(0, 1, { durationMs: 50, easing: 'linear' }).then(() => {
      settled = true;
    });
    expect(group.size).toBe(1);

    group.update(0.02);
    expect(group.size).toBe(1);

    group.update(0.05);
    await p;
    expect(settled).toBe(true);
    expect(group.size).toBe(0);
  });

  it('killAll empties the group', () => {
    const group = new TweenGroup();
    group.to(0, 1, { durationMs: 1000 });
    group.to(0, 1, { durationMs: 1000 });
    expect(group.size).toBe(2);
    group.killAll();
    expect(group.size).toBe(0);
  });
});
