# Paper preflight: Biran and Yenke, a new hidden FFX chapter (branch `claude/vigilant-galileo-h6yf7j`)

Paper preflight under `critic/RUBRIC.md` §4 (AGENTS.md rule 15). `node tools/critic-plan.mjs --paths ...` classes this work **DEEP** (the FFX CTB engine: `battle/ffx/setup.ts`, `scripted.ts`, the AI table and its hooks; the chapter registry `encounters.ts`; the battle presenter's departures table). **Written after the build, not before it**: the session built the chapter first and wrote this file at the end, which is the wrong order under rule 15; it is kept short and honest about that, and the reviews it plans are still owed.

**Authority:** Bailey, 2026-10-15, verbatim: "Implement the unimplemented chapters please." and "Implement the unimplemented chapters end-to-end please. It needs to be a finished product." (D-850, on D-536). **Game case: FFX only.**

## 1. What changes for the chapters that already exist (the risk this preflight is about)

| Shared piece | Change | Why it is inert elsewhere | Checked by |
|---|---|---|---|
| `battle/ffx/setup.ts` | `applyRonsoSetup(ctx)` before the opening order | returns at once unless both Ronso ids are on the field | every FFX chapter suite and the parity suites, unchanged |
| `battle/ffx/scripted.ts` | Lancet's `learnsRonsoRage` extra calls the teacher registry | the registry holds only the two Ronso scripts (`registeredRageTeacherIds`) | `biran-yenke-data.test.ts` pins the registry; Chapter I's Lancet behaves as before (its suites) |
| `battle/ffx/ai/index.ts`, `hooks.ts` | the two scripts registered; `scriptListensToHit` | a lookup by script id; the hook test now asks only scripts that listen to hits | `re-parity-ai-merged-hooks.test.ts` |
| `data/ffx/index.ts`, `command-records/enemies.ts` | eight ability rows and their records | new ids only | `data-ffx-command-records.test.ts` (491, 489) |
| `engine/BattlePresenterDepartures.ts` | the two ids "yield" | keyed by these ids only | `presenter-departures.test.ts` |
| `scenes/gagazet-giants.ts` | two spots and heights | keyed by these ids; Chapter I fields neither | `ffx-giant-stature.test.ts` |
| `data/encounters.ts` | the unions and the number type | type-level only | `tsc`, `chapter-numbers.test.ts` |
| the parity suites' samples | the new rows reshuffled them | the old pool is drawn exactly as before; the new rows sampled separately | `parity-ffx-engine-status`, `-wiring` |

## 2. Risks and how each is checked

1. **Invented data** (rule 6): every row and record is the game's (decoded, cross-checked against the Steam fixture); every formula is tagged `[search]`; the preset is Chapter I's estimate, unmoved. Checked by the data test against the research table.
2. **A fallen Ronso speaking**: no mid-battle beat is keyed on a fall; the beats are the survivor's own Berserk and Haste. Checked on the real engine over 80 seeds (`biran-yenke-story.test.ts`).
3. **The duel unwinnable or trivial**: measured, not tuned (200 seeds; the advisor wins all, attack-only none).
4. **A door that fires another door** or a word typed over the board: the door table's rule and the real-input suites (`kimahri-door`, `chapter-doors`).
5. **Self-Destruct** ends the battle as an escape: disclosed in the handoff, an RE question; the advisor never casts it.

## 3. Reviews owed

A **focused review of the production candidate** before any deploy, then the **deep review on the live build** (the plan's own reading). Not run in this session (a cloud container without the art, the deploy tooling or the review workflows' environment): "deploy + review owed" in NOW.md.

## 4. Verdict

Build as built; ship only through the focused review. Handoff: [ch-biran-yenke](../handoff/ch-biran-yenke.md).
