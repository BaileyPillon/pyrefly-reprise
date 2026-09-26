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

## CHECK (independent, 2026-09-26)

A second agent checked this batch. It did not build it. It checked `465363d1` in this worktree.

**Result: 2 blockers, both in PR-0211. Every other fixed item passes its round-13 acceptance check.**

The checker ran its own production build (`vite build --outDir dist-check`) and served it with `vite preview` on port 5955, headless, with `PYREFLY_BROWSER=gpu`. It stopped the server by its PID afterwards. The frames and JSON are in `docs/screenshots/t1-b4a-check/`. They are left untracked, because this commit carries only this section.

- `tsc --noEmit`: clean. The full `vitest run --testTimeout=60000` exits 0: 458 files, 8342 tests passed, 29 skipped, no failures, so there is no load flake. `tools/orphans.mjs` still reports 24, the same as main. No art is touched. Approved hashes against the shared art: 207 match, 0 mismatched. 29 listed paths are absent from the shared `public/art`, which main uses too.
- The e2e spec `pause-p-toggle` passed 4/4 against the checker's build. It ran from a copy that only changed where screenshots go.

| Item | Verdict | What the checker saw |
|---|---|---|
| CHK-007 / CHK-021 | pass | The lint runs over every say, narrate, choice and quip in every chapter, and the allow-list has its reverse check. One note: the lint rejects `[`, so it would also reject the `[ALBHED]` tag that writing-bible §1.8 prescribes for Al Bhed lines. No line uses that tag today. |
| PR-0102 | pass | Chapter VI won by auto, then the aftermath walked with real Enter presses. The screen showed `I had the better half, dearie.` with no asterisks. |
| PR-0147 | pass | The Act I seam plays in the heart room, and Rikku's line is `...Okay. Round two.` (`leblanc-ormi-first-seam-*`). |
| PR-0103 | pass (real engine) | The real engine and presenter ran Chapter VI with the auto strategy retargeted onto Ormi (20 retargets). KO order: ormi, then logos, then leblanc. `ormi-down` played Ormi's own KO bark and ended on `Logos, darling. Do try to last longer.` `logos-down` was Leblanc alone, then Paine: `Just her now.` No KO'd speaker spoke after his KO, and no line named a dead target as next. The three new lines are the Leblanc-alone variant the issue's fix asks for. |
| PR-0194 | pass (auto route) | Chapter V ran on the intended auto route. The engine emitted `farplane-voice` 3 times and the line showed twice, both on the Leg link. The critic's advisor-guided real-key route was not replayed. |
| PR-0133 (V half) | pass | In the V post scene, the cast is `[shuyin]` from the first line. His figure spans x 1115-1445 at 1600 and never touches the card. Two notes. Lenne speaks five lines and is still not staged; the builder's note says so. Shuyin stands in his battle idle through the `kneel` / "He refuses to look up" beat. |
| PR-0134 | pass | Arrowing the board with real keys: VI's BOSS row reads `Leblanc, Logos and Ormi`. The other cards join with ` + `, so the two new rows use a different style. |
| FOC19-06 | pass | By real keys, XV's card and prep carry the same blurb word for word. The subtitles still differ: the card says `Three men she knows, made of what they felt` and the prep says `Three Men She Knows`. That was already there (D-191) and is outside this check. The blurb the batch kept is the one its source comment calls "placeholder card copy". |
| PR-0159 | pass | Read again against writing-bible §1.1, §1.5, §1.6 and §1.8. Tidus has `Hey!`, `c'mon` and stacked questions. Wakka has `ya?` twice. Rikku is exclamatory and hedges with "kinda". Lulu is clipped and uses no slang. The three are distinguishable with names hidden. There are still 47 lines, and the story tests pass. |
| PR-0073 | pass | At 390x844 with touch, in Chapters I and V, the strip reads `TAP ADVANCE · TAP HERE MENU` and names no key. Tapping the chip advanced the line, and `Tap here` opened the pause. The briefing reads `TAP SKIP ... · TAP HERE NEVER SHOW THIS AGAIN`. A tap skips it. `Tap here` opts out, and after a reload the briefing stayed gone. |
| PR-0057 | pass | At 390x844 in Chapters I and V, with the card visible at opacity 1, in both the keyboard and touch contexts: `.chint` overlaps `.dbox__body` by 0 and the speaker plate by 0, and stays within 0..390. |
| PR-0115 | pass | In addition to the spec: after P closes the pause, it stays closed 1.5 s later. P during a scene does not advance the line. P closes a pause that Esc opened. Five quick presses of P leave the pause open. Checked in Chapters I and VI. |
| PR-0119 | pass (by the builder's forced case) | On the Chapter VI run, 0 of the frames with a card up had a coach mark overlapping the card, seams included. The collision did not happen naturally on this route either, so the forced browser case in `pr0119-forced-report.json` is the evidence. |
| **PR-0211** | **FAIL + regression** | See the blockers below. |

### Blockers

1. **PR-0211 fails its acceptance check at 2000 in Chapter V.** Overlap here is the card's rect against the top 65% of each party figure's projected quad (`stage.screenRects()`), the same measure the builder used for "0 px²".
   - At 2000x1012, the card for Jecht's `No overtime in this one, kid.` overlaps the party by 20,366 px²: the card's bottom edge (y 424) runs across the top of Rikku's head and Paine's hair (`overlap-ffx2-vegnagun-shuyin-2000-01.jpg`). This happened on 2 of 2 runs.
   - At 1600 the same line overlapped by 3,627 px² on 1 of 2 runs.
   - Cause: during that link the camera frames the party large and high, and `top: 8vw` does not clear them.
   - Chapter III was clean at 1600 and at 2000.
2. **Regression from the same change.** In Chapter III the band card now covers Braska's Final Aeon's head and upper body, along with the Yu Pagoda tops, for the boss's own lines. Before the change the boss was fully visible. The builder's own frame shows it (`pr0211-braskas-final-aeon-1600-after.jpg`), and so do the checker's (`midbeat-braskas-final-aeon-1600-0*.jpg`).
   - This trades CHK-008's "dialogue over actors" from the party onto the boss.
   - No fixed band clears both the party and the boss at every camera. Where the card goes, for example the left column the dimmed HUD leaves free, or a narrower card, is a placement choice. It probably needs options for Bailey under rule 9 rather than another tuned number.

### Other notes (not blockers)

- `CutsceneScreen.ts` is 418 lines (410 on main). The new logic is in modules and only wiring was added.
- PR-0127 was stopped for a design choice. The checker did not re-measure it.
