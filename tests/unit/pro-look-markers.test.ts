// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { BattleState } from '../../src/battle/common/types.ts';
import { setProMode, setProPiece } from '../../src/engine/look/pro/ProSwitch.ts';
import { setDemoChapter } from '../../src/engine/motion/DemoGate.ts';
import { ProFieldMarks } from '../../src/ui/common/ProFieldMarks.ts';
import { KO_FLOOR_MS, PRO_HAND_VIEW, isLowRow, koPlan, proHandSize, proRing, proRingBox, rowMark, rowMarkClass, rowMarkHtml } from '../../src/ui/common/proMarkers.ts';
import { TargetCursor, type TargetEntry } from '../../src/ui/ffx/TargetCursor.ts';
import { CONE_VIEW, coneFlips, coneSize, markerStyle, markerStyleFromSearch, setMarkerStyle } from '../../src/ui/ffx/targetCone.ts';
import { PartyStatusWindow } from '../../src/ui/ffx/PartyStatusWindow.ts';
import { dockPlate, handBox } from '../../src/ui/ffx/targetCursorParts.ts';
import { commandRowBoxes } from '../../src/ui/ffx/bracketClip.ts';

/**
 * The pro markers (lane "pro-look"; markers "Classic, calm, clear"; Chapter I and Chapter IV only, off by default): the big FFX glove, the FFX-2 ring with the name beside it, the low-HP pulse on a row, the KO
 * pill and the KO wash and mark on the field. The target marker is each game's own (FFX the glove, FFX-2 the ring: never mixed); low HP and KO are both games at each game's own line.
 */
const BOSS = { x: 900, y: 120, w: 520, h: 700 };
const ENTRY: TargetEntry = { id: 'seymour', name: 'Seymour Flux', kind: 'enemy' };

function cursor(chrome: 'ffx' | 'ffx2'): TargetCursor {
  const c = new TargetCursor();
  c.setChrome(chrome);
  c.setProjector(() => BOSS);
  document.body.append(c.el);
  return c;
}

beforeEach(() => {
  document.body.innerHTML = '';
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: 2560 });
  Object.defineProperty(window, 'innerHeight', { configurable: true, value: 1440 });
});

afterEach(() => {
  setProMode(null);
  setProPiece(null);
  setDemoChapter(undefined);
  setMarkerStyle(null);
});

describe('the pure pieces', () => {
  it('the glove is about five times the old 44 px at 1440p, and grows and stops with the window', () => {
    expect(proHandSize(2560).w).toBeGreaterThan(200);
    expect(proHandSize(2560).w).toBeLessThan(260);
    expect(proHandSize(2560).w / 44).toBeGreaterThan(4.5);
    expect(proHandSize(500).w).toBe(110);
    expect(proHandSize(9000).w).toBe(280);
    const s = proHandSize(1920);
    expect(s.h / s.w).toBeCloseTo(PRO_HAND_VIEW.h / PRO_HAND_VIEW.w, 3); // the pro glove drawing's own shape (a long pointing finger, 120 x 52)
  });

  it("the ring is a quarter of the figure's height across, on the torso, and bounded", () => {
    const r = proRing(BOSS, 1440);
    expect(r.r * 2).toBeCloseTo(BOSS.h * 0.25, 0);
    expect(r.cx).toBe(BOSS.x + BOSS.w / 2);
    expect(r.cy).toBeCloseTo(BOSS.y + BOSS.h * 0.46, 3);
    expect(proRing({ x: 0, y: 0, w: 40, h: 60 }, 1440).r).toBe(26); // never a speck
    expect(proRing({ x: 0, y: 0, w: 900, h: 4000 }, 1000).r).toBe(170); // never over a third of the shorter edge
    const box = proRingBox(r);
    expect(box.w).toBeGreaterThan(r.r * 2); // the corners stand outside the ring
    expect(box.x + box.w / 2).toBeCloseTo(r.cx, 3);
  });

  it("the low line is each game's own: FFX 12.5 percent and under, FFX-2 under a third; a fallen member is KO", () => {
    expect(isLowRow('ffx', 290, 2420)).toBe(true); // Tidus at 12 percent, the book's frame
    expect(isLowRow('ffx', 1000, 2420)).toBe(false);
    expect(isLowRow('ffx2', 83, 690)).toBe(true); // Yuna at 12 percent
    expect(isLowRow('ffx2', 200, 690)).toBe(true); // 29 percent: FFX-2's critical, not FFX's
    expect(isLowRow('ffx', 700, 2420)).toBe(false); // 29 percent is not FFX's danger
    expect(isLowRow('ffx2', 400, 690)).toBe(false);
    expect(isLowRow('ffx', 0, 2420)).toBe(false);
    expect(rowMark('ffx', 0, 2420, false)).toBe('ko');
    expect(rowMark('ffx2', 0, 690, true)).toBe('ko'); // hp 0 is down whatever the flag says
    expect(rowMark('ffx', 290, 2420, true)).toBe('low');
    expect(rowMark('ffx', 2420, 2420, true)).toBeNull();
    expect(rowMarkClass('low')).toBe(' ig-stat--pro-low');
    expect(rowMarkClass('ko')).toBe(' ig-stat--pro-ko');
    expect(rowMarkClass(null)).toBe('');
    expect(rowMarkHtml('low')).toContain('pro-mark--low');
    expect(rowMarkHtml('ko')).toContain('KO');
    expect(rowMarkHtml(null)).toBe('');
  });

  it("the KO marks follow the real fall: nothing before the floor impact (FFX 1000 ms, FFX-2 1600 ms), the wash settles, the mark pops 120 ms later and stays", () => {
    expect(KO_FLOOR_MS).toEqual({ ffx: 1000, ffx2: 1600 });
    expect(koPlan('ffx', 900)).toEqual({ wash: 0, mark: 0, markScale: 0 });
    expect(koPlan('ffx', 1225).wash).toBeGreaterThan(0.4);
    expect(koPlan('ffx', 1225).mark).toBeGreaterThan(0);
    expect(koPlan('ffx', 1250).markScale).toBeGreaterThan(1); // the pop
    const rest = koPlan('ffx', 5000);
    expect(rest.wash).toBeCloseTo(0.9, 3);
    expect(rest.mark).toBe(1);
    expect(rest.markScale).toBe(1);
    expect(koPlan('ffx2', 1500).wash).toBe(0);
    expect(koPlan('ffx2', 2300).wash).toBeGreaterThan(0.5);
  });

  it('the plate dock keeps the game\'s own order by default and takes the caller\'s when one is named', () => {
    const rect = { x: 500, y: 300, w: 200, h: 200 };
    expect(dockPlate(rect, 100, 34, []).side).toBe('below');
    expect(dockPlate(rect, 100, 34, [], ['right', 'left', 'below', 'above']).side).toBe('right');
    expect(dockPlate(rect, 100, 34, [{ x: 700, y: 250, w: 300, h: 300 }], ['right', 'left', 'below', 'above']).side).toBe('left'); // a panel on the right: the next side
  });
});

describe("the target cursor: today's with the piece off, the pro marker with it on", () => {
  it('off (the default), with ?marker=hand: FFX has its 44 px glove with the figure bracket; FFX-2 its big flower at the figure', () => {
    setMarkerStyle('hand'); // the glove is one address word away (2026-11-07: the default FFX marker is the cone)
    const f = cursor('ffx');
    f.showSingle([ENTRY]);
    expect(f.el.classList.contains('ffx-targeting--pro')).toBe(false);
    const hand = f.el.querySelector<HTMLElement>('.ffx-target__hand')!;
    expect(hand.style.width).toBe(''); // sized by the stylesheet, as it was
    expect(f.el.querySelector<HTMLElement>('.ffx-target')!.style.width).toBe('520px'); // the bracket is the figure's own box
    const x = cursor('ffx2');
    x.showSingle([ENTRY]);
    const flower = x.el.querySelector<HTMLElement>('.ffx-target__flower')!;
    expect(Number.parseFloat(flower.style.width)).toBeGreaterThan(500); // 1.12 x the longest side, capped at a third of the shorter edge (today's)
    expect(x.el.querySelector('.ffx-target__leader')).toBeNull();
  });

  it('on, with ?marker=hand: FFX gets the big glove; FFX-2 the quarter-height ring with short corners round it and the name beside it on a leader', () => {
    setMarkerStyle('hand');
    setProMode('pro');
    setDemoChapter('seymour-flux');
    const f = cursor('ffx');
    f.showSingle([ENTRY]);
    expect(f.el.classList.contains('ffx-targeting--pro')).toBe(true);
    const hand = f.el.querySelector<HTMLElement>('.ffx-target__hand')!;
    expect(Number.parseFloat(hand.style.width)).toBeCloseTo(proHandSize(2560).w, 0);
    expect(f.el.querySelector('.ffx-target__flower')).toBeNull(); // the two chromes are never mixed
    expect(f.el.querySelector('.ffx-target__plate')).not.toBeNull(); // the name stays with it

    setDemoChapter('ffx2-bahamut');
    const x = cursor('ffx2');
    x.showSingle([ENTRY]);
    const ring = proRing(BOSS, 1440);
    const flower = x.el.querySelector<HTMLElement>('.ffx-target__flower')!;
    expect(Number.parseFloat(flower.style.width)).toBeCloseTo(ring.r * 2, 0);
    expect(Number.parseFloat(flower.style.left)).toBeCloseTo(ring.cx, 0);
    expect(Number.parseFloat(flower.style.top)).toBeCloseTo(ring.cy, 0);
    expect(x.el.querySelector('.ffx-target__hand')).toBeNull();
    const box = x.el.querySelector<HTMLElement>('.ffx-target')!;
    expect(Number.parseFloat(box.style.width)).toBeCloseTo(proRingBox(ring).w, 0); // the corners stand round the ring, not the figure
    const plate = x.el.querySelector<HTMLElement>('.ffx-target__plate')!;
    expect(plate.className).toContain('ffx-target__plate--right'); // beside the ring
    expect(x.el.querySelector('.ffx-target__leader')).not.toBeNull();
    expect(plate.textContent).toContain('Seymour Flux');
  });

  it('the glove\'s plate docks off the bigger glove', () => {
    setMarkerStyle('hand');
    setProMode('pro');
    setDemoChapter('seymour-flux');
    const f = cursor('ffx');
    f.showSingle([ENTRY]);
    const plate = f.el.querySelector<HTMLElement>('.ffx-target__plate')!;
    expect(plate).not.toBeNull();
  });
});

describe("FFX's marker is the cone in Ink & Gold (Bailey 2026-11-07, 'B: cone in Ink and Gold'; FFX only; ?marker=hand brings the glove back)", () => {
  it('the cone is the default; ?marker=hand (and only that) asks for the glove', () => {
    expect(markerStyle()).toBe('cone');
    expect(markerStyleFromSearch(undefined)).toBe('cone');
    expect(markerStyleFromSearch('')).toBe('cone');
    expect(markerStyleFromSearch('?marker=hand')).toBe('hand');
    expect(markerStyleFromSearch('?marker=HAND&look=pro')).toBe('hand');
    expect(markerStyleFromSearch('?marker=cone')).toBe('cone');
    expect(markerStyleFromSearch('?marker=ring')).toBe('cone');
  });

  it('its size is 6.2 percent of the window, 64 px at the least and 168 at the most, in the drawing\'s own shape', () => {
    expect(coneSize(1600).w).toBeCloseTo(99.2, 1);
    expect(coneSize(300).w).toBe(64);
    expect(coneSize(9000).w).toBe(168);
    const s = coneSize(1920);
    expect(s.h / s.w).toBeCloseTo(CONE_VIEW.h / CONE_VIEW.w, 3);
    expect(coneSize(1600).w).toBeLessThan(proHandSize(1600).w); // smaller than the glove it replaces (the real cone is small)
  });

  it('off (the default look): FFX draws the cone at the figure, sized inline, with the glove\'s hooks and no glove', () => {
    const f = cursor('ffx');
    f.showSingle([ENTRY]);
    expect(f.el.classList.contains('ffx-targeting--pro')).toBe(false);
    const hand = f.el.querySelector<HTMLElement>('.ffx-target__hand')!;
    expect(hand.classList.contains('ffx-target__hand--cone')).toBe(true);
    expect(hand.querySelector('svg')!.classList.contains('ffx-cone')).toBe(true);
    expect(hand.querySelector('.ffx-hand__palm')).toBeNull(); // no glove
    expect(hand.querySelector('.pro-glove')).toBeNull();
    expect(Number.parseFloat(hand.style.width)).toBeCloseTo(coneSize(2560).w, 0);
    expect(Number.parseFloat(hand.style.height)).toBeCloseTo(coneSize(2560).h, 0);
    expect(hand.style.getPropertyValue('--pro-hand-bob')).toBe('8px');
    expect(f.el.querySelector<HTMLElement>('.ffx-target')!.style.width).toBe('520px'); // the bracket is still the figure's own box
    const plate = f.el.querySelector<HTMLElement>('.ffx-target__plate')!;
    expect(plate.querySelector('.ffx-target__lbl')).toBeNull(); // the three-line flag is the pro look's, not the cone's
  });

  it('on (the pro look): the cone, and the three-line flag that docks off the cone\'s own box', () => {
    setProMode('pro');
    setDemoChapter('seymour-flux');
    const f = cursor('ffx');
    f.showSingle([ENTRY]);
    expect(f.el.classList.contains('ffx-targeting--pro')).toBe(true);
    const hand = f.el.querySelector<HTMLElement>('.ffx-target__hand')!;
    expect(hand.classList.contains('ffx-target__hand--cone')).toBe(true);
    expect(Number.parseFloat(hand.style.width)).toBeCloseTo(coneSize(2560).w, 0); // not the glove's 230 px
    expect(f.el.querySelector('.pro-glove')).toBeNull();
    expect(f.el.querySelector('.ffx-target__plate .ffx-target__lbl')!.textContent).toBe('TARGET');
    expect(f.el.querySelector('.ffx-target__flower')).toBeNull(); // the two chromes are never mixed
  });

  it('FFX-2 never gets the cone: its marker is the ring, the same with either word (the ring stays byte-identical)', () => {
    const draw = (style: 'cone' | 'hand'): string => {
      setMarkerStyle(style);
      document.body.innerHTML = '';
      const x = cursor('ffx2');
      x.showSingle([ENTRY]);
      return x.el.innerHTML;
    };
    const withCone = draw('cone');
    const withHand = draw('hand');
    expect(withCone).toBe(withHand);
    expect(withCone).toContain('ffx-target__flower');
    expect(withCone).not.toContain('ffx-target__hand');
    expect(withCone).not.toContain('ffx-cone');
  });

  it('the cone docks on the figure\'s right when its left side is behind the command stack (the leftmost ally), and nowhere else', () => {
    const GAP = (2560 / 1920) * 21;
    const size = coneSize(2560);
    const ally = { x: 300, y: 500, w: 150, h: 260 }; // stands against the command list at the left
    const stack = { x: 0, y: 300, w: 330, h: 500 };
    expect(coneFlips(ally, GAP, size, [stack])).toBe(true);
    expect(coneFlips(ally, GAP, size, [])).toBe(false); // no panels: a fixture, the phone
    expect(coneFlips({ ...ally, x: 900 }, GAP, size, [stack])).toBe(false); // clear of the stack
    expect(coneFlips(ally, GAP, size, [stack, { x: 440, y: 300, w: 400, h: 600 }])).toBe(false); // the right side is covered as much: no flip
    expect(handBox(ally, GAP, size, 'right').x).toBeGreaterThan(ally.x + ally.w); // the right box stands beside the figure
    expect(handBox(ally, GAP, size).x + size.w).toBeLessThanOrEqual(ally.x); // the left box, as it always was
  });

  it('a flipped cone is drawn on the right with the mirrored class; the glove never flips', () => {
    const f = cursor('ffx');
    f.setPanels([{ x: 0, y: 0, w: 2560, h: 1440 }]); // a panel that covers the whole left of the figure and its right too: no flip
    f.showSingle([ENTRY]);
    expect(f.el.querySelector('.ffx-target__hand--flip')).toBeNull();
    f.setPanels([{ x: BOSS.x - 600, y: 0, w: 640, h: 1440 }]); // the stack stands over the boss's left side only
    f.reposition();
    const hand = f.el.querySelector<HTMLElement>('.ffx-target__hand')!;
    expect(hand.classList.contains('ffx-target__hand--flip')).toBe(true);
    expect(Number.parseFloat(hand.style.left)).toBeGreaterThan(BOSS.x + BOSS.w); // docked on the right of the figure
    setMarkerStyle('hand');
    f.reposition();
    expect(f.el.querySelector('.ffx-target__hand--flip')).toBeNull(); // the glove keeps its left dock whatever the panels are
  });

  it("the command rows count as what hides a left dock (the HUD's panel list does not carry them: a row paints on a child), and the upright phone has none", () => {
    const f = cursor('ffx');
    f.setStackRows(() => [{ x: BOSS.x - 600, y: 0, w: 640, h: 1440 }]);
    f.showSingle([ENTRY]);
    expect(f.el.querySelector('.ffx-target__hand--flip')).not.toBeNull();
    f.setStackRows(() => []);
    f.reposition();
    expect(f.el.querySelector('.ffx-target__hand--flip')).toBeNull();

    const stack = document.createElement('div');
    const row = document.createElement('div');
    row.className = 'ig-cmd';
    row.getBoundingClientRect = () => ({ left: 70, top: 600, right: 500, bottom: 660, width: 430, height: 60, x: 70, y: 600, toJSON: () => ({}) }) as DOMRect;
    stack.append(row);
    expect(commandRowBoxes(document, stack)).toEqual([{ x: 70, y: 600, w: 430, h: 60 }]);
    document.documentElement.dataset['phoneBattle'] = '1';
    expect(commandRowBoxes(document, stack)).toEqual([]); // the upright phone: the layer is not clipped there, so nothing hides a left dock
    delete document.documentElement.dataset['phoneBattle'];
  });

  it('the cone leaves a group cast alone: no marker between three allies, as before', () => {
    const f = cursor('ffx');
    f.showGroup([{ id: 'a', name: 'Tidus', kind: 'ally' }, { id: 'b', name: 'Yuna', kind: 'ally' }]);
    expect(f.el.querySelector('.ffx-target__hand')).toBeNull();
  });
});

describe('the party rows', () => {
  const combatant = (hp: number, maxHp: number, alive: boolean): Record<string, unknown> => ({
    id: 'tidus', name: 'Tidus', side: 'party', hp, mp: 115, alive, statuses: {}, stats: { maxHp, maxMp: 115 }, overdrive: { gauge: 20 }, portraitKey: 'tidus', spriteKey: 'tidus',
  });
  const render = (c: Record<string, unknown>): HTMLElement => {
    const w = new PartyStatusWindow();
    w.render(['tidus'], { tidus: c } as never, null);
    return w.el;
  };

  it('off (the default): a row is as it was, whatever the HP', () => {
    for (const [hp, alive] of [[290, true], [0, false], [2420, true]] as const) {
      const el = render(combatant(hp, 2420, alive));
      expect(el.querySelector('.pro-mark')).toBeNull();
      expect(el.innerHTML).not.toContain('ig-stat--pro');
    }
  });

  it('on: a row at the low line pulses with a triangle in the face tile; a fallen one wears the KO pill; a healthy one nothing', () => {
    setProMode('pro');
    setDemoChapter('seymour-flux');
    const low = render(combatant(290, 2420, true));
    expect(low.querySelector('.ig-stat')!.className).toContain('ig-stat--pro-low');
    expect(low.querySelector('.ig-stat__face .pro-mark--low')).not.toBeNull();
    const ko = render(combatant(0, 2420, false));
    expect(ko.querySelector('.ig-stat')!.className).toContain('ig-stat--pro-ko');
    expect(ko.querySelector('.ig-stat')!.className).toContain('ffx-stat--ko'); // the game's own KO row is still there
    expect(ko.querySelector('.ig-stat__face .pro-mark--ko')!.textContent).toBe('KO');
    const well = render(combatant(2420, 2420, true));
    expect(well.querySelector('.pro-mark')).toBeNull();
    expect(well.innerHTML).not.toContain('ig-stat--pro');
  });
});

describe('the field marks', () => {
  const state = (alive: Record<string, boolean>): BattleState =>
    ({ activeIds: Object.keys(alive), combatants: Object.fromEntries(Object.entries(alive).map(([id, a]) => [id, { id, alive: a }])) }) as unknown as BattleState;
  const tick = (m: ProFieldMarks, ms: number): void => {
    for (let t = 0; t < ms; t += 10) m.update(0.01);
  };

  it('off (the default): nothing is made, whoever is down', () => {
    const m = new ProFieldMarks('ffx');
    m.setProjector(() => ({ x: 400, y: 700 }));
    m.sync(state({ tidus: false, yuna: true }));
    tick(m, 3000);
    expect(m.count).toBe(0);
    expect(m.el.children.length).toBe(0);
  });

  it('on: a fallen member gets a wash after the floor impact and a KO mark after it; a stood-up one loses both', () => {
    setProMode('pro');
    setDemoChapter('seymour-flux');
    const m = new ProFieldMarks('ffx');
    document.body.append(m.el);
    m.setProjector((id) => (id === 'tidus' ? { x: 400, y: 700 } : { x: 900, y: 700 }));
    m.sync(state({ tidus: false, yuna: true }));
    expect(m.count).toBe(1);
    const wash = m.el.querySelector<HTMLElement>('.pro-ko-wash')!;
    const mark = m.el.querySelector<HTMLElement>('.pro-ko-mark')!;
    tick(m, 500);
    expect(Number(wash.style.opacity)).toBe(0); // the body is still falling
    expect(Number(mark.style.opacity)).toBe(0);
    tick(m, 1200);
    expect(Number(wash.style.opacity)).toBeCloseTo(0.9, 1);
    expect(Number(mark.style.opacity)).toBe(1);
    expect(wash.style.transform).toContain('400');
    // still down on the next sync: the same marks, not new ones
    m.sync(state({ tidus: false, yuna: true }));
    expect(m.count).toBe(1);
    // stood up
    m.sync(state({ tidus: true, yuna: true }));
    expect(m.count).toBe(0);
    expect(m.el.children.length).toBe(0);
  });

  it('two down at once (Rikku and Paine) each get their own', () => {
    setProMode('pro');
    setDemoChapter('ffx2-bahamut');
    const m = new ProFieldMarks('ffx2');
    m.setProjector(() => ({ x: 500, y: 800 }));
    m.sync(state({ yuna: true, rikku: false, paine: false }));
    expect(m.count).toBe(2);
    expect(m.el.querySelectorAll('.pro-ko-mark').length).toBe(2);
    m.clear();
    expect(m.el.children.length).toBe(0);
  });

  it('turning the piece off takes the marks away at the next sync', () => {
    setProMode('pro');
    setDemoChapter('seymour-flux');
    const m = new ProFieldMarks('ffx');
    m.sync(state({ tidus: false }));
    expect(m.count).toBe(1);
    setProPiece('markers', false);
    m.sync(state({ tidus: false }));
    expect(m.count).toBe(0);
  });
});
