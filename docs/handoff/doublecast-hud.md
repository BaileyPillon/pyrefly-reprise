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
| d | The lock chip on Yu Pagoda B stays clear of the boss in the menu camera pose: home is the target box's top-left; failing that the first clear place on the target's own box (the "visible wedge"), then beside it | `doublecastLock.placeLockChip` |
| e | The advisor card names both casts: "Doublecast: Fira + Blizzard" (`casts`), "Doublecast: Firaga + Firaga" (the shipped tactics' `wrappedId`: one spell twice) | `advisor.wrappedLabel`; the pinned test in `ffx-doublecast-aim.test.ts` follows |

### The dead end (no second spell is affordable): the finding

Sources read: the engine at `c030970a` and this lane's handoff. **They do not say what the game's menu shows.** What they do say:

- The engine's picker returns every row with `second.enabled: false`, reason "Not enough MP"; it has no "nothing offered" state. A `casts` command whose second spell cannot be paid is not an error: that cast
  "does not start and pays nothing" (handoff section 2), and the first cast is paid and played.
- Handoff 7.3(b): what the game does when Doublecast is chosen with MP for only one spell is **inferred** (the engine casts the first spell alone and the turn still costs rank 3), never measured.
- The 2026-10-15 spec (shared item 5, which Option A carries): "A dead end shows its reason. If no round-2 row fits, the list greys out and the help line says so and names Esc; the menu never commits a
  single cast by itself. Ours."

So the build does what the instruction allows and the spec said, and invents nothing: **every row stays greyed, the cursor stays on cast 1's spell, Back is available, nothing is committed.** The slab says
"No second spell fits. Esc goes back." (a phone: "...Tap the title to go back."). **Open question for the driver (and for the next live check on the Steam copy, a minute with Lulu on 10 MP and Fira):** does the
real game offer nothing there, force a Back, or cast the first spell alone? If the game casts it alone, the menu's dead end is a deviation and the fix is one line (commit the first cast when nothing is offered).
The same live look would settle whether the first list should grey a spell that leaves nothing for a second pick (not in any source; not built).

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
- `tests/unit/ui-ffx-doublecast-model.test.ts` (31): the pure model, the words, the lock chip's place, the advisor label, the source scan.
- `tests/unit/ui-ffx-doublecast-hud.test.ts` (12): the real `FFXBattleHud` with `withDoublecastHud`: the slab, the MP preview that survives a party re-render, the lock chip off the boss, the Sensor chip, the phone's
  reader, the reason line, the engine seam (read-only: asking changes nothing), the wiring.
- `tests/unit/ffx-doublecast-aim.test.ts`: the advisor label assertion follows fix (e).

Real-key browser check (headless Chromium, GPU mode, from node; `tools/zz-dcast-hud-shots.tmp.mjs`, scratch, not committed) and its frames: see "Screenshots" below.

## Open

1. **The dead end** (above): not in the sources; the game's behaviour needs a live look.
2. **Disclosed edit.** Chapter III gives Lulu One MP Cost, so every spell costs 1 MP there and nothing can grey: the natural run shows two rounds with no greyed row. The greyed frames use the same disclosed
   debug edit as the mockups (One MP Cost stripped from the engine's own copy of Lulu, MP set), which gives the engine's real costs (Fire 4, Fira 8, Firaga 16); Chapter XVIII's Lulu has them unedited.
3. **A second pick can repeat the first spell** (the engine allows it; Chapter XVIII's Firaga twice is one more press than today's flow: Special, Doublecast, Firaga, target, Firaga, target).
4. **Not built, not asked:** B's editable pair rows and C's "AGAIN" row (the mockups' other options) stay possible later (rule 10).
5. **Release class:** DEEP (shared phone plumbing and `engine.ts`); the paper preflight (rule 15) was not written before the build: the design was a delegated approved mockup, the change is additive, and
   the driver's brief fixed the scope. The checks that matter for a review: CHK-003 (the 14 px floor: every new text is `max(its size, var(--hud-floor))` on desktop and 14 px or more on the phone),
   CHK-008 (the lock chip and the MP chip against the party window and the command stack), the phone layout, and the Sensor chip after Esc.
