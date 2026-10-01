Build / artifact / target version: main 25faec70, bundle cJFxGdIo, artifactHash 59788b8b77f782e07555bc273f628b3d7a986bcec4e2ff4a5188966dda1b8421
Review: live
Deployment: PASS (exact artifact byte-identical; changed flows work live; one stray 404 disclosed below, LIVE-R34-01)
Changed area: NOT APPLICABLE (live pass; the focused and deep reviews are separate obligations)
Ship: not applicable to a live pass; discloses one polish issue (LIVE-R34-01)
Milestone: not assessed
Quality: not rescored (last full score unchanged)
Targets: not assessed in a live pass
Top issues: LIVE-R34-01 (polish): one image request to /pyrefly-reprise/%23n answers 404, seen in 2 of 2 desktop runs in the Ch I window between the first attack and RESTART ENCOUNTER; not seen in the phone run or in the pause/credits/briefing walk alone; cause not traced (suspected an img/url built from a "#n" string). No visible breakage. Next correction: log the initiator (resourceType image) and fix the source.
Coverage: tested exact artifact (1070 files, full, changed-from f302f163), Ch I (FFX) and Ch IV (FFX-2) at 1600x900, phone 390x844 Ch I; pause by Escape and P, H hide/restore, TEXT SIZE to 130% and back (no overflow), OPTIONS > ABOUT > CREDITS open and Escape close (Ch I and Ch IV), REPLAY BRIEFING entry, RESTART ENCOUNTER (Ch I and Ch IV, replays to a fresh player turn), QUIT TO TITLE (lands on title), TEXT SIZE 115% survives a reload and shows in the Ch IV pause, prerendered music and sprite-v2.mp3 fetched, v2 cues decoded; not tested approved-pose appearance, listening to the new music and SFX, the phone aim-first target tap beyond opening the Attack command (second-tap commit not exercised), cancel path of RESTART and QUIT (no confirm dialog exists), full upgrade matrix, Stop freeze, Sphere Grid
Next required review and why: the focused and deep obligations of 25faec70 (owner override recorded; deep carried from 32 builds)
Elapsed review time / repeated work avoided: about 25 minutes; no earlier work reused

## Result

1. Exact artifact (CHK-017): PASS. verify-live --full --changed-from f302f163: liveManifest match, 1070 checked, 0 mismatched, 0 missing, 0 wrong type, 0 errors. Manifest: 1070 files, decodeChecked true, audioUnverified 0.
2. Real-input smoke (headless Playwright, PYREFLY_BROWSER=gpu, fresh contexts, cache-busting query), 51 assertions on intended screens: all pass except one harness failure. The H test failed in the first script because the probe read computed style of elements that stay "visible" under a hidden parent; a separate probe with screenshots shows H hides the panels ("H SHOW PANELS" caption) and the second H restores them. Counted as a harness note, not a product failure.
3. Console errors 1 and 404s 1: the %23n image request (LIVE-R34-01). No images served as text/html.
4. Audio: 9 distinct mp3 files fetched (title, chapter-select, pause, boss-seymour, boss-ffx2-aeon, two scene tracks, sprite.mp3 and sprite-v2.mp3); audioDebug shows prerendered manifest true, v2 cues 100 decoded true. Nothing was listened to.
5. Reload smoke (CHK-024 light): TEXT SIZE 115% persisted across a reload and appeared in the FFX-2 pause; restored to 100% afterwards. Chapter progress was not made (no battle was finished), so progress survival is not tested. Full upgrade matrix not run.
