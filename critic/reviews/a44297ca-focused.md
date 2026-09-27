Build / artifact / target version: a44297ca (release 22 candidate, D:/pyrefly-rel22, dist-gate bundle index-DLvZcIgF.js, candidate artifactHash 29ac7257...ceac before deploy additions) / previous live d8837334 (release 21, bundle DlL4YDmM) / targets.json sha256 77707685...8967
Review: focused
Deployment: NOT APPLICABLE. Live verification of the exact artifact is a separate obligation after the deploy.
Changed area: FAIL. Most of the changed area meets its target and nothing regressed, but two majors stand: FOC22-01 (FF7 concept art ships in the artifact, introduced) and FOC22-02 (Chapter XI advisor names Remedy for an Itchy girl, carried from live). The three builder-disclosed majors also stand.
Ship: SHIP. There is no critical defect and no regression against release 21. Chapter V is won by real keys on Wait, which is better than live. This release discloses FOC22-01 (FF7 concept files ship, unreferenced), FOC22-02 (XI advisor vs Itchy, not introduced), FOC22-07 (A-8 shadows short on 5 of 43 figures), FOC22-08 (PR-0094 Vegnagun head reading) and FOC22-09 (D-224 lighting subtle).
Milestone: not assessed
Quality: not scored (focused pass). The last full score is round 03 on 7191674, 2026-09-19 (rubric v1 history).
Targets: required 10 / matched 7 / failing 0 / unverified 3 / waiting 0
Top issues: FOC22-01 major, introduced: 10 ff7-* art files ship and are listed in art/manifest.json. The fix is a dist-filter rule. FOC22-02 major, carried: the XI advisor recommends Remedy while the menu offers only CHANGE (Itchy); the route stalled 314 decisions. The fix is an Itchy rule in the advisor. FOC22-03, -04, -05 and -06 are polish.
Coverage: Tested: 12 real-key routes on the production candidate plus 1 on live, a line-card probe, tsc, 45 changed-area test files, the artifact diff and decode check, approved hashes, a data audit of every changed value, and 8 target composites. Reused: the builder's line-card torso measure, the engine byte-identity bench, the D-217 retry frames and the t1-b2a HUD frames. Not tested: D-233 and A-5 frames, the D-217 retry by my own input, III and XI to their outcome, audio listening, performance and devices.
Next required review and why: live verification of a44297ca after the deploy (CHK-017), then the deep review owed on the live build (plan depth deep, deepAfterDeploy true, carriedDeep d8837334).
Elapsed review time / repeated work avoided: about 120 minutes. About 80 of those were uninterrupted real-key playthroughs; review overhead was about 40 minutes, over the 15-minute budget because of the named shared FFX-2 engine and presenter risk. Repeated work avoided: the 200-seed benches and the full suite were not re-run.

## Plan

In D:/pyrefly-rel22, `node tools/critic-plan.mjs --json` gave:
- depth **deep**, `deepBeforeDeploy: false`, `focusedBeforeDeploy: true`, `deepAfterDeploy: true`, obligations live / focused / deep, carriedDeep [d8837334];
- games: both; 14 chapters;
- checks: CHK-001, 002, 003, 004, 006 to 010, 012, 013, 015 to 023, and B1;
- targetGroups: audio, cast, fight, pause, phone, presentation, scenes;
- `dataAudit: true`, `approvedArtCheck: false` (verify-approved was run anyway).

There is no save-data class and no milestone claim, so the focused pass runs.

## Candidate and environment

- D:/pyrefly-rel22 is at a44297cae605 (clean apart from docs/deploys.log and the untracked dist-gate). Its `dist-gate` was built at 07:26, after the 07:22 commit, so it was reused.
- It was served by `node node_modules/vite/bin/vite.js preview --outDir dist-gate` on 127.0.0.1:5422 (PID 59016). **The server was stopped by that PID with taskkill /PID 59016 /T /F, and port 5422 was confirmed closed.**
- Browser: headless Playwright Chromium, `PYREFLY_BROWSER=gpu`. There was no black canvas and no fallback. One browser ran at a time, serially.
- Drivers: `critic/runner/lib/route.mjs` from the candidate tree, and the line-card probe `tools/zz-foc22.tmp/lc.mjs` in the main tree (scratch, so the candidate tree stays clean).
- Evidence is under `critic/reviews/a44297ca-focused/`. The first XI run at 1600x900 was overwritten by the 2000x1012 run (same folder name); its numbers are quoted below from the run as it finished.

## Game case of each change (CHK-021)

The written cases are in docs/handoff/iter2-b1.md, iter2-b3.md, iter2-b4.md, t1-b2a.md, t1-b4b.md and the commit subjects. What was checked in the build:

- **FFX-2 only: chained spoils summed (PR-0138).** The real-key V win shows EXP 42,400 x3, AP 120, gil 18,300 and the item list. Absent from FFX: the change lives in battle/ffx2 and BattleChainSpoils, which FFX chains do not use.
- **FFX-2 only: Shuyin checkpoint (D-217, adaptation, adopted).** `checkpointOnEntry: true` sits on shuyinGroup only; it is live, not behind a switch, and Bailey adopted it. It was not exercised here because the V run never lost to Shuyin.
- **FFX only: fielded-only stand-ins (PR-0037).** In VIII, Wakka spoke Auron's line because Auron was not fielded. In V (FFX-2), the Auron and Jecht voices stay voices, as intended.
- **FFX only: Talk in X (PR-0204).** All three exchanges fired from real Enter presses, with the Natus portrait.
- **FFX only: plate faces, the Overdrive plate, aeon CTB portraits, the Zanmato hold (t1-b2a).** The code sits under src/ui/ffx only. The III target frame shows the plate clear of the faces.
- **Both: line card (D-232).** Seen in III (FFX) and V (FFX-2).
- **Both: results caption and gutter, coach, board focus, dist filter.** Exercised in both games.

## Results

### Real-key routes (seed 1, advisor followed by keys)

| Chapter | Size | Outcome | Minutes | Destination |
|---|---|---|---|---|
| IV Bahamut | 1600x900 | victory, 47 turns (same as release 20) | 6.2 | results, CONFIRM, scene, board on IV, clear kept after reload |
| IV Bahamut | 2000x1012 | victory | 7.2 | results (PR-0120 gutter checked) |
| III Braska's Final Aeon | 2000x1012 | undecided at the 15-minute budget, 208 turns, phase 2 reached | 16.4 | budget cut. History: real-key III wins take 18 to 25 min (release 19: 1090 s) |
| V Vegnagun / Shuyin | 1600x900 | **victory**, 167 turns, 4 seams | 22.4 | results with summed spoils, board on V, clear kept after reload |
| X Seymour Natus | 1600x900 | victory, 45 turns | 3.9 | results. Talk x3 lines fired |
| VIII Evrae | 1600x900 | victory, 60 turns | 4.6 | results. Wakka stand-in line |
| XI Fallen Aeons | 1600x900 | undecided at 15 min: link 1 won, link 2 at Mindy 4,953 HP | 15.8 | budget cut |
| XI Fallen Aeons | 2000x1012 | undecided at 25 min: link 3 Anima at 13,900 / 36,000, stalled on FOC22-02 | 23.3 | the route stalled on the advisor, not on the game |
| VI Leblanc (lose) | 1600x900 | defeat | 2.6 | results, RETRY, prep, battle |
| I Seymour Flux | 1600x900 | defeat, 23 turns (release 20: defeat, 24 turns, same route) | 3.5 | results, RETRY, battle |
| I Seymour Flux, touch | 390x844 | defeat, 5 turns | 1.8 | results, RETRY, battle. **The same on live**: FOC22-04 |

All 13 routes had 0 console errors, 0 responses with status >= 400 and 0 image responses typed text/html. `route-index` read 279 captures: 0 unverified, 0 mismatches.

### Line card (D-232), probe in III at 1600x900

The setup was debug `gotoChapter` with the intended auto strategy (labelled). Four lines were read back once settled: `dbox--card`, place top-left, 32,105 at 600x127, opacity 1. The card is clear of all three party members, of Braska's Final Aeon (the speaker) and of both Pagodas. It covers the strategy-guide panel, whose MORE row peeks out below it (FOC22-05, polish). Frame: `linecard/lc-braskas-final-aeon-1600x900-4.jpg`.

### Artifact against live (manifest diff, decode check)

- **Added (10):** the FF7 art `art/backdrops/ff7-sector1-reactor.{png,json}` and `art/characters/ff7-{barret,cloud,guard-scorpion,guard-scorpion-tail-up}/idle.{png,json}`, plus the new bundle. `art/manifest.json` lists all five subjects. No code loads them. This is **FOC22-01**.
- **Removed (295):** the 52 audio/candidates files, and every `*.raw.png` and numbered `*.N.png|json` (PR-0100/0173 working as intended). `.nojekyll` is also missing, because the deploy adds it.
- **Changed:** art/manifest.json and index.html only. No shipped audio changed.
- **Decode check:** 849 files, decodeChecked true, 0 problems.

### Data audit (dataAudit true)

- **Rikku S.Lv 53 -> 41 (Fahrenheit, PR-0174):** marked `[estimate]`. It sits between macalania.ts (40) and gagazet.ts (42), and research/ffx-seymour-anima-macalania.md:666 supports the +25 offset note. Display only.
- **Gagazet aeons and inventory moved to gagazet-kit.ts:** all 32 values are identical to the old gagazet.ts. The aeon arms default to `'shipped'` (OFF), so highbridge.ts and via-purifico.ts are unchanged in effect.
- **`opensAsSeparateBattle`:** set on Leblanc Acts II/III and the last room, but read only when `SEPARATE_BATTLE_GAUGES` (false) is on, so it is OFF. The source is research/ffx2-combat-core.md 1.6 `[single source]`.
- **Acta Est Fabula `namedTargetsOnly`:** matches research/ffx2-vegnagun-shuyin.md 3.4 ("both Redoubts") and the engine's own row.
- **Shuyin `checkpointOnEntry`:** decision D-217, adopted, labelled an adaptation (no source claimed).

### Checks

- CHK-001: PASS
- CHK-002: NOT APPLICABLE (pause untouched)
- CHK-003: FAIL, pre-existing (the advisor label is 12.2 px, as on release 20)
- CHK-004: FAIL (FOC22-02)
- CHK-006: PASS
- CHK-007: PASS
- CHK-008: PASS (partial; the builder's measure was reused)
- CHK-009: PASS
- CHK-010: PASS
- CHK-012: PASS
- CHK-013: UNVERIFIED (no particle frames)
- CHK-015: PASS
- CHK-016: PASS
- CHK-017: NOT APPLICABLE
- CHK-018: PASS
- CHK-019: PASS
- CHK-020: PASS
- CHK-021: PASS
- CHK-022: PASS for the outcomes reached; III and XI were cut by the budget
- CHK-023: PASS
- B1: NOT APPLICABLE

The details are in the JSON.

### Targets (composites in this folder)

- **Matched:**
  - Title (A-16: a painted first frame);
  - Battle HUD FFX;
  - Battle HUD FFX-2 (unchanged);
  - Results at 1600x900, and at 2000x1012 with the gutter inked to the edge;
  - Onboarding C3;
  - Vegnagun staging A;
  - PR-0001 phone results (defeat, option B).
- **Unverified:**
  - FFX-2 Vegnagun-part targeting (no cursor captured);
  - D-233 specials (no frame);
  - Onboarding C2 (no composite read).

## Issues (most severe first)

- **FOC22-01, major.** Introduced true, regression false, not a new feature. The FF7 concept art ships in the release artifact: 10 files, listed in art/manifest.json, loaded by nothing. They came from public/art, written 2026-09-27 04:19. Fix: an `art/**/ff7-*` rule in tools/dist-filter.mjs. Acceptance: 0 ff7 paths in the artifact manifest.
- **FOC22-02, major.** Introduced false, regression false. XI link 3: after Pain puts Itchy on Yuna, her menu offers only CHANGE (canon, research/ffx2-combat-core.md, verified 2 sources). The advisor still names Remedy in Item, 314 times in a row. The advisor, Itchy and the Anima data are unchanged from live. Fix: an Itchy rule in the advisor.
- **FOC22-07 / 08 / 09, major.** These are the builder's own disclosures, carried: A-8 shadows short on 5 of 43 figures, the PR-0094 head reading, and D-224 looking subtle. D-224 is new work that ships on; it is not a regression.
- **FOC22-03, polish.** The advisor label is 12.2 px, under the 14 px floor. Pre-existing.
- **FOC22-04, polish, low confidence.** On the phone, the touch route cannot reach Poison Fang in the Items list and falls back to Attack. It is identical on live. The suspected cause is the harness (the touch chooser does not scroll).
- **FOC22-05, polish.** The line card sits on the guide panel, and the MORE row shows under it.
- **FOC22-06, polish.** A mid-battle line with no auto timer stays up for minutes (212 s, 135 s). Round 14 recorded the same on live.

No regression was found against release 21.
