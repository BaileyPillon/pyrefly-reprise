# FF7 engine bench: the canon party against Guard Scorpion, 200 seeds

Written 2026-09-27 on branch `ff7-engine` (FF7 engine part 2, plan steps 4 and 5 of
`docs/plans/ff7-guard-scorpion-architecture.md`). **Game case: FF7 only.** Nothing here
was tuned: every number the engine uses comes from `research/ff7-battle-core.md` ("core")
and `research/ff7-guard-scorpion.md` ("gs") with its tag, and the estimates are listed at
the end. The research says the canon fight is easy; the bench agrees for a player who
follows its lesson, and shows why a player who ignores the tail loses.

## Method

- **Engine:** `src/battle/ff7/` driven headless by `runFf7Battle` (`simulate.ts`): every
  menu is answered at zero decision time, and the clock runs only through the
  `'waiting'` path, so no menu is ever open while time passes.
- **Party:** the canon preset `src/data/ff7/builds/sector1-reactor.ts`: Cloud Lv 7 and
  Barret Lv 6 at the median stats (gs §8.2, an estimate), Buster Sword with Lightning and
  Ice, Gatling Gun with Restore, Bronze Bangles, both front row (staging §5), Limit gauges
  at 0, 3 Potions and 1 Phoenix Down (gs §8.5, estimates).
- **Boss:** `src/data/ff7/enemies/guard-scorpion.ts` and the script in
  `src/battle/ff7/ai/guard-scorpion.ts` (gs §2 to §5).
- **Seeds 1 to 200**, Battle Speed 128, Recommended mode (FF7's default, core §2.5), then
  the same seeds in Active and Wait.
- **Policies** (ours, modelling players; their thresholds are our choices, not game data):
  - *sensible*, the research's lesson (gs §1): revive a KO'd ally; heal anyone under 50%;
    while the tail is up never target the boss (heal anyone under 75%, else Defend); while
    it is down use a full Limit, Cloud casts Bolt while MP lasts, Barret attacks.
  - *naive*: Attack (or the Limit when full) every turn, tail or no tail; never heals.
  - *literal hint*: takes Cloud's "Attack while it's tail's up!" (gs §7) as advice:
    attacks only while the tail is up, Defends while it is down, heals and revives like
    the sensible player.
- **Reproduce:** `node tools/ff7-bench.mjs` (about 2 s; `--seeds=N` for another count).
  "Battle turns" counts every `turn-start`, the boss's two waiting turns included.
  Seconds use the 30 ticks per second estimate (core §2.2, `[unsourced]`).

## Results (Recommended, seeds 1 to 200)

| Policy | Wins | Battle turns: median (range) | Party turns (median) | Time: median ticks (~s) | Attacks into the raised tail: mean per battle; battles with any | Tail Laser damage taken (mean) | Limits used (mean) | Party KOs (mean) | Party HP left on a win (mean, of 633) |
|---|---|---|---|---|---|---|---|---|---|
| sensible | **200/200 (100%)** | 30 (26 to 31) | 20 | 3,814 (~127 s) | 0.00; 0/200 | 0 | 0.07 | 0.00 | 524 |
| naive | **0/200 (0%)** | 20 (18 to 29) | 13 | 2,554 (~85 s) | 4.38; 200/200 | 609 | 2.17 | 2.00 | n/a |
| literal hint | **107/200 (53.5%)** | 112 (89 to 133) | 75 | 15,147 (~505 s) | 17.60; 200/200 | 2,361 | 9.96 | 1.72 | 139 |

Active and Wait give the **same outcome and turn count on all 200 seeds** for every
policy. That is expected at zero decision time: the modes differ only in when the clock
runs under an open menu and in the grace pause, and the grace pause holds every Turn
Timer alike, so it never reorders turns (it adds ticks, not turns).

## Reading it

**Sensible (the canon fight is easy).** 200 wins, no KO, and about 83% of the party's HP
left. The length matches the research: gs §9 puts a tail-down round (one Bolt, one
Barret Attack) at about 126 damage, so 800 HP is 6 to 7 such rounds, one full cycle plus
a few turns; the bench's 20 party turns are 10 each, of which about 3 each are spent
waiting while the tail is up (gs §6). No attack ever goes into the raised tail.

**Naive loses every seed, and that is the research's own arithmetic, not a tuning
problem.** Checked before touching anything:

1. The tail rises on the boss's 5th turn whatever its HP (gs §5.3). By then the naive
   party has hit it for about 320: the boss's HP at the first Raise Tail has median 478
   (373 to 515).
2. While the tail is up the party still gets about three turns each (gs §5.4); each
   Attack does 17 to 22 against Def 255 and sets off one Tail Laser, 72 to 77 on **both**
   members (gs §4 and §9: "about a quarter of their Max HP").
3. Four lasers are 288 to 308 to each of 316 and 317 Max HP, on top of the one or two
   Rifles or Scorpion Tails taken before the tail rose. The bench's median is 4 lasers in
   the first raised tail; 184 of the 200 naive runs end in a wipe during it and the other 16 later,
   with the boss at a median 307 HP (136 to 394) when the party falls
   (a one-off probe over the same seeds, not part of `tools/ff7-bench.mjs`).

So a player who never heals and attacks into the tail cannot win; the research says the
same in words ("heal and wait while the tail is up", gs §1). The engine matches the
sources, so nothing was changed.

**The literal reading of the hint is a coin toss.** Attacking only while the tail is up
wins 53.5%, takes about four times as long, and eats 17.6 lasers per battle on average.
That is the misleading-hint note of gs §7.2 in numbers, and it may matter to Bailey's
presentation decision on the hint's wording (gs §7.3).

**Critical hits** are in every run (Cloud 2%, Barret 2%, the boss 1%, core §3.3); Lucky
Evade (Cloud 3%, Barret 4%) shows as the occasional Tail Laser that hits only one member.

## Estimates behind these numbers (our estimates, said as such to Bailey)

- The preset stats, the starting Limit gauges at 0 and the inventory (gs §8.2, §8.5).
- 30 ticks per second (core §2.2) and the grace-pause length `[SpeedValue / 6]` ticks
  (core §2.5 Q2): they change seconds, never outcomes here.
- The queue model (core §2.6), the draw order of the rolls (`hit.ts`, `perform.ts`,
  `atb.ts`), the counter firing on a miss (gs G6) and the retarget when Search Scope's
  target fell (gs G7): unreachable or neutral in these runs except the draw order,
  which only picks which seed gets which roll.
- The policies themselves.
