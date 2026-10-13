# Re-parity RC7 lane L-CMD: the FFX command rules (FFX-G07; wiring-plan lanes FFX-I and FFX-J)

Status: **built, tested and committed on branch `re-parity-rc7-cmd` (from `origin/re-parity-rc6-ch2`, `ab57f082`; its one later docs-only commit `f6af1e3b` is merged in); pushed to `origin/re-parity-rc7-cmd`; not merged to main, not deployed, not live** (2026-10-13).
**Game case: FFX only** (AGENTS.md rule 14). The decompiled note is `FFX-G07` (FFX.exe, Steam build 25501027); FFX-2 has its own executor and gates (lane X2-B). `ffx2-atb-golden` and `ff7-golden` pass unchanged; `src/battle/ffx2` and `src/data/ffx2` are untouched.
No boss number and no party number was changed or added. The condensed spec is `research/re-ffx-command-gate.md`; nothing from the note's open questions is used as a fact.

Bailey's words that govern the lane: 2026-10-08 "It needs to be a 1:1 parity."; 2026-10-11 "ok keep going ill go with all your recommendations please"; 2026-10-13 "i'll go with all of your recommendations", "so it can go in live builds asap", "keep going please full speed ahead".

## 1. What changed, row by row

Row ids are the wiring plan's (`coverage/wiring-plan-addendum-2026-10-13.md`, lanes FFX-I and FFX-J); "note" is the section of `FFX-G07` (condensed in `research/re-ffx-command-gate.md`).

| Row | The game's rule (proof) | Engine now | Seen in a shipped line? |
|---|---|---|---|
| I1 Half MP rounds up | Esuna 5 costs 3, Scan 1 costs 1; only the Magic Booster on a Black or White Magic spell takes the round-up away (emulated, 29,569 vectors; note 1) | `abilities.ts#mpCostFor` -> `kernel/command-gate.ts#mpCost` | no: no authored build wears Half MP (latent) |
| I2 One MP plus the Booster costs 2 | One MP makes a non-zero base 1 first, then the Booster doubles it (same vectors) | same | no: no build pairs them (latent) |
| I3 Silence reads the record flag | bit 0x20000 of the record's flag word: all 22 White and 19 Black Magic records (Scan and Esuna among them) and 26 monster records; Summon, Grand Summon, Doublecast, every Overdrive, Skill, Special, item and aeon command are **not** gated (emulated on every real record) | `abilities.ts#blockedBySilence` reads `ability.record.flagsMisc`; an ability with no game record keeps the old category reading (`close-in`, `omnis-volley`) | no: 0 cases in 5,500 chapter runs, see section 5 |
| I4 a Silenced Yuna can summon | the Summon list uses a static record with no flag | `commands.ts`: the Summon row is enabled under Silence (the dead `'Silenced'` reason is gone) | no (0 cases); the Silence card still says "no Summon": **driver**, section 7 |
| I5 Scan is gated under Silence | Scan is record 0x3032, type 2 (White Magic), flag set; the gate refuses it (named case, emulated) | consequence of I3 | no (0 cases) |
| J1 the cost check when a sub-action starts | Silence, MP and the Overdrive gauge are read again as the sub-action starts; a refusal fizzles with nothing paid (emulated, 40,001 vectors) | `command-start.ts#costGate` in `execute.ts` and in `doublecast.ts` (each cast checked on its own) | Doublecast only (no cost-gate refusal anywhere) |
| J2 no retarget, and nothing is paid unless the sub-action starts | a named target that is dead (unless the command may target the dead), gone or out of reach is dropped and **nobody takes its place**; a strict command with nobody left, or a mask that named someone and kept nobody, does not start (emulated, 30,000 vectors + 12,000 executor scenarios) | `targeting.ts#aimOf` (no draw), `resolveTargets` draws only for an empty aim, `command-start.ts#aimGate`; `execute.ts` pays MP, gauge and item **after** both gates | **yes**, 274 times in 5,500 chapter runs |
| J3 out of reach: message and an open turn | message when a target was out of reach and the action is not AI-requested; the entry is removed and the turn stays open for the user (message: emulated; turn: inferred) | the player's own chosen command shows the existing "Out of reach" wording and returns `rejected: true`; AI commands and reactions only fizzle | no |
| J4 Flee runs the Coward hook only for members in the battle, alive and not Petrified | emulated, 20,000 vectors | `escape.ts` (moved out of `execute.ts`, which was at 378 lines) | no: `canEscape` is false in every chapter |
| J5 a Silenced monster's Silence-gated record is refused | the same gate applies to every actor (a monster pays no MP) | the same `costGate` (an enemy has no Overdrive cost: its script owns the bar) | no: 0 Silenced enemy casts |

What a command that does not start leaves behind (`command-start.ts#fizzle`): no MP, no gauge, no item (one paid ahead by an Auto-Med style reaction is returned), no animation, no draw; the turn is spent at CTB rank 3 unless it is the J3 case. **Rank 3 is the note's inference** (the scheduler's reset value; the note says the exact amount is not established), see section 8.

## 2. Wired, and what stays decompiled

| Address | Role | State |
|---|---|---|
| 0x0078cf70 | MP cost | **wired** (menu cost, executor payment, Doublecast) |
| 0x0078c690 | usability gate | **wired**: its Silence test through `blockedBySilence` (menu rows and executor), the whole of it inside the cost check |
| 0x0078ab20 | cost check at sub-action start | **wired** |
| 0x00791fa0 | range and dead-target filter | **wired** (`kernel/command-range.ts`) |
| 0x00792210 | executor failure path | **wired** (fizzle, refund, open turn) |
| 0x007ada60 | Flee loop | **wired** (`escape.ts`) |
| 0x00799690, 0x0078a780 | reach, single Escape roll | already wired before this lane |
| 0x0078ce50 | which of a sub-action's two ids is the command | decompiled, **not built** (nothing in the engine reaches it) |
| Copycat branch of the cost check; Quick Pockets; Doublecast composition and who pays the first cast; the text of messages 0x300E, 0x3016, 0x3017; which formations disable Escape or Flee | open in the note (lane FFX-N) | **not built**; the existing "Out of reach" wording is reused |

Nothing is live: the branch is pushed only.

## 3. Proofs

| File | What it proves |
|---|---|
| `tests/unit/parity-ffx-command-gate.test.ts` (15 tests) | the kernels on hand-worked named cases from the note (Esuna 5 = 3 under Half, Scan 1 = 1, Fire 4 with the Booster and One MP = 2, Holy 85 = 43, Ultima 180 under the Booster) and by replay of `tests/fixtures/parity/ffx/command_gate.json` (1,000 MP-cost, 1,000 usability-gate and 1,000 cost-check vectors) and `command_range.json` (1,500 range vectors): stratified subsets of the emulator runs (29,569, 47,833, 40,001 and 30,000 vectors, 0 mismatches). The cost-check records were resolved from the install's tables; the range vectors were regenerated with the per-character state logged |
| `tests/unit/parity-ffx-engine-command.test.ts` (17 tests) | the **wiring**, against an independent oracle (`tests/unit/helpers/ffxCommandRig.ts`, which imports nothing from the kernels or the adapters): 3,000 generated casts over the whole ability catalog (the MP paid, the Silence gate, a refused cast starts nothing and pays nothing), the Overdrive gate for a party member, an enemy and an aeon (20-point bar), no retarget (dead, gone, out of reach, a dead ally, Life), the open turn only for a player's own command, an item spent only when the command starts and returned when it does not, Doublecast, Flee, Escape, and the menu (a Silenced Yuna keeps her Summon row) |
| mutation pass | 58 mutants of the production code, each putting one old or wrong rule back; **all 58 caught** (55 on the first run; the three tests added in `582efa7a` caught the other three). The list is in section 9 |
| three older tests, updated with the reason in the file | `yojimbo-callouts` (the Overdrive row needs Kimahri's gauge full when it starts), `yojimbo-repair` (an Attack named at a bystander now lands on nobody; it used to strike Yojimbo), `parity-ffx-ai-omnis-discs` (a blow out of reach of a disc is dropped; it used to fall on Seymour) |

`npx tsc --noEmit` is clean (run by path). `node tools/orphans.mjs`: no new orphan (the two FFX kernel orphans, `drops.ts` and `gear-drop.ts`, are lane FFX-M's).

## 4. Goldens

`ffx-engine-golden` (9 chapters, seeds 1 and 7, the whole chain, every link's full log) is **unchanged and green at 18 of 18: no digest moved, so nothing was re-baselined**. The pinned seeds never reach a changed path. `ffx2-atb-golden` (6 tests) and `ff7-golden` (3 tests) are green and untouched. Sin Face and Sin: the Fins and the Core are not pinned by the golden; the moved logs below are measured by the scratch lab instead.

## 5. Measurement (the shipped line of every FFX chapter, `setupForChapter`, `autoResolveMinigames` on)

Before = `origin/re-parity-rc6-ch2` (`ab57f082`, measured in this worktree before the first engine edit); after = the engine code of this branch (`f721b7b0`, unchanged in code since). `z` is the two-proportion z of the win rate. Scratch lab, outside the repo: `D:\Tools\ffx-parity\rc7-cmd\`.

**Every FFX chapter, 12 seeds:** every chapter has the same wins, party turns and party KOs before and after, and all 12 seeds of each are identical (outcome, turns, KOs): Flux 12/12, Yunalesca 12/12, Braska's Final Aeon 11/12, Macalania 12/12, Evrae 12/12, Yojimbo 11/12, Natus 11/12, Omnis 11/12, Isaaru 11/12, Sin: Fins and Core 11/12, Sin: Face 12/12.

**500 seeds (all 11 chapters, not only the movers; none moved):**

| Chapter | wins before | wins after | turns b / a | KOs b / a | z | flipped W>L / L>W | seeds identical (outcome, turns, KOs) |
|---|---|---|---|---|---|---|---|
| seymour-flux | 500 | 500 | 52 / 52 | 0.9 / 0.9 | 0.00 | 0 / 0 | 500 of 500 |
| yunalesca | 453 | 453 | 157.7 / 157.7 | 13.6 / 13.6 | 0.00 | 0 / 0 | 500 of 500 |
| braskas-final-aeon | 479 | 479 | 232.1 / 232.1 | 5.4 / 5.4 | 0.00 | 0 / 0 | 500 of 500 |
| seymour-anima-macalania | 470 | 470 | 54.7 / 54.7 | 4.7 / 4.7 | 0.00 | 0 / 0 | 500 of 500 |
| evrae-airship | 488 | 488 | 71 / 71 | 0.7 / 0.7 | 0.00 | 0 / 0 | 500 of 500 |
| yojimbo-cavern | 493 | 493 | 67.4 / 67.4 | 3.9 / 3.9 | 0.00 | 0 / 0 | 500 of 500 |
| seymour-natus | 483 | 483 | 33.5 / 33.5 | 1.7 / 1.7 | 0.00 | 0 / 0 | 500 of 500 |
| seymour-omnis | 462 | 462 | 95.3 / 95.3 | 0.8 / 0.8 | 0.00 | 0 / 0 | 500 of 500 |
| isaaru-via-purifico | 452 | 452 | 38.2 / 38.2 | 2.9 / 2.9 | 0.00 | 0 / 0 | 500 of 500 |
| sin-fins-core | 437 | 437 | 296.4 / 296.4 | 3 / 3 | 0.00 | 0 / 0 | 500 of 500 |
| sin-face | 500 | 500 | 45.3 / 45.3 | 0 / 0 | 0.00 | 0 / 0 | 500 of 500 |

**What fired (the J0 count, 500 seeds x 11 chapters; made with a scratch instrument that counts each rule and can put the old rule back, `D:\Tools\ffx-parity\rc7-cmd\zz-rc7-cause.tmp.test.ts`, not committed)**: it was run on the wired engine with ablation switches rather than before the wiring, which gives the same counts.

| Rule | Count |
|---|---|
| a started action refused by the cost check (Silence, MP or Overdrive gauge), either side | **0** |
| an MP cost that differs from the old formula (Half MP, One MP, the Booster) | **0** |
| an ability newly gated or newly freed by the Silence flag; a Summon row offered to a Silenced member | **0** |
| a Silenced enemy trying a Silence-gated record | **0** |
| the Coward hook run by a Flee | **0** (`canEscape` is false in every chapter) |
| a named target dropped by the range filter, no replacement | **274**: 149 in Braska's Final Aeon and 124 in Sin: the Face, every one the **second cast of Lulu's Doublecast aimed at the foe the first cast just killed**; and 1 in Yunalesca (seed 429) |

**The movers (the event log moved, the fight did not).** With the old rules put back by ablation, the whole-chain event-log digest moves on exactly the seeds that fired: Braska 149 of 500, Sin Face 124 of 500, Yunalesca 1 of 500 (seed 429); no other chapter has a moved log; **outcome, party turns and party KOs are identical on all 500 seeds of every chapter.** The causes, read from the logs:

- **Sin: the Face (Chapter XVIII's Doublecast line, D-694).** The first Firaga kills the last head; the old engine then paid the second cast's MP and hit the corpse (`mp-damage` plus a `damage` of about 3,000 on the dead head, then `action-end`). Now the second cast does not start: `action-end`, and the victory follows. The line still wins 500 of 500.
- **Braska's Final Aeon.** The same pattern at the first link's aeon (seed 6: 1 MP paid and 1,768 damage on a Braska aeon at 0 HP, in the old engine). 479 of 500 both before and after.
- **Yunalesca seed 429.** The party has just been wiped; her queued Hellbiter at three fallen members used to log an `action-start` and an `action-end` before the defeat. Now nothing starts. The defeat arrives the same turn.

**Cost.** The engine spends 6 to 15 percent more CPU on the same workload (25 seeds of Braska's chain: 6.03 and 6.09 s before, 6.42 and 6.97 s after; Omnis 2.38 s before, 2.47 and 2.61 s after; the decision count is identical): the aim is computed once for the gate and once for the resolution. In the whole-suite run `advisor-floor` timed out twice at its 15 s limit (Braska, Omnis) on a machine that other lanes share; run alone, while another suite was running, it passes (22 of 22; those two take 8.1 and 7.4 s). The extra CPU may have helped tip the loaded run, so the first thing to try if it recurs is the aim computed once (cache the gate's `aimOf`).

## 6. The whole suite (once, at the end of the code work)

The whole suite with `--maxWorkers=2` at commit `582efa7a` (the last commit that moved code; every later commit is a comment, one data description, docs and this note): 1,167 files, 18,032 tests (17,952 passed, 75 skipped, 1 todo, **4 failed in 3 files**): `exp-leblanc` (one painting's sha differs from the release tree's) and `engine/pose-scale-art` (8 measured subjects): both art-only, as on the base; and `advisor-floor` (the two 15 s timeouts above, Braska and Omnis; it passes alone). After the later commits: `tsc` clean and `parity-ffx-command-gate`, `parity-ffx-engine-command`, `ffx-engine-golden`, `ffx2-atb-golden`, `ff7-golden`, `data-ffx-tables-abilities` and `ffx-round04-engine` green.

## 7. What the release driver needs for any screen (nothing was edited here)

- **`src/ui/common/statusWords.ts:140-142`, `FFX_HINTS.silence`** (the FFX Silence card, shared UI text; **FFX only**: only that entry changes, the FFX-2 card at `:160-164` stays): the comment at `:140` and the card's `full` line say a silenced member has "no White or Black Magic and no Summon". The second half is now false: a Silenced Yuna can summon. Suggested words: `no White or Black Magic` (Scan counts as White Magic). The `short` form names only the cure and stays. No test pins the FFX card's words; add one with the edit.
- Menu rows: a Silenced Yuna's Summon row is no longer greyed; a Silenced member's Scan row is greyed with the existing reason "Silenced". No wording change, no new screen.
- A named target that dies before its attacker's turn now takes the hit from nobody (the turn passes). A player's own command at an out-of-reach target shows the existing "Out of reach" and lets the player choose again.
- `src/data/ffx/statuses/core.ts` (the Silence description, read by no screen) and the three lines of `research/ffx-combat-core.md` were corrected here (dated "Superseded 2026-10-13"). The comments in `abilities.ts` and `commands.ts` were fixed in the lane's commits.

## 8. Open items

- **A fizzled sub-action's CTB recovery is rank 3 by inference.** The note (4) infers the scheduler's reset value; FFX-G05 says the amount is not established. No shipped line reaches a cost-gate refusal, so nothing measured depends on it; the only fizzles seen (the 274 above) end an action that had nothing left to do.
- **The turn left open after "Out of reach" is the note's inference** from the flags the path sets and clears. Reached by no line.
- **Two latent data differences found while checking the MP byte against `command.bin`** (research doc section 2): Entrust (ours 0, the game's record 8) and the aeons' Nul-All (ours 0, the game's 4). No build offers Entrust; not changed (a number of a party command, not asked for in this lane). A decision for the driver.
- **Not built (lane FFX-N, gated):** Doublecast's two-pick composition and who pays the first cast; Quick Pockets and Copycat sequencing; Bribe's gil. Doublecast here keeps its per-cast payment and gains per-cast checks.
- **J4 (Flee), J1/J5 (the cost check) are wired though the instrument counts zero.** They are unit-oracle parity with no measured effect except the CPU above. If the release driver prefers only rules a chapter can reach, the cost check and Flee are the two to take out; the Doublecast and range parts are reachable.
- The scratch instrument is not committed; it lives in the scratch lab.

## 9. The mutants (each must be caught by a test)

| Mutant | Rule it breaks | Caught by |
|---|---|---|
| `mp-half-rounds-down` | Half MP rounds up | command-gate, engine-command |
| `mp-one-wins-over-booster` | One MP with the Booster costs 2 | command-gate, engine-command |
| `mp-booster-black-only` | the Booster doubles White Magic too | command-gate, engine-command |
| `mp-booster-every-record` | the Booster only boosts categories 1 and 2 | command-gate, engine-command |
| `mp-no-spellspring` | Spellspring makes the cost 0 | command-gate, engine-command |
| `mp-zero-flag-ignored` | the zero-cost flag zeroes the base | command-gate |
| `mp-one-for-zero` | One MP keeps a 0-MP spell at 0 | command-gate, engine-command |
| `mp-half-beats-one` | One MP wins over Half | command-gate, engine-command |
| `gate-silence-ignored` | a flagged record needs Silence 0 | command-gate, engine-command |
| `gate-silence-any-record` | only a flagged record is gated | command-gate, engine-command |
| `gate-curse-ignored` | Curse forbids an Overdrive | command-gate, engine-command |
| `gate-od-gauge-below-max` | an Overdrive needs the gauge at its maximum | command-gate |
| `gate-pending-forgotten` | the pending MP counts | command-gate |
| `gate-monster-pays` | a monster pays no MP | command-gate, engine-command |
| `check-od-vs-gauge` | the cost check wants the Overdrive cost in the gauge | command-gate |
| `check-free-od-marker` | the marker is set by the record, not the switch | command-gate |
| `range-user-out-of-reach` | the user is never out of reach | command-gate |
| `range-dead-kept` | a dead target is dropped unless the command may target the dead | command-gate, engine-command |
| `range-dead-always-dropped` | a command that may target the dead keeps them | command-gate, engine-command |
| `range-reach-leq` | a target at exactly the reach is kept | command-gate, engine-command |
| `range-no-count` | the out-of-reach targets are counted | command-gate, engine-command |
| `starts-strict` | a strict command needs a survivor | command-gate, engine-command |
| `starts-lenient` | a non-strict command starts with an empty mask | command-gate |
| `aim-retarget` | no retarget: nobody takes a dropped target's place | engine-command |
| `aim-dead-kept` | a named dead target is dropped | engine-command |
| `aim-reach-ignored` | a named target out of reach is dropped | engine-command |
| `aim-ally-dead-drops-revive` | a command that may target the dead keeps the dead | engine-command |
| `aim-pick-for-named` | an empty aim draws, a named aim does not | engine-command |
| `aim-all-empty-starts` | a multi-target spell with nobody left does not start | engine-command |
| `fizzle-keeps-turn` | a silent fizzle spends the turn | engine-command |
| `fizzle-message-to-ai` | only a player's own command shows the out-of-reach message | engine-command |
| `fizzle-message-in-reaction` | a reaction never keeps the turn open | engine-command |
| `fizzle-message-not-current` | the turn left open is the actor's own | engine-command |
| `fizzle-no-refund` | an item paid in advance comes back | engine-command |
| `fizzle-always-message` | a dead target alone is silent | engine-command |
| `cost-gate-off` | the cost is checked again when the command starts | engine-command |
| `aim-gate-off` | the range filter runs when the command starts | engine-command |
| `item-spent-first` | the item is spent only once the command starts | engine-command |
| `od-cost-aeon-100` | an aeon's Overdrive costs 20 | engine-command |
| `od-bar-unit` | an aeon's bar is 20 wide | engine-command |
| `od-enemy-pays` | an enemy has no Overdrive cost | engine-command |
| `silence-counter-lost` | the Silence counter is the character's | engine-command |
| `gate-flags-by-category` | the Silence flag is the record's | engine-command |
| `gate-type-by-category` | the Booster's category is the record's byte | engine-command |
| `mp-chr-no-buffs` | Spellspring reaches the MP cost | engine-command |
| `words-no-half` | Half MP Cost is in word A | engine-command |
| `words-no-one` | One MP Cost is in word A | engine-command |
| `silence-old-rule` | Silence follows the record flag (Summon is free) | engine-command |
| `mp-enemy-pays` | a monster pays no MP | engine-command |
| `menu-summon-silenced` | Summon is not Silence-gated | engine-command |
| `doublecast-no-check` | each cast is checked on its own | engine-command |
| `doublecast-no-aim` | a target the first cast killed is not hit again | engine-command |
| `doublecast-pays-fizzled` | a cast that does not start pays nothing | engine-command |
| `flee-all-members` | Flee skips the fallen, the Petrified and the absent | engine-command |
| `flee-petrified` | a Petrified member is skipped | engine-command |
| `flee-fallen` | a fallen member is skipped | engine-command |
| `flee-ejected` | a member not in the battle is skipped | engine-command |
| `escape-filtered` | the single escaper always runs the hook | engine-command |

## 10. Decisions for Bailey

None are needed for the rules (numeric parity under the 1:1 order; "Script wins" for the research lines that said otherwise). To disclose in the release note (FFX only): a Silenced Yuna can summon; a Silenced character can no longer cast Scan; the second cast of a Doublecast no longer strikes a foe the first cast already killed (and costs no MP); a blow named at a target that is gone, dead or out of reach lands on nobody instead of being sent to a random foe; the FFX Silence card's words change (the driver's edit).

## 11. Changelog paragraph (FFX only)

**FFX only.** The command rules now follow the game. A Silenced Yuna can still call an aeon, because only White and Black Magic (Scan included) are cut off by Silence; Scan, which the game files as White Magic, is now cut off too. Half MP Cost rounds up, as the game does (a 5 MP spell costs 3, not 2), and One MP Cost together with the Magic Booster costs 2. As an action starts it is checked again for Silence, MP and a full Overdrive gauge, and if it cannot start it costs nothing. A target that has died or gone by the time its attacker acts is no longer swapped for a random one: the attack lands on nobody. Lulu's Doublecast in Sin's Face and in Braska's Final Aeon no longer fires its second spell, or spends its MP, at a foe the first spell has already killed. Flee now counts only party members who are still in the battle. No boss number and no party number changed, and every chapter wins as often as before.
