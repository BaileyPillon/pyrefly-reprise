# Paper preflight: the load diet (AGENTS.md rule 15; `critic-plan --paths` classes the change DEEP)

Lane `load-diet`, 2026-10-29. Both games, shared loading and figure-build plumbing. Evidence and numbers: `docs/handoff/load-diet.md`.

## What changes in the product

1. `PaintedActor.create(opts)` with `opts.streamCeilingMs` (only the battle stage sets it, from `StageFigureRequest.figureSpec`): the opening poses (`idle*`, `ready*`, and any pose that is the same file) are waited for as ever; the other poses at most 3 s, then the figure is built without the ones not yet landed and each installs when it lands (`PaintedActorPoses.installLate`).
2. The battle preload's phase 4 downloads in the order a fight draws the poses (`LoadDiet.poseNeed`), and its lookahead is an `<img>` per file (`preloadFetch.ts`) in place of a `fetch`.
3. `?loaddiet=off` is release 67 in all of it.

## What can go wrong, and what stands against it

| Risk | Why it is bounded | Check |
|---|---|---|
| The first menu opens before a move's painting has landed and the move draws the fallback painting | The chain is the engine's own (`POSE_FALLBACKS`: cast, attack, idle); the other poses start in need order, six at a time; only past a 3 s ceiling | ld8 by eye on the phone profile; LD15 and LD16 give the tail |
| A figure is KO'd before its `ko` painting lands | A figure staged already down is waited for whole (`figureStreamCeilingMs`); `ko` is need class 1 (the everyday moves, review m3); what remains is a KO in the first seconds on a very slow line, where the existing no-KO-painting path (`KoFallback`) lays the standing painting down | ld8; a unit test cannot see the picture |
| `installLate` resizes or restarts a figure mid-move | It sets the pose map and `pickReference`, and calls `resize` only when the reference changed or a painting was replaced (review m1: `resize` re-places the showing plane and zeroed its align, meet and lock); it never calls `setPose` or `showPoseSet` (so no life state restarts) | `load-diet-stream.test.ts` (6), `load-diet-review.test.ts` (the showing plane survives a landing); the frame job (ld7) |
| A late painting of a pose set that was replaced (a spherechange, a form change) overwrites the new outfit | `PoseClaims`: a late pose installs only while its own set still holds the name; the old set's queued loads stop (review M1) | `load-diet-review.test.ts` (3 tests on the real `PaintedActor`) |
| A figure disposed while poses are in flight leaks textures | `streamDead`: what lands afterwards is disposed, and the windowed loader stops starting new loads | `load-diet-stream.test.ts` ("disposed before the late poses land"), `load-diet-pose-stream.test.ts` ("a stop skips") |
| The parked-figure fingerprint (demo prebuild) changes | `opts.streamCeilingMs` is in `request.opts` and so in the fingerprint, equally when parking and when taking | `prebuild-figures.test.ts` and `prebuild-warm-order.test.ts` pass |
| The lookahead `<img>` does not share the decode's request | Then it is one extra request per file, as before (the fetch it replaces was the same); the memory cache is only the hope | LD13; round 30b's cache-off view as the fallback check |
| A rigged figure | `tryRigFigure` loads the rig before the figure exists and is untouched; the painting set under it takes the same ceiling | Chapter I (Seymour Flux's body) is the measured chapter |
| A fast line sees a difference | Inside the ceiling `loadStreamed` returns the whole set in the order it was asked for | `load-diet-pose-stream.test.ts` ("a complete set comes back whole"), LD8 and LD9 |

## What the focused review should run (a browser, the driver's)

The candidate's lean build served over the live art (`docs/handoff/load-diet.md` section 6), `?loaddiet=off` against the default: the budgets lane's first-command job on Chapters I (FFX) and IV (FFX-2) on the desktop and phone profiles, the frame job, and a look at the first attacks. CHK-016 (no 404 in the console), CHK-017 (identity and load), CHK-020 (both games), CHK-026 (the pose census) are the checks the planner names.

## Kill switch and rollback

`?loaddiet=off` on the address; in code, `LoadDiet.loadDiet()` returns false. Nothing is saved, so there is no save-data effect. Reverting the load-diet commits (`8b7f7223d`, `85ec6b45b`, `96aeba53e`, and the review fix pass after them) restores release 67 exactly.
