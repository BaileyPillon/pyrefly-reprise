/**
 * The legibility sweep (`critic/runner/lib/legibility-pure.mjs`, `sweep.mjs`, `gap-boot.mjs`), promoted from the round-25 chief's `sweep14.mjs` (PR-0450 b, lane r43-critic-tools).
 * Round 25's capture owner swept an 11 px floor, recorded no minimum and ran Chapter I only; CHK-003 asks for 14 css px, the smallest and the count under it, on every screen
 * of both games. The page half (`collectText`) is run here inside a jsdom window as `page.evaluate` would run it (its source, alone: it must not need anything from its module);
 * the judging half is pure; the orchestration is run against a fake booted chapter that records what it was asked, so what a capture CLAIMS is checked against what it READ.
 * Nothing opens a browser.
 *
 * Game case: both (shared critic plumbing; the floor is the same in FFX and FFX-2).
 */
import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';
import { CHAPTER_IDS } from '../../src/data/encounters.ts';
import { LEGIBILITY_FLOOR_PX, UNDER_KEPT, collectText, judgeLegibility, sweepReportLine, sweepSummary } from '../../critic/runner/lib/legibility-pure.mjs';
import type { Legibility, Surface, TextItem, TextRaw } from '../../critic/runner/lib/legibility-pure.mjs';
import { BOARD_CHAPTERS, MATRIX_SIZES, PHONE_CHAPTERS, PREP_CASES, PREP_TABS, casesFor, runSweepJob, sweepBattleChapter, sweepMatrixSize, sweepPrepTabs } from '../../critic/runner/lib/sweep.mjs';
import type { BootedChapter } from '../../critic/runner/lib/sweep.mjs';
import { bootChapter } from '../../critic/runner/lib/gap-boot.mjs';

// ================================================================== the page half, in a jsdom window

// jsdom ships no types and the repo has no @types/jsdom: load it by require, typed by the one constructor this file uses.
const { JSDOM } = createRequire(import.meta.url)('jsdom') as { JSDOM: new (html: string, o?: { runScripts?: string; pretendToBeVisual?: boolean }) => { window: unknown } };

interface Layout { w?: number; h?: number; left?: number; top?: number; sw?: number; cw?: number }

/** A page of `html` whose elements (by id) have the layout given; computed style comes from jsdom, plus data-transform / data-overflow-x / data-text-overflow, which its CSS engine lacks. */
function readPage(html: string, layout: Record<string, Layout> = {}, root: { scrollW?: number; clientW?: number } = {}): TextRaw {
  const dom = new JSDOM(`<!doctype html><html><body>${html}</body></html>`, { runScripts: 'outside-only', pretendToBeVisual: true });
  const win = dom.window as unknown as Window & { DOMMatrix: unknown; eval(src: string): unknown };
  const doc = win.document;
  for (const el of Array.from(doc.querySelectorAll('[id]'))) {
    const l = layout[el.id] ?? {};
    const w = l.w ?? 100, h = l.h ?? 20, left = l.left ?? 10, top = l.top ?? 10;
    (el as HTMLElement).getBoundingClientRect = () => ({ width: w, height: h, left, top, right: left + w, bottom: top + h, x: left, y: top, toJSON: () => ({}) }) as DOMRect;
    Object.defineProperty(el, 'scrollWidth', { value: l.sw ?? w, configurable: true });
    Object.defineProperty(el, 'clientWidth', { value: l.cw ?? w, configurable: true });
  }
  Object.defineProperty(doc.documentElement, 'scrollWidth', { value: root.scrollW ?? 1024, configurable: true });
  Object.defineProperty(doc.documentElement, 'clientWidth', { value: root.clientW ?? 1024, configurable: true });
  const real = win.getComputedStyle.bind(win);
  (win as unknown as { getComputedStyle: unknown }).getComputedStyle = (el: Element) => new Proxy(real(el), {
    get: (t, p) => {
      const d = (el as HTMLElement).dataset;
      if (p === 'transform') return d['transform'] ?? 'none';
      if (p === 'overflowX') return d['overflowX'] ?? 'visible';
      if (p === 'textOverflow') return d['textOverflow'] ?? 'clip';
      const v = (t as unknown as Record<string | symbol, unknown>)[p];
      return typeof v === 'function' ? (v as (...a: unknown[]) => unknown).bind(t) : v;
    },
  });
  win.DOMMatrix = class { a: number; b: number; constructor(t: string) { const m = /scale\(([\d.]+)\)/.exec(t); this.a = m ? Number(m[1]) : 1; this.b = 0; } };
  // exactly what page.evaluate(collectText) does: the function's source, called in the page
  return JSON.parse(JSON.stringify(win.eval(`(${collectText.toString()})()`)));
}

describe('collectText, run in a page as page.evaluate runs it', () => {
  it('reads each visible text element once, with its size, and nothing the player cannot see', () => {
    const raw = readPage(
      '<div id="a" style="font-size:20px">Attack</div>'
      + '<div id="b" style="font-size:12.5px">Hit chance <b id="b2" style="font-size:12.5px">80%</b></div>'
      + '<div id="c" style="font-size:9px; display:none">hidden by display</div>'
      + '<div id="d" style="font-size:9px; visibility:hidden">hidden by visibility</div>'
      + '<div id="e" style="font-size:9px; opacity:0.02">faded out</div>'
      + '<div id="f" style="font-size:9px">off the screen</div>'
      + '<div id="g" style="font-size:9px">no size</div>'
      + '<div id="h" style="font-size:16px">   </div>'
      + '<script id="s">var hidden = 1;</script><style id="y">.x { color: red }</style>',
      { f: { left: 4000, top: 10 }, g: { w: 0, h: 0 } },
    );
    const text = raw.items.map((i) => [i.t, i.px]);
    expect(text).toEqual([['Attack', 20], ['Hit chance', 12.5], ['80%', 12.5]]);
    expect(raw.vw).toBe(1024);
    expect(raw.items.every((i) => !i.clipped && !i.ell)).toBe(true);
  });

  it('multiplies in the scale of every transform above the element: text drawn in a half-size layer is half the size', () => {
    const raw = readPage('<div id="stage" data-transform="scale(0.5)"><div id="menu" data-transform="scale(0.8)"><span id="row" style="font-size:40px">Items</span></div></div>');
    expect(raw.items).toHaveLength(1);
    expect(raw.items[0]!.px).toBeCloseTo(16, 5); // 40 x 0.8 x 0.5
  });

  it('flags text that is cut off: a clipped box and an ellipsis, and only when it really overflows', () => {
    const raw = readPage(
      '<div id="a" data-overflow-x="hidden" style="font-size:16px">A very long name that does not fit</div>'
      + '<div id="b" data-text-overflow="ellipsis" style="font-size:16px">Another very long name</div>'
      + '<div id="c" data-overflow-x="hidden" style="font-size:16px">fits</div>'
      + '<div id="d" style="font-size:16px">overflows but is visible</div>',
      { a: { sw: 240, cw: 120 }, b: { sw: 200, cw: 100 }, c: { sw: 100, cw: 100 }, d: { sw: 300, cw: 100 } },
    );
    const flag = Object.fromEntries(raw.items.map((i) => [i.t.slice(0, 6), [i.clipped, i.ell]]));
    expect(flag).toEqual({ 'A very': [true, false], Anothe: [false, true], fits: [false, false], overfl: [false, false] });
    expect(raw.items[0]).toMatchObject({ sw: 240, cw: 120 });
  });

  it('reports the page width against its scroll width, and cuts a long text to 50 characters', () => {
    const raw = readPage(`<p id="a" style="font-size:16px">${'x'.repeat(120)}</p>`, {}, { scrollW: 1500, clientW: 1024 });
    expect(raw.scrollW).toBe(1500);
    expect(raw.clientW).toBe(1024);
    expect(raw.items[0]!.t).toHaveLength(50);
  });

  it('needs nothing from its module: its source is a function that stands alone', () => {
    const src = collectText.toString();
    expect(src).toMatch(/^function collectText\(\)/);
    expect(src).not.toMatch(/LEGIBILITY_FLOOR_PX|judgeLegibility|round\(/);
  });
});

// ================================================================== the judging half

const item = (t: string, px: number, over: Partial<TextItem> = {}): TextItem => ({ t, px, cls: 'x', sw: 100, cw: 100, clipped: false, ell: false, ...over });
const raw = (items: TextItem[], over: Partial<TextRaw> = {}): TextRaw => ({ vw: 1600, vh: 900, scrollW: 1600, clientW: 1600, items, ...over });

describe('judging one surface', () => {
  it('counts the text, finds the smallest, and lists what is under the floor, smallest first', () => {
    const j = judgeLegibility(raw([item('Attack', 20), item('hint', 12.5), item('tiny', 9.04), item('HP', 14), item('MP', 13.99)]));
    expect(j).toMatchObject({ floor: 14, count: 5, min: 9.04, underCount: 3 });
    expect(j.under.map((u) => [u.text, u.px])).toEqual([['tiny', 9], ['hint', 12.5], ['MP', 14]]);
    expect(j.truncatedCount).toBe(0);
    expect(j.hScroll).toBe(false);
  });

  it('judges the floor CHK-003 names (14 css px), not the 11 px the round-25 capture owner swept: a 12.5 px hint passes the old floor and fails this one', () => {
    expect(LEGIBILITY_FLOOR_PX).toBe(14);
    const items = [item('hint', 12.5), item('Attack', 20)];
    expect(judgeLegibility(raw(items), 11).underCount).toBe(0);
    expect(judgeLegibility(raw(items)).underCount).toBe(1);
    expect(judgeLegibility(raw(items), 11).floor).toBe(11); // and the record says which floor it used
  });

  it('records the minimum even when nothing is under the floor (the old sweep recorded none), and null for a surface with no text', () => {
    expect(judgeLegibility(raw([item('Attack', 20), item('Items', 18)])).min).toBe(18);
    expect(judgeLegibility(raw([item('Attack', 20), item('Items', 18)])).underCount).toBe(0);
    expect(judgeLegibility(raw([]))).toMatchObject({ count: 0, min: null, underCount: 0 });
    expect(judgeLegibility(null)).toMatchObject({ count: 0, min: null, scrollW: null, hScroll: null });
  });

  it('keeps the smallest dozen-and-a-bit of the offenders but counts all of them', () => {
    const many = Array.from({ length: 40 }, (_, i) => item(`n${i}`, 6 + i * 0.1));
    const j = judgeLegibility(raw(many));
    expect(j.underCount).toBe(40);
    expect(j.under).toHaveLength(UNDER_KEPT);
    expect(j.under[0]!.text).toBe('n0');
  });

  it('lists the names that are cut off, clipped or ellipsised, and a page wider than the window', () => {
    const j = judgeLegibility(raw([item('Yu Pagoda A', 16, { clipped: true, sw: 180, cw: 120 }), item('Seymour Omnis', 16, { ell: true, sw: 260, cw: 200 }), item('fine', 16)], { scrollW: 1700 }));
    expect(j.truncatedCount).toBe(2);
    expect(j.truncated).toEqual([{ text: 'Yu Pagoda A', sw: 180, cw: 120, cls: 'x' }, { text: 'Seymour Omnis', sw: 260, cw: 200, cls: 'x' }]);
    expect(j.hScroll).toBe(true);
  });
});

describe('the totals of a sweep and its report line', () => {
  const ok = (min: number, count: number, extra: Partial<Legibility> = {}): Legibility => ({ ...judgeLegibility(raw([item('a', min), ...Array.from({ length: count - 1 }, () => item('b', 20))])), ...extra });
  const surfaces: Surface[] = [
    { label: 'seymour-flux battle menu', size: '1600x900', result: ok(15, 40) },
    { label: 'seymour-flux pause', size: '1600x900', result: ok(12.6, 60) },
    { label: 'ffx2-bahamut pause', size: '1600x900', result: { unverified: 'the pause did not open from the command menu (screen=battle)' } },
    { label: 'yunalesca battle menu', size: '1600x900', result: { ...ok(16, 30), truncatedCount: 1, truncated: [{ text: 'Yunalesca', sw: 300, cw: 200, cls: 'x' }] } },
  ];

  it('adds up what was measured, names what was not, and never counts an unreached surface as a pass', () => {
    const s = sweepSummary(surfaces);
    expect(s).toMatchObject({ floor: 14, surfaces: 4, measured: 3, elements: 130, min: 12.6, underCount: 1, surfacesUnder: ['seymour-flux pause'], truncatedCount: 1, surfacesTruncated: ['yunalesca battle menu'] });
    expect(s.unverified).toEqual([{ label: 'ffx2-bahamut pause', size: '1600x900', why: 'the pause did not open from the command menu (screen=battle)' }]);
  });

  it('treats a surface that read no text as unverified, not as clean', () => {
    const s = sweepSummary([{ label: 'empty', result: judgeLegibility(raw([])) }, { label: 'never', result: null }]);
    expect(s.measured).toBe(0);
    expect(s.unverified.map((u) => [u.label, u.why])).toEqual([['empty', 'no text was read on it'], ['never', 'not measured']]);
    expect(s.min).toBeNull();
  });

  it('is one line with the floor, the smallest text, the count under it, the cut-off names and the surfaces it could not reach', () => {
    const line = sweepReportLine('legibility sweep, battle', sweepSummary(surfaces));
    expect(line).not.toContain('\n');
    expect(line).toContain('legibility sweep, battle (CHK-003/CHK-009, floor 14 css px): 3 of 4 surfaces measured, 130 text elements, smallest 12.6 px');
    expect(line).toContain('1 under 14 px on 1 surface(s) (seymour-flux pause)');
    expect(line).toContain('1 clipped or ellipsised on 1 surface(s)');
    expect(line).toContain('UNVERIFIED: ffx2-bahamut pause (the pause did not open from the command menu (screen=battle))');
  });

  it('says "none" when there is none, and "not read" when nothing was', () => {
    const clean = sweepReportLine('s', sweepSummary([{ label: 'a', result: ok(15, 10) }]));
    expect(clean).toContain('none under 14 px, none clipped or ellipsised');
    expect(clean).not.toContain('UNVERIFIED');
    expect(sweepReportLine('s', sweepSummary([{ label: 'a', result: { unverified: 'x' } }]))).toContain('smallest not read');
  });
});

// ================================================================== the orchestration, on a fake booted chapter

const reading = (min: number): TextRaw => raw([item('Attack', 22), item('hint', min)]);

interface Fake extends BootedChapter { calls: string[]; closed: () => number }

/**
 * A booted chapter that answers like the game: `readings` are what collectText returns, in order; the coach marks need `coach` Enters; the pause opens on input.pause() when
 * `pauseOpens`; a snapshot succeeds unless `snapOk` is false (and then lands in `fails`, as makeSnap's would).
 */
function fakeChapter(o: { readings?: TextRaw[]; coach?: number; pauseOpens?: boolean; snapOk?: boolean; tabs?: string[] } = {}): Fake {
  const calls: string[] = [];
  const readings = [...(o.readings ?? [reading(15), reading(15), reading(13)])];
  let coach = o.coach ?? 0;
  let screen: string | null = 'battle';
  let tab = 0;
  let closed = 0;
  const fails: NonNullable<BootedChapter['fails']> = [];
  return {
    calls, closed: () => closed, fails,
    browser: { close: async () => { closed++; } },
    page: {
      waitForTimeout: async () => undefined,
      evaluate: async (fn: { name: string }) => {
        switch (fn.name) {
          case 'collectText': calls.push('collect'); return readings.shift() ?? reading(15);
          case 'coachCount': return coach;
          case 'activeTab': return (o.tabs ?? [])[tab] ?? null;
          case 'readPlate': calls.push('plate'); return { rect: [0, 0, 1600, 900], vp: [1600, 900], currentSrc: 'pause/plate-2x.webp', natural: [3200, 1800], slid: false, ownTransform: 'none', ancestorTransforms: [], dpr: 1, scrollW: 1600, clientW: 1600 };
          default: throw new Error(`unexpected evaluate ${fn.name}`);
        }
      },
    },
    input: {
      press: async (k: string) => { calls.push(`press ${k}`); if (k === 'Enter' && coach > 0) coach--; if (k === 'ArrowRight') tab++; if (k === 'Escape' && screen === 'pause') screen = 'battle'; },
      pause: async () => { calls.push('pause'); if (o.pauseOpens !== false) screen = 'pause'; },
    },
    snap: async (file: string, state: string, want?: Record<string, unknown>) => {
      calls.push(`snap ${file} ${JSON.stringify(want)}`);
      if (o.snapOk === false) { fails.push({ file, unverified: [`screen wanted ${String((want as { screen?: string } | undefined)?.screen)} got elsewhere`] }); return false; }
      void state;
      return true;
    },
    scr: async () => screen,
  };
}

describe('one battle chapter', () => {
  it('measures the menu as the player first meets it BEFORE any coach mark is cleared, then clears them, then measures again and opens the pause', async () => {
    const b = fakeChapter({ coach: 2 });
    const { rec, surfaces } = await sweepBattleChapter(b, { id: 'seymour-flux', size: '1600x900' });
    expect(b.calls).toEqual(['collect', 'press Enter', 'press Enter', 'collect', `snap 01-battle-menu.png ${JSON.stringify({ screen: 'battle', awaitingMenu: true })}`, 'pause', 'collect', 'press Escape']);
    expect(surfaces.map((s) => s.label)).toEqual(['seymour-flux first menu as shown', 'seymour-flux battle menu', 'seymour-flux pause']);
    expect(rec.firstMenuAsShown.min).toBe(15);
    expect(rec.pause).toMatchObject({ min: 13, underCount: 1 }); // 13 px is under the floor: the sweep says so
    expect(sweepSummary(surfaces)).toMatchObject({ measured: 3, underCount: 1, surfacesUnder: ['seymour-flux pause'], unverified: [] });
  });

  it('claims the battle menu only when the snapshot read it back as a battle awaiting a command; otherwise that surface is UNVERIFIED with the reason', async () => {
    const b = fakeChapter({ snapOk: false });
    const { rec, surfaces } = await sweepBattleChapter(b, { id: 'ffx2-bahamut', size: '1600x900' });
    expect(rec.battleMenuVerified).toBe(false);
    const menu = surfaces.find((s) => s.label === 'ffx2-bahamut battle menu')!;
    expect((menu.result as { unverified: string }).unverified).toMatch(/^UNVERIFIED: the battle screen was not awaiting a command when the menu was measured \(\["screen wanted battle got elsewhere"\]\)/);
    expect(sweepSummary(surfaces).unverified.map((u) => u.label)).toEqual(['ffx2-bahamut battle menu']);
  });

  it('writes the pause UNVERIFIED, with the screen it found, when the pause did not open, and does not press Escape for a pause that is not there', async () => {
    const b = fakeChapter({ pauseOpens: false });
    const { rec, surfaces } = await sweepBattleChapter(b, { id: 'ffx2-bahamut', size: '1600x900' });
    expect(rec.screen).toBe('battle');
    expect(rec.pause).toEqual({ unverified: 'the pause did not open from the command menu (screen=battle)' });
    expect(b.calls).not.toContain('press Escape');
    const s = sweepSummary(surfaces);
    expect(s.measured).toBe(2);
    expect(s.unverified).toEqual([{ label: 'ffx2-bahamut pause', size: '1600x900', why: 'the pause did not open from the command menu (screen=battle)' }]);
  });
});

describe('the prep tabs', () => {
  it('reads every tab with its label, snapshots the first with the party-prep screen asserted, and moves on by the arrow key', async () => {
    const tabs = ['PARTY', 'EQUIPMENT', 'ITEMS', 'ABILITIES', 'SPHERES', 'ORDER', 'OPTIONS'];
    const b = fakeChapter({ tabs, readings: tabs.map((_, i) => reading(14 + i)) });
    const { rec, surfaces } = await sweepPrepTabs(b, { id: 'seymour-flux', size: '390x844' });
    expect(PREP_TABS).toBe(7);
    expect(surfaces).toHaveLength(7);
    expect(surfaces[2]!.label).toBe('seymour-flux 390x844 prep tab 2 (ITEMS)');
    expect(rec.tabs.map((t) => (t as { tab: string }).tab)).toEqual(tabs);
    expect(b.calls.filter((c) => c === 'press ArrowRight')).toHaveLength(7);
    expect(b.calls.filter((c) => c.startsWith('snap'))).toEqual([`snap prep-tab0.png ${JSON.stringify({ screen: 'party-prep' })}`]);
    expect(sweepSummary(surfaces).min).toBe(14);
  });
});

describe('one viewport of the pause matrix (CHK-002)', () => {
  it('reads the plate\'s geometry with the pause open, and judges both surfaces by the same floor', async () => {
    const b = fakeChapter();
    const { rec, surfaces } = await sweepMatrixSize(b, { size: '3840x2160' });
    expect(rec.pauseOpened).toBe(true);
    expect(rec.plate).toMatchObject({ rect: [0, 0, 1600, 900], currentSrc: 'pause/plate-2x.webp', slid: false });
    expect(rec.afterEsc).toBe('battle');
    expect(surfaces.map((s) => s.label)).toEqual(['seymour-flux 3840x2160 battle menu', 'seymour-flux 3840x2160 pause']);
    expect(b.calls).toContain(`snap 02-pause.png ${JSON.stringify({ screen: 'pause' })}`);
  });

  it('records an unopened pause as such, with no plate, rather than reading a plate off the wrong screen', async () => {
    const b = fakeChapter({ pauseOpens: false });
    const { rec, surfaces } = await sweepMatrixSize(b, { size: '390x844' });
    expect(rec.pauseOpened).toBe(false);
    expect(rec).not.toHaveProperty('plate');
    expect(b.calls).not.toContain('plate');
    expect((surfaces[1]!.result as { unverified: string }).unverified).toMatch(/did not open/);
  });
});

describe('the jobs', () => {
  it('visit every board chapter, four phone chapters, the prep cases and the six viewports of CHK-002', () => {
    expect(casesFor('battle')).toHaveLength(18);
    expect(casesFor('battle').every((c) => c.size === '1600x900' && !c.touch)).toBe(true);
    expect(casesFor('phone').map((c) => c.id)).toEqual([...PHONE_CHAPTERS]);
    expect(casesFor('phone').every((c) => c.size === '390x844' && c.touch)).toBe(true);
    expect(casesFor('prep').map((c) => c.key)).toEqual(['seymour-flux-1600x900', 'ffx2-bahamut-1600x900', 'seymour-flux-390x844', 'ffx2-bahamut-390x844']);
    expect(PREP_CASES).toHaveLength(4);
    expect(casesFor('matrix').map((c) => c.size)).toEqual([...MATRIX_SIZES]);
    expect(MATRIX_SIZES).toEqual(['390x844', '1280x720', '1600x900', '2000x1012', '2560x1080', '3840x2160']);
    expect(casesFor('matrix').map((c) => c.touch)).toEqual([true, false, false, false, false, false]);
  });

  it('the board list is the product\'s own, in its order, and the phone and prep samples are on it', () => {
    expect([...BOARD_CHAPTERS]).toEqual([...CHAPTER_IDS]);
    for (const id of PHONE_CHAPTERS) expect(CHAPTER_IDS as readonly string[]).toContain(id);
    for (const [id] of PREP_CASES) expect(CHAPTER_IDS as readonly string[]).toContain(id);
  });

  it('takes a narrower list of chapters, and refuses a job it does not know', () => {
    expect(casesFor('battle', { chapters: ['yunalesca'] }).map((c) => c.id)).toEqual(['yunalesca']);
    expect(casesFor('prep', { chapters: ['ffx2-bahamut'] }).map((c) => c.key)).toEqual(['ffx2-bahamut-1600x900', 'ffx2-bahamut-390x844']);
    expect(() => casesFor('everything')).toThrow(/unknown sweep job/);
  });

  it('runs each case in a browser of its own, closes every one, saves after each, keeps a case that failed, and prints one line for the run', async () => {
    const booted: Fake[] = [];
    const saved: string[][] = [];
    const out = await runSweepJob({
      job: 'battle', base: 'https://x/', evidence: 'ev', chapters: ['seymour-flux', 'yunalesca', 'ffx2-bahamut'],
      boot: async (spec) => {
        if (spec.id === 'yunalesca') throw new Error('ASSERT-FAIL want battle got cutscene');
        const f = fakeChapter({ pauseOpens: spec.id !== 'ffx2-bahamut' });
        booted.push(f);
        expect(spec).toMatchObject({ base: 'https://x/', evidence: 'ev', dir: `sweep-battle-${spec.id}`, size: '1600x900', touch: false, stopAtPrep: false });
        return f;
      },
      save: (r) => saved.push(Object.keys(r)),
    });
    expect(booted.map((f) => f.closed())).toEqual([1, 1]);
    expect(saved).toEqual([['seymour-flux'], ['seymour-flux', 'yunalesca'], ['seymour-flux', 'yunalesca', 'ffx2-bahamut']]);
    expect(out.results['yunalesca']).toEqual({ id: 'yunalesca', size: '1600x900', error: 'the run stopped: ASSERT-FAIL want battle got cutscene' });
    expect(out.summary.unverified.map((u) => u.label)).toEqual(['yunalesca 1600x900', 'ffx2-bahamut pause']);
    expect(out.summary.measured).toBe(5);
    expect(out.reportLine).toContain('legibility sweep, battle (CHK-003/CHK-009, floor 14 css px): 5 of 7 surfaces measured');
    expect(out.reportLine).toContain('UNVERIFIED: yunalesca 1600x900 (the run stopped: ASSERT-FAIL want battle got cutscene)');
  });

  it('boots a prep job to the prep screen, not into the fight', async () => {
    const specs: boolean[] = [];
    await runSweepJob({ job: 'prep', base: 'https://x/', evidence: 'ev', chapters: ['seymour-flux'], tabs: 2, boot: async (spec) => { specs.push(spec.stopAtPrep); return fakeChapter({ readings: [reading(15), reading(15)] }); } });
    expect(specs).toEqual([true, true]); // seymour-flux at 1600x900 and at 390x844
  });
});

describe('gap-boot.mjs', () => {
  it('is a function that wants its subject and its evidence folder (the scratch copy hard-coded the live site and one round\'s folder)', async () => {
    expect(typeof bootChapter).toBe('function');
    await expect(bootChapter({ id: 'seymour-flux', dir: 'x' } as never)).rejects.toThrow(/needs the subject URL and the evidence folder/);
  });
});
