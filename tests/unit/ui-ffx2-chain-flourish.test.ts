// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CHAIN_POP_SCALE, ChainCounter, chainTier } from '../../src/ui/ffx2/ChainCounter.ts';
import { FLOURISH_MS, playSpherechangeFlourish } from '../../src/ui/ffx2/SpherechangeFlourish.ts';

/**
 * Resolved from the repo root, not from `import.meta.url`: under the jsdom
 * environment Vite serves the module over http, so `import.meta.url` is an
 * http URL and `readFileSync` rejects it.
 */
const HUD_CSS = join(process.cwd(), 'src', 'ui', 'ffx2', 'ffx2-hud.css');

/**
 * The two FFX-2 transients this round rebuilt: §4.6's chain counter and
 * §4.5.4's spherechange commit VFX.
 *
 * Both are FFX-2-only by construction — FFX emits neither a `chain` nor a
 * `spherechange` event — so there is deliberately no FFX counterpart here.
 */
describe('FFX-2 chain counter (visual-bible §4.6)', () => {
  let overlay: HTMLElement;
  let chain: ChainCounter;
  /** The board the chip has to stay off. Empty by default; one test fills it. */
  let obstacles: Array<{ left: number; top: number; right: number; bottom: number }> = [];

  beforeEach(() => {
    vi.useFakeTimers();
    obstacles = [];
    overlay = document.createElement('div');
    document.body.append(overlay);
    chain = new ChainCounter({
      overlay: () => overlay,
      scale: () => 2,
      point: () => ({ x: 400, y: 200 }),
      obstacles: () => obstacles,
      layer: () => ({ width: 1280, height: 720 }),
    });
  });

  afterEach(() => {
    chain.dispose();
    overlay.remove();
    vi.useRealTimers();
  });

  it('draws the count as the numeral and keeps the multiplier on the label', () => {
    chain.show('bahamut', 7, 1.75);
    const chip = overlay.querySelector('.ffx2-chain-chip')!;
    // §4.6: "big numeral + the word CHAIN beneath it". The numeral is the
    // chain's *length*; before this it printed the multiplier and no length.
    expect(chip.querySelector('.ffx2chain__n')?.textContent).toBe('7');
    expect(chip.querySelector('.ffx2chain__label')?.textContent).toContain('CHAIN');
    expect(chip.querySelector('.ffx2chain__label')?.textContent).toContain('×1.75');
    // §4.6: "a ring of 6 petal-motes bursts outward".
    expect(chip.querySelectorAll('.ffx2chain__motes i')).toHaveLength(6);
    expect(chip.classList.contains('ffx2chain--pop')).toBe(true);
  });

  it('escalates at 5, 10 and 20 and not before', () => {
    expect(chainTier(4)).toBe('');
    expect(chainTier(5)).toBe('ffx2chain--warm');
    expect(chainTier(9)).toBe('ffx2chain--warm');
    expect(chainTier(10)).toBe('ffx2chain--hot');
    chain.show('bahamut', 19, 2.35);
    expect(overlay.querySelector('.ffx2-chain-chip')!.classList.contains('ffx2chain--flash')).toBe(false);
    chain.show('bahamut', 20, 2.4);
    expect(overlay.querySelector('.ffx2-chain-chip')!.classList.contains('ffx2chain--flash')).toBe(true);
  });

  it('scales with the letterbox, and takes its §4.6 anchor when the spot is free', () => {
    chain.show('bahamut', 3, 1.55);
    const chip = overlay.querySelector<HTMLElement>('.ffx2-chain-chip')!;
    expect(chip.style.getPropertyValue('--ffx2-scale')).toBe('2');
    // Up and to the right of the enemy's head, by a scaled offset (§4.6).
    // jsdom gives every element a zero offsetWidth/Height, so the chip is a
    // degenerate box here and the anchor arithmetic is what is under test.
    expect(chip.style.left).toBe(`${400 + 12 * 2}px`);
    expect(chip.style.top).toBe(`${200 - 8 * 2}px`);
  });

  /**
   * jsdom lays nothing out, so the body would be a zero-size box and could
   * never overlap anything. `withBodySize` gives it the size it has on screen
   * at scale 2 — a 28 px numeral over a 10 px label — and the solver has a real
   * problem to solve.
   */
  function withBodySize<T>(w: number, h: number, run: () => T): T {
    const ow = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetWidth');
    const oh = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetHeight');
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', { configurable: true, get: () => w });
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', { configurable: true, get: () => h });
    try {
      return run();
    } finally {
      if (ow) Object.defineProperty(HTMLElement.prototype, 'offsetWidth', ow);
      if (oh) Object.defineProperty(HTMLElement.prototype, 'offsetHeight', oh);
    }
  }

  /** The chip's reserved box, read off the inline styles `show()` wrote. */
  function chipBox(): { left: number; top: number; right: number; bottom: number } {
    const chip = overlay.querySelector<HTMLElement>('.ffx2-chain-chip')!;
    const left = Number.parseFloat(chip.style.left);
    const top = Number.parseFloat(chip.style.top);
    return {
      left,
      top,
      right: left + Number.parseFloat(chip.style.width),
      bottom: top + Number.parseFloat(chip.style.height),
    };
  }

  it('steps off the boss and the panels rather than drawing over them', () => {
    withBodySize(120, 100, () => {
      // A wall across the whole band §4.6 wants the chip in.
      obstacles = [{ left: 300, top: 60, right: 620, bottom: 240 }];
      chain.show('bahamut', 9, 1.85);
      const box = chipBox();
      const hit = box.left < 620 && box.right > 300 && box.top < 240 && box.bottom > 60;
      expect(hit).toBe(false);
    });
  });

  /**
   * Critic pass 1, finding 1. `show()` used to measure the **layout** box and
   * place that, then add `.ffx2chain--pop`, which scales the painted chip to
   * 1.45 about its centre on every increment — so the solver never saw the box
   * the player sees. Live at the 50% keyframe: a 167x95 layout box painted
   * 242.4x137, sitting 9.3 px above the overlay and 33.8x102.8 px onto the
   * enemy-intent slab, at every tier and every viewport.
   *
   * The chip is now the reservation box for the peak, so these two assertions
   * are the same assertion — which is the point.
   */
  it('reserves the pop, so the painted box is the placed box', () => {
    withBodySize(120, 100, () => {
      chain.show('bahamut', 12, 2.1);
      const chip = overlay.querySelector<HTMLElement>('.ffx2-chain-chip')!;
      const body = chip.querySelector<HTMLElement>('.ffx2chain__body')!;
      expect(body).not.toBeNull();
      // The chip reserves 1.45x the body on both axes...
      expect(Number.parseFloat(chip.style.width)).toBe(Math.ceil(120 * CHAIN_POP_SCALE));
      expect(Number.parseFloat(chip.style.height)).toBe(Math.ceil(100 * CHAIN_POP_SCALE));
      // ...and the body, centred in it, cannot leave it when it scales to the
      // peak. Computed the way the critic measured it: the body's centre, its
      // size multiplied by the keyframe's scale.
      const box = chipBox();
      const cx = box.left + (box.right - box.left) / 2;
      const cy = box.top + (box.bottom - box.top) / 2;
      const painted = {
        left: cx - (120 * CHAIN_POP_SCALE) / 2,
        right: cx + (120 * CHAIN_POP_SCALE) / 2,
        top: cy - (100 * CHAIN_POP_SCALE) / 2,
        bottom: cy + (100 * CHAIN_POP_SCALE) / 2,
      };
      expect(painted.left).toBeGreaterThanOrEqual(box.left - 0.5);
      expect(painted.top).toBeGreaterThanOrEqual(box.top - 0.5);
      expect(painted.right).toBeLessThanOrEqual(box.right + 0.5);
      expect(painted.bottom).toBeLessThanOrEqual(box.bottom + 0.5);
    });
  });

  /**
   * The failure the critic actually photographed: the painted slab clipped off
   * the top of the overlay by `.ffx2hud`'s `overflow: hidden`, and dropped onto
   * the boss and the intent slab. Anchoring on a high head is what forces it —
   * §4.6's natural spot is off the top of the frame, so the clamp decides where
   * the chip goes, and the clamp only ever knew about the layout box.
   */
  it('keeps the whole painted chip inside the overlay and off the board, at every tier', () => {
    withBodySize(160, 92, () => {
      // Bahamut's head near the ceiling, the intent slab beside it, the boss
      // beneath — the chapter-4 board at 1280x720.
      obstacles = [
        { left: 560, top: 24, right: 860, bottom: 220 }, // enemy-intent slab
        { left: 470, top: 120, right: 760, bottom: 450 }, // the boss
      ];
      for (const count of [3, 7, 12, 22]) {
        chain.show('bahamut2' as never, count, 1 + count / 20);
        const box = chipBox();
        expect(box.top).toBeGreaterThanOrEqual(0);
        expect(box.left).toBeGreaterThanOrEqual(0);
        expect(box.right).toBeLessThanOrEqual(1280);
        expect(box.bottom).toBeLessThanOrEqual(720);
        for (const o of obstacles) {
          const hit = box.left < o.right && box.right > o.left && box.top < o.bottom && box.bottom > o.top;
          expect(hit, `tier ${count} covers ${JSON.stringify(o)}`).toBe(false);
        }
      }
    });
  });

  /**
   * The constant and the keyframe are two halves of one fact: if `@keyframes
   * ffx2-chain-pop` is ever retuned without updating `CHAIN_POP_SCALE`, the
   * reservation goes back to being wrong and nothing else would notice.
   */
  it('reserves exactly what the CSS keyframe scales to', () => {
    const css = readFileSync(HUD_CSS, 'utf8');
    const frames = /@keyframes ffx2-chain-pop\s*\{([\s\S]*?)\n\}/.exec(css);
    expect(frames, 'ffx2-chain-pop keyframes not found').not.toBeNull();
    const peak = [...frames![1]!.matchAll(/scale\(([\d.]+)\)/g)].map((m) => Number.parseFloat(m[1]!));
    expect(Math.max(...peak)).toBe(CHAIN_POP_SCALE);
    // And the pop must scale the *body*, never the chip: a transform on the
    // chip both breaks the reservation and turns it into the containing block
    // for `.ffx2chain--flash::after`'s `position: fixed` full-screen flash.
    expect(css).toContain('.ffx2-chain-chip.ffx2chain--pop .ffx2chain__body {');
    expect(css).not.toMatch(/\.ffx2-chain-chip\.ffx2chain--pop\s*\{/);
  });

  it('stops being a chain counter the instant the chain breaks, and decays for 0.4 s', () => {
    chain.show('bahamut', 6, 1.7);
    expect(overlay.querySelector('.ffx2-chain-chip')).not.toBeNull();
    chain.show('bahamut', 0, 1.4);
    // Nothing asking "is a chain showing?" should still be told yes.
    expect(overlay.querySelector('.ffx2-chain-chip')).toBeNull();
    // ...but §4.6's decay is still on screen for its 0.4 s.
    expect(overlay.querySelector('.ffx2chain-broke')).not.toBeNull();
    vi.advanceTimersByTime(400);
    expect(overlay.querySelector('.ffx2chain-broke')).toBeNull();
  });

  it('expires on its own after the hold with no further increment', () => {
    chain.show('bahamut', 2, 1.5);
    vi.advanceTimersByTime(1399);
    expect(overlay.querySelector('.ffx2-chain-chip')).not.toBeNull();
    vi.advanceTimersByTime(2);
    expect(overlay.querySelector('.ffx2-chain-chip')).toBeNull();
  });
});

describe('FFX-2 spherechange flourish (visual-bible §4.5.4)', () => {
  let overlay: HTMLElement;

  const deps = (): Parameters<typeof playSpherechangeFlourish>[0] => ({
    overlay,
    scale: () => 2,
    anchor: () => ({ head: { x: 300, y: 120 }, feet: { x: 300, y: 300 } }),
  });

  beforeEach(() => {
    vi.useFakeTimers();
    overlay = document.createElement('div');
    document.body.append(overlay);
  });

  afterEach(() => {
    overlay.remove();
    vi.useRealTimers();
  });

  it('plays the column, 8 motes, the ring and a named plate', async () => {
    const done = playSpherechangeFlourish(deps(), {
      who: 'yuna',
      name: 'Yuna',
      to: 'black-mage',
      gatesCrossed: [],
    });
    const fx = overlay.querySelector('.ffx2sf')!;
    expect(fx.querySelector('.ffx2sf__column')).not.toBeNull();
    // §4.5.4: "8 #F7B6D9 petal-motes orbit outward".
    expect(fx.querySelectorAll('.ffx2sf__mote')).toHaveLength(8);
    expect(fx.querySelector('.ffx2sf__ring')).not.toBeNull();
    // The outfit is named, never the raw `black-mage` id.
    expect(fx.querySelector('.ffx2sf__name')?.textContent).toBe('Black Mage');
    expect(fx.querySelector('.ffx2sf__who')?.textContent).toBe('Yuna');
    // No gate crossed, so no gate line to print.
    expect(fx.querySelector('.ffx2sf__gate')).toBeNull();

    vi.advanceTimersByTime(FLOURISH_MS);
    await done;
    // Playback is handed back while the plate is still finishing.
    expect(overlay.querySelector('.ffx2sf')?.classList.contains('ffx2sf--settled')).toBe(true);
    vi.advanceTimersByTime(1200);
    expect(overlay.querySelector('.ffx2sf')).toBeNull();
  });

  it('prints the gate it crossed — §4.5.4 calls it the most valuable line on the screen', async () => {
    const done = playSpherechangeFlourish(deps(), {
      who: 'rikku',
      name: 'Rikku',
      to: 'lady-luck',
      gatesCrossed: ['red', 'green'],
    });
    expect(overlay.querySelector('.ffx2sf__gate')?.textContent).toContain('Red + Green');
    vi.advanceTimersByTime(FLOURISH_MS);
    await done;
    vi.advanceTimersByTime(1200);
  });

  it('marks a Special Dress Up as one', async () => {
    const done = playSpherechangeFlourish(deps(), {
      who: 'yuna',
      name: 'Yuna',
      to: 'floral-fallal',
      gatesCrossed: [],
      special: 'floral-fallal',
    });
    expect(overlay.querySelector('.ffx2sf__special')?.textContent).toContain('SPECIAL DRESS UP');
    vi.advanceTimersByTime(FLOURISH_MS);
    await done;
    vi.advanceTimersByTime(1200);
  });

  it('draws nothing and resolves at once with no projected anchor', async () => {
    // A headless run, or a girl who is not on the field. A spherechange must
    // never be able to wedge the battle loop on a missing projector.
    await playSpherechangeFlourish({ overlay, scale: () => 1, anchor: () => null }, {
      who: 'paine',
      name: 'Paine',
      to: 'warrior',
      gatesCrossed: [],
    });
    expect(overlay.querySelector('.ffx2sf')).toBeNull();
  });
});
