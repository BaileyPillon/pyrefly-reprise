# r381-guide-check: independent check of `origin/r381-guide` (daf140b6) for 38.1

**Verdict: PASS** for the guide's reading view, its data and its separation from the advisor, with two disclosed defects that are not the
branch's (both are on live main today) and one small defect the branch inherits and shrinks (Leblanc). **Game case: both** (shared
plumbing; the sheet is checked in FFX Chapters I, II, III, VII, VIII, IX, X, XII, XIV, XVII, XVIII and FFX-2 IV, V, VI, XI, XIII, XV, XVI).
Checker: a Sonnet sub-agent that did not build the branch. Branch checked: `origin/r381-guide` daf140b6 (merge of `origin/r38-guide-jegged`
8e85c1e2 and `origin/main` 22dae67d). Origin/main now stands at e2e33e0b; its only difference from 22dae67d is `docs/target/*.json`.
Worktree `D:/pyrefly-r381-guide-check` (detached; junctions `node_modules`, `public/art`: `cmd /c rmdir` both before any removal).
Scratch, scripts and raw JSON: `D:/Tools/pyrefly-scratch/2026-10-04/guide-check-r381/`. Frames: `docs/screenshots/r381-guide-check/` (11).
Nothing merged, nothing deployed. QUIET-PLEASE was absent in every run; servers 7090 and 7091 started by this check and stopped by PID.

## 1. Guide data and strings against 8e85c1e2: PASS

- `git diff 8e85c1e2 HEAD` over `src/data/guides/`, `StrategyGuide.ts`, `strategy-guide.css`, `guideDoc.ts`, `guideDocHtml.ts`,
  `guideScroll.ts`, `statusHintCard.ts`: **empty**.
- Every file that differs between 8e85c1e2 and HEAD under `src tests tools critic` (157) is also a file release 38 changed (210), and
  HEAD equals origin/main on all of them except two: `src/ui/ffx2/FFX2BattleHud.ts` (the guide's removed calls, the `held` option;
  justified in the handoff section 1) and `tests/unit/guide-doc-separation.test.ts` (27534efe, justified).
- Against origin/main the branch's `src` diff is 36 files: the 18 guide documents plus doc types and index, the sheet, its CSS,
  scroll, hint card, and 3 to 15 lines in each of `FFXBattleHud.ts`, `FFX2BattleHud.ts`, `hudAvoidSelectors.ts`, `DamageNumbers.ts`,
  `DamageLayer.ts`, `battleMessage.ts`, `intentBoard.ts` (all HUD wiring: the hint card's new selector, `this.guide.showDecision` and
  `clearDecision` calls removed). No file under `src/battle`, `src/engine`, `src/app`, `src/audio` differs from main.
- One literal correction to the builder's note: `git diff 8e85c1e2 HEAD -- src/battle` is **not** empty (`overdrive.ts`, 4 lines,
  release 38's Swordplay change). Against `origin/main` it is empty, which is the comparison that matters.

## 2. No source, citation, "adapted", section sign or path in anything the player sees: PASS

- The guard test `guide-doc-words.test.ts` (55 tests) passes; so do 9 more guide files (215 tests together).
- Independent dump of every string in all 18 documents (1,185 strings, hash `8a085278...d01b3`) against a wider pattern than the
  guard's (adds `.md`, `http`, `gamefaqs`, `walkthrough`, `source(s)`, `sections?`, `pages?`): **0 hits**.
- The built bundle (bundle-only production build, 3.76 MB, `dist` in the scratch folder): `jegged` 0, `adapted from` 0, `our adaptation` 0,
  `walkthrough guide` 0. `§` and `research/` occur only in the game-data modules' `cite` / `citation` / `research` fields (existing
  provenance data that no guide code renders); that is why the guard is run against the mounted panel, not the bundle.
- The mounted panel in all 36 desktop runs and the 8 phone runs: text and every non-class attribute scanned with the same pattern:
  **0 hits**; no `.sgd__cite` element.

## 3. Separation from the advisor: PASS

`advisor-digest.mjs` (seeds 1 to 5, cap 700, every chapter; plays every chapter with the shipped strategy and hashes the advisor card,
the tactic and the legacy NEXT at every decision) on this branch and on `D:/pyrefly-rel38` (origin/main's src): overall
`cc10c48f8757f72d07c44a7986c06e4b69b3d9d42e53cef6757dd8cb77ae425d` on both, **90 of 90 per-run digests identical, 8,256 decisions, 0
errors**. `git diff origin/main HEAD -- src/engine/tactics src/battle src/engine` is empty. `guide-doc-separation.test.ts` passes
(29 tests: the guide imports no tactic or advisor, the advisor imports no document).

## 4. By real keys in headless Chromium (PYREFLY_BROWSER=gpu): PASS with the defects in section 6

Dev server on 7090, BATTLE HELP on, guide visible, seed 1, first command menu, real mouse wheel / `[` `]` `Home` `End` `G` keys and a real mouse click.
**All 18 chapters at 1600x900 and 2560x1440 (36 runs), plus 8 chapters at 390x844 by touch.** 36 desktop runs: **64,341 responses, 0 console
errors, 0 non-2xx**; phone: 0 errors.

| Check | Result |
|---|---|
| Opens on the boss on the field | 36 of 36: the first header in the sheet is the fight's: Seymour Flux, Yunalesca, Braska's Final Aeon, Seymour (Anima chapter), Evrae, Yojimbo, Seymour Natus, Seymour Omnis, Isaaru's Aeons, Left Fin, Overdrive Sin (the Head); Bahamut, Vegnagun (Tail), Hidden Passageway (Leblanc has no boss card), Shiva (Fallen Aeons), Paragon (Trema), Baralai, Ixion |
| Scrolling | one wheel notch moves the text **100.0 screen px at both sizes** (2.5x and 4x); `[` pages down, `]` up, `End` reaches `scrollTop` = max, `Home` the top, the column box unchanged afterwards (x, y, w, h within 1.5 px), no horizontal overflow. Yojimbo opens already at the foot (max 79 px): the wheel-down test cannot move there, and `[`, `Home`, `End` pass |
| Column against the turn rail, command list, HP panel, boss strip, banner, advisor card, intent slab, minigame slabs | **0 px2 in all 36** |
| Column against painted figures | 0 in **34 of 36**; the two are FFX-2 Chapter VI, section 6 problem 1 (2,573 px2 at 1600x900, 5,433 at 2560x1440, Yuna's box) |
| Column inside the window | yes in all 36 |
| Closes cleanly | `G` hides the sheet and leaves the chip in 36 of 36; `G` again reopens at the opening offset (within 2 px) after a scroll of 300 in 36 of 36; `G` and the chip reopen the same sheet. FFX: the battle's turn, log and menu are unchanged through every key and notch. FFX-2: the clock runs, so the log moves; what only the player could change is checked in `keys2.mjs`: in all 7 FFX-2 chapters 0 party actions started, the menu text and its awaiting state were identical, the screen unchanged |
| Keys leak into the battle | none (above); `[` `]` `Home` `End` `G` are not bound to any command |
| Phone 390x844, touch, 8 chapters (I, II, VIII, XVIII; IV, V, VI, XIII) | the chip opens a 367x410 sheet at (13,66) in a 370x410 column, on the boss; a real touch drag moves it 1:1 (235 to 470 to 705 to 470 in Ch I) to the foot and back; it stays clear of the turn rail (rail bottom 64, sheet top 66), the party HP cards (top 486, sheet bottom 476), the command area (610) and the GUIDE chip; a tap closes it; the battle's menu and screen are unchanged. By design the phone sheet is a reading overlay over the field and the enemy-move card; it is the same geometry as origin/main (`phone-battle.css` differs from main only by the removed `.sgd__more` rule). In Chapter VI it also covers the three-enemy boss strip (30,144 px2): same CSS on live main |

**FFX-2 ATB clock while reading (matches the handoff's "no hold was built, the sheet never changes the clock").** In `ffx2-bahamut`
(Wait split and Active) and `ffx2-vegnagun-shuyin`, over 14 s with the sheet open and the wheel running: the clock advanced
(`ticks` 15,827 to 43,524 in Bahamut under Active, turns 2 to 6; 12,403 to 35,932 in Vegnagun under Wait), actions played, and the
column's opacity stayed 1.00 in every sample (25 and 34 samples fell in an action; the column steps back only for an action over a
figure with no menu open). Alternating 2 s windows with the sheet idle, scrolling and closed (10 windows) gave overlapping,
state-dependent tick rates (744 to 3,052 per second in all three modes, 0 in the scripted Mega Flare countdown whichever mode):
the rate follows what the battle is playing, not the sheet. FFX (CTB): ticks stay 0 and the turn stays put in every mode for all 11
chapters. `git diff origin/main HEAD` touches no file in `src/app`, `src/engine`, `src/battle`.

## 5. Merge test against origin/main: PASS

- `git merge-tree --write-tree origin/main origin/r381-guide` is clean (tree 4be0ec66).
- The two files origin/main changed since the branch's merge (`docs/target/decisions.json`, `targets.json`) were put in the worktree
  for the run (files only, restored after); `npx tsc --noEmit` **clean (exit 0)**, `node tools/orphans.mjs` **24 orphans**, as main.
- Full suite, `--maxWorkers=2`, 808 files: **11,902 passed, 46 skipped, 1 todo, 1 failed.** The one failure is
  `strategy-ffx2-bahamut.test.ts` "heal-only route clears Mega Flare", a 15 s timeout; alone, in a quiet machine, it passes (12.2 s, 19 of
  19). It is a slow Bahamut engine simulation the branch does not touch, near the limit under load. The builder's 12 failures
  (including the separation test) are fixed or gone.

## 6. Defects (none is a regression introduced by the branch; smallest fixes)

1. **FFX-2 Chapter VI (Leblanc): the column's lower right corner covers the tip of Yuna's raised pistol** (box overlap 2,573 px2 at
   1600x900, 5,433 at 2560x1440; frame `ffx2-leblanc-1600x900-open.jpg`). Confirmed as the builder reports. Cause: the room under the
   three-enemy strip is under `MIN_PANEL_HEIGHT` 56 grid px, so the minimum wins. Smaller than on live main's rail (5,300 px2 at
   1600x900). **Smallest fix:** let the minimum give way to the room left in this chapter (about 44.8 grid px: six lines, still
   scrolling); a Bailey call, because it is shared layout. **Severity: minor.** Does not block 38.1.
2. **FFX, guide folded with `G`: the advisor's chip covers the folded GUIDE chip and takes the click.** Reproduced here and on origin/main
   (7091): Chapter XII (Omnis) and XIV (Isaaru): **0 of 9 points on the GUIDE chip reach it** (the click goes to `mad__toggle`) at
   1600x900, and XII at 2560x1440; Chapter I 6 of 9; II, VIII, XVIII 9 of 9 (the others were not probed). `G` always works. Identical on main and on the branch
   (`seymour-omnis-1600x900-closed.jpg` shows the two chips on top of each other). **Smallest fix:** in `advisorRoomy.ts`, when the
   guide is folded, stand the advisor's toggle clear of the GUIDE chip (the chip at (51,83) is 102x26), or move the GUIDE chip;
   the advisor's file, not the guide's. **Severity: minor** (keyboard path works; mouse path dead in 2 of 11 FFX chapters).
3. **Phone reopen keeps the player's place; desktop `G` reopens on the boss.** On the phone, close then tap again returns the sheet
   to where it was scrolled (746 in Ch I after a scroll to 981), while `G` on the desktop re-anchors to the boss. Not in the handoff's
   list; the phone is unchanged from before the merge. **Severity: cosmetic**, a Bailey call whether the two should match.
4. Integration note the builder gave (the `hud-floor.css` `.sgd` block of `r381-ui-floor` is written for the old panel; the sheet's type
   is 11.4 px at 1280x720): not tested here (that branch is not in this check) and the sheet's type size was not measured in this check.

## 7. Smallest fix list for a PASS-clean 38.1

None of the above blocks it. If Bailey wants all three closed: (1) one conditional in `StrategyGuide`'s fence code for Chapter VI,
(2) one offset in `advisorRoomy.ts`, (3) a decision. After either (1) or (2), repeat `desk.mjs` (36 runs, about 20 min).

## 8. Run record

`desk.mjs` (36 desktop runs, `desk-main.json`), `phone.mjs` + `swipe.mjs` (8 phone runs), `keys2.mjs`, `clock.mjs`, `fade.mjs`, `chip.mjs`
(branch against main), `dumpdocs.mjs`, `advisor-digest.mjs`, `full-suite.log`. A first pass of the desktop script flagged "keys touched
battle" and "close not clean" in the FFX-2 chapters; those were false positives of my own comparison (the ATB clock moves the turn and
log), replaced by `keys2.mjs`. The first phone swipe used a CDP scroll gesture that did not move the sheet; replaced by real touch events,
which do. Servers: 7090 (this branch) and 7091 (`D:/pyrefly-rel38`), both started here and stopped by PID. Nothing parked, nothing deleted.
