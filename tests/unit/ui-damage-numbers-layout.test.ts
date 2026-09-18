// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DamageNumbers } from '../../src/ui/common/DamageNumbers.ts';
import type { NumeralRect } from '../../src/ui/common/damageLadder.ts';

/**
 * The layout half of `docs/handoff/playability-round-1.md` issues 2 and 3,
 * exercised through the real DOM class rather than the pure math: eight hits
 * from one Overdrive, an AoE across a formation, and the HUD-free safe area.
 *
 * `50-yunalesca.png` is the measuring stick — a 1600x900 frame with the CTB
 * column down the right and the party-status windows across the bottom right.
 */
const FRAME = { width: 1600, height: 900 };
const CTB_COLUMN: NumeralRect = { left: 1390, top: 130, right: 1560, bottom: 500 };
const PARTY_WINDOWS: NumeralRect = { left: 1000, top: 610, right: 1560, bottom: 830 };

/**
 * Give `el` a box, since jsdom lays nothing out and reports 0x0 for everything.
 * `DamageNumbers` reads a numeral's live box to place a chip on it.
 */
function boxAt(el: HTMLElement, left: number, top: number, width: number, height: number): void {
  el.getBoundingClientRect = (): DOMRect =>
    ({
      x: left,
      y: top,
      left,
      top,
      right: left + width,
      bottom: top + height,
      width,
      height,
      toJSON: () => ({}),
    }) as DOMRect;
}

/** The x/y of the positioning `translate(...)` in a numeral's transform. */
function readTranslate(el: HTMLElement): [number, number] {
  const all = [...el.style.transform.matchAll(/translate\((-?[\d.]+)px,\s*(-?[\d.]+)px\)/g)];
  const last = all[all.length - 1];
  return last ? [Number(last[1]), Number(last[2])] : [NaN, NaN];
}

interface Harness {
  numbers: DamageNumbers;
  root: HTMLElement;
  /** Advance the layer by `ms`, in 10ms frames. */
  run: (ms: number) => void;
  /** Every numeral currently drawing, with its position. */
  visible: () => { el: HTMLElement; x: number; y: number; text: string }[];
}

function harness(opts: {
  points: Record<string, { x: number; y: number }>;
  panels?: NumeralRect[];
}): Harness {
  const root = document.createElement('div');
  document.body.appendChild(root);
  const numbers = new DamageNumbers({
    root,
    project: (id) => opts.points[id] ?? null,
    scale: () => 1,
    avoid: () => opts.panels ?? [],
  });
  numbers.mount();
  // jsdom lays nothing out, so the layer would report a 0x0 box and the class
  // would (correctly) skip every bound. Give it the frame it would have.
  numbers.el.getBoundingClientRect = (): DOMRect =>
    ({
      x: 0,
      y: 0,
      left: 0,
      top: 0,
      right: FRAME.width,
      bottom: FRAME.height,
      width: FRAME.width,
      height: FRAME.height,
      toJSON: () => ({}),
    }) as DOMRect;

  return {
    numbers,
    root,
    run: (ms) => {
      for (let t = 0; t < ms; t += 10) numbers.update(0.01);
    },
    visible: () =>
      [...root.querySelectorAll<HTMLElement>('.dnum')]
        .filter((el) => Number(el.style.opacity) > 0)
        .map((el) => {
          const [x, y] = readTranslate(el);
          return { el, x, y, text: el.textContent ?? '' };
        }),
  };
}

let cleanup: (() => void) | null = null;

beforeEach(() => {
  // A numeral's ballistic drift is random by design; pin it so the assertions
  // below are about the layout and not about the weather.
  vi.spyOn(Math, 'random').mockReturnValue(0.5);
  // jsdom reports every element as 0 wide, which would make every glyph look
  // 16px across. Width by character is close enough to the real thing for the
  // separation assertions to mean something.
  Object.defineProperty(window.HTMLElement.prototype, 'offsetWidth', {
    configurable: true,
    get(this: HTMLElement) {
      return (this.textContent?.length ?? 0) * 9;
    },
  });
});

afterEach(() => {
  cleanup?.();
  cleanup = null;
  vi.restoreAllMocks();
  document.body.innerHTML = '';
});

describe('a multi-hit Overdrive on one target', () => {
  /** Eight hits in one engine tick — Attack Reels, or the Vegnagun pile-up. */
  function attackReels(h: Harness): void {
    for (let i = 0; i < 8; i++) {
      h.numbers.spawnEvent({
        type: 'damage',
        targetId: 'vegnagun',
        amount: 1200 + i,
        hitIndex: i,
        hitCount: 8,
      });
    }
  }

  it('releases the hits in succession rather than all at once', () => {
    const h = harness({ points: { vegnagun: { x: 800, y: 400 } } });
    cleanup = () => h.numbers.unmount();
    attackReels(h);
    expect(h.numbers.count).toBe(8);

    h.run(10);
    expect(h.visible()).toHaveLength(1);
    h.run(160);
    expect(h.visible()).toHaveLength(3);
    h.run(500);
    expect(h.visible()).toHaveLength(8);
  });

  it('never leaves two figures illegibly on top of each other', () => {
    const h = harness({ points: { vegnagun: { x: 800, y: 400 } } });
    cleanup = () => h.numbers.unmount();
    attackReels(h);

    // Sweep the whole action rather than trusting one instant: the arcs move,
    // and the failure in `53-ffx2-vegnagun.png` was a single frame.
    for (let elapsed = 0; elapsed < 900; elapsed += 20) {
      h.run(20);
      const shown = h.visible();
      for (let i = 0; i < shown.length; i++) {
        for (let j = i + 1; j < shown.length; j++) {
          const a = shown[i]!;
          const b = shown[j]!;
          const clear = Math.abs(a.x - b.x) >= 36 || Math.abs(a.y - b.y) >= 16;
          expect(
            clear,
            `${a.text} and ${b.text} overlap at ${elapsed}ms: (${a.x}, ${a.y}) vs (${b.x}, ${b.y})`,
          ).toBe(true);
        }
      }
    }
  });

  it('fans sideways once the ladder is full instead of wrapping onto a live rung', () => {
    const h = harness({ points: { vegnagun: { x: 800, y: 400 } } });
    cleanup = () => h.numbers.unmount();
    attackReels(h);
    h.run(700);
    const xs = h.visible().map((n) => n.x);
    // Three distinct columns for eight hits, not one.
    expect(Math.max(...xs) - Math.min(...xs)).toBeGreaterThan(80);
  });

  it('fans into the room it has when its actor stands against a margin', () => {
    // §5 of `docs/handoff/r2-damage-numbers-fan.md`: the fan used to open
    // symmetrically wherever the actor stood and let `placeInSafeArea` reflect
    // the columns that left the frame — and reflection folds an outer column
    // back onto an inner one, so an actor near the margin got bunching rather
    // than fanning. The fan is asymmetric before the fact now.
    // Sixteen hits — a full Trigger Happy — because that is what it takes to
    // reach the outermost column, and the outermost column is where the
    // reflection folded one back onto another: at 70px from the margin,
    // column -2 reflected to x=49 while column -1 sat at x=24, 25px apart where
    // a fan step is 46.
    const h = harness({ points: { rikku: { x: 70, y: 400 } } });
    cleanup = () => h.numbers.unmount();
    for (let i = 0; i < 16; i++) {
      h.numbers.spawnEvent({
        type: 'damage',
        targetId: 'rikku',
        amount: 300 + i,
        hitIndex: i,
        hitCount: 16,
      });
    }

    let deepest = 0;
    for (let elapsed = 0; elapsed < 1800; elapsed += 20) {
      h.run(20);
      const shown = h.visible();
      deepest = Math.max(deepest, new Set(shown.map((n) => Math.round(n.x))).size);
      for (const n of shown) {
        // Nothing walked off the frame to get its column.
        expect(n.x).toBeGreaterThanOrEqual(0);
        expect(n.x).toBeLessThanOrEqual(FRAME.width);
      }
      for (let i = 0; i < shown.length; i++) {
        for (let j = i + 1; j < shown.length; j++) {
          const a = shown[i]!;
          const b = shown[j]!;
          expect(
            Math.abs(a.x - b.x) >= 36 || Math.abs(a.y - b.y) >= 16,
            `${a.text} and ${b.text} bunched at the margin at ${elapsed}ms: (${a.x}, ${a.y}) vs (${b.x}, ${b.y})`,
          ).toBe(true);
        }
      }
    }
    // And it did fan — this is not passing because everything stayed in one column.
    expect(deepest).toBeGreaterThanOrEqual(3);
  });
});

describe('a heal landing on an actor who is being hit', () => {
  it('keeps the heal out of the damage figures for the whole flight', () => {
    // The last overlap left in §5 of the round-2 handoff. Both families share
    // one ladder height, but not one *motion*: damage is ballistic and falls
    // back through its rung while a heal floats straight up, so over ~600ms a
    // damage figure two rungs up meets a heal figure one rung up. They now sit
    // in columns taken from opposite ends of the fan.
    // One hit then a heal is the sharp case, and the one the old ladder got
    // wrong: the heal took the next slot on the *same* column, one rung above
    // the hit, and the two motions met inside that column.
    for (const hitCount of [1, 2, 3]) {
      const h = harness({ points: { yuna: { x: 700, y: 430 } } });
      cleanup = () => h.numbers.unmount();
      for (let i = 0; i < hitCount; i++) {
        h.numbers.spawnEvent({
          type: 'damage',
          targetId: 'yuna',
          amount: 900 + i,
          hitIndex: i,
          hitCount,
        });
      }
      h.numbers.spawnEvent({ type: 'heal', targetId: 'yuna', amount: 1500 });

      let sawBoth = false;
      for (let elapsed = 0; elapsed < 900; elapsed += 20) {
        h.run(20);
        const shown = h.visible();
        const heals = shown.filter((n) => n.el.classList.contains('dnum--heal'));
        const hits = shown.filter((n) => !n.el.classList.contains('dnum--heal'));
        if (heals.length > 0 && hits.length > 0) sawBoth = true;
        for (const heal of heals) {
          for (const hit of hits) {
            // 20px, not the 16 the multi-hit sweep uses: a numeral glyph is
            // ~16px tall at this scale, so two centres 17px apart are two
            // letterforms touching. Measured against the pre-fix ladder, one
            // hit then a heal closed to (dx 4, dy 17.2) at 120ms — which is
            // exactly the graze §5 describes, and is why the threshold matters.
            expect(
              Math.abs(heal.x - hit.x) >= 36 || Math.abs(heal.y - hit.y) >= 20,
              `heal ${heal.text} crossed ${hit.text} at ${elapsed}ms with ${hitCount} hit(s): (${heal.x}, ${heal.y}) vs (${hit.x}, ${hit.y})`,
            ).toBe(true);
          }
        }
      }
      expect(sawBoth, `the two families never shared the screen with ${hitCount} hit(s)`).toBe(true);
      h.numbers.unmount();
      cleanup = null;
    }
  });

  it('still floats a lone heal straight up the middle of its actor', () => {
    // The alt column is for a *second* family. A heal on an actor nothing else
    // is happening to belongs over the actor, not 92px to one side.
    const h = harness({ points: { yuna: { x: 700, y: 430 } } });
    cleanup = () => h.numbers.unmount();
    h.numbers.spawnEvent({ type: 'heal', targetId: 'yuna', amount: 1500 });
    h.run(120);
    const shown = h.visible();
    expect(shown).toHaveLength(1);
    expect(Math.abs(shown[0]!.x - 700)).toBeLessThan(12);
  });
});

describe('a boss AoE across the formation', () => {
  it('gives each target its own lane even when they project to the same place', () => {
    const h = harness({
      points: {
        tidus: { x: 600, y: 500 },
        yuna: { x: 606, y: 500 },
        auron: { x: 612, y: 500 },
      },
    });
    cleanup = () => h.numbers.unmount();
    for (const id of ['tidus', 'yuna', 'auron']) {
      h.numbers.spawnEvent({ type: 'damage', targetId: id, amount: 1850, hitIndex: 0, hitCount: 1 });
    }
    h.run(120);

    const xs = h
      .visible()
      .map((n) => n.x)
      .sort((a, b) => a - b);
    expect(xs).toHaveLength(3);
    // `50-yunalesca.png` had 2200 sitting under 1850 six pixels away.
    expect(xs[1]! - xs[0]!).toBeGreaterThanOrEqual(36);
    expect(xs[2]! - xs[1]!).toBeGreaterThanOrEqual(36);
  });

  it('keeps the spread centred on the formation', () => {
    const h = harness({
      points: { a: { x: 600, y: 500 }, b: { x: 606, y: 500 }, c: { x: 612, y: 500 } },
    });
    cleanup = () => h.numbers.unmount();
    for (const id of ['a', 'b', 'c']) {
      h.numbers.spawnEvent({ type: 'damage', targetId: id, amount: 900, hitIndex: 0, hitCount: 1 });
    }
    h.run(60);
    const xs = h.visible().map((n) => n.x);
    const centre = xs.reduce((s, x) => s + x, 0) / xs.length;
    expect(centre).toBeGreaterThan(580);
    expect(centre).toBeLessThan(632);
  });
});

describe('the HUD-free safe area', () => {
  it('keeps a numeral out of the CTB column and the party windows', () => {
    const h = harness({
      points: { auron: { x: 1300, y: 650 } },
      panels: [CTB_COLUMN, PARTY_WINDOWS],
    });
    cleanup = () => h.numbers.unmount();
    h.numbers.spawnEvent({ type: 'damage', targetId: 'auron', amount: 604, hitIndex: 0, hitCount: 1 });
    h.run(200);
    const [shown] = h.visible();
    expect(shown).toBeDefined();
    expect(shown!.x).toBeLessThan(CTB_COLUMN.left);
    expect(shown!.y).toBeLessThan(PARTY_WINDOWS.top);
    expect(shown!.el.classList.contains('dnum--over-hud')).toBe(false);
  });

  it('lifts a numeral over the HUD only when its target is buried under it', () => {
    const h = harness({
      points: { buried: { x: 1500, y: 300 }, clear: { x: 700, y: 400 } },
      panels: [CTB_COLUMN, PARTY_WINDOWS],
    });
    cleanup = () => h.numbers.unmount();
    h.numbers.spawnEvent({ type: 'damage', targetId: 'buried', amount: 571, hitIndex: 0, hitCount: 1 });
    h.numbers.spawnEvent({ type: 'damage', targetId: 'clear', amount: 578, hitIndex: 0, hitCount: 1 });
    h.run(120);

    const buried = h.visible().find((n) => n.text === '571')!;
    const clear = h.visible().find((n) => n.text === '578')!;
    expect(buried.el.classList.contains('dnum--over-hud')).toBe(true);
    // Still on its actor rather than dragged to the edge of the safe rect.
    expect(Math.abs(buried.x - 1500)).toBeLessThan(40);
    expect(clear.el.classList.contains('dnum--over-hud')).toBe(false);
  });

  it('holds a whole multi-hit inside the safe rect', () => {
    const h = harness({
      points: { shuyin: { x: 1340, y: 560 } },
      panels: [CTB_COLUMN, PARTY_WINDOWS],
    });
    cleanup = () => h.numbers.unmount();
    for (let i = 0; i < 6; i++) {
      h.numbers.spawnEvent({ type: 'damage', targetId: 'shuyin', amount: 400 + i, hitIndex: i, hitCount: 6 });
    }
    for (let elapsed = 0; elapsed < 900; elapsed += 20) {
      h.run(20);
      for (const n of h.visible()) {
        expect(n.el.classList.contains('dnum--over-hud')).toBe(false);
        expect(n.x).toBeLessThanOrEqual(CTB_COLUMN.left);
        expect(n.y).toBeLessThanOrEqual(PARTY_WINDOWS.top);
        expect(n.x).toBeGreaterThanOrEqual(0);
        expect(n.y).toBeGreaterThanOrEqual(0);
      }
    }
  });
});

describe('a chip following its numeral', () => {
  it('pairs the chip with the newest figure on that target and repositions it', () => {
    const h = harness({ points: { bahamut: { x: 700, y: 300 } } });
    cleanup = () => h.numbers.unmount();
    h.numbers.spawnEvent({ type: 'damage', targetId: 'bahamut', amount: 742, hitIndex: 0, hitCount: 1 });
    const newest = h.numbers.spawnEvent({
      type: 'damage',
      targetId: 'bahamut',
      amount: 311,
      hitIndex: 1,
      hitCount: 2,
    })!;

    boxAt(newest, 640, 260, 96, 40);

    const chip = document.createElement('div');
    chip.className = 'ffx2-chain-chip';
    chip.style.left = '900px';
    chip.style.top = '250px';
    chip.textContent = 'CHAIN ×1.75';
    h.root.appendChild(chip);

    expect(h.numbers.attachChip('bahamut', chip)).toBe(true);
    expect(chip.classList.contains('dnum__chip')).toBe(true);
    // Moved onto the newest figure's bottom-right corner, off its own
    // coordinates. Bottom, not top: see the ladder-collision test below.
    expect(parseFloat(chip.style.left)).toBeCloseTo(736);
    expect(parseFloat(chip.style.top)).toBeCloseTo(300);
  });

  it('never parents the chip into the numeral', () => {
    // The chip used to be appended to the `.dnum` and drew **nothing**, while
    // every DOM assertion about it passed: `.dnum` paints its figure with
    // `-webkit-background-clip: text`, and that clips the element's whole
    // subtree to the glyph's shape, so a chip pinned past the numeral's edge
    // was clipped away entirely. No reset on the child can undo a clip the
    // parent applies — the chip has to stay outside and be moved.
    const h = harness({ points: { bahamut: { x: 700, y: 300 } } });
    cleanup = () => h.numbers.unmount();
    const numeral = h.numbers.spawnEvent({ type: 'damage', targetId: 'bahamut', amount: 742, hitIndex: 0, hitCount: 1 })!;
    boxAt(numeral, 640, 260, 96, 40);

    const chip = document.createElement('div');
    chip.textContent = 'CHAIN ×1.75';
    h.root.appendChild(chip);
    h.numbers.attachChip('bahamut', chip);

    expect(chip.parentElement).toBe(h.root);
    expect(chip.closest('.dnum')).toBeNull();
    expect(numeral.contains(chip)).toBe(false);
  });

  it('keeps following as the figure moves, then lets go when it dies', () => {
    const h = harness({ points: { bahamut: { x: 700, y: 300 } } });
    cleanup = () => h.numbers.unmount();
    const numeral = h.numbers.spawnEvent({ type: 'damage', targetId: 'bahamut', amount: 742, hitIndex: 0, hitCount: 1 })!;
    boxAt(numeral, 640, 260, 96, 40);
    const chip = document.createElement('div');
    h.root.appendChild(chip);
    h.numbers.attachChip('bahamut', chip);
    expect(parseFloat(chip.style.left)).toBeCloseTo(736);

    // The HUD re-pins the same chip on every chain tick; the next frame has to
    // take it back, or it snaps to the enemy's shoulder and stays there.
    chip.style.left = '900px';
    boxAt(numeral, 640, 180, 96, 40);
    h.run(10);
    expect(parseFloat(chip.style.left)).toBeCloseTo(736);
    expect(parseFloat(chip.style.top)).toBeCloseTo(220);

    // Once the figure has faded the pairing is dropped and the chip is left
    // exactly where it was, for the HUD's own hide timer to remove.
    h.run(1200);
    expect(numeral.isConnected).toBe(false);
    const parked = chip.style.left;
    boxAt(numeral, 640, 20, 96, 40);
    h.run(10);
    expect(chip.style.left).toBe(parked);
  });

  it('lands on no rung of the burst it is riding', () => {
    // `r2-ffx2-chain-chip.png` as first captured: the chip was aimed at the
    // ridden figure's *top*-right corner, and a multi-hit ladder climbs up and
    // drifts right — so `CHAIN x1.30` landed half behind the `674` a rung above
    // the `600` it was riding.
    //
    // Aiming at the bottom-right corner instead is not the fix either, and this
    // test is what showed it: `attachChip` rides the newest **visible** figure,
    // which during a stagger is frequently a rung with older, *lower* rungs
    // still live underneath it. The chip takes its y from the bottom of the
    // whole burst for that reason.
    const h = harness({ points: { bahamut: { x: 700, y: 300 } } });
    cleanup = () => h.numbers.unmount();
    const lower = h.numbers.spawnEvent({ type: 'damage', targetId: 'bahamut', amount: 600, hitIndex: 0, hitCount: 2 })!;
    const upper = h.numbers.spawnEvent({ type: 'damage', targetId: 'bahamut', amount: 674, hitIndex: 1, hitCount: 2 })!;
    // One rung up and slightly right, which is what `burstSlot` produces.
    const lowerBox = { left: 640, top: 260, right: 736, bottom: 300 };
    const upperBox = { left: 644, top: 214, right: 740, bottom: 254 };
    boxAt(lower, 640, 260, 96, 40);
    boxAt(upper, 644, 214, 96, 40);

    const chip = document.createElement('div');
    chip.className = 'ffx2-chain-chip';
    h.root.appendChild(chip);
    // A laid-out chip, so the half-box offset is exercised rather than skipped.
    boxAt(chip, 0, 0, 120, 34);

    expect(h.numbers.attachChip('bahamut', chip)).toBe(true);

    // The chip centres on its `left`/`top` via `translate(-50%, -50%)`, so
    // reconstruct the box it will actually paint rather than trusting the
    // anchor point alone, and check it against *every* live rung.
    const cx = parseFloat(chip.style.left);
    const cy = parseFloat(chip.style.top);
    const painted = { left: cx - 60, right: cx + 60, top: cy - 17, bottom: cy + 17 };
    for (const rung of [lowerBox, upperBox]) {
      const overlapX = Math.min(painted.right, rung.right) - Math.max(painted.left, rung.left);
      const overlapY = Math.min(painted.bottom, rung.bottom) - Math.max(painted.top, rung.top);
      expect(Math.min(overlapX, overlapY)).toBeLessThanOrEqual(0);
    }
    // Under the burst, not above it or inside it.
    expect(painted.top).toBeGreaterThanOrEqual(lowerBox.bottom);
    // And still adjacent to the figure it rides, not flung away from it.
    expect(painted.left).toBeLessThan(upperBox.right + 60);
  });

  it('keeps the chip off the HUD, not just off the numerals', () => {
    // The previous fix traded one collision for another: pushing the chip clear
    // of the burst moved it right and down, and the recapture put `CHAIN x1.30`
    // straight across the FFX-2 command stack's `WHITE MAGIC` row. A chip is a
    // numeral-sized thing on the field and dodges the same chrome.
    const COMMAND_STACK: NumeralRect = { left: 1180, top: 330, right: 1540, bottom: 620 };
    const h = harness({ points: { bahamut: { x: 700, y: 300 } }, panels: [COMMAND_STACK] });
    cleanup = () => h.numbers.unmount();
    const numeral = h.numbers.spawnEvent({ type: 'damage', targetId: 'bahamut', amount: 711, hitIndex: 0, hitCount: 1 })!;
    // A figure sitting just left of the stack, so the chip's own width would
    // otherwise carry it over the chrome.
    boxAt(numeral, 1000, 300, 96, 40);

    const chip = document.createElement('div');
    chip.className = 'ffx2-chain-chip';
    h.root.appendChild(chip);
    boxAt(chip, 0, 0, 240, 80);

    // One frame first, so the layer has measured the panel rects it avoids.
    h.run(16);
    expect(h.numbers.attachChip('bahamut', chip)).toBe(true);

    const cx = parseFloat(chip.style.left);
    const cy = parseFloat(chip.style.top);
    const painted = { left: cx - 120, right: cx + 120, top: cy - 40, bottom: cy + 40 };
    const overlapX = Math.min(painted.right, COMMAND_STACK.right) - Math.max(painted.left, COMMAND_STACK.left);
    const overlapY = Math.min(painted.bottom, COMMAND_STACK.bottom) - Math.max(painted.top, COMMAND_STACK.top);
    expect(Math.min(overlapX, overlapY)).toBeLessThanOrEqual(0);
  });

  it('leaves the chip alone when the target has no figure in flight', () => {
    const h = harness({ points: { bahamut: { x: 700, y: 300 } } });
    cleanup = () => h.numbers.unmount();
    const chip = document.createElement('div');
    chip.style.left = '900px';
    h.root.appendChild(chip);
    expect(h.numbers.attachChip('bahamut', chip)).toBe(false);
    expect(chip.parentElement).toBe(h.root);
    expect(chip.style.left).toBe('900px');
  });
});

describe('queue bookkeeping', () => {
  it('restarts the ladder for a new action after the target has been quiet', () => {
    const h = harness({ points: { sinspawn: { x: 800, y: 400 } } });
    cleanup = () => h.numbers.unmount();
    h.numbers.spawnEvent({ type: 'damage', targetId: 'sinspawn', amount: 100, hitIndex: 0, hitCount: 1 });
    h.run(1200);
    expect(h.numbers.count).toBe(0);

    h.numbers.spawnEvent({ type: 'damage', targetId: 'sinspawn', amount: 200, hitIndex: 0, hitCount: 1 });
    h.run(10);
    // Back on rung 0, level with the chest, not four rungs up in dead air.
    const [shown] = h.visible();
    expect(shown).toBeDefined();
    expect(Math.abs(shown!.y - 400)).toBeLessThan(20);
  });

  it('clear() forgets the queues as well as the figures', () => {
    const h = harness({ points: { sinspawn: { x: 800, y: 400 } } });
    cleanup = () => h.numbers.unmount();
    for (let i = 0; i < 4; i++) {
      h.numbers.spawnEvent({ type: 'damage', targetId: 'sinspawn', amount: 10, hitIndex: i, hitCount: 4 });
    }
    h.numbers.clear();
    expect(h.numbers.count).toBe(0);

    h.numbers.spawnEvent({ type: 'damage', targetId: 'sinspawn', amount: 20, hitIndex: 0, hitCount: 1 });
    h.run(10);
    expect(h.visible()).toHaveLength(1);
  });
});

/**
 * The strategy guide's left rail (`src/ui/common/StrategyGuide.ts`) landed in
 * this round, after the numeral layer did, and neither adapter listed it — so a
 * party member standing on the left printed her damage straight across the
 * guide's text. `docs/screenshots/r2/r2-overdrive-multihit.png` as first
 * recaptured is the frame: Yuna's `761` on the RULES row.
 *
 * These drive the **adapters'** real panel queries rather than the shared
 * class's injected `avoid`, because the defect was in the selector lists and
 * nowhere else. jsdom reports `offsetParent` as null for everything, which the
 * queries read as "hidden", so it is stubbed truthy for the duration.
 */
describe('the strategy guide rail', () => {
  /** Where the guide's panel sits in a 1600x900 frame, ~24% of the width. */
  const GUIDE_PANEL = { left: 53, top: 180, right: 383, bottom: 760 };

  function stubLayout(el: HTMLElement, box: { left: number; top: number; right: number; bottom: number }): void {
    boxAt(el, box.left, box.top, box.right - box.left, box.bottom - box.top);
  }

  /** jsdom has no layout, so nothing has an `offsetParent`; the queries skip it all. */
  function showEverything(): () => void {
    const desc = Object.getOwnPropertyDescriptor(window.HTMLElement.prototype, 'offsetParent');
    Object.defineProperty(window.HTMLElement.prototype, 'offsetParent', {
      configurable: true,
      get() {
        return document.body;
      },
    });
    return () => {
      if (desc) Object.defineProperty(window.HTMLElement.prototype, 'offsetParent', desc);
      else delete (window.HTMLElement.prototype as unknown as Record<string, unknown>).offsetParent;
    };
  }

  /** A HUD host with the guide's rail inside it, laid out like the real thing. */
  function hudWithGuide(hostClass: string): { host: HTMLElement; overlay: HTMLElement } {
    const host = document.createElement('div');
    host.className = hostClass;
    stubLayout(host, { left: 0, top: 0, right: FRAME.width, bottom: FRAME.height });

    const stage = document.createElement('div');
    host.appendChild(stage);

    // The wrapper covers the whole stage and catches nothing; only its two
    // solid children are chrome. Listing `.sgd` would blank the field.
    const rail = document.createElement('div');
    rail.className = 'sgd';
    stubLayout(rail, { left: 0, top: 0, right: FRAME.width, bottom: FRAME.height });
    const panel = document.createElement('div');
    panel.className = 'sgd__panel';
    stubLayout(panel, GUIDE_PANEL);
    rail.appendChild(panel);
    stage.appendChild(rail);

    const overlay = document.createElement('div');
    host.appendChild(overlay);
    document.body.appendChild(host);
    return { host, overlay };
  }

  function layerBox(el: HTMLElement): void {
    el.getBoundingClientRect = (): DOMRect =>
      ({
        x: 0, y: 0, left: 0, top: 0,
        right: FRAME.width, bottom: FRAME.height,
        width: FRAME.width, height: FRAME.height,
        toJSON: () => ({}),
      }) as DOMRect;
  }

  it('is dodged by an FFX numeral landing on a party member standing under it', async () => {
    const restore = showEverything();
    const { DamageNumbers: FFXDamageNumbers } = await import('../../src/ui/ffx/DamageNumbers.ts');
    const { overlay } = hudWithGuide('ffxhud');
    const numbers = new FFXDamageNumbers();
    overlay.appendChild(numbers.el);
    layerBox(numbers.el);
    // Yuna's chest, well inside the rail.
    numbers.setProjector(() => ({ x: 200, y: 460 }));
    cleanup = () => {
      numbers.clear();
      restore();
    };

    numbers.spawn({ seq: 0, type: 'damage', targetId: 'yuna', amount: 761, element: 'none', crit: false, hitIndex: 0, hitCount: 1 } as never);
    for (let i = 0; i < 6; i++) numbers.update(0.016);

    const el = numbers.el.querySelector<HTMLElement>('.dnum');
    expect(el?.textContent).toBe('761');
    const [x, y] = readTranslate(el!);
    const half = { w: (el!.offsetWidth || 27) / 2, h: 12 };
    const clear =
      x + half.w <= GUIDE_PANEL.left ||
      x - half.w >= GUIDE_PANEL.right ||
      y + half.h <= GUIDE_PANEL.top ||
      y - half.h >= GUIDE_PANEL.bottom;
    expect(clear, `761 at (${x}, ${y}) is inside the guide panel`).toBe(true);
  });

  it('does not let the rail wrapper blank the whole field', async () => {
    const restore = showEverything();
    const { DamageNumbers: FFXDamageNumbers } = await import('../../src/ui/ffx/DamageNumbers.ts');
    const { host, overlay } = hudWithGuide('ffxhud');
    // Drop the solid child; only the full-stage `.sgd` wrapper is left.
    host.querySelector('.sgd__panel')!.remove();
    const numbers = new FFXDamageNumbers();
    overlay.appendChild(numbers.el);
    layerBox(numbers.el);
    numbers.setProjector(() => ({ x: 200, y: 460 }));
    cleanup = () => {
      numbers.clear();
      restore();
    };

    numbers.spawn({ seq: 0, type: 'damage', targetId: 'yuna', amount: 761, element: 'none', crit: false, hitIndex: 0, hitCount: 1 } as never);
    for (let i = 0; i < 6; i++) numbers.update(0.016);

    const [x, y] = readTranslate(numbers.el.querySelector<HTMLElement>('.dnum')!);
    // Still on its actor: a wrapper that catches no clicks is not chrome.
    expect(Math.abs(x - 200)).toBeLessThan(40);
    expect(Math.abs(y - 460)).toBeLessThan(40);
  });

  it('is dodged by an FFX-2 numeral too', async () => {
    const restore = showEverything();
    const { DamageLayer } = await import('../../src/ui/ffx2/DamageLayer.ts');
    const { host, overlay } = hudWithGuide('ffx2hud');
    const layer = new DamageLayer();
    layer.mount(overlay, { host, scale: () => 1 });
    const mounted = overlay.querySelector<HTMLElement>('.ffx2-numerals-layer')!;
    layerBox(mounted);
    layer.setProjector(() => ({ x: 200, y: 460 }));
    cleanup = () => {
      layer.unmount();
      restore();
    };

    layer.onEvent({ seq: 0, type: 'damage', targetId: 'rikku', amount: 761, element: 'none', crit: false, hitIndex: 0, hitCount: 1 } as never);
    for (let i = 0; i < 6; i++) layer.update(0.016);

    const el = mounted.querySelector<HTMLElement>('.dnum')!;
    const [x, y] = readTranslate(el);
    const half = { w: (el.offsetWidth || 27) / 2, h: 12 };
    const clear =
      x + half.w <= GUIDE_PANEL.left ||
      x - half.w >= GUIDE_PANEL.right ||
      y + half.h <= GUIDE_PANEL.top ||
      y - half.h >= GUIDE_PANEL.bottom;
    expect(clear, `761 at (${x}, ${y}) is inside the guide panel`).toBe(true);
  });
});
