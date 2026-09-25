Build / artifact / target version: 1a680e41 (release 17 re-cut candidate, D:/pyrefly-rel17b, bundle index-BVdUtZb-.js from dist-gate) / live comparison e45ed3c1 (release 17 as deployed at 20:06Z, bundle index-RSsiNs7I.js, checked at the live URL; the brief named fc7f1a20, which e45ed3c1 replaced) / targets.json sha256 3d2822fe...bc00 (candidate tree)
Review: focused
Deployment: NOT APPLICABLE (live verification is a separate obligation after the deploy)
Changed area: PASS (FOC17-01 and FOC17-02 repaired and seen repaired with real input in both games; briefing option A verbatim; no regression)
Ship: SHIP. No critical defect, no regression against live e45ed3c1, and the two majors release 17 disclosed (FOC17-01, FOC17-02) are repaired. This release discloses no major.
Milestone: not assessed
Quality: not scored (focused pass); the last full score is round 03 on 7191674, 2026-09-19, rubric v1 history
Targets: required 3 / matched 3 / failing 0 / unverified 0 / waiting 0 (results A, phone battle HUD B, Auron's briefing C1)
Top issues: FOC17b-01 polish (Trema loss wedge empty: yuna-dark-knight has no hurt/ko painting; live shows FFX Yuna there), FOC17b-02 polish (ivory strip right of the results wedge at 2000x1012, same on live), carried FOC17-03 / FOC17-04 polish and FOC17-05 question
Coverage: tested FFX-2 Chapters IV, V, VI, XIII and FFX Chapter I with real keys, touch and mouse on the production build; Chapters VI, IV and XIII also on the live build; briefing at three sizes; tsc and the 6 changed unit files. Reused: everything else from the 5860a134 focused pass (dependency argument below). Not tested: Den of Woe (unlisted), Chapters II, III, audio, performance, real devices
Next required review and why: live verification of 1a680e41 after the deploy, then the deep review this shared-system change owes on the live build (plan depth deep, deepAfterDeploy true; e45ed3c1's deep obligation is carried)
Elapsed review time / repeated work avoided: about 45 minutes (over the 15-minute budget: each real-key chapter run takes 1 to 2.5 minutes of play, and the Trema and 2000-wide findings needed a live run each to tag them) / the 5860a134 evidence for A1, the guide rule, Chapters IX and XIII, phone text sizes and the defeat -> RETRY flow was reused

## Plan

`node tools/critic-plan.mjs --json` in D:/pyrefly-rel17b: previousBuild e45ed3c1, depth **deep**, `deepBeforeDeploy: false`, `focusedBeforeDeploy: true`, `deepAfterDeploy: true`, carriedDeep [e45ed3c1]; games both; systems FFX-2 HUD, global layout / input / boot, screens; product paths ResultsScreen.ts, victoryLine.ts, ffx2/CommandMenu.ts; checks CHK-002, 003, 006..010, 015..017, 020, 021; targetGroups fight, pause, phone, presentation; dataAudit false; approvedArtCheck false. No save-data class and no milestone claim, so the focused pass runs before the deploy.

## Candidate and environment

- `D:/pyrefly-rel17b/dist-gate` already existed, built 16:25 after the last product commit 29fe0736 (15:57); the later commits c714316c and 1a680e41 are docs and ledger only. Bundle index-BVdUtZb-.js contains the option A briefing.
- Served with `vite preview --outDir dist-gate` on 127.0.0.1:5420 (PID 45116). Live compared at https://baileypillon.github.io/pyrefly-reprise/ (index-RSsiNs7I.js = e45ed3c1).
- Headless Playwright Chromium, `PYREFLY_BROWSER=gpu`; no black canvas, no fallback. One browser at a time.
- Server stopped by its own PID (`taskkill /PID 45116 /T /F`); port 5420 confirmed closed.
- `npx tsc --noEmit` clean; the six unit files changed since 5860a134: 79 passed.

## Delta since 5860a134 and the game case (CHK-021)

- **FOC17-01, results wedge art: FFX-2 only** (AGENTS.md rule 14; research/ffx-vs-ffx2-presentation.md 2.2, FFX-2 poses are per dressphere). Present: Chapter VI Rikku win -> `portraits/rikku-x2.png`, Paine win -> `portraits/paine.png`, Chapter IV win -> `portraits/yuna-x2.png`, Chapter IV loss -> `characters/yuna-white-mage/hurt.png`. Absent: FFX Chapter I win still `portraits/tidus.png`. Live shows FFX `rikku.png` and `yuna.png` for the same runs.
- **FOC17-02, tapped row takes the cursor: both** (shared input; the code lives in src/ui/ffx2 because FFX already did this). Phone FFX-2 Chapter V: Mega-Potion -> "Mega-Potion -> All allies", sent `x2-mega-potion` to all three; Hi-Potion -> "Hi-Potion -> Yuna", sent `x2-hi-potion`. Phone FFX Chapter I: Mega-Potion -> "Mega-Potion -> All allies", sent `mega-potion` to Tidus, Yuna, Kimahri. Desktop FFX-2 mouse click on Hi-Potion: the row highlights, the help line reads "HI-POTION Recovers 1000 HP.", Enter sends Hi-Potion.
- **Auron's briefing option A: both** (already live on e45ed3c1). Verbatim at 1600x900, 2000x1012 and 390x844; smallest text 15 / 15 / 14 px.
- **Nooj's idle: FFX-2 only, Den of Woe unlisted;** not reachable from chapter select, not played.

## What was played (real keys unless said)

1. Chapter VI (FFX-2) twice from a fresh save with 1 and 2 recorded prior attempts (labelled setup): enemies set to 1 HP at each menu (labelled), Attack by arrows + Enter; results show Rikku / rikku-x2 (1600x900) and Paine / paine.png (2000x1012). Same run on live: FFX rikku.png.
2. Chapter IV (FFX-2) win at 2000x1012: yuna-x2; Enter, hold-Enter through the post scene, chapter select. Live: FFX yuna.png, same flow.
3. Chapter IV loss (party at 1 HP, labelled; Defend): Defeat panel with Yuna White Mage fallen; Enter (RETRY) to party prep.
4. Chapter XIII (FFX-2) loss on both builds: candidate wedge empty, live wedge FFX Yuna hurt (FOC17b-01).
5. Chapter I (FFX) win: Tidus, "...Okay. Next one.", tidus.png.
6. Phone 390x844 touch probes in Chapters V and I, and a 1600x900 mouse probe in Chapter VI (above).
7. First-run briefing at three sizes.

0 console errors and 0 HTTP errors in every run on both builds.

## Target comparisons

- `tile-A-results.jpg`: Results mockup (chapter 1 win) vs the candidate: composition matches; Tidus stands in the wedge as the line's speaker (VL-1 decision).
- `tile-phone-battle-hud.jpg`: phone battle HUD B vs the Chapter V ALL-target step: layout matches and the confirm now names the tapped item.
- `tile-c1-briefing.jpg`: briefing C1: painting, layout, gold emphasis and skip line match; the words are Bailey's later option A (D-181).

## Checks

| Check | Result | Note |
|---|---|---|
| CHK-016 (mandatory) | PASS | every capture asserted screen and chapter |
| CHK-017 (mandatory) | NOT APPLICABLE | focused candidate review |
| CHK-021 (mandatory) | PASS | FFX-2 repaired, FFX unchanged; tap fix in both |
| CHK-015 | PASS | keys, touch, mouse; HP setups labelled |
| CHK-010 | PASS | tapped/clicked row takes the cursor, labels agree with the sent command |
| CHK-020 | PASS | same tap played in both games |
| CHK-003 | PASS | briefing 14-15 px minimum |
| CHK-007 | PASS | briefing verbatim, no developer words |
| CHK-009 | PASS | "MEGA-POTION -> ALL ALLIES" in full |
| CHK-008 | PASS | X-2 portraits framed like the FFX ones |
| CHK-002, CHK-006 | UNVERIFIED | not exercised; FOC17b-02 belongs to CHK-002 |

## Issues

- **FOC17b-01 (polish; introducedByCandidate true, regressionVsLive false).** An FFX-2 loss whose leader wears a dressphere with no hurt/ko painting shows an empty wedge (Trema: yuna-dark-knight has only attack and idle). Live shows FFX Yuna there, which is the wrong game, so this is not a regression. `wedgeFallenArt` in src/ui/common/victoryLine.ts (traced). Fix: fall back to an FFX-2 art she has (dressphere idle or dimmed -x2 portrait). Acceptance: a Trema loss shows an FFX-2 Yuna, no FFX art, no 404s.
- **FOC17b-02 (polish, pre-existing).** At 2000x1012 the results screen stops about 100 px short of the right edge (ivory strip); identical on live.
- **FOC17-03, FOC17-04 (polish, carried), FOC17-05 (question for Bailey, carried).** Unchanged by this delta.

## Ship decision

SHIP (`shipVerdict`: no critical defect and no regression against the live build; nothing to disclose at major). Report validated with `validateReport` (0 errors).
