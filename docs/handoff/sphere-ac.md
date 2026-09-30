# sphere-ac: Sphere Grid A (first-time explainer) + C (auto-learn with undo)

**Branch** `sphere-ac` (from `origin/main` 888a7578), worktree `D:/pyrefly-r29-options`.
Not pushed, not merged, not deployed. **Game case: FFX only.** The Sphere Grid is FFX's
levelling board [research/visual-bible.md §5.4, research/ffx-combat-core.md §10]; FFX-2
has the Garment Grid, and `src/ui/ffx2/` was not touched.

**Decision:** D-290, Bailey 2026-09-29 ~21:00 EDT, "I'll go with all of your
recommendations please" (recommendation 4). Targets:
`docs/concepts/fb-0929/sphere/option-a-explainer.jpg` and `option-c-autolearn.jpg`.
Option B (the phone page) is D-295, to be built later on top of this branch.
Preflight (rule 15): `docs/plans/sphere-ac-review.md`.

## What was built

- **A. The explainer card.** The first time the SPHERE GRID tab opens, an ivory card over
  the dimmed prep screen: MOVE, ACTIVATE, CLICK TWICE and "It is not saved: reloading the
  page starts the chapter's preset again", with GOT IT and SHOW ME ON THE GRID. The copy
  is the target's word for word, with the selected character's name. A `?` button in the
  grid header reopens it. "Seen" goes through the existing coaching list
  (`coachState.markSeen`, the save's `seenCoach`) as id `sphere-grid-card`: no new save
  field, no migration. Like every coaching surface it is suppressed by `?coach=off` and by
  BATTLE HELP OFF. It is not in `ALL_COACH_IDS`, so the veteran rule does not pre-mark it
  and a veteran (Bailey included) sees it once. While it is open it takes every key (Enter
  = the chosen button, Left/Right choose, Esc = GOT IT); nothing reaches the shell.
- **C. AUTO-LEARN.** A header button walks the selected character and activates what the
  pouch can pay for, then a result card shows the nodes, S.Lv before and after, the stat
  deltas and the spheres spent, with UNDO and KEEP. The nodes it activated get a gold ring
  on the grid, one `NEW` tag, and a `+N MORE ABOVE/BELOW` tag for those out of view.
  - Rules: the planner only *chooses*; every step and activation is
    `SphereGridModel.moveTo` / `activate` (the six fb-0929 fixes included). It activates
    only the node the character stands on (next-door activation is unsourced, as the tab
    does today), never opens a lock or spends a key (keys are shared and an opened lock is
    open for everyone), walks only through open ground, skips a stat already at the 255
    cap, and takes the cheapest node first (S.Lv, then steps, then node id).
  - **Four nodes a press.** The approved picture shows one press as "4 nodes along his own
    path" (Tidus, Chapter I: S.Lv 30 → 23, STR 31 → 35, AGI 30 → 34, max HP 2420 → 2640,
    3 Power and 1 Speed Sphere). The planner reproduces those figures exactly with a batch
    of four; pressing again does four more. The batch size is our choice, not a game rule
    (question for Bailey below).
  - UNDO restores the build and the model exactly (stats, HP/MP, abilities, S.Lv,
    position, activated and walked nodes, paid travelled steps, the pouch, the page-long
    walk record a later visit reads). Any other grid action, switching character, a second
    AUTO-LEARN or leaving the tab settles an open result as KEPT, so UNDO can never roll
    back a change made elsewhere.
- **Phone (390x844).** The tab's phone layout is unchanged (still the letterboxed board).
  The cards mount on the unscaled `.prep` layer at readable sizes (nothing under 14 CSS px)
  with 44 px buttons; a dock under the board carries AUTO-LEARN (294x44) and `?` (52x44),
  shown only while this tab is open.

Files: `src/ui/ffx/party-prep/sphereGridAutoLearn.ts` (planner, snapshot, restore),
`sphereGridHelp.ts` (placement, input, wiring), `sphereGridHelpCards.ts` (markup),
`sphere-grid-help.css` + `sphere-grid-help-phone.css`, `sphereGridDraw.ts` (the lock plate
and legend strip moved out of `SphereGridView.ts`, which shrank 811 → 753, plus the
highlight drawing), `SphereGridPanel.ts` (two header buttons and the wiring, 343 → 367),
`sphereGridModel.ts` (one accessor, `walkRecord`, 392 → 397).

## Evidence (run, not grepped)

Dev server on 8460 (stopped), headless Chromium on the GPU, Chapter I.

- Target vs build: `docs/concepts/fb-0929/sphere/final/a-target-vs-build.jpg`,
  `c-target-vs-build.jpg`; phone: `final/phone-build.jpg`. Screenshots in
  `docs/screenshots/picks-0929/sphere-ac/`.
- Desktop 1600x900 by mouse and keys: card on first open (card box 500,150 1019x560, the
  target's 560,150 900x560 plus the skew); Left/Right and Enter under the card did not
  change tab or start the battle; `seenCoach` became `["briefing","sphere-grid-card"]`;
  `?` reopened it; SHOW ME closed it and recentred. AUTO-LEARN on Tidus: S.Lv 30 → 23,
  STR 31 → 35, AGI 30 → 34, max HP 2420 → 2640, pouch Power 12 → 9 and Speed 8 → 7; the
  result card at 597,452 879x138 (target 612,452 850x138); the roster and header followed
  (S.LV 23). UNDO: the probe's whole member and pouch record equal to before. KEEP kept
  it. Leaving for STATS settled a pending result as kept. Left + Enter on a result pressed
  UNDO (S.Lv 9 → 16) and the battle did not start. After a reload the card stayed away.
- Phone 390x844 by taps: every new button is 44 px tall or more; no text in the card under
  14 px; AUTO-LEARN by tap 30 → 23; UNDO by tap restored exactly; KEEP; `?` reopened the
  card; the dock is hidden on the CHAPTER tab.
- Into the battle (with `?coach=off`, which also hid the card): after AUTO-LEARN + KEEP the
  battle's `battleState()` has Tidus at 2640/2640, STR 35, AGI 34.
- Performance: one AUTO-LEARN press settles well inside the probe's 700 ms wait (the
  planner is a Dijkstra over ~870 nodes x 4 paid-step states per node chosen; the unit
  tests of a full run of 14 nodes take a few ms).

## Checks

- `npx tsc --noEmit` clean.
- New tests: `tests/unit/sphere-grid-autolearn.test.ts` (the target's figures; auto-learn
  equals the same steps by hand; undo restores the exact state, also after a part-paid
  travelled walk and for a later visit; never opens a lock or spends a key; nothing to pay
  for changes nothing; deterministic) and `tests/unit/sphere-grid-help.test.ts` (card once,
  seen, `?`, suppressed by coaching off, modal keys; UNDO / KEEP / leaving the tab).
- Full suite, once: 675 files passed, 1 failed: `strategy-ffx2-bahamut` timed out at 15 s
  under load (FFX-2 engine bench, untouched here); it passes alone (19/19).
- `node tools/orphans.mjs`: 24 orphaned, the same as main.

## Not done / open

- The Tidus field card under the grid still reads HP 2420/2420 after an HP node until the
  screen is re-entered (known since fb-0929, not this track).
- AUTO-LEARN and `?` have no key or pad button of their own (the target shows none);
  on a desktop they are mouse buttons, on the phone the dock.
- On the phone the card is taller than the screen (about 1030 px); its layer scrolls and
  GOT IT is at the bottom.
- The card says "Click" on a phone too (the target's copy).
- `SphereGridView.ts` is still over 400 lines (753).

## CHECK (independent, 2026-09-30, not the builder)

Fresh production build of `sphere-ac` @ 72995121 (`vite build` into scratch, served by
`vite preview` on 8480, stopped by PID afterwards), headless GPU Chromium, probes in
`D:/Tools/pyrefly-scratch/picks-0929/sphere-check/` (`desk.mjs`, `phone.mjs`, `esc.mjs`).
Game case: FFX only (confirmed: only `src/ui/ffx/party-prep/` changed; no `src/battle`,
`src/engine`, `src/data`, `src/app` file in the diff).

- **Target vs build.** A: card at 500,150 1019x560, copy word for word with the target,
  same three panels, buttons and footnote. C: result card 597,452 879x138 with the target's
  exact figures (4 nodes, STR 31 → 35, AGI 30 → 34, MAX HP 2420 → 2640, 7 S.Lv 30 → 23,
  3 Power + 1 Speed), NEW tag and "+N MORE" tag, UNDO / KEEP. Differences, all explained:
  the header carries the extra `?` (option A's reopen button), the AP readout drops with
  S.Lv (older open question), the grid view differs because the camera recentres on the
  real result.
- **Desktop 1600x900, mouse + keys.** Card on first open; a mouse click on the STATS tab
  through the dim layer does nothing; Up/Down/Q/M/PageUp/PageDown/Tab under the card leave
  the tab and screen alone; Esc = GOT IT and stays on party prep (E = START also presses
  the chosen button, as designed). `seenCoach` gains `sphere-grid-card` only. AUTO-LEARN
  press → result in 12 ms. UNDO: the whole chapter `buildRef` JSON equals the pre-press
  JSON (stricter than the builder's member check). Switching character settles as KEEP;
  Esc on a result = KEEP; leaving for STATS = KEEP and hides the dock; Left+Enter on a result
  = UNDO without starting the battle. Repeated presses on Yuna ran out after 4 presses with
  the caption message; key spheres unchanged (4/2/1/1), no stat above 255. `?` reopens,
  SHOW ME closes. With `data-reduce-motion` + `data-low-effects` the card has 0 running
  animations (the new UI has none). Enter with nothing open still starts the chapter.
  After a reload the card stays away.
- **Battle.** `?coach=off` hides the card; after AUTO-LEARN + KEEP the battle's
  `battleState()` has Tidus 2640/2640, STR 35, AGI 34.
- **Phone 390x844, taps.** Card 358 wide, no text under 14 px, GOT IT 102x44, SHOW ME
  264x44; dock AUTO-LEARN 294x44 and `?` 52x44; UNDO / KEEP 154x44; no horizontal page
  scroll; the tab's own layout unchanged (grid 204x55, WALK 16x7, as fb-0929 measured);
  tap UNDO restores the full `buildRef`; dock hidden on STATS and CHAPTER.
- **Console:** 0 errors (one pre-existing art warning about seymour-flux-body).
- **Checks:** `npx tsc --noEmit` clean; sphere tests 8 files / 95 tests pass; full suite
  once: 675 passed, 1 failed = `strategy-ffx2-bahamut` timeout under load (FFX-2, not
  touched), passes alone 19/19; orphans 24 (same as main); `git merge-tree` against
  origin/main 888a7578 clean; new files under 400 lines, `SphereGridView.ts` shrank
  811 → 753, the model 392 → 397.

**Verdict: no blocker.** Minor, disclosed: the Tidus field card keeps HP 2420 until
re-entry (pre-existing); the phone card is ~1030 px tall and scrolls; the card says
"Click" on a phone; the batch of four per press is our choice (question for Bailey);
AUTO-LEARN and `?` have no key/pad binding (the target shows none).
