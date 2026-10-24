import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

/**
 * The F1 HUD's type rules (lane "hud-f1", decision 192 "Bigger, cleaner text"): a 28 px floor at 2560 x 1440 (the HUD grid is 640 x 360, scaled 4x, so every text size inside `.hud-f1` is at least
 * 7 grid px), and two typefaces only: Cormorant Garamond Bold Italic and Chakra Petch Bold (through the tokens; Rajdhani and Exo 2 are not named).
 */
const DIR = join(__dirname, '../../src/ui/hudf1');
const FILES = readdirSync(DIR).filter((f) => f.endsWith('.css'));
const FLOOR_GRID_PX = 7; // 28 px at 4x

/** Every font size a rule writes, as [file, snippet, grid px]. `max(7.5px, var(--f1-floor))` counts as its first argument. */
function sizes(css: string): Array<[string, number]> {
  const out: Array<[string, number]> = [];
  const noComments = css.replace(/\/\*[\s\S]*?\*\//g, '');
  for (const m of noComments.matchAll(/font(?:-size)?\s*:\s*([^;{}]+);/g)) {
    const decl = m[0].trim();
    if (/^font-size/.test(decl)) {
      const v = /(?:max\(\s*)?(\d+(?:\.\d+)?)px/.exec(m[1]!);
      if (v) out.push([decl, Number(v[1])]);
      continue;
    }
    // the shorthand: [style] [weight] SIZE[/line-height] family
    const v = /(?:^|\s)(?:max\(\s*)?(\d+(?:\.\d+)?)px(?:[,\s]*var\([^)]*\)\s*\))?\s*\//.exec(m[1]!);
    if (v) out.push([decl, Number(v[1])]);
  }
  return out;
}

describe('the 28 px floor', () => {
  for (const f of FILES) {
    it(`${f}: no text under 7 grid px (28 px at 2560 x 1440)`, () => {
      const found = sizes(readFileSync(join(DIR, f), 'utf8'));
      const small = found.filter(([, px]) => px < FLOOR_GRID_PX);
      expect(small, small.map(([d]) => d).join('\n')).toEqual([]);
    });
  }
  it('finds the sizes it is meant to check (not an empty pass)', () => {
    const all = FILES.flatMap((f) => sizes(readFileSync(join(DIR, f), 'utf8')));
    expect(all.length).toBeGreaterThan(20);
    expect(Math.max(...all.map(([, px]) => px))).toBeGreaterThanOrEqual(19.5); // the hero's name
  });
  it('the mockup\'s sizes are the ones in the sheet (verbs 48, HP 64, MP 44, names 50, boss name 54, prompts 30 px at 1440p = /4)', () => {
    const ffx = readFileSync(join(DIR, 'hudf1-ffx.css'), 'utf8');
    const shared = readFileSync(join(DIR, 'hudf1.css'), 'utf8');
    expect(ffx).toMatch(/\.ffx-cmd__label \{[^}]*font-size: 12px/); // verbs 48
    expect(ffx).toMatch(/\.ig-stat__value \{[^}]*font: 700 16px/); // HP 64
    expect(ffx).toMatch(/\.ig-stat__value--mp \{[^}]*font-size: 11px/); // MP 44
    expect(ffx).toMatch(/\.ig-stat__name \{[^}]*font-size: 12\.5px/); // names 50
    expect(shared).toMatch(/\.f1-ribbon__name \{[^}]*font-size: 13\.5px/); // boss name 54
    expect(shared).toMatch(/max\(7\.5px, var\(--f1-floor\)\)/); // prompts 30
  });
});

describe('two typefaces', () => {
  it('no stylesheet names Rajdhani or Exo 2, and every family is a token, Chakra Petch or Cormorant Garamond', () => {
    for (const f of FILES) {
      const css = readFileSync(join(DIR, f), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
      expect(css).not.toMatch(/Rajdhani|Exo 2/);
      for (const m of css.matchAll(/font-family\s*:\s*([^;]+);/g)) expect(m[1]).toMatch(/var\(--|Chakra Petch|Cormorant Garamond/);
      for (const m of css.matchAll(/font\s*:[^;]*?\s(var\(--[a-z-]+\)|'[^']+'[^;]*)\s*;/g)) expect(m[1]).toMatch(/var\(--ig-font-|Chakra Petch|Cormorant Garamond/);
    }
  });
  it('the tokens point at Chakra Petch under .hud-f1', () => {
    const css = readFileSync(join(DIR, 'hudf1.css'), 'utf8');
    expect(css).toMatch(/--ig-font-numeral: 'Chakra Petch'/);
    expect(css).toMatch(/--ig-font-text: 'Chakra Petch'/);
  });
});
