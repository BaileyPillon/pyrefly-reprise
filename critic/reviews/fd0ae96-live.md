```text
Build / artifact / target version: main fd0ae96, bundle assets/index-BscpFDXN.js, artifact 7161398faefeb5db79e0b8696b575bb5c4ee6eab91110c2c37e4caf971e424f4
Review: live
Deployment: PASS
Changed area: NOT APPLICABLE (this pass is exact-artifact + live smoke only; the change set for fd0ae96 was not itemised for this task)
Milestone: not assessed
Quality: not assessed in this pass (see critic/rounds for the last full score)
Targets: not assessed in this pass
Top issues: LIVE-A2-1 (major, Chapter 4 party prep shows Rikku/Paine as plain letter tiles instead of their painted portraits, both assets load fine elsewhere); LIVE-A2-2 (polish/uncertain, the P key did not reliably reopen the pause menu once it was already open in automated FFX-2 testing; Escape reliably toggled pause open and closed)
Coverage: tested (see below); reused: none; not tested: full save/settings upgrade matrix (CHK-024 full scope), physical controller, Safari, chapters II/V, combat correctness beyond reachability
Next required review and why: the deep review already owed on this build (per critic/pending/fd0ae96.json, obligations `focused` and `deep` are still pending; this live pass settles only the `live` obligation)
Elapsed review time / repeated work avoided: ~55 minutes hands-on (longer than the 2-5 minute budget for a "small change" because this build's change set was undocumented, so every flow had to be walked from a fresh profile; no prior live evidence existed to reuse)
```

## 1. Exact artifact (CHK-017)

`node tools/artifact-manifest.mjs verify-live --manifest critic/artifacts/fd0ae96.json --url https://baileypillon.github.io/pyrefly-reprise/ --changed-from critic/artifacts/7191674.json --full` (the marker's planned review is `deep`, so `--full` was used):

```json
{
 "result": "PASS",
 "artifactHash": "7161398faefeb5db79e0b8696b575bb5c4ee6eab91110c2c37e4caf971e424f4",
 "liveManifest": "match",
 "checked": 736,
 "mismatched": [],
 "missing": [],
 "wrongType": [],
 "errors": [],
 "notes": []
}
```

All 736 shipped files (396,549,208 bytes) are byte-identical between `critic/artifacts/fd0ae96.json` and the live site, content types match, and every image/audio file the manifest marks `decodeChecked` decoded live too. The served `index.html` references `assets/index-BscpFDXN.js`, confirmed both by the manifest and by reading `document.scripts` on the live page. **PASS.**

## 2. Real-input smoke

Browser: Playwright Chromium, `PYREFLY_BROWSER=gpu` (real GPU/D3D11 ANGLE, not SwiftShader) for every run below, 1600×900, a fresh browser context per chapter/spot-check (cache-busted query string) so each run started from a clean profile. `window.__pyrefly` was used only to skip an opening cutscene that had already been reached by real input (per RUBRIC §5, a debug hook may set up state once reachability is proven by real input; it does not substitute for it) and to read `screen()`/`audioDebug()` for CHK-016 state assertions. All navigation, all pausing, all menu selection was real `page.keyboard.press`/click input.

**Chapter 1 (Seymour Flux, FFX/CTB) — real input, no debug hooks at all:**
Enter (title → chapter select) → Enter (chapter select → party prep, Chapter I pre-selected) → Enter (party prep → battle) → intro cutscene rendered with real dialogue ("Kimahri knows this one. A") → Escape opened the full Pause screen (RESUME / STRATEGY GUIDE ON / HIDE PANELS / OPTIONS / ENCOUNTER DETAILS / PARTY / MUSIC PLAYER / SKIP SCENE / CHAPTER SELECT / QUIT TO TITLE, full detail panel, objectives, party HP/MP) → H hid the panels → H restored them → Escape resumed. Screenshots: `01-title.png`, `02-chapter-select.png` (not saved, see file list), `04-battle-ch1.png`, `05-pause-ch1.png`.

**Chapter 3 (Braska's Final Aeon, FFX/CTB) — real input to reachability, `skipCutscene()` only past the already-reached opening cutscene:**
Confirms the enemy-naming spot-check (below). Screenshot `13-battle-ch3.png`.

**Chapter 4 (Bahamut, FFX-2/ATB) — real input to reachability, `skipCutscene()` only past the already-reached opening cutscene:**
Enter → chapter select → **three `ArrowRight` presses with a wait between each** (the first attempt without waits between presses only advanced one chapter — the chapter-select carousel does not queue rapid presses; this is a testing-methodology note, not a product defect, since a human player's presses are never that close together) → Enter → party prep (Chapter IV · Bahamut confirmed by heading) → Enter → battle-start banner (real Enter dismissed it) → command menu reached (`battleState().phase === 'command:yuna'`, `awaitingMenu: true`) → Escape opened the full FFX-2 Pause screen (RESUME / RESTART ENCOUNTER / STRATEGY GUIDE ON / HIDE PANELS / OPTIONS / ENCOUNTER DETAILS / PARTY / MUSIC PLAYER / CHAPTER SELECT / QUIT TO TITLE) with party cards for Yuna, Rikku and Paine. Screenshots: `10-party-prep-ch4.png`, `12-pause-ch4.png`, `20-ch4-gunner-menu.png`.

Console errors across every run: **0**. Failed requests / 404s across every run: **0**.

### Pause (Esc / P / H)

- **Escape** reliably opened and closed the pause menu on both Chapter 1 (FFX) and Chapter 4 (FFX-2) once the battle reached its command-menu phase. It also correctly dismissed the pre-battle "battle-start" boss-reveal card on its own press (that card is a separate `BattleStartBanner`, not the pause screen; its corner "PAUSE" label is the always-present mouse chip, not an indicator that pause is open — confirmed by reading the DOM: only `battle-pause-chip` was present, no `pause` screen element, until a later Escape genuinely opened the pause overlay, at which point the full `pause__*` DOM tree with party portrait cards appeared).
- **H** hid and restored the pause panels on Chapter 1 (`ARROWS / WASD MOVE` hint line toggled with the rest of the panel).
- **P**: in repeated automated attempts against Chapter 4, pressing `P` while a story/opening cutscene was still active did nothing (consistent with `canPause` gating on `app.overlayActive`, matching the source comment in `BattleScreen.ts` that a command menu — but not a cutscene — must not block pause). Once at the real command menu, a `P` press issued while the pause screen was **already open** did not close it (only Escape did); this may be intended per the source (`PauseScreen.ts` only binds `cancel`/Escape to resume, `BattleScreen.ts`'s `onPauseKey` only ever sets a flag to *open* pause) rather than a live regression, but it means "P" is not a resume key today. **Not re-verified with `P` opening pause from a settled command-menu state under tight time budget** — flagged as LIVE-A2-2, confidence low, worth a human check rather than blocking this deployment verdict, since Escape (the primary, documented way in and out) worked correctly everywhere it was tried.

### Audio

`window.__pyrefly.audioDebug()` at the chapter-select screen: `{ ready: true, playing: 'chapter-select', prerendered: { manifest: true, cues: 21, sprite: true, spriteDecoded: true }, sfx: [...all entries "prerendered": true...] }`. The currently-playing track was the prerendered chapter-select theme, not a procedural fallback, and the SFX sprite sheet decoded successfully. **PASS.**

## 3. Spot-checks

1. **Chapter 3 enemy names ("Yu Pagoda A" / "Yu Pagoda B", unique enemy with no letter).** Confirmed on the live turn-order rail (`13-battle-ch3.png`): two "Yu Pagoda" entries each carry a small letter chip, "B" and "A" respectively (the source's own convention: the letter is a chip beside the name, not appended to the name text), and "Braska's Final Aeon" (the unique enemy) carries no letter. **PASS.**
2. **Strategy guide panel ends on a whole line with MORE in its own row at 1600×900.** Visible in the same `13-battle-ch3.png` capture (guide panel was open in gameplay, not only in pause): the panel shows the current pick block in full, then a separate "▼ MORE" row directly beneath it with no partial/clipped line. **PASS.**
3. **Paine's portrait is painted (not a 'P' tile) on the Chapter 4 prep screen and in pause.** **Pause: PASS** — `12-pause-ch4.png` shows a painted portrait for Paine (and Yuna and Rikku) in the party card row, and the DOM independently shows `art/portraits/paine.png` (832×1216, decoded) loaded. **Party Prep: FAIL** — `10-party-prep-ch4.png` shows Paine (and also Rikku) as a plain monogram tile ("P" / "R") in both the roster list and the bottom party-stat cards; only Yuna shows a painted portrait there. The asset exists and decodes (confirmed via the same DOM query against the prep screen), so this reads as a wiring gap in the Party Prep screen specifically, not a missing or corrupt asset. Logged as **LIVE-A2-1**.
4. **A fresh profile sees no onboarding briefing and no onboarding rows in pause.** Confirmed: the title screen's text is only "AN UNOFFICIAL FAN TRIBUTE / Pyrefly / Reprise / PRESS ENTER / ...", chapter select has no onboarding/briefing text, and the Chapter 1 pause menu's row list (`RESUME, STRATEGY GUIDE, HIDE PANELS, OPTIONS, ENCOUNTER DETAILS, PARTY, MUSIC PLAYER, CHAPTER SELECT, QUIT TO TITLE`) has no onboarding/briefing/coach row. **PASS.**
5. **The FFX-2 Attack submenu lists one Attack row.** Yuna's default dressphere (White Mage) has no top-level Attack command at all (White Mage's set is WHITE MAGIC / CHANGE / ITEM only — this matches FFX-2's own design, White Mage has no separate physical Attack row). Real input was used to open CHANGE and select Gunner for Yuna; her Gunner command menu then shows exactly one row reading "ATTACK" (`20-ch4-gunner-menu.png`, confirmed both visually and via an exact-line text match). **PASS.**

## 4. Reload smoke (CHK-024, lightweight; NOT the full upgrade matrix)

A returning-player reload was exercised: reached Chapter 1 battle, reloaded the page (no cache-bust), and confirmed the app returned cleanly to the title screen with no console errors, then confirmed chapter select still read "NOT CLEARED" (consistent — the chapter was not actually completed, so this is not evidence either way of save corruption) and that a versioned save key (`pyrefly-reprise:save:v1`) is present in `localStorage`. Attempting to toggle the "Hide Panels" setting via pause before the reload was not reliably reproducible in the time available (the pause screen did not open before the encounter's opening banner had been dismissed in that particular run, a sequencing issue in the test script rather than an observed product defect) — so the specific "change one setting, confirm it survives a reload" half of this check is **UNVERIFIED this pass**, while "a reload returns the app to a working, uncorrupted state with existing save data intact" is confirmed. **notTested: the full save/settings upgrade matrix is explicitly out of scope for this pass per the task.**

## Screenshots

`docs/screenshots/release-a2-live/`: `01-title.png`, `02-chapter-select.png`, `04-battle-ch1.png`, `05-pause-ch1.png`, `10-party-prep-ch4.png`, `12-pause-ch4.png`, `13-battle-ch3.png`, `20-ch4-gunner-menu.png` (8, at the task's cap), plus `run-result.json` (raw step/console/network log from the first automated pass).

## Notes

- Two dead ends are worth recording so they are not repeated: (a) sending `ArrowRight`/`Enter` back-to-back with no wait between presses under-counts on the chapter-select carousel and on the title screen (`key` events themselves fired, but the UI's own input edge-detection needs a frame between presses) — always wait ~300-400 ms between discrete menu presses in this harness; (b) a battle screen needs several seconds after the opening cutscene clears before `canPause` allows Escape/P to open the pause menu (observed empirically at ~6-8 s to reach the first command-menu phase) — pressing too early consumes the press as something else (dismissing the battle-start banner) rather than failing outright, which can look like "pause did nothing" if the screenshot is taken immediately after.
- A separate `mcp` browser-automation tool available in this environment dispatches synthetic `keydown` events with empty `key`/`code` fields, so it could not drive this keyboard-only game at all; Playwright's `page.keyboard.press` was used instead for every real-input step above.
