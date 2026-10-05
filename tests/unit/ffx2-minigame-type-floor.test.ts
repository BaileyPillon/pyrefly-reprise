/**
 * FOC371-03 and FOC371-04 (focused review of f4244e1f; FFX-2 only; CHK-003): the Trigger Happy slab and the Lady Luck
 * reels overlay printed their labels under the 14 effective px floor: MASH TAP 5.33 px and 0 HITS 5.78 px on the
 * 390x844 phone, MASH R 13.33 px at 1600x900, and (the grid lane's note) the reel symbols and the DUD line about 5 px on
 * the phone, 12.8 px at 1024x768.
 *
 * The overlays are authored on the 640x360 grid and scaled by the stage, so one flat px cannot clear every window; the
 * fix is the one `move-advisor.css` already uses (`advisor-card-css-type-floor.test.ts`): every size on the two overlays
 * is `max(authored, floor)`, where the floor is 14.2 effective px written in grid px from the scale the HUD publishes
 * (`--lb-scale`; the phone draws the grid 1:1, so 1 there). This file evaluates that arithmetic on the sheet's own
 * text, the way a browser would, at the four windows the review names. No jsdom: custom-property arithmetic is
 * resolved by the browser at layout time, which is where docs/handoff/r38-polish.md measured it (the real HUD in a real
 * browser at nine window sizes, and the real game at three).
 *
 * **Game case: FFX-2 only.** Both overlays are X-2 abilities and this is the FFX-2 HUD's own sheet; the FFX overlays
 * share the `.ig-minigame` shell but are scoped by `.ffx-mg` and are untouched.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const SHEET = readFileSync('src/ui/ffx2/minigames.css', 'utf8');
const SHELL = readFileSync('src/ui/inkgold/screens.css', 'utf8');

const FLOOR_PX = 14; // CHK-003's pass line
const FLOOR_NUMERATOR_PX = 14.2; // the sheet's own, with a small margin over the ask

/** `[label, width, height, phone layout]`: `FFX2BattleHud.layout` scales the stage by min(w / 640, h / 360); the phone layout draws it 1:1. */
const VIEWPORTS: ReadonlyArray<readonly [string, number, number, boolean]> = [
  ['390x844 (phone layout)', 390, 844, true],
  ['1024x768', 1024, 768, false],
  ['1600x900', 1600, 900, false],
  ['2000x1012', 2000, 1012, false],
];
const scaleOf = (w: number, h: number, phone: boolean): number => (phone ? 1 : Math.min(w / 640, h / 360));

const stripComments = (css: string): string => css.replace(/\/\*[\s\S]*?\*\//g, '');

/** Every rule block with its selector (nested at-rule preludes fall away; the inner rules match on their own). */
function blocks(css: string): ReadonlyArray<{ readonly selector: string; readonly body: string }> {
  const out: { selector: string; body: string }[] = [];
  for (const m of stripComments(css).matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    out.push({ selector: m[1]!.trim().replace(/\s+/g, ' '), body: m[2]! });
  }
  return out;
}

/** One `font-size` declaration, as authored: `max(Npx, var(--mg-fs-floor))` or a bare `Npx`. */
interface Size {
  readonly selector: string;
  readonly authoredPx: number;
  readonly floored: boolean;
}

function sizesOf(css: string): ReadonlyArray<Size> {
  const out: Size[] = [];
  for (const b of blocks(css)) {
    for (const d of b.body.matchAll(/font-size:\s*([^;]+);/g)) {
      const value = d[1]!.trim();
      const wrapped = /^max\(([\d.]+)px,\s*var\(--mg-fs-floor\)\)$/.exec(value);
      const bare = /^([\d.]+)px$/.exec(value);
      if (wrapped) out.push({ selector: b.selector, authoredPx: Number.parseFloat(wrapped[1]!), floored: true });
      else if (bare) out.push({ selector: b.selector, authoredPx: Number.parseFloat(bare[1]!), floored: false });
      else out.push({ selector: b.selector, authoredPx: Number.NaN, floored: false });
    }
  }
  return out;
}

/** The rendered size of one declaration at a given stage scale, in effective px. */
function effective(size: Size, scale: number): number {
  const px = size.floored ? Math.max(size.authoredPx, FLOOR_NUMERATOR_PX / scale) : size.authoredPx;
  return px * scale;
}

describe('FOC371-03/-04: no label on the Trigger Happy slab or the Lady Luck reels is under 14 effective px', () => {
  const sizes = sizesOf(SHEET);

  it('publishes the floor as 14.2 effective px in grid px, from the HUD’s own scale', () => {
    expect(SHEET).toContain('--mg-fs-floor: calc(14.2px / var(--lb-scale, 1));');
    // on both overlays' roots, so every leaf below them inherits it
    const root = blocks(SHEET).find((b) => /--mg-fs-floor:/.test(b.body));
    expect(root?.selector).toBe('.ffx2-trigger, .ffx2-reels');
  });

  it('wraps every font-size the sheet declares in the floor (no bare px left), and names the labels the review found', () => {
    expect(sizes.filter((s) => !s.floored).map((s) => `${s.selector}: ${s.authoredPx}px`)).toEqual([]);
    const bySelector = (sel: string): Size | undefined => sizes.find((s) => s.selector === sel);
    expect(bySelector('.ffx2-trigger .ig-minigame__subtitle, .ffx2-reels .ig-minigame__subtitle')?.authoredPx).toBe(5.33); // MASH TAP / MASH R / PRESS TO STOP
    expect(bySelector('.ffx2-trigger .ig-minigame__bonus')?.authoredPx).toBe(5.78); // 0 HITS
    // the reel symbols are pictures now (Lady Luck's timed reels, pick A of 2026-10-04): no text left to floor on a reel cell
    expect(bySelector('.ffx2-reels .ig-minigame__reel')).toBeUndefined();
    expect(sizes.filter((s) => /cell|win|reel$|__line/.test(s.selector)).map((s) => s.selector)).toEqual([]);
    expect(bySelector('.ffx2-reels__arrow')?.authoredPx).toBe(10); // the next-to-stop marker
    expect(bySelector('.ffx2-reels__warn')?.authoredPx).toBe(8); // DUD: -75% PARTY HP
  });

  for (const [label, w, h, phone] of VIEWPORTS) {
    it(`clears ${FLOOR_PX}px effective at ${label}`, () => {
      const scale = scaleOf(w, h, phone);
      const under = sizes
        .filter((s) => effective(s, scale) < FLOOR_PX)
        .map((s) => `${s.selector} = ${s.authoredPx}px authored -> ${effective(s, scale).toFixed(2)} effective`);
      expect(under).toEqual([]);
    });

    it(`the shell's own title (16.89 grid px, not overridden here) is above it at ${label}`, () => {
      const title = /\.ig-minigame__title\s*\{[^}]*font-size:\s*([\d.]+)px/.exec(SHELL)?.[1];
      expect(Number(title)).toBe(16.89);
      expect(Number(title) * scaleOf(w, h, phone)).toBeGreaterThanOrEqual(FLOOR_PX);
    });
  }

  it('does not shrink a size that was already comfortably above the floor', () => {
    // The DUD line (8 grid px) is 20 effective px at 1600x900; the floor must not clamp it down to 14.2.
    const warn = sizes.find((s) => s.selector === '.ffx2-reels__warn')!;
    expect(effective(warn, scaleOf(1600, 900, false))).toBeCloseTo(20, 5);
  });
});

describe('the Trigger Happy head takes a second line in a small window and stays one line otherwise', () => {
  const css = stripComments(SHEET);
  const query = /@media\s*\(max-width:\s*(\d+)px\),\s*\(max-height:\s*(\d+)px\)\s*\{([\s\S]*?)\n\}/.exec(css);

  it('is a window rule: under 960x540 (stage scale 1.5), which takes in every upright phone and keeps a 4:3 laptop on one line', () => {
    expect(query).not.toBeNull();
    expect(Number(query![1])).toBe(959);
    expect(Number(query![2])).toBe(539);
    // 960x540 is scale 1.5 exactly: the first window that keeps the one-line head, and the 4:3 1024x768 (1.6) keeps it
    expect(Math.min(960 / 640, 540 / 360)).toBe(1.5);
    expect(Math.min(1024 / 640, 768 / 360)).toBeGreaterThan(1.5);
  });

  it('moves only the Trigger Happy instruction onto its own row, under the title and the counter', () => {
    const inner = blocks(`${query![3]!}\n}`);
    const head = inner.find((b) => b.selector === '.ffx2-trigger .ig-minigame__head');
    const subtitle = inner.find((b) => b.selector === '.ffx2-trigger .ig-minigame__subtitle');
    expect(head?.body).toMatch(/flex-wrap:\s*wrap/);
    expect(subtitle?.body).toMatch(/order:\s*3/);
    expect(subtitle?.body).toMatch(/flex:\s*1 1 100%/);
    // Lady Luck has a rule of its own, under the same window query (see the next test): this one rearranges nothing of hers
    expect(inner.some((b) => /ffx2-reels/.test(b.selector))).toBe(false);
  });

  it('Lady Luck’s prompt names the input in use (PRESS ENTER TO STOP, PRESS CROSS TO STOP), so under the same window query it takes its own row too', () => {
    const queries = [...css.matchAll(/@media\s*\(max-width:\s*(\d+)px\),\s*\(max-height:\s*(\d+)px\)\s*\{([\s\S]*?)\n\}/g)];
    expect(queries.length).toBe(2);
    expect([Number(queries[1]![1]), Number(queries[1]![2])]).toEqual([959, 539]);
    const inner = blocks(`${queries[1]![3]!}\n}`);
    const head = inner.find((b) => b.selector === '.ffx2-reels .ig-minigame__head');
    const subtitle = inner.find((b) => b.selector === '.ffx2-reels .ig-minigame__subtitle');
    expect(head?.body).toMatch(/flex-wrap:\s*wrap/);
    expect(subtitle?.body).toMatch(/order:\s*3/);
    expect(subtitle?.body).toMatch(/flex:\s*1 1 100%/);
    expect(inner.some((b) => /ffx2-trigger/.test(b.selector))).toBe(false);
  });

  it('the Lady Luck arrow sits above the first reel at any size, with room reserved for it', () => {
    const arrow = blocks(SHEET).find((b) => b.selector === '.ffx2-reels__arrow');
    expect(arrow?.body).toMatch(/bottom:\s*100%/);
    expect(arrow?.body).toMatch(/line-height:\s*1\b/);
    const bar = blocks(SHEET).find((b) => b.selector === '.ffx2-reels .ig-minigame__bar--reel');
    expect(bar?.body).toMatch(/margin-top:\s*calc\(max\(10px,\s*var\(--mg-fs-floor\)\)\s*\+\s*2px\)/);
  });
});
