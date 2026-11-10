```text
Build / artifact / target version: main 3fd64f576 / bundle C26ETj4I / artifactHash 0ea9f85780ebd0a81e32d9a624021752e46becd46f7634295199050ffeaecbec
Review: live
Deployment: PASS
Changed area: NOT APPLICABLE
Ship: N/A (live review does not gate ship; the focused review said SHIP with disclosed majors R80-1 and R80-2)
Milestone: not assessed
Quality: not assessed
Targets: not assessed
Top issues: OBS-1 (informational): a first Escape within about 4 s of the battle menu appearing did not pause in dragon, debut and wendigo
Coverage: tested = artifact identity (115 files), listed FFX chapter with a command and a cancel, typed words blitz, dragon, debut, wendigo to the first battle menu, no Special row in FFX-2, Escape/P/H, music, console and 404 sweep, lightweight reload, pose census; reused = none; not tested = full upgrade matrix, R80-1 and R80-2 re-measurement, any hidden chapter played to an outcome, phone tier, party-prep two-line title card
Next required review and why: the deep review this build still owes (critic/pending/3fd64f576.json)
Elapsed review time / repeated work avoided: about 55 minutes (20 of them waiting on an unneeded --full manifest run that I stopped); the focused review evidence was not repeated
```

## Step 1, exact artifact (CHK-017): PASS
`verify-live --manifest critic/artifacts/3fd64f576.json --url https://echoesofspira.com/ --changed-from critic/artifacts/193f6aef4.json` returned PASS, liveManifest match, 115 checked, none mismatched, missing or wrongType. The title screen reads RELEASE 80 and 3fd64f57.

## Step 2, real-input smoke (CHK-016): PASS
Headless Chromium, PYREFLY_BROWSER=gpu, 1600x900, cache-busted URL, fresh context each, lock held. Listed Seymour Flux reached a battle menu; Attack and a cancel path moved the battle log 14 to 19. The words blitz, dragon, debut and wendigo each opened their chapter to a first battle menu. dragon reads Attack, Skill, Change, Item; debut reads Attack, Trigger Happy, Item (a lone Gunner); neither has a Special row. Escape, P and H work (H flips the saved pausePanelsHidden). Prerendered music is fetched and playing in every context. 0 console errors, 0 responses of 400 or more. Screenshots sit in critic/reviews/3fd64f576-live/.

OBS-1: a first Escape pressed within about 4 s of the battle menu appearing did not pause in dragon, debut and wendigo; the second did, and after a 12 to 15 s wait the first press paused. Not compared with release 79.

## Step 3, reload (CHK-024, lightweight): PASS
After one battle attempt and H (pausePanelsHidden true), reload returned to the title and the save kept both. Full upgrade matrix not tested.

## Step 3b, static pose census
subjects 190, paintings 1317, pass 995, waived 114, rigged 0, fail 0, exempt 208. Data only (critic/reviews/3fd64f576-live/static/pose-census.json).
