```text
Build / artifact / target version: main ce05b02c, bundle i8Mr-QwD, artifactHash fc45319a67de442052f25bc72daa242916e61180f76e4e361532ea4be2c00f2d
Review: live
Deployment: PASS
Changed area: NOT APPLICABLE
Ship: NOT APPLICABLE (live review does not decide ship; already deployed under owner override 2026-09-26)
Milestone: not assessed
Quality: not assessed (this is a live-deployment check, not a scored round)
Targets: not assessed
Top issues: none found in the scope of this pass; see coverage.notTested for what a focused/deep review still owes
Coverage: tested = exact-artifact byte compare (94 files) + real-input smoke of the FFX-2 command menu, pause, and prerendered audio + a lightweight reload-progress check; reused = none; not tested = combat-core specifics (all-target hits, Acta Est Fabula, the menu-cancel trigger condition), the 23 poses, Sensor-hidden-for-Yojimbo, ffx2-vegnagun-shuyin, settings-survive-reload, the full save/upgrade matrix
Next required review and why: the marker critic/pending/ce05b02c.json still owes focused and deep review of the changed area (FFX-2 ATB engine option B, menu-cancel, the pose install, asset loader) -- this live pass only settles the "live" obligation
Elapsed review time / repeated work avoided: ~22 minutes; reused nothing (first live check for this build)
```

## Deployment verification (CHK-017, CHK-016, CHK-024)

### CHK-017 -- the exact artifact

`node tools/artifact-manifest.mjs verify-live --manifest critic/artifacts/ce05b02c.json --url https://baileypillon.github.io/pyrefly-reprise/ --changed-from critic/artifacts/43dca986.json` returned:

```json
{
  "result": "PASS",
  "artifactHash": "fc45319a67de442052f25bc72daa242916e61180f76e4e361532ea4be2c00f2d",
  "liveManifest": "match",
  "checked": 94,
  "mismatched": [],
  "missing": [],
  "wrongType": [],
  "errors": [],
  "notes": []
}
```

The live site names this exact artifact and every compared file (94, sampled per the tool's default; `--full` was not requested because the pending marker's planned review for this build is `deep`, which is a separate obligation from this live pass, not this check) is byte-identical with the right content type. **PASS.**

### CHK-016 -- screenshots/state prove what the harness claims

Headless Chromium (Playwright), `PYREFLY_BROWSER=gpu` args (`--use-angle=d3d11 --enable-gpu --ignore-gpu-blocklist --enable-webgl --disable-gpu-sandbox`) against the **live URL** with a cache-busting `?smoke=` query, a fresh browser context, viewport 1600x900. Real key presses throughout; the debug API (`window.__pyrefly`) was used only to assert state and, per this project's own e2e convention (`tests/e2e/intent-pause.spec.ts`), to skip the opening cutscene quickly on the way to the first real command menu.

Path taken, each step's `screen()`/`snapshotState()` checked before the next action:

1. Boot -> `title` (`__pyreflyReady`).
2. Real `Enter` -> `chapter-select`.
3. `trigger('select:ffx2-bahamut')` (chapter selection is a menu click in the real game; the trigger stands in for that click) -> `party-prep`.
4. Real `Enter` (the game's own "ENTER BEGINS THE BATTLE" binding, `PartyPrepScreen.ts`) -> `cutscene`.
5. `skipCutscene()` looped until the screen left `cutscene` -> `battle`.
6. Waited on `snapshotState()` for a player turn, then real `Enter` twice: opened and confirmed a command (**positive path**).
7. Real `Enter` then real `Escape`: opened a submenu, backed out of it (**cancel path**) -- `Escape` is the menu's own back button here (`BattleScreen.ts` `canPauseOnCancel`), confirmed correct by source before relying on it.
8. Real `KeyP` -> `pause`. Real `KeyH` hid the panels, real `KeyH` again restored them. Real `Escape` (resumes at the pause screen's tab focus level per its own header comment) -> back to `battle`.

Zero console errors and zero HTTP responses >= 400 for the whole run.

**Audio:** `audioDebug()` at the point the FFX-2 boss track was live showed:

```json
{ "name": "boss-ffx2-aeon", "about": "\"Static Coronation\" ...", "cached": true, "source": "prerendered" }
```

`prerendered.manifest: true`, `cues: 25`, `sprite: true`, `spriteDecoded: true`. The playing track is the **prerendered** file, not the procedural synth fallback (`source` distinguishes the two per `AudioManager.ts` debug()). **PASS.**

### CHK-024 -- reload smoke (lightweight; the full upgrade matrix is out of scope for this pass, see `coverage.notTested`)

Progress: after the battle above ran for one turn (`battleLog().length === 31`), reloading the page and reading `localStorage['pyrefly-reprise:save:v1']` showed:

```json
"ffx2-bahamut": { "attempts": 1, "playTimeMs": 36448.6, "cleared": false, ... }
```

The attempt/play-time record survived the reload. **This half passes.**

Setting: a real-key attempt to change one Options-tab value (`P`, `E`, `E` to cycle to the OPTIONS tab, `ArrowDown` to enter it, `ArrowLeft` x2 to adjust the first row, `Escape`, `Escape`) did **not** change the persisted `settings` object -- `masterVolume` etc. were byte-identical before and after. Rather than guess whether this is a real defect or a wrong key sequence (this reviewer's UI navigation, not a repro of a player action confirmed against the pause screen's own input map beyond what the header comment states), it is reported as **UNVERIFIED** and left out of the report's checks array so it is not silently folded into a PASS. It does not block the deployment verdict below, which rests on CHK-017 + CHK-016 + the progress half of CHK-024.

## Deployment verdict

**PASS.** Step 1 (CHK-017) is PASS, and the real-input smoke ran clean (0 console errors, 0 >=400 responses) through the intended states: title, chapter select, FFX-2 party prep, the opening cutscene, the first FFX-2 command menu (positive and cancel paths), pause/hide/restore/resume, and prerendered audio confirmed playing. The unresolved setting-persistence sub-case is a coverage gap, not a live-artifact or smoke failure, and is called out above rather than hidden.

## What this pass does not answer

This is the **live** obligation only. The candidate's **focused** and **deep** review (FFX-2 ATB engine option B, the menu-cancel correction's exact trigger condition, the 23 new poses, the Sensor-panel change, asset-loader/manifest changes) are still owed per `critic/pending/ce05b02c.json` and are unaffected by this report.
