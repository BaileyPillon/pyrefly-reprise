// @vitest-environment jsdom
/**
 * FOC44A-01 (the focused review of build 7758791e, `critic/reviews/7758791e-focused/`): on a FIRST launch on a 390x844 touch phone, the guided first run's step-2 chevron was drawn over the
 * phone prep page's MORE BELOW cue and hid its middle letters, on every page that scrolls (FFX Items, FFX-2 Stats, ...) and on the CHAPTER page (the older layout, which PREP-A did not touch).
 *
 * On a phone the slab stands above START BATTLE and its DOWN chevron is drawn 40 px above the button (`firstRunView.ts` `place`); the cue is a fixed strip 84 px up from the bottom of the screen
 * (`party-prep-phone-tabs.css`, `party-prep-phone.css`). The fix is the one FOC43-01 made for the hint strip (`r44a-prep-hint-first-run.test.ts`): while step 2's slab is on screen the cue is hidden
 * whole (`first-run.css`), and nothing else changes. This file holds the parts of that to each other, the way that file does:
 *
 *  - the NUMBERS half: the collision is real in the stylesheets' own numbers and `place()`'s, so the rule is needed (take it away and the chevron is on the cue again);
 *  - the CSS half: one top-level rule that only hides, keyed on the guide layer's `data-step='2'` under `#ui`; no other sheet hides the cue by `visibility`;
 *  - the DOM half: that selector OUT OF THE REAL STYLESHEET, run in jsdom against the real `FirstRunLayer` and the real guide loop: it matches the cue while step 2 is on screen, on the CHAPTER
 *    page and on the stacked pages alike, and at no other time (step 1, step 3, hidden, the guide skipped or ended), so the cue is back by itself; and the real sheet, loaded, makes the cue
 *    and its words `visibility: hidden` only then.
 *
 * Game case: both. The phone prep pages, their cue and the guide's step 2 are shared by FFX and FFX-2.
 */

import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { resetCoach } from '../../src/ui/coach/coachState.ts';
import { armFirstRunGuide, firstRunActive, skipFirstRun, stopFirstRun } from '../../src/ui/coach/firstRunGuide.ts';
import { FirstRunLayer, STEP_BATTLE, STEP_BOARD, STEP_PREP, place } from '../../src/ui/coach/firstRunView.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const read = (rel: string): string => readFileSync(join(ROOT, rel), 'utf8');

// ----------------------------------------------------------------------------- a small CSS reader (the one in r44a-prep-hint-first-run.test.ts)

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

/** A selector that names the phone prep's MORE BELOW cue itself: not a longer class that begins with its name. */
const NAMES_CUE = /\.prep__phone-cue(?![-\w])/;

/** Every stylesheet under `src/ui`, read. */
function allSheets(): Array<{ file: string; rules: Rule[] }> {
  return readdirSync(join(ROOT, 'src/ui'), { recursive: true })
    .map((f) => String(f).replace(/\\/g, '/'))
    .filter((f) => f.endsWith('.css'))
    .map((f) => ({ file: `src/ui/${f}`, rules: leafRules(read(`src/ui/${f}`)) }));
}

const FIRST_RUN_CSS = read('src/ui/coach/first-run.css');
const RULES = leafRules(FIRST_RUN_CSS).filter((r) => NAMES_CUE.test(r.sel));
const HIDING_SELECTOR = RULES[0]?.sel ?? '';

// ----------------------------------------------------------------------------- the numbers half

describe('the collision is in the stylesheets\' own numbers (so the rule is needed)', () => {
  /** The px a declaration gives, in the first rule of `sheet` whose selector matches `sel` and which declares `prop`. */
  const px = (sheet: string, sel: RegExp, prop: string): number => {
    const r = allSheets().find((s) => s.file === sheet)!.rules.find((x) => sel.test(x.sel) && declarations(x.body)[prop] !== undefined)!;
    return Number.parseFloat(declarations(r.body)[prop]!);
  };
  const CUE_FROM_BOTTOM = px('src/ui/common/party-prep-phone-tabs.css', /\.prep__phone-cue$/, 'bottom');
  const START_FROM_BOTTOM = px('src/ui/common/party-prep-phone-tabs.css', /\.prep__start$/, 'bottom');
  const START_PAD = px('src/ui/common/party-prep-phone-tabs.css', /\.prep__start$/, 'font-size');

  it('reads 84 px for the cue and 16 px for START BATTLE, off the sheet', () => {
    expect(CUE_FROM_BOTTOM).toBe(84);
    expect(START_FROM_BOTTOM).toBe(16);
    expect(START_PAD).toBe(14);
  });

  it('puts step 2\'s down chevron over the cue on a 390x844 phone: the two bands share rows and the chevron stands in the cue\'s middle', () => {
    const vw = 390;
    const vh = 844;
    const startH = 14 * 1.2 + 28; // font 14 px at a normal line height, 14 px of padding above and below
    const start = { left: 12, top: vh - START_FROM_BOTTOM - startH, width: vw - 24, height: startH };
    const p = place(2, start, 120, vw, vh, true);
    expect(p.chev.dir).toBe('down');
    const chev = { top: p.chev.top, bottom: p.chev.top + 22, left: p.chev.left, right: p.chev.left + 36 }; // the .frg__chev[data-dir='down'] triangle: 22 px tall, 36 wide
    const cueH = 14 * 1.2 + 12 + 2; // the span: font 14 px, 6 px of padding above and below, a 1 px border
    const cue = { bottom: vh - CUE_FROM_BOTTOM, top: vh - CUE_FROM_BOTTOM - cueH };
    expect(Math.min(chev.bottom, cue.bottom) - Math.max(chev.top, cue.top), 'rows shared').toBeGreaterThan(10);
    // the cue is centred and about 160 px wide ("▼ MORE BELOW" at 14 px with 0.2em tracking, 12 px of padding each side); the chevron stands in the middle of the screen, on the middle letters
    expect(chev.left).toBeGreaterThan(vw / 2 - 40);
    expect(chev.right).toBeLessThan(vw / 2 + 40);
  });
});

// ----------------------------------------------------------------------------- the CSS half

describe('first-run.css hides the phone prep\'s MORE BELOW cue while step 2 is on screen (FOC44A-01)', () => {
  it('is one top-level rule that only sets visibility: hidden (every window size; no size, place or text change)', () => {
    expect(RULES).toHaveLength(1);
    expect(RULES[0]!.at).toBe(''); // not inside a media query: the cue is on screen at every size the chevron is
    expect(declarations(RULES[0]!.body)).toEqual({ visibility: 'hidden' });
  });

  it('keys on the guide layer\'s step 2 (the party prep\'s), under the #ui both are mounted in, as the hint strip\'s rule does', () => {
    expect(STEP_PREP.n).toBe(2);
    expect(HIDING_SELECTOR).toBe("#ui:has(> .frg[data-step='2']) .prep__phone-cue");
    const hint = leafRules(FIRST_RUN_CSS).find((r) => /\.prep__hint(?![-\w])/.test(r.sel))!;
    expect(hint.sel.replace('.prep__hint', '.prep__phone-cue')).toBe(HIDING_SELECTOR);
  });

  it('is the only sheet that names the cue with a visibility rule (the pages show and hide it by opacity and display)', () => {
    const hiding = allSheets().flatMap(({ file, rules }) => rules.filter((r) => NAMES_CUE.test(r.sel) && declarations(r.body)['visibility'] !== undefined).map(() => file));
    expect(hiding).toEqual(['src/ui/coach/first-run.css']);
  });

  it('is not a rule the cue\'s own sheets can outrank: no other rule gives the cue a visibility, an !important, or a selector with an id', () => {
    for (const { file, rules } of allSheets()) {
      if (file === 'src/ui/coach/first-run.css') continue;
      for (const r of rules.filter((x) => NAMES_CUE.test(x.sel))) {
        expect(declarations(r.body)['visibility'], `${file} ${r.sel}`).toBeUndefined();
        expect(r.sel, `${file}: an id would outrank the hiding rule`).not.toMatch(/#/);
      }
    }
  });
});

// ----------------------------------------------------------------------------- the DOM half

const hiddenCue = (): Element | null => document.querySelector(HIDING_SELECTOR);
const BOX = { left: 12, top: 782, width: 366, height: 46 };

// A 390x844 touch phone (the review's): the guide takes its phone layout (`phoneLayout`, 900 px and under) and START BATTLE's box is on screen.
beforeEach(() => {
  vi.stubGlobal('innerWidth', 390);
  vi.stubGlobal('innerHeight', 844);
});
afterEach(() => vi.unstubAllGlobals());

/** The prep as the screen mounts it on a phone: `#ui` holds the screen's root, the stage inside it holds the cue (`installPhonePrep`), and the guide's layer is `#ui`'s own child. */
function mountPhonePrep(tab: 'chapter' | 'page'): { ui: HTMLElement; cue: HTMLElement; word: HTMLElement } {
  const attrs = tab === 'chapter' ? `data-tab="chapter"` : `data-tab="items" data-phone="page"`;
  document.body.innerHTML =
    `<div id="ui"><div class="screen"><div class="prep" ${attrs}><div class="prep__stage"><div class="prep__phone-cue is-visible" aria-hidden="true"><span>&#9660; MORE BELOW</span></div></div></div></div></div>`;
  return { ui: document.getElementById('ui')!, cue: document.querySelector<HTMLElement>('.prep__phone-cue')!, word: document.querySelector<HTMLElement>('.prep__phone-cue > span')! };
}

describe('the stylesheet\'s own selector, against the real FirstRunLayer', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  for (const tab of ['chapter', 'page'] as const) {
    it(`matches the cue on the ${tab === 'chapter' ? 'CHAPTER page' : 'stacked pages'} while step 2 is drawn, and at no other time`, () => {
      const { ui, cue } = mountPhonePrep(tab);
      const layer = new FirstRunLayer(() => undefined);
      ui.appendChild(layer.el);

      expect(layer.el.dataset['step']).toBeUndefined(); // built hidden
      expect(hiddenCue()).toBeNull();

      layer.draw(STEP_BOARD, BOX);
      expect(hiddenCue()).toBeNull(); // the board has no cue, and step 1 never hides one

      layer.draw(STEP_PREP, BOX);
      expect(layer.el.dataset['step']).toBe('2');
      expect(hiddenCue()).toBe(cue);

      layer.draw(STEP_PREP, BOX); // drawn again every frame: still one step
      expect(hiddenCue()).toBe(cue);

      layer.hide();
      expect(layer.step).toBe(0);
      expect(hiddenCue()).toBeNull(); // nothing is up: the cue is back

      layer.draw(STEP_PREP, BOX);
      expect(hiddenCue()).toBe(cue);

      layer.draw(STEP_BATTLE, BOX, 0, 40);
      expect(hiddenCue()).toBeNull();

      layer.draw(STEP_PREP, BOX);
      layer.el.remove(); // the guide ended: the layer is gone
      expect(hiddenCue()).toBeNull();
    });
  }

  it('does not touch the cue itself: no inline style, the classes the page\'s scroll left (`is-visible`), its words and its place are as they were', () => {
    const { ui, cue, word } = mountPhonePrep('page');
    const layer = new FirstRunLayer(() => undefined);
    ui.appendChild(layer.el);
    layer.draw(STEP_PREP, BOX);
    expect(hiddenCue()).toBe(cue);
    expect(cue.getAttribute('style')).toBeNull();
    expect(cue.className).toBe('prep__phone-cue is-visible');
    expect(word.textContent).toBe('▼ MORE BELOW');
    layer.hide();
    expect(cue.className).toBe('prep__phone-cue is-visible'); // and when the slab goes it is as visible as the scroll made it
  });

  it('with the real sheet loaded, hides the cue and its words while step 2 is up and only then', () => {
    const { ui, cue, word } = mountPhonePrep('page');
    const style = document.createElement('style');
    style.textContent = FIRST_RUN_CSS;
    document.head.appendChild(style);
    try {
      const layer = new FirstRunLayer(() => undefined);
      ui.appendChild(layer.el);
      expect(getComputedStyle(cue).visibility).not.toBe('hidden');
      layer.draw(STEP_PREP, BOX);
      expect(getComputedStyle(cue).visibility).toBe('hidden');
      expect(getComputedStyle(word).visibility).toBe('hidden'); // the words inherit it: the whole strip is gone, not its box
      layer.draw(STEP_BATTLE, BOX, 0, 40);
      expect(getComputedStyle(cue).visibility).not.toBe('hidden');
      layer.draw(STEP_PREP, BOX);
      layer.hide();
      expect(getComputedStyle(cue).visibility).not.toBe('hidden');
    } finally {
      style.remove();
    }
  });
});

describe('the stylesheet\'s own selector, through the real guide loop (a first launch on a phone prep page)', () => {
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

  /** The phone prep as the screen draws it, START BATTLE given a rect (jsdom has no layout) so the guide treats it as on screen. */
  function mountPrep(): { ui: HTMLElement; cue: HTMLElement; start: HTMLElement } {
    const { ui, cue } = mountPhonePrep('page');
    const start = document.createElement('div');
    start.className = 'prep__start';
    start.style.opacity = '1';
    start.getBoundingClientRect = () => ({ ...BOX, right: BOX.left + BOX.width, bottom: BOX.top + BOX.height, x: BOX.left, y: BOX.top, toJSON: () => ({}) });
    ui.querySelector('.prep__stage')!.appendChild(start);
    return { ui, cue, start };
  }
  const frames = (n = 2): void => void vi.advanceTimersByTime(17 * n);

  it('hides the cue while "Your party is ready." is up, shows it again when the slab goes, and for good once the guide is skipped', () => {
    const { ui, cue, start } = mountPrep();
    armFirstRunGuide({ root: ui, absorbInput: () => void (absorbed += 1) });
    expect(firstRunActive()).toBe(true);
    frames();

    const layer = ui.querySelector<HTMLElement>('.frg')!;
    expect(layer.dataset['step']).toBe('2');
    expect(layer.querySelector('.frg__quote')!.textContent).toBe('“Your party is ready.”');
    expect(hiddenCue()).toBe(cue);

    // START BATTLE leaves the screen (a transition): the guide has nothing to point at and takes its layer down, and the cue is back.
    start.remove();
    frames();
    expect(layer.style.display).toBe('none');
    expect(hiddenCue()).toBeNull();

    // It comes back: the slab and the hidden cue with it.
    ui.querySelector('.prep__stage')!.appendChild(start);
    frames();
    expect(layer.dataset['step']).toBe('2');
    expect(hiddenCue()).toBe(cue);

    // The player skips the guide (Esc or the skip words): the layer is removed and the cue is back for good.
    skipFirstRun();
    expect(absorbed).toBe(1);
    expect(ui.querySelector('.frg')).toBeNull();
    expect(hiddenCue()).toBeNull();
    frames(4);
    expect(hiddenCue()).toBeNull();
  });
});
