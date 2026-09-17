# Playing Chapter 3 — Braska's Final Aeon → the possessed aeons → Yu Yevon

Research: `research/ffx-bfa-yu-yevon.md`. Tactic:
`src/engine/tactics/braskas-final-aeon.ts`. Acceptance test:
`tests/unit/strategy-braskas-final-aeon.test.ts`. Party build:
`src/data/ffx/builds/dreams-end.ts`.

Seven battles, no menu between them: Braska's Final Aeon (60,000, then a fresh
120,000) → one battle per aeon Yuna owns (Valefor, Ifrit, Ixion, Shiva, Bahamut)
→ Yu Yevon. **Two Yu Pagodas stand in every one of them.** The party *starts*
forced to Tidus / Yuna / Auron and carries its HP, MP, buffs, Overdrive gauges
and item counts straight through.

**Measured: 916 wins in 1,000 contiguous seeds (91.6 %)** — 180, 183, 183, 187
and 183 out of 200 on the windows from seeds 1, 201, 401, 601 and 801. The four
canonical seeds (1, 7, 42, 20260916) win 4/4. Every win walks all seven links.
**Every loss is link 1** — from the possessed aeons onward the party carries the
fayth's permanent Auto-Life and those fights cannot be lost (§2.3).

---

## The headline: this round gave the Strength back

The previous round made this chapter winnable by multiplying the party's
Strength by 1.5. Because `power(STR) = floor(STR³ / 32) + 30`, that is a **×2.6
to ×2.9 on the damage** — arithmetically the same lever as halving the boss's HP
pool, applied to the player's side. **It is reverted in full.** Every offensive
stat in the build is §4.1 as published, with one exception that has its own
published number: Yuna's Strength 20 → **28**, because §4.4
`[verified: 2 sources]` singles out *"Yuna's Strength at least 28"* as this
encounter's threshold.

What replaced it is three things the chapter had never used, all of them in the
research.

### 1. The bench — four guardians who had never taken a turn

§1 `[verified: 2 sources]`: the party is *"forced to Tidus / Yuna / Auron;
**reserve swapping works normally**."* `research/ffx-combat-core.md` §1.7, also
`[verified: 2 sources]`: the incoming reserve member *"**takes the turn that is
happening right now** — the turn is not consumed by the swap"*, and *"any
reserve member may be swapped in at any point; **all seven can therefore
participate**."* `execute.ts` implements exactly that (`rank: 0`,
`handOffTo: inId`, the incoming member inheriting the outgoing one's CTB).

**A Switch is free.** The chapter had been fighting 180,000 HP with three of its
seven characters while the other four sat on the bench with their HP bars, their
MP pools, their Overdrive gauges and their whole ability lists untouched.

**Lulu is the one who changes the arithmetic**, because §4.2's recommendation
for this preset grants her Firaga/Thundaga by name and the boss's Magic Defense
is the column nobody was attacking:

| Actor | vs the raw boss | vs a Broken boss |
|---|---:|---:|
| Tidus, Attack | 687 | 1,611 (Armor Break) |
| Yuna, Attack | 491 | 1,153 (Armor Break) |
| Auron, Attack | 1,396 | 3,273 (Armor Break) |
| **Lulu, Firaga** | **1,905** | **4,473** (Mental Break) |
| **Lulu, Doublecast** | **3,810** | **8,946** |

The rotation, in the order it has to happen — a Switch takes the outgoing
member's Haste off the field with them, so the sequence is load-bearing:

1. The battle opens Tidus / Yuna / Auron. **Hastega** lands on all three, both
   pillars are **Slowed**, the **Cheer ladder** runs once.
2. With nothing left that only Tidus can do, **Tidus hands his seat to Lulu**,
   who arrives un-Hasted.
3. Which is a Tidus job — so **Auron hands *his* seat to Tidus**, and the field
   is Tidus / Yuna / Lulu for exactly as long as it takes to Haste her.
4. Tidus hands back to Auron and the fight settles into **Auron / Yuna / Lulu**,
   with Tidus stepping in for a Talk charge or a re-Hastega and straight back
   out.

Two rules make that survive contact. First, **one hand-over per turn**
(`handedOverAlready`): a free Switch plus a predicate that reads the field can
reverse its own decision the instant it acts on it, and it did — Tidus hands to
Lulu, Lulu arrives un-Hasted so the same predicate hands straight back, 60,000
decisions and not one turn taken. Second, **the member who yields is never the
member the job is about**: Auron switching himself out to fetch Tidus takes the
problem off the field with him, and measured, he came back un-Hasted and stayed
that way for a thousand ticks. Lulu yields instead and Auron gets Hasted.

### 2. Doublecast, which the engine had never implemented

§4.2's recommendation grants *"Doublecast + Firaga/Thundaga"*; `dreams-end`
gives Lulu both; the ability record carries `extra.castsTwoBlackMagicSpells`;
`AbilityCommand.wrappedId` has been in the shared contract since it was written,
documented as *"Doublecast / Copycat wrapper"* — and **nothing in the engine read
any of it**. The row resolved a `formula: 'none'`, `power: 0` ability and ate the
turn.

`src/battle/ffx/execute.ts resolveDoublecast` is the reader. Two casts for one
rank-3 turn, both paying their own MP, and **two targets if you give it two** —
which is FFX's own "a spell and a target, twice", and the reason a black mage
can take both Yu Pagodas off the board in the same turn rather than killing one
and leaving a lone survivor.

Her MP is the other half of it: 300 MP is eighteen Firagas and the chapter needs
sixty. §4.4's Inside Sin chest table `[verified: 2 sources]` lists **Infinity —
One MP Cost, Sensor** and says those chests *"are part of the intended
loadout"*; the build already took `sensor` from that row for Kimahri's spear, so
`one-mp-cost` goes into the **empty fourth slot** of Lulu's weapon. Nothing is
deleted.

### 3. The Zombie exploit — §1.6's own published answer to the pillars

> *"BFA resists Zombie at 50 but is not immune. While Zombie, the next Power
> Wave deals **1,500 damage** instead of healing — and then cleanses it.
> **Zombiestrike on a weapon re-applies it repeatedly.**"* — §1.6,
> `[verified: 2 sources]`

The engine already inverts it (`formulas.ts`: a `heals` action on a Zombie stays
positive). There was simply no Zombie on the field. **Zombiestrike goes into
Auron's empty fourth weapon slot**, cited to the sentence that names it; the
rider is chance 100 against his resistance 50, so about one swing in two, and
Power Wave's own strip list takes it off again — which is exactly why §1.6 names
a *weapon* rather than a spell.

Measured: the Yu Pagodas now deal about **17,500 damage to their own boss** per
battle.

---

## "Kill both or neither" — and this line picks **neither**

This is the single biggest decision in the chapter and four separate
implementations disagreed about it, so here is the arithmetic.

**What a standing pair costs**, per 21 ticks, un-Slowed: two Power Waves, each
1,500 of healing (fixed, no variance), each +20 % into his Overdrive gauge (the
one *verified* gauge number, §1.6), each stripping **all four Breaks**.

**What killing them costs**: a Pagoda returns after 63 ticks with
`5,000 + the killing blow's excess`, so a cycle is **10,000 at the floor and
12,000–15,000 in practice**, for ever. Against the §4.1 preset that is
138,000–187,000 damage a battle — more than half of everything the party
produces — to deny about 150,000 of healing. It is near break-even on HP and it
buys the Break window, which is real. And every time it was measured against
leaving them up, it lost:

| Line | Boss damage dealt, link 1 | Outcome |
|---|---:|---|
| Kill the pair every cycle (Tidus + Auron) | 136,000 | 0/30 |
| Kill the pair with the mage's two-target Doublecast | 145,000 | 0/30 |
| **Slow both, never touch them** | **185,000** | 0/30 at §4.1's HP, **92 %** at the tuned HP |

**Slow is what makes "neither" affordable.** §1.4 `[verified: 2 sources]` leaves
a Yu Pagoda immune to everything except Slow (resist 50) and Delay. Slow is
chance 100 against that 50, duration 254 — permanent for the battle — it costs
12 of Tidus's MP, and `hp.ts restorePart` does not clear statuses, so it even
survives a Pagoda that dies to something else. Two or three casts halve the
healing, the gauge feed and the strip rate for the whole fight. Delay Buster is
the other half of §1.4's note and it is **not** worth it here: rank 8, so it
costs Tidus 28 ticks to deny a 21-tick Pagoda turn.

And because nothing is ever killed, the lone-survivor state §1.4 warns about —
Curse (Poison **and** Sleep **and** Silence **and** Dark, all at chance 100) or
Osmose for 100 % of a target's maximum MP — simply never happens. The tactic
still carries the emergency that closes it, as a safety net.

The price, paid knowingly: with the pillars up, a Power Wave strips the Breaks
roughly every 21 ticks, so **Armor Break and Power Break almost never hold**.
Auron spends his turns on **Mental Break** (a flat ×2.35 on the party's biggest
hit) and on the **Zombie swing**, which deals his damage anyway.

---

## The rest of the line, link 1

* **Hastega up and kept up**, single-target Haste for one revived member,
  because Tidus has 140 MP and re-casting Hastega after every KO ran him dry.
* **The Cheer ladder exactly once**, gated on *every* living member being short.
  A KO clears the stacks; the looser gate re-ran the whole five-cast ladder
  after every revive, and in a measured losing tail Tidus spent five consecutive
  turns Cheering a Lulu who was killed again between the second and the third.
* **The two Stamina Tonics** — one off the top, one the moment the rotation puts
  a new face on the field. That second one is the black mage's.
* **An aeon out when his gauge crosses 55**, Grand Summon when it is ready and a
  **plain Summon when it is not**. §1.6's branch table checks "an Aeon is on the
  field" *first*, so a standing summon turns a party-wide Ultimate Jecht Shot
  into a single-target Jecht Bomber at the aeon, and no party member is
  targetable at all while it stands. "Grand Summon or nothing" put two aeons on
  the field in a whole battle; the roster is five.
* **Talk as the backstop**, for the charges the aeons do not cover, submitted as
  `{ kind: 'trigger', id: 'talk' }` because the menu row is a marker.
* **Cure the Zombie on a party member before healing them** — a `heals` action
  on a Zombie resolves as damage.
* **Heal floors are high** (0.5 emergency, 0.7 routine, 0.99 idle). The party is
  not losing a sustain race — Yuna out-heals the incoming two and a half times
  over — it is losing to burst, and a member at 45 % of a 6,000-HP bar is a
  member the next Overdrive kills.

## Yu Yevon is not a damage race

He counters **every player-side action that damages him with a 9,999 Curaga**
(§3.3, §3.4.1). The party's best single action is a few thousand, so every swing
is a net heal: the acceptance test pins a party that swings at him finishing
above 80 % of a 99,999-HP shell after thousands of swings.

1. **The Candle of Life first.** Doom kills him in three of his own turns, deals
   no damage so it never arms the counter, and the `#210` Power Wave strips
   Poison, Zombie and Reflect — not Doom.
2. **Then the pillars stay suppressed** (§3.5's "keep both Pagodas
   incapacitated"). Here they really are killed: nothing else on the field is
   worth a turn, and Gravija's 75 %-of-current cannot outrun 4,500 of healing
   between his turns.
3. **And nobody hits him** until his own Gravija has taken him under 900.

---

## What deviates from the research, and what still needs a ruling

Two changes remain, both of them §4.1's own invitation, and **neither adds a
point of damage**. §4.1 labels its whole stat block `[estimate]`, performs
exactly one sanity check — *"Ultimate Jecht Shot ... would **KO Yuna and Lulu
outright**"* — and then says *"the preset **should be tuned so the fight is
winnable** only with the Trigger Command, Protect, and disciplined healing."*

1. **The HP column**, scaled so no member is removed outright by the top of
   §1.5's published Ultimate Jecht Shot band (5,040 vs Defense 10), then clamped
   to the shared stat band `tests/unit/data-ffx-builds.test.ts` holds every
   chapter to (`hp ≤ 6000`, `maxHp ≤ 6500`).
2. **Auron's Agility 22 → 29**, the anomaly inside §4.1's own table: the party's
   melee anchor has the lowest Agility of all seven, below Lulu's and Yuna's 26.
   Agility is linear in turns taken and changes no damage number.

| Build | 40 seeds |
|---|---:|
| §4.1 as published | **0 %** |
| + Yuna STR 28, HP column tuned, Auron AGI 22 | 75.0 % |
| + Auron AGI 26 | 82.5 % |
| **+ Auron AGI 29 (shipped)** | **92.5 %** |

**No enemy HP, stat, ability, counter, AI branch or rotation was changed in the
party's favour anywhere in this chapter**, in this round or the two before it.

**Stoneproof: the previous verifier's blocker is closed by applying §4.4, not by
documenting it.** §4.4 `[verified: 2 sources]` asks for *"exactly one or two
Stoneproof pieces"* so the Jecht Beam → shatter chain is *"a real, solvable
decision rather than a coin flip"*. The build had inherited **seven** from
`research/ffx-seymour-flux.md` §7.7.2 loadout C, which made Petrify land zero
times in a full chain. It now carries **two**, on **Yuna and Lulu** — the healer
and the damage, the two who hold a seat from the first tick to the last. The
cross-document conflict with §7.7.2 is real and still wants a research ruling;
this chapter's own `[verified: 2 sources]` section wins for this chapter's own
build.

**Still open, for other owners:**

* **Lulu's Overdrive is a dead row in every chapter but this one.** `dreams-end`
  lists the generic `'fury'` menu marker, which `execute.ts` refuses outright;
  the data file flags this itself as a cross-agent gap. This tactic re-shapes it
  into one of the 19 tier-specific ids, the same way it re-shapes Talk — but the
  builds/UI fix is still owed. (Measured, firing it is not worth a turn *here*:
  every `<spell>-fury` record is `targeting: 'random-enemy'` at a fraction of the
  spell's power — five casts of 583–607, two into a Yu Pagoda — against 3,810
  for the Doublecast it displaced.)
* **The enemy Overdrive gauge is still not a first-class engine resource.** It
  lives on `ctx.state.flags['bfa.gauge']` because `setup.ts` builds an
  `overdrive` block for members and aeons and for nobody else, so the HUD cannot
  draw it.
* **Mid-chain statuses do not carry.** `setupForNextLink` carries HP, MP,
  Overdrive gauges and item counts, but not statuses, so the party re-buys
  Hastega, Protect and Cheer at every link. `BattleSetup.carriedStatuses` exists
  in the contract and nothing writes it.
* **The possessed-aeon gauntlet is a walkover**: links 2–6 finish in 1–14 turns.
  §2.2 makes each a live copy of the player's own aeon (Luck forced to 1) and
  §2.3 makes them unlosable anyway, so it is faithful — but if it reads badly,
  the lever is the aeon stat band in `dreams-end.ts`, not the encounter.
* **A sleeper nobody hits and nobody cures is still asleep for ever, at source.**
  `state.ts canAct` drops a sleeper out of the CTB queue and `ticks.ts
  onTurnEnd` is the only caller of `tickDurationStatuses`, so a skipped actor
  never ticks its own durations.

## Bench harness

`critic/scratch/bfa-r3-*.ts`:

```
BMODE=shipped FROM=1 N=200 OUT=b.out \
  npx vitest run --config critic/scratch/vitest.scratch.config.ts \
  critic/scratch/bfa-r3-bench.test.ts && cat critic/scratch/b.out
```

Also `-probe` (per-ability damage and the party's action budget), `-uptime`
(status uptime, actions per member, KOs), `-trace` / `-tail` (turn-by-turn),
`-sweep` and `-stat` (win rate against one scaled stat), `-seeds` (the four
canonical seeds with a per-link trail).
