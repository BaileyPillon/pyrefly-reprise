// @vitest-environment jsdom
/**
 * PR-0389 (release 39.1; FFX-2 only: the room above the girls shrinks only where the HUD grows its boss strips with TEXT SIZE): at TEXT SIZE 115 and 130 the
 * strategy guide used to disappear in Chapters IV and VI, chip and all, and G flipped a flag with nothing to show.
 *
 * The least sheet is counted as it is painted now (`room x scale` against the 56 grid px it is at 100 percent), which keeps Chapter IV at 115 and 130 (room 56.0 and
 * 45.9 layout px at 1600x900) and Chapters XI, XV and XVI at 130 (50.5); where it truly does not fit (Chapter VI: three strips leave 29.1 and 16.8) the rail folds to
 * its tab, and G opens the sheet over the boss strips' column, down to the fence above the girls. The numbers here are the real ones measured in the game at 1600x900
 * (`docs/handoff/r391-ui.md`); jsdom has no layout, so the HUD's own anchors are stubbed with them and the computed `scale` TEXT SIZE puts on the rail is faked.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { StrategyGuide, railRoom } from '../../src/ui/common/StrategyGuide.ts';
import { fakeBoard } from './helpers/guideDocStrings.ts';
import { stubSheetLayout } from './helpers/guideSheetStub.ts';

const live: StrategyGuide[] = [];

afterEach(() => {
  while (live.length) live.pop()!.unmount();
  document.body.innerHTML = '';
});

function boxed(top: number, height: number): HTMLElement {
  const el = document.createElement('div');
  Object.defineProperty(el, 'offsetTop', { value: top, configurable: true });
  Object.defineProperty(el, 'offsetHeight', { value: height, configurable: true });
  return el;
}

/** Chapter IV and VI at 1600x900, from the game: where the boss strips stand (top, height at 100 percent) and the girls' fence (the topmost head). */
const IV = { strip: [41, 31], fence: 185 } as const; // one boss strip; room 69 stage px to the floor
const VI = { strip: [41, 77], fence: 207 } as const; // three strips; room 45 stage px to the floor

interface Mounted {
  stage: HTMLElement;
  guide: StrategyGuide;
  written: boolean[];
  state: { fence: number; strip: readonly [number, number]; scale: number };
}

/** The scale TEXT SIZE puts on each rail (`getComputedStyle(stack).scale`): jsdom has no `scale`, so the one the HUD reads is faked, per rail. */
const scales = new WeakMap<Element, { scale: number }>();
const realComputedStyle = window.getComputedStyle.bind(window);
window.getComputedStyle = ((el: Element, pseudo?: string | null): CSSStyleDeclaration => {
  const cs = realComputedStyle(el, pseudo);
  const faked = scales.get(el);
  return faked ? new Proxy(cs, { get: (t, k) => (k === 'scale' ? String(faked.scale) : Reflect.get(t, k)) }) : cs;
}) as typeof window.getComputedStyle;

function mount(game: 'ffx' | 'ffx2', chapter: { strip: readonly [number, number]; fence: number }, scale: number, visible = true): Mounted {
  const state = { fence: chapter.fence, strip: chapter.strip, scale };
  const stage = document.createElement('div');
  document.body.appendChild(stage);
  const written: boolean[] = [];
  const guide = new StrategyGuide({
    game,
    anchors: {
      // the strips' height grows with the scale in the game (`text-size-wide.css`): the anchors report the layout (unscaled) height, as `offsetHeight` does
      below: () => boxed(state.strip[0], state.strip[1]),
      above: () => boxed(state.fence, 1),
      top: 44,
      bottom: 104,
    },
    readVisible: () => visible,
    writeVisible: (on) => void written.push(on),
  });
  guide.mount(stage);
  scales.set(stage.querySelector('.sgd__stack')!, state);
  guide.sync(fakeBoard(game, game === 'ffx2' ? [{ id: 'vegnagun-tail' }] : [{ id: 'yunalesca', formIndex: 2 }]));
  live.push(guide);
  stubSheetLayout(stage, { unitHeight: 20, gap: 4, padTop: 5, clientHeight: 60 });
  guide.update(0.016);
  return { stage, guide, written, state };
}

const key = (code: string): void => void window.dispatchEvent(new KeyboardEvent('keydown', { code, cancelable: true }));
const flags = (m: Mounted): { squeezed: boolean; peek: boolean; off: boolean } => ({
  squeezed: m.guide.el.classList.contains('sgd--squeezed'),
  peek: m.guide.el.classList.contains('sgd--peek'),
  off: m.guide.el.classList.contains('sgd--off'),
});

describe('the sheet is counted as it is painted (the measured rooms)', () => {
  it('railRoom: the stage room less what the strips grew, over the scale (Chapter IV at 130 percent: 45.9 layout px, 59.7 painted)', () => {
    const room = railRoom(157 - 88, 1.3, 31 * 0.3);
    expect(room).toBeCloseTo(45.92, 1);
    expect(room * 1.3).toBeGreaterThanOrEqual(56); // painted, it is as tall as the 100 percent least sheet: it stays
    expect(railRoom(179 - 134, 1.3, 77 * 0.3) * 1.3).toBeLessThan(56); // Chapter VI at 130 percent: 21.8 painted: it folds
  });

  it('keeps the sheet in Chapter IV at 115 and 130 percent, with the room it measured, and no fold', () => {
    for (const scale of [1.15, 1.3]) {
      const m = mount('ffx2', IV, scale);
      expect(flags(m), `at ${scale}`).toEqual({ squeezed: false, peek: false, off: false });
      const stack = m.stage.querySelector<HTMLElement>('.sgd__stack')!;
      const room = railRoom(157 - 88, scale, 31 * (scale - 1));
      expect(Number.parseFloat(stack.style.maxHeight), `at ${scale}`).toBeCloseTo(Math.max(56 / scale, room), 1);
    }
  });

  it('folds in Chapter VI at 115 and 130 percent, where even the least sheet does not fit above the girls', () => {
    for (const scale of [1.15, 1.3]) {
      const m = mount('ffx2', VI, scale);
      expect(flags(m), `at ${scale}`).toMatchObject({ squeezed: true, peek: false });
    }
  });

  it('never folds at 100 percent (nothing grows), and never in FFX (its column is divided by the scale it is drawn at)', () => {
    expect(flags(mount('ffx2', VI, 1)).squeezed).toBe(false);
    expect(flags(mount('ffx', VI, 1.3)).squeezed).toBe(false);
  });
});

describe('folded to its tab: G opens the sheet over the strips, and nothing the player chose changes', () => {
  it('shows the chip as an offer (the sheet is not up), with a title that says why', () => {
    const m = mount('ffx2', VI, 1.3);
    const toggle = m.stage.querySelector<HTMLElement>('.sgd__toggle')!;
    expect(m.guide.isVisible).toBe(true); // the setting is the player's and is left alone
    expect(flags(m).off).toBe(true);
    expect(m.stage.querySelector<HTMLElement>('.sgd__panel')!.hidden).toBe(true);
    expect(toggle.textContent?.toLowerCase()).toContain('guide');
    expect(toggle.textContent?.toLowerCase()).not.toContain('hide');
    expect(toggle.title).toMatch(/no room above the girls/i);
    // the chip stands where it always did: just below the strips
    expect(Number.parseFloat(toggle.style.top)).toBeCloseTo(41 + 77 + 5, 1);
  });

  it('G opens the sheet over the strips: it starts where they start, ends at the fence above the girls, and is not stepped down by what they grew', () => {
    const m = mount('ffx2', VI, 1.3);
    key('KeyG');
    expect(flags(m)).toMatchObject({ squeezed: true, peek: true, off: false });
    m.guide.update(0.016);
    const stack = m.stage.querySelector<HTMLElement>('.sgd__stack')!;
    const toggle = m.stage.querySelector<HTMLElement>('.sgd__toggle')!;
    expect(m.stage.querySelector<HTMLElement>('.sgd__panel')!.hidden).toBe(false);
    expect(Number.parseFloat(stack.style.top)).toBeCloseTo(41 + 11, 1); // the strips' top and the chip's rise
    expect(Number.parseFloat(toggle.style.top)).toBeCloseTo(41, 1); // the chip rides above the sheet
    expect(m.guide.el.style.getPropertyValue('--sgd-shift')).toBe('0.00px');
    // down to the fence over the girls (207 less the 28 grid px of air), painted: top + room x scale <= floor
    const floor = 207 - 28;
    const top = Number.parseFloat(stack.style.top);
    expect(top + Number.parseFloat(stack.style.maxHeight) * 1.3).toBeLessThanOrEqual(floor + 0.01);
    expect(m.guide.view()?.chapterId).toBeDefined();
    expect(m.written, 'the setting is never written').toEqual([]);
  });

  it('G again folds it, and so does the next battle starting folded (the peek is not remembered)', () => {
    const m = mount('ffx2', VI, 1.3);
    key('KeyG');
    key('KeyG');
    expect(flags(m)).toMatchObject({ squeezed: true, peek: false, off: true });
    key('KeyG');
    expect(flags(m).peek).toBe(true);
    const next = mount('ffx2', VI, 1.3); // a new battle, a new guide
    expect(flags(next).peek).toBe(false);
    expect(m.written).toEqual([]);
  });

  it('a click on the tab does the same as G, and a player who turned the guide off still finds it there', () => {
    const m = mount('ffx2', VI, 1.3, false);
    expect(m.guide.isVisible).toBe(false);
    expect(flags(m)).toMatchObject({ squeezed: true, peek: false });
    m.stage.querySelector<HTMLElement>('.sgd__toggle')!.click();
    expect(flags(m).peek).toBe(true);
    expect(m.written).toEqual([]);
  });

  it('unfolds by itself when the room comes back (the text size goes down, a strip is gone), back on the player\'s own setting', () => {
    const m = mount('ffx2', VI, 1.3);
    key('KeyG');
    expect(flags(m).peek).toBe(true);
    m.state.scale = 1; // TEXT SIZE back to 100
    m.guide.update(0.016);
    expect(flags(m)).toEqual({ squeezed: false, peek: false, off: false });
    expect(m.stage.querySelector<HTMLElement>('.sgd__panel')!.hidden).toBe(false);
    m.state.scale = 1.3;
    m.guide.update(0.016);
    expect(flags(m).squeezed).toBe(true);
  });

  it('does not flicker on a room that breathes by a hair (the girls idle sway moves the fence): it unfolds only with 2 layout px to spare', () => {
    const m = mount('ffx2', { strip: [41, 77], fence: 207 }, 1.3);
    expect(flags(m).squeezed).toBe(true);
    // the room that would just fit: 56 / 1.3 = 43.08 layout px; a fence 1 px lower is under the margin and stays folded
    const needed = 134 + 23.1 + 43.08 * 1.3 + 28; // restRailTop + shift + the least sheet painted + the air over the girls
    m.state.fence = needed + 0.5;
    m.guide.update(0.016);
    expect(flags(m).squeezed).toBe(true);
    m.state.fence = needed + 5;
    m.guide.update(0.016);
    expect(flags(m).squeezed).toBe(false);
  });
});

describe('the stylesheet', () => {
  it('draws neither the sheet nor its scroll chip while folded and not opened, and keeps the chip (the tab)', async () => {
    const { readFileSync } = await import('node:fs');
    const { resolve } = await import('node:path');
    const wide = readFileSync(resolve(process.cwd(), 'src/ui/common/text-size-wide.css'), 'utf8').replace(/\r\n/g, '\n');
    expect(wide).toContain('.ffx2hud .sgd.sgd--squeezed:not(.sgd--peek) > .sgd__stack');
    expect(wide).toContain('.ffx2hud .sgd.sgd--squeezed:not(.sgd--peek) > .sgd__keys');
    expect(wide).not.toContain('.ffx2hud .sgd.sgd--squeezed { display: none; }');
    expect(wide).not.toMatch(/\.sgd--squeezed[^{]*\.sgd__toggle[^{]*\{[^}]*display:\s*none/);
  });
});
