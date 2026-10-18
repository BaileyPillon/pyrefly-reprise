# r395-settings: the title screen choice and the chapter-select alternates (release 39.5, not deployed)

Branch `r395-settings`, cut from `origin/r394-int` (04cdcd45, the build live as 39.4.1), worktree `D:/pyrefly-r395-settings`. Pushed; **not deployed**:
39.5 changes `src/app/SaveData.ts`, so it is a save-data-class change and needs a **deep review before any deploy** (AGENTS.md "Release").
Game case (rule 14): **both games**, for both features. The title is the front door to both halves; the board is shared (`docs/audio/THEMES.md`).

Bailey's words (2026-10-07, verbatim, the authority for all of it):

- Title: "go with this as a new selectable title screen, and once selected it hides echoes of spira since it's already in the image itself. it will look neater that way. current title screen is still the default."
- Board music: "I'll go with B", "but C as a selectable alternate", "and A as a selectable alternate as well", "B as the default".

## 1. What a player gets

- OPTIONS (the pause menu's OPTIONS tab, every chapter of both games, and FF7) has two new rows after BATTLE HELP: **TITLE SCREEN** (`FARPLANE` | `THE ECHO`) and **CHAPTER MUSIC** (`B  PIANO` | `A  WALTZ` | `C  VOICE`). Left, Right and Confirm (or a tap) step through the list and wrap. The choice shows the next time the title is drawn / the board opens.
- **The Echo** (Yuna kneeling in still water; the painted lettering ECHOES OF SPIRA is part of the picture) is the new selectable title. When it is chosen the HTML "Echoes of Spira" wordmark is not drawn. The slab (eyebrow, rule, press-Enter chip), strap, hint row and tap target stay.
- **Chapter select A and C** are two new cues, `chapter-select-a` and `chapter-select-c`, the ElevenLabs takes A and C. **B stays the default and keeps the cue `chapter-select`.**
- Defaults for every existing save: Farplane title, B music. Nothing a player had changes.

## 2. Settings and save data

`src/app/saveFrontend.ts` (new; its own module because `SaveData.ts` is over the line cap, as `saveComfort.ts`): `TITLE_ARTS = ['farplane','echo']` (a LIST of variants, first = default), `CHAPTER_SELECT_MUSICS = ['b','a','c']`, the cue table `CHAPTER_SELECT_CUES`, labels, `cycle()`, `chapterSelectCue()`, and `migrateFrontend()`.
`SaveData.ts`: `Settings.titleArt` and `Settings.chapterSelectMusic`, defaults, and `migrateFrontend(settings)` in `migrate`. **`SAVE_VERSION` does not change** (additive: the stored settings merge over the defaults, then a value that is not on the list reads as the default, CHK-024).
Tests (`tests/unit/save-front-end-39-5.test.ts`, 25): the defaults; **every real save fixture from releases 20 to 37.1 (12 files) loads unchanged, gains exactly the two defaults, keeps every chapter record and survives a save and a reload with the choice made**; bad values (strings, numbers, null, objects, junk blobs) read as the defaults; the OPTIONS rows for ffx, ffx2 and ff7; stepping and wrapping; changing a row changes nothing else. Three older save tests (`save-comfort-migration`, `save-fx-looks`, `save-fx-parts`) list "the only additions" and now list the two defaults.

## 3. The title screen

**Art install** (all NEW files; no existing art file was edited; `D:/pyrefly-art-exp` is hard-linked to the release folder and was not touched):

| | |
|---|---|
| The pick | `D:/Tools/pyrefly-scratch/2026-10-07/title-echo/echo-bailey-pick.png`, 1688x932, sha256 `48996fab5a17336f8a21430bcfa8a5e019f196a82f83a6893a7a243b33e7fae9` (verified). A Codex/ChatGPT Images 2.5 candidate of Art Room chain c_fa4811d6, concept A "The Echo", from its v7 round, never one of the chain's seven proposals; Bailey picked it from a screenshot (the driver's record: mean difference 0.8 of 255). |
| One change | The pick's leftmost **6 pixel columns** (x 0 to 5) are a flat neutral grey (RGB about 30, the same on every row: a capture border, not paint). At full bleed they show as a pale line down the window's left edge, so they are cropped. Checked: the remaining 1682x932 pixels equal the pick's x 6 to 1687. Nothing else touched; no resampling. The pick as received is kept (below). |
| Installed | `public/art/title/echo.png` (1682x932, 1,826,009 bytes, sha256 `1f719a6f1168bb6da64c59b4348a8d79fc416d603885d1c7d1538a5daa559a41`) and `echo.json` (provenance sidecar like `keyart.json`, sha256 `abf2775af8c3f48a420bc605257d048ff3549330d60062fd5a0f1ae9f64e4be5`), in `D:/pyrefly-r39-int/public/art/title/` (the release tree) and this worktree (`echo.png` is a hard link to the release copy, the sidecar a copy). |
| Approved record | `docs/target/approved-hashes.json`, set `title:echo`, quoting Bailey's words. |
| Backup | `D:/Tools/pyrefly-art-backup/approved/2026-10-08-title-echo/` (the pick as received, the installed files, the placeholder, `SHA256SUMS.txt`); staging `D:/Tools/pyrefly-art-staging/title-echo/`. |
| Private art repo | `BaileyPillon/pyrefly-art` (cloned at `D:/Tools/pyrefly-art-repo`, checked PRIVATE): `current/title/echo.png` and `echo.json`, its own commit `1ae9892`, pushed. **That commit also rewrote `CURRENT-MANIFEST.json` as indented JSON (the file was compact) and re-wrapped parts of the README, so its diff is large; the content is right (2,606 files) and history only grows, so it was not redone.** |
| 2x tier | **None.** The loader offers a 2x master only for a plate the manifest lists in `title2x`; `node tools/gen/manifest.mjs` lists `title: [echo, keyart]`, `title2x: [keyart]`, so The Echo is drawn from the 1x file and its markup is never given a `srcset` (a candidate for a missing file would be a 404 on the one image the screen is). No AI upscale was started (the GPU was busy). On a 2x screen the browser upscales the 1682 px plate; a made 2x master is a later job. |
| Production | `art-derive` turns it into a lossless `echo.webp` like every master: `art-derive verify` PASS (3,298 masters, 3,115 pixel-compared), `audit` PASS, `art-browser-load` PASS (3,347 of 3,347 images in Chromium and WebKit). |

**Code**: `titleMarkup.ts` (`art?: TitleArt`; The Echo = one far plane, no bloom, no near plane, no scrim, no cast, no wordmark; `alt="Echoes of Spira"` carries the words for a screen reader; Farplane markup is byte for byte what it was, pinned), `titleReveal.ts` (`TITLE_PLACEHOLDER_ECHO`, a 252-byte 32x18 WebP, and `TITLE_PLACEHOLDERS`), `TitleScreen.ts` (reads the setting on every `enter`, adds `fe-title--echo`, one parallax layer at scale 1, no 2x upgrade), `frontend/title-echo.css` (new).
**Layout** (what keeps Yuna and the painted lettering clear; the picture's own measurements: Yuna u 0.31 to 0.61 / v 0.10 to 0.55, lettering u 0.31 to 0.70 / v 0.85 to 0.92, painted rule v 0.923):

| Window | Fit |
|---|---|
| 0.8:1 to 1.9:1 (1600x900, laptops, 1024x768) | cover, centred across, anchored 65 % down: at most 5 % of the height lost between 1.8:1 and 1.9:1, 1.5 % of the width at 16:9 |
| 1.9:1 and wider (Bailey's 2000x1012 is 1.976:1; 2560x1080) | the whole picture, `contain`; the ground behind is the picture's own black (`#050402`), so the sides read as more picture |
| a portrait window that is not a phone (768x1024) | the picture drawn 140 vw wide in the middle, top and bottom edges feathered; the middle 71 % shows |
| **a portrait phone (390x844)** | the plane is a box of the picture's own aspect, **192 vw wide, held vertically in the middle; the middle 52 % shows, which keeps Yuna whole and the whole painted lettering with a 6.5 % margin each side**; top and bottom feathered. The Farplane screen gives up its spire on a phone; this gives up the ribbons and the city. A plain `cover` there would show 25 % of the width and cut the lettering, which is 39 % of it, so it is not used. |

Chrome: the hint row is lowered to 12 grid units (Farplane 26) so it sits **under** the painted rule (at 2000x1012 the old height put it over the lettering: caught in the first screenshot and fixed); the vertical strap is hidden under 3:2 (the painted city would be under it; the phone already hides it); the slab is as it was (top left; it touches the left ribbon's curl at 1.9:1 and wider, nothing of Yuna or the lettering); the placeholder is drawn the way the picture is and fades out once the picture has decoded (otherwise a blurred copy shows beside a contained picture).
Known limit: `index.html` preloads the Farplane plate at high priority for everyone, so a player who chose The Echo fetches one unused plate on a cold load (cached afterwards). Swapping the preload by setting would need a script before the preload scanner and was not worth the risk tonight.
Tests: `tests/unit/title-art-choice.test.ts` (18).

## 4. The chapter-select music

Masters and notes: `D:/Tools/elevenlabs/install/chapter-select-a/` and `chapter-select-c/` (`INSTALL.md` each, `SHA256SUMS.txt`, `stage/`, `stage-narrow/` for A, `stage-v0/`, `audition/`, `work/`, `tools/`). The scripts are chapter-select B's with the candidate table changed (`CAND=sa|sc`).

| | A, the waltz (`chapter-select-a`) | C, the dreamy one (`chapter-select-c`) |
|---|---|---|
| Take | `.../music/chapter-select/take-1.mp3`, 73.04 s, sha256 `966af4fb...dee4303` | `.../music/chapter-select-c/take-1.mp3`, 80.04 s, sha256 `5c02c3af...ff46c66` |
| Measured | 3/4 at 84.00 BPM (clock fit); key G major (the brief and the score say B minor); timing loose (attacks within about 25 ms of the grid) | 3/4 at 66.000 BPM, every attack within 2 ms of the grid; key E major (the brief said E minor) |
| Loop | **bars 13 to 33 of the take = 20 bars = 5 four-bar phrases, 42.80 s**, 27.024490 s to 69.825714 s; the 27 s before it plays once | **bars 9 to 29 = 20 bars = 5 phrases, 54.53 s**, 22.774739 s to 77.307302 s; the 22.8 s before it plays once |
| How | both points 4 ms before a measured downbeat attack, then slid -1.09 ms together to the sample where the take's own step is smallest (wrap step 0.12 of the local p99); crossfaded one beat | both points 4 ms before a grid attack; the wrap goes bar 28 into bar 9 on the same chord, the quietest seam of 55 candidates (spectrum distance 0.13) |
| Level | -16.0 LUFS, -2.1 dBTP | -16.0 LUFS, -3.0 dBTP |
| File | 1,328,956 bytes, sha256 `2cae33ca...25aada2b`, 3,211,614 samples (Chromium decodes exactly that) | 1,408,783 bytes, sha256 `08e6baef...fafbcb1`, 3,541,552 samples (Chromium: exact) |
| Wrap checks | click ratio 0.12, run-on error ratio 0.85 (under 1 is clean), level jump -0.09 dB, spectrum ratio 1.35 | click 0.14, run-on error 0.24, jump +0.01 dB, spectrum ratio 1.01 |
| Stereo gate | fails as picked (0.529, -5.1, -1.2); `stage-narrow` (width stage only) passes (0.729, -8.0, -0.6), 1,305,141 bytes, swap with `node tools/audio/music-elevenlabs.mjs install --cue=chapter-select-a --variant=narrow` then `measure` | passes as picked (0.755, -8.2, -0.6): no narrow variant |

**Budget (the cap is not raised): LAME V4 for these two, V0 for the other 26.** Shipped audio (music + sfx + sfx v2) on r394-int was 87,090,398 bytes, 2,909,602 spare. The pair at V0 is 4,433,088 (over by 1,523,486); V3 3,097,504 (over); V3.5 2,905,362 (fits by 4,240); **V4 2,737,739; shipped audio is now 89,828,137 of 90,000,000, 171,863 spare**; V4.5 and V5 are smaller still. V4 averages about 146 / 140 kbps, above the 128 kbps the takes came in at. **Anything else that adds audio in 39.5 (the voice lane, `r395-voice`) has 172 KB to work with and needs its own cap decision.** No cue was retired.
Cue plumbing: `STAND_INS` in `src/audio/tracks/index.ts` maps both new cues to B's score (a browser that cannot load the file synthesises B; `trackNames()` still lists B once); `BattleScreenFlow.chapterSelect()` plays `chapterSelectCue(readSetting('chapterSelectMusic'))`; `tools/audio/manifest-insert.mjs` adds a manifest block as text (the other bytes stay as they were); `tools/audio/music-elevenlabs.mjs` installs and measures the record's new `alternates` list; the manifest entries carry `source: "elevenlabs-music_v2_5"` (exempt from the stale-render checks only). `docs/audio/THEMES.md` (bullets and two "How each cue ships" rows, with the stereo failure disclosed for A) and `docs/audio/CREDITS.md` (the prompts as sent, the AI voice in C) say what they are.
`D:/Tools/elevenlabs/candidates/2026-10-07/loops.html` has two new sections, "Chapter select A" (as picked and narrower stereo) and "Chapter select C" (as picked), each in plain words with "The jump happens at 0:12"; the clips are `loops/chapter-select-a-wrap.mp3`, `-a-wrap-narrow.mp3`, `-c-wrap.mp3` (24 s: 12 s before the loop end, 12 s from the loop start, cut from the decode of the mastered MP3). **Bailey judges the loops by ear in the morning (rule 13: no agent has heard anything).**
Tests: `tests/unit/audio-chapter-select-alternates.test.ts` (27: the cue map, stand-ins, each file and entry against the record, loop points on samples, qa gates, V4 and its 128 kbps floor, the stereo disclosure, THEMES and CREDITS, the budget, and **the real `GameFlow.chapterSelect` playing the cue the setting names for no choice, B, A, C and a bad value**); `audio-manifest-io` (+4 for the insert helper); `audio-music-elevenlabs`, `audio-music-v2`, `audio-music-o1`, `audio-shipped-files`, `audio-blurbs`, `audio-cue-reachability` follow the two new cues.

## 5. Proof

- `npx tsc --noEmit` clean (run as `node node_modules/typescript/bin/tsc --noEmit` in the worktree).
- Full unit suite, once at the end: 922 files, **13,696 passed**, 43 skipped; 3 tests hit the 15 s limit under load (`live-url-follows-host`, `ui-ffx2-atbmode`, `sin-fins-core-bench`) and pass alone in 16 s; the first full run had the same kind of timeouts in other files (`advisor-floor`, `strategy-ffx2-bahamut`, ...) that passed in the second. The first full run also found the tests this change legitimately moved (listed above), fixed.
- `node tools/audio/qa.mjs --strict`: 0 findings, 89.83 MB of 90 MB. `node tools/orphans.mjs`: nothing of this branch's.
- Production build (`BASE_PATH=/`): `art-derive verify` and `audit`, `art-browser-load` (Chromium and WebKit) PASS; the build served by `vite preview`: for each saved choice the title and the board fetched the right files, no console error, no 404 (`docs/screenshots/r395-settings/evidence.json`).
- Real input in headless Chromium (SwiftShader, no GPU): Enter on the title, the board, a chapter, Esc over its opening, the OPTIONS tab, clicks on the two rows (FFX Chapter I and FFX-2 Chapter IV; 1600x900 and 390x844): the rows read, the clicks stepped and wrote to `localStorage`, no error. An FFX-2 chapter (14 rows) still fits at 1600x900 with 48 px to spare; on a phone the list scrolls as it already did.
- Screenshots in `docs/screenshots/r395-settings/`: `title-echo-{1600x900,390x844,2000x1012,2560x1080,1024x768,768x1024}.png`, `title-farplane-{1600x900,390x844}.png`, `options-1600x900-{before,after}.png`, `options-ffx2-bahamut-{1600x900,390x844}-{before,after}.png`, `evidence.json`.
- Servers started were stopped by port (5191 dev, 5393 preview). The overnight GPU run was not touched; no frame-rate-timed check was run.

## 6. Not done / the driver's list

- **Deep review before any deploy** (save-data class). Nothing deployed.
- Records owed (the records agent's job; not edited here): DECISIONS rows for Bailey's two quotes above (title: a selectable alternate, Farplane default; music: A and C selectable, B default), an ACTIONS row for this build, the end-state board tile for The Echo in `docs/target/targets.json` (picked by Bailey, built), CHANGELOG at release time, NOW.md. A draft changelog entry: "**Both:** a second title screen, The Echo (Yuna kneeling in still water, the title painted into the picture), selectable in Options under TITLE SCREEN; the current title stays the default. **Both:** two more chapter-select tracks, A (a waltz) and C (harp and a wordless voice), selectable in Options under CHAPTER MUSIC; B stays the default."
- Bailey: listen to the three loops (`loops.html`); decide A's stereo (wide as picked, or the narrow variant); whether The Echo wants a 2x master (a made one, not tonight's GPU); whether the unused Farplane preload for Echo players matters.
- The hint row and slab are Bailey's approved Ink & Gold chrome; their position under The Echo is the driver's inference (nothing he named), so it goes on the tile as `inferred`.
- Resuming: all work is committed and pushed; `git log origin/r395-settings` is the state. The worktree has junctions `node_modules` (to `D:/Final Fantasy`) and `public/fx` (to `D:/pyrefly-r39-int`); `public/art` is a hard-link mirror of the release tree's (4,693 files, `manifest.json` a real copy). Never `git worktree remove` it without `cmd /c rmdir` on both junctions first.
