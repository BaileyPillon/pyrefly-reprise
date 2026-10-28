// @vitest-environment jsdom
/**
 * Release 68's flips (message 3's picks; the driver's call under Bailey's delegation, 2026-10-28, his to overturn), the interface half: the FFX-2 ATB bars (MF-07), Trigger Happy (MF-24) and the FFX turn-order
 * list (MF-13) are ON by default; the Sphere Grid glide (MF-13b) stays HELD; and **the player's REDUCE MOTION beats every word, the default and a forced test switch for each of them, and for the cut-in's Web
 * Animation (MF-16, on since release 66)**, falling back to release 67's instant behaviour. `today` on each word, and `?fluidui=today`, put release 67's interface back. The moves half is `m3-flips-moves.test.ts`.
 *
 * Game cases (rule 14): the ATB bars and Trigger Happy are FFX-2 only (the ATB HUD, Yuna's Gunner); the turn-order list and the Sphere Grid are FFX only; the cut-in and `reduceMotionNow` are both games.
 * jsdom has no layout and no `Element.animate`: boxes and an animation recorder are installed where a test needs them; the real-browser reads are the jobs in `m3/jobs`.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FLUID_DEFAULTS, fluidWord, reduceMotionNow } from '../../src/ui/common/fluidUi.ts';
import { atbBarsSmooth, AtbLive, setAtbBarsSmooth } from '../../src/ui/ffx2/AtbLive.ts';
import { FFX2BattleHud } from '../../src/ui/ffx2/FFX2BattleHud.ts';
import { createTriggerHappy, triggerHappySmooth } from '../../src/ui/ffx2/TriggerHappy.ts';
import { CtbList } from '../../src/ui/ffx/CtbList.ts';
import { FADE_AFTER_MS, SLIDE_EASING, SLIDE_MS, ctbSlideOn, measureRows, setCtbSlide, slideRows } from '../../src/ui/ffx/CtbSlide.ts';
import { gridEaseOn, setGridEase } from '../../src/ui/ffx/party-prep/SphereGridEase.ts';
import { SphereGridView } from '../../src/ui/ffx/party-prep/SphereGridView.ts';
import { showTurnCutIn } from '../../src/ui/inkgold/cutin.ts';
import type { AnyCombatant, AtbSnapshot, BattleState, FFX2Combatant, TurnPreview } from '../../src/battle/common/types.ts';

const root = document.documentElement;
const realMatchMedia = window.matchMedia;
/** The player's REDUCE MOTION row: `applyComfort` marks `<html data-reduce-motion>` while it is on. */
const reduce = (on: boolean): void => (on ? root.setAttribute('data-reduce-motion', '') : root.removeAttribute('data-reduce-motion'));
/** The OS preference. A new function each time: `reduceMotionNow` keeps one media list per `matchMedia` function. */
const os = (on: boolean): void => void (window.matchMedia = ((q: string) => ({ matches: on, media: q })) as unknown as typeof window.matchMedia);

let played: Array<{ el: HTMLElement; keyframes: Array<Record<string, unknown>>; options: Record<string, unknown> }> = [];
const proto = HTMLElement.prototype as unknown as { animate?: unknown };
const rects = new Map<string, { left: number; top: number; width: number }>();

beforeEach(() => {
  played = [];
  rects.clear();
  proto.animate = function (this: HTMLElement, keyframes: Array<Record<string, unknown>>, options: Record<string, unknown>) {
    played.push({ el: this, keyframes, options });
    return { finished: Promise.resolve() };
  };
  HTMLElement.prototype.getBoundingClientRect = function (this: HTMLElement) {
    const at = this.parentElement ? [...this.parentElement.children].indexOf(this) : 0;
    const r = rects.get(this.dataset['actor'] ?? '') ?? (this.classList.contains('ig-ctb__row') ? { left: 100, top: at * 20, width: 100 } : { left: 0, top: 0, width: 0 });
    return { left: r.left, top: r.top, right: r.left + r.width, bottom: r.top + 10, width: r.width, height: 10, x: r.left, y: r.top, toJSON: () => ({}) } as DOMRect;
  };
  Object.defineProperty(HTMLElement.prototype, 'offsetWidth', { configurable: true, get: () => 100 });
});
afterEach(() => {
  delete proto.animate;
  reduce(false);
  window.matchMedia = realMatchMedia;
  setAtbBarsSmooth(null);
  setCtbSlide(null);
  setGridEase(null);
  vi.useRealTimers();
  document.body.innerHTML = '';
});

describe('REDUCE MOTION as the interface reads it', () => {
  it('is off in a bare page; the pause row (the attribute) or the OS preference turns it on, live', () => {
    expect(reduceMotionNow()).toBe(false);
    reduce(true);
    expect(reduceMotionNow()).toBe(true);
    reduce(false);
    expect(reduceMotionNow()).toBe(false);
    os(true);
    expect(reduceMotionNow()).toBe(true);
    os(false);
    expect(reduceMotionNow()).toBe(false);
  });
  it('the table: the ATB bars, Trigger Happy and the turn-order list are on, the Sphere Grid glide is held off; `today` and ?fluidui=today turn each off; ?fluidui=on turns all four on', () => {
    expect(FLUID_DEFAULTS).toEqual({ atbbars: true, ctbslide: true, gridease: false, triggerhappy: true });
    expect([atbBarsSmooth(''), triggerHappySmooth(''), ctbSlideOn(''), gridEaseOn('')]).toEqual([true, true, true, false]);
    expect([atbBarsSmooth('?fluidui=today'), triggerHappySmooth('?fluidui=today'), ctbSlideOn('?fluidui=today'), gridEaseOn('?fluidui=today')]).toEqual([false, false, false, false]);
    expect([atbBarsSmooth('?atbbars=today&triggerhappy=today&ctbslide=today'), gridEaseOn('?gridease=today')]).toEqual([false, false]);
    expect([atbBarsSmooth('?fluidui=on'), triggerHappySmooth('?fluidui=on'), ctbSlideOn('?fluidui=on'), gridEaseOn('?fluidui=on')]).toEqual([true, true, true, true]);
    expect(fluidWord('unknown', 'on', '')).toBe(false); // a piece with no entry in the table is off
  });
  it('beats the word, the default and a forced switch for all four pieces, with the row or the OS preference', () => {
    for (const on of [() => reduce(true), () => os(true)]) {
      reduce(false);
      os(false);
      on();
      setAtbBarsSmooth(true);
      setCtbSlide(true);
      setGridEase(true);
      expect([atbBarsSmooth('?atbbars=smooth'), triggerHappySmooth('?triggerhappy=smooth'), ctbSlideOn('?ctbslide=flip'), gridEaseOn('?gridease=on&fluidui=on')]).toEqual([false, false, false, false]);
      expect([atbBarsSmooth(''), ctbSlideOn(''), gridEaseOn('')]).toEqual([false, false, false]); // the forced switches too
    }
  });
});

// ---------------------------------------------------------------------------------------------------- MF-07
function girl(id: string): FFX2Combatant {
  return {
    id, name: id, side: 'party', spriteKey: id,
    stats: { hp: 1000, mp: 100, str: 10, def: 10, mag: 10, mdef: 10, agi: 10, luck: 10, eva: 10, acc: 10, maxHp: 1000, maxMp: 100 },
    hp: 1000, mp: 80, statuses: {}, affinities: {}, immunities: {}, immunityFlags: [], controller: 'player', alive: true, removed: false,
    slot: 0, flags: {}, level: 10,
    dresspheres: { current: 'gunner', owned: ['gunner'], garmentGrid: { id: 'g1', nodePosition: 0, passedGates: [], wornThisBattle: [] }, abilitiesLearned: {} },
    atb: { ticks: 0, required: 16000, gauge: 0, charging: null, recovery: 0 }, accessories: [], chainCount: 0, chainWindowTicks: 0,
  } as FFX2Combatant;
}
const state = (): BattleState =>
  ({ game: 'ffx2', combatants: { yuna: girl('yuna') }, activeIds: ['yuna'], reserveIds: [], enemyIds: [], aeonId: null, turn: 1, ticks: 0, log: [], nextSeq: 1, triggers: [], firedTriggerIds: [], result: null, seed: 1, flags: {} }) as BattleState;
const snap = (ms: number, fill: number): AtbSnapshot => ({ elapsedMs: ms, bars: [{ actorId: 'yuna', fill, required: 16000, ready: false, charge: null, state: 'normal' }] }) as AtbSnapshot;

describe('MF-07 the FFX-2 ATB bars (FFX-2 only): on by default, release 67\'s ratcheting bars under REDUCE MOTION', () => {
  const mount = (): { hud: FFX2BattleHud; row: () => HTMLElement | null; fill: () => HTMLElement } => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const hud = new FFX2BattleHud();
    hud.mount(host);
    return { hud, row: () => host.querySelector<HTMLElement>('.ig-stat[data-actor-id="yuna"]'), fill: () => host.querySelector<HTMLElement>('.ffx2atb__fill')! };
  };

  it('with no word the HUD keeps the row across snapshots and the frame loop writes the fill (the running bars)', () => {
    const { hud, row, fill } = mount();
    hud.sync(state(), snap(0, 0.1));
    const first = row()!;
    hud.syncGauges(snap(50, 0.1075));
    expect(row()).toBe(first);
    hud.update(1 / 60);
    expect(fill().style.transform).toMatch(/^scaleX\(0\.1/);
  });

  it('?atbbars=today (a forced off, the same reader) is release 67: every snapshot replaces the row and the fill is a width', () => {
    setAtbBarsSmooth(false);
    const { hud, row, fill } = mount();
    hud.sync(state(), snap(0, 0.1));
    const first = row()!;
    hud.syncGauges(snap(50, 0.12));
    expect(row()).not.toBe(first);
    expect(fill().style.width).toBe('12%');
  });

  it('with REDUCE MOTION on when the HUD is built, the bars ratchet as release 67\'s did: rows replaced, a width fill, nothing written per frame', () => {
    reduce(true);
    const { hud, row, fill } = mount();
    hud.sync(state(), snap(0, 0.1));
    const first = row()!;
    hud.syncGauges(snap(50, 0.12));
    expect(row()).not.toBe(first);
    expect(fill().style.width).toBe('12%');
    expect(fill().style.transform).toBe('');
    hud.update(1 / 60);
    expect(fill().style.transform).toBe('');
  });

  it('REDUCE MOTION turned on and off in the pause, mid-fight: the bars ratchet while it is on and run again, bound, when it goes off', () => {
    const { hud, row, fill } = mount();
    hud.sync(state(), snap(0, 0.1));
    hud.syncGauges(snap(50, 0.1075));
    const running = row()!;
    hud.syncGauges(snap(100, 0.115));
    expect(row()).toBe(running); // running
    reduce(true);
    hud.update(1 / 60); // a frame notices
    hud.syncGauges(snap(150, 0.12));
    expect(row()).not.toBe(running); // ratcheting: a plain row
    expect(fill().style.width).toBe('12%'); // a width, as release 67
    const plain = row()!;
    hud.syncGauges(snap(200, 0.13));
    expect(row()).not.toBe(plain); // replaced every snapshot
    reduce(false);
    hud.syncGauges(snap(250, 0.1375));
    const bound = row()!;
    expect(bound).not.toBe(plain); // rebuilt once for the running bars (the old rows were plain: the signature was dropped)
    hud.syncGauges(snap(300, 0.145));
    expect(row()).toBe(bound); // and kept again
    hud.update(1 / 60);
    expect(fill().style.transform).toMatch(/^scaleX\(/); // the frame loop writes the bound fill
  });

  it('the AtbLive state a gate drops: signatures and bound elements, so nothing stale is kept', () => {
    const live = new AtbLive();
    expect(live.smooth).toBe(true);
    const host = document.createElement('div');
    host.innerHTML = '<div class="ig-stat" data-actor-id="yuna"><i class="ffx2atb__fill"></i></div>';
    live.feed('yuna', { actorId: 'yuna', fill: 0.2, required: 16000, ready: false, charge: null, state: 'normal' } as never, 0);
    expect(live.keep('party', 'a')).toBe(false);
    expect(live.keep('party', 'a')).toBe(true);
    live.bind(host);
    reduce(true);
    expect(live.smooth).toBe(false);
    reduce(false);
    expect(live.smooth).toBe(true);
    expect(live.keep('party', 'a')).toBe(false); // the signature was dropped: the column is rebuilt
  });
});

// ---------------------------------------------------------------------------------------------------- MF-24
describe('MF-24 Trigger Happy (FFX-2 only): the bar and ring move every frame by default, step as release 67\'s did with the word `today` or REDUCE MOTION on', () => {
  function fill(search: string): { style: string; transform: string; handle: ReturnType<typeof createTriggerHappy> } {
    window.history.replaceState({}, '', `/${search}`);
    const container = document.createElement('div');
    document.body.appendChild(container);
    const handle = createTriggerHappy(container, { windowMs: 1800 });
    const el = handle.el.querySelector<HTMLElement>('.ffx2-trigger__fill')!;
    return { style: el.getAttribute('style') ?? '', transform: el.style.transform, handle };
  }
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date', 'performance'] });
    vi.stubGlobal('requestAnimationFrame', () => 1);
    vi.stubGlobal('cancelAnimationFrame', () => undefined);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    window.history.replaceState({}, '', '/');
  });

  it('no word: a persistent scaled bar (the frame loop paints it)', () => {
    const f = fill('');
    expect(f.style).toContain('transform:scaleX(1.0000)');
    expect(f.style).toContain('width:100%');
    f.handle.cancel();
  });
  it('?triggerhappy=today and ?fluidui=today: release 67\'s width that the 33 ms timer rewrites', () => {
    for (const s of ['?triggerhappy=today', '?fluidui=today']) {
      const f = fill(s);
      expect(f.style).toBe('width:100.0%');
      expect(f.transform).toBe('');
      f.handle.cancel();
    }
  });
  it('REDUCE MOTION (the pause row or the OS preference) beats ?triggerhappy=smooth: the stepped width, and the press count, the window and the result are untouched', async () => {
    for (const on of [() => reduce(true), () => (reduce(false), os(true))]) {
      on();
      const f = fill('?triggerhappy=smooth');
      expect(f.style).toBe('width:100.0%');
      f.handle.press();
      f.handle.press();
      await vi.advanceTimersByTimeAsync(1900);
      await expect(f.handle.result).resolves.toEqual({ hits: 2 });
      document.body.innerHTML = '';
    }
  });
});

// ---------------------------------------------------------------------------------------------------- MF-13
describe('MF-13 the turn-order list (FFX only): slides by default, jumps as release 67\'s did with `today` or REDUCE MOTION on', () => {
  const list = (ids: string[]): HTMLElement => {
    const el = document.createElement('div');
    el.className = 'ig-ctb';
    el.innerHTML = ids.map((id) => `<div class="ig-ctb__row" data-actor="${id}"></div>`).join('');
    document.body.appendChild(el);
    return el;
  };
  const place = (ids: string[]): void => ids.forEach((id, i) => rects.set(id, { left: 100 + i * 170, top: 0, width: 100 }));
  /** The F1 strip's turn: Tidus (first) has acted and goes to the back of Yuna and Flux; the old strip is measured, the new one is drawn. */
  function turn(): { before: ReturnType<typeof measureRows>; next: HTMLElement } {
    const old = list(['tidus', 'yuna', 'flux']);
    place(['tidus', 'yuna', 'flux']);
    const before = measureRows(old);
    const next = list(['yuna', 'flux', 'tidus']);
    place(['yuna', 'flux', 'tidus']);
    return { before, next };
  }

  it('REDUCE MOTION: slideRows plays nothing (a Web Animation is not stopped by CSS, so the gate is in code), and CtbList.render takes the jump', () => {
    reduce(true);
    const { before, next } = turn();
    expect(slideRows(next, before)).toBe(0);
    expect(played).toHaveLength(0);
    const mk = (id: string, tick: number): TurnPreview => ({ actorId: id, isParty: true, tickValue: tick, letterTag: null, overdriveReady: false, chargeStage: 0, portraitKey: id }) as unknown as TurnPreview;
    const combatants: Record<string, AnyCombatant> = { a: { id: 'a', name: 'A', side: 'party', spriteKey: 'a' } as AnyCombatant, b: { id: 'b', name: 'B', side: 'party', spriteKey: 'b' } as AnyCombatant };
    setCtbSlide(true); // a forced switch does not get past REDUCE MOTION either
    const ctb = new CtbList();
    document.body.appendChild(ctb.el);
    ctb.render([mk('a', 1), mk('b', 2)], combatants);
    ctb.render([mk('b', 1), mk('a', 2)], combatants);
    expect(played).toHaveLength(0);
    reduce(false);
    ctb.render([mk('a', 1), mk('b', 2)], combatants);
    expect(played.length).toBeGreaterThan(0); // and it slides again when the player turns it off
  });

  it('CP-11 at +33 ms: the row that fades in waits for the sliding names to clear its place (a backwards-filled delay) and ends with the slides; a fade on its own plays at once', () => {
    const { before, next } = turn();
    expect(slideRows(next, before)).toBe(3);
    const by = new Map(played.map((p) => [p.el.dataset['actor'], p]));
    expect(by.get('yuna')!.keyframes[0]!['translate']).toBeDefined();
    expect(by.get('flux')!.options['delay']).toBeUndefined(); // the slides start at once
    const fade = by.get('tidus')!;
    expect(fade.keyframes).toEqual([{ opacity: 0 }, { opacity: 1 }]); // the unit that acted fades in at the back, as before
    expect(fade.options).toMatchObject({ delay: FADE_AFTER_MS, fill: 'backwards', duration: SLIDE_MS - FADE_AFTER_MS });
    // a fade with no slide beside it (the 4th row of the strip appearing on its own) plays at once, release 67's 150 ms
    played = [];
    const lone = list(['a', 'b']);
    rects.set('a', { left: 100, top: 0, width: 100 });
    rects.set('b', { left: 0, top: 0, width: 0 });
    const was = measureRows(lone);
    rects.set('b', { left: 270, top: 0, width: 100 });
    slideRows(lone, was);
    expect(played).toHaveLength(1);
    expect(played[0]!.options).toEqual({ duration: SLIDE_MS * 0.75, easing: 'ease-out' });
  });

  it('the strip modelled frame by frame (3 rows, a 170 px pitch, "Seymour Flux" 140 px wide, "Tidus" 55 px): the names touch at +33 ms without the wait and never with it', () => {
    // the slide's own curve, solved from the CSS bezier
    const [x1, y1, x2, y2] = SLIDE_EASING.match(/-?[\d.]+/g)!.map(Number) as [number, number, number, number];
    const bez = (a: number, b: number, t: number): number => 3 * (1 - t) ** 2 * t * a + 3 * (1 - t) * t * t * b + t ** 3;
    const progress = (ms: number): number => {
      const x = Math.min(1, Math.max(0, ms / SLIDE_MS));
      let lo = 0;
      let hi = 1;
      for (let i = 0; i < 40; i++) {
        const mid = (lo + hi) / 2;
        if (bez(x1, x2, mid) < x) lo = mid;
        else hi = mid;
      }
      return bez(y1, y2, (lo + hi) / 2);
    };
    expect(progress(FADE_AFTER_MS)).toBeGreaterThanOrEqual(0.8); // the wait is when the slides have covered 80 percent of their way
    const easeOut = (u: number): number => 1 - (1 - Math.min(1, Math.max(0, u))) ** 2; // CSS ease-out is close to this; the bound is loose
    const touches = (fadeAt: number, fadeMs: number): number[] => {
      const bad: number[] = [];
      for (let ms = 0; ms <= 220; ms += 1) {
        const fluxX = 170 + 170 * (1 - progress(ms)); // Flux slides from the third place (340) to the second (170)
        const tidusOpacity = ms < fadeAt ? 0 : easeOut((ms - fadeAt) / fadeMs);
        if (tidusOpacity > 0.02 && Math.abs(fluxX - 340) < (140 + 55) / 2) bad.push(ms);
      }
      return bad;
    };
    const old = touches(0, SLIDE_MS * 0.75); // release 67's fade: at once, 150 ms
    expect(old.length).toBeGreaterThan(0);
    expect(old[0]).toBeLessThan(10);
    expect(old).toContain(33); // the card's finding
    expect(touches(FADE_AFTER_MS, SLIDE_MS - FADE_AFTER_MS)).toEqual([]);
  });
});

// ---------------------------------------------------------------------------------------------------- MF-13b
describe('MF-13b the Sphere Grid glide (FFX only; HELD off): never under REDUCE MOTION, asked at each move', () => {
  const zoomOf = (v: SphereGridView): number => (v as unknown as { zoom: number }).zoom;
  it('with the glide on, a zoom starts a glide (the drawn zoom stays until a frame); with REDUCE MOTION on it snaps at once, and a glide in flight is ended where it is', () => {
    setGridEase(true);
    const view = new SphereGridView();
    const z0 = zoomOf(view);
    view.zoomAbout(1.5, 10, 10);
    expect(zoomOf(view)).toBe(z0); // gliding: nothing changed on the spot
    reduce(true);
    view.zoomAbout(1.5, 10, 10);
    expect(zoomOf(view)).toBeGreaterThan(z0); // snapped (the glide was ended; the move landed)
    reduce(false);
    const z1 = zoomOf(view);
    view.zoomAbout(0.8, 10, 10);
    expect(zoomOf(view)).toBe(z1); // gliding again
  });
  it('the held word: off by default, ?gridease=on or ?fluidui=on turn it on', () => {
    expect([gridEaseOn(''), gridEaseOn('?gridease=on'), gridEaseOn('?fluidui=on')]).toEqual([false, true, true]);
  });
});

// ---------------------------------------------------------------------------------------------------- MF-16
describe('MF-16 the turn cut-in (both games; on since release 66): its Web Animation is gated in code by REDUCE MOTION', () => {
  const opts = { name: 'RIKKU', portraitUrl: 'p.png', ctbLabel: 'ATB 1 OF 3' };
  it('REDUCE MOTION (the pause row or the OS preference): no animation, the settled pose at once, and the way out removes the slab without one', async () => {
    for (const on of [() => reduce(true), () => (reduce(false), os(true))]) {
      on();
      played = [];
      const host = document.createElement('div');
      document.body.appendChild(host);
      const h = showTurnCutIn(host, opts);
      const slab = h.el.querySelector<HTMLElement>('.ig-cutin__slab')!;
      expect(slab.style.transform).toBe('skewX(-12deg)');
      await h.dismiss();
      expect(h.el.isConnected).toBe(false);
      expect(played).toHaveLength(0);
      host.remove();
    }
  });
  it('with it off, the entrance is the one Web Animation and the way out another', async () => {
    reduce(false);
    played = [];
    const host = document.createElement('div');
    document.body.appendChild(host);
    const h = showTurnCutIn(host, opts);
    expect(played).toHaveLength(1);
    await h.dismiss();
    expect(played).toHaveLength(2);
  });
});
