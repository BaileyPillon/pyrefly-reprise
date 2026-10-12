# r43-textfloor: paper preflight (critic/RUBRIC.md section 8, written 2026-10-12 by the lane's sub-agent)

`node tools/critic-plan.mjs --paths <the changed sheets>` classes this change DEEP ("global layout, input and boot is a shared
system": the party-prep and results sheets are shared by both games). The lane's scope was fixed by the driver before the build
(round 25's PR-0356 and PR-0391), so this note is the preflight's content written beside the measurement, not before it. Result:
**PROCEED**, with the narrowings under "What is not touched" (the plate, the contrast, the phone tabs, windows under 1280x720, and the
Sphere Grid under 1600x900). One REPAIR happened inside the lane: the first build floored the Sphere Grid from 1280x720 and the
measurement at 1600x900 showed its legend's last line under START BATTLE (a whole px of line height per line, from font metrics
that round to whole px); the grid got its own gate and fixed 7 px line heights, and the legend's footprint now matches the
pristine tree to the pixel.

## Game case (AGENTS.md rule 14), from the sources

| Change | Case | Source of the case |
|---|---|---|
| `stage-floor.css`; the prep shell and the results page (`party-prep.css`, `results.css`); the first-run guide (`first-run.css`) | both | one shell and one page for both games (`.prep.ig--ffx2` and `.rres` are the same sheets; `critic/CHECKS.md` CHK-020: shared plumbing is "both") |
| `.ffxprep-*` panels, the Sphere Grid (`sphere-grid-*.css`), Chapter IX's Zanmato gauge, Chapter XII's disc strip, the Sensor chips | FFX only | each file's own header: FFX only (the Sphere Grid, Yojimbo's Zanmato gauge and Seymour Omnis's discs are FFX; the Sensor card is `.ffxhud`; FFX-2 has none of them) |
| `.x2prep-*` panels | FFX-2 only | `src/ui/ffx2/party-prep/` |
| `critic/CHECKS.md` CHK-002, CHK-003, CHK-009; `tools/text-floor-*.mjs` | both (tooling and rules) | |

## Acceptance cases (named before the numbers)

1. A DOM sweep (font-size times every ancestor's scale, `tools/text-floor-probe.mjs`) of every prep tab of both games (fresh profile,
   so the first-run guide and the Sphere Grid's first-time card are in it), the results page of both games, Chapter IX's and
   Chapter XII's first menus: **0 text elements under 14 px at 1600x900, 2000x1012 and 3840x2160** (and at 1280x720 where the floor is on).
2. The Sensor card's six chips (Chapter I, `I` open) are two rows of three and no chip's text is wider than the chip at 2560x1440 and
   3840x2160 (round 25: seven columns at 3840x2160, five at 2560x1440).
3. 390x844 (touch) results, pause, Chapter IX and Chapter XII stay at 14 px and unchanged (the phone must not move).
4. The pause plate at 3840x2160 is measured against D-450, not against the plate alone.
5. No new overprinting or cut text in any swept step against the pristine origin/main tree measured with the same probe.

## What could break, and how it was checked

- **A floor on a 640x360 board grows text in grid px.** Under 7.05 grid px a size is `max(its size, 14.1 px / --lb-scale)`: at 1600x900 only
  sizes under 5.64 change (by at most 15 percent); the dense ones are the Sphere Grid's legend and the results member rows, so those
  were compared by screenshot and by overlap count with the pristine tree.
- **The phone and the tablet.** `--stage-floor` is 0 outside a 1280x720 window, so `max(size, 0)` is the authored size there; the
  CHAPTER tab's phone page and PR-0295's tabs are untouched by construction (acceptance case 3 measures it).
- **A custom property that is not defined makes `font-size` invalid at computed-value time** (it falls back to inherit): every
  `var()` carries a `0px` fallback and the variable is defined on the stage in the sheet's own file.
- **Frame-scaled cards** (the Sphere Grid's explainer, Chapter XII's strip, Chapter IX's gauge) are drawn at 1600x900 or 1440x810 sizes
  inside a scaled box; their floor is the stage floor times the box's own ratio (2.5, 2.5, 2.25), derived, not copied.

## What is not touched, and why

- **The pause plate itself.** D-450 (Bailey, "I'll go with all of your recommendations", 2026-10-05) chose a blurred extension behind a
  plate that is never magnified past 1.25x over "softening the painting, or making a 4K painting". Scaling the plate to cover (round 25's
  first alternative) is the softening he declined; CHK-002 now names the capped case (the round's second alternative).
- **Contrast of the pause headers and hints** (`rgba(paper, 0.3)` and `0.34`, about 2.4 and 2.9 to 1): the approved pause chrome's palette.
  A brighter label is a look change, so it is for an options page, not this lane.
- **The phone prep tabs** (PR-0295, D-781): another lane's mockup.
- **Windows under 1280x720, and the Sphere Grid under 1600x900.** The floor is off there by media query: a tablet or a landscape phone
  would grow every label past what a 640x360 board holds, and the grid's legend and card were drawn on a 1600x900 frame with no slack.
  Both keep today's authored sizes (still under 14 there); 1024x768 was measured: authored sizes, except the first-run guide's fixed px and
  the strategy guide's head, which are not gated. Widening either gate is a layout job for an options page, not a floor.
