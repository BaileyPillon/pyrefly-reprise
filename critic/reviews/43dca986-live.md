Build / artifact / target version: main 43dca986, bundle D56B92vC, artifactHash 218b36a4aed2b90a66ae4fd38e5acc3baf79079c31d6e5841a5def9a472f1a34
Review: live
Deployment: PASS
Changed area: NOT APPLICABLE
Ship: NOT APPLICABLE (this is the live deployment check, not the changed-area review; that is settled by critic/reviews/43dca986-focused.json, ship: SHIP)
Milestone: not assessed
Quality: not assessed (this review does not score categories)
Targets: not assessed on this pass
Top issues: none found
Coverage: tested (real-input smoke below); reused (Chapter III advisor-letter, prep-value and CHK-022 win evidence from critic/reviews/43dca986-focused.json, still valid — same candidate bundle, no code change since); not tested (full CHK-024 upgrade matrix, phone layout, the other three FFX chapters and remaining FFX-2 chapters end to end on the live site — see coverage.notTested in the JSON report)
Next required review and why: the deep review of every affected chapter and system is still owed on this build (critic/pending/43dca986.json obligation "deep"); this live pass settles only the "live" obligation
Elapsed review time / repeated work avoided: about 20 minutes; the exact-artifact identity check (CHK-017) reused the deploy's own manifest and needed no rebuild, and the Chapter III advisor-letter/prep evidence from the focused review did not need to be replayed

## 1. Exact artifact (CHK-017)

`node tools/artifact-manifest.mjs verify-live --manifest critic/artifacts/43dca986.json --url https://baileypillon.github.io/pyrefly-reprise/ --changed-from critic/artifacts/b975397b.json` -> `{"result":"PASS","liveManifest":"match","checked":47,"mismatched":[],"missing":[],"wrongType":[],"errors":[],"notes":[]}`.

Because the marker's planned review is `deep`, the check was repeated with `--full` (every shipped file, not just the diff against the previous build): `{"result":"PASS","liveManifest":"match","checked":1071,"mismatched":[],"missing":[],"wrongType":[],"errors":[],"notes":[]}`. The live site serves this exact artifact, byte for byte, with the right content types, for all 1,071 shipped files (bundle, art, audio, fonts).

## 2. Real-input smoke

Headless Playwright (playwright, installed in `node_modules`), `PYREFLY_BROWSER=gpu` (real-GPU launch args from `tools/browser-mode.mjs`; no black-canvas fallback needed). Fresh incognito context, 1600x900, script `.zz-live-smoke-43dca986.tmp.mjs` (kept as agent scratch, not committed). Two runs against `https://baileypillon.github.io/pyrefly-reprise/?cb=...` (cache-busted), one per changed chapter, each starting from a fresh page load so no state leaked between them.

**Chapter XV, the Den of Woe (newly listed):**
- Real click on the title's confirm control, real Enters through the briefing, reached `chapter-select`. `window.__pyrefly.chapters()` lists `ffx2-den-of-woe` (15th, after Chapter XIII), and the card text "Den of Woe" is present on the screen (asserted, not assumed) — matches the round-18 listing pick continuing to serve correctly under this build.
- Real select + confirm entered the chapter directly into a cutscene: **no separate party-prep screen appears**, consistent with Bailey's shipped pick "Den: both, drop the prep" (the LV 54/56/58 and 3x Hero Drink kit is pre-applied rather than surfaced as a choosable prep UI) — this matches the focused review's own description of the same build ("prep at LV 54/56/58, Hero Drink x3 in the bag"). The focused review's screenshots (`critic/reviews/43dca986-focused/ffx2-den-of-woe-win/*.png`) already show this prep state directly; this pass did not re-derive the numbers from on-screen text because there is no prep screen to read them from.
- Cutscene skip: a real 2.5s Enter hold reached the fast-forward threshold and moved the scene along in this build (screen changed within the hold); reached `battle`.
- Real player turn reached: `.ig-cmd-stack [data-idx]` (the FFX-2 command rows) present within the wait, asserted before proceeding (CHK-016).
- Reload smoke ran against this session's save (below).

**Chapter III (Braska's Final Aeon), the round-13 advisor/letter fixes:**
- Fresh reload, real select + confirm, real held-Enter skipped the pre-battle cutscene, reached `battle`, real player-turn assertion via the command menu's presence.
- Real click on the enemy-intent toggle revealed the panel (it starts collapsed): `Braska's Final Aeon — Left-Arm Strike — Most likely 92% — Yuna 2,334–2,635 (49% HP, 77% to hit)`. The panel names the intended victim with odds and a damage range, the PR-0153/PR-0123/PR-0207 shape described in the release notes; at this early turn there is one body still, not yet split into the lettered Yu Pagoda A/B duplicates, so the letter itself was not re-observed live. That specific case (advisor card and target plate lettering "Slow → Yu Pagoda B", PR-0208) is reused from `critic/reviews/43dca986-focused.json`'s CHK-022 evidence on this same candidate bundle (`braskas-final-aeon-win-s1` screenshots), which is a valid dependency: same commit, same bundle, no code change between the focused pass and this deploy.
- Positive path: a real click on the first command row (`Talk`) fired; no target list followed for that command (expected — `Talk` is not a targeted command). Cancel path: Escape opened the pause overlay and a second Escape resumed, staying on `battle` (`staysInBattle: true`) — the battle was never exited to chapter-select or title.
- Pause: Escape opens `pause` (`overlayDepth` 1), a real `H` press hid nothing further to hide in this state (`beforeHide`/`afterHide`/`afterRestore` all 77 — the pause chrome here does not include the toggled panel set at this moment) and a second `H` restored the same count; Escape resumed (`overlayDepth` back to 0).
- Music: `audioDebug()` during play showed `playing: "boss-jecht"` with `prerendered.manifest === true`, `prerendered.sprite === true`, `prerendered.spriteDecoded === true` — prerendered audio, not the procedural synth fallback.

**Whole-run counts:** console errors = 0, HTTP responses >= 400 = 0, across both chapter runs and all asset/audio/font requests observed.

## 3. Reload smoke (CHK-024, lightweight)

On the Chapter III session: one setting (`masterVolume`) was changed directly on the save object and written back to `localStorage['pyrefly-reprise:save:v1']` (the volume slider itself is not exposed to a headless run), and real progress had already been made by both chapter attempts (`ffx2-den-of-woe.attempts: 1`, `braskas-final-aeon.attempts: 1`, with non-zero `playTimeMs` on each). `page.reload()` was then performed. After reload: the settings object read back identical to what was written (`masterVolume`, `musicVolume`, `sfxVolume`, `ffx2Atb: "wait"`, etc. all unchanged), and both chapters' `attempts` and `playTimeMs` were unchanged from before the reload. Both the setting and the progress survived a real reload.

The full upgrade matrix (fresh player, returning player, a fixture from the previous live build migrating forward, invalid/truncated storage, reload during every allowed state) was **not tested**; out of scope for this lightweight live pass.

## Notes

- `node tools/artifact-manifest.mjs verify-live` was run twice deliberately: once with `--changed-from` only (fast, 47 files) and once with `--full` (1,071 files) because `critic/pending/43dca986.json` names this build's planned review as `deep`. Both PASS with matching hashes.
- This report settles only the `live` obligation on `critic/pending/43dca986.json`. The `deep` obligation (carried from 17 earlier builds) remains open and is out of scope for this pass.
