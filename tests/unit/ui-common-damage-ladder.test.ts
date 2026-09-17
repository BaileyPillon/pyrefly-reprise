import { describe, expect, it } from 'vitest';
import {
  bouncePosition,
  burstSlot,
  classifyDamageEvent,
  computeHitOffset,
  deflectFromRects,
  fanOffset,
  fontSizeFor,
  jitterX,
  lifetimeMsFor,
  nextBurstSlot,
  opacityAt,
  placeInSafeArea,
  resolveLanes,
  safeAreaFrom,
  scaleAt,
  textFor,
  FAN_COLUMNS,
  FAN_STEP,
  HIT_STAGGER_MS,
  LADDER_RUNGS,
  type BurstState,
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

// ---------------------------------------------------------------- round 2
//
// Issue 2 of `docs/handoff/playability-round-1.md`: multi-hit and multi-target
// numerals piled on one point. These cover the three mechanisms that replaced
// the single wrapping ladder.

describe('fanOffset — columns beside the ladder', () => {
  it('leaves the first column on the target, with no negative zero', () => {
    expect(fanOffset(0)).toBe(0);
    expect(Object.is(fanOffset(0), -0)).toBe(false);
  });

  it('alternates right then left so the group stays centred on the actor', () => {
    expect(fanOffset(1)).toBe(FAN_STEP);
    expect(fanOffset(2)).toBe(-FAN_STEP);
    expect(fanOffset(3)).toBe(2 * FAN_STEP);
    expect(fanOffset(4)).toBe(-2 * FAN_STEP);
  });

  it('wraps back to the middle after FAN_COLUMNS', () => {
    expect(fanOffset(FAN_COLUMNS)).toBe(fanOffset(0));
    expect(fanOffset(FAN_COLUMNS + 1)).toBe(fanOffset(1));
  });
});

describe('burstSlot — the ladder that fans instead of wrapping', () => {
  it('climbs the ladder within one column first', () => {
    for (let i = 0; i < LADDER_RUNGS; i++) {
      expect(burstSlot(i).column).toBe(0);
      expect(burstSlot(i).rung).toBe(i);
    }
  });

  it('opens a new column rather than printing over a rung still on screen', () => {
    const first = burstSlot(0);
    const wrapped = burstSlot(LADDER_RUNGS);
    expect(wrapped.rung).toBe(first.rung);
    expect(wrapped.column).toBe(1);
    // This is the `53-ffx2-vegnagun.png` failure: hit 5 used to land on hit 0.
    expect(Math.abs(wrapped.dx - first.dx)).toBeGreaterThanOrEqual(FAN_STEP);
  });

  it('gives every slot in a full fan its own cell', () => {
    const seen = new Set<string>();
    for (let i = 0; i < LADDER_RUNGS * FAN_COLUMNS; i++) {
      const s = burstSlot(i);
      seen.add(`${s.rung}:${s.column}`);
    }
    expect(seen.size).toBe(LADDER_RUNGS * FAN_COLUMNS);
  });

  it('rises per rung by more than the arc climbs during one stagger, plus a glyph', () => {
    // The regression this constant exists for: a hit released 80ms later is
    // that much lower on its own arc, which used to cancel out its rung.
    const risePerStagger = Math.abs(bouncePosition(HIT_STAGGER_MS, 'damage', 0).y);
    const pitch = Math.abs(burstSlot(1).dy - burstSlot(0).dy);
    expect(pitch).toBeGreaterThan(risePerStagger + fontSizeFor('damage'));
  });

  it('never reports a negative zero for the first slot', () => {
    expect(Object.is(burstSlot(0).dy, -0)).toBe(false);
    expect(burstSlot(-4).rung).toBe(0);
  });
});

describe('nextBurstSlot — the per-target queue', () => {
  it('releases the first hit on a target immediately', () => {
    const first = nextBurstSlot(undefined, 1000);
    expect(first.index).toBe(0);
    expect(first.delayMs).toBe(0);
  });

  it('spaces eight hits resolved in one engine tick 80ms apart', () => {
    const delays: number[] = [];
    let state: BurstState | undefined;
    for (let i = 0; i < 8; i++) {
      const slot = nextBurstSlot(state, 0, i);
      delays.push(slot.delayMs);
      state = slot.state;
    }
    expect(delays).toEqual([0, 80, 160, 240, 320, 400, 480, 560]);
  });

  it('adds no delay at all when the presenter already paces its hits', () => {
    let state: BurstState | undefined;
    let now = 0;
    for (let i = 0; i < 5; i++) {
      const slot = nextBurstSlot(state, now, i);
      expect(slot.delayMs).toBe(0);
      state = slot.state;
      now += 150; // wider than HIT_STAGGER_MS, narrower than the burst gap
    }
    expect(state?.next).toBe(5);
  });

  it('caps how long one numeral may be held back', () => {
    let state: BurstState | undefined;
    let last = 0;
    for (let i = 0; i < 40; i++) {
      const slot = nextBurstSlot(state, 0, i, { maxDelayMs: 300 });
      last = slot.delayMs;
      state = slot.state;
    }
    expect(last).toBe(300);
  });

  it('restarts the ladder once the target has been quiet', () => {
    const first = nextBurstSlot(undefined, 0);
    const during = nextBurstSlot(first.state, 100);
    expect(during.index).toBe(1);
    const after = nextBurstSlot(during.state, 100 + 801);
    expect(after.index).toBe(0);
    expect(after.delayMs).toBe(0);
  });

  it("honours the engine's own hit index when it is ahead of the counter", () => {
    const first = nextBurstSlot(undefined, 0, 0);
    const jumped = nextBurstSlot(first.state, 0, 6);
    expect(jumped.index).toBe(6);
    expect(nextBurstSlot(jumped.state, 0, 0).index).toBe(7);
  });
});

describe('resolveLanes — one lane per target', () => {
  it('leaves a lone target where it is', () => {
    expect(resolveLanes([{ id: 'a', x: 500, halfWidth: 40 }]).get('a')).toBe(0);
  });

  it('separates two actors who project to the same point', () => {
    const lanes = resolveLanes(
      [
        { id: 'yuna', x: 600, halfWidth: 40 },
        { id: 'tidus', x: 600, halfWidth: 40 },
      ],
      10,
    );
    const a = 600 + lanes.get('yuna')!;
    const b = 600 + lanes.get('tidus')!;
    expect(Math.abs(a - b)).toBeGreaterThanOrEqual(90);
  });

  it('keeps the spread centred on the formation rather than pushing it one way', () => {
    const xs = [600, 606, 612];
    const lanes = resolveLanes(
      xs.map((x, i) => ({ id: `t${i}`, x, halfWidth: 30 })),
      10,
    );
    const moved = xs.map((x, i) => x + lanes.get(`t${i}`)!);
    const before = xs.reduce((s, x) => s + x, 0) / xs.length;
    const after = moved.reduce((s, x) => s + x, 0) / moved.length;
    expect(after).toBeCloseTo(before, 6);
    // and every pair now clears
    for (let i = 1; i < moved.length; i++) {
      expect(moved[i]! - moved[i - 1]!).toBeGreaterThanOrEqual(70);
    }
  });

  it('leaves targets that already clear each other untouched', () => {
    const lanes = resolveLanes(
      [
        { id: 'a', x: 200, halfWidth: 30 },
        { id: 'b', x: 900, halfWidth: 30 },
      ],
      10,
    );
    expect(lanes.get('a')).toBe(0);
    expect(lanes.get('b')).toBe(0);
  });

  it('is stable when two targets share an x', () => {
    const input = [
      { id: 'b', x: 400, halfWidth: 20 },
      { id: 'a', x: 400, halfWidth: 20 },
    ];
    const once = resolveLanes(input, 8);
    const again = resolveLanes([...input].reverse(), 8);
    expect(once.get('a')).toBe(again.get('a'));
    expect(once.get('b')).toBe(again.get('b'));
  });
});

describe('safeAreaFrom — the HUD-free rectangle', () => {
  // A 1600x900 frame with the FFX chrome measured off `50-yunalesca.png`.
  const bounds = { left: 0, top: 0, right: 1600, bottom: 900 };
  const ctbColumn = { left: 1390, top: 130, right: 1560, bottom: 500 };
  const partyWindows = { left: 1000, top: 610, right: 1560, bottom: 830 };

  it('insets the right edge for the CTB column', () => {
    const safe = safeAreaFrom(bounds, [ctbColumn]);
    expect(safe.right).toBeLessThanOrEqual(ctbColumn.left);
    expect(safe.left).toBe(0);
    expect(safe.bottom).toBe(900);
  });

  it('charges a corner slab to its cheaper edge instead of eating half the frame', () => {
    const safe = safeAreaFrom(bounds, [partyWindows]);
    expect(safe.bottom).toBeLessThanOrEqual(partyWindows.top);
    // Not the right edge: that would have cost 600px of field for a 290px panel.
    expect(safe.right).toBe(1600);
  });

  it('keeps numerals out of both bands at once', () => {
    const safe = safeAreaFrom(bounds, [ctbColumn, partyWindows]);
    expect(safe.right).toBeLessThanOrEqual(ctbColumn.left);
    expect(safe.bottom).toBeLessThanOrEqual(partyWindows.top);
  });

  it('ignores a panel floating in the middle of the field', () => {
    expect(safeAreaFrom(bounds, [{ left: 600, top: 300, right: 800, bottom: 500 }])).toEqual(bounds);
  });

  it('refuses a band wider than it is worth — the open command stack', () => {
    // ~23% of the width: dodging it costs less field than designing around it.
    const commandStack = { left: 60, top: 480, right: 360, bottom: 830 };
    expect(safeAreaFrom(bounds, [commandStack]).left).toBe(0);
  });

  it('ignores a panel that barely touches the edge it hugs', () => {
    const sliver = { left: 1500, top: 430, right: 1600, bottom: 470 };
    expect(safeAreaFrom(bounds, [sliver]).right).toBe(1600);
  });

  it('never returns a degenerate rectangle', () => {
    const everything = { left: 0, top: 0, right: 1600, bottom: 900 };
    const safe = safeAreaFrom(bounds, [everything]);
    expect(safe.right).toBeGreaterThan(safe.left);
    expect(safe.bottom).toBeGreaterThan(safe.top);
  });

  it('passes an unlaid-out bounds straight through', () => {
    const empty = { left: 0, top: 0, right: 0, bottom: 0 };
    expect(safeAreaFrom(empty, [ctbColumn])).toEqual(empty);
  });
});

describe('placeInSafeArea — mirror before clamping', () => {
  const safe = { left: 0, top: 0, right: 1000, bottom: 600 };
  const half = { w: 30, h: 12 };

  it('leaves a numeral that already fits exactly where it asked to be', () => {
    const at = placeInSafeArea({ x: 400, y: 300 }, { x: 46, y: -28 }, half, safe);
    expect(at).toEqual({ x: 446, y: 272, overHud: false });
  });

  it('reflects a fan column that would leave the safe rect instead of clamping it', () => {
    const anchor = { x: 960, y: 300 };
    const at = placeInSafeArea(anchor, { x: 46, y: 0 }, half, safe);
    // 1006 overshoots the 970 limit by 36 and folds back to 934.
    expect(at.x).toBe(934);
    expect(at.overHud).toBe(false);
  });

  it('keeps two reflected columns apart rather than collapsing them onto one edge', () => {
    const anchor = { x: 960, y: 300 };
    const right = placeInSafeArea(anchor, { x: 46, y: 0 }, half, safe);
    const further = placeInSafeArea(anchor, { x: 92, y: 0 }, half, safe);
    expect(Math.abs(right.x - further.x)).toBeGreaterThanOrEqual(46);
  });

  it('does not fold a column onto the mirror image of another column', () => {
    // The fan is symmetric, so mirroring about the target mapped column 3
    // exactly onto column 4 and printed 602 through 1400 on Seymour.
    const anchor = { x: 900, y: 300 };
    const plus = placeInSafeArea(anchor, { x: 92, y: 0 }, half, safe);
    const minus = placeInSafeArea(anchor, { x: -92, y: 0 }, half, safe);
    expect(plus.x).not.toBe(minus.x);
    expect(Math.abs(plus.x - minus.x)).toBeGreaterThanOrEqual(36);
  });

  it('clamps when the fold overshoots the far side too', () => {
    const tight = { left: 0, top: 0, right: 80, bottom: 600 };
    const at = placeInSafeArea({ x: 70, y: 300 }, { x: 46, y: 0 }, half, tight);
    expect(at.x).toBe(30);
    expect(at.overHud).toBe(false);
  });

  it('pulls a target standing just outside the rect back in without going over the HUD', () => {
    const at = placeInSafeArea({ x: 400, y: 640 }, { x: 0, y: 0 }, half, safe, 64);
    expect(at.overHud).toBe(false);
    expect(at.y).toBeLessThanOrEqual(safe.bottom - half.h);
  });

  it('gives up and goes over the HUD for a target buried under it', () => {
    const at = placeInSafeArea({ x: 1500, y: 300 }, { x: 0, y: 0 }, half, safe, 64);
    expect(at.overHud).toBe(true);
    expect(at.x).toBe(1500); // still on its actor, not dragged to an edge
  });

  it('moves a whole fan in rather than clamping each column onto one edge', () => {
    // Mortiorchis parked against the CTB column: every column of the fan used
    // to land on `safe.right - halfWidth`, which is the pile-up all over again.
    const anchor = { x: 1080, y: 300 };
    const group = { w: 160, h: 60 };
    const near = placeInSafeArea(anchor, { x: 10, y: 0 }, half, safe, 400, group);
    const far = placeInSafeArea(anchor, { x: 125, y: 0 }, half, safe, 400, group);
    expect(near.overHud).toBe(false);
    expect(far.overHud).toBe(false);
    expect(Math.abs(near.x - far.x)).toBeGreaterThanOrEqual(110);
    expect(near.x + half.w).toBeLessThanOrEqual(safe.right);
    expect(far.x + half.w).toBeLessThanOrEqual(safe.right);
  });

  it('leaves an in-field anchor exactly where its lane put it', () => {
    // The nudge above must not undo `resolveLanes` by pulling two neighbouring
    // actors back onto the same column.
    const group = { w: 300, h: 200 };
    const a = placeInSafeArea({ x: 400, y: 300 }, { x: 0, y: 0 }, half, safe, 200, group);
    const b = placeInSafeArea({ x: 520, y: 300 }, { x: 0, y: 0 }, half, safe, 200, group);
    expect(a.x).toBe(400);
    expect(b.x).toBe(520);
  });

  it('does nothing at all without a safe rect', () => {
    const at = placeInSafeArea({ x: 10, y: 10 }, { x: 5, y: -5 }, half, null);
    expect(at).toEqual({ x: 15, y: 5, overHud: false });
  });

  it('goes over the HUD when the safe rect is too small for the glyph', () => {
    const slot = { left: 0, top: 0, right: 20, bottom: 600 };
    expect(placeInSafeArea({ x: 10, y: 10 }, { x: 0, y: 0 }, half, slot).overHud).toBe(true);
  });
});
