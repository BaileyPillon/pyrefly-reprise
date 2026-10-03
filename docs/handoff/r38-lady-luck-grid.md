# r38-lady-luck-grid: Lady Luck selectable where the guides say she can be owned, and the reel overlay on top

**Branch:** `r38-lady-luck-grid` (from `origin/main` 3b1ed60f; pushed, never merged, never deployed). **Closes (candidates):**
PR-0340 (critic round 20, major: no shipped Garment Grid offered Lady Luck) and FOC37-01 (focused review of release 37, major:
the reel overlay under the guide card). **Decision:** D-361 (Bailey, 2026-10-03, "I'll go with all your recommendations", on
the driver's recommendation: selectable only where the FFX-2 guides say the girls could have her). **Game case: FFX-2 only**
(Lady Luck is an X-2 dressphere, the grids and the overlay are FFX-2 data and HUD; nothing under `src/battle/ffx`, `src/data/ffx`
or the FFX HUD changed). **critic-plan class:** DEEP, after deploy (focused review before deploy, live verification, then the
deep review on the live build; this build owes it: 36 substantial checkpoints since the last deep review); systems: FFX-2 HUD,
FFX-2 game data; **not the save-data class** (no `SaveData.ts`, schema, migration or settings persistence: the change is the
preset builds' dressphere order and one CSS rule).

## What changed

| Where | What |
|---|---|
| `research/ffx2-lady-luck-availability.md` (new) | The sourcing (hard rule 6) and the chapter map: when she is obtained, how many copies, who can wear her, how a grid carries her, and each of our seven FFX-2 chapters read against that. |
| `src/data/ffx2/builds/farplane.ts` | Chapters V, XI and XV (all three use this build): Lady Luck on the last node of each girl's ring, one link from her worn dressphere. |
| `src/data/ffx2/builds/via-infinito.ts` | Chapter XIII: the same, on node 4 of the five-node Valiant Lustre ring the shipped kit puts every girl on. |
| `src/data/ffx2/builds/djose.ts` | Chapter XVI: she is now owned and placed (see "The one judgement call"). |
| `src/ui/ffx2/ffx2-hud.css` | `.ffx2hud__minigame { z-index: 5 }`: the minigame layer paints above the guide (3) and the advisor (4), below the damage numerals (6). Fixes FOC37-01; the mash meter (Trigger Happy) shares the layer and is no longer under the guide either. |
| `src/data/ffx2/dresspheres/lady-luck.ts` | A stale header comment ("not owned at either build point"), comment only. |
| `tests/unit/ffx2-lady-luck-grid.test.ts` (new, 12) | Per chapter and girl: she is owned, sits next to the worn dressphere, is a Change row, node 1 is unchanged; chapters IV and VI offer nothing; after the Change both reels are offered and open the minigame. |
| `tests/unit/ui-ffx2-minigame-layer.test.ts` (new, 2) | Parses the sheets: guide 3 < advisor 4 < minigame layer < damage numerals 6. |
| `tests/unit/chapters/ixion-engine.test.ts` | The one line that pinned "Lady Luck not owned at Djose" now pins that she is (D-361). |
| `tests/unit/advisor-menu.test.ts` | **A guard narrowed, see Findings 2.** Test only; the advisor's code is untouched. |

## Which chapters, and why (full table in the research note)

IV (Bahamut) and VI (Leblanc) are FFX-2 Chapter 2 story points: her earliest pickup is Chapter 3, so they get nothing. V, XI, XIII
and XV are Chapter 5 (the Farplane finale, the Road to the Farplane, the Via Infinito, the Den of Woe): she is a Chapter 3 or
Chapter 5 pickup (Sphere Break against Shinra in Luca; Jegged, GamerGuides, StrategyWiki and FFExodus agree, four sources read
today). XVI (Ixion at Djose) is the end of Chapter 3, where she is "if Shinra was beaten". GameFAQs and the FF Wiki could not be
read (Cloudflare checks, not worked around); nothing needed the GameFAQs tie-break because the four sources read do not conflict.

## Where she sits, and why there (`[estimate]`: no source says what a girl sets on her grid)

A girl's `owned` order is her node layout (`setup.ts#gridNodeContents`) and every grid is a ring, so the worn dressphere on node 0
has two neighbours: node 1 (the **first** Change row) and the last node. **Lady Luck takes the last node; node 1 is left as it
was.** That is "the node that changes the chapter's intended line least": the autopilot answers Itchy with the first Change row
(`overdriveOrAttack`, and Chapter XIII's tactic), and Chapters XI (Anima's Pain) and XIII (6,117 autopilot spherechanges in 200
runs) are full of Itchy. The dressphere that sat on the last node is off that grid (Black Mage on Yuna's and Rikku's five-node
Farplane and Djose rings, White Mage on Paine's six-node Farplane ring, Warrior on Yuna's and Songstress on Rikku's and Paine's
Via Infinito rings); the line names none of them. Layouts are in the research note, section 3. **All three girls get her**: the
sources show her for Yuna, Rikku and Paine, and the builds already list the common set on every girl. Exception: Paine's
four-node Stonehewn at XVI, whose last node holds the Warrior whose four Breaks her build has learned (the guides' line); there
Lady Luck takes node 1 (Gunner's), which nothing in that chapter reads (no Itchy in Ixion's fight; zero spherechange events in
200 baseline runs).

## The one judgement call: Chapter XVI

The earlier Chapter 3 build left her out because she is conditional. D-361 says "could have", and the guides do put her within
reach at the end of Chapter 3 (the tournament is a Chapter 3 event, and StrategyWiki's Chapter 3 list has Luca before Djose Temple),
so she is added, as the party that beat Shinra. **It is its own commit** (`djose.ts`, the one line in `ixion-engine.test.ts`
and the Chapter XVI row of `ffx2-lady-luck-grid.test.ts`): if that reading is not wanted, `git revert` that commit alone.
Visible side effect: party prep's DRESSPHERES count at Chapter XVI goes 11 to 12 (Yuna, Rikku) and 10 to 11 (Paine).

## Proof

**Same line, same numbers** (`docs/handoff/r38-lady-luck-grid-measure.txt`; harness parked at
`F:/pyrefly-parked/2026-10-03/lady-luck/zz-tmp-r38-measure.test.ts`). The shipped autopilot (`intendedStrategy`, each chapter's own
tactic) over each chapter's own build and link chain, Wait mode, seeds 1 to 200, per-seed sha256 of every link's full event log over
seeds 1 to 20. **Every one of the seven chapters has the same win count, the same links lost and the same digest on `origin/main`
and on this branch**: the two whose builds are untouched (IV, VI) and the five that now carry her (V, XI, XIII, XV, XVI):

| Chapter | Wins of 200 (before = after) | Lost at link | Autopilot spherechanges | Digest, seeds 1-20 (before = after) |
|---|---|---|---|---|
| IV Bahamut | 200 | none | 0 | bf9c550821654448 |
| V Vegnagun (changed) | 188 | 2: 11, 3: 1 | 0 | 2ef4fc3acea4cf6d |
| VI Leblanc | 198 | 3: 2 | 0 | 72f319f8870f5b70 |
| XI Fallen Aeons (changed) | 174 | 2: 26 | 427 | e62cd5f1b0420d0a |
| XIII Trema (changed) | 14 | 1: 174, 2: 12 | 6,117 | 004aed0c3e397d39 |
| XV Den of Woe (changed) | 111 | 2: 23, 3: 66 | 0 | 2398517e0816e3ac |
| XVI Ixion at Djose (changed) | 197 | 1: 3 | 0 | 21a5bd42ba86e91a |

**The control** (never shipped, same harness, Lady Luck laid on node 1 instead): the digests of **XI and XIII move** (XI
`a77b91c3df2ace4d`, 409 spherechanges; XIII `ec3122c9dbb23313`, lost at link 1 or 2: 168 and 18), the others do not. So the harness
sees exactly the effect that matters, and the last-node placement is what keeps the line identical. The existing golden for IV and V
(`ffx2-atb-golden.test.ts`) passes. Wins of 14 of 200 at XIII is today's number on the shipped autopilot in Wait mode, not mine.

**Real keys in a browser** (headless GPU Chromium, one browser per run, keyboard only; the debug API only started the chapter and
read the battle log; scratch Vite on :6610 with no HMR, stopped by PID). Frames, one clip and the page's own report:
`docs/screenshots/r38-lady-luck-grid/` (`browser-report.json`; the driver is `D:/Tools/pyrefly-scratch/2026-10-03/lady-luck/browser/lady-luck-run.mjs`).
Acceptance of PR-0340, "reach Lady Luck through Change and open the reel overlay", holds in every chapter below:

| Chapter | Change menu (Yuna, first to act) | Reels chosen | Overlay probe | Stops, then the result |
|---|---|---|---|---|
| IV Bahamut | Gunner (grants Red), Black Mage | not offered | no Lady Luck | - |
| VI Leblanc | Songstress (grants Red), Thief | not offered | no Lady Luck | - |
| V Vegnagun, 1600x900 | Gunner (grants Red), **Lady Luck** | Attack | whole, nothing above | paw, sword, helmet: Dud, party hit 75 percent |
| V, 2000x1012 | same | Attack | whole | bar, bar, paw: Dud (a BAR pair is a Dud) |
| V, 390x844 (phone layout) | same | Attack | whole | sword, paw, paw: Dud |
| XI Fallen Aeons | Gunner (grants Red), **Lady Luck** | Attack | whole | helmet, red7, paw: Dud |
| XIII Trema | White Mage (grants Yellow), **Lady Luck** | Attack | whole | cherry, cherry, bar: Clean Slate |
| XV Den of Woe | Gunner (grants Red), **Lady Luck** | Attack | whole | helmet, cherry, paw: Dud |
| XVI Ixion at Djose | Gunner (grants Red), **Lady Luck** | **Magic** | whole | skull, staff, skull: Dud |

The overlay probe lists every element painted above the overlay at three points on its title, subtitle, three reels and the DUD
line (paint order, with every element made hit-testable and faded ancestors discounted). **Before the fix, at 1600x900,
`div.sgd__panel` (the guide) is above reel 1 and the DUD line**; after, nothing is, at 1600x900, 2000x1012 and 390x844. The phone
layout was already clear (the guide is a button there). Frames: `foc37-01-before-guide-covers-reel-1-and-the-dud-line-1600x900.png`
and `foc37-01-after-overlay-whole-{1600x900,2000x1012,390x844}.png`. The clip is Chapter V, Change to Lady Luck through the Dud
(`ch05-vegnagun-change-to-reels-to-payoff-1600x900.webm`, 5 MB). The Trigger Happy meter, checked once in Chapter VI after the
fix (Yuna the Gunner), opens on top of the guide and takes the presses. A girl who wears Lady Luck at the end of a Chapter V link
starts the next link in her starting dressphere, as for every other Change (`setup.ts`, PR-0124), and the next link's Change menu
still offers her. No console error in any run (two pre-existing warnings: a depth-plate decode in the Farplane scene, a
`THREE.WebGLProgram` shader note on the phone size).

**Checks:** `npx tsc --noEmit` clean; the targeted batch (chapters, ffx2, advisor, data-ffx2, guide, ui-ffx2, enemy-intent, strategy,
iter2-b1: 272 files, 4,467 tests) was green except one advisor test, which Findings 2 explains and the narrowed guard fixes;
`node tools/orphans.mjs`: 24 orphaned before, 24 after, none of them mine; files under 400 lines (`farplane.ts` 181, `via-infinito.ts`
137, `djose.ts` 134, the two new tests 139 and 49; `ffx2-hud.css` was already over, 1,181 to 1,191); **full suite (`--testTimeout=60000 --maxWorkers=3`, once, at the end, on the final tree):** 770 files passed, 5 skipped (775);
11,287 tests passed, 41 skipped, 1 todo; 0 failed; exit 0, 490 s. (The three files that fail in a worktree for want of `public/art`
passed because the junction is in place.)

## Findings (not fixed here; for the driver and Bailey)

1. **Lady Luck has no painting, so a girl who changes into her turns into the procedural placeholder figure** (a grey silhouette on
   the field, visible in every Lady Luck frame; her plate's "LL" badge and portrait are fine). No `*-lady-luck` art exists for any
   girl (`public/art/characters/`), and `BattlePresenterArt.ts` says a missing PNG becomes a placeholder and never throws. This is
   the most visible thing a player will see the first time. It is an art decision, not made here (hard rule 9; art generation is
   off unless NOW.md says on): options are paintings for the three girls, or a code decision to keep the girl's previous painting
   until hers exists. The same is already true for some other dresspheres on some girls.
2. **One advisor-menu test went red the moment Lady Luck became reachable, and I narrowed its guard in a separate commit.** For a girl
   in Lady Luck the command window's top-level "Attack" is a **group** holding Attack and Tantalize (both attack-category, so
   `CommandMenu.groupRows` folds them), and the advisor's chip for her plain Attack reads "in Attack". The test
   (`advisor-menu.test.ts`, "holds across ffx2-fallen-aeons") forbids a chip that names its own label, a rule written for the days
   when Attack was always a direct row (critic fix-3 round 2, F3). The chip is literally true here (Attack > Attack), so the guard
   now fails only when the row of that name is a **leaf**; the rule for every direct row is unchanged. A 10,694-decision sweep over
   the five chapters (40 seeds, intended and random play) found no other chip mismatch for a Lady Luck girl; it found 258 of this one
   kind, for all three girls. The advisor's code is untouched, as briefed. If you would rather change the advisor or the grouping,
   drop that commit. Related, not changed: the real X-2 menu lists Tantalize as its own command (`ffx2-combat-core.md` §3.12), so
   a Lady Luck girl needs one more key to plain Attack here.
3. **Phone text is small.** At 390x844 the overlay is whole but its reel symbols and the DUD line are about 5 CSS px (authored 8 grid
   px, stage scale about 0.61), under the 14 px floor in CHK-003. Pre-existing for every FFX-2 minigame; not changed.
4. **A scripted run needed a second Enter in Chapter V.** Cause: a mid-battle story line (Braska's "You were always going to be
   braver than me") puts up a dialogue box that takes the next confirm press to advance. Not a defect; the driver retries a press
   that did not move the menu.
5. **Not covered by a browser run:** Active ATB (r37's check did the overlay in Active; mine are Wait), a girl other than Yuna in
   the browser (the unit test covers all three), and FFX's own minigame layer (FFX untouched; its stacking was not looked at).
6. **Human options that moved** (the line never reads them): Yuna and Rikku lose Black Mage and Paine loses White Mage from the
   Farplane grids (so also XI and XV), Yuna loses Warrior and Rikku and Paine Songstress from the Via Infinito ones, Yuna and Rikku
   lose Black Mage and Paine Gunner at Djose. The reels' dangers are as sourced: five of the seven spins above were Duds.

## Left

- The review the plan asks for (focused before a deploy, the deep review after). A deploy was not asked for and was not done.
- The art decision (Findings 1) and whether Chapter XVI keeps her.
- Item Reels and Random Reels are still not shipped commands (r37, Left 2); the unattended-autopilot reels are still a blind roll
  (r37, Left 4): no shipped line opens a reel, and the digests above prove it.
- `docs/target/decisions.json` D-361 still reads `delivery: in-progress`; it is the driver's record, so it was not edited here.

## Commits and files

On `origin/main` 3b1ed60f, in this order (each says FFX-2 only in its subject and body):

| Commit | What | Drop it alone? |
|---|---|---|
| `9723dffd` | Lady Luck on the grids of Chapters V, XI, XIII and XV; the research note; `ffx2-lady-luck-grid.test.ts` | the core of D-361 |
| `bfc34a55` | Chapter XVI: owned and placed; the one pinned line; the XVI row of the grid test | yes, `git revert` (the judgement call) |
| `44357da5` | `.ffx2hud__minigame { z-index: 5 }` and its layer-order test (FOC37-01) | independent of the grids |
| `d7a2454c` | `advisor-menu.test.ts`: the guard reads which top-level rows are groups (test only) | yes, if the advisor or the grouping is to change instead; the test is red again for a Lady Luck girl without it |
| this one | this note, the measurement lines, the frames and the clip | docs only |

Commits end with the Sonnet line the harness names (the brief named the Opus line; the work was done by Sonnet 5.5, so the
true model is credited). Scratch is under
`D:/Tools/pyrefly-scratch/2026-10-03/lady-luck/` (harness output, the driver, the Vite config); the scratch tests are parked in
`F:/pyrefly-parked/2026-10-03/lady-luck/`. The three servers I started (PIDs 81580, 40408, 80172, all on 6610) are stopped.
