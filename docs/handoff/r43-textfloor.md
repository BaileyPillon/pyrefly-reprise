# r43-textfloor: the 14 px text floor on party prep, results, Chapters IX and XII and the Sensor chips (PR-0356, PR-0391)

Written 2026-10-12 by a Sonnet sub-agent of the release driver. Branch `r43-textfloor`, from origin/main `5a4c92b1` (live `a061e9dc`); sparse worktree
`D:/pyrefly-r43-textfloor` (`node_modules` and `public/art` are junctions, both untracked: `cmd /c rmdir` each before ever removing the tree).
**Nothing is merged and nothing is deployed.** Source: deep round 25 (`critic/rounds/round-25.json`, PR-0356 and PR-0391). `node tools/critic-plan.mjs`
classes the change DEEP (shared layout), so it owes a focused review before a deploy and the deep review after it; the paper preflight is
`docs/plans/r43-textfloor-review.md`. Proof frames and numbers: `docs/screenshots/r43-textfloor/` (JPEG, `README.md` has the table).

## What round 25 found, and what is true now

Measured the way the chief measured it (real keys and clicks, fresh profile, font-size times every ancestor's scale, `tools/text-floor-sweep.mjs`),
on the pristine origin/main tree against this branch, same probe, same seed. "Under 14" counts text elements under 14 css px in the worst step of the screen.

| screen | window | steps | smallest text before -> after (px) | elements under 14 px, worst step before -> after | new overprint / cut |
|---|---|---|---|---|---|
| battle-ch1-sensor | 2560x1440 | 2 | 14 -> 14 | 0 -> 0 | 0 / 0 |
| battle-ch1-sensor | 1280x720 | 2 | 14 -> 14 | 0 -> 0 | 0 / 0 |
| battle-ch1-sensor | 1600x900 | 2 | 14 -> 14 | 0 -> 0 | 0 / 0 |
| battle-ch1-sensor | 2000x1012 | 2 | 14 -> 14 | 0 -> 0 | 0 / 0 |
| battle-ch1-sensor | 3840x2160 | 2 | 14 -> 14 | 0 -> 0 | 0 / 0 |
| battle-ch12 | 1024x768 | 1 | 7.68 -> 7.68 | 18 -> 15 | 0 / 0 |
| battle-ch12 | 390x844 | 1 | 14 -> 14 | 0 -> 0 | 0 / 0 |
| battle-ch12 | 1280x720 | 1 | 9.6 -> 14 | 14 -> 0 | 0 / 0 |
| battle-ch12 | 1600x900 | 1 | 12 -> 14 | 5 -> 0 | 0 / 0 |
| battle-ch12 | 2000x1012 | 1 | 13.49 -> 14 | 1 -> 0 | 0 / 0 |
| battle-ch12 | 3840x2160 | 1 | 14 -> 14 | 0 -> 0 | 0 / 0 |
| battle-ch9 | 1024x768 | 1 | 7.82 -> 7.82 | 5 -> 4 | 0 / 0 |
| battle-ch9 | 390x844 | 1 | 14 -> 14 | 0 -> 0 | 0 / 0 |
| battle-ch9 | 1280x720 | 1 | 9.78 -> 14 | 5 -> 0 | 0 / 0 |
| battle-ch9 | 1600x900 | 1 | 12.22 -> 14 | 3 -> 0 | 0 / 0 |
| battle-ch9 | 2000x1012 | 1 | 13.74 -> 14 | 3 -> 0 | 0 / 0 |
| battle-ch9 | 3840x2160 | 1 | 14 -> 14 | 0 -> 0 | 0 / 0 |
| board | 390x844 | 1 | 10 -> 14 | 4 -> 0 | 2 / 0 |
| pause-ffx | 390x844 | 8 | 14 -> 14 | 0 -> 0 | 0 / 0 |
| pause-ffx | 1280x720 | 8 | 14 -> 14 | 0 -> 0 | 0 / 0 |
| pause-ffx | 1600x900 | 8 | 14 -> 14 | 0 -> 0 | 0 / 0 |
| pause-ffx | 2000x1012 | 8 | 14 -> 14 | 0 -> 0 | 0 / 0 |
| pause-ffx | 3840x2160 | 8 | 14 -> 14 | 0 -> 0 | 0 / 0 |
| prep-ffx (all tabs but Sphere Grid) | 1024x768 | 5 | 7.82 -> 7.82 | 88 -> 85 | 0 / 0 |
| prep-ffx (all tabs but Sphere Grid) | 1280x720 | 5 | 9.78 -> 14 | 43 -> 0 | 6 / 0 |
| prep-ffx (all tabs but Sphere Grid) | 1600x900 | 5 | 12 -> 14 | 15 -> 0 | 0 / 0 |
| prep-ffx (all tabs but Sphere Grid) | 2000x1012 | 5 | 12 -> 14 | 13 -> 0 | 0 / 0 |
| prep-ffx (all tabs but Sphere Grid) | 3840x2160 | 5 | 12 -> 14 | 3 -> 0 | 0 / 0 |
| prep-ffx (Sphere Grid tab) | 1024x768 | 2 | 7.49 -> 7.49 | 98 -> 95 | 0 / 0 |
| prep-ffx (Sphere Grid tab) | 1280x720 | 2 | 9.36 -> 9.36 | 81 -> 70 | 0 / 0 |
| prep-ffx (Sphere Grid tab) | 1600x900 | 2 | 11.7 -> 14 | 31 -> 0 | 0 / 0 |
| prep-ffx (Sphere Grid tab) | 2000x1012 | 2 | 12 -> 14 | 14 -> 0 | 0 / 0 |
| prep-ffx (Sphere Grid tab) | 3840x2160 | 2 | 12 -> 14 | 3 -> 0 | 0 / 0 |
| prep-ffx-first | 390x844 | 1 | 10 -> 14 | 4 -> 0 | 0 / 0 |
| prep-ffx2 | 1280x720 | 5 | 9.78 -> 14 | 55 -> 0 | 6 / 0 |
| prep-ffx2 | 1600x900 | 5 | 12 -> 14 | 15 -> 0 | 0 / 0 |
| prep-ffx2 | 2000x1012 | 5 | 12 -> 14 | 13 -> 0 | 0 / 0 |
| prep-ffx2 | 3840x2160 | 5 | 12 -> 14 | 3 -> 0 | 0 / 0 |
| prep-ffx2-first | 390x844 | 1 | 10 -> 14 | 4 -> 0 | 0 / 0 |
| results-ffx | 1024x768 | 1 | 7.82 -> 7.82 | 18 -> 18 | 0 / 0 |
| results-ffx | 390x844 | 1 | 14 -> 14 | 0 -> 0 | 0 / 0 |
| results-ffx | 1280x720 | 1 | 9.78 -> 14.1 | 17 -> 0 | 0 / 0 |
| results-ffx | 1600x900 | 1 | 12.23 -> 14.1 | 6 -> 0 | 0 / 0 |
| results-ffx | 2000x1012 | 1 | 13.75 -> 14.1 | 3 -> 0 | 0 / 0 |
| results-ffx | 3840x2160 | 1 | 29.34 -> 29.34 | 0 -> 0 | 0 / 0 |
| results-ffx2 | 390x844 | 1 | 14 -> 14 | 0 -> 0 | 0 / 0 |
| results-ffx2 | 1280x720 | 1 | 9.78 -> 14.1 | 17 -> 0 | 0 / 0 |
| results-ffx2 | 1600x900 | 1 | 12.23 -> 14.1 | 4 -> 0 | 0 / 0 |
| results-ffx2 | 2000x1012 | 1 | 13.75 -> 14.1 | 3 -> 0 | 1 / 0 |
| results-ffx2 | 3840x2160 | 1 | 29.34 -> 29.34 | 0 -> 0 | 0 / 0 |

How to read it: the three windows the lane was asked for (1600x900, 2000x1012, 3840x2160) are 0 under 14 px on every swept screen, both games. 1280x720 is 0 everywhere except the Sphere Grid tab
(by its 1600x900 gate, see Residuals). The two "6 new overprint" rows at 1280x720 are the CHAPTER tab's hint: its "SCROLL" wraps to a second line and the probe reports the two-line run's union box, not a
collision. The "board" row's 2 are the first-run guide's slab, which floats over the board by design and is a little taller at 14 px. 390x844 (touch) is unchanged except the first-run guide (10 px before, 14 now);
1024x768 is the control (the floor is off): the only change there is the first-run guide's three fixed-px elements and the strategy guide's document head.

The round's own numbers reproduced before any edit: prep minimum 11.7 px (the Sphere Grid's M and H key chips), "Esc" and "skip the guide" 12 px, 15 to 31 elements
under 14 per tab at 1600x900; the results page 12.2 and 13.3 px; Chapter IX "Daigoro", "+ Kozuka", "+ Wakizashi" 12.2 px; Chapter XII 12 and 13 px; and at 3840x2160 the
Sensor card's six chips in one row of seven 10-px columns ("FIR CHU CE WA HO GRAV").

## What changed (game case per item, AGENTS.md rule 14)

| Item | Case | Why this case |
|---|---|---|
| `src/ui/common/stage-floor.css` (new, `@import`ed by `party-prep.css` and `results.css`): `--stage-floor` = 14.1 px / `--lb-scale` from a 1280x720 window, `--stage-floor-frame` from 1600x900, both 0 below | both | one prep shell and one results page for both games (`.prep.ig--ffx2`, `.rres`) |
| `party-prep.css`: the hint strip, the roster-slot role, tabs, member level, stat labels, slot sub-line (7 sizes) | both | shared shell |
| `results.css`: caption, chip, NEW BEST tag, ledger labels, member detail, `+N S.Lv`, buttons (11 sizes) | both | shared page |
| `src/ui/coach/first-run.css`: "Esc skip the guide" 12 to 14 px, the eyebrow 13 to 14; the phone block 10 to 13.5 up to 14 | both | the guide is one component for both games' first run |
| `ffx/party-prep/party-prep.css` (stats, gear, items, overdrive: 7 sizes) | FFX only | `.ffxprep-*` |
| Sphere Grid: `sphere-grid-b.css`, `-b-card.css`, `-help.css` (the M and H key chips, the legend, the node card, the first-time explainer), from 1600x900, plus 7 px line heights on the legend | FFX only | the Sphere Grid is FFX (FFX-2 has the Garment Grid, untouched) |
| `ffx2/party-prep/party-prep.css` (9 sizes) | FFX-2 only | `.x2prep-*` |
| `zanmato-gauge.css`: "Daigoro", "+ Kozuka", "+ Wakizashi", the full-gauge chip, the line under the bar, the banner's small line, via `--zg-floor` = 2.25 hud floors | FFX only, Chapter IX only | Yojimbo's gauge (`research/ffx-yojimbo.md` section 4) |
| `omnis-readout.css`: the disc strip, "Absorbs", "Weak", "Enemy intent", "Colour order: our estimate", via `--omr-floor` = 2.5 hud floors | FFX only, Chapter XII only | Seymour Omnis's discs |
| `hud-floor.css`: the Sensor chips' column minimum follows the chip's rendered type (`max(6px, --hud-floor)`), so six chips stay two rows of three | FFX only | the Sensor card is `.ffxhud` |
| `hud-floor.css`: the strategy guide's document-head classes (`.sgd__tag`, `__lead`, `__flabel`, `__thead`, `__hint-kind`, `__h3`, `__lname`) join the floor | both | one guide for both games; found at 1280x720 (11.4 px), 14.25 px at 1600x900 so never flagged there |
| `critic/CHECKS.md` CHK-002 (the capped plate and D-450), CHK-003 (effective size; the automation that now exists), CHK-009 (the Sensor chips) | both | rules |
| `tools/text-floor-probe.mjs`, `tools/text-floor-sweep.mjs`, `docs/DEV.md`, `tests/unit/r43-text-floor-css.test.ts`, `tests/unit/ui-ffx-zanmato-gauge.test.ts` (12 px floor to 14) | both | tooling and tests. The round's own sweep is not in the repo and, per R25-HX-01 and R25-PD-02 (PR-0450), floored at 11 px and recorded no minimum; this one floors at 14, records the minimum and the count, and `--strict=1` fails on one element |

How the floor works (the same idea as `hud-floor.css`, `move-advisor.css`, `chapter-panel.css`): a size under 7.05 grid px (5.64 in the Sphere Grid's gate) is
`max(its size, var(--floor, 0px))`, where the variable is 14.1 px over the stage scale and 0 outside its window query. At the scale a size was authored for, or wider,
nothing changes; below it the label grows as far as it must. 14.1, not 14, for Chromium's one-decimal rounding.

## What is not changed, and why

- **The pause plate at 3840x2160 (PR-0391, first half).** Not scaled to cover. D-450 (Bailey, "I'll go with all of your recommendations", 2026-10-05; release 39.1 B10) chose
  a blurred, darkened extension behind a plate that is never magnified past 1.25x, and refused "softening the painting, or making a 4K painting". The sweep reproduces the
  round's numbers (plate 3393x1939 at (-16, -8)) and finds what the round did not measure: `.pause__art` is the 3840x2160 window, carries `pause__art--extended`, and its
  `::before` is 4070x2290 with the blur and the grade, no sideways scroll. CHK-002 now names the capped case (the round's own second alternative). If Bailey wants the plate
  itself to cover, that is the softening he declined: an options page.
- **Contrast of the pause headers and hints** (PR-0356's second sentence: `rgba(paper, 0.3)` and `0.34`, about 2.4 and 2.9 to 1). The approved pause chrome's palette; a brighter
  label is a look change, so for an options page. The prep hint's 2:1 was measured under the first-run guide's dim layer (`rgba(11,10,18,.72)` over everything); computed
  without it (`rgba(244,241,232,.55)` over the dark prep ground) the strip is roughly 5 to 1: an estimate from the CSS colours, not a pixel measure.
- **The phone prep tabs** (PR-0295, D-781): another lane's mockup. `--stage-floor` is 0 below 1280x720 and the CHAPTER tab's phone page publishes its own `--lb-scale: 1`, so
  no phone rule moved (390x844 sweeps below).
- **The coach card and the PAUSE chip "small against the 2160 screen".** They are fixed 14 css px by design (outside the stage); at DPR 1 on 3840x2160 that is small, on a real 4K
  screen at 200 percent it is 28 device px. Scaling them with the stage is a look change.

## Residuals, disclosed

- **Windows under 1280x720** keep the authored prep, results, Chapter IX and Chapter XII sizes (the floor is off by query: a tablet or a phone in landscape would grow every label
  past what a 640x360 board holds). 1024x768 measured: the prep, results, Chapter IX and Chapter XII sizes are the authored ones; the only differences are the first-run guide's three fixed-px
  elements (14 px now) and the strategy guide's document head (the floor there is not gated).
- **The Sphere Grid between 1280x720 and 1599x899** keeps its authored sizes (still under 14 there): the grid and its 120-px legend were drawn on a 1600x900 frame with no slack, and at
  2x the floor grows the legend 30 percent and runs its last line into START BATTLE. From 1600x900 the grid holds 14 px with the legend's footprint unchanged (measured to the pixel).
  Measured on the two common laptop windows in between (this branch only): 1366x768 and 1440x900 read 0 under 14 px on every prep tab but the Sphere Grid (47 and 40 elements, smallest 9.98
  and 10.53 px), on results, Chapter IX and Chapter XII (0), and on FFX-2 prep (0). A Sphere Grid that holds 14 px below 1600 is a layout job (a larger legend and card), not a floor.
- **The CHAPTER tab's hint wraps "SCROLL" to a second line at 1280x720** (the strip is 14 px there; 1600x900 and up are one line).
- The probe's overlap list is a screen aid, not a verdict: a text run split over two lines reports a union box, and a scrolled-out row is skipped only when an ancestor clips it.

## Re-run

```
node node_modules/vite/bin/vite.js --config <a private config: hmr off, cacheDir on D:> --port 5198 --host 127.0.0.1   # stop it by PID after
PYREFLY_BROWSER=gpu node tools/text-floor-sweep.mjs --base=http://127.0.0.1:5198/ --out=<dir> --sizes=1280x720,1600x900,2000x1012,3840x2160 \
    --screens=prep-ffx,prep-ffx2,results-ffx,results-ffx2,pause-ffx,battle-ch9,battle-ch12,battle-ch1-sensor
node node_modules/vitest/vitest.mjs run tests/unit/r43-text-floor-css.test.ts tests/unit/ui-ffx-zanmato-gauge.test.ts
```
The pristine comparison was a `git archive origin/main` export of `src`, `tools` and the config on a second port (`node_modules` and `public` junctioned), so one probe measured both trees.

## For the driver

- CHANGELOG entry text (both games unless marked): "Text on the party prep screen, the results page, the first-run guide, Chapter IX's Zanmato gauge and Chapter XII's disc strip
  now reads at 14 px or more on a window of 1280x720 and up (the Sphere Grid from 1600x900); the Sensor card's six element chips stay in two rows of three on a 4K or ultrawide window instead
  of printing over each other (FFX); the strategy guide's document head reads at 14 px at 1280x720. No numbers, no art and no gameplay changed."
- Ledger rows to add (A-nnnn): the implementation, the sweep tool, the CHK-002 amendment (D-450 named), the two disclosures above. No new decision of Bailey's; the plate and the contrast
  are the two questions that would need one.
- Review: `node tools/critic-plan.mjs` says DEEP; the live obligation of the release that carries this is the usual three.
