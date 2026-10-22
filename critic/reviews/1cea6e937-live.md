Build / artifact / target version: main 1cea6e937, bundle DwCdr0nf, artifactHash b436c6d54de8096ea2e94675325c8d5fa02a9696fac30420d1ff7b332c0a09d3 (release 60, the conference demo build), live at https://echoesofspira.com/
Review: live
Deployment: PASS
Changed area: NOT APPLICABLE (a live review settles the deployment only; the deep review stays owed)
Ship: not applicable to a live review
Milestone: not assessed
Quality: not rescored by this review
Targets: not assessed
Top issues: none found. One observation, not an issue: in a fresh profile the first Escape pressed while Chapter I's tutorial guide card is up opens the pause screen, and a second Escape returns with the guide gone.
Coverage: tested, the exact artifact in full plus Chapter I (FFX), Chapter IV (FFX-2), Yunalesca and the reload by real input; not tested, the full upgrade matrix, the other chapters, cold-load timing, touch and phone layout, the look's subjective quality, audio by ear, the Chapter I battle-start frame gap
Next required review and why: the deep review of this build (presenter, renderer, asset loader and global layout changed); the focused obligation stays pending because the focused report's candidate bundle (index-CXbIrsG6) differs from the deployed DwCdr0nf
Elapsed review time / repeated work avoided: about 52 minutes, nearly all of it the full manifest compare of 6,160 files; no earlier report reused

## Step 1, exact artifact (CHK-017): PASS

`node tools/artifact-manifest.mjs verify-live --manifest critic/artifacts/1cea6e937.json --url https://echoesofspira.com/ --changed-from critic/artifacts/6db09ac86.json --full` returned PASS: live manifest matches, 6,160 files checked, 0 mismatched, 0 missing, 0 wrong content type, 0 errors. `index.html` equals the artifact once the Cloudflare Web Analytics beacon is cut out. The page loads `assets/index-DwCdr0nf.js`.

## Step 2, real-input smoke (CHK-016): PASS

Headless Playwright, PYREFLY_BROWSER=gpu (real GPU, no black canvas, no fallback), 1600x900, fresh contexts, cache-busting query, real key presses only (`window.__pyrefly` read for assertions). Screenshots are in `critic/reviews/1cea6e937-live/shots/`.

- Chapter I (FFX, seymour-flux, `?demo=1`): reached by title, chapter select, party prep, battle. The first menu opened on seed 7 with the look at hd2d bold (room gagazet, relight 10 bound, 6 loaded, 0 missing) and `seymour-flux-body` drawn as a rig. The first Attack opened the cursor on Seymour Flux (`targeting().selectedIds` = seymour-flux; the HUD reads TARGET Seymour Flux). Escape returned to the command menu (cancel path). The second Attack confirmed.
- Chapter IV (FFX-2, ffx2-bahamut, `?demo=1`): first menu on seed 56, look on (room bevelle-underground, relight 8 bound, 5 loaded, 0 missing), `ffx2-bahamut` rig on. Item, Potion, target Yuna; Escape went back to the item list; the confirm showed the POTION tag and a white-blue burst on Yuna.
- Yunalesca (another FFX chapter): look null, no relight, no passes, as r59.
- Pause: Escape and P open it, Escape resumes, H hides and restores the panels.
- Music: the prerendered mp3s (`audio/music/title.mp3`, `audio/sfx/sprite.mp3`, 27 to 29 requests per run) were fetched; the audio debug surface returned nothing, so playing rather than fallback is inferred.
- Console errors 0, 404s 0, responses at or above 400: 0, image responses served as HTML: 0.

## Step 3, reload smoke (CHK-024, lightweight): PASS

MASTER VOLUME lowered 80 to 60 with real ArrowLeft presses; after the reload the save was byte-identical (masterVolume 0.6) and the game re-booted to chapter select. The full upgrade matrix was NOT run (notTested).

## Step 3b, static checks

Pose census (data, not a verdict): 146 subjects, 1,106 paintings, 829 pass, 79 waived, 0 rigged, 0 fail, 198 exempt. File `critic/reviews/1cea6e937-live/static/pose-census.json`.

## Not tested

The full save-upgrade matrix, the other chapters on the live build, cold-load timing, touch and phone layout, subjective quality of the look, motion and rigs, audio by ear, and the Chapter I battle-start 0.8 s gap the changelog discloses.
