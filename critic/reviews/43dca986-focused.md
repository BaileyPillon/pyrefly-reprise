Build / artifact / target version: 43dca986 (release 19 candidate, D:/pyrefly-rel19, bundle index-D56B92vC.js from dist-gate) / live comparison b975397b (release 18, bundle Dd1Fjf8_) / targets.json sha256 7b9585cb...a59d8
Review: focused
Deployment: NOT APPLICABLE (live verification is a separate obligation after the deploy)
Changed area: PASS (Chapter XV plays and wins by real keys at 1600x900 and 390x844 with Bailey's pick in place; Chapter III now wins by real keys following the advisor; each round-13 fix meets its acceptance check; no regression)
Ship: SHIP. No critical defect and no regression against live b975397b. This release discloses three majors, none introduced by it: FOC19-01 (IC-1, the FFX-2 sole-survivor chain lock), FOC19-02 (IC-2, the FFX-2 all-target wrap), FOC19-03 (PR-0126 phone half: the phone tip names no menu).
Milestone: not assessed
Quality: not scored (focused pass). The last full score is round 03 on 7191674, 2026-09-19, rubric v1 history.
Targets: required 1 / matched 1 / failing 0 / unverified 0 / waiting 0 (chapter select v2 option C, now with 15 cards)
Top issues: FOC19-01 and FOC19-02 major, disclosed (shared FFX-2 engine, D-191, on their own branch). FOC19-03 major, carried (phone tip). FOC19-04 polish or question (Den results show only Nooj's rewards). FOC19-05 polish (ALL ALLIES label over the intent panel in the Den). FOC19-06 polish (XV card: BOSS says Baralai only; card and prep copy differ).
Coverage: Tested: XV at 1600x900 and 390x844 to a win; III to a win following the advisor; I, V, XI and XIV by the advisor; II, IV, VI, IX, X, XII and XIII by the release-18 regression driver; the six fixes' acceptance checks; FFX-2 all-allies targeting on the candidate and live; a data audit of every Den value. Reused: the Den 200-seed bench and IC-1 / IC-2 (D-191), and the cutter's full suite. Not tested: audio, performance, real devices, the XV loss at 1600, VIII past its first menu (a harness fault).
Next required review and why: live verification of 43dca986 after the deploy, then the deep review this shared-system change owes on the live build (plan depth deep, deepAfterDeploy true; b975397b's deep obligation is carried)
Elapsed review time / repeated work avoided: about 190 minutes, well over the 15-minute budget. The named risks: a new chapter, shared FFX and FFX-2 engine and intent changes, and CHK-022 on Chapter III, which needs one 19-minute real-key fight. A harness fault cost one extra Chapter III run: the old driver could not steer to Yu Pagoda A or B. Repeated work avoided: the 200-seed Den bench and the full unit suite were reused.

## Plan

`node tools/critic-plan.mjs --json` in D:/pyrefly-rel19 gave:

- previousBuild b975397b, head 43dca986, depth **deep**.
- `deepBeforeDeploy: false`, `focusedBeforeDeploy: true`, `deepAfterDeploy: true`, carriedDeep [b975397b].
- Games: both. Checks: CHK-002 to CHK-011, CHK-013, CHK-015 to CHK-017, CHK-020 to CHK-023.
- targetGroups: chapters, fight, pause, phone, presentation, scenes.
- `dataAudit: true`, `approvedArtCheck: false`. The cutter's verify-approved run read 232 ok, 0 mismatched, 0 missing.

There is no save-data class and no milestone claim, so the focused pass runs before the deploy.

## Candidate and environment

- The candidate is D:/pyrefly-rel19 at 43dca9860791b44d3887ab7ac04c4dc95f89502b, with the cutter's `dist-gate`.
- It was served with `vite preview --outDir dist-gate` on 127.0.0.1:5431 (PID 4644). **The server was stopped by its own PID, and port 5431 was confirmed closed.**
- Browser: headless Playwright Chromium, `PYREFLY_BROWSER=gpu`. No black canvas, no fallback.
- The drivers are in `tools/zz-foc19.tmp/`:
  - `route.mjs`: the round-13 advisor-following route, with one fix: it steers the cursor by the visible name plate.
  - `play.mjs`: the release-18 regression driver.
  - `probe.mjs`: the prep tab and the Pray target.
- Evidence is under `critic/reviews/43dca986-focused/`.
- **Process note.** A lane I stopped left an orphaned duplicate. For about 40 minutes it ran routes alongside the planned lane, so two browsers ran at once. It was killed by PID, and its overlapping outputs were redone serially. The Chapter III win and the phone Den win ran in their own pages, so their keyboard input is valid.

## Game case of each change (CHK-021)

- **Chapter XV, the Den of Woe: FFX-2 only** (research/ffx2-gippal-den-of-woe.md). It is listed in the X-2 group after XIII and has ATB, dresspheres, chain and FFX-2 results. It is absent from the FFX group.
- **PR-0198 and PR-0208: FFX only.** `letterTags.ts` sits under src/battle/ffx, and the FFX-2 HUD names its own rows. The lettered Yu Pagoda A/B was seen in III.
- **PR-0153: both.** Random-target rows appear in I (FFX, Lance of Atrophy) and in XV and XI (FFX-2: "random: YUNA / RIKKU / PAINE").
- **PR-0123: both for the badge, FFX-2 only for the cast** (Shuyin).
- **PR-0207 and PR-0126: both.**

## What was played (real keys)

1. **Chapter XV, 1600x900: won first try, 56 commands, 8.9 minutes, following the advisor.**
   - Prep shows Yuna LV 54, Rikku LV 56 and Paine LV 58. The ITEMS tab reads Hero Drink x3.
   - Links: Baralai, then Gippal, then Nooj.
   - In Nooj's link the card reads "Hero Drink -> Yuna, in Item". The keys submitted it: Hero Drink at seq 1150, Invincible at seq 1175, Lightfall at seq 1251.
   - Then the post scene, results (Victory, 7:54), and the board with XV cleared, which survives a reload.
2. **Chapter XV, 390x844: won first try (43 commands).**
   - Paine and Rikku drink Hero Drinks before Lightfall.
   - An earlier overlapping phone run lost, took RETRY back into the fight, and won on its second try (the a2-* files).
3. **Chapter III, seed 1, 1600x900: won, following the card on every one of 190 commands.**
   - 0 misses, 187 of 187 targets steered to the named plate, all 7 links, the post scene, results and the board ribbon (III cleared; the strip reads 1 OF 14 BEATEN). The clear survives a reload.
   - The card letters its target ("Slow -> Yu Pagoda A" and "Yu Pagoda B"). Slow A hit yu-pagoda-left and Slow B hit yu-pagoda-right.
   - No advisor-named item KO'd its own user. Every KO came from a boss action.
4. **Chapter I, 2000x1012, unpinned (seed 1): won.**
   - The first menu's intent lists TIDUS 707-799, YUNA 746-842 and KIMAHRI 698-788 under DAMAGE · RANDOM TARGET (PR-0153).
   - With `setSeed(1)` pinned before the first key, it lost in 24 commands. **The same pinned run on the live site lost identically, action for action**, so this is not a regression: the debug seed takes a different RNG stream.
5. **Chapter V, seed 1, 2000x1012: won (171 commands).** At link 5 the headline reads "Terror of Zanarkand SCRIPTED" and the guide reads "WATCH Terror of Zanarkand THIS TURN" (PR-0123).
6. **Chapter XI, 390x844: won.** The phone intent carries its certainty token on 66 of 66 turns ("Blizzaga POSSIBLE 25%"), and on every Den turn ("SCRIPTED") (PR-0207). At 1600x900 the advisor-only run (no harness spherechange) lost at link 2. That is one run of a chapter without a 100 percent line, so it is not a defect claim.
7. **Regression driver** (release-18 play.mjs, same seeds and settings as release 18):
   - IV, VI, IX, X, XII and XIII reached the board.
   - II ended in the same forced loss as on release 18.
   - VIII stopped at the Orders widget, the same harness fault as release 18.
   - XIV was won with the advisor route instead.
8. **CHK-010, Pray by real keys:**
   - The target state shows TARGET All allies, the ALL ALLIES label, brackets on all three girls, green rows and ENTER CONFIRM / ESC BACK. On the phone it shows BACK / PRAY -> ALL ALLIES.
   - It holds 2.4 s with no input, and Esc backs out.
   - It is the same on live Chapter V.
   - Earlier probe runs where the state seemed gone were a harness timing artefact, disproved by the 100 ms watch (probe-w-*).

## Fixed issues, acceptance

| Issue | Result | Evidence |
|---|---|---|
| PR-0198 | PASS: the unit board passes (Ether or cure, never the Elixir); no own-user KO from an advisor item in III or I | tests/unit/advisor-zombie-heal.test.ts; braskas-final-aeon-win-s1/battle-log.json |
| PR-0208 | PASS: the card and the plate letter the Pagoda; the route follows it; Chapter III is won | braskas-final-aeon-win-s1/run.json, 34-board-after.png |
| PR-0153 | PASS: Lance of Atrophy lists all three members | seymour-flux-win-s1/12-intent-E.png |
| PR-0123 | PASS: the headline names the committed cast; the guide agrees | ffx2-vegnagun-shuyin-win-s1/24-seam-5-first-menu.png |
| PR-0207 | PASS: the phone token is present on every sampled turn in XI and XV | ffx2-fallen-aeons-win-phone/23-midfight.png |
| PR-0126 (desktop half) | PASS: 0 of 316 desktop submenu cards lack "in <menu>"; the phone half stays open (FOC19-03) | run.json cards |

## Data audit

Every Den value touched was checked against research/ffx2-gippal-den-of-woe.md, and all match. The [estimate] items are labelled:

- HP, MP, STR / MAG / DEF / MDEF, AGI / EVA / LUCK / ACC and levels for the three shades.
- Gravity and the extra immunities.
- Grinder DC 14, Bullseye 9/16, Mortar DC 22, Glint DC 20, Drill Shot 3/4, Absorb 3/16, Lightfall 5,000.
- The three Lore steals.
- The estimates: the 3 Hero Drinks, the 8 levels, and the status durations.

## Issues

- **FOC19-01 major, disclosed** (introducedByCandidate false, regressionVsLive false): IC-1, the FFX-2 sole-survivor chain lock (D-191).
- **FOC19-02 major, disclosed** (false / false): IC-2, the FFX-2 all-target wrap (D-191).
- **FOC19-03 major, carried** (false / false): the PR-0126 phone half. The tip reads "TIP Protect -> the party" with no menu.
- **FOC19-04 polish or question** (new feature): XV results count only Nooj's EXP, AP, gil and drop. Whether a chain sums its links is unsourced.
- **FOC19-05 polish** (new feature): in the Den at 1600x900 the ALL ALLIES label overlaps the intent panel.
- **FOC19-06 polish** (new feature): the XV card's BOSS says "Baralai" only, and the card premise differs from the prep premise.

No regressions.
