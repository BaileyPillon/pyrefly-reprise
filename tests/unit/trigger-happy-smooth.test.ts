// @vitest-environment jsdom
/**
 * Trigger Happy's bar and ring move every drawn frame (MF-24 / TB-06, motion-fluidity pass lane L3; game case: FFX-2 only; a look, so behind `?triggerhappy=smooth` / `?fluidui=on`, default today's).
 *
 * Today `render()` rewrites the overlay with `innerHTML` every 33 ms and on every press: the ring and the bar step in 2- and 3-frame holds at 60 Hz. With the word on the markup is built once and a
 * `requestAnimationFrame` loop writes the ring's `stroke-dashoffset` and the bar's `transform: scaleX` from `performance.now()`; the 33 ms timer keeps only the window's end.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createTriggerHappy, triggerHappySmooth } from '../../src/ui/ffx2/TriggerHappy.ts';

let container: HTMLElement;

function setSearch(search: string): void {
  window.history.replaceState({}, '', `/${search}`);
}

/** A manual animation-frame queue: a frame runs when the test says, at the display rate the test is simulating (fake timers' own rAF is a fixed 16 ms). */
let frameQueue = new Map<number, FrameRequestCallback>();
let frameId = 0;
const realRaf = globalThis.requestAnimationFrame;
const realCaf = globalThis.cancelAnimationFrame;
async function drawFrame(ms: number): Promise<void> {
  await vi.advanceTimersByTimeAsync(ms);
  const due = [...frameQueue.entries()];
  frameQueue = new Map();
  for (const [, cb] of due) cb(performance.now());
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date', 'performance'] });
  frameQueue = new Map();
  frameId = 0;
  globalThis.requestAnimationFrame = ((cb: FrameRequestCallback) => (frameQueue.set(++frameId, cb), frameId)) as typeof requestAnimationFrame;
  globalThis.cancelAnimationFrame = ((id: number) => void frameQueue.delete(id)) as typeof cancelAnimationFrame;
  container = document.createElement('div');
  document.body.appendChild(container);
});
afterEach(() => {
  vi.useRealTimers();
  globalThis.requestAnimationFrame = realRaf;
  globalThis.cancelAnimationFrame = realCaf;
  setSearch('');
  document.body.innerHTML = '';
});

/** Run `frames` drawn frames of `hz` and read the fill's scale and the ring's offset after each. */
async function trace(hz: number, frames: number, windowMs: number, search: string): Promise<{ scale: number[]; ring: number[]; handle: ReturnType<typeof createTriggerHappy> }> {
  setSearch(search);
  const handle = createTriggerHappy(container, { windowMs });
  const scale: number[] = [];
  const ring: number[] = [];
  for (let i = 0; i < frames; i++) {
    await drawFrame(1000 / hz);
    const fill = handle.el.querySelector<HTMLElement>('.ffx2-trigger__fill');
    if (!fill) break;
    const t = /scaleX\(([\d.]+)\)/.exec(fill.style.transform);
    const w = /width:([\d.]+)%/.exec(fill.getAttribute('style') ?? '');
    scale.push(t ? parseFloat(t[1]!) : parseFloat(w![1]!) / 100);
    ring.push(parseFloat(handle.el.querySelectorAll('circle')[1]!.getAttribute('stroke-dashoffset')!));
  }
  return { scale, ring, handle };
}

describe('Trigger Happy: the switch word', () => {
  it('is off unless ?triggerhappy=smooth or ?fluidui=on', () => {
    expect(triggerHappySmooth('')).toBe(false);
    expect(triggerHappySmooth('?triggerhappy=smooth')).toBe(true);
    expect(triggerHappySmooth('?fluidui=on')).toBe(true);
    expect(triggerHappySmooth('?fluidui=on&triggerhappy=today')).toBe(false);
  });
});

describe('Trigger Happy: today steps, the smooth word moves every frame', () => {
  it('today: the bar holds for 2 or 3 frames at 60 Hz (a 33 ms timer)', async () => {
    const { scale } = await trace(60, 60, 1800, '');
    const distinct = new Set(scale.map((v) => v.toFixed(4))).size;
    expect(distinct).toBeLessThanOrEqual(31); // a new value about every 33 ms: 60 frames, 30 values
    expect(distinct).toBeGreaterThanOrEqual(28);
  });

  it.each([60, 144])('smooth at %i Hz: a new value on every drawn frame, falling in even steps, and the same element throughout', async (hz) => {
    const frames = Math.floor(hz * 1.5);
    const { scale, ring, handle } = await trace(hz, frames, 1800, '?triggerhappy=smooth');
    expect(new Set(scale.map((v) => v.toFixed(4))).size).toBe(frames);
    for (let i = 1; i < scale.length; i++) {
      expect(scale[i]!).toBeLessThan(scale[i - 1]!);
      expect(scale[i - 1]! - scale[i]!).toBeCloseTo(1000 / hz / 1800, 2);
      expect(ring[i]!).toBeGreaterThan(ring[i - 1]!);
    }
    // 1 px or less a frame on the widest bar the overlay draws (about 400 px at 1600 wide): 1000/144/1800 * 400 = 1.5 px at 144 Hz, 2.5 px at 60 Hz: smoother than a 33 ms hold of 5 px
    const fill = handle.el.querySelector('.ffx2-trigger__fill');
    expect(fill).not.toBeNull();
    await vi.advanceTimersByTimeAsync(10);
    expect(handle.el.querySelector('.ffx2-trigger__fill')).toBe(fill);
  });

  it('smooth: a press paints at once (hits, hot state), the window still closes on time and the result is the press count', async () => {
    setSearch('?triggerhappy=smooth');
    const handle = createTriggerHappy(container, { windowMs: 1000, paceHits: 2 });
    const bonus = handle.el.querySelector('.ig-minigame__bonus')!;
    expect(bonus.textContent).toBe('0 HITS');
    handle.press();
    expect(bonus.textContent).toBe('1 HIT');
    handle.press();
    expect(bonus.textContent).toBe('2 HITS');
    expect(bonus.classList.contains('ffx2-trigger__bonus--hot')).toBe(true);
    expect(handle.el.querySelector('.ffx2-trigger__fill')!.classList.contains('ffx2-trigger__fill--hot')).toBe(true);
    expect(handle.el.querySelector('.ig-minigame__bonus')).toBe(bonus); // the same element
    await vi.advanceTimersByTimeAsync(1100);
    expect((await handle.result).hits).toBe(2);
  });

  it('smooth: cancel stops the frame loop', async () => {
    setSearch('?triggerhappy=smooth');
    const handle = createTriggerHappy(container, { windowMs: 1000 });
    handle.cancel();
    expect(container.contains(handle.el)).toBe(false);
    await vi.advanceTimersByTimeAsync(2000);
    expect(vi.getTimerCount()).toBe(0);
  });
});
