# Re-parity, boss AI: Bahamut, the Vegnagun chain and Shuyin (Chapters IV and V) follow the game's own scripts

Status: **built and committed on branch `re-parity-ai-ffx2-a`, pushed, not merged, not deployed** (2026-10-10). Lane AI-FFX2 group (a) of
[the re-parity plan](../plans/re-parity.md) ([boss-AI preflight](../plans/re-parity-ai-review.md)); the source is the research note
[`research/re-ffx2-ai-bahamut-vegnagun.md`](../../research/re-ffx2-ai-bahamut-vegnagun.md), section 10 (rows B1-B5, B7, T1-T2, L1-L2,
N1-N3, C1-C4, H1-H6, R1-R4, S1-S2). Owner: Bailey. **Game case: FFX-2 only** (AGENTS.md rule 14): Chapter IV (Bahamut) and Chapter V
(the five links of Vegnagun and Shuyin). Nothing under `src/battle/ffx`, `src/data/ffx` or `src/battle/ff7` changed, and
`ffx-engine-golden` and `ff7-golden` pass unchanged.

Bailey, 2026-10-08: "It needs to be a 1:1 parity." 2026-10-09: "Use 14 from the files" (Mega Flare, already on this base, left alone).
2026-10-10: "go full speed ahead please i have a ton of usage on several other accounts".

The base is `931613a8` (release candidate 1's tree, the code of live release 39.4.3). Nothing on a boss or a party was tuned (hard rule 6 and the
lane brief): every number below is the script's own or a measurement.

**Read first:** Chapter V's chain gets harder, 430 to 323 wins of 500 on the shipped line (86.0 % to 64.6 %), and Chapter IV does not move
(500 of 500 both ways). The causes are in "Measurement". The game's script is what makes it harder; the one place where this lane chose a stand-in
(the near-weighted target search, see "What this lane assumed") is a single switch and its own ablation is in the table.
The goldens and the tests that pin these chapters' logs, win rates or advisor boards were re-baselined once ("Goldens and pinned tests"); two regression floors
(the Chapter V forty-chain bar, Bahamut's Magic Break route) were lowered to the new measured counts and are listed for Bailey (decision 7). The timers are still in
the engine's turns: the timer rows wait for lane W4.

## Commits (branch `re-parity-ai-ffx2-a`, base `931613a8`, oldest first)

| Commit | What |
|---|---|
| `818c4087` | the script rolls and target searches (`ai/script-rolls.ts`), the per-hit damage count the engine hands the scripts, the Head's 100-poll clock constants |
| `85f6e854` | the decision tables: Bahamut, the Vegnagun chain (Tail, Leg, Nodes, Core, Bulwarks, Head, Redoubts) and Shuyin, rows B1-B5, T1-T2, L1-L2, N1-N3, C1-C4, H1-H6, R1-R4, S1-S2, with their tests (`parity-ffx2-ai-*`) |
| `78627d00` | the enemy-intent previews (`intent.ts`) follow the new Bahamut countdown and Shuyin's gate; `enemy-intent` and `intent-committed-cast` re-aimed |
| `230564a7` | `ffx2-atb-golden` re-baselined once (60 digests, Chapter 5 outcomes), the Reflect test's seed list |
| `a899385a` | the other tests that pin Chapter IV and V logs or win rates: `ffx2-hit-closes-menu`, `ffx2-menu-cancel-delay`, `den-of-woe-carry`, `ffx2-atb-speed`, two strategy bars |
| `a536899c` | the three advisor-v3 boards re-searched on Vegnagun seeds (5, 84, 114) |
| `f765cde5` | one more Core test, the one the mutation check asked for (three answers do not speak) |
| (this note's own commit follows) | `docs/handoff/re-parity-ai-ffx2-a.md` |

## What the engine does now

Every boss script in this note's scope is the game's decision table, in our words, run on the engine's seeded stream. The shared pieces:

| Piece | Where | What it is |
|---|---|---|
| Script rolls | `ai/script-rolls.ts` | `random() % n` is one draw `int(0, 0xFFFF)` then the script's `mod`; a target search is one 31-bit draw: `searchr_nop` takes the `(value mod n)`-th candidate in slot order (Yuna, Rikku, Paine), `searchr` takes `r = value mod W` over the candidates' weights `1 + floor(32768 / floor((1 + d)(1 + 2a) + 1))` and the first candidate whose running sum reaches `r` (`r <= sum`, so the first slot owns one extra value). **No draw with fewer than two candidates**, and a search whose result the script throws away (the Tail's sweeps) still draws |
| Hits per result | `engineHooks.ts#notifyEnemiesDamaged`, `internal.ts` | `AiScript.onDamaged` gets a 4th argument, the number of separate HP-damaging results the action put on the enemy (the game's reaction entry runs once per result). Additive; older callers ignore it |
| Scene geometry | `ai/script-rolls.ts#SCENES`, `constants.ts#NEAR_WEIGHTED_TARGET_SEARCH` | The start positions of the four scenes whose bosses use `searchr` (numbers only; the Leg is the first enemy of its scene, Shuyin the fourth). See "What this lane assumed" |
| The Head's clock | `constants.ts` | `HEAD_FIRE_AT_TURN` 100 (was 240), `HEAD_LINE_INTERVAL` 20 (was 48), `HEAD_HALFWAY_LINE_AT` 51 |

## Rows B1 to S2

"Game" is the note's row; "Now" is what runs. Every row is built unless the last column says otherwise. Tests are in
`tests/unit/parity-ffx2-ai-{rolls,bahamut,vegnagun,core,head,shuyin}.test.ts`.

| Row | Fight | Now | Where |
|---|---|---|---|
| B1 | Bahamut | Curse is cast once, at his very first action, on a girl without it (near-weighted search); when every girl already has Curse the same poll goes on to the rotation. Never again | `ai/bahamut.ts` |
| B2 | Bahamut | Six actions a cycle: Attack x3, Impulse x2, the countdown, Mega Flare, then Attack again (no 12-action loop, no Curse in it) | `ai/bahamut.ts` |
| B3 | Bahamut | The countdown is five steps. **Timer row** (below): the game counts 5 x 150 polls on a running clock, here one Bahamut turn is one step. Slow, Haste and his HP do not enter the script | `ai/bahamut.ts`, `constants.ts#BAHAMUT_POLLS_PER_COUNTDOWN_STEP` |
| B4 | Bahamut | The windows show 5, 4, 3, 2 and then the 1 with the cast: no 0, and the first step of the count shows nothing (the first number comes when the first step ends). The count is still five turns long. `charge` events keep `turnsLeft` as the turns until the cast (4, 3, 2, 1, 0) | `ai/bahamut.ts` |
| B5 | Bahamut | Attack goes to a girl without Poison by the near-weighted search; all poisoned, to any living girl by the same search. Curse to a girl without it | `ai/bahamut.ts`, `ai/script-rolls.ts` |
| B7 | Bahamut | Not code: Impulse's row has neither damage bit (W3 put the game's row on the ability), so Shell, Protect and Magic Break never touched it. The strategy texts that say they do are listed under "Stale text" | none |
| T1 | Tail | The voice, then the opening sweep, then (below a quarter of his HP, strictly, `floor(34,200 / 4) = 8,550`) one more sweep, then the Jecht voice on a poll of its own, then Tail Beam. The half-HP sweep cannot fire | `ai/vegnagun.ts` |
| T2 | Tail | Tail Beam by the near-weighted search; the sweeps run a search they throw away (one draw with two or more girls) | `ai/vegnagun.ts` |
| L1 | Leg | A voice counter that rises on every poll; polls 2, 4, 5, 7, 10, 11, 12, 17 and 20 are voice lines; each other poll adds 1 to a turn counter and the fourth is Vita Brevis; the rest roll `random() % 4`: Break 25 %, Berserk 25 %, Slow 50 % | `ai/vegnagun.ts` |
| L2 | Leg | The status goes to a girl who lacks it by the near-weighted search; none lacks it: Absorb on any living girl by the same search (the Break fallback, which the old text had as an inference, is the script's) | `ai/vegnagun.ts` |
| N1 | Nodes | The colour changes on the poll that makes the counter 5; every damaging hit counts, one for each separate result (`onDamaged`'s 4th argument); a hit that deals nothing does not. In the game that poll issues nothing and the next poll comes one logic step later, so here the same turn goes on to act in the new colour: four actions in each colour | `ai/vegnagun.ts` |
| N2 | Nodes | A starts red, B green, C yellow, from the first moment (A's Null Physical and C's Null Magic are laid on in the data so a hit before the first poll meets them) | `ai/vegnagun.ts`, `data/ffx2/enemies/vegnagun-leg.ts` |
| N3 | Nodes | Green: Regen, Shell, Protect 20 % each and Cura 40 %, on the Leg. Red: Dies Irae or a Missile at one uniform girl 50 / 50. Yellow: Flare at one uniform girl or Firaga, Waterga, Thundaga, Blizzaga on the party, 20 % each | `ai/vegnagun.ts` |
| C1 | Core | Seven voice polls, silent (our story scripts have no text for them): its first poll; once when a girl has hit a Bulwark; three polls after the Bulwarks' fourth answer (then the count is forced to 8); two polls after its third Memento Mori (then forced to 8) | `ai/vegnagun-body.ts` |
| C2 | Bulwarks | Right: Shell 25 %, Protect 25 %, Regen 50 % on a uniform living monster of the link (itself included). Left: Break, Doom, Bio, Dispel 25 % each at one uniform living girl; `bulwark-bio` is a single-target move now (it was party-wide) | `ai/vegnagun-body.ts`, `abilities-vegnagun.ts` |
| C3 | Bulwarks | Physical and Magical attack detected go to the whole party; Hostile activity goes to the logged girl if she is up, else a uniform living girl. The single target is picked first, on every poll (a search, then `random() % 4`, then the spell's search) | `ai/vegnagun-body.ts` |
| C4 | Core | Its log is who hit it and what kind, by the command row's damage type bits (`flagsDamage & 3`: physical only, magical only, anything else), for any hostile action of a girl, whatever its outcome. Last one wins; the answering Bulwark spends it | `ai/vegnagun-body.ts` |
| H1 | Head | The phase changes only when both Redoubts are dead (one dead: the Head does nothing). Acta Est Fabula on both, the Head targetable, the flag up | `ai/vegnagun-head.ts` |
| H2 | Head | The shared clock: 100 polls of the Head (not its first and third phase-2 polls) and both Redoubts, Shuyin's lines at 20, 40, 60 and 80 (highest unspoken first when it has jumped), the halfway line once at 51, the world ends on the Head's first poll that finds 100 or more. **Timer row** (below): counted in turns | `ai/vegnagun-head.ts`, `ai/vegnagun-redoubt.ts`, `constants.ts` |
| H3 | Head | Agility 110 from its first poll (the data's 36 only decides its first gauge), 68 at every phase-2 poll | `ai/vegnagun-head.ts` |
| H4 | Head | The ladder is strict and integer (`floor(38,420 x k / 5)`: 30,736 / 23,052 / 15,368 / 7,684); one Nemo Ante Mortem Beatus the first time it is in a band it has not paid, a fall through several bands pays one and skips the rest | `ai/vegnagun-head.ts` |
| H5 | Head | Every separate HP-damaging result counts toward Odi Et Amo (15), in phase 2 only | `ai/vegnagun-head.ts` |
| H6 | Head | Pallida Mors picks its girl at the poll (uniform, one search) | `ai/vegnagun-head.ts` |
| R1 | Redoubts | Right: Break, HP beam, Blind, Flare; Left: MP beam, Slow, Dispel, Demi. **A correction to the note:** its text says the Right's first phase-2 action is Break, but phase 2 can only begin after both Redoubts have died and a death sets the Right's counter to 1 (the Left's to 0), so the Right opens with the HP beam and the Left with the MP beam (this module's older rotation had the same order, for a different reason) | `ai/vegnagun-redoubt.ts` |
| R2 | Redoubts | Status moves prefer a girl who lacks the status (Break: not Petrified; Blind: no Darkness; Slow: no Slow), else any living girl; every pick is the uniform search | `ai/vegnagun-redoubt.ts` |
| R3 | Redoubts | A revive advances the turn counter (a revive uses up one of the four places); a death resets it (Right 1, Left 0); with the twin dead the pattern is act, act, revive. The Head becomes targetable the moment the second one falls | `ai/vegnagun-redoubt.ts` |
| R4 | Redoubts | **Not built; timer row.** In the game the idle phase-1 poll comes round every logic step, so the revive is queued within one step of the twin's death; here a poll that issues nothing spends a turn | listed |
| S1 | Shuyin | Terror of Zanarkand goes to the girl wearing her Special 1 dressphere (Yuna's, then Paine's, then Rikku's; a later check wins), else to the near-weighted search's pick. There is no Yuna-first rule. The Attack of turn 1 is near-weighted; the Attacks of turns 3, 5, 7 and the Spin Cut are uniform; Hit & Run and Force Rain take the party | `ai/shuyin.ts` |
| S2 | Shuyin | The voice-line gate: a poll with the gate open flips `random() % 2`; heads shuts the gate and picks one line of a pool of 5 (above half HP) or 7 (below, strictly) by `random() % 5` or `% 7`; an unspoken line is spoken and the poll ends, a spoken one falls through to the attack; the poll after a heads never flips | `ai/shuyin.ts` |

Rows not in this lane's list and left alone: B6 (Mega Flare 14, Bailey's answer, already on the base), A1 to A5 (damage-type bits, W3's command records),
G1 (the generic time-out never runs).

## Timer rows, for the W4 merge

Script timers count AI polls, which are logic steps (29.97 a second, 0.033367 s a step); lane W4 is moving the FFX-2 engine's clock onto the logic
step. On this base **every timer is still counted in this engine's units (turns), only the decision logic changed.** Each row below gives the game's
value in polls and in seconds (polls x 0.033367) and what runs here, so W4 can replace the turn counts by poll counters. Cadences are the note's section 8 (units / 95 a step, rounded up).

| Row | Game, in polls | Seconds | Here (this base) |
|---|---|---|---|
| B3, the countdown | 5 steps x 150 = **750 polls** from the moment he is ready after the second Impulse (a girl's Wait submenu freezes it; Slow, Haste and a long action do not change it; the effects of Attack, Fire and four monster casts did not stop it) | 25.03 s of running clock | **5 Bahamut turns** (`ai/bahamut.ts#COUNTDOWN_TURNS`, `constants.ts#BAHAMUT_COUNTDOWN_START`): about 13.4 s at his 2.68 s runway, and Slow does lengthen it. W4: drop the five silent turns for a poll counter that adds 1 per logic step while he is ready and the clock runs |
| B4, the windows | 5, 4, 3, 2 at polls 150, 300, 450, 600; the 1 with the Mega Flare cast at poll 750 | 5.01, 10.01, 15.02, 20.02, 25.03 s | turns 2 to 6 of the countdown (turn 1 silent); `turnsLeft` 4 to 0 |
| H2, the Head's clock | **100 polls** that raise the shared counter: every phase-2 poll of the Head except its first and third, and every phase-2 poll of both Redoubts (all of them issue a command, so a poll is a turn) | not a time: at the Head's 337-step Mors Certa cycle (184 charge + 153 recovery, AGI 68) it is 11.24 s a Head turn, a speaking poll 92 steps (3.07 s), a Redoubt's Full-Life 439 + 176 steps (14.65 s + 5.87 s) | 100 turns of the three, counted at each poll (`HEAD_FIRE_AT_TURN`). **The clock in seconds is the structural change that waits** (preflight section 3): what 100 polls come to in seconds depends on each command's length in the engine, and until W4 puts recovery and charge on the game's units this engine's turns are shorter or longer than the game's by move |
| N1, the colour change | one poll with no command, followed by the next poll one logic step later | 0.033 s | folded into the Node's next action (0 turns). Without the fold a Node would lose a whole turn (5.56 s at its 16,666-tick runway) at every change |
| R4, the idle poll | a Redoubt (and the Head, with exactly one Redoubt left) is polled every step, so a revive is queued within one step of the twin's death | 0.033 s | a poll that issues nothing spends a turn: a Redoubt's 4.86 s runway (14,583 ticks), the Head's 2.10 s. **Not built** |
| Voice polls | a speak command, recovery 60: Leg 17,142 units (181 steps), Core 16,666 (176), Tail 5,172 (55), Head 5,405 (57) in phase 1 and 8,695 (92) in phase 2, Shuyin 4,477 (48) | 6.04, 5.87, 1.84, 1.90 / 3.07, 1.60 s | a null turn of one runway: Leg 6.67 s, Core 6.48 s, Tail 2.01 s, Head 2.10 / 3.38 s, Shuyin 1.74 s |
| The Braska pair | two speak commands queued together run back to back without a poll between | 2 x 3.07 s | one null turn, then the queued second one as another null turn with no logic or draw between (`queuedSpeech`) |
| H3, the first gauge | the Head's init sets Agility 110 before its first gauge | 2.10 s runway | the data still gives 36 for the first gauge only (6.31 s); the script sets 110 at its first poll and 68 at each phase-2 poll |
| Thinking time | 0 for these actors, plus exactly 30 steps for every party member dead or petrified (note section 1.1) | 1.00 s a girl | not modelled (W4) |

The note's "every gauge freezes while an effect plays" claim (E1) was **not built**: the 2026-10-09 measurement contradicts it.

## Owner-decision check (done first)

`DECISIONS.md`, `docs/target/decisions.json` and `docs/target/decisions-early.json` were searched (every field of every row, then titles and results for
Bahamut, Vegnagun, Shuyin, Redoubt, Bulwark, Node, Mega Flare, Impulse, countdown, fail clock, cannon, Curse, Absorb and target bias). **No row of this
lane contradicts an owner decision, so no row was left unbuilt for that reason.** The decisions that touch these fights, and what each does here:

| Decision | What it says | Here |
|---|---|---|
| D-024, D-193 | Acta Est Fabula heals only the two Redoubts (sourced) | kept: the Head passes the two Redoubts' ids and `extra.namedTargetsOnly` still holds; the script's "every other monster" is the same two in this scene |
| D-214 (PR-0054) | where research is silent, use GameFAQs' reading, labelled our estimate | the Leg's Break fallback (Absorb) was exactly such an inference; the script answers it the same way, so it is now sourced |
| D-251 | the lone White Mage versus Bahamut stall stays recorded as faithful information, no new stalemate rule | unchanged; `ffx2-bahamut-lone-healer.test.ts` passes without edits |
| D-205, D-258 | a Steam HD session (not yet scheduled) may settle the Bahamut stalemate check and other facts | not run; the lane never ran the game |
| Bailey, 2026-10-09 | "Use 14 from the files" (Mega Flare) | already on the base, left alone |

Two earlier design notes in the code were estimates, not decisions, and the script answers them: the Head's 240-turn clock (`constants.ts` called it an
`[estimate]`, "not Authentic") and the "Shuyin hunts Yuna" reading (a one-source PS2 reading shipped with a `shuyinTargetsAnyone` toggle). The toggle is gone with the rule.

## What this lane assumed or chose (each is one place to change)

1. **The near-weighted search's geometry (rows B5, T2, L2, S1).** The weight rule is proven against the exe (the note ran it in four geometries); the positions
   and facing at the moment of each poll are the note's open item "Targets in practice" [L], and this engine tracks neither. The stand-in is the scene's own
   **start positions** (`PlayerPos` / `EnemyPos` of the scene files, numbers only; the Bahamut ones are the note's own worked example) with the boss facing the middle of
   the party, which is that example's geometry. The weights it gives: Bahamut 631 / 349 / 349 (Yuna 47.6 %, Rikku 26.3 %, Paine 26.2 %); the Tail 30.8 / 37.5 / 31.7, the Leg 32.2 / 38.9 / 28.9 and Shuyin 48.4 / 26.7 / 25.0 (the first slot owns one
   extra value, the last one fewer). The girls do move in a real fight (a melee girl stands next to the boss; the boss turns to its target), so these are the
   odds at rest. `constants.ts#NEAR_WEIGHTED_TARGET_SEARCH = false` makes every one of those picks uniform again. **A decision for Bailey**; the ablation below says what it does.
2. **One stream for both of the game's.** `random()` (stream 2) and every search (stream 4) draw from the engine's one seeded stream; the search's raw value is a 31-bit
   draw (the note does not record its width). Adopting each game's own streams is the separate decision (plan P3) and is not made here.
3. **The Node colour-change poll** is folded into the next action (see N1 and the timer table).
4. **The countdown's first turn is silent** and the count stays five turns long (the numbers 5, 4, 3, 2 come on turns 2 to 5 and the 1 with the cast) so its length on this base is what it was; B4's
   text is "5,4,3,2,1 at polls 150..750, the 1 with the cast" and the first number comes at the end of the first step.
5. **Voice lines with no text.** The Core's seven, the Head's phase-1 and phase-2 extras (Jecht, Auron, Braska, the two at HP lines, the three random ones) have no entry in our story scripts, and new
   player-visible text needs Bailey's yes, so those polls are turns of silence (the poll's cost is real). The names already bound still fire: the Leg's `farplane-voice` (nine polls, with the speaker and the
   poll in its payload), the Tail's two, the Head's `shuyin-line-1` to `-7` and `jecht-no-overtime`, Shuyin's `shuyin-taunt` / `shuyin-desperate`. `auron-halfway` fires at the clock's 51 where
   the game has a Braska line there: the binding is Auron's text, so the speaker is wrong (listed below).
6. **Data touched** (three one-line facts, none a number): the Head starts `untargetable` (the script's init), Nodes A and C start with their colour's Null Physical / Null Magic as `autoStatuses`, and the
   fallback ability `bulwark-bio` aims at one girl. The Head's table Agility (36) is left; the script sets it.
7. **Shuyin's Special 1 check** looks at the living girls only (the game's job test does not ask whether she is alive).
8. **The Core's log fires on a hostile action** (damage, miss, status, MP damage, a dispel), whatever its outcome; whether a Scan or a Libra counts as "a result applied" is not in the note.
9. **A Redoubt's death** is noticed by `onDamaged` and `onTurnResolved` (a death by a Poison tick with no other action would be seen at the next action); the Head becomes targetable at the second one.

## Proofs

**Decision-table tests, one file per fight** (the engine's own scripts, driven with a scripted generator so each roll is a known value; the titles name the row):

| File | Fight | `it` blocks | Rows walked |
|---|---|---|---|
| `parity-ffx2-ai-rolls.test.ts` | the shared rolls and searches | 11 | the weight rule, `r <= sum`, no draw under two candidates, slot order, scene positions, `random() % n`, `lacking` |
| `parity-ffx2-ai-bahamut.test.ts` | Bahamut | 17 | B1, B2, B3, B4, B5, B7 (and the live engine's Curse-once cycle) |
| `parity-ffx2-ai-vegnagun.test.ts` | Tail, Leg, the three Nodes | 21 | T1, T2, L1, L2, N1, N2, N3 |
| `parity-ffx2-ai-core.test.ts` | Core, both Bulwarks | 21 | C1, C2, C3, C4 |
| `parity-ffx2-ai-head.test.ts` | Head, both Redoubts | 28 | H1 to H6, R1 to R3 (R4 is the timer row that waits) |
| `parity-ffx2-ai-shuyin.test.ts` | Shuyin | 14 | S1, S2 |

`ffx2-ai-bahamut` (13), `ffx2-ai-vegnagun` (16) and `ffx2-ai-shuyin` (13) are the older AI files, rewritten to the game's rows.

**The note's interpreter tallies reproduced** (`parity-ffx2-ai-rolls.test.ts`, by running the pick over every value of `r` in `0 .. W - 1`):

1. the near-weighted search head-on, boss at (0, 30) facing the party, girls at (0, -20), (-17, -25), (17, -25): weights 631 / 349 / 349, picks 632 / 349 / 348 of 1,329, **47.6 / 26.2 / 26.2 percent**, and the same counts through the script's own `searchNear` with exactly one 31-bit draw each;
2. the same search facing away: **35.0 / 32.7 / 32.3 percent**;
3. the uniform search: the `(raw mod n)`-th candidate for every raw value;
4. and from the other fights: the Leg's `random() % 4` over every value (Break 25, Berserk 25, Slow 50 percent), the Nodes' green and yellow tables and the Bulwarks' tables (the percentages in the rows above), and Shuyin's lines counted over every pick: a given unspoken line is next **1 in 10 above half HP and 1 in 14 below** (13,108 / 13,107 ... of 65,536; 9,363 / 9,362 ... of 65,536 for the pool of seven).

**Mutation check** (`final/run-mutants2.sh`, `mutants.json`): 24 single-row patches of the final tree (one exact-text edit each, put back after every run, tree checked clean), each run against the nine AI test files (153 tests, green unmutated). **24 of 24 turn the suite red on an assertion** (none on a timeout). The first pass killed 23; the survivor was M12 (the Core's voice after the Bulwarks' answers coming at three answers instead of four), so `parity-ffx2-ai-core` got one more test (three answers do not speak) and M12 is killed too (21 tests there now). The mutants, by row: M01 Curse on every poll instead of once (B1); M02 the second Impulse one step late (B2); M03 Poison ignored in the Attack search (B5); M04 the first countdown step shows a number (B4); M05 the Tail's extra sweep at half HP instead of a quarter (T1); M06 a Leg voice poll missing (L1); M07 Break, Berserk and Slow a third each (L1); M08 the Nodes change colour at 4 (N1); M09 a Node counts one a action, not one a damaging result (N1); M10 Node B starts red (N2); M11 the Core revives the Left Bulwark first (the Core's cycle); M12 as above (C1); M13 the physical answer swapped for the magical (C3); M14 the damage bits read as 3 for physical (C4); M15 the phase changes when any Redoubt is dead (H1); M16 the ladder inclusive instead of strict (H4); M17 the clock fires strictly above 100 instead of at 100 (H2); M18 a Redoubt's death does not reset its counter (R1, R3); M19 the revive after one action instead of two (R3); M20 the Special 1 override order reversed (S1); M21 the voice gate never shut (S2); M22 the weights pick strictly below the running sum (the search rule); M23 the clock counts the speaking polls (H2); M24 the ladder pays back the skipped bands (H4).

**The suite** (once, at the end, on the final tree, `vitest run --maxWorkers=4 --testTimeout=300000 --hookTimeout=300000` because the PC was shared with other lanes and the 15-second default timed several files out in the first run): `tsc --noEmit` clean; **1,007 test files passed, 2 failed, 7 skipped (1,016); 15,751 tests passed, 2 failed, 60 skipped, 1 todo**. The two failures are art-only, as expected without the local painting masters and not touched by this lane: `exp-leblanc` ("serves Chapter VI's art exactly as the release tree holds it": the sha256 of `yuna-white-mage/hurt.png` differs on this disk) and `engine/pose-scale-art` ("every measured subject is current": the yuna-white-mage paintings changed since they were measured). `ffx-engine-golden` (18 tests) and `ff7-golden` (3) pass unchanged. `node tools/orphans.mjs` lists nothing this lane added (`script-rolls.ts` is imported by the AI modules). The first full run (before the dependent tests above were re-baselined) had 41 failures: the real ones are the re-baselined tests in the table above, and the rest were 15-second timeouts under load that pass in the final run (`advisor-floor`, `advisor-note`, `advisor-v4-purity`, `sin-fins-core-bench`, `ui-pause-stack`).

**Through the live engine** (not just the scripts): the Bahamut test plays Curse once and the six-action cycle on the real engine; the Nodes test feeds `onDamaged` through the engine hook (one per HP-damaging result, none for a hit that deals nothing); the goldens, the strategy tests and the 500-seed measurement below all play the chapters through the app's own path.


## Measurement (the shipped `intendedStrategy`, the group's chapters, seeds 1 to 12 and 1 to 500)

`tests/unit/ffx2-parity-measure.test.ts` (`PYREFLY_MEASURE=1`) plays each chapter through the app's own path on the shipped intended line.
**Before** is `931613a8`'s sources (this lane's changed files put back for the run, restored byte for byte after); **after** is this branch.
Nothing on a boss or a party was tuned. Means are per whole chain.

| Chapter | Seeds | Wins before | Wins after | Party turns (mean) | Engine turns (mean) | Minutes (mean) | Party KOs (total) |
|---|---|---|---|---|---|---|---|
| IV, Bahamut | 12 | 12 of 12 | 12 of 12 | 42.2 to 42.0 | 69.0 to 68.4 | 1.5 to 1.5 | 0 to 0 |
| IV, Bahamut | 500 | 500 of 500 | 500 of 500 | 42.1 to 42.2 | 68.7 to 69.0 | 1.5 to 1.5 | 2 to 4 |
| V, the five links | 12 | 12 of 12 | **8 of 12** (seeds 2 to 5 lost) | 107.9 to 100.6 | 217.4 to 233.2 | 4.6 to 4.5 | 63 to 68 |
| V, the five links | 500 | **430 of 500 (86.0 %)** | **323 of 500 (64.6 %)** | 97.3 to 90.1 | 198.3 to 201.5 | 4.1 to 3.9 | 2,748 to 1,946 |

One chain win rate on 500 seeds has a standard error of about 2 points, so Chapter IV does not move and Chapter V's fall of 21.4 points is real.
The per-link split (500 seeds; a link counts only the seeds that reached it; "KOs" is party KOs per fight):

| Link | Fights, won, % before | Fights, won, % after | Engine turns before to after | KOs before to after | Lost fights before / after |
|---|---|---|---|---|---|
| 1 Tail | 500, 497, 99.4 | 500, 498, 99.6 | 20.9 to 20.6 | 0.28 to 0.14 | 3 / 2 |
| 2 Leg and Nodes | 497, 453, 91.1 | 498, 417, **83.7** | 49.6 to **64.7** | 0.89 to 1.06 | 44 / **81** |
| 3 Body and Bulwarks | 453, 446, 98.5 | 417, 413, 99.0 | 40.8 to 33.5 | 0.03 to 0.02 | 7 / 4 |
| 4 Head and Redoubts | 446, 438, 98.2 | 413, 325, **78.7** | 56.9 to **77.6** | 0.11 to 1.92 | 8 / **88** |
| 5 Shuyin | 438, 430, 98.2 | 325, 323, 99.4 | 46.1 to 37.5 | 4.80 to 1.67 | 8 / 2 |

The chain loses 70 seeds before and 177 after: 37 more in link 2, 80 more in link 4, 10 fewer in links 1, 3 and 5. Chapter IV: Curse is cast 2.89 times a
fight before and exactly once after (867 to 300 casts in 300 fights), Attacks and Impulses per fight rise a little because the Curse turns are gone, and the fight
takes 1.52 and 1.53 minutes of game time (300 seeds). Raw rows: `D:/Tools/ffx-parity/ai-ffx2-a/` (`before-*`, `after-*`, `probe-*`, `final/`).

### Ablation: what moved each mover

Each row puts one old behaviour back into the final tree as an exact-text patch (the lists are `ablations*.json` in that folder), plays seeds 1 to 300 of the
Chapter V chain on the intended line, and restores the file. The control is the final tree on the same 300 seeds (chain 195 of 300, 65.0 %; the base commit on the
same seeds is 262 of 300, 87.3 %). Win % is of the fights that reached the link; the control's value is in brackets.

| Put back | Row | Link | Win % with it back | What else moves |
|---|---|---|---|---|
| Every near-weighted pick uniform (`NEAR_WEIGHTED_TARGET_SEARCH = false`) | B5, T2, L2, S1 | chain | 64.0 chain (65.0) | no link moves by more than noise (link 2 84.3 against 83.9, link 4 77.7 against 79.0); Chapter IV 300 of 300 both ways, engine turns 68.9 against 69.0 |
| All three Nodes start red, no starting Null Magic on C | N2 | 2 | **93.0** (83.9) | engine turns 48.6 (65.2), KOs 0.74 (1.01); chain 77.7 % |
| Green support 25 / 25 / 25 / 25 | N3 | 2 | 77.6 (83.9) | the script's 20 / 20 / 20 / 40 is easier on the party than a quarter each |
| Break, Berserk, Slow a third each | L1 | 2 | 80.3 (83.9) | the script's extra Slow (50 %) is easier on the party than a third |
| A Node counts one a action, not one a damaging result | N1 | 2 | 83.9 (83.9) | no move |
| The Core's seven voice polls removed | C1 | 3 | 98.4 (98.8) | no move in wins; engine turns 38.0 (33.8) |
| The Right Bulwark's idle spells only at the Core | C2 | 3 | 99.6 (98.8) | engine turns 37.3 (33.8): about half of link 3's shortening (40.8 to 33.5) |
| The Head keeps the table's Agility 36 in both phases | H3 | 4 | **100.0** (79.0) | 248 of 248, KOs 0.00 (1.97); chain 82.7 % |
| Phase 1 at 110, phase 2 at 36 | H3, phase 2 | 4 | **100.0** (79.0) | KOs 0.00; chain 82.7 % |
| Phase 1 at 36, phase 2 at 68 | H3, phase 1 | 4 | **100.0** (79.0) | KOs 0.02; chain 82.0 % |
| Phase 2 left at 110 (a sensitivity, not an old behaviour) | H3 | 4 | 3.6 (79.0) | KOs 6.02: the link is very sensitive to how often the Head acts |
| Clock 240, lines every 48 | H2 | 4 | 71.8 (79.0) | no better: the clock ended 11 of 413 link-4 fights (2.7 %, 500 seeds); the other 77 losses are wipes |
| Phase change when any Redoubt is dead | H1 | 4 | 79.0 (79.0) | no move |
| A Redoubt's death does not reset its turn counter | R1, R3 | 4 | 37.1 (79.0) | the script's reset protects the party: without it Break (Petrify) comes early |
| Yuna whenever she is alive, every single-target pick | S1 | 5 | 98.5 (99.5) | **KOs 4.54 (1.76), engine turns 48.8 (37.9)**: the old values were 4.80 and 46.1 |
| No voice-line gate | S2 | 5 | 97.4 (99.5) | KOs 2.28 (1.76): the lines give the party a breath |

Causes, link by link:

* **Link 1, the Tail**: no mover (99.4 to 99.6 %). The quarter-HP sweep and the Jecht voice moved a turn; the beam's aim is near-weighted.
* **Link 2, the Leg and the Nodes (91.1 to 83.7 %, 49.6 to 64.7 engine turns): N2.** A green Node (B) and a yellow Node (C) from the first moment mean the Leg is healed
  (Cura 40 %), shielded (Shell, Protect 20 % each) and regenerated from the start, where the old engine had all three Nodes red and no support until the colours turned.
  Putting the three red Nodes back takes the link to 93.0 %. N1 (five polls, hits per result), N3 (20 / 20 / 20 / 40) and L1 (Slow 50 %) do not hurt the party: with N3 or L1
  put back the link gets harder, not easier.
* **Link 3, the Body (98.5 to 99.0 %, 40.8 to 33.5 turns):** no change in wins. The Right Bulwark now spreads Shell, Protect and Regen over the monsters of the link (itself
  included) where the old one aimed them all at the Core; that is about half of the shortening, the Bulwarks' single-target spells and the other rows the rest.
* **Link 4, the Head and the Redoubts (98.2 to 78.7 %, KOs 0.11 to 1.92): H3.** The script sets the Head's Agility to 110 for the first phase and 68 at every poll of the
  second; the table's 36 is what the engine used. Either half alone, put back to 36, takes the link to 100 % (248 of 248). So the Head acts about 1.9 times as often in phase 2
  and 3 times as often in phase 1 as before. The fail clock (H2) is not the mover: it ends 2.7 % of the link's fights and putting 240 back does not win more. R1 and R3 are the
  only reason the link is not much harder still (37.1 % without the death reset).
* **Link 5, Shuyin (98.2 to 99.4 %, party KOs per fight 4.80 to 1.67, engine turns 46.1 to 37.5): S1, then S2.** The old script aimed every single-target move at Yuna whenever
  she was alive; the game's script has no such rule (Terror of Zanarkand goes to the girl in her Special 1 dressphere, the rest are searches). Putting the Yuna rule back restores
  KOs 4.54 and 48.8 turns. The voice-line gate adds about half a KO's worth of relief.
* **Chapter IV, Bahamut: no mover.** 500 of 500 both ways. The row that changes the most (B1, one Curse where there were about three) changes what the girls spend turns on,
  not the result.

### Off the shipped line: the researched routes against Bahamut (`strategy-ffx2-bahamut`, 30 seeds each)

Chapter IV's intended line wins 500 of 500 both ways, but the test file also plays three alternative routes, and one of them moved: the Shell route (no Breaks)
30 of 30 before and after, the heal-only route 30 of 30 before and after, and the **Magic Break route (no Shell, no cure spells) 21 of 30 before, 14 of 30 after**.
Ablation (`final/mb-old.log`, `mb-uniform.log`): the base commit's sources 21; the final tree 14; the final tree with the near-weighted search switched off
(`NEAR_WEIGHTED_TARGET_SEARCH = false`, every pick uniform) **19**. So the near-weighted search accounts for 5 of the 7 lost wins; the other 2 are the script's own rotation (Curse once, the six-action cycle). The mechanism is a reading, not a
measurement: the search puts 47.6 percent of his Attacks on Yuna at the scene's start positions, and this route gives her no Shell and no cure.
This is the one place where the stand-in geometry (assumption 1) shows in a win count, on a line the shipped game does not use; it is in "Decisions for Bailey".

## Goldens and pinned tests re-baselined once ("game-script parity")

One re-baseline, taken from the final tree; every moved digest has a cause. Case: FFX-2 only. `ffx-engine-golden` and `ff7-golden` import nothing this
lane changed and pass unchanged. Chapter VI's hashes (Leblanc) and Chapter XI's did not move anywhere (they run none of these scripts).

**How the causes were found.** A scratch test wrote a fingerprint of the full event log of every seed (a hash of each event plus its type, actor and
what), once with the base commit's sources put back for the run and once on this branch, and `logdiff` compared them event by event (raw rows:
`D:/Tools/ffx-parity/ai-ffx2-a/logdiff.txt`, `logdiff.json`, `final/logs1500-*`). The Active D = 1500 arm was fingerprinted as well as D = 0.

| Test | What moved | Cause (first event that differs) | Result |
|---|---|---|---|
| `ffx2-atb-golden` | all 60 digests: `CH4_D0` and `CH5_D0` twenty each, `CH4_D1500` and `CH5_D1500` ten each | **Chapter 4, 22 of 30 seeds:** Bahamut's first action, the Curse's girl, now one 31-bit near-weighted search where the engine drew one float (rows B1, B5): D = 0 seeds 1-4, 7-11, 13, 16-18, 20; Active seeds 1-4, 7-10. **The other 8:** the Curse lands on the same girl by chance and the first difference is the aim of a later Attack (D = 0 seeds 5, 6, 12, 14, 15, 19; Active 5, 6). **Chapter 5, all 30 seeds, inside the Tail's link and nowhere earlier:** either the first Tail Beam's aim, now near-weighted (D = 0 seeds 1, 4, 8, 11-14, 17, 19; Active 1, 2, 4-9), or the next damage roll after the opening sweep, because that sweep runs a target search the script throws away and still draws once (rows T1, T2; D = 0 seeds 2, 3, 5-7, 9, 10, 15, 16, 18, 20; Active 3 and 10) | Chapter 4: 20 of 20 (D = 0) and 10 of 10 (Active), as before. Chapter 5, D = 0: **14 of 20** (was 20 of 20; seeds 2, 3, 4, 5, 14 and 20 are lost); Active: 1 of 10 (seed 5; was 2 of 10). The test now pins the outcome string `WddddWWWWWWWWdWWWWWd`. The Wait arm still equals the D = 0 arrays and a Wait engine switched to Active still equals the Active arrays |
| `ffx2-hit-closes-menu` | 6 of 9 hashes (Chapters IV and V, seeds 1-3, D = 0, Wait split) | the same first events; the six equal `CH4_D0` / `CH5_D0` seeds 1-3 again. Chapter VI's three did not move | no menu closes in any of the nine |
| `ffx2-menu-cancel-delay` | 24 of 36 hashes (release-17 rule and the default, Active and split, Chapters IV and V); Chapter VI's twelve did not move | the same two causes (Bahamut's first action, the Tail's first beam or the roll after its sweep) come before any hit can land on an open menu, and the release-17 rule, the pace and the split change only how an open menu closes; the Active rows were fingerprinted, the split and release-17 rows move with them by construction and were not fingerprinted separately. The default's Active rows equal `CH4_D1500` / `CH5_D1500` seeds 1-3 | `false` still plays a rule distinct from the default on every row (asserted) |
| `chapters/den-of-woe-carry` | Chapter 5's 8 of 32 hashes (they equal `CH5_D0` seeds 1-8) | the Tail's link, as above. Chapters 6 and XI and the Sisters did not move | pass |
| `ffx2-atb-speed` | one assertion: "every speed wins Chapter 5 seeds 1, 2, 3, 7, 42" | Normal loses seeds 2 and 3 now, and a marginal chain does not end alike seed by seed at another speed (measured at D = 0 over seeds 1-20: Slow wins 13, Normal 14, Fast 12, on different seeds; Chapter 4 is 20 of 20 at all three) | rewritten to what the lever promises: Chapter 4 won on every seed at every speed, Chapter 5's win count within 4 of Normal's 14 |
| `ffx2-vegnagun-reflect-immunity` | its seed list (25 seeds less the ones where the cast cannot resolve) | the Leg and Nodes' story changed seed by seed: Yuna reaches her menu and the cast resolves on every seed but 19, and on 11 Paine is down when it lands | list 1-25 less 11 and 19 (was less 1, 7, 11, 22, 23); no assertion changed |
| `strategy-ffx2-bahamut` | the Magic Break route's bar | the route is re-measured at **14 of 30** (it was 21; the Shell and heal-only routes stay 30 of 30). Ablation (`final/mb-*.log`): the near-weighted search alone is 5 of the 7 wins (19 of 30 with every pick uniform) | bar 15 to 10, a floor below the new count |
| `strategy-ffx2-vegnagun-shuyin` | the forty-chain bar | the shipped line wins **25 of 40** (it won 40; 323 of 500 against 430). Causes: the Head's Agility (H3) and the Nodes' starting colours (N2), see "Measurement" | bar 36 to 20, a floor below the new count; **a decision for Bailey** |
| `advisor-v3-final` | two boards pinned by seed: C2-B1's held Mega Phoenix at Vegnagun (seed 59) and C2-M1's held Megalixir at Vegnagun (seed 15) | the Vegnagun chain follows its scripts, which is a different replay of every seed, so the boards were searched again over the seeds in order with the tests' own conditions (scratch copies of the probes). Mega Phoenix: first board at seed 5. Megalixir: seeds 1-83 have none, 84 is the first, and the card's top there is the Mega-Potion the test asserts | seeds 59 to 5 and 15 to 84; no assertion changed |
| `advisor-v3-repair` | FB1's search (Vegnagun and Fallen Aeons, seeds 1-40) found no charging Mega-Potion that lands inside the projection | the same cause: Vegnagun seeds 1-113 and Fallen Aeons seeds 1-100 have none, 114 is the first | the search takes a first seed and starts at Vegnagun 114; no assertion changed |
| `ffx2-ai-bahamut`, `-vegnagun`, `-shuyin`, `enemy-intent`, `intent-committed-cast` | assertions that pinned the old rules (the 12-action loop, the Curse every cycle, the Yuna rule, the half-HP sweep, 29 percent Protect on the Bulwark's sample) | the new decision tables | rewritten to the game's rows; the old text is in git at 931613a8 |

The moved digests are **not** noise or a hidden bug: both Bahamut's first poll and the Tail's opening sweep now draw their target searches as the game does
(one 31-bit value, none with fewer than two candidates, one that the script throws away), and every later roll follows from that one draw; the
event logs agree up to it.


## Stale text, listed and not rewritten (player-facing wording needs Bailey's yes)

* `src/data/guides/ffx2-bahamut.ts` (Chapter IV's strategy guide): line 100-101 "The 12-action loop: Curse, three physicals, two Impulses, then five countdown turns and Mega Flare" (Curse is
  once, the cycle is six actions); lines 40 and 93 "five dead enemy actions" (the game counts 750 polls on a running clock, 25.03 s; here five turns); line 79 "Mega Flare lands on the turn the number
  reaches zero" (it lands with the 1; there is no 0); lines 25, 30, 54 and 69 claim Magic Break cuts Impulse to 6.25 % and Shell halves it (B7: Impulse's row has neither damage bit; W3 put the row on, these
  texts predate it); line 74 "Only his turns 2-4 are physical" (the cycle is Attack x3 then Impulse x2).
* `src/data/guides/ffx2-vegnagun-shuyin.ts` (Chapter V's guide): line 40 and 59 say Terror of Zanarkand "hunts one character" and is Protect-reducible (A4: neither damage bit, Protect does not halve it; it goes to the girl in her
  Special 1 dressphere, else the search's pick); lines 64 and 157 say Nemo Ante Mortem Beatus "fires at each 20% milestone" (one Nemo the first time the Head is in a band it has not paid, a fall through several bands pays
  one and skips the rest, at most four).
* Comments in `src/engine/tactics/ffx2-bahamut.ts` (lines 13-14 "a fixed 12-action loop ... Curse, three Attacks ...", the Shell and Magic Break arithmetic at 24-27 and 69) and in
  `src/engine/tactics/ffx2-vegnagun-shuyin.ts` (lines 129-135 "Why the healer is Yuna, against §7.2's advice" rests on the PS2 Yuna rule that is gone; line 60 on the Nodes' colour counter at 4). The
  tactics' behaviour is unchanged.
* `src/battle/ffx2/intent.ts:307`, the Bahamut note "The Mega Flare countdown is an action counter, not a clock - Slowing him slows it too": true of this engine until W4, false of the game (Slow and Haste do not change it). **Also in `intent.ts`** (the enemy-intent panel's player-facing notes; the previews themselves follow the new scripts because the panel dry-runs them): line 288, the Bulwark note "Answers whoever last struck the Core, by that hit's class", is now true only of Hostile activity detected (C3: the physical and magical answers go to the whole party; line 285, which says which answer follows which class of hit, is still right). Left as written: new player-visible wording needs Bailey's yes.
* `research/ffx2-bahamut.md` lines 144, 490-491, 537, 566 and 570 (Shell halves Impulse, Magic Break scales it), `research/ffx2-vegnagun-shuyin.md` lines 272-274 (the Nodes change at 4), 778-783 (the Redoubt rotation and its first
  action), 800-809 (the Yuna rule and the interrupts as per-turn chances), and `research/re-ffx2-ai-bahamut-vegnagun.md` row R1 (the Right's first phase-2 action is the HP beam, not Break: a death resets its counter).
* Story bindings: `auron-halfway` is Auron's line and the game's line at the clock's 51 is Braska's; `farplane-voice` (Jecht's "Forget the lights up top. The leg's the job.") plays at each of the Leg's nine voice polls (capped at two a
  battle by `story/showCaps.ts`) where the game has Jecht, Auron and Braska in turn. Nothing was rewritten.

## Merging with the other lanes (shared files this lane changed)

Everything else is in `src/battle/ffx2/ai/{bahamut,shuyin,vegnagun,vegnagun-body,vegnagun-head,vegnagun-redoubt,script-rolls}.ts` and
`tests/unit/`. Lane W4 edits `ai/paragon-oversoul.ts` and the engine core; this lane touches neither. Files outside the AI modules:

| File | Change | Conflict risk |
|---|---|---|
| `src/battle/ffx2/ai/script-rolls.ts` | **New in this lane, and also new in `re-parity-ai-ffx2-b` and `re-parity-ai-ffx2-c`** (three add/add conflicts, three different APIs). This one exports `scriptValue(rng)`, `scriptMod(rng, n)` (the same two names and signatures as lane c's), `inSlotOrder`, `spendSearchDraw`, `searchUniform`, `searchNear`, `lacking`, `SCENES`, `nearWeight`, `sceneWeights`, `pickIndexByWeights`. Lane b's `scriptMod(ctx, n)` takes the context, not the generator. | Real. Merge the three into one file: keep lane c's and this lane's `scriptValue` / `scriptMod(rng, n)` (identical), add this lane's near-weighted search and scene table, and give lane b's context-taking helpers their own names |
| `src/battle/ffx2/internal.ts` | `AiScript.onDamaged` gets an optional fourth argument `hits` (additive). Lanes b and c add `onResult` / `onResults` hooks to the same interface a few lines away | small, textual |
| `src/battle/ffx2/engineHooks.ts` | `notifyEnemiesDamaged` passes the count of separate HP-damaging results (new `damageHits`). Lane c adds `notifyEnemiesResults` and a line in `runAfterActionHooks` | small, textual; lane c's per-result tally is the same idea (one report per action) and could replace `damageHits` |
| `src/battle/ffx2/index.ts` | export list: `bahamutStep`, `bumpNodeCounter` and `classifyAttack` are gone (nothing imported them), `classifyDamageBits` is new | none expected |
| `src/battle/ffx2/constants.ts` | `HEAD_FIRE_AT_TURN` 240 to 100, `HEAD_LINE_INTERVAL` 48 to 20, new `HEAD_HALFWAY_LINE_AT`, `BAHAMUT_POLLS_PER_COUNTDOWN_STEP`, `NEAR_WEIGHTED_TARGET_SEARCH` | W4 may touch the same block for the timer rows |
| `src/battle/ffx2/intent.ts` | Bahamut's silent first countdown turn still shows Mega Flare as the thing being counted to | none expected |
| `src/battle/ffx2/abilities-{core,shuyin,vegnagun}.ts` | a comment each, and `bulwark-bio` targets one girl (`single-enemy`) instead of all | none expected |
| `src/data/ffx2/enemies/{bahamut-abilities,vegnagun-head,vegnagun-leg}.ts` | a comment; the Head starts `untargetable`; Nodes A and C start with Null Physical / Null Magic | none expected |
| `src/story/registry.ts` | a comment only (the Head's lines are at the clock's 20/40/60/80 and 51) | none |

No file in `docs/CONTRACTS.md` changed, so there is no `docs/CONTRACT-CHANGES.md` entry. `ffx-engine-golden` and `ff7-golden` import nothing this lane changed.

## Open items

1. **Timer rows wait for W4** (the table above): the countdown's 750 polls, the Head's 100-poll clock in seconds, the Node colour-change poll, the Redoubts' idle poll (R4, not built), the voice polls' real lengths, the Head's first gauge (36 against 110) and the 30-step thinking time for a girl who is down. This lane left every timer in the engine's turns.
2. **Positions and facing for the near-weighted search** (note section 9, "Targets in practice", [L]): the engine tracks neither, so the odds are the scene's start positions with the boss facing the party. The switch is `NEAR_WEIGHTED_TARGET_SEARCH`; on the shipped line the ablation shows no measurable effect on any win rate (Chapter IV 500 of 500 both ways, Chapter V 64.0 % against 65.0 % on 300 seeds). It does move one off-line route: Bahamut's Magic Break route (no Shell, no cure spells), 14 of 30 with it and 19 of 30 without (21 on the base).
3. **One random stream for both of the game's** (`random()` stream 2, the target searches stream 4): the engine feeds both from its one seeded stream. Adopting each game's own streams is plan P3 and not this lane.
4. **Silent voice lines.** The Core's seven, the Head's extras (Jecht, Auron, Braska, the two at HP lines, the three random ones) and seven of the Leg's nine have no text in our story scripts. They are real polls (a turn of silence). New player-visible text needs Bailey's yes.
5. **Rows the note marks [M] or [L]** that this lane did not need: whether a Scan or a Libra counts as "a result applied" for the Core's log (assumption 8), the battle-local flags between the five links (assumed zero), whether the number windows pause the clock, which commands raise the "action executing" flag (so whether Bahamut's own Impulse or Mega Flare, a girl's Special, an item or a summon freezes his 750-poll countdown).
6. **Stale text** (the list above) is for Bailey's yes: strategy guides, the two tactics modules' comments, `src/battle/ffx2/intent.ts:307`, three research files.
7. **The advisor boards are rare now.** Three advisor-v3 tests find a board by running Chapter V over seeds; under the game's scripts the Mega Phoenix board is at seed 5, the Megalixir board at 84 and the charging-Mega-Potion board at 114 (found by a scratch search; the tests pin the seed). If Chapter V changes again they are searched again the same way.
8. **Wait-split and release-17 rows of `ffx2-menu-cancel-delay`** were re-pinned from the final tree and attributed to the same first events as the Active arm, which was the one fingerprinted event by event; they were not fingerprinted separately.
9. **R1 correction to the note.** The note says the Right Redoubt's first phase-2 action is Break. The script's own death entry sets its turn counter to 1 and the action entry adds 1 before it chooses, so the first action after the phase change is the HP beam (the Left starts at its MP beam). I read the Right Redoubt's script text on this machine to confirm it (reference only, nothing copied into the repo). The note should be corrected.

## Decisions for Bailey

1. **Chapter V's chain is harder, and the biggest cause is one script fact (H3).** The Head acts at Agility 110 in its first phase and 68 in its second (the table's 36 is replaced by its own script); put the table's 36 back for either phase and link 4 is won 248 of 248 on 300 seeds (98.2 % before this lane). This is the game's number, so it ships as built; if you want the win rate held where it was until lane W4 puts the clock on the game's units, it is the two `self.stats.agi = ...` lines in `ai/vegnagun-head.ts` (one at its first poll, one at every phase-2 poll) and nothing else. Recommendation: ship it (1:1 parity is the instruction), and tell players the Head link is harder.
2. **The Leg link is harder too (91.1 % to 83.7 % of fights won).** The cause is the Nodes' starting colours (B green and C yellow from the first moment, N2): a green Node heals and shields the Leg from the start. Same recommendation.
3. **`NEAR_WEIGHTED_TARGET_SEARCH`**: on (the game's odds at rest) or off (every pick uniform). On the shipped line it moves no win rate, it moves who gets hit; on Bahamut's Magic Break route (off the shipped line) it is 5 of the 7 lost wins out of 30. Recommendation: leave it on, and revisit it when the engine tracks positions and facing (open item 2).
4. **Silent voice lines** (open item 4): write the text, or leave the polls silent.
5. **The halfway line** (`auron-halfway`) is Auron's line in our story binding and Braska's in the game: rebind, or leave.
6. **Stale guide text**: rewrite the Chapter IV and V strategy guides to the new rules (the list is above); it is player-facing, so it waits for your yes.
7. **Two regression floors in the tests were lowered to the new measurements** (`strategy-ffx2-vegnagun-shuyin`: the practice line must win 20 of 40 chains, was 36, now 25 measured; `strategy-ffx2-bahamut`: the Magic Break route 10 of 30, was 15, now 14 measured). They are floors below what the game's scripts give, not targets; the first one says in words that Chapter V is no longer "reliably winnable" on that line. If you would rather hold Chapter V where it was until the clock lands (decision 1), the knobs are listed there.

## Re-run commands (from the worktree root; Node 24; always `--maxWorkers=4` or less)

```
node "D:/Final Fantasy/node_modules/typescript/bin/tsc" --noEmit
node "D:/Final Fantasy/node_modules/vitest/vitest.mjs" run --maxWorkers=4 tests/unit/parity-ffx2-ai-rolls.test.ts tests/unit/parity-ffx2-ai-bahamut.test.ts tests/unit/parity-ffx2-ai-vegnagun.test.ts tests/unit/parity-ffx2-ai-core.test.ts tests/unit/parity-ffx2-ai-head.test.ts tests/unit/parity-ffx2-ai-shuyin.test.ts tests/unit/ffx2-ai-bahamut.test.ts tests/unit/ffx2-ai-vegnagun.test.ts tests/unit/ffx2-ai-shuyin.test.ts tests/unit/enemy-intent.test.ts tests/unit/intent-committed-cast.test.ts tests/unit/ffx2-atb-golden.test.ts tests/unit/ffx2-vegnagun-reflect-immunity.test.ts tests/unit/ffx2-bahamut-lone-healer.test.ts
node "D:/Final Fantasy/node_modules/vitest/vitest.mjs" run --maxWorkers=4 --testTimeout=600000 tests/unit/ffx2-hit-closes-menu.test.ts tests/unit/ffx2-menu-cancel-delay.test.ts tests/unit/chapters/den-of-woe-carry.test.ts tests/unit/ffx2-atb-speed.test.ts tests/unit/strategy-ffx2-bahamut.test.ts tests/unit/strategy-ffx2-vegnagun-shuyin.test.ts tests/unit/advisor-v3-final.test.ts tests/unit/advisor-v3-repair.test.ts tests/unit/advisor-v3-inflight.test.ts
PYREFLY_MEASURE=1 PYREFLY_MEASURE_SEEDS=500 PYREFLY_MEASURE_CHAPTERS=ffx2-bahamut,ffx2-vegnagun-shuyin PYREFLY_MEASURE_OUT=<file>.json node "D:/Final Fantasy/node_modules/vitest/vitest.mjs" run --maxWorkers=4 tests/unit/ffx2-parity-measure.test.ts
```

`--testTimeout=600000` on the second line is for a loaded PC: these files are seconds of work alone, and under a busy machine the 15-second default timed several of them out (that is a timeout, not a failure of the rule). The mutation check (24 single-row patches, each of which must turn the nine AI files red on an assertion, not a timeout) is `D:/Tools/ffx-parity/ai-ffx2-a/final/run-mutants2.sh` with `mutants.json` beside it, a scratch driver outside the repo; the boards were found with a scratch copy of each probe (`final/zz-ffx2-a-boards.tmp.test.ts`).

The measurement before is the same command with `931613a8`'s sources (`git show 931613a8:<path>` put back for the six AI modules, the constants, the hooks and the data files this lane changed; the scratch overlay used for this note restored them byte for byte afterwards). An ablation is one exact-text patch of the final tree, run, and put back (the patch list is in the Measurement section).

## Player paragraph for the release CHANGELOG

**FFX-2 only (Chapters IV and V).** The big bosses now fight by the game's own scripts. Bahamut casts Curse once, as his very first move, and then repeats a
six-move cycle: three Attacks, two Impulses, the Mega Flare countdown, Mega Flare. The countdown shows 5, 4, 3, 2 and the 1 appears with the cast (there is no 0).
In Chapter V the Leg's three Nodes start in three different colours, red, green and yellow, and change colour after four moves, so the Leg is healed and shielded from the
first moment; the Leg's status spells come at the game's odds (Slow half the time); the Bulwarks answer a physical or magical attack across the whole party and their
idle spells reach the other parts of the link; the Head only wakes when both Redoubts are down and acts much faster than it used to; the cannon's countdown is the game's
100 moves of the Head and the two Redoubts together (it was our guess of 240), with Shuyin's warnings at 20, 40, 60 and 80; and Shuyin no longer picks on Yuna every time:
he stops to speak more often, and his Terror of Zanarkand goes to whoever is wearing a first special dressphere. Chapter IV is as hard as before. Chapter V's Leg and Head
links are harder (our practice party now wins the whole chain about 65 times in 100, where it won 86 before), and Shuyin's fight is gentler on the party's HP.
