// @vitest-environment jsdom
/**
 * Pause faces, option A (both games' plumbing; the case is FFX-2 Paine):
 * Bailey, 24 Sep 2026, "I'll go with your recommendations full speed again
 * please". Where neither the face-clear framing nor option B's slide clears a
 * face, IN THIS FIGHT stacks under BATTLE STATS in one column on the chrome
 * side, rising only as far as it must to clear the objective.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it, vi } from 'vitest';
import { FACE_BOXES, type Rect } from '../../src/app/screens/pause/faceClear.ts';
import { frameFace } from '../../src/app/screens/pause/faceSlide.ts';
import { chromeFor, clearsFace, coversFace } from '../../src/app/screens/pause/faceStack.ts';
import { PHONE_LAYOUT_QUERY, setStacked, STACK_AIR } from '../../src/app/screens/pause/stackColumn.ts';
import { PortraitStage } from '../../src/app/screens/pause/PortraitStage.ts';
import { estimateBlocks, FaceFramer } from '../../src/app/screens/pause/faceFramer.ts';
import { framePlate, PLATE_FRAMING } from '../../src/app/screens/pause/plates.ts';

const HERE = dirname(fileURLToPath(import.meta.url));
const read = (...p: string[]): string => readFileSync(join(HERE, '..', '..', ...p), 'utf8');

/** Chromium's layout of chapter 5's mirrored chrome at 1280x960, two columns (as `pause-face-slide.test.ts`). */
const PAINE_FLAT: Rect[] = [
  { left: 936, right: 1229, top: 317, bottom: 553 }, // BATTLE STATS
  { left: 481, right: 897, top: 317, bottom: 553 }, // IN THIS FIGHT
  { left: 675, right: 1229, top: 749, bottom: 785 }, // eyebrow
  { left: 845, right: 1229, top: 798, bottom: 871 }, // objective
  { left: 51, right: 895, top: 58, bottom: 100 }, // tab strip
  { left: 51, right: 196, top: 882, bottom: 932 }, // ESC RESUME / H
];

/** The same screen with the stack on, as Chromium laid it out (GPU, real keys, 24 Sep 2026). */
const PAINE_STACKED: Rect[] = [
  { left: 936, right: 1229, top: 265, bottom: 501 }, // BATTLE STATS
  { left: 812, right: 1229, top: 526, bottom: 733 }, // IN THIS FIGHT, under it
  { left: 675, right: 1229, top: 749, bottom: 785 },
  { left: 845, right: 1229, top: 798, bottom: 871 },
  { left: 51, right: 895, top: 58, bottom: 100 },
  { left: 51, right: 196, top: 882, bottom: 932 },
];

/** Chapter 1's member chrome at 1280x960, left side (as `pause-face-slide.test.ts`): B slides FFX Tidus against it. */
const TIDUS_LEFT: Rect[] = [
  { left: 51, right: 344, top: 317, bottom: 553 },
  { left: 383, right: 700, top: 317, bottom: 553 },
  { left: 51, right: 473, top: 28, bottom: 46 },
  { left: 51, right: 571, top: 749, bottom: 767 },
  { left: 51, right: 580, top: 780, bottom: 853 },
  { left: 51, right: 922, top: 58, bottom: 100 },
  { left: 1175, right: 1229, top: 74, bottom: 100 },
  { left: 1087, right: 1229, top: 882, bottom: 904 },
  { left: 1084, right: 1229, top: 914, bottom: 932 },
];

/** A fake screen: which layout is up, and a log of the switch. */
function screen(flat: Rect[] | null, stacked: Rect[] | null, fits = true) {
  const log: boolean[] = [];
  let on = false;
  return {
    log,
    get on() {
      return on;
    },
    measure: (): Rect[] | null => (on ? stacked : flat),
    stack: (want: boolean): boolean => {
      log.push(want);
      on = want;
      return want ? fits : true;
    },
  };
}

describe('chromeFor: when the stack is used', () => {
  const f = PLATE_FRAMING['paine']!;
  const face = FACE_BOXES['paine']!;
  const base = framePlate(f, 1280, 960);

  it('FFX-2 Paine at 1280x960, chapter 5: the two columns cannot be cleared, the stack can', () => {
    expect(clearsFace(frameFace(base, f, face, 1280, 960, PAINE_FLAT), face, 1280, 960, PAINE_FLAT)).toBe(false);
    const s = screen(PAINE_FLAT, PAINE_STACKED);
    const { blocks, flat } = chromeFor(base, f, face, 1280, 960, s.measure, s.stack);
    expect(blocks).toBe(PAINE_STACKED);
    expect(flat).toBe(PAINE_FLAT);
    expect(s.on).toBe(true);
    expect(clearsFace(frameFace(base, f, face, 1280, 960, blocks!), face, 1280, 960, blocks!)).toBe(true);
  });

  it('a plate the framing (or B) already clears keeps its two columns', () => {
    // The same mirrored chrome with IN THIS FIGHT narrow enough to clear her.
    const narrow = PAINE_FLAT.map((b, i) => (i === 1 ? { ...b, left: 760 } : b));
    const s = screen(narrow, PAINE_STACKED);
    expect(chromeFor(base, f, face, 1280, 960, s.measure, s.stack).blocks).toBe(narrow);
    expect(s.on).toBe(false);
    expect(s.log).toEqual([false]);
  });

  it('a plate option B slides (FFX Tidus at 1280x960, 8 px of air) is not a stack case', () => {
    const left = TIDUS_LEFT;
    const tf = PLATE_FRAMING['tidus']!;
    const tface = FACE_BOXES['tidus']!;
    const tbase = framePlate(tf, 1280, 960);
    const slid = frameFace(tbase, tf, tface, 1280, 960, left);
    expect(slid.slid).toBe(true);
    expect(coversFace(slid, tface, left)).toBe(false);
    const s = screen(left, left.slice(0, 1));
    expect(chromeFor(tbase, tf, tface, 1280, 960, s.measure, s.stack).blocks).toBe(left);
    expect(s.log).toEqual([false]);
  });

  it('a stack only the B slide could clear is not kept: option A and B never together (repair, 24 Sep 2026)', () => {
    // FFX Kimahri at 600x450 was stacked and then slid against the stack.
    const slidAgainstStack = { ...base, slid: true as const };
    expect(clearsFace(slidAgainstStack, face, 1280, 960, [])).toBe(false);
    // A face the two columns cover past any rescue, and a stacked column only
    // B's slide clears (FFX Tidus's chrome at 1280x960): the stack is refused.
    const tf = PLATE_FRAMING['tidus']!;
    const tface = FACE_BOXES['tidus']!;
    const tbase = framePlate(tf, 1280, 960);
    const wall: Rect[] = [{ left: 0, right: 1280, top: 0, bottom: 960 }];
    expect(coversFace(frameFace(tbase, tf, tface, 1280, 960, wall), tface, wall)).toBe(true);
    expect(frameFace(tbase, tf, tface, 1280, 960, TIDUS_LEFT).slid).toBe(true);
    const s = screen(wall, TIDUS_LEFT);
    expect(chromeFor(tbase, tf, tface, 1280, 960, s.measure, s.stack).blocks).toBe(wall);
    expect(s.on).toBe(false);
    expect(s.log).toEqual([false, true, false]);
  });

  it('a stack that does not fit, or does not clear either, puts the columns back as they were', () => {
    const noFit = screen(PAINE_FLAT, PAINE_STACKED, false);
    expect(chromeFor(base, f, face, 1280, 960, noFit.measure, noFit.stack).blocks).toBe(PAINE_FLAT);
    expect(noFit.on).toBe(false);

    const stillOnFace = PAINE_STACKED.map((b, i) => (i === 1 ? { ...b, left: 300 } : b));
    const noClear = screen(PAINE_FLAT, stillOnFace);
    expect(chromeFor(base, f, face, 1280, 960, noClear.measure, noClear.stack).blocks).toBe(PAINE_FLAT);
    expect(noClear.on).toBe(false);
  });

  it('with no member chrome up (a fixed tab, H, photo mode) the stack is left as it was', () => {
    const s = screen(null, null);
    expect(chromeFor(base, f, face, 1280, 960, s.measure, s.stack).blocks).toBeNull();
    expect(s.log).toEqual([]);
  });

  it('a portrait frame (the phone) and a plate with no face box never stack', () => {
    const phone = screen(PAINE_FLAT, PAINE_STACKED);
    chromeFor(framePlate(f, 390, 844), f, face, 390, 844, phone.measure, phone.stack);
    expect(phone.on).toBe(false);
    const chapter = screen(PAINE_FLAT, PAINE_STACKED);
    chromeFor(base, f, undefined, 1280, 960, chapter.measure, chapter.stack);
    expect(chapter.on).toBe(false);
  });

  it('with no switch it is the old path: the chrome as measured', () => {
    const s = screen(PAINE_FLAT, PAINE_STACKED);
    expect(chromeFor(base, f, face, 1280, 960, s.measure, undefined).blocks).toBe(PAINE_FLAT);
  });

  it('is a rule over the face boxes, not a name: the module never mentions a member', () => {
    const src = read('src', 'app', 'screens', 'pause', 'faceStack.ts').replace(/\/\*[\s\S]*?\*\//g, '');
    expect(src).not.toMatch(/paine|rikku|tidus|auron|yuna/i);
  });
});

describe('FaceFramer: a resize on a fixed tab after a stacked plate', () => {
  const f = PLATE_FRAMING['paine']!;
  const face = FACE_BOXES['paine']!;

  it('estimates from the two columns, not the stack, where the two columns would clear', () => {
    const framer = new FaceFramer();
    framer.frame('paine', framePlate(f, 1280, 960), f, 1280, 960, PAINE_STACKED, PAINE_FLAT);
    const base = framePlate(f, 1600, 900);
    const { box } = framer.frame('paine', base, f, 1600, 900, null);
    const est = estimateBlocks(PAINE_FLAT, 1280, 960, 1600, 900);
    expect(box).toEqual(frameFace(base, f, face, 1600, 900, est));
  });

  it('falls back to the stack where the two columns would cover the face', () => {
    const framer = new FaceFramer();
    framer.frame('paine', framePlate(f, 1280, 960), f, 1280, 960, PAINE_STACKED, PAINE_FLAT);
    const base = framePlate(f, 1280, 962);
    const { box } = framer.frame('paine', base, f, 1280, 962, null);
    const est = estimateBlocks(PAINE_STACKED, 1280, 960, 1280, 962);
    expect(clearsFace(box, face, 1280, 962, est)).toBe(true);
  });
});

/** A laid-out pause root with fixed boxes (jsdom has no layout). */
function pauseRoot(body: DOMRectInit, obj: DOMRectInit, tabs: DOMRectInit, frame: DOMRectInit = { x: 0, y: 0, width: 1280, height: 960 }) {
  const root = document.createElement('div');
  root.className = 'pause pause--mirror';
  root.innerHTML =
    '<nav data-role="tabs"></nav><div class="pause__body" data-role="body" data-tab="member:paine" style="top: 317px"></div><div data-role="obj"></div>';
  const rect = (r: DOMRectInit) => () => DOMRect.fromRect(r);
  root.getBoundingClientRect = rect(frame);
  root.querySelector<HTMLElement>('[data-role="body"]')!.getBoundingClientRect = rect(body);
  root.querySelector<HTMLElement>('[data-role="obj"]')!.getBoundingClientRect = rect(obj);
  root.querySelector<HTMLElement>('[data-role="tabs"]')!.getBoundingClientRect = rect(tabs);
  document.body.appendChild(root);
  return root;
}

describe('setStacked: the column rises only as far as it must', () => {
  it('raises a column that would run into the objective to just above it', () => {
    const root = pauseRoot({ x: 812, y: 317, width: 417, height: 468 }, { x: 675, y: 749, width: 554, height: 122 }, { x: 51, y: 58, width: 844, height: 42 });
    expect(setStacked(root, true)).toBe(true);
    expect(root.classList.contains('pause--stack')).toBe(true);
    const body = root.querySelector<HTMLElement>('[data-role="body"]')!;
    // 749 - 16 - 468 = 265: 52 px higher than 317.
    expect(parseFloat(body.style.getPropertyValue('--pu-stack-top'))).toBeCloseTo(317 - (317 - (749 - STACK_AIR - 468)), 1);
    expect(setStacked(root, false)).toBe(true);
    expect(root.classList.contains('pause--stack')).toBe(false);
    expect(body.style.getPropertyValue('--pu-stack-top')).toBe('');
    root.remove();
  });

  it('leaves a column that already clears the objective where it is', () => {
    const root = pauseRoot({ x: 812, y: 317, width: 417, height: 300 }, { x: 675, y: 749, width: 554, height: 122 }, { x: 51, y: 58, width: 844, height: 42 });
    expect(setStacked(root, true)).toBe(true);
    expect(root.querySelector<HTMLElement>('[data-role="body"]')!.style.getPropertyValue('--pu-stack-top')).toBe('');
    root.remove();
  });

  it('refuses a column that would have to rise into the tab strip, or leave the frame', () => {
    const tall = pauseRoot({ x: 812, y: 317, width: 417, height: 640 }, { x: 675, y: 749, width: 554, height: 122 }, { x: 51, y: 58, width: 844, height: 42 });
    expect(setStacked(tall, true)).toBe(false);
    tall.remove();
    const wide = pauseRoot({ x: 900, y: 317, width: 417, height: 300 }, { x: 675, y: 749, width: 554, height: 122 }, { x: 51, y: 58, width: 844, height: 42 });
    expect(setStacked(wide, true)).toBe(false);
    wide.remove();
  });
});

describe('setStacked: never under the phone stylesheet', () => {
  it('refuses the stack when the phone layout applies (a 600x450 landscape window too)', () => {
    const root = pauseRoot({ x: 312, y: 234, width: 270, height: 150 }, { x: 20, y: 369, width: 560, height: 60 }, { x: 20, y: 40, width: 560, height: 30 }, { x: 0, y: 0, width: 600, height: 450 });
    const mm = vi.fn((q: string) => ({ matches: q === PHONE_LAYOUT_QUERY }) as MediaQueryList);
    const had = window.matchMedia;
    window.matchMedia = mm;
    try {
      expect(setStacked(root, true)).toBe(false);
      expect(root.classList.contains('pause--stack')).toBe(false);
      expect(mm).toHaveBeenCalledWith(PHONE_LAYOUT_QUERY);
      expect(setStacked(root, false)).toBe(true);
    } finally {
      window.matchMedia = had;
      root.remove();
    }
  });

  it('matches the breakpoint pause-screen.css uses for the phone', () => {
    expect(read('src', 'ui', 'common', 'pause-screen.css')).toContain(`@media ${PHONE_LAYOUT_QUERY}`);
  });
});

describe('PortraitStage: a window resize re-frames before the next frame', () => {
  it('re-lays out on the window resize event, and stops after dispose', () => {
    const spy = vi.spyOn(PortraitStage.prototype, 'layout');
    const stage = new PortraitStage({ root: document.createElement('div'), reduceMotion: true });
    spy.mockClear();
    window.dispatchEvent(new Event('resize'));
    expect(spy).toHaveBeenCalledTimes(1);
    stage.dispose();
    window.dispatchEvent(new Event('resize'));
    expect(spy).toHaveBeenCalledTimes(1);
    spy.mockRestore();
  });
});

describe('the stylesheet', () => {
  const css = read('src', 'ui', 'common', 'pause-stack.css');
  it('stacks the member columns only, on either side', () => {
    expect(css).toMatch(/\.pause--stack \.pause__body\[data-tab\^='member:'\][^}]*flex-direction: column/);
    expect(css).toMatch(/\.pause--stack\.pause--mirror \.pause__body\[data-tab\^='member:'\][^}]*align-items: flex-end/);
    expect(css).toMatch(/top: var\(--pu-stack-top, var\(--pu-top-body\)\)/);
  });
  it('leaves pause-screen.css alone (past the 400-line house rule)', () => {
    expect(read('src', 'ui', 'common', 'pause-screen.css')).not.toContain('pause--stack');
  });
});
