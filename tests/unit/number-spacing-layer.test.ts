// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { setProMode, setProPiece } from '../../src/engine/look/pro/ProSwitch.ts';
import { setDemoChapter } from '../../src/engine/motion/DemoGate.ts';
import { DamageNumbers } from '../../src/ui/common/DamageNumbers.ts';
import { setNumberFacts } from '../../src/ui/common/proNumbers.ts';

/**
 * Numbers that never print through each other, in the numeral layer (release 64, both games; the driver's frame-by-frame look at Chapter I's Total Annihilation: "778" drawn over a second glass number where
 * two party members stand close). The planner's own rules are in `number-spacing.test.ts`; this drives the layer: the glass numbers of two or three close targets, every 10 ms of their flight, boxes as drawn.
 */
const FRAME = { width: 2560, height: 1440 };
const SCALE = 4; // 640x360 grid at 2560x1440

interface Box {
  id: string;
  cx: number;
  cy: number;
  hw: number;
  hh: number;
}

function layer(points: Record<string, { x: number; y: number }>): DamageNumbers {
  const root = document.createElement('div');
  document.body.appendChild(root);
  const numbers = new DamageNumbers({ root, project: (id) => points[id] ?? null, scale: () => SCALE, avoid: () => [] });
  numbers.mount();
  numbers.el.getBoundingClientRect = (): DOMRect =>
    ({ x: 0, y: 0, left: 0, top: 0, right: FRAME.width, bottom: FRAME.height, width: FRAME.width, height: FRAME.height, toJSON: () => ({}) }) as DOMRect;
  return numbers;
}

/** The boxes the layer drew this frame: centre from the translate, half extents from the numeral's own width (mocked at 0.6 of the font size a figure, as the glass face measures) and font size, times the pop scale. */
function boxes(n: DamageNumbers): Box[] {
  const out: Box[] = [];
  for (const el of n.el.querySelectorAll<HTMLElement>('.dnum:not(.dnum-glint)')) {
    const t = /translate\((-?[\d.]+)px,\s*(-?[\d.]+)px\)\s*scale\((-?[\d.]+)\)/.exec(el.style.transform);
    if (!t || Number(el.style.opacity) <= 0) continue;
    const pop = Number(t[3]);
    const font = Number.parseFloat(el.style.fontSize);
    out.push({ id: `${el.dataset['target']}:${el.textContent}`, cx: Number(t[1]), cy: Number(t[2]), hw: ((el.textContent?.length ?? 0) * 0.6 * font) / 2 * pop, hh: (font * pop) / 2 });
  }
  return out;
}
const meet = (a: Box, b: Box): boolean => Math.abs(a.cx - b.cx) < a.hw + b.hw && Math.abs(a.cy - b.cy) < a.hh + b.hh;

/** Step the layer 10 ms at a time for `ms`, collecting every pair of drawn boxes that intersect. */
function flight(n: DamageNumbers, ms: number, onFrame?: (t: number) => void): string[] {
  const hits: string[] = [];
  for (let t = 0; t < ms; t += 10) {
    n.update(0.01);
    onFrame?.(t);
    const bs = boxes(n);
    for (let i = 0; i < bs.length; i++) for (let j = i + 1; j < bs.length; j++) if (meet(bs[i]!, bs[j]!)) hits.push(`${t}ms ${bs[i]!.id} x ${bs[j]!.id}`);
  }
  return hits;
}

beforeEach(() => {
  vi.spyOn(Math, 'random').mockReturnValue(0.5);
  Object.defineProperty(window.HTMLElement.prototype, 'offsetWidth', { configurable: true, get(this: HTMLElement) { return (this.textContent?.length ?? 0) * 0.6 * Number.parseFloat(this.style.fontSize || '0'); } });
});

afterEach(() => {
  vi.restoreAllMocks();
  document.body.innerHTML = '';
  setProMode(null);
  setProPiece(null);
  setDemoChapter(undefined);
  setNumberFacts(null);
});

describe('the glass numbers of close targets never overlap (both games)', () => {
  it('FFX, Total Annihilation: three party members, close, hit in one beat: no two boxes intersect on any frame, each number stays near its own target', () => {
    setProMode('pro');
    setDemoChapter('seymour-flux');
    setNumberFacts((id) => ({ maxHp: id === 'seymour' ? 70000 : 7000 }));
    const pts = { tidus: { x: 1180, y: 900 }, yuna: { x: 1240, y: 905 }, kimahri: { x: 1330, y: 880 } };
    const n = layer(pts);
    n.spawnEvent({ type: 'damage', targetId: 'tidus', sourceId: 'seymour', amount: 778, hitIndex: 0, hitCount: 1 });
    n.spawnEvent({ type: 'damage', targetId: 'yuna', sourceId: 'seymour', amount: 566, hitIndex: 0, hitCount: 1 });
    n.spawnEvent({ type: 'damage', targetId: 'kimahri', sourceId: 'seymour', amount: 540, hitIndex: 0, hitCount: 1 });
    const hits = flight(n, 1200);
    expect(hits).toEqual([]);
    // the numbers are still on their actors: none has strayed more than three box heights from its own target's chest
    const n2 = layer(pts);
    n2.spawnEvent({ type: 'damage', targetId: 'tidus', sourceId: 'seymour', amount: 778, hitIndex: 0, hitCount: 1 });
    n2.spawnEvent({ type: 'damage', targetId: 'yuna', sourceId: 'seymour', amount: 566, hitIndex: 0, hitCount: 1 });
    n2.spawnEvent({ type: 'damage', targetId: 'kimahri', sourceId: 'seymour', amount: 540, hitIndex: 0, hitCount: 1 });
    flight(n2, 300);
    for (const b of boxes(n2)) {
      const target = b.id.split(':')[0] as keyof typeof pts;
      expect(Math.hypot(b.cx - pts[target].x, b.cy - pts[target].y)).toBeLessThan(6 * b.hh);
    }
  });

  it('FFX, Total Annihilation as the driver saw it: Tidus and Kimahri a few pixels apart in x, three rounds of hits, each number ticking up (789, 1550, 2311 over 778, 1618, 2455): never overlap', () => {
    setProMode('pro');
    setDemoChapter('seymour-flux');
    setNumberFacts((id) => ({ maxHp: id === 'seymour-flux' ? 70000 : 7000 }));
    const pts = { tidus: { x: 1290, y: 760 }, kimahri: { x: 1300, y: 690 }, yuna: { x: 1780, y: 640 } };
    const n = layer(pts);
    const rounds: Array<[number, number, number, number]> = [[789, 778, 560, 0], [761, 840, 560, 190], [761, 837, 540, 380]]; // [tidus, kimahri, yuna, at ms]
    const fired = new Set<number>();
    const hits = flight(n, 1800, (t) => {
      rounds.forEach(([a, b, c, at], i) => {
        if (t < at || fired.has(i)) return;
        fired.add(i);
        n.spawnEvent({ type: 'damage', targetId: 'tidus', sourceId: 'seymour-flux', amount: a, hitIndex: i, hitCount: 3 });
        n.spawnEvent({ type: 'damage', targetId: 'kimahri', sourceId: 'seymour-flux', amount: b, hitIndex: i, hitCount: 3 });
        if (i === 0) n.spawnEvent({ type: 'damage', targetId: 'yuna', sourceId: 'seymour-flux', amount: c, hitIndex: 0, hitCount: 1 });
      });
    });
    expect(fired.size).toBe(3);
    expect(hits).toEqual([]);
  });

  it('FFX-2, a multi-hit on two close targets (each hit ticks its number up) and a heal beside it: no overlap on any frame', () => {
    setProMode('pro');
    setDemoChapter('ffx2-bahamut');
    setNumberFacts(() => ({ maxHp: 2000 }));
    const pts = { yuna: { x: 900, y: 880 }, rikku: { x: 960, y: 890 }, paine: { x: 1020, y: 875 } };
    const n = layer(pts);
    const hits: string[] = [];
    // hits of one move alternate between two targets, 190 ms a hit; paine is healed in the middle
    const script: Array<[number, () => void]> = [
      [0, () => n.spawnEvent({ type: 'damage', targetId: 'yuna', sourceId: 'bahamut', amount: 150, hitIndex: 0, hitCount: 3 })],
      [0, () => n.spawnEvent({ type: 'damage', targetId: 'rikku', sourceId: 'bahamut', amount: 140, hitIndex: 0, hitCount: 3 })],
      [190, () => n.spawnEvent({ type: 'damage', targetId: 'yuna', sourceId: 'bahamut', amount: 160, hitIndex: 1, hitCount: 3 })],
      [190, () => n.spawnEvent({ type: 'damage', targetId: 'rikku', sourceId: 'bahamut', amount: 130, hitIndex: 1, hitCount: 3 })],
      [200, () => n.spawnEvent({ type: 'heal', targetId: 'paine', amount: 300 })],
      [380, () => n.spawnEvent({ type: 'damage', targetId: 'yuna', sourceId: 'bahamut', amount: 155, hitIndex: 2, hitCount: 3 })],
      [380, () => n.spawnEvent({ type: 'damage', targetId: 'rikku', sourceId: 'bahamut', amount: 145, hitIndex: 2, hitCount: 3 })],
    ];
    const fired = new Set<number>();
    hits.push(
      ...flight(n, 1800, (t) => {
        script.forEach(([at, fn], i) => {
          if (t >= at && !fired.has(i)) {
            fired.add(i);
            fn();
          }
        });
      }),
    );
    expect(fired.size).toBe(script.length);
    expect(hits).toEqual([]);
  });

  it('a damage number and a heal beside it, at the same beat, keep apart', () => {
    setProMode('pro');
    setDemoChapter('seymour-flux');
    const n = layer({ a: { x: 1000, y: 900 }, b: { x: 1030, y: 900 } });
    n.spawnEvent({ type: 'damage', targetId: 'a', amount: 640, hitIndex: 0, hitCount: 1 });
    n.spawnEvent({ type: 'heal', targetId: 'b', amount: 648 });
    expect(flight(n, 1400)).toEqual([]);
  });

  it('two targets that project to the very same point (a worst case) still end apart', () => {
    setProMode('pro');
    setDemoChapter('ffx2-bahamut');
    const n = layer({ a: { x: 1000, y: 900 }, b: { x: 1000, y: 900 } });
    n.spawnEvent({ type: 'damage', targetId: 'a', amount: 778, hitIndex: 0, hitCount: 1 });
    n.spawnEvent({ type: 'damage', targetId: 'b', amount: 566, hitIndex: 0, hitCount: 1 });
    let marked = 0;
    expect(flight(n, 1400, () => { marked = Math.max(marked, n.el.querySelectorAll('[data-spaced]').length); })).toEqual([]);
    expect(marked).toBeGreaterThan(0); // the later one says it was moved
  });

  it('the shift never gives room back: after the earlier number is gone the later one is where it was', () => {
    setProMode('pro');
    setDemoChapter('seymour-flux');
    const n = layer({ a: { x: 1000, y: 900 }, b: { x: 1000, y: 900 } });
    n.spawnEvent({ type: 'damage', targetId: 'a', amount: 778, hitIndex: 0, hitCount: 1 });
    const later = n.spawnEvent({ type: 'damage', targetId: 'b', amount: 566, hitIndex: 0, hitCount: 1 })!;
    let last = Number.NaN;
    let maxStep = 0;
    for (let t = 0; t < 1100; t += 10) {
      n.update(0.01);
      const m = /translate\((-?[\d.]+)px,\s*(-?[\d.]+)px\)/.exec(later.style.transform.replace('translate(-50%, -50%)', ''));
      if (!m) continue;
      const y = Number(m[2]);
      if (t > 160 && !Number.isNaN(last)) maxStep = Math.max(maxStep, Math.abs(y - last));
      last = y;
    }
    expect(maxStep).toBeLessThan(10); // a rise of 30 logical px at 4x over 1.15 s is under 6 px a frame early on; no step as the first one fades
  });
});

describe('the old numbers are untouched (the piece off, every other build)', () => {
  it('without the glass numbers nothing is spaced: two coincident numerals are drawn exactly as before, none marked', () => {
    setProMode('today'); // r63-rc: the pack is on by default in Chapter I now (r64 item 200b), so the glass numbers are off only with the pro look's own off word (`?pro=off`, `?look=today`)
    setDemoChapter('seymour-flux');
    const n = layer({ a: { x: 1000, y: 900 }, b: { x: 1000, y: 900 } });
    const a = n.spawnEvent({ type: 'damage', targetId: 'a', amount: 778, hitIndex: 0, hitCount: 1 })!;
    n.spawnEvent({ type: 'damage', targetId: 'b', amount: 566, hitIndex: 0, hitCount: 1 });
    for (let t = 0; t < 600; t += 10) n.update(0.01);
    expect(a.classList.contains('dnum--glass')).toBe(false);
    expect(n.el.querySelectorAll('[data-spaced]').length).toBe(0);
  });
});
