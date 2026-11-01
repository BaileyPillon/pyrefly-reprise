# Round 32: deep review of releases 69 and 70, live build e3f51bf18 (bundle UNVtEttT)

```text
Build / artifact / target version: main e3f51bf18, bundle index-UNVtEttT.js, artifact 5720fa8287425ebb..., targets.json sha256 1b09ad4e5a0315f4...
Review: deep (releases 69 and 70, owed since round 31 / release 68, 2a9340249)
Deployment: PASS (exact live artifact; 7,169 files compared at deploy; 0 console errors in every run)
Changed area: FAIL (CHK-026 and CHK-027 FAIL, two major regressions inside the release-70 booth treatment)
Ship: SHIP, by the rule that a defect inside a brand-new feature does not block (see below); majors disclosed: PR-0581, PR-0582, PR-0531, PR-0380, PR-0379, PR-0148, PR-0567, PR-0295
Milestone: not assessed (a deep review cannot accept one)
Quality: PROVISIONAL, no verified score for narrative, audio, interface, onboarding, prep, delivery; last full score is in round 30b / 31 history
Targets: 18 required / 15 matched / 0 failing / 3 unverified / 2 waiting on decision
Top issues: PR-0581 Braska Tidus teleports 302-417 px; PR-0582 Ixion KO slide 80-91 px; PR-0531 pose-swap size continuity (13 of 19); PR-0380 jerks (8 of 19); PR-0379 see-through frames; PR-0148 no listening verdict; PR-0567 phone load unmeasured
Coverage: 19 of 19 chapters by real keys (capture owner and harness), 16 engine probes, 28,004 unit tests, gap pass; not tested: later-link retry, phone cold load, treated-chapter loudness, six-size matrix; see below
Next required review and why: after any change to the booth holds, the harness on Chapters III, VII and XIV; plus the six UNVERIFIED categories
Elapsed review time / repeated work avoided: chief 40 min; lanes ran separately (harness about 177 min); no evidence reused for any PASS
```

## Score output (verbatim from tools/critic-score.mjs)
```text
score: PROVISIONAL — no verified score for narrative, audio, interface, onboarding, prep, delivery (never averaged away, never zero)
below the 9 floor: visual, feel
milestone: not accepted
  - a deep review cannot accept a milestone
  - score is provisional: no verified score for narrative, audio, interface, onboarding, prep, delivery
  - category visual is below the 9 floor
  - category feel is below the 9 floor
  - mandatory check CHK-001 is UNVERIFIED
  - mandatory check CHK-002 is UNVERIFIED
  - mandatory check CHK-003 is UNVERIFIED
  - mandatory check CHK-006 is UNVERIFIED
  - mandatory check CHK-009 is FAIL
  - mandatory check CHK-018 is UNVERIFIED
  - mandatory check CHK-019 is UNVERIFIED
  - mandatory check CHK-020 is UNVERIFIED
  - mandatory check CHK-022 is UNVERIFIED
  - mandatory check CHK-026 is FAIL
  - mandatory check CHK-027 is FAIL
  - mandatory check CHK-B1 is UNVERIFIED
  - 11 critical or major issue(s) remain open
  - 3 required target(s) unverified
  - 2 required target(s) waiting
  - only 15 of 18 required targets matched
  - human judgment not recorded: Audio: Bailey's numeric listening score for the shipped mix: music, sound effects, voice and the conference sound pass (CHK-B1, PR-0148)
  - human judgment not recorded: Art and feel: the still beside Chapter I of the treated arenas' grade (booth-ffx-b3b J6, PR-0585), and whether the release-70 Braska and Isaaru holds stay on while PR-0581 and PR-0582 are open
  - human judgment not recorded: Feel: are the planned smear hard cuts (22.5 a minute), the pro camera shots and the big turn cut-in the look he wants (PR-0530, PR-0521, PR-0536; CHK-B2)
  - human judgment not recorded: Feel: is Yuna's dress change a hard swap under a flash, or should it blend (PR-0589)
  - human judgment not recorded: Art: should the Rikku Dark Knight and Paine Warrior ready and attack poses be repainted or only registered (PR-0517)
  - human judgment not recorded: Audio: keep or change the silent Chapter IV results screen (PR-0504)
  - human judgment not recorded: Audio: the sound pass in the ten treated chapters, by ear (PR-0588)
  - human judgment not recorded: Interface: is the one-row advisor chip the F1 target, or should the reason line return (PR-0519)
  - human judgment not recorded: Narrative: portrait expression on grief lines in both games (PR-0485)
  - human judgment not recorded: Accessibility: do COLOUR VISION, TEXT SIZE, REDUCE FLASHES and REDUCE MOTION do what he wants (PR-0503, PR-0559)
report: valid evidence
```

## Ship verdict, in the chief's words
- No critical defect found: 19 of 19 chapters won by real keys (Yunalesca needed a second seed, Mirror Aeons a longer budget), 0 console errors, 0 404s, the engine probes md5-identical to round 31, 28,004 unit tests with 0 failures, the once-seen renderer crash 0 of 24 in later runs.
- Two major regressions against release 68 (PR-0581 Braska, PR-0582 Ixion KO slide) are both inside the release-70 booth treatment, a feature that did not exist at release 68 and can be switched off per chapter; by RUBRIC section 3 a defect inside a brand-new feature does not hold the build. They are disclosed and carried into the next batch, and the chief asks that release 71 not widen the behaviour that causes them.
- CHK-026 (13 of 19 chapters) and CHK-027 (8 of 19) fail and are carried: swap jerks 66 to 34 and see-through time 1,689 to 1,623 ms a minute are better than round 31, snaps 0.00 a minute, so the build is better than release 68 on the carried defects and worse in Braska, Anima and Isaaru.
- Six categories stay UNVERIFIED for want of intact auditor results, so no milestone claim is made (milestone not assessed).

SHIP by the rules: PR-0581 and PR-0582 are majors that are regressions against release 68, but both sit inside the release-70 booth treatment of Chapters III, VII and XIV, a feature that did not exist at release 68 and can be switched off per chapter (src/engine/motion/PieceHolds.ts; ?treated=pack is clean), and the rule says a defect inside a brand-new feature does not block. This is a judgment about the ruling, not about the defect: the chief recommends release 71 (booth batch 4) not carry the ProneLay or return-flip behaviour into more chapters until PR-0581 and PR-0582 pass the harness.

## Evidence gap this round
Six categories (narrative, audio, interface, onboarding, prep, delivery) are UNVERIFIED because their auditor results reached the chief truncated, with no category score and no complete issue list (the brief showed 28 of 49 issues). The 21 issues the chief could not see are not invented; the carried round-31 list is kept as carried so nothing known is dropped.

## The ten categories
| Category | Score | Status |
|---|---|---|
| combat | 9.4 | scored |
| encounter | 9.2 | scored |
| visual | 8.3 | scored |
| feel | 7.8 | scored |
| narrative | no number | UNVERIFIED |
| audio | no number | UNVERIFIED |
| interface | no number | UNVERIFIED |
| onboarding | no number | UNVERIFIED |
| prep | no number | UNVERIFIED |
| delivery | no number | UNVERIFIED |

### combat
Combat auditor, round 32 (tree HEAD 58e28ccef, git diff e3f51bf18..HEAD empty for src, tests, tools, research, critic/runner). git diff 2a9340249..e3f51bf18 is empty for src/battle, src/engine/tactics, src/story, research and src/data (one 3-line art registration excepted): the 61 changed src files are presenter, staging, HUD ribbon, load order, pose holds and look code, none of which emits, reorders or alters a BattleEvent or touches the seeded RNG. All 16 engine probes and both parity measures re-ran md5-identical to round 31 (kernel 478 checks and kernelx2 68 checks 0 mismatches; immunefuzz 51,782 forks 0 friendly fire). Full unit suite on this tree, serial at testTimeout 240 s: 28,004 tests, 27,850 passed, 0 failed, 153 skipped, 1 todo. orphans: 24 pre-existing, none of HeadlineBoss, LoadHold, LeaveRelease, BackgroundQueue, EntryMarks, PieceHolds. 19 chapters won by real keys, 0 NaN or undefined in 25 battle logs. Held back: the Items-list touch path is only partly exercised (PR-0483), later-link retry unverified (PR-0587), Chapter III possession Summon rows unseen in a browser (PR-0460), the 2560x1440 crash unreproduced but unproven (PR-0565). Nothing found a combat defect, regression or lock.

### encounter
Encounter auditor, round 32. Data, AI scripts, phases, rewards and the chapter registry are byte-identical to round 31. Intended-line win rates re-measured (engine, FFX 200 seeds 5001-5200, FFX-2 100 seeds): Seymour Flux 200/200, Yunalesca 180, Braska 197 (chain 95/100), Anima 189, Evrae 194, Yojimbo 196, Natus 190, Omnis 174, Via Purifico 180, Sin core 178, Sin face 200, Mirror Aeons 148; FFX-2 Bahamut 100, Vegnagun 99, Leblanc 100, Fallen Aeons 100, Trema 71, Den of Woe 100, Ixion 100. Credible wrong lines lose (attack-only 0/40 in 11 of 12 FFX chapters). All 19 chapters reached results by real keys; Yunalesca seed 1 lost (the capture bot walked into Mega Death) and seed 3 won; Mirror Aeons needed a 40-minute budget (PR-0592). New Leblanc chain: the links name their own boss in the ribbon (Ormi, then Logos), 13 abilities all in research/ffx2-leblanc-syndicate.md, rewards 900 EXP, 780 gil, 6 AP. Chapter VII ribbon names Seymour while both Guardians stand (HeadlineBoss). Held back: Trema about 60 percent at human pace, Mirror Aeons 74 percent and a 20-minute fight, Omnis 87 percent, Den of Woe 95 percent, hidden chapters that do not punish credible mistakes, demo mode 50 percent gauges, the stale research/ffx2-bahamut.md, and retry from a later chained link (PR-0587).

### visual
Visual auditor, round 32 plus the chief's reading of the harness numbers. Approved art intact (ROOT=D:/pyrefly-release55 verify-approved: 917 ok, 0 mismatched, 0 missing). Credits: gated swap jerks 66 to 34 against round 31, snaps 0.00 a minute, ghosting 1,689 to 1,623 ms a minute (worst severity 0.367, under 0.4); Leblanc (new) PASS on both continuity checks; Bahamut, Natus, Omnis PASS. Debits: PR-0581 and PR-0582 (release-70 booth holds), Braska reads worse than round 31 (PR-0583, PR-0584), CHK-026 FAIL in 13 of 19 chapters (445 head swaps, mostly Lulu's rig head; Trema Paragon feet 10.4 px) and CHK-027 FAIL in 8, treated arenas much darker than the approved backdrops (PR-0585, Bailey's call), carried overlaps (CHK-008 FAIL). 18 target composites: 15 matched, 3 unverified, 0 failing. Not seen: a settled party-prep frame, a Shuyin dialogue portrait, Leblanc at 2560x1440 beyond the first menu. Net 8.3, 0.1 under round 31: the swap-jerk and ghosting gains do not offset the Braska and Ixion regressions while CHK-026 fails in 13 chapters.

### feel
Feel auditor, round 32, from files only. Real keys on 19 chapters, two retries, 0 console errors, 0 404s in every run. Leblanc: boss card to stage dissolve, the Darkness Dance and Shield Bash labels and MISS pop read cleanly, the menu is back inside about 2.4 s. Chain seams paced (Leblanc 2 seams at 100.7 s and 211.8 s; Braska 6; Vegnagun 4). Retry: Chapter I defeat panel 1.0 s after the last KO and TRY AGAIN to first menu 9.7 s (PR-0590, noisy lane), Chapter IV 9.9 s. HOLD ENTER skips and ESC opens pause in all 19 chapters. Live-gap lane on the same bundle for Braska and Isaaru only: Braska teleports of 306 to 417 px and 254 to 290 px hops (PR-0581), Isaaru 89 to 91 px KO slide (PR-0582). The chief confirmed both against the harness run of the same bundle (3 teleports 302 to 340 px; Isaaru 89.6 px; Anima 80.3 px). The first-time-fan lens adds the camera cuts, dress-change pop and turn cut-in (PR-0521, PR-0589, PR-0536). Scored 7.8: animation and camera are capped below 7.5 by CHK-026 and the planned cuts, and the two release-70 regressions sit in the third and fourteenth chapters.

### narrative
The auditor lane for this category did not reach the chief in a form the chief can score: its result arrived truncated (no category score, no check list), so no number is written. Visible only: the post scenes read after CONFIRM in all 19 chapters (Braska 14 lines, Leblanc: Rikku "That's for robbing our airship!"), and PR-0485 (portraits do not change expression) is carried. Left UNVERIFIED rather than carried from round 31 (no dependency argument is written for reuse).

### audio
The auditor lane for this category did not reach the chief in a form the chief can score: its result arrived truncated (no category score, no check list), so no number is written. Visible only: the technical half is clean (qa --strict 0 findings, 300 of 300 live files byte-equal, 0 synth fallbacks; the Leblanc pause cue returns to boss-leblanc at gain 1), and CHK-001 and CHK-B1 stay UNVERIFIED because no numeric owner listening verdict exists (PR-0148). The title and chapter-select music, the retried-fight theme, the dense timeline from last blow to results, loudness and true peak, the Chapter V link 5 theme, ending beds and voice counters were not captured this round. Left UNVERIFIED rather than carried from round 31 (no dependency argument is written for reuse).

### interface
The auditor lane for this category did not reach the chief in a form the chief can score: its result arrived truncated (no category score, no check list), so no number is written. Visible only: the F1 row cuts the selected label in three chapters (PR-0586), the phone pause chip opens the pause in both games (PASS), the phone Items pager works (PR-0483), and the carried interface list (PR-0516, PR-0540 to PR-0543, PR-0558, PR-0577, PR-0578) was not re-walked. The CHK-002 and CHK-003 size matrix the plan lists was not part of this round's evidence. Left UNVERIFIED rather than carried from round 31 (no dependency argument is written for reuse).

### onboarding
The auditor lane for this category did not reach the chief in a form the chief can score: its result arrived truncated (no category score, no check list), so no number is written. The accessibility settings (text size, reduce motion and flashes, colour vision) were not exercised this round (the phone pause tabs are present). Left UNVERIFIED rather than carried from round 31 (no dependency argument is written for reuse).

### prep
The auditor lane for this category did not reach the chief in a form the chief can score: its result arrived truncated (no category score, no check list), so no number is written. Only the first prep tab was captured on a phone (PR-0295); the prep tabs were not walked. Left UNVERIFIED rather than carried from round 31 (no dependency argument is written for reuse).

### delivery
The auditor lane for this category did not reach the chief in a form the chief can score: its result arrived truncated (no category score, no check list), so no number is written. Visible only: the live page serves index-UNVtEttT.js, the live check of the deploy compared 7,169 files and found 0 console errors, the harness read 56.3 to 59.9 fps and a worst p99 of 82.6 ms, and no phone-profile cold load, five-visit memory read or first-load measurement was made (PR-0567, PR-0573, PR-0520). Left UNVERIFIED rather than carried from round 31 (no dependency argument is written for reuse).

## Visual sub-scores (outside the weighted score)
characterModels 7, enemyModels 7.9, animation 7, fidelity 8.5, camera 7.4 (round 31: 7, 7.9, 7, 8.6, 7.5). characterModels and animation sit at their cap while CHK-026 fails in 13 chapters; enemyModels holds at 7.9; fidelity 8.5 (0.1 down: the treated arenas are graded much darker than the approved backdrops, PR-0585, a question for Bailey); camera 7.4 (0.1 down: Braska midfight framing PR-0583 and the Braska/Den of Woe/Sin camera cuts of PR-0521).

## Continuity harness
continuity harness (CHK-026/CHK-027): 19 chapter(s), 10638.5 s of battle, 56.3 to 59.9 fps, 19 of 19 run by the dedicated harness; CHK-026 FAIL (445 swap(s) change a head by more than the tolerance (worst 97.1 percent; 97.1 percent where the head is registered); 26 swap(s) of a standing figure move its feet more than the tolerance (worst 18 px at 1600 wide); 25 swap(s) draw a pose outside its height band against the idle, read from the pixels (stature 0.732 to 1.469; the bands are tools/posescale/pose-bands.mjs's); 54 swap(s) of a standing figure move the silhouette's own stance more than the tolerance (worst 290.7 px at 1600 wide), whatever stance the registration claims); CHK-027 FAIL (34 jerk(s) of 40 px or more in one frame AT A POSE SWAP (worst 227.3 px); 3 MID-MOVE teleport(s) of 300 px or more in one frame (worst 340 px: no lunge covers its whole reach in one frame)); 1,623 ms of see-through a minute (97.4 frames a minute at 60 Hz) Read by harness 5e1bbdec47c9 (38 files; tree D:/pyrefly-release55 at 58e28ccef; policy 5ef4a3ed; probe v3 2c2bfe73; pose table b8cead6d (114 subjects); waivers 84fc043f (80 rows)).

| Chapter | CHK-026 | CHK-027 | swaps | ghost ms/min | worst head % | worst feet px | worst jerk px |
|---|---|---|---|---|---|---|---|
| seymour-flux | FAIL | PASS | 205 | 510 | 10.8 | 4.9 | 241.2 |
| yunalesca | FAIL | FAIL | 630 | 5611 | 2.5 | 0.8 | 256.3 |
| braskas-final-aeon | FAIL | FAIL | 1429 | 1422 | 97.1 | 18 | 340 |
| ffx2-bahamut | PASS | PASS | 277 | 584 | 0.7 | 0.4 | 32.3 |
| ffx2-vegnagun-shuyin | PASS | FAIL | 478 | 736 | 9.4 | 0.6 | 201.6 |
| ffx2-leblanc | PASS | PASS | 597 | 1676 | 28.8 | 0.8 | 48.5 |
| seymour-anima-macalania | FAIL | FAIL | 292 | 1030 | 22.2 | 0.9 | 245 |
| evrae-airship | FAIL | PASS | 353 | 1258 | 15.5 | 1.1 | 38.7 |
| yojimbo-cavern | FAIL | PASS | 78 | 495 | 15.4 | 0.3 | 24.2 |
| seymour-natus | PASS | PASS | 141 | 1501 | 13.4 | 0.8 | 202.8 |
| ffx2-fallen-aeons | FAIL | FAIL | 381 | 1161 | 15.6 | 1.1 | 45.5 |
| seymour-omnis | PASS | PASS | 631 | 1272 | 8.7 | 1.5 | 27.9 |
| ffx2-trema | FAIL | PASS | 1761 | 2644 | 2.2 | 10.4 | 67 |
| isaaru-via-purifico | FAIL | FAIL | 223 | 470 | 22 | 1.3 | 89.6 |
| ffx2-den-of-woe | PASS | FAIL | 216 | 1085 | 2.8 | 1 | 139.9 |
| ffx2-ixion-djose | FAIL | PASS | 296 | 3444 | 18.9 | 0.5 | 0 |
| sin-fins-core | FAIL | FAIL | 1616 | 1421 | 15.5 | 1.4 | 169.3 |
| sin-face | FAIL | PASS | 286 | 2548 | 15.5 | 1.1 | 47.8 |
| mirror-aeons | FAIL | PASS | 980 | 1015 | 19.8 | 1 | 73.5 |

## Target gate
18 required, 15 matched, 0 failing, 3 unverified, 2 waiting. Visual auditor's counts from critic/rounds/round-32/targets (title, chapter select, dialogue, results, party prep, pause, phone pause, Auron briefing, boss body sheets, Leblanc, Braska, Macalania, Natus, FFX and FFX-2 battle). Unverified: the settled party-prep frame, a Shuyin dialogue portrait, Leblanc at 2560x1440 beyond the first menu. Waiting: surfaces with no tile in targets.json.

## Checks
| Check | Result | Mandatory | Note |
|---|---|---|---|
| CHK-001 | UNVERIFIED | yes | The technical half is clean (qa --strict 0 findings; 300 of 300 live files byte-equal; the Leblanc pause cue returns to the boss theme at gain 1) but the rule needs Bailey's listening verdict (PR-0148), which only he can |
| CHK-002 | UNVERIFIED | yes | The six-size matrix of the plan was not run in round 32; round 31's matrix (release 68) is not reused, because releases 69 and 70 changed the HUD ribbon and the F1 row (PR-0586). |
| CHK-003 | UNVERIFIED | yes | The legibility sweep was not run in round 32; not reused from round 31 for the same reason as CHK-002. |
| CHK-004 | PASS | no | advisor row named versus row pressed, desktop, 19 chapters |
| CHK-006 | UNVERIFIED | yes | The overlay-dies-with-its-owner check was not run in round 32. The chain, seam and screen-exit paths changed in releases 69 and 70 (PR-0587), so round 31 is not reused. |
| CHK-008 | FAIL | no | Minor overlaps in sampled frames: Omnis advisor text over the boss and the party legs; Yunalesca body behind the damage number and HP plate; the CHAIN box clipped at the edge (PR-0591); carried PR-0516 and PR-0553. |
| CHK-009 | FAIL | yes | The F1 command row prints 'SPECI...' and 'A one-off action this...' on the selected row in Chapters XIV, III and X (PR-0586); round 31 printed the labels whole. |
| CHK-011 | FAIL | no | Braska 23-midfight: the headline boss is mostly out of frame under the turn order (PR-0583); the other 18 chapters showed every enemy in the frames read. |
| CHK-012 | PASS | no |  |
| CHK-013 | PASS | yes | The live shipped derivatives were not re-hashed by the visual auditor (the deploy gate does that). |
| CHK-014 | PASS | yes |  |
| CHK-015 | PASS | yes | Only setSeed(N) before the first key, and the labelled injected hp=1 plus autoBattle defend in the two lose-retry captures. Phone touch: the pager and Holy Water target step by real taps (PR-0483); Poison Fang not tapped |
| CHK-016 | PASS | yes | Every capture asserts screen, chapter and state; 8 runs record one UNVERIFIED frame (30-post-scene.png: the scene plays after CONFIRM, PR-0593) and the phone defeat run its pause captures. No screenshot of a wrong screen |
| CHK-017 | PASS | yes | exact live artifact |
| CHK-018 | UNVERIFIED | yes | The art-derive verify and audit of the shipped build were run by the deploy gate and the live check, not re-run by this review; no dependency argument is written, so nothing is reused. |
| CHK-019 | UNVERIFIED | yes | The deploy manifest decode-checked 7,170 files and flagged two single-colour decodes (art/portrait-parts/paine/1x and 2x eyeR-catch.png, a catchlight layer); the review did not judge whether that is intended. |
| CHK-020 | UNVERIFIED | yes | The same-screen-both-games comparison was not made by a round-32 lane beyond the shared HUD ribbon (CHK-021). |
| CHK-021 | PASS | yes | every release 69 and 70 change touching battle play, checked for its written game case |
| CHK-022 | UNVERIFIED | yes | All 19 chapters reached results, CONFIRM and chapter select by real keys, and loss with TRY AGAIN was shown in Chapter I and Chapter IV; retry from a later link of a chained chapter (Leblanc, Braska link 3, Vegnagun, Tre |
| CHK-023 | PASS | yes | HeadlineBoss names the declared boss per link; stageLinkBegins seams completed in Leblanc 2, Den of Woe 2, Fallen Aeons 2, Braska 6, Via Purifico 2; the stageFreeze form-change guard is never reached on this engine. |
| CHK-026 | FAIL | yes | 445 swap(s) change a head by more than the tolerance (worst 97.1 percent; 97.1 percent where the head is registered); 26 swap(s) of a standing figure move its feet more than the tolerance (worst 18 px at 1600 wide); 25 s |
| CHK-027 | FAIL | yes | 34 jerk(s) of 40 px or more in one frame AT A POSE SWAP (worst 227.3 px); 3 MID-MOVE teleport(s) of 300 px or more in one frame (worst 340 px: no lunge covers its whole reach in one frame) |
| CHK-B1 | UNVERIFIED | yes | No numeric owner listening verdict covers the shipped mix (PR-0148); no capture can substitute. |

## Coverage matrix
**Tested**
- Live exact artifact: the page serves index-UNVtEttT.js (curl at the end of this review); the deploy-time live check compared 7,169 files (PASS); 0 console errors and 0 404s in every capture-owner run.
- All 19 chapters won by real keys from the title to results, CONFIRM and chapter select (capture owner, 1600x900; I and IV also 2000x1012 and 390x844 touch) and again by the continuity harness (10,638.5 s of battle, 56.3 to 59.9 fps, dedicated harness 5e1bbdec47c9, pose table b8cead6d, GPU mode, no fallback).
- Loss and TRY AGAIN by real keys: Chapters I and IV (single link).
- Engines: 16 probe and measure outputs re-run and md5-identical to round 31; full unit suite (28,004 tests, 0 failed); orphans 24 pre-existing, none of release 69 or 70.
- Audio: qa --strict and the live file byte-equality; the Leblanc pause cue and return to the boss theme at 1600x900.
- Gap pass on the live bundle: Leblanc at 2560x1440, seeds 1 to 3 with crash instrumentation (0 crashes); the phone pause chip in both games (PASS); the phone Items pager and Holy Water target step by real taps (partly proved); the orchestrator's live-gap lane for Braska and Isaaru seeds 1 and 2 (same bundle, dedicated harness).
- First-time-fan lens over 19 chapters of strips and sheets; its breakers are filed as issues (PR-0589, PR-0591, folded into PR-0521, PR-0528, PR-0536, PR-0517, PR-0379).
**Reused, with the reason**
- Carried issue text of 56 round-31 issues not touched by a round-32 lane (marked carriedFrom on each) (from critic/rounds/round-31.json): git diff 2a9340249..e3f51bf18 is empty for src/battle, src/story, src/data (one art table excepted) and research, and the carried interface, prep and onboarding items were not re-walked, so they are listed open and carried, never as re-observed. No PASS rests on them.
- The carried minors PR-0460 (Chapter III Summon rows) and PR-0524 (stale research/ffx2-bahamut.md) (from critic/rounds/round-31.json and round 30b): Dependency argument: git diff 2a9340249..e3f51bf18 is empty for src/battle, src/data (one art table) and research, and the probes that bear on them (ch3, aeonmenu) are md5-identical.
**Not tested**
- Later-link retry in a chained chapter (PR-0587)
- Chapter III links 3 to 6 Summon and Grand Summon rows in a browser (PR-0460)
- Poison Fang by touch and the tap on a target plate at 390x844 (PR-0483)
- Phone-profile cold load, five-visit memory read and first-load time (PR-0567, PR-0573, PR-0520)
- Loudness, true peak and voice-over-music margin in the treated chapters; the title and chapter-select music; the retried-fight theme; the Chapter V link 5 theme; ending beds and voice counters (PR-0588)
- The six-size CHK-002 and CHK-003 matrix; accessibility settings; prep tabs beyond the first on a phone
- A settled party-prep frame, a Shuyin portrait, Braska booth on and off side by side, Bailey's still J6
- Firefox and WebKit (Chromium only)
**Required and not tested**
- CHK-002, CHK-003, CHK-006, CHK-018, CHK-019, CHK-020 (listed in the plan, not run this round, UNVERIFIED with reasons)
- CHK-022 for retry from a later chained link (UNVERIFIED)
- CHK-001 and CHK-B1: Bailey's listening verdict (a human judgment only he can give)
- The scores of narrative, audio, interface, onboarding, prep and delivery (auditor results arrived truncated; the chief made no number up)
- Of the 49 issues the auditors raised, 21 reached the chief only as a count; round 31's open list stands in their place, labelled carried

## Encounters through their real flow
- seymour-flux: victory 53 turns (1600x900), victory 53 (2000x1012), seed 1; lose-retry shown; 390x844 touch runs DEFEATED at seeds 1 and 2 (the route harness did not page the Items list: PR-0483) (Real keys title to chapter select; post scene plays after results CONFIRM)
- yunalesca: seed 1: defeat at 98 turns (pro-defeat card, the capture bot losing); seed 3: victory 147 turns (Seed 3 won by real keys to results and board; same seed as round 31)
- braskas-final-aeon: victory 284 turns, 28.9 min (6 link seams, 0 console errors; booth treatment (r70): PR-0581)
- ffx2-bahamut: victory 60 turns at 1600x900, 2000x1012 and 390x844 touch; lose-retry shown (Spherechange frame sequence captured; touch run completed with 0 want!=took)
- ffx2-vegnagun-shuyin: victory 90 turns (post scene lines read)
- ffx2-leblanc: victory 83 turns, 10.8 min (New in r69, booth treatment; 2 seams; post scene after CONFIRM reads; 3 further runs at 2560x1440 (seeds 1 to 3) reached results with 0 crashes)
- seymour-anima-macalania: victory 58 turns (booth treatment (r70): PR-0582)
- evrae-airship: victory 85 turns (wide swap scope (r69))
- yojimbo-cavern: victory 14 turns
- seymour-natus: victory 26 turns (booth treatment (r70))
- ffx2-fallen-aeons: victory 52 turns
- seymour-omnis: victory 92 turns
- ffx2-trema: victory 226 turns, 22.8 min (booth treatment (r70))
- isaaru-via-purifico: victory 38 turns (booth treatment (r70): PR-0582)
- ffx2-den-of-woe: victory 27 turns (booth treatment (r70))
- ffx2-ixion-djose: victory 26 turns
- sin-fins-core: victory 321 turns, 18.6 min
- sin-face: victory 45 turns
- mirror-aeons: first run STALLED at the 15-min default budget (link 2, 162 turns); rerun with a 40-min budget: victory, 20.3 min (The stall was the budget, not a hang (PR-0592))

## Ranked issue list (90, all open)
Critical, then major, minor, polish. Every major carries introducedByCandidate, regressionVsLive and inNewFeature.

### PR-0581 [major] feel, FFX: R70-C1 Braska (FFX III): Tidus's real-snappy return flip drawn 1.66x larger reads as one-frame teleports of 306 to 417 px and 254 to 290 px attack hops under the release-70 booth hold
Chapter: Chapter III braskas-final-aeon
Observed: Round-32 harness (braskas-final-aeon-win-r32): 3 mid-move teleports of Tidus of 340, 312.8 and 302.1 px in one frame (no pose swap, not a camera cut: all other figures step 20 px or less in the same frame; Tidus's own move speed is about 45 px a frame), 138 dashes over the fail line (worst 294.5 px). The live-gap lane (live70, 1,696.7 s) reads four teleports of 306 to 417 px in Energy Rain (worst 416.6 px) and 26 plain-Attack hops of 254 to 290 px straight up in one frame, against a live-69 control of 116 px at most; the pack arm's worst dash is 116.2 px. Round 31 (release 68) Braska had 0 teleports and a worst dash of 153.6 px. The focused review of this build (critic/reviews/e3f51bf18-focused.json) rated this polish from a three-seed read; the deep review reads the whole run, finds the player-visible size of it (a main character crossing a third of the screen in one frame, twice a fight, in the third chapter) and rates it major.
Expected: A move may not move a figure faster than the move itself: no single-frame plane step above the policy limit (CHK-027 item 4) and no dash over 150 px.
Repro: PYREFLY_BROWSER=gpu node critic/runner/lib/continuity.mjs --base=https://echoesofspira.com/ --chapters=braskas-final-aeon --goal=win --size=1600x900 --seed=1 --tag=r32; read continuity.json jerks of kind teleport (figure tidus, about 1195 s, frame 69853); compare with ?treated=pack.
Evidence: critic/rounds/round-32/continuity/braskas-final-aeon-win-r32/continuity/strips/jerk-005-tidus.jpg; critic/rounds/round-32/continuity/braskas-final-aeon-win-r32/continuity/continuity.json; D:/Tools/pyrefly-scratch/2026-10-31/r70/live-gaps/evidence/cont/continuity-summary-braska-live.json; D:/Tools/pyrefly-scratch/2026-10-31/r70/live-gaps/evidence/braskas-final-aeon-win-live70/continuity/strips/jerk-000-tidus.jpg
Smallest fix: Suspected cause (not traced to a line): the treated Braska hold in src/engine/motion/PieceHolds.ts lets Tidus's return flip draw 1.66x larger, which the plane-step reads as a jump. Smallest correction: hold the flip at the idle's size for the treated chapter (or take the Braska row out of PIECE_HOLDS) until the curves lane re-measures it.
Acceptance: Harness on braskas-final-aeon, seeds 1 and 2: 0 teleports of 300 px or more, no dash over 150 px, CHK-027 PASS for Tidus.
Confidence: high for the measurement and the strip; the cause is suspected
Tags: introducedByCandidate true, regressionVsLive true, inNewFeature true

### PR-0582 [major] feel, FFX: R70-C2 Ixion's KO floor slide (ProneLay) lands at its 355 px maximum in the treated chapters: an 80 to 91 px one-frame feet jerk at the KO swap
Chapter: Chapter XIV isaaru-via-purifico and Chapter VII seymour-anima-macalania
Observed: Harness: Ixion idle-to-KO feet jerk 89.6 px in Chapter XIV (frame 16224, about 274 s) and 80.3 px in Chapter VII (frame 14824, about 252 s); round 31 read 27.3 px and 0 px. The live-gap lane read 89.2 px (seed 1) and 90.8 px (seed 2) in XIV with the KO painting placed 355 px from the idle plane (ProneLay at its maximum) against minus 9 px at ?treated=pack. ?pro=off and ?pack=off do not remove it; ?hud=today shrinks the slide to 250 px and passes seed 1 but not seed 2 (86.4 px). Strip swap-233-ixion-idle-ko.jpg shows the lying body well to the right of the standing figure after a red blend. The finding is wider than the focused review's (Chapter XIV only).
Expected: A KO lands where the figure fell; the KO swap moves the feet less than 40 px in one frame (CHK-027 item 9).
Repro: Harness --chapters=isaaru-via-purifico (and seymour-anima-macalania) --seed=1 or 2; read swap jerks for figure ixion; compare ?treated=pack.
Evidence: critic/rounds/round-32/continuity/isaaru-via-purifico-win-r32/continuity/strips/jerk-000-ixion.jpg; critic/rounds/round-32/continuity/seymour-anima-macalania-win-r32/continuity/strips/jerk-026-ixion.jpg; D:/Tools/pyrefly-scratch/2026-10-31/r70/live-gaps/evidence/cont/continuity-summary-isaaru-live-s1.json; D:/Tools/pyrefly-scratch/2026-10-31/r70/live-gaps/evidence/cont/continuity-summary-isaaru-live-s2.json
Smallest fix: Suspected: ProneLay (src/engine/motion) picks its maximum slide candidate under the treated holds' setProneAvoid areas. Smallest correction: cap the KO plane within 40 px of the standing plane, or ease it over the dissolve.
Acceptance: Harness on Chapters XIV (seeds 1 and 2) and VII: Ixion's swap jerk under 40 px.
Confidence: high for the measurement; medium for the cause
Tags: introducedByCandidate true, regressionVsLive true, inNewFeature true

### PR-0531 [major] visual, both: Figures still change head, height or feet at pose swaps in 13 of 19 chapters (CHK-026 FAIL; the umbrella for PR-0529, PR-0534 and PR-0459)
Chapter: Chapters I, II, III, VII to XIX (14 of 19; PASS in IV, V, VI, X, XII... see continuity)
Observed: Harness (10,638.5 s of battle, 11,649 swaps, harness 5e1bbdec47c9, pose table b8cead6d): 445 head swaps over tolerance (worst 97.1 percent at Braska's victory cheer; 15.5 percent is Lulu's rig head), 26 feet moves over 2 px (worst 18 px, Braska; Trema Paragon 10.4 px), 25 swaps outside the height band (round 31: 5; 23 of them in Braska), 54 silhouette-stance misses (23). FAIL in 13 of 19: Seymour Flux, Yunalesca, Braska, Anima, Evrae, Yojimbo, Fallen Aeons, Trema, Isaaru, Ixion, Sin core, Sin face, Mirror Aeons. PASS: Bahamut, Vegnagun, Leblanc, Natus, Omnis, Den of Woe. Leblanc, new in r69, is PASS on CHK-026 and CHK-027. Braska is worse than round 31 (PR-0584).
Expected: Head within 3 percent, standing feet within 2 px at 1600 wide, stature inside the pose band at every swap (CHK-026).
Repro: node critic/runner/lib/continuity.mjs --base=https://echoesofspira.com/ --chapters=<chapter> --goal=win --size=1600x900 --seed=1 (PYREFLY_BROWSER=gpu); the 19-chapter run of this round is critic/rounds/round-31/continuity
Evidence: critic/rounds/round-32/continuity/continuity-summary.json; critic/rounds/round-32/continuity/ffx2-trema-win-r32/continuity/strips/swap-207-paragon-idle-cast.jpg; critic/rounds/round-32/continuity/braskas-final-aeon-win-r32/continuity/strips/swap-1172-yuna-idle-victory.jpg
Smallest fix: Re-register the pose paintings the strips name to the idle head and ground line (registration, never a repaint on taste), refit the Den of Woe and Ixion poses outside their height band, and have the harness read the head from the part's own box for rig figures; do not loosen the tolerance. A written method check is owed before a third batch (RUBRIC section 8: open in rounds 29, 30, 30b, 31).
Acceptance: Harness on Chapters I, IV, VII, IX, XI, XII, XIII, XVI: feet, height and stance lists empty outside written waivers; the five named strips show one size.
Confidence: high for the counts, medium for the visible weight of the rig-head share
Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false

### PR-0380 [major] feel, both: CHK-027 FAILS in 8 of 19 chapters: 34 pose-swap jerks of 40 px or more in one frame (round 31: 66), worst 227.3 px; 3 mid-move teleports (round 31: 0)
Chapter: II, III, V, XI, XII, XIV, XVII, XIX (yunalesca, braskas-final-aeon, ffx2-vegnagun-shuyin, ffx2-fallen-aeons, ffx2-trema, ffx2-den-of-woe, sin-fins-core, mirror-aeons)
Observed: Harness: 34 swap jerks of 40 px or more (worst 227.3 px, Braska), 3 mid-move teleports of 300 px or more (340 px, Braska Tidus: PR-0581), 138 dashes over the fail line (worst 294.5 px), 175 jerks over the fail line; snaps 0.00 a minute (the 7.5 animation cap does not bind). FAIL: Yunalesca, Braska, Vegnagun (tail 201.6 px), Anima (Ixion 80.3 px: PR-0582), Fallen Aeons (45.5 px), Isaaru (89.6 px: PR-0582), Den of Woe (Rikku 139.9 px stand-to-kneel drop), Sin core (left fin 169.3 px). Better than round 31 at swaps (66 to 34); worse in Braska, Anima and Isaaru, which the booth treatment first reached in release 70.
Expected: No jump of 40 px or more in one frame at a pose swap, or a swap that happens under a cut with no ghost (CHK-027).
Repro: Continuity harness, ffx2-vegnagun-shuyin and sin-fins-core, seed 1, 1600x900 (strips under critic/rounds/round-31/continuity/<chapter>-win-r31/continuity/strips)
Evidence: critic/rounds/round-32/continuity/continuity-summary.json; critic/rounds/round-32/continuity/ffx2-den-of-woe-win-r32/continuity/strips/jerk-004-rikku.jpg; critic/rounds/round-32/continuity/isaaru-via-purifico-win-r32/continuity/strips/jerk-000-ixion.jpg
Smallest fix: Start with the Sin fins/core and Vegnagun swap lists (the worst two); register Ixion hurt and KO to one feet anchor; extend the registered stance to the poses the lists name. Method check owed (RUBRIC section 8).
Acceptance: Harness on the eight chapters: swap jerks over the line under 10 in total.
Confidence: high
Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false

### PR-0379 [major] feel, both: See-through cross-dissolves at pose swaps: 1,623 ms a minute (round 31: 1,689), worst severity 0.367; Yunalesca 5,611 ms and FFX-2 Ixion 3,444 ms a minute stay over
Chapter: worst: Yunalesca 5,531, Ixion 5,030, Evrae 3,186, Trema 2,724, Sin face 2,569 ms a minute
Observed: Harness: 1,623 ms a minute of see-through frames (97.4 frames a minute at 60 Hz), worst severity 0.367 under the 0.4 line, 0 over the fail line. Yunalesca 5,611 ms a minute (strip ghost-233), Ixion 3,444, Trema 2,644, Sin face 2,548 remain the worst. Gated swap jerks 66 to 34.
Expected: Under 1,000 ms a minute of see-through in every chapter (the issue's own line).
Repro: Continuity harness, any chapter, seed 1.
Evidence: critic/rounds/round-32/continuity/continuity-summary.json
Smallest fix: Continue the planned list: Evrae head registration, Sin face lunge return, Yunalesca planned cuts over 120 px, then move each of the four exceptions to the wide scope when its blocker clears.
Acceptance: All 19 chapters under 1,000 ms a minute or named exceptions.
Confidence: high
Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false

### PR-0570 [major] feel, FFX only (Chapter I Tidus; Chapter II Tidus peaks 39.3 px and Chapter IV Rikku 30.9 px, no step): Chapter I Tidus's revive steps 89 px sideways in one frame at +117 ms (r68 removed the first-frame pop; the step moved later)
Chapter: seymour-flux
Observed: Release 69 fixed this: the revive slide target is read once at revive start (unit suite revive-follows-slide passes; Mega Phoenix and Phoenix Down revives resolve through the real menu in the Chapter I runs). The harness's Chapter I run lists no one-frame revive step of Tidus over the fail line (seymour-flux CHK-027 PASS, 0 swap jerks), but Tidus head moves of 80 to 162 px at swaps under a smear are present (frames 22585, 11541, 22705). The revive step itself was not isolated, so the fix is probable and not closed.
Expected: No step over 40 px in one frame of a revive (CHK-027 item 4).
Repro: https://echoesofspira.com/?coach=off, Chapter I, seed 1: let Kimahri fall, revive him or Tidus (Mega Phoenix or Phoenix Down); record 60 Hz stepped frames and track the standing plane (probe D:/Tools/pyrefly-scratch/2026-10-29/r68/gaps/lib).
Evidence: critic/rounds/round-32/continuity/seymour-flux-win-r32/continuity/continuity.json; critic/rounds/round-32/evidence/seymour-flux-win-r32/turn-log.json
Smallest fix: Isolate the Chapter I revive in the harness (Tidus after Phoenix Down at +117 ms) and read the plane step; close if under 40 px.
Acceptance: One revive strip of Tidus with a plane step under 40 px at +117 ms.
Confidence: medium
Tags: introducedByCandidate unknown, regressionVsLive false, inNewFeature false

### PR-0517 [major] visual, FFX-2 only: FFX-2 Chapter IV: Rikku's and Paine's attack and ready poses still read as a different-sized figure from their idle (carried; r68's ready hold did not change it)
Chapter: ffx2-bahamut
Observed: Carried. The fan strips show it again in Leblanc: Rikku grows to about 1.4 times when her ready stance starts (ffx2-leblanc seq-action-playing frames 6 to 9, seq-party-action frames 0 to 1), and Ormi's Shield Bash lunge is a pink ghost that pops back to its seat (a double-image read, folded here and into PR-0379). The harness CHK-026 reads Leblanc and Bahamut as PASS, because the head control passes a registered pose by construction (PR-0534).
Expected: A figure keeps one size across a pose change (CHK-026; Bailey 2026-10-04).
Repro: Continuity harness ffx2-bahamut, seed 1, 1600x900.
Evidence: critic/rounds/round-31/continuity/ffx2-bahamut-win-r31/continuity/strips/swap-202-paine-attack-follow.jpg; critic/rounds/round-31/continuity/ffx2-bahamut-win-r31/continuity/strips/swap-207-rikku-attack-follow.jpg; critic/rounds/round-31/continuity/ffx2-bahamut-win-r31/continuity/strips/swap-267-rikku-idle-attack.jpg
Smallest fix: Register the attack and follow paintings to the idle head and ground line (or give the swap a smear cut); Bailey decides whether the Dark Knight and Warrior ready poses are repainted.
Acceptance: Strip header real head within 3 percent for the named swaps; harness stays PASS.
Confidence: medium (one strip read in full by the chief; the others by their headers)
Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false

### PR-0459 [major] visual, FFX only: Chapter I (FFX): Auron's head changes 9.3 percent at two swaps and one swap draws him at stature 0.765 (CHK-026 FAIL, still open, a fourth deep review)
Chapter: seymour-flux
Observed: Chapter I (FFX): Seymour Flux CHK-026 FAIL again (max head jump 10.8 percent, 1 stature miss); the strips were not re-read for Auron specifically this round. Carried; folded into PR-0531's numbers.
Expected: Head within 3 percent at every swap (CHK-026).
Repro: Continuity harness, seymour-flux, seed 1, 1600x900; strips swap-265-auron-follow-idle.jpg and the Auron entries of continuity.json.
Evidence: critic/rounds/round-32/continuity/seymour-flux-win-r32/continuity/continuity.json
Smallest fix: Method check first (RUBRIC section 8; stalled since round 29): read the two strips, re-register Auron follow to the idle head, re-run Chapter I.
Acceptance: Chapter I harness: Auron worstHeadPct under 3 and heightOver 0.
Confidence: high
Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false

### PR-0148 [major] audio, both: No numeric owner listening verdict covers the shipped mix (carried; an evidence gap, not a player defect)
Chapter: all
Observed: Carried, an evidence gap and not a player defect: docs/audio/OWNER-VERDICT.md has no entry after 2026-09-28; the only number is 'I like all the music 7/10' (2026-10-13, D-804), music only, before the re-rendered victory cues, the SFX and voice passes and the conference sound pass. The technical half is clean (qa --strict 0 findings, 300 of 300 live files byte-equal, 0 synth fallbacks).
Expected: CHK-B1: a dated verbatim numeric verdict naming the build or cue set.
Repro: Read docs/target/decisions.json (D-804, D-1310, D-1371) and docs/audio/OWNER-VERDICT.md.
Evidence: critic/rounds/round-32/audio/qa.log; docs/audio/OWNER-VERDICT.md
Smallest fix: Bailey listens to docs/audio/audition.html and gives a 0 to 10 number for music, SFX and voice, recorded verbatim.
Acceptance: A dated verbatim numeric verdict naming the build or cue set is recorded.
Confidence: high
Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false

### PR-0567 [major] delivery, both: A phone on a 10 Mbit/s line waits 19.8 s (Chapter I) and 42.4 s (Chapter IV) on the loading card, about 94 MB on the wire, before the first command; release 68's load diet does not move it
Chapter: seymour-flux and ffx2-bahamut (measured); suspected for all
Observed: Carried and unmeasured on the build: round 31 read 19.8 s (Chapter I) and 42.4 s (Chapter IV) on the loading card on a 10 Mbit/s phone profile. Release 69 added ?phonediet (CHANGELOG, the builder's own claim: 20.4 to 13.8 s and 42.3 to 23.7 s, with the 8 s budget still missed). No independent run measured the live build this round; PR-0573 (page memory per chapter change) is likewise not re-read after release 69's screen release and LeaveRelease.endFight.
Expected: A phone reaches the first command menu without a 20 to 40 s load card; the 5 s goal of BUDGETS B2a holds on the desktop line.
Repro: critic/reviews/2a9340249-focused/budgets jobs/first-command.mjs --profile=phone10 --mode=pad (emulation only; a desktop GPU is not a phone).
Evidence: critic/reviews/2a9340249-focused/budgets/first-command-phone10-pad-cand68.json; critic/reviews/2a9340249-focused/budgets/first-command-phone10-pad-r67.json; critic/reviews/2a9340249-focused/budgets/first-command-desk50-pad-cand68.json
Smallest fix: Measure the wire set before the first menu with ?loaddiet=off and on, find what is fetched before the opening poses need it (suspected: the whole chapter's 1x paintings plus board strips), defer the rest until after the first menu.
Acceptance: Three runs per chapter: phone10 wire bytes to the first menu at most 50 MB, load wait at most 8 s, desk50 Chapter I load card at most 5.0 s.
Confidence: low (not measured this round)
Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false

### PR-0295 [major] interface, both: Heavy party-prep tabs are a desktop frame squeezed onto a phone (carried; not re-examined; the prep tab strip is cut at ACCESS on the 390x844 prep capture)
Chapter: prep, phone
Observed: Carried, not re-walked: only the first prep tab was captured at 390x844 (the strip is cut at 'ACCESS' in Chapter IV).
Expected: A phone prep that is a phone layout.
Repro: 390x844 touch, any chapter, prep screen.
Evidence: critic/rounds/round-32/evidence/ffx2-bahamut-win-r32-phone-touch/04-prep.png
Smallest fix: Walk it (PR-0503), then fix on what the walk shows.
Acceptance: Per tab at 390x844: opened by tap, readable, one change made, visible in the first menu.
Confidence: low this round
Tags: introducedByCandidate false, regressionVsLive false, inNewFeature false

### PR-0583 [minor] visual, FFX: Braska 23-midfight: at a command moment the aeon is mostly out of frame under the turn order and the red sky reads near black (CHK-011 FAIL)
Chapter: Chapter III braskas-final-aeon
Observed: Only the aeon's sword and shoulder show at the top right under the turn order; round 31's frame of the same capture step showed the whole aeon under a red sun. The other frames of the chapter (first menu, targeting, link seams) show the boss well.
Expected: The headline boss's head and torso are inside the frame at every command moment (CHK-011).
Repro: Chapter III, real keys, seed 1, 1600x900; capture 23-midfight.
Evidence: critic/rounds/round-32/evidence/braskas-final-aeon-win-r32/23-midfight.png; critic/rounds/round-32/targets/braska-r31-vs-r32-first-menu.jpg
Smallest fix: Check the treated pro-camera shot for the second form against the form's height, or add a CHAPTER FRAMING row.
Acceptance: At every command moment of the chapter the boss's head and torso are inside the frame.
Confidence: medium

### PR-0584 [minor] visual, FFX: Braska victory cheer: the swap numbers sit far over tolerance (head x1.97, 290.7 px stance, a 227 px Auron head jerk) but what the player sees under the victory close-up is not established
Chapter: Chapter III braskas-final-aeon
Observed: Tidus critical-to-victory reads head x1.97; Yuna idle-to-victory 290.7 px stance, height x0.84, real head x1.26; Auron a 227 px head jerk at a swap. Braska reads 23 swaps outside the height band (round 31: 0), 17 silhouette-stance misses (0) and feet 18 px (1.4 px); most of the numbers sit at the victory cheer, where the camera moves to a close-up on Auron a few frames earlier, so the party may be mostly off view at the swap.
Expected: Head within 3 percent and stance within 7 px at each swap, or a written rule that excuses a swap under the victory camera.
Repro: Chapter III to the end; harness swaps 1171, 1172, 1767; strip jerk-046-auron.
Evidence: critic/rounds/round-32/continuity/braskas-final-aeon-win-r32/continuity/strips/swap-1172-yuna-idle-victory.jpg
Smallest fix: Record the victory with the pro camera off and read the same swaps; then either register the victory poses or write the excusal rule (continuity.unseen).
Acceptance: The same swaps read inside tolerance or are excused by a written rule.
Confidence: low

### PR-0585 [minor] visual, both: Approved backdrops are graded much darker in the treated chapters (Leblanc's warm backdrop C, Braska's red sky, Macalania's lit hall): a question for Bailey, not scored as a defect
Chapter: treated chapters (Leblanc, Braska, Macalania, Natus and the other booth chapters)
Observed: The grade is the intended booth treatment, but Leblanc's backdrop C reads dark magenta, Braska's red sky near black and Macalania dim blue in battle. The handoff (booth-ffx-b3b J6) says a still beside Chapter I is owed before Bailey judges it.
Expected: Approved art stays recognisable in the running game; Bailey judges the grade.
Repro: Compare critic/rounds/round-32/targets/leblanc-backdrop.jpg and critic/rounds/round-32/targets/braska-r31-vs-r32-first-menu.jpg.
Evidence: critic/rounds/round-32/targets/leblanc-backdrop.jpg; critic/rounds/round-32/targets/macalania-backdrop.jpg; critic/rounds/round-32/targets/natus.jpg
Smallest fix: Show Bailey the still beside Chapter I (job J6) and take his verdict. No change before that.
Acceptance: Bailey's recorded verdict on the arena grade.
Confidence: medium

### PR-0586 [minor] interface, FFX only: R32-INT-01: the F1 command row cuts the selected row's own label or hint ('SPECI...' on Isaaru, 'A one-off action this...' on Braska and Natus)
Chapter: Chapter XIV Isaaru (Yuna), Chapter III Braska, Chapter X Natus
Observed: With the cursor on SPECIAL the row prints 'SPECI...  x2  Open the Special ...': the label loses its last letters before the hint does. On TALK the hint ends 'A one-off action this...'. In round 31 the Braska and Yuna rows (old HUD) printed TALK and SPECIAL whole. The builder traces it to the F1 row's label against its x2 badge and inline description (docs/handoff/booth-b3.md 12.4); I did not trace the CSS line.
Expected: Every name that can be shown is shown in full; a hint may shorten, a label may not (CHK-009).
Repro: Real keys from the title: Chapter XIV, party prep, Start Battle, first menu, cursor on SPECIAL (1600x900, seed 1); Chapters III and X, TALK.
Evidence: critic/rounds/round-32/evidence/isaaru-via-purifico-win-r32/13-guide-G.png; critic/rounds/round-32/evidence/braskas-final-aeon-win-r32/12-intent-E.png; critic/rounds/round-32/evidence/seymour-natus-win-r32/12-intent-E.png
Smallest fix: Let the label keep its width and truncate the inline description first.
Acceptance: The label prints whole on every selected row of the three chapters at 1600x900 and 2000x1012.
Confidence: high that it shows; medium on the cause

### PR-0587 [minor] delivery, both: Retry after a loss inside a later link of a chained chapter is UNVERIFIED on the release 69 and 70 build
Chapter: Chapter VI Leblanc (new), Chapter III Braska link 3 and later, Vegnagun, Trema, Sin core, Mirror Aeons
Observed: Releases 69 and 70 changed the chain runner (setHeadlineBoss per link), the presenter's run (stageLinkBegins clears the staging layer from link 2) and BattleScreen.releaseParts. Loss and TRY AGAIN was re-shown on this build only in single-link Chapters I and IV. No capture lost link 2 or later of a chained chapter and pressed TRY AGAIN. Nothing observed failing; unit tests booth-leblanc-chain and chain-checkpoint pass.
Expected: The retried link starts at the checkpoint with its own boss in the ribbon, a clear staging layer, music, a first menu, and the earlier links' rewards summed (PR-0138).
Repro: Real keys, Chapter VI Leblanc: win link 1, lose link 2 (idle), CONFIRM, TRY AGAIN; read the ribbon, the first menu and the results sum. Repeat in Chapter III link 3 or later.
Evidence: critic/rounds/round-32/evidence/seymour-flux-lose-retry/run.json; critic/rounds/round-32/evidence/ffx2-bahamut-lose-retry/run.json
Smallest fix: Add a lose-and-retry capture in Leblanc and Braska link 3 to the next review.
Acceptance: Retry reaches a first menu of the retried link in about 10 s, the ribbon names that link, 0 console errors, the results sum the earlier links.
Confidence: medium

### PR-0588 [minor] audio, both: The sound pass (+4 dB makeup, -14 dB voice duck, layered hits) now plays in ten chapters but its level was measured only in Chapters I and IV
Chapter: FFX II, III, VII, X, XIV; FFX-2 VI, XIII, XV (the treated chapters)
Observed: Releases 69 and 70 changed audioNewOn() to isTreatedChapter(run,'audio') (src/audio/pass/passSwitch.ts:72); no PIECE_HOLDS row holds 'audio', so the pass runs in every treated chapter. passMix.ts states its numbers came from Chapter I and IV recordings. The capture evidence holds no loudness, true-peak or voice-over-music reading for the other chapters. The safety shaper bounds the peak by design, but the live result is not shown.
Expected: Short-term loudness median about -16 to -14 LUFS, true peak at or under -1 dBTP and every voice line at least +6 dB over the music in the treated chapters too (passMix.ts targets).
Repro: Play Chapters II, III and VI with the master tapped (window.__pyrefly.audioPass() reports makeup and trim) and run the existing measure tools against a Chapter I fight.
Evidence: critic/rounds/round-32/evidence/seymour-anima-macalania-win-r32/audio-debug.jsonl; critic/rounds/round-32/evidence/seymour-omnis-win-r32/audio-debug.jsonl
Smallest fix: Record one fight each in Chapters II, III and VI and one more FFX-2 chapter, run tools/audio measure, and either confirm the targets or give the chapter its own makeup row. Measurement first; no change until read.
Acceptance: A measurement file per chapter in the review folder inside the targets.
Confidence: medium (reach proved from code, level unmeasured)

### PR-0589 [minor] feel, FFX-2 only: First-time fan: Yuna's dress change is a one-frame swap of a small hooded figure for a taller Warrior under a flash and a label, with Ixion see-through and doubled in the same frames
Chapter: Chapters V, XV, XIII dressphere change (Yuna white mage to Warrior)
Observed: Fan sheets of ffx2-vegnagun-shuyin, ffx2-ixion-djose and ffx2-den-of-woe spherechange: the white mage is replaced in one frame by the Warrior, who reads taller and a step forward; the 'Yuna Warrior GATE Blue' label sits on the guide text for a few frames; in the Ixion strip Ixion is a see-through double then jumps in front of the party. The harness counts four costume swaps (worst head 50.2 percent, feet 23.1 px) separately from same-art swaps. A dress change is a designed transformation, so the size change is partly intended; whether the pop is the look Bailey wants is his call.
Expected: A transformation reads as one continuous move; no label over readable text.
Repro: FFX-2 Chapter V or XV, Change to Warrior on Yuna; read seq-spherechange.
Evidence: critic/rounds/round-32/scratch/fan-sheets/ffx2-vegnagun-shuyin-win-r32__seq-spherechange.jpg; critic/rounds/round-32/scratch/fan-sheets/ffx2-ixion-djose-win-r32__seq-spherechange.jpg; critic/rounds/round-32/scratch/fan-sheets/ffx2-den-of-woe-win-r32__seq-spherechange.jpg
Smallest fix: Ask Bailey whether the dress change should be a blended or held transformation; no change until he answers.
Acceptance: Bailey's verdict on the Yuna dress-change strip.
Confidence: low to medium (strips read by a fan reviewer, not strip-by-strip by the chief)

### PR-0590 [minor] delivery, both: Chapter I retry reaches the first menu in 9.7 s, double round 31's 4.9 s (one noisy lane; Chapter IV 9.9 s against 10.2 s)
Chapter: Chapter I and IV retry
Observed: TRY AGAIN to first menu 9,747 ms (pro-defeat, party-prep, battle), defeat panel 974 ms after the last KO. The capture shared the machine with other lanes, so this is low confidence.
Expected: Retry no slower than the previous live build.
Repro: Lose Chapter I on seed 1, press Enter on TRY AGAIN, time to the first command menu on a quiet machine.
Evidence: critic/rounds/round-32/evidence/seymour-flux-lose-retry/run.json
Smallest fix: Re-measure on a single quiet lane; if it holds, look at release 69's load order for the party-prep step on a retry.
Acceptance: Single-lane real-key retry of Chapter I in 6 s or less to the first menu.
Confidence: low

### PR-0592 [minor] harness, FFX: Mirror Aeons needs about 20 minutes of fight, above the route harness default budget of 15 minutes (the first run stalled at link 2; the 40-minute rerun won in 20.3 min)
Chapter: mirror-aeons
Observed: First run stopped at the budget on link 2 (162 turns, 900 s); the rerun with --budget=2400000 won in 20.3 min. Round 31 measured 19.8 min.
Expected: The route budget covers the longest chapter.
Repro: route.mjs mirror-aeons win --seed=1, default budget, then with --budget=2400000.
Evidence: critic/rounds/round-32/evidence/mirror-aeons-win-r32/run.json; critic/rounds/round-32/evidence/mirror-aeons-win-r32b/run.json
Smallest fix: Add mirror-aeons to LONG_FIGHT_BUDGET_MS in critic/runner/lib/route-pure.mjs.
Acceptance: A default-budget run completes.
Confidence: high

### PR-0571 [minor] interface, FFX-2 only: Phone FFX-2 enemy-move line abbreviates the party to 'Yun / Rik / Pai' (new in r68; trades round 30's split figure for abbreviated names)
*Carried from round 31; not re-examined in round 32.*
Chapter: Chapter IV, 390x844 touch
Observed: Round 30 (r66) printed 'YUNA 168-190 / RIKKU 92-104 / PAINE 115-' with the last range broken over two lines; r68 prints 'Yun 168-190 / Rik 92-104 / Pai 115-130' on two rows and 'ACTS NEXT' became 'NEXT'. The figures are whole now; the names are abbreviated although the row has room (about 100 px free). The FFX line keeps full names. Chief read scratch/phone-intent-cmp.png.
Expected: Names whole where they fit (CHK-009), figures not split.
Repro: 390x844 touch, Chapter IV, first menu.
Evidence: critic/rounds/round-31/evidence/ffx2-bahamut-win-phone-touch/21-change-open.png; critic/rounds/round-31/scratch/phone-intent-cmp.png
Smallest fix: Keep full names and wrap by pair, or abbreviate only when a name does not fit its slot.
Acceptance: Yuna, Rikku and Paine whole at 390x844 with no figure split.
Confidence: high

### PR-0572 [minor] delivery, both: Release 68's load-diet claim is not shown by the first-command job (bytes and wait equal release 67's within noise)
*Carried from round 31; not re-examined in round 32.*
Chapter: seymour-flux, ffx2-bahamut
Observed: Wire bytes to the first menu 110.31 / 112.03 MB against 110.34 / 111.89 (desk50) and 93.56 / 94.04 against 93.65 / 92.19 (phone10); load wait 5.92 / 4.44 s against 6.03 / 4.53 and 19.8 / 42.4 against 20.1 / 39.2. The release note says the first menu no longer waits for every pose; the handoff says it changes what the menu waits for, not what is fetched.
Expected: The measured wait or bytes fall, or the note does not claim it.
Repro: critic/reviews/2a9340249-focused/budgets first-command-*-cand68.json against *-r67.json; also with ?loaddiet=off.
Evidence: critic/reviews/2a9340249-focused/budgets/first-command-phone10-pad-cand68.json
Smallest fix: Run the pair default vs ?loaddiet=off on phone10 and say which is which, or reword the player note.
Acceptance: Paired run shows the stated difference or the note is changed.
Confidence: medium

### PR-0573 [minor] delivery, both: Page memory climbs 60 to 110 MB with every chapter change, no plateau in five visits (434 to 700 MB at the board; tree peak 3,225 MB); the focused review rated it major
*Carried from round 31; not re-examined in round 32.*
Chapter: seymour-flux and ffx2-bahamut
Observed: chapter-memory job: 434, 440, 511, 624, 700 MB at the board; JS heap flat (24.7 to 31.4 MB); growth 74 percent against a proposed 10 percent budget (r67: 321 to 642, 85 percent). DOM at the board is flat from the third visit (r67 rose), but the gap pass still reads CDP nodes +485 a visit (223 detached, no HUD classes). No failure observed; the budget is proposed, not owner-approved, so the chief rates it minor.
Expected: Memory settles (cache caps 96 paintings / 900 MB; texture governor 2,600 MB).
Repro: critic/reviews/2a9340249-focused/budgets chapter-memory job; run to eight or more visits.
Evidence: critic/reviews/2a9340249-focused/budgets/chapter-memory-desk50-cand68.json
Smallest fix: Extend the job to eight changes and trace which cache holds the growth (the JS heap is not it).
Acceptance: Growth between visit 4 and 8 within 10 percent, tree peak at most 3,500 MB.
Confidence: medium

### PR-0580 [minor] delivery, both: Frame-time outliers in the live 19-chapter run: Yunalesca one 5,610 ms frame and p99 51 ms (56.2 fps), Mirror Aeons 1,026 ms, Braska 705 ms, Vegnagun 482 ms, Trema p99 74.7 ms (extends PR-0544, PR-0480, PR-0527)
*Carried from round 31; not re-examined in round 32.*
Chapter: yunalesca, mirror-aeons, braskas-final-aeon, ffx2-vegnagun-shuyin, ffx2-trema
Observed: frameTime.maxMs 5,609.7 (Yunalesca, longFramePct 2.6, fps 56.2), 1,026.2 (Mirror Aeons), 704.5 (Braska), 481.5 (Vegnagun; r66 446); Trema p99 74.7 ms, 2.3 percent over 34 ms, 56.7 fps (r66 71.2 ms, same). Other chapters 59.5 to 60 fps with p99 19 to 39 ms. The combat auditor's unit suite ran on the same host during the harness, so a host stall is possible for the 5.6 s frame: not shown either way (harness frameP99MsIsPacing false).
Expected: BUDGETS B4a to B4c: at least 59.5 fps, p99 at most 25 ms, at most 0.5 percent over 34 ms in every chapter.
Repro: Continuity harness, Yunalesca and Trema, seed 1, host idle.
Evidence: critic/rounds/round-31/continuity/yunalesca-win-r31/continuity/continuity.json; critic/rounds/round-31/continuity/ffx2-trema-win-r31/continuity/continuity.json; critic/rounds/round-31/continuity/continuity-summary.json
Smallest fix: Re-run Yunalesca on an idle host to settle the 5.6 s frame; per-frame trace of Trema against battle clock and phase (PR-0544).
Acceptance: Yunalesca max frame under 500 ms on an idle host; Trema p99 at most 25 ms.
Confidence: medium for the numbers, low for cause

### PR-0565 [minor] delivery, FFX-2: A renderer crash again: the chief's Chapter VI gap run (Leblanc) ended in "Page crashed" after about seven minutes of polling an empty menu (extends PR-0565)
Chapter: ffx2-leblanc
Observed: r31: the chief's Chapter VI gap run ended in 'Page crashed' once. Round 32 added 3 full Leblanc fights at 2560x1440 (seeds 1, 2 and 3, GPU mode, crash, pageerror and console-error listeners on): all reached results in 305 to 319 s with 0 crashes and 0 console errors. Together with the 0 of 21 earlier runs the crash is unreproduced in 0 of 24. That is not proof of absence; the first-menu command row at 2560x1440 was captured but not judged separately.
Expected: No renderer crash in a long session.
Repro: critic/rounds/round-31/gaps-chief/th-probe.mjs ffx2-leblanc with the Defend branch removed (the menu never reopens).
Evidence: critic/rounds/round-32/evidence/gaps/leblanc-2k-crash-probe.json; critic/rounds/round-32/evidence/gaps/leblanc-2k-crash-s1
Smallest fix: Capture the renderer's crash dump on the next occurrence; the long-session memory growth (PR-0573) is a suspect.
Acceptance: No crash across ten 10-minute idle runs.
Confidence: low

### PR-0479 [minor] visual, FFX only: Chapter I action shot: the humanoid Seymour's upper body leaves the top of the frame under the turn order (the creature's head is inside; the confirmer refuted the 'head cropped' wording)
*Carried from round 31; not re-examined in round 32.*
Chapter: seymour-flux
Observed: In 23-midfight.png the Mortiorchis head with spines and jaw is wholly inside the frame (about y 20 to 300); the humanoid torso at the right runs off the top edge and the turn-order icons overlap it. In seq-party-action f02 the same figure is cropped at the top. Carried at minor since round 30; the auditor's raise to major is not supported.
Expected: Outside an intended close-up the boss stays in frame.
Repro: Chapter I by real keys, seed 1, first attack.
Evidence: critic/rounds/round-31/evidence/seymour-flux-win/23-midfight.png; critic/rounds/round-31/evidence/seymour-flux-win/seq-party-action/f02.jpg
Smallest fix: Lower the action camera for this boss or move the turn order off the quad.
Acceptance: Same state: the torso is wholly inside the frame.
Confidence: high

### PR-0530 [minor] feel, both: Question for Bailey: hard cuts rose from 75 to 3,864 (22 a minute) because ?swapscope=wide turned the planned smear cuts on in 13 more chapters; the fan reads them as camera jerks and pops (Chapter I battle start, the Chapter IV sphere change, Braska seams)
Chapter: all; fan captures in seymour-flux, ffx2-bahamut, braskas-final-aeon
Observed: Unchanged: 3,990 planned hard cuts in 10,638.5 s (22.5 a minute), 4,772 smears planned, 4,606 swaps smeared. Awaiting Bailey's verdict on the look.
Expected: Bailey's judgment of the planned smear cuts and the pro camera shots (PR-0530, PR-0521).
Repro: Chapter I and IV by real keys; see the fan's captures seq-transition-into-battle and seq-spherechange.
Evidence: critic/rounds/round-31/evidence/seymour-flux-win/seq-transition-into-battle; critic/rounds/round-31/evidence/ffx2-bahamut-win/seq-spherechange; critic/rounds/round-31/continuity/continuity-summary.json
Smallest fix: Show Bailey the strips and ask; build nothing until he answers.
Acceptance: A recorded verbatim judgment.
Confidence: medium

### PR-0473 [minor] feel, FFX only (Chapter I): A revive is a dissolve with no rise: Kimahri returns as a pale see-through figure over Yuna (carried, re-observed by the fan in three Chapter I runs)
*Carried from round 31; not re-examined in round 32.*
Chapter: seymour-flux
Observed: seq-party-action f07 to f09 at 1600, 2000 and the phone: the revived figure is pale for three frames and floats above the floor line with Yuna drawn through it. See PR-0570 for the one-frame step.
Expected: A rise that reads as standing up.
Repro: Chapter I turn 3, Mega Phoenix with Kimahri down.
Evidence: critic/rounds/round-31/evidence/seymour-flux-win/seq-party-action/f07.jpg; critic/rounds/round-31/evidence/seymour-flux-win-2k/seq-party-action
Smallest fix: As PR-0570, then a rise.
Acceptance: Strip of the revive shows one figure, grounded, from frame 0.
Confidence: high

### PR-0534 [minor] visual, FFX only: Lulu's rig head reads 5 to 15 percent different at ready, cast and idle in the FFX chapters (about 470 of the 476 CHK-026 head fails; likely the head part's box, not a visible jump)
*Carried from round 31; not re-examined in round 32.*
Chapter: Chapters II, III, VII to XIX with Lulu
Observed: headRig 920 swaps read from the rig's own head mesh; the chapter strips show no visible jump. Harness head fails 476 (round 30b 489).
Expected: The harness reads the head from the part's own box.
Repro: Continuity harness, braskas-final-aeon, strip swap-172-lulu-ready-item.jpg (round 30b path).
Evidence: critic/rounds/round-31/continuity/continuity-summary.json
Smallest fix: Read the rig head with its own box in critic/runner/lib/continuity-rig.mjs, or show the strips are not visible.
Acceptance: Lulu rig head swaps under 5 percent or shown not visible.
Confidence: medium

### PR-0529 [minor] visual, FFX-2 only: FFX-2 Chapter XII (Trema): Paragon's feet move 10.5 px at the cast-to-idle swap with nine see-through frames and height x1.13 (carried)
*Carried from round 31; not re-examined in round 32.*
Chapter: ffx2-trema
Observed: strip swap-147: two overlapped Paragons for nine frames, feet 10.5 px apart (22.2 px from the pixels); the only feet-over fail of the 19 chapters at that size.
Expected: Feet within 2 px, a cut or a short blend.
Repro: Continuity harness ffx2-trema, seed 1.
Evidence: critic/rounds/round-31/continuity/ffx2-trema-win-r31/continuity/strips/swap-147-paragon-cast-idle.jpg
Smallest fix: Register Paragon cast and idle feet; shorten the blend on this boss.
Acceptance: Paragon swaps have 3 or fewer ghost frames, feet within 2 px.
Confidence: high

### PR-0516 [minor] interface, both: Panels over painted actors and live controls (CHK-008 FAIL, carried): the Chapter I E card covers the NOW tile of the turn order; the Vegnagun chain counter, panels and damage numbers stack; the 'Possessed ...' banner crosses the aeon's body
*Carried from round 31; not re-examined in round 32.*
Chapter: Chapter I, Chapter V, Chapter III seams
Observed: At 1600 and 2000 the opened E card sits over the current actor's turn-order tile ('3RD IN QUEUE' over 'NOW') and Seymour's figure (R31-INT-02). The fan lists the same class: the Vegnagun chain box cut at the screen edge ('x1.9') with piled damage numbers, the Possessed Ixion/Valefor/Bahamut/Yu Yevon banner as a dark bar across the aeon, and the big turn cut-in covering the party at turn start (PR-0536). The 80-state sweep at 1280x720 and 2560x1440 was not re-run (PR-0552, PR-0553, PR-0560 carried).
Expected: No panel hides the current actor's turn slot or a figure it should not (CHK-008).
Repro: Chapter I first menu, press E, screenshot.
Evidence: critic/rounds/round-31/evidence/seymour-flux-win/12-intent-E.png; critic/rounds/round-31/evidence/seymour-flux-win-2k/12-intent-E.png; critic/rounds/round-31/evidence/ffx2-vegnagun-shuyin-win/seq-action-playing; critic/rounds/round-31/evidence/braskas-final-aeon-win/seq-seam-2
Smallest fix: Anchor the intent card left of or below the turn order; move the possessed banner off the body.
Acceptance: Intersection of the card and the NOW tile is 0 at 1280x720, 1600x900, 2000x1012, 2560x1440 in Chapter I.
Confidence: high

### PR-0502 [minor] interface, both: The boss's bark box, the opening quip banner and the turn-intro wipe cover the first command menu (carried, stalled, now also on retry)
*Carried from round 31; not re-examined in round 32.*
Chapter: Chapter I first menu; Chapter I and IV retry
Observed: Seymour's line 'It's quieter on the other side.' covers SPECIAL, WHITE MAGIC and ITEMS at 1600, 2000 and the phone while the menu is awaiting input; the banner lasts under 1 s (gap pass); on both retries the first menu is under the actor's full-height portrait wipe. Seymour's banter card hides Skills and Magic rows and Tidus's plate (visual auditor, 10-first-menu-coach).
Expected: The command rows are visible while the menu awaits input, or the menu does not await until they are.
Repro: Chapter I real keys, first menu, no key pressed; or lose and TRY AGAIN.
Evidence: critic/rounds/round-31/evidence/seymour-flux-win/10-first-menu-coach.png; critic/rounds/round-31/evidence/seymour-flux-lose-retry/3-retry-menu.jpg; critic/rounds/round-31/evidence/ffx2-bahamut-lose-retry/3-retry-menu.jpg
Smallest fix: Place the bark clear of the command stack or hold awaiting until it has cleared.
Acceptance: At awaitingMenu true the command rows are unobscured.
Confidence: high

### PR-0540 [minor] interface, FFX only: Chapter I intent card shows the IF YOU ATTACK header with no body (carried, stalled; third review at the same severity)
*Carried from round 31; not re-examined in round 32.*
Chapter: Chapter I
Observed: The conditional body (Delay Attack or Buster punished with party-wide Slowga; Protect under 75 percent; Reflect and phase 2 under 50 percent) is in the DOM but the card height clips it until J is held. Chapter II shows its body.
Expected: The conditional half is readable by default or the header is not drawn without a body.
Repro: Chapter I, seed 1, first menu, press E.
Evidence: critic/rounds/round-31/evidence/seymour-flux-win/12-intent-E.png; critic/rounds/round-31/evidence/seymour-flux-win-2k/12-intent-E.png
Smallest fix: Let the card grow to its content as Chapter II's does.
Acceptance: E shows a non-empty IF YOU ATTACK body without J; scrollHeight equals clientHeight.
Confidence: high

### PR-0541 [minor] interface, FFX-2 only: Chapter IV desktop CHANGE list: 'GRANTS: BLUE' is pink on cream and nearly invisible, and a grant is never explained (carried, stalled)
*Carried from round 31; not re-examined in round 32.*
Chapter: ffx2-bahamut
Observed: The unselected WARRIOR row's GRANTS: BLUE is nearly invisible; Gunner's GRANTS: GREEN on the selected row reads.
Expected: Readable rows and one line saying what a grant is.
Repro: Chapter IV, ArrowDown to CHANGE, Enter.
Evidence: critic/rounds/round-31/evidence/ffx2-bahamut-win/21-change-open.png; critic/rounds/round-31/evidence/ffx2-bahamut-win-2k/21-change-open.png
Smallest fix: Use the row ink for unselected GRANTS and add one explanatory line.
Acceptance: GRANTS contrast at least 4.5:1 selected and unselected.
Confidence: high

### PR-0518 [minor] interface, both: Phone 390x844: CHANGE tiles clip their text (UNNER, GRANTS: BLUI), the pause header wraps over the tab dots, the tab strip is cut at CHAPTER with no scroll cue (ACCESSIBILITY, CONTROLS and MUSIC are reached only by an unprompted swipe), the options pane stops at a half row, and the phone pause shows keyboard hints (carried, stalled; merges PR-0554, R31-ONB-01)
*Carried from round 31; not re-examined in round 32.*
Chapter: Chapter I and IV phone
Observed: The pause chip is a 46x46 target and a tap opens the pause (gap pass). A real touch swipe on the strip scrolls it; nothing hints at it. Smallest visible text on the phone pause is 14 px; no horizontal page scroll (scrollWidth 390).
Expected: Every tab reachable by sight; tiles whole; touch hints on a touch device.
Repro: 390x844 touch, Chapter I, tap the chip, read the strip.
Evidence: critic/rounds/round-31/evidence/gaps/seymour-flux-phone-pause/phone-pause-0.png; critic/rounds/round-31/evidence/gaps/seymour-flux-phone-pause2/swipe1.png; critic/rounds/round-31/evidence/ffx2-bahamut-win-phone-touch/21-change-open.png
Smallest fix: Fade the strip edge as a scroll cue; hide keyboard hints on touch; fit the tile text.
Acceptance: Strip shows an edge cue; no clipped tile text at 390x844.
Confidence: high

### PR-0542 [minor] interface, both: Pause chrome labels are low contrast, about 1.9 to 3.5:1 by pixel sampling (carried, stalled)
*Carried from round 31; not re-examined in round 32.*
Chapter: pause
Observed: header 1.88:1, BATTLE STATS 2.37, H PAINTING ONLY 2.83, inactive tab 3.49, options section titles 2.38 (thin antialiased text, rough figure).
Expected: At least 4.5:1 for small text.
Repro: Pause screenshot, sample.
Evidence: critic/rounds/round-31/evidence/seymour-flux-win/14-pause-Esc.png
Smallest fix: Raise the label tokens.
Acceptance: Sampled contrast at least 4.5:1.
Confidence: medium

### PR-0543 [minor] interface, FFX only: FFX target mode lacks the Enter/Esc strip FFX-2 shows, and the hint strip calls the guide 'Intel' (carried, stalled; CHK-020 polish difference)
*Carried from round 31; not re-examined in round 32.*
Chapter: FFX target mode
Observed: FFX-2 target frames show ENTER CONFIRM / ESC BACK; FFX frames do not; the hint strip labels the guide Intel while its panel says GUIDE.
Expected: The same help in both, in one word.
Repro: Chapter I, Attack, target step.
Evidence: critic/rounds/round-31/evidence/seymour-flux-win/16-target-single.png
Smallest fix: Add the strip and unify the word.
Acceptance: Both games print the strip; one word for the guide.
Confidence: high

### PR-0483 [minor] interface, FFX (Chapter I phone): A touch player's route to Poison Fang and Holy Water in the 27-item Chapter I list: the pager and the Holy Water target step work; Poison Fang and the target tap were not tapped (the round-32 phone defeats are the route harness, not the product)
Chapter: seymour-flux
Observed: The phone Chapter I routes were lost at seeds 1 and 2 (23 of 35 and 20 of 39 picks wanted Poison Fang or Holy Water and took Attack; desktop 2 of 53, with no Attack substitutions; Bahamut at 390x844 touch 0 mismatches). The chief's gap pass opened ITEMS by real taps ('1-6 OF 27', the previous button disabled), tapped the 44x44 next button ('7-12 OF 27') and tapped HOLY WATER, which opened its target step ('HOLY WATER -> TIDUS', help text 'Tap another ally to switch'). The route harness (critic/runner/lib/route-fight.mjs lines 229 to 238) reads only the six visible rows and falls back to Attack, which is how the run lost; CommandMenuPaging.ts and its unit test pass. The first draft of this finding was a major phone defect with low confidence on cause; the gap pass refutes it as a product defect, and it is filed minor for what stays unproven.
Expected: A touch player can reach every row the advisor names and aim an ally.
Repro: 390x844 touch, Chapter I, Items, swipe to Holy Water, Yuna as target.
Evidence: critic/rounds/round-32/evidence/gaps/phone-items-pager/run.json; critic/rounds/round-32/evidence/seymour-flux-win-r32-phone-touch/run.json; critic/rounds/round-32/evidence/seymour-flux-win-r32-phone-s2-touch/turn-log.json
Smallest fix: Teach the route harness to tap the page button when the wanted row is not among the six visible rows (PR-0539); then tap Poison Fang and a target plate with real touch events.
Acceptance: A 390x844 touch run of Chapter I takes Holy Water and Poison Fang as named (want equals took on every row).
Confidence: high that the harness caused the defeats; medium that the player path is whole

### PR-0558 [minor] interface, both (F1 HUD: Chapters I and IV): At TEXT SIZE 115 and 130 the desktop F1 HUD overlaps: the boss ribbon over the guide chip and the intent panel over the turn strip; the Chapter IV help band sat under the PAUSE chip (merges R68-P1)
*Carried from round 31; not re-examined in round 32.*
Chapter: Chapter I, IV
Observed: Focused review R68-P1 (candidate bundle, 1280x720 and 1600x900). The gap pass set TEXT SIZE 100 to 115 to 130 on the live pause and saw data-text-size set and the tab strip larger; it did not capture the battle HUD at 130 (r68 now scales the desktop HUD, so PR-0559 is probably fixed, not re-verified).
Expected: No overlap at any text size.
Repro: Pause, ACCESSIBILITY, TEXT SIZE 130, resume, open E and G.
Evidence: critic/reviews/2a9340249-focused.json; critic/rounds/round-31/evidence/gaps/seymour-flux-a11y-keys/a11y-after-changes.png
Smallest fix: Reflow the ribbon and the intent panel under the larger scale.
Acceptance: Rect intersections 0 at 130 in Chapters I and IV.
Confidence: medium

### PR-0549 [minor] visual, both: Party figures stack on each other in staging: Auron is almost wholly behind Tidus in Chapter III; the party reads as toys against Vegnagun and Bahamut (carried)
*Carried from round 31; not re-examined in round 32.*
Chapter: braskas-final-aeon, ffx2-vegnagun-shuyin
Observed: Only Auron's coat edge shows behind Tidus in 23-midfight (two figures read). The fan also lists Ixion's body sitting through Yu Yevon.
Expected: Three readable figures.
Repro: Chapter III by real keys, seed 1, 23-midfight.
Evidence: critic/rounds/round-31/evidence/braskas-final-aeon-win/23-midfight.png
Smallest fix: Offset Auron's slot in this chapter's layout.
Acceptance: All three heroes visible at the first menu.
Confidence: high

### PR-0521 [minor] feel, FFX-2 (Chapter IV): Pro camera framing in the action stills: Bahamut zooms and shifts within a turn; the sphere change swings the scene sideways (carried; see PR-0530 for the question to Bailey)
Chapter: ffx2-bahamut
Observed: Carried and widened by the first-time fan: a hard camera cut mid-action in Seymour Flux (a boss framing flips to a wide shot, the party at about half size, frames 2 to 3 of seq-action-playing), in Braska (a tight dark close-up to a wide shot, party about two thirds), in the Den of Woe seams (the party jumps about 1.8 times closer; seam 3's first frame has no party), and in Sin (the head about 1.4 times larger after the Yuna cut-in). 22.5 hard cuts a minute (3,990 in 10,638 s) are the planned smear cuts (PR-0530) awaiting Bailey.
Expected: A coherent camera (Bailey's judgment, PR-0530).
Repro: Chapter IV, Rikku WARRIOR change at 1600 and 2000.
Evidence: critic/rounds/round-31/evidence/ffx2-bahamut-win/seq-spherechange; critic/rounds/round-31/evidence/ffx2-bahamut-win-2k/seq-spherechange
Smallest fix: Ask Bailey.
Acceptance: A recorded verdict.
Confidence: medium

### PR-0481 [minor] feel, both: Time to the first command: about 42 s in Chapter I and 21 to 23 s in Chapter IV from picking the chapter (pre-scene read included); the retry is now 4.9 s (Chapter I) and 10.2 s (Chapter IV)
*Carried from round 31; not re-examined in round 32.*
Chapter: Chapters I and IV
Observed: Round 30b: 43.2 s and 26.6 s; retry 16.5 s and 9.9 s. The chained chapters retry in 9.6 to 13.6 s (this round's gap runs).
Expected: A short wait to the first command.
Repro: Chapter select to awaitingMenu with a timer.
Evidence: critic/rounds/round-31/evidence/seymour-flux-win/run.json; critic/rounds/round-31/gaps-chief/lose-braskas-final-aeon.log
Smallest fix: See PR-0567.
Acceptance: As PR-0567.
Confidence: high

### PR-0532 [minor] audio, FFX only: Chapter I's win fanfare is cut at the results swap and restarted from its first note (carried; contradicts D-1295 'one fanfare')
Chapter: seymour-flux
Observed: Carried and reached further: the early victory cue (FFX only) is in the fading list at gain 0.64 and 0.002 with no current track 4.0 s (Anima) and 17.4 s (Natus) before the results panel, and the results snapshot then shows victory-ffx current at gain 1: the same cut-and-restart round 31 read in Chapter I, now in two more chapters. Two snapshots, not a dense timeline; a fade could also be the cue ending.
Expected: D-1295: one fanfare.
Repro: Chapter I win, dense audioDebug timeline from the last blow.
Evidence: critic/rounds/round-32/evidence/seymour-anima-macalania-win-r32/audio-debug.jsonl; critic/rounds/round-32/evidence/seymour-natus-win-r32/audio-debug.jsonl
Smallest fix: Skip the exit's stopMusic for a win when the results cue is already current.
Acceptance: A 100 ms timeline shows victory-ffx continuous.
Confidence: medium

### PR-0514 [minor] audio, both: The first UI sounds of a session fall back to the procedural synth, more often and for longer this round (7 of 11 logged runs, up to 14 sounds in the FFX-2 chapters; round 30: 2 of 17)
*Carried from round 31; not re-examined in round 32.*
Chapter: title and chapter select, first 2 to 7 s of a fresh profile
Observed: ffx2-bahamut-win-2k 13 synth sounds 3.47 to 6.05 s; phone 9; vegnagun 14 (3.83 to 6.58 s); the Chapter I runs are clean. Cause not established (sprites 2.7 and 4.6 MB over the live network, host load, or the r68 load order).
Expected: CHK-001 item 3: nothing falls back to synth.
Repro: Fresh profile, FFX-2 chapter select to Chapter IV; move and confirm within 3 to 6 s.
Evidence: critic/rounds/round-31/evidence/ffx2-bahamut-win-2k/audio-debug.jsonl; critic/rounds/round-31/evidence/ffx2-vegnagun-shuyin-win/audio-debug.jsonl
Smallest fix: Gate the UI cue on the first sprite decode, or start its fetch ahead of art.
Acceptance: Ten cold runs log no synth entry in the first 7 s.
Confidence: medium for the entries, none for the cause

### PR-0504 [minor] audio, FFX-2 only: Chapter IV win results are silent on the default desktop build, by a release 62 pick nobody has heard (carried question for Bailey; re-observed at 1600 and 2000)
Chapter: ffx2-bahamut
Observed: Carried and re-observed in round 32: Chapter IV desktop wins (1600x900, 2000x1012) end with music.current null at results; the 390x844 touch win plays 'pause' at results because the pass is off on phone class. D-1352 keeps silence until Bailey has listened.
Expected: Bailey's decision.
Repro: Chapter IV win.
Evidence: critic/rounds/round-31/evidence/ffx2-bahamut-win/audio-debug.jsonl
Smallest fix: Ask Bailey.
Acceptance: A recorded verdict.
Confidence: high

### PR-0523 [minor] interface, both: Esc from the command menu closes an open guide panel first, so the pause seems ignored (carried; re-observed in Den of Woe, Trema and Via Purifico; a gap-pass Esc after ACCESSIBILITY row changes took more than 1.2 s to close, not reproduced as a defect)
*Carried from round 31; not re-examined in round 32.*
Chapter: ffx2-den-of-woe, ffx2-trema, isaaru-via-purifico
Observed: pOpens and resumedByEsc are true; three pause captures read screen battle.
Expected: The first Esc pauses or the panel says it closed first.
Repro: Open the guide, press Esc.
Evidence: critic/rounds/round-31/continuity/ffx2-trema-win-r31/14-pause-Esc.png
Smallest fix: As carried.
Acceptance: As carried.
Confidence: medium

### PR-0550 [minor] interface, FFX only: Gamepad: the A that confirms the target also stops Wakka's first reel as the overlay opens (carried; the pad evidence is reused from round 30b under a written argument)
*Carried from round 31; not re-examined in round 32.*
Chapter: Wakka Overdrive
Observed: Not re-driven this round (reused from round 30b).
Expected: The first reel runs until pressed.
Repro: As in round 30b.
Evidence: critic/rounds/round-30/gaps2/g2
Smallest fix: As carried.
Acceptance: As carried.
Confidence: medium

### PR-0460 [minor] combat, FFX only: Chapter III possession links 3 to 6 Summon rows still not seen in a browser this round (carried; reused from round 30b under a written argument)
Chapter: braskas-final-aeon
Observed: Carried: the real-key Braska run (284 turns, 6 seams) used Summon once (Bahamut, link 1); links 3 to 6 never opened the Summon or Grand Summon rows. The engine probe ch3 shows every row enabled with a picker of five aeons (md5-identical to round 31).
Expected: Seen by real keys.
Repro: As round 30b.
Evidence: critic/rounds/round-30/gaps2
Smallest fix: As carried.
Acceptance: As carried.
Confidence: medium

### PR-0503 [minor] process, both: Prep agency (STATS, SPHERE GRID, EQUIPMENT, ITEMS, OVERDRIVE; DRESSSPHERES, ACCESSORIES) and the r68 prep tab roles were never walked by key or touch (carried, the fourteenth review; the pause ACCESSIBILITY tab was walked by the gap pass)
*Carried from round 31; not re-examined in round 32.*
Chapter: all
Observed: 291 entries, 11 of them prep first tab; none opens another tab or changes a value. The gap pass walked pause E (Tidus, Yuna, Kimahri, Chapter, Guide, Options, Accessibility, Controls, Music), TEXT SIZE 100 to 115 to 130 (data-text-size), REDUCE MOTION, REDUCE FLASHES, LOW EFFECTS toggles. Not done: COLOUR VISION on a frame, key remap, prep tabs, hold-Home reset. RUBRIC section 8 requires the method check before another attempt; none is written.
Expected: Per game and input: each prep tab opened, one change made, visible in the first menu.
Repro: Add one scripted real-input walk to the capture owner.
Evidence: critic/rounds/round-31/evidence/index.json; critic/rounds/round-31/evidence/gaps/seymour-flux-a11y/run.json
Smallest fix: Write the method check; assign the walk to the capture owner's script.
Acceptance: A run.json with the walks and the changed value in the first menu, both games, both sizes.
Confidence: high

### PR-0520 [minor] delivery, both: First-load time on the live URL still not measured in a browser (carried, the fourth review)
*Carried from round 31; not re-examined in round 32.*
Chapter: title
Observed: Node-side arithmetic: cold title about 3.1 MB on the wire (bundle 1,450,107 B brotli in 0.47 s), inside the proposed 4 MB. No browser timing.
Expected: Title usable under 5 s cold on a named profile.
Repro: PYREFLY_BROWSER=gpu node critic/runner/lib/coldload.mjs --base=https://echoesofspira.com/
Evidence: critic/reviews/2a9340249-focused/cold-cand/gaps/coldload/out.json
Smallest fix: Run coldload.mjs against the live URL.
Acceptance: A report line with the median and the throttled load.
Confidence: high that it is unmeasured

### PR-0544 [minor] delivery, FFX-2: FFX-2 Trema 56.7 fps, p99 74.7 ms, 2.3 percent over 34 ms (carried since round 30; see PR-0580 for the other outliers)
*Carried from round 31; not re-examined in round 32.*
Chapter: ffx2-trema
Observed: Live run: 56.7 fps, 1,588 of 67,748 frames over 34 ms, max 158 ms.
Expected: B4a to B4c.
Repro: Trema continuity.
Evidence: critic/rounds/round-31/continuity/ffx2-trema-win-r31/continuity/continuity.json
Smallest fix: Per-frame trace first.
Acceptance: p99 at most 25 ms.
Confidence: high for numbers

### PR-0547 [minor] interface, FFX-2 only: FFX-2 results ledger names the dressphere Rikku started in, not the one she finished in (carried, re-observed)
*Carried from round 31; not re-examined in round 32.*
Chapter: ffx2-bahamut
Observed: As round 30b.
Expected: The finishing dress.
Repro: Chapter IV win, change Rikku, results.
Evidence: critic/rounds/round-31/evidence/ffx2-bahamut-win/31-results.png
Smallest fix: As carried.
Acceptance: As carried.
Confidence: medium

### PR-0539 [minor] harness, both: Critic harness limits (carried): the phone Items list is 6 rows of 27 for the route, timed sequences carry no frame timestamps, the capture owner's retry folder for Chapter IV mixes runs and its images are not indexed (R31-U1), and the cardFirst advisor measurement describes a card not on screen (R31-INT-09)
Chapter: critic runner
Observed: Carried and widened: the phone Items list is 6 rows of 27 for the route and the harness never taps the page button (PR-0483); the route budget misses Mirror Aeons (PR-0592); the post scene still is taken before the scene (PR-0593); the engine logs of Vegnagun, Ixion, Sin core and Sin face end before the final victory event and the run.json fight step reads 'undecided' (those four victories rest on the results screen text, which reads Victory with the clear time).
Expected: One run per folder, every image indexed.
Repro: ls --time-style=full-iso on the folder against run.json.
Evidence: critic/rounds/round-31/evidence/ffx2-bahamut-lose-retry/run.json
Smallest fix: Re-run into a clean folder with the images indexed.
Acceptance: A folder whose run.json and images share one run and are in index.json with verified true.
Confidence: high

### PR-0099 [minor] audio, both: Stand-in or borrowed scene beds and battle cues in eleven chapters (carried; not re-judged by ear)
*Carried from round 31; not re-examined in round 32.*
Chapter: eleven chapters
Observed: Carried from round 30b; not re-examined by any round-31 lane, so nothing is claimed beyond the title.
Expected: as in the earlier rounds that opened it
Repro: as in the entry of critic/rounds/round-30b.json
Evidence: critic/rounds/round-30b.json
Smallest fix: unchanged from round 30b
Acceptance: unchanged from round 30b
Confidence: medium

### PR-0515 [minor] interface, FFX-2 only: Doublecast advice says NO MP while the spell picker shows the MP cost (carried, not re-examined)
*Carried from round 31; not re-examined in round 32.*
Chapter: doublecast
Observed: Carried from round 30b; not re-examined by any round-31 lane, so nothing is claimed beyond the title.
Expected: as in the earlier rounds that opened it
Repro: as in the entry of critic/rounds/round-30b.json
Evidence: critic/rounds/round-30b.json
Smallest fix: unchanged from round 30b
Acceptance: unchanged from round 30b
Confidence: medium

### PR-0485 [minor] narrative, both: Portrait expression never follows the line; 46 emotion tags are read by nothing (carried; no story file changed)
Chapter: all
Observed: Carried: dboxTimeline shows one portrait file per speaker for the whole scene (Leblanc: rikku-x2.webp, paine.webp); no expression change on grief lines. Awaits Bailey.
Expected: as in the earlier rounds that opened it
Repro: as in the entry of critic/rounds/round-30b.json
Evidence: critic/rounds/round-30b.json
Smallest fix: unchanged from round 30b
Acceptance: unchanged from round 30b
Confidence: medium

### PR-0537 [minor] visual, FFX only: The live Chapter I boss card has no approved target (carried, not re-examined)
*Carried from round 31; not re-examined in round 32.*
Chapter: Chapter I
Observed: Carried from round 30b; not re-examined by any round-31 lane, so nothing is claimed beyond the title.
Expected: as in the earlier rounds that opened it
Repro: as in the entry of critic/rounds/round-30b.json
Evidence: critic/rounds/round-30b.json
Smallest fix: unchanged from round 30b
Acceptance: unchanged from round 30b
Confidence: medium

### PR-0552 [minor] interface, FFX-2 only: FFX-2 Mega Flare telegraph: the CHAIN counter is drawn over the ATTACK row (carried; not re-observed)
*Carried from round 31; not re-examined in round 32.*
Chapter: Chapter IV
Observed: Carried from round 30b; not re-examined by any round-31 lane, so nothing is claimed beyond the title.
Expected: as in the earlier rounds that opened it
Repro: as in the entry of critic/rounds/round-30b.json
Evidence: critic/rounds/round-30b.json
Smallest fix: unchanged from round 30b
Acceptance: unchanged from round 30b
Confidence: medium

### PR-0555 [minor] prep, FFX only: The prep STATS tab keeps the pre-spend value after a Sphere Grid activation (carried; not walked)
*Carried from round 31; not re-examined in round 32.*
Chapter: prep
Observed: Carried from round 30b; not re-examined by any round-31 lane, so nothing is claimed beyond the title.
Expected: as in the earlier rounds that opened it
Repro: as in the entry of critic/rounds/round-30b.json
Evidence: critic/rounds/round-30b.json
Smallest fix: unchanged from round 30b
Acceptance: unchanged from round 30b
Confidence: medium

### PR-0556 [minor] onboarding, FFX only: The Sphere Grid card says Enter acts, but Enter after the card starts the battle (carried; not walked)
*Carried from round 31; not re-examined in round 32.*
Chapter: prep
Observed: Carried from round 30b; not re-examined by any round-31 lane, so nothing is claimed beyond the title.
Expected: as in the earlier rounds that opened it
Repro: as in the entry of critic/rounds/round-30b.json
Evidence: critic/rounds/round-30b.json
Smallest fix: unchanged from round 30b
Acceptance: unchanged from round 30b
Confidence: medium

### PR-0557 [minor] prep, FFX only: OVERDRIVE modes on the prep tab have no keyboard route (carried; not walked)
*Carried from round 31; not re-examined in round 32.*
Chapter: prep
Observed: Carried from round 30b; not re-examined by any round-31 lane, so nothing is claimed beyond the title.
Expected: as in the earlier rounds that opened it
Repro: as in the entry of critic/rounds/round-30b.json
Evidence: critic/rounds/round-30b.json
Smallest fix: unchanged from round 30b
Acceptance: unchanged from round 30b
Confidence: medium

### PR-0559 [minor] onboarding, both: TEXT SIZE scaled the pause and the phone command menu but not the desktop battle HUD (r68 a11y-text now scales it per the focused review; not re-verified live)
*Carried from round 31; not re-examined in round 32.*
Chapter: all
Observed: Carried from round 30b; not re-examined by any round-31 lane, so nothing is claimed beyond the title.
Expected: as in the earlier rounds that opened it
Repro: as in the entry of critic/rounds/round-30b.json
Evidence: critic/rounds/round-30b.json
Smallest fix: unchanged from round 30b
Acceptance: unchanged from round 30b
Confidence: medium

### PR-0560 [minor] interface, FFX only: Chapter I ally target with the Items list open: rows cover the TARGET plate and hand (carried; not re-observed)
*Carried from round 31; not re-examined in round 32.*
Chapter: Chapter I
Observed: Carried from round 30b; not re-examined by any round-31 lane, so nothing is claimed beyond the title.
Expected: as in the earlier rounds that opened it
Repro: as in the entry of critic/rounds/round-30b.json
Evidence: critic/rounds/round-30b.json
Smallest fix: unchanged from round 30b
Acceptance: unchanged from round 30b
Confidence: medium

### PR-0561 [minor] prep, FFX-2 only: The FFX-2 prep STATS tab does not say it leaves accessories and the Garment Grid out (carried; not walked)
*Carried from round 31; not re-examined in round 32.*
Chapter: prep
Observed: Carried from round 30b; not re-examined by any round-31 lane, so nothing is claimed beyond the title.
Expected: as in the earlier rounds that opened it
Repro: as in the entry of critic/rounds/round-30b.json
Evidence: critic/rounds/round-30b.json
Smallest fix: unchanged from round 30b
Acceptance: unchanged from round 30b
Confidence: medium

### PR-0562 [minor] onboarding, both: On the phone the first-run guide step 3 pointer covers part of the TIP text (carried; not re-observed)
*Carried from round 31; not re-examined in round 32.*
Chapter: phone
Observed: Carried from round 30b; not re-examined by any round-31 lane, so nothing is claimed beyond the title.
Expected: as in the earlier rounds that opened it
Repro: as in the entry of critic/rounds/round-30b.json
Evidence: critic/rounds/round-30b.json
Smallest fix: unchanged from round 30b
Acceptance: unchanged from round 30b
Confidence: medium

### PR-0563 [minor] delivery, both: WebKit 26.6: party-plate portraits draw as noise at the first menu (carried; Chromium only this round)
*Carried from round 31; not re-examined in round 32.*
Chapter: Chapter I
Observed: Carried from round 30b; not re-examined by any round-31 lane, so nothing is claimed beyond the title.
Expected: as in the earlier rounds that opened it
Repro: as in the entry of critic/rounds/round-30b.json
Evidence: critic/rounds/round-30b.json
Smallest fix: unchanged from round 30b
Acceptance: unchanged from round 30b
Confidence: medium

### PR-0564 [minor] delivery, both: WebKit 26.6 holds 12 to 26 fps at the first menu (carried; Chromium only this round)
*Carried from round 31; not re-examined in round 32.*
Chapter: all
Observed: Carried from round 30b; not re-examined by any round-31 lane, so nothing is claimed beyond the title.
Expected: as in the earlier rounds that opened it
Repro: as in the entry of critic/rounds/round-30b.json
Evidence: critic/rounds/round-30b.json
Smallest fix: unchanged from round 30b
Acceptance: unchanged from round 30b
Confidence: medium

### PR-0566 [minor] feel, both: First sight still stalls: the first 0.1 to 4.1 s of every battle carry 5 to 9 frames over 100 ms (carried; the live run records the worst frames, not when they fall)
*Carried from round 31; not re-examined in round 32.*
Chapter: all
Observed: Carried from round 30b; not re-examined by any round-31 lane, so nothing is claimed beyond the title.
Expected: as in the earlier rounds that opened it
Repro: as in the entry of critic/rounds/round-30b.json
Evidence: critic/rounds/round-30b.json
Smallest fix: unchanged from round 30b
Acceptance: unchanged from round 30b
Confidence: medium

### PR-0568 [minor] feel, both: hz-matrix: chained beats differ 25 to 30 ms between 60 and 120 or 144 Hz (carried; not re-run)
*Carried from round 31; not re-examined in round 32.*
Chapter: Chapter IV
Observed: Carried from round 30b; not re-examined by any round-31 lane, so nothing is claimed beyond the title.
Expected: as in the earlier rounds that opened it
Repro: as in the entry of critic/rounds/round-30b.json
Evidence: critic/rounds/round-30b.json
Smallest fix: unchanged from round 30b
Acceptance: unchanged from round 30b
Confidence: medium

### PR-0591 [polish] interface, FFX-2 only: First-time fan: the CHAIN counter box changes place from frame to frame (right edge, under the tail, mid-screen) and is clipped at the right edge
Chapter: Chapter V Vegnagun
Observed: In seq-action-playing the CHAIN box moves in the 10 frames and is cut off at the screen edge in several; the guide and intent cards also sit over Shiva (Fallen Aeons) and the tail (Vegnagun).
Expected: A counter sits still and inside the screen.
Repro: Chapter V chain attack; fan sheet ffx2-vegnagun-shuyin-win-r32__seq-action-playing.
Evidence: critic/rounds/round-32/scratch/fan-sheets/ffx2-vegnagun-shuyin-win-r32__seq-action-playing.jpg; critic/rounds/round-32/scratch/fan-sheets/ffx2-fallen-aeons-win-r32__seq-party-action.jpg
Smallest fix: Anchor the counter to one slot.
Acceptance: The CHAIN box does not move between consecutive frames and is not clipped.
Confidence: medium

### PR-0593 [polish] harness, both: 30-post-scene.png is taken before the post scene (it plays after CONFIRM): eight runs log 'screen wanted cutscene got results' and the scene still is missing
Chapter: six chapters
Observed: The scene is reachable and its lines were read after CONFIRM (33-after-confirm-scene.png, Leblanc: Rikku, "That's for robbing our airship!"), but the 30 capture reads results.
Expected: The post-scene frame is asserted where the scene is.
Repro: Read run.json fails of the six runs.
Evidence: critic/rounds/round-32/evidence/ffx2-leblanc-win-r32/run.json
Smallest fix: Assert 33-after-confirm-scene.png as the post-scene capture.
Acceptance: No UNVERIFIED on the post-scene frame.
Confidence: high

### PR-0577 [polish] interface, FFX-2 only: FFX-2 target flag plate overlaps the command panel edge and clips the status tag ("Curse") at 1280 to 2000 wide (new in r68)
*Carried from round 31; not re-examined in round 32.*
Chapter: Chapter IV
Observed: Focused review R68-P2, candidate bundle (same artifact as live).
Expected: No overlap and no clipped tag.
Repro: Chapter IV, Attack, target step, 1280 to 2000 wide.
Evidence: critic/reviews/2a9340249-focused.json
Smallest fix: Offset the flag clear of the panel edge.
Acceptance: Flag and panel rects do not intersect at five widths.
Confidence: medium (focused review; not re-observed live by the chief)

### PR-0578 [polish] interface, both: Phone board: three text chips under 44 px (skip the guide 18 px, two hint chips) (R68-P3)
*Carried from round 31; not re-examined in round 32.*
Chapter: phone board
Observed: Focused review R68-P3; the chief's phone sweep read 14 px type, none under 14 px, on the battle menu, first menu and pause (separate from touch-target size).
Expected: 44 px touch targets.
Repro: tools/text-floor-sweep.mjs --touch=1 --targets=1 --sizes=390x844.
Evidence: critic/reviews/2a9340249-focused.json; critic/rounds/round-31/gaps-chief/gaps/sweep/out-phone.json
Smallest fix: Pad the chips to 44 px.
Acceptance: Touch-target probe lists no control under 44 px on the board.
Confidence: medium

### PR-0579 [polish] visual, FFX-2 only: Magic Break caption box sits over its own pink tag and clips it (FFX-2 Chapter IV, 2000x1012; one capture)
*Carried from round 31; not re-examined in round 32.*
Chapter: ffx2-bahamut
Observed: The caption box overlaps the MAGIC BREAK tag so the tag text is half hidden. On the phone the same two labels sit side by side without clipping (23-midfight).
Expected: One readable label.
Repro: node critic/runner/lib/route.mjs ffx2-bahamut win --size=2000x1012 --seed=1; open 23-midfight.png (moment dependent).
Evidence: critic/rounds/round-31/evidence/ffx2-bahamut-win-2k/23-midfight.png
Smallest fix: Offset the tag or drop the duplicate while the caption shows.
Acceptance: A Magic Break capture shows one readable label.
Confidence: low

### PR-0553 [polish] interface, FFX only: Chapter II: Tidus's HP plate covers Yunalesca's lower body in the hit frame; the party panel crosses Auron's boots (carried)
*Carried from round 31; not re-examined in round 32.*
Chapter: yunalesca
Observed: The plate sits over her legs and feet during the damage burst.
Expected: HUD off the boss body or faded over it.
Repro: Chapter II, seed 3, first hit, 23-midfight.
Evidence: critic/rounds/round-31/evidence/yunalesca-win/23-midfight.png
Smallest fix: Move the plates down or fade over a boss quad.
Acceptance: No plate over the boss body at that moment.
Confidence: high

### PR-0548 [polish] feel, both: Hit flashes, whiteouts and glow edges wash out the figure for a frame or more (carried): Braska's Final Aeon is a white blob for five frames on a heal, Vegnagun flickers copper for a frame, Rikku glows double at the sphere change
*Carried from round 31; not re-examined in round 32.*
Chapter: braskas-final-aeon, ffx2-vegnagun-shuyin, ffx2-bahamut
Observed: Fan strips: braska seq-action-playing f02-f06; vegnagun seq-action-playing f04 and f09; bahamut seq-spherechange f01-f02.
Expected: A flash that stays readable.
Repro: Chapter III Power Wave heal; Chapter V chain; Chapter IV change.
Evidence: critic/rounds/round-31/evidence/braskas-final-aeon-win/seq-action-playing; critic/rounds/round-31/evidence/ffx2-vegnagun-shuyin-win/seq-action-playing
Smallest fix: Cap the heal wash and the glow on the figure's alpha.
Acceptance: The figure outline stays readable in the named frames.
Confidence: medium

### PR-0574 [polish] feel, FFX only: A boss or aeon and its pagodas appear in one frame (Braska battle start and aeon swaps); the party flashes from faded to full in one frame at the seams (first-time fan; the feel auditor read seams 3 and 5 as readable and paced)
*Carried from round 31; not re-examined in round 32.*
Chapter: braskas-final-aeon
Observed: See captures; the arena is empty for about 1.1 s, then a flash and the possessed aeon with a name banner.
Expected: A readable arrival.
Repro: Chapter III by real keys.
Evidence: critic/rounds/round-31/evidence/braskas-final-aeon-win/seq-transition-into-battle; critic/rounds/round-31/evidence/braskas-final-aeon-win/seq-seam-2
Smallest fix: None until Bailey judges the seam look (PR-0530).
Acceptance: A recorded verdict.
Confidence: low

### PR-0575 [polish] feel, FFX only: MISS pops over healthy allies when a party-wide Mega Phoenix is used with one ally down (unsourced; do not change without a source)
*Carried from round 31; not re-examined in round 32.*
Chapter: seymour-flux
Observed: The engine logs miss reason wrong-state for tidus and yuna while Kimahri's revive resolves; it reads as if the item failed. Round 30b saw the same.
Expected: Unknown: no source says what the original draws.
Repro: Chapter I seed 1 turn 3.
Evidence: critic/rounds/round-31/evidence/seymour-flux-win/seq-party-action/f04.jpg; critic/rounds/round-31/evidence/seymour-flux-win/battle-log.json
Smallest fix: Source the original, or ask Bailey.
Acceptance: A sourced statement then the same repro.
Confidence: low

### PR-0576 [polish] feel, FFX only: UNVERIFIED observation: a blank cream cutscene frame between the Yunalesca victory and the results card
*Carried from round 31; not re-examined in round 32.*
Chapter: yunalesca
Observed: yunalesca-win/30-post-scene.png: flat cream with the chapter eyebrow and the advance strip and no painting; the harness read the screen as results (UNVERIFIED capture). Chapter I shows a washed painting.
Expected: The painting under the wash, or a few frames only.
Repro: Chapter II seed 3, capture at the end of the fight (timed sequence needed).
Evidence: critic/rounds/round-31/evidence/yunalesca-win/30-post-scene.png
Smallest fix: None until measured.
Acceptance: A timed sequence shows under 500 ms of a painting-less frame.
Confidence: low

### PR-0536 [polish] feel, both: The turn cut-in (MF-16) covers nearly half the stage for several frames at every turn start in every chapter the fan looked at; the first-time fan rated it major
Chapter: all
Observed: Carried; the first-time fan counted the turn-start cut-in covering most of the stage for about three frames in 11 chapters of both games (Trema, Den of Woe, Fallen Aeons, Bahamut, Yojimbo, Sin face, Evrae, Yunalesca, Natus, Mirror Aeons) and a giant damage number over the boss. A design choice awaiting Bailey's look (PR-0530).
Expected: Bailey's judgment.
Repro: Any chapter, turn start.
Evidence: critic/rounds/round-31/evidence/yunalesca-win/seq-transition; critic/rounds/round-31/evidence/ffx2-vegnagun-shuyin-win/seq-transition
Smallest fix: Ask Bailey.
Acceptance: A recorded verdict.
Confidence: medium

### PR-0528 [polish] visual, both: First-time fan polish breakers kept: attacks that do not visibly connect (a Yunalesca slash arc around Tidus while she stands at the right edge; a Bahamut hit that arrives as a purple streak from off-screen), one empty-stage frame as Bahamut fades in, a monster vanishing for a frame (Mortiorchis)
Chapter: yunalesca, ffx2-bahamut, seymour-flux
Observed: Carried; round 32 adds two fan readings: Vegnagun's Tail Beam damage number (1766) and a pink ring appear on Rikku but the tail does not visibly fire toward her (seq-party-action frames 4 to 8), and Ormi's Shield Bash lunge returns in one frame with a MISS floating in the gap.
Expected: Effects aimed at their target.
Repro: see captures
Evidence: critic/rounds/round-31/evidence/yunalesca-win/seq-transition-into-battle; critic/rounds/round-31/evidence/ffx2-bahamut-win/seq-spherechange
Smallest fix: Aim the slash and the streak from the actor.
Acceptance: Frames show origin at the actor.
Confidence: low

### PR-0524 [polish] encounter, FFX-2 only: research/ffx2-bahamut.md still carries the superseded Mega Flare constant 24 and the 614 to 1,165 damage with no banner (carried)
Chapter: ffx2-bahamut
Observed: Carried: research/ffx2-bahamut.md still carries the superseded Mega Flare constant and damage range with no banner (git diff 2a9340249 e3f51bf18 -- research is empty).
Expected: A superseded banner.
Repro: head and section 2.3 of research/ffx2-bahamut.md against re-ffx2-ai-bahamut-vegnagun.md section 2.3.
Evidence: research/ffx2-bahamut.md
Smallest fix: Add the banner.
Acceptance: The banner exists.
Confidence: high

### PR-0533 [polish] test-coverage, both (tooling): The 15 s default test timeout fails 27 CPU-bound suites when the suite shares the host with browser jobs (extends PR-0533; the 13 files pass 239 of 239 serially)
*Carried from round 31; not re-examined in round 32.*
Chapter: advisor, strategy-chapter2, door tests, ui-ffx2-atbmode, audio-manifest-io
Observed: 28 failed in 27 suites, all 15 s timeouts (one EPERM on a lock file) while the harness ran.
Expected: A green full suite on a loaded host.
Repro: npm test while a capture runs.
Evidence: critic/rounds/round-31/audit-combat/full-suite.json
Smallest fix: Give the fuzz-style files a 60 s timeout; retry the lock open on EPERM.
Acceptance: npm test passes while one browser job runs.
Confidence: high

### PR-0519 [polish] interface, both: Question for Bailey (carried): the default F1 HUD shows the advisor as a one-row chip; the reason, benefit and CURES KO tag live only in the G card
*Carried from round 31; not re-examined in round 32.*
Chapter: Chapters I and IV
Observed: Advice itself is right: 784 of 784 picks found their row; the reason is one key away.
Expected: Bailey's decision.
Repro: Chapter I first menu.
Evidence: critic/rounds/round-31/evidence/seymour-flux-win/11-advisor.png
Smallest fix: Ask Bailey.
Acceptance: A recorded verdict.
Confidence: high

### PR-0546 [polish] prep, both: The pro-defeat card now names its cause at normal speed ('Felled by Attack, turn 4, attempt 1' ) after r67's repair; the SKIP-speed wording was not re-run
*Carried from round 31; not re-examined in round 32.*
Chapter: Chapters I and IV
Observed: Seen at normal speed in both chapters; SKIP not re-run.
Expected: A cause at every speed.
Repro: Lose with battle speed SKIP.
Evidence: critic/rounds/round-31/evidence/seymour-flux-lose-retry/run.json; critic/rounds/round-31/evidence/ffx2-bahamut-lose-retry/run.json
Smallest fix: Run it at SKIP.
Acceptance: The card names a cause at SKIP.
Confidence: medium

### PR-0487 [polish] onboarding, FFX only: 'He strikes first' coach against a turn order that puts Seymour third (carried; not reproduced in seed 1 where Seymour does strike first)
*Carried from round 31; not re-examined in round 32.*
Chapter: Chapter I phone
Observed: Carried from round 30b; not re-examined by any round-31 lane, so nothing is claimed beyond the title.
Expected: as in the earlier rounds that opened it
Repro: as in the entry of critic/rounds/round-30b.json
Evidence: critic/rounds/round-30b.json
Smallest fix: unchanged from round 30b
Acceptance: unchanged from round 30b
Confidence: medium

### PR-0508 [polish] onboarding, both: VISUAL STYLE and PRESENTATION 'THE ECHO - B' are unexplained and the FFX options pane shows no focused row (carried)
*Carried from round 31; not re-examined in round 32.*
Chapter: options
Observed: Carried from round 30b; not re-examined by any round-31 lane, so nothing is claimed beyond the title.
Expected: as in the earlier rounds that opened it
Repro: as in the entry of critic/rounds/round-30b.json
Evidence: critic/rounds/round-30b.json
Smallest fix: unchanged from round 30b
Acceptance: unchanged from round 30b
Confidence: medium

### PR-0569 [polish] delivery, both: Firefox console font warnings for Rajdhani and Chakra (carried; Chromium only this round)
*Carried from round 31; not re-examined in round 32.*
Chapter: all
Observed: Carried from round 30b; not re-examined by any round-31 lane, so nothing is claimed beyond the title.
Expected: as in the earlier rounds that opened it
Repro: as in the entry of critic/rounds/round-30b.json
Evidence: critic/rounds/round-30b.json
Smallest fix: unchanged from round 30b
Acceptance: unchanged from round 30b
Confidence: medium

### PR-0526 [polish] interface, both: Small copy and fit points in the booth and phone surfaces (carried, not re-examined)
*Carried from round 31; not re-examined in round 32.*
Chapter: booth, phone
Observed: Carried from round 30b; not re-examined by any round-31 lane, so nothing is claimed beyond the title.
Expected: as in the earlier rounds that opened it
Repro: as in the entry of critic/rounds/round-30b.json
Evidence: critic/rounds/round-30b.json
Smallest fix: unchanged from round 30b
Acceptance: unchanged from round 30b
Confidence: medium

### PR-0527 [polish] delivery, both: UNVERIFIED observation: one 129.8 s gap with no frames in 1 of 11 runs in round 29 (carried; none seen in the 19 live runs, but see the 5.6 s frame in PR-0580)
*Carried from round 31; not re-examined in round 32.*
Chapter: harness
Observed: Carried from round 30b; not re-examined by any round-31 lane, so nothing is claimed beyond the title.
Expected: as in the earlier rounds that opened it
Repro: as in the entry of critic/rounds/round-30b.json
Evidence: critic/rounds/round-30b.json
Smallest fix: unchanged from round 30b
Acceptance: unchanged from round 30b
Confidence: medium

## What stands between this build and acceptance
- Every category scored, which needs the six UNVERIFIED categories rerun; no milestone is claimed while any is missing.
- visual and feel at 9.0 or more: CHK-026 and CHK-027 PASS in all 19 chapters (PR-0531, PR-0380, PR-0379, PR-0581, PR-0582), which has been open at the same severity for five reviews and owes a written method check.
- CHK-009 fixed (PR-0586); CHK-001 and CHK-B1 settled by Bailey's listening verdict (PR-0148); CHK-002, CHK-003, CHK-006, CHK-018 to CHK-020 and the later-link CHK-022 run.
- 18 of 18 required targets matched (3 unverified, 2 waiting) and every human judgment recorded.

## What changed since round 31 (rubric v2 numbers only)
- Better: gated swap jerks 66 to 34; see-through time 1,689 to 1,623 ms a minute; snaps 0.00; Leblanc (new) passes both continuity checks; combat and encounter measures identical; unit suite 28,004 tests with 0 failures; the once-seen renderer crash 0 of 24 in later runs.
- Worse: Braska (teleports 0 to 3, height-band misses 0 to 23, stance misses 0 to 17, feet 1.4 to 18 px), Ixion KO slide in Chapters VII and XIV (0 and 27 px to 80 and 90 px), the F1 row cuts the selected label (CHK-009), the treated arenas are graded much darker.
- Revised: the phone Chapter I Items finding was a major in the auditor draft; the gap pass opened the pager and the Holy Water target by real taps, so the defeats are the route harness (PR-0483, PR-0539) and it is filed minor.

## Proposals (nothing here is built without Bailey's yes)
- Written method check for the pose-swap family (RUBRIC section 8: PR-0531, PR-0380 and PR-0379 have been open at the same severity in rounds 29, 30, 30b, 31 and 32): read the worst strip per class (Braska Tidus flip, Ixion KO slide, Vegnagun tail, Den of Woe Rikku kneel, Sin fin, Trema Paragon), say which release-69 and 70 switches helped, then choose continue, change method or ask Bailey. Nothing built without his yes.
- Take the Braska return-flip scale and the Isaaru and Anima ProneLay candidate out of the treated holds, or cap them, and re-run the harness on Chapters III, VII and XIV before release 71 (booth batch 4) widens the same behaviour; the smallest test is the harness at seeds 1 and 2.
- Show Bailey the still beside Chapter I of a treated arena and an untreated one (J6) and ask for one verdict on the grade (PR-0585), and one on Yuna's dress change (PR-0589).
- Teach the route harness to tap the Items page button, add mirror-aeons to LONG_FIGHT_BUDGET_MS, assert 33-after-confirm-scene as the post-scene capture, and add a lose-and-retry in Leblanc and Braska link 3 to the next set (PR-0483, PR-0592, PR-0593, PR-0587).
- Measure the sound pass (LUFS, true peak, voice margin) in Chapters II, III and VI and one more FFX-2 chapter before it is called done in ten chapters (PR-0588).
- Run the phone-profile cold load and five-visit memory read on the live build (PR-0567, PR-0573).
- Fix the loss of intact auditor output in the workflow: the six categories left UNVERIFIED here need the auditors rerun, or their reports written to files the chief reads.

## Next review
The deep obligation of releases 69 and 70 is settled by this report if critic-clear accepts it (changed area FAIL; CHK-001, CHK-B1, CHK-002, CHK-003, CHK-006, CHK-018 to CHK-020 and CHK-022 stay UNVERIFIED and pass nothing). The next review owes: the harness on Chapters III, VII and XIV after any change to the booth holds (PR-0581, PR-0582), the six UNVERIFIED categories (rerun the narrative, audio, interface, onboarding, prep and delivery auditors), Bailey's listening verdict and his answers on J6 and the camera and cut look, the written method check for the pose-swap family, a lose-and-retry at a later chained link, and the phone-profile first-load and memory reads.
