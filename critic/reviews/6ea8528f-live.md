Build / artifact / target version: main 6ea8528f, bundle DecUADzw, artifact 21bca0a425a75fe8670f12121fc29e247406a71cd8ad3e1255bcc634dbd71254
Review: live
Deployment: PASS
Changed area: NOT APPLICABLE
Ship: NOT APPLICABLE (live verification does not decide ship)
Milestone: not assessed
Quality: not assessed (live review does not recompute the score)
Targets: not assessed
Top issues: none found
Coverage: tested — see below; reused — none (all evidence gathered fresh against this artifact); not tested — full upgrade matrix, physical device/Safari, real controller
Next required review and why: the deep review already owed on this build (per critic/pending/6ea8528f.json) remains open; this live pass settles only the `live` obligation
Elapsed review time / repeated work avoided: ~35 minutes; no evidence reused from a prior build

## 1. Exact artifact (CHK-017)

`node tools/artifact-manifest.mjs verify-live --manifest critic/artifacts/6ea8528f.json --url https://baileypillon.github.io/pyrefly-reprise/ --changed-from critic/artifacts/be1e964a.json` returned:

```json
{
 "result": "PASS",
 "artifactHash": "21bca0a425a75fe8670f12121fc29e247406a71cd8ad3e1255bcc634dbd71254",
 "liveManifest": "match",
 "checked": 48,
 "mismatched": [],
 "missing": [],
 "wrongType": [],
 "errors": [],
 "notes": []
}
```

48 files compared, all byte-identical with the correct content type, 0 mismatched, 0 missing. The live manifest names this exact artifact.

## 2. Real-input smoke (CHK-016)

HEADLESS Playwright from node scripts only, `PYREFLY_BROWSER=gpu` for every run. Fresh browser context per pass, cache-busting query string, real keyboard/tap/click events throughout; every capture point asserted `window.__pyrefly.app.current.name` (and the board's `selectedId`) before treating it as reached.

**Desktop pass, 1600×900, keyboard** (`https://baileypillon.github.io/pyrefly-reprise/?livesmoke28d=…`):
- Boot, `__pyreflyReady`, title screen: OK.
- Title → chapter-select (real Enter presses): OK. Board snapshot: 16 tiles, order confirmed.
- **Chapter III, Seymour Omnis (Dream's End) — P-01 Sensor strip fix (FFX only):** board select → confirm → party-prep → cutscene skip → battle → reaches a player command menu with ticks advancing. All OK.
- Escape/P opens the pause screen, H round-trips the panels, P resumes to battle: all OK.
- Cancel path: this chapter runs the FFX (CTB) HUD, which has no FFX2-style Item submenu to cancel out of — recorded honestly as skipped (game-aware: FFX only), not forced.
- Prerendered audio: 7 audio file requests observed on the network (e.g. `audio/music/title.mp3`), confirming prerendered music is fetched rather than only the synth fallback.
- Reload smoke: app re-boots after `page.reload()`; the `pyrefly-reprise:save:v1` localStorage key present before reload is present unchanged after.
- **Seymour Flux — P-02 phone fix (FFX only), checked on desktop for reachability too:** board select → confirm → party-prep → cutscene skip → battle → reaches a player command menu. All OK.
- **FF7 hidden door:** returned to chapter-select, typed L-I-M-I-T; the hidden fight opened to the battle screen. OK.

**Desktop targeted pass, 1600×900, keyboard, Chapter XVI (`ffx2-ixion-djose`, IXS-1/IXS-4, the chapter this release's Ixion fix touches):**
- Board select → confirm → party-prep → cutscene skip → battle → reaches a player command menu: all OK.
- Escape/P opens pause, H round-trips the panels, P resumes to battle: OK.
- Cancel path (FFX2-style HUD): opened Item, Escape backed out to the command-menu top: OK.
- 0 console errors on this run.

**Mobile pass, 390×844, `hasTouch: true`, real taps** (`https://baileypillon.github.io/pyrefly-reprise/?...`):
- Boot, title → chapter-select by tap: OK. Board snapshot present (16 tiles).
- **Chapter XVI (Ixion, lit floor) — IXS-1 phone fix:** first tap selects the `[data-card="ffx2-ixion-djose"]` card (two-tap rule), second tap begins it → party-prep → cutscene skip (tap/Enter) → battle → reaches a player command menu with ticks advancing. All OK.
- **Chapter IX (Yojimbo, Grand Summon list / aeon portrait) — FOC24-01/FOC24-02 phone fixes:** same two-tap select/begin on `[data-card="yojimbo-cavern"]` → party-prep → battle → reaches a player command menu. All OK.
- 0 console errors, 0 404s across both mobile chapters.

**A load-time note, not a defect:** on cold headless runs (no browser cache), `ffx2-ixion-djose`'s loading card (`docs comment: "can take 14 to 20 s to load"`, `src/ui/common/transitions/loadingCard.ts`) took between ~12 s and ~40 s across repeated attempts before handing over to the battle's own card, twice exceeding the documented 14–20 s window before eventually completing. It never failed to complete, threw no error, and produced no failed network request in any attempt (verified with `requestfailed`/4xx/5xx listeners and a 60 s window on the final confirming runs). Chapter select still shows `ffx2-bahamut` completing in ~12 s for comparison. This reads as first-visit asset-loading variance on GitHub Pages' cold cache rather than a broken flow, but it is the review's only caveat: a real player with a slow first load could wait noticeably longer than the documented ceiling before the fight starts. Logged as a note, not a defect, since the flow always resolved and nothing in the manifest, network log or console pointed at a missing or corrupt asset.

## 3. Reload smoke (CHK-024, lightweight)

Covered above under the desktop pass: reload preserved the existing `pyrefly-reprise:save:v1` key unchanged. No settings toggle was exercised (none was reachable from the mid-battle state at that point in the run) — recorded under `notTested`. The full upgrade matrix (old save → new build) is explicitly out of scope for this pass.

## Console errors / 404s

0 console errors and 0 404s across every desktop and mobile run (multiple passes, including two targeted re-runs of the changed Ixion chapter).

## notTested

- The full CHK-024 upgrade matrix (only a lightweight reload-survives check ran).
- Physical device, Safari, or real controller input (emulation only, per RUBRIC §5).
- The deep review already owed on this build (unaffected by this live pass; still open per `critic/pending/6ea8528f.json`).
