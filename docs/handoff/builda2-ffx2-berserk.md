# Build A.2 — ffx2-berserk track

Critic round 05, issue **PR-0045** (critical). One defect, one repair, no other
scope. Nothing here changes a look, a sound or an approved design, so no
end-state pick was needed (AGENTS.md rule 9).

**Game case: FFX-2 only.** Decided from the sources, not from memory:
`research/ffx2-combat-core.md` §2.8 (Berserk, and the Itchy row beside it) and
§3.4-3.6 (Songstress, White Mage and Black Mage have **no Attack command**).
FFX has no dressphere concept, every FFX character always has Attack, and its
menu is built in `src/battle/ffx/commands.ts`, which has no equivalent gate —
so nothing in this track applies to chapters 1-3 (AGENTS.md rule 14, CHK-021).

Owned files touched: `src/battle/ffx2/targeting.ts`, `src/battle/ffx2/engine.ts`,
the zero-row guard in `src/ui/ffx2/FFX2BattleHud.ts` `chooseCommand`, and two new
test files. No file listed in `docs/CONTRACTS.md` was touched, so
`docs/CONTRACT-CHANGES.md` needs no entry.

## The defect

A Berserked girl wearing White Mage, Black Mage or Songstress was offered **no
command at all**. `buildCommands` gates the generic Attack row on the
dressphere's `hasAttack` — false for exactly those three (§3.4-3.6) — and gates
abilities, the Garment Grid rows and items on `!berserked` (§2.8). With
`canEscape` false, as it is for the whole Chapter 5 chain, the list came out
empty, and `FFX2BattleHud.chooseCommand` handed that empty array straight to
`openCommandMenu`: a menu with no submittable row, and an awaited promise with
nothing that could resolve it. A hard lock, not a stall.

Shipped and reachable: Yuna starts Chapter 5 in White Mage
(`src/data/ffx2/builds/farplane.ts`) and Vegnagun's Leg casts Berserk at 75%
(`src/data/ffx2/enemies/vegnagun-leg.ts`, chance from
`research/ffx2-vegnagun-shuyin.md` line 247 — the data is right). Driving the real
`vegnagun-leg` group through the real `BattlePresenter` reproduced it on seeds
**3 and 13** of 1-32, on both the intended and the naive line.

## The repair

Three parts, smallest that satisfies the acceptance check.

1. **The turn no longer reaches the player.** §2.8 is explicit: a Berserked
   character "can only use the basic Attack command; **player loses control**".
   `FFX2Engine.nextDecision` now resolves a Berserked party turn itself
   (`runBerserkTurn`, the same shape as `runAiTurn`) instead of returning
   `player-input`. A suspended minigame still belongs to the player and keeps its
   existing path.
2. **No invented damage row where the sources conflict.** §2.8 says "only the
   basic Attack command"; §3.4-3.6 say those three dresspheres have no Attack
   command. Nothing in `research/` says what FFX-2 does when both hold, so per
   AGENTS.md hard rule 6 nothing was made up: `berserkCommand` attacks when the
   dressphere has an Attack, and otherwise passes (`kind: 'defend'`, which
   `execute.ts` resolves through its no-ability branch — the turn is spent and
   recovery starts). The ATB keeps running and Berserk expires on its own
   133-tick clock (§2.8 duration table). **Open question for Bailey below.**
3. **The invariant, and the guard behind it.** `buildCommands` never returns an
   empty list for a living, present unit: the last-resort row is the same pass.
   `FFX2BattleHud.chooseCommand` refuses an empty list, logs it as the engine
   regression it would be, and returns the pass rather than opening a menu that
   cannot be answered.

The invariant caught a second latent lock while it was being tested: **Itchy**
on any dressphere is equally empty whenever the girl has no Garment Grid link to
walk and cannot escape (§2.8: "only L1 and Escape remain available"). Shipped
Chapter 5 parties all carry grids, so it is not reachable today; it is closed now
either way.

## Open question for Bailey (sources conflict, nothing invented)

**What does a Berserked Songstress / White Mage / Black Mage actually do in
FFX-2?** §2.8 says a Berserked character can only use Attack; §3.4-3.6 say those
three have no Attack command at all. The build currently passes the turn. The
alternative reading is that she swings anyway with a bare unarmed attack. If the
answer is the second, only `berserkCommand` in `src/battle/ffx2/targeting.ts`
changes — the invariant, the guard and the tests stay as they are.

## Verification

- `npx tsc --noEmit` clean.
- `tests/unit/ffx2-berserk-zero-rows.test.ts` (6 tests): every shipped dressphere
  crossed with every subset of berserk / itchy / confuse / stop (14 × 16 = 224
  menus) is non-empty; the three no-Attack dresspheres offer a pass and not an
  invented attack; a dressphere that has Attack still offers exactly Attack when
  berserked; `nextDecision` resolves a Berserked turn instead of asking;
  `vegnagun-leg` through the real `BattlePresenter` over **seeds 1-32** reaches
  victory or defeat on every seed, the HUD is never asked for a command, and
  seeds 3 and 13 are covered by the loop.
- `tests/unit/ui-ffx2-berserk-guard.test.ts` (2 tests, jsdom, the real
  `FFX2BattleHud` and the real `CommandMenu`): an empty list draws nothing and
  returns the pass; a list with a row still opens the menu and answers a real
  key press.
- Both suites were confirmed to **fail on the pre-fix code** before the fix was
  kept: 123 zero-row combinations, seed 3 `aborted`, and the HUD test timing out
  at 15 s on a menu that could not be answered.
- Final full `npx vitest run`: **176 files, 4450 tests, all green**, with
  `npx tsc --noEmit` clean. (An earlier run mid-track showed three failures in
  `tests/unit/ui-coach-briefing.test.ts`, another agent's in-flight file; they
  were gone by the final run and never involved this track.)
- House rule 7: `targeting.ts` stays under the 400-line limit (399). `engine.ts`
  was already over before this track (452) and is 480 now; it is a pre-existing
  violation, flagged here rather than fixed, because splitting the engine is a
  shared-system change and not this repair's scope.
- **Live, real input, GPU mode** (`PYREFLY_BROWSER=gpu`, dev server on 5190,
  renderer `ANGLE (NVIDIA RTX 5070 Ti, D3D11)`): Chapter 5 played in the browser
  with the command menu answered by **29 real Enter presses**. Berserk was put on
  Yuna while she wore White Mage, after her first normal turn; her next turn was
  taken with **no menu opened for her** (`menu opened for a berserked Yuna: 0`),
  the fight kept running and the chapter reached its results screen. Screenshot:
  `docs/screenshots/fix5/ffx2-berserk-white-mage.png` — the BSK chip on Yuna's
  row, no command stack on screen. **Caveat, stated plainly:** the Leg's own 75%
  cast did not land on Yuna inside the capture budget (the same budget problem
  the critic's gap pass hit), so the status was written onto the live battle
  state through the debug console. Everything after that point is the real HUD,
  the real presenter and the real engine.

## Round 05 repair (2026-09-21)
