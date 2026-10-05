```text
Build / artifact / target version: main cd9dbbb0 / bundle BGBDEn_P / artifactHash 766d9587007f584bd20256f6afbaaa1397252b47ea3aa7e3d1f40a49283898f7
Review: live
Deployment: PASS
Changed area: NOT APPLICABLE
Ship: N/A (a live review does not gate ship; the focused report critic/reviews/cd9dbbb08-focused.json holds that verdict)
Milestone: not assessed
Quality: not assessed (a live review does not recompute the score)
Targets: not assessed
Top issues: none open from this pass; LV-1 (informational, review-script defect, below)
Coverage: tested = artifact identity (342 files against critic/artifacts/cd9dbbb0.json, diffed from c69de96a), the title/chapter-select/party-prep/battle flow with real input on Ch I (seymour-flux) and Ch IV (ffx2-bahamut), the living pause portraits on both chapters (Tidus then Yuna, Yuna X-2 then Rikku X-2), P / Escape / H, music fetch, settings reload; reused = none; not tested = the full upgrade matrix, the twirl and boss keys in play, FF7 plates, the 390x844 pause, win/loss/retry, how the faces look
Next required review and why: none newly triggered by this pass; the live obligation of cd9dbbb0 is settled by this report, its focused and deep obligations stay owed (critic/pending/cd9dbbb0.json)
Elapsed review time / repeated work avoided: about 35 minutes; no earlier evidence reused (first live check of this sha)
```

## Step 1: exact artifact (CHK-017)

```
node tools/artifact-manifest.mjs verify-live --manifest critic/artifacts/cd9dbbb0.json --url https://baileypillon.github.io/pyrefly-reprise/ --changed-from critic/artifacts/c69de96a.json
```

```json
{
 "result": "PASS",
 "artifactHash": "766d9587007f584bd20256f6afbaaa1397252b47ea3aa7e3d1f40a49283898f7",
 "liveManifest": "match",
 "checked": 342,
 "mismatched": [],
 "missing": [],
 "wrongType": [],
 "errors": []
}
```

The live page serves `assets/index-BGBDEn_P.js`.

## Step 2: real-input smoke (CHK-016)

Headless Playwright from node, `PYREFLY_BROWSER=gpu`, 1600x900, fresh context, cache-busted URL. Every game input is a real key press; `window.__pyrefly` was read only for the screen name and the board's selected id.

| Step | Result |
|---|---|
| Boot, title, served bundle names BGBDEn_P | ok (load 3.5 s) |
| Title to chapter select, cursor to `seymour-flux`, party prep, cutscene skip, battle, player turn | ok |
| Ch I cancel path (submenu, Escape) and Attack | ok, battle still running |
| Ch I: P opens the pause (tabs Tidus, Yuna, Kimahri, Chapter, Guide, Options, Controls, Music) | ok |
| Ch I living portrait, Tidus: twin present and ready in 31 of 31 samples, 22 distinct face states, 17 distinct canvas pixel hashes, up to 104,083 drawn pixels | face moves |
| Ch I: E to Yuna: twin follows, 17 states, 16 hashes | face moves |
| H hides the panels (`.pause__ui` block to none, `.pause--bare` on), H restores | ok |
| Ch I: Escape closes the pause, back to battle, `[data-living]` count 0 | ok |
| Reload with a changed setting (below), then Ch IV: `ffx2-bahamut` through the same flow, menu Attack/Skill/Change/Item, Attack | ok |
| Ch IV: P opens the pause (tabs Yuna, Rikku, Paine, ...); Yuna X-2 twin ready, 16 states, 12 hashes; E to Rikku X-2: 17 states, 16 hashes | face moves |
| Ch IV: Escape closes the pause, `[data-living]` count 0 | ok |
| Console errors / 404 / responses of 400 or more / images served as text/html | 0 / 0 / 0 / 0 |
| `art/portrait-parts/` requests | 64, all HTTP 200 |
| Music | 16 mp3 requests: title, chapter-select, scene-gagazet, boss-seymour, scene-bevelle-underground, boss-ffx2-aeon, pause, sprite sfx. `__pyrefly.audio` has no debug() surface, so the network log is the evidence |

Screenshots (scratch, not tracked): `D:/Tools/pyrefly-scratch/2026-10-03/live-r37/` (`04-ch1-pause.png`, `08-ch4-pause.png` and the rest, plus `report.json` and `out.txt`).

## Step 3: reload smoke (CHK-024, lightweight)

OPTIONS, MASTER VOLUME lowered from 80 to 60 with two real ArrowLeft presses; the save held `masterVolume: 0.6`; after `page.reload` it still held 0.6 and the Ch IV OPTIONS row read 60; restored to 80. Not tested: the full upgrade matrix, and chapter progress (no chapter was completed).

## Notes

- **LV-1 (informational, review-script defect, not a build defect).** The first run of this script failed three checks that were stale for this build: H now toggles `.pause--bare` on `.pause__stage` and hides `.pause__ui` (it no longer changes `.pause__col`), and CINEMA LIGHT moved from the OPTIONS tab to the EYE CANDY page, so a toggle of it on OPTIONS found nothing. The script was corrected and the whole run repeated: 35 steps ok, 0 failed. Both runs had 0 console errors.
- This pass measures that the living faces move and are removed on close, not how they look; that stays with the focused and deep reviews.
