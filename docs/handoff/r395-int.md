# r395-int: release 39.5 integrated (not deployed)

Branch `r395-int` = live 39.4.1 (`04cdcd45`, branch `r394-int`) + `origin/r395-settings` (`ad557800`) + `origin/r395-voice2` (`03026328`). Worktree `D:/pyrefly-r395-int` (sparse: no `docs/screenshots` on disk; commit a frame with `git add --sparse`). Pushed to `origin/r395-int`. **Nothing is deployed.**

**Game case:** both games for the plumbing and the settings (title screen choice, chapter-select music, the OPTIONS rows, the VOICE bus); **FFX only** for the recordings (Tidus, Yuna, Auron in the FFX chapters; FFX-2 and FF7 ask for no voice and drop the two voice rows, rule 14).

## What 39.5 contains

| From | What | Case |
|---|---|---|
| `r395-settings` | `titleArt` (`'farplane'` default / `'echo'`), TITLE SCREEN row; The Echo (Yuna in still water) as a second selectable title screen, its own painted lettering so the HTML wordmark is left out; `chapterSelectMusic` (`'b'` default / `'a'` / `'c'`), CHAPTER MUSIC row; two new cues `chapter-select-a` and `chapter-select-c` (LAME V4, 2.74 MB) | both |
| `r395-voice2` | The FFX voice-over: 200 recordings in 11 chapter manifests (3.60 MB), `voiceOn` (ON) and `voiceVolume` (0.9) settings, VOICE and VOICE-OVER rows, a voice bus under MASTER, the voice director in the dialogue box, the variant switch `tools/audio/voice-variant.mjs` (installed: "pauses shortened") | FFX only for the files; both for the code |

Lane notes (unchanged, read them for detail): [r395-settings.md](r395-settings.md), [r395-voice2.md](r395-voice2.md), [r395-voice.md](r395-voice.md).

## Merge resolutions

1. `git merge origin/r395-settings` into a branch cut from `origin/r394-int`: clean.
2. `git merge origin/r395-voice2`: git merged `SaveData.ts`, `BattleScreenFlow.ts`, `PauseScreenPanels.ts`, `pause/panels.ts`, `pause/settings.ts`, `tools/audio/manifest-io.mjs` and `.d.mts` without a conflict. **Three conflicts, all in tests that list the fields an old save gains**, resolved by keeping both lists:
   - `tests/unit/save-comfort-migration.test.ts`: `chapterSelectMusic`, `titleArt`, `voiceOn`, `voiceVolume` all expected beside the fx fields.
   - `tests/unit/save-fx-looks.test.ts` and `tests/unit/save-fx-parts.test.ts`: the same four.
3. Checked by reading the merged result (not trusted to the auto-merge):
   - `SaveData.ts`: `voiceOn` and `voiceVolume` are on `Settings` and in `defaultSettings()` and `migrate()`; the front-end pair stays in `saveFrontend.ts` (`migrateFrontend`), so the two migrations do not touch each other's fields. `SAVE_VERSION` is still 1.
   - `PauseScreenPanels.optionRows`: VOICE and VOICE-OVER sit after SOUND EFFECTS; TITLE SCREEN and CHAPTER MUSIC are last. `pause/panels.optionsColumns` drops the two voice rows for a game with no voice (`gameHasVoice`), drops EYE CANDY for FF7, drops X-2 BATTLE for FFX, and puts BATTLE HELP after STRATEGY GUIDE, so the front-end pair follows it.
   - `pause/settings.ts`: the voice cases (`voiceVolume`, `voiceOn`) and the front-end cases step independently.
   - `BattleScreenFlow.ts`: `voiceChapter(...)` wraps the release (voice2), the experiment run still ends with `endRun` (r394), and `chapterSelect()` plays the cue the setting names (settings). They touch different lines.
4. **One fix on top of the merge:** `tests/unit/title-art-choice.test.ts` read the Echo stylesheet's portrait block with a regex that needs LF. A fresh Windows checkout is CRLF (`core.autocrlf=true`), so it failed here and passed in the lane's worktree, whose files were written as LF. The regex now takes either ending. Test only.

## The combined OPTIONS rows

> **Superseded 2026-10-08** by the section "OPTIONS layout C, built" below: TITLE SCREEN and CHAPTER MUSIC are no longer rows of this list, one PRESENTATION row replaces them, and the list is 13 rows in both games, all in view at 1600x900. The text of this section is the state at head `9d20a330`, kept for history.

FFX chapter (14 rows): MASTER VOLUME, MUSIC, SOUND EFFECTS, **VOICE, VOICE-OVER**, TEXT SPEED, TEXT SIZE, REDUCE MOTION, LOW EFFECTS, EYE CANDY, STRATEGY GUIDE, BATTLE HELP, **TITLE SCREEN, CHAPTER MUSIC**.
FFX-2 chapter (14 rows): MASTER VOLUME, MUSIC, SOUND EFFECTS, TEXT SPEED, TEXT SIZE, REDUCE MOTION, LOW EFFECTS, EYE CANDY, X-2 BATTLE, ATB SPEED, STRATEGY GUIDE, BATTLE HELP, **TITLE SCREEN, CHAPTER MUSIC** (no voice rows).

**Seen in the pictures, needs Bailey's eye:** at 1600x900 the settings column of the pause has a fixed height (`pause-labels.css`: it stops one row short of the chapter objective and scrolls on its own, a rule from the 14-row FFX-2 column of 2026-09-29). With 14 rows in both games, **row 13 (TITLE SCREEN) sits in the fade at the bottom edge and row 14 (CHAPTER MUSIC) is below the fold until you move the selection down to it**; the list then scrolls it into view (`options-ffx-1600x900-chapter-music-row.png`). Nothing is lost and every row works by key and by click; it just does not look finished at first glance. The settings lane reported the 14 FFX-2 rows as fitting with 48 px to spare; I could not reproduce that (the same chapter, `ffx2-bahamut`, over its opening scene, `options-ffx2-1600x900.png`: TITLE SCREEN is in the fade and CHAPTER MUSIC is below the fold). I did not change the layout (a new look is Bailey's call, rule 9). Options for him: (a) leave it, the list scrolls as the phone's always has; (b) move TITLE SCREEN and CHAPTER MUSIC to their own page like EYE CANDY's (`pause/eyeCandyPage.ts`), one row on OPTIONS that opens it; (c) drop the one-row reserve above the objective. Recommendation: (b), it is also where a player looks for "title screen" and "music" choices and it frees two rows.

## OPTIONS layout C, built (Bailey, 2026-10-08: "go with C and restart the giants build")

**Game case: both games.** Shared pause plumbing; the two choices on the page (`titleArt`, `chapterSelectMusic`) are both games' (`saveFrontend.ts`); nothing here is true of one game and not the other. The list around the row still differs by game exactly as before (VOICE and VOICE-OVER are FFX's, X-2 BATTLE and ATB SPEED are FFX-2's, rule 14) and is 13 rows in each.

**What it is.** One PRESENTATION row at the foot of the OPTIONS list (accent ▸ glyph like EYE CANDY's) reads both choices at a glance (`FARPLANE · B`, `THE ECHO · A`) and opens a page in the EYE CANDY page's classes and look (`pause__ec-*`, `pause-eye-candy.css`): heading "Presentation / Title screen and chapter select", two rows (TITLE SCREEN, CHAPTER MUSIC), one help line for the focused row (to the right of the rows on a desktop window, pinned under them on a phone) with "Both games." under it, and its own `Esc BACK` prompt. Built from the measured mock (`D:/Tools/pyrefly-scratch/2026-10-08/options-layout/`, worktree `D:/pyrefly-options-mock`) as production code: no mock names, no `data-opt-layout` switch, no `?optlayout` query.

**Keys and pointer (as measured).** Down walks the list to PRESENTATION (13 stops in the FFX list, 13 in FFX-2), Enter opens the page on TITLE SCREEN, Up and Down walk the two rows (wrap), Left and Right step the focused value through its list (wrap), Enter steps forward, a tap steps the row it lands on and puts the cursor there. Esc, Backspace, X, the pad's Circle and Start, and the `Esc BACK` prompt go back with the cursor and the DOM focus on the PRESENTATION row, which then reads the new values; Q, E and a tab click close the page and change tab. Left and Right on the PRESENTATION row itself open the page (as on EYE CANDY's row); they step nothing. Every write is `adjustSetting` (the code the two list rows used), so the stored fields, `SAVE_VERSION` and the migrations are unchanged.

**Files.**

| File | Change |
|---|---|
| `src/app/screens/pause/presentationPage.ts` (new, 180 lines) | the page: `PresentationPage`, `PRESENTATION_ROWS` (ids, labels, help copy), `PRESENTATION_CLOSE_ACTION`, `PRESENTATION_ROW_ACTION` |
| `src/app/saveFrontend.ts` | `presentationSummary(settings)`, the row's value |
| `src/app/screens/PauseScreenPanels.ts` | `optionRows`: the `titleArt` and `chapterSelectMusic` rows are replaced by one `presentation` row |
| `src/app/screens/pause/actions.ts` | `PauseRowPage` and one `openPage(page)` host callback replace `openCredits` and `openEyeCandy` (their only caller was `PauseScreen`); the `credits`, `eyeCandy` and `presentation` rows all go through it |
| `src/app/screens/pause/PauseOverlays.ts` (307 lines) | `openPage`, `openPresentation`, `closePresentation`, the page in `pageInput`, `closePages` and `dispose`; `pagesSnapshot()` replaces `creditsSnapshot` and `eyeCandySnapshot` |
| `src/app/screens/PauseScreen.ts` (**399 lines: at the 400 cap, move code out before adding to it**) | the `openPage` wiring; the debug snapshot spreads `pagesSnapshot()` (`credits` and `eyeCandy` as before, plus `presentation`) |
| `src/ui/common/pause-labels.css` | the settings column's `max-height` stops at the objective line: **the one-row reserve is given back** (it was added in the eye-candy D round for a 14-row column; the list is 13 rows now) |
| `src/ui/common/pause-eye-candy.css` | the page glyph, its mirror and its focus rule also for `presentation`; on a phone the two rows that open a page give the glyph 12 px of its own (a word row's bar is 0 wide there, which put EYE CANDY's glyph on the first letter of its value, `▸ALL ON`, seen in these pictures: a side fix that also moves EYE CANDY's phone value by those 12 px) |
| `tests/unit/pause-presentation-page.test.ts` (new, 25 tests), `tests/unit/save-front-end-39-5.test.ts` (the OPTIONS-row tests rewritten for the one row) | see Tests |
| `docs/audio/THEMES.md` | "OPTIONS > CHAPTER MUSIC" now reads "OPTIONS > PRESENTATION > CHAPTER MUSIC" (two places) |

No file listed in `docs/CONTRACTS.md` changed, so there is no `CONTRACT-CHANGES.md` entry. `node tools/orphans.mjs`: 24 orphans, the same old modules as before; `presentationPage.ts` is reachable.

**Measurements** (headless Chromium, SwiftShader, dev server on a random port stopped by PID; chapters `seymour-flux` (FFX) and `ffx2-bahamut` (FFX-2); `docs/screenshots/r395-int/options-c/evidence.json` holds every number):

| Window | FFX | FFX-2 | Last row bottom vs objective line | Row hit | Smallest text |
|---|---|---|---|---|---|
| 1600x900 | 13 of 13 in view, no scroll | 13 of 13, no scroll | 681 vs 702 (21 px clear) | 27 px | 14 px |
| 1920x1080 | 13 of 13, no scroll | 13 of 13, no scroll | 818 vs 842 (24 px clear) | 32.4 px | 16.8 px |
| 1366x768 (disclosed) | 12 of 13, the column scrolls | the same | 596 vs 599 (3 px, in the fade band) | 24 px | 14 px |
| 1280x720 (disclosed) | 12 of 13 (the 13th is in the fade band) | the same | 536 vs 547 (11 px) | 22.3 px | 14 px |
| 390x844 phone | the list as always: 13 rows, 3 in view at first look, scrolls; PRESENTATION at its foot | the same | n/a | 18 to 19 px (unchanged) | 14 px |

- The page at 1600x900: rows 27 px, the help line ends at y 478, the objective line stays on screen, nothing cut, no horizontal overflow. On the phone: **rows 40 px** (touch size), the pinned help line ends at 786 of 844, `Tap a row to change it` and `Esc BACK` in the foot, nothing cut, no horizontal overflow, smallest text 14 px. No label or value is cut on any list or page.
- TEXT SIZE 115 and 130 percent were not re-measured (the mock measured C as not fitting there; the list scrolls).
- **Real keys, FFX and FFX-2 each** (the same flow in both; every press waited for the state it should change): Down x13 to PRESENTATION (`FARPLANE · B`), Enter opens on TITLE SCREEN (cursor and focus on it), Right: TITLE SCREEN `THE ECHO` (stored `titleArt: echo`), Down: CHAPTER MUSIC and its help line, Right: `A  WALTZ`, Right: `C  VOICE`, Right: wraps to `B  PIANO`, Left: wraps to `C  VOICE`, Left: `A  WALTZ`; Esc: page closed, cursor and DOM focus on `presentation`, the row reads `THE ECHO · A`, still in the pause; Left on the row opens the page and changes nothing. Phones, real taps: the row opens the page, a tap on CHAPTER MUSIC steps it (the cursor moves there), a tap on TITLE SCREEN steps it, a tap on `Esc BACK` closes it, the row reads `THE ECHO · A`. Console errors 0, page errors 0, failed requests 0 over all runs.

**Tests.** `tsc --noEmit` (by path): clean. `tests/unit/pause-presentation-page.test.ts` (25), per game (Chapter I and Chapter IV): the list is 13 rows with PRESENTATION last and neither old row on it; Down and Enter open the page on TITLE SCREEN with focus; the help line follows the cursor (title, body, "Both games."); Left / Right / Enter step both values and wrap and write nothing else; Esc lands the cursor and focus on the row, which reads the new values; Backspace, Start, Q-E and a tab click; Left on the row opens the page; taps (the row, the rows, `Esc BACK`); the page uses EYE CANDY's classes; **the settings round trip** (a new `SaveStore` on the same storage reads `titleArt echo` and `chapterSelectMusic c`; the title's plate is `art/title/echo.png` and the board's cue is `chapter-select-c`; a new pause reads `THE ECHO · C` on the row); a stored value not on the list reads as the default on the row and on the page (CHK-024); and the stylesheets (the reserve given back, the glyph rules, the phone page's 40 px rows). `tests/unit/save-front-end-39-5.test.ts` (26): the OPTIONS-row tests now pin the one `presentation` row, the 13-row lists and `presentationSummary`; its save half (defaults, the real save fixtures, migration) is untouched and passes. **Full suite, once** (`vitest run --testTimeout=60000 --maxWorkers=6`, at the end, on this tree): **938 files: 933 passed, 5 skipped, 0 failed; 13,906 tests passed, 46 skipped, 1 todo**, no unhandled error (the earlier 937-file run of the merged tree had 13,880 passed; the difference is the 25 new tests plus the one added in the rewrite of the 39.5 OPTIONS-row tests).

**Pictures** (`docs/screenshots/r395-int/options-c/`, all from this build): `ffx-1600x900-list.png` and `ffx2-1600x900-list.png` (13 rows, PRESENTATION last, above the objective line), `ffx-1920x1080-list.png` and `ffx2-1920x1080-list.png`, `*-1600x900-page.png` (the page as opened), `*-1600x900-page-stepped.png` (THE ECHO / A WALTZ), `*-1600x900-list-after.png` (the row after Esc reading `THE ECHO · A`), `ffx-390x844-list.png`, `-list-foot.png`, `-page.png`, `-page-stepped.png` and the same four for `ffx2-390x844`, `evidence.json`. Target and build side by side: the mock's sheet is `D:/Tools/pyrefly-scratch/2026-10-08/options-layout/options-sheet.jpg` (column C); the build's rows, values, page and measurements match it.

**Still open.** (1) Records owed to the records agent, not written here: the DECISIONS row for Bailey's "go with C and restart the giants build", an ACTIONS row, the CHANGELOG line for 39.5 (the OPTIONS list is thirteen rows with one PRESENTATION row that opens a TITLE SCREEN and CHAPTER MUSIC page; both games). (2) The `docs/target/targets.json` tile for this layout (picked: C; liked / disliked / must remain / must change are not recorded in his words). (3) 1366x768, 1280x720 and large TEXT SIZE still scroll the list a little, as disclosed above. (4) EYE CANDY's phone glyph fix above is a side fix he has not seen. (5) Nothing was built for release or deployed; the critic plan above is unchanged (the save-data class from the voice and settings lanes still makes it a deep review before any deploy).

## Proof

All on the merged tree, `D:/pyrefly-r395-int`.

- `tsc --noEmit` (by path, also with `--incremental false`): clean.
- Targeted group first (123 files: save, voice, title, settings, pause, options, chapter-select, audio, panel): 122 passed, 1 failed (the CRLF test above, now fixed; 18 of 18 in that file pass).
- **Full suite, once** (`vitest run --testTimeout=60000 --maxWorkers=8`): **937 files: 932 passed, 5 skipped, 0 failed; 13,880 tests passed, 46 skipped, 1 todo.** No timeout this time (the lanes each saw 1 to 3 at the default 15 s).
- `node tools/audio/qa.mjs --strict`: 0 cues with findings, 0 sfx findings; **music + sfx 89.83 MB of the 90 MB budget** (`chapter-select-a` 72.8 s and `chapter-select-c` 80.3 s at -16.1 LUFS, both ok); **voice-over 200 recordings, 3.60 MB of the separate 20 MB line.** Together 93.43 MB shipped audio.
- `node tools/orphans.mjs`: 24 orphans, all older modules (`audio/voices/presets`, `sprites/*`, `engine/BlobShadow`, ...); none of the voice, front-end or title modules.
- Headless Chromium (SwiftShader, real keys, dev server on a random port, stopped by PID): see the pictures below and `docs/screenshots/r395-int/evidence.json`. No console error, no page error, no failed request in either run.
  - Title: `titleArt: 'echo'` draws `/art/title/echo.png` (1682x932) with `alt="Echoes of Spira"` and **no HTML wordmark**; the default draws `keyart.png` with the wordmark. Both at 1600x900 and 390x844 touch.
  - FFX Chapter I scene, real Enter keys: Tidus's recorded line `seymour-flux.pre.008` is `playing`, the voice context `running`, the music ducked, `started 1 / asked 1`.
  - OPTIONS, real keys: TITLE SCREEN FARPLANE to THE ECHO, CHAPTER MUSIC B to A to C, VOICE 90 to 80, VOICE-OVER ON to OFF and back; the save in `localStorage` read `titleArt echo, chapterSelectMusic c, voiceOn true, voiceVolume 0.8`.
  - FFX-2 OPTIONS: the same two front-end rows, no VOICE rows.
- Not run: a production build and `art-browser-load` of the merged tree (each lane ran its own: 3,347 of 3,347 images load in Chromium and WebKit on the settings side; the voice files are 200 of 200 on the voice side). The deploy builds and re-checks; a merged `dist` is 7.75 GB and D: has 36 GB free, so none was made here. No frame-rate-timed check (CHK-027) was run: the overnight ComfyUI run owns the GPU.

## `node tools/critic-plan.mjs`

On this branch as is:

```
critic plan for 0d04b8d3 (previous build b80f772f)
  review:       DEEP
  before deploy: DEEP review of the production candidate (save-data class or milestone claim)
  after deploy:  live verification
  obligations:  live + focused + deep
```

**Read the "previous build" line:** the plan compares against `b80f772f` (39.3) because the **deploy records of 39.4.1 are not on this branch**. They sit uncommitted in `D:/pyrefly-r39-int` (`critic/ledger.json` modified, `critic/pending/b80f772f.json` deleted, `critic/artifacts/04cdcd45.json` untracked, `docs/deploys.log` modified). So the list of "because" paths includes r394's own files (the pose registrations, `BattlePresenterStage.ts`, `coachState.ts`). Whoever cuts 39.5 must bring those records over (or cut from the release tree) before the gate is read; I did not touch the release tree.

The honest 39.5 list is the plan asked about only the paths that changed since 04cdcd45 (`--paths`, 325 paths, 243 shipped):

- **Review: DEEP before deploy.** Cause: `src/app/SaveData.ts` is the save-data class (four new Settings fields, additive, defaults, `SAVE_VERSION` unchanged; the twelve real save fixtures from release 20 to 37.1 still load, keep every value they had and gain the four new fields at their defaults beside what their age already gained; the three save-upgrade tests that list the gained fields pass with all four). Obligations: `live + focused + deep`.
- The other shared systems named: asset loader and manifests (`public/audio/manifest.json`, `PaintedArt.ts`), audio routing (`AudioManager.ts`, `tracks/index.ts`), scene runner (`story/registry.ts`), global layout and input (`DialogueBox.ts`, `dialogueVoice.ts`), the title, chapter-select, pause screens, and the new unclassified `saveFrontend.ts`, `voiceChapter.ts`, `story/voice/*`.
- Games: both; chapters: all 18 (the voice touches every FFX chapter's scenes; the title and board touch all).
- Checks: CHK-001, 002, 003, 008, 009, 012, 015, 016, 017, 018, 019, 020, 021, 022, 023, 024, 026, B1. Targets: audio, cast, pause, phone, presentation, scenes.
- CHK-027 (continuity, frame-rate timed) is on the branch-as-is plan only because of r394's files; the 39.5 paths do not call for it.

## Screenshots (`docs/screenshots/r395-int/`)

- `title-farplane-1600x900.png`, `title-echo-1600x900.png`, `title-farplane-390x844.png`, `title-echo-390x844.png`: both title screens, desktop and phone.
- `ffx-cutscene-voice-playing-1600x900.png`: FFX Chapter I's scene at the moment Tidus's recorded line starts (the text is typing; the voice state is in `evidence.json`).
- `options-ffx-1600x900.png`, `options-ffx-1600x900-chapter-music-row.png`, `options-ffx-1600x900-after.png`: the OPTIONS tab in an FFX chapter (VOICE and VOICE-OVER under SOUND EFFECTS; TITLE SCREEN in the fade; CHAPTER MUSIC scrolled into view; after stepping the rows).
- `options-ffx2-1600x900.png`: the same tab in an FFX-2 chapter (no voice rows).
- `options-ffx-phone-390x844-{top,voice,bottom}.png`: the phone's OPTIONS list, scrolled to the top, to the voice rows and to the two front-end rows.
- `evidence.json`: the rows as read, the key steps, the title DOM facts, the voice state, the console, page-error and failed-request lists.
- The script is `r395-int-shots.mjs` in the agent's scratchpad (not in the repo); `tools/audio/voice-browser-proof.mjs` (in the repo) is the longer voice proof it was modelled on.

## What still needs Bailey

1. **The voice pause pick.** "As recorded" or "pauses shortened" for the 81 recordings that hold a pause of 404 to 673 ms. Installed: shortened (the only one that passes the ship gate, thinly: longest pause 397 ms against the 400 ms limit). One command each way: `node tools/audio/voice-variant.mjs recorded|tight`. His ear on the level (-19 LUFS), the 22 length warnings and the takes; the three muted lines (Braska's Valefor beat) stay text only.
2. **The 20 MB voice budget line** (`VOICE_BUDGET_BYTES`): the voice does not fit the 90 MB line (music + sfx are already at 89.83 MB), so it needs its own line, still his to approve. Shipped audio is 93.43 MB.
3. **Loop checks of chapter-select A (waltz) and C (harp and wordless voice).** Nobody has heard the mastered files. `D:/Tools/elevenlabs/candidates/2026-10-07/loops.html` has the 24 s wrap clips with "the jump happens at 0:12". A's stereo: it **fails the stereo gate as picked** and the install uses the wide, as-picked version (disclosed in `THEMES.md`); a narrow variant that passes is staged (`node tools/audio/music-elevenlabs.mjs install --cue=chapter-select-a --variant=narrow`, then `measure`). His call.
4. ~~The Options layout above~~ **Settled 2026-10-08: C** (a page, and the reserve row given back), built; see the section "OPTIONS layout C, built". What is still his: the thirteen-row list does not fit unscrolled at 1366x768, 1280x720 or at TEXT SIZE 115 and 130 percent (the option C he picked was measured as not doing so); the list scrolls there as the phone's always has.
5. Smaller, from the lanes: whether The Echo wants a 2x master (none exists; a browser upscales the 1682 px plate on a 2x screen); the unused Farplane preload for an Echo player (`index.html` still preloads the Farplane plate for everyone: one wasted fetch on a cold load); the hint row and slab position under The Echo are the agent's inference, not words of his (goes on the tile as `inferred`).

## What the deploy owes (nothing is cut)

- **Deep review before the deploy** (save-data class): `critic/runner` `deep.js` on the production candidate (pass `sonnetKeys`), then `focused`, then the live check. At most two deploys may go out while a deep review is owed.
- Carry over the 39.4.1 deploy records first (see the critic-plan note above), so the previous build is `04cdcd45`.
- Cut from `D:/pyrefly-release` or the release tree, not this worktree or the main tree; `npm run deploy` builds with `BASE_PATH=/` (PowerShell, not Git Bash).
- Records owed, not done here (the records agent's job): DECISIONS rows (Bailey's two quotes on the title and the chapter-select music; his voice picks "Tidus: B / Yuna: B / Auron: B"; the pause variant and the 20 MB line when he decides), an ACTIONS row for 39.5, the end-state tile for The Echo in `docs/target/targets.json`, a CHANGELOG entry (drafts: the last section of [r395-settings.md](r395-settings.md) and the last bullets of [r395-voice2.md](r395-voice2.md); one combined entry with FFX / both tags), NOW.md.

## Resuming

All work is committed and pushed (`git log origin/r395-int`). The worktree holds three junctions: `node_modules` (to `D:/Final Fantasy`), `public/art` and `public/fx` (to `D:/pyrefly-r39-int`). **Unlink each with `cmd /c rmdir` before any removal, never `git worktree remove`.** No server is running (the proof script's dev servers were stopped by PID; ports 5535 and the first run's are free). The first two commits (the two merges) carry the trailer `Claude Opus 5.5` as the brief said; the later ones carry `Claude Sonnet 5.5`, the model that made them.
