# Paper preflight: the item gesture (FFX orb, FFX-2 spark), branch `anim-orb-ship`

Paper preflight under AGENTS.md rule 15 and `critic/RUBRIC.md` §4. **Written after the code, before any release** (the brief gave the work to the animation lane in one go; the check below is what the preflight would have asked, answered from the code and the tests, 2026-10-19). Nothing here ships by itself: no deploy, no review has run.

`node tools/critic-plan.mjs --paths src/engine/BattlePresenterBeats.ts,src/engine/BattlePresenterPorts.ts,src/engine/BattlePresenterStage.ts,src/engine/BattlePresenterItem.ts,src/engine/ItemOrbStage.ts,src/engine/fx/ItemOrbFx.ts,src/app/screens/BattleScreenGameDeps.ts` says **DEEP** ("battle presenter and lifecycle is a shared system"; also "effects, lighting and sprites"), obligations live + focused + deep, checks CHK-002 003 006 008 009 013 015 016 017 020 021 022 023 026 027. It is not a save-data change, so the deep review runs on the live build after the focused pass on the candidate.

## 1. Game case (rule 14), decided from the sources

| Case | What | Source |
|---|---|---|
| **FFX only** (`itemGesture: 'orb'`) | no flask; the gesture depends on the TARGET: on an ally a green orb rises from the user's hand, is tossed overhand, sparkles fall on the target; on the user an arm goes overhead and a glow gathers around them | `research/re-ffx-party-motion-timing.md` §6, label [M] (Steam copy, frames read, session 6, 2026-10-19), and the RE coordinator's restatement (the target decides, not the character) |
| **FFX-2 only** (`itemGesture: 'spark'`) | the camera stays wide; a short gesture toward the target; on an ally a small object lands near it, on the user a quick self gesture; either way a white-blue sparkle burst on the target; NO orb | the RE session's live check of the real FFX-2, label [M], driver decision 147; the report `D:/Tools/ffx-parity/live/` session 7 had not landed when this was built (the brief carries the description) |
| FF7 | unchanged (no `itemGesture`) | not asked |

Nothing is true of both games here, so nothing is shared except the plumbing (the ports, the effect class, the hand lookup), which carries no game content: the table of hands is FFX's party, and an FFX-2 figure uses the generic chest-height spot.

## 2. What changes on screen

- **FFX chapters, an item use** (every party member): the painted item pose is not shown (it holds a glass flask for Tidus, Auron, Lulu, Kimahri and Rikku; Wakka's holds his ball): the user stands in a flask-free stance (`idle`; Yuna keeps her open-handed `item` painting; a rigged Lulu or Kimahri its rig's `item` key); an orb forms at the hand over 300 ms, is tossed and flies 420 ms, bursts on the target; on the user a small glow at the hand and green motes rising over 1.5 s. The action holds 720 ms (ally) or 520 ms (user) where it held 380: **+340 / +140 ms an item use**, the effect's own length.
- **FFX-2 chapters**: a small white-blue spark tossed 210 ms (half the orb's flight), no trail, a white-blue burst; on the user only the burst. The pose and the 380 ms wait are what they were: **+0 ms**.
- Unchanged: the heal's spell effect, the numerals, the engine, the camera, the sounds.

## 3. What could break (and what pins it)

| Risk | Why | Pinned by |
|---|---|---|
| FFX-2 or FF7 gets the FFX look | one deps flag decides | `item-gesture-presenter.test.ts`: `presenterGameDeps` gives `orb`, `spark`, nothing; each branch run against the other's deps |
| A figure with no hand loses its item picture | a stage may have no `itemStance` | the stance is asked of the stage; no answer, the old painting and the old wait (tested) |
| REDUCE MOTION / skip speed | the effect must not run | the stance changes, nothing is drawn, the wait is today's (tested) |
| Two FFX-2 actions overlap (ATB) and cut each other's burst | one effect object | a pool of three (tested: two play, a fourth reuses the oldest) |
| The timing contract | the heal must land after the orb | the presenter waits the orb's own length; the effect runs on the presenter's clock (pace and playback speed scale both); a hit-stop (dt 0) freezes it with the field |
| Layering | no DOM or `three` in `BattlePresenter*.ts` | `BattlePresenterItem.ts` imports types and a pure table only; `three` lives in `ItemOrbStage.ts` and `fx/` |
| Cost | ~65 sprites a light | made on first use, at most three, nothing updates at rest; additive, no depth test, no texture file (a 64 px canvas each, three shapes) |
| A rig that is not ready | `landmark` throws before the rig is built | caught; the painting's hand stands in (tested) |
| The art | none of it is touched | no `public/art` file, no rig file |

## 4. Not done / open

- The FFX hand anchors are READ off the paintings by eye on a grid (good to about 0.03 of the painting), not computed.
- FFX-2 has no per-dressphere hand: the spark starts at a generic chest-height spot (`GENERIC_ITEM_HAND`).
- A foe target (a thrown damaging item) uses the same toss in an amber tone: the foe case is NOT sourced (the research note leaves it open), it is the same swing.
- The camera is the build's own in both games and was not touched. The RE note says FFX-2's camera stays wide during an item use; whether the build's FFX-2 shot already does was not checked here.
- The painted figures do not toss: the orb is what moves (no body beat was added).
