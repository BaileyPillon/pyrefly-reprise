Build / artifact / target version: b975397b (release 18 candidate, D:/pyrefly-rel18, bundle index-Dd1Fjf8_.js from dist-gate) / live comparison 1a680e41 (release 17.1, bundle index-BVdUtZb-.js, checked at the live URL) / targets.json sha256 7b9585cb...a59d8 (candidate tree)
Review: focused
Deployment: NOT APPLICABLE (live verification is a separate obligation after the deploy)
Changed area: PASS (chapter select v2 matches option C; the four newly listed chapters play from the title to results and back to the board by real keys; the veil fix holds in both games; no regression)
Ship: SHIP. No critical defect, and no regression against live 1a680e41 in the nine chapters already live. This release discloses one major, FOC18-01: in Chapter XI the Road's 3 s action time means Shiva and Anima no longer punish the wrong line. Chapter XI is new, and the trade-off is Bailey's option A.
Milestone: not assessed
Quality: not scored (focused pass). The last full score is round 03 on 7191674, 2026-09-19, rubric v1 history.
Targets: required 2 / matched 2 / failing 0 / unverified 0 / waiting 0 (chapter select v2 option C at 1600 and 390; Chapter VII still COMING)
Top issues: FOC18-01 major, disclosed, in a new feature (XI: Shiva and Anima links lose their lesson at 3 s). FOC18-02 polish (Mortibody's turn-list chip shows an "M" monogram). FOC18-03 polish (phone board text at 12 px, same on live). FOC18-04 polish (selecting a card nudges the rest of the list 2 px, with no reorder). FOC18-05 suggestion (the board returns on Chapter I after a win). FOC18-06 question (XIV pause copy is inferred).
Coverage: Tested: chapter select at four sizes (fresh and with clears); X, XI, XII and XIV played to a win by real keys; I, III, IV, V, VI, VIII, IX and XIII to a win and II to a loss then RETRY, all on the candidate; tsc; the full unit suite; a sampled data audit. Reused: the builders' human-pace benches and the 1a680e41 results-wedge evidence. Not tested: locked VII's plate and layout, CHK-005, audio and performance, real devices.
Next required review and why: live verification of b975397b after the deploy, then the deep review this shared-system change owes on the live build (plan depth deep, deepAfterDeploy true; 1a680e41's deep obligation is carried)
Elapsed review time / repeated work avoided: about 110 minutes, over the 15-minute budget. The named risks were four new chapters plus a shared FFX CTB engine and presenter change, so every new chapter and every live chapter was played; three harness faults (FFX-2 loop, multi-link wins, Evrae Orders) were fixed and re-run. Repeated work avoided: the 200-seed win-rate benches and the 1a680e41 results and phone evidence were reused.

## Plan

`node tools/critic-plan.mjs --json` in D:/pyrefly-rel18: previousBuild 1a680e41, depth **deep**, `deepBeforeDeploy: false`, `focusedBeforeDeploy: true`, `deepAfterDeploy: true`, carriedDeep [1a680e41]; games both. Systems: FFX CTB engine, FFX-2 ATB engine, both games' data, presenter, chapter registry, cutscene and scene runner, global layout, advisor and intent, screens, strategy guide. Checks CHK-002 to CHK-011, CHK-013, CHK-015 to CHK-017 and CHK-020 to CHK-023. targetGroups chapters, fight, pause, phone, presentation, scenes. `dataAudit: true`, `approvedArtCheck: false`. There is no save-data class and no milestone claim, so the focused pass runs before the deploy.

## Candidate and environment

- `D:/pyrefly-rel18` at b975397be2920702571cac820c69afdff252b891. `dist-gate` already existed, built at 00:34, after the 00:30 commit.
- Served with `vite preview --outDir dist-gate` on 127.0.0.1:5421 (PID 52192). **Stopped by its own PID; port 5421 confirmed closed.**
- Headless Playwright Chromium, `PYREFLY_BROWSER=gpu` (ANGLE D3D11, RTX 5070 Ti). No black canvas and no fallback. One browser at a time.
- `npx tsc --noEmit` is clean. `npx vitest run`: 8012 passed, 13 skipped, 0 failed. `node tools/orphans.mjs`: 24, the same count the builders recorded.
- Scratch drivers are in `tools/zz-foc18.tmp/` (play.mjs, cselect.mjs, cardmove.mjs, pause-probe.mjs, evrae-probe.mjs, textprobe.mjs) with one log per run.

## Game case of each change (CHK-021)

- **Chapter select v2 (option C): both.** It is a shared screen, and both groups were checked.
- **Cutscene veil fix: both** (shared plumbing, CHK-020). Every veiled line in 7 chapters stayed readable: I 6/6, III 5/5, VIII 5/5 and XIV 3/3 in FFX; IV 4/4, V 5/5 and VI 4/4 in FFX-2. `#fade` was never opaque over a line. Natus's 19 veiled pre-scene lines were captured readable before the probe was corrected.
- **X Natus, XII Omnis, XIV Isaaru: FFX only.** Present: CTB turn list, FFX menus, sphere levels on results. Absent: no ATB gauge or dressphere UI.
- **XI Fallen Aeons: FFX-2 only.** Present: ATB, dresspheres, EXP and per-dressphere AP. The action-time switch is on for the Road formations and Chapter XIII only (`ACTION_TIME_ALL_FFX2` false). IV, V and VI still play at their normal pace.
- **The briefing counts the listed chapters: both.** It reads "Thirteen fights" on the candidate and "Nine fights" live.

## What was played (real keys, taps or clicks; debug use labelled)

1. **Chapter select v2** at 1280x720, 1600x900, 2000x1012 and 390x844, fresh and with five clears:
   - The order is I II III VII-COMING VIII IX X XII XIV, then IV V VI XI XIII.
   - Arrows walk the list in number order, and up and down switch groups.
   - Clicking or tapping VII does nothing.
   - Each of the 13 playable cards, clicked or tapped twice, starts that chapter: 13/13 at every size.
   - The plate click and Enter begin; Esc goes back to the title.
   - Beaten cards carry a ribbon with the best time, the plate gets the VICTORY sash, and the strip reads "5 OF 13 BEATEN".
   - There are no silhouettes, masks or pause plates. Every boss face sits inside its card art. No horizontal scroll, no clipped names.
2. **X Natus** at 1600x900:
   - Real keys from the title through prep and the 32-line pre scene.
   - Esc pause and resume.
   - 25 intended turns (Talk, Auron in, Ixion, Hi-Potion), then a labelled 1-HP finish.
   - Post scene, results (6,300 AP), then the board with X [cleared].
3. **XI Fallen Aeons** at 2000x1012:
   - Real keys and Esc pause.
   - Shiva, the Sisters and Anima chained in one battle, with a labelled 1-HP finish after turn 4.
   - Post scene, results (EXP 5,478, Tetra Band), then the board with XI [cleared].
   - An earlier harness mishap also showed Defeat, then RETRY, resuming at the Sisters link.
4. **XII Omnis** at 390x844:
   - Real keys on the phone HUD, with the disc strip and intent line live.
   - Esc pause.
   - 25 intended turns, then a labelled finish.
   - Post scene, results (24,000 AP, Lv. 3 Key Sphere), then the board.
5. **XIV Isaaru** at 1600x900:
   - Grand Summon, Valefor, and Bahamut's Mega Flare across the Grothia, Pterya and Spathi links, with a labelled finish on Spathi.
   - The post lines under the veil were readable, and results showed 5,000 AP.
   - Esc opened the pause at Yuna's menu and at an aeon's menu, 3 of 3 times.
6. **Chapters already live, on the candidate:**
   - Wins: I (1600, the full 45-line epilogue), III (1600), IV (1600), V (2000, every Vegnagun part and Shuyin), VI (390), VIII (390), IX (1600) and XIII (1600).
   - Loss: II (2000). A forced attack-only line ended in Yunalesca's canonical wipe, then Defeat, RETRY and prep.
   - VIII's Orders → Pull back was proved by real keys at 1600: two Enters issue the order.
   - Esc pause worked in every chapter.
7. **Live 1a680e41:** chapter select v1 and Chapter I to its first menu, plus the text-size probe. 0 errors.

Every run on both builds had 0 console errors, 0 HTTP errors and 0 non-image asset responses.

## Target comparisons

- `tile-chapter-select-v2-ch8-cleared-1600.jpg` compares the option C target (D-183) with the candidate at five clears and VIII selected. They match: boss on scene, fixed list, VII in number order, ribbon, sash and strip. The only deviations are the ones already recorded (the sash sits top-left, the best time moved onto the ribbon).
- `tile-chapter-select-v2-ch1-open-390.jpg`: the phone column matches. The new X, XII, XIV and XI cards take their places in number order, and the wording is for touch.
- Chapter VII tile: still the COMING card; it cannot be selected or started.

## Data audit (dataAudit true, sampled)

These values match their research sources:

- **Omnis** (ffx-seymour-omnis.md §1.1, O-1): 80,000 HP, Def 180, MDef 100, Mag 35, Agi 40.
- **Isaaru's side** (ffx-isaaru-bevelle.md §2.1, §2.2, §11 I-1): Isaaru 10 HP; Grothia, Pterya and Spathi 8,000 / 12,000 / 20,000; 5,000 duel AP.
- **Fallen Aeons** (ffx2-fallen-aeons.md): Shiva 14,800 HP with Agi 119 (conflict F-3, the ranked source); Anima 36,000.
- **Natus guide**: "Haste Tidus and Auron, never a third" matches strategy 7, which has three sources.
- **Unsourced value**: `ROAD_ACTION_TIME_SECONDS = 3` is labelled `[estimate]`, Bailey's pick (§12.4).
- **Omnis disc order**: shown to the player as "Colour order: our estimate".

## Issues

- **FOC18-01 major** (FFX-2, Chapter XI). The builders measured the wrong line doing as well as the intended one on Shiva and Anima (40/40 vs 40/40) with option A on. This review did not re-measure it.
  - Tags: introducedByCandidate true, regressionVsLive false, **inNewFeature true**. Disclosed; it does not hold the build.
  - Fix: ask Bailey whether to keep option A, or take action time off those two links only. The switch is per formation.
- **FOC18-02 polish** (FFX, Chapter X). Mortibody's turn-list chip shows a faint "M" monogram through the painting; Mortiorchis in Chapter I shows art only. No `portraits/mortibody.png` ships. New feature.
- **FOC18-03 polish** (both). On the phone board, five text runs render at 12 px, under the 14 px floor. Live measures the same 12 px. introducedByCandidate false, regressionVsLive false.
- **FOC18-04 polish** (both). Selecting a card grows it by 2 px, so the cards below move 2 px; the old selection slides back 9 to 10 px. There is no reorder, and 13/13 clicks began the chapter clicked, so this is not the "list that shifts" Bailey disliked, only a small nudge.
- **FOC18-05 suggestion.** After a win the board comes back on Chapter I, not the chapter just beaten. The logic is the same on live.
- **FOC18-06 question for Bailey.** The trimmed Chapter XIV pause-card copy is an agent's inference (D-186).

**Carried and not re-tested:** FOC17b-01 (the empty wedge on a Trema loss) and FOC17b-02 (the ivory strip at 2000 wide) from the 1a680e41 pass.

## Harness notes (not product defects)

Each of these was fixed in the harness and re-run. None counts against the build.

- **XI first run:** it used the FFX menu driver (`hud.commandMenu`) and idled. The FFX-2 loop now walks `.ig-cmd-stack`.
- **XIV first run:** the FFX loop stopped on a link's interim victory (`nextGroupId`).
- **VIII Orders:** the driver pressed Enter only once on Orders; two Enters issue the order.
- **Chapter II:** the finish (forced attacks) ran into Yunalesca's canonical wipe.
