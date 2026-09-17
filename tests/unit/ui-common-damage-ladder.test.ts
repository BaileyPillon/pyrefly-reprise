import { describe, expect, it } from 'vitest';
import {
  bouncePosition,
  classifyDamageEvent,
  computeHitOffset,
  deflectFromRects,
  fontSizeFor,
  jitterX,
  lifetimeMsFor,
  opacityAt,
  scaleAt,
  textFor,
} from '../../src/ui/common/damageLadder.ts';

describe('classifyDamageEvent', () => {
  it('classifies a plain hit as damage', () => {
    expect(classifyDamageEvent({ amount: 1268 })).toBe('damage');
  });

  it('classifies a critical hit distinctly from a normal one', () => {
    expect(classifyDamageEvent({ amount: 2000, critical: true })).toBe('critical');
  });

  it('classifies negative amounts as healing', () => {
    expect(classifyDamageEvent({ amount: -450 })).toBe('heal');
  });

  it('classifies MP amounts separately from HP', () => {
    expect(classifyDamageEvent({ amount: 30, isMp: true })).toBe('mp');
  });

  it('classifies immune/absorbed by affinity, ignoring amount', () => {
    expect(classifyDamageEvent({ amount: 0, affinity: 'immune' })).toBe('immune');
    expect(classifyDamageEvent({ amount: -100, affinity: 'absorb' })).toBe('absorbed');
  });

  it('classifies a whiffed hit as a miss even with an amount present', () => {
    expect(classifyDamageEvent({ amount: 500, hit: false })).toBe('miss');
  });

  it('classifies an event with no amount at all as a miss', () => {
    expect(classifyDamageEvent({})).toBe('miss');
  });
});

describe('computeHitOffset — the multi-hit ladder', () => {
  it('does not offset the first hit', () => {
    expect(computeHitOffset(0)).toEqual({ dx: 0, dy: 0, delayMs: 0 });
  });

  it('offsets each subsequent hit by (+4, -3) and staggers by 80ms, per §3.6', () => {
    expect(computeHitOffset(1)).toEqual({ dx: 4, dy: -3, delayMs: 80 });
    expect(computeHitOffset(3)).toEqual({ dx: 12, dy: -9, delayMs: 240 });
  });

  it('clamps a negative index to the first-hit offset', () => {
    expect(computeHitOffset(-5)).toEqual({ dx: 0, dy: 0, delayMs: 0 });
  });
});

describe('jitterX', () => {
  it('stays within the documented +/-6px band', () => {
    for (let i = 0; i < 50; i++) {
      const j = jitterX();
      expect(j).toBeGreaterThanOrEqual(-6);
      expect(j).toBeLessThanOrEqual(6);
    }
  });

  it('is deterministic given a deterministic rng', () => {
    expect(jitterX(() => 0)).toBe(-6);
    expect(jitterX(() => 1)).toBe(6);
    expect(jitterX(() => 0.5)).toBe(0);
  });
});

describe('lifetimeMsFor / fontSizeFor / textFor', () => {
  it('gives healing a longer float than a miss', () => {
    expect(lifetimeMsFor('heal')).toBeGreaterThan(lifetimeMsFor('miss'));
  });

  it('renders a critical hit larger than a normal one', () => {
    expect(fontSizeFor('critical')).toBeGreaterThan(fontSizeFor('damage'));
  });

  it('formats plain and healing numerals with the right sign', () => {
    expect(textFor('damage', 1268)).toBe('1268');
    expect(textFor('heal', -450)).toBe('+450');
  });

  it('renders the fixed strings for miss/immune/absorbed regardless of amount', () => {
    expect(textFor('miss')).toBe('MISS');
    expect(textFor('immune', 0)).toBe('IMMUNE');
    expect(textFor('absorbed', -900)).toBe('ABSORBED');
  });
});

describe('bouncePosition', () => {
  it('starts at the spawn point for every kind', () => {
    expect(bouncePosition(0, 'damage', 0)).toEqual({ x: 0, y: 0 });
    expect(bouncePosition(0, 'heal', 0)).toEqual({ x: 0, y: 0 });
  });

  it('a damage numeral rises (negative y) shortly after spawning', () => {
    const { y } = bouncePosition(80, 'damage', 0);
    expect(y).toBeLessThan(0);
  });

  it('a damage numeral falls back down and settles near the floor later', () => {
    const late = bouncePosition(850, 'damage', 0);
    expect(late.y).toBeGreaterThan(-140);
    expect(late.y).toBeLessThanOrEqual(18 + 40);
  });

  it('healing floats straight up with no horizontal drift', () => {
    const { x, y } = bouncePosition(500, 'heal', 7);
    expect(x).toBe(0);
    expect(y).toBeLessThan(0);
  });

  it('a miss slides sideways without any vertical motion', () => {
    const { y } = bouncePosition(250, 'miss', 0);
    expect(y).toBe(0);
  });
});

describe('opacityAt / scaleAt', () => {
  it('is fully opaque for most of the lifetime, then fades to 0 by the end', () => {
    expect(opacityAt(0, 'damage')).toBe(1);
    expect(opacityAt(lifetimeMsFor('damage'), 'damage')).toBe(0);
  });

  it('spawns oversized and settles to 1x quickly', () => {
    expect(scaleAt(0, 'damage')).toBeGreaterThan(1);
    expect(scaleAt(200, 'damage')).toBe(1);
  });

  it('pops a critical hit larger than a normal one at spawn', () => {
    expect(scaleAt(0, 'critical')).toBeGreaterThan(scaleAt(0, 'damage'));
  });
});

describe('deflectFromRects — keeping numerals off the HUD slabs', () => {
  const half = { w: 30, h: 12 };
  const menu = { left: 80, top: 320, right: 440, bottom: 830 };

  it('leaves a numeral alone when it clears every panel', () => {
    expect(deflectFromRects({ x: 900, y: 400 }, half, [menu])).toEqual({ x: 900, y: 400 });
  });

  it('slides a numeral that lands inside the command menu out to the nearer edge', () => {
    // Projected onto the ATTACK row, as a hit on a party member standing
    // behind the command stack does (docs/screenshots/46-attack.png).
    const out = deflectFromRects({ x: 400, y: 445 }, half, [menu], {
      left: 0,
      top: 0,
      right: 1600,
      bottom: 900,
    });
    expect(out.x - half.w).toBeGreaterThanOrEqual(menu.right);
    expect(out.y).toBe(445);
  });

  it('pushes up rather than down when both verticals are equally far', () => {
    const band = { left: 0, top: 380, right: 1600, bottom: 480 };
    const out = deflectFromRects({ x: 800, y: 430 }, half, [band], {
      left: 0,
      top: 0,
      right: 1600,
      bottom: 900,
    });
    expect(out.y + half.h).toBeLessThanOrEqual(band.top);
  });

  it('clears both panels when the first push lands inside the second', () => {
    const a = { left: 80, top: 320, right: 440, bottom: 830 };
    const b = { left: 450, top: 320, right: 700, bottom: 830 };
    const out = deflectFromRects({ x: 430, y: 500 }, half, [a, b], {
      left: 0,
      top: 0,
      right: 1600,
      bottom: 900,
    });
    const box = { left: out.x - half.w, right: out.x + half.w, top: out.y - half.h, bottom: out.y + half.h };
    for (const r of [a, b]) {
      const hits = box.right > r.left && box.left < r.right && box.bottom > r.top && box.top < r.bottom;
      expect(hits).toBe(false);
    }
  });

  it('keeps the numeral inside the layer bounds', () => {
    const edge = { left: 1400, top: 0, right: 1600, bottom: 900 };
    const out = deflectFromRects({ x: 1560, y: 400 }, half, [edge], {
      left: 0,
      top: 0,
      right: 1600,
      bottom: 900,
    });
    expect(out.x + half.w).toBeLessThanOrEqual(1600);
    expect(out.x - half.w).toBeGreaterThanOrEqual(0);
  });
});
