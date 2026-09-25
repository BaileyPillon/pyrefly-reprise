# Chapter XI ship layer: independent check (2026-09-25)

**Game case: FFX-2 only** (AGENTS.md rule 14). This check covers branch
`chapter-fallen-aeons-ship-0925` at `ed891d95` in the worktree `D:/pyrefly-ch-fallen-aeons-ship`.
I built none of it. It edits nothing under `src/` or `tests/`, and this file is its only commit.

Browser runs used a **production build** (`vite build` into a scratch folder on D:, then
`vite preview` on port 5759, base `/pyrefly-reprise/`) and headless GPU Chromium through Playwright
(RTX 5070 Ti, D3D11). Every run started from a fresh page load. The chapter was reached with
`__pyrefly.gotoChapter('ffx2-fallen-aeons', { seed })` from the title, with no key pressed on the
title first. Everything after that was real keys: party prep, the pre scene, the command menu, pause
(`p`, then `e` to the CHAPTER tab), results, and RETRY. The exceptions were the win and loss runs,
which handed the fight to `autoBattle` after the first menu. The server was stopped by its PID.
Frames (JPEG, look-only, not committed) are in `D:/Tools/pyrefly-scratch/chapters/fallen-aeons/check/shots/`.

## What was re-run

| Check | Result |
|---|---|
| `tsc --noEmit` | clean (exit 0) |
| Full `vitest run --testTimeout=60000` | **406 files passed, 2 skipped** (7,601 tests passed, 12 skipped, 1 todo). This is the full-suite re-run the build report did not do after its two re-pins. |
| `node tools/orphans.mjs` | 738 modules, 24 orphaned: the same 24 as main |
| Approved and judge-locked art (`docs/target/approved-hashes.json`, `judge-locked-hashes.json`) | **225 ok, 0 mismatched, 0 missing**, in the tree and in the shipped `dist/`. This includes `pause/ch11-ffx2-fallen-aeons.png` and `.2x.webp`. |
| Scope | No contract file (`docs/CONTRACTS.md`) is touched. No touched file is over 400 lines, and none grew past it. The two AI edits (`magus-sisters.ts`, `fallen-aeons.ts`) only emit a `script-trigger` event and count Pains in AI memory. They draw no random number and change no boss number. |
| Merge with current main (`8575b395`) | `git merge-tree` is clean. Main has moved by FOC17-01/02 (results wedge, FFX-2 tap label) only. |

## Chapter select: not listed, nothing else changed

- The board, walked with real ArrowRight presses, is I, II, III, VIII, IX, IV, V, VI, XIII. No card
  says "Fallen Aeons", "Road to the Farplane" or "XI".
- **VII (Seymour and Anima) is still the locked "Coming" card.** The arrow walk skips it.
- `CHAPTER_META` and `CHAPTERS` are unchanged against the merge base. The chapter sits only in
  `UNLISTED_CHAPTERS` and `UNLISTED_CHAPTER_META`, so every listed chapter is what main ships.

## Real-key play (production build)

| Size | Prep | Pre scene, 7 lines | First menu | One real action |
|---|---|---|---|---|
| 1600x900 | yes | yes, every line in draft order | yes, Yuna (White Magic / Change / Item) | White Magic, then Pray, then the All-allies target: `action-start x2-white-mage-pray` |
| 1280x720 | yes | yes | yes | yes, the same |
| 2000x1012 | yes | yes | yes | yes, the same |
| 390x844 | yes | yes | yes (phone HUD B) | yes, the same |

- **WIN, labelled "bench-winnable seed".** Engine bench (`driveChain`, the intended line, D = 0)
  wins on seeds 3, 9, 11, 12, 13 and others. In the browser, after the first menu,
  `autoBattle('intended')` at fast speed won **all three runs, seeds 3, 9 and 11** (4:12, 3:08 and
  3:26 of game time). Each run crossed all three links and showed the Save Sphere card twice.
  Plate B stood behind the Shiva seam. After that came the post scene (lines 18 and 19), the
  Victory results, and lines 20 to 23 after the results, with real Enter throughout.
- **Every mid-battle line fired where the script says**, with speakers and portraits right.
  Line 8 plays before the first menu (engine seq 9). The seam is lines 9 to 12, and line 13 plays
  at the Sisters' entrance. "One down. They can't combine now." is the AI-emitted first-sister
  callout, and it played in all three runs. Lines 14 to 17 open Anima's link. "Remedy! Don't let
  it pile up!" is the third-Pain callout, emitted by the AI; it played in 2 of 3 runs. "She's
  breaking. Keep going." played in all three. The three Stop callouts did not come up, which
  matches the rarity the build discloses.
- **LOSS and RETRY.** Seed 3 won link 1 on the intended line, then played `defend` on link 2. The
  result was Defeat after 40 turns, with the panel "RETRY / CHAPTER SELECT". A real Enter on
  RETRY re-entered **the Sisters' link** (`sandy, cindy, mindy`, FA3 = b), and the command menu
  opened.
- **Pause CHAPTER tab.** The plate is `pause/ch11-ffx2-fallen-aeons.2x.webp`, 1982x1132 and
  loaded. The tab shows the three link objectives, "BATTLE 1 OF 3", SCENE "ROAD TO THE
  FARPLANE", the quote "I know. That's what hurts." and three snapshot thumbnails.
- **Images.** Across 10 runs, 87 distinct images were fetched and decoded with
  `createImageBitmap`, and every one decoded. There were 0 broken `<img>`, 0 HTTP 4xx, 0 art
  served as HTML, 0 console errors and 0 warnings. The only `ERR_ABORTED` entries were
  superseded requests (title key art, and the `.png` twins of the pause plates, whose `.2x.webp`
  loaded).
- **No procedural placeholder anywhere.** Every stage snapshot (first menu, after the action, the
  seam, each link, the retry) reports `placeholder: false` for every actor, and the
  `road-to-the-farplane` scene is `placeholder: false`. Shinra has no portrait on disk. His line
  folds the frame (`dbox--no-portrait`) and draws no silhouette. Every other speaker shows its
  painted portrait (832 px).

## Story against the writing bible

- All 23 draft lines ship verbatim, in draft order and at the built beats. Every line has at most
  one ellipsis and is under the 120-character cap. There is one sincere exchange (9 to 11), which
  Rikku cuts off at 12. The banter runs Rikku, then Yuna, then Paine (5 to 7, 14 to 16). Paine
  never says "Yunie", her lines are 2 to 8 words, and Yuna's FFX-2 scene has its seam.
- The added Stop lines ("Yunie's frozen! Remedy, now!" and "Can't move. Get me a Remedy.") are in
  voice. Remedy curing Stop is sourced: `research/ffx2-combat-core.md` lines 580 and 3122,
  `[verified: 2 sources]`.

## Punch list

**Blockers:** none.

**Gate before listing (known, not a merge blocker)**

- **G1:** The chapter's win rate at human pace is still 15.5 %, under the 25 % gate. Options A, B
  and C wait for Bailey. The ship layer does not change this, and nothing I saw contradicts the
  measurement.

**Minor**

- **m1:** During the Shiva seam, the boss plate still reads "Shiva" with an empty bar and the guide
  panel stays up, as Trema's m1 did. Yuna is held in her cast pose, and her billboard sits behind
  the dialogue portrait.
- **m2:** At 1600x900, on the prep CHAPTER card, the TIP text and the snapshot captions are
  clipped at the card's bottom edge. The TIP ends mid-sentence ("...its stat losses stay for").
- **m3:** At 1600x900, inside the White Magic submenu, the enemy-move panel moves over Rikku's
  and Paine's heads, and the "ALL ALLIES" target label overlaps it. This comes from the shared
  FFX-2 placement, not from this scene.
- **m4 (story, advisory for Bailey):** The TIP says Pain's stat losses "stay for the fight". That
  is the engine's FA10 a, but the research's single source says a Remedy clears them
  (`research/ffx2-fallen-aeons.md` line 230). Yuna's third-Pain callout, "Remedy! Don't let it
  pile up!", then suggests that a Remedy stops the pile-up, which in this engine it does not do
  for the stat losses.
- **m5:** Both disclosed issues were seen as described: the pre and post scenes play over plate A,
  and the dark side bands appear at 2000x1012.

**Outside the ship layer, for the orchestrator**

- **o1:** With seed 3, Shiva acts before the first command. Rikku is at 2,574/5,652 at the first
  menu at every size. On the RETRY into link 2, Yuna is at 463/2,488 at the first menu. This is
  the same shape as Trema's o1.
- **o2:** On this branch, the Defeat wedge stands FFX Yuna (`art/characters/yuna/hurt.png`). That
  is FOC17-01, which main already fixes in `8575b395`. Merging main clears it, with no conflict.
- **o3:** On the phone, with no input, the Wait split's running top list let Shiva win in 1:31
  while the menu sat open. That is the live clock rule, not a defect of the scene.

BLOCKERS: 0

## Addendum, 2026-09-25 evening: option A built, main merged, frames re-taken

- Main 46970be4 merged (51af2d55; registries keep both Chapter XII and Chapter XI; `src/scenes/index.ts`
  394 lines). Option A: 3 s of action time on the three Road links only (`ROAD_ACTION_TIME`), 159/200
  (79.5 %) at human pace; 80 of 90 other-chapter event-log hashes byte-identical, the 10 that moved
  all Chapter XI (`action-time-hashes.json`). Shiva and Anima now forgive the wrong line (disclosed in
  `docs/plans/fallen-aeons-bench.md`).
- `tsc` clean; full vitest 416 files passed, 2 skipped (7,783 tests); orphans 24, the same as main.
- Every JPEG in this folder was re-taken on the merged branch with action time on (headless GPU
  Chromium, dev server on port 5700, stopped by PID): the Sisters at 1280x720, 1600x900, 2000x1012 and
  390x844 (phone HUD B), Shiva and Anima at 1600x900, the between-links plate B at 1600x900 and 390x844,
  the pre story. 0 page errors. The links were reached with the debug API (party kept full, enemies held
  at 1 HP), so the enemy HP bars in these frames are not a real fight's.
- Still unlisted: `UNLISTED_CHAPTERS` / `UNLISTED_CHAPTER_META` only.
