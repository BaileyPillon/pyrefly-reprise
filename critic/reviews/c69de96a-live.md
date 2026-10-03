Build / artifact / target version: main c69de96a (c69de96a3bfa7e57cfad6c7b127ed6d8fd662718), bundle GO0eMOto, artifactHash 37273cfee71633f8c077b288adc56ae1f84b96149f2b85cd3500a5553eecaaaa (1432 files, 798,872,755 bytes); no target version assessed in a live pass
Review: live
Deployment: PASS
Changed area: NOT APPLICABLE (live pass; the candidate's deep review, round 19b, gave changed area FAIL for the polish regression PR-0330 only, and ship SHIP)
Ship: not applicable to a live pass; nothing seen here contradicts round 19b's SHIP; no critical or major issue found; one informational note (LV-36-01)
Milestone: not assessed
Quality: not rescored (round 19b's categories were PROVISIONAL with audio UNVERIFIED; no live pass rescoring)
Targets: not assessed in a live pass
Top issues: none new; LV-36-01 informational (33 client-side image preload cancellations, no HTTP status)
Coverage: tested the exact artifact (1432 of 1432 files, full), Chapter I (FFX) and Chapter IV (FFX-2) by real keys at 1600x900 with a state assertion before every capture (14, 0 mismatches), the EYE CANDY page in both games (row sets, one part flipped off and on, ALL LOOKS, Escape out), a real dressphere change raising the held DRESSPHERE SHOT, pause (Escape, P, H), a reload carrying a stored setting and the first-run progress, prerendered music, the console and network sweep; not tested: phone touch, the effects themselves, the other 16 chapters, the full upgrade matrix (list below)
Next required review and why: the deep review of c69de96a stays owed (planned deep, deepAfterDeploy; critic/pending/c69de96a.json) together with the focused acceptance of the changed area; it should take round 19b's open majors, PR-0330 and the not-tested list below
Elapsed review time / repeated work avoided: about 25 minutes, roughly 10 of them harness iteration; no earlier evidence reused

## Result

1. Exact artifact (CHK-017): PASS. In `D:/Final Fantasy`: `node tools/artifact-manifest.mjs verify-live --manifest critic/artifacts/c69de96a.json --url https://baileypillon.github.io/pyrefly-reprise/ --changed-from critic/artifacts/ef3f6bbf.json --full` returned `{"result":"PASS","artifactHash":"37273cfe...aaaa","liveManifest":"match","checked":1432,"mismatched":[],"missing":[],"wrongType":[],"errors":[],"notes":[]}`. The hash equals the pending marker's and the candidate hash round 19b recorded, so the build deployed is the build that was reviewed. The whole manifest was compared (the pending marker plans a deep review): 798,872,755 bytes, `.nojekyll` included, 163 files added and 85 changed against ef3f6bbf. The stored manifest has `decodeChecked: true`, 0 audio unverified, no problems. The live `index.html` is 3056 bytes and loads `assets/index-GO0eMOto.js`.

2. Real-input smoke on the live URL (headless Playwright, `PYREFLY_BROWSER=gpu`, no fallback needed, no black canvas). Fresh context, cache-busting `?livesmoke=<ts>`, 1600x900, no save at the start. Final run `desktop-run2`, 1.9 minutes, 417 requests.

| Item | Evidence | Result |
|---|---|---|
| Title, board, party prep, cutscene skip, battle | real Enter and arrows; Chapter I `seymour-flux` (FFX, CTB) and Chapter IV `ffx2-bahamut` (FFX-2, ATB), each asserted as screen `battle`, the intended chapter, the intended game and `awaitingMenu: true` before any capture | PASS |
| State assertions (CHK-016) | 14 captures, each preceded by an assertion on screen name, chapter, game, menu state and the `.pause--ec` class; 0 mismatches | PASS |
| EYE CANDY page, Chapter I (FFX) | pause by Escape, OPTIONS by ArrowRight, the EYE CANDY row by ArrowDown (row read ALL ON), Enter opens the page; 12 rows (ALL LOOKS and 11 switches), OVERDRIVE SHOT present, DRESSPHERE SHOT absent, header 11 of 11 on | PASS |
| One switch, five levels | FOG by Enter: row OFF, header 10 of 11, save `fxFog` false, seam `fog` false, mix `fog` false; ArrowRight: row ON, header 11 of 11, save true | PASS |
| ALL LOOKS | Left: ALL OFF, header 0 of 11, the three looks false in the save, all 12 seam keys false; Right: ALL ON, 11 of 11 | PASS |
| Cancel paths | Escape on the page: it closes, the pause stays, the cursor is back on the EYE CANDY row (both chapters); Chapter I Special submenu then Escape returns to the command list | PASS |
| Pause keys | Escape and P open and resume the pause; H hid and restored the panels (`panelsHidden` false, true, false; the setting is persisted, so it was put back); Escape, Escape round trip | PASS |
| EYE CANDY page, Chapter IV (FFX-2) after a reload | 12 rows, DRESSPHERE SHOT present, OVERDRIVE SHOT absent; FOG still OFF and the seam's `fog` false (the stored value applied at boot); DRESSPHERE SHOT flipped OFF (seam `dressphereShot` false) and ON; FOG restored | PASS |
| A real dressphere change (DRESSPHERE SHOT) | Chapter IV: attacked until the Change row was enabled (the first menu had it disabled: Paine is cursed and the guide card says she cannot change dresspheres), selected Change by ArrowDown, Enter, ArrowDown in the sphere list, Enter: Yuna White Mage to Black Mage (frame shows Black Mage); `html.mix-held` was set about 0.5 s later, the held close shot of the change | PASS |
| Music | `audioDebug()`: playing `boss-ffx2-aeon`, `source: prerendered`, not muted, prerendered manifest true, 26 cues, sprite decoded, v2 100 cues decoded; 9 distinct mp3 files fetched (title, chapter-select, scene-gagazet, boss-seymour, pause, scene-bevelle-underground, boss-ffx2-aeon, both SFX sprites), none with an HTTP error. Nothing was listened to | PASS |
| Whole-run counts | 417 requests; console errors 0, page errors 0; 404s 0; responses of 400 or more 0; images served as `text/html` 0; requests containing `%23n` 0; load to ready 897 ms (under 5 s); 33 `net::ERR_ABORTED` image preloads (client-side, no status) | PASS |

3. Reload smoke (CHK-024 light): in the Chapter I pause FOG was turned OFF by a real Enter. The save's `settings` before and after `page.reload` both held `fxFog: false`, and `seenCoach` (briefing, firstrun-board, firstrun-prep, ffx-turn-order, firstrun-battle, ffx-overdrive) is identical, the first-run progress made in the run. After the reload Chapter IV's OPTIONS row read EYE CANDY 10 OF 11 and the page FOG OFF with the seam's `fog` already false, so the stored value was applied, not only stored. Defaults were put back (`fxFog` and `fxSphere` true). Only `pyrefly-reprise:save:v1` was exercised. No chapter was cleared and the full upgrade matrix was not run (see not tested).

## Observations

- LV-36-01 (informational): 33 `net::ERR_ABORTED` image requests in the final run, none with an HTTP status: board card art cancelled when the cursor moves on, and the pause plate png cancelled where its webp is used. Same class as LV-35-02. Not counted as 404s.
- Seen in frames, not graded: the Chapter I first menu in the final run showed Seymour's "Let it in." line over the left advisor panels while "Kimahri became a Zombie." was up (a taunt that happened before the menu); the first run's first menu, taken at the same state without the taunt, showed the guide, advisor and coach cards clear. The same class is already open in round 19b as PR-0291 (the Zombie warning slab over the Guide card) and PR-0286 (the status line over the dialogue banner); nothing new is filed from this pass.

## Harness note

Earlier runs of my own script had defects, none in the product. Desktop run 1 asserted the title with a selector for a class the title screen no longer carries, so it renamed a correct title frame `STATE-MISMATCH` (I viewed it: it is the title); it ran while the 800 MB byte comparison was downloading, which is why its load time (6,991 ms) is not the figure reported; and its dressphere step found Change disabled on Chapter IV's first menu (the curse above) and went into Items. A probe (`ONLY_CH4=1`, `probe-ch4`, `probe-ch4b`) traced every key and showed the row enabled on the next menu; the final run attacks until an enabled Change menu comes. The final run is `desktop-run2`, written by one `smoke.mjs`.

## Not tested (goes to the deep review or the next batch)

- Phone touch at 390x844: the EYE CANDY page's tap-to-flip and the device notes `ON · OFF HERE` and `ON · LESS HERE`; a real phone, Safari, a controller.
- The effects themselves on the live build (tilt-shift, fog meshes, SMAA, the held Overdrive shot, CHAPTER FRAMING, BOSS SCALE): only the switches, the seam, the mix's gate and the held-shot class were read; no frame difference was measured. Round 19b measured them on the candidate.
- OVERDRIVE SHOT with a real Overdrive in Chapter I; REDUCE MOTION notes on the page; the other 16 chapters; the Yunalesca plate and the advisor card under the colossus layout (PR-0330) on the live build; the other majors round 19b disclosed.
- A chapter clear and its progress across a reload; the full CHK-024 upgrade matrix (a save from the previous live build migrating forward, truncated storage, the reset flow).
- Frame time and memory on the 799 MB build; the sound itself (agents cannot hear: the debug surface and the network log were read, nothing was listened to).

Evidence, all under `D:/Tools/pyrefly-scratch/2026-10-03/live36/`: `smoke.mjs` (final script), `desktop-run2/` (frames and `report.json` with the assertions, the seam snapshots, the audio debug and the per-key dressphere trace), `desktop-run1.log`, `probe-ch4.log` and `probe-ch4b.log`, `verify-live.out.txt` and `verify-live.json`. No server was started; every browser was closed by its script.
