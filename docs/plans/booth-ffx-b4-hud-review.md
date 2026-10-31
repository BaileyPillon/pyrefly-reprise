# Paper preflight: the F1 battle HUD meets Chapter IX's Zanmato gauge and Chapter XII's Enemy Intent card and disc strip, FFX only

> The paper preflight AGENTS.md rule 15 asks for before a change `tools/critic-plan.mjs` classes as deep. **Written late, on 2026-10-31, in the fix pass of the lane's adversarial review, which named its absence (finding m3).** The build (commit `ae8a61f27`) carried the design in `docs/handoff/booth-ffx-b4-hud.md` but no preflight, and the preflight that was owed before building is this file. It lists what a 5-to-10-minute paper pass over the cascade would have asked, including the one question the build missed and the review caught (row 4, finding m1). Docs only; it changes no behaviour. Follows the format of `docs/plans/booth-ffx-b3b-review.md`.

```
node tools/critic-plan.mjs --paths src/engine/motion/DemoGate.ts,src/engine/motion/PieceHolds.ts,src/ui/hudf1/hudf1-chapters.css,src/ui/hudf1/HudF1.ts
  review:       DEEP (a FOCUSED review of the production candidate before the deploy; the deep review on the live build)
  because:      src/ui/hudf1/hudf1-chapters.css and src/ui/hudf1/HudF1.ts: unclassified product path is a shared system
  games:        both (the planner cannot classify a new stylesheet); the two panels themselves are FFX only
  checks:       CHK-008 013 016 017 020 021 022 026 027
```

## 1. What the change is

Two lines back in `DemoGate.TREATED_CHAPTERS` (`yojimbo-cavern`, `seymour-omnis`, `ffx`, `r71`), the two "UNTREATED" comments of `PieceHolds.ts` (the holds themselves are the lanes' own, unchanged), one new stylesheet `src/ui/hudf1/hudf1-chapters.css` imported by `HudF1.ts` after the other F1 sheets, and the pins of the release-70 tests that listed the two chapters as left off. No F1 layout sheet changes; no number of a fight changes. **Game case (rule 14): FFX only.** The Zanmato gauge (`src/ui/ffx/ZanmatoGauge.ts`) and the Mortiphasm read-out (`OmnisReadout.ts`) are panels of the FFX battle HUD for two FFX bosses, mounted inside `.ffxhud__stage` and hidden in every other chapter; FFX-2's HUD (`.ffx2hud`) has no panel of this kind, so nothing here applies to FFX-2 and nothing there changes. See [booth-ffx-b4-hud](../handoff/booth-ffx-b4-hud.md).

## 2. What is NEW in this change that the treated chapters so far never had (each one is a place it can break)

| # | the change differs by | the piece it can break | where it is pinned |
|---|---|---|---|
| 1 | **a layout fix in CSS only, for two panels laid out against today's HUD** (the gauge at `left: 660px` of a 1440 frame, the card at `bottom: 258px` of a 1600 frame) while the F1 HUD moved the zones they sit beside (turn strip to the top right, party list up 7 grid px) | the panels colliding with an F1 zone: the "0%" over the TURN ORDER caption (IX), the card over the acting hero's HP numeral (XII) | `booth-ffx-b4-hud-layout.test.ts` reads the real stylesheets, picks each property's winner by specificity at TEXT SIZE 100, 115 and 130, builds every box on the 640 x 360 grid and reports the smallest horizontal clearance; the r70 rects on disk calibrate it (the model reproduces the measured panel to 1 grid px) |
| 2 | **a new sheet that must win over three older ones** (`zanmato-gauge.css`, `omnis-readout.css`, `text-size.css`) without `!important` and without changing any of them | an override that loses on specificity or order, or one that leaks to the phone layouts | the test compares `specificity()` of every pair; every selector ends in the panel's own class behind `.ffxhud.hud-f1`, with `:not(.ffx-zg--phone)` / `:not(.ffx-omr--phone)`; no `.ig-ctb`, `.ig-stat`, `.f1-*`, `.ffx-cmd` in the sheet |
| 3 | **the panels are mounted hidden in every other chapter**, and the F1 class is absent with `?treated=pack`, `?hud=today` and on a phone | a rule that reaches Chapter I, Chapter IV, another treated chapter, or the old layout | the sheet's selectors can only match the gauge or the read-out; the old numbers (660, 258, 690) are pinned; the dump of who the treatment reaches is identical to `r70-int` except the two chapters' sixteen pieces |
| 4 | **`text-size.css` sets more than one property on the same panel at 115 and 130** (`scale` and `transform-origin: center top` for the gauge and the disc strip; `scale`, `transform-origin: right bottom` and a lifted `bottom` for the card) | a fix that overrides `scale` and leaves the sibling property behind: `transform-origin` is a separate property and still turns the `skewX()` of the slab. **The build missed this** (review m1): with the pivot on the top edge the rows sat 6.6 (gauge) and 3.8 (disc strip) grid px further left than the proof said | before the fix: grep **every** sheet for the panel's class and list **every** property each sets at each TEXT SIZE, not only the one being overridden. After: the layout model reads `transform-origin` from the cascade and shears about it (`pivot()`), two tests pin the centre pivot and the cost of the top pivot, and a rule pins "no `scale: none` without a `transform-origin: center` beside it" |
| 5 | **a growth switched off in one HUD and kept in the other** (the gauge and the disc strip keep their size at 115 and 130 under F1; today's HUD grows them) | a player who chose a larger TEXT SIZE for legibility gets two small panels | disclosed as a loss against live (handoff section 5 and open question 2, review m2); the band between the grown ribbon and the grown strip is 229 grid px at 115 and 181 at 130, narrower than a grown panel (191 x 1.15 = 220 plus the shear), so only a look decision (a narrower panel, today's HUD at 130 in these two chapters, or the turn strip's third slot dropped) can restore the growth: rule 9, a picture first |
| 6 | **panels that other HUD pieces place against at run time** (the Sensor plate lifts by `OmnisReadout.sensorLift`; the move advisor's one-row tip is solved by `advisorTip.tipZone` and shifted by `+166` grid px in the F1 sheet) | an overlap that only appears with Intel (G) open | not decidable on paper or by jsdom: job HUD-3 (handoff section 6) with predictions, owed before the deploy of these two lines |
| 7 | **no browser, server or GPU in the lane** (the release-70 review owns them) | any claim that only a rendered frame shows | the handoff states it; the proof is arithmetic on the real stylesheets plus the r70 measured rects; the browser reads are written as jobs with predictions (rule 15), HUD-1, HUD-2 and HUD-5 are the gate to ship the two lines |
| 8 | **the lane re-lists two chapters r70 withdrew** | a held piece lifted by accident, a hold reason that stops saying when it lifts | `breath`, `cam`, `moments` stay held with the reasons ending "Lifts when"; the review's dump shows every hold hash unchanged; the pins widen by exactly the two ids (`WITHDRAWN_R70` to `B4_HUD`) |

## 3. What would make this wrong, and what answers it

- A panel that still meets an F1 zone at the default size: rows 1 and 2, then job HUD-1 (the first menu at 1280 x 720, 1600 x 900, 2560 x 1440 and 3440 x 1440 with every HUD rect against every other).
- A panel that meets one at 115 or 130: row 4 (the model is pivot-aware since the review) and job HUD-4, the read that turns the 115 and 130 numbers from model to measured.
- A change that leaks into Chapter I, Chapter IV or another treated chapter: row 3.
- A panel that is smaller than the player chose: row 5, a decision, not a defect of the build.
- An advisor tip or the Sensor plate over a panel with Intel open: row 6, job HUD-3.
- A claim written into a comment, the handoff or a changelog line that the proof does not support: the comment numbers (17.0 and 16.4 at 115, 7.4 and 8.0 and 9.2 at 130) are the layout test's own pins; a pin and a comment that disagree fail the file.

## 4. Order of work for the next chapter panel that meets the F1 HUD

1. Grep every stylesheet for the panel's class (`grep -rn "<class>" src --include=*.css`), not only its own sheet: `text-size.css` and `text-size-wide.css` carry per-panel rules that the panel's sheet does not show.
2. For each size (100, 115, 130) list every property each rule sets on the panel: `left`, `top`, `bottom`, `scale`, `translate`, `transform-origin`, `transform`. A rule that overrides one of the group has to say what it does about the others (row 4).
3. Model the box with its pivot: a slab's `skewX()` turns about `transform-origin`, so the shear has to be read from the cascade, never assumed to be the centre.
4. Calibrate the model on a measured rect from the last browser read before trusting a number at a size nobody has read.
5. Write the browser jobs with predictions before the lane ends, and name every loss against live in the handoff (row 5), so the review does not have to find it.
