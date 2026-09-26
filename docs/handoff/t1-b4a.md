# t1-b4a: story, cutscene and coach fixes (thresholds program, batch 4a)

Branch `t1-b4a` (worktree `D:/pyrefly-t1-b4a`), cut from main `76f19bdb` on 2026-09-26.
The plan is `docs/plans/thresholds-program-2026-09-26.md` §2, batch 4. This is the story,
cutscene and coach half; batch 4b has registerFlowScreens, ChapterSelectScreen, BattleScreen,
BattleScreenFlow, pauseMusic, AudioManager, vite.config and deploy-pages.

Rule 15: none of this batch's items is on the stalled list. No method check was needed.

## Fixed (each against its round-13 acceptance check)

| Item | Game case | What changed | Evidence |
|---|---|---|---|
| CHK-007 story-text lint | both | `src/story/textLint.ts` rejects markup (`* _ \` [ ] < >`), `§`, `ffx-`/`ffx2-` stems, file extensions and raw ids. `lintScript` runs it (additive; CONTRACT-CHANGES entry). `tests/unit/story-text-lint.test.ts` covers every say, narrate, choice and quip in every chapter. | The test failed first on exactly one line, PR-0102. |
| CHK-021 FFX-2 speaker allow-list | FFX-2 only | The FFX-2 cast, plus Chapter V's sourced Farplane voices and the Glen fayth (writing-bible §3 E7, E5-CODA). There is also a reverse check: no FFX-2-only speaker in an FFX chapter. | same test file |
| PR-0102 | FFX-2 only | `I had the better half, dearie.` (the asterisks are gone) | lint test |
| PR-0147 | FFX-2 only | The Act I seam line now reads `...Okay. Round two.`, which fits the one room the acts share. | |
| PR-0103 | FFX-2 lines; the flag lifetime is both | `CutsceneRunner.reset({ keepFlags })`: chapter flags now outlive a mid-battle beat, as the DSL already documents. `logos-down` and `ormi-down` each set a flag and read the other's. Kill Ormi first: no KO'd speaker talks and no dead target is named as next. Logos first plays exactly as written (pinned). | `tests/unit/story-leblanc-kill-order.test.ts` |
| PR-0194 | cap FFX-2 only; counter both | `src/story/showCaps.ts`: the `farplane-voice` beat shows at most 2 times per battle. The engine still emits it and still spends the turn. | `tests/unit/story-show-caps.test.ts` (6 emits, 2 plays) |
| PR-0133 (V half) | FFX-2 only | `cutsceneFigures.ts` gains `shuyin` (his installed idle, unsent). The V post script runs `showActor('shuyin', { ms: 0 })` before `setPose`. | `pr0133-ch5-post-1600.jpg` / `-390.jpg`: cast = [shuyin], clear of the card |
| PR-0134 + FOC19-06 | FFX-2 only | New optional `ChapterMeta.bossLine`, which `bossNames` prefers. VI reads `Leblanc, Logos and Ormi`; XV reads `Baralai, Gippal and Nooj`. XV's prep blurb is now the record's own, so it matches the card. | `pr0134-card-vi.jpg`, `foc19-06-card-xv.jpg`, `foc19-06-prep-xv.jpg` (real keys) |
| PR-0159 | FFX only | Chapter VIII voice pass on 13 of 47 lines: contractions and tics for Tidus, Rikku, Wakka and Lulu (§1.1, §1.5, §1.6, §1.8). Every beat is kept. | `tests/unit/story-evrae-voice.test.ts` pins the count, the untouched lines and a per-speaker voice floor |
| PR-0073 | both | `ControlsHint` gains a per-entry `touch` wording, and on a coarse pointer it starts on that wording. Scene strip on touch: `Tap advance · Tap here menu`. The briefing swaps in `Tap Skip ... · Tap here Never show this again` through `@media (pointer: coarse)`. Desktop is unchanged (pinned). | `phone-report.json`: both taps work in Ch I and Ch V; a tap on the briefing skips it |
| PR-0119 | observed FFX-2; plumbing both | `src/ui/coach/coachHold.ts`: while `battle-midbeat` is on, a mark that comes due waits, and a live mark steps aside and returns after the beat. | unit test; `pr0119-forced-*`: 0 overlaps in 114 beat frames, mark back after |
| PR-0115 | both | Pressing P on the pause screen now means `resume`. `CutsceneScreen` opens the pause on P (`createPauseKeyLatch`). | `tests/e2e/pause-p-toggle.spec.ts`, 4/4 on a production build (Ch I and Ch VI, menu and scene) |
| PR-0211 | both | In `cutscene.css`, during a beat and above 560 px wide, `.dbox__win` sits at `top: 8vw`, which clears the portrait's overhang. Cutscenes and phones are unchanged. | `pr0211-*`: 0 px² party overlap in III and V at 1600 and 2000 (it was the whole lower party before) |
| PR-0057 | both | Capture only. Code 71059ae already fixed it. | `pr0057-*`, `phone-report.json`: `.chint` misses the body and the speaker plate and stays inside 0..390, in keyboard and touch contexts |

## Stopped

- **PR-0127 needs a design choice.** Each caption is whole on its own (scrollHeight == clientHeight). The Chapter VI prep's text column is simply taller than its 102 grid-px band: 110 at 2000, 114 at 1600 and 148 at 1280x720, where the 14 px type floor binds. So the second caption line falls below the fold, although the bottom scroll cue shows. Making room means choosing what gives way on every chapter's prep card: the photo tiles, VI's blurb, or the 1280x720 type floor (FOC-06's open question). Numbers are in `docs/screenshots/t1-b4a/pr0127-report.json`.
- **PR-0133, XI half:** not built. It is Bailey queue item 14 in the plan.

## Notes for the merge and the driver

- **Files touched outside the named list, each minimally:**
  - `src/app/screens/PauseScreen.ts`: one line for P → close. It stays at 399 lines. Batch 3 owns `pause/**` but not this file.
  - `src/app/screens/cutsceneFigures.ts`: one additive entry. No batch owns it.
  - `src/data/chapter-meta.ts`: one optional field. It stays at 395 lines.
  - `src/ui/common/cutscene.css`: owned by this batch.
  - `tests/unit/cutscene-stage.test.ts`: the staging pin now includes V.
  - `tests/unit/story-ffx2-leblanc.test.ts`: the budget sum now takes an `ifFlag`'s longer branch.
- **File length:** `CutsceneScreen.ts` was 410 lines before this batch and is 416 now. The new logic lives in `pause/keys.ts` and `ControlsHint.ts`; only wiring was added here. `CoachLayer.ts` is at 398, after two small functions were compressed.
- **PR-0159 reading:** the brief said "non-Al-Bhed speakers". Rikku's own lines were voiced anyway, because the issue and its acceptance check name her and writing-bible §1.8 is her voice. Her translation of Brother, `He says Bevelle...`, is untouched (PR-0160 is Bailey's question), as are Brother and Cid.
- **New finding, not fixed:** the scene strip's mouse wording `Hold click skip` names a hold that `Input` never reports, because there is no pointer press state. This is a CHK-015 gap. Touch no longer claims it.
- **Lenne is still unstaged** in the V post. Two figures to the right of the card is a layout no approved frame shows.
- **Coach position:** with PR-0211 the beat card now sits in the top band where FFX's coach line sits (28%/11%). PR-0119's hold keeps the two apart.

## Checks

- `npx tsc --noEmit` is clean. `tsconfig.e2e.json` shows no errors in the new spec.
- Full `vitest run --testTimeout=60000`: exit 0, 458 files and 8342 tests passed, 29 skipped.
- `node tools/orphans.mjs`: 24 orphaned, the same as main (804 modules, 780 reachable).
- Browser checks used `vite preview` of this branch's production build on port 5950 with `PYREFLY_BROWSER=gpu`, headless. The server was stopped by its PID.
