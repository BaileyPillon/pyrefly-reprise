// @vitest-environment jsdom
/**
 * The title card's motion — `src/app/screens/frontend/parallax.ts` and
 * `motes.ts`, plus the markup in `titleMarkup.ts`.
 *
 * Approved end state: docs/concepts/polish/showpiece-frontend/after.png and
 * its motion.webm. The facts pinned here are the ones the card names as its
 * risk and the ones the brief makes conditions: the drift is slow, it only
 * ever writes transforms, and reduced motion is the **still** composition —
 * which is after.png itself.
 */
import { describe, expect, it } from 'vitest';

import { MoteField } from '../../src/app/screens/frontend/motes.ts';
import { ParallaxField, normalisePointer } from '../../src/app/screens/frontend/parallax.ts';
import { titleMarkup } from '../../src/app/screens/frontend/titleMarkup.ts';

function layer(): HTMLElement {
  const el = document.createElement('div');
  document.body.appendChild(el);
  return el;
}

function translateX(el: HTMLElement): number {
  const m = /translate3d\((-?[\d.]+)px/.exec(el.style.transform);
  return m ? Number(m[1]) : NaN;
}

describe('ParallaxField', () => {
  it('writes only a transform — never a property that costs a layout', () => {
    const el = layer();
    const field = new ParallaxField({ layers: [{ el, depth: 1, scale: 1.11 }] });
    field.setPointer(1, 1);
    for (let i = 0; i < 60; i++) field.update(1 / 60);
    expect(el.style.transform).toMatch(/^translate3d\(/);
    // `style` holds exactly one declaration, and it is the transform.
    expect(Array.from(el.style)).toEqual(['transform']);
  });

  it('moves a near plane further than a far one, in the direction of the pointer', () => {
    const far = layer();
    const near = layer();
    const field = new ParallaxField({
      layers: [
        { el: far, depth: 0.35, scale: 1.045 },
        { el: near, depth: 1, scale: 1.11 },
      ],
    });
    field.setPointer(1, 0);
    for (let i = 0; i < 120; i++) field.update(1 / 60);
    expect(translateX(near)).toBeLessThan(0);
    expect(Math.abs(translateX(near))).toBeGreaterThan(Math.abs(translateX(far)));
  });

  it('is slow: unattended, the front plane never travels 4px in any second of a full cycle', () => {
    const el = layer();
    const field = new ParallaxField({ layers: [{ el, depth: 1 }] });
    field.update(1 / 60);
    // A full 26-second drift cycle, measured a second at a time. The steepest
    // second is the budget the card's risk line asks for: "slow enough not to
    // fight the serif".
    let worst = 0;
    for (let s = 0; s < 27; s++) {
      const start = translateX(el);
      for (let i = 0; i < 60; i++) field.update(1 / 60);
      worst = Math.max(worst, Math.abs(translateX(el) - start));
    }
    expect(worst).toBeLessThan(4);
    // ...and it really is moving, rather than passing by standing still.
    expect(worst).toBeGreaterThan(0.5);
  });

  it('keeps the composition still under reduced motion, however hard it is driven', () => {
    const el = layer();
    const field = new ParallaxField({ layers: [{ el, depth: 1, scale: 1.11 }], reduceMotion: true });
    const still = el.style.transform;
    field.setPointer(-1, 1);
    field.setStick(1, -1);
    for (let i = 0; i < 300; i++) field.update(1 / 60);
    expect(el.style.transform).toBe(still);
    expect(translateX(el)).toBe(0);
  });

  it('ignores a resting stick but follows a pushed one', () => {
    const el = layer();
    const field = new ParallaxField({ layers: [{ el, depth: 1 }] });
    field.setStick(0.05, -0.05);
    for (let i = 0; i < 60; i++) field.update(1 / 60);
    expect(Math.abs(field.offset().x)).toBeLessThan(0.02);
    field.setStick(-1, 0);
    for (let i = 0; i < 180; i++) field.update(1 / 60);
    expect(field.offset().x).toBeLessThan(-0.5);
  });

  it('maps a pointer to -1..1 from the centre of the window', () => {
    expect(normalisePointer(800, 450, 1600, 900)).toEqual({ x: 0, y: 0 });
    expect(normalisePointer(0, 0, 1600, 900)).toEqual({ x: -1, y: -1 });
    expect(normalisePointer(9999, 9999, 1600, 900)).toEqual({ x: 1, y: 1 });
  });
});

describe('MoteField', () => {
  it('builds the concept’s sixteen pyreflies and animates them with transforms', () => {
    const host = layer();
    const motes = new MoteField(host, {});
    expect(motes.size).toBe(16);
    const first = host.querySelector('.fe-mote') as HTMLElement;
    // Base position is a one-time left/top; the motion is transform only.
    expect(first.style.left).not.toBe('');
    const before = first.style.top;
    motes.update(1);
    expect(first.style.transform).toMatch(/^translate3d\(/);
    expect(first.style.top).toBe(before);
  });

  it('is the still frame under reduced motion', () => {
    const host = layer();
    const motes = new MoteField(host, { reduceMotion: true });
    const first = host.querySelector('.fe-mote') as HTMLElement;
    for (let i = 0; i < 120; i++) motes.update(1 / 60);
    expect(first.style.transform).toBe('');
  });

  it('thins the field for the low-effects tier and cleans up after itself', () => {
    const host = layer();
    const motes = new MoteField(host, { count: 8 });
    expect(host.querySelectorAll('.fe-mote')).toHaveLength(8);
    motes.dispose();
    expect(host.querySelectorAll('.fe-mote')).toHaveLength(0);
  });
});

describe('titleMarkup', () => {
  const html = titleMarkup({ briefingChip: false });

  it('splits one approved painting into two planes and never asks for a second file', () => {
    const far = html.match(/fe-title__plane--far/g) ?? [];
    const near = html.match(/fe-title__plane--near/g) ?? [];
    expect(far).toHaveLength(1);
    expect(near).toHaveLength(1);
    const sources = new Set(Array.from(html.matchAll(/src="([^"]+backdrops[^"]+)"/g), (m) => m[1]));
    expect(sources.size).toBe(1);
  });

  it('puts the two on the shore in as approved paintings, drawn as silhouettes', () => {
    expect(html).toContain('art/characters/tidus/idle.png');
    expect(html).toContain('art/characters/yuna/idle.png');
    // Two figures and their two reflections, every one of them an ink shape.
    expect(html.match(/class="fe-sil"/g) ?? []).toHaveLength(4);
  });

  it('keeps the approved slab copy and the Press Enter chip as a real button', () => {
    expect(html).toContain('An unofficial fan tribute');
    expect(html).toContain('Pyrefly');
    expect(html).toContain('Reprise');
    expect(html).toContain('data-action="confirm"');
  });

  it('shows the briefing chip only when onboarding is live', () => {
    expect(html).not.toContain('title:briefing');
    expect(titleMarkup({ briefingChip: true })).toContain('title:briefing');
  });
});
