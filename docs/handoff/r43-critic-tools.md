# r43-critic-tools: the critic tooling faults deep round 25 named (PR-0397, PR-0433, PR-0450) and the Save Sphere wash

Date 2026-10-12. Branch `r43-critic-tools` off `origin/main` (5a4c92b1), worktree `D:/pyrefly-r43-critic`. Lane brief: fix the critic TOOLING faults round 25 names, touching `critic/` and its tests only,
no product file, unit tests with synthetic data, no browser. Source: `critic/rounds/round-25.json` (its evidence folder is in `D:/pyrefly-r39-int/critic/rounds/round-25/`, read only).
Game case (rule 14): **both** for the shared plumbing (the target rule, the instruments, the probe); **FFX only** for what fired PR-0397 (Chapter II) and the three chapters of PR-0433
(II, III, XVII; Chapter XIII's older entry is FFX-2); **FFX-2 only in effect** for the wash (only Chapter XI plays a Save Sphere card, `restoresPartyOnEntry`).

## What changed

| Item | Fault | Fix | Where |
|---|---|---|---|
| PR-0397 | `resolveTargetId` took the first id on screen that began with the name's slug, so "Yuna" (a party member, absent from `enemyIds`, never reaching the display-name step) resolved to `yunalesca` whenever the boss's reticle came first: 15, 11 and 8 Phoenix Downs at the boss in three lost Chapter II runs | the id equal to the slug wins before any prefix; two different ids that fit with no exact one is `null` (unresolved: `confirmTarget` records it and confirms what is lit, never a guess); an id that is empty or not text never matches; the round-25 scratch patch is folded in | `route-pure.mjs` |
| PR-0433 | the 15-minute budget ended three fights that were still progressing (Ch II turn 136, Ch III turn 120, Ch XVII link 2) | `LONG_FIGHT_BUDGET_MS` gains `yunalesca`, `braskas-final-aeon`, `sin-fins-core` at 3,000,000 ms (50 minutes; the issue's number); the dedicated continuity harness no longer overrides the table with its own 30 minutes (`continuityBudgetFor`: the longer of the two; round 25's Chapter III had 1,733 s of battle inside 1,800 s) | `route-pure.mjs`, `continuity.mjs`, `route.mjs` |
| PR-0450 (a) | `delivery.mjs` loaded twice and started its clock after `__pyreflyReady`: a warm second load | the chief's `coldload.mjs` is the library instrument: fresh browser, cache off over CDP before the navigation, one `goto`, clock started before it, ready = title answers its first key; the run records the navigation count and whether the cache was off and a run that broke either is named, not averaged; the host's CPU is sampled before each run; one `REPORT LINE:` | `coldload.mjs`, `coldload-pure.mjs` |
| PR-0450 (b) | `pause-matrix.mjs` swept 11 px, recorded no minimum, ran Chapter I only | the chief's `sweep14.mjs` is `sweep.mjs <battle\|phone\|prep\|matrix>`: 14 css px (`--floor`), the smallest text and the count under it on every surface, 18 chapters + 4 phone chapters + the prep tabs + CHK-002's six viewports; a surface it could not reach is UNVERIFIED with the reason; `gap-boot.mjs` is the promoted `gaplib.mjs#boot` | `sweep.mjs`, `legibility-pure.mjs`, `gap-boot.mjs` |
| PR-0450 (c) | gap captures that claimed a state they had not read | every sweep surface is claimed only if its snapshot read back the wanted state (`awaitingMenu`, `pause`); the route's `22-target-all` capture now says "N of M reticles lit" (read) with the card's words as a note | `sweep.mjs`, `route-fight.mjs` |
| PR-0450 (d) | the capture owner's inline `--continuity` probes disagreed with the dedicated harness on a loaded host (Ch I 41.8 percent / 48 px at 46 fps, no registration, against 12.1 percent / 0.8 px at 59.6 fps) | `route.mjs --continuity` stops before it opens a browser unless `continuity.mjs` started it (`CONT_DEDICATED=1`); `continuity.json` and each summary row say `dedicated` and the fps the chapter ran at, and the harness prints a `REPORT LINE:` (`reportLine` in `continuity-summary.json`) like the two new instruments | `route-pure.mjs` `inlineProbeRefusal`, `route.mjs`, `continuity.mjs` |
| wash | the probe copies the canvas; the Save Sphere's wash is an HTML veil in front of it; Anima's 960 px head step (967.7 px in round 25) happens under it; it is the run's headline worst jerk, but Chapter XI has 15 more jerks of 40 px or more in that run, so it did not decide the verdict alone | the probe records the wash element's opacity on every frame it is up (`w`, and the background alpha once in `meta.wash`) and every jerk whose step is under the wash carries it in `continuity.json`; the excuse (a jerk whose step, frame n-1 to n, is under a veil hiding at least `continuity.wash.minCover`, 0.7 of the picture, the veil tops out at 0.74, is tagged `covered`, left out of the summary, the verdict and the worst-jerk strips, kept in `continuity.json`, in `summary.motion.jerksCovered` and in a `note` on CHK-027) is built and tested but **ships OFF** (`excuse: false`) until Bailey's yes (see the section below) | `continuity-wash.mjs`, `continuity-probe.mjs`, `continuity-analyze.mjs`, `continuity-summary.mjs`, `continuity.mjs`, `policy.json` |

The deep workflow (`critic/runner/deep.js`) now tells the gap pass to run the two instruments with the subject and the evidence folder filled in (and never a script written for the round), tells the
prep-and-delivery auditor to ask for the cold-load evidence, and tells the capture owner not to pass `--continuity`. `critic/CHECKS.md` (CHK-002, CHK-003, the delivery check, CHK-027 item 8),
`critic/RUBRIC.md` (one sentence) and `critic/runner/lib/README.md` say the same. PR-0431 (the post-scene slot, 30-post-scene UNVERIFIED in 5 runs) and PR-0449 are NOT in this lane (see below).

## A decision that is Bailey's: the wash excuse ships OFF until his yes

**Correction, 2026-10-12 (the review of the r43-rc candidate; fixed on `r43-rc`).** This lane first shipped `continuity.wash.excuse` as `true`, because the lane brief asked for it. The brief was the driver's, not
Bailey's, and that was wrong: the definition of a jerk is Bailey's (D-420 to D-426); r41-aeonjump listed the excuse as an option "neither built (rule 10: ideas need a yes)"; and no yes of his is recorded (round 25
never mentions the card or FOC40-02, `DECISIONS.md` and `docs/target/decisions.json` have no wash row, and D-699's P5 yes covered the three r40 harness changes only). Earlier edits to what counts as a jerk each
cite his pick (the policy notes of `tracking` and `staged` say "Bailey 2026-10-10 (P5)" and "(P4, P5)"). So `critic/policy.json` now has `"excuse": false`: every jerk is counted as before, and each jerk whose
step was under the wash still carries it (`jerks[].wash`, the chapter's `wash` block with `jerksUnderWash`). The probe, the excuse code and its tests stay (the tests turn the switch on to hold what it does). A guard in
`tests/unit/critic-continuity-policy.test.ts` fails if a switch of this kind (`tracking`, `staged`, `wash`) is on without "Bailey <date>" in its policy note.

Two things this note said before were overstated. (1) The Anima step did not fail CHK-027 alone: it is the run's headline worst jerk (967.7 px) and the first worst-jerk strip, but round 25's dedicated Chapter XI run
has 16 jerks of 40 px or more, 15 without it (the next is 109.5 px), so the chapter fails with or without it (r41-aeonjump's own count on its candidate: 22 other jerks of 40 px or more, the worst outside the seams
137.8 px). The excuse moves the headline number and the strips, not the chapter's verdict. (2) "Covered" is not "invisible": r41-aeonjump measured that about 26 percent of the picture shows through the veil at
full opacity, so a dim mass can show behind the orb and card for a frame; nobody has seen the frame, and this lane ran no browser, so the wash read has never run against the real DOM.

**To put to Bailey (options, nothing built for them).** (A) Leave it off: every jerk counts, and Chapter XI keeps its 967.7 px headline. (B) Excuse at `minCover` 0.7, the wash essentially all the way up (95 percent
of its opacity; the veil hides 74 percent at full opacity): only a jump under the full veil is left out, and a jerk while it fades in or out, on the card's first frame, or with an alpha the probe could not read stays
counted. (C) Excuse at `minCover` 0.5: a jump under a half-faded veil is left out too. Before he picks, one live Chapter XI run with `CONT_CFG='{"wash":{"excuse":true}}'` shows the wash read (`meta.wash.alpha` should
come out 0.74, `w` should reach 1 for about two seconds per card, `continuity.json` `wash.spans` shows it) and what the switch would leave out. When he decides: set the value in `critic/policy.json`, quote his words and
time in that block's note, add the D-row. What the switch does NOT touch, on or off: swaps (snaps and double images under the wash are judged as before), camera cuts, the other jerks of the r41 note, or any other chapter.

## Proof, and what is not proven

- `node node_modules/typescript/bin/tsc --noEmit -p .` clean. 24 test files and 504 tests green (all 21 `tests/unit/critic-*.test.ts`, plus the engine and live-url tests that import the runner lib), and `vitest related` over every changed file: 23 files, 432 tests. A mutation check (16 small breaks, one at a time, each file put back and `git diff` empty afterwards: the exact-id rule, the first-match rule, a long fight left on 15 minutes, the inline-probe guard, the cover boundary, the step taking the more covered frame, covered jerks still getting strips or counted, a probe that reads no wash, a policy switch that does nothing, the clock started after the `goto`, the cache not switched off, the 11 px floor, a pause claimed unread, the route guard removed, the continuity budget) was caught by the test meant to catch it every time. The full `npm test` was NOT run: this lane touches no `src/` file, the suite is 917 files with multi-minute engine benches, and every test that imports a changed file was run; the main tree should run it before a merge, as AGENTS.md says. The new tests: `critic-route-r43` (PR-0397, PR-0433, the inline-probe stop),
  `critic-continuity-wash` (the policy block, the pure half, the probe on a fake page, `analyzeRun` end to end, the aggregate, and the DOM the probe reads pinned to `SaveSphereCard.ts` and its CSS),
  `critic-instruments-coldload` (the order of the calls on a fake page and a virtual clock: cache off and network shaped before the one `goto`, the clock started before it, the navigation count),
  `critic-instruments-legibility` (`collectText` run inside a jsdom window as `page.evaluate` runs it, the judging, the sweeps against a fake booted chapter), `critic-instruments-wiring` (the prompts
  and the documents reach the instruments).
- **Not run, because the lane allowed no browser:** (1) the acceptance runs PR-0397 and PR-0433 name: the stock route winning Chapter II on seed 1 with no Phoenix Down at the boss, and Ch II, III and XVII
  finishing without `--budget` (rerun Ch II at seeds 1 to 5); (2) a live run of `coldload.mjs` and `sweep.mjs` (they keep the chief's CDP and DOM calls; what is new around them is tested on fakes); (3) a
  live Chapter XI continuity run reading the wash (`meta.wash.alpha` should come out 0.74 and `w` should reach 1 for about two seconds per card; `continuity.json` `wash.spans` shows it). The first review that
  runs them should say so in its report if one misbehaves; the `REPORT LINE:` each instrument prints is the proof it ran.
- Not changed, on purpose: `src/**`, `tools/**`, `docs/target/**`, NOW.md and the ledgers (shared files; the driver records the lane).

## Left open

- **PR-0431** (round 24, polish, still open): `30-post-scene.png` is asserted at a slot where the scene has not started (it plays after the results Confirm), and the route cannot open a hidden chapter by its typed word.
  The typed-word entry exists now in `gap-boot.mjs` (`word`); the route's post-scene slot is untouched, since changing the flow without a browser run to check it was not worth the risk.
- **PR-0449** (low confidence, Ch V black pre-scene frame): harness or fade timing not ruled out; nothing here.
- The long-fight budget is a cap, not a promise: a host running eight browsers needed more than 50 minutes for Chapter II. The stall watchdog (`ROUTE_STALL_MS`, 120 s of no battle event, three recoveries) is what
  ends a fight that is not moving; a loaded host is the reason the next review runs the continuity harness alone.

## Files

New: `critic/runner/lib/{coldload,coldload-pure,sweep,legibility-pure,gap-boot,continuity-wash}.mjs` (+ `.d.mts`), `tests/unit/critic-{route-r43,continuity-wash,instruments-coldload,instruments-legibility,instruments-wiring}.test.ts`.
Changed: `critic/runner/lib/{route-pure,route,route-fight,continuity,continuity-probe,continuity-analyze,continuity-summary}.mjs` (+ `route-pure`, `continuity`, `continuity-probe`, `continuity-analyze`, `continuity-pure` `.d.mts`),
`critic/policy.json` (`continuity.wash`), `critic/runner/deep.js`, `critic/runner/lib/README.md`, `critic/CHECKS.md`, `critic/RUBRIC.md`.
