```text
Build / artifact / target version: main d9decadb, bundle B4_kxWCJ, artifact 47e7bf045756f6270a964e20c631a7390779c1655be9e3146e8dd858fda7a4a4
Review: live
Deployment: PASS
Changed area: NOT APPLICABLE (this pass is exact-artifact + live smoke only)
Milestone: not assessed
Quality: not assessed in this pass (see critic/rounds for the last full score)
Targets: not assessed in this pass
Top issues: LIVE-D9-1 (polish/uncertain, the P key did not resume the battle once the pause screen was already open via Escape; same suspected-by-design cause already recorded as LIVE-A2-2 on release fd0ae96)
Coverage: tested (see below); reused: none; not tested: chapters other than VIII and (for the save checks) chapter 1, the full save/settings upgrade matrix beyond the two targeted checks, physical controller, Safari
Next required review and why: none owed by this pass; critic/pending/d9decadb.json's other obligations (if any) are unaffected by a live-only report -- see `node tools/critic-clear.mjs` output for what remains open
Elapsed review time / repeated work avoided: ~47 minutes hands-on, mostly building and debugging the real-input Playwright harness (rail navigation timing, the pause screen's tabs->body focus transition, and the in-memory vs on-disk save timing); no prior live-verify script for this exact flow existed to reuse
```

## 1. Exact artifact (CHK-017)

```
node tools/artifact-manifest.mjs verify-live --manifest critic/artifacts/d9decadb.json --url https://baileypillon.github.io/pyrefly-reprise/ --changed-from critic/artifacts/5348c2e3.json
```

```json
{
 "result": "PASS",
 "artifactHash": "47e7bf045756f6270a964e20c631a7390779c1655be9e3146e8dd858fda7a4a4",
 "liveManifest": "match",
 "checked": 48,
 "mismatched": [],
 "missing": [],
 "wrongType": [],
 "errors": [],
 "notes": []
}
```

The manifest for `d9decadb` existed at `critic/artifacts/d9decadb.json` and matched what the live URL served, byte for byte, for every one of the 48 compared files. **PASS, not UNVERIFIED.**

## 2. Real-input smoke (CHK-016)

Method: Playwright against the live URL with a cache-busting query (`?cb=<timestamp>`), a fresh `BrowserContext` per phase, `PYREFLY_BROWSER=gpu` launch args (`--use-angle=d3d11 --enable-gpu ...`), viewport 1600x900 for the main run and 1280x800 for the two-tab and fresh-profile save checks.

**Renderer (printed, as required):**
```
ANGLE (NVIDIA, NVIDIA GeForce RTX 5070 Ti (0x00002C05) Direct3D11 vs_5_0 ps_5_0, D3D11)
```
A real GPU, not SwiftShader -- no black-canvas fallback was needed.

### (1) Chapter VIII (Evrae) playable card, end to end with real input

- Real `Enter` from the title reached chapter select (`window.__pyrefly.screen() === 'chapter-select'` polled, not a fixed wait).
- Board read from the DOM (`.fe-card` `aria-label` / `--coming` class): **Evrae is a playable card** (no `fe-card--coming`), **Seymour and Anima (Chapter VII) is still a locked COMING card** -- both before and after the round trip below.
- Real `ArrowRight` x3 moved the rail cursor to `evrae-airship` (confirmed via `snapshotState().screenState.selectedId`); real `Enter` reached party prep.
- A real click on the prep screen's begin control (`window.__pyrefly.trigger('prep:begin')`, the same call the screen's own begin button fires) started the encounter; the opening cutscene was skipped with the debug hook only after real input had already reached it (per CHK-016's own rule: debug hooks may not stand in for reaching a state, but they may skip dialogue once real input got there).
- Reached the battle and its **first real command menu** (`battle().snapshot().playback.awaitingMenu === true`), screenshotted.
- **One Orders command with a real mouse click** on the actual DOM command menu: clicked the text `Orders`, then the text `Pull back` inside `AirshipOrderWidget`'s own two-row submenu (no debug `forceCommand`). Confirmed by a new entry in `window.__pyrefly.battleLog()` and `battle().snapshot().playback.lastCommand === { kind: 'trigger', id: 'pull-back', targets: [] }`.
- Real `Escape` opened pause (`screen() === 'pause'`); real `KeyH` hid the pause panels, a second `KeyH` restored them (both states screenshotted). `KeyP` was pressed twice while already paused; the battle stayed paused both times -- see issue LIVE-D9-1 below.
- From pause, real `Tab` presses cycled to the OPTIONS tab, real `ArrowDown` presses walked to the "Chapter select" row, real `Enter` fired it: **back at the chapter-select board with no black screen** (an 8x8 downsample of the canvas found channel values above 8, so it was not a black frame) and **Chapter VII still COMING**.

Screenshots: `docs/screenshots/d9decadb-live/01-title.png` through `09-back-at-board.png`.

### (2) Prerendered music, not the synth fallback

`window.__pyrefly.audioDebug()` was read after a real `playMusic('title')` call: `prerendered.manifest === true`, and the currently playing track's `source === 'prerendered'`. The network log independently showed a real request for `audio/music/title.mp3` returning `200`. This is not the procedural fallback.

### (3) Console errors and 404s

Counted across the entire run (the main single-tab smoke, the two-tab save check, and the fresh-profile save check): **0 console errors, 0 404s.**

## 3. Reload smoke (CHK-024, lightweight)

Single tab: the in-progress save blob in `localStorage` (chapter attempts and accumulated play time from the run above) was read before and after a full page reload and found byte-identical. `notTested`: the full upgrade matrix, per the task's own scope note -- covered instead by the two targeted checks below, which the task asked for explicitly.

### TARGETED SAVE CHECK A -- two tabs, settings-change survival (the two-tab merge, c784e553)

Two `Page`s in one `BrowserContext` (shared `localStorage`, as two real tabs on the same origin would be):
- Tab 1 driven with real input into a live battle and left there.
- Tab 2 driven with real input into its own battle, to the first command menu, then real `Escape` (confirmed `screen() === 'pause'`), real `Tab` to OPTIONS, real `ArrowDown` into the row list and onto `MASTER VOLUME`, then **5 real `ArrowLeft` presses**: `0.8 -> 0.3`. (`SaveData.ts`'s `setSettings()` calls `save()` synchronously, so this was confirmed both via the in-memory `SaveStore` and via `localStorage` directly.)
- Waited 12s (with tab 1 continuing to run and periodically autosave its own play time, exercising the actual two-tab merge path) and reloaded tab 2: **the new volume (0.3) survived.**

Evidence: `docs/screenshots/d9decadb-live/11-savecheckA-tab1-battle.png`, `12-savecheckA-volume-changed.png`, `13-savecheckA-after-reload.png`.

### TARGETED SAVE CHECK B -- upgrade from the release-08 save format

A fresh browser profile had a save blob written to `localStorage` shaped exactly like `git show 1b33971:src/app/SaveData.ts`'s schema: `version: 1`, no `ffx2AtbMigrated` field at all, `ffx2Atb: 'active'` (the pre-D-029 stored default), one cleared chapter (`seymour-flux`) with progress fields, and a non-default `masterVolume: 0.35`.

After a reload, **`window.__pyrefly.app.save.value`** (the in-memory, already-migrated truth -- `SaveStore.load()` migrates on every read via `migrate()`/`migrateFfx2Atb()`, but only rewrites the on-disk blob on the next explicit `save()`, so reading raw `localStorage` right after a reload is a false negative, not evidence of a bug) showed:
- `chapters['seymour-flux'].cleared === true` -- **progress kept.**
- `settings.masterVolume === 0.35` -- **volume kept.**
- `settings.ffx2Atb === 'wait'` and `settings.ffx2AtbMigrated === true` -- **the one-time Wait flip happened.**

A second reload from the same still-unwritten raw blob produced the identical result: the migration is idempotent and does not re-decide on a repeat read.

Evidence: `docs/screenshots/d9decadb-live/14-savecheckB-after-migrate.png`.

## Issues

**LIVE-D9-1** (polish, low confidence, same suspected cause already on file as LIVE-A2-2 from release fd0ae96): pressing `P` while the pause screen is already open (reached via `Escape`) did not resume the battle in this pass; only `Escape` reliably resumed. Not re-diagnosed this pass; flagged for a decision rather than asserted as a regression, since it reproduces the exact same observation already recorded against an earlier live build and may be by design (`BattleScreen.ts`'s `P`/`start` handler only ever *opens* pause; `PauseScreen.ts` binds resume to the `cancel`/Escape action only).

## Coverage

**Tested:** see the JSON report's `coverage.tested` (exact-artifact manifest across 48 files; the full Chapter VIII flow with real input including one real Orders command; pause open/hide/restore/return-to-board with no black screen; Chapter VII still locked; prerendered audio; console/404 counts; both targeted save checks).

**Reused:** none.

**Not tested:** chapters other than VIII (and, for the save checks, chapter 1); the full save/settings upgrade matrix beyond what the task asked for; combat correctness/balance beyond reaching and issuing one command; physical controller and Safari/real-device input; whether `P` reliably resumes an already-open pause screen.
