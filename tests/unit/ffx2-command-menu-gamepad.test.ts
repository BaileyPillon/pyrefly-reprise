// @vitest-environment jsdom
/**
 * PR-0219 (critic round 15): the FFX-2 battle command menu ignored a gamepad.
 * It listened only to `keydown` and clicks, while FFX's menu has always polled
 * the pad through `src/ui/ffx/rawInput.ts`. Measured live before the fix: 80
 * pad A presses, 0 party actions (round 15 `ffx2-bahamut-win-pad`), and a
 * headless probe on seed 1 showed the cursor never moved on the d-pad.
 *
 * Case: FFX-2 only. FFX's menu already takes the pad; the change is that the
 * FFX-2 menu now feeds the same abstract buttons (standard mapping: 0 confirm,
 * 1 cancel, 12-15 d-pad) into the handler its keys use.
 *
 * The pad is polled from `requestAnimationFrame`, so the test owns the frame
 * queue and a fake `navigator.getGamepads`, and steps frames by hand.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { openCommandMenu } from '../../src/ui/ffx2/CommandMenu.ts';
import { setRawInputSuspended } from '../../src/ui/ffx/rawInput.ts';
import type { AtbSnapshot, AvailableCommand, Command } from '../../src/battle/common/types.ts';

const EMPTY: AtbSnapshot = { elapsedMs: 0, bars: [] };
let frames: FrameRequestCallback[] = [];
let now = 0;
const held = new Set<number>();

function padState(): (Gamepad | null)[] {
  const buttons = Array.from({ length: 17 }, (_, i) => ({ pressed: held.has(i), touched: held.has(i), value: held.has(i) ? 1 : 0 }));
  return [{ id: 'test pad', index: 0, connected: true, mapping: 'standard', axes: [0, 0, 0, 0], buttons, timestamp: now } as unknown as Gamepad];
}

function step(): void {
  now += 16;
  const due = frames;
  frames = [];
  for (const cb of due) cb(now);
}

/** Press and release one pad button, one frame each. */
function tap(i: number): void {
  held.add(i);
  step();
  held.delete(i);
  step();
}

const COMMANDS: AvailableCommand[] = [
  { command: { kind: 'attack', targets: [] }, label: 'Attack', category: 'attack', mpCost: 0, enabled: true, validTargets: ['bahamut'] },
  { command: { kind: 'ability', id: 'cure', targets: [] }, label: 'Cure', category: 'whitemagic', mpCost: 4, enabled: true, validTargets: ['yuna', 'rikku'] },
  { command: { kind: 'ability', id: 'cura', targets: [] }, label: 'Cura', category: 'whitemagic', mpCost: 10, enabled: true, validTargets: ['yuna', 'rikku'] },
];

function open(): { result: Promise<Command>; container: HTMLElement } {
  const container = document.createElement('div');
  const targetLayer = document.createElement('div');
  document.body.append(container, targetLayer);
  const result = openCommandMenu({
    container,
    targetLayer,
    commands: COMMANDS,
    previewRank: () => EMPTY,
    project: () => ({ x: 10, y: 10 }),
    onPreview: () => {},
    actorName: 'Yuna',
  });
  return { result, container };
}

const selected = (c: HTMLElement): string => c.querySelector('.ig-cmd--selected .ffx2cmd__label')?.textContent ?? '';

beforeEach(() => {
  document.body.innerHTML = '';
  frames = [];
  held.clear();
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    frames.push(cb);
    return frames.length;
  });
  vi.stubGlobal('cancelAnimationFrame', () => {});
  (navigator as unknown as { getGamepads: () => (Gamepad | null)[] }).getGamepads = padState;
});

afterEach(() => {
  setRawInputSuspended(false);
  vi.unstubAllGlobals();
});

describe('FFX-2 command menu on a gamepad (PR-0219)', () => {
  it('moves the cursor on the d-pad', () => {
    const { container } = open();
    step();
    expect(selected(container)).toBe('Attack');
    tap(13);
    expect(selected(container)).toBe('White Magic');
    tap(12);
    expect(selected(container)).toBe('Attack');
  });

  it('opens a submenu, backs out with B, and resolves a command with A alone', async () => {
    const { result, container } = open();
    step();
    tap(13);
    tap(0);
    expect(container.querySelector('.ffx2cmd__title')?.textContent).toBe('White Magic');
    tap(1);
    expect(container.querySelector('.ffx2cmd__title')).toBeNull();
    tap(0);
    tap(13);
    expect(selected(container)).toBe('Cura');
    tap(0); // to targets
    tap(0); // confirm the target
    const cmd = await result;
    expect(cmd.kind).toBe('ability');
    expect((cmd as { id?: string }).id).toBe('cura');
    expect(cmd.targets.length).toBe(1);
  });

  it('hears nothing while the pause has muted HUD input', () => {
    const { container } = open();
    step();
    setRawInputSuspended(true);
    tap(13);
    expect(selected(container)).toBe('Attack');
  });

  it('keeps its keyboard keys as they were (no WASD added)', () => {
    const { container } = open();
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyS' }));
    expect(selected(container)).toBe('Attack');
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'ArrowDown' }));
    expect(selected(container)).toBe('White Magic');
  });
});
