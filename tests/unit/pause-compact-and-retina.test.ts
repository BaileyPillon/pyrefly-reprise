/**
 * The pause screen, fix round 3 **pass 2**.
 *
 * Pass 1 made the painting full-bleed, put a 2x master behind it and raised
 * every type size off the old 640x360 grid; `pause-fullbleed.test.ts` pins
 * that work. The adversarial verifier then came back with four reproducible
 * failures, and this file is one test per failure, written so that each of
 * them goes red against the code that shipped it:
 *
 * 1. **BLOCKING — slabs painted over live menu rows.** At 640x480 (and 700x500,
 *    720x400, 720x540, 640x360, in both an FFX and an FFX-2 chapter) the party
 *    strip and the dossier were drawn over the command column: seven painted
 *    text-on-text intersections, four menu rows inside the party strip's box,
 *    and a QUIT TO TITLE row whose own centre hit-tested as the dossier. A
 *    window that is narrow *and* short fell into the phone stack, which had
 *    neither a scroll box nor any constraint on its rows.
 * 2. At 800x600 the hint strip's ink band was drawn over the bottom 13.7px of
 *    all three party cards — inside the reserved band pass 1 introduced.
 * 3. At 640x480 and 720x540 the dossier ran 8.5px under the hint strip and was
 *    cut to a 43.9px sliver reading `FFX · I`.
 * 4. At 390x844 DPR 3 the browser still fetched the 1344x768 PNG and magnified
 *    it 3.30x, because `sizes="100vw"` describes a *width* and `object-fit:
 *    cover` is driven by whichever axis is more demanding.
 *
 * Two of the four are arithmetic and are tested as arithmetic, against the
 * verifier's own measured numbers. The third is a layout contract and is read
 * out of the stylesheet, for the same reason `pause-fullbleed.test.ts` reads
 * the stylesheet: the defect was a *property choice* (`grid-template-rows:
 * auto`), and a property choice cannot come back without this file going red.
 *
 * The browser half — real Escape/P/H presses at 23 viewport sizes against a
 * built `vite preview`, measured rects, paint-order hit tests over every menu
 * row and party card, and `currentSrc` — is in `docs/handoff/fix3-pause.md`.
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { hintBandPx } from '../../src/app/screens/PauseScreen.ts';
import { coverSourceWidth, pickHeroBackgroundUrl } from '../../src/ui/common/chapterPanel.ts';

const HERE = dirname(fileURLToPath(import.meta.url));
const SHEET = readFileSync(join(HERE, '..', '..', 'src', 'ui', 'common', 'pause-screen.css'), 'utf8');
const CPANEL_SHEET = readFileSync(join(HERE, '..', '..', 'src', 'ui', 'common', 'chapter-panel.css'), 'utf8');
const PREPCHAP_SHEET = readFileSync(
  join(HERE, '..', '..', 'src', 'ui', 'ffx', 'party-prep', 'chapter-panel-tab.css'),
  'utf8',
);

/** The body of one `@media` block, by the exact condition it is written with. */
function mediaBlock(condition: string): string {
  const at = SHEET.indexOf(`@media ${condition}`);
  expect(at, `the "${condition}" query is gone — has the breakpoint been renamed?`).toBeGreaterThan(-1);
  const from = SHEET.indexOf('{', at);
  let depth = 0;
  for (let i = from; i < SHEET.length; i++) {
    if (SHEET[i] === '{') depth++;
    else if (SHEET[i] === '}' && --depth === 0) return SHEET.slice(from, i);
  }
  throw new Error(`unterminated @media block for ${condition}`);
}

const COMPACT = '(max-width: 720px), (max-aspect-ratio: 3 / 4)';
const SHORT = '(max-height: 700px) and (min-width: 721px)';

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

// ------------------------------------------------- failures 2 and 3: the band

describe('the hint strip gets a measured band, not a guessed one', () => {
  it('reserves enough at 800x600 that the strip clears the party cards', () => {
    // The verifier's numbers: `.pause__hint` y=523.1. The frame's padding-top
    // is `--pause-pad-y`, clamp(16px, 3.2vh, 72px) = 19.2 on a 600px window.
    const band = hintBandPx(600, 523.1, 19.2);
    // The frame is `inset: 0` and its padding-bottom is `pad-y + band`, so its
    // content ends here.
    const contentBottom = 600 - 19.2 - band;

    expect(contentBottom).toBeLessThanOrEqual(523.1);
    // ...and not flush against it: real air between two slabs.
    expect(523.1 - contentBottom).toBeGreaterThanOrEqual(10);
    // The cards reached 536.8 before, i.e. 13.7px into the strip's ink.
    expect(contentBottom).toBeLessThan(536.8);
  });

  it('reserves enough at 640x480 that the dossier does not run under the strip', () => {
    // Hint y=407.4; `--pause-pad-y` floors at 16px on a 480px-tall window.
    const band = hintBandPx(480, 407.4, 16);

    expect(480 - 16 - band).toBeLessThanOrEqual(407.4 - 10);
    // The dossier's foot was at 415.9 — 8.5px under a strip starting at 407.4.
    expect(480 - 16 - band).toBeLessThan(415.9);
  });

  it('grows with a strip that wraps, which is what no clamp could do', () => {
    // The strip is a wrapping flex row of chips and the chip count changes
    // with the panel (`ControlsHint.setItems`), so the *same* window wants a
    // different band at different moments. A clamp is a function of the
    // viewport only and cannot see that; this is the whole reason the reserve
    // is measured. 390x844, one row of chips versus three.
    const oneRow = hintBandPx(844, 844 - 27 - 36, 27);
    const threeRows = hintBandPx(844, 844 - 27 - 102, 27);

    expect(threeRows - oneRow).toBe(66);
  });

  it('never reserves a negative band, whatever it is handed', () => {
    expect(hintBandPx(480, 900, 16)).toBe(0);
    expect(hintBandPx(Number.NaN, 400, 16)).toBe(0);
    expect(hintBandPx(480, Number.NaN, 16)).toBe(0);
    expect(hintBandPx(480, 400, Number.NaN)).toBe(0);
  });
});

// ------------------------------------------------- failure 1: the compact stack

describe('the compact layout cannot stack anything on anything', () => {
  it('lays the column out with flex, never with auto grid tracks', () => {
    // This *is* the defect. A grid `auto` track in a container with a definite
    // height is sized down towards its item's min-content contribution when
    // there is not enough room — and the rail sets `min-height: 0` so its menu
    // can be a scroll box on a desktop window, which makes that contribution
    // nearly nothing. Measured at 640x480: tracks of 121 / 79 / 165 px for a
    // rail whose content is 372.7 px tall, so the rail overflowed its own
    // track by 250 px and printed over both of the others.
    //
    // A column flex item at `flex: none` is its content's height. It cannot be
    // shrunk, and two of them cannot occupy the same strip of the screen.
    const body = mediaBlock(COMPACT);

    expect(body).toMatch(/display:\s*flex/);
    expect(body).toMatch(/flex-direction:\s*column/);
    expect(body).toMatch(/flex:\s*none/);
    expect(body).not.toMatch(/grid-template-rows:\s*auto\s+auto/);
  });

  it('scrolls the frame rather than letting content escape it', () => {
    const body = mediaBlock(COMPACT);

    expect(body).toMatch(/overflow-y:\s*auto/);
    // A skewed row overhangs its box by about a tenth of its height; a
    // horizontal scrollbar across the foot of a painting is not the answer.
    expect(body).toMatch(/overflow-x:\s*clip/);
    // A scroll box has to be able to take a wheel or a drag.
    expect(body).toMatch(/pointer-events:\s*auto/);
  });

  it('ends the scroll viewport at the hint band instead of padding it', () => {
    // Chromium leaves a scroll container's end padding out of its scrollable
    // overflow, so a padded reservation vanishes the moment the frame starts
    // scrolling. And even honoured, padding protects only the *end* of the
    // scroll: anywhere else, the cards travel under a `position: fixed` strip
    // that is always on top. The frame's bottom edge has to be the band.
    const body = mediaBlock(COMPACT);

    expect(body).toMatch(/bottom:\s*calc\(var\(--pause-pad-y\)\s*\+\s*var\(--pause-hint-band\)\)/);
    expect(body).toMatch(/padding-bottom:\s*0/);
  });

  it('leaves exactly one scroller on the vertical axis', () => {
    // Two nested scrollers means `scrollIntoView({ block: 'nearest' })` — how
    // `PauseScreen.renderMenu` keeps the cursor on screen — is satisfied by
    // the inner one, and the frame never brings the selected row back into the
    // window at all. That is how a pad player loses the cursor.
    const body = mediaBlock(COMPACT);

    expect(body).toMatch(/\.pause__menu\s*\{[^}]*overflow:\s*visible/);
    expect(body).toMatch(/\.pause__panel\s*\{[^}]*overflow:\s*visible/);
  });

  it('gives the stack an explicit reading order, since flex ignores grid areas', () => {
    // Source order is rail, panel, party, snaps — the two-column desktop order.
    // Read down a phone it has to be rail, party, panel.
    const body = mediaBlock(COMPACT);
    const order = (sel: string): number => {
      const m = new RegExp(`\\${sel}\\s*\\{[^}]*order:\\s*(\\d+)`).exec(body);
      expect(m, `${sel} has no order in the compact stack`).not.toBeNull();
      return Number(m![1]);
    };

    expect(order('.pause__rail')).toBeLessThan(order('.pause__party'));
    expect(order('.pause__party')).toBeLessThan(order('.pause__panel'));
  });

  it('the gap neither query claims relies on the grid, and the grid never traps content', () => {
    // Pre-release pass: the test this replaces asserted
    // `compact || short || roomy` where `roomy` was defined as the exact
    // boolean negation of the other two — `h > 700 && w > 720 && w / h >
    // 3 / 4` is `!(compact || short)` by construction, so the disjunction
    // was a tautology, true for *any* definition of the three predicates,
    // proving nothing about the actual breakpoints or the actual CSS. (Any
    // claim of the shape "P or Q or not(P or Q)" is true by the law of
    // excluded middle regardless of what P and Q are.)
    //
    // What is actually true, and falsifiable: there is a real gap — width
    // and height both past the fold points, e.g. 721x701 — that neither
    // `COMPACT` nor `SHORT` claims, so it falls to the base grid rule with no
    // media query at all. That base rule holds anything, at any size, only
    // because its two variable-length columns are internal scroll boxes
    // (`min-height: 0` + `overflow-y: auto`) rather than because they are
    // ever guaranteed to be tall enough on their own — the same lesson the
    // BLOCKING failure taught the compact layout. Assert that mechanism is
    // still there, in the base rules (outside every `@media` block), and
    // that the gap sizes genuinely reach it rather than one of the queries.
    mediaBlock(SHORT); // still exists, under that exact condition — the gap sits past both of these
    const base = SHEET.slice(0, SHEET.indexOf('@media'));

    expect(base).toMatch(/\.pause__rail\s*\{[^}]*min-height:\s*0/);
    expect(base).toMatch(/\.pause__menu\s*\{[^}]*min-height:\s*0/);
    expect(base).toMatch(/\.pause__menu\s*\{[^}]*overflow-y:\s*auto/);
    expect(base).toMatch(/\.pause__panel\s*\{[^}]*min-height:\s*0/);
    expect(base).toMatch(/\.pause__panel\s*\{[^}]*overflow-y:\s*auto/);

    const compactMatches = (w: number, h: number): boolean => w <= 720 || w / h <= 3 / 4;
    const shortMatches = (w: number, h: number): boolean => h <= 700 && w >= 721;

    // The exact gap the verifier probed by hand in a real browser and found
    // clean (docs/handoff/fix3-pause.md, "What is left" does not list it —
    // this pins that it is the base grid rule doing that, not a query neither
    // of us has read.
    for (const [w, h] of [
      [721, 701], [760, 780], [800, 900], [900, 1000], [1000, 1200], [835, 1112],
    ] as const) {
      expect(compactMatches(w, h), `${w}x${h} should not fold`).toBe(false);
      expect(shortMatches(w, h), `${w}x${h} should not take the short layout`).toBe(false);
    }
    // And the five sizes the verifier broke it at are still in the folding one.
    for (const [w, h] of [[640, 480], [700, 500], [720, 400], [720, 540], [640, 360]] as const) {
      expect(compactMatches(w, h), `${w}x${h} must fold`).toBe(true);
    }
  });
});

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
