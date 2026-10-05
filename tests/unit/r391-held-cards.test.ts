/**
 * Release 39.1, B2 (FFX-2 only): the strategy guide and the move advisor step out for the DRESSPHERE close-up, as the Sensor and enemy-intent
 * cards already do. The rule is keyed on `mix-held-sc` (set only for a dressphere shot, which only FFX-2 has), clips the cards instead of
 * hiding them (so `hudPanels` still counts the guide at the hand-back frame), and leaves the upright phone's HUD alone.
 */
import { describe, expect, it } from 'vitest';
import { HELD_SC_CSS } from '../../src/engine/fx/mix/MaxMix.ts';

describe('the dressphere close-up clears the guide and advisor cards (B2)', () => {
  it('names the guide and the advisor, keyed on the dressphere class only', () => {
    expect(HELD_SC_CSS).toContain('.sgd');
    expect(HELD_SC_CSS).toContain('.mad');
    expect(HELD_SC_CSS).toContain('html.mix-held-sc');
    // never the Overdrive shot's class: FFX keeps its guide and advisor
    expect(HELD_SC_CSS).not.toMatch(/mix-held[ ,{.:]/);
  });

  it('clips the cards without changing their box or visibility, so the HUD panel reads (`hudPanels`) are unchanged', () => {
    expect(HELD_SC_CSS).toContain('clip-path:inset(100%)');
    expect(HELD_SC_CSS).not.toMatch(/visibility|display|opacity/);
  });

  it("leaves the upright phone's HUD as laid out", () => {
    expect(HELD_SC_CSS.split(',').every((sel) => sel.includes(':not([data-phone-battle])'))).toBe(true);
  });
});
