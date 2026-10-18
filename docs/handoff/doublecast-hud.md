# Doublecast HUD: the two-pick menu (FFX only), branch `dcast-hud`

Branch `dcast-hud`, cut from `origin/re-parity-rc10-ffx-doublecast` (`c030970a4`, the engine lane: [re-parity-rc10-ffx-doublecast](re-parity-rc10-ffx-doublecast.md)). Written 2026-10-18 by a Sonnet
sub-agent of the release driver. Nothing here is deployed or merged.

**Game case: FFX only.** Doublecast is Lulu's FFX command (Chapter III's `dreams-end` build, and Chapter XVIII's line). `src/battle/ffx2`, `src/ui/ffx2` and FF7 are not touched. Two shared
pieces carry an optional field only FFX fills (see "Shared plumbing" below).

**The end state is Bailey's pick, delegated.** Decision queue item 103: the driver picked **Option A, "Second round"** of the 2026-10-18 mockups (`D:/Tools/pyrefly-scratch/2026-10-18/doublecast/`,
`notes.md`; spec `D:/Tools/pyrefly-scratch/2026-10-15/options/q21-ffx-doublecast/spec.md`) under Bailey's standing "for all other decisions i'll go with all your recommendations". It is recorded as
*delegated*, not as Bailey's own word. The approved target is the frames `A-1600x900.png`, `A-390x844.png`, `A-target1-*.png`, `A-target2-*.png`.

## What was built

The menu now composes a Doublecast the way the game does (handoff section 1 of the engine lane): a spell and its target, then the same list again with the first cast's price held against it, then a second
spell and its target, which commits both.

1. Special > Doublecast opens the Black Magic list, headed **"Doublecast · 1 of 2"** (round 1; the help line is "Doublecast: two spells in one turn · <the highlighted spell's effect>", no payer claim).
2. A spell opens its own target step; the slab reads `[1] FIRA · 8 MP` / "Pick a target for the first cast."
3. Confirming that target **does not submit.** The list comes back headed **"Doublecast · 2 of 2"**: the slab holds `[1] FIRA › YU PAGODA A      8 MP` over "**12 MP** left. Choose the second cast.", a gold
   lock chip `1 FIRA` hangs on cast 1's target on the field, and the caster's card shows the MP preview `20 -8 -> 12`.
4. **Rows the MP left cannot pay are greyed, and that is the engine's own verdict**: `FFXEngine.doublecastPicks(actorId, firstId)` -> `second.enabled` / `second.reason` (`battle/ffx/doublecast.ts`). The UI
   copies the verdict onto the rows (`doublecastModel.roundTwoGroup`) and compares no MP. A test pins it: a stub verdict that contradicts the arithmetic is believed in both directions, and a source scan
   of the new UI files finds no engine-rule import and no MP comparison.
5. A second spell opens its target step (the cursor opens on cast 1's target: "the same again" is one press); the slab reads `[2] BLIZZARD · 4 MP` / "Pick its target. **8 MP** left after." (`mpAfter`, the
   engine's number). Confirming it submits `{ kind: 'ability', id: 'doublecast', targets: [], casts: [{ id, targets }, { id, targets }] }` (`AbilityCommand.casts`, handoff section 6 item 2).
6. **Back:** Esc steps back one stage at a time: target 2 -> list 2 -> target 1 (cast 1's spell kept, the cursor on its old target) -> list 1 -> the Special list. A tap on the list's title does the same
   (a phone has no Esc; today's phone has no Back in any list, so this is new and Doublecast-only).

### The five build fixes the mockups found

| | Fix | Where |
|---|---|---|
| a | Spell just used is greyed in round 2: the cursor lands on the nearest offered row (a tie goes to the one above) | `doublecastModel.landingIndex` |
| b | A greyed phone tile gets a short reason line ("Not enough MP", "Silenced"), shown on a phone tile only; every FFX sub-list, not only Doublecast | `commandMenuRows.reasonHtml` / `rowsHtml`, `doublecast-hud.css` |
| c | Esc out of a target step clears the Sensor's folded "I YU PAGODA" chip (it stayed over the list in today's build too, every chapter); also when cast 1's target is confirmed and round 2 opens | `SensorPanel.aimCancelled`, called by the menu before the selection ends |
| d | The lock chip on Yu Pagoda B stays clear of the boss in the menu camera pose: home is the target box's top-left and stays while the target mostly sticks out of the other fiends' boxes (A); a target they cover 85 percent or more of (B: 95 percent under the boss's box) takes the first clear place on its own box, else the lower part of its outer side; always off the turn list's rows, the party window, the command stack and the help slab | `doublecastLock.placeLockChip`, `DoublecastHud.placeLock` |
| e | The advisor card names both casts: "Doublecast: Fira + Blizzard" (`casts`), "Doublecast: Firaga + Firaga" (the shipped tactics' `wrappedId`: one spell twice) | `advisor.wrappedLabel`; the pinned test in `ffx-doublecast-aim.test.ts` follows |

### The dead end (no second spell is affordable): the game's answer (settled 2026-10-18 by the RE session)

The engine's picker returns every row with `second.enabled: false`, reason "Not enough MP", and has no "nothing offered" state; a `casts` command whose second spell cannot be paid is not an error: that
cast "does not start and pays nothing" (engine handoff section 2). When this lane was built the game's menu behaviour there was not in any source, so the build did what the approved spec said and invented
nothing. **The RE session has since read it from FFX.exe and run the game's own code in its harness: answer (a), source note `FFX-G11d-doublecast-deadend.md` (the RE session's coverage notes, `D:/Tools/ffx-parity/coverage/ffx/FFX-G11d-doublecast-deadend.md`).**

1. In the game the second list opens with every row greyed (a spell's cost plus the first spell's cost is above Lulu's MP), and only Back gets out. (One refinement in the note: a spell record that costs 0 MP, Osmose's id, is never greyed by the pending MP, so an "all grey" list needs a learned list without it.)
2. The game never refuses the first pick and never casts the first spell alone (no code looks for an affordable second spell, and none commits the first cast by itself).
3. Back from the second list returns to the first spell's target cursor, with the pending MP cleared.

**The build already matches:** every row stays greyed, the cursor stays on cast 1's spell, Back is available (Esc, or a tap on the title on a phone), nothing is committed, and Esc from list 2 goes to cast 1's target step with the first cast's hold released. The slab says
"No second spell fits. Esc goes back." (a phone: "...Tap the title to go back."). **One difference stays, pre-existing HUD behaviour that waits for Bailey's decision:** our cursor lands on the nearest offered row, where the game's cursor rests on the greyed
row and a confirm there plays the refusal cue (cue 3), which we have no sound for. The note also records that the default-command key (the Defend shortcut) is handled at the top of the game's list handler and so still commits a Defend from the all-grey list (read from the decompile, not traced past the commit, not live-tested); this build does not model it. Whether the first list should grey a spell that leaves nothing for a second pick is not in the note either (not built).

## Files

New (all under 400 lines): `src/ui/ffx/doublecastModel.ts` (pure rules-free model), `doublecastText.ts` (the words), `DoublecastFlow.ts` (the menu's flow and `CommandMenuPort`), `doublecastLock.ts` (the chip's
place), `DoublecastHud.ts` (`withDoublecastHud`: the chrome, a wrapper like `withSinHud`), `doublecast-hud.css`.

Changed: `CommandMenu.ts` (920 -> 913: the wrapper code left for `DoublecastFlow`, the row HTML for `commandMenuRows.rowsHtml`; it is over the house limit and did not grow), `commandMenuRows.ts`,
`CommandMenuPaging.ts` (an optional count override), `SensorPanel.ts` (390 -> 395, `aimCancelled`), `FFXBattleHud.ts` (a `menu` getter; net -1 line), `phoneHud.ts`, `src/battle/ffx/engine.ts`
(`doublecastPicks`, additive, not on the `FFXBattleHud`-side contract: like `intent()` it is probed, so no `types.ts` change and no `CONTRACT-CHANGES` entry), `BattleScreenWiring.createHud`,
`engine/tactics/advisor.ts` (net -1 line).

### Shared plumbing (both games' code, FFX-only behaviour)

`src/ui/common/phoneBattle.ts`, `phoneBattleText.ts`, `phone-battle-parts.css`: an optional `PhoneBattleText.step` and a `.phud-step` strip over the Back / Confirm bar, hidden unless `readFfxPhone` fills it
(a Doublecast's "Cast 2 · after 1 Fira › Yu Pagoda A"). FFX-2's reader never sets it, so its phone HUD is unchanged. These three files and `engine.ts` are what class the change DEEP in
`critic-plan --paths` (below); without the strip and the seam it would be FOCUSED.

## Proof

- `tests/unit/ui-ffx-doublecast-menu.test.ts` (rewritten, 14 tests): real keys on the real command list: both rounds, the greyed rows against the engine's own verdicts, the commands, the engine playing them,
  the cursor landing, every Back stage, the dead end, and the stubs that prove no rule is re-derived.
- `tests/unit/ui-ffx-doublecast-model.test.ts` (33): the pure model, the words, the lock chip's place, the advisor label, the source scan.
- `tests/unit/ui-ffx-doublecast-hud.test.ts` (12): the real `FFXBattleHud` with `withDoublecastHud`: the slab, the MP preview that survives a party re-render, the lock chip off the boss, the Sensor chip, the phone's
  reader, the reason line, the engine seam (read-only: asking changes nothing), the wiring.
- `tests/unit/ffx-doublecast-aim.test.ts`: the advisor label assertion follows fix (e).

Real-key browser check: headless Chromium, `PYREFLY_BROWSER=gpu`, driven from node (scratch `tools/zz-dcast-hud-shots.tmp.mjs`, not committed), Vite on port 5860 (stopped by PID), Chapter III seed 1,
Lulu switched in for Auron, at 1600x900 and 390x844 (touch, DPR 2). Four runs per size, all by real key presses, no page errors:

- **edit** (the disclosed edit, MP 20): list 1, Fira, its target, list 2 (Firaga and Blizzaga greyed, the cursor on Fira, "12 MP left", "20 -8 -> 12", the lock chip "1 FIRA"), Blizzard, its target step
  ("8 MP left after"), Esc through list 2 and target 1 back to list 1, then the commit: the log reads `Doublecast: Fira`, `mp-damage lulu 8`, a hit, `Doublecast: Blizzard`, `mp-damage lulu 4`, a hit
  (two brackets, each cast paid at its own cost).
- **bfirst**: cast 1 on Yu Pagoda B (the lock chip on B's base, clear of the boss and of the turn list).
- **dead** (MP 10, Fira first, 2 MP left): every row greyed, Enter commits nothing, Esc goes to cast 1's target step and then to list 1.
- **natural** (Chapter III as shipped, One MP Cost): nothing greys; Fira then Firaga, 1 MP each, two brackets.

The type floor (CHK-003), read off the page: every new text is 16 px or more on a desktop at 1600x900 (the lock chip's label 14.5, the slab's second line 20) and 14 px on the phone. The Sensor chip is gone
after Esc and after cast 1's target is confirmed (`sensor: null` at list 2 and after every Esc).

## Screenshots (`docs/screenshots/dcast-hud-*.png`)

Target and build side by side: `D:/Tools/pyrefly-scratch/2026-10-18/doublecast/A-1600x900.png` against `dcast-hud-1600x900-edit-3-list2.png`; `A-390x844.png` against `dcast-hud-390x844-edit-3-list2.png`;
`A-target1-*` and `A-target2-*` against `-edit-2-target1` and `-edit-5-target2-moved`. The build reads as the target on the words, the chips and the greyed rows.

- 1600x900: `edit-2-target1`, `edit-3-list2`, `edit-5-target2-moved`, `bfirst-3-list2` (cast 1 on Yu Pagoda B), `dead-3-list2` (the dead end), `natural-3-list2` (Chapter III as shipped).
- 390x844 (the same six, `dcast-hud-390x844-*`): the list header "DOUBLECAST · 2 OF 2" with cast 1 under it, the reason line on a greyed tile, the footer, and the strip "CAST 2 · AFTER 1 FIRA ›
  YU PAGODA A" over the Back bar.

## Tests run (worktree `M:/pyrefly-dcast-hud`, Node 24)

- `tsc --noEmit`: clean.
- New and rewritten, all green: `ui-ffx-doublecast-menu` 14, `ui-ffx-doublecast-model` 33, `ui-ffx-doublecast-hud` 12, and `ffx-doublecast-aim`.
- The 205 test files that import the changed modules (CommandMenu, FFXBattleHud, SensorPanel, the phone HUD, the advisor, doublecast, the wiring): 202 green, 2 skipped; the one red run
  (`ui-ffx2-atbmode`, a 6 s test that crossed the 15 s limit under three parallel advisor suites) passes alone.
- The whole suite (`vitest run`, 1,376 files): 1,375 green, 21,861 tests passed, 86 skipped; the one red (`critic-policy-adoptions`, a ledger read that took 19 s against the 15 s limit under load) passes alone in 0.9 s.
- `node tools/orphans.mjs`: 26 orphaned modules, the same 26 as at `c030970a4`; none is a Doublecast file.
- `node tools/critic-plan.mjs --paths <the 18 shipped files>`: **DEEP** (before deploy: a focused review of the candidate; after deploy: live verification, then the deep review on the live build). Systems: FFX CTB engine,
  FFX HUD, global layout (shared phone plumbing), move advisor; checks CHK-002 to CHK-010, 015 to 017, 020 to 023; targets fight, pause, phone, presentation. What makes it deep: `phoneBattle.ts`,
  `phoneBattleText.ts`, `phone-battle-parts.css` and `src/battle/ffx/engine.ts`.

## CHANGELOG paragraph (plain words, for the driver to paste; not edited into `CHANGELOG.md`)

- **FFX, Lulu's Doublecast is now two separate choices at the menu, in the game's own order:** pick a spell and its target, and the list comes back for the second cast, headed "Doublecast · 2 of 2", with the first
  cast shown on its target, the MP it holds on Lulu's card ("20 -8 -> 12") and every spell the MP left cannot pay greyed. One spell can now go on each Yu Pagoda, or Firaga then Fire; the second target commits both.
  Esc steps back one stage at a time; on a phone a tap on the list's title goes back, and a greyed tile says "Not enough MP". Also fixed in every FFX chapter: backing out of an aim with Esc no longer leaves the
  folded "I YU PAGODA" chip standing over the list. The advisor card now names both casts ("Doublecast: Firaga + Firaga"). FFX only: Doublecast is Lulu's FFX command. When Lulu's remaining MP cannot pay for any second spell, the list opens with every spell greyed and only Back leaves it, as the game does (read from the game's menu code and emulated).

## Open

1. **The dead end** (above): settled by the RE session (`FFX-G11d`): the build matches the game; the cursor's landing row and the missing refusal cue stay as disclosed. Two small additions of ours the sources are silent on (both from the approved spec's shared items): Esc undoes one
   stage at a time (list 2 goes back to cast 1's target step, not to list 1), and a second target step opens on cast 1's target.
2. **Disclosed edit.** Chapter III gives Lulu One MP Cost, so every spell costs 1 MP there and nothing can grey: the natural run shows two rounds with no greyed row. The greyed frames use the same disclosed
   debug edit as the mockups (One MP Cost stripped from the engine's own copy of Lulu, MP set), which gives the engine's real costs (Fire 4, Fira 8, Firaga 16); Chapter XVIII's Lulu has them unedited.
3. **A second pick can repeat the first spell** (the engine allows it; Chapter XVIII's Firaga twice is one more press than today's flow: Special, Doublecast, Firaga, target, Firaga, target).
4. **Not built, not asked:** B's editable pair rows and C's "AGAIN" row (the mockups' other options) stay possible later (rule 10).
5. **Release class:** DEEP (shared phone plumbing and `engine.ts`); the paper preflight (rule 15) was not written before the build: the design was a delegated approved mockup, the change is additive, and
   the driver's brief fixed the scope. The checks that matter for a review: CHK-003 (the 14 px floor: every new text is `max(its size, var(--hud-floor))` on desktop and 14 px or more on the phone),
   CHK-008 (the lock chip and the MP chip against the party window and the command stack), the phone layout, and the Sensor chip after Esc.
