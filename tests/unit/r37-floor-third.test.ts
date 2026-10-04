// @vitest-environment jsdom
/**
 * r37-ui-floor, third attempt (method check `docs/plans/r37-ui-floor-method-check.md`): the three blockers the
 * re-check left. Game case: the coach line's box is both games (FFX has no badge, so its box is the slab; the badge
 * is FFX-2's); the plate and the hand are FFX only; the party list's aim nudge is FFX only (FFX-2's list is
 * left-anchored and TEXT SIZE does not reach its HUD). Browser proof is in `docs/handoff/r37-ui-floor.md`.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { keepMarkInStage, markBox } from '../../src/ui/coach/coachIntentAvoid.ts';
import { dockPlate, handBox, overlapArea, plateBox } from '../../src/ui/ffx/targetCursorParts.ts';

const SRC = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'src');

function boxed(el: HTMLElement, r: { left: number; top: number; right: number; bottom: number }): void {
  el.getBoundingClientRect = (): DOMRect =>
    ({ left: r.left, top: r.top, right: r.right, bottom: r.bottom, x: r.left, y: r.top, width: r.right - r.left, height: r.bottom - r.top, toJSON: () => ({}) }) as DOMRect;
}

/** A coach line (slab 400x146) with its 456x26 badge hanging 30 px above and 3 px right, in a 1440x900 host. */
function line(top: number, left: number, withBadge = true): { mark: HTMLElement; host: HTMLElement } {
  const host = document.createElement('div');
  boxed(host, { left: 0, top: 0, right: 1440, bottom: 900 });
  const mark = document.createElement('div');
  mark.className = 'coach-mark';
  mark.style.top = `${top}px`;
  mark.style.left = `${left}px`;
  boxed(mark, { left, top, right: left + 400, bottom: top + 146 });
  host.append(mark);
  if (withBadge) {
    const badge = document.createElement('div');
    badge.className = 'coach-mark__running';
    boxed(badge, { left: left + 3, top: top - 30, right: left + 459, bottom: top - 4 });
    mark.append(badge);
  }
  document.body.append(host);
  return { mark, host };
}

describe('blocker 1: the coach line stays whole inside the stage, badge included (both games; FFX has no badge)', () => {
  it('markBox is the slab plus the badge', () => {
    const { mark } = line(300, 100);
    expect(markBox(mark)).toEqual({ left: 100, top: 270, right: 559, bottom: 446 });
  });
  it('a line parked at the stage top lowers by the badge it hangs (was y -20 at 1024x768 and 1600x900)', () => {
    const { mark, host } = line(10, 400);
    expect(keepMarkInStage(mark, host)).toBe(true);
    expect(parseFloat(mark.style.top)).toBe(30); // badge top 0, slab 30
  });
  it('a badge that runs past the right edge pulls the line left (it ended at x 1468 on a 1440 window)', () => {
    const { mark, host } = line(500, 1038);
    expect(keepMarkInStage(mark, host)).toBe(true);
    expect(parseFloat(mark.style.left)).toBe(1038 - (1038 + 459 - 1440)); // the badge's right edge lands on 1440
  });
  it('a line already inside is left alone (so a per-frame caller settles)', () => {
    const { mark, host } = line(300, 100);
    expect(keepMarkInStage(mark, host)).toBe(false);
    expect(mark.style.top).toBe('300px');
  });
  it('FFX has no badge: its box is the slab and the same clamp applies', () => {
    const { mark, host } = line(-12, 100, false);
    expect(keepMarkInStage(mark, host)).toBe(true);
    expect(parseFloat(mark.style.top)).toBe(0);
  });
});

describe('blocker 2: the plate dock treats the hand as a panel (FFX only)', () => {
  const enemy = { x: 150, y: 176, w: 90, h: 80 };
  const hand = handBox(enemy, 10);
  it('handBox sits left of the figure at 55 % of its height, 44x30 plus the 6 px bob', () => {
    expect(hand).toEqual({ x: 150 - 10 - 44, y: 176 + 80 * 0.55 - 15, w: 50, h: 30 });
  });
  it('with the strip above and the list below, the plate that used to take the left now keeps off the hand', () => {
    const strip = { x: 0, y: 60, w: 390, h: 117 };
    const below = { x: 0, y: 262, w: 390, h: 300 };
    const right = { x: 245, y: 150, w: 145, h: 120 };
    const before = dockPlate(enemy, 119, 34, [strip, below, right]);
    expect(before.side).toBe('left'); // the failure: the only clear side is the hand's side
    const after = dockPlate(enemy, 119, 34, [strip, below, right, hand]);
    const box = plateBox(after.side, after.x, after.y, 119, 34);
    expect(overlapArea(box, hand)).toBe(0);
  });
  it('an open field still takes the plate below the figure, as approved', () => {
    expect(dockPlate(enemy, 119, 34, [hand]).side).toBe('below');
  });
});

describe('blocker 3: the party list aim nudge is capped by the room the margin leaves (FFX only)', () => {
  const css = readFileSync(join(SRC, 'ui', 'common', 'hud-floor.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  it('the cap is (23.11 - 2) / text scale - the OD hang, never below 0, never above the approved 6 %; the hang is measured at run time (r381-ui-floor), 9.25 grid px until it is', () => {
    expect(css).toMatch(
      /html:not\(\[data-phone-battle\]\) \.ffxhud--targeting-enemy \.ig-stat-list \{\s*transform: translateX\(min\(6%, max\(0px, calc\(21\.1px \/ var\(--pyr-ts, 1\) - var\(--ffx-od-hang, 9\.25px\)\)\)\)\);/,
    );
  });
  it('the cap arithmetic keeps the OD word inside a 1024 px window at 100, 115 and 130 %', () => {
    const grid = 1024 / 640;
    for (const ts of [1, 1.15, 1.3]) {
      const room = Math.min(0.06 * 213.75, Math.max(0, 21.1 / ts - 9.25));
      const rightEdge = (640 - 23.11 + (9.25 + room) * ts) * grid;
      expect(rightEdge, `ts ${ts}`).toBeLessThanOrEqual(1024 - 2);
    }
  });
});

describe('blocker 3 (the hand over the Sensor card, FFX only): the hand stays beside the figure it points at', () => {
  const hand = { left: 884, top: 390, right: 928, bottom: 420 };
  const sensor = { left: 868, top: 304, right: 1169, bottom: 503 }; // Chapter II 1440x900, TEXT SIZE 115: a card taller than the old 3-hand limit
  it('the old limit (90 px) found no clear place; the figure range finds the one inside it', async () => {
    const { clearHandShift } = await import('../../src/ui/ffx/handClear.ts');
    expect(clearHandShift(hand, [sensor], 90)).toBe(0);
    expect(clearHandShift(hand, [sensor], 400, { top: 150, bottom: 640 })).toBe(117); // down, past the card: 503 + 4 - 390
  });
  it('a place outside the figure is not taken', async () => {
    const { clearHandShift } = await import('../../src/ui/ffx/handClear.ts');
    expect(clearHandShift(hand, [sensor], 400, { top: 380, bottom: 450 })).toBe(0);
  });
});
