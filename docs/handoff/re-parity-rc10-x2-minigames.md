# Re-parity RC10, lane X2-minigames: Trigger Happy with no presses, Lady Luck's Dud and Two Dice (FFX-2 only)

Status: **built, tested, measured and pushed on branch `re-parity-rc10-x2-minigames`; not merged, not deployed** (2026-10-17). Base: `origin/r51-rc` at `d6dc0bdd7`. Tip: see section 1.
**Game case: FFX-2 only** (AGENTS.md rule 14), and why: Trigger Happy (Gunner) and Lady Luck's Dud and Two Dice exist only in FFX-2 (command rows `0x3032`, `0x31E5`, `0x30EB`, `0x317D`, `0x317E` of FFX-2's `command.bin`); nothing under
`src/battle/ffx`, `src/data/ffx` or `src/audio` is touched, and `ffx-engine-golden` and `ff7-golden` do not move. No boss number and no party number was changed or added. No screen was touched.
Owner's words: 2026-10-08 "It needs to be a 1:1 parity."; 2026-10-16 "keep going please all of this reverse engineering needs to be incorporated into our game"; 2026-10-17 "continue on please".
Sources (the lane's private notes, numbers only here): `D:\Tools\ffx-parity\coverage\ffx2\FFX2-H05.md` (Trigger Happy) and `FFX2-H04.md` (Lady Luck), section 7 of each, and rows S10 and S13 (E8, E10) of `coverage/gap-scan-2026-10-17.md`.

## 0. What changed, in player words

- **A Trigger Happy window you press nothing in now fires nothing.** Before, a player who never pressed (or whose window ran out untouched) got the command's full 60 shots: in Chapter VI, Yuna's opening Trigger Happy with no
  press took 59.97 hits and about 1,260 HP off the first target on average (60 seeds), where one press took 1 hit and 9 HP. Now no press takes no hit, no HP, no status, and starts no counter; the turn is still spent and the
  recovery is the same as after any Trigger Happy. One or more presses play **exactly** what they played (1, 5 and 16 presses read the same figures before and after).
- **The Dud no longer carries the gravity element.** The game's row for it has none. A girl who is immune to gravity used to take nothing from a Dud, one who absorbs it was healed, one who resists it took 37.5 percent and one
  weak to it was knocked out; now every girl takes the same 75 percent of her current HP, and the damage event it emits carries no element (it carried gravity), so its hit burst on a girl is the neutral one, not the gravity-coloured one (section 6, item 7).
- **Two Dice now does something.** It was a command that did nothing at all. It rolls two dice, plays as many hits as the dice add up to (2 to 12) at the caster's level times 2 per hit (no Protect, Shell or critical,
  never a miss, cost 4 MP); two dice that agree on 2 to 6 play the stronger row (level times 4 per hit) and two ones play level times 40 per hit, two hits. The dice are the game's own, and not fair (faces 1 to 6 come
  up 17.8, 19.5, 20.5, 14.6, 10.3 and 17.3 percent of the time). It is aimed at one enemy, and its charge is the row's 100 (the old tier was an estimate that charged about a quarter of that).
- **Nothing in any shipped fight changed.** No chapter's line casts Trigger Happy, Two Dice or a reel, no shipped build has learned Two Dice, and 12 seeds on all 12 FFX-2 chapters replay **byte for byte** (section 5).

## 1. Commits (oldest first, on `re-parity-rc10-x2-minigames`)

| Commit | What | Case |
|---|---|---|
| `78912b7cc` | S10: `StrikeOptions#shots` (`resolve-strike.ts`, `resolve.ts`), `execute.ts` and `simulate.ts` pass the press count as shots, `minigames.ts` and `adapt/command.ts` say why; `parity-ffx2-trigger-happy.test.ts` | FFX-2 only |
| `7e35fe194` | E8: the Dud's element `none` (`data/ffx2/abilities/lady-luck.ts`); `parity-ffx2-lady-luck-dud.test.ts`; the numbers-only row fixture `lady_luck_rows.json` | FFX-2 only |
| `94feee793` | E10: `kernel/die.ts` (die result and face generator), `dice.ts` (the engine seam), the three game rows (`command-records/lady-luck.ts`), Two Dice and its two swap abilities, `execute.ts` and `simulate.ts` wiring; `parity-ffx2-die.test.ts`, `parity-ffx2-two-dice.test.ts`, `dice_vectors.json` | FFX-2 only |
| `c1acef926` | `command-records/lady-luck.ts` cites its research with a confidence tag (`data-ffx2-citations` requires it); comments only | FFX-2 only |
| (the commit with this note) | this handoff | docs |

Contract files: none touched (`src/battle/common/types.ts`'s `TriggerHappyResult` already says "Range 0 to 16"), so there is no `CONTRACT-CHANGES.md` entry. Files under 400 lines (`simulate.ts` is 398, `resolve-strike.ts` 393).

## 2. What the game does for zero presses (source FFX2-H05)

- **Command start** (section 3.1): the class-0x28 branch arms the girl, then runs hit determination **with override 0**, so every target gets the row's own **60 planned hits** (row 0x3032: power 2, hits 60, accuracy formula 0, ATB cost 120); the cost is paid there.
- **A press is an input, not a hit** (sections 3.3 to 3.5, summary 2 to 4): the HUD turns a rising edge of one button into a byte counter, the girl's script polls it, **any number of presses between two polls make one shot**, and
  each shot raises one hit event that executes **one planned hit** per target. "Presses do not replace the row's hit count" (summary 2): the replace-by-sum rule is the dice's, not Trigger Happy's.
- **Nothing pays out the unspent hits** (section 3.5): the kind-10 action never flushes its remaining planned hits, and the full close (section 3.8: the countdown ending, no target left, a cancel) **removes the action**, the normal
  end of a Trigger Happy. So a window nobody pressed in raises no shot, no hit event, no damage, no result, and ends with the command paid. That is what `shots: 0` does; it was the one case the engine got wrong.
- **What the engine kept as its own reading** (rows 2 to 9 of the note's table, section 8 below): one hit per press up to 16, and the 6 to 16 stand-in for a player nobody is there to play.

## 3. What was decompiled, what is wired, what is live (Bailey's three states)

| Piece | Decompiled and proven in the harness | Wired into the engine | Live in a deployed build |
|---|---|---|---|
| Trigger Happy: zero presses plan 60 and execute none | yes (FFX2-H05: opener, press broadcast, poll, hit event on kind-10 records, close; 66,718 vectors, 0 mismatches) | **yes**, this lane | no (not deployed); a human who never presses is the only player it reaches |
| The Dud row `0x31E5` has no element | yes (data, three language copies agree; FFX2-H04 7 E8) | **yes**, this lane | no |
| Two Dice: die result `0x647620` and the face generator `0x685B80` | yes (10,000 and 200,000 vectors, 0 mismatches) | **yes**, this lane (`kernel/die.ts`, `dice.ts`) | no; nothing in a shipped build reaches it |
| The row `0x30EB`, the swap rows `0x317D`, `0x317E` | yes (read field by field from `command.bin`) | **yes** (records) | no |
| The Lv. 2 and Lv. 3 windows, the shot cadence, simultaneous users, the retarget cost | partly (window length proven; cadence inferred) | **no** (section 8) | no |
| The five-line reels, strips, stop order, charge-after-spin, Four Dice, Item and Random reels, CONGRATS! | yes (FFX2-H04 sections 3.1 to 3.8) | **no**: a visible redesign, needs Bailey's yes and a mockup | no |

## 4. Proof

**New tests, 49** (`parity-ffx2-trigger-happy` 12, `parity-ffx2-lady-luck-dud` 7, `parity-ffx2-two-dice` 22, `parity-ffx2-die` 8; the S10 and E8 tests **fail on the base**, run there):

- *Zero presses* (table from the note, independent of the code): 0, 1, 5, 16, 20 and 60 presses play 0, 1, 5, 16, 16, 16 hits; zero presses leave no damage, miss or heal event, still `action-start` and `action-end`, leave her recovery state exactly as five presses do,
  and leave the boss's HP untouched; a bare Trigger Happy (no result at all) rolls 6 to 16 on 12 seeds; `hitsFromOutcome`: null, 0, negative, 99. **On the base: 0 presses play 60 hits** (`AssertionError: expected 60 to be +0`).
- *Dud*: a girl normal, immune, resistant, weak or absorbing gravity takes the same 75 percent of her current HP, no event carries an element. **On the base: 1,000 HP kept (immune), 625 (resistant), 0 (weak: knocked out), 1,000 (absorbing).**
- *Two Dice, kernel* (`parity-ffx2-die`): the TypeScript walk equals the note's independent model call for call over **4,000 values** and at **11 state checkpoints**; the 1,412-call transient and the 185-value cycle (33, 36, 38, 27, 19, 32 of the values 0 to 5)
  and the six shares (17.8 to 10.3 percent) are asserted; the die result equals the note's oracle on **2,400 vectors** (faces 0 to 255, one to six dice). The vectors are `tests/fixtures/parity/ffx2/dice_vectors.json`, generated by
  `D:\Tools\ffx-parity\rc10\x2-minigames\gen-dice-fixture.py` from the note's `dice_face_model.py` and `emu_dice.py#die_oracle`.
- *Two Dice, engine*: the three records equal the game's rows field for field (`lady_luck_rows.json`, read from the three language copies of `command.bin`, which agree); with the generator placed so the faces are known (found in the note's value list, not by the kernel):
  faces 3+5, 1+2, 6+5, 4+4, 2+2, 6+6, 1+1 play 8, 3, 11, 8, 4, 12, 2 hits; a pair's first hit is exactly 2 times a mixed roll's and two ones' exactly 20 times; the 4 MP is paid once whichever row fires; the generator moves two calls a cast and the
  battle holds it; the first roll places it with one engine-side draw and is a function of the seed; Attack takes no draw and leaves no flag; 40 seeds, no miss; the advisor's preview quotes 3, 7, 11 hits and never touches the live battle.
- `data-ffx2-command-records` (the game's rows against the data layer) gets one early return for the three new records, which are pinned against their own fixture.

**Mutation pass** (`D:\Tools\ffx-parity\rc10\x2-minigames\mutate.mjs`, run in a copy of the tip so the lane's tree was never touched; the five test files above):

| # | The fault put into the changed source | Caught by | Result |
|---|---|---|---|
| M01 | zero shots plan the row's 60 again (the zeroing of the plan removed) | trigger-happy (3 tests failed) | caught |
| M02 | one press plays nothing (threshold 2) | trigger-happy (2) | caught |
| M03 | presses no longer reach the plan (5 presses play 60) | trigger-happy (6) | caught |
| M04 | a zero count is dropped before the strikes (read as no outcome) | trigger-happy (3) | caught |
| M05 | the dice sum is not handed on as the hit override | two-dice (9) | caught |
| M06 | equal dice do not swap the row | two-dice (1) | caught |
| M07 | the walk's constant off by one bit | die and two-dice (11) | caught |
| M08 | the low mantissa bit dropped | die and two-dice (10) | caught |
| M09 | a pair of twos is not a pair | die and two-dice (2) | caught |
| M10 | the transient one call short | die and two-dice (2) | caught |
| M11 | the generator is not kept in the battle | two-dice (2) | caught |
| M12 | the pair and ones rows swapped | two-dice (1) | caught |
| M13 | the Dud gets its gravity back | lady-luck-dud (6) | caught |
| M14 | the swap row does not pay the MP | two-dice (1) | caught |
| M15 | Two Dice power 3 in its record | two-dice (2) | caught |
| M16 | zero presses clamped up to one | trigger-happy (4) | caught |
| M17 | Two Dice aimed at any side again | two-dice (1) | caught |
| M18 | the preview's low sum changed | two-dice (2) | caught |
| M19 | the first roll always lands at position 0 | two-dice (1) | caught |

**19 of 19 caught** (M01 to M03 ran against all five test files, M04 to M19 against the files that own the rule, so a failure of its owner means the rule is pinned; the mutated copies were separate `git archive` copies of the tip, never this tree). A first draft of M19 (position 1 to 185) was an equivalent mutant (the position wraps) and was replaced.

**Other checks**: `npx tsc --noEmit` clean; `node tools/orphans.mjs`: `dice.ts` and `kernel/die.ts` are reachable (the 26 orphans are the existing ones); 32 related files run (the lane's four, `data-ffx2-*` command records / citations / ids / ranges / monster records, the Lady Luck suites, the minigame re-submit and stacking suites, the FFX-2 wiring, menu, hit, stream and rewards parity suites, `advisor-menu`, the audio SFX pin, the Valefor and Ixion chapter suites): **31 pass at the first run; the one failure, `data-ffx2-citations` (the new `command-records/lady-luck.ts` carried no section reference or confidence tag), is fixed in `c1acef926` and passes (115 tests)**. `ffx2-atb-golden`, `ffx-engine-golden` and `ff7-golden` **pass unchanged: no golden was re-pinned**. `audio-sfx-parity-pin` passes, so every ability, the Dud included, makes the same SFX cues as before. The full suite was not run (the brief). The 2 failures of `chapter-meta-ffx2-leblanc` (`public/art` is absent in a worktree) are identical on the base.

## 5. Measurements, with causes

Method: the shipped `ffx2-end-ledger-measure` harness (the shipped `intendedStrategy` plays each chapter's whole chain, an event-log digest per seed), run on the base `d6dc0bdd7` (a `git archive` copy) and on the tip, 12 seeds on all 12 FFX-2 chapters
(`ffx2-bahamut`, `-vegnagun-shuyin`, `-leblanc`, `-fallen-aeons`, `-trema`, `-den-of-woe`, `-ixion-djose`, `exp-leblanc`, `-masterpiece-theatre`, `-tourist-trap`, `-valefor-besaid`, `-angra-mainyu`).

| What | Result |
|---|---|
| Event-log digests, 12 seeds x 12 chapters (144 chains) | **144 of 144 identical** (outcome, links and the full event log), base against tip |
| Which shipped lines use the changed rows (every party command of every chain, 12 seeds each) | **none**: no Trigger Happy, Two Dice, Attack/Magic Reels or Dud in any chapter (the only Gunner/Lady Luck command anywhere is Cheap Shot, 72 casts in Chapter VI and its hidden copy). `intendedStrategy` takes the first Overdrive-kind row only when a chapter's tactic has no opinion; no tactic picks these, and no shipped build has learned Two Dice (`git grep` over `src/data/ffx2/builds`: Lady Luck is `owned`, never `learned`) |
| Movers | **none**, so the 500-seed human, Active and bench runs the brief asks for movers have nothing to measure: the changed code runs only when Trigger Happy fires, a Lady Luck Dud or Two Dice resolves, or the advisor previews Two Dice, and none of them is on a line of any pace |
| Advisor previews | Trigger Happy keeps 6, 11, 16 shots (`min`, `mid`, `max`); Two Dice is previewed at 3, 7, 11 hits (new; the command did nothing before, so there was no figure to move) |

**How the change shows for a human** (the only player it can reach: Trigger Happy's zero-press case is not on any shipped line). Probe `D:\Tools\ffx-parity\rc10\x2-minigames\zero-press-probe.test.ts`: Chapter VI, Yuna's first turn, Trigger Happy with `n` presses attached on the first target the menu offers, 60 seeds, base against tip:

| Presses | Hits, base | Hits, tip | HP off the target, base | HP off the target, tip |
|---|---|---|---|---|
| 0 | 59.97 | **0** | 1,258 | **0** |
| 1 | 1 | 1 | 9 | 9 |
| 5 | 5 | 5 | 54 | 54 |
| 16 | 16 | 16 | 209 | 209 |

Cause: the press count reached the hit determination as its *override*, where 0 means "no override" (the game's own rule, kept in `kernel/hit.ts`), so the row's 60 were played. A player who presses nothing now sees the overlay close on "0 HITS", the girl's action play with no shot, and the turn pass.

## 6. Modelling choices and disclosures

1. **Two Dice's dice are not a battle stream.** The game's face generator is global to the effect module and other effects draw from it, so where in its 185-value cycle a battle's first dice land cannot be known. The engine places it uniformly with **one draw of the engine-side stream
   (`aux`) at a battle's first roll**, keeps the walk in the battle's flags (`dieGenState`) and draws nothing otherwise, so no other command moves a stream. This is a modelling choice, not game data; the cycle, the transient and the faces are the game's.
2. **The MP of the swap rows** rides on the swap abilities (`mpCost` 4; the game's swap rows list 0 because the base row paid), because the engine charges the ability that resolves.
3. **Two Dice's cast cost is the row's 100** (the attached record wins over the ability's tier, as for every attached record, W4); the old tier was `CT_MEDIUM` (26, an estimate). This is the gap-scan row E12 for this one command; the reels' own charge tier is untouched.
4. **Two Dice is aimed at one enemy** (`single-enemy`, as Trigger Happy, whose row carries the same target word `0x433`), not at any side as before; a damaging command must not be offered on an ally.
5. **Trigger Happy's press count is `shots`, not `hitsOverride`.** For one or more presses the shots still reach the hit determination as before, so the event log of a cast is byte for byte what it was; `hitsOverride` keeps the game's meaning (0 = none) for the dice.
6. **`ResolvedCommand.hits`** (the enemy intent line's count) is unchanged for zero shots (the row's 60); nothing that strikes reads it.
7. **One small visible change, disclosed (Bailey sees it, no mockup was made):** the Dud's hit burst on each girl. The presenter keys the impact effect to the damage event's element (`BattlePresenterBeats.ts` line 169, `VFX.ts` has a gravity entry), so the burst that was the gravity one is now the neutral one. The hit sound does not change (`ELEMENT_SFX` has no gravity entry, so the cue was `damage` either way) and `audio-sfx-parity-pin` passes unchanged. Nobody can meet a Dud on a shipped line (no chapter spins the reels), so no player sees it today. If Bailey wants the gravity burst kept as presentation, it is a one-line presenter special case; the rule (no element ladder) stays. I did not look at the effect play.

## 7. CHANGELOG paragraph (plain words; for the main session to paste, not edited into `CHANGELOG.md` here)

**FFX-2 only.** Trigger Happy now follows the game when you press nothing: a window you never press in fires no shot, so the turn is spent and nothing is hit (it used to fire all 60 shots, a bug that only a player who pressed nothing could ever see; one press or more play exactly what they played).
Lady Luck's Dud no longer counts as gravity damage, as in the game's own table, so a girl's gravity affinity no longer changes how much of her HP it takes (75 percent of whatever she has left, for everyone). Lady Luck's Two Dice, which did nothing at all, now rolls two dice,
hits as many times as the dice add up to, hits harder when the two dice agree (twice as hard on a pair of 2 to 6, twenty times as hard on two ones) and costs 4 MP; the game's dice are not fair, so low faces come up more than high ones. Nothing in any chapter changed: every chapter replays byte for byte,
because no chapter casts any of these.

## 8. Items left out (and why)

| Item | Why it is not in this lane |
|---|---|
| H05 row 2/6: one hit per press up to **16** against a cadence ceiling of 7 to 14 shots; the 6 to 16 headless stand-in | the ceiling rests on inferred script constants ([I], the idle script was read, not run: note section 3.9, open questions 1 and 2), and the stand-in changes every held and automatic Trigger Happy of a seed. Not provable from the note. Needs the live-game session or Bailey's pick of a sourced answer |
| H05 row 3 (Lv. 1 window 1.8 s) | already equal |
| H05 rows 4 and 5: the Lv. 2 and Lv. 3 windows (2.2 s, 2.6 s) under a passive no code reads; `rapidShotWindow/Level/Run/Steps` in `kernel/auto-ability.ts` with no caller | the window length is proven, but which skill raises word 1 bit 14 or 15 is **open question 10** of the note ("the marker-to-row link was not re-checked"); wiring it also changes a visible time on the overlay. A small follow-up once the link is read: put `windowMs` from `rapidShotWindow(word1)` into the `minigame-request` params of `execute.ts`. Listed, not built |
| H05 row 8: a retarget after a kill costs the rest of the window and plans 60 for the new target | [I] from the re-validation's code and the clip lengths, never run; the engine's executed total is the same otherwise |
| H05 row 9: one press raises every armed girl's counter, several users | needs two simultaneous overlays (a UI redesign) |
| H05 row 10 (armed pose, holster tag, start clip delay) | presentation only |
| H04 E1 to E7, E9, E11, E14: five lines, 16-symbol strips (engine Dud rate 74.1 percent against 22.6 to 25.9), fixed stop order, spin-then-charge, targets chosen per result, Silence blocks 13 result rows, Four Dice, Item and Random reels, CONGRATS! | the **reels redesign**: a visible change, Bailey's yes and a mockup first (AGENTS.md rule 9) |
| H04 E12 for the reel results (cast cost 100) | check with the ATB lane; this lane only set Two Dice's, which carries its own record now |
| H04 E13: Pilfer Gil's 999,999,999 cap and the +0x61 marker | outside the lane's rows |
| The Dud's other fields against the game's row `0x31E5` (shatter 100 where the derived row has 0, cast cost 100 where it has an instant tier, target flags `0x35`) | not part of E8; no shipped line reaches the Dud. The pinned row is in `lady_luck_rows.json` for whoever attaches it |
| Four Dice | the note could not find where its faces come from (open question 3); the kernel handles four dice (rows `0x30EC`, `0x317F`, `0x3180`) and the engine rolls two |

## 9. How to re-run

```
node "D:/Final Fantasy/node_modules/typescript/bin/tsc" --noEmit -p .
TEMP=D:/Tools/ffx-parity/tmp/<lane> TMP=... node "D:/Final Fantasy/node_modules/vitest/vitest.mjs" run --maxWorkers=2 tests/unit/parity-ffx2-trigger-happy.test.ts tests/unit/parity-ffx2-lady-luck-dud.test.ts tests/unit/parity-ffx2-two-dice.test.ts tests/unit/parity-ffx2-die.test.ts tests/unit/data-ffx2-command-records.test.ts
PYREFLY_X2L_MEASURE=1 PYREFLY_X2L_SEEDS=12 PYREFLY_X2L_CHAPTERS=<the 12 ids> PYREFLY_X2L_OUT=out.json node "D:/Final Fantasy/node_modules/vitest/vitest.mjs" run --maxWorkers=1 --testTimeout=6000000 tests/unit/ffx2-end-ledger-measure.test.ts
```
Tooling outside the repo (`D:\Tools\ffx-parity\rc10\x2-minigames\`): `extract-rows.mjs` (the rows out of the three copies of `command.bin`, numbers only), `gen-dice-fixture.py`, `compare.mjs` (digests, base against tip), `zero-press-probe.test.ts`, `mutate.mjs`, `stage-commits.mjs`.
`D:\Tools\ffx-parity\tmp\x2-minigames\` was this lane's TEMP and TMP (the base copy, the mutation copy, the logs) and is deleted at the end.
