```text
Build / artifact / target version: main=79adc4ff bundle=ykS1QEe6 artifactHash=7ff2045e08ba79145fe7c6cd2bb6a0ff1e8b06ac54169ebaad4e9cc7c283443d
Review: live
Deployment: PASS
Changed area: NOT APPLICABLE
Ship: SHIP (already deployed under owner override "ok just push the build live please"; this pass only verifies the artifact and its live behavior)
Milestone: not assessed
Quality: not assessed by this pass
Targets: not assessed by this pass
Top issues: none blocking; see notes on harness flakiness below (not a live defect)
Coverage: tested / reused / not tested below
Next required review and why: focused review of the changed area (release 25: A-2 battle-entry transitions, FFX enemy ability names in HELP bar, TARGET plate, Ch III Sensor card fold, WITHDREW stalemate card, art-mask fixes) and the deep review already carried forward across 23 prior builds (critic/pending/79adc4ff.json obligations)
Elapsed review time / repeated work avoided: ~55 minutes; reused critic/runner/lib/lib.mjs primitives (assertScreen, waitBattleMenu, commandRows) and the ff3884fb-live.json script pattern
```

## CHK-017 — exact artifact identity

`node tools/artifact-manifest.mjs verify-live --manifest critic/artifacts/79adc4ff.json --url https://baileypillon.github.io/pyrefly-reprise/ --changed-from critic/artifacts/bc4e70ee.json` returned:

```json
{"result":"PASS","artifactHash":"7ff2045e08ba79145fe7c6cd2bb6a0ff1e8b06ac54169ebaad4e9cc7c283443d","liveManifest":"match","checked":56,"mismatched":[],"missing":[],"wrongType":[],"errors":[],"notes":[]}
```

56 files compared byte-identical with the right content type against the previous build (bc4e70ee); the live URL names this artifact. **PASS.**

## CHK-016 — real-input smoke

Headless Playwright, `PYREFLY_BROWSER=gpu`, 1600x900, fresh browser context per chapter, cache-busted URL (`?cb=<ts>`). Scripts: `.79adc4ff-live-smoke-tmp.mjs` (kept for reference; a scratch file per repo convention) plus two small diagnostics used to resolve a chapter-board-order issue (see below).

- **Board order changed again** since the ff3884fb live review (its own LV-2 note already flagged this class of drift): the board now runs all FFX chapters first, then all FFX-2 chapters — `ffx2-bahamut` is now at board index 9, not 3. A fixed-ArrowRight-count script (the pattern reused from the last live review) silently lands on `evrae-airship` instead. Corrected the script to advance by real `ArrowRight` presses until `snapshotState().screenState.selectedId` matches the intended chapter id, and re-ran. This is a harness gap, not a live defect — the board itself works and reports its own order correctly through the debug API.
- **FFX (Seymour Flux):** title → chapter-select → party-prep → cutscene → battle, reached and asserted (`assertScreen`/`waitBattleMenu`, which throw rather than fall through on timeout). Real input (Enter to select Attack already highlighted, Enter to confirm target) grew `battleLog()` in two separate runs (12→17 and, after the coach/advisor "NEXT BEST MOVE" overlay intercepted the first Enter in a third run, 14→19 on the third Enter). One run showed no growth after the standard two Enters because the advisor overlay was showing and ate the first keypress — real input does progress the battle once the overlay is accounted for; this is the existing move-advisor feature, not new to this release, and not a regression (screen stayed on `battle` throughout, no game-loop lock).
- **FFX-2 (Bahamut, `ffx2-bahamut`):** once retargeted to the correct board tile, title → chapter-select → party-prep → cutscene → battle reached and asserted; command rows read via `commandRows()` (`.ig-cmd-stack` present) showed `Attack` already selected (row order for this chapter: Attack, Skill, Change, Item); real Enter, Enter grew `battleLog()` 8→10.
- **FF7 hidden fight:** typing L‑I‑M‑I‑T on chapter-select opened the hidden Guard Scorpion door straight to a real battle; real Attack input grew `battleLog()` 4→8.
- **Pause / hide / resume:** `P` opened the pause screen from battle (`afterCancel: 'pause'` observed after Escape from the battle menu, consistent with Escape acting as the pause key at the top-level menu per the keybindings table); a subsequent `H` toggled panel text length (508→847 chars in one run, confirming panel hide/restore is live); `Escape` returned to `battle`.
- **Audio:** `audioDebug()` on the FFX run showed `playing: "boss-seymour"` with `music.current.source: "prerendered"` / `cached: true` for the active track, and `cached: true, prerendered: true` for every sampled SFX cue (magic, summon, status) — prerendered audio is being served, not the procedural synth fallback.
- **Console / network:** 0 console errors, 0 responses ≥400, across every context run (title→battle→pause→cutscene→hidden-door, several passes).

**Result: PASS** on the mandatory checks (exact chapters reached, real input progresses the battle, pause/resume/hide work, prerendered audio confirmed, 0 console errors, 0 404s). The one no-growth attempt for FFX is explained by the advisor overlay intercepting an Enter, reproduced and resolved with a third Enter in a follow-up run — not a live defect.

## CHK-024 — reload smoke (lightweight)

On the FFX-2 context: set `pyrefly-reprise:save:v1` → `settings.masterVolume` from `0.8` to `0.37` via `localStorage`, reloaded the page, waited for `window.__pyreflyReady`, read the value back: `0.37` survived the reload. **PASS.** The full upgrade matrix (fresh/returning/previous-build-fixture/invalid-storage/reset) is **not tested** in this lightweight pass, per RUBRIC.md section 5.

## Coverage

- **tested:** artifact identity (56 files, byte-diffed from bc4e70ee); title → chapter-select → party-prep → battle real input for one FFX chapter (Seymour Flux) and one FFX-2 chapter (ffx2-bahamut, corrected board targeting); hidden FF7 door (LIMIT) to a real battle turn; pause/hide/resume; prerendered-vs-fallback audio check; settings-reload persistence; console-error/404 sweep across all contexts.
- **reused:** `critic/runner/lib/lib.mjs` (`assertScreen`, `waitBattleMenu`, `commandRows`) and the general script shape from `critic/reviews/ff3884fb-live.json`'s smoke.
- **notTested:** full CHK-024 upgrade matrix; win/loss/retry path for any chapter; the specific release-25 systems by name (A-2 battle-entry transitions/blur/shatter, FFX enemy-ability-name HELP bar text, TARGET plate content, Chapter III Sensor card fold animation, WITHDREW stalemate card, Grand Summon aeon choice in Chapter IX, art-mask fixes) beyond what this generic real-input pass exercises incidentally — those are the focused/deep review's obligation per `critic/pending/79adc4ff.json`, not this live check's.

## Notes

- LV-3 (informational, mirrors LV-2 from ff3884fb): the chapter board's tile order changed again (FFX chapters grouped before FFX-2). Any future live-smoke script must select chapters by `screenState.selectedId`, never a fixed `ArrowRight` count. Worth adding a small helper to `critic/runner/lib/lib.mjs` (e.g. `selectChapterById`) so this stops being rediscovered per release — flagged as a follow-up, not built here (no live-build defect, and this is plumbing rather than something Bailey perceives).
- The move-advisor "NEXT BEST MOVE" overlay can intercept the first real keypress in the battle menu; not a defect, just something a smoke script needs to account for (confirm the menu is actually in `awaitingMenu` state via `commandRows`/`snapshotState`, or send an extra Enter, before treating a lack of log growth as a failure).
