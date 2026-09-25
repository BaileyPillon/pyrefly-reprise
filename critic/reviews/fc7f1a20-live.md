Build / artifact / target version: main fc7f1a20, bundle BQnfWT0X, artifact hash e8fff6a590be9577556546d5e35437f23c69a30b4caa6dca1ea85251dce9d006
Review: live
Deployment: PASS
Changed area: NOT APPLICABLE
Ship: NOT APPLICABLE (this is a live/deployment check, not a ship decision)
Milestone: not assessed
Quality: not assessed in this pass (see the deep review still owed for fc7f1a20)
Targets: not assessed in this pass
Top issues: none found
Coverage: tested (exact-artifact byte comparison, real-input smoke of Chapter XIII Trema entry through a real Attack on Oversoul Paragon, pause/H/resume, prerendered-audio check, reload smoke); reused (none); not tested (full save/settings upgrade matrix — CHK-024's lightweight pass only; Trema/Paragon-vs-Trema phase transition; other chapters; cross-browser/device coverage)
Next required review and why: the deep review already owed for fc7f1a20 (carried from fd0ae96 through 5be4babe) — this live pass does not settle it
Elapsed review time / repeated work avoided: ~12 minutes; reused nothing (first live check of this build)

## 1. Exact artifact (CHK-017)

Ran `node tools/artifact-manifest.mjs verify-live --manifest critic/artifacts/fc7f1a20.json --url https://baileypillon.github.io/pyrefly-reprise/ --changed-from critic/artifacts/5be4babe.json`.

Result: **PASS** — `liveManifest: match`, 81 files checked, 0 mismatched, 0 missing, 0 wrong content type, 0 errors. The live URL serves exactly this artifact; a matching bundle name is not what was relied on here, every compared file's bytes were checked.

## 2. Real-input smoke (CHK-016)

Headless Playwright, `PYREFLY_BROWSER=gpu` (GPU renderer confirmed as "ANGLE (NVIDIA, NVIDIA GeForce RTX 5070 Ti … Direct3D11 …)", not SwiftShader), fresh browser context, viewport 1600×900, cache-busting `?v=<timestamp>` query. Screen/chapter/state asserted via `window.__pyrefly.screen()` / `battleState()` before each capture, never assumed.

- Title reached; real click + real Enter left the title; Auron's briefing carried the line "Nine fights. That is all this is." (confirmed live, matches the headline claim).
- Real Enter dismissed the briefing; reached chapter-select.
- The **Trema** card (`aria-label="Trema"`) was present in the FFX-2 group; two real clicks (rail → plate, per the board's own two-click rule) selected and confirmed it — no debug `select:` trigger and no `gotoChapter` shortcut were used for this navigation.
- Real Enter carried prep → pre scene (cutscene, advanced with a real Enter, not skipped via debug) → battle start, landing in Chapter XIII with Oversoul Paragon on the field.
- Reached a real player command menu (`awaitingMenu: true`).
- **Real Attack**: Enter (open list, Attack is first) → Enter (confirm Attack) → Enter (confirm default target), all real keyboard presses. Paragon's HP dropped from 210,000 to 206,674 and the turn counter advanced from 4 to 5 — the attack landed, read from `battleState()`, not from a debug shortcut.
- Cancel path: opened the list again and backed out with a real Escape; returned to the top-level menu cleanly.
- Escape paused (screen stack `["battle","pause"]`); `H` hid `.pause__ui`, a second `H` restored it.
- Audio debug surface: playing track was `"pause"` ("Still Water" — HYMN bars 1–8) with `source: "prerendered"`, `cached: true` — prerendered music is fetched and playing, not the procedural synth fallback.
- `P` did not close the pause screen on this build; Escape did (noted, not a defect this review is scoped to characterise — recorded for the next batch).
- Pause resumed cleanly back to `battle`.
- **Console errors: 0. Network 4xx/5xx (404s etc.): 0** for the whole run.

## 3. Reload smoke (CHK-024, lightweight)

Changed `musicVolume` from 0.7 to 0.42 via `SaveStore.setSettings` (the real save-write path, not a raw field poke), confirmed the in-memory value took effect, reloaded the page, and confirmed the setting read back as 0.42 after reload. This is the lightweight CHK-024 pass only; the full upgrade-path matrix (older save shapes, `migrateFfx2Atb`, etc.) is **not tested** here.

## Notes

- `P` alone did not close the pause screen where Escape did; not investigated further in this live pass (scope is deployment identity + smoke, not a defect audit).
- The deep review already owed for this build (carried through thirteen prior builds per `critic/pending/fc7f1a20.json`) is untouched by this report; it is a separate obligation.
