# Chapter XV ship layer: independent check

**Game case: FFX-2 only.** The Den of Woe, the three shades (research `ffx2-gippal-den-of-woe.md`: ATB,
dresspheres, the FFX-2 status set). Nothing below is true of an FFX chapter.

- **Checked:** commit `bbc54e49` on branch `chapter-gippal-ship-0925`, in the worktree `D:/pyrefly-ch-gippal-ship`.
- **When:** 2026-09-25, evening.
- **How:** the checker built none of it and edited nothing under `src/` or `tests/`. This section is the only commit.
- **Verdict:** **1 blocker, for listing only**: nobody can win the chapter at human speed. That blocker is
  Bailey's call among sourced player-side options, not a defect in the ship layer. There is also 1 major (the
  guide teaches the Lightfall prep that the bench measures as worse) and 7 minors. The ship layer itself works
  end to end. It can stay on this branch **unlisted**, as the brief says.

## Mechanical checks

| Check | Result |
|---|---|
| `tsc --noEmit` | exit 0 |
| Full vitest (`--testTimeout=60000`) | 416 files passed, 2 skipped (418). 7,831 tests passed, 12 skipped, 1 todo. Exit 0, 73 s. |
| `node tools/orphans.mjs` | 761 modules, 737 reachable, 24 orphaned: the same 24 as `main`. None of them is a Den module. |
| Boss numbers | The ship commits (`77c16e3b`, `4284ef77`, `c89b505e`, `bbc54e49`) touch the enemy data only in the shades' `spriteKey` values. The only AI change is the `baralai-count-seven` emit. That emit draws no RNG and changes no decision: `countOne` only moves the existing `hits` increment. No stat, ability or AI row moved. |
| House style | Every new file is under 400 lines. `src/scenes/index.ts` is at 399 (the Evrae entry was compacted to make room). `src/battle/common/types.ts`, the shared contract, grew from 2,612 to 2,621 lines (see minor 5). `resolve.ts` holds at 469. |
| Contracts | `docs/CONTRACT-CHANGES.md` has the Chapter XV entries (`ChapterId`, `Chapter.number` 15, `carriesFullPartyState`, `DenOfWoeEnemyId`, and the ship layer). |
| Merge with current `main` (`ba201aff`, chapter select v2) | A `git merge-tree` dry run has one conflict, in `docs/CONTRACT-CHANGES.md`: both sides add entries at the top. No code conflicts. |
| Locked art (sha256 of every approved and judge-locked file), before and after every run | Worktree: 225 ok, 0 mismatched, 0 missing. Main: the same. `public/art` is a junction to main's copy. |
| Worktree after the whole check | `git status` is clean before this commit. |

## In the browser: headless GPU Chromium, fresh load each run

- **Servers:** a private Vite dev server on port 5799 and a production preview on 5798, each with HMR and the
  watcher off and its own cache and `dist` under `D:/Tools/pyrefly-scratch/chapters/den-of-woe-check/`. Both
  were stopped by their port's PID. Nothing listens on 5780 to 5799.
- **Reaching the chapter:** the debug API was used only to open the unlisted chapter:
  `gotoChapter('ffx2-den-of-woe', { skipPrep: false, skipCutscenes: false, skipResults: false, seed: 1 })`.
  No confirm key was pressed on the title first. After that, every step was a real key (or a tap for the phone
  pause tab).
- **Page health:** no page errors, no console errors and no HTTP errors in any run. Every image the page
  loaded decoded in the page with `createImageBitmap`. No actor, pose or console line ever reported a
  procedural placeholder.

### The walk at four sizes (dev server)

The walk is: party prep, Enter, the pre scene advanced line by line with Enter, then the first command menu
(Yuna, White Mage). Then one real action with Enter presses: the first-time card, White Magic, Pray, and the
group target. Yuna plays Pray on the whole party.

| Size | Prep | Pre scene | First menu | Real action | Images, all decoded | Placeholder poses |
|---|---|---|---|---|---|---|
| 1600x900 | ok, "XV · The Den of Woe", with the objectives and tip | 8 lines, in draft order: 4 of Yuna's narration, then lines 5 to 8, each with its portrait | 11.2 s after the battle opened | `yuna` Pray → party | 60 | none |
| 1280x720 | ok | the same | 11.5 s | the same | 57 | none |
| 2000x1012 | ok | the same | 11.5 s | the same | 57 | none |
| 390x844 (touch) | ok | the same | 11.5 s | the same | 60 | none |

**Pause, CHAPTER tab.** At 1600x900 the tab was opened with Esc and then a click; at 390x844, with a tap.
- The plate is `ch15-ffx2-den-of-woe` (hero plate B). Its `.2x.webp` loaded at 1982x1132 on desktop and
  1477x844 on the phone.
- The tab shows the three objectives (Get past Baralai, Get past Gippal, Defeat Nooj), "Battle 1 of 3", the
  scene "Den of Woe", the quote (line 13), the handwritten line and the three snapshots.
- The tab strip is `member:yuna, member:rikku, member:paine, chapter, guide, options, controls, music`.

### The production build (vite build + vite preview, base `/pyrefly-reprise/`)

- **Build:** exit 0. The artifact manifest decode-checked all 1,068 files: 0 problems, 0 files that failed to
  decode, 0 unverified audio. The Den's files all decode: the plate, the three shades' idles, the Baralai and
  Gippal casts, and the hero plate PNG and `.2x.webp`.
- **The walk on the preview at 1600x900 and 390x844:** the same as on dev. 60 images, all decoded, and no errors.
- **Every link on the stage (preview, seed 7, `intended`, fast):** it ended in victory with 3 links. 32
  actor/pose pairs were seen across Baralai, Gippal and Nooj, the three girls included, and none was a
  placeholder. Nooj has no `cast` painting, so his cast pose shows his idle painting, never a silhouette.
- **Callouts that fired on seed 7:** `baralai-entrance`, `baralai-count-seven` (the AI emit), `gippal-entrance`,
  `gippal-third`, `gippal-mortar`, `nooj-entrance`. Lightfall did not come on this seed.

### A win (labelled: bench speed, not human speed)

- **Seeds:** my own search on the live flow (`auto: 'intended'`, `speed: 'skip'`). Seeds 1 to 13, 31 to 47 and
  61 to 90 give 5 wins in 60 runs (seeds 7, 13, 39, 47, 77): 8 %. That is in line with the builder's 12/200.
- **Seed 7, fresh load, cutscenes on, real Enter presses through the pre scene:** it won all three links. Then
  the post scene played in draft order: Paine's "Enough. Let them rest.", then lines 9 to 15, each with its
  portrait. The results screen reads "Victory, New best". It shows 1,800 EXP ×3, AP 10, 30,000 gil and
  Magical Dances Vol. 1: Nooj's row in the research, §3.2. Enter on Confirm played line 16 ("No."), and the
  flow resolved `victory`.

### A loss and a retry

- **Seed 1, `auto: 'attack'`:** Defeat. The results read "Den of Woe — under Mushroom Rock Road · Fell", with
  Retry and Chapter Select.
- **Retry with a real Enter press:** back into battle on seed 1001. The link is `shade-baralai` at 12,220 HP.
  The party is at full: 2,488, 5,652 and 5,862. So a retry restarts the Den from the first shade (GP4 a, as
  built). The retry frame showed no errors.

### Chapter select (from the title with Enter)

There are 10 tiles, and they are the same as `main` at the merged base. Seymour and Anima (VII) is still
**Coming** and not playable. The Den is not in the list, and the page has no "Den of Woe" text. `CHAPTERS`
did not change; the diff in `encounters.ts` is type-only.

## The story against the writing bible

- **FFX-2 grammar (§2.2).** Yuna narrates the open, which is the FFX-2 chapter convention. There is one
  sincere exchange, lines 12 to 14 (three lines, under the four-line cap), and then the banter resumes (15, 16).
  Paine ends the pre-scene exchange and the post, varying the order once.
- **Voices.** Every Paine line is 2 to 8 words, with the one-word veto ("Enough.", "No."). She states a feeling
  only when Yuna asks (§1.16). Rikku is right on a technical point twice (Baralai's count, the Gun Mage's
  Mortar) and says what the others feel (line 11) (§1.15). Yuna's seam shows once (line 12) (§1.14). Every line
  is 10 words or fewer (§2.3).
- **Theme.** Nobody states it. Line 10 names Shuyin as the cause, which is a plot fact from research §6.2.
- **Our words only.** Every line is marked `[ORIGINAL]`, and the shades are silent (GP13 a). The only change from
  the draft is the moved ellipsis in Rikku's link-1 line, which the house lint required and the draft discloses.

## Findings

### Blocker (for listing, not for keeping the chapter on the branch)

1. **Nobody can win the chapter at human speed.** The builder's bench: 0/40 on the intended line at human
   speed (Wait split) and 0/40 under Active. Nooj fought fresh wins 1/40, because Lightfall's 5,000 to
   everyone kills Yuna (2,488 max HP) from full. My live seed search agrees at bench speed (5/60). Listing
   the chapter as it is would ship an encounter no human wins. The answers are sourced player-side options,
   never a boss number, and they are Bailey's call: 3 Hero Drinks (4/40), +8 levels (1/40), or both (10/40).

### Major

1. **The guide and the tactic teach the Lightfall prep, which the bench measures as worse than no prep.** The
   prep keeps the Dark Knights above 5,000 HP: the Curaga hint on Nooj, and the "plain swing" hint instead of
   Darkness. With the prep the Den wins 12/200 at bench speed and 0/40 at human speed; without it, 26/200 and
   3/40. The advice is the sources' own, and it is disclosed. Bailey decides whether to keep it.

### Minors

1. **Phone framing (390x844).** At every command menu, Baralai is cut at the right edge while the party stays
   whole. The target step does show him whole. The scene uses Chapter V's wide rigs, as every FFX-2 scene does
   on the phone, and the phone framing is a best-effort slide. The builder disclosed this.
2. **The pause hero plate.** The plate's two faces sit under the tab's text columns: Gippal's under "The
   party", Nooj's under the location and quote. On the phone only Gippal's hair shows above the text. The
   plate has no measured focal entry, so it uses `plates.ts`'s fallback. The builder disclosed this.
3. **No Shuyin portrait in the narration.** GP14 a says Yuna's narration plays over the approved Shuyin
   portrait, but `narrate` has no portrait slot, so lines 3 and 4 play over the cave. This departs from the
   pick. It is disclosed in the draft's "As built" section, and it needs a small cutscene feature or Bailey's
   okay.
4. **The music is a stand-in.** The battle cue is `boss-shuyin` (GP16 b) until Bailey picks a Den cue by ear.
5. **`src/battle/common/types.ts` grew by 9 lines** (`carriesFullPartyState`) although it is over 400 lines.
   It is the shared contract, and Chapters XIII and XIV grew it the same way. It came from the engine commit,
   not the ship layer.
6. **`src/scenes/index.ts` is at 399 lines.** The Chapter XI, XII and XIV branches also register scenes
   there, so it needs compacting when they merge.
7. **The results tally shows only Nooj's link.** It lists 1,800 EXP, 30,000 gil and Magical Dances Vol. 1,
   which are Nooj's sourced values, not the three shades' sum. This is shared chain behaviour, and I did not
   check it against the other chains.

### For the integrator (not findings)

- `main` has moved to `ba201aff` (chapter select v2, the boss painted on its scene). The dry-run merge
  conflicts only in `docs/CONTRACT-CHANGES.md`. Listing the Den under v2 will need its tile. The record's
  `thumbnailKey` is `chapter-ffx2-den-of-woe`.
- Listing stays the driver's step, following commit 5c8706d6.

## Re-check after repair 1 (commit `09303d03`), 2026-09-25 evening

**Game case: FFX-2 only.** The checker built none of the repair and edited nothing under `src/` or
`tests/`; this section is the only change. Scratch: `D:/Tools/pyrefly-scratch/chapters/den-of-woe-recheck/`.

### Mechanical checks

| Check | Result |
|---|---|
| `tsc --noEmit` | exit 0 |
| Den files (9) + locked-hash test | 10 files passed, 106 tests (9 skipped: the `PYREFLY_MEASURE` table) |
| Full vitest (`--testTimeout=60000`) | 418 files passed, 2 skipped; 7,844 tests passed, 21 skipped, 1 todo |
| `node tools/orphans.mjs` | 762 modules, 738 reachable, 24 orphaned (unchanged; the new `builds/den-of-woe.ts` is reachable) |
| Locked art (sha256, approved + judge-locked) | 225 ok, 0 mismatched, 0 missing |
| House style | new files 61 / 122 / 176 lines; `denOfWoeDrive.ts` 329 to 369; no file over 400 grew |
| Boss numbers | untouched: the enemy file only gains the `checkpointOnEntry` switch and wraps Gippal and Nooj |

### The shipped chapter is unchanged (proved on the engine, not by reading)

A scratch test (`equiv.test.ts`) put the ship commit's guide and tactic (`git show 83fd56e0~0:` of each
file) beside the repaired ones. The guide serialises byte for byte the same. Over 80 whole Den chains
(Wait, carried state, bench speed) the repaired tactic and the old one made **3,298 decisions with 0
differences**; 7 of the 80 cleared, in line with the bench's 12/200. The kit is `farplaneBuild` itself and
no link is a checkpoint (the options test asserts both).

### The options table reproduces

`PYREFLY_MEASURE=1` on `den-of-woe-options-bench.test.ts` (74 s alone) printed the sheet's table cell for
cell: shipped 0 (0/4/4), no prep 15 (15/38/50), Hero Drinks 18 / 28, levels 19 / 22, both with the prep
52 (52/125/153), both without it 39 (39/115/160), Active 7 or less everywhere. The harness is
deterministic, so this proves the table is honest output, not that the human model is right.

### Sensitivity of the human model (my own sweep, first try, 200 seeds, Wait split)

| Menu time / top list | shipped prep | shipped no prep | Drinks prep | Drinks no prep | Levels prep | Levels no prep | **Both prep** | **Both no prep** |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| 1.0 s / 0.3 s | 4 | 14 | 26 | 38 | 24 | 36 | 60 | **66** |
| 1.5 s / 0.5 s (the sheet's) | 0 | 15 | 18 | 28 | 19 | 22 | **52** | 39 |
| 2.5 s / 0.8 s | 2 | 14 | 13 | 15 | 7 | 33 | 38 | **48** |

- **"Both" is the best kit at every speed.** The kit recommendation holds.
- **The prep's verdict does not hold.** Under "both", the prep beats no prep only at the one 1.5 s point on
  the first try. It loses at 1.0 s and at 2.5 s, and it loses within five tries at 1.5 s too (153 against
  160). On every other kit, no prep wins at every speed.

### Verdict on the two findings

- **B1 (listing blocker): answered, still open until Bailey picks.** The four options are built OFF,
  correct and measured. Nothing is listed. With the switches as they are, the chapter still loses 0/200 at
  human speed, so B1 blocks the listing until Bailey replies. The repair did what the brief allowed.
- **M1 (major): still open, and the sheet's resolution is too strong.** The sheet and the repair's
  forBailey say that picking "Den: both" settles M1 as "keep the advice", because the prep pays once both
  kit options are on. That rests on one speed point. Faster or slower players, and players who retry, do
  better without the prep. On the evidence, the prep costs or ties wins on every kit, so the honest line to
  Bailey is: "Den: both" plus a separate prep call, with no prep as the measured lean (66 / 39 / 48 against
  60 / 52 / 38). The switch is built and works; only the sheet's recommendation and its "Replies" wording
  need correcting before Bailey reads it.

### Minor, new

1. **The sheet's recommendation line conflicts with its own table.** `docs/plans/den-of-woe-options-2026-09-25.md`
   says the prep "pays" under both options, but its own table shows both-no-prep ahead within five tries
   (160 against 153) and within three nearly level (115 against 125). Fix the wording when M1 is re-put.

The 7 minors above are untouched by the repair (out of its brief), as the builder disclosed.

## Re-check after repair 2 (2026-09-25, commit e896604f)

**Game case: FFX-2 only.** I edited nothing except this note. No switch, nothing under `src/` and no boss
number changed between `2f29108a` and `e896604f` (`git diff --stat -- src` is empty). The prep switch is
still `true` and every other switch is still OFF.

### Reproduced on the engine

`PYREFLY_MEASURE=1` on `den-of-woe-options-bench.test.ts`: 11/11 pass in 100 s. The original table is
unchanged (shipped 0 (0/4/4), both prep 52 (52/125/153), both no prep 39 (39/115/160)). The new sweep
prints my earlier re-check sweep cell for cell at all three speeds and on all four kits. It adds
within-five under both options: 170/173 at 1.0 s, 153/160 at 1.5 s, 126/134 at 2.5 s (prep vs no prep).
`tsc --noEmit` is clean. The test file is 176 lines. Log:
`D:/Tools/pyrefly-scratch/chapters/den-of-woe-recheck2/bench.log`.

### Verdict

- **M1: fixed.** The sheet now puts the prep to Bailey as its own call, with "drop it" as the measured
  lean. It has the speed table, and its replies name the kit and the prep separately. The test asserts the
  lean: no prep wins on the three weaker kits at every speed, and under "both" at 1.0 s and 2.5 s and
  within five at 1.5 s. It also asserts that "both" is the best kit at every speed. The handoff and the
  bench notes agree with the sheet.
- **B1: still open, awaiting Bailey's pick (listing only, not a defect).** Nothing is listed, and the
  shipped chapter still wins 0/200 first tries at human speed.

### Minor, residual (wording only; the lean survives all of them)

1. **"Anyone who retries" is too broad.** The sheet's short version item 3 says "anyone who retries" does
   better without the prep, and recommendation 2 says "every player who retries". The sheet's own table
   says otherwise. Within three tries from Baralai at 1.5 s, the prep leads (125 against 115). From the lost
   shade, it leads within three (119 against 114) and within five (160 against 158). The claim is true only
   within five from Baralai. Say "within five tries from Baralai".
2. **The kit's headline quotes the prep line.** Short version item 2 and recommendation 1 give "about 1 in
   4 first try, 3 in 4 within five". Those are the numbers for both options *with* the prep (52 / 153). The
   recommended pair, both options with no prep, is about 1 in 5 first try and 4 in 5 within five (39 /
   160). The Replies list has the right figures.
3. **A bare "Den: both" keeps the prep.** The sheet says that when Bailey names the kit alone, "the prep
   stays as shipped", which means ON. That is the line the sheet advises against. The driver should read a
   bare "Den: both" as keep-the-prep, or ask, and should not assume the lean.
4. The test asserts within-five only at 1.5 s. The 1.0 s and 2.5 s within-five cells are printed but not
   asserted. This is not a correctness problem, because the first-try asserts already cover those speeds.

The 7 minors from the first ship check are still out of scope and unchanged.

## Builder's answers after Bailey's pick (2026-09-26; commits `168ea0f2` merge, `f61b85e5` pick)

**Game case: FFX-2 only.** Bailey: "I pick your recommendation for Den of Woe" = "Den: both, drop the
prep". This section is the builder's, not the checker's; it answers the re-check of `44fe6ce3`.

- **B1 (listing blocker): answered by the pick, for the checker to confirm.** Both kit options are ON
  (3 Hero Drinks, +8 levels, both `[estimate]`), the prep is dropped, and the retry stays from Baralai.
  `den-of-woe-shipped-bench.test.ts` on the registered record: 39 / 200 first try and 115 / 160 within
  3 / 5 tries at 1.5 s / 0.5 s (Wait split); 66 / 173 at 1.0 s; 48 / 134 at 2.5 s; bench 102; Active 7.
  That matches the sheet cell for cell. Listing stays the driver's step.
- **M1: closed by the pick** (`DEN_OF_WOE_LIGHTFALL_PREP = false`). The guide, the tactic and the tip
  teach the Hero Drink against Lightfall and carry no prep hint (`den-of-woe-options.test.ts` pins it).

The four wording minors:

1. **"Anyone who retries" was too broad.** Fixed. The sheet's short version and recommendation 2 now
   say "within five tries from Baralai", and they add that the prep still leads within three at 1.5 s
   (125 against 115).
2. **The kit's headline quoted the prep line.** Fixed. The short version and recommendation 1 now give
   the recommended pair's 39 / 160 ("about 1 in 5 first try, 4 in 5 within five"). The 52 / 153 figures
   are named as the pair *with* the prep.
3. **A bare "Den: both" keeps the prep.** Fixed in "Replies": a bare "Den: both" does not settle the
   prep, and the driver asks. It is moot for this pick, because Bailey named the recommendation, which
   is both calls.
4. **Within five was asserted only at 1.5 s.** Fixed. `den-of-woe-options-bench.test.ts` asserts no prep
   ≥ prep within five at 1.0, 1.5 and 2.5 s (173 ≥ 170, 160 ≥ 153, 134 ≥ 126), and it passes.

**New, for the driver (not fixed; shared FFX-2 plumbing, the same on `main`):** in
`src/battle/ffx2/resolve.ts` `targetForHit`, an all-target move indexes `living[hitIndex %
living.length]` over a list re-filtered after each hit. When a target dies mid-move, the last girl is
skipped and an earlier one is hit twice. Seen live on seed 6: Lightfall hit Yuna, Rikku (KO), Yuna, and
never Paine. Hitting each target once moves the shipped Den to 34 first try and 149 within five at
1.5 s (scratch copy, not committed). The sheet's "Bailey's pick" section has the full figures.

## Independent check of Bailey's pick (2026-09-26, head `8acc88f5`)

**Game case: FFX-2 only** (Chapter XV). Checker, not the builder; everything below was re-run, not
copied. Pick: "I pick your recommendation for Den of Woe" = "Den: both, drop the prep".

**Verdict: no blocker. The chapter can be listed.** B1 is closed by the pick: the chapter is winnable
at human speed, and the numbers match the sheet exactly. M1 is closed: no Lightfall prep is left
anywhere a player sees it.

### Re-run

| Check | Result |
|---|---|
| `npx tsc --noEmit` | clean |
| Full vitest, `--testTimeout=60000` | 436 files passed, 3 skipped, 0 failed (8,133 tests); no flake |
| `node tools/orphans.mjs` | 24 orphaned, the same list as the main tree |
| `verify-approved.mjs` (`ROOT` = this worktree) | 225 ok (177 approved + 48 judge-locked), 0 mismatched, 0 missing |
| Shipped bench (`den-of-woe-shipped-bench.test.ts`, `PYREFLY_MEASURE=1`) | 66 / 136 / 173 at 1.0 s; **39 / 115 / 160 at 1.5 s**; 48 / 99 / 134 at 2.5 s; bench 102 / 173 / 199; Active 7 / 15 / 20. Identical to the builder's numbers and the sheet, cell for cell |
| Options bench, all 8 rows and the three-speed prep table | identical to the sheet, cell for cell (for example "both, no prep" 39, 102, 7, 80, 39 / 115 / 160, 39 / 114 / 158) |
| Chapter XI carry pins after the merge | recomputed on a fresh export of `main` 30420871 with the same helper: the 8 `ch11` and 8 `sisters` hashes match the test's pins, so the re-record is not circular |

### The diff since `44fe6ce3` (the main merge read separately)

- **No boss number moved.** `src/data/ffx2/enemies/den-of-woe*.ts` and `src/battle/ffx2/ai/den-of-woe.ts`
  are byte-identical to `44fe6ce3`. `farplaneBuild` is untouched; the kit is a copy.
- **Switches:** `DEN_OF_WOE_HERO_DRINKS` = 3, `DEN_OF_WOE_LEVEL_BONUS` = 8, `DEN_OF_WOE_LIGHTFALL_PREP` =
  false, `DEN_OF_WOE_RETRY_FROM_LINK` = **false** (a loss retries from Baralai).
- **Every `[estimate]` is labelled:** the drink count and the level raise, in the kit file, the record
  header, the guide header, the tactic header and the sheet. The 4,500 HP drink line is marked "our
  line, not game data".
- **No Lightfall prep left:** the Curaga and plain-swing hints are added only when the switch is on,
  the tactic's `prepWindow` returns false, and the tip and the guide rule no longer name the Phoenix Down.
- **The merge of main is additive.** Outside the Den's own files, the branch differs from `main`
  30420871 only by the Den's registrations: chapter meta numeral XV, the unlisted list, encounter
  ids, the scene registry, and the guide and tactic indexes plus their tests. Every shared engine and
  presentation delta equals the branch's pre-merge delta.

### Real keys on my own production build

Headless GPU Chromium, vite preview on 5810, fresh context each run. The chapter is unlisted, so each
run opened it with `gotoChapter`. Frames and JSON are in `D:/Tools/pyrefly-scratch/den-check/`.

- **1600x900 and 390x844:** prep shows LV 54 / 56 / 58. The CHAPTER tab carries the new tip at both
  sizes. The Items tab, reached with the Right key, lists Hero Drink ×3. The pre scene plays its 8
  lines by Enter. The battle opens at 2,824 / 6,456 / 6,654 max HP, and the first menu comes up in
  11.3 to 11.6 s. Yuna's Pray went in by Enter. The pause CHAPTER and GUIDE tabs open, and at 1600x900
  the GUIDE tab's designed line is the new tip.
- **The Hero Drink on Nooj, by real keys (seed 6).** The shipped tactic played at skip speed to Nooj.
  The debug API handed control back at 6,137 HP. From there every turn was real keys: Pray, Darkness
  twice, then Yuna **Item > Hero Drink > Yuna** at Nooj 3,709. She was Invincible, and Lightfall
  (Nooj 663 later) read "Yuna miss, immune; Rikku 5,000, KO".
- **A win to results (seed 4, a seed of mine).** The shipped tactic played at skip speed, with real
  Enter through the pre scene, all three shades, the 8-line post scene ("Enough. Let them rest." first)
  and results: "CLEARED · Victory · NEW BEST". The flow resolved victory over 3 links. A scan of seeds 1
  to 12 by the same tactic won 7.
- Every run: 0 page errors, 0 console errors, 0 HTTP errors. Images decoded 61 to 67 per run, 0
  broken. No placeholder, `{target}`, `undefined` or `NaN` text. No horizontal scroll at either size.

### Findings (none blocks listing)

1. **Major, disclosed, shared FFX-2 engine (the same on `main`): a girl left alone is chain-locked by
   Nooj, and immune misses feed the lock.** Seed 6, after my keyed drink: Greedy Aura KO'd Paine and
   Lightfall KO'd Rikku. Yuna, Invincible, then sat at a full gauge (ticks 29,779 of 12,727 needed)
   while Nooj acted at least 5 times running. She never got a turn, Invincible expired, and the run
   was a defeat. The log shows a `chain` event on Yuna before every "miss, immune". The cause is read
   from the code, not measured apart: `registerHit` runs before the immunity check, the chain window
   is 6,000 ticks (2 s), and Nooj's bar needs 5,737. So the Hero Drink saves a girl from Lightfall, but
   a sole survivor cannot act. The benches already include this, so the 39 / 160 stand. Whether an
   immune miss should chain in FFX-2 is unsourced here: a question for the driver, not a number to tune.
2. **Major, disclosed, shared (the builder's finding, confirmed on the engine): all-target moves wrap
   onto a girl already hit.** In a live Lightfall I read "Yuna immune, Rikku 5,000 KO, Yuna immune",
   and Paine, who was alive, was never targeted (`resolve.ts` `targetForHit`,
   `living[hitIndex % living.length]` over a list that shrinks each hit). I did not re-measure the
   builder's scratch numbers (34 / 149).
3. **Minor: in battle the Lightfall rule shows its short form.** At 1600x900 the guide panel's RULES
   list shows "Nooj: Lightfall, 5,000 to all, once" (`fullShown` false), so the Hero Drink answer is
   not taught in battle unless the advisor picks the drink. At my drink the advisor's pick was a
   Mega-Potion. The drink is taught before the fight (the prep tip at both sizes, and the pause GUIDE
   at desktop).
4. **Minor, the builder's disclosures, re-seen:** at 390x844 the pause GUIDE "designed line" is empty.
   Yuna's row cuts the INV chip after PRO / SHL / DRK, so Invincible is not visible there (seen at
   1600x900).
5. **Minor, a note:** when a Dark Knight picks Hero Drink by keys, the target cursor opens on Yuna,
   not on herself. A knight who presses Enter at once drinks for Yuna (seed 7). It is legal, and the
   cursor can be moved.
