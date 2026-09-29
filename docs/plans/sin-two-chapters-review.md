# Paper preflight: Sin as two chapters (FFX only)

This is the rule-15 preflight for `docs/plans/sin-two-chapters-plan.md`, written before anything in it
is built. **Game case: FFX only**, and the engine seams are FFX plumbing ("both" only in the CHK-020
sense of shared code, and inert outside the Sin formations).

## What `critic-plan` says

It was run on branch `chapter-sin` at `56026029` (the merge of origin/main), with `--paths` naming
every file the plan's packages S, F, G and P create or change:

```
node tools/critic-plan.mjs --paths "src/battle/ffx/ai/sin-fins.ts,src/battle/ffx/ai/sin-fins-rules.ts,
  src/battle/ffx/ai/sin-core.ts,src/battle/ffx/ai/sin-core-rules.ts,src/battle/ffx/ai/reactions.ts,
  src/battle/ffx/ai/index.ts,src/battle/ffx/setup.ts,src/battle/ffx/abilities.ts,
  src/battle/ffx/ai/evrae-rules.ts,src/data/ffx/enemies/sin-fins.ts,src/data/ffx/enemies/sin-fins-abilities.ts,
  src/data/ffx/enemies/sin-core.ts,src/data/ffx/enemies/sin-core-abilities.ts,src/data/ffx/index.ts,
  src/data/encounters.ts,src/data/chapters-unlisted.ts,src/data/chapter-sin-fins-core.ts,src/data/chapter-sin.ts,
  src/battle/common/types.ts,src/app/screens/BattleScreenSetup.ts,src/app/screens/BattleChainCheckpoint.ts,
  src/story/scripts/sin-fins-core.ts,src/story/scripts/sin-face.ts,src/story/registry.ts,
  src/data/chapter-meta-sin.ts,src/data/chapter-meta.ts,src/data/guides/sin-fins-core.ts,
  src/data/guides/sin-face.ts,src/data/guides/index.ts,src/engine/tactics/sin-fins-core.ts,
  src/engine/tactics/sin-face.ts,src/engine/tactics/index.ts,src/engine/tactics/lookup.ts,
  src/scenes/index.ts,src/ui/ffx/sinClock.ts,src/ui/ffx/FFXBattleHud.ts,
  src/app/screens/frontend/chapterPlates.ts,docs/audio/THEMES.md"

critic plan for 56026029 (previous build 6ea8528f)
  review:       DEEP
  before deploy: FOCUSED review of the production candidate
  after deploy:  live verification, then the DEEP review on the live build (this build owes it)
  obligations:  live + focused + deep
  because:      src/battle/ffx/ai/*: FFX CTB engine is a shared system
  because:      src/data/encounters.ts, src/data/chapter-meta.ts, src/scenes/index.ts: chapter registry or a new chapter
  because:      src/battle/common/types.ts: shared combat core
  because:      src/story/registry.ts: scene runner and transitions
  because:      src/data/chapters-unlisted.ts, chapter-*.ts, chapter-meta-sin.ts: unclassified product path
  systems:      FFX CTB engine; FFX HUD; FFX game data; chapter registry or a new chapter; cutscene scripts;
                move advisor and enemy intent; scene runner and transitions; shared combat core;
                strategy guide; title, chapter select, prep, pause and results screens
  checks:       CHK-002 CHK-003 CHK-004 CHK-005 CHK-006 CHK-007 CHK-008 CHK-009 CHK-010 CHK-011
                CHK-015 CHK-016 CHK-017 CHK-020 CHK-021 CHK-022 CHK-023
  targets:      chapters, fight, pause, phone, presentation, scenes  + audit every changed data value against research/
  files:        37 shipped, 1 with no product effect
```

Some file names in that list are earlier drafts of what the plan now calls them:

| Draft name | Plan name |
|---|---|
| `sin-core*.ts` | `sin-genais-core*.ts` |
| `chapter-sin.ts` | `chapter-sin-face.ts` |
| `sinClock.ts`, `FFXBattleHud.ts` | the HUD clock. It is **not** built tonight (mockups only, plan 3.2), and listed here so the class is known for when it is built |

`abilities.ts` and `evrae-rules.ts` were listed in case a hook had to land there. The plan now avoids
both: "Magic absorbed." uses the Core's own `immunityFlags`, and the Fins publish
`airship.countsTargetings`, which `markEvraeRuntime` already reads. The class does not change either
way. **DEEP**, because the FFX CTB engine, the chapter registry and the shared combat core are
touched.

**What that means for release** (AGENTS.md "Release"):

- It is not the save-data class. No save schema changes: the chapters are unlisted, and listing adds
  records, not fields.
- So the build ships through a **focused review before the deploy**, and the deep review follows on
  the live build.
- **Tonight nothing deploys.** The chapters stay unlisted, and the branch is not merged into main by
  a builder. That is the driver's call.

## The change, in one paragraph

- **Two chapters replace one.**
  - XVII (`sin-fins-core`) chains the Left Fin, the Right Fin, and Genais with the Core on one party
    state.
  - XVIII (`sin-face`, renamed from the branch-only `sin`) is the built link 4.
- **The FFX engine gains no new rule in `engine.ts`.** Every Sin behaviour enters through three new
  aggregators (`sin-setup.ts`, `sin-counters.ts`, `sin-scripts.ts`). Each one is swapped in for an
  existing line in `setup.ts`, `reactions.ts`, `simulate.ts` and `ai/index.ts`, so none of those
  files grows.
- **The one behavioural change to shared plumbing** is the FFX chain carrying statuses, and only
  where a formation sets `carriesPartyState`. Today no FFX formation sets it.

## What could go wrong, and the guard for each

| # | Failure | Where it would show | Guard (built into the plan) |
|---|---|---|---|
| 1 | A listed FFX chapter plays differently: Evrae's range hooks fire in a Fin fight, or the Fin hooks fire at Evrae | the event logs of Chapters I, II, III, VIII, IX, X, XII and XIV | Every hook returns early without its own flag (`airship.countsTargetings` naming a Fin, or the `sin.*` keys). **FFX golden hashes before and after** (`tests/unit/tools/ffx-chapter-hashes.test.ts`, 6 seeds × 4 policies, as the link-4 CHECK ran them: 408/408 identical). `evrae-engine.test.ts` stays green |
| 2 | The status carry leaks into Yunalesca's or Braska's chain | Chapters II and III | It is gated on `carriesPartyState === true`, set only by `sin-right-fin` and `sin-genais-core`. `sin-carry.test.ts` pins Chapter II's links carrying no statuses |
| 3 | Genais is left standing and the battle never ends, or ends and pays Genais's rewards | link 3 | `sin.core.down` → `markSinRuntime` marks Genais a non-combatant, as Cid is marked. `results.ts` pays defeated enemies only (`isAlive` check, line 30). Package G tests both |
| 4 | A preview (the advisor, the intent line) rebuilds the runtime and loses the Sin marks. This is the Evrae lesson: Wakka's reach was lost in previews | the advisor card, the stalemate guard | `markAirshipRuntime` in `simulate.ts` calls `markEvraeRuntime` and then `markSinRuntime`, both read from `state.flags` alone. A test runs a preview after Genais dies and after the Core dies |
| 5 | The Core's "immune to magic while Genais lives" survives Genais's death, or a Reflect bounce hits the Core | link 3 | The flag is removed on Genais's KO, tested. The Core is Reflect-immune (§2.3), and its own counters bounce off a Reflected party back to it, which is faithful (§5.2.3); tested |
| 6 | Negation strips a status it must not (Auto-Life, Doom, Death), or never strips the party at FAR | links 1 to 3 | The removal list is copied from §3.1 into data. Package F's 400-action test checks it both ways |
| 7 | Gravija kills | links 1 to 3 | `percent-current` floors (§3.1 `[derived]`). The 1-HP pin |
| 8 | A contract file grows past 400 lines, or changes shape silently | `encounters.ts` (399), `types.ts` | Edits go on existing lines only. One `docs/CONTRACT-CHANGES.md` entry: the id rename (branch-only), `\| 18`, and the carry doc |
| 9 | The rename breaks something that names `sin` | cites, tests, the handoff | Package S renames in one commit. `tsc` and `grep -rn "'sin'" src tests learn` come back empty except for comments |
| 10 | Numbers drift from the research | data | Package S's stat table test reads the plan's table, which is research §2.1 to §3.3. CHECK audits every value against `research/ffx-sin.md` (the critic target "audit every changed data value") |
| 11 | Something perceivable appears without a pick | chapter select, the jukebox, the HUD | Nothing is listed. `CHAPTER_IDS` has neither id, tested. The HUD clock and readouts are mockups only. Scenes and art are placeholders, labelled in the code |
| 12 | Parallel packages collide | `chapter-sin` merges | Disjoint ownership (plan 7). Package S fixes every signature and flag name first. Only the driver merges |

## Checks that close it

- **Per package:**
  - `npx tsc --noEmit` (the untracked `tests/unit/zz-scratch/**` probes are filtered: CHECK finding 4);
  - the package's own tests;
  - the FFX golden hashes;
  - `node tools/orphans.mjs`, with no new orphan;
  - the full suite once per agent.
- **Then package B's bench,** then an independent CHECK that runs the engine (rule 3):
  - the clock, the carry, the three links;
  - unlisted on the board, in headless GPU Chromium on its own port, stopped afterwards.
- **A deep-class build is a deploy obligation:** focused before, deep after. It only arises when the
  branch reaches main. Tonight it does not.
