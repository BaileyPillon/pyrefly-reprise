// @vitest-environment jsdom
/**
 * A-15, measured live (iter2 B6): FFX-2's ATB actions overlap. The engine logs a cast's
 * action-start, then a whole second action (turn-start, action-start, damage, action-end), then the
 * cast's own heal and action-end. The presenter's one-slot signal cancels the cast when the second
 * action starts, so the heal landed with the cards back over Yuna (Chapter IV, 1600x900). The fade
 * now follows the actions still open in the event stream the HUD hears first and protects the
 * figures of every one of them. The presenter's burst-end cancel no longer ends a cast
 * that resumes in the next burst.
 *
 * Game case: FFX-2 only (the ATB HUD).
 */

import { describe, expect, it } from 'vitest';
import type { BattleEvent } from '../../src/battle/common/types.ts';
import { ACTION_FADE_CLASS, ActionFade, OPEN_ACTION_TTL_MS, type FadeBox } from '../../src/ui/ffx2/actionFade.ts';

function card(box: FadeBox): HTMLElement {
  const el = document.createElement('div');
  el.getBoundingClientRect = () => ({ left: box.x, top: box.y, width: box.w, height: box.h, right: box.x + box.w, bottom: box.y + box.h, x: box.x, y: box.y, toJSON: () => ({}) }) as DOMRect;
  return el;
}

const FIGURES: Record<string, FadeBox> = {
  yuna: { x: 1100, y: 400, w: 120, h: 300 },
  paine: { x: 900, y: 400, w: 120, h: 300 },
  bahamut: { x: 200, y: 100, w: 500, h: 600 },
};
const ev = (e: Record<string, unknown>): BattleEvent => e as unknown as BattleEvent;

describe('A-15: overlapping FFX-2 actions', () => {
  it('a cast that resumes after another girl\'s action fades the cards over its caster again', () => {
    const overYuna = card({ x: 1050, y: 450, w: 200, h: 60 });
    const overBahamut = card({ x: 300, y: 300, w: 200, h: 100 });
    const fade = new ActionFade({ cards: () => [overYuna, overBahamut], rect: (id) => FIGURES[id] ?? null });
    const faded = (c: HTMLElement): boolean => c.classList.contains(ACTION_FADE_CLASS);

    // The HUD hears each event first, then the presenter's signal follows it.
    fade.observe(ev({ type: 'action-start', actorId: 'yuna', targets: ['yuna'] }));
    fade.signal({ phase: 'action-start', actorId: 'yuna', targets: ['yuna'] });
    expect(faded(overYuna)).toBe(true);

    fade.observe(ev({ type: 'turn-start', actorId: 'paine' }));
    fade.signal({ phase: 'cancel', actorId: 'yuna' }); // the presenter's one slot lets go of Yuna
    expect(faded(overYuna), 'a turn starting under the cast does not end it').toBe(true);

    fade.observe(ev({ type: 'action-start', actorId: 'paine', targets: ['bahamut'] }));
    fade.signal({ phase: 'action-start', actorId: 'paine', targets: ['bahamut'] });
    expect(faded(overBahamut)).toBe(true);

    expect(faded(overYuna), "Yuna's cast is still open under Paine's blow").toBe(true);
    fade.observe(ev({ type: 'action-end', actorId: 'paine' }));
    fade.signal({ phase: 'action-end', actorId: 'paine' });
    expect(faded(overBahamut)).toBe(false);
    expect(faded(overYuna), 'Yuna\'s heal is still to land').toBe(true);

    fade.observe(ev({ type: 'heal', targetId: 'yuna' }));
    expect(faded(overYuna)).toBe(true);
    fade.observe(ev({ type: 'action-end', actorId: 'yuna' }));
    expect(faded(overYuna)).toBe(false);
    expect(fade.active).toBe(false);
  });

  it('a cast that spans two bursts stays faded through the burst-end cancel, until its own end', () => {
    // Measured live (Chapter IV): the presenter cancels at every burst's end; Yuna's Cure started in
    // one burst and healed in the next, and the card came back over her for the heal.
    const c = card({ x: 1050, y: 450, w: 200, h: 60 });
    const fade = new ActionFade({ cards: () => [c], rect: (id) => FIGURES[id] ?? null });
    fade.observe(ev({ type: 'action-start', actorId: 'yuna', targets: ['yuna'] }));
    fade.signal({ phase: 'action-start', actorId: 'yuna', targets: ['yuna'] });
    fade.observe(ev({ type: 'atb' }));
    fade.signal({ phase: 'cancel', actorId: 'yuna' }); // the burst ended
    expect(c.classList.contains(ACTION_FADE_CLASS)).toBe(true);
    fade.observe(ev({ type: 'heal', targetId: 'yuna' }));
    fade.observe(ev({ type: 'action-end', actorId: 'yuna' }));
    expect(c.classList.contains(ACTION_FADE_CLASS)).toBe(false);
    expect(fade.active).toBe(false);
  });

  it('the HUD unmounting clears every open action', () => {
    const c = card({ x: 1050, y: 450, w: 200, h: 60 });
    const fade = new ActionFade({ cards: () => [c], rect: (id) => FIGURES[id] ?? null });
    fade.observe(ev({ type: 'action-start', actorId: 'yuna', targets: ['yuna'] }));
    fade.reset();
    expect(fade.active).toBe(false);
    expect(c.classList.contains(ACTION_FADE_CLASS)).toBe(false);
  });

  it('victory or defeat clears, and an action whose end never came goes stale', () => {
    let now = 0;
    const c = card({ x: 1050, y: 450, w: 200, h: 60 });
    const fade = new ActionFade({ cards: () => [c], rect: (id) => FIGURES[id] ?? null, now: () => now });
    fade.observe(ev({ type: 'action-start', actorId: 'yuna', targets: ['yuna'] }));
    expect(fade.active).toBe(true);
    now = OPEN_ACTION_TTL_MS + 1;
    fade.update();
    expect(fade.active).toBe(false);
    expect(c.classList.contains(ACTION_FADE_CLASS)).toBe(false);
    fade.observe(ev({ type: 'action-start', actorId: 'yuna', targets: ['yuna'] }));
    fade.observe(ev({ type: 'victory' }));
    expect(fade.active).toBe(false);
  });
});
