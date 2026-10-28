# Split lane, after the adversarial review (ChatGPT's point 8b; both games, shared plumbing; 2026-10-28)

Branch `split` (from `origin/r67-picks`, e2a84fbd3). Bailey, 2026-10-28: "work on all those" (the continuity fix, ChatGPT's critique, motion fluidity); program `D:/Tools/pyrefly-scratch/2026-10-28/PROGRAM-1028.md`.
**Game case: both games (FFX chapters 1 to 3, FFX-2 chapters 4 and 5, and the new ones), shared plumbing. Nothing a player can see or feel changes: the five oversized files were cut by a pure move.** The map of where every member went, the method and the rules for editing the chains are in [split-presenter.md](split-presenter.md) (written by the first pass of this lane); this note is the second pass, after an independent review, and the hand-over to the driver.

Nothing is deployed. The branch is pushed; the driver merges it.

## 1. State

| | |
|---|---|
| Base | `e2a84fbd3` = `origin/r67-picks` (still that on the remote at 15:23 EDT) |
| First-pass tip, reviewed | `13677c8bd` (8 commits, `4ffd43324` to `13677c8bd`; the review counted 9 with the base) |
| This pass | one commit on top of it (`git log origin/split -1`): the fixes below, no change to any file under `src/` |
| The five files | `PaintedActor.ts` 2712 -> 308, `BattleScreen.ts` 1085 -> 232, `BattlePresenter.ts` 810 -> 179, `BattleMoments.ts` 706 -> 97, `BattleScreenFlow.ts` 649 -> 326 lines, plus 29 new files, none over 368 |

## 2. The review (kept here because its folder was removed from the scratch drive at about 15:48 EDT, before this pass could point at it)

Reviewer: a sub-agent of the release driver, adversarial, read-only on this tree; no browser, no dev server. **Verdict: no behaviour change found (pure move confirmed). 0 critical, 0 major in the code; 2 majors in how the work is handed over; 5 minors.**

What it proved, and how:
- **Token for token.** Every class member and top-level statement of the five old files is in the new files exactly once, with identical tokens (parsed with oxc, comments cut, whitespace collapsed, a leading `private`/`protected` ignored). None dropped, none duplicated, none added. The one differing line is `PaintedActor.poseLife`, which names `PaintedActorPoses.prototype.setPose` where it named `PaintedActor.prototype.setPose`: the same function object, because `setPose` is defined once in the chain and nothing patches the prototype. The comparison tool was itself mutation-tested with 7 planted edits (an off-by-one, `<` to `<=`, `!==` to `===`, a key, a constant, a method defined twice, two fields swapped): all 7 reported.
- **Constructor and field hazards** (target ES2022 defines a later layer's fields only after an earlier layer's constructor ran): no constructor reads a later layer's field, directly or through the methods it calls; no field is declared in two layers; no get/set pair is split; the three initialisers that read `this.x` run later inside closures and read base fields; the two `Math.random()` draws and the `new Group()` stay in the same relative order. An actor's own-property order differs (State fields first); nothing enumerates these objects.
- **Imports and load order.** No import falls back to a global; the same 3 import cycles as before, none touching the split files; no chain file imports a layer at or above itself; the three new presenter files import no `three` and no DOM (rule 1). Module evaluation order shifts for 182 modules but only 12 modules with import-time effects move relative to each other, and all 12 are data builders, one `Float64Array`, one local state object and one debug-hook registration; none is order-dependent.
- **Callers unchanged.** In `src/` only the five files and their 29 siblings changed; `RigActor extends PaintedActor` and `AttractBattle extends BattleScreen` compile unchanged.
- **tsc** clean at the tip and at each of the 9 commits (bisectable); `node tools/orphans.mjs` the same 24 before and after; every new file under 400 lines with `.ts` imports; `critic-plan` classes the new files DEEP, as the old ones, and the continuity harness id (`9cc8f27cd66e`, 35 files) is the same in base and tip.
- **Full suite**, its own run on the tip: 1,719 files, 26,797 tests, 26,680 passed, 4 failed (they need a git repository, which its mirror lacked; they pass in the real tree: 4 files, 94 tests), 112 skipped, 1 todo, **the status of every one of the 26,797 tests identical to the base's**.
- **Cost of the 9-deep prototype chain** on the actor's per-frame path: new/old 1.07, 1.09, 1.11 (about +0.15 to +0.2 microseconds per actor-frame, 1.6 microseconds a frame for eight actors against a 16.7 ms frame). Real, systematic, negligible; the continuity harness does not measure CPU, so a first frame-time dip after the merge should not be blamed on a mystery.

The findings and what became of each:

| Finding | What it said | What was done |
|---|---|---|
| M-1 (major, job spec) | The control tree the job spec names no longer exists, so `base-ch1` / `base-ch4` could not start. | It was gone **again** by the time this pass began (the reviewer's rebuilt copy was removed at about 15:48). Fixed for good by a tool: `node tools/mirror-tree.mjs make <rev> <dir>` builds the tree from `git archive` and links node_modules and the art as junctions (37 s here); `unlink` removes only the junctions. The job spec starts with that step instead of a path. Tested: built e2a84fbd3, the files match the commit modulo line endings, unlinked, the link targets (node_modules, the art folder, `public/fx`) untouched. |
| M-2 (major, merge) | Merging `split` with `origin/pc-scope` conflicts in `PaintedActor.ts`. | Confirmed (section 5). The two hunks to re-apply, written and tested here. |
| m-1 | `tests/unit/results-music.test.ts` forbids a victory/defeat `playMusic` in `BattlePresenter.ts`, now 22 percent of the presenter. | Fixed: the guard reads the three new presenter files too. `grep` of the other text readers of the five files found no second guard that shrank. |
| m-2 | The first `BattleScreen` commit leaves the file at 626 lines; the BattleMoments commit cites `tools/verify-move`, which was only in the lane's scratch folder. | The second half is fixed by adding `tools/verify-move.mjs` (a line-multiset first look at a move; the member-by-member proof was the review's). The 626 lines are history (the next commit takes it to 232) and cannot change without rewriting commits. |
| m-3 | The chain costs 7 to 11 percent of the actor's per-frame update. | Noted above; no action. |
| m-4 | `git status` showed `src/engine/PaintedActor.ts` modified with no content change. | The working copy was LF where the tree is CRLF (`core.autocrlf=true`; the blob hash was identical, `git diff` empty). Rewritten with CRLF line endings; `git status` is clean for it. |
| m-5 | Observed, not defects: property order, module order; no production build and no browser behaviour was observed. | The two continuity jobs remain the only live proof (section 4). |

## 3. What this pass changed

- `tests/unit/results-music.test.ts`: the "chain and presenter never ask for a victory/defeat cue" loop reads `BattlePresenterBase.ts`, `BattlePresenterPlayback.ts` and `BattlePresenterCommands.ts` as well. (22 tests pass.)
- `tools/verify-move.mjs` (new): `node tools/verify-move.mjs <rev> <orig,...> <new,...>` prints the code lines the original had that the new files lack, and the reverse. For a pure move the first list is only moved headers (imports, the class line) and the second only imports, doc headers, class lines and visibility words.
- `tools/mirror-tree.mjs` (new): the control-tree builder described under M-1.
- This note.
- No file under `src/` changed; `git diff 13677c8bd -- src` is empty.

## 4. The job specs (the browser is the driver's after 19:45 EDT; nothing here was run)

`D:/Tools/pyrefly-scratch/2026-10-28/split/jobs/` holds `SPEC.md`, `queue-split.json` (four jobs, each with its prediction written before any measurement), `run-queue.mjs` (`--dry` prints the commands) and `check-prediction.mjs`. Step 0 of the spec builds the control tree with `tools/mirror-tree.mjs`. Four jobs, 9 lock-minutes each (36 in all): `base-ch1`, `base-ch4` (controls, no band), `split-ch1`, `split-ch4`.

Prediction, written now: each `split-*` run is **identical to its control within run noise**: `snaps` exactly 0; ghost frames a minute within 30 percent of the control; swap jerks over the fail line not more than the control plus 2; swaps, planned cuts and head and feet tolerance the same order of size. The reviewer's independent prediction agrees. A MISS stops the queue (rule 15); repeat the control once on a quiet machine before blaming the split. The control tree has no `.git`, so the page's build sha reads `unknown` and CHK-026 reads UNVERIFIED for the two `base-*` runs; the motion numbers are still written.

## 5. Merging with `pc-scope` (the order matters)

`git merge-tree --write-tree origin/pc-scope origin/split` (run here, in memory, nothing touched): **the only conflict is `src/engine/PaintedActor.ts`**; every other file of `pc-scope` merges by itself. `pc-scope` edits the old `PaintedActor.ts` in two places (7 lines); in the split they live in two different files. **Merge `split` first, then re-apply these two hunks by hand** (the file names are the split's; line numbers are those of the tip):

```diff
--- a/src/engine/PaintedActorPoses.ts   (makeSmear, about line 298)
-      planes: this.slots,
-      cells: this.u,
-      blend: this.blend,
+      planes: this.slots, cells: this.u, blend: this.blend,
       ...
       flashBlocked: () => this.softFlash?.() === true || this.flashTween !== null,
+      shiftPlane: (i, dx) => { const s = this.slots[i]!; s.align = dx; this.placeSlot(s); }, // MF-18 (`motion/CutAnchor.ts`): a big cut's incoming plane eases home from the old head
     });

--- a/src/engine/PaintedActor.ts   (update, line 109)
-    this.smear.step(); // the smear window's amount, from the blend's progress
+    this.smear.step(realDt * 1000 * (curvesOn() ? paceRate('action') : 1)); // the smear window's amount, from the blend's progress; the cut-side anchor's glide runs on the blend's own clock, so it is cut and glide together at any pace (MF-18)
```

(The first hunk's three-lines-to-one change is only formatting; keep it so the merged file equals what `pc-scope` wrote.) `curvesOn` and `paceRate` are already imported by the leaf. The same hunks as a patch: `D:/Tools/pyrefly-scratch/2026-10-28/split/merge-check/pc-scope-reapply.patch` (`git apply --ignore-whitespace` in a CRLF tree, since the working copies are CRLF and the patch is LF).

**Tried here, in a scratch copy of the merged tree** (the in-memory merge result, the split's `PaintedActor.ts` put back, the patch applied; since removed): `tsc --noEmit` clean over 2,216 source files; `pc-scope`'s six test files (`pc-scope-cut-anchor`, `-cut-anchor-director`, `-swap-scope`, the two `engine/pc-scope-*-actor` files and `critic-continuity-glide`) pass, 72 tests. **Control: without the two hunks, 5 of the 8 `pc-scope-cut-anchor-actor` tests fail**, so those tests do exercise the lines the patch restores. The other order (merge `pc-scope` first, then re-run the split) is possible but means re-running the five split scripts; not recommended.

No other branch I can see touches the five files since e2a84fbd3 (`pc-residues`, `ui-input`, `budgets`, `saves-portable`, `r67-picks`); uncommitted work in other worktrees is invisible from here.

## 6. Still open

1. **The four continuity jobs** (section 4) are the only proof of "no change on screen". Everything else (token-level equality, hazard scans, the identical status of 26,797 tests) says the prediction will hold.
2. **Merge order** (section 5) before `pc-scope` lands.
3. **Deep review.** `critic-plan` classes every file of the five chains DEEP, so a deploy carrying this code owes the deep review as any change to these files does (at most two deploys may go out while one is owed). The paper preflight rule 15 asks for a deep-classed change was not written: a pure move, with the differential test (old and new actor through the same 18-step script, in the lane's scratch folder, not committed) and the review standing in for it.
4. **Not done, by design:** `src/ui/` and `ui-input` are the other reviewer's; no production build was made (it derives every painting; no heavy job today).

## 7. Lines for the driver's CHANGELOG (plain words, not written into `CHANGELOG.md`)

- Both games, every chapter, nothing you can see or feel: five of the biggest source files (the painted figure, the battle screen, the battle presenter, the moment director and the screen flow) were cut into short files of one job each, with no change to what they do. It makes the next change to any of them smaller to read and to review (ChatGPT's point 8b).
- Both games: the guard that keeps a victory or defeat tune out of the battle presenter now reads all four files the presenter is made of.

## 8. Proof of this pass

- `npx tsc --noEmit` clean (the tree's own `node_modules`, TypeScript 7).
- Full unit suite on this tree, `--maxWorkers=3`: 1,719 files, 26,797 tests, **26,684 passed, 0 failed**, 112 skipped, 1 todo (the same 26,797 and 112 and 1 as the base; the four tests that need a git repository pass here, which is why 26,684 and not 26,680), 1,963 s. The report: `D:/Tools/pyrefly-scratch/2026-10-28/split/after3.json`.
- `node tools/verify-move.mjs e2a84fbd3 src/engine/BattlePresenter.ts <the four presenter files>` lists only imports and the class line as moved.
- `git ls-files --eol src/engine/PaintedActor.ts` reads `i/lf w/crlf`, like the other files; `git status --short` no longer lists it.
