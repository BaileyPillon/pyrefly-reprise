# r46-prepshades: the phone Party Prep's four colour shades, option B (PREP-A, 2026-10-13)

Written 2026-10-13 by a Sonnet sub-agent of the release driver. Branch `r46-prepshades` from `origin/r45-rc` `d5bf2206`, worktree `D:/pyrefly-r46-prepshades`
(`node_modules` and `public/art` are junctions, both untracked: `cmd /c rmdir` each before ever removing the tree). **Nothing is merged and nothing is
deployed.** Commits: `52b69bfc` (the tokens, the mapping and the unit test), then the frames and these notes.

## Game case

**Both games.** The shades are shared interface chrome in one stylesheet (`src/ui/common/prep-phone-sections.css`, plus the tokens in
`src/ui/inkgold/tokens.css`). The gold note shade shows in FFX chapters (the Stats tab's "+10% dmg" notes, and the Items tab's gold bag counts); the
pink bag counts show in FFX-2 chapters; the up and down counts exist only in FFX-2's Stats view (the dressphere plates). No engine, data or layout file
is touched, so nothing differs between the games except which of the four elements each one draws.

## What Bailey decided

The driver showed Bailey a side-by-side sheet of the four shades (A = the nearest Ink & Gold tokens the lane had used, B = the approved mockup page's
own shades) and wrote "I recommend B for all four". Bailey answered on 2026-10-13: "keep going please full speed ahead ill go with all your
recommendations". So the page's four shades go in. The sheet and its measurements are the driver's record of the choice; this note does not repeat them.

## What changed

Three additive Ink & Gold tokens in `src/ui/inkgold/tokens.css`, and the three phone-page variables now point at them. Nothing else moved.

| # | Element (what it is) | Token | Value | Ratio on its real background | Was (r43, commit `98bcc847`) |
|---|---|---|---|---|---|
| 1 | `.prph-bonus` (FFX gold "+10% dmg" notes; also the FFX Items bag counts via `.prph-item__qty`), on ivory `#f4f1e8` | `--ig-accent-text-on-paper` (FFX) | `#7f5c0a` | **5.41:1** | `--ig-accent-deep` `#a67c16`, 3.37:1 |
| 2 | `.prph-item__qty` (FFX-2 pink bag counts), on ivory | `--ig-accent-text-on-paper` (repointed by `.ig--ffx2`) | `#9c3267` | **6.07:1** | `--ig-accent-deep` pink `#b8437e`, 4.49:1 |
| 3 | `.prph-ud__up` (the count after the up triangle), on the dark plate `#0a0911` | `--ig-gain-on-ink` | `#7fd09a` | **10.75:1** | ivory `--ig-paper`, 17.54:1 |
| 4 | `.prph-ud__dn` (the count after the down triangle), on the dark plate | `--ig-loss-on-ink` | `#f08a8a` | **8.21:1** | ivory `--ig-paper`, 17.54:1 |

- `--prph-acc-text: var(--ig-accent-text-on-paper)`, `--prph-good: var(--ig-gain-on-ink)`, `--prph-bad: var(--ig-loss-on-ink)` in the `.prph` host
  block of `prep-phone-sections.css`; the header comment of that file now says so. No colour literal was added to the phone sheets.
- Why tokens and not literals: no test or lint forbids a literal there (the file already holds `#2f7a46`, `#a5323a` and `#04060b`), but the file's own header
  says its colours are the Ink & Gold tokens and that a shade the tokens lack is the one exception to list. Naming them makes the exception go away and lets
  a later screen reuse them. `.ig--ffx2` repoints only the on-paper accent text (it has a pink twin); the gain and loss shades are the same in both games.
  `tests/unit/inkgold.test.ts` requires every `--ig-accent*` role of `.ig` to be repointed by `.ig--ffx2`, and the new token is.
- `--ig-accent-deep` (the battle-start eyebrow, `#a67c16` gold and the deep pink under `.ig--ffx2`) is **unchanged**, as is `--ig-accent-on-paper`;
  `inkgold.test.ts` still pins the former. The two ivory-body delta literals (`--prph-up` `#2f7a46`, `--prph-down` `#a5323a`) are unchanged.
- `src/ui/inkgold/tokens.css` is not a file listed in `docs/CONTRACTS.md`, so there is no `docs/CONTRACT-CHANGES.md` entry.
- The up and down triangles stay in front of the counts (`src/ui/ffx2/party-prep/phoneViews.ts`), so direction never depends on colour alone. Red and green
  is the pair colour-blind players confuse; the triangles are the answer, and a test pins them.

## Do the colour-vision or high-contrast rules override these four?

**No.** There is no colour-vision mode, high-contrast mode, `prefers-contrast`, `forced-colors` or `prefers-color-scheme` rule anywhere in `src`
(searched all `.css` and `.ts`), and nothing that styles `.prph-*` outside the two phone sheets (`prep-phone-sections.css`, `prep-phone-parts.css`). The only
`filter: grayscale(...)` rules are on other screens (results, chapter select, dialogue). Light and dark themes, reduced motion and the colour-vision work
are out of scope of this lane and unchanged.

## Proof

- **tsc** (`node node_modules/typescript/bin/tsc --noEmit -p .`): clean.
- **New unit test** `tests/unit/r46-prep-shades.test.ts` (14 tests): the three tokens' values per game (FFX reads `.ig`, FFX-2 reads `.ig--ffx2` first); the
  mapping of the three `--prph-*` variables to the tokens (and no literal of the four shades in the phone sheets); the four elements that read them; the
  triangles; and the contrast of each shade against its real background read from the sheets (ivory = `--ig-paper`; the plate = `--ig-ink-panel` 0.84 over
  the page ground `#04060b` = `#0a0911`): 1 and 2 at or above 4.5:1, 3 and 4 at or above 7:1, with the exact ratios 5.41, 6.07, 10.75 and 8.21.
- **Every test that reads the token file, the prep sheets or the phone prep** (34 files, 834 tests, 0 failures): `inkgold`, `inkgold-scoping`, `inkgold-screens`,
  `css-comments` (the build's own minifier on every sheet), `prep-phone-shell` (the 14 px floor, the one phone query, the 400-line limit), `prep-phone-page`,
  `prep-phone-views`, `party-prep-phone`, `party-prep-inkgold`, `party-prep-panels`, `r44a-prep-hint-first-run`, `r45-prep-cue-first-run`,
  `r44a-ffx-mode-row-pointer`, `ui-ffx-party-prep`, `ui-ffx2-party-prep`, `ui-ffx2-prep-stats`, `ui-ffx2-prep-dresspheres`, `results-inkgold`, `critic-policy-v2`,
  `exp-leblanc`, `moved-notice`, the two command-row contrast tests, the type-floor tests and the rest of that list. The full suite was not run (the candidate
  assembly runs it). `node tools/orphans.mjs`: no source module was added.
- **A real browser, on the production build.** `vite build` with `BASE_PATH=/` (no `prebuild`: it runs `tools/gen/manifest.mjs`, which must not run where
  `public/art` is a junction; the manifest in the art folder is the existing one), served on 127.0.0.1:5263; headless Chromium 153, 390x844, touch, 3x, an
  Android phone user agent, a fresh profile, real keys from the title to the chapter board and Enter on the card, the first-run guide skipped by a real tap,
  the tabs opened by a real tap. The computed colours:

  | View | Element | Computed colour | On | Ratio |
  |---|---|---|---|---|
  | FFX Chapter I, STATS | `.prph-bonus` "+10% dmg" (14 px / 700) | `rgb(127, 92, 10)` = `#7f5c0a` | `#f4f1e8` | 5.41:1 |
  | FFX Chapter I, ITEMS | `.prph-item__qty` "x45" (20 px / 700) | `rgb(127, 92, 10)` | `#f4f1e8` | 5.41:1 |
  | FFX-2 Chapter IV, ITEMS | `.prph-item__qty` "x60" (20 px / 700) | `rgb(156, 50, 103)` = `#9c3267` | `#f4f1e8` | 6.07:1 |
  | FFX-2 Chapter IV, STATS | `.prph-ud__up` "up 6" (16 px / 700) | `rgb(127, 208, 154)` = `#7fd09a` | `#0a0911` | 10.75:1 |
  | FFX-2 Chapter IV, STATS (end) | `.prph-ud__dn` "down 7" (16 px / 700) | `rgb(240, 138, 138)` = `#f08a8a` | `#0a0911` | 8.21:1 |

  The pixel under each glyph's solid core read the same hex as the computed colour in every capture, and the page printed no console error.
  `--ig-accent-deep` still read `#a67c16` (FFX) and `#b8437e` (FFX-2) in the same pages, so the other roles did not move.

## Target against build

The target is row "B" of the PREP-A shade sheet (the page's own shades). Same chapters, same tabs, same scroll, same crop on both sides.
[`prepshades-target-b-vs-build-390x844.jpg`](../screenshots/r46-prepshades/prepshades-target-b-vs-build-390x844.jpg): four rows, the target on the left and
this build on the right, each with the 390-wide view, a 3x zoom of the element, a swatch of the shade on its real background and the ratio.

- Each of the four computed colours in the build equals the target's to the digit (`#7f5c0a`, `#9c3267`, `#7fd09a`, `#f08a8a`), and the ratios are equal.
- Each element sits at the same rectangle as in the target (delta 0 on x, y, width and height in all four views).
- Over the whole 3x capture, **no pixel differs from the target's by more than 12 levels in any channel** in any of the four views (the largest single
  channel difference anywhere is 6 levels, in the FFX capture): the build is the target's page, not only its four shades.
- The four screenshots, whole phone pages at 3x (1170 x 2532): [`1-ffx-stats-gold-note.png`](../screenshots/r46-prepshades/1-ffx-stats-gold-note.png),
  [`2-ffx2-items-pink-count.png`](../screenshots/r46-prepshades/2-ffx2-items-pink-count.png),
  [`3-ffx2-stats-up-count.png`](../screenshots/r46-prepshades/3-ffx2-stats-up-count.png),
  [`4-ffx2-stats-down-count.png`](../screenshots/r46-prepshades/4-ffx2-stats-down-count.png).

## What this does not show

Chromium only (no WebKit, no real phone): the shades are plain CSS colours, so no engine difference is expected, but it was not looked at. The depth maps
under `public/fx` are not in this worktree (untracked art), which has no bearing on the prep screen. No review was run on this branch; it is one candidate
input for the release driver's assembly. `docs/handoff/r43-prepphone.md` item 1 now points here.
