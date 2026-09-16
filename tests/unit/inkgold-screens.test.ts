// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { installInkGoldStyles } from '../../src/ui/inkgold/index.ts';

const INKGOLD_DIR = join(dirname(fileURLToPath(import.meta.url)), '../../src/ui/inkgold');
const readCss = (name: string): string => readFileSync(join(INKGOLD_DIR, name), 'utf8');
const readTs = (name: string): string => readFileSync(join(INKGOLD_DIR, name), 'utf8');

// -------------------------------------------------------- stylesheet install

describe('installInkGoldStyles with screens.css', () => {
  it('is still a no-op safe to call more than once', () => {
    expect(() => {
      installInkGoldStyles();
      installInkGoldStyles();
    }).not.toThrow();
  });

  it('imports screens.css from index.ts exactly once', () => {
    const src = readTs('index.ts');
    const matches = src.match(/import\s+['"]\.\/screens\.css['"];/g) ?? [];
    expect(matches).toHaveLength(1);
  });
});

// -------------------------------------------------------------- screens.css

describe('screens.css', () => {
  const css = readCss('screens.css');

  it('converts the title slab rect (700x470 @1440) and its stripe offset (632 @1440)', () => {
    expect(css).toContain('311.11px'); // 700 / 2.25
    expect(css).toContain('208.89px'); // 470 / 2.25
    expect(css).toContain('280.89px'); // 632 / 2.25
  });

  it('converts the title display name size (156px @1440) and its second-line indent (110px @1440)', () => {
    expect(css).toContain('69.33px'); // 156 / 2.25
    expect(css).toContain('48.89px'); // 110 / 2.25
  });

  it('converts the party-prep roster row rect (300x62 @1440)', () => {
    expect(css).toContain('133.33px'); // 300 / 2.25
    expect(css).toContain('27.56px'); // 62 / 2.25
  });

  it('converts the party-prep ledger width (820px @1440) and keeps its -8deg skew unconverted', () => {
    expect(css).toContain('364.44px'); // 820 / 2.25
    expect(css).toContain('skewX(-8deg)'); // angles don't scale
  });

  it('converts the dialogue slab rect (900x190 @1440) and portrait rect (220x300 @1440)', () => {
    expect(css).toContain('400px'); // 900 / 2.25
    expect(css).toContain('84.44px'); // 190 / 2.25
    expect(css).toContain('97.78px'); // 220 / 2.25
    expect(css).toContain('133.33px'); // 300 / 2.25
  });

  it('converts the minigame slab width (720px @1440) and timer ring size (52px @1440)', () => {
    expect(css).toContain('320px'); // 720 / 2.25
    expect(css).toContain('23.11px'); // 52 / 2.25
  });

  it('exposes the timing bar as custom properties the caller overrides per instance', () => {
    expect(css).toContain('--ig-zone-start');
    expect(css).toContain('--ig-zone-width');
    expect(css).toContain('--ig-cursor-pos');
    expect(css).toContain('var(--ig-zone-start)');
    expect(css).toContain('var(--ig-cursor-pos)');
  });

  it('extrapolates a reel row and a button-sequence row modifier for Slots/Bushido', () => {
    expect(css).toContain('.ig-minigame__bar--reel');
    expect(css).toContain('.ig-minigame__bar--sequence');
  });

  it('converts the boss HP bar rect (300x8 @1440) at its fixed top-left offset (48,40 @1440)', () => {
    expect(css).toContain('.ig-bosshp');
    expect(css).toContain('133.33px'); // 300 / 2.25 (track width)
    expect(css).toContain('3.56px'); // 8 / 2.25 (track height)
    expect(css).toContain('21.33px'); // 48 / 2.25
    expect(css).toContain('17.78px'); // 40 / 2.25
  });

  it('uses --ig-skew / --ig-skew-inverse rather than hard-coded degrees for every mirrored slab', () => {
    expect(css).toContain('var(--ig-skew)');
    expect(css).toContain('var(--ig-skew-inverse)');
  });
});

// ------------------------------------------------------ ffx-2 mirroring vars

describe('tokens.css FFX-2 mirroring', () => {
  const css = readCss('tokens.css');

  it('declares the base skew/edge variables', () => {
    expect(css).toContain('--ig-skew: -12deg');
    expect(css).toContain('--ig-skew-inverse: 12deg');
    expect(css).toContain('--ig-edge: 0');
  });

  it('flips all three under .ig--ffx2', () => {
    const ffx2Block = css.slice(css.indexOf('.ig--ffx2'));
    expect(ffx2Block).toContain('--ig-skew: 12deg');
    expect(ffx2Block).toContain('--ig-skew-inverse: -12deg');
    expect(ffx2Block).toContain('--ig-edge: 1');
  });
});

describe('slabs.css FFX-2 mirroring', () => {
  const css = readCss('slabs.css');

  it('splits .ig-stat\'s accent border into left/right widths driven by --ig-edge (no override rule)', () => {
    expect(css).toContain('calc((1 - var(--ig-edge)) * 2.67px)');
    expect(css).toContain('calc(var(--ig-edge) * 2.67px)');
  });

  it('splits .ig-reticle__name\'s accent border the same way', () => {
    expect(css).toContain('calc((1 - var(--ig-edge)) * 1.78px)');
    expect(css).toContain('calc(var(--ig-edge) * 1.78px)');
  });

  it('overrides the left/right anchor of .ig-banner, .ig-stat-list and .ig-reticle__name under .ig--ffx2', () => {
    expect(css).toContain('.ig--ffx2 .ig-banner');
    expect(css).toContain('.ig--ffx2 .ig-stat-list');
    expect(css).toContain('.ig--ffx2 .ig-reticle__name');
  });

  it('adds the FFX-2 dressphere monogram tile and damage chain chip', () => {
    expect(css).toContain('.ig-stat__sphere');
    expect(css).toContain('.ig-damage__chain');
  });

  it('no longer references the old --ig-slab-skew name', () => {
    expect(css).not.toContain('--ig-slab-skew');
  });
});
