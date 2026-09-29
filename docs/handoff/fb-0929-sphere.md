# fb-0929-sphere: the Sphere Grid after a friend's playtest

**Branch** `fb-0929-sphere` (from `origin/main` 1c313c17), worktree `D:/pyrefly-r29-options`.
Not pushed, not merged, not deployed. **Game case: FFX only.** The Sphere Grid is FFX's
levelling board [research/visual-bible.md §5.4, research/ffx-combat-core.md §10]; FFX-2
has dresspheres and the Garment Grid, and its prep tabs (`src/ui/ffx2/party-prep/`) were
not touched.

## The words

Bailey, 2026-09-29 ~19:00 EDT, passing on a friend's playtest and agreeing with it:
"i don't get the sphere grid, feels buggy". (The friend most likely played on a desktop
browser, starting at Chapter I, Seymour Flux.)

## How it was reproduced

Live build https://baileypillon.github.io/pyrefly-reprise/ (release 31a), headless
Chromium on the GPU, played like a first-timer: title, Chapter I, party prep, the SPHERE
GRID tab, by mouse at 1600x900 and by taps at 390x844. The probe scripts are in
`docs/concepts/fb-0929/sphere/probes/` (they find a node's screen point from the canvas's
own draw calls, so every click lands where a player would click). The same scripts were
re-run against the fixed branch on a dev server.

What works on live: selecting, moving, activating a stat node (STR 31 → 33, the STATS tab
and the roster follow), opening a lock, zoom, pan, walk mode, switching characters, tapping
on the phone.

## Defects, proven cause, fix

Every one has a test in `tests/unit/sphere-grid-fb0929.test.ts` that failed before the fix
(12 of 12, `docs/screenshots/fb-0929/sphere/tests-before-fix.txt`) and passes after
(`tests-after-fix.txt`).

1. **A travelled step was priced "1/4 S.Lv" and took a whole S.Lv.** Live: hover MP +20
   next to Tidus, caption "Click moves here (1/4 S.Lv)", click twice, S.Lv 30 → 29.
   Cause: `SphereGridModel.moveCost` answered 0.25 for any travelled step, but `moveTo`
   charges 1 on the first of each four travelled steps and 0 on the next three. Fix:
   `moveCost` returns what the step really spends now; the caption says "1 S.Lv, covers 4
   travelled steps", then "no S.Lv: N travelled steps already paid".
2. **An opened lock still read as a closed lock.** After opening a Lv.2 lock the canvas
   still labelled it "Lv.2", the tooltip said "Blocks the path, Lv.2 Key Sphere, 1 held"
   and the caption "blocks the path until opened". Research: "A removed lock becomes an
   empty node" [ffx-combat-core §10.1]. Fix: `nodeLabel` / `nodeEffect` / `nodeCostLabel`
   take an `opened` flag, the canvas draws an opened lock as an empty node, the tooltip says
   "Opened ... Path only". The tooltip of an activated node also stopped pricing a sphere
   ("Activated" instead of "Ability Sphere — 4 held"), so it matches the caption.
3. **Leaving party prep and coming back closed every opened lock, and the key stayed
   spent.** Live: open the Lv.2 lock (Lv.2 keys 2 → 1), ESC BACK, re-enter Chapter I, the
   lock is closed again and opening it takes another key (1 → 0). Cause: opened locks,
   walked ground and paid travelled steps lived only in the `SphereGridModel`, which a new
   panel mount rebuilds; the build has no field for them. The same rebuild refilled an
   emptied pouch with the starter estimate. Fix: that state is kept per build object in a
   `WeakMap` inside `sphereGridModel.ts` (no shared contract changed), for the life of the
   page.
4. **HP and MP nodes skipped the base stat.** Live: HP +200 on Tidus (HP +10 % armour)
   gave max HP 2620 while the STATS tab's base stayed 2200; the rule every other reader uses
   is `baseHP * (100 + HP%) // 100` [ffx-combat-core §9, `effectivePool`], which gives 2640.
   Fix: pool nodes raise `stats.hp` / `stats.mp` and the maximum is recomputed with
   `effectivePool`; the battle then starts Tidus at 2640 / 2640 (run through to the battle
   and read from `battleState()`). Other stats now stop at 255 [§10.1 "Caps"]. The message
   says "max HP" / "STR" instead of "Hp" / "str".
5. **Walk mode let the cursor wander out of reach.** Live: Shift, then Right, Down: the
   cursor sits two links away on HP +200, the caption says "Move onto the node first", and
   Enter answers "Not linked to this node". Cause: arrows stepped from the cursor, not from
   the character. The view's own comment says hopping to a node you cannot reach "would
   make the keyboard lie about what Enter will do". Fix: arrows choose among the
   character's node and its linked nodes only.
6. **After a click the caption only said "Enter".** The documented contract
   (`docs/handoff/polish-sphere-grid.md`) is that a second click on the selected node does
   what Enter does; a mouse player was never told. Fix: "Enter or click moves here".

Refactor that came with it: the caption and tooltip wording moved into a new pure module,
`src/ui/ffx/party-prep/sphereGridCaption.ts`, so it can be tested without a canvas
(`SphereGridView.ts` went from 815 to 811 lines).

Evidence, before (live) / after (branch), 1600x900 JPEG in `docs/screenshots/fb-0929/sphere/`:
`01-*` the travelled-step price, `02-*` the lock after leaving and re-entering, `03-*` the
STATS tab after an HP node, `04-*` walk mode, `00-live-grid-open-1600.jpg` the tab as a
first-timer sees it, `05-live-phone-390-grid-tab-letterboxed.jpg` the phone.

## Not a defect: the options

The rest of "i don't get it" is confusion, listed with 10 points in
`docs/concepts/fb-0929/sphere/README.md`, with three end-state options as real-resolution
mockups (nothing built): **A** a first-time explainer card, **B** a bigger grid with the
legend in words, a node preview and the path drawn (with its own phone page), **C**
auto-learn with undo. Bailey picks (rules 9 and 10).

## Checks

- `npx tsc --noEmit` clean.
- `npx vitest run tests/unit/sphere-grid-fb0929.test.ts tests/unit/sphere-grid-model.test.ts
  tests/unit/ui-ffx-party-prep.test.ts tests/unit/ffx-effective-stats.test.ts
  tests/unit/party-prep-panels.test.ts tests/unit/party-prep-phone.test.ts
  tests/unit/party-prep-inkgold.test.ts tests/unit/party-prep-chapter-scroll.test.ts`: all pass.
- `node tools/orphans.mjs`: 24 orphaned, the same as main.
- The full suite was not run by this agent (the driver runs it before a push).

## Not done / open

- **The phone.** At 390x844 the Sphere Grid tab (like STATS, EQUIPMENT, ITEMS) is the
  desktop board letterboxed to 390 px: grid 204 x 55 CSS px, WALK 16 x 7 px. The stacked
  phone page (D-071) covers only the CHAPTER tab. Fixing it is a layout, so it is option B's
  phone picture, waiting for Bailey.
- **Adjacent activation, unsourced.** The tab only activates the node the character stands
  on. `standard-routes.json` was built on "activate every non-empty, non-lock adjacent node
  and the current node", and FFX may let a character activate nodes next to where they
  stand; `research/ffx-combat-core.md` §10 does not say. Not changed (rule 6). The Steam
  session approved in D-205 could settle it.
- **AP to the next S.Lv.** The header (and `src/battle/ffx/results.ts`) price the next level
  from the *unspent* S.Lv, so "AP 0 / 695" becomes "AP 0 / 584" after spending two. Whether
  FFX counts spent levels too is not in the research. Shared engine rule: not changed.
- **Nothing is saved.** Every party-prep change (grid, gear, items) is gone after a reload,
  by design today; saving it would be the save-data class (deep review before deploy).
- `SphereGridView.ts` is still over the 400-line house rule (811; it was 815 before).

## CHECK (independent, 2026-09-29, did not build it)

Verdict: **all six claimed fixes hold. No blockers.** Game case confirmed as FFX only
(research/ffx-combat-core.md §10.1: travelled steps "one S.Lv per four nodes", "a removed
lock becomes an empty node", other stats capped at 255; `src/ui/ffx2` untouched).

How: live https://baileypillon.github.io/pyrefly-reprise/ (release 31a) against a fresh
production build of 03160acc (`vite build`, served by `vite preview` on 8181, stopped
afterwards). I wrote my own probe (reusing only the canvas-coordinate helper in `probes/lib.mjs`)
and ran the same input on both builds: Chapter I, SPHERE GRID, mouse at 1600x900 and taps at
390x844. Logs and JPEGs are in `D:/Tools/pyrefly-scratch/fb-0929/sphere-check/`.

| # | Live (before) | Branch (after), same input |
|---|---|---|
| 1 | caption "moves here (1/4 S.Lv)", step took S.Lv 30 -> 29; the 2nd step was still priced 1/4 and took 0 | "1 S.Lv, covers 4 travelled steps", 30 -> 29; then "no S.Lv: 3 travelled steps already paid", 29 -> 29 (mouse and taps) |
| 2 | opened Lv.2 lock hovered: "blocks the path until opened" | "Opened Lv.2 Lock — now an empty node"; drawn as an empty node |
| 3 | after BACK and re-entry the lock was closed again, reopening cost a 2nd key (Lv.2 keys 2 -> 1 -> 0) | lock still open after re-entry, keys stay 1, the second press moves Tidus onto it (mouse and taps) |
| 4 | HP +200: base 2200, max 2620; battle Tidus 2620/2620 | base 2400, max 2640 = 2400 x 110 // 100; the battle's `battleState()` Tidus 2640/2640 |
| 5 | Shift + arrows: 9 of 9 cursor positions "Move onto the node first", Enter "Not linked to this node." | 0 of 9 out of reach; Enter "Tidus moves to HP +200. S.Lv 16." |
| 6 | "Enter moves here" | "Enter or click moves here" |

- Tests fail without the fix: the new test file run against the origin/main sources (with the new
  caption module copied in so it imports) gave 11 failed and 1 passed. The one that passed is the
  tooltip test of the new module itself. The failures are real assertions (quoted 0.25 vs 1,
  'Lv.2' vs '', 2200 vs 2400, 256 vs 255, the cursor on node 119...).
- `tsc --noEmit` is clean. Full suite, run once: 661 files passed; 2 engine benches timed out under
  load (strategy-ffx2-bahamut, sin-fins-core-bench). Neither touches this code, and both pass
  when re-run alone.
- `git merge-tree` of merge-base, HEAD and origin/main: no conflicts (origin/main == merge-base 1c313c17).
- Scope: only `src/ui/ffx/party-prep/*` changed, plus docs, tests and mockups. No option was
  built into the game. The visible changes (the opened-lock drawing, the caption wording, the
  walk cursor bound to the character's reach, the 255 stat cap) restore sourced or documented
  intent. None is a pacing or feel change.

Findings (none blocking):
- minor: the Tidus field card under the grid stays at "HP 2420/2420" after the HP node until
  the screen is re-entered, on live and on the branch alike. The battle and the STATS tab are
  right. It is an old number that does not update, and this track did not fix it.
- minor: on the phone the caption says "Enter or click" to a player who taps.
- minor: standing on an opened lock, the caption says "Already open." rather than an
  empty-node line.
- minor: the model gained a 255 cap on non-pool stats. It is sourced (§10.1) and noted under
  fix 4, but it is not one of the six defects listed.
- disclosed, carried: on the phone the grid tab is still the desktop layout, letterboxed
  (option B, waiting for Bailey).
