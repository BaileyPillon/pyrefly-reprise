// @vitest-environment jsdom
/**
 * FOC43-01 (the focused review of build 7b2582e7, `critic/reviews/7b2582e7-focused/sections/01-textfloor.md`): on a FIRST launch the
 * party prep's hint strip (`.prep__hint`, 14 px since r43-textfloor) ran under the guided first run's step-2 slab. At 1280x720 on the
 * CHAPTER tab "SCROLL" wrapped to a second line half under the slab's top edge; on the Sphere Grid tab at 1440x900 and 1600x900 the
 * slab cut the strip at "ENTER BEGINS THE BATTL" and "ESC BA". Live (11 px strip) showed it whole beside the slab in the same states.
 *
 * The slab is placed by script from START BATTLE's box (`firstRunView.ts` `place`), so no rule on the prep can keep the strip clear of
 * it at every window size. The fix: while step 2's slab is on screen the strip is hidden whole (`first-run.css`), and no text is made
 * smaller. This file holds both halves of that to each other:
 *
 *  - the CSS half, read the way `r43-text-floor-css.test.ts` reads it: one top-level rule that only hides, keyed on the layer's
 *    `data-step='2'` under `#ui`; and the strip's own size still the floored one (14.1 px at the windows the floor is on);
 *  - the DOM half: the selector OUT OF THE REAL STYLESHEET, run against the real `FirstRunLayer` and the real guide loop in jsdom
 *    (which evaluates `:has()`): it matches the strip while step 2 is on screen, and at no other time (step 1, step 3, hidden, the
 *    guide skipped or ended), so the strip is back by itself.
 *
 * Game case: both. The prep screen, its hint strip and the guide's steps 1 and 2 are shared by FFX and FFX-2.
 */

import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { resetCoach } from '../../src/ui/coach/coachState.ts';
import { armFirstRunGuide, firstRunActive, skipFirstRun, stopFirstRun } from '../../src/ui/coach/firstRunGuide.ts';
import { FirstRunLayer, STEP_BATTLE, STEP_BOARD, STEP_PREP } from '../../src/ui/coach/firstRunView.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const read = (rel: string): string => readFileSync(join(ROOT, rel), 'utf8');

// ----------------------------------------------------------------------------- a small CSS reader (the one in r43-text-floor-css.test.ts)

interface Rule {
  /** The selector text, comments stripped, whitespace squeezed. */
  sel: string;
  /** The at-rules it sits in, outermost first, joined with " | " ("" at the top level). */
  at: string;
  body: string;
}

/** The leaf rule blocks of a sheet, with the at-rule each sits in. Handles comments, strings and nested at-rules. */
function leafRules(css: string): Rule[] {
  const out: Rule[] = [];
  const stack: { open: number; head: string; hasChild: boolean }[] = [];
  let headStart = 0;
  for (let i = 0; i < css.length; i++) {
    const c = css[i]!;
    if (c === '/' && css[i + 1] === '*') {
      const end = css.indexOf('*/', i + 2);
      i = end < 0 ? css.length : end + 1;
      continue;
    }
    if (c === '"' || c === "'") {
      i++;
      while (i < css.length && css[i] !== c) i += css[i] === '\\' ? 2 : 1;
      continue;
    }
    if (c === '{') {
      const head = css.slice(headStart, i).replace(/\/\*[\s\S]*?\*\//g, '').trim().replace(/\s+/g, ' ');
      if (stack.length > 0) stack[stack.length - 1]!.hasChild = true;
      stack.push({ open: i, head, hasChild: false });
      headStart = i + 1;
    } else if (c === '}') {
      const top = stack.pop();
      if (top && !top.hasChild) out.push({ sel: top.head, at: stack.map((s) => s.head).join(' | '), body: css.slice(top.open + 1, i) });
      headStart = i + 1;
    } else if (c === ';' && stack.length === 0) {
      headStart = i + 1;
    }
  }
  return out;
}

/** `{ prop: value }` for a rule body's declarations (comments out first: a comment may quote a declaration). */
const declarations = (body: string): Record<string, string> =>
  Object.fromEntries([...body.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/([a-z-]+)\s*:\s*([^;]+);/g)].map((m) => [m[1]!, m[2]!.trim()]));

/** A selector that names the prep's hint strip itself: not `.ig-prep__hint` (the inkgold mock's) and not `.prep__hint-act` (its buttons). */
const NAMES_HINT = /\.prep__hint(?![-\w])/;

/** Every stylesheet under `src/ui`, read. */
function allSheets(): Array<{ file: string; rules: Rule[] }> {
  return readdirSync(join(ROOT, 'src/ui'), { recursive: true })
    .map((f) => String(f).replace(/\\/g, '/'))
    .filter((f) => f.endsWith('.css'))
    .map((f) => ({ file: `src/ui/${f}`, rules: leafRules(read(`src/ui/${f}`)) }));
}

// ----------------------------------------------------------------------------- the CSS half

describe('first-run.css hides the prep hint strip while step 2 is on screen (FOC43-01)', () => {
  const rules = leafRules(read('src/ui/coach/first-run.css')).filter((r) => NAMES_HINT.test(r.sel));

  it('is one top-level rule that only sets visibility: hidden (every window size; no size, place or text change)', () => {
    expect(rules).toHaveLength(1);
    expect(rules[0]!.at).toBe(''); // not inside a media query: the strip is on screen at every size the slab is
    expect(declarations(rules[0]!.body)).toEqual({ visibility: 'hidden' });
  });

  it("keys on the guide layer's step 2 (the party prep's), under the #ui both are mounted in", () => {
    expect(STEP_PREP.n).toBe(2);
    expect(rules[0]!.sel).toBe("#ui:has(> .frg[data-step='2']) .prep__hint");
  });

  it('is the only sheet that names the strip with a rule that hides it (the phone sheets hide it by display: none, a wholly different state)', () => {
    const hiding = allSheets().flatMap(({ file, rules: rs }) =>
      rs.filter((r) => NAMES_HINT.test(r.sel) && declarations(r.body)['visibility'] !== undefined).map(() => file),
    );
    expect(hiding).toEqual(['src/ui/coach/first-run.css']);
  });
});

describe('the strip is hidden, never shrunk: its type keeps the 14 px floor at every window the floor is on', () => {
  /** `LetterboxStage.ts`'s own formula (what the stage publishes as `--lb-scale`). */
  const stageScale = (w: number, h: number): number => Math.min(w / 640, h / 360);
  const FLOOR_PX = 14.1;
  const WINDOWS: ReadonlyArray<readonly [string, number, number]> = [
    ['1280x720', 1280, 720],
    ['1440x900', 1440, 900],
    ['1600x900', 1600, 900],
    ['2000x1012', 2000, 1012],
    ['2560x1080', 2560, 1080],
    ['3840x2160', 3840, 2160],
  ];

  /** Every font-size any sheet gives the strip. */
  const sized = allSheets().flatMap(({ file, rules: rs }) =>
    rs.filter((r) => NAMES_HINT.test(r.sel) && declarations(r.body)['font-size'] !== undefined).map((r) => ({ file, sel: r.sel, value: declarations(r.body)['font-size']! })),
  );

  it('is sized by one rule, in the prep sheet, as `max(its grid size, var(--stage-floor, 0px))`', () => {
    expect(sized.map((s) => `${s.file} ${s.sel}`)).toEqual(['src/ui/common/party-prep.css .prep__hint']);
    expect(sized[0]!.value).toMatch(/^max\(\s*[\d.]+px\s*,\s*var\(--stage-floor,\s*0px\)\s*\)$/);
  });

  for (const [label, w, h] of WINDOWS) {
    it(`renders at 14 px or more at ${label}`, () => {
      const scale = stageScale(w, h);
      const m = /^max\(\s*([\d.]+)px\s*,\s*var\(--stage-floor,\s*0px\)\s*\)$/.exec(sized[0]!.value)!;
      // --stage-floor is 14.1 px read back into grid px, from a 1280x720 window up (`stage-floor.css`; its own test pins that).
      const grid = Math.max(Number(m[1]), FLOOR_PX / scale);
      expect(grid * scale).toBeGreaterThanOrEqual(14.05);
    });
  }
});

// ----------------------------------------------------------------------------- the DOM half

/** The selector the stylesheet really uses, so the DOM checks below cannot drift from it. */
const HIDING_SELECTOR = leafRules(read('src/ui/coach/first-run.css')).find((r) => NAMES_HINT.test(r.sel))!.sel;

const BOX = { left: 640, top: 600, width: 307, height: 61 };

/** The page's shape: `#ui` holds the screen's root (with the strip) and, as `App` mounts it, the guide's layer. */
function mountPage(): { ui: HTMLElement; hint: HTMLElement } {
  document.body.innerHTML =
    '<div id="ui"><div class="screen"><div class="prep"><div class="prep__hint">ENTER BEGINS THE BATTLE</div></div></div></div>';
  return { ui: document.getElementById('ui')!, hint: document.querySelector<HTMLElement>('.prep__hint')! };
}
const hiddenStrip = (): Element | null => document.querySelector(HIDING_SELECTOR);

describe('the stylesheet\'s own selector, against the real FirstRunLayer', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('matches the strip while step 2 is drawn, and at no other time', () => {
    const { ui, hint } = mountPage();
    const layer = new FirstRunLayer(() => undefined);
    ui.appendChild(layer.el);

    expect(layer.el.dataset['step']).toBeUndefined(); // built hidden
    expect(hiddenStrip()).toBeNull();

    layer.draw(STEP_BOARD, BOX);
    expect(layer.el.dataset['step']).toBe('1');
    expect(hiddenStrip()).toBeNull(); // the board has no strip, and step 1 never hides one

    layer.draw(STEP_PREP, BOX);
    expect(layer.el.dataset['step']).toBe('2');
    expect(hiddenStrip()).toBe(hint);

    layer.draw(STEP_PREP, BOX); // drawn again every frame: still one step
    expect(hiddenStrip()).toBe(hint);

    layer.hide();
    expect(layer.step).toBe(0);
    expect(layer.el.dataset['step']).toBeUndefined();
    expect(hiddenStrip()).toBeNull(); // nothing is up: the strip is whole again

    layer.draw(STEP_PREP, BOX); // the same step again after a hide: the mark comes back with it
    expect(layer.el.dataset['step']).toBe('2');
    expect(hiddenStrip()).toBe(hint);

    layer.draw(STEP_BATTLE, BOX, 0, 40);
    expect(layer.el.dataset['step']).toBe('3');
    expect(hiddenStrip()).toBeNull();

    layer.draw(STEP_PREP, BOX);
    layer.el.remove(); // the guide ended: the layer is gone
    expect(hiddenStrip()).toBeNull();
  });

  it('does not touch the strip itself: no inline style, no class, its text and its place are as they were', () => {
    const { ui, hint } = mountPage();
    const layer = new FirstRunLayer(() => undefined);
    ui.appendChild(layer.el);
    layer.draw(STEP_PREP, BOX);
    expect(hiddenStrip()).toBe(hint);
    expect(hint.getAttribute('style')).toBeNull();
    expect(hint.className).toBe('prep__hint');
    expect(hint.textContent).toBe('ENTER BEGINS THE BATTLE');
  });
});

describe('the stylesheet\'s own selector, through the real guide loop (a first launch on the party prep)', () => {
  let absorbed = 0;

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame'] });
    resetCoach();
    stopFirstRun();
    absorbed = 0;
  });
  afterEach(() => {
    stopFirstRun();
    document.body.innerHTML = '';
    vi.useRealTimers();
  });

  /** The prep as the screen draws it, START BATTLE given a rect (jsdom has no layout) so the guide treats it as on screen. */
  function mountPrep(): { ui: HTMLElement; hint: HTMLElement; start: HTMLElement } {
    const { ui, hint } = mountPage();
    const start = document.createElement('div');
    start.className = 'prep__start';
    start.style.opacity = '1';
    start.getBoundingClientRect = () => ({ ...BOX, right: BOX.left + BOX.width, bottom: BOX.top + BOX.height, x: BOX.left, y: BOX.top, toJSON: () => ({}) });
    ui.querySelector('.prep')!.appendChild(start);
    return { ui, hint, start };
  }
  const frames = (n = 2): void => void vi.advanceTimersByTime(17 * n);

  it('hides the strip while "Your party is ready." is up, shows it again when the slab goes, and for good once the guide is skipped', () => {
    const { ui, hint, start } = mountPrep();
    armFirstRunGuide({ root: ui, absorbInput: () => void (absorbed += 1) });
    expect(firstRunActive()).toBe(true);
    frames();

    const layer = ui.querySelector<HTMLElement>('.frg')!;
    expect(layer.dataset['step']).toBe('2');
    expect(layer.querySelector('.frg__quote')!.textContent).toBe('“Your party is ready.”');
    expect(hiddenStrip()).toBe(hint);

    // START BATTLE leaves the screen (a transition): the guide has nothing to point at and takes its layer down, and the strip is whole.
    start.remove();
    frames();
    expect(layer.style.display).toBe('none');
    expect(hiddenStrip()).toBeNull();

    // It comes back: the slab and the hidden strip with it.
    ui.querySelector('.prep')!.appendChild(start);
    frames();
    expect(layer.dataset['step']).toBe('2');
    expect(hiddenStrip()).toBe(hint);

    // The player skips the guide (Esc or the skip words): the layer is removed and the strip is back for good.
    skipFirstRun();
    expect(absorbed).toBe(1);
    expect(ui.querySelector('.frg')).toBeNull();
    expect(hiddenStrip()).toBeNull();
    frames(4);
    expect(hiddenStrip()).toBeNull();
  });
});
