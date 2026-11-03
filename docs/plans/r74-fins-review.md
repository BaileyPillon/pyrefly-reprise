# Paper preflight: Chapter XVII (Sin's Fins and Core) joins the booth treatment list, the nineteenth and last (lane `r74-fins`, FFX only)

> The paper preflight AGENTS.md rule 15 asks for before a change `tools/critic-plan.mjs` classes as deep. It follows `docs/plans/booth-b4-last-review.md` (the same class of change, one chapter at a time). Written after the first review of `f55189837` (2026-11-02, minor 5: the first cut had none), so the findings of that review are answered here too. Nothing in it is a browser read; the jobs are in `docs/handoff/r74-fins.md` section 7.

```
node tools/critic-plan.mjs --paths src/engine/motion/DemoGate.ts,src/engine/motion/PieceHoldsLast.ts,src/ui/ffx/sin-hud.css,src/ui/hudf1/HudF1Switch.ts
  review:       DEEP (a FOCUSED review of the production candidate before the deploy; the deep review on the live build, which this build owes)
  because:      src/ui/hudf1/HudF1Switch.ts: unclassified product path is a shared system
  systems:      FFX HUD; effects, lighting and sprites; unclassified product path
  checks:       CHK-003 004 006 007 008 009 010 013 015 016 017 020 021 022 026 027
```

Without `HudF1Switch.ts` the same call reads FOCUSED. That file is one table line (`F1_TEXT_CEILING['sin-fins-core'] = 115`) and its comment; whether to classify it in `critic/policy.json` is the driver's call (handoff section 10, question 2).

## 1. What the change is

One line in `DemoGate.TREATED_CHAPTERS` (`sin-fins-core`, FFX, `since: 'r74'`), one row in `PieceHoldsLast.ts` (six holds), the F1 text-size ceiling row, and three rules in `sin-hud.css`: the Fin plate moved clear of the F1 turn strip (right-anchored, lower than release 72's, one step at TEXT SIZE 115) and the action banner stepping under it while a plate stands. Tests: four new files and the pins that counted eighteen. No number of a fight, no art, no contract file.

**Game case (rule 14): FFX only.** `sin-fins-core` is an FFX chapter (CTB, Cid's Trigger Command, the airship range: `research/ffx-sin.md` section 0.3); the Fin plate is the Sin HUD's, an FFX widget; no FFX-2 table or sheet is touched (the new CSS selectors need `.ffxhud`, and the FFX-2 root is `.ffx2hud`).

## 2. What is NEW in this chapter (each is a place the treatment can break)

| # | the chapter differs by | the piece it can break | where it is read |
|---|---|---|---|
| 1 | **a standing HUD panel wider than the band the F1 slab leaves** (the Fin plate, 195.9 grid px with the charge line, in a band of 274 / 226 / 177 at TEXT SIZE 100 / 115 / 130) | the F1 turn strip (the r70 majors of IX and XII were this class), the boss ribbon | `r74-fins-hud` against the real sheets and the shipped font; FIN-1 to FIN-3 |
| 2 | **two panels the zone model does not list that share the plate's column**: the top HELP bar above it and the action banner below it | a panel covered by the plate (z-index 12) | the review's findings; `r74-fins-hud` "the HELP bar stands above the plate" and "the action banner stands under the plate"; FIN-9 and FIN-10 |
| 3 | **a plate drawn from the room's brightest painting** (0.659 against the Farplane's 0.628 that clipped) | the bold look clipping to white | `hd2d` and `arena` held (the V and XI pattern); FIN-4 |
| 4 | **three links in one chapter** (two Fins on the range director's deck, then the giants and the Core) and **a pose set Chapters VIII and XVIII share** (their real clips hop on this deck) | the seams (a title or a sunk HUD between links), the real clips | the REAL chain of the shipped fight (`r74-fins-chain`); `real` held; FIN-6 |
| 5 | **a Trigger Command in the party** (Cid) whose orders print as banner lines | the banner against the plate | the banner rule; FIN-9 |

## 3. What would make this wrong, and what answers it

- A plate across the strip or the ribbon: row 1; the plate is right-anchored so its gap to the strip does not depend on its width; the ribbon's skew is in the model.
- A plate across the HELP bar or a banner across the plate: row 2; the plate's top is 6.0 under the bar's foot and the banner's top 6.0 under the plate's foot, each from the sheets and the font, each failing a test when the sheet moves (seven mutations were run).
- The banner rule losing to the text-size step: specificity is computed in a test (the rule beats the step's `html[data-text-size]:not(...):not(...) .ffxhud.hud-f1 .ig-banner`).
- A table of the wrong game: `r74-fins-rows` and `r74-fins-wiring` fail when the chapter is listed as FFX-2.
- A scope leak: 29 chapters, 19 pieces, both scopes and the F1 gate at 100, 115 and 130 were snapshotted with and without the candidate's four source files (the review): the only differences are the `sin-fins-core` block, the ceiling table and the two lists.
- A deploy before the browser reads: the hold condition on the first page of the handoff (FIN-1 to FIN-4 and FIN-9); whether the cut gate enforces it is open question 1 there (a `LIFT_NOTES` row gates the CHK-027 run only).

## 4. What the review of `f55189837` found, and the preflight rows it adds

The first cut modelled the F1 zones and the font but not the HELP bar or the banner, took the ribbon's declared box and not its skew, and hard-coded the charge line's style. Rows 2 and the sheet-driven width and height in `r74-fins-hud` close those; the findings and their fixes are in the handoff, section 12. The lesson for the next chapter-specific panel: list **every** absolutely-placed HUD element that can be up in the same rows (banner, help bar, telegraph, advisor card, order chip) before writing the rule, not only the F1 zones.
