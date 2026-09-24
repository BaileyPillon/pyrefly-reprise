Build / artifact / target version: main e3b8c2a3, bundle CXcGU7y1, artifactHash ca8e6924490984e6428deff5f418b7d0d12a37587fa63e96a3cafe0d4c0dc315
Review: live
Deployment: PASS
Changed area: NOT APPLICABLE
Ship: NOT APPLICABLE (this review does not re-run the ship gate; see critic/reviews/e3b8c2a3-focused.json for that verdict)
Milestone: not assessed
Quality: last full score 9.60 unrounded (round 03, rubric v1, build 7191674, 2026-09-19) — never compared with a v2 score
Targets: not assessed in this pass
Top issues:
- LIVE-01 (info, not a defect): Paine's Power Break was not observed in the battle log during one full auto-played run of Chapter 4 (the "intended" strategy did not choose it this run). The ability is present and learned in Paine's Chapter 4 build (`src/data/ffx2/builds/bevelle.ts`, id `x2-warrior-power-break`) and the command menu structure that would offer it is unchanged and working (confirmed generically: Yuna's own top-level group -> submenu -> aim -> cancel all worked correctly with real keys and a real click). Not exercised through real menu navigation to Paine's own turn specifically — see coverage.
Coverage: tested (real input, live URL, GPU Chromium, cache-busted) — title -> real Enter -> Auron's briefing (verbatim Wait-mode line 4 confirmed) -> chapter select (real click context + Enter) -> Chapter IV (ffx2-bahamut) prep -> battle; Wait split is ON by default at the main list (waitSplit=true, clockHeld=false); a real Enter and a real mouse click both open a top-level group into its submenu (menuLevel: top -> deep, clockHeld: false -> true); the clock still holds while aiming a target; Escape/Escape cancels back to the top list and the clock resumes (clockHeld back to false); the gauge badge "GAUGES RUNNING · A LIST HOLDS THEM" and Rikku's coach bubble "Bar's full, she's up! Open a list and take your time, nobody moves." both appear verbatim; Escape opens the pause from the top list, H hides and restores the pause panels, Escape resumes it; prerendered music is confirmed playing (`audioDebug().tracks[...].source === 'prerendered'`, not the synth fallback); `?wait=hold` correctly forces `waitSplit=false` (the old whole-menu hold, clockHeld=true even at the top list); Chapter VII (`seymour-anima-macalania`) is still a locked COMING card, checked in two independent browser contexts; Chapter 4 was auto-played end to end to a real victory outcome with zero console errors and zero 4xx/5xx responses; a real, save-backed setting (`masterVolume`) survives a full page reload.
reused: none — this is a fresh live pass, not carried forward from focused
notTested: the full CHK-024 upgrade matrix (fresh/returning/migrating/invalid-storage profiles) — lightweight reload smoke only, as the task scopes it; Paine's Power Break through real menu navigation to her own turn specifically (only the mechanism it depends on — top-level group -> submenu -> confirm -> aim -> resolve — was exercised, on Yuna); the Chapter II pause CHAPTER tab's snapshot art sizing (the `.pause__tab[data-tab="chapter"]` tab was opened with a real click but no `<img>` matched the selectors tried, so the size claim is unverified rather than failed — see notes below); a second, independent "chapter clear survives reload" check crashed the headless GPU tab on a longer auto-played battle and was not re-attempted within this pass's budget (the equivalent claim for settings, which is the CHK-024-relevant one, is verified above).
Next required review and why: the deep review already owed on this build (`critic/artifacts/e3b8c2a3.json` obligations.deep, carried from fd0ae96 through dc2669ac) is unaffected by this live pass and still open.
Elapsed review time / repeated work avoided: roughly 50 minutes total, most of it establishing that a real Enter key can be legitimately swallowed once by a first-time coach mark's own exclusive dismiss claim (`src/ui/coach/CoachMark.ts`) before it ever reaches the command menu — an early false "Enter does not work" reading that a real mouse click and a second Enter both refuted. No prior live report existed for this sha to reuse.

## Detail

### CHK-017 — exact artifact
`node tools/artifact-manifest.mjs verify-live --manifest critic/artifacts/e3b8c2a3.json --url https://baileypillon.github.io/pyrefly-reprise/ --changed-from critic/artifacts/dc2669ac.json` returned:
```
{
  "result": "PASS",
  "artifactHash": "ca8e6924490984e6428deff5f418b7d0d12a37587fa63e96a3cafe0d4c0dc315",
  "liveManifest": "match",
  "checked": 47,
  "mismatched": [],
  "missing": [],
  "wrongType": [],
  "errors": [],
  "notes": []
}
```
The live URL serves this exact artifact: 47 files compared byte-for-byte with the manifest, all matching, correct content types, no errors.

### CHK-016 — screenshots/state only after an asserted state
Every check above was gated on `waitUntil(...)` polling the debug API's own `awaitingMenu`, `screen()`, `menuLevel()` or `clockHeld()` before any assertion or screenshot was taken; no screen was captured on a timeout.

### CHK-024 — reload smoke (lightweight, as scoped)
An earlier attempt used the debug-only `audio.setMuted()` toggle, which is **not** save-backed (`src/audio/AudioManager.ts` — a runtime mute distinct from `Settings.masterVolume`/`musicVolume`, which are the persisted fields in `src/app/SaveData.ts`). That gave a false negative (mute reset to `false` on reload, correctly, since it was never meant to persist). Retested against the real persisted field:
```
before reload: { masterVolume: 0.35, screen: 'battle' }
after reload:  { masterVolume: 0.35, screen: 'title' }
```
The setting survives. Reload always returns to the title screen (this project has no mid-battle save state, by design, not a defect).

### Console errors / 404s
Zero console errors and zero responses ≥400 across all three browser contexts (title/briefing/Chapter IV smoke, `?wait=hold` context, Power Break/Chapter II/reload context), for the whole run.

### Browser
Playwright, `PYREFLY_BROWSER=gpu`: `ANGLE (NVIDIA, NVIDIA GeForce RTX 5070 Ti (0x00002C05) Direct3D11 vs_5_0 ps_5_0, D3D11)`. No fallback to SwiftShader was needed.
