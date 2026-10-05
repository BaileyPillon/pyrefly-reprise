# r39-judg: judgment calls J, K, L, M of critic round 21 (release 39)

Lane `r39-judg`, branch `r39-judg` (from `origin/main` 105105c3, with `origin/r381-ui-floor` merged first: 0a41fc45, so the 14 px
floor is under the TEXT SIZE work). Not merged into `main`, not deployed. Bailey, 2026-10-04 about 18:35 EDT: "All your
recommendations I'll listen later I'm at work right now", which accepts the recommendation on cards J, K, L and M of
`critic/scratch/judgments-r21/index.html`. Nothing here is a new idea: each item is the card's recommended answer.

| Call | Game case (rule 14) | State | Commit | critic-plan class |
|---|---|---|---|---|
| J: Swordplay tiers take the section 5.3 estimates | FFX only (Tidus's Swordplay exists only in FFX) | done, proved by real keys | 774566da | FFX game data: focused before deploy, deep after |
| K: TEXT SIZE reaches the FFX-2 HUD and both games' pause | HUD rules FFX-2 only; the switch and the pause both games | **shipped ON** (not the relabel), proof 7 below | 9899c901 | DEEP (shared: global layout; FFX-2 HUD): focused before deploy, deep after |
| L: a look turned ON brings its parts | both (the EYE CANDY page is shared) | done, no save-format change | 96158258 | unclassified shared system under `src/app`: deep after; not the save-data class |
| M: first-run step 1 says "this one" off Chapter I | both (the board is shared) | done, text only | 764aaaa8 | unclassified shared system under `src/ui/coach`: deep after |

The head of the branch is the commit that adds this note and the frames. Frames and the scripts that took them are under
`docs/screenshots/r39-judg/` (`capture/` has every script; `lib.mjs` names the dev server, 127.0.0.1:7200 by default).
`docs/handoff/NOW.md` is untouched (another agent owns it in the main tree).

## J: Swordplay (FFX only)

Before: all four Swordplay tiers drew one pair, a 12.22 percent zone on a ~1,040 ms sweep, so Spiral Cut and Blitz Ace looked the
same and only the timer carried the sourced ordering. Now `src/data/ffx/overdrives/inputs.ts` holds the table of
`research/ffx-combat-core.md` section 5.3 (stronger tier: narrower zone, faster sweep), timers unchanged:

| Tier | Zone | Sweep | Timer | Window the player has |
|---|---|---|---|---|
| Spiral Cut | 22 % | 1,400 ms | 3,000 ms | 305 ms (was 127) |
| Slice & Dice | 16 % | 1,150 ms | 3,000 ms | 178 ms |
| Energy Rain | 12 % | 900 ms | 2,600 ms | 107 ms |
| Blitz Ace | 9 % | 700 ms | 2,200 ms | 68 ms (was 128) |

The numbers are **our estimate, adopted by Bailey 2026-10-04**: labelled so in `inputs.ts`, in `research/ffx-combat-core.md`
section 5.3 (`[estimate, Bailey 2026-10-04]`, in the style of Tornado's timer note, D-312) and in
`research/ffx-overdrive-input-rules-2026-09-30.md`. The Bushido order keeps its "our estimate" label. Nothing is invented: the
four rows are the table the note already held.

Proof (real keys, FFX Chapter III against Yunalesca; the only set-up hooks are a full Overdrive gauge, unlocked Overdrives and an
HP top-up so the fight outlives four plays): before and after, each tier opened and pressed on the gold zone by a real Enter,
the engine got `success: true`, timers 3,000 / 3,000 / 2,600 / 2,200 ms. Zones drawn: before 43.89 + 12.22 percent, four times;
after 39 + 22, 42 + 16, 44 + 12, 45.5 + 9 percent. Spiral Cut's zone is 158 px on the 720 px bar and Blitz Ace's 65 px.
Frames: `docs/screenshots/r39-judg/swordplay/` (`sheet-spiral-cut-vs-blitz-ace.jpg`, `sheet-all-four-tiers-after.jpg`, the
before and after overlays, `run-before.json`, `run-after.json`). Test: `tests/unit/ffx-overdrive-inputs.test.ts` (strict ordering,
the four rows, the timers, the pixel geometry of Spiral Cut against Blitz Ace, and that the label stays in `inputs.ts` and in
section 5.3).

## L: a look turned ON brings its parts (both games)

`fxLookOnPatch` (`src/app/fxParts.ts`) writes the look and all of its parts when every part the page lists for the game is off;
`adjustSetting` takes the page's game (`eyeCandyPage.ts` passes it). A part the player turns off afterwards stays off; a look with
at least one part on keeps the player's choices; a look turned OFF never rewrites its parts. OVERDRIVE SHOT is FFX's and
DRESSPHERE SHOT FFX-2's, so a part of the other game never hides the no-op. **No save-format change**: the same twelve stored
booleans, `SAVE_VERSION` stays 1, `SaveData.ts` untouched (so this is not the save-data class and needs no deep review before
going public).

Proof (release-35 save fixture, real keys: Esc, E five times to OPTIONS, EYE CANDY, Enter on BATTLE SPECTACLE, in FFX and FFX-2):
before, 8 OF 11 ON with the look's four parts still OFF; after, 11 OF 11 ON; SPLASH ART turned off by hand stays off through the
look going off and on; CINEMA LIGHT's three parts come back after being switched off by hand and the look off and on; stored key
sets and version identical before and after. Frames: `docs/screenshots/r39-judg/eye-candy/`. Tests: `tests/unit/fx-look-on.test.ts`
(19) and the appended describe in `tests/unit/pause-fx-looks-rows.test.ts`.

## M: first-run step 1 (both games)

`Start with the first one.` stays when Chapter I is on the plate; any other chapter reads `Start with this one.` Text only, the
card's place is unchanged. The hero plate carries `data-chapter` and `data-chapter-number` (`chapterCards.ts`); the guide reads
it each frame (`firstRunGuide.ts`, `firstRunCopy.ts`). Reproduced first from a fresh profile with real keys (title, Enter,
briefing, board, Down to Chapter IV): the card said "the first one" at 1600x900 and 390x844; now "this one" there, and the approved
line again on Chapter I. Frames: `docs/screenshots/r39-judg/first-run/`. Test: `tests/unit/ui-coach-first-run.test.ts`, frame by
frame on the board.

## K: TEXT SIZE 100 / 115 / 130 % grows the FFX-2 battle HUD and both games' pause

**Shipped ON** (`TEXT_SIZE_WIDE_SCOPE = true`, `src/app/applyComfort.ts`); the relabel fallback ("TEXT SIZE (FFX battles and
dialogue)", scope off) was **not needed**: the pause is clean on every tab, size and viewport measured, and the HUD meets the
card's bar (below) with the residuals listed. The 14 px floor ships through `r381-ui-floor` (merged first).

### What changed (each line is one defect found by running the game at 130 %, then fixed at its cause)

- **Switch**: the scope is on; `data-text-size-wide` is on `<html>` from the first frame and `currentWideTextScale()`
  (`hudTextSize.ts`) reads 1 / 1.15 / 1.3 (1 on the phone, which lays itself out).
- **FFX-2 desktop HUD** (`text-size-wide.css`): each panel of the 640x360 board grows from the corner it is pinned to; the command
  list is capped so its grown top stays under the help band (Chapter V's sixteen White Magic rows ran off the window: top at -116 px
  at 130 %); the advisor's type grows inside the lane `advisorLane.ts` solves and **folds** when the lane is `squeezed`
  (`advisorFolds`; it slid over Paine's feet), latched per decision so it never flickers.
- **Strategy guide rail** (`StrategyGuide.ts`): grows its type, not its column (it paints the 132 grid px it paints at 100 %), steps
  down by what the boss strips grew (`--sgd-shift`, measured: Chapter VI's three enemies grow three strips), fits the room above the
  girls (`railRoom`, scale-aware) and gives way (`sgd--squeezed`: hidden, panel and chip) when the strips leave none. It ran over
  Yuna's head (36 percent of her at 130 % in Chapter IV) before.
- **Enemy-intent slab**: prints its brief density while the text is grown (`EnemyIntent` `density` may be a function; FFX mounts it
  brief already), ranks the girls with the chrome (`placeSlab`'s `girlsFirst`, a 3 px graze on panel edges and on a girl's head
  edge), and keeps off the guide's MORE row. **New in this last pass:** at 130 % in Chapter VI the grown enemy list and command stack
  leave 121 grid px and the slab is 150, so its only chrome-free spot was across the three enemies (100 percent of two of their boxes,
  and the aimed one). It now has a **narrow shape** (`.eint__panel--narrow`, 116 grid px, the same words wrapped) that fits the gap;
  `ffx2/intentWidth.ts` + `intentPlacement.pickSlabWidth` wear it only when it is clearly the cleaner of the two on the board in
  front of it (the wide slab is good enough below 8 percent of its area; the slab's own enemy and the girls are not counted against
  it; the narrow spot is searched beside its enemy only). Chapter IV and V keep the wide slab in every frame measured.
- **Phone** (FFX-2's own HUD, `phone-hud.css` rules in the wide sheet): the command tiles, boss rail, footer and GUIDE chip grow;
  party chips cap at 115 %; a long tile name wraps instead of being cut ("White Magic Lv. 2" and "Lv. 3" both read "White Magic L..."
  at 130 %: 199 px of name in a 155 px tile).
- **Pause** (both games, `text-size-wide.css`, `pause-labels.css`): every `--pu-*` size grows; CONTROLS wraps its sentence labels,
  the CHAPTER tab keeps captions whole, the MUSIC list is bounded and scrolls (it ran over the objective at 100 % too), the phone's
  type keeps its 14 / 15 px floor and grows from it, and its key column is wide enough for "Strategy guide".

### State at the driver's time-box (22:45 EDT)

Everything in K above is committed (9899c901) and proven; nothing unproven is in it, so nothing had to be switched off. Proven means:
matrix 7 (below) on the code before one temporary debug line was removed, then six HUD cells and the phone pause at 130 % again after
it was removed (proof 8, same shapes, 0 errors); tsc clean; the 97 test files that import or read a touched module pass; the full suite
passes. No further matrix was run. What does not pass the card's strictest wording ("no overlap with figures or panels") is listed under
Residuals: all are enemy-box or frame-filling-box overlaps, none is a girl, a panel pair, an off-window box or an error, and the 100 %
baseline has the same class of overlap. The remainder for 39.1 is that list.

### Proof: matrix 7 (headless GPU Chromium, real keys on desktop, real taps on the phone)

FFX-2 Chapter IV (Bahamut), V (Vegnagun, Shuyin) and VI (Leblanc) at 1600x900, 2000x1012 and 390x844, each at 100 / 115 / 130 %, three
steps on desktop (first command menu, the first row opened, the target step) and two on the phone; and both games' pause (FFX
Chapter I, FFX-2 Chapter IV) on every tab at the same three viewports and sizes. 45 cells, 216 recorded steps. Per step the harness
measures every HUD panel's box against every other and against each fighter's body box (the HUD's own, half width 0.28 of the
projected height), text off the window, text on text (per line), split words, labels cut by an ellipsis, the smallest effective
type and console errors. Acceptance is **relative to the same cell at 100 %**: no girl under a panel, no new panel pair, nothing
off the window, no word split or label cut that was not there, 0 console errors; overlaps with an enemy's box are read, not scored.

| Measure | Result |
|---|---|
| Console errors | 0 in 45 cells |
| Text or panel off the window | 0 (the phone tab strip is a carousel whose neighbours run off by design; the open tab is inside in every phone pause step) |
| Split words | 0 |
| Labels cut with an ellipsis | 1: Chapter V, phone, **100 %** (the baseline "White Magic Lv. 2 / 3", 167 px in 155); at 115 and 130 % they wrap |
| A girl under a panel at 115 / 130 % | 0 (one baseline at 100 %: the advisor chip over Paine, 3 percent, 2000x1012) |
| A new panel pair at 115 / 130 % (desktop) | 0 (phone: `advisor+tip` and `command+tip` are there at 100 % too) |
| Intent slab over Bahamut | 100 %: 34-37 percent of his box; 115 %: 0-6; 130 %: 11-12 (1600x900), 27-29 (2000x1012) |
| Intent slab over Chapter VI's enemies at 130 % | the narrow shape is worn in 6 of 6 desktop steps; no overlap with Dr. Goon or Fem-Goon (before the narrow shape: 100 percent of Dr. Goon and Ormi, 30-47 of Fem-Goon) |
| Slab shape | narrow only in Chapter VI at 130 %; wide in every other desktop step (Chapter IV, V; Chapter VI at 100 / 115 %) |

Frames: `docs/screenshots/r39-judg/text-size/` (144 frames, 9 HUD contact sheets, 6 pause sheets, `matrix-results.json` with every
measured field per cell). Method: `capture/matrix.sh` (four parallel streams), `sweep2.sh`, `textsize2.mjs`, `summarize.mjs`,
`frames-k.mjs`; time series of the slab's box: `capture/probe-hop.mjs`.

### Residuals (disclosed; none is a girl, a panel pair, an off-window box or an error)

- Chapter VI at 130 %: `party>fem-goon` 10-20 percent of her box, new against 100 %: the grown party list's slanted corner touches
  her feet; her body is clear. At every size `intent>ormi-entrance` is 43-48 percent (44 at 100 %): the slab's bottom edge on the head
  end of the distant Ormi box. At 115 % the slab grazes Dr. Goon's box by 3-4 percent.
- Chapter V: panels against the frame-filling `vegnagun-tail` box (24 percent of the frame) are a few percent more than at 100 %
  (party 4-9, command 5-20); no girl, no pair.
- The guide rail hides itself when the boss strips leave it no room (Chapter VI at 115 / 130 %), and the advisor card folds when it
  has no lane (Chapter IV at 130 %); both are back at 100 %. This is the design: FFX's advisor folds the same way.
- Phone: the pause type grows only at 130 % (it holds its 14 / 15 px floor at 115 %); the baseline `advisor+tip` and `command+tip`
  chip overlaps, and the one phone label cut at 100 %, are untouched.
- Baseline items seen and left alone: 12.5 px minimum type in Chapter VI's submenu at 100 %; one text-on-text pair (`WM|WM`).
- Files over the 400-line house limit that grew: `FFX2BattleHud.ts` (1,347), `StrategyGuide.ts` (873), `EnemyIntent.ts` (882), and the new
  `tests/unit/text-size-intent-width.test.ts` (467). `intentPlacement.ts` is 391, `intentBoard.ts` 325, `intentWidth.ts` 70.

### Method check (AGENTS.md rule 15: written before any further attempt; this lane is on matrix 7)

What kept failing: "the intent slab covers something at 130 %". Matrices 1 to 3 chased it frame by frame (brief density, `girlsFirst`, a 3 px
graze, a narrower slab everywhere), and each fix moved the overlap to another chapter. The method that worked, and the one to keep:

1. **Read the solver's inputs and scores at the bad frame, not the picture.** A temporary hook that kept the two shapes' scores and
   the obstacle list at the moment of the decision (removed before the commit) showed three structural causes the pictures hid: a
   gap narrower than the slab (geometry, so a second shape), a 74 px squared overlap with Paine's head box that flipped the slab 223 px
   on a one-pixel bob (zero tolerance on a ranked tier, so a graze on a girl's head edge), and a decision metric that counted the
   slab's own enemy and a frame-filling painting (so "own enemy excluded" with air for the rest-pose/live-pose mismatch). A fourth was
   a bug of mine, a `near` window measured from a spot 436 px above the frame that filtered out every candidate and scored the
   fallback as covering nothing.
2. **Look at time, not one frame.** `capture/probe-hop.mjs` logs the slab's box through menu changes; every shape flip and hop was
   seen there first. A single matrix frame hit a transient (a tail crossing its head, a plate sliding in).
3. **One cause per proof, and the pure function first.** Each cause got a unit-tested pure function (`placeSlabScored`, `pickSlabWidth`,
   `chooseSlabWidth`, `IntentWidth`) and a probe that showed it fixed before a full matrix was spent; the "settles" test feeds every
   answer back in as the current shape.
4. **Acceptance relative to 100 %**, so a baseline artefact (the Ormi box, the phone chips) is never mistaken for a regression.

If K needs a further pass (39.1), start at the residual list above with that order: probe the time series of the frame, read the
scores, fix the cause, then run matrix 8.

## Gates

- `npx tsc --noEmit`: clean.
- Focused set: the 97 test files that import or read any module this lane touched (all four calls; list built by grep, kept in the
  scratch notes): **97 passed, 1,177 tests, 1 todo**.
- Full unit suite (817 test files, `vitest run --maxWorkers=3 --testTimeout=60000`): **812 passed, 5 skipped (817 files); 11,982 tests passed, 46 skipped, 1 todo; 0 failed** (22 minutes under load, run on the code as committed).
- `node tools/orphans.mjs`: 24 orphaned, the same 24 as before (`intentWidth.ts` is imported by `FFX2BattleHud.ts`).
- New or changed files scanned for stray control characters: none added. Two exist in `HEAD` and are unchanged (a `\x01` join
  separator in `StrategyGuide.ts`, and a `\x07` where a comment in `FFX2BattleHud.ts` lost the word "action").
- After the debug hook was removed, six HUD cells and the phone pause at 130 % were run again (proof 8): the same shapes (narrow in
  Chapter VI only), 0 errors, 0 labels cut, 0 girls under a panel.
- `critic-plan` for K's files: DEEP (shared systems: global layout, FFX-2 HUD, unclassified), focused review of the candidate before the
  deploy, live verification, then the deep review on the live build (`obligations: live + focused + deep`). J: FFX game data, focused
  before, deep after. L and M: unclassified shared systems, deep after.

## What to try when this is live

TEXT SIZE in OPTIONS at 130 %: FFX-2 Chapter VI (the intent slab stands above the three enemies, narrow), Chapter IV (the guide steps
down, the advisor folds), Chapter V (the command list stays under the help band), the pause on every tab, and on a phone. Swordplay in
FFX Chapter III (Spiral Cut forgiving, Blitz Ace tight). EYE CANDY: turn a look ON with its parts off. First run: move the cursor to
Chapter IV on the board.
