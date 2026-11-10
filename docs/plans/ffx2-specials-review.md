# Paper preflight: the FFX-2 Special dresspheres (branch `ffx2-specials`)

**FFX-2 only** (a Special dressphere is an FFX-2 idea). Written 2026-11-09 after the fact, as AGENTS.md rule 15 asks of a change `node tools/critic-plan.mjs` classes as deep (the plan says: review DEEP, because `battle/ffx2/special/enter.ts`, `engine.ts` and `execute.ts` are the FFX-2 ATB engine, a shared system; checks CHK-002, 003, 009, 015, 016, 017, 020, 021, 022, 023). The review of `7516dbf8e` was the adversarial pass this note should have preceded; this is what it would have said.

## What changes, and what it can reach

| Change | Reach with the `specialDressUp` switch OFF (every shipped build) | Reach with it ON (a test, a measurement) |
|---|---|---|
| `battle/ffx2/special/*` (forms, stats, availability, change, enter) | none: nothing imports a Special onto a grid node, nothing wears one | the whole feature |
| Hooks in `execute.ts`, `menu.ts`, `engine.ts` (`afterAction`, `runLogicStep`, `checkBattleEnd`, `menuContext`), `setup.ts`, `spherechange.ts` | each returns at once on the flag (`specialOn(state)`); `execute.ts` hands every `spherechange` to `special/change.ts` first, which answers false when the flag is off | the offer row, the way out, the fall, the end of the battle |
| `adapt/kill-rewards.ts`, `adapt/auto-layer.ts`, `adapt/menu.ts`, `adapt/game-ids*.ts` | the reward owners read two `aiMemory` marks no unit has; the auto layer skips the grid's rows only for a Special dress | the same marks and dress |
| `data/ffx2/command-records/special.ts`, `abilities/special-*.ts`, ladders | the 99 rows are in the catalogue the audio parity golden plays (32 scenarios moved by hand, pinned) and in the ability pool the test rigs pick from (one rig moved) | the commands of the nine parts |

## What would break it (the list the review worked through)

1. **A shipped chapter reaches the feature.** Proof asked: 21 FFX-2 chapters x 5 seeds x 2 decision times, branch against `origin/main`, identical on event hash, ticks, event count and outcome (210 of 210 identical; the same run with the flag on and no girl taking the row also identical).
2. **An invented number.** Every command row is pinned to a fixture read from the game's own tables; the stat scale is the exe's; every pick has a recorded alternative (research note section 10).
3. **A part with no turn, or a unit the engine cannot see.** The engine caches its slot order by object and checks it by length: a unit replaced by a new object is never stepped. This is the class the first review missed once (the second entry's pods); `ffx2-special-form-edges.test.ts` plays a second entry and asserts the pods act.
4. **A status or flag that outlives the form** (Auto-Life, `removed`, `aiMemory` marks, accessories, immunities, the walk marks). The form's own Auto-Life carries a source mark and comes off with the form; a girl who was Ejected before is never parked.
5. **A seam.** A chain that ends in a form must carry a girl in her dress: the form ends when the battle's result is built.
6. **A fixture that moved without a reason** (the SFX golden, the shared test rig). Both are named, with the 32 scenarios.

## What the focused review of this branch should read

The new `special/` files and the four hooks; `tests/unit/ffx2-special-dress-up.test.ts`, `ffx2-special-form-edges.test.ts`, `data-ffx2-special-rows.test.ts`, `chapters/farplane-cup-specials.test.ts`; the flag-off census; `node tools/orphans.mjs` against `main`. Nothing here is visible to a player, so there is no screenshot or phone check until Bailey picks the look (decision 92d) and the presenter, the HUD and the wheel are built.

## Not decided here

Which chapters turn the switch on, the three-part look (Bailey's pick, D-937 / 92d), whether a fallen main body ends the form (pick 8, checked against a fan thread only; the exe was not read: no Ghidra instance ran).
