```text
Build / artifact / target version: main c8ecbcb31 / bundle C9xPmvqR / artifactHash fb151fee740a2211662998ca3d69b4c86799799376c4ad40bc47e4c54236ac08
Review: live
Deployment: PASS
Changed area: NOT APPLICABLE
Ship: N/A (live review does not gate ship; focused report critic/reviews/c8ecbcb31-focused.json says SHIP)
Milestone: not assessed
Quality: not assessed (live review does not recompute the score)
Targets: not assessed
Top issues: none new from this pass; disclosed from the focused review: R62-01 CHK-027 jerks inherited, R62-02/03 polish at 390 px
Coverage: tested = artifact identity, full mode: 6241 files compared against critic/artifacts/c8ecbcb31.json (diffed from 660c19bbd), live manifest match; demo mode (?demo=1) title -> picker (controls card, Follow the NEXT tip, 2 tiles) -> Chapter I FFX Seymour Flux -> voiced cutscene -> battle -> real player turn; Overdrive gauge shows 50% in the pause panel (173c); demo mode Chapter IV FFX-2 Bahamut picked by selectedId -> battle -> player turn (screenshot confirms painted Bahamut, HUD, menu); cancel path: Escape from the picker returns to the title, Enter re-enters the picker; Escape/P pause and resume on both chapters; H hides panels (PAINTING ONLY hint) and restores them; prerendered music fetched (200 mp3: title, chapter-select, scene-gagazet, boss-seymour, scene-bevelle-underground, boss-bahamut, pause, victory/defeat cues), audioDebug playing boss-seymour, no synth fallback; reload smoke: masterVolume 80 -> 90 by real ArrowRight in pause OPTIONS, reload, value 90 after reload; console error and HTTP >=400 sweep across the whole run; reused = none; not tested = full CHK-024 upgrade matrix; progress persistence (no chapter win was played, so no cleared-chapter progress could be reloaded); 173g defeat TRY AGAIN / OTHER FIGHT screen (no defeat was driven with real input); 173h thanks card with QR and 173i hold-reset (not reached); 173b Mega Flare flood light and shake, 173a cathedral beyond one static frame at the turn; gamepad A/Start skip of the opening (no pad in headless run); mobile 390 px polish items R62-02/03; CHK-027 motion jerks (inherited R62-01, focused review disclosed)
Next required review and why: the build's deep obligation (marker review: deep) still stands; this pass settles only the live obligation
Elapsed review time / repeated work avoided: ~40 minutes, most of it the --full byte comparison of 6241 files; no prior evidence reused
```

## Step 1 exact artifact (CHK-017)
PASS: 6241 files checked, 0 mismatched, 0 missing, 0 wrong type, live manifest matches. Run with --full because the marker's planned review is deep, and --changed-from critic/artifacts/660c19bbd.json (Release 61).

## Step 2 real-input smoke (CHK-016)
Headless Playwright, PYREFLY_BROWSER=gpu, 1600x900. Demo mode (?demo=1): title to picker (controls card and NEXT tip visible, two tiles), Escape back to the title and Enter again (cancel path), FFX Ch I through the voiced opening to a player turn (Overdrive 50% in the pause panel), FFX-2 Ch IV Bahamut to a player turn (painted scene, menu and HUD drawn). Escape/P pause and resume, H hides and restores panels. Prerendered mp3 music was fetched for every screen, no synth fallback. Console errors 0, HTTP >=400 responses 0.

## Step 3 reload smoke (CHK-024)
masterVolume 80 to 90 by real key, reload, 90 read back. Full upgrade matrix and progress persistence not tested.

## Step 3b static checks
Pose census (tools/pose-gate.mjs --report): {"subjects":146,"paintings":1106,"pass":829,"waived":79,"rigged":0,"fail":0,"exempt":198,"byClass":{"idle":146,"standing":565,"ko":90,"low":71,"wide":4,"staged":176,"part":54},"byGame":{"FFX-2":777,"FFX":307,"FF7":22},"byRowStatus":{"ok":746,"held":83,"waived":79,"none":198}}. Data, not a verdict.

## Not tested
- full CHK-024 upgrade matrix
- progress persistence (no chapter win was played, so no cleared-chapter progress could be reloaded)
- 173g defeat TRY AGAIN / OTHER FIGHT screen (no defeat was driven with real input)
- 173h thanks card with QR and 173i hold-reset (not reached)
- 173b Mega Flare flood light and shake, 173a cathedral beyond one static frame at the turn
- gamepad A/Start skip of the opening (no pad in headless run)
- mobile 390 px polish items R62-02/03
- CHK-027 motion jerks (inherited R62-01, focused review disclosed)
