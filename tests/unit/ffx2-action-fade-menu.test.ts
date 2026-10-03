/**
 * Round 19, PR-0312 (FFX-2 only): the advisory cards (advisor, guide, enemy intent) do not fade while the command list is up, because the
 * MAX mix's larger boss put them under the acting figure and they sat at opacity 0 for 0.55 to 0.6 s on every Bahamut action while the
 * player was reading them. With no menu the A-15 fade is as it was (`ffx2-action-fade.test.ts`).
 */
import { describe, expect, it } from 'vitest';
import { ActionFade } from '../../src/ui/ffx2/actionFade.ts';

describe('the FFX-2 cards while a menu is open (PR-0312)', () => {
  const fade = (menu: boolean): { fadeClass: boolean } => {
    const el = { getBoundingClientRect: () => ({ left: 100, top: 100, width: 200, height: 100 }), classList: { on: false, toggle(_c: string, v: boolean) { this.on = v; } } };
    const af = new ActionFade({ cards: () => [el as unknown as HTMLElement], rect: () => ({ x: 120, y: 120, w: 100, h: 300 }), menuOpen: () => menu });
    af.signal({ phase: 'action-start', actorId: 'bahamut', targets: ['yuna'] });
    return { fadeClass: el.classList.on };
  };

  it('FFX-2: an action over a card fades it as before, but not while a command menu is open', () => {
    expect(fade(false).fadeClass).toBe(true);
    expect(fade(true).fadeClass).toBe(false);
  });

});
