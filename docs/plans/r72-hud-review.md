# Paper preflight: Chapters IX and XII back on the treated list after the r71 browser read, FFX only

> The paper preflight AGENTS.md rule 15 asks for before a change `tools/critic-plan.mjs` classes as deep. **Written late, on 2026-11-01, in the fix pass of the lane's adversarial review, which named its absence (finding m7).** The build (commit `fb67cb231`) carried the design in `docs/handoff/r72-hud.md`; this page is the short form of it, in the shape `docs/plans/booth-ffx-b4-hud-review.md` uses.

```
node tools/critic-plan.mjs --paths src/ui/ffx/hudAvoidSelectors.ts,src/ui/ffx/FFXBattleHud.ts,src/ui/hudf1/hudf1-chapters.css,src/engine/motion/DemoGate.ts
  review:       DEEP (a FOCUSED review of the production candidate before the deploy; the deep review on the live build)
  because:      src/ui/hudf1/hudf1-chapters.css: unclassified product path is a shared system
  games:        both (the planner cannot classify a stylesheet); the three defects are FFX only
  checks:       CHK-003 004 006 007 008 009 010 013 015 016 017 020 021 022 026 027
```

## 1. What the change is

Two lines back in `DemoGate.TREATED_CHAPTERS` (`yojimbo-cavern`, `seymour-omnis`, game `ffx`), and the three layout fixes that answer the r71 browser read (`docs/handoff/booth-b4.md` section 12): the F1 ribbon is a solid box to the advisor's solver in these two chapters (`hudAvoidSelectors.f1RibbonEls`, read through `advisorInkRects` and `advisorKeepOffRects`), the tip is not slid right of the ribbon here, XII's disc strip is anchored by its right edge, and XII's Sensor card stands under the turn strip (all in `hudf1-chapters.css`). Presentation only: no number of a fight, no art, no contract file.

## 2. What is NEW here that the treated chapters so far never had (each one is a place it can break)

| # | the change differs by | the piece it can break | where it is pinned |
|---|---|---|---|
| 1 | **the advisor's solver is given a box it never knew** (the F1 ribbon), by two input builders, in two chapters | the tip or the card moving in Chapter I or another chapter | `r72-hud-wiring.test.ts` runs the real HUD in jsdom and the builders on small trees: Chapter I, a hidden gauge, F1 off and the phone gauge answer the placement they give with no ribbon |
| 2 | **a stylesheet answer to a stylesheet slide** (`hudf1.css` slides the tip 166 grid px right for Chapter I; here the answer turns the slide off) | a leak to Chapter I's tip, or an answer that loses on specificity | `r72-hud-layout.test.ts` compares `specificity()` and matches the selectors on small trees |
| 3 | **a width that is not ours** (the 14 px text floor widens the disc strip to 190 to 222 grid px) | the strip over the turn strip at a window the sheets did not read | the strip is anchored by its right edge, so the width cannot reach the turn strip; `--omr-tight` gives up padding at 1280 and below; every window from 1280 to 3440 is a case |
| 4 | **a growth switched off in a third panel** (the Sensor card keeps its size at 115, as the gauge and the strip do) | a player who chose a larger TEXT SIZE for legibility gets a smaller card | disclosed as a named loss (handoff section 9, the CSS and `DemoGate` comments), a decision, not a defect |
| 5 | **two lines that went back on a list a browser read took them off** | the same defect in a place the model cannot see | **not decidable on paper.** The browser read HUD-1 to HUD-8 (handoff section 6) must run before the candidate that carries these two lines reaches production; backing them out is a two-line edit |

## 3. What would make this wrong, and what answers it

- The tip, the card or the chip on the ribbon, the gauge or the strip: rows 1 and 3, then jobs HUD-3, HUD-3b, HUD-3c, HUD-4.
- The Sensor card on the flag, including a Mortiphasm disc's flag and the folded chip: row 2 of the first lane's preflight, jobs HUD-5, HUD-5b, HUD-5c.
- A change that reaches Chapter I, Chapter IV or another treated chapter: row 1, job HUD-7 (every rect within 0.5 px of the r71 `now` reads).
- The guide paragraph over the F1 hero name that `floor.overlaps` lists (review m6): a probe artefact on the CSS (the guide sheet is a scroller, `overflow-y: auto`, and ends above the hero), to be shown by the masked read of HUD-9.
- A claim in a comment, the handoff or the changelog that the proof does not support: the numbers are the layout test's own pins.

## 4. Order of work for the next chapter panel that meets the F1 HUD

1. Read what the panel's own sheet places and what the solver places (this change taught: a layout sum cannot see an element the stylesheets do not place; the advisor's bar is placed by the solver and moved by the sheet).
2. Give the solver every box the sheet cannot move, and turn off any slide that assumed it did not.
3. Test the end result through the real HUD, not the source text.
4. Write the browser jobs with predictions first, and do not list the chapter until they have run.
