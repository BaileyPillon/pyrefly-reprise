// @vitest-environment jsdom
/**
 * PR-0232 (critic round 15): on a phone in Chapter XII a tap meant for Yuna
 * went to another figure's bracket. Measured before the fix at 390x844, seed 1,
 * on a Hi-Potion: Yuna's bracket [108, 253, 87x116], Auron's [92, 237, 65x95];
 * Auron's box, later in the DOM, covered Yuna's centre, and 4 of 5 taps there
 * healed Auron. Round 15 saw a dimmed Mortiphasm's box take the same taps.
 *
 * Case: both games (the target cursor is shared plumbing); the finding is FFX's.
 */
import { describe, expect, it } from 'vitest';
import { pickTargetAt, type HitCandidate } from '../../src/ui/ffx/targetHitPick.ts';
import { TargetCursor } from '../../src/ui/ffx/TargetCursor.ts';

const box = (id: string, x: number, y: number, w: number, h: number, inSet = true): HitCandidate => ({ id, left: x, top: y, right: x + w, bottom: y + h, inSet });

describe('pickTargetAt', () => {
  const yuna = box('yuna', 108, 253, 87, 116);
  const auron = box('auron', 92, 237, 65, 95);
  const tidus = box('tidus', 50, 257, 78, 114);

  it("Yuna's centre means Yuna, whichever bracket is drawn on top", () => {
    expect(pickTargetAt([tidus, yuna, auron], 151.5, 311)).toBe('yuna');
    expect(pickTargetAt([auron, yuna, tidus], 151.5, 311)).toBe('yuna');
  });

  it("Auron's centre still means Auron", () => {
    expect(pickTargetAt([tidus, yuna, auron], 124.5, 284.5)).toBe('auron');
  });

  it('the side being aimed at beats a dimmed figure on the other side', () => {
    const mortiphasm = box('mortiphasm-2', 120, 280, 60, 60, false);
    expect(pickTargetAt([yuna, mortiphasm], 150, 310)).toBe('yuna');
  });

  it('a point in no bracket means nothing (the caller keeps the element that was clicked)', () => {
    expect(pickTargetAt([yuna, auron], 10, 10)).toBeNull();
  });
});

describe('TargetCursor draws the aimed-at side last', () => {
  it('ally brackets come after enemy brackets while a cure is aimed', () => {
    const cursor = new TargetCursor();
    document.body.append(cursor.el);
    cursor.setProjector((id) => ({ x: id === 'mortiphasm-2' ? 200 : 110, y: 250, w: 80, h: 110 }));
    cursor.showSingle(
      [
        { id: 'yuna', name: 'Yuna', kind: 'ally' },
        { id: 'mortiphasm-2', name: 'Mortiphasm', kind: 'enemy' },
        { id: 'auron', name: 'Auron', kind: 'ally' },
      ],
      0,
    );
    const order = [...cursor.el.querySelectorAll<HTMLElement>('[data-target-id]')].map((e) => e.dataset['targetId']);
    expect(order.indexOf('mortiphasm-2')).toBe(0);
    expect(order[order.length - 1]).toBe(cursor.targetIds[0]);
  });
});

describe('a coach line lets a tap reach any reticle (PR-0232)', () => {
  it('not only enemy reticles: a party member aimed at on a fresh profile too', async () => {
    const { readFileSync } = await import('node:fs');
    const css = readFileSync('src/ui/coach/coach-taps.css', 'utf8');
    expect(css).toMatch(/\.ffxhud:has\(\.ffx-targeting \[data-target-id\]\) ~ \.coach-layer \.coach-mark/);
    expect(css).toMatch(/\.ffx2hud:has\(\.ffx-targeting \[data-target-id\]\) ~ \.coach-layer \.coach-mark/);
  });
});
