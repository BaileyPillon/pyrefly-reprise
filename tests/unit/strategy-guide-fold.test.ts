// @vitest-environment jsdom
/**
 * Round 03 gate major #36 (`critic/rounds/round-03.md:780-788`): "the strategy
 * guide clips mid-word and prints its own '▾ MORE' chip on top of the clipped
 * line" — repro quoted there: "…the CTB margin the Holy / Water rhythm
 * need[s to beat] the mount's Full-". Still live as round 04 PR-0009 after two
 * attempts (a CSS fade over the cut, then a scale conversion of the measured
 * glyph rects), so `critic/RUBRIC.md` §8 applies and the approach changed
 * rather than the arithmetic.
 *
 * The rail is a **column** now (`.sgd__stack`): the ink slab, then a MORE row
 * that owns its own height in normal flow. Three separate defects, one file
 * each kind of proof can reach:
 *
 *  1. The box's height did not end on a whole line, so `overflow` sliced
 *     through whatever line sat at the boundary. Answered by
 *     {@link fitWholeUnits} — the body can now only ever end where a *block*
 *     ended — tested here both as arithmetic and as a stubbed DOM measurement
 *     driving `layout()`.
 *  2. `.sgd__more` was absolutely positioned over the panel's last two lines.
 *     Answered by the column, read out of the stylesheet, the same technique
 *     `pause-compact-and-retina.test.ts` uses for a property-choice defect.
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
import { StrategyGuide, fitWholeUnits } from '../../src/ui/common/StrategyGuide.ts';
import { makeFakeBattleState } from '../../src/ui/ffx/testFixtures.ts';
import { stubGuideLayout } from './helpers/guideLayoutStub.ts';

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

describe('fitWholeUnits', () => {
  /** Four 40px blocks; the fourth ends at 172 and a fifth would end at 210. */
  const blocks = [40, 90, 140, 172, 210].map((bottom) => ({ bottom, glyphBottom: bottom - 2 }));

  it('keeps every block that fits entirely and drops the one that would be cut', () => {
    const fit = fitWholeUnits(blocks, 175);
    expect(fit.shown).toBe(4);
    expect(fit.clipped).toBe(true);
  });

  it('ends the box on the last kept block’s glyphs, not a few px of leading below them', () => {
    // 172 is the box bottom; 170 is where the type actually stops. Ending at
    // 172 is what left the slab 3.3-3.7 grid px past the last line live.
    expect(fitWholeUnits(blocks, 175).height).toBe(170);
  });

  it('is inclusive of a block that lands exactly on the limit', () => {
    const fit = fitWholeUnits(blocks, 172);
    expect(fit.shown).toBe(4);
    expect(fit.height).toBe(170);
  });

  it('has nothing to say about content it was given none of', () => {
    const fit = fitWholeUnits([], 175);
    expect(fit.shown).toBe(0);
    expect(fit.height).toBe(175);
    expect(fit.clipped).toBe(false);
  });

  it('keeps the first block even when it overflows, rather than emptying the slab', () => {
    // NEXT — the command the player is being told to press — survives every
    // other rung of this panel's ladder; it survives this one too.
    const fit = fitWholeUnits([{ bottom: 300, glyphBottom: 298 }], 175);
    expect(fit.shown).toBe(1);
    expect(fit.height).toBe(298);
    expect(fit.clipped).toBe(false);
  });

  it('never ends on an orphan section head whose section was cut away', () => {
    const withHead = [
      { bottom: 40, glyphBottom: 38 },
      { bottom: 80, glyphBottom: 78, heading: true },
      { bottom: 200, glyphBottom: 198 },
    ];
    const fit = fitWholeUnits(withHead, 100);
    expect(fit.shown).toBe(1);
    expect(fit.height).toBe(38);
    expect(fit.clipped).toBe(true);
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

describe('the rail ends on a whole block instead of slicing one (round-03 #36, round-04 PR-0009)', () => {
  const originalGetClientRects = Range.prototype.getClientRects;
  afterEach(() => {
    Range.prototype.getClientRects = originalGetClientRects;
  });

  it('cuts the body at the last whole block and hides every block past it', () => {
    const stage = document.createElement('div');
    document.body.appendChild(stage);
    const guide = new StrategyGuide({
      game: 'ffx',
      anchors: { below: () => boxed(20, 24), above: () => boxed(240, 80), top: 44, bottom: 34 },
    });
    guide.mount(stage);
    guide.sync(makeFakeBattleState());

    // `available` here is 175 grid px (240 - 5 - 60, the identical anchor pair
    // to `ui-strategy-guide.test.ts`'s own case). Chrome (the slab's padding)
    // is 11, so the rail's text budget is 164; the content is taller than that,
    // so the MORE row shows and takes another 11, leaving 153 for whole blocks.
    // Each block is 20 tall, so blocks end at 20, 40, 60 ... and the last one
    // at or below 153 ends at 140, with its type stopping 2 px above that.
    const stub = stubGuideLayout(stage, { scale: 1, unitHeight: 20, glyphSlack: 2, bodyTop: 5, chrome: 11 });
    guide.update(0.016);
    expect(stub.units.length, 'the fixture guide got shorter than this case needs').toBeGreaterThan(8);

    const body = stage.querySelector<HTMLElement>('.sgd__body')!;
    expect(Number.parseFloat(body.style.height)).toBeCloseTo(138, 1); // 140 - 2 of leading
    expect(stub.units[6]!.classList.contains('sgd__u--out')).toBe(false); // ends at 140
    expect(stub.units[7]!.classList.contains('sgd__u--out')).toBe(true); // would end at 160
    expect(stage.querySelector<HTMLElement>('[data-role="strategy-guide-more"]')!.hidden).toBe(false);

    guide.unmount();
  });

  it('never lets the MORE row take its height out of the body after the cut', () => {
    const stage = document.createElement('div');
    document.body.appendChild(stage);
    const guide = new StrategyGuide({
      game: 'ffx',
      anchors: { below: () => boxed(20, 24), above: () => boxed(240, 80), top: 44, bottom: 34 },
    });
    guide.mount(stage);
    guide.sync(makeFakeBattleState());
    stubGuideLayout(stage, { scale: 1, unitHeight: 20, glyphSlack: 2, bodyTop: 5, chrome: 11 });
    guide.update(0.016);

    const body = stage.querySelector<HTMLElement>('.sgd__body')!;
    // 138 of text + 11 of slab chrome + 11 of MORE row = 165, inside the 175
    // the anchors allow. The defect this pins is the old order — clamp the
    // text first, then paint an 11px chip over its foot.
    expect(Number.parseFloat(body.style.height) + 11 + 11).toBeLessThanOrEqual(175);

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

  /**
   * Round 04 PR-0009, measured live by the verifier at four viewports in two
   * games: "MORE chip box 252.50-280.00 intersects 2 glyph line boxes" and
   * "chip 437.50-465.00 intersects the visible 'Watch' heading line box". The
   * chip could do that because it was `position: absolute` with a `top` the
   * layout wrote at the panel's own bottom edge. A flex row of the column
   * cannot overlap its sibling however the fit turns out, so the property is
   * asserted where it now lives: in the stylesheet.
   */
  it('owns a row of the column instead of being positioned over the body', () => {
    const more = ruleBody('.sgd__more');
    expect(more, '.sgd__more is positioned again — it must be a flow row').not.toMatch(/position:\s*absolute/);
    expect(more).toMatch(/flex:\s*0\s+0\s+auto/);
    // The measured geometry belongs to the column, so the slab's own box can
    // end exactly where the type does.
    const stack = ruleBody('.sgd__stack');
    expect(stack).toMatch(/position:\s*absolute/);
    expect(stack).toMatch(/flex-direction:\s*column/);
    expect(ruleBody('.sgd__panel'), '.sgd__panel must not carry its own position now').not.toMatch(
      /position:\s*absolute/,
    );
  });

  /**
   * "No gradient may cover a readable glyph" — the panel used to fade its own
   * last 7px, which is to say it faded whatever text was there.
   */
  it('leaves the slab itself unmasked', () => {
    const panel = ruleBody('.sgd__panel');
    expect(panel, '.sgd__panel masks its own foot again').not.toMatch(/mask-image\s*:/);
  });
});
