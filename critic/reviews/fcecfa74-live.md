Build / artifact / target version: main fcecfa74, bundle CvOwYJX5, artifact dfbabd7ae7a1b0a35d915eb5b116896b894d6849b8cc05daee75d102c16e2057 (deployed 2026-10-11T14:44:38Z under the owner override)
Review: live
Deployment: PASS
Changed area: NOT APPLICABLE (the focused review of this build settled it: changedArea FAIL, ship SHIP)
Ship: not decided here (a live review carries no ship verdict)
Milestone: not assessed
Quality: not scored here (live review)
Targets: not assessed
Top issues: none found in this pass; 0 console errors, 0 4xx/5xx
Coverage: tested: exact artifact (5169 of 5169 files), FFX Seymour Flux attack/cancel/KO/revive/pause/H/P, Fallen Aeons and Ixion music request, hidden 'limit' chapter, reload smoke. Not tested: motion timing by eye, audio by ear, cues for Trema phase 2, Natus, Isaaru, Sin fins/core, Sin face, Evrae re-cut, the full upgrade matrix, an FFX-2 KO/revive
Next required review and why: the deep review carried by this build (the marker lists 49 earlier builds' debt plus this one); this live pass does not settle it
Elapsed review time / repeated work avoided: about 135 minutes, most of it the byte-for-byte fetch of 5169 files; the smoke itself was about 15 minutes

## Step 1: exact artifact (CHK-017) PASS

`verifyLive` from `tools/artifact-manifest.mjs`, full mode (the marker plans a deep review), changed set from `critic/artifacts/2ae1a9e4.json` (10 added, 4 changed, 3 removed). The live manifest names the artifact hash above; 5169 files checked, none mismatched, none missing, none with a wrong content type, no errors. The page as a browser asks for it equals `index.html` once Cloudflare's Web Analytics beacon is removed. `assets/index-CvOwYJX5.js` is served `public, max-age=0, must-revalidate`.

The tool's own command line fetches one file at a time and had not finished after about 50 minutes, so it was stopped and the same `verifyLive` function was run with the fetches done 16 at a time first (`critic/reviews/fcecfa74-live-verify.mjs`, result in `critic/reviews/fcecfa74-live-verify.json`).

## Step 2: real-input smoke (CHK-016) PASS

Headless Playwright, `PYREFLY_BROWSER=gpu` (no black canvas), 1600x900, fresh context, cache-busting query. `window.__pyrefly.build()` returned fcecfa74 / index-CvOwYJX5.js. Script: `critic/reviews/fcecfa74-live-smoke.mjs`; results: `critic/reviews/fcecfa74-live-smoke.json`; frames: `critic/reviews/fcecfa74-live/`.

- FFX Seymour Flux: title, chapter select, party prep, battle, each asserted. Real Enter attack advanced the log. Cancel path: Enter then Escape; Escape at the command menu opens the pause screen (Escape closes it).
- KO and revive: Yuna and Kimahri were set to 1 HP through the debug state, then real attacks were played until the enemy's own action KO'd Yuna (a `ko` event in the log; Tidus and Yuna are down in `ffx-shots/ko-1.png`). The revive was submitted through `forceCommand` (phoenix-down): events action-start, status-remove, revive, action-end; HP 750, alive. These two steps are not menu input.
- Pause: Escape opens and closes, P opens and closes, H hides the panels (text length 861 to 493) and restores them (861).
- Music: Seymour requested `boss-seymour`; Fallen Aeons (Chapter XI, reached with real ArrowRight presses) and Ixion (Chapter XVI) both requested `boss-ffx2-fallen-aeons`, the shared cue; the hidden word 'limit' (typed with real keys) reached the FF7 fight and requested `boss-ff7-guard`. Each was fetched as prerendered `/audio/music/<name>.mp3` and `audioDebug().playing` named it, so it is the prerendered file and not the procedural fallback. One real attack in the FF7 fight advanced it (`ffx2-limit-shots/limit-action.png`).
- Console errors: 0. 4xx/5xx: 0.

## Step 3: reload smoke (CHK-024) PASS, lightweight

Master volume set to 0.42 in the save, page reloaded, the save still read 0.42 with the same keys. No chapter was cleared, so the progress was the setting only. The full upgrade matrix was not run.

## Not tested

The motion picks by eye (only still frames of the KO), audio by ear, the Trema phase 2, Natus, Isaaru, Sin fins/core, Sin face cues and the Evrae loop re-cut, an FFX-2 KO and revive, the full upgrade matrix. The overnight PAUSE file was created for the browser work and removed afterwards.
