# Paper preflight: Chapter XI plays sky grade C by default, Chapter V keeps today's sky, FFX-2 only (`r72-sky`)

> The paper preflight AGENTS.md rule 15 asks for before a change `tools/critic-plan.mjs` classes as deep. **Written with the build, not before it** (the lane is one sitting; the last lane's preflight was also written after, M6 of its review), from the code, the sky stills of 2026-10-31 and the r71 evidence; no browser, no build. Result: **PROCEED**. Docs only.

```
node tools/critic-plan.mjs --paths src/engine/look/pro/SkyGrade.ts,src/engine/motion/DemoGate.ts,src/engine/motion/PieceHolds.ts,src/engine/motion/PieceHoldsSky.ts,src/debug/proApi.ts
  review:       DEEP (focused before deploy; the deep review on the live build)
  because:      a deep review is still owed from 6321b2578 (the class is the owed review's, not the change's)
  systems:      debug API used by the evidence harness; effects, lighting and sprites
```

## 1. Game case (rule 14)

| Item | Case | Why |
|---|---|---|
| Chapter XI's `hd2d` and `arena` lifted, grade C its default | **FFX-2 only** | one row of `SKY_DEFAULTS` keyed by `ffx2-fallen-aeons` (registry game `ffx2`; `research/ffx2-fallen-aeons.md`); no FFX chapter and no other FFX-2 chapter reads it |
| Chapter V unchanged | **FFX-2 only** | no default row; both holds stand; byte for byte release 71's (tests: the very table object, the same LUT bytes) |
| `?skygrade=today`, `DemoGate.treatedHold` and `treatedHolds` reading `PieceHoldsSky.ts` | **plumbing in a shared file, answers only for the one id** | the new branch runs only while the word is `today`, and the table has one chapter; a test walks every treated chapter under `today` and reads the same holds as without it |

## 2. What can go wrong, and the case that would show it

| # | risk | acceptance case | status |
|---|---|---|---|
| 1 | the default reaches Chapter V or another chapter | `SKY_DEFAULTS` is one row; tests read `skyGradeFor` for 10 ids and the LUT bytes for V default against `null`; mutant "V gets the default too" caught | proved |
| 2 | `?skygrade=today` is not release 71's frame | the two holds answer with the r71 row order (`treated().holds`), the look state after a battle is the control state, no grade, the room's table is the shipped object; the pixels are job R72-4 | state proved, pixels owed |
| 3 | the control arm `skyGrade(null)` stops meaning "no grade" in Chapter XI | `null` is the forced word `off`, distinct from the address's `default`; tested; mutant caught | proved |
| 4 | the word's state is read twice and drifts | one state, in `DemoGate.ts`; `SkyGrade.ts` holds none and `setSkyOption` writes it; `DemoGate.ts` imports no look module (a test pins it, no cycle) | proved |
| 5 | C is not dark enough, or too dark, on the real frame | the stills: XI first menu 54 mean and 0.58 percent over 240, Anima with the burst 61.5 and 0.48, the booth target 47.4 and 0.54; jobs R72-1 and R72-2 re-read them on the build | stills read, browser owed |
| 6 | the scripted rigs that look up at the burst were never read with the look on | job R72-3 samples the seam and the intro and reveal rigs every 100 ms | owed; recorded as an open question |
| 7 | `?pro=off` in Chapter XI plays the bold look with no grade | job R72-7 reads it; a debug word, not the player's path | owed; one row holds the look if it clips |
| 8 | the look rig and the governor cost frame time Chapter XI never paid in release 71 | job R72-6 against the Den of Woe; the r70 build already ran this rig in the chapter | owed |
| 9 | a shared test or table still pins Chapter XI as held | the booth family and every file `vitest --changed` reaches; ten files moved to the new truth with the reason beside each edit | proved by the run in the note |

## 3. What stays reusable, and what is owed

Reusable: the stills and `numbers.json` of 2026-10-31 (`D:/Tools/pyrefly-scratch/2026-10-31/sky-stills/`), `tools/sky-plate-read.mjs`, the r71 browser harness (`D:/Tools/pyrefly-scratch/2026-10-31/r71/ffx2/harness/`). Owed: jobs R72-1 to R72-9 of `docs/handoff/r72-sky.md` section 4, in a browser, before this is merged into a release candidate. **PROCEED.**
