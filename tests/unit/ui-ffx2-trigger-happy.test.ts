// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createTriggerHappy } from '../../src/ui/ffx2/TriggerHappy.ts';

describe('Gunner Trigger Happy (fake-input mode)', () => {
  let container: HTMLElement;

  beforeEach(() => {
    vi.useFakeTimers();
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('counts one hit per press() call, no real key events needed', async () => {
    const handle = createTriggerHappy(container, { windowMs: 1000 });
    handle.press();
    handle.press();
    handle.press();
    await vi.advanceTimersByTimeAsync(1050);
    const result = await handle.result;
    expect(result.hits).toBe(3);
  });

  it('clamps hits at 16 even if mashed harder', async () => {
    const handle = createTriggerHappy(container, { windowMs: 1000 });
    for (let i = 0; i < 25; i++) handle.press();
    await vi.advanceTimersByTimeAsync(1050);
    const result = await handle.result;
    expect(result.hits).toBe(16);
  });

  it('resolves with 0 hits if the window closes untouched', async () => {
    const handle = createTriggerHappy(container, { windowMs: 500 });
    await vi.advanceTimersByTimeAsync(550);
    const result = await handle.result;
    expect(result.hits).toBe(0);
  });

  it('ignores presses registered after the window has closed', async () => {
    const handle = createTriggerHappy(container, { windowMs: 400 });
    handle.press();
    await vi.advanceTimersByTimeAsync(450);
    await handle.result;
    handle.press(); // too late
    const result = await handle.result;
    expect(result.hits).toBe(1);
  });

  it('removes its element from the DOM once resolved', async () => {
    const handle = createTriggerHappy(container, { windowMs: 300 });
    expect(container.contains(handle.el)).toBe(true);
    await vi.advanceTimersByTimeAsync(350);
    await handle.result;
    await vi.advanceTimersByTimeAsync(400); // the post-resolve DOM-cleanup timeout
    expect(container.contains(handle.el)).toBe(false);
  });
});
