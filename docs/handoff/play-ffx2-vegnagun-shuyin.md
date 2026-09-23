# Chapter 5 — Vegnagun → Shuyin: the winning line

**Key:** `ffx2-vegnagun-shuyin` · **Research:** `research/ffx2-vegnagun-shuyin.md`
**Status:** winnable. 4/4 required seeds win and complete all five links;
**580 of 600 contiguous chains (96.7%)** on the shipped build and the shipped
`intendedStrategy`, with Darkness's HP cost and the Bulwarks' retaliation both
switched on.

| Window | Chains won |
|---|---|
| seeds 1–200 | 194 (97.0%) |
| seeds 201–400 | 192 (96.0%) |
| seeds 1001–1200 | 194 (97.0%) |

| Seed | Outcome | Turns | Links |
|---|---|---|---|
| 1 | victory | 245 | 5 |
| 7 | victory | 307 | 5 |
| 42 | victory | 290 | 5 |
| 20260916 | victory | 355 | 5 |

## Read this first: the previous 92.5% was measured with the fight switched off

Two of this chapter's defining mechanics were written by the data layer and read
by no one, so the line that won 92.5% last round was playing a different, easier
encounter:

* **Darkness never paid its HP cost.** §6.4 prices it at "12.5% (1/8) of user's
  max HP" `[verified: 2 sources]` and §7.1 calls that the ability's entire
  downside. `extra.hpCostPercent` existed in exactly one ability definition and
  nothing in `src/battle/ffx2/**` read it. Unpaid: **65,442–83,430 HP per
  chain**, over ten full party bars.
* **The Bulwarks never retaliated, the Nodes never spun, Odi Et Amo never
  fired.** `AiScript.onDamaged` was declared in `internal.ts`, implemented by
  three scripts, and called by nothing. §3.3 calls the retaliation "the fight's
  whole identity"; censused over 20 Body fights and 338 Darkness casts, it
  occurred **zero** times and the party took literally zero damage in the whole
  Body fight.

Charging the cost and wiring the hook dropped the old line from 38/40 to
**23/40**. Everything below is the line rebuilt against the real fight.

---

## The line, in plain language

§7.1's canonical clear, `[verified: 2 sources]`: **two Dark Knights spamming
Darkness, one White Mage healing.** Rikku and Paine attack on every turn they
can afford; Yuna never attacks.

Darkness is the whole offence because it ignores Defense (Shuyin's Def 132 and
the Right Redoubt's Def 133 stop mattering), is all-enemy, is long range, and
costs **HP rather than MP**. That last clause used to be a pure upside; now that
the engine charges it, it is the axis the chapter turns on — a Dark Knight
spends about a twelfth of the party's whole HP bar every time she casts, and the
healer has to find it.

Everything else exists because the party is **losing the action race** — the
Tail runs Agility 115 and Shuyin 133 against a Dark Knight's 41, the worst in
the game (§3.1, §3.5, §6.2, §7.4). Haste is not the answer: ffx2-combat-core
§1.2 puts it at **×1.05** `[verified: 2 sources]`, not the ×2 the FF Wiki spell
table claims. So each action has to be worth more, not more frequent.

The rules, each with the measurement that set it (chains won per window, the
rest of the file held fixed):

1. **Black Sky before Darkness — 511/600 → 557/600.** §6.4 lists Black Sky in
   the Dark Knight's Arcana and both girls have it learned in the shipped build.
   80 MP, ten hits, all-enemies, scaling off **Strength** (`special-magic`,
   ffx2-combat-core §3.8). It is the only action in the chapter that turns the
   attackers' 224/229 MP — a pool they spend on nothing else across five
   battles — into damage, and it costs **no HP** at the moment HP is the binding
   resource. ~2,750 a cast against Darkness's ~1,950.
2. **At the Leg, every swing is single-target and aimed at the Leg — 557/600 →
   577/600.** §7.2: "Ignore the Nodes' 300,000 HP; **all damage goes to the Leg
   (18,220)**". §3.2 is why the all-enemy rows are wrong there: the Nodes'
   colour machine advances "on (own turn resolves) **OR** (hit by any attack)",
   and its GREEN face casts Cura, Regen, Shell and Protect **on the Leg**. A
   sprayed Leg fight takes ten Curas and eight Regens and outlives fourteen
   Darknesses. The Leg's Def is **13**, so a plain Attack gives up almost
   nothing to armour and leaves the Nodes asleep.
3. **Revive strongest-first: Life → Full-Life → Mega Phoenix → Phoenix Down —
   158/200 → 179/200, the single largest rule in the file.** A Phoenix Down
   stands a girl up on **25%** (ffx2-combat-core §5.5) and one Tail Beam is
   **31.25%** (§3.1), so a Phoenix Down revive hands the boss a free kill. On
   the losing seeds that is exactly what happened: twenty-five consecutive
   Phoenix Downs at Shuyin and four Darknesses in the whole fight. Life is 50%
   for 18 MP, Full-Life 100% for 60, Mega Phoenix 50% to every downed girl.
4. **Only the White Mage heals anyone but herself.** §7.1's clear has three
   slots: two attackers and *one* healer. Letting the Dark Knights throw the
   emergency party heal too measured **66/200** against 150/200 — the bag is
   gone by the Leg.
5. **Two girls one hit from death → spend a Megalixir — 135/200 → 150/200.**
   "One hit from death" is a Tail Beam plus a Noli Me Tangere: 5/16 of max HP
   plus 1,323 (§3.1). A Mega-Potion's flat 2,000 each does not clear that line
   for a 5,862-HP Dark Knight. §6.8 stocks four Megalixirs for exactly that turn.
6. **Cure Petrify / Berserk / Stop / Slow / Silence / Confuse before healing.**
   The Leg's `Action1` is one-in-three Berserk / Break / Slow (§3.2, §5.2), the
   Left Bulwark adds Break, Bio and a 9-count Doom (§3.3), Mors Certa lands 80%
   Silence + Darkness + Poison party-wide (§3.4). §6.8 stocks 10–20 Remedies and
   calls them "Mors Certa insurance".
7. **Buff only while at least two girls are missing it — 154/200 → 158/200.**
   The Bulwarks' and Redoubts' Dispels are single-target, and chasing every one
   put eight curtain actions inside one Body fight. Party-wide strips (Odi Et
   Amo) still clear the quorum and still get answered.
8. **Protect first at the Leg and at Shuyin, Shell first elsewhere, nothing at
   the Tail — 162/200 → 166/200 for the Leg row alone.** §7.2's Leg opener is
   literally "Buff to **Protect** + Haste on everyone" and §3.2 says why: the
   Nodes' RED face is Missile and Dies Irae, both physical. §7.2's Shuyin opener
   is "Light Curtain (Protect) on all three + Lunar Curtain (Shell) on all
   three" — §1.2's magic-vs-physical inversion. The Tail row is "Buffs are
   near-useless… raw max HP is the only defence".
9. **A Dark Knight below 5/16 of her bar drinks instead of casting.** 5/16 is
   one Tail Beam (§3.1); below it the next enemy action kills her outright and
   the party pays two more turns for a revive and a heal. Swept over 600 chains
   on the finished line: 0.25 → 569, **0.3125 → 580**, 0.35 → 574, 0.40 → 573,
   0.45 → 419 (at 0.45 she stops being an attacker and the Head's cannon clock
   runs out).
10. **Heal harder where survival is the problem, less where the clock is.**
    `LINK_CRITICAL` is §7.2's per-battle table as a number — the Tail and Leg
    are survival problems, the Head opens with "**Time limit**" and "don't
    over-invest", and §4.2's cannon clock ends the run whether or not the party
    is healthy. One band for all five links measured 150/200 against 152/200.

The tactic keeps Yuna as the healer even though §7.2 says not to ("in the
original PS2 version he hunts Yuna"), because the shipped build has no second
healer. It pays for that by getting Protect onto her before the first Terror of
Zanarkand, which turns 1,710–1,935 into 855–968 and leaves her standing.

**No build change this round.** The one slot moved last round (Paine's Black
Belt → Hyper Wrist, §6.7's "typical" attacker loadout) stands; nothing else in
`src/data/ffx2/builds/farplane.ts` was touched.

---

## Defects found and fixed

Full write-ups in `docs/CONTRACT-CHANGES.md`, key `ffx2-vegnagun-shuyin`. All
three are FFX-2-wide, so **Chapter 4 must re-measure Bahamut against them.** The
first two make the game *harder*.

| # | Where | What was wrong |
|---|---|---|
| 6 | `src/battle/ffx2/resolve.ts`, `targeting.ts` | **Darkness's HP cost was never charged.** `extra.hpCostPercent` written by one data definition, read by nobody. Now deducted beside the MP cost, emitted as a `damage` event on the caster, and the row is greyed out with "Not enough HP" when she cannot pay (§6.4: "fails if the user cannot pay it"), so the cost can never KO her. |
| 7 | `src/battle/ffx2/engine.ts` | **`AiScript.onDamaged` was declared and never called.** §3.3's Core attack log (the Bulwark retaliation), §3.2's Node colour machine advancing on a hit, and §3.4's Odi Et Amo counter were all inert. Wired in `afterAction`, driven off the finished action's event drafts, so each damaged enemy is notified once with the action's total. A caster's own HP cost is excluded. |
| 8 | `src/battle/ffx2/resolve.ts` | **Every MP restorative in X-2 was inert.** `extra.restoresMp` (Ether 100, Turbo Ether 500) and `extra.alsoRestoresMp` (Elixir and Megalixir, "up to 9999 HP **and 999 MP**", ffx2-combat-core §5.5) were written and never read, so the six Turbo Ethers §6.8 stocks could not refill a single spell. |

Rows 1–5 (the Item menu, the sixteenth-value revives, the chain-registering
heal, inert accessories, Darkness typed `physical`) are the previous round's and
are documented in the same section.

Three shipped regression tests now pin rows 6, 7 and 8 by running the engine and
reading the event log — see the last `describe` block in
`tests/unit/strategy-ffx2-vegnagun-shuyin.test.ts`.

---

## Where the remaining 3.3% goes

15 of the 20 losses are at the **Leg**: the Green Nodes' Cura and Regen give the
Leg HP back faster than a wounded party can take it off, and the party arrives
from the Tail with no menu between links. The other five are one apiece at the
Body and Shuyin and three at the Tail — action-race variance, not a wrong line.

## Known gaps, not this chapter's to fix

* **Reflect is not implemented in the FFX-2 engine** — no bounce logic anywhere
  in `resolve.ts`. §7.2's Leg row names it as *the* Leg answer ("cast Reflect on
  your party too, and the Yellow Node's spells bounce back at the Leg"), which
  is most of why the Leg is still the least reliable link. (§3.2 makes the Leg
  itself Reflect-immune, so only the party half of that advice is live anyway.)
  *2026-09-21:* the guide no longer repeats that line and the research carries a
  CORRECTION note; by `ffx2-combat-core.md`'s verified Reflect rule most of the
  party half is dead too. See `fix-ffx2-vegnagun-facts.md`.
* **Garment Grid `autoAbilityTags` are dropped** by `adapters.ts` `toBonus`:
  only `statBonus`, wait-down and Break-Damage-Limit survive. Yuna wears
  **Tempered Will**, whose two gates are Double HP and Double MP (§6.6), and
  both are inert — her grid currently does nothing at all.
* **`Mega Phoenix`'s `revivesAtMostTargets: 2`** (§5.5: "revive up to two
  allies") is still unread. It never binds in practice: the battle ends when the
  third girl falls, so at most two can be down at once.
* **An `all-enemies` action re-hits an earlier target** when a target dies
  mid-action: `targetForHit` indexes into a `living` list it recomputes per hit,
  so Darkness's third hit lands on the boss again once a part falls. It favours
  the player, so it is recorded rather than changed.
* **Accessories are stats only** (`accessories.ts`): Ribbon's immunities and
  Adamantite's constant Protect/Shell are statuses and are not modelled. §6.7's
  "one Speed Bracer if the player found Via Infinito 40" would therefore do
  nothing today — and, at Haste ×1.05, close to nothing even if it did.

## Harness

`critic/scratch/ch5-r2-bench.test.ts` (multi-window chain win rate, exports
`runChain`), `ch5-r2-autopsy.test.ts` (per-link action census, damage
attribution and bag levels), `ch5-r2-tail.test.ts` (per-action HP/HP-of-boss
trace for one link), `ch5-r2-chain.test.ts` (damage bands against the research's
sourced ranges, and whether the party ever gets chain-locked),
`ch5-r2-turns.test.ts` (turn counts for the four required seeds). Plus last
round's `ch5-probe / ch5-log / ch5-cmds / ch5-bench`.

Run with `npx vitest run --config critic/scratch/vitest.scratch.ts <file>`;
`WINDOWS`, `COUNT`, `SEEDS`, `SEED` and `GROUP` are the knobs.

Shipped acceptance test: `tests/unit/strategy-ffx2-vegnagun-shuyin.test.ts` —
the four seeds, a forty-chain regression window (bar 36, measured 40/40), a
negative test that keeps §7.2's Node trap punished, and the three
mechanics-are-live tests above.
