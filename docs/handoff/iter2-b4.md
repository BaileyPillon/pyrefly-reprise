# iter2-b4: iteration 2 batch B4, story, results, title and coach

Branch `iter2-b4` (lighter worktree `D:/pyrefly-iter2-b4`), from main `0bf77169`, 2026-09-26/27.
Plan: `docs/plans/iteration-2-batches.md` §3 "B4" plus OR-1 / D-232 (the line card, option A).
Bailey's words for this run (2026-09-26 ~23:25 EDT): "i'll go with all of your recommends. full
speed ahead please. godspeed." Not merged, not deployed. Review class: focused (D-219 makes the
coach copy focused too).

## Method checks (rule 15)

- **PR-0211** failed once as a fixed band (`t1-b4a`, `top: 8vw`: 20,366 px² over Rikku at 2000 in
  Chapter V, and the boss covered in Chapter III), then went to an options round. The method changed
  from "tune one band" to "measure, then place": the card takes the first of four slots whose box
  touches none of the party's or the speaker's projected quads (`stage.screenRects()`, the same
  measure that failed the band), picked once per beat, with option B's bottom band as the fallback.
  The acceptance is measured with that same quad measure, not by eye.
- **PR-0021** (stalled): D-204 settled the form (D-173's rotation is final); what was owed is a
  re-test at attempts 0, 1 and 2 on one profile. Done at the seam here; the live half is round 15.

## Fixed (each commit carries its rule-14 game case)

| Item | Game | What changed | Commit |
|---|---|---|---|
| OR-1 / D-232 PR-0211: mid-battle line card, option A | both | `ui/common/lineCardPlacement.ts` (pure) picks, at a beat's first line, the first of four slots clear of the party and the speaker (other fiends break ties), else the bottom band; `app/screens/midbeatLineCard.ts` applies it to the one shared dialogue box as a 0.7-scale compact card (`line-card.css`), full width on a phone. `BattleScreenCutscenes.ts` only calls three hooks. | e8ce2025 |
| PR-0037 / D-212: fielded-only speakers | both (stand-ins FFX only) | `SayStep.fallback` (additive contract, CONTRACT-CHANGES) + `story/fieldedSpeakers.ts` (per-game party tables). Stand-ins authored on every FFX mid line whose speaker is outside the opening formation (I, II, III, VII, VIII, IX, XII, XIV). FFX-2's party is always all three, so nothing moves there, and Auron or Jecht in Chapter V stay voices. | e8ce2025 |
| PR-0204 / D-203: Natus Talk lines | FFX | The three drafted Talk exchanges as `ability-used talk` mid triggers, once each; Seymour answers with the Natus portrait (new speaker id `seymour-natus`, plate "Seymour"). | b0524805 |
| PR-0160 / D-213: Chapter VIII Rikku reword | FFX | Rikku: "It's in Bevelle. And it's within the hour!" (was "He says Bevelle. He says within the hour."). Brother untouched. | ae86047c |
| PR-0133 XI half / D-211 | FFX-2 | Leblanc, Ormi and Logos stand for their own epilogue lines, one at a time in the one spot XII and XIV use. Chapter IV checked: its sanctum is empty by the script's own direction, so nothing staged there. | 8e28fc70 |
| Coach eats reticle taps on a phone (`t1-b5`) | both | While the HUD root is `--targeting-enemy`, the coach line is `pointer-events: none` (`coach.css`). | f3fced1b |
| Chapter II coach line over the intent slab (`t1-b3a`) | FFX | `ui/coach/coachIntentAvoid.ts`, from `CoachLayer.update`: the line steps off `.eint__panel` with the existing `clearOfPanels` solver. `CoachMark.ts` untouched. | f3fced1b |
| "Hold click skip" (CHK-015, `t1-b4a`) | both | `ControlHintItem.pointer` may be `null`; the scene strip's skip entry is off for a mouse, which skips through the menu chip. | 30cd7016 |
| PR-0172: defeat caption into CHAPTER SELECT | both | The caption is two spans in a 282-grid-px run that ends 8 px above the buttons; the location takes the ellipsis, "FELL"/"CLEARED" never does (`results-fit.css`). | ba09fd2f |
| PR-0120: results painting stops short at 2000x1012 | both | Wider than 16:9, the right gutter carries the wedge's ink to the window edge (`.rres::before`), fading in with the stage. | ba09fd2f |
| A-16: the title's first frame | both | `index.html` preloads the plate with the planes' own candidates; a 32 px inline WebP of our key art under the far plane; every layer held until decoded (2.5 s cap); `upgradeTitlePlanes` no longer re-sets a srcset (the aborted keyart request). | f1415dec |
| PR-0211 follow-up: settle, then re-check between lines | both | The first browser run showed a pick taken while the camera eased back from the triggering action: the card sat over Braska's Final Aeon (III 1600, 21,938 px²) or fell back to the band over the party (III 2000, 106,473 px² of torso). The card now hides for 500 ms while its place is re-picked each frame, then stays; between lines it moves only if the party or the speaker has come under it. | bc47cbe1 |
| A-16 follow-up: no abort on a slow first visit | both | At 4 Mbps the manifest was not in hand at mount, so the 1x plate started and was aborted. The markup now offers the preload's candidates while the manifest cannot say, and takes them back if the master is missing. | 05d84f67 |
| PR-0063 (capture first) | both | The capture passes, so no code change: the IV dossier shows `yuna-x2`, `rikku-x2`, `paine`; I shows tidus, yuna, kimahri; III shows tidus, yuna, auron. | debcb435 (frames) |
| PR-0021 re-test (D-204) | both | One profile, Chapter I, attempts 0/1/2: three speakers' first lines; five wins, three distinct lines. Seam test. | 93dd9240 |

## Open (stopped for a design choice or Bailey's word, or not this batch's file)

- **D-216, the Chapter XII disc-turning coach line (FFX).** Stopped for Bailey's word on the copy
  and the look. Every line in the coach deck is Bailey's pick, verbatim, or labelled an agent's
  draft; the critic's proposal said "mocked only on a yes", and the yes (D-216) accepted the idea,
  not words or a frame. The speaker is a choice too: the proposal names Wakka or Lulu, while every
  FFX coach line is Auron's (`coachCopy.ts`; `CoachMark.speaker` is `'Auron' | 'Rikku'`). The
  trigger is ready to build once picked: show it the first time the advisor's top row is a disc
  turn (`advisor-omnis.ts#discTurnOf`, which `t1-b3a`'s check found also credits items and
  all-target rows; mirror the engine's `discTurnFor` first). Drafts in Auron's register, for a
  mockup round:
  (a) "The discs feed his spells. Strike one and it turns."
  (b) "Four discs, one element. Break the set before he casts."
  (c) "Hit a disc. Three alike, and his spell reaches everyone."
- **Trema: no victory pose (D-226, FFX-2).** Not this batch's files. The pose is set in
  `BattlePresenterBeats.ts` (B2's), which has no `victoryPose` port yet (presentation A-4, B2), and
  the value belongs in `chapter-meta-trema.ts` (B5's, per the plan's hand-over table). The sourced
  answer is already on main (dd9d0a78: no pose after Trema, our estimate). Owed: B2's port, then
  B5's `'hold'` for Chapter XIII.
- **The five Natus telegraph callouts (FFX).** D-203 put the three Talk exchanges in. The draft's
  telegraphs (the Protect counter, the first Break, the first shatter, Banish, the third Haste) are
  not built: the trigger vocabulary cannot name most of them, so they need emitters in the Natus
  rules, as Omnis has (`seymour-omnis-callouts.ts`). That is an engine change with a bench. If the
  plan's "and their callouts" means these, this item is open.
- **PR-0021, live half.** The rotation re-test is done at the seam; the real-key half (one profile,
  three Chapter I wins) stays with round 15, as the plan has it.
- **PR-0120, a note.** The acceptance ("no cream strip at the right edge") passes by carrying the
  wedge's ink to the window edge. The painting itself still ends at the 16:9 stage's edge, now
  against ink. A painting that bleeds to the edge would be a look change (rule 9).
- **The FFX-2 half of the reticle-tap check** is proved by the unit test on the shared CSS rule. A
  real tap under an FFX-2 line was not captured: the FFX-2 line fades on its own before any target
  step, and Yuna's White Mage first menu in Chapter IV has no Attack.

## Checks

- `npx tsc --noEmit`: clean. Full `vitest run --testTimeout=60000`: 499 files passed, 4 skipped;
  8,652 tests passed, 29 skipped, 1 todo. `node tools/orphans.mjs`: 24 orphaned, the same as main.
- File sizes: `CoachLayer.ts` stays at 399 lines; `CutsceneScreen.ts` stays at 418 (it was 418);
  `BattleScreenCutscenes.ts` was 491 and is 503: wiring and two option comments only (the logic is in
  `midbeatLineCard.ts`). New CSS went into new files (`line-card.css`, `results-fit.css`,
  `title-reveal.css`), because `dialogue-box.css` and `results.css` are over 400 lines and
  `frontend.css` is another batch's. The `dsl.ts` change is logged in `docs/CONTRACT-CHANGES.md`.
- Browser checks waited for `round14-capture.done` (it appeared at about 03:45 EDT). Then: a
  production build of this branch (`vite build --outDir dist-b4`), `vite preview` on ports 6140 to
  6142, headless Playwright with `PYREFLY_BROWSER=gpu`. Every server was stopped by its own PID, and
  nothing is left listening on 6140-6149; `dist-b4` was removed afterwards. Scripts:
  `.b4-linecard-tmp.mjs` and `.b4-checks-tmp.mjs` (agent scratch, untracked). Frames and
  `report.json` are in `docs/screenshots/iter2-b4/`.

| Check | Result |
|---|---|
| PR-0211 A: III and V, intended strategy, seed 1, speed fast, at 1600x900, 2000x1012 and 390x844 | 324 lines, Shuyin's own included: **0 px²** against the top 65% of every party quad and against the speaking boss's quad, on every line. Places used: top-left, top-right and bottom-right; on the phone, top, upper and the band. `linecard-*.jpg` |
| PR-0037 | Unit, 36 tests: under the opening formation every mid line in all 15 chapters is spoken from the field, and a benched speaker never speaks. |
| PR-0204 | Chapter X by the intended strategy: all three Talk exchanges played (Tidus, Auron and Yuna, each answered by Seymour). `natus-talk-tidus.jpg` |
| PR-0133 XI | Chapter XI won, the epilogue walked with real Enter presses: Leblanc, then Ormi, then Logos, each alone on the plate for their line. `xi-epilogue-*.jpg` |
| PR-0160 | The voice test and the lint pass. No browser frame. |
| Coach, Chapter II | Fresh profile, first menu, E opens the slab: the line (y 365 to 510) sits below the slab (bottom at 352), clear of IF YOU ATTACK. `coach-ii-1600-intent-open.jpg` |
| Coach, phone taps | 390x844 touch, Chapter I: Attack tapped; the Mortiorchis reticle lies under Auron's line; `elementFromPoint` returns the reticle, and the tap makes Tidus attack Mortiorchis. `coach-taps-i-390-aim.jpg` |
| Hold click | Unit: the mouse strip names no hold; keyboard and pad are unchanged. |
| PR-0172 | Chapter VIII lost at 1600x900: the caption ends at y 772 and the buttons start at 791, 0 px² overlap, reading "…TO BE… · FELL". `results-defeat-viii-1600.jpg` |
| PR-0120 | IX and VI won at 2000x1012: 0 cream pixels in columns 1910, 1960 and 1999. `results-vi-2000-right-edge.jpg` |
| A-16 | Cold visit at 4 Mbps with the cache off: every frame after "title" has mean luma of at least 0.35 (1600x900) and 0.40 (390x844); one keyart request (`keyart.2x.webp`, the preload's, reused); no failed request. `title-*-first-frame.jpg`, `title-1600-settled.jpg` |
| PR-0063 | The capture passes (see the table above). `pr0063-card-iv.jpg` |

## For the merge

- `docs/target/decisions.json`: delivery `implemented` for D-203, D-211, D-212, D-213 and D-232,
  one line each. D-216 and D-226 are unchanged.
- Hand-overs from this batch (plan §5): `DialogueBox.ts`, `CutsceneStage.ts`, `src/ui/coach/**` and
  `TitleScreen.ts` go to B7's tail; the results files go to B5. The `seymour-natus.ts` guide was not
  touched here.
- The line card needs nothing from `BattleScreen.ts`: the stage it is given already has
  `screenRects()`, and the game is read from the mounted HUD. `MidBattleCutsceneOptions.game` is
  there for B5 to pass explicitly if it wants.

## CHECK (independent, 2026-09-27)

Checker: a separate agent that did not build the batch. Tree `iter2-b4` at `7373848d`, worktree
`D:/pyrefly-iter2-b4`. Browser work started after `round14-capture.done` existed. Own production build
(`vite build --outDir dist-chk`), `vite preview` on port 6150, headless Chromium with
`PYREFLY_BROWSER=gpu`, stopped by its own PID afterwards. Scratch scripts `.b4chk-*-tmp.mjs` (untracked);
frames and JSON in `D:/Tools/pyrefly-scratch/iter2-b4-check/`.

**Gates.** `npx tsc --noEmit` clean. Full `vitest run --testTimeout=60000`: 499 files passed, 4
skipped; 8,652 passed, 29 skipped, 1 todo (the builder's numbers). `node tools/orphans.mjs`: 24, the
same as main.

**Method difference for PR-0211.** The builder's script read the card's box once per line, at the
moment the line first appeared (inside the 500 ms settle, while the card was still invisible and its
place could still change) and against the boxes of that moment. This check records **every animation
frame** in the page and measures only the frames on which the card is actually visible (opacity above
0.3), against the party quads (whole, and the top 65% the builder used) and the speaking boss's quad
of that same frame. Seed 1, the intended strategy, at `normal` speed (the player's default) and at
`fast` (the builder's).

| Check | Result |
|---|---|
| PR-0211 A, Chapter III, 1600x900, normal (41 lines) | **Fails the measure.** 4 lines take the band (every slot touched the Final Aeon's quad or the party at the opening camera) and the band crosses the top 65% of Yuna's quad by 13,298 to 13,782 px²; 2 lines on `bottom-right` cross it by 7,518 and 8,700 px² (the camera moves during the line; the card only re-checks between lines). Seen on the frame: faces and chests stay clear; the band covers the party from the hips down (`linecard/braskas-final-aeon-1600x900-s1-normal-01.jpg`), and the bottom-right card touches only the empty corner of Yuna's quad (`-04.jpg`). The speaking boss: 0 on every line. |
| PR-0211 A, Chapter III, 2000x1012, normal | Same 6 lines: band 24,796 to 25,406 px², `bottom-right` 13,395 and 14,348 px² against Yuna's top 65%. Speaker 0. |
| PR-0211 A, Chapter III, 390x844, normal | 0 against the party and the speaker on every frame of 41 lines. |
| PR-0211 A, Chapter V, 1600x900 and 2000x1012, normal | Party 0 on 45 lines. Shuyin's "No. I'll end all of it." on `top-left` touches Shuyin's quad (4,720 and 7,577 px²): the card's slanted right tip over the empty top-left of his box, his body clear (`hits/ffx2-vegnagun-shuyin-1600x900-s1-normal-L41-Shuyin.jpg`). |
| PR-0211 A, Chapter V, 390x844, normal | Speaker 0. Three lines on `upper` reach Paine's quad (2,470 to 2,599 px²) when the camera pushes in during the line; the card's bottom edge meets the tops of Rikku's and Paine's heads (`hits/...-390x844-...-L19-Yuna.jpg`). The phone card also covers the second line of the intent bar. |
| PR-0211 A at `fast` (the builder's speed), III and V, 1600 and 2000 | Does not reproduce the builder's 0 either: III 1600 is the same as at normal (band 12,888 to 13,733 px², bottom-right 7,514 to 7,602); III 2000 has 13,044 and 13,250 px² on `bottom-right`; V 1600 has Shuyin's line at 8,609 px² against his quad; V 2000 is 0. |
| PR-0211 A, never jumps mid-line | 0 moves while visible on every line, every run. Matches the picked frame's look (`sheet-2-option-a.jpg`): compact ivory card at top-left in III and V, full-width under the boss bar on the phone. The concept's "none seen yet" for the band is no longer true: the III opening camera uses it at 1600 and 2000. |
| The 500 ms settle | 84 of 258 lines are the first of a beat and are hidden for 540 to 625 ms while their auto timer runs. Short first lines are left on screen briefly: Paine's "Hn." 0.40 s, Yuna's "Ifrit." 0.59 s, Shuyin's "Let it fire." 0.62 s (normal speed). |
| PR-0037 fielded speakers | 258 lines at normal speed: every party speaker was on the field when they spoke (0 unfielded). Chapter III with Lulu benched: Rikku's and Lulu's lines came from Tidus, as authored. |
| PR-0204 Natus Talk, **real keys** (1600x900, seed 1) | Enter on each menu (Talk is the first row), Q then the arrows to bring Auron in on Kimahri's turn: all three exchanges played, word for word as the draft, each answered by "Seymour" with the Natus portrait; the card on `top-left`, 0 px² against the party and Seymour. |
| PR-0133 XI, pre scene and epilogue by Enter, 1600x900 and 390x844 | Leblanc, Ormi and Logos each alone on the plate (opacity 1) for their own line; nobody for Paine's last line. Note for Bailey, not a defect of this batch: the standing idles (Chapter VI's) wear different costumes from their dialogue portraits (Ormi most of all). |
| PR-0160, by Enter through the Chapter VIII pre scene | Brother: "YUNA! Bevelle! They are marrying her to that man!", then Rikku: "It's in Bevelle. And it's within the hour!" |
| Coach, Chapter II, fresh profile, E, at 1600x900, 2000x1012, 1280x720 | 0 px² against IF YOU ATTACK and against the slab at all three; inside the viewport; clear of the advisor card. |
| Coach, phone taps, Chapter I 390x844 | Tap Attack, then a tap on the Mortiorchis reticle under Auron's line: `elementFromPoint` is the reticle, and Tidus attacks Mortiorchis. FFX-2 (IV): Yuna's first menu has no Attack, so not tapped (as the builder found). |
| CHK-015 hint strip (Chapter I pre scene) | Mouse: "Enter advance · Esc menu" (no hold); keys: "Hold Enter skip" kept; touch unchanged. |
| PR-0172 | Chapter VIII defeat at 1600x900 and 2000x1012: caption and buttons 0 px², "... TO BE… · FELL". At 390x844 the phone page has its own caption (`.rresp`), which this batch did not change: it is cut at "THE APP" and loses "· FELL" (outside the acceptance, which is 1600). |
| A-16 | Cold visit, cache off: at 4 Mbps minimum frame luma 0.347 (1600x900) and 0.301 (390x844); at 1.2 Mbps 0.353. One title image request each (`keyart.2x.webp`), no failed request. The built preload carries the `/pyrefly-reprise/` base. |
| PR-0063 | Reached by Enter from the title: every FFX-2 card shows `yuna-x2`, `rikku-x2`, `paine`; every FFX card shows its own three. |
| Regression, scene box | The pre-battle scene box in I (FFX) and IV (FFX-2) at 1600x900 and IV at 390x844 has no card classes and sits at its usual place. |
| PR-0120, 2000x1012, chapters the builder did not use | I (FFX, a defeat) and IV (FFX-2, a win): 0 cream pixels in columns 1880, 1940, 1980 and 1999. The painting still ends at the 16:9 edge, with the ink gutter beyond it (the builder's note). The left gutter stays paper on the FFX-2 win, by design. |

**House style.** `src/ui/coach/coach.css` goes from 398 to 408 lines (over the 400 limit this batch
put other new CSS in new files to respect); `BattleScreenCutscenes.ts` 491 to 503 and `dsl.ts` 603 to
634 (both already over). `CoachLayer.ts` stays at 399 by folding a doc comment into a line comment.

**Copy.** The stand-in lines (PR-0037) are new agent-written wording across eight FFX chapters, while
D-216 was stopped for Bailey's word on wording. One reads wrong if it fires: in Chapter I's
`first-zombie`, Tidus's stand-in says "Yuna, don't heal me! Not now!", which is right only when Tidus
is the one turned to a zombie.

**Verdict.** Everything except the line card's acceptance reproduces. PR-0211 option A improves on main,
matches the picked frame, and never jumps mid-line. It does **not** meet "no intersection with party
torsos or the speaking boss" in III and V at 1600 and 2000 when measured on every visible frame, at
either speed. The builder's 0 px² was measured once per line, at a moment when the card was not yet
shown.
