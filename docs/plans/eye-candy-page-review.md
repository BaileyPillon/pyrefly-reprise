# Paper preflight: the EYE CANDY page (D-317, both games)

Rule-15 preflight for track `eye-candy-page` (branch `eye-candy-page` in `D:/pyrefly-advisor-v4`, from `ef3f6bbf`,
release 35). **Written at hand-off, not before the build:** the driver commissioned the build straight from the
approved options round (`docs/concepts/eye-candy-settings-2026-10-02/README.md`, whose §7 "Notes for whoever builds the
pick" served as the plan), so this page is the review's checklist rather than a gate the build passed through.

Bailey, 2026-10-02 ~01:15 EDT, on the settings options page (recommendation A): "all your recommendations, godspeed"
(D-317). Earlier, D-297: "in the settings I want to be able to turn each one off. Default will be on."

## 1. What `critic-plan` says

```
node tools/critic-plan.mjs --paths src/app/SaveData.ts,src/app/saveComfort.ts,src/app/fxParts.ts,src/app/fxLooks.ts,
  src/app/applyComfort.ts,src/app/screens/pause/eyeCandyPage.ts,src/app/screens/pause/PauseOverlays.ts,
  src/app/screens/PauseScreen.ts,src/ui/common/pause-eye-candy.css,src/engine/fx/eyeCandyFlags.ts
  review:        DEEP
  before deploy: DEEP review of the production candidate (save-data class or milestone claim)
  obligations:   live + focused + deep
  games:         both, all 18 chapters
  checks:        CHK-002 CHK-003 CHK-008 CHK-009 CHK-013 CHK-015 CHK-016 CHK-017 CHK-020 CHK-021 CHK-022 CHK-024
```

Save-data class: nine new `Settings` fields and an upgrade rule. A deep review runs **before** the build goes live.

## 2. Game case (rule 14)

Both. One pause and one save serve FFX and FFX-2; OVERDRIVE SHOT is listed only in an FFX chapter and DRESSPHERE SHOT
only in an FFX-2 chapter (D-317; the Overdrive and its input are FFX's, `research/ffx-combat-core.md` §5; the
spherechange sequence is FFX-2 only, `research/ffx-vs-ffx2-presentation.md` §6), so each game shows 11 of the 12
switches. FF7 draws no eye candy and shows no EYE CANDY row.

## 3. What changes, and the risk of each

| # | Change | Risk | Guard |
|---|---|---|---|
| 1 | Nine booleans in `Settings`, default ON | a returning player loses a setting, or a value that is not a boolean reaches the fx | the `...raw.settings` spread keeps every stored field; `migrateFxParts` turns anything but a boolean into its look's value; fixtures from releases 33, 34 and 35 (CHK-024) |
| 2 | The upgrade rule: a part the blob does not hold takes its look's value | a player who had a look OFF finds new effects ON when the look returns; or the rule re-decides on every load | it reads the raw blob, so it fires only while a part is missing; after the first write every part is stored; idempotent `migrate` |
| 3 | The three look rows leave OPTIONS for one EYE CANDY row | a test or the critic drives a row that is gone; the OPTIONS list changes length | the looks keep their ids, values and `adjustSetting` path on the page; `pause-remake` and `pause-fx-looks-rows` re-pinned |
| 4 | A second page overlay beside CREDITS | input leaks to the hidden list; Esc resumes the game instead of going back; focus lost | one `pageInput` for both pages; Esc / X / Backspace / Circle / Start go back to the EYE CANDY row with DOM focus; L1 / R1 / Q / E / a tab close it |
| 5 | The cursor-dot fix on the settings column | a row moves, or a label is cut | padding given back by a negative margin; measured with real keys on both games and both sizes, mirrored too |
| 6 | The seam provider (`eyeCandyFlags.ts`) | a part reads ON while its look is OFF; REDUCE MOTION flips a switch | look AND part per key, installed on every settings write; REDUCE MOTION is shown, never written |
| 7 | `PauseScreen.ts` (399 lines) and `SaveData.ts` (573, over the cap) | rule-7 growth | both kept at their line counts; new code in new modules |

## 4. What the deep review should check

- CHK-024 matrix: fresh profile; a release-33, -34 and -35 save with a look OFF put in localStorage before boot (the
  look's parts come up OFF, every other part ON, everything else verbatim); a reload after flipping; a truncated blob;
  two tabs.
- The page by keys, pad, mouse and touch in an FFX and an FFX-2 chapter at 1600x900 and 390x844: open, move, flip a part,
  a look, ALL OFF, ALL ON, close each way; focus back on EYE CANDY; the OPTIONS cursor dot visible.
- The mirrored pause (YUNA or KIMAHRI in FFX, PAINE in FFX-2) and a short window (1280x720, 844x390).
- Nothing in FF7.
- When the mix-build lane's looks land: each part's switch actually stops its effect (the seam answers; the play site
  must ask).
