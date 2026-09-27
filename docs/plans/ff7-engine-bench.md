# FF7 engine bench: the canon party against Guard Scorpion, 200 seeds

Written 2026-09-27 on branch `ff7-engine` (FF7 engine part 2, plan steps 4 and 5 of
`docs/plans/ff7-guard-scorpion-architecture.md`). **Game case: FF7 only.** Nothing here
was tuned: every number the engine uses comes from `research/ff7-battle-core.md` ("core")
and `research/ff7-guard-scorpion.md` ("gs") with its tag, and the estimates are listed at
the end. The research says the canon fight is easy; the bench agrees for a player who
follows its lesson, and shows why a player who ignores the tail loses.

## Method

- **Engine:** `src/battle/ff7/` driven headless by `runFf7Battle` (`simulate.ts`). The first
  two tables answer every menu at zero decision time with no animation time, so the clock
  runs only through the `'waiting'` path; the third table adds the timed player model.
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
| literal hint | **106/200 (53.0%)** | 112 (89 to 133) | 75 | 15,147 (~505 s) | 17.59; 200/200 | 2,360 | 9.96 | 1.73 | 139 |

Re-run 2026-09-27 after the follow-ups (FOLLOW-UP in `docs/handoff/ff7-engine.md`). Sensible
and naive are unchanged to the digit. Literal hint moved from 107 to 106 wins (17.60 to 17.59
lasers, 1.72 to 1.73 KOs): Defend now ends when the member's Time gauge fills (manual p. 18),
not when their next action executes, so a boss turn that lands between the fill and the
member's command meets no Defend. The literal-hint player Defends every tail-down turn, so it
is the one policy that sees this.

At zero decision time Active and Wait give the **same outcome and turn count on all 200
seeds** for every policy. **That is true by construction and shows nothing about Active**:
with no animation time and no menu time, the only difference left is the grace pause, which
holds every Turn Timer alike, so it adds ticks, never turns. The timed model below is where
the modes differ.

## Results with time for animations and menus (all three modes, seeds 1 to 200)

The engine now takes the presenter's animation bracket (`setAnimating`), and the headless
runner can spend real time on each action's animation and on each menu. **The player model
is ours, not FF7's:** every action animates for 1.5 s, and every menu stays 0.5 s at the top
command list, then 1.5 s in a sub-menu or targeting. What each mode does with that time is
the source's (core §2.5, manual p. 29): Active runs every gauge through animations and menus;
Recommended stops for animations and runs through menus; Wait stops for animations and for
sub-menus and targeting, and runs at the top list.

| Policy | Mode | Wins | Battle turns (median) | Boss share of turns (mean) | Attacks into the raised tail (mean) | Party KOs (mean) | Clock time: median ticks (~s) |
|---|---|---|---|---|---|---|---|
| sensible | Active | 200/200 | 28 | 0.368 | 0.00 | 0.00 | 3,688 (~123 s) |
| sensible | Recommended | 200/200 | 28 | 0.360 | 0.00 | 0.00 | 4,216 (~141 s) |
| sensible | Wait | 200/200 | 30 | 0.333 | 0.00 | 0.00 | 4,112 (~137 s) |
| naive | Active | 0/200 | 19 | 0.371 | 4.39 | 2.00 | 2,446 (~82 s) |
| naive | Recommended | 0/200 | 19 | 0.368 | 4.26 | 2.00 | 2,938 (~98 s) |
| naive | Wait | 0/200 | 20 | 0.339 | 4.38 | 2.00 | 2,726 (~91 s) |
| literal hint | Active | 74/200 | 113 | 0.375 | 17.55 | 2.17 | 16,017 (~534 s) |
| literal hint | Recommended | 66/200 | 111 | 0.366 | 17.30 | 2.34 | 17,177 (~573 s) |
| literal hint | Wait | 106/200 | 112 | 0.338 | 17.59 | 1.72 | 16,123 (~537 s) |

Reading it honestly:

- **The modes now differ, in the direction the sources give.** The boss's share of all turns
  is about one third under Wait (the zero-time share), and rises under Recommended and more
  under Active, because the boss's gauge keeps filling while the player reads a menu
  (Recommended, Active) and while an animation plays (Active).
- **The difference is small for the sensible and naive players.** Sensible still wins every
  seed in every mode; naive still loses every seed. The fight's outcome is decided by the
  tail rule, not by the clock.
- **The literal-hint player feels it most**: 106 wins under Wait, 66 under Recommended, 74 under
  Active. Active winning more than Recommended here is not "Active is easier": with a policy
  this close to a coin toss, the extra boss turns land at different moments in each mode
  (Active has no grace pause, and its turns interleave differently), and a gap of 8 wins in 200 is
  about one binomial standard deviation (about 7 at a 35% win rate). The boss-share column is the steadier measure, and it orders the modes
  Wait < Recommended < Active, the wiki's difficulty order (core §2.5).
- **Clock time is the engine's ticks, not wall time.** Held animation time (Recommended, Wait)
  adds no ticks, so a Recommended battle can show more ticks than an Active one only because
  of its grace pauses and the menu time it runs through; a player's wall-clock time is longer
  in every mode than the ticks shown.

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
wins 53%, takes about four times as long, and eats 17.6 lasers per battle on average.
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
- The policies themselves, and the timed player model (1.5 s per animation, 0.5 s + 1.5 s per
  menu).
- Defend lasting until the Time gauge fills is now sourced (manual p. 18; wiki, core §5.2), no
  longer an estimate.
