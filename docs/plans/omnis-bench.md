# Chapter XII Seymour Omnis: winnability bench (measured, never tuned)

Measured 2026-09-25 on branch `chapter-omnis-0925` (worktree `D:/pyrefly-ch-omnis`, engine at
392bf80a) by a sub-agent of the driver, after Bailey's "all recommendations please" (D-162: Omnis
ships first). **Game case: FFX only** (CTB, aeons, Nul spells; research §0.3). Nothing under `src/`
was touched; the boss's numbers are as the data files cite them (AGENTS.md rule 6, the
boss-side-fix-needs-measured-options rule).

**Verdict: winnable, inside the 25-95 % band.** The intended line wins **127 of 200 (63.5 %,
95 % interval about 57-70 %)**; the credibly wrong line wins **0 of 200**. No method check is owed.
Four facts Bailey should see before the chapter is listed are in "What the numbers say" below.

## Method

- **Real engine, real data, approved build.** `createFFXEngine` with the shipped content, group
  `seymour-omnis`, the Garden of Pain build (`src/data/ffx/builds/garden-of-pain.ts`: B2 = a Tidus /
  Yuna / Auron opening, B5 = a Chapter III stat cells `[estimate]`, B6 = a Phantom Ring on Yuna, B7 = a
  Chapter III's bag). Seeds 1-200 per line; every decision is scripted.
- **Decision time does not matter.** FFX is CTB: the clock stops while a command is chosen, so a
  scripted policy and a human playing the same commands get the same fight. (Unlike the FFX-2 ATB
  benches, there is no human-speed variant to run.)
- **Estimates the numbers rest on:** the party cells (B5), the ring order and the reset cycle (B8 = b,
  our estimate), which disc's spell hits whom (B12 = a, our estimate), discs take no turns (B22 = a),
  disc hits do not count toward the glow (B11), reset on his next turn after Ultima (B23 = a).
- Test: `tests/unit/chapters/omnis-bench.test.ts` (prints both tables; pins that every fight ends, the
  intended line beats the wrong one, only the intended line turns discs and cuts his -ga share, and
  the glow, Dispel, Ultima and a reset all occur on the intended line). Runs in about 11 s.

### The lines (research §5; all sourced)

| Line | What the party does |
|---|---|
| **intended** (rows 1, 2, 3, 6, 9: the plan's thesis) | Tidus hands his turn to **Wakka**, who hits a disc of any colour showing on 3-4 discs (so no -ga), else Omnis; **Auron** lands Armor Break, then hits; **Yuna** Nuls the majority colour, re-casts Hastega after each Dispel, heals, lifts everyone above 4,200 before Ultima; revives and Ethers from the bag |
| **wrong** (the plan's named wrong line, §9) | Tidus hands his turn to **Lulu**, who casts **Firaga into a Fire-absorbing Omnis**; Auron hits without breaking; Yuna heals |
| break-brute (row 1 alone) | Armor Break, Tidus and Auron hit Omnis, Yuna heals; no disc touched |
| weakness (row 5) | Lulu Doublecasts the -ga of his weakness while all four discs match; Mental then Armor Break; Yuna heals |
| intended, no ring (B6 = b) | the intended line with Yuna in her Chapter III Tetra Ring: the ring lever, measured |

## Results (200 seeds each)

"Battle turns" counts every combatant's turn (`state.turn`); "his turn" numbers Omnis's own turns.

| Line | Wins | Battle turns (mean, all) | Battle turns (wins) | Party actions | His turns | Omnis HP left (mean) |
|---|---:|---:|---:|---:|---:|---:|
| **intended** | **127/200** | 156.2 | 187.3 | 110.7 | 45.5 | 12,937 |
| **wrong** | **0/200** | 69.8 | - | 49.0 | 20.9 | 70,015 |
| break-brute | 1/200 | 66.4 | 160.0 | 47.9 | 18.5 | 50,629 |
| weakness | 142/200 | 52.0 | 47.4 | 37.5 | 14.6 | 1,405 |
| intended, no ring (B6 = b) | 0/200 | 83.1 | - | 59.4 | 23.8 | 45,477 |

### The boss's key moments

| Line | 1st glow: his turn (fights) | 1st Ultima: his turn (fights) | Below 20,000: his turn (fights) | Glows / Dispels / Ultimas / resets per fight | Disc turns | -ga share of his spells | Party KOs per fight: Ultima / -ga / -ra | Raises | Defeats, by the last blow |
|---|---|---|---|---|---:|---:|---|---:|---|
| **intended** | 4.6 (200) | 6.6 (200) | 36.9 (146) | 4.62 / 4.58 / 4.42 / 4.28 | 9.50 | 64 % | 0.14 / 11.02 / 0.54 | 10.60 | -ga 69, -ra 4 |
| **wrong** | 5.2 (200) | 7.2 (200) | never | 2.00 / 2.00 / 2.00 / 2.00 | 0 | 100 % | 0.04 / 8.29 / 0 | 5.33 | -ga 200 |
| break-brute | 4.1 (200) | 6.1 (200) | 34.5 (2) | 2.04 / 2.04 / 2.04 / 2.04 | 0 | 100 % | 0 / 7.10 / 0 | 4.11 | -ga 199 |
| weakness | 5.6 (200) | 7.6 (200) | 10.8 (199) | 1.99 / 1.97 / 1.74 / 1.58 | 0 | 100 % | 0.01 / 3.08 / 0 | 2.21 | -ga 58 |
| intended, no ring | 5.5 (200) | 7.5 (200) | 44.5 (2) | 2.15 / 2.15 / 2.15 / 2.15 | 4.58 | 56 % | 0.04 / 6.48 / 0.37 | 3.88 | -ga 192, -ra 8 |

The sequence is as the sources order it on every line: the glow, Dispel on his next turn, Ultima the
turn after, the discs reset on the turn after that (B23 = a), four spells again.

## What the numbers say

1. **Winnable, and the wrong line is punished.** 63.5 % for the intended line against 0 % for Firaga
   into an absorbing Omnis (and 0.5 % for breaking without touching the discs). The puzzle matters.
2. **The disc volley is the whole threat; Ultima almost never kills.** Every defeat on every line ends
   on a -ga or -ra; Ultima lands 0.14 KOs a fight on the intended line, because the line heals above
   4,200 first and every member's maximum is 5,130 or more (Ultima is 3,577 at MDef 25, research
   §3.3). The -ga share stays at 64 % even with Wakka turning discs, because each reset puts four
   matching discs back and Wakka turns one disc a turn.
3. **The Phantom Ring is the difference between 63.5 % and 0 %** (B6 = a is Bailey's pick, so it
   ships; disclosed here as the plan asked, R4). Its size rests on a second estimate: under B12 = a
   disc 2's spell always goes to the member in slot 2, which is Yuna, so the ring turns one of his four
   spells into a heal almost every volley. If B12 were "all random" (b) the ring would matter less and
   the rate would move; that variant is **not measured** here because it changes the boss's script.
4. **The intended fight is long.** A win takes about 187 battle turns, roughly 45 of his turns and
   110 party commands, with about 4.6 glow cycles and 10.6 raises. The sourced weakness line (row 5,
   Lulu Doublecasting -ga into the all-matching weakness after Mental and Armor Break) wins more often
   (71 %) in a quarter of the time (47 battle turns). That matches the sources, which open the fight on
   his Ice weakness (research §5 row 5, Shiva's Diamond Dust); it means the guide should teach the
   weakness window beside the disc puzzle, not instead of it.

None of this asks for a boss change. If Bailey wants a shorter or harder fight, the levers are
player-side and already sourced: B6 (the ring), the line-up (B2), and what the guide teaches.

## Checks

- `npx tsc --noEmit`: clean.
- Full `npx vitest run --testTimeout=60000` on the branch before this change: **367 / 367 files,
  6,981 tests pass** (5 skipped, 1 todo). The extended bench alone after it: 4 / 4 pass; the numbers
  of the rows the earlier bench printed (wins, mean turns, glows, Ultimas, disc turns, -ga share, HP
  left) are byte-identical to commit 64ef56d6's table.
