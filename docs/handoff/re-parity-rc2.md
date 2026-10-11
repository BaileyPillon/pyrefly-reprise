# Re-parity RC2 assembly: release candidate 2 (branch `rel-3945`)

Status: **assembled, checked and pushed on branch `rel-3945` (from `72973096` = `origin/rel-3944` = live release 39.4.4); not deployed, not merged into `main`.** Track `re-parity`
([plan](../plans/re-parity.md)). Owner: Bailey. **Game case: FFX only** (AGENTS.md rule 14), plus shared plumbing that only FFX imports. Nothing under `src/battle/ffx2`, `src/data/ffx2`, `src/audio`,
`src/engine/PaintedActor.ts` or `src/engine/fx/mix/living.ts` changed (`git diff --stat 72973096 HEAD` over those paths is empty); `ffx2-atb-golden` and `ff7-golden` pass unchanged.

Bailey, to the main session (the AUTH note of this brief): 2026-10-08 "It needs to be a 1:1 parity. this is very useful for our project."; 2026-10-10 about 22:15 EDT "ill go with all your recommendations. i am going to sleep soon so please tell me what youwill get done over night.",
which took (1) Chapter X's line `reflect` and (2) the two menu changes, and then "Yes, deploy on SHIP (Recommended)" to the question about the overnight build (Chapter XVIII 500 of 500, the guide cards, W5 with the reworked Chapter IX line, `reflect` for Chapter X, the two menu changes).
This branch builds exactly that candidate; the release driver runs the focused review and deploys.

## 1. What is in it (each merge is its own merge commit, in the driver's order)

| # | Commit | Branch (tip) | What it brings | Conflicts |
|---|---|---|---|---|
| 0 | `72973096` | base = live 39.4.4 | main + W2 `919f2c78` + the hidden Gui "mushroom" and Experiment "experiment" chapters + the driver's fixes | |
| 1 | `7d3f554f` | `re-parity-ch18` (`3a898729`) | Chapter XVIII: Lulu Doublecasts Firaga, the Stone, Confuse and Zombie Wards on every armour, the guide at the game's twelve turns | none |
| 2 | `2d6aa8fa` | `re-parity-guide` (`adaff30c`) | the guide-card rewrites: the three Bailey named (Evrae's Stone Gaze note, Yojimbo's odds, the Fins and Genais) and six extras, two code comments; the before and after pictures | none |
| 3 | `43cab0cd` | `re-parity-w5` (`94d8b77a`) | the FFX Overdrive gauge, the aeons (gear, recovery, the summoner keeps her Summon's recovery), Steal's byte, the `FFXEngine.init` crash fix, the Chapter IX line at gauge 96 | 2, section 2 |
| 4 | `3f960845` | `re-parity-chx-options` (`342d636e`) | Chapter X's measured options behind one constant, `NATUS_LINE` (still `shipped`) | none |
| 4b | `128214a3` | (this branch) | **`NATUS_LINE` = `'reflect'`** | |
| 5 | `c626077f` | `re-parity-ai-ffx` (`e110db6e`) | Cid's one-order Trigger Command with Cancel; Braska's Talk greyed while a Talk waits; the third Talk offered and speech only | 3, section 2 |
| 6 | `6ed6f9fb` | (this branch) | `ffx-engine-golden` re-baselined once: two digests (section 4) | |
| 7 | `8b5af137` | (this branch) | the Gui bench's one slow test gets its own timeout (section 6.3) | |
| 8 | (this note) | (this branch) | `docs/handoff/re-parity-rc2.md` | |

`re-parity-ai-ffx` branches from `931613a8` (release candidate 1), not from `919f2c78`, so its three conflicts were W2 changes it had never seen.

## 2. Conflicts and how each was resolved

**Step 3 (W5), two conflicts.** The yojimbo guide merged without a conflict and keeps both: the guide lane's odds wording (header comment, the gauge phase note, the Ginnem / Daigoro cite) and W5's rule 4 and Summon hint at 96 (`git diff 72973096 -- src/data/guides/yojimbo-cavern.ts` shows both sets of lines).

1. `src/battle/ffx/overdrive.ts`: the hidden Gui chapter had added, inside `onDamageTaken`, a line giving a **guest's** Stoic gauge the game's count (`floor(damage x 30 / max HP) + 1`); W5 deleted `onDamageTaken` and the other gain functions in favour of `gauge.ts` over the proven hook. **Resolved by taking W5's file.**
   W5's Stoic hook is the same sum (`hp x 30 / max HP`, the division first, then + 1) for every character, so Seymour's guest gauge now goes through the shared path with no special case. Proof: `tests/unit/chapters/sinspawn-gui-rules.test.ts` ("the Stoic gauge fills only as monsters hurt him: floor(damage x 30 / max HP) + 1 a blow") passes unchanged. Seymour is party slot 7 in `adapt/slots.ts`, which W5's `od-world.ts` reads.
   **No Gui file changed.** A `docs/CONTRACT-CHANGES.md` entry says so.
2. `docs/CONTRACT-CHANGES.md`: both sides added an entry at the top. Kept both, plus a short entry for this resolution.

**Step 5 (menus), three conflicts.**

1. `src/data/ffx/command-records/player.ts`: W2 gave every record a `rank` (222 lines changed); the menus branch added one line, the Cancel record `0x3108`. **Took W2's file and added the line with `rank: 3`**: the record's rank byte is 0, which the game counts as 3, the same as Talk (`0x3105`) and Pull back (`0x3107`) carry; the numbers equal the fixture row `[12552, 0, 528390, ...]`.
2. `tests/unit/data-ffx-command-records.test.ts`: the ability counts. Gui's four plus Cancel: **462 abilities, 460 records**.
3. `tests/unit/chapters/evrae-engine.test.ts`: the order-queue test keeps W2's `makeInvincible` (the party defends from the first turn and Evrae wins some openings now) and the menus branch's one-order rule.

`tests/fixtures/parity/ffx/evrae-gaze-classes.json` auto-merged (W2's five rows plus the menus branch's `0x3108`); JSON checked.

## 3. The Chapter X constant

`src/data/guides/natus-line.ts`: `export const NATUS_LINE: NatusLineId = 'reflect';` (it was `'shipped'`). That is the one edit the handoff of `re-parity-chx-options` names. The registered tactic (auto-battle), the guide's NEXT line, the move advisor's look-ahead, the guide's rules, hints and phase note and the
pause tip all follow it (the switch test proves each; `NATUS_META.tip` reads "...send Bahamut alone, and have Rikku Reflect Natus so Mortibody's Cura bounces off him."). The switch test's one pick assertion now reads `reflect`, and two stale comments (the tactic's header, the registered-tactic doc) say so.
The `shipped` line stays in the code as the measured baseline. The chx lane's decision 2 (the Flare-cadence sentences on the `shipped` guide) is moot: `reflect`'s guide carries both.

## 4. Goldens

- **`ffx2-atb-golden` and `ff7-golden`: unchanged** (9 tests pass on the merged tree).
- **`ffx-engine-golden`: re-baselined once, for the merged state. 16 of the 18 digests are byte for byte what they were; two moved**, and both are still victories:

| Digest | Old | New | Moved by |
|---|---|---|---|
| `seymour-natus#1` | `dc26538f:victory` | `4e54c29b:victory` | the `reflect` constant (step 4b) |
| `seymour-natus#7` | `cd5b1bcb:victory` | `25becfa0:victory` | the `reflect` constant (step 4b) |

  Proof: with the constant put back to `'shipped'` (temporary edit, restored byte for byte, SHA-1 checked) the file is **18 of 18 on the old values**. The event logs of the two lines, compared on both seeds, are identical for the first 16 (seed 1) and 51 (seed 7) events and differ at Kimahri's switch: Rikku comes in
  for the Reflect and Auron does not; the fights get shorter, 417 to 255 and 644 to 335 events. Nothing else moves a digest: the Chapter IX line and W5's gauge were already in the table, the Sin chapters are not in it (it stops at Isaaru), the guide rewrites are text, and the two menu changes moved none of the 18 logs.
  The comment block of the test carries the same paragraph.

## 5. Checks

- `node "D:/Final Fantasy/node_modules/typescript/bin/tsc" --noEmit`: clean (after the last code change).
- Targeted, on the merged tree before the golden was re-baselined: the Gui and Experiment chapters, the Chapter X files, the W5 and menus files, the goldens, the guide tests (sections 6 and 7).
- `node tools/orphans.mjs`: 1,501 modules, 44 orphaned, the same 44 as before (the 18 unwired FFX-2 kernels, 24 from `origin/main`, the two FFX kernels `drops.ts` and `gear-drop.ts`). Nothing new.
- No source file over 400 lines was added; the one new file over it is `tools/re-parity-menus-shots.mjs` (459 lines, the menus lane's screenshot tool; `src/battle/common/types.ts`, `src/engine/tactics/advisor.ts` and `ffx-hud.css` were already over).
- **The whole unit suite, once** (`--maxWorkers=4 --testTimeout=120000 --hookTimeout=900000`, 2026-10-11 04:14 to 04:37, log and JSON in `D:\Tools\ffx-parity\rc2-assembly\fullsuite.*`, run on `6ed6f9fb`; two commits followed it, a test-only timeout and this note):
  **1,052 files: 1,014 passed, 23 failed, 15 skipped. 15,900 tests: 15,601 passed, 185 failed, 113 skipped, 1 todo.**
  - **22 of the 23 failing files are art-only** (this worktree has no `public/art`; every failure is an ENOENT on `public/art/...`, a missing `public/art/manifest.json`, or an assertion that an art file exists), the 21 W5 listed plus `chapters/experiment-scene` (1 test, "has its plate on disk"):
    `ui-portrait-face-crop` 145 tests, `chapters/trema-ship-content` 4, `art-ref-defaults` 4, `pause-remake` 3, `chapters/isaaru-ship` 3, `chapters/den-of-woe-ship-content` 3, `chapter-meta-seymour-anima-macalania` 3, `chapter-meta-evrae` 3, `chapters/natus-ship-scene` 2, `chapters/natus-ship-content` 2, `chapters/leblanc-art` 2,
    `chapters/fallen-aeons-ship-content` 2, `chapter-meta-ffx2-leblanc` 2, `cutscene-story-poses` 1, `chapters/fallen-aeons-ship-scene` 1, `chapters/den-of-woe-ship-scene` 1, `chapters/experiment-scene` 1, and five that fail on import for the missing manifest (`party-face-manifest`, `chapters/yojimbo-content`, `chapters/leblanc-party-sprites`, `chapters/chapters-6-7-8-enemy-sprite-manifest`, `chapter-meta`). Not fixed, by rule.
  - **One failing file is not art and is not this branch's: `themes-chapter-cue-map.test.ts` (3 of 4 tests)**. It fails **on the base `72973096` itself**: the driver's last commit (the two ElevenLabs cues) made Chapter IV and Chapter VI play `boss-bahamut` and `boss-leblanc`, while the chapter cue map in `docs/audio/THEMES.md` (rows IV and VI) still says `boss-ffx2-aeon`
    ("battle: map says boss-ffx2-aeon, the chapter plays boss-bahamut"). Audio is the driver's; I did not touch `docs/audio/THEMES.md` or any audio file. **It will fail in the release driver's own suite until those two rows are updated.**
  - `ffx-engine-golden` 18 of 18 (on the re-baselined values), `ffx2-atb-golden` 6 of 6, `ff7-golden` 3 of 3 passed. The other lane's two scratch tests in this worktree (`tests/unit/zz-diag-b.tmp.test.ts`, `zz-measure-b.tmp.test.ts`, untracked, never staged) are env-gated and were skipped.
- Afterwards, alone: `tests/unit/chapters/sinspawn-gui-bench.test.ts` under the default 15 s config with its new timeout, 6 of 6 pass. The measurements and the base copy used for them are section 6; the copy was a **src-only extract of `72973096`** (`git archive` of `src`, the configs and the two harness files, 18 MB, `node_modules` a junction), deleted afterwards, junction first. No worktree and no full copy of the repo.

## 6. Measurement: the intended line in every FFX chapter, the whole chain

Harness: `tests/unit/ffx-parity-measure.test.ts` (the shipped `intendedStrategy` through each chapter's chain, the app's own setup). Before = `72973096`, after = `rel-3945` at `6ed6f9fb`. Raw tables outside the repo: `D:\Tools\ffx-parity\rc2-assembly\base-500.json`, `merged-500.json` (plus the logs).
"sd" is the standard deviation of the difference of two samples of 500 (real = beyond 3, borderline = 2 to 3). The Gui chapter is not in this harness (`CHAPTERS` holds the eighteen); it has its own bench (6.3).

### 6.1 500 seeds (wins of 500)

| Chapter | before | after | change | sd | party turns before to after | party KOs before to after | 12 seeds before to after | caused by |
|---|---|---|---|---|---|---|---|---|
| I Seymour Flux | 499 | 493 | -6 | -2.1 borderline | 48.8 to 48.4 | 0.5 to 1.1 | 12 to 12 | **W5 row A3** (Seymour Banishes the summoned aeon; the summoner now pays her Summon's recovery) |
| II Yunalesca | 494 | 469 | -25 | -4.2 **real** | 164.5 to 158.1 | 12.7 to 13.2 | 11 to 12 | **W5 row A3** (-18), the rest noise |
| III Braska's Final Aeon | 478 | 475 | -3 | -0.4 | 244.1 to 238.5 | 5.5 to 5.5 | 11 to 12 | W5 noise (A3); **the menus branch moves 79 seeds' numbers** (6.2) |
| VII Anima and Macalania | 456 | 488 | +32 | +4.4 **real** | 59.4 to 55.7 | 5.2 to 4.6 | 12 to 12 | **W5 row A3** (+19) and the aeons' Overdrive gains (+13) |
| VIII Evrae | 490 | 489 | -1 | -0.2 | 72.4 to 72.3 | 0.8 to 0.8 | 11 to 11 | noise (W5 gauge events only) |
| IX Yojimbo | 488 | 495 | +7 | +1.7 | 74.1 to 67.8 | 4.8 to 4.0 | 11 to 12 | **W5 row A3 took it to 307, the reworked line (aeon at 96) brings it back to 495** |
| **X Seymour Natus** | 302 | **485** | **+183** | **+15.8** | 56.7 to 34.5 | 5.4 to 1.8 | 9 to 12 | **the `reflect` line** (`re-parity-chx-options`); W5 row A3 alone is 302 to 342 |
| XII Seymour Omnis | 423 | 423 | 0 | 0.0 | 102.7 to 102.7 | 1.3 to 1.3 | 10 to 10 | none (no aeon) |
| XIV Isaaru (3 links) | 431 | 440 | +9 | +0.8 | 28.7 to 38.0 | 2.7 to 3.0 | 11 to 11 | **W5**: row A3 (-24) and the aeons' gauge (+33) cancel |
| XVII Sin: Fins and Core | 446 | 434 | -12 | -1.2 | 330.0 to 327.4 | 2.7 to 2.8 | 10 to 9 | W5 noise (the party's gauge side) |
| **XVIII Sin: the Face** | 7 | **500** | **+493** | n/a | 57.3 to 47.2 | 2.9 to 0 | 0 to 12 | **`re-parity-ch18`** (the Doublecast line and the Wards) |

In win rates: X 60.4 to 97.0 percent, XVIII 1.4 to 100 percent, IX 97.6 to 99.0, VII 91.2 to 97.6, II 98.8 to 93.8, I 99.8 to 98.6, XIV 86.2 to 88.0, XVII 89.2 to 86.8; III, VIII and XII within a point.

**12 seeds (wins of 12; party turns; party KOs):** I 12 to 12 (48.6 to 49.9; 0.4 to 1.3), II 11 to 12 (156.2 to 163.5; 12.2 to 14.6), III 11 to 12 (228.2 to 220.6; 6.3 to 5.0), VII 12 to 12 (61.2 to 54.4; 4.8 to 4.3), VIII 11 to 11 (71.9; 1.0), IX 11 to 12 (75.4 to 67.5; 5.4 to 3.8),
X 9 to 12 (58.3 to 35.1; 5.6 to 1.6), XII 10 to 10 (99.2; 1.3), XIV 11 to 11 (28.8 to 38.8; 2.6 to 3.0), XVII 10 to 9 (328.1 to 334.9; 2.8 to 5.2), XVIII 0 to 12 (56.4 to 47.5; 3.0 to 0). Beyond the sampling band of 12 seeds: X, XVIII (the two lines) and IX (the W5 rule, reworked).

### 6.2 Which branch moves which row (the decomposition that makes the causes checkable)

- **The base is the W2 base.** `72973096` equals `919f2c78` seed for seed on every FFX chapter (the 500-seed strings are identical), so the hidden chapters, the Gui lane's engine edits and the driver's fixes move no FFX chapter. W5's own table (`D:\Tools\ffx-parity\rc3-w5b\ffx-500-final.json`) therefore applies as the "W5 only" column.
- **Merged against W5's own final table, per seed:** Chapters I, II, VII, VIII, IX, XII, XIV and XVII are **identical on all 500 seeds in every number** (outcome, party turns, engine turns, KOs): the guide rewrites, the menus, Chapter XVIII's and Chapter X's lines move nothing in them, so their causes are W5's, as W5's note says.
  Chapter X differs on every seed (342 to 485: the line). Chapter XVIII differs on 494 (6 to 500: the line and the Wards).
- **Chapter XVIII equals `re-parity-ch18`'s own numbers** (500 of 500, 47.2 party turns, 0 KOs, 12 of 12): W5's gauge does not move it. (ch18's handoff, open item 1, asked whether it would.)
- **Chapter X equals `re-parity-chx-options`' own W5-tree row** (`reflect` 485 of 500 on the W5 tree).
- **Chapter III, the menus branch, proved by ablation:** with only Braska's Talk row put back to the old rule (a temporary edit of `bfaTalkState` that ignores "pending" and spends at two, restored byte for byte), the chapter is **identical to W5's table on all 500 seeds** (475 wins, 239.0 turns, 5.5 KOs); with the menus branch's rule it is 421 of 500 seeds identical, two outcomes differ (seed 138 won to lost, seed 269 lost to won),
  wins 475 either way and 238.5 party turns. The Talk row greyed while a Talk waits means the line can no longer spend its second charge on a lost turn. The airship's one-order rule (Chapters VIII and XVII) moves **no** seed: the line only ever gives the order that is on offer.

### 6.3 The hidden chapters

- **Sinspawn Gui (FFX)**, on W5's shared gauge: tests `chapters/sinspawn-gui-data`, `-flow`, `-rules`, `-scene`, `-story`, `-bench`, `ffx-guest-member`, `mushroom-door` all pass (the first run of these files and the Experiment's was 258 of 260: the two failures were the art-only Experiment scene test and the bench's 15 s timeout, which is the change below). Its own bench, 200 seeds, before (`72973096`) to after: **the shipped advisor line 197 of 200 to 197 of 200** (112 engine turns a full clear, was 113; the wipes are 2 attack and 1 thunder, were 3 attack),
  attack only 0 to 0, "the same line without Auron's Power Break" **125 to 120** of 200 (still clearly less, which is what the test asserts). The cause is W5's gauge for the Ridge party (the party's Overdrives arrive on other turns; the guest's own count is the same sum). I did not separate the guest's gauge from the party's.
  **The one change this chapter needed to sit on W5's gauge is test-only (commit `8b5af137`):** the bench's second test runs two 200-seed sweeps and takes 20 to 25 s now against 13.7 s on the base (the 15 s default is the limit), so it carries its own 120 s timeout. No Gui source or data changed.
- **The Experiment (FFX-2)**: `chapters/experiment-bench`, `-engine`, `-flow`, `-guide`, `-model`, `-story` pass; `-scene` fails its one art-only test ("has its plate on disk"). Nothing under `ffx2` changed.

## 7. Targeted checks run on the merged tree (all green except the art-only ones)

`chapters/sinspawn-gui-*` (6 files), `ffx-guest-member`, `mushroom-door`, `chapters/experiment-*` (7), `chapters/natus-*` (all, with `reflect` live; only the four art-only tests in `natus-ship-content` and `natus-ship-scene` fail), `ffx-engine-golden`, `guide-doc`, `guide-doc-start`, `tactics-lookup`, `guide-advisor-target-agreement`,
`re-parity-menus` (12), `chapters/evrae-engine`, `-advisor`, `data-ffx-command-records`, `evrae-orders-none-choosable`, `ffx-overdrive-menu-rows`, `re-parity-ai-bfa`, `ui-ffx-airship-order-widget`, `ui-ffx-airship-orders`, `chapters/sin-data`, `sin-fins-engine`, `sin-orders-folded`, `sin-ship-layer`, `natus-build` (193 tests), and the whole suite above.

## 8. Open items

1. **`themes-chapter-cue-map` (base, not this branch):** `docs/audio/THEMES.md` rows IV (`ffx2-bahamut`) and VI (`ffx2-leblanc`) still name `boss-ffx2-aeon`; the chapters play `boss-bahamut` and `boss-leblanc` since `72973096`. Audio is the driver's. Until the rows change the driver's own suite has 3 red tests.
2. **The engine is slower on W5's gauge.** The same fights take roughly 1.7 to 2.3 times as long to simulate (Omnis and Flux, 150 seeds, run back to back: 13.7 s and 17.8 s on the base, 23.0 s and 39.3 s here, on a loaded machine; the Gui bench's heavy test 13.7 s to 20 to 25 s). The cause is W5's gauge world, rebuilt from the engine's combatants for every hit's hook (`adapt/od-world.ts`). Nothing in play at one fight a time notices; the **move advisor's look-ahead and the benches
   run the real engine on clones**, so a browser check of the advisor's response time on a phone is worth doing in the focused review. I did not run the game or a browser (no `public/art` here; the rule). Not changed: it is W5's design and outside this brief.
3. **The suite needs a longer timeout than the 15 s default under load** (several benches take 20 to 80 s on a loaded machine: `isaaru-tactic-bench`, `advisor-v3-repair`, `advisor-degenerate-boards`, `aeon-hp-2-3-bench`, the Gui bench and others; they carry their own timeouts or passed here under 120 s). Only the Gui bench's test was changed. If the driver's run uses the default and a bench times out, that is load, as it was for W5's first agent.
4. **Chapter XVIII is now the easiest chapter for the intended line (500 of 500)**; Bailey kept it ("Keep it, 500 of 500"). A player who skips the Wards or the Doublecast still loses (the ladder: Wards alone 102 of 500, Doublecast alone 371). The lever that gives a race back is one preset line (`ch18` handoff, decision 1).
5. **The guide rewrites change little on screen** (the guide lane's section 1): rules, phase notes and WATCH lines are data that no screen draws; only the Genais page line, the Evrae "Pull back" hint and the Chapter X / XVIII / IX hints and NEXT lines reach the player. A RULES surface would be a new screen (mockup first, rule 9).
6. **The menus keep the label "Close in"** where the game says "Move in" (D-020 Q9); the guide still says two Talk charges, which is true.
7. **Stale comments I left:** `src/battle/ffx/runtime.ts` mentions `onDamageTaken`, which W5 removed; `rt.frozenPartyCtb` and `rt.aeonStoredGauge` are dead fields (W5, section 6). The Gui handoff (`ch-gui.md`) still describes the guest's gauge line as living in `overdrive.ts#onDamageTaken`; `CONTRACT-CHANGES.md` has the correction.
8. **Carried from the branches** (not decided here): the Chapter IX gauge 96 is derived and measured, not a source's (W5, 1a); Pilfer Gil, Nab Gil, Bribe, item drops, Double and Triple AP, gear drops and the Magus Sisters are not built (W5, rule 10); aeon Overdrives as Chapter XVIII's finisher need a yes (ch18, decision 4); `advisor-note.test.ts`'s seed walk is a draw and will need a re-pin after the RNG-streams batch (W5, 11.1).
9. The ledgers, `NOW.md` and `CHANGELOG.md` are the main session's; the entry below is ready to paste.

## 9. Disclosures (for the review; none is a regression against the live build unless it says so)

**Difficulty shifts, in player words (the line's win rate in 500 test fights, live build to this one):**
- **Chapter X (Seymour Natus) is much easier if you follow the suggested line: 60 to 97 percent.** Right now the live build's line sends all five aeons and loses guardians to Flare; the new line sends Bahamut alone and has Rikku Reflect Natus, so Mortibody's Cura bounces onto a guardian. Fights are shorter (35 turns, not 57) and fewer guardians fall. Cause: the `reflect` line (Bailey's pick, the recommendation). W2's rank-3 Flare (already live in 39.4.4) had taken this chapter from 77 to 60 percent.
- **Chapter XVIII (Sin: the Face) is winnable again: 1 to 100 percent.** The game's own twelve-turn clock (live since 39.4.3) had broken the old line. The new line has Lulu Doublecast Firaga and the party starts in armour with the three Wards; following it wins every test fight with turns to spare. Skipping either lever is still a real race. Cause: `re-parity-ch18` (Bailey's "Keep it, 500 of 500").
- **Chapter IX (Yojimbo) plays differently and is as hard as before: 97.6 to 99.0 percent.** The summoner now keeps the recovery of her Summon (the game's rule), so Yuna can no longer call an aeon and heal in the same breath; the line calls the aeon late, at gauge 96, first among her choices. Cause: W5 row A3 and the reworked line (Bailey's "Keep 1:1, rework our line"). The guide says so.
- **The same game rule moves other chapters:** Chapter VII (Anima and Macalania) is easier, 91 to 98 percent (the summoner's recovery +19, the aeons' Overdrive gains +13); Chapter II (Yunalesca) is harder, 99 to 94 percent (-18 of it the summoner's recovery; the one real drop); Chapter I (Seymour Flux) is a point harder, 99.8 to 98.6 (borderline); Chapter XIV (Isaaru) is the same, two effects cancelling.
  Chapters III, VIII, XII and XVII are inside the sampling band. Nothing on a boss or a party was tuned in this assembly; these follow the game's rules.
- **Menus:** Cid offers one order at a time (Pull back at NEAR, Close in at FAR, Cancel while one stands; Chapters VIII and XVII), and Braska's Talk is greyed while a Talk waits on his turn, with the third Talk offered and speech only (Chapter III). The Chapter III line moves on 79 of 500 seeds, two outcomes, wins unchanged.
- **Overdrive bars, aeons and Steal (every FFX chapter):** bars fill by the game's rules (at least one point a hit, a healer counts only what it restores, Shield stops a bar and Boost doubles it, an aeon's bar steps in fives); a fallen aeon stays away its own number of battles (Valefor 8 ... Bahamut 24) and returns at full health; aeons wear the game's gear; each steal from a monster is about half as likely as the last, never impossible.

**Not regressions, but the review should know:**
- A latent crash is fixed (W5, `FFXEngine.init`): a link that opens with a party member under half HP and no Critical status carried threw `init(setup) has not been called`. It is reachable on the live build; the 500-seed runs of the base never opened such a link.
- The hidden Gui chapter now fills Seymour's gauge through the shared hook (section 2.1). Its shipped line is unchanged at 197 of 200; the measurable move is the "without Power Break" ablation (125 to 120), not a shipped line.
- The engine simulates 1.7 to 2.3 times slower (open item 2). The advisor and benches ride on it.
- `themes-chapter-cue-map` is red on the base (open item 1).
- Imported pictures: the guide lane's `docs/screenshots/re-parity-guide/` (about 40 files) and the menus lane's `docs/screenshots/re-parity-menus/` (23) come with their merges; they are in git but not materialized in this sparse worktree. They are pictures of our own game and review cards, never retail frames.
- Exactly one src-only copy of `72973096` was made outside the repo for the baseline (section 5) and deleted.

## 10. For the release CHANGELOG (plain words, one paragraph per area)

- **FFX, Chapter XVIII (Sin: the Face):** Sin's last attack comes on his twelfth turn, as in the game, and the old way of fighting him ran out of time. The suggested line now has Lulu cast two Firagas a turn with Doublecast, drinking a Turbo Ether when she runs low, and the party starts the fight in armour that carries the Stone, Confuse and Zombie Wards, so Sin's Gaze no longer petrifies, confuses or zombifies anyone. Following the card wins the fight with turns to spare; skip the Wards or the Doublecast and it is a real race again. The in-battle guide says twelve turns and explains the new steps.
- **FFX, Chapter X (Seymour Natus):** Natus's Flare comes every third turn or so, as in the game, and the old line, which sends all five aeons, lost guardians to it. The suggested line now sends Bahamut alone for his Overdrive and has Rikku step in for one turn to put Reflect on Natus, so Mortibody's Cura bounces onto one of you instead of healing him. Fights end in about 35 turns instead of 57, with far fewer guardians falling. The guide, the pause tip and the move advisor all teach it.
- **FFX, Overdrive bars, aeons and Steal (every chapter):** the bars follow the game's own rules: every hit adds at least a point, a healer's bar counts only the hit points actually restored, Shield stops a bar from filling and Boost doubles it, and an aeon's bar is a short one that fills in steps of five percent. When an aeon leaves, Yuna still owes the recovery of her Summon, so she no longer acts the instant it goes; a fallen aeon stays away as long as the game keeps it away and returns at full health; aeons wear the gear the game gives them. Stealing uses the game's odds: each steal from a monster is about half as likely as the one before, but never impossible. Chapter VII (Anima and Macalania) is easier for it and Chapter II (Yunalesca) somewhat harder. A battle that begins with a hurt party member no longer stops the game.
- **FFX, Chapter IX (Yojimbo):** as hard as before, but it plays differently. Because Yuna now pays for her Summon, she can no longer call an aeon in front of Zanmato and heal in the same breath. The advice changed to match: call the aeon late, when Yojimbo's gauge reaches 96, and have the party healed first. The guide and the move advisor say so.
- **FFX, the strategy guide:** the cards for Evrae, Yojimbo, Seymour (Flux, Macalania, Omnis), Yunalesca, Braska's Final Aeon and the Fins and Genais are rewritten from the game's own scripts: how Evrae's Stone Gaze fills (and that a retreat does not clear it), the real odds inside each of Yojimbo's gauge bands, how the game scores Negation on the Fins, that Genais starts inside its shell and spends its first turn coming out, and the cycles and counters of the Seymour and Yunalesca fights. Nothing about a fight changes; the words are more exact.
- **FFX, the Orders and Talk menus:** on the airship (Chapters VIII and XVII), Cid is offered one order at a time: Pull back when the ship is near, Close in when it is far, and Cancel while an order is standing, which gives him his turn back. In the fight with Braska's Final Aeon (Chapter III), Talk is greyed while a Talk is waiting on his turn, the third Talk is offered and only speaks, and then the row is spent.

## 11. How to re-run

```
node "D:/Final Fantasy/node_modules/typescript/bin/tsc" --noEmit
node "D:/Final Fantasy/node_modules/vitest/vitest.mjs" run --maxWorkers=4 tests/unit/ffx-engine-golden.test.ts tests/unit/ffx2-atb-golden.test.ts tests/unit/ff7-golden.test.ts
PYREFLY_MEASURE=1 PYREFLY_MEASURE_SEEDS=1-500 PYREFLY_MEASURE_OUT=out500.json node "D:/Final Fantasy/node_modules/vitest/vitest.mjs" run --testTimeout=3000000 tests/unit/ffx-parity-measure.test.ts   # about 14 minutes; 12 seeds by default
node "D:/Final Fantasy/node_modules/vitest/vitest.mjs" run --maxWorkers=4 --testTimeout=120000 --hookTimeout=900000                                                                      # the whole suite, about 23 minutes
node tools/orphans.mjs
```

Expected on this tip: the table in 6.1 to the win (485 for X, 500 for XVIII, 475 for III with the menus), `ffx-engine-golden` 18 of 18 on the values in the file, `ffx2-atb-golden` 6 of 6, `ff7-golden` 3 of 3, and the red files of section 5 (22 art-only, `themes-chapter-cue-map`).
