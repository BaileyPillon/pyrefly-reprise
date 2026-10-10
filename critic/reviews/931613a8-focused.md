Build / artifact / target version: 931613a8 (branch rc1-rel: release candidate 39.4.3 = presentation r3943-int a74b2b8e + battle rules RC1) / dist-gate bundle KHicpkvR, 5,084 files, built here with BASE_PATH=/ / targets.json sha256 ba8a7e74a9d6...0b98 (unchanged)
Review: focused
Deployment: NOT APPLICABLE (nothing deployed; the live review owns the exact artifact)
Changed area: FAIL (CHK-027 motion continuity fails, as it does on live and worse there; Chapter XVIII's difficulty is unproven for a human route. Nothing regressed.)
Ship: SHIP. No critical defect and no regression against live 39.4.2. Disclosed majors: F931-01 (CHK-027, equal or better than live), F931-02 (Chapter XVIII 3 of 500, owner decided, no real-input win reached). Disclosed polish: stale guide texts, three replaced paintings awaiting Bailey, inert unreleased title painting.
Milestone: not assessed
Quality: not scored (focused pass)
Targets: required 0 / matched 0 / failing 0 / unverified 0 / waiting 0 (no tile composites made; nothing claimed matched)
Top issues: F931-01 (major, feel, CHK-027), F931-02 (major, balance, Chapter XVIII), F931-03 (polish, stale texts), F931-04 (polish, three paintings await Bailey), F931-05 (polish, echo.webp inert)
Coverage: tested: rebuild, art verify and audit, verify-approved 916/0/0, 24 first menus with a real attack at 1600x900 and 2000x1012 (9 chapters), 6 phone first menus, five full real-UI fights with the continuity harness (FFX-2 IV and V won, FFX I won, II and XVIII lost) and live 39.4.2 for IV, I and II; Chapter XVIII 500 seeds. Not tested: seven FFX and four FFX-2 chapters in play, the five short-KO poses, the held Defend fallbacks, printed hit chances over many hits, the full data audit, tile composites, 1280x720.
Next required review and why: live verification of the exact artifact after the deploy, then the deep review on the live build (continuity over every remaining chapter, the short-KO dressphere chapters, the full data audit).
Elapsed review time / repeated work avoided: about 150 minutes of wall clock, mostly the continuity runs; reused the driver's tsc and full suite (1,003 files, 0 failed).

## What was proved

- The artifact was rebuilt here at 931613a8 (the old dist-gate was from before the merge). Every shipped art file equals its master (art-derive verify PASS, audit PASS) and verify-approved reads 916 ok / 0 / 0.
- Presentation: Chapter I and III start with the guide folded and the full NEXT BEST MOVE card (15,118 px box); G opens the guide and the card becomes the one-row tip, G again restores it; the card sits clear of the G and N chips and the figures. Chapter II and every FFX-2 chapter keep the guide open (game-aware). Flux at 60 percent, Braska with the pagodas, Yunalesca (about 0.93 of the party), Natus, the Fins, Bahamut, Paragon and Anima fit at 1600x900, 2000x1012 and 390x844; the phone shows the one-row tip and GUIDE chip.
- Battle: a real Attack and target landed in every chapter sampled (for example 972 on Yunalesca). Mega Flare is 14 in the data, the engine table and the research note.
- CHK-026 passes in all five chapters played; live fails it in Chapter IV (76.8 percent head jump).
- CHK-027 fails everywhere, on live too; the candidate has fewer jerks than live in Chapters I and IV.
- Chapter XVIII: I reproduced 3 of 500 (seeds 118, 124, 129) in the engine; real-UI advisor routes lost at seeds 1 and 118. Winnable in principle, not shown winnable at human pace.

## Not settled

- Chapter XIII's long fight and the other chapters in play, the five short-KO paintings, and the full data audit go to the deep review tonight.

## Process notes

- Preview server on 127.0.0.1:5471 (PID 46184) stopped afterwards; the port was confirmed closed. GPU mode throughout (about 60 fps). The continuity run of Chapter XIII was stopped on purpose after its first menus (a 100-minute chapter); its processes were ended by PID.
- No commit, no edit of critic/pending, no product code changed. Scratch: D:/Tools/pyrefly-scratch/2026-10-09/.
