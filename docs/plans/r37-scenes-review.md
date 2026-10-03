# r37-scenes: paper preflight (RUBRIC section 9; critic-plan class DEEP after deploy)

Written 2026-10-03 for branch `r37-scenes` (from `c69de96a`). `node tools/critic-plan.mjs --paths <the changed files>` says **DEEP, after
deploy** (`src/scenes/index.ts` is the chapter registry; "34 substantial checkpoints since the last deep review"), obligations live + focused +
deep. Nothing here is the save-data class: no `SaveData.ts`, no schema, no settings key, no persistence (the glow reuses LIVING PAINTINGS and
REDUCE MOTION, no new row), so no `-savedata` branch is needed.

## What can go wrong, per item, and the check that tells

| item | game case | the way it breaks | the check |
|---|---|---|---|
| A-9 Ginnem's glow | FFX only (Chapter IX) | the halo plate lies behind the wrong plane (back-face culled: it did, until `DoubleSide`) or off her body at another window size, a mirrored figure draws it mirrored, the motes keep spawning with the look off, REDUCE MOTION still moves, the plate is built every frame, a mote layer is never scaled to the render height or never disposed | `tests/unit/ginnem-glow.test.ts` (outline, switch table, painting-to-world incl. mirrored quad, no-DOM safety, dispose); headless captures at 1600x900, 2000x1012, 390x844 in the battle and the post scene; `__pyrefly.fx.snapshot().ginnemGlow` read in each switch state (on, REDUCE MOTION via OS preference, LOW tier, look off, back on) in a dev and in a production build |
| PR-0300 plate wings | FFX-2 only (XV den-of-woe; IV, XIII bevelle-underground) | a wing shows a visible mirror seam; a wing is hidden by option B's plates (it is not named `backdrop-layer-*` for that reason); it is not blurred like the painting under the menu's focus (BackdropFocus patches `backdrop-wing-*`); it grows a scene whose plate already fills the frame | `tests/unit/plate-wings.test.ts` (both scenes, every rig, four window shapes, plus the defect pinned at 0.94); 2000x1012, 1440x900, 390x844 captures; the mirror chevron in the lower right of XV's plate is visible in the 2000x1012 frame and is disclosed |
| PR-0061 hurried opening | both | a held Confirm that is not a skip starts a hurried opening; a retry, a chained link or a debug run gets one; the card is dropped; the flag leaks into the next battle | `tests/unit/presenter-opening-skip.test.ts`, `opening-hurry.test.ts`, `flow-opening-hurry.test.ts`; the round's own hold protocol on production builds, base against branch, three chapters; a tapped scene still gets the full 6.6 s opening (measured) |

## Reach

Shared files touched: `src/scenes/types.ts` and `index.ts` (an optional field, one loop), `src/engine/Backdrop.ts` (one `adopt` method),
`src/engine/fx/a/BackdropFocus.ts` (a name test), `src/engine/BattlePresenterPorts.ts` (one optional port method),
`src/engine/OpeningSkip.ts`, `BattleScreen.ts`, `BattleScreenFlow.ts`, `CutsceneScreen.ts`, `MomentOverlay.ts`, `CutsceneStage.ts` and its css. Every
new field and method is optional and additive (`docs/CONTRACT-CHANGES.md`, 2026-10-03). The deep review's first things to look at: a Chapter IX
battle and post scene with each eye-candy switch, XV and IV at 2000x1012 and 2560x1080, and a hold-skipped entry into I, IV and VII against a
tapped one.
