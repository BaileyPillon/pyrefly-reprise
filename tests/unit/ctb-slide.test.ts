// @vitest-environment jsdom
/**
 * The FFX turn-order list that slides, and the Sphere Grid that glides (MF-13 / TB-13, motion-fluidity pass lane L3; game case: FFX only; look change, so behind `?ctbslide=flip` /
 * `?gridease=on` / `?fluidui=on`, default today's).
 *
 * jsdom has no boxes and no `Element.animate`, so this gives rows the boxes the test wants and records the animations; the real browser measure (row position against time across a reorder at
 * 60, 120 and 144 Hz) is in the lane folder.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { fluidWord } from '../../src/ui/common/fluidUi.ts';
import { CtbList } from '../../src/ui/ffx/CtbList.ts';
import { SLIDE_EASING, SLIDE_MS, ctbSlideOn, measureRows, setCtbSlide, slideRows } from '../../src/ui/ffx/CtbSlide.ts';
import { GLIDE_MS, GridGlide, gridEaseOn, setGridEase } from '../../src/ui/ffx/party-prep/SphereGridEase.ts';
import type { AnyCombatant, TurnPreview } from '../../src/battle/common/types.ts';

interface Played {
  el: HTMLElement;
  keyframes: Array<Record<string, unknown>>;
  options: Record<string, unknown>;
}
let played: Played[] = [];
const proto = HTMLElement.prototype as unknown as { animate?: unknown };
const rects = new Map<string, { left: number; top: number; width: number }>();

beforeEach(() => {
  played = [];
  rects.clear();
  proto.animate = function (this: HTMLElement, keyframes: Array<Record<string, unknown>>, options: Record<string, unknown>) {
    played.push({ el: this, keyframes, options });
    return {};
  };
  HTMLElement.prototype.getBoundingClientRect = function (this: HTMLElement) {
    // a row's box is by its place in the list when the test did not give it one: 20 px a row, 100 px wide
    const at = this.parentElement ? [...this.parentElement.children].indexOf(this) : 0;
    const r = rects.get(`${this.dataset['actor'] ?? ''}`) ?? (this.classList.contains('ig-ctb__row') ? { left: 100, top: at * 20, width: 100 } : { left: 0, top: 0, width: 0 });
    return { left: r.left, top: r.top, right: r.left + r.width, bottom: r.top + 10, width: r.width, height: 10, x: r.left, y: r.top, toJSON: () => ({}) } as DOMRect;
  };
  Object.defineProperty(HTMLElement.prototype, 'offsetWidth', { configurable: true, get: () => 100 });
});
afterEach(() => {
  delete proto.animate;
  setCtbSlide(null);
  setGridEase(null);
  document.body.innerHTML = '';
});

function list(rows: Array<[string, string]>): HTMLElement {
  const el = document.createElement('div');
  el.className = 'ig-ctb';
  el.innerHTML = rows.map(([actor, transform]) => `<div class="ig-ctb__row" data-actor="${actor}" style="transform:${transform}"></div>`).join('');
  document.body.appendChild(el);
  return el;
}

describe('FLIP of the turn-order list', () => {
  it('keys a unit that stands in the queue twice by which of its rows it is', () => {
    const el = list([['tidus', 'none'], ['auron', 'none'], ['tidus', 'none']]);
    rects.set('tidus', { left: 50, top: 20, width: 100 });
    rects.set('auron', { left: 60, top: 40, width: 100 });
    const m = measureRows(el);
    expect([...m.keys()]).toEqual(['tidus#0', 'auron#0', 'tidus#1']);
  });

  it('a row that moved plays from where it was to where it is, in its own unscaled pixels; one that did not move, and one that was not there, are handled', () => {
    const el = list([['auron', 'translateX(calc(var(--ig-ctb-step) * 0))'], ['tidus', 'translateX(calc(var(--ig-ctb-step) * 1))'], ['rikku', 'translateX(calc(var(--ig-ctb-step) * 2))']]);
    rects.set('auron', { left: 100, top: 10, width: 50 }); // the stage is drawn at half scale: 50 px for a 100 px row
    rects.set('tidus', { left: 96, top: 30, width: 50 });
    rects.set('rikku', { left: 92, top: 50, width: 50 });
    const before = new Map([
      ['auron#0', { left: 96, top: 30 }], // was where tidus now is, one row down
      ['tidus#0', { left: 100, top: 10 }], // was first
      // rikku is new
    ]);
    const n = slideRows(el, before);
    expect(n).toBe(3);
    const byActor = new Map(played.map((p) => [p.el.dataset['actor'], p]));
    const auron = byActor.get('auron')!;
    expect(auron.keyframes[0]!['translate']).toBe('-8.00px 40.00px'); // (96-100) and (30-10) screen px, divided by the 0.5 scale
    expect(auron.keyframes[1]!['translate']).toBe('0px 0px');
    expect(auron.keyframes[0]!['transform']).toBeUndefined(); // never the `transform`: the F1 strip and the phone rail pin it with !important, which beats an animation
    expect(auron.options['duration']).toBe(SLIDE_MS);
    expect(auron.options['easing']).toBe(SLIDE_EASING);
    expect(byActor.get('tidus')!.keyframes[0]!['translate']).toBe('8.00px -40.00px');
    expect(byActor.get('rikku')!.keyframes).toEqual([{ opacity: 0 }, { opacity: 1 }]); // a new row fades in
  });

  it('a row that has not moved is left alone, and a first render (no old list) fades nothing in', () => {
    const el = list([['auron', 'none']]);
    rects.set('auron', { left: 100, top: 10, width: 100 });
    expect(slideRows(el, new Map([['auron#0', { left: 100.2, top: 10.1 }]]))).toBe(0);
    expect(slideRows(el, new Map())).toBe(0);
  });

  it('M1 of the review: a row with no box (display: none) has no old place, so it fades in and never slides in from the page corner; a row that ends hidden is left alone', () => {
    // the F1 strip: the 4th row on is display:none, whose rect is all zeros
    const el = list([['a', 'none'], ['b', 'none'], ['c', 'none'], ['d', 'none']]);
    rects.set('a', { left: 100, top: 0, width: 100 });
    rects.set('b', { left: 100, top: 20, width: 100 });
    rects.set('c', { left: 100, top: 40, width: 100 });
    rects.set('d', { left: 0, top: 0, width: 0 }); // hidden
    const before = measureRows(el);
    expect([...before.keys()]).toEqual(['a#0', 'b#0', 'c#0']); // the hidden row is not measured as a place at (0,0)
    // one turn later: a is gone to the back (hidden), b and c each move up a place, d is now visible
    const next = list([['b', 'none'], ['c', 'none'], ['d', 'none'], ['a', 'none']]);
    rects.set('b', { left: 100, top: 0, width: 100 });
    rects.set('c', { left: 100, top: 20, width: 100 });
    rects.set('d', { left: 100, top: 40, width: 100 });
    rects.set('a', { left: 0, top: 0, width: 0 }); // hidden now
    played = [];
    const n = slideRows(next, before);
    expect(n).toBe(3);
    const by = new Map(played.map((p) => [p.el.dataset['actor'], p]));
    expect(by.get('b')!.keyframes[0]!['translate']).toBe('0.00px 20.00px');
    expect(by.get('c')!.keyframes[0]!['translate']).toBe('0.00px 20.00px');
    expect(by.get('d')!.keyframes).toEqual([{ opacity: 0 }, { opacity: 1 }]); // it fades in; nothing starts at (0,0)
    expect(by.has('a')).toBe(false); // hidden now, nothing is played on it
    for (const p of played) expect(JSON.stringify(p.keyframes)).not.toMatch(/-?[1-9]\d{2,}\.\d\dpx/); // no slide of hundreds of px
  });

  it('the unit that acted, going to the back across two or more others, fades in at its new place instead of crossing them; a swap of neighbours still slides both', () => {
    const six = ['a', 'b', 'c', 'd', 'e', 'f'];
    const el = list(six.map((id) => [id, 'none'] as [string, string]));
    six.forEach((id, i) => rects.set(id, { left: 100, top: i * 20, width: 100 }));
    const before = measureRows(el);
    const order = ['b', 'c', 'd', 'e', 'f', 'a'];
    const next = list(order.map((id) => [id, 'none'] as [string, string]));
    order.forEach((id, i) => rects.set(id, { left: 100, top: i * 20, width: 100 }));
    played = [];
    expect(slideRows(next, before)).toBe(6);
    const by = new Map(played.map((p) => [p.el.dataset['actor'], p]));
    expect(by.get('a')!.keyframes).toEqual([{ opacity: 0 }, { opacity: 1 }]); // 5 places: no crossing
    for (const id of ['b', 'c', 'd', 'e', 'f']) expect(by.get(id)!.keyframes[0]!['translate']).toBe('0.00px 20.00px');
    // the unit that acted going to the back of three (the real Chapter I strip: "Tidus" crossed over "Seymour Flux" in the first capture): the others move one place, it moves two, so it fades in and the others slide
    const el3 = list([['a', 'none'], ['b', 'none'], ['c', 'none']]);
    ['a', 'b', 'c'].forEach((id, i) => rects.set(id, { left: 100, top: i * 20, width: 100 }));
    const before3 = measureRows(el3);
    const next3 = list([['b', 'none'], ['c', 'none'], ['a', 'none']]);
    ['b', 'c', 'a'].forEach((id, i) => rects.set(id, { left: 100, top: i * 20, width: 100 }));
    played = [];
    expect(slideRows(next3, before3)).toBe(3);
    const by3 = new Map(played.map((p) => [p.el.dataset['actor'], p]));
    expect(by3.get('a')!.keyframes).toEqual([{ opacity: 0 }, { opacity: 1 }]);
    expect(by3.get('b')!.keyframes[0]!['translate']).toBe('0.00px 20.00px');
    expect(by3.get('c')!.keyframes[0]!['translate']).toBe('0.00px 20.00px');
    // two neighbours that swap: both move one place, both slide
    const el2 = list([['a', 'none'], ['b', 'none']]);
    ['a', 'b'].forEach((id, i) => rects.set(id, { left: 100, top: i * 20, width: 100 }));
    const before2 = measureRows(el2);
    const next2 = list([['b', 'none'], ['a', 'none']]);
    ['b', 'a'].forEach((id, i) => rects.set(id, { left: 100, top: i * 20, width: 100 }));
    played = [];
    expect(slideRows(next2, before2)).toBe(2);
    expect(played.every((p) => p.keyframes[0]!['translate'] !== undefined)).toBe(true);
  });

  it('CtbList.render slides only with the word on and a mounted list; the markup is the same either way', () => {
    const mk = (id: string, tick: number): TurnPreview => ({ actorId: id, isParty: true, tickValue: tick, letterTag: null, overdriveReady: false, chargeStage: 0, portraitKey: id }) as unknown as TurnPreview;
    const state: Record<string, AnyCombatant> = { a: { id: 'a', name: 'A', side: 'party', spriteKey: 'a' } as AnyCombatant, b: { id: 'b', name: 'B', side: 'party', spriteKey: 'b' } as AnyCombatant };
    const render = (on: boolean): string => {
      setCtbSlide(on);
      const ctb = new CtbList();
      document.body.appendChild(ctb.el);
      ctb.render([mk('a', 1), mk('b', 2)], state);
      ctb.render([mk('b', 1), mk('a', 2)], state); // the two swap places: each moves 20 px
      const html = ctb.el.innerHTML;
      ctb.el.remove();
      return html;
    };
    const off = render(false);
    expect(played).toHaveLength(0);
    const on = render(true);
    expect(played.length).toBeGreaterThan(0);
    expect(on).toBe(off);
  });
});

describe('the switch words', () => {
  it('a piece\'s own word beats the shared one in both directions; no word is off', () => {
    expect(fluidWord('ctbslide', 'flip', '')).toBe(false);
    expect(fluidWord('ctbslide', 'flip', '?ctbslide=flip')).toBe(true);
    expect(fluidWord('ctbslide', 'flip', '?fluidui=on')).toBe(true);
    expect(fluidWord('ctbslide', 'flip', '?fluidui=on&ctbslide=today')).toBe(false);
    expect(fluidWord('ctbslide', 'flip', '?ctbslide=flip&fluidui=off')).toBe(true);
    expect(fluidWord('ctbslide', 'flip', '?fluidui=off')).toBe(false);
    expect(ctbSlideOn('?ctbslide=flip')).toBe(true);
    expect(gridEaseOn('?fluidui=on')).toBe(true);
    expect(gridEaseOn('?pack=demo')).toBe(false);
  });
});

describe('the Sphere Grid glide', () => {
  const view = { x: 0, y: 0, z: 0.58 };
  it('runs from what is drawn to where the move leaves it, easing out, and ends exactly there', () => {
    const g = new GridGlide();
    g.start(view, { x: 100, y: -40, z: 0.58 }, 1000);
    expect(g.step(1000)).toEqual(view);
    const mid = g.step(1000 + GLIDE_MS / 2)!;
    expect(mid.x).toBeGreaterThan(50); // out: more than half the way at half the time
    expect(mid.x).toBeLessThan(100);
    expect(g.step(1000 + GLIDE_MS)).toEqual({ x: 100, y: -40, z: 0.58 });
    expect(g.active).toBe(false);
    expect(g.step(5000)).toBeNull();
  });

  it('a move made during a glide builds on its end (a spin of the wheel adds up) and starts from what is drawn', () => {
    const g = new GridGlide();
    let v = { ...view };
    const get = (): typeof view => ({ ...v });
    const set = (n: typeof view): void => void (v = { ...n });
    g.run(get, set, () => void (v.z *= 1.12), 0);
    expect(v.z).toBeCloseTo(0.58, 9); // still drawn where it was
    g.step(GLIDE_MS / 4);
    g.run(get, set, () => void (v.z *= 1.12), GLIDE_MS / 4);
    expect(g.target()!.z).toBeCloseTo(0.58 * 1.12 * 1.12, 9);
    expect(g.step(GLIDE_MS / 4 + GLIDE_MS)!.z).toBeCloseTo(0.58 * 1.12 * 1.12, 9);
  });

  it('a move that goes nowhere stops the glide, and a drag cancels it where it is', () => {
    const g = new GridGlide();
    g.start(view, { x: 10, y: 0, z: 0.58 }, 0);
    g.start(view, { ...view }, 5);
    expect(g.active).toBe(false);
    g.start(view, { x: 10, y: 0, z: 0.58 }, 0);
    g.cancel();
    expect(g.step(10)).toBeNull();
  });
});
