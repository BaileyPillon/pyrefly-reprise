# Paper preflight — RE parity, wiring the boss AI read from the games' own scripts

> `critic/RUBRIC.md` §4, AGENTS.md rule 15: paper only. `node tools/critic-plan.mjs --paths
> src/battle/ffx/ai/seymour-flux.ts,src/battle/ffx2/ai/bahamut.ts` classes this as **DEEP**
> (FFX CTB engine, FFX-2 ATB engine).
>
> **Owner's words, 2026-10-08:** *"use this https://github.com/morluto/rea and
> https://github.com/bethington/ghidra-mcp to reverse engineer and decompile final fantasy x/x-2
> battle mechanics. I have it installed in my pc with steam. it's the x/x-2 remaster. It needs to
> be a 1:1 parity. this is very useful for our project."* Later the same evening: *"Full speed ahead
> you don't need to conserve"*.
>
> **Verdict: PROCEED** for the rule changes in §2, by fight group, behind the conditions in §5.
> The structural changes in §3 wait for Bailey.

Written 2026-10-08 by the main session from the AI notes on branch `re-parity`:
`research/re-ffx-ai-seymour.md`, `re-ffx-ai-yunalesca-bfa.md`, `re-ffx2-ai-bahamut-vegnagun.md`,
`re-ffx2-ai-fallen-trema.md`, `re-ffx2-ai-leblanc-den-ixion.md` (Evrae, Yojimbo, Isaaru's aeons and
Sin follow in `re-ffx-ai-evrae-yojimbo-isaaru-sin.md`).

## 1. Game case (AGENTS.md rule 14)

Every AI rule belongs to one fight, so every change is **FFX only** (chapters I to III, VII to X, XII,
XIV, XVII, XVIII) or **FFX-2 only** (IV to VI, XI, XIII, XV, XVI). The shared engine facts the notes
proved (FFX: onHit fires once per target per sub-action before the death check, the random actor
picker draws stream 4; FFX-2: one poll per logic step, the reaction entry runs once per result applied,
several queued commands per poll, scripted commands carry no all-targets byte) are per game too, each
proven in its own exe.

## 2. What changes — rule changes (PROCEED)

Each note's differences table is the work list (row ids in brackets). Rules are copied as decision
tables in our own words; numbers come from the scripts.

| Group | Chapters | Rows |
|---|---|---|
| FFX Seymour fights | I, VII, X, XII | D-01 to D-33 |
| FFX Yunalesca, Braska's Final Aeon, Yu Pagodas, Yu Yevon | II, III | Y1-Y6, B1-B7, P1-P5, V1-V5, and the per-aeon move tables inside the chain (A rows that do not change the chain's shape) |
| FFX Evrae, Yojimbo, Isaaru's aeons, Sin | VIII, IX, XIV, XVII, XVIII | the forthcoming note's rows |
| FFX-2 Bahamut, Vegnagun and Shuyin | IV, V | B1-B5, B7, T1-T2, L1-L2, N1-N3, C1-C4, H1-H6, R1-R4, S1-S2 |
| FFX-2 Fallen Aeons, Paragon, Oversoul, Trema | XI, XIII | F1-F3, M1-M7, P1-P6, O1-O14, T1-T5 |
| FFX-2 Leblanc Syndicate, Den of Woe, Ixion | VI, XV, XVI | O, L, G, K, R, D, I rows of its section 8 |

Not done here because another batch owns it: damage-type bits and per-move power/accuracy (the
command records attached in W1 and W3 already carry the game's values); FFX-2 timing in seconds
(polls, recovery and charge per move, the "every gauge freezes while an effect plays" rule, Ixion's
action time) waits for W4 and the real-game timing check — until then AI timers stay in their current
units and only the decision logic changes. (Corrected by the 2026-10-09 measurement,
`research/re-ffx2-timing-measured.md`: the real-game timing check is done. The logic rate is 29.97 steps a
second, a charge falls at the full tick, and the "every gauge freezes while an effect plays" rule did not
hold for Attack, Fire or four monster casts; only the Wait flag stopped the clock, and which commands stop
it, if any, is open. W4 still owns the wiring, so the AI timers stay in their current units until then.)

## 3. Structural changes — wait for Bailey

- Braska's chain: in the game the player chooses the possession order from a menu of their aeons,
  Yojimbo included, and the Magus Sisters are one battle (`re-ffx-ai-yunalesca-bfa.md`, A rows).
  Ours is a fixed seven-link chain.
- Mega Flare's power: the files say 14, our constant is 24; two published reports fit 24. One measured
  cast in Bailey's copy settles it (the timing session of 2026-10-09 measured timing only and never
  reached Bahamut, so it is still open). **Answered 2026-10-09: Bailey, "Use 14 from the files".** The
  engine carries the row's 14 on the release-candidate-1 branch (`docs/handoff/re-parity-rc1.md`).
- Any rule that only makes sense once FFX-2's logic rate is known (the Vegnagun Head clock and the
  Oversoul idle limit in seconds). The rate is now measured, 29.97 steps a second (corrected by the
  2026-10-09 measurement: 1,200 Oversoul idle polls are 40.04 s of running clock); moving the engine's
  timers onto it is still a structural change that waits for Bailey.

## 4. Acceptance cases

1. Per fight, a test that walks the decision table: for each row's condition, the AI picks that row's
   action (and, where a row rolls, the expression and range match the note). Where the note ran the
   real bytecode in an interpreter (the Seymour, Yunalesca/Braska and FFX-2 notes did), the test
   reproduces at least two of its tallies (for example Yunalesca form II heals 40.3% with one Zombie).
2. Chapter tests and the strategy benches pass; goldens move only in the commit that moves them,
   with the reason "game-script parity".
3. Before-and-after measurement as in W1: every chapter of the group, the shipped intended line,
   12 and 500 seeds, ablation for any chapter that moves beyond noise. Nothing on a boss or the party
   is retuned; a chapter that gets much harder or easier is reported to Bailey with the cause.
4. `tsc` clean; files under 400 lines; the advisor's intent previews (`ffx/intent.ts`,
   `ffx2/intent.ts`) and the strategy guide's claims follow the new rules or are listed as stale.

## 5. Conditions

- Each group works in its own worktree and branch, merged into `re-parity` one at a time; FFX-2 AI
  groups start after W3 has merged (both move the FFX-2 goldens and the command records).
- A rule a note marks as inferred (C or L) is implemented only if the note says how to observe it;
  otherwise it stays as today and is listed.
- The strategy guide (`docs`/guide data citing Jegged) is not rewritten here; contradictions are listed
  for a later guide pass.

## 6. Evidence that stays reusable

The AI notes (each with script offsets or source line ranges), the interpreters and their run logs
under `D:\Tools\ffx-parity\ai\`, and the W1/W3 command records.
