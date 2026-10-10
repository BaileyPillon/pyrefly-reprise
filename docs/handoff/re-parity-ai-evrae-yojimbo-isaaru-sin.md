# Re-parity AI lane C: Evrae and Cid, Yojimbo, Isaaru's three aeons, the Fins, Genais and the Core, and Sin's face follow the game's own scripts

Status: **built and committed on branch `re-parity-ai-ffx-c`, not merged, not deployed** (2026-10-09). Track `re-parity`
([plan](../plans/re-parity.md), [paper preflight](../plans/re-parity-ai-review.md), lane "AI-EVRAE-YOJIMBO-ISAARU-SIN"). Owner: Bailey.
**Game case: FFX only** (AGENTS.md rule 14): Chapters VIII (Evrae), IX (Yojimbo), XIV (Isaaru's aeons), XVII and XVIII (the Fins, Genais and the Core; Sin's
face). Nothing here is shared with FFX-2 or FF7: `ffx2-atb-golden` and `ff7-golden` are unchanged, and every FFX golden digest the lane did not mean to move is
byte for byte the same (the six that moved are listed in section 3).

Bailey, 2026-10-08 14:11: "It needs to be a 1:1 parity." Later that night: "Full speed ahead you don't need to conserve". 2026-10-09: "Ok where are we at? Keep going?".

The rules are `research/re-ffx-ai-evrae-yojimbo-isaaru-sin.md` (the game's compiled scripts read as decision tables, run in an interpreter over every draw, with the
engine facts they rely on). Rows D-01 to D-34 are its section 8. The evidence that stays reusable is outside the repo: the note's interpreter and run logs under
`D:\Tools\ffx-parity\ai\ffx-evrae-yojimbo-isaaru-sin\`, this lane's measurements, ablations and mutation runs under `D:\Tools\ffx-parity\ai-c-measure\`.

This lane resumed work an earlier agent had started (its app was restarted before it wrote anything down); the worktree it found was clean, so nothing was carried
over. Built on lane B's engine (`494c4cce`): the game's `onHit` once per target per sub-action (`hit-hooks.ts`, `hit-event.ts`) and the scripted group target
(`AbilityDef.extra.groupTarget`). Read [re-parity-ai-yunalesca-bfa](re-parity-ai-yunalesca-bfa.md) first.

Commits (all on `re-parity-ai-ffx-c`; nothing pushed):

| Commit | What |
|---|---|
| `a983131a` | Evrae and Cid (D-01 to D-07, D-09, D-34), the command-formula table, the hit gates |
| `c58f44ab` | Yojimbo and Isaaru's three aeons (D-10 to D-17), the formation's opening (D-14) |
| `632ea7b5` | The Fins, Genais, the Core and Sin's face (D-19 to D-33), the reach gate for distance 1 (`reach.ts`) |
| the commit that adds this note | This note, the CONTRACT-CHANGES entry, three stale comments and the one test the whole-suite run found (section 9) |

## 1. What the engine does now

**The gates** (`ai/hit-gates.ts`): a boss's hook always *runs* (its counters and scores always move); only what it *queues* is filtered, by the game's
`isCounterattackAllowed` (the owner can act: not Petrified, Ejected, asleep, Threatened, Confused or Berserk), by "the hit is not itself a reaction" (a party
counter-attack moves the counters and loses the command, D-34) and by "the owner has no reaction already waiting". **The formation's start hook** (`ai/opening.ts`, D-14):
the boss's CTB is 0 and each of the seven party counters is one tick later, for Yojimbo, Isaaru's three aeons, Genais and Sin's face (the Evrae and Fin formations have none).
Genais and Sin write the same lines again in their own init; whether that second copy survives is open (C), so the hook is applied once.

**The formula byte** (`ai/command-formula.ts`, D-03, D-27): Evrae's Stone Gaze counter and Genais's Waterga read the damage-formula byte of the command's game record, not our
`formula`: a weapon command reads 1; 56 records where our formula number would put a command in the wrong class carry an override keyed by the game's command id. The table is
proved against the game's command table for every shipped ability that carries a record (fixture `tests/fixtures/parity/ffx/evrae-gaze-classes.json`, 407 entries).

**Evrae and Cid** (`ai/evrae.ts`, `evrae-counters.ts`, `evrae-rules.ts`; Chapter VIII): the Haste line is 10,666 and strict (D-01). The Stone Gaze counter takes the command's
byte (1: +2, 3: +1, else 0), once per action, a miss included, and keeps firing after the Haste phase starts (a value above 5 turns his next Attack slot into a Stone Gaze, D-03,
D-04). His own FAR turn in the Haste phase is a Swooping Scythe, then he is NEAR and the order is gone (D-05); a hit at FAR in the Haste phase is answered with the Scythe
(D-06); a hit at NEAR with Slow on him is answered with Haste (D-07); the Haste action's own event is swallowed by the guard. Cid's Agility is 11, so he acts every 42 ticks (D-09). The
Delay trigger (D-02) is built behind `DELAY_ADVANCES_HASTE_PHASE = false`: the owner decision C-13 stands (section 8).

**Yojimbo** (`ai/yojimbo.ts`, `yojimbo-rules.ts`; Chapter IX): a Summon aimed at the summoner on his first turn, the gauge unmoved (D-10); the exact odds inside a band, from all 65,536
draws (D-11: 80 to 99 Wakizashi 25 / Kozuka 25 / Daigoro 50 percent, 50 to 79 20 / 20 / 60, 25 to 49 Kozuka 25 / Daigoro 75); Zanmato zeroes the gauge and the turn's common +2 makes it 2 (D-12);
his "+3 when targeted" is a hit event, once per action after its last hit, a miss counts, counter-attacks and a Threatened Yojimbo do not charge it (D-13); the opening (D-14).

**Isaaru's three aeons** (`ai/isaaru.ts`, `isaaru-rules.ts`; Chapter XIV): each aeon's first turn is a Summon aimed at Isaaru (D-17); with no aeon out Grothia (+5) and Pterya (+10) still fill their gauges on
every attack at Yuna and attack her whatever the gauge reads (D-15); against an aeon the Attack versus Fira / Sonic Wings is `GetRandomValue() mod 3` (the special 21,846 of 65,536, D-16); the
hit-event gains (Grothia +3, Pterya +15; Spathi has none); Spathi's countdown is unchanged and his first Mega Flare is now his 7th turn (D-17). The loss condition (D-18) is already the engine's outcome (`isaaru-duel.test.ts`).

**The Fins** (`ai/sin-fins.ts`, `sin-fins-rules.ts`, `sin-negation.ts`; Chapter XVII, links 1 and 2): both Fins open FAR. The Left Fin draws `mod 3` on every NEAR regular turn and rams iff the draw is at most
his hit count (33.334, 66.667, 100 percent after 0, 1, 2 hits), even when the answer is certain; the Right Fin never draws (NEAR: above 3 hits or latched; FAR: above 4, above 2 latched) and latches for good at the
first hit event under 16,250 (D-19). The hit counter takes +1 per hit event (+2 with an aeon 8 to 14 on the field), **including the Fin's own Negation and do-nothing Gravija** (D-20). The Negation score is the script's closed
form read off the three party slots: Shell +1 and Reflect +1 per slot, Protect slot 1 +1 / slot 2 nothing / slot 3 +2, Haste 0 / 3 / 4 / 5 by how many slots have it, Armor Break on the Fin +2, Mental Break +1 (D-21);
one draw on every hit event, whether or not a Negation is possible: NEAR `mod 16` (Left) or `mod 12` (Right) under `max(0, score - 3)`, FAR `mod 100` under 80 with Mental Break (D-22). The FAR Negation sets a guard that swallows
the Fin's own next event. A Negation strips the 24 listed statuses and spares Death, Doom, Curse, Auto-Life, Eject and a permanent status.

**Genais and the Core** (`ai/sin-genais-core.ts`, `sin-genais-core-rules.ts`; link 3): Genais starts **in** its shell; its first turn leaves it (Agility 25 in, 26 out, D-23); both thresholds are strict (out above 12,000,
in below 10,000, D-24); entering restarts the Venom, Venom, Thrashing cycle (D-25); Cura answers **every** hit event but the Core's Gravija, a miss and a status-only action included (D-26); out of the shell a command whose formula
byte is 3 draws Waterga on the attacker (D-27). The Core rebuilds its stored score at each of its turns (Shell +1, Haste +2, Reflect +1, Protect 1 / 0 / 2, Armor Break +3, Mental Break +3), lowers it by 3 on every hit event, and on
each event draws `mod maxHP` then `mod 8`: Negation if the roll is under the score, else a counter (Fire, Blizzard, Thunder, Water in turn, the cycle moves only when one fires) if its HP is below the first draw `mod 36,000`
(0 percent at full HP, 45.07 at half, D-28, D-29). A spell absorbed by Genais (out of its shell) raises no roll, no decay and no counter, and the Core's own scripted Negation is never absorbed (D-30). Its Gravija is the front line and
Genais, a scripted group.

**Sin's face** (`ai/overdrive-sin.ts`, `overdrive-sin-rules.ts`; Chapter XVIII): Giga-Graviton on his **12th** turn (3 pulls, 8 mouth turns), a scripted Game Over (D-31); the ship's distance is 3, then 1 after pull 2, then 0
after pull 3 (D-32; `reach.ts` and `targeting.ts#reachesFoesAtRange`: at distance 1 only reach-0 commands miss, so Use, items, Wakka's reels, Spare Change, Fire Breath and the aeon Overdrives of reach 1 land); the Gaze counter rises on **every** hit
event from the first, also during the pulls, and fires only once the pulls are over: above 5 with the party in front (a draw `mod 3` picks Zombie 21,846, Petrify 21,845, Confuse 21,845 of 65,536) or above 2 with an aeon 8 to 14 out
(the aeon Gaze, no draw), tested at the moment of the hit (D-33). The pulls and the mouth turns have no hit record, so they raise no event on Sin.

**Data:** the game's caption dummies have no hit record (`hits: 0`), the do-nothing Gravija is aimed at the Fin (one hit record), the Core's Gravija is a scripted group, the Summon rows and their command records are new
(`command-records/enemies.ts`: 458 then 455 shipped records). `ai/reactions.ts#collectBossCounters` no longer answers for Evrae, Yojimbo, Isaaru or Sin: they answer from their hooks.

## 2. Row by row

| Rows | Verdict |
|---|---|
| D-01 to D-07, D-09 (Evrae, Cid) | Done in `a983131a`. D-02 is **built behind a switch, off** (owner decision C-13, section 8) |
| **D-08 (orders: one Trigger Command at a time, Cancel while one is pending)** | **Not built.** It changes the party's menu, so it needs Bailey's yes first (AGENTS.md rule 9; section 8). Ours keeps "last order wins" and a redundant order still burns Cid's turn (C-7). Applies to Evrae and the Fins |
| D-10 to D-13 (Yojimbo), D-15 to D-17 (Isaaru) | Done in `c58f44ab` |
| D-14 (the opening) | Done for Yojimbo, Isaaru's three, Genais and Sin's face |
| D-18 (Isaaru's defeat) | Already the engine's outcome; nothing to change |
| D-19 to D-22 (the Fins) | Done in `632ea7b5` |
| D-23 to D-30 (Genais, the Core) | Done in `632ea7b5` |
| D-31 to D-33 (Sin's face) | Done in `632ea7b5`. D-32's exact reach table is built for distance 1 only (section 7) |
| D-34 (party counter-attacks) | Done everywhere: the hook runs, the queue drops the command |

**Owner-decision check** (`DECISIONS.md`, `docs/target/decisions*.json`, the engine handoffs): **C-13** (Delay does not advance Evrae's Haste phase, `chapter-evrae-engine.md`) is respected: the script has the rule, the switch is off. **D-050** (Yojimbo's odds
inside a band "our estimate, B2"), **D-266** and **D-280** (Giga-Graviton on Sin's 13th turn "until a Steam check"; the script *is* the check) and the Isaaru estimates (O-5 even Attack / special odds, no gauge gain with no aeon out) were
placeholders awaiting a source; the scripts answer them, so they are replaced by the script, each in one place (`yojimbo-rules.ts`, `isaaru-rules.ts`, `overdrive-sin-rules.ts`), and listed in section 8 so Bailey can see
what changed. **S-15** (Genais absorbs magic aimed at the Core also in its shell, three secondary sources) is contradicted by the script (absorption only out of the shell) and follows it. D-129, D-412 and the
Chapter II / III decisions are lane B's and untouched. No other row contradicts a recorded decision.

## 3. Tests

New, 132 tests in six files (vitest counts the shared fixtures test once per file that imports it), each against its decision table, with the exact odds from all 65,536 draws wherever a roll decides and the closed forms
over all 16,384 buff layouts:

| File | Covers |
|---|---|
| `re-parity-ai-evrae.test.ts` (25) | his turn and its draws, the Gaze classes against the game's table, the Haste line and phase, the Delay switch, the Scythe and Haste answers, Cid's recovery |
| `re-parity-ai-yojimbo.test.ts` (16) | the Summon turn, every band's odds from all draws, the gauge across turns, the hit-event gain and its gates, the opening |
| `re-parity-ai-isaaru.test.ts` (12) | the Summon turns, the gauge gains with and without an aeon, the `mod 3` split, the hit-event gains, Spathi's count, the opening |
| `re-parity-ai-sin-fins.test.ts` (28) | the Left and Right Fin turns and draws, the hit counter, the score on all 16,384 layouts, the exact chances, the NEAR and FAR rolls, the guard, the self-hits, the latch |
| `re-parity-ai-sin-core.test.ts` (29) | the opening, Genais's thresholds and cycle, Cura and Waterga, the Core's turn and score on 16,384 layouts, the two draws, the decay, the counter shares, the absorbed spell |
| `re-parity-ai-sin-face.test.ts` (22) | the 12-turn clock, the opening, the distances, the reach table at 3, 1 and 0, the Gaze counter (carry across the pulls, the aeon threshold, counter-attacks, one Gaze at a time) |

**Mutation check:** thirty-four one-line mutants (a mod, a gain, a boundary, a weight, a threshold, a group target, a distance, an id in the reach table ...) were applied one at a time to a scratch copy and run against these
files; **all thirty-four were caught** (driver `D:\Tools\ffx-parity\ai-c-measure\mut\run-mutants.cjs`).

Changed, with the game's reason (each carries a comment in the file):

| Test | Change | Reason |
|---|---|---|
| `chapters/evrae-engine`, `evrae-breath-hold`, `presenter-vitals-hp-ceiling` | Cid's Agility 16 -> 11; seed pins 6 -> 8 and 1 -> 2 | D-09; a seed pin that moved with the rules |
| `chapters/sin-data` | Cid's Agility 11 | D-09 |
| `chapters/yojimbo-engine` | the Summon turn skipped by a helper; exact odds; Zanmato ends at 2 | D-10 to D-12 |
| `chapters/isaaru-engine`, `chapters/isaaru-tactic-bench` | the Summon turn; the pin "the shipped line beats the sourced-order line" relaxed (the sourced order now wins 172 of 200, the shipped line 169) | D-15 to D-17: the old placeholders were what made the sourced order lose |
| `data-ffx-command-records` | 458 records / 455 shipped abilities | the Summon rows |
| `ui-ffx-zanmato-hold` | the gauge reads 2 after Zanmato | D-12 |
| `chapters/sin-engine`, `sin-hud`, `sin-phone-staging` | the clock is 12 turns, 3 + 8 + 1 segments, no estimate line, the distance sequence 3, 1, 0, 0; a bench can still play 13 | D-31, D-32 |
| `chapters/sin-fins-engine` | the estimates that remain (seam line-up, S-20, aeon reach, C-7); the latch is read at a hit event; the exact FAR chance 52,436 / 65,536; the score layouts; the Fin carries only statuses that leave it able to counter | D-19 to D-22, note 1.1 |
| `chapters/sin-core-engine` | Genais starts shelled and leaves first; strict thresholds; Cura on a status-only action; the counter cycle through the stored score and the `mod maxHP` draw; the estimates that remain | D-23 to D-30 |
| `chapters/sin-tactic` | the shelled-Genais flag is set after the menu opens (his first turn leaves the shell) | D-23 |
| `parity-ffx-engine-wiring` | only damage events that land on the target are compared | the sample's pool grew with the single-target rows and reached Stamina Spring's drain (section 9) |
| `ffx-engine-golden` | six digests re-pinned (Chapters VIII, IX and XIV on their seeds) and the docblock paragraph; **every other digest unchanged** | "game-script parity" |

## 4. Before and after

Harness: the shipped `intendedStrategy` through each chapter's whole chain (a scratch copy of `ffx-parity-measure.test.ts` with per-link turns and a tally of the boss's abilities). Before = this lane's base (`494c4cce`),
after = `632ea7b5`. 500 seeds:

| Chapter | Wins | Party KOs | Party turns | Engine turns |
|---|---|---|---|---|
| VIII Evrae | 487 -> **490** | 0.9 -> 0.8 | 68.8 -> 70.3 | 88.7 -> 87.4 |
| IX Yojimbo | 427 -> **485** | 7.0 -> 4.0 | 76.1 -> 74.4 | 110.3 -> 107.2 |
| XIV Isaaru's aeons (3 links) | 424 -> **423** | 2.7 -> 2.8 | 30.3 -> 28.9 | 69.8 -> 65.7 |
| XVII Fins, Genais and the Core (3 links) | 280 -> **437** | 8.1 -> 2.8 | 307.4 -> 327.4 | 413.1 -> 420.0 |
| XVIII Sin's face | 124 -> **3** | 2.3 -> 3.0 | 64.0 -> 56.8 | 75.2 -> 67.2 |

12 seeds: Evrae 11 -> 12, Yojimbo 9 -> 12, Isaaru 10 -> 11, Chapter XVII 3 -> 10, Chapter XVIII 4 -> 0 (Chapter XVII per link, 500 seeds: Left Fin 500 -> 500, Right Fin 480 -> 490 of 500, Genais and the Core 280 of 480 -> 437 of 490).
**Evrae and Isaaru did not move beyond noise** (3 and 1 seeds of 500, under one standard deviation). The three that moved, with the cause of each from ablations on a scratch copy with one rule put back at a time
(500 seeds each, the same code path; `D:\Tools\ffx-parity\ai-c-measure\abl-*.json`):

**Yojimbo got easier (85 to 97 percent).**

| Configuration | Wins |
|---|---|
| after | 485 |
| no Summon turn (D-10) | 478 |
| the old equal-split odds (D-11) | **449** |
| Zanmato leaves 0 (D-12) | 485 |
| no opening (D-14) | 483 |
| all four put back | 427 (the "before" figure exactly) |

The odds are most of it: inside the 50 to 79 band the game rolls Daigoro (the dog's bite) 60 percent of the time and Wakizashi / Kozuka 20 each, where the old estimate split them 33 / 33 / 33; Wakizashi
and Kozuka fall from 14.7 to 8.5 a run. The Summon turn is a free turn for the party.

**Chapter XVII got easier (56 to 87 percent).** The Fin links barely move (the Right Fin +10 seeds, about two standard deviations); link 3 does:

| Configuration (link 3, wins of those that reached it) | Wins |
|---|---|
| after | 437 / 490 |
| Cura only after an action that dealt damage (the old D-26) | **320** |
| the Core counters after every failed Negation roll (the old D-28) | **381** |
| both | 286 / 490 (the "before" figure: 280 / 480) |
| the old Fin Negation score (D-21) | 428 |
| Genais starts out of its shell (D-23) | 442 |
| the Core's score does not decay (D-29) | 434 |
| the old Waterga scope, or absorption in the shell too (D-27, S-15) | 437, 437 |
| bounds: the Core's Negation off, the Fins' Negation off | 455, 495 (all three links 500, 500, 495 of 500) |
| all the old rows together | 289 / 488 |

Two rules explain the whole move. **Cura on every hit event (D-26)** heals shelled Genais past 12,000 sooner, so he sits in the shell far less (he Sighs 3.5 times a run; 8.6 with the old Cura rule; 7.3 before) and the Core, which charges only while he is shelled,
casts its Gravija 6.7 times a run (7.4 with the old rule; 7.8 before); **the Core's counter is a share of the draws, mostly low-HP hits (D-28)**, so its Fire, Blizzard, Thunder and Water fall from 12.5 to 7.2 a run. The Fins' Negation is a large lever on its own (bound: off, 495 of 500) but the script's score is close to the old estimate (428
against 437).

**Chapter XVIII became very hard (25 to 0.6 percent).** The shipped line wins 3 of 500.

| Configuration | Wins |
|---|---|
| after | 3 |
| Giga-Graviton on turn 13 (D-31) | **76** |
| no opening: Sin does not act first (D-14) | 13 |
| turn 13 and no opening | **131** |
| distance 1 off (D-32), no counter-attack events (D-34), Gaze during the pulls | 3, 3, 1 |
| all five old rows | 119 (the "before" figure: 124) |

The cause is the clock and the opening. The game's script fires Giga-Graviton on Sin's 12th turn (the owner's placeholder was 13) and Sin takes his first turn before anyone; together they take the shipped line from 124 wins to 3, while the
new reach after the second pull, the counter-attack events and the pull-phase Gaze change nothing. The shipped line and the party's build were tuned against 13 turns; nothing was retuned (section 8).

## 5. Behaviour the player will see

1. Evrae Hastes himself at 10,665, answers a hit from afar in his Haste phase with a Swooping Scythe, closes the ship in and Scythes on his own FAR turn there, and re-Hastes after any hit while Slow holds (13 times a run on the shipped line, was 3);
   the Stone Gaze comes back (0.76 a run) because the counter fills by the command's class; Cid is slower (42 ticks).
2. Yojimbo opens with a Summon, acts before the party, and rolls Daigoro (the dog's bite) more often and Kozuka and Wakizashi less.
3. Each of Isaaru's aeons opens with a Summon; Spathi's first Mega Flare is a turn later; Grothia and Pterya fill their gauges at Yuna with no aeon out.
4. The Fins: a Negation is likelier or rarer by the real buff table (Haste on three members is worth 5 to the score, Protect on the third member 2, on the middle one nothing); the Fin's own Negation and do-nothing Gravija count as hits on him.
5. Genais opens in his shell and leaves it on his first turn; he heals himself on every hit while shelled; the Core counters mostly when it is low and its Negation chance falls as it is hit.
6. Sin's face: the HUD clock opens at **12** and the "our estimate" line is gone (`S1_OPEN = false` in `sinHudModel.ts`); Sin takes the first turn; after his second pull Use, items, Wakka's reels and the aeon Overdrives of reach 1 reach him while melee does not.

## 6. Stale text and code that still describes the old fights (listed, not changed)

Player-visible text, left alone (a visible rewrite needs Bailey's yes, AGENTS.md rule 9):

- `src/data/guides/sin-face.ts` (the clock card and its short rule: "We use the 13th turn; the sources say 12th or 13th, and that is our estimate" and "Beat it before Sin's 13th turn (our estimate)") and `src/data/guides/docs/sin-face.ts` ("about thirteen turns",
  "the game ends the fight on the thirteenth"). The HUD clock now says 12 and the guide says 13.
- `src/data/guides/yojimbo-cavern.ts` (the header: "The odds inside each band are our estimate (B2, D-050)"): the odds are the game's now.
- `src/data/guides/evrae.ts` (the Stone Gaze note, "resets when Evrae acts"): the counter fills by the command's class and resets only when a Stone Gaze fires.
- `src/data/guides/sin-fins-core.ts` (the Negation card, "one guide's formula, built as settings we can change", and "how Genais leaves its shell is our reading"): both are the script's now. Its other claims (Haste on one member only, Protect on the middle member, Fire into the shell, Cura
  on every hit) still hold.
- `src/story/scripts/evrae-airship.ts:252` and `src/engine/tactics/evrae.ts:134` mention 10,667 in comments, and the story trigger there is `hp-below 1/3`, which is true at exactly 10,666 HP where the Haste phase starts at 10,665: a one-point edge.
- `src/data/chapter-sin-face.ts:28` (D-280, the 13th turn "our estimate") is a comment.

Code and notes: `src/engine/tactics/sin-face.ts` and the shipped auto-battle lines were written against the old fights (Sin's 13 turns; the Fin and Core cycles); the Chapter XVII line still wins 437 of 500 and Chapter XVIII's line 3 (section 8). `ActorRuntime.countsPartyTargetings`
and `partyTargetings` (`state.ts`, `overdrive.ts#onTargeted`) are no longer set by any script (Evrae's and Sin's counts are hit events now); a test pins the counter itself (`ffx-blitz-ace-finisher`), so it is left in place. `research/ffx-evrae-airship.md`,
`ffx-yojimbo.md`, `ffx-isaaru-bevelle.md` and `ffx-sin.md` are the wiki's readings, superseded where `re-ffx-ai-evrae-yojimbo-isaaru-sin.md` section 9 says so. The enemy-intent panel (`intent.ts#countersFor`) has no counter lines for these bosses and gets none
here: new text in a panel Bailey reads needs his yes first.

## 7. Not done, and what could not be sourced

- **D-08**, the order menu (section 8).
- **The exact reach table at distance 3.** Only Sin's distance 1 uses the game's reach classes (`reach.ts`, numbers only from the game's command table); at FAR (distance 3, Evrae and the Fins) the old category gate stays (spells, Lancet, Wakka, long-range rows).
  The table would also admit Doom, the aeons' Sonic Wings, Meteor Strike and the like at distance 3 and refuse Wakka's reels and Valefor's Energy Blast; those rows are untouched here.
- **Non-damaging magic aimed at the Core while Genais is out** (Slow, Haste, Dispel ...): the game replaces any magical-type command with "Magic absorbed"; ours replaces the roll (no event effect) but the kernel still applies the status. Damaging spells are nullified correctly.
- **The Core's own Negation and the absorption rule**: the note says the Core's own event is swallowed by its guard, so the scripted Negation is built as never absorbed; whether the game's `onTargeted` would intercept it while Genais is out is not traced (B).
- **Genais's and Sin's duplicate opening writes** (the init and the start hook): applied once (+1 tick); the note takes the net effect as open (C).
- **Silence on Genais**: our engine stops a Silenced Genais from casting its Cura and Waterga; the note is silent.
- **Daigoro's bite** still uses `random-enemy` (the engine draws even with one candidate, the game's `findMatchingChr` does not); it changes no outcome in a single-stream engine and matters only if plan P3 adopts the game's streams.
- **Initial CTB** of Evrae, Cid, the Fins, the Core and Isaaru's aeons, and which `SetAmbushState` write lands last (the note's open list, section 10).
- **Browser check:** the only UI file changed is `sinHudModel.ts` (one switch); this worktree has no `public/art`, so the plan's real-input check of the Sin HUD is left to the main session's validation.

## 8. Decisions for Bailey

1. **Chapter XVIII (Sin's face) is now almost unwinnable for the shipped line (3 of 500, was 124).** The game's own script ends the fight on Sin's 12th turn (our placeholder was 13) and lets Sin act first; the line and the party were tuned against 13. Nothing was retuned.
   Options: keep it (it is the 1:1 reading), re-tune the shipped line and the party's preset against 12 turns (a separate batch; needs your yes), or leave the clock at 13 behind the existing switch `sin.gigaGravitonTurn` (not recommended: it contradicts the script). **Recommended: keep, and
   schedule the line's re-tune.**
2. **The HUD clock opens at 12 and the "our estimate" line is off**, and the strategy-guide card still says 13 (section 6). Both are visible. Say yes and the guide text is rewritten with the clock.
3. **Chapter XVII is 31 points easier** (56 to 87 percent of seeds) and **Chapter IX 12 points easier** (85 to 97), from the script's own rules (section 4). Keep (recommended)? The rows that decide them are one constant each if you would rather have the old feel (`sin-genais-core.ts` Cura and counter rules; `yojimbo-rules.ts` odds), but each is less true to the game.
4. **C-13 (Delay and Evrae's Haste phase).** The script has it: one Delay Buster or three Delay Attacks start the Haste phase with no HP lost (the wiki claim was true). The owner decision keeps it off. Turn it on (`DELAY_ADVANCES_HASTE_PHASE = true` in `evrae-rules.ts`, one line) for 1:1? The decision was made
   when the claim was unsourced.
5. **D-08, the order menu:** the game offers one Trigger Command at a time (Pull back at NEAR, Move in at FAR, Cancel while one is pending) and no redundant order; ours keeps two rows with "last order wins". A visible menu change, so it needs your yes first (rule 9).
6. **Replaced placeholders:** D-050 / B2 (Yojimbo odds), D-266 / D-280 (Giga-Graviton turn), the Isaaru estimates O-5 and "no gauge gain", S-15, and S-1, S-8, S-12, S-19, S-25, S-27 (the Fin rules) are answered by the scripts and removed from the lists the code prints. Confirm they should stay replaced.
7. **The shipped lines and advisor cards** for Chapters VIII, IX, XIV, XVII and XVIII are untouched (section 6); the guide text above needs a yes.

## 9. Full suite

One run of the whole unit suite on `632ea7b5` plus this note's working tree (2026-10-09): **935 files: 907 passed, 22 failed, 6 skipped; 14,045 tests: 13,803 passed, 162 failed, 79 skipped, 1 todo** (364 seconds). The run used
`--fsModuleCache --fsModuleCachePath D:/Tools/ffx-parity/ai-c-vitest-cache --testTimeout=60000 --maxWorkers=4`.

**21 of the 22 failing files are the art-only failures this worktree has without `public/art`** (the same 21 files and tests as lane B's list: `ui-portrait-face-crop` 125 tests, `chapters/trema-ship-content` 4, `art-ref-defaults` 4, `pause-remake` 3,
`chapters/isaaru-ship` 3, `chapters/den-of-woe-ship-content` 3, `chapter-meta-seymour-anima-macalania` 3, `chapter-meta-evrae` 3, `chapters/natus-ship-scene` 2, `chapters/natus-ship-content` 2, `chapters/leblanc-art` 2, `chapters/fallen-aeons-ship-content` 2,
`chapter-meta-ffx2-leblanc` 2, `cutscene-story-poses` 1, `chapters/fallen-aeons-ship-scene` 1, `chapters/den-of-woe-ship-scene` 1, and five files that fail on import because `public/art/manifest.json` is missing: `party-face-manifest`,
`chapters/yojimbo-content`, `chapters/leblanc-party-sprites`, `chapters/chapters-6-7-8-enemy-sprite-manifest`, `chapter-meta`). That is 161 failing tests.

**The 22nd was this lane's:** `parity-ffx-engine-wiring` (1 test). Its seeded sample of 400 situations draws from the pool of shipped damaging single-target abilities; that pool grew from 133 to 142 when `evrae-attack`, `yojimbo-kozuka`, `yojimbo-wakizashi`,
Grothia's and Pterya's attacks and specials became explicit single-target rows, the sample moved, and situation 65 reached Stamina Spring, whose drain emits a second damage event, on the user, that the test counted as a hit on the target. Fixed in the test (only the
events that land on the target are compared) and re-run green (13 of 13). Nothing else outside the art-only set failed, and `ffx2-atb-golden` and `ff7-golden` passed unchanged.

## How to re-run

```
node "D:/Final Fantasy/node_modules/typescript/bin/tsc" --noEmit
node "D:/Final Fantasy/node_modules/vitest/vitest.mjs" run tests/unit/re-parity-ai-evrae.test.ts tests/unit/re-parity-ai-yojimbo.test.ts tests/unit/re-parity-ai-isaaru.test.ts tests/unit/re-parity-ai-sin-fins.test.ts tests/unit/re-parity-ai-sin-core.test.ts tests/unit/re-parity-ai-sin-face.test.ts tests/unit/ffx-engine-golden.test.ts
node tools/orphans.mjs
```

The 500-seed measurements, the ablations and the mutation driver used scratch copies of the harness (`zz-measure-c.tmp.test.ts`, never in the repo) in `D:\Tools\ffx-parity\ai-c-measure\`. **The two full-tree scratch copies there, `abl` and `mut` (about 6.4 GB each),
are no longer needed and are safe for Bailey to delete**; the results they produced (`*.json`, `*.log` beside them) are small and worth keeping.

`NOW.md` and the ledgers (`DECISIONS.md`, `ACTIONS.md`) are left to the main session (other agents are active in the tree).
