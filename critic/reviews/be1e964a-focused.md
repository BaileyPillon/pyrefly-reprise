Build / artifact / target version: be1e964a (release 27 candidate, D:/pyrefly-rel27, dist-gate bundle index-9QdEMZik.js, candidate artifact b2f7618ec78ea459, 912 files, 0 decode problems) / live d89541b6 (release 26, bundle eoq6aKmL) / targets.json sha256 695d60d1...9a55 (candidate checkout; the main tree's copy hashes 9d08559d... with the same git content, line endings)
Review: focused
Deployment: NOT APPLICABLE. Live verification of the exact artifact is a separate obligation after the deploy.
Changed area: PASS. The FF7 experiment behind the secret door meets D-259 to D-262 in the running game (Film art, party on the left facing right and never mirrored, Spectacle effects, the punchier HUD) with B1, C1, D1, E1, F1 and G1. The board, the main save and the FFX and FFX-2 chapters sampled are unchanged against live.
Ship: SHIP. No critical defect, no regression against release 26. No majors to disclose. Three polish items, one of them carried from live.
Milestone: not assessed
Quality: not scored (focused pass). The last full score is round 03 on 7191674, 2026-09-19 (rubric v1 history).
Targets: required 0 / matched 0 / failing 0 / unverified 0 / waiting 0. No approved tile covers FF7; its choices are decisions D-259 to D-262, checked by their named properties. The Battle HUD FFX and FFX-2 tiles were sampled as regression sentinels, and both are unchanged against live.
Top issues: FOC27-P01 polish (carried): the FF7 pause is a bare frame, with no painting, an empty IN THIS FIGHT column and the boss name shown twice. FOC27-P02 polish (introduced, E1): at 390x844 the boss tail leaves the frame and its barrels touch Cloud's blade, and a blank window sits beside the command window. FOC27-P03 polish: one Bahamut strategy unit test times out under full-suite load (it takes 11.5 s when run alone).
Coverage: Tested: tsc; the full vitest suite in the candidate; the candidate's FF7 e2e spec (5/5) on the production preview; the door from a fresh profile at 2000x1012, plus a near-miss; FF7 at 2000x1012; FF7 pause, loss, exit and a clean board; FFX I, FFX-2 IV and XVI on both candidate and live with stage positions compared; an artifact decode and a file-by-file diff against live; a data audit. Reused: none carried. The unit tests were re-run, and the art identity comes from live's byte-identical manifest. Not tested: listening, a real pad or phone, performance, Safari/Firefox, the other chapters.
Next required review and why: live verification of be1e964a after the deploy (CHK-017), then the deep review owed on the live build (plan depth deep, deepAfterDeploy true, carriedDeep d89541b6).
Elapsed review time / repeated work avoided: about 40 minutes, of which about 12 were uninterrupted playthroughs (the spec's 5.8 minutes plus my own FF7 loss) and 3 were the unit suite. Review overhead was about 25 minutes. Repeated work avoided: I reused the candidate's own real-input spec rather than writing a second FF7 playthrough.

## Plan

`node tools/critic-plan.mjs --json` in D:/pyrefly-rel27 (head be1e964a, previous d89541b6) returned the following:
- depth deep, focusedBeforeDeploy true, **deepBeforeDeploy false**, deepAfterDeploy true, carriedDeep d89541b6
- systems: the FF7 experiment, asset loader, battle presenter, effects/lighting/sprites, and the front-end screens
- games "both", 15 chapters
- checks CHK-002, 003, 006, 008, 009, 012, 013, 015, 016, 017, 018, 019, 020, 021, 022, 023, 025
- targetGroups cast, fight, pause, phone, presentation, scenes
- dataAudit true, approvedArtCheck false

Under the 2026-09-21 rule this is a focused pass now, with the deep review after the deploy.

## Game case (CHK-021)

The case is **FF7 only**, with shared plumbing that is opt-in:
- D-259, D-260, D-261 and D-262 each record "FF7 only". The fight's sources are research/ff7-guard-scorpion.md and research/ff7-battle-staging.md.
- The shared changes (PaintedActor `poseShiftPx`, `erode`, `flashFloorCut`, `lieDown(tilt)`; `FixedCamera.unheld`; `figureLightOf`) all default to the old behaviour. The shader's `erode` is 0 and `flashFloorCut` is 0, so FLASH_FLOOR stays 0.34.

Presence was checked in the FF7 fight. Absence was checked in FFX I, FFX-2 IV and FFX-2 XVI, candidate against live at the first menu:
- Stage positions of every fighter match live to within idle sway (a few px).
- Facings are identical.
- The Ink & Gold HUD is the same.
- The goldens (ff7-golden, ffx2-atb-golden) pass.

## Data audit

Three values changed under `src/data`:
- `sector1-reactor.ts`: the two spriteKeys.
- `guard-scorpion.ts`: the spriteKey and the two form spriteKeys.
- `filmPoseAnchors.ts` (new): measurements of our own paintings, marked "[estimate: measured by anchors.py]", not game data.

No stat, formula, AI or reward number changed, so nothing needed comparing against research.

## Evidence (critic/reviews/be1e964a-focused/)

- `e2e/e2e.log` and `e2e/docs/screenshots/ff7-phase3/*`: the candidate's `tests/e2e/ff7-guard-scorpion.spec.ts`, run unchanged through a scratch config against the dist-gate preview (5 passed, 5.8 min):
  - Win by keys at 1600: Bolt/Defend, the Tail Laser once, Braver Limit, then D1 → C1 → board.
  - Win by taps at 390: E1 framing.
  - Two losses at 1600, then G1 → GAME OVER → RETRY (seed + 1000) → CHAPTER SELECT → board.
  - The pad door.
  - Phone A.
  - Every run asserts that the board snapshot and words are unchanged, that the main save is byte-identical, and that no page error was thrown.
- `door-cand/`, `door-cand-nearmiss/`: from a fresh profile, title → Enter → board → LIMIT opens the fight at 2000x1012. A near-miss "LIMIQ" leaves the board as it was.
  - My first near-miss probe used "LIMIX". The X key is the board's back key, so it returned to the title. That is intended input, not a defect.
- `supp-cand/`, `supp-live/`: the same script on candidate and live:
  - FFX I at 1600, FFX-2 IV at 2000 and FFX-2 XVI at 1600: board → prep → scenes by Enter → first menu → one command → next menu → pause.
  - FF7 at 2000x1012: framing, six real-key turns and five effect frames, with the save untouched.
  - In the FFX-2 runs the "Attack" probe opened CHANGE, which is FFX-2's top row, on both builds. That is a harness miss, recorded as such.
- `ff7exit-cand/`: FF7 Escape → pause → Escape → battle, then a loss by keys → GAME OVER → CHAPTER SELECT. After it the board is clean:
  - swirl flag null, #app transform none, no FF7 nodes
  - same words and snapshot, same save
  - experiments key only
- `ff7exit-live/`: the same pause on live, for FOC27-P01.
- `ch1-live-vs-cand.jpg`, `ch16-live-vs-cand.jpg`, `ff7-live-vs-cand-2000.jpg`: live (left panel, labelled TARGET by the tool) against the candidate (right).
- `Battle-HUD-FFX.jpg`, `Battle-HUD-FFX2.jpg`: the approved tiles against candidate captures.
- `artifact-manifest.json`: 912 files, decode-checked, 0 problems. Compared with `critic/artifacts/d89541b6.json`, only index.html and the js, css and map files differ. Every art and audio file is byte-identical to live.
- `tsc.log` (exit 0) and `vitest.log`: 610 files passed. The one failure is FOC27-P03.

## Checks

| ID | Result | Why |
|---|---|---|
| CHK-002 | PASS | FF7 results, GAME OVER and pause own the window at 1600 and 390 |
| CHK-003 | PASS | The punchier HUD reads at 1600/2000/390; aimed boxes stay in frame and the HUD never scrolls |
| CHK-006 | PASS | The hint block leaves; the swirl, transform and FF7 nodes are all gone after the exit |
| CHK-008 | PASS | Windows are under the floor at 1600/2000 and E1 holds at 390 (polish P02 noted) |
| CHK-009 | PASS | Every name and result line is in full |
| CHK-012 | PASS | All 38 Film files ship and draw; the portraits are paintings |
| CHK-013 | PASS (manual) | The named D-259/D-262 properties hold in game and the boss is opaque through its hits. Taste is Bailey's (B3) |
| CHK-015 | PASS | Keys, taps and an emulated pad; wins, losses, retry, exit and pause |
| CHK-016 | PASS | Screen and state were asserted before every capture; failed waits were recorded, never captured |
| CHK-017 | NOT APPLICABLE | This is the pre-deploy focused pass; the live check comes after the deploy |
| CHK-018 | PASS | The changed sprite keys resolve to shipped folders |
| CHK-019 | PASS | Decode-checked, 0 problems |
| CHK-020 | PASS | The shared plumbing is opt-in, and FFX and FFX-2 staging matches live |
| CHK-021 | PASS | FF7 only: present in FF7, absent in FFX and FFX-2 |
| CHK-022 | PASS | Win, loss, retry and chapter select all reach their real destinations |
| CHK-023 | PASS | The effects and pose keys fire only through real commands |
| CHK-025 | PASS | The board, save and door are as specified; only the experiments key is written |

## Issues

- **FOC27-P01, polish, carried (not introduced, not a regression).** Escape in the FF7 fight opens the shared pause. It has:
  - a black background with no painting
  - an empty "IN THIS FIGHT" column
  - GUARD SCORPION as both the eyebrow and the title
  - an "H PAINTING ONLY" control with no painting behind it

  Live release 26 shows the identical screen. Fix: give FF7 its own plate, or drop the dead control and the empty section.
- **FOC27-P02, polish, introduced with E1.** At 390x844 on the first turn (one seed):
  - the Guard Scorpion's tail tip runs past the right edge
  - its barrels touch Cloud's blade tip
  - an empty blue window sits left of the command window (phone B)

  Fix: pull the phone formation in, or widen the phone camera, and hide the empty window.
- **FOC27-P03, polish (test harness).** The "heal-only route" case in `tests/unit/strategy-ffx2-bahamut.test.ts` hit its 15 s timeout during the full suite. It passes alone in 11.5 s. Fix: give it a longer timeout for the test.

## Server hygiene

I started one server: vite preview of D:/pyrefly-rel27/dist-gate on 127.0.0.1:5470 (PID 58924). I stopped it with `taskkill /PID 58924 /T /F` and confirmed that nothing listens on 5470. I used one headless browser at a time, with PYREFLY_BROWSER=gpu throughout: no black canvas and no fallback.
