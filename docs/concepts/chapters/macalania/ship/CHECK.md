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
