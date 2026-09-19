// @vitest-environment jsdom
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CHAIN_POP_SCALE, CHAIN_HOLD_MS, ChainCounter, chainTier, popPeakRect } from '../../src/ui/ffx2/ChainCounter.ts';
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

  /** The pop's painted rect, from the chip's box and the origin `show()` wrote. */
  function peakBox(): { left: number; top: number; right: number; bottom: number } {
    const chip = overlay.querySelector<HTMLElement>('.ffx2-chain-chip')!;
    const box = chipBox();
    const ox = Number.parseFloat(chip.style.getPropertyValue('--ffx2-ox')) / 100;
    const oy = Number.parseFloat(chip.style.getPropertyValue('--ffx2-oy')) / 100;
    return popPeakRect({ left: box.left, top: box.top, w: box.right - box.left, h: box.bottom - box.top }, { x: ox, y: oy });
  }

  /**
   * Critic pass 1, finding 1: `show()` placed the **layout** box and then
   * `.ffx2chain--pop` scaled the painted chip to 1.45 about its centre, so the
   * painted slab sat 9.3 px above the overlay — clipped away by `.ffx2hud`'s
   * `overflow: hidden` — at every tier and every viewport.
   *
   * That half of the pass-1 fix is still enforced here, but it is no longer
   * enforced by *reserving* the peak. The reservation was what cost the counter
   * its §4.6 anchor (see the anchor test below and `CHAIN_POP_SCALE`'s note),
   * because a peak-sized box centred on the slab hangs below the head it
   * anchors to and the solver evicts it. The chip is the slab again, and the
   * peak is steered by `transform-origin` instead — so the assertion that used
   * to read "the painted box is the placed box" now reads "the painted box is
   * still on screen", which is the property the critic actually photographed.
   *
   * At 1280x720 the peak is 137 px tall against 107 px of headroom above
   * Bahamut's head, so it cannot be both inside the overlay and clear of
   * everything; it is the overlay that is non-negotiable.
   */
  it('never lets the pop paint outside the overlay, at every tier', () => {
    withBodySize(160, 92, () => {
      obstacles = [
        { left: 560, top: 24, right: 860, bottom: 220 }, // enemy-intent slab
        { left: 470, top: 120, right: 760, bottom: 450 }, // the boss
      ];
      for (const count of [3, 7, 12, 22]) {
        chain.show('bahamut', count, 1 + count / 20);
        // The chip is the slab's own box, not an inflated reservation.
        const chip = overlay.querySelector<HTMLElement>('.ffx2-chain-chip')!;
        expect(Number.parseFloat(chip.style.width)).toBe(160);
        expect(Number.parseFloat(chip.style.height)).toBe(92);
        const peak = peakBox();
        expect(peak.left, `tier ${count}`).toBeGreaterThanOrEqual(-0.5);
        expect(peak.top, `tier ${count}`).toBeGreaterThanOrEqual(-0.5);
        expect(peak.right, `tier ${count}`).toBeLessThanOrEqual(1280.5);
        expect(peak.bottom, `tier ${count}`).toBeLessThanOrEqual(720.5);
      }
    });
  });

  /**
   * Critic pass 2, finding 1 — the regression this pass exists for.
   *
   * §4.6: the popup is "anchored top-right of the enemy being chained; follows
   * that enemy's screen position". Reserving the 1.45x peak permanently put the
   * reserved box's bottom below the head it anchors to, which made the chained
   * enemy an obstacle to the chip's own anchor; `placeSlab` only searches
   * downward, so it evicted the counter across the stage. Measured live by the
   * critic, in 32 of 32 cells: at 1280x720 chapter 4 the chip landed 116.8 px
   * *below* Bahamut's head and 333 px to its left (it had been 16.5 px above
   * the head with its centre within 2 px of it); chapter 5, 112.1 px below and
   * 336 px away; at 2560x1440, 229 px below and 661 px away.
   *
   * The assertion is the one the critic's `anchorCheck` block makes: above the
   * head line, and horizontally still on the enemy.
   *
   * The two chapter boards, rebuilt from the numbers in the critic's own
   * `anchor.json` and `chain.json` at 1280x720 so that the solver is handed
   * the problem it was actually handed live:
   *
   * - `head` and `enemy` are the measured head point and the painted boss box
   *   (the boss's left edge is the one the evicted chip parked against:
   *   376.7 + 243 + 4 = 623.7 in chapter 4, 315.3 + 247 = 562.3 in chapter 5);
   * - `intent` is the enemy-intent slab exactly as `chain.json` recorded it;
   * - `gauges` is the top strip whose bottom edge (97.5) is what the evicted
   *   chip's top (101.5 = 97.5 + the solver's 4 px dodge gap) was measured
   *   against, with a right edge that leaves the §4.6 spot free — which is why
   *   the pre-regression build could take it.
   *
   * Replaying the pass-2 geometry on these boards reproduces the critic's
   * placements to the pixel (376.7, 101.5 and 315.3, 101.5), and replaying this
   * build's reproduces the pre-regression ones (627.7, 12.2 and 574.1, 16.5).
   * The 1600x900 row of each chapter is the same board scaled by 1.25, which is
   * what the critic measured there (708.8 x 1.25 = 886 against a measured
   * 887.3; intent 798.8 x 1.25 = 998.5 against 998.9).
   */
  interface Rect {
    left: number;
    top: number;
    right: number;
    bottom: number;
  }
  interface Board {
    layer: { width: number; height: number };
    scale: number;
    head: { x: number; y: number };
    enemy: Rect;
    body: { w: number; h: number };
    obstacles: Rect[];
  }

  function scaleBoard(b: Board, k: number): Board {
    const r = (x: number): number => Math.round(x * k * 10) / 10;
    const rect = (o: Rect): Rect => ({ left: r(o.left), top: r(o.top), right: r(o.right), bottom: r(o.bottom) });
    return {
      layer: { width: Math.round(b.layer.width * k), height: Math.round(b.layer.height * k) },
      scale: b.scale * k,
      head: { x: r(b.head.x), y: r(b.head.y) },
      enemy: rect(b.enemy),
      body: { w: Math.round(b.body.w * k), h: Math.round(b.body.h * k) },
      obstacles: b.obstacles.map(rect),
    };
  }

  const CH4: Board = {
    layer: { width: 1280, height: 720 },
    scale: 2,
    head: { x: 708.8, y: 123.2 },
    enemy: { left: 623.7, top: 110, right: 795.5, bottom: 429.7 },
    body: { w: 167, h: 95 },
    obstacles: [
      { left: 24, top: 16, right: 620, bottom: 97.5 }, // gauge / name strip
      { left: 623.7, top: 110, right: 795.5, bottom: 429.7 }, // Bahamut
      { left: 798.8, top: 25, right: 1098.8, bottom: 210.2 }, // enemy-intent slab
      { left: 950, top: 430, right: 1268, bottom: 704 }, // command stack
    ],
  };
  const CH5: Board = {
    layer: { width: 1280, height: 720 },
    scale: 2,
    head: { x: 651.6, y: 127.5 },
    enemy: { left: 562.3, top: 114, right: 741.3, bottom: 447.2 },
    body: { w: 167, h: 95 },
    obstacles: [
      { left: 24, top: 16, right: 560, bottom: 97.5 },
      { left: 562.3, top: 114, right: 741.3, bottom: 447.2 }, // Vegnagun's tail
      { left: 745.8, top: 25, right: 1045.8, bottom: 207.5 },
      { left: 950, top: 430, right: 1268, bottom: 704 },
    ],
  };

  const BOARDS = [
    { name: 'chapter 4 (Bahamut) at 1280x720', ...CH4 },
    { name: 'chapter 4 (Bahamut) at 1600x900', ...scaleBoard(CH4, 1.25) },
    { name: 'chapter 5 (Vegnagun) at 1280x720', ...CH5 },
    { name: 'chapter 5 (Vegnagun) at 1600x900', ...scaleBoard(CH5, 1.25) },
  ];

  it.each(BOARDS)('sits by the enemy it counts — $name', (board) => {
    const counter = new ChainCounter({
      overlay: () => overlay,
      scale: () => board.scale,
      point: () => board.head,
      obstacles: () => board.obstacles,
      layer: () => board.layer,
    });
    try {
      withBodySize(board.body.w, board.body.h, () => {
        for (const count of [3, 7, 12, 22]) {
          counter.show('bahamut', count, 1 + count / 20);
          const box = chipBox();
          // Inside the viewport — the pass-1 fix, which has to survive this one.
          expect(box.top, `tier ${count}`).toBeGreaterThanOrEqual(0);
          expect(box.left, `tier ${count}`).toBeGreaterThanOrEqual(0);
          expect(box.right, `tier ${count}`).toBeLessThanOrEqual(board.layer.width);
          expect(box.bottom, `tier ${count}`).toBeLessThanOrEqual(board.layer.height);
          // ...and by its enemy: clear above the head line, and still over the
          // enemy's own column rather than off across the stage. The pass-2
          // build fails the first of these in every cell — it put the chip
          // 112..229 px *below* the head — and the second at 1280x720, where
          // the chip ended 333 px to the left of a boss it was still counting.
          expect(box.bottom, `tier ${count} hangs below the head line`).toBeLessThanOrEqual(board.head.y + 1);
          expect(box.right, `tier ${count} is off to the left of the enemy`).toBeGreaterThanOrEqual(board.enemy.left);
          expect(box.left, `tier ${count} is off to the right of the enemy`).toBeLessThanOrEqual(board.enemy.right);
        }
      });
    } finally {
      counter.dispose();
    }
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

  /**
   * Critic pass 2, finding 2. §4.6's chain-20 tier is "a **1-frame** full-screen
   * #FFD9EC flash at 15% **on each increment**". What shipped was
   * `.ffx2chain--flash::after { position: fixed; inset: 0; opacity: 0.15 }` with
   * no keyframe at all — so from chain 20 until the chain broke, a 15% pink wash
   * covered the whole game continuously, re-extended by every further hit.
   * Measured live: every viewport corner up +29..+37/255 in R, 700 ms after the
   * increment, long after the 0.18 s pop and the 0.42 s motes were done.
   *
   * jsdom runs no animations, so the pin is on the two facts that decide it:
   * the veil's rest state is transparent, and the animation that raises it ends
   * transparent, inside one frame-budget's worth of "brief".
   */
  it('flashes the chain-20 veil and clears it, instead of leaving it on', () => {
    const css = readFileSync(HUD_CSS, 'utf8');
    const rule = /\.ffx2-chain-chip\.ffx2chain--flash::after\s*\{([\s\S]*?)\n\}/.exec(css);
    expect(rule, '.ffx2chain--flash::after not found').not.toBeNull();
    const decls = rule![1]!;
    // It is still §4.6's full-viewport #FFD9EC veil...
    expect(decls).toMatch(/position:\s*fixed/);
    expect(decls).toMatch(/inset:\s*0/);
    expect(decls).toMatch(/background:\s*#ffd9ec/i);
    // ...but at rest it is invisible, and it is driven by a real animation.
    expect(decls, 'the veil must rest transparent').toMatch(/opacity:\s*0\s*;/);
    const anim = /animation:\s*([\w-]+)\s+([\d.]+)s/.exec(decls);
    expect(anim, 'the veil must be animated, not simply on').not.toBeNull();
    const [, name, seconds] = anim!;
    // "Brief" — well under the half second the fix brief allows, let alone the
    // 1400 ms hold the veil used to cover.
    expect(Number.parseFloat(seconds!)).toBeLessThan(0.5);
    expect(decls, 'the end state has to stick, or it snaps back').toMatch(/\bforwards\b/);
    const frames = new RegExp(`@keyframes ${name}\\s*\\{([\\s\\S]*?)\\n\\}`).exec(css);
    expect(frames, `@keyframes ${name} not found`).not.toBeNull();
    const at100 = /100%\s*\{[^}]*opacity:\s*([\d.]+)/.exec(frames![1]!);
    expect(at100, 'the veil needs a 100% frame').not.toBeNull();
    expect(Number.parseFloat(at100![1]!), 'the veil must end fully transparent').toBe(0);
  });

  /**
   * ...and it has to be re-armed per increment. `show()` rewrites the class list
   * on every hit, but assigning a list that already contains `ffx2chain--flash`
   * restarts no animation — which is how a "flash" became a state. The class is
   * therefore dropped and re-added around a forced reflow, exactly as the pop
   * is, and that is observable from the DOM.
   */
  it('re-arms the veil on every increment past 20', () => {
    chain.show('bahamut', 21, 2.4);
    const chip = overlay.querySelector<HTMLElement>('.ffx2-chain-chip')!;
    expect(chip.classList.contains('ffx2chain--flash')).toBe(true);
    const seen = new MutationObserver(() => {});
    seen.observe(chip, { attributes: true, attributeFilter: ['class'], attributeOldValue: true });
    chain.show('bahamut', 22, 2.5);
    const records = seen.takeRecords();
    seen.disconnect();
    const off = records.some((r) => !(r.oldValue ?? '').includes('ffx2chain--flash'));
    expect(off, 'the flash class was never dropped, so the veil never restarts').toBe(true);
    expect(chip.classList.contains('ffx2chain--flash')).toBe(true);
  });

  /** And when the chain lapses, the chip — the veil's only host — is gone. */
  it('takes the veil with it when the chain lapses', () => {
    chain.show('bahamut', 22, 2.5);
    expect(overlay.querySelector('.ffx2chain--flash')).not.toBeNull();
    vi.advanceTimersByTime(CHAIN_HOLD_MS + 400 + 1);
    expect(overlay.querySelector('.ffx2chain--flash')).toBeNull();
    expect(overlay.querySelector('.ffx2-chain-chip')).toBeNull();
    expect(overlay.querySelector('.ffx2chain-broke')).toBeNull();
  });

  /**
   * §4.6's chain counter is FFX-2's alone (AGENTS.md rule 14): FFX has no chain
   * mechanic, emits no `chain` event and must never draw either the chip or its
   * full-viewport veil. Nothing in the FFX HUD may reach this module, and every
   * chain rule stays behind an `ffx2` class — the veil especially, since it is
   * `position: fixed` and would otherwise be a wash over an FFX battle too.
   */
  it('is FFX-2 only — no FFX module or stylesheet can draw the chip or the veil', () => {
    const ffxDir = join(process.cwd(), 'src', 'ui', 'ffx');
    for (const name of readdirSync(ffxDir)) {
      if (!/\.(ts|css)$/.test(name)) continue;
      const src = readFileSync(join(ffxDir, name), 'utf8');
      expect(src, `${name} reaches into the FFX-2 chain counter`).not.toMatch(/ChainCounter|ffx2chain|ffx2-chain-chip/);
    }
    const css = readFileSync(HUD_CSS, 'utf8');
    for (const selector of css.matchAll(/^\s*(\.[\w.-]*chain[\w.-]*[^{,]*)[,{]/gm)) {
      expect(selector[1], `${selector[1]!.trim()} is not FFX-2 scoped`).toMatch(/ffx2/);
    }
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
