// @vitest-environment jsdom
/**
 * The enemy-intent slab's narrow shape (judgment call K of critic round 21, PR-0270; FFX-2 only, TEXT SIZE 115 / 130 %).
 *
 * At 130 % the grown enemy list and command stack leave 121 grid px between them in Chapter VI and the slab is 150, so the
 * solver's only chrome-free spot was across the three enemies it names (and the aimed one): 100 percent of two of their boxes,
 * measured in a headless browser. `.eint__panel--narrow` wraps the same words into 116 grid px, which fits the gap. It is a third
 * taller, so it is worn only when it is clearly the cleaner of the two shapes on the board in front of it; Chapter IV at 130 %
 * has a free spot for the wide slab and keeps it. Pinned here: the scores, the choice, its stability, the measuring, the
 * stylesheet, and the order `EnemyIntentPanel.layout` asks the owner in (the slab's box is read after the answer).
 *
 * Game case: FFX-2 only. The panel's `contentKey` and the order of `avoid()` are shared plumbing with no effect on FFX.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import { EnemyIntentPanel, type IntentView } from '../../src/ui/common/EnemyIntent.ts';
import { chooseSlabWidth, type SlabSolveInput } from '../../src/ui/ffx2/intentBoard.ts';
import { INTENT_NARROW_CLASS, IntentWidth } from '../../src/ui/ffx2/intentWidth.ts';
import { pickSlabWidth, placeSlab, placeSlabScored, type SlabRect, type SlabScore } from '../../src/ui/ffx2/intentPlacement.ts';

const read = (rel: string): string => readFileSync(join(__dirname, '../..', rel), 'utf8').replace(/\r\n/g, '\n');
const r = (left: number, top: number, right: number, bottom: number, extra: Partial<SlabRect> = {}): SlabRect => ({ left, top, right, bottom, ...extra });
const score = (hard: number, party: number, cover: number): SlabScore => ({ hard, party, cover });

afterEach(() => {
  document.body.innerHTML = '';
});

describe('placeSlabScored is placeSlab with the score of the winner', () => {
  const LAYER = { width: 600, height: 400 };
  const SIZE = { w: 100, h: 100 };
  const boards: Array<[string, SlabRect[]]> = [
    ['empty', []],
    ['one chrome panel', [r(150, 100, 350, 260)]],
    ['chrome and a girl', [r(0, 0, 600, 90), r(210, 150, 310, 250, { soft: true, party: true })]],
    ['nothing free', [r(0, 0, 600, 400)]],
  ];

  it('left, top and free are exactly placeSlab\'s, tiered or not', () => {
    for (const [name, board] of boards) {
      for (const tiered of [false, true]) {
        const a = placeSlab({ left: 200, top: 150 }, SIZE, board, LAYER, 4, 0, { tiered });
        const b = placeSlabScored({ left: 200, top: 150 }, SIZE, board, LAYER, 4, 0, { tiered });
        expect({ left: b.left, top: b.top, free: b.free }, `${name}, tiered ${tiered}`).toEqual(a);
      }
    }
  });

  it('a free placement scores zero on every rank, and free is exactly "covers nothing"', () => {
    const free = placeSlabScored({ left: 200, top: 150 }, SIZE, [r(0, 0, 100, 100)], LAYER, 4);
    expect(free).toMatchObject({ free: true, hard: 0, party: 0, cover: 0 });
  });

  it('what it covers is counted on the right rank: chrome as hard, a girl as hard under girlsFirst, else as party', () => {
    const board = [r(0, 0, 600, 400, { soft: true, party: true })]; // a girl who fills the frame: nowhere to go
    const old = placeSlabScored({ left: 200, top: 150 }, SIZE, board, LAYER, 4, 0, { tiered: true });
    expect(old.hard).toBe(0);
    expect(old.party).toBe(SIZE.w * SIZE.h);
    const first = placeSlabScored({ left: 200, top: 150 }, SIZE, board, LAYER, 4, 0, { tiered: true, girlsFirst: true });
    expect(first.hard).toBe(SIZE.w * SIZE.h);
    expect(first.party).toBe(0);
    const chrome = placeSlabScored({ left: 200, top: 150 }, SIZE, [r(0, 0, 600, 400)], LAYER, 4, 0, { tiered: true });
    expect(chrome.hard).toBe(SIZE.w * SIZE.h);
  });
});

describe('while the girls rank with the chrome a girl who sways a pixel or two is touching the slab, not under it', () => {
  const LAYER = { width: 600, height: 400 };
  const SIZE = { w: 100, h: 100 };
  const NATURAL = { left: 200, top: 100 };
  // the slab's natural spot is its bottom edge at y 200; a girl's head box starts at `top`
  const girl = (top: number): SlabRect => r(180, top, 330, top + 160, { soft: true, party: true });

  it('a head box a pixel or two inside the slab is not counted (Paine, 448 against 449 px: the slab hopped 223 px)', () => {
    for (const into of [1, 2, 3]) {
      const p = placeSlabScored(NATURAL, SIZE, [girl(200 - into)], LAYER, 4, 0, { tiered: true, girlsFirst: true });
      expect(p, `${into} px into the slab`).toMatchObject({ left: 200, top: 100, free: true, hard: 0 });
    }
  });

  it('four pixels or more is under her hair: the slab moves, or pays for it on the chrome rank', () => {
    const p = placeSlabScored(NATURAL, SIZE, [girl(196)], LAYER, 4, 0, { tiered: true, girlsFirst: true });
    expect(p.free && p.left === 200 && p.top === 100).toBe(false);
  });

  it('only while the girls rank with the chrome: the old tiers count the pixel as before', () => {
    const p = placeSlabScored(NATURAL, SIZE, [girl(199)], LAYER, 4, 0, { tiered: true });
    expect(p.free && p.left === 200 && p.top === 100).toBe(false);
  });
});

describe('near: the narrow slab is looked for beside its enemy, not across the screen', () => {
  const LAYER = { width: 1000, height: 600 };
  const SIZE = { w: 100, h: 100 };
  const NATURAL = { left: 700, top: 300 };
  // a painting fills the frame but for a clean pocket in the far left corner, behind a strip of chrome
  it('left to itself the solver takes the clean corner across the screen', () => {
    const away = placeSlabScored(NATURAL, SIZE, [r(120, 0, 1000, 600), r(0, 0, 120, 290)], LAYER, 4, 0, { tiered: true });
    expect(away.free).toBe(true);
    expect(away.left).toBeLessThan(120);
  });

  it('with near it stays within the window of the natural spot, and pays for it', () => {
    const obstacles = [r(120, 0, 1000, 600, { soft: true }), r(0, 0, 120, 290)];
    const p = placeSlabScored(NATURAL, SIZE, obstacles, LAYER, 4, 0, { tiered: true, near: { dx: 300, dy: 300 } });
    expect(Math.abs(p.left - NATURAL.left)).toBeLessThanOrEqual(300);
    expect(Math.abs(p.top - NATURAL.top)).toBeLessThanOrEqual(300);
    expect(p.free).toBe(false);
    expect(p.cover).toBeGreaterThan(0);
  });

  it('the window is measured from where the slab would stand clamped into the frame, not from a natural spot far above it', () => {
    // Vegnagun's tail pins the slab 436 px above the top of the frame; every candidate is under the clamp, and none may be
    // thrown out for being "far" from a spot nobody can stand on (that returned a placement scored as covering nothing)
    const painting = r(0, 0, 1000, 600, { soft: true });
    const p = placeSlabScored({ left: 400, top: -436 }, SIZE, [painting], LAYER, 4, 30, { tiered: true, near: { dx: 300, dy: 270 } });
    expect(p.cover).toBe(SIZE.w * SIZE.h);
    expect(p.top).toBeGreaterThanOrEqual(34);
  });

  it('the natural spot is always inside the window, so a board with nothing in the way is unchanged', () => {
    const a = placeSlabScored(NATURAL, SIZE, [], LAYER, 4, 0, { tiered: true });
    const b = placeSlabScored(NATURAL, SIZE, [], LAYER, 4, 0, { tiered: true, near: { dx: 0, dy: 0 } });
    expect(b).toEqual(a);
  });

  it('the HUD and the solver hand the worn shape the same window the choice was made with', () => {
    const hud = read('src/ui/ffx2/FFX2BattleHud.ts');
    const src = read('src/ui/ffx2/intentBoard.ts');
    expect(hud).toContain('const narrow = !!panel && grown && panel.classList.contains(INTENT_NARROW_CLASS);');
    expect(hud).toContain('...(narrow ? { narrow: true } : {})');
    expect(src).toContain('...(narrow ? { near: { dx: NARROW_NEAR_SHARE * layer.width, dy: 0.5 * layer.height } } : {})');
    expect(src).toContain('const NARROW_NEAR_SHARE = 0.3;');
  });
});

describe('pickSlabWidth: the narrow shape only when it is clearly the cleaner one', () => {
  const AREA = 90_000;

  it('a free wide slab is always wide, whatever it wears now', () => {
    expect(pickSlabWidth('narrow', score(0, 0, 0), score(0, 0, 0), AREA)).toBe('wide');
    expect(pickSlabWidth('narrow', score(0, 0, 0), score(0, 0, 0), AREA)).toBe('wide');
    expect(pickSlabWidth('narrow', score(0, 0, 4), score(0, 0, 0), AREA)).toBe('wide'); // a pixel or two of graze is free enough
  });

  it('Chapter VI at 130 percent: the wide slab sits across two enemies, the narrow one on none: narrow', () => {
    expect(pickSlabWidth('wide', score(0, 0, 61_000), score(0, 0, 0), AREA)).toBe('narrow');
    expect(pickSlabWidth('narrow', score(0, 0, 61_000), score(0, 0, 0), AREA)).toBe('narrow');
  });

  it('Chapter IV at 130 percent: the narrow one is taller and covers more of the boss: wide', () => {
    expect(pickSlabWidth('wide', score(0, 0, 12_700), score(0, 0, 31_300), AREA)).toBe('wide');
    expect(pickSlabWidth('narrow', score(0, 0, 12_700), score(0, 0, 31_300), AREA)).toBe('wide');
  });

  it('a frame-filling painting under both shapes (Chapter V) is no reason to change: each keeps what it wears', () => {
    // the narrow slab is a little smaller in area, so it covers a little less of a box the size of the screen
    const wide = score(0, 0, 90_000);
    const narrow = score(0, 0, 80_000);
    expect(pickSlabWidth('wide', wide, narrow, AREA)).toBe('wide');
    expect(pickSlabWidth('narrow', wide, narrow, AREA)).toBe('narrow');
  });

  it('a wide slab that brushes a few heads is good enough (8 percent of its area), whatever the narrow one does', () => {
    expect(pickSlabWidth('wide', score(0, 0, 7_000), score(0, 0, 0), AREA)).toBe('wide');
    expect(pickSlabWidth('narrow', score(0, 0, 7_000), score(0, 0, 0), AREA)).toBe('wide');
    expect(pickSlabWidth('wide', score(0, 0, 8_000), score(0, 0, 0), AREA)).toBe('narrow'); // past it, and the narrow one is clean
  });

  it('a sliver of difference is not worth a new shape either way', () => {
    expect(pickSlabWidth('wide', score(0, 0, 20_000), score(0, 0, 18_500), AREA)).toBe('wide'); // under 2 percent of the slab
    expect(pickSlabWidth('narrow', score(0, 0, 18_500), score(0, 0, 20_000), AREA)).toBe('narrow');
  });

  it('chrome and the girls rank above the painting: the shape that covers less of them wins even if it covers more of a boss', () => {
    expect(pickSlabWidth('wide', score(5_000, 0, 1_000), score(0, 0, 40_000), AREA)).toBe('narrow');
    expect(pickSlabWidth('narrow', score(0, 0, 1_000), score(5_000, 0, 0), AREA)).toBe('wide');
    // and a few pixels of graze on that rank does not count
    expect(pickSlabWidth('wide', score(5, 0, 20_000), score(0, 0, 6_000), AREA)).toBe('narrow'); // decided on the painting instead
    expect(pickSlabWidth('wide', score(5, 0, 8_000), score(0, 0, 7_000), AREA)).toBe('wide');
  });

  it('the party rank (girls below the chrome) decides before the painting', () => {
    expect(pickSlabWidth('wide', score(0, 9_000, 0.1 + 9_000), score(0, 0, 50_000), AREA)).toBe('narrow');
    expect(pickSlabWidth('narrow', score(0, 0, 50_000), score(0, 9_000, 9_000.1), AREA)).toBe('wide');
  });

  it('settles: feeding the answer back in as "current" never changes it (no flipping between two frames)', () => {
    const covers = [0, 3, 400, 2_500, 9_000, 30_000, 61_000, 90_000];
    const tiers = [0, 5, 4_000];
    let checked = 0;
    for (const wh of tiers) for (const nh of tiers) for (const wc of covers) for (const nc of covers) {
      for (const start of ['wide', 'narrow'] as const) {
        const a = pickSlabWidth(start, score(wh, 0, wc + wh), score(nh, 0, nc + nh), AREA);
        const b = pickSlabWidth(a, score(wh, 0, wc + wh), score(nh, 0, nc + nh), AREA);
        expect(b, `wide ${wh}/${wc}, narrow ${nh}/${nc}, from ${start}`).toBe(a);
        checked++;
      }
    }
    expect(checked).toBe(tiers.length * tiers.length * covers.length * covers.length * 2);
  });
});

// Chapter VI, TEXT SIZE 130 %, the aimed enemy's slab (frames at 1600x900): the grown list (left) and command stack (right) leave
// 303 px between them
const chapterVI: SlabRect[] = [
  r(52, 100, 845, 315), // the enemy list
  r(1148, 198, 1570, 530), // the command stack
  r(1030, 583, 1590, 875), // the party list
  r(590, 685, 1010, 835), // the advisor card
  r(255, 455, 480, 820, { soft: true, party: true }), // Yuna
  r(470, 455, 620, 740, { soft: true, party: true }), // Rikku
  r(545, 440, 660, 665, { soft: true, party: true }), // Paine
  r(830, 440, 930, 600, { soft: true }), // Dr. Goon and Ormi, side by side
  r(1005, 465, 1075, 605, { soft: true }), // Fem-Goon
];

describe('chooseSlabWidth on boards drawn from the 1600x900 frames', () => {
  const input = (obstacles: SlabRect[]): SlabSolveInput => ({
    obstacles,
    layer: { left: 0, top: 0, width: 1600, height: 900 },
    head: { x: 1040, y: 470 },
    scale: 2.5,
    box: { width: 375, height: 255 },
    panelUp: true,
    chip: { width: 66, height: 20 },
    bandTop: 0,
    girlsFirst: true,
  });
  const sizes = { wide: { width: 375, height: 255 }, narrow: { width: 290, height: 300 } };

  it('Chapter VI at 130 percent: the narrow shape (the wide one has no free band between the list and the stack)', () => {
    expect(chooseSlabWidth(input(chapterVI), sizes, 'wide')).toBe('narrow');
    expect(chooseSlabWidth(input(chapterVI), sizes, 'narrow')).toBe('narrow');
  });

  it('the same board at 115 percent (a 440 px gap): wide, as it was', () => {
    const at115 = chapterVI.map((o) => (o.left === 52 ? r(52, 100, 755, 290) : o.left === 1148 ? r(1197, 275, 1570, 570) : o));
    expect(chooseSlabWidth(input(at115), sizes, 'wide')).toBe('wide');
    expect(chooseSlabWidth(input(at115), sizes, 'narrow')).toBe('wide');
  });

  it('with nothing in the way it is wide', () => {
    expect(chooseSlabWidth(input([]), sizes, 'narrow')).toBe('wide');
  });

  // (the other enemies' paintings do count: the Chapter VI board above has Dr. Goon and Ormi under the wide slab, and it narrows)
  it('the enemy the slab hangs over does not count against the wide shape: a boss alone on the board keeps the wide slab', () => {
    // Chapter IV: Bahamut's own box is the only painting, and the taller narrow slab would cover more of it
    const bahamut = r(880, 259, 1073, 603, { soft: true });
    const board = [r(52, 100, 825, 203), r(1148, 285, 1570, 532), r(1036, 583, 1575, 875), bahamut];
    const own: SlabSolveInput = { ...input(board), head: { x: 976, y: 259 } };
    expect(chooseSlabWidth(own, sizes, 'wide')).toBe('wide');
    expect(chooseSlabWidth(own, sizes, 'narrow')).toBe('wide');
  });

  it("the slab's head is projected for the rest pose and the boxes for the live one: a head a few pixels above its own box is still its own", () => {
    // Vegnagun's tail swings its box top across its own head by a pixel or two; counting it then, and not a frame later, flipped the shape
    const tail = r(846, -81, 1283, 700, { soft: true });
    const board = [r(53, 103, 832, 203), r(1148, 286, 1570, 534), tail];
    for (const above of [0, 4, 8]) {
      const own: SlabSolveInput = { ...input(board), head: { x: 1075, y: -81 - above } };
      expect(chooseSlabWidth(own, sizes, 'narrow'), `head ${above} px above its box`).toBe('wide');
    }
  });

  it('the narrow shape has to stand near its enemy: a clean corner across the screen is not a reason to change shape', () => {
    // everything near the head is taken (chrome all round), the one clean spot is the far left corner
    const board = [r(500, 0, 1600, 900), r(0, 0, 500, 500)];
    const far: SlabSolveInput = { ...input(board), head: { x: 1300, y: 470 }, box: { width: 375, height: 255 } };
    expect(chooseSlabWidth(far, { wide: { width: 375, height: 255 }, narrow: { width: 290, height: 300 } }, 'wide')).toBe('wide');
  });
});

describe('IntentWidth measures both shapes once and settles', () => {
  const rect = (w: number, h: number): DOMRect => ({ left: 0, top: 0, right: w, bottom: h, width: w, height: h, x: 0, y: 0, toJSON: () => ({}) });
  const board = (obstacles: SlabRect[]): Omit<SlabSolveInput, 'box'> => ({
    obstacles,
    layer: { left: 0, top: 0, width: 1600, height: 900 },
    head: { x: 1040, y: 470 },
    scale: 2.5,
    panelUp: true,
    chip: { width: 66, height: 20 },
    bandTop: 0,
    girlsFirst: true,
  });
  const crowded = chapterVI;

  function panelWithSizes(zero = false): { panel: HTMLElement; seen: string[] } {
    const panel = document.createElement('div');
    const seen: string[] = [];
    panel.getBoundingClientRect = () => {
      const narrow = panel.classList.contains(INTENT_NARROW_CLASS);
      seen.push(narrow ? 'narrow' : 'wide');
      if (zero) return rect(0, 0);
      return narrow ? rect(290, 300) : rect(375, 255);
    };
    return { panel, seen };
  }

  it('puts the narrow class on in a crowded board, having measured the other shape once', () => {
    const { panel, seen } = panelWithSizes();
    const width = new IntentWidth();
    expect(width.apply(panel, 'k1', board(crowded))).toBe('narrow');
    expect(panel.classList.contains(INTENT_NARROW_CLASS)).toBe(true);
    // one read of the shape it wore, one read of the other with the class flipped, and the class put back before the answer
    expect(seen).toEqual(['wide', 'narrow']);
  });

  it('the next frame on the same slab reads only what it wears: nothing is toggled, nothing flips', () => {
    const { panel, seen } = panelWithSizes();
    const width = new IntentWidth();
    width.apply(panel, 'k1', board(crowded));
    seen.length = 0;
    for (let frame = 0; frame < 5; frame++) expect(width.apply(panel, 'k1', board(crowded))).toBe('narrow');
    expect(seen).toEqual(['narrow', 'narrow', 'narrow', 'narrow', 'narrow']);
    expect(panel.classList.contains(INTENT_NARROW_CLASS)).toBe(true);
  });

  it('new text (a new key) measures the other shape again; the same board keeps its answer', () => {
    const { panel, seen } = panelWithSizes();
    const width = new IntentWidth();
    width.apply(panel, 'k1', board(crowded));
    seen.length = 0;
    expect(width.apply(panel, 'k2', board(crowded))).toBe('narrow');
    expect(seen).toEqual(['narrow', 'wide']);
    expect(panel.classList.contains(INTENT_NARROW_CLASS)).toBe(true);
  });

  it('a board with room goes back to wide, and stays there', () => {
    const { panel } = panelWithSizes();
    const width = new IntentWidth();
    width.apply(panel, 'k1', board(crowded));
    expect(width.apply(panel, 'k1', board([]))).toBe('wide');
    expect(panel.classList.contains(INTENT_NARROW_CLASS)).toBe(false);
    expect(width.apply(panel, 'k1', board([]))).toBe('wide');
  });

  it('a slab that is not laid out yet (zero box) is left as it is', () => {
    const { panel } = panelWithSizes(true);
    const width = new IntentWidth();
    expect(width.apply(panel, 'k1', board(crowded))).toBe('wide');
    expect(panel.classList.contains(INTENT_NARROW_CLASS)).toBe(false);
  });

  it('reset takes the class off (the text is back at 100 percent) and forgets the sizes', () => {
    const { panel, seen } = panelWithSizes();
    const width = new IntentWidth();
    width.apply(panel, 'k1', board(crowded));
    width.reset(panel);
    expect(panel.classList.contains(INTENT_NARROW_CLASS)).toBe(false);
    seen.length = 0;
    width.apply(panel, 'k1', board(crowded));
    expect(seen).toEqual(['wide', 'narrow']); // measured afresh
    width.reset(null); // nothing to reset: no throw
  });
});

describe('EnemyIntentPanel.layout asks the owner before it reads the slab (so a change of shape is placed with its own box)', () => {
  const view = (move: string): IntentView => ({
    enemyId: 'fem-goon',
    enemyName: 'Fem-Goon',
    turnsAway: 0,
    actsNext: true,
    kind: 'action',
    moveName: move,
    abilityId: 'blizzard',
    description: 'Magical Ice damage to the whole party.',
    elements: ['ice'],
    statusText: [],
    estimate: { name: move, hits: 1, totalHarmToParty: 170, heals: false, perTarget: [{ targetId: 'yuna', targetName: 'Yuna', amount: 55, min: 52, max: 59, hpFraction: 0.05, lethal: false, hitChancePercent: 100 }] },
    confidence: 'likely',
    branches: [],
    charge: null,
    counters: [],
    formNote: null,
    notes: [],
    cite: '',
  });
  const box = (l: number, t: number, w: number, h: number): DOMRect => ({ left: l, top: t, right: l + w, bottom: t + h, width: w, height: h, x: l, y: t, toJSON: () => ({}) });

  it('avoid() runs first, and the box it leaves is the one the slab is positioned with', () => {
    const root = document.createElement('div');
    document.body.appendChild(root);
    const panel = new EnemyIntentPanel({ game: 'ffx2', readVisible: () => true, writeVisible: () => undefined });
    const log: string[] = [];
    let narrow = false;
    panel.mount(root, {
      host: root,
      scale: () => 2.5,
      project: () => ({ x: 800, y: 600 }),
      avoid: () => {
        log.push('avoid');
        narrow = true; // the owner changes the slab's shape while it answers
        return [];
      },
    });
    const layer = root.querySelector<HTMLElement>('.eint')!;
    layer.getBoundingClientRect = () => box(0, 0, 1600, 900);
    const slab = root.querySelector<HTMLElement>('.eint__panel')!;
    slab.getBoundingClientRect = () => {
      log.push('slab');
      return narrow ? box(0, 0, 290, 300) : box(0, 0, 375, 255);
    };
    panel.setSource(() => view('Blizzard'));
    log.length = 0;
    narrow = false;
    panel.update(0);
    expect(log.indexOf('avoid')).toBeGreaterThanOrEqual(0);
    expect(log.indexOf('avoid')).toBeLessThan(log.indexOf('slab'));
    // placed with the narrow box: centred on x 800 at 290 wide, not at 375 wide
    expect(parseFloat(slab.style.left)).toBeCloseTo(800 - 290 / 2, 0);
    panel.unmount();
  });

  it('contentKey changes with the text the body shows (and so with the slab\'s height), not between identical frames', () => {
    const root = document.createElement('div');
    document.body.appendChild(root);
    const panel = new EnemyIntentPanel({ game: 'ffx2', readVisible: () => true, writeVisible: () => undefined });
    let current = view('Blizzard');
    panel.mount(root, { host: root, scale: () => 2.5, project: () => ({ x: 800, y: 600 }), avoid: () => [], density: 'brief' });
    panel.setSource(() => current);
    const first = panel.contentKey;
    expect(first.startsWith('brief~')).toBe(true);
    panel.update(0);
    expect(panel.contentKey).toBe(first);
    current = view('Fire');
    panel.refresh();
    expect(panel.contentKey).not.toBe(first);
    panel.unmount();
  });
});

describe('the stylesheet gives the narrow shape its width and the phone its wrapped names', () => {
  const css = read('src/ui/common/text-size-wide.css');
  const hud = read('src/ui/ffx2/FFX2BattleHud.ts');

  it('.eint__panel--narrow is 116 grid px, on the desktop HUD at 115 / 130 percent only', () => {
    expect(css).toContain(
      "html[data-text-size-wide]:not([data-text-size-wide='100']):not([data-phone-battle]) .eint__panel.eint__panel--narrow { width: 116px; }",
    );
    // the gap at 130 percent is 303 px (121 grid px) less 4 px of air each side: 118 grid px; 116 fits it
    expect(116 * 2.5 + 8).toBeLessThanOrEqual(1148 - 845);
  });

  it('the HUD applies the shape only while the text is grown, and resets it otherwise', () => {
    expect(hud).toContain('if (panel && grown) this.intentWidth.apply(panel, this.intentWidthKey(panel), board);');
    expect(hud).toContain('else this.intentWidth.reset(panel);');
  });

  it('the phone wraps a long tile name instead of cutting it, and the tile grows with it (min-height, not a fixed one)', () => {
    const phone = "html[data-phone-battle='ffx2'][data-text-size-wide]:not([data-text-size-wide='100'])";
    expect(css).toMatch(new RegExp(String.raw`${phone.replace(/[[\]()'=:*.]/g, '\\$&')} \.ffx2cmd__label \{[^}]*white-space: normal;`));
    expect(css).toContain(`${phone} .ffx2hud .ig-cmd {\n  height: auto;\n  min-height: 56px;\n}`);
    expect(css).toContain(`${phone} .ffx2hud__command:has(.ffx2cmd__title) .ig-cmd {\n  min-height: 48px;\n}`);
  });

  it('the phone pause keeps a key column wide enough for "Strategy guide" at 115 and 130 percent', () => {
    expect(css).toContain('.pause .pause__col--wide .pause__k {\n    width: calc(124px * var(--pyr-ts));\n  }');
    // the label needed 140 px at 115 percent and 156 px at 130 percent
    expect(124 * 1.15).toBeGreaterThan(140);
    expect(124 * 1.3).toBeGreaterThan(156);
  });
});
