Build / artifact / target version: main bc4e70ee (release 24, bundle index-C-3hBxzq.js, live at https://baileypillon.github.io/pyrefly-reprise/) / artifactHash 9ec5397f7de4c34a847f1f249c99fdf2c3a3d0add252cbd49f6eea2cc8583401
Review: live
Deployment: PASS
Changed area: NOT APPLICABLE
Ship: NOT APPLICABLE (live verification does not decide ship; see critic/reviews/bc4e70ee-focused.json for the ship verdict, SHIP)
Milestone: not assessed
Quality: last full score is round 03 on 7191674 (2026-09-19, rubric v1, history only); no v2 score for this build
Targets: not assessed by this review (live verification only; see the focused report for the Shiva tile comparison)
Top issues: none found live at critical or major severity; one instrumentation caveat (FFX-2 tick-advance check inconclusive in its 2 s sampling window, but the chapter still reached a real player turn) recorded under notes, not as a defect
Coverage: tested below; full CHK-024 upgrade matrix and the phone-layout Grand Summon picker issues already disclosed by the focused review (FOC24-01, FOC24-02) were not re-checked here (out of scope for this pass)
Next required review and why: the deep review still owed by this build (carried from ff3884fb and 22 earlier builds, critic/pending/bc4e70ee.json) on the live build: FFX CTB engine, presenter and HUD across the listed chapters
Elapsed review time / repeated work avoided: about 12 minutes of live checking (the artifact verify and smoke script were already drafted by an interrupted earlier pass in this same session and only needed to be run to completion)

# Live verification, release 24 (bc4e70ee)

## CHK-017 — exact artifact

`node tools/artifact-manifest.mjs verify-live --manifest critic/artifacts/bc4e70ee.json --url https://baileypillon.github.io/pyrefly-reprise/ --changed-from critic/artifacts/ff3884fb.json --full --out critic/reviews/bc4e70ee-live-artifact.json`

Result: **PASS**. `artifactHash` matches (`9ec5397f7de4c34a847f1f249c99fdf2c3a3d0add252cbd49f6eea2cc8583401`), `liveManifest: match`, 852 files checked byte-for-byte against the live URL (full run, not sampled, because the deploy marker's planned review includes a deep obligation), 0 mismatched, 0 missing, 0 wrong content-type, 0 errors. This build ships more files than the previous live build (852 vs 588 recorded at deploy time in `critic/pending/bc4e70ee.json`'s `artFiles`) because `--full` walks the manifest's own file list rather than the deploy-time count; both numbers describe the same manifest. The live site serves exactly this artifact.

## CHK-016 — real-input smoke, screen-asserted throughout

Headless Playwright, `PYREFLY_BROWSER=gpu` (verified: `ANGLE (NVIDIA, NVIDIA GeForce RTX 5070 Ti ...) Direct3D11`, no black canvas, no SwiftShader fallback needed), 1600x900, fresh browser context per chapter, cache-busted URL (`?cb=<timestamp>`). Every wait asserts the destination screen/phase and throws on timeout rather than falling through (CHK-016's own rule); nothing here was screenshotted off a stale or wrong screen.

- **Title -> chapter select** by real `Enter`: reached `chapter-select` with the current 15-tile board (14 unlocked, `seymour-anima-macalania` COMING), unchanged from the focused review's board.
- **Hidden FF7 fight**: in its own fresh context, typed L-I-M-I-T on chapter-select; the door opened straight to `battle` (CHK-025's secret door, confirmed live).
- **Chapter IX (yojimbo-cavern), Grand Summon, real keys**: setup only via the debug API (seed 1, Yuna's overdrive gauge set to 100 — the debug API never drove the picker itself). Real `Attack` inputs advanced the CTB queue to Yuna's command menu; real arrow keys opened Overdrive -> Grand Summon and moved the cursor to the 3rd listed row (`["Valefor","Ifrit","Ixion","Shiva","Bahamut"]`, so row 3 = Ixion); real `Enter` picked it. **Ixion came out** (`aeonSummoned: "ixion"`, matching the picked row), the three party figures faded to alpha 0 while Ixion stood at alpha 1 (`partyFadedForSummon: true`, PR-0181), and the aeon's own command menu opened. Real `Dismiss` (cursor + Enter) brought the party back to alpha 1 with all three rows (`dismissRestoredParty: true`). This reproduces the focused review's positive-path finding live.
- **Pause / hide / resume**, real keys, mid-battle: `P` opened the pause screen, `H` toggled the panel hide and restore, `Escape` closed the pause and returned to the battle. All three fired correctly.
- **Audio**: `window.__pyrefly.audioDebug()` reported the currently playing track as `boss-yojimbo` with `source: "prerendered"` — prerendered music is fetched and playing, not the procedural synth fallback.
- **FFX-2 chapter to a player turn**: in its own fresh context (seed 2), `ffx2-bahamut` reached the `battle` screen and then a real command-menu phase (`ffx2ReachedPlayerTurn: true`). The narrow 2-second tick-advance sample taken immediately at battle open did not show `battleLog().length` growing (`1 -> 1`) — most likely because the first two seconds are still the battle's opening beat before any actor's gauge fills, not a frozen clock, since the same run went on to reach a real command menu shortly after (which requires the ATB clock to have advanced). Recorded as an instrumentation caveat, not a defect: the check as scripted was inconclusive on the specific claim "ticks visibly advance in 2 s immediately at open," while the stronger claim "the chapter reaches a live player turn under running ticks" is PASS.
- **Console / network**: 0 console errors, 0 responses >= 400, across all four browser contexts used in this run (main, FF7, FFX-2, plus the reload).

Screenshots (`docs/screenshots/` were not the target directory for this run; captured to the session scratchpad and available on request): 01-boot, 02-chapter-select, 03-after-limit, 04-ch9-first-menu, 05-yuna-menu, 06-picker-third-row, 07-summon-moment, 08-aeon-alone-menu, 09-party-back, 10-pause-hidden, 11-pause-shown, 12-ch9-end, 13-after-reload, 14-ffx2-battle-open, 15-ffx2-player-turn.

## CHK-024 — lightweight reload smoke

On the Chapter IX context, after reaching the post-Dismiss state: set `pausePanelsHidden: true` via `app.save.setSettings`, and recorded a marker string via `markCoachSeen('live-smoke-bc4e70ee')` as one piece of progress. Reloaded the page (fresh `load`, waited for `__pyreflyReady`). Both survived: `pausePanelsHidden` read back `true`, and the marker was present in `seenCoach` after reload. This is the lightweight check only — the full upgrade matrix (fresh player / returning player / previous-live-build save fixture / invalid or truncated storage / reset flow) was **not** run in this pass; it belongs to a persistence-focused review, per RUBRIC.md §5.

## Deployment verdict

**PASS.** Step 1 (CHK-017) is PASS, and the real-input smoke ran clean on every intended state: the owner-facing Grand Summon fix (PR-0181) works live exactly as the focused review found on the candidate — the chosen aeon comes out, the party leaves the field, Dismiss restores it — the hidden FF7 door opens, one FFX-2 chapter reaches a player turn, pause/hide/resume all work, prerendered audio plays, and the reload smoke preserves both a setting and a piece of progress. Zero console errors and zero bad responses across four contexts. No new defect was found live that the focused review's disclosed majors (FOC24-01 phone Grand Summon list hidden behind the boss gauge panel, FOC24-02 letter fallback on the aeon status row) do not already cover; this pass did not re-run the phone-viewport checks (out of scope; already disclosed).

## Coverage

**Tested:** artifact identity (852 files, full byte diff from ff3884fb's manifest); title -> chapter-select; hidden FF7 door to a real battle; Chapter IX Grand Summon positive path (pick a non-default row, aeon fights, party hidden) and cancel/negative-adjacent path (Dismiss restores the party); pause/hide/resume real-key cycle; prerendered-vs-synth audio check; one FFX-2 chapter to a real player turn; lightweight reload persistence (one setting, one progress marker); console-error and >=400-response sweep across four contexts.

**Reused:** none (no evidence from another build's report was reused for this build's claims).

**Not tested:** the full CHK-024 upgrade matrix (fresh/returning/previous-build-fixture/invalid-storage/reset); the phone-viewport Grand Summon picker (already disclosed live-equivalent by the focused review, FOC24-01/02, not re-verified here); gamepad/touch input; Mix and Rage pickers; other FFX chapters' Grand Summon rows; win/loss/retry outcome paths beyond the KO-exit-by-Dismiss shown here.

## Notes

- The artifact-manifest verify and this smoke script were drafted by an interrupted earlier pass in this same session (found as session scratch files, `.a44297ca-live-smoke-bc4e70ee-tmp.mjs`, with 3 of 15 screenshots already on disk); this pass completed the run rather than rewriting it, and added a WebGL renderer check and the `PYREFLY_BROWSER` args to the existing script to make the GPU-mode claim verifiable.
- Console errors: 0. Not-found responses: 0.
