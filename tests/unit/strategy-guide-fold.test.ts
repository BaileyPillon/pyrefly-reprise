// @vitest-environment jsdom
/**
 * Round 03 gate major #36 (`critic/rounds/round-03.md:780-788`): "the strategy
 * guide clips mid-word and prints its own '▾ MORE' chip on top of the clipped
 * line" — repro quoted there: "…the CTB margin the Holy / Water rhythm
 * need[s to beat] the mount's Full-". Three separate defects, one file each
 * kind of proof can reach:
 *
 *  1. The box's height did not end on a whole line, so `overflow-y` sliced
 *     through whatever line happened to sit at the boundary. Fixed by
 *     `StrategyGuide.measureLineBottoms` + the exported pure
 *     {@link lastWholeLineBelow}, tested here both as arithmetic and as a
 *     real (stubbed) DOM measurement driving `layout()`.
 *  2. `.sgd__more`'s own background was opaque for its first 64% and only
 *     faded across the last third — not "a real fade" — read out of the
 *     stylesheet, the same technique `pause-compact-and-retina.test.ts` uses
 *     for a property-choice defect.
 *  3. `.sgd__more`'s font-size (5px) fell under the project's 14 CSS px
 *     legibility floor once the letterbox scale at 1280x720 (2x), 1600x900
 *     (2.5x) and 2000x1012 (~2.811x) is applied — the same three viewports
 *     the brief asks the browser pass to cover.
 *
 * Case: both — `StrategyGuide` and its stylesheet carry no game branch other
 * than the accent colour (`sgd--ffx2`), which this file does not touch.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';
import { StrategyGuide, lastWholeLineBelow } from '../../src/ui/common/StrategyGuide.ts';
import { makeFakeBattleState } from '../../src/ui/ffx/testFixtures.ts';

const HERE = dirname(fileURLToPath(import.meta.url));
const SHEET = readFileSync(join(HERE, '..', '..', 'src', 'ui', 'common', 'strategy-guide.css'), 'utf8');

/** The declaration block for one selector, exactly as `pause-compact-and-retina.test.ts` reads one. */
function ruleBody(selector: string): string {
  const at = SHEET.indexOf(`${selector} {`);
  expect(at, `selector "${selector}" is gone from strategy-guide.css`).toBeGreaterThan(-1);
  const from = SHEET.indexOf('{', at);
  let depth = 0;
  for (let i = from; i < SHEET.length; i++) {
    if (SHEET[i] === '{') depth++;
    else if (SHEET[i] === '}' && --depth === 0) return SHEET.slice(from + 1, i);
  }
  throw new Error(`unterminated block for "${selector}"`);
}

// ---------------------------------------------------------- pure arithmetic

describe('lastWholeLineBelow', () => {
  it('picks the largest line bottom at or below the limit', () => {
    expect(lastWholeLineBelow([40, 80, 120, 172, 210], 175)).toBe(172);
  });

  it('is inclusive of a line that lands exactly on the limit', () => {
    expect(lastWholeLineBelow([50, 100, 150], 100)).toBe(100);
  });

  it('falls back to the limit when there is no line data at all (jsdom has no layout)', () => {
    expect(lastWholeLineBelow([], 175)).toBe(175);
  });

  it('falls back to the limit when even the first line overflows it', () => {
    // Never return 0 and collapse the panel to nothing — the uncautious
    // height (whatever `fit()` already solved for) is the safer fallback.
    expect(lastWholeLineBelow([300], 175)).toBe(175);
  });
});

// -------------------------------------------------------- layout(), stubbed

/** Mirrors `ui-strategy-guide.test.ts`'s `boxed()` for the anchor elements. */
function boxed(top: number, height: number): HTMLElement {
  const el = document.createElement('div');
  Object.defineProperty(el, 'offsetTop', { value: top, configurable: true });
  Object.defineProperty(el, 'offsetHeight', { value: height, configurable: true });
  return el;
}

describe('the rail ends on a whole line instead of slicing one (round-03 #36)', () => {
  const originalGetClientRects = Range.prototype.getClientRects;
  afterEach(() => {
    Range.prototype.getClientRects = originalGetClientRects;
  });

  it('clamps maxHeight to the last fully-visible line, not the raw available height', () => {
    // Fake line bottoms (grid px from `.sgd__body`'s own top): four whole
    // lines land inside the 175px `available` this anchor pair produces (see
    // `ui-strategy-guide.test.ts`'s identical setup), and a fifth line runs
    // past it to 210 — the one `overflow-y` would otherwise slice.
    const fakeBottoms = [40, 90, 140, 172, 210];
    Range.prototype.getClientRects = function (this: Range) {
      return fakeBottoms.map((bottom) => ({ bottom }) as DOMRect) as unknown as DOMRectList;
    };

    const stage = document.createElement('div');
    document.body.appendChild(stage);
    const guide = new StrategyGuide({
      game: 'ffx',
      anchors: { below: () => boxed(20, 24), above: () => boxed(240, 80), top: 44, bottom: 34 },
    });
    guide.mount(stage);
    const bodyEl = stage.querySelector<HTMLElement>('.sgd__body')!;
    Object.defineProperty(bodyEl, 'getBoundingClientRect', {
      value: () => ({ top: 0 }) as DOMRect,
      configurable: true,
    });

    guide.sync(makeFakeBattleState());
    guide.update(0.016);

    const panel = stage.querySelector<HTMLElement>('[data-role="strategy-guide-panel"]')!;
    // Unclamped `available` here is 175 (240 - 5 - 60, per the identical case
    // in `ui-strategy-guide.test.ts`). The last *whole* line is at 172.
    expect(Number.parseFloat(panel.style.maxHeight)).toBeCloseTo(172, 1);

    guide.unmount();
  });
});

// --------------------------------------------------------------- the sheet

describe('the MORE affordance reads as a fade, not a slice (round-03 #36)', () => {
  it('is legible (>= 14 CSS px effective) at every viewport the brief asks for', () => {
    const body = ruleBody('.sgd__more');
    const match = body.match(/font-size:\s*([\d.]+)px/);
    expect(match, '.sgd__more has no font-size declaration').not.toBeNull();
    const gridPx = Number.parseFloat(match![1]!);

    // scale = min(w/640, h/360) — the letterbox transform every Ink & Gold
    // battle chrome uses (`FFXBattleHud.hudScale`, `LetterboxStage`).
    const viewports: Array<[number, number]> = [
      [1280, 720],
      [1600, 900],
      [2000, 1012],
    ];
    for (const [w, h] of viewports) {
      const scale = Math.min(w / 640, h / 360);
      const effective = gridPx * scale;
      expect(effective, `${w}x${h}: ${gridPx}px grid * ${scale.toFixed(3)} scale`).toBeGreaterThanOrEqual(14);
    }
  });

  it('has no opaque plateau before the fade starts', () => {
    const body = ruleBody('.sgd__more');
    const gradientMatch = body.match(/background:\s*linear-gradient\(([\s\S]*?)\);/);
    expect(gradientMatch, '.sgd__more has no linear-gradient background').not.toBeNull();
    const stops = gradientMatch![1]!
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s && !s.startsWith('to '));
    // A "real fade" never repeats the same fully-opaque colour at two
    // consecutive stops — that plateau is exactly what round 03 measured as
    // "opaque under the word, fading only across its top third".
    for (let i = 1; i < stops.length; i++) {
      const [prevColor] = stops[i - 1]!.split(/\s+\d/);
      const [curColor] = stops[i]!.split(/\s+\d/);
      if (prevColor === curColor) {
        throw new Error(
          `.sgd__more's gradient repeats "${prevColor?.trim()}" at consecutive stops ` +
            `("${stops[i - 1]}", "${stops[i]}") — that is a plateau, not a fade.`,
        );
      }
    }
  });
});
