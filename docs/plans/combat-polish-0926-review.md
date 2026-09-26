# Batch 1 paper preflight: FFX-2 engine, combat data and chain spoils (2026-09-26)

The rule-15 paper preflight the thresholds program (§2, batch 1) asks for before a deep-class
build. Paper plus one read-only engine probe (NEW-C1, below). Nothing here is built.
**Game case per item** in the table; the batch as a whole is **both** (FFX-2 engine and data, plus
FFX builds).

## 1. Review class

`node tools/critic-plan.mjs --paths` over the batch's files (resolve.ts, engine.ts, statuses.ts,
gagazet.ts, fahrenheit.ts, encounters.ts, BattleScreenCarry.ts) answers **DEEP**: a focused review
of the production candidate before deploy, then live verification and the deep review on the live
build ("FFX-2 ATB engine is a shared system"; "chapter registry"). Its chapter list names only IV
and V for FFX-2; that is NEW-C3 (batch 5's fix). **Bench all six FFX-2 chapters anyway** (IV, V,
VI, XI, XIII, XV) and I, IX, X, XIV for the FFX data items.

## 2. House-rule traps found on paper

- `src/battle/ffx2/resolve.ts` is 485 lines and `engine.ts` 643: the F3 split (PR-0083) lands
  **first**, as a pure move, before any behaviour change touches them.
- `src/data/encounters.ts` is **399 lines** and a CONTRACT file. PR-0107's per-link flag must not
  grow it past 400: put the flag on the FFX-2 group data (`src/data/ffx2/**`) or a new module, and
  if `encounters.ts` changes at all, add the `docs/CONTRACT-CHANGES.md` entry.
- `src/data/ffx/builds/gagazet.ts` is 468 lines: PR-0179's arms go in a new module the build reads.
- PR-0138 may need `BattleScreenFlow.ts` (batch 4's, 508 lines): if so, batch 1 lands last and the
  edit is a one-line call into a new module.

## 3. Order, each with its failing test first

| # | item | game | change | sourced by | test first | risk and bench |
|---|---|---|---|---|---|---|
| 1 | PR-0083 / F3 split | FFX-2 | resolve.ts: targets and chain into `resolve-targets.ts`; engine.ts: outcome and stalemate out; both under 400 | house rule 7 | byte-identical seeded logs on IV, V, VI, XI, XIII, XV before and after | none if the logs match; any diff stops the batch |
| 2 | PR-0145 | FFX-2 | `results.ts:59` `partyAlive` also requires "not petrified" | ffx2-combat-core §2.8 `[verified: 2 sources]` | probe: all three petrified, defeat with 0 enemy actions | only reachable in all-petrified states; re-bench V and VI |
| 3 | PR-0108 | FFX-2 | at ATB SPEED = FAST, Sleep has no timed expiry | §1.5 `[single source: Split Infinity G1004]`, labelled; Bailey approved the row "fine if it's faithful" | at Fast, Sleep persists past its Normal duration | Fast only; the default is not Fast |
| 4 | PR-0107 | FFX-2 (Ch VI) | a per-link `separateBattle` flag gives Acts II and III randomised opening gauges; HP and MP still carry | §1.6 `[single source]`, §2 (separate battles) | seeds 1-20: first actor of Acts II and III varies, fills in 0-60% of required | **changes Ch VI balance**: first-try and within-five bench before and after; outside the accepted band, stop and ask |
| 5 | PR-0138 | FFX-2 | accumulate each link's EXP, gil and drops for FFX-2 chains; label the Sisters' AP conflict | ffx2-vegnagun-shuyin lines 203, 232, 261, 308, 435; ffx2-fallen-aeons lines 107, 129, 145, 149 | ledger unit test (V sum, XI includes Shiva's 8,000 / 2,000); FFX II and III unchanged | FFX chains grant once at the end (ffx-yunalesca line 94): leave them; FOC19-04 (Den per-shade) waits |
| 6 | Acta F4 guard | FFX-2 | `x2-vegnagun-acta-est-fabula` (`shuyin-abilities.ts`) gets `namedTargetsOnly`, or a test proves it never reaches the engine | D-193 (the engine's own row already has it) | unit test | none |
| 7 | PR-0106, PR-0054, PR-0069 | 0106 and 0054 FFX-2; 0069 FFX | labels only: the Leblanc failsafe reading as AUTHORED; the Vegnagun Break branch as an inference (D-214: GameFAQs' reading, labelled our estimate, if one exists); PR-0069's comment made to match the code | research/ffx-bfa-yu-yevon.md §2 **is silent on affinities** (it sources stats, moves and Luck 1), so PR-0069 is fixed by saying the possessed aeon keeps its data-file affinities, not by adding data | comment, test name and code agree | no behaviour change |
| 8 | PR-0174 | FFX | `fahrenheit.ts:212` Rikku sLv 53: re-derive from the +25 offset over the sourced 14-22 (ffx-seymour-anima-macalania.md §8.3), or label 53 as an estimate with its reasoning | §8.3 `[estimate]` | VIII and X rosters consistent, source tag in the file | prep display; re-bench VIII |
| 9 | PR-0179 arms | FFX | arms (a), (b), (c) built as OFF values (see `docs/plans/pr-0179-method-check.md`) | combat-core §6.4.3; ffx-isaaru-bevelle §5.1 P3 | each arm equals its sourced rows; OFF equals today byte for byte | bench I, IX, X, XIV per arm; one question to Bailey with the table |

Never tune a boss number: nothing above changes an enemy's stats. Items 2-5 move combat logs, so
every re-pinned golden log names its reason in the test, as the D-193 branch did.

## 4. NEW-C1: the lone White Mage in Chapter IV (read-only engine probe, run 2026-09-26)

**Game case: FFX-2 only** (Chapter IV, Bahamut; `bevelleBuild`). Rule 3: proved by running the
engine, not by reading it. Scratch script (Node type-stripping against `src/`, not committed),
the real `FFX2Engine` with the boot registries, the 'waiting' branch ticked as
`BattleScreenWiring.ts` does.

**Setup.** Seeds 1-20. The no-mitigation line (everyone swings; the White Mage, who has no Attack
row, cures) until Mega Flare leaves Yuna alone, which happens at decision 30-34 on every seed with
Yuna on 107-615 HP and Bahamut on 4,924-5,467 of 8,400. Her rows then: Cure, Shell, Protect, Esuna,
Cura, Vigor, Dispel, spherechange to **Gunner** or **Black Mage** (the two dresspheres one link away
on Protection Halo), and items. **Curse** (Bahamut's) had disabled both spherechange rows at that
moment on 6 of 12 seeds; Holy Water or Remedy (5 and 8 in the kit) lifts it.

| her line once alone | result |
|---|---|
| stay White Mage and heal (Cura or Cure under 90%, else Vigor) | **no outcome** after 1,500 decisions on 10 of 12 seeds (Bahamut untouched, Yuna never below about 107 HP); defeat on 2 of 12 |
| lift Curse, heal to 60%+, spherechange to Gunner, then Attack, Hi-Potion under 45% | **defeat 20 of 20**; she lives 5 to 32 decisions and takes Bahamut down to 3,592-5,459 |
| the same to Black Mage, then Fire | **defeat 20 of 20**; 6 to 37 decisions, Bahamut down to 3,311-5,394 |

So in this engine a lone White Mage **cannot win**, **can lose** (any damaging line dies in a few
dozen decisions), and **can stall forever** by healing. FFX-2 has no stalemate watch (FFX's is
400 turns), so the stall has no end except the pause menu. The shipped line never reaches it (the
intended strategy wins 200 of 200, per `tests/unit/strategy-ffx2-bahamut.test.ts`), and neither do
§2.4's Shell and Magic Break routes; the heal-only route without them does (1 of 30 wins since
D-193, per `docs/plans/ffx2-engine-fixes-2026-09-26.md`).

**What this settles, and what it does not.** It settles the engine question the Steam plan
(`docs/plans/steam-session-2026-09-26.md` item 8) asked to try first: the battle does continue
with one survivor, and the lone White Mage has a losing way out, so it is not a trap with no exit.
It does not settle whether retail lets a lone White Mage outlast Mega Flare, or ends the battle
when two of three fall; that stays item 8's cheap half in the approved Steam session (D-205).
**Recommendation:** record it as information for Bailey; build nothing now. If the Steam look shows
retail behaves the same, it is faithful and the options round in the program (§3 item 9: a guide
line teaching the spherechange, versus a long-stalemate defeat with RETRY) is the only follow-up;
an FFX-2 stalemate watch would be a new rule and needs his yes.

## 5. Checks before merge

`npx tsc --noEmit`; the touched vitest files; the full suite with `--testTimeout=60000`; the six
FFX-2 benches (human Wait split 1.5 s, Active 1.5 s, bench) and the FFX I, IX, X, XIV benches, all
before and after, in the handoff; `node tools/orphans.mjs`; a real-key Chapter V win whose results
show the summed spoils (item 5). Each commit carries its game case (rule 14).
