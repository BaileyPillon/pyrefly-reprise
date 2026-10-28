/**
 * MF-18, the cut-side anchor (lane pc-scope, 2026-10-28; `motion/CutAnchor.ts`; both games): a plane cut whose two heads are more than 0.12 of the figure's height apart draws the INCOMING plane back toward the old
 * head, so the step at the cut is 0.12 of the height, and lets it glide home on an ease-out. The pure parts here: the word, the plan, the glide's curve and its per-plane bookkeeping. The director that uses
 * them is in `pc-scope-cut-anchor-director.test.ts`, the real actor in `engine/pc-scope-cut-anchor-actor.test.ts`. `?cutanchor=today` (the default) is release 67's cut exactly.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CHAPTER_IDS, getChapter } from '../../src/data/encounters.ts';
import {
  ANCHOR_CAP,
  CUT_ANCHOR_DEFAULT,
  CutGlide,
  GLIDE_CAP_MS,
  GLIDE_FRAMES_MIN,
  GLIDE_MS_MAX,
  GLIDE_MS_MIN,
  anchorPlan,
  cutAnchorFor,
  cutAnchorFromSearch,
  cutAnchorGame,
  cutAnchorMode,
  cutAnchorWord,
  glideOffset,
  setCutAnchorMode,
} from '../../src/engine/motion/CutAnchor.ts';
import { setDemoChapter } from '../../src/engine/motion/DemoGate.ts';
import { BIG_ANCHOR, MIN_SPEED } from '../../src/engine/motion/SmearPlan.ts';

afterEach(() => {
  vi.unstubAllGlobals();
  setCutAnchorMode(null);
  setDemoChapter(undefined);
});

describe('the word', () => {
  it('is today with no word since the default is today in BOTH games (release 67\'s cut), and with the pack off whatever the word', () => {
    expect(CUT_ANCHOR_DEFAULT).toEqual({ ffx: 'today', ffx2: 'today' });
    expect(cutAnchorFromSearch('')).toBe('today');
    expect(cutAnchorFromSearch('', 'ffx2')).toBe('today');
    expect(cutAnchorFromSearch('?cutanchor=banana')).toBe('today');
    expect(cutAnchorFromSearch('?pack=off&cutanchor=on')).toBe('today');
    expect(cutAnchorFromSearch('?pack=off&cutanchor=on', 'ffx2')).toBe('today');
    expect(cutAnchorFromSearch(undefined)).toBe('today');
    expect(cutAnchorWord('')).toBeNull(); // no word named: the game's default applies
    expect(cutAnchorWord('?pack=off&cutanchor=on')).toBe('today');
  });

  it('the default is one word PER GAME (rule 14: the evidence is FFX\'s), a word in the address names both, and the running chapter picks the game', () => {
    expect(Object.isFrozen(CUT_ANCHOR_DEFAULT)).toBe(true);
    expect(Object.keys(CUT_ANCHOR_DEFAULT).sort()).toEqual(['ffx', 'ffx2']);
    expect(cutAnchorGame('seymour-flux')).toBe('ffx');
    expect(cutAnchorGame('ffx2-bahamut')).toBe('ffx2');
    expect(cutAnchorGame(undefined)).toBe('ffx');
    // every listed chapter: the id rule agrees with the chapter's own game (src/data/encounters.ts)
    for (const id of CHAPTER_IDS) expect(cutAnchorGame(id), id).toBe(getChapter(id)!.game);
    // a page with the pack on (the default on a desktop) and no word: the mode in force is the table's word for the running chapter's game
    vi.stubGlobal('location', { search: '' });
    setCutAnchorMode(null);
    setDemoChapter('ffx2-trema');
    expect(cutAnchorMode()).toBe(CUT_ANCHOR_DEFAULT.ffx2);
    setDemoChapter('yunalesca');
    expect(cutAnchorMode()).toBe(CUT_ANCHOR_DEFAULT.ffx);
    // a forced mode names both games, and null reads the address again
    setCutAnchorMode('on');
    expect(cutAnchorMode()).toBe('on');
    setDemoChapter('ffx2-trema');
    expect(cutAnchorMode()).toBe('on');
    setCutAnchorMode(null);
    expect(cutAnchorMode()).toBe(CUT_ANCHOR_DEFAULT.ffx2);
    // the address names a word: it applies in both games, and a pack-off page is today whatever it says
    vi.stubGlobal('location', { search: '?cutanchor=moving' });
    setCutAnchorMode(null);
    expect(cutAnchorMode()).toBe('moving');
    setDemoChapter('seymour-flux');
    expect(cutAnchorMode()).toBe('moving');
    vi.stubGlobal('location', { search: '?pack=off&cutanchor=moving' });
    setCutAnchorMode(null);
    expect(cutAnchorMode()).toBe('today');
  });

  it('?cutanchor=on and =moving name their modes (the key is lower case, the value is not case sensitive)', () => {
    expect(cutAnchorFromSearch('?cutanchor=on')).toBe('on');
    expect(cutAnchorFromSearch('?cutanchor=MOVING')).toBe('moving');
    expect(cutAnchorFromSearch('?cutanchor=today')).toBe('today');
    expect(cutAnchorFromSearch('?pack=demo&cutanchor=on')).toBe('on');
  });

  it('on anchors every cut; moving only a cut made on a figure that travels; today none', () => {
    expect(cutAnchorFor(0, 'on')).toBe(true);
    expect(cutAnchorFor(0, 'moving')).toBe(false);
    expect(cutAnchorFor(MIN_SPEED, 'moving')).toBe(true);
    expect(cutAnchorFor(5, 'today')).toBe(false);
  });
});

describe('the plan', () => {
  it('the cap is the planner\'s own line for heads far apart, so a cut is never left with far-apart heads', () => {
    expect(ANCHOR_CAP).toBe(BIG_ANCHOR);
    expect(ANCHOR_CAP).toBe(0.12);
  });

  it('a step at or under the cap, or an unknown one, has no plan', () => {
    expect(anchorPlan({ dx: 0.12 * 1.8, height: 1.8, frameMs: 16.7 })).toBeNull();
    expect(anchorPlan({ dx: -0.1 * 1.8, height: 1.8, frameMs: 16.7 })).toBeNull();
    expect(anchorPlan({ dx: null, height: 1.8, frameMs: 16.7 })).toBeNull();
    expect(anchorPlan({ dx: Number.NaN, height: 1.8, frameMs: 16.7 })).toBeNull();
    expect(anchorPlan({ dx: 1, height: 0, frameMs: 16.7 })).toBeNull();
  });

  it('draws the incoming plane back toward the old head so that exactly the cap is left, either way', () => {
    const right = anchorPlan({ dx: 0.44 * 1.8, height: 1.8, frameMs: 16.7 })!; // Yunalesca attack to cast: 0.44 of her height
    expect(right.shift).toBeCloseTo(-(0.44 - 0.12) * 1.8, 9);
    expect(right.share).toBeCloseTo(0.32, 9);
    const left = anchorPlan({ dx: -0.3 * 1.8, height: 1.8, frameMs: 16.7 })!;
    expect(left.shift).toBeCloseTo(0.18 * 1.8, 9);
    // the step left at the cut (new head plus shift against the old head) is the cap, whichever side it is on
    expect(Math.abs(0.44 * 1.8 + right.shift)).toBeCloseTo(0.12 * 1.8, 9);
    expect(Math.abs(-0.3 * 1.8 + left.shift)).toBeCloseTo(0.12 * 1.8, 9);
  });

  it('the glide is 80 ms for a small step and 150 ms for 0.44 of the height, and never fewer than four frames of the display running (a 30 fps display gets 133 ms), nor over 200 ms', () => {
    expect(anchorPlan({ dx: 0.13 * 1.8, height: 1.8, frameMs: 16.7 })!.ms).toBe(GLIDE_MS_MIN + 4); // 0.01 of the height over: 80 + 70 * 0.05
    expect(anchorPlan({ dx: 0.44 * 1.8, height: 1.8, frameMs: 16.7 })!.ms).toBe(GLIDE_MS_MAX);
    expect(anchorPlan({ dx: 0.9 * 1.8, height: 1.8, frameMs: 16.7 })!.ms).toBe(GLIDE_MS_MAX);
    expect(anchorPlan({ dx: 0.2 * 1.8, height: 1.8, frameMs: 33.3 })!.ms).toBe(Math.round(GLIDE_FRAMES_MIN * 33.3));
    expect(anchorPlan({ dx: 0.2 * 1.8, height: 1.8, frameMs: 100 })!.ms).toBe(GLIDE_CAP_MS);
  });
});

describe('the glide\'s curve', () => {
  it('holds the whole shift until the cut, then eases out: the first step is the biggest and each is smaller, ending at exactly 0', () => {
    const shift = -0.5;
    expect(glideOffset(shift, 100, 12, 0)).toBe(shift);
    expect(glideOffset(shift, 100, 12, 12)).toBe(shift);
    let prev = shift;
    let prevStep = Infinity;
    for (let t = 12 + 100 / 6; t < 112; t += 100 / 6) {
      const o = glideOffset(shift, 100, 12, t);
      const step = Math.abs(o - prev);
      expect(step).toBeLessThan(prevStep);
      expect(Math.abs(o)).toBeLessThan(Math.abs(prev));
      prev = o;
      prevStep = step;
    }
    expect(glideOffset(shift, 100, 12, 112)).toBe(0);
    expect(glideOffset(shift, 100, 12, 5000)).toBe(0);
  });

  it('the first step is twice the average one (ease-out of exponent 2): 2 / frames of the shift', () => {
    const shift = 1;
    const frames = 6;
    const first = shift - glideOffset(shift, 100, 0, 100 / frames);
    expect(first).toBeCloseTo((2 * frames - 1) / (frames * frames), 9);
  });
});

describe('the glide runs on real time, so it is the same at 60, 120 and 144 Hz', () => {
  const plan = { shift: -0.4, ms: 120, share: 0.25 };
  const timeline = (hz: number): { endMs: number; at100: number } => {
    const g = new CutGlide();
    g.begin(1, 'cast', plan, 17);
    const step = 1000 / hz;
    let t = 0;
    let at100 = Number.NaN;
    let last = plan.shift;
    for (let i = 0; i < 400 && g.active; i++) {
      g.advance(step, () => 'cast', (_p, o) => (last = o));
      t += step;
      if (Number.isNaN(at100) && t >= 100) at100 = last;
    }
    return { endMs: t, at100 };
  };

  it('ends within two frames of hold + glide whatever the display (the glide runs from the cut FRAME, the first frame past the hold), and is at the same place 100 ms in (within a frame of motion)', () => {
    const end = 17 + 120;
    for (const hz of [30, 60, 120, 144]) {
      const r = timeline(hz);
      expect(r.endMs, `${hz} Hz`).toBeGreaterThanOrEqual(end);
      expect(r.endMs, `${hz} Hz`).toBeLessThanOrEqual(end + 2 * (1000 / hz) + 1e-6);
    }
    const a = timeline(60).at100;
    const b = timeline(144).at100;
    expect(Math.abs(a - b)).toBeLessThan(0.4 * 0.16); // a 60 Hz frame at the end of the curve moves the plane well under 0.16 of its shift
  });
});

describe('the cut frame carries the whole shift at any frame rate (review m-6)', () => {
  const plan = { shift: -0.4, ms: 120, share: 0.25 };

  it('the first frame past the hold is drawn with the whole shift (nothing is written), and the glide runs from the frame after', () => {
    for (const hz of [30, 60, 120, 144, 240]) {
      const step = 1000 / hz;
      const hold = 17; // the cut sits 17 ms into the window
      const g = new CutGlide();
      g.begin(1, 'cast', plan, hold);
      const writes: number[] = [];
      let t = 0;
      let cutFrame = -1;
      for (let i = 0; i < 400 && g.active; i++) {
        g.advance(step, () => 'cast', (_p, o) => writes.push(o));
        t += step;
        if (cutFrame < 0 && t > hold) {
          cutFrame = i;
          // the cut frame: whole shift on the plane, no write yet (it is already there)
          expect(g.offsetOf(1), `${hz} Hz`).toBe(plan.shift);
          expect(writes, `${hz} Hz`).toEqual([]);
        }
      }
      expect(cutFrame, `${hz} Hz`).toBeGreaterThanOrEqual(0);
      expect(writes.length, `${hz} Hz`).toBeGreaterThan(0);
      expect(Math.abs(writes[0]!), `${hz} Hz`).toBeLessThan(Math.abs(plan.shift));
      expect(writes.at(-1)).toBe(0);
    }
  });
});

describe('CutGlide: one record per plane', () => {
  const plan = { shift: -0.5, ms: 100, share: 0.3 };

  it('writes each new offset once, 0 on the frame the glide ends, and then is idle', () => {
    const g = new CutGlide();
    expect(g.active).toBe(false);
    expect(g.begin(1, 'cast', plan, 10)).toBe(-0.5);
    expect(g.active).toBe(true);
    const writes: Array<[number, number]> = [];
    const poseOf = (i: 0 | 1): string => (i === 1 ? 'cast' : 'idle');
    for (let t = 0; t < 400; t += 1000 / 60) g.advance(1000 / 60, poseOf, (i, o) => writes.push([i, o]));
    expect(g.active).toBe(false);
    expect(writes.length).toBeGreaterThan(4);
    expect(writes.every(([i]) => i === 1)).toBe(true);
    expect(writes.at(-1)).toEqual([1, 0]);
    expect(writes.slice(0, -1).every(([, o]) => o < 0)).toBe(true); // never overshoots
    for (let k = 1; k < writes.length; k++) expect(Math.abs(writes[k]![1])).toBeLessThan(Math.abs(writes[k - 1]![1]));
  });

  it('the hold writes nothing; a plane given another painting loses its glide with no write (the actor reset its drift)', () => {
    const g = new CutGlide();
    g.begin(0, 'attack', plan, 50);
    const writes: number[] = [];
    g.advance(40, () => 'attack', (_i, o) => writes.push(o));
    expect(writes).toEqual([]);
    g.advance(20, () => 'idle', (_i, o) => writes.push(o));
    expect(writes).toEqual([]);
    expect(g.active).toBe(false);
    expect(g.offsetOf(0)).toBe(0);
  });

  it('forget drops a plane\'s record; the other plane\'s glide keeps going', () => {
    const g = new CutGlide();
    g.begin(0, 'a', plan, 0);
    g.begin(1, 'b', { ...plan, shift: 0.4 }, 0);
    g.forget(0);
    expect(g.offsetOf(0)).toBe(0);
    expect(g.offsetOf(1)).toBe(0.4);
    const writes: Array<[number, number]> = [];
    g.advance(30, (i) => (i === 0 ? 'a' : 'b'), (i, o) => writes.push([i, o])); // the cut frame: the whole shift, nothing to write yet
    g.advance(30, (i) => (i === 0 ? 'a' : 'b'), (i, o) => writes.push([i, o]));
    expect(writes).toHaveLength(1);
    expect(writes[0]![0]).toBe(1);
  });
});
