# Chapter VII ship layer: independent check (2026-09-25)

**Game case: FFX only** (AGENTS.md rule 14). This check covers branch `chapter-macalania-ship-0925`
at `dd21a0f6` (commits `ba4de167`, `aac3c61a`, `dd21a0f6` on base `761d3eb0`), in the worktree
`D:/pyrefly-ch-macalania-ship`. The checker built none of it. It edits nothing under `src/` or
`tests/`, and this file is its only commit.

Every browser run used a **production build** (`vite build` into scratch, then `vite preview` on
port 5719 with `--strictPort`), headless Chromium on the GPU through Playwright
(`PYREFLY_BROWSER=gpu`; the renderer reported was the RTX 5070 Ti through D3D11). Each run started
from a fresh page load. The chapter was reached with `__pyrefly.gotoChapter('seymour-anima-macalania',
{ seed: 1 })`, and no key was pressed on the title in those runs. Prep, the dialogue, the command
menu, the pause, the results screen and RETRY were all driven with real keys. The server was
stopped by its PID afterwards. The frames (JPEG, for reference only, not committed) and the JSON
for each run are in `D:/Tools/pyrefly-scratch/chapters/macalania-check/shots/`.

## What was re-run

| Check | Result |
|---|---|
| `tsc --noEmit` | clean (exit 0) |
| Full vitest (`--testTimeout=60000`) | 392 files; 7,453 passed, 5 skipped, 1 todo; exit 0 |
| Merged with main `e7b620cc` (a scratch merge commit in a scratch worktree, since removed) | the merge is clean; `tsc` is clean; vitest runs 397 files, 7,477 passed, 5 skipped, 1 todo |
| `node tools/orphans.mjs` | 729 modules, 705 reachable, 24 orphaned (the same 24 as before) |
| Locked art (an independent hash script over `docs/target/approved-hashes.json`) | 207 ok, 0 mismatched, 0 missing, both **before and after** the runs. `judge-locked-hashes.json` does not exist on this branch or on main. |
| New `chapter:macalania-anima:2026-09-25` record | justified: D-141 says Anima's hash "is owed to approved-hashes.json", and D-108 and D-150 name the folder. The five hashes match the files on disk. |
| Scope | `src/` changes are limited to comments, the `MACALANIA_SCENE_CUE` constant (it still resolves to `scene-gagazet`, as before), the pause fallback id (`portraits/seymour-macalania.png`, approved under D-065) and tactic rule 1b. No boss number changed, and nothing under `src/battle/**` or `src/data/ffx/**` changed. |

## Chapter select: not listed, nothing else changed

- The only change to `comingChapters.ts` is the comment on the lock line.
  `'seymour-anima-macalania'` is still in `LOCKED_CHAPTER_IDS`.
- On the production build, real Enter presses from the title reach the board. It lists I, II, III,
  VIII and IX under FINAL FANTASY X, then VII as a `fe-card--coming` card ("Seymour and Anima",
  "Coming", with no number), then IV, V, VI and XIII under X-2. I walked the whole board twice with
  real ArrowRight presses, and the focus never lands on VII.
- The branch changes no chapter-select source and no chapter registry, so every other chapter is
  what main ships. The board's black shapes are the designed ink silhouettes of approved paintings
  (`chapterCards.ts`), not procedural placeholders.

## Real-key play (production build, seed 1)

| Size | Prep | Pre scene (Enter) | First menu | One real action |
|---|---|---|---|---|
| 1600x900 | yes | yes | yes, Rikku | Attack, then Enter on the default target Guado Guardian A. The log shows `action-start`, 69 damage and `action-end`. |
| 1280x720 | yes | yes | yes, Rikku | the same |
| 2000x1012 | yes | yes | yes, Rikku | the same |
| 390x844 | yes | yes | yes, Rikku | the same (the phone target sheet and its confirm bar) |

- **WIN (1600x900; seed 1, which the headless intended line wins, re-measured here: seeds 1 to 10
  and 12 win, 11 loses).** Real keys took the run through the pre scene and to the first menu.
  Then came the pause check (below), and the fight was handed to `autoBattle('intended')` at fast
  speed. The result was a victory in 1:38 with OVERKILL x1, 6,330 AP, 8,600 gil and Ability Sphere
  x3 plus a Blk Magic Sphere. The quip "...We won, right?" is Tidus's. Anima was summoned mid-fight
  ("She has waited a long time for this."). Real Enter presses then took the run through the
  results and the post scene, including the Guado's lines, the shattered sphere and the four
  narration lines, which end on "That was the trick. There was nobody above him."
  `gotoChapter` resolved `{ outcome: 'victory', links: 1 }`.
- **LOSS and RETRY (1600x900).** After the first menu, `autoBattle('attack')` (the bench's mistake
  line) lost in 0:28 over 27 turns. The defeat panel read "FELL", "Defeat", "ATTEMPTS 1", "BEST —
  NEVER CLEARED", then RETRY and CHAPTER SELECT. A real Enter on RETRY went straight back to the
  battle (the pre scene is not replayed). The first menu reopened with every combatant at full HP.
- **Pause CHAPTER tab (1600x900).** P opens the pause. The tabs run Tidus, Yuna, Rikku, then
  Chapter, reached with E three times. The plate is `art/pause/macalania.2x.webp`
  (`data-art="plate"`, decoded at 1982x1132). The quote, the three snaps, the encounter goals
  and the party gear are all printed. This is the **current** plate, which D-141 excepted; its
  redo is pick 1.
- **Images and console.** Every run was checked for images. In each one, every image the page
  fetched was decoded with `createImageBitmap`: 70 of 70 per menu run, 94 of 94 in the win run,
  69 of 69 in the loss run and 43 of 43 in the select run. No file came back as `text/html`, no
  `<img>` was broken, and there was no HTTP 4xx. Across all seven runs there were 0 console
  errors, 0 page errors and 0 warnings, so the `[painted] … using a procedural placeholder` warning
  never fired. The stage snapshot showed `placeholder: false` for all six fighters at every first
  menu, after the action and after RETRY, and `__pyrefly.scenes()` shows `macalania-temple`
  `placeholder: false`. The only aborted requests are known ones: the title key art dropped when
  the title closes, and `pause/yuna.png` giving way to its 2x master.
  - One gap: the snapshot taken 3.5 s after Anima's combatant appeared (at fast speed) did not
    yet include her staged actor, so her painting is covered only by the zero-warning and
    all-decoded evidence above, not by a snapshot of her on the field.

## Story against the writing bible

The story text did not change on this branch (the diff is comments and the scene-cue constant),
and I checked it again anyway.
- All 52 lines are within 60 characters, and no line has more than one ellipsis.
- Yuna's "Yes." comes once, bare, and the scene cuts within two lines.
- Kimahri speaks three times in all, two of them in the pre scene. The pre scene has one
  tension-release joke (Rikku).
- Seymour uses "Lady Yuna" and "Guardians" as the bible's §1.9 asks, and only he states the thesis.
- The narration is four lines of Tidus in the past tense over black, after the peak.
- No battle cry and no canonical line is reproduced. I searched for the §1.9 iconic line, and it
  is absent.
- The Confusion cure the tactic relies on is sourced: research §8.9 (`[estimate]`) calls Remedy
  "the Confusion answer", and the preset carries three.

## Punch list

**Blockers: none for the branch as it stands (locked, unlisted).**

**Major: fix before the chapter is listed (it already has a place among the three picks)**

- **M1: at the first menu, the FFX command stack covers the party. Confirmed independently.** At
  1600x900 and 2000x1012, Yuna stands almost entirely behind ATTACK, SPECIAL and ITEMS; only her
  head shows, beside the ATTACK row. Tidus is half under the stack. This matches the builder's
  measurement and the cause it names: the `PARTY_SLOTS` predate D-041, and no `holdParty` is set.
  It is correctly held as **pick 3 (party layout)** in `MACALANIA_OPEN_PICKS`, with option B
  recommended. It must land, along with its follow-up measurements (Anima's rigs, act two, the
  action and victory shots), before the lock line goes.

**Minor**

- **m1: stale comments.** `src/data/chapter-meta-seymour-anima-macalania.ts` still says the lock
  waits on "Bailey's two open picks"; there are three now. Rule 1b in
  `src/engine/tactics/seymour-anima-macalania.ts` says "188/200", but the bench write-up and the
  handoff say 189/200.
- **m2: on the phone (390x844) target sheet, the confirm bar clips its own label.** It shows
  "TTACK → GUADO GUARDIAN", with the leading A and the trailing A cut off. The "Guado Guardian A"
  name tag is also cut by the left edge. This is probably the shared phone HUD with a long enemy
  name, not something Chapter VII owns. Guardian B partly off the right edge was already
  disclosed (`phoneFraming.ts`).
- **m3 (low confidence): the advisor card went stale during the auto-played act two.** With both
  Guardians down, the card still read "NEXT BEST MOVE Rikku: Steal → Guado Guardian A" while
  Seymour's summon line played. The fight was on `autoBattle`, so no player menu had refreshed the
  card. This may only happen on the debug path. It is worth one look with real keys in act two.
- **m4 (advisory, story):** Rikku's "Rude." is thin for her voice, whose insult template in bible
  §1.8 is adjective plus harmless noun. It is not a defect.

**Confirmed as the builder reported:** the three picks (pause plate, scene cue, party layout) are
prepared and listed. The scene cue is still Chapter I's `scene-gagazet` stand-in, and the pause
tab shows the excepted plate. Nothing is pushed, deployed or listed.

BLOCKERS: 0

## Re-check after repair cycle 1 (6146c4ad), 2026-09-25

Edited nothing; this section is the only change.

- **M1: still open on screen, correctly held for Bailey's pick. Not a blocker.** I searched
  `docs/target/decisions.json` in both this worktree (171 records) and the main tree (175, through
  D-182): no record answers the Macalania party-layout sheet. So keeping `MACALANIA_PARTY_LAYOUT =
  'current'` is right under rules 9 and 10. `built/current-1600x900.jpg` still shows Yuna almost
  wholly behind ATTACK/SPECIAL/ITEMS and Tidus half under them, the same as the first check.
  `built/b-1600x900.jpg` shows option B clears every party head and torso. Rikku now overlaps
  Seymour's robe hem, and that cost is disclosed.
- **The landing is sound.** `src/scenes/macalania-temple-layout.ts` (103 lines) holds all four
  options. `macalania-temple.ts` (392 lines, was 387, still under 400) spreads the option's
  `holdParty`/`enemySpots` into both `MACALANIA_TEMPLE_SLOTS` and the build. The fiend light pools
  map by `Object.keys(MACALANIA_ENEMY_SLOT)` order, which matches the slot indices 0-2. With
  `'current'` the staging is `{}` and the slots are byte-identical to before.
- **The unlock guard works.** The new test ties the constant to the `'party-layout'` open-pick row
  in both directions. It also fails if the chapter leaves `LOCKED_CHAPTER_IDS` while the layout is
  `'current'`.
- **Re-run here:** `tsc --noEmit` is clean. The 10 Macalania test files (party-layout, ship, scene,
  engine, story, bench and the others) pass, 106 tests. The diff touches no `public/`, battle
  engine, `src/data/ffx`, `critic/` or contract file, and no boss number or art.
- **Minor m1 is still open.** `chapter-meta-seymour-anima-macalania.ts:13` says "two open picks",
  and there are three. Tactic rule 1b says 188/200 where the bench says 189/200. Out of scope for
  this cycle; carry it forward.

BLOCKERS: 0

## Re-check after repair cycle 2 (8fc90fbb), 2026-09-25

I edited nothing. This section is the only change.

- **M1 is still open on screen and is correctly held for Bailey's pick 3. It is not a blocker.**
  I searched `docs/target/decisions.json` again, in this worktree (171 records, through D-178) and
  in the main tree (175, through D-182). The only records that mention Macalania with party or
  layout are D-046, D-140, D-145 and D-150. They cover Guardian art, the phone HUD, Omnis and
  Anima's painting folder, and none of them answers the party-layout sheet. So these stay as they
  are: `src/scenes/macalania-temple-layout.ts:98` keeps `MACALANIA_PARTY_LAYOUT = 'current'`, the
  `'party-layout'` row stays in `MACALANIA_OPEN_PICKS` (`src/data/chapter-macalania-ship.ts:75`),
  and `'seymour-anima-macalania'` stays in `LOCKED_CHAPTER_IDS`
  (`src/app/screens/frontend/comingChapters.ts:128`).
- **Minor m1 is fixed.** Commit 8fc90fbb changes only comments. The meta header now says "three
  open picks" and names the pause plate, the scene cue and the party layout. Tactic rule 1b now
  says 189/200, which matches `docs/plans/macalania-bench.md:36` (intended 189/200, 94.5%). The
  commit touches no number, art, contract, engine, `public/` or `critic/` file.
- **Re-run here:** `tsc --noEmit` is clean. All 10 Macalania test files pass (106/106), including
  `macalania-party-layout.test.ts`, the unlock guard. The touched files stay under 400 lines
  (meta 85, tactic 281; `macalania-temple.ts` is still 392). I did not repeat the builder's
  mutation proof, because this re-check edits nothing. I read the guard's logic in re-check 1.
- **Carried and still open:** m2 to m4 as listed above, all minor or advisory.

BLOCKERS: 0

## Independent check of Bailey's picks (319288c1, 84608164), 2026-09-25 ~19:30 EDT

Edited nothing; this section is the only change. Scope: pause plate A2 installed and locked,
`MACALANIA_PARTY_LAYOUT = 'b'`, two rows gone from `MACALANIA_OPEN_PICKS`, the chapter still
locked. **Game case: FFX only** (Chapter VII's plate, scene staging and FFX HUD). Bailey,
2026-09-25 ~18:30 EDT, verbatim: "All your recommendations".

**Re-run here**

| Check | Result |
|---|---|
| `tsc --noEmit` | clean (exit 0) |
| Full vitest (`--testTimeout=60000`) | 393 files; 7,462 passed, 5 skipped, 1 todo; exit 0 |
| `node tools/orphans.mjs` | 730 modules, 706 reachable, 24 orphaned: the same 24 as before, none new |
| Bench, `PYREFLY_MEASURE=1`, 200 seeds per line | intended 189/200 (94.5%), advisor 192/200 (96.0%), mistake 0/200: the same as `docs/plans/macalania-bench.md`. The picks change no engine or tactic file, so this was expected |
| `verify-approved` (`D:/Tools/pyrefly-lora/tools/verify-approved.mjs`, `ROOT` = this worktree) | 209 ok, 0 mismatched, 0 missing, **before and after** the browser runs. Main: 177 approved + 48 judge-locked ok, 0 mismatched |
| A second hash script of my own (it also looks for one file with two different hashes) | 209 ok, no conflicts |
| Scope of the two commits | nothing under `critic/`, `src/battle/**`, `src/data/ffx/**`, `public/` (the art arrives through the junction), no contract file, no NOW.md, no `decisions.json`. Touched sources stay under 400 lines (`macalania-temple.ts` 392, layout 104) |

**The plate is A2, byte for byte, and locked**
- `public/art/pause/macalania.png` = `446b5b7e…` = the options round's
  `candidates/2026-09-25-picks/ch7-pause-plate/a2.png`. `.2x.webp` = `581741cd…`. Both equal
  set `chapter:macalania-pause:2026-09-25` (words "All your recommendations"), the
  `installed/` backup, and the files in my production build. The replaced CANDIDATE
  (`68fa5225…`, never locked) is in `replaced/`. No approved or judge-locked file was replaced.
- Nothing on main pins the old hash; main's two plate tests (`chapter-meta*.test.ts`) pass
  against the new files (139/139), so the junction install breaks nothing on main.
- My own look at A2 (whole plate, 3x mouth crop): the judge's 4-level box is real (I measured
  a 2.5-level mean step on the top and right edges of x 585-690, y 392-455, against 0.4 on a
  control row) and visible at 3x; invisible on the CHAPTER tab at both sizes. The crown now
  reads silver-lilac like the idle and the portrait. Faint cheek lines remain at 1:1, which
  research §9.2's facial veins allow. I agree with the pass; the residuals stay disclosed
  (JUDGE-A2.md).

**Real keys, production build, headless GPU** (`vite build` into scratch, `vite preview` on 5723
`--strictPort`, RTX 5070 Ti via D3D11, seed 1, `gotoChapter` from a fresh load with `skipPrep:
false`, no key pressed on the title; prep, the 30-31 line pre scene, the command menu, the target,
the pause, the results and the post scene all by real keys. Frames and JSON:
`D:/Tools/pyrefly-scratch/chapters/macalania-check3/shots/`. Server stopped by PID; nothing listens
on 5720-5739.)

| Size | First menu (Rikku) | Party under the command stack | One real action | Pause CHAPTER tab |
|---|---|---|---|---|
| 1600x900 | yes | Tidus 0, Rikku 0; Yuna 13.8% of her box, cape and staff only, head and torso clear (builder: 16.9%) | Attack → Guardian A, 69 damage, `action-end` | real P then E x3; plate decoded 1982x1132 from `macalania.2x.webp`; served png/webp/json hashes equal the lock |
| 390x844 | yes (phone HUD B) | no party member under any panel; Guardian B 35.9% in frame (disclosed) | the same, through the phone target sheet | decoded 1477x844, same hashes; the phone crop centres the eye and ear (first capture of the plate on a phone) |

- The 1600x900 first menu matches `docs/screenshots/macalania-picks/target-vs-build.jpg` (sheet B
  beside the build) figure for figure.
- **WIN at 1600x900** (twice): `autoBattle('intended')` after the real first action, victory in
  1:34, OVERKILL x1, 6,330 AP, 8,600 gil, Ability Sphere x3 and a Blk Magic Sphere; real Enter
  through results and the post scene; `gotoChapter` resolved `{ outcome: 'victory', links: 1 }`.
- Every run: 0 console errors, 0 page errors, 0 warnings, 0 HTTP 4xx, no art served as HTML;
  every fetched image decoded (`createImageBitmap`: 94/94 per win run, 77/77 phone); the stage
  reported no placeholder.
- Act two under B: Anima was staged in both runs, but my two frames caught her rise and then an
  Ifrit action shot, not a menu. Her place at the act-two menu under B stays covered by repair
  1's real-key proof (`../unlock/party-layout/built/b-act-two-1600x900.jpg`: Anima 0.82 in frame,
  Seymour's face clear), which I viewed.

**Lock:** `MACALANIA_OPEN_PICKS` is exactly `['scene-cue']`, `'seymour-anima-macalania'` is in
`LOCKED_CHAPTER_IDS`, and `macalania-ship.test.ts` pins both plus the plate lock against the files
on disk and layout B. Correctly held until Bailey picks the scene cue by ear.

**Punch list**
- **M1 (party under the command stack): closed** by layout B.
- **Owed by the merge, not a defect of this branch:** record both picks in main's
  `docs/target/decisions.json` (the branch correctly did not); main's `approved-hashes.json` gains
  the plate lock only when this branch merges, and until then main's public/art already carries A2
  unlocked.
- **Minor, carried:** m2 (phone confirm bar clips "TTACK → GUADO GUARDIAN"; still seen here, the
  shared phone HUD; the Guardian A name tag is no longer cut under B), m3 (the advisor card read
  "Attack → Guado Guardian A" during an auto-played act-two action shot; debug path only), m4
  (advisory). A2's disclosed residuals (mouth box at 3x, faint veins, greyer shoulder highlight,
  teal eyebrow) are for Bailey; fixing any one makes a new file that needs a new lock.
- **Advisory, shared:** on the phone pause, the CHAPTER tab's party list shows only Tidus and
  Yuna above the fold and "BOSS HP 100…" is truncated. Shared pause layout, not introduced here.

BLOCKERS: 0
