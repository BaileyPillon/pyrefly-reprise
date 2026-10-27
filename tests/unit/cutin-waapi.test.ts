// @vitest-environment jsdom
/**
 * The turn cut-in's entrance is one Web Animation (MF-16 / TB-05, motion-fluidity pass lane L3; game case: both games; no look change).
 *
 * Before: a CSS transition for the slam (120 ms) and a `setTimeout` at 120 ms that started the settle (60 ms), so a main thread busy at the turn start delayed the settle by the stall, and the
 * way out removed the slab on its own timer. Now: ONE `slab.animate` with the two phases as keyframes, each with the easing its transition had, and the slab leaves when its slide has finished.
 * jsdom has no `Element.animate`, so this installs a recorder; the real browser measure (a 100 ms stall in the middle of the slam) is in the lane folder.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { showTurnCutIn } from '../../src/ui/inkgold/cutin.ts';

interface Call {
  keyframes: Array<Record<string, unknown>>;
  options: Record<string, unknown>;
  finish: () => void;
}

let calls: Call[] = [];
const proto = HTMLElement.prototype as unknown as { animate?: unknown };

beforeEach(() => {
  calls = [];
  proto.animate = function (this: HTMLElement, keyframes: Array<Record<string, unknown>>, options: Record<string, unknown>) {
    let finish!: () => void;
    const finished = new Promise<void>((r) => (finish = r));
    calls.push({ keyframes, options, finish });
    return { finished };
  };
});
afterEach(() => {
  delete proto.animate;
  vi.useRealTimers();
  document.body.innerHTML = '';
});

describe('showTurnCutIn on the Web Animations path', () => {
  it('plays slam then settle as the keyframes of ONE 180 ms animation, with the easings the two transitions had', () => {
    vi.useFakeTimers();
    const root = document.createElement('div');
    document.body.appendChild(root);
    const h = showTurnCutIn(root, { name: 'RIKKU', portraitUrl: 'p.png', ctbLabel: 'ATB 1 OF 3' });
    expect(h.el.isConnected).toBe(true);
    expect(calls).toHaveLength(1);
    const [c] = calls;
    expect(c!.options['duration']).toBe(180);
    expect(c!.keyframes.map((k) => k['offset'])).toEqual([0, 120 / 180, 1]);
    expect(c!.keyframes[0]!['easing']).toBe('cubic-bezier(0.2, 0.9, 0.3, 1)');
    expect(c!.keyframes[1]!['easing']).toBe('ease-out');
    expect(c!.keyframes[0]!['transform']).toBe('translateX(-100%) skewX(-24deg)');
    expect(c!.keyframes[1]!['transform']).toBe('translateX(0%) skewX(-24deg)');
    expect(c!.keyframes[2]!['transform']).toBe('translateX(0%) skewX(-12deg)');
    // no timer chains the second phase: nothing is scheduled by the entrance
    expect(vi.getTimerCount()).toBe(0);
    // what stays on the element when the animation ends is the settled pose
    const slab = h.el.querySelector<HTMLElement>('.ig-cutin__slab')!;
    expect(slab.style.transform).toBe('translateX(0%) skewX(-12deg)');
  });

  it('the right-hand mirror mirrors every angle and the offscreen side', () => {
    const root = document.createElement('div');
    document.body.appendChild(root);
    showTurnCutIn(root, { name: 'PAINE', portraitUrl: 'p.png', ctbLabel: 'ATB 2 OF 3', side: 'right' });
    expect(calls[0]!.keyframes[0]!['transform']).toBe('translateX(100%) skewX(24deg)');
    expect(calls[0]!.keyframes[2]!['transform']).toBe('translateX(0%) skewX(12deg)');
  });

  it('the way out is an animation too, and the slab leaves the page when it has finished sliding (not on a timer that can fire first)', async () => {
    vi.useFakeTimers();
    const root = document.createElement('div');
    document.body.appendChild(root);
    const h = showTurnCutIn(root, { name: 'YUNA', portraitUrl: 'p.png', ctbLabel: 'ATB 3 OF 3' });
    let gone = false;
    void h.dismiss().then(() => void (gone = true));
    expect(calls).toHaveLength(2);
    expect(calls[1]!.options['duration']).toBe(150);
    expect(calls[1]!.options['easing']).toBe('ease-in');
    expect(calls[1]!.keyframes).toEqual([{ transform: 'translateX(-100%) skewX(-12deg)' }]);
    vi.advanceTimersByTime(150); // the old timer's moment: the slide has not finished (the compositor is behind), so the slab stays
    await Promise.resolve();
    expect(h.el.isConnected).toBe(true);
    expect(gone).toBe(false);
    calls[1]!.finish();
    await Promise.resolve();
    await Promise.resolve();
    expect(h.el.isConnected).toBe(false);
    expect(gone).toBe(true);
  });

  it('a document whose animations never run (a hidden tab) still settles the promise', async () => {
    vi.useFakeTimers();
    const root = document.createElement('div');
    document.body.appendChild(root);
    const h = showTurnCutIn(root, { name: 'YUNA', portraitUrl: 'p.png', ctbLabel: 'ATB 3 OF 3' });
    let gone = false;
    void h.dismiss().then(() => void (gone = true));
    vi.advanceTimersByTime(150 + 600);
    await Promise.resolve();
    expect(gone).toBe(true);
    expect(h.el.isConnected).toBe(false);
  });

  it('without Element.animate (or with ?cutin=timed) it is the old timed path: a transition and a timer at 120 ms', () => {
    delete proto.animate;
    vi.useFakeTimers();
    const root = document.createElement('div');
    document.body.appendChild(root);
    const h = showTurnCutIn(root, { name: 'RIKKU', portraitUrl: 'p.png', ctbLabel: 'ATB 1 OF 3' });
    const slab = h.el.querySelector<HTMLElement>('.ig-cutin__slab')!;
    expect(slab.style.transform).toBe('translateX(0%) skewX(-24deg)');
    vi.advanceTimersByTime(120);
    expect(slab.style.transform).toBe('translateX(0%) skewX(-12deg)');
  });
});
