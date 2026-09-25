# Chapter XIII ship layer: independent check (2026-09-25)

**Game case: FFX-2 only** (AGENTS.md rule 14). This check covers branch `chapter-trema-ship-0925`
at `942e6a04`, in the worktree `D:/pyrefly-ch-trema-ship`. It edits nothing under `src/` or
`tests/`, and this file is its only commit. The browser runs used a private Vite on port 5745
(HMR off, file watching off) with GPU Chromium through Playwright, and each run started from a
fresh page load. The chapter was reached with `__pyrefly.gotoChapter('ffx2-trema', { seed: 1 })`.
No key was pressed on the title screen. The server was stopped by its PID afterwards. Frames (JPEG,
look-only, not committed) are in `D:/Tools/pyrefly-scratch/trema-ship2/check/shots/`.

## What was re-run

| Check | Result |
|---|---|
| `tsc --noEmit` | clean (exit 0) |
| The 3 new test files plus the 4 re-pinned files | 7 of 7 files pass (140 tests) |
| 14 shared suites the layer touches (story scripts and triggers, chapter meta, departures, guide, cutscene, audio story cues) | 14 of 14 files, 320 of 320 tests |
| `tests/unit/ffx2-steal-item-names.test.ts` | **fails**: `x2-supreme-gem` (Paragon's steal) has no ItemDef row. This is engine-track data. See B1. |
| `node tools/orphans.mjs` | 716 modules, 24 orphaned. That is the same 24 as main (main has 699 modules and 24 orphans). |
| Locked art (`verify-approved.mjs`) | 185 ok, 0 mismatched, 0 missing. The five Trema files match the INSTALLED.md hashes: `77b4cba2eb4b`, `744cc1501f8e`, `0e3972b558c0`, `f2f2300b6f8f`, `82eedcd37505`. |
| Scope | `942e6a04` touches nothing under `src/battle/**` or `src/data/ffx2/**`, and does not touch `chapter-ffx2-trema.ts`. |

## Chapter select: not listed, nothing else changed

- `CHAPTER_IDS`, `CHAPTERS` and `CHAPTER_META` list the same nine chapters as main, in the same
  order. `ffx2-trema` appears only in `UNLISTED_CHAPTERS` and `UNLISTED_CHAPTER_META`, and
  `getChapter('ffx2-trema')` resolves with the scene `via-infinito`.
- On the chapter-select screen, scrolling the whole board with real arrow keys never shows
  "Trema", "Cloister" or "XIII".
- Main has changed no `src/` or `tests/` file since the merge base `5fc16e60`, so the listed
  chapters are what main ships.

## Real-key play

Real keys were used throughout: Enter taps through the dialogue, and Attack plus target on each
menu. In the link runs, party HP was raised and the boss HP set to 1 through `battleState()`, as
the builder did.

| Size | Pre scene | First menu | Kill link | Link 2, win, post, results |
|---|---|---|---|---|
| 1600x900 | yes | yes | yes, all three beats: held, breaks into pyreflies, walks | yes, victory, 2 links |
| 1280x720 | yes | yes | yes (a hold-Enter run) | yes, victory |
| 2000x1012 | yes | yes | not run | not run |
| 390x844 | yes | yes | yes | yes, victory |

- **Every line played in draft order.** The link seam is lines 9 to 18, and the post scene is
  lines 19 to 24, with line 24 after the results screen.
- **Skip speed** (`speed: 'skip'`): at link 2 the stage holds only `trema` (visible) and the
  hidden prop. No Paragon is left behind.
- **Option-2 shape**, tested in the page only: the unlisted record was swapped for
  `withTremaShip` on the Trema-only formation. Trema's reveal (lines 11 to 18) then plays in
  the pre scene. The mid triggers are only `trema-entrance` and `trema-first-stop`, the battle
  cue is `boss-ffx2-aeon`, and there is no seam and no kill link. The run was won in 1 link. This
  run did not check the pause card or the guide, which are fixed when the module loads;
  `trema-ship-content.test.ts` covers their shape variants.
- **Console and network:** 0 errors and 0 warnings in every run, and no HTTP 4xx. **But** the
  dev server answers a missing `.png` with its HTML page and a 200 status, so a 404 check alone
  misses missing art. Checking the content type as well finds three missing files (M1).

## Story against the writing bible and TR13, TR14, TR15

- No game line is quoted. There is no Hymn of the Fayth lyric, no "paragon of pastlessness", no
  Zanarkand and no illusion; these words were searched for in every new file. There are no
  Kinderguardian portraits.
- Yuna narrates the opening, the Cloister 0 stranger gets two lines, and Trema is revealed only
  after Paragon falls. The banter follows Rikku, then Yuna, then Paine. The sincere exchange is
  3 lines (19 to 21), inside the cap of 4, and the scene cuts within two lines of its peak.
  No line has more than one ellipsis, and every line is within the 120-character box cap.
- The Iron Duke is sourced as a Garment Grid, so line 23 is right. Trema fading away with no
  pyreflies follows research §2, step 4.

## Punch list

**Blockers**

- **B1 (engine track, not the ship layer): one unit test is red on this branch.**
  `ffx2-steal-item-names.test.ts` fails because Paragon's steal `x2-supreme-gem` has no ItemDef
  row in `src/data/ffx2/**`. A full `npm test` must be green before anything is pushed, so this
  branch cannot merge until the engine track adds the row.

**Major: fix before the chapter is listed**

- **M1: the pause CHAPTER tab is blank.** `heroArt: 'pause/ch13-trema'` does not exist.
  `PauseView.renderPlate` calls `portrait.show(heroArt)` with no fallback id, so it tries
  `art/pause/ch13-trema.png` and then `art/portraits/ch13-trema.png`, and both are missing
  (`ch13-trema.json` is missing too). `heroArtFallback` is read only by `chapterPanel.ts`.
  The build report says the card falls back to Yuna's portrait; that is not true on this tab.
  On Pages these would be three 404s. Fix: point `heroArt` at an existing approved plate, for
  example `pause/yuna-ffx2`, the narrator's plate. That change is perceivable, so it is Bailey's
  call, or it waits for O-5.
- **M2: the enemy-move panel covers the ATTACK command at 1600x900 whenever Trema acts next.**
  This was seen at the first menu in the option-2 shape, and it is still there 3 s later. Trema
  has more moves than Paragon, so his panel runs to about y 395, while the command stack starts
  at y 351. Option 1's link 2 opens the same panel. The cause is the shared FFX-2 placement
  (`src/ui/ffx2/intentPlacement.ts` assumes a 150x98 panel), and this chapter's framing puts
  Trema's head under the queue. The build report discloses the panel over the boss, but not the
  panel over the command list.

**Minor**

- **m1:** During the link seam, the enemy-move panel still reads "PARAGON / Attack / ACTS NEXT",
  with a damage forecast, after Paragon has broken apart and while Trema is speaking. The boss
  plate still reads "Paragon". This is probably the HUD's behaviour during any mid-battle seam;
  worth hiding during the seam.
- **m2:** At 390x844 the kill-link shot crops Yuna off the left edge, and Rikku is half cut.
- **m3:** The 26 s link seam cannot be skipped. A 2.5 s Enter hold did nothing, because
  in-battle seams have no player skip anywhere. This is pre-existing, and it will be felt on
  every retry that replays link 1.
- **m4: story wording, advisory, for Bailey.** Line 18, "Show me what they bought.", repeats the
  "show me" of the sourced line before the fight. Line 17 (also the pause quote) restates the
  idea of his Meteor line, "Release your past..." in new words. Neither is a quotation, but TR13
  also rules out lines that are only reworded. Rewording line 18 costs nothing. Also, Rikku is
  never right on a technical point in this chapter (bible §1.15 guardrail).
- **m5:** In the Trema-alone shape, `tremaGuideFor` still lists `'paragon'` in `bossIds`
  (`src/data/guides/ffx2-trema.ts:145`). It is harmless, but it contradicts "every Paragon
  guide line drops out".
- **m6:** Both disclosed issues are confirmed as described: the dark side bands at 2000x1012,
  and the light floor seam on the phone.

**Outside the ship layer, for the orchestrator (engine and options track)**

- **o1:** With seed 1, Paragon acts about 4 times before the first command at every size, and
  Rikku is knocked out before the player's first input. With Yuna's menu open, Paragon then
  knocked Yuna out within 3 s, although the pause card says MODE WAIT. It looks like the known
  Active-ATB-under-an-open-menu issue (PR-0076/PR-0080). It shapes the chapter's first
  impression, whichever option is picked.

BLOCKERS: 1

## Repair (2026-09-25)

The repair pass on the punch list above: B1, M1, M2, m1, m2 and m5. It does not touch m3, m4, m6 or
o1. Each fix has its own commit, and each commit says which game it applies to. Nothing is listed,
and no Trema option switch was changed. The browser runs used a private Vite dev server on port
5770 (HMR off, file watching off) and, for M1, a production build (`vite build` to scratch, then
`vite preview` on port 5771 at `/pyrefly-reprise/`). Both used GPU Chromium, started from a fresh page
load and reached the chapter through `__pyrefly.gotoChapter`. Both servers were stopped by PID.
The frames named below are in `repair/`.

| Item | Fix | Game case | Proof |
|---|---|---|---|
| **B1** | Adds an FFX-2 `x2-supreme-gem` ItemDef row and its effect. The effect is sourced, so the row is a full thrown item, not a name-only row: ffx2-trema §3.2 (the steal and drop), ffx2-combat-core §5.5 (targets the whole enemy party, non-elemental, sells for 250) and §2.9.3 (power 50, so 2,500 damage). No charge time is published, so it uses Shining Gem's, as the file's other thrown items do. | FFX-2 only | `ffx2-steal-item-names.test.ts` passes (7 of 7), with a new test that pins the row |
| **M1** | `PauseView.renderPlate` passes `heroArtFallback` to `PortraitStage.show`. When the manifest says the plate is absent, the page requests only the fallback, not the plate and not its sidecar. The fallback is also opted out of the global portrait face crop, which had blown a 40 px tile crop up to full screen, so it shows the whole portrait, as `pause-screen.css` intends. A plate that exists, or a call with no fallback, renders exactly as before. | both (shared pause plumbing) | `pause-chapter-plate-fallback.test.ts` (4 tests). **Production preview:** the CHAPTER tab shows Yuna's `portraits/yuna-x2.png` (decoded, 832 px wide). There was no request for `ch13-trema` (`.png`, `.json` or a portrait) and no HTTP 4xx in the whole run. Two `ERR_ABORTED` requests are older behaviour: the title key art is dropped when the title closes, and the 1x `rikku-ffx2.png` is dropped when its 2x `srcset` master takes over. Chapter IV's tab still shows its own plate (`m1-pause-chapter-ch4-…-unchanged`). Frames: `m1-pause-chapter-1600x900-before` (blank), `…-after-prod`. |
| **M2** | `placeSlab` gains a `tiered` mode. HUD chrome ranks above the fighters: `fighterBoxes` marks the fighters `soft`, and the winning spot covers the least chrome first, then the least fighter, then is the nearest. The slab's `E HIDE` chip is scored with the slab (`opts.chip`), because the chip rides above the slab and had been crossing the boss plate. `solveSlab` already used the panel's measured box, and now also passes the chip's measured box (`SlabSolveInput.chip` replaces `chipHeight`). The chain counter keeps the old untiered rule. | FFX-2 only (the FFX-2 HUD; the FFX HUD has its own twin) | `ui-ffx2-intent-tiered.test.ts` (5 tests) and the existing placement suites (55 tests) pass. **Browser matrix:** 6 boards (IV, V, VI, XI, XIII with its link, XIII with Trema alone) at 1280x720, 1600x900, 2000x1012 and 390x844, sampled at the first menu and the next one, old code against new. |
| **m1** | On a `ko` event for the enemy the slab names, the FFX-2 HUD reads the engine's intent again. The engine never names a dead enemy, so the slab clears as the link seam starts. | FFX-2 only | `ui-ffx2-intent-ko-clear.test.ts` (2 tests). Real keys: the slab is hidden from Paragon's KO for the whole seam at 1600x900 and 390x844, and returns as "TREMA / ACTS NEXT" at link 2 (`m1-seam-1600x900-after`). |
| **m2** | Re-aims the phone `trema-link` rig: position (-0.8, 6.5, 22), look-at (1.1, -4.0, -3), fov 42. It was (-1.25, 5.5, 14), (1.75, -2, -3), fov 40. | FFX-2 only | A new test in `trema-ship-scene.test.ts` projects all three girls, Paragon and Trema's entrance spot through the rig and checks they are on screen and above the dialogue box. Real keys at 390x844: all three girls, Paragon breaking into pyreflies and Trema are in frame, clear of the boss plate (`m2-phone-link-390x844-before` / `-after`). |
| **m5** | `tremaBossIdsFor(shape)` (`trema-shape.ts`) is now the source of the guide's `bossIds`, and of the tactic's `TREMA_CHAPTER_BOSS_IDS`. The Trema-alone shape claims only `trema`, and the strategy-guide suite's check that the guide covers every boss id a tactic registers still holds after the option flips. | FFX-2 only | `trema-ship-content.test.ts` pins `['trema']` for the Trema-alone shape and `['trema', 'paragon']` for the link shape |

**M2 matrix (square pixels of the slab and its chip over the command stack, party plates and boss
plate; the other chrome is the guide, the advisor, the telegraph and the target plates).** Before
(old placement) → after:

| Board | Before | After |
|---|---|---|
| XIII, Trema alone, 1280x720 | command stack 1,764 and 2,232 | 0 |
| XIII, Trema alone, 1600x900 | command stack 3,420 and 3,375 (the reported defect) | 0 |
| XI Fallen Aeons, second menu, 1280 / 1600 / 2000 | boss plate 793 / 1,292 / 1,615 (the chip) | 0 |
| V Vegnagun, second menu, 1600x900 | boss plate 476, other chrome 8,260 | 0 |
| V Vegnagun, second menu, 2000x1012 | party plates 644 | 0 |
| VI Leblanc, 390x844 | party plates 30 (the chip) | 0 |
| Every other sample (IV at every size, XIII with its link, the rest) | 0 | 0; the slab stays at the same spot to within 2 px |

In the final run, 42 of 42 samples cover no chrome. Chapter IV does not move: at 1600x900 the slab
sits at 998,75 before and after (`m2-ch4-1600x900-before` / `-after`). At link 2 of the shipped
shape, the slab hangs over Trema with its tail attached, clear of ATTACK
(`m2-trema-link2-1600x900-after`).

**Disclosed; none of these is a regression:**

- In the Trema-alone shape at 1600x900, the slab no longer covers ATTACK. The only free spot left is
  over Trema's head and shoulders, so it now covers them, and its tail is dropped
  (`m2-trema-alone-1600x900-after`). Getting it off both would need a shorter slab (the
  `MAX_HEIGHT_FRACTION` cap in `EnemyIntent.ts`, another track's file) or a framing change. That is
  Bailey's call, with option 2.
- At 2000x1012 in the Trema-alone shape, the slab parks bottom left, as it did before. The guide's
  "MORE" row draws a few pixels below the guide's own box, so the chip sits 4 px clear of the box
  but touches that text.
- During the seam the boss plate still reads "Paragon" (the other half of m1). This fix clears
  only the slab.
- On the phone, with the camera pulled back, the floor seam m6 disclosed now shows as a line across
  the top quarter of the link shot.

**Re-run:** `tsc --noEmit` is clean. The full vitest run (`--testTimeout=60000`, in the worktree)
passes 382 of 382 files (7,233 tests, 5 skipped, 1 todo). `node tools/orphans.mjs` finds
716 modules and 24 orphaned, the same as before the repair.

BLOCKERS: 0
