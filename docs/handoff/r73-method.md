# r73-method: the written method check for the pose-swap family (PR-0531, PR-0380, PR-0379) and the job specs it leaves (2026-11-01; docs only)

Branch `r73-method` from `origin/main` 145d00c9b (release 71 is live: main 6d7ecc8a5; release 72 = `origin/r72` 2f9c91791, built and not browser-read). The page itself is `docs/plans/pose-swap-method-check-2026-11.md`, also pushed alone on branch `plans-pose-swap-2026-11`. Authority: Bailey, 2026-10-31, "im going to sleep please keep going. i'll go with all of your recommendations. you make the executive decisions for the next few days." Every call below is the sub-agent's under that delegation, the driver's to adopt and Bailey's to overturn. Rule 15 asked for this page: PR-0531, PR-0380 and PR-0379 stayed open at the same severity through five deep reviews (rounds 28 to 32b).

Game case (rule 14): the plumbing, the harness and the see-through measure are **both games**; Lulu's rig head, Yunalesca's hurt feet, Auron's close-up and Braska are **FFX only**; Paragon's feet, Rikku's and Paine's kneel cuts, Ixion at Djose and Leblanc are **FFX-2 only**.

## What changed

**Nothing a player sees and no code, data, test, ledger or `NOW.md` line.** One new page (`docs/plans/pose-swap-method-check-2026-11.md`) and this handoff. No browser, server, Playwright or GPU was run; every number is read from files already on disk (the 19-chapter harness JSON of rounds 30, 31 and 32, the three release-71 focused reports and their continuity JSON, the r68 measurement summary, `docs/handoff/held-chapters.md`, `docs/handoff/r72.md`, `src/engine/motion/SwapSwitch.ts`, `docs/target/pose-waivers.json`), with throw-away scripts that only read JSON. `CHANGELOG.md`, `DECISIONS.md`, `ACTIONS.md` and `docs/handoff/NOW.md` are the driver's and are untouched.

## What the check found, in numbers (round 32, the live build of releases 69 and 70, harness 5e1bbdec)

- **445 head swaps over 3 percent = 427 Lulu rig-head swaps** (96 percent), 8 Braska aeon, 4 Braska party, 4 Braska victory, 2 Chapter I Auron. The harness flags 487 Lulu swaps in round 32 (489 in round 30, 476 in round 31); 60 fall at a camera cut under release 70's treated camera. Where a painted head is registered the reading is 0.1 to 0.2 percent.
- **54 stance misses = Yunalesca 34 (all one pair, idle and hurt, 6.1 to 6.6 px against a 6 px line; the registration says 0.2 px) + Braska 17 + three single boss swaps.** **25 height misses = Braska 23 (0 in round 31; 18 in the release-71 candidate with the `real` hold on) + Chapter I Auron 1 + Ixion 1.** Feet: Paragon 16 (10.4 px, since round 30), Braska 10.
- **34 gated swap jerks: 13 of the 30 re-derivable ones are at a victory pose** (the camera has just cut to a close-up: strips `jerk-046-auron.jpg` and `swap-1172-yuna-idle-victory.jpg` in round 32's Braska folder), 3 knock-out slides, 8 boss parts and a foe's idle variants, 3 of the girls' kneel and cast cuts, 3 other. Teleports 0, 0, 3 (PR-0581; 0 in the release-71 candidate).
- **See-through, weighted over the 19 chapters: 3,474, 1,689, 1,623 ms a minute** (rounds 30, 31, 32). The three held chapters (Yunalesca, Sin's face, Ixion) are 24.7 percent of it from 9.1 percent of the fight (4,378 ms a minute against 1,346 in the other 16). In the 16 chapters in the wide scope **91.9 percent of the frames come from 4,050 undesigned blends at 2.91 frames each**; designed blends cost 0.70 and planned smear cuts 0.01.
- **Method findings:** the harness changed in every round (ids 9cc8f27c, 39fa82cc, 5e1bbdec) and no round kept a recording; Ixion's 5,030 to 3,444 "fall" is a 305 s window against 135 s ones; 79 of the 80 waiver rows carry a reason that stopped being true on 2026-10-17 and a PASS hides 187 height and 454 stance waived readings; the verdict count (CHK-026 FAIL in 14, 14, 13 chapters) cannot register progress while every visible class halved.
- **Choice: change method.** The plan's 12 ranked items are in the page's section 6.

## Per chapter: on or held (read from `TREATED_CHAPTERS`, `SCOPE_EXCEPTIONS`, `PIECE_HOLDS` on `origin/main`, and `docs/handoff/r72.md` for release 72)

"Treated" is the booth treatment; "swap scope" is MF-22's wide scope (the stance and cause picks and the smear). The last column names the plan items that touch the chapter.

| chapter | game | treated at live r71 | swap scope | held pieces that matter here | plan items |
|---|---|---|---|---|---|
| I Seymour Flux | FFX | yes (the approved target) | wide | none | 3 (killing-blow camera), 12 (Auron's close-up head) |
| II Yunalesca | FFX | yes (r70) | **held** (`SCOPE_EXCEPTIONS`; cut-anchor word on, inert) | smear, held with the exception | 4, 7 |
| III Braska | FFX | yes (r70) | wide | `real` held in r71; r72 lifts it with FlipFit | 2, 3, 8, 9 |
| IV Bahamut | FFX-2 | yes (the approved target) | wide | none | 10 |
| V Vegnagun and Shuyin | FFX-2 | yes (r71) | wide | sky as before | 11 |
| VI Leblanc | FFX-2 | yes (r69) | wide | directed camera and KO moments held | 6 |
| VII Seymour and Anima | FFX | yes (r70) | wide | see `PieceHolds.ts` (not read here) | 8, 9 |
| VIII Evrae | FFX | yes (r71) | wide (since r69; head guard on) | `real` held | 2 |
| IX Yojimbo | FFX | **no** at r71 (back in r72) | wide | HUD pieces (r72-hud) | 2 |
| X Seymour Natus | FFX | yes (r70) | wide | directed camera held | 10 (the wide chapter for the clips) |
| XI Fallen Aeons | FFX-2 | yes (r71) | wide | sky as before (grade C in r72) | none |
| XII Omnis | FFX | **no** at r71 (back in r72) | wide | HUD pieces (r72-hud) | none |
| XIII Trema | FFX-2 | yes (r70) | wide | see `PieceHolds.ts` (not read here) | 5 |
| XIV Isaaru | FFX | yes (r70) | wide | see `PieceHolds.ts` (not read here) | 9 (SlideEase) |
| XV Den of Woe | FFX-2 | yes (r70) | wide | directed camera held | 3, 8 |
| XVI Ixion at Djose | FFX-2 | yes (r71) | **held** | none | 7 |
| XVII Sin's Fins and Core | FFX | **no** (out until a look decision) | wide | none | 2, 3, 11 |
| XVIII Sin's face | FFX | **no** (off the list for r71; `real` unread row stays) | **held** | blend head guard on | 2, 7 |
| 27 Mirror Aeons | FFX | yes (r71) | wide | `real` held | 2 |

## Browser job specs (rule 15: predictions written first; **none has run**; one browser lock, GPU free; a miss stops the jobs that depend on what missed)

Item numbers are the page's section 6. Offline items (1, 2, 3 first part, 6, 11) need no browser: they re-read the kept release-68 recordings with the harness's own `tools/continuity-reread.mjs` machinery.

| job | what | prediction | stop rule |
|---|---|---|---|
| **J-MP-1** (item 1) | one kept recording (the r68 Chapter I one) read by the old harness (id 9cc8f27c) and the new (5e1bbdec), both with the same pose table | ghost frames a minute within 3 percent, same gated swap jerks | a difference names the harness change before anything is compared across rounds |
| **J-MP-2** (item 2) | offline: the kept r68 recordings of Mirror, Sin core, Braska, Sin face, Evrae and Yojimbo, with the rig head read from the part's own box | Lulu head fails at most 10 in the six (476 of 480 before); on a round-32-like recording 445 to about 18; CHK-026 PASS in IX, VIII, XVII, XVIII and 27 | a miss means the reading is not a box problem: stop, show Lulu in motion under rigs-v3 |
| **J-MP-3a** (item 3, offline) | the victory rule on the same recordings: swaps at or within K frames after a camera cut to a close-up reported apart | gated swap jerks 34 to about 21; head 4, height 5, stance 1, feet 6 leave the gate; no CHK-027 verdict flips | a flip means the rule excused a jerk it should not: tighten K |
| **J-MP-3b** (item 3, browser) | Braska, seven links, seed 1, 1600x900, `?pro=off` against default | with the pro camera off the victory swaps read head under 3 percent and jerks under 40 px; if they still read about 227 px the swap is real and J-MP-6 takes it | a miss stops the rule's claim, not item 8 |
| **J-MP-4** (item 4) | Yunalesca's hurt feet re-registered (data only), one Chapter II run, seed 1 | stance misses 34 to 0; CHK-026 PASS in Chapter II; ghost, swap jerks and head within 5 percent of round 32; the pose gate, `pose-scale-check` and `pose-ruler --check` pass | a ghost change over 5 percent or a new jerk reverts the data |
| **J-MP-5** (item 5) | Paragon's four kept strips read first; then the cast and idle feet re-registered or a designed-hop waiver written; one Trema run | feet over 2 px 16 to 0 (or named); nine see-through frames at the cast swap to at most 5 | a hop that the sources name is a waiver, not a registration |
| **J-MP-6** (item 8) | Braska, Den of Woe and Anima, seed 1, three arms: default, `?treated=pack`, and for Braska `?pro=off` | the pack arm reads round 31 (Braska 0 height, 0 stance, 0 feet; Den of Woe's worst gated jerk 48.8 px; Anima's Ixion slide 0 px, Isaaru's 27.3 px in round 31); the default arm reads Braska 18 to 23 height, 15 to 17 stance, 6 to 10 feet, Den of Woe 139.9, Anima 80.3; if the pack arm also reads high the harness moved, not the build | a pack arm that reads high stops the Braska fix and sends the work to J-MP-1 |
| **J-MP-7** (item 7) | the three held jobs of `docs/handoff/held-chapters.md`: `ixion-all-held`, then `sin-face-all-held-anchor`, `yunalesca-all-held-anchor` | the lane's bands: Ixion 1,700 to 2,500 ms a minute, at most 3 gated jerks; Sin's face 1,050 to 1,350 and 0; Yunalesca 1,800 to 2,900 and 0; the three together about 2,060 ms a minute (4,378 now) and all 19 about 1,410 (1,623) | a miss is written up before the next job; the anchored two need the clip pair for Bailey (Q2) before their exception lines go |
| **J-MP-8** (item 10) | the at-rest class clips: Chapters I, IV and X, 60 and 120 Hz, five moments, three arms (today's dissolve, a 50 ms blend, a cut inside the smear); the critic's rule for a designed swap written first | model ceiling: if all undesigned blends took the designed rate, the 16 wide-scope chapters 1,346 to about 400 ms a minute and all 19 to about 770; no new jerk of 40 px or more, no feet slide above round 32's | the clips decide which arm may claim any of it; Bailey's pick (Q1) before any default changes |
| **J-MP-9** (item 12) | the Chapter I two-up: planes as drawn against the head held, killing blow | the two swaps read `lock-band` and `camera` and the chapter's FAIL reads as a named class; a visible pop sends Q3 to Bailey | a pop stops the `headGate` change |
| (item 9) | the release-72 reads as written in `docs/handoff/r72.md` (J-MOT, J-CHK) | as written there | not duplicated |

## CHANGELOG lines (none for this branch; drafts for the steps, to be used only when each is built)

- **Both games, tooling and records, nothing a player sees (this branch):** the written method check for the pose-swap family (`docs/plans/pose-swap-method-check-2026-11.md`).
- *Draft, item 2 and 3 (both games, tooling):* the continuity harness reads Lulu's rig head from its own part box and reports swaps at a victory or killing-blow close-up apart; recordings are kept per review run.
- *Draft, item 4 (FFX only):* Yunalesca's hurt painting is registered to the same ground line as her idle (invisible in play).
- *Draft, item 5 (FFX-2 only):* Paragon's cast and idle paintings share one feet line, or the cast hop is named as designed.
- *Draft, item 7 (FFX: II Yunalesca, XVIII Sin's face; FFX-2: XVI Ixion):* the chapters leave the swap exceptions and change pose the way the others do (the two anchored slides only after Bailey's clip pick).
- *Draft, item 10 (both games; only after Bailey's pick):* at-rest pose changes follow the picked look.

## Checks run on this branch

`node node_modules/typescript/bin/tsc --noEmit` clean (exit 0, 2,237 source files listed). Related unit tests, `--maxWorkers=3 --testTimeout=60000 --hookTimeout=60000`: `pc-scope-swap-scope`, `release68-wide-scope`, `held-chapters-blend-guard`, `held-chapters-cut-anchor`, `held-chapters-evrae-heads`, `held-chapters-gaps`, `held-chapters-reread`, `booth-hold-guard`, `critic-continuity-card`, `critic-continuity-policy`, `critic-continuity-smear`, `critic-continuity-staged-excuse`, `swap-classes`, `swap-guards`: 14 files, 129 tests, all passed. The full suite was not run (no code changed). No server was started, so none to stop.

## Open questions for the driver (none sent to Bailey)

1. **Adopt the ticket split** (page section 5): PR-0531 into 0531a to 0531e, PR-0380 into 0380a to 0380d, PR-0379 into 0379a and 0379b. It is the critic's call; the page proposes it.
2. **Ratify "a miss stops the jobs that depend on what missed"** as the reading of rule 15 (the r68 summary asked; it is the rule the page's jobs use).
3. **The `headGate` decision for registered figures** (item 12): gate on the card number and report the projected one as a named class. Recommended; it changes no look, so it is the driver's.
4. **Whether the victory rule's K** (frames after a camera cut) should be fixed from the kept recordings (J-MP-3a) or read from the camera's own cut log; the page assumes the first.
5. **Paragon (item 5):** whether the 10.4 px is a designed cast hop is not in `research/` (rule 6); if the strips cannot settle it, the question goes to Bailey with the four strips.
6. **Q1 and Q2 are Bailey's looks** (the page's section 6, with the exact wording and the pictures to show); both need clips that do not exist yet (J-MP-7, J-MP-8). Nothing about the look changes before he answers.
7. **Where the extra see-through in the treated chapters comes from** (Evrae plus 17 percent and Mirror Aeons plus 22 percent against their `?treated=pack` controls on equal windows) is not traced; J-MP-6 does not cover those two chapters. Add them if the first three chapters say the treatment, not the harness.

## Not done, and why

No browser, server, GPU or art work; no code, data or test change; no ledger, `NOW.md`, `CHANGELOG.md` or `DECISIONS.md` edit (the driver and the records pass own them); no merge to `main`, no deploy. Strip evidence under `critic/rounds/*/` is gitignored and lives on the review machine; the page names it by its repo-relative layout there.
