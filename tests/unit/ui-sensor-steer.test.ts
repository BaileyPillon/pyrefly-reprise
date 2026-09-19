import { describe, expect, it } from 'vitest';
import { sensorSteerDx, SENSOR_STAGE_MARGIN } from '../../src/ui/ffx/sensorSteer.ts';

/**
 * The Sensor card opening across the fiend it describes — caught live in
 * Chapter 3 at 2000x1000, the read-out printed over the targeted Yu Pagoda's
 * base, its gold bracket and its "Yu Pagoda C" plate.
 *
 * GAME-AWARE (AGENTS.md rule 14): **FFX only** — the Sensor plate, the ability
 * and its `I` fold key are FFX's [research/visual-bible.md §3.5]. FFX-2 puts
 * an enemy's read-out on the boss gauge strip along the top, which never
 * enters the lane. The absence on the FFX-2 side is asserted at the bottom.
 */

/** The card at its resting place: grid 436,166, 100x78. */
const CARD = { left: 436, right: 536, top: 166, bottom: 244 };
const STAGE_W = 640;

describe('the Sensor card steps off its own subject', () => {
  it('leaves the card alone when nothing overlaps', () => {
    const farLeft = { left: 120, right: 220, top: 180, bottom: 300 };
    expect(sensorSteerDx(CARD, farLeft, STAGE_W)).toBeNull();
  });

  it('leaves it alone when the figure is under it but not behind it', () => {
    // Shares the card's x span, sits entirely below it.
    const low = { left: 450, right: 520, top: 260, bottom: 340 };
    expect(sensorSteerDx(CARD, low, STAGE_W)).toBeNull();
  });

  it('steps off a fiend it is covering, by the shorter of the two moves', () => {
    // The pagoda's right edge is 70px away, its left edge 122px: the card goes
    // right, because a mark that moves as little as possible is the one the
    // player's eye does not have to hunt for again.
    const pagoda = { left: 420, right: 500, top: 150, bottom: 300 };
    const dx = sensorSteerDx(CARD, pagoda, STAGE_W)!;
    expect(dx).not.toBeNull();
    const moved = { left: CARD.left + dx, right: CARD.right + dx };
    expect(moved.left).toBeGreaterThanOrEqual(pagoda.right);
    expect(moved.right).toBeLessThanOrEqual(STAGE_W - SENSOR_STAGE_MARGIN);
  });

  it('steps left when the left is the side with room', () => {
    // A fiend hard against the right edge: only the left has 100px to give.
    const pagoda = { left: 460, right: 636, top: 150, bottom: 300 };
    const dx = sensorSteerDx(CARD, pagoda, STAGE_W)!;
    const moved = { left: CARD.left + dx, right: CARD.right + dx };
    expect(moved.right).toBeLessThanOrEqual(pagoda.left);
    expect(moved.left).toBeGreaterThanOrEqual(SENSOR_STAGE_MARGIN);
  });

  it('steps right when the left has no room', () => {
    // A wide fiend whose left edge is too near the stage edge to fit 100px.
    const wide = { left: 60, right: 500, top: 150, bottom: 300 };
    const dx = sensorSteerDx(CARD, wide, STAGE_W)!;
    const moved = { left: CARD.left + dx, right: CARD.right + dx };
    expect(moved.left).toBeGreaterThanOrEqual(wide.right);
    expect(moved.right).toBeLessThanOrEqual(STAGE_W - SENSOR_STAGE_MARGIN);
  });

  it('gives up rather than shoving the card off the stage', () => {
    // Braska's Final Aeon at full width: no side of it has 100px to spare.
    const huge = { left: 20, right: 620, top: 140, bottom: 320 };
    expect(sensorSteerDx(CARD, huge, STAGE_W)).toBeNull();
  });

  it('never steers a card that is already clear, so the resting place stands', () => {
    // Every figure that misses the card answers null, not 0 — the difference
    // between "leave the stylesheet alone" and "write a zero offset onto it".
    for (const fig of [
      { left: 0, right: 100, top: 0, bottom: 360 },
      { left: 540, right: 640, top: 166, bottom: 244 },
      { left: 436, right: 536, top: 0, bottom: 160 },
    ]) {
      expect(sensorSteerDx(CARD, fig, STAGE_W)).toBeNull();
    }
  });

  it('is measured against the resting place, so repeated steers do not drift', () => {
    const pagoda = { left: 420, right: 500, top: 150, bottom: 300 };
    const first = sensorSteerDx(CARD, pagoda, STAGE_W)!;
    // The caller subtracts the live offset before asking again; the same
    // question must give the same answer however many times it is asked.
    expect(sensorSteerDx(CARD, pagoda, STAGE_W)).toBe(first);
  });

  it('ignores a degenerate card', () => {
    expect(sensorSteerDx({ left: 436, right: 436, top: 166, bottom: 244 }, CARD, STAGE_W)).toBeNull();
  });
});

describe('FFX-2 has no Sensor card to steer (rule 14)', () => {
  it('the FFX-2 HUD never imports the steer', async () => {
    const src = await import('node:fs').then((fs) =>
      fs.readFileSync(new URL('../../src/ui/ffx2/FFX2BattleHud.ts', import.meta.url), 'utf8'),
    );
    expect(src).not.toContain('sensorSteer');
    expect(src).not.toContain('--ffx-sensor-dx');
  });
});
