# r3941-heights: paper preflight (critic-plan class DEEP; a focused review before any deploy, the deep one after)

Branch `r3941-heights`, from `origin/r394-int` 0e46667c (release 39.4's integration branch). Written in the 5-to-10-minute form AGENTS.md rule 15 asks for; the code is small enough that
it was written in the same sitting, so the plan was **corrected where the build found it wrong** (marked "build:"). The handoff `docs/handoff/r3941-heights.md` has the measured account.
`node tools/critic-plan.mjs --paths src/engine/BattlePresenterStage.ts,src/data/ffx/party-stature.ts,src/scenes/via-purifico.ts` says DEEP (battle presenter and lifecycle is a shared
system; FFX game data; effects, lighting and sprites): CHK-006, 008, 013, 016, 017, 020 to 023, 026, 027, "audit every changed data value against research/".
Authority: Bailey, 2026-10-07, "fix the heights once you have the numbers" and "show me the heights fix once it's ready". The numbers are the REA lane's: `D:/Tools/rea/FINDINGS.md` section H.

## Game case (rule 14)

**FFX only** (Chapters I, II, III, VII, VIII, IX, X, XII, XIV, XVII, XVIII). The numbers are the FFX HD models' (`research/ffx-character-heights.md`). FFX-2 is not touched: its three girls'
models are not mapped to a girl or a dressphere yet, and its Yuna and Rikku share two ids with FFX's, so the lookup is keyed on the battle's game (`BattleState.game === 'ffx'`) **and** the
party side, never on the id alone. FF7 and every FFX-2 chapter (IV, V, VI, XI, XIII, XV, XVI and the hidden Leblanc one) take the code path they always took, and a test says the numbers are
bit for bit the old ones. Bosses, aeons and fiends are not touched (their sizes are being measured elsewhere). Presentation only (rule 1): `src/battle/**` and every headless
`BattlePresenter*.ts` file are untouched; the one change in the presenter's `three` half (`BattlePresenterStage.ts`, which already imports `three`) is the line that decides a height.

## The approach

1. **One table.** `src/data/ffx/party-stature.ts`: seven rows, `ratio` (the multiple of Tidus's height, the only field the build reads), `top` (the model-unit top it is made from) and `wiki`
   (the published height's ratio, comparison only). Tidus is exactly 1. A better measurement (the PCSX2 battle-stance reading is on its way from another agent) is a change to a `ratio` and nothing else.
2. **One factor on the actor's world height.** `PaintedStage.add` hands `PaintedActor` a `worldHeight`; it was the scene's shared `partyHeight` for every hero and is now that times the hero's ratio.
   `computePoseScale` turns `worldHeight` into one pixel scale for all of an actor's poses and puts the pose's anchor row on the actor's ground point at any scale, so the figure grows or shrinks
   **about its feet** and every pose uses **one** factor: the per-pose registration (`PoseRegistration.ts`), the KO and hurt scales (`KoPoseScale.ts`), the head lock (`HeadLock.ts`, CHK-026, which
   only ever compares one actor's own poses to each other), the lying body (`PaintedRest.ts`, `ProneLay.ts`, `LieFlat.ts`) and the prone safety nets (`maxExtent`, `minExtent`, relative to `worldHeight`) cannot see it.
3. **The marks follow.** The stage authors the contact shadow (0.62) and the turn ring (0.78) at a fixed radius; both are multiplied by the same factor, exactly as a scene-named height has always scaled them
   (`figureHeights`, the Cavern's Daigoro). Everything else a figure carries is a multiple of its `worldHeight` inside `PaintedActor` (`headPoint`, `centerPoint`, `height`, the selection pool, the hop, shake, lean and
   crouch), so the damage numerals and target cursors (which the HUD projects from the head, chest and feet), the spell effects and the bloom (which read `height`) follow with no code.
4. **Who is scaled.** A hero of the seven, in an FFX battle, on the party's side. A height the scene names for a combatant (`SceneStaging.figureHeights`) or a director hands `add` is the figure's own and carries
   no ratio. *Build:* Chapter XIV (Via Purifico) is the one FFX scene whose `partyHeight` is a hero's own height (Yuna's 1.68, not Tidus's), so the plan's plain multiply would have shrunk the only girl in the room to
   1.53 and out of line with her 1.66 in Chapter I; the scene now names Yuna in `figureHeights` (one line) and she stands exactly as she always has there.
5. **`?stature=off`** plays the old equal heights, for same-build before and after captures (as `?headlock=off` and `?posereg=off` do). The pictures are one build, one seed, one moment, with and without.

## Where the code lives

| Path | What | Lines |
|---|---|---|
| `src/data/ffx/party-stature.ts` (new) | the table, `ffxPartyStature(id)`; pure data | about 80 |
| `src/engine/PartyStature.ts` (new) | `partyStature(game, side, id)`, `figureHeight(...)` (the world height and the shadow-and-ring scale from the three sources: a director's, a scene's, the shared one), the `?stature=off` switch; no `three`, no DOM but the page address | about 100 |
| `src/engine/BattlePresenterStage.ts` | three lines: the import, the call, `worldHeight: size.height` (it was 941 lines, a breach of the 400-line rule before this lane) | +3 |
| `src/scenes/via-purifico.ts` | `yuna` named in `figureHeights` | +3 |
| `research/ffx-character-heights.md` (new) | the method, the build, the model ids, the ratios, the wiki comparison, the bind-pose caveat, "no game file or mesh data in the repo" | note |
| `tests/unit/ffx-party-stature.test.ts`, `tests/unit/engine/party-stature.test.ts`, `tests/unit/engine/stage-party-stature.test.ts` | the table, the maths, the stage | each under 400 |
| `docs/CONTRACT-CHANGES.md`, `docs/ENGINE-API.md`, `docs/handoff/r3941-heights.md` | records | |

No file of `docs/CONTRACTS.md`'s list is touched; one entry is written in `CONTRACT-CHANGES.md` anyway, because a shared surface (the stage's sizing) gains a rule and a switch.

## What the change can break, and how it is made to fail soft

| Risk | What could go wrong | Guard |
|---|---|---|
| **FFX-2's Yuna and Rikku** | Same ids as FFX's | Keyed on `BattleState.game` and the party side; the stage reads the game from the state it was staged with (`lastState`), and a stage that was never staged scales nobody. Tests: both games, the same ids, exact heights |
| **A Switch-in or a summon** | `addCombatant` builds a stub with only `id`, `side`, `slot`, `spriteKey` | The lookup needs only the id, the side and the stage's state; a Switch-in stands at his own height (test); an aeon (side `aeon`) is never scaled |
| **A scene that names a hero's height** | A double count | `figureHeights` and a director's height win (Chapter XIV's Yuna); no other FFX scene names a party member |
| **Chapter framing (the MAX mix, `fx/mix/`)** | It measures the figures' live painted quads, so a taller Kimahri or a smaller Yuna moves the party's mean height; its rules are relative to "today's rig" at the same moment (the party-height floor, the overlap and boss-cover limits) | Measured, not reasoned: the same chapter and seed with and without `?stature=off`, the camera, the figures' rectangles and the HUD panels, at 1600x900 and 390x844. Anything that clips or collides is **reported with options, not fixed** |
| **BOSS SCALE** | A boss's on-screen size is a multiple of the party's mean height (`masters.ts` `scaleTarget`, `partyPx`), so a party whose mean is taller than Tidus's draws the boss that much larger | Not changed here (bosses are being measured); the effect is measured per chapter (the boss's rectangle with and without) and reported with the one-line option |
| **The staging table (`stageTable.ts`: Chapters II, III, X, XII)** | Its moves were solved with equal heights; the overlap between neighbours may change by a few percent | Measured as above (pairwise overlap of the party's rectangles, with and without) |
| **The head lock and CHK-026** | A different `worldHeight` changes every size the lock sees | The lock compares an actor's planes to its own idle under one camera, so a common factor cancels. Re-run: the continuity harness on Chapter XVII (Yuna and Auron fall; both are scaled), on and off |
| **KO, revive, lying bodies** | `ProneLay` slides a body by its own length; `downed.ts` and `KoPoseScale` read ratios | All relative to the actor's pixel scale; measured on the harness run and by a KO picture |
| **Hop, lunge and knockback distances** | Some are multiples of `worldHeight` (the hop, the shake), some are world distances (the lunge, solved against the picture by `StrikeReach`) | The lunge is solved against the painted boxes in every chapter, so it follows the figure; the hops scale with the figure, as a taller hero's would |
| **The phone (390x844)** | A slice of a wider field; a taller Kimahri or Wakka may leave the top of the slice | Measured at 390x844 in every FFX chapter: the tallest figure's top against the top of the viewport and the HUD |
| **The art governor** | A figure on screen at a new size may ask for another master | Automatic (`StageArt`); the biggest change is a hero 21 percent larger |
| **Cost** | None per frame: the factor is applied once, when a figure is built | |

## How it is proved

- `npx tsc --noEmit` clean; the three new files, `stage-figure-heights.test.ts`, the presenter and stage files one at a time; the full suite once at the end with `--testTimeout=60000`.
- **Before and after, same build, same seed, same moment** (`?stature=off` against the default), headless Playwright from node (never the browser pane or Chrome), at 1600x900 and 390x844, in every FFX chapter; the
  figures' rectangles read from `window.__pyrefly.targeting()` (the stage's own projection), the HUD panels from the DOM, the camera and the framing report; side-by-side pictures and a contact sheet.
- The head check (CHK-026) re-run for one chapter where a KO swap happens: Chapter XVII `sin-fins-core`, with the stature on.

## Not changed

Any boss, aeon or fiend size; BOSS SCALE; the framing; the staging table; the scene `partyHeight`s; the camera rigs; the pose registration, `KoPoseScale`, the head lock and its band; CHK-026 and its tolerances; any
game number; FFX-2; FF7.

## What the build found that this plan did not say (the measured account is `docs/handoff/r3941-heights.md`)

- **The paintings' tops are not all the heroes' tops.** The approved idles are cropped at their topmost pixel (row 16 in all seven): the hero's hair for Yuna, Auron, Wakka, Lulu and Rikku, Tidus's sword pommel and **Kimahri's spear tip, 8.2 percent above his mane**. The plain multiply of step 2 therefore puts six bodies within 1.3 percent of the table and Kimahri's body 7 percent short
  (1.124 of Tidus's hair, not 1.211); his body at 1.211 would be 1.304 in his row. Applied as briefed, reported (`research/ffx-character-heights.md` section 5a).
- **The framing's knock-ons were real, not just a risk:** in 5 of 18 cases the planned camera moved and Tidus's size on screen with it (Chapter I +4.8 percent, XII -4.1), the sized colossi follow the party's mean (Yojimbo +3.7 percent, Natus +2.9), the framing's own menu rule counts Chapter I's Yuna at 8 percent under a panel (limit 6), and Kimahri's head goes deeper behind
  Chapter IX's Zanmato gauge on the phone (16 to 31 percent of his box). Nothing clips the frame and no new panel overlap appears. Options in the handoff; none built.
- **The head lock's factor is not exactly the same at every height** (a taller figure spans more of the camera: Kimahri's asks 0.7 percent more than Tidus's at the strongest stage camera), so the real-actor test holds every swap to x1.00 and the factor to within 0.01 of Tidus's rather than to the digit.

## Open questions for the driver

1. **Boss size follows the party's mean** in the colossus chapters (BOSS SCALE is a multiple of it). The measured drift is in the handoff; keeping the boss where it was is a small change to the framing (divide each figure's
   height by its ratio before the mean is taken), left for the driver because bosses are not to be touched here.
2. **Anything that clips or collides** (a taller Kimahri or Wakka against the top of the frame or a HUD panel) is in the handoff with pictures and two or three options; none was picked.
3. **Kimahri's number**: 1.211 as briefed (his spear tip at 1.211 of Tidus's pommel, his mane at 1.124 of Tidus's hair), or 1.304 in his row (his mane at 1.211; a painting 30 percent taller and wider than Tidus's)? A table-only change either way; the effect of 1.304 on the three Kimahri chapters is measured in the handoff.
