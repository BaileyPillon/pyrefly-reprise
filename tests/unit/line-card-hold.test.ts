// @vitest-environment jsdom
/**
 * PR-0211 repair (iter2-b4, 2026-09-27): the mid-battle line card holds the
 * line, not only the card, while the camera settles, and goes away for a
 * beat's own camera move.
 *
 * The independent check found two things the card rule missed:
 *
 * - The card was hidden for 500 ms at a beat's first line while the line's
 *   typing and auto timer ran on, so a short first line ("Hn.", "Ifrit.") was
 *   on screen for 0.4 to 0.6 s. Now the box's clock (typing and auto) and the
 *   beat's scene-time budgets wait for the card, so the line keeps its time.
 * - A camera step after a beat's last line (Chapter V's `camera('action',
 *   700)` after Shuyin's "No. I'll end all of it.", Chapter III's
 *   `camera('idle', 400)` after Auron's "Spread out") ran while the finished
 *   line was still up, carrying Shuyin and Yuna under the card. Now the card is
 *   put away when the camera moves.
 *
 * Game case: both (one shared runner and box; Chapters III and V).
 */

import { afterEach, describe, expect, it } from 'vitest';

import { createMidBattleCutscenes, resetMidBattleOverrunLog } from '../../src/app/screens/BattleScreenCutscenes.ts';
import { STILL_MS } from '../../src/app/screens/midbeatLineCard.ts';
import type { BattleStage } from '../../src/engine/BattlePresenterPorts.ts';
import type { ScreenRect } from '../../src/engine/ScreenRects.ts';
import { camera, say } from '../../src/story/dsl.ts';

afterEach(() => {
  document.body.innerHTML = '';
  resetMidBattleOverrunLog();
});

function mount(rects: Map<string, ScreenRect>, cameraResolves = true) {
  Object.defineProperty(window, 'innerWidth', { value: 1600, configurable: true });
  Object.defineProperty(window, 'innerHeight', { value: 900, configurable: true });
  const moves: string[] = [];
  const stage = {
    camera: {
      moveTo: (rig: string): Promise<void> => {
        moves.push(rig);
        return cameraResolves ? Promise.resolve() : new Promise<void>(() => {});
      },
      snapTo: () => {},
      shake: () => {},
      punch: () => Promise.resolve(),
      rigNames: ['idle', 'action'],
      rigName: 'idle',
    },
    vfx: { play: () => Promise.resolve(), impact: () => Promise.resolve(), screenFlash: () => {} },
    actor: () => undefined,
    sideOf: (id: string) => (id === 'tidus' ? 'party' : 'enemy'),
    staged: () => [...rects.keys()],
    project: () => null,
    screenRects: () => new Map(rects),
  } as unknown as BattleStage & { screenRects(): ReadonlyMap<string, ScreenRect> };
  const root = document.createElement('div');
  document.body.appendChild(root);
  const cutscenes = createMidBattleCutscenes({ root, stage, game: 'ffx', sleep: () => new Promise<void>(() => {}) });
  const box = (): HTMLElement => root.querySelector('.dbox') as HTMLElement;
  const text = (): string => box().querySelector('.dbox__text')?.textContent ?? '';
  const frame = async (dt = 1 / 60): Promise<void> => {
    cutscenes.update(dt);
    for (let k = 0; k < 8; k++) await Promise.resolve();
  };
  return { cutscenes, box, text, frame, moves };
}

describe('the line waits for its card (both games)', () => {
  it("a first line does not type while the camera settles, and types once the card shows", async () => {
    const rects = new Map<string, ScreenRect>([['tidus', { x: 410, y: 520, w: 200, h: 330 }]]);
    const { cutscenes, box, text, frame } = mount(rects);
    void cutscenes.play([say('tidus', 'Hn. Not yet.', { auto: 1000 })], { name: 'hold-test' });
    for (let k = 0; k < 8; k++) await Promise.resolve();
    // The camera eases for a quarter second: the box is hidden and has typed nothing.
    for (let i = 0; i < 15; i++) {
      rects.set('tidus', { x: 410 + i * 4, y: 520, w: 200, h: 330 });
      await frame();
    }
    expect(box().classList.contains('dbox--settling')).toBe(true);
    expect(text()).toBe('');
    // It holds still: after STILL_MS the card shows, and only then does the text type.
    for (let i = 0; i < Math.ceil(STILL_MS / (1000 / 60)) + 2; i++) await frame();
    expect(box().classList.contains('dbox--settling')).toBe(false);
    for (let i = 0; i < 6; i++) await frame();
    expect(text().length).toBeGreaterThan(0);
  });

  it("a camera step after the beat's last line puts the card away before the camera moves", async () => {
    const rects = new Map<string, ScreenRect>([
      ['tidus', { x: 410, y: 520, w: 200, h: 330 }],
      ['shuyin', { x: 781, y: 122, w: 261, h: 436 }],
    ]);
    // The move is still running (it never resolves here), as it is for 700 ms in Chapter V.
    const { cutscenes, box, frame, moves } = mount(rects, false);
    void cutscenes.play([say('shuyin', "No. I'll end all of it.", { auto: 1 }), camera('action', 700)], { name: 'camera-test' });
    for (let i = 0; i < 200 && moves.length === 0; i++) {
      await frame(1 / 20);
      await new Promise((r) => setTimeout(r, 1));
    }
    expect(moves).toEqual(['action']);
    // Whatever the camera now does, the finished line is no longer up over Shuyin.
    expect(box().hidden).toBe(false);
    expect(box().classList.contains('dbox--settling')).toBe(true);
  });
});
