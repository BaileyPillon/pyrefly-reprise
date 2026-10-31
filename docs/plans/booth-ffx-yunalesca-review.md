# Paper preflight: the booth treatment reaches Chapter II (Lady Yunalesca), FFX only

> The paper preflight AGENTS.md rule 15 asks for before a change `tools/critic-plan.mjs` classes as deep. It follows the list that `docs/plans/booth-leblanc-review.md` section 4 left for "the next chapter that joins" (does it chain, which victory kind, which dresses have rows, do its foes yield, which maps exist, what is its showpiece and who decides it, what does the research say about its air, what is its plate's shape, does it have a hidden twin) and adds the row the build itself found (10). Written during the build, 2026-10-30, from reading the code and running the real engine; docs only.

```
node tools/critic-plan.mjs --paths src/engine/motion/DemoGate.ts,src/engine/look/LookConfig.ts,src/engine/look/LookGrades.ts,src/engine/look/LookGradesBold.ts,src/engine/look/LookBoldConfig.ts,src/engine/look/pro/ProGrade.ts,src/engine/look/pro/RimFigures.ts
  review:       DEEP (focused before deploy; the deep review on the live build)
  because:      3 substantial checkpoints since the last deep review
  systems:      effects, lighting and sprites
  games:        both (shared plumbing); Chapter II itself is FFX only
  checks:       CHK-008 013 016 017 020 021 026 027
```

## 1. What the change is

One line in `DemoGate.TREATED_CHAPTERS` (`yunalesca`, `ffx`, `r69`), three written holds in `PIECE_HOLDS` (`breath`, `cam`, `smear`), her look rows (`CHAPTER_LOOKS`, `ROOM_LOOKS`, `BOLD_ROOMS`, `ROOM_BOLD`, `PRO_ARENA` for `zanarkand-dome`) and one row of `RimFigures.TREATED_RIM_FOES`. No switch module changes: the 14 of release 69's gate already ask `isTreatedChapter(id, piece)`. See [booth-ffx-yunalesca](../handoff/booth-ffx-yunalesca.md).

## 2. What is NEW in Chapter II that the booth pair and Leblanc never had

| # | Chapter II differs by | the piece it can break | where it is pinned |
|---|---|---|---|
| 1 | **one foe, three paintings, swapped in place at each form change** (`setArt`); a "dying" form is not the last foe | the ending piece: a freeze, a title or a HUD-out at a form change | `booth-yunalesca-forms.test.ts` runs the REAL fight (the real engine, presenter, party and tactic) with a recording port: the two swaps see no ending cue and a full HUD, one freeze, one title, one pull-back at the end |
| 2 | **the first FFX chapter beyond Chapter I**: FFX's layout, curve profile and tables must play, not Chapter VI's | rule 14 | `booth-yunalesca-switches.test.ts` (`hudF1Game`, `proGame`, `curvesGame`, `stagingGame`, `fxGame`, `passGame` all `ffx`); `demoGameOf` reads `TREATED_CHAPTERS` |
| 3 | **the `hold` victory kind in FFX** (Zanarkand: nobody poses; `research/ffx-vs-ffx2-presentation.md` 2.1) | the ending's quiet title and pull-back, the cheer floor | the same real fight (title then pull-back; no cheer floor read) |
| 4 | **the FFX Overdrive opening** (T14, FFX only) | the opening piece | the same real fight: six `opening:overdrive` cues and no `opening:change` |
| 5 | **a swap exception** (`SwapSwitch.SCOPE_EXCEPTIONS`: her stance look is held at release 67's) | the smear planner, which cuts the same swaps and reads a different list (`SmearDirector.swap`: `swapsInScope() ? smearStyle() : smearStyleNow()`); joining the treated list would have turned it ON in her chapter | the `smear` hold; `booth-yunalesca-rows.test.ts` (no smear, no stance or cause pick) |
| 6 | **a plate with almost no slack, and a ship-blocking history** (PR-0307: the MAX mix's colossus master showed the plate's edge at every aspect) | the pro camera's real shots laid on this plate | the `cam` hold with its offline read; job J4 lifts it |
| 7 | **no `BossClean` footprint rows** (measured: they would shrink the shadow; the controller keys the art id the figure was built with and a form change swaps the painting under it) | the boss's shadow and ring | `RimFigures.TREATED_RIM_FOES` flags her by combatant id; `booth-yunalesca-rows.test.ts` pins that no row exists |
| 8 | **a 7-person party, three on the field, aeons in this fight** | the HUD's party plates and the turn strip | job J1 and J2 (the real fight also summons aeons) |
| 9 | **maps that exist and are current but are not in the art mirror the build uses** | the HD-2D look's figure relight and depth fog | the fallback is "a figure with no map stays unlit"; the driver's mirror command and job J9 |
| 10 | **(found by the build) the smear rides on the swap scope, not on the treated list** | the exception's other half | row 5 above; this row is the reason the preflight exists |

## 3. What would make this wrong, and what answers it

- A mark of the ending at a form change: answered by row 1 (the real fight).
- A booth-pair frame that moves: the shared matrix (`booth-treated-switches`) and job J10 against release 68.
- A table of the wrong game: row 2.
- The plate's edge in a directed shot: held (row 6); the held piece falls back to today's rig, which the MAX mix has played since round 19.
- The exception's swap jerks coming back by the side door: row 5.

## 4. Order of work (for the next chapter that joins)

Add rows 1, 5, 6 and 7 to the list in `booth-leblanc-review.md` section 2: does a foe change its painting inside the fight; is the chapter in `SwapSwitch.SCOPE_EXCEPTIONS` (then the `smear` piece waits with it); how much slack does its plate have for a directed camera; do the boss footprints exceed the engine's own pool.
