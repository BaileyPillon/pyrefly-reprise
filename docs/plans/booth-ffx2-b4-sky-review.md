# Paper preflight: Chapters V and XI come back on the treated list with the look held, FFX-2 only (`booth-ffx2-b4-sky`)

> The paper preflight AGENTS.md rule 15 asks for before a change `tools/critic-plan.mjs` classes as deep. **Written after the build, not before it** (the reviewer of `153777c10` found none: M6), from the code and the r70 evidence; no browser, no build. Result: **PROCEED**, with the repairs of the review applied. Docs only.

```
node tools/critic-plan.mjs --paths src/engine/motion/DemoGate.ts,src/engine/motion/PieceHolds.ts,src/engine/look/LookConfig.ts,src/engine/look/LookState.ts,src/engine/look/pro/ProGrade.ts,src/engine/look/pro/ProSwitch.ts,src/engine/look/pro/SkyGrade.ts,src/debug/proApi.ts
  review:       DEEP (focused before deploy; the deep review on the live build)
  because:      a deep review is still owed from 6321b2578 (the class is the owed review's, not the change's)
  systems:      debug API used by the evidence harness; effects, lighting and sprites
  games:        both (shared plumbing); the chapters are FFX-2 only
```

## 1. Game case (rule 14)

| Item | Case | Why |
|---|---|---|
| Chapters V (`ffx2-vegnagun-shuyin`) and XI (`ffx2-fallen-aeons`) back on `TREATED_CHAPTERS`, `since: 'r71'` | **FFX-2 only** | registry game `ffx2`; sources `research/ffx2-vegnagun-shuyin.md`, `research/ffx2-fallen-aeons.md` |
| `hd2d` and `arena` held in both; `cam` held in XI | **FFX-2 only** | rows keyed by the two chapter ids; no FFX chapter and no other FFX-2 chapter reads them |
| `?skygrade=a|b|c` (default off) and `SkyGrade.ts` | **plumbing in shared files, answers only for the two ids** | proved identical to r70-int for every other chapter id, both scopes, both pro modes, with and without the word (the review's harness H1: 141 of 141 LUT, room and key entries) |

## 2. What can go wrong, and the case that would show it

| # | risk | acceptance case | status |
|---|---|---|---|
| 1 | holding the look does not return release 69's plate | the look state after a battle equals an untouched chapter's and `?treated=pack`'s (test, by the real `applyChapterLook`); browser job S1 reads the pixels against release 69 | state proved, pixels owed (S1, S2) |
| 2 | a held piece the plan did not think of still puts light on the plate | the census test lists every reader of `hd2d` and `arena` in `src`; `look` is the strike effects only | proved; `rim`, `boss`, `governor` run only inside the look rig and do nothing here (stated in the note, not promised) |
| 3 | the word changes a chapter it should not | the default-off identity and the per-chapter diff above; 25 of 25 mutations caught | proved |
| 4 | a still labelled with an option that is patching nothing | `__pyrefly.skyGrade().screen` (`release69`, `r70`, `a`, `b`, `c`) | repaired after the review (M2), tested |
| 5 | XI's lift read on a frame without the burst | XI's `cam` lift needs the burst frames under 3 percent too; the XI look lifts name the scratch build that films them (job S3b) | repaired after the review (M1), tested |
| 6 | the 3 percent number passing by construction (option b) | the stills, not the number, are the filter; predictions revised | recorded (M3) |
| 7 | a chain's seam HUD, title, freeze, form change (classes 1 to 5) | the real engines and chain loop, V with 5 links and XI with 3, plus 8 seeds each | proved offline (review H2, H2b) |

## 3. What stays reusable, and what is owed

Reusable: the r70 lanes' stills and JSON under `D:/Tools/pyrefly-scratch/2026-10-31/r70/ffx2/` (the tool reproduces every number the holds quote). Owed in a browser (not run here): S1 to S9 and S3b of `docs/handoff/booth-ffx2-b4-sky.md`, class 9 (V's Node markers against the F1 ribbon) among them. The `Lifts when` of each held piece stays the gate to a lift.
