// @vitest-environment jsdom
/**
 * Round 05 repairs for the strategy guide's own surface.
 *
 * **PR-0050 (major, regression of ee49fc3 / c278f71).** With the guide hidden,
 * `applyVisible()` cleared the chip's inline `top` and let it fall back to the
 * stylesheet's static `top: 44px`. In FFX that lands under the action banner and
 * looks fine; in FFX-2 the thing above the rail is the boss gauge strip
 * (`.ffx2hud__enemies`, taller than 44 grid px), so the reopen chip was drawn
 * across Bahamut's nameplate, HP bar and SCAN label at 1600x900 and 2000x1012.
 * The chip's anchor is the same measurement whether the panel under it is up or
 * not, so it is computed the same way in both states now.
 *
 * **PR-0001 (major, the part inside this surface).** Every string in the panel
 * has to clear 14 effective CSS px — computed font-size times the letterbox
 * stage's scale — at the sizes this repair is scoped to. The stage scales by
 * `min(w / 640, h / 360)`, so 1600x900 is exactly 2.5x and 2000x1012 is
 * ~2.811x; 1600x900 is therefore the binding case and the floor on the authored
 * grid px is `14 / 2.5 = 5.6`. The file is authored a hair above that
 * ({@link MIN_GRID_PX}) so a browser reporting 5.6 x 2.5 as 13.999 cannot fail
 * the harness. 1280x720 (2x) is deliberately NOT in scope here: clearing it
 * needs 7 grid px in a 132 px rail, which is a content decision, not a token
 * floor — see the handoff note.
 *
 * Case: **both games**. `StrategyGuide` and its stylesheet carry no game branch
 * beyond the accent colour (`.sgd--ffx2`), and hard rule 14 puts shared
 * plumbing and bug fixes in both games; the defect was only *observed* in FFX-2
 * because that is where the static fallback collides with the chrome.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { StrategyGuide } from '../../src/ui/common/StrategyGuide.ts';
import { makeFakeBattleState } from '../../src/ui/ffx/testFixtures.ts';

/** An anchor with the layout numbers `StrategyGuide.layout()` actually reads. */
function boxed(top: number, height: number): HTMLElement {
  const el = document.createElement('div');
  Object.defineProperty(el, 'offsetTop', { value: top, configurable: true });
  Object.defineProperty(el, 'offsetHeight', { value: height, configurable: true });
  return el;
}

/**
 * The FFX-2 shape of the defect: a boss gauge strip that runs from grid y 8 to
 * y 62, well past the stylesheet's static `top: 44` fallback. `layout()` puts
 * the rail at `62 + CLEARANCE_GAP(5) + CHIP_RISE(11) = 78` and the chip
 * `CHIP_RISE` above that, at 67 — clear of the strip. The static fallback would
 * put it at 33, i.e. inside it.
 */
const ENEMY_STRIP = { top: 8, height: 54 } as const;
const EXPECTED_CHIP_TOP = 67;

function mountGuide(game: 'ffx' | 'ffx2', visible: boolean) {
  const stage = document.createElement('div');
  document.body.appendChild(stage);
  let stored = visible;
  const guide = new StrategyGuide({
    game,
    anchors: {
      below: () => boxed(ENEMY_STRIP.top, ENEMY_STRIP.height),
      above: () => boxed(300, 40),
      top: 44,
      bottom: 104,
    },
    readVisible: () => stored,
    writeVisible: (on) => {
      stored = on;
    },
  });
  guide.mount(stage);
  guide.sync(makeFakeBattleState());
  guide.update(0.016);
  const toggle = stage.querySelector<HTMLElement>('[data-role="strategy-guide-toggle"]')!;
  return { stage, guide, toggle };
}

describe('PR-0050 — the collapsed chip keeps the anchor the open panel measured', () => {
  for (const game of ['ffx', 'ffx2'] as const) {
    it(`holds the measured top through a hide/show cycle in ${game}`, () => {
      const { stage, guide, toggle } = mountGuide(game, true);

      expect(Number.parseFloat(toggle.style.top)).toBeCloseTo(EXPECTED_CHIP_TOP, 2);

      // Press G: the panel goes, the anchor does not.
      guide.toggle();
      expect(guide.isVisible).toBe(false);
      expect(toggle.style.top).not.toBe('');
      expect(Number.parseFloat(toggle.style.top)).toBeCloseTo(EXPECTED_CHIP_TOP, 2);

      // And it keeps tracking the strip while the guide stays off.
      guide.update(0.016);
      expect(Number.parseFloat(toggle.style.top)).toBeCloseTo(EXPECTED_CHIP_TOP, 2);

      guide.toggle();
      expect(Number.parseFloat(toggle.style.top)).toBeCloseTo(EXPECTED_CHIP_TOP, 2);

      guide.unmount();
      stage.remove();
    });
  }

  it('starts a battle that opens with the guide already off on the measured anchor', () => {
    const { stage, guide, toggle } = mountGuide('ffx2', false);
    expect(guide.isVisible).toBe(false);
    expect(Number.parseFloat(toggle.style.top)).toBeCloseTo(EXPECTED_CHIP_TOP, 2);
    guide.unmount();
    stage.remove();
  });

  it('still falls back to the authored top when the anchor is not laid out', () => {
    const stage = document.createElement('div');
    document.body.appendChild(stage);
    let stored = true;
    const guide = new StrategyGuide({
      game: 'ffx2',
      // `offsetHeight: 0` — hidden chrome, the gate `layout()` already applies.
      anchors: { below: () => boxed(0, 0), top: 44, bottom: 104 },
      readVisible: () => stored,
      writeVisible: (on) => {
        stored = on;
      },
    });
    guide.mount(stage);
    guide.sync(makeFakeBattleState());
    guide.update(0.016);
    guide.toggle();
    const toggle = stage.querySelector<HTMLElement>('[data-role="strategy-guide-toggle"]')!;
    // The authored fallback already has CHIP_RISE counted in: 44 - 11 = 33.
    expect(Number.parseFloat(toggle.style.top)).toBeCloseTo(33, 2);
    guide.unmount();
    stage.remove();
  });
});

describe('PR-0001 — no string in the guide falls under 14 effective px', () => {
  /**
   * The bare floor is `14 / 2.5 = 5.6` grid px at 1600x900. The sheet is
   * authored at 5.7 so a stage scale that is 2.49 rather than 2.5 — a viewport
   * an odd pixel short, a browser that rounds the transform — still clears 14.
   */
  const MIN_GRID_PX = 5.7;
  const SCALES: ReadonlyArray<readonly [string, number]> = [
    ['1600x900', 2.5],
    ['2000x1012', 1012 / 360],
  ];

  // `import.meta.url` is not a file URL under the jsdom environment, so the
  // sheet is read relative to the repo root vitest already runs from.
  const css = readFileSync(resolve(process.cwd(), 'src/ui/common/strategy-guide.css'), 'utf8');

  /** Every authored type size in the sheet, with the selector block it sits in. */
  function declaredSizes(): ReadonlyArray<{ readonly selector: string; readonly px: number }> {
    const out: { selector: string; px: number }[] = [];
    // Selector text is whatever precedes the `{` of the block the declaration
    // is in; good enough to name the offender in a failure message.
    const blocks = css.matchAll(/([^{}]+)\{([^{}]*)\}/g);
    for (const block of blocks) {
      const selector = block[1]!.replace(/\/\*[\s\S]*?\*\//g, '').trim().replace(/\s+/g, ' ');
      for (const decl of block[2]!.matchAll(/(?:^|[;{\s])font-size:\s*([\d.]+)px/g)) {
        out.push({ selector, px: Number.parseFloat(decl[1]!) });
      }
    }
    return out;
  }

  it('finds every type size in the sheet', () => {
    const sizes = declaredSizes();
    expect(sizes.length).toBeGreaterThanOrEqual(10);
    // The chip, the title and the MORE row are all in there.
    expect(sizes.some((s) => s.selector.includes('.sgd__toggle'))).toBe(true);
    expect(sizes.some((s) => s.selector.includes('.sgd__title'))).toBe(true);
    expect(sizes.some((s) => s.selector.includes('.sgd__more'))).toBe(true);
  });

  for (const [label, scale] of SCALES) {
    it(`clears the floor at ${label}`, () => {
      const under = declaredSizes()
        .filter((s) => s.px * scale < 14)
        .map((s) => `${s.selector} = ${s.px}px -> ${(s.px * scale).toFixed(2)} effective`);
      expect(under).toEqual([]);
    });
  }

  it('authors every size at or above the 1600x900 floor', () => {
    const under = declaredSizes()
      .filter((s) => s.px < MIN_GRID_PX)
      .map((s) => `${s.selector} = ${s.px}px`);
    expect(under).toEqual([]);
  });
});
