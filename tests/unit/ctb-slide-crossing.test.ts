// @vitest-environment jsdom
/**
 * **Rows that pass each other on the turn-order list fade instead of sliding through one another** (MF-13 crossing pair, release 68; game case: FFX only, the CTB list is the FFX HUD).
 *
 * The measuring lane's J3b read a real re-sort on Chapter II's list: two names overlapped for 8 to 15 frames, up to 64 px, because two rows that swap places slide through each other (the F1 strip
 * crossed in 1 frame, 28.8 px). `slideRows` now sends both rows of a pair that passes through each other, and a slider that would run through a row that stays, to the fade the unit that acted already
 * uses; every other row still slides.
 *
 * jsdom has no boxes and no `Element.animate`, so this gives each row the box a strip of 170 px pitch would (names 55 to 140 px wide), records the animations `slideRows` starts, and plays them FRAME BY
 * FRAME at 60 Hz with the curve the browser would (`SLIDE_EASING`, the fade's `ease-out`, its delay and backwards fill): the overlap read at each frame is the lane's own (`ctb-probe.mjs`: the worst width
 * two drawn rows share, both at opacity 0.05 or more).
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { FADE_AFTER_MS, SLIDE_MS, measureRows, setCtbSlide, slideRows } from '../../src/ui/ffx/CtbSlide.ts';

interface Played {
  el: HTMLElement;
  keyframes: Array<Record<string, unknown>>;
  options: Record<string, unknown>;
}
let played: Played[] = [];
const proto = HTMLElement.prototype as unknown as { animate?: unknown };
const rects = new Map<string, { left: number; top: number; width: number }>();
const HEIGHT = 24;
const PITCH = 170;
const WIDTHS: Record<string, number> = { tidus: 62, auron: 70, yuna: 58, wakka: 76, kimahri: 110, lulu: 64, seymour: 140, a: 100, b: 120, c: 90, d: 110, e: 80, f: 100 };

beforeEach(() => {
  played = [];
  rects.clear();
  proto.animate = function (this: HTMLElement, keyframes: Array<Record<string, unknown>>, options: Record<string, unknown>) {
    played.push({ el: this, keyframes, options });
    return {};
  };
  HTMLElement.prototype.getBoundingClientRect = function (this: HTMLElement) {
    const r = rects.get(this.dataset['actor'] ?? '') ?? { left: 0, top: 0, width: 0 };
    return { left: r.left, top: r.top, right: r.left + r.width, bottom: r.top + HEIGHT, width: r.width, height: r.width > 0 ? HEIGHT : 0, x: r.left, y: r.top, toJSON: () => ({}) } as DOMRect;
  };
  Object.defineProperty(HTMLElement.prototype, 'offsetWidth', { configurable: true, get(this: HTMLElement) { return rects.get(this.dataset['actor'] ?? '')?.width ?? 0; } });
});
afterEach(() => {
  delete proto.animate;
  setCtbSlide(null);
  document.body.innerHTML = '';
});

function list(order: readonly string[]): HTMLElement {
  const el = document.createElement('div');
  el.className = 'ig-ctb';
  el.innerHTML = order.map((id) => `<div class="ig-ctb__row" data-actor="${id}"></div>`).join('');
  document.body.appendChild(el);
  return el;
}

/** The strip's boxes for an order: a row every `PITCH` px; from the `visible`-th on the row is hidden (the F1 strip shows three). */
function place(order: readonly string[], visible = order.length): void {
  order.forEach((id, i) => rects.set(id, { left: i * PITCH, top: 0, width: i < visible ? WIDTHS[id] ?? 80 : 0 }));
}

// ------------------------------------------------------------------ the browser's clock: the curves, frame by frame

/** `cubic-bezier(x1, y1, x2, y2)` progress at time fraction `t` (the CSS definition: solve x(s) = t by bisection, answer y(s)). */
function bezier(x1: number, y1: number, x2: number, y2: number, t: number): number {
  const at = (a: number, b: number, s: number): number => 3 * a * s * (1 - s) * (1 - s) + 3 * b * s * s * (1 - s) + s * s * s;
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (at(x1, x2, mid) < t) lo = mid;
    else hi = mid;
  }
  return at(y1, y2, (lo + hi) / 2);
}
const curve = (name: unknown, t: number): number => {
  const c = Math.max(0, Math.min(1, t));
  if (name === 'ease-out') return bezier(0, 0, 0.58, 1, c);
  const m = /cubic-bezier\(([^)]*)\)/.exec(String(name));
  const [x1, y1, x2, y2] = (m?.[1] ?? '0.25,0.1,0.25,1').split(',').map(Number) as [number, number, number, number];
  return bezier(x1, y1, x2, y2, c);
};

interface Drawn {
  id: string;
  left: number;
  width: number;
  opacity: number;
}

/** Where every visible row is drawn, and at what opacity, `ms` into the animations `anims` started. */
function drawn(order: readonly string[], anims: readonly Played[], ms: number): Drawn[] {
  const out: Drawn[] = [];
  for (const id of order) {
    const r = rects.get(id);
    if (!r || r.width <= 0) continue;
    let left = r.left;
    let opacity = 1;
    for (const a of anims.filter((p) => p.el.dataset['actor'] === id)) {
      const o = a.options;
      const delay = Number(o['delay'] ?? 0);
      const duration = Number(o['duration'] ?? 0);
      const k0 = a.keyframes[0]!;
      const p = curve(o['easing'], (ms - delay) / duration);
      if (typeof k0['translate'] === 'string') {
        const dx = Number(k0['translate'].split(' ')[0]!.replace('px', ''));
        left += dx * (1 - (ms >= delay + duration ? 1 : p));
      }
      if (k0['opacity'] !== undefined) {
        if (ms < delay) opacity = o['fill'] === 'backwards' ? 0 : 1; // a delayed fade is drawn at its first keyframe until it starts
        else opacity = p;
      }
    }
    out.push({ id, left, width: r.width, opacity });
  }
  return out;
}

interface Read {
  frames: number;
  overlapFrames: number;
  worst: number;
  pairs: string[];
}

/** The lane's overlap read, over the whole slide at 60 Hz: for each frame the widest overlap between two rows both drawn at opacity 0.05 or more (rows share a line, so only their x extents matter). */
function read(order: readonly string[], anims: readonly Played[]): Read {
  const out: Read = { frames: 0, overlapFrames: 0, worst: 0, pairs: [] };
  for (let ms = 0; ms <= SLIDE_MS + 60; ms += 1000 / 60) {
    const rows = drawn(order, anims, ms);
    out.frames++;
    let worst = 0;
    for (let i = 0; i < rows.length; i++) {
      for (let j = i + 1; j < rows.length; j++) {
        const a = rows[i]!;
        const b = rows[j]!;
        if (a.opacity < 0.05 || b.opacity < 0.05) continue;
        const w = Math.min(a.left + a.width, b.left + b.width) - Math.max(a.left, b.left);
        if (w > 0.5 && w > worst) {
          worst = w;
          const pair = `${a.id}/${b.id}`;
          if (!out.pairs.includes(pair)) out.pairs.push(pair);
        }
      }
    }
    if (worst > 0) out.overlapFrames++;
    out.worst = Math.max(out.worst, worst);
  }
  return out;
}

/** One re-sort: the list as it was, then as it is (the render replaces the rows; `slideRows` plays from where they were). Returns what it started and the frame-by-frame read. */
function resort(from: readonly string[], to: readonly string[], visible = 99): { started: number; anims: Played[]; read: Read } {
  const was = list(from);
  place(from, visible);
  const before = measureRows(was);
  const now = list(to);
  place(to, visible);
  played = [];
  const started = slideRows(now, before);
  return { started, anims: [...played], read: read(to, played) };
}

/** What release 67 and the first build of this card did: every row that moved slides (nothing fades but the rows with no old place). The positive control: the read must SEE a crossing. */
function everyRowSlides(from: readonly string[], to: readonly string[], visible = 99): Read {
  place(from, visible);
  const was = new Map(from.map((id) => [id, rects.get(id)!.left]));
  place(to, visible);
  const anims: Played[] = [];
  list(to).querySelectorAll<HTMLElement>('.ig-ctb__row').forEach((el) => {
    const dx = (was.get(el.dataset['actor']!) ?? rects.get(el.dataset['actor']!)!.left) - rects.get(el.dataset['actor']!)!.left;
    if (Math.abs(dx) >= 0.5) anims.push({ el, keyframes: [{ translate: `${dx.toFixed(2)}px 0px` }, { translate: '0px 0px' }], options: { duration: SLIDE_MS, easing: 'cubic-bezier(0.2, 0.7, 0.2, 1)' } });
  });
  return read(to, anims);
}

const fadesOnly = (anims: readonly Played[], ids: readonly string[]): boolean =>
  ids.every((id) => {
    const mine = anims.filter((p) => p.el.dataset['actor'] === id);
    return mine.length === 1 && mine[0]!.keyframes[0]!['opacity'] === 0 && mine[0]!.keyframes[0]!['translate'] === undefined;
  });
const slidesOnly = (anims: readonly Played[], ids: readonly string[]): boolean =>
  ids.every((id) => {
    const mine = anims.filter((p) => p.el.dataset['actor'] === id);
    return mine.length === 1 && typeof mine[0]!.keyframes[0]!['translate'] === 'string';
  });

describe('the positive control: a swap of two neighbours that slides is a crossing the read can see', () => {
  it('two names overlap for several frames, by most of the narrower one (the J3b finding on the real list: 8 to 15 frames of its stepped capture, up to 64 px)', () => {
    const r = everyRowSlides(['tidus', 'seymour', 'kimahri', 'wakka'], ['tidus', 'kimahri', 'seymour', 'wakka']);
    expect(r.overlapFrames).toBeGreaterThanOrEqual(3);
    expect(r.worst).toBeGreaterThan(60);
    expect(r.pairs).toContain('kimahri/seymour');
  });
});

describe('a real re-sort of the list: no name is drawn over another at any frame', () => {
  it('two neighbours swap (Chapter II: Yuna and Auron change places): both fade in at their new places, nobody else is touched, 0 overlap frames', () => {
    const r = resort(['tidus', 'auron', 'yuna', 'wakka', 'kimahri', 'lulu'], ['tidus', 'yuna', 'auron', 'wakka', 'kimahri', 'lulu']);
    expect(r.started).toBe(2);
    expect(fadesOnly(r.anims, ['yuna', 'auron'])).toBe(true);
    expect(r.read.overlapFrames).toBe(0);
    expect(r.read.worst).toBe(0);
  });

  it('the F1 strip (three rows drawn): the swap of its first two rows is the same, 0 overlap frames', () => {
    const r = resort(['a', 'b', 'c', 'd', 'e'], ['b', 'a', 'c', 'd', 'e'], 3);
    expect(fadesOnly(r.anims, ['a', 'b'])).toBe(true);
    expect(r.read.overlapFrames).toBe(0);
  });

  it('two rows that jump over a third (the third stays): the pair fades, 0 overlap frames', () => {
    const r = resort(['a', 'b', 'c', 'd'], ['c', 'b', 'a', 'd']);
    expect(fadesOnly(r.anims, ['a', 'c'])).toBe(true);
    expect(r.anims.some((p) => p.el.dataset['actor'] === 'b')).toBe(false);
    expect(r.read.overlapFrames).toBe(0);
  });

  it('two separate swaps in one render: all four fade, 0 overlap frames', () => {
    const r = resort(['a', 'b', 'c', 'd'], ['b', 'a', 'd', 'c']);
    expect(r.started).toBe(4);
    expect(fadesOnly(r.anims, ['a', 'b', 'c', 'd'])).toBe(true);
    expect(r.read.overlapFrames).toBe(0);
  });

  it('a row that would run through a row that stays is the one that fades (the staying row is not touched)', () => {
    // b stays where it is; a goes to the far side of it and c comes the other way: each would run through b (and through each other)
    const r = resort(['a', 'b', 'c'], ['c', 'b', 'a']);
    expect(fadesOnly(r.anims, ['a', 'c'])).toBe(true);
    expect(r.anims.some((p) => p.el.dataset['actor'] === 'b')).toBe(false);
    expect(r.read.overlapFrames).toBe(0);
  });
});

describe('what still slides, and the name touch of release 67 stays at 0', () => {
  it('the unit that acted going to the back: it fades in after the slides have cleared its place, the others slide one place each, 0 overlap frames', () => {
    const r = resort(['a', 'b', 'c'], ['b', 'c', 'a']);
    expect(fadesOnly(r.anims, ['a'])).toBe(true);
    expect(slidesOnly(r.anims, ['b', 'c'])).toBe(true);
    expect(r.anims.find((p) => p.el.dataset['actor'] === 'a')!.options['delay']).toBe(FADE_AFTER_MS);
    expect(r.read.overlapFrames).toBe(0);
    const six = resort(['a', 'b', 'c', 'd', 'e', 'f'], ['b', 'c', 'd', 'e', 'f', 'a']);
    expect(slidesOnly(six.anims, ['b', 'c', 'd', 'e', 'f'])).toBe(true);
    expect(six.read.overlapFrames).toBe(0);
  });

  it('a row that leaves the front: everyone behind it slides up one place together, nobody passes anybody, 0 overlap frames', () => {
    const r = resort(['a', 'b', 'c', 'd'], ['b', 'c', 'd']);
    expect(slidesOnly(r.anims, ['b', 'c', 'd'])).toBe(true);
    expect(r.read.overlapFrames).toBe(0);
  });

  it('a pair that crosses beside the unit that acted going to the back: the pair fades, the others slide, the back row waits for them, 0 overlap frames', () => {
    const r = resort(['a', 'b', 'c', 'd', 'e'], ['c', 'b', 'd', 'e', 'a']);
    expect(r.read.overlapFrames).toBe(0);
    expect(r.read.worst).toBe(0);
    expect(r.anims.some((p) => typeof p.keyframes[0]!['translate'] === 'string')).toBe(true); // rows that pass nobody still slide
  });
});
