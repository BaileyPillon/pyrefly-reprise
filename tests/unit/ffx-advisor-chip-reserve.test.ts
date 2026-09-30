// @vitest-environment jsdom
/**
 * PR-0266 (round 17, FFX only): the advisor card's `N HIDE MOVES` chip and its neighbours.
 *
 * TEXT SIZE 115 / 130 % grows the chip, but the solver reserved a fixed 11 grid px above
 * the card for it, and the guide's `G` chip and the battle screen's `PAUSE` chip were not
 * obstacles at all. The solver now takes the measured chip height (`chipReserve`) and the
 * two chips as rectangles; the helpers that read them off the DOM skip the upright phone.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { ADVISOR_CHIP_RESERVE, advisorZone, type AdvisorZoneInput } from '../../src/ui/ffx/hudSafeZones.ts';
import { applyComfort } from '../../src/app/applyComfort.ts';
import { chipObstacleEls, chipReserveOf } from '../../src/ui/ffx/hudAvoidSelectors.ts';

const base: AdvisorZoneInput = {
  cmdArea: { left: 30, top: 166, right: 218, bottom: 334 },
  cmdInfo: { left: 24, top: 121, right: 196, bottom: 154 },
  partyStatus: { left: 403, top: 258, right: 617, bottom: 348 },
  guide: null,
  sensor: null,
  sprites: [],
  enemies: [],
};

afterEach(() => {
  applyComfort({ textSize: 1 });
  document.documentElement.removeAttribute('data-phone-battle');
  document.body.innerHTML = '';
});

describe('PR-0266: the chip reserve follows the chip', () => {
  it('a taller chip leaves the card less height in the same box', () => {
    // A full-width band 110 grid px tall (walls above and below), so the box, not the cap, limits the card.
    const tight: AdvisorZoneInput = { ...base, enemies: [{ left: 0, top: 0, right: 640, bottom: 40 }, { left: 0, top: 150, right: 640, bottom: 360 }] };
    const small = advisorZone({ ...tight, chipReserve: ADVISOR_CHIP_RESERVE });
    const big = advisorZone({ ...tight, chipReserve: ADVISOR_CHIP_RESERVE + 4 });
    expect(small).not.toBeNull();
    expect(big).not.toBeNull();
    expect(small!.maxHeight - big!.maxHeight).toBeCloseTo(4, 5);
  });

  it('a reserve below the floor changes nothing', () => {
    expect(advisorZone({ ...base, chipReserve: 3 })).toEqual(advisorZone(base));
  });

  it('a key chip in the top-left corner is kept clear, chip strip included', () => {
    const chip = { left: 20, top: 30, right: 74, bottom: 44 };
    const zone = advisorZone({ ...base, enemies: [chip], chipReserve: 14 });
    expect(zone).not.toBeNull();
    // The strip the card and its chip occupy: from the chip's top edge down to the box bottom, across the card.
    const bottom = 360 - zone!.bottom;
    const strip = { left: zone!.left, right: zone!.left + zone!.width, top: bottom - zone!.maxHeight - 14, bottom };
    const overlap = strip.left < chip.right && strip.right > chip.left && strip.top < chip.bottom && strip.bottom > chip.top;
    expect(overlap).toBe(false);
  });
});

describe('PR-0266: what the HUD hands the solver', () => {
  const mount = (): HTMLElement => {
    const hud = document.createElement('div');
    hud.innerHTML = '<div class="sgd"><button class="sgd__toggle">G</button></div>';
    const pause = document.createElement('button');
    pause.className = 'battle-pause-chip';
    document.body.append(hud, pause);
    return hud;
  };

  it('the G chip and the PAUSE chip are obstacles on the desktop at 115 and 130 %, and not at 100 %', () => {
    const hud = mount();
    expect(chipObstacleEls(hud)).toEqual([]);
    expect(chipReserveOf({ top: 10, bottom: 22 }, 2, hud)).toBe(0);
    applyComfort({ textSize: 1.15 });
    expect(chipObstacleEls(hud).map((e) => e.className).sort()).toEqual(['battle-pause-chip', 'sgd__toggle']);
  });

  it('and neither on the upright phone', () => {
    const hud = mount();
    applyComfort({ textSize: 1.3 });
    document.documentElement.setAttribute('data-phone-battle', 'ffx');
    expect(chipObstacleEls(hud)).toEqual([]);
    expect(chipReserveOf({ top: 10, bottom: 22 }, 2, hud)).toBe(0);
  });

  it('the reserve is the chip height plus its gap, and 0 with no chip', () => {
    const hud = mount();
    applyComfort({ textSize: 1.3 });
    expect(chipReserveOf({ top: 10, bottom: 22 }, 2, hud)).toBe(14);
    expect(chipReserveOf(null, 2, hud)).toBe(0);
  });
});
