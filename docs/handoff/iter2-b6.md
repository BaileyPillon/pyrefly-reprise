# Handoff: iter2-b6 (iteration 2, batch B6: advisor, intent, FFX-2 HUD, pause and board)

Branch `iter2-b6`, worktree `D:/pyrefly-iter2-b6` (sparse, no `docs/screenshots` checkout; junctions
`node_modules` and `public/art`, removed at the end). Base: `main` at 5d604e9a, with `t1-b3b` merged
in first (B6 takes over its pause work, plan section 5). Plan: `docs/plans/iteration-2-batches.md`
section 4 (B6). Nothing deployed, NOW.md and `critic/` untouched. Review: focused (plan section 4).

Two sessions built this batch. The first made the commits from 645a30cf to cb3464cc; the second
(this note) checked every item live on a production build of the branch (`vite build`, served by
`vite preview` on 6740; base = `main` 36f506ba built the same way on 6741), found two items that
passed their unit tests but did nothing live (A-15, and the GUIDE tab label), fixed them, built the
phone lens item, and recorded the rest. A third session ran the real-key Chapter XI route for
FOC22-02 and the checks at the end. Evidence: `docs/screenshots/iter2-b6/` (commit it with
`git add --sparse`). All browser checks are headless GPU Chromium (`PYREFLY_BROWSER=gpu`), real keys,
seed 1, one browser at a time.

## Fixed, with the live check

| Item | Game | Commit | Live acceptance (production build, real keys) |
|---|---|---|---|
| REG-keycol (THIS ENCOUNTER width cap) | both | 645a30cf | Label sweep of every pause tab, scene and battle, at 1024x768, 1280x720, 1280x960, 1600x900, 2000x1012 and 390x844, FFX and FFX-2 chapters: 0 cut labels (`pause-label-sweep.json`). |
| D-234 / OR-3 / PR-0171: pause CHAPTER dossier, option C | FFX data (II, IX); shared chrome | 682a2a5d | Chapters II and IX at 1600x900 and 2000x1012, over the scene and in battle: plate slid (`pause__plate--slid`), 0 text boxes on the face region (`d234-pause-chapter-*.jpg`, `.json`). Below 1600 wide see "Disclosed". |
| PR-0028 (H legend, D-215), the pause's two live defects, PR-0117 | both; grid row FFX-2 | e02858f6 | The pause prompt reads "H painting only"; CONTROLS sentences whole at 1600x900 (`pause-controls-1600x900.jpg`); MASTER VOLUME whole at 390x844 (`pause-options-phone-390x844.jpg`); Garment Grid "STONEHEWN" whole, no eyebrow overlap at 390x844 (`pr0117-pause-grid-phone-390x844.jpg`). |
| GUIDE tab: "STRATEGY GU..." at 1280x720 (found by the sweep) | both | 117d7ebb | The guide switch column takes PR-0151's 150 px floor; 0 cut labels after (`pause-guide-strategy-guide-1280x720-after.jpg`). |
| PR-0151 (OPTIONS labels at 4:3) | both | t1-b3b (265895a5), re-checked | 0 cut labels at 1280x960 and 1024x768 (`pr0151-pause-options-*.jpg`). |
| FOC22-02: Itchy girl's card names Change (CHK-004) | FFX-2 | 2e5585fe | Engine, card follower, Chapter XI, 40 seeds: 34/40 wins before and after; declines (an idle card) 59 -> 0. Real keys, Chapter XI, seed 1 pinned: reached results and cleared on the retry; Itchy four times at Anima, the card named a Change each time and real keys cleared it; 0 misses (`foc22-02-ch11-route/`, "Chapter XI route" below). |
| NEW-C1: lone White Mage | FFX-2 (IV) | d62b77f0 | Unit tests; Chapter IV intended line 200/200 on seeds 1-200 (`benches.txt`). |
| PR-0188 + FFX-2 `statusWord` | FFX (IX); FFX-2 | 343d9eda | Unit tests (`intent-daigoro-order`, `ffx2-intent-status-word`). No live Daigoro order was captured (the order is rolled; see Open). |
| FFX-2 revive weighting | FFX-2 | dedc7a08 | Card follower, 40 seeds, base vs branch: IV 40/40, V 38/40, VI 39/40, XI 34/40, identical. |
| A-3: warm the board | both | 9387722f | The focused card's paintings are requested while it is read (39 and 81 requests in the dwell, base 0 and 3); battle screen reached sooner on V (4.2 -> 2.8 s from Enter), about the same on I. See "Disclosed" for the throttled run. |
| FOC18-04: card move | both | f0faa1a1 | 1600x900, three steps right: only the selected and previously selected cards change, dy 0, dh 0 (`board-card-moves-1600x900.json`). |
| A-15: FFX-2 action fade | FFX-2 | e8a2aab5, a5fb37a4, 0d3a10a2 | Before a5fb37a4: 0 fades in 638 samples of Chapter IV (the coach wrapper swallowed the signal). After 0d3a10a2: Chapter IV, 321 acting samples, 1 unfaded card over a protected figure (an 11 ms first frame); Chapter V, 160 acting samples, 0. The other overlapping samples are the 140 ms opacity ramp of a card already fading (`a15-actfade-*.json`, `a15-actfade-ch5-1600x900-faded.jpg`). |
| PR-0018, FFX-2 half | FFX-2 | da97b39a | Unit contrast test (every row state at 4.5:1 or better). |
| FOC-06: 14 px floor | both | cb3464cc | First command menu of all 14 chapters at 1600x900 and 2000x1012: advisor and intent minimum rendered size 14.2 px, 0 leaves under 14, 0 chips under 14, 0 clipped (`foc06-firstmenu-*.json`, `foc06-*.jpg`). |
| Phone intent strip over the Vegnagun leg's lens | mechanism both; entry FFX-2 (V) | 6a23fe8b | 390x844, link 2: lens 0% covered (was about half), leg box unchanged (the picked staging), the line whole in five lines (`lens-ch5-link2-390x844-after.jpg`). |
| PR-0019, FFX-2 half | FFX-2 | none needed | Chapters IV and VI, every first-menu row and submenu row at 1280x720 and 3840x2160: help `scrollWidth <= clientWidth` on all 40 rows, fragments joined by " · "; with the ALL ALLIES chip up (Light Curtain) the chip is clear of the band (`pr0019-ffx2-*`). |
| PR-0113, PR-0114 (capture first) | both / FFX | none needed | 390x844: party names 5.9 px apart; wheeled to the end, BEST's value ends at 716 px, above the hint bar at 777 px. The COMING badge is unobstructed at 1600x900 and 390x844 (`board-*`). |

**A-15, why the unit tests passed and the build did not.** `withCoach` wraps both battle HUDs and
`CoachedHud` forwarded no `setActing`, so B2's signal never reached the FFX-2 HUD. a5fb37a4 adds one
forwarding line to `src/ui/coach/CoachLayer.ts`. That file is B7's tail by the plan's hand-over
table; the change is additive, keeps the file at 399 lines, and B5's FFX fade needs the same forward.
Then FFX-2 ATB actions overlap (a cast's start, another girl's whole action, then the cast's heal),
and the presenter's one-slot signal cancels at every new action and every burst end, so 0d3a10a2 has
the fade follow the event stream the HUD hears first.

## Open

- **White Mage never raised at the Sisters** (new, found by the Chapter XI route, not introduced;
  FFX-2): see "Chapter XI route". Needs a paper preflight before any advisor change.
- **PR-0071** (Chapter I intended line loses seed 1). Stopped after two failed attempts (rule 15);
  needs a method check. Measured: harness 46/100 on seeds 1-100, seed 1 a defeat at 23 decisions;
  the browser `gotoChapter('seymour-flux', {auto: 'intended', seed: 1})` loses too. The line measured
  66-73/100 on 2026-09-19 (8e8cf569) and 112/200 on 2026-09-24 (6debabd9). Tried and reverted: Talk
  only with nobody down (45/100), the tactic reading the stored `seymour.phase` (45/100), no raise of a
  zombified Yuna or Tidus (41/100). The method check should bisect the drop across the engine commits
  since 6debabd9 with clean worktrees (as 6debabd9 itself did) before touching the tactic. The
  Chapter V half passes (40/40, seed 1 clears the Tail).
- **PR-0131** waits for L-4's method check (`docs/plans/pr-0131-method-check.md` does not exist yet).
- **PR-0014** waits for L-4's repro paragraph (not found).
- **PR-0127** (Chapter VI prep captions, desktop) waits for OR-12's pick; no pick is recorded.
- **PR-0197**: Q10's recommendation keeps Bailey's 2026-09-21 advisor rules, so nothing was built.
- **PR-0188 live capture**: the Daigoro order is a rolled Yojimbo turn; unit-tested only.
- **FOC23-01** (Chapter I phone slice) is B5's file (`phoneSlice.ts`), not this batch's.

## Disclosed

- **D-234 below 1600 wide, in battle.** At 1024x768 to 1440x900 in battle, Chapter II's plate is not
  slid and THE PARTY and the dossier sit on the face region (the earlier sweep). The pick's acceptance
  names 1600 and 2000, where it passes.
- **A-3 on a slow line.** At an emulated 20 Mbps with an 8 s dwell, the preload issued 2 requests
  (it loads one painting at a time, `battlePreload.ts`, not this batch's file) and the time to the
  first menu did not fall (44.2 s base, 47.6 s branch; the pre-battle scene is skipped with held Enter
  in 1.5 s steps, so it is noisy). Loading several files at once would be `battlePreload.ts`'s change.
- **A-15**: a card over a protected figure fades in 140 ms (the stylesheet's ramp), so the first
  frames of an action still show it partly.
- The phone lens slot: the line runs to five lines on the narrower right side (up to 110 px tall).

## Chapter XI route

FOC22-02's acceptance ("an itchy girl's card names Change; XI seed 1 by the route reaches results"),
by real keys: `critic/runner/lib/route.mjs ffx2-fallen-aeons win --size=2000x1012 --seed=1
--attempts=6` against a production build of 0d3a10a2 (`vite preview`, 6740), headless GPU Chromium.
Evidence: `docs/screenshots/iter2-b6/foc22-02-ch11-route/` (`run.json`, both turn logs, the frames,
`itchy-change-summary.json`).

- Attempt 1 (seed 1): Shiva cleared, lost to the Magus Sisters at 142 turns (see "New finding").
- Attempt 2 (RETRY, seed 1002, from the Sisters link): Sisters and Anima cleared, results
  "ROAD TO THE FARPLANE · CLEARED", Victory, CONFIRM back to chapter select, the clear kept after a
  reload. 29.6 minutes in all.
- At Anima Itchy landed four times (Rikku once, Yuna three times). Each time the card, read from the
  rendered `.mad__move`, named a Change in the CHANGE menu (Gunner three times, White Mage once, the
  line's own change home), real keys took it, and the spherechange removed Itchy (status-remove in the
  same step). 0 misses in 241 picks across both attempts: every move the card named was on the menu.
  The focused review's run of the same route on a44297ca had 314 misses from Anima on and never
  reached results.

**New finding (not introduced, not this batch's to fix without a method check): at the Sisters the
card never raises the fallen White Mage.** In attempt 1 Yuna fell at 643 s and for the remaining
360 s the card named Darkness and X-Potion only, while Mindy regenerated; the run lost. Engine
card-follower on Chapter XI, 40 seeds: 0 raises of a fallen Yuna in 139 to 140 decisions where a
raise row was enabled, identical with dedc7a08's FFX-2 role weight put back (so not introduced by
this batch). The same bench with 6 s at the top-level list (about the real-key route's pace, Wait
split) wins 13/40 against 34/40 at 0 ms, links 1.65 against 2.70. Suggest a batch with a paper
preflight (rule 15) for "revive the only healer in FFX-2" before any advisor rule changes; PR-0197's
advisor rules stay as Bailey set them.

## Checks

On `iter2-b6` at 0d3a10a2 (merge base with `main` 5d604e9a; `main` has since moved to 3e7d8d3e, the
merge is the driver's, plan section 6):

- `tsc --noEmit`: clean.
- Full vitest (`--testTimeout=60000`): 567 files passed, 5 skipped (benches), 9278 tests passed, 0 failed.
- `node tools/orphans.mjs`: 29 orphans, the same 29 as `main` (no new module is unwired).
- `verify-approved.mjs`: 267 ok, 0 mismatched, 0 missing.
- No file under `src/battle/ff7`, `src/ui/ff7` or `src/data/ff7` is touched.
- 400-line rule: every file this batch grew was already over 400 lines on the base and grew by 2 to
  17 lines (the new logic went into new modules: `advisor-change.ts`, `actionFade.ts`,
  `phoneBattleGuard.ts`, `chapterSlide.ts`, `boardWarm.ts`, `pause-labels.css`, `action-fade.css`). One inherited exception: `tests/e2e/portraits.spec.ts` went from 281 to 540 lines in
  t1-b3b's 7c2b56b6 (merged in, not re-split here: splitting an e2e spec wants its own run).

## CHECK (independent, 2026-09-27, did not build this batch)

Checked `iter2-b6` at 0678dafe by a separate agent: fresh production builds (`vite build`, own
outDirs, served by `vite preview` on 6750 = branch, 6751 = `main` 625b018d, 6752 = the scratch merge
of the branch into 625b018d), headless GPU Chromium from node (`PYREFLY_BROWSER=gpu`), one browser at
a time, real keys, seed 1. Evidence (untracked scratch): `tools/zz-b6check.tmp/out/` in this worktree.

**Verdict: HOLD until two things are fixed** (both small): the FFX-2 intent sentences that
343d9eda made false (1, 2) and the merge with today's `main` (3). Everything else passed or is
disclosed.

### Blockers

1. **Delta Attack's intent sentence reads "Deals no damage."** (FFX-2, Chapter XI, the Magus
   Sisters; introduced by 343d9eda, a regression against live). Delta Attack has `formula: 'none'`
   and sets the whole party to 1 HP and 0 MP (`extra.setHpTo / setMpTo`); the new `inert` branch in
   `src/battle/ffx2/intent.ts#describeAbility` calls that "Deals no damage". Proved on the engine:
   Chapter XI link 2 with all three sisters' AC at `AC_OVERDRIVE`, `engine.intent()` returns
   Cindy / Delta Attack / "Deals no damage." on the branch and "non-elemental damage to the whole
   party." on `main` (`tools/zz-b6check.tmp/delta2.test.ts`). Fix: leave rows with `setHpTo` /
   `setMpTo` (or any `extra` effect) out of `inert`, and say what they do; pin every FFX-2 enemy row
   with `formula: 'none'` in a unit test.
2. **FFX-2 enemy Dispels now read "Cures Auto Life, Shell, Protect, Reflect, Regen, Haste,
   Spellspring on one girl."** (FFX-2: Vegnagun's Bulwark Left, the Redoubt Left, Paragon Oversoul's
   dispel; same commit). "Cures" says the opposite of stripping the girls' buffs; `main` said
   "strips ...". Fix: the inert branch says "Strips ..." when the removed statuses are buffs.
   (Bahamut's Countdown and Vegnagun's charge now read "Deals no damage.", which is right.)
3. **The merge with today's `main` (17fa71d3, release 25) is textually clean but does not type-check.**
   B5 (aaff96bb) and this batch (a5fb37a4) each added `setActing` to `CoachedHud`;
   `git merge-tree` places both, and `tsc --noEmit` on the merge fails:
   `src/ui/coach/CoachLayer.ts(214,3)` and `(253,3)`: TS2393 Duplicate function implementation.
   Full vitest on that merge passes (596 files, 0 failed; vitest does not type-check). Fix at merge
   time: keep one of the two identical lines (both games, the shared wrapper).

### Re-run, passed

- Branch: `tsc --noEmit` clean; full vitest `--testTimeout=60000` 567 files passed, 0 failed.
  Scratch merge into 625b018d: tsc clean, full vitest 571 passed, 0 failed. `git merge-tree` with
  origin/main clean (625b018d and 17fa71d3, see 3) and with `iter2-b5`. Orphans 29, the same count as
  `main`. `verify-approved.mjs` 267 ok, 0 mismatched, 0 missing. No file under `src/*/ff7` touched.
- **First command menu, all 14 chapters, 1600x900 and 390x844, branch vs `main`:** reached by real
  keys on both, 0 page errors, the same menu rows and the same advisor lead move in every chapter,
  0 cut labels (the phone PAUSE chip text is an icon on both). Differences: the advisor card sits a
  few px higher (FOC-06's 14 px floor), and on the FFX-2 chapters the intent (IV, V, Den of Woe) and
  on V also the advisor card are faded at the capture moment because an enemy action was playing
  (A-15, see 5).
- **Hidden FF7 fight:** `L I M I T` on the board opens Guard Scorpion on the branch build and on the
  merge build, the board still reads 0 OF 14 BEATEN, 40 s of Enter plays turns both ways, 0 page errors.
- **D-234 (option C):** Chapters II and IX at 1600x900 and 2000x1012, over the scene and in battle,
  plate `pause__plate--slid`, 0 text boxes on the face, also 12 s later in the push-in; measured with
  the IX box widened to the union of round 13's and this batch's (x 0.40 to 0.74, y 0.20 to 0.78).
  `main`: 11 to 23 boxes on the faces. Layout matches the picked frames `ch{2,9}-*-c-slide.jpg`.
- **REG-keycol, PR-0151, CONTROLS, OPTIONS, PR-0117, GUIDE:** every pause tab over the scene and in
  battle for Chapters X, XII, VI (Leblanc), IV and IX at 1024x768, 1280x720, 1280x960, 1600x900,
  2000x1012 and 390x844: 0 ellipsised, clipped or overlapping labels, except one pre-existing cut (8).
- **FOC22-02 by real keys:** `route.mjs ffx2-fallen-aeons win --size=2000x1012 --seed=1`: 231 picks
  over two runs, **0 misses**; the card named Change twice at Anima and real keys took it from the
  CHANGE menu. With `--budget=2400000` seed 1 **reached results on the first attempt** (Victory,
  ROAD TO THE FARPLANE · CLEARED, board after reload), fight 16.6 min. No Itchy was logged in these
  runs (the saved battle log holds link 1 only), so the Itchy branch itself rests on
  `advisor-itchy-change.test.ts` and the builder's run. The White Mage revive finding did not show:
  the Sisters were cleared on seed 1 both times.
- **Phone lens (Chapter V link 2, 390x844):** lens 0 % covered (main 16 %), leg box unchanged.
- **Board:** FOC18-04 at 1600x900, three steps: only the selected and previous cards move, dy 0, dh 0.
  PR-0113 at 390x844: party names 5.9 px apart, BEST's value ends at 716 px above the hint bar at
  777 px (main passes the same). The COMING badge is unobstructed by eye.
- **A-15:** Chapter IV, 329 acting samples: 2 with the strategy guide card at full opacity over Yuna
  casting Cure (after another girl's action-end or a cancel signal); Chapter V, 169 acting samples, 0.

### Not blocking (disclosed or pre-existing)

4. Tooling (critic runner, not this batch): `route-fight.mjs` reports `outcome: "victory"` when the
   attempt's budget runs out mid-Anima (it reads a battle log that still holds link 1's victory);
   the first run stopped at 900 s with Anima at 6,843/36,000 HP, results never shown, and no retry
   was made. The default 900 s budget is shorter than seed 1's 16.6 min fight: FOC22-02's acceptance
   needs `--budget`.
5. A-15 at Chapter V: Vegnagun's figure spans most of the field, so every Vegnagun action fades the
   advisor and intent cards, also while the command menu waits for input (177 of 361 samples with a
   faded card). This is what the acceptance asks for; Bailey may want to see it.
6. D-234: the picked C frames drop the dossier snapshots; the build keeps the three snapshots beside
   the quote on Chapter II at 1600 and 2000 in battle (the face stays clear).
7. Pre-existing on `main` too: Chapter X's pause CHAPTER tab in battle puts THE PARTY's values on
   Seymour Natus's face from 1024 to 2000 wide (not in D-234's two plates).
8. Pre-existing on `main` too: at 390x844 Chapter IX's CHAPTER tab in battle cuts "GLORIOUS BANG..."
   (the builder's sweep did not cover IX at 390x844). The branch fixes main's other phone cuts
   (BOSS HP 100%, the scene names).
9. FOC23-01 is fixed on `main` by B5 (c85cfc22), not here.

Game case: this note is a record only (FFX-2 for 1, 2 and 5; both for 3, 4 and the pause items).
