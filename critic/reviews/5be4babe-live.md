Build / artifact / target version: main 5be4babe, bundle Dat8v42m, artifactHash 75a8050bfe31cb8e65106b4539f8137d4cccb5a0448c675ef6b7d1dbf22f1b41
Review: live
Deployment: PASS
Changed area: NOT APPLICABLE
Ship: NOT APPLICABLE (live review does not re-judge the ship decision; see critic/pending/5be4babe.json for the still-owed focused and deep obligations)
Milestone: not assessed
Quality: last full score at build 7191674 (round 03); not recomputed here
Targets: not assessed in this pass
Top issues: none found in the tested scope
Coverage: tested = exact-artifact manifest verify-live, real-input smoke (title -> chapter select -> Chapter IX Yojimbo -> party prep -> battle start -> cutscene -> two real Attacks, cancel path on a submenu, pause/resume, H hide/restore panels, prerendered music check, reload smoke); reused = none; not tested = full upgrade matrix (CHK-024 full scope), other four chapters' real-input smoke, physical device/Safari/controller input, chapter clear/results flow
Next required review and why: the focused review of the changed area (systems: FFX CTB engine, FFX-2 ATB engine, battle presenter/lifecycle, chapter registry, asset loader, scene runner) is still pending per critic/pending/5be4babe.json, plus the accumulated deep review carried since fd0ae96 (12 builds now carrying it)
Elapsed review time / repeated work avoided: about 30 minutes; no evidence reused from a prior build (Chapter IX is new)

## 1. Exact artifact (CHK-017)

Ran:
```
node tools/artifact-manifest.mjs verify-live --manifest critic/artifacts/5be4babe.json --url https://baileypillon.github.io/pyrefly-reprise/ --changed-from critic/artifacts/1c22066e.json
```
Result: **PASS**. 111 files checked (changed-from diff against the previous build 1c22066e), 0 mismatched, 0 missing, 0 wrong content type, 0 errors. `critic/artifacts/5be4babe.json` exists and matches the live manifest hash `75a8050bfe31cb8e65106b4539f8137d4cccb5a0448c675ef6b7d1dbf22f1b41`.

## 2. Real-input smoke (CHK-016)

Built-in browser, fresh tab, cache-busting query `?cb=verify5be4babe`, 1600x900 for the battle portion (title/chapter-select were captured at the pane's default emulated size before the viewport was corrected to 1600x900; the battle portion — the part this release actually changes — was fully exercised at 1600x900).

- Title screen loaded (real screenshot, "PRESS ENTER" visible). Clicked into the canvas, pressed Enter (real key) -> reached Party Prep for Chapter I by default (confirmed via screenshot before proceeding), pressed Escape to back out to Chapter Select (confirmed by screenshot: "CHAPTER SELECT" header, list of chapters).
- Selected **Chapter IX — Yojimbo** with a real click on the "Yojimbo" chapter card (confirmed: boss row read "Yojimbo + Lady Ginnem + Daigoro", CTB tag, "Cavern of the Stolen Fayth — the last chamber"). Pressed Enter (real key) -> **Party Prep, FFX · IX, "Yojimbo — A Guardian's Last Duty"** (confirmed by screenshot header).
- Clicked "START BATTLE" (real click) -> chapter intro cutscene played: "CHAPTER IX · CAVERN OF THE STOLEN FAYTH — THE LAST CHAMBER", dialogue lines from Lulu, Wakka, Kimahri, Rikku, Tidus advanced with real Enter/click presses (typewriter-paced; confirmed each line advanced with a new screenshot). Cutscene ended into the CTB battle proper (confirmed by the CTB turn-order rail, party HP/MP bars for Lulu/Kimahri/Yuna, and the strategy guide panel naming "Doom Yojimbo", the Zanmato gauge, and Ginnem/Daigoro being untargetable — all sourced content from `research` per the in-game citations, e.g. "ffx-yojimbo §4.1").
- Confirmed the destination screen/chapter/state before each capture per CHK-016 (chapter-select card text, party-prep header, cutscene banner, battle HUD turn order and boss name all read from the page, not assumed).
- **Positive path**: on Kimahri's turn, clicked ATTACK (real click) -> auto-targeted Yojimbo (the only legal target) -> 297 damage landed, Zanmato gauge advanced 0% -> 5%. On Yuna's turn, opened WHITE MAGIC (real click, after dismissing a first-time Auron tip with Enter), then **cancel path**: pressed Escape -> submenu closed back to the top-level command list (confirmed: WHITE MAGIC row highlighted again, no submenu visible) -> a second Escape opened the pause screen (confirmed: pause tab bar "LULU KIMAHRI YUNA CHAPTER GUIDE OPTIONS CONTROLS MUSIC" and character close-up render). Pressed H (real key) with the canvas focused -> pause panels toggled to hidden and back to shown (confirmed both states by screenshot: hidden shows only the close-up portrait with "H SHOW PANELS · ESC RESUME"; shown restores the tab bar and stat panel). Pressed Escape -> resumed to the live battle, Yuna's command menu still open (confirmed: WHITE MAGIC row still highlighted, matching the state before pause). Selected ATTACK (real click) -> 69 damage landed on Yojimbo, gauge advanced to 8%.
- Prerendered music: network log shows `GET .../audio/music/boss-yojimbo.mp3 -> 200`, and `window.__pyrefly.audioDebug()` reports `music.current.name: "boss-yojimbo"`, `playing: "boss-yojimbo"`, and the `boss-yojimbo` track entry as `cached: true, source: "prerendered"` — confirmed playing from the prerendered file, not the procedural synth fallback (`prerendered.manifest: true, sprite: true, spriteDecoded: true`).
- Console errors: **0**. Two `info` and one `warn` line seen across the whole run, none of them errors (`[warn] [painted] .../seymour-flux-body/cast.png still had an opaque white studio background; cleaned it at load time` — a pre-existing art note unrelated to this release's changed files).
- Network 404s: **0**. One `HEAD .../art/backdrops/cavern-stolen-fayth/sakura.png` logged `[FAILED: net::ERR_ABORTED]` immediately followed by a successful `GET` (200) for the same URL — a benign HEAD-then-GET loader probe, not a missing asset; noted, not counted as a defect.

## 3. Reload smoke (CHK-024, lightweight)

Opened the pause Options tab, changed Master Volume from 42 to 52 with a real click on the slider (confirmed by the on-screen value and by reading `localStorage['pyrefly-reprise:save:v1'].settings.masterVolume` = 0.52 before reload). Reloaded the page (`navigate` to the same cache-busted URL). After reload, read the save again: `settings.masterVolume` = **0.52 (survived)**, and progress also survived: `chapters['yojimbo-cavern']` shows `attempts: 1, playTimeMs: 8783.8` (recorded from the battle just played). Both the changed setting and the chapter attempt/playtime progress persisted across reload. **Not tested**: the full upgrade matrix (older save-version migrations, cross-setting interactions) — out of scope for this lightweight pass per the task.

## Notes

- The task's headline claim (Chapter IX Yojimbo playable from chapter select, FFX + Ginnem's Yojimbo + Daigoro) is confirmed live: reachable from chapter select, correct boss roster, sourced strategy-guide content, real combat resolves damage against Yojimbo, real Attack commands land.
- This review only settles the **live** obligation for build 5be4babe. `critic/pending/5be4babe.json` still lists `focused` and `deep` (the deep review carried since fd0ae96 across 12 builds) as pending; this report does not and cannot settle those.
- Built-in browser used throughout (not Playwright/`PYREFLY_BROWSER=gpu`); real OS-level key/mouse input via the `computer` tool, not the `window.__pyrefly` debug API for any navigation step. `window.__pyrefly.audioDebug()` was used only as read-only introspection to confirm audio routing, not to change screen/chapter/battle state.
