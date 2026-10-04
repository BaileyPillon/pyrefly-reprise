# r38-polish: D-359 (no "Guide's pick" tag), FOC371-01 (Chapter IX's arrival on a hurried opening), FOC371-02/-03/-04 (the Trigger Happy slab and the Lady Luck reels)

**Branch:** `r38-polish` (from `origin/main` a6b79313 = release 37.1 plus its records). Pushed, **not merged, not deployed**.
**Why:** Bailey, 2026-10-03: "all your recommendations, godspeed" / "I'll go with all your recommendations thank you <3" on the
driver's list: D-359 (ask 11) and the open findings of the focused review of f4244e1f (`critic/reviews/f4244e1f-focused.json`:
FOC371-01 major, FOC371-02 to -04 polish and suggestion).
**critic-plan class** (`node tools/critic-plan.mjs --paths <the changed files>`): **DEEP, after deploy** for the change as a whole
(focused review of the production candidate before the deploy; live verification, then the deep review on the live build; its
own reason is "37 substantial checkpoints since the last deep review"; each item alone classes the same, the advisor card's
files as "global layout, input and boot", the Cavern files as "effects, lighting and sprites"). **Not the save-data class**: no
`SaveData.ts`, schema, migration or settings key.

| Commit | Item | Game case | What |
|---|---|---|---|
| `940b8be3` | D-359 | **both** | The advisor card loses the "Guide's pick" tag (and the guide comparison behind it). |
| `a09f4459` | FOC371-01 | **FFX only** | A hurried opening of Chapter IX plays the approved night-sakura arrival, compressed 2x, from the moment the card is gone; Yojimbo, Daigoro and Ginnem stay drawn at the first menu. |
| `560616c8` | FOC371-02 (and the stacking half of -04) | **FFX-2 only** | The minigame layer is a grid layer beside the HUD stage, so the Trigger Happy slab and the Lady Luck reels paint above the intent card and the guide on desktop as well as the phone. |
| `17b823a8` | FOC371-03 (and the Lady Luck labels) | **FFX-2 only** | Every label on both overlays is at least 14 effective px; the slab's instruction takes a second line in a window under 960x540. |
| this one | FOC371-04 | **FFX-2 only** | The verification and the frames for Bailey (no code). |

The game case is decided from the sources, not memory (hard rule 14): the advisor card is shared UI that both battle HUDs mount
(`MoveAdvisor.ts`), so D-359 is both; the Cavern of the Stolen Fayth is the FFX Yojimbo chapter (`research/ffx-yojimbo.md`; no
FFX-2 chapter stands there) and the one shared line is a mark in `BattleScreen.ts` that every other scene ignores; Trigger Happy
and Lady Luck are X-2 abilities (`research/ffx2-combat-core.md` 3.1 and 3.12) drawn by the FFX-2 HUD's own layer, while the FFX
overlays (`overdrive-minigames.css`, scoped by `.ffx-mg`) are untouched.

## D-359: the "Guide's pick" tag is gone (both games)

**What it was.** `MoveAdvisor.ts` printed a "Guide's pick" tag beside the lead row whenever the chapter tactic had picked it
(`source: 'tactic'`), and `advisorGuideBadge.ts` (PR-0169) withdrew it the moment the guide's NEXT line named a different command.
Bailey, 2026-10-03: "The guide and next move advisor are completely separate entities". Once the guide becomes a document of its
own the comparison is a claim about something the card does not own.

**Where it rendered.** One component prints it, and both HUDs mount that component (FFX: `FFXBattleHud.ts`, FFX-2:
`FFX2BattleHud.ts`): `MoveAdvisor.ts` (the span in `moveHtml`), styled by `move-advisor.css` and hidden on the phone by
`phone-battle-parts.css`. All three lose it; `advisorGuideBadge.ts` is gone (parked at
`F:/pyrefly-parked/2026-10-03/r38-polish/`). `cardHtml`'s density ladder had a rung whose only job was to shed the badge; with
the badge gone that rung printed what the one before it printed, so the ladder is six rungs (0 to 5) and `MAX_DENSITY` is 5.
`fitCard` walks the same boards to the same last rung: nothing on screen changes but the tag.

**Not touched on purpose.** `MoveSuggestion.source` (the advisor's own data: `advisor.ts` and `advisor-v3.ts` still rank by it);
`docs/target/decisions.json` (D-359's `delivery` is the driver's record, and the D-360 and D-361 lines beside it are other
branches' edits, so an edit here would conflict); the critic runner's `readPick` probe (`critic/runner/lib/supp.mjs`), which still
reads `.mad__badge` and now reports `false`.

**Proof.** `advisor-guide-badge.test.ts` now pins that no density in either game prints a tag and that the card ignores a new
board; the type-floor and ui-move-advisor tests dropped the tag's rows. In the real game, at the first command menu of four
chapters, real keys, 1600x900:

| Build | Chapter (first menu, 1600x900) | Lead row | "Guide's pick" tag printed |
|---|---|---|---|
| release 37.1 | seymour-flux | Hastega | YES: Guide’s pick |
| this branch | seymour-flux | Hastega | no |
| release 37.1 | yunalesca | Hastega | YES: Guide’s pick |
| this branch | yunalesca | Hastega | no |
| release 37.1 | ffx2-bahamut | Shell | YES: Guide’s pick |
| this branch | ffx2-bahamut | Shell | no |
| release 37.1 | ffx2-vegnagun-shuyin | Light Curtain | no |
| this branch | ffx2-vegnagun-shuyin | Light Curtain | no |

## FOC371-01 (FFX only): Chapter IX's night-sakura arrival on a hurried opening

**What the review found** (`critic/reviews/f4244e1f-focused.json`, major, introduced by 37.1). 37.1 cured PR-0341 (Yojimbo and
Daigoro missing at the first menu after a skipped scene) by never playing the arrival on a hurried opening: tree opacity peaked at
0 in 6 of 6 hurried runs. Bailey's recorded words on the chamber tile (`docs/target/targets.json`, 2026-09-24, "All your
recommendations", D-072) say the arrival plays at the start of the fight, and a player who skips the scene is a player too.

**Why it was not a one-liner.** A hurried opening collapses inside one tick (the camera cuts to `intro` and on to `idle` before a
frame renders), so the scene's own signal for "the opening shot is up" never fires. The first menu follows the card by about 3.1 s
(measured below), and the first enemy acts 3.0 s after the card goes.

**What is built.**
- `BattleScreen.runEncounter` raises a second mark, `markOpeningBegun`, the moment the card is gone and the opening begins (only for a
  hurried opening; `openingMark.ts`, one-shot, independent of the hurried mark). It is the moment a full opening puts the camera on
  its `intro` rig.
- `ArrivalWait` (pure) now holds Yojimbo and Daigoro off the field for a hurried fight too, exactly as for a full opening (they are
  "not yet summoned" while the card is up), starts the arrival from that mark, and runs the arrival's own clock
  `HURRIED_ARRIVAL_SPEED = 2` times faster: the night forms in 0.35 s, Daigoro is on at 0.31 s, Yojimbo steps out from the tree and
  stands on his spot at 0.55 s, and the night, tree and petals are gone again at 2.5 s, before the first enemy acts.
- `HURRIED_ARRIVAL_FALLBACK_MS = 4000` bounds the hold from staging should the mark ever not come, so PR-0341 cannot return through a
  missing signal (the card is gone 2.0 to 2.4 s after staging, the first menu 5.2 to 5.6 s).
- A full opening (the scene tapped through) is untouched: same hold, same 9 s bound, speed 1.

**A choice I made for you.** I played the whole approved moment compressed, figures included. The review's "smallest" option was to
run only the night, tree and petals over figures that are already standing. If you prefer that, it is a few lines in
`ArrivalWait`/`runArrival` (do not hold the figures, do not ramp their alpha); the compressed figures are the only reason the hold
and its fallback exist.

**Measured** (production build of this branch, `vite build` and `vite preview`, headless GPU Chromium, real keys from a fresh title,
seed 1; the page's own per-frame probe reads every staged actor's alpha, every arrival mesh's opacity, the card and the engine's
event counter; `arrival.mjs`, run files and frames under `D:/Tools/pyrefly-scratch/2026-10-03/r38-polish/`):

| Build, opening | Window | Yojimbo, Daigoro, Ginnem drawn in the first 3 frames after awaitingMenu | Arrival shown (tree opacity above 0.2) | First arrival mesh above 0.2, after staging | Daigoro / Yojimbo full, after the card is gone | Arrival visible for | Card gone to first menu |
|---|---|---|---|---|---|---|---|
| this branch, scene skipped (hurried) | 1600x900 | 3 of 3 | 3 of 3 (peak 1.0) | 2.25 s to 2.48 s | 0.31 s to 0.32 s / 0.54 s to 0.55 s | 2.52 s to 2.54 s, over 0.59 s to 0.60 s before the menu | 3.13 s to 3.15 s |
| this branch, scene skipped (hurried) | 2000x1012 | 3 of 3 | 3 of 3 (peak 1.0) | 2.09 s to 2.46 s | 0.31 s to 0.32 s / 0.55 s to 0.55 s | 2.52 s to 2.52 s, over 0.62 s to 0.66 s before the menu | 3.15 s to 3.19 s |
| this branch, scene tapped through | 1600x900 | 3 of 3 | 3 of 3 (peak 1.0) | 3.36 s to 3.59 s | 0.70 s to 0.72 s / 1.17 s to 1.19 s | 5.02 s to 5.03 s, over 4.67 s to 4.72 s before the menu | 9.72 s to 9.79 s |
| this branch, scene tapped through | 2000x1012 | 3 of 3 | 3 of 3 (peak 1.0) | 3.52 s to 3.86 s | 0.69 s to 0.70 s / 1.16 s to 1.17 s | 5.00 s to 5.03 s, over 4.63 s to 4.76 s before the menu | 9.68 s to 9.81 s |
| release 37.1 (deployed), scene skipped (hurried) | 1600x900 | 2 of 2 | 0 of 2 (peak 0.0) | never | 0.00 s / 0.00 s | never shown | 3.18 s to 3.25 s |

The 37.1 row is the deployed bytes (`D:/pyrefly-rel371/dist-release`) through the same harness. The tapped-through numbers match the
focused review's own (tree peak 8.7 s before the menu on both live and the candidate), so that path is unchanged. Frames:
`docs/screenshots/r38-polish/foc371-01-hurried-arrival-before-after.jpg` (37.1 above, this branch below, at +0.45 s, +1.3 s, +2.6 s
after the card is gone and at the first menu) and `foc371-01-tapped-opening-unchanged.jpg`.

**Left.** A player who presses Confirm during a normal opening, after its first frame, still gets the arrival's own 1.3 s (the
arrival has started and runs on): unchanged from release 36, not reproduced, not touched (r37-hotfix, Left 4). PR-0342 (round 20,
"a foreign blue tree") reads the approved arrival as a defect; re-scope it, do not close it by removing the arrival (the review's
own note).

## FOC371-02, -03, -04 (FFX-2 only): the Trigger Happy slab and the Lady Luck reels

**FOC371-02, the stacking context.** 37.1 gave the slab `z-index: 15`, but a z-index ranks only inside its stacking context, and the
slab lived in `.ffx2hud__stage`, whose `transform` makes it a context of its own; the intent layer (`.eint`, z-index 2) is a sibling
of the stage on the overlay, so it painted over the whole stage. On the phone the stage has no transform, so the 15 did win there.
Fixed at the context: `.ffx2hud__minigame` is now a third 640x360 grid layer, a child of `.ffx2hud` beside the stage (the way
`.ffx2hud__plates` already is), given the stage's transform in `layout()`, with `z-index: 15` on the layer. The card, the guide
(3), the advisor (4) and the phone's guide chip (12) are now ranked against it in one context. Phone: the layer drops the letterbox
transform with the stage and the plates (`phone-hud.css`), so the phone is as it was.

**FOC371-03, the 14 px floor.** Both overlays are authored on the 640x360 grid and scaled by the stage (the phone draws it 1:1), so a
flat px cannot clear every window; `minigames.css` now uses the advisor card's fix: `--mg-fs-floor` is 14.2 effective px written
in grid px from the scale the HUD publishes (`--lb-scale`), and every size is `max(authored, floor)`: the Trigger Happy
instruction (5.33) and counter (5.78), Lady Luck's instruction (5.33), reel symbols (8), arrow (10) and DUD line (8). A size that
was already big does not move. In a window under 960x540 (stage scale under 1.5: every upright phone) the Trigger Happy
instruction takes its own line under the title and the counter, as the FFX Grand Summon picker does on the phone
(FOC28-P02); the window decides, not the text, so the head never reflows while the counter climbs. From 960x540 up the head is the
one line it was (measured with the widest words, MASH CLICK and 16 HITS: 36 grid px to spare at 1024x768). Lady Luck's arrow now
sits directly above its reel with room reserved for it (it is +2 grid px of space above the reels at desktop sizes).

**FOC371-04, what the slab covers.** While the window is open (1.8 to 2.6 s) it covers the guide card (on desktop it already did in
37.1: the guide is inside the stage) and the intent card (on the phone it did in 37.1; on desktop it now does too, which is the
FOC371-02 fix). That is kept (it is an open minigame, the review's own "no fix needed; show Bailey"). What is checked is that
nothing the *player* needs is hidden: every text leaf, the ring, the bar and the counter are probed at the centre and on a 4x3 grid
of points, and the topmost element is the slab's own at every one, with the intent card parked over the slab at 15, 50 and 85
percent of its width. The frames are the "natural" and "card parked over the slab" pairs below.

**Bench, then the real game.** First the real `FFX2BattleHud` in the dev server at nine window sizes (390x844 phone layout,
800x600, 1024x768, 1152x648, 1280x720, 1366x768, 1600x900, 1920x1080, 2000x1012; the overlay opened through `hud.openMinigame`, the
counter at 16 and the words at MASH CLICK, the widest): the smallest text on either overlay is 14.2 px at every size up to 1600x900
(15.99 at 1920x1080, 14.98 at 2000x1012), against 5.33 on the phone and 13.33 at 1600x900 before; no leaf clipped, none outside the
slab, the slab whole. Then the real game, below.

**Real keys, production build of this branch against the deployed 37.1 bundle** (headless GPU Chromium, fresh profile, seed 1;
keyboard at the desktop sizes and a touch context on the phone; Yuna changed to Gunner and Skill > Trigger Happy chosen through the
real menus; each window read at the moment it opens, with the intent card forced over the slab at three places in the same task as
the read, because the HUD rewrites the card's inline position every frame; `th2.mjs` and `slabprobe.mjs`):

| Build | Ch | Window | Windows read | Minigame layer z-index | Windows with every label topmost (natural) | Forced overlaps with the card over the slab (3 per window) with every label topmost | Largest share of any label covered | Smallest text | Instruction words | Labels clipped or outside the slab | Guide / intent card over the slab (natural, largest) |
|---|---|---|---|---|---|---|---|---|---|---|---|
| release 37.1 | V | 390x844 | 4 | auto, inside the stage | 4 of 4 | 12 of 12 | 0 % | 5.33 px | MASH TAP | 0 | 0 % / 94 % |
| release 37.1 | V | 1024x768 | 3 | auto, inside the stage | 3 of 3 | 0 of 9 | 100 % | 8.53 px | MASH R | 0 | 22 % / 0 % |
| release 37.1 | V | 1600x900 | 3 | auto, inside the stage | 2 of 3 | 0 of 9 | 100 % | 13.33 px | MASH R | 0 | 22 % / 34 % |
| release 37.1 | V | 2000x1012 | 3 | auto, inside the stage | 3 of 3 | 0 of 9 | 100 % | 14.98 px | MASH R | 0 | 22 % / 0 % |
| release 37.1 | IV | 390x844 | 4 | auto, inside the stage | 4 of 4 | 12 of 12 | 0 % | 5.33 px | MASH TAP | 0 | 0 % / 94 % |
| release 37.1 | IV | 1600x900 | 4 | auto, inside the stage | 4 of 4 | 0 of 12 | 100 % | 13.33 px | MASH R | 0 | 22 % / 0 % |
| release 37.1 | IV | 2000x1012 | 4 | auto, inside the stage | 4 of 4 | 0 of 12 | 100 % | 14.98 px | MASH R | 0 | 22 % / 0 % |
| this branch | V | 390x844 | 4 | 15, beside the stage | 4 of 4 | 12 of 12 | 0 % | 14.2 px | MASH TAP | 0 | 0 % / 77 % |
| this branch | V | 1024x768 | 3 | 15, beside the stage | 3 of 3 | 9 of 9 | 0 % | 14.2 px | MASH R | 0 | 22 % / 0 % |
| this branch | V | 1600x900 | 3 | 15, beside the stage | 3 of 3 | 9 of 9 | 0 % | 14.2 px | MASH R | 0 | 22 % / 34 % |
| this branch | V | 2000x1012 | 3 | 15, beside the stage | 3 of 3 | 9 of 9 | 0 % | 14.98 px | MASH R | 0 | 22 % / 0 % |
| this branch | IV | 390x844 | 4 | 15, beside the stage | 4 of 4 | 12 of 12 | 0 % | 14.2 px | MASH TAP | 0 | 0 % / 77 % |
| this branch | IV | 1024x768 | 4 | 15, beside the stage | 4 of 4 | 12 of 12 | 0 % | 14.2 px | MASH R | 0 | 11 % / 0 % |
| this branch | IV | 1600x900 | 4 | 15, beside the stage | 4 of 4 | 12 of 12 | 0 % | 14.2 px | MASH R | 0 | 22 % / 0 % |
| this branch | IV | 2000x1012 | 4 | 15, beside the stage | 4 of 4 | 12 of 12 | 0 % | 14.98 px | MASH R | 0 | 22 % / 0 % |

Chapter V's fight is won inside the third window at the desktop sizes (Trigger Happy and the others finish Vegnagun), so those runs
read three windows; the harness's "left the battle: screen results" on them is the fight ending, not a defect. "Forced overlap"
parks the real intent panel (un-hidden and given text when the board has no intent at that moment) over the slab at 15, 50 and 85
percent of its width. On 37.1 the one natural window that already had the card over the slab is the review's own frame (Chapter V
at 1600x900, the card covering 34 percent of it).

**Lady Luck's reels.** No shipped grid offers Lady Luck on this base (the r38-lady-luck-grid lane makes her reachable), so the
overlay is opened through the live HUD's own `openMinigame` (`window.__pyrefly.battle().hud`) at the first command menu of
Chapter IV, reached by real keys, and the three stops are real Enter presses. Everything the overlay is drawn with is the shipped
code. Both builds, same method:

| Build | Window | Minigame layer | Smallest text | Labels clipped or outside | Forced overlaps (3) with every label topmost | Three real Enter presses |
|---|---|---|---|---|---|---|
| release 37.1 | 390x844 | auto, inside the stage | 5.33 px | 0 | 0 of 3 | stopped by 3 Enter presses |
| release 37.1 | 1600x900 | auto, inside the stage | 13.33 px | 0 | 0 of 3 | stopped by 3 Enter presses |
| release 37.1 | 2000x1012 | auto, inside the stage | 14.98 px | 0 | 0 of 3 | stopped by 3 Enter presses |
| this branch | 390x844 | 15, beside the stage | 14.2 px | 0 | 3 of 3 | stopped by 3 Enter presses |
| this branch | 1600x900 | 15, beside the stage | 14.2 px | 0 | 3 of 3 | stopped by 3 Enter presses |
| this branch | 2000x1012 | 15, beside the stage | 14.98 px | 0 | 3 of 3 | stopped by 3 Enter presses |

**The press routes did not change** (FOC37-02's behaviour, moved with the layer; Chapter V, 3 presses each, `th.mjs`):

| Route | Window | Presses | Slab says | Engine hits | Hits landed | Words |
|---|---|---|---|---|---|---|
| key | 1600x900 | 3 | 3 HITS | 3 | 3 | MASH R |
| mouse | 1600x900 | 3 | 3 HITS | 3 | 3 | MASH CLICK |
| pad | 1600x900 | 3 | 3 HITS | 3 | 3 | MASH R1 |
| touch | 390x844 | 3 | 3 HITS | 3 | 3 | MASH TAP |

**Frames for Bailey** (`docs/screenshots/r38-polish/`, each a before-and-after pair at the same moment, 37.1 on the left):
`th-ch5-vegnagun-{1600x900,2000x1012,390x844}-before-after.jpg` and `th-ch4-bahamut-{...}-before-after.jpg` (top row: the slab as it
is; bottom row: the intent card parked over it), `ladyluck-reels-{1600x900,2000x1012,390x844}-before-after.jpg`.

**Two things that move, and what does not.** (1) The slab now paints above the damage numerals on desktop too (the numerals' layer is
z-index 6; on the phone the slab was already above them). The slab sits top-left and numerals land over actors; I did not measure
whether one ever lands under it. (2) Lady Luck's overlay is now above the guide card and the intent card on desktop and on the
phone too, because it shares the layer (on 37.1 the guide covered reel 1 on desktop, which is FOC37-01, and the intent card covered
the whole overlay on the phone; the frames show both). Not moved: the Trigger Happy tap, key and pad routes (the table above), the
1.8 to 2.6 s window, the slab's geometry, the Lady Luck overlay's keyboard-only input.

**Merge note, r38-lady-luck-grid.** That branch sets `.ffx2hud__minigame { z-index: 5 }` in `ffx2-hud.css` (FOC37-01) and pins it
in `ui-ffx2-minigame-layer.test.ts` (guide 3 < advisor 4 < layer < numerals 6). It merges textually clean with this branch (checked
with `git merge-tree`), and its test still passes (it reads its own 5), but the effective z-index becomes 15 here (this branch's
`.ffx2hud > .ffx2hud__minigame` outranks it): the two intents differ on whether the numerals sit above the minigame layer. 15 keeps
the phone as 37.1 shipped it (above the guide chip at 12); if you want the numerals on top everywhere, the layer must be 5 and the
phone's chips (12) then paint over the slab, which no window read showed overlapping. Your call; one number in `minigames.css`.

## Merge checks

`git merge-tree --write-tree` of this branch against `origin/r38-advisor-card` (a88b8cc7) and `origin/r38-lady-luck-grid` (9111c402):
both clean, no conflicting file. r38-advisor-card changes `advisorRoomy.ts`, `advisorStrip.ts`, `hudSafeZones.ts` and `advisorLane.ts`;
this branch's advisor change is in `MoveAdvisor.ts` and two stylesheets, and nothing there reads the density rung numbers.

## Gates

- `node node_modules/typescript/bin/tsc --noEmit`: clean (TypeScript 7.0.2, over 2,000 files under src and tests).
- Targeted, each item as it was committed: the 22 advisor-card files (276 tests), the 4 cavern files (51), the 32 files that mount the
  FFX-2 HUD (286), and the two new files `ui-ffx2-minigame-stacking` (8) and `ffx2-minigame-type-floor` (14): all pass.
- Full suite (`vitest run --maxWorkers=3 --testTimeout=60000`, once, at the end, in this worktree with the junctions in place):
  **772 files passed, 5 skipped (777); 11,337 tests passed, 41 skipped, 1 todo; 0 failed; exit 0; 457 s** (the known
  strategy-ffx2-bahamut "heal-only route" load timeout did not occur).
- `node tools/orphans.mjs`: 24 orphaned, the same 24 as on `origin/main`; `advisorGuideBadge.ts` is gone and nothing new is unreachable.
- House rule 7 (under 400 lines): `cavern-stolen-fayth-arrival.ts` 398 (was 375), `cavern-stolen-fayth.ts` 393 (was 381),
  `openingMark.ts` 54, `minigames.css` 142 (was 85); `MoveAdvisor.ts` 703 (was 712), `FFX2BattleHud.ts` 1,290 (was 1,282) and
  `BattleScreen.ts` 929 (was 927) were already over.
- No contract file touched (`docs/CONTRACTS.md`'s list), so no `CONTRACT-CHANGES` entry; no new settings key and nothing in
  `SaveData.ts` (not the save-data class); nothing under `src/battle` or `src/engine` changed (hard rule 1), so the engines and the
  seeded RNG are untouched.
- Not run: the Playwright e2e specs (`tests/e2e`; they need a `dist/` this worktree lacks). `hud-collision.spec.ts` lists the two
  slabs among its panels but asserts no stacking.

## Re-run recipe

```
node node_modules/vite/bin/vite.js build --outDir <scratch>/dist-final --emptyOutDir        # not `npm run build`: its prebuild rewrites public/art/manifest.json through the junction
node node_modules/vite/bin/vite.js preview --outDir <scratch>/dist-final --port 6800 --host 127.0.0.1 --strictPort
cd D:/Tools/pyrefly-scratch/2026-10-03/r38-polish/harness     # then, with PYREFLY_BROWSER=gpu, one browser at a time:
bash batch-arrival.sh item2 6800                      # FOC371-01: hurried and tapped, 3 runs at 1600x900 and 2000x1012
bash batch-th2.sh cand 6800                           # FOC371-02/-03/-04: Chapters IV and V at three sizes, four windows each
node reels-prod.mjs --base=http://127.0.0.1:6800/pyrefly-reprise/ --label=cand --size=390x844   # Lady Luck's overlay
node card-check.mjs --base=... --label=cand --chapter=seymour-flux --size=1600x900              # D-359
node digest-arrival.mjs item2 ; node digest-th2.mjs cand ; node make-tables.mjs ; node montage.mjs
```
The deployed 37.1 bytes to compare against are `D:/pyrefly-rel371/dist-release` (served read-only). The harness is the focused
review's own (`critic/reviews/f4244e1f-focused/harness/`) with a per-frame probe added; the servers I started (6800 and 6801) are stopped.

## Left (for the driver)

1. `docs/target/decisions.json`: D-359 `delivery` is still `not-scheduled` (set it when this merges). `docs/target/targets.json`:
   the chamber tile's `delivery` could now say the arrival plays for both openings.
2. PR-0342 should be re-scoped, not closed by removing the arrival (above).
3. The z-index choice for the minigame layer against r38-lady-luck-grid's 5 (above).
4. `critic/runner/lib/supp.mjs` `readPick` still reads `.mad__badge`; a later critic-runner cleanup can drop it.
5. The review the plan asks for (focused before a deploy, the deep review after); nothing was deployed or merged.
6. Commits end with the Sonnet line (the true model), not the Opus line the brief named; the sibling lanes did the same.

