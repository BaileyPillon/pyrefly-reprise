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

describe('a chip riding its numeral', () => {
  it('parents the chip to the newest figure on that target and drops its own placement', () => {
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

    const chip = document.createElement('div');
    chip.className = 'ffx2-chain-chip';
    chip.style.left = '900px';
    chip.style.top = '250px';
    chip.textContent = 'CHAIN ×1.75';
    h.root.appendChild(chip);

    expect(h.numbers.attachChip('bahamut', chip)).toBe(true);
    expect(chip.parentElement).toBe(newest);
    expect(chip.classList.contains('dnum__chip')).toBe(true);
    expect(chip.style.left).toBe('');
    expect(chip.style.top).toBe('');
  });

  it('re-clears a placement the HUD writes again on the next chain tick', () => {
    const h = harness({ points: { bahamut: { x: 700, y: 300 } } });
    cleanup = () => h.numbers.unmount();
    const numeral = h.numbers.spawnEvent({ type: 'damage', targetId: 'bahamut', amount: 742, hitIndex: 0, hitCount: 1 })!;
    const chip = document.createElement('div');
    h.root.appendChild(chip);
    h.numbers.attachChip('bahamut', chip);
    chip.style.left = '900px';
    h.numbers.attachChip('bahamut', chip);
    expect(chip.style.left).toBe('');
    expect(chip.parentElement).toBe(numeral);
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
