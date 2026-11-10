# Paper preflight (written after the build, at the review's request): the hidden Wendigo chapter's finishing lane (FFX only; branch `wendigo-finish`)

Under `critic/RUBRIC.md` §4 and AGENTS.md rule 15, in the short form of the earlier lanes' notes. **This one is late on purpose and says so:** `node tools/critic-plan.mjs --paths` classes the lane DEEP (`src/engine/BattlePresenterArrivals.ts`, `BattlePresenterEvents.ts` and `BattlePresenterPorts.ts`: "battle presenter and lifecycle is a shared system"), the lane's first build shipped without this note, and the review of 2026-11-09 (minor 9) asked for it. `docs/plans/ch-wendigo-review.md` is the chapter's own preflight; it predates `noteStatus`. Authority: Bailey 2026-11-09 ~12:35 EST "Keep going please with everything you were doing finish the wendigo chapter also"; 2026-11-06 "you can spend as much meshy credits as you see fit. use your own judgment."; 2026-10-31 "you make the executive decisions for the next few days. i'll go with all of your recommendations."

**Game case: FFX only** (rule 14). The fight, the aeons and the banks `m212`, `m213` and `s001` to `s004` are FFX's; FFX-2 has none of it. The one shared change is `ActorHandle.noteStatus?` (the presenter tells an actor the statuses it is given), which is "both" in kind (CHK-020), optional, and inert for every actor that does not implement it (only `PaintedActor` does, and nothing but the lake's skin reads it).

## What the change touches and what could break

| Touched | Who else reaches it | Why it cannot move another chapter |
|---|---|---|
| `BattlePresenterPorts.ts` (`ActorHandle.noteStatus?`, 2 lines), `BattlePresenterArrivals.ts` (`statusAdded` calls it), `BattlePresenterEvents.ts` (`status-remove` calls it, 1 line) | every battle of both games | both calls are optional-chained (`a?.noteStatus?.(...)`, `ctx.stage.actor(id)?.noteStatus?.(...)`): a figure without the method is skipped; `PaintedActor` keeps a private set that no other code reads (`hasStatus`); 3 tests pin it (`status-told`) |
| `PaintedActorEffects.ts` (the set, `hasStatus`) | every `PaintedActor` | one `Set<string>` add and delete; nothing reads it but the lake's skin |
| `data/ffx/lake-models.ts`, `engine/lake3d/**`, `scenes/wendigo-lake.ts` | the Wendigo chapter only (the lake is loaded by `import()` from its scene) | no other chapter's scene table names it; `orphans` finds none of its modules unreferenced |
| `tools/dist-filter.mjs`, `tools/deploy-pages.mjs` (comment-only), `tools/vite-lake-models.mjs`, `tools/lake-models*.mjs`, `tools/lake/lake-models.json` | the build and the deploy | the filter admits the 28 files by an allow-list and still rejects any other `models-exp` file (`lake-models-ship`, `vite-lake-models`, `lake-models-tool` pin it); no whole `vite build` was run (open issue 8 of the handoff) |

**The one failure the lane's own tests cannot show** is a real GPU frame, so the lane's pictures come from real-key runs of `tools/lake-finish-capture.mjs` (the lane's evidence is in its handoff, P5.9) and the review's own GPU runs under the machine-wide lock (the five-retry leak check flat, the summon and dismiss loop flat).

## Risks, and what answers each

1. **A hidden shared-plumbing regression** (the presenter's three files): answered by the 3 `status-told` tests, the unchanged `src/battle` tree (byte-identical to `bc93b1fdd`) and the full suite.
2. **Weight** (28 files, 164 MiB, 1.8 GB of GPU at the first menu): measured (`tools/lake-weight.mjs`), desktop only, nothing fetched for another chapter; the 2048 re-encode of the heroes and the monsters is recommended, not done (it needs Bailey's eye).
3. **A model that does not load** (a missing or unreadable file): the figures stand on the neutral capsule; an aeon keeps its painting (the fix pass of 2026-11-09, minor 5); both are tested.
4. **The stage and the engine disagreeing about a status** (Sleep): named, not hidden (handoff P5.8 item 10); it is the engine's own open reading, so the lane does not touch `src/battle`.
5. **A pick that moves a shot the lane was not about** (the Overdrive flight, the review's minor 3): fixed so only an aeon's flight scales (P29); the six heroes' flights are pinned equal to Tidus's.

## Verdict

PROCEED as built, with the fix pass; nothing is deployed from this lane (another copy of the driver owns the release pipeline). The deep review this class owes belongs to the build that carries it.
