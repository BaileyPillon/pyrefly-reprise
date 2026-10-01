// @vitest-environment jsdom
/**
 * PR-0264 (round 18b, major; friends' playtest 2026-09-29 "Hi potion killed kimahri instead of
 * healing"). **Both games** (shared target plumbing, `src/ui/common/touchTapAim.ts`): the phone's
 * target hint says "Tap another ally to switch", but a tap on a dimmed candidate confirmed it at
 * once. On touch, a tap on a candidate that is not aimed now only aims it; a second tap, CONFIRM,
 * Enter or the pad commits. A mouse click is unchanged. The FFX case on a real Zombie board lives
 * in `fb0929-zombie-warning.test.ts`; this file pins the helper and the FFX-2 menu.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TAP_WINDOW_MS, aimOnTap, touchTapped } from '../../src/ui/common/touchTapAim.ts';
import { openCommandMenu } from '../../src/ui/ffx2/CommandMenu.ts';
import type { AtbSnapshot, AvailableCommand, Command } from '../../src/battle/common/types.ts';

/** What a finger, a pen or a mouse sends before its click. */
export function press(pointerType: 'touch' | 'pen' | 'mouse'): void {
  const e = new Event('pointerdown');
  Object.defineProperty(e, 'pointerType', { value: pointerType });
  window.dispatchEvent(e);
}

describe('touchTapAim (both games)', () => {
  const cursor = (active: string) => {
    const c = { activeTargetId: active, setActiveById: vi.fn((id: string) => { c.activeTargetId = id; return true; }) };
    return c;
  };

  it('a touch tap on a candidate not aimed only aims it', () => {
    press('touch');
    const c = cursor('tidus');
    expect(aimOnTap(c, 'yuna')).toBe(true);
    expect(c.activeTargetId).toBe('yuna');
    // The second tap lands on the aimed figure: the caller confirms.
    press('touch');
    expect(aimOnTap(c, 'yuna')).toBe(false);
  });

  it('a pen counts as a tap; a mouse click does not', () => {
    press('pen');
    expect(touchTapped()).toBe(true);
    press('mouse');
    expect(touchTapped()).toBe(false);
    const c = cursor('tidus');
    expect(aimOnTap(c, 'yuna')).toBe(false);
    expect(c.setActiveById).not.toHaveBeenCalled();
  });

  it('a stale touch no longer counts', () => {
    press('touch');
    expect(touchTapped(performance.now() + TAP_WINDOW_MS + 1)).toBe(false);
  });
});

const EMPTY: AtbSnapshot = { elapsedMs: 0, bars: [] };
const COMMANDS: AvailableCommand[] = [
  { command: { kind: 'item', id: 'hi-potion', targets: [] }, label: 'Hi-Potion', category: 'item', mpCost: 0, enabled: true, validTargets: ['yuna', 'rikku', 'paine'] },
];

describe('FFX-2 target step on touch (PR-0264)', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    vi.stubGlobal('requestAnimationFrame', () => 0);
    vi.stubGlobal('cancelAnimationFrame', () => {});
  });
  afterEach(() => vi.unstubAllGlobals());

  function openAtTargets(): { result: Promise<Command>; layer: HTMLElement } {
    const container = document.createElement('div');
    const layer = document.createElement('div');
    document.body.append(container, layer);
    const result = openCommandMenu({ container, targetLayer: layer, commands: COMMANDS, previewRank: () => EMPTY, project: () => ({ x: 10, y: 10 }), onPreview: () => {}, actorName: 'Yuna' });
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Enter' }));
    return { result, layer };
  }
  const active = (layer: HTMLElement): string | undefined =>
    layer.querySelector<HTMLElement>('[data-target-id]:not(.ffx-target--dim)')?.dataset['targetId'];
  const tapOn = (layer: HTMLElement, id: string, type: 'touch' | 'mouse'): void => {
    press(type);
    layer.querySelector<HTMLElement>(`[data-target-id="${id}"]`)!.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: -999, clientY: -999 }));
  };
  const settled = (p: Promise<unknown>): Promise<boolean> =>
    Promise.race([p.then(() => true), new Promise<boolean>((r) => setTimeout(() => r(false), 30))]);

  it('the first tap on another girl aims her, the second confirms her', async () => {
    const { result, layer } = openAtTargets();
    const first = active(layer);
    const other = ['yuna', 'rikku', 'paine'].find((id) => id !== first)!;
    tapOn(layer, other, 'touch');
    expect(await settled(result)).toBe(false);
    expect(active(layer)).toBe(other);
    tapOn(layer, other, 'touch');
    expect(await settled(result)).toBe(true);
    expect((await result).targets).toEqual([other]);
  });

  it('a mouse click still confirms at once (desktop unchanged)', async () => {
    const { result, layer } = openAtTargets();
    const other = ['yuna', 'rikku', 'paine'].find((id) => id !== active(layer))!;
    tapOn(layer, other, 'mouse');
    expect(await settled(result)).toBe(true);
    expect((await result).targets).toEqual([other]);
  });
});
