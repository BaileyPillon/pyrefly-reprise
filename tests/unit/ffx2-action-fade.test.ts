// @vitest-environment jsdom
/**
 * A-15 / PR-0157, the FFX-2 half: while an action plays, an advisory card over the acting figure
 * or a target's upper two thirds steps back, and comes back when it ends. Cards clear of both do
 * not move. B2's signal is `HudPort.setActing`; the FFX-2 HUD implements it.
 *
 * Game case: FFX-2 only.
 */

import { describe, expect, it } from 'vitest';
import { ACTION_FADE_CLASS, ActionFade, actionZones, meets, upperTwoThirds, type FadeBox } from '../../src/ui/ffx2/actionFade.ts';
import { FFX2BattleHud } from '../../src/ui/ffx2/FFX2BattleHud.ts';

function card(box: FadeBox): HTMLElement {
  const el = document.createElement('div');
  el.getBoundingClientRect = () => ({ left: box.x, top: box.y, width: box.w, height: box.h, right: box.x + box.w, bottom: box.y + box.h, x: box.x, y: box.y, toJSON: () => ({}) }) as DOMRect;
  return el;
}

const FIGURES: Record<string, FadeBox> = {
  yuna: { x: 1100, y: 400, w: 120, h: 300 },
  bahamut: { x: 200, y: 100, w: 500, h: 600 },
};

describe('A-15: the FFX-2 action fade', () => {
  it('a target is protected in its upper two thirds only', () => {
    expect(upperTwoThirds({ x: 0, y: 0, w: 10, h: 300 })).toEqual({ x: 0, y: 0, w: 10, h: 200 });
    const zones = actionZones({ actorId: 'yuna', targets: ['bahamut'] }, (id) => FIGURES[id] ?? null);
    expect(zones).toEqual([FIGURES['yuna'], { x: 200, y: 100, w: 500, h: 400 }]);
    expect(meets({ x: 0, y: 0, w: 10, h: 10 }, { x: 10.5, y: 0, w: 10, h: 10 })).toBe(false);
  });

  it('fades the cards over the actor or the target, keeps the rest, and restores on action-end', () => {
    const overTarget = card({ x: 300, y: 300, w: 200, h: 100 }); // inside Bahamut's upper two thirds
    const underTarget = card({ x: 300, y: 560, w: 200, h: 100 }); // his lower third only
    const overActor = card({ x: 1050, y: 600, w: 200, h: 60 });
    const clear = card({ x: 760, y: 780, w: 200, h: 80 });
    const fade = new ActionFade({ cards: () => [overTarget, underTarget, overActor, clear, null], rect: (id) => FIGURES[id] ?? null });

    fade.signal({ phase: 'action-start', actorId: 'yuna', targets: ['bahamut'] });
    expect(overTarget.classList.contains(ACTION_FADE_CLASS)).toBe(true);
    expect(overActor.classList.contains(ACTION_FADE_CLASS)).toBe(true);
    expect(underTarget.classList.contains(ACTION_FADE_CLASS)).toBe(false);
    expect(clear.classList.contains(ACTION_FADE_CLASS)).toBe(false);

    fade.signal({ phase: 'action-end', actorId: 'yuna' });
    for (const c of [overTarget, underTarget, overActor, clear]) expect(c.classList.contains(ACTION_FADE_CLASS)).toBe(false);
  });

  it('a cancel restores too, and nothing fades with no action on screen', () => {
    const c = card({ x: 300, y: 300, w: 200, h: 100 });
    const fade = new ActionFade({ cards: () => [c], rect: (id) => FIGURES[id] ?? null });
    fade.update();
    expect(c.classList.contains(ACTION_FADE_CLASS)).toBe(false);
    fade.signal({ phase: 'action-start', actorId: 'bahamut', targets: ['yuna'] });
    expect(c.classList.contains(ACTION_FADE_CLASS)).toBe(true);
    fade.signal({ phase: 'cancel', actorId: 'bahamut' });
    expect(c.classList.contains(ACTION_FADE_CLASS)).toBe(false);
    expect(fade.active).toBe(false);
  });

  it('the FFX-2 HUD hears the signal (HudPort.setActing)', () => {
    const hud = new FFX2BattleHud();
    expect(typeof hud.setActing).toBe('function');
    // Unmounted: nothing to fade, and it must not throw.
    expect(() => hud.setActing({ phase: 'action-start', actorId: 'yuna', targets: ['bahamut'] })).not.toThrow();
    expect(() => hud.setActing({ phase: 'action-end', actorId: 'yuna' })).not.toThrow();
  });
});
