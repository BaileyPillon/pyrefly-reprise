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
