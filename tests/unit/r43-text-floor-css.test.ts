/**
 * The 14 px floor on party prep, results, the first-run guide, Chapter XII's disc strip and the Sensor chips — PR-0356 and
 * PR-0391 (round 25, `critic/rounds/round-25.json`; CHK-003 and CHK-009).
 *
 * Round 25's DOM sweep found, at 1600x900: the prep hint strip, the roster-slot role and the Sphere Grid's M and H key chips at
 * 11.7 to 12.2 px, the results sub-lines at 12.2 to 13.3 px, the first-run guide's "Esc skip the guide" at 12 px, Chapter IX's
 * guard labels at 12.2 px and Chapter XII's disc strip at 12 to 13 px; at 3840x2160 the Sensor card's six affinity chips printed
 * over each other ("FIR CHU CE WA HO GRAV").
 *
 * The stage-scaled sheets are authored in 640x360 grid px (`LetterboxStage.ts` scales them by `min(w / 640, h / 360)` and
 * publishes it as `--lb-scale`), so a flat px raise cannot clear every window; the floor is applied to the RENDERED size the way
 * `advisor-card-css-type-floor.test.ts` does for the advisor card: a size under 7.05 grid px (14.1 px at the smallest window the
 * floor is on, 1280x720, scale 2) is `max(its size, var(--stage-floor, 0px))`, and `stage-floor.css` makes the variable 14.1 px
 * over the scale inside a 1280x720 window or wider and 0 below it (the phone and the tablet keep their authored sizes). The
 * Sphere Grid, drawn on a 1600x900 frame with no slack in its legend and card, has its own gate (`--stage-floor-frame`, from a
 * 1600x900 window, 5.64 grid px). This file parses the sheets, finds every `font-size`, fails on a bare one under the line, and
 * evaluates the arithmetic the way a browser would at CHK-002's viewports. No jsdom: custom-property arithmetic is not
 * something jsdom resolves.
 *
 * Game case: prep (`party-prep.css`, `stage-floor.css`) and results are shared screens (both); `.ffxprep-*`, the Sphere Grid and
 * Chapter XII are FFX only; `.x2prep-*` is FFX-2 only. Each sheet's header says so.
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const read = (rel: string): string => readFileSync(join(ROOT, rel), 'utf8');

// ----------------------------------------------------------------------------- a small CSS reader

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

interface SizeDecl {
  sel: string;
  at: string;
  value: string;
}

function fontSizes(css: string): SizeDecl[] {
  const out: SizeDecl[] = [];
  for (const r of leafRules(css)) {
    for (const m of r.body.matchAll(/font-size:\s*([^;]+);/g)) out.push({ sel: r.sel, at: r.at, value: m[1]!.trim() });
  }
  return out;
}

/** `max(6px, var(--stage-floor, 0px))` -> { size: '6px', variable: '--stage-floor' }. */
function floored(value: string): { size: string; variable: string } | null {
  const m = /^max\(\s*([\d.]+(?:px|em))\s*,\s*var\((--[a-z-]+),\s*0px\)\s*\)$/.exec(value);
  return m ? { size: m[1]!, variable: m[2]! } : null;
}

// ----------------------------------------------------------------------------- the viewports

/** CHK-002's list, less the phone (the floor is off below a 1280x720 window by design). */
const VIEWPORTS: ReadonlyArray<readonly [string, number, number]> = [
  ['1280x720', 1280, 720],
  ['1600x900', 1600, 900],
  ['2000x1012', 2000, 1012],
  ['2560x1080', 2560, 1080],
  ['3840x2160', 3840, 2160],
];
/** `min(w / 640, h / 360)`, `LetterboxStage.ts`'s own formula (what the stage publishes as `--lb-scale`). */
const stageScale = (w: number, h: number): number => Math.min(w / 640, h / 360);
const FLOOR_PX = 14.1;
/** The smallest scale the floor is on at (a 1280x720 window): a grid size at or over this clears the floor on its own. */
const MIN_SCALE = 2;
const SAFE_GRID_PX = FLOOR_PX / MIN_SCALE; // 7.05

// ----------------------------------------------------------------------------- stage-floor.css

describe('stage-floor.css: each variable is 14.1 px over the stage scale inside its window query, and 0 outside it', () => {
  const sheet = read('src/ui/common/stage-floor.css');
  const rules = leafRules(sheet);
  const GATES = [
    { variable: '--stage-floor', at: '@media (min-width: 1280px) and (min-height: 720px)' },
    { variable: '--stage-floor-frame', at: '@media (min-width: 1600px) and (min-height: 900px)' },
  ] as const;

  it('is 0px at the top level (the phone and the tablet keep their authored sizes)', () => {
    const top = rules.filter((r) => r.at === '' && /--stage-floor/.test(r.body));
    expect(top.map((r) => r.sel)).toEqual(['.prep__stage, .rres__stage']);
    for (const g of GATES) expect(top[0]!.body, g.variable).toMatch(new RegExp(`${g.variable}:\\s*0px;`));
  });

  for (const g of GATES) {
    it(`${g.variable} is calc(14.1px / var(--lb-scale, 1)) only inside ${g.at}`, () => {
      const inside = rules.filter((r) => r.at === g.at && r.body.includes(`${g.variable}:`));
      expect(inside.map((r) => r.sel)).toEqual(['.prep__stage, .rres__stage']);
      expect(inside[0]!.body).toMatch(new RegExp(`${g.variable}:\\s*calc\\(14\\.1px / var\\(--lb-scale, 1\\)\\);`));
    });
  }

  it('nothing else in the sheet sets a nonzero floor', () => {
    const nonzero = rules.filter((r) => /--stage-floor(?:-frame)?:\s*(?!0px)\S/.test(r.body));
    expect(nonzero.map((r) => r.at).sort()).toEqual(GATES.map((g) => g.at).sort());
  });

  it('the frame gate is the smaller window set: 1600x900 is a 2.5x stage, and nothing narrower than 1600 or shorter than 900 opens it', () => {
    expect(stageScale(1600, 900)).toBe(2.5);
    for (const [w, h] of [[1599, 900], [1600, 899], [1280, 720], [1024, 768]] as const) {
      expect(w >= 1600 && h >= 900, `${w}x${h}`).toBe(false);
      expect(stageScale(w, h)).toBeLessThan(2.5);
    }
  });

  it('is @imported by the two sheets that use it (never an orphan, and defined wherever they are loaded)', () => {
    // A CSS @import, not a new line in PartyPrepScreen.ts / ResultsScreen.ts, which are at and over the 400-line house rule.
    expect(read('src/ui/common/party-prep.css')).toMatch(/^@import '\.\/stage-floor\.css';$/m);
    expect(read('src/ui/common/results.css')).toMatch(/^@import '\.\/stage-floor\.css';$/m);
  });

  it('the party-prep and results sheets are the only place the sphere-grid, FFX-2 and prep panels get it from (no panel sheet redefines it)', () => {
    for (const rel of ['src/ui/ffx/party-prep/party-prep.css', 'src/ui/ffx2/party-prep/party-prep.css', 'src/ui/ffx/party-prep/sphere-grid-b.css', 'src/ui/ffx/party-prep/sphere-grid-b-card.css']) {
      expect(read(rel), rel).not.toMatch(/--stage-floor(?:-frame)?:/);
    }
  });

  it('a window of 1280x720 or more is always drawn at 2x or more (so 7.05 grid px clears 14.1 px there)', () => {
    for (const [, w, h] of VIEWPORTS) expect(stageScale(w, h)).toBeGreaterThanOrEqual(MIN_SCALE);
    expect(SAFE_GRID_PX * MIN_SCALE).toBeCloseTo(FLOOR_PX, 10);
  });
});

// ----------------------------------------------------------------------------- the stage-scaled sheets

interface Sheet {
  file: string;
  /** The custom property that carries this sheet's floor, in this sheet's own px. */
  variable: string;
  /** A declaration that sits in the grid's px instead (the sphere-grid key chip lives on the stage, not in a 0.4-scaled card). */
  alsoVariables?: readonly string[];
  /** Own px per grid px (1 for the 640x360 grid sheets, 2.5 for the 1600x900 frame the sphere-grid cards are drawn at). */
  frameToGrid: number;
  /** The window the floor is on from (stage-floor.css): the 1280x720 gate, or the 1600x900 frame gate of the Sphere Grid. */
  gate: { minW: number; minH: number };
}

const GATE_STAGE = { minW: 1280, minH: 720 } as const;
const GATE_FRAME = { minW: 1600, minH: 900 } as const;

const SHEETS: readonly Sheet[] = [
  { file: 'src/ui/common/party-prep.css', variable: '--stage-floor', frameToGrid: 1, gate: GATE_STAGE },
  { file: 'src/ui/ffx/party-prep/party-prep.css', variable: '--stage-floor', frameToGrid: 1, gate: GATE_STAGE },
  { file: 'src/ui/ffx2/party-prep/party-prep.css', variable: '--stage-floor', frameToGrid: 1, gate: GATE_STAGE },
  { file: 'src/ui/common/results.css', variable: '--stage-floor', frameToGrid: 1, gate: GATE_STAGE },
  // The Sphere Grid was drawn on a 1600x900 frame and packs its legend and card with no slack: its floor is on from 1600x900.
  { file: 'src/ui/ffx/party-prep/sphere-grid-b.css', variable: '--stage-floor-frame', frameToGrid: 1, gate: GATE_FRAME },
  { file: 'src/ui/ffx/party-prep/sphere-grid-b-card.css', variable: '--stage-floor-frame', frameToGrid: 1, gate: GATE_FRAME },
  // The explainer and result cards: drawn at 1600x900 sizes inside a box scaled by 0.4 (`--sgx-floor` is 2.5 frame floors).
  { file: 'src/ui/ffx/party-prep/sphere-grid-help.css', variable: '--sgx-floor', alsoVariables: ['--stage-floor-frame'], frameToGrid: 2.5, gate: GATE_FRAME },
];

describe('every font-size of the prep, sphere-grid and results sheets clears the 14 px floor', () => {
  for (const sheet of SHEETS) {
    describe(sheet.file, () => {
      const css = read(sheet.file);
      const decls = fontSizes(css);
      /** The smallest stage scale the sheet's floor is on at, and so the smallest grid size that clears 14.1 px on its own. */
      const minScale = stageScale(sheet.gate.minW, sheet.gate.minH);
      /** A size at or over this (in the sheet's own px) is 14.1 px or more at the smallest window the floor is on. */
      const safe = (FLOOR_PX / minScale) * sheet.frameToGrid;

      it('finds the sheet\'s sizes', () => {
        expect(decls.length).toBeGreaterThan(5);
      });

      it('has no bare size under the line (each one is `max(its size, var(floor))` or already big enough)', () => {
        const bare = decls.filter((d) => {
          const f = floored(d.value);
          if (f) return false;
          const px = /^([\d.]+)px$/.exec(d.value);
          return !px || Number(px[1]) < safe;
        });
        expect(bare.map((d) => `${d.sel} { font-size: ${d.value} }`)).toEqual([]);
      });

      it('wraps only in the variable this sheet\'s own space uses', () => {
        for (const d of decls) {
          const f = floored(d.value);
          if (f) expect([sheet.variable, ...(sheet.alsoVariables ?? [])], d.sel).toContain(f.variable);
        }
      });

      for (const [label, w, h] of VIEWPORTS.filter(([, w, h]) => w >= sheet.gate.minW && h >= sheet.gate.minH)) {
        it(`reads 14 px or more at ${label}`, () => {
          const scale = stageScale(w, h);
          const stageFloor = FLOOR_PX / scale; // 14.1 px in grid px
          const under: string[] = [];
          for (const d of decls) {
            const f = floored(d.value);
            // Own px per grid px: the card's frame for a --sgx-floor size, the grid itself for a --stage-floor one.
            const unit = f ? (f.variable === '--sgx-floor' ? 2.5 : 1) : sheet.frameToGrid;
            const px = f ? /^([\d.]+)px$/.exec(f.size) : /^([\d.]+)px$/.exec(d.value);
            // An em size inherits the parent's: the floor still holds, because the larger of the two terms is taken.
            const own = px ? Number(px[1]) : 0;
            const rendered = (f ? Math.max(own, stageFloor * unit) : own) * (scale / unit);
            if (rendered < 14.05) under.push(`${d.sel} = ${d.value} -> ${rendered.toFixed(2)} px`);
          }
          expect(under).toEqual([]);
        });
      }
    });
  }
});

describe('the sphere-grid cards carry their own floor, derived from the frame floor', () => {
  const css = read('src/ui/ffx/party-prep/sphere-grid-help.css');

  it('declares --sgx-floor as 2.5 frame floors on the layer, and the key chip uses the frame floor itself', () => {
    expect(css).toMatch(/--sgx-floor:\s*calc\(var\(--stage-floor-frame, 0px\) \* 2\.5\);/);
    const key = fontSizes(css).find((d) => d.sel === '.ffxprep-sg__key');
    expect(key?.value).toBe('max(0.78em, var(--stage-floor-frame, 0px))');
  });

  it('draws the cards at 1600x900 sizes inside a box scaled by 0.4 (the 2.5 above)', () => {
    expect(css).toMatch(/\.sgx-card-pos \{[^}]*transform:\s*scale\(0\.4\)/);
  });
});

describe('the Sphere Grid legend keeps the footprint it had at 1600x900 once its type is floored (PR-0356)', () => {
  const rules = leafRules(read('src/ui/ffx/party-prep/sphere-grid-b-card.css'));
  const lineHeightOf = (sel: string): string | undefined => {
    const r = rules.find((x) => x.sel === sel && x.at.includes('min-width: 600px'));
    return r ? /line-height:\s*([^;]+);/.exec(r.body)?.[1]?.trim() : undefined;
  };

  it('gives the three legend type sizes the line height the browser gave them at the authored size', () => {
    // The font's ascent and descent are rounded to whole px, so 5.2 -> 5.64 px of type would cost every line one whole grid px
    // (the kicker 14 -> 16, a chip 7 -> 8: the gold line landed under START BATTLE at 1600x900, measured). Absolute values
    // keep the rows where they were.
    expect(lineHeightOf('.sgb-kicker--gold')).toBe('7px');
    expect(lineHeightOf('.sgb-chip')).toBe('7px');
    expect(lineHeightOf('.sgb-legend__gold')).toBe('7px');
  });

  it('and 5.64 px of type fits those lines (the floor never exceeds 5.64 grid px from a 1600x900 window)', () => {
    expect(FLOOR_PX / stageScale(1600, 900)).toBeCloseTo(5.64, 10);
    expect(5.64).toBeLessThan(7);
  });
});

// ----------------------------------------------------------------------------- the first-run guide

describe('first-run.css: nothing the guide prints is under 14 px, on a desktop or a phone (CHK-003)', () => {
  const css = read('src/ui/coach/first-run.css');
  const decls = fontSizes(css);

  it('finds the guide\'s sizes in both the desktop and the phone block', () => {
    expect(decls.some((d) => d.at === '')).toBe(true);
    expect(decls.some((d) => d.at.includes('max-width: 900px'))).toBe(true);
  });

  it('every size is calc(Npx * var(--pyr-ts, 1)) with N of 14 or more (the TEXT SIZE multiplier is 1 or more)', () => {
    for (const d of decls) {
      const m = /^calc\(([\d.]+)px \* var\(--pyr-ts, 1\)\)$/.exec(d.value);
      expect(m, `${d.sel} { font-size: ${d.value} }`).not.toBeNull();
      expect(Number(m![1]), `${d.sel} (${d.at || 'desktop'})`).toBeGreaterThanOrEqual(14);
    }
  });
});

// ----------------------------------------------------------------------------- Chapter XII's strip

describe('omnis-readout.css: the landscape strip clears 14 px from a 1280x720 window up (PR-0356)', () => {
  const css = read('src/ui/ffx/omnis-readout.css');
  const PHONE_MARK = '/* -------------------------------------------------------------------- phone */';
  const landscape = css.split(PHONE_MARK)[0]!;
  const phone = css.split(PHONE_MARK)[1]!;
  const decls = fontSizes(landscape);

  /** The frame is the picked frames' 1600x900 scaled by 0.4 into the stage: a frame px is 0.4 grid px. */
  const rendered = (value: string, w: number, h: number): number => {
    const scale = stageScale(w, h);
    const f = floored(value);
    const px = Number(/^([\d.]+)px$/.exec(f ? f.size : value)![1]);
    const floorFrame = (FLOOR_PX * 2.5) / scale;
    return (f ? Math.max(px, floorFrame) : px) * 0.4 * scale;
  };

  it('declares --omr-floor as 2.5 hud floors, in the landscape mode only and only inside the 1280x720 query', () => {
    expect(css).toMatch(/\.ffx-omr \{[^}]*--omr-floor:\s*0px;/);
    expect(css).toMatch(/@media \(min-width: 1280px\) and \(min-height: 720px\) \{\s*\.ffx-omr:not\(\.ffx-omr--phone\) \{\s*--omr-floor:\s*calc\(var\(--hud-floor, 0px\) \* 2\.5\);/);
  });

  it('wraps every landscape size under 17.7 frame px (where a 1280x720 window puts the floor)', () => {
    expect(decls.length).toBeGreaterThanOrEqual(7);
    for (const d of decls) {
      const f = floored(d.value);
      if (f) expect(f.variable, d.sel).toBe('--omr-floor');
      else expect(Number(/^([\d.]+)px$/.exec(d.value)![1]), `${d.sel} { font-size: ${d.value} }`).toBeGreaterThanOrEqual(17.6);
    }
  });

  for (const [label, w, h] of VIEWPORTS) {
    it(`every landscape size renders at 14 px or more at ${label}`, () => {
      const under = decls.map((d) => ({ d, r: rendered(d.value, w, h) })).filter(({ r }) => r < 14.05);
      expect(under.map(({ d, r }) => `${d.sel} = ${d.value} -> ${r.toFixed(2)}`)).toEqual([]);
    });
  }

  it('every phone size is its own 14 px or more (the phone mode never reads --omr-floor)', () => {
    const sizes = fontSizes(phone).map((d) => Number(/^([\d.]+)px$/.exec(d.value)![1]));
    expect(sizes.length).toBeGreaterThanOrEqual(7);
    for (const px of sizes) expect(px).toBeGreaterThanOrEqual(14);
  });
});

// ----------------------------------------------------------------------------- the Sensor card's chips

describe('hud-floor.css: the Sensor chips keep three columns at every window from 2.35x up (PR-0391)', () => {
  const css = read('src/ui/common/hud-floor.css');
  /** The card is 100 grid px wide with 8 px of padding a side; the chips are 6 of them with a 2 px gap (`ffx-hud.css`). */
  const INNER = 100 - 16;
  const GAP = 2;
  const CHIPS = 6;
  const AUTHORED = 6;

  /** How many columns `repeat(auto-fit, minmax(min, 1fr))` makes of the chips, capped at the chips there are. */
  const columns = (minTrack: number): number => Math.min(CHIPS, Math.max(1, Math.floor((INNER + GAP) / (minTrack + GAP))));
  const oldMin = (scale: number): number => (FLOOR_PX / scale) * 4.2;
  const newMin = (scale: number): number => Math.max(AUTHORED, FLOOR_PX / scale) * 4.2;

  it('the rule takes the larger of the authored 6 px and the floor as the column\'s base', () => {
    expect(css).toContain('grid-template-columns: repeat(auto-fit, minmax(calc(max(6px, var(--hud-floor)) * 4.2), 1fr));');
    expect(css).toMatch(/\.ffx-sensor__chip \{ font-size: max\(6px, var\(--hud-floor\)\); \}/);
  });

  it('measured in the browser by round 25: the old rule made 7 columns at 3840x2160 and 5 at 2560x1440', () => {
    expect(columns(oldMin(stageScale(3840, 2160)))).toBe(6); // 7 tracks for 6 chips: all six on one row
    expect(Math.floor((INNER + GAP) / (oldMin(stageScale(3840, 2160)) + GAP))).toBe(7);
    expect(columns(oldMin(stageScale(2560, 1440)))).toBe(5);
  });

  it('the new rule is three columns at 1600x900, 2000x1012, 2560x1080, 2560x1440 and 3840x2160 (two rows of three, as authored)', () => {
    for (const [w, h] of [[1600, 900], [2000, 1012], [2560, 1080], [2560, 1440], [3840, 2160]] as const) {
      expect(columns(newMin(stageScale(w, h))), `${w}x${h}`).toBe(3);
    }
  });

  it('and is the old rule wherever the floor is the larger term (1280x720: two columns, as before)', () => {
    const s = stageScale(1280, 720);
    expect(newMin(s)).toBeCloseTo(oldMin(s), 10);
    expect(columns(newMin(s))).toBe(2);
  });
});

// ----------------------------------------------------------------------------- the strategy guide's document head

describe('hud-floor.css floors every strategy-guide size under 7.05 grid px, with the size strategy-guide.css authors (1280x720 follow-up)', () => {
  const floorRules = leafRules(read('src/ui/common/hud-floor.css'));
  const guideSizes = fontSizes(read('src/ui/common/strategy-guide.css'));

  /** The `max(Npx, var(--hud-floor))` N that hud-floor.css gives a `.sgd` class, or undefined when it does not floor it. */
  const flooredAs = (cls: string): number | undefined => {
    for (const r of floorRules) {
      const sels = r.sel.split(',').map((s) => s.trim());
      if (!sels.some((s) => s.endsWith(`.sgd ${cls}`))) continue;
      const m = /font-size:\s*max\(([\d.]+)px,\s*var\(--hud-floor\)\)/.exec(r.body);
      if (m) return Number(m[1]);
    }
    return undefined;
  };

  it('every .sgd__* class the guide sets under 7.05 grid px is floored at the size the guide authors', () => {
    const small = guideSizes
      .map((d) => ({ cls: /^\.(sgd__[\w-]+)$/.exec(d.sel)?.[1], px: /^([\d.]+)px$/.exec(d.value) }))
      .filter((d): d is { cls: string; px: RegExpExecArray } => d.cls !== undefined && d.px !== null && Number(d.px[1]) < 7.05);
    expect(small.length).toBeGreaterThanOrEqual(7);
    const unfloored = small.filter((d) => flooredAs(`.${d.cls}`) === undefined).map((d) => d.cls);
    // `.sgd__panel` is the guide's own box and is floored under its panel selector; the rest are the head's classes.
    expect(unfloored).toEqual([]);
    for (const d of small) expect(flooredAs(`.${d.cls}`), d.cls).toBe(Number(d.px[1]));
  });
});
