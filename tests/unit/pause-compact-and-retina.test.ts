/**
 * The shared chapter panel and the retina plate choice, from the pause fix.
 *
 * This file used to carry four more tests: two on `hintBandPx` and two on the
 * old pause stylesheet's compact grid. **Both are gone with the thing they
 * described.** The Until Dawn remake (Bailey, 21 Sep 2026, "B, yes, yes, yes")
 * has no hint strip to reserve a band for and no two-column grid to stack, so
 * `hintBandPx`, `--pause-hint-band` and the `.pause__rail` / `.pause__panel`
 * scroll boxes no longer exist. What replaced them is pinned by
 * `pause-remake-css.test.ts`; the history is in `docs/handoff/fix3-pause.md`
 * and `docs/handoff/pause-remake.md`.
 *
 * What is left here is the half that was never about the pause layout: the
 * shared `chapter-panel.css` type floor on the letterboxed ground (party prep
 * still uses it), and `coverSourceWidth` / `pickHeroBackgroundUrl` — the
 * arithmetic that decides whether a box gets the 1344px plate or the 2688px
 * master. The pause screen still leans on the second of those through
 * `pause/PortraitStage.ts`.
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { coverSourceWidth, pickHeroBackgroundUrl } from '../../src/ui/common/chapterPanel.ts';

const HERE = dirname(fileURLToPath(import.meta.url));
const CPANEL_SHEET = readFileSync(join(HERE, '..', '..', 'src', 'ui', 'common', 'chapter-panel.css'), 'utf8');
const PREPCHAP_SHEET = readFileSync(
  join(HERE, '..', '..', 'src', 'ui', 'ffx', 'party-prep', 'chapter-panel-tab.css'),
  'utf8',
);

/** The body of one plain selector's rule, by its exact source text. */
function ruleBlock(sheet: string, selector: string): string {
  const at = sheet.indexOf(`${selector} {`) >= 0 ? sheet.indexOf(`${selector} {`) : sheet.indexOf(`${selector}{`);
  expect(at, `"${selector}" is gone from the sheet`).toBeGreaterThan(-1);
  const from = sheet.indexOf('{', at);
  let depth = 0;
  for (let i = from; i < sheet.length; i++) {
    if (sheet[i] === '{') depth++;
    else if (sheet[i] === '}' && --depth === 0) return sheet.slice(from, i);
  }
  throw new Error(`unterminated block for ${selector}`);
}

/**
 * The `--cp-fs-<name>` token's declared grid-px base, read out of
 * `chapter-panel.css` rather than re-typed — so a test that pins the floor
 * arithmetic breaks the moment the token stops being `max(calc(N *
 * var(--cp-u)), var(--cp-fs-floor))`, which is exactly the shape the fix
 * requires and the shape the pre-fix file did not have (either no floor arm
 * at all, or the capped `min()` on the caption alone).
 */
function tokenFloorBase(name: string): number {
  const re = new RegExp(
    `--cp-fs-${name}:\\s*max\\(\\s*calc\\(([\\d.]+)\\s*\\*\\s*var\\(--cp-u\\)\\)\\s*,\\s*var\\(--cp-fs-floor\\)\\s*\\)`,
  );
  const m = re.exec(CPANEL_SHEET);
  expect(m, `--cp-fs-${name} is not a max(grid-value, --cp-fs-floor) token`).not.toBeNull();
  return Number(m![1]);
}

/** `min(w/640, h/360)` — `LetterboxStage.createStage`'s own formula. */
function lbScale(w: number, h: number): number {
  return Math.min(w / 640, h / 360);
}

/** The six viewports the brief names for the shared chapter panel's floor. */
const FLOOR_VIEWPORTS = [
  [1280, 720],
  [1600, 900],
  [1920, 1080],
  [2560, 1440],
  [3840, 2160],
  [390, 844],
] as const;

// --------------------------------------- the shared chapter panel's type floor

describe('the shared chapter panel clears the 14px floor on the letterboxed ground', () => {
  // Every text token the prep tab's CHAPTER tab actually renders (no ledger —
  // `ChapterPanel.ts` never calls `dossierHtml`, so the numeral/count tokens
  // are excluded; `--cp-fs-where` is excluded too, since `.prepchap__cols
  // .cpanel__where { display: none }` hides it on that ground).
  const TOKENS = ['eyebrow', 'title', 'subtitle', 'body', 'label', 'head', 'tip', 'caption'];

  it('every token is max(grid value, the --lb-scale floor), not a capped or absent one', () => {
    // This is what the verifier's four-of-six-viewports failure actually was:
    // every token but the caption had no floor at all, and the caption's own
    // floor was capped at a fixed grid-px ceiling (`min(..., 5.6 * --cp-u)`)
    // that stopped binding above ~2.5x stage scale. `tokenFloorBase` throws if
    // a token is not literally `max(calc(N * var(--cp-u)), var(--cp-fs-floor))`,
    // so this fails exactly as it would have against either shape of the bug.
    for (const name of TOKENS) tokenFloorBase(name);
    expect(CPANEL_SHEET).toMatch(/--cp-fs-floor:\s*calc\(14px \/ var\(--lb-scale,\s*1\)\)/);
    // The old cap is gone, not just unused.
    expect(CPANEL_SHEET).not.toMatch(/min\(calc\(14px/);
  });

  it('the pre-fix shape genuinely failed at the brief\'s viewports (proves the floor is load-bearing)', () => {
    // Not a check that `max(base, floor)` clears 14px — that is true by
    // definition of `max` for any `base`, at any scale, and asserting it
    // would be exactly the tautology the verifier's finding (5) is about.
    // What is worth pinning is that the *pre-fix* shape — the bare grid value
    // with no floor arm at all, which is what every one of these tokens but
    // the caption actually was — really did fail, so the floor this pass adds
    // is fixing a real defect and not standing in front of one that could
    // never have happened. `tokenFloorBase` reads today's `max(...)` token
    // and returns its first argument, which is exactly that pre-fix value.
    let anyBelowFloor = false;
    for (const name of TOKENS) {
      const base = tokenFloorBase(name);
      for (const [w, h] of FLOOR_VIEWPORTS) {
        if (base * lbScale(w, h) < 14) anyBelowFloor = true;
      }
    }
    expect(anyBelowFloor, 'no token\'s bare grid value ever missed 14px — the floor would be dead code').toBe(true);
  });

  it('no longer bypasses the shared tokens with an unfloored literal size', () => {
    // The prep tab's own `chapter-panel-tab.css` used to set `font-size:
    // 16.89px` / `5.11px` / `4.44px` on the title, the blurb and the caption
    // directly — a literal grid-px value at higher selector specificity than
    // the shared `.cpanel__title` / `.cpanel__blurb` rules, so fixing the
    // token in `chapter-panel.css` alone would have changed nothing here.
    // None of the three should set `font-size` at all any more; `.cpanel__title`
    // had nothing else to say once its `font-size` was gone, so that whole
    // rule is gone with it — a selector this looks for and does not find is a
    // pass, not a broken test, so it is checked for separately from the two
    // that still exist for other properties.
    expect(PREPCHAP_SHEET, 'the title override should be gone entirely, not just its font-size').not.toMatch(
      /\.prepchap__cols \.cpanel__title\s*\{/,
    );
    for (const cls of ['cpanel__blurb', 'cpanel__snap-cap']) {
      const block = ruleBlock(PREPCHAP_SHEET, `.prepchap__cols .${cls}`);
      expect(block, `.prepchap__cols .${cls} still sets its own font-size`).not.toMatch(/font-size:/);
    }
    // And the caption's nowrap/ellipsis pair — the mechanism a previous pass
    // asked "the tab's owner" to delete — is gone, not merely out-specificity'd.
    const capBlock = ruleBlock(PREPCHAP_SHEET, '.prepchap__cols .cpanel__snap-cap');
    expect(capBlock).not.toMatch(/white-space:\s*nowrap/);
    expect(capBlock).not.toMatch(/text-overflow:\s*ellipsis/);
  });

  it('gives each column of the tab a definite, scrollable height', () => {
    // `chapter-panel.css`'s comment above `.cpanel:not(.cpanel--fluid)
    // .cpanel__snap .cpanel__snap-img` explains why: at the smallest stage
    // scale (a phone) the floor can ask a column for several times its old
    // grid-px height, more than the fixed 120px band can show even wrapped.
    // Without a bounded row the column would grow past the band and get
    // silently clipped by `.prepchap`'s own `overflow: hidden`; with one, it
    // scrolls instead — read, not lost.
    const cols = ruleBlock(PREPCHAP_SHEET, '.prepchap__cols');
    expect(cols).toMatch(/grid-template-rows:\s*minmax\(0,\s*1fr\)/);
    const col = ruleBlock(PREPCHAP_SHEET, '.prepchap__col');
    expect(col).toMatch(/overflow-y:\s*auto/);
  });
});

// ------------------------------------------- the prep tab's hero background

describe('the prep tab\'s hero plate picks the master its box actually needs', () => {
  const URL_1X = 'art/pause/ch1-seymour-flux.png';
  const URL_2X = 'art/pause/ch1-seymour-flux.2x.webp';

  it('upgrades at the verifier\'s own 3840x2160 measurement (2186.6x720, magnified 1.63x on the 1x plate)', () => {
    expect(pickHeroBackgroundUrl(URL_1X, URL_2X, 2186.6, 720)).toBe(URL_2X);
    // And the master itself is a downscale there, not an upscale.
    expect(coverSourceWidth(2186.6, 720) / 2688).toBeLessThan(1.1);
  });

  it('never asks for the master when no manifest opinion exists yet', () => {
    expect(pickHeroBackgroundUrl(URL_1X, null, 4000, 4000)).toBe(URL_1X);
  });

  it('does not over-fetch a small phone box even at a high DPR', () => {
    // A prep-tab hero box at 390x844 (lb-scale 0.609): roughly 365 CSS px
    // wide by 73 tall. `coverSourceWidth` is width-driven there (365 > 73 *
    // 1.75), so even DPR 3 only asks for 1095 physical px — under the 1x
    // plate's own 1344, so the retina master would be pure waste.
    expect(pickHeroBackgroundUrl(URL_1X, URL_2X, 365, 73, 3)).toBe(URL_1X);
  });

  it('still answers only the 1x plate on a 720p window, unchanged from before', () => {
    expect(pickHeroBackgroundUrl(URL_1X, URL_2X, 1280, 366, 1)).toBe(URL_1X);
  });
});

// ------------------------------------------------- failure 4: which file to fetch

describe('the plate is chosen for the box it has to cover, not its width', () => {
  it('asks for the 2688 master on a 390x844 phone, which 100vw did not', () => {
    // `sizes="100vw"` asked for 390 CSS px; at DPR 3 that is 1170 physical,
    // which a 1344w candidate satisfies. But cover has to fill 1170x2532, so
    // the 768px-tall source was magnified 3.30x — exactly the "low-resolution
    // image blown up" this round is about, on the screen where it shows most.
    const need = coverSourceWidth(390, 844);

    expect(need).toBe(1477); // = ceil(844 * 1.75), the height-driven axis
    expect(need).toBeGreaterThan(1344); // so the 1x plate can no longer answer
    // The magnification the master implies, against the one it replaces.
    expect((844 * 3) / 1536).toBeLessThan(2);
    expect((844 * 3) / 768).toBeGreaterThan(3);
  });

  it('asks for the master on a 4:3 portrait tablet too', () => {
    // The verifier's second instance of the same mechanism, at DPR 1.
    expect(coverSourceWidth(768, 1024)).toBe(1792);
    expect(coverSourceWidth(768, 1024)).toBeGreaterThan(1344);
  });

  it('still asks for only the 1x plate on a 720p window', () => {
    // Confirmed-good behaviour from pass 1 that this must not disturb: `.png`
    // at 1280 and below, the master from 1366 up.
    expect(coverSourceWidth(1280, 720)).toBeLessThanOrEqual(1344);
    expect(coverSourceWidth(1366, 768)).toBeGreaterThan(1344);
  });

  it('is whatever the more demanding axis asks for, at every aspect', () => {
    // Wider than 1.75:1 is width-driven; anything narrower is height-driven.
    expect(coverSourceWidth(2560, 1080)).toBe(2560);
    expect(coverSourceWidth(3440, 1440)).toBe(3440);
    expect(coverSourceWidth(2000, 1012)).toBe(2000);
    expect(coverSourceWidth(1000, 1000)).toBe(1750);
  });

  it('refuses to answer for a box that is not laid out yet', () => {
    // A hidden prep tab, or the tick before first layout. The caller falls
    // back to the window rather than writing a nonsense hint.
    expect(coverSourceWidth(0, 0)).toBe(0);
    expect(coverSourceWidth(390, 0)).toBe(0);
    expect(coverSourceWidth(Number.NaN, 844)).toBe(0);
  });
});
