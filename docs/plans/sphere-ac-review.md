# sphere-ac: paper preflight (AGENTS.md rule 15)

Written before building, 2026-09-30. `node tools/critic-plan.mjs --paths` on the
files this track touches classes the change as **DEEP**, but the reason it gives is
the build's history ("30 substantial checkpoints since the last deep review"), not
this change: the systems it names are "FFX HUD" only. This preflight is the paper
check the rule asks for anyway.

**Decision:** D-290, Bailey 2026-09-29 ~21:00 EDT, "I'll go with all of your
recommendations please" (recommendation 4). Sphere Grid A (first-time explainer
card) + C (auto-learn with undo). **Game case: FFX only.** The Sphere Grid is FFX's
levelling board [research/visual-bible.md §5.4, research/ffx-combat-core.md §10];
FFX-2 has dresspheres and the Garment Grid, and `src/ui/ffx2/` is not touched.
Option B (phone page) is D-295, built later on top of this branch; not here.

**Targets:** `docs/concepts/fb-0929/sphere/option-a-explainer.jpg` and
`option-c-autolearn.jpg` (1600x900). Anything they do not show is not built.

## What changes, and what it can break

| Change | Risk | Guard |
|---|---|---|
| New `sphereGridAutoLearn.ts`: a planner that walks and activates only through `SphereGridModel.moveTo` / `activate` | A second copy of the grid rules drifting from the model | The planner only *chooses*; every S.Lv and sphere is spent by the model's own calls. Test: auto-learn equals the same steps done by hand. |
| Undo snapshot / restore | Restores too little (session walk record, pouch, pool HP) or too much (another tab's edits) | Snapshot exactly the fields the model writes; test that undo gives a byte-equal build and model state. The result card closes (as KEEP) when the player does anything else on the grid, switches member, or leaves the tab, so UNDO can never roll back a change made elsewhere. |
| `seen` flag | A new SaveData field would be save-data class | Uses the existing `seenCoach` list through `coachState.markSeen` / `shouldShow` with a new id `sphere-grid-card`; no schema, no migration, no `ALL_COACH_IDS` entry (so the veteran rule does not pre-mark it; a veteran sees the card once). `?coach=off` and BATTLE HELP OFF suppress it like every coaching surface, so captures stay clean. |
| The card is modal | Enter under the card starting the battle; Left/Right switching the tab under it | While the card is open the panel consumes every button and returns `true`, and the dim takes the pointer. |
| `SphereGridView.ts` (811 lines) needs the NEW rings | Growing a file already over 400 | Move the lock plate and the legend strip into a new `sphereGridDraw.ts` with the new highlight drawing; the view shrinks. |
| `party-prep.css` (462 lines) | Same | New styles in a new `sphere-grid-help.css`. |
| Phone (390x844) | The tab is a letterboxed 0.61 board; buttons inside it are about 7 px tall | The tab's phone layout stays. The card and the result card mount on the unscaled `.prep` layer at phone width with 44 px buttons; `?` and AUTO-LEARN get a 44 px dock in the empty letterbox band under the board, shown only while this tab is open. |

## Rules the planner must not invent

- Movement and prices: the model's (`moveCost`: 1 S.Lv onto new ground, 1 per four
  travelled steps [§10.1]).
- Activation: only the node the character stands on, as the tab does today. Whether
  FFX activates next-door nodes is unsourced (handoff fb-0929-sphere "Adjacent
  activation"), so the planner does not.
- Locks: the planner never opens one. Keys are a shared, scarce pouch and opening is
  global [§10.1 "lock removals ... are global"]; spending them is the player's call.
  It walks only through open ground (the same `blocked` rule as the model).
- Order: cheapest affordable node first (S.Lv, then steps, then node id), repeated
  until nothing the pouch can pay for is within the S.Lv left. Deterministic.

## Evidence plan

Run the build (dev server on 8460-8479, headless Playwright, GPU): Chapter I, SPHERE
GRID, first open shows the card; GOT IT; `?` reopens; reload keeps it seen; AUTO-LEARN
on Tidus; UNDO restores S.Lv and stats; KEEP; phone 390x844 taps. Target and build side
by side into `docs/concepts/fb-0929/sphere/final/`.
