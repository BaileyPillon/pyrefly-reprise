```text
Build / artifact / target version: main a44297ca / bundle DLvZcIgF / artifactHash 2117c2b4f5ce92a112124d6756650c8f4077be49a690fc12d4656cd06b7640c8
Review: live
Deployment: UNVERIFIED
Changed area: NOT APPLICABLE
Ship: N/A (live review does not gate ship; see focused/deep reports for that build)
Milestone: not assessed
Quality: not assessed (live review does not recompute the milestone score)
Targets: not assessed
Top issues: LV-1 (informational — see below), LV-2 (informational — see below)
Coverage: tested = artifact identity (59 files), title/chapter-select/party-prep real-input flow, pause (P), hide panels (H), resume (Esc), prerendered-music check, settings-reload persistence, console/network error sweep; reused = none; not tested = full upgrade matrix (CHK-024 full), confirmed arrival at an active player turn / command HUD (see LV-2), win/loss/retry path
Next required review and why: none newly triggered by this pass; the build's existing deep obligation (carried from prior builds) still stands per critic/pending/a44297ca.json
Elapsed review time / repeated work avoided: ~45 minutes (longer than the 2-5 minute guide because of a live smoke ambiguity investigated in LV-2); no repeated work avoided (first live check of this sha)
```

## Step 1 — Exact artifact (CHK-017)

Ran `node tools/artifact-manifest.mjs verify-live --manifest critic/artifacts/a44297ca.json --url https://baileypillon.github.io/pyrefly-reprise/ --changed-from critic/artifacts/d8837334.json`:

```json
{
 "result": "PASS",
 "artifactHash": "2117c2b4f5ce92a112124d6756650c8f4077be49a690fc12d4656cd06b7640c8",
 "liveManifest": "match",
 "checked": 59,
 "mismatched": [],
 "missing": [],
 "wrongType": [],
 "errors": [],
 "notes": []
}
```

**PASS.** The live manifest names this artifact and all 59 compared files are byte-identical with the right content type.

## Step 2 — Real-input smoke

Browser: Claude-in-Chrome extension (Chromium), fresh tab, 1600×900, cache-busting query on every navigate. Not Playwright — `PYREFLY_BROWSER=gpu` does not apply to this tool; noted as a method difference from the usual runner.

Verified with real keys/clicks, screen/chapter/state asserted before each capture (CHK-016):

- Title screen renders correctly (painted key art, never black) — real Enter/click reached Chapter Select.
- Chapter Select: "1 of 14 beaten" shown correctly; **reopens on the last-played chapter (Yojimbo, IX highlighted)** — confirms t1-b4b.
- Selected Vegnagun (V, FFX-2) and Bahamut (IV, FFX-2) by real click; Party Prep screen showed correct chapter title, objectives, tip text, and party (Yuna/Rikku/Paine) for each.
- Real Enter presses advanced cutscene dialogue line-by-line (confirmed distinct lines rendering with real key input, not a stub).
- In battle: **P** opened the real pause/stats panel (not just a static badge — the corner "PAUSE" element is a clickable button, confirmed via DOM) showing HP/MP/stats/ATB/mode/chain/dressphere/garment-grid/gates, correctly scoped to the active chapter (positive path). **H** hid all panels to a clean framed view and **H** again restored them. **Escape** resumed cleanly back to the battle scene (cancel/resume path both exercised).
- Audio: `window.__pyrefly.audioDebug()` showed `playing: "boss-ffx2-aeon"`, `muted: false`, `prerendered: {manifest: true, sprite: true, spriteDecoded: true}` — prerendered sampled music playing, not the procedural fallback.
- Network: confirmed `audio/music/boss-ffx2-aeon.mp3` and `audio/music/pause.mp3` fetched with `200`.

**LV-1 (informational, non-blocking).** Two requests for `art/pause/yuna-ffx2.png` returned `503` during the run; the browser's `.2x.webp` variant loaded fine both times so no broken image was ever visible. A direct re-fetch immediately after moments later returned `200` with a valid, decodable `image/png` (1,256,372 bytes). Treated as a transient CDN/hosting blip, not a candidate defect — no mismatch was found by the byte-identity check in step 1, which is the authoritative test for missing/corrupt files.

**LV-2 (the one open question — recorded as UNVERIFIED, not FAIL).** I could not positively confirm reaching an active player turn (a visible ATB/command HUD) in either FFX-2 chapter tested (Bahamut, Vegnagun), nor in the FFX chapter used as a comparison baseline (Seymour Flux). In all three, `window.__pyrefly.battleState().ticks` stayed at `0` across repeated real-time waits (up to ~20-40s cumulative per attempt), and the DOM's `.ffx2atb__fill` bar widths were bit-for-bit identical across re-reads seconds apart. Investigating the cause: `document.hidden` was `true` / `document.visibilityState` was `"hidden"` for this tab throughout, even though it was the frontmost tab in the extension's own bookkeeping — a known way for a browser's rendering/animation loop to be throttled or intentionally paused by page code that (reasonably) stops the battle clock while the tab isn't foreground. `performance.now()` advanced normally and the page stayed responsive (screenshots, DOM, JS all continued to update/animate — e.g., the boss idle animation moved between captures), so this was not a full page hang. I was not able to force `document.hidden` to `false` with the tools available in this session. Given the same stall reproduced identically across three different battle types/games/chapters (Vegnagun ATB Wait mode, Bahamut ATB Wait mode, Seymour Flux CTB) using otherwise-working real-input navigation, I cannot rule out either explanation from this session alone:
  - (a) a genuine live regression in the battle clock's real-time driver, or
  - (b) an artifact of this review tool's tab-visibility state, which the orchestration note's `PYREFLY_BROWSER=gpu` Playwright path (not used this run) may avoid.
  I record this sub-check as **UNVERIFIED** rather than FAIL: I have no positive evidence the flow is broken for a real, foregrounded player, only an inconclusive result from this tool. This should be re-run with the project's own Playwright-based `critic/runner/live.js` path (which the orchestration note calls for) to get a decisive answer; if it reproduces there too, it is a critical, changed-flow-blocking finding given it would affect every named chapter of this deploy's systems list (`FFX-2 ATB engine`, `FFX CTB engine`).

## Step 3 — Reload smoke (CHK-024, lightweight)

- Changed Master Volume from 80 to 90 via a real click on the Options slider inside the pause menu; confirmed the value both on-screen and in `localStorage['pyrefly-reprise:save:v1'].settings.masterVolume` (0.9).
- Reloaded the page (fresh navigation, no state carried in JS memory).
- Confirmed after reload: `settings.masterVolume` still `0.9`; Chapter Select still showed "1 of 14 beaten" and reopened on the last-played chapter.
- **Full upgrade matrix (across save-schema versions) is NOT tested** — out of scope for this lightweight pass, as instructed.

## Console / network sweep

- **0 console errors** across the run (10 info/warning-level messages seen: repeated `[chapter-select] confirmed "..." — no onSelect wired; the presenter agent replaces this factory` info lines from debug-tool chapter switches, and one existing warning `[painted] .../seymour-flux-body/cast.png still had an opaque white studio background; cleaned it at load time` — a pre-existing asset-pipeline note, not new to this build).
- **0 confirmed 404s.** Two `503`s noted under LV-1 (not 404, and not reproducible on retest).

## Deployment verdict

**UNVERIFIED.** Step 1 (exact artifact) is a clean PASS. All UI/menu/screen-transition/pause/panel-toggle/audio/reload real-input checks ran clean with zero console errors and zero confirmed 404s. The one open item (LV-2) is a real-time battle-clock check that could not be run to a clean conclusion with the tooling available this session, for reasons documented above that plausibly sit with the review environment rather than the candidate. Per RUBRIC §5 ("a failed wait ... records UNVERIFIED; ... separate harness failures ... from product failures"), this is recorded as UNVERIFIED with the reason given, not guessed as PASS or FAIL.
